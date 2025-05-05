import React from 'react';
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import * as authService from './services/authService';

// Mock the authService
jest.mock('./services/authService', () => ({
  isAuthenticated: jest.fn(),
  clearSession: jest.fn(),
  fetchGitHubUser: jest.fn(),
  fetchGitHubRepositories: jest.fn(),
  fetchGitHubRepoPulls: jest.fn(),
  fetchPullRequestDetail: jest.fn(),
  fetchRepoContributors: jest.fn()
}));

// Mock child components to simplify testing
jest.mock('./components/Auth/Auth', () => {
  return {
    __esModule: true,
    default: ({ onLogin }: { onLogin: (token: string) => void }) => {
      return (
        <div data-testid="auth-component">
          <button onClick={() => onLogin('test-token')}>Mock Login</button>
        </div>
      );
    }
  };
});

jest.mock('./components/Navigation/Navbar', () => {
  return {
    __esModule: true,
    default: ({ title, onLogout }: { title: string, onLogout?: () => void }) => (
      <div data-testid="navbar" onClick={onLogout}>
        {title}
        {onLogout && <button>Logout</button>}
      </div>
    )
  };
});

// Simplified basic tests
describe('App Component - Basic Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  test('renders login screen when not authenticated', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    
    render(<App />);
    
    expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    expect(screen.getByText('Mock Login')).toBeInTheDocument();
  });

  test('renders main app when authenticated', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    render(<App />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('calls clearSession on logout', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    render(<App />);
    
    // Wrap the state update in act() imported from React
    await act(async () => {
      const navbar = screen.getByTestId('navbar');
      navbar.click(); // Trigger the onLogout function
    });
    
    expect(authService.clearSession).toHaveBeenCalled();
  });
});