import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Import types from @austa/interfaces/auth instead of local types
import { AuthSession, LoginCredentials, RegistrationData } from '@austa/interfaces/auth';
import { AuthErrorResponse } from '@austa/interfaces/auth/responses.types';

// Import standardized API constants
import { AUTH_API, HTTP_STATUS } from '@austa/interfaces/common';
import { WEB_AUTH_ROUTES } from 'src/web/shared/constants/routes';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Custom hook that provides authentication-related functionality
 * including login, registration, logout, and session management
 * 
 * @returns Authentication methods and state
 */
export const useAuth = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Login with email and password
   * @param credentials User credentials (email and password)
   * @returns The authentication session on success
   */
  const login = async (credentials: LoginCredentials): Promise<AuthSession> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use standardized API constants for endpoint URLs
      const response = await axios.post<AuthSession>(
        `${AUTH_API.BASE_PATH}${AUTH_API.ENDPOINTS.LOGIN}`, 
        credentials
      );
      
      // Update the session in the auth context
      auth.setSession(response.data);
      
      // Navigate to home page after successful login
      router.push('/');
      return response.data;
    } catch (err) {
      // Enhanced error handling with typed error responses
      const error = err as AxiosError<AuthErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user account
   * @param data User registration data
   * @returns The registration response data
   */
  const register = async (data: RegistrationData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use standardized API constants for endpoint URLs
      const response = await axios.post(
        `${AUTH_API.BASE_PATH}${AUTH_API.ENDPOINTS.REGISTER}`, 
        data
      );
      
      // Navigate to login page after successful registration
      router.push(WEB_AUTH_ROUTES.LOGIN);
      return response.data;
    } catch (err) {
      // Enhanced error handling with typed error responses
      const error = err as AxiosError<AuthErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async () => {
    setLoading(true);
    
    try {
      // Use standardized API constants for endpoint URLs
      await axios.post(`${AUTH_API.BASE_PATH}${AUTH_API.ENDPOINTS.LOGOUT}`);
      
      // Clear the session in the auth context
      auth.setSession(null);
      
      // Navigate to login page after logout
      router.push(WEB_AUTH_ROUTES.LOGIN);
    } catch (err) {
      console.error('Logout error:', err);
      
      // Even if server logout fails, clear the session locally
      auth.setSession(null);
      router.push(WEB_AUTH_ROUTES.LOGIN);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if the current session is valid
   */
  const checkSession = async () => {
    if (auth.status !== 'loading') return;
    
    try {
      // Use standardized API constants for endpoint URLs
      const response = await axios.get<AuthSession>(
        `${AUTH_API.BASE_PATH}${AUTH_API.ENDPOINTS.PROFILE}`
      );
      
      if (response.data) {
        auth.setSession(response.data);
      } else {
        auth.setSession(null);
      }
    } catch (err) {
      // If session check fails, clear the session
      auth.setSession(null);
    }
  };

  /**
   * Refresh the access token using the refresh token
   * @returns The new authentication session on success
   */
  const refreshToken = async (): Promise<AuthSession | null> => {
    if (!auth.session?.refreshToken) return null;
    
    try {
      // Use standardized API constants for endpoint URLs
      const response = await axios.post<AuthSession>(
        `${AUTH_API.BASE_PATH}${AUTH_API.ENDPOINTS.REFRESH_TOKEN}`,
        { refreshToken: auth.session.refreshToken }
      );
      
      // Update the session with the new tokens
      auth.setSession(response.data);
      return response.data;
    } catch (err) {
      // If token refresh fails, clear the session and redirect to login
      auth.setSession(null);
      router.push(WEB_AUTH_ROUTES.LOGIN);
      return null;
    }
  };

  // Check session on component mount
  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up axios interceptor to add authorization header and handle token refresh
  useEffect(() => {
    // Request interceptor for adding authorization header
    const requestInterceptor = axios.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // Only add the token if we have a session
        if (auth.session?.accessToken) {
          // Create a new headers object if it doesn't exist
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${auth.session.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<AuthErrorResponse>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // If the error is unauthorized and we haven't already tried to refresh the token
        if (
          error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
          !originalRequest._retry &&
          auth.session?.refreshToken
        ) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const newSession = await refreshToken();
            
            if (newSession && originalRequest.headers) {
              // Update the authorization header with the new token
              originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
              
              // Retry the original request with the new token
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // If token refresh fails, redirect to login
            router.push(WEB_AUTH_ROUTES.LOGIN);
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Clean up interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [auth.session, router]);

  return {
    login,
    register,
    logout,
    refreshToken,
    checkSession,
    session: auth.session,
    status: auth.status,
    isAuthenticated: auth.status === 'authenticated',
    isLoading: auth.status === 'loading' || loading,
    error
  };
};