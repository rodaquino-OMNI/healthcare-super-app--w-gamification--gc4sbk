import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { getPlatformAdapter } from '../adapters';
import { createJourneyStorage } from '../storage';
import { AUTH_STORAGE_KEY } from '../storage/keys';
import { AuthSession, AuthState } from '@austa/interfaces/auth';

/**
 * Buffer time (in ms) before token expiration when we should refresh
 * Refresh 5 minutes before expiration to ensure continuous service
 */
const REFRESH_BUFFER_TIME = 5 * 60 * 1000;

/**
 * Authentication context interface
 * Defines the shape of the authentication context
 */
interface AuthContextType extends AuthState {
  /**
   * Logs in a user with the provided credentials
   * @param email - User's email address
   * @param password - User's password
   * @returns A promise resolving to the authentication session
   */
  login: (email: string, password: string) => Promise<AuthSession>;
  
  /**
   * Registers a new user with the provided data
   * @param userData - User registration data
   * @returns A promise resolving to the authentication session
   */
  register: (userData: Record<string, any>) => Promise<AuthSession>;
  
  /**
   * Logs out the current user
   * @returns A promise that resolves when logout is complete
   */
  logout: () => Promise<void>;
  
  /**
   * Retrieves the current user's profile
   * @returns A promise resolving to the user profile
   */
  getProfile: () => Promise<any>;
  
  /**
   * Refreshes the authentication token
   * @returns A promise resolving to the new authentication session
   */
  refreshToken: () => Promise<AuthSession>;
  
  /**
   * Verifies a multi-factor authentication code
   * @param code - The MFA verification code
   * @param tempToken - Temporary token from initial login
   * @returns A promise resolving to the authentication session
   */
  verifyMfa: (code: string, tempToken: string) => Promise<AuthSession>;
  
  /**
   * Handles social login (OAuth) authentication
   * @param provider - The OAuth provider (e.g., 'google', 'facebook')
   * @param tokenData - Provider-specific token data
   * @returns A promise resolving to the authentication session
   */
  socialLogin: (provider: string, tokenData: Record<string, any>) => Promise<AuthSession>;
  
  /**
   * Extracts user information from a JWT token
   * @param token - The JWT token
   * @returns The decoded token payload
   */
  getUserFromToken: (token: string) => any;
  
  /**
   * Whether authentication is currently loading
   */
  isLoading: boolean;
  
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
}

/**
 * Default context value
 */
const defaultContext: AuthContextType = {
  session: null,
  status: 'loading',
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  register: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
  getProfile: async () => {
    throw new Error('AuthContext not initialized');
  },
  refreshToken: async () => {
    throw new Error('AuthContext not initialized');
  },
  verifyMfa: async () => {
    throw new Error('AuthContext not initialized');
  },
  socialLogin: async () => {
    throw new Error('AuthContext not initialized');
  },
  getUserFromToken: () => {
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
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
  /**
   * Optional initial session for server-side rendering (web only)
   */
  initialSession?: AuthSession | null;
}

/**
 * Authentication Provider component
 * Manages authentication state and provides authentication functions to child components
 * Works across both web and mobile platforms through platform-specific adapters
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  initialSession = null 
}) => {
  // Get platform-specific auth adapter
  const authAdapter = getPlatformAdapter('auth');
  
  // Create storage instance
  const storage = createJourneyStorage();
  
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    session: initialSession,
    status: initialSession ? 'authenticated' : 'loading'
  });
  
  // Refresh timer for token renewal
  const [refreshTimerId, setRefreshTimerId] = useState<NodeJS.Timeout | null>(null);
  
  // Computed properties for convenience
  const isLoading = authState.status === 'loading';
  const isAuthenticated = authState.status === 'authenticated';
  
  /**
   * Updates the authentication session and status
   */
  const setSession = useCallback((newSession: AuthSession | null) => {
    setAuthState({
      session: newSession,
      status: newSession ? 'authenticated' : 'unauthenticated'
    });
  }, []);
  
  /**
   * Persists the authentication session to storage
   */
  const persistSession = useCallback(async (session: AuthSession | null) => {
    try {
      if (session) {
        await storage.setItem(AUTH_STORAGE_KEY, session, { 
          expires: session.expiresAt,
          secure: true
        });
      } else {
        await storage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error persisting auth session:', error);
    }
  }, [storage]);
  
  /**
   * Schedule a token refresh before expiration
   */
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    // Clear any existing refresh timer
    if (refreshTimerId) {
      clearTimeout(refreshTimerId);
      setRefreshTimerId(null);
    }
    
    // Calculate when to refresh (5 minutes before expiration)
    const timeUntilRefresh = expiresAt - Date.now() - REFRESH_BUFFER_TIME;
    
    // Only schedule if we need to refresh in the future
    if (timeUntilRefresh > 0) {
      const timerId = setTimeout(async () => {
        try {
          if (authState.session) {
            await handleRefreshToken();
          }
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // If refresh fails during auto-refresh, we'll keep the current session
          // until it expires, at which point the user will be logged out
        }
      }, timeUntilRefresh);
      
      setRefreshTimerId(timerId as unknown as NodeJS.Timeout);
    }
  }, [refreshTimerId, authState.session]);
  
  /**
   * Load the saved authentication session from storage
   */
  const loadPersistedSession = useCallback(async () => {
    try {
      // Skip if we already have an initial session (SSR on web)
      if (initialSession) {
        scheduleTokenRefresh(initialSession.expiresAt);
        return;
      }
      
      const session = await storage.getItem<AuthSession>(AUTH_STORAGE_KEY);
      
      if (session) {
        // Check if the session is expired
        const isExpired = session.expiresAt < Date.now();
        
        if (isExpired) {
          // Try to refresh the token if expired
          try {
            await handleRefreshToken();
          } catch (error) {
            // If refresh fails, clear the session
            await storage.removeItem(AUTH_STORAGE_KEY);
            setSession(null);
          }
        } else {
          // Session is valid, set it
          setSession(session);
          
          // Schedule token refresh
          scheduleTokenRefresh(session.expiresAt);
        }
      } else {
        // No session found
        setAuthState(prev => ({
          ...prev,
          status: 'unauthenticated'
        }));
      }
    } catch (error) {
      console.error('Error loading auth session:', error);
      setSession(null);
    }
  }, [initialSession, storage, scheduleTokenRefresh, setSession]);
  
  /**
   * Handles user login
   */
  const handleLogin = async (email: string, password: string): Promise<AuthSession> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authAdapter.login(email, password);
      setSession(session);
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
      
      return session;
    } catch (error) {
      setSession(null);
      throw error;
    }
  };
  
  /**
   * Handles user registration
   */
  const handleRegister = async (userData: Record<string, any>): Promise<AuthSession> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authAdapter.register(userData);
      setSession(session);
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
      
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
        clearTimeout(refreshTimerId);
        setRefreshTimerId(null);
      }
      
      // Call adapter logout if we have a session
      if (authState.session) {
        await authAdapter.logout();
      }
      
      // Clear session regardless of adapter result
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the session even if the API call fails
      setSession(null);
      throw error;
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
      return await authAdapter.getProfile();
    } catch (error) {
      // If we get an unauthorized error, clear the session
      if ((error as any)?.response?.status === 401) {
        setSession(null);
      }
      throw error;
    }
  };
  
  /**
   * Refresh the authentication token
   */
  const handleRefreshToken = async (): Promise<AuthSession> => {
    try {
      // Only attempt refresh if we have a session
      if (!authState.session) {
        throw new Error('No session to refresh');
      }
      
      const newSession = await authAdapter.refreshToken();
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
   * Handle MFA verification
   */
  const handleMfaVerification = async (code: string, tempToken: string): Promise<AuthSession> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authAdapter.verifyMfa(code, tempToken);
      setSession(session);
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
      
      return session;
    } catch (error) {
      setSession(null);
      throw error;
    }
  };
  
  /**
   * Handle social login (OAuth)
   */
  const handleSocialLogin = async (provider: string, tokenData: Record<string, any>): Promise<AuthSession> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await authAdapter.socialLogin(provider, tokenData);
      setSession(session);
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
      
      return session;
    } catch (error) {
      setSession(null);
      throw error;
    }
  };
  
  /**
   * Get user information from token
   */
  const getUserFromToken = (token: string): any => {
    return authAdapter.getUserFromToken(token);
  };
  
  // Load the persisted session on mount
  useEffect(() => {
    loadPersistedSession();
    
    // Clean up the refresh timer on unmount
    return () => {
      if (refreshTimerId) {
        clearTimeout(refreshTimerId);
      }
    };
  }, [loadPersistedSession, refreshTimerId]);
  
  // Persist the session whenever it changes
  useEffect(() => {
    persistSession(authState.session);
  }, [authState.session, persistSession]);
  
  // Combine state and methods to provide through context
  const contextValue: AuthContextType = {
    ...authState,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    getProfile: handleGetProfile,
    refreshToken: handleRefreshToken,
    verifyMfa: handleMfaVerification,
    socialLogin: handleSocialLogin,
    getUserFromToken,
    isLoading,
    isAuthenticated
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * Provides access to authentication state and methods
 * @returns Authentication context value
 * @throws Error if used outside of an AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthProvider;