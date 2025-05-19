/**
 * Authentication API module for the AUSTA SuperApp mobile application
 * Provides functions for user authentication, registration, and session management
 * that implement the Authentication System (F-201) requirement.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types from @austa/interfaces for consistent type definitions
import { AuthSession } from '@austa/interfaces/auth/session.types';
import { LoginRequest, RegisterRequest, MfaVerifyRequest, SocialLoginRequest } from '@austa/interfaces/auth/requests.types';
import { LoginResponse, RegisterResponse, MfaVerifyResponse, TokenRefreshResponse, SocialLoginResponse } from '@austa/interfaces/auth/responses.types';
import { ErrorCode } from '@austa/interfaces/common/error';

// Import standardized error handling
import { 
  ApiError, 
  AuthenticationError, 
  ClientError, 
  withRetry, 
  CircuitBreaker, 
  withErrorHandling,
  parseError,
  logError
} from './errors';

// Import API constants
import { API_BASE_URL } from '@austa/interfaces/common/constants';

// Create a circuit breaker for auth API calls
const authCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 10000,
  onStateChange: (from, to) => {
    console.info(`Auth API circuit breaker state changed from ${from} to ${to}`);
  }
});

// Storage keys
const AUTH_STORAGE_KEY = '@AUSTA:auth_session';
const SECURE_TOKEN_KEY = 'austa.auth.tokens';

/**
 * Securely store authentication tokens
 * Falls back to AsyncStorage if SecureStore is not available
 * @param session - The authentication session to store
 */
async function secureStoreTokens(session: AuthSession): Promise<void> {
  try {
    // Use SecureStore on supported platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await SecureStore.setItemAsync(
        SECURE_TOKEN_KEY,
        JSON.stringify(session),
        {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        }
      );
    } else {
      // Fall back to AsyncStorage on web or other platforms
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  } catch (error) {
    console.error('Failed to securely store tokens:', error);
    // Fall back to AsyncStorage if SecureStore fails
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

/**
 * Retrieve securely stored authentication tokens
 * Falls back to AsyncStorage if SecureStore is not available
 * @returns Promise resolving to an AuthSession object or null if not found
 */
async function getSecureTokens(): Promise<AuthSession | null> {
  try {
    let sessionData: string | null = null;
    
    // Use SecureStore on supported platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      sessionData = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    } else {
      // Fall back to AsyncStorage on web or other platforms
      sessionData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    }
    
    if (sessionData) {
      return JSON.parse(sessionData) as AuthSession;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve secure tokens:', error);
    
    // Try AsyncStorage as fallback
    try {
      const sessionData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (sessionData) {
        return JSON.parse(sessionData) as AuthSession;
      }
    } catch (fallbackError) {
      console.error('Failed to retrieve tokens from fallback storage:', fallbackError);
    }
    
    return null;
  }
}

/**
 * Remove securely stored authentication tokens
 */
async function removeSecureTokens(): Promise<void> {
  try {
    // Remove from SecureStore on supported platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
    }
    
    // Always remove from AsyncStorage as well (in case it was used as fallback)
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove secure tokens:', error);
    // Ensure AsyncStorage is cleared even if SecureStore fails
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Validate email format
 * @param email - Email to validate
 * @throws ClientError if email format is invalid
 */
function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new ClientError({
      message: 'Invalid email format',
      code: ErrorCode.VALIDATION_ERROR,
      status: 422
    });
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @throws ClientError if password doesn't meet requirements
 */
function validatePassword(password: string): void {
  if (!password || password.length < 8) {
    throw new ClientError({
      message: 'Password must be at least 8 characters long',
      code: ErrorCode.VALIDATION_ERROR,
      status: 422
    });
  }
}

/**
 * Authenticates a user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to an AuthSession object
 * @throws ApiError if authentication fails
 */
export const login = withErrorHandling(async function login(
  email: string, 
  password: string
): Promise<AuthSession> {
  try {
    // Validate inputs before sending to server
    validateEmail(email);
    validatePassword(password);
    
    // 1. Construct the API endpoint URL for login
    const url = `${API_BASE_URL}/auth/login`;
    
    // 2. Send a POST request to the login endpoint with the email and password
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': Platform.OS,
        'X-Client-Version': Platform.Version.toString()
      },
      body: JSON.stringify({ email, password } as LoginRequest)
    });
    
    // 3. Parse the JSON response
    const data = await response.json() as LoginResponse;
    
    // Handle error responses
    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError({
          message: data.message || 'Invalid email or password',
          context: { email }
        });
      }
      
      throw new ApiError({
        message: data.message || 'Authentication failed',
        status: response.status,
        code: data.code || ErrorCode.UNKNOWN_ERROR
      });
    }
    
    // 4. Securely store the session
    await secureStoreTokens(data.session);
    
    // 5. Return the authentication session
    return data.session;
  } catch (error) {
    // Log the error for analytics and monitoring
    logError(error instanceof Error ? error : new Error(String(error)), { 
      method: 'login', 
      email: email.substring(0, 3) + '***' // Log partial email for debugging without exposing full email
    });
    
    // Rethrow as ApiError
    throw parseError(error);
  }
}, authCircuitBreaker);

/**
 * Registers a new user
 * @param userData - Object containing user registration data (name, email, password, etc.)
 * @returns Promise resolving to an AuthSession object
 * @throws ApiError if registration fails
 */
export const register = withErrorHandling(async function register(
  userData: RegisterRequest
): Promise<AuthSession> {
  try {
    // Validate critical fields
    if (userData.email) validateEmail(userData.email);
    if (userData.password) validatePassword(userData.password);
    
    // 1. Construct the API endpoint URL for registration
    const url = `${API_BASE_URL}/auth/register`;
    
    // 2. Send a POST request to the registration endpoint with the user data
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': Platform.OS,
        'X-Client-Version': Platform.Version.toString()
      },
      body: JSON.stringify(userData)
    });
    
    // 3. Parse the JSON response
    const data = await response.json() as RegisterResponse;
    
    // Handle error responses
    if (!response.ok) {
      throw new ApiError({
        message: data.message || 'Registration failed',
        status: response.status,
        code: data.code || ErrorCode.UNKNOWN_ERROR
      });
    }
    
    // 4. Securely store the session
    await secureStoreTokens(data.session);
    
    // 5. Return the authentication session
    return data.session;
  } catch (error) {
    // Log the error for analytics and monitoring
    logError(error instanceof Error ? error : new Error(String(error)), { 
      method: 'register',
      email: userData.email ? userData.email.substring(0, 3) + '***' : undefined
    });
    
    // Rethrow as ApiError
    throw parseError(error);
  }
}, authCircuitBreaker);

/**
 * Verifies a multi-factor authentication code
 * @param code - The MFA verification code entered by the user
 * @param tempToken - Temporary token received after initial authentication
 * @returns Promise resolving to an AuthSession object
 * @throws ApiError if verification fails
 */
export const verifyMfa = withErrorHandling(async function verifyMfa(
  code: string, 
  tempToken: string
): Promise<AuthSession> {
  try {
    // Validate code format
    if (!code || code.length < 4) {
      throw new ClientError({
        message: 'Invalid verification code',
        code: ErrorCode.VALIDATION_ERROR,
        status: 422
      });
    }
    
    // 1. Construct the API endpoint URL for MFA verification
    const url = `${API_BASE_URL}/auth/verify-mfa`;
    
    // 2. Send a POST request to the MFA verification endpoint with the code and temporary token
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempToken}`,
        'X-Client-Platform': Platform.OS,
        'X-Client-Version': Platform.Version.toString()
      },
      body: JSON.stringify({ code } as MfaVerifyRequest)
    });
    
    // 3. Parse the JSON response
    const data = await response.json() as MfaVerifyResponse;
    
    // Handle error responses
    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError({
          message: data.message || 'Invalid verification code or expired token',
          context: { codeLength: code.length }
        });
      }
      
      throw new ApiError({
        message: data.message || 'MFA verification failed',
        status: response.status,
        code: data.code || ErrorCode.UNKNOWN_ERROR
      });
    }
    
    // 4. Securely store the session
    await secureStoreTokens(data.session);
    
    // 5. Return the authentication session
    return data.session;
  } catch (error) {
    // Log the error for analytics and monitoring
    logError(error instanceof Error ? error : new Error(String(error)), { 
      method: 'verifyMfa',
      codeLength: code.length
    });
    
    // Rethrow as ApiError
    throw parseError(error);
  }
}, authCircuitBreaker);

/**
 * Refreshes the authentication token
 * @returns Promise resolving to a new AuthSession object
 * @throws ApiError if token refresh fails
 */
export const refreshToken = withErrorHandling(async function refreshToken(): Promise<AuthSession> {
  try {
    // Get the current session to extract the refresh token
    const currentSession = await getSecureTokens();
    if (!currentSession || !currentSession.refreshToken) {
      throw new AuthenticationError({
        message: 'No refresh token available',
        code: ErrorCode.UNAUTHORIZED
      });
    }
    
    // 1. Construct the API endpoint URL for token refresh
    const url = `${API_BASE_URL}/auth/refresh`;
    
    // 2. Send a POST request to the token refresh endpoint
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': Platform.OS,
        'X-Client-Version': Platform.Version.toString(),
        'Authorization': `Bearer ${currentSession.refreshToken}`
      }
    });
    
    // 3. Parse the JSON response
    const data = await response.json() as TokenRefreshResponse;
    
    // Handle error responses
    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid tokens
        await removeSecureTokens();
        
        throw new AuthenticationError({
          message: data.message || 'Refresh token expired or invalid',
          code: ErrorCode.UNAUTHORIZED
        });
      }
      
      throw new ApiError({
        message: data.message || 'Token refresh failed',
        status: response.status,
        code: data.code || ErrorCode.UNKNOWN_ERROR
      });
    }
    
    // 4. Securely store the new session
    await secureStoreTokens(data.session);
    
    // 5. Return the new authentication session
    return data.session;
  } catch (error) {
    // Log the error for analytics and monitoring
    logError(error instanceof Error ? error : new Error(String(error)), { 
      method: 'refreshToken'
    });
    
    // Rethrow as ApiError
    throw parseError(error);
  }
}, authCircuitBreaker, {
  // Custom retry options for token refresh
  maxRetries: 2,
  initialDelayMs: 500,
  shouldRetry: (error) => {
    // Don't retry if the token is invalid/expired
    if (error instanceof AuthenticationError) {
      return false;
    }
    return true;
  }
});

/**
 * Authenticates a user with a social provider (OAuth 2.0)
 * @param provider - The social provider (e.g., 'google', 'apple', 'facebook')
 * @param tokenData - Provider-specific token data (contains tokens or authorization codes)
 * @returns Promise resolving to an AuthSession object
 * @throws ApiError if social authentication fails
 */
export const socialLogin = withErrorHandling(async function socialLogin(
  provider: string,
  tokenData: SocialLoginRequest
): Promise<AuthSession> {
  try {
    // Validate provider
    const validProviders = ['google', 'apple', 'facebook'];
    if (!provider || !validProviders.includes(provider.toLowerCase())) {
      throw new ClientError({
        message: `Unsupported provider: ${provider}`,
        code: ErrorCode.VALIDATION_ERROR,
        status: 422
      });
    }
    
    // 1. Construct the API endpoint URL for social login
    const url = `${API_BASE_URL}/auth/social/${provider.toLowerCase()}`;
    
    // 2. Send a POST request to the social login endpoint with the provider and token data
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': Platform.OS,
        'X-Client-Version': Platform.Version.toString()
      },
      body: JSON.stringify(tokenData)
    });
    
    // 3. Parse the JSON response
    const data = await response.json() as SocialLoginResponse;
    
    // Handle error responses
    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError({
          message: data.message || 'Social authentication failed',
          context: { provider }
        });
      }
      
      throw new ApiError({
        message: data.message || 'Social authentication failed',
        status: response.status,
        code: data.code || ErrorCode.UNKNOWN_ERROR,
        context: { provider }
      });
    }
    
    // 4. Securely store the session
    await secureStoreTokens(data.session);
    
    // 5. Return the authentication session
    return data.session;
  } catch (error) {
    // Log the error for analytics and monitoring
    logError(error instanceof Error ? error : new Error(String(error)), { 
      method: 'socialLogin',
      provider
    });
    
    // Rethrow as ApiError
    throw parseError(error);
  }
}, authCircuitBreaker);

/**
 * Signs out the current user by removing stored tokens
 * @returns Promise that resolves when sign out is complete
 */
export async function signOut(): Promise<void> {
  try {
    await removeSecureTokens();
  } catch (error) {
    console.error('Error during sign out:', error);
    // Always consider sign out successful even if token removal fails
    // This ensures users can always sign out
  }
}

/**
 * Gets the current authentication session if available
 * @returns Promise resolving to the current AuthSession or null if not authenticated
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  return getSecureTokens();
}