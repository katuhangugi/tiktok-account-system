export default class AnalyticsPage {
    constructor() {
        this.accounts = [];
        this.analyticsData = [];
        this.followerChart = null;
        this.videoChart = null;
        this.dataTable = null;
    }

    async init() {
        await this.loadAccounts();
        await this.loadAnalyticsData();
        this.initCharts();
        this.initDataTable();
        this.setupEventListeners();
    }

    async loadAccounts() {
        try {
            window.app.ui.showLoading();
            
            // Load accounts based on current user's permissions
            this.accounts = await window.app.api.get('/accounts');
            
            // Populate account select dropdown
            const accountSelect = document.getElementById('account-select');
            if (accountSelect) {
                accountSelect.innerHTML = `
                    <option value="">All Accounts</option>
                    ${this.accounts.map(account => `
                        <option value="${account.id}">${account.accountName} (${account.nickname})</option>
                    `).join('')}
                `;
            }
        } catch (error) {
            console.error('Failed to load accounts:', error);
            window.app.ui.showError('Load Error', 'Failed to load accounts');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    async loadAnalyticsData() {
        try {
            window.app.ui.showLoading();
            
            const accountId = document.getElementById('account-select').value;
            const timeRange = document.getElementById('time-range-select').value;
            
            let endpoint = '/analytics';
            if (accountId) {
                endpoint += `?accountId=${accountId}&days=${timeRange}`;
            } else {
                endpoint += `?days=${timeRange}`;
            }
            
            this.analyticsData = await window.app.api.get(endpoint);
            this.renderAnalyticsTable();
            
            // Update charts if an account is selected
            if (accountId) {
                this.updateCharts();
            }
        } catch (error) {
            console.error('Failed to load analytics data:', error);
            window.app.ui.showError('Load Error', 'Failed to load analytics data');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    renderAnalyticsTable() {
        const tableBody = document.querySelector('#analyticsTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = this.analyticsData.map(data => `
            <tr>
                <td>${data.accountName}</td>
                <td>${data.currentFollowers.toLocaleString()}</td>
                <td class="${this.getTrendClass(data.followerGrowth7d)}">
                    ${data.followerGrowth7d > 0 ? '+' : ''}${data.followerGrowth7d.toLocaleString()}
                    <small>(${data.followerGrowthPercent7d > 0 ? '+' : ''}${data.followerGrowthPercent7d}%)</small>
                </td>
                <td class="${this.getTrendClass(data.followerGrowth30d)}">
                    ${data.followerGrowth30d > 0 ? '+' : ''}${data.followerGrowth30d.toLocaleString()}
                    <small>(${data.followerGrowthPercent30d > 0 ? '+' : ''}${data.followerGrowthPercent30d}%)</small>
                </td>
                <td>${data.totalVideos.toLocaleString()}</td>
                <td class="${this.getTrendClass(data.videoUploads7d)}">
                    ${data.videoUploads7d > 0 ? '+' : ''}${data.videoUploads7d}
                </td>
                <td class="${this.getTrendClass(data.videoUploads30d)}">
                    ${data.videoUploads30d > 0 ? '+' : ''}${data.videoUploads30d}
                </td>
                <td>${data.engagementRate.toFixed(2)}%</td>
            </tr>
        `).join('');
    }

    initCharts() {
        const followerCtx = document.getElementById('followerChart');
        if (followerCtx) {
            this.followerChart = new Chart(followerCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Followers',
                        data: [],
                        backgroundColor: 'rgba(78, 115, 223, 0.05)',
                        borderColor: 'rgba(78, 115, 223, 1)',
                        pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
                        fill: true
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false
                        }
                    }
                }
            });
        }
        
        const videoCtx = document.getElementById('videoChart');
        if (videoCtx) {
            this.videoChart = new Chart(videoCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Video Uploads',
                        data: [],
                        backgroundColor: 'rgba(28, 200, 138, 0.8)',
                        hoverBackgroundColor: 'rgba(28, 200, 138, 1)',
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    updateCharts() {
        const accountId = document.getElementById('account-select').value;
        if (!accountId) return;
        
        const accountData = this.analyticsData.find(d => d.accountId === accountId);
        if (!accountData || !accountData.dailyData) return;
        
        // Update follower chart
        if (this.followerChart) {
            this.followerChart.data.labels = accountData.dailyData.map(d => d.date);
            this.followerChart.data.datasets[0].data = accountData.dailyData.map(d => d.followers);
            this.followerChart.update();
        }
        
        // Update video chart
        if (this.videoChart) {
            this.videoChart.data.labels = accountData.dailyData.map(d => d.date);
            this.videoChart.data.datasets[0].data = accountData.dailyData.map(d => d.videos);
            this.videoChart.update();
        }
    }

    initDataTable() {
        if ($.fn.DataTable.isDataTable('#analyticsTable')) {
            this.dataTable = $('#analyticsTable').DataTable().destroy();
        }
        
        this.dataTable = $('#analyticsTable').DataTable({
            responsive: true,
            order: [[1, 'desc']] // Sort by followers descending
        });
    }

    setupEventListeners() {
        // Account select change
        document.getElementById('account-select')?.addEventListener('change', () => {
            this.loadAnalyticsData();
        });
        
        // Time range select change
        document.getElementById('time-range-select')?.addEventListener('change', () => {
            this.loadAnalyticsData();
        });
        
        // Refresh button
        document.getElementById('refresh-analytics-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadAnalyticsData();
        });
        
        // Export button
        document.getElementById('export-analytics-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.app.ui.showSuccess('Export', 'This would export analytics data in a real implementation.');
        });
    }

    getTrendClass(value) {
        if (value > 0) return 'text-success';
        if (value < 0) return 'text-danger';
        return 'text-secondary';
    }
}