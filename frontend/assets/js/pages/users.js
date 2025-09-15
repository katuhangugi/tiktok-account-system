export default class UsersPage {
    constructor() {
        this.users = [];
        this.dataTable = null;
    }

    async init() {
        await this.loadUsers();
        this.initDataTable();
        this.setupEventListeners();
    }

    async loadUsers() {
        try {
            window.app.ui.showLoading();
            
            // Load users based on current user's role
            let endpoint = '/users';
            if (window.app.currentUser.role === 'manager') {
                endpoint = '/users/managed';
            }
            
            this.users = await window.app.api.get(endpoint);
            this.renderUsers();
        } catch (error) {
            console.error('Failed to load users:', error);
            window.app.ui.showError('Load Error', 'Failed to load users');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    renderUsers() {
        const tableBody = document.querySelector('#usersTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>
                    <span class="badge ${this.getRoleBadgeClass(user.role)}">
                        ${this.formatRole(user.role)}
                    </span>
                </td>
                <td>${user.groupName || 'N/A'}</td>
                <td>
                    <span class="badge ${user.isActive ? 'bg-success' : 'bg-secondary'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-user-btn" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${this.canDeleteUser(user) ? `
                    <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    initDataTable() {
        if ($.fn.DataTable.isDataTable('#usersTable')) {
            this.dataTable = $('#usersTable').DataTable().destroy();
        }
        
        this.dataTable = $('#usersTable').DataTable({
            responsive: true,
            order: [[4, 'desc']] // Sort by created date descending
        });
    }

    setupEventListeners() {
        // Add user button
        document.getElementById('add-user-btn')?.addEventListener('click', () => {
            this.showAddUserModal();
        });
        
        // Edit user buttons
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                this.editUser(userId);
            });
        });
        
        // Delete user buttons
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                this.deleteUser(userId);
            });
        });
    }

    showAddUserModal() {
        // In a real app, this would show a modal with a form to add a new user
        // The form would have different fields based on the current user's role
        
        let title = 'Add User';
        let message = 'This would open a modal to add a new user in a real implementation.';
        
        if (window.app.currentUser.role === 'super_admin') {
            message += ' Super admins can add managers and operators.';
        } else if (window.app.currentUser.role === 'manager') {
            message += ' Managers can only add operators.';
        }
        
        window.app.ui.showSuccess(title, message);
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            window.app.ui.showSuccess('Edit User', `Editing user: ${user.username}`);
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        // Check if current user can delete this user
        if (!this.canDeleteUser(user)) {
            window.app.ui.showError('Permission Denied', 'You do not have permission to delete this user');
            return;
        }
        
        const confirm = await window.app.ui.confirmDialog(
            'Delete User', 
            `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
            'Delete'
        );
        
        if (confirm.isConfirmed) {
            try {
                window.app.ui.showLoading();
                await window.app.api.delete(`/users/${userId}`);
                await this.loadUsers();
                window.app.ui.showSuccess('Success', 'User deleted successfully');
            } catch (error) {
                console.error('Failed to delete user:', error);
                window.app.ui.showError('Delete Error', 'Failed to delete user');
            } finally {
                window.app.ui.hideLoading();
            }
        }
    }

    canDeleteUser(user) {
        const currentUser = window.app.currentUser;
        
        // Cannot delete self
        if (user.id === currentUser.id) return false;
        
        // Super admin can delete anyone except other super admins (unless it's the default admin)
        if (currentUser.role === 'super_admin') {
            return user.role !== 'super_admin' || currentUser.id === 1;
        }
        
        // Managers can only delete operators they created
        if (currentUser.role === 'manager') {
            return user.role === 'operator' && user.createdBy === currentUser.id;
        }
        
        // Operators cannot delete anyone
        return false;
    }

    getRoleBadgeClass(role) {
        switch (role) {
            case 'super_admin': return 'bg-danger';
            case 'manager': return 'bg-warning text-dark';
            case 'operator': return 'bg-info';
            default: return 'bg-secondary';
        }
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