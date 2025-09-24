
import React, { useState, useEffect } from 'react';
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import { uploadModel, getSupportedExtensions, getSoftwareOptions } from '/backend/models.js';
import Header from '../UI+UX/Header';

// Styles
const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
    paddingTop: '120px',
    paddingBottom: '50px'
};

const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 20px'
};

const formStyle = {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px'
};

const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: '30px'
};

const sectionTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
    borderBottom: '2px solid #ff7b00',
    paddingBottom: '5px'
};

const inputGroupStyle = {
    marginBottom: '20px'
};

const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333'
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
};

const textareaStyle = {
    ...inputStyle,
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'inherit'
};

const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
};

const fileUploadAreaStyle = {
    border: '3px dashed #e0e0e0',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#fafafa'
};

const fileUploadActiveStyle = {
    ...fileUploadAreaStyle,
    borderColor: '#ff7b00',
    backgroundColor: '#fff7f0'
};

const uploadIconStyle = {
    fontSize: '3rem',
    color: '#ccc',
    marginBottom: '15px'
};

const uploadTextStyle = {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '10px'
};

const uploadSubtextStyle = {
    fontSize: '0.9rem',
    color: '#999'
};

const fileListStyle = {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
};

const fileItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '6px',
    marginBottom: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
};

const removeButtonStyle = {
    background: '#ff4757',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: '0.8rem'
};

const previewGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '15px',
    marginTop: '15px'
};

const previewItemStyle = {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0'
};

const previewImageStyle = {
    width: '100%',
    height: '120px',
    objectFit: 'cover'
};

const removePreviewStyle = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    background: 'rgba(255, 71, 87, 0.8)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '25px',
    height: '25px',
    cursor: 'pointer',
    fontSize: '14px'
};

const tagsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '10px'
};

const tagStyle = {
    backgroundColor: '#c2c2c2ff',
    color: '#000000ff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
};

const tagActiveStyle = {
    ...tagStyle,
    backgroundColor: '#ff7b00',
    color: 'white'
};

const buttonStyle = {
    backgroundColor: 'rgba(255, 145, 0, 1)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    marginTop:'10px',
    padding: '15px 30px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginRight: '15px'
};

const buttonDisabledStyle = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
};

const errorStyle = {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ffcdd2'
};

const successStyle = {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #c8e6c9'
};

// Constants
const CATEGORY_OPTIONS = [
    'Architecture', 'Character', 'Vehicle', 'Environment', 'Furniture',
    'Electronics', 'Jewelry', 'Weapons', 'Food', 'Plants', 'Animals',
    'Abstract', 'Mechanical', 'Clothing', 'Other'
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
            <div style={pageStyle}>
                <Header />
                <div style={containerStyle}>
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        Loading...
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div style={pageStyle}>
            <Header />
            <div style={containerStyle}>
                <h1 style={titleStyle}>Upload 3D Model</h1>
                {error && <div style={errorStyle}>{error}</div>}
                {success && <div style={successStyle}>{success}</div>}
                <form onSubmit={handleSubmit} style={formStyle}>
                    {/* Basic Information */}
                    <h2 style={sectionTitleStyle}>Basic Information</h2>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            style={inputStyle}
                            placeholder="Enter model title..."
                            required
                            disabled={uploading}
                        />
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            style={textareaStyle}
                            placeholder="Describe your model..."
                            disabled={uploading}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                style={selectStyle}
                                disabled={uploading}
                            >
                                <option value="Model">Single Model</option>
                                <option value="Package">Package (Multiple Models)</option>
                            </select>
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                style={selectStyle}
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
                    <h2 style={sectionTitleStyle}>Software Compatibility</h2>
                    <p style={{ color: '#666', marginBottom: '15px' }}>
                        Select the software programs that can open your model files:
                    </p>
                    <div style={tagsContainerStyle}>
                        {softwareOptions.map(software => (
                            <button

                                key={software}
                                type="button"
                                onMouseEnter={(e) => { formData.software.includes(software) ? e.currentTarget.style.backgroundColor = '#994a00ff' : e.currentTarget.style.backgroundColor = '#8a8a8aff' }}
                                onMouseLeave={(e) => { formData.software.includes(software) ? e.currentTarget.style.backgroundColor = '#ff7b00' : e.currentTarget.style.backgroundColor = '#c2c2c2ff' }}
                                onClick={() => !uploading && handleSoftwareToggle(software)}
                                style={formData.software.includes(software) ? tagActiveStyle : tagStyle}
                                disabled={uploading}
                            >
                                {software}
                            </button>
                        ))}
                    </div>

                    {/* Tags */}
                    <h2 style={sectionTitleStyle}>Tags</h2>
                    <p style={{ color: '#666', marginBottom: '15px' }}>
                        Select tags that describe your model:
                    </p>
                    <div style={tagsContainerStyle}>
                        {TAG_OPTIONS.map(tag => (
                            <button
                                onMouseEnter={(e) => { formData.tags.includes(tag) ? e.currentTarget.style.backgroundColor = '#994a00ff' : e.currentTarget.style.backgroundColor = '#8a8a8aff' }}
                                onMouseLeave={(e) => { formData.tags.includes(tag) ? e.currentTarget.style.backgroundColor = '#ff7b00' : e.currentTarget.style.backgroundColor = '#c2c2c2ff' }}
                                key={tag}
                                type="button"
                                onClick={() => !uploading && handleTagToggle(tag)}
                                style={formData.tags.includes(tag) ? tagActiveStyle : tagStyle}
                                disabled={uploading}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Model Files Upload */}
                    <h2 style={sectionTitleStyle}>Model Files *</h2>
                    <div
                        style={dragActive ? fileUploadActiveStyle : fileUploadAreaStyle}
                        onDragEnter={(e) => !uploading && handleDrag(e, true, setDragActive)}
                        onDragLeave={(e) => !uploading && handleDrag(e, false, setDragActive)}
                        onDragOver={(e) => !uploading && handleDrag(e, true, setDragActive)}
                        onDrop={!uploading ? handleModelDrop : undefined}
                        onClick={() => !uploading && document.getElementById('modelFiles').click()}
                    >
                        <div style={uploadIconStyle}>📁</div>
                        <div style={uploadTextStyle}>
                            {uploading ? 'Uploading...' : 'Drag & drop your 3D model files here, or click to browse'}
                        </div>
                        <div style={uploadSubtextStyle}>
                            Supported formats: .blend, .fbx, .obj, .c4d, .max, .ma, .mb, and more (max 100MB per file, 500MB total)
                        </div>
                    </div>

                    <input
                        id="modelFiles"
                        type="file"
                        multiple
                        accept={supportedExtensions.join(',')}
                        onChange={(e) => !uploading && handleModelFiles(Array.from(e.target.files))}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />

                    {modelFiles.length > 0 && (
                        <div style={fileListStyle}>
                            <h4>Selected Files ({modelFiles.length}):</h4>
                            {modelFiles.map((file, index) => (
                                <div key={index} style={fileItemStyle}>
                                    <span>
                                        <strong>{file.name}</strong>
                                        <span style={{ color: '#666', marginLeft: '10px' }}>
                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => !uploading && removeModelFile(index)}
                                        style={removeButtonStyle}
                                        disabled={uploading}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Preview Images Upload */}
                    <h2 style={sectionTitleStyle}>Preview Images *</h2>
                    <div
                        style={previewDragActive ? fileUploadActiveStyle : fileUploadAreaStyle}
                        onDragEnter={(e) => !uploading && handleDrag(e, true, setPreviewDragActive)}
                        onDragLeave={(e) => !uploading && handleDrag(e, false, setPreviewDragActive)}
                        onDragOver={(e) => !uploading && handleDrag(e, true, setPreviewDragActive)}
                        onDrop={!uploading ? handlePreviewDrop : undefined}
                        onClick={() => !uploading && document.getElementById('previewImages').click()}
                    >
                        <div style={uploadIconStyle}>🖼️</div>
                        <div style={uploadTextStyle}>
                            {uploading ? 'Uploading...' : 'Drag & drop preview images here, or click to browse'}
                        </div>
                        <div style={uploadSubtextStyle}>
                            Upload images that showcase your model (JPG, PNG, WebP - max 10MB per image, max 10 images)
                        </div>
                    </div>

                    <input
                        id="previewImages"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => !uploading && handlePreviewFiles(Array.from(e.target.files))}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />

                    {previewUrls.length > 0 && (
                        <div>
                            <h4 style={{ marginTop: '20px' }}>Preview Images ({previewUrls.length}):</h4>
                            <div style={previewGridStyle}>
                                {previewUrls.map((url, index) => (
                                    <div key={index} style={previewItemStyle}>
                                        <img
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            style={previewImageStyle}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => !uploading && removePreviewImage(index)}
                                            style={removePreviewStyle}
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
                    <h2 style={sectionTitleStyle}>Privacy Settings</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="isPublic"
                            name="isPublic"
                            checked={formData.isPublic}
                            onChange={handleInputChange}
                            disabled={uploading}
                        />
                        <label htmlFor="isPublic" style={{ cursor: 'pointer' }}>
                            Make this model publicly visible in community
                        </label>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                        {formData.isPublic
                            ? 'Your model will be visible to all users and appear in the community feed.'
                            : 'Your model will be private and only you can see it.'}
                    </p>

                    {/* Submit Buttons */}
                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                        <button
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(170, 99, 6, 1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 145, 0, 1)'; }}
                            type="submit"
                            disabled={uploading}
                            style={uploading ? buttonDisabledStyle : buttonStyle}
                        >
                            {uploading ? 'Uploading Model...' : 'Upload Model'}
                        </button>

                        <button
                            type="button"
                            onClick={() => window.location.href = '/'}
                             onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2e3235ff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6c757d'; }}
                            
                            style={{
                                ...buttonStyle,
                                backgroundColor: '#6c757d'
                            }}
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Upload Progress Info */}
                    {uploading && (
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: '0', color: '#1976d2' }}>
                                📤 Uploading your model... This may take a few minutes depending on file size.
                            </p>
                            <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                                Please don't close this page until upload is complete.
                            </p>
                        </div>
                    )}
                </form>

                {/* Help Section */}
                <div style={formStyle}>
                    <h2 style={sectionTitleStyle}>📋 Upload Guidelines</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        <div>
                            <h4 style={{ color: '#ff7b00', marginBottom: '10px' }}>📁 Model Files</h4>
                            <ul style={{ color: '#666', lineHeight: '1.6' }}>
                                <li>Support for 15+ software formats</li>
                                <li>Maximum 100MB per file</li>
                                <li>Maximum 500MB total upload size</li>
                                <li>Multiple files allowed for packages</li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ color: '#ff7b00', marginBottom: '10px' }}>🖼️ Preview Images</h4>
                            <ul style={{ color: '#666', lineHeight: '1.6' }}>
                                <li>At least one image required</li>
                                <li>JPG, PNG, or WebP formats</li>
                                <li>Maximum 10MB per image</li>
                                <li>Maximum 10 images total</li>
                                <li>First image will be the main thumbnail</li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ color: '#ff7b00', marginBottom: '10px' }}>✅ Best Practices</h4>
                            <ul style={{ color: '#666', lineHeight: '1.6' }}>
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