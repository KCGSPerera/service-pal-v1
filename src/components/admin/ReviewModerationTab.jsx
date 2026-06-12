import React, { useState, useEffect } from 'react';
import { Check, X, EyeOff, Star, Filter, Loader, Calendar, User, ShieldAlert } from 'lucide-react';

export default function ReviewModerationTab({ token, showToast }) {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState(''); // empty string means All
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/api/reviews?status=${statusFilter}` : '/api/reviews';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading reviews list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, actionType) => {
    try {
      setProcessingId(id);
      const res = await fetch(`/api/reviews/${id}/${actionType}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Review ${actionType}d successfully!`, 'success');
        // Refresh list
        fetchReviews();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(`Error processing review ${actionType}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const floorRating = Math.floor(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Star 
            size={12} 
            fill={i <= floorRating ? 'var(--accent-primary)' : 'none'} 
            color={i <= floorRating ? 'var(--accent-primary)' : '#4b5563'} 
          />
        </span>
      );
    }
    return <span style={{ display: 'flex', gap: '0.1rem' }}>{stars}</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>Pending</span>;
      case 'Approved':
        return <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>Approved</span>;
      case 'Rejected':
        return <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>Rejected</span>;
      case 'Hidden':
        return <span style={{ background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>Hidden</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
      
      {/* Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Customer Reviews Moderation</h3>
        
        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { value: '', label: 'All Reviews' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'Hidden', label: 'Hidden' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
                background: statusFilter === item.value ? 'var(--accent-primary)' : 'var(--bg-glass-input)',
                color: statusFilter === item.value ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader className="animate-spin" size={32} color="var(--accent-primary)" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShieldAlert size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          No reviews found matching the selected status.
        </div>
      ) : (
        /* Table Moderation list */
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '0.75rem' }}>Customer / Author</th>
                <th style={{ padding: '0.75rem' }}>Service Provider</th>
                <th style={{ padding: '0.75rem' }}>Rating / Job</th>
                <th style={{ padding: '0.75rem', width: '35%' }}>Review Content</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((rev) => {
                const customer = rev.user_id;
                const provider = rev.provider_id;
                if (!customer || !provider) return null;

                const isProcessing = processingId === rev._id;

                return (
                  <tr key={rev._id} style={{ borderBottom: '1px solid var(--border-glass-light)' }} className="hover-bg-glass-light">
                    {/* Customer */}
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img 
                          src={customer.profile_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`}
                          alt="Avatar"
                          style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600' }}>{customer.first_name} {customer.last_name}</span>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{customer.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Provider */}
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img 
                          src={provider.profile_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`}
                          alt="Avatar"
                          style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600' }}>{provider.first_name} {provider.last_name}</span>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{provider.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Rating / Ad */}
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {renderStars(rev.rating_value)}
                          <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{rev.rating_value}</span>
                        </div>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rev.booking_id?.service_ad_id?.ad_title || 'Service Booked'}
                        </span>
                      </div>
                    </td>

                    {/* Content text & images */}
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <h5 style={{ margin: '0 0 0.15rem', fontWeight: 'bold' }}>{rev.review_title}</h5>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                          {rev.review_description}
                        </p>
                        
                        {/* Images preview */}
                        {rev.review_images && rev.review_images.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                            {rev.review_images.map((img, idx) => (
                              <img 
                                key={idx} 
                                src={img} 
                                onClick={() => setActiveLightboxImg(img)}
                                alt="Attachment" 
                                style={{ width: '32px', height: '32px', borderRadius: '3px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-glass-light)' }} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.75rem' }}>
                      {getStatusBadge(rev.review_status)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        
                        {/* Approve */}
                        {rev.review_status !== 'Approved' && (
                          <button
                            onClick={() => handleAction(rev._id, 'approve')}
                            disabled={isProcessing}
                            style={{
                              background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: '#22c55e',
                              borderRadius: '4px',
                              padding: '0.3rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Approve Review"
                          >
                            <Check size={14} />
                          </button>
                        )}

                        {/* Reject */}
                        {rev.review_status !== 'Rejected' && (
                          <button
                            onClick={() => handleAction(rev._id, 'reject')}
                            disabled={isProcessing}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              borderRadius: '4px',
                              padding: '0.3rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Reject Review"
                          >
                            <X size={14} />
                          </button>
                        )}

                        {/* Hide */}
                        {rev.review_status !== 'Hidden' && (
                          <button
                            onClick={() => handleAction(rev._id, 'hide')}
                            disabled={isProcessing}
                            style={{
                              background: 'rgba(107, 114, 128, 0.1)',
                              border: '1px solid rgba(107, 114, 128, 0.3)',
                              color: '#9ca3af',
                              borderRadius: '4px',
                              padding: '0.3rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Hide Review"
                          >
                            <EyeOff size={14} />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox for Admin review images */}
      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '2rem',
            backdropFilter: 'blur(5px)'
          }}
        >
          <img 
            src={activeLightboxImg} 
            alt="Expanded Preview" 
            style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '4px' }} 
          />
        </div>
      )}

    </div>
  );
}
