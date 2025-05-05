import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';

describe('Navbar Component', () => {
  // Test basic rendering with required props
  it('renders the navbar with title', () => {
    render(<Navbar title="Test Title" />);
    
    expect(screen.getByRole('heading', { name: /test title/i })).toBeInTheDocument();
  });

  // Test back button rendering and functionality
  it('does not show back button by default', () => {
    render(<Navbar title="Test Title" />);
    
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('shows back button when showBackButton is true', () => {
    render(<Navbar title="Test Title" showBackButton={true} />);
    
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const mockOnBack = jest.fn();
    render(<Navbar title="Test Title" showBackButton={true} onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  // Test logout button rendering and functionality
  it('does not show logout button by default', () => {
    render(<Navbar title="Test Title" />);
    
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('shows logout button when showLogout is true', () => {
    render(<Navbar title="Test Title" showLogout={true} />);
    
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', () => {
    const mockOnLogout = jest.fn();
    render(<Navbar title="Test Title" showLogout={true} onLogout={mockOnLogout} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  // Test user info display
  it('does not show user info when username and avatarUrl are not provided', () => {
    render(<Navbar title="Test Title" />);
    
    expect(screen.queryByText(/testuser/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not show user info when only username is provided', () => {
    render(<Navbar title="Test Title" username="testuser" />);
    
    // The username shouldn't be visible without the avatar
    expect(screen.queryByText(/testuser/i)).not.toBeInTheDocument();
  });

  it('does not show user info when only avatarUrl is provided', () => {
    render(<Navbar title="Test Title" avatarUrl="https://example.com/avatar.jpg" />);
    
    // The avatar shouldn't be visible without the username
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows user info when both username and avatarUrl are provided', () => {
    render(
      <Navbar 
        title="Test Title" 
        username="testuser" 
        avatarUrl="https://example.com/avatar.jpg"
      />
    );
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    const avatar = screen.getByAltText("testuser's avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  // Test combinations of props
  it('renders with all optional props enabled', () => {
    const mockOnBack = jest.fn();
    const mockOnLogout = jest.fn();
    
    render(
      <Navbar 
        title="Full Navbar" 
        showBackButton={true}
        onBack={mockOnBack}
        showLogout={true}
        onLogout={mockOnLogout}
        username="testuser"
        avatarUrl="https://example.com/avatar.jpg"
      />
    );
    
    // Check that everything is rendered
    expect(screen.getByRole('heading', { name: /full navbar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByAltText("testuser's avatar")).toBeInTheDocument();
    
    // Test interactions
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });
});