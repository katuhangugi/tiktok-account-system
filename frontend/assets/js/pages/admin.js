export default class AdminPage {
    constructor() {
        this.systemStats = null;
        this.users = [];
        this.groups = [];
        this.logs = [];
        this.userDistributionChart = null;
        this.usersTable = null;
        this.groupsTable = null;
        this.logsTable = null;
    }

    async init() {
        // Verify user is super admin
        if (window.app.currentUser.role !== 'super_admin') {
            window.location.hash = '#/dashboard';
            return;
        }

        await this.loadSystemStats();
        await this.loadUsers();
        await this.loadGroups();
        await this.loadLogs();
        this.initCharts();
        this.initDataTables();
        this.setupEventListeners();
    }

    async loadSystemStats() {
        try {
            window.app.ui.showLoading();
            this.systemStats = await window.app.api.get('/admin/stats');
            
            // Update stats cards
            document.getElementById('total-users-count').textContent = this.systemStats.totalUsers;
            document.getElementById('total-groups-count').textContent = this.systemStats.totalGroups;
            document.getElementById('total-accounts-count').textContent = this.systemStats.totalAccounts;
            document.getElementById('system-status').textContent = this.systemStats.systemStatus;
            
            // Load settings if they exist
            if (this.systemStats.settings) {
                document.getElementById('system-name').value = this.systemStats.settings.systemName || '';
                document.getElementById('data-retention').value = this.systemStats.settings.dataRetentionDays || 30;
                document.getElementById('api-rate-limit').value = this.systemStats.settings.apiRateLimit || 60;
                document.getElementById('maintenance-mode').checked = this.systemStats.settings.maintenanceMode || false;
            }
        } catch (error) {
            console.error('Failed to load system stats:', error);
            window.app.ui.showError('Load Error', 'Failed to load system statistics');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    async loadUsers() {
        try {
            window.app.ui.showLoading();
            this.users = await window.app.api.get('/admin/users');
            this.renderUsers();
            
            // Populate log user filter
            const userFilter = document.getElementById('log-user-filter');
            if (userFilter) {
                userFilter.innerHTML = `
                    <option value="all">All Users</option>
                    ${this.users.map(user => `
                        <option value="${user.id}">${user.username}</option>
                    `).join('')}
                `;
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            window.app.ui.showError('Load Error', 'Failed to load users');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    async loadGroups() {
        try {
            window.app.ui.showLoading();
            this.groups = await window.app.api.get('/admin/groups');
            this.renderGroups();
        } catch (error) {
            console.error('Failed to load groups:', error);
            window.app.ui.showError('Load Error', 'Failed to load groups');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    async loadLogs() {
        try {
            window.app.ui.showLoading();
            
            const levelFilter = document.getElementById('log-level-filter').value;
            const userFilter = document.getElementById('log-user-filter').value;
            const dateFilter = document.getElementById('log-date-filter').value;
            
            let endpoint = '/admin/logs?';
            if (levelFilter !== 'all') endpoint += `level=${levelFilter}&`;
            if (userFilter !== 'all') endpoint += `userId=${userFilter}&`;
            endpoint += `range=${dateFilter}`;
            
            this.logs = await window.app.api.get(endpoint);
            this.renderLogs();
        } catch (error) {
            console.error('Failed to load logs:', error);
            window.app.ui.showError('Load Error', 'Failed to load system logs');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    renderUsers() {
        const tableBody = document.querySelector('#adminUsersTable tbody');
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
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-admin-user-btn" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.role !== 'super_admin' ? `
                    <button class="btn btn-sm btn-danger delete-admin-user-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    renderGroups() {
        const tableBody = document.querySelector('#adminGroupsTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = this.groups.map(group => `
            <tr>
                <td>${group.name}</td>
                <td>${group.description || 'N/A'}</td>
                <td>${group.managerName || 'Unassigned'}</td>
                <td>${group.memberCount}</td>
                <td>${group.accountCount}</td>
                <td>
                    <span class="badge ${group.isActive ? 'bg-success' : 'bg-secondary'}">
                        ${group.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${new Date(group.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-admin-group-btn" data-id="${group.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-admin-group-btn" data-id="${group.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderLogs() {
        const tableBody = document.querySelector('#systemLogsTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = this.logs.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>
                    <span class="badge ${this.getLogLevelBadgeClass(log.level)}">
                        ${log.level.toUpperCase()}
                    </span>
                </td>
                <td>${log.username || 'System'}</td>
                <td>${log.action}</td>
                <td>${log.details || 'N/A'}</td>
            </tr>
        `).join('');
    }

    initCharts() {
        // User Distribution Chart
        const userCtx = document.getElementById('userDistributionChart');
        if (userCtx && this.systemStats?.userDistribution) {
            this.userDistributionChart = new Chart(userCtx, {
                type: 'doughnut',
                data: {
                    labels: this.systemStats.userDistribution.labels,
                    datasets: [{
                        data: this.systemStats.userDistribution.data,
                        backgroundColor: [
                            'rgba(78, 115, 223, 0.8)',
                            'rgba(28, 200, 138, 0.8)',
                            'rgba(54, 185, 204, 0.8)'
                        ],
                        hoverBackgroundColor: [
                            'rgba(78, 115, 223, 1)',
                            'rgba(28, 200, 138, 1)',
                            'rgba(54, 185, 204, 1)'
                        ],
                        hoverBorderColor: "rgba(234, 236, 244, 1)",
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    cutout: '70%'
                }
            });
            
            // Add custom legend
            const legendContainer = document.getElementById('user-chart-legend');
            if (legendContainer) {
                legendContainer.innerHTML = this.systemStats.userDistribution.labels.map((label, i) => `
                    <span class="me-3">
                        <i class="fas fa-circle" style="color: ${this.userDistributionChart.data.datasets[0].backgroundColor[i]}"></i>
                        <span class="me-1">${label}</span>
                        <span class="fw-bold">(${this.systemStats.userDistribution.data[i]})</span>
                    </span>
                `).join('');
            }
        }
    }

    initDataTables() {
        // Users Table
        if ($.fn.DataTable.isDataTable('#adminUsersTable')) {
            this.usersTable = $('#adminUsersTable').DataTable().destroy();
        }
        this.usersTable = $('#adminUsersTable').DataTable({
            responsive: true,
            order: [[4, 'desc']] // Sort by created date descending
        });
        
        // Groups Table
        if ($.fn.DataTable.isDataTable('#adminGroupsTable')) {
            this.groupsTable = $('#adminGroupsTable').DataTable().destroy();
        }
        this.groupsTable = $('#adminGroupsTable').DataTable({
            responsive: true,
            order: [[0, 'asc']] // Sort by group name ascending
        });
        
        // Logs Table
        if ($.fn.DataTable.isDataTable('#systemLogsTable')) {
            this.logsTable = $('#systemLogsTable').DataTable().destroy();
        }
        this.logsTable = $('#systemLogsTable').DataTable({
            responsive: true,
            order: [[0, 'desc']] // Sort by timestamp descending
        });
        
        // Recent Activity Table
        if ($.fn.DataTable.isDataTable('#recentActivityTable')) {
            $('#recentActivityTable').DataTable().destroy();
        }
        $('#recentActivityTable').DataTable({
            responsive: true,
            order: [[2, 'desc']], // Sort by time descending
            searching: false,
            paging: false,
            info: false
        });
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refresh-admin-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.init();
        });
        
        // Export system data button
        document.getElementById('export-system-data-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportSystemData();
        });
        
        // Add user button
        document.getElementById('add-admin-user-btn')?.addEventListener('click', () => {
            this.showAddUserModal();
        });
        
        // Edit user buttons
        document.querySelectorAll('.edit-admin-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                this.editUser(userId);
            });
        });
        
        // Delete user buttons
        document.querySelectorAll('.delete-admin-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                this.deleteUser(userId);
            });
        });
        
        // Add group button
        document.getElementById('add-admin-group-btn')?.addEventListener('click', () => {
            this.showAddGroupModal();
        });
        
        // Edit group buttons
        document.querySelectorAll('.edit-admin-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupId = e.currentTarget.getAttribute('data-id');
                this.editGroup(groupId);
            });
        });
        
        // Delete group buttons
        document.querySelectorAll('.delete-admin-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupId = e.currentTarget.getAttribute('data-id');
                this.deleteGroup(groupId);
            });
        });
        
        // System settings form
        document.getElementById('system-settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSystemSettings();
        });
        
        // Danger zone buttons
        document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
            this.clearSystemCache();
        });
        
        document.getElementById('purge-old-data-btn')?.addEventListener('click', () => {
            this.purgeOldData();
        });
        
        document.getElementById('backup-system-btn')?.addEventListener('click', () => {
            this.createSystemBackup();
        });
        
        // Log filters
        document.getElementById('log-level-filter')?.addEventListener('change', () => {
            this.loadLogs();
        });
        
        document.getElementById('log-user-filter')?.addEventListener('change', () => {
            this.loadLogs();
        });
        
        document.getElementById('log-date-filter')?.addEventListener('change', () => {
            this.loadLogs();
        });
    }

    showAddUserModal() {
        // In a real implementation, this would show a modal with a form to add a new user
        // For now, we'll just show a success message
        window.app.ui.showSuccess('Add User', 'This would open a modal to add a new user in a real implementation.');
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
        
        // Cannot delete super admin users (except the default admin)
        if (user.role === 'super_admin' && window.app.currentUser.id !== 1) {
            window.app.ui.showError('Permission Denied', 'Only the default admin can delete other super admins');
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
                await window.app.api.delete(`/admin/users/${userId}`);
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

    showAddGroupModal() {
        // In a real implementation, this would show a modal with a form to add a new group
        window.app.ui.showSuccess('Add Group', 'This would open a modal to add a new group in a real implementation.');
    }

    editGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            window.app.ui.showSuccess('Edit Group', `Editing group: ${group.name}`);
        }
    }

    async deleteGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        const confirm = await window.app.ui.confirmDialog(
            'Delete Group', 
            `Are you sure you want to delete ${group.name}? This will also remove all members from this group.`,
            'Delete'
        );
        
        if (confirm.isConfirmed) {
            try {
                window.app.ui.showLoading();
                await window.app.api.delete(`/admin/groups/${groupId}`);
                await this.loadGroups();
                window.app.ui.showSuccess('Success', 'Group deleted successfully');
            } catch (error) {
                console.error('Failed to delete group:', error);
                window.app.ui.showError('Delete Error', 'Failed to delete group');
            } finally {
                window.app.ui.hideLoading();
            }
        }
    }

    async saveSystemSettings() {
        const settings = {
            systemName: document.getElementById('system-name').value,
            dataRetentionDays: parseInt(document.getElementById('data-retention').value),
            apiRateLimit: parseInt(document.getElementById('api-rate-limit').value),
            maintenanceMode: document.getElementById('maintenance-mode').checked
        };
        
        try {
            window.app.ui.showLoading();
            await window.app.api.put('/admin/settings', settings);
            window.app.ui.showSuccess('Success', 'System settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            window.app.ui.showError('Save Error', 'Failed to save system settings');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    async clearSystemCache() {
        const confirm = await window.app.ui.confirmDialog(
            'Clear Cache', 
            'Are you sure you want to clear the system cache? This may temporarily impact performance.',
            'Clear Cache'
        );
        
        if (confirm.isConfirmed) {
            try {
                window.app.ui.showLoading();
                await window.app.api.post('/admin/clear-cache');
                window.app.ui.showSuccess('Success', 'System cache cleared successfully');
            } catch (error) {
                console.error('Failed to clear cache:', error);
                window.app.ui.showError('Error', 'Failed to clear system cache');
            } finally {
                window.app.ui.hideLoading();
            }
        }
    }

    async purgeOldData() {
        const confirm = await window.app.ui.confirmDialog(
            'Purge Old Data', 
            'Are you sure you want to purge old data? This action is irreversible and will delete analytics data older than the retention period.',
            'Purge Data'
        );
        
        if (confirm.isConfirmed) {
            try {
                window.app.ui.showLoading();
                await window.app.api.post('/admin/purge-old-data');
                window.app.ui.showSuccess('Success', 'Old data purged successfully');
            } catch (error) {
                console.error('Failed to purge old data:', error);
                window.app.ui.showError('Error', 'Failed to purge old data');
            } finally {
                window.app.ui.hideLoading();
            }
        }
    }

    async createSystemBackup() {
        try {
            window.app.ui.showLoading();
            const response = await window.app.api.post('/admin/create-backup');
            
            if (response.downloadUrl) {
                window.app.ui.showSuccess('Backup Created', 'System backup created successfully. Download will start automatically.');
                
                // Trigger download
                const link = document.createElement('a');
                link.href = response.downloadUrl;
                link.download = `system-backup-${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                window.app.ui.showSuccess('Backup Created', 'System backup created successfully.');
            }
        } catch (error) {
            console.error('Failed to create backup:', error);
            window.app.ui.showError('Error', 'Failed to create system backup');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    async exportSystemData() {
        try {
            window.app.ui.showLoading();
            const response = await window.app.api.post('/admin/export-data');
            
            if (response.downloadUrl) {
                window.app.ui.showSuccess('Export Complete', 'System data exported successfully. Download will start automatically.');
                
                // Trigger download
                const link = document.createElement('a');
                link.href = response.downloadUrl;
                link.download = `system-data-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                window.app.ui.showSuccess('Export Complete', 'System data exported successfully.');
            }
        } catch (error) {
            console.error('Failed to export data:', error);
            window.app.ui.showError('Error', 'Failed to export system data');
        } finally {
            window.app.ui.hideLoading();
        }
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

    getLogLevelBadgeClass(level) {
        switch (level) {
            case 'error': return 'bg-danger';
            case 'warning': return 'bg-warning text-dark';
            case 'info': return 'bg-info';
            default: return 'bg-secondary';
        }
    }
}