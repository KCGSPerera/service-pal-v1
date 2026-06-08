'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Briefcase, Tag, AlertTriangle, Key, LogOut, Plus, Edit, Trash, Check, X, ShieldAlert, Award, Star, MessageSquare, BarChart2, Scale, Folder, AlertCircle, CreditCard, List } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminManagerTab from './admin/AdminManagerTab';
import SubscriptionTab from './admin/SubscriptionTab';
import SubscriptionPlanTab from './admin/SubscriptionPlanTab';
import ComplaintTab from './admin/ComplaintTab';
import ReviewModerationTab from './admin/ReviewModerationTab';
import ChatMonitoringTab from './admin/ChatMonitoringTab';

export default function AdminDashboard({ showToast }) {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');

  // Lists State
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [adminsList, setAdminsList] = useState([]);

  // Loadings
  const [loading, setLoading] = useState(false);

  // Upgrade approval modal
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Category Forms State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  
  const [showSubForm, setShowSubForm] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [parentCatId, setParentCatId] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchUpgradeRequests();
    fetchUsers();
    fetchCategories();
    fetchSubcategories();
    fetchComplaints();
    fetchSubscriptions();
    if (user?.role === 'super_admin') {
      fetchSubscriptionPlans();
      fetchAdmins();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
        setActivities(data.recentActivities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpgradeRequests = async () => {
    try {
      const response = await fetch('/api/admin/upgrade-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setUpgrades(data.requests);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setUsers(data.users);
    } catch (err) { console.error(err); }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?all=true');
      const data = await response.json();
      if (response.ok) setCategories(data.categories);
    } catch (err) { console.error(err); }
  };

  const fetchSubcategories = async () => {
    try {
      const response = await fetch('/api/subcategories?all=true');
      const data = await response.json();
      if (response.ok) setSubcategories(data.subcategories);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setComplaints(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setSubscriptions(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setSubscriptionPlans(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setAdminsList(data.data);
    } catch (err) { console.error(err); }
  };

  const handleBlockToggle = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        fetchUsers();
        fetchDashboardStats();
      } else {
        showToast(data.message || 'Block failed', 'error');
      }
    } catch (err) { showToast('Connection error', 'error'); }
  };

  const handleUpgradeAction = async (requestId, action) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/upgrade-requests/${requestId}/action`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          admin_remarks: adminRemarks
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(`Request has been ${action}!`, 'success');
        setSelectedUpgrade(null);
        setAdminRemarks('');
        fetchUpgradeRequests();
        fetchUsers();
        fetchDashboardStats();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) { showToast('Connection error', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleCategoryCreate = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category_name: newCatName, category_image: newCatImage })
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Category created successfully!', 'success');
        setNewCatName('');
        setNewCatImage('');
        setShowCategoryForm(false);
        fetchCategories();
      } else {
        showToast(data.message || 'Create failed', 'error');
      }
    } catch (err) { showToast('Error creating category', 'error'); }
  };

  const handleCategoryToggle = async (catId) => {
    try {
      const response = await fetch(`/api/categories?id=${catId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Category status updated', 'success');
        fetchCategories();
        fetchSubcategories();
      } else {
        showToast('Failed to update category', 'error');
      }
    } catch (err) { showToast('Connection error', 'error'); }
  };

  const handleSubcategoryCreate = async (e) => {
    e.preventDefault();
    if (!newSubName || !parentCatId) return;
    try {
      const response = await fetch('/api/subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sub_category_name: newSubName, category_id: parentCatId })
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Subcategory created successfully!', 'success');
        setNewSubName('');
        setParentCatId('');
        setShowSubForm(false);
        fetchSubcategories();
      } else {
        showToast(data.message || 'Create failed', 'error');
      }
    } catch (err) { showToast('Error creating subcategory', 'error'); }
  };

  const handleSubcategoryToggle = async (subId) => {
    try {
      const response = await fetch(`/api/subcategories?id=${subId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Subcategory status updated', 'success');
        fetchSubcategories();
      } else {
        showToast('Failed to update subcategory', 'error');
      }
    } catch (err) { showToast('Connection error', 'error'); }
  };

  // Convert logo file to base64
  const handleLogoConvert = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setNewCatImage(reader.result);
    };
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <div className="glass-panel p-4" style={{ height: 'fit-content', padding: '1rem' }}>
        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1rem', textAlign: 'center' }}>
          <h3 style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Super Admin</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</span>
        </div>
        <ul className="sidebar-menu">
          <li className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={16} color="var(--accent-primary)" /> System Analytics
          </li>
          <li className={`sidebar-item ${activeTab === 'upgrades' ? 'active' : ''}`} onClick={() => setActiveTab('upgrades')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={16} color="var(--accent-primary)" /> Upgrade Approvals ({upgrades.filter((u) => u.status === 'pending').length})
          </li>
          <li className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="var(--accent-primary)" /> User Management
          </li>
          <li className={`sidebar-item ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Folder size={16} color="var(--accent-primary)" /> Category Manager
          </li>
          <li className={`sidebar-item ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} color="var(--accent-primary)" /> Complaint Management
          </li>
          <li className={`sidebar-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} color="var(--accent-primary)" /> Review Moderation
          </li>
          <li className={`sidebar-item ${activeTab === 'chat-monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('chat-monitoring')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={16} color="var(--accent-primary)" /> Chat Monitoring
          </li>
          <li className={`sidebar-item ${activeTab === 'subscriptions' ? 'active' : ''}`} onClick={() => setActiveTab('subscriptions')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={16} color="var(--accent-primary)" /> Subscriptions
          </li>
          {user?.role === 'super_admin' && (
            <li className={`sidebar-item ${activeTab === 'subscription-plans' ? 'active' : ''}`} onClick={() => setActiveTab('subscription-plans')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={16} color="var(--accent-primary)" /> Subscription Plans
            </li>
          )}
          {user?.role === 'super_admin' && (
            <li className={`sidebar-item ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => setActiveTab('admins')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} color="var(--accent-primary)" /> Admin Management
            </li>
          )}
        </ul>
      </div>

      {/* Main panel */}
      <div className="glass-panel p-4" style={{ minHeight: '500px' }}>
        
        {/* TAB 1: SYSTEM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>System Performance Overview</h2>
            
            {stats && (
              <>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Total Users</span>
                    <span className="stat-card-value">{stats.totalUsers}</span>
                    <span className="stat-card-sub" style={{ color: 'var(--text-secondary)' }}>Registered accounts</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Active Sellers</span>
                    <span className="stat-card-value">{stats.totalProviders}</span>
                    <span className="stat-card-sub">Approved service experts</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Total Bookings</span>
                    <span className="stat-card-value">{stats.totalBookings}</span>
                    <span className="stat-card-sub" style={{ color: 'var(--accent-secondary)' }}>Service requests</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Total Revenue</span>
                    <span className="stat-card-value">LKR {stats.totalRevenue}</span>
                    <span className="stat-card-sub">Completed order earnings</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Total Reviews</span>
                    <span className="stat-card-value">{stats.totalReviews || 0}</span>
                    <span className="stat-card-sub" style={{ color: 'var(--accent-primary)' }}>Customer reviews log</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Pending Reviews</span>
                    <span className="stat-card-value" style={{ color: '#eab308' }}>{stats.pendingReviews || 0}</span>
                    <span className="stat-card-sub">Reviews under moderation</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Average Rating</span>
                    <span className="stat-card-value" style={{ color: 'var(--accent-secondary)' }}>{stats.avgProviderRating || '0.0'} ★</span>
                    <span className="stat-card-sub">Provider score average</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Saved Favorites</span>
                    <span className="stat-card-value">{stats.totalFavorites || 0}</span>
                    <span className="stat-card-sub">Total provider bookmarks</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Chat Messages</span>
                    <span className="stat-card-value">{stats.totalChatMessages || 0}</span>
                    <span className="stat-card-sub">Total messages exchanged</span>
                  </div>
                  <div className="glass-panel stat-card">
                    <span className="stat-card-title">Active Chats</span>
                    <span className="stat-card-value">{stats.activeConversations || 0}</span>
                    <span className="stat-card-sub">Unique buyer-seller threads</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', marginTop: '2rem' }} className="grid-cols-2">
                  {/* SVG earnings progress chart */}
                  <div className="glass-panel p-4">
                    <h3>Simulated Revenue Growth</h3>
                    <svg className="chart-svg" viewBox="0 0 500 200">
                      <defs>
                        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="50" y1="20" x2="480" y2="20" className="chart-grid" />
                      <line x1="50" y1="70" x2="480" y2="70" className="chart-grid" />
                      <line x1="50" y1="120" x2="480" y2="120" className="chart-grid" />
                      <line x1="50" y1="170" x2="480" y2="170" className="chart-grid" />

                      {/* Area Fill */}
                      <path d="M 50 170 L 120 140 L 190 150 L 260 110 L 330 90 L 400 70 L 470 30 L 470 170 Z" className="chart-area" />

                      {/* Line Plot */}
                      <path d="M 50 170 L 120 140 L 190 150 L 260 110 L 330 90 L 400 70 L 470 30" className="chart-line" />
                      
                      {/* X axis labels */}
                      <text x="50" y="190" fill="var(--text-secondary)" fontSize="10">Jan</text>
                      <text x="120" y="190" fill="var(--text-secondary)" fontSize="10">Feb</text>
                      <text x="190" y="190" fill="var(--text-secondary)" fontSize="10">Mar</text>
                      <text x="260" y="190" fill="var(--text-secondary)" fontSize="10">Apr</text>
                      <text x="330" y="190" fill="var(--text-secondary)" fontSize="10">May</text>
                      <text x="400" y="190" fill="var(--text-secondary)" fontSize="10">Jun</text>
                      <text x="470" y="190" fill="var(--text-secondary)" fontSize="10">Jul</text>
                    </svg>
                  </div>

                  {/* Activity feed */}
                  <div className="glass-panel p-4">
                    <h3>Recent System Logs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {activities.map((act, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.4rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{act.message}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(act.time).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {activities.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No activities logged.</p>}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: SELLER UPGRADE QUEUE */}
        {activeTab === 'upgrades' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Service Provider Upgrade Request Queue</h2>
            
            {upgrades.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No upgrade requests submitted.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Business Profile</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Submission Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upgrades.map((req) => (
                      <tr key={req._id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{req.user_id?.first_name} {req.user_id?.last_name}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{req.user_id?.username}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{req.business_name}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.business_email}</span>
                        </td>
                        <td>{req.category_id?.category_name}</td>
                        <td>
                          <span style={{ fontWeight: '500', color: req.service_type === 'Corporate' ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                            {req.service_type}
                          </span>
                        </td>
                        <td>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge badge-${req.status}`}>{req.status}</span>
                        </td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => { setSelectedUpgrade(req); setAdminRemarks(req.admin_remarks || ''); }}>
                            View Documents
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER DIRECTORY MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>System User Directory</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>System Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((usr) => (
                    <tr key={usr._id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{usr.first_name} {usr.last_name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{usr.username}</span>
                      </td>
                      <td>{usr.email}</td>
                      <td>{usr.phone}</td>
                      <td>
                        <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', color: usr.role === 'provider' ? 'var(--accent-secondary)' : usr.role === 'super_admin' ? 'red' : 'var(--text-primary)' }}>
                          {usr.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${usr.status === 'active' ? 'badge-approved' : 'badge-blocked'}`}>
                          {usr.status}
                        </span>
                      </td>
                      <td>
                        {usr.role !== 'super_admin' && (
                          <button 
                            className={`btn ${usr.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => handleBlockToggle(usr._id)}
                          >
                            {usr.status === 'active' ? 'Block Account' : 'Unblock Account'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORY MANAGER */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Category & Subcategory Directory</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => setShowCategoryForm(true)}>+ Add Category</button>
                <button className="btn btn-primary" onClick={() => setShowSubForm(true)}>+ Add Subcategory</button>
              </div>
            </div>

            {/* Categories Table list */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem' }} className="grid-cols-2">
              <div className="glass-panel p-4">
                <h3>Main Service Categories</h3>
                <div className="table-container" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Status</th>
                        <th>Toggle Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <tr key={cat._id}>
                          <td style={{ fontWeight: '600' }}>{cat.category_name}</td>
                          <td>
                            <span className={`badge ${cat.status === 'active' ? 'badge-approved' : 'badge-blocked'}`}>
                              {cat.status}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleCategoryToggle(cat._id)}>
                              {cat.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subcategories */}
              <div className="glass-panel p-4">
                <h3>Service Subcategories</h3>
                <div className="table-container" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Subcategory</th>
                        <th>Parent Category</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategories.map((sub) => (
                        <tr key={sub._id}>
                          <td style={{ fontWeight: '500' }}>{sub.sub_category_name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{sub.category_id?.category_name}</td>
                          <td>
                            <span className={`badge ${sub.status === 'active' ? 'badge-approved' : 'badge-blocked'}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleSubcategoryToggle(sub._id)}>
                              {sub.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW TABS */}
        {activeTab === 'complaints' && (
          <ComplaintTab complaints={complaints} fetchComplaints={fetchComplaints} showToast={showToast} token={token} />
        )}
        
        {activeTab === 'reviews' && (
          <ReviewModerationTab token={token} showToast={showToast} />
        )}
        
        {activeTab === 'chat-monitoring' && (
          <ChatMonitoringTab token={token} stats={stats} showToast={showToast} />
        )}
        
        {activeTab === 'subscriptions' && (
          <SubscriptionTab subscriptions={subscriptions} fetchSubscriptions={fetchSubscriptions} showToast={showToast} token={token} />
        )}
        
        {activeTab === 'subscription-plans' && user?.role === 'super_admin' && (
          <SubscriptionPlanTab subscriptionPlans={subscriptionPlans} fetchSubscriptionPlans={fetchSubscriptionPlans} showToast={showToast} token={token} />
        )}
        
        {activeTab === 'admins' && user?.role === 'super_admin' && (
          <AdminManagerTab adminsList={adminsList} fetchAdmins={fetchAdmins} showToast={showToast} currentUser={user} token={token} />
        )}

      </div>

      {/* Upgrade Verification Documents Detail Modal */}
      {selectedUpgrade && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              Verify Upgrade Application: {selectedUpgrade.business_name}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }} className="grid-cols-2">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>APPLICANT USER</span>
                <div style={{ fontWeight: 'bold' }}>{selectedUpgrade.user_id?.first_name} {selectedUpgrade.user_id?.last_name}</div>
                <div style={{ fontSize: '0.85rem' }}>@{selectedUpgrade.user_id?.username} ({selectedUpgrade.user_id?.email})</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SERVICE TYPE</span>
                <div style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{selectedUpgrade.service_type} Service Provider</div>
              </div>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              
              {/* Common info */}
              <div>
                <strong>Operational Details:</strong>
                <div>Address: {selectedUpgrade.address}, {selectedUpgrade.city}, {selectedUpgrade.postal_code}</div>
                <div>Hours: {selectedUpgrade.working_hours} | Days: {selectedUpgrade.working_days?.join(', ')}</div>
                <p style={{ marginTop: '0.5rem', fontStyle: 'italic', fontSize: '0.9rem' }}>&quot;{selectedUpgrade.description}&quot;</p>
              </div>

              {/* Document verification checks */}
              {selectedUpgrade.service_type === 'Individual' ? (
                <div>
                  <strong>Individual Legal Verifications:</strong>
                  <div>NIC Number: {selectedUpgrade.nic_number}</div>
                  
                  {/* Image downloads / display */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }} className="grid-cols-2">
                    <div>
                      <div>NIC Front View:</div>
                      {selectedUpgrade.nic_front_image ? (
                        <img src={selectedUpgrade.nic_front_image} alt="NIC Front" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', border: '1px solid var(--border-glass)' }} />
                      ) : <span style={{ color: 'var(--text-muted)' }}>No Front Scan Loaded</span>}
                    </div>
                    <div>
                      <div>NIC Back View:</div>
                      {selectedUpgrade.nic_back_image ? (
                        <img src={selectedUpgrade.nic_back_image} alt="NIC Back" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', border: '1px solid var(--border-glass)' }} />
                      ) : <span style={{ color: 'var(--text-muted)' }}>No Back Scan Loaded</span>}
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div>Police Clearance Certificate Scan:</div>
                    {selectedUpgrade.police_report_image ? (
                      <img src={selectedUpgrade.police_report_image} alt="Police report" style={{ maxHeight: '150px', objectFit: 'contain', border: '1px solid var(--border-glass)' }} />
                    ) : <span style={{ color: 'var(--text-muted)' }}>No Police Report Scan Loaded</span>}
                  </div>
                </div>
              ) : (
                <div>
                  <strong>Corporate Legal Verifications:</strong>
                  <div>Business Registration Number: {selectedUpgrade.registration_number}</div>
                  {selectedUpgrade.tax_id && <div>Tax File ID: {selectedUpgrade.tax_id}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }} className="grid-cols-2">
                    <div>
                      <div>BR Document Scan / PDF:</div>
                      {selectedUpgrade.registration_document ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>BR Registration Document Loaded</div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>No BR Document</span>}
                    </div>
                    <div>
                      <div>Articles of Association / Form 1:</div>
                      {selectedUpgrade.br_document ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Form 1 Document Loaded</div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>No Form 1 document</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Billing proof (common) */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                <div>Utility Billing Proof Address Document:</div>
                {selectedUpgrade.billing_proof_image ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Utility Bill Proof Address Document Loaded</div>
                ) : <span style={{ color: 'var(--text-muted)' }}>No billing proof uploaded</span>}
              </div>
            </div>

            {/* Admin Remarks and action buttons */}
            {selectedUpgrade.status === 'pending' ? (
              <div style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Review Remarks / Reason (Required if Rejecting)</label>
                  <input type="text" className="form-input" value={adminRemarks} onChange={(e) => setAdminRemarks(e.target.value)} placeholder="e.g. Documentation verified." />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => { setSelectedUpgrade(null); setAdminRemarks(''); }} disabled={actionLoading}>
                    Close
                  </button>
                  <button className="btn btn-danger" onClick={() => handleUpgradeAction(selectedUpgrade._id, 'rejected')} disabled={actionLoading}>
                    Reject Application
                  </button>
                  <button className="btn btn-success" onClick={() => handleUpgradeAction(selectedUpgrade._id, 'approved')} disabled={actionLoading}>
                    Approve & Upgrade Role
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Processed Remarks: {selectedUpgrade.admin_remarks || 'None'}
                </div>
                <button className="btn btn-secondary" onClick={() => setSelectedUpgrade(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Creation Modal Form */}
      {showCategoryForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Service Category</h2>
            <form onSubmit={handleCategoryCreate} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input type="text" className="form-input" required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Painting Services" />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Category Image / Banner (Optional)</label>
                <input type="file" accept="image/*" onChange={handleLogoConvert} />
                {newCatImage && <img src={newCatImage} alt="cat preview" style={{ maxHeight: '100px', objectFit: 'contain', marginTop: '0.5rem' }} />}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Creation Modal Form */}
      {showSubForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Service Subcategory</h2>
            <form onSubmit={handleSubcategoryCreate} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Subcategory Name *</label>
                <input type="text" className="form-input" required value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="e.g. Wall Painting" />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Parent Category *</label>
                <select className="form-input" required value={parentCatId} onChange={(e) => setParentCatId(e.target.value)}>
                  <option value="">-- Select Category --</option>
                  {categories.filter((c) => c.status === 'active').map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Subcategory</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
