/* ========================================
   Mashriq (مشرق) - Wallet Page
   ======================================== */

(async function() {
    'use strict';

    let stripe = null;
    let selectedAmount = 50;

    async function init() {
        if (!Auth.isLoggedIn()) {
            window.location.href = CONFIG.ROUTES.LOGIN + '?redirect=' + encodeURIComponent(window.location.href);
            return;
        }

        await loadStripeConfig();
        await loadWalletData();
        setupEventListeners();
        checkPaymentStatus();
    }

    async function loadStripeConfig() {
        try {
            const response = await API.get('/api/stripe/config');
            if (response.success && response.data.publishableKey) {
                stripe = Stripe(response.data.publishableKey);
            }
        } catch (err) {
            console.error('Failed to load Stripe config:', err);
            Toast.error('حدث خطأ في تحميل إعدادات الدفع');
        }
    }

    async function loadWalletData() {
        try {
            const [balanceRes, transactionsRes] = await Promise.all([
                API.get('/api/stripe/balance'),
                API.get('/api/stripe/transactions?limit=5')
            ]);

            if (balanceRes.success) {
                const data = balanceRes.data;
                document.getElementById('availableBalance').textContent = `$${data.availableBalance.toFixed(2)}`;
                document.getElementById('pendingBalance').textContent = `$${data.pendingBalance.toFixed(2)}`;
                document.getElementById('totalEarned').textContent = `$${data.totalEarned.toFixed(2)}`;
            }

            if (transactionsRes.success && transactionsRes.data.transactions.length > 0) {
                renderTransactions(transactionsRes.data.transactions);
            }
        } catch (err) {
            console.error('Failed to load wallet data:', err);
        }
    }

    function renderTransactions(transactions) {
        const container = document.getElementById('recentTransactions');
        
        if (!transactions || transactions.length === 0) {
            return;
        }

        const typeLabels = {
            'deposit': { label: 'إيداع', icon: '+', class: 'text-green-600 bg-green-100' },
            'escrow_hold': { label: 'حجز ضمان', icon: '-', class: 'text-orange-600 bg-orange-100' },
            'escrow_release': { label: 'استلام أرباح', icon: '+', class: 'text-green-600 bg-green-100' },
            'escrow_refund': { label: 'استرداد', icon: '+', class: 'text-blue-600 bg-blue-100' },
            'platform_fee': { label: 'عمولة المنصة', icon: '-', class: 'text-gray-600 bg-gray-100' },
            'withdrawal': { label: 'سحب', icon: '-', class: 'text-red-600 bg-red-100' }
        };

        container.innerHTML = transactions.map(tx => {
            const typeInfo = typeLabels[tx.type] || { label: tx.type, icon: '', class: 'text-gray-600 bg-gray-100' };
            const date = new Date(tx.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
            const isCredit = tx.direction === 'credit';
            
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 ${typeInfo.class} rounded-lg flex items-center justify-center text-sm font-bold">
                            ${typeInfo.icon}
                        </div>
                        <div>
                            <div class="font-medium text-gray-900 text-sm">${typeInfo.label}</div>
                            <div class="text-xs text-gray-500">${date}</div>
                        </div>
                    </div>
                    <div class="font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}">
                        ${isCredit ? '+' : '-'}$${tx.amount.toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
    }

    function setupEventListeners() {
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.amount-btn').forEach(b => {
                    b.classList.remove('border-primary-500', 'bg-primary-50', 'text-primary-600');
                    b.classList.add('border-gray-200', 'text-gray-700');
                });
                
                btn.classList.remove('border-gray-200', 'text-gray-700');
                btn.classList.add('border-primary-500', 'bg-primary-50', 'text-primary-600');
                
                selectedAmount = parseFloat(btn.dataset.amount);
                document.getElementById('customAmount').value = '';
                updateAmountDisplay();
            });
        });

        document.getElementById('customAmount').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value >= 5 && value <= 1000) {
                selectedAmount = value;
                
                document.querySelectorAll('.amount-btn').forEach(b => {
                    b.classList.remove('border-primary-500', 'bg-primary-50', 'text-primary-600');
                    b.classList.add('border-gray-200', 'text-gray-700');
                });
                
                updateAmountDisplay();
            }
        });

        document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    }

    function updateAmountDisplay() {
        document.getElementById('selectedAmountDisplay').textContent = `$${selectedAmount.toFixed(2)}`;
        document.getElementById('finalAmountDisplay').textContent = `$${selectedAmount.toFixed(2)}`;
    }

    async function handleCheckout() {
        if (!stripe) {
            Toast.error('خدمة الدفع غير متاحة حالياً');
            return;
        }

        if (selectedAmount < 5 || selectedAmount > 1000) {
            Toast.error('المبلغ يجب أن يكون بين 5 و 1000 دولار');
            return;
        }

        const btn = document.getElementById('checkoutBtn');
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            جاري التحويل...
        `;

        try {
            const response = await API.post('/api/stripe/create-checkout', {
                amount: selectedAmount
            });

            if (response.success && response.data.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error(response.message || 'فشل إنشاء جلسة الدفع');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            Toast.error(err.message || 'حدث خطأ في عملية الدفع');
            
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                الدفع عبر Stripe
            `;
        }
    }

    async function checkPaymentStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        const sessionId = urlParams.get('session_id');

        if (paymentStatus === 'success' && sessionId) {
            const statusDiv = document.getElementById('paymentStatus');
            statusDiv.className = 'mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800';
            statusDiv.innerHTML = `
                <div class="flex items-center gap-3">
                    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>جاري التحقق من الدفع...</span>
                </div>
            `;
            statusDiv.classList.remove('hidden');

            try {
                const response = await API.post('/api/stripe/verify-payment', { sessionId });

                if (response.success) {
                    statusDiv.className = 'mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800';
                    statusDiv.innerHTML = `
                        <div class="flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                                <polyline points="22,4 12,14.01 9,11.01"/>
                            </svg>
                            <div>
                                <div class="font-bold">تم شحن رصيدك بنجاح!</div>
                                <div class="text-sm">تمت إضافة $${response.data.amount} إلى محفظتك. رصيدك الجديد: $${response.data.newBalance.toFixed(2)}</div>
                            </div>
                        </div>
                    `;
                    
                    await loadWalletData();
                    
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    throw new Error(response.message);
                }
            } catch (err) {
                statusDiv.className = 'mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800';
                statusDiv.innerHTML = `
                    <div class="flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <div>
                            <div class="font-bold">حدث خطأ</div>
                            <div class="text-sm">${err.message || 'فشل التحقق من الدفع. يرجى التواصل مع الدعم.'}</div>
                        </div>
                    </div>
                `;
            }
        } else if (paymentStatus === 'cancelled') {
            const statusDiv = document.getElementById('paymentStatus');
            statusDiv.className = 'mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800';
            statusDiv.innerHTML = `
                <div class="flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى.</span>
                </div>
            `;
            statusDiv.classList.remove('hidden');
            
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
