import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CRM.css';

function LeadList() {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({ statuses: [], sources: [], salespeople: [] });
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, statusFilter, sourceFilter, salespersonFilter, searchTerm]);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/filter-options');
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];
    
    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    if (sourceFilter) {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }
    if (salespersonFilter) {
      filtered = filtered.filter(lead => lead.salesperson === salespersonFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(term) ||
        lead.company.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term)
      );
    }
    
    setFilteredLeads(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await api.delete(`/leads/${id}`);
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status.replace(' ', '')}`;
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
        <h1>Lead Management</h1>
        
        <div className="filters">
          <input
            type="text"
            placeholder="Search by name, company, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 2, padding: '0.5rem' }}
          />
          
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {filterOptions.statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            {filterOptions.sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          
          <select value={salespersonFilter} onChange={(e) => setSalespersonFilter(e.target.value)}>
            <option value="">All Salespeople</option>
            {filterOptions.salespeople.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
          
          <button onClick={() => {
            setStatusFilter('');
            setSourceFilter('');
            setSalespersonFilter('');
            setSearchTerm('');
          }}>Clear Filters</button>
        </div>

        <table className="lead-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Source</th>
              <th>Salesperson</th>
              <th>Status</th>
              <th>Deal Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => (
              <tr key={lead._id}>
                <td>{lead.name}</td>
                <td>{lead.company}</td>
                <td>{lead.email}</td>
                <td>{lead.source}</td>
                <td>{lead.salesperson}</td>
                <td>
                  <span className={getStatusClass(lead.status)}>
                    {lead.status}
                  </span>
                </td>
                <td>${lead.deal_value?.toLocaleString() || 0}</td>
                <td>
                  <button onClick={() => navigate(`/leads/${lead._id}`)} style={{ marginRight: '0.5rem' }}>View</button>
                  <button onClick={() => navigate(`/leads/${lead._id}/edit`)} style={{ marginRight: '0.5rem' }}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(lead._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredLeads.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>No leads found.</p>
        )}
      </div>
    </div>
  );
}

export default LeadList;