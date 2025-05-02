import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth/Auth';
import { isAuthenticated, getToken, clearSession, bypassLogin, fetchGitHubUser, fetchGitHubRepositories, fetchGitHubRepoPulls } from './services/authService';
import PullRequestsList, { PullRequest } from './components/PullRequests/PullRequestsList';

// Helper function to determine language color
const getLanguageColor = (language: string): string => {
  const colors: {[key: string]: string} = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C#': '#178600',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'PHP': '#4F5D95',
    'Swift': '#ffac45',
    'Kotlin': '#F18E33'
  };
  
  return colors[language] || '#858585';
};

function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [githubToken, setGithubToken] = useState<string>('');
  const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
  const [githubUser, setGithubUser] = useState<{login: string; avatar_url: string; name?: string} | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);
  const [isLoadingMoreRepos, setIsLoadingMoreRepos] = useState<boolean>(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreRepos, setHasMoreRepos] = useState<boolean>(true);
  
  // Navigation and view state
  const [currentView, setCurrentView] = useState<'repos' | 'pulls'>('repos');
  
  // Pull requests state
  const [selectedRepo, setSelectedRepo] = useState<{owner: string; name: string} | null>(null);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoadingPulls, setIsLoadingPulls] = useState<boolean>(false);
  const [pullsError, setPullsError] = useState<string | null>(null);
  
  // Ref for the repositories container for infinite scrolling
  const reposContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Development mode flag
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Check if user is already authenticated
    setAuthenticated(isAuthenticated());
  }, []);
  
  // Implement scroll detection for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!reposContainerRef.current || isLoadingMoreRepos || !hasMoreRepos) return;
      
      const container = reposContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Load more repositories when the user has scrolled to near the bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMoreRepositories();
      }
    };
    
    const containerElement = reposContainerRef.current;
    if (containerElement && repositories.length > 0) {
      containerElement.addEventListener('scroll', handleScroll);
      
      return () => {
        containerElement.removeEventListener('scroll', handleScroll);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositories, isLoadingMoreRepos, hasMoreRepos]);

  const handleLogin = (token: string) => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    clearSession(); // Uses our new function to clear all session data
    setAuthenticated(false);
    setGithubToken('');
    setGithubUser(null);
    setUserError(null);
    setRepositories([]);
    setReposError(null);
    setSelectedRepo(null);
    setPullRequests([]);
    setPullsError(null);
    setCurrentView('repos');
  };

  const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = event.target.value;
    setGithubToken(newToken);
    
    // Reset states when token changes
    setCurrentPage(1);
    setHasMoreRepos(true);
    
    // Clear user data when token is emptied
    if (!newToken) {
      setGithubUser(null);
      setUserError(null);
      setRepositories([]);
      setReposError(null);
      return;
    }
    
    // Fetch GitHub user data when token is pasted
    setIsLoadingUser(true);
    setUserError(null);
    setIsLoadingRepos(true);
    setReposError(null);
    
    // Fetch user data
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
      
    // Fetch repositories (first page)
    fetchGitHubRepositories(newToken, 1)
      .then(reposData => {
        setRepositories(reposData);
        setReposError(null);
        // If we got fewer repositories than expected, there are no more to load
        setHasMoreRepos(reposData.length > 0);
      })
      .catch(error => {
        setRepositories([]);
        setReposError('Failed to fetch GitHub repositories');
        console.error('Error fetching GitHub repositories:', error);
      })
      .finally(() => {
        setIsLoadingRepos(false);
      });
  };
  
  // Function to load more repositories
  const loadMoreRepositories = () => {
    if (!githubToken || isLoadingMoreRepos || !hasMoreRepos) return;
    
    const nextPage = currentPage + 1;
    setIsLoadingMoreRepos(true);
    
    fetchGitHubRepositories(githubToken, nextPage)
      .then(newRepos => {
        if (newRepos.length === 0) {
          setHasMoreRepos(false);
        } else {
          setRepositories(prevRepos => [...prevRepos, ...newRepos]);
          setCurrentPage(nextPage);
        }
      })
      .catch(error => {
        console.error('Error fetching more repositories:', error);
        // Don't set error state here to avoid disrupting the user experience
      })
      .finally(() => {
        setIsLoadingMoreRepos(false);
      });
  };
  
  // Function to handle repository click
  const handleRepoClick = (owner: string, repoName: string) => {
    setSelectedRepo({ owner, name: repoName });
    setIsLoadingPulls(true);
    setPullsError(null);
    setPullRequests([]);
    setCurrentView('pulls');
    
    fetchGitHubRepoPulls(githubToken, owner, repoName)
      .then(pullsData => {
        setPullRequests(pullsData);
        setPullsError(null);
      })
      .catch(error => {
        setPullRequests([]);
        setPullsError(`Failed to fetch pull requests for ${owner}/${repoName}`);
        console.error(`Error fetching pull requests:`, error);
      })
      .finally(() => {
        setIsLoadingPulls(false);
      });
  };
  
  // Function to go back to repositories view
  const handleBackToRepos = () => {
    setCurrentView('repos');
  };

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };
  
  const handleDirectDevLogin = async () => {
    await bypassLogin();
    setAuthenticated(true);
  };

  // Render the current view based on state
  const renderCurrentView = () => {
    if (currentView === 'pulls' && selectedRepo) {
      return (
        <PullRequestsList
          pullRequests={pullRequests}
          isLoading={isLoadingPulls}
          error={pullsError}
          onBack={handleBackToRepos}
          repoName={selectedRepo.name}
        />
      );
    }
    
    // Default view - Repositories
    return (
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
          
          {isLoadingRepos && (
            <div className="loading-indicator">
              Loading GitHub repositories...
            </div>
          )}
          
          {reposError && (
            <div className="error-message">
              {reposError}
            </div>
          )}
          
          {repositories.length > 0 && (
            <div className="repositories-container" ref={reposContainerRef}>
              <h3 className="repositories-title">Your Repositories</h3>
              <div className="repositories-list">
                {repositories.map(repo => (
                  <div 
                    key={repo.id} 
                    className="repository-card"
                    onClick={() => handleRepoClick(repo.owner.login, repo.name)}
                  >
                    <div className="repository-header">
                      <h4 className="repository-name">{repo.name}</h4>
                      <span className="repository-visibility">{repo.visibility}</span>
                    </div>
                    <p className="repository-description">
                      {repo.description || "No description provided"}
                    </p>
                    <div className="repository-meta">
                      {repo.language && (
                        <span className="repository-language">
                          <span className="language-dot" style={{ background: getLanguageColor(repo.language) }}></span>
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count > 0 && (
                        <span className="repository-stars">
                          ★ {repo.stargazers_count}
                        </span>
                      )}
                      <span className="repository-updated">
                        Updated on {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button className="view-pulls-button">
                      View Pull Requests
                    </button>
                  </div>
                ))}
              </div>
              
              {isLoadingMoreRepos && (
                <div className="loading-more-indicator">
                  <div className="loading-spinner"></div>
                  <span>Loading more repositories...</span>
                </div>
              )}
              
              {!hasMoreRepos && repositories.length > 0 && (
                <div className="no-more-repos">
                  No more repositories to load
                </div>
              )}
            </div>
          )}
          
          {isDevelopment && (
            <div className="dev-mode-indicator">
              Development Mode Active
            </div>
          )}
        </div>
      </div>
    );
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
          renderCurrentView()
        )}
      </header>
    </div>
  );
}

export default App;
