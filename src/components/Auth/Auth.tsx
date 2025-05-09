import React, { useState } from 'react';
import './Auth.css';
import { 
  login as authLogin, 
  signup as authSignup
} from '../../services/authService';

interface AuthProps {
  onLogin: (authToken: string) => void;
}

type AuthScreen = 'login' | 'signup';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const validateForm = (): boolean => {
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (currentScreen === 'login') {
        const data = await authLogin(email, password);
        onLogin(data.accessToken);
      } else if (currentScreen === 'signup') {
        const data = await authSignup(email, password);
        if (data.accessToken) {
          onLogin(data.accessToken);
        } else {
          setError('Signup failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 
               typeof err === 'object' && err && 'message' in err ? 
               (err as { message: string }).message : 'An error occurred');
    } finally {
      setLoading(false);
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>
          {currentScreen === 'login' && 'Login'}
          {currentScreen === 'signup' && 'Sign Up'}
        </h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {currentScreen === 'login' && renderLoginForm()}
          {currentScreen === 'signup' && renderSignupForm()}
        </form>
      </div>
    </div>
  );
};

export default Auth;