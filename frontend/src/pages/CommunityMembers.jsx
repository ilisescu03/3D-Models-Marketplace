import { useEffect, useState } from "react";
import Header from "../UI+UX/Header";
import Footer from '../UI+UX/Footer.jsx';
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getUsers } from '/backend/users.js';
import '/frontend/css/Home.css';
import '/frontend/css/Heroes.css'
import { Mosaic } from "react-loading-indicators";
import { auth, db } from '/backend/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';


function CommunityMembers() {

    //Auth and user filter states
    const [filteredUsers, setFilteredUsers] = useState([]);
    const { currentUser, userLogedIn } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usersWithModels, setUsersWithModels] = useState([]);
    const [accountType, setAccountType] = useState('All');
    const [role, setRole] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [sortBy, setSortBy] = useState('followers');

    //Options for filters
    const accountTypes = ['All', 'individual', 'organization'];
    const sortOptions = [
        { value: 'followers', label: 'Followers' },
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];

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
    //States for window management + mobile menus
    const [typeMenuOpen, setTypeMenuOpen] = useState(false);
    const [roleMenuOpen, setRoleMenuOpen] = useState(false);
    const [skillsMenuOpen, setSkillsMenuOpen] = useState(false);
    const [sortMenuOpen, setSortMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    //Sort users
    const sortUsers = (usersToSort) => {
        let sorted = [...usersToSort];

        switch (sortBy) {
            case 'followers':
                sorted.sort((a, b) => (b.followers || 0) - (a.followers || 0));
                break;
            case 'newest':
                sorted.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                    return dateB - dateA;
                });
                break;
            case 'oldest':
                sorted.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                    return dateA - dateB;
                });
                break;

            default:
                sorted.sort((a, b) => (b.followers || 0) - (a.followers || 0));
        }

        return sorted;
    };
    useEffect(() => {
       
            document.title = `Members - ShapeHive`;
      

    }, []);
    // Track window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load users on component mount
    useEffect(() => {
        console.log("=== COMMUNITY MEMBERS AUTH STATE ===");
        console.log("currentUser:", currentUser);
        console.log("userLogedIn:", userLogedIn);
        loadUsers();
    }, [currentUser, userLogedIn]);

    // Filter and sort users when filters change
    useEffect(() => {
        if (users.length > 0) {
            let filtered = filterUsers(users);
            filtered = sortUsers(filtered);
            setFilteredUsers(filtered);
            loadUsersModels(filtered);
        } else {
            setFilteredUsers([]);
            setUsersWithModels([]);
        }
    }, [accountType, role, selectedSkills, sortBy, users]);

    // Function to track how many models does a user have?
    const countUserModels = async (userId) => {
        try {
            const modelsQuery = query(
                collection(db, "models"),
                where("creatorUID", "==", userId),
                where("isPublic", "==", true)
            );
            const snapshot = await getDocs(modelsQuery);
            return snapshot.size; // Return the nr of models
        } catch (error) {
            console.error("Error counting user models:", error);
            return 0;
        }
    };

    // Fetch first 2 models for preview (to modify)
    const fetchUserPreviewModels = async (userId) => {
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
            console.error("Error fetching user preview models:", error);
            return [];
        }
    };

    const loadUsersModels = async (usersList) => {
        try {
            const usersWithModelsData = await Promise.all(
                usersList.map(async (user) => {
                    const [modelsCount, previewModels] = await Promise.all([
                        countUserModels(user.uid),
                        fetchUserPreviewModels(user.uid)
                    ]);

                    return {
                        ...user,
                        modelsCount: modelsCount,
                        previewModels: previewModels
                    };
                })
            );
            setUsersWithModels(usersWithModelsData);
        } catch (error) {
            console.error("Error loading users models:", error);
        }
    };

    const toggleSkill = (skill) => {
        setSelectedSkills(prevSkills => {
            if (prevSkills.includes(skill)) {
                return prevSkills.filter(s => s !== skill);
            } else {
                return [...prevSkills, skill];
            }
        });
    };

    const filterUsers = (usersToFilter) => {
        let filtered = [...usersToFilter];

        // Apply account type filter
        if (accountType !== 'All') {
            filtered = filtered.filter(user => user.accountType === accountType);
        }

        // Apply role filter
        if (role) {
            filtered = filtered.filter(user => user.role === role);
        }

        // Apply skills filter
        if (selectedSkills.length > 0) {
            filtered = filtered.filter(user => {
                const userSkills = user.skills || [];
                return selectedSkills.some(skill => userSkills.includes(skill));
            });
        }

        return filtered;
    };

    const clearFilters = () => {
        setAccountType('All');
        setRole('');
        setSelectedSkills([]);

    };

    // Check if any filters are active
    const hasActiveFilters = accountType !== 'All' || role || selectedSkills.length > 0;

    // Function to load users from backend
    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log("Loading users for community members page...");
            const usersData = await getUsers();

            if (usersData && usersData.length > 0) {
                console.log("Users loaded successfully:", usersData.length);
                setUsers(usersData);
            } else {
                console.error("Failed to load users or no users found");
                setError("No users found or failed to load users");
            }
        } catch (err) {
            console.error("Error loading users:", err);
            setError("Failed to load community members. Please try again later.");
        } finally {
            setLoading(false);
        }
    };



    // Get role label from value
    const getRoleLabel = (roleValue) => {
        const allRoles = [...individualRoles, ...organizationRoles];
        const roleObj = allRoles.find(r => r.value === roleValue);
        return roleObj ? roleObj.label : roleValue;
    };

    const getSortLabel = (sortValue) => {
        const sortObj = sortOptions.find(s => s.value === sortValue);
        return sortObj ? sortObj.label : 'Followers';
    };
    // Functie pentru a construi query-ul URL
    function buildUrlQuery({ accountType, role, selectedSkills, sortBy }) {
        const params = new URLSearchParams(window.location.search);

        if (accountType && accountType !== 'All') params.set('accountType', accountType);
        else params.delete('accountType');

        if (role) params.set('role', role);
        else params.delete('role');

        if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
        else params.delete('skills');

        if (sortBy && sortBy !== 'followers') params.set('sortBy', sortBy);
        else params.delete('sortBy');

        return params.toString();
    }
    useEffect(() => {
        const queryStr = buildUrlQuery({ accountType, role, selectedSkills, sortBy });
        const newUrl = `${window.location.pathname}${queryStr ? '?' + queryStr : ''}`;
        window.history.replaceState(null, '', newUrl);
    }, [accountType, role, selectedSkills, sortBy]);
    return (
        <div className="home-background" style={{ background: '#f3f3f3ff', minHeight: '100vh' }}>
            <Header />
            <CookiesBanner />

            {/* Mobile Filters Section */}
            {windowWidth < 1000 && (
                <div style={{
                    width: '100%',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    padding: '0',
                    borderBottom: '1px solid #e9ecef',
                    marginTop: '-155px',
                    position: 'relative'
                }}>
                    {/* Main filter buttons row - Full width */}
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'stretch',
                        alignItems: 'stretch',
                        gap: '0px',
                    }}>
                        {/* Type Filter Button (includes Account Type and Role) */}
                        <div style={{
                            position: 'relative',
                            flex: 1,
                            borderRight: '1px solid #e9ecef'
                        }}>
                            <button
                                onClick={() => {
                                    setTypeMenuOpen(!typeMenuOpen);
                                    setSkillsMenuOpen(false);
                                    setSortMenuOpen(false);
                                }}
                                style={{
                                    backgroundColor: (accountType !== 'All' || role) ? 'rgba(255, 123, 0, 0.1)' : 'white',
                                    color: (accountType !== 'All' || role) ? '#d35400' : '#495057',
                                    border: 'none',
                                    borderRadius: '0px',
                                    padding: '20px 10px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontFamily: 'Arial, sans-serif',
                                    transition: 'all 0.2s ease',
                                    minHeight: '60px'
                                }}
                            >
                                Type
                                <span style={{
                                    fontSize: '12px',
                                    transition: 'transform 0.2s ease',
                                    transform: typeMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}>
                                    ▼
                                </span>
                            </button>
                        </div>

                        {/* Skills Filter Button */}
                        <div style={{
                            position: 'relative',
                            flex: 1,
                            borderRight: '1px solid #e9ecef'
                        }}>
                            <button
                                onClick={() => {
                                    setSkillsMenuOpen(!skillsMenuOpen);
                                    setTypeMenuOpen(false);
                                    setSortMenuOpen(false);
                                }}
                                style={{
                                    backgroundColor: selectedSkills.length > 0 ? 'rgba(255, 123, 0, 0.1)' : 'white',
                                    color: selectedSkills.length > 0 ? '#d35400' : '#495057',
                                    border: 'none',
                                    borderRadius: '0px',
                                    padding: '20px 10px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontFamily: 'Arial, sans-serif',
                                    transition: 'all 0.2s ease',
                                    minHeight: '60px'
                                }}
                            >
                                Skills
                                <span style={{
                                    fontSize: '12px',
                                    transition: 'transform 0.2s ease',
                                    transform: skillsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}>
                                    ▼
                                </span>
                            </button>
                        </div>

                        {/* Sort Filter Button */}
                        <div style={{
                            position: 'relative',
                            flex: 1
                        }}>
                            <button
                                onClick={() => {
                                    setSortMenuOpen(!sortMenuOpen);
                                    setTypeMenuOpen(false);
                                    setSkillsMenuOpen(false);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    color: '#495057',
                                    border: 'none',
                                    borderRadius: '0px',
                                    padding: '20px 10px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontFamily: 'Arial, sans-serif',
                                    transition: 'all 0.2s ease',
                                    minHeight: '60px'
                                }}
                            >
                                Sort
                                <span style={{
                                    fontSize: '12px',
                                    transition: 'transform 0.2s ease',
                                    transform: sortMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}>
                                    ▼
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Active filters indicator */}
                    {hasActiveFilters && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            padding: '15px 20px',
                            alignItems: 'center',
                            borderBottom: '1px solid #f8f9fa',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <span style={{
                                fontSize: '0.8rem',
                                color: '#6c757d',
                                fontWeight: '500',
                                fontFamily: 'Arial, sans-serif'
                            }}>
                                Active filters:
                            </span>
                            {accountType !== 'All' && (
                                <div style={{
                                    backgroundColor: 'rgba(255, 123, 0, 0.1)',
                                    color: '#d35400',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontSize: '0.8rem',
                                    border: '1px solid rgba(255, 123, 0, 0.3)',
                                    fontFamily: 'Arial, sans-serif',
                                    fontWeight: '500'
                                }}>
                                    {accountType}
                                </div>
                            )}
                            {role && (
                                <div style={{
                                    backgroundColor: 'rgba(255, 123, 0, 0.1)',
                                    color: '#d35400',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontSize: '0.8rem',
                                    border: '1px solid rgba(255, 123, 0, 0.3)',
                                    fontFamily: 'Arial, sans-serif',
                                    fontWeight: '500'
                                }}>
                                    {getRoleLabel(role)}
                                </div>
                            )}
                            {selectedSkills.map(skill => (
                                <div
                                    key={skill}
                                    style={{
                                        backgroundColor: 'rgba(255, 123, 0, 0.1)',
                                        color: '#d35400',
                                        padding: '6px 12px',
                                        borderRadius: '16px',
                                        fontSize: '0.8rem',
                                        border: '1px solid rgba(255, 123, 0, 0.3)',
                                        fontFamily: 'Arial, sans-serif',
                                        fontWeight: '500'
                                    }}
                                >
                                    {skill}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Type Dropdown Menu (includes both Account Type and Role) */}
                    {typeMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            borderTop: '1px solid #e9ecef',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            padding: '20px',
                            maxHeight: '60vh',
                            overflowY: 'auto'
                        }}>
                            {/* Account Type Section */}
                            <div style={{ marginBottom: '25px' }}>
                                <h4 style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: '#495057',
                                    marginBottom: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontFamily: 'Arial, sans-serif'
                                }}>
                                    Account Type
                                </h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                    gap: '10px'
                                }}>
                                    {accountTypes.map(typeOption => (
                                        <button
                                            key={typeOption}
                                            onClick={() => {
                                                setAccountType(typeOption);
                                                if (typeOption === 'All') {
                                                    setRole('');
                                                }
                                            }}
                                            style={{
                                                backgroundColor: accountType === typeOption ? 'rgba(255, 123, 0, 0.1)' : 'white',
                                                color: accountType === typeOption ? '#d35400' : '#495057',
                                                border: accountType === typeOption ? '2px solid rgba(255, 123, 0, 0.3)' : '1px solid #e9ecef',
                                                borderRadius: '8px',
                                                padding: '12px 8px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                fontFamily: 'Arial, sans-serif',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {typeOption === 'All' ? 'All Types' : typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Role Section */}
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: '#495057',
                                    marginBottom: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontFamily: 'Arial, sans-serif'
                                }}>
                                    Role
                                </h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: '10px'
                                }}>
                                    <button
                                        onClick={() => setRole('')}
                                        style={{
                                            backgroundColor: !role ? 'rgba(255, 123, 0, 0.1)' : 'white',
                                            color: !role ? '#d35400' : '#495057',
                                            border: !role ? '2px solid rgba(255, 123, 0, 0.3)' : '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            padding: '12px 8px',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            fontFamily: 'Arial, sans-serif',
                                            transition: 'all 0.2s ease',
                                            textAlign: 'center'
                                        }}
                                    >
                                        All Roles
                                    </button>
                                    {roles.map(roleOption => (
                                        <button
                                            key={roleOption.value}
                                            onClick={() => setRole(roleOption.value)}
                                            style={{
                                                backgroundColor: role === roleOption.value ? 'rgba(255, 123, 0, 0.1)' : 'white',
                                                color: role === roleOption.value ? '#d35400' : '#495057',
                                                border: role === roleOption.value ? '2px solid rgba(255, 123, 0, 0.3)' : '1px solid #e9ecef',
                                                borderRadius: '8px',
                                                padding: '12px 8px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                fontFamily: 'Arial, sans-serif',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {roleOption.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: '20px',
                                    paddingTop: '20px',
                                    borderTop: '1px solid #e9ecef'
                                }}>
                                    <button
                                        onClick={() => {
                                            clearFilters();
                                            setTypeMenuOpen(false);
                                        }}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '12px 30px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontFamily: 'Arial, sans-serif',
                                            transition: 'all 0.2s ease',
                                            minWidth: '200px'
                                        }}
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skills Dropdown Menu */}
                    {skillsMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            borderTop: '1px solid #e9ecef',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            padding: '20px',
                            maxHeight: '60vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: '10px'
                            }}>
                                {skills.map(skill => (
                                    <button
                                        key={skill}
                                        onClick={() => toggleSkill(skill)}
                                        style={{
                                            backgroundColor: selectedSkills.includes(skill) ? 'rgba(255, 123, 0, 0.1)' : 'white',
                                            color: selectedSkills.includes(skill) ? '#d35400' : '#495057',
                                            border: selectedSkills.includes(skill) ? '2px solid rgba(255, 123, 0, 0.3)' : '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            padding: '12px 8px',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            fontFamily: 'Arial, sans-serif',
                                            transition: 'all 0.2s ease',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: '20px',
                                    paddingTop: '20px',
                                    borderTop: '1px solid #e9ecef'
                                }}>
                                    <button
                                        onClick={() => {
                                            clearFilters();
                                            setSkillsMenuOpen(false);
                                        }}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '12px 30px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontFamily: 'Arial, sans-serif',
                                            transition: 'all 0.2s ease',
                                            minWidth: '200px'
                                        }}
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sort Dropdown Menu */}
                    {sortMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            borderTop: '1px solid #e9ecef',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            padding: '20px',
                            maxHeight: '60vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                gap: '10px'
                            }}>
                                {sortOptions.map(sortOption => (
                                    <button
                                        key={sortOption.value}
                                        onClick={() => {
                                            setSortBy(sortOption.value);
                                            setSortMenuOpen(false);
                                        }}
                                        style={{
                                            backgroundColor: sortBy === sortOption.value ? 'rgba(255, 123, 0, 0.1)' : 'white',
                                            color: sortBy === sortOption.value ? '#d35400' : '#495057',
                                            border: sortBy === sortOption.value ? '2px solid rgba(255, 123, 0, 0.3)' : '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            padding: '12px 8px',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            fontFamily: 'Arial, sans-serif',
                                            transition: 'all 0.2s ease',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {sortOption.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop Filters Section */}
            {windowWidth >= 1000 && (
                <div style={{
                    width: '100%',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    padding: '15px 15px',
                    borderBottom: '1px solid #e9ecef',
                    marginTop: '80px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '25px',
                    marginLeft: '2rem',
                }}>
                    {/* Main filters row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '20px',
                        marginLeft: '2rem',
                        flexWrap: 'wrap'
                    }}>
                        {/* Account Type filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '160px' }}>
                            <label style={{
                                fontSize: '0.8rem',
                                marginBottom: '4px',
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
                                    padding: '5px 8px',
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
                                {accountTypes.map(typeOption => (
                                    <option key={typeOption} value={typeOption}>
                                        {typeOption === 'All' ? 'All Types' : typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Role filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px' }}>
                            <label style={{
                                fontSize: '0.8rem',
                                marginBottom: '4px',
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
                                    padding: '5px 8px',
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
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: '200px',
                            flex: '0 0 auto'
                        }}>
                            <label style={{
                                fontSize: '0.8rem',
                                marginBottom: '4px',
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
                                minWidth: '100px',
                                minHeight: '20px',
                                padding: '5px',
                                border: '1px solid #e9ecef',
                                borderRadius: '6px',
                                backgroundColor: 'white',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                width: 'fit-content',
                                maxWidth: '600px'
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
                                            gap: '4px',
                                            flexShrink: 0
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
                                        color: '#6c757d',
                                        flexShrink: 0
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
                        {/* Sort By filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '160px' }}>
                            <label style={{
                                fontSize: '0.8rem',
                                marginBottom: '4px',
                                fontWeight: '600',
                                color: '#495057',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontFamily: 'Arial, sans-serif'
                            }}>
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    padding: '5px 8px',
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
                                {sortOptions.map(sortOption => (
                                    <option key={sortOption.value} value={sortOption.value}>
                                        {sortOption.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        <div style={{
                            display: 'flex',
                            position: 'relative',
                            top: '20px',
                            alignItems: 'flex-end',
                            height: '30px'
                        }}>
                            <button
                                onClick={clearFilters}
                                style={{
                                    backgroundColor: hasActiveFilters ? '#dc3545' : '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    padding: '6px 12px',
                                    cursor: hasActiveFilters ? 'pointer' : 'not-allowed',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Arial, sans-serif',
                                    height: '42px',
                                    opacity: hasActiveFilters ? 1 : 0.6
                                }}
                                onMouseEnter={(e) => {
                                    if (hasActiveFilters) {
                                        e.currentTarget.style.backgroundColor = '#c82333';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (hasActiveFilters) {
                                        e.currentTarget.style.backgroundColor = '#dc3545';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                                disabled={!hasActiveFilters}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Section */}
            <div className="hero-members-containerStyle" style={{
               
                background: 'none',
                marginTop: '0rem',
                padding: '0 2rem'
            }}>
                {/* Title aligned to the left */}
                <div style={{
                    width: '100%',
                    marginBottom: '2rem',
                    marginLeft: '2rem'
                }}>
                    <p style={{
                        fontSize: '2.0rem',

                        color: '#616161ff',
                        marginBottom: '0.5rem',
                        fontFamily: 'Arial, sans-serif',
                        letterSpacing: '0.5px'
                    }}>
                        Members
                    </p>

                    {/* Show filter results info - If filters are active */}
                    {hasActiveFilters && (
                        <p style={{
                            fontFamily: 'Arial, sans-serif',
                            color: '#6c757d',
                            fontSize: '1rem',
                            marginBottom: '1rem'
                        }}>
                            {filteredUsers.length} {filteredUsers.length === 1 ? 'member found' : 'members found'}
                        </p>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div style={{ display: 'flex', marginTop: '5rem', justifySelf: 'center' }}>
                        <Mosaic color="#000000ff" size="small" text="" textColor="#f58800" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="error-block">
                        <div className="emoji-2xl">❌</div>
                        {error}
                        <br />
                        <button
                            onClick={loadUsers}
                            className="retry-button"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* No Users State */}
                {!loading && !error && users.length === 0 && (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        marginTop: '2rem',
                        padding: '100px',
                        textAlign: 'center',
                        color: '#6c757d',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        border: '1px solid #e9ecef',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#495057' }}>
                            👥 No Community Members
                        </div>
                        <div style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                            There are no community members available yet.
                        </div>
                    </div>
                )}

                {/* Users Grid */}
                {!loading && !error && users.length > 0 && (
                    <>
                        {/* Filters active but no result */}
                        {hasActiveFilters && filteredUsers.length === 0 ? (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '3rem',
                                color: '#6b7280'
                            }}>
                                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No members found</p>
                                <p style={{ fontSize: '0.9rem' }}>
                                    No members match your current filters. Try adjusting or clearing them.
                                </p>
                            </div>
                        ) : (
                            // Users grid
                            <div className="creators-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '1rem',
                                width: '100%',
                                margin: '0 auto'
                            }}>
                                {(hasActiveFilters ? usersWithModels : usersWithModels).map((creator) => (
                                    <div key={creator.uid} className="creator-card" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '1.25rem',
                                        marginTop: '0',
                                        gap: '0.75rem',
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        border: '1px solid #e9ecef',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}

                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                        }}
                                    >
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
                                                onError={(e) => (e.target.src = "/profile.png")}
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
                                                    {creator.role ? getRoleLabel(creator.role) : 'No role specified'}
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
                                        {creator.previewModels && creator.previewModels.length > 0 ? (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, 1fr)',
                                                gap: '0.5rem',
                                                margin: '0'
                                            }}>
                                                {creator.previewModels.map((model) => (
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
                                                            src={model.previewImages?.[0] || '/default-model-preview.png'}
                                                            alt={model.title}
                                                            onError={(e) => (e.target.src = '/default-model-preview.png')}
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
                                                alignItems: 'center',

                                            }}>
                                                <img
                                                    src="/modelPlaceholder.png"
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
                                                    <span style={{ fontWeight: '600' }}>{creator.followers || 0} followers</span>
                                                    <span style={{ color: '#d1d5db' }}>•</span>
                                                    <span style={{ fontWeight: '600' }}>{creator.modelsCount || 0} models</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => creator.uid !== currentUser?.uid ?
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
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            {!loading && (<div style={{ marginTop: '4rem' , width:'100%'}}>
                <Footer />
            </div>)}

        </div>
    );
}

export default CommunityMembers;