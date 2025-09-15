import { APP_CONSTANTS } from '../config/constants';

/**
 * Validation functions
 */
export class Validators {
    /**
     * Validates email format
     * @param {string} email 
     * @returns {boolean}
     */
    static isEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validates password strength
     * @param {string} password 
     * @returns {Object}
     */
    static validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validates TikTok username
     * @param {string} username 
     * @returns {boolean}
     */
    static isTikTokUsername(username) {
        const re = /^[a-zA-Z0-9._]{3,24}$/;
        return re.test(username);
    }

    /**
     * Validates form data
     * @param {Object} formData 
     * @param {Object} rules 
     * @returns {Object}
     */
    static validateForm(formData, rules) {
        const errors = {};
        let isValid = true;
        
        for (const field in rules) {
            const value = formData[field];
            const fieldRules = rules[field];
            
            for (const rule of fieldRules) {
                if (rule.required && (value === undefined || value === null || value === '')) {
                    errors[field] = rule.message || `${field} is required`;
                    isValid = false;
                    break;
                }
                
                if (rule.minLength && value?.length < rule.minLength) {
                    errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
                    isValid = false;
                    break;
                }
                
                if (rule.maxLength && value?.length > rule.maxLength) {
                    errors[field] = rule.message || `${field} must be no more than ${rule.maxLength} characters`;
                    isValid = false;
                    break;
                }
                
                if (rule.pattern && !rule.pattern.test(value)) {
                    errors[field] = rule.message || `${field} is invalid`;
                    isValid = false;
                    break;
                }
                
                if (rule.validate && !rule.validate(value)) {
                    errors[field] = rule.message || `${field} is invalid`;
                    isValid = false;
                    break;
                }
            }
        }
        
        return { isValid, errors };
    }

    /**
     * Validates account data
     * @param {Object} accountData 
     * @returns {Object}
     */
    static validateAccount(accountData) {
        const rules = {
            accountName: [
                { required: true, message: 'Account name is required' },
                { minLength: 3, message: 'Account name must be at least 3 characters' },
                { maxLength: 50, message: 'Account name must be no more than 50 characters' }
            ],
            nickname: [
                { maxLength: 50, message: 'Nickname must be no more than 50 characters' }
            ],
            groupId: [
                { required: true, message: 'Group is required' }
            ]
        };
        
        return this.validateForm(accountData, rules);
    }

    /**
     * Validates user data
     * @param {Object} userData 
     * @returns {Object}
     */
    static validateUser(userData) {
        const rules = {
            username: [
                { required: true, message: 'Username is required' },
                { minLength: 3, message: 'Username must be at least 3 characters' },
                { maxLength: 30, message: 'Username must be no more than 30 characters' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers and underscores' }
            ],
            password: [
                { 
                    required: !userData.id, 
                    message: 'Password is required' 
                },
                { 
                    validate: (val) => !val || this.validatePassword(val).isValid, 
                    message: 'Password does not meet requirements' 
                }
            ],
            role: [
                { required: true, message: 'Role is required' },
                { 
                    validate: (val) => Object.values(APP_CONSTANTS.ROLES).includes(val), 
                    message: 'Invalid role' 
                }
            ]
        };
        
        return this.validateForm(userData, rules);
    }
}

/**
 * Async validation functions
 */
export class AsyncValidators {
    /**
     * Checks if username is available
     * @param {string} username 
     * @returns {Promise<boolean>}
     */
    static async isUsernameAvailable(username) {
        // In a real app, this would call an API endpoint
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(Math.random() > 0.5); // Simulate availability check
            }, 500);
        });
    }

    /**
     * Validates TikTok account exists
     * @param {string} username 
     * @returns {Promise<boolean>}
     */
    static async validateTikTokAccount(username) {
        // In a real app, this would call TikTok API
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(Math.random() > 0.8); // Simulate validation
            }, 800);
        });
    }
}