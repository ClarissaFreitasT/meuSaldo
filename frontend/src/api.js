import axios from "axios";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("meusaldo_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((r) => r, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("meusaldo_token");
    localStorage.removeItem("meusaldo_usuario");
  }
  return Promise.reject(error);
});
export function mensagemErro(error) { return error.response?.data?.erro || "Não foi possível concluir. Confira a conexão com a API."; }
