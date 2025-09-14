import Header from '../UI+UX/Header.jsx';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getUserStats, getFollowers, getFollowing, listenToUserStats, doFollowUser, doUnfollowUser } from '/backend/users.js';

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

//Profile picture style
const imageStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
};

//Username style
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
//Style for followers and following texts
const followersStyle = {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    fontSize: '0.7rem',
    marginTop: '0.5rem',
    cursor: 'pointer',
};
//Style for the users cards
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
//Style for grid display of users
const followerGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginTop: "2rem",
};

function Dashboard() {

    const [user, setUser] = useState(null); //for verifying if the user is logged or not
    const [username, setUsername] = useState(""); //for username display
    const [activeIndex, setActiveIndex] = useState(0); //for navigation buttons
    const [userStats, setUserStats] = useState({
        followers: 0,
        following: 0,
        followersList: [],
        followingList: [],
        profilePicture: ""
    }); //for user stats and profile picture display
    const [loading, setLoading] = useState(true); //loading state for user stats
    const [followersData, setFollowersData] = useState([]); //data for followers
    const [followingData, setFollowingData] = useState([]); //data for following users

    const navigate = useNavigate();

    //Effect for check authentification and fetch user data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                //user logged in
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

                //listen to real-time user stats updates
                const stopListening = listenToUserStats(currentUser.uid, async (stats) => {
                    setUserStats(stats);

                    //fetch followers and following lists
                    const followers = await getFollowers(currentUser.uid);
                    setFollowersData(followers);

                    const followings = await getFollowing(currentUser.uid);
                    setFollowingData(followings);
                });
                //Clean up listener on unmount
                return () => stopListening();
            } else {
                //user logged out
                setUser(null);
                setUsername("");
                setUserStats({
                    followers: 0,
                    following: 0,
                    followersList: [],
                    followingList: [],
                    profilePicture: ""
                })
                setLoading(false);
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
                <img style={imageStyle} src={userStats.profilePicture || "profile.png"} alt="Profile"
                    onError={(e) => {
                        e.target.src = "profile.png";
                    }}
                />
                {/* Username, edit button, followers/following */}
                <div style={textContainerStyle}>
                    <p style={usernameStyle}>{username}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <button style={buttonStyle}>Edit</button>
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

                    {/* Tab content 1*/}
                    {activeIndex == 0 && (<h2
                        style={{
                            fontFamily: "Arial, sans-serif",

                            color: 'gray',
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            fontWeight: 'normal',
                        }}
                    >
                        Models:0
                    </h2>)}
                    {activeIndex == 0 && (<img src="3d-model.png"
                        style={{
                            width: '150px',
                            marginTop: '7rem',
                            display: 'flex',
                            alignSelf: 'center',
                            filter: 'invert(1) brightness(50%)'

                        }}
                    />

                    )}
                    {activeIndex == 0 && (<h2
                        style={{
                            fontFamily: "Arial, sans-serif",

                            color: 'gray',
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            fontWeight: 'normal',
                        }}
                    >
                        "Your Work" will show you all your models.
                    </h2>)}
                    {activeIndex == 0 && (<h2
                        style={{
                            fontFamily: "Arial, sans-serif",
                            marginTop: '0rem',
                            color: 'gray',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                        }}
                    >
                        You don't have models uploaded at the moment.
                    </h2>)}

                    {/* Tab content 2*/}
                    {activeIndex == 1 && (<img src="bookmark-star_2.png"
                        style={{
                            width: '150px',
                            marginTop: '7rem',
                            display: 'flex',
                            alignSelf: 'center',
                            filter: 'invert(1) brightness(50%)'

                        }}
                    />

                    )}
                    {activeIndex == 1 && (<h2
                        style={{
                            fontFamily: "Arial, sans-serif",

                            color: 'gray',
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            fontWeight: 'normal',
                        }}
                    >
                        "Favourites" will show you the models added to the favourite list.
                    </h2>)}
                    {activeIndex == 1 && (<h2
                        style={{
                            fontFamily: "Arial, sans-serif",

                            color: 'gray',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                        }}
                    >
                        You don't have models at favourites at the moment.
                    </h2>)}
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
                                    <p style={{ textAlign: "center", fontFamily:'Arial, sans-serif', fontWeight:'bold', color: "gray" }}>No followers yet.</p>
                                ) : (
                                    followersData.map((f) => (
                                        <div key={f.uid} style={followerCardStyle}>
                                            <img
                                                src={f.profilePicture}
                                                alt={f.username}
                                                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                                                onError={(e) => (e.target.src = "profile.png")}
                                            />
                                            <h3 style={{ margin: "0.5rem 0" }}>{f.username}</h3>
                                            <p style={{ margin: 0, fontSize: "0.8rem", color: "gray" }}>
                                                Followers: {f.followers} | Following: {f.following}
                                            </p>

                                            {/* Follow/Unfollow button*/}
                                            {user && (
                                                <button
                                                    style={{
                                                        marginTop: "0.5rem",
                                                        padding: "0.3rem 0.7rem",
                                                        borderRadius: "5px",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        backgroundColor: userStats.followingList.includes(f.uid) ? "red" : "#575757",
                                                        color: "white",
                                                        fontWeight: "bold",
                                                    }}
                                                    onClick={async () => {
                                                        try {
                                                            let result;
                                                            if (userStats.followingList.includes(f.uid)) {
                                                                result = await doUnfollowUser(f.uid);
                                                            } else {
                                                                result = await doFollowUser(f.uid);
                                                            }
                                                            if (result.succes) {
                                                                //Update following list
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
                            <div style={followerGridStyle}>
                                {followingData.length === 0 ? (
                                    <p style={{ textAlign: 'center',  fontFamily:'Arial, sans-serif', fontWeight:'bold', color: 'gray' }}>You're not following anyone.</p>
                                ) : (
                                    followingData.map((f) => (
                                        <div key={f.uid} style={followerCardStyle}>
                                            <img
                                                src={f.profilePicture}
                                                alt={f.username}
                                                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                                                onError={(e) => (e.target.src = "profile.png")}
                                            />
                                            <h3 style={{ margin: "0.5rem 0" }}>{f.username}</h3>
                                            <p style={{ margin: 0, fontSize: "0.8rem", color: "gray" }}>
                                                Followers: {f.followers} | Following: {f.following}
                                            </p>
                                            
                                            {/* Follow/Unfollow button*/}
                                            {user && (
                                                <button style={{
                                                    marginTop: "0.5rem",
                                                    padding: "0.3rem 0.7rem",
                                                    borderRadius: "5px",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    backgroundColor: userStats.followingList.includes(f.uid) ? "red" : "#575757",
                                                    color: "white",
                                                    fontWeight: "bold",
                                                }}
                                                    onClick={
                                                        async () => {
                                                            try {
                                                                let result;
                                                                if (userStats.followingList.includes(f.uid)) {
                                                                    result = await doUnfollowUser(f.uid);
                                                                } else {
                                                                    result = await doFollowUser(f.uid);
                                                                }
                                                                if (result.succes) {
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
                                                        }
                                                    }
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
                </section>

            </div>
        </div>


    );
}

export default Dashboard;
