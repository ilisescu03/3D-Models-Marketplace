import { useState } from 'react';
import SideMenu from './SideMenu.jsx';
const buttonStyle = {
    backgroundColor: 'rgba(255, 123, 0, 1)', // orange background
    color: 'white', //white text
    border: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    transition: '0.3s ease'
}
const imageButtonStyle={
    border:'none',
    backgroundColor:'transparent',
}
function Header() {
     const [menuOpen, setMenuOpen] = useState(false);
     
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
                    <img src="WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '100px' }}>
                    </img>
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
                    <img src="WebsiteLogo.png" alt="ShapeHive Logo" style={{ height: '100px' }}>
                    </img>
                    <button
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(204, 100, 3, 1)';

                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 123, 0, 1)';

                        }}
                        style={buttonStyle} >
                        Sign In
                    </button>
                </nav>
            </header>
        </>
    )
}

export default Header;