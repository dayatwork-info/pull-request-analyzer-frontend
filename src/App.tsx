import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth/Auth';
import { isAuthenticated, getToken, clearSession, bypassLogin, fetchGitHubUser } from './services/authService';

function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [githubToken, setGithubToken] = useState<string>('');
  const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
  const [githubUser, setGithubUser] = useState<{login: string; avatar_url: string; name?: string} | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [userError, setUserError] = useState<string | null>(null);
  
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
    clearSession(); // Uses our new function to clear all session data
    setAuthenticated(false);
    setGithubToken('');
    setGithubUser(null);
    setUserError(null);
  };

  const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = event.target.value;
    setGithubToken(newToken);
    
    // Clear user data when token is emptied
    if (!newToken) {
      setGithubUser(null);
      setUserError(null);
      return;
    }
    
    // Fetch GitHub user data when token is pasted
    setIsLoadingUser(true);
    setUserError(null);
    
    fetchGitHubUser(newToken)
      .then(userData => {
        setGithubUser(userData);
        setUserError(null);
      })
      .catch(error => {
        setGithubUser(null);
        setUserError('Failed to fetch GitHub user data');
        console.error('Error fetching GitHub user:', error);
      })
      .finally(() => {
        setIsLoadingUser(false);
      });
  };

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };
  
  const handleDirectDevLogin = async () => {
    await bypassLogin();
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
              
              {isLoadingUser && (
                <div className="loading-indicator">
                  Loading GitHub user data...
                </div>
              )}
              
              {userError && (
                <div className="error-message">
                  {userError}
                </div>
              )}
              
              {githubUser && (
                <div className="github-user-profile">
                  <div className="user-avatar">
                    <img src={githubUser.avatar_url} alt={`${githubUser.login}'s avatar`} />
                  </div>
                  <div className="user-info">
                    <h3>{githubUser.name || githubUser.login}</h3>
                    <p>@{githubUser.login}</p>
                  </div>
                </div>
              )}
              
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
