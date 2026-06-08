'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Star, MapPin, Phone } from 'lucide-react';
import ProviderReviews from './ProviderReviews';

export default function ServiceAdDetail({ adId, onBack, showToast, onContactSeller }) {
  const { token, user } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingAddress, setBookingAddress] = useState(user?.address || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchAdDetails();
  }, [adId]);

  const fetchAdDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/service-ads/${adId}`);
      const data = await response.json();
      if (response.ok) {
        setAd(data.ad);
      } else {
        showToast(data.message || 'Error fetching details', 'error');
        onBack();
      }
    } catch (error) {
      showToast('Connection error', 'error');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Please login to book a service', 'error');
      return;
    }

    if (!bookingDate || !bookingTime || !bookingAddress) {
      showToast('Please fill out all booking fields', 'error');
      return;
    }

    try {
      setBookingLoading(true);
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          service_ad_id: adId,
          booking_date: bookingDate,
          booking_time: bookingTime,
          booking_address: bookingAddress,
          special_instructions: specialInstructions,
          payment_method: paymentMethod,
          total_amount: ad.price_rate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Booking requested successfully!', 'success');
        setShowBookingModal(false);
        // Clear form
        setBookingDate('');
        setBookingTime('');
        setSpecialInstructions('');
      } else {
        showToast(data.message || 'Booking failed', 'error');
      }
    } catch (error) {
      showToast('Error sending booking request', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ color: 'var(--accent-secondary)' }}>Loading service details...</div>
      </div>
    );
  }

  if (!ad) return null;

  // Star renderer helper
  const renderStars = (rating) => {
    const stars = [];
    const floorRating = Math.floor(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Star size={14} fill={i <= floorRating ? 'var(--accent-primary)' : 'none'} color={i <= floorRating ? 'var(--accent-primary)' : '#4b5563'} />
        </span>
      );
    }
    return <span className="rating-stars" style={{ display: 'flex', gap: '0.1rem' }}>{stars}</span>;
  };

  return (
    <div className="glass-panel p-4" style={{ position: 'relative' }}>
      <button className="btn btn-secondary mb-2" onClick={onBack}>
        ← Back to search
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }} className="grid-cols-2">
        {/* Images view */}
        <div>
          <div 
            style={{ 
              height: '350px', 
              background: ad.images && ad.images.length > 0 ? `url(${ad.images[0]})` : 'var(--bg-tertiary)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)'
            }}
          />
          {ad.images && ad.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto' }}>
              {ad.images.map((img, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: `url(${img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-active mb-1">{ad.category_id?.category_name}</span>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{ad.ad_title}</h1>
              </div>
              <div className="ad-price text-right">
                LKR {ad.price_rate}
                <span>/{ad.pricing_type}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={14} color="var(--accent-primary)" /> {ad.location_city}
              </span>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {renderStars(ad.averageRating)}
                <span>({ad.totalReviews} reviews)</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{ad.ad_description}</p>
          </div>

          {/* Availability details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass-panel p-4" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Working Days</span>
              <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{ad.availability_days?.join(', ')}</div>
            </div>
            <div className="glass-panel p-4" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Working Hours</span>
              <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{ad.availability_hours}</div>
            </div>
          </div>

          {/* Provider Card */}
          <div className="glass-panel p-4" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
            <div className="provider-avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
              {ad.provider_id?.first_name[0]}{ad.provider_id?.last_name[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SERVICE PROVIDER</div>
              <h4 style={{ fontSize: '1.05rem' }}>{ad.businessInfo?.business_name || `${ad.provider_id?.first_name} ${ad.provider_id?.last_name}`}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Phone size={14} color="var(--accent-primary)" /> {ad.businessInfo?.business_phone || ad.provider_id?.phone}
              </p>
            </div>
            {/* Booking Trigger Button */}
            {user?._id === ad.provider_id?._id ? (
              <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} disabled>
                Your Own Ad
              </button>
            ) : (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (!token) showToast('Please login to send messages', 'error');
                    else if (onContactSeller) onContactSeller(ad.provider_id?._id, ad._id);
                  }}
                >
                  Contact Seller
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    if (!token) showToast('Please login to book a service', 'error');
                    else setShowBookingModal(true);
                  }}
                >
                  Book Service
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '3rem', paddingTop: '2rem' }}>
        <ProviderReviews 
          providerId={ad.provider_id?._id}
          showToast={showToast}
        />
      </div>

      {/* Booking Modal Dialog */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Book Service Session</h2>
            <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-secondary)' }}>{ad.ad_title}</h4>
              <div style={{ fontWeight: '700', fontSize: '1.2rem', marginTop: '0.25rem' }}>
                Rate: LKR {ad.price_rate} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({ad.pricing_type})</span>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    required 
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Street Address, City" 
                  required
                  value={bookingAddress}
                  onChange={(e) => setBookingAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Special Instructions (Optional)</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  placeholder="Detail any specifics, gate access codes, etc."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-input" 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Pay with Cash on Completion</option>
                  <option value="card">Simulate Credit/Debit Card</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={bookingLoading}>
                  {bookingLoading ? 'Requesting...' : 'Request Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
