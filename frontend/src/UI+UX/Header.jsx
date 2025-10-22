
import React, { useState, useRef, useEffect } from 'react';
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
    const [notifications, setNotifications] = useState([]);//notifications state
    const [notificationUsers, setNotificationUsers] = useState({}); //state to get the correct user photo for notification
    //Refs for notify menu and button
    const notifyMenuRef = useRef();
    const notifyButtonRef = useRef();
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);//for side menu
    const [notifyMenu, setNotifyMenu] = useState(false); //for notifications menu
    const [user, setUser] = useState(null);//for verifying if the user is logged in or not
    const [loading, setLoading] = useState(true);
    const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
    const [profilePicture, setProfilePicture] = useState("/profile.png"); // Default profile picture
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const navigate = useNavigate();
    const unreadCount = notifications.filter(n => n.read === false).length;
    // Track window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    //Use effect for close notifications menu button
    useEffect(() => {
        function handleClickAnywhere(event) {
            // Closes the menu if the user clicks outside the menu or button
            if (
                notifyMenuRef.current &&
                !notifyMenuRef.current.contains(event.target) &&
                notifyButtonRef.current &&
                !notifyButtonRef.current.contains(event.target)
            ) {
                setNotifyMenu(false);
            }
        }
        if (notifyMenu) {
            document.addEventListener("mousedown", handleClickAnywhere);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickAnywhere);
        };
    }, [notifyMenu]);
    // Fetch user profile pics for notification authors
    useEffect(() => {
        // Extract user uid 
        const uids = [...new Set((notifications || []).map(n => n.from).filter(Boolean))];
        if (uids.length === 0) return;

        const fetchProfiles = async () => {
            let usersMap = {};
            await Promise.all(uids.map(async (uid) => {
                // TRIM uid - removes spaces
                const trimmedUid = uid.trim();
                console.log("Fetching profile for UID:", trimmedUid);
                try {
                    const userDoc = await getDoc(doc(db, "users", trimmedUid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        usersMap[trimmedUid] = data.profilePicture || "/profile.png";
                        console.log("Profile picture for", trimmedUid, ":", usersMap[trimmedUid]);
                    } else {
                        usersMap[trimmedUid] = "/profile.png";
                        console.log("User not found for", trimmedUid);
                    }
                } catch (e) {
                    usersMap[trimmedUid] = "/profile.png";
                    console.log("Error fetching user", trimmedUid, e);
                }
            }));
            console.log("Final usersMap:", usersMap);
            setNotificationUsers(usersMap);
        };

        fetchProfiles();
    }, [notifications]);
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
                    setNotifications(userData.notifications || []);

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
    const markAllNotificationsRead = () => {
        // Update local state
        setNotifications(prevNotifs =>
            prevNotifs.map(n => ({ ...n, read: true }))
        );
        // Update în Firestore
        if (user && user.uid) {
            const userRef = doc(db, "users", user.uid);
            // Update notifications field în Firestore
            import("firebase/firestore").then(({ updateDoc }) => {
                updateDoc(userRef, {
                    notifications: notifications.map(n => ({ ...n, read: true }))
                });
            });
        }
    };

    //For mobile
    if (windowWidth < 1000) {
        return (<>
            <header style={{ position: 'fixed', top: '0px', left: '0px', width: '100%', zIndex: 1000 }}>
                <nav
                    className="nav-header"
                    style={{
                        display: 'flex',
                        marginTop: '20px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 15px',
                        gap: '10px',
                        fontFamily: 'Arial, sans-serif',
                        flexWrap: 'nowrap',
                        minHeight: '60px'
                    }}
                >
                    {/* Menu button*/}
                    <button onClick={() => setMenuOpen(true)} style={imageButtonStyle}>
                        <img src='/menu.png' alt='Menu' style={{ height: '30px', marginBottom: '0px' }} />
                    </button>

                    {/* Logo*/}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}>
                        <button style={imageButtonStyle1}
                            onClick={() => window.location.href = '/'}
                        >
                            <img src="/WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '100px' }} />
                        </button>
                    </div>

                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '0px',
                        position: 'relative',
                        left: '4rem',
                        paddingRight: '0px'
                    }}>
                        {!loading && user ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                    ref={notifyButtonRef}
                                    style={imageButtonStyle}
                                    onClick={() => {
                                        if (!notifyMenu) {
                                            setNotifyMenu(true);
                                            markAllNotificationsRead();
                                        } else {
                                            setNotifyMenu(false);
                                        }
                                    }}
                                >
                                    <img
                                        src='/notificationsIcon3.svg'
                                        style={{
                                            width: "30px",
                                            height: "30px",
                                            filter: notifyMenu === true
                                                ? 'invert(44%) sepia(85%) saturate(1352%) hue-rotate(360deg) brightness(101%) contrast(101%)'
                                                : 'invert(0%)',
                                            borderRadius: "50%",
                                            objectFit: "cover"
                                        }}
                                    />
                                    {/* Unread notifications number badge */}
                                    {unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            background: 'red',
                                            color: 'white',
                                            borderRadius: '50%',
                                            padding: '1px 5px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            zIndex: 1,
                                            textAlign: 'center',
                                            border: '2px solid white'
                                        }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {/*Extended menu with notifications*/}
                                {notifyMenu && (
                                    <div
                                        ref={notifyMenuRef}
                                        style={{
                                            position: 'absolute',
                                            top: '30px',
                                            right: 0,
                                            backgroundColor: 'rgba(255, 255, 255, 1)',
                                            borderRadius: '3px',
                                            boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.23)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: '2px 4px',
                                            minWidth: '250px',
                                            minHeight: '250px',
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            zIndex: 2000
                                        }}
                                    >
                                        {notifications.length === 0
                                            ? <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>No notifications yet!</p>
                                            : notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => navigate(n.to)}
                                                    style={{
                                                        margin: '2px 0',
                                                        padding: '8px',
                                                        borderRadius: '3px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: n.read ? 'normal' : 'bold',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '10px'
                                                    }}
                                                >
                                                    <img
                                                        src={notificationUsers[n.from.trim()] || "/profile.png"}
                                                        alt="notif"
                                                        style={{ width: 40, height: 40, borderRadius: 5, objectFit: 'cover' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{n.title}</div>
                                                        <div style={{ fontWeight: 'normal', marginBottom: 2 }}>{n.text}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 3 }}>
                                                            {n.date && new Date(n.date).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Search button */}
                        <button
                            onClick={() => navigate('/search')}
                            style={imageButtonStyle}>
                            <img src='/SearchBtn.png' alt='Search' style={{ height: '30px', position: 'relative', left: '-1rem', marginBottom: '0px' }} />
                        </button>

                        {!loading && user ? (
                            /* Upload button */
                            <button style={imageButtonStyle}
                                onClick={() => {
                                    if (user) {
                                        navigate('/upload');
                                    }
                                }}>
                                <img src='/UploadButton.png' alt='Upload' style={{ height: '25px', position:'relative', left:'-2rem', marginBottom: '0px', filter: 'invert(0%)' }} />
                            </button>
                        ) : null}
                    </div>
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
                        padding: '0 20px',
                        gap: '20px',
                        fontFamily: 'Arial, sans-serif',
                        flexWrap: 'nowrap',
                        minHeight: '0px',
                        maxHeight: '90px',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: '0 0 auto',
                        minWidth: 'auto'
                    }}>
                        {/* Logo button */}
                        <button style={imageButtonStyle1}
                            onClick={() => window.location.href = '/'}
                        >
                            <img src="/WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '90px' }} />
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
                            display: windowWidth < 1000 ? 'none' : 'block'
                        }}
                            onClick={() => navigate('/3d-models')}
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
                                    top: '50px',
                                    left: '10rem',
                                    backgroundColor: 'rgba(255, 255, 255, 1)',
                                    boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.23)',
                                    borderRadius: '3px',
                                    display: 'flex',
                                    padding: '20px',
                                    minWidth: '600px',
                                    maxWidth: '700px',
                                    zIndex: 2000,
                                    maxHeight: '500px',
                                    overflowY: 'auto'
                                }}
                            >
                                {/* Models and user links */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: '0 0 180px',
                                    paddingRight: '20px'
                                }}>
                                    <button
                                        onClick={() => window.location.href = '/3d-models'}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'gray',
                                            cursor: 'pointer',
                                            padding: '8px 12px',
                                            width: '100%',
                                            textAlign: 'left',
                                            borderRadius: '5px',

                                            fontSize: '0.9rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'rgba(255, 123, 0, 1)';

                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'gray';

                                        }}
                                    >
                                        3D Models
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/members'}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'gray',
                                            cursor: 'pointer',
                                            padding: '8px 12px',
                                            width: '100%',
                                            textAlign: 'left',
                                            borderRadius: '5px',

                                            fontSize: '0.9rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'rgba(255, 123, 0, 1)';

                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'gray';

                                        }}
                                    >
                                        Community Members
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/heroes'}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'gray',
                                            cursor: 'pointer',
                                            padding: '8px 12px',
                                            width: '100%',
                                            textAlign: 'left',
                                            borderRadius: '5px',

                                            fontSize: '0.9rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'rgba(255, 123, 0, 1)';

                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'gray';

                                        }}
                                    >
                                        Hive Heroes
                                    </button>

                                </div>

                                {/* Vertical line */}
                                <div style={{
                                    width: '1px',
                                    backgroundColor: 'rgba(92, 92, 92, 0.3)',
                                    margin: '0 20px',
                                    height: 'auto'
                                }}></div>

                                {/* Model categories */}
                                <div style={{
                                    display: 'flex',
                                    flex: 1,
                                    gap: '20px'
                                }}>
                                    {/* First 8 categories */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flex: 1
                                    }}>
                                        {[
                                            { name: 'Architecture', icon: '/architectureIcon.svg' },
                                            { name: 'Character', icon: '/characterIcon.png' },
                                            { name: 'Vehicle', icon: '/vehicleIcon.svg' },
                                            { name: 'Environment', icon: '/lanscape.svg' },
                                            { name: 'Furniture', icon: '/furniture.svg' },
                                            { name: 'Electronics', icon: '/electronicsIcon.svg' },
                                            { name: 'Jewelry', icon: '/jewelryIcon.svg' },
                                            { name: 'Weapons', icon: '/weaponsIcon.svg' }
                                        ].map((category) => (
                                            <button
                                                key={category.name}
                                                onClick={() => {
                                                    localStorage.setItem('autoFilterCategory', category.name);
                                                    window.location.href = '/3d-models';
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'gray',
                                                    cursor: 'pointer',
                                                    padding: '8px 12px',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    borderRadius: '5px',
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255, 123, 0, 1)';
                                                    e.currentTarget.querySelector('img').style.filter = 'invert(44%) sepia(85%) saturate(1352%) hue-rotate(360deg) brightness(101%) contrast(101%)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'gray';
                                                    e.currentTarget.querySelector('img').style.filter = 'invert(50%)';
                                                }}
                                            >
                                                <img
                                                    src={category.icon}
                                                    alt={category.name}
                                                    style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        filter: 'invert(50%)',

                                                    }}
                                                />
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Last 8 categories */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flex: 1
                                    }}>
                                        {[
                                            { name: 'Food & Drink', icon: '/foodDrinkIcon.svg' },
                                            { name: 'Plants', icon: '/plantsIcon.svg' },
                                            { name: 'Animals', icon: '/animalsIcon.svg' },
                                            { name: 'Abstract', icon: '/artIcon.svg' },
                                            { name: 'Mechanical', icon: '/mechanicalIcon.svg' },
                                            { name: 'Fashion & Style', icon: '/fashionIcon.svg' },
                                            { name: 'Sports', icon: '/sportsIcon.svg' },
                                            { name: 'Culture & History', icon: '/cultureIcon.svg' },

                                        ].map((category) => (
                                            <button
                                                key={category.name}
                                                onClick={() => {
                                                    localStorage.setItem('autoFilterCategory', category.name);
                                                    window.location.href = '/3d-models';
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'gray',
                                                    cursor: 'pointer',
                                                    padding: '8px 12px',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    borderRadius: '5px',
                                                    fontWeight: category.name === 'Other' ? 'bold' : 'normal',
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255, 123, 0, 1)';
                                                    e.currentTarget.querySelector('img').style.filter = 'invert(44%) sepia(85%) saturate(1352%) hue-rotate(360deg) brightness(101%) contrast(101%)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'gray';
                                                    e.currentTarget.querySelector('img').style.filter = 'invert(50%)';
                                                }}
                                            >
                                                {category.name !== 'Other' && (<img
                                                    src={category.icon}
                                                    alt={category.name}
                                                    style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        filter: 'invert(50%)',

                                                    }}
                                                />)}
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search input*/}
                    <div
                        onClick={() => navigate('/search')}
                        style={{
                            display: 'flex',
                            alignItems: 'right',
                            flex: 1,
                            justifySelf: 'flex-end',
                            maxWidth: '800px',
                            minWidth: '10px',
                            margin: '0px 100px',
                            position: 'relative'
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
                                flex: '0 0 auto'
                            }}>
                                <div
                                    style={{ position: 'relative', display: 'inline-block' }}
                                >
                                    <button
                                        ref={notifyButtonRef}
                                        style={imageButtonStyle}
                                        onClick={() => {
                                            if (!notifyMenu) {
                                                setNotifyMenu(true);
                                                markAllNotificationsRead();
                                            } else {
                                                setNotifyMenu(false);
                                            }
                                        }}
                                    >

                                        <img
                                            src='/notificationsIcon3.svg'
                                            style={{
                                                width: "25px",
                                                height: "25px",
                                                filter: notifyMenu === true
                                                    ? 'invert(44%) sepia(85%) saturate(1352%) hue-rotate(360deg) brightness(101%) contrast(101%)'
                                                    : 'invert(25%)',
                                                borderRadius: "50%",
                                                objectFit: "cover"
                                            }}
                                        />
                                        {/* Unread notifications number badge */}
                                        {unreadCount > 0 && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                right: '-5px',

                                                background: 'red',
                                                color: 'white',
                                                borderRadius: '50%',
                                                padding: '1px 5px',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                zIndex: 1,

                                                textAlign: 'center',
                                                border: '2px solid white'
                                            }}>
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    {/*Extended menu with notifications*/}
                                    {notifyMenu && (
                                        <div
                                            ref={notifyMenuRef}
                                            style={{
                                                position: 'absolute',
                                                top: '30px',
                                                right: 0,
                                                backgroundColor: 'rgba(255, 255, 255, 1)',
                                                borderRadius: '3px',
                                                boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.23)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: '2px 4px',
                                                minWidth: '250px',
                                                minHeight: '250px',
                                                maxHeight: '250px',
                                                overflowY: 'auto',
                                                zIndex: 2000
                                            }}
                                        >
                                            {notifications.length === 0
                                                ? <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>No notifications yet!</p>
                                                : notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => navigate(n.to)}
                                                        style={{
                                                            margin: '2px 0',
                                                            padding: '8px',
                                                            borderRadius: '3px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: n.read ? 'normal' : 'bold',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '10px'
                                                        }}
                                                    >
                                                        <img
                                                            src={notificationUsers[n.from.trim()] || "/profile.png"}
                                                            alt="notif"
                                                            style={{ width: 40, height: 40, borderRadius: 5, objectFit: 'cover' }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{n.title}</div>
                                                            <div style={{ fontWeight: 'normal', marginBottom: 2 }}>{n.text}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 3 }}>
                                                                {n.date && new Date(n.date).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
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

export default React.memo(Header);
