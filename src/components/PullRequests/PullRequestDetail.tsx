import React from 'react';
import { PullRequestDetail as PullRequestDetailType } from '../../services/authService';
import './PullRequestDetail.css';

interface PullRequestDetailProps {
  pullRequest: PullRequestDetailType | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

const PullRequestDetail: React.FC<PullRequestDetailProps> = ({
  pullRequest,
  isLoading,
  error,
  onBack
}) => {
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Get state styling
  const getStateStyle = (state: string, merged: boolean): { className: string, label: string } => {
    if (merged) {
      return { className: 'pr-state-merged', label: 'Merged' };
    }
    
    return state === 'open' 
      ? { className: 'pr-state-open', label: 'Open' }
      : { className: 'pr-state-closed', label: 'Closed' };
  };

  // Helper to get status colors for file changes
  const getFileStatusStyle = (status: string): string => {
    switch (status) {
      case 'added':
        return 'file-status-added';
      case 'modified':
        return 'file-status-modified';
      case 'removed':
        return 'file-status-removed';
      case 'renamed':
        return 'file-status-renamed';
      default:
        return '';
    }
  };

  return (
    <div className="pull-request-detail-container">
      <div className="pr-header">
        <button className="back-button" onClick={onBack}>
          ← Back to pull requests
        </button>
      </div>

      {isLoading && (
        <div className="pr-loading">
          <div className="loading-spinner"></div>
          <p>Loading pull request details...</p>
        </div>
      )}
      
      {error && (
        <div className="pr-error">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && pullRequest && (
        <div className="pr-detail">
          <div className="pr-detail-header">
            <h2 className="pr-detail-title">
              #{pullRequest.number} {pullRequest.title}
            </h2>
            <div className="pr-detail-meta">
              <span 
                className={`pr-state ${getStateStyle(pullRequest.state, !!pullRequest.merged_at).className}`}
              >
                {getStateStyle(pullRequest.state, !!pullRequest.merged_at).label}
              </span>
              <div className="pr-user">
                <img 
                  src={pullRequest.user.avatar_url} 
                  alt={`${pullRequest.user.login}'s avatar`} 
                  className="pr-avatar" 
                />
                <span>{pullRequest.user.login}</span>
              </div>
              <span className="pr-date">
                {pullRequest.merged_at ? 
                  `Merged on ${formatDate(pullRequest.merged_at)}` : 
                  pullRequest.closed_at ? 
                    `Closed on ${formatDate(pullRequest.closed_at)}` : 
                    `Opened on ${formatDate(pullRequest.created_at)}`
                }
              </span>
            </div>
          </div>
          
          {pullRequest.prSummary && (
            <div className="pr-summary">
              <h3>PR Summary</h3>
              <div className="pr-summary-content">
                {pullRequest.prSummary}
              </div>
            </div>
          )}
          
          {pullRequest.body && (
            <div className="pr-description">
              {pullRequest.body}
            </div>
          )}
          
          {pullRequest.labels && pullRequest.labels.length > 0 && (
            <div className="pr-labels">
              {pullRequest.labels.map(label => (
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

          {pullRequest.files_summary && (
            <div className="pr-files-summary">
              <h3>Files Changed</h3>
              <div className="pr-summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Files</span>
                  <span className="stat-value">{pullRequest.files_summary.total_count}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Changes</span>
                  <span className="stat-value">{pullRequest.files_summary.changes}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Additions</span>
                  <span className="stat-value additions">{pullRequest.files_summary.additions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Deletions</span>
                  <span className="stat-value deletions">{pullRequest.files_summary.deletions}</span>
                </div>
              </div>

              <div className="pr-files-list">
                {pullRequest.files_summary.files && pullRequest.files_summary.files.length > 0 ? (
                  pullRequest.files_summary.files.map((file, index) => (
                    <div key={index} className="pr-file-item">
                      <span className={`file-status ${getFileStatusStyle(file.status)}`}>
                        {file.status}
                      </span>
                      <span className="file-name">{file.filename}</span>
                      <div className="file-changes">
                        <span className="additions">+{file.additions}</span>
                        <span className="deletions">-{file.deletions}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-files-message">No file changes available</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PullRequestDetail;