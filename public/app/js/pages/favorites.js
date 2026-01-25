/**
 * MASHRIQ - Favorites Page
 */

(function() {
    'use strict';
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        loading: document.getElementById('loading'),
        emptyState: document.getElementById('emptyState'),
        favoritesGrid: document.getElementById('favoritesGrid')
    };
    
    async function init() {
        if (!Auth.requireAuth()) return;
        
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        
        await loadFavorites();
    }
    
    async function loadFavorites() {
        try {
            const response = await API.get('/api/favorites');
            
            elements.loading.classList.add('hidden');
            
            if (!response.success || !response.data?.favorites?.length) {
                elements.emptyState.classList.remove('hidden');
                return;
            }
            
            renderFavorites(response.data.favorites);
            
        } catch (err) {
            console.error('Load favorites error:', err);
            elements.loading.classList.add('hidden');
            elements.emptyState.classList.remove('hidden');
            Toast.error('خطأ', 'فشل تحميل المفضلة');
        }
    }
    
    function renderFavorites(favorites) {
        elements.favoritesGrid.classList.remove('hidden');
        
        elements.favoritesGrid.innerHTML = favorites.map(service => `
            <div class="service-card-wrapper" data-service-id="${service._id || service.id}">
                ${ServiceCard.render(service, { showFavorite: true, isFavorited: true })}
            </div>
        `).join('');
        
        // Bind remove buttons
        elements.favoritesGrid.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', handleRemoveFavorite);
        });
    }
    
    async function handleRemoveFavorite(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const wrapper = e.target.closest('.service-card-wrapper');
        const serviceId = wrapper?.dataset.serviceId;
        
        if (!serviceId) return;
        
        try {
            await API.delete(`/api/favorites/${serviceId}`);
            
            wrapper.remove();
            Toast.success('تم', 'تمت إزالة الخدمة من المفضلة');
            
            // Check if empty
            if (!elements.favoritesGrid.children.length) {
                elements.favoritesGrid.classList.add('hidden');
                elements.emptyState.classList.remove('hidden');
            }
            
        } catch (err) {
            Toast.error('خطأ', 'فشل إزالة الخدمة');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
