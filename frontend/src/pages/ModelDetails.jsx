import { toggleFavoriteModel, isModelFavorited, addComment, addReply } from '/backend/models.js';
import { doFollowUser, doUnfollowUser, getFollowing } from '/backend/users.js';
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../UI+UX/Header";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getModelById } from '/backend/models.js';
import { downloadModel } from '/backend/models.js';
import LoadingScreen from '../UI+UX/LoadingScreen.jsx';
import { useNavigate } from 'react-router-dom';
import '/frontend/css/ModelDetails.css'

// Screen size handle
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
    const [isFollowingCreator, setIsFollowingCreator] = useState(false); //State for checking if the creator is followed or not
    const [followLoading, setFollowLoading] = useState(false); //State for follow/unfollow loading
    const [followingList, setFollowingList] = useState([]); //State for following list
    const [downloadLoading, setDownloadLoading] = useState(false); // State that shows if the model is downloading or not
    const [downloadProgress, setDownloadProgress] = useState({}); // Download progress state
    const [showDownloadOptions, setShowDownloadOptions] = useState(false); // Download options state
    const [isFavorited, setIsFavorited] = useState(false); // Favourite state
    const [favoriteLoading, setFavoriteLoading] = useState(false); // State for favourite add/remove
    const { modelId } = useParams(); // To identify the model that should be displayed
    const { currentUser, userLogedIn } = useAuth(); // To identify the user
    const [username, setUsername] = useState(""); // To identify the username of the user
    const [model, setModel] = useState(null); // Model details
    const [loading, setLoading] = useState(true); // To check if the page is loading
    const [error, setError] = useState(null); // Errors
    const [selectedImageIndex, setSelectedImageIndex] = useState(0); // Which preview image is selected
    const [isModalOpen, setIsModalOpen] = useState(false); // Check if the full view of the images is active
    const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0); // Current image to show on full view
    const isLargeScreen = useScreenSize(); // Check the screen size

    // States for comments
    const [commentText, setCommentText] = useState(""); // Comment state
    const [replyingTo, setReplyingTo] = useState(null); // Reply to state
    const [replyText, setReplyText] = useState(""); // Reply state
    const [comments, setComments] = useState([]); // Comments state
    const [commentLoading, setCommentLoading] = useState(false); // Check if the comment is loading
    const [replyLoading, setReplyLoading] = useState(false); // Check if the reply is loading

    // Open the image full view
    const openModal = (index) => {
        setCurrentModalImageIndex(index);
        setIsModalOpen(true);
    };

    // Close the image full view
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Handle prev image
    const goToPrevImage = (e) => {
        e.stopPropagation();
        if (model.previewImages && model.previewImages.length > 0) {
            setCurrentModalImageIndex(prev =>
                prev === 0 ? model.previewImages.length - 1 : prev - 1
            );
        }
    };

    // Handle next image
    const goToNextImage = (e) => {
        e.stopPropagation();
        if (model.previewImages && model.previewImages.length > 0) {
            setCurrentModalImageIndex(prev =>
                prev === model.previewImages.length - 1 ? 0 : prev + 1
            );
        }
    };

    // Loading comments when the model is loaded
    useEffect(() => {
        if (model && model.comments) {
            // Comment sorting
            const sortedComments = [...model.comments].sort((a, b) => {
                const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
                return dateB - dateA;
            });
            setComments(sortedComments);
        }
    }, [model]);

    // Use effect to check if the model is favorited or not
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (model && currentUser) {
                const favorited = await isModelFavorited(model.id);
                setIsFavorited(favorited);
            }
        };

        checkFavoriteStatus();
    }, [model, currentUser]);

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

    // Load model details
    useEffect(() => {
        console.log("=== LOADING MODEL DETAILS ===");
        console.log("Model ID:", modelId);

        loadModelDetails();
    }, [modelId]);
    // Use effect for updating folloed status
    useEffect(() => {
        if (model && currentUser) {
            checkIfFollowingCreator();
        }
    }, [model, currentUser]);
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

    // Add comment
    const handleAddComment = async () => {
        if (!commentText.trim()) {
            alert('Please enter a comment');
            return;
        }

        if (!currentUser) {
            alert('Please log in to add comments');
            return;
        }

        try {
            setCommentLoading(true);
            const result = await addComment(modelId, commentText);

            if (result.success) {
                setCommentText("");
                // Reload model to obtain the updated comments
                if (result.comment) {
                    setComments(prevComments => [result.comment, ...prevComments]);

                    setModel(prev => ({
                        ...prev,
                        comments: [result.comment, ...(prev.comments || [])]
                    }));
                }
            } else {
                alert(result.message || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        } finally {
            setCommentLoading(false);
        }
    };
    //Check if the creator is followed
    const checkIfFollowingCreator = async () => {
        if (!currentUser || !model) return;

        try {
            const result = await getFollowing(currentUser.uid);
            if (result && Array.isArray(result)) {
                setFollowingList(result);
                const isFollowing = result.some(user => user.uid === model.creatorUID);
                setIsFollowingCreator(isFollowing);
            }
        } catch (error) {
            console.error("Error checking follow status:", error);
        }
    };
    const navigate = useNavigate();
    //Handler for follow/unfollow toggle
    const handleFollowToggle = async () => {
        if (!currentUser || !model) {
            navigate('/login');
            return;
        }

        if (followLoading) return;

        try {
            setFollowLoading(true);
            let result;

            if (isFollowingCreator) {
                result = await doUnfollowUser(model.creatorUID);
            } else {
                result = await doFollowUser(model.creatorUID);
            }

            if (result.success) {
                setIsFollowingCreator(!isFollowingCreator);
                // Update follwing list
                const updatedFollowing = await getFollowing(currentUser.uid);
                if (updatedFollowing && Array.isArray(updatedFollowing)) {
                    setFollowingList(updatedFollowing);
                }
            } else {
                alert(result.message || 'Failed to update follow status');
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            alert('Failed to update follow status');
        } finally {
            setFollowLoading(false);
        }
    };
    // Add reply
    const handleAddReply = async (targetId, targetType, parentCommentId, repliedToUsername = null) => {
        if (!replyText.trim()) {
            alert('Please enter a reply');
            return;
        }

        if (!currentUser) {
            alert('Please log in to add replies');
            return;
        }

        try {
            setReplyLoading(true);
            const result = await addReply(modelId, targetType === 'comment' ? targetId : parentCommentId, replyText, repliedToUsername);

            if (result.success) {
                setReplyText("");
                setReplyingTo(null);
                const modelResult = await getModelById(modelId);
                if (modelResult.success) {
                    setModel(modelResult.model);

                    const sortedComments = [...(modelResult.model.comments || [])].sort((a, b) => {
                        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
                        return dateB - dateA;
                    });
                    setComments(sortedComments);
                }
            } else {
                alert(result.message || 'Failed to add reply');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            alert('Failed to add reply. Please try again.');
        } finally {
            setReplyLoading(false);
        }
    };

    const startReplyToComment = (commentId) => {
        setReplyingTo({ type: 'comment', id: commentId, parentCommentId: commentId });
    };

    const startReplyToReply = (replyId, parentCommentId) => {
        setReplyingTo({ type: 'reply', id: replyId, parentCommentId: parentCommentId });
    };

    const getReplyPlaceholder = () => {
        if (!replyingTo) return "Write a reply...";

        if (replyingTo.type === 'comment') {
            const comment = comments.find(c => c.id === replyingTo.id);
            return comment ? `Reply to ${comment.username}...` : "Write a reply...";
        } else {
            // Finding the target reply if we are replying to a reply
            const comment = comments.find(c => c.id === replyingTo.parentCommentId);
            if (comment && comment.replies) {
                const reply = comment.replies.find(r => r.id === replyingTo.id);
                return reply ? `Reply to ${reply.username}...` : "Write a reply...";
            }
        }
        return "Write a reply...";
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return 'Unknown date';

        try {
            const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    // DOWNLOAD
    const handleDownload = async (specificFileName = null) => {
        if (!currentUser) {
            alert('Please log in to download models');
            return;
        }

        if (downloadLoading) return;

        try {
            setDownloadLoading(true);
            setDownloadProgress({});
            console.log('Initiating download for model:', modelId, 'File:', specificFileName);

            const result = await downloadModel(modelId, specificFileName);

            if (result.success) {
                // Success message
                if (result.downloads) {
                    const successful = result.downloads.filter(d => d.success);
                    const failed = result.downloads.filter(d => !d.success);

                    let message = `Download completed! `;
                    if (successful.length > 0) {
                        message += `Successfully downloaded ${successful.length} file(s). `;
                    }
                    if (failed.length > 0) {
                        message += `Failed to download ${failed.length} file(s).`;
                    }

                    alert(message);
                } else {
                    alert(result.message);
                }

                // Hide download options
                setShowDownloadOptions(false);

            } else {
                alert(result.message || 'Download failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during download:', error);
            alert('Download failed. Please try again.');
        } finally {
            setDownloadLoading(false);
            setDownloadProgress({});
        }
    };

    const handleSingleFileDownload = (fileName) => {
        handleDownload(fileName);
    };

    const handleAllFilesDownload = () => {
        handleDownload();
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // ADD TO FAVOURITES
    const handleFavorite = async () => {
        if (!currentUser) {
            alert('Please log in to favorite models');
            return;
        }

        if (favoriteLoading) return;

        try {
            setFavoriteLoading(true);
            console.log('Toggling favorite for model:', modelId);

            const result = await toggleFavoriteModel(modelId);

            if (result.success) {
                setIsFavorited(result.isFavorite);
                // Update model's favorites count in local state
                setModel(prev => ({
                    ...prev,
                    favorites: result.action === 'added'
                        ? (prev.favorites || 0) + 1
                        : Math.max((prev.favorites || 1) - 1, 0)
                }));
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('Failed to update favorite status');
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleShare = () => {
        console.log("Share model:", modelId);
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    // Loading screen
    if (loading) {
        return <LoadingScreen />;
    }

    // Error screen
    if (error) {
        return (
            <div className="backgroundStyle">
                <Header />
                <CookiesBanner />
                <div className="errorStyle">
                    <div className="emojiIconLarge">❌</div>
                    {error}
                    <br />
                    <button
                        onClick={loadModelDetails}
                        className="retryButton"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // If the model doesn't exist screen
    if (!model) {
        return (
            <div className="backgroundStyle">
                <Header />
                <CookiesBanner />
                <div className="errorStyle">
                    <div className="emojiIconLarge">🔍</div>
                    Model not found
                </div>
            </div>
        );
    }

    return (
        <div className="backgroundStyle responsiveFixStyle">
            <Header />
            <CookiesBanner />

            <div className="containerStyle">
                <div className={isLargeScreen ? 'contentStyleLarge responsiveFixStyle' : 'contentStyle responsiveFixStyle'}>
                    {/* Left Column - Model Preview and Details */}
                    <div className="leftColumnStyle responsiveFixStyle">
                        {/* Model Preview */}
                        <div className="modelPreviewStyle">
                            {model.previewImages && model.previewImages.length > 0 ? (
                                <img
                                    onClick={() => openModal(selectedImageIndex)}
                                    src={model.previewImages[selectedImageIndex]}
                                    alt={model.title}
                                    className="previewImageStyle"
                                    onError={(e) => {
                                        e.target.src = '/profile.png';
                                    }}
                                />
                            ) : (
                                <div className="previewPlaceholderStyle">
                                    🎨 No Preview Available
                                </div>
                            )}

                            {/* Thumbnails */}
                            {model.previewImages && model.previewImages.length > 1 && (
                                <div className="thumbnailsStyle">
                                    {model.previewImages.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`Preview ${index + 1}`}
                                            className={selectedImageIndex === index ? 'thumbnailActiveStyle' : 'thumbnailStyle'}
                                            onClick={() => setSelectedImageIndex(index)}
                                            onError={(e) => {
                                                e.target.src = '/profile.png';
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Model Details */}
                        <div className="detailsCardStyle">
                            <h1 className={isLargeScreen ? 'titleStyle' : 'titleStyle titleStyleMobile'}>{model.title}</h1>
                            {/* Creator info */}
                            <div
                                className="creatorStyle"
                                onClick={() => window.location.href = username === model.creatorUsername ? '/dashboard' : `/user/${model.creatorUsername}`}
                            >
                                <img
                                    src={model.creatorProfilePicture || '/profile.png'}
                                    alt={model.creatorUsername}
                                    className="avatarStyle"
                                    onError={(e) => {
                                        e.target.src = '/profile.png';
                                    }}
                                />
                                <div className="creatorInfoStyle">
                                    <div className="creatorUsernameLine" style={{marginTop: currentUser?.uid===model.creatorUID ? '1rem': '0' }}>
                                        <span>Created by <strong>{model.creatorUsername}</strong></span>
                                    </div>
                                     {currentUser?.uid !== model.creatorUID &&  (<div className="creatorButtonLine">
                                       
                                            <button
                                                className={`follow-button ${isFollowingCreator ? 'unfollow' : 'follow'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollowToggle();
                                                }}
                                                disabled={followLoading}
                                                style={{
                                                    backgroundColor: isFollowingCreator ? '#ff4444' : '#333',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 16px',
                                                    borderRadius: '6px',
                                                    cursor: followLoading ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.7rem'
                                                }}
                                            >
                                                {followLoading ? 'Processing...' : (isFollowingCreator ? 'Unfollow' : 'Follow')}
                                            </button>
                                        
                                    </div>)}
                                </div>
                            </div>
                            {/* Stats */}
                            <div className={isLargeScreen ? 'statsStyle' : 'statsStyleMobile'}>
                                <div className="statItemStyle">

                                    <span className={isLargeScreen ? 'statValueStyle' : 'statValueStyleMobile'}>
                                        {model.downloads || 0}
                                    </span>
                                    <span className="statLabelStyle">Downloads</span>
                                </div>
                                <div className="statItemStyle">
                                    <span className={isLargeScreen ? 'statValueStyle' : 'statValueStyleMobile'}>
                                        {model.favorites || 0}
                                    </span>
                                    <span className="statLabelStyle">Favorites</span>
                                </div>

                            </div>

                            {/* Description */}
                            {model.description && (
                                <div className="descriptionStyle">
                                    <h3 className="sectionHeading">Description</h3>
                                    <p>{model.description}</p>
                                </div>
                            )}

                            {/* Specifications */}
                            <div className={isLargeScreen ? 'specsGridStyle' : 'specsGridStyleMobile'}>
                                <div className="specItemStyle">
                                    <span className="specLabelStyle">Category</span>
                                    <span className="specValueStyle">{model.category || 'Other'}</span>
                                </div>
                                <div className="specItemStyle">
                                    <span className="specLabelStyle">Type</span>
                                    <span className="specValueStyle">{model.type || 'Model'}</span>
                                </div>
                                <div className="specItemStyle">
                                    <span className="specLabelStyle">File Format</span>
                                    <span className="specValueStyle">
                                        {model.modelFiles && model.modelFiles.length > 0
                                            ? model.modelFiles.map(file => file.fileName.split('.').pop()).join(', ')
                                            : 'Unknown'
                                        }
                                    </span>
                                </div>
                                <div className="specItemStyle">
                                    <span className="specLabelStyle">Created</span>
                                    <span className="specValueStyle">
                                        {model.createdAt ? new Date(model.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {/* Compatible Software */}
                            {model.software && model.software.length > 0 && (
                                <div className="specItemStyle">
                                    <span className="specLabelStyle">Compatible Software</span>
                                    <div className="softwareListStyle">
                                        {model.software.map((software, index) => (
                                            <span key={index} className="softwareBadgeStyle">
                                                {software}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {model.tags && model.tags.length > 0 && (
                                <div className="specItemStyle">
                                    <span className="specLabelStyle">Tags</span>
                                    <div className="softwareListStyle">
                                        {model.tags.map((tag, index) => (
                                            <span key={index} className="softwareBadgeStyle tagBadge">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Download and Actions */}
                    <div className={isLargeScreen ? 'rightColumnStyleLarge responsiveFixStyle' : 'rightColumnStyle responsiveFixStyle'}>
                        <div className="detailsCardStyle">
                            {/* Download button */}
                            <button
                                className="downloadButtonStyle"
                                onClick={() => {
                                    if (model.modelFiles && model.modelFiles.length === 1) {
                                        // If there is one file to download
                                        handleSingleFileDownload(model.modelFiles[0].fileName);
                                    } else {
                                        // If there is a package to download
                                        handleAllFilesDownload();
                                    }
                                }}
                                disabled={downloadLoading}
                            >
                                <img
                                    src="/DownloadIcon.png"
                                    alt="Download"
                                    className="downloadIconStyle"
                                />
                                {downloadLoading ? 'DOWNLOADING...' : 'DOWNLOAD NOW'}
                            </button>



                            <div className={isLargeScreen ? 'actionButtonsStyle' : 'actionButtonsStyleMobile'}>
                                {/* Favorite toggle and Share buttons */}
                                <button
                                    className="actionButtonStyle"
                                    onClick={handleFavorite}
                                    disabled={favoriteLoading}
                                >
                                    {favoriteLoading
                                        ? '⏳ Processing...'
                                        : isFavorited
                                            ? '💔 Remove from Favorites'
                                            : '❤️ Add to Favorites'
                                    }
                                </button>
                                <button
                                    className="actionButtonStyle"
                                    onClick={handleShare}
                                >
                                    🔗 Share
                                </button>
                            </div>

                            {/* File List  */}
                            {model.modelFiles && model.modelFiles.length > 0 && (
                                <div className="fileListStyle">
                                    <h3 className="filesTitle">Files Included</h3>
                                    {model.modelFiles.map((file, index) => (
                                        <div key={index} className="fileItemStyle">
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                <span className="fileNameStyle">{file.fileName}</span>
                                                <span className="fileSizeStyle">
                                                    {formatFileSize(file.fileSize)} • {file.software}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="commentsSectionStyle">
                            <h3 className="commentsHeading">
                                Comments ({comments.length + comments.reduce((total, comment) => total + (comment.replies ? comment.replies.length : 0), 0)})
                            </h3>

                            {/* Comment Form */}
                            {currentUser ? (
                                <div className="commentFormStyle">
                                    <textarea
                                        className="commentInputStyle"
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                    />
                                    <button
                                        className="commentSubmitStyle"
                                        onClick={handleAddComment}
                                        disabled={commentLoading || !commentText.trim()}
                                    >
                                        {commentLoading ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            ) : (
                                <div className="loginPromptStyle">
                                    Please <a href="/login">log in</a> to add comments
                                </div>
                            )}

                            {/* Comments List */}
                            <div className="commentsListStyle comments-scrollbar">
                                {comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="commentItemStyle">
                                            {/* Comment Header */}
                                            <div className="commentHeaderStyle">
                                                <img
                                                    src={comment.profilePicture || '/profile.png'}
                                                    alt={comment.username}
                                                    className="commentAvatarStyle"
                                                    onError={(e) => {
                                                        e.target.src = '/profile.png';
                                                    }}
                                                />
                                                <div className="commentMetaStyle">
                                                    <span className="commentUsernameStyle">{comment.username}</span>
                                                    <span className="commentDateStyle">{formatDate(comment.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Comment Text */}
                                            <div className="commentTextStyle">
                                                {comment.text}
                                            </div>

                                            {/* Comment Actions */}
                                            <div className="commentActionsStyle">
                                                {currentUser && (
                                                    <button
                                                        className="replyButtonStyle"
                                                        onClick={() => startReplyToComment(comment.id)}
                                                    >
                                                        {replyingTo && replyingTo.type === 'comment' && replyingTo.id === comment.id ? 'Cancel' : 'Reply'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Reply Form */}
                                            {replyingTo && replyingTo.type === 'comment' && replyingTo.id === comment.id && currentUser && (
                                                <div className="replyFormStyle">
                                                    <textarea
                                                        className="replyInputStyle"
                                                        placeholder={getReplyPlaceholder()}
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                    />
                                                    <div className="replyButtonsStyle">
                                                        <button
                                                            className="replyCancelStyle"
                                                            onClick={() => {
                                                                setReplyingTo(null);
                                                                setReplyText("");
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            className="replySubmitStyle"
                                                            onClick={() => handleAddReply(comment.id, 'comment', comment.id, comment.username)}
                                                            disabled={replyLoading || !replyText.trim()}
                                                        >
                                                            {replyLoading ? 'Posting...' : 'Post Reply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Replies List */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="repliesStyle">
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply.id} className="replyItemStyle">
                                                            <div className="replyHeaderWithMentionStyle">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <img
                                                                        src={reply.profilePicture || '/profile.png'}
                                                                        alt={reply.username}
                                                                        className="replyAvatarStyle"
                                                                        onError={(e) => {
                                                                            e.target.src = '/profile.png';
                                                                        }}
                                                                    />
                                                                    <div className="replyMetaStyle">
                                                                        <span className="replyUsernameStyle">{reply.username}</span>
                                                                        <span className="replyDateStyle">{formatDate(reply.createdAt)}</span>
                                                                    </div>
                                                                </div>
                                                                {reply.repliedTo && (
                                                                    <div className="replyMentionStyle">
                                                                        <span className="replyArrowStyle">→</span>
                                                                        <span>{reply.repliedTo}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="replyTextStyle">
                                                                {reply.text}
                                                            </div>

                                                            {/* Reply Actions for replies */}
                                                            <div className="commentActionsStyle">
                                                                {currentUser && (
                                                                    <button
                                                                        className="replyButtonStyle"
                                                                        onClick={() => startReplyToReply(reply.id, comment.id)}
                                                                    >
                                                                        {replyingTo && replyingTo.type === 'reply' && replyingTo.id === reply.id ? 'Cancel' : 'Reply'}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Reply Form replies */}
                                                            {replyingTo && replyingTo.type === 'reply' && replyingTo.id === reply.id && currentUser && (
                                                                <div className="replyFormStyle">
                                                                    <textarea
                                                                        className="replyInputStyle"
                                                                        placeholder={getReplyPlaceholder()}
                                                                        value={replyText}
                                                                        onChange={(e) => setReplyText(e.target.value)}
                                                                    />
                                                                    <div className="replyButtonsStyle">
                                                                        <button
                                                                            className="replyCancelStyle"
                                                                            onClick={() => {
                                                                                setReplyingTo(null);
                                                                                setReplyText("");
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            className="replySubmitStyle"
                                                                            onClick={() => handleAddReply(reply.id, 'reply', comment.id, reply.username)}
                                                                            disabled={replyLoading || !replyText.trim()}
                                                                        >
                                                                            {replyLoading ? 'Posting...' : 'Post Reply'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                        </div>
                                    ))
                                ) : (
                                    <div className="noCommentsStyle">
                                        No comments yet. Be the first to comment!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full view image */}
            {isModalOpen && model.previewImages && model.previewImages.length > 0 && (
                <div className="modalOverlayStyle" onClick={closeModal}>
                    {/* Close button */}
                    <button
                        className="closeButtonStyle"
                        onClick={closeModal}
                    >
                        ×
                    </button>
                    {/* Nav buttons */}
                    {model.previewImages.length > 1 && (
                        <>
                            <button
                                className="navigationButtonStyle prevButtonStyle"
                                onClick={goToPrevImage}
                            >
                                ‹
                            </button>
                            <button
                                className="navigationButtonStyle nextButtonStyle"
                                onClick={goToNextImage}
                            >
                                ›
                            </button>
                        </>
                    )}
                    {/* Preview image */}

                    <div className="modalContentStyle" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={model.previewImages[currentModalImageIndex]}
                            alt={`Preview ${currentModalImageIndex + 1}`}
                            className="modalImageStyle"
                            onError={(e) => {
                                e.target.src = '/profile.png';
                            }}
                        />
                    </div>
                </div>
            )}

        </div>

    );
}

export default ModelDetails;
