/**
 * useAuth Hook
 * 
 * A unified authentication hook that works consistently across web and mobile platforms.
 * This hook abstracts away platform-specific implementations, providing a standardized
 * interface for authentication operations throughout the AUSTA SuperApp.
 * 
 * @packageDocumentation
 * @module @austa/journey-context/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from './useStorage';

// Import types from @austa/interfaces
import { AuthSession, AuthState } from '@austa/interfaces/auth';
import { IUser } from '@austa/interfaces/auth/user.types';

// Constants
const AUTH_STORAGE_KEY = 'austa_auth_session';
const REFRESH_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes before expiration

/**
 * Authentication API interface
 * This interface defines the shape of the authentication API methods
 * that will be implemented differently for web and mobile platforms
 */
interface AuthApi {
  /**
   * Log in with email and password
   */
  login: (email: string, password: string) => Promise<AuthSession>;
  
  /**
   * Register a new user
   */
  register: (userData: Record<string, any>) => Promise<AuthSession>;
  
  /**
   * Log out the current user
   */
  logout: () => Promise<void>;
  
  /**
   * Refresh the authentication token
   */
  refreshToken: (refreshToken: string) => Promise<AuthSession>;
  
  /**
   * Get the current user's profile
   */
  getProfile: () => Promise<IUser>;
  
  /**
   * Verify MFA code
   */
  verifyMfa: (code: string, tempToken: string) => Promise<AuthSession>;
  
  /**
   * Handle social login
   */
  socialLogin: (provider: string, tokenData: Record<string, any>) => Promise<AuthSession>;
}

/**
 * Return type for the useAuth hook
 * Combines the AuthState with authentication methods
 */
export interface UseAuthReturn extends AuthState {
  /**
   * Log in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise that resolves when login is complete
   */
  login: (email: string, password: string) => Promise<void>;
  
  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Promise that resolves when registration is complete
   */
  register: (userData: Record<string, any>) => Promise<void>;
  
  /**
   * Log out the current user
   * @returns Promise that resolves when logout is complete
   */
  logout: () => Promise<void>;
  
  /**
   * Get the current user's profile
   * @returns Promise resolving to the user profile
   * @throws Error if not authenticated
   */
  getProfile: () => Promise<IUser>;
  
  /**
   * Verify MFA code during authentication
   * @param code - The MFA verification code
   * @param tempToken - Temporary token from initial authentication
   * @returns Promise that resolves when verification is complete
   */
  verifyMfa: (code: string, tempToken: string) => Promise<void>;
  
  /**
   * Handle social login (OAuth)
   * @param provider - The OAuth provider (e.g., 'google', 'facebook')
   * @param tokenData - Provider-specific token data
   * @returns Promise that resolves when social login is complete
   */
  socialLogin: (provider: string, tokenData: Record<string, any>) => Promise<void>;
  
  /**
   * Manually refresh the authentication token
   * @returns Promise that resolves when token refresh is complete
   * @throws Error if refresh fails or no session exists
   */
  refreshToken: () => Promise<void>;
  
  /**
   * Extract user information from a JWT token
   * @param token - JWT token string
   * @returns Decoded token payload or null if invalid
   */
  getUserFromToken: (token: string) => any | null;
  
  /**
   * Indicates if authentication is in progress
   */
  isLoading: boolean;
  
  /**
   * Indicates if the user is authenticated
   */
  isAuthenticated: boolean;
  
  /**
   * Current error message if any authentication operation failed
   */
  error: Error | null;
  
  /**
   * Clear the current error state
   */
  clearError: () => void;
}

/**
 * Detect if we're running in a browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Detect if we're running in React Native
 */
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

/**
 * Load platform-specific authentication API implementation
 */
const loadAuthApi = async (): Promise<AuthApi> => {
  try {
    if (isBrowser) {
      // Web implementation
      const { login, logout, getProfile } = await import('../adapters/web/auth');
      const { register, refreshToken, verifyMfa, socialLogin } = await import('../adapters/web/auth');
      
      return {
        login,
        register,
        logout,
        refreshToken,
        getProfile,
        verifyMfa,
        socialLogin
      };
    } else if (isReactNative) {
      // React Native implementation
      const { login, logout, getProfile } = await import('../adapters/mobile/auth');
      const { register, refreshToken, verifyMfa, socialLogin } = await import('../adapters/mobile/auth');
      
      return {
        login,
        register,
        logout,
        refreshToken,
        getProfile,
        verifyMfa,
        socialLogin
      };
    }
    
    throw new Error('Unsupported platform');
  } catch (error) {
    console.error('Failed to load auth API:', error);
    throw error;
  }
};

/**
 * Parse JWT token to extract user information
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
const parseJwt = (token: string): any | null => {
  try {
    // For React Native, we would normally use a library like jwt-decode
    // But for a platform-agnostic implementation, we'll use a basic parser
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * A hook that provides authentication functionality
 * @returns Authentication state and methods
 */
export const useAuth = (): UseAuthReturn => {
  // Use the storage hook for cross-platform storage
  const storage = useStorage();
  
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    status: 'loading'
  });
  
  // Error state
  const [error, setError] = useState<Error | null>(null);
  
  // Auth API reference
  const [authApi, setAuthApi] = useState<AuthApi | null>(null);
  
  // Refresh timer
  const [refreshTimerId, setRefreshTimerId] = useState<NodeJS.Timeout | null>(null);
  
  // Computed properties
  const isLoading = authState.status === 'loading';
  const isAuthenticated = authState.status === 'authenticated';
  
  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Update the authentication state and persist to storage
   */
  const updateAuthState = useCallback(async (newState: AuthState) => {
    setAuthState(newState);
    
    // Persist session to storage if available
    if (storage.isReady && newState.session) {
      await storage.setItem(AUTH_STORAGE_KEY, newState.session);
    } else if (storage.isReady && !newState.session) {
      await storage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [storage]);
  
  /**
   * Schedule a token refresh before expiration
   */
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    // Clear any existing refresh timer
    if (refreshTimerId) {
      clearTimeout(refreshTimerId);
    }
    
    // Calculate when to refresh (5 minutes before expiration)
    const timeUntilRefresh = expiresAt - Date.now() - REFRESH_BUFFER_TIME;
    
    // Only schedule if we need to refresh in the future
    if (timeUntilRefresh > 0) {
      const timerId = setTimeout(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // If refresh fails during auto-refresh, we'll keep the current session
          // until it expires, at which point the user will be logged out
        }
      }, timeUntilRefresh);
      
      setRefreshTimerId(timerId);
    }
  }, [refreshTimerId]);
  
  /**
   * Load the saved authentication session from storage
   */
  const loadPersistedSession = useCallback(async () => {
    if (!storage.isReady) {
      return;
    }
    
    try {
      const session = await storage.getItem<AuthSession>(AUTH_STORAGE_KEY);
      
      if (session) {
        // Check if the session is expired
        const isExpired = session.expiresAt < Date.now();
        
        if (isExpired) {
          // Try to refresh the token if expired
          try {
            if (authApi) {
              const newSession = await authApi.refreshToken(session.refreshToken);
              await updateAuthState({ session: newSession, status: 'authenticated' });
              
              // Schedule token refresh
              scheduleTokenRefresh(newSession.expiresAt);
            } else {
              // Auth API not loaded yet, set unauthenticated
              await updateAuthState({ session: null, status: 'unauthenticated' });
            }
          } catch (error) {
            // If refresh fails, clear the session
            await updateAuthState({ session: null, status: 'unauthenticated' });
          }
        } else {
          // Session is valid, set it
          await updateAuthState({ session, status: 'authenticated' });
          
          // Schedule token refresh
          scheduleTokenRefresh(session.expiresAt);
        }
      } else {
        // No session found
        await updateAuthState({ session: null, status: 'unauthenticated' });
      }
    } catch (error) {
      console.error('Error loading auth session:', error);
      await updateAuthState({ session: null, status: 'unauthenticated' });
      setError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [storage, authApi, updateAuthState, scheduleTokenRefresh]);
  
  /**
   * Log in with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    if (!authApi) {
      throw new Error('Authentication API not initialized');
    }
    
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authApi.login(email, password);
      await updateAuthState({ session, status: 'authenticated' });
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
    } catch (error) {
      await updateAuthState({ session: null, status: 'unauthenticated' });
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [authApi, updateAuthState, scheduleTokenRefresh]);
  
  /**
   * Register a new user
   */
  const register = useCallback(async (userData: Record<string, any>): Promise<void> => {
    if (!authApi) {
      throw new Error('Authentication API not initialized');
    }
    
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authApi.register(userData);
      await updateAuthState({ session, status: 'authenticated' });
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
    } catch (error) {
      await updateAuthState({ session: null, status: 'unauthenticated' });
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [authApi, updateAuthState, scheduleTokenRefresh]);
  
  /**
   * Log out the current user
   */
  const logout = useCallback(async (): Promise<void> => {
    if (!authApi) {
      throw new Error('Authentication API not initialized');
    }
    
    try {
      setError(null);
      
      // Clear any scheduled token refresh
      if (refreshTimerId) {
        clearTimeout(refreshTimerId);
        setRefreshTimerId(null);
      }
      
      // Call the API logout method
      await authApi.logout();
      
      // Update state and clear storage
      await updateAuthState({ session: null, status: 'unauthenticated' });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, we still want to clear the local session
      await updateAuthState({ session: null, status: 'unauthenticated' });
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [authApi, refreshTimerId, updateAuthState]);
  
  /**
   * Get the current user's profile
   */
  const getProfile = useCallback(async (): Promise<IUser> => {
    if (!authApi) {
      throw new Error('Authentication API not initialized');
    }
    
    if (!authState.session) {
      throw new Error('No active session');
    }
    
    try {
      setError(null);
      return await authApi.getProfile();
    } catch (error) {
      // If we get an unauthorized error, clear the session
      if ((error as any)?.response?.status === 401) {
        await updateAuthState({ session: null, status: 'unauthenticated' });
      }
      
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [authApi, authState.session, updateAuthState]);
  
  /**
   * Verify MFA code during authentication
   */
  const verifyMfa = useCallback(async (code: string, tempToken: string): Promise<void> => {
    if (!authApi) {
      throw new Error('Authentication API not initialized');
    }
    
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authApi.verifyMfa(code, tempToken);
      await updateAuthState({ session, status: 'authenticated' });
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
    } catch (error) {
      await updateAuthState({ session: null, status: 'unauthenticated' });
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [authApi, updateAuthState, scheduleTokenRefresh]);
  
  /**
   * Handle social login (OAuth)
   */
  const socialLogin = useCallback(async (provider: string, tokenData: Record<string, any>): Promise<void> => {
    if (!authApi) {
      throw new Error('Authentication API not initialized');
    }
    
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authApi.socialLogin(provider, tokenData);
      await updateAuthState({ session, status: 'authenticated' });
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
    } catch (error) {
      await updateAuthState({ session: null, status: 'unauthenticated' });
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [authApi, updateAuthState, scheduleTokenRefresh]);
  
  /**
   * Manually refresh the authentication token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    if (!authApi) {
      throw new Error('Authentication API not initialized');
    }
    
    // Only attempt refresh if we have a session
    if (!authState.session) {
      throw new Error('No session to refresh');
    }
    
    try {
      setError(null);
      
      const newSession = await authApi.refreshToken(authState.session.refreshToken);
      await updateAuthState({ session: newSession, status: 'authenticated' });
      
      // Schedule the next token refresh
      scheduleTokenRefresh(newSession.expiresAt);
    } catch (error) {
      // On refresh failure, user must re-authenticate
      await updateAuthState({ session: null, status: 'unauthenticated' });
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [authApi, authState.session, updateAuthState, scheduleTokenRefresh]);
  
  /**
   * Extract user information from a JWT token
   */
  const getUserFromToken = useCallback((token: string): any | null => {
    try {
      return parseJwt(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }, []);
  
  // Load the auth API on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const api = await loadAuthApi();
        setAuthApi(api);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setError(error instanceof Error ? error : new Error(String(error)));
        setAuthState({ session: null, status: 'unauthenticated' });
      }
    };
    
    initializeAuth();
    
    // Clean up the refresh timer on unmount
    return () => {
      if (refreshTimerId) {
        clearTimeout(refreshTimerId);
      }
    };
  }, []);
  
  // Load the persisted session when storage and auth API are ready
  useEffect(() => {
    if (storage.isReady && authApi) {
      loadPersistedSession();
    }
  }, [storage.isReady, authApi, loadPersistedSession]);
  
  // Return the auth state and methods
  return {
    ...authState,
    login,
    register,
    logout,
    getProfile,
    verifyMfa,
    socialLogin,
    refreshToken,
    getUserFromToken,
    isLoading,
    isAuthenticated,
    error,
    clearError
  };
};

export default useAuth;