import api from "./client";

export const createProduct = (form) => api.post("/product", form);
export const listProduct = (count = 20) => api.get("/products/" + count);
export const readProduct = (id) => api.get("/product/" + id);
export const deleteProduct = (id) => api.delete("/product/" + id);
export const updateProduct = (id, form) => api.put("/product/" + id, form);
export const searchFilters = (arg) => api.post("/search/filters", arg);
export const listProductBy = (sort, order, limit) => api.post("/productby", { sort, order, limit });
