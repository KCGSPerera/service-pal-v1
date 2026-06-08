'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Star, Calendar, Megaphone, Briefcase, Settings, MapPin, Clock, Link as LinkIcon, Bell, CreditCard, BarChart2 } from 'lucide-react';
import ProviderReviews from './ProviderReviews';

export default function ProviderDashboard({ showToast }) {
  const { token, user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Lists State
  const [bookings, setBookings] = useState([]);
  const [ads, setAds] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  // Subscription & Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mySubscription, setMySubscription] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [upgradeType, setUpgradeType] = useState('immediate');
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);

  // Loadings
  const [loading, setLoading] = useState(false);

  // Form toggles
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);

  // Ad Form State
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adCategoryId, setAdCategoryId] = useState('');
  const [adSubCategoryId, setAdSubCategoryId] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [adPricingType, setAdPricingType] = useState('hourly');
  const [adCity, setAdCity] = useState('');
  const [adHours, setAdHours] = useState('9:00 AM - 5:00 PM');
  const [adDays, setAdDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [adImages, setAdImages] = useState([]);
  const [adTags, setAdTags] = useState('');

  // Portfolio Form State
  const [pTitle, setPTitle] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pLink, setPLink] = useState('');
  const [pImages, setPImages] = useState([]);

  // Profile Form State
  const [bName, setBName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bCity, setBCity] = useState('');
  const [bHours, setBHours] = useState('');
  const [bDays, setBDays] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchAds();
    fetchPortfolio();
    fetchCategories();
    fetchNotifications();
    fetchSubscriptionPlans();
    fetchMySubscription();
  }, []);

  useEffect(() => {
    if (adCategoryId) {
      fetchSubcategories(adCategoryId);
    }
  }, [adCategoryId]);

  // Load profile values when user loads
  useEffect(() => {
    loadProviderProfile();
  }, [user]);

  const loadProviderProfile = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/providers/profile?providerId=${user._id}`);
      const data = await response.json();
      if (response.ok && data.businessInfo) {
        setBName(data.businessInfo.business_name || '');
        setBPhone(data.businessInfo.business_phone || '');
        setBDesc(data.businessInfo.description || '');
        setBCity(data.businessInfo.city || '');
        setBHours(data.businessInfo.working_hours || '9:00 AM - 5:00 PM');
        setBDays(data.businessInfo.working_days || []);
      }
    } catch (err) {
      console.error('Error loading provider profile details:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) setCategories(data.categories);
    } catch (err) { console.error(err); }
  };

  const fetchSubcategories = async (catId) => {
    try {
      const response = await fetch(`/api/subcategories?categoryId=${catId}`);
      const data = await response.json();
      if (response.ok) setSubcategories(data.subcategories);
    } catch (err) { console.error(err); }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings?as=provider', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setBookings(data.bookings);
    } catch (err) {
      showToast('Error loading bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      if (!user) return;
      const response = await fetch(`/api/service-ads?providerId=${user._id}`);
      const data = await response.json();
      if (response.ok) setAds(data.ads);
    } catch (err) { console.error(err); }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`/api/providers/portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setPortfolio(data.items);
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setNotifications(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchMySubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions?provider=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.data.length > 0) {
        setMySubscription(data.data[0]);
      }
    } catch (err) { console.error(err); }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans?status=Active');
      const data = await response.json();
      if (response.ok) setSubscriptionPlans(data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleBookingAction = async (bookingId, action, paymentStatus = null) => {
    try {
      const payload = {};
      if (action) payload.booking_status = action;
      if (paymentStatus) payload.payment_status = paymentStatus;

      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('Booking updated successfully!', 'success');
        fetchBookings();
      } else {
        const data = await response.json();
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  // Base64 helper
  const handleFileConvert = (e, setFiles) => {
    const files = Array.from(e.target.files);
    const promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
      });
    });

    Promise.all(promises).then((base64Strings) => {
      setFiles((prev) => [...prev, ...base64Strings]);
    });
  };

  // Service Ad Create/Edit submission
  const handleAdSubmit = async (e) => {
    e.preventDefault();
    if (!adTitle || !adDescription || !adCategoryId || !adSubCategoryId || !adPrice || !adCity) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const payload = {
        ad_title: adTitle,
        ad_description: adDescription,
        category_id: adCategoryId,
        sub_category_id: adSubCategoryId,
        price_rate: adPrice,
        pricing_type: adPricingType,
        images: adImages,
        location_city: adCity,
        availability_hours: adHours,
        availability_days: adDays,
        tags: adTags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      const url = editingAd ? `/api/service-ads/${editingAd._id}` : '/api/service-ads';
      const method = editingAd ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        showToast(editingAd ? 'Service ad updated!' : 'Service ad published!', 'success');
        setShowAdForm(false);
        setEditingAd(null);
        clearAdForm();
        fetchAds();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('Error submitting ad', 'error');
    }
  };

  const handleEditAdTrigger = (ad) => {
    setEditingAd(ad);
    setAdTitle(ad.ad_title);
    setAdDescription(ad.ad_description);
    setAdCategoryId(ad.category_id?._id || '');
    setAdSubCategoryId(ad.sub_category_id?._id || '');
    setAdPrice(ad.price_rate);
    setAdPricingType(ad.pricing_type);
    setAdCity(ad.location_city);
    setAdHours(ad.availability_hours);
    setAdDays(ad.availability_days || []);
    setAdImages(ad.images || []);
    setAdTags(ad.tags?.join(', ') || '');
    setShowAdForm(true);
  };

  const handleDeleteAd = async (adId) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      const response = await fetch(`/api/service-ads/${adId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Service ad deleted', 'success');
        fetchAds();
      } else {
        showToast('Failed to delete ad', 'error');
      }
    } catch (err) { showToast('Error deleting ad', 'error'); }
  };

  const clearAdForm = () => {
    setAdTitle('');
    setAdDescription('');
    setAdCategoryId('');
    setAdSubCategoryId('');
    setAdPrice('');
    setAdPricingType('hourly');
    setAdCity('');
    setAdImages([]);
    setAdTags('');
    setEditingAd(null);
  };

  // Portfolio Create/Edit submission
  const handlePortfolioSubmit = async (e) => {
    e.preventDefault();
    if (!pTitle || !pDescription) {
      showToast('Title and description are required', 'error');
      return;
    }

    try {
      const payload = {
        project_title: pTitle,
        project_description: pDescription,
        project_images: pImages,
        project_link: pLink,
      };

      const url = '/api/providers/portfolio';
      const method = editingPortfolio ? 'PUT' : 'POST';
      if (editingPortfolio) payload.id = editingPortfolio._id;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(editingPortfolio ? 'Portfolio item updated!' : 'Portfolio item added!', 'success');
        setShowPortfolioForm(false);
        setEditingPortfolio(null);
        clearPortfolioForm();
        fetchPortfolio();
      } else {
        const data = await response.json();
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) { showToast('Error saving portfolio item', 'error'); }
  };

  const handleEditPortfolioTrigger = (item) => {
    setEditingPortfolio(item);
    setPTitle(item.project_title);
    setPDescription(item.project_description);
    setPLink(item.project_link || '');
    setPImages(item.project_images || []);
    setShowPortfolioForm(true);
  };

  const handleDeletePortfolio = async (id) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    try {
      const response = await fetch(`/api/providers/portfolio?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Portfolio item deleted', 'success');
        fetchPortfolio();
      } else {
        showToast('Delete failed', 'error');
      }
    } catch (err) { showToast('Error deleting item', 'error'); }
  };

  const clearPortfolioForm = () => {
    setPTitle('');
    setPDescription('');
    setPLink('');
    setPImages([]);
    setEditingPortfolio(null);
  };

  // Profile Save
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/providers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          business_name: bName,
          business_phone: bPhone,
          description: bDesc,
          city: bCity,
          working_hours: bHours,
          working_days: bDays,
        })
      });

      if (response.ok) {
        showToast('Business profile updated successfully!', 'success');
        refreshUser();
      } else {
        const data = await response.json();
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (err) { showToast('Error updating profile', 'error'); }
  };

  const toggleAdDay = (day) => {
    if (adDays.includes(day)) {
      setAdDays(adDays.filter((d) => d !== day));
    } else {
      setAdDays([...adDays, day]);
    }
  };

  const toggleProfileDay = (day) => {
    if (bDays.includes(day)) {
      setBDays(bDays.filter((d) => d !== day));
    } else {
      setBDays([...bDays, day]);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const handleSubscribe = async (planId) => {
    if (mySubscription && mySubscription.subscription_status === 'Active') {
      setSelectedUpgradePlan(planId);
      setShowUpgradeModal(true);
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Subscription requested successfully', 'success');
        fetchMySubscription();
      } else {
        showToast(data.message || 'Subscription failed', 'error');
      }
    } catch (err) {
      showToast('Error requesting subscription', 'error');
    }
  };

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;
    
    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          plan_id: selectedUpgradePlan,
          upgrade_type: upgradeType
        })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Upgrade requested successfully', 'success');
        setShowUpgradeModal(false);
        fetchMySubscription();
      } else {
        showToast(data.message || 'Upgrade failed', 'error');
      }
    } catch (err) {
      showToast('Error requesting upgrade', 'error');
    }
  };

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <div className="glass-panel p-4" style={{ height: 'fit-content', padding: '1rem', position: 'relative' }}>
        
        {/* Notifications Icon */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', cursor: 'pointer' }} onClick={() => setShowNotifications(true)}>
          <div style={{ position: 'relative' }}>
            <Bell size={20} color="var(--accent-primary)" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '15px', height: '15px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1rem', textAlign: 'center' }}>
          <div className="provider-avatar" style={{ width: '64px', height: '64px', margin: '0 auto 0.5rem auto', fontSize: '1.5rem' }}>
            {user?.first_name[0]}{user?.last_name[0]}
          </div>
          <h3>{bName || `${user?.first_name} ${user?.last_name}`}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}><Star size={14} color="var(--accent-secondary)" /> Provider Dashboard</span>
        </div>
        <ul className="sidebar-menu">
          <li className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--accent-primary)" /> Client Bookings
          </li>
          <li className={`sidebar-item ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone size={16} color="var(--accent-primary)" /> My Service Ads
          </li>
          <li className={`sidebar-item ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={16} color="var(--accent-primary)" /> Portfolio Projects
          </li>
          <li className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={16} color="var(--accent-primary)" /> Business Profile
          </li>
          <li className={`sidebar-item ${activeTab === 'subscription' ? 'active' : ''}`} onClick={() => setActiveTab('subscription')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={16} color="var(--accent-primary)" /> My Subscription
          </li>
          <li className={`sidebar-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={16} color="var(--accent-primary)" /> Ratings &amp; Reviews
          </li>
        </ul>
      </div>

      {/* Main Panel Content */}
      <div className="glass-panel p-4" style={{ minHeight: '500px' }}>
        
        {/* TAB 1: CLIENT BOOKINGS */}
        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Active Service Bookings</h2>
            {loading ? (
              <p style={{ color: 'var(--accent-secondary)' }}>Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You do not have any service bookings requests yet.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Client</th>
                      <th>Service Details</th>
                      <th>Scheduled Date/Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{booking._id.substring(18)}</td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{booking.customer_id?.first_name} {booking.customer_id?.last_name}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{booking.customer_id?.phone}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{booking.service_ad_id?.ad_title || 'Service Ad'}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={12} color="var(--accent-primary)" /> {booking.booking_address}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div>{booking.booking_date}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <Clock size={12} color="var(--accent-primary)" /> {booking.booking_time}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700' }}>LKR {booking.total_amount}</div>
                          <span className={`badge ${booking.payment_status === 'paid' ? 'badge-approved' : 'badge-pending'}`} style={{ fontSize: '0.65rem', padding: '0 0.4rem' }}>
                            {booking.payment_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${booking.booking_status}`}>
                            {booking.booking_status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {booking.booking_status === 'pending' && (
                              <>
                                <button className="btn btn-success" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleBookingAction(booking._id, 'accepted')}>
                                  Accept
                                </button>
                                <button className="btn btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleBookingAction(booking._id, 'declined')}>
                                  Decline
                                </button>
                              </>
                            )}
                            {booking.booking_status === 'accepted' && (
                              <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleBookingAction(booking._id, 'completed')}>
                                Complete Job
                              </button>
                            )}
                            {booking.payment_status === 'pending' && booking.booking_status === 'completed' && (
                              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleBookingAction(booking._id, null, 'paid')}>
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY SERVICE ADS */}
        {activeTab === 'ads' && (
          <div>
            {!showAdForm ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>My Active Service Advertisements</h2>
                  <button className="btn btn-primary" onClick={() => { clearAdForm(); setShowAdForm(true); }}>
                    + Create Service Ad
                  </button>
                </div>
                {ads.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No service ads created yet. Create one to start offering your services!</p>
                ) : (
                  <div className="grid-cols-3">
                    {ads.map((ad) => (
                      <div key={ad._id} className="glass-panel ad-card">
                        <div 
                          className="ad-card-image" 
                          style={{ backgroundImage: ad.images && ad.images.length > 0 ? `url(${ad.images[0]})` : 'none' }}
                        >
                          <span className={`ad-card-badge badge-${ad.status}`}>{ad.status}</span>
                        </div>
                        <div className="ad-card-body">
                          <h3 className="ad-card-title">{ad.ad_title}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineClamp: '2', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {ad.ad_description}
                          </p>
                          <div className="ad-card-footer">
                            <div className="ad-price">LKR {ad.price_rate}<span>/{ad.pricing_type}</span></div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleEditAdTrigger(ad)}>
                                Edit
                              </button>
                              <button className="btn btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleDeleteAd(ad._id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Service Ad Builder Form
              <div>
                <h2 style={{ marginBottom: '1.5rem' }}>{editingAd ? 'Edit Service Ad' : 'Publish New Service Ad'}</h2>
                <form onSubmit={handleAdSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }} className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Ad Title *</label>
                      <input type="text" className="form-input" required value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="e.g. Master Pipe Repair Services" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pricing Type *</label>
                      <select className="form-input" value={adPricingType} onChange={(e) => setAdPricingType(e.target.value)}>
                        <option value="hourly">Hourly Rate</option>
                        <option value="fixed">Fixed Price</option>
                        <option value="negotiable">Negotiable</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }} className="grid-cols-3">
                    <div className="form-group">
                      <label className="form-label">Rate Price (LKR) *</label>
                      <input type="number" className="form-input" required value={adPrice} onChange={(e) => setAdPrice(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Operation City *</label>
                      <input type="text" className="form-input" required value={adCity} onChange={(e) => setAdCity(e.target.value)} placeholder="e.g. Colombo" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Working Hours *</label>
                      <input type="text" className="form-input" required value={adHours} onChange={(e) => setAdHours(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Main Service Category *</label>
                      <select className="form-input" required value={adCategoryId} onChange={(e) => setAdCategoryId(e.target.value)}>
                        <option value="">-- Select Category --</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Service Subcategory *</label>
                      <select className="form-input" required value={adSubCategoryId} onChange={(e) => setAdSubCategoryId(e.target.value)} disabled={!adCategoryId}>
                        <option value="">-- Select Subcategory --</option>
                        {subcategories.map((sub) => (
                          <option key={sub._id} value={sub._id}>{sub.sub_category_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ad Details Description *</label>
                    <textarea className="form-input" rows="4" required value={adDescription} onChange={(e) => setAdDescription(e.target.value)} placeholder="Explain in detail your services, packages, response speed, guarantees..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Operating Days *</label>
                    <div className="days-grid">
                      {allDays.map((day) => (
                        <div key={day} className="day-checkbox" onClick={() => toggleAdDay(day)} style={{ borderColor: adDays.includes(day) ? 'var(--accent-primary)' : 'var(--border-glass)' }}>
                          <input type="checkbox" checked={adDays.includes(day)} onChange={() => {}} />
                          <span>{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tags / Keywords (comma separated)</label>
                    <input type="text" className="form-input" value={adTags} onChange={(e) => setAdTags(e.target.value)} placeholder="plumbing, leak, sink, kitchen" />
                  </div>

                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Service Ad Images</label>
                    <input type="file" multiple accept="image/*" onChange={(e) => handleFileConvert(e, setAdImages)} />
                    <div className="file-preview">
                      {adImages.map((img, idx) => (
                        <div key={idx} className="preview-thumbnail" style={{ backgroundImage: `url(${img})` }}>
                          <span className="preview-remove" onClick={() => setAdImages(adImages.filter((_, i) => i !== idx))}>×</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowAdForm(false); setEditingAd(null); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingAd ? 'Save Changes' : 'Publish Ad'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PORTFOLIO SHOWCASE */}
        {activeTab === 'portfolio' && (
          <div>
            {!showPortfolioForm ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>My Work Portfolio Showcase</h2>
                  <button className="btn btn-primary" onClick={() => { clearPortfolioForm(); setShowPortfolioForm(true); }}>
                    + Add Portfolio Item
                  </button>
                </div>
                {portfolio.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No portfolio items uploaded yet. Highlight past projects to impress clients!</p>
                ) : (
                  <div className="grid-cols-2">
                    {portfolio.map((item) => (
                      <div key={item._id} className="glass-panel p-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {item.project_images && item.project_images.length > 0 && (
                          <div style={{ height: '180px', backgroundImage: `url(${item.project_images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--radius-sm)' }} />
                        )}
                        <div>
                          <h3 style={{ fontSize: '1.25rem' }}>{item.project_title}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{item.project_description}</p>
                          {item.project_link && (
                              <a href={item.project_link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <LinkIcon size={14} color="var(--accent-primary)" /> Project Link
                              </a>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', alignSelf: 'flex-end' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleEditPortfolioTrigger(item)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleDeletePortfolio(item._id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Portfolio Form
              <div>
                <h2>{editingPortfolio ? 'Edit Portfolio Item' : 'Add Past Project to Portfolio'}</h2>
                <form onSubmit={handlePortfolioSubmit} style={{ marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Project Title *</label>
                    <input type="text" className="form-input" required value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="e.g. Completed AC Installation at Prime Residency" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Description *</label>
                    <textarea className="form-input" rows="4" required value={pDescription} onChange={(e) => setPDescription(e.target.value)} placeholder="Explain the project scope, difficulties solved, and results achieved..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Link (Optional)</label>
                    <input type="text" className="form-input" value={pLink} onChange={(e) => setPLink(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Project Images</label>
                    <input type="file" multiple accept="image/*" onChange={(e) => handleFileConvert(e, setPImages)} />
                    <div className="file-preview">
                      {pImages.map((img, idx) => (
                        <div key={idx} className="preview-thumbnail" style={{ backgroundImage: `url(${img})` }}>
                          <span className="preview-remove" onClick={() => setPImages(pImages.filter((_, i) => i !== idx))}>×</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowPortfolioForm(false); setEditingPortfolio(null); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Project
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EDIT BUSINESS PROFILE */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Edit Business Profile Details</h2>
            <form onSubmit={handleProfileUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Business Display Name</label>
                  <input type="text" className="form-input" required value={bName} onChange={(e) => setBName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Phone Number</label>
                  <input type="text" className="form-input" required value={bPhone} onChange={(e) => setBPhone(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Operation City</label>
                  <input type="text" className="form-input" required value={bCity} onChange={(e) => setBCity(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Working Hours</label>
                  <input type="text" className="form-input" required value={bHours} onChange={(e) => setBHours(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Working Schedule Days</label>
                <div className="days-grid">
                  {allDays.map((day) => (
                    <div key={day} className="day-checkbox" onClick={() => toggleProfileDay(day)} style={{ borderColor: bDays.includes(day) ? 'var(--accent-primary)' : 'var(--border-glass)' }}>
                      <input type="checkbox" checked={bDays.includes(day)} onChange={() => {}} />
                      <span>{day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Business Description</label>
                <textarea className="form-input" rows="4" required value={bDesc} onChange={(e) => setBDesc(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <button type="submit" className="btn btn-primary">
                Save Business Profile
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: MY SUBSCRIPTION */}
        {activeTab === 'subscription' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>My Subscription</h2>
            
            <div className="glass-panel p-4" style={{ marginBottom: '2rem' }}>
              <h3>Current Subscription</h3>
              {mySubscription ? (
                <div style={{ marginTop: '1rem' }}>
                  <p><strong>Plan:</strong> {mySubscription.plan_name} ({mySubscription.plan_type})</p>
                  <p><strong>Status:</strong> <span className={`badge badge-${mySubscription.subscription_status.replace(' ', '-').toLowerCase()}`}>{mySubscription.subscription_status}</span></p>
                  <p><strong>Billing:</strong> {mySubscription.billing_cycle} at LKR {mySubscription.price}</p>
                  {mySubscription.subscription_status === 'Rejected' && (
                    <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}><strong>Rejection Reason:</strong> {mySubscription.rejection_reason}</p>
                  )}
                  {mySubscription.subscription_status === 'Active' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <p><strong>Start Date:</strong> {new Date(mySubscription.start_date).toLocaleDateString()}</p>
                      <p><strong>End Date:</strong> {new Date(mySubscription.end_date).toLocaleDateString()}</p>
                      <p><strong>Renewal Date:</strong> {new Date(mySubscription.end_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>You do not have any active subscriptions. Please select a plan below to gain access to premium features.</p>
              )}
            </div>

            <h3>Available Plans</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {subscriptionPlans.map(plan => (
                <div key={plan._id} className="glass-panel p-4" style={{ borderTop: `4px solid ${plan.plan_type === 'Premium' ? 'var(--accent-primary)' : 'var(--border-glass)'}` }}>
                  <h4>{plan.plan_name}</h4>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>LKR {plan.price} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ {plan.billing_cycle}</span></div>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    <li style={{ marginBottom: '0.5rem' }}>✓ {plan.ad_post_limit} Service Ads</li>
                    <li style={{ marginBottom: '0.5rem' }}>✓ {plan.featured_ads_limit} Featured Ads</li>
                    <li style={{ marginBottom: '0.5rem' }}>✓ {plan.description || 'Standard Support'}</li>
                  </ul>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%' }} 
                    onClick={() => handleSubscribe(plan._id)}
                  >
                    {mySubscription && mySubscription.subscription_status === 'Active' ? 'Upgrade Plan' : 'Subscribe Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: RATINGS & REVIEWS */}
        {activeTab === 'reviews' && user && (
          <ProviderReviews
            providerId={user._id}
            token={token}
            showToast={showToast}
          />
        )}

      </div>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h2>Notifications</h2>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleMarkAllRead}>Mark All Read</button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif._id} style={{ padding: '1rem', background: notif.is_read ? 'transparent' : 'rgba(var(--accent-primary-rgb), 0.1)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{notif.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{notif.message}</p>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowNotifications(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2>Upgrade Subscription</h2>
            <form onSubmit={handleUpgradeSubmit} style={{ marginTop: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                How would you like to upgrade your plan?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="upgrade_type" 
                    value="immediate" 
                    checked={upgradeType === 'immediate'}
                    onChange={(e) => setUpgradeType(e.target.value)}
                  />
                  <span>
                    <strong>Upgrade Immediately</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cancels current plan and starts new plan right now.</p>
                  </span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="upgrade_type" 
                    value="on_renewal" 
                    checked={upgradeType === 'on_renewal'}
                    onChange={(e) => setUpgradeType(e.target.value)}
                  />
                  <span>
                    <strong>Upgrade on Renewal</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>New plan will activate once your current plan expires.</p>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpgradeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Upgrade</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
