import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from './Auth';
import * as authService from '../../services/authService';

// Mock the authService
jest.mock('../../services/authService', () => ({
  login: jest.fn(),
  signup: jest.fn(),
  setAccessToken: jest.fn(),
}));

describe('Auth Component', () => {
  // Mock props
  const mockOnLogin = jest.fn();
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form by default', () => {
    render(<Auth onLogin={mockOnLogin} />);
    
    // Check for login heading
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /need an account\? sign up/i })).toBeInTheDocument();
  });

  it('switches to signup form when signup button is clicked', async () => {
    render(<Auth onLogin={mockOnLogin} />);
    
    // Initially in login mode
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    
    // Click the signup link
    const signupButton = screen.getByRole('button', { name: /need an account\? sign up/i });
    await userEvent.click(signupButton);
    
    // Should now be in signup mode
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /already have an account\? login/i })).toBeInTheDocument();
  });

  it('switches back to login form when login button is clicked from signup', async () => {
    render(<Auth onLogin={mockOnLogin} />);
    
    // Switch to signup first
    const signupButton = screen.getByRole('button', { name: /need an account\? sign up/i });
    await userEvent.click(signupButton);
    
    // Now switch back to login
    const loginButton = screen.getByRole('button', { name: /already have an account\? login/i });
    await userEvent.click(loginButton);
    
    // Should be back in login mode
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  it('displays validation error when submitting empty form', async () => {
    render(<Auth onLogin={mockOnLogin} />);
    
    // Submit the form without entering data
    const submitButton = screen.getByRole('button', { name: /login/i });
    await userEvent.click(submitButton);
    
    // Should show validation error
    expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
    
    // Login function should not be called
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('calls login function with correct data on login form submission', async () => {
    // Mock successful login response
    const mockLoginResponse = { accessToken: 'test-token' };
    (authService.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
    
    render(<Auth onLogin={mockOnLogin} />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /login/i });
    await userEvent.click(submitButton);
    
    // Login function should be called with correct data
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    
    // onLogin callback should be called with token
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test-token');
    });
  });

  it('calls signup function with correct data on signup form submission', async () => {
    // Mock successful signup response
    const mockSignupResponse = { accessToken: 'new-user-token' };
    (authService.signup as jest.Mock).mockResolvedValueOnce(mockSignupResponse);
    
    render(<Auth onLogin={mockOnLogin} />);
    
    // Switch to signup
    const signupButton = screen.getByRole('button', { name: /need an account\? sign up/i });
    await userEvent.click(signupButton);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'newpassword123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await userEvent.click(submitButton);
    
    // Signup function should be called with correct data
    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith('newuser@example.com', 'newpassword123');
    });
    
    // onLogin callback should be called with token
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('new-user-token');
    });
  });

  it('displays error message when login fails', async () => {
    // Mock failed login
    const errorMsg = 'Invalid credentials';
    (authService.login as jest.Mock).mockRejectedValueOnce({ message: errorMsg });
    
    render(<Auth onLogin={mockOnLogin} />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /login/i });
    await userEvent.click(submitButton);
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
    
    // onLogin should not be called
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('displays error message when signup fails', async () => {
    // Mock failed signup
    const errorMsg = 'Email already in use';
    (authService.signup as jest.Mock).mockRejectedValueOnce({ message: errorMsg });
    
    render(<Auth onLogin={mockOnLogin} />);
    
    // Switch to signup
    const signupButton = screen.getByRole('button', { name: /need an account\? sign up/i });
    await userEvent.click(signupButton);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await userEvent.click(submitButton);
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
    
    // onLogin should not be called
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('displays general error for signup without token', async () => {
    // Mock signup that returns a response without a token
    (authService.signup as jest.Mock).mockResolvedValueOnce({ message: 'Success but no token' });
    
    render(<Auth onLogin={mockOnLogin} />);
    
    // Switch to signup
    const signupButton = screen.getByRole('button', { name: /need an account\? sign up/i });
    await userEvent.click(signupButton);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await userEvent.click(submitButton);
    
    // Should display generic error message
    await waitFor(() => {
      expect(screen.getByText('Signup failed')).toBeInTheDocument();
    });
  });

  it('disables form controls during submission', async () => {
    // Add a delay to the mock to simulate network request
    (authService.login as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ accessToken: 'test-token' }), 100);
      });
    });
    
    render(<Auth onLogin={mockOnLogin} />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /login/i });
    await userEvent.click(submitButton);
    
    // Form controls should be disabled during submission
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /need an account\? sign up/i })).toBeDisabled();
    
    // Button text should change
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test-token');
    });
  });
});