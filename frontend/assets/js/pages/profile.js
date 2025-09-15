export default class ProfilePage {
    async init() {
        this.loadProfileData();
        this.setupEventListeners();
    }

    loadProfileData() {
        const user = window.app.currentUser;
        
        document.getElementById('username').value = user.username;
        document.getElementById('role').value = this.formatRole(user.role);
        document.getElementById('group').value = user.groupName || 'N/A';
        document.getElementById('created').value = new Date(user.createdAt).toLocaleString();
    }

    setupEventListeners() {
        document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                window.app.ui.showError('Error', 'Please fill in all password fields');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                window.app.ui.showError('Error', 'New passwords do not match');
                return;
            }
            
            try {
                window.app.ui.showLoading();
                
                await window.app.api.put('/auth/change-password', {
                    currentPassword,
                    newPassword
                });
                
                window.app.ui.showSuccess('Success', 'Password updated successfully');
                
                // Clear password fields
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
            } catch (error) {
                console.error('Failed to change password:', error);
                window.app.ui.showError('Error', 'Failed to change password. Please check your current password.');
            } finally {
                window.app.ui.hideLoading();
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