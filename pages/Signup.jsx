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

    // Validation
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!name.trim() || !pseudo.trim() || !email.trim() || !phone.trim()) {
      return setError('Please fill out all fields');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    // Email validation - FIXED REGEX
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Please enter a valid email address');
    }

    // Phone validation (optional)
    const phoneRegex = /^[0-9\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return setError('Please enter a valid phone number');
    }

    try {
      setError('');
      setLoading(true);
      
      // Call signup with all user data
      await signup(email, password, {
        name: name.trim(),
        pseudo: pseudo.trim(),
        phone: phone.trim(),
        email: email.trim(),
        profileImage: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      });

      console.log('Signup successful!');
      
      // Show success message
      alert('Account created successfully! You can now login.');
      
      // Switch to login screen inside AuthenticationApp
      if (onSwitchToLogin) {
        onSwitchToLogin();
      }
      
      // OPTIONAL: Navigate back to Auth stack
      if (navigation) {
        navigation.navigate('Login');
      }

    } catch (error) {
      console.error('Signup error:', error.code, error.message);
      
      let errorMessage = 'Failed to create an account. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or login.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        default:
          errorMessage = error.message || 'An unknown error occurred. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      <div className="auth-overlay">
        <div className="auth-card">
          <h1 className="auth-title">Create Account</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="name" className="input-label">Full Name</label>
              <input
                type="text"
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="pseudo" className="input-label">Username</label>
              <input
                type="text"
                id="pseudo"
                placeholder="Choose a username"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                required
                className="auth-input"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">Email</label>
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
              <label htmlFor="phone" className="input-label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="auth-input"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="auth-button"
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <button
            onClick={onSwitchToLogin}
            className="switch-auth-link"
            disabled={loading}
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}