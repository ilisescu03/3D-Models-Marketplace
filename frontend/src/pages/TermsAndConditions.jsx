import React, { useState, useEffect } from "react";
import Header from "../UI+UX/Header";

// Reusing the background style for consistency
const backgroundStyle = {
    backgroundImage: `url(/background.jpg)`,
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: "100vh",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0', 
};

// Style for the main policy content area
const policyContainerStyle = {
    padding: '30px 40px',
    fontFamily: 'RaleWay, sans-serif',
    width: '85%',
    maxWidth: '1200px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    color: '#333',
    lineHeight: '1.6',
};

// Styles for text elements
const h1Style = {
    textAlign: 'center',
    fontSize: '2.5rem',
    marginBottom: '20px',
    color: '#1a1a1a'
};

const h2Style = {
    fontSize: '1.8rem',
    marginTop: '30px',
    marginBottom: '15px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    color: '#2a2a2a'
};

const listStyle = {
    listStyleType: 'decimal',
    paddingLeft: '20px',
};

const listItemStyle = {
    marginBottom: '15px',
};

function TermsAndConditions() {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={backgroundStyle}>
            <Header />
            <div style={{...policyContainerStyle, marginTop: windowWidth < 1000 ? '2rem' : '8rem'}}>
                <h1 style={h1Style}>Terms and Conditions</h1>
                <p><strong>Last Updated:</strong> October 17, 2025</p>
                
                <p>
                    Welcome to our platform! These terms and conditions outline the rules and regulations for the use of our website. By accessing this website, we assume you accept these terms and conditions in full. Do not continue to use the website if you do not accept all of the terms and conditions stated on this page.
                </p>

                <h2 style={h2Style}>1. Definitions</h2>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>"Platform"</strong> refers to this website and its services.</li>
                    <li><strong>"User," "You"</strong> refers to any person who accesses or uses the Platform.</li>
                    <li><strong>"Content"</strong> refers to any 3D model, text, image, or other material uploaded, shared, or displayed on the Platform.</li>
                </ul>

                <h2 style={h2Style}>2. User Accounts</h2>
                <ol style={listStyle}>
                    <li style={listItemStyle}>
                        To access certain features, you may be required to create an account. You agree to provide accurate and complete information upon registration and to update it as necessary.
                    </li>
                    <li style={listItemStyle}>
                        You are solely responsible for maintaining the confidentiality of your password and account. Any activity conducted under your account is your responsibility.
                    </li>
                    <li style={listItemStyle}>
                        We reserve the right to suspend or terminate accounts that violate these terms, without prior notice.
                    </li>
                </ol>
                
                <h2 style={h2Style}>3. User-Generated Content</h2>
                <ol style={listStyle}>
                    <li style={listItemStyle}>
                        Users retain all intellectual property rights to the Content they upload to the Platform.
                    </li>
                    <li style={listItemStyle}>
                        By uploading Content, you grant the Platform a non-exclusive, worldwide, royalty-free, transferable license to use, reproduce, distribute, display, and perform the Content in connection with providing the Platform's services and for its promotion.
                    </li>
                     <li style={listItemStyle}>
                        You warrant that you own all necessary rights to the Content you upload and that it does not infringe upon copyrights, trademarks, or other rights of third parties, and is not illegal, obscene, or defamatory.
                    </li>
                    <li style={listItemStyle}>
                        We reserve the right, but have no obligation, to remove any Content that, in our sole discretion, violates these terms.
                    </li>
                </ol>

                <h2 style={h2Style}>4. Acceptable Use</h2>
                <p>
                    You agree not to use the Platform to:
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li>Violate any local, national, or international laws or regulations.</li>
                    <li>Transmit any material that is illegal, abusive, harassing, defamatory, or harmful.</li>
                    <li>Distribute spam, chain letters, or any other form of unsolicited communication.</li>
                    <li>Interfere with the normal operation of the Platform or its servers.</li>
                </ul>

                <h2 style={h2Style}>5. Limitation of Liability</h2>
                <p>
                    The Platform and its services are provided "as is," without any warranty of any kind, express or implied. To the maximum extent permitted by law, we assume no liability for any direct, indirect, incidental, or special damages resulting from the use or inability to use the Platform or its Content. We are not responsible for the actions, content, or data of third parties.
                </p>

                <h2 style={h2Style}>6. Changes to Terms</h2>
                <p>
                    We reserve the right to modify these terms and conditions at any time. The updated version will be posted on this page, and the last updated date will be revised. Your continued use of the Platform after the changes are published constitutes your acceptance of them. For substantial changes, we will make reasonable efforts to notify you.
                </p>

                {/* --- SECTION UPDATED --- */}
                <h2 style={h2Style}>7. Governing Law and Jurisdiction</h2>
                <p>
                    These terms and conditions will be governed by and construed in accordance with the laws of Romania. Any dispute arising from or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Romania.
                </p>
                
                <h2 style={h2Style}>8. Contact</h2>
                <p>
                    If you have any questions about these Terms and Conditions, you can contact us at the email address: <a href="mailto:ilici75@gmail.com">ilici75@gmail.com</a>.
                </p>
            </div>
        </div>
    );
}

export default TermsAndConditions;