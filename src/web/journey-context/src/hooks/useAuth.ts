/**
 * useAuth Hook
 * 
 * A cross-platform authentication hook that provides a unified API for authentication
 * operations across both web (Next.js) and mobile (React Native) platforms.
 * 
 * This hook abstracts away platform-specific implementations, offering a consistent
 * interface for accessing authentication state, user data, and authentication methods.
 */

import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Using named import for better compatibility

// Import types from @austa/interfaces
import { AuthSession, JwtPayload } from '@austa/interfaces/auth';
import { AuthUser } from '@austa/interfaces/auth/user.types';
import { 
  LoginRequest, 
  RegistrationRequest,
  MFAVerificationRequest,
  SocialAuthProvider,
  TokenRefreshRequest
} from '@austa/interfaces/api/auth.api';

// Import platform-agnostic storage hook
import useStorage from './useStorage';

// Constants
const AUTH_STORAGE_KEY = 'austa:auth_session';
const REFRESH_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes before expiration

/**
 * Authentication status type
 */
type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated';

/**
 * Authentication state interface
 */
interface AuthState {
  session: AuthSession | null;
  status: AuthStatus;
  user: AuthUser | null;
}

/**
 * Authentication error interface
 */
interface AuthError extends Error {
  code?: string;
  details?: Record<string, any>;
}

/**
 * useAuth hook return type
 */
interface UseAuthReturn {
  // Authentication state
  session: AuthSession | null;
  status: AuthStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Authentication methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<RegistrationRequest, 'deviceInfo'>) => Promise<void>;
  refreshToken: () => Promise<void>;
  getProfile: () => Promise<AuthUser>;
  
  // MFA methods
  verifyMfa: (code: string, mfaToken: string) => Promise<void>;
  
  // Social login
  socialLogin: (provider: SocialAuthProvider, tokenData: Record<string, any>) => Promise<void>;
  
  // Utility methods
  getUserFromToken: (token: string) => JwtPayload | null;
}

/**
 * useAuth hook for authentication operations
 * 
 * @returns Authentication state and methods
 */
const useAuth = (): UseAuthReturn => {
  // Use storage hook for cross-platform storage
  const { 
    value: storedSession, 
    setValue: setStoredSession, 
    removeValue: removeStoredSession,
    error: storageError
  } = useStorage<AuthSession>(AUTH_STORAGE_KEY);
  
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    status: 'loading',
    user: null
  });
  
  // Refresh timer
  const [refreshTimerId, setRefreshTimerId] = useState<NodeJS.Timeout | null>(null);
  
  // Computed properties
  const isAuthenticated = authState.status === 'authenticated';
  const isLoading = authState.status === 'loading';
  
  /**
   * Updates the authentication state
   */
  const updateAuthState = useCallback((newState: Partial<AuthState>) => {
    setAuthState(prevState => ({
      ...prevState,
      ...newState
    }));
  }, []);
  
  /**
   * Extracts user information from a JWT token
   */
  const getUserFromToken = useCallback((token: string): JwtPayload | null => {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);
  
  /**
   * Schedules a token refresh before expiration
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
          await refreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // If refresh fails during auto-refresh, we'll keep the current session
          // until it expires, at which point the user will be logged out
        }
      }, timeUntilRefresh);
      
      setRefreshTimerId(timerId as unknown as NodeJS.Timeout);
    }
  }, [refreshTimerId]);
  
  /**
   * Sets the authentication session
   */
  const setSession = useCallback(async (session: AuthSession | null) => {
    try {
      if (session) {
        // Extract user information from token
        const payload = getUserFromToken(session.accessToken);
        const user = payload ? {
          id: payload.sub || '',
          email: payload.email || '',
          displayName: payload.name || '',
          roles: payload.roles || [],
          permissions: payload.permissions || []
        } as AuthUser : null;
        
        // Update auth state
        updateAuthState({
          session,
          status: 'authenticated',
          user
        });
        
        // Store session
        await setStoredSession(session);
        
        // Schedule token refresh
        scheduleTokenRefresh(session.expiresAt);
      } else {
        // Clear auth state
        updateAuthState({
          session: null,
          status: 'unauthenticated',
          user: null
        });
        
        // Remove stored session
        await removeStoredSession();
        
        // Clear refresh timer
        if (refreshTimerId) {
          clearTimeout(refreshTimerId);
          setRefreshTimerId(null);
        }
      }
    } catch (error) {
      console.error('Error setting session:', error);
      throw error;
    }
  }, [getUserFromToken, updateAuthState, setStoredSession, removeStoredSession, scheduleTokenRefresh, refreshTimerId]);
  
  /**
   * Logs in a user with email and password
   */
  const login = useCallback(async (email: string, password: string, rememberMe = false): Promise<void> => {
    try {
      updateAuthState({ status: 'loading' });
      
      // Get device info for analytics and security
      const deviceInfo = {
        deviceType: typeof navigator !== 'undefined' ? 
          (navigator.userAgent?.includes('Mobile') ? 'mobile' : 'desktop') : 'unknown',
        os: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        appVersion: '1.0.0', // Should be dynamically determined in a real app
      };
      
      // Create login request
      const loginRequest: LoginRequest = {
        email,
        password,
        rememberMe,
        deviceInfo
      };
      
      // Call login API - implementation will differ between platforms
      // This would typically be imported from a platform-specific adapter
      // For now, we'll use a placeholder that will be replaced by the adapter
      const response = await window.__AUSTA_AUTH_ADAPTER__.login(loginRequest);
      
      // Set session with the response
      await setSession(response.session);
      
      // Update user information if available
      if (response.user) {
        updateAuthState({ user: response.user });
      }
      
      // Handle MFA if required
      if (response.requiresMFA) {
        // In a real implementation, we would handle the MFA flow here
        // For now, we'll just log it
        console.log('MFA required:', response.mfaMethods, response.mfaToken);
      }
    } catch (error) {
      console.error('Login error:', error);
      await setSession(null);
      throw error;
    }
  }, [updateAuthState, setSession]);
  
  /**
   * Logs out the current user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Only attempt logout if we have a session
      if (authState.session) {
        try {
          // Call logout API - implementation will differ between platforms
          await window.__AUSTA_AUTH_ADAPTER__.logout({
            refreshToken: authState.session.refreshToken,
            logoutFromAllDevices: false
          });
        } catch (error) {
          // Log the error but continue with local logout
          console.error('Error during API logout:', error);
        }
      }
      
      // Clear the session regardless of API success
      await setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [authState.session, setSession]);
  
  /**
   * Registers a new user
   */
  const register = useCallback(async (userData: Omit<RegistrationRequest, 'deviceInfo'>): Promise<void> => {
    try {
      updateAuthState({ status: 'loading' });
      
      // Get device info for analytics and security
      const deviceInfo = {
        deviceType: typeof navigator !== 'undefined' ? 
          (navigator.userAgent?.includes('Mobile') ? 'mobile' : 'desktop') : 'unknown',
        os: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        appVersion: '1.0.0', // Should be dynamically determined in a real app
      };
      
      // Create registration request
      const registrationRequest: RegistrationRequest = {
        ...userData,
        deviceInfo
      };
      
      // Call register API - implementation will differ between platforms
      const response = await window.__AUSTA_AUTH_ADAPTER__.register(registrationRequest);
      
      // If auto-login is enabled, set the session
      if (response.session) {
        await setSession(response.session);
        
        // Update user information if available
        if (response.user) {
          updateAuthState({ user: response.user });
        }
      } else {
        // If email verification is required, update state accordingly
        updateAuthState({ status: 'unauthenticated' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      await setSession(null);
      throw error;
    }
  }, [updateAuthState, setSession]);
  
  /**
   * Refreshes the authentication token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      // Only attempt refresh if we have a session
      if (!authState.session) {
        throw new Error('No session to refresh');
      }
      
      // Create refresh request
      const refreshRequest: TokenRefreshRequest = {
        refreshToken: authState.session.refreshToken
      };
      
      // Call refresh API - implementation will differ between platforms
      const response = await window.__AUSTA_AUTH_ADAPTER__.refreshToken(refreshRequest);
      
      // Set the new session
      await setSession(response.session);
    } catch (error) {
      console.error('Token refresh error:', error);
      // On refresh failure, user must re-authenticate
      await setSession(null);
      throw error;
    }
  }, [authState.session, setSession]);
  
  /**
   * Retrieves the user profile
   */
  const getProfile = useCallback(async (): Promise<AuthUser> => {
    try {
      // Only attempt to get profile if we have a session
      if (!authState.session) {
        throw new Error('No active session');
      }
      
      // Call get profile API - implementation will differ between platforms
      const response = await window.__AUSTA_AUTH_ADAPTER__.getProfile({
        includePreferences: true
      });
      
      // Update user information
      updateAuthState({ user: response.user });
      
      return response.user;
    } catch (error) {
      console.error('Get profile error:', error);
      
      // If we get an unauthorized error, clear the session
      if ((error as any)?.response?.status === 401) {
        await setSession(null);
      }
      
      throw error;
    }
  }, [authState.session, updateAuthState, setSession]);
  
  /**
   * Verifies an MFA code
   */
  const verifyMfa = useCallback(async (code: string, mfaToken: string): Promise<void> => {
    try {
      updateAuthState({ status: 'loading' });
      
      // Create MFA verification request
      const mfaRequest: MFAVerificationRequest = {
        mfaToken,
        verificationCode: code,
        mfaType: 'sms' // This should be dynamically determined based on the MFA method
      };
      
      // Call MFA verification API - implementation will differ between platforms
      const response = await window.__AUSTA_AUTH_ADAPTER__.verifyMfa(mfaRequest);
      
      // Set the session
      await setSession(response.session);
      
      // Update user information
      if (response.user) {
        updateAuthState({ user: response.user });
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      updateAuthState({ status: 'unauthenticated' });
      throw error;
    }
  }, [updateAuthState, setSession]);
  
  /**
   * Handles social login
   */
  const socialLogin = useCallback(async (provider: SocialAuthProvider, tokenData: Record<string, any>): Promise<void> => {
    try {
      updateAuthState({ status: 'loading' });
      
      // Get device info for analytics and security
      const deviceInfo = {
        deviceType: typeof navigator !== 'undefined' ? 
          (navigator.userAgent?.includes('Mobile') ? 'mobile' : 'desktop') : 'unknown',
        os: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        appVersion: '1.0.0', // Should be dynamically determined in a real app
      };
      
      // Call social login API - implementation will differ between platforms
      const response = await window.__AUSTA_AUTH_ADAPTER__.socialLogin({
        provider,
        token: tokenData.token || tokenData.accessToken,
        userData: tokenData,
        deviceInfo
      });
      
      // Set the session
      await setSession(response.session);
      
      // Update user information
      if (response.user) {
        updateAuthState({ user: response.user });
      }
    } catch (error) {
      console.error('Social login error:', error);
      updateAuthState({ status: 'unauthenticated' });
      throw error;
    }
  }, [updateAuthState, setSession]);
  
  /**
   * Initialize auth state from storage on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // If we have a stored session, validate it
        if (storedSession) {
          // Check if the token is expired
          const isExpired = storedSession.expiresAt < Date.now();
          
          if (isExpired) {
            // Try to refresh the token if expired
            try {
              await refreshToken();
            } catch (error) {
              // If refresh fails, clear the session
              await setSession(null);
            }
          } else {
            // Session is valid, set it
            await setSession(storedSession);
          }
        } else {
          // No session found
          updateAuthState({ status: 'unauthenticated' });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        updateAuthState({ status: 'unauthenticated' });
      }
    };
    
    initializeAuth();
    
    // Clean up the refresh timer on unmount
    return () => {
      if (refreshTimerId) {
        clearTimeout(refreshTimerId);
      }
    };
  }, [storedSession, refreshToken, setSession, updateAuthState, refreshTimerId]);
  
  // Log storage errors
  useEffect(() => {
    if (storageError) {
      console.error('Auth storage error:', storageError);
    }
  }, [storageError]);
  
  // Return the auth API
  return {
    // State
    session: authState.session,
    status: authState.status,
    user: authState.user,
    isAuthenticated,
    isLoading,
    
    // Methods
    login,
    logout,
    register,
    refreshToken,
    getProfile,
    verifyMfa,
    socialLogin,
    getUserFromToken
  };
};

export default useAuth;

/**
 * Type declaration for the auth adapter
 * This is used to provide platform-specific implementations
 */
declare global {
  interface Window {
    __AUSTA_AUTH_ADAPTER__: {
      login: (request: LoginRequest) => Promise<any>;
      logout: (request: any) => Promise<any>;
      register: (request: RegistrationRequest) => Promise<any>;
      refreshToken: (request: TokenRefreshRequest) => Promise<any>;
      getProfile: (request: any) => Promise<any>;
      verifyMfa: (request: MFAVerificationRequest) => Promise<any>;
      socialLogin: (request: any) => Promise<any>;
    };
  }
}