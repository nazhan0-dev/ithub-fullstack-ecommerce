import api from "./client";

export const createUserCart = (cart) => api.post("/user/cart", cart);
export const listUserCart = () => api.get("/user/cart");
export const saveAddress = (address) => api.post("/user/address", { address });
export const saveOrder = (payload) => api.post("/user/order", payload);
export const getOrders = () => api.get("/user/order");
