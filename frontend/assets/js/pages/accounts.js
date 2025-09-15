export default class AccountsPage {
    constructor() {
        this.accounts = [];
        this.dataTable = null;
    }

    async init() {
        await this.loadAccounts();
        this.initDataTable();
        this.setupEventListeners();
    }

    async loadAccounts() {
        try {
            window.app.ui.showLoading();
            this.accounts = await window.app.api.get('/accounts');
            this.renderAccounts();
        } catch (error) {
            console.error('Failed to load accounts:', error);
            window.app.ui.showError('Load Error', 'Failed to load accounts');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    renderAccounts() {
        const tableBody = document.querySelector('#accountsTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = this.accounts.map(account => `
            <tr>
                <td>${account.accountName}</td>
                <td>${account.nickname}</td>
                <td>${account.followers.toLocaleString()}</td>
                <td>${account.following.toLocaleString()}</td>
                <td>${account.videos}</td>
                <td>${account.likes.toLocaleString()}</td>
                <td>${account.groupName}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-account-btn" data-id="${account.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning edit-account-btn" data-id="${account.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-account-btn" data-id="${account.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    initDataTable() {
        if ($.fn.DataTable.isDataTable('#accountsTable')) {
            this.dataTable = $('#accountsTable').DataTable().destroy();
        }
        
        this.dataTable = $('#accountsTable').DataTable({
            responsive: true,
            order: [[2, 'desc']] // Sort by followers descending
        });
    }

    setupEventListeners() {
        // Add account button
        document.getElementById('add-account-btn')?.addEventListener('click', () => {
            this.showAddAccountModal();
        });
        
        // Refresh button
        document.getElementById('refresh-accounts-btn')?.addEventListener('click', () => {
            this.loadAccounts();
        });
        
        // View account buttons
        document.querySelectorAll('.view-account-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accountId = e.currentTarget.getAttribute('data-id');
                this.viewAccount(accountId);
            });
        });
        
        // Edit account buttons
        document.querySelectorAll('.edit-account-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accountId = e.currentTarget.getAttribute('data-id');
                this.editAccount(accountId);
            });
        });
        
        // Delete account buttons
        document.querySelectorAll('.delete-account-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accountId = e.currentTarget.getAttribute('data-id');
                this.deleteAccount(accountId);
            });
        });
    }

    showAddAccountModal() {
        // In a real app, this would show a modal with a form to add a new account
        window.app.ui.showSuccess('Add Account', 'This would open a modal to add a new account in a real implementation.');
    }

    viewAccount(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (account) {
            window.app.ui.showSuccess('View Account', `Viewing account: ${account.accountName}`);
        }
    }

    editAccount(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (account) {
            window.app.ui.showSuccess('Edit Account', `Editing account: ${account.accountName}`);
        }
    }

    async deleteAccount(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (!account) return;
        
        const confirm = await window.app.ui.confirmDialog(
            'Delete Account', 
            `Are you sure you want to delete ${account.accountName}? This action cannot be undone.`,
            'Delete'
        );
        
        if (confirm.isConfirmed) {
            try {
                window.app.ui.showLoading();
                await window.app.api.delete(`/accounts/${accountId}`);
                await this.loadAccounts();
                window.app.ui.showSuccess('Success', 'Account deleted successfully');
            } catch (error) {
                console.error('Failed to delete account:', error);
                window.app.ui.showError('Delete Error', 'Failed to delete account');
            } finally {
                window.app.ui.hideLoading();
            }
        }
    }
}