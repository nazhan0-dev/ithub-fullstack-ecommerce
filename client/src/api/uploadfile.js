import api, { authHeader } from "./client";

export const uploadFiles = async (token, image) => {
  return api.post("/images", { image }, authHeader(token));
};
