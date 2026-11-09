import api from "./client";

export const getOrdersAdmin = () => api.get("/admin/orders");
export const changeOrderStatus = (orderId, orderStatus) => api.put("/admin/order-status", { orderId, orderStatus });
export const getListAllUsers = () => api.get("/users");
export const changeUserStatus = (value) => api.post("/change-status", value);
export const changeUserRole = (value) => api.post("/change-role", value);
