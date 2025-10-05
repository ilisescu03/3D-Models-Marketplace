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
import '/frontend/css/Settings.css';

function Settings() {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
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

    useEffect(() => {
            const handleResize = () => {
                setWindowWidth(window.innerWidth);
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
        <div className="settings-page">
            <Header />
            <CookiesBanner />
            <div className="settings-container" style={{marginTop: windowWidth<1000 ? '-7rem': '8rem'}}>
         

                <div className="settings-content">
                    {/* Main content layout - changes based on screen size */}
                    <div className={`settings-layout ${windowWidth<1000 ? 'mobile' : 'desktop'}`}>

                        {/* Navigation tabs - always displayed */}
                        <div className={`tabs-container ${windowWidth<1000 ? 'mobile' : 'desktop'}`}>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
                            >
                                Password
                            </button>
                            <button
                                onClick={() => setActiveTab('payment')}
                                className={`tab-button ${activeTab === 'payment' ? 'active' : ''}`}
                            >
                                Payment
                            </button>
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
                            >
                                Account
                            </button>
                            <button
                                onClick={() => setActiveTab('cookies')}
                                className={`tab-button ${activeTab === 'cookies' ? 'active' : ''}`}
                            >
                                Cookies
                            </button>
                            <button
                                onClick={() => setActiveTab('delete')}
                                className={`tab-button delete ${activeTab === 'delete' ? 'active' : ''}`}
                            >
                                Delete Account
                            </button>
                        </div>

                        {/* Tab content */}
                        <div className="tab-content">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="card profile">
                                    {/* Profile picture with overlay */}
                                    <div className="profile-pic-wrapper">
                                        <img
                                            className="profile-pic"
                                            src={userStats.profilePicture}
                                            alt="Profile"
                                            onError={(e) => { e.target.src = "profile.png"; }}
                                        />

                                        <div
                                            className="profile-pic-overlay"
                                            onClick={() => document.getElementById('profilePictureInput').click()}
                                        >
                                            <p className="profile-pic-overlay-text">
                                                Change profile pic.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hidden input for profile picture upload */}
                                    <input
                                        id="profilePictureInput"
                                        type="file"
                                        accept="image/*"
                                        className="hidden-input"
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
                                    <div className="form-group">
                                        <div className="form-col">
                                            <label className="label">Username:</label>
                                            <input
                                                type="text"
                                                value={userStats.username}
                                                onChange={(e) => setUserStats(prev => ({ ...prev, username: e.target.value }))}
                                                className="input"
                                            />
                                        </div>
                                    </div>

                                    {/* Account type selection */}
                                    <div className="form-group">
                                        <div className="form-col">
                                            <label className="label">Account type:</label>
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
                                                className="select"
                                            >
                                                <option value="individual">Individual</option>
                                                <option value="organization">Organization</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Role selection */}
                                    <div className="form-group">
                                        <div className="form-col">
                                            <label className="label">Role:</label>
                                            <select
                                                value={userStats.role}
                                                onChange={(e) => setUserStats(prev => ({ ...prev, role: e.target.value }))}
                                                className="select"
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
                                    <div className="form-group">
                                        <div className="form-col">
                                            <label className="label">Bio:</label>
                                            <textarea
                                                value={userStats.bio}
                                                onChange={(e) => setUserStats(prev => ({ ...prev, bio: e.target.value }))}
                                                maxLength={300}
                                                rows={5}
                                                className="textarea"
                                                placeholder="Write something about yourself..."
                                            />
                                        </div>
                                    </div>

                                    {/* Social media links */}
                                    <div className="form-group">
                                        <div className="form-col">
                                            <label className="label">Social media links:</label>
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
                                                    className="links-input"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Software skills */}
                                    <div className="form-group">
                                        <div className="form-col">
                                            <label className="label">Software skills:</label>
                                            <div className="skills-container">
                                                {selectedSkills.map((skill) => (
                                                    <div
                                                        key={skill}
                                                        onClick={() => toggleSkill(skill)}
                                                        className="skill-chip"
                                                    >
                                                        {skill} ×
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Available Software skills */}
                                    <div className="form-group">
                                        <div className="form-col">
                                            <div className="skills-container">
                                                {availableSkills.filter(skill => !selectedSkills.includes(skill)).map((skill) => (
                                                    <div
                                                        key={skill}
                                                        onClick={() => toggleSkill(skill)}
                                                        className="skill-chip available"
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
                                        className="btn btn-lg"
                                    >
                                        SAVE PROFILE
                                    </button>
                                </div>
                            )}

                            {/* Password Tab */}
                            {activeTab === 'password' && (
                                <div className="card small">
                                    <h2 className="settings-section-title">Change Password</h2>

                                    {passwordError && (
                                        <div className="notice notice-error">{passwordError}</div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="notice notice-success">{passwordSuccess}</div>
                                    )}

                                    <div className="form-group">
                                        <label className="label">Current Password:</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="label">New Password:</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="label">Confirm New Password:</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="input"
                                        />
                                    </div>

                                    <button
                                        onClick={handlePasswordChange}
                                        className="btn"
                                    >
                                        Change Password
                                    </button>
                                </div>
                            )}

                            {/* Payment Tab */}
                            {activeTab === 'payment' && (
                                <div className="card small center">
                                    <h2 className="settings-section-title">Payment Agreement</h2>
                                    <p className="paragraph">
                                        This is where you can manage your payment settings and agreements.
                                        In the future, you'll be able to add payment methods, view billing history,
                                        and manage subscriptions here.
                                    </p>
                                    <button className="btn">Manage Payment Methods</button>
                                </div>
                            )}

                            {/* Account Tab */}
                            {activeTab === 'account' && (
                                <div className="card small">
                                    <h2 className="settings-section-title">Account Information</h2>
                                    <div className="info-box">
                                        <strong>Email:</strong> {user?.email || 'Not available'}
                                    </div>
                                    <div className="info-box">
                                        <strong>Member since:</strong> {userStats.createdAt ? formatFirebaseTimestamp(userStats.createdAt) : 'Unknown'}
                                    </div>
                                    <p className="info-muted">
                                        This is your account information. You can view your email address and
                                        membership duration here.
                                    </p>
                                </div>
                            )}

                            {/* Cookies Tab */}
                            {activeTab === 'cookies' && (
                                <div className="card cookies">
                                    <h2 className="settings-section-title settings-section-title-lg"> Cookie Management</h2>

                                    <div className="mb-2">
                                       
                                        {/* Necessary Cookies */}
                                        <div className="cookies-box">
                                            <div className="cookies-item">
                                                <span className="cookies-icon-green">🍪</span>
                                                <strong>Necessary Cookies:</strong>
                                                <span className="status status-green">Always active</span>
                                            </div>
                                            <p className="cookies-subtext">
                                                Required for the website to function properly. Includes session management, security, and basic functionality.
                                            </p>
                                        </div>
                                        {/* Functional Cookies */}
                                        <div className="cookies-box">
                                            <div className="cookies-item">
                                                <span className="cookies-icon-orange">⚙️</span>
                                                <strong>Functional Cookies:</strong>
                                                <span className={`status ${CookieService.isAllowed('functional') ? 'status-green' : 'status-red'}`}>
                                                    {CookieService.isAllowed('functional') ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="cookies-subtext">
                                                Remember your preferences and settings to provide
                                                a more personalized experience on our website.
                                            </p>
                                        </div>
                                        {/* Performance Cookies */}
                                        <div className="cookies-box">
                                            <div className="cookies-item">
                                                <span className="cookies-icon-orange">⚡</span>
                                                <strong>Performance Cookies:</strong>
                                                <span className={`status ${CookieService.isAllowed('performance') ? 'status-green' : 'status-red'}`}>
                                                    {CookieService.isAllowed('performance') ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="cookies-subtext">
                                                Help us improve website speed and optimize your experience. Tracks page load times and browser capabilities.
                                            </p>
                                        </div>

                                        {/* Analytics Cookies */}
                                        <div className="cookies-box">
                                            <div className="cookies-item">
                                                <span className="cookies-icon-blue">📊</span>
                                                <strong>Analytics Cookies:</strong>
                                                <span className={`status ${CookieService.isAllowed('analytics') ? 'status-green' : 'status-red'}`}>
                                                    {CookieService.isAllowed('analytics') ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="cookies-subtext">
                                                Help us understand how visitors interact with our website. Tracks visits, page views, and user behavior.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('cookieConsent');
                                            window.location.reload();
                                        }}
                                        className="btn btn-secondary"
                                    >
                                        Manage cookies
                                    </button>

                                    {/* Analytics Data Preview */}
                                    {CookieService.isAllowed('analytics') && (
                                        <div className="analytics-preview">
                                            <h4 className="analytics-title">📈 Your Analytics Data</h4>
                                            <div className="analytics-text">
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
                                <div className="card small">
                                    <h2 className="title-danger">Delete Account</h2>
                                    {isGoogleUser && (
                                        <div className="notice notice-warning">
                                            <strong>Google Account:</strong> You signed in with Google.
                                            Click the button below to confirm account deletion.
                                        </div>
                                    )}

                                    {deleteError && (
                                        <div className="notice notice-error">{deleteError}</div>
                                    )}

                                    {deleteSuccess && (
                                        <div className="notice notice-success">{deleteSuccess}</div>
                                    )}

                                    <p className="paragraph text-muted">
                                        <strong className="text-danger">Warning:</strong> This action is irreversible.
                                        All your data, including models, favorites, and profile information will be permanently deleted.
                                    </p>

                                    {!isGoogleUser && (
                                        <div className="form-group">
                                            <label className="label">Enter your password to confirm:</label>
                                            <input
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                placeholder="Your current password"
                                                className="input"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className={isDeleting ? 'btn btn-disabled' : 'btn btn-danger'}
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
