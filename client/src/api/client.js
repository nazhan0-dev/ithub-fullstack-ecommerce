import axios from "axios";

// ตั้ง VITE_API_URL ใน client/.env เพื่อเปลี่ยนที่อยู่ server ได้โดยไม่ต้องแก้โค้ด
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  // ส่ง httpOnly cookie (token) ไปกับทุก request — หน้าเว็บไม่ต้องเก็บ token เอง
  withCredentials: true,
});

// เมื่อ server ตอบ 401 (cookie หมดอายุ/ไม่มี) ให้ล้างสถานะ login ฝั่งหน้าเว็บ
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) onUnauthorized();
    return Promise.reject(error);
  },
);

// request เบื้องหลังที่หน้าเว็บเช็กเอง (เช่น โหลดแจ้งเตือนทุก 1 นาที)
// server จะไม่นับว่าผู้ใช้กำลังใช้งาน -> ไม่ต่ออายุการ login ให้
export const BACKGROUND = { headers: { "X-Background": "1" } };

export default api;
