import React, { useState, useEffect } from 'react';
import { MessageSquare, ShieldCheck, Mail, Send, Award, Users, AlertTriangle, Loader } from 'lucide-react';

export default function ChatMonitoringTab({ token, stats, showToast }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveConversations();
  }, []);

  const fetchActiveConversations = async () => {
    try {
      setLoading(true);
      // Fetch conversation records (admins can access chats analytics)
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // We can display list of reported messages or just general chat statistics
        // For general audit, let's load a mockup or actual distinct message summaries
        // Let's call general chats endpoint to show active communication logs
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const localStats = stats || {
    totalChatMessages: 0,
    activeConversations: 0,
    unreadCount: 0
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Overview Intro card */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.1))', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <ShieldCheck size={48} color="var(--accent-primary)" />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>System-Wide Chat Monitoring</h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
            ServicePal monitors active conversation counts and message volumes to ensure compliance with our terms of service, protect user safety, and prevent off-platform hiring.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Total messages */}
        <div className="glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <span className="stat-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Send size={14} color="var(--accent-primary)" /> Total Chat Messages
          </span>
          <span className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: '800', display: 'block', margin: '0.25rem 0' }}>
            {localStats.totalChatMessages || 0}
          </span>
          <span className="stat-card-sub" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Total sent system-wide</span>
        </div>

        {/* Active chats */}
        <div className="glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <span className="stat-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Users size={14} color="var(--accent-secondary)" /> Active Conversations
          </span>
          <span className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: '800', display: 'block', margin: '0.25rem 0' }}>
            {localStats.activeConversations || 0}
          </span>
          <span className="stat-card-sub" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Distinct buyer-provider pairs</span>
        </div>

        {/* Average conversation length */}
        <div className="glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <span className="stat-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <MessageSquare size={14} color="#eab308" /> Messages / Conversation
          </span>
          <span className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: '800', display: 'block', margin: '0.25rem 0' }}>
            {localStats.activeConversations > 0 
              ? (localStats.totalChatMessages / localStats.activeConversations).toFixed(1)
              : '0.0'}
          </span>
          <span className="stat-card-sub" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Average exchange density</span>
        </div>

      </div>

      {/* Safety Compliance Audits details panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} color="#eab308" /> Safety & Abuse Prevention Guidelines
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 1.25rem' }}>
          Our anti-fraud engines flag keywords and contact information exchanges (phone numbers, email addresses, personal banking details) that violate platform guidelines. Users who engage in repeat violations are flagged for review and account restriction.
        </p>

        {/* Guidelines columns */}
        <div className="responsive-split-modal" style={{ gap: '1.5rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass-light)' }}>
            <h5 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Flagged Keywords:</h5>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Direct payment methods (e.g. "Pay directly", "Bank transfer outside")</li>
              <li>Personal contact data (e.g. "Send email", "My Whatsapp number is")</li>
              <li>Terms of service bypassing (e.g. "Avoid commission", "Fiverr alternative")</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass-light)' }}>
            <h5 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Automated Flags Actions:</h5>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Inject warning banner: "Never pay off-platform to protect your funds"</li>
              <li>Block extremely high-risk spam links automatically</li>
              <li>Report anomalous message frequencies to security logs</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
