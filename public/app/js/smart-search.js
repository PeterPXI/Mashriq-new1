/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ SMART SEARCH ENGINE
 * محرك البحث الذكي - AI-Powered Search
 * 
 * Features:
 * - Intent Detection (فهم نية المستخدم)
 * - Fuzzy Matching (تصحيح الأخطاء الإملائية)
 * - Semantic Mapping (المرادفات والمعاني)
 * - Weighted Scoring (ترتيب بالأهمية)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SmartSearch = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // SEMANTIC INTENT MAP - Maps keywords to related terms
    // ═══════════════════════════════════════════════════════════════════════
    
    const INTENT_MAP = {
        // === Design ===
        'تصميم': ['design', 'graphic', 'شعار', 'هوية', 'بصرية', 'جرافيك', 'لوجو', 'بوستر', 'فلاير', 'كارت', 'ui', 'ux'],
        'شعار': ['logo', 'brand', 'identity', 'تصميم', 'هوية', 'لوجو', 'براند', 'علامة'],
        'هوية': ['identity', 'brand', 'branding', 'شعار', 'بصرية', 'تصميم', 'براندنج'],
        'جرافيك': ['graphic', 'design', 'تصميم', 'بوستر', 'سوشيال', 'اعلان'],
        'ui': ['واجهة', 'تصميم', 'موقع', 'تطبيق', 'ux', 'interface', 'user'],
        'ux': ['تجربة', 'مستخدم', 'ui', 'interface', 'واجهة', 'تصميم'],
        
        // === Development ===
        'برمجة': ['programming', 'code', 'development', 'موقع', 'تطبيق', 'كود', 'مبرمج', 'developer', 'web', 'app'],
        'موقع': ['website', 'web', 'frontend', 'برمجة', 'ووردبريس', 'html', 'css', 'react', 'site'],
        'تطبيق': ['app', 'application', 'mobile', 'android', 'ios', 'flutter', 'react native', 'موبايل'],
        'ووردبريس': ['wordpress', 'wp', 'موقع', 'cms', 'theme', 'plugin', 'برمجة'],
        'frontend': ['واجهة', 'امامية', 'html', 'css', 'javascript', 'react', 'vue', 'موقع'],
        'backend': ['خلفية', 'سيرفر', 'api', 'node', 'python', 'php', 'database', 'قاعدة بيانات'],
        
        // === Writing ===
        'كتابة': ['writing', 'content', 'محتوى', 'مقالات', 'سيو', 'كاتب', 'نصوص', 'copywriting'],
        'محتوى': ['content', 'writing', 'كتابة', 'مقال', 'بوست', 'سوشيال', 'marketing'],
        'مقال': ['article', 'blog', 'كتابة', 'محتوى', 'بلوج', 'مدونة'],
        'ترجمة': ['translation', 'translate', 'لغات', 'انجليزي', 'عربي', 'فرنسي', 'مترجم', 'localization'],
        'سيو': ['seo', 'search', 'optimization', 'محركات', 'بحث', 'جوجل', 'كتابة', 'محتوى'],
        
        // === Video & Animation ===
        'فيديو': ['video', 'animation', 'motion', 'مونتاج', 'موشن', 'يوتيوب', 'تصوير', 'افتر افكت'],
        'مونتاج': ['editing', 'video', 'فيديو', 'يوتيوب', 'premiere', 'ادوبي', 'قص', 'montage'],
        'موشن': ['motion', 'graphics', 'animation', 'فيديو', 'انيميشن', 'افتر افكت', 'after effects'],
        'يوتيوب': ['youtube', 'فيديو', 'مونتاج', 'ثامنيل', 'قناة', 'محتوى'],
        
        // === Marketing ===
        'تسويق': ['marketing', 'social', 'ads', 'اعلانات', 'سوشيال', 'ميديا', 'حملات', 'digital'],
        'اعلانات': ['ads', 'advertising', 'تسويق', 'فيسبوك', 'جوجل', 'حملة', 'campaign'],
        'سوشيال': ['social', 'media', 'انستقرام', 'فيسبوك', 'تويتر', 'تسويق', 'محتوى'],
        
        // === Audio ===
        'صوت': ['voice', 'audio', 'تعليق', 'صوتي', 'voiceover', 'تسجيل', 'بودكاست'],
        'تعليق صوتي': ['voiceover', 'voice', 'صوت', 'تسجيل', 'اعلان', 'فيديو'],
        
        // === Business ===
        'استشارة': ['consulting', 'consultant', 'نصيحة', 'خبير', 'business', 'اعمال'],
        'ادارة': ['management', 'admin', 'مشروع', 'project', 'اعمال'],
        
        // === English terms mapping ===
        'design': ['تصميم', 'شعار', 'جرافيك', 'هوية'],
        'logo': ['شعار', 'لوجو', 'تصميم', 'براند'],
        'website': ['موقع', 'ويب', 'برمجة', 'ووردبريس'],
        'app': ['تطبيق', 'موبايل', 'برمجة'],
        'video': ['فيديو', 'مونتاج', 'موشن'],
        'marketing': ['تسويق', 'اعلانات', 'سوشيال'],
        'writing': ['كتابة', 'محتوى', 'مقال'],
        'translation': ['ترجمة', 'مترجم', 'لغات'],
        'seo': ['سيو', 'بحث', 'جوجل', 'محركات'],
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SAMPLE DATA (Replace with real API data)
    // ═══════════════════════════════════════════════════════════════════════
    
    const SAMPLE_SERVICES = [
        { id: 1, title: 'تصميم شعار احترافي', category: 'design', tags: ['logo', 'شعار', 'brand', 'هوية'], price: 25 },
        { id: 2, title: 'تصميم هوية بصرية كاملة', category: 'design', tags: ['identity', 'هوية', 'brand', 'شعار'], price: 100 },
        { id: 3, title: 'تصميم بوستات سوشيال ميديا', category: 'design', tags: ['social', 'سوشيال', 'انستقرام', 'فيسبوك'], price: 15 },
        { id: 4, title: 'تصميم واجهة تطبيق UI/UX', category: 'design', tags: ['ui', 'ux', 'app', 'تطبيق', 'موبايل'], price: 150 },
        { id: 5, title: 'تطوير موقع ووردبريس', category: 'programming', tags: ['wordpress', 'ووردبريس', 'موقع', 'web'], price: 200 },
        { id: 6, title: 'برمجة موقع React/Next.js', category: 'programming', tags: ['react', 'nextjs', 'frontend', 'موقع'], price: 300 },
        { id: 7, title: 'تطوير تطبيق موبايل Flutter', category: 'programming', tags: ['flutter', 'app', 'تطبيق', 'موبايل', 'android', 'ios'], price: 500 },
        { id: 8, title: 'برمجة API و Backend', category: 'programming', tags: ['api', 'backend', 'node', 'خلفية'], price: 250 },
        { id: 9, title: 'كتابة محتوى تسويقي', category: 'writing', tags: ['content', 'محتوى', 'تسويق', 'كتابة'], price: 20 },
        { id: 10, title: 'كتابة مقالات SEO', category: 'writing', tags: ['seo', 'سيو', 'مقال', 'كتابة', 'جوجل'], price: 30 },
        { id: 11, title: 'ترجمة انجليزي - عربي', category: 'translation', tags: ['ترجمة', 'انجليزي', 'عربي', 'translation'], price: 10 },
        { id: 12, title: 'ترجمة فرنسي - عربي', category: 'translation', tags: ['ترجمة', 'فرنسي', 'عربي', 'french'], price: 15 },
        { id: 13, title: 'مونتاج فيديو احترافي', category: 'video', tags: ['مونتاج', 'فيديو', 'editing', 'يوتيوب'], price: 50 },
        { id: 14, title: 'فيديو موشن جرافيك', category: 'video', tags: ['موشن', 'motion', 'animation', 'فيديو'], price: 100 },
        { id: 15, title: 'تصميم ثامنيل يوتيوب', category: 'design', tags: ['يوتيوب', 'thumbnail', 'تصميم'], price: 10 },
        { id: 16, title: 'ادارة حملات اعلانية', category: 'marketing', tags: ['اعلانات', 'تسويق', 'فيسبوك', 'جوجل', 'ads'], price: 150 },
        { id: 17, title: 'ادارة حسابات سوشيال ميديا', category: 'marketing', tags: ['سوشيال', 'ميديا', 'انستقرام', 'تسويق'], price: 100 },
        { id: 18, title: 'تعليق صوتي احترافي', category: 'audio', tags: ['صوت', 'voiceover', 'تعليق', 'اعلان'], price: 25 },
        { id: 19, title: 'تفريغ صوتي ونصي', category: 'audio', tags: ['تفريغ', 'صوت', 'transcription'], price: 15 },
        { id: 20, title: 'استشارة تسويقية', category: 'business', tags: ['استشارة', 'تسويق', 'consulting'], price: 50 },
    ];

    const CATEGORIES = [
        { id: 'design', name: 'التصميم والجرافيك', icon: '🎨' },
        { id: 'programming', name: 'البرمجة والتطوير', icon: '💻' },
        { id: 'writing', name: 'الكتابة والمحتوى', icon: '✍️' },
        { id: 'translation', name: 'الترجمة واللغات', icon: '🌍' },
        { id: 'video', name: 'الفيديو والأنيميشن', icon: '🎬' },
        { id: 'marketing', name: 'التسويق الرقمي', icon: '📈' },
        { id: 'audio', name: 'الصوتيات', icon: '🎙️' },
        { id: 'business', name: 'الأعمال', icon: '💼' },
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // SCORING WEIGHTS
    // ═══════════════════════════════════════════════════════════════════════
    
    const WEIGHTS = {
        EXACT_MATCH: 100,      // Exact word match
        INTENT_MATCH: 80,      // Intent/semantic match
        FUZZY_HIGH: 60,        // High fuzzy match (>0.8)
        FUZZY_MEDIUM: 40,      // Medium fuzzy match (>0.6)
        PARTIAL_MATCH: 30,     // Partial string match
        TAG_MATCH: 50,         // Tag/keyword match
        CATEGORY_MATCH: 70,    // Category name match
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Normalize Arabic text (remove diacritics, normalize letters)
     */
    function normalizeArabic(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/[ًٌٍَُِّْ]/g, '') // Remove diacritics
            .replace(/[إأآا]/g, 'ا')   // Normalize alef
            .replace(/ة/g, 'ه')        // Normalize taa marbuta
            .replace(/ى/g, 'ي')        // Normalize alef maksura
            .replace(/ؤ/g, 'و')        // Normalize waw hamza
            .replace(/ئ/g, 'ي')        // Normalize yaa hamza
            .trim();
    }

    /**
     * Levenshtein distance for fuzzy matching
     */
    function levenshteinDistance(a, b) {
        if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
        
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }

    /**
     * Calculate fuzzy similarity score (0-1)
     */
    function fuzzyScore(query, text) {
        const normalizedQuery = normalizeArabic(query);
        const normalizedText = normalizeArabic(text);
        
        if (!normalizedQuery || !normalizedText) return 0;
        
        const distance = levenshteinDistance(normalizedQuery, normalizedText);
        const maxLength = Math.max(normalizedQuery.length, normalizedText.length);
        
        return 1 - (distance / maxLength);
    }

    /**
     * Check if text contains query (partial match)
     */
    function containsMatch(query, text) {
        const normalizedQuery = normalizeArabic(query);
        const normalizedText = normalizeArabic(text);
        return normalizedText.includes(normalizedQuery);
    }

    /**
     * Get semantic matches for a query
     */
    function getSemanticMatches(query) {
        const normalizedQuery = normalizeArabic(query);
        const matches = new Set();
        
        // Direct lookup
        for (const [key, values] of Object.entries(INTENT_MAP)) {
            const normalizedKey = normalizeArabic(key);
            
            // Check if query matches key
            if (normalizedKey.includes(normalizedQuery) || normalizedQuery.includes(normalizedKey)) {
                values.forEach(v => matches.add(normalizeArabic(v)));
                matches.add(normalizedKey);
            }
            
            // Check if query matches any value
            for (const value of values) {
                const normalizedValue = normalizeArabic(value);
                if (normalizedValue.includes(normalizedQuery) || normalizedQuery.includes(normalizedValue)) {
                    matches.add(normalizedKey);
                    values.forEach(v => matches.add(normalizeArabic(v)));
                    break;
                }
            }
        }
        
        return Array.from(matches);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN SEARCH FUNCTION
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Main search function
     * @param {string} query - User search query
     * @param {Object} options - Search options
     * @returns {Object} Search results with services, categories, and suggestions
     */
    function search(query, options = {}) {
        const startTime = performance.now();
        
        if (!query || query.trim().length < 2) {
            return {
                services: [],
                categories: [],
                suggestions: [],
                meta: { query, time: 0, count: 0 }
            };
        }

        const normalizedQuery = normalizeArabic(query.trim());
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
        
        // Get semantic matches for intent understanding
        const semanticTerms = getSemanticMatches(normalizedQuery);
        queryWords.forEach(word => {
            getSemanticMatches(word).forEach(term => semanticTerms.push(term));
        });
        
        const services = options.services || SAMPLE_SERVICES;
        const scoredServices = [];
        
        // Score each service
        for (const service of services) {
            let score = 0;
            const matchedTerms = [];
            
            const normalizedTitle = normalizeArabic(service.title);
            const normalizedTags = service.tags?.map(t => normalizeArabic(t)) || [];
            
            // === Check title ===
            
            // Exact match in title
            if (normalizedTitle.includes(normalizedQuery)) {
                score += WEIGHTS.EXACT_MATCH;
                matchedTerms.push({ type: 'exact', term: query });
            }
            
            // Word-by-word match in title
            for (const word of queryWords) {
                if (normalizedTitle.includes(word)) {
                    score += WEIGHTS.PARTIAL_MATCH;
                    matchedTerms.push({ type: 'partial', term: word });
                }
            }
            
            // Semantic/intent match in title
            for (const term of semanticTerms) {
                if (normalizedTitle.includes(term)) {
                    score += WEIGHTS.INTENT_MATCH;
                    matchedTerms.push({ type: 'semantic', term });
                }
            }
            
            // Fuzzy match on title words
            const titleWords = normalizedTitle.split(/\s+/);
            for (const titleWord of titleWords) {
                for (const queryWord of queryWords) {
                    const similarity = fuzzyScore(queryWord, titleWord);
                    if (similarity > 0.8) {
                        score += WEIGHTS.FUZZY_HIGH;
                        matchedTerms.push({ type: 'fuzzy', term: titleWord, similarity });
                    } else if (similarity > 0.6) {
                        score += WEIGHTS.FUZZY_MEDIUM;
                        matchedTerms.push({ type: 'fuzzy', term: titleWord, similarity });
                    }
                }
            }
            
            // === Check tags ===
            for (const tag of normalizedTags) {
                // Exact tag match
                if (tag === normalizedQuery || queryWords.includes(tag)) {
                    score += WEIGHTS.TAG_MATCH;
                    matchedTerms.push({ type: 'tag', term: tag });
                }
                
                // Semantic match in tags
                if (semanticTerms.includes(tag)) {
                    score += WEIGHTS.INTENT_MATCH * 0.5;
                    matchedTerms.push({ type: 'semantic-tag', term: tag });
                }
                
                // Fuzzy match in tags
                for (const queryWord of queryWords) {
                    const similarity = fuzzyScore(queryWord, tag);
                    if (similarity > 0.7) {
                        score += WEIGHTS.FUZZY_MEDIUM * 0.5;
                    }
                }
            }
            
            // Only include services with a positive score
            if (score > 0) {
                scoredServices.push({
                    ...service,
                    _score: score,
                    _matchedTerms: matchedTerms,
                    _matchType: getMatchType(score)
                });
            }
        }
        
        // Sort by score (highest first)
        scoredServices.sort((a, b) => b._score - a._score);
        
        // === Search categories ===
        const scoredCategories = [];
        for (const category of CATEGORIES) {
            const normalizedName = normalizeArabic(category.name);
            let score = 0;
            
            if (normalizedName.includes(normalizedQuery)) {
                score += WEIGHTS.CATEGORY_MATCH;
            }
            
            for (const term of semanticTerms) {
                if (normalizedName.includes(term) || category.id.includes(term)) {
                    score += WEIGHTS.INTENT_MATCH;
                }
            }
            
            if (score > 0) {
                scoredCategories.push({ ...category, _score: score });
            }
        }
        
        scoredCategories.sort((a, b) => b._score - a._score);
        
        // === Generate smart suggestions ===
        const suggestions = generateSuggestions(normalizedQuery, semanticTerms, scoredServices);
        
        const endTime = performance.now();
        
        return {
            services: scoredServices.slice(0, options.limit || 8),
            categories: scoredCategories.slice(0, 3),
            suggestions: suggestions.slice(0, 5),
            meta: {
                query: query,
                normalizedQuery,
                semanticTerms: semanticTerms.slice(0, 10),
                time: Math.round(endTime - startTime),
                totalFound: scoredServices.length
            }
        };
    }

    /**
     * Determine match type label
     */
    function getMatchType(score) {
        if (score >= 100) return 'exact';
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    /**
     * Generate smart search suggestions
     */
    function generateSuggestions(query, semanticTerms, results) {
        const suggestions = [];
        
        // Add top semantic terms as suggestions
        semanticTerms.slice(0, 3).forEach(term => {
            if (term !== query && term.length > 2) {
                suggestions.push({
                    text: term,
                    type: 'semantic',
                    label: 'بحث مشابه'
                });
            }
        });
        
        // Add popular from results
        if (results.length > 0) {
            const topCategories = [...new Set(results.slice(0, 5).map(r => r.category))];
            topCategories.slice(0, 2).forEach(catId => {
                const cat = CATEGORIES.find(c => c.id === catId);
                if (cat) {
                    suggestions.push({
                        text: cat.name,
                        type: 'category',
                        label: 'تصفح التصنيف',
                        categoryId: catId
                    });
                }
            });
        }
        
        return suggestions;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TYPO CORRECTION (Common Arabic/English typos)
    // ═══════════════════════════════════════════════════════════════════════
    
    const TYPO_CORRECTIONS = {
        'desgin': 'design',
        'deisgn': 'design',
        'tصميم': 'تصميم',
        'شاعر': 'شعار',
        'شعر': 'شعار',
        'لوقو': 'لوجو',
        'برمحة': 'برمجة',
        'موق': 'موقع',
        'تطبقي': 'تطبيق',
        'كتاب': 'كتابة',
        'فديو': 'فيديو',
        'فيدو': 'فيديو',
        'مونتج': 'مونتاج',
        'ترجم': 'ترجمة',
        'تسوق': 'تسويق',
        'اعلان': 'اعلانات',
    };

    /**
     * Correct common typos
     */
    function correctTypos(query) {
        let corrected = query.toLowerCase();
        
        for (const [typo, correction] of Object.entries(TYPO_CORRECTIONS)) {
            if (corrected.includes(typo)) {
                corrected = corrected.replace(typo, correction);
            }
        }
        
        return corrected;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════
    
    return {
        /**
         * Main search function
         */
        search: function(query, options = {}) {
            // Auto-correct typos
            const correctedQuery = correctTypos(query);
            return search(correctedQuery, options);
        },

        /**
         * Get semantic suggestions for autocomplete
         */
        getSuggestions: function(query) {
            if (!query || query.length < 2) return [];
            return getSemanticMatches(normalizeArabic(query)).slice(0, 5);
        },

        /**
         * Detect intent from query
         */
        detectIntent: function(query) {
            const terms = getSemanticMatches(normalizeArabic(query));
            if (terms.length === 0) return null;
            
            // Find the most relevant category
            for (const cat of CATEGORIES) {
                if (terms.some(t => cat.id.includes(t) || cat.name.includes(t))) {
                    return cat;
                }
            }
            
            return { intent: terms[0], relatedTerms: terms.slice(1, 5) };
        },

        /**
         * Highlight matched terms in text
         */
        highlightMatches: function(text, query) {
            if (!text || !query) return text;
            
            const normalizedQuery = normalizeArabic(query);
            const words = normalizedQuery.split(/\s+/);
            let result = text;
            
            words.forEach(word => {
                if (word.length < 2) return;
                const regex = new RegExp(`(${word})`, 'gi');
                result = result.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">$1</mark>');
            });
            
            return result;
        },

        /**
         * Get all categories
         */
        getCategories: function() {
            return CATEGORIES;
        },

        /**
         * Update services data (for real API integration)
         */
        setServices: function(services) {
            // This will be used when integrating with real API
            console.log('SmartSearch: Services updated', services?.length);
        },

        // Expose for testing
        _fuzzyScore: fuzzyScore,
        _normalizeArabic: normalizeArabic,
        _getSemanticMatches: getSemanticMatches,
    };
})();

// Make SmartSearch available globally
if (typeof window !== 'undefined') {
    window.SmartSearch = SmartSearch;
}
