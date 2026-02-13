/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOOR SIDEBAR COMPONENT
 * منصة مشرق - المكون الجانبي الموحد لنور AI
 * ═══════════════════════════════════════════════════════════════════════════
 */

const NoorSidebar = {
    currentPage: '',
    isOpen: false,
    conversations: [],

    /**
     * Initialize the sidebar
     */
    init(currentPage = 'chat') {
        this.currentPage = currentPage;
        this.loadConversations();
        this.render();
        this.bindEvents();
        this.loadUserInfo();
        this.loadUsage();
    },

    /**
     * Render the sidebar
     */
    render() {
        const container = document.getElementById('noor-sidebar');
        if (!container) return;

        container.innerHTML = `
            <!-- Sidebar -->
            <aside id="sidebar" class="w-72 bg-gray-900 flex flex-col h-screen fixed right-0 z-50 transition-transform duration-300 border-l border-gray-800">
                
                <!-- Logo & Close -->
                <div class="p-4 border-b border-gray-800 flex items-center justify-between">
                    <a href="/app/noor/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <i class="fas fa-sun text-white"></i>
                        </div>
                        <div>
                            <h1 class="font-bold text-lg text-white">نور AI</h1>
                            <p class="text-xs text-gray-500">مساعدتك الذكية</p>
                        </div>
                    </a>
                    <button id="closeSidebar" class="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- New Chat Button -->
                <div class="p-4">
                    <a href="/app/noor/chat.html" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-orange-500/20">
                        <i class="fas fa-plus"></i>
                        <span>محادثة جديدة</span>
                    </a>
                </div>

                <!-- Navigation -->
                <nav class="flex-1 overflow-y-auto px-3">
                    <p class="text-xs text-gray-500 px-3 mb-2 font-medium">الأدوات</p>
                    
                    <a href="/app/noor/chat.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${this.currentPage === 'chat' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}">
                        <i class="fas fa-comments w-5 text-center"></i>
                        <span>الشات العام</span>
                    </a>
                    
                    <a href="/app/noor/proposals.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${this.currentPage === 'proposals' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}">
                        <i class="fas fa-file-signature w-5 text-center"></i>
                        <span>كاتب العروض</span>
                    </a>
                    
                    <a href="/app/noor/content.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${this.currentPage === 'content' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}">
                        <i class="fas fa-pen-fancy w-5 text-center"></i>
                        <span>كاتب المحتوى</span>
                    </a>
                    
                    <a href="/app/noor/social.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${this.currentPage === 'social' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}">
                        <i class="fas fa-share-alt w-5 text-center"></i>
                        <span>إدارة السوشيال</span>
                        <span class="mr-auto px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">Pro</span>
                    </a>

                    <!-- Conversations History -->
                    <div class="mt-6">
                        <p class="text-xs text-gray-500 px-3 mb-2 font-medium flex items-center justify-between">
                            <span>المحادثات السابقة</span>
                            <button id="clearHistory" class="hover:text-red-400 transition-colors" title="مسح الكل">
                                <i class="fas fa-trash-alt text-xs"></i>
                            </button>
                        </p>
                        <div id="conversationsList" class="space-y-1">
                            ${this.renderConversations()}
                        </div>
                    </div>
                </nav>

                <!-- Usage Stats -->
                <div class="p-4 border-t border-gray-800">
                    <div class="bg-gray-800/50 rounded-xl p-3 mb-3">
                        <div class="flex items-center justify-between text-sm mb-2">
                            <span class="text-gray-400">الاستخدام اليومي</span>
                            <span id="usageCount" class="text-orange-400 font-medium">--</span>
                        </div>
                        <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div id="usageBar" class="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <!-- User Section -->
                <div class="p-4 border-t border-gray-800">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-sm font-bold text-white" id="userAvatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-sm text-white truncate" id="userName">مستخدم</p>
                            <p class="text-xs text-gray-500" id="userPlan">
                                <i class="fas fa-crown text-amber-400 ml-1"></i>
                                <span>خطة مجانية</span>
                            </p>
                        </div>
                        <div class="flex gap-1">
                            <a href="/app/settings.html" class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all" title="الإعدادات">
                                <i class="fas fa-cog"></i>
                            </a>
                            <a href="/app/" class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all" title="العودة للمنصة">
                                <i class="fas fa-home"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Mobile Overlay -->
            <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-40 hidden lg:hidden"></div>
        `;
    },

    /**
     * Render conversations list
     */
    renderConversations() {
        if (this.conversations.length === 0) {
            return `
                <div class="text-center py-6 text-gray-600">
                    <i class="fas fa-comments text-2xl mb-2"></i>
                    <p class="text-sm">لا توجد محادثات</p>
                </div>
            `;
        }

        return this.conversations.slice(0, 10).map((conv, index) => `
            <a href="/app/noor/chat.html?id=${conv.id}" class="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all group">
                <i class="fas fa-message text-xs"></i>
                <span class="flex-1 truncate text-sm">${conv.title || 'محادثة ' + (index + 1)}</span>
                <button class="delete-conv opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all" data-id="${conv.id}">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </a>
        `).join('');
    },

    /**
     * Bind events
     */
    bindEvents() {
        // Mobile toggle
        document.getElementById('closeSidebar')?.addEventListener('click', () => this.toggle(false));
        document.getElementById('sidebarOverlay')?.addEventListener('click', () => this.toggle(false));
        document.getElementById('openSidebar')?.addEventListener('click', () => this.toggle(true));

        // Clear history
        document.getElementById('clearHistory')?.addEventListener('click', () => {
            if (confirm('هل تريد مسح جميع المحادثات؟')) {
                localStorage.removeItem('noor_conversations');
                this.conversations = [];
                document.getElementById('conversationsList').innerHTML = this.renderConversations();
            }
        });

        // Delete single conversation
        document.querySelectorAll('.delete-conv').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.dataset.id;
                this.conversations = this.conversations.filter(c => c.id !== id);
                localStorage.setItem('noor_conversations', JSON.stringify(this.conversations));
                document.getElementById('conversationsList').innerHTML = this.renderConversations();
            });
        });
    },

    /**
     * Toggle sidebar (mobile)
     */
    toggle(show) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (show) {
            sidebar?.classList.remove('translate-x-full');
            overlay?.classList.remove('hidden');
        } else {
            sidebar?.classList.add('translate-x-full');
            overlay?.classList.add('hidden');
        }
        this.isOpen = show;
    },

    /**
     * Load conversations from localStorage
     */
    loadConversations() {
        try {
            this.conversations = JSON.parse(localStorage.getItem('noor_conversations') || '[]');
        } catch (e) {
            this.conversations = [];
        }
    },

    /**
     * Save conversation
     */
    saveConversation(id, title, messages) {
        const existing = this.conversations.findIndex(c => c.id === id);
        const conv = { id, title, messages, updatedAt: new Date().toISOString() };
        
        if (existing >= 0) {
            this.conversations[existing] = conv;
        } else {
            this.conversations.unshift(conv);
        }
        
        // Keep only last 20
        this.conversations = this.conversations.slice(0, 20);
        localStorage.setItem('noor_conversations', JSON.stringify(this.conversations));
        document.getElementById('conversationsList').innerHTML = this.renderConversations();
    },

    /**
     * Load user info
     */
    loadUserInfo() {
        const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
        if (user) {
            document.getElementById('userName').textContent = user.fullName || user.username;
            document.getElementById('userAvatar').innerHTML = (user.fullName || user.username).charAt(0).toUpperCase();
            
            const planNames = { free: 'خطة مجانية', pro: 'Pro ⭐', business: 'Business 🚀' };
            const planSpan = document.querySelector('#userPlan span');
            if (planSpan) planSpan.textContent = planNames[user.aiPlan] || 'خطة مجانية';
        }
    },

    /**
     * Load usage stats
     */
    async loadUsage() {
        try {
            const result = await API.request('/noor/usage', { method: 'GET' });
            if (result.success && !result.isGuest) {
                const usage = result.usage?.chatToday || 0;
                const limit = result.limits?.dailyChat || 10;
                const remaining = result.remaining?.chat;
                
                const percent = limit === -1 ? 0 : Math.min(100, (usage / limit) * 100);
                
                document.getElementById('usageCount').textContent = 
                    remaining === -1 ? 'غير محدود' : `${remaining}/${limit}`;
                document.getElementById('usageBar').style.width = `${percent}%`;
            }
        } catch (e) {
            console.error('Load usage error:', e);
        }
    }
};

// Export for use
window.NoorSidebar = NoorSidebar;
