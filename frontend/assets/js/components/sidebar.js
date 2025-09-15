export class Sidebar {
    constructor() {
        this.navItems = [];
    }

    init() {
        this.generateNavItems();
        this.render();
        this.setupEventListeners();
    }

    generateNavItems() {
        const userRole = window.app.currentUser?.role;
        
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
            },
            {
                title: 'System Admin',
                icon: 'fas fa-fw fa-cog',
                href: '#/admin'
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
        
        this.navItems = [...commonItems];
        
        if (userRole === 'super_admin') {
            this.navItems = [...this.navItems, ...adminItems];
        } else if (userRole === 'manager') {
            this.navItems = [...this.navItems, ...managerItems];
        }
        
        // Add profile link at the bottom
        this.navItems.push({
            title: 'Profile',
            icon: 'fas fa-fw fa-user',
            href: '#/profile'
        });
    }

    render() {
        const navContainer = document.querySelector('#sidebar-nav');
        if (!navContainer) return;
        
        navContainer.innerHTML = this.navItems.map(item => `
            <li class="nav-item">
                <a class="nav-link ${item.active ? 'active' : ''}" href="${item.href}">
                    <i class="${item.icon}"></i>
                    <span>${item.title}</span>
                </a>
            </li>
        `).join('');
        
        // Update user role display
        const userRoleDisplay = document.getElementById('sidebar-userrole');
        if (userRoleDisplay) {
            userRoleDisplay.textContent = this.formatRole(window.app.currentUser?.role);
        }
    }

    setupEventListeners() {
        // Handle active state for nav items
        document.querySelectorAll('#sidebar-nav .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelectorAll('#sidebar-nav .nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                link.classList.add('active');
            });
        });
        
        // Close sidebar when clicking on mobile
        document.querySelector('.sidebar').addEventListener('click', (e) => {
            if (window.innerWidth < 768) {
                document.body.classList.remove('sidebar-toggled');
                document.querySelector('.sidebar').classList.remove('toggled');
            }
        });
    }

    formatRole(role) {
        switch (role) {
            case 'super_admin': return 'Super Admin';
            case 'manager': return 'Manager';
            case 'operator': return 'Operator';
            default: return role;
        }
    }
}