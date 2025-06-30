// src/api/client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const setToken = (token: string) =>
  (api.defaults.headers.common["Authorization"] = `Bearer ${token}`);
