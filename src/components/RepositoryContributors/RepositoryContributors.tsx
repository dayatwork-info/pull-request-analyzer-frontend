import React, { useState, useEffect, useRef } from 'react';
import { Contributor } from '../../services/authService';
import './RepositoryContributors.css';

interface RepositoryContributorsProps {
  contributors: Contributor[] | null | undefined;
  isLoading: boolean;
  repoName: string;
  owner: string;
  githubToken?: string;
  onLoadMore?: (page: number) => void;
  hasMoreContributors?: boolean;
  isLoadingMore?: boolean;
}

const RepositoryContributors: React.FC<RepositoryContributorsProps> = ({
  contributors,
  isLoading,
  repoName,
  owner,
  githubToken,
  onLoadMore = () => {},
  hasMoreContributors = false,
  isLoadingMore = false
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for the container to enable infinite scrolling
  const contributorsContainerRef = useRef<HTMLDivElement>(null);
  
  // Implement scroll detection for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!contributorsContainerRef.current || isLoadingMore || !hasMoreContributors) return;
      
      const container = contributorsContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Load more contributors when the user has scrolled to near the bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        onLoadMore(nextPage);
      }
    };
    
    const containerElement = contributorsContainerRef.current;
    if (containerElement && Array.isArray(contributors) && contributors.length > 0) {
      containerElement.addEventListener('scroll', handleScroll);
      
      return () => {
        containerElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [contributors, isLoadingMore, hasMoreContributors, currentPage, onLoadMore]);

  // Ensure contributors is an array and sort by number of contributions in descending order
  const sortedContributors = Array.isArray(contributors) 
    ? [...contributors].sort((a, b) => b.contributions - a.contributions)
    : [];

  return (
    <div className="repo-contributors-container">
      <h2>Contributors to {owner}/{repoName}</h2>
      
      {isLoading && !isLoadingMore && (
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
      
      {Array.isArray(contributors) && contributors.length > 0 && (
        <div className="contributors-list-container" ref={contributorsContainerRef}>
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
          
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="loading-more-indicator">
              <div className="loading-spinner-small"></div>
              <span>Loading more contributors...</span>
            </div>
          )}
          
          {error && (
            <div className="load-more-error">
              <p>{error}</p>
              <button onClick={() => {
                setError(null);
                onLoadMore(currentPage + 1);
              }} className="retry-button">
                Retry
              </button>
            </div>
          )}
          
          {!hasMoreContributors && contributors.length > 0 && (
            <div className="no-more-contributors">
              <p>No more contributors to display</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RepositoryContributors;