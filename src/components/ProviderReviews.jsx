'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, Calendar, Loader, MessageCircle, Trash2,
  ChevronDown, ChevronUp, Send, Eye, X, BarChart2, Award
} from 'lucide-react';

export default function ProviderReviews({ providerId, token, showToast }) {
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  // Per-review reply state: { [reviewId]: { open, text, submitting } }
  const [replyState, setReplyState] = useState({});

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/provider/${providerId}/summary`);
      const data = await res.json();
      if (res.ok && data.success) setSummary(data.data);
    } catch (err) {
      console.error(err);
    }
  }, [providerId]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews/provider/${providerId}`);
      const data = await res.json();
      if (res.ok && data.success) setReviews(data.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    if (providerId) {
      fetchSummary();
      fetchReviews();
    }
  }, [providerId, fetchSummary, fetchReviews]);

  /* ---------- helpers ---------- */
  const renderStars = (rating, size = 14) => {
    const floor = Math.floor(rating || 0);
    return (
      <span style={{ display: 'flex', gap: '0.1rem' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            fill={i <= floor ? 'var(--accent-primary)' : 'none'}
            color={i <= floor ? 'var(--accent-primary)' : '#4b5563'}
          />
        ))}
      </span>
    );
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

  const pct = (count) =>
    summary.totalReviews === 0 ? 0 : Math.round((count / summary.totalReviews) * 100);

  /* ---------- reply helpers ---------- */
  const getReplyState = (id) =>
    replyState[id] || { open: false, text: '', submitting: false };

  const setRS = (id, patch) =>
    setReplyState((prev) => ({ ...prev, [id]: { ...getReplyState(id), ...patch } }));

  const handleReplySubmit = async (reviewId) => {
    const rs = getReplyState(reviewId);
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
        // Update the review locally with the new replies array
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId ? { ...r, replies: data.replies } : r
          )
        );
        setRS(reviewId, { text: '', open: false });
        showToast('Reply posted successfully!', 'success');
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
    if (!window.confirm('Delete this reply?')) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId ? { ...r, replies: data.replies } : r
          )
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

  const hasProviderReplied = (rev) =>
    rev.replies && rev.replies.some((r) => r.role === 'provider' && r.user_id === providerId);

  /* ---------- star colour per rating ---------- */
  const ratingColor = (r) => {
    if (r >= 4.5) return '#22c55e';
    if (r >= 3.5) return '#84cc16';
    if (r >= 2.5) return '#eab308';
    if (r >= 1.5) return '#f97316';
    return '#ef4444';
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
      {/* ─── PAGE HEADER ─── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={22} color="var(--accent-primary)" />
          Ratings &amp; Reviews
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          View all customer feedback and respond to reviews to build trust.
        </p>
      </div>

      {/* ─── SUMMARY PANEL ─── */}
      <div
        className="glass-panel"
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
          gap: '2rem',
          padding: '1.5rem',
          alignItems: 'center',
          marginBottom: '1.75rem',
        }}
      >
        {/* Average score */}
        <div
          style={{
            textAlign: 'center',
            borderRight: '1px solid var(--border-glass-light)',
            paddingRight: '2rem',
          }}
        >
          <div
            style={{
              fontSize: '3.5rem',
              fontWeight: '900',
              lineHeight: 1,
              color: ratingColor(summary.averageRating),
              marginBottom: '0.35rem',
            }}
          >
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '—'}
          </div>
          <div style={{ marginBottom: '0.4rem' }}>{renderStars(summary.averageRating, 16)}</div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Distribution bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution[star] || 0;
            const p = pct(count);
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
                <span style={{ width: '38px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right', flexShrink: 0 }}>
                  {star} ★
                </span>
                <div style={{ flex: 1, height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${p}%`,
                      height: '100%',
                      background: ratingColor(star),
                      borderRadius: '4px',
                      transition: 'width 0.6s ease-out',
                    }}
                  />
                </div>
                <span style={{ width: '44px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {count} ({p}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── REVIEWS LIST ─── */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
        All Reviews ({reviews.length})
      </h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader className="animate-spin" size={28} color="var(--accent-primary)" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Award size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          No reviews yet. Complete bookings to receive customer feedback.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((rev) => {
            const reviewer = rev.user_id;
            if (!reviewer) return null;
            const rs = getReplyState(rev._id);
            const myReply = rev.replies?.find((r) => r.role === 'provider');

            return (
              <div
                key={rev._id}
                className="glass-panel"
                style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
              >
                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={reviewer.profile_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23aaa'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`}
                      alt="Reviewer"
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-glass)' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {reviewer.first_name} {reviewer.last_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={11} /> {fmtDate(rev.created_at || rev.createdAt)}
                        {rev.booking_id?.service_ad_id && (
                          <> &nbsp;·&nbsp; <span style={{ color: 'var(--accent-secondary)' }}>{rev.booking_id.service_ad_id.ad_title}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    {renderStars(rev.rating_value, 15)}
                    <span style={{ fontSize: '0.75rem', color: ratingColor(rev.rating_value), fontWeight: '700' }}>
                      {rev.rating_value}.0 / 5
                    </span>
                  </div>
                </div>

                {/* ── Review body ── */}
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {rev.review_title}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                    {rev.review_description}
                  </p>
                </div>

                {/* ── Review images ── */}
                {rev.review_images?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {rev.review_images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveLightboxImg(img)}
                        style={{ width: '52px', height: '52px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-glass-light)' }}
                        className="hover-opacity"
                      >
                        <img src={img} alt="Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Replies thread ── */}
                {rev.replies?.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Replies
                    </span>
                    {rev.replies.map((reply) => (
                      <div
                        key={reply._id}
                        style={{
                          background: reply.role === 'provider'
                            ? 'rgba(99,102,241,0.08)'
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${reply.role === 'provider' ? 'rgba(99,102,241,0.2)' : 'var(--border-glass-light)'}`,
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
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
                            <span style={{ fontSize: '0.7rem', background: reply.role === 'provider' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)', color: reply.role === 'provider' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '0.05rem 0.4rem', borderRadius: '10px', fontWeight: '600' }}>
                              {reply.role === 'provider' ? 'Provider' : 'Customer'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              · {fmtDate(reply.createdAt)}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                            {reply.text}
                          </p>
                        </div>
                        {/* Provider can delete their own replies */}
                        {reply.role === 'provider' && (
                          <button
                            onClick={() => handleDeleteReply(rev._id, reply._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.1rem', flexShrink: 0 }}
                            title="Delete reply"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Reply action ── */}
                <div style={{ borderTop: '1px solid var(--border-glass-light)', paddingTop: '0.75rem' }}>
                  {!rs.open ? (
                    <button
                      onClick={() => setRS(rev._id, { open: true })}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        color: 'var(--accent-primary)',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <MessageCircle size={14} />
                      {myReply ? 'Add another reply' : 'Reply to this review'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <textarea
                        autoFocus
                        rows={3}
                        value={rs.text}
                        onChange={(e) => setRS(rev._id, { text: e.target.value })}
                        placeholder="Write your professional response..."
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          borderRadius: '6px',
                          background: 'var(--bg-glass-input)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          fontSize: '0.86rem',
                          resize: 'none',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => setRS(rev._id, { open: false, text: '' })}
                          disabled={rs.submitting}
                          style={{ background: 'none', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '0.3rem 0.65rem', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(rev._id)}
                          disabled={rs.submitting || !rs.text.trim()}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {rs.submitting ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Lightbox ─── */}
      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem', backdropFilter: 'blur(6px)' }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button
              onClick={() => setActiveLightboxImg(null)}
              style={{ position: 'absolute', top: '-2.5rem', right: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', fontWeight: '600' }}
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
