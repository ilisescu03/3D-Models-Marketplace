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