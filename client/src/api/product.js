import api, { authHeader } from "./client";

export const createProduct = async (token, form) => {
  return api.post("/product", form, authHeader(token));
};
export const listProduct = async (count = 20) => {
  return api.get("/products/" + count);
};
export const readProduct = async (token, id) => {
  return api.get("/product/" + id, authHeader(token));
};
export const deleteProduct = async (token, id) => {
  return api.delete("/product/" + id, authHeader(token));
};
export const updateProduct = async (token, id, form) => {
  return api.put("/product/" + id, form, authHeader(token));
};
export const searchFilters = async (arg) => {
  return api.post("/search/filters", arg);
};
export const listProductBy = async (sort, order, limit) => {
  return api.post("/productby", { sort, order, limit });
};
