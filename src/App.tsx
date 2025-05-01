import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth/Auth';
import { isAuthenticated, getToken, removeToken, bypassLogin } from './services/authService';

function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [githubToken, setGithubToken] = useState<string>('');
  const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
  
  // Development mode flag
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Check if user is already authenticated
    setAuthenticated(isAuthenticated());
  }, []);

  const handleLogin = (token: string) => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    removeToken();
    setAuthenticated(false);
    setGithubToken('');
  };

  const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGithubToken(event.target.value);
  };

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };
  
  const handleDirectDevLogin = () => {
    bypassLogin();
    setAuthenticated(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Day at Work - PR Explorer</h1>
        
        {isDevelopment && !authenticated && (
          <div className="quick-dev-login">
            <button 
              onClick={handleDirectDevLogin} 
              className="dev-login-button"
            >
              Quick Dev Login
            </button>
          </div>
        )}
        
        {!authenticated ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <div className="main-content">
            <div className="user-panel">
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
            
            <div className="token-container">
              <label htmlFor="github-token">GitHub Personal Access Token</label>
              <div className="input-group">
                <input
                  id="github-token"
                  type={isTokenVisible ? "text" : "password"}
                  value={githubToken}
                  onChange={handleTokenChange}
                  className="token-input"
                  placeholder="Enter your GitHub PAT"
                  autoComplete="off"
                />
                <button 
                  className="visibility-toggle" 
                  onClick={toggleTokenVisibility}
                  aria-label={isTokenVisible ? "Hide token" : "Show token"}
                  type="button"
                >
                  {isTokenVisible ? "Hide" : "Show"}
                </button>
              </div>
              <p className="token-info">
                Your token is used to understand the PRs created by you.
              </p>
              
              {isDevelopment && (
                <div className="dev-mode-indicator">
                  Development Mode Active
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
