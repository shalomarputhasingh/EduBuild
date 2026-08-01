import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Read the token per request rather than caching it on `defaults`, so signing
// out cannot leave a stale Authorization header on the shared instance.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * A 401 means the token is missing, expired, or was signed with a rotated
 * secret. Clear it so the app falls back to the signed-out state instead of
 * leaving the user clicking a UI that will keep failing.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = Boolean(localStorage.getItem('token'));
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if we were actually signed in. A failed sign-in attempt
      // also returns 401 and should stay on the form to show its message.
      const onAuthPage = ['/signin', '/signup'].includes(window.location.pathname);
      if (hadToken && !onAuthPage) {
        window.location.assign('/signin?expired=1');
      }
    }
    return Promise.reject(error);
  }
);

/** Extracts a displayable message from an axios error. */
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback;

/** Field-keyed validation errors from the backend, or null. */
export const fieldErrors = (error) => error?.response?.data?.errors || null;

export default api;
