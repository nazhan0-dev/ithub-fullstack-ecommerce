import api from "./client";

export const login = (form) => api.post("/login", form);
export const logoutUser = () => api.post("/logout");
export const registerUser = (form) => api.post("/register", form);
export const currentUser = () => api.post("/current-user");
export const currentAdmin = () => api.post("/current-admin");
