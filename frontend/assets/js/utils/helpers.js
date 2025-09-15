import { APP_CONSTANTS } from '../config/constants';

/**
 * General helper functions
 */
export class Helpers {
    /**
     * Formats a number with commas
     * @param {number} num 
     * @returns {string}
     */
    static formatNumber(num) {
        return num?.toLocaleString() || '0';
    }

    /**
     * Formats a date string
     * @param {string} dateString 
     * @param {string} format 
     * @returns {string}
     */
    static formatDate(dateString, format = 'YYYY-MM-DD') {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date)) return dateString;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }

    /**
     * Calculates percentage change
     * @param {number} oldValue 
     * @param {number} newValue 
     * @returns {number}
     */
    static calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) return newValue === 0 ? 0 : 100;
        return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
    }

    /**
     * Gets trend indicator class
     * @param {number} value 
     * @returns {string}
     */
    static getTrendClass(value) {
        return value > 0 ? 'trend-up' : value < 0 ? 'trend-down' : 'trend-neutral';
    }

    /**
     * Debounces a function
     * @param {Function} func 
     * @param {number} delay 
     * @returns {Function}
     */
    static debounce(func, delay = 300) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Truncates text with ellipsis
     * @param {string} text 
     * @param {number} maxLength 
     * @returns {string}
     */
    static truncate(text, maxLength = 50) {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }

    /**
     * Generates a unique ID
     * @returns {string}
     */
    static generateId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Capitalizes the first letter of a string
     * @param {string} str 
     * @returns {string}
     */
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Converts an object to query string
     * @param {Object} params 
     * @returns {string}
     */
    static toQueryString(params) {
        return Object.entries(params)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }

    /**
     * Checks if value is empty
     * @param {*} value 
     * @returns {boolean}
     */
    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === 'object' && Object.keys(value).length === 0) return true;
        return false;
    }
}

/**
 * Role-based helper functions
 */
export class RoleHelpers {
    /**
     * Checks if current user has permission
     * @param {string} permission 
     * @returns {boolean}
     */
    static can(permission) {
        const user = JSON.parse(localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.USER_DATA));
        if (!user) return false;
        
        return APP_CONSTANTS.PERMISSIONS[user.role.toUpperCase()]?.includes(permission) || false;
    }

    /**
     * Gets readable role name
     * @param {string} role 
     * @returns {string}
     */
    static getRoleName(role) {
        return APP_CONSTANTS.ROLES[role.toUpperCase()] || role;
    }

    /**
     * Filters data based on user's group access
     * @param {Array} data 
     * @returns {Array}
     */
    static filterByGroupAccess(data) {
        const user = JSON.parse(localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.USER_DATA));
        if (!user) return [];
        
        // Super admins can see all data
        if (user.role === APP_CONSTANTS.ROLES.SUPER_ADMIN) return data;
        
        // Filter data based on group access
        return data.filter(item => {
            // Handle different data structures
            if (item.groupId) return item.groupId === user.groupId;
            if (item.group) return item.group.id === user.groupId;
            return true;
        });
    }
}

/**
 * UI helper functions
 */
export class UIHelpers {
    /**
     * Scrolls to element smoothly
     * @param {string} selector 
     * @param {number} offset 
     */
    static scrollTo(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const top = element.getBoundingClientRect().top + window.pageYOffset + offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }

    /**
     * Toggles fullscreen mode
     * @param {HTMLElement} element 
     */
    static toggleFullscreen(element = document.documentElement) {
        if (!document.fullscreenElement) {
            element.requestFullscreen().catch(err => {
                console.error('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Copies text to clipboard
     * @param {string} text 
     * @returns {Promise<boolean>}
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    }

    /**
     * Gets contrast color for background
     * @param {string} hexColor 
     * @returns {string}
     */
    static getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }
}