import Header from '../UI+UX/Header.jsx';
import {useNavigate} from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

//Background Style

const backgroundStyle = {
    backgroundImage: `url(/background1.jpg)`,
    
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: "100vh",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',

};

//Profile container style

const profileContainerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginTop: '8rem',
    width: '100%',
    paddingLeft: '1.2rem',
};

//Text container style (username, followers, following)

const textContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '1rem',
    marginTop: '1rem',
    alignItems: 'flex-start',
};


const imageStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
};


const usernameStyle = {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    fontSize: '1.2rem',
    margin: 0,
};

//Edit button style

const buttonStyle = {
    height: '30px',
    width: '70px',
    marginTop: '0.5rem',
    cursor: 'pointer',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#575757ff',
    color: 'white',
    fontWeight: 'bold',
};

//Navigation button style

const getTabButtonStyle = (isActive) => ({
    height: '35px',
    minWidth: '100px',
    marginLeft: '1rem',
    cursor: 'pointer',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: isActive ? '#e99700ff' : 'transparent',
    color: isActive ? 'white' : 'black',
    fontWeight: 'bold',
});

const followersStyle = {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    fontSize: '0.7rem',
    marginTop: '0.5rem',
};

function Dashboard() {

    const [user, setUser] = useState(null); //for verifying if the user is logged or not
    const [username, setUsername] = useState(""); //for username display
    const [activeIndex, setActiveIndex] = useState(0); //for navigation buttons
    const navigate = useNavigate();

    

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                //user logged in
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUsername(userDoc.data().username);
                } else {
                    setUsername(currentUser.email);
                }
            } else {
                //user logged out
                setUser(null);
                setUsername("");
                navigate('/');

            }
        });
        return () => unsubscribe();
    }, [navigate]);

    return (
        <div style={backgroundStyle}>
            <Header />
            {/* Profile header */}
            <div style={profileContainerStyle}>
                {/* Profile pic */}
                <img style={imageStyle} src="profile.png" alt="Profile" />

                <div style={textContainerStyle}>
                    <p style={usernameStyle}>{username}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <button style={buttonStyle}>Edit</button>
                        <span style={followersStyle}>Followers: 0</span>
                        <span style={followersStyle}>Following: 0</span>
                    </div>
                </div>
            </div>

            {/* Dashboard content */}
            <div style={{ marginTop: '2rem', width: '100%' }}>
                <section
                    style={{
                        padding: '1rem',
                        width: '100%',
                        minHeight: '100vh',
                        backgroundColor: 'rgba(241, 241, 241, 1)',
                        display: 'flex',
                        flexDirection: 'column', 
                          
                    }}
                >
                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', alignItems:'flex-start', gap: '1rem' }}>
                        <button
                            onClick={() => setActiveIndex(0)}
                            style={getTabButtonStyle(activeIndex === 0)}
                        >
                            Your work
                        </button>
                        <button
                            onClick={() => setActiveIndex(1)}
                            style={getTabButtonStyle(activeIndex === 1)}
                        >
                            Wishlist
                        </button>
                    </div>
                    {/* Contents for each navigation button*/}
                    {activeIndex==0 &&(<h2
                        style={{
                            fontFamily: "Arial, sans-serif",
                            marginTop: '7rem',
                            color: 'gray',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                        }}
                    >
                        You don't have models uploaded at the moment.
                    </h2>)}
                    {activeIndex==1 &&(<h2
                        style={{
                            fontFamily: "Arial, sans-serif",
                            marginTop: '7rem',
                            color: 'gray',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                        }}
                    >
                        You don't have models in wishlist at the moment.
                    </h2>)}
                </section>

            </div>
        </div>


    );
}

export default Dashboard;
