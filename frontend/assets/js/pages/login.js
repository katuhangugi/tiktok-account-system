export default class LoginPage {
    async init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                    window.app.ui.showLoading();
                    const success = await window.app.auth.login(username, password);
                    
                    if (success) {
                        window.location.hash = '#/dashboard';
                    }
                } catch (error) {
                    window.app.ui.showError('Login Failed', 'Invalid username or password');
                } finally {
                    window.app.ui.hideLoading();
                }
            });
        }
    }
}