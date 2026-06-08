import React, { useState, useEffect } from 'react';
import { Heart, MapPin, MessageSquare, Briefcase, Star, Loader, Compass } from 'lucide-react';

export default function FavoriteProviders({ token, currentUser, showToast, onContactSeller, onBack }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFavorites(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load favorite providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (e, providerId) => {
    e.stopPropagation();
    
    // Add confirmation modal or do it directly
    const confirm = window.confirm('Are you sure you want to remove this provider from your favorites?');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/favorites/${providerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Removed from favorites', 'success');
        setFavorites(prev => prev.filter(f => f.provider_id._id !== providerId));
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error removing favorite provider', 'error');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const floorRating = Math.floor(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Star 
            size={14} 
            fill={i <= floorRating ? 'var(--accent-primary)' : 'none'} 
            color={i <= floorRating ? 'var(--accent-primary)' : '#4b5563'} 
          />
        </span>
      );
    }
    return <span style={{ display: 'flex', gap: '0.1rem' }}>{stars}</span>;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in' }}>
      
      {/* Header banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={28} fill="var(--error)" color="var(--error)" /> Saved Favorite Providers
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            A curated list of your favorite local trade and service experts.
          </p>
        </div>
        {onBack && (
          <button 
            onClick={onBack}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            Back to Services
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <Loader className="animate-spin" size={32} color="var(--accent-primary)" />
        </div>
      ) : favorites.length === 0 ? (
        /* Empty Favorites State */
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Compass size={64} style={{ opacity: 0.2, marginBottom: '1.25rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Favorite Providers Saved</h3>
          <p style={{ maxWidth: '420px', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 auto 1.5rem' }}>
            Explore local providers, view their services, and click the heart icon on their cards to save them here for quick access later!
          </p>
          {onBack && (
            <button onClick={onBack} className="btn btn-primary">
              Discover Local Experts
            </button>
          )}
        </div>
      ) : (
        /* Favorites Grid list */
        <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {favorites.map((fav) => {
            const provider = fav.provider_id;
            const business = fav.businessInfo;

            return (
              <div 
                key={fav._id} 
                className="glass-panel glass-panel-hover" 
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  padding: '1.25rem',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Heart Toggle Button */}
                <button
                  onClick={(e) => handleUnfavorite(e, provider._id)}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#ef4444'
                  }}
                  className="hover-bg-error"
                >
                  <Heart size={18} fill="#ef4444" />
                </button>

                {/* Profile Card Header Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <img
                    src={provider.profile_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`}
                    alt={`${provider.first_name} ${provider.last_name}`}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-glass)' }}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '0.975rem', color: 'var(--text-primary)' }}>
                      {provider.first_name} {provider.last_name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Briefcase size={12} /> {business?.category_name || 'Service Expert'}
                    </span>
                  </div>
                </div>

                {/* Ratings */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {renderStars(fav.averageRating)}
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)', marginLeft: '0.25rem' }}>
                    {fav.averageRating > 0 ? fav.averageRating : '0.0'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({fav.totalReviews})
                  </span>
                </div>

                {/* business info preview */}
                <div style={{ flex: 1 }}>
                  {business?.business_name && (
                    <h5 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {business.business_name}
                    </h5>
                  )}
                  <p style={{
                    fontSize: '0.825rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {business?.description || 'No business details provided. This provider offers bespoke high-quality trade and customer services.'}
                  </p>
                </div>

                {/* Location Pin */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.75rem', borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem' }}>
                  <MapPin size={12} color="var(--accent-primary)" />
                  <span>{provider.city || 'Colombo'}, {provider.district || 'Western'}</span>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onContactSeller(provider._id)}
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-glass)',
                    background: 'var(--bg-glass-input)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    fontSize: '0.825rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover-bg-glass"
                >
                  <MessageSquare size={14} /> Contact Seller
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
