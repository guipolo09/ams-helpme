import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post(
        `${import.meta.env.VITE_API_URL || "/api"}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .then((res) => {
        const { user, accessToken } = res.data;
        useAuthStore.getState().setAuth(user, accessToken);
        return accessToken as string;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const url = original?.url ?? "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/refresh");

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      const token = await tryRefresh();
      if (token) {
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${token}`,
        };
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);
