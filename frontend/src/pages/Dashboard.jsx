import Header from '../UI+UX/Header.jsx';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
    getUserStats, getFollowers, getFollowing, listenToUserStats, doFollowUser, doUnfollowUser, doUpdateProfilePicture,
    updateUsername, updateUserData
} from '/backend/users.js';

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
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.5rem",
    width: "100vw",
    padding: "0 2rem",
    boxSizing: "border-box",
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
        profilePicture: "profile.png",
        username: "",
        bio: "",
        accountType: "individual",
        role: "other",
        links: ["", "", "", ""],
        skills: []
    }); //for user stats and profile picture display
    const [loading, setLoading] = useState(true); //loading state for user stats
    const [followersData, setFollowersData] = useState([]); //data for followers
    const [followingData, setFollowingData] = useState([]); //data for following users
    const [selectedSkills, setSelectedSkills] = useState([]);

    const [availableSkills] = useState([
        "Blender", "Cinema4d", "AutoCAD", "ArhiCAD", "Maya",
        "3ds Max", "ZBrush", "Substance Painter", "Photoshop",
        "Godot", "Unity", "Unreal Engine"
    ]);
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState('individual'); // Account type state
    // Individual role options
    const individualRoles = [
        { value: 'other', label: 'Other' },
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
                    setUsername(stats.username);
                    setSelectedSkills(stats.skills||[])
                    setLoading(false);
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
                    profilePicture: "profile.png",
                    username: "",
                    bio: "",
                    accountType: "individual",
                    role: "other",
                    links: ["", "", "", ""],
                    skills: []
                })
                setSelectedSkills([]);
                setLoading(false);
                navigate('/');

            }
        });
        return () => unsubscribe();
    }, [navigate]);
    const toggleSkill = (skill) => {
        setSelectedSkills(prev => {
            if (prev.includes(skill)) {
                return prev.filter(s => s !== skill);
            } else {
                return [...prev, skill];
            }
        });
    };
    const handleSaveProfile = async () => {
        try {
            if (!user) throw new Error('No user is signed in');

            const updatedData = {
                username: userStats.username,
                bio: userStats.bio,
                accountType: userStats.accountType,
                role: userStats.role,
                links: userStats.links,
                skills: selectedSkills
            };

            const result = await updateUserData(user.uid, updatedData);

            if (result.success) {
                alert('Profile updated successfully!');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error: ' + error.message);
        }
    };
    return (
        <div style={backgroundStyle}>
            <Header />
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <button
                            onClick={() => setActiveIndex(4)}
                            style={buttonStyle}>Edit</button>
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

                    {/* Tab content 1 - Your Work*/}
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

                    {/* Tab content 2- Favourites*/}
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
                                    <p style={{ textAlign: "center", fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: "gray" }}>No followers yet.</p>
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
                                    <p style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: 'gray' }}>You're not following anyone.</p>
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
                    {/* Edit profile content */}
                    {activeIndex == 4 && (
                        <div
                            style={{
                                marginTop: '3rem',
                                backgroundColor: 'white',
                                minWidth: '300px',
                                width: '77%',
                                maxWidth: '700px',
                                fontFamily: 'Arial, sans-serif',
                                padding: '2rem',
                                borderRadius: '15px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'left',
                                justifyContent: 'flex-start',
                                marginLeft: 'auto',
                                marginRight: '4rem'
                            }}
                        >
                            {/* Profile picture with overlay */}
                            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                                <img
                                    style={imageStyle}
                                    src={userStats.profilePicture}
                                    alt="Profile"
                                    onError={(e) => { e.target.src = "profile.png"; }}
                                />

                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        opacity: 0,
                                        transition: 'opacity 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                                    onClick={() => document.getElementById('profilePictureInput').click()}
                                >
                                    <p style={{ color: 'white', fontSize: '12px', textAlign: 'center' }}>
                                        Change profile pic.
                                    </p>
                                </div>
                            </div>

                            {/* Hidden input for profile picture upload */}
                            <input
                                id="profilePictureInput"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        try {
                                            if (file.size > 5 * 1024 * 1024) {
                                                alert('The maximum size allowed is 5MB.');
                                                return;
                                            }
                                            if (!file.type.startsWith('image/')) {
                                                alert('Select only image files.');
                                                return;
                                            }

                                            const result = await doUpdateProfilePicture(file);
                                            if (result.success) {
                                                alert('Profile picture changed successfully!');
                                            }
                                            else {
                                                alert('Error: ' + result.message);
                                            }
                                        } catch (error) {
                                            console.error('Error at upload:', error);
                                            alert('Error: ' + error.message);
                                        }
                                    }
                                }}
                            />

                            {/* Username input + button */}
                            <div style={{ marginTop: '1.5rem', textAlign: 'left', width: '100%' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <label
                                        style={{
                                            color: 'black',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        Username:
                                    </label>
                                    <input
                                        type="text"
                                        value={userStats.username}
                                        onChange={(e) => setUserStats(prev => ({ ...prev, username: e.target.value }))}
                                        style={{
                                            padding: '0.5rem',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            width: '400px'
                                        }}
                                    />



                                </div>
                                {/* Account type selection */}
                                <div style={{ marginTop: '1.5rem', textAlign: 'left', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label
                                            style={{ color: 'black', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                        >
                                            Account type:
                                        </label>

                                        <select
                                            value={userStats.accountType}
                                            onChange={(e) => {
                                                setUserStats(prev => ({ ...prev, accountType: e.target.value }));
                                                setAccountType(e.target.value);
                                            }}
                                            style={{
                                                padding: '0.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                width: '40%',
                                            }}
                                        >
                                            <option value="individual">Individual</option>
                                            <option value="organization">Organization</option>
                                        </select>

                                        <select
                                            value={userStats.role}
                                            onChange={(e) => setUserStats(prev => ({ ...prev, role: e.target.value }))}
                                            style={{
                                                padding: '0.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                width: '40%',
                                            }}
                                        >
                                            {roles.map((role) => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {/* Bio  */}
                                <div style={{ marginTop: '1.5rem', textAlign: 'left', width: '100%' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: 'black',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Bio:
                                    </label>

                                    <textarea
                                        value={userStats.bio}
                                        onChange={(e) => setUserStats(prev => ({ ...prev, bio: e.target.value }))}
                                        maxLength={300}
                                        rows={5}
                                        style={{
                                            width: '80%',
                                            padding: '0.5rem',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            resize: 'vertical',
                                            fontFamily: 'Arial, sans-serif',
                                            fontSize: '0.9rem'
                                        }}
                                        placeholder="Write something about yourself..."
                                    />
                                </div>
                                {/* Social media links */}
                                <div style={{ marginTop: '1.5rem', textAlign: 'left', width: '100%' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: 'black',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Social media links:
                                    </label>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '80%' }}>
                                        {userStats.links.map((link, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                value={link}
                                                onChange={(e) => {
                                                    const newLinks = [...userStats.links];
                                                    newLinks[index] = e.target.value;
                                                    setUserStats(prev => ({ ...prev, links: newLinks }));
                                                }}
                                                placeholder={`Link ${index + 1}`}
                                                style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* Software skills */}
                                <div style={{ marginTop: '1.5rem', textAlign: 'left', width: '100%' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: 'black',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Software skills:
                                    </label>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '80%' }}>
                                        {selectedSkills.map((skill) => (
                                            <div
                                                key={skill}
                                                onClick={() => toggleSkill(skill)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    border: '1px solid #ccc',
                                                    backgroundColor: 'white',
                                                    color: 'black',
                                                    borderRadius: '15px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                {skill} ×
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Software skills - Available */}
                                <div style={{ marginTop: '1.5rem', textAlign: 'left', width: '100%' }}>
                                    
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '80%' }}>
                                        {availableSkills.filter(skill => !selectedSkills.includes(skill)).map((skill) => (
                                            <div
                                                key={skill}
                                                onClick={() => toggleSkill(skill)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    border: 'none',
                                                    backgroundColor: '#c5c5c5ff',
                                                    color: 'black',
                                                    borderRadius: '15px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                {skill}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Save button */}
                                <button
                                    onClick={handleSaveProfile}
                                    style={{
                                        padding: '1rem 2rem',
                                        marginTop: '3rem',
                                        backgroundColor: '#eb8d00ff',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        border: 'none',
                                        display: 'flex',
                                        justifySelf: 'center',
                                        fontSize: '1.25rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    SAVE PROFILE
                                </button>
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </div>


    );
}

export default Dashboard;
