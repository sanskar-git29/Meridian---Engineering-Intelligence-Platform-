import { AxiosError, InternalAxiosRequestConfig } from "axios";
import { api } from "./axios";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryableRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;

    const isRefreshRequest =
      originalRequest.url === "/api/auth/refresh";

    // Don't intercept:
    // - non-401 errors
    // - already retried requests
    // - the refresh request itself
    if (
      !isUnauthorized ||
      originalRequest._retry ||
      isRefreshRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    /*
     * If another request is already refreshing the token,
     * wait for that same refresh operation.
     */
    if (!refreshPromise) {
      refreshPromise = api
        .post("/api/auth/refresh")
        .then(() => {
          console.log("Access token refreshed");
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      await refreshPromise;

      // Refresh succeeded → retry original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed → authentication is no longer valid
      return Promise.reject(refreshError);
    }
  },
);





