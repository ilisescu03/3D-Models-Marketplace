import Header from '../UI+UX/Header.jsx';
import { useNavigate } from 'react-router-dom';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getUserFavoriteModels, getModelsByCreator } from '/backend/models.js'; 
import '/frontend/css/App.css'
import {
    getUserStats, getFollowers, getFollowing, listenToUserStats, doFollowUser, doUnfollowUser, doUpdateProfilePicture,
    updateUsername, updateUserData
} from '/backend/users.js';
import '/frontend/css/App.css';

// Summary container style
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

// Section title style
const sectionTitleStyle = {
    color: '#333',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    borderBottom: '2px solid #eb8d00ff',
    paddingBottom: '0.5rem'
};

// Skills labels style
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
    flexWrap: 'wrap'
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

// Edit button style
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
    transition: '0.3s ease',
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

// Base model card styling
const modelCardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    width: '280px',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column'
};
// Compatible software section styling
const compatibleSoftwaresStyle = {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #f0f0f0'
};
// Software list container styling
const softwaresListStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3px',
    marginTop: '4px'
};
// Individual software badge styling
const softwareBadgeStyle = {
    display: 'inline-block',
    backgroundColor: '#fdf0e8ff',
    color: '#cc4b00ff',
    padding: '1px 6px',
    borderRadius: '6px',
    fontSize: '0.6rem',
    fontWeight: '500'
};
// Hover state for model card
const modelCardHoverStyle = {
    ...modelCardStyle,
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)'
};
// Model image styling
const modelImageStyle = {
    width: '100%',
    height: '300px',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    aspectRatio: '1/1'
};

// Hover state for model image
const modelImageHoverStyle = {
    ...modelImageStyle,
    transform: 'scale(1.05)'
};

// Content area inside model card
const modelContentStyle = {
    padding: '15px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '8px',
};
// Model title styling
const modelTitleStyle = {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
};

// Model metadata styling
const modelMetaStyle = {
    fontSize: '0.7rem',
    color: '#666',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
};

// Category badge styling
const categoryBadgeStyle = {
    display: 'inline-block',
    backgroundColor: '#ff7b00',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '0.8rem',
    width: '25%',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: '8px'
};
function Dashboard() {
    const [userModels, setUserModels] = useState([]);
    const [userModelsLoading, setUserModelsLoading] = useState(false);
    const [favoriteModels, setFavoriteModels] = useState([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [activeIndex, setActiveIndex] = useState(5);
    // Track which card is hovered
    const [hoveredCard, setHoveredCard] = useState(null);
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
        skills: []
    });
    const [loading, setLoading] = useState(true);
    const [followersData, setFollowersData] = useState([]);
    const [followingData, setFollowingData] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);

    const [availableSkills] = useState([
        "Blender", "Cinema4d", "AutoCAD", "ArhiCAD", "Maya",
        "3ds Max", "ZBrush", "Substance Painter", "Photoshop",
        "Godot", "Unity", "Unreal Engine"
    ]);
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState('individual');

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

    // Determine which roles to show based on account type
    const roles = accountType === 'individual' ? individualRoles : organizationRoles;
    // Handle click on model card to navigate to model details
    const handleCardClick = (modelId) => {
        console.log("Navigating to model:", modelId);
        navigate(`/model/${modelId}`);
    };
    //Function to load the models made by this user
    const loadUserModels = useCallback(async () => {
        if (!user) {
            setUserModels([]);
            return;
        }

        try {
            setUserModelsLoading(true);
            const result = await getModelsByCreator(user.uid);

            if (result.success) {
                console.log("User models loaded:", result.models.length);
                setUserModels(result.models);
            } else {
                console.error("Failed to load user models:", result.message);
                setUserModels([]);
            }
        } catch (error) {
            console.error("Error loading user models:", error);
            setUserModels([]);
        } finally {
            setUserModelsLoading(false);
        }
    }, [user]);
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
            // If timestamp is a string that can be converted to date
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
    //Load favorite models function
    const loadFavoriteModels = useCallback(async () => {
        if (!user) return;

        try {
            setFavoritesLoading(true);
            const result = await getUserFavoriteModels(user.uid);
            if (result.success) {
                setFavoriteModels(result.models);
                console.log("Favorite models loaded:", result.models.length);
            } else {
                console.error("Failed to load favorite models:", result.message);
            }
        } catch (error) {
            console.error("Error loading favorite models:", error);
        } finally {
            setFavoritesLoading(false);
        }
    }, [user]);
    // Effect for check authentication and fetch user data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User logged in
                setUser(currentUser);
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUsername(userData.username || userData.email);
                    }
                } catch (error) {
                    console.error("Error getting user data:", error);
                }

                // Listen to real-time user stats updates
                const stopListening = listenToUserStats(currentUser.uid, async (stats) => {
                    setUserStats(stats);
                    setUsername(stats.username);
                    setSelectedSkills(stats.skills || [])
                    setLoading(false);

                    // Fetch followers and following lists
                    const followers = await getFollowers(currentUser.uid);
                    setFollowersData(followers);

                    const followings = await getFollowing(currentUser.uid);
                    setFollowingData(followings);
                });
                loadUserModels();
                loadFavoriteModels();
                // Clean up listener on unmount
                return () => stopListening();
            } else {
                // User logged out
                setUser(null);
                setUsername("");
                setUserStats({
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
                    skills: []
                })
                setSelectedSkills([]);
                setFavoriteModels([]); // Reset favorite models
                setUserModels([]); // Reset user models
                setLoading(false);
                navigate('/');

            }
        });
        return () => unsubscribe();
    }, [navigate, loadUserModels, loadFavoriteModels]);
    // Get thumbnail image for model, fallback to default if not available
    const getModelThumbnail = (model) => {
        if (model.previewImages && model.previewImages.length > 0) {
            return model.previewImages[0];
        }
        // Fallback to a default 3D model image
        return '/default-model-preview.png';
    };

    return (
        <div style={backgroundStyle}>
            <Header />
            <CookiesBanner />

            {/* Profile header */}
            <div style={profileContainerStyle}>
                {/* Profile pic */}
                <img
                    style={imageStyle}
                    src={userStats.profilePicture}
                    alt="Profile"
                    onError={(e) => { e.target.src = "profile.png"; }}
                />

                {/* Username, edit button, followers/following */}
                <div style={textContainerStyle}>
                    <p style={usernameStyle}>{username}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#2c2c2cff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#575757ff';
                            }}
                            onClick={() => window.location.href = "/settings"}
                            style={buttonStyle}>Edit</button>
                        <span onClick={() => setActiveIndex(2)} style={followersStyle}>Followers: {userStats.followers}</span>
                        <span onClick={() => setActiveIndex(3)} style={followersStyle}>Following: {userStats.following}</span>
                    </div>
                </div>
            </div>

            {/* Dashboard content */}
            <div style={{ marginTop: '2rem', width: '100%' }}>
                <section className="responsive-container" style={{ backgroundColor: '#f1f1f1ff', minHeight: '1000px' }}>
                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', marginBottom: '4rem', alignItems: 'flex-start', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setActiveIndex(5)}
                            style={getTabButtonStyle(activeIndex === 5)}
                        >
                            Summary
                        </button>
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
                            Favourites
                        </button>
                    </div>

                    {/* Tab content 1 - Your Work*/}
                    {activeIndex === 0 && (
                        <>
                            {userModelsLoading ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⏳</div>
                                    Loading your models...
                                </div>
                            ) : userModels.length === 0 ? (
                                <>
                                    <h2 style={{
                                        fontFamily: "Arial, sans-serif",
                                        color: 'gray',
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        fontWeight: 'normal',
                                    }}>
                                        Models: {userModels.length}
                                    </h2>
                                    <img src="/3d-model.png"
                                        style={{
                                            width: '150px',
                                            marginTop: '3rem',
                                            display: 'flex',
                                            justifySelf: 'center',
                                            filter: 'invert(1) brightness(50%)'
                                        }}
                                    />
                                    <h2 style={{
                                        fontFamily: "Arial, sans-serif",
                                        color: 'gray',
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        fontWeight: 'normal',
                                    }}>
                                        "Your Work" will show you all your models.
                                    </h2>
                                    <h2 style={{
                                        fontFamily: "Arial, sans-serif",
                                        marginTop: '0rem',
                                        color: 'gray',
                                        fontSize: '0.9rem',
                                        textAlign: 'center',
                                    }}>
                                        You don't have models uploaded at the moment.
                                    </h2>
                                </>
                            ) : (
                                <>
                                    <h2 style={{
                                        fontFamily: "Arial, sans-serif",
                                        color: 'gray',
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        fontWeight: 'normal',
                                        marginBottom: '30px'
                                    }}>
                                        Your Models ({userModels.length})
                                    </h2>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 280px))',
                                        gap: '20px',
                                        justifyContent: 'center',
                                        padding: '0 20px'
                                    }}>
                                        {userModels.map((model, index) => (
                                            <div
                                                key={model.id}
                                                style={hoveredCard === index ? modelCardHoverStyle : modelCardStyle}
                                                onClick={() => handleCardClick(model.id)}
                                                onMouseEnter={() => setHoveredCard(index)}
                                                onMouseLeave={() => setHoveredCard(null)}
                                            >
                                                <img
                                                    src={getModelThumbnail(model)}
                                                    alt={model.title}
                                                    style={hoveredCard === index ? modelImageHoverStyle : modelImageStyle}
                                                    onError={(e) => {
                                                        e.target.src = '/default-model-preview.png';
                                                    }}
                                                />

                                                <div style={modelContentStyle}>
                                                    {/* Display category badge if available */}
                                                    {model.category && (
                                                        <div style={categoryBadgeStyle}>
                                                            {model.category}
                                                        </div>
                                                    )}
                                                    <h3 style={modelTitleStyle}>
                                                        {model.title}
                                                    </h3>
                                                    {/* Creator information */}
                                                    <div style={modelMetaStyle}>
                                                        <span>Created by: <strong>{model.creatorUsername || 'Unknown'}</strong></span>
                                                    </div>

                                                    {/* Download and favorite counts */}
                                                    <div style={modelMetaStyle}>
                                                        <span>{model.downloads || 0} downloads</span>
                                                        <span>{model.favorites || 0} favorites</span>
                                                    </div>

                                                    {/* Compatible software list */}
                                                    {model.software && model.software.length > 0 && (
                                                        <div style={compatibleSoftwaresStyle}>
                                                            <div style={modelMetaStyle}>
                                                                <span>Compatible with:</span>
                                                            </div>
                                                            <div style={softwaresListStyle}>
                                                                {model.software.map((software, idx) => (
                                                                    <span key={idx} style={softwareBadgeStyle}>
                                                                        {software}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Tab content 2 - Favourites*/}
                    {activeIndex === 1 && (
                        <>
                            {favoritesLoading ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⏳</div>
                                    Loading your favorite models...
                                </div>
                            ) : favoriteModels.length === 0 ? (
                                <>
                                    <img src="/bookmark-star_2.png"
                                        style={{
                                            width: '150px',
                                            marginTop: '3rem',
                                            display: 'flex',
                                            justifySelf: 'center',
                                            filter: 'invert(1) brightness(50%)'
                                        }}
                                    />
                                    <h2 style={{
                                        fontFamily: "Arial, sans-serif",
                                        color: 'gray',
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        fontWeight: 'normal',
                                    }}>
                                        No favorite models yet
                                    </h2>
                                    <h2 style={{
                                        fontFamily: "Arial, sans-serif",
                                        color: 'gray',
                                        fontSize: '0.9rem',
                                        textAlign: 'center',
                                    }}>
                                        Models you favorite will appear here.
                                    </h2>
                                </>
                            ) : (
                                <>
                                    <h2 style={{
                                        fontFamily: "Arial, sans-serif",
                                        color: 'gray',
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        fontWeight: 'normal',
                                        marginBottom: '30px'
                                    }}>
                                        Your Favorite Models ({favoriteModels.length})
                                    </h2>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 280px))',
                                        gap: '20px',
                                        justifyContent: 'center',
                                        padding: '0 20px'
                                    }}>
                                        {favoriteModels.map((model, index) => (
                                            <div
                                                key={model.id}
                                                style={hoveredCard === index ? modelCardHoverStyle : modelCardStyle}
                                                onClick={() => handleCardClick(model.id)}
                                                onMouseEnter={() => setHoveredCard(index)}
                                                onMouseLeave={() => setHoveredCard(null)}
                                            >
                                                <img
                                                    src={getModelThumbnail(model)}
                                                    alt={model.title}
                                                    style={hoveredCard === index ? modelImageHoverStyle : modelImageStyle}
                                                    onError={(e) => {
                                                        e.target.src = '/default-model-preview.png';
                                                    }}
                                                />

                                                <div style={modelContentStyle}>
                                                    {/* Display category badge if available */}
                                                    {model.category && (
                                                        <div style={categoryBadgeStyle}>
                                                            {model.category}
                                                        </div>
                                                    )}
                                                    <h3 style={modelTitleStyle}>
                                                        {model.title}
                                                    </h3>
                                                    {/* Creator information */}
                                                    <div style={modelMetaStyle}>

                                                        <span>Created by: <strong>{model.creatorUsername || 'Unknown'}</strong></span>
                                                    </div>


                                                    {/* Download and favorite counts */}
                                                    <div style={modelMetaStyle}>

                                                        <span>{model.downloads || 0} downloads</span>

                                                        <span>{model.favorites || 0} favorites</span>
                                                    </div>
                                                    {/* Compatible software list */}
                                                    {model.software && model.software.length > 0 && (
                                                        <div style={compatibleSoftwaresStyle}>
                                                            <div style={modelMetaStyle}>

                                                                <span>Compatible with:</span>
                                                            </div>
                                                            <div style={softwaresListStyle}>
                                                                {model.software.map((software, idx) => (
                                                                    <span key={idx} style={softwareBadgeStyle}>
                                                                        {software}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}



                                                </div>
                                            </div>

                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Followers content*/}
                    {activeIndex === 2 && (
                        <>
                            <h2 style={{
                                fontFamily: "Arial, sans-serif",
                                color: 'gray',
                                fontSize: '1.5rem',
                                textAlign: 'center',
                                fontWeight: 'normal',
                            }}>
                                Followers:
                            </h2>

                            {/* Followers list */}
                            <div className="responsive-grid">
                                {followersData.length === 0 ? (
                                    <p style={{ textAlign: "center", fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: "gray", gridColumn: "1 / -1" }}>No followers yet.</p>
                                ) : (
                                    followersData.map((f) => (
                                        <div key={f.uid} className="user-card">
                                            <img
                                                src={f.profilePicture}
                                                alt={f.username}
                                                onError={(e) => (e.target.src = "profile.png")}
                                            />
                                            <h3>{f.username}</h3>
                                            <p>Followers: {f.followers} | Following: {f.following}</p>

                                            {/* Follow/Unfollow button*/}
                                            {user && (
                                                <button
                                                    className={`follow-button ${userStats.followingList.includes(f.uid) ? 'unfollow' : 'follow'}`}
                                                    onClick={async () => {
                                                        try {
                                                            let result;
                                                            if (userStats.followingList.includes(f.uid)) {
                                                                result = await doUnfollowUser(f.uid);
                                                            } else {
                                                                result = await doFollowUser(f.uid);
                                                            }
                                                            if (result.success) {
                                                                // Update following list
                                                                if (userStats.followingList.includes(f.uid)) {
                                                                    setUserStats((prev) => ({
                                                                        ...prev,
                                                                        followingList: prev.followingList.filter((id) => id !== f.uid),
                                                                        following: prev.following - 1
                                                                    }));
                                                                } else {
                                                                    setUserStats((prev) => ({
                                                                        ...prev,
                                                                        followingList: [...prev.followingList, f.uid],
                                                                        following: prev.following + 1
                                                                    }));
                                                                }
                                                                const followers = await getFollowers(user.uid)
                                                                setFollowersData(followers);
                                                            } else {
                                                                console.log(result.message);
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }}
                                                >
                                                    {userStats.followingList.includes(f.uid) ? "Unfollow" : "Follow"}
                                                </button>
                                            )}
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

                            <div className="responsive-grid">
                                {followingData.length === 0 ? (
                                    <p style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: 'gray', gridColumn: "1 / -1" }}>You're not following anyone.</p>
                                ) : (
                                    followingData.map((f) => (
                                        <div key={f.uid} className="user-card">
                                            <img
                                                src={f.profilePicture}
                                                alt={f.username}
                                                onError={(e) => (e.target.src = "profile.png")}
                                            />
                                            <h3>{f.username}</h3>
                                            <p>Followers: {f.followers} | Following: {f.following}</p>

                                            {/* Follow/Unfollow button*/}
                                            {user && (
                                                <button
                                                    className={`follow-button ${userStats.followingList.includes(f.uid) ? 'unfollow' : 'follow'}`}
                                                    onClick={async () => {
                                                        try {
                                                            let result;
                                                            if (userStats.followingList.includes(f.uid)) {
                                                                result = await doUnfollowUser(f.uid);
                                                            } else {
                                                                result = await doFollowUser(f.uid);
                                                            }
                                                            if (result.success) {
                                                                if (userStats.followingList.includes(f.uid)) {
                                                                    setUserStats((prev) => ({
                                                                        ...prev,
                                                                        followingList: prev.followingList.filter((id) => id !== f.uid),
                                                                        following: prev.following - 1
                                                                    }));
                                                                } else {
                                                                    setUserStats((prev) => ({
                                                                        ...prev,
                                                                        followingList: [...prev.followingList, f.uid],
                                                                        following: prev.following + 1
                                                                    }));
                                                                }
                                                                const followers = await getFollowers(user.uid)
                                                                setFollowersData(followers);
                                                            } else {
                                                                console.log(result.message);
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }}
                                                >
                                                    {userStats.followingList.includes(f.uid) ? "Unfollow" : "Follow"}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* Summary tab */}
                    {activeIndex === 5 && (
                        <div style={summaryContainerStyle}>
                            <h2 style={{ color: '#333', marginBottom: '3rem', fontSize: '1.7rem' }}>Summary</h2>

                            {/* The time when this account was created*/}
                            <div style={{ marginBottom: '3rem' }}>
                                <strong>Member since:</strong> {userStats.createdAt ? formatFirebaseTimestamp(userStats.createdAt) : 'Unknown'}
                            </div>

                            {/* Account Type */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={sectionTitleStyle}>Account Type</h3>
                                <p style={{ margin: 0 }}>
                                    {userStats.accountType === 'individual' ? 'Individual' : 'Organization'} -
                                    {roles.find(role => role.value === userStats.role)?.label || 'Other'}
                                </p>
                            </div>

                            {/* Bio */}
                            {userStats.bio && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={sectionTitleStyle}>Bio</h3>
                                    <p style={{ margin: 0, lineHeight: '1.5' }}>{userStats.bio}</p>
                                </div>
                            )}

                            {/* Social Media Links */}
                            {userStats.links && userStats.links.some(link => link.trim() !== '') && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={sectionTitleStyle}>Social Media Links</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {userStats.links.map((link, index) => (
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
                            {userStats.skills && userStats.skills.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={sectionTitleStyle}>Software Skills</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                        {userStats.skills.map((skill, index) => (
                                            <span key={index} style={skillStyle}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* In the case the user didn't add any info */}
                            {!userStats.bio &&
                                (!userStats.links || userStats.links.every(link => link.trim() === '')) &&
                                (!userStats.skills || userStats.skills.length === 0) && (
                                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                                        You didn't add any information yet.
                                    </p>
                                )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Dashboard;