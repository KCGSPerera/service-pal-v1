'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Edit3, Trash2, Calendar, Star, Loader, AlertTriangle,
  MessageCircle, Send, X, Eye
} from 'lucide-react';
import ReviewModal from './ReviewModal';

export default function MyReviews({ token, showToast, userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Per-review reply state: { [reviewId]: { open, text, submitting } }
  const [replyState, setReplyState] = useState({});

  // Lightbox
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  const fetchMyReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews/my-reviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setReviews(data.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load your reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  /* ---------- delete review ---------- */
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Review deleted', 'success');
        setReviews((prev) => prev.filter((r) => r._id !== id));
      } else {
        showToast(data.message || 'Deletion failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting review', 'error');
    }
  };

  /* ---------- reply helpers ---------- */
  const getRS = (id) => replyState[id] || { open: false, text: '', submitting: false };
  const setRS = (id, patch) =>
    setReplyState((prev) => ({ ...prev, [id]: { ...getRS(id), ...patch } }));

  const handleReplySubmit = async (reviewId) => {
    const rs = getRS(reviewId);
    if (!rs.text.trim()) {
      showToast('Reply cannot be empty', 'error');
      return;
    }
    setRS(reviewId, { submitting: true });
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: rs.text.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, replies: data.replies } : r))
        );
        setRS(reviewId, { text: '', open: false });
        showToast('Reply posted!', 'success');
      } else {
        showToast(data.message || 'Failed to post reply', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error', 'error');
    } finally {
      setRS(reviewId, { submitting: false });
    }
  };

  const handleDeleteReply = async (reviewId, replyId) => {
    if (!window.confirm('Delete your reply?')) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, replies: data.replies } : r))
        );
        showToast('Reply deleted', 'success');
      } else {
        showToast(data.message || 'Failed to delete reply', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error', 'error');
    }
  };

  /* ---------- display helpers ---------- */
  const renderStars = (rating) => (
    <span style={{ display: 'flex', gap: '0.1rem' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= Math.floor(rating || 0) ? 'var(--accent-primary)' : 'none'}
          color={i <= Math.floor(rating || 0) ? 'var(--accent-primary)' : '#4b5563'}
        />
      ))}
    </span>
  );

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });

  const getStatusBadge = (status) => {
    const map = {
      Pending: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', border: 'rgba(234,179,8,0.3)', label: 'Pending' },
      Approved: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)', label: 'Live' },
      Rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)', label: 'Rejected' },
      Hidden: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)', label: 'Hidden' },
    };
    const s = map[status];
    if (!s) return null;
    return (
      <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700' }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Your Reviews &amp; Feedback
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Manage all reviews you have submitted, and reply to provider responses.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader className="animate-spin" size={32} color="var(--accent-primary)" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertTriangle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          No reviews submitted yet. Reviews can be written for completed bookings in your Bookings tab.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reviews.map((rev) => {
            const provider = rev.provider_id;
            if (!provider) return null;
            const rs = getRS(rev._id);
            const canEdit = rev.review_status === 'Pending' || rev.review_status === 'Approved';

            return (
              <div key={rev._id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={provider.profile_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23aaa'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`}
                      alt="Provider"
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-glass)' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Reviewed: {provider.first_name} {provider.last_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Calendar size={11} /> {fmtDate(rev.created_at || rev.createdAt)}
                        </span>
                        {getStatusBadge(rev.review_status)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    {renderStars(rev.rating_value)}
                    {rev.booking_id?.service_ad_id && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {rev.booking_id.service_ad_id.ad_title}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Review text ── */}
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {rev.review_title}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {rev.review_description}
                  </p>
                </div>

                {/* ── Images ── */}
                {rev.review_images?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {rev.review_images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveLightboxImg(img)}
                        style={{ width: '52px', height: '52px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-glass-light)' }}
                        className="hover-opacity"
                      >
                        <img src={img} alt="Attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Replies thread ── */}
                {rev.replies?.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Replies
                    </span>
                    {rev.replies.map((reply) => {
                      const isMyReply = reply.user_id?.toString() === userId || reply.user_id === userId;
                      return (
                        <div
                          key={reply._id}
                          style={{
                            background: reply.role === 'provider'
                              ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${reply.role === 'provider' ? 'rgba(99,102,241,0.2)' : 'var(--border-glass-light)'}`,
                            borderRadius: '8px',
                            padding: '0.6rem 0.8rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                              <span style={{ fontWeight: '700', fontSize: '0.82rem', color: reply.role === 'provider' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                {reply.display_name}
                              </span>
                              <span style={{ fontSize: '0.68rem', background: reply.role === 'provider' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)', color: reply.role === 'provider' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '0.05rem 0.4rem', borderRadius: '10px', fontWeight: '600' }}>
                                {reply.role === 'provider' ? 'Provider' : 'You'}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                · {fmtDate(reply.createdAt)}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                              {reply.text}
                            </p>
                          </div>
                          {isMyReply && (
                            <button
                              onClick={() => handleDeleteReply(rev._id, reply._id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.1rem', flexShrink: 0 }}
                              title="Delete your reply"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Reply input ── */}
                <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem' }}>
                  {!rs.open ? (
                    <button
                      onClick={() => setRS(rev._id, { open: true })}
                      style={{ background: 'none', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '0.3rem 0.65rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <MessageCircle size={13} /> Reply
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <textarea
                        autoFocus
                        rows={2}
                        value={rs.text}
                        onChange={(e) => setRS(rev._id, { text: e.target.value })}
                        placeholder={rev.replies?.some(r => r.role === 'provider') ? "Reply to the provider's response..." : "Add a follow-up comment..."}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--bg-glass-input)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => setRS(rev._id, { open: false, text: '' })}
                          disabled={rs.submitting}
                          style={{ background: 'none', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '0.28rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(rev._id)}
                          disabled={rs.submitting || !rs.text.trim()}
                          className="btn btn-primary"
                          style={{ padding: '0.28rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {rs.submitting ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Edit / Delete actions ── */}
                {canEdit && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      onClick={() => { setSelectedReview(rev); setIsEditOpen(true); }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                      className="hover-opacity"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rev._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                      className="hover-opacity"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Review Modal */}
      <ReviewModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedReview(null); }}
        reviewToEdit={selectedReview}
        token={token}
        showToast={showToast}
        onSubmitSuccess={fetchMyReviews}
      />

      {/* Lightbox */}
      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem', backdropFilter: 'blur(6px)' }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button
              onClick={() => setActiveLightboxImg(null)}
              style={{ position: 'absolute', top: '-2.5rem', right: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}
            >
              <X size={18} /> Close
            </button>
            <img src={activeLightboxImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '6px' }} />
          </div>
        </div>
      )}
    </div>
  );
}
