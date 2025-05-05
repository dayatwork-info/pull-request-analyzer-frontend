import React from 'react';
import { render, screen } from '@testing-library/react';
import PullRequestFilesSummary, { PullRequestFile } from './PullRequestFilesSummary';

describe('PullRequestFilesSummary Component', () => {
  // Mock data
  const mockFiles: PullRequestFile[] = [
    {
      filename: 'src/components/Login.tsx',
      status: 'modified',
      additions: 15,
      deletions: 5,
      changes: 20
    },
    {
      filename: 'src/services/authService.ts',
      status: 'modified',
      additions: 8,
      deletions: 3,
      changes: 11
    },
    {
      filename: 'src/components/NewComponent.tsx',
      status: 'added',
      additions: 45,
      deletions: 0,
      changes: 45
    },
    {
      filename: 'src/components/OldComponent.tsx',
      status: 'removed',
      additions: 0,
      deletions: 30,
      changes: 30
    },
    {
      filename: 'src/components/RenamedComponent.tsx',
      status: 'renamed',
      additions: 2,
      deletions: 2,
      changes: 4
    }
  ];

  // Test rendering with files data
  it('renders the component with proper header', () => {
    render(<PullRequestFilesSummary files={mockFiles} />);
    
    expect(screen.getByText('Files Changed')).toBeInTheDocument();
  });

  it('displays all files in the list', () => {
    render(<PullRequestFilesSummary files={mockFiles} />);
    
    // Check if all filenames are displayed
    expect(screen.getByText('src/components/Login.tsx')).toBeInTheDocument();
    expect(screen.getByText('src/services/authService.ts')).toBeInTheDocument();
    expect(screen.getByText('src/components/NewComponent.tsx')).toBeInTheDocument();
    expect(screen.getByText('src/components/OldComponent.tsx')).toBeInTheDocument();
    expect(screen.getByText('src/components/RenamedComponent.tsx')).toBeInTheDocument();
  });

  it('displays status for each file', () => {
    render(<PullRequestFilesSummary files={mockFiles} />);
    
    // We should have 2 modified files, 1 added, 1 removed, and 1 renamed
    const modifiedElements = screen.getAllByText('modified');
    expect(modifiedElements).toHaveLength(2);
    
    expect(screen.getByText('added')).toBeInTheDocument();
    expect(screen.getByText('removed')).toBeInTheDocument();
    expect(screen.getByText('renamed')).toBeInTheDocument();
  });

  it('displays changes count for each file', () => {
    render(<PullRequestFilesSummary files={mockFiles} />);
    
    // Check for additions for each file
    expect(screen.getByText('+15')).toBeInTheDocument();
    expect(screen.getByText('+8')).toBeInTheDocument();
    expect(screen.getByText('+45')).toBeInTheDocument();
    expect(screen.getByText('+0')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    
    // Check for deletions for each file
    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('-3')).toBeInTheDocument();
    expect(screen.getByText('-0')).toBeInTheDocument();
    expect(screen.getByText('-30')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  // Test summary statistics
  it('calculates and displays correct summary statistics', () => {
    render(<PullRequestFilesSummary files={mockFiles} />);
    
    // Total file count should be 5
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Total changes should be sum of all changes: 20 + 11 + 45 + 30 + 4 = 110
    expect(screen.getByText('Changes')).toBeInTheDocument();
    expect(screen.getByText('110')).toBeInTheDocument();
    
    // Total additions should be sum of all additions: 15 + 8 + 45 + 0 + 2 = 70
    expect(screen.getByText('Additions')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    
    // Total deletions should be sum of all deletions: 5 + 3 + 0 + 30 + 2 = 40
    expect(screen.getByText('Deletions')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  // Test empty files list
  it('displays correct message when files list is empty', () => {
    render(<PullRequestFilesSummary files={[]} />);
    
    expect(screen.getByText('No file changes available')).toBeInTheDocument();
  });

  it('displays zero values in summary when files list is empty', () => {
    render(<PullRequestFilesSummary files={[]} />);
    
    // All summary values should be 0
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues).toHaveLength(4); // Files, Changes, Additions, Deletions
  });

  // Test null files
  it('handles null files properly', () => {
    // @ts-ignore - intentionally passing null for testing
    render(<PullRequestFilesSummary files={null} />);
    
    expect(screen.getByText('No file changes available')).toBeInTheDocument();
    
    // All summary values should be 0
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues).toHaveLength(4); // Files, Changes, Additions, Deletions
  });

  // Test file status styling
  it('applies correct CSS classes based on file status', () => {
    const { container } = render(<PullRequestFilesSummary files={mockFiles} />);
    
    // Check for status-specific classes
    expect(container.querySelector('.file-status-modified')).toBeInTheDocument();
    expect(container.querySelector('.file-status-added')).toBeInTheDocument();
    expect(container.querySelector('.file-status-removed')).toBeInTheDocument();
    expect(container.querySelector('.file-status-renamed')).toBeInTheDocument();
  });

  it('applies correct CSS class for unknown status', () => {
    const filesWithUnknownStatus: PullRequestFile[] = [
      {
        filename: 'src/test.ts',
        status: 'unknown',
        additions: 5,
        deletions: 2,
        changes: 7
      }
    ];
    
    const { container } = render(<PullRequestFilesSummary files={filesWithUnknownStatus} />);
    
    // Should not have any specific status class
    expect(container.querySelector('.file-status-unknown')).not.toBeInTheDocument();
    
    // But should still have the base file-status class
    expect(container.querySelector('.file-status')).toBeInTheDocument();
  });
});