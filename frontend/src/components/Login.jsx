import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <h2>✨ CRM Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: '#f56565', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit">Login →</button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#a0aec0', textAlign: 'center' }}>
          Test: admin@example.com / password123
        </p>
      </div>
    </div>
  );
}

export default Login;