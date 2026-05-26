// apps/frontend/src/lib/api.ts
import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";

// Ensure this matches your backend EXACTLY (http://localhost:4060/api)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4060/api",
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);
export default api;
