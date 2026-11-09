import api from "./client";

export const createUserCart = (cart) => api.post("/user/cart", cart);
export const listUserCart = () => api.get("/user/cart");
export const saveAddress = (address) => api.post("/user/address", { address });
export const saveOrder = (payload) => api.post("/user/order", payload);
export const getOrders = () => api.get("/user/order");

// แจ้งเตือน
export const getNotifications = (config) => api.get("/user/notifications", config);
export const readNotifications = (id) => api.post("/user/notifications/read", id ? { id } : {});
export const getRestockAlert = (productId) => api.get("/user/restock-alert/" + productId);
export const setRestockAlert = (productId, subscribe) =>
  api.post("/user/restock-alert/" + productId, { subscribe });

// รายการโปรด (กดหัวใจ)
export const getWishlist = () => api.get("/user/wishlist");
export const setWishlist = (productId, liked) => api.post("/user/wishlist/" + productId, { liked });
