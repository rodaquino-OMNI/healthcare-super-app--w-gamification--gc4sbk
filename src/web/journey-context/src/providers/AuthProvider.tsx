/**
 * @file AuthProvider.tsx
 * @description Platform-agnostic authentication provider that implements a centralized React context
 * for managing authentication state across web and mobile applications.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

// Import utilities
import { detectPlatform } from '../utils/platformDetection';

// Import platform-specific adapters (will be dynamically loaded)
import { getAdapter } from '../adapters';

/**
 * Interface defining the shape of the Authentication Context
 * Provides access to authentication data and functionality
 */
export interface AuthContextType {
  /** The ID of the authenticated user, or undefined if not authenticated */
  userId: string | undefined;
  
  /** Indicates whether the user is authenticated */
  isAuthenticated: boolean;
  
  /** Indicates whether authentication state is currently loading */
  isLoading: boolean;
  
  /** Contains any error that occurred during authentication operations */
  error: Error | null;
  
  /** Logs in a user with email and password */
  login: (email: string, password: string) => Promise<void>;
  
  /** Logs out the current user */
  logout: () => Promise<void>;
  
  /** Refreshes the authentication token */
  refreshToken: () => Promise<void>;
  
  /** Resets any error state */
  resetError: () => void;
}

// Create the context with a default value of null
export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Props for the AuthProvider component
 */
interface AuthProviderProps {
  /** Child components that will have access to the authentication context */
  children: ReactNode;
}

/**
 * Provider component for the Authentication context
 * Makes authentication data and functionality available throughout the application
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State for the user ID
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  // State for tracking loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // State for tracking errors
  const [error, setError] = useState<Error | null>(null);
  
  // Determine the current platform
  const platform = detectPlatform();
  
  // Get the platform-specific authentication adapter
  const authAdapter = useMemo(() => getAdapter('auth', platform), [platform]);
  
  /**
   * Initializes the authentication state
   * Checks for existing authentication and sets the user ID accordingly
   */
  const initializeAuth = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Use the platform-specific adapter to check for existing authentication
      const currentUserId = await authAdapter.getCurrentUserId();
      setUserId(currentUserId);
      setError(null);
    } catch (err) {
      const authError = err instanceof Error ? err : new Error('Failed to initialize authentication');
      console.error('Error initializing authentication:', authError);
      setError(authError);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Logs in a user with email and password
   * @param email - The user's email address
   * @param password - The user's password
   */
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Use the platform-specific adapter to log in
      const loggedInUserId = await authAdapter.login(email, password);
      setUserId(loggedInUserId);
      setError(null);
    } catch (err) {
      const loginError = err instanceof Error ? err : new Error('Failed to log in');
      console.error('Error logging in:', loginError);
      setError(loginError);
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Logs out the current user
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Use the platform-specific adapter to log out
      await authAdapter.logout();
      setUserId(undefined);
      setError(null);
    } catch (err) {
      const logoutError = err instanceof Error ? err : new Error('Failed to log out');
      console.error('Error logging out:', logoutError);
      setError(logoutError);
      throw logoutError;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Refreshes the authentication token
   */
  const refreshToken = async (): Promise<void> => {
    try {
      // Use the platform-specific adapter to refresh the token
      await authAdapter.refreshToken();
      setError(null);
    } catch (err) {
      const refreshError = err instanceof Error ? err : new Error('Failed to refresh token');
      console.error('Error refreshing token:', refreshError);
      setError(refreshError);
      
      // If token refresh fails, log out the user
      await logout();
      throw refreshError;
    }
  };
  
  /**
   * Resets any error state
   */
  const resetError = (): void => {
    setError(null);
  };
  
  // Initialize authentication state when the component mounts
  useEffect(() => {
    initializeAuth();
  }, []);
  
  // Create the context value
  const value = useMemo(() => ({
    userId,
    isAuthenticated: !!userId,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    resetError,
  }), [userId, isLoading, error]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};