// cookies.js
export const CookieService = {
    // Verify if the user gave his consent
    hasConsent: () => {
        const consentData = localStorage.getItem('cookieConsent');
        return consentData ? JSON.parse(consentData).consented : false;
    },

    // Save the user's consent
    setConsent: (consent, preferences = {}) => {
        const consentData = {
            consented: consent,
            date: new Date().toISOString(),
            preferences: {
                necessary: true, // Always true
                analytics: preferences.analytics || false,

                performance: preferences.performance || false,

            }
        };

        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        document.cookie = `cookieConsent=${consent}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;

        if (consent) {
            // Activate cookies based on preferences
            CookieService.enableNecessaryCookies();
            if (preferences.analytics) CookieService.enableAnalyticsCookies();

            if (preferences.performance) CookieService.enablePerformanceCookies();

        } else {
            CookieService.disableNonEssentialCookies();
        }
    },

    // Get current preferences
    getPreferences: () => {
        const consentData = localStorage.getItem('cookieConsent');
        return consentData ? JSON.parse(consentData).preferences : null;
    },

    //  NECESSARY COOKIES (always active) ===
    enableNecessaryCookies: () => {
        // Session cookie for authentication
        document.cookie = 'session_id=active; path=/; samesite=strict';

        // CSRF protection token
        const csrfToken = Math.random().toString(36).substring(2);
        document.cookie = `csrf_token=${csrfToken}; path=/; samesite=strict`;

        // Language preference
        const language = navigator.language || 'en';
        document.cookie = `user_language=${language}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;

        // Shopping cart functionality
        document.cookie = 'cart_session=active; path=/; samesite=lax';

        console.log('Necessary cookies enabled');
    },

    //  PERFORMANCE COOKIES 
    enablePerformanceCookies: () => {
        // Page load performance tracking
        if (typeof window !== 'undefined' && window.performance) {
            const loadTime = performance.now();
            document.cookie = `perf_load_time=${loadTime}; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;
        }

        // Browser capabilities
        const browserInfo = {
            js: true,
            cookies: true,
            screen: `${screen.width}x${screen.height}`,
            agent: navigator.userAgent.substring(0, 100)
        };
        document.cookie = `browser_info=${JSON.stringify(browserInfo)}; max-age=${7 * 24 * 60 * 60}; path=/; samesite=lax`;

        // Resource loading optimization
        document.cookie = 'perf_optimized=true; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax';

        console.log('Performance cookies enabled');

        // Start performance monitoring
        CookieService.monitorPerformance();
    },

    // Performance monitoring function
    monitorPerformance: () => {
        if (typeof window === 'undefined') return;

        // Track largest contentful paint
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            document.cookie = `lcp_time=${lastEntry.startTime}; max-age=${3600}; path=/; samesite=lax`;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Track cumulative layout shift
        let clsValue = 0;
        let clsEntries = [];

        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    clsEntries.push(entry);
                }
            }
            document.cookie = `cls_score=${clsValue}; max-age=${3600}; path=/; samesite=lax`;
        }).observe({ type: 'layout-shift', buffered: true });
    },
    initializeTracking: () => {
        if (CookieService.isAllowed('analytics')) {
            console.log('📊 Analytics cookies active');
            CookieService.enableAnalyticsCookies();
            const analyticsData = CookieService.getAnalyticsData();
            console.log(`👤 Visits: ${analyticsData.visitCount}`);
            console.log(`📄 Page Views: ${analyticsData.pageViews}`);
            console.log(`⏰ Total time spent: ${analyticsData.totalTimeSpentMinutes} minutes`);
        }

        if (CookieService.isAllowed('performance')) {
            console.log('⚡ Performance cookies active');
            CookieService.enablePerformanceCookies();

            if (typeof window !== 'undefined' && window.performance) {
                const loadTime = performance.now();
                document.cookie = `perf_load_time=${loadTime}; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;
                console.log('📈 App loaded in:', loadTime.toFixed(2), 'ms');
            }
        }
    },
    //ANALYTICS COOKIES
    enableAnalyticsCookies: () => {
        const today = new Date().toDateString();
        // User visit tracking 
       
        const lastVisitDate = CookieService.getCookie('last_visit_date');
        if (lastVisitDate !== today) {
            const visitCount = parseInt(CookieService.getCookie('visit_count') || '0') + 1;
            document.cookie = `visit_count=${visitCount}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
            console.log('New visit today. Total visits:', visitCount);

            document.cookie = `last_visit_date=${today}; max-age=${24 * 60 * 60}; path=/; samesite=lax`;

        }

        //  Page view tracking 
        const pageViews = parseInt(CookieService.getCookie('page_views') || '0') + 1;
        document.cookie = `page_views=${pageViews}; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;

        // Referrer tracking
        const referrer = document.referrer || 'direct';
        document.cookie = `last_referrer=${referrer.substring(0, 100)}; max-age=${7 * 24 * 60 * 60}; path=/; samesite=lax`;

        console.log('📄 Page view counted:', pageViews);
        console.log('Analytics cookies enabled');

        // Start analytics tracking
        return CookieService.trackAnalytics();
    },

    // Analytics tracking function
    trackAnalytics: () => {
        const today = new Date().toDateString();
        const lastVisitDate = CookieService.getCookie('last_visit_date');
        if(lastVisitDate!=today){
            timeSpent=0;
        }
        let startTime = Date.now();
        
        const handleBeforeUnload = () => {
            const timeSpent = Date.now() - startTime;
            const currentTime = parseInt(CookieService.getCookie('total_time_spent') || '0');
            const newTotalTime = currentTime + timeSpent;

            document.cookie = `total_time_spent=${newTotalTime}; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;

            console.log('⏱️ Time tracking:');
            console.log('- Current session:', timeSpent, 'ms');
            console.log('- Total time spent:', newTotalTime, 'ms');
            console.log('- Total minutes:', Math.round(newTotalTime / 60000));
        };

        window.addEventListener('beforeunload', handleBeforeUnload);


        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    },



    // UTILITY FUNCTIONS
    getCookie: (name) => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) return decodeURIComponent(cookieValue);
        }
        return null;
    },

    disableNonEssentialCookies: () => {
        const cookiesToDelete = [
            'ga_enabled', 'marketing_enabled', 'performance_enabled',
            'social_enabled', 'visit_count', 'first_visit', 'page_views',
            'last_referrer', 'perf_load_time', 'browser_info', 'perf_optimized',
            'lcp_time', 'cls_score', 'total_time_spent', 'social_shares',
            'social_prefs', 'share_tracking'
        ];

        cookiesToDelete.forEach(cookie => {
            document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
    },

    isAllowed: (cookieType) => {
        const preferences = CookieService.getPreferences();
        if (!preferences) return false;

        switch (cookieType) {
            case 'analytics': return preferences.analytics;

            case 'performance': return preferences.performance;

            case 'necessary': return true;
            default: return false;
        }
    },

    // Get analytics data for dashboard
    getAnalyticsData: () => {
        return {
            visitCount: parseInt(CookieService.getCookie('visit_count') || '0'),
            firstVisit: CookieService.getCookie('first_visit'),
            pageViews: parseInt(CookieService.getCookie('page_views') || '0'),
            totalTimeSpent: parseInt(CookieService.getCookie('total_time_spent') || '0'),
            lastReferrer: CookieService.getCookie('last_referrer'),

            totalTimeSpentMinutes: Math.round(parseInt(CookieService.getCookie('total_time_spent') || '0') / 60000),
            totalTimeSpentSeconds: Math.round(parseInt(CookieService.getCookie('total_time_spent') || '0') / 1000)

        };
    },

    // Get performance data
    getPerformanceData: () => {
        return {
            loadTime: parseFloat(CookieService.getCookie('perf_load_time') || '0'),
            browserInfo: JSON.parse(CookieService.getCookie('browser_info') || '{}'),
            lcpTime: parseFloat(CookieService.getCookie('lcp_time') || '0'),
            clsScore: parseFloat(CookieService.getCookie('cls_score') || '0')
        };
    }
}