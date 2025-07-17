// charts.js - Chart Generation and Management
window.InventoryCharts = {
    chartInstances: {},

    generateCharts: function(data) {
        // Clear existing charts
        this.clearAllCharts();
        
        // Generate all chart types
        this.generateDeviceModelChart(data);
        this.generateRemoteOfficeChart(data);
        this.generateWarrantyStatusChart(data);
        this.generateWarrantyTimelineChart(data);
        this.generateTechAssignedChart(data);
        this.generateTechPerformanceChart(data);
    },

    clearAllCharts: function() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                } catch (error) {
                    console.log('Chart cleanup issue:', error);
                }
            }
        });
        // Clear the chartInstances object
        Object.keys(this.chartInstances).forEach(key => delete this.chartInstances[key]);
    },

    toggleChartType: function(chartId, newType, buttonElement) {
        const chartKey = chartId.replace('Chart', '');
        const chart = this.chartInstances[chartKey];
        
        if (chart) {
            chart.destroy();
            
            // Update button states
            const parentControls = buttonElement.parentElement;
            parentControls.querySelectorAll('.chart-toggle-btn').forEach(btn => {
                if (btn.textContent.includes('Doughnut') || btn.textContent.includes('Bar') || 
                    btn.textContent.includes('Line') || btn.textContent.includes('Pie')) {
                    btn.classList.remove('active');
                }
            });
            buttonElement.classList.add('active');

            // Get current data
            const currentData = window.InventoryFileUpload.getCurrentData();

            // Regenerate chart with new type
            switch (chartKey) {
                case 'deviceModel':
                    this.generateDeviceModelChart(currentData, newType);
                    break;
                case 'remoteOffice':
                    this.generateRemoteOfficeChart(currentData, newType);
                    break;
                case 'warrantyStatus':
                    this.generateWarrantyStatusChart(currentData, newType);
                    break;
                case 'warrantyTimeline':
                    this.generateWarrantyTimelineChart(currentData, newType);
                    break;
                case 'techAssigned':
                    this.generateTechAssignedChart(currentData, newType);
                    break;
                case 'techPerformance':
                    this.generateTechPerformanceChart(currentData, newType);
                    break;
            }
        }
    },

    generateDeviceModelChart: function(data, chartType = 'doughnut') {
        const modelCounts = {};
        data.forEach(item => {
            const model = item.deviceModel || 'Unknown';
            modelCounts[model] = (modelCounts[model] || 0) + 1;
        });

        const sortedModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]);

        const ctx = document.getElementById('deviceModelChart');
        if (!ctx) return;

        this.chartInstances.deviceModel = new Chart(ctx, {
            type: chartType,
            data: {
                labels: sortedModels.map(([model]) => model),
                datasets: [{
                    label: 'Number of Devices',
                    data: sortedModels.map(([, count]) => count),
                    backgroundColor: window.InventoryConfig.CHART_COLORS.primary,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                onClick: function(event, elements) {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const model = sortedModels[index][0];
                        window.InventoryFilters.applyFilter('deviceModel', model);
                    }
                }
            }
        });

        this.updateChartInfo('deviceModelInfo', sortedModels, data, 'model');
    },

    generateRemoteOfficeChart: function(data, chartType = 'bar') {
        const officeCounts = {};
        data.forEach(item => {
            const office = item.remoteOffice || 'Unknown';
            officeCounts[office] = (officeCounts[office] || 0) + 1;
        });

        const sortedOffices = Object.entries(officeCounts).sort((a, b) => b[1] - a[1]);

        const ctx = document.getElementById('remoteOfficeChart');
        if (!ctx) return;

        this.chartInstances.remoteOffice = new Chart(ctx, {
            type: chartType,
            data: {
                labels: sortedOffices.map(([office]) => office),
                datasets: [{
                    label: 'Number of Devices',
                    data: sortedOffices.map(([, count]) => count),
                    backgroundColor: chartType === 'line' ? 'rgba(59, 130, 246, 0.1)' : '#3b82f6',
                    borderColor: '#1e40af',
                    borderWidth: chartType === 'line' ? 3 : 1,
                    fill: chartType === 'line' ? true : false,
                    tension: chartType === 'line' ? 0.2 : undefined
                }]
            },
            options: {
                responsive: true,
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
                },
                onClick: function(event, elements) {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const office = sortedOffices[index][0];
                        window.InventoryFilters.applyFilter('remoteOffice', office);
                    }
                }
            }
        });

        this.updateChartInfo('remoteOfficeInfo', sortedOffices, data, 'office');
    },

    generateWarrantyStatusChart: function(data, chartType = 'pie') {
        const now = new Date();
        const statuses = { 'Active': 0, 'Expired': 0, 'Unknown': 0 };

        data.forEach(item => {
            if (!item.warrantyExpiry) {
                statuses['Unknown']++;
            } else if (item.warrantyExpiry < now) {
                statuses['Expired']++;
            } else {
                statuses['Active']++;
            }
        });

        const ctx = document.getElementById('warrantyStatusChart');
        if (!ctx) return;

        this.chartInstances.warrantyStatus = new Chart(ctx, {
            type: chartType,
            data: {
                labels: Object.keys(statuses),
                datasets: [{
                    data: Object.values(statuses),
                    backgroundColor: [
                        window.InventoryConfig.CHART_COLORS.warranty.active, 
                        window.InventoryConfig.CHART_COLORS.warranty.expired, 
                        window.InventoryConfig.CHART_COLORS.warranty.unknown
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                onClick: function(event, elements) {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const status = Object.keys(statuses)[index];
                        window.InventoryFilters.applyFilter('warrantyStatus', status);
                    }
                }
            }
        });

        // Update info text
        const expiredPercentage = ((statuses['Expired'] / data.length) * 100).toFixed(1);
        const infoElement = document.getElementById('warrantyStatusInfo');
        if (infoElement) {
            infoElement.innerHTML = 
                `<strong>${statuses['Expired']}</strong> devices (${expiredPercentage}%) have expired warranties and may need attention.`;
        }
    },

    generateWarrantyTimelineChart: function(data, chartType = 'line') {
        const validWarranties = data.filter(d => d.warrantyExpiry);
        const timelineCounts = {};
        
        validWarranties.forEach(item => {
            const date = item.warrantyExpiry;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            timelineCounts[key] = (timelineCounts[key] || 0) + 1;
        });

        const sortedKeys = Object.keys(timelineCounts).sort();
        const labels = sortedKeys.map(key => {
            const [year, month] = key.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });

        const ctx = document.getElementById('warrantyTimelineChart');
        if (!ctx) return;

        this.chartInstances.warrantyTimeline = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Warranties Expiring',
                    data: sortedKeys.map(key => timelineCounts[key]),
                    borderColor: '#1e40af',
                    backgroundColor: chartType === 'line' ? 'rgba(30, 64, 175, 0.1)' : '#3b82f6',
                    borderWidth: chartType === 'line' ? 3 : 1,
                    fill: chartType === 'line' ? true : false,
                    tension: chartType === 'line' ? 0.2 : undefined
                }]
            },
            options: {
                responsive: true,
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

        // Update info text
        if (sortedKeys.length > 0) {
            const peakMonth = sortedKeys.reduce((a, b) => timelineCounts[a] > timelineCounts[b] ? a : b);
            const peakLabel = new Date(peakMonth.split('-')[0], peakMonth.split('-')[1] - 1)
                .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const infoElement = document.getElementById('warrantyTimelineInfo');
            if (infoElement) {
                infoElement.innerHTML = 
                    `Peak expiry month: <strong>${peakLabel}</strong> with ${timelineCounts[peakMonth]} warranties expiring.`;
            }
        }
    },

    generateTechAssignedChart: function(data, chartType = 'doughnut') {
        const techCounts = {};
        data.forEach(item => {
            const tech = item.techAssigned || 'Unassigned';
            techCounts[tech] = (techCounts[tech] || 0) + 1;
        });

        const sortedTechs = Object.entries(techCounts).sort((a, b) => b[1] - a[1]);

        const ctx = document.getElementById('techAssignedChart');
        if (!ctx) return;

        this.chartInstances.techAssigned = new Chart(ctx, {
            type: chartType,
            data: {
                labels: sortedTechs.map(([tech]) => tech),
                datasets: [{
                    label: 'Devices Assigned',
                    data: sortedTechs.map(([, count]) => count),
                    backgroundColor: window.InventoryConfig.CHART_COLORS.tech.slice(0, sortedTechs.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                onClick: function(event, elements) {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const tech = sortedTechs[index][0];
                        window.InventoryFilters.applyFilter('techAssigned', tech);
                    }
                }
            }
        });

        this.updateChartInfo('techAssignedInfo', sortedTechs, data, 'tech');
    },

    generateTechPerformanceChart: function(data, chartType = 'bar') {
        const now = new Date();
        const sixMonthsFromNow = new Date(now.getTime() + window.InventoryConfig.DATE_RANGES.SIX_MONTHS);
        const techPerformance = {};

        // Calculate performance metrics per tech with 4 categories
        data.forEach(item => {
            const tech = item.techAssigned || 'Unassigned';
            if (!techPerformance[tech]) {
                techPerformance[tech] = { 
                    total: 0, 
                    expired: 0, 
                    expiringSoon: 0,  // New category for expiring within 6 months
                    active: 0, 
                    unknown: 0 
                };
            }
            
            techPerformance[tech].total++;
            
            if (!item.warrantyExpiry) {
                techPerformance[tech].unknown++;
            } else if (item.warrantyExpiry < now) {
                techPerformance[tech].expired++;
            } else if (item.warrantyExpiry <= sixMonthsFromNow) {
                techPerformance[tech].expiringSoon++;  // Expires within 6 months but still active
            } else {
                techPerformance[tech].active++;  // Active with more than 6 months left
            }
        });

        const techs = Object.keys(techPerformance);
        const expiredData = techs.map(tech => techPerformance[tech].expired);
        const expiringSoonData = techs.map(tech => techPerformance[tech].expiringSoon);
        const activeData = techs.map(tech => techPerformance[tech].active);
        const unknownData = techs.map(tech => techPerformance[tech].unknown);

        const ctx = document.getElementById('techPerformanceChart');
        if (!ctx) return;

        this.chartInstances.techPerformance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: techs,
                datasets: [
                    {
                        label: 'Active (>6 months)',
                        data: activeData,
                        backgroundColor: window.InventoryConfig.CHART_COLORS.warranty.active
                    },
                    {
                        label: 'Expiring Soon (<6 months)',
                        data: expiringSoonData,
                        backgroundColor: window.InventoryConfig.CHART_COLORS.warranty.expiringSoon
                    },
                    {
                        label: 'Expired',
                        data: expiredData,
                        backgroundColor: window.InventoryConfig.CHART_COLORS.warranty.expired
                    },
                    {
                        label: 'Unknown Status',
                        data: unknownData,
                        backgroundColor: window.InventoryConfig.CHART_COLORS.warranty.unknown
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        stacked: chartType === 'bar',
                        ticks: {
                            maxRotation: 45
                        }
                    },
                    y: { 
                        stacked: chartType === 'bar',
                        beginAtZero: true 
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                onClick: function(event, elements) {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const tech = techs[index];
                        window.InventoryModals.showTechPerformanceDetails(tech, techPerformance[tech], data);
                    }
                }
            }
        });

        // Calculate performance score: (active + expiring soon) / total * 100
        // This gives credit for warranties that are still valid but need attention
        let bestTech = '';
        let bestScore = 0;
        let worstTech = '';
        let worstScore = 100;
        
        Object.entries(techPerformance).forEach(([tech, stats]) => {
            const performanceScore = ((stats.active + stats.expiringSoon) / stats.total) * 100;
            
            if (performanceScore > bestScore) {
                bestScore = performanceScore;
                bestTech = tech;
            }
            
            if (performanceScore < worstScore) {
                worstScore = performanceScore;
                worstTech = tech;
            }
        });

        const infoElement = document.getElementById('techPerformanceInfo');
        if (infoElement && worstTech) {
            infoElement.innerHTML = 
                `Best performer: <strong>${bestTech}</strong> (${bestScore.toFixed(1)}% valid warranties) | 
                 Needs attention: <strong>${worstTech}</strong> (${worstScore.toFixed(1)}% valid warranties)`;
        }
    },

    updateChartInfo: function(elementId, sortedData, allData, type) {
        if (sortedData.length > 0) {
            const topItem = sortedData[0];
            const infoElement = document.getElementById(elementId);
            if (infoElement) {
                const percentage = ((topItem[1] / allData.length) * 100).toFixed(1);
                let label = '';
                
                switch (type) {
                    case 'model':
                        label = `Most common model: <strong>${topItem[0]}</strong>`;
                        break;
                    case 'office':
                        label = `Largest office: <strong>${topItem[0]}</strong>`;
                        break;
                    case 'tech':
                        label = `Most devices assigned to: <strong>${topItem[0]}</strong>`;
                        break;
                    default:
                        label = `Top item: <strong>${topItem[0]}</strong>`;
                }
                
                infoElement.innerHTML = `${label} (${topItem[1]} devices, ${percentage}%)`;
            }
        }
    }
};