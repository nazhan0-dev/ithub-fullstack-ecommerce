import api from "./client";

export const uploadFiles = (image) => api.post("/images", { image });
