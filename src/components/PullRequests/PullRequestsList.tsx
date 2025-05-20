import React, { useEffect, useRef, useState } from 'react';
import { Contributor, getEncryptedCredentials, fetchWithTokenRefresh } from '../../services/authService';
import './PullRequestsList.css';

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  draft: boolean;
  labels: {
    id: number;
    name: string;
    color: string;
  }[];
}

interface PullRequestsListProps {
  pullRequests: PullRequest[];
  allPullRequests?: PullRequest[];
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  repoName: string;
  ownerName: string;
  githubToken: string;
  onPullRequestClick: (pullNumber: number) => void;
  onLoadMore?: (page: number) => void;
  hasMorePulls?: boolean;
  isLoadingMore?: boolean;
  contributors?: Contributor[];
  isLoadingContributors?: boolean;
  selectedContributor?: string | null;
  onContributorFilter?: (login: string | null) => void;
  // Added for testing
  showSeeWorkJournal?: boolean;
}

const PullRequestsList: React.FC<PullRequestsListProps> = ({ 
  pullRequests, 
  allPullRequests = [],
  isLoading, 
  error, 
  onBack,
  repoName,
  ownerName,
  githubToken,
  onPullRequestClick,
  onLoadMore = () => {},
  hasMorePulls = false,
  isLoadingMore = false,
  contributors = [],
  isLoadingContributors = false,
  selectedContributor = null,
  onContributorFilter = () => {},
  // Use provided showSeeWorkJournal prop if available (for testing)
  showSeeWorkJournal: propShowSeeWorkJournal
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summarySuccess, setSummarySuccess] = useState<boolean>(false);
  const [showSeeWorkJournalState, setShowSeeWorkJournal] = useState<boolean>(false);
  const [journalMessage, setJournalMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  // Use the prop if provided (for testing) or the state otherwise
  const showSeeWorkJournal = propShowSeeWorkJournal !== undefined ? propShowSeeWorkJournal : showSeeWorkJournalState;
  
  // Function to generate PR summaries
  const handleGenerateSummary = async () => {
    if (!repoName || !ownerName) return;
    
    // Use the props directly
    const owner = ownerName;
    const repo = repoName;
    
    setIsGeneratingSummary(true);
    setSummaryError(null);
    setSummarySuccess(false);
    setJournalMessage(null);
    
    try {
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
      
      // Use fetchWithTokenRefresh to handle token refresh if needed
      const GITHUB_API_URL = process.env.REACT_APP_GITHUB_API_URL;
      const response = await fetchWithTokenRefresh(`${GITHUB_API_URL}/repos/${owner}/${repo}/pr-summaries`, {
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
        throw new Error(errorData.message || 'Failed to generate summaries');
      }
      
      const result = await response.json();
      console.log('PR summaries generated:', result);
      setSummarySuccess(true);
      setShowSeeWorkJournal(true);
      
      // Set a timeout to hide the success message after 3 seconds
      setTimeout(() => {
        setSummarySuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error generating PR summaries:', error);
      setSummaryError(error instanceof Error ? error.message : 'Failed to generate summaries');
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
  
  // Implement scroll detection for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!listContainerRef.current || isLoadingMore || !hasMorePulls) return;
      
      const container = listContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Load more pull requests when the user has scrolled to near the bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        onLoadMore(nextPage);
      }
    };
    
    const containerElement = listContainerRef.current;
    if (containerElement && pullRequests.length > 0) {
      containerElement.addEventListener('scroll', handleScroll);
      
      return () => {
        containerElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [pullRequests, isLoadingMore, hasMorePulls, currentPage, onLoadMore]);

  // Get state label styling
  const getStateStyle = (state: string, merged: boolean): { className: string, label: string } => {
    if (merged) {
      return { className: 'pr-state-merged', label: 'Merged' };
    }
    
    return state === 'open' 
      ? { className: 'pr-state-open', label: 'Open' }
      : { className: 'pr-state-closed', label: 'Closed' };
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="pull-requests-container">
      <div className="pr-header">
        <h2>Pull Requests for {repoName}</h2>
        
        {/* Generate Summary Button */}
        <div className="generate-summary-container">
          <button 
            className="generate-summary-button" 
            onClick={() => handleGenerateSummary()}
            disabled={isGeneratingSummary}
          >
            {isGeneratingSummary ? 'Generating...' : 'Generate PR Summaries & add to Work Journal'}
          </button>
          <p className="summary-note">We will create summary for all the PRs and add your summaries to your work journal.</p>
          
          {/* Show error message if there was a problem */}
          {summaryError && (
            <p className="summary-error">{summaryError}</p>
          )}
          
          {/* Show success message when summaries are generated */}
          {summarySuccess && (
            <p className="summary-success">PR summaries generated & added to work journal!</p>
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

        {/* Contributors Filter Dropdown */}
        {contributors.length > 0 && (
          <div className="contributor-filter">
            <h3>Filter by PR creator</h3>
            
            <div className="contributor-dropdown-container">
              <select 
                className="contributor-dropdown"
                value={selectedContributor || ''}
                onChange={(e) => onContributorFilter(e.target.value === '' ? null : e.target.value)}
              >
                <option value="">All Contributors</option>
                {contributors.map(contributor => {
                  return (
                    <option key={contributor.id} value={contributor.login}>
                      {contributor.login}
                    </option>
                  );
                })}
              </select>
              
              {selectedContributor && (
                <button 
                  className="clear-dropdown-filter"
                  onClick={() => onContributorFilter(null)}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
        
        {isLoadingContributors && (
          <div className="loading-contributors">
            <div className="loading-spinner small"></div>
            <span>Loading contributors...</span>
          </div>
        )}
      </div>
        
        {isLoading && (
          <div className="pr-loading">
            <div className="loading-spinner"></div>
            <p>Loading pull requests...</p>
          </div>
        )}
        
        {error && (
          <div className="pr-error">
            <p>{error}</p>
          </div>
        )}
        
        {!isLoading && !error && pullRequests.length === 0 && (
          <div className="pr-empty">
            {selectedContributor ? (
              <p>
                No pull requests found for contributor <strong>{selectedContributor}</strong>. 
                <button className="clear-filter-button" onClick={() => onContributorFilter(null)}>
                  Clear filter
                </button>
              </p>
            ) : (
              <p>No pull requests found for this repository.</p>
            )}
          </div>
        )}
        
        {!isLoading && !error && pullRequests.length > 0 && (
          <div className="pr-list" ref={listContainerRef}>
            {pullRequests.map(pr => {
              const stateStyle = getStateStyle(pr.state, !!pr.merged_at);
              
              return (
                <div 
                  key={pr.id} 
                  className="pr-item"
                  onClick={() => onPullRequestClick(pr.number)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="pr-title-row">
                    <h3 className="pr-title">
                      #{pr.number} {pr.title}
                    </h3>
                    <span className={`pr-state ${stateStyle.className}`}>
                      {stateStyle.label}
                    </span>
                  </div>
                  
                  <div className="pr-meta">
                    <div className="pr-user">
                      <img src={pr.user.avatar_url} alt={`${pr.user.login}'s avatar`} className="pr-avatar" />
                      <span>{pr.user.login}</span>
                    </div>
                    <span className="pr-date">
                      {pr.merged_at ? 
                        `Merged on ${formatDate(pr.merged_at)}` : 
                        pr.closed_at ? 
                          `Closed on ${formatDate(pr.closed_at)}` : 
                          `Opened on ${formatDate(pr.created_at)}`
                      }
                    </span>
                  </div>
                  
                  {pr.body && (
                    <div className="pr-description">
                      {pr.body.length > 200 ? `${pr.body.substring(0, 200)}...` : pr.body}
                    </div>
                  )}
                  
                  {pr.labels.length > 0 && (
                    <div className="pr-labels">
                      {pr.labels.map(label => (
                        <span 
                          key={label.id} 
                          className="pr-label"
                          style={{ 
                            backgroundColor: `#${label.color}`,
                            color: parseInt(label.color, 16) > 0xffffff / 2 ? '#000' : '#fff'
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {isLoadingMore && (
              <div className="loading-more-indicator">
                <div className="loading-spinner"></div>
                <span>Loading more pull requests...</span>
              </div>
            )}
            
            {!hasMorePulls && pullRequests.length > 0 && (
              <div className="no-more-pulls">
                No more pull requests to load
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default PullRequestsList;