import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth/Auth';
import { isAuthenticated, clearSession, fetchGitHubUser, fetchGitHubRepositories, fetchGitHubRepoPulls, fetchPullRequestDetail, PullRequestDetail as PullRequestDetailType } from './services/authService';
import PullRequestsList, { PullRequest } from './components/PullRequests/PullRequestsList';
import PullRequestDetail from './components/PullRequests/PullRequestDetail';
import Navbar from './components/Navigation/Navbar';

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
  const [currentView, setCurrentView] = useState<'repos' | 'pulls' | 'pullDetail'>('repos');
  
  // Pull requests state
  const [selectedRepo, setSelectedRepo] = useState<{owner: string; name: string} | null>(null);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoadingPulls, setIsLoadingPulls] = useState<boolean>(false);
  const [isLoadingMorePulls, setIsLoadingMorePulls] = useState<boolean>(false);
  const [pullsError, setPullsError] = useState<string | null>(null);
  const [currentPullsPage, setCurrentPullsPage] = useState<number>(1);
  const [hasMorePulls, setHasMorePulls] = useState<boolean>(true);
  
  // Pull request detail state
  const [selectedPull, setSelectedPull] = useState<number | null>(null);
  const [pullRequestDetail, setPullRequestDetail] = useState<PullRequestDetailType | null>(null);
  const [isLoadingPullDetail, setIsLoadingPullDetail] = useState<boolean>(false);
  const [pullDetailError, setPullDetailError] = useState<string | null>(null);
  
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
    setSelectedPull(null);
    setPullRequestDetail(null);
    setPullDetailError(null);
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
    setCurrentPullsPage(1);
    setHasMorePulls(true);
    
    fetchGitHubRepoPulls(githubToken, owner, repoName, 1)
      .then(pullsData => {
        setPullRequests(pullsData);
        setPullsError(null);
        // If we got fewer pull requests than expected per page, there are no more to load
        setHasMorePulls(pullsData.length === 10);
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
  
  // Function to load more pull requests
  const loadMorePullRequests = (page: number) => {
    if (!selectedRepo || !githubToken || isLoadingMorePulls || !hasMorePulls) return;
    
    setIsLoadingMorePulls(true);
    
    fetchGitHubRepoPulls(githubToken, selectedRepo.owner, selectedRepo.name, page)
      .then(newPulls => {
        if (newPulls.length === 0) {
          setHasMorePulls(false);
        } else {
          setPullRequests(prevPulls => [...prevPulls, ...newPulls]);
          setCurrentPullsPage(page);
          setHasMorePulls(newPulls.length === 10);
        }
      })
      .catch(error => {
        console.error('Error fetching more pull requests:', error);
        // Don't set error state here to avoid disrupting the user experience
      })
      .finally(() => {
        setIsLoadingMorePulls(false);
      });
  };
  
  // Function to go back to repositories view
  const handleBackToRepos = () => {
    setCurrentView('repos');
  };
  
  // Function to go back to pull requests view
  const handleBackToPulls = () => {
    setCurrentView('pulls');
    setSelectedPull(null);
    setPullRequestDetail(null);
    setPullDetailError(null);
  };
  
  // Function to handle pull request click
  const handlePullRequestClick = (pullNumber: number) => {
    if (!selectedRepo || !githubToken) return;
    
    setSelectedPull(pullNumber);
    setIsLoadingPullDetail(true);
    setPullDetailError(null);
    setPullRequestDetail(null);
    setCurrentView('pullDetail');
    
    fetchPullRequestDetail(githubToken, selectedRepo.owner, selectedRepo.name, pullNumber)
      .then(pullDetailData => {
        setPullRequestDetail(pullDetailData);
        setPullDetailError(null);
      })
      .catch(error => {
        setPullRequestDetail(null);
        setPullDetailError(`Failed to fetch details for pull request #${pullNumber}`);
        console.error(`Error fetching pull request details:`, error);
      })
      .finally(() => {
        setIsLoadingPullDetail(false);
      });
  };

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };
  
  // Helper function to get the appropriate title for the navbar
  const getNavbarTitle = (): string => {
    if (currentView === 'repos') {
      return 'GitHub Repositories';
    } else if (currentView === 'pulls' && selectedRepo) {
      return `Pull Requests - ${selectedRepo.owner}/${selectedRepo.name}`;
    } else if (currentView === 'pullDetail' && selectedRepo && selectedPull) {
      return `PR #${selectedPull} - ${selectedRepo.owner}/${selectedRepo.name}`;
    }
    return 'Day at Work - PR Explorer';
  };

  // Render the current view based on state
  const renderCurrentView = () => {
    if (currentView === 'pullDetail' && selectedRepo && selectedPull) {
      return (
        <PullRequestDetail
          pullRequest={pullRequestDetail}
          isLoading={isLoadingPullDetail}
          error={pullDetailError}
          onBack={() => {}} // We're using the Navbar back button now
        />
      );
    }
    
    if (currentView === 'pulls' && selectedRepo) {
      return (
        <PullRequestsList
          pullRequests={pullRequests}
          isLoading={isLoadingPulls}
          error={pullsError}
          onBack={() => {}} // We're using the Navbar back button now
          repoName={selectedRepo.name}
          onPullRequestClick={handlePullRequestClick}
          onLoadMore={loadMorePullRequests}
          hasMorePulls={hasMorePulls}
          isLoadingMore={isLoadingMorePulls}
        />
      );
    }
    
    // Default view - Repositories
    return (
      <div className="main-content">
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
            Your token is used to understand the PRs created.
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
                      <span className="repository-visibility">
                        {repo.visibility === 'private' && (
                          <svg className="lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 11V7C7 5.93913 7.42143 4.92172 8.17157 4.17157C8.92172 3.42143 9.93913 3 11 3H13C14.0609 3 15.0783 3.42143 15.8284 4.17157C16.5786 4.92172 17 5.93913 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {repo.visibility}
                      </span>
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
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      {authenticated && (
        <Navbar 
          title={getNavbarTitle()}
          showBackButton={currentView !== 'repos'}
          onBack={currentView === 'pullDetail' ? handleBackToPulls : handleBackToRepos}
          showLogout={true}
          onLogout={handleLogout}
          username={githubUser?.name || githubUser?.login}
          avatarUrl={githubUser?.avatar_url}
        />
      )}
      
      <main className="App-main">
        {!authenticated ? (
          <div className="auth-container">
            <h1 className="app-title">Day at Work - PR Explorer</h1>
            <Auth onLogin={handleLogin} />
          </div>
        ) : (
          renderCurrentView()
        )}
      </main>
    </div>
  );
}

export default App;
