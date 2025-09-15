import { TikTokApp } from './app.js';
import { Header } from './components/header.js';
import { Sidebar } from './components/sidebar.js';
import { Modal } from './components/modal.js';
import { AuthService } from './services/auth.service.js';
import { AccountService } from './services/account.service.js';
import { AnalyticsService } from './services/analytics.service.js';
import { UserService } from './services/user.service.js';
import { API_CONFIG } from './config/api.js';
import { APP_CONSTANTS } from './config/constants.js';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Configure global error handling
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    // Initialize services
    const authService = new AuthService();
    const accountService = new AccountService();
    const analyticsService = new AnalyticsService();
    const userService = new UserService();

    // Initialize components
    const header = new Header();
    const sidebar = new Sidebar();
    const modal = new Modal();

    // Create the main application instance
    window.app = new TikTokApp({
        auth: authService,
        account: accountService,
        analytics: analyticsService,
        user: userService,
        header,
        sidebar,
        modal
    });

    // Start the application
    window.app.init();
});

/**
 * Global error handler
 * @param {ErrorEvent} event 
 */
function handleGlobalError(event) {
    console.error('Global error:', event.error);
    
    // Don't show error if in production and it's a chunk loading error
    if (APP_CONSTANTS.ENVIRONMENT === 'production' && 
        event.error.message && 
        event.error.message.includes('Failed to fetch dynamically imported module')) {
        return;
    }
    
    // Show error to user
    if (window.app && window.app.ui) {
        window.app.ui.showError(
            'Application Error',
            'An unexpected error occurred. Please try again or contact support if the problem persists.'
        );
    }
}

/**
 * Handle unhandled promise rejections
 * @param {PromiseRejectionEvent} event 
 */
function handlePromiseRejection(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Show error to user if it's not an API error (those are handled by services)
    if (event.reason && !event.reason.isApiError && window.app && window.app.ui) {
        window.app.ui.showError(
            'Application Error',
            event.reason.message || 'An unexpected error occurred. Please try again.'
        );
    }
}

/**
 * Register service worker for PWA
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator && APP_CONSTANTS.ENVIRONMENT === 'production') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}

// Register service worker
registerServiceWorker();

// Add global helper methods
window.AppHelpers = {
    /**
     * Format number with commas
     * @param {number} num 
     * @returns {string}
     */
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /**
     * Format date string
     * @param {string} dateString 
     * @returns {string}
     */
    formatDate: (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },

    /**
     * Capitalize first letter of string
     * @param {string} str 
     * @returns {string}
     */
    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

// Add global error class
class AppError extends Error {
    constructor(message, isApiError = false) {
        super(message);
        this.name = 'AppError';
        this.isApiError = isApiError;
    }
}

window.AppError = AppError;