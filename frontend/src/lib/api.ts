import axios from 'axios';

const UNREACHABLE =
  "Can't reach the API. Run npm run dev in the backend folder and keep it on port 5000 (or match BACKEND_PORT to your Vite proxy).";

/** Prefer server `error` string from JSON body over generic Axios messages. */
export function getApiErrorMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const netCode = e.code;
    if (
      netCode === "ECONNREFUSED" ||
      netCode === "ECONNRESET" ||
      netCode === "ETIMEDOUT" ||
      netCode === "ERR_NETWORK"
    ) {
      return UNREACHABLE;
    }

    if (!e.response) {
      return UNREACHABLE;
    }

    const { status, data } = e.response;
    if (data && typeof data === "object" && "error" in data) {
      const msg = (data as { error: unknown }).error;
      if (typeof msg === "string" && msg.trim() !== "") return msg;
    }

    // Vite’s proxy often returns 500/502 when the upstream backend is down (ECONNREFUSED).
    if (status === 502 || status === 503 || status === 504) {
      return UNREACHABLE;
    }
    if (status === 500 && (!data || typeof data !== "object" || !("error" in data))) {
      return UNREACHABLE;
    }
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

// When using Vite dev proxy, keep this as a relative path (e.g. "/api/v1").
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    // Token will be automatically included in httpOnly cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access, but ignore for auth checks to prevent infinite redirect loops
      const url = error.config?.url || '';
      const isAuthCheck = url.includes('/auth/me') || url.includes('/auth/login');
      
      if (!isAuthCheck && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
