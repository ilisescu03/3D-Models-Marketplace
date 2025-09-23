import Header from '../UI+UX/Header.jsx';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { CookieService } from '/backend/cookies.js';
import { doc, getDoc } from 'firebase/firestore';
import {
    getUserStats, getFollowers, getFollowing, listenToUserStats, doFollowUser, doUnfollowUser, doUpdateProfilePicture,
    updateUsername, doChangePassword, updateUserData, doDeleteUserAccount
} from '/backend/users.js';
import CookiesBanner from '../UI+UX/CookiesBanner';

// Profile picture style
const imageStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
};

// Background style for the entire page
const backgroundStyle = {
    background: '#eee',
    minHeight: "100vh",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
};

// Style for tab buttons with active state
const getTabButtonStyle = (isActive) => ({
    height: '35px',
    minWidth: '100px',
    cursor: 'pointer',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: isActive ? '#e99700ff' : 'transparent',
    color: isActive ? 'white' : 'black',
    fontWeight: 'bold',
    margin: '0.5rem 0',
    width: '100%',
    textAlign: 'left',
    padding: '0 1rem',
});
const getDeleteTabButtonStyle = (isActive) => ({
    height: '35px',
    minWidth: '100px',
    cursor: 'pointer',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: isActive ? '#e70000ff' : 'transparent',
    color: isActive ? 'white' : 'black',
    fontWeight: 'bold',
    margin: '0.5rem 0',
    width: '100%',
    textAlign: 'left',
    padding: '0 1rem',
});
// Main container style
const containerStyle = {
    width: '100%',
    maxWidth: '1200px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
};

// Wrapper for content area
const contentWrapperStyle = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '2rem',
};

// Layout style for mobile devices (single column)
const mobileLayoutStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '2rem',
};

// Layout style for desktop devices (two columns)
const desktopLayoutStyle = {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    gap: '2rem',
};

// Style for tab content area
const tabContentStyle = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
};

function Settings() {
    const [userProvider, setUserProvider] = useState('password');
    const [isGoogleUser, setIsGoogleUser] = useState(false);

    // State for current authenticated user
    const [user, setUser] = useState(null);
    // State for username
    const [username, setUsername] = useState("");
    // State for active tab selection
    const [activeTab, setActiveTab] = useState('profile');
    // State for user statistics and profile data
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
    // State for loading status
    const [loading, setLoading] = useState(true);
    // State for selected skills
    const [selectedSkills, setSelectedSkills] = useState([]);
    // State for password change form data
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    // State for password change error messages
    const [passwordError, setPasswordError] = useState("");
    // State for password change success messages
    const [passwordSuccess, setPasswordSuccess] = useState("");
    // State to track if device is mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleteSuccess, setDeleteSuccess] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Style for tabs container that adapts to mobile/desktop
    const tabsContainerStyle = {
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        width: '100%',
        maxWidth: isMobile ? '100%' : '250px',
        justifyContent: isMobile ? 'center' : 'flex-start',
        gap: '0.5rem',
    };

    // Available skills for selection
    const [availableSkills] = useState([
        "Blender", "Cinema4d", "AutoCAD", "ArhiCAD", "Maya",
        "3ds Max", "ZBrush", "Substance Painter", "Photoshop",
        "Godot", "Unity", "Unreal Engine"
    ]);
    // State for account type (individual/organization)
    const [accountType, setAccountType] = useState('individual');

    // Role options for individual accounts
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

    // Role options for organization accounts
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
    // Navigation hook
    const navigate = useNavigate();

    // Effect to handle window resize for responsive layout
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect to check authentication and fetch user data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const provider = currentUser.providerData[0]?.providerId;
                setUserProvider(provider);
                setIsGoogleUser(provider === 'google.com');

                try {
                    // Get user document from Firestore
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUsername(userData.username || userData.email);
                    }
                } catch (error) {
                    console.error("Error getting user data:", error);
                }

                // Listen to real-time updates of user stats
                const stopListening = listenToUserStats(currentUser.uid, async (stats) => {
                    setUserStats(stats);
                    setUsername(stats.username);
                    setSelectedSkills(stats.skills || [])
                    setAccountType(stats.accountType || "individual");
                    setLoading(false);
                });
                return () => stopListening();
            } else {
                // Reset all states if user is not authenticated
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
                setSelectedSkills([]);
                setLoading(false);
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);
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
    // Function to toggle skill selection
    const toggleSkill = (skill) => {
        setSelectedSkills(prev => {
            if (prev.includes(skill)) {
                return prev.filter(s => s !== skill);
            } else {
                return [...prev, skill];
            }
        });
    };

    // Function to handle profile save
    const handleSaveProfile = async () => {
        try {
            if (!user) throw new Error('No user is signed in');

            // Prepare updated data
            const updatedData = {
                username: userStats.username,
                bio: userStats.bio,
                accountType: userStats.accountType,
                role: userStats.role || 'other',
                links: userStats.links,
                skills: selectedSkills
            };

            // Update user data in backend
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

    // Function to handle password change
    const handlePasswordChange = async () => {
        setPasswordError("");
        setPasswordSuccess("");

        //Validate empty fields
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError("All fields are required.");
            return;
        }
        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }

        try {
            // Call the backend functin for password change
            const result = await doChangePassword(passwordData.currentPassword, passwordData.newPassword);

            if (result.success) {
                setPasswordSuccess(result.message);
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
            } else {
                setPasswordError(result.message);
            }
        } catch (error) {
            setPasswordError(error.message || "An unexpected error occurred.");
        }

    };
    //Delete account
    const handleDeleteAccount = async () => {
        setDeleteError("");
        setDeleteSuccess("");
        setIsDeleting(true);

        if (!isGoogleUser && !deletePassword) {
            setDeleteError("Please enter your password to confirm account deletion.");
            setIsDeleting(false);
            return;
        }

        try {
            const result = await doDeleteUserAccount(isGoogleUser ? null : deletePassword);

            if (result.success) {
                setDeleteSuccess(result.message);
                // Succes and redirect to home page
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                setDeleteError(result.message);



            }
        } catch (error) {
            setDeleteError(error.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };
    return (
        <div style={backgroundStyle}>
            <Header />
            <CookiesBanner />
            <div style={containerStyle}>
                <h1 style={{ fontFamily: 'Arial, sans-serif', color: '#333', marginBottom: '2rem' }}>
                    Settings
                </h1>

                <div style={contentWrapperStyle}>
                    {/* Main content layout - changes based on screen size */}
                    <div style={isMobile ? mobileLayoutStyle : desktopLayoutStyle}>

                        {/* Navigation tabs - always displayed */}
                        <div style={tabsContainerStyle}>
                            <button
                                onClick={() => setActiveTab('profile')}
                                style={getTabButtonStyle(activeTab === 'profile')}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                style={getTabButtonStyle(activeTab === 'password')}
                            >
                                Password
                            </button>
                            <button
                                onClick={() => setActiveTab('payment')}
                                style={getTabButtonStyle(activeTab === 'payment')}
                            >
                                Payment
                            </button>
                            <button
                                onClick={() => setActiveTab('account')}
                                style={getTabButtonStyle(activeTab === 'account')}
                            >
                                Account
                            </button>
                            <button
                                onClick={() => setActiveTab('cookies')}
                                style={getTabButtonStyle(activeTab === 'cookies')}
                            >
                                Cookies
                            </button>
                            <button
                                onClick={() => setActiveTab('delete')}
                                style={getDeleteTabButtonStyle(activeTab === 'delete')}
                            >
                                Delete Account
                            </button>
                        </div>

                        {/* Tab content */}
                        <div style={tabContentStyle}>
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div
                                    style={{
                                        backgroundColor: 'white',
                                        width: '100%',
                                        maxWidth: '700px',
                                        fontFamily: 'Arial, sans-serif',
                                        padding: '2rem',
                                        borderRadius: '15px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
                                                    // Validate file size
                                                    if (file.size > 5 * 1024 * 1024) {
                                                        alert('The maximum size allowed is 5MB.');
                                                        return;
                                                    }
                                                    // Validate file type
                                                    if (!file.type.startsWith('image/')) {
                                                        alert('Select only image files.');
                                                        return;
                                                    }

                                                    // Upload profile picture
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

                                    {/* Username input */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: 'black', fontWeight: 'bold' }}>
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
                                                    width: '100%'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Account type selection */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: 'black', fontWeight: 'bold' }}>
                                                Account type:
                                            </label>
                                            <select
                                                value={userStats.accountType}
                                                onChange={(e) => {
                                                    const newAccountType = e.target.value;
                                                    setUserStats(prev => ({
                                                        ...prev,
                                                        accountType: newAccountType,
                                                        role: "other" // Reset role to default value
                                                    }));
                                                    setAccountType(newAccountType);
                                                }}
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    width: '100%',
                                                }}
                                            >
                                                <option value="individual">Individual</option>
                                                <option value="organization">Organization</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Role selection */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: 'black', fontWeight: 'bold' }}>
                                                Role:
                                            </label>
                                            <select
                                                value={userStats.role}
                                                onChange={(e) => setUserStats(prev => ({ ...prev, role: e.target.value }))}
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid ',
                                                    borderRadius: '4px',
                                                    width: '100%',
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

                                    {/* Bio */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: 'black', fontWeight: 'bold' }}>
                                                Bio:
                                            </label>
                                            <textarea
                                                value={userStats.bio}
                                                onChange={(e) => setUserStats(prev => ({ ...prev, bio: e.target.value }))}
                                                maxLength={300}
                                                rows={5}
                                                style={{
                                                    width: '100%',
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
                                    </div>

                                    {/* Social media links */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: 'black', fontWeight: 'bold' }}>
                                                Social media links:
                                            </label>
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
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ color: 'black', fontWeight: 'bold' }}>
                                                Software skills:
                                            </label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {selectedSkills.map((skill) => (
                                                    <div
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#e2e2e2ff';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'white';
                                                        }}
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
                                                            userSelect: 'none',
                                                            transition: '0.3s ease'
                                                        }}
                                                    >
                                                        {skill} ×
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Available Software skills */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {availableSkills.filter(skill => !selectedSkills.includes(skill)).map((skill) => (
                                                    <div
                                                        key={skill}
                                                        onClick={() => toggleSkill(skill)}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#7a7a7aff';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#c5c5c5ff';
                                                        }}
                                                        style={{
                                                            padding: '0.4rem 0.8rem',
                                                            border: 'none',
                                                            backgroundColor: '#c5c5c5ff',
                                                            color: 'black',
                                                            borderRadius: '15px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            userSelect: 'none',
                                                            transition: '0.3s ease'
                                                        }}
                                                    >
                                                        {skill}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save button */}
                                    <button
                                        onClick={handleSaveProfile}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#b16a00ff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#eb8d00ff';
                                        }}
                                        style={{
                                            padding: '1rem 2rem',
                                            marginTop: '3rem',
                                            backgroundColor: '#eb8d00ff',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '1.25rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: '0.3s ease',
                                            width: '100%'
                                        }}
                                    >
                                        SAVE PROFILE
                                    </button>
                                </div>
                            )}

                            {/* Password Tab */}
                            {activeTab === 'password' && (
                                <div
                                    style={{
                                        backgroundColor: 'white',
                                        width: '100%',
                                        maxWidth: '500px',
                                        fontFamily: 'Arial, sans-serif',
                                        padding: '2rem',
                                        borderRadius: '15px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Change Password</h2>

                                    {passwordError && (
                                        <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffeeee', borderRadius: '4px' }}>
                                            {passwordError}
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div style={{ color: 'green', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#eeffee', borderRadius: '4px' }}>
                                            {passwordSuccess}
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                            Current Password:
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            style={{
                                                padding: '0.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                width: '100%'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                            New Password:
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            style={{
                                                padding: '0.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                width: '100%'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                            Confirm New Password:
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            style={{
                                                padding: '0.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                width: '100%'
                                            }}
                                        />
                                    </div>

                                    <button

                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#b16a00ff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#eb8d00ff';
                                        }}
                                        onClick={handlePasswordChange}
                                        style={{
                                            transition: '0.3s ease',
                                            padding: '0.7rem 1.5rem',
                                            backgroundColor: '#eb8d00ff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            width: '100%'
                                        }}
                                    >
                                        Change Password
                                    </button>
                                </div>
                            )}

                            {/* Payment Tab */}
                            {activeTab === 'payment' && (
                                <div
                                    style={{
                                        backgroundColor: 'white',
                                        width: '100%',
                                        maxWidth: '500px',
                                        fontFamily: 'Arial, sans-serif',
                                        padding: '2rem',
                                        borderRadius: '15px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        textAlign: 'center'
                                    }}
                                >
                                    <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Payment Agreement</h2>
                                    <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                        This is where you can manage your payment settings and agreements.
                                        In the future, you'll be able to add payment methods, view billing history,
                                        and manage subscriptions here.
                                    </p>
                                    <button
                                        style={{
                                            padding: '0.7rem 1.5rem',
                                            backgroundColor: '#eb8d00ff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Manage Payment Methods
                                    </button>
                                </div>
                            )}

                            {/* Account Tab */}
                            {activeTab === 'account' && (
                                <div
                                    style={{
                                        backgroundColor: 'white',
                                        width: '100%',
                                        maxWidth: '500px',
                                        fontFamily: 'Arial, sans-serif',
                                        padding: '2rem',
                                        borderRadius: '15px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Account Information</h2>
                                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                        <strong>Email:</strong> {user?.email || 'Not available'}
                                    </div>
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                        <strong>Member since:</strong> {userStats.createdAt ? formatFirebaseTimestamp(userStats.createdAt) : 'Unknown'}
                                    </div>
                                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                                        This is your account information. You can view your email address and
                                        membership duration here.
                                    </p>
                                </div>
                            )}

                            {/* Cookies Tab */}

                            {activeTab === 'cookies' && (
                                <div style={{
                                    backgroundColor: 'white',
                                    width: '100%',
                                    maxWidth: '600px',
                                    fontFamily: 'Arial, sans-serif',
                                    padding: '2rem',
                                    borderRadius: '15px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}>
                                    <h2 style={{ color: '#333', marginBottom: '1.5rem', fontSize: '1.7rem' }}> Cookie Management</h2>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ color: '#555', marginBottom: '1rem' }}>Current Cookie Preferences</h3>

                                        {/* Necessary Cookies */}
                                        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold', color: '#27ae60', marginRight: '0.5rem' }}>🍪</span>
                                                <strong>Necessary Cookies:</strong>
                                                <span style={{ color: '#27ae60', marginLeft: '0.5rem' }}>Always active</span>
                                            </div>
                                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d', paddingLeft: '1.8rem' }}>
                                                Required for the website to function properly. Includes session management, security, and basic functionality.
                                            </p>
                                        </div>
                                        {/* Functional Cookies */}
                                        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold', color: '#e67e22', marginRight: '0.5rem' }}>⚙️</span>
                                                <strong>Functional Cookies:</strong>
                                                <span style={{ color: CookieService.isAllowed('functional') ? '#27ae60' : '#e74c3c', marginLeft: '0.5rem' }}>
                                                    {CookieService.isAllowed('functional') ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d', paddingLeft: '1.8rem' }}>
                                                Remember your preferences and settings to provide
                                                a more personalized experience on our website.
                                            </p>
                                        </div>
                                        {/* Performance Cookies */}
                                        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold', color: '#e67e22', marginRight: '0.5rem' }}>⚡</span>
                                                <strong>Performance Cookies:</strong>
                                                <span style={{ color: CookieService.isAllowed('performance') ? '#27ae60' : '#e74c3c', marginLeft: '0.5rem' }}>
                                                    {CookieService.isAllowed('performance') ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d', paddingLeft: '1.8rem' }}>
                                                Help us improve website speed and optimize your experience. Tracks page load times and browser capabilities.
                                            </p>
                                        </div>

                                        {/* Analytics Cookies */}
                                        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold', color: '#3498db', marginRight: '0.5rem' }}>📊</span>
                                                <strong>Analytics Cookies:</strong>
                                                <span style={{ color: CookieService.isAllowed('analytics') ? '#27ae60' : '#e74c3c', marginLeft: '0.5rem' }}>
                                                    {CookieService.isAllowed('analytics') ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d', paddingLeft: '1.8rem' }}>
                                                Help us understand how visitors interact with our website. Tracks visits, page views, and user behavior.
                                            </p>
                                        </div>




                                    </div>

                                    <button
                                        onMouseEnter={(e) => { e.target.style.backgroundColor = '#2c3e50'; }}
                                        onMouseLeave={(e) => { e.target.style.backgroundColor = '#34495e'; }}
                                        onClick={() => {
                                            localStorage.removeItem('cookieConsent');
                                            window.location.reload();
                                        }}
                                        style={{
                                            padding: '0.8rem 1.5rem',
                                            backgroundColor: '#34495e',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: '0.3s ease',
                                            fontWeight: 'bold',
                                            width: '100%'
                                        }}
                                    >
                                        Manage cookies
                                    </button>

                                    {/* Analytics Data Preview */}
                                    {CookieService.isAllowed('analytics') && (
                                        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
                                            <h4 style={{ color: '#2980b9', marginBottom: '0.5rem' }}>📈 Your Analytics Data</h4>
                                            <div style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                                                <p>Visits: {CookieService.getAnalyticsData().visitCount} (how many days you visited this website)</p>
                                                <p>Page views today: {CookieService.getAnalyticsData().pageViews}</p>
                                                <p>Time spent today: {CookieService.getAnalyticsData().formattedTimeSpent}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Delete Account Tab */}
                            {activeTab === 'delete' && (
                                <div
                                    style={{
                                        backgroundColor: 'white',
                                        width: '100%',
                                        maxWidth: '500px',
                                        fontFamily: 'Arial, sans-serif',
                                        padding: '2rem',
                                        borderRadius: '15px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <h2 style={{ color: 'red', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                                        Delete Account
                                    </h2>
                                    {isGoogleUser && (
                                        <div style={{
                                            color: '#e65100',
                                            marginBottom: '1rem',
                                            padding: '0.5rem',
                                            backgroundColor: '#fff3e0',
                                            borderRadius: '4px',
                                            border: '1px solid #ffb74d'
                                        }}>
                                            <strong>Google Account:</strong> You signed in with Google.
                                            Click the button below to confirm account deletion.
                                        </div>
                                    )}

                                    {deleteError && (
                                        <div style={{
                                            color: 'red',
                                            marginBottom: '1rem',
                                            padding: '0.5rem',
                                            backgroundColor: '#ffeeee',
                                            borderRadius: '4px'
                                        }}>
                                            {deleteError}
                                        </div>
                                    )}

                                    {deleteSuccess && (
                                        <div style={{
                                            color: 'green',
                                            marginBottom: '1rem',
                                            padding: '0.5rem',
                                            backgroundColor: '#eeffee',
                                            borderRadius: '4px'
                                        }}>
                                            {deleteSuccess}
                                        </div>
                                    )}

                                    <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', color: '#666' }}>
                                        <strong style={{ color: 'red' }}>Warning:</strong> This action is irreversible.
                                        All your data, including models, favorites, and profile information will be permanently deleted.
                                    </p>

                                    {!isGoogleUser && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                                Enter your password to confirm:
                                            </label>
                                            <input
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                placeholder="Your current password"
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    width: '100%'
                                                }}
                                            />
                                        </div>
                                    )}

                                    <button
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#b10000ff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'red';
                                        }}
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        style={{
                                            transition: '0.3s ease',
                                            padding: '0.7rem 1.5rem',
                                            backgroundColor: isDeleting ? '#ccc' : 'red',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold',
                                            width: '100%'
                                        }}
                                    >
                                        {isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;