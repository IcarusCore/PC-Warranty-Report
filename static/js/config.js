// config.js - Configuration and Constants
window.InventoryConfig = {
    CHART_COLORS: {
        primary: [
            '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd',
            '#dbeafe', '#1e40af', '#2563eb', '#8b5cf6'
        ],
        tech: [
            '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ],
        warranty: {
            active: '#16a34a',        // Green - Good (>6 months)
            expiringSoon: '#f59e0b',  // Orange - Warning (0-6 months)
            expired: '#dc2626',       // Red - Critical (expired)
            unknown: '#6b7280'        // Gray - Unknown status
        }
    },

    CHART_DEFAULTS: {
        maintainAspectRatio: false,
        responsive: true,
        borderWidth: 2,
        borderColor: '#ffffff'
    },

    FILTER_TYPES: {
        DEVICE_MODEL: 'deviceModel',
        REMOTE_OFFICE: 'remoteOffice',
        WARRANTY_STATUS: 'warrantyStatus',
        TECH_ASSIGNED: 'techAssigned'
    },

    DISPLAY_NAMES: {
        'deviceModel': 'Device Model',
        'remoteOffice': 'Office',
        'warrantyStatus': 'Warranty Status',
        'techAssigned': 'Technician'
    },

    DATE_RANGES: {
        THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
        NINETY_DAYS: 90 * 24 * 60 * 60 * 1000,
        SIX_MONTHS: 180 * 24 * 60 * 60 * 1000  // 6 months = 180 days
    },

    FILE_CONFIG: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ACCEPTED_TYPES: ['.xlsx'],
        UPLOAD_ENDPOINT: '/upload'
    },

    UI_CONFIG: {
        SUCCESS_MESSAGE_DURATION: 5000,
        SCROLL_BEHAVIOR: 'smooth'
    }
};