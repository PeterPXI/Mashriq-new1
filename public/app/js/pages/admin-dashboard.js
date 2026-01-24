(function() {
    'use strict';
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        totalUsers: document.getElementById('totalUsers'),
        totalServices: document.getElementById('totalServices'),
        totalOrders: document.getElementById('totalOrders'),
        openDisputes: document.getElementById('openDisputes'),
    };
    
    async function init() {
        if (!Auth.requireAuth()) {
            return;
        }
        
        if (!Auth.isAdmin()) {
            Toast.error('غير مصرح', 'هذه الصفحة للمسؤولين فقط');
            window.location.href = CONFIG.ROUTES.HOME;
            return;
        }
        
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        await loadStats();
    }
    
    async function loadStats() {
        try {
            const response = await API.get('/admin/stats');
            const data = response.data || response;
            
            elements.totalUsers.textContent = Utils.formatNumber(data.totalUsers || 0);
            elements.totalServices.textContent = Utils.formatNumber(data.totalServices || 0);
            elements.totalOrders.textContent = Utils.formatNumber(data.totalOrders || 0);
            elements.openDisputes.textContent = Utils.formatNumber(data.openDisputes || 0);
        } catch (error) {
            console.error('Failed to load admin stats:', error);
            elements.totalUsers.textContent = '-';
            elements.totalServices.textContent = '-';
            elements.totalOrders.textContent = '-';
            elements.openDisputes.textContent = '-';
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
