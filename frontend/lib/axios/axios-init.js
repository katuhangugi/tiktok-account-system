/**
 * Axios Initialization and Custom Configuration
 */

import axios from 'axios';
import { API_CONFIG } from '../../config/api';
import { APP_CONSTANTS } from '../../config/constants';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.DEFAULT_HEADERS
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp
        config.headers['X-Request-Timestamp'] = Date.now();
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        // You can modify successful responses here
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Handle token refresh on 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
                if (!refreshToken) throw error;
                
                const response = await axios.post(
                    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
                    { refreshToken }
                );
                
                const { token } = response.data;
                localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN, token);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, logout the user
                if (refreshError.response?.status === 401) {
                    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN);
                    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
                    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.USER_DATA);
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        
        // Handle other errors
        if (error.response) {
            switch (error.response.status) {
                case 403:
                    error.message = APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN;
                    break;
                case 404:
                    error.message = APP_CONSTANTS.ERROR_MESSAGES.NOT_FOUND;
                    break;
                case 500:
                    error.message = APP_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR;
                    break;
                case 503:
                    error.message = APP_CONSTANTS.ERROR_MESSAGES.MAINTENANCE;
                    break;
                default:
                    error.message = error.response.data?.message || APP_CONSTANTS.ERROR_MESSAGES.NETWORK_ERROR;
            }
        } else if (error.request) {
            error.message = API_CONFIG.TIMEOUT
                ? APP_CONSTANTS.ERROR_MESSAGES.TIMEOUT
                : APP_CONSTANTS.ERROR_MESSAGES.NETWORK_ERROR;
        }
        
        return Promise.reject(error);
    }
);

// Add retry mechanism
apiClient.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    
    if (!config || !config.retryCount) {
        config.retryCount = API_CONFIG.RETRY_COUNT;
    }
    
    const delay = (retryCount) => new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.RETRY_DELAY * (API_CONFIG.RETRY_COUNT - retryCount + 1))
    );
    
    if (config.retryCount > 0) {
        config.retryCount--;
        await delay(config.retryCount);
        return apiClient(config);
    }
    
    return Promise.reject(error);
});

// Custom API methods
export const api = {
    get: (url, config = {}) => apiClient.get(url, config),
    post: (url, data, config = {}) => apiClient.post(url, data, config),
    put: (url, data, config = {}) => apiClient.put(url, data, config),
    patch: (url, data, config = {}) => apiClient.patch(url, data, config),
    delete: (url, config = {}) => apiClient.delete(url, config),
    request: (config) => apiClient.request(config),
    cancelToken: axios.CancelToken
};

// File upload helper
export const uploadFile = (url, file, fieldName = 'file', extraData = {}) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    for (const key in extraData) {
        formData.append(key, extraData[key]);
    }
    
    return apiClient.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// Progress tracking for uploads/downloads
export const withProgress = (config) => {
    return {
        ...config,
        onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (config.onProgress) {
                config.onProgress(percentCompleted);
            }
        },
        onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (config.onProgress) {
                config.onProgress(percentCompleted);
            }
        }
    };
};