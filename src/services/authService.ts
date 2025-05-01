const API_URL = 'http://localhost:3000/auth'; // Local authentication API endpoint
const GITHUB_API_URL = 'http://localhost:3000/github'; // Local GitHub API endpoint

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

interface LoginResponse {
  token: string;
  user?: User;
  message?: string;
}

interface SignupResponse {
  verificationToken: string;
  message?: string;
}

interface VerifyResponse {
  token: string;
  user?: User;
  message?: string;
}

interface AuthError {
  message: string;
  errors?: string[];
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  // Comment out to use real API even in development mode
  // Uncomment to use simulated login
  /*
  if (isDevelopment) {
    return devModeLogin();
  }
  */

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

    if (data.token) {
      setToken(data.token);
    }

    return data;
  } catch (error) {
    throw error instanceof Error 
      ? { message: error.message } 
      : error as AuthError;
  }
};

export const signup = async (email: string, password: string): Promise<SignupResponse> => {
  // Comment out to use real API even in development mode
  // Uncomment to use simulated signup
  /*
  if (isDevelopment) {
    return devModeSignup();
  }
  */

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
  // Comment out to use real API even in development mode
  // Uncomment to use simulated verification
  /*
  if (isDevelopment) {
    return devModeVerify();
  }
  */

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

    if (data.token) {
      setToken(data.token);
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
      const mockToken = 'dev-mode-token-' + Math.random().toString(36).substring(2, 15);
      setToken(mockToken); // This now uses sessionStorage
      
      resolve({
        token: mockToken,
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
      const mockToken = 'dev-verified-token-' + Math.random().toString(36).substring(2, 15);
      setToken(mockToken); // This now uses sessionStorage
      
      resolve({
        token: mockToken,
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
export const getToken = (): string | null => {
  return sessionStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  sessionStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  sessionStorage.removeItem('auth_token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Clears all session data - useful for logout or when auth errors occur
 */
export const clearSession = (): void => {
  // Clear all auth-related items from sessionStorage
  removeToken();
  
  // Add any additional session items to clear here
};

/**
 * GitHub API related functions
 */
export const fetchGitHubUser = async (token: string): Promise<GitHubUser> => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
        if (data.token) {
          setToken(data.token);
          return;
        }
      }
    } catch (error) {
      console.log('Dev login endpoint not available, using mock token instead');
    }
    
    // Fallback to mock token
    const mockToken = 'dev-mode-token-' + Math.random().toString(36).substring(2, 15);
    setToken(mockToken); // This now uses sessionStorage
  }
};