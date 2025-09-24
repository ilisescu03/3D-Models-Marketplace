import { useEffect, useState } from "react";
import Header from "../UI+UX/Header";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getModels } from '/backend/models.js';

// Main container style with background image
const backgroundStyle = {
    backgroundImage: `url(/background.jpg)`,
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: "100vh",
    display: 'flex',
    fontFamily: 'Arial, sans-serif',
    flexDirection: 'column',
    alignItems: 'center',
};

// Hero section styling
const heroSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    textAlign: 'center',
    color: 'white',
    padding: '120px 20px 40px 20px'
};

// Hero title styling
const heroTitleStyle = {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
    letterSpacing: '-1px'
};

// Hero subtitle styling
const heroSubtitleStyle = {
    fontSize: '1.4rem',
    marginBottom: '30px',
    textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
    maxWidth: '600px',
    lineHeight: '1.6'
};

// Container for models section with gradient background
const modelsContainerStyle = {
    marginTop:'8rem',
    width: '100%',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(243, 243, 243, 1) 5%, #ffffffff 100%)',
    minHeight: '50vh',
    paddingTop: '100px',
    paddingBottom: '60px'
};

// Content wrapper for models section
const modelsContentStyle = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px'
};
// Section title styling
const sectionTitleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: '20px'
};
// Section subtitle styling
const sectionSubtitleStyle = {
    fontSize: '1.0rem',
    color: '#666',
    textAlign: 'center',
    marginBottom: '30px',
    maxWidth: '600px',
    margin: '0 auto 30px auto'
};
// Grid layout for model cards
const modelsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 280px))',
    gap: '20px',
    marginTop: '40px',
    justifyContent: 'center',
    width: '100%'
};
// Base model card styling
const modelCardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    width: '280px', 

    display: 'flex',
    flexDirection: 'column'
};
// Compatible software section styling
const compatibleSoftwaresStyle = {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #f0f0f0'
};
// Software list container styling
const softwaresListStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3px',
    marginTop: '4px'
};
// Individual software badge styling
const softwareBadgeStyle = {
    display: 'inline-block',
    backgroundColor: '#fdf0e8ff',
    color: '#cc4b00ff',
    padding: '1px 6px',
    borderRadius: '6px',
    fontSize: '0.6rem',
    fontWeight: '500'
};
// Hover state for model card
const modelCardHoverStyle = {
    ...modelCardStyle,
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)'
};
// Model image styling
const modelImageStyle = {
    width: '100%',
    height: '300px',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    aspectRatio: '1/1'
};

// Hover state for model image
const modelImageHoverStyle = {
    ...modelImageStyle,
    transform: 'scale(1.05)'
};

// Content area inside model card
const modelContentStyle = {
    padding: '15px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap:'8px',
};
// Model title styling
const modelTitleStyle = {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
};

// Model metadata styling
const modelMetaStyle = {
    fontSize: '0.7rem',
    color: '#666',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
};

// Category badge styling
const categoryBadgeStyle = {
    display: 'inline-block',
    backgroundColor: '#ff7b00',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '0.8rem',
    width: '25%',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: '8px'
};
// Loading state styling
const loadingStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    fontSize: '1.2rem'
};
// Error state styling
const errorStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#e74c3c',
    fontSize: '1.1rem'
};
// No models state styling
const noModelsStyle = {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#666'
};
// No models icon styling
const noModelsIconStyle = {
    fontSize: '4rem',
    marginBottom: '20px',
    opacity: '0.5'
};

// No models title styling
const noModelsTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '10px'
};
// No models text styling
const noModelsTextStyle = {
    fontSize: '1rem',
    lineHeight: '1.6'
};

function Home() {
   // Authentication state and user data
    const { currentUser, userLogedIn } = useAuth();
    // State for storing models data
    const [models, setModels] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track which card is hovered
    const [hoveredCard, setHoveredCard] = useState(null);

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
        <div style={backgroundStyle}>
            <Header />
            <CookiesBanner />

           {/* Hero Section - Currently empty but styled for future content */}
            <div style={heroSectionStyle}>

            </div>

            {/* Models Section */}
            <div style={modelsContainerStyle}>
                <div style={modelsContentStyle}>
                    <h2 style={sectionTitleStyle}>Featured Models</h2>
                    <p style={sectionSubtitleStyle}>
                        Explore our latest collection of high-quality 3D models, ready for download and use in your projects
                    </p>

                    {/* Loading State */}
                    {loading && (
                        <div style={loadingStyle}>
                            <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⏳</div>
                            Loading amazing 3D models...
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div style={errorStyle}>
                            <div style={{ fontSize: '2rem', marginBottom: '15px' }}>❌</div>
                            {error}
                            <br />
                            <button
                                onClick={loadModels}
                                style={{
                                    marginTop: '15px',
                                    padding: '10px 20px',
                                    backgroundColor: '#ff7b00',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* No Models State */}
                    {!loading && !error && models.length === 0 && (
                        <div style={noModelsStyle}>
                            <div style={noModelsIconStyle}>🎨</div>
                            <div style={noModelsTitleStyle}>No Models Yet</div>
                            <div style={noModelsTextStyle}>
                                Be the first to share your amazing 3D creations with the community!
                                {userLogedIn && (
                                    <div style={{ marginTop: '15px' }}>
                                        <button
                                            onClick={() => window.location.href = '/upload'}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: '#ff7b00',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: 'bold'
                                            }}
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
                        <div style={modelsGridStyle}>
                            {models.map((model, index) => (
                                <div
                                    key={model.id}
                                    style={hoveredCard === index ? modelCardHoverStyle : modelCardStyle}
                                    onClick={() => handleCardClick(model.id)}
                                    onMouseEnter={() => setHoveredCard(index)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <img
                                        src={getModelThumbnail(model)}
                                        alt={model.title}
                                        style={hoveredCard === index ? modelImageHoverStyle : modelImageStyle}
                                        onError={(e) => {
                                            e.target.src = '/default-model-preview.png';
                                        }}
                                    />

                                    <div style={modelContentStyle}>
                                        {/* Display category badge if available */}
                                        {model.category && (
                                            <div style={categoryBadgeStyle}>
                                                {model.category}
                                            </div>
                                        )}
                                        <h3 style={modelTitleStyle}>
                                            {model.title}
                                        </h3>
                                        {/* Creator information */}
                                        <div style={modelMetaStyle}>
                                          
                                            <span>Created by: <strong>{model.creatorUsername || 'Unknown'}</strong></span>
                                        </div>

                                      
                                        {/* Download and favorite counts */}
                                        <div style={modelMetaStyle}>
                                            
                                            <span>{model.downloads || 0} downloads</span>
                                            
                                            <span>{model.favorites || 0} favorites</span>
                                        </div>
                                         {/* Compatible software list */}
                                        {model.software && model.software.length > 0 && (
                                            <div style={compatibleSoftwaresStyle}>
                                                <div style={modelMetaStyle}>
                                               
                                                    <span>Compatible with:</span>
                                                </div>
                                                <div style={softwaresListStyle}>
                                                    {model.software.map((software, idx) => (
                                                        <span key={idx} style={softwareBadgeStyle}>
                                                            {software}
                                                        </span>
                                                    ))}
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
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <button
                                style={{
                                    padding: '12px 30px',
                                    backgroundColor: 'white',
                                    color: '#ff7b00',
                                    border: '2px solid #ff7b00',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#ff7b00';
                                    e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.color = '#ff7b00';
                                }}
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