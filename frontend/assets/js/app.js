// Main Application Class
class TikTokApp {
    constructor() {
        this.currentUser = null;
        this.userPermissions = null;
        this.router = new Router();
        this.auth = new AuthService();
        this.api = new ApiService();
        this.ui = new UIService();
        this.sidebarNav = new SidebarNav();
        
        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    async init() {
        // Show loading overlay
        this.ui.showLoading();
        
        try {
            // Check authentication status
            await this.checkAuth();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize router
            this.router.init();
            
            // Render UI based on user role
            this.renderRoleBasedUI();
            
            // Hide loading overlay
            this.ui.hideLoading();
        } catch (error) {
            console.error('Initialization error:', error);
            this.ui.hideLoading();
            this.redirectToLogin();
        }
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.redirectToLogin();
            return;
        }
        
        try {
            // Verify token and get user info
            this.currentUser = await this.auth.getCurrentUser();
            this.userPermissions = await this.auth.getUserPermissions();
            
            // Update UI with username
            document.getElementById('username-display').textContent = this.currentUser.username;
        } catch (error) {
            console.error('Authentication check failed:', error);
            localStorage.removeItem('token');
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        window.location.hash = '#/login';
    }

    setupEventListeners() {
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.auth.logout();
            this.redirectToLogin();
        });
        
        // You can add more event listeners here
    }

    renderRoleBasedUI() {
        // Render sidebar based on user role
        this.sidebarNav.render(this.currentUser.role);
        
        // Additional UI customization based on role can go here
    }
}

// Router Class
class Router {
    constructor() {
        this.routes = {
            '/login': { 
                template: 'pages/login.html', 
                script: 'pages/login.js',
                auth: false 
            },
            '/dashboard': { 
                template: 'pages/dashboard.html', 
                script: 'pages/dashboard.js',
                auth: true 
            },
            '/analytics': { 
                template: 'pages/analytics.html', 
                script: 'pages/analytics.js',
                auth: true,
                roles: ['super_admin', 'manager', 'operator']
            },
            '/accounts': { 
                template: 'pages/accounts.html', 
                script: 'pages/accounts.js',
                auth: true,
                roles: ['super_admin', 'manager']
            },
            '/users': { 
                template: 'pages/users.html', 
                script: 'pages/users.js',
                auth: true,
                roles: ['super_admin', 'manager']
            },
            '/groups': { 
                template: 'pages/groups.html', 
                script: 'pages/groups.js',
                auth: true,
                roles: ['super_admin', 'manager']
            },
            '/profile': { 
                template: 'pages/profile.html', 
                script: 'pages/profile.js',
                auth: true 
            }
        };
        
        this.defaultRoute = '/dashboard';
        this.currentPage = null;
    }

    init() {
        // Handle initial route
        this.handleRoute();
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    async handleRoute() {
        const hash = window.location.hash.slice(1) || this.defaultRoute;
        const route = this.routes[hash] || this.routes[this.defaultRoute];
        
        // Check authentication
        if (route.auth && !window.app.currentUser) {
            window.location.hash = '#/login';
            return;
        }
        
        // Check role permissions
        if (route.roles && !route.roles.includes(window.app.currentUser.role)) {
            window.app.ui.showError('Access Denied', 'You do not have permission to access this page.');
            window.location.hash = '#/dashboard';
            return;
        }
        
        // Load the page
        await this.loadPage(route.template, route.script);
    }

    async loadPage(templatePath, scriptPath) {
        try {
            // Show loading overlay
            window.app.ui.showLoading();
            
            // Load template
            const response = await fetch(templatePath);
            if (!response.ok) throw new Error('Template not found');
            
            const html = await response.text();
            document.getElementById('main-content').innerHTML = html;
            
            // Load script
            if (scriptPath) {
                // Remove previous script if exists
                if (this.currentPage) {
                    this.currentPage.destroy?.();
                    delete window.currentPage;
                }
                
                // Import the new script
                const module = await import(scriptPath);
                this.currentPage = new module.default();
                await this.currentPage.init?.();
            }
            
            // Hide loading overlay
            window.app.ui.hideLoading();
        } catch (error) {
            console.error('Failed to load page:', error);
            window.app.ui.hideLoading();
            window.app.ui.showError('Page Load Error', 'Failed to load the requested page.');
            window.location.hash = '#/dashboard';
        }
    }
}

// Auth Service
class AuthService {
    async login(username, password) {
        try {
            const response = await window.app.api.post('/auth/login', { username, password });
            
            if (response.token) {
                localStorage.setItem('token', response.token);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('token');
    }

    async getCurrentUser() {
        try {
            const response = await window.app.api.get('/auth/me');
            return response;
        } catch (error) {
            console.error('Failed to get current user:', error);
            throw error;
        }
    }

    async getUserPermissions() {
        try {
            const response = await window.app.api.get('/auth/permissions');
            return response;
        } catch (error) {
            console.error('Failed to get user permissions:', error);
            throw error;
        }
    }
}

// API Service
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:8080/api';
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        };
    }

    async get(endpoint) {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async put(endpoint, data) {
        try {
            const response = await axios.put(`${this.baseURL}${endpoint}`, data, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async delete(endpoint) {
        try {
            const response = await axios.delete(`${this.baseURL}${endpoint}`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    handleError(error) {
        if (error.response) {
            if (error.response.status === 401) {
                // Unauthorized - redirect to login
                localStorage.removeItem('token');
                window.location.hash = '#/login';
            }
            
            // You can add more specific error handling here
        }
    }
}

// UI Service
class UIService {
    showLoading() {
        document.getElementById('loading-overlay').classList.remove('d-none');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('d-none');
    }

    showError(title, message) {
        Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

    showSuccess(title, message) {
        Swal.fire({
            title: title,
            text: message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    }

    confirmDialog(title, text, confirmButtonText = 'Confirm') {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmButtonText
        });
    }
}

// Sidebar Navigation
class SidebarNav {
    getNavItems(role) {
        const commonItems = [
            {
                title: 'Dashboard',
                icon: 'fas fa-fw fa-tachometer-alt',
                href: '#/dashboard',
                active: true
            },
            {
                title: 'Analytics',
                icon: 'fas fa-fw fa-chart-line',
                href: '#/analytics'
            }
        ];
        
        const adminItems = [
            {
                title: 'Accounts',
                icon: 'fas fa-fw fa-user-circle',
                href: '#/accounts'
            },
            {
                title: 'User Management',
                icon: 'fas fa-fw fa-users',
                href: '#/users'
            },
            {
                title: 'Group Management',
                icon: 'fas fa-fw fa-object-group',
                href: '#/groups'
            }
        ];
        
        const managerItems = [
            {
                title: 'Accounts',
                icon: 'fas fa-fw fa-user-circle',
                href: '#/accounts'
            },
            {
                title: 'User Management',
                icon: 'fas fa-fw fa-users',
                href: '#/users'
            }
        ];
        
        let items = [...commonItems];
        
        if (role === 'super_admin') {
            items = [...items, ...adminItems];
        } else if (role === 'manager') {
            items = [...items, ...managerItems];
        }
        
        // Add profile link at the bottom
        items.push({
            title: 'Profile',
            icon: 'fas fa-fw fa-user',
            href: '#/profile'
        });
        
        return items;
    }

    render(role) {
        const navItems = this.getNavItems(role);
        const navContainer = document.querySelector('#sidebar-nav');
        
        // Clear existing items
        navContainer.innerHTML = '';
        
        // Add new items
        navItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            
            const a = document.createElement('a');
            a.className = `nav-link ${item.active ? 'active' : ''}`;
            a.href = item.href;
            
            const icon = document.createElement('i');
            icon.className = item.icon;
            
            const span = document.createElement('span');
            span.className = 'align-middle';
            span.textContent = item.title;
            
            a.appendChild(icon);
            a.appendChild(span);
            li.appendChild(a);
            navContainer.appendChild(li);
        });
    }
}

// Initialize the application
window.app = new TikTokApp();