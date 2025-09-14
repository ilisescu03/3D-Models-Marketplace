import { useState, useEffect } from 'react';
import { doSignOut } from '/backend/auth.js';
import { auth, db } from '/backend/firebase.js';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import SideMenu from './SideMenu.jsx';

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

const imageButtonStyle = {
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
    const [menuOpen, setMenuOpen] = useState(false);//for side menu
    const [user, setUser] = useState(null);//for verifying if the user is logged in or not
     const [loading, setLoading] = useState(true); 
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
                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        username: userDoc.data().username
                    });
                } else {
                   
                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        username: currentUser.displayName || currentUser.email
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    //For mobile
    if (window.innerWidth < 600) {
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
                    <button onClick={() => setMenuOpen(true)} style={imageButtonStyle}>
                        <img src='./menu.png' alt='Menu' style={{ height: '35px' }} >
                        </img>
                    </button>
                    <button style={imageButtonStyle1}
                        onClick={() => window.location.href = '/'}
                    >
                        <img src="WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '100px' }}>
                        </img>
                    </button>
                    <button style={imageButtonStyle}>
                        <img src='./SearchBtn.png' alt='Menu' style={{ height: '40px' }} >
                        </img>
                    </button>

                </nav>
            </header>
            <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}></SideMenu>
        </>)
    }

    else return (
        //For dekstop
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
                    <button style={imageButtonStyle1}
                        onClick={() => window.location.href = '/'}
                    >
                        <img src="WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '100px' }}>
                        </img>
                    </button>
                    {!loading && (
                    user ? (
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
                                    style={{ width: '50px', borderRadius: '50%' }}
                                    src="profile.png"
                                    alt="Profile"
                                />
                            </button>

                            {menuOpen && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50px',
                                        right: 0,
                                        backgroundColor: 'rgb(239, 239, 239)',
                                        borderRadius: '3px',
                                        display: 'flex',
                                        padding: '0px',
                                        minWidth: '150px',
                                        zIndex: 2000
                                    }}
                                >
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
                                            e.currentTarget.style.backgroundColor = '#eeb004ff';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = 'black';
                                        }}
                                    >
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* If the user is not logged in the login and sign up buttons are displayed*/}
                            <button
                                onClick={() => window.location.href = '/login'}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(92, 92, 92, 1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 1)'; }}
                                style={buttonStyle1}
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => window.location.href = '/signup'}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(204, 100, 3, 1)'; }}
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