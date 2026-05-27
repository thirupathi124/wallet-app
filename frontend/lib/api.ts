import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from localStorage on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 (skip public auth routes — let login/register show errors)
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestPath = originalRequest.url?.replace(originalRequest.baseURL ?? '', '') ?? '';
    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => requestPath.includes(path));

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRequest
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),
};

// ─── Wallet ──────────────────────────────────────────────────────────────────

export const walletApi = {
  getBalance: () => api.get('/wallet/balance').then((r) => r.data),

  addMoney: (amount: number) =>
    api.post('/wallet/add-money', { amount }).then((r) => r.data),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  transfer: (data: { receiverEmail: string; amount: number }) =>
    api.post('/transfer', data).then((r) => r.data),

  getHistory: () => api.get('/transactions').then((r) => r.data),
};

// ─── Error helper ─────────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
