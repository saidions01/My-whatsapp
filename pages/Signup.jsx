import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Styles/Auth.css';

export default function Signup({ onSwitchToLogin, navigation }) {
  const [name, setName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!name || !pseudo || !email || !phone) {
      return setError('Please fill out all fields');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);

      console.log('Signup successful');

      // Return to login screen inside AuthenticationApp
      onSwitchToLogin();

      // OPTIONAL: Navigate back to Auth stack
      navigation.navigate("Auth");

    } catch (error) {
      setError('Failed to create an account: ' + error.message);
    }

    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      <div className="auth-overlay">
        <div className="auth-card">
          <h1 className="auth-title">Authentication</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="input-group">
             
              <input
                type="text"
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
             
              <input
                type="text"
                id="pseudo"
                placeholder="Enter your pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
             
              <input
                type="tel"
                id="phone"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="auth-button"
            >
              {loading ? 'SIGNING UP...' : 'SIGN UP'}
            </button>
          </form>

          <button
            onClick={onSwitchToLogin}
            className="switch-auth-link"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}