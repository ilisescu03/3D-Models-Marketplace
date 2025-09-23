// cookies.js
export const CookieService = {
    // Tracking state pentru a preveni multiple sesiuni
    _trackingState: {
        isTracking: false,
        startTime: null,
        cleanup: null
    },

    // Verify if the user gave his consent
    hasConsent: () => {
        const consentData = localStorage.getItem('cookieConsent');
        return consentData ? JSON.parse(consentData).consented : false;
    },

    // Save the user's consent
    setConsent: (consent, preferences = {}) => {
        const oldPreferences = CookieService.getPreferences();
        const consentData = {
            consented: consent,
            date: new Date().toISOString(),
            preferences: {
                necessary: true,
                functional: preferences.functional === true,
                analytics: preferences.analytics === true,
                performance: preferences.performance === true,
            }

        };

        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        document.cookie = `cookieConsent=${consent}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;

        if (consent) {
            // Activate cookies based on preferences
            CookieService.enableNecessaryCookies();
            if (preferences.functional) CookieService.enableFunctionalCookies();
            if (preferences.analytics) CookieService.enableAnalyticsCookies();
            if (preferences.performance) CookieService.enablePerformanceCookies();

            if (!preferences.functional) CookieService.disableCategoryCookies('functional');
            if (!preferences.analytics) CookieService.disableCategoryCookies('analytics');
            if (!preferences.performance) CookieService.disableCategoryCookies('performance');
        } else {
            CookieService.disableNonEssentialCookies();
        }
    },

    // Get current preferences
    getPreferences: () => {
        const consentData = localStorage.getItem('cookieConsent');
        return consentData ? JSON.parse(consentData).preferences : null;
    },

    //  NECESSARY COOKIES (always active)
    enableNecessaryCookies: () => {
        // Session cookie for authentication
        document.cookie = 'session_id=active; path=/; samesite=strict';

        // CSRF protection token
        const csrfToken = Math.random().toString(36).substring(2);
        document.cookie = `csrf_token=${csrfToken}; path=/; samesite=strict`;


        // Shopping cart functionality
        document.cookie = 'cart_session=active; path=/; samesite=lax';

        console.log('Necessary cookies enabled');
    },
    //FUNCTIONAL COOKIES
    enableFunctionalCookies: () => {
        if (!CookieService.isAllowed('functional')) return;
        const language = navigator.language || 'en';
        document.cookie = `user_language=${language}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;

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
    //Disable cookies by category
    disableCategoryCookies: (category) => {
        let cookiesToDelete = [];
        switch (category) {
            case 'functional':
                cookiesToDelete = ['user_language'];
                break;
            case 'analytics':
                cookiesToDelete = [
                    'visit_count', 'first_visit', 'page_views',
                    'last_referrer', 'total_time_spent', 'last_visit_date', 'last_referrer'
                ];
                break;
            case 'performance':
                cookiesToDelete = [
                    'perf_load_time', 'browser_info', 'perf_optimized',
                    'lcp_time', 'cls_score'
                ];
                break;
            default:
                return;
        }

        cookiesToDelete.forEach(cookie => {
            document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
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
        if (CookieService.isAllowed('functional')) {
            console.log('🔧 Functional cookies active');
            CookieService.enableFunctionalCookies();
        }
        if (CookieService.isAllowed('analytics')) {
            console.log('📊 Analytics cookies active');
            CookieService.enableAnalyticsCookies();
            const analyticsData = CookieService.getAnalyticsData();

            console.log(`👤 Visits: ${analyticsData.visitCount}`);
            console.log(`📄 Page Views: ${analyticsData.pageViews}`);
            console.log(`⏰ Total time spent: ${analyticsData.formattedTimeSpent}`);
            const cleanup = CookieService.trackAnalytics();
            return cleanup;
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
        return null;
    },

    //ANALYTICS COOKIES
    enableAnalyticsCookies: () => {
        const today = new Date().toDateString();
        const lastVisitDate = CookieService.getCookie('last_visit_date');

        if (lastVisitDate !== today) {
            const visitCount = parseInt(CookieService.getCookie('visit_count') || '0') + 1;
            document.cookie = `visit_count=${visitCount}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
            document.cookie = `total_time_spent=0; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;
            document.cookie = `page_views=0; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;
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

    // Analytics tracking function - VERSIUNEA CORECTATĂ FINAL
    trackAnalytics: () => {
        // Previne multiple sesiuni de tracking
        if (CookieService._trackingState.isTracking) {
            console.log('⚠️ Tracking already active, skipping...');
            return CookieService._trackingState.cleanup;
        }






        // Set the tracking state
        CookieService._trackingState.isTracking = true;
        CookieService._trackingState.startTime = Date.now();

        // Time save function
        const saveTime = () => {
            if (!CookieService._trackingState.isTracking) return;

            const currentTime = Date.now();
            const sessionTime = currentTime - CookieService._trackingState.startTime;

            // Time limit for safety (24h) - per session (if the tracking is functioning properly it's no need for that)
            const maxSessionTime = 24 * 60 * 60 * 1000; // 24h in ms
            const validSessionTime = Math.min(sessionTime, maxSessionTime);

            const currentTotalTime = parseInt(CookieService.getCookie('total_time_spent') || '0');
            const newTotalTime = currentTotalTime + validSessionTime;

            //Time limit for safety(24h)- daily
            const maxDailyTime = 24 * 60 * 60 * 1000;
            const finalTime = Math.min(newTotalTime, maxDailyTime);

            document.cookie = `total_time_spent=${finalTime}; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;

            console.log('⏱️ Time tracking:');
            console.log('- Session time:', Math.round(validSessionTime / 1000), 'seconds');
            console.log('- Total time today:', Math.round(finalTime / 60000), 'minutes');

            // Reset start time for next session
            CookieService._trackingState.startTime = currentTime;
        };

        // Handler for leaving the page
        const handleBeforeUnload = () => {
            saveTime();
            CookieService._trackingState.isTracking = false;
        };

        // Handler for changing visibility
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Page is hidden - save time
                saveTime();
            } else {
                // The page is again visible - reset time
                CookieService._trackingState.startTime = Date.now();
            }
        };

        // Event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Save the time for a period of 30 seconds
        const saveInterval = setInterval(() => {
            if (CookieService._trackingState.isTracking && !document.hidden) {
                saveTime();
            }
        }, 30000);

        // Cleanup function
        const cleanup = () => {
            if (saveInterval) clearInterval(saveInterval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            CookieService._trackingState.isTracking = false;
            CookieService._trackingState.startTime = null;
            CookieService._trackingState.cleanup = null;
        };

        CookieService._trackingState.cleanup = cleanup;
        return cleanup;
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
            'lcp_time', 'cls_score', 'total_time_spent', 'social_shares', 'language',
            'social_prefs', 'share_tracking', 'user_language', 'last_visit_date'
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
            case 'functional': return preferences.functional;
            case 'performance': return preferences.performance;
            case 'necessary': return true;
            default: return false;
        }
    },

    // Get analytics data for dashboard
    getAnalyticsData: () => {
        const today = new Date().toDateString();
        const lastVisitDate = CookieService.getCookie('last_visit_date');

        // Verify and reset for the next day
        if (lastVisitDate && lastVisitDate !== today) {
            document.cookie = `total_time_spent=0; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;
            document.cookie = `last_visit_date=${today}; max-age=${24 * 60 * 60}; path=/; samesite=lax`;

        }

        const totalTimeMs = parseInt(CookieService.getCookie('total_time_spent') || '0');

        // Safety limit - 24h per day
        const maxDailyTime = 24 * 60 * 60 * 1000;
        const validTotalTime = Math.min(totalTimeMs, maxDailyTime);

        return {
            visitCount: parseInt(CookieService.getCookie('visit_count') || '0'),
            firstVisit: CookieService.getCookie('first_visit'),
            pageViews: parseInt(CookieService.getCookie('page_views') || '0'),
            totalTimeSpent: validTotalTime,
            lastReferrer: CookieService.getCookie('last_referrer'),
            totalTimeSpentMinutes: Math.round(validTotalTime / 60000),
            totalTimeSpentSeconds: Math.round(validTotalTime / 1000),
            formattedTimeSpent: CookieService.formatTime(validTotalTime)
        };
    },

    formatTime: (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    },

    // Manual function for time reset(for debugging)
    resetDailyTime: () => {
        document.cookie = `total_time_spent=0; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;
        const today = new Date().toDateString();
        document.cookie = `last_visit_date=${today}; max-age=${24 * 60 * 60}; path=/; samesite=lax`;
        console.log('🔄 Timer resetat manual');
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