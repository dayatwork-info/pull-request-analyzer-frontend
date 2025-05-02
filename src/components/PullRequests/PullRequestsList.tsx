import React from 'react';
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
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  repoName: string;
  onPullRequestClick: (pullNumber: number) => void;
}

const PullRequestsList: React.FC<PullRequestsListProps> = ({ 
  pullRequests, 
  isLoading, 
  error, 
  onBack,
  repoName,
  onPullRequestClick
}) => {
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
        <button className="back-button" onClick={onBack}>
          ← Back to repositories
        </button>
        <h2>Pull Requests for {repoName}</h2>
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
            <p>No pull requests found for this repository.</p>
          </div>
        )}
        
        {!isLoading && !error && pullRequests.length > 0 && (
          <div className="pr-list">
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
          </div>
        )}
    </div>
  );
};

export default PullRequestsList;