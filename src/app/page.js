'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Heart, Calendar, UserPlus, Briefcase, Shield, LogOut, Star, Handshake, Sun, Moon, Search, MapPin, AlertTriangle, Clock, ShieldCheck, Mail, Phone, Send, Bell, Menu, X } from 'lucide-react';
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
import ComplaintsSection from '@/components/ComplaintsSection';

export default function Home() {
  const { user, token, logout, login, loginWithGoogle, register, completeProfile, updateUserProfile, verifyOtp, resendOtp, forgotPassword, resetPassword, refreshUser } = useAuth();
  
  // Navigation & View Routing State
  const [currentView, setCurrentView] = useState('home'); // home, login, register, otp, forgot-password, reset-password, become-seller, provider-dashboard, admin-dashboard, bookings, favorites
  const [selectedAdId, setSelectedAdId] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [mainMenuOpen, setMainMenuOpen] = useState(false);

  // About Page States
  const [aboutActiveStep, setAboutActiveStep] = useState(0);
  const [estCategory, setEstCategory] = useState('');
  const [estDistrict, setEstDistrict] = useState('Colombo');
  const [simulatedMatchIndex, setSimulatedMatchIndex] = useState(0);

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

  useEffect(() => {
    if (currentView !== 'about') return;
    const interval = setInterval(() => {
      setSimulatedMatchIndex((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentView]);

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

  const getEstimatedRate = (catName, district) => {
    let baseMin = 1500;
    let baseMax = 3000;
    let suffix = 'hour';

    const name = (catName || '').toLowerCase();
    if (name.includes('plumb')) {
      baseMin = 1500; baseMax = 2500; suffix = 'hour';
    } else if (name.includes('ac') || name.includes('condition') || name.includes('cooling')) {
      baseMin = 2000; baseMax = 4500; suffix = 'job';
    } else if (name.includes('clean') || name.includes('house') || name.includes('deep')) {
      baseMin = 3000; baseMax = 6000; suffix = 'visit';
    } else if (name.includes('elect') || name.includes('wire')) {
      baseMin = 1800; baseMax = 3000; suffix = 'hour';
    } else if (name.includes('appliance') || name.includes('repair') || name.includes('tv')) {
      baseMin = 1500; baseMax = 4000; suffix = 'job';
    } else if (name.includes('salon') || name.includes('beauty') || name.includes('hair')) {
      baseMin = 2000; baseMax = 5000; suffix = 'session';
    }

    let multiplier = 1.0;
    if (district === 'Colombo') multiplier = 1.25;
    else if (district === 'Gampaha' || district === 'Kandy') multiplier = 1.12;
    else if (district === 'Galle' || district === 'Kurunegala') multiplier = 1.05;

    const finalMin = Math.round((baseMin * multiplier) / 100) * 100;
    const finalMax = Math.round((baseMax * multiplier) / 100) * 100;

    return `LKR ${finalMin.toLocaleString()} - LKR ${finalMax.toLocaleString()} per ${suffix}`;
  };

  return (
    <div className="app-container">
      {/* Dynamic Navigation Header */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => { setCurrentView('home'); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Handshake size={28} color="var(--accent-primary)" />
          Service<span>Pal</span>
        </div>
        <button className="navbar-toggle" onClick={() => setMainMenuOpen(true)}>
          <Menu size={24} />
        </button>
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
                        <div className="dropdown-item" onClick={() => { setCurrentView('complaints'); setSelectedAdId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertTriangle size={16} color="#6366f1" /> Complaints
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

      {/* Mobile Main Menu Drawer Overlay */}
      {mainMenuOpen && (
        <div className="main-nav-overlay" onClick={() => setMainMenuOpen(false)} />
      )}

      {/* Mobile Main Menu Drawer */}
      <div className={`main-nav-drawer ${mainMenuOpen ? 'open' : ''}`}>
        <div className="drawer-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="nav-brand" onClick={() => { setCurrentView('home'); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Handshake size={24} color="var(--accent-primary)" />
            Service<span>Pal</span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMainMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentView !== 'provider-dashboard' && (!user || (user.role !== 'admin' && user.role !== 'super_admin')) && (
              <>
                <li className={`nav-link ${currentView === 'home' ? 'active' : ''}`} onClick={() => { setCurrentView('home'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ padding: '0.5rem 0' }}>
                  Services
                </li>
                <li className={`nav-link ${currentView === 'about' ? 'active' : ''}`} onClick={() => { setCurrentView('about'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ padding: '0.5rem 0' }}>
                  About
                </li>
                <li className={`nav-link ${currentView === 'contact' ? 'active' : ''}`} onClick={() => { setCurrentView('contact'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ padding: '0.5rem 0' }}>
                  Contact Us
                </li>
              </>
            )}

            {user ? (
              <>
                {currentView !== 'provider-dashboard' && (
                  <>
                    <li className="nav-link" onClick={() => { setCurrentView('inbox'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <Send size={18} /> Inbox ({unreadChatCount})
                    </li>
                    <li className="nav-link" onClick={() => { setShowNotifications(true); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <Bell size={18} /> Notifications ({notifications.filter(n => !n.is_read).length})
                    </li>
                  </>
                )}

                <div style={{ borderTop: '1px solid var(--border-glass)', margin: '0.5rem 0' }} />

                {(user.role === 'admin' || user.role === 'super_admin') ? (
                  <>
                    <li className="nav-link" onClick={() => { setCurrentView('my-profile'); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <UserIcon size={18} /> Admin Profile
                    </li>
                    <li className="nav-link" onClick={() => { setCurrentView('home'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <Briefcase size={18} /> Services
                    </li>
                    <li className="nav-link" onClick={() => { setCurrentView('admin-dashboard'); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: 'var(--accent-secondary)' }}>
                      <Shield size={18} /> Admin Panel
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-link" onClick={() => { setCurrentView('my-profile'); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <UserIcon size={18} /> My Profile
                    </li>
                    <li className="nav-link" onClick={() => { setCurrentView('favorites'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <Heart size={18} /> Favorites
                    </li>
                    <li className="nav-link" onClick={() => { setCurrentView('bookings'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <Calendar size={18} /> My Bookings
                    </li>
                    <li className="nav-link" onClick={() => { setCurrentView('my-reviews'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <Star size={18} /> My Reviews
                    </li>
                    <li className="nav-link" onClick={() => { setCurrentView('complaints'); setSelectedAdId(null); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <AlertTriangle size={18} /> Complaints
                    </li>
                    
                    {user.role === 'customer' ? (
                      <li className="nav-link" onClick={() => { setCurrentView('become-seller'); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: 'var(--accent-primary)' }}>
                        <UserPlus size={18} /> Become a Seller
                      </li>
                    ) : currentView === 'provider-dashboard' ? (
                      <li className="nav-link" onClick={() => { setCurrentView('home'); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: 'var(--accent-primary)' }}>
                        <UserIcon size={18} /> Switch to Customer
                      </li>
                    ) : (
                      <li className="nav-link" onClick={() => { setCurrentView('provider-dashboard'); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: 'var(--accent-primary)' }}>
                        <Briefcase size={18} /> Switch to Seller
                      </li>
                    )}
                  </>
                )}

                <div style={{ borderTop: '1px solid var(--border-glass)', margin: '0.5rem 0' }} />
                <li className="nav-link" onClick={() => { handleLogout(); setMainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: 'var(--error)' }}>
                  <LogOut size={18} /> Logout
                </li>
              </>
            ) : (
              <>
                <li className={`nav-link ${currentView === 'login' ? 'active' : ''}`} onClick={() => { setCurrentView('login'); setMainMenuOpen(false); }} style={{ padding: '0.5rem 0' }}>
                  Login
                </li>
                <li className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', marginTop: '0.5rem' }} onClick={() => { setCurrentView('register'); setMainMenuOpen(false); }}>
                  Register
                </li>
              </>
            )}
          </ul>
          
          <button className="btn btn-secondary" onClick={() => { toggleTheme(); setMainMenuOpen(false); }} style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} Change Theme
          </button>
        </div>
      </div>

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
          <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', marginTop: '-2rem', padding: 0, animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)', overflowX: 'hidden' }}>
            <style>{`
              @keyframes pulseGlow {
                0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.15; }
                50% { transform: scale(1.15) translate(40px, -30px); opacity: 0.25; }
              }
              @keyframes pulseGlow2 {
                0%, 100% { transform: scale(1.1) translate(0px, 0px); opacity: 0.2; }
                50% { transform: scale(0.9) translate(-30px, 20px); opacity: 0.1; }
              }
              @keyframes floatAnimation {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
              }
              @keyframes pulseMatch {
                0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.15); }
                50% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.4); }
              }
              @keyframes gridScroll {
                0% { background-position: 0 0; }
                100% { background-position: 40px 40px; }
              }
              
              .about-grid-bg {
                position: absolute;
                inset: 0;
                background-size: 40px 40px;
                background-image: 
                  linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
                mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
                -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
                z-index: 1;
                pointer-events: none;
                animation: gridScroll 24s linear infinite;
              }
              body.light-theme .about-grid-bg {
                background-image: 
                  linear-gradient(to right, rgba(0, 0, 0, 0.012) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 0, 0, 0.012) 1px, transparent 1px);
              }

              .glow-blob-1 {
                position: absolute;
                width: 500px;
                height: 500px;
                border-radius: 50%;
                filter: blur(120px);
                background: radial-gradient(circle, var(--accent-primary) 0%, rgba(99, 102, 241, 0) 70%);
                z-index: 0;
                top: -150px;
                left: -100px;
                animation: pulseGlow 18s infinite alternate ease-in-out;
                pointer-events: none;
              }
              .glow-blob-2 {
                position: absolute;
                width: 550px;
                height: 550px;
                border-radius: 50%;
                filter: blur(140px);
                background: radial-gradient(circle, var(--accent-secondary) 0%, rgba(6, 182, 212, 0) 70%);
                z-index: 0;
                bottom: -150px;
                right: -100px;
                animation: pulseGlow2 15s infinite alternate ease-in-out;
                pointer-events: none;
              }

              .about-row {
                width: 100%;
                position: relative;
                overflow: hidden;
              }
              
              .about-content-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 6rem 2.5rem;
                position: relative;
                z-index: 2;
              }
              @media (max-width: 768px) {
                .about-content-container {
                  padding: 4.5rem 1.25rem;
                }
              }

              .about-hero-grid {
                display: grid;
                grid-template-columns: 1.15fr 0.85fr;
                gap: 5rem;
                align-items: center;
              }
              @media (max-width: 968px) {
                .about-hero-grid {
                  grid-template-columns: 1fr;
                  gap: 3.5rem;
                  text-align: center;
                }
              }

              .simulator-container {
                position: relative;
                z-index: 1;
                padding: 2rem;
                border-radius: 20px;
                border: 1px solid var(--border-glass-hover);
                background: rgba(13, 16, 31, 0.4);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.35);
                animation: floatAnimation 6s ease-in-out infinite;
                width: 100%;
                max-width: 440px;
                margin: 0 auto;
              }
              body.light-theme .simulator-container {
                background: rgba(255, 255, 255, 0.75);
                box-shadow: 0 25px 50px rgba(148, 163, 184, 0.12);
              }

              .sim-card {
                padding: 1rem;
                border-radius: 12px;
                border: 1px solid var(--border-glass);
                background: rgba(255, 255, 255, 0.01);
                transition: all 0.3s ease;
              }
              .sim-card-active {
                border-color: var(--accent-primary);
                background: rgba(99, 102, 241, 0.04);
                animation: pulseMatch 3.5s infinite ease-in-out;
              }
              body.light-theme .sim-card-active {
                background: rgba(79, 70, 229, 0.03);
              }

              .about-stat-row {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1.75rem;
                margin-top: 1.5rem;
              }
              @media (max-width: 768px) {
                .about-stat-row {
                  grid-template-columns: repeat(2, 1fr);
                  gap: 1.25rem;
                }
              }
              .about-stat-card {
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                border: 1px solid var(--border-glass);
                background: rgba(255, 255, 255, 0.015);
                border-radius: var(--radius-md);
                padding: 2rem 1.25rem;
                text-align: center;
                backdrop-filter: blur(8px);
              }
              .about-stat-card:hover {
                transform: translateY(-5px);
                border-color: var(--accent-primary);
                box-shadow: 0 15px 30px rgba(99, 102, 241, 0.12);
                background: rgba(255, 255, 255, 0.035);
              }
              body.light-theme .about-stat-card {
                background: rgba(255, 255, 255, 0.4);
              }
              body.light-theme .about-stat-card:hover {
                background: rgba(255, 255, 255, 0.85);
                box-shadow: 0 15px 30px rgba(79, 70, 229, 0.08);
              }

              .estimator-card {
                background: var(--bg-glass);
                border: 1px solid var(--border-glass);
                border-radius: 20px;
                padding: 3rem;
                box-shadow: var(--glass-shadow);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                transition: all 0.3s ease;
                display: grid;
                grid-template-columns: 1.1fr 0.9fr;
                gap: 3.5rem;
                align-items: center;
              }
              @media (max-width: 968px) {
                .estimator-card {
                  grid-template-columns: 1fr;
                  gap: 2.5rem;
                  padding: 2rem 1.5rem;
                }
              }

              .estimator-input-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
              }
              .estimator-label {
                font-size: 0.825rem;
                font-weight: 700;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .estimator-select, .estimator-input {
                width: 100%;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid var(--border-glass-hover);
                border-radius: var(--radius-sm);
                padding: 0.9rem 1.2rem;
                color: var(--text-primary);
                outline: none;
                font-size: 0.95rem;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                font-family: inherit;
              }
              body.light-theme .estimator-select, body.light-theme .estimator-input {
                background: rgba(0, 0, 0, 0.02);
              }
              .estimator-select:focus, .estimator-input:focus {
                border-color: var(--accent-primary);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
              }
              
              .estimator-result {
                background: rgba(99, 102, 241, 0.02);
                border: 1px solid rgba(99, 102, 241, 0.12);
                border-radius: var(--radius-md);
                padding: 2.5rem 2rem;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              body.light-theme .estimator-result {
                background: rgba(79, 70, 229, 0.02);
              }
              .estimator-result-glow {
                font-size: 1.95rem;
                font-weight: 800;
                color: var(--accent-secondary);
                margin: 0.75rem 0;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -0.5px;
              }

              .about-pillar-card {
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                border: 1px solid var(--border-glass) !important;
                background: var(--bg-glass) !important;
                backdrop-filter: blur(8px);
              }
              .about-pillar-card:hover {
                transform: translateY(-8px);
                border-color: var(--accent-primary) !important;
                box-shadow: 0 20px 40px rgba(99, 102, 241, 0.12) !important;
                background: rgba(255, 255, 255, 0.035) !important;
              }
              body.light-theme .about-pillar-card:hover {
                background: #ffffff !important;
                box-shadow: 0 20px 40px rgba(79, 70, 229, 0.06) !important;
              }

              .roadmap-interactive-grid {
                display: grid;
                grid-template-columns: 1fr 1.5fr;
                gap: 4rem;
                margin-top: 3rem;
                align-items: center;
              }
              @media (max-width: 968px) {
                .roadmap-interactive-grid {
                  grid-template-columns: 1fr;
                  gap: 2.5rem;
                }
              }
              .roadmap-nav {
                display: flex;
                flex-direction: column;
                gap: 1.25rem;
              }
              @media (max-width: 968px) {
                .roadmap-nav {
                  flex-direction: row;
                  overflow-x: auto;
                  padding-bottom: 0.75rem;
                }
              }
              .roadmap-btn {
                display: flex;
                align-items: center;
                gap: 1.25rem;
                padding: 1.5rem 1.75rem;
                border: 1px solid var(--border-glass);
                background: rgba(255, 255, 255, 0.015);
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: left;
                width: 100%;
              }
              @media (max-width: 968px) {
                .roadmap-btn {
                  flex-shrink: 0;
                  padding: 1rem 1.25rem;
                  width: auto;
                }
              }
              .roadmap-btn:hover {
                background: rgba(255, 255, 255, 0.035);
                border-color: var(--border-glass-hover);
              }
              .roadmap-btn.active {
                background: rgba(99, 102, 241, 0.05);
                border-color: var(--accent-primary);
                box-shadow: 0 8px 25px rgba(99, 102, 241, 0.1);
              }
              body.light-theme .roadmap-btn.active {
                background: rgba(79, 70, 229, 0.04);
              }
              .roadmap-num {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: rgba(255,255,255,0.05);
                border: 2px solid var(--text-muted);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                transition: all 0.3s ease;
                color: var(--text-secondary);
                flex-shrink: 0;
              }
              .roadmap-btn.active .roadmap-num {
                background: var(--accent-primary);
                border-color: var(--accent-primary);
                color: white;
                box-shadow: 0 0 12px var(--accent-primary);
              }
              .roadmap-detail-card {
                padding: 3rem;
                min-height: 280px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                animation: fadeIn 0.4s ease;
              }
              @media (max-width: 768px) {
                .roadmap-detail-card {
                  padding: 1.75rem;
                }
              }
            `}</style>

            {/* ROW 1: HERO SECTION */}
            <div className="about-row" style={{ background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.04) 0%, rgba(10, 11, 23, 0) 100%)', borderBottom: '1px solid var(--border-glass-light)' }}>
              <div className="glow-blob-1"></div>
              <div className="about-content-container">
                <div className="about-hero-grid">
                  
                  {/* Left Column Text & Action */}
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ 
                      fontSize: '0.825rem', 
                      fontWeight: '700', 
                      color: 'var(--accent-primary)', 
                      textTransform: 'uppercase', 
                      letterSpacing: '2px', 
                      display: 'inline-block', 
                      marginBottom: '1rem',
                      background: 'rgba(99, 102, 241, 0.08)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '30px',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      Quality Vetted • Transparency Assured
                    </span>
                    
                    <h1 style={{ 
                      fontSize: '3.6rem', 
                      fontWeight: '800', 
                      lineHeight: '1.15', 
                      marginBottom: '1.5rem', 
                      letterSpacing: '-1.5px',
                      background: 'linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%)', 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent' 
                    }}>
                      Empowering Local Talents, Bridging Communities
                    </h1>
                    
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '650px' }}>
                      Service-Pal is a modern service marketplace designed to give independent providers a robust digital storefront while offering customers transparent pricing, booking scheduling, and genuine reviews.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {user ? (
                        user.role === 'provider' ? (
                          <button className="btn btn-primary" onClick={() => setCurrentView('provider-dashboard')} style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>Go to Provider Dashboard</button>
                        ) : (
                          <button className="btn btn-primary" onClick={() => setCurrentView('home')} style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>Explore Services</button>
                        )
                      ) : (
                        <>
                          <button className="btn btn-primary" onClick={() => setCurrentView('register')} style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>Join the Marketplace</button>
                          <button className="btn btn-secondary" onClick={() => setCurrentView('login')} style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>Sign In</button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Platform Live Status Simulator */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="simulator-container">
                      <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ position: 'relative', display: 'flex', height: '8px', width: '8px' }}>
                            <span style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: 'var(--success)', opacity: 0.75 }}></span>
                            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '8px', width: '8px', backgroundColor: 'var(--success)' }}></span>
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                            Platform Activity Feed
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '20px', color: 'var(--accent-primary)', fontWeight: '700' }}>
                          Sri Lanka Wide
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                          { category: 'Plumbing Services', district: 'Colombo 03', provider: 'Saman K.', time: '12s', rating: '4.9', icon: '🔧', badge: 'Active Request' },
                          { category: 'AC Repair Expert', district: 'Gampaha', provider: 'Nalin P.', time: '8s', rating: '4.8', icon: '❄️', badge: 'Matched Pros' },
                          { category: 'Home Deep Cleaning', district: 'Kandy', provider: 'Asha S.', time: '15s', rating: '5.0', icon: '✨', badge: 'Booking Scheduled' },
                          { category: 'Electrical Wiring', district: 'Galle', provider: 'Ruwan D.', time: '10s', rating: '4.7', icon: '⚡', badge: 'Vetted Match' },
                        ].map((match, idx) => {
                          const isActive = idx === simulatedMatchIndex;
                          return (
                            <div 
                              key={idx}
                              className={`sim-card ${isActive ? 'sim-card-active' : ''}`}
                              style={{ 
                                opacity: isActive ? 1 : 0.45,
                                transform: isActive ? 'scale(1.02)' : 'scale(0.98)',
                                transition: 'all 0.4s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                              }}
                            >
                              <div style={{ 
                                width: '42px', 
                                height: '42px', 
                                borderRadius: '10px', 
                                background: isActive ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'rgba(255,255,255,0.03)',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                boxShadow: isActive ? '0 0 10px rgba(99,102,241,0.2)' : 'none',
                                flexShrink: 0
                              }}>
                                {match.icon}
                              </div>
                              <div style={{ flexGrow: 1, textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{match.category}</span>
                                  <span style={{ fontSize: '0.7rem', color: isActive ? 'var(--success)' : 'var(--text-muted)', fontWeight: '700' }}>{match.badge}</span>
                                </div>
                                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  <span>Pro: {match.provider} ({match.rating}⭐) • {match.district}</span>
                                  <span style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>in {match.time}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ROW 2: CORE METRICS STATS */}
            <div className="about-row" style={{ borderBottom: '1px solid var(--border-glass-light)' }}>
              <div className="about-content-container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                  Our Platform Achievements
                </h3>
                <div className="about-stat-row">
                  <div className="about-stat-card">
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>500+</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Verified Experts</div>
                  </div>
                  <div className="about-stat-card">
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>15,000+</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Successful Bookings</div>
                  </div>
                  <div className="about-stat-card">
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>4.9/5</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Rating</div>
                  </div>
                  <div className="about-stat-card">
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #f472b6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>24 Hours</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Average Verification</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2.5: DIRECT RATE COST ESTIMATOR */}
            <div className="about-row" style={{ background: 'rgba(255, 255, 255, 0.004)', borderBottom: '1px solid var(--border-glass)' }}>
              <div className="about-grid-bg"></div>
              <div className="about-content-container" style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem auto' }}>
                  <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Direct Rate Estimator</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.75rem', lineHeight: '1.6' }}>
                    Calculate average pricing for services across different districts in Sri Lanka. Service-Pal encourages direct client-to-provider agreements with zero hidden platform markups.
                  </p>
                </div>

                <div className="estimator-card">
                  {/* Left Side: Selectors */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', textAlign: 'left' }}>
                    <div className="estimator-input-group">
                      <label className="estimator-label">Select Service Area</label>
                      <select 
                        className="estimator-select" 
                        value={estCategory} 
                        onChange={(e) => setEstCategory(e.target.value)}
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.length > 0 ? (
                          categories.filter(c => c.status === 'active').map((cat) => (
                            <option key={cat._id} value={cat.category_name}>{cat.category_name}</option>
                          ))
                        ) : (
                          <>
                            <option value="Plumbing Services">Plumbing Services</option>
                            <option value="AC Repair & Service">AC Repair & Service</option>
                            <option value="Deep House Cleaning">Deep House Cleaning</option>
                            <option value="Electrical Wiring & Repairs">Electrical Wiring & Repairs</option>
                            <option value="Appliance Repair">Appliance Repair</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="estimator-input-group">
                      <label className="estimator-label">Select District</label>
                      <select 
                        className="estimator-select" 
                        value={estDistrict} 
                        onChange={(e) => setEstDistrict(e.target.value)}
                      >
                        {SRI_LANKAN_DISTRICTS.map((dist) => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Side: Estimated output */}
                  <div className="estimator-result">
                    <div className="glow-blob-1" style={{ width: '120px', height: '120px', filter: 'blur(40px)', top: '-20px', left: '-20px', opacity: 0.1 }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-primary)' }}>
                      Estimated Direct Rates
                    </span>
                    <div className="estimator-result-glow">
                      {estCategory ? getEstimatedRate(estCategory, estDistrict) : 'Select a Category'}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0.5rem 0 1.5rem 0' }}>
                      Rates are direct estimations based on provider standard entries in {estDistrict}. Final prices are set directly between you and the expert.
                    </p>
                    {estCategory && (
                      <button 
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem', borderRadius: '8px' }}
                        onClick={() => {
                          const categoryObj = categories.find(c => c.category_name === estCategory);
                          if (categoryObj) {
                            setSelectedCat(categoryObj._id);
                          } else {
                            setSearchQuery(estCategory);
                          }
                          setFilterCity(estDistrict);
                          setCurrentView('home');
                          fetchServiceAds();
                          showToast(`Search filters applied for ${estCategory} in ${estDistrict}!`, 'success');
                        }}
                      >
                        Find {estCategory} Pros in {estDistrict} ➔
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ROW 3: INTERACTIVE ROADMAP TIMELINE */}
            <div className="about-row" style={{ background: 'rgba(255, 255, 255, 0.008)', borderBottom: '1px solid var(--border-glass)' }}>
              <div className="about-grid-bg"></div>
              <div className="about-content-container" style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-primary)', display: 'inline-block', marginBottom: '0.75rem' }}>
                    Evolutionary Milestones
                  </span>
                  <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Our Vision &amp; Evolution</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.75rem', lineHeight: '1.6' }}>
                    Click through the milestones below to discover how Service-Pal developed from a concept into a secure, vetted, and transparent community marketplace.
                  </p>
                </div>

                <div className="roadmap-interactive-grid">
                  {/* Left Side: Buttons */}
                  <div className="roadmap-nav">
                    {[
                      { step: 1, title: 'The Spark', subtitle: 'Conceptual inception' },
                      { step: 2, title: 'Vetting & Safety', subtitle: 'Verifying identity & skills' },
                      { step: 3, title: 'Co-Close Standard', subtitle: 'Guaranteeing resolution' }
                    ].map((item, idx) => {
                      const isActive = aboutActiveStep === idx;
                      return (
                        <button 
                          key={idx}
                          className={`roadmap-btn ${isActive ? 'active' : ''}`}
                          onClick={() => setAboutActiveStep(idx)}
                          style={{ border: '1px solid var(--border-glass)' }}
                        >
                          <div className="roadmap-num">{item.step}</div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {item.title}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.subtitle}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Side: Active details card */}
                  <div className="glass-panel roadmap-detail-card" style={{ border: '1px solid var(--border-glass-hover)', background: 'var(--bg-glass)' }}>
                    <div className="glow-blob-2" style={{ width: '150px', height: '150px', filter: 'blur(50px)', opacity: 0.1, bottom: '10px', right: '10px' }}></div>
                    {aboutActiveStep === 0 && (
                      <div style={{ textAlign: 'left', animation: 'fadeIn 0.4s ease' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.12)', padding: '0.3rem 0.65rem', borderRadius: '20px', color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Phase 1: Inception
                        </span>
                        <h3 style={{ fontSize: '1.75rem', margin: '1rem 0 0.75rem 0', fontWeight: '800', color: 'var(--text-primary)' }}>The Spark & Platform Rules</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                          Service-Pal was born out of frustration with expensive middlemen agency commissions. Our concept was simple: create an open space where genuine reviews and transparent direct pricing dictate provider rankings. Clients text experts directly, coordinate schedules, and build long-term relationships without hidden transaction cutbacks.
                        </p>
                        <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>KEY FOCUS</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>Direct Communication</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>BENEFIT</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>0% Broker Commission</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {aboutActiveStep === 1 && (
                      <div style={{ textAlign: 'left', animation: 'fadeIn 0.4s ease' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.12)', padding: '0.3rem 0.65rem', borderRadius: '20px', color: 'var(--accent-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Phase 2: Trust System
                        </span>
                        <h3 style={{ fontSize: '1.75rem', margin: '1rem 0 0.75rem 0', fontWeight: '800', color: 'var(--text-primary)' }}>Rigorous Manual Vetting</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                          To keep communities safe, we introduced manual vetting on all provider applications. Service providers submit official identification cards, professional licenses, and certifications. Our administrator team reviews each document, blocking fraudulent profiles, so customers schedule bookings with peace of mind.
                        </p>
                        <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>SECURITY LEVEL</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--success)', marginTop: '0.2rem' }}>100% Vetted Identity</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>AUDIT TIME</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>24h Turnaround</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {aboutActiveStep === 2 && (
                      <div style={{ textAlign: 'left', animation: 'fadeIn 0.4s ease' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', padding: '0.3rem 0.65rem', borderRadius: '20px', color: 'var(--success)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Phase 3: Guarantee
                        </span>
                        <h3 style={{ fontSize: '1.75rem', margin: '1rem 0 0.75rem 0', fontWeight: '800', color: 'var(--text-primary)' }}>Cooperative Resolution</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                          We launched the Co-Close support standard. If a dispute or platform issue arises, clients and providers can open secure, base64-attachment support tickets directly within their dashboards. Administrators mediate disputes fairly, ensuring ticket resolution and maintaining overall platform health and rating integrity.
                        </p>
                        <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>DISPUTE RATE</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--success)', marginTop: '0.2rem' }}>&lt; 0.5% Average</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>MEDIATION</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>Admin Mediated</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: CORE PILLARS CARD GRID */}
            <div className="about-row" style={{ borderBottom: '1px solid var(--border-glass)' }}>
              <div className="about-content-container">
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem auto' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-primary)', display: 'inline-block', marginBottom: '0.75rem' }}>
                    Uncompromising Standards
                  </span>
                  <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Our Core Pillars</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.75rem', lineHeight: '1.6' }}>
                    The baseline principles of manual verification, scheduling speed, and support desks that guide our marketplace operations.
                  </p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                  <div className="glass-panel about-pillar-card" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
                      <ShieldCheck size={36} />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Trusted Verification</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                      Every professional undergoes manual review of government identification and skill certificates. No unverified profiles are active on our search results.
                    </p>
                  </div>
                  
                  <div className="glass-panel about-pillar-card" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>
                      <Clock size={36} />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Instant Schedules</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                      Filter by district or city, review expert catalogs and reviews, and dispatch booking schedules instantly to match your availability.
                    </p>
                  </div>
                  
                  <div className="glass-panel about-pillar-card" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--warning)' }}>
                      <Star size={36} />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Verified Reviews</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                      Only clients with confirmed platform transaction receipts can leave feedback. This ensures review authenticity and prevents ranking fraud.
                    </p>
                  </div>
                  
                  <div className="glass-panel about-pillar-card" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--success)' }}>
                      <Handshake size={36} />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Cooperative Closing</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                      Secure communication tunnels with superadmins to raise feature tickets, upload base64 screenshot references, and resolve complaints collaboratively.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 5: CALL TO ACTION */}
            <div className="about-row" style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
              borderTop: '1px solid var(--border-glass)'
            }}>
              <div className="about-grid-bg" style={{ opacity: 0.5 }}></div>
              <div className="about-content-container" style={{ textAlign: 'center', padding: '6.5rem 2rem', position: 'relative', zIndex: 2 }}>
                <div className="glow-blob-1" style={{ width: '300px', height: '300px', filter: 'blur(100px)', opacity: 0.15, top: '20px', left: '50%', transform: 'translateX(-50%)' }}></div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
                  Ready to Experience Service-Pal?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto 2.75rem auto', lineHeight: '1.7' }}>
                  Join thousands of local users and skilled professionals today. Sign up for a free account to explore nearby services or list your skills as a provider.
                </p>
                <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {user ? (
                    <button className="btn btn-primary" onClick={() => setCurrentView('home')} style={{ padding: '0.85rem 2.25rem', fontSize: '0.95rem' }}>
                      Back to Services
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-primary" onClick={() => setCurrentView('register')} style={{ padding: '0.85rem 2.25rem', fontSize: '0.95rem' }}>
                        Create Free Account
                      </button>
                      <button className="btn btn-secondary" onClick={() => setCurrentView('login')} style={{ padding: '0.85rem 2.25rem', fontSize: '0.95rem', background: 'var(--bg-secondary)', borderColor: 'var(--border-glass-hover)' }}>
                        Access Portal
                      </button>
                    </>
                  )}
                </div>
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
        {currentView === 'complaints' && (
          <ComplaintsSection 
            token={token} 
            currentUser={user} 
            showToast={showToast}
            asRole="customer"
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
