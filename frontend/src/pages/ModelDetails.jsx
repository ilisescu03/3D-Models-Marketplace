import { toggleFavoriteModel, isModelFavorited, addComment, addReply, updateModel, deleteModel } from '/backend/models.js';
import { doFollowUser, doUnfollowUser, getFollowing, sendNotification } from '/backend/users.js';
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../UI+UX/Header";
import Footer from "../UI+UX/Footer.jsx";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getModelById } from '/backend/models.js';
import { downloadModel } from '/backend/models.js';
import LoadingScreen from '../UI+UX/LoadingScreen.jsx';
import { useNavigate } from 'react-router-dom';
import '/frontend/css/ModelDetails.css'
import { addToCart, removeFromCart, getCartItems } from '/backend/users.js';
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
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false); // State for payment form
    const [userData, setUserData] = useState(null);
    // States for comments
    const [commentText, setCommentText] = useState(""); // Comment state
    const [replyingTo, setReplyingTo] = useState(null); // Reply to state
    const [replyText, setReplyText] = useState(""); // Reply state
    const [comments, setComments] = useState([]); // Comments state
    const [commentLoading, setCommentLoading] = useState(false); // Check if the comment is loading
    const [replyLoading, setReplyLoading] = useState(false); // Check if the reply is loading
    const [isInCart, setIsInCart] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editModelData, setEditModelData] = useState(null);
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [modalPreviewImages, setModalPreviewImages] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
    const [cartPreviewItems, setCartPreviewItems] = useState([]);
    const [cartPreviewTotalPrice, setCartPreviewTotalPrice] = useState(0);
    const CATEGORIES = [
        'Architecture',
        'Characters & Creatures',
        'Cars & Vehicles',
        'Environment',
        'Furniture',
        'Electronics',
        'Jewelry',
        'Weapons',
        'Food & Drink',
        'Plants',
        'Animals',
        'Art & Abstract',
        'Mechanical',
        'Fashion & Style',
        'Sports',
        'Culture & History',
        'Other'
    ];

    const openEditModal = () => {
        setEditModelData({ ...model });
        // Initialize the modal's preview list with objects to track their type
        setModalPreviewImages(model.previewImages.map(url => ({ type: 'url', src: url })));
        setNewImageFiles([]); // Reset the list of new files
        setIsEditModalOpen(true);
    };
    
      const loadCartPreviewDetails = async () => {
        try {
            const result = await getCartItems();
            if (result.success && result.cart.length > 0) {
                const detailedItems = await Promise.all(
                    result.cart.map(async (id) => {
                        const modelResult = await getModelById(id);
                        return modelResult.success ? modelResult.model : null;
                    })
                );
                const filteredItems = detailedItems.filter(item => item !== null);
                setCartPreviewItems(filteredItems);
                const total = filteredItems.reduce((sum, item) => sum + (item.price || 0), 0);
                setCartPreviewTotalPrice(total);
            } else {
                setCartPreviewItems([]);
                setCartPreviewTotalPrice(0);
            }
        } catch (err) {
            console.error("Failed to load cart preview items:", err);
            setCartPreviewItems([]);
            setCartPreviewTotalPrice(0);
        }
    };
    const handleCartToggle = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (cartLoading) return;

        setCartLoading(true);
        const result = isInCart
            ? await removeFromCart(modelId)
            : await addToCart(modelId);

        if (result.success) {
            setIsInCart(!isInCart);
             if (!isInCart) { // If item was just added
                await loadCartPreviewDetails(); // Load updated cart items for the preview
                setIsCartPreviewOpen(true); // Open the cart preview modal
            }
        } else {
            alert(`Error: ${result.message}`);
        }
        setCartLoading(false);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'isPublic') {
            setEditModelData(prev => ({ ...prev, [name]: value === 'true' }));
        } else {
            setEditModelData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageRemove = (imageToRemove) => {
        // Prevent removing the last image
        if (modalPreviewImages.length <= 1) {
            alert("You must have at least one preview image.");
            return;
        }

        // If it's an existing image (from Firestore)
        if (imageToRemove.type === 'url') {
            setEditModelData(prev => ({
                ...prev,
                previewImages: prev.previewImages.filter(url => url !== imageToRemove.src)
            }));
        }
        // If it's a new image you've just added (a blob)
        else if (imageToRemove.type === 'blob') {
            // Remove the file from the list to be uploaded
            setNewImageFiles(prev => prev.filter(file => file !== imageToRemove.file));
            // Important: Revoke the temporary URL to prevent memory leaks
            URL.revokeObjectURL(imageToRemove.src);
        }

        // Update the visual list you see in the modal
        setModalPreviewImages(prev => prev.filter(img => img.src !== imageToRemove.src));
    };

    const handleNewImages = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // Add the files to the state that holds files for upload
            setNewImageFiles(prev => [...prev, ...files]);

            // Create temporary "blob" URLs for instant preview
            const newPreviews = files.map(file => ({
                type: 'blob',
                src: URL.createObjectURL(file),
                file: file // Keep a reference to the original File object
            }));

            // Add the new previews to the list shown in the modal
            setModalPreviewImages(prev => [...prev, ...newPreviews]);
        }
        // Clear the file input so you can select the same file again if needed
        e.target.value = null;
    };
    // --- Handlers for Delete Modal ---
    const handleOpenDeleteConfirm = () => {
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        const result = await deleteModel(modelId);
        if (result.success) {
            alert("Model successfully deleted.");
            setIsDeleteConfirmOpen(false);
            setIsEditModalOpen(false);
            navigate('/dashboard');
        } else {
            alert(`Error: ${result.message}`);
        }
        setIsDeleting(false);
    };
    const handleAddTag = () => {
        if (tagInput && !editModelData.tags.includes(tagInput.trim())) {
            setEditModelData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove) => {
        setEditModelData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSaveChanges = async () => {
        if (!editModelData) return;
        setIsSaving(true);
        try {
            const dataToUpdate = {
                title: editModelData.title,
                description: editModelData.description,
                isPublic: editModelData.isPublic,
                category: editModelData.category,
                tags: editModelData.tags || [],
                previewImages: editModelData.previewImages,
            };

            const result = await updateModel(modelId, dataToUpdate, newImageFiles);

            if (result.success) {
                alert('Model updated successfully!');
                setIsEditModalOpen(false);
                loadModelDetails();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("An error occurred while saving. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };
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
    useEffect(() => {
        const checkCartStatus = async () => {
            if (currentUser && model) {
                const result = await getCartItems();
                if (result.success && result.cart.includes(model.id)) {
                    setIsInCart(true);
                } else {
                    setIsInCart(false);
                }
            }
        };
        checkCartStatus();
    }, [currentUser, model]);
     useEffect(() => {
        if (currentUser) {
            loadCartPreviewDetails();
        }
    }, [currentUser]);
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
    useEffect(() => {
        // Verify if the model was loaded and the  tite proprety exists
        if (model && model.title) {
            // If yes, set the doc text
            document.title = `${model.title} - ShapeHive`;
        } else if (!loading) {
            //If the model was not found
            document.title = 'Model Not Found - ShapeHive';
        }

        // Clean up
        return () => {
            document.title = 'ShapeHive';
        };

    }, [model, loading]);
    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('/backend/firebase.js');

                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };

        fetchUserData();
    }, [currentUser]);
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
    // Use effect for updating followed status
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

                    if (model && currentUser.uid !== model.creatorUID) {
                        await sendNotification(
                            model.creatorUID,                  // receiver
                            currentUser.uid,                   // sender
                            "New comment on your model!",      // title
                            `${username} commented: "${commentText}"`, // text 
                            `/model/${modelId}`                // link to model
                        );
                    }
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
                await sendNotification(
                    model.creatorUID,
                    currentUser.uid,
                    "You have a new follower!",
                    `${username} started following you!`,
                    `/user/${username}`
                );
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
    // Redirect if the model is private and the user is not the creator
    useEffect(() => {
        if (model && !model.isPublic && currentUser?.uid !== model.creatorUID) {
            console.warn("ACCESS DENIED: Attempting to view a private model without ownership. Redirecting...");
            navigate('/');
        }
    }, [model, currentUser, navigate]);
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
                    let replyToUserId = null;
                    if (targetType === 'comment') {

                        const comment = sortedComments.find(c => c.id === targetId);
                        replyToUserId = comment?.userId || null;
                    } else if (targetType === 'reply') {

                        const parentComment = sortedComments.find(c => c.id === parentCommentId);
                        if (parentComment && parentComment.replies) {
                            const reply = parentComment.replies.find(r => r.id === targetId);
                            replyToUserId = reply?.userId || null;
                        }
                    }


                    if (
                        replyToUserId &&
                        replyToUserId !== currentUser.uid
                    ) {
                        await sendNotification(
                            replyToUserId,
                            currentUser.uid,
                            "You received a reply!",
                            `${username} replied: "${replyText}"`,
                            `/model/${modelId}`
                        );
                    }
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
    const handleCardPaymentClick = () => {
        if (currentUser) {
            setIsPaymentFormOpen(true);
        } else {
            navigate('/login');
        }
    };

    const handlePayPalClick = () => {
        if (!currentUser) {
            navigate('/login');
        }
        // Does nothing if logged in, as per instructions.
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
                if (result.isFirstDownload && model && currentUser.uid !== model.creatorUID) {
                    await sendNotification(
                        model.creatorUID,
                        currentUser.uid,
                        "Your model was purchased!",
                        `${username} purchased your model "${model.title}"`,
                        `/model/${modelId}`
                    );
                    setUserData(prev => ({
                        ...prev,
                        downloadedModels: [...(prev?.downloadedModels || []), modelId]
                    }));

                }
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
                if (result.action === 'added' && model && currentUser.uid !== model.creatorUID) {
                    await sendNotification(
                        model.creatorUID,
                        currentUser.uid,
                        "Your model was added to favorites!",
                        `${username} added your model "${model.title}" to favorites`,
                        `/model/${modelId}`
                    );
                }
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

            <div className="containerStyle" style={{ marginTop: isLargeScreen ? '0rem' : '-13rem' }}>
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
                            {currentUser?.uid === model.creatorUID && (
                                <button className="edit-model-button" title="Edit model details" onClick={openEditModal}>
                                    <img src="/Edit-10.svg" alt="Edit" />
                                </button>
                            )}
                            <h1 className={isLargeScreen ? 'titleStyle' : 'titleStyle titleStyleMobile'}>{model.title}</h1>
                            {/* Private model message */}
                            {currentUser?.uid === model.creatorUID && model.isPublic === false && (
                                <p className="private-model-notice">(Your model is private)</p>
                            )}
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
                                    <div className="creatorUsernameLine" style={{ marginTop: currentUser?.uid === model.creatorUID ? '1rem' : '0' }}>
                                        <span> <strong>{model.creatorUsername}</strong></span>
                                    </div>
                                    {currentUser?.uid !== model.creatorUID && (<div className="creatorButtonLine">

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
                            {/* === CONDITIONAL PRICE/DOWNLOAD SECTION START === */}
                            {currentUser && userData?.downloadedModels?.includes(modelId) ? (

                                <button
                                    className="downloadButtonStyle"
                                    onClick={() => {
                                        if (model.modelFiles && model.modelFiles.length === 1) {
                                            handleSingleFileDownload(model.modelFiles[0].fileName);
                                        } else {
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
                                    {downloadLoading ? 'DOWNLOADING...' : 'DOWNLOAD YOUR FILES'}
                                </button>
                            ) : (
                                // --- VISITOR'S VIEW ---
                                <>
                                    {(model.price === 0 || !model.price) ? (
                                        // --- FREE MODEL ---
                                        <>
                                            <h2 className="free-badge">FREE</h2>
                                            <button
                                                className="downloadButtonStyle"
                                                onClick={() => {
                                                    if (model.modelFiles && model.modelFiles.length === 1) {
                                                        handleSingleFileDownload(model.modelFiles[0].fileName);
                                                    } else {
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
                                        </>
                                    ) : (
                                        // --- PAID MODEL ---
                                        <div className="payment-section">
                                            <h2 className="price-display">€{model.price.toFixed(2)}</h2>
                                            <button
                                                className={`add-to-cart-button ${isInCart ? 'in-cart' : ''}`}
                                                onClick={handleCartToggle}
                                                disabled={cartLoading}
                                            >
                                                {cartLoading ? 'Processing...' : (isInCart ? 'Remove from Cart' : 'Add to Cart')}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                            {/* === CONDITIONAL PRICE/DOWNLOAD SECTION END === */}



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
                                                    {formatFileSize(file.fileSize)}
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
            {isEditModalOpen && editModelData && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal-content">
                        <div className="edit-modal-header">
                            <h2>Edit Model</h2>
                            <button className="close-button-modal" onClick={() => setIsEditModalOpen(false)}>×</button>
                        </div>
                        <div className="edit-modal-body">
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" name="title" value={editModelData.title} onChange={handleEditFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" rows="5" value={editModelData.description} style={{ fontFamily: "Arial, sans-serif" }} onChange={handleEditFormChange}></textarea>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={editModelData.category} onChange={handleEditFormChange}>
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Visibility</label>
                                    <select name="isPublic" value={editModelData.isPublic} onChange={handleEditFormChange}>
                                        <option value="true">Public</option>
                                        <option value="false">Private</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Tags</label>
                                <div className="tags-input-container">
                                    {editModelData.tags?.map(tag => (
                                        <div key={tag} className="tag-chip">
                                            {tag}
                                            <span onClick={() => handleRemoveTag(tag)}>x</span>
                                        </div>
                                    ))}
                                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="Add a tag and press Enter" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Preview Images ({modalPreviewImages.length}/10)</label>
                                <div className="image-previews-container">
                                    {modalPreviewImages.map((image, index) => (
                                        <div key={index} className="image-preview-chip">
                                            <img src={image.src} alt={`Preview ${index + 1}`} />
                                            <button type="button" onClick={() => handleImageRemove(image)} className="remove-image-btn" title="Remove image">×</button>
                                        </div>
                                    ))}
                                    {modalPreviewImages.length < 10 && (
                                        <label className="add-image-label">
                                            + Add
                                            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleNewImages} style={{ display: 'none' }} />
                                        </label>
                                    )}
                                </div>
                                <small>The first image is the main thumbnail. You must have at least one image.</small>
                            </div>

                        </div>
                        <div className="edit-modal-footer space-between">
                            <button className="delete-btn" onClick={handleOpenDeleteConfirm}>Delete Model</button>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button className="save-btn" onClick={handleSaveChanges} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
     
      
            {isDeleteConfirmOpen && (
                <div className="confirm-delete-modal-overlay">
                    <div className="confirm-delete-modal-content">
                        <h4>Are you sure?</h4>
                        <p>This action is irreversible and will permanently delete your model and all its files.</p>
                        <div className="confirm-delete-modal-actions">
                            <button className="cancel-btn" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting}>No, Cancel</button>
                            <button className="delete-btn" onClick={handleConfirmDelete} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
             {/* === CART PREVIEW MODAL START === */}
            <div className={`cart-preview-overlay ${isCartPreviewOpen ? 'open' : ''}`} onClick={() => setIsCartPreviewOpen(false)}>
                <div className={`cart-preview-content ${isCartPreviewOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <button className="close-cart-preview" onClick={() => setIsCartPreviewOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8L12 16M12 16L16 12M12 16L8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h3 className="cart-preview-title">Added to Cart</h3>

                    {cartPreviewItems.length > 0 ? (
                        <>
                            <div className="cart-preview-items-list">
                                {cartPreviewItems.map(item => (
                                    <div key={item.id} className="cart-preview-item">
                                        <img
                                            src={item.previewImages?.[0] || '/default-model-preview.png'}
                                            alt={item.title}
                                            className="cart-preview-item-thumbnail"
                                            onClick={() => { navigate(`/model/${item.id}`); setIsCartPreviewOpen(false); }}
                                        />
                                        <div className="cart-preview-item-details">
                                            <h4 onClick={() => { navigate(`/model/${item.id}`); setIsCartPreviewOpen(false); }}>{item.title}</h4>
                                            <p>€{item.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-preview-summary">
                                <span>Subtotal:</span>
                                <span>€{cartPreviewTotalPrice.toFixed(2)}</span>
                            </div>
                            <button className="cart-preview-view-cart-btn" onClick={() => { navigate('/my-cart'); setIsCartPreviewOpen(false); }}>
                                View Cart
                            </button>
                        </>
                    ) : (
                        <p className="cart-preview-empty">Your cart is empty.</p>
                    )}
                </div>
            </div>
            {/* === CART PREVIEW MODAL END === */}
            {!loading && (<div style={{ marginTop: '4rem', width: '100%' }}>
                <Footer />
            </div>)}
        </div>

    );
}

export default ModelDetails;