import api, { authHeader } from "./client";

export const createUserCart = async (token, cart) => {
  return api.post("/user/cart", cart, authHeader(token));
};
export const listUserCart = async (token) => {
  return api.get("/user/cart", authHeader(token));
};
export const saveAddress = async (token, address) => {
  return api.post("/user/address", { address }, authHeader(token));
};
export const saveOrder = async (token, payload) => {
  return api.post("/user/order", payload, authHeader(token));
};
export const getOrders = async (token) => {
  return api.get("/user/order", authHeader(token));
};
