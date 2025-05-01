import React, { useState } from 'react';
import './Auth.css';

interface AuthProps {
  onLogin: (token: string) => void;
}

type AuthScreen = 'login' | 'signup' | 'verify';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [signupToken, setSignupToken] = useState<string>('');
  
  // Development mode flag
  const isDevelopment = process.env.NODE_ENV === 'development';

  const API_URL = 'https://your-api-endpoint.com/api'; // Replace with your actual API endpoint

  const validateForm = (): boolean => {
    setError('');
    
    if (currentScreen === 'verify') {
      if (!verificationToken) {
        setError('Verification token is required');
        return false;
      }
      return true;
    }
    
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }
    
    return true;
  };

  const simulateLogin = () => {
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const mockToken = 'dev-mode-token-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('auth_token', mockToken);
      onLogin(mockToken);
      setLoading(false);
    }, 1000);
  };

  const simulateSignup = () => {
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const mockToken = 'verify-token-' + Math.random().toString(36).substring(2, 15);
      setSignupToken(mockToken);
      setCurrentScreen('verify');
      setLoading(false);
    }, 1000);
  };

  const simulateVerification = () => {
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const authToken = 'auth-token-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('auth_token', authToken);
      onLogin(authToken);
      setLoading(false);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Use simulated methods in development mode
    if (isDevelopment) {
      if (currentScreen === 'login') {
        simulateLogin();
      } else if (currentScreen === 'signup') {
        simulateSignup();
      } else if (currentScreen === 'verify') {
        simulateVerification();
      }
      return;
    }
    
    setLoading(true);
    
    try {
      let endpoint = '';
      let body = {};
      
      if (currentScreen === 'login') {
        endpoint = `${API_URL}/login`;
        body = { email, password };
      } else if (currentScreen === 'signup') {
        endpoint = `${API_URL}/signup`;
        body = { email, password };
      } else if (currentScreen === 'verify') {
        endpoint = `${API_URL}/verify`;
        body = { token: verificationToken };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      if (currentScreen === 'signup' && data.verificationToken) {
        setSignupToken(data.verificationToken);
        setCurrentScreen('verify');
      } else if (data.token) {
        localStorage.setItem('auth_token', data.token);
        onLogin(data.token);
      } else {
        setError('No authentication token received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    if (currentScreen === 'login') {
      simulateLogin();
    } else if (currentScreen === 'signup') {
      simulateSignup();
    } else if (currentScreen === 'verify') {
      simulateVerification();
    }
  };

  const handleScreenChange = (screen: AuthScreen) => {
    setError('');
    setCurrentScreen(screen);
  };

  const renderLoginForm = () => (
    <>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading}
          required
        />
      </div>
      
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Processing...' : 'Login'}
      </button>
      
      <div className="auth-switch">
        <button 
          onClick={() => handleScreenChange('signup')}
          className="switch-button"
          disabled={loading}
          type="button"
        >
          Need an account? Sign Up
        </button>
      </div>
    </>
  );

  const renderSignupForm = () => (
    <>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading}
          required
        />
      </div>
      
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Processing...' : 'Sign Up'}
      </button>
      
      <div className="auth-switch">
        <button 
          onClick={() => handleScreenChange('login')}
          className="switch-button"
          disabled={loading}
          type="button"
        >
          Already have an account? Login
        </button>
      </div>
    </>
  );

  const renderVerificationForm = () => (
    <>
      <p className="verification-message">
        We've sent a verification token to your email. Please enter it below to complete your signup.
      </p>
      
      {signupToken && isDevelopment && (
        <div className="dev-token-display">
          <p className="dev-token-label">Development Token (for testing):</p>
          <p className="dev-token-value">{signupToken}</p>
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="verificationToken">Verification Token</label>
        <input
          id="verificationToken"
          type="text"
          value={verificationToken}
          onChange={(e) => setVerificationToken(e.target.value)}
          placeholder="Enter verification token"
          disabled={loading}
          required
        />
      </div>
      
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Account'}
      </button>
      
      <div className="auth-switch">
        <button 
          onClick={() => handleScreenChange('login')}
          className="switch-button"
          disabled={loading}
          type="button"
        >
          Back to Login
        </button>
      </div>
    </>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>
          {currentScreen === 'login' && 'Login'}
          {currentScreen === 'signup' && 'Sign Up'}
          {currentScreen === 'verify' && 'Verify Account'}
        </h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {currentScreen === 'login' && renderLoginForm()}
          {currentScreen === 'signup' && renderSignupForm()}
          {currentScreen === 'verify' && renderVerificationForm()}
        </form>
        
        {isDevelopment && (
          <div className="dev-tools">
            <p className="dev-mode-label">Development Mode</p>
            <button 
              onClick={handleDevBypass}
              className="dev-login-button"
              disabled={loading}
            >
              {currentScreen === 'login' && 'Bypass Login'}
              {currentScreen === 'signup' && 'Bypass Signup'}
              {currentScreen === 'verify' && 'Bypass Verification'}
              {' '}(Dev Only)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;