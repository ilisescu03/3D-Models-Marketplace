import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Search() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('model');
    const [category, setCategory] = useState('');
    const [accountType, setAccountType] = useState('');
    const [role, setRole] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);

    // Data for comboboxes (taken from Settings.jsx)
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

    // Function for selecting/deselecting skills
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

    return (
        <div style={{ 
            backgroundColor: '#f8f9fa', 
            minHeight: '100vh',
            paddingTop: '140px'
        }}>
            {/* Custom search header */}
            <div style={{
                position: 'fixed',
                top: '0',
                left: '0',
                
                width: '95.5%',
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: 1000,
                padding: '10px 25px',
                borderBottom: '1px solid #e9ecef'
            }}>
                {/* First line - Search bar and Cancel button */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '20px'
                }}>
                     <button 
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
                    </button>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '90%',
                        
                        position: 'relative'
                    }}>
                        <button style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '10px 12px',
                            position: 'absolute',
                            left: '0',
                            zIndex: 2
                        }}>
                            <img src="/SearchBtn.png" alt="Search" style={{ 
                                height: '18px',
                                filter: 'invert(45%) sepia(90%) saturate(1500%) hue-rotate(10deg) brightness(100%) contrast(100%)'
                            }} />
                        </button>
                        <input
                            type="text"
                            placeholder={placeholderText}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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

                {/* Second line - Filters */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '25px',
                    flexWrap: 'wrap'
                }}>
                    {/* Combobox for search type */}
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

                    {/* Filters for Models */}
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

                    {/* Filters for Users */}
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

                            {/* Skills (Multi-select) */}
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

            {/* Main content */}
            <div style={{ padding: '30px 50px' }}>
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
                        🔍 Search Results
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                        Enter your search criteria above to find {searchType === 'model' ? '3D models' : 'users'}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Search;