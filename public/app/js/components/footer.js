/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ FOOTER COMPONENT
 * منصة مشرق - التذييل
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Footer = {
    /**
     * Render the footer
     */
    render(container) {
        if (!container) {
            container = document.getElementById('footer');
        }
        if (!container) return;
        
        const currentYear = new Date().getFullYear();
        
        container.innerHTML = `
            <footer class="footer">
                <div class="container">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <!-- Brand -->
                        <div>
                            <div class="footer-brand flex items-center gap-2">
                                <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                                    <rect width="40" height="40" rx="10" fill="url(#footer-logo-gradient)"/>
                                    <path d="M12 28V15L20 10L28 15V28" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M20 28V20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                                    <circle cx="20" cy="15" r="2" fill="white"/>
                                    <defs>
                                        <linearGradient id="footer-logo-gradient" x1="0" y1="0" x2="40" y2="40">
                                            <stop stop-color="#F97316"/>
                                            <stop offset="1" stop-color="#EA580C"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                                مشرق
                            </div>
                            <p class="footer-description">
                                منصة عربية موثوقة لبيع وشراء الخدمات الرقمية. نربط بين أصحاب المواهب والباحثين عن خدمات احترافية.
                            </p>
                        </div>
                        
                        <!-- للمشترين -->
                        <div>
                            <h4 class="footer-title">للمشترين</h4>
                            <ul class="footer-links">
                                <li><a href="${CONFIG.ROUTES.EXPLORE}">استكشف الخدمات</a></li>
                                <li><a href="${CONFIG.ROUTES.BUYER_ORDERS}">طلباتي</a></li>
                                <li><a href="#">كيف تشتري</a></li>
                                <li><a href="#">الدعم الفني</a></li>
                            </ul>
                        </div>
                        
                        <!-- للبائعين -->
                        <div>
                            <h4 class="footer-title">للبائعين</h4>
                            <ul class="footer-links">
                                <li><a href="${CONFIG.ROUTES.SELLER_ADD_SERVICE}">أضف خدمة</a></li>
                                <li><a href="${CONFIG.ROUTES.SELLER_DASHBOARD}">لوحة التحكم</a></li>
                                <li><a href="#">كيف تبيع</a></li>
                                <li><a href="#">الضمانات</a></li>
                            </ul>
                        </div>
                        
                        <!-- الشركة -->
                        <div>
                            <h4 class="footer-title">الشركة</h4>
                            <ul class="footer-links">
                                <li><a href="#">عن مشرق</a></li>
                                <li><a href="#">سياسة الخصوصية</a></li>
                                <li><a href="#">الشروط والأحكام</a></li>
                                <li><a href="#">تواصل معنا</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Bottom -->
                    <div class="footer-bottom">
                        <p>© ${currentYear} مشرق. جميع الحقوق محفوظة.</p>
                    </div>
                </div>
            </footer>
        `;
    },
};

// Make Footer object immutable
Object.freeze(Footer);
