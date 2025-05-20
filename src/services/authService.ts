// Use environment variables for API endpoints
const API_URL = process.env.REACT_APP_AUTH_API_URL;
const GITHUB_API_URL = process.env.REACT_APP_GITHUB_API_URL;

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
  encryptedCredentials?: string;
  user?: User;
  message?: string;
}

interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
  message?: string;
}

// AuthError interface removed to fix linting error
// interface AuthError {
//   message: string;
//   errors?: string[];
// }

export const login = async (email: string, password: string): Promise<LoginResponse> => {

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
      throw new Error(data.message || 'Login failed');
    }

    // Store tokens from the response
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    
    // Store encrypted credentials if available
    if (data.encryptedCredentials) {
      setEncryptedCredentials(data.encryptedCredentials);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Login failed');
    }
  }
};

export const signup = async (email: string, password: string): Promise<SignupResponse> => {

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
      throw new Error(data.message || 'Signup failed');
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
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Signup failed');
    }
  }
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

export const getEncryptedCredentials = (): string | null => {
  return sessionStorage.getItem('encrypted_credentials');
};

export const setAccessToken = (token: string): void => {
  sessionStorage.setItem('access_token', token);
};

export const setRefreshToken = (token: string): void => {
  sessionStorage.setItem('refresh_token', token);
};

export const setEncryptedCredentials = (credentials: object): void => {
  sessionStorage.setItem('encrypted_credentials', JSON.stringify(credentials));
};

export const removeAccessToken = (): void => {
  sessionStorage.removeItem('access_token');
};

export const removeRefreshToken = (): void => {
  sessionStorage.removeItem('refresh_token');
};

export const removeEncryptedCredentials = (): void => {
  sessionStorage.removeItem('encrypted_credentials');
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
  removeEncryptedCredentials();
  
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
 * Fetch PR summaries for a GitHub user
 */
export interface PRSummariesResponse {
  found: boolean;
  summaries?: number;
}

export const fetchUserPRSummaries = async (githubToken: string): Promise<PRSummariesResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${GITHUB_API_URL}/user/pr-summaries`, {
      method: 'GET',
      headers: {
        'X-GitHub-Token': githubToken,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch PR summaries');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching PR summaries:', error);
    throw error;
  }
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

export interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
}

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
  files: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }[];
  prSummary?: string;
  contributors?: Contributor[];
}

export interface PullRequestFilesSummary {
  total_count: number;
  changes: number;
  additions: number;
  deletions: number;
}

export const fetchPullRequestDetail = async (
  githubToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
  skipSummary: boolean = false
): Promise<PullRequestDetail> => {
  try {
    // Add skip_summary parameter to the URL if needed
    const skipParam = skipSummary ? '?skip_summary=true' : '';
    
    const response = await fetchWithTokenRefresh(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${pullNumber}${skipParam}`, 
      {
        method: 'GET',
        headers: {
          'X-GitHub-Token': githubToken,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pull request details for ${owner}/${repo}#${pullNumber}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching pull request details for ${owner}/${repo}#${pullNumber}:`, error);
    throw error;
  }
};

/**
 * Fetch contributors for a specific repository with pagination support
 */
export const fetchRepoContributors = async (
  githubToken: string,
  owner: string,
  repo: string,
  page: number = 1,
  perPage: number = 30
): Promise<{contributors: Contributor[]; hasMore: boolean}> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contributors?page=${page}&per_page=${perPage}`, 
      {
        method: 'GET',
        headers: {
          'X-GitHub-Token': githubToken,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch contributors for ${owner}/${repo}`);
    }

    const contributors = await response.json();
    const hasMore = contributors.contributors && contributors.contributors.length === perPage;

    return { 
      ...contributors,
      hasMore 
    };
  } catch (error) {
    console.error(`Error fetching contributors for ${owner}/${repo}:`, error);
    throw error;
  }
};

