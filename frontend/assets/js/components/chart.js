export class ChartComponent {
    constructor(canvasId, type = 'line', options = {}) {
        this.canvasId = canvasId;
        this.type = type;
        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                }
            },
            ...options
        };
        this.chart = null;
    }

    init(data) {
        const ctx = document.getElementById(this.canvasId);
        if (!ctx) return;
        
        // Destroy previous chart if exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: this.type,
            data: data,
            options: this.options
        });
    }

    update(data) {
        if (!this.chart) return;
        
        this.chart.data = data;
        this.chart.update();
    }

    addDataset(dataset) {
        if (!this.chart) return;
        
        this.chart.data.datasets.push(dataset);
        this.chart.update();
    }

    removeDataset(datasetIndex) {
        if (!this.chart) return;
        
        this.chart.data.datasets.splice(datasetIndex, 1);
        this.chart.update();
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    static createTrendIndicator(value, percent) {
        const trendClass = value > 0 ? 'trend-up' : value < 0 ? 'trend-down' : 'trend-neutral';
        const trendIcon = value > 0 ? 'fa-arrow-up' : value < 0 ? 'fa-arrow-down' : 'fa-equals';
        
        return `
            <span class="${trendClass}">
                <i class="fas ${trendIcon} me-1"></i>
                ${Math.abs(value).toLocaleString()}
                <small>(${value > 0 ? '+' : ''}${percent}%)</small>
            </span>
        `;
    }

    static createMiniChart(canvasId, data, type = 'line') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        return new Chart(canvas, {
            type: type,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: {
                    point: { radius: 0 }
                }
            }
        });
    }
}