/**
 * Web Authentication Adapter
 * 
 * This adapter provides web-specific implementations of authentication operations
 * for the useAuth hook. It handles API calls to the authentication service and
 * manages token storage in the browser's localStorage.
 */

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
const API_BASE_URL = '/api/auth';

/**
 * Makes an authenticated API request
 */
async function apiRequest<T>(endpoint: string, method: string, data?: any, token?: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    // Parse error response
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: 'Unknown error occurred' };
    }
    
    // Create error object with additional properties
    const error = new Error(errorData.message || 'API request failed') as any;
    error.status = response.status;
    error.statusText = response.statusText;
    error.response = response;
    error.data = errorData;
    
    throw error;
  }
  
  return await response.json() as T;
}

/**
 * Web authentication adapter implementation
 */
const webAuthAdapter = {
  /**
   * Logs in a user with email and password
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    return await apiRequest<LoginResponse>('/login', 'POST', request);
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
    return await apiRequest<RegistrationResponse>('/register', 'POST', request);
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
    // Get the current session from localStorage
    const sessionData = localStorage.getItem('austa:auth_session');
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
    return await apiRequest<SocialAuthResponse>('/social-login', 'POST', request);
  }
};

/**
 * Initializes the web authentication adapter
 */
export function initWebAuthAdapter(): void {
  // Attach the adapter to the window object for the useAuth hook to use
  if (typeof window !== 'undefined') {
    window.__AUSTA_AUTH_ADAPTER__ = webAuthAdapter;
  }
}

export default webAuthAdapter;