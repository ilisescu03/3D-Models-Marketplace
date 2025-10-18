// CookiesBanner.jsx
import { useState, useEffect } from 'react';
import { CookieService } from '/backend/cookies.js';

const bannerStyle = {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
};

const buttonStyle = {
    margin: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer'
};

const preferencesStyle = {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
};

function CookiesBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [preferences, setPreferences] = useState({
        necessary: true,
        functional: false,
        analytics: false,
        performance: false
    });

    useEffect(() => {
        // Verify if the user already gave his consent
        if (!CookieService.hasConsent()) {
            setShowBanner(true);
        }
    }, []);

    const handleAcceptAll = () => {
        CookieService.setConsent(true, {
            necessary: true,
            analytics: true,
            functional: true,
            performance: true
        });
        setShowBanner(false);
    };

    const handleAcceptNecessary = () => {
        CookieService.setConsent(true, {
            necessary: true,
            analytics: false,
            functional: false,
            performance: false
        });
        CookieService.disableNonEssentialCookies();
        setShowBanner(false);
    };

    const handleSavePreferences = () => {

        CookieService.setConsent(true, preferences);

        if (!preferences.functional) {
            CookieService.disableCategoryCookies('functional');
        }
        if (!preferences.analytics) {
            CookieService.disableCategoryCookies('analytics');
        }
        if (!preferences.performance) {
            CookieService.disableCategoryCookies('performance');
        }

        setShowBanner(false);
        setShowPreferences(false);
    };


    const togglePreference = (preference) => {
        setPreferences(prev => ({
            ...prev,
            [preference]: !prev[preference]
        }));
    };

    if (!showBanner) return null;

    return (
        <div style={bannerStyle}>
            <div style={{ maxWidth: '800px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                <h3>Cookie Settings</h3>
                <p>
                    We use cookies to improve your experience, analyze traffic, and personalize content.
                    By accepting, you agree to our use of cookies in accordance with our <a style={{color:'orange'}}href="/cookie-policy">Cookie Policy</a>.

                </p>

                {!showPreferences ? (
                    <div>
                        <button
                            style={{ ...buttonStyle, backgroundColor: '#ff7b00ff', color: 'white' }}
                            onClick={handleAcceptAll}
                        >
                            Accept All
                        </button>
                        <button
                            style={{ ...buttonStyle, backgroundColor: '#6c757d', color: 'white' }}
                            onClick={handleAcceptNecessary}
                        >
                            Necessary Only
                        </button>
                        <button
                            style={{ ...buttonStyle, backgroundColor: 'transparent', border: '1px solid #ff9900ff', color: '#ff9900ff' }}
                            onClick={() => setShowPreferences(true)}
                        >
                            Customize Preferences
                        </button>
                    </div>
                ) : (
                    <div style={preferencesStyle}>
                        <h4>Cookie Preferences</h4>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={preferences.necessary}
                                    disabled
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Necessary Cookies
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6c757d' }}>
                                    (Required for the website to function)
                                </span>
                            </label>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={preferences.functional}
                                    onChange={() => togglePreference('functional')}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Functional Cookies
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6c757d' }}>
                                    (Improving the user's experience)
                                </span>
                            </label>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={preferences.analytics}
                                    onChange={() => togglePreference('analytics')}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Analytics Cookies
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6c757d' }}>
                                    (Help us improve our website)
                                </span>
                            </label>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={preferences.performance}
                                    onChange={() => togglePreference('performance')}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Performance Cookies
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6c757d' }}>
                                    (Used for personalized advertising)
                                </span>
                            </label>
                        </div>

                        <button
                            style={{ ...buttonStyle, backgroundColor: '#ffa600ff', color: 'white' }}
                            onClick={handleSavePreferences}
                        >
                            Save Preferences
                        </button>

                        <button
                            style={{ ...buttonStyle, backgroundColor: 'transparent', border: '1px solid #6c757d', color: '#6c757d' }}
                            onClick={() => setShowPreferences(false)}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CookiesBanner;