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

function Settings() {
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
    const handlePasswordChange = () => {
        setPasswordError("");
        setPasswordSuccess("");

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }

        // Validate password length
        if (passwordData.newPassword.length < 6) {
            setPasswordError("Password should be at least 6 characters");
            return;
        }

        // This would be connected to your backend password change functionality
        setPasswordSuccess("Password changed successfully!");
        setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        });
    };

    return (
        <div style={backgroundStyle}>
            <Header />
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
                                style={getTabButtonStyle(activeTab === 'delete')}
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
                                        onClick={handlePasswordChange}
                                        style={{
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
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '##f9f9f9', borderRadius: '4px' }}>
                                        <strong>Member since:</strong> {userStats.createdAt ? new Date(userStats.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                    </div>
                                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                                        This is your account information. You can view your email address and
                                        membership duration here.
                                    </p>
                                </div>
                            )}

                            {/* Cookies Tab */}
                            {activeTab === 'cookies' && (
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
                                    <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Cookie Management</h2>
                                    <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                        This is where you can manage your cookie preferences.
                                        In the future, you'll be able to customize which types of cookies
                                        we can use to improve your experience on our platform.
                                    </p>
                                    <button
                                        style={{
                                            padding: '0.7rem 1.5rem',
                                            backgroundColor: '#575757',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Manage Cookies
                                    </button>
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
                                        textAlign: 'center'
                                    }}
                                >
                                    <h2 style={{ color: 'red', marginBottom: '1.5rem', fontWeight: 'bold' }}>Delete Account</h2>
                                    <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                        Warning: This action is irreversible. All your data, including models,
                                        favorites, and profile information will be permanently deleted.
                                    </p>
                                    <button
                                        style={{
                                            padding: '0.7rem 1.5rem',
                                            backgroundColor: 'red',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Delete My Account
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