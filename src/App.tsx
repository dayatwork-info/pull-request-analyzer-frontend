import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth/Auth';
import { 
  isAuthenticated, 
  clearSession, 
  fetchGitHubUser, 
  fetchGitHubRepositories, 
  fetchGitHubRepoPulls, 
  fetchPullRequestDetail, 
  fetchRepoContributors,
  fetchUserPRSummaries,
  PullRequestDetail as PullRequestDetailType,
  Contributor,
  PRSummariesResponse,
  getEncryptedCredentials,
  fetchWithTokenRefresh
} from './services/authService';
import PullRequestsList, { PullRequest } from './components/PullRequests/PullRequestsList';
import PullRequestDetail from './components/PullRequests/PullRequestDetail';
import Navbar from './components/Navigation/Navbar';
import RepositoryContributors from './components/RepositoryContributors/RepositoryContributors';

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
  const [repoContributors, setRepoContributors] = useState<Contributor[] | null>(null);
  const [isLoadingRepoContributors, setIsLoadingRepoContributors] = useState<boolean>(false);
  const [prSummaries, setPRSummaries] = useState<PRSummariesResponse | null>(null);
  const [isLoadingPRSummaries, setIsLoadingPRSummaries] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summarySuccess, setSummarySuccess] = useState<boolean>(false);
  const [showSeeWorkJournal, setShowSeeWorkJournal] = useState<boolean>(false);
  const [journalMessage, setJournalMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  // Navigation and view state
  const [currentView, setCurrentView] = useState<'repos' | 'pulls' | 'pullDetail' | 'repoContributors'>('repos');
  
  // Pull requests state
  const [selectedRepo, setSelectedRepo] = useState<{owner: string; name: string} | null>(null);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoadingPulls, setIsLoadingPulls] = useState<boolean>(false);
  const [isLoadingMorePulls, setIsLoadingMorePulls] = useState<boolean>(false);
  const [pullsError, setPullsError] = useState<string | null>(null);
  const [, setCurrentPullsPage] = useState<number>(1);
  const [hasMorePulls, setHasMorePulls] = useState<boolean>(true);
  const [filteredPullRequests, setFilteredPullRequests] = useState<PullRequest[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [isLoadingContributors, setIsLoadingContributors] = useState<boolean>(false);
  
  // Pull request detail state
  const [selectedPull, setSelectedPull] = useState<number | null>(null);
  const [pullRequestDetail, setPullRequestDetail] = useState<PullRequestDetailType | null>(null);
  const [isLoadingPullDetail, setIsLoadingPullDetail] = useState<boolean>(false);
  const [pullDetailError, setPullDetailError] = useState<string | null>(null);
  
  // Ref for the repositories container for infinite scrolling
  const reposContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Development mode flag - keep for future use
  // const isDevelopment = process.env.NODE_ENV === 'development';

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
    setRepoContributors(null);
    setContributors([]);
    setPRSummaries(null);
    setCurrentView('repos');
    
    // Clear PR summaries from sessionStorage
    try {
      // Get the index of PR summaries
      const prIndex = sessionStorage.getItem('pr_summaries_index');
      
      if (prIndex) {
        const prSummaries = JSON.parse(prIndex);
        
        // Remove each PR summary entry
        prSummaries.forEach((entry: { key: string }) => {
          sessionStorage.removeItem(entry.key);
        });
        
        // Remove the index itself
        sessionStorage.removeItem('pr_summaries_index');
      }
    } catch (error) {
      console.error('Error clearing PR summaries from sessionStorage:', error);
    }
  };

  const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = event.target.value;
    setGithubToken(newToken);
    
    // Reset states when token changes
    setCurrentPage(1);
    setHasMoreRepos(true);
    setPRSummaries(null);
    
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
    setIsLoadingPRSummaries(true);
    
    // Fetch user data
    fetchGitHubUser(newToken)
      .then(userData => {
        setGithubUser(userData);
        setUserError(null);
        
        // After getting user data, fetch PR summaries
        return fetchUserPRSummaries(newToken)
          .then(summariesData => {
            setPRSummaries(summariesData);
            console.log('PR Summaries:', summariesData);
          })
          .catch(error => {
            console.error('Error fetching PR summaries:', error);
            setPRSummaries(null);
          })
          .finally(() => {
            setIsLoadingPRSummaries(false);
          });
      })
      .catch(error => {
        setGithubUser(null);
        setUserError('Failed to fetch GitHub user data');
        console.error('Error fetching GitHub user:', error);
        setIsLoadingPRSummaries(false);
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
  
  // Function to fetch repository contributors
  const fetchRepositoryContributors = (owner: string, repoName: string) => {
    setIsLoadingRepoContributors(true);
    setRepoContributors(null);
    
    fetchRepoContributors(githubToken, owner, repoName)
      .then(contributorsData => {
        if (contributorsData && 'contributors' in contributorsData) {
          setRepoContributors(contributorsData.contributors);
        } else {
          setRepoContributors([]);
          console.warn('Contributors data is missing or invalid:', contributorsData);
        }
      })
      .catch(error => {
        console.error(`Error fetching contributors for ${owner}/${repoName}:`, error);
        setRepoContributors([]);
      })
      .finally(() => {
        setIsLoadingRepoContributors(false);
      });
  };
  
  // Function to handle repository click
  const handleRepoClick = (owner: string, repoName: string) => {
    setSelectedRepo({ owner, name: repoName });
    setIsLoadingPulls(true);
    setPullsError(null);
    setPullRequests([]);
    setFilteredPullRequests([]);
    setSelectedContributor(null);
    setContributors([]);
    setCurrentView('pulls');
    setCurrentPullsPage(1);
    setHasMorePulls(true);
    setIsLoadingContributors(true);
    
    // Fetch pull requests
    const pullRequestsPromise = fetchGitHubRepoPulls(githubToken, owner, repoName, 1)
      .then(pullsData => {
        setPullRequests(pullsData);
        setFilteredPullRequests(pullsData);
        setPullsError(null);
        // If we got fewer pull requests than expected per page, there are no more to load
        setHasMorePulls(pullsData.length === 10);
        return pullsData;
      })
      .catch(error => {
        setPullRequests([]);
        setFilteredPullRequests([]);
        setPullsError(`Failed to fetch pull requests for ${owner}/${repoName}`);
        console.error(`Error fetching pull requests:`, error);
        return [];
      })
      .finally(() => {
        setIsLoadingPulls(false);
      });
    
    // Fetch contributors
    const contributorsPromise = fetchRepoContributors(githubToken, owner, repoName)
      .then(contributorsData => {
        if (contributorsData && 'contributors' in contributorsData) {
          setContributors(contributorsData.contributors);
        } else {
          setContributors([]);
        }
        return contributorsData;
      })
      .catch(error => {
        console.error(`Error fetching contributors for ${owner}/${repoName}:`, error);
        setContributors([]);
        return { contributors: [] };
      })
      .finally(() => {
        setIsLoadingContributors(false);
      });
    
    // Wait for both promises to resolve
    Promise.all([pullRequestsPromise, contributorsPromise])
      .then(([pullsData, contributorsData]) => {
        // If the current user is a contributor, select them by default
        if (githubUser && contributorsData && 'contributors' in contributorsData) {
          const contributorsList = contributorsData.contributors;
          const currentUserContributor = contributorsList.find(
            contributor => contributor.login === githubUser.login
          );
          
          if (currentUserContributor) {
            // Filter PRs to show only the current user's
            const userPRs = pullsData.filter(pr => pr.user.login === githubUser.login);
            if (userPRs.length > 0) {
              setSelectedContributor(githubUser.login);
              setFilteredPullRequests(userPRs);
            }
          }
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
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
          // Update the full list of pull requests
          const updatedPullRequests = [...pullRequests, ...newPulls];
          setPullRequests(updatedPullRequests);
          
          // If a contributor filter is active, apply it to the new pulls
          if (selectedContributor) {
            const newFilteredPulls = newPulls.filter(
              pr => pr.user.login === selectedContributor
            );
            setFilteredPullRequests(prevFilteredPulls => [...prevFilteredPulls, ...newFilteredPulls]);
          } else {
            // No filter active, so filtered list is the same as full list
            setFilteredPullRequests(updatedPullRequests);
          }
          
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
    // Clear repository-specific data
    setRepoContributors(null);
    setContributors([]);
    setSelectedContributor(null);
    setPullRequests([]);
    setFilteredPullRequests([]);
    setSelectedRepo(null);
  };
  
  // Function to go back to pull requests view
  const handleBackToPulls = () => {
    setCurrentView('pulls');
    setSelectedPull(null);
    setPullRequestDetail(null);
    setPullDetailError(null);
  };
  
  // Function to switch to contributors view
  const handleShowContributors = () => {
    if (!selectedRepo) return;
    setCurrentView('repoContributors');
    // Use existing data if already loaded
    if (!repoContributors || repoContributors.length === 0) {
      fetchRepositoryContributors(selectedRepo.owner, selectedRepo.name);
    }
  };
  
  // Function to switch to pull requests view
  const handleShowPulls = () => {
    setCurrentView('pulls');
  };
  
  // Function to handle contributor filter selection
  const handleContributorFilter = (login: string | null) => {
    setSelectedContributor(login);
    
    if (login === null) {
      // Clear filter
      setFilteredPullRequests(pullRequests);
    } else {
      // Apply filter
      const filtered = pullRequests.filter(pr => pr.user.login === login);
      setFilteredPullRequests(filtered);
    }
  };
  
  // Function to handle pull request click
  const handlePullRequestClick = (pullNumber: number) => {
    if (!selectedRepo || !githubToken) return;
    
    setSelectedPull(pullNumber);
    setIsLoadingPullDetail(true);
    setPullDetailError(null);
    setPullRequestDetail(null);
    setCurrentView('pullDetail');
    
    // Check if PR summary is already in sessionStorage
    const prKey = `pr_summary_${selectedRepo.owner}_${selectedRepo.name}_${pullNumber}`;
    const storedPRSummary = sessionStorage.getItem(prKey);
    
    // Determine if we should skip summary generation
    const skipSummary = !!storedPRSummary;
    
    // Fetch PR details with skip_summary flag if we already have the summary
    fetchPullRequestDetail(githubToken, selectedRepo.owner, selectedRepo.name, pullNumber, skipSummary)
      .then(pullDetailData => {
        // If we have a stored summary and the API didn't return one, use the stored summary
        if (skipSummary && storedPRSummary && !pullDetailData.prSummary) {
          const storedData = JSON.parse(storedPRSummary);
          pullDetailData.prSummary = storedData.summary;
        }
        
        setPullRequestDetail(pullDetailData);
        setPullDetailError(null);
        
        // Store PR summary in sessionStorage if it exists
        if (!skipSummary) {
          storePRSummaryInSession(
            selectedRepo.owner, 
            selectedRepo.name, 
            pullNumber, 
            pullDetailData
          );
        }
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
  
  /**
   * Helper function to store PR summary in sessionStorage
   */
  const storePRSummaryInSession = (
    owner: string, 
    repoName: string, 
    pullNumber: number, 
    pullData: PullRequestDetailType
  ) => {
    try {
      // Create a unique key for this PR
      const prKey = `pr_summary_${owner}_${repoName}_${pullNumber}`;
      
      // Store the PR summary
      sessionStorage.setItem(prKey, JSON.stringify({
        summary: pullData.prSummary || '',
        title: pullData.title,
        url: pullData.html_url,
        storedAt: new Date().toISOString()
      }));
      
      // Store reference in a PR summary index for easy retrieval
      const prIndex = sessionStorage.getItem('pr_summaries_index');
      const prSummaries = prIndex ? JSON.parse(prIndex) : [];
      
      // Check if this PR is already in the index
      const existingEntry = prSummaries.findIndex(
        (entry: {repo: string, pr: number}) => 
          entry.repo === `${owner}/${repoName}` && 
          entry.pr === pullNumber
      );
      
      // If not in index, add it
      if (existingEntry === -1) {
        prSummaries.push({
          repo: `${owner}/${repoName}`,
          pr: pullNumber,
          key: prKey,
          addedAt: new Date().toISOString()
        });
        
        // Store the updated index
        sessionStorage.setItem('pr_summaries_index', JSON.stringify(prSummaries));
      }
      
      return true;
    } catch (error) {
      console.error('Error storing PR summary in sessionStorage:', error);
      return false;
    }
  };
  

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };
  
  const handleAddSummariesToWorkJournal = async () => {
    try {
      setIsGeneratingSummary(true);
      setSummaryError(null);
      setSummarySuccess(false);
      setJournalMessage(null);
      
      // Get encrypted credentials from sessionStorage
      const encryptedCredsStr = getEncryptedCredentials();
      let encryptedCreds = {};
      
      try {
        if (encryptedCredsStr) {
          encryptedCreds = JSON.parse(encryptedCredsStr);
        }
      } catch (error) {
        console.error('Error parsing encrypted credentials:', error);
      }
      
      // Make POST request to user/pr-summaries with github token
      const GITHUB_API_URL = process.env.REACT_APP_GITHUB_API_URL;
      const response = await fetchWithTokenRefresh(`${GITHUB_API_URL}/user/pr-summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-GitHub-Token': githubToken, // Include GitHub token in the request
        },
        body: JSON.stringify(encryptedCreds),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add summaries to work journal');
      }
      
      const result = await response.json();
      console.log('PR summaries added to work journal:', result);
      
      // Show success message and enable See Work Journal button
      setSummarySuccess(true);
      setShowSeeWorkJournal(true);
      
      // Set a timeout to hide the success message after 3 seconds
      setTimeout(() => {
        setSummarySuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error adding PR summaries to work journal:', error);
      setSummaryError(error instanceof Error ? error.message : 'Failed to add summaries to work journal');
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  // Handle opening work journal
  const handleSeeWorkJournal = async () => {
    // Visual indication that the button was clicked
    setJournalMessage({
      text: 'Opening work journal...',
      type: 'success'
    });
    
    try {
      // Get the credentials from session storage
      const credentials = getEncryptedCredentials();
      if (!credentials) {
        throw new Error('No credentials found');
      }
      
      const parsedCredentials = typeof credentials === 'string' ? 
        JSON.parse(credentials) : credentials;
      
      // Get email and password from credentials
      const { email, password } = parsedCredentials;
      
      if (!email || !password) {
        throw new Error('Credentials incomplete');
      }
      
      // Set temporary message
      setJournalMessage({
        text: 'Opening work journal...',
        type: 'success'
      });
      
      // Make request to auth/decrypt-credentials endpoint using fetchWithTokenRefresh
      const decryptResponse = await fetchWithTokenRefresh(`${process.env.REACT_APP_AUTH_API_URL}/decrypt-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ encryptedEmail: email, encryptedPassword: password })
      });
      
      if (!decryptResponse.ok) {
        throw new Error('Failed to authenticate with work journal');
      }
      
      const decryptData = await decryptResponse.json();
      
      // Open the work journal in a new tab
      const otherWindow = window.open(process.env.REACT_APP_WORK_JOURNAL_URL, 'workJournalTab');
      
      // Wait for the page to load, then send the credentials
      setTimeout(() => {
        if (otherWindow) {
          otherWindow.postMessage({ 
            email: decryptData.email, 
            password: decryptData.password
          }, process.env.REACT_APP_WORK_JOURNAL_URL);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error opening work journal:', error);
      setJournalMessage({
        text: error instanceof Error ? error.message : 'Failed to open work journal. Please try again.',
        type: 'error'
      });
    }
  };
  
  // Helper function to get the appropriate title for the navbar
  const getNavbarTitle = (): string => {
    if (currentView === 'repos') {
      return 'GitHub Repositories';
    } else if (currentView === 'pulls' && selectedRepo) {
      return `Pull Requests - ${selectedRepo.owner}/${selectedRepo.name}`;
    } else if (currentView === 'repoContributors' && selectedRepo) {
      return `Contributors - ${selectedRepo.owner}/${selectedRepo.name}`;
    } else if (currentView === 'pullDetail' && selectedRepo && selectedPull) {
      return `PR #${selectedPull} - ${selectedRepo.owner}/${selectedRepo.name}`;
    }
    return 'Day at Work - Code Explorer';
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
          currentUser={githubUser}
          githubToken={githubToken}
        />
      );
    }
    
    if ((currentView === 'pulls' || currentView === 'repoContributors') && selectedRepo) {
      return (
        <div>
          {/* Tab Navigation */}
          <div className="repo-tabs">
            <button 
              className={`repo-tab ${currentView === 'pulls' ? 'active' : ''}`}
              onClick={handleShowPulls}
            >
              Pull Requests
            </button>
            <button 
              className={`repo-tab ${currentView === 'repoContributors' ? 'active' : ''}`}
              onClick={handleShowContributors}
            >
              Contributors
            </button>
          </div>
          
          {/* Tab Content */}
          {currentView === 'pulls' ? (
            <PullRequestsList
              pullRequests={filteredPullRequests}
              allPullRequests={pullRequests}
              isLoading={isLoadingPulls}
              error={pullsError}
              onBack={() => {}} // We're using the Navbar back button now
              repoName={selectedRepo.name}
              ownerName={selectedRepo.owner}
              githubToken={githubToken}
              onPullRequestClick={handlePullRequestClick}
              onLoadMore={loadMorePullRequests}
              hasMorePulls={hasMorePulls}
              isLoadingMore={isLoadingMorePulls}
              contributors={contributors}
              isLoadingContributors={isLoadingContributors}
              selectedContributor={selectedContributor}
              onContributorFilter={handleContributorFilter}
            />
          ) : (
            <RepositoryContributors
              contributors={repoContributors}
              isLoading={isLoadingRepoContributors}
              repoName={selectedRepo.name}
              owner={selectedRepo.owner}
            />
          )}
        </div>
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
          {!githubToken && (
            <div className="token-info-container">
              <p className="token-info">
                Your token is used to understand the PRs created. For GitHub fine-grained personal access tokens, please ensure:
              </p>
              <ul className="token-permissions">
                <li>Read access to email addresses under user permissions</li>
                <li>Read access to metadata and pull requests under repository permissions</li>
              </ul>
            </div>
          )}
          
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
          
          {isLoadingPRSummaries && (
            <div className="loading-indicator">
              Checking for your PR summaries...
            </div>
          )}
          
          {githubUser && prSummaries && prSummaries.found && (
            <div className="pr-summaries-container">
              {!showSeeWorkJournal && (
                <>
                  <p className="pr-summaries-message">
                    {prSummaries.summaries} contributions found in your code history!
                  </p>
                  <button 
                    className="add-summaries-button"
                    onClick={handleAddSummariesToWorkJournal}
                    disabled={isGeneratingSummary}
                  >
                    {isGeneratingSummary ? 'Adding to Work Journal...' : 'Add your Summaries to Work Journal'}
                  </button>
                </>
              )}
              
              {/* Show error message if there was a problem */}
              {summaryError && (
                <p className="summary-error">{summaryError}</p>
              )}
              
              {/* Show success message when summaries are generated */}
              {summarySuccess && (
                <p className="summary-success">PR summaries added to your work journal!</p>
              )}

              {/* Journal message */}
              {journalMessage && (
                <div className={`journal-message ${journalMessage.type}`}>
                  {journalMessage.text}
                </div>
              )}

              {/* Show 'See my work journal' button if summaries were generated successfully */}
              {showSeeWorkJournal && (
                <>
                  <button 
                    className="see-journal-button" 
                    onClick={handleSeeWorkJournal}
                  >
                    <span className="journal-icon">📖</span>
                    See my work journal
                  </button>
                  <div className="journal-helper-text">
                    <small>You can also visit <a href={process.env.REACT_APP_WORK_JOURNAL_URL} target="_blank" rel="noopener noreferrer">{process.env.REACT_APP_WORK_JOURNAL_URL?.replace(/(^\w+:|^)\/\//, '')}</a> directly and log in with the same credentials you used for this application.</small>
                  </div>
                </>
              )}
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
            <h1 className="app-title">Day at Work - Code Explorer</h1>
            <Auth onLogin={handleLogin} />
            <div className="github-links">
              <p>Check out our code:</p>
              <a href="https://github.com/dayatwork-info/pull-request-analyzer-backend" target="_blank" rel="noopener noreferrer">Backend Repository</a>
              <a href="https://github.com/dayatwork-info/pull-request-analyzer-frontend" target="_blank" rel="noopener noreferrer">Frontend Repository</a>
            </div>
          </div>
        ) : (
          renderCurrentView()
        )}
      </main>
    </div>
  );
}

export default App;
