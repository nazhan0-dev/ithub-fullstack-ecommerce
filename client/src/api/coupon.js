import api from "./client";

// admin
export const listCoupons = () => api.get("/admin/coupons");
export const createCoupon = (form) => api.post("/admin/coupons", form);
export const updateCoupon = (id, form) => api.put(`/admin/coupons/${id}`, form);
export const deleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);

// ศูนย์เก็บคูปอง / กระเป๋าคูปอง
export const listAvailableCoupons = () => api.get("/coupons");
export const listCouponCenter = (config) => api.get("/user/coupons/center", config); // login แล้ว: บอกว่าเก็บแล้วหรือยัง
export const collectCoupon = (id) => api.post(`/user/coupons/${id}/collect`);
export const myCoupons = (subtotal) => api.get("/user/coupons", { params: subtotal != null ? { subtotal } : {} });
