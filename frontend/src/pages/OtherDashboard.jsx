import Header from '../UI+UX/Header.jsx';
import { useParams } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserStats, getFollowers, getFollowing } from '/backend/users.js';


//Summary container style
const summaryContainerStyle = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    marginTop: '2rem',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '70%',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto'
};
//Section title style
const sectionTitleStyle = {
    color: '#333',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    borderBottom: '2px solid #eb8d00ff',
    paddingBottom: '0.5rem'
};
//Skill label style
const skillStyle = {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#f0f0f0',
    color: '#333',
    borderRadius: '15px',
    fontSize: '0.85rem',
    display: 'inline-block',
    margin: '0.2rem'
};
// Background Style
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

// Profile container style
const profileContainerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginTop: '8rem',
    width: '100%',
    paddingLeft: '1.2rem',
};

// Text container style (username, followers, following)
const textContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '1rem',
    marginTop: '1rem',
    alignItems: 'flex-start',
};

// Profile picture style
const imageStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
};

// Username style
const usernameStyle = {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    fontSize: '1.2rem',
    margin: 0,
};

// Navigation button style
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

// Style for followers and following texts
const followersStyle = {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    fontSize: '0.7rem',
    marginTop: '0.5rem',
    cursor: 'pointer',
};

// Style for the users cards
const followerCardStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "1rem",
    width: "200px",
    fontFamily: 'Arial, sans-serif',
    backgroundColor: "white",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
};

// Style for grid display of users
const followerGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.5rem",
    width: "98vw",
    padding: "0 2rem",
    boxSizing: "border-box",
};

function OtherDashboard() {
    const { username } = useParams(); // Get username from URL params
    const [currentUser, setCurrentUser] = useState(null); // Currently logged in user
    const [profileUser, setProfileUser] = useState(null); // User whose profile is being viewed
    const [profileUserId, setProfileUserId] = useState(null); // User ID of the profile being viewed
    const [activeIndex, setActiveIndex] = useState(4);
    const [userStats, setUserStats] = useState({
        followers: 0,
        following: 0,
        followersList: [],
        followingList: [],
        profilePicture: "profile.png",
        username: "",
        bio: "",
        accountType: "individual",
        role: "other",
        links: ["", "", "", ""],
        skills: [],
    });
    const [loading, setLoading] = useState(true);
    const [followersData, setFollowersData] = useState([]);
    const [followingData, setFollowingData] = useState([]);
    const [accountType, setAccountType] = useState('individual'); // Account type state
        // Individual role options
        const individualRoles = [
            { value: 'other', label: 'Other' },
            { value: 'student', label: 'Student' },
            { value: 'web-developer', label: 'Web developer' },
        { value: 'software-engineer', label: 'Software developer' },
            { value: 'game-developer', label: 'Game Developer' },
            { value: 'graphic-designer', label: 'Graphic Designer' },
            { value: '3d-scanning', label: '3D scanning enthusiast' },
            { value: '3d-printing', label: '3D printing enthusiast' },
            { value: 'animator', label: 'Animator' },
            { value: 'architect', label: 'Architect' },
            { value: 'scientist', label: 'Scientist' },
        ];
    
        // Organization role options
        const organizationRoles = [
            { value: 'other', label: 'Other' },
            { value: 'school', label: 'School' },
            { value: '3d-studio', label: '3D Creation Studio' },
            { value: 'game-studio', label: 'Game Studio' },
            { value: 'brand', label: 'Brand' },
            { value: 'non-profit', label: 'Non Profit Organization' },
            { value: 'university', label: 'University' },
            { value: 'tech-company', label: 'Tech Company' },
            { value: 'research-lab', label: 'Research Lab' },
        ];
        const formatFirebaseTimestamp = (timestamp) => {
        try {
            // If timestamp is a firebase object in seconds
            if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
                return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            // If timestamp is a Date object with numeric value
            else if (timestamp instanceof Date || typeof timestamp === 'number') {
                return new Date(timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            //If timestamp is a string that can be converted to data
            else if (typeof timestamp === 'string') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            }
            return 'Unknown';
        } catch (error) {
            console.error('Error formatting timestamp:', error, timestamp);
            return 'Unknown';
        }
    };
        // Determine which roles to show based on account type
    useEffect(() => {   
        // Find user by username
        const findUserByUsername = async () => {
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", username));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data();
                    setProfileUser(userData);
                    setProfileUserId(userDoc.id);

                    // Get user stats
                    const stats = await getUserStats(userDoc.id);
                    setUserStats(stats);


                    // Get followers and following
                    const followers = await getFollowers(userDoc.id);
                    setFollowersData(followers);

                    const followings = await getFollowing(userDoc.id);
                    setFollowingData(followings);

                    setLoading(false);
                } else {
                    console.error("User not found");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setLoading(false);
            }
        };

        // Listen for auth state changes for current user
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
        });

        if (username) {
            findUserByUsername();
        }

        return () => unsubscribe();
    }, [username]);

    if (loading) {
        return (
            <div style={backgroundStyle}>
                <Header />
                <div style={{ marginTop: '6rem', paddingLeft: '6rem' }}>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div style={backgroundStyle}>
                <Header />
                <div style={{ marginTop: '6rem', paddingLeft: '6rem' }}>
                    <p>User not found</p>
                </div>
            </div>
        );
    }

    return (
        <div style={backgroundStyle}>
            <Header />
            {/* Profile header */}
            <div style={profileContainerStyle}>
                {/* Profile pic */}
                <img style={imageStyle} src={userStats.profilePicture || "/profile.png"} alt="Profile"
                    onError={(e) => {
                        e.target.src = "/profile.png";
                    }}
                />
                {/* Username, followers/following */}
                <div style={textContainerStyle}>
                    <p style={usernameStyle}>{profileUser.username || profileUser.email}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <span onClick={() => setActiveIndex(2)} style={followersStyle}>Followers: {userStats.followers}</span>
                        <span onClick={() => setActiveIndex(3)} style={followersStyle}>Following: {userStats.following}</span>
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
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <button
                            onClick={() => setActiveIndex(4)}
                            style={getTabButtonStyle(activeIndex === 4)}
                        >
                            Summary
                        </button>
                        <button
                            onClick={() => setActiveIndex(0)}
                            style={getTabButtonStyle(activeIndex === 0)}
                        >
                            Their work
                        </button>
                        <button
                            onClick={() => setActiveIndex(1)}
                            style={getTabButtonStyle(activeIndex === 1)}
                        >
                            Favourites
                        </button>
                    </div>

                    {/* Tab content 1*/}
                    {activeIndex === 0 && (<>
                        <h2
                            style={{
                                fontFamily: "Arial, sans-serif",
                                color: 'gray',
                                fontSize: '1.5rem',
                                textAlign: 'center',
                                fontWeight: 'normal',
                            }}
                        >
                            Models:0
                        </h2>
                        <img src="/3d-model.png"
                            style={{
                                width: '150px',
                                marginTop: '7rem',
                                display: 'flex',
                                alignSelf: 'center',
                                filter: 'invert(1) brightness(50%)'
                            }}
                        />
                        <h2
                            style={{
                                fontFamily: "Arial, sans-serif",
                                color: 'gray',
                                fontSize: '1.5rem',
                                textAlign: 'center',
                                fontWeight: 'normal',
                                paddingRight: '1rem',
                            }}
                        >
                            "Their Work" shows all their models.
                        </h2>
                        <h2
                            style={{
                                fontFamily: "Arial, sans-serif",
                                marginTop: '0rem',
                                color: 'gray',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                paddingRight: '1rem',
                            }}
                        >
                            This user doesn't have models uploaded at the moment.
                        </h2>
                    </>)}

                    {/* Tab content 2*/}
                    {activeIndex === 1 && (<>
                        <img src="/bookmark-star_2.png"
                            style={{
                                width: '150px',
                                marginTop: '7rem',
                                display: 'flex',
                                alignSelf: 'center',
                                filter: 'invert(1) brightness(50%)'
                            }}
                        />
                        <h2
                            style={{
                                fontFamily: "Arial, sans-serif",
                                color: 'gray',
                                fontSize: '1.5rem',
                                textAlign: 'center',
                                fontWeight: 'normal',
                            }}
                        >
                            "Favourites" shows the models they added to their favourite list.
                        </h2>
                        <h2
                            style={{
                                fontFamily: "Arial, sans-serif",
                                color: 'gray',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                            }}
                        >
                            This user doesn't have models at favourites at the moment.
                        </h2>
                    </>)}

                    {/* Followers content*/}
                    {activeIndex === 2 && (
                        <>
                            <h2
                                style={{
                                    fontFamily: "Arial, sans-serif",
                                    color: 'gray',
                                    fontSize: '1.5rem',
                                    textAlign: 'center',
                                    fontWeight: 'normal',
                                }}
                            >
                                Followers:
                            </h2>
                            {/* Followers list */}
                            <div style={followerGridStyle}>
                                {followersData.length === 0 ? (
                                    <p style={{ textAlign: "center", fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: "gray" }}>No followers yet.</p>
                                ) : (
                                    followersData.map((f) => (
                                        <div key={f.uid} style={followerCardStyle}>
                                            <img
                                                src={f.profilePicture}
                                                alt={f.username}
                                                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                                                onError={(e) => (e.target.src = "/profile.png")}
                                            />
                                            <h3 style={{ margin: "0.5rem 0" }}>{f.username}</h3>
                                            <p style={{ margin: 0, fontSize: "0.8rem", color: "gray" }}>
                                                Followers: {f.followers} | Following: {f.following}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* Following content */}
                    {activeIndex === 3 && (
                        <>
                            <h2 style={{
                                fontFamily: "Arial, sans-serif",
                                color: 'gray',
                                fontSize: '1.5rem',
                                textAlign: 'center',
                                fontWeight: 'normal',
                            }}>
                                Followed users:
                            </h2>
                            <div style={followerGridStyle}>
                                {followingData.length === 0 ? (
                                    <p style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: 'gray' }}>Not following anyone.</p>
                                ) : (
                                    followingData.map((f) => (
                                        <div key={f.uid} style={followerCardStyle}>
                                            <img
                                                src={f.profilePicture}
                                                alt={f.username}
                                                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                                                onError={(e) => (e.target.src = "/profile.png")}
                                            />
                                            <h3 style={{ margin: "0.5rem 0" }}>{f.username}</h3>
                                            <p style={{ margin: 0, fontSize: "0.8rem", color: "gray" }}>
                                                Followers: {f.followers} | Following: {f.following}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                    {/* Summary tab */}
                    {activeIndex === 4 && (
                        <div style={summaryContainerStyle}>
                            <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>About Me</h2>
                            {/* The time when this account was created*/}
                            <div style={{ marginBottom: '3rem' }}>
                                <strong>Member since:</strong> {profileUser.createdAt ? formatFirebaseTimestamp(profileUser.createdAt) : 'Unknown'}
                            </div>
                            {/* Account Type */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={sectionTitleStyle}>Account Type</h3>
                                <p style={{ margin: 0 }}>
                                    {profileUser.accountType === 'individual' ? 'Individual' : 'Organization'} -
                                    {(profileUser.accountType === 'individual' ? individualRoles : organizationRoles)
                                        .find(role => role.value === profileUser.role)?.label || 'Other'}
                                </p>
                            </div>

                            {/* Bio */}
                            {profileUser.bio && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={sectionTitleStyle}>Bio</h3>
                                    <p style={{ margin: 0, lineHeight: '1.5' }}>{profileUser.bio}</p>
                                </div>
                            )}

                            {/* Social Media Links */}
                            {profileUser.links && profileUser.links.some(link => link.trim() !== '') && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={sectionTitleStyle}>Social Media Links</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {profileUser.links.map((link, index) => (
                                            link.trim() !== '' && (
                                                <a
                                                    key={index}
                                                    href={link.startsWith('http') ? link : `https://${link}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#eb8d00ff', textDecoration: 'none' }}
                                                >
                                                    {link}
                                                </a>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Software Skills */}
                            {profileUser.skills && profileUser.skills.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={sectionTitleStyle}>Software Skills</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                        {profileUser.skills.map((skill, index) => (
                                            <span key={index} style={skillStyle}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Message in case the user didn't set his information*/}
                            {!profileUser.bio &&
                                (!profileUser.links || profileUser.links.every(link => link.trim() === '')) &&
                                (!profileUser.skills || profileUser.skills.length === 0) && (
                                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                                        This user didn't add any information yet.
                                    </p>
                                )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default OtherDashboard;