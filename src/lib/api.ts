import { ApiResponse } from "@/types";

// Base API configuration
export const API_BASE_URL = typeof window !== "undefined" 
  ? `${window.location.origin}/api/v1`
  : `${process.env.PUBLIC_APP_URL || "http://localhost:3000"}/api/v1`;

// Auth is stored in httpOnly cookies and attached automatically by the
// browser for same-origin requests, so no Authorization header is needed.
export const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  return headers;
};

// Generic API error handler
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Refresh access token using the stored refresh token.
// Shared promise prevents concurrent 401s from racing the rotation.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // The refresh token lives in an httpOnly cookie, so the request only
      // needs to include credentials; no token is readable by JavaScript.
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) return false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();
      if (!data || !data.data) return false;

      if (data.data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.data.user));
      }

      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: "include",
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    };

    let response = await fetch(url, config);

    // Access token may be stale (15min TTL) right after a page load.
    // Refresh once and retry the request before giving up.
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retryConfig: RequestInit = {
          ...options,
          credentials: "include",
          headers: {
            ...getAuthHeaders(),
            ...options.headers,
          },
        };
        response = await fetch(url, retryConfig);
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0
    );
  }
}

// HTTP method helpers
export const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: "GET" });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put: <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, { method: "DELETE" });
  },
};

// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export const withPagination = (params: PaginationParams) => {
  const cleanParams: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cleanParams[key] = String(value);
    }
  });
  
  return cleanParams;
};

// Retry mechanism for failed requests
export async function retryRequest<T>(
  requestFn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// Request cache for GET requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function cachedGet<T>(
  endpoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>,
  cacheDuration: number = CACHE_DURATION
): Promise<ApiResponse<T>> {
  const cacheKey = `${endpoint}?${new URLSearchParams(params || {}).toString()}`;
  const cached = requestCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return cached.data;
  }
  
  const response = await api.get<T>(endpoint, params);
  requestCache.set(cacheKey, { data: response, timestamp: Date.now() });
  
  return response;
}

// Clear cache helper
export const clearCache = (pattern?: string) => {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of requestCache.keys()) {
      if (regex.test(key)) {
        requestCache.delete(key);
      }
    }
  } else {
    requestCache.clear();
  }
};

// File upload helper
export async function uploadFile(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ApiResponse<any>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new ApiError('Invalid JSON response', xhr.status));
        }
      } else {
        reject(new ApiError(`Upload failed: ${xhr.statusText}`, xhr.status));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError('Upload failed', 0));
    });

    xhr.open('POST', `${API_BASE_URL}${endpoint}`);
    xhr.send(formData);
  });
}