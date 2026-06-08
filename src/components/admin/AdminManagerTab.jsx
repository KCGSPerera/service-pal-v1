import React, { useState } from 'react';

export default function AdminManagerTab({ adminsList = [], fetchAdmins, showToast, currentUser, token }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Admin created successfully', 'success');
        fetchAdmins();
        setShowForm(false);
      } else {
        showToast(data.message || 'Creation failed', 'error');
      }
    } catch (err) {
      showToast('Error creating admin', 'error');
    }
  };

  const handleAction = async (id, action) => {
    if (action === 'deactivate' && !window.confirm('Are you sure you want to block this admin?')) return;
    try {
      const response = await fetch(`/api/admins/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        showToast(`Admin ${action}d`, 'success');
        fetchAdmins();
      } else {
        const data = await response.json();
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) { showToast('Error updating admin', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2>Admin Management</h2>
        {currentUser?.role === 'super_admin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Admin</button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminsList.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No admins found.</td></tr>
            ) : (
              adminsList.map(admin => (
                <tr key={admin._id}>
                  <td>{admin.first_name} {admin.last_name}</td>
                  <td>{admin.email}</td>
                  <td><span className={`badge ${admin.role === 'super_admin' ? 'badge-rejected' : 'badge-pending'}`}>{admin.role}</span></td>
                  <td><span className={`badge ${admin.status === 'active' ? 'badge-approved' : 'badge-blocked'}`}>{admin.status}</span></td>
                  <td>{admin.created_by?.email || 'System'}</td>
                  <td>
                    {admin.role !== 'super_admin' && admin._id !== currentUser?.userId && (
                      <button 
                        className={`btn ${admin.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                        onClick={() => handleAction(admin._id, admin.status === 'active' ? 'deactivate' : 'activate')}
                      >
                        {admin.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Administrator</h2>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" className="form-input" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" className="form-input" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-input" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-input" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
