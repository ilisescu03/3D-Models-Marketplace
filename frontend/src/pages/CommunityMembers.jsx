import Header from '../UI+UX/Header.jsx';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getUserStats, getFollowers, getFollowing, getUsers, listenToUserStats, doFollowUser, doUnfollowUser } from '/backend/users.js';
// Background style for the page
const backgroundStyle = {
    backgroundColor: "rgba(238, 238, 238, 1)",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: "100vh",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
};
// Style for individual user cards
const userCardStyle = {
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
// Style for the grid layout of users
const usersGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.5rem",
    width: "98vw",
    padding: "2rem 2rem",
    boxSizing: "border-box",
};
// Container style for the main content area
const containerStyle = {
    marginTop: '6rem',
    padding: '3rem',
    fontSize: '1.5rem',
    fontFamily: 'Manrope, system-ui',
    width: '100%',
    boxSizing: 'border-box',
};

function CommunityMembers() {
    const [user, setUser] = useState(null); // Current authenticated user
    const [username, setUsername] = useState(""); // Username of current user
    const [loading, setLoading] = useState(true);  // Loading state
    const [usersData, setUsersData] = useState([]);  // List of all users
    const [userStats, setUserStats] = useState({
        followers: 0,
        following: 0,
        followersList: [],
        followingList: [],
        profilePicture: ""
    });
    const [followersData, setFollowersData] = useState([]); // Followers data
    const [followingData, setFollowingData] = useState([]);  // Following data
    const navigate = useNavigate(); // Navigation hook

    useEffect(() => {
        // Fetch all users from the database
        const fetchUsers = async () => {
            try {
                const users = await getUsers();
                setUsersData(users);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
        // Listen for authentication state changes
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
                    // Set up real-time listener for user stats
                    const stopListening = listenToUserStats(currentUser.uid, async (stats) => {
                        setUserStats(stats);
                        // Fetch followers and following data
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
                // User is not authenticated
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
    // Show loading state while data is being fetched
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

    // Filter out the current user from the users list
    const filteredUsers = usersData.filter(f => f.uid !== user?.uid);

    return (
        <div style={backgroundStyle}>
            <Header />
            <div style={containerStyle}>
                <h2 style={{ fontWeight: 'normal', color: 'gray' }}>Users</h2>
                <div style={usersGridStyle}>
                    {/* Users display */}
                    {filteredUsers.length === 0 ? (
                        <p style={{ textAlign: "center", fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: "gray" }}>No other users yet.</p>
                    ) : (
                        filteredUsers.map((f) => (
                            <div key={f.uid} style={userCardStyle}>
                                <img
                                    onClick={() => window.location.href = `/user/${f.username}`}
                                    src={f.profilePicture}
                                    alt={f.username}
                                    style={{ width: "80px", height: "80px", cursor: 'pointer', borderRadius: "50%", objectFit: "cover" }}
                                    onError={(e) => (e.target.src = "profile.png")}
                                />
                                <h3 style={{ margin: "0.5rem 0" }}>{f.username}</h3>
                                <p style={{ margin: 0, fontSize: "0.8rem", color: "gray" }}>
                                    Followers: {f.followers} | Following: {f.following}
                                </p>
                                {/* Follow/Unfollow button */}
                                <button
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = user && userStats.followingList.includes(f.uid) ? "#a70000ff" : "#2b2b2bff";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = user && userStats.followingList.includes(f.uid) ? "red" : "#575757";
                                    }}
                                    style={{
                                        transition:'0.3s ease',
                                        marginTop: "0.5rem",
                                        padding: "0.3rem 0.7rem",
                                        borderRadius: "5px",
                                        border: "none",
                                        cursor: "pointer",
                                        backgroundColor: user && userStats.followingList.includes(f.uid) ? "red" : "#575757",
                                        color: "white",
                                        fontWeight: "bold",
                                    }}
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