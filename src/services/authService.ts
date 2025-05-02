const API_URL = 'http://localhost:3001/auth'; // Local authentication API endpoint
const GITHUB_API_URL = 'http://localhost:3001/github'; // Local GitHub API endpoint

// Development mode flag
const isDevelopment = process.env.NODE_ENV === 'development';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  name?: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  visibility: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
  };
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  draft: boolean;
  labels: {
    id: number;
    name: string;
    color: string;
  }[];
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
  message?: string;
}

interface SignupResponse {
  verificationToken: string;
  message?: string;
}

interface VerifyResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
  message?: string;
}

interface AuthError {
  message: string;
  errors?: string[];
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  // For development mode, optionally use simulated login
  if (isDevelopment && false) { // Set to true to use dev mode login
    return devModeLogin();
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.message || 'Login failed',
        errors: data.errors,
      };
    }

    // Store tokens from the response
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    return data;
  } catch (error) {
    throw error instanceof Error 
      ? { message: error.message } 
      : error as AuthError;
  }
};

export const signup = async (email: string, password: string): Promise<SignupResponse> => {
  // For development mode, optionally use simulated signup
  if (isDevelopment && false) { // Set to true to use dev mode signup
    return devModeSignup();
  }

  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.message || 'Signup failed',
        errors: data.errors,
      };
    }

    return data;
  } catch (error) {
    throw error instanceof Error 
      ? { message: error.message } 
      : error as AuthError;
  }
};

export const verifyAccount = async (token: string): Promise<VerifyResponse> => {
  // For development mode, optionally use simulated verification
  if (isDevelopment && false) { // Set to true to use dev mode verification
    return devModeVerify();
  }

  try {
    const response = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.message || 'Verification failed',
        errors: data.errors,
      };
    }

    // Store tokens from the response
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }
    
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }

    return data;
  } catch (error) {
    throw error instanceof Error 
      ? { message: error.message } 
      : error as AuthError;
  }
};

// Development helper functions to simulate auth flows
export const devModeLogin = (): Promise<LoginResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAccessToken = 'dev-access-token-' + Math.random().toString(36).substring(2, 15);
      const mockRefreshToken = 'dev-refresh-token-' + Math.random().toString(36).substring(2, 15);
      
      setAccessToken(mockAccessToken);
      setRefreshToken(mockRefreshToken);
      
      resolve({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Development User'
        }
      });
    }, 500); // Simulate network delay
  });
};

export const devModeSignup = (): Promise<SignupResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const verificationToken = 'dev-verification-' + Math.random().toString(36).substring(2, 15);
      
      resolve({
        verificationToken,
        message: 'Verification token has been sent to your email'
      });
    }, 500); // Simulate network delay
  });
};

export const devModeVerify = (): Promise<VerifyResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAccessToken = 'dev-access-token-' + Math.random().toString(36).substring(2, 15);
      const mockRefreshToken = 'dev-refresh-token-' + Math.random().toString(36).substring(2, 15);
      
      setAccessToken(mockAccessToken);
      setRefreshToken(mockRefreshToken);
      
      resolve({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Development User'
        },
        message: 'Account successfully verified'
      });
    }, 500); // Simulate network delay
  });
};

/**
 * Token management functions
 * Using sessionStorage which clears when the browser tab is closed,
 * providing better security than localStorage.
 */
export const getAccessToken = (): string | null => {
  return sessionStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  return sessionStorage.getItem('refresh_token');
};

export const setAccessToken = (token: string): void => {
  sessionStorage.setItem('access_token', token);
};

export const setRefreshToken = (token: string): void => {
  sessionStorage.setItem('refresh_token', token);
};

export const removeAccessToken = (): void => {
  sessionStorage.removeItem('access_token');
};

export const removeRefreshToken = (): void => {
  sessionStorage.removeItem('refresh_token');
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

/**
 * Refresh token functionality to get new access token when it expires
 */
export const refreshTokens = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      // If refresh token is invalid, clear the session
      clearSession();
      return false;
    }
    
    const data = await response.json();
    
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      
      // If a new refresh token is returned, update it
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

/**
 * Clears all session data - useful for logout or when auth errors occur
 */
export const clearSession = (): void => {
  // Clear all auth-related items from sessionStorage
  removeAccessToken();
  removeRefreshToken();
  
  // Add any additional session items to clear here
};

/**
 * Utility function to handle API requests with automatic token refresh
 * This will automatically attempt to refresh the token if a request fails with a 401 status
 */
export const fetchWithTokenRefresh = async (
  url: string, 
  options: RequestInit = {}, 
  retryAttempt: number = 0
): Promise<Response> => {
  // Don't allow infinite retries
  if (retryAttempt > 1) {
    throw new Error('Authentication failed after token refresh attempt');
  }
  
  // Add auth header if not already present
  const headers = new Headers(options.headers || {});
  const accessToken = getAccessToken();
  
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // If unauthorized and we have a refresh token, try to refresh and retry
  if (response.status === 401 && retryAttempt === 0) {
    const refreshSuccessful = await refreshTokens();
    
    if (refreshSuccessful) {
      // Retry the request with the new token
      return fetchWithTokenRefresh(url, options, retryAttempt + 1);
    }
  }
  
  return response;
};

/**
 * GitHub API related functions
 */
export const fetchGitHubUser = async (githubToken: string): Promise<GitHubUser> => {
  try {
    const response = await fetchWithTokenRefresh(`${GITHUB_API_URL}/user`, {
      method: 'GET',
      headers: {
        'X-GitHub-Token': githubToken,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    throw error;
  }
};

export const fetchGitHubRepositories = async (githubToken: string, page: number = 1): Promise<GitHubRepository[]> => {
  try {
    const response = await fetchWithTokenRefresh(`${GITHUB_API_URL}/repositories?page=${page}`, {
      method: 'GET',
      headers: {
        'X-GitHub-Token': githubToken,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub repositories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw error;
  }
};

export const fetchGitHubRepoPulls = async (
  githubToken: string, 
  owner: string, 
  repo: string,
  page: number = 1,
  perPage: number = 10
): Promise<GitHubPullRequest[]> => {
  try {
    const response = await fetchWithTokenRefresh(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: {
        'X-GitHub-Token': githubToken,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pull requests for ${owner}/${repo}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching pull requests for ${owner}/${repo}:`, error);
    throw error;
  }
};

export interface PullRequestDetail {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  draft: boolean;
  labels: {
    id: number;
    name: string;
    color: string;
  }[];
  files_summary: {
    total_count: number;
    changes: number;
    additions: number;
    deletions: number;
    files: {
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      changes: number;
    }[];
  };
  prSummary?: string;
}

export const fetchPullRequestDetail = async (
  githubToken: string,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<PullRequestDetail> => {
  try {
    const response = await fetchWithTokenRefresh(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${pullNumber}`, {
      method: 'GET',
      headers: {
        'X-GitHub-Token': githubToken,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pull request details for ${owner}/${repo}#${pullNumber}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching pull request details for ${owner}/${repo}#${pullNumber}:`, error);
    throw error;
  }
};

// Helper for direct developer login bypass
export const bypassLogin = async (): Promise<void> => {
  if (isDevelopment) {
    try {
      // Try to use the development endpoint for instant login
      const response = await fetch(`${API_URL}/dev-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        return;
      }
    } catch (error) {
      console.log('Dev login endpoint not available, using mock tokens instead');
    }
    
    // Use our devModeLogin to provide consistent dev tokens
    try {
      const loginData = await devModeLogin();
      // Tokens are already set within devModeLogin
      return;
    } catch (error) {
      console.error('Error using dev mode login, falling back to basic mock tokens');
      
      // Ultimate fallback if even the devModeLogin fails
      const mockAccessToken = 'dev-access-token-' + Math.random().toString(36).substring(2, 15);
      const mockRefreshToken = 'dev-refresh-token-' + Math.random().toString(36).substring(2, 15);
      setAccessToken(mockAccessToken);
      setRefreshToken(mockRefreshToken);
    }
  }
};