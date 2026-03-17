import React, { useState } from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import api from '../../utils/api';
import './ImageUpload.css';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  defaultImage?: string;
  label?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onUploadSuccess, 
  defaultImage, 
  label,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultImage || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPreview(data.url);
      onUploadSuccess(data.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Upload failed. Check your Cloudinary config.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onUploadSuccess('');
    setError(null);
  };

  return (
    <div className="image-upload-container">
      {label && <label className="upload-label">{label}</label>}
      <div className={`upload-area ${preview ? 'has-preview' : ''} ${loading ? 'loading' : ''} ${disabled ? 'disabled' : ''}`}>
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="image-preview" />
            {!disabled && (
              <button type="button" className="remove-image-btn" onClick={removeImage}>
                <X size={16} />
              </button>
            )}
            <div className="upload-success-badge">
              <Check size={12} /> {disabled ? 'Service Image' : 'Uploaded'}
            </div>
          </div>
        ) : (
          <label className={`upload-placeholder ${disabled ? 'disabled' : ''}`}>
            {!disabled && <input type="file" onChange={handleFileChange} accept="image/*" />}
            {loading ? (
              <div className="upload-spinner"></div>
            ) : (
              <>
                <div className="placeholder-icon">
                  <ImageIcon size={24} />
                </div>
                <div className="placeholder-text">
                  <span>{disabled ? 'No image available' : 'Click to upload image'}</span>
                  {!disabled && <small>JPG, PNG or WebP (Max. 5MB)</small>}
                </div>
              </>
            )}
          </label>
        )}
      </div>
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
};

export default ImageUpload;
