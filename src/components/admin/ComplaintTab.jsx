'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Send, FileText, Image, Music, CheckCircle, Loader, MessageSquare, Clock, Plus, Trash2, Edit2, X, Check, ArrowLeft, ExternalLink } from 'lucide-react';

export default function ComplaintTab({ token, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('tickets'); // 'tickets' or 'config'
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Configuration options (Super Admin only)
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  
  // Create Option Form
  const [newOptType, setNewOptType] = useState('title');
  const [newOptValue, setNewOptValue] = useState('');
  const [selectedTitleIds, setSelectedTitleIds] = useState([]);
  const [createOptLoading, setCreateOptLoading] = useState(false);

  // Edit Option State
  const [editingOptId, setEditingOptId] = useState(null);
  const [editingOptValue, setEditingOptValue] = useState('');
  const [editingOptTitleIds, setEditingOptTitleIds] = useState([]);
  const [editOptLoading, setEditOptLoading] = useState(false);

  // Ticket Reply & Resolution State
  const [replyMessage, setReplyMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('All');
  
  const repliesEndRef = useRef(null);

  // Check if current user is super admin
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Decode token or call endpoint to verify role
    const getRole = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role === 'super_admin') {
            setIsSuperAdmin(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    getRole();
    fetchTickets();
  }, [token]);

  useEffect(() => {
    if (activeSubTab === 'config') {
      fetchOptions();
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (activeTicket && repliesEndRef.current) {
      repliesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket]);

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const response = await fetch('/api/complaint-tickets', {
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
      setTicketsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      setOptionsLoading(true);
      const response = await fetch('/api/complaint-options');
      const data = await response.json();
      if (response.ok && data.success) {
        setOptions(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading dropdown options', 'error');
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleCreateOption = async (e) => {
    e.preventDefault();
    if (!newOptValue.trim()) return;

    try {
      setCreateOptLoading(true);
      const response = await fetch('/api/complaint-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: newOptType,
          value: newOptValue.trim(),
          associated_titles: newOptType === 'subtitle' ? selectedTitleIds : []
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Option created successfully!', 'success');
        setOptions(prev => [data.data, ...prev]);
        setNewOptValue('');
        setSelectedTitleIds([]);
      } else {
        showToast(data.message || 'Failed to create option', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating option', 'error');
    } finally {
      setCreateOptLoading(false);
    }
  };

  const handleUpdateOption = async (id, type) => {
    if (!editingOptValue.trim()) return;

    try {
      setEditOptLoading(true);
      const body = { value: editingOptValue.trim() };
      if (type === 'subtitle') {
        body.associated_titles = editingOptTitleIds;
      }
      const response = await fetch(`/api/complaint-options/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Option updated successfully!', 'success');
        setOptions(prev => prev.map(o => o._id === id ? data.data : o));
        setEditingOptId(null);
        setEditingOptValue('');
        setEditingOptTitleIds([]);
      } else {
        showToast(data.message || 'Failed to update option', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating option', 'error');
    } finally {
      setEditOptLoading(false);
    }
  };

  const handleDeleteOption = async (id) => {
    if (!confirm('Are you sure you want to delete this option?')) return;

    try {
      const response = await fetch(`/api/complaint-options/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Option deleted successfully', 'success');
        setOptions(prev => prev.filter(o => o._id !== id));
      } else {
        showToast(data.message || 'Failed to delete option', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting option', 'error');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setActionLoading(true);
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
        setTickets(prev => prev.map(t => t._id === data.data._id ? data.data : t));
      } else {
        showToast(data.message || 'Failed to send reply', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending reply', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminCloseTicket = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/complaint-tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'admin_close' })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Ticket marked solved by admin!', 'success');
        setActiveTicket(data.data);
        setTickets(prev => prev.map(t => t._id === data.data._id ? data.data : t));
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const startEditing = (opt) => {
    setEditingOptId(opt._id);
    setEditingOptValue(opt.value);
    setEditingOptTitleIds(opt.associated_titles ? opt.associated_titles.map(t => t._id || t) : []);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter === 'All') return true;
    return ticket.status === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-in' }}>
      
      {/* Tab Navigation header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeSubTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveSubTab('tickets'); setActiveTicket(null); }}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            Ticket Desk ({tickets.length})
          </button>
          
          {isSuperAdmin && (
            <button 
              className={`btn ${activeSubTab === 'config' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('config')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              Option Manager
            </button>
          )}
        </div>
        
        {activeSubTab === 'tickets' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter Status:</span>
            <select 
              className="form-input" 
              style={{ width: '120px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Tickets</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={fetchTickets} title="Reload">
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* SUB TAB 1: TICKET DESK (SPLIT WINDOW DESIGN) */}
      {activeSubTab === 'tickets' && (
        <div className={`responsive-split-tickets ${activeTicket ? 'has-active' : ''}`} style={{ minHeight: '500px' }}>
          
          {/* TICKETS LIST COLUMN */}
          <div className="glass-panel ticket-queue-column" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border-glass-light)', paddingBottom: '0.5rem' }}>
              Complaints Queue
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ticketsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader className="animate-spin" size={24} color="var(--accent-primary)" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem' }}>
                  No complaint tickets matching filter.
                </p>
              ) : (
                filteredTickets.map(ticket => {
                  const isSelected = activeTicket?._id === ticket._id;
                  return (
                    <div 
                      key={ticket._id}
                      onClick={() => setActiveTicket(ticket)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass-light)',
                        borderLeft: isSelected ? '4px solid var(--accent-primary)' : '1px solid var(--border-glass-light)',
                        transition: 'all 0.2s ease',
                      }}
                      className="hover-bg-glass"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                          {ticket.title}
                        </strong>
                        <span className={`badge ${ticket.status === 'Closed' ? 'badge-approved' : 'badge-pending'}`} style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                          {ticket.status}
                        </span>
                      </div>
                      
                      {ticket.subtitle && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          {ticket.subtitle}
                        </div>
                      )}
                      
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '0.5rem' }}>
                        {ticket.description}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem' }}>
                        <span>
                          {ticket.reporter_id?.email ? ticket.reporter_id.email : 'Unknown user'} ({ticket.reporter_role || 'customer'})
                        </span>
                        <span>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ACTIVE TICKET DISPLAY WINDOW */}
          {activeTicket ? (
            <div className="responsive-split-ticket-details">
              
              {/* DETAILS COLUMN */}
              <div className="glass-panel" style={{ padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${activeTicket.status === 'Closed' ? 'badge-approved' : 'badge-pending'}`}>
                    {activeTicket.status}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                    onClick={() => setActiveTicket(null)}
                  >
                    Close Pane
                  </button>
                </div>
                
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REPORTER</span>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                    {activeTicket.reporter_id?.first_name} {activeTicket.reporter_id?.last_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {activeTicket.reporter_id?.email} | Role: {activeTicket.reporter_role || 'customer'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TITLE / CONCERN</span>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{activeTicket.title}</div>
                  {activeTicket.subtitle && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Subcategory: {activeTicket.subtitle}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DESCRIPTION</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.4' }}>
                    {activeTicket.description}
                  </p>
                </div>

                {/* Attachments preview */}
                {activeTicket.references && activeTicket.references.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ATTACHMENTS</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {activeTicket.references.map((ref, idx) => (
                        <div key={idx} style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass-light)', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                            {ref.file_type === 'image' && <Image size={12} color="var(--accent-primary)" />}
                            {ref.file_type === 'audio' && <Music size={12} color="var(--accent-secondary)" />}
                            {ref.file_type === 'document' && <FileText size={12} color="var(--text-secondary)" />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ref.name}</span>
                            <a href={ref.data} download={ref.name} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Download</a>
                          </div>

                          {ref.file_type === 'image' && (
                            <img src={ref.data} alt="Attach" style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', marginTop: '0.35rem', borderRadius: '4px' }} onClick={() => window.open(ref.data, '_blank')} />
                          )}
                          {ref.file_type === 'audio' && (
                            <audio controls src={ref.data} style={{ width: '100%', height: '28px', marginTop: '0.35rem' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Co-Close workflows */}
                <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CO-CLOSE WORKFLOW STATUS</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: activeTicket.closed_by_admin ? 'var(--success)' : 'var(--text-secondary)' }}>
                    <span>Admin solved ticket:</span>
                    <span style={{ fontWeight: '600' }}>{activeTicket.closed_by_admin ? 'Yes ✓' : 'No'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: activeTicket.closed_by_user ? 'var(--success)' : 'var(--text-secondary)' }}>
                    <span>User completed ticket:</span>
                    <span style={{ fontWeight: '600' }}>{activeTicket.closed_by_user ? 'Yes ✓' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* CHAT/COMMUNICATION COLUMN */}
              <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Chat with Reporter</strong>
                </div>

                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Original description */}
                  <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '12px 12px 12px 2px', border: '1px solid var(--border-glass-light)' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.7rem', color: 'var(--accent-primary)' }}>
                      {activeTicket.reporter_id?.first_name} {activeTicket.reporter_id?.last_name} (Reporter)
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem' }}>{activeTicket.description}</p>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem', textAlign: 'right' }}>
                      {new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Replies list */}
                  {activeTicket.replies && activeTicket.replies.map((reply, idx) => {
                    const isStaff = ['admin', 'super_admin'].includes(reply.sender_role);
                    return (
                      <div 
                        key={idx}
                        style={{
                          alignSelf: isStaff ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          background: isStaff ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.05)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: isStaff ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          border: isStaff ? 'none' : '1px solid var(--border-glass-light)',
                        }}
                      >
                        <div style={{ fontWeight: '700', fontSize: '0.7rem', color: isStaff ? '#fff' : 'var(--accent-secondary)' }}>
                          {reply.sender_id?.first_name} {reply.sender_id?.last_name} ({isStaff ? 'Staff Support' : 'Reporter'})
                        </div>
                        <p style={{ margin: 0, fontSize: '0.825rem', color: isStaff ? '#fff' : 'var(--text-primary)' }}>
                          {reply.message}
                        </p>
                        <span style={{ fontSize: '0.65rem', color: isStaff ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', display: 'block', marginTop: '0.2rem', textAlign: 'right' }}>
                          {new Date(reply.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={repliesEndRef} />
                </div>

                {/* RESOLUTION ACTIONS BAR */}
                {!activeTicket.closed_by_admin && (
                  <div 
                    style={{ 
                      padding: '0.5rem 0.75rem', 
                      background: 'rgba(239, 68, 68, 0.05)', 
                      borderTop: '1px solid var(--border-glass-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Has this issue been solved?</span>
                    <button 
                      className="btn btn-success" 
                      onClick={handleAdminCloseTicket} 
                      disabled={actionLoading}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {actionLoading ? <Loader className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                      Mark Solved (Admin Close)
                    </button>
                  </div>
                )}

                {/* Communication text field */}
                {activeTicket.status !== 'Closed' ? (
                  <form 
                    onSubmit={handleSendReply}
                    style={{
                      padding: '0.5rem 0.75rem',
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
                      placeholder="Type your response to the user..." 
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      style={{ flex: 1, minHeight: '32px', fontSize: '0.85rem' }}
                      disabled={actionLoading}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.8rem' }}
                      disabled={actionLoading || !replyMessage.trim()}
                    >
                      {actionLoading ? <Loader className="animate-spin" size={14} /> : <Send size={14} />}
                    </button>
                  </form>
                ) : (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-glass)' }}>
                    Ticket is fully closed.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
              <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3>No Ticket Selected</h3>
              <p style={{ fontSize: '0.9rem' }}>Select a ticket from the sidebar queue to inspect details and chat with the user.</p>
            </div>
          )}

        </div>
      )}

      {/* SUB TAB 2: OPTIONS CONFIGURATION (SUPER ADMIN ONLY) */}
      {activeSubTab === 'config' && isSuperAdmin && (
        <div className="responsive-split-modal" style={{ gap: '1.5rem' }}>
          
          {/* TITLE OPTIONS CARD */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Title Options
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.25rem' }}>
              {optionsLoading ? (
                <Loader className="animate-spin" size={18} />
              ) : options.filter(o => o.type === 'title').length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No title options configured.</p>
              ) : (
                options.filter(o => o.type === 'title').map(opt => (
                  <div 
                    key={opt._id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.4rem 0.6rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-glass-light)', 
                      borderRadius: '6px' 
                    }}
                  >
                    {editingOptId === opt._id ? (
                      <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
                          value={editingOptValue}
                          onChange={(e) => setEditingOptValue(e.target.value)}
                        />
                        <button className="btn btn-success" style={{ padding: '0.25rem' }} onClick={() => handleUpdateOption(opt._id)} disabled={editOptLoading}>
                          <Check size={14} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setEditingOptId(null)}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{opt.value}</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn-icon-hover" style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => startEditing(opt)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon-hover" style={{ border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteOption(opt._id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SUBTITLE OPTIONS CARD */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Sub Title Options
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.25rem' }}>
              {optionsLoading ? (
                <Loader className="animate-spin" size={18} />
              ) : options.filter(o => o.type === 'subtitle').length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No subtitle options configured.</p>
              ) : (
                options.filter(o => o.type === 'subtitle').map(opt => (
                  <div 
                    key={opt._id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.5rem 0.6rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-glass-light)', 
                      borderRadius: '6px' 
                    }}
                  >
                    {editingOptId === opt._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', padding: '0.4rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
                            value={editingOptValue}
                            onChange={(e) => setEditingOptValue(e.target.value)}
                          />
                          <button className="btn btn-success" style={{ padding: '0.25rem' }} onClick={() => handleUpdateOption(opt._id, opt.type)} disabled={editOptLoading}>
                            <Check size={14} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setEditingOptId(null)}>
                            <X size={14} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Edit Title Associations:</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--border-glass)', padding: '0.35rem', borderRadius: '4px', background: 'var(--bg-glass-input)' }}>
                            {options.filter(o => o.type === 'title').map(titleOpt => (
                              <label key={titleOpt._id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                                <input 
                                  type="checkbox" 
                                  checked={editingOptTitleIds.includes(titleOpt._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingOptTitleIds(prev => [...prev, titleOpt._id]);
                                    } else {
                                      setEditingOptTitleIds(prev => prev.filter(id => id !== titleOpt._id));
                                    }
                                  }}
                                />
                                {titleOpt.value}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{opt.value}</span>
                          {opt.associated_titles && opt.associated_titles.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.15rem' }}>
                              {opt.associated_titles.map((title, tIdx) => (
                                <span key={tIdx} style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: '500' }}>
                                  {title.value || title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn-icon-hover" style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => startEditing(opt)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon-hover" style={{ border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteOption(opt._id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* ADD OPTION FORM BOX (FULL SPAN) */}
          <div className="glass-panel span-2-desktop" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontWeight: '700' }}>Add New Option Configuration</h4>
            <form onSubmit={handleCreateOption} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Option Type</label>
                  <select className="form-input" value={newOptType} onChange={(e) => {
                    setNewOptType(e.target.value);
                    setSelectedTitleIds([]);
                  }}>
                    <option value="title">Title Option</option>
                    <option value="subtitle">Sub Title Option</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2, margin: 0 }}>
                  <label className="form-label">Value Text *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Broken links, Slow performance, Audio player issue..."
                    value={newOptValue}
                    onChange={(e) => setNewOptValue(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={createOptLoading} style={{ height: '38px', padding: '0 1.5rem' }}>
                  {createOptLoading ? <Loader className="animate-spin" size={16} /> : 'Create Option'}
                </button>
              </div>

              {newOptType === 'subtitle' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
                    Associate with Title(s) (Select one or more):
                  </label>
                  {options.filter(o => o.type === 'title').length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No title options configured. Create a title option first.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '130px', overflowY: 'auto', border: '1px solid var(--border-glass)', padding: '0.75rem', borderRadius: '6px', background: 'rgba(0,0,0,0.1)' }}>
                      {options.filter(o => o.type === 'title').map(titleOpt => (
                        <label key={titleOpt._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedTitleIds.includes(titleOpt._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTitleIds(prev => [...prev, titleOpt._id]);
                              } else {
                                setSelectedTitleIds(prev => prev.filter(id => id !== titleOpt._id));
                              }
                            }}
                          />
                          {titleOpt.value}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
