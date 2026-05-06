import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CRM.css';

function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: '',
    salesperson: '',
    status: 'New',
    deal_value: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await api.get(`/leads/${id}`);
      const lead = response.data;
      setFormData({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        salesperson: lead.salesperson,
        status: lead.status,
        deal_value: lead.deal_value
      });
    } catch (error) {
      console.error('Error fetching lead:', error);
      setError('Failed to load lead');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await api.put(`/leads/${id}`, formData);
      } else {
        await api.post('/leads', formData);
      }
      navigate('/leads');
    } catch (error) {
      console.error('Error saving lead:', error);
      setError(error.response?.data?.error || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="nav">
        <a href="/">Dashboard</a>
        <a href="/leads">Leads</a>
        <a href="/leads/new">New Lead</a>
        <button onClick={handleLogout}>Logout ({user?.name})</button>
      </div>

      <div className="container">
        <h1>{isEditing ? 'Edit Lead' : 'Create New Lead'}</h1>
        
        {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
          <div className="form-group">
            <label>Lead Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Lead Source *</label>
            <select name="source" value={formData.source} onChange={handleChange} required>
              <option value="">Select Source</option>
              <option value="Website">Website</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Referral">Referral</option>
              <option value="Cold Email">Cold Email</option>
              <option value="Event">Event</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Assigned Salesperson *</label>
            <input
              type="text"
              name="salesperson"
              value={formData.salesperson}
              onChange={handleChange}
              required
              placeholder="e.g., John Smith"
            />
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select name="status" value={formData.status} onChange={handleChange} required>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div className="form-group">
            <label>Estimated Deal Value ($)</label>
            <input
              type="number"
              name="deal_value"
              value={formData.deal_value}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Lead' : 'Create Lead')}
            </button>
            <button type="button" onClick={() => navigate('/leads')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeadForm;