import { API_CONFIG, getApiUrl, getHeaders } from '../config/api';
import { APP_CONSTANTS } from '../config/constants';

export class AuthService {
    constructor() {
        this.token = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN);
    }

    async login(username, password) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED);
            }

            const data = await response.json();
            this.setToken(data.token);
            return data.user;
        } catch (error) {
            console.error('Login failed:', error);
            throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.NETWORK_ERROR);
        }
    }

    logout() {
        localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.USER_DATA);
        this.token = null;
    }

    async getCurrentUser() {
        // Check local storage first
        const storedUser = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.USER_DATA);
        if (storedUser) {
            return JSON.parse(storedUser);
        }

        // Fetch from API if not in local storage
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.PROFILE), {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED);
            }

            const user = await response.json();
            localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            return user;
        } catch (error) {
            console.error('Failed to fetch user:', error);
            this.logout();
            throw error;
        }
    }

    async refreshToken() {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH), {
                method: 'POST',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED);
            }

            const data = await response.json();
            this.setToken(data.token);
            return data.token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return true;
        } catch (error) {
            console.error('Password change failed:', error);
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN, token);
    }

    isAuthenticated() {
        return !!this.token;
    }

    async validateToken() {
        if (!this.token) return false;

        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.PROFILE), {
                headers: getHeaders()
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}