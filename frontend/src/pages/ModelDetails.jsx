
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../UI+UX/Header";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getModelById } from '/backend/models.js';

//Background style
const backgroundStyle = {
    background: '#ecececff',
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
//Page container 
const containerStyle = {
    width: '90%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '120px 20px 60px 20px',
    boxSizing: 'border-box'
};

// Responsive grid
const contentStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '40px',
    alignItems: 'start'
};

// Media query for big screens
const contentStyleLarge = {
    ...contentStyle,
    gridTemplateColumns: '1fr 400px',
    gap: '40px',
    maxWidth: '100%',
    overflow: 'hidden'
};
//Left column style
const leftColumnStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
};

//Right column style
const rightColumnStyle = {
    position: 'relative',
    top: '0'
};

// Media for big screens
const rightColumnStyleLarge = {
    ...rightColumnStyle,
    position: 'sticky',
    top: '0px'
};
//Preview model card
const modelPreviewStyle = {
    backgroundColor: 'white',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    maxWidth: '100%'
};
//Preview Image style
const previewImageStyle = {
    width: '100%',
    height: '400px',
    objectFit: 'cover',
    display: 'block',
    cursor:'pointer'
};
//Style for the no peview case (if the upload works properly it's not the case)
const previewPlaceholderStyle = {
    width: '100%',
    height: '400px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: '1.2rem'
};
//Style for preview images array
const thumbnailsStyle = {
    display: 'flex',
    gap: '10px',
    padding: '15px',
    overflowX: 'auto'
};
//Preview image from array
const thumbnailStyle = {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '2px solid',
    borderColor:'transparent',
    transition: 'border-color 0.3s ease'
};
//Border style that show which image is active
const thumbnailActiveStyle = {
    ...thumbnailStyle,
    borderColor: '#ff7b00'
};
//Card for model info
const detailsCardStyle = {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '2rem',
    boxSizing: 'border-box',
    maxWidth: '100%',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
};
//Model in fo card title
const titleStyle = {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
    lineHeight: '1.2'
};

// Media query for title on mobile
const titleStyleMobile = {
    ...titleStyle,
    fontSize: '1.8rem'
};
//Creator container
const creatorStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    color: '#666',
    cursor: 'pointer'
};
//Creator s profile pic
const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover'
};
//Style for download favourites and likes
const statsStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '25px',
    paddingBottom: '25px',
    borderBottom: '1px solid #eee'
};

//Media query for mobile (stats)
const statsStyleMobile = {
    ...statsStyle,
    gap: '15px'
};

//Style for stat item 
const statItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
};
//Style for the value of the stat
const statValueStyle = {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#333'
};

//Media query for mobile( stat value)
const statValueStyleMobile = {
    ...statValueStyle,
    fontSize: '1.2rem'
};

//Stat label style (ex. Downloads)
const statLabelStyle = {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '5px'
};

//Stlye for description
const descriptionStyle = {
    marginBottom: '25px',
    lineHeight: '1.6',
    color: '#555'
};
//Specs grid style (Category, Type, etc.)
const specsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '25px'
};

// Specs grid for mobile style
const specsGridStyleMobile = {
    ...specsGridStyle,
    gridTemplateColumns: '1fr',
    gap: '10px'
};
//Spec item style
const specItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
};
//Spec label style(ex. Category)
const specLabelStyle = {
    marginTop:'1rem',
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500'
};
//Spec value style (ex. Vehicle)
const specValueStyle = {
    fontSize: '1rem',
    color: '#333',
    fontWeight: 'bold'
};
//Software list style
const softwareListStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px'
};
//Software badge style ( ex. blender, cinema4d, autocad, etc.)
const softwareBadgeStyle = {
    backgroundColor: '#fdeee8ff',
    color: '#cc4100ff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500'
};
//Style for download button
const downloadButtonStyle = {
    width: '100%',
    padding: '15px 30px',
    backgroundColor: '#ff7b00',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
};
//Style for download button in the case if the mouse is on the button
const downloadButtonHoverStyle = {
    ...downloadButtonStyle,
    backgroundColor: '#e66a00'
};
//Style for download buton icon

const downloadIconStyle = {
    width: '20px',
    height: '20px',
    filter: 'invert(1)'
};
//Style for action buttons container (add to favourite, share)
const actionButtonsStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px'
};

// Media query for mobile (action buttons)
const actionButtonsStyleMobile = {
    ...actionButtonsStyle,
    flexDirection: 'column'
};
//Style for action button
const actionButtonStyle = {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: 'white',
    color: '#333',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
};
//Style for action button in the case the mouse is on the button
const actionButtonHoverStyle = {
    ...actionButtonStyle,
    borderColor: '#ff7b00',
    color: '#ff7b00'
};
//Style for the files list
const fileListStyle = {
    marginTop: '20px'
};
//Style for file item
const fileItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0'
};

//Styles for file elements
const fileNameStyle = {
    fontSize: '0.9rem',
    color: '#333'
};

const fileSizeStyle = {
    fontSize: '0.8rem',
    color: '#666'
};

//Loading style
const loadingStyle = {
    textAlign: 'center',
    padding: '100px 20px',
    color: '#666',
    fontSize: '1.2rem'
};
//Error style
const errorStyle = {
    textAlign: 'center',
    padding: '100px 20px',
    color: '#e74c3c',
    fontSize: '1.1rem'
};

//Fixing the screen responsing
const responsiveFixStyle = {
    maxWidth: '100%',
    overflow: 'hidden'
};
//Full view for image
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    cursor: 'pointer'
};
//Content for full image view
const modalContentStyle = {
    position: 'relative',
    maxWidth: '90%',
    maxHeight: '90%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
};
//Image view
const modalImageStyle = {
    maxWidth: '80%',
    maxHeight: '760px',
    objectFit: 'contain'
};
//Close button style
const closeButtonStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1001
};
//Nav buttons
const navigationButtonStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    color: 'white',
    fontSize: '2.5rem',
    cursor: 'pointer',
    width: '50px',
    height: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%'
};

const prevButtonStyle = {
    ...navigationButtonStyle,
    left: '20px'
};

const nextButtonStyle = {
    ...navigationButtonStyle,
    right: '20px'
};

//Screen size handle
const useScreenSize = () => {
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);
    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth >= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isLargeScreen;
};
function ModelDetails() {
    const { modelId } = useParams(); // To identify the model that should be displayed
    const { currentUser, userLogedIn } = useAuth(); //To identify the user
    const [username, setUsername] = useState(""); //To identify the username of the user
    const [model, setModel] = useState(null); //Model details
    const [loading, setLoading] = useState(true); //To check if the page is loading
    const [error, setError] = useState(null); //Errors
    const [selectedImageIndex, setSelectedImageIndex] = useState(0); //Which preview image is selected
    const [isDownloadHovered, setIsDownloadHovered] = useState(false); //Check if mouse is on the button
    const [isModalOpen, setIsModalOpen] = useState(false); //Check if the full view of the images is active
    const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0); //Current image to show on full view
    const isLargeScreen = useScreenSize(); //Check the screen size

    //Open the image full view
    const openModal = (index) => {
        setCurrentModalImageIndex(index);
        setIsModalOpen(true);
    };

    //Close the image full view
    const closeModal = () => {
        setIsModalOpen(false);
    };

    //Handle prev image
    const goToPrevImage = (e) => {
        e.stopPropagation();
        if (model.previewImages && model.previewImages.length > 0) {
            setCurrentModalImageIndex(prev =>
                prev === 0 ? model.previewImages.length - 1 : prev - 1
            );
        }
    };

    //Handle next image
    const goToNextImage = (e) => {
        e.stopPropagation();
        if (model.previewImages && model.previewImages.length > 0) {
            setCurrentModalImageIndex(prev =>
                prev === model.previewImages.length - 1 ? 0 : prev + 1
            );
        }
    };

    // Use effect for setting the username
    useEffect(() => {
        console.log("=== SETTING AUTHENTICATED USER USERNAME ===");

        const fetchUsername = async () => {
            if (currentUser && userLogedIn) {
                console.log("Authenticated user:", currentUser);

                try {
                    // Firestore imports
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('/backend/firebase.js'); 
                    // Get firestore doc
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const actualUsername = userData.username;

                        if (actualUsername) {
                            setUsername(actualUsername);
                            console.log("Username set from Firestore:", actualUsername);
                        } else {
                            // Fallback to email if the username doesn't exist
                            const usernameFromEmail = currentUser.email ? currentUser.email.split('@')[0] : 'Unknown';
                            setUsername(usernameFromEmail);
                            console.log("Username generated from email:", usernameFromEmail);
                        }
                    } else {
                        console.log("User document not found in Firestore");
                        const usernameFromEmail = currentUser.email ? currentUser.email.split('@')[0] : 'Unknown';
                        setUsername(usernameFromEmail);
                    }
                } catch (error) {
                    console.error("Error fetching user data from Firestore:", error);
                    // Fallback for error case
                    const usernameFromEmail = currentUser.email ? currentUser.email.split('@')[0] : 'Unknown';
                    setUsername(usernameFromEmail);
                }
            } else {
                console.log("No user authenticated or user not logged in");
                setUsername("");
            }
        };

        fetchUsername();
    }, [currentUser, userLogedIn]);
    //Load model details
    useEffect(() => {
        console.log("=== LOADING MODEL DETAILS ===");
        console.log("Model ID:", modelId);

        loadModelDetails();
    }, [modelId]);

    const loadModelDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getModelById(modelId);

            if (result.success) {
                console.log("Model loaded successfully:", result.model);
                setModel(result.model);
            } else {
                console.error("Failed to load model:", result.message);
                setError(result.message || "Model not found");
            }
        } catch (err) {
            console.error("Error loading model details:", err);
            setError("Failed to load model details. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    //DOWNLOAD
    const handleDownload = () => {
        console.log("Download initiated for model:", modelId);
        // TODO: Implement download functionality
        alert('Download functionality will be implemented soon!');
    };

    
    //ADD TO FAVOURITES
    const handleFavorite = () => {
        console.log("Add to favorites:", modelId);
        // TODO: Implement favorite functionality
        alert('Favorite functionality will be implemented soon!');
    };

    const handleShare = () => {
        console.log("Share model:", modelId);
        // TODO: Implement share functionality
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    //Loading screen
    if (loading) {
        return (
            <div style={backgroundStyle}>
                <Header />
                <CookiesBanner />
                <div style={loadingStyle}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
                    Loading model details...
                </div>
            </div>
        );
    }

    //Error screen
    if (error) {
        return (
            <div style={backgroundStyle}>
                <Header />
                <CookiesBanner />
                <div style={errorStyle}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>❌</div>
                    {error}
                    <br />
                    <button
                        onClick={loadModelDetails}
                        style={{
                            marginTop: '20px',
                            padding: '12px 24px',
                            backgroundColor: '#ff7b00',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    //If the model doesn't exist screen
    if (!model) {
        return (
            <div style={backgroundStyle}>
                <Header />
                <CookiesBanner />
                <div style={errorStyle}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                    Model not found
                </div>
            </div>
        );
    }

    
    return (
        <div style={{ ...backgroundStyle, ...responsiveFixStyle }}>
            <Header />
            <CookiesBanner />

            <div style={containerStyle}>
                <div style={isLargeScreen ? { ...contentStyleLarge, ...responsiveFixStyle } : { ...contentStyle, ...responsiveFixStyle }}>
                    {/* Left Column - Model Preview and Details */}
                    <div style={{ ...leftColumnStyle, ...responsiveFixStyle }}>
                        {/* Model Preview */}
                        <div style={modelPreviewStyle}>
                            {model.previewImages && model.previewImages.length > 0 ? (
                                <img
                                    onClick={() => openModal(selectedImageIndex)}
                                    src={model.previewImages[selectedImageIndex]}
                                    alt={model.title}
                                    style={previewImageStyle}
                                    onError={(e) => {
                                        e.target.src = '/default-model-preview.png';
                                    }}
                                />
                            ) : (
                                <div style={previewPlaceholderStyle}>
                                    🎨 No Preview Available
                                </div>
                            )}

                            {/* Thumbnails */}
                            {model.previewImages && model.previewImages.length > 1 && (
                                <div style={thumbnailsStyle}>
                                    {model.previewImages.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`Preview ${index + 1}`}
                                            style={selectedImageIndex === index ? thumbnailActiveStyle : thumbnailStyle}
                                            onClick={() => setSelectedImageIndex(index)}
                                            onError={(e) => {
                                                e.target.src = '/default-model-preview.png';
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Model Details */}
                        <div style={detailsCardStyle}>
                            <h1 style={isLargeScreen ? titleStyle : titleStyleMobile}>{model.title}</h1>
                            {/* Creator info */}
                            <div
                                style={creatorStyle}
                                onClick={() => window.location.href = username === model.creatorUsername ? '/dashboard' : `/user/${model.creatorUsername}`}
                            >
                                <img
                                    src={model.creatorProfilePicture || '/default-avatar.png'}
                                    alt={model.creatorUsername}
                                    style={avatarStyle}
                                    onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                    }}
                                />
                                <span>Created by <strong>{model.creatorUsername}</strong></span>
                            </div>
                            {/* Stats */}
                            <div style={isLargeScreen ? statsStyle : statsStyleMobile}>
                                <div style={statItemStyle}>
                                    <span style={isLargeScreen ? statValueStyle : statValueStyleMobile}>
                                        {model.downloads || 0}
                                    </span>
                                    <span style={statLabelStyle}>Downloads</span>
                                </div>
                                <div style={statItemStyle}>
                                    <span style={isLargeScreen ? statValueStyle : statValueStyleMobile}>
                                        {model.favorites || 0}
                                    </span>
                                    <span style={statLabelStyle}>Favorites</span>
                                </div>
                                <div style={statItemStyle}>
                                    <span style={isLargeScreen ? statValueStyle : statValueStyleMobile}>
                                        {model.likes || 0}
                                    </span>
                                    <span style={statLabelStyle}>Likes</span>
                                </div>
                            </div>
                            
                            {/* Description */}
                            {model.description && (
                                <div style={descriptionStyle}>
                                    <h3 style={{ marginBottom: '10px', color: '#333' }}>Description</h3>
                                    <p>{model.description}</p>
                                </div>
                            )}

                            {/* Specifications */}
                            <div style={isLargeScreen ? specsGridStyle : specsGridStyleMobile}>
                                <div style={specItemStyle}>
                                    <span style={specLabelStyle}>Category</span>
                                    <span style={specValueStyle}>{model.category || 'Other'}</span>
                                </div>
                                <div style={specItemStyle}>
                                    <span style={specLabelStyle}>Type</span>
                                    <span style={specValueStyle}>{model.type || 'Model'}</span>
                                </div>
                                <div style={specItemStyle}>
                                    <span style={specLabelStyle}>File Format</span>
                                    <span style={specValueStyle}>
                                        {model.modelFiles && model.modelFiles.length > 0
                                            ? model.modelFiles.map(file => file.fileName.split('.').pop()).join(', ')
                                            : 'Unknown'
                                        }
                                    </span>
                                </div>
                                <div style={specItemStyle}>
                                    <span style={specLabelStyle}>Created</span>
                                    <span style={specValueStyle}>
                                        {model.createdAt ? new Date(model.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {/* Compatible Software */}
                            {model.software && model.software.length > 0 && (
                                <div style={specItemStyle}>
                                    <span style={specLabelStyle}>Compatible Software</span>
                                    <div style={softwareListStyle}>
                                        {model.software.map((software, index) => (
                                            <span key={index} style={softwareBadgeStyle}>
                                                {software}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {model.tags && model.tags.length > 0 && (
                                <div style={specItemStyle}>
                                    <span style={specLabelStyle}>Tags</span>
                                    <div style={softwareListStyle}>
                                        {model.tags.map((tag, index) => (
                                            <span key={index} style={{ ...softwareBadgeStyle, backgroundColor: '#f0f0f0', color: '#666' }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Download and Actions */}
                    <div style={isLargeScreen ? { ...rightColumnStyleLarge, ...responsiveFixStyle } : { ...rightColumnStyle, ...responsiveFixStyle }}>
                        <div style={detailsCardStyle}>
                            <button
                                style={isDownloadHovered ? downloadButtonHoverStyle : downloadButtonStyle}
                                onMouseEnter={() => setIsDownloadHovered(true)}
                                onMouseLeave={() => setIsDownloadHovered(false)}
                                onClick={handleDownload}
                            >
                                <img
                                    src="/DownloadIcon.png"
                                    alt="Download"
                                    style={downloadIconStyle}
                                />
                                DOWNLOAD NOW
                            </button>

                            <div style={isLargeScreen ? actionButtonsStyle : actionButtonsStyleMobile}>
                                <button
                                    style={actionButtonStyle}
                                    onMouseEnter={(e) => {
                                        if (isLargeScreen) {
                                            e.target.style.borderColor = '#ff7b00';
                                            e.target.style.color = '#ff7b00';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (isLargeScreen) {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.color = '#333';
                                        }
                                    }}
                                    onClick={handleFavorite}
                                >
                                    ❤️ Add to Favorites
                                </button>
                                <button
                                    style={actionButtonStyle}
                                    onMouseEnter={(e) => {
                                        if (isLargeScreen) {
                                            e.target.style.borderColor = '#ff7b00';
                                            e.target.style.color = '#ff7b00';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (isLargeScreen) {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.color = '#333';
                                        }
                                    }}
                                    onClick={handleShare}
                                >
                                    🔗 Share
                                </button>
                            </div>

                            {/* File List */}
                            {model.modelFiles && model.modelFiles.length > 0 && (
                                <div style={fileListStyle}>
                                    <h3 style={{ marginBottom: '15px', color: '#333' }}>Files Included</h3>
                                    {model.modelFiles.map((file, index) => (
                                        <div key={index} style={fileItemStyle}>
                                            <span style={fileNameStyle}>{file.fileName}</span>
                                            <span style={fileSizeStyle}>
                                                {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Full view image */}
            {isModalOpen && model.previewImages && model.previewImages.length > 0 && (
                <div style={modalOverlayStyle} onClick={closeModal}>
                    {/* Close button */}
                    <button
                        style={closeButtonStyle}
                        onClick={closeModal}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                    >
                        ×
                    </button>
                    {/* Nav buttons */}
                    {model.previewImages.length > 1 && (
                        <>
                            <button
                                style={prevButtonStyle}
                                onClick={goToPrevImage}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                            >
                                ‹
                            </button>
                            <button
                                style={nextButtonStyle}
                                onClick={goToNextImage}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                            >
                                ›
                            </button>
                        </>
                    )}
                    {/* Preview image */}

                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={model.previewImages[currentModalImageIndex]}
                            alt={`Preview ${currentModalImageIndex + 1}`}
                            style={modalImageStyle}
                            onError={(e) => {
                                e.target.src = '/default-model-preview.png';
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default ModelDetails;
