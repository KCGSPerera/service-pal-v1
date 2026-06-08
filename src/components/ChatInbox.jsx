import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, FileText, Search, User, X, Loader, MessageSquare, AlertCircle, Eye } from 'lucide-react';

export default function ChatInbox({ token, currentUser, initChatWith, showToast, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Loading states
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // File attachments state
  const [attachment, setAttachment] = useState(null); // base64 string
  const [attachmentType, setAttachmentType] = useState('text'); // text, image, file
  const [attachmentName, setAttachmentName] = useState('');

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [searchQuery]);

  // Handle outside initiation (e.g. clicking Contact Seller from an ad details page)
  useEffect(() => {
    if (initChatWith && conversations.length >= 0) {
      const { providerId, adId } = initChatWith;
      
      // Check if we already have a conversation with this provider
      const existingConv = conversations.find(c => c.partnerInfo._id === providerId);
      
      if (existingConv) {
        setActivePartnerId(providerId);
        setActiveConversation(existingConv);
      } else {
        // Create a temporary conversation object in state
        fetchPartnerInfoAndInitiate(providerId, adId);
      }
    }
  }, [initChatWith, conversations.length]);

  // Fetch messages when activePartnerId changes
  useEffect(() => {
    if (activePartnerId) {
      setPage(1);
      fetchMessages(activePartnerId, 1, true);
      markAsSeen(activePartnerId);
    } else {
      setMessages([]);
      setActiveConversation(null);
    }
  }, [activePartnerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && page === 1) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const url = searchQuery ? `/api/chats/conversations?q=${encodeURIComponent(searchQuery)}` : '/api/chats/conversations';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading inbox conversations', 'error');
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchPartnerInfoAndInitiate = async (providerId, adId) => {
    try {
      const res = await fetch(`/api/providers/profile?providerId=${providerId}`);
      const data = await res.json();
      if (res.ok) {
        const provider = data.provider;
        
        let linkedAd = null;
        if (adId) {
          const adRes = await fetch(`/api/service-ads/${adId}`);
          const adData = await adRes.json();
          if (adRes.ok) {
            linkedAd = {
              _id: adData.ad._id,
              ad_title: adData.ad.ad_title,
              images: adData.ad.images || []
            };
          }
        }

        const tempConv = {
          partnerInfo: {
            _id: providerId,
            first_name: provider.first_name,
            last_name: provider.last_name,
            profile_image: provider.profile_image || '',
            role: 'provider'
          },
          lastMessage: null,
          relatedAdInfo: linkedAd,
          unreadCount: 0,
          isTemporary: true
        };

        setConversations(prev => [tempConv, ...prev]);
        setActivePartnerId(providerId);
        setActiveConversation(tempConv);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (partnerId, pageNumber = 1, shouldClear = false) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/chats/conversation/${partnerId}?page=${pageNumber}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const fetchedMsgs = data.data.messages;
        
        if (shouldClear) {
          setMessages(fetchedMsgs.reverse());
        } else {
          // reverse and prepend
          setMessages(prev => [...fetchedMsgs.reverse(), ...prev]);
        }
        
        setHasMore(data.data.pagination.page < data.data.pagination.pages);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading messages thread', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMoreMessages = () => {
    if (!loadingMessages && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(activePartnerId, nextPage, false);
    }
  };

  const markAsSeen = async (partnerId) => {
    try {
      const res = await fetch(`/api/chats/conversation/${partnerId}/seen`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh conversations list to update unread badge count
        setConversations(prev => 
          prev.map(c => c.partnerInfo._id === partnerId ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setAttachment(reader.result);
      setAttachmentName(file.name);
      if (file.type.startsWith('image/')) {
        setAttachmentType('image');
      } else {
        setAttachmentType('file');
      }
    };
    reader.onerror = (error) => {
      console.error('File reading error:', error);
      showToast('Failed to load file attachment', 'error');
    };
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentName('');
    setAttachmentType('text');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    try {
      setSendingMessage(true);

      const payload = {
        receiver_id: activePartnerId,
        message_content: newMessage.trim(),
        message_type: attachment ? attachmentType : 'text',
        attachment_file: attachment || null,
        related_ad_id: activeConversation?.relatedAdInfo?._id || null
      };

      const res = await fetch('/api/chats/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const sentMsg = data.data;
        // Append sent message populated with current user's profile
        const populatedMsg = {
          ...sentMsg,
          sender_id: {
            _id: currentUser._id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            profile_image: currentUser.profile_image
          }
        };
        
        setMessages(prev => [...prev, populatedMsg]);
        setNewMessage('');
        clearAttachment();
        
        // Refresh conversations list to update order and previews
        fetchConversations();
        
        // Remove temporary conversation tag if it was the first message
        if (activeConversation?.isTemporary) {
          setActiveConversation(prev => ({ ...prev, isTemporary: false }));
        }
      } else {
        showToast(data.message || 'Failed to send message', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    
    // Check if today
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const activePartner = activeConversation?.partnerInfo;

  return (
    <div className="glass-panel" style={{ height: 'calc(100vh - 160px)', display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden', padding: 0, animation: 'fadeIn 0.3s ease-in' }}>
      
      {/* LEFT COLUMN: CONVERSATION LIST */}
      <div style={{ borderRight: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 'bold' }}>Inbox Messages</h2>
          <div className="search-bar-container" style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search chat or ad title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                borderRadius: '8px',
                background: 'var(--bg-glass-input)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Conversation Thread List Scroll */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConversations ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader className="animate-spin" size={24} color="var(--accent-primary)" />
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => {
              const partner = conv.partnerInfo;
              const isSelected = activePartnerId === partner._id;
              return (
                <div 
                  key={partner._id}
                  onClick={() => {
                    setActivePartnerId(partner._id);
                    setActiveConversation(conv);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-glass-light)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    borderLeft: isSelected ? '4px solid var(--accent-primary)' : '4px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover-bg-glass"
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={partner.profile_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`}
                      alt="Avatar"
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass)' }}
                    />
                    {partner.role === 'provider' && (
                      <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', border: '1.5px solid var(--bg-primary)' }}></span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {partner.first_name} {partner.last_name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatConversationTime(conv.lastMessage?.sent_at)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{
                        fontSize: '0.8rem',
                        color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1
                      }}>
                        {conv.lastMessage
                          ? `${conv.lastMessage.sender_id === currentUser._id ? 'You: ' : ''}${conv.lastMessage.message_type !== 'text' ? `Sent an ${conv.lastMessage.message_type}` : conv.lastMessage.message_content}`
                          : 'New Chat conversation started'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span style={{
                          background: 'var(--accent-primary)',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '0.05rem 0.4rem',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          marginLeft: '0.5rem'
                        }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE THREAD */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-glass-panel)' }}>
        {activePartnerId ? (
          <>
            {/* Header section with partner avatar and link to ad */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img 
                  src={activePartner.profile_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`}
                  alt="Avatar"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {activePartner.first_name} {activePartner.last_name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {activePartner.role}
                  </span>
                </div>
              </div>

              {/* Linked Ad badge */}
              {activeConversation?.relatedAdInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '6px', maxWidth: '280px' }}>
                  {activeConversation.relatedAdInfo.images?.[0] && (
                    <img 
                      src={activeConversation.relatedAdInfo.images[0]} 
                      alt="Ad Preview" 
                      style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} 
                    />
                  )}
                  <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--accent-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeConversation.relatedAdInfo.ad_title}
                  </span>
                </div>
              )}
            </div>

            {/* MESSAGE LIST SCROLL CONTAINER */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Pagination triggers */}
              {hasMore && (
                <button 
                  onClick={loadMoreMessages} 
                  disabled={loadingMessages}
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-secondary)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  className="hover-bg-glass"
                >
                  {loadingMessages ? <Loader className="animate-spin" size={12} /> : null}
                  Load older messages
                </button>
              )}

              {messages.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Send a message to start this conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isCurrentUser = msg.sender_id._id === currentUser._id || msg.sender_id === currentUser._id;
                  
                  return (
                    <div 
                      key={msg._id || index}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {/* Message Bubble Container */}
                      <div 
                        style={{
                          background: isCurrentUser ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'rgba(255, 255, 255, 0.07)',
                          color: isCurrentUser ? '#ffffff' : 'var(--text-primary)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: isCurrentUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          border: isCurrentUser ? 'none' : '1px solid var(--border-glass-light)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                          wordBreak: 'break-word',
                          fontSize: '0.925rem',
                        }}
                      >
                        {/* Text Content */}
                        {msg.message_content && (
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.message_content}</p>
                        )}

                        {/* Image Attachment */}
                        {msg.message_type === 'image' && msg.attachment_file && (
                          <div style={{ marginTop: msg.message_content ? '0.5rem' : 0 }}>
                            <img 
                              src={msg.attachment_file} 
                              alt="Attachment Image"
                              style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', objectFit: 'contain', cursor: 'pointer' }}
                              onClick={() => window.open(msg.attachment_file, '_blank')}
                            />
                          </div>
                        )}

                        {/* File Attachment */}
                        {msg.message_type === 'file' && msg.attachment_file && (
                          <div 
                            style={{ 
                              marginTop: msg.message_content ? '0.5rem' : 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              background: 'rgba(0,0,0,0.15)',
                              padding: '0.5rem',
                              borderRadius: '6px'
                            }}
                          >
                            <FileText size={20} color={isCurrentUser ? '#fff' : 'var(--accent-primary)'} />
                            <a 
                              href={msg.attachment_file}
                              download="attachment"
                              style={{ color: isCurrentUser ? '#fff' : 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: '500', textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                              Download File
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Message Metadata (Time, Seen/Sent Status) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        <span>{formatMessageTime(msg.sent_at)}</span>
                        {isCurrentUser && (
                          <>
                            <span>•</span>
                            <span style={{ 
                              color: msg.message_status === 'seen' ? 'var(--accent-primary)' : 'var(--text-muted)',
                              fontWeight: msg.message_status === 'seen' ? '600' : 'normal'
                            }}>
                              {msg.message_status === 'seen' ? 'Seen' : 'Sent'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* ATTACHMENT PREVIEW BAR */}
            {attachment && (
              <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid var(--border-glass)', background: 'rgba(255, 255, 255, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {attachmentType === 'image' ? (
                    <img 
                      src={attachment} 
                      alt="Attachment Preview" 
                      style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} 
                    />
                  ) : (
                    <FileText size={24} color="var(--accent-primary)" />
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attachmentName || 'attachment'}
                  </span>
                </div>
                <button 
                  onClick={clearAttachment} 
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* BOTTOM INPUT BLOCK */}
            <form 
              onSubmit={handleSendMessage} 
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.75rem',
                background: 'rgba(0,0,0,0.1)'
              }}
            >
              {/* Attachment Picker */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                className="hover-bg-glass"
              >
                <Image size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              />

              {/* Text Field input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  style={{
                    width: '100%',
                    minHeight: '40px',
                    maxHeight: '120px',
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    background: 'var(--bg-glass-input)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    resize: 'none',
                    lineHeight: '1.4',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Send Submit Button */}
              <button
                type="submit"
                disabled={sendingMessage || (!newMessage.trim() && !attachment)}
                style={{
                  background: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.2rem',
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  fontWeight: '600',
                  opacity: sendingMessage || (!newMessage.trim() && !attachment) ? 0.5 : 1
                }}
              >
                {sendingMessage ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          /* Empty Chat panel state */
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            <MessageSquare size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Your Conversations Window</h2>
            <p style={{ maxWidth: '400px', fontSize: '0.925rem', color: 'var(--text-muted)' }}>
              Select a conversation from the sidebar or click "Contact Seller" on a provider's service card to start discussing a job.
            </p>
            {onBack && (
              <button 
                onClick={onBack}
                className="btn btn-secondary" 
                style={{ marginTop: '1.5rem' }}
              >
                Back to Services
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
