import { API_CONFIG, getApiUrl, getHeaders } from '../config/api';
import { APP_CONSTANTS, hasPermission } from '../config/constants';

export class UserService {
    constructor() {
        this.baseEndpoint = API_CONFIG.ENDPOINTS.USERS.BASE;
    }

    async getUsers(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            const url = `${getApiUrl(this.baseEndpoint)}?${query}`;
            
            const response = await fetch(url, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw error;
        }
    }

    async getUserById(id) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS.BY_ID(id)), {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.NOT_FOUND);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch user ${id}:`, error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            // Check permissions
            const currentUser = JSON.parse(localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.USER_DATA));
            if (userData.role === APP_CONSTANTS.ROLES.MANAGER && 
                !hasPermission(currentUser.role, 'users:create:manager')) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            const response = await fetch(getApiUrl(this.baseEndpoint), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.VALIDATION);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }

    async updateUser(id, userData) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS.BY_ID(id)), {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.VALIDATION);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to update user ${id}:`, error);
            throw error;
        }
    }

    async deleteUser(id) {
        try {
            // Check if trying to delete self
            const currentUser = JSON.parse(localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.USER_DATA));
            if (currentUser.id === id) {
                throw new Error("You cannot delete your own account");
            }

            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS.BY_ID(id)), {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return true;
        } catch (error) {
            console.error(`Failed to delete user ${id}:`, error);
            throw error;
        }
    }

    async assignToGroup(userId, groupId) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS.ASSIGN_GROUP), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ userId, groupId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to assign user ${userId} to group ${groupId}:`, error);
            throw error;
        }
    }

    async getUsersByRole(role) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS.BY_ROLE(role)), {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.NOT_FOUND);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch users by role ${role}:`, error);
            throw error;
        }
    }

    async getManagedUsers() {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS.MANAGED), {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch managed users:', error);
            throw error;
        }
    }
}