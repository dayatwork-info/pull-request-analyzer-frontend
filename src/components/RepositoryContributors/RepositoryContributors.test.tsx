import React from 'react';
import { render, screen } from '@testing-library/react';
import RepositoryContributors from './RepositoryContributors';
import { Contributor } from '../../services/authService';

describe('RepositoryContributors Component', () => {
  // Mock data
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
    },
    {
      id: 3,
      login: 'user3',
      avatar_url: 'https://example.com/avatar3.jpg',
      contributions: 100
    }
  ];

  // Base props
  const baseProps = {
    contributors: null as Contributor[] | null | undefined,
    isLoading: false,
    repoName: 'test-repo',
    owner: 'test-owner'
  };

  // Test rendering with contributors
  it('renders the component with proper heading', () => {
    render(<RepositoryContributors {...baseProps} />);
    
    expect(screen.getByText('Contributors to test-owner/test-repo')).toBeInTheDocument();
  });

  it('displays contributors when they are provided', () => {
    render(<RepositoryContributors {...baseProps} contributors={mockContributors} />);
    
    // Check if all contributors are displayed
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('user3')).toBeInTheDocument();
    
    // Check if contribution counts are displayed
    expect(screen.getByText('42 contributions')).toBeInTheDocument();
    expect(screen.getByText('38 contributions')).toBeInTheDocument();
    expect(screen.getByText('100 contributions')).toBeInTheDocument();
    
    // Check if avatars are displayed
    const avatars = screen.getAllByRole('img');
    expect(avatars).toHaveLength(3);
    expect(avatars[0]).toHaveAttribute('alt', "user3's avatar"); // First should be user3 (most contributions)
    expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar3.jpg');
  });

  it('sorts contributors by number of contributions in descending order', () => {
    render(<RepositoryContributors {...baseProps} contributors={mockContributors} />);
    
    // Get all contributor elements
    const contributorCards = screen.getAllByRole('heading', { level: 3 });
    
    // First should be user3 (most contributions)
    expect(contributorCards[0].textContent).toBe('user3');
    // Second should be user1
    expect(contributorCards[1].textContent).toBe('user1');
    // Third should be user2
    expect(contributorCards[2].textContent).toBe('user2');
  });

  it('includes GitHub profile links for contributors', () => {
    render(<RepositoryContributors {...baseProps} contributors={mockContributors} />);
    
    // Check if links point to correct GitHub profiles
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    
    // Links should point to GitHub profiles
    expect(links[0]).toHaveAttribute('href', 'https://github.com/user3');
    expect(links[1]).toHaveAttribute('href', 'https://github.com/user1');
    expect(links[2]).toHaveAttribute('href', 'https://github.com/user2');
    
    // Links should open in new tabs
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  // Test loading state
  it('displays loading indicator when isLoading is true', () => {
    render(<RepositoryContributors {...baseProps} isLoading={true} />);
    
    expect(screen.getByText('Loading contributors...')).toBeInTheDocument();
    // Loading spinner should be visible
    expect(screen.getByText('Loading contributors...').previousSibling).toBeInTheDocument();
  });

  it('does not display loading indicator when isLoading is false', () => {
    render(<RepositoryContributors {...baseProps} />);
    
    expect(screen.queryByText('Loading contributors...')).not.toBeInTheDocument();
  });

  // Test empty state
  it('displays message when no contributors are found', () => {
    render(<RepositoryContributors {...baseProps} contributors={[]} />);
    
    expect(screen.getByText('No contributors found for this repository.')).toBeInTheDocument();
  });

  it('displays message when contributors is null', () => {
    render(<RepositoryContributors {...baseProps} contributors={null} />);
    
    expect(screen.getByText('No contributors found for this repository.')).toBeInTheDocument();
  });

  it('displays message when contributors is undefined', () => {
    render(<RepositoryContributors {...baseProps} contributors={undefined} />);
    
    expect(screen.getByText('No contributors found for this repository.')).toBeInTheDocument();
  });

  // Test singular vs plural text
  it('displays singular text for one contribution', () => {
    const singleContributor = [{
      id: 1,
      login: 'user1',
      avatar_url: 'https://example.com/avatar1.jpg',
      contributions: 1
    }];
    
    render(<RepositoryContributors {...baseProps} contributors={singleContributor} />);
    
    expect(screen.getByText('1 contribution')).toBeInTheDocument();
  });

  it('displays plural text for multiple contributions', () => {
    const multiContributor = [{
      id: 1,
      login: 'user1',
      avatar_url: 'https://example.com/avatar1.jpg',
      contributions: 2
    }];
    
    render(<RepositoryContributors {...baseProps} contributors={multiContributor} />);
    
    expect(screen.getByText('2 contributions')).toBeInTheDocument();
  });
});