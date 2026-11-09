import api, { authHeader } from "./client";

export const payment = async (token) => {
  return api.post("/user/create-payment-intent", {}, authHeader(token));
};
