import { useEffect, useState } from "react";
import Header from "../UI+UX/Header";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getModels } from '/backend/models.js';
import '/frontend/css/Home.css';
import { Mosaic } from "react-loading-indicators";

function ModelsPage() {
    const [filteredModels, setFilteredModels] = useState([]);
    // Authentication state and user data
    const { currentUser, userLogedIn } = useAuth();
    // State for storing models data
    const [models, setModels] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);

    // Filter states
    const [type, setType] = useState('All');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [selectedSoftware, setSelectedSoftware] = useState([]);

    // Data for dropdowns
    const types = ['All', 'Model', 'Package'];

    const categories = [
        'Architecture', 'Character', 'Vehicle', 'Environment', 'Furniture',
        'Electronics', 'Jewelry', 'Weapons', 'Food & Drink', 'Plants', 'Animals',
        'Abstract', 'Mechanical', 'Fashion & Style', 'Sports', 'Culture & History', 'Other'
    ];

    const dateOptions = [
        'Newest', 'Oldest', 'Last Week', 'Last Month', 'Last Year'
    ];

    const softwareOptions = [
        "Blender", "Cinema4D", "AutoCAD", "ArchiCAD", "Maya",
        "3ds Max", "ZBrush", "Substance Painter", "Photoshop",
        "Godot", "Unity", "Unreal Engine"
    ];
    useEffect(() => {
        if (models.length > 0) {
            const filtered = filterModels(models);
            setFilteredModels(filtered);
        } else {
            setFilteredModels([]);
        }
    }, [models, type, category, date, selectedSoftware]);
    // Toggle software selection
    const toggleSoftware = (software) => {
        setSelectedSoftware(prev => {
            if (prev.includes(software)) {
                return prev.filter(s => s !== software);
            } else {
                return [...prev, software];
            }
        });
    };
    const filterModels = (modelsToFilter) => {
        let filtered = [...modelsToFilter];

        // Apply type filter
        if (type !== 'All') {
            filtered = filtered.filter(model => model.type === type);
        }

        // Apply category filter
        if (category) {
            filtered = filtered.filter(model => model.category === category);
        }

        // Apply date filter
        if (date) {
            const now = new Date();

            // Filter by period
            if (date !== 'Newest' && date !== 'Oldest') {
                filtered = filtered.filter(model => {
                    const modelDate = model.createdAt?.toDate?.() || new Date(model.createdAt);

                    switch (date) {
                        case 'Last Week':
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            return modelDate >= weekAgo;
                        case 'Last Month':
                            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                            return modelDate >= monthAgo;
                        case 'Last Year':
                            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                            return modelDate >= yearAgo;
                        default:
                            return true;
                    }
                });
            }

            //Sort if it's necessary
            if (date === 'Newest' || date === 'Oldest') {
                filtered = [...filtered].sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                    return date === 'Newest' ? dateB - dateA : dateA - dateB;
                });
            }
        }

        // Apply software filter
        if (selectedSoftware.length > 0) {
            filtered = filtered.filter(model => {
                const modelSoftware = model.software || [];
                return selectedSoftware.some(software =>
                    modelSoftware.includes(software)
                );
            });
        }

        return filtered;
    };
    useEffect(() => {
        // Read params from URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category');

        // Read filter from local storage
        const autoFilterCategory = localStorage.getItem('autoFilterCategory');

        if (categoryFromUrl && categories.includes(categoryFromUrl)) {
            setCategory(categoryFromUrl);
            // Delete the filter after using it
            localStorage.removeItem('autoFilterCategory');
        } else if (autoFilterCategory && categories.includes(autoFilterCategory)) {
            setCategory(autoFilterCategory);
            // Delete the filter after using it
            localStorage.removeItem('autoFilterCategory');
        }
    }, []);
    // Clear all filters
    const clearFilters = () => {
        setType('All');
        setCategory('');
        setDate('');
        setSelectedSoftware([]);
    };

    // Check if any filters are active
    const hasActiveFilters = type !== 'All' || category || date || selectedSoftware.length > 0;

    // Effect to load models when component mounts or auth state changes
    useEffect(() => {
        console.log("=== MODELS PAGE AUTH STATE ===");
        console.log("currentUser:", currentUser);
        console.log("userLogedIn:", userLogedIn);

        loadModels();
    }, [currentUser, userLogedIn]);

    // Function to load models from backend
    const loadModels = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log("Loading models for models page...");
            // Fetch ALL public models sorted by popularity (no limit)
            const result = await getModels(
                {
                    isPublic: true,
                    orderBy: 'popularity', // Sort by popularity
                    orderDirection: 'desc' // Descending order (most popular first)
                },
                null, // No pagination yet
                100 // Load more models (adjust as needed)
            );

            if (result.success) {
                console.log("Models loaded successfully:", result.models.length);
                setModels(result.models);
            } else {
                console.error("Failed to load models:", result.message);
                setError(result.message || "Failed to load models");
            }
        } catch (err) {
            console.error("Error loading models:", err);
            setError("Failed to load 3D models. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Handle click on model card to navigate to model details
    const handleCardClick = (modelId) => {
        console.log("Navigating to model:", modelId);
        window.location.href = `/model/${modelId}`;
    };

    // Get thumbnail image for model, fallback to default if not available
    const getModelThumbnail = (model) => {
        if (model.previewImages && model.previewImages.length > 0) {
            return model.previewImages[0];
        }
        // Fallback to a default 3D model image
        return '/default-model-preview.png';
    };

    return (
        <div className="home-background" style={{ background: '#f3f3f3ff', minHeight: '100vh' }}>
            <Header />
            <CookiesBanner />

            {/* Filters Section - Similar to Search.jsx */}
            <div style={{
                width: '100%',
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                padding: '20px 25px',
                borderBottom: '1px solid #e9ecef',
                marginTop: window.innerWidth >= 1000 ? '100px' : '100px',
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
                    marginLeft:'2rem',
                    flexWrap: 'wrap'
                }}>
                    {/* Type filter */}
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
                            Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
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
                            {types.map(typeOption => (
                                <option key={typeOption} value={typeOption}>
                                    {typeOption}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category filter */}
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

                    {/* Date filter */}
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
                            Date
                        </label>
                        <select
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
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
                            <option value="">Any Date</option>
                            {dateOptions.map(dateOption => (
                                <option key={dateOption} value={dateOption}>
                                    {dateOption}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Software Compatibility multi-select */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: '200px',
                        flex: '0 0 auto'
                    }}>
                        <label style={{
                            fontSize: '0.8rem',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#495057',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontFamily: 'Arial, sans-serif'
                        }}>
                            Software Compatibility
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
                            cursor: 'pointer',
                            width: 'fit-content',
                            maxWidth: '400px'
                        }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 123, 0, 0.8)';
                                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 123, 0, 0.1)';
                            }}
                        >
                            {selectedSoftware.map(software => (
                                <div
                                    key={software}
                                    onClick={() => toggleSoftware(software)}
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
                                    {software}
                                    <span style={{ fontSize: '12px', marginLeft: '2px' }}>×</span>
                                </div>
                            ))}
                            <select
                                value=""
                                onChange={(e) => {
                                    if (e.target.value && !selectedSoftware.includes(e.target.value)) {
                                        toggleSoftware(e.target.value);
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
                                <option value="">Add software...</option>
                                {softwareOptions
                                    .filter(software => !selectedSoftware.includes(software))
                                    .map(software => (
                                        <option key={software} value={software}>
                                            {software}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
              
                </div>

                {/* Clear Filters Button - Aligned to the right of software section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    height: '72px'
                }}>
                    <button
                        onClick={clearFilters}
                        style={{
                            backgroundColor: hasActiveFilters ? '#dc3545' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            padding: '10px 16px',
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
            {/* Models Section */ }
    <div className="models-container" style={{ background: 'none', marginTop: 0 }}>
        <div className="models-content">
            {/* Title aligned to the left */}
            <p style={{
                textAlign: 'left',
                marginLeft: '4rem',
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '0.5px',
                color: '#616161ff',
                fontSize: '2.0rem',
                marginTop: '-3rem',
                marginBottom: '1rem'
            }}>
                Models
            </p>

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
                        onClick={loadModels}
                        className="retry-button"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* No Models State */}
            {!loading && !error && models.length === 0 && (
                <div className="no-models">
                    <div className="no-models-icon">🎨</div>
                    <div className="no-models-title">No Models Available</div>
                    <div className="no-models-text">
                        There are no 3D models available yet.
                        {userLogedIn && (
                            <div style={{ marginTop: '15px' }}>
                                <button
                                    onClick={() => window.location.href = '/upload'}
                                    className="primary-btn"
                                >
                                    Upload Your First Model
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Models Grid */}
            {!loading && !error && models.length > 0 && (
                <>
                    {/* Show filter results info - If filters are active */}
                    {hasActiveFilters && (
                        <p style={{
                            textAlign: 'left',
                            marginLeft: '4rem',
                            fontFamily: 'Arial, sans-serif',
                            color: '#6c757d',
                            fontSize: '1rem',
                            marginBottom: '1rem'
                        }}>
                            {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'} found
                        </p>
                    )}

                    {/* Filters active but no result */}
                    {hasActiveFilters && filteredModels.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: '#6b7280',
                            marginLeft: '4rem'
                        }}>
                            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No models found</p>
                            <p style={{ fontSize: '0.9rem' }}>
                                No models match your current filters. Try adjusting or clearing them.
                            </p>
                        </div>
                    ) : (
                        //Filtered models grid
                        <div className="models-grid">
                            {(hasActiveFilters ? filteredModels : models).map((model) => (
                                <div
                                    key={model.id}
                                    className="model-card"
                                    onClick={() => handleCardClick(model.id)}
                                >
                                    <img
                                        src={getModelThumbnail(model)}
                                        alt={model.title}
                                        className="model-image"
                                        onError={(e) => {
                                            e.target.src = '/default-model-preview.png';
                                        }}
                                    />

                                    <div className="model-content">
                                        <div className="model-header">
                                            <div className="model-header-left">
                                                <img
                                                    src={model.creatorProfilePicture || '/profile.png'}
                                                    alt={model.creatorUsername}
                                                    className="model-creator-avatar"
                                                    onError={(e) => {
                                                        e.target.src = '/profile.png';
                                                    }}
                                                />
                                                <h3 className="model-title-inline">
                                                    {model.title}
                                                </h3>
                                            </div>

                                            <div className="model-header-right">
                                                <div className="stat-item" title="Comments">
                                                    <img src="/commentsIcon.png" alt="comments" className="stat-icon" />
                                                    <span>{model.comments?.length || 0}</span>
                                                </div>
                                                <div className="stat-item" title="Favorites">
                                                    <img src="/favIcon.png" alt="favorites" className="stat-icon" />
                                                    <span>{model.favorites || 0}</span>
                                                </div>
                                                <div className="stat-item" title="Downloads">
                                                    <img src="/downloadsIcon.png" alt="downloads" className="stat-icon" />
                                                    <span>{model.downloads || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {model.software && model.software.length > 0 && (
                                            <div className="compatible-softwares">
                                                <div className="softwares-list">
                                                    {model.software.slice(0, 3).map((software, idx) => (
                                                        <span key={idx} className="software-badge">
                                                            {software}
                                                        </span>
                                                    ))}
                                                    {model.software.length > 3 && (
                                                        <span className="software-badge">
                                                            +{model.software.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
        </div >
    );
}

export default ModelsPage;