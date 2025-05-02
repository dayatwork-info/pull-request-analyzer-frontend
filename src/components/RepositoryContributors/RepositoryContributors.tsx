import React from 'react';
import { Contributor } from '../../services/authService';
import './RepositoryContributors.css';

interface RepositoryContributorsProps {
  contributors: Contributor[] | null | undefined;
  isLoading: boolean;
  repoName: string;
  owner: string;
}

const RepositoryContributors: React.FC<RepositoryContributorsProps> = ({
  contributors,
  isLoading,
  repoName,
  owner
}) => {
  // Ensure contributors is an array and sort by number of contributions in descending order
  const sortedContributors = Array.isArray(contributors) 
    ? [...contributors].sort((a, b) => b.contributions - a.contributions)
    : [];

  return (
    <div className="repo-contributors-container">
      <h2>Contributors to {owner}/{repoName}</h2>
      
      {isLoading && (
        <div className="contributors-loading">
          <div className="loading-spinner"></div>
          <p>Loading contributors...</p>
        </div>
      )}
      
      {!isLoading && (!contributors || contributors.length === 0) && (
        <div className="no-contributors">
          <p>No contributors found for this repository.</p>
        </div>
      )}
      
      {!isLoading && contributors && contributors.length > 0 && (
        <div className="contributors-list">
          {sortedContributors.map(contributor => (
            <div className="contributor-card" key={contributor.id}>
              <img 
                src={contributor.avatar_url} 
                alt={`${contributor.login}'s avatar`} 
                className="contributor-avatar"
              />
              <div className="contributor-details">
                <h3 className="contributor-login">
                  <a 
                    href={`https://github.com/${contributor.login}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {contributor.login}
                  </a>
                </h3>
                <p className="contributor-contributions">
                  {contributor.contributions} {contributor.contributions === 1 ? 'contribution' : 'contributions'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RepositoryContributors;