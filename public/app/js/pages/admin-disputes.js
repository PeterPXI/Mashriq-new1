(function() {
    'use strict';
    
    const state = {
        disputes: [],
        selectedDispute: null,
        selectedResolution: null,
    };
    
    const elements = {
        navbar: document.getElementById('navbar'),
        footer: document.getElementById('footer'),
        disputesLoading: document.getElementById('disputesLoading'),
        disputesList: document.getElementById('disputesList'),
        emptyState: document.getElementById('emptyState'),
        statusFilter: document.getElementById('statusFilter'),
        resolveModal: document.getElementById('resolveModal'),
        cancelResolve: document.getElementById('cancelResolve'),
        confirmResolve: document.getElementById('confirmResolve'),
        resolutionNotes: document.getElementById('resolutionNotes'),
    };
    
    const STATUS_MAP = {
        open: { label: 'مفتوح', color: 'red' },
        under_review: { label: 'قيد المراجعة', color: 'yellow' },
        resolved: { label: 'محلول', color: 'green' },
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
        await loadDisputes();
    }
    
    function bindEvents() {
        elements.statusFilter?.addEventListener('change', () => loadDisputes());
        elements.cancelResolve?.addEventListener('click', closeModal);
        elements.confirmResolve?.addEventListener('click', resolveDispute);
        
        document.querySelectorAll('.resolution-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.resolution-btn').forEach(b => b.classList.remove('ring-2', 'ring-primary-500'));
                btn.classList.add('ring-2', 'ring-primary-500');
                state.selectedResolution = btn.dataset.resolution;
            });
        });
        
        elements.resolveModal?.addEventListener('click', (e) => {
            if (e.target === elements.resolveModal) closeModal();
        });
    }
    
    async function loadDisputes() {
        elements.disputesLoading.classList.remove('hidden');
        elements.disputesList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
        
        try {
            const status = elements.statusFilter?.value || '';
            const response = await API.get('/admin/disputes' + (status ? `?status=${status}` : ''));
            state.disputes = response.data?.disputes || [];
            
            if (state.disputes.length === 0) {
                showEmptyState();
            } else {
                renderDisputes();
            }
        } catch (error) {
            console.error('Failed to load disputes:', error);
            Toast.error('خطأ', 'تعذر تحميل النزاعات');
            showEmptyState();
        } finally {
            elements.disputesLoading.classList.add('hidden');
        }
    }
    
    function renderDisputes() {
        elements.disputesList.classList.remove('hidden');
        
        elements.disputesList.innerHTML = state.disputes.map(dispute => {
            const statusInfo = STATUS_MAP[dispute.status] || STATUS_MAP.open;
            const buyerName = dispute.buyerId?.fullName || 'المشتري';
            const sellerName = dispute.sellerId?.fullName || 'البائع';
            const serviceTitle = dispute.orderId?.serviceSnapshot?.title || 'خدمة';
            const createdAt = new Date(dispute.createdAt).toLocaleDateString('ar-EG');
            
            return `
                <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="px-3 py-1 text-xs font-medium rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700">${statusInfo.label}</span>
                                <span class="text-xs text-gray-400">${createdAt}</span>
                            </div>
                            <h3 class="font-bold text-gray-900 mb-1">${Utils.escapeHtml(serviceTitle)}</h3>
                            <p class="text-sm text-gray-600 mb-2">${Utils.escapeHtml(dispute.reason || 'لا يوجد سبب محدد')}</p>
                            <div class="flex items-center gap-4 text-sm text-gray-500">
                                <span>المشتري: <strong>${Utils.escapeHtml(buyerName)}</strong></span>
                                <span>البائع: <strong>${Utils.escapeHtml(sellerName)}</strong></span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <a href="/app/order.html?id=${dispute.orderId?._id || dispute.orderId}" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                عرض الطلب
                            </a>
                            ${dispute.status !== 'resolved' ? `
                                <button class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors" onclick="window.openResolveModal('${dispute._id}')">
                                    حل النزاع
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function showEmptyState() {
        elements.disputesList.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    }
    
    window.openResolveModal = function(disputeId) {
        state.selectedDispute = disputeId;
        state.selectedResolution = null;
        elements.resolutionNotes.value = '';
        document.querySelectorAll('.resolution-btn').forEach(b => b.classList.remove('ring-2', 'ring-primary-500'));
        elements.resolveModal.classList.remove('hidden');
        elements.resolveModal.classList.add('flex');
    };
    
    function closeModal() {
        elements.resolveModal.classList.add('hidden');
        elements.resolveModal.classList.remove('flex');
        state.selectedDispute = null;
        state.selectedResolution = null;
    }
    
    async function resolveDispute() {
        if (!state.selectedDispute || !state.selectedResolution) {
            Toast.warning('تنبيه', 'يرجى اختيار القرار');
            return;
        }
        
        Loader.buttonStart(elements.confirmResolve);
        
        try {
            await API.put(`/admin/disputes/${state.selectedDispute}/resolve`, {
                resolution: state.selectedResolution,
                adminNotes: elements.resolutionNotes.value
            });
            
            Toast.success('تم', 'تم حل النزاع بنجاح');
            closeModal();
            await loadDisputes();
        } catch (error) {
            console.error('Failed to resolve dispute:', error);
            Toast.error('خطأ', error.message || 'فشل حل النزاع');
        } finally {
            Loader.buttonStop(elements.confirmResolve);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
