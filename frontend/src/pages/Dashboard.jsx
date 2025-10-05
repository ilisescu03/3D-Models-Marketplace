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
    getUserStats, getFollowers, getFollowing, listenToUserStats, doFollowUser, doUnfollowUser
} from '/backend/users.js';
import '/frontend/css/Dashboard.css';
import { Mosaic } from "react-loading-indicators";
function Dashboard() {
    const [userModels, setUserModels] = useState([]);
    const [userModelsLoading, setUserModelsLoading] = useState(false);
    const [favoriteModels, setFavoriteModels] = useState([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [activeIndex, setActiveIndex] = useState(5);
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
        skills: [],
        createdAt: null
    });
    const [loading, setLoading] = useState(true);
    const [followersData, setFollowersData] = useState([]);
    const [followingData, setFollowingData] = useState([]);

    const navigate = useNavigate();

    const formatFirebaseTimestamp = (timestamp) => {
        try {
            if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
                return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else if (timestamp instanceof Date || typeof timestamp === 'number') {
                return new Date(timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else if (typeof timestamp === 'string') {
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

    const handleCardClick = (modelId) => {
        console.log("Navigating to model:", modelId);
        navigate(`/model/${modelId}`);
    };

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
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

                const stopListening = listenToUserStats(currentUser.uid, async (stats) => {
                    setUserStats(stats);
                    setUsername(stats.username);
                    setLoading(false);

                    const followers = await getFollowers(currentUser.uid);
                    setFollowersData(followers);

                    const followings = await getFollowing(currentUser.uid);
                    setFollowingData(followings);
                });
                loadUserModels();
                loadFavoriteModels();
                return () => stopListening();
            } else {
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
                    skills: [],
                    createdAt: null
                })
                setFavoriteModels([]);
                setUserModels([]);
                setLoading(false);
                navigate('/');

            }
        });
        return () => unsubscribe();
    }, [navigate, loadUserModels, loadFavoriteModels]);

    const getModelThumbnail = (model) => {
        if (model.previewImages && model.previewImages.length > 0) {
            return model.previewImages[0];
        }
        return '/default-model-preview.png';
    };
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
        // Track window resize
        useEffect(() => {
            const handleResize = () => {
                setWindowWidth(window.innerWidth);
            };
    
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);
    return (
        <div className="dashboard-background">
            <Header />
            <CookiesBanner />

            {/* Profile header */}
            <div className="dashboard-profile" style={{marginTop: windowWidth<1000 ? '-6rem' : '8rem'}}>
                {/* Profile pic */}
                <img
                    className="profile-image"
                    src={userStats.profilePicture}
                    alt="Profile"
                    onError={(e) => { e.target.src = "profile.png"; }}
                />

                {/* Username, edit button, followers/following */}
                <div className="profile-text" style={{marginTop:'0.9rem'}}>
                    <p className="profile-username">{username}</p>

                    

                    <div className="profile-stats">
                        <span onClick={() => setActiveIndex(2)} className="followers-text">Followers: {userStats.followers}</span>
                        <span onClick={() => setActiveIndex(3)} className="followers-text">Following: {userStats.following}</span>
                    </div>

                    <div className="profile-actions">
                        <button
                            className="edit-button"
                            onClick={() => window.location.href = "/settings"}
                        >
                            Edit
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard content */}
            <div className="dashboard-content">
                <section className="responsive-container dashboard-section">
                    {/* Navigation buttons */}
                    <div className="tabs-row">
                        <button
                            onClick={() => setActiveIndex(5)}
                            className={`tab-btn ${activeIndex === 5 ? 'active' : ''}`}
                        >
                            Summary
                        </button>
                        <button
                            onClick={() => setActiveIndex(0)}
                            className={`tab-btn ${activeIndex === 0 ? 'active' : ''}`}
                        >
                            Your work
                        </button>
                        <button
                            onClick={() => setActiveIndex(1)}
                            className={`tab-btn ${activeIndex === 1 ? 'active' : ''}`}
                        >
                            Favourites
                        </button>
                    </div>

                    {/* Tab content 1 - Your Work*/}
                    {activeIndex === 0 && (
                        <>
                            {userModelsLoading ? (
                                <div style={{ display: 'flex', marginTop: '5rem', justifySelf: 'center' }}
                                >
                                    <Mosaic color="#949494ff" size="small" text="" textColor="#f58800" />
                                </div>
                            ) : userModels.length === 0 ? (
                                <>
                                    <h2 className="empty-title">Models: {userModels.length}</h2>
                                    <img src="/3d-model.png" className="empty-image" />
                                    <h2 className="empty-title">"Your Work" will show you all your models.</h2>
                                    <h2 className="empty-subtitle">You don't have models uploaded at the moment.</h2>
                                </>
                            ) : (
                                <>
                                    <h2 className="empty-title grid-title">Your Models ({userModels.length})</h2>


                                    <div className="models-grid">
                                        {userModels.map((model) => (
                                            <div
                                                key={model.id}
                                                className="model-card"
                                                onClick={() => handleCardClick(model.id)}
                                            >
                                                <img
                                                    src={getModelThumbnail(model)}
                                                    alt={model.title}
                                                    className="model-image"
                                                    onError={(e) => {
                                                        e.target.src = '/default-model-preview.png';
                                                    }}
                                                />

                                                <div className="model-content">
                                                    <div className="model-header">
                                                        <div className="model-header-left">
                                                            <img
                                                                src={model.creatorProfilePicture || '/profile.png'}
                                                                alt={model.creatorUsername}
                                                                className="model-creator-avatar"
                                                                onError={(e) => {
                                                                    e.target.src = '/profile.png';
                                                                }}
                                                            />
                                                            <h3 className="model-title-inline">
                                                                {model.title}
                                                            </h3>
                                                        </div>

                                                        <div className="model-header-right">
                                                            <div className="stat-item" title="Comments">
                                                                <img src="/commentsIcon.png" alt="comments" className="stat-icon" />
                                                                <span>{model.comments?.length || 0}</span>
                                                            </div>
                                                            <div className="stat-item" title="Favorites">
                                                                <img src="/favIcon.png" alt="favorites" className="stat-icon" />
                                                                <span>{model.favorites || 0}</span>
                                                            </div>
                                                            <div className="stat-item" title="Downloads">
                                                                <img src="/downloadsIcon.png" alt="downloads" className="stat-icon" />
                                                                <span>{model.downloads || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>



                                                    {model.software && model.software.length > 0 && (
                                                        <div className="compatible-softwares">
                                                            <div className="softwares-list">
                                                                {model.software.slice(0, 3).map((software, idx) => (
                                                                    <span key={idx} className="software-badge">
                                                                        {software}
                                                                    </span>
                                                                ))}
                                                                {model.software.length > 3 && (
                                                                    <span className="software-badge">
                                                                        +{model.software.length - 3}
                                                                    </span>
                                                                )}
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
                                <div style={{ display: 'flex', marginTop: '5rem', justifySelf: 'center' }}
                                >
                                    <Mosaic color="#949494ff" size="small" text="" textColor="#f58800" />
                                </div>
                            ) : favoriteModels.length === 0 ? (
                                <>
                                    <img src="/bookmark-star_2.png" className="empty-image" />
                                    <h2 className="empty-title">No favorite models yet</h2>
                                    <h2 className="empty-subtitle">Models you favorite will appear here.</h2>
                                </>
                            ) : (
                                <>
                                    <h2 className="empty-title grid-title">Your Favorite Models ({favoriteModels.length})</h2>

                                    <div className="models-grid">
                                        {favoriteModels.map((model) => (
                                            <div
                                                key={model.id}
                                                className="model-card"
                                                onClick={() => handleCardClick(model.id)}
                                            >
                                                <img
                                                    src={getModelThumbnail(model)}
                                                    alt={model.title}
                                                    className="model-image"
                                                    onError={(e) => {
                                                        e.target.src = '/default-model-preview.png';
                                                    }}
                                                />

                                                <div className="model-content">
                                                    <div className="model-header">
                                                        <div className="model-header-left">
                                                            <img
                                                                src={model.creatorProfilePicture || '/profile.png'}
                                                                alt={model.creatorUsername}
                                                                className="model-creator-avatar"
                                                                onError={(e) => {
                                                                    e.target.src = '/profile.png';
                                                                }}
                                                            />
                                                            <h3 className="model-title-inline">
                                                                {model.title}
                                                            </h3>
                                                        </div>

                                                        <div className="model-header-right">
                                                            <div className="stat-item" title="Comments">
                                                                <img src="/commentsIcon.png" alt="comments" className="stat-icon" />
                                                                <span>{model.comments?.length || 0}</span>
                                                            </div>
                                                            <div className="stat-item" title="Favorites">
                                                                <img src="/favIcon.png" alt="favorites" className="stat-icon" />
                                                                <span>{model.favorites || 0}</span>
                                                            </div>
                                                            <div className="stat-item" title="Downloads">
                                                                <img src="/downloadsIcon.png" alt="downloads" className="stat-icon" />
                                                                <span>{model.downloads || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>



                                                    {model.software && model.software.length > 0 && (
                                                        <div className="compatible-softwares">
                                                            <div className="softwares-list">
                                                                {model.software.slice(0, 3).map((software, idx) => (
                                                                    <span key={idx} className="software-badge">
                                                                        {software}
                                                                    </span>
                                                                ))}
                                                                {model.software.length > 3 && (
                                                                    <span className="software-badge">
                                                                        +{model.software.length - 3}
                                                                    </span>
                                                                )}
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
                            <h2 className="section-heading">Followers:</h2>

                            {/* Followers list */}
                            <div className="responsive-grid">
                                {followersData.length === 0 ? (
                                    <p className="muted-center full-row">No followers yet.</p>
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
                                                                const followers = await getFollowers(user.uid);
                                                                setFollowersData(followers);
                                                                const followings = await getFollowing(user.uid);
                                                                setFollowingData(followings);
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
                            <h2 className="section-heading">Followed users:</h2>

                            <div className="responsive-grid">
                                {followingData.length === 0 ? (
                                    <p className="muted-center full-row">You're not following anyone.</p>
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
                                                                const followers = await getFollowers(user.uid);
                                                                setFollowersData(followers);
                                                                const followings = await getFollowing(user.uid);
                                                                setFollowingData(followings);
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
                        <div className="summary-container">
                            <h2 className="summary-title">Summary</h2>

                            <div className="summary-block-lg">
                                <strong>Member since:</strong> {userStats.createdAt ? formatFirebaseTimestamp(userStats.createdAt) : 'Unknown'}
                            </div>

                            <div className="summary-block-md">
                                <h3 className="summary-section-title">Account Type</h3>
                                <p className="summary-paragraph">
                                    {userStats.accountType === 'individual' ? 'Individual' : 'Organization'} -
                                    {userStats.role || 'other'}
                                </p>
                            </div>

                            {userStats.bio && (
                                <div className="summary-block-sm">
                                    <h3 className="summary-section-title">Bio</h3>
                                    <p className="summary-paragraph">{userStats.bio}</p>
                                </div>
                            )}

                            {userStats.links && userStats.links.some(link => link.trim() !== '') && (
                                <div className="summary-block-sm">
                                    <h3 className="summary-section-title">Social Media Links</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {userStats.links.map((link, index) => (
                                            link.trim() !== '' && (
                                                <a
                                                    key={index}
                                                    href={link.startsWith('http') ? link : `https://${link}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="summary-link"
                                                >
                                                    {link}
                                                </a>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {userStats.skills && userStats.skills.length > 0 && (
                                <div className="summary-block-sm">
                                    <h3 className="summary-section-title">Software Skills</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                        {userStats.skills.map((skill, index) => (
                                            <span key={index} className="summary-skill">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!userStats.bio &&
                                (!userStats.links || userStats.links.every(link => link.trim() === '')) &&
                                (!userStats.skills || userStats.skills.length === 0) && (
                                    <p className="info-muted-italic">
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
