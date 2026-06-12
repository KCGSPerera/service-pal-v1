import React, { useState } from 'react';

export default function SubscriptionPlanTab({ subscriptionPlans = [], fetchSubscriptionPlans, showToast, token }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_type: 'Basic',
    price: 0,
    billing_cycle: 'Monthly',
    featured_ads_limit: 0,
    ad_post_limit: 0,
    description: ''
  });

  const openAddForm = () => {
    setEditingPlan(null);
    setFormData({
      plan_name: '', plan_type: 'Basic', price: 0, billing_cycle: 'Monthly',
      featured_ads_limit: 0, ad_post_limit: 0, description: ''
    });
    setShowForm(true);
  };

  const openEditForm = (plan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      featured_ads_limit: plan.featured_ads_limit,
      ad_post_limit: plan.ad_post_limit,
      description: plan.description || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPlan ? `/api/subscription-plans/${editingPlan._id}` : '/api/subscription-plans';
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        showToast(editingPlan ? 'Plan updated successfully' : 'Plan created successfully', 'success');
        fetchSubscriptionPlans();
        setShowForm(false);
      } else {
        showToast(data.message || (editingPlan ? 'Update failed' : 'Creation failed'), 'error');
      }
    } catch (err) {
      showToast(editingPlan ? 'Error updating plan' : 'Error creating plan', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      const response = await fetch(`/api/subscription-plans/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        showToast('Plan deleted', 'success');
        fetchSubscriptionPlans();
      } else {
        const data = await response.json();
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) { showToast('Error deleting plan', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2>Subscription Plans</h2>
        <button className="btn btn-primary" onClick={openAddForm}>+ Add Plan</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Price</th>
              <th>Cycle</th>
              <th>Limits (Ads/Featured)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptionPlans.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No plans found.</td></tr>
            ) : (
              subscriptionPlans.map(plan => (
                <tr key={plan._id}>
                  <td>{plan.plan_name}</td>
                  <td>{plan.plan_type}</td>
                  <td>LKR {plan.price}</td>
                  <td>{plan.billing_cycle}</td>
                  <td>{plan.ad_post_limit} / {plan.featured_ads_limit}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openEditForm(plan)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(plan._id)}>Delete</button>
                    </div>
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
            <h2>{editingPlan ? 'Edit Subscription Plan' : 'Add Subscription Plan'}</h2>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Plan Name</label>
                <input type="text" className="form-input" required value={formData.plan_name} onChange={(e) => setFormData({...formData, plan_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="number" className="form-input" required min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="form-input" value={formData.plan_type} onChange={(e) => setFormData({...formData, plan_type: e.target.value})}>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div className="form-group">
                <label>Billing Cycle</label>
                <select className="form-input" value={formData.billing_cycle} onChange={(e) => setFormData({...formData, billing_cycle: e.target.value})}>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ad Post Limit</label>
                <input type="number" className="form-input" required min="0" value={formData.ad_post_limit} onChange={(e) => setFormData({...formData, ad_post_limit: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Featured Ads Limit</label>
                <input type="number" className="form-input" required min="0" value={formData.featured_ads_limit} onChange={(e) => setFormData({...formData, featured_ads_limit: Number(e.target.value)})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingPlan ? 'Update Plan' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
