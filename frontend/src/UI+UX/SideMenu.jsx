import React, { useEffect, useRef, useState } from 'react';

import { doSignOut } from '/backend/auth.js';
import { auth, db } from '/backend/firebase.js';

import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
//Style for Sign In
const logoutButtonStyle = { backgroundColor: 'red', color: 'white', padding: '7.5px 15px', borderRadius: '5px', marginTop: '20px', cursor: 'pointer', border: 'none', fontWeight: 'bold', width: '100%' };

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
//Style for Log In
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

function SideMenu({ isOpen, onClose, children, activeIndex }) {
    const menuRef = useRef(null);

    const [isMenuExpanded, setIsMenuExpanded] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUsername(userDoc.data().username);
                } else {
                    setUsername(currentUser.email);
                }
            } else {
                setUser(null);
                setUsername("");
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await doSignOut();
            setUser(null);
            setUsername("");
            onClose();
        } catch (err) {
            console.error("Log out error:", err);
        }
    };
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
    useEffect(() => {
        if (!isOpen) {
            setIsMenuExpanded(false);
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
                    overflowY: 'auto', // <- important dacă se umple ecranul
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
                    {user ? (
                        <>
                            <p style={{ marginTop: '50px', marginLeft:'1rem', fontWeight: 'bold', fontFamily:'Arial, sans-serif', fontSize:'0.7rem' }}>Welcome, {username}</p>
                            <button onClick={handleLogout} style={logoutButtonStyle}>Log Out</button>
                        </>
                    ) : (
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
                    )}

                </div>


            </div>
        </>
    );
}

export default SideMenu;