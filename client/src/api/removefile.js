import api, { authHeader } from "./client";

export const removeFiles = async (token, public_id) => {
  return api.post("/removeimages", { public_id }, authHeader(token));
};
