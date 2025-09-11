import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
//Style for Sign In
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

    const [isMenuExpanded, setIsMenuExpanded] = useState(false); // 👈 stare pt submeniu

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
                    <button
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(92, 92, 92, 1)';

                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 1)';

                        }}
                        onClick={() => window.location.href = '/login'}
                        style={buttonStyle1} >
                        Log In
                    </button>
                    <button
                        onClick={() => window.location.href = '/signup'}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(204, 100, 3, 1)';

                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 123, 0, 1)';

                        }}
                        style={buttonStyle} >
                        Sign Up
                    </button>


                </div>


            </div>
        </>
    );
}

export default SideMenu;