import {
    getAccessToken,
    removeAuthTokens,
    setAuthTokens,
} from "@/lib/authCookies";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import toast from "react-hot-toast";
import { refreshTokenApi } from "@/api/auth";

// Type definitions
interface ApiRequestConfig extends AxiosRequestConfig {
    headers?: Record<string, string>;
    _retry?: boolean;
}

// Tạo instance axios
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        accept: "*/*",
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Thêm token vào header nếu có
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as ApiRequestConfig;

        // Kiểm tra lỗi 401 và request chưa bị retry
        if (error.response?.status === 401 && !originalRequest?._retry) {
            originalRequest._retry = true;

            try {
                const response = await refreshTokenApi();

                if (response.code === 0 && response.content) {
                    const { accessToken, refreshToken } = response.content;

                    setAuthTokens(accessToken, refreshToken);

                    // Gắn token mới vào request gốc
                    originalRequest.headers = {
                        ...originalRequest.headers,
                        Authorization: `Bearer ${accessToken}`,
                    };

                    return api(originalRequest);
                } else {
                    throw new Error("Refresh token không hợp lệ");
                }
            } catch (refreshError) {
                // Only show toast if tokens still exist (not during logout)
                if (getAccessToken()) {
                    toast.error(
                        "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
                    );
                }
                removeAuthTokens();

                if (typeof window !== "undefined") {
                    window.location.href = "/sign-in";
                }

                return Promise.reject(refreshError);
            }
        }

        // Nếu không phải lỗi 401 hoặc đã retry rồi
        let errorMessage = "Có lỗi xảy ra";
        if (error.response?.data && typeof error.response.data === "object") {
            errorMessage = (error.response.data as any).message || errorMessage;
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.warn(
            "Interceptor: Lỗi không phải do token hoặc đã retry:",
            errorMessage
        );

        toast.error(errorMessage);
        return Promise.reject(error);
    }
);

// Enhanced API methods with custom headers support
export const apiMethods = {
    get: <T>(url: string, config?: ApiRequestConfig) => {
        const token = getAccessToken();
        const headers = {
            ...config?.headers,
            ...(token && { Authorization: `Bearer ${token}` }),
        };
        return api.get<T>(url, { ...config, headers });
    },

    post: <T>(url: string, data?: unknown, config?: ApiRequestConfig) => {
        const token = getAccessToken();
        const headers = {
            ...config?.headers,
            ...(token && { Authorization: `Bearer ${token}` }),
        };
        return api.post<T>(url, data, { ...config, headers });
    },

    put: <T>(url: string, data?: unknown, config?: ApiRequestConfig) => {
        const token = getAccessToken();
        const headers = {
            ...config?.headers,
            ...(token && { Authorization: `Bearer ${token}` }),
        };
        return api.put<T>(url, data, { ...config, headers });
    },

    delete: <T>(url: string, config?: ApiRequestConfig) => {
        const token = getAccessToken();
        const headers = {
            ...config?.headers,
            ...(token && { Authorization: `Bearer ${token}` }),
        };
        return api.delete<T>(url, { ...config, headers });
    },

    patch: <T>(url: string, data?: unknown, config?: ApiRequestConfig) => {
        const token = getAccessToken();
        const headers = {
            ...config?.headers,
            ...(token && { Authorization: `Bearer ${token}` }),
        };
        return api.patch<T>(url, data, { ...config, headers });
    },
};

// Helper function to create API call with organization and workspace headers
export const createApiCall = (
    organizationId?: string,
    workspaceId?: string
) => {
    const headers: Record<string, string> = {};
    if (organizationId) headers.organizationId = organizationId;
    if (workspaceId) headers.workspaceId = workspaceId;

    return {
        get: <T>(url: string, config?: ApiRequestConfig) =>
            apiMethods.get<T>(url, {
                ...config,
                headers: { ...headers, ...config?.headers },
            }),
        post: <T>(url: string, data?: unknown, config?: ApiRequestConfig) =>
            apiMethods.post<T>(url, data, {
                ...config,
                headers: { ...headers, ...config?.headers },
            }),
        put: <T>(url: string, data?: unknown, config?: ApiRequestConfig) =>
            apiMethods.put<T>(url, data, {
                ...config,
                headers: { ...headers, ...config?.headers },
            }),
        delete: <T>(url: string, data?: unknown, config?: ApiRequestConfig) =>
            apiMethods.delete<T>(url, {
                ...config,
                headers: { ...headers, ...config?.headers },
            }),
        patch: <T>(url: string, data?: unknown, config?: ApiRequestConfig) =>
            apiMethods.patch<T>(url, data, {
                ...config,
                headers: { ...headers, ...config?.headers },
            }),
    };
};

export default api;
