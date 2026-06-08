import React, { useState, useEffect, useRef } from 'react';
import { Star, X, Image, Trash2, Loader } from 'lucide-react';

export default function ReviewModal({ isOpen, onClose, bookingId, reviewToEdit, token, showToast, onSubmitSuccess }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // If reviewToEdit is provided, pre-fill the form for editing!
  useEffect(() => {
    if (reviewToEdit) {
      setRating(reviewToEdit.rating_value || 5);
      setTitle(reviewToEdit.review_title || '');
      setDescription(reviewToEdit.review_description || '');
      setImages(reviewToEdit.review_images || []);
    } else {
      // Clear form
      setRating(5);
      setTitle('');
      setDescription('');
      setImages([]);
    }
  }, [reviewToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      showToast('You can upload a maximum of 5 images', 'error');
      return;
    }

    files.forEach((file) => {
      if (file.size > 3 * 1024 * 1024) {
        showToast(`Image ${file.name} is too large. Max size is 3MB.`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.onerror = () => {
        showToast('Failed to load image', 'error');
      };
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const url = reviewToEdit ? `/api/reviews/${reviewToEdit._id}` : '/api/reviews';
      const method = reviewToEdit ? 'PATCH' : 'POST';

      const payload = {
        rating_value: rating,
        review_title: title.trim(),
        review_description: description.trim(),
        review_images: images,
      };

      if (!reviewToEdit) {
        payload.booking_id = bookingId;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(
          reviewToEdit
            ? 'Review updated successfully!'
            : 'Review published successfully! It is now live.',
          'success'
        );
        onSubmitSuccess();
        onClose();
      } else {
        showToast(data.message || 'Failed to submit review', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error submitting review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '1.75rem',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'scaleUp 0.3s ease-out'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          {reviewToEdit ? 'Edit Your Review' : 'Write a Review for Provider'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Star Input */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>How would you rate this provider?</span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[1, 2, 3, 4, 5].map((val) => {
                const isLit = hoverRating ? val <= hoverRating : val <= rating;
                return (
                  <button
                    key={val}
                    type="button"
                    onMouseEnter={() => setHoverRating(val)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(val)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem' }}
                  >
                    <Star 
                      size={28} 
                      fill={isLit ? 'var(--accent-primary)' : 'none'} 
                      color={isLit ? 'var(--accent-primary)' : '#4b5563'} 
                    />
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', marginTop: '0.2rem' }}>
              {rating === 5 && 'Excellent - 5 Stars'}
              {rating === 4 && 'Very Good - 4 Stars'}
              {rating === 3 && 'Average - 3 Stars'}
              {rating === 2 && 'Poor - 2 Stars'}
              {rating === 1 && 'Terrible - 1 Star'}
            </span>
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: '500' }}>
              Review Title
            </label>
            <input 
              type="text" 
              placeholder="Summarize your experience (e.g. Excellent service!, Quick repair)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                background: 'var(--bg-glass-input)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: '500' }}>
              Detailed Description
            </label>
            <textarea
              placeholder="What went well? Were there any delays? Share the details of your booking..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                background: 'var(--bg-glass-input)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem',
                resize: 'none'
              }}
            />
          </div>

          {/* Image Uploader */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
              Add Photos (Max 5)
            </label>
            
            {/* Grid of uploaded images */}
            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                    <img src={img} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: 'var(--error)',
                        padding: '0.2rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Picker Button */}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'var(--bg-glass-input)',
                  border: '1px solid var(--border-glass)',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                className="hover-bg-glass"
              >
                <Image size={16} /> Upload Photos
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              onChange={handleImageUpload} 
              style={{ display: 'none' }}
              accept="image/*"
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              disabled={submitting}
            >
              {submitting ? <Loader className="animate-spin" size={16} /> : null}
              {reviewToEdit ? 'Save Changes' : 'Submit Review'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
