// main.js - Main Application Coordination

// Global functions for HTML onclick events
function loadDemoData() {
    window.InventoryDemo.loadDemoData();
}

function toggleTheme() {
    window.InventoryTheme.toggleTheme();
}

function toggleChartType(chartId, newType, buttonElement) {
    window.InventoryCharts.toggleChartType(chartId, newType, buttonElement);
}

function exportAllCharts() {
    window.InventoryExport.exportAllCharts();
}

function exportChart(chartId) {
    window.InventoryExport.exportChart(chartId);
}

function exportDataTable() {
    window.InventoryExport.exportDataTable();
}

function closeModal() {
    window.InventoryModals.closeModal();
}

function showTechDetails(tech, data) {
    window.InventoryModals.showTechDetails(tech, data);
}

function showOfficeDetails(office, data) {
    window.InventoryModals.showOfficeDetails(office, data);
}

// Main application object
window.InventoryApp = {
    toggleTheme: toggleTheme,
    toggleChartType: toggleChartType,
    exportAllCharts: exportAllCharts,
    exportChart: exportChart,
    exportDataTable: exportDataTable,
    loadDemoData: loadDemoData,
    getCurrentData: () => window.InventoryFileUpload.getCurrentData(),
    getChartInstances: () => window.InventoryCharts.chartInstances,
    showOfficeDetails: showOfficeDetails,
    showTechDetails: showTechDetails,
    
    // Initialize application
    init: function() {
        console.log('Computer Inventory Analytics with Demo loaded');
        
        // Initialize all modules
        window.InventoryTheme.initTheme();
        window.InventoryFileUpload.initFileUpload();
        window.InventoryFilters.initFilters();
        
        // Check if required libraries are loaded
        if (typeof Chart === 'undefined') {
            window.InventoryUtils.showStatus('Chart.js library not loaded. Please refresh the page.', 'error');
        }
        
        // Setup global event listeners
        this.setupGlobalEventListeners();
    },

    setupGlobalEventListeners: function() {
        // Escape key to close modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.InventoryModals.closeModal();
            }
            
            // Keyboard shortcuts
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                window.InventoryTheme.toggleTheme();
            }

            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                const currentData = window.InventoryFileUpload.getCurrentData();
                if (currentData.length > 0) {
                    window.InventoryExport.exportAllCharts();
                }
            }

            // Demo shortcut
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                window.InventoryDemo.loadDemoData();
            }
        });

        // Error handling
        window.addEventListener('error', function(e) {
            console.log('Error logged:', e.error);
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            Object.values(window.InventoryCharts.chartInstances).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
        });
    }
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.InventoryApp.init();
    
    // Console welcome message with demo info
    console.log(`
🎯 Computer Inventory Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Enhanced features loaded successfully
🔧 Keyboard shortcuts:
   • Ctrl+Shift+D: Load demo data
🎯 Demo Features:
   • 150 computers (PC-0001 to PC-0150)
   • 5 Dell models only
   • 10 strategic office locations
   • 4 technicians assigned
   • Strategic warranty scenarios
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});