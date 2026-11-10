import api from "./client";

export const listBanners = () => api.get("/banners");
export const listAllBanners = () => api.get("/admin/banners");
export const createBanner = (form) => api.post("/admin/banners", form);
export const updateBanner = (id, form) => api.put(`/admin/banners/${id}`, form);
export const deleteBanner = (id) => api.delete(`/admin/banners/${id}`);
