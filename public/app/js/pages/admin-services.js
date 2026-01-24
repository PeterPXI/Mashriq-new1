(function() {
    'use strict';
    
    const state = {
        services: [],
        search: '',
    };
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        servicesLoading: document.getElementById('servicesLoading'),
        servicesList: document.getElementById('servicesList'),
        emptyState: document.getElementById('emptyState'),
        searchInput: document.getElementById('searchInput'),
    };
    
    async function init() {
        if (!Auth.requireAuth()) return;
        if (!Auth.isAdmin()) {
            Toast.error('غير مصرح', 'هذه الصفحة للمسؤولين فقط');
            window.location.href = CONFIG.ROUTES.HOME;
            return;
        }
        
        Navbar.render(elements.navbar);
        Footer.render(elements.footer);
        bindEvents();
        await loadServices();
    }
    
    function bindEvents() {
        elements.searchInput?.addEventListener('input', Utils.debounce(() => {
            state.search = elements.searchInput.value;
            loadServices();
        }, 300));
    }
    
    async function loadServices() {
        elements.servicesLoading.classList.remove('hidden');
        elements.servicesList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
        
        try {
            const params = new URLSearchParams();
            if (state.search) params.append('search', state.search);
            
            const response = await API.get('/admin/services?' + params.toString());
            state.services = response.data?.services || [];
            
            if (state.services.length === 0) {
                showEmptyState();
            } else {
                renderServices();
            }
        } catch (error) {
            console.error('Failed to load services:', error);
            Toast.error('خطأ', 'تعذر تحميل الخدمات');
            showEmptyState();
        } finally {
            elements.servicesLoading.classList.add('hidden');
        }
    }
    
    function renderServices() {
        elements.servicesList.classList.remove('hidden');
        
        elements.servicesList.innerHTML = state.services.map(service => {
            const sellerName = service.sellerId?.fullName || 'بائع';
            const price = service.basePrice || service.price || 0;
            const imageUrl = service.imageUrls?.[0] || service.imageUrl || '/app/assets/images/service-placeholder.svg';
            
            return `
                <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex gap-4">
                    <img src="${imageUrl}" alt="" class="w-20 h-20 rounded-lg object-cover flex-shrink-0" onerror="this.src='/app/assets/images/service-placeholder.svg'">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-semibold text-gray-900 truncate">${Utils.escapeHtml(service.title)}</h3>
                            ${!service.isActive ? '<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">معطل</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-500 truncate mb-2">${Utils.escapeHtml(sellerName)} • $${price}</p>
                        <div class="flex gap-2">
                            <a href="/app/service.html?id=${service._id}" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors">عرض</a>
                            <button class="px-3 py-1.5 ${service.isActive ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-green-100 hover:bg-green-200 text-green-700'} rounded-lg text-xs font-medium transition-colors" onclick="window.toggleServiceStatus('${service._id}', ${service.isActive})">
                                ${service.isActive ? 'تعطيل' : 'تفعيل'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function showEmptyState() {
        elements.servicesList.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    }
    
    window.toggleServiceStatus = async function(serviceId, currentStatus) {
        try {
            await API.put(`/admin/services/${serviceId}/status`, { isActive: !currentStatus });
            Toast.success('تم', currentStatus ? 'تم تعطيل الخدمة' : 'تم تفعيل الخدمة');
            await loadServices();
        } catch (error) {
            console.error('Failed to toggle service status:', error);
            Toast.error('خطأ', error.message || 'فشل تحديث الحالة');
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
