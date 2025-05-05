import React, { useState } from 'react';
import { 
  PullRequestDetail as PullRequestDetailType, 
  getEncryptedCredentials,
  fetchWithTokenRefresh
} from '../../services/authService';
import PullRequestFilesSummary from './PullRequestFilesSummary';
import './PullRequestDetail.css';

interface PullRequestDetailProps {
  pullRequest: PullRequestDetailType | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  currentUser?: { login: string } | null;
  githubToken?: string;
}

const PullRequestDetail: React.FC<PullRequestDetailProps> = ({
  pullRequest,
  isLoading,
  error,
  onBack,
  currentUser = null,
  githubToken = ''
}) => {
  const [addingToJournal, setAddingToJournal] = useState(false);
  const [journalMessage, setJournalMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [hasJournalEntry, setHasJournalEntry] = useState<boolean>(false);
  const [journalIdFromApi, setJournalIdFromApi] = useState(null);

  // Check if a journal entry already exists for this PR
  React.useEffect(() => {
    const checkJournalEntry = async () => {
      if (pullRequest && githubToken) {
        try {
          // Create a key for this PR 
          const prKey = `${pullRequest.html_url.split('/').slice(3, 5).join('_')}_${pullRequest.number}`;

          // Make request to journal/ids endpoint to get all journal entries
          const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_JOURNAL_API_URL}/by-pr/${prKey}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-GitHub-Token': githubToken
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch journal entries');
          }
          
          const data = await response.json();
          
          if (data.found) {
            setHasJournalEntry(true);
            setJournalIdFromApi(data.journalId);
          } else {
            // Check if we have a journalId for this PR in session storage
            const existingData = sessionStorage.getItem(prKey);
            if (existingData) {
              const summaryData = JSON.parse(existingData);
              if (summaryData.journalId) {
                setHasJournalEntry(true);
              }
            }
          }
        } catch (error) {
          console.error('Error checking for existing journal entry:', error);
        }
      }
    };
    
    checkJournalEntry();
  }, [pullRequest, githubToken]);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Check if the current user is the author of the PR
  const isAuthor = (): boolean => {
    if (!pullRequest || !currentUser) return false;
    return pullRequest.user.login === currentUser.login;
  };
  
  // Handle adding PR to work journal
  const handleAddToWorkJournal = async () => {
    if (!pullRequest) return;
    
    setAddingToJournal(true);
    setJournalMessage(null);
    
    try {
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
      
      // Prepare request body
      const requestBody = {
        email,
        password,
        title: pullRequest.title,
        content: pullRequest.prSummary || 'No summary available',
        prRef: `${pullRequest.html_url.split('/').slice(3, 5).join('_')}_${pullRequest.number}`
      };
      
      // Make request to journal/create endpoint using fetchWithTokenRefresh
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_JOURNAL_API_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-GitHub-Token': githubToken // Use the token passed from App component
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add to journal');
      }
      
      // Store the journalId in session storage if it exists
      if (data.journalId && pullRequest) {
        try {
          // Create a key for this PR and journal entry
          const prKey = `pr_summary_${pullRequest.html_url.split('/').slice(3, 5).join('_')}_${pullRequest.number}`;
          
          // Get existing PR summary data from session storage
          const existingData = sessionStorage.getItem(prKey);
          let summaryData = existingData ? JSON.parse(existingData) : {};
          
          // Add the journalId to the existing data
          summaryData.journalId = data.journalId;
          summaryData.journalAddedAt = new Date().toISOString();
          
          // Save the updated data back to session storage
          sessionStorage.setItem(prKey, JSON.stringify(summaryData));
          
          // Set hasJournalEntry to true
          setHasJournalEntry(true);
          
          console.log(`Journal ID ${data.journalId} stored for PR #${pullRequest.number}`);
        } catch (error) {
          console.error('Error storing journal ID in session storage:', error);
        }
      }
      
      // Show success message
      setJournalMessage({
        text: 'Successfully added to your work journal!',
        type: 'success'
      });

    } catch (error) {
      console.error('Error adding to work journal:', error);
      setJournalMessage({
        text: error instanceof Error ? error.message : 'Failed to add to work journal. Please try again.',
        type: 'error'
      });
    } finally {
      setAddingToJournal(false);
    }
  };

  const handleSeeWorkJournal = async () => {
    if (!pullRequest) return;
    
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
      
      let journalIdForRequest: string;
      if (journalIdFromApi) {
        journalIdForRequest = journalIdFromApi;
      } else {
        // Get the journal ID from session storage
        const prKey = `pr_summary_${pullRequest.html_url.split('/').slice(3, 5).join('_')}_${pullRequest.number}`;
        const existingData = sessionStorage.getItem(prKey);
        const summaryData = existingData ? JSON.parse(existingData) : {};
        
        if (!summaryData.journalId) {
          throw new Error('No journal entry found for this PR. Please add it to your work journal first.');
        }
       
        journalIdForRequest = summaryData.journalId;
      }
      // Set temporary message
      setJournalMessage({
        text: 'Opening work journal...',
        type: 'success'
      });
      
      // Make request to auth/decrypt-credentials endpoint
      const decryptResponse = await fetch(`${process.env.REACT_APP_AUTH_API_URL}/decrypt-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ encryptedEmail: email, encryptedPassword: password })
      });
      
      if (!decryptResponse.ok) {
        throw new Error('Failed to authenticate with work journal');
      }
      
      const decryptData = await decryptResponse.json();
      
      // Open the work journal in a new tab
      const otherWindow = window.open(process.env.REACT_APP_WORK_JOURNAL_URL, 'workJournalTab');
      
      // Wait for the page to load, then send the credentials and journal ID
      setTimeout(() => {
        if (otherWindow) {
          otherWindow.postMessage({ 
            email: decryptData.email, 
            password: decryptData.password, 
            journalId: journalIdForRequest,
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
  }

  // Get state styling
  const getStateStyle = (state: string, merged: boolean): { className: string, label: string } => {
    if (merged) {
      return { className: 'pr-state-merged', label: 'Merged' };
    }
    
    return state === 'open' 
      ? { className: 'pr-state-open', label: 'Open' }
      : { className: 'pr-state-closed', label: 'Closed' };
  };

  // Status styles moved to PullRequestFilesSummary component

  return (
    <div className="pull-request-detail-container">
      <div className="pr-header">
      </div>

      {isLoading && (
        <div className="pr-loading">
          <div className="loading-spinner"></div>
          <p>Loading pull request summary...</p>
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
            
            {/* Add to Work Journal button - only visible if current user is the author */}
            {isAuthor() && (
              <div className="pr-actions">
                {!hasJournalEntry && <button 
                  className="add-to-journal-button" 
                  onClick={handleAddToWorkJournal}
                  disabled={addingToJournal}
                >
                  {addingToJournal ? (
                    <>
                      <span className="button-spinner"></span>
                      Adding to journal...
                    </>
                  ) : (
                    <>
                      <span className="journal-icon">📝</span>
                      Add to Work Journal
                    </>
                  )}
                </button>
                }
                
                {journalMessage && (
                  <div className={`journal-message ${journalMessage.type}`}>
                    {journalMessage.text}
                  </div>
                )}

                {/* Show 'See my work journal' button if we have a journal entry or just added one */}
                {(hasJournalEntry || (journalMessage && journalMessage.type === 'success')) && (
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

          {/* Use the new PullRequestFilesSummary component */}
          {pullRequest.files && (
            <PullRequestFilesSummary files={pullRequest.files} />
          )}
        </div>
      )}
    </div>
  );
};

export default PullRequestDetail;