/**
 * Application Constants
 * Contains all static values and configuration
 */

export const APP_CONSTANTS = {
    // Application Info
    APP_NAME: 'TikTok Account Management System',
    VERSION: '1.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    
    // User Roles
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        MANAGER: 'manager',
        OPERATOR: 'operator'
    },
    
    // Permission Levels
    PERMISSIONS: {
        SUPER_ADMIN: [
            'users:create',
            'users:read',
            'users:update',
            'users:delete',
            'groups:create',
            'groups:read',
            'groups:update',
            'groups:delete',
            'accounts:create',
            'accounts:read',
            'accounts:update',
            'accounts:delete',
            'analytics:read',
            'admin:access'
        ],
        MANAGER: [
            'users:create:operator',
            'users:read:managed',
            'users:update:managed',
            'groups:read:managed',
            'groups:update:managed',
            'accounts:create',
            'accounts:read:managed',
            'accounts:update:managed',
            'analytics:read:managed'
        ],
        OPERATOR: [
            'accounts:read:assigned',
            'analytics:read:assigned'
        ]
    },
    
    // Account Statuses
    ACCOUNT_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        SUSPENDED: 'suspended',
        BANNED: 'banned'
    },
    
    // Analytics Time Ranges
    TIME_RANGES: {
        DAY: 'day',
        WEEK: 'week',
        MONTH: 'month',
        QUARTER: 'quarter',
        YEAR: 'year'
    },
    
    // UI Constants
    UI: {
        MAX_TABLE_ROWS: 25,
        DEFAULT_PAGE_SIZE: 10,
        PAGE_SIZES: [10, 25, 50, 100],
        CHART_COLORS: [
            '#4e73df', // Primary
            '#1cc88a', // Success
            '#36b9cc', // Info
            '#f6c23e', // Warning
            '#e74a3b', // Danger
            '#858796', // Secondary
            '#5a5c69'  // Dark
        ],
        THEMES: {
            LIGHT: 'light',
            DARK: 'dark',
            SYSTEM: 'system'
        }
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Network error. Please check your connection.',
        SERVER_ERROR: 'Server error. Please try again later.',
        MAINTENANCE: 'System under maintenance. Please try again later.',
        UNAUTHORIZED: 'You need to login to access this resource.',
        FORBIDDEN: 'You do not have permission to perform this action.',
        NOT_FOUND: 'The requested resource was not found.',
        TIMEOUT: 'Request timed out. Please try again.',
        VALIDATION: 'Please fix the validation errors and try again.'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'token',
        USER_DATA: 'user',
        THEME: 'theme',
        LANGUAGE: 'lang',
        LAST_ACTIVE: 'last_active'
    },
    
    // Event Names
    EVENTS: {
        AUTH_CHANGE: 'auth-change',
        THEME_CHANGE: 'theme-change',
        LANGUAGE_CHANGE: 'language-change',
        NOTIFICATION: 'notification'
    },
    
    // Default Values
    DEFAULTS: {
        AVATAR: '/assets/images/default-avatar.png',
        LOGO: '/assets/images/logo.png',
        TIMEZONE: 'UTC',
        DATE_FORMAT: 'YYYY-MM-DD',
        TIME_FORMAT: 'HH:mm:ss'
    }
};

/**
 * Helper function to check if user has permission
 * @param {string} role 
 * @param {string} permission 
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
    return APP_CONSTANTS.PERMISSIONS[role.toUpperCase()]?.includes(permission) || false;
};

/**
 * Gets readable role name
 * @param {string} role 
 * @returns {string}
 */
export const getRoleName = (role) => {
    const names = {
        [APP_CONSTANTS.ROLES.SUPER_ADMIN]: 'Super Admin',
        [APP_CONSTANTS.ROLES.MANAGER]: 'Manager',
        [APP_CONSTANTS.ROLES.OPERATOR]: 'Operator'
    };
    return names[role] || role;
};

/**
 * Gets readable status name
 * @param {string} status 
 * @returns {string}
 */
export const getStatusName = (status) => {
    const names = {
        [APP_CONSTANTS.ACCOUNT_STATUS.ACTIVE]: 'Active',
        [APP_CONSTANTS.ACCOUNT_STATUS.INACTIVE]: 'Inactive',
        [APP_CONSTANTS.ACCOUNT_STATUS.SUSPENDED]: 'Suspended',
        [APP_CONSTANTS.ACCOUNT_STATUS.BANNED]: 'Banned'
    };
    return names[status] || status;
};