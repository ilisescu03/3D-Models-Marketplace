import { useEffect, useState } from "react";
import Header from "../UI+UX/Header";
import Footer from "../UI+UX/Footer.jsx";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getModels } from '/backend/models.js';
import '/frontend/css/Home.css';
import { Mosaic } from "react-loading-indicators";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from '/backend/firebase.js';

function MyLibrary() {
    const navigate = useNavigate();
    const { currentUser, userLogedIn } = useAuth();
    const [myModels, setMyModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [boughtModelsIds, setBoughtModelsIds] = useState([]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [searchQuery, setSearchQuery] = useState('');

    // Check if user is logged in
    useEffect(() => {
        if (!userLogedIn) {
            navigate('/');
            return;
        }
    }, [userLogedIn, navigate]);

    // Track window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch bought_models, downloads, and downloadedModels from user document
    useEffect(() => {
        if (!currentUser) return;

        const fetchUserModels = async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const boughtModels = userData.bought_models || [];
                    const downloadedModels = userData.downloads || [];
                    const downloadedModelsList = userData.downloadedModels || [];
                    
                    // Combine all arrays and remove duplicates using Set
                    const allModelIds = [...new Set([...boughtModels, ...downloadedModels, ...downloadedModelsList])];
                    setBoughtModelsIds(allModelIds);
                }
            } catch (err) {
                console.error("Error fetching user models:", err);
            }
        };

        fetchUserModels();
    }, [currentUser]);

    // Load all models and filter by bought_models
    useEffect(() => {
        const loadModels = async () => {
            if (boughtModelsIds.length === 0) {
                setMyModels([]);
                setFilteredModels([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch all public models
                const result = await getModels(
                    { isPublic: true },
                    null,
                    100
                );

                if (result.success) {
                    // Filter models to only include bought ones
                    const filteredModels = result.models.filter(model => 
                        boughtModelsIds.includes(model.id)
                    );
                    setMyModels(filteredModels);
                    setFilteredModels(filteredModels);
                } else {
                    setError(result.message || "Failed to load models");
                }
            } catch (err) {
                console.error("Error loading models:", err);
                setError("Failed to load your library. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (boughtModelsIds.length > 0) {
            loadModels();
        } else if (boughtModelsIds.length === 0) {
            setLoading(false);
        }
    }, [boughtModelsIds]);

    // Filter models by search query (name or tags)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredModels(myModels);
            return;
        }

        const searchLower = searchQuery.toLowerCase().trim();
        const filtered = myModels.filter(model => {
            // Search by title
            if (model.title && model.title.toLowerCase().includes(searchLower)) {
                return true;
            }
            // Search by tags
            if (model.tags && Array.isArray(model.tags)) {
                return model.tags.some(tag => 
                    tag.toLowerCase().includes(searchLower)
                );
            }
            return false;
        });

        setFilteredModels(filtered);
    }, [searchQuery, myModels]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Handle Enter key in search input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    // Handle click on model card to navigate to model details
    const handleCardClick = (modelId) => {
        window.location.href = `/model/${modelId}`;
    };

    // Get thumbnail image for model, fallback to default if not available
    const getModelThumbnail = (model) => {
        if (model.previewImages && model.previewImages.length > 0) {
            return model.previewImages[0];
        }
        return '/default-model-preview.png';
    };

    useEffect(() => {
        document.title = 'My Library - ShapeHive';
    }, []);

    return (
        <div className="home-background" style={{ background: '#f3f3f3ff', minHeight: '100vh' }}>
            <Header />
            <CookiesBanner />

            {/* Page Title */}
            <div style={{
                marginTop: userLogedIn ? '80px' : '0px',
                padding: '40px 20px 20px 20px',
                textAlign: 'center',
                marginBottom: '20px'
            }}>
                <h1 style={{
                    fontSize: windowWidth < 768 ? '1.8rem' : '2.5rem',
                    fontWeight: 'bold',
                    color: '#333',
                    margin: 0,
                    fontFamily: 'Arial, sans-serif'
                }}>
                    My Library
                </h1>
                <p style={{
                    fontSize: '1rem',
                    color: '#666',
                    marginTop: '10px',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    Your purchased 3D models collection
                </p>
            </div>

            {/* Search Bar */}
            {!loading && !error && myModels.length > 0 && (
                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto 30px auto',
                    padding: '0 20px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
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
                        >
                            <img src="/SearchBtn.png" alt="Search" style={{
                                height: '18px',
                                filter: 'invert(45%) sepia(90%) saturate(1500%) hue-rotate(10deg) brightness(100%) contrast(100%)'
                            }} />
                        </button>
                        <input
                            type="text"
                            placeholder="Search models by name or tags..."
                            value={searchQuery}
                            onChange={handleSearchChange}
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
                </div>
            )}

            {/* Models Section */}
            <div className="models-container" style={{ 
                background: 'none', 
                marginTop: 0,
                paddingTop: '20px'
            }}>
                <div className="models-content">
                    {/* Loading State */}
                    {loading && (
                        <div style={{ display: 'flex', marginTop: '5rem', justifyContent: 'center' }}>
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
                                onClick={() => window.location.reload()}
                                className="retry-button"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* No Models State - User hasn't purchased anything */}
                    {!loading && !error && boughtModelsIds.length === 0 && (
                        <div className="no-models">
                            <div className="no-models-icon">📚</div>
                            <div className="no-models-title">Your Library is Empty</div>
                            <div className="no-models-text">
                                You haven't purchased any 3D models yet.
                                <div style={{ marginTop: '15px' }}>
                                    <button
                                        onClick={() => navigate('/3d-models')}
                                        className="primary-btn"
                                    >
                                        Browse Models
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No Models State - Bought IDs but models not found */}
                    {!loading && !error && boughtModelsIds.length > 0 && myModels.length === 0 && (
                        <div className="no-models">
                            <div className="no-models-icon">🔍</div>
                            <div className="no-models-title">Models Not Available</div>
                            <div className="no-models-text">
                                Some of your purchased models are no longer available.
                                <div style={{ marginTop: '15px' }}>
                                    <button
                                        onClick={() => navigate('/3d-models')}
                                        className="primary-btn"
                                    >
                                        Browse More Models
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Models Grid */}
                    {!loading && !error && myModels.length > 0 && (
                        <>
                            <p style={{
                                textAlign: 'left',
                                marginLeft: '1rem',
                                fontFamily: 'Arial, sans-serif',
                                color: '#6c757d',
                                fontSize: '1rem',
                                marginBottom: '1rem'
                            }}>
                                {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'} found
                                {searchQuery && ` matching "${searchQuery}"`}
                        </p>

                            {filteredModels.length === 0 ? (
                                <div className="no-models">
                                    <div className="no-models-icon">🔍</div>
                                    <div className="no-models-title">No Results Found</div>
                                    <div className="no-models-text">
                                        No models match your search. Try different keywords.
                                    </div>
                                </div>
                            ) : (
                                <div className="models-grid">
                                    {filteredModels.map((model) => (
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

            <div style={{ marginTop: '4rem', width: '100%' }}>
                <Footer />
            </div>
        </div>
    );
}

export default MyLibrary;

