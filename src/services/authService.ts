const API_URL = 'https://your-api-endpoint.com/api'; // Replace with your actual API endpoint

// Development mode flag
const isDevelopment = process.env.NODE_ENV === 'development';

interface User {
  id: string;
  email: string;
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
  // For development mode, bypass real API call if enabled
  if (isDevelopment) {
    return devModeLogin();
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  // For development mode, bypass real API call if enabled
  if (isDevelopment) {
    return devModeSignup();
  }

  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  // For development mode, bypass real API call if enabled
  if (isDevelopment) {
    return devModeVerify();
  }

  try {
    const response = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      setToken(mockToken);
      
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
      setToken(mockToken);
      
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

export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Helper for direct developer login bypass
export const bypassLogin = (): void => {
  if (isDevelopment) {
    const mockToken = 'dev-mode-token-' + Math.random().toString(36).substring(2, 15);
    setToken(mockToken);
  }
};