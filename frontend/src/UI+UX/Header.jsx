import { useState, useEffect } from 'react';
import { doSignOut } from '/backend/auth.js';
import { auth, db } from '/backend/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import SideMenu from './SideMenu.jsx';
import {
    getUserStats, getFollowers, getFollowing, listenToUserStats, doFollowUser, doUnfollowUser, doUpdateProfilePicture,
    updateUsername, updateUserData
} from '/backend/users.js';
//Style for Sign Up
const buttonStyle = {
    backgroundColor: 'rgba(255, 123, 0, 1)',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    transition: '0.3s ease',
    cursor: 'pointer'
}
//Style for Log In
const buttonStyle1 = {
    backgroundColor: 'rgba(151, 151, 151, 1)',
    color: 'white',
    border: 'none',
    marginRight: '20px',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    transition: '0.3s ease',
    cursor: 'pointer'
}
const buttonStyle2 = {
    backgroundColor: 'rgba(255, 145, 0, 1)',
    color: 'white',
    border: 'none',

    marginRight: '0px',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    marginBottom: '0rem',
    transition: '0.3s ease',
    cursor: 'pointer'
}
const imageButtonStyle = {
    position: 'relative',
    
    marginRight: '2rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
}
const imageButtonStyle1 = {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '0px 0px',
    cursor: 'pointer',
}
function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);//for side menu
    const [user, setUser] = useState(null);//for verifying if the user is logged in or not
    const [loading, setLoading] = useState(true);
    const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
    const [profilePicture, setProfilePicture] = useState("/profile.png"); // Default profile picture
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const navigate = useNavigate();

    // Track window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    //verify if the user is logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                await currentUser.reload();
                if (!currentUser.emailVerified) {
                    await doSignOut();
                    setUser(null);
                    setLoading(false);
                    return;
                }

                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        username: userData.username
                    });

                    // Set profile picture if available
                    if (userData.profilePicture) {
                        setProfilePicture(userData.profilePicture);
                    }
                } else {
                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        username: currentUser.displayName || currentUser.email
                    });
                }
            } else {
                setUser(null);
                setProfilePicture("/profile.png"); // Reset to default
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    //For mobile
    if (windowWidth < 1000) {
        return (<>
            <header style={{ position: 'fixed', top: '0px', left: '0px', width: '100%', zIndex: 1000 }}>
                <nav
                    className="nav-header"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 10px',
                        gap: '20px',
                        fontFamily: 'Arial, sans-serif',
                        flexWrap: 'nowrap',
                        minHeight: '60px'
                    }}
                >
                    {/* Menu button */}
                    <button onClick={() => setMenuOpen(true)} style={imageButtonStyle}>
                        <img src='/menu.png' alt='Menu' style={{ height: '35px', marginBottom: '40px' }} />
                    </button>
                    {/* Logo button */}
                    <button style={imageButtonStyle1}
                        onClick={() => window.location.href = '/'}
                    >
                        <img src="/WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '100px' }} />
                    </button>
                    {/* Search button */}
                    <button 
                    onClick={() => navigate('/search')}
                    style={imageButtonStyle}>
                        
                        <img src='/SearchBtn.png' alt='Search' style={{ height: '40px', marginBottom: '40px' }} />
                    </button>

                </nav>
            </header>
            {/* Side menu component */}
            <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}></SideMenu>
        </>)
    }

    else return (
        //For desktop
        <>
            <header style={{ position: 'fixed', top: '0px', left: '0px', width: '100%', zIndex: 1000 }}>
                <nav
                    className="nav-header"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 50px',
                        gap: '20px',
                        fontFamily: 'Arial, sans-serif',
                        flexWrap: 'nowrap',
                        minHeight: '60px'
                    }}
                >
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        flex: windowWidth < 1200 ? '0 1 auto' : 1,
                        minWidth: windowWidth < 1200 ? 'auto' : '0'
                    }}>
                        {/* Logo button */}
                        <button style={imageButtonStyle1}
                            onClick={() => window.location.href = '/'}
                        >
                            <img src="/WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '100px' }} />
                        </button>
                        {/* Explore menu button */}
                        <button style={{
                            position: 'relative',
                            bottom: '0rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '15px 6px',
                            left: '4rem',
                            color: exploreMenuOpen ? 'rgba(255, 123, 0, 1)' : 'rgba(82, 82, 82, 1)',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            display: windowWidth < 1200 ? 'none' : 'block'
                        }}
                            onMouseEnter={(e) => {
                                setExploreMenuOpen(true);
                            }}
                            onMouseLeave={(e) => {
                                setExploreMenuOpen(false);
                            }}
                        >Explore  ▼</button>
                        {/* Explore dropdown menu */}
                        {exploreMenuOpen && (
                            <div
                                onMouseEnter={(e) => {
                                    setExploreMenuOpen(true);
                                }}
                                onMouseLeave={(e) => {
                                    setExploreMenuOpen(false);
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '70px',
                                    left: '10rem',
                                    backgroundColor: 'rgba(255, 255, 255, 1)',
                                    boxShadow: ' 2px 4px 4px rgba(0, 0, 0, 0.23)',
                                    borderRadius: '3px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '0px',
                                    minWidth: '150px',
                                    zIndex: 2000
                                }}
                            >
                                <button
                                    onClick={() => window.location.href = '/community-members'}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'black',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        width: '100%',
                                        textAlign: 'center',
                                        borderRadius: '5px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = 'rgba(255, 123, 0, 1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'black';
                                    }}
                                >
                                    Community members
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Search input - Se adaptează la dimensiunea ecranului */}
                    <div
                    onClick={() => navigate('/search')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: windowWidth < 1200 ? '400px' : '700px',
                        minWidth: windowWidth < 1200 ? '250px' : '300px',
                        margin: windowWidth < 1200 ? '0 20px' : '0',
                        position: 'relative',
                        bottom: '0rem',
                        flex: windowWidth < 1200 ? '0 1 auto' : 1,
                        justifyContent: 'center'
                    }}>
                        <button style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            position: 'absolute',
                            left: '0',
                            zIndex: 1
                        }}>
                            <img src="/SearchBtn.png" alt="Search" style={{ height: '20px' }} />
                        </button>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 40px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* User authentication section */}
                    {!loading && (
                        user ? (
                            // User is logged in - show profile picture, dropdown and upload button
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                flex: windowWidth < 1200 ? '0 1 auto' : 'none'
                            }}>

                                <div
                                    style={{ position: 'relative', display: 'inline-block' }}
                                    onMouseEnter={() => setMenuOpen(true)}
                                    onMouseLeave={() => setMenuOpen(false)}
                                >
                                    <button
                                        onClick={() => (window.location.href = '/dashboard')}
                                        style={imageButtonStyle}
                                    >
                                        <img
                                            src={profilePicture}
                                            alt={user.username}
                                            style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }}
                                            onError={(e) => {
                                                e.target.src = "/profile.png";
                                                setProfilePicture("/profile.png");
                                            }}
                                        />
                                    </button>
                                    {/* User dropdown menu */}
                                    {menuOpen && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '50px',
                                                right: 0,
                                                backgroundColor: 'rgba(255, 255, 255, 1)',
                                                borderRadius: '3px',
                                                boxShadow: ' 2px 4px 4px rgba(0, 0, 0, 0.23)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: '0px',
                                                minWidth: '150px',
                                                zIndex: 2000
                                            }}
                                        >
                                            <button
                                                onClick={() => window.location.href = '/settings'}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'black',
                                                    cursor: 'pointer',
                                                    padding: '8px 12px',
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    borderRadius: '5px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255, 123, 0, 1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'black';
                                                }}
                                            >
                                                Settings
                                            </button>
                                            <button
                                                onClick={doSignOut}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'black',
                                                    cursor: 'pointer',
                                                    padding: '8px 12px',
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    borderRadius: '5px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255, 123, 0, 1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'black';
                                                }}
                                            >
                                                Log Out
                                            </button>
                                        </div>
                                    )}

                                </div>
                                <button
                                    onClick={() => window.location.href = '/upload'}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(218, 129, 14, 1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 145, 0, 1)'; }}
                                    style={buttonStyle2}
                                >
                                    <img src="/UploadButton.png"
                                        style={{
                                            width: '15px',
                                            right: '5px',
                                            position: 'relative',
                                            top: '2px',
                                            filter: 'invert(1)',
                                            padding: '0',
                                        }} />
                                    Upload
                                </button>
                            </div>

                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                flex: windowWidth < 1200 ? '0 1 auto' : 'none'
                            }}>
                                {/* If the user is not logged in the login and sign up buttons are displayed*/}
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(117, 117, 117, 1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 1)'; }}
                                    style={buttonStyle1}
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => window.location.href = '/signup'}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(224, 108, 0, 1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 123, 0, 1)'; }}
                                    style={buttonStyle}
                                >
                                    Sign Up
                                </button>
                            </div>
                        )
                    )}
                </nav>
            </header>
        </>
    )
}

export default Header;