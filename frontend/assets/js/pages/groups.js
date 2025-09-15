export default class GroupsPage {
    constructor() {
        this.groups = [];
        this.dataTable = null;
    }

    async init() {
        await this.loadGroups();
        this.initDataTable();
        this.setupEventListeners();
    }

    async loadGroups() {
        try {
            window.app.ui.showLoading();
            
            // Load groups based on current user's role
            let endpoint = '/groups';
            if (window.app.currentUser.role === 'manager') {
                endpoint = '/groups/managed';
            }
            
            this.groups = await window.app.api.get(endpoint);
            this.renderGroups();
        } catch (error) {
            console.error('Failed to load groups:', error);
            window.app.ui.showError('Load Error', 'Failed to load groups');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    renderGroups() {
        const tableBody = document.querySelector('#groupsTable tbody');
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
                <td>
                    <button class="btn btn-sm btn-primary view-group-btn" data-id="${group.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning edit-group-btn" data-id="${group.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${this.canDeleteGroup(group) ? `
                    <button class="btn btn-sm btn-danger delete-group-btn" data-id="${group.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    initDataTable() {
        if ($.fn.DataTable.isDataTable('#groupsTable')) {
            this.dataTable = $('#groupsTable').DataTable().destroy();
        }
        
        this.dataTable = $('#groupsTable').DataTable({
            responsive: true,
            order: [[0, 'asc']] // Sort by group name ascending
        });
    }

    setupEventListeners() {
        // Add group button
        document.getElementById('add-group-btn')?.addEventListener('click', () => {
            this.showAddGroupModal();
        });
        
        // View group buttons
        document.querySelectorAll('.view-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupId = e.currentTarget.getAttribute('data-id');
                this.viewGroup(groupId);
            });
        });
        
        // Edit group buttons
        document.querySelectorAll('.edit-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupId = e.currentTarget.getAttribute('data-id');
                this.editGroup(groupId);
            });
        });
        
        // Delete group buttons
        document.querySelectorAll('.delete-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupId = e.currentTarget.getAttribute('data-id');
                this.deleteGroup(groupId);
            });
        });
    }

    showAddGroupModal() {
        // In a real app, this would show a modal with a form to add a new group
        window.app.ui.showSuccess('Add Group', 'This would open a modal to add a new group in a real implementation.');
    }

    viewGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            window.app.ui.showSuccess('View Group', `Viewing group: ${group.name}`);
        }
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
        
        // Check if current user can delete this group
        if (!this.canDeleteGroup(group)) {
            window.app.ui.showError('Permission Denied', 'You do not have permission to delete this group');
            return;
        }
        
        const confirm = await window.app.ui.confirmDialog(
            'Delete Group', 
            `Are you sure you want to delete ${group.name}? This will also remove all members from this group.`,
            'Delete'
        );
        
        if (confirm.isConfirmed) {
            try {
                window.app.ui.showLoading();
                await window.app.api.delete(`/groups/${groupId}`);
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

    canDeleteGroup(group) {
        const currentUser = window.app.currentUser;
        
        // Only super admins can delete groups
        return currentUser.role === 'super_admin';
    }
}