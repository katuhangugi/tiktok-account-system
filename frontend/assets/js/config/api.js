/**
 * API Configuration File
 * Contains all API endpoints and request configurations
 */

export const API_CONFIG = {
    BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080/api',
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            LOGOUT: '/auth/logout',
            PROFILE: '/auth/me',
            REFRESH: '/auth/refresh',
            CHANGE_PASSWORD: '/auth/change-password'
        },
        USERS: {
            BASE: '/users',
            CREATE: '/users',
            BY_ID: (id) => `/users/${id}`,
            BY_ROLE: (role) => `/users/by-role/${role}`,
            MANAGED: '/users/managed',
            ASSIGN_GROUP: '/users/assign-group'
        },
        GROUPS: {
            BASE: '/groups',
            CREATE: '/groups',
            BY_ID: (id) => `/groups/${id}`,
            MANAGED: '/groups/managed',
            ASSIGN_MANAGER: '/groups/assign-manager',
            MEMBERS: (id) => `/groups/${id}/users`
        },
        ACCOUNTS: {
            BASE: '/accounts',
            CREATE: '/accounts',
            BY_ID: (id) => `/accounts/${id}`,
            BY_GROUP: (groupId) => `/accounts/by-group/${groupId}`,
            TRANSFER: '/accounts/transfer-group',
            IMPORT: '/accounts/import',
            EXPORT: '/accounts/export',
            RECENT: '/accounts/recent'
        },
        ANALYTICS: {
            DASHBOARD: '/analytics/dashboard',
            ACCOUNT_TRENDS: (id) => `/analytics/${id}/trends`,
            COMPARE: '/analytics/compare',
            REFRESH: '/analytics/refresh',
            GROUP_STATS: (id) => `/analytics/group/${id}`,
            SUMMARY: '/analytics/summary'
        },
        ADMIN: {
            STATS: '/admin/stats',
            USERS: '/admin/users',
            GROUPS: '/admin/groups',
            LOGS: '/admin/logs',
            SETTINGS: '/admin/settings',
            CLEAR_CACHE: '/admin/clear-cache',
            PURGE_DATA: '/admin/purge-old-data',
            BACKUP: '/admin/create-backup',
            EXPORT_DATA: '/admin/export-data'
        },
        TIKTOK: {
            FETCH: '/tiktok/fetch',
            VALIDATE: '/tiktok/validate',
            STATUS: '/tiktok/status'
        }
    },
    ERROR_CODES: {
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        VALIDATION_ERROR: 422,
        SERVER_ERROR: 500,
        MAINTENANCE: 503
    },
    TIMEOUT: 30000, // 30 seconds
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000 // 1 second
};

/**
 * Creates a full API URL from endpoint
 * @param {string} endpoint 
 * @returns {string}
 */
export const getApiUrl = (endpoint) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

/**
 * Gets default headers with authorization if available
 * @returns {Object}
 */
export const getHeaders = () => {
    const headers = { ...API_CONFIG.DEFAULT_HEADERS };
    const token = localStorage.getItem('token');
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};