import api from "./client";

export const createCategory = (form) => api.post("/category", form);
export const listCategory = () => api.get("/category");
export const removeCategory = (id) => api.delete("/category/" + id);
