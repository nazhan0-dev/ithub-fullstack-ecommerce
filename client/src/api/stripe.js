import api from "./client";

export const payment = () => api.post("/user/create-payment-intent");
