// demo.js - Demo Data Loading Module
window.InventoryDemo = {
    loadDemoData: async function() {
        window.InventoryUtils.showStatus('Loading curated demo data...', 'info');
        window.InventoryUtils.showLoading(true);

        try {
            const response = await fetch('/demo-data', {
                method: 'GET'
            });

            const result = await response.json();

            if (result.success) {
                const processedData = result.data.map(item => ({
                    computerName: item.computerName,
                    deviceModel: item.deviceModel,
                    remoteOffice: item.remoteOffice,
                    warrantyExpiry: window.InventoryUtils.parseDate(item.warrantyExpiry),
                    techAssigned: item.techAssigned
                })).filter(item => item.computerName && item.computerName !== 'Unknown');

                // Set the demo data as current data
                window.InventoryFileUpload.setCurrentData(processedData);
                
                // Generate analytics with demo data
                window.InventoryAnalytics.generateAnalytics(processedData);
                
                window.InventoryUtils.showStatus('🎯 ' + result.message + ' - Demo showcasing strategic warranty scenarios!', 'success');
                window.InventoryUtils.showLoading(false);
                
                // Show main content and export section
                document.getElementById('mainContent').style.display = 'block';
                document.getElementById('exportSection').style.display = 'block';
                
                console.log('Demo data loaded successfully:', processedData.length, 'devices');
                
                // Track demo usage
                this.trackDemoUsage(processedData);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Demo data loading error:', error);
            window.InventoryUtils.showStatus('Error loading demo data: ' + error.message, 'error');
            window.InventoryUtils.showLoading(false);
        }
    },

    trackDemoUsage: function(data) {
        // Log demo statistics for debugging/analytics
        const stats = this.calculateDemoStats(data);
        console.log('Demo Data Statistics:', stats);
    },

    calculateDemoStats: function(data) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

        const stats = {
            total: data.length,
            expired: data.filter(d => d.warrantyExpiry && d.warrantyExpiry < now).length,
            expiringSoon: data.filter(d => d.warrantyExpiry && d.warrantyExpiry >= now && d.warrantyExpiry <= thirtyDaysFromNow).length,
            expiringSixMonths: data.filter(d => d.warrantyExpiry && d.warrantyExpiry >= now && d.warrantyExpiry <= sixMonthsFromNow).length,
            longTerm: data.filter(d => d.warrantyExpiry && d.warrantyExpiry > sixMonthsFromNow).length,
            unknown: data.filter(d => !d.warrantyExpiry).length,
            models: new Set(data.map(d => d.deviceModel)).size,
            offices: new Set(data.map(d => d.remoteOffice)).size,
            technicians: new Set(data.map(d => d.techAssigned)).size
        };

        return stats;
    },

    getDemoConfiguration: function() {
        // Return the demo configuration for reference
        return {
            totalComputers: 150,
            computerNamePattern: 'PC-0001 to PC-0150',
            dellModels: [
                'Dell OptiPlex 7090',
                'Dell OptiPlex 5090',
                'Dell OptiPlex 3090',
                'Dell OptiPlex 7080',
                'Dell OptiPlex 5080'
            ],
            offices: [
                { name: 'New York HQ', count: 25, technician: 'Mike Johnson' },
                { name: 'Chicago Office', count: 20, technician: 'David Rodriguez' },
                { name: 'Los Angeles Branch', count: 18, technician: 'Sarah Chen' },
                { name: 'Houston Center', count: 15, technician: 'Lisa Thompson' },
                { name: 'Boston Office', count: 12, technician: 'Mike Johnson' },
                { name: 'Phoenix Branch', count: 12, technician: 'Sarah Chen' },
                { name: 'Atlanta Office', count: 12, technician: 'Lisa Thompson' },
                { name: 'Seattle Branch', count: 12, technician: 'Sarah Chen' },
                { name: 'Denver Office', count: 12, technician: 'David Rodriguez' },
                { name: 'Miami Branch', count: 12, technician: 'Lisa Thompson' }
            ],
            technicians: [
                { name: 'Mike Johnson', region: 'East Coast', deviceCount: 37 },
                { name: 'Sarah Chen', region: 'West Coast', deviceCount: 42 },
                { name: 'David Rodriguez', region: 'Central', deviceCount: 32 },
                { name: 'Lisa Thompson', region: 'South', deviceCount: 39 }
            ],
            warrantyScenarios: [
                { type: 'expired', count: 20, description: 'Expired warranties (red alerts)' },
                { type: 'expiring_soon', count: 25, description: 'Expiring within 30 days' },
                { type: 'expiring_medium', count: 30, description: 'Expiring in 3-6 months' },
                { type: 'long_term', count: 75, description: '12+ months remaining' }
            ]
        };
    },

    validateDemoData: function(data) {
        // Validate that the demo data meets specifications
        const config = this.getDemoConfiguration();
        const validation = {
            valid: true,
            issues: []
        };

        // Check total count
        if (data.length !== config.totalComputers) {
            validation.valid = false;
            validation.issues.push(`Expected ${config.totalComputers} computers, got ${data.length}`);
        }

        // Check Dell models only
        const nonDellDevices = data.filter(d => !d.deviceModel.startsWith('Dell OptiPlex'));
        if (nonDellDevices.length > 0) {
            validation.valid = false;
            validation.issues.push(`Found ${nonDellDevices.length} non-Dell devices`);
        }

        // Check technician count
        const uniqueTechnicians = new Set(data.map(d => d.techAssigned)).size;
        if (uniqueTechnicians !== 4) {
            validation.valid = false;
            validation.issues.push(`Expected 4 technicians, found ${uniqueTechnicians}`);
        }

        // Check office count
        const uniqueOffices = new Set(data.map(d => d.remoteOffice)).size;
        if (uniqueOffices !== 10) {
            validation.valid = false;
            validation.issues.push(`Expected 10 offices, found ${uniqueOffices}`);
        }

        return validation;
    }
};