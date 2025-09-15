import { API_CONFIG, getApiUrl, getHeaders } from '../config/api';
import { APP_CONSTANTS } from '../config/constants';

export class AnalyticsService {
    constructor() {
        this.baseEndpoint = API_CONFIG.ENDPOINTS.ANALYTICS.BASE;
    }

    async getDashboardData() {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.DASHBOARD), {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            throw error;
        }
    }

    async getAccountTrends(accountId, range = APP_CONSTANTS.TIME_RANGES.MONTH) {
        try {
            const response = await fetch(
                `${getApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.ACCOUNT_TRENDS(accountId))}?range=${range}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.NOT_FOUND);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch trends for account ${accountId}:`, error);
            throw error;
        }
    }

    async getGroupStats(groupId, range = APP_CONSTANTS.TIME_RANGES.MONTH) {
        try {
            const response = await fetch(
                `${getApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.GROUP_STATS(groupId))}?range=${range}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.NOT_FOUND);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch stats for group ${groupId}:`, error);
            throw error;
        }
    }

    async compareAccounts(accountIds, metric = 'followers') {
        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.COMPARE), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ accountIds, metric })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || APP_CONSTANTS.ERROR_MESSAGES.VALIDATION);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to compare accounts:', error);
            throw error;
        }
    }

    async refreshAccountData(accountId) {
        try {
            const response = await fetch(
                `${getApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.REFRESH)}?accountId=${accountId}`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to refresh data for account ${accountId}:`, error);
            throw error;
        }
    }

    async getSummary(range = APP_CONSTANTS.TIME_RANGES.MONTH) {
        try {
            const response = await fetch(
                `${getApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.SUMMARY)}?range=${range}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch analytics summary:', error);
            throw error;
        }
    }

    async exportAnalytics(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            const url = `${getApiUrl(this.baseEndpoint)}/export?${query}`;
            
            const response = await fetch(url, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(APP_CONSTANTS.ERROR_MESSAGES.FORBIDDEN);
            }

            return await response.blob();
        } catch (error) {
            console.error('Failed to export analytics:', error);
            throw error;
        }
    }
}