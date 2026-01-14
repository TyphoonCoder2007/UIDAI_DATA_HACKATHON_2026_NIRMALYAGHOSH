/**
 * Charts Component
 * 
 * Creates interactive trend charts using Chart.js with real data
 */

let velocityChart = null;
let healthChart = null;

/**
 * Initialize the velocity trend chart
 */
export const initVelocityChart = (metricsData) => {
    const canvas = document.getElementById('velocity-chart');
    if (!canvas || !window.Chart) {
        console.warn('Velocity chart canvas or Chart.js not available');
        return null;
    }

    // Destroy existing chart if any
    if (velocityChart) {
        velocityChart.destroy();
    }

    // Get top 10 states by velocity
    const states = Object.values(metricsData)
        .filter(m => m.enrollment_velocity_7d > 0)
        .sort((a, b) => b.enrollment_velocity_7d - a.enrollment_velocity_7d)
        .slice(0, 10);

    const labels = states.map(s => s.state.substring(0, 15));
    const velocity7d = states.map(s => s.enrollment_velocity_7d || 0);
    const velocity30d = states.map(s => s.enrollment_velocity_30d || 0);

    velocityChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: '7-day Velocity',
                    data: velocity7d,
                    backgroundColor: 'rgba(255, 107, 53, 0.8)',
                    borderColor: '#FF6B35',
                    borderWidth: 1
                },
                {
                    label: '30-day Velocity',
                    data: velocity30d,
                    backgroundColor: 'rgba(23, 162, 184, 0.8)',
                    borderColor: '#17a2b8',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim() || '#1a1a2e'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.raw)}/day`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#6c757d'
                    },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#6c757d',
                        callback: (value) => formatNumber(value)
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });

    return velocityChart;
};

/**
 * Initialize the health score comparison chart
 */
export const initHealthChart = (metricsData) => {
    const canvas = document.getElementById('health-chart');
    if (!canvas || !window.Chart) {
        console.warn('Health chart canvas or Chart.js not available');
        return null;
    }

    // Destroy existing chart if any
    if (healthChart) {
        healthChart.destroy();
    }

    // Get all states sorted by health score
    const states = Object.values(metricsData)
        .filter(m => m.health_score !== undefined)
        .sort((a, b) => b.health_score - a.health_score)
        .slice(0, 15);

    const labels = states.map(s => s.state.substring(0, 12));
    const scores = states.map(s => s.health_score || 0);
    const colors = scores.map(s => {
        if (s >= 70) return 'rgba(40, 167, 69, 0.8)';
        if (s >= 40) return 'rgba(253, 126, 20, 0.8)';
        return 'rgba(220, 53, 69, 0.8)';
    });

    healthChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Health Score',
                data: scores,
                backgroundColor: colors,
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Health Score: ${ctx.raw.toFixed(0)}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#6c757d'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                y: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#6c757d'
                    },
                    grid: { display: false }
                }
            }
        }
    });

    return healthChart;
};

/**
 * Update charts with new data
 */
export const updateCharts = (metricsData) => {
    initVelocityChart(metricsData);
    initHealthChart(metricsData);
};

/**
 * Format number for tooltips
 */
const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
};

export default { initVelocityChart, initHealthChart, updateCharts };
