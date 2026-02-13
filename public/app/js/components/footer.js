/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ FOOTER COMPONENT - Tailwind CSS Version
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
            <footer class="text-gray-300 pt-12 pb-6 mt-auto" style="background-color: #000000;">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-gray-800">
                        <!-- Brand -->
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <img src="/app/assets/images/logo2.png" alt="مشرق" class="h-10">
                            </div>
                            <p class="text-gray-400 text-sm leading-relaxed">
                                منصة عربية موثوقة لبيع وشراء الخدمات الرقمية. نربط بين أصحاب المواهب والباحثين عن خدمات احترافية.
                            </p>
                        </div>
                        
                        <!-- للمشترين -->
                        <div>
                            <h4 class="text-white font-bold mb-4">للمشترين</h4>
                            <ul class="space-y-3">
                                <li>
                                    <a href="${CONFIG.ROUTES.EXPLORE}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        استكشف الخدمات
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.BUYER_ORDERS}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        طلباتي
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.HELP}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        كيف تشتري
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.CONTACT}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        الدعم الفني
                                    </a>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- للبائعين -->
                        <div>
                            <h4 class="text-white font-bold mb-4">للبائعين</h4>
                            <ul class="space-y-3">
                                <li>
                                    <a href="${CONFIG.ROUTES.SELLER_ADD_SERVICE}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        أضف خدمة
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.SELLER_DASHBOARD}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        لوحة التحكم
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.BECOME_SELLER}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        كيف تبيع
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.HELP}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        الضمانات
                                    </a>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- الشركة -->
                        <div>
                            <h4 class="text-white font-bold mb-4">الشركة</h4>
                            <ul class="space-y-3">
                                <li>
                                    <a href="${CONFIG.ROUTES.ABOUT}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        عن مشرق
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.PRIVACY}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        سياسة الخصوصية
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.TERMS}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        الشروط والأحكام
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.ROUTES.CONTACT}" class="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        تواصل معنا
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Bottom -->
                    <div class="pt-6 text-center">
                        <p class="text-gray-500 text-sm">© ${currentYear} مشرق. جميع الحقوق محفوظة.</p>
                    </div>
                </div>
            </footer>
        `;
    },
};

// Make Footer object immutable
Object.freeze(Footer);
