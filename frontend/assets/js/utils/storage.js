import { APP_CONSTANTS } from '../config/constants';

/**
 * LocalStorage wrapper with expiration support
 */
export class Storage {
    /**
     * Sets item in localStorage with optional expiration
     * @param {string} key 
     * @param {*} value 
     * @param {number} ttl Time to live in milliseconds
     */
    static set(key, value, ttl = null) {
        const item = {
            value,
            expires: ttl ? Date.now() + ttl : null
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    /**
     * Gets item from localStorage
     * @param {string} key 
     * @returns {*}
     */
    static get(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item = JSON.parse(itemStr);
            
            // Check if expired
            if (item.expires && Date.now() > item.expires) {
                this.remove(key);
                return null;
            }
            
            return item.value;
        } catch (e) {
            return itemStr; // Return as string if not JSON
        }
    }

    /**
     * Removes item from localStorage
     * @param {string} key 
     */
    static remove(key) {
        localStorage.removeItem(key);
    }

    /**
     * Clears all app-related items from localStorage
     */
    static clearAppData() {
        Object.values(APP_CONSTANTS.STORAGE_KEYS).forEach(key => {
            this.remove(key);
        });
    }

    /**
     * Gets user data from storage
     * @returns {Object|null}
     */
    static getUser() {
        return this.get(APP_CONSTANTS.STORAGE_KEYS.USER_DATA);
    }

    /**
     * Sets user data in storage
     * @param {Object} user 
     */
    static setUser(user) {
        this.set(APP_CONSTANTS.STORAGE_KEYS.USER_DATA, user);
    }

    /**
     * Gets auth token from storage
     * @returns {string|null}
     */
    static getToken() {
        return this.get(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN);
    }

    /**
     * Sets auth token in storage
     * @param {string} token 
     */
    static setToken(token) {
        this.set(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN, token);
    }

    /**
     * Gets current theme from storage
     * @returns {string}
     */
    static getTheme() {
        return this.get(APP_CONSTANTS.STORAGE_KEYS.THEME) || APP_CONSTANTS.UI.THEMES.LIGHT;
    }

    /**
     * Sets theme in storage
     * @param {string} theme 
     */
    static setTheme(theme) {
        this.set(APP_CONSTANTS.STORAGE_KEYS.THEME, theme);
    }

    /**
     * Gets language preference from storage
     * @returns {string}
     */
    static getLanguage() {
        return this.get(APP_CONSTANTS.STORAGE_KEYS.LANGUAGE) || 'en';
    }

    /**
     * Sets language preference in storage
     * @param {string} lang 
     */
    static setLanguage(lang) {
        this.set(APP_CONSTANTS.STORAGE_KEYS.LANGUAGE, lang);
    }

    /**
     * Gets last active timestamp
     * @returns {number}
     */
    static getLastActive() {
        return parseInt(this.get(APP_CONSTANTS.STORAGE_KEYS.LAST_ACTIVE)) || 0;
    }

    /**
     * Updates last active timestamp
     */
    static updateLastActive() {
        this.set(APP_CONSTANTS.STORAGE_KEYS.LAST_ACTIVE, Date.now());
    }

    /**
     * Checks if session is expired based on last active time
     * @param {number} timeout 
     * @returns {boolean}
     */
    static isSessionExpired(timeout = 30 * 60 * 1000) { // 30 minutes default
        const lastActive = this.getLastActive();
        return lastActive > 0 && (Date.now() - lastActive) > timeout;
    }
}

/**
 * SessionStorage wrapper
 */
export class SessionStorage {
    /**
     * Sets item in sessionStorage
     * @param {string} key 
     * @param {*} value 
     */
    static set(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * Gets item from sessionStorage
     * @param {string} key 
     * @returns {*}
     */
    static get(key) {
        const value = sessionStorage.getItem(key);
        try {
            return value ? JSON.parse(value) : null;
        } catch (e) {
            return value;
        }
    }

    /**
     * Removes item from sessionStorage
     * @param {string} key 
     */
    static remove(key) {
        sessionStorage.removeItem(key);
    }

    /**
     * Clears all sessionStorage
     */
    static clear() {
        sessionStorage.clear();
    }
}

/**
 * IndexedDB wrapper for larger data
 */
export class IndexedDB {
    static dbName = 'TikTokManagerDB';
    static dbVersion = 1;
    static db = null;

    /**
     * Opens database connection
     * @returns {Promise<IDBDatabase>}
     */
    static async openDB() {
        if (this.db) return this.db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('analyticsData')) {
                    db.createObjectStore('analyticsData', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('cachedResponses')) {
                    db.createObjectStore('cachedResponses', { keyPath: 'url' });
                }
            };
        });
    }

    /**
     * Gets data from IndexedDB
     * @param {string} storeName 
     * @param {*} key 
     * @returns {Promise<*>}
     */
    static async get(storeName, key) {
        const db = await this.openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    /**
     * Sets data in IndexedDB
     * @param {string} storeName 
     * @param {*} key 
     * @param {*} value 
     * @returns {Promise<void>}
     */
    static async set(storeName, key, value) {
        const db = await this.openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ id: key, value });
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    /**
     * Clears all data in a store
     * @param {string} storeName 
     * @returns {Promise<void>}
     */
    static async clear(storeName) {
        const db = await this.openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
}