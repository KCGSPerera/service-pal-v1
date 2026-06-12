'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ArrowLeft, Send, FileText, Image, CheckCircle, Loader, MessageSquare, Clock, Plus, Trash, Music, ExternalLink, X } from 'lucide-react';

export default function ComplaintsSection({ token, currentUser, showToast, asRole = 'customer' }) {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'raise', 'detail'
  
  // Form State
  const [titleInput, setTitleInput] = useState('');
  const [subtitleInput, setSubtitleInput] = useState('');
  const [description, setDescription] = useState('');
  const [references, setReferences] = useState([]); // [{ name, file_type, data }]
  
  // Dropdown/Suggestion Config Options
  const [options, setOptions] = useState([]); // All titles & subtitles from DB
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [showSubtitleSuggestions, setShowSubtitleSuggestions] = useState(false);

  // Detail/Communication State
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  
  const repliesEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
    fetchOptions();
  }, [asRole, token]);

  useEffect(() => {
    if (activeTicket && repliesEndRef.current) {
      repliesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/complaint-tickets?role=${asRole}&personal=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading support tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/complaint-options');
      const data = await response.json();
      if (response.ok && data.success) {
        setOptions(data.data);
      }
    } catch (err) {
      console.error('Error fetching title/subtitle options:', err);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds 5MB size limit`, 'error');
        return;
      }

      let fileType = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(file.name.split('.').pop().toLowerCase())) {
        fileType = 'audio';
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setReferences(prev => [...prev, {
          name: file.name,
          file_type: fileType,
          data: reader.result
        }]);
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        showToast(`Failed to load file: ${file.name}`, 'error');
      };
    });
    
    e.target.value = ''; // Reset file input
  };

  const removeReference = (idx) => {
    setReferences(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Description is required', 'error');
      return;
    }

    try {
      setSubmitLoading(true);
      const response = await fetch('/api/complaint-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleInput.trim(),
          subtitle: subtitleInput.trim(),
          description: description.trim(),
          references,
          reporter_role: asRole
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Complaint ticket raised successfully!', 'success');
        setTickets(prev => [data.data, ...prev]);
        setView('list');
        // Reset form
        setTitleInput('');
        setSubtitleInput('');
        setDescription('');
        setReferences([]);
      } else {
        showToast(data.message || 'Failed to submit ticket', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error raising ticket', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setReplyLoading(true);
      const response = await fetch(`/api/complaint-tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'reply',
          message: replyMessage.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setActiveTicket(data.data);
        setReplyMessage('');
        // Refresh ticket in main list as well
        setTickets(prev => prev.map(t => t._id === data.data._id ? data.data : t));
      } else {
        showToast(data.message || 'Failed to send message', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending reply', 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleConfirmCompleted = async () => {
    try {
      setReplyLoading(true);
      const response = await fetch(`/api/complaint-tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'user_complete'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Ticket marked as completed!', 'success');
        setActiveTicket(data.data);
        setTickets(prev => prev.map(t => t._id === data.data._id ? data.data : t));
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error', 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  // Get matching suggestion options
  const getTitleSuggestions = () => {
    const query = titleInput.toLowerCase().trim();
    const allTitles = options.filter(o => o.type === 'title');
    if (!query) return allTitles;
    return allTitles.filter(o => o.value.toLowerCase().includes(query));
  };

  const getSubtitleSuggestions = () => {
    const subQuery = subtitleInput.toLowerCase().trim();
    let filteredSubs = options.filter(o => o.type === 'subtitle');

    // Find if current titleInput matches a defined title option
    const matchingTitle = options.find(o => o.type === 'title' && o.value.toLowerCase().trim() === titleInput.toLowerCase().trim());
    
    if (matchingTitle) {
      filteredSubs = filteredSubs.filter(sub => {
        if (Array.isArray(sub.associated_titles)) {
          return sub.associated_titles.some(t => (t._id || t) === matchingTitle._id);
        }
        return false;
      });
    }

    if (!subQuery) return filteredSubs;
    return filteredSubs.filter(o => o.value.toLowerCase().includes(subQuery));
  };

  const viewTicketDetail = (ticket) => {
    setActiveTicket(ticket);
    setView('detail');
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <style>{`
        .suggestions-dropdown {
          background: var(--bg-secondary, #0f111a) !important;
          border: 1px solid var(--border-glass-hover, rgba(255,255,255,0.15)) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
          border-radius: 6px !important;
        }
        .suggestion-item {
          padding: 0.6rem 0.85rem !important;
          color: var(--text-primary) !important;
          border-bottom: 1px solid var(--border-glass, rgba(255,255,255,0.06)) !important;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .suggestion-item:hover {
          background: var(--accent-primary, #6366f1) !important;
          color: white !important;
        }
        .suggestion-item:last-child {
          border-bottom: none !important;
        }
      `}</style>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass-light)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {view !== 'list' && (
            <button 
              className="btn-icon-hover" 
              onClick={() => { setView('list'); setActiveTicket(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={24} color="var(--accent-primary)" />
            Platform Support Tickets
          </h2>
        </div>
        
        {view === 'list' && (
          <button className="btn btn-primary" onClick={() => setView('raise')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Plus size={16} /> New Support Ticket
          </button>
        )}
      </div>

      {/* VIEW 1: TICKETS LIST */}
      {view === 'list' && (
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader className="animate-spin" size={32} color="var(--accent-primary)" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <h3>No Support Tickets Found</h3>
              <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem', fontSize: '0.9rem' }}>
                If you encounter any problems or have complaints about the platform features, raise a support ticket and our administration team will assist you.
              </p>
              <button className="btn btn-primary" onClick={() => setView('raise')}>
                Create Your First Ticket
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket Info</th>
                    <th>Sub Title</th>
                    <th>Status</th>
                    <th>Raised Date</th>
                    <th>Co-Close Flow Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket._id} className="table-row-hover" onClick={() => viewTicketDetail(ticket)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{ticket.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                          {ticket.description}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{ticket.subtitle || '-'}</td>
                      <td>
                        <span className={`badge ${ticket.status === 'Closed' ? 'badge-approved' : 'badge-pending'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: ticket.closed_by_admin ? 'var(--success)' : 'var(--text-muted)' }}>
                            <CheckCircle size={12} color={ticket.closed_by_admin ? 'var(--success)' : '#6b7280'} /> Admin Closed
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: ticket.closed_by_user ? 'var(--success)' : 'var(--text-muted)' }}>
                            <CheckCircle size={12} color={ticket.closed_by_user ? 'var(--success)' : '#6b7280'} /> User Completed
                          </span>
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); viewTicketDetail(ticket); }}>
                          View &amp; Chat
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

      {/* VIEW 2: RAISE TICKET FORM */}
      {view === 'raise' && (
        <div className="glass-panel" style={{ padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>Raise a Support Ticket</h3>
          <form onSubmit={handleCreateTicket}>
            
            {/* Title Input with Dropdown / Autocomplete */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Title (Platform Feature Complaint) *</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Select option or type manual title..."
                  value={titleInput} 
                  onChange={(e) => {
                    setTitleInput(e.target.value);
                    setShowTitleSuggestions(true);
                  }}
                  onFocus={() => setShowTitleSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 200)}
                  required
                />
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem' }} 
                  onClick={() => setShowTitleSuggestions(!showTitleSuggestions)}
                >
                  ▾
                </button>
              </div>

              {showTitleSuggestions && (
                <div 
                  className="glass-panel suggestions-dropdown"
                  style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    zIndex: 1000, 
                    maxHeight: '160px', 
                    overflowY: 'auto', 
                    background: 'var(--bg-secondary, #0f111a)', 
                    border: '1px solid var(--border-glass-hover, rgba(255, 255, 255, 0.15))',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    marginTop: '2px',
                    borderRadius: '6px'
                  }}
                >
                  {getTitleSuggestions().length === 0 ? (
                    <div style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No suggestions match. Custom text will be saved.</div>
                  ) : (
                    getTitleSuggestions().map((opt, idx) => (
                      <div 
                        key={idx}
                        className="suggestion-item"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setTitleInput(opt.value);
                          setShowTitleSuggestions(false);
                        }}
                      >
                        {opt.value}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Sub Title Input with Dropdown / Autocomplete */}
            <div className="form-group" style={{ position: 'relative', marginTop: '1.25rem' }}>
              <label className="form-label">Sub Title (Detail category)</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Select option or type manual subtitle..."
                  value={subtitleInput} 
                  onChange={(e) => {
                    setSubtitleInput(e.target.value);
                    setShowSubtitleSuggestions(true);
                  }}
                  onFocus={() => setShowSubtitleSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSubtitleSuggestions(false), 200)}
                />
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem' }} 
                  onClick={() => setShowSubtitleSuggestions(!showSubtitleSuggestions)}
                >
                  ▾
                </button>
              </div>

              {showSubtitleSuggestions && (
                <div 
                  className="glass-panel suggestions-dropdown"
                  style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    zIndex: 1000, 
                    maxHeight: '160px', 
                    overflowY: 'auto', 
                    background: 'var(--bg-secondary, #0f111a)', 
                    border: '1px solid var(--border-glass-hover, rgba(255, 255, 255, 0.15))',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    marginTop: '2px',
                    borderRadius: '6px'
                  }}
                >
                  {getSubtitleSuggestions().length === 0 ? (
                    <div style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No suggestions match. Custom text will be saved.</div>
                  ) : (
                    getSubtitleSuggestions().map((opt, idx) => (
                      <div 
                        key={idx}
                        className="suggestion-item"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSubtitleInput(opt.value);
                          setShowSubtitleSuggestions(false);
                        }}
                      >
                        {opt.value}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label">Description / Problem Details *</label>
              <textarea 
                className="form-input" 
                rows="4" 
                placeholder="Describe the problem with the platform features in detail..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                required
              />
            </div>

            {/* References Upload (Images, Docs, Audio) */}
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label">References / Attachments (Images, Documents, Audio)</label>
              <div 
                className="file-upload-box" 
                style={{
                  border: '2px dashed var(--border-glass)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  background: 'var(--bg-glass-input)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <input 
                  type="file" 
                  multiple 
                  id="ticket-files" 
                  accept="image/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload} 
                />
                <label htmlFor="ticket-files" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={28} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>Drag &amp; Drop or Click to Upload</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Images, documents or audio files (max 5MB each)</span>
                </label>
              </div>

              {/* Uploaded references preview list */}
              {references.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Selected Files ({references.length}):</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }} className="grid-cols-2">
                    {references.map((ref, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '0.5rem 0.75rem', 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid var(--border-glass)', 
                          borderRadius: '6px' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          {ref.file_type === 'image' && <Image size={16} color="var(--accent-primary)" />}
                          {ref.file_type === 'audio' && <Music size={16} color="var(--accent-secondary)" />}
                          {ref.file_type === 'document' && <FileText size={16} color="var(--text-secondary)" />}
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ref.name}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeReference(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? <Loader className="animate-spin" size={16} /> : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: TICKET DETAILS & COMMUNICATION */}
      {view === 'detail' && activeTicket && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '1.5rem' }} className="grid-cols-2-responsive">
          
          {/* LEFT COLUMN: TICKET DETAILS */}
          <div className="glass-panel" style={{ padding: '1.25rem', height: 'fit-content' }}>
            <span className={`badge ${activeTicket.status === 'Closed' ? 'badge-approved' : 'badge-pending'}`} style={{ marginBottom: '0.75rem' }}>
              Status: {activeTicket.status}
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>{activeTicket.title}</h3>
            {activeTicket.subtitle && (
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', fontWeight: '500' }}>Sub Title: {activeTicket.subtitle}</h4>
            )}
            
            <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>PROBLEM DESCRIPTION</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
                {activeTicket.description}
              </p>
            </div>

            {/* References displaying section */}
            {activeTicket.references && activeTicket.references.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '1rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ATTACHMENTS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeTicket.references.map((ref, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '0.5rem', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--border-glass-light)', 
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {ref.file_type === 'image' && <Image size={14} color="var(--accent-primary)" />}
                        {ref.file_type === 'audio' && <Music size={14} color="var(--accent-secondary)" />}
                        {ref.file_type === 'document' && <FileText size={14} color="var(--text-secondary)" />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ref.name}</span>
                        <a 
                          href={ref.data} 
                          download={ref.name}
                          style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.1rem', fontSize: '0.75rem', textDecoration: 'none' }}
                          title="Download"
                        >
                          Download <ExternalLink size={12} />
                        </a>
                      </div>

                      {/* Display content preview */}
                      {ref.file_type === 'image' && (
                        <img 
                          src={ref.data} 
                          alt={ref.name} 
                          style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-glass-light)' }} 
                          onClick={() => window.open(ref.data, '_blank')}
                        />
                      )}

                      {ref.file_type === 'audio' && (
                        <audio controls src={ref.data} style={{ width: '100%', height: '36px' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collaborative Close Status Box */}
            <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CO-CLOSE WORKFLOW STATUS</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: activeTicket.closed_by_admin ? 'var(--success)' : 'var(--text-secondary)' }}>
                <span>Admin marked solved:</span>
                <span style={{ fontWeight: '600' }}>{activeTicket.closed_by_admin ? 'Yes ✓' : 'No'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: activeTicket.closed_by_user ? 'var(--success)' : 'var(--text-secondary)' }}>
                <span>User confirmed completed:</span>
                <span style={{ fontWeight: '600' }}>{activeTicket.closed_by_user ? 'Yes ✓' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REPLY THREAD / CHAT */}
          <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '500px', overflow: 'hidden' }}>
            
            {/* Thread Header */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} color="var(--accent-primary)" />
                Communication History
              </h3>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* Original ticket description acts as the first entry */}
              <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: 'rgba(255,255,255,0.04)', padding: '0.6rem 0.8rem', borderRadius: '12px 12px 12px 2px', border: '1px solid var(--border-glass-light)' }}>
                <div style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: '0.15rem' }}>
                  {activeTicket.reporter_id?.first_name} {activeTicket.reporter_id?.last_name} (Reporter)
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {activeTicket.description}
                </p>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                  {new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Replies */}
              {activeTicket.replies && activeTicket.replies.map((reply, idx) => {
                const isMe = reply.sender_id?._id === currentUser?._id || reply.sender_id === currentUser?._id;
                const isSupport = ['admin', 'super_admin'].includes(reply.sender_role);

                return (
                  <div 
                    key={idx}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: isMe ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'rgba(255, 255, 255, 0.06)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      border: isMe ? 'none' : '1px solid var(--border-glass-light)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ 
                      fontWeight: '700', 
                      fontSize: '0.75rem', 
                      color: isMe ? '#fff' : isSupport ? 'var(--danger)' : 'var(--accent-secondary)', 
                      marginBottom: '0.15rem' 
                    }}>
                      {reply.sender_id?.first_name} {reply.sender_id?.last_name} ({isMe ? 'You' : isSupport ? 'Support Admin' : 'User'})
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: isMe ? '#ffffff' : 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {reply.message}
                    </p>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', 
                      display: 'block', 
                      marginTop: '0.25rem', 
                      textAlign: 'right' 
                    }}>
                      {new Date(reply.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={repliesEndRef} />
            </div>

            {/* BOTTOM COLLABORATIVE CONFIRM BANNER */}
            {activeTicket.closed_by_admin && !activeTicket.closed_by_user && (
              <div 
                style={{ 
                  padding: '0.75rem 1rem', 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  borderTop: '1px solid rgba(34, 197, 94, 0.3)',
                  borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div style={{ fontSize: '0.825rem', color: 'var(--success)', fontWeight: '600' }}>
                  The support administration team has marked this problem as Solved. Please verify.
                </div>
                <button 
                  className="btn btn-success" 
                  onClick={handleConfirmCompleted} 
                  disabled={replyLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {replyLoading ? <Loader className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                  Confirm Problem is Solved &amp; Mark Completed
                </button>
              </div>
            )}

            {/* Reply Input Form */}
            {activeTicket.status !== 'Closed' ? (
              <form 
                onSubmit={handleSendReply}
                style={{
                  padding: '0.75rem 1rem',
                  borderTop: '1px solid var(--border-glass)',
                  background: 'rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type a message to administration..." 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  style={{ flex: 1, minHeight: '36px' }}
                  disabled={replyLoading}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  disabled={replyLoading || !replyMessage.trim()}
                >
                  {replyLoading ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
              </form>
            ) : (
              <div 
                style={{ 
                  padding: '1rem', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)', 
                  borderTop: '1px solid var(--border-glass)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                ✓ This support ticket is closed and resolved.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
