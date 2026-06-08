'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Heart, Calendar, UserPlus, Briefcase, Shield, LogOut, Star, Handshake, Sun, Moon, Search, MapPin, AlertTriangle, Clock, ShieldCheck, Mail, Phone, Send, Bell } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';
import ServiceAdDetail from '@/components/ServiceAdDetail';
import BecomeSellerForm from '@/components/BecomeSellerForm';
import ProviderDashboard from '@/components/ProviderDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import ChatInbox from '@/components/ChatInbox';
import FavoriteProviders from '@/components/FavoriteProviders';
import ReviewModal from '@/components/ReviewModal';
import MyReviews from '@/components/MyReviews';

export default function Home() {
  const { user, token, logout, login, loginWithGoogle, register, completeProfile, updateUserProfile, verifyOtp, resendOtp, forgotPassword, resetPassword, refreshUser } = useAuth();
  
  // Navigation & View Routing State
  const [currentView, setCurrentView] = useState('home'); // home, login, register, otp, forgot-password, reset-password, become-seller, provider-dashboard, admin-dashboard, bookings, favorites
  const [selectedAdId, setSelectedAdId] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Notifications State
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search & Filter State
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [ads, setAds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [adsLoading, setAdsLoading] = useState(false);

  // Auth Forms State
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authNewPassword, setAuthNewPassword] = useState('');
  const [authRole, setAuthRole] = useState('customer');

  // Customer Bookings View State
  const [myBookings, setMyBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const [customerReviews, setCustomerReviews] = useState([]);

  // Chat and Unread Counter state
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [initChatWith, setInitChatWith] = useState(null);

  // Favorites List State
  const [favoritesList, setFavoritesList] = useState([]);

  // Profile Edit State
  const [profileData, setProfileData] = useState({
    profile_image: '', phone: '', gender: '', date_of_birth: '', 
    familiar_languages: [], preferred_language: '', address: '', city: '', district: ''
  });

  const SRI_LANKAN_DISTRICTS = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 
    'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 
    'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 
    'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
  ];

  useEffect(() => {
    fetchCategories();
    fetchServiceAds();
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme === 'light' ? 'light-theme' : '';
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.body.className = nextTheme === 'light' ? 'light-theme' : '';
    showToast(`Switched to ${nextTheme} theme!`, 'success');
  };

  useEffect(() => {
    fetchServiceAds();
  }, [selectedCat, selectedSub, sortBy]);

  useEffect(() => {
    if (selectedCat) {
      fetchSubcategories(selectedCat);
    } else {
      setSubcategories([]);
      setSelectedSub('');
    }
  }, [selectedCat]);

  useEffect(() => {
    if (currentView === 'bookings') {
      fetchCustomerBookings();
    } else if (currentView === 'favorites') {
      fetchFavorites();
    } else if (currentView === 'my-profile' && user) {
      setProfileData({
        profile_image: user.profile_image || '',
        phone: user.phone || '',
        gender: user.gender || '',
        date_of_birth: user.date_of_birth || '',
        familiar_languages: user.familiar_languages || [],
        preferred_language: user.preferred_language || '',
        address: user.address || '',
        city: user.city || '',
        district: user.district || ''
      });

      // Show completion reminder if required fields are missing
      const isComplete = user.phone && user.familiar_languages?.length > 0 && user.preferred_language && user.city && user.district;
      if (!isComplete) {
        showToast('Please complete your profile details.', 'error');
      }
    }

    if (user) {
      fetchNotifications();
      fetchUnreadChatCount();
    }
  }, [currentView, user]);

  const fetchUnreadChatCount = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/chats/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUnreadChatCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread chat count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        const response = await fetch(`/api/notifications/${notif._id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchNotifications();
          fetchUnreadChatCount();
        }
      }

      // Dynamic routing based on notification type
      if (notif.notification_type === 'CHAT_MESSAGE') {
        setCurrentView('inbox');
        setSelectedAdId(null);
      } else if (notif.notification_type === 'REVIEW_APPROVED' || notif.notification_type === 'REVIEW_REJECTED') {
        setCurrentView('my-reviews');
        setSelectedAdId(null);
      } else if (notif.notification_type === 'REVIEW_SUBMITTED') {
        if (user?.role === 'provider') {
          setCurrentView('provider-dashboard');
        } else if (user?.role === 'admin' || user?.role === 'super_admin') {
          setCurrentView('admin-dashboard');
        }
      } else if (notif.notification_type?.startsWith('SUBSCRIPTION')) {
        if (user?.role === 'provider') {
          setCurrentView('provider-dashboard');
        }
      } else if (notif.notification_type?.startsWith('UPGRADE')) {
        if (user?.role === 'admin' || user?.role === 'super_admin') {
          setCurrentView('admin-dashboard');
        } else {
          setCurrentView('become-seller');
        }
      }

      setShowNotifications(false);
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) setCategories(data.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSubcategories = async (catId) => {
    try {
      const response = await fetch(`/api/subcategories?categoryId=${catId}`);
      const data = await response.json();
      if (response.ok) setSubcategories(data.subcategories);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
    }
  };

  const fetchServiceAds = async () => {
    try {
      setAdsLoading(true);
      let url = `/api/service-ads?sortBy=${sortBy}`;
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
      if (selectedCat) url += `&category=${selectedCat}`;
      if (selectedSub) url += `&subcategory=${selectedSub}`;
      if (filterCity) url += `&city=${encodeURIComponent(filterCity)}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setAds(data.ads);
      }
    } catch (err) {
      showToast('Error loading service advertisements', 'error');
    } finally {
      setAdsLoading(false);
    }
  };

  const fetchCustomerBookings = async () => {
    try {
      setBookingLoading(true);
      const response = await fetch('/api/bookings?as=customer', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMyBookings(data.bookings);
      }

      // Fetch the customer's reviews to associate with bookings
      const reviewsResponse = await fetch('/api/reviews/my-reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reviewsData = await reviewsResponse.json();
      if (reviewsResponse.ok && reviewsData.success) {
        setCustomerReviews(reviewsData.data);
      }
    } catch (err) {
      showToast('Error loading bookings log', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/users/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFavoritesList(data.favorites);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavoriteToggle = async (e, providerId) => {
    e.stopPropagation(); // prevent card click details
    if (!token) {
      showToast('Please login to save favorite providers', 'error');
      return;
    }

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ providerId })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        refreshUser();
        // Update favorites view if active
        if (currentView === 'favorites') {
          fetchFavorites();
        } else {
          // Re-fetch ads to update favorites color icon
          fetchServiceAds();
        }
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(authUsername, authPassword);
      showToast('Logged in successfully!', 'success');
      if (data?.user?.role === 'admin' || data?.user?.role === 'super_admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('home');
      }
      clearAuthForms();
    } catch (err) {
      if (err.is_verified === false) {
        showToast('Account not verified. Please get a code to verify your email.', 'error');
        setAuthEmail(err.email);
        setCurrentView('otp');
      } else {
        showToast(err.message || 'Login failed', 'error');
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      showToast('Google authentication successful!', 'success');
      if (data.user.is_profile_completed === false) {
        setCurrentView('complete-profile');
      } else if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('home');
      }
      clearAuthForms();
    } catch (err) {
      showToast(err.message || 'Google Login failed', 'error');
    }
  };

  const handleGoogleError = () => {
    showToast('Google Login Failed', 'error');
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    try {
      await completeProfile(authUsername, authPhone);
      showToast('Profile completed successfully!', 'success');
      setCurrentView('home');
    } catch (err) {
      showToast(err.message || 'Profile completion failed', 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await register({
        username: authUsername,
        password: authPassword,
        first_name: authFirstName,
        last_name: authLastName,
        email: authEmail,
        phone: authPhone,
        role: authRole,
      });

      showToast(data.message || 'Verification code sent', 'success');
      setAuthEmail(data.email);
      // Pre-fill OTP for developer evaluation convenience
      if (data.otpCode) {
        setAuthOtp(data.otpCode);
        showToast(`Helper: Simulated OTP is ${data.otpCode}`, 'success');
      }
      setCurrentView('otp');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp(authEmail, authOtp);
      showToast('Account verified successfully! You can now login.', 'success');
      setCurrentView('login');
      setAuthOtp('');
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    }
  };

  const handleResendOtp = async () => {
    try {
      const data = await resendOtp(authEmail);
      showToast(data.message || 'OTP resent successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to resend OTP', 'error');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const data = await forgotPassword(authEmail);
      showToast(data.message || 'Password reset code sent', 'success');
      // Pre-fill OTP for developer evaluation convenience
      if (data.otpCode) {
        setAuthOtp(data.otpCode);
        showToast(`Helper: Simulated OTP is ${data.otpCode}`, 'success');
      }
      setCurrentView('reset-password');
    } catch (err) {
      showToast(err.message || 'Forgot password failed', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(authEmail, authOtp, authNewPassword);
      showToast('Password updated successfully. Login with your new password.', 'success');
      setCurrentView('login');
      clearAuthForms();
    } catch (err) {
      showToast(err.message || 'Reset failed', 'error');
    }
  };

  const handleBookingCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ booking_status: 'cancelled' })
      });

      if (response.ok) {
        showToast('Booking cancelled successfully', 'success');
        fetchCustomerBookings();
      } else {
        const data = await response.json();
        showToast(data.message || 'Cancel failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  const handleBookingPaymentSimulate = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: 'paid' })
      });

      if (response.ok) {
        showToast('Simulated payment processed successfully!', 'success');
        fetchCustomerBookings();
      } else {
        const data = await response.json();
        showToast(data.message || 'Payment failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Review deleted successfully!', 'success');
        fetchCustomerBookings();
      } else {
        showToast(data.message || 'Failed to delete review', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  const clearAuthForms = () => {
    setAuthEmail('');
    setAuthUsername('');
    setAuthPassword('');
    setAuthFirstName('');
    setAuthLastName('');
    setAuthPhone('');
    setAuthOtp('');
    setAuthNewPassword('');
    setAuthRole('customer');
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    setCurrentView('home');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(profileData);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Profile update failed', 'error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image must be less than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profile_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLanguageToggle = (lang) => {
    const current = profileData.familiar_languages;
    if (current.includes(lang)) {
      setProfileData({ ...profileData, familiar_languages: current.filter(l => l !== lang) });
    } else {
      setProfileData({ ...profileData, familiar_languages: [...current, lang] });
    }
  };

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
    <div className="app-container">
      {/* Dynamic Navigation Header */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => setCurrentView('home')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Handshake size={28} color="var(--accent-primary)" />
          Service<span>Pal</span>
        </div>
        <ul className="nav-links">
          {currentView !== 'provider-dashboard' && (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'super_admin')) && (
            <>
              <li className={`nav-link ${currentView === 'home' ? 'active' : ''}`} onClick={() => { setCurrentView('home'); setSelectedAdId(null); }}>
                Services
              </li>
              <li className={`nav-link ${currentView === 'about' ? 'active' : ''}`} onClick={() => { setCurrentView('about'); setSelectedAdId(null); }}>
                About
              </li>
              <li className={`nav-link ${currentView === 'contact' ? 'active' : ''}`} onClick={() => { setCurrentView('contact'); setSelectedAdId(null); }}>
                Contact Us
              </li>
            </>
          )}

          {user ? (
            <>
              {currentView !== 'provider-dashboard' && (
                <>
                  <li style={{ display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer', marginRight: '1.25rem' }} onClick={() => { setCurrentView('inbox'); setSelectedAdId(null); }} title="Inbox messages">
                    <Send size={20} color="var(--text-secondary)" style={{ transform: 'rotate(-25deg)' }} />
                    {unreadChatCount > 0 && (
                      <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: 'var(--accent-primary)', color: 'white', borderRadius: '50%', padding: '0.05rem 0.35rem', fontSize: '0.65rem', fontWeight: 'bold' }}>
                        {unreadChatCount}
                      </span>
                    )}
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer', marginRight: '1rem' }} onClick={() => setShowNotifications(true)} title="Notifications">
                    <Bell size={22} color="var(--text-secondary)" />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '0.05rem 0.35rem', fontSize: '0.65rem', fontWeight: 'bold' }}>
                        {notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </li>
                </>
              )}
              <li className="dropdown">
              <div className="profile-trigger">
                <img 
                  src={user.profile_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`} 
                  alt="Profile" 
                  className="profile-trigger-img" 
                />
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.first_name}</span>
              </div>
              <div className="dropdown-content">
                {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'super_admin') ? (
                  <>
                    <div className="dropdown-item" onClick={() => { setCurrentView('my-profile'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserIcon size={16} color="#6366f1" /> Admin Profile
                    </div>
                    <div className="dropdown-item" onClick={() => { setCurrentView('home'); setSelectedAdId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={16} color="#6366f1" /> Services
                    </div>
                  </>
                ) : (
                  currentView !== 'provider-dashboard' && (
                    <div className="dropdown-item" onClick={() => {
                      setCurrentView('my-profile');
                      if (!user.phone || !user.familiar_languages?.length || !user.preferred_language || !user.city || !user.district) {
                        showToast('Attention Needed: Please complete all required profile fields.', 'warning');
                      }
                    }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserIcon size={16} color="#6366f1" /> My Profile
                    </div>
                  )
                )}
                
                {(user.role === 'customer' || user.role === 'provider') && (
                  <>
                    {currentView !== 'provider-dashboard' && (
                      <>
                        <div className="dropdown-item" onClick={() => { setCurrentView('inbox'); setSelectedAdId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Send size={16} color="#6366f1" style={{ transform: 'rotate(-25deg)' }} /> Inbox
                        </div>
                        <div className="dropdown-item" onClick={() => { setCurrentView('favorites'); setSelectedAdId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Heart size={16} color="#6366f1" /> Favorites
                        </div>
                        <div className="dropdown-item" onClick={() => { setCurrentView('bookings'); setSelectedAdId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={16} color="#6366f1" /> My Bookings
                        </div>
                        <div className="dropdown-item" onClick={() => { setCurrentView('my-reviews'); setSelectedAdId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Star size={16} color="#6366f1" /> My Reviews
                        </div>
                      </>
                    )}
                    {user.role === 'customer' ? (
                      <div className="dropdown-item" onClick={() => setCurrentView('become-seller')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={16} color="#6366f1" /> Become a Seller
                      </div>
                    ) : currentView === 'provider-dashboard' ? (
                      <div className="dropdown-item" onClick={() => setCurrentView('home')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserIcon size={16} color="#6366f1" /> Switch to Customer
                      </div>
                    ) : (
                      <div className="dropdown-item" onClick={() => setCurrentView('provider-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Briefcase size={16} color="#6366f1" /> Switch to Seller
                      </div>
                    )}
                  </>
                )}

                {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'super_admin') && (
                  <div className="dropdown-item" onClick={() => setCurrentView('admin-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} color="#6366f1" /> Admin Panel
                  </div>
                )}
                
                <div style={{ borderTop: '1px solid var(--border-glass)', margin: '0.5rem 0' }}></div>
                <div className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogOut size={16} color="var(--error)" /> Logout
                </div>
              </div>
            </li>
            </>
          ) : (
            <>
              <li className={`nav-link ${currentView === 'login' ? 'active' : ''}`} onClick={() => setCurrentView('login')}>
                Login
              </li>
              <li className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setCurrentView('register')}>
                Register
              </li>
            </>
          )}
          <li className="nav-link" onClick={toggleTheme} style={{ fontSize: '1.2rem', userSelect: 'none', display: 'flex', alignItems: 'center' }} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} color="var(--accent-primary)" /> : <Moon size={20} color="var(--accent-primary)" />}
          </li>
        </ul>
      </nav>

      {/* Main Container */}
      <main className="main-content">
        
        {/* VIEW 1: HOME SEARCH LANDING PAGE */}
        {currentView === 'home' && !selectedAdId && (
          <div>
            <header className="hero">
              <h1>Find Trusted Local Service Experts</h1>
              <p>Hire skilled professionals for plumbing, electrical wiring, home deep cleaning, and appliance repair at direct rates.</p>
            </header>

            {/* Keyword Search Filters */}
            <div className="search-container" style={{ flexWrap: 'wrap' }}>
              <div className="search-input-wrapper">
                <span style={{ color: 'var(--accent-primary)', display: 'flex' }}><Search size={20} /></span>
                <input 
                  type="text" 
                  placeholder="What service do you need? (e.g. plumbing, AC repair)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchServiceAds()}
                />
              </div>
              <input 
                type="text" 
                className="search-select" 
                placeholder="City (e.g. Colombo)" 
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              />
              <input 
                type="number" 
                className="search-select" 
                style={{ width: '100px' }} 
                placeholder="Min $" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)} 
              />
              <input 
                type="number" 
                className="search-select" 
                style={{ width: '100px' }} 
                placeholder="Max $" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)} 
              />
              <select className="search-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="latest">Sort: Newest</option>
                <option value="rating_desc">Sort: Highest Rating</option>
                <option value="price_asc">Sort: Price Low-High</option>
                <option value="price_desc">Sort: Price High-Low</option>
              </select>
              <button className="btn btn-primary" onClick={fetchServiceAds}>Search</button>
            </div>

            {/* Category Pills list */}
            <div className="categories-list">
              <div 
                className={`category-pill ${selectedCat === '' ? 'active' : ''}`}
                onClick={() => { setSelectedCat(''); setSelectedSub(''); }}
              >
                All Categories
              </div>
              {categories.filter((c) => c.status === 'active').map((cat) => (
                <div 
                  key={cat._id} 
                  className={`category-pill ${selectedCat === cat._id ? 'active' : ''}`}
                  onClick={() => { setSelectedCat(cat._id); setSelectedSub(''); }}
                >
                  {cat.category_name}
                </div>
              ))}
            </div>

            {/* Subcategory Pills list */}
            {selectedCat && subcategories.length > 0 && (
              <div className="categories-list" style={{ marginTop: '-1.5rem', marginBottom: '2.5rem', opacity: 0.9 }}>
                <div 
                  className={`category-pill ${selectedSub === '' ? 'active' : ''}`}
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  onClick={() => setSelectedSub('')}
                >
                  All Subcategories
                </div>
                {subcategories.filter((s) => s.status === 'active').map((sub) => (
                  <div 
                    key={sub._id} 
                    className={`category-pill ${selectedSub === sub._id ? 'active' : ''}`}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    onClick={() => setSelectedSub(sub._id)}
                  >
                    {sub.sub_category_name}
                  </div>
                ))}
              </div>
            )}

            {/* Active Service Ads Grid */}
            {adsLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ color: 'var(--accent-secondary)' }}>Searching service providers...</div>
              </div>
            ) : ads.length === 0 ? (
              <div className="glass-panel p-4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                No active service advertisements found matching your query.
              </div>
            ) : (
              <div className="grid-cols-4">
                {ads.map((ad) => (
                  <div 
                    key={ad._id} 
                    className="glass-panel glass-panel-hover ad-card"
                    onClick={() => { setSelectedAdId(ad._id); }}
                  >
                    <div 
                      className="ad-card-image"
                      style={{ backgroundImage: ad.images && ad.images.length > 0 ? `url(${ad.images[0]})` : 'none' }}
                    >
                      <span className="ad-card-badge">{ad.category_id?.category_name}</span>
                      
                      {user && user.role === 'customer' && (
                        <button 
                          className={`ad-card-fav ${user.favorites?.includes(ad.provider_id?._id) ? 'active' : ''}`}
                          onClick={(e) => handleFavoriteToggle(e, ad.provider_id?._id)}
                        >
                          ♥
                        </button>
                      )}
                    </div>
                    
                    <div className="ad-card-body">
                      <h3 className="ad-card-title">{ad.ad_title}</h3>
                      
                      <div className="ad-card-provider">
                        <div className="provider-avatar">
                          {ad.provider_id?.first_name[0]}{ad.provider_id?.last_name[0]}
                        </div>
                        <div>
                          {ad.businessInfo?.business_name || `${ad.provider_id?.first_name} ${ad.provider_id?.last_name}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {renderStars(ad.averageRating)}
                        <span>({ad.totalReviews})</span>
                      </div>

                      <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} color="var(--accent-primary)" /> {ad.location_city}
                      </p>

                      <div className="ad-card-footer">
                        <div className="ad-price">LKR {ad.price_rate}<span>/{ad.pricing_type}</span></div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>Book Now →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: SERVICE AD DETAILS VIEW */}
        {selectedAdId && (
          <ServiceAdDetail 
            adId={selectedAdId} 
            onBack={() => setSelectedAdId(null)} 
            showToast={showToast}
          />
        )}

        {/* VIEW: ABOUT PAGE */}
        {currentView === 'about' && !selectedAdId && (
          <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease-in' }}>
            <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div 
                style={{ 
                  height: '350px', 
                  background: 'url(/about_hero.png)', 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center' 
                }} 
              />
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.75rem', marginBottom: '1rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>About Service-Pal</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
                  We are bridging the gap between skilled professionals and those who need them. Service-Pal is a modern platform built to empower service providers with a digital storefront while giving customers peace of mind with transparent pricing and trusted reviews.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
              <div className="glass-panel p-4" style={{ padding: '2rem', textAlign: 'center' }}>
                <ShieldCheck size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1rem auto' }} />
                <h3>Trusted Professionals</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Every provider undergoes thorough vetting to ensure your safety and satisfaction.</p>
              </div>
              <div className="glass-panel p-4" style={{ padding: '2rem', textAlign: 'center' }}>
                <Clock size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1rem auto' }} />
                <h3>Fast & Reliable</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Find experts instantly and book them according to your schedule effortlessly.</p>
              </div>
              <div className="glass-panel p-4" style={{ padding: '2rem', textAlign: 'center' }}>
                <Star size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1rem auto' }} />
                <h3>Quality Guaranteed</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Transparent ratings and reviews help you make the best choice every time.</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CONTACT US PAGE */}
        {currentView === 'contact' && !selectedAdId && (
          <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease-in' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Get in Touch</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginBottom: '4rem' }} className="grid-cols-2">
              <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div 
                  style={{ 
                    height: '250px', 
                    background: 'url(/contact_hero.png)', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                  }} 
                />
                <div style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>Contact Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
                        <Mail size={24} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>Email Us</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>support@service-pal.com</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
                        <Phone size={24} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>Call Us</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>+94 112 345 678</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
                        <MapPin size={24} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>Head Office</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>123 Tech Park, Colombo 03, Sri Lanka</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Send us a Message</h3>
                <form onSubmit={(e) => { e.preventDefault(); showToast('Message sent successfully! We will get back to you soon.', 'success'); e.target.reset(); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input type="text" className="form-input" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input type="text" className="form-input" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input type="text" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Message *</label>
                    <textarea className="form-input" rows="4" required style={{ resize: 'vertical' }}></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <Send size={18} /> Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: AUTH LOGIN PAGE */}
        {currentView === 'login' && (
          <div className="glass-panel p-4" style={{ maxWidth: '450px', margin: '4rem auto' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>Sign In to Service-Pal</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username or Email</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Password</label>
                  <span 
                    style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', cursor: 'pointer' }}
                    onClick={() => setCurrentView('forgot-password')}
                  >
                    Forgot Password?
                  </span>
                </div>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                Sign In
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                />
              </div>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Don&apos;t have an account?{' '}
              <span style={{ color: 'var(--accent-secondary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setCurrentView('register')}>
                Register
              </span>
            </p>
          </div>
        )}

        {/* VIEW 4: AUTH REGISTRATION PAGE */}
        {currentView === 'register' && (
          <div className="glass-panel p-4" style={{ maxWidth: '550px', margin: '3rem auto' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>Create Account</h2>
            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-input" required value={authFirstName} onChange={(e) => setAuthFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" className="form-input" required value={authLastName} onChange={(e) => setAuthLastName(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input type="text" className="form-input" required value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input type="text" className="form-input" required value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="e.g. 0771234567" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                Create Account
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                  text="signup_with"
                />
              </div>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <span style={{ color: 'var(--accent-secondary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setCurrentView('login')}>
                Sign In
              </span>
            </p>
          </div>
        )}

        {/* VIEW 5: OTP VERIFICATION PAGE */}
        {currentView === 'otp' && (
          <div className="glass-panel p-4" style={{ maxWidth: '450px', margin: '4rem auto' }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Verify Registration</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              A 6-digit OTP code is required for <strong style={{ color: 'var(--text-primary)' }}>{authEmail}</strong>. Enter it below to activate your account.
              <br />
              <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>If you don't have a code, click the Get / Resend button below.</span>
            </p>
            <form onSubmit={handleOtpVerify}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">OTP Verification Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem' }} 
                  maxLength="6"
                  value={authOtp}
                  onChange={(e) => setAuthOtp(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                Verify & Activate
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary w-full" 
                  style={{ padding: '0.75rem' }}
                  onClick={handleResendOtp}
                >
                  Get / Resend OTP Code
                </button>
              </div>
            </form>
          </div>
        )}
        {/* VIEW X: MY PROFILE */}
        {currentView === 'my-profile' && user && (
          <div className="glass-panel" style={{ maxWidth: '850px', margin: '5rem auto', padding: '3rem' }}>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center', fontSize: '2rem', color: 'var(--text-primary)' }}>My Profile</h2>
            
            <form onSubmit={handleProfileUpdate}>
              <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                
                {/* Left Column: Avatar */}
                <div style={{ flex: '1', minWidth: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: '180px', 
                      height: '180px', 
                      borderRadius: '50%', 
                      border: '4px solid var(--accent-primary)',
                      backgroundImage: profileData.profile_image ? `url(${profileData.profile_image})` : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23ccc\'%3E%3Cpath d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/%3E%3C/svg%3E")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: 'var(--glass-bg)',
                      marginBottom: '1.5rem',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}
                  ></div>
                  
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.5rem 1rem', width: '100%', textAlign: 'center' }}>
                    Upload Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleImageUpload}
                    />
                  </label>
                  {profileData.profile_image && (
                    <button 
                      type="button"
                      className="btn"
                      onClick={() => setProfileData({ ...profileData, profile_image: '' })}
                      style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', width: '100%', textAlign: 'center', color: '#ff4444', backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444' }}
                    >
                      Remove Photo
                    </button>
                  )}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>Max size 2MB</p>
                </div>

                {/* Right Column: Profile Details */}
                <div style={{ flex: '2', minWidth: '350px' }}>
                  
                  <h3 style={{ color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Account Details (Read Only)</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input type="text" className="form-input" disabled value={user.first_name || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-input" disabled value={user.last_name || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input type="text" className="form-input" disabled value={user.username || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-input" disabled value={user.email || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                  </div>

                  <h3 style={{ color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Personal Information</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Contact Number *</label>
                      <input type="tel" className="form-input" required value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} style={{ backgroundColor: 'var(--bg-color)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input type="date" className="form-input" value={profileData.date_of_birth} onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})} style={{ backgroundColor: 'var(--bg-color)' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Gender</label>
                    <select className="form-input" value={profileData.gender} onChange={(e) => setProfileData({...profileData, gender: e.target.value})} style={{ backgroundColor: 'var(--bg-color)' }}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <h3 style={{ color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Language & Location</h3>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Familiar Languages *</label>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
                      {['english', 'sinhala', 'tamil'].map(lang => (
                        <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--border-color)' }}>
                          <input 
                            type="checkbox" 
                            checked={profileData.familiar_languages.includes(lang)}
                            onChange={() => handleLanguageToggle(lang)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                          />
                          <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Most Preferred Language *</label>
                    <select className="form-input" required value={profileData.preferred_language} onChange={(e) => setProfileData({...profileData, preferred_language: e.target.value})} style={{ backgroundColor: 'var(--bg-color)' }}>
                      <option value="">Select Preferred Language</option>
                      <option value="english">English</option>
                      <option value="sinhala">Sinhala</option>
                      <option value="tamil">Tamil</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Address</label>
                    <textarea 
                      className="form-input" 
                      rows="2"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      style={{ backgroundColor: 'var(--bg-color)', resize: 'none' }}
                      placeholder="Street address or P.O. Box"
                    ></textarea>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input type="text" className="form-input" required value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})} style={{ backgroundColor: 'var(--bg-color)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">District *</label>
                      <select className="form-input" required value={profileData.district} onChange={(e) => setProfileData({...profileData, district: e.target.value})} style={{ backgroundColor: 'var(--bg-color)' }}>
                        <option value="">Select District</option>
                        {SRI_LANKAN_DISTRICTS.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem', marginTop: '1rem', fontSize: '1rem', float: 'right' }}>
                    Save Profile Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}


        {/* VIEW 6: COMPLETE PROFILE (FOR GOOGLE USERS) */}
        {currentView === 'complete-profile' && (
          <div className="glass-panel p-4" style={{ maxWidth: '450px', margin: '4rem auto' }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Complete Your Profile</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Welcome! Please choose a username and enter your phone number to finish setting up your account.
            </p>
            <form onSubmit={handleCompleteProfile}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  required 
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem' }}>
                Complete Setup
              </button>
            </form>
          </div>
        )}

        {/* VIEW 7: FORGOT PASSWORD REQUEST PAGE */}
        {currentView === 'forgot-password' && (
          <div className="glass-panel p-4" style={{ maxWidth: '450px', margin: '4rem auto' }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Forgot Password</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Enter your email address and we will generate a password-reset OTP code for you.
            </p>
            <form onSubmit={handleForgotPassword}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem' }}>
                Send Reset Code
              </button>
            </form>
            <button className="btn btn-secondary w-full" style={{ marginTop: '0.5rem', padding: '0.75rem' }} onClick={() => setCurrentView('login')}>
              ← Back to Login
            </button>
          </div>
        )}

        {/* VIEW 7: RESET PASSWORD UPDATE PAGE */}
        {currentView === 'reset-password' && (
          <div className="glass-panel p-4" style={{ maxWidth: '450px', margin: '4rem auto' }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">OTP Verification Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  style={{ textAlign: 'center', letterSpacing: '0.3em' }} 
                  maxLength="6"
                  value={authOtp}
                  onChange={(e) => setAuthOtp(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={authNewPassword}
                  onChange={(e) => setAuthNewPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem' }}>
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* VIEW 8: BECOME SELLER FORM (UPGRADE REQUEST) */}
        {currentView === 'become-seller' && (
          <BecomeSellerForm onBack={() => setCurrentView('home')} showToast={showToast} />
        )}

        {/* VIEW 9: PROVIDER DASHBOARD */}
        {currentView === 'provider-dashboard' && (
          <ProviderDashboard showToast={showToast} />
        )}

        {/* VIEW 10: ADMIN PANEL DASHBOARD */}
        {currentView === 'admin-dashboard' && (
          <AdminDashboard showToast={showToast} />
        )}

        {/* VIEW 11: BUYER (CUSTOMER) BOOKINGS LOG */}
        {currentView === 'bookings' && (
          <div className="glass-panel p-4">
            <h2 style={{ marginBottom: '1.5rem' }}>My Service Bookings Log</h2>
            {bookingLoading ? (
              <p style={{ color: 'var(--accent-secondary)' }}>Loading bookings...</p>
            ) : myBookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You have not made any service bookings requests yet.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Service Provider</th>
                      <th>Service Details</th>
                      <th>Scheduled Date/Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBookings.map((b) => (
                      <tr key={b._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{b._id.substring(18)}</td>
                        <td>
                          <div style={{ fontWeight: '600' }}>
                            {b.provider_id?.first_name} {b.provider_id?.last_name}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.provider_id?.phone}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{b.service_ad_id?.ad_title || 'Service Session'}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={12} color="var(--accent-primary)" /> {b.booking_address}
                            </span>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} color="var(--accent-primary)" /> {b.booking_time}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{b.booking_date}</div>
                        </td>
                        <td style={{ fontWeight: '700' }}>${b.total_amount}</td>
                        <td>
                          <span className={`badge badge-${b.booking_status}`}>{b.booking_status}</span>
                        </td>
                        <td>
                          <span className={`badge ${b.payment_status === 'paid' ? 'badge-approved' : 'badge-pending'}`}>
                            {b.payment_status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {/* Cancel Booking if pending */}
                            {(b.booking_status === 'pending' || b.booking_status === 'accepted') && (
                              <button className="btn btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleBookingCancel(b._id)}>
                                Cancel
                              </button>
                            )}

                            {/* Pay Sim */}
                            {b.payment_status === 'pending' && b.booking_status === 'completed' && (
                              <button className="btn btn-success" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleBookingPaymentSimulate(b._id)}>
                                Pay Now
                              </button>
                            )}

                            {/* Review Action */}
                            {b.booking_status === 'completed' && (() => {
                              const existingReview = customerReviews.find(
                                (r) => (r.booking_id?._id || r.booking_id) === b._id
                              );
                              if (existingReview) {
                                return (
                                  <>
                                    <button 
                                      className="btn" 
                                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#d97706', color: '#fff' }}
                                      onClick={() => {
                                        setReviewBookingId(b._id);
                                        setReviewToEdit(existingReview);
                                        setShowReviewModal(true);
                                      }}
                                    >
                                      Update Review
                                    </button>
                                    <button 
                                      className="btn btn-danger" 
                                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                      onClick={() => handleReviewDelete(existingReview._id)}
                                    >
                                      Delete Review
                                    </button>
                                  </>
                                );
                              }
                              return (
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                  onClick={() => {
                                    setReviewBookingId(b._id);
                                    setReviewToEdit(null);
                                    setShowReviewModal(true);
                                  }}
                                >
                                  Leave Review
                                </button>
                              );
                            })()}
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

        {/* VIEW 12: BUYER (CUSTOMER) FAVORITES LIST */}
        {currentView === 'favorites' && (
          <FavoriteProviders 
            token={token} 
            currentUser={user} 
            showToast={showToast} 
            onBack={() => setCurrentView('home')} 
            onContactSeller={(providerId) => {
              setCurrentView('inbox');
              setInitChatWith({ providerId });
            }}
          />
        )}

        {/* VIEW: INBOX */}
        {currentView === 'inbox' && (
          <ChatInbox 
            token={token} 
            currentUser={user} 
            initChatWith={initChatWith} 
            showToast={showToast} 
            onBack={() => setCurrentView('home')}
            onChatInitiated={() => setInitChatWith(null)}
          />
        )}

        {/* VIEW: MY REVIEWS */}
        {currentView === 'my-reviews' && (
          <MyReviews 
            token={token} 
            showToast={showToast}
            userId={user?._id}
          />
        )}

      </main>

      {/* Footer */}
      <footer style={{ background: '#040508', borderTop: '1px solid var(--border-glass)', padding: '2rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p>© 2026 Service-Pal Marketplace (Release 1). All rights reserved.</p>
        <p style={{ marginTop: '0.5rem' }}>Developed for pairing verification - MONGODB ATLAS CONNECTED</p>
      </footer>

      {/* Toast Alert pop-up */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Booking Review Modal */}
      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => { setShowReviewModal(false); setReviewBookingId(''); setReviewToEdit(null); }}
        bookingId={reviewBookingId}
        reviewToEdit={reviewToEdit}
        token={token}
        showToast={showToast}
        onSubmitSuccess={() => {
          fetchCustomerBookings();
        }}
      />
      {/* Notifications Modal */}
      {showNotifications && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h2>Notifications</h2>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleMarkAllRead}>Mark All Read</button>
            </div>
            
             <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No notifications yet</p>
              ) : (
                notifications.map(notif => {
                  const isChat = notif.notification_type === 'CHAT_MESSAGE';
                  return (
                    <div 
                      key={notif._id} 
                      onClick={() => handleNotificationClick(notif)}
                      className="glass-panel glass-panel-hover p-3" 
                      style={{ 
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        borderLeft: notif.is_read ? '4px solid transparent' : '4px solid var(--accent-primary)', 
                        opacity: notif.is_read ? 0.65 : 1,
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Glowing unread red/green status dot */}
                          {!notif.is_read && (
                            <span 
                              style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: isChat ? '#22c55e' : '#ef4444',
                                boxShadow: isChat ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
                                display: 'inline-block' 
                              }} 
                              title="Unread"
                            />
                          )}
                          {notif.title}
                        </h4>
                        {isChat && (
                          <span style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                            Chat
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{notif.message}</p>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>{new Date(notif.createdAt).toLocaleString()}</small>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowNotifications(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
