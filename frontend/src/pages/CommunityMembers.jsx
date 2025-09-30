import Header from '../UI+UX/Header.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getUserStats, getFollowers, getFollowing, getUsers, listenToUserStats, doFollowUser, doUnfollowUser } from '/backend/users.js';
import '/frontend/css/App.css'; 
import '/frontend/css/CommunityMembers.css'; 
import LoadingScreen from '../UI+UX/LoadingScreen.jsx';
function CommunityMembers() {
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

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getUsers();
                setUsersData(users);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
        
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

    if (loading) {
       return   <LoadingScreen />;
    }

    const filteredUsers = usersData.filter(f => f.uid !== user?.uid);

    return (
        <div className="comm-members-backgroundStyle">
            <Header />
            <CookiesBanner />
            <div className="comm-members-containerStyle">
                <h2 style={{ fontWeight: 'normal', color: 'gray', textAlign: 'center', width: '100%' }}>Users</h2>
                <div className="responsive-grid">
                    {filteredUsers.length === 0 ? (
                        <p style={{ textAlign: "center", fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: "gray", gridColumn: "1 / -1" }}>No other users yet.</p>
                    ) : (
                        filteredUsers.map((f) => (
                            <div key={f.uid} className="user-card">
                                <img
                                    onClick={() => window.location.href = `/user/${f.username}`}
                                    src={f.profilePicture}
                                    alt={f.username}
                                    onError={(e) => (e.target.src = "profile.png")}
                                />
                                <h3>{f.username}</h3>
                                <p style={{fontSize:'0.7rem'}}>Followers: {f.followers} | Following: {f.following}</p>
                                <button
                                    className={`follow-button ${user && userStats.followingList.includes(f.uid) ? 'unfollow' : 'follow'}`}
                                    onClick={async () => {
                                        if (!user) navigate('/login');
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
                                                const followers = await getFollowers(user.uid);
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
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default CommunityMembers;