import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // v1.18.1
import jwtDecode from 'jwt-decode'; // v3.1.2

// Import types from @austa/interfaces/auth instead of local types
import { AuthSession, AuthState } from '@austa/interfaces/auth';
import { AuthError } from '@austa/interfaces/common/error';

// Import API functions with improved error handling
import { 
  login, 
  register, 
  verifyMfa, 
  refreshToken as refreshTokenApi, 
  socialLogin 
} from '../api/auth';

/**
 * Storage key for persisting authentication session
 */
const AUTH_STORAGE_KEY = '@AUSTA:auth_session';

/**
 * Buffer time (in ms) before token expiration when we should refresh
 * Refresh 5 minutes before expiration to ensure continuous service
 */
const REFRESH_BUFFER_TIME = 5 * 60 * 1000;

/**
 * Type definition for the authentication context
 */
interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: object) => Promise<void>;
  signOut: () => Promise<void>;
  handleMfaVerification: (code: string, tempToken: string) => Promise<void>;
  handleSocialLogin: (provider: string, tokenData: object) => Promise<void>;
  handleRefreshToken: () => Promise<void>;
  getUserFromToken: (token: string) => any;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Initial auth state
 */
const initialAuthState: AuthState = {
  session: null,
  status: 'loading'
};

/**
 * Create the authentication context
 */
export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for managing authentication
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [refreshTimerId, setRefreshTimerId] = useState<NodeJS.Timeout | null>(null);

  // Computed properties for convenience
  const isLoading = authState.status === 'loading';
  const isAuthenticated = authState.status === 'authenticated';

  /**
   * Load the saved authentication session from storage
   */
  const loadPersistedSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      
      if (sessionData) {
        const session = JSON.parse(sessionData) as AuthSession;
        
        // Check if the session is expired
        const isExpired = session.expiresAt < Date.now();
        
        if (isExpired) {
          // Try to refresh the token if expired
          try {
            await handleRefreshToken();
          } catch (error) {
            // If refresh fails, clear the session
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            setAuthState({ session: null, status: 'unauthenticated' });
          }
        } else {
          // Session is valid, set it
          setAuthState({ session, status: 'authenticated' });
          
          // Schedule token refresh
          scheduleTokenRefresh(session.expiresAt);
        }
      } else {
        // No session found
        setAuthState({ session: null, status: 'unauthenticated' });
      }
    } catch (error) {
      console.error('Error loading auth session:', error);
      setAuthState({ session: null, status: 'unauthenticated' });
    }
  };

  /**
   * Persist the authentication session to storage
   */
  const persistSession = async (session: AuthSession | null) => {
    try {
      if (session) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error persisting auth session:', error);
      // Enhanced error handling - log storage errors but don't disrupt user experience
      // This prevents session loss due to storage issues
    }
  };

  /**
   * Schedule a token refresh before expiration
   */
  const scheduleTokenRefresh = (expiresAt: number) => {
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
          await handleRefreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          
          // Enhanced error recovery - attempt refresh again after a short delay
          // if the error was likely due to network issues
          if (error instanceof Error && 
              (error.message.includes('network') || error.message.includes('timeout'))) {
            setTimeout(() => {
              handleRefreshToken().catch(e => {
                console.error('Retry token refresh failed:', e);
                // If second attempt fails, let the session expire naturally
                // User will be prompted to log in again when they next interact with the app
              });
            }, 5000); // Wait 5 seconds before retry
          }
        }
      }, timeUntilRefresh);
      
      setRefreshTimerId(timerId);
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await login(email, password);
      setAuthState({ session, status: 'authenticated' });
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
    } catch (error) {
      // Enhanced error handling with journey-aware error classification
      console.error('Sign in error:', error);
      
      // Set authentication state to unauthenticated
      setAuthState({ session: null, status: 'unauthenticated' });
      
      // Rethrow with enhanced error information if possible
      if (error instanceof Error) {
        // Convert to AuthError for consistent error handling across the app
        throw new AuthError({
          code: 'auth/sign-in-failed',
          message: error.message,
          originalError: error
        });
      }
      throw error;
    }
  };

  /**
   * Register a new user
   */
  const signUp = async (userData: object): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await register(userData);
      setAuthState({ session, status: 'authenticated' });
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
    } catch (error) {
      // Enhanced error handling with journey-aware error classification
      console.error('Sign up error:', error);
      
      // Set authentication state to unauthenticated
      setAuthState({ session: null, status: 'unauthenticated' });
      
      // Rethrow with enhanced error information if possible
      if (error instanceof Error) {
        // Convert to AuthError for consistent error handling across the app
        throw new AuthError({
          code: 'auth/sign-up-failed',
          message: error.message,
          originalError: error
        });
      }
      throw error;
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<void> => {
    try {
      // Clear any scheduled token refresh
      if (refreshTimerId) {
        clearTimeout(refreshTimerId);
        setRefreshTimerId(null);
      }
      
      // Remove session from storage
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      
      // Update state
      setAuthState({ session: null, status: 'unauthenticated' });
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Force unauthenticated state even if error occurs
      // This ensures users can always sign out, even if storage operations fail
      setAuthState({ session: null, status: 'unauthenticated' });
      
      // Rethrow with enhanced error information
      if (error instanceof Error) {
        throw new AuthError({
          code: 'auth/sign-out-failed',
          message: error.message,
          originalError: error
        });
      }
      throw error;
    }
  };

  /**
   * Handle MFA verification
   */
  const handleMfaVerification = async (code: string, tempToken: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await verifyMfa(code, tempToken);
      setAuthState({ session, status: 'authenticated' });
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
    } catch (error) {
      // Enhanced error handling with journey-aware error classification
      console.error('MFA verification error:', error);
      
      // Set authentication state to unauthenticated
      setAuthState({ session: null, status: 'unauthenticated' });
      
      // Rethrow with enhanced error information if possible
      if (error instanceof Error) {
        // Convert to AuthError for consistent error handling across the app
        throw new AuthError({
          code: 'auth/mfa-verification-failed',
          message: error.message,
          originalError: error
        });
      }
      throw error;
    }
  };

  /**
   * Handle social login (OAuth)
   */
  const handleSocialLogin = async (provider: string, tokenData: object): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading' }));
      
      const session = await socialLogin(provider, tokenData);
      setAuthState({ session, status: 'authenticated' });
      
      // Schedule token refresh
      scheduleTokenRefresh(session.expiresAt);
    } catch (error) {
      // Enhanced error handling with journey-aware error classification
      console.error('Social login error:', error);
      
      // Set authentication state to unauthenticated
      setAuthState({ session: null, status: 'unauthenticated' });
      
      // Rethrow with enhanced error information if possible
      if (error instanceof Error) {
        // Convert to AuthError for consistent error handling across the app
        throw new AuthError({
          code: 'auth/social-login-failed',
          message: error.message,
          originalError: error,
          metadata: { provider }
        });
      }
      throw error;
    }
  };

  /**
   * Refresh the authentication token
   */
  const handleRefreshToken = async (): Promise<void> => {
    try {
      // Only attempt refresh if we have a session
      if (!authState.session) {
        throw new AuthError({
          code: 'auth/no-session',
          message: 'No session to refresh'
        });
      }
      
      const newSession = await refreshTokenApi();
      setAuthState({ session: newSession, status: 'authenticated' });
      
      // Schedule the next token refresh
      scheduleTokenRefresh(newSession.expiresAt);
      
      return;
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Enhanced error handling - check if the error is due to network issues
      // or if it's an actual authentication error (e.g., refresh token expired)
      if (error instanceof Error && 
          (error.message.includes('network') || error.message.includes('timeout'))) {
        // For network errors, keep the current session and retry later
        // This prevents unnecessary logouts due to temporary network issues
        if (authState.session) {
          // Schedule another refresh attempt after a delay
          setTimeout(() => {
            handleRefreshToken().catch(() => {
              // If retry fails, then force logout
              setAuthState({ session: null, status: 'unauthenticated' });
            });
          }, 5000); // Wait 5 seconds before retry
          return;
        }
      }
      
      // For other errors or if retry strategy isn't applicable, log the user out
      setAuthState({ session: null, status: 'unauthenticated' });
      
      // Rethrow with enhanced error information
      if (error instanceof Error) {
        throw new AuthError({
          code: 'auth/refresh-token-failed',
          message: error.message,
          originalError: error
        });
      }
      throw error;
    }
  };

  /**
   * Get user information from token
   */
  const getUserFromToken = (token: string): any => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      
      // Enhanced error handling - return null instead of throwing
      // This prevents UI crashes when token format is invalid
      return null;
    }
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
  }, []);

  // Persist the session whenever it changes
  useEffect(() => {
    persistSession(authState.session);
  }, [authState.session]);

  // Combine state and methods to provide through context
  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    handleMfaVerification,
    handleSocialLogin,
    handleRefreshToken,
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
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};