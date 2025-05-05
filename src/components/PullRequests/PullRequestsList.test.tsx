import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PullRequestsList, { PullRequest } from './PullRequestsList';
import { Contributor } from '../../services/authService';

describe('PullRequestsList Component', () => {
  // Mock data
  const mockPullRequests: PullRequest[] = [
    {
      id: 1,
      number: 101,
      title: 'Fix bug in login component',
      state: 'open',
      html_url: 'https://github.com/test-owner/test-repo/pull/101',
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-16T14:30:00Z',
      closed_at: null,
      merged_at: null,
      user: {
        login: 'user1',
        avatar_url: 'https://example.com/avatar1.jpg'
      },
      body: 'This PR fixes a critical bug in the login component that was causing users to be logged out unexpectedly.',
      draft: false,
      labels: [
        { id: 1, name: 'bug', color: 'ff0000' }
      ]
    },
    {
      id: 2,
      number: 102,
      title: 'Add new feature to dashboard',
      state: 'closed',
      html_url: 'https://github.com/test-owner/test-repo/pull/102',
      created_at: '2025-01-10T09:00:00Z',
      updated_at: '2025-01-12T16:45:00Z',
      closed_at: '2025-01-12T16:45:00Z',
      merged_at: '2025-01-12T16:45:00Z',
      user: {
        login: 'user2',
        avatar_url: 'https://example.com/avatar2.jpg'
      },
      body: 'This PR adds a new analytics widget to the dashboard.',
      draft: false,
      labels: [
        { id: 2, name: 'enhancement', color: '0075ca' },
        { id: 3, name: 'dashboard', color: '5319e7' }
      ]
    }
  ];

  const mockContributors: Contributor[] = [
    {
      id: 1,
      login: 'user1',
      avatar_url: 'https://example.com/avatar1.jpg',
      contributions: 42
    },
    {
      id: 2,
      login: 'user2',
      avatar_url: 'https://example.com/avatar2.jpg',
      contributions: 38
    }
  ];

  // Base props
  const baseProps = {
    pullRequests: [] as PullRequest[],
    isLoading: false,
    error: null,
    onBack: jest.fn(),
    repoName: 'test-repo',
    onPullRequestClick: jest.fn(),
    onLoadMore: jest.fn(),
    hasMorePulls: false,
    isLoadingMore: false,
    contributors: [] as Contributor[],
    isLoadingContributors: false,
    selectedContributor: null,
    onContributorFilter: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test basic rendering
  it('renders the component with the correct title', () => {
    render(<PullRequestsList {...baseProps} />);
    
    expect(screen.getByText('Pull Requests for test-repo')).toBeInTheDocument();
  });

  // Test rendering with pull requests
  it('renders a list of pull requests when provided', () => {
    render(<PullRequestsList {...baseProps} pullRequests={mockPullRequests} />);
    
    // Check if PR titles are rendered
    expect(screen.getByText(/#101 Fix bug in login component/)).toBeInTheDocument();
    expect(screen.getByText(/#102 Add new feature to dashboard/)).toBeInTheDocument();
    
    // Check if usernames are displayed
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    
    // Check if PR states are displayed
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Merged')).toBeInTheDocument();
  });

  it('displays PR dates correctly', () => {
    render(<PullRequestsList {...baseProps} pullRequests={mockPullRequests} />);
    
    // Open PR shows created date
    expect(screen.getByText(/Opened on Jan 15, 2025/)).toBeInTheDocument();
    
    // Merged PR shows merged date
    expect(screen.getByText(/Merged on Jan 12, 2025/)).toBeInTheDocument();
  });

  it('displays PR descriptions with truncation if needed', () => {
    render(<PullRequestsList {...baseProps} pullRequests={mockPullRequests} />);
    
    // Short description should be fully displayed
    expect(screen.getByText('This PR adds a new analytics widget to the dashboard.')).toBeInTheDocument();
    
    // Long description would be truncated but this one is under 200 chars
    expect(screen.getByText('This PR fixes a critical bug in the login component that was causing users to be logged out unexpectedly.')).toBeInTheDocument();
  });

  it('displays PR labels with correct styling', () => {
    render(<PullRequestsList {...baseProps} pullRequests={mockPullRequests} />);
    
    // Check if labels are displayed
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('enhancement')).toBeInTheDocument();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  // Test loading state
  it('displays loading indicator when isLoading is true', () => {
    render(<PullRequestsList {...baseProps} isLoading={true} />);
    
    expect(screen.getByText('Loading pull requests...')).toBeInTheDocument();
  });

  it('displays loading more indicator when isLoadingMore is true', () => {
    render(
      <PullRequestsList 
        {...baseProps} 
        pullRequests={mockPullRequests} 
        isLoadingMore={true} 
        hasMorePulls={true} 
      />
    );
    
    expect(screen.getByText('Loading more pull requests...')).toBeInTheDocument();
  });

  it('displays a message when all PRs are loaded', () => {
    render(
      <PullRequestsList 
        {...baseProps} 
        pullRequests={mockPullRequests} 
        hasMorePulls={false} 
      />
    );
    
    expect(screen.getByText('No more pull requests to load')).toBeInTheDocument();
  });

  // Test error state
  it('displays error message when there is an error', () => {
    render(<PullRequestsList {...baseProps} error="Failed to load pull requests" />);
    
    expect(screen.getByText('Failed to load pull requests')).toBeInTheDocument();
  });

  // Test empty state
  it('displays message when there are no pull requests', () => {
    render(<PullRequestsList {...baseProps} pullRequests={[]} />);
    
    expect(screen.getByText('No pull requests found for this repository.')).toBeInTheDocument();
  });

  // Test contributors filter
  it('renders contributors filter when contributors are provided', () => {
    render(
      <PullRequestsList 
        {...baseProps} 
        pullRequests={mockPullRequests} 
        contributors={mockContributors} 
      />
    );
    
    expect(screen.getByText('Filter by PR creator')).toBeInTheDocument();
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check if all contributors are in the dropdown
    expect(screen.getByRole('option', { name: 'All Contributors' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'user1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'user2' })).toBeInTheDocument();
  });

  it('calls onContributorFilter when a contributor is selected', async () => {
    render(
      <PullRequestsList 
        {...baseProps} 
        pullRequests={mockPullRequests} 
        contributors={mockContributors} 
      />
    );
    
    // Select a contributor
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'user1');
    
    expect(baseProps.onContributorFilter).toHaveBeenCalledWith('user1');
  });

  it('shows clear button when a contributor is selected', () => {
    render(
      <PullRequestsList 
        {...baseProps} 
        pullRequests={mockPullRequests} 
        contributors={mockContributors} 
        selectedContributor="user1" 
      />
    );
    
    const clearButton = screen.getByRole('button', { name: 'Clear' });
    expect(clearButton).toBeInTheDocument();
    
    // Click the clear button
    fireEvent.click(clearButton);
    
    expect(baseProps.onContributorFilter).toHaveBeenCalledWith(null);
  });

  it('displays message when no PRs match the selected contributor', () => {
    render(
      <PullRequestsList 
        {...baseProps} 
        pullRequests={[]} 
        contributors={mockContributors} 
        selectedContributor="user3" 
      />
    );
    
    expect(screen.getByText(/No pull requests found for contributor/)).toBeInTheDocument();
    expect(screen.getByText('user3')).toBeInTheDocument();
    
    const clearFilterButton = screen.getByRole('button', { name: 'Clear filter' });
    expect(clearFilterButton).toBeInTheDocument();
    
    // Click the clear filter button
    fireEvent.click(clearFilterButton);
    
    expect(baseProps.onContributorFilter).toHaveBeenCalledWith(null);
  });

  // Test pull request click handling
  it('calls onPullRequestClick when a PR is clicked', () => {
    render(<PullRequestsList {...baseProps} pullRequests={mockPullRequests} />);
    
    // Click on the first PR
    const firstPR = screen.getByText(/#101 Fix bug in login component/).closest('.pr-item');
    fireEvent.click(firstPR!);
    
    expect(baseProps.onPullRequestClick).toHaveBeenCalledWith(101);
  });
});