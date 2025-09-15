export default class DashboardPage {
    async init() {
        await this.loadDashboardData();
        this.setupEventListeners();
    }

    async loadDashboardData() {
        try {
            window.app.ui.showLoading();
            
            // Load stats
            const stats = await window.app.api.get('/dashboard/stats');
            this.renderStats(stats);
            
            // Load charts
            const chartData = await window.app.api.get('/dashboard/charts');
            this.renderCharts(chartData);
            
            // Load recent accounts
            const accounts = await window.app.api.get('/accounts/recent');
            this.renderRecentAccounts(accounts);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            window.app.ui.showError('Data Load Error', 'Failed to load dashboard data');
        } finally {
            window.app.ui.hideLoading();
        }
    }

    renderStats(stats) {
        const container = document.getElementById('stats-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-primary shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                    Total Accounts</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.totalAccounts}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-user-circle fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-success shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                    Total Followers</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.totalFollowers.toLocaleString()}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-users fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-info shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                    Videos Tracked</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.totalVideos.toLocaleString()}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-video fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-warning shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                    Daily Growth</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">
                                    ${stats.dailyGrowth > 0 ? '+' : ''}${stats.dailyGrowth.toLocaleString()}
                                    <span class="small ${stats.dailyGrowth > 0 ? 'text-success' : stats.dailyGrowth < 0 ? 'text-danger' : 'text-secondary'}">
                                        <i class="fas ${stats.dailyGrowth > 0 ? 'fa-arrow-up' : stats.dailyGrowth < 0 ? 'fa-arrow-down' : 'fa-equals'}"></i>
                                        ${Math.abs(stats.dailyGrowthPercent)}%
                                    </span>
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-chart-line fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCharts(chartData) {
        // Follower Growth Chart
        const followerCtx = document.getElementById('followerGrowthChart');
        if (followerCtx) {
            new Chart(followerCtx, {
                type: 'line',
                data: {
                    labels: chartData.followerGrowth.labels,
                    datasets: [{
                        label: 'Follower Growth',
                        data: chartData.followerGrowth.data,
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
        
        // Account Distribution Chart
        const accountCtx = document.getElementById('accountDistributionChart');
        if (accountCtx) {
            const accountChart = new Chart(accountCtx, {
                type: 'doughnut',
                data: {
                    labels: chartData.accountDistribution.labels,
                    datasets: [{
                        data: chartData.accountDistribution.data,
                        backgroundColor: [
                            'rgba(78, 115, 223, 0.8)',
                            'rgba(28, 200, 138, 0.8)',
                            'rgba(54, 185, 204, 0.8)',
                            'rgba(246, 194, 62, 0.8)'
                        ],
                        hoverBackgroundColor: [
                            'rgba(78, 115, 223, 1)',
                            'rgba(28, 200, 138, 1)',
                            'rgba(54, 185, 204, 1)',
                            'rgba(246, 194, 62, 1)'
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
            const legendContainer = document.getElementById('chart-legend');
            if (legendContainer) {
                legendContainer.innerHTML = chartData.accountDistribution.labels.map((label, i) => `
                    <span class="me-3">
                        <i class="fas fa-circle" style="color: ${accountChart.data.datasets[0].backgroundColor[i]}"></i>
                        <span class="me-1">${label}</span>
                        <span class="fw-bold">(${chartData.accountDistribution.data[i]})</span>
                    </span>
                `).join('');
            }
        }
    }

    renderRecentAccounts(accounts) {
        const tableBody = document.querySelector('#recentAccountsTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = accounts.map(account => `
            <tr>
                <td>${account.accountName}</td>
                <td>${account.nickname}</td>
                <td>${account.followers.toLocaleString()}</td>
                <td>${account.videos}</td>
                <td>
                    <span class="badge ${account.status === 'active' ? 'bg-success' : 'bg-warning'}">
                        ${account.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Add any dashboard-specific event listeners here
    }
}