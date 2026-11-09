import axios from "axios";

// ตั้ง VITE_API_URL ใน client/.env เพื่อเปลี่ยนที่อยู่ server ได้โดยไม่ต้องแก้โค้ด
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

export const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export default api;
