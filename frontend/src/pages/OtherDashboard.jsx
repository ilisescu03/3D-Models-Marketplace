import Header from '../UI+UX/Header.jsx';
import { useParams } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserFavoriteModels } from '/backend/models.js';
import { getUserStats, getFollowers, getFollowing } from '/backend/users.js';
import CookiesBanner from '../UI+UX/CookiesBanner';
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

// Skill label style
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
function OtherDashboard() {
    const [favoriteModels, setFavoriteModels] = useState([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);
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
    const [hoveredCard, setHoveredCard] = useState(null);
    const handleCardClick = (modelId) => {
        // Navigate to model details page
        window.location.href = `/model/${modelId}`;
    };

    const getModelThumbnail = (model) => {
        return model.previewImages && model.previewImages.length > 0
            ? model.previewImages[0]
            : '/default-model-preview.png';
    };
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

    // Determine which roles to show based on account type
    const loadFavoriteModels = async (userId) => {
        try {
            setFavoritesLoading(true);
            const result = await getUserFavoriteModels(userId);
            if (result.success) {
                setFavoriteModels(result.models);
            } else {
                console.error("Failed to load favorite models:", result.message);
            }
        } catch (error) {
            console.error("Error loading favorite models:", error);
        } finally {
            setFavoritesLoading(false);
        }
    };

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

                    // Load favorite models using the actual userDoc.id, not profileUserId
                    try {
                        setFavoritesLoading(true);
                        const result = await getUserFavoriteModels(userDoc.id); // <- FIX: Use userDoc.id directly
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
            <CookiesBanner />

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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span onClick={() => setActiveIndex(2)} style={followersStyle}>Followers: {userStats.followers}</span>
                        <span onClick={() => setActiveIndex(3)} style={followersStyle}>Following: {userStats.following}</span>
                    </div>
                </div>
            </div>

            {/* Dashboard content */}
            <div style={{ marginTop: '2rem', width: '100%' }}>
                <section className="responsive-container" style={{ backgroundColor: '#f1f1f1ff', minHeight: '1000px' }}>
                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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

                    {/* Tab content 1 - Their Work*/}
                    {activeIndex === 0 && (<>
                        <h2 style={{
                            fontFamily: "Arial, sans-serif",
                            color: 'gray',
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            fontWeight: 'normal',
                        }}>
                            Models:0
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
                            "Their Work" shows all their models.
                        </h2>
                        <h2 style={{
                            fontFamily: "Arial, sans-serif",
                            marginTop: '0rem',
                            color: 'gray',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                        }}>
                            This user doesn't have models uploaded at the moment.
                        </h2>
                    </>)}

                    {/* Tab content 2 - Favourites*/}
                    {activeIndex === 1 && (
                        <>
                            {favoritesLoading ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⏳</div>
                                    Loading user's favorite models...
                                </div>
                            ) : favoriteModels.length === 0 ? (
                                <>
                                    <img src="bookmark-star_2.png"
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
                                        Favorite Models ({favoriteModels.length})
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
                                                onError={(e) => (e.target.src = "/profile.png")}
                                            />
                                            <h3>{f.username}</h3>
                                            <p>Followers: {f.followers} | Following: {f.following}</p>
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
                                    <p style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: 'gray', gridColumn: "1 / -1" }}>Not following anyone.</p>
                                ) : (
                                    followingData.map((f) => (
                                        <div key={f.uid} className="user-card">
                                            <img
                                                src={f.profilePicture}
                                                alt={f.username}
                                                onError={(e) => (e.target.src = "/profile.png")}
                                            />
                                            <h3>{f.username}</h3>
                                            <p>Followers: {f.followers} | Following: {f.following}</p>
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
                                    {roles.find(role => role.value === profileUser.role)?.label || 'Other'}
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