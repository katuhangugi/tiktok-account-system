/**
 * Chart.js Initialization and Custom Configuration
 */

// Register Chart.js plugins
Chart.register(
    Chart.LineController,
    Chart.BarController,
    Chart.PieController,
    Chart.DoughnutController,
    Chart.LineElement,
    Chart.BarElement,
    Chart.ArcElement,
    Chart.PointElement,
    Chart.LinearScale,
    Chart.CategoryScale,
    Chart.TimeScale,
    Chart.Legend,
    Chart.Title,
    Chart.Tooltip,
    Chart.Filler
);

// Global Chart.js configuration
Chart.defaults.font.family = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#858796';
Chart.defaults.borderColor = 'rgba(234, 236, 244, 1)';
Chart.defaults.plugins.legend.display = false;
Chart.defaults.plugins.tooltip.backgroundColor = "rgb(255,255,255)";
Chart.defaults.plugins.tooltip.bodyColor = "#858796";
Chart.defaults.plugins.tooltip.titleColor = '#6e707e';
Chart.defaults.plugins.tooltip.titleMarginBottom = 10;
Chart.defaults.plugins.tooltip.borderColor = '#dddfeb';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 3;
Chart.defaults.plugins.tooltip.displayColors = false;
Chart.defaults.plugins.tooltip.intersect = false;
Chart.defaults.plugins.tooltip.mode = 'index';
Chart.defaults.plugins.tooltip.position = 'nearest';
Chart.defaults.plugins.tooltip.xPadding = 15;
Chart.defaults.plugins.tooltip.yPadding = 15;

// Custom chart types and utilities
export function createLineChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: "rgba(234, 236, 244, 1)",
                        drawBorder: false,
                        zeroLineColor: "rgba(234, 236, 244, 1)"
                    },
                    ticks: {
                        padding: 20
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 0
                    }
                }
            },
            ...options
        }
    });
}

export function createBarChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(234, 236, 244, 1)",
                        drawBorder: false,
                        zeroLineColor: "rgba(234, 236, 244, 1)"
                    },
                    ticks: {
                        padding: 20
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 45
                    }
                }
            },
            ...options
        }
    });
}

export function createPieChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            cutout: '70%',
            ...options
        }
    });
}

// Custom responsive text plugin
const responsiveTextPlugin = {
    id: 'responsiveText',
    beforeDraw(chart) {
        if (chart.config.options.centerText) {
            const { text, color, font } = chart.config.options.centerText;
            const ctx = chart.ctx;
            const width = chart.width;
            const height = chart.height;
            
            ctx.restore();
            ctx.font = font || '16px Nunito, sans-serif';
            ctx.fillStyle = color || '#5a5c69';
            ctx.textBaseline = 'middle';
            
            const textX = Math.round((width - ctx.measureText(text).width) / 2);
            const textY = height / 2;
            
            ctx.fillText(text, textX, textY);
            ctx.save();
        }
    }
};

Chart.register(responsiveTextPlugin);