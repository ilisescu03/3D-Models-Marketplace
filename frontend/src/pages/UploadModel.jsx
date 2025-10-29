// UploadModel.jsx
import React, { useState, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import { uploadModel, getSupportedExtensions, getSoftwareOptions } from '/backend/models.js';
import Header from '../UI+UX/Header';
import '/frontend/css/UploadModel.css';

// Constants
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
const CATEGORY_OPTIONS = [
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

const TAG_OPTIONS = [
    'Low Poly', 'High Poly', 'Textured', 'Rigged', 'Animated',
    'Game Ready', 'PBR', 'Stylized', 'Realistic', 'Fantasy',
    'Sci-Fi', 'Medieval', 'Modern', 'Vintage', 'Industrial'
];

const SUPPORTED_ARCHIVES = ['.zip'];

function UploadModel() {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const { currentUser, userLogedIn } = useAuth();

    // Form data state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Model',
        category: '',
        software: [],
        tags: [],
        isPublic: true,
        price: 0 // Price field
    });
    const [isFree, setIsFree] = useState(true); // State for pricing toggle
    const [customTagInput, setCustomTagInput] = useState('');
    // Files state
    const [modelFile, setModelFile] = useState(null);
    const [previewImages, setPreviewImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    // UI state
    const [dragActive, setDragActive] = useState(false);
    const [previewDragActive, setPreviewDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Get supported extensions and software options
    const [softwareOptions] = useState(getSoftwareOptions());

    // Create once all supported extensions list
    const allSupportedExtensions = useMemo(() => {
        const extensionSet = new Set();
        Object.values(SUPPORTED_EXTENSIONS).forEach(extArray => {
            extArray.forEach(ext => extensionSet.add(ext));
        });
        // Add .zip to supported extensions
        extensionSet.add('.zip');
        return Array.from(extensionSet);
    }, []);

    // Inverted mapping
    const extensionToSoftwareMap = useMemo(() => {
        const map = {};
        Object.entries(SUPPORTED_EXTENSIONS).forEach(([software, extensions]) => {
            extensions.forEach(ext => {
                if (!map[ext]) {
                    map[ext] = [];
                }
                map[ext].push(software);
            });
        });
        return map;
    }, []);

    // Update software by file
    const updateSoftwareFromFile = async (file) => {
        const detectedSoftware = new Set();
        const extension = '.' + file.name.split('.').pop().toLowerCase();

        if (extension === '.zip') {
            // Process ZIP archive to detect supported files
            try {
                const zip = new JSZip();
                const content = await zip.loadAsync(file);

                for (const fileName in content.files) {
                    if (!content.files[fileName].dir) {
                        const fileExtension = '.' + fileName.split('.').pop().toLowerCase();
                        if (extensionToSoftwareMap[fileExtension]) {
                            extensionToSoftwareMap[fileExtension].forEach(software => {
                                detectedSoftware.add(software);
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing ZIP file:', error);
                setError('Error processing ZIP archive. Please make sure it\'s a valid ZIP file.');
                return;
            }
        } else {
            // Single file - detect software directly
            if (extensionToSoftwareMap[extension]) {
                extensionToSoftwareMap[extension].forEach(software => {
                    detectedSoftware.add(software);
                });
            }
        }

        setFormData(prev => ({
            ...prev,
            software: Array.from(detectedSoftware).sort()
        }));
    };

    useEffect(() => {
        document.title = `Upload Model - ShapeHive`;
    }, []);

    // Redirect if not logged in
    useEffect(() => {
        if (!userLogedIn && !currentUser) {
            window.location.href = '/login';
        }
    }, [userLogedIn, currentUser]);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Clear messages after time
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(''); // Clear error when user types
    };

    // Handle tag selection
    const handleTagToggle = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    // Handle custom tag input change
    const handleCustomTagInputChange = (e) => {
        setCustomTagInput(e.target.value);
    };

    // Add custom tag
    const handleAddCustomTag = () => {
        if (!customTagInput.trim()) {
            setError('Please enter a tag name');
            return;
        }

        const newTag = customTagInput.trim();

        // Check if tag already exists (case insensitive)
        const tagExists = formData.tags.some(
            tag => tag.toLowerCase() === newTag.toLowerCase()
        );

        if (tagExists) {
            setError(`Tag "${newTag}" already exists`);
            return;
        }

        // Add to form data tags
        setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, newTag]
        }));

        // Clear input
        setCustomTagInput('');
        setError('');
    };

    // Remove tag (works for both predefined and custom tags)
    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    // Handle Enter key in custom tag input
    const handleCustomTagKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomTag();
        }
    };

    // Handle file drag and drop
    const handleDrag = (e, active, setter) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setter(true);
        } else if (e.type === "dragleave") {
            setter(false);
        }
    };

    // Handle model file drop
    const handleModelDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await handleModelFile(files[0]); // Only take the first file
        }
    };

    // Process model file
    const handleModelFile = async (file) => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();

        // Check if file is supported
        if (!allSupportedExtensions.includes(extension)) {
            setError('File format not supported. Please upload a supported 3D model file or .zip archive.');
            return;
        }

        setError('');
        setModelFile(file);
        await updateSoftwareFromFile(file);
    };

    // Handle preview image drop
    const handlePreviewDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        handlePreviewFiles(files);
    };

    // Process preview files
    const handlePreviewFiles = (files) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length !== files.length) {
            setError('Please upload only image files for preview.');
        } else {
            setError('');
        }

        // Create preview URLs
        const newUrls = imageFiles.map(file => URL.createObjectURL(file));

        setPreviewImages(prev => [...prev, ...imageFiles]);
        setPreviewUrls(prev => [...prev, ...newUrls]);
    };

    // Remove model file
    const removeModelFile = () => {
        setModelFile(null);
        setFormData(prev => ({
            ...prev,
            software: []
        }));
    };

    // Remove preview image
    const removePreviewImage = (index) => {
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Basic validation
        if (!formData.title.trim()) {
            setError('Please enter a title for your model.');
            return;
        }

        if (!formData.category) {
            setError('Please select a category.');
            return;
        }

        if (!modelFile) {
            setError('Please upload a 3D model file or .zip archive.');
            return;
        }

        // Check if compatible software was detected
        if (formData.software.length === 0) {
            setError('No compatible software detected. The uploaded file must contain supported 3D model formats.');
            return;
        }

        if (previewImages.length === 0) {
            setError('Please upload at least one preview image.');
            return;
        }

        // Price validation
        const finalFormData = { ...formData };
        if (!isFree) {
            const price = parseFloat(formData.price);
            if (isNaN(price) || price <= 0) {
                setError('For a paid model, please enter a valid price greater than 0.');
                return;
            }
            finalFormData.price = price; // Ensure price is a number
        } else {
            finalFormData.price = 0; // Ensure price is 0 for free models
        }


        setUploading(true);

        try {
            console.log('Starting upload...');
            const result = await uploadModel(finalFormData, modelFile, previewImages);

            if (result.success) {
                setSuccess('Model uploaded successfully! Redirecting to home page...');
                // Clear form
                setFormData({
                    title: '',
                    description: '',
                    type: 'Model',
                    category: '',
                    software: [],
                    tags: [],
                    isPublic: true,
                    price: 0 // Reset price
                });
                setIsFree(true); // Reset to free
                setModelFile(null);
                setPreviewImages([]);
                setPreviewUrls([]);

                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                setError('Upload failed: ' + result.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Handle toggle for pricing
    const handlePriceToggle = () => {
        const newIsFree = !isFree;
        setIsFree(newIsFree);
        if (newIsFree) {
            setFormData(prev => ({ ...prev, price: 0 }));
        }
    };

    // Show loading if user data is still loading
    if (!currentUser && userLogedIn === undefined) {
        return (
            <div className="upload-model-page">
                <Header />
                <div className="upload-container">
                    <div className="centered-loading">
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-model-page">
            <Header />
            <div className="upload-container" style={{ marginTop: windowWidth < 1000 ? '-6rem' : '8rem' }}>
                <form onSubmit={handleSubmit} className="upload-form">
                    <h1 className="upload-title">Upload 3D Model</h1>
                    {error && <div className="alert error">{error}</div>}
                    {success && <div className="alert success">{success}</div>}

                    {/* Grid for matrix layout */}
                    <div className="upload-grid">
                        {/* Upload files and images*/}
                        <div className="upload-column">
                            {/* Model Files Upload */}
                            <h2 className="section-title">Model File *</h2>
                            <div
                                className={dragActive ? 'file-upload-area active' : 'file-upload-area'}
                                onDragEnter={(e) => !uploading && handleDrag(e, true, setDragActive)}
                                onDragLeave={(e) => !uploading && handleDrag(e, false, setDragActive)}
                                onDragOver={(e) => !uploading && handleDrag(e, true, setDragActive)}
                                onDrop={!uploading ? handleModelDrop : undefined}
                                onClick={() => !uploading && document.getElementById('modelFile').click()}
                            >
                                <div className="upload-icon">📁</div>
                                <div className="upload-text">
                                    {uploading ? 'Uploading...' : 'Drag & drop your 3D model file or .zip archive here, or click to browse'}
                                </div>
                                <div className="upload-subtext">
                                    Supported formats: {allSupportedExtensions.join(', ')} (max 500MB)
                                </div>
                            </div>

                            {/* Input*/}
                            <input
                                id="modelFile"
                                type="file"
                                accept={allSupportedExtensions.join(',')}
                                onChange={(e) => !uploading && e.target.files[0] && handleModelFile(e.target.files[0])}
                                className="hidden-input"
                                disabled={uploading}
                            />

                            {modelFile && (
                                <div className="file-list">
                                    <h4>Selected File:</h4>
                                    <div className="file-item">
                                        <span>
                                            <strong>{modelFile.name}</strong>
                                            <span className="file-size"> ({(modelFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => !uploading && removeModelFile()}
                                            className="remove-button"
                                            disabled={uploading}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modelFile && (
                                <div className="detected-software-info">
                                    <strong>Compatible software:</strong> {formData.software.length > 0 ? formData.software.join(', ') : 'None detected - upload will be blocked'}
                                </div>
                            )}

                            {/* Preview Images Upload */}
                            <h2 className="section-title">Preview Images *</h2>
                            <div
                                className={previewDragActive ? 'file-upload-area active' : 'file-upload-area'}
                                onDragEnter={(e) => !uploading && handleDrag(e, true, setPreviewDragActive)}
                                onDragLeave={(e) => !uploading && handleDrag(e, false, setPreviewDragActive)}
                                onDragOver={(e) => !uploading && handleDrag(e, true, setPreviewDragActive)}
                                onDrop={!uploading ? handlePreviewDrop : undefined}
                                onClick={() => !uploading && document.getElementById('previewImages').click()}
                            >
                                <div className="upload-icon">🖼️</div>
                                <div className="upload-text">{uploading ? 'Uploading...' : 'Drag & drop preview images here, or click to browse'}</div>
                                <div className="upload-subtext">Upload images that showcase your model (JPG, PNG, WebP - max 10MB per image, max 10 images)</div>
                            </div>
                            <input
                                id="previewImages"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => !uploading && handlePreviewFiles(Array.from(e.target.files))}
                                className="hidden-input"
                                disabled={uploading}
                            />

                            {previewUrls.length > 0 && (
                                <div>
                                    <h4 className="mt-20">Preview Images ({previewUrls.length}):</h4>
                                    <div className="preview-grid">
                                        {previewUrls.map((url, index) => (
                                            <div key={index} className="preview-item">
                                                <img src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                                                <button
                                                    type="button"
                                                    onClick={() => !uploading && removePreviewImage(index)}
                                                    className="remove-preview-button"
                                                    disabled={uploading}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Model info */}
                        <div className="info-column">
                            {/* Basic Information */}
                            <h2 className="section-title">Basic Information</h2>
                            <div className="input-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Enter model title..."
                                    required
                                    disabled={uploading}
                                />
                            </div>
                            <div className="input-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="form-input form-textarea"
                                    placeholder="Describe your model..."
                                    disabled={uploading}
                                />
                            </div>
                            <div className="two-col-grid">
                                <div className="input-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="form-input form-select"
                                        disabled={uploading}
                                    >
                                        <option value="Model">Single Model</option>
                                        <option value="Package">Package (Multiple Models)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="form-label">Category *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="form-input form-select"
                                        required
                                        disabled={uploading}
                                    >
                                        <option value="">Select Category</option>
                                        {CATEGORY_OPTIONS.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ADDED: Pricing Section */}
                            <h2 className="section-title">Pricing</h2>
                            <div className="pricing-toggle">
                                {/* Hidden radio buttons for state management */}
                                <input
                                    id="price-free"
                                    type="radio"
                                    name="pricing"
                                    value="free"
                                    checked={isFree}
                                    onChange={() => {
                                        setIsFree(true);
                                        setFormData(prev => ({ ...prev, price: 0 }));
                                    }}
                                    disabled={uploading}
                                />
                                <label htmlFor="price-free" className="toggle-label">Free</label>

                                <input
                                    id="price-paid"
                                    type="radio"
                                    name="pricing"
                                    value="paid"
                                    checked={!isFree}
                                    onChange={() => setIsFree(false)}
                                    disabled={uploading}
                                />
                                <label htmlFor="price-paid" className="toggle-label">Paid</label>

                                {/* The visual sliding part of the switch */}
                                <div className="switch-handle"></div>
                            </div>

                            {!isFree && (
                                <div className="input-group mt-20">
                                    <label className="form-label">Price (€) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., 4.99"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        disabled={uploading}
                                    />
                                    <p className="hint">Enter a price greater than 0. Use a period (.) for decimals.</p>
                                </div>
                            )}

                            {/* Tags */}
                            <h2 className="section-title">Tags</h2>
                            <p className="muted-paragraph">Select tags that describe your model or add your own:</p>
                            <div className="tags-container">
                                {formData.tags.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => !uploading && handleRemoveTag(tag)}
                                        className="tag active"
                                        disabled={uploading}
                                    >
                                        {tag}
                                        <span className="tag-remove">×</span>
                                    </button>
                                ))}
                                {TAG_OPTIONS.filter(tag => !formData.tags.includes(tag)).map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => !uploading && handleTagToggle(tag)}
                                        className="tag"
                                        disabled={uploading}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <div className="custom-tags-section">
                                <div className="custom-tags-input-group">
                                    <input
                                        type="text"
                                        value={customTagInput}
                                        onChange={handleCustomTagInputChange}
                                        onKeyPress={handleCustomTagKeyPress}
                                        placeholder="Add tag..."
                                        className="custom-tag-input"
                                        disabled={uploading}
                                        maxLength={30}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomTag}
                                        className="add-custom-tag-button"
                                        disabled={uploading || !customTagInput.trim()}
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="custom-tags-hint">Press Enter or click "Add" to add tag (max 30 characters)</div>
                            </div>

                            {/* Privacy Settings */}
                            <h2 className="section-title">Privacy Settings</h2>
                            <div className="inline-checkbox">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    name="isPublic"
                                    checked={formData.isPublic}
                                    onChange={handleInputChange}
                                    disabled={uploading}
                                />
                                <label htmlFor="isPublic" className="clickable-label">Make this model publicly visible in community</label>
                            </div>
                            <p className="hint">
                                {formData.isPublic
                                    ? 'Your model will be visible to all users and appear in the community feed.'
                                    : 'Your model will be private and only you can see it.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="actions">
                        <button
                            type="submit"
                            disabled={uploading || formData.software.length === 0}
                            className="primary-button"
                        >
                            {uploading ? 'Uploading Model...' : 'Upload Model'}
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.href = '/'}
                            className="secondary-button"
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Upload Progress Info */}
                    {uploading && (
                        <div className="upload-progress">
                            <p className="progress-title">📤 Uploading your model... This may take a few minutes depending on file size.</p>
                            <p className="progress-subtext">Please don't close this page until upload is complete.</p>
                        </div>
                    )}
                </form>

                {/* Help Section */}
                <div className="upload-form">
                    <h2 className="section-title">📋 Upload Guidelines</h2>
                    <div className="guidelines-grid">
                        <div>
                            <h4 className="guideline-title">📁 Model Files</h4>
                            <ul className="guideline-list">
                                <li>Single file upload only (3D model or .zip archive)</li>
                                <li>Support for 15+ software formats</li>
                                <li>Maximum 500MB file size</li>
                                <li>.zip archives will be automatically extracted</li>
                                <li>Must contain at least one supported 3D format</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="guideline-title">🖼️ Preview Images</h4>
                            <ul className="guideline-list">
                                <li>At least one image required</li>
                                <li>JPG, PNG, or WebP formats</li>
                                <li>Maximum 10MB per image</li>
                                <li>Maximum 10 images total</li>
                                <li>First image will be the main thumbnail</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="guideline-title">✅ Best Practices</h4>
                            <ul className="guideline-list">
                                <li>Use descriptive titles and descriptions</li>
                                <li>Select appropriate software compatibility</li>
                                <li>Add relevant tags for discoverability</li>
                                <li>Include multiple angle preview images</li>
                                <li>Organize files clearly in packages</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UploadModel;