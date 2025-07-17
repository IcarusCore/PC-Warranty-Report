// utils.js - Utility Functions
window.InventoryUtils = {
    showStatus: function(message, type) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            statusElement.style.display = 'block';

            if (type === 'success') {
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, window.InventoryConfig.UI_CONFIG.SUCCESS_MESSAGE_DURATION);
            }
        }
    },

    showLoading: function(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    },

    parseDate: function(dateStr) {
        if (!dateStr || dateStr === 'None' || dateStr === 'null') return null;
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            console.warn('Could not parse date:', dateStr);
        }
        return null;
    },

    formatDate: function(date) {
        return date ? date.toLocaleDateString() : 'N/A';
    },

    calculateDaysUntilExpiry: function(expiryDate) {
        if (!expiryDate) return null;
        const now = new Date();
        return Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    },

    getWarrantyStatus: function(expiryDate) {
        if (!expiryDate) return 'Unknown';
        const now = new Date();
        return expiryDate < now ? 'Expired' : 'Active';
    },

    scrollToElement: function(elementId, behavior = window.InventoryConfig.UI_CONFIG.SCROLL_BEHAVIOR) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior, block: 'start' });
        }
    }
};