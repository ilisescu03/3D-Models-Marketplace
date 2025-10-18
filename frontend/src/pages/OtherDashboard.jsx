import Header from '../UI+UX/Header.jsx';
import Footer from '../UI+UX/Footer.jsx';
import { useParams } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getUserFavoriteModels, getModelsByCreator } from '/backend/models.js';
import { getUserStats, getFollowers, getFollowing, listenToUserStats, doFollowUser, doUnfollowUser, sendNotification } from '/backend/users.js';
import CookiesBanner from '../UI+UX/CookiesBanner';
import '/frontend/css/App.css';
import '/frontend/css/OtherDashboard.css';
import { Mosaic } from 'react-loading-indicators';
import LoadingScreen from '../UI+UX/LoadingScreen.jsx';
import { useNavigate } from 'react-router-dom';
function OtherDashboard() {
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [favoriteModels, setFavoriteModels] = useState([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);
    const { username } = useParams();
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserUsername, setCurrentUserUsername] = useState('');
    const [profileUser, setProfileUser] = useState(null);
    const [profileUserId, setProfileUserId] = useState(null);
    const [userModels, setUserModels] = useState([]);
    const [userModelsLoading, setUserModelsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(4);
    const [userStats, setUserStats] = useState({
        followers: 0,
        following: 0,
        followersList: [],
        followingList: [],
        profilePicture: 'profile.png',
        username: '',
        bio: '',
        accountType: 'individual',
        role: 'other',
        links: ['', '', '', ''],
        skills: [],
    });
    const [loading, setLoading] = useState(true);
    const [followersData, setFollowersData] = useState([]);
    const [followingData, setFollowingData] = useState([]);
    const [accountType, setAccountType] = useState('individual');
    const [viewerStats, setViewerStats] = useState({
        followingList: [],
    });

    const handleCardClick = (modelId) => {
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
            if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
                return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            } else if (timestamp instanceof Date || typeof timestamp === 'number') {
                return new Date(timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            } else if (typeof timestamp === 'string') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                }
            }
            return 'Unknown';
        } catch (error) {
            console.error('Error formatting timestamp:', error, timestamp);
            return 'Unknown';
        }
    };

    // Load user's models
    const loadUserModels = useCallback(async (userId) => {
        if (!userId) {
            setUserModels([]);
            return;
        }

        try {
            setUserModelsLoading(true);
            const result = await getModelsByCreator(userId);

            if (result.success) {
                console.log('User models loaded:', result.models.length);
                setUserModels(result.models);
            } else {
                console.error('Failed to load user models:', result.message);
                setUserModels([]);
            }
        } catch (error) {
            console.error('Error loading user models:', error);
            setUserModels([]);
        } finally {
            setUserModelsLoading(false);
        }
    }, []);

    // Load favorite models
    const loadFavoriteModels = useCallback(async (userId) => {
        if (!userId) {
            setFavoriteModels([]);
            return;
        }

        try {
            setFavoritesLoading(true);
            const result = await getUserFavoriteModels(userId);
            if (result.success) {
                setFavoriteModels(result.models);
                console.log('Favorite models loaded:', result.models.length);
            } else {
                console.error('Failed to load favorite models:', result.message);
                setFavoriteModels([]);
            }
        } catch (error) {
            console.error('Error loading favorite models:', error);
            setFavoriteModels([]);
        } finally {
            setFavoritesLoading(false);
        }
    }, []);
    // Load current user's username
    useEffect(() => {
        const loadCurrentUsername = async () => {
            if (!currentUser) {
                setCurrentUserUsername('');
                return;
            }

            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUserUsername(userData.username || userData.email || 'Someone');
                } else {
                    setCurrentUserUsername(currentUser.email || 'Someone');
                }
            } catch (error) {
                console.error('Error loading username:', error);
                setCurrentUserUsername('Someone');
            }
        };

        loadCurrentUsername();
    }, [currentUser]);
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Find user by username
        const findUserByUsername = async () => {
            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('username', '==', username));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data();
                    setProfileUser(userData);
                    setProfileUserId(userDoc.id);

                    const stats = await getUserStats(userDoc.id);
                    setUserStats(stats);

                    const followers = await getFollowers(userDoc.id);
                    setFollowersData(followers);

                    const followings = await getFollowing(userDoc.id);
                    setFollowingData(followings);

                    await loadUserModels(userDoc.id);
                    await loadFavoriteModels(userDoc.id);
                    setLoading(false);
                } else {
                    console.error('User not found');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
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
    }, [username, loadUserModels, loadFavoriteModels]);

    // Listen to current viewer's stats (to know followingList for follow buttons)
    useEffect(() => {
        if (!currentUser) return;
        const stop = listenToUserStats(currentUser.uid, (stats) => {
            setViewerStats(stats || { followingList: [] });
        });
        return () => stop && stop();
    }, [currentUser]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (!profileUser) {
        return (
            <div className="dashboard-background">
                <Header />
                <div className="status-container">
                    <p>User not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-background">
            <Header />
            <CookiesBanner />

            {/* Profile header */}
            <div className="dashboard-profile" style={{ marginTop: windowWidth < 1000 ? '-6rem' : '8rem' }}>
                {/* Profile pic */}
                <img
                    className="profile-image"
                    src={userStats.profilePicture || '/profile.png'}
                    alt="Profile"
                    onError={(e) => {
                        e.target.src = '/profile.png';
                    }}
                />

                {/* Username, follow button, followers/following */}
                <div className="profile-text" style={{ marginTop: '0.9rem' }}>
                    <p className="profile-username" >{profileUser.username || profileUser.email}</p>



                    <div className="profile-stats">
                        <span onClick={() => setActiveIndex(2)} className="followers-text">Followers: {userStats.followers}</span>
                        <span onClick={() => setActiveIndex(3)} className="followers-text">Following: {userStats.following}</span>
                    </div>

                    <div className="profile-actions">
                        {/* Butonul de Follow/Unfollow */}
                        {currentUser?.uid !== profileUserId && (
                            <button
                                className={`edit-button ${viewerStats.followingList?.includes(profileUserId) ? 'unfollow' : 'follow'}`}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!currentUser) {
                                        navigate('/login');
                                        return;
                                    }
                                    try {

                                        if (viewerStats.followingList?.includes(profileUserId)) {
                                            await doUnfollowUser(profileUserId);
                                        } else {
                                            const result = await doFollowUser(profileUserId);
                                            if (result.success) {
                                                // Notify the user 
                                                await sendNotification(
                                                    profileUserId,                           // receiver 
                                                    currentUser.uid,                         // sender 
                                                    "You have a new follower!",             // title
                                                    `${currentUserUsername} started following you!`, // message 
                                                    `/user/${currentUserUsername}`           // link to sender's profile
                                                );
                                            }

                                        }
                                        // Reload data to update button
                                        const updatedStats = await getUserStats(profileUserId);
                                        setUserStats(updatedStats);
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}
                                style={{
                                    backgroundColor: viewerStats.followingList?.includes(profileUserId) ? '#ff4444' : '#575757ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    height: '30px',
                                    width: '100px',
                                    transition: 'background-color 0.3s ease'
                                }}
                            >
                                {viewerStats.followingList?.includes(profileUserId) ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {/* Dashboard content */}
            <div className="dashboard-content">
                <section className="responsive-container dashboard-section">
                    {/* Navigation buttons */}
                    <div className="tabs-row">
                        <button
                            onClick={() => setActiveIndex(4)}
                            className={`tab-btn ${activeIndex === 4 ? 'active' : ''}`}
                        >
                            Summary
                        </button>
                        <button
                            onClick={() => setActiveIndex(0)}
                            className={`tab-btn ${activeIndex === 0 ? 'active' : ''}`}
                        >
                            Their work
                        </button>
                        <button
                            onClick={() => setActiveIndex(1)}
                            className={`tab-btn ${activeIndex === 1 ? 'active' : ''}`}
                        >
                            Favourites
                        </button>
                    </div>

                    {/* Tab content 1 - Their Work*/}
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
                                    <h2 className="empty-title">"Their Work" shows all their models.</h2>
                                    <h2 className="empty-subtitle">This user doesn't have models uploaded at the moment.</h2>
                                </>
                            ) : (
                                <>
                                    <h2 className="empty-title grid-title">Their Models ({userModels.length})</h2>

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
                                </>
                            ) : (
                                <>
                                    <h2 className="empty-title grid-title">Favorite Models ({favoriteModels.length})</h2>


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
                                                onError={(e) => (e.target.src = '/profile.png')}
                                            />
                                            <h3>{f.username}</h3>
                                            <p>Followers: {f.followers} | Following: {f.following}</p>

                                            <button
                                                className={`view-profile-button`}
                                                onClick={() => currentUser.uid === f.uid ? navigate('/dashboard') : navigate(`/user/${f.username}`)}
                                            >
                                                View profile
                                            </button>
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
                                    <p className="muted-center full-row">Not following anyone.</p>
                                ) : (
                                    followingData.map((f) => (
                                        <div key={f.uid} className="user-card">
                                            <img
                                                src={f.profilePicture}
                                                alt={f.username}
                                                onError={(e) => (e.target.src = '/profile.png')}
                                            />
                                            <h3>{f.username}</h3>
                                            <p>Followers: {f.followers} | Following: {f.following}</p>

                                            <button
                                                className={`view-profile-button`}
                                                onClick={() => currentUser.uid === f.uid ? navigate('/dashboard') : navigate(`/user/${f.username}`)}
                                            >
                                                View profile
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* Summary tab */}
                    {activeIndex === 4 && (
                        <div className="summary-container">
                            <h2 className="summary-title">About Me</h2>

                            {/* The time when this account was created*/}
                            <div className="summary-block-lg">
                                <strong>Member since:</strong> {profileUser.createdAt ? formatFirebaseTimestamp(profileUser.createdAt) : 'Unknown'}
                            </div>

                            {/* Account Type */}
                            <div className="summary-block-md">
                                <h3 className="summary-section-title">Account Type</h3>
                                <p className="summary-paragraph">
                                    {profileUser.accountType === 'individual' ? 'Individual' : 'Organization'} -
                                    {roles.find(role => role.value === profileUser.role)?.label || 'Other'}
                                </p>
                            </div>

                            {/* Bio */}
                            {profileUser.bio && (
                                <div className="summary-block-sm">
                                    <h3 className="summary-section-title">Bio</h3>
                                    <p className="summary-paragraph">{profileUser.bio}</p>
                                </div>
                            )}

                            {/* Social Media Links */}
                            {profileUser.links && profileUser.links.some(link => link.trim() !== '') && (
                                <div className="summary-block-sm">
                                    <h3 className="summary-section-title">Social Media Links</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {profileUser.links.map((link, index) => (
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

                            {/* Software Skills */}
                            {profileUser.skills && profileUser.skills.length > 0 && (
                                <div className="summary-block-sm">
                                    <h3 className="summary-section-title">Software Skills</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                        {profileUser.skills.map((skill, index) => (
                                            <span key={index} className="summary-skill">
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
                                    <p className="info-muted-italic">
                                        This user didn't add any information yet.
                                    </p>
                                )}
                        </div>
                    )}
                </section>
            </div>
            {!loading && (<div style={{ marginTop: '0rem', width: '100%' }}>
                <Footer />
            </div>)}
        </div>
    );
}

export default OtherDashboard;
