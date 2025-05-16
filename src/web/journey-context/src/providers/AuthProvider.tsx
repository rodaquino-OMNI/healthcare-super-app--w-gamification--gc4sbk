import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthSession } from '@austa/interfaces/auth';

/**
 * Storage adapter interface for platform-agnostic storage
 * This allows the AuthProvider to work with different storage mechanisms
 * (localStorage for web, AsyncStorage for mobile) through a common interface
 */
export interface StorageAdapter {
  /**
   * Retrieves an item from storage by key
   * @param key - The storage key
   * @returns A promise resolving to the stored value or null if not found
   */
  getItem: (key: string) => Promise<string | null>;
  
  /**
   * Stores an item in storage
   * @param key - The storage key
   * @param value - The value to store
   * @returns A promise that resolves when the operation is complete
   */
  setItem: (key: string, value: string) => Promise<void>;
  
  /**
   * Removes an item from storage
   * @param key - The storage key to remove
   * @returns A promise that resolves when the operation is complete
   */
  removeItem: (key: string) => Promise<void>;
}

/**
 * Constants for authentication
 */
// Storage key for persisting authentication session
const AUTH_STORAGE_KEY = '@AUSTA:auth_session';

// Buffer time (in ms) before token expiration when we should refresh
// Refresh 5 minutes before expiration to ensure continuous service
const REFRESH_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Auth state interface
 * Represents the core authentication state managed by the provider
 */
export interface AuthState {
  /**
   * Current authentication session if available, null otherwise
   */
  session: AuthSession | null;
  
  /**
   * Current authentication status
   * - authenticated: User is logged in with a valid session
   * - loading: Authentication state is being determined
   * - unauthenticated: User is not logged in
   */
  status: 'authenticated' | 'loading' | 'unauthenticated';
}

/**
 * Auth context interface
 * Defines the shape of the authentication context provided to components
 */
export interface AuthContextType extends AuthState {
  /**
   * Core authentication methods
   */
  // Logs in a user with email and password
  login: (email: string, password: string) => Promise<AuthSession>;
  // Logs out the current user
  logout: () => Promise<void>;
  // Retrieves the current user's profile
  getProfile: () => Promise<any>;
  
  /**
   * Additional authentication methods (optional)
   */
  // Registers a new user
  register?: (userData: object) => Promise<AuthSession>;
  // Verifies a multi-factor authentication code
  verifyMfa?: (code: string, tempToken: string) => Promise<AuthSession>;
  // Handles social login (OAuth) with various providers
  socialLogin?: (provider: string, tokenData: object) => Promise<AuthSession>;
  // Refreshes the authentication token
  refreshToken?: () => Promise<AuthSession>;
  
  /**
   * Utility methods
   */
  // Extracts user information from a JWT token
  getUserFromToken?: (token: string) => any;
  
  /**
   * Computed properties for convenience
   */
  // Whether authentication state is currently loading
  isLoading: boolean;
  // Whether user is currently authenticated
  isAuthenticated: boolean;
}

/**
 * Initial authentication state
 */
const initialAuthState: AuthState = {
  session: null,
  status: 'loading'
};

/**
 * Default context value
 * Used when consuming the context outside of a provider (will throw errors)
 */
const defaultContext: AuthContextType = {
  ...initialAuthState,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
  getProfile: async () => {
    throw new Error('AuthContext not initialized');
  },
  isLoading: true,
  isAuthenticated: false
};

/**
 * Authentication context
 * Provides authentication state and functions throughout the application
 */
export const AuthContext = createContext<AuthContextType>(defaultContext);

/**
 * Authentication API interface
 * Defines the methods required for authentication operations
 */
export interface AuthApi {
  /**
   * Logs in a user with email and password
   */
  login: (email: string, password: string) => Promise<AuthSession>;
  
  /**
   * Logs out the current user
   */
  logout: () => Promise<void>;
  
  /**
   * Retrieves the current user's profile
   */
  getProfile: () => Promise<any>;
  
  /**
   * Optional: Registers a new user
   */
  register?: (userData: object) => Promise<AuthSession>;
  
  /**
   * Optional: Verifies a multi-factor authentication code
   */
  verifyMfa?: (code: string, tempToken: string) => Promise<AuthSession>;
  
  /**
   * Optional: Handles social login (OAuth) with various providers
   */
  socialLogin?: (provider: string, tokenData: object) => Promise<AuthSession>;
  
  /**
   * Optional: Refreshes the authentication token
   */
  refreshToken?: () => Promise<AuthSession>;
}

/**
 * Router interface for navigation after authentication events
 */
export interface AuthRouter {
  /**
   * Navigates to a new route
   */
  push: (path: string) => void;
}

/**
 * Auth provider props
 */
export interface AuthProviderProps {
  /**
   * Child components that will have access to the auth context
   */
  children: ReactNode;
  
  /**
   * Storage adapter for persisting authentication state
   * Different implementations for web and mobile platforms
   */
  storageAdapter: StorageAdapter;
  
  /**
   * Authentication API implementation
   * Contains methods for authentication operations
   */
  authApi: AuthApi;
  
  /**
   * Optional callback for session changes
   * Useful for syncing authentication state with other systems
   */
  onSessionChange?: (session: AuthSession | null) => void;
  
  /**
   * Optional router for navigation after authentication events
   * Different implementations for web and mobile platforms
   */
  router?: AuthRouter;
}

/**
 * Platform-agnostic authentication provider component
 * Manages authentication state and provides authentication functions to child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  storageAdapter,
  authApi,
  onSessionChange,
  router
}) => {
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [refreshTimerId, setRefreshTimerId] = useState<NodeJS.Timeout | number | null>(null);

  // Computed properties for convenience
  const isLoading = authState.status === 'loading';
  const isAuthenticated = authState.status === 'authenticated';

  /**
   * Updates the authentication session and status
   */
  const setSession = (newSession: AuthSession | null) => {
    setAuthState({
      session: newSession,
      status: newSession ? 'authenticated' : 'unauthenticated'
    });

    // Notify parent components of session change if callback provided
    if (onSessionChange) {
      onSessionChange(newSession);
    }
  };

  /**
   * Persists the authentication session to storage
   */
  const persistSession = async (session: AuthSession | null) => {
    try {
      if (session) {
        await storageAdapter.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } else {
        await storageAdapter.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error persisting auth session:', error);
    }
  };

  /**
   * Loads the saved authentication session from storage
   */
  const loadPersistedSession = async () => {
    try {
      const sessionData = await storageAdapter.getItem(AUTH_STORAGE_KEY);
      
      if (sessionData) {
        const session = JSON.parse(sessionData) as AuthSession;
        
        // Check if the session is expired
        const isExpired = session.expiresAt < Date.now();
        
        if (isExpired) {
          // Try to refresh the token if expired and refresh function is available
          if (authApi.refreshToken) {
            try {
              await handleRefreshToken();
            } catch (error) {
              // If refresh fails, clear the session
              await storageAdapter.removeItem(AUTH_STORAGE_KEY);
              setSession(null);
            }
          } else {
            // No refresh function available, clear the session
            await storageAdapter.removeItem(AUTH_STORAGE_KEY);
            setSession(null);
          }
        } else {
          // Session is valid, set it
          setSession(session);
          
          // Schedule token refresh if refresh function is available
          if (authApi.refreshToken) {
            scheduleTokenRefresh(session.expiresAt);
          }
        }
      } else {
        // No session found
        setSession(null);
      }
    } catch (error) {
      console.error('Error loading auth session:', error);
      setSession(null);
    }
  };

  /**
   * Schedule a token refresh before expiration
   */
  const scheduleTokenRefresh = (expiresAt: number) => {
    // Only proceed if refresh function is available
    if (!authApi.refreshToken) return;

    // Clear any existing refresh timer
    if (refreshTimerId) {
      clearTimeout(refreshTimerId as NodeJS.Timeout);
    }
    
    // Calculate when to refresh (before expiration)
    const timeUntilRefresh = expiresAt - Date.now() - REFRESH_BUFFER_TIME;
    
    // Only schedule if we need to refresh in the future
    if (timeUntilRefresh > 0) {
      const timerId = setTimeout(async () => {
        try {
          await handleRefreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // If refresh fails during auto-refresh, we'll keep the current session
          // until it expires, at which point the user will be logged out
        }
      }, timeUntilRefresh);
      
      setRefreshTimerId(timerId);
    }
  };

  /**
   * Handles user login
   */
  const handleLogin = async (email: string, password: string): Promise<AuthSession> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authApi.login(email, password);
      setSession(session);
      
      // Schedule token refresh if refresh function is available
      if (authApi.refreshToken) {
        scheduleTokenRefresh(session.expiresAt);
      }
      
      return session;
    } catch (error) {
      setSession(null);
      throw error;
    }
  };

  /**
   * Handles user registration
   */
  const handleRegister = async (userData: object): Promise<AuthSession> => {
    if (!authApi.register) {
      throw new Error('Registration not implemented');
    }
    
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authApi.register(userData);
      setSession(session);
      
      // Schedule token refresh if refresh function is available
      if (authApi.refreshToken) {
        scheduleTokenRefresh(session.expiresAt);
      }
      
      return session;
    } catch (error) {
      setSession(null);
      throw error;
    }
  };

  /**
   * Handles user logout
   */
  const handleLogout = async (): Promise<void> => {
    try {
      // Clear any scheduled token refresh
      if (refreshTimerId) {
        clearTimeout(refreshTimerId as NodeJS.Timeout);
        setRefreshTimerId(null);
      }
      
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSession(null);
      
      // Navigate to login page if router is provided
      if (router) {
        router.push('/login');
      }
    }
  };

  /**
   * Retrieves user profile
   */
  const handleGetProfile = async (): Promise<any> => {
    if (!authState.session) {
      throw new Error('No active session');
    }
    
    try {
      return await authApi.getProfile();
    } catch (error) {
      // If we get an unauthorized error, clear the session
      if ((error as any)?.response?.status === 401) {
        setSession(null);
      }
      throw error;
    }
  };

  /**
   * Handle MFA verification
   */
  const handleMfaVerification = async (code: string, tempToken: string): Promise<AuthSession> => {
    if (!authApi.verifyMfa) {
      throw new Error('MFA verification not implemented');
    }
    
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authApi.verifyMfa(code, tempToken);
      setSession(session);
      
      // Schedule token refresh if refresh function is available
      if (authApi.refreshToken) {
        scheduleTokenRefresh(session.expiresAt);
      }
      
      return session;
    } catch (error) {
      setSession(null);
      throw error;
    }
  };

  /**
   * Handle social login (OAuth)
   */
  const handleSocialLogin = async (provider: string, tokenData: object): Promise<AuthSession> => {
    if (!authApi.socialLogin) {
      throw new Error('Social login not implemented');
    }
    
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authApi.socialLogin(provider, tokenData);
      setSession(session);
      
      // Schedule token refresh if refresh function is available
      if (authApi.refreshToken) {
        scheduleTokenRefresh(session.expiresAt);
      }
      
      return session;
    } catch (error) {
      setSession(null);
      throw error;
    }
  };

  /**
   * Refresh the authentication token
   */
  const handleRefreshToken = async (): Promise<AuthSession> => {
    if (!authApi.refreshToken) {
      throw new Error('Token refresh not implemented');
    }
    
    try {
      // Only attempt refresh if we have a session
      if (!authState.session) {
        throw new Error('No session to refresh');
      }
      
      const newSession = await authApi.refreshToken();
      setSession(newSession);
      
      // Schedule the next token refresh
      scheduleTokenRefresh(newSession.expiresAt);
      
      return newSession;
    } catch (error) {
      console.error('Token refresh error:', error);
      // On refresh failure, user must re-authenticate
      setSession(null);
      throw error;
    }
  };

  /**
   * Get user information from token
   * Decodes a JWT token to extract the payload
   * 
   * @param token - The JWT token to decode
   * @returns The decoded token payload or null if decoding fails
   */
  const getUserFromToken = (token: string): any => {
    try {
      // Security enhancement: Validate token format before attempting to decode
      if (!token || typeof token !== 'string' || !token.includes('.')) {
        throw new Error('Invalid token format');
      }
      
      // This is a secure implementation of JWT decoding without external dependencies
      // It extracts the payload portion of the JWT and decodes it
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Handle padding
      const pad = base64.length % 4;
      const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
      
      // Decode the base64 string
      const jsonPayload = decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  /**
   * Effect to load the persisted session on mount
   * and clean up resources on unmount
   */
  useEffect(() => {
    // Load the persisted session when the component mounts
    loadPersistedSession();
    
    // Clean up the refresh timer when the component unmounts
    return () => {
      if (refreshTimerId) {
        clearTimeout(refreshTimerId as NodeJS.Timeout);
      }
    };
    // We intentionally omit dependencies to only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Effect to persist the session whenever it changes
   */
  useEffect(() => {
    // Persist the session to storage whenever it changes
    persistSession(authState.session);
    // We only want to depend on authState.session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.session]);

  // Combine state and methods to provide through context
  const contextValue: AuthContextType = {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
    getProfile: handleGetProfile,
    isLoading,
    isAuthenticated,
    ...(authApi.register && { register: handleRegister }),
    ...(authApi.verifyMfa && { verifyMfa: handleMfaVerification }),
    ...(authApi.socialLogin && { socialLogin: handleSocialLogin }),
    ...(authApi.refreshToken && { refreshToken: handleRefreshToken }),
    getUserFromToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * Provides a type-safe way to access the authentication context
 * 
 * @example
 * ```tsx
 * const { session, login, logout, isAuthenticated } = useAuth();
 * 
 * // Use authentication state and methods
 * if (isAuthenticated) {
 *   console.log('User is logged in:', session?.user);
 * }
 * 
 * // Login function
 * const handleLogin = async () => {
 *   try {
 *     await login('user@example.com', 'password');
 *     // Handle successful login
 *   } catch (error) {
 *     // Handle login error
 *   }
 * };
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Default export for easier imports
export default AuthProvider;