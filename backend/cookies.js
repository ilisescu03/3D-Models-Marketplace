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
            preferences: preferences
        };

        localStorage.setItem('cookieConsent', JSON.stringify(consentData));

        // Set a cookie for server too
        document.cookie = `cookieConsent=${consent}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;

        if (consent) {
            // Activate the cookies by preferences
            if (preferences.necessary) CookieService.enableNecessaryCookies();
            if (preferences.analytics) CookieService.enableAnalyticsCookies();
            if (preferences.marketing) CookieService.enableMarketingCookies();
        } else {
            // Deactivate the non-essential cookies
            CookieService.disableNonEssentialCookies();
        }
    },
    
    // Get the current preferences
    getPreferences: () => {
        const consentData = localStorage.getItem('cookieConsent');
        return consentData ? JSON.parse(consentData).preferences : null;
    },
    
    // Essential cookies (always activated)
    enableNecessaryCookies: () => {
        // Cookie for authentication session
        document.cookie = 'essential=true; path=/; samesite=strict';

        // Cookie for language preferences
        const language = navigator.language || 'en';
        document.cookie = `language=${language}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
    },
    
    // Cookie for analytics
    enableAnalyticsCookies: () => {
        document.cookie = `ga_enabled=true; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
    },
    
    // Cookie for marketing
    enableMarketingCookies: () => {
        document.cookie = `marketing_enabled=true; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
        console.log('Marketing cookies enabled');
    },
    
    // Deactivate non-essential cookies
    disableNonEssentialCookies: () => {
        // Delete analytics and marketing cookies
        document.cookie = 'ga_enabled=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = 'marketing_enabled=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        console.log('Non-essential cookies disabled');
    },
    
    // Verify if a cookie type is allowed
    isAllowed: (cookieType) => {
        const preferences = CookieService.getPreferences();
        if (!preferences) return false;

        switch (cookieType) {
            case 'analytics': return preferences.analytics;
            case 'marketing': return preferences.marketing;
            case 'necessary': return true; // Always allowed
            default: return false;
        }
    }
}