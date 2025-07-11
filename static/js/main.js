let chartInstances = {};
let currentData = [];

// Theme Management
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'light') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// Initialize theme from localStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-icon').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// File upload functionality
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
        processFile(file);
    } else {
        showStatus('Please upload a valid .xlsx file', 'error');
    }
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && file.name.endsWith('.xlsx')) {
        processFile(file);
    } else {
        showStatus('Please upload a valid .xlsx file', 'error');
    }
});

async function processFile(file) {
    showStatus('Processing file...', 'info');
    showLoading(true);

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const processedData = result.data.map(item => ({
                computerName: item.computerName,
                deviceModel: item.deviceModel,
                remoteOffice: item.remoteOffice,
                warrantyExpiry: parseDate(item.warrantyExpiry)
            })).filter(item => item.computerName && item.computerName !== 'Unknown');

            currentData = processedData;
            generateAnalytics(processedData);
            showStatus(result.message, 'success');
            showLoading(false);
            document.getElementById('mainContent').style.display = 'block';
            document.getElementById('exportSection').style.display = 'block';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showStatus('Error processing file: ' + error.message, 'error');
        showLoading(false);
    }
}

function parseDate(dateStr) {
    if (!dateStr || dateStr === 'None') return null;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
}

// AI Insights Generation
function generateAIInsights(data) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const expiredCount = data.filter(d => d.warrantyExpiry && d.warrantyExpiry < now).length;
    const expiringSoon = data.filter(d => d.warrantyExpiry && d.warrantyExpiry <= thirtyDaysFromNow && d.warrantyExpiry >= now).length;
    const expiringInQuarter = data.filter(d => d.warrantyExpiry && d.warrantyExpiry <= ninetyDaysFromNow && d.warrantyExpiry >= now).length;
    
    const modelCounts = {};
    data.forEach(item => {
        modelCounts[item.deviceModel] = (modelCounts[item.deviceModel] || 0) + 1;
    });
    const mostCommonModel = Object.keys(modelCounts).reduce((a, b) => modelCounts[a] > modelCounts[b] ? a : b);

    const insights = [
        {
            icon: 'fas fa-exclamation-triangle',
            number: expiringSoon,
            text: `devices have warranties expiring within the next 30 days. Immediate action recommended for renewal or replacement planning.`,
            type: expiringSoon > 0 ? 'danger' : 'success'
        },
        {
            icon: 'fas fa-calendar-check',
            number: expiringInQuarter,
            text: `devices will need warranty attention in the next 90 days. Start planning procurement cycles now.`,
            type: expiringInQuarter > 10 ? 'warning' : 'success'
        },
        {
            icon: 'fas fa-laptop',
            number: modelCounts[mostCommonModel],
            text: `devices are ${mostCommonModel} models (${((modelCounts[mostCommonModel] / data.length) * 100).toFixed(1)}% of inventory). Consider bulk warranty negotiations.`,
            type: 'info'
        },
        {
            icon: 'fas fa-times-circle',
            number: expiredCount,
            text: `devices currently have expired warranties and may be operating without coverage. Priority attention needed.`,
            type: expiredCount > 0 ? 'danger' : 'success'
        }
    ];

    const insightsHtml = insights.map(insight => `
        <div class="ai-insight-card ${insight.type}">
            <div class="ai-insight-icon">
                <i class="${insight.icon}"></i>
            </div>
            <div class="ai-insight-number">${insight.number}</div>
            <div class="ai-insight-text">${insight.text}</div>
        </div>
    `).join('');

    document.getElementById('aiInsightsGrid').innerHTML = insightsHtml;
}

// Chart Type Toggle
function toggleChartType(chartId, newType, buttonElement) {
    const chartKey = chartId.replace('Chart', '');
    const chart = chartInstances[chartKey];
    
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

        // Regenerate chart with new type
        if (chartKey === 'deviceModel') {
            generateDeviceModelChart(currentData, newType);
        } else if (chartKey === 'remoteOffice') {
            generateRemoteOfficeChart(currentData, newType);
        } else if (chartKey === 'warrantyStatus') {
            generateWarrantyStatusChart(currentData, newType);
        } else if (chartKey === 'warrantyTimeline') {
            generateWarrantyTimelineChart(currentData, newType);
        }
    }
}

// Individual Chart Export
function exportChart(chartId) {
    const canvas = document.getElementById(chartId);
    const link = document.createElement('a');
    link.download = `${chartId}_export.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

// Enhanced tooltip system
function showTooltip(event, content) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = content;
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY + 10 + 'px';
    tooltip.classList.add('show');
}

function hideTooltip() {
    document.getElementById('tooltip').classList.remove('show');
}

// Main analytics generation
function generateAnalytics(data) {
    // Clear existing charts
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};

    generateAIInsights(data);
    generateSummary(data);
    generateCharts(data);
}

function generateSummary(data) {
    const totalDevices = data.length;
    const uniqueModels = new Set(data.map(d => d.deviceModel)).size;
    const uniqueOffices = new Set(data.map(d => d.remoteOffice)).size;

    const now = new Date();
    const expiredWarranties = data.filter(d => d.warrantyExpiry && d.warrantyExpiry < now).length;
    const activeWarranties = data.filter(d => d.warrantyExpiry && d.warrantyExpiry >= now).length;
    const unknownWarranties = data.filter(d => !d.warrantyExpiry).length;

    const summaryHtml = `
        <div class="summary-card" title="Total number of devices in inventory">
            <div class="summary-number">${totalDevices}</div>
            <div class="summary-label">Total Devices</div>
        </div>
        <div class="summary-card" title="Number of unique device models">
            <div class="summary-number">${uniqueModels}</div>
            <div class="summary-label">Device Models</div>
        </div>
        <div class="summary-card" title="Number of remote office locations">
            <div class="summary-number">${uniqueOffices}</div>
            <div class="summary-label">Remote Offices</div>
        </div>
        <div class="summary-card" title="Devices with active warranty coverage">
            <div class="summary-number">${activeWarranties}</div>
            <div class="summary-label">Active Warranties</div>
        </div>
        <div class="summary-card" title="Devices with expired warranties">
            <div class="summary-number">${expiredWarranties}</div>
            <div class="summary-label">Expired Warranties</div>
        </div>
        <div class="summary-card" title="Devices with unknown warranty status">
            <div class="summary-number">${unknownWarranties}</div>
            <div class="summary-label">Unknown Status</div>
        </div>
    `;

    document.getElementById('summaryGrid').innerHTML = summaryHtml;
}

function generateCharts(data) {
    generateDeviceModelChart(data);
    generateRemoteOfficeChart(data);
    generateWarrantyStatusChart(data);
    generateWarrantyTimelineChart(data);
}

function generateDeviceModelChart(data, chartType = 'doughnut') {
    const modelCounts = {};
    data.forEach(item => {
        modelCounts[item.deviceModel] = (modelCounts[item.deviceModel] || 0) + 1;
    });

    const sortedModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]);

    const ctx = document.getElementById('deviceModelChart').getContext('2d');
    chartInstances.deviceModel = new Chart(ctx, {
        type: chartType,
        data: {
            labels: sortedModels.map(([model]) => model),
            datasets: [{
                label: 'Number of Devices',
                data: sortedModels.map(([, count]) => count),
                backgroundColor: [
                    '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd',
                    '#dbeafe', '#1e40af', '#2563eb', '#8b5cf6'
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
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const model = context[0].label;
                            const devices = data.filter(d => d.deviceModel === model);
                            const deviceList = devices.slice(0, 5).map(d => d.computerName);
                            if (devices.length > 5) {
                                deviceList.push(`... and ${devices.length - 5} more`);
                            }
                            return deviceList;
                        }
                    }
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const model = sortedModels[index][0];
                    const count = sortedModels[index][1];
                    alert(`${model}: ${count} devices\n\nClick on chart elements to filter data (coming soon)`);
                }
            }
        }
    });

    // Add info text
    const topModel = sortedModels[0];
    document.getElementById('deviceModelInfo').innerHTML = 
        `Most common model: <strong>${topModel[0]}</strong> (${topModel[1]} devices, ${((topModel[1] / data.length) * 100).toFixed(1)}%)`;
}

function generateRemoteOfficeChart(data, chartType = 'bar') {
    const officeCounts = {};
    data.forEach(item => {
        officeCounts[item.remoteOffice] = (officeCounts[item.remoteOffice] || 0) + 1;
    });

    const sortedOffices = Object.entries(officeCounts).sort((a, b) => b[1] - a[1]);

    const ctx = document.getElementById('remoteOfficeChart').getContext('2d');
    chartInstances.remoteOffice = new Chart(ctx, {
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
                tension: chartType === 'line' ? 0.2 : undefined,
                pointBackgroundColor: chartType === 'line' ? '#1e40af' : undefined,
                pointBorderColor: chartType === 'line' ? '#ffffff' : undefined,
                pointBorderWidth: chartType === 'line' ? 2 : undefined,
                pointRadius: chartType === 'line' ? 5 : undefined
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const office = context[0].label;
                            const devices = data.filter(d => d.remoteOffice === office);
                            const deviceList = devices.slice(0, 5).map(d => `${d.computerName} (${d.deviceModel})`);
                            if (devices.length > 5) {
                                deviceList.push(`... and ${devices.length - 5} more`);
                            }
                            return deviceList;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const office = sortedOffices[index][0];
                    const count = sortedOffices[index][1];
                    alert(`${office}: ${count} devices\n\nClick on chart elements to filter data (coming soon)`);
                }
            }
        }
    });

    // Add info text
    const topOffice = sortedOffices[0];
    document.getElementById('remoteOfficeInfo').innerHTML = 
        `Largest office: <strong>${topOffice[0]}</strong> (${topOffice[1]} devices, ${((topOffice[1] / data.length) * 100).toFixed(1)}%)`;
}

function generateWarrantyStatusChart(data, chartType = 'pie') {
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

    const ctx = document.getElementById('warrantyStatusChart').getContext('2d');
    chartInstances.warrantyStatus = new Chart(ctx, {
        type: chartType,
        data: {
            labels: Object.keys(statuses),
            datasets: [{
                data: Object.values(statuses),
                backgroundColor: ['#16a34a', '#dc2626', '#6b7280'],
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
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const status = context[0].label;
                            let filteredDevices = [];
                            
                            if (status === 'Active') {
                                filteredDevices = data.filter(d => d.warrantyExpiry && d.warrantyExpiry >= now);
                            } else if (status === 'Expired') {
                                filteredDevices = data.filter(d => d.warrantyExpiry && d.warrantyExpiry < now);
                            } else {
                                filteredDevices = data.filter(d => !d.warrantyExpiry);
                            }
                            
                            const deviceList = filteredDevices.slice(0, 5).map(d => `${d.computerName} (${d.deviceModel})`);
                            if (filteredDevices.length > 5) {
                                deviceList.push(`... and ${filteredDevices.length - 5} more`);
                            }
                            return deviceList;
                        }
                    }
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const status = Object.keys(statuses)[index];
                    const count = Object.values(statuses)[index];
                    alert(`${status} warranties: ${count} devices\n\nClick on chart elements to filter data (coming soon)`);
                }
            }
        }
    });

    // Add info text
    const expiredPercentage = ((statuses['Expired'] / data.length) * 100).toFixed(1);
    document.getElementById('warrantyStatusInfo').innerHTML = 
        `<strong>${statuses['Expired']}</strong> devices (${expiredPercentage}%) have expired warranties and may need attention.`;
}

function generateWarrantyTimelineChart(data, chartType = 'line') {
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

    const ctx = document.getElementById('warrantyTimelineChart').getContext('2d');
    chartInstances.warrantyTimeline = new Chart(ctx, {
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
                tension: chartType === 'line' ? 0.2 : undefined,
                pointBackgroundColor: chartType === 'line' ? '#1e40af' : undefined,
                pointBorderColor: chartType === 'line' ? '#ffffff' : undefined,
                pointBorderWidth: chartType === 'line' ? 2 : undefined,
                pointRadius: chartType === 'line' ? 5 : undefined
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const monthLabel = context[0].label;
                            const devices = getDevicesForMonth(monthLabel);
                            const deviceList = devices.slice(0, 5).map(d => `${d.computerName} (${d.deviceModel})`);
                            if (devices.length > 5) {
                                deviceList.push(`... and ${devices.length - 5} more`);
                            }
                            return deviceList;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Add info text
    if (sortedKeys.length > 0) {
        const peakMonth = sortedKeys.reduce((a, b) => timelineCounts[a] > timelineCounts[b] ? a : b);
        const peakLabel = new Date(peakMonth.split('-')[0], peakMonth.split('-')[1] - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('warrantyTimelineInfo').innerHTML = 
            `Peak expiry month: <strong>${peakLabel}</strong> with ${timelineCounts[peakMonth]} warranties expiring.`;
    }
}

function getDevicesForMonth(monthLabel) {
    return currentData.filter(device => {
        if (!device.warrantyExpiry) return false;
        const deviceMonth = device.warrantyExpiry.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return deviceMonth === monthLabel;
    });
}

// Enhanced PDF Export with improved content
function exportAllCharts() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Title Page with Enhanced Content
    pdf.setFillColor(30, 60, 114);
    pdf.rect(0, 0, pageWidth, 60, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont(undefined, 'bold');
    const titleText = 'Computer Inventory Analytics Report';
    const titleWidth = pdf.getTextWidth(titleText);
    pdf.text(titleText, (pageWidth - titleWidth) / 2, 35);

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`, margin, 80);
    pdf.text(`Report Time: ${new Date().toLocaleTimeString('en-US')}`, margin, 90);

    // Executive Summary Box
    pdf.setDrawColor(30, 60, 114);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, 110, contentWidth, 90);

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Executive Summary', margin + 10, 125);

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const expiredCount = currentData.filter(d => d.warrantyExpiry && d.warrantyExpiry < now).length;
    const activeCount = currentData.filter(d => d.warrantyExpiry && d.warrantyExpiry >= now).length;
    const unknownCount = currentData.filter(d => !d.warrantyExpiry).length;
    const expiringSoon = currentData.filter(d => d.warrantyExpiry && d.warrantyExpiry <= thirtyDaysFromNow && d.warrantyExpiry >= now).length;
    const expiringQuarter = currentData.filter(d => d.warrantyExpiry && d.warrantyExpiry <= ninetyDaysFromNow && d.warrantyExpiry >= now).length;
    
    const uniqueModels = new Set(currentData.map(d => d.deviceModel)).size;
    const uniqueOffices = new Set(currentData.map(d => d.remoteOffice)).size;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');

    const summaryItems = [
        `Total Devices in Inventory: ${currentData.length}`,
        `Device Models: ${uniqueModels} unique models tracked`,
        `Office Locations: ${uniqueOffices} remote sites`,
        `Active Warranties: ${activeCount} devices (${((activeCount/currentData.length)*100).toFixed(1)}%)`,
        `Expired Warranties: ${expiredCount} devices (${((expiredCount/currentData.length)*100).toFixed(1)}%)`,
        `Unknown Status: ${unknownCount} devices require investigation`,
        `Immediate Attention: ${expiringSoon} expiring within 30 days`,
        `Quarterly Planning: ${expiringQuarter} expiring within 90 days`
    ];

    summaryItems.forEach((item, index) => {
        pdf.text(`• ${item}`, margin + 15, 140 + (index * 7));
    });

    // Key Recommendations Box
    pdf.rect(margin, 210, contentWidth, 50);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Key Recommendations', margin + 10, 225);

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');

    const recommendations = [
        expiringSoon > 0 ? `Priority: Renew ${expiringSoon} warranties expiring within 30 days` : 'All warranties current for next 30 days',
        expiringQuarter > 10 ? `Planning: Prepare procurement for ${expiringQuarter} devices in next quarter` : 'Quarterly planning on track',
        unknownCount > 0 ? `Investigation: Verify warranty status for ${unknownCount} devices` : 'All warranty statuses documented'
    ];

    recommendations.forEach((rec, index) => {
        pdf.text(`${index + 1}. ${rec}`, margin + 15, 240 + (index * 8));
    });

    // Charts Section
    pdf.addPage();

    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('Interactive Visualizations', margin, 30);

    const chartIds = ['deviceModelChart', 'remoteOfficeChart', 'warrantyStatusChart', 'warrantyTimelineChart'];
    const chartTitles = [
        'Device Model Distribution',
        'Remote Office Distribution', 
        'Warranty Status Overview',
        'Warranty Expiry Timeline'
    ];
    const chartDescriptions = [
        'Analysis of device models across inventory for standardization planning',
        'Geographic distribution for resource allocation and support planning',
        'Current warranty coverage status requiring immediate attention',
        'Timeline view for proactive warranty management and budgeting'
    ];

    chartIds.forEach((chartId, index) => {
        if (index > 0 && index % 2 === 0) {
            pdf.addPage();
        }

        const yPosition = index % 2 === 0 ? 50 : 160;

        // Chart title and description
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(chartTitles[index], margin, yPosition);

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(chartDescriptions[index], margin, yPosition + 8);
        pdf.setTextColor(0, 0, 0);

        const canvas = document.getElementById(chartId);
        if (canvas) {
            const imgData = canvas.toDataURL('image/png', 1.0);
            const chartWidth = contentWidth * 0.9;
            const chartHeight = 85;
            const chartX = margin + (contentWidth - chartWidth) / 2;

            // Add chart border
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.2);
            pdf.rect(chartX - 2, yPosition + 12, chartWidth + 4, chartHeight + 4);

            pdf.addImage(imgData, 'PNG', chartX, yPosition + 14, chartWidth, chartHeight);
        }
    });

    // Footer on all pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Computer Inventory Analytics Report`, margin, pageHeight - 10);
        pdf.text(`Page ${i} of ${totalPages} - Generated ${new Date().toLocaleDateString()}`, pageWidth - margin - 60, pageHeight - 10);
    }

    pdf.save(`Computer_Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export data as CSV
function exportDataTable() {
    const now = new Date();
    const csvHeaders = ['Computer Name', 'Device Model', 'Remote Office', 'Warranty Status', 'Warranty Expiry Date'];

    const csvRows = currentData.map(item => {
        let warrantyStatus = 'Unknown';
        let warrantyDate = '';

        if (item.warrantyExpiry) {
            warrantyDate = item.warrantyExpiry.toLocaleDateString();
            warrantyStatus = item.warrantyExpiry < now ? 'Expired' : 'Active';
        }

        return [
            item.computerName,
            item.deviceModel,
            item.remoteOffice,
            warrantyStatus,
            warrantyDate
        ].map(field => `"${field}"`).join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `computer_inventory_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Utility functions
function showStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    
    // Add hover tooltips to summary cards
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.summary-card')) {
            const card = e.target.closest('.summary-card');
            const title = card.getAttribute('title');
            if (title) {
                showTooltip(e, title);
            }
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.summary-card')) {
            hideTooltip();
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
    }

    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportAllCharts();
    }
});

// Additional utility functions for enhanced functionality
function resetAllCharts() {
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};
}

function refreshAnalytics() {
    if (currentData.length > 0) {
        generateAnalytics(currentData);
    }
}

// Error handling for chart generation
function handleChartError(chartId, error) {
    console.error(`Error generating chart ${chartId}:`, error);
    const container = document.getElementById(chartId).parentElement;
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #dc2626;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 10px;"></i>
            <p>Error loading chart. Please try refreshing the page.</p>
        </div>
    `;
}

// Data validation functions
function validateChartData(data, chartType) {
    if (!data || data.length === 0) {
        console.warn(`No data available for ${chartType} chart`);
        return false;
    }
    return true;
}

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced chart interactions
function addChartClickHandlers() {
    // This function can be expanded to add more sophisticated click handling
    console.log('Chart click handlers initialized');
}

// Data export utilities
function formatDataForExport(data, format = 'json') {
    switch (format) {
        case 'json':
            return JSON.stringify(data, null, 2);
        case 'csv':
            return convertToCSV(data);
        default:
            return data;
    }
}

function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
        )
    ];
    return csvRows.join('\n');
}

// Browser compatibility checks
function checkBrowserCompatibility() {
    const canvas = document.createElement('canvas');
    const supportsCanvas = !!(canvas.getContext && canvas.getContext('2d'));
    
    if (!supportsCanvas) {
        showStatus('Your browser does not support charts. Please update your browser.', 'error');
        return false;
    }
    
    return true;
}

// Initialize browser compatibility check
document.addEventListener('DOMContentLoaded', function() {
    checkBrowserCompatibility();
});

// Memory cleanup
window.addEventListener('beforeunload', function() {
    // Clean up chart instances to prevent memory leaks
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    chartInstances = {};
    currentData = [];
});

// Enhanced error reporting
window.addEventListener('error', function(e) {
    console.error('Application Error:', e.error);
    showStatus('An unexpected error occurred. Please refresh the page.', 'error');
});

// Service worker registration (if you want to add PWA features later)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Service worker registration can be added here for offline functionality
        console.log('Service Worker support detected');
    });
}

// Analytics tracking (placeholder for future implementation)
function trackEvent(eventName, eventData = {}) {
    // This can be connected to analytics services like Google Analytics
    console.log('Event tracked:', eventName, eventData);
}

// Usage tracking for features
function trackFeatureUsage(feature) {
    trackEvent('feature_used', { feature: feature, timestamp: new Date().toISOString() });
}

// Add feature tracking to existing functions
const originalExportAllCharts = exportAllCharts;
exportAllCharts = function() {
    trackFeatureUsage('pdf_export');
    return originalExportAllCharts.apply(this, arguments);
};

const originalToggleTheme = toggleTheme;
toggleTheme = function() {
    trackFeatureUsage('theme_toggle');
    return originalToggleTheme.apply(this, arguments);
};

const originalExportChart = exportChart;
exportChart = function() {
    trackFeatureUsage('individual_chart_export');
    return originalExportChart.apply(this, arguments);
};

// Console welcome message
console.log(`
🎯 Computer Inventory Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Enhanced features loaded successfully
🔧 Keyboard shortcuts:
   • Ctrl+Shift+T: Toggle theme
   • Ctrl+Shift+E: Export PDF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Export functions for potential external use
window.InventoryApp = {
    toggleTheme,
    exportAllCharts,
    exportChart,
    exportDataTable,
    refreshAnalytics,
    resetAllCharts,
    getCurrentData: () => currentData,
    getChartInstances: () => chartInstances
};