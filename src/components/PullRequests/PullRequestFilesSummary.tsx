import React from 'react';
import './PullRequestDetail.css';

export interface PullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

interface PullRequestFilesSummaryProps {
  files: PullRequestFile[];
}

const PullRequestFilesSummary: React.FC<PullRequestFilesSummaryProps> = ({ files }) => {
  // Calculate summary data from files
  const calculateSummary = () => {
    if (!files || files.length === 0) {
      return {
        total_count: 0,
        changes: 0,
        additions: 0,
        deletions: 0
      };
    }

    const summary = files.reduce(
      (acc, file) => {
        return {
          total_count: acc.total_count + 1,
          changes: acc.changes + file.changes,
          additions: acc.additions + file.additions,
          deletions: acc.deletions + file.deletions
        };
      },
      { total_count: 0, changes: 0, additions: 0, deletions: 0 }
    );

    return summary;
  };

  const filesSummary = calculateSummary();

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
    <>
      <div className="pr-files-summary">
        <h3>Files Changed</h3>
        <div className="pr-summary-stats">
          <div className="stat-item">
            <span className="stat-label">Files</span>
            <span className="stat-value">{filesSummary.total_count}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Changes</span>
            <span className="stat-value">{filesSummary.changes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Additions</span>
            <span className="stat-value additions">{filesSummary.additions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Deletions</span>
            <span className="stat-value deletions">{filesSummary.deletions}</span>
          </div>
        </div>
      </div>

      <div className="pr-files-list">
        {files && files.length > 0 ? (
          files.map((file, index) => (
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
    </>
  );
};

export default PullRequestFilesSummary;