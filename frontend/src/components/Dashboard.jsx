import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CRM.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    totalDealValue: 0,
    wonDealValue: 0
  });
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        <h1>Dashboard</h1>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Leads</h3>
            <div className="value">{stats.totalLeads}</div>
          </div>
          <div className="stat-card">
            <h3>New Leads</h3>
            <div className="value">{stats.newLeads}</div>
          </div>
          <div className="stat-card">
            <h3>Qualified Leads</h3>
            <div className="value">{stats.qualifiedLeads}</div>
          </div>
          <div className="stat-card">
            <h3>Won Leads</h3>
            <div className="value">{stats.wonLeads}</div>
          </div>
          <div className="stat-card">
            <h3>Lost Leads</h3>
            <div className="value">{stats.lostLeads}</div>
          </div>
          <div className="stat-card">
            <h3>Total Deal Value</h3>
            <div className="value">${stats.totalDealValue.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>Won Deal Value</h3>
            <div className="value">${stats.wonDealValue.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;