/**
 * Mobile Authentication Adapter
 * 
 * This adapter implements mobile-specific authentication functionality including:
 * - AsyncStorage-based token persistence
 * - Biometric authentication integration
 * - React Navigation integration
 * - Automatic token refresh mechanisms
 * - Enhanced error handling
 * 
 * @packageDocumentation
 * @module @austa/journey-context/adapters/mobile
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import jwtDecode from 'jwt-decode';
import { AuthSession, AuthState } from '@austa/interfaces/auth';

/**
 * Storage key for persisting authentication session
 */
const AUTH_STORAGE_KEY = '@AUSTA:auth_session';

/**
 * Storage key for biometric authentication status
 */
const BIOMETRIC_ENABLED_KEY = '@AUSTA:biometric_enabled';

/**
 * Buffer time (in ms) before token expiration when we should refresh
 * Refresh 5 minutes before expiration to ensure continuous service
 */
const REFRESH_BUFFER_TIME = 5 * 60 * 1000;

/**
 * Error types that can occur during authentication operations
 */
export enum AuthErrorType {
  TOKEN_PERSISTENCE_FAILURE = 'TOKEN_PERSISTENCE_FAILURE',
  TOKEN_RETRIEVAL_FAILURE = 'TOKEN_RETRIEVAL_FAILURE',
  TOKEN_REFRESH_FAILURE = 'TOKEN_REFRESH_FAILURE',
  BIOMETRIC_SETUP_FAILURE = 'BIOMETRIC_SETUP_FAILURE',
  BIOMETRIC_AUTH_FAILURE = 'BIOMETRIC_AUTH_FAILURE',
  BIOMETRIC_NOT_AVAILABLE = 'BIOMETRIC_NOT_AVAILABLE',
  BIOMETRIC_NOT_ENROLLED = 'BIOMETRIC_NOT_ENROLLED',
  NAVIGATION_FAILURE = 'NAVIGATION_FAILURE',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Custom error class for authentication operations
 */
export class AuthError extends Error {
  type: AuthErrorType;
  originalError?: Error;

  constructor(type: AuthErrorType, message: string, originalError?: Error) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * Options for authentication operations
 */
export interface AuthAdapterOptions {
  /** Whether to enable biometric authentication */
  enableBiometrics?: boolean;
  /** Whether to automatically refresh tokens before expiration */
  autoRefreshTokens?: boolean;
  /** Custom storage key for auth session */
  storageKey?: string;
  /** Maximum retry attempts for token operations */
  maxRetries?: number;
  /** Whether to persist authentication state */
  persistAuthentication?: boolean;
  /** Callback for handling navigation after authentication */
  onAuthStateChanged?: (state: AuthState) => void;
}

/**
 * Default authentication options
 */
const DEFAULT_OPTIONS: AuthAdapterOptions = {
  enableBiometrics: true,
  autoRefreshTokens: true,
  storageKey: AUTH_STORAGE_KEY,
  maxRetries: 3,
  persistAuthentication: true,
};

/**
 * Biometric authentication configuration
 */
interface BiometricConfig {
  isAvailable: boolean;
  biometryType?: BiometryTypes;
  enabled: boolean;
}

/**
 * Authentication API interface for making auth requests
 */
interface AuthApi {
  login: (email: string, password: string) => Promise<AuthSession>;
  register: (userData: object) => Promise<AuthSession>;
  verifyMfa: (code: string, tempToken: string) => Promise<AuthSession>;
  refreshToken: () => Promise<AuthSession>;
  socialLogin: (provider: string, tokenData: object) => Promise<AuthSession>;
}

/**
 * Mobile-specific authentication adapter that implements AsyncStorage-based token persistence,
 * biometric authentication integration, and React Navigation integration for authentication flows.
 */
export class AuthAdapter {
  private options: AuthAdapterOptions;
  private biometrics: ReactNativeBiometrics;
  private biometricConfig: BiometricConfig;
  private refreshTimerId: NodeJS.Timeout | null = null;
  private authState: AuthState = { session: null, status: 'loading' };
  private authApi: AuthApi;

  /**
   * Creates a new AuthAdapter instance
   * @param authApi Authentication API implementation
   * @param options Configuration options for the adapter
   */
  constructor(authApi: AuthApi, options: AuthAdapterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.authApi = authApi;
    this.biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
    this.biometricConfig = {
      isAvailable: false,
      enabled: false
    };

    // Initialize biometric configuration
    this.initBiometrics();
  }

  /**
   * Initializes biometric authentication capabilities
   * @private
   */
  private async initBiometrics(): Promise<void> {
    try {
      // Check if biometrics are available on the device
      const { available, biometryType } = await this.biometrics.isSensorAvailable();
      
      // Load biometric enabled status from storage
      const enabledString = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      const enabled = enabledString === 'true';
      
      this.biometricConfig = {
        isAvailable: available,
        biometryType,
        enabled: available && enabled
      };
    } catch (error) {
      console.error('Failed to initialize biometrics:', error);
      this.biometricConfig = {
        isAvailable: false,
        enabled: false
      };
    }
  }

  /**
   * Loads the persisted authentication session from AsyncStorage
   * @returns Promise that resolves with the loaded auth state
   */
  async loadPersistedSession(): Promise<AuthState> {
    try {
      const storageKey = this.options.storageKey || AUTH_STORAGE_KEY;
      const sessionData = await AsyncStorage.getItem(storageKey);
      
      if (sessionData) {
        const session = JSON.parse(sessionData) as AuthSession;
        
        // Check if the session is expired
        const isExpired = session.expiresAt < Date.now();
        
        if (isExpired) {
          // Try to refresh the token if expired
          try {
            if (this.options.autoRefreshTokens) {
              await this.refreshToken();
              return this.authState;
            } else {
              // If auto-refresh is disabled, clear the session
              await this.clearSession();
              this.updateAuthState({ session: null, status: 'unauthenticated' });
              return this.authState;
            }
          } catch (error) {
            // If refresh fails, clear the session
            await this.clearSession();
            this.updateAuthState({ session: null, status: 'unauthenticated' });
            return this.authState;
          }
        } else {
          // Session is valid, set it
          this.updateAuthState({ session, status: 'authenticated' });
          
          // Schedule token refresh if enabled
          if (this.options.autoRefreshTokens) {
            this.scheduleTokenRefresh(session.expiresAt);
          }
          
          return this.authState;
        }
      } else {
        // No session found
        this.updateAuthState({ session: null, status: 'unauthenticated' });
        return this.authState;
      }
    } catch (error) {
      console.error('Error loading auth session:', error);
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      
      throw new AuthError(
        AuthErrorType.TOKEN_RETRIEVAL_FAILURE,
        'Failed to load authentication session from storage',
        error as Error
      );
    }
  }

  /**
   * Persists the authentication session to AsyncStorage
   * @param session Authentication session to persist
   * @returns Promise that resolves when the operation completes
   */
  async persistSession(session: AuthSession | null): Promise<void> {
    if (!this.options.persistAuthentication) {
      return;
    }
    
    try {
      const storageKey = this.options.storageKey || AUTH_STORAGE_KEY;
      
      if (session) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Error persisting auth session:', error);
      
      throw new AuthError(
        AuthErrorType.TOKEN_PERSISTENCE_FAILURE,
        'Failed to persist authentication session to storage',
        error as Error
      );
    }
  }

  /**
   * Clears the persisted authentication session from AsyncStorage
   * @returns Promise that resolves when the operation completes
   */
  async clearSession(): Promise<void> {
    try {
      const storageKey = this.options.storageKey || AUTH_STORAGE_KEY;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing auth session:', error);
      
      throw new AuthError(
        AuthErrorType.TOKEN_PERSISTENCE_FAILURE,
        'Failed to clear authentication session from storage',
        error as Error
      );
    }
  }

  /**
   * Schedules a token refresh before expiration
   * @param expiresAt Timestamp when the token expires
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    // Clear any existing refresh timer
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    
    // Calculate when to refresh (5 minutes before expiration)
    const timeUntilRefresh = expiresAt - Date.now() - REFRESH_BUFFER_TIME;
    
    // Only schedule if we need to refresh in the future
    if (timeUntilRefresh > 0) {
      this.refreshTimerId = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // If refresh fails during auto-refresh, we'll keep the current session
          // until it expires, at which point the user will be logged out
        }
      }, timeUntilRefresh);
    }
  }

  /**
   * Updates the authentication state and notifies listeners
   * @param newState New authentication state
   */
  private updateAuthState(newState: AuthState): void {
    this.authState = newState;
    
    // Notify listeners if callback is provided
    if (this.options.onAuthStateChanged) {
      this.options.onAuthStateChanged(newState);
    }
  }

  /**
   * Signs in with email and password
   * @param email User email
   * @param password User password
   * @returns Promise that resolves with the authentication session
   */
  async signIn(email: string, password: string): Promise<AuthSession> {
    try {
      this.updateAuthState({ ...this.authState, status: 'loading' });
      
      const session = await this.authApi.login(email, password);
      this.updateAuthState({ session, status: 'authenticated' });
      
      // Persist session if enabled
      if (this.options.persistAuthentication) {
        await this.persistSession(session);
      }
      
      // Schedule token refresh if enabled
      if (this.options.autoRefreshTokens) {
        this.scheduleTokenRefresh(session.expiresAt);
      }
      
      return session;
    } catch (error) {
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Failed to sign in with the provided credentials',
        error as Error
      );
    }
  }

  /**
   * Signs in using biometric authentication
   * @returns Promise that resolves with the authentication session
   */
  async signInWithBiometrics(): Promise<AuthSession> {
    // Check if biometrics are available and enabled
    if (!this.biometricConfig.isAvailable) {
      throw new AuthError(
        AuthErrorType.BIOMETRIC_NOT_AVAILABLE,
        'Biometric authentication is not available on this device'
      );
    }
    
    if (!this.biometricConfig.enabled) {
      throw new AuthError(
        AuthErrorType.BIOMETRIC_NOT_ENROLLED,
        'Biometric authentication is not enabled for this user'
      );
    }
    
    try {
      this.updateAuthState({ ...this.authState, status: 'loading' });
      
      // Prompt for biometric authentication
      const { success } = await this.biometrics.simplePrompt({
        promptMessage: 'Authenticate to continue',
        cancelButtonText: 'Cancel'
      });
      
      if (!success) {
        this.updateAuthState({ session: null, status: 'unauthenticated' });
        throw new AuthError(
          AuthErrorType.BIOMETRIC_AUTH_FAILURE,
          'Biometric authentication failed or was canceled'
        );
      }
      
      // If biometric authentication succeeds, try to refresh the token
      const session = await this.refreshToken();
      return session;
    } catch (error) {
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError(
        AuthErrorType.BIOMETRIC_AUTH_FAILURE,
        'Biometric authentication failed',
        error as Error
      );
    }
  }

  /**
   * Registers a new user
   * @param userData User registration data
   * @returns Promise that resolves with the authentication session
   */
  async signUp(userData: object): Promise<AuthSession> {
    try {
      this.updateAuthState({ ...this.authState, status: 'loading' });
      
      const session = await this.authApi.register(userData);
      this.updateAuthState({ session, status: 'authenticated' });
      
      // Persist session if enabled
      if (this.options.persistAuthentication) {
        await this.persistSession(session);
      }
      
      // Schedule token refresh if enabled
      if (this.options.autoRefreshTokens) {
        this.scheduleTokenRefresh(session.expiresAt);
      }
      
      return session;
    } catch (error) {
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      
      throw new AuthError(
        AuthErrorType.UNKNOWN_ERROR,
        'Failed to register new user',
        error as Error
      );
    }
  }

  /**
   * Signs out the current user
   * @returns Promise that resolves when sign out is complete
   */
  async signOut(): Promise<void> {
    try {
      // Clear any scheduled token refresh
      if (this.refreshTimerId) {
        clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      
      // Clear session from storage
      await this.clearSession();
      
      // Update state
      this.updateAuthState({ session: null, status: 'unauthenticated' });
    } catch (error) {
      console.error('Sign out error:', error);
      
      throw new AuthError(
        AuthErrorType.UNKNOWN_ERROR,
        'Failed to sign out',
        error as Error
      );
    }
  }

  /**
   * Handles MFA verification
   * @param code MFA verification code
   * @param tempToken Temporary token from initial authentication
   * @returns Promise that resolves with the authentication session
   */
  async verifyMfa(code: string, tempToken: string): Promise<AuthSession> {
    try {
      this.updateAuthState({ ...this.authState, status: 'loading' });
      
      const session = await this.authApi.verifyMfa(code, tempToken);
      this.updateAuthState({ session, status: 'authenticated' });
      
      // Persist session if enabled
      if (this.options.persistAuthentication) {
        await this.persistSession(session);
      }
      
      // Schedule token refresh if enabled
      if (this.options.autoRefreshTokens) {
        this.scheduleTokenRefresh(session.expiresAt);
      }
      
      return session;
    } catch (error) {
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      
      throw new AuthError(
        AuthErrorType.UNKNOWN_ERROR,
        'Failed to verify MFA code',
        error as Error
      );
    }
  }

  /**
   * Handles social login (OAuth)
   * @param provider Social provider (e.g., 'google', 'facebook')
   * @param tokenData Token data from the OAuth provider
   * @returns Promise that resolves with the authentication session
   */
  async socialLogin(provider: string, tokenData: object): Promise<AuthSession> {
    try {
      this.updateAuthState({ ...this.authState, status: 'loading' });
      
      const session = await this.authApi.socialLogin(provider, tokenData);
      this.updateAuthState({ session, status: 'authenticated' });
      
      // Persist session if enabled
      if (this.options.persistAuthentication) {
        await this.persistSession(session);
      }
      
      // Schedule token refresh if enabled
      if (this.options.autoRefreshTokens) {
        this.scheduleTokenRefresh(session.expiresAt);
      }
      
      return session;
    } catch (error) {
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      
      throw new AuthError(
        AuthErrorType.UNKNOWN_ERROR,
        'Failed to authenticate with social provider',
        error as Error
      );
    }
  }

  /**
   * Refreshes the authentication token
   * @returns Promise that resolves with the refreshed authentication session
   */
  async refreshToken(): Promise<AuthSession> {
    try {
      // Only attempt refresh if we have a session
      if (!this.authState.session) {
        throw new Error('No session to refresh');
      }
      
      const newSession = await this.authApi.refreshToken();
      this.updateAuthState({ session: newSession, status: 'authenticated' });
      
      // Persist session if enabled
      if (this.options.persistAuthentication) {
        await this.persistSession(newSession);
      }
      
      // Schedule the next token refresh if enabled
      if (this.options.autoRefreshTokens) {
        this.scheduleTokenRefresh(newSession.expiresAt);
      }
      
      return newSession;
    } catch (error) {
      // On refresh failure, user must re-authenticate
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      
      throw new AuthError(
        AuthErrorType.TOKEN_REFRESH_FAILURE,
        'Failed to refresh authentication token',
        error as Error
      );
    }
  }

  /**
   * Enables biometric authentication for the current user
   * @returns Promise that resolves when biometric authentication is enabled
   */
  async enableBiometrics(): Promise<void> {
    // Check if biometrics are available
    if (!this.biometricConfig.isAvailable) {
      throw new AuthError(
        AuthErrorType.BIOMETRIC_NOT_AVAILABLE,
        'Biometric authentication is not available on this device'
      );
    }
    
    try {
      // Prompt for biometric authentication to confirm
      const { success } = await this.biometrics.simplePrompt({
        promptMessage: 'Authenticate to enable biometric login',
        cancelButtonText: 'Cancel'
      });
      
      if (!success) {
        throw new AuthError(
          AuthErrorType.BIOMETRIC_AUTH_FAILURE,
          'Biometric authentication failed or was canceled'
        );
      }
      
      // Store biometric enabled status
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      
      // Update biometric config
      this.biometricConfig.enabled = true;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError(
        AuthErrorType.BIOMETRIC_SETUP_FAILURE,
        'Failed to enable biometric authentication',
        error as Error
      );
    }
  }

  /**
   * Disables biometric authentication for the current user
   * @returns Promise that resolves when biometric authentication is disabled
   */
  async disableBiometrics(): Promise<void> {
    try {
      // Remove biometric enabled status
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      
      // Update biometric config
      this.biometricConfig.enabled = false;
    } catch (error) {
      throw new AuthError(
        AuthErrorType.UNKNOWN_ERROR,
        'Failed to disable biometric authentication',
        error as Error
      );
    }
  }

  /**
   * Checks if biometric authentication is available on the device
   * @returns Promise that resolves with biometric availability information
   */
  async isBiometricsAvailable(): Promise<{ available: boolean; biometryType?: BiometryTypes }> {
    try {
      const { available, biometryType } = await this.biometrics.isSensorAvailable();
      return { available, biometryType };
    } catch (error) {
      console.error('Error checking biometrics availability:', error);
      return { available: false };
    }
  }

  /**
   * Checks if biometric authentication is enabled for the current user
   * @returns Promise that resolves with whether biometrics are enabled
   */
  async isBiometricsEnabled(): Promise<boolean> {
    try {
      const enabledString = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabledString === 'true';
    } catch (error) {
      console.error('Error checking biometrics enabled status:', error);
      return false;
    }
  }

  /**
   * Gets the current authentication state
   * @returns Current authentication state
   */
  getAuthState(): AuthState {
    return this.authState;
  }

  /**
   * Gets user information from token
   * @param token JWT token
   * @returns Decoded token payload
   */
  getUserFromToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Cleans up resources used by the adapter
   */
  cleanup(): void {
    // Clear any scheduled token refresh
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }
}