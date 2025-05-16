/**
 * Web Authentication Adapter
 * 
 * This adapter implements web-specific authentication functionality including:
 * - localStorage-based token storage with appropriate security measures
 * - Automatic token refresh mechanisms
 * - Session synchronization across browser tabs
 * - Secure logout functionality across all tabs
 * - Integration with Next.js navigation for authentication flows
 * 
 * @packageDocumentation
 */

import { AuthSession, isAuthSession } from '@austa/interfaces/auth/session.types';
import { AuthState } from '@austa/interfaces/auth/state.types';
import { WEB_AUTH_ROUTES } from '@austa/shared/constants/routes';

// Storage key for authentication session
const AUTH_STORAGE_KEY = 'austa_auth_session';

// Event name for cross-tab authentication synchronization
const AUTH_SYNC_EVENT = 'austa_auth_sync';

// Storage event key for fallback synchronization (for browsers without BroadcastChannel)
const AUTH_STORAGE_SYNC_KEY = 'austa_auth_sync_event';

// Minimum time before token expiration to trigger refresh (in milliseconds)
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// Check if BroadcastChannel API is supported
const isBroadcastChannelSupported = typeof BroadcastChannel !== 'undefined';

/**
 * Web Authentication Adapter
 * 
 * Provides web-specific implementation for authentication operations
 * including localStorage persistence, cross-tab synchronization, and
 * integration with Next.js navigation.
 */
export class WebAuthAdapter {
  private refreshTimer: NodeJS.Timeout | null = null;
  private _broadcastChannel: BroadcastChannel | null = null;
  
  /**
   * Initializes the authentication adapter and sets up storage event listeners
   * for cross-tab synchronization.
   */
  constructor() {
    // Only set up event listeners in browser environment
    if (typeof window !== 'undefined') {
      // Listen for storage events to synchronize auth state across tabs
      window.addEventListener('storage', this.handleStorageEvent);
      
      // Listen for custom auth sync events
      window.addEventListener('austa_auth_sync', this.handleSyncEvent as EventListener);
      
      // Set up BroadcastChannel listener if supported
      if (isBroadcastChannelSupported) {
        this.setupBroadcastChannelListener();
      }
    }
  }
  
  /**
   * Sets up a BroadcastChannel listener for cross-tab communication
   */
  private setupBroadcastChannelListener(): void {
    try {
      const channel = new BroadcastChannel('austa_auth_channel');
      
      channel.onmessage = (event) => {
        const { type, session } = event.data || {};
        
        if (type === 'SESSION_CHANGE') {
          // Handle session change from another tab
          this.handleSyncEvent(new CustomEvent(AUTH_SYNC_EVENT, { detail: { session } }));
        } else if (type === 'LOGOUT') {
          // Handle logout from another tab
          this.clearSession();
          
          // Notify listeners about the auth state change
          window.dispatchEvent(new CustomEvent('austa_auth_state_changed'));
          
          // Redirect to login page if we have access to router
          // This will be handled by the AuthContext
          window.dispatchEvent(new CustomEvent('austa_logout_redirect'));
        }
      };
      
      // Store the channel reference for cleanup
      this._broadcastChannel = channel;
    } catch (error) {
      console.error('Failed to set up BroadcastChannel:', error);
    }
  }
  
  /**
   * Cleans up event listeners and timers when the adapter is no longer needed
   */
  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
      window.removeEventListener('austa_auth_sync', this.handleSyncEvent as EventListener);
      
      // Close BroadcastChannel if it exists
      if (this._broadcastChannel) {
        this._broadcastChannel.close();
        this._broadcastChannel = null;
      }
    }
    
    this.clearRefreshTimer();
  }
  
  /**
   * Retrieves the current authentication session from localStorage
   * 
   * @returns The current authentication session or null if not authenticated
   */
  public getSession(): AuthSession | null {
    if (typeof window === 'undefined') {
      return null; // Not in browser environment
    }
    
    try {
      const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
      
      if (!storedSession) {
        return null;
      }
      
      const parsedSession = JSON.parse(storedSession);
      
      // Validate the session structure
      if (!isAuthSession(parsedSession)) {
        console.error('Invalid session format in localStorage');
        this.clearSession();
        return null;
      }
      
      // Check if the token is expired
      if (parsedSession.expiresAt <= Date.now()) {
        // Token is expired, but we'll return it anyway so the refresh mechanism can handle it
        return parsedSession;
      }
      
      return parsedSession;
    } catch (error) {
      console.error('Failed to parse stored session:', error);
      this.clearSession();
      return null;
    }
  }
  
  /**
   * Saves the authentication session to localStorage and sets up token refresh
   * 
   * @param session - The authentication session to save
   */
  public setSession(session: AuthSession | null): void {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }
    
    this.clearRefreshTimer();
    
    if (session) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        
        // Set up automatic token refresh
        this.setupTokenRefresh(session);
        
        // Notify other tabs about the session change
        this.broadcastSessionChange(session);
      } catch (error) {
        console.error('Failed to store auth session:', error);
        
        // If localStorage is full or unavailable, try to clear some space
        if (error instanceof DOMException && 
            (error.name === 'QuotaExceededError' || 
             error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          this.handleStorageFullError();
          
          // Try again after clearing space
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
          } catch (retryError) {
            console.error('Failed to store auth session after clearing space:', retryError);
          }
        }
      }
    } else {
      this.clearSession();
    }
  }
  
  /**
   * Clears the authentication session from localStorage and broadcasts the change
   */
  public clearSession(): void {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }
    
    this.clearRefreshTimer();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    // Notify other tabs about the session change
    this.broadcastSessionChange(null);
  }
  
  /**
   * Handles user login by saving the session and setting up token refresh
   * 
   * @param session - The authentication session from successful login
   * @returns The authentication session
   */
  public handleLogin(session: AuthSession): AuthSession {
    this.setSession(session);
    return session;
  }
  
  /**
   * Handles user logout by clearing the session and redirecting to login page
   * 
   * @param router - Next.js router instance for navigation
   */
  public handleLogout(router: any): void {
    this.clearSession();
    router.push(WEB_AUTH_ROUTES.LOGIN);
  }
  
  /**
   * Performs a global logout across all tabs
   * 
   * @param router - Next.js router instance for navigation
   */
  public handleGlobalLogout(router: any): void {
    this.clearSession();
    
    // Broadcast logout event to all tabs
    if (typeof window !== 'undefined') {
      if (isBroadcastChannelSupported) {
        try {
          const bc = new BroadcastChannel('austa_auth_channel');
          bc.postMessage({ type: 'LOGOUT' });
          bc.close();
        } catch (error) {
          console.error('Failed to broadcast logout event:', error);
          this.fallbackLogoutBroadcast();
        }
      } else {
        // Use localStorage as fallback for browsers without BroadcastChannel support
        this.fallbackLogoutBroadcast();
      }
    }
    
    router.push(WEB_AUTH_ROUTES.LOGIN);
  }
  
  /**
   * Fallback method to broadcast logout using localStorage
   * This is used for browsers that don't support the BroadcastChannel API
   */
  private fallbackLogoutBroadcast(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Use a special key for logout events
      const logoutData = {
        type: 'LOGOUT',
        timestamp: Date.now()
      };
      
      localStorage.setItem('austa_auth_logout_event', JSON.stringify(logoutData));
      
      // Remove the item immediately to allow future events
      setTimeout(() => {
        localStorage.removeItem('austa_auth_logout_event');
      }, 100);
    } catch (error) {
      console.error('Failed to use localStorage for logout broadcast:', error);
    }
  }
  
  /**
   * Gets the current authentication state
   * 
   * @returns The current authentication state
   */
  public getAuthState(): AuthState {
    const session = this.getSession();
    
    // If we have a session but it's expired, we're in a loading state
    // while we attempt to refresh the token
    if (session && session.expiresAt <= Date.now()) {
      return {
        session,
        status: 'loading'
      };
    }
    
    return {
      session,
      status: session ? 'authenticated' : 'unauthenticated'
    };
  }
  
  /**
   * Refreshes the authentication token if it's expired or about to expire
   * 
   * @param refreshCallback - Function to call to refresh the token
   * @returns A promise that resolves with the refreshed session or null if refresh failed
   */
  public async refreshTokenIfNeeded(
    refreshCallback: (refreshToken: string) => Promise<AuthSession>
  ): Promise<AuthSession | null> {
    const session = this.getSession();
    
    if (!session) {
      return null;
    }
    
    // Check if token is expired or about to expire
    const now = Date.now();
    const shouldRefresh = session.expiresAt - now < TOKEN_REFRESH_THRESHOLD;
    
    if (shouldRefresh) {
      try {
        const newSession = await refreshCallback(session.refreshToken);
        this.setSession(newSession);
        return newSession;
      } catch (error) {
        console.error('Token refresh failed:', error);
        
        // If refresh token is invalid, clear the session
        if ((error as any)?.response?.status === 401) {
          this.clearSession();
        }
        
        return null;
      }
    }
    
    return session;
  }
  
  /**
   * Sets up automatic token refresh based on token expiration
   * 
   * @param session - The current authentication session
   */
  private setupTokenRefresh(session: AuthSession): void {
    this.clearRefreshTimer();
    
    if (!session) {
      return;
    }
    
    const now = Date.now();
    const timeUntilRefresh = Math.max(0, session.expiresAt - now - TOKEN_REFRESH_THRESHOLD);
    
    // Set up timer to check for token refresh
    this.refreshTimer = setTimeout(() => {
      // This will be handled by the AuthContext which will call refreshTokenIfNeeded
      // We just need to trigger the event here
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('austa_token_refresh_needed'));
      }
    }, timeUntilRefresh);
  }
  
  /**
   * Clears the token refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  /**
   * Handles storage events for cross-tab synchronization
   * 
   * @param event - Storage event
   */
  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === AUTH_STORAGE_KEY) {
      // Notify listeners about the auth state change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('austa_auth_state_changed'));
      }
    } else if (event.key === 'austa_auth_logout_event' && event.newValue) {
      // Handle logout event from another tab
      this.clearSession();
      
      // Notify listeners about the auth state change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('austa_auth_state_changed'));
        window.dispatchEvent(new CustomEvent('austa_logout_redirect'));
      }
    } else if (event.key === AUTH_STORAGE_SYNC_KEY && event.newValue) {
      // Handle fallback synchronization for browsers without BroadcastChannel
      try {
        const syncData = JSON.parse(event.newValue);
        const { session } = syncData;
        
        // Only update if the session is different from current
        const currentSession = this.getSession();
        const currentJson = currentSession ? JSON.stringify(currentSession) : null;
        const newJson = session ? JSON.stringify(session) : null;
        
        if (currentJson !== newJson) {
          // Update local storage without triggering another broadcast
          if (session) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
            this.setupTokenRefresh(session);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            this.clearRefreshTimer();
          }
          
          // Notify listeners about the auth state change
          window.dispatchEvent(new CustomEvent('austa_auth_state_changed'));
        }
      } catch (error) {
        console.error('Failed to process storage sync event:', error);
      }
    }
  };
  
  /**
   * Handles custom sync events for cross-tab synchronization
   * 
   * @param event - Custom event with session data
   */
  private handleSyncEvent = (event: CustomEvent): void => {
    const { session } = event.detail || {};
    
    // Only update if the session is different from current
    const currentSession = this.getSession();
    const currentJson = currentSession ? JSON.stringify(currentSession) : null;
    const newJson = session ? JSON.stringify(session) : null;
    
    if (currentJson !== newJson) {
      // Update local storage without triggering another broadcast
      if (session) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        this.setupTokenRefresh(session);
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        this.clearRefreshTimer();
      }
      
      // Notify listeners about the auth state change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('austa_auth_state_changed'));
      }
    }
  };
  
  /**
   * Broadcasts session changes to other tabs
   * 
   * @param session - The updated session or null if logged out
   */
  private broadcastSessionChange(session: AuthSession | null): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Use BroadcastChannel API if available (more reliable than storage events)
    if (isBroadcastChannelSupported) {
      try {
        const bc = new BroadcastChannel('austa_auth_channel');
        bc.postMessage({ type: 'SESSION_CHANGE', session });
        bc.close();
      } catch (error) {
        console.error('Failed to broadcast session change:', error);
        this.fallbackBroadcast(session);
      }
    } else {
      // Use localStorage as fallback for browsers without BroadcastChannel support
      this.fallbackBroadcast(session);
    }
    
    // Dispatch custom event for in-page communication
    window.dispatchEvent(
      new CustomEvent(AUTH_SYNC_EVENT, { detail: { session } })
    );
  }
  
  /**
   * Fallback method to broadcast session changes using localStorage
   * This is used for browsers that don't support the BroadcastChannel API
   * 
   * @param session - The updated session or null if logged out
   */
  private fallbackBroadcast(session: AuthSession | null): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Use a timestamp to ensure the event is detected as a change
      const syncData = {
        session,
        timestamp: Date.now()
      };
      
      localStorage.setItem(AUTH_STORAGE_SYNC_KEY, JSON.stringify(syncData));
      
      // Remove the item immediately to allow future events with the same session
      // This is necessary because storage events only fire when the value changes
      setTimeout(() => {
        localStorage.removeItem(AUTH_STORAGE_SYNC_KEY);
      }, 100);
    } catch (error) {
      console.error('Failed to use localStorage for session broadcast:', error);
    }
  }
  
  /**
   * Handles localStorage quota exceeded errors by clearing non-essential data
   */
  private handleStorageFullError(): void {
    try {
      // Try to clear some space by removing non-essential items
      // This is a simple implementation - in a real app, you might want to
      // prioritize which items to remove based on importance/age
      const keysToKeep = [AUTH_STORAGE_KEY];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
          // Break after removing one item to minimize disruption
          break;
        }
      }
    } catch (error) {
      console.error('Failed to clear localStorage space:', error);
    }
  }
}

// Export a singleton instance
export const authAdapter = new WebAuthAdapter();

export default authAdapter;