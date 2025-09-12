import { useState, useEffect } from 'react';
import { doSignOut } from '/backend/auth.js';
import { auth, db } from '/backend/firebase.js';

import { onAuthStateChanged } from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';
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
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Preia username din Firestore
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        username: userDoc.data().username
                    });
                } else {
                    // fallback dacă nu există doc
                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        username: currentUser.displayName || currentUser.email
                    });
                }
            } else {
                setUser(null);
            }
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
                        flexWrap: 'nowrap', // Previne wrapping
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
                        flexWrap: 'nowrap', // Previne wrapping
                        minHeight: '60px'
                    }}
                >
                    <button style={imageButtonStyle1}
                        onClick={() => window.location.href = '/'}
                    >
                        <img src="WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '100px' }}>
                        </img>
                    </button>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>Logged in: {user.username}</span>
                            <button
                                onClick={async () => {
                                    await doSignOut();
                                    setUser(null);
                                }}
                                style={buttonStyle1}
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <div>
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
                    )}

                </nav>
            </header>
        </>
    )
}

export default Header;