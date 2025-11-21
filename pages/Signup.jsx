import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Styles/Auth.css';

export default function Signup({ onSwitchToLogin, navigation }) {

  const [email, setEmail] = useState('');
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
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="confirm password"
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
