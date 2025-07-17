// theme.js - Theme Management
window.InventoryTheme = {
    toggleTheme: function() {
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
    },

    initTheme: function() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    },

    getCurrentTheme: function() {
        return document.body.getAttribute('data-theme') || 'light';
    },

    setTheme: function(theme) {
        const body = document.body;
        const themeIcon = document.getElementById('theme-icon');
        
        body.setAttribute('data-theme', theme);
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('theme', theme);
    }
};