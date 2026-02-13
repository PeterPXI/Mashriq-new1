/**
 * Noor Dropdown - Platform navigation dropdown for Noor pages
 * Provides quick access to platform features from within Noor AI
 */
const NoorDropdown = {
    init() {
        const user = Auth.getUser();
        if (!user) return;

        const header = document.querySelector('header');
        if (!header) return;

        // Find the right side of the header (after the logo area)
        const rightSide = header.querySelector('.flex.items-center.gap-4')?.parentElement;
        if (!rightSide) return;

        const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        const avatar = user.avatar || user.profilePicture || '';
        const isSeller = user.role === 'seller' || user.role === 'admin';
        const isAdmin = user.role === 'admin';

        // Create dropdown container
        const dropdownHTML = `
            <div class="flex items-center gap-2">
                <a href="/app/"
                    class="flex items-center gap-2 px-3 py-2 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-orange-500/20">
                    <i class="fas fa-arrow-right text-xs"></i>
                    <span class="hidden sm:inline">المنصة</span>
                </a>
                <div class="relative" id="noorDropdownWrapper">
                    <button class="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-dark-700 transition-colors" id="noorDropdownBtn">
                        ${avatar
                            ? `<img src="${avatar}" alt="" class="w-8 h-8 rounded-lg object-cover">`
                            : `<span class="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">${initials}</span>`
                        }
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    <div class="hidden absolute left-0 top-full mt-2 w-56 rounded-xl shadow-2xl border border-dark-600 py-2 z-50" id="noorDropdownMenu" style="background-color: #1a1a1a;">
                        <a href="/app/dashboard.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                            <i class="fas fa-th-large text-gray-500 w-5 text-center"></i>
                            لوحة التحكم
                        </a>
                        <a href="/app/profile.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                            <i class="fas fa-user text-gray-500 w-5 text-center"></i>
                            الملف الشخصي
                        </a>
                        <a href="/app/orders.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                            <i class="fas fa-clipboard-list text-gray-500 w-5 text-center"></i>
                            طلباتي
                        </a>
                        <a href="/app/chat.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                            <i class="fas fa-comment-dots text-gray-500 w-5 text-center"></i>
                            الرسائل
                        </a>
                        <a href="/app/notifications.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                            <i class="fas fa-bell text-gray-500 w-5 text-center"></i>
                            الإشعارات
                        </a>
                        <a href="/app/wallet.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                            <i class="fas fa-wallet text-gray-500 w-5 text-center"></i>
                            المحفظة
                        </a>
                        <div class="my-1 border-t border-dark-600"></div>
                        <a href="/app/referral.html" class="flex items-center gap-3 px-4 py-2.5 text-orange-400 hover:bg-dark-700 transition-colors">
                            <i class="fas fa-gift text-orange-500 w-5 text-center"></i>
                            ادعُ واربح 🎁
                        </a>
                        <a href="/app/settings.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                            <i class="fas fa-cog text-gray-500 w-5 text-center"></i>
                            الإعدادات
                        </a>
                        ${isSeller ? `
                            <a href="/app/seller/add-service.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                                <i class="fas fa-plus-circle text-gray-500 w-5 text-center"></i>
                                أضف خدمة
                            </a>
                        ` : ''}
                        ${isAdmin ? `
                            <div class="my-1 border-t border-dark-600"></div>
                            <a href="/app/admin/" class="flex items-center gap-3 px-4 py-2.5 text-purple-400 hover:bg-dark-700 transition-colors">
                                <i class="fas fa-shield-alt text-purple-500 w-5 text-center"></i>
                                لوحة الإدارة
                            </a>
                        ` : ''}
                        <div class="my-1 border-t border-dark-600"></div>
                        <button class="flex items-center gap-3 w-full px-4 py-2.5 text-red-400 hover:bg-dark-700 transition-colors" id="noorLogoutBtn">
                            <i class="fas fa-sign-out-alt text-red-500 w-5 text-center"></i>
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Replace the existing right-side content (the "العودة للمنصة" button)
        const existingLink = header.querySelector('a[href="/app/"]');
        if (existingLink) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = dropdownHTML;
            existingLink.replaceWith(wrapper.firstElementChild);
        } else {
            // If no existing link, append to header
            const wrapper = document.createElement('div');
            wrapper.innerHTML = dropdownHTML;
            header.appendChild(wrapper.firstElementChild);
        }

        // Bind events
        this.bindEvents();
    },

    bindEvents() {
        const btn = document.getElementById('noorDropdownBtn');
        const menu = document.getElementById('noorDropdownMenu');
        const logoutBtn = document.getElementById('noorLogoutBtn');

        if (btn && menu) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !btn.contains(e.target)) {
                    menu.classList.add('hidden');
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Auth.logout();
                window.location.href = '/app/login.html';
            });
        }
    }
};
