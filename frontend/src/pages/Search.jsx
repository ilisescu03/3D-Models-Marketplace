import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '/backend/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getUsers, listenToUserStats } from '/backend/users.js';
import '/frontend/css/CommunityMembers.css';
import LoadingScreen from '../UI+UX/LoadingScreen.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner.jsx';

function Search() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('model');
    const [category, setCategory] = useState('');
    const [accountType, setAccountType] = useState('');
    const [role, setRole] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);

    // State for user data and authentication
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);
    const [usersData, setUsersData] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [userStats, setUserStats] = useState({
        followers: 0,
        following: 0,
        followersList: [],
        followingList: [],
        profilePicture: ""
    });
    const [searchPerformed, setSearchPerformed] = useState(false);

        const [headerHeight, setHeaderHeight] = useState(140); 
    const headerRef = useRef(null);
    // Data for dropdowns
    const categories = [
        'Architecture', 'Characters', 'Vehicles', 'Nature',
        'Electronics', 'Furniture', 'Weapons', 'Other'
    ];

    const accountTypes = ['individual', 'company'];

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

    const roles = accountType === 'individual' ? individualRoles : organizationRoles;

    const skills = [
        "Blender", "Cinema4d", "AutoCAD", "ArhiCAD", "Maya",
        "3ds Max", "ZBrush", "Substance Painter", "Photoshop",
        "Godot", "Unity", "Unreal Engine"
    ];
      const [showFixedHeader, setShowFixedHeader] = useState(false);
    

    // Toggle skill selection
    const toggleSkill = (skill) => {
        setSelectedSkills(prev => {
            if (prev.includes(skill)) {
                return prev.filter(s => s !== skill);
            } else {
                return [...prev, skill];
            }
        });
    };

    const placeholderText = searchType === 'model' ? 'Search models...' : 'Search users...';

    // Fetch user's latest public models
    const fetchUserModels = async (userId) => {
        try {
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

    // Filter users based on search criteria
    const filterUsers = (users, searchTerm, filters) => {
        let filtered = users;

        // Apply search term filter (username only)
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(userData =>
                userData.username.toLowerCase().includes(searchLower)
            );
        }

        // Apply account type filter
        if (filters.accountType) {
            filtered = filtered.filter(userData =>
                userData.accountType === filters.accountType
            );
        }

        // Apply role filter
        if (filters.role) {
            filtered = filtered.filter(userData =>
                userData.role === filters.role
            );
        }

        // Apply skills filter
        if (filters.selectedSkills.length > 0) {
            filtered = filtered.filter(userData => {
                const userSkills = userData.skills || [];
                return filters.selectedSkills.every(skill =>
                    userSkills.includes(skill)
                );
            });
        }

        // Sort users by number of followers (descending)
        filtered = filtered.sort((a, b) => b.followers - a.followers);

        return filtered;
    };

    // Check if user has performed an actual search
    const hasActiveSearch = () => {
        if (searchType === 'user') {
            return searchQuery.trim() || accountType || role || selectedSkills.length > 0;
        }
        return false;
    };
    
     // Calculate header's height
    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                const height = headerRef.current.offsetHeight;
                setHeaderHeight(height);
            }
        };

        
        updateHeaderHeight();

 
        window.addEventListener('resize', updateHeaderHeight);
        
   
        const resizeObserver = new ResizeObserver(updateHeaderHeight);
        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            resizeObserver.disconnect();
        };
    }, [searchType, accountType, role, selectedSkills])
    // Main useEffect for data initialization
    useEffect(() => {
        // Fetch all users with their complete data
        const fetchUsers = async () => {
            try {
                const users = await getUsers();

                // Enhance user data with models, bio, and skills
                const usersWithFullData = await Promise.all(
                    users.map(async (userData) => {
                        const models = await fetchUserModels(userData.uid);

                        // Get additional user profile data
                        const userDocRef = doc(db, "users", userData.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        const fullUserData = userDocSnap.exists() ? userDocSnap.data() : {};

                        return {
                            ...userData,
                            models: models,
                            bio: fullUserData.bio || "",
                            skills: fullUserData.skills || [],
                            accountType: fullUserData.accountType || "",
                            role: fullUserData.role || ""
                        };
                    })
                );

                setUsersData(usersWithFullData);

                // Check URL parameters for initial search
                const urlParams = new URLSearchParams(location.search);
                const initialSearch = urlParams.get('q');
                const initialType = urlParams.get('type') || 'model';
                const initialAccountType = urlParams.get('accountType');
                const initialRole = urlParams.get('role');
                const initialSkills = urlParams.get('skills');

                if (initialType === 'user') {
                    setSearchType(initialType);
                    if (initialSearch) setSearchQuery(initialSearch);
                    if (initialAccountType) setAccountType(initialAccountType);
                    if (initialRole) setRole(initialRole);
                    if (initialSkills) setSelectedSkills(initialSkills.split(','));

                    // Apply filters if search criteria exist
                    if (initialSearch || initialAccountType || initialRole || initialSkills) {
                        const filtered = filterUsers(usersWithFullData, initialSearch || '', {
                            accountType: initialAccountType || '',
                            role: initialRole || '',
                            selectedSkills: initialSkills ? initialSkills.split(',') : []
                        });
                        setFilteredUsers(filtered);
                        setSearchPerformed(true);
                    }
                }
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
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUsername(userData.username || userData.email);
                    }

                    const stopListening = listenToUserStats(currentUser.uid, async (stats) => {
                        setUserStats(stats);
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
    }, [navigate, location]);

    // Update filtered users when search criteria change
    useEffect(() => {
        if (usersData.length > 0 && searchType === 'user' && hasActiveSearch()) {
            const filtered = filterUsers(usersData, searchQuery, {
                accountType,
                role,
                selectedSkills
            });
            setFilteredUsers(filtered);
            setSearchPerformed(true);
        } else if (searchType === 'user' && hasActiveSearch()) {
            setSearchPerformed(true);
        } else {
            setSearchPerformed(false);
            setFilteredUsers([]);
        }
    }, [searchQuery, searchType, usersData, accountType, role, selectedSkills]);

    // Handle search submission
    const handleSearch = () => {
        if (searchType === 'user' && !hasActiveSearch()) {
            return;
        }

        // Build search parameters
        const searchParams = new URLSearchParams();
        searchParams.set('type', searchType);

        if (searchQuery.trim()) {
            searchParams.set('q', searchQuery.trim());
        }

        if (searchType === 'model' && category) {
            searchParams.set('category', category);
        } else if (searchType === 'user') {
            if (accountType) searchParams.set('accountType', accountType);
            if (role) searchParams.set('role', role);
            if (selectedSkills.length > 0) searchParams.set('skills', selectedSkills.join(','));
        }

        // Navigate to search results
        navigate(`/search?${searchParams.toString()}`);
    };

    // Handle Enter key in search input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setCategory('');
        setAccountType('');
        setRole('');
        setSelectedSkills([]);
        setSearchQuery('');
        setSearchPerformed(false);
        setFilteredUsers([]);
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery || accountType || role || selectedSkills.length > 0;

    // Show loading screen while data is being fetched
    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div style={{
            backgroundColor: '#f8f9fa',
            minHeight: '100vh',
           
        }}>
            {/* Search header */}
            <div style={{
                position: 'relative',
              
                width: '97.5%',
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: 1000,
                padding: '10px 25px',
                borderBottom: '1px solid #e9ecef'
            }}>
                {/* Search bar and buttons */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '20px'
                }}>
                    {window.innerWidth>=1000&&(<button
                        onClick={() => navigate('/')}
                        style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            padding: '0',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <img
                            src="/WebsiteLogo.png"
                            alt="ShapeHive Logo"
                            style={{
                                height: '100px',
                                objectFit: 'contain'
                            }}
                        />
                    </button>)}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '90%',
                        position: 'relative'
                    }}>
                        <button
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '10px 12px',
                                position: 'absolute',
                                left: '0',
                                zIndex: 2
                            }}
                            onClick={handleSearch}
                            disabled={searchType === 'user' && !hasActiveSearch()}
                        >
                            <img src="/SearchBtn.png" alt="Search" style={{
                                height: '18px',
                                filter: searchType === 'user' && !hasActiveSearch()
                                    ? 'invert(70%)'
                                    : 'invert(45%) sepia(90%) saturate(1500%) hue-rotate(10deg) brightness(100%) contrast(100%)'
                            }} />
                        </button>
                        <input
                            type="text"
                            placeholder={placeholderText}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '8px',
                                border: '2px solid #e9ecef',
                                fontSize: '1rem',
                                outline: 'none',
                                backgroundColor: '#fff',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Arial, sans-serif'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'rgba(255, 123, 0, 0.8)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(255, 123, 0, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e9ecef';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={clearFilters}
                            style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                padding: '12px 16px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Arial, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#c82333';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#dc3545';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                padding: '12px 24px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Arial, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#5a6268';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#6c757d';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Filters section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '25px',
                    flexWrap: 'wrap'
                }}>
                    {/* Search type dropdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
                        <label style={{
                            fontSize: '0.8rem',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#495057',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontFamily: 'Arial, sans-serif'
                        }}>
                            Search Type
                        </label>
                        <select
                            value={searchType}
                            onChange={(e) => {
                                setSearchType(e.target.value);
                                setCategory('');
                                setAccountType('');
                                setRole('');
                                setSelectedSkills([]);
                                setFilteredUsers([]);
                                setSearchPerformed(false);
                            }}
                            style={{
                                padding: '10px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e9ecef',
                                fontSize: '0.9rem',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Arial, sans-serif',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'rgba(255, 123, 0, 0.8)';
                                e.target.style.boxShadow = '0 0 0 2px rgba(255, 123, 0, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e9ecef';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="model">Models</option>
                            <option value="user">Users</option>
                        </select>
                    </div>

                    {/* Model-specific filters */}
                    {searchType === 'model' && (
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '160px' }}>
                            <label style={{
                                fontSize: '0.8rem',
                                marginBottom: '6px',
                                fontWeight: '600',
                                color: '#495057',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontFamily: 'Arial, sans-serif'
                            }}>
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e9ecef',
                                    fontSize: '0.9rem',
                                    backgroundColor: '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Arial, sans-serif',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 123, 0, 0.8)';
                                    e.target.style.boxShadow = '0 0 0 2px rgba(255, 123, 0, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e9ecef';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* User-specific filters */}
                    {searchType === 'user' && (
                        <>
                            {/* Account Type */}
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '160px' }}>
                                <label style={{
                                    fontSize: '0.8rem',
                                    marginBottom: '6px',
                                    fontWeight: '600',
                                    color: '#495057',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontFamily: 'Arial, sans-serif'
                                }}>
                                    Account Type
                                </label>
                                <select
                                    value={accountType}
                                    onChange={(e) => {
                                        setAccountType(e.target.value);
                                        setRole('');
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e9ecef',
                                        fontSize: '0.9rem',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Arial, sans-serif',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 123, 0, 0.8)';
                                        e.target.style.boxShadow = '0 0 0 2px rgba(255, 123, 0, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e9ecef';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">All Types</option>
                                    {accountTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role */}
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px' }}>
                                <label style={{
                                    fontSize: '0.8rem',
                                    marginBottom: '6px',
                                    fontWeight: '600',
                                    color: '#495057',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontFamily: 'Arial, sans-serif'
                                }}>
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e9ecef',
                                        fontSize: '0.9rem',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Arial, sans-serif',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 123, 0, 0.8)';
                                        e.target.style.boxShadow = '0 0 0 2px rgba(255, 123, 0, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e9ecef';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">All Roles</option>
                                    {roles.map(roleOption => (
                                        <option key={roleOption.value} value={roleOption.value}>
                                            {roleOption.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Skills multi-select */}
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
                                <label style={{
                                    fontSize: '0.8rem',
                                    marginBottom: '6px',
                                    fontWeight: '600',
                                    color: '#495057',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontFamily: 'Arial, sans-serif'
                                }}>
                                    Skills
                                </label>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '6px',
                                    minWidth: '200px',
                                    minHeight: '44px',
                                    padding: '8px',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 123, 0, 0.8)';
                                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 123, 0, 0.1)';
                                    }}
                                >
                                    {selectedSkills.map(skill => (
                                        <div
                                            key={skill}
                                            onClick={() => toggleSkill(skill)}
                                            style={{
                                                backgroundColor: 'rgba(255, 123, 0, 0.1)',
                                                color: '#d35400',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                border: '1px solid rgba(255, 123, 0, 0.3)',
                                                fontWeight: '500',
                                                fontFamily: 'Arial, sans-serif',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 123, 0, 0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 123, 0, 0.1)';
                                            }}
                                        >
                                            {skill}
                                            <span style={{ fontSize: '12px', marginLeft: '2px' }}>×</span>
                                        </div>
                                    ))}
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value && !selectedSkills.includes(e.target.value)) {
                                                toggleSkill(e.target.value);
                                            }
                                            e.target.value = '';
                                        }}
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            backgroundColor: 'transparent',
                                            fontSize: '0.9rem',
                                            minWidth: '120px',
                                            cursor: 'pointer',
                                            fontFamily: 'Arial, sans-serif',
                                            color: '#6c757d'
                                        }}
                                    >
                                        <option value="">Add skill...</option>
                                        {skills
                                            .filter(skill => !selectedSkills.includes(skill))
                                            .map(skill => (
                                                <option key={skill} value={skill}>
                                                    {skill}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Search results */}
            <div style={{ 
                padding: '0px',
              
                width: '100%',
                boxSizing: 'border-box',
                
            }}>
                {searchType === 'user' && searchPerformed ? (
                    <div className="comm-members-containerStyle">
                        {/* Results header */}
                        <div style={{ width: '100%', marginBottom: '4rem' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '0.5rem'
                            }}>
                                Search Results
                            </h2>
                            <p style={{
                                color: '#6b7280',
                                fontSize: '1rem',
                                marginBottom: '1rem'
                            }}>
                                {filteredUsers.length} {filteredUsers.length === 1 ? 'user found' : 'users found'}
                                {hasActiveFilters && ' with current filters'}
                            </p>
                        </div>

                        {/* Users grid - 4 cards per row */}
                        <div className="creators-grid" style={{
                            display: 'grid',
                             gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1rem',
                            width: '100%',
                            margin: '0 auto'
                        }}>
                            {filteredUsers.length === 0 ? (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: '#6b7280'
                                }}>
                                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No users found</p>
                                    <p style={{ fontSize: '0.9rem' }}>
                                        {hasActiveFilters
                                            ? 'No users match your search criteria. Try adjusting your filters.'
                                            : 'No users available'
                                        }
                                    </p>
                                </div>
                            ) : (
                                filteredUsers.map((creator) => (
                                    <div key={creator.uid} className="creator-card" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '1.25rem',
                                        marginTop: '0',
                                        gap: '0.75rem'
                                    }}>
                                        {/* User profile section */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.75rem',
                                            width: '100%',
                                            justifyContent: 'flex-start'
                                        }}>
                                            <img
                                                src={creator.profilePicture}
                                                alt={creator.username}
                                                onError={(e) => (e.target.src = "profile.png")}
                                                style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    objectFit: 'cover',
                                                    borderRadius: '0',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                flex: 1,
                                                gap: '0.25rem',
                                                textAlign: 'left'
                                            }}>
                                                <h3 style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: '700',
                                                    color: '#1f2937',
                                                    margin: '0',
                                                    lineHeight: '1.2',
                                                    textAlign: 'left'
                                                }}>
                                                    {creator.username}
                                                </h3>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: '#6b7280',
                                                    fontWeight: '400',
                                                    textAlign: 'left'
                                                }}>
                                                    {creator.role ? roles.find(r => r.value === creator.role)?.label || creator.role : 'No role specified'}
                                                </span>
                                                {creator.skills && creator.skills.length > 0 && (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: '0.3rem',
                                                        marginTop: '0.25rem',
                                                        justifyContent: 'flex-start'
                                                    }}>
                                                        {creator.skills.slice(0, 3).map((skill, index) => (
                                                            <span
                                                                key={index}
                                                                style={{
                                                                    backgroundColor: '#f3f4f6',
                                                                    color: '#4b5563',
                                                                    padding: '0.15rem 0.4rem',
                                                                    borderRadius: '3px',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: '500',
                                                                    lineHeight: '1.2'
                                                                }}
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Model preview images */}
                                        {creator.models && creator.models.length > 0 ? (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, 1fr)',
                                                gap: '0.5rem',
                                                margin: '0'
                                            }}>
                                                {creator.models.map((model) => (
                                                    <div
                                                        key={model.id}
                                                        style={{
                                                            aspectRatio: '16/9',
                                                            borderRadius: '4px',
                                                            overflow: 'hidden',
                                                            backgroundColor: '#f3f4f6'
                                                        }}
                                                    >
                                                        <img
                                                            src={model.previewImages?.[0] || 'placeholder.png'}
                                                            alt={model.title}
                                                            onError={(e) => (e.target.src = 'placeholder.png')}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                maxHeight: '150px',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{
                                                aspectRatio: '16/9',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}>
                                                <img
                                                    src="modelPlaceholder.png"
                                                    alt="No models"
                                                    style={{
                                                        height: '100%',
                                                        maxHeight: '150px',
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* User stats and action button */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            position: 'relative',
                                            bottom: 0,
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                gap: '0.1rem'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280'
                                                }}>
                                                    <span style={{ fontWeight: '600' }}>{creator.followers} followers</span>
                                                    <span style={{ color: '#d1d5db' }}>•</span>
                                                    <span style={{ fontWeight: '600' }}>{creator.models ? creator.models.length : 0} models</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => creator.uid !== user?.uid ?
                                                    window.location.href = `/user/${creator.username}` :
                                                    window.location.href = '/dashboard'}
                                                style={{
                                                    backgroundColor: '#000000',
                                                    color: '#ffffff',
                                                    marginLeft: '70px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.65rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    whiteSpace: 'nowrap',
                                                    minWidth: '60px',
                                                    minHeight: '30px',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#333333';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#000000';
                                                }}
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : searchType === 'user' ? (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '100px',
                        textAlign: 'center',
                        color: '#6c757d',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        border: '1px solid #e9ecef',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#495057' }}>
                            🔍 Search Users
                        </div>
                        <div style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                            Enter a username in the search bar or apply filters to find users
                        </div>
                    </div>
                ) : searchType === 'model' ? (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '100px',
                        textAlign: 'center',
                        color: '#6c757d',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        border: '1px solid #e9ecef',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#495057' }}>
                            🔍 Search Results for Models
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            Enter your search criteria above to find 3D models
                        </div>
                        {searchQuery && (
                            <div style={{
                                marginTop: '20px',
                                padding: '15px',
                                backgroundColor: 'rgba(255, 123, 0, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 123, 0, 0.3)'
                            }}>
                                <div style={{ fontWeight: '600', color: '#d35400', marginBottom: '5px' }}>
                                    Ready to search for: "{searchQuery}"
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    Press Enter or click the search icon to see results
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '100px',
                        textAlign: 'center',
                        color: '#6c757d',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        border: '1px solid #e9ecef',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#495057' }}>
                            🔍 Search
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            Select a search type and enter your criteria to begin searching
                        </div>
                    </div>
                )}
            </div>
            <CookiesBanner/>
        </div>
    );
}

export default Search;