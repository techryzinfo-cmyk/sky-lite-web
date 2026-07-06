import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let preloadingPromise: Promise<any> | null = null;

// Request interceptor to attach token
api.interceptors.request.use(
  async (config) => {

    if (typeof window !== 'undefined') {

      const isSuperAdminApi =
        config.url?.startsWith('/superadmin');

      const token = isSuperAdminApi
        ? sessionStorage.getItem('saToken')
        : localStorage.getItem('token') || Cookies.get('token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

// Super Admin doesn't use refresh token
const isSuperAdmin = !!localStorage.getItem('saToken');

if (!refreshToken) {
  if (isSuperAdmin) {
    return Promise.reject(error);
  }

  throw new Error('No refresh token');
}

        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem('token', token);
        Cookies.set('token', token, { expires: 7 }); // Sync cookie

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed — clear regular user session
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          Cookies.remove('token');
          // Don't redirect if already on /login or if a superadmin session is active
          const onLoginPage = window.location.pathname === '/login';
          const hasSaToken = !!localStorage.getItem('saToken');
          if (!onLoginPage && !hasSaToken) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
// trigger reload
