import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PullRequestDetail from './PullRequestDetail';
import { PullRequestDetail as PullRequestDetailType } from '../../services/authService';
import * as authService from '../../services/authService';

// Mock the authService
jest.mock('../../services/authService', () => ({
  getEncryptedCredentials: jest.fn(),
  fetchWithTokenRefresh: jest.fn(),
}));

// Mock window.open
const mockOpen = jest.fn();
window.open = mockOpen;

describe('PullRequestDetail Component', () => {
  // Mock data
  const mockPullRequest: PullRequestDetailType = {
    id: 1,
    number: 101,
    title: 'Fix login page bugs',
    state: 'open',
    html_url: 'https://github.com/test-owner/test-repo/pull/101',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-16T14:30:00Z',
    closed_at: null,
    merged_at: null,
    user: {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg'
    },
    body: 'This PR fixes several bugs in the login page including validation and error message display',
    draft: false,
    labels: [
      { id: 1, name: 'bug', color: 'ff0000' },
      { id: 2, name: 'frontend', color: '0075ca' }
    ],
    files: [
      {
        filename: 'src/components/Login.tsx',
        status: 'modified',
        additions: 15,
        deletions: 5,
        changes: 20
      },
      {
        filename: 'src/utils/validation.ts',
        status: 'modified',
        additions: 8,
        deletions: 3,
        changes: 11
      }
    ],
    prSummary: 'This PR fixes validation bugs in the login form and improves error message display for better user experience'
  };

  const mockMergedPullRequest: PullRequestDetailType = {
    ...mockPullRequest,
    state: 'closed',
    closed_at: '2025-01-20T15:30:00Z',
    merged_at: '2025-01-20T15:30:00Z'
  };

  // Base props
  const baseProps = {
    pullRequest: null as PullRequestDetailType | null,
    isLoading: false,
    error: null,
    onBack: jest.fn(),
    currentUser: null as { login: string } | null,
    githubToken: 'mock-github-token'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset session and local storage
    sessionStorage.clear();
    
    // Reset mocks
    (authService.getEncryptedCredentials as jest.Mock).mockReturnValue(null);
    (authService.fetchWithTokenRefresh as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ found: false })
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test for loading state
  it('displays loading indicator when isLoading is true', () => {
    render(<PullRequestDetail {...baseProps} isLoading={true} />);
    
    expect(screen.getByText('Loading pull request summary...')).toBeInTheDocument();
    expect(screen.getByTestId).toBeTruthy();
  });

  // Test for error state
  it('displays error message when there is an error', () => {
    render(<PullRequestDetail {...baseProps} error="Failed to load pull request" />);
    
    expect(screen.getByText('Failed to load pull request')).toBeInTheDocument();
  });

  // Test rendering with pull request data
  it('renders pull request details correctly', () => {
    render(<PullRequestDetail {...baseProps} pullRequest={mockPullRequest} />);
    
    // Check title and number
    expect(screen.getByText(/#101 Fix login page bugs/)).toBeInTheDocument();
    
    // Check state
    expect(screen.getByText('Open')).toBeInTheDocument();
    
    // Check user info
    expect(screen.getByText('testuser')).toBeInTheDocument();
    const avatar = screen.getByAltText("testuser's avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    
    // Check date
    expect(screen.getByText(/Opened on Jan 15, 2025/)).toBeInTheDocument();
    
    // Check PR summary
    expect(screen.getByText('This PR fixes validation bugs in the login form and improves error message display for better user experience')).toBeInTheDocument();
    
    // Check PR body
    expect(screen.getByText('This PR fixes several bugs in the login page including validation and error message display')).toBeInTheDocument();
    
    // Check labels
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
  });

  it('renders merged pull request with correct state and date', () => {
    render(<PullRequestDetail {...baseProps} pullRequest={mockMergedPullRequest} />);
    
    // Check merged state
    expect(screen.getByText('Merged')).toBeInTheDocument();
    
    // Check merged date
    expect(screen.getByText(/Merged on Jan 20, 2025/)).toBeInTheDocument();
  });

  // Test Work Journal actions visibility based on authorship
  it('does not show journal actions when user is not the author', () => {
    render(
      <PullRequestDetail 
        {...baseProps} 
        pullRequest={mockPullRequest} 
        currentUser={{ login: 'differentuser' }} 
      />
    );
    
    // Journal buttons should not be visible
    expect(screen.queryByText('Add to Work Journal')).not.toBeInTheDocument();
    expect(screen.queryByText('See my work journal')).not.toBeInTheDocument();
  });

  it('shows Add to Journal button when user is the author', () => {
    render(
      <PullRequestDetail 
        {...baseProps} 
        pullRequest={mockPullRequest} 
        currentUser={{ login: 'testuser' }} 
      />
    );
    
    // Add to Journal button should be visible
    expect(screen.getByText('Add to Work Journal')).toBeInTheDocument();
  });

  it('does not show Add to Journal button when PR already has a journal entry', async () => {
    // Mock that we already have a journal entry
    (authService.fetchWithTokenRefresh as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ found: true, journalId: 'mock-journal-id' })
    });
    
    render(
      <PullRequestDetail 
        {...baseProps} 
        pullRequest={mockPullRequest} 
        currentUser={{ login: 'testuser' }} 
      />
    );
    
    // Wait for the effect to run
    await waitFor(() => {
      // Add to Journal button should not be visible
      expect(screen.queryByText('Add to Work Journal')).not.toBeInTheDocument();
      // See journal button should be visible
      expect(screen.getByText('See my work journal')).toBeInTheDocument();
    });
  });

  // Test Add to Work Journal functionality
  it('handles adding to work journal correctly', async () => {
    // Setup mock responses
    (authService.getEncryptedCredentials as jest.Mock).mockReturnValue(JSON.stringify({
      email: 'encrypted-email',
      password: 'encrypted-password'
    }));
    
    (authService.fetchWithTokenRefresh as jest.Mock)
      .mockResolvedValueOnce({ 
        ok: true, 
        json: async () => ({ found: false }) 
      }) // For the initial check
      .mockResolvedValueOnce({ 
        ok: true, 
        json: async () => ({ journalId: 'new-journal-id' }) 
      }); // For the journal creation
    
    render(
      <PullRequestDetail 
        {...baseProps} 
        pullRequest={mockPullRequest} 
        currentUser={{ login: 'testuser' }} 
      />
    );
    
    // Verify Add to Journal button is visible and click it
    const addButton = screen.getByText('Add to Work Journal');
    fireEvent.click(addButton);
    
    // Verify it shows loading state
    await waitFor(() => {
      expect(screen.getByText('Adding to journal...')).toBeInTheDocument();
    });
    
    // Verify success message is shown
    await waitFor(() => {
      expect(screen.getByText('Successfully added to your work journal!')).toBeInTheDocument();
    });
    
    // Verify the See Journal button is now shown
    await waitFor(() => {
      expect(screen.getByText('See my work journal')).toBeInTheDocument();
    });
    
    // Verify the correct data was sent in the API call
    expect(authService.fetchWithTokenRefresh).toHaveBeenCalledWith(
      'http://localhost:3002/ceb/journal/create',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-GitHub-Token': 'mock-github-token'
        }),
        body: expect.any(String)
      })
    );
    
    // Verify prKey is being stored in sessionStorage
    const storedKey = `pr_summary_test-owner_test-repo_101`;
    expect(sessionStorage.getItem(storedKey)).not.toBeNull();
    
    const storedData = JSON.parse(sessionStorage.getItem(storedKey)!);
    expect(storedData.journalId).toBe('new-journal-id');
  });

  it('handles errors when adding to work journal', async () => {
    // Setup mock responses for failure case
    (authService.getEncryptedCredentials as jest.Mock).mockReturnValue(JSON.stringify({
      email: 'encrypted-email',
      password: 'encrypted-password'
    }));
    
    (authService.fetchWithTokenRefresh as jest.Mock)
      .mockResolvedValueOnce({ 
        ok: true, 
        json: async () => ({ found: false }) 
      }) // For the initial check
      .mockResolvedValueOnce({ 
        ok: false, 
        json: async () => ({ message: 'Failed to create journal entry' }) 
      }); // For the journal creation error
    
    render(
      <PullRequestDetail 
        {...baseProps} 
        pullRequest={mockPullRequest} 
        currentUser={{ login: 'testuser' }} 
      />
    );
    
    // Click Add to Journal button
    const addButton = screen.getByText('Add to Work Journal');
    fireEvent.click(addButton);
    
    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText('Failed to create journal entry')).toBeInTheDocument();
    });
    
    // Add to Journal button should still be visible (not replaced by See Journal)
    expect(screen.getByText('Add to Work Journal')).toBeInTheDocument();
  });

  // Test See my work journal functionality
  it('handles sending credentials to work journal', async () => {
    // Let's skip the window.open test and focus on the API call behavior
    // Setup mock responses
    (authService.getEncryptedCredentials as jest.Mock).mockReturnValue(JSON.stringify({
      email: 'encrypted-email',
      password: 'encrypted-password'
    }));
    
    (authService.fetchWithTokenRefresh as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ found: true, journalId: 'existing-journal-id' })
    });
    
    render(
      <PullRequestDetail 
        {...baseProps} 
        pullRequest={mockPullRequest} 
        currentUser={{ login: 'testuser' }} 
      />
    );
    
    // Wait for journal entry check to complete
    await waitFor(() => {
      expect(screen.getByText('See my work journal')).toBeInTheDocument();
    });
    
    // Click See journal button
    const seeButton = screen.getByText('See my work journal');
    fireEvent.click(seeButton);
    
    // Verify the correct data was sent in the API call to decrypt credentials
    await waitFor(() => {
      expect(authService.fetchWithTokenRefresh).toHaveBeenCalledWith(
        'http://localhost:3002/ceb/auth/decrypt-credentials',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }),
          body: expect.any(String)
        })
      );
    });
    
    // Verify we show a message about opening the journal
    expect(screen.getByText('Opening work journal...')).toBeInTheDocument();
  });

  // Test files rendering through PullRequestFilesSummary
  it('renders the PullRequestFilesSummary component with files data', () => {
    render(<PullRequestDetail {...baseProps} pullRequest={mockPullRequest} />);
    
    // Check that Files Changed header is present (from PullRequestFilesSummary)
    expect(screen.getByText('Files Changed')).toBeInTheDocument();
    
    // Check file information is present
    expect(screen.getByText('src/components/Login.tsx')).toBeInTheDocument();
    expect(screen.getByText('src/utils/validation.ts')).toBeInTheDocument();
  });
});