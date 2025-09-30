import React, { useEffect, useRef, useState } from 'react';
import { doSignOut } from '/backend/auth.js';
import { auth, db } from '/backend/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Style for Log Out button
const logoutButtonStyle = { 
    backgroundColor: 'red', 
    color: 'white', 
    padding: '7.5px 15px', 
    borderRadius: '5px', 
    marginTop: '20px', 
    cursor: 'pointer', 
    border: 'none', 
    fontWeight: 'bold', 
    width: '100%' 
};
// Style for Sign In
const buttonStyle = {
    backgroundColor: 'rgba(255, 123, 0, 1)',
    color: 'white',
    border: 'none',
    marginTop: '20px',
    width: '100%',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    transition: '0.3s ease',
    cursor: 'pointer'
}

// Style for Log In
const buttonStyle1 = {
    backgroundColor: 'rgba(151, 151, 151, 1)',
    color: 'white',
    border: 'none',
    marginTop: '50px',
    width: '100%',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    transition: '0.3s ease',
    cursor: 'pointer'
}
// Style for menu items
const buttonStyle3 = {
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    marginTop: '5px',
    width: '100%',
    padding: '7.5px 15px',
    textAlign: 'center',
    display: 'block',
    margin: '0 auto',
    position: 'relative',
    cursor: 'pointer',
};
// Style for expandable menu buttons
const expandableButtonStyle = {
    marginTop: '10px',
    width: '100%',
    padding: '6px 2px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    position: 'relative'
}
// Style for submenu container
const submenuContainerStyle = {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: '5px',
    marginTop: '5px'
}
// Style for dropdown arrows
const arrowStyle = {
    color: 'white',
    fontSize: '12px',
    transition: 'transform 0.3s ease',
    marginLeft: '5px'
}

function SideMenu({ isOpen, onClose, children, activeIndex }) {
    const menuRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [isMenuExpanded, setIsMenuExpanded] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [profilePicture, setProfilePicture] = useState("/profile.png"); // Default profile picture
    const [expandedSubmenus, setExpandedSubmenus] = useState({});
    // Toggle submenu expansion
    const toggleSubmenu = (submenuKey) => {
        setExpandedSubmenus(prev => ({
            ...prev,
            [submenuKey]: !prev[submenuKey]
        }));
    };
    // Listen for authentication state changes
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

                console.log('Google photoURL:', currentUser.photoURL);

                // Set initial profile picture (priority for Google photo)
                if (currentUser.photoURL) {
                    setProfilePicture(currentUser.photoURL);
                    console.log('Set profile picture from Google');
                }

                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log('Firestore profilePicture:', userData.profilePicture);

                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        username: userData.username
                    });

                    // Set Firestore profile picture ONLY if we don't already have Google photo
                    if (userData.profilePicture && !currentUser.photoURL) {
                        setProfilePicture(userData.profilePicture);
                        console.log('Set profile picture from Firestore');
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
    // Handle logout functionality
    const handleLogout = async () => {
        try {
            await doSignOut();
            setUser(null);
            setUsername("");
            setProfilePicture("/profile.png"); // Reset profile picture
            onClose();
        } catch (err) {
            console.error("Log out error:", err);
        }
    };
    // Handle click outside menu to close it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);
    // Reset menu state when closed
    useEffect(() => {
        if (!isOpen) {
            setIsMenuExpanded(false);
            setExpandedSubmenus({});
        }
    }, [isOpen]);

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1001,
                    }}
                />
            )}

            {/* Side Menu */}
            <div
                ref={menuRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: isOpen ? 0 : '-250px',
                    width: '150px',
                    height: '100%',
                    backgroundColor: '#222',
                    color: 'white',
                    padding: '20px',
                    boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
                    transition: 'left 0.3s ease',
                    zIndex: 1002,
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                }}
            >
                <div>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '20px',
                            cursor: 'pointer',
                        }}
                        aria-label="Close menu"
                        title="Close"
                    >
                        ✕
                    </button>
                     {/* User authentication section */}
                    {!loading && (user ? (
                         // User is logged in
                        <>
                            <button
                                    onClick={() => window.location.href = '/upload'}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(207, 121, 8, 1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 145, 0, 1)'; }}
                                    style={{...buttonStyle, marginTop:'50px'}}
                                >
                                    <img src="/UploadButton.png"
                                    style={{
                                        width:'15px',
                                        right:'5px',
                                        position:'relative',
                                        top:'2px',
                                        filter: 'invert(1)',
                                        padding:'0',
                                    }}/>
                                    Upload
                                </button>
                            <button
                                onClick={() => toggleSubmenu('profile')}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.24)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 0)'}
                                style={{
                                    ...expandableButtonStyle,
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    
                                }}
                            >
                                <span
                                    style={{
                                        margin: 0,
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        color: 'white',
                                        fontFamily: 'Arial, sans-serif',
                                        fontSize: '0.9rem',
                                       
                                    }}
                                />
                                <div style={{ display: 'flex',  marginTop:'20px', flexDirection: 'column', alignItems: 'center' }}>
                                    <img
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            marginBottom: '6px',
                                            objectFit: 'cover'
                                        }}
                                        src={profilePicture}
                                        alt="Profile"
                                        onError={(e) => {
                                            e.target.src = "/profile.png";
                                            setProfilePicture("/profile.png");
                                        }}
                                        referrerPolicy="no-referrer"
                                    />
                                    <p
                                        style={{
                                            margin: 0,
                                            fontWeight: 'bold',
                                            color: 'white',
                                            fontFamily: 'Arial, sans-serif',
                                            fontSize: '0.8rem',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {user.username}
                                    </p>
                                </div>

                                <span
                                    style={{
                                        ...arrowStyle,
                                        transform: expandedSubmenus['profile'] ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                >
                                    ▼
                                </span>
                            </button>
                             {/* Profile submenu */}
                            <div
                                style={{
                                    ...submenuContainerStyle,
                                    maxHeight: expandedSubmenus['profile'] ? '200px' : '0px',
                                    opacity: expandedSubmenus['profile'] ? 1 : 0,
                                }}
                            >
                                <hr></hr>
                                <div style={{ padding: '10px' }}>
                                    <button
                                        onClick={() => window.location.href = '/dashboard'}
                                        style={buttonStyle3}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.24)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 0)'}
                                    >
                                        Profile
                                    </button>
                                </div>
                                <div style={{ padding: '10px' }}>
                                    <button
                                        onClick={() => window.location.href = '/settings'}
                                        style={buttonStyle3}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.24)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 0)'}
                                    >
                                        Settings
                                    </button>
                                </div>
                                <div style={{ padding: '10px' }}>
                                    <button onClick={handleLogout} style={buttonStyle3}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.24)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 0)'}
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                          // User is not logged in
                        <>
                            <button
                                onClick={() => window.location.href = '/login'}
                                style={buttonStyle1}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(92, 92, 92, 1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 1)'}
                            >Log In</button>

                            <button
                                onClick={() => window.location.href = '/signup'}
                                style={buttonStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(204, 100, 3, 1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 123, 0, 1)'}
                            >Sign Up</button>
                        </>
                    ))}
                    <hr></hr>
                    {/* Explore menu section */}
                    <button
                        onClick={() => toggleSubmenu('explore')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.24)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 0)'}
                        style={{
                            ...expandableButtonStyle,
                            marginTop: '1rem',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span
                                style={{
                                    margin: 0,
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    color: 'white',
                                    fontFamily: 'Arial, sans-serif',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span
                                style={{
                                    margin: 0,
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    color: 'white',
                                    fontFamily: 'Arial, sans-serif',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Explore
                            </span>
                        </div>

                        <span
                            style={{
                                ...arrowStyle,
                                transform: expandedSubmenus['explore'] ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                        >
                            ▼
                        </span>
                    </button>
                    {/* Explore submenu */}
                    <div
                        style={{
                            ...submenuContainerStyle,
                            maxHeight: expandedSubmenus['explore'] ? '200px' : '0px',
                            opacity: expandedSubmenus['explore'] ? 1 : 0,
                        }}
                    >
                        <div style={{ padding: '0px' }}>
                            <hr></hr>
                            <button
                                onClick={() => window.location.href = '/community-members'}
                                style={buttonStyle3}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.24)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 0)'}
                            >
                                Community members
                            </button>
                        </div>
                    </div>
                    <hr></hr>
                </div>
            </div>
        </>
    );
}

export default SideMenu;