import api, { authHeader } from "./client";

export const login = async (form) => {
  return api.post("/login", form);
};
export const registerUser = async (form) => {
  return api.post("/register", form);
};
export const currentUser = async (token) => {
  return api.post("/current-user", {}, authHeader(token));
};
export const currentAdmin = async (token) => {
  return api.post("/current-admin", {}, authHeader(token));
};
