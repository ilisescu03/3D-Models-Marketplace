import { useEffect, useState } from "react";
import Footer from '../UI+UX/Footer.jsx';
import Header from "../UI+UX/Header";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getModels } from '/backend/models.js';
import '/frontend/css/Home.css';
import { Mosaic } from "react-loading-indicators";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    const { currentUser, userLogedIn } = useAuth();
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");


    const [activeSlide, setActiveSlide] = useState(0);
    const [animationKey, setAnimationKey] = useState(0);
    const [animationDirection, setAnimationDirection] = useState('right');

    useEffect(() => {
        console.log("=== HOME PAGE AUTH STATE ===");
        console.log("currentUser:", currentUser);
        console.log("userLogedIn:", userLogedIn);
        loadModels();
    }, [currentUser, userLogedIn]);

    const handleCategoryNavigation = (category) => {
        localStorage.setItem('autoFilterCategory', category);
        navigate('/3d-models');
    };

    const loadModels = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getModels({ isPublic: true, orderBy: 'popularity', orderDirection: 'desc' }, null, 8);
            if (result.success) {
                setModels(result.models);
            } else {
                setError(result.message || "Failed to load models");
            }
        } catch (err) {
            console.error("Error loading models:", err);
            setError("Failed to load 3D models. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (modelId) => {
        window.location.href = `/model/${modelId}`;
    };

    const getModelThumbnail = (model) => {
        return model.previewImages?.[0] || '/default-model-preview.png';
    };

  
    const handleArrowClick = (direction) => {
        setAnimationDirection(direction);
        setActiveSlide(prev => (prev === 0 ? 1 : 0));
        setAnimationKey(prev => prev + 1); 
    };

    useEffect(() => {
        document.title = 'ShapeHive';
    }, []);

    return (
        <div className="home-background">
            <Header />
            <CookiesBanner />

            <div className="hero-section">
                <div className="hero-content">
                    {/*Text column */}
                    <div className="hero-text">
                        {userLogedIn ? (
                            // --- LOGGED IN + CAROUSEL---
                            <div className="hero-carousel-container">
                                <button className="carousel-arrow left" onClick={() => handleArrowClick('left')}>
                                    &#8249;
                                </button>
                                <div key={animationKey} className={`hero-slide-content ${animationDirection === 'left' ? 'animate-from-left' : 'animate-from-right'}`}>
                                    {activeSlide === 0 ? (
                                        <>
                                            <h1 className="hero-title">Craft Your World, Model by Model.</h1>
                                            <p className="hero-description">
                                                From a single blade of grass to a sprawling metropolis, find the building blocks for your next creation.
                                            </p>
                                            <div className="hero-cta-group">
                                                <button className="hero-cta-button" onClick={() => handleCategoryNavigation('Character')}>Explore Characters</button>
                                                <button className="hero-cta-button" onClick={() => handleCategoryNavigation('Environment')}>Discover Environments</button>
                                                <button className="hero-cta-button" onClick={() => handleCategoryNavigation('Vehicle')}>Find Vehicles</button>
                                                <button className="hero-cta-button" onClick={() => handleCategoryNavigation('Architecture')}>Build your city</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h1 className="hero-title">Show Your Art.</h1>
                                            <p className="hero-description">
                                                Upload your 3D models and share your passion with a global community of artists and developers.
                                            </p>
                                            <div className="hero-cta-group">
                                                <button className="hero-cta-button" onClick={() => navigate('/upload')}>
                                                    Upload Now
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button className="carousel-arrow right" onClick={() => handleArrowClick('right')}>
                                    &#8250;
                                </button>
                            </div>
                        ) : (
                            // --- LOGGED OUT ---
                            <>
                                <h1 className="hero-title">Step into a Universe of Creators.</h1>
                                <p className="hero-description">
                                    Unlock unlimited downloads, share your creations, and connect with a global community of 3D artists. Your next project starts here.
                                </p>
                                <div className="hero-cta-group">
                                    <button className="hero-cta-button" onClick={() => navigate('/signup')}>
                                        Join the Hive
                                    </button>
                                    <button className="hero-cta-button" onClick={() => { /* No action for now */ }}>
                                        See Pricing Plans
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Image column */}
                    <div className="hero-image-container">
                        <img
                            src="Home.png"
                            alt="3D Characters exploring a world"
                            className="hero-image"
                        />
                    </div>
                </div>
            </div>

            {/* Models Section */}
            <div className="models-container">
                <div className="models-content">
                    <h2 className="home-section-title">Featured Models</h2>
                    <p className="section-subtitle">
                        Explore our latest collection of high-quality 3D models, ready for download and use in your projects
                    </p>

                    {loading && (
                        <div style={{ display: 'flex', marginTop: '5rem', justifySelf: 'center' }}>
                            <Mosaic color="#000000ff" size="small" text="" textColor="#f58800" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="error-block">
                            <div className="emoji-2xl">❌</div>
                            {error}
                            <br />
                            <button onClick={loadModels} className="retry-button">Try Again</button>
                        </div>
                    )}

                    {!loading && !error && models.length === 0 && (
                        <div className="no-models">
                            <div className="no-models-icon">🎨</div>
                            <div className="no-models-title">No Models Yet</div>
                            <div className="no-models-text">
                                Be the first to share your amazing 3D creations with the community!
                                {userLogedIn && (
                                    <div style={{ marginTop: '15px' }}>
                                        <button onClick={() => window.location.href = '/upload'} className="primary-btn">
                                            Upload Your First Model
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && !error && models.length > 0 && (
                        <div className="models-grid">
                            {models.map((model) => (
                                <div key={model.id} className="model-card" onClick={() => handleCardClick(model.id)}>
                                    <img
                                        src={getModelThumbnail(model)}
                                        loading="lazy"
                                        alt={model.title}
                                        className="model-image"
                                        onError={(e) => { e.target.src = '/default-model-preview.png'; }}
                                    />
                                    <div className="model-content">
                                        <div className="model-header">
                                            <div className="model-header-left">
                                                <img
                                                    loading="lazy"
                                                    src={model.creatorProfilePicture || '/profile.png'}
                                                    alt={model.creatorUsername}
                                                    className="model-creator-avatar"
                                                    onError={(e) => { e.target.src = '/profile.png'; }}
                                                />
                                                <h3 className="model-title-inline">{model.title}</h3>
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

                    {!loading && !error && models.length > 0 && (
                        <div className="load-more-container">
                            <button className="load-more-btn" onClick={() => navigate('/3d-models')}>
                                Load More Models
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ width: '100%', background: '#ffffffff' }}>
                <Footer />
            </div>
        </div>
    );
}

export default Home;