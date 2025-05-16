/**
 * Mobile Authentication Adapter
 * 
 * This adapter provides mobile-specific implementations of authentication operations
 * for the useAuth hook. It handles API calls to the authentication service and
 * manages token storage using AsyncStorage.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { 
  LoginRequest, 
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
  MFAVerificationRequest,
  MFAVerificationResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  GetUserProfileRequest,
  GetUserProfileResponse,
  LogoutRequest,
  LogoutResponse,
  SocialAuthRequest,
  SocialAuthResponse
} from '@austa/interfaces/api/auth.api';

// Base API URL - should be configurable in a real implementation
const API_BASE_URL = 'https://api.austa.health/auth';

/**
 * Makes an authenticated API request
 */
async function apiRequest<T>(endpoint: string, method: string, data?: any, token?: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `AUSTA-Mobile/${Platform.OS}`,
    'X-Platform': Platform.OS
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      // Try to parse as JSON
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      // If parsing fails, use the raw text
      responseData = { message: responseText || 'Unknown response' };
    }
    
    if (!response.ok) {
      // Create error object with additional properties
      const error = new Error(responseData.message || 'API request failed') as any;
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = response;
      error.data = responseData;
      
      throw error;
    }
    
    return responseData as T;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Network connection failed. Please check your internet connection.');
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Mobile authentication adapter implementation
 */
const mobileAuthAdapter = {
  /**
   * Logs in a user with email and password
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    // Add mobile-specific device info
    const enhancedRequest = {
      ...request,
      deviceInfo: {
        ...request.deviceInfo,
        deviceType: 'mobile',
        os: Platform.OS,
        osVersion: Platform.Version,
        deviceId: await getDeviceId()
      }
    };
    
    return await apiRequest<LoginResponse>('/login', 'POST', enhancedRequest);
  },
  
  /**
   * Logs out the current user
   */
  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    return await apiRequest<LogoutResponse>('/logout', 'POST', request);
  },
  
  /**
   * Registers a new user
   */
  async register(request: RegistrationRequest): Promise<RegistrationResponse> {
    // Add mobile-specific device info
    const enhancedRequest = {
      ...request,
      deviceInfo: {
        ...request.deviceInfo,
        deviceType: 'mobile',
        os: Platform.OS,
        osVersion: Platform.Version,
        deviceId: await getDeviceId()
      }
    };
    
    return await apiRequest<RegistrationResponse>('/register', 'POST', enhancedRequest);
  },
  
  /**
   * Refreshes the authentication token
   */
  async refreshToken(request: TokenRefreshRequest): Promise<TokenRefreshResponse> {
    return await apiRequest<TokenRefreshResponse>('/refresh-token', 'POST', request);
  },
  
  /**
   * Retrieves the user profile
   */
  async getProfile(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    // Get the current session from AsyncStorage
    const sessionData = await AsyncStorage.getItem('austa:auth_session');
    let token = '';
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        token = session.accessToken;
      } catch (error) {
        console.error('Error parsing session data:', error);
      }
    }
    
    return await apiRequest<GetUserProfileResponse>('/profile', 'GET', null, token);
  },
  
  /**
   * Verifies an MFA code
   */
  async verifyMfa(request: MFAVerificationRequest): Promise<MFAVerificationResponse> {
    return await apiRequest<MFAVerificationResponse>('/verify-mfa', 'POST', request);
  },
  
  /**
   * Handles social login
   */
  async socialLogin(request: SocialAuthRequest): Promise<SocialAuthResponse> {
    // Add mobile-specific device info
    const enhancedRequest = {
      ...request,
      deviceInfo: {
        ...request.deviceInfo,
        deviceType: 'mobile',
        os: Platform.OS,
        osVersion: Platform.Version,
        deviceId: await getDeviceId()
      }
    };
    
    return await apiRequest<SocialAuthResponse>('/social-login', 'POST', enhancedRequest);
  }
};

/**
 * Gets a unique device identifier
 * In a real implementation, this would use a proper device ID library
 */
async function getDeviceId(): Promise<string> {
  try {
    // Try to get stored device ID
    let deviceId = await AsyncStorage.getItem('austa:device_id');
    
    // If no device ID exists, create one
    if (!deviceId) {
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      await AsyncStorage.setItem('austa:device_id', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `${Platform.OS}-fallback-${Math.random().toString(36).substring(2, 10)}`;
  }
}

/**
 * Initializes the mobile authentication adapter
 */
export function initMobileAuthAdapter(): void {
  // Attach the adapter to the global object for the useAuth hook to use
  if (typeof global !== 'undefined') {
    (global as any).__AUSTA_AUTH_ADAPTER__ = mobileAuthAdapter;
  }
}

export default mobileAuthAdapter;