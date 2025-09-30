import Header from '../UI+UX/Header.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getUserStats, getFollowers, getFollowing, getUsers, listenToUserStats, doFollowUser, doUnfollowUser } from '/backend/users.js';
import '/frontend/css/App.css'; 
import '/frontend/css/CommunityMembers.css'; 
import LoadingScreen from '../UI+UX/LoadingScreen.jsx';

function CommunityMembers() {
    // State management for user data and authentication
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);
    const [usersData, setUsersData] = useState([]);
    const [userStats, setUserStats] = useState({
        followers: 0,
        following: 0,
        followersList: [],
        followingList: [],
        profilePicture: ""
    });
    const [followersData, setFollowersData] = useState([]);
    const [followingData, setFollowingData] = useState([]);
    const navigate = useNavigate();

    // Fetches the latest public models for a given user
    const fetchUserModels = async (userId) => {
        try {
            // Query to get user's public models from Firestore
            const modelsQuery = query(
                collection(db, "models"),
                where("creatorUID", "==", userId),
                where("isPublic", "==", true)
            );
            const snapshot = await getDocs(modelsQuery);
            const models = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort models by creation date (newest first) and return first 2
            return models
                .sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                    return dateB - dateA;
                })
                .slice(0, 2);
        } catch (error) {
            console.error("Error fetching user models:", error);
            return [];
        }
    };

    // Main useEffect for data initialization
    useEffect(() => {
        // Fetches all users and their data including models, bio, and skills
        const fetchUsers = async () => {
            try {
                const users = await getUsers();
                
                // Enhance each user data with models, bio, and skills
                const usersWithModels = await Promise.all(
                    users.map(async (userData) => {
                        const models = await fetchUserModels(userData.uid);
                        
                        // Get additional user profile data from Firestore
                        const userDocRef = doc(db, "users", userData.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        const fullUserData = userDocSnap.exists() ? userDocSnap.data() : {};
                        
                        return {
                            ...userData,
                            models: models,
                            bio: fullUserData.bio || "",
                            skills: fullUserData.skills || []
                        };
                    })
                );
                
                setUsersData(usersWithModels);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
        
        // Authentication state listener
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    // Get current user's profile data
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUsername(userData.username || userData.email);
                    }
                    
                    // Set up real-time listener for user stats (followers/following)
                    const stopListening = listenToUserStats(currentUser.uid, async (stats) => {
                        setUserStats(stats);
                        const followers = await getFollowers(currentUser.uid);
                        setFollowersData(followers);

                        const followings = await getFollowing(currentUser.uid);
                        setFollowingData(followings);

                        setLoading(false);
                    });

                    return () => stopListening();
                } catch (error) {
                    console.error("Error getting user data:", error);
                    setLoading(false);
                }
            } else {
                // Reset state if user is not authenticated
                setUser(null);
                setUsername("");
                setUserStats({
                    followers: 0,
                    following: 0,
                    followersList: [],
                    followingList: [],
                    profilePicture: ""
                });
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Show loading screen while data is being fetched
    if (loading) {
       return <LoadingScreen />;
    }

    // Sort users by follower count and take top 50
    const filteredUsers = usersData
        .sort((a, b) => b.followers - a.followers)
        .slice(0, 50);

    return (
        <div className="comm-members-backgroundStyle">
            <Header />
            <CookiesBanner />
            <div className="comm-members-containerStyle">
                {/* Page header section */}
                <div className="page-header">
                    <h1 className="page-title">Most Popular Creators</h1>
                    <p className="page-description">Discover and connect with the most followed creators in our community</p>
                </div>
                
                {/* Creators grid layout */}
                <div className="creators-grid">
                    {filteredUsers.length === 0 ? (
                        <p className="no-users-message">No other users yet.</p>
                    ) : (
                        // Map through filtered users and create creator cards
                        filteredUsers.map((creator) => (
                            <div key={creator.uid} className="creator-card">
                                {/* Creator avatar with fallback image */}
                                <img
                                    className="comm-creator-avatar"
                                    src={creator.profilePicture}
                                    alt={creator.username}
                                    onError={(e) => (e.target.src = "profile.png")}
                                />
                                
                                <div className="creator-header">
                                    <div className="creator-info">
                                        {/* Creator username */}
                                        <h3 className="creator-name">
                                            {creator.username}
                                        </h3>
                                        {/* Follower/Following stats */}
                                        <div className="creator-stats">
                                            <span>{creator.followers} Followers</span>
                                            <span className="stat-separator">•</span>
                                            <span>{creator.following} Following</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills section - shows up to 3 skills */}
                                {creator.skills && creator.skills.length > 0 && (
                                    <div className="creator-skills">
                                        {creator.skills.slice(0, 3).map((skill, index) => (
                                            <span key={index} className="skill-tag">{skill}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Bio section */}
                                {creator.bio && (
                                    <p className="creator-bio">{creator.bio}</p>
                                )}

                                {/* Latest models preview - shows up to 2 models */}
                                {creator.models && creator.models.length > 0 && (
                                    <div className="creator-models">
                                        {creator.models.map((model) => (
                                            <div 
                                                key={model.id} 
                                                className="model-thumbnail"
                                            >
                                                <img
                                                    src={model.previewImages?.[0] || 'placeholder.png'}
                                                    alt={model.title}
                                                    onError={(e) => (e.target.src = 'placeholder.png')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* View Profile button - navigates to user's profile or dashboard */}
                                <button
                                    className="creator-visit-button"
                                    onClick={() => creator.uid !== user?.uid ? 
                                        window.location.href = `/user/${creator.username}` : 
                                        window.location.href='/dashboard'}
                                >
                                    View Profile
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default CommunityMembers;