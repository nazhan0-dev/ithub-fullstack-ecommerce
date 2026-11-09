import api, { authHeader } from "./client";

export const createCategory = async (token, form) => {
  return api.post("/category", form, authHeader(token));
};
export const listCategory = async () => {
  return api.get("/category");
};
export const removeCategory = async (token, id) => {
  return api.delete("/category/" + id, authHeader(token));
};
