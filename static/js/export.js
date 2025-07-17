// export.js - Export Functions
window.InventoryExport = {
    exportAllCharts: function() {
        if (typeof jsPDF === 'undefined') {
            window.InventoryUtils.showStatus('PDF export library not loaded. Please refresh the page.', 'error');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.width;
            const margin = 20;

            // Title Page
            pdf.setFillColor(30, 60, 114);
            pdf.rect(0, 0, pageWidth, 60, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(24);
            pdf.setFont(undefined, 'bold');
            pdf.text('Computer Inventory Analytics Report', margin, 35);

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 80);

            // Tech Performance Summary
            const currentData = window.InventoryFileUpload.getCurrentData();
            const techSummary = this.generateTechSummary(currentData);
            
            pdf.setFontSize(14);
            pdf.text('Technician Performance Summary:', margin, 100);
            pdf.setFontSize(10);

            let yPos = 110;
            Object.entries(techSummary.counts).forEach(([tech, total]) => {
                const expired = techSummary.expired[tech] || 0;
                const rate = ((expired / total) * 100).toFixed(1);
                pdf.text(`${tech}: ${total} devices, ${expired} expired (${rate}%)`, margin, yPos);
                yPos += 8;
            });

            // Add charts
            const chartIds = [
                'deviceModelChart', 
                'remoteOfficeChart', 
                'warrantyStatusChart', 
                'techAssignedChart', 
                'techPerformanceChart'
            ];
            
            chartIds.forEach((chartId, index) => {
                if (index % 2 === 0 && index > 0) {
                    pdf.addPage();
                }

                const canvas = document.getElementById(chartId);
                if (canvas) {
                    const imgData = canvas.toDataURL('image/png', 1.0);
                    const yPosition = (index % 2) * 120 + 50;
                    pdf.addImage(imgData, 'PNG', margin, yPosition, 170, 100);
                }
            });

            const filename = `Computer_Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(filename);
            window.InventoryUtils.showStatus('PDF exported successfully!', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            window.InventoryUtils.showStatus('Error exporting PDF: ' + error.message, 'error');
        }
    },

    exportChart: function(chartId) {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const link = document.createElement('a');
            link.download = `${chartId}_export.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        }
    },

    exportDataTable: function() {
        const currentData = window.InventoryFileUpload.getCurrentData();
        
        if (!currentData || currentData.length === 0) {
            window.InventoryUtils.showStatus('No data to export', 'error');
            return;
        }

        try {
            const now = new Date();
            const csvHeaders = [
                'Computer Name', 
                'Device Model', 
                'Remote Office', 
                'Tech Assigned', 
                'Warranty Status', 
                'Warranty Expiry Date', 
                'Days Until/Since Expiry'
            ];

            const csvRows = currentData.map(item => {
                let warrantyStatus = 'Unknown';
                let warrantyDate = '';
                let daysInfo = '';

                if (item.warrantyExpiry) {
                    warrantyDate = item.warrantyExpiry.toLocaleDateString();
                    const daysUntil = Math.floor((item.warrantyExpiry - now) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntil < 0) {
                        warrantyStatus = 'Expired';
                        daysInfo = `${Math.abs(daysUntil)} days ago`;
                    } else {
                        warrantyStatus = 'Active';
                        daysInfo = `${daysUntil} days remaining`;
                    }
                }

                return [
                    item.computerName || '',
                    item.deviceModel || '',
                    item.remoteOffice || '',
                    item.techAssigned || 'Unassigned',
                    warrantyStatus,
                    warrantyDate,
                    daysInfo
                ].map(field => `"${field}"`).join(',');
            });

            const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `computer_inventory_with_techs_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            window.InventoryUtils.showStatus('CSV exported successfully!', 'success');
        } catch (error) {
            console.error('CSV export error:', error);
            window.InventoryUtils.showStatus('Error exporting CSV: ' + error.message, 'error');
        }
    },

    generateTechSummary: function(data) {
        const techCounts = {};
        const techExpired = {};
        
        data.forEach(item => {
            const tech = item.techAssigned || 'Unassigned';
            techCounts[tech] = (techCounts[tech] || 0) + 1;
            
            const now = new Date();
            if (item.warrantyExpiry && item.warrantyExpiry < now) {
                techExpired[tech] = (techExpired[tech] || 0) + 1;
            }
        });

        return {
            counts: techCounts,
            expired: techExpired
        };
    }
};