(function() {
    'use strict';
    
    const state = {
        users: [],
        search: '',
        role: '',
    };
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        usersLoading: document.getElementById('usersLoading'),
        usersList: document.getElementById('usersList'),
        emptyState: document.getElementById('emptyState'),
        searchInput: document.getElementById('searchInput'),
        roleFilter: document.getElementById('roleFilter'),
    };
    
    const ROLE_MAP = {
        buyer: { label: 'مشتري', color: 'blue' },
        seller: { label: 'بائع', color: 'green' },
        admin: { label: 'مسؤول', color: 'purple' },
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
        await loadUsers();
    }
    
    function bindEvents() {
        elements.searchInput?.addEventListener('input', Utils.debounce(() => {
            state.search = elements.searchInput.value;
            loadUsers();
        }, 300));
        
        elements.roleFilter?.addEventListener('change', () => {
            state.role = elements.roleFilter.value;
            loadUsers();
        });
    }
    
    async function loadUsers() {
        elements.usersLoading.classList.remove('hidden');
        elements.usersList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
        
        try {
            const params = new URLSearchParams();
            if (state.search) params.append('search', state.search);
            if (state.role) params.append('role', state.role);
            
            const response = await API.get('/admin/users?' + params.toString());
            state.users = response.data?.users || [];
            
            if (state.users.length === 0) {
                showEmptyState();
            } else {
                renderUsers();
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            Toast.error('خطأ', 'تعذر تحميل المستخدمين');
            showEmptyState();
        } finally {
            elements.usersLoading.classList.add('hidden');
        }
    }
    
    function renderUsers() {
        elements.usersList.classList.remove('hidden');
        
        elements.usersList.innerHTML = state.users.map(user => {
            const roleInfo = ROLE_MAP[user.role] || ROLE_MAP.buyer;
            const joinDate = new Date(user.createdAt).toLocaleDateString('ar-EG');
            const initials = (user.fullName || user.username || 'U').charAt(0);
            
            return `
                <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
                    <div class="flex-shrink-0">
                        ${user.avatarUrl 
                            ? `<img src="${user.avatarUrl}" alt="" class="w-12 h-12 rounded-full object-cover">`
                            : `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">${initials}</div>`
                        }
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-semibold text-gray-900 truncate">${Utils.escapeHtml(user.fullName || user.username)}</h3>
                            <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-${roleInfo.color}-100 text-${roleInfo.color}-700">${roleInfo.label}</span>
                            ${!user.isActive ? '<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">معطل</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-500 truncate">${Utils.escapeHtml(user.email)}</p>
                        <p class="text-xs text-gray-400">انضم في ${joinDate}</p>
                    </div>
                    <div class="flex gap-2">
                        <a href="/app/profile.html?id=${user._id}" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                            عرض
                        </a>
                        <button class="px-3 py-2 ${user.isActive ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-green-100 hover:bg-green-200 text-green-700'} rounded-lg text-sm font-medium transition-colors" onclick="window.toggleUserStatus('${user._id}', ${user.isActive})">
                            ${user.isActive ? 'تعطيل' : 'تفعيل'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function showEmptyState() {
        elements.usersList.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    }
    
    window.toggleUserStatus = async function(userId, currentStatus) {
        try {
            await API.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            Toast.success('تم', currentStatus ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
            await loadUsers();
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            Toast.error('خطأ', error.message || 'فشل تحديث الحالة');
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
