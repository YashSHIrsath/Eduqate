import axios from 'axios';

// Create Axios client instance
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000', // Port for FastAPI backend
  withCredentials: true, // Send httpOnly cookies automatically on all requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Access token stored STRICTLY in memory for XSS protection
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => {
  return inMemoryAccessToken;
};

// Request Interceptor: Attach bearer access token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-renew session via Refresh Token Rotation on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and the request was not already a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the refresh request itself fails with 401, clear token and fail
      if (originalRequest.url === '/api/v1/auth/refresh') {
        setAccessToken(null);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request token rotation from backend. Cookie is sent automatically via withCredentials.
        const response = await axios.post('http://localhost:8000/api/v1/auth/refresh', {}, {
          withCredentials: true,
        });

        const { access_token } = response.data;
        setAccessToken(access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        processQueue(null, access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);
        // Force state cleanup and redirect to login
        window.dispatchEvent(new Event('auth-session-expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
