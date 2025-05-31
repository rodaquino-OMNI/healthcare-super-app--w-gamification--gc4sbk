/**
 * Web Authentication Adapter
 * 
 * This adapter implements web-specific authentication functionality including:
 * - localStorage-based token persistence
 * - Cross-tab session synchronization
 * - Next.js navigation integration
 * - Automatic token refresh mechanisms
 * - Enhanced error handling
 * 
 * @packageDocumentation
 * @module @austa/journey-context/adapters/web
 */

import jwtDecode from 'jwt-decode';
import { AuthSession, AuthState, JwtPayload, TokenValidationResult } from '@austa/interfaces/auth';

/**
 * Storage key for persisting authentication session
 */
const AUTH_STORAGE_KEY = 'AUSTA:auth_session';

/**
 * Storage event name for cross-tab synchronization
 */
const AUTH_STORAGE_EVENT = 'storage';

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
  NAVIGATION_FAILURE = 'NAVIGATION_FAILURE',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  STORAGE_SYNC_FAILURE = 'STORAGE_SYNC_FAILURE',
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
  /** Whether to automatically refresh tokens before expiration */
  autoRefreshTokens?: boolean;
  /** Custom storage key for auth session */
  storageKey?: string;
  /** Maximum retry attempts for token operations */
  maxRetries?: number;
  /** Whether to persist authentication state */
  persistAuthentication?: boolean;
  /** Whether to enable cross-tab session synchronization */
  enableCrossTabSync?: boolean;
  /** Callback for handling navigation after authentication */
  onAuthStateChanged?: (state: AuthState) => void;
  /** Routes for authentication navigation */
  routes?: {
    /** Login page route */
    login: string;
    /** Post-login redirect route */
    postLogin?: string;
    /** Post-logout redirect route */
    postLogout?: string;
  };
}

/**
 * Default authentication options
 */
const DEFAULT_OPTIONS: AuthAdapterOptions = {
  autoRefreshTokens: true,
  storageKey: AUTH_STORAGE_KEY,
  maxRetries: 3,
  persistAuthentication: true,
  enableCrossTabSync: true,
  routes: {
    login: '/auth/login',
    postLogin: '/dashboard',
    postLogout: '/auth/login'
  }
};

/**
 * Authentication API interface for making auth requests
 */
interface AuthApi {
  login: (email: string, password: string) => Promise<AuthSession>;
  register: (userData: object) => Promise<AuthSession>;
  verifyMfa: (code: string, tempToken: string) => Promise<AuthSession>;
  refreshToken: (refreshToken: string) => Promise<AuthSession>;
  socialLogin: (provider: string, tokenData: object) => Promise<AuthSession>;
  logout: () => Promise<void>;
}

/**
 * Web-specific authentication adapter that implements localStorage-based token persistence,
 * cross-tab session synchronization, and Next.js navigation integration for authentication flows.
 */
export class AuthAdapter {
  private options: AuthAdapterOptions;
  private refreshTimerId: NodeJS.Timeout | null = null;
  private authState: AuthState = { session: null, status: 'loading' };
  private authApi: AuthApi;
  private storageListener: ((event: StorageEvent) => void) | null = null;

  /**
   * Creates a new AuthAdapter instance
   * @param authApi Authentication API implementation
   * @param options Configuration options for the adapter
   */
  constructor(authApi: AuthApi, options: AuthAdapterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.authApi = authApi;

    // Set up cross-tab synchronization if enabled
    if (this.options.enableCrossTabSync && typeof window !== 'undefined') {
      this.setupStorageListener();
    }
  }

  /**
   * Sets up storage event listener for cross-tab synchronization
   * @private
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') return;

    this.storageListener = (event: StorageEvent) => {
      const storageKey = this.options.storageKey || AUTH_STORAGE_KEY;
      
      // Only process events for our storage key
      if (event.key === storageKey) {
        try {
          if (event.newValue) {
            // Another tab has set a session
            const session = JSON.parse(event.newValue) as AuthSession;
            this.updateAuthState({ session, status: 'authenticated' });
            
            // Schedule token refresh if enabled
            if (this.options.autoRefreshTokens) {
              this.scheduleTokenRefresh(session.expiresAt);
            }
          } else {
            // Another tab has cleared the session (logout)
            this.clearLocalState();
            this.updateAuthState({ session: null, status: 'unauthenticated' });
          }
        } catch (error) {
          console.error('Error processing storage event:', error);
        }
      }
    };

    window.addEventListener(AUTH_STORAGE_EVENT, this.storageListener);
  }

  /**
   * Removes storage event listener
   * @private
   */
  private removeStorageListener(): void {
    if (typeof window === 'undefined' || !this.storageListener) return;
    
    window.removeEventListener(AUTH_STORAGE_EVENT, this.storageListener);
    this.storageListener = null;
  }

  /**
   * Loads the persisted authentication session from localStorage
   * @returns Promise that resolves with the loaded auth state
   */
  async loadPersistedSession(): Promise<AuthState> {
    if (typeof window === 'undefined') {
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      return this.authState;
    }

    try {
      const storageKey = this.options.storageKey || AUTH_STORAGE_KEY;
      const sessionData = localStorage.getItem(storageKey);
      
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
   * Persists the authentication session to localStorage
   * @param session Authentication session to persist
   * @returns Promise that resolves when the operation completes
   */
  async persistSession(session: AuthSession | null): Promise<void> {
    if (!this.options.persistAuthentication || typeof window === 'undefined') {
      return;
    }
    
    try {
      const storageKey = this.options.storageKey || AUTH_STORAGE_KEY;
      
      if (session) {
        localStorage.setItem(storageKey, JSON.stringify(session));
      } else {
        localStorage.removeItem(storageKey);
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
   * Clears the persisted authentication session from localStorage
   * @returns Promise that resolves when the operation completes
   */
  async clearSession(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storageKey = this.options.storageKey || AUTH_STORAGE_KEY;
      localStorage.removeItem(storageKey);
      this.clearLocalState();
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
   * Clears local state (timers, etc.)
   * @private
   */
  private clearLocalState(): void {
    // Clear any scheduled token refresh
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
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
   * @param navigate Optional navigation function from Next.js
   * @returns Promise that resolves when sign out is complete
   */
  async signOut(navigate?: (path: string) => void): Promise<void> {
    try {
      // Clear any scheduled token refresh
      this.clearLocalState();
      
      // Call logout API if we have a session
      if (this.authState.session) {
        try {
          await this.authApi.logout();
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with local logout even if API call fails
        }
      }
      
      // Clear session from storage
      await this.clearSession();
      
      // Update state
      this.updateAuthState({ session: null, status: 'unauthenticated' });
      
      // Navigate to login page if navigation function is provided
      if (navigate && this.options.routes?.postLogout) {
        navigate(this.options.routes.postLogout);
      }
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
      
      const newSession = await this.authApi.refreshToken(this.authState.session.refreshToken);
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
  getUserFromToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Validates a token without verifying its signature
   * @param token JWT token
   * @returns Token validation result
   */
  validateToken(token: string): TokenValidationResult {
    try {
      const decoded = this.getUserFromToken(token);
      
      if (!decoded) {
        return {
          isValid: false,
          error: 'Failed to decode token'
        };
      }
      
      const now = Math.floor(Date.now() / 1000);
      const validationErrors: Record<string, string> = {};
      
      // Check expiration
      if (decoded.exp && decoded.exp < now) {
        validationErrors.expiration = 'Token has expired';
      }
      
      // Check not before
      if (decoded.nbf && decoded.nbf > now) {
        validationErrors.notBefore = 'Token is not yet valid';
      }
      
      return {
        isValid: Object.keys(validationErrors).length === 0,
        token: {
          header: { alg: 'unknown', typ: 'JWT' }, // We don't have access to the header without a full JWT library
          payload: decoded,
          token,
          signature: ''
        },
        validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
        error: Object.keys(validationErrors).length > 0 ? 'Token validation failed' : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Token validation error: ' + (error as Error).message
      };
    }
  }

  /**
   * Checks if the current session is valid
   * @returns Whether the session is valid
   */
  isSessionValid(): boolean {
    if (!this.authState.session) {
      return false;
    }
    
    return this.authState.session.expiresAt > Date.now();
  }

  /**
   * Redirects to login page using Next.js navigation
   * @param navigate Next.js navigation function
   */
  redirectToLogin(navigate: (path: string) => void): void {
    if (this.options.routes?.login) {
      navigate(this.options.routes.login);
    }
  }

  /**
   * Redirects to post-login page using Next.js navigation
   * @param navigate Next.js navigation function
   */
  redirectAfterLogin(navigate: (path: string) => void): void {
    if (this.options.routes?.postLogin) {
      navigate(this.options.routes.postLogin);
    }
  }

  /**
   * Cleans up resources used by the adapter
   */
  cleanup(): void {
    // Clear any scheduled token refresh
    this.clearLocalState();
    
    // Remove storage event listener
    this.removeStorageListener();
  }
}