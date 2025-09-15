export class Header {
    constructor() {
        this.notificationCount = 0;
        this.notifications = [];
    }

    async init() {
        this.setupEventListeners();
        await this.loadNotifications();
        this.renderUserInfo();
    }

    async loadNotifications() {
        try {
            // In a real app, this would fetch from an API
            this.notifications = [
                { id: 1, message: "New account added", time: "2 mins ago", read: false },
                { id: 2, message: "System update available", time: "1 hour ago", read: false },
                { id: 3, message: "Weekly report generated", time: "1 day ago", read: true }
            ];
            this.notificationCount = this.notifications.filter(n => !n.read).length;
            this.renderNotifications();
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    renderUserInfo() {
        const user = window.app.currentUser;
        if (!user) return;

        const usernameDisplay = document.getElementById('username-display');
        const sidebarUsername = document.getElementById('sidebar-username');
        
        if (usernameDisplay) usernameDisplay.textContent = user.username;
        if (sidebarUsername) sidebarUsername.textContent = user.username;
    }

    renderNotifications() {
        const notificationBadge = document.getElementById('notification-badge');
        const notificationList = document.getElementById('notification-list');
        
        if (notificationBadge) {
            notificationBadge.textContent = this.notificationCount;
            notificationBadge.style.display = this.notificationCount > 0 ? 'block' : 'none';
        }
        
        if (notificationList) {
            if (this.notifications.length === 0) {
                notificationList.innerHTML = '<li class="px-3 py-2 text-muted small">No new notifications</li>';
                return;
            }
            
            notificationList.innerHTML = this.notifications.map(notification => `
                <li class="notification-item ${notification.read ? '' : 'unread'}">
                    <a href="#" class="dropdown-item d-flex align-items-center" data-id="${notification.id}">
                        <div class="me-3">
                            <div class="icon-circle bg-primary text-white">
                                <i class="fas fa-bell"></i>
                            </div>
                        </div>
                        <div>
                            <div class="small text-gray-500">${notification.time}</div>
                            <span class="font-weight-bold">${notification.message}</span>
                        </div>
                    </a>
                </li>
            `).join('');
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-toggled');
            document.querySelector('.sidebar').classList.toggle('toggled');
        });
        
        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.app.auth.logout();
            window.location.hash = '#/login';
        });
        
        // Notification click
        document.querySelectorAll('.notification-item a').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const notificationId = e.currentTarget.getAttribute('data-id');
                this.markAsRead(notificationId);
            });
        });
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.notificationCount--;
            this.renderNotifications();
        }
    }
}