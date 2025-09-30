import { useEffect, useState } from "react";
import Header from "../UI+UX/Header";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getModels } from '/backend/models.js';
import '/frontend/css/Home.css';
import { Mosaic } from "react-loading-indicators";
function Home() {
    // Authentication state and user data
    const { currentUser, userLogedIn } = useAuth();
    // State for storing models data
    const [models, setModels] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);

    // Effect to load models when component mounts or auth state changes
    useEffect(() => {
        console.log("=== HOME PAGE AUTH STATE ===");
        console.log("currentUser:", currentUser);
        console.log("userLogedIn:", userLogedIn);

        loadModels();
    }, [currentUser, userLogedIn]);

    // Function to load models from backend
    const loadModels = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log("Loading models for home page...");
            // Fetch public models with limit of 12
            const result = await getModels(
                { isPublic: true }, // Only public models
                null, // No pagination yet
                12 // Load 12 models initially
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
        <div className="home-background">
            <Header />
            <CookiesBanner />

            {/* Hero Section - Currently empty but styled for future content */}
            <div className="hero-section">

            </div>

            {/* Models Section */}
            <div className="models-container">
                <div className="models-content">
                    <h2 className="home-section-title">Featured Models</h2>
                    <p className="section-subtitle">
                        Explore our latest collection of high-quality 3D models, ready for download and use in your projects
                    </p>

                    {/* Loading State */}
                    {loading && (
                        <div style={{ display: 'flex', marginTop: '5rem', justifySelf: 'center' }}
                        >
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
                            <div className="no-models-title">No Models Yet</div>
                            <div className="no-models-text">
                                Be the first to share your amazing 3D creations with the community!
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

                    {/* Models Grid */}
                    {!loading && !error && models.length > 0 && (
                        <div className="models-grid">
                            {models.map((model) => (
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
                                        {/* Single line with profile + title on left, stats on right */}
                                        <div className="model-header">
                                            <div className="model-header-left">
                                                <img
                                                    src={model.creatorProfilePicture || '/profile.png'}
                                                    alt={model.creatorUsername}
                                                    className="creator-avatar"
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


                                        {/* Compatible software list */}
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
                    {/* Load More Button (for future implementation) */}
                    {!loading && !error && models.length > 0 && (
                        <div className="load-more-container">
                            <button
                                className="load-more-btn"
                                onClick={() => {
                                    // TODO: Implement load more functionality
                                    alert('Load more functionality will be implemented soon!');
                                }}
                            >
                                Load More Models
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Home;