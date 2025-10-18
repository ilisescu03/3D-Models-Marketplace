
import React, { useState, useEffect } from 'react';
import { CookieService } from '/backend/cookies.js';

// --- STYLES ---

// Main footer container style
const footerStyle = {
    backgroundColor: '#1a1a1a',
    fontFamily:'Arial, sans-serif',
    color: '#ccc',
    padding: '40px 20px',
    borderRadius:0,
    bottom: 0,
    left: 0,
    width: '100%',
    boxSizing: 'border-box',
};

// Inner container to center content and manage columns
const footerContainerStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
};

// Style for each column
const columnStyle = {
    flex: 1,
    minWidth: '250px',
    padding: '0 15px',
};

// Style for column titles
const titleStyle = {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#fff',
};

// Style for the list of links
const listStyle = {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
};

// Style for each link item
const linkStyle = {
    color: '#ccc',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '10px',
    transition: 'color 0.3s ease',
};

// Style for the Manage Cookies button
const buttonStyle = {
    backgroundColor: 'transparent',
    color: '#ccc',
    border: '1px solid #ccc',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s, color 0.3s',
};

// Cookie status styles
const cookieStatusStyle = {
    fontSize: '0.8rem',
    marginTop: '5px',
    padding: '3px 8px',
    borderRadius: '3px',
    display: 'inline-block',
};

const statusGreen = {
    ...cookieStatusStyle,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#4caf50',
};

const statusRed = {
    ...cookieStatusStyle,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    color: '#f44336',
};

function Footer({ onManageCookiesClick }) {
    const [cookieConsent, setCookieConsent] = useState(null);

    // Load cookie consent on component mount
    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
            setCookieConsent(JSON.parse(consent));
        }
    }, []);

    // Hover effect for links
    const handleMouseEnter = (e) => {
        e.target.style.color = '#fff';
    };
    const handleMouseLeave = (e) => {
        e.target.style.color = '#ccc';
    };
    
    // Hover effect for button
    const handleButtonEnter = (e) => {
        e.target.style.backgroundColor = '#ccc';
        e.target.style.color = '#1a1a1a';
    };
    const handleButtonLeave = (e) => {
        e.target.style.backgroundColor = 'transparent';
        e.target.style.color = '#ccc';
    };

    // Handle manage cookies click
    const handleManageCookies = () => {
        localStorage.removeItem('cookieConsent');
        window.location.reload();
    };

    // Handle category click - EXACT CA IN HEADER
    const handleCategoryClick = (categoryName) => {
        localStorage.setItem('autoFilterCategory', categoryName);
        window.location.href = '/3d-models';
    };

    return (
        <footer style={footerStyle}>
            <div style={footerContainerStyle}>
                
                {/* --- EXPLORE COLUMN --- */}
                <div style={columnStyle}>
                    <h4 style={titleStyle}>Explore</h4>
                    <ul style={listStyle}>
                        {/* VEHICLES - navigheaza pe 3d-models cu filtrul Vehicle */}
                        <li>
                            <a 
                                href="/3d-models" 
                                style={linkStyle} 
                                onMouseEnter={handleMouseEnter} 
                                onMouseLeave={handleMouseLeave}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleCategoryClick('Vehicle');
                                }}
                            >
                                Vehicles
                            </a>
                        </li>
                        
                        {/* CHARACTERS - navigheaza pe 3d-models cu filtrul Character */}
                        <li>
                            <a 
                                href="/3d-models" 
                                style={linkStyle} 
                                onMouseEnter={handleMouseEnter} 
                                onMouseLeave={handleMouseLeave}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleCategoryClick('Character');
                                }}
                            >
                                Characters
                            </a>
                        </li>
                        
                        {/* ARCHITECTURE - navigheaza pe 3d-models cu filtrul Architecture */}
                        <li>
                            <a 
                                href="/3d-models" 
                                style={linkStyle} 
                                onMouseEnter={handleMouseEnter} 
                                onMouseLeave={handleMouseLeave}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleCategoryClick('Architecture');
                                }}
                            >
                                Architecture
                            </a>
                        </li>
                        
                        {/* MORE - navigheaza direct pe 3d-models fara filtru */}
                        <li>
                            <a 
                                href="/3d-models" 
                                style={linkStyle} 
                                onMouseEnter={handleMouseEnter} 
                                onMouseLeave={handleMouseLeave}
                            >
                                More...
                            </a>
                        </li>
                    </ul>
                </div>

                {/* --- POLICY COLUMN --- */}
                <div style={columnStyle}>
                    <h4 style={titleStyle}>Policy</h4>
                    <ul style={listStyle}>
                        <li>
                            <a href="/cookie-policy" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                Cookie Policy
                            </a>
                        </li>
                        <li>
                            <a href="/terms-and-conditions" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                Terms & Conditions
                            </a>
                        </li>
                        <li>
                            {CookieService.isAllowed('functional')
                            ||  CookieService.isAllowed('performance')
                            ||  CookieService.isAllowed('performance') ? (
                            <div style={{ marginBottom: '15px' }}>
                                <strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Cookie Status:</strong>
                                <span style={CookieService.isAllowed('functional') ? statusGreen : statusRed}>
                                    Functional: {CookieService.isAllowed('functional') ? 'Active' : 'Inactive'}
                                </span>
                                <span style={CookieService.isAllowed('performance') ? statusGreen : statusRed}>
                                    Performance: {CookieService.isAllowed('performance') ? 'Active' : 'Inactive'}
                                </span>
                                <span style={CookieService.isAllowed('analytics') ? statusGreen : statusRed}>
                                    Analytics: {CookieService.isAllowed('analytics') ? 'Active' : 'Inactive'}
                                </span>
                            </div>):null}
                            
                            {CookieService.isAllowed('analytics') && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
                                    <h5 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '0.9rem' }}>📈 Your Analytics Data</h5>
                                    <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                        <p style={{ margin: '2px 0' }}>Visits: {CookieService.getAnalyticsData().visitCount}</p>
                                        <p style={{ margin: '2px 0' }}>Page views today: {CookieService.getAnalyticsData().pageViews}</p>
                                    </div>
                                </div>
                            )}
                            
                            <button 
                                style={buttonStyle}
                                onClick={handleManageCookies}
                                onMouseEnter={handleButtonEnter}
                                onMouseLeave={handleButtonLeave}
                            >
                                Manage Cookies
                            </button>
                        </li>
                    </ul>
                </div>

                {/* --- CONTACT COLUMN --- */}
                <div style={columnStyle}>
                    <h4 style={titleStyle}>Contact</h4>
                  
                        <a 
                                style={linkStyle}
                                href="/contact"
                                 onMouseEnter={handleMouseEnter} 
                                onMouseLeave={handleMouseLeave}
                            >
                                About me
                            </a>
              
                </div>

            </div>
        </footer>
    );
}

export default Footer;
