import api, { authHeader } from "./client";

export const getOrdersAdmin = async (token) => {
  return api.get("/admin/orders", authHeader(token));
};
export const changeOrderStatus = async (token, orderId, orderStatus) => {
  return api.put("/admin/order-status", { orderId, orderStatus }, authHeader(token));
};
export const getListAllUsers = async (token) => {
  return api.get("/users", authHeader(token));
};
export const changeUserStatus = async (token, value) => {
  return api.post("/change-status", value, authHeader(token));
};
export const changeUserRole = async (token, value) => {
  return api.post("/change-role", value, authHeader(token));
};
