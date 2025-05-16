/**
 * @file AuthAdapter.ts
 * @description Mobile-specific authentication adapter implementation
 * 
 * This adapter handles mobile-specific authentication concerns including:
 * - AsyncStorage-based token persistence
 * - Biometric authentication integration
 * - Automatic token refresh
 * - React Navigation integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Platform } from 'react-native';
import { AuthSession, AuthState, JwtToken, JwtPayload } from '@austa/interfaces/auth';
import { isAuthSession } from '@austa/interfaces/auth/session.types';

/**
 * Storage keys for authentication-related data
 */
const STORAGE_KEYS = {
  /**
   * Key for persisting authentication session
   */
  AUTH_SESSION: '@AUSTA:auth_session',
  
  /**
   * Key for biometric authentication preference
   */
  BIOMETRIC_ENABLED: '@AUSTA:biometric_enabled',
  
  /**
   * Key for storing the device ID
   */
  DEVICE_ID: '@AUSTA:device_id',
  
  /**
   * Key for storing the biometric public key
   */
  BIOMETRIC_PUBLIC_KEY: '@AUSTA:biometric_public_key',
  
  /**
   * Key for storing the last authentication method used
   */
  LAST_AUTH_METHOD: '@AUSTA:last_auth_method',
};

/**
 * Buffer time (in ms) before token expiration when we should refresh
 * Refresh 5 minutes before expiration to ensure continuous service
 */
const REFRESH_BUFFER_TIME = 5 * 60 * 1000;

/**
 * Biometric prompt message
 */
const BIOMETRIC_PROMPT_MESSAGE = 'Authenticate to access your AUSTA account';

/**
 * Authentication methods
 */
enum AuthMethod {
  PASSWORD = 'password',
  BIOMETRIC = 'biometric',
  SOCIAL = 'social',
  SSO = 'sso',
  OTP = 'otp',
}

/**
 * Mobile-specific authentication adapter
 */
export default class MobileAuthAdapter {
  private refreshTimerId: NodeJS.Timeout | null = null;
  private rnBiometrics: ReactNativeBiometrics;
  private biometricKeysExist: boolean = false;
  private biometricType: BiometryTypes | undefined;
  
  /**
   * Creates a new instance of the mobile authentication adapter
   */
  constructor() {
    // Configure biometrics with appropriate options for the platform
    const biometricOptions = {
      allowDeviceCredentials: true // Allow fallback to device PIN/pattern/password
    };
    
    // On Android, we can use additional options
    if (Platform.OS === 'android') {
      Object.assign(biometricOptions, {
        // Android-specific options can be added here
      });
    }
    
    this.rnBiometrics = new ReactNativeBiometrics(biometricOptions);
    
    // Initialize biometric capabilities
    this.initBiometrics();
  }
  
  /**
   * Initialize biometric capabilities
   */
  private async initBiometrics(): Promise<void> {
    try {
      // Check if biometrics are available on the device
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      if (available) {
        this.biometricType = biometryType;
        
        // Check if biometric keys already exist
        const { keysExist } = await this.rnBiometrics.biometricKeysExist();
        this.biometricKeysExist = keysExist;
        
        // If keys don't exist, create them when needed (during enableBiometricAuth)
        
        // Check if biometric auth is already enabled for this user
        const isEnabled = await this.isBiometricAuthEnabled();
        console.log(`Biometric authentication is ${isEnabled ? 'enabled' : 'not enabled'} for this user`);
        console.log(`Biometric type available: ${biometryType}`);
      } else {
        console.log('Biometric authentication is not available on this device');
      }
    } catch (error) {
      console.error('Error initializing biometrics:', error);
      // Biometrics not available, continue without it
    }
  }
  
  /**
   * Load the saved authentication session from storage
   */
  public async loadPersistedSession(): Promise<AuthState> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          
          // Validate the session object
          if (!isAuthSession(session)) {
            throw new Error('Invalid session format');
          }
          
          // Check if the session is expired
          const isExpired = session.expiresAt < Date.now();
          
          if (isExpired) {
            // Try to refresh the token if expired
            try {
              const newSession = await this.refreshToken(session);
              return { session: newSession, status: 'authenticated' };
            } catch (error) {
              // If refresh fails, clear the session
              await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
              return { session: null, status: 'unauthenticated' };
            }
          } else {
            // Session is valid, set it
            this.scheduleTokenRefresh(session.expiresAt);
            return { session, status: 'authenticated' };
          }
        } catch (error) {
          // Error parsing the session data
          console.error('Error parsing auth session:', error);
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
          return { session: null, status: 'unauthenticated' };
        }
      } else {
        // No session found
        return { session: null, status: 'unauthenticated' };
      }
    } catch (error) {
      console.error('Error loading auth session:', error);
      return { session: null, status: 'unauthenticated' };
    }
  }

  /**
   * Persist the authentication session to storage
   */
  public async persistSession(session: AuthSession | null): Promise<void> {
    try {
      if (session) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
    } catch (error) {
      console.error('Error persisting auth session:', error);
      throw new Error('Failed to persist authentication session');
    }
  }

  /**
   * Schedule a token refresh before expiration
   */
  public scheduleTokenRefresh(expiresAt: number): void {
    // Clear any existing refresh timer
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
    }
    
    // Calculate when to refresh (5 minutes before expiration)
    const timeUntilRefresh = expiresAt - Date.now() - REFRESH_BUFFER_TIME;
    
    // Only schedule if we need to refresh in the future
    if (timeUntilRefresh > 0) {
      this.refreshTimerId = setTimeout(async () => {
        try {
          const currentSession = await this.getSession();
          if (currentSession) {
            await this.refreshToken(currentSession);
          }
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // If refresh fails during auto-refresh, we'll keep the current session
          // until it expires, at which point the user will be logged out
        }
      }, timeUntilRefresh);
    }
  }

  /**
   * Get the current session from storage
   */
  private async getSession(): Promise<AuthSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (isAuthSession(session)) {
          return session;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Refresh the authentication token
   */
  public async refreshToken(session: AuthSession): Promise<AuthSession> {
    try {
      // Call the refresh token API
      const response = await fetch('https://api.austa.health/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': await this.getDeviceId(),
          'X-Platform': Platform.OS,
        },
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Token refresh failed');
      }

      const data = await response.json();
      const newSession: AuthSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      // Persist the new session
      await this.persistSession(newSession);
      
      // Schedule the next token refresh
      this.scheduleTokenRefresh(newSession.expiresAt);
      
      return newSession;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
  
  /**
   * Get a unique device identifier
   * This is used for security tracking and device management
   */
  private async getDeviceId(): Promise<string> {
    try {
      // Try to get the stored device ID
      const storedId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      
      if (storedId) {
        return storedId;
      }
      
      // Generate a new device ID if none exists
      const newId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, newId);
      
      return newId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback to a temporary ID if storage fails
      return `temp-${Platform.OS}-${Date.now()}`;
    }
  }

  /**
   * Sign in with email and password
   */
  public async signIn(email: string, password: string): Promise<AuthSession> {
    try {
      // Call the login API
      const response = await fetch('https://api.austa.health/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': await this.getDeviceId(),
          'X-Platform': Platform.OS,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Sign in failed');
      }

      const data = await response.json();
      const session: AuthSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      // Persist the session
      await this.persistSession(session);
      
      // Record the authentication method used
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_AUTH_METHOD, AuthMethod.PASSWORD);
      
      // Schedule token refresh
      this.scheduleTokenRefresh(session.expiresAt);
      
      return session;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  public async signUp(userData: object): Promise<AuthSession> {
    try {
      // Call the register API
      const response = await fetch('https://api.austa.health/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign up failed');
      }

      const data = await response.json();
      const session: AuthSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      // Persist the session
      await this.persistSession(session);
      
      // Schedule token refresh
      this.scheduleTokenRefresh(session.expiresAt);
      
      return session;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    try {
      // Clear any scheduled token refresh
      if (this.refreshTimerId) {
        clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      
      // Remove session from storage
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      
      // Record the logout event
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_AUTH_METHOD, 'none');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Handle MFA verification
   */
  public async handleMfaVerification(code: string, tempToken: string): Promise<AuthSession> {
    try {
      // Call the MFA verification API
      const response = await fetch('https://api.austa.health/auth/verify-mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          tempToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'MFA verification failed');
      }

      const data = await response.json();
      const session: AuthSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      // Persist the session
      await this.persistSession(session);
      
      // Schedule token refresh
      this.scheduleTokenRefresh(session.expiresAt);
      
      return session;
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  }

  /**
   * Handle social login (OAuth)
   */
  public async handleSocialLogin(provider: string, tokenData: object): Promise<AuthSession> {
    try {
      // Call the social login API
      const response = await fetch(`https://api.austa.health/auth/social/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Social login failed');
      }

      const data = await response.json();
      const session: AuthSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      // Persist the session
      await this.persistSession(session);
      
      // Schedule token refresh
      this.scheduleTokenRefresh(session.expiresAt);
      
      return session;
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }

  /**
   * Get user information from token
   */
  public getUserFromToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  public async isBiometricAuthAvailable(): Promise<boolean> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get the type of biometric authentication available
   */
  public getBiometricType(): BiometryTypes | undefined {
    return this.biometricType;
  }

  /**
   * Enable biometric authentication for the current user
   */
  public async enableBiometricAuth(): Promise<boolean> {
    try {
      // Check if biometrics are available
      const isAvailable = await this.isBiometricAuthAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Create biometric keys if they don't exist
      if (!this.biometricKeysExist) {
        const { publicKey } = await this.rnBiometrics.createKeys();
        this.biometricKeysExist = true;
        
        // Store the public key for reference
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_PUBLIC_KEY, publicKey);
        
        // Here you could send the public key to your server for verification
        // during future biometric authentication attempts
        console.log('Generated public key for biometric authentication:', publicKey);
      }

      // Store the user's preference for biometric authentication
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      
      return true;
    } catch (error) {
      console.error('Error enabling biometric authentication:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication for the current user
   */
  public async disableBiometricAuth(): Promise<boolean> {
    try {
      // Remove the user's preference for biometric authentication
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
      
      return true;
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  public async isBiometricAuthEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking if biometric auth is enabled:', error);
      return false;
    }
  }

  /**
   * Authenticate using biometrics
   */
  public async authenticateWithBiometrics(): Promise<AuthSession | null> {
    try {
      // Check if biometric authentication is enabled
      const isEnabled = await this.isBiometricAuthEnabled();
      if (!isEnabled) {
        throw new Error('Biometric authentication is not enabled');
      }

      // Check if biometrics are available
      const isAvailable = await this.isBiometricAuthAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Get the current session
      const currentSession = await this.getSession();
      if (!currentSession) {
        throw new Error('No active session found');
      }

      // Get biometric prompt message based on the type of biometric available
      const promptMessage = this.getBiometricPromptMessage();

      // Prompt for biometric authentication
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
        // On Android, we can customize the prompt further
        ...(Platform.OS === 'android' ? {
          confirmationRequired: true
        } : {})
      });

      if (!success) {
        throw new Error('Biometric authentication failed or was cancelled');
      }

      // If the session is expired, refresh it
      if (currentSession.expiresAt < Date.now()) {
        return await this.refreshToken(currentSession);
      }

      // Return the current session
      return currentSession;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return null;
    }
  }
  
  /**
   * Get the appropriate biometric prompt message based on the available biometric type
   */
  private getBiometricPromptMessage(): string {
    if (this.biometricType === BiometryTypes.FaceID) {
      return 'Authenticate with Face ID to access your AUSTA account';
    } else if (this.biometricType === BiometryTypes.TouchID) {
      return 'Authenticate with Touch ID to access your AUSTA account';
    } else if (this.biometricType === BiometryTypes.Biometrics) {
      // Generic biometrics (usually Android)
      return 'Authenticate with biometrics to access your AUSTA account';
    }
    
    // Default message
    return BIOMETRIC_PROMPT_MESSAGE;
  }

  /**
   * Create a cryptographic signature using biometrics
   * This can be used for secure operations that require additional verification
   * 
   * This is a more secure form of biometric authentication as it uses the device's
   * secure hardware to create a cryptographic signature that can be verified by the server.
   * This prevents replay attacks and provides stronger security than simple biometric prompts.
   */
  public async createSignatureWithBiometrics(payload: string): Promise<string | null> {
    try {
      // Check if biometric authentication is enabled
      const isEnabled = await this.isBiometricAuthEnabled();
      if (!isEnabled) {
        throw new Error('Biometric authentication is not enabled');
      }

      // Check if biometrics are available
      const isAvailable = await this.isBiometricAuthAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }
      
      // Check if keys exist, create them if they don't
      if (!this.biometricKeysExist) {
        const { publicKey } = await this.rnBiometrics.createKeys();
        this.biometricKeysExist = true;
        
        // Here you would typically send the public key to your server
        // for verification during future biometric authentication attempts
        console.log('Generated new public key for biometric authentication:', publicKey);
        
        // Store the public key for reference
        await AsyncStorage.setItem('@AUSTA:biometric_public_key', publicKey);
      }

      // Get biometric prompt message based on the type of biometric available
      const promptMessage = this.getBiometricPromptMessage();

      // Create a signature with biometric authentication
      const { success, signature } = await this.rnBiometrics.createSignature({
        promptMessage,
        payload,
        cancelButtonText: 'Cancel',
      });

      if (!success || !signature) {
        throw new Error('Biometric signature creation failed or was cancelled');
      }

      return signature;
    } catch (error) {
      console.error('Biometric signature error:', error);
      return null;
    }
  }

  /**
   * Clean up resources when the adapter is no longer needed
   */
  public cleanup(): void {
    // Clear any scheduled token refresh
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }
}