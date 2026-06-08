import React from 'react';

export default function ComplaintTab({ complaints = [], fetchComplaints, showToast, token }) {
  const handleAction = async (id, action) => {
    try {
      const response = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, resolution_note: 'Resolved by admin' })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(`Complaint ${action}d`, 'success');
        fetchComplaints();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('Error updating complaint', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Complaint Management</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Target</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No complaints found.</td></tr>
            ) : (
              complaints.map(comp => (
                <tr key={comp._id}>
                  <td>{comp.reported_by?.email}</td>
                  <td>{comp.target_user_id?.email}</td>
                  <td>{comp.complaint_type}</td>
                  <td><span className={`badge badge-${comp.complaint_status.replace(' ', '-').toLowerCase()}`}>{comp.complaint_status}</span></td>
                  <td>{new Date(comp.createdAt).toLocaleDateString()}</td>
                  <td>
                    {comp.complaint_status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAction(comp._id, 'resolve')}>Resolve</button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAction(comp._id, 'reject')}>Reject</button>
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
