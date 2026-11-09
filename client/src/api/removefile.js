import api from "./client";

export const removeFiles = (public_id) => api.post("/removeimages", { public_id });
