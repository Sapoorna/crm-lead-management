import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import LeadForm from './components/LeadForm';
import LeadDetail from './components/LeadDetail';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/leads" element={
              <PrivateRoute>
                <LeadList />
              </PrivateRoute>
            } />
            <Route path="/leads/new" element={
              <PrivateRoute>
                <LeadForm />
              </PrivateRoute>
            } />
            <Route path="/leads/:id/edit" element={
              <PrivateRoute>
                <LeadForm />
              </PrivateRoute>
            } />
            <Route path="/leads/:id" element={
              <PrivateRoute>
                <LeadDetail />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;