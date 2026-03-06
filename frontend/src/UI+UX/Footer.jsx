import React from 'react';

// --- STYLES ---

// Main footer container style
const footerStyle = {
    backgroundColor: '#1a1a1a',
    fontFamily: 'Arial, sans-serif',
    color: '#cccccc',
    padding: '60px 20px 20px 20px', 
  
    width: '100%',
    boxSizing: 'border-box',
};

// Main content wrapper for the three-column matrix
const footerContainerStyle = {
    display: 'flex',
    justifyContent: 'center', 
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '40px', 
    maxWidth: '1200px',
    margin: '0 auto',
};

// Unified style for all three columns
const columnStyle = {
    flex: 1, 
    minWidth: '250px',
    textAlign: 'center', 
    padding: '0 15px',
};

// Style for the brand logo
const logoStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '10px',
};

// Style for the brand slogan
const sloganStyle = {
    fontSize: '1rem',
    color: '#a0a0a0',
};

// Style for column titles
const titleStyle = {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#ff7300ff',
};

// Style for the list of links
const listStyle = {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
};

// Style for each link item
const linkStyle = {
    color: '#cccccc',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '12px',
    transition: 'color 0.3s ease',
};

// Style for the Manage Cookies button
const buttonStyle = {
    backgroundColor: 'transparent',
    color: '#ff7300ff',
    border: '1px solid #ff7300ff',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s, color 0.3s',
};

// Bottom Section (Copyright)
const footerBottomStyle = {
    textAlign: 'center',
    marginTop: '50px',
    paddingTop: '20px',
    borderTop: '1px solid #333333',
    fontSize: '0.9rem',
    color: '#a0a0a0',
};


function Footer({ onManageCookiesClick }) {

    // Hover effect for links
    const handleMouseEnter = (e) => {
        e.target.style.color = '#ff7300ff';
    };
    const handleMouseLeave = (e) => {
        e.target.style.color = '#cccccc';
    };
    
    // Hover effect for button
    const handleButtonEnter = (e) => {
        e.target.style.backgroundColor = '#ff7300ff';
        e.target.style.color = 'white';
    };
    const handleButtonLeave = (e) => {
        e.target.style.backgroundColor = 'transparent';
        e.target.style.color = '#ff7300ff';
    };

    // Handle manage cookies click
    const handleManageCookies = () => {
        localStorage.removeItem('cookieConsent');
        window.location.reload();
    };

    // Handle category click
    const handleCategoryClick = (categoryName) => {
        localStorage.setItem('autoFilterCategory', categoryName);
        window.location.href = '/3d-models';
    };

    return (
        <footer style={footerStyle}>
            <div style={footerContainerStyle}>
                
                {/* --- COLUMN 1: BRAND --- */}
                <div style={columnStyle}>
                    <img src="/WebsiteLogo2.png" style={{height:'100px'}}/>
                    <h3 style={logoStyle}>ShapeHive</h3>
                    <p style={sloganStyle}>Your 3D Asset Universe. High-quality models for your creative projects.</p>
                </div>

                {/* --- COLUMN 2: EXPLORE --- */}
                <div style={columnStyle}>
                    <h4 style={titleStyle}>Explore</h4>
                    <ul style={listStyle}>
                        <li><a href="/3d-models" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={(e) => { e.preventDefault(); handleCategoryClick('Cars & Vehicles'); }}>Cars & Vehicles</a></li>
                        <li><a href="/3d-models" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={(e) => { e.preventDefault(); handleCategoryClick('Characters & Creatures'); }}>Characters & Creatures</a></li>
                        <li><a href="/3d-models" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={(e) => { e.preventDefault(); handleCategoryClick('Architecture'); }}>Architecture</a></li>
                        <li><a href="/3d-models" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>More...</a></li>
                    </ul>
                </div>

                {/* --- COLUMN 3: Contact and policy --- */}
                <div style={columnStyle}>
                    <h4 style={titleStyle}>Contact & Policy</h4>
                    <ul style={listStyle}>
                        <li><a href="/contact" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>About Me</a></li>
                        <li><a href="/terms&conditions" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Terms & Conditions</a></li>
                        <li><a href="/cookie-policy" style={linkStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Cookie Policy</a></li>
                        <li>
                            <button style={buttonStyle} onClick={handleManageCookies} onMouseEnter={handleButtonEnter} onMouseLeave={handleButtonLeave}>
                                Manage Cookies
                            </button>
                        </li>
                    </ul>
                </div>

            </div>
             {/* --- COPYRIGHT SECTION (BOTTOM) --- */}
            <div style={footerBottomStyle}>
                &copy; {new Date().getFullYear()} ShapeHive. All rights reserved.
            </div>
        </footer>
    );
}

export default React.memo(Footer);