import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { login, logoutUser } from "../api/auth";
import { setUnauthorizedHandler } from "../api/client";
import { listCategory } from "../api/category";
import { listProduct, searchFilters } from "../api/product";

const ecomStore = (set, get) => ({
  // token อยู่ใน httpOnly cookie (JavaScript อ่านไม่ได้) — เก็บแค่ข้อมูลผู้ใช้ไว้แสดงผล
  user: null,
  categories: [],
  products: [],
  carts: [],

  logout: async () => {
    try {
      await logoutUser(); // ให้ server ลบ cookie
    } catch (error) {
      console.log(error);
    }
    get().clearSession();
  },
  // ล้างสถานะ login ฝั่งหน้าเว็บ (ใช้ตอน logout และตอน cookie หมดอายุ)
  clearSession: () => set({ user: null, carts: [] }),
  actionAddtoCart: (product) => {
    const carts = get().carts;
    const exists = carts.find((item) => item.id === product.id);
    if (exists) {
      // สินค้าเดิมอยู่ในตะกร้าแล้ว -> เพิ่มจำนวนแทนการเพิ่มรายการซ้ำ
      set({
        carts: carts.map((item) =>
          item.id === product.id ? { ...item, count: item.count + 1 } : item,
        ),
      });
    } else {
      set({ carts: [...carts, { ...product, count: 1 }] });
    }
  },
  actionUpdateQuantity: (productId, newQuantity) => {
    set((state) => ({
      carts: state.carts.map((item) =>
        item.id === productId
          ? { ...item, count: Math.max(1, newQuantity) }
          : item,
      ),
    }));
  },
  actionRemoveProduct: (productId) => {
    set((state) => ({
      carts: state.carts.filter((item) => item.id !== productId),
    }));
  },
  getTotalPrice: () => {
    return get().carts.reduce((total, item) => {
      return total + item.price * item.count;
    }, 0);
  },
  actionLogin: async (form) => {
    const res = await login(form);
    set({ user: res.data.payload });
    return res;
  },
  getCategory: async () => {
    try {
      const res = await listCategory();
      set({ categories: res.data });
    } catch (error) {
      console.log(error);
    }
  },
  getProduct: async (count) => {
    try {
      const res = await listProduct(count);
      set({ products: res.data });
    } catch (error) {
      console.log(error);
    }
  },
  actionSearchFilters: async (arg) => {
    try {
      const res = await searchFilters(arg);
      set({ products: res.data });
    } catch (error) {
      console.log(error);
    }
  },
  clearCart: () => set({ carts: [] }),
});

const usePersist = {
  name: "ecom-store",
  storage: createJSONStorage(() => localStorage),
  // เก็บเฉพาะข้อมูลที่ต้องจำข้ามการรีเฟรช
  partialize: (state) => ({
    user: state.user,
    carts: state.carts,
  }),
  // version 1: เลิกเก็บ token ใน localStorage (ลบของเก่าทิ้ง)
  version: 1,
  migrate: (persisted) => ({ user: persisted?.user ?? null, carts: persisted?.carts ?? [] }),
};
const useEcomStore = create(persist(ecomStore, usePersist));

// server ตอบ 401 = ไม่ได้ login แล้ว (cookie หมดอายุ) -> ล้างข้อมูลผู้ใช้
setUnauthorizedHandler(() => {
  if (useEcomStore.getState().user) useEcomStore.getState().clearSession();
});

export default useEcomStore;
