/**
 * Chart module for Expense Tracker
 * Handles Chart.js integration and data visualization
 * @author Praful Singh
 */

class ChartManager {
    constructor() {
        this.chart = null;
        this.chartConfig = {
            type: 'doughnut',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: appConfig.get('chart.animationDuration')
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#FFD700',
                        bodyColor: '#ffffff',
                        borderColor: '#FFD700',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: USD ${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        };
        this.colors = [
            '#FFD700', '#FF6384', '#36A2EB', '#FFCE56',
            '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384',
            '#C9CBCF', '#4BC0C0', '#FF8C00', '#32CD32',
            '#8A2BE2', '#DC143C', '#00CED1', '#FFB6C1'
        ];
    }

    initChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return false;
        }

        const ctx = canvas.getContext('2d');
        
        this.chart = new Chart(ctx, {
            ...this.chartConfig,
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: this.colors,
                    borderColor: '#1a1a1a',
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#FFD700'
                }]
            }
        });

        return true;
    }

    updateChart(transactions) {
        if (!this.chart) return;

        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const categoryTotals = this.calculateCategoryTotals(expenseTransactions);

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        // Update chart data
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.data.datasets[0].backgroundColor = this.colors.slice(0, labels.length);

        // Update the chart
        this.chart.update('active');

        // Show/hide empty state
        this.toggleEmptyState(labels.length === 0);
    }

    calculateCategoryTotals(transactions) {
        const categoryTotals = {};

        transactions.forEach(transaction => {
            const category = transaction.category;
            categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
        });

        // Sort by amount (descending)
        const sortedEntries = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a);

        return Object.fromEntries(sortedEntries);
    }

    toggleEmptyState(isEmpty) {
        const chartContainer = this.chart.canvas.parentElement;
        let emptyState = chartContainer.querySelector('.chart-empty-state');

        if (isEmpty) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'chart-empty-state absolute inset-0 flex items-center justify-center';
                emptyState.innerHTML = `
                    <div class="text-center text-gray-400">
                        <i class="fas fa-chart-pie text-4xl mb-4 opacity-50"></i>
                        <p class="text-lg font-medium">No expense data</p>
                        <p class="text-sm">Add some expenses to see the distribution</p>
                    </div>
                `;
                chartContainer.appendChild(emptyState);
            }
            emptyState.style.display = 'flex';
            this.chart.canvas.style.opacity = '0.1';
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            this.chart.canvas.style.opacity = '1';
        }
    }

    exportChart() {
        if (!this.chart) return null;

        try {
            return this.chart.toBase64Image('image/png', 1.0);
        } catch (error) {
            console.error('Failed to export chart:', error);
            return null;
        }
    }

    resizeChart() {
        if (this.chart) {
            this.chart.resize();
        }
    }

    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    // Alternative chart types for future enhancements
    createBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        
        return new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return 'USD ' + value.toFixed(2);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }

    createLineChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        
        return new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return 'USD ' + value.toFixed(2);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.4
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
    }
}

// Create global chart manager instance
const chartManager = new ChartManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
