import { API_CONFIG, getApiUrl, getHeaders } from '../config/api';
import { APP_CONSTANTS } from '../config/constants';

export class AccountService {
    constructor() {
        this.baseEndpoint = API_CONFIG.ENDPOINTS.ACCOUNTS.BASE;
    }

    async getAccounts(params = {}) {
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
            console.error('Failed to fetch accounts:', error);
            throw error;
        }
    }

    async getAccountById(id) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ACCOUNTS.BY_ID(id)), {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.NOT_FOUND);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch account ${id}:`, error);
            throw error;
        }
    }

    async createAccount(accountData) {
        try {
            const response = await fetch(getApiUrl(this.baseEndpoint), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(accountData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.VALIDATION);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to create account:', error);
            throw error;
        }
    }

    async updateAccount(id, accountData) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ACCOUNTS.BY_ID(id)), {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(accountData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.VALIDATION);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to update account ${id}:`, error);
            throw error;
        }
    }

    async deleteAccount(id) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ACCOUNTS.BY_ID(id)), {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return true;
        } catch (error) {
            console.error(`Failed to delete account ${id}:`, error);
            throw error;
        }
    }

    async importAccounts(accounts, groupId) {
        try {
            const formData = new FormData();
            formData.append('file', new Blob([JSON.stringify(accounts)], { type: 'application/json' }), 'accounts.json');
            if (groupId) formData.append('groupId', groupId);

            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ACCOUNTS.IMPORT), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN)}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.VALIDATION);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to import accounts:', error);
            throw error;
        }
    }

    async exportAccounts(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            const url = `${getApiUrl(API_CONFIG.ENDPOINTS.ACCOUNTS.EXPORT)}?${query}`;
            
            const response = await fetch(url, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return await response.blob();
        } catch (error) {
            console.error('Failed to export accounts:', error);
            throw error;
        }
    }

    async transferAccount(accountId, newGroupId) {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ACCOUNTS.TRANSFER), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ accountId, newGroupId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to transfer account:', error);
            throw error;
        }
    }
}