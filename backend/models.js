import { auth, db, storage } from "./firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";


// Supported file extensions for different 3D software
const SUPPORTED_EXTENSIONS = {
  'Blender': ['.blend', '.fbx', '.obj', '.dae', '.x3d'],
  'Cinema4D': ['.c4d', '.fbx', '.obj', '.3ds'],
  '3dsMax': ['.max', '.fbx', '.obj', '.3ds'],
  'Maya': ['.mb', '.ma', '.fbx', '.obj'],
  'AutoCAD': ['.dwg', '.dxf', '.3ds'],
  'ArchiCAD': ['.pln', '.ifc', '.3ds'],
  'Unity': ['.unity', '.prefab', '.fbx', '.obj'],
  'Unreal Engine': ['.uasset', '.fbx', '.obj'],
  'Godot': ['.tscn', '.tres', '.dae', '.obj'],
  'SketchUp': ['.skp', '.dae', '.kmz'],
  'Fusion360': ['.f3d', '.step', '.iges'],
  'SolidWorks': ['.sldprt', '.sldasm', '.step'],
  'Rhino': ['.3dm', '.obj', '.step'],
  'ZBrush': ['.ztl', '.zpr', '.obj'],
  'Houdini': ['.hip', '.hiplc', '.bgeo']
};

// All supported extensions in one array
const ALL_SUPPORTED_EXTENSIONS = Object.values(SUPPORTED_EXTENSIONS).flat();

// Validate files before upload
const validateFiles = (files) => {
  const errors = [];
  const maxFileSize = 100 * 1024 * 1024; // 100MB per file
  const maxTotalSize = 500 * 1024 * 1024; // 500MB total
  
  let totalSize = 0;
  
  for (const file of files) {
    totalSize += file.size;
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File "${file.name}" is too large (max 100MB per file)`);
    }
    
    // Check file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALL_SUPPORTED_EXTENSIONS.includes(extension)) {
      errors.push(`File "${file.name}" has unsupported format (${extension})`);
    }
  }
  
  if (totalSize > maxTotalSize) {
    errors.push('Total file size exceeds 500MB limit');
  }
  
  return errors;
};

// Validate preview images
const validatePreviewImages = (images) => {
  const errors = [];
  const maxImageSize = 10 * 1024 * 1024; // 10MB per image
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (images.length === 0) {
    errors.push('At least one preview image is required');
    return errors;
  }
  
  if (images.length > 10) {
    errors.push('Maximum 10 preview images allowed');
  }
  
  for (const image of images) {
    if (image.size > maxImageSize) {
      errors.push(`Image "${image.name}" is too large (max 10MB per image)`);
    }
    
    if (!allowedTypes.includes(image.type)) {
      errors.push(`Image "${image.name}" has invalid format. Use JPG, PNG, or WebP`);
    }
  }
  
  return errors;
};

// Detect software based on file extension
const detectSoftware = (fileName) => {
  const extension = '.' + fileName.toLowerCase().split('.').pop();
  
  for (const [software, extensions] of Object.entries(SUPPORTED_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return software;
    }
  }
  return 'Unknown';
};

// Generate unique model ID
const generateModelId = () => {
  return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};


// Upload model with files and preview images
export const uploadModel = async (modelData, files, previewImages) => {
  console.log("=== STARTING MODEL UPLOAD ===");
  console.log("Model data:", modelData);
  console.log("Files count:", files.length);
  console.log("Preview images count:", previewImages.length);

  try {
    // Check authentication
    if (!auth.currentUser) {
      return { success: false, message: 'User not authenticated' };
    }

    const creatorUID = auth.currentUser.uid;
    console.log("Creator UID:", creatorUID);

    // Validate model files
    const fileErrors = validateFiles(files);
    if (fileErrors.length > 0) {
      return { success: false, message: fileErrors.join('; ') };
    }

    // Validate preview images
    const imageErrors = validatePreviewImages(previewImages);
    if (imageErrors.length > 0) {
      return { success: false, message: imageErrors.join('; ') };
    }

    // Validate required fields
    if (!modelData.title || !modelData.title.trim()) {
      return { success: false, message: 'Title is required' };
    }

    if (!modelData.category) {
      return { success: false, message: 'Category is required' };
    }

    // Generate unique model ID
    const modelId = generateModelId();
    console.log("Generated model ID:", modelId);

    // Upload model files to Storage
    console.log("=== UPLOADING MODEL FILES ===");
    const modelFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Uploading file ${i + 1}/${files.length}: ${file.name}`);
      
      // Create storage reference
      const fileRef = ref(storage, `models/${modelId}/${file.name}`);
      
      // Upload file with metadata
      const snapshot = await uploadBytes(fileRef, file, {
        customMetadata: {
          creatorUid: creatorUID,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log(`File uploaded successfully: ${downloadURL}`);
      
      // Add to model files array
      modelFiles.push({
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        software: detectSoftware(file.name),
        uploadedAt: new Date()
      });
    }

    // Upload preview images to Storage
    console.log("=== UPLOADING PREVIEW IMAGES ===");
    const previewImageUrls = [];
    
    for (let i = 0; i < previewImages.length; i++) {
      const image = previewImages[i];
      console.log(`Uploading image ${i + 1}/${previewImages.length}: ${image.name}`);
      
      // Generate unique filename for image
      const fileExtension = image.name.split('.').pop();
      const imageFileName = `preview_${i + 1}.${fileExtension}`;
      
      // Create storage reference
      const imageRef = ref(storage, `modelImages/${modelId}/${imageFileName}`);
      
      // Upload image
      const snapshot = await uploadBytes(imageRef, image, {
        customMetadata: {
          creatorUid: creatorUID,
          originalName: image.name,
          uploadedAt: new Date().toISOString()
        }
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log(`Image uploaded successfully: ${downloadURL}`);
      
      previewImageUrls.push(downloadURL);
    }

    // Create model document for Firestore
    console.log("=== CREATING FIRESTORE DOCUMENT ===");
    const modelDoc = {
      id: modelId,
      type: modelData.type || 'Model',
      creatorUID: creatorUID,
      title: modelData.title.trim(),
      description: modelData.description?.trim() || '',
      likes: 0,
      favorites: 0,
      downloads: 0,
      downloadedBy: [],
      comments: [],
      previewImages: previewImageUrls,
      modelFiles: modelFiles,
      previewSettings: modelData.previewSettings || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        cameraPosition: { x: 0, y: 0, z: 5 }
      },
      tags: modelData.tags || [],
      software: modelData.software || [],
      category: modelData.category,
      isPublic: modelData.isPublic !== false, // Default to true
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("Document to be saved:", modelDoc);

    // Save model document to Firestore
    await setDoc(doc(db, "models", modelId), modelDoc);
    console.log("Model document saved to Firestore");

    // Update user's uploaded models array
    console.log("=== UPDATING USER DOCUMENT ===");
    const userRef = doc(db, "users", creatorUID);
    await updateDoc(userRef, {
      uploadedModels: arrayUnion(modelId)
    });
    console.log("User document updated with new model ID");

    console.log("=== MODEL UPLOAD SUCCESSFUL ===");
    return { 
      success: true, 
      message: 'Model uploaded successfully!', 
      modelId: modelId,
      previewUrl: previewImageUrls[0] || null
    };

  } catch (error) {
    console.error("=== MODEL UPLOAD ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    
    return { 
      success: false, 
      message: error.message || 'Upload failed. Please try again.' 
    };
  }
};

// Get models with pagination and filters for display
export const getModels = async (filters = {}, lastDoc = null, limitCount = 12) => {
  try {
    console.log("=== FETCHING MODELS ===");
    console.log("Filters:", filters);
    console.log("Limit:", limitCount);

    const { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } = await import('firebase/firestore');

    let q = collection(db, "models");
    
    // Apply filters
    if (filters.category) {
      q = query(q, where("category", "==", filters.category));
    }
    if (filters.software) {
      q = query(q, where("software", "array-contains", filters.software));
    }
    if (filters.creatorUID) {
      q = query(q, where("creatorUID", "==", filters.creatorUID));
    }
    if (filters.isPublic !== undefined) {
      q = query(q, where("isPublic", "==", filters.isPublic));
    } else {
      // Default to only public models
      q = query(q, where("isPublic", "==", true));
    }

    // Order by
    const orderField = filters.orderBy || 'createdAt';
    const orderDirection = filters.orderDirection || 'desc';
    q = query(q, orderBy(orderField, orderDirection));

    // Pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);
    const models = [];
    
    console.log(`Found ${snapshot.docs.length} models`);

    // Get all models first
    snapshot.forEach((docSnapshot) => {
      models.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    // Fetch creator usernames for all models
    const modelsWithCreators = await Promise.all(
      models.map(async (model) => {
        try {
          const creatorRef = doc(db, "users", model.creatorUID);
          const creatorSnap = await getDoc(creatorRef);
          
          if (creatorSnap.exists()) {
            const creatorData = creatorSnap.data();
            return {
              ...model,
              creatorUsername: creatorData.username || creatorData.email || 'Unknown'
            };
          }
          
          return { ...model, creatorUsername: 'Unknown' };
        } catch (error) {
          console.error(`Error fetching creator for model ${model.id}:`, error);
          return { ...model, creatorUsername: 'Unknown' };
        }
      })
    );

    console.log("Models with creators:", modelsWithCreators.length);

    return {
      success: true,
      models: modelsWithCreators,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error("Error fetching models:", error);
    return { success: false, message: error.message, models: [] };
  }
};

// Get single model by ID
export const getModelById = async (modelId) => {
  try {
    console.log("=== FETCHING MODEL BY ID ===");
    console.log("Model ID:", modelId);

    const { doc, getDoc } = await import('firebase/firestore');
    
    const modelRef = doc(db, "models", modelId);
    const modelSnap = await getDoc(modelRef);

    if (!modelSnap.exists()) {
      return { success: false, message: 'Model not found' };
    }

    const modelData = { id: modelSnap.id, ...modelSnap.data() };

    // Fetch creator info
    try {
      const creatorRef = doc(db, "users", modelData.creatorUID);
      const creatorSnap = await getDoc(creatorRef);
      
      if (creatorSnap.exists()) {
        const creatorData = creatorSnap.data();
        modelData.creatorUsername = creatorData.username || creatorData.email || 'Unknown';
        modelData.creatorProfilePicture = creatorData.profilePicture || '';
      } else {
        modelData.creatorUsername = 'Unknown';
        modelData.creatorProfilePicture = '';
      }
    } catch (error) {
      console.error('Error fetching creator info:', error);
      modelData.creatorUsername = 'Unknown';
      modelData.creatorProfilePicture = '';
    }

    console.log("Model found:", modelData.title);
    return { success: true, model: modelData };
  } catch (error) {
    console.error("Error fetching model:", error);
    return { success: false, message: error.message };
  }
};

// Get supported extensions (utility function)
export const getSupportedExtensions = () => {
  return ALL_SUPPORTED_EXTENSIONS;
};

// Get software options (utility function)
export const getSoftwareOptions = () => {
  return Object.keys(SUPPORTED_EXTENSIONS);
};

// În backend/models.js - adaugă această funcție:

// Toggle favorite model (add/remove from favorites)
export const toggleFavoriteModel = async (modelId) => {
  try {
    console.log("=== TOGGLING FAVORITE ===");
    console.log("Model ID:", modelId);

    if (!auth.currentUser) {
      return { success: false, message: 'User not authenticated' };
    }

    const userId = auth.currentUser.uid;
    const { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } = await import('firebase/firestore');
    
    const modelRef = doc(db, "models", modelId);
    const userRef = doc(db, "users", userId);

    // Check if model exists
    const modelDoc = await getDoc(modelRef);
    if (!modelDoc.exists()) {
      return { success: false, message: 'Model not found' };
    }

    // Get user's current favorites
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const favorites = userData.favourites || [];
    const isFavorite = favorites.includes(modelId);

    if (isFavorite) {
      // Remove from favorites
      console.log("Removing from favorites");
      await updateDoc(modelRef, { 
        favorites: increment(-1) 
      });
      await updateDoc(userRef, { 
        favourites: arrayRemove(modelId) 
      });
      return { 
        success: true, 
        message: 'Removed from favorites', 
        action: 'removed',
        isFavorite: false 
      };
    } else {
      // Add to favorites
      console.log("Adding to favorites");
      await updateDoc(modelRef, { 
        favorites: increment(1) 
      });
      await updateDoc(userRef, { 
        favourites: arrayUnion(modelId) 
      });
      return { 
        success: true, 
        message: 'Added to favorites', 
        action: 'added',
        isFavorite: true 
      };
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return { success: false, message: error.message };
  }
};

// Check if model is favorited by current user
export const isModelFavorited = async (modelId) => {
  try {
    if (!auth.currentUser) {
      return false;
    }

    const { doc, getDoc } = await import('firebase/firestore');
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const favorites = userData.favourites || [];
    return favorites.includes(modelId);
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
};

// Get user's favorite models
export const getUserFavoriteModels = async (userId) => {
  try {
    console.log("=== FETCHING USER FAVORITES ===");
    console.log("User ID:", userId);

    const { doc, getDoc } = await import('firebase/firestore');
    
    // Get user's favorites list
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found', models: [] };
    }

    const userData = userDoc.data();
    const favoriteIds = userData.favourites || [];
    console.log("Favorite IDs:", favoriteIds);

    if (favoriteIds.length === 0) {
      return { success: true, models: [] };
    }

    // Fetch all favorited models
    const favoriteModels = [];
    
    for (const modelId of favoriteIds) {
      try {
        const modelRef = doc(db, "models", modelId);
        const modelDoc = await getDoc(modelRef);
        
        if (modelDoc.exists()) {
          const modelData = { id: modelDoc.id, ...modelDoc.data() };
          
          // Fetch creator info
          try {
            const creatorRef = doc(db, "users", modelData.creatorUID);
            const creatorSnap = await getDoc(creatorRef);
            
            if (creatorSnap.exists()) {
              const creatorData = creatorSnap.data();
              modelData.creatorUsername = creatorData.username || creatorData.email || 'Unknown';
            } else {
              modelData.creatorUsername = 'Unknown';
            }
          } catch (error) {
            console.error('Error fetching creator info:', error);
            modelData.creatorUsername = 'Unknown';
          }
          
          favoriteModels.push(modelData);
        }
      } catch (error) {
        console.error(`Error fetching model ${modelId}:`, error);
      }
    }

    console.log("Favorite models found:", favoriteModels.length);
    return { success: true, models: favoriteModels };
  } catch (error) {
    console.error("Error fetching favorite models:", error);
    return { success: false, message: error.message, models: [] };
  }
};
// DOWNLOAD
export const downloadModel = async (modelId, fileName = null) => {
  try {
    console.log("=== INITIATING MODEL DOWNLOAD ===");
    console.log("Model ID:", modelId);
    console.log("File name:", fileName);

    if (!auth.currentUser) {
      return { success: false, message: 'User not authenticated' };
    }

    const userId = auth.currentUser.uid;
    const { doc, getDoc, updateDoc, arrayUnion, increment } = await import('firebase/firestore');
    const { ref, getDownloadURL } = await import('firebase/storage');

    // Get model data
    const modelRef = doc(db, "models", modelId);
    const modelDoc = await getDoc(modelRef);

    if (!modelDoc.exists()) {
      return { success: false, message: 'Model not found' };
    }

    const modelData = modelDoc.data();
    const modelFiles = modelData.modelFiles || [];

    if (modelFiles.length === 0) {
      return { success: false, message: 'No files available for download' };
    }

    let filesToDownload = [];

    if (fileName) {
      // Download specific file
      const specificFile = modelFiles.find(file => file.fileName === fileName);
      if (!specificFile) {
        return { success: false, message: 'File not found' };
      }
      filesToDownload = [specificFile];
    } else {
      // Download all files
      filesToDownload = modelFiles;
    }

    // Update download count and user's downloaded models
    const userRef = doc(db, "users", userId);
    
    // Check if user has already downloaded this model
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const downloadedModels = userData.downloadedModels || [];
    const hasDownloaded = downloadedModels.includes(modelId);

    // Update model download count
    if(!hasDownloaded){
    await updateDoc(modelRef, {
      downloads: increment(1),
      downloadedBy: arrayUnion(userId)
    });}

    // Update user's downloaded models if not already downloaded
    if (!hasDownloaded) {
      await updateDoc(userRef, {
        downloadedModels: arrayUnion(modelId)
      });
    }

    // Download files using Firebase's method
    const downloadResults = [];

    for (const file of filesToDownload) {
      try {
        console.log(`Downloading file: ${file.fileName}`);
        
        // Use the fileUrl that's already stored in the model data
        // This URL should work without CORS issues
        const link = document.createElement('a');
        link.href = file.fileUrl;
        link.download = file.fileName;
        link.style.display = 'none';
        link.target = '_blank'; // Open in new tab to avoid CORS
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        downloadResults.push({
          fileName: file.fileName,
          success: true,
          fileSize: file.fileSize
        });
        
        console.log(`File download initiated: ${file.fileName}`);
        
        // Small delay between downloads to avoid browser issues
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (fileError) {
        console.error(`Error downloading file ${file.fileName}:`, fileError);
        downloadResults.push({
          fileName: file.fileName,
          success: false,
          error: fileError.message
        });
      }
    }

    console.log("=== DOWNLOAD INITIATED ===");
    return {
      success: true,
      message: filesToDownload.length === 1 
        ? `Download initiated for "${filesToDownload[0].fileName}"!`
        : `Download initiated for ${filesToDownload.length} files!`,
      downloads: downloadResults,
      totalFiles: filesToDownload.length,
      successfulDownloads: downloadResults.filter(r => r.success).length
    };

  } catch (error) {
    console.error("Error during download process:", error);
    return {
      success: false,
      message: error.message || 'Download failed. Please try again.'
    };
  }
};

// Get download URL for a specific file (for direct download links)
export const getFileDownloadUrl = async (filePath) => {
  try {
    const { ref, getDownloadURL } = await import('firebase/storage');
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
};
// Get modeld of a certain creator
export const getModelsByCreator = async (creatorUID) => {
  try {
    console.log("Fetching models for creator:", creatorUID);
    
    const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');

    // Query the user's models
    const q = query(
      collection(db, "models"), 
      where("creatorUID", "==", creatorUID),
      where("isPublic", "==", true)
    );

    const snapshot = await getDocs(q);
    const models = [];

    snapshot.forEach((docSnapshot) => {
      models.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    // Get creator info for each model
    for (let model of models) {
      try {
        const creatorRef = doc(db, "users", model.creatorUID);
        const creatorSnap = await getDoc(creatorRef);
        if (creatorSnap.exists()) {
          const creatorData = creatorSnap.data();
          model.creatorUsername = creatorData.username || creatorData.email || 'Unknown';
          model.creatorProfilePicture = creatorData.profilePicture || '';
        }
      } catch (error) {
        console.error('Error fetching creator info:', error);
        model.creatorUsername = 'Unknown';
        model.creatorProfilePicture = '';
      }
    }

    return { success: true, models };
  } catch (error) {
    console.error("Error fetching models by creator:", error);
    return { success: false, message: error.message, models: [] };
  }
};

// Add comment to model
export const addComment = async (modelId, commentText) => {
  try {
    console.log("=== ADDING COMMENT ===");
    console.log("Model ID:", modelId);
    console.log("Comment text:", commentText);

    if (!auth.currentUser) {
      return { success: false, message: 'User not authenticated' };
    }

    if (!commentText || !commentText.trim()) {
      return { success: false, message: 'Comment text is required' };
    }

    const userId = auth.currentUser.uid;
    const { doc, getDoc, updateDoc, arrayUnion } = await import('firebase/firestore');
    
    // Get user info for the comment
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found' };
    }

    const userData = userDoc.data();
    
    // Create comment object
    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      username: userData.username || userData.email || 'Unknown',
      profilePicture: userData.profilePicture || '',
      text: commentText.trim(),
      createdAt: new Date(),
      replies: []
    };

    // Add comment to model
    const modelRef = doc(db, "models", modelId);
    await updateDoc(modelRef, {
      comments: arrayUnion(comment)
    });

    console.log("Comment added successfully");
    return { success: true, message: 'Comment added successfully', comment };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, message: error.message };
  }
};
// Add reply to comment
export const addReply = async (modelId, commentId, replyText, repliedToUsername = null) => {
    try {
        console.log("=== ADDING REPLY ===");
        console.log("Model ID:", modelId);
        console.log("Comment ID:", commentId);
        console.log("Reply text:", replyText);
        console.log("Replied to:", repliedToUsername);

        if (!auth.currentUser) {
            return { success: false, message: 'User not authenticated' };
        }

        if (!replyText || !replyText.trim()) {
            return { success: false, message: 'Reply text is required' };
        }

        const userId = auth.currentUser.uid;
        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
        
        // Get user info for the reply
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return { success: false, message: 'User not found' };
        }

        const userData = userDoc.data();
        
        // Get model data
        const modelRef = doc(db, "models", modelId);
        const modelDoc = await getDoc(modelRef);
        
        if (!modelDoc.exists()) {
            return { success: false, message: 'Model not found' };
        }

        const modelData = modelDoc.data();
        const comments = modelData.comments || [];
        
        // Find the comment and add reply
        const updatedComments = comments.map(comment => {
            if (comment.id === commentId) {
                const reply = {
                    id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId: userId,
                    username: userData.username || userData.email || 'Unknown',
                    profilePicture: userData.profilePicture || '',
                    text: replyText.trim(),
                    repliedTo: repliedToUsername, // Adăugăm câmpul repliedTo
                    createdAt: new Date()
                };
                
                return {
                    ...comment,
                    replies: [...(comment.replies || []), reply]
                };
            }
            return comment;
        });

        // Update model with new reply
        await updateDoc(modelRef, {
            comments: updatedComments
        });

        console.log("Reply added successfully");
        return { success: true, message: 'Reply added successfully' };
    } catch (error) {
        console.error("Error adding reply:", error);
        return { success: false, message: error.message };
    }
};
// Get comments for model (this is already included in getModelById, but can be used separately if needed)
export const getModelComments = async (modelId) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    
    const modelRef = doc(db, "models", modelId);
    const modelDoc = await getDoc(modelRef);
    
    if (!modelDoc.exists()) {
      return { success: false, message: 'Model not found', comments: [] };
    }
    
    const modelData = modelDoc.data();
    const comments = modelData.comments || [];
    
    // Sort comments by creation date (newest first)
    const sortedComments = comments.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
      return dateB - dateA;
    });
    
    return { success: true, comments: sortedComments };
  } catch (error) {
    console.error("Error getting comments:", error);
    return { success: false, message: error.message, comments: [] };
  }
};
