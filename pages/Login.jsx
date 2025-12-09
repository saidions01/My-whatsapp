import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Styles/Auth.css';

export default function Login({ onSwitchToSignup, navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validation
    if (!email.trim() || !password.trim()) {
      return setError('Please enter both email and password');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Please enter a valid email address');
    }

    try {
      setError('');
      setLoading(true);
      
      await login(email.trim(), password);
      
      console.log('Login successful');
      
      // Navigate to Home screen
      if (navigation) {
        navigation.navigate('Home');
      }
      
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      
      let errorMessage = 'Failed to login. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please sign up first.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password login is not enabled. Please contact support.';
          break;
        default:
          errorMessage = error.message || 'An unknown error occurred. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = () => {
    // You can implement forgot password functionality here
    alert('Forgot password functionality to be implemented');
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleDemoLogin = () => {
    // Pre-fill demo credentials (remove in production)
    setEmail('demo@example.com');
    setPassword('demo123');
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      <div className="auth-overlay">
        <div className="auth-card">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account</p>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input password-input"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleShowPassword}
                  disabled={loading}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="auth-options">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="forgot-password-link"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-button login-button"
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  SIGNING IN...
                </>
              ) : (
                'SIGN IN'
              )}
            </button>

            {/* Demo login button (remove in production) */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="demo-button"
              disabled={loading}
            >
              Use Demo Account
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div className="auth-footer">
            <p>Don't have an account?</p>
            <button
              onClick={onSwitchToSignup}
              className="switch-auth-link"
              disabled={loading}
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}