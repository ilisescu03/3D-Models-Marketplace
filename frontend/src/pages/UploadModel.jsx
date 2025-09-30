
import React, { useState, useEffect } from 'react';
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import { uploadModel, getSupportedExtensions, getSoftwareOptions } from '/backend/models.js';
import Header from '../UI+UX/Header';
import '/frontend/css/UploadModel.css';


// Constants
const CATEGORY_OPTIONS = [
    'Architecture', 'Character', 'Vehicle', 'Environment', 'Furniture',
    'Electronics', 'Jewelry', 'Weapons', 'Food & Drink', 'Plants', 'Animals',
    'Abstract', 'Mechanical', 'Fashion & Style', 'Sports', 'Culture & History','Other'
];

const TAG_OPTIONS = [
    'Low Poly', 'High Poly', 'Textured', 'Rigged', 'Animated',
    'Game Ready', 'PBR', 'Stylized', 'Realistic', 'Fantasy',
    'Sci-Fi', 'Medieval', 'Modern', 'Vintage', 'Industrial'
];
function UploadModel() {
    const { currentUser, userLogedIn } = useAuth();

    // Form data state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Model',
        category: '',
        software: [],
        tags: [],
        isPublic: true
    });

    // Files state
    const [modelFiles, setModelFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    // UI state
    const [dragActive, setDragActive] = useState(false);
    const [previewDragActive, setPreviewDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Get supported extensions and software options
    const [supportedExtensions] = useState(getSupportedExtensions());
    const [softwareOptions] = useState(getSoftwareOptions());

    // Redirect if not logged in
    useEffect(() => {
        if (!userLogedIn && !currentUser) {
            window.location.href = '/login';
        }
    }, [userLogedIn, currentUser]);

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

    // Handle software selection
    const handleSoftwareToggle = (software) => {
        setFormData(prev => ({
            ...prev,
            software: prev.software.includes(software)
                ? prev.software.filter(s => s !== software)
                : [...prev.software, software]
        }));
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
    const handleModelDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        handleModelFiles(files);
    };

    // Handle preview image drop
    const handlePreviewDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        handlePreviewFiles(files);
    };

    // Process model files
    const handleModelFiles = (files) => {
        const validFiles = files.filter(file => {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            return supportedExtensions.includes(extension);
        });

        if (validFiles.length !== files.length) {
            setError('Some files were rejected. Please upload only supported 3D model formats.');
        } else {
            setError('');
        }

        setModelFiles(prev => [...prev, ...validFiles]);
    };

    // Process preview images
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
    const removeModelFile = (index) => {
        setModelFiles(prev => prev.filter((_, i) => i !== index));
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

        if (modelFiles.length === 0) {
            setError('Please upload at least one 3D model file.');
            return;
        }

        if (previewImages.length === 0) {
            setError('Please upload at least one preview image.');
            return;
        }

        setUploading(true);

        try {
            console.log('Starting upload...');
            const result = await uploadModel(formData, modelFiles, previewImages);

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
                    isPublic: true
                });
                setModelFiles([]);
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
            <div className="upload-container">
                <h1 className="upload-title">Upload 3D Model</h1>
                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert success">{success}</div>}
                <form onSubmit={handleSubmit} className="upload-form">
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
                    {/* Software Compatibility */}
                    <h2 className="section-title">Software Compatibility</h2>
                    <p className="muted-paragraph">
                        Select the software programs that can open your model files:
                    </p>
                    <div className="tags-container">
                        {softwareOptions.map(software => (
                            <button
                                key={software}
                                type="button"
                                onClick={() => !uploading && handleSoftwareToggle(software)}
                                className={formData.software.includes(software) ? 'tag active' : 'tag'}
                                disabled={uploading}
                            >
                                {software}
                            </button>
                        ))}
                    </div>

                    {/* Tags */}
                    <h2 className="section-title">Tags</h2>
                    <p className="muted-paragraph">
                        Select tags that describe your model:
                    </p>
                    <div className="tags-container">
                        {TAG_OPTIONS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => !uploading && handleTagToggle(tag)}
                                className={formData.tags.includes(tag) ? 'tag active' : 'tag'}
                                disabled={uploading}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Model Files Upload */}
                    <h2 className="section-title">Model Files *</h2>
                    <div
                        className={dragActive ? 'file-upload-area active' : 'file-upload-area'}
                        onDragEnter={(e) => !uploading && handleDrag(e, true, setDragActive)}
                        onDragLeave={(e) => !uploading && handleDrag(e, false, setDragActive)}
                        onDragOver={(e) => !uploading && handleDrag(e, true, setDragActive)}
                        onDrop={!uploading ? handleModelDrop : undefined}
                        onClick={() => !uploading && document.getElementById('modelFiles').click()}
                    >
                        <div className="upload-icon">📁</div>
                        <div className="upload-text">
                            {uploading ? 'Uploading...' : 'Drag & drop your 3D model files here, or click to browse'}
                        </div>
                        <div className="upload-subtext">
                            Supported formats: .blend, .fbx, .obj, .c4d, .max, .ma, .mb, and more (max 100MB per file, 500MB total)
                        </div>
                    </div>

                    <input
                        id="modelFiles"
                        type="file"
                        multiple
                        accept={supportedExtensions.join(',')}
                        onChange={(e) => !uploading && handleModelFiles(Array.from(e.target.files))}
                        className="hidden-input"
                        disabled={uploading}
                    />

                    {modelFiles.length > 0 && (
                        <div className="file-list">
                            <h4>Selected Files ({modelFiles.length}):</h4>
                            {modelFiles.map((file, index) => (
                                <div key={index} className="file-item">
                                    <span>
                                        <strong>{file.name}</strong>
                                        <span className="file-size">
                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => !uploading && removeModelFile(index)}
                                        className="remove-button"
                                        disabled={uploading}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
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
                        <div className="upload-text">
                            {uploading ? 'Uploading...' : 'Drag & drop preview images here, or click to browse'}
                        </div>
                        <div className="upload-subtext">
                            Upload images that showcase your model (JPG, PNG, WebP - max 10MB per image, max 10 images)
                        </div>
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
                                        <img
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            className="preview-image"
                                        />
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
                        <label htmlFor="isPublic" className="clickable-label">
                            Make this model publicly visible in community
                        </label>
                    </div>
                    <p className="hint">
                        {formData.isPublic
                            ? 'Your model will be visible to all users and appear in the community feed.'
                            : 'Your model will be private and only you can see it.'}
                    </p>

                    {/* Submit Buttons */}
                    <div className="actions">
                        <button
                            type="submit"
                            disabled={uploading}
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
                            <p className="progress-title">
                                📤 Uploading your model... This may take a few minutes depending on file size.
                            </p>
                            <p className="progress-subtext">
                                Please don't close this page until upload is complete.
                            </p>
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
                                <li>Support for 15+ software formats</li>
                                <li>Maximum 100MB per file</li>
                                <li>Maximum 500MB total upload size</li>
                                <li>Multiple files allowed for packages</li>
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