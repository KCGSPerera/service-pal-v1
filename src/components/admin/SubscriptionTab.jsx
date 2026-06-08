import React, { useState } from 'react';

export default function SubscriptionTab({ subscriptions = [], fetchSubscriptions, showToast, token }) {
  const handleAction = async (id, action) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, rejection_reason: action === 'reject' ? 'Not eligible' : undefined })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(`Subscription ${action}d`, 'success');
        fetchSubscriptions();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('Error updating subscription', 'error');
    }
  };

  const [filterStatus, setFilterStatus] = useState('All');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (showPendingOnly && sub.subscription_status !== 'Pending Approval') return false;
    if (filterStatus === 'Inactive') {
      return ['Expired', 'Suspended', 'Cancelled', 'Rejected'].includes(sub.subscription_status);
    }
    if (filterStatus !== 'All' && sub.subscription_status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Subscription Approvals</h2>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input 
              type="checkbox" 
              checked={showPendingOnly}
              onChange={(e) => setShowPendingOnly(e.target.checked)}
            />
            Show Pending Only
          </label>

          <select 
            className="form-input" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            disabled={showPendingOnly}
          >
            <option value="All">All Statuses</option>
            <option value="Pending Approval">Pending</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Requested On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No subscriptions found.</td></tr>
            ) : (
              filteredSubscriptions.map(sub => (
                <tr key={sub._id}>
                  <td>{sub.provider_id?.email}</td>
                  <td>{sub.plan_name} ({sub.plan_type})</td>
                  <td><span className={`badge badge-${sub.subscription_status.replace(' ', '-').toLowerCase()}`}>{sub.subscription_status}</span></td>
                  <td>{sub.payment_status}</td>
                  <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                  <td>
                    {sub.subscription_status === 'Pending Approval' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAction(sub._id, 'approve')}>Approve</button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAction(sub._id, 'reject')}>Reject</button>
                      </div>
                    )}
                    {sub.subscription_status === 'Active' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAction(sub._id, 'suspend')}>Suspend</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
