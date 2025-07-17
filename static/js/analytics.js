// analytics.js - AI Insights and Analytics
window.InventoryAnalytics = {
    generateAnalytics: function(data) {
        try {
            this.generateAIInsights(data);
            this.generateSummary(data);
            window.InventoryCharts.generateCharts(data);
        } catch (error) {
            console.log('Analytics generation issue:', error);
        }
    },

    generateAIInsights: function(data) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + window.InventoryConfig.DATE_RANGES.THIRTY_DAYS);
        const ninetyDaysFromNow = new Date(now.getTime() + window.InventoryConfig.DATE_RANGES.NINETY_DAYS);
        
        const expiredCount = data.filter(d => d.warrantyExpiry && d.warrantyExpiry < now).length;
        const expiringSoon = data.filter(d => d.warrantyExpiry && d.warrantyExpiry <= thirtyDaysFromNow && d.warrantyExpiry >= now).length;
        const expiringInQuarter = data.filter(d => d.warrantyExpiry && d.warrantyExpiry <= ninetyDaysFromNow && d.warrantyExpiry >= now).length;
        
        const modelCounts = {};
        data.forEach(item => {
            modelCounts[item.deviceModel] = (modelCounts[item.deviceModel] || 0) + 1;
        });
        const mostCommonModel = Object.keys(modelCounts).reduce((a, b) => 
            modelCounts[a] > modelCounts[b] ? a : b, 'Unknown');

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
                number: modelCounts[mostCommonModel] || 0,
                text: `devices are ${mostCommonModel} models (${((modelCounts[mostCommonModel] || 0) / data.length * 100).toFixed(1)}% of inventory). Consider bulk warranty negotiations.`,
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

        const aiInsightsGrid = document.getElementById('aiInsightsGrid');
        if (aiInsightsGrid) {
            aiInsightsGrid.innerHTML = insightsHtml;
        }
    },

    generateSummary: function(data) {
        const totalDevices = data.length;
        const uniqueModels = new Set(data.map(d => d.deviceModel)).size;
        const uniqueOffices = new Set(data.map(d => d.remoteOffice)).size;
        const uniqueTechs = new Set(data.map(d => d.techAssigned)).size;

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
            <div class="summary-card" title="Number of assigned technicians">
                <div class="summary-number">${uniqueTechs}</div>
                <div class="summary-label">Technicians</div>
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

        const summaryGrid = document.getElementById('summaryGrid');
        if (summaryGrid) {
            summaryGrid.innerHTML = summaryHtml;
        }
    }
};