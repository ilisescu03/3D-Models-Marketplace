import { useState, useEffect } from "react";
import Header from "../UI+UX/Header";

// Reusing the background style from LogIn.jsx for consistency
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
    padding: '20px 0', // Add padding for spacing
};

// New style for the main policy content area
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

const h3Style = {
    fontSize: '1.3rem',
    marginTop: '20px',
    marginBottom: '10px',
    color: '#444'
};

const listStyle = {
    listStyleType: 'disc',
    paddingLeft: '20px',
};

const listItemStyle = {
    marginBottom: '10px',
};

function CookiePolicy() {
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
                <h1 style={h1Style}>Cookie Policy</h1>
                <p><strong>Last Updated:</strong> October 17, 2025</p>
                
                <p>
                    Welcome to our platform. This Cookie Policy explains what cookies are, how we use them, the types of cookies we use, and how you can manage your cookie preferences. This policy should be read alongside our Privacy Policy.
                </p>

                <h2 style={h2Style}>What Are Cookies?</h2>
                <p>
                    Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the site owners. Cookies help us recognize your device and remember information about your visit, like your preferences, settings, and how you use our website.
                </p>

                <h2 style={h2Style}>How We Use Cookies</h2>
                <p>
                    We use cookies to enhance your browsing experience, provide personalized features, analyze our site traffic, and for security purposes. We categorize our cookies into the following groups:
                </p>

                <h3 style={h3Style}>1. Necessary Cookies</h3>
                <p>
                    These cookies are essential for the website to function properly. They are usually set in response to actions made by you, such as setting your privacy preferences, logging in, or filling in forms. You cannot opt out of these cookies.
                </p>
                <ul style={listStyle}>
                    <li style={listItemStyle}>
                        <strong>session_id:</strong> Manages your active login session to keep you authenticated.
                    </li>
                    <li style={listItemStyle}>
                        <strong>csrf_token:</strong> Provides a unique token to protect against Cross-Site Request Forgery (CSRF) attacks, ensuring your actions are secure.
                    </li>
                    <li style={listItemStyle}>
                        <strong>cart_session:</strong> Keeps track of items in your shopping cart if you are purchasing models.
                    </li>
                </ul>
                
                <h3 style={h3Style}>2. Functional Cookies</h3>
                <p>
                    These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies, some services may not function properly.
                </p>
                <ul style={listStyle}>
                    <li style={listItemStyle}>
                        <strong>user_language:</strong> Remembers your preferred language to display the website content accordingly on your next visit.
                    </li>
                </ul>

                <h3 style={h3Style}>3. Performance Cookies</h3>
                <p>
                    These cookies help us improve the performance of our website by collecting information about how you use it. For example, they track how quickly pages load and identify any technical issues.
                </p>
                <ul style={listStyle}>
                    <li style={listItemStyle}>
                        <strong>perf_load_time:</strong> Measures the time it takes for a page to load, helping us identify and fix performance bottlenecks.
                    </li>
                    <li style={listItemStyle}>
                        <strong>browser_info:</strong> Stores anonymous information about your browser capabilities and screen size to optimize resource delivery.
                    </li>
                    <li style={listItemStyle}>
                        <strong>lcp_time (Largest Contentful Paint):</strong> Tracks the time it takes for the main content of a page to become visible.
                    </li>
                    <li style={listItemStyle}>
                        <strong>cls_score (Cumulative Layout Shift):</strong> Measures the visual stability of our pages to ensure a smooth user experience.
                    </li>
                </ul>

                <h3 style={h3Style}>4. Analytics Cookies</h3>
                <p>
                    These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us understand which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.
                </p>
                <ul style={listStyle}>
                    <li style={listItemStyle}>
                        <strong>visit_count:</strong> Counts the total number of visits you have made to our site.
                    </li>
                    <li style={listItemStyle}>
                        <strong>page_views:</strong> Tracks the number of pages you have viewed during your visit.
                    </li>
                     <li style={listItemStyle}>
                        <strong>last_referrer:</strong> Records the previous website you came from, helping us understand our traffic sources.
                    </li>
                     <li style={listItemStyle}>
                        <strong>total_time_spent:</strong> Measures the total amount of time you spend on the website during a day to gauge user engagement.
                    </li>
                     <li style={listItemStyle}>
                        <strong>last_visit_date:</strong> Stores the date of your last visit to help distinguish between new and returning users.
                    </li>
                </ul>

                <h2 style={h2Style}>Managing Your Cookie Preferences</h2>
                <p>
                    You have the right to decide whether to accept or reject non-essential cookies. You can exercise your cookie preferences by using our cookie consent banner. From the banner, you can accept all cookies or customize your preferences for each category of non-essential cookies.
                </p>
                <p>
                    Please note that if you choose to disable necessary cookies through your browser settings, some parts of our website may not function correctly.
                </p>

                <h2 style={h2Style}>Changes to This Cookie Policy</h2>
                <p>
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to review this policy periodically to stay informed about our use of cookies.
                </p>

                <h2 style={h2Style}>Contact Us</h2>
                <p>
                    If you have any questions about our use of cookies or this Cookie Policy, please contact us at: <a href="mailto:ilici75@gmail.com">ilici75@gmail.com</a>.
                </p>
            </div>
        </div>
    );
}

export default CookiePolicy;