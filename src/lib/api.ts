import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let preloadingPromise: Promise<any> | null = null;

// Request interceptor to attach token
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Workaround for backend Mongoose model registration issue (TemplateCategory)
    if (config.url && (config.url.includes('/projects') || config.url === 'projects') && typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (token && !preloadingPromise) {
        preloadingPromise = axios
          .get(`${process.env.NEXT_PUBLIC_API_URL}/template-categories`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => {});
      }
      if (preloadingPromise) {
        await preloadingPromise;
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
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem('token', token);
        Cookies.set('token', token, { expires: 7 }); // Sync cookie

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, logout user
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          Cookies.remove('token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
