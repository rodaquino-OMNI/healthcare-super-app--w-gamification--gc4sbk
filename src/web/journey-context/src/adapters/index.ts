/**
 * Journey Context Adapters
 * 
 * This file provides platform-specific adapters based on the runtime environment,
 * enabling the journey context package to be platform-agnostic while still
 * accessing platform-specific features.
 * 
 * It automatically detects whether the code is running in a web or mobile environment
 * and exports the appropriate adapters accordingly.
 */

import { Platform } from '../types/platform.types';

/**
 * Adapter interfaces
 * 
 * These interfaces define the contract for platform-specific adapters.
 * They ensure that both web and mobile implementations provide the same
 * functionality, even if the underlying implementation differs.
 */

// Authentication adapter interface
export interface IAuthAdapter {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getToken: () => Promise<string | null>;
  isAuthenticated: () => Promise<boolean>;
  getUserProfile: () => Promise<any>;
}

// Gamification adapter interface
export interface IGamificationAdapter {
  triggerEvent: (eventName: string, eventData: any) => Promise<void>;
  getAchievements: () => Promise<any[]>;
  getQuests: () => Promise<any[]>;
  getProfile: () => Promise<any>;
  getLeaderboard: () => Promise<any[]>;
}

// Journey adapter interface
export interface IJourneyAdapter {
  setCurrentJourney: (journeyId: string) => Promise<void>;
  getCurrentJourney: () => Promise<string | null>;
  getJourneyPreferences: () => Promise<any>;
  saveJourneyPreferences: (preferences: any) => Promise<void>;
}

// Navigation adapter interface
export interface INavigationAdapter {
  navigateTo: (route: string, params?: any) => void;
  goBack: () => void;
  resetToHome: () => void;
  getCurrentRoute: () => string;
  setRouteParams: (params: any) => void;
}

// Notification adapter interface
export interface INotificationAdapter {
  getNotifications: () => Promise<any[]>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  registerForPushNotifications: () => Promise<void>;
}

// Storage adapter interface
export interface IStorageAdapter {
  setItem: (key: string, value: any) => Promise<void>;
  getItem: (key: string) => Promise<any>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
}

/**
 * Detects the current platform (web or mobile) based on runtime environment.
 * 
 * This function uses multiple checks to reliably determine the platform:
 * 1. Checks for React Native-specific globals
 * 2. Checks for React Native-specific APIs
 * 3. Checks for web-specific APIs
 */
const detectPlatform = (): Platform => {
  try {
    // Primary check: React Native specific global
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return 'mobile';
    }
    
    // Secondary check: React Native specific APIs
    if (
      typeof global !== 'undefined' && 
      ((global as any).ReactNative || (global as any).__REACT_NATIVE_DEVTOOLS_GLOBAL_HOOK__)
    ) {
      return 'mobile';
    }
    
    // Tertiary check: Web-specific APIs that don't exist in React Native
    if (
      typeof window !== 'undefined' && 
      typeof document !== 'undefined' && 
      typeof window.localStorage !== 'undefined'
    ) {
      return 'web';
    }
    
    // Default to web platform if detection is inconclusive
    // This is a safer default for SSR environments
    return 'web';
  } catch (error) {
    // If any error occurs during detection, default to web
    console.warn('Platform detection failed, defaulting to web:', error);
    return 'web';
  }
};

// Determine the current platform
const currentPlatform = detectPlatform();

// Declare adapter variables with proper interface types
let AuthAdapter: IAuthAdapter;
let GamificationAdapter: IGamificationAdapter;
let JourneyAdapter: IJourneyAdapter;
let NavigationAdapter: INavigationAdapter;
let NotificationAdapter: INotificationAdapter;
let StorageAdapter: IStorageAdapter;

try {
  // Import and export platform-specific adapters based on detected platform
  if (currentPlatform === 'web') {
    // Using dynamic import with require for synchronous loading
    // This pattern maintains compatibility with various bundlers while
    // still allowing for conditional imports
    const webAdapters = require('./web');
    
    // Export web-specific adapters
    AuthAdapter = webAdapters.AuthAdapter;
    GamificationAdapter = webAdapters.GamificationAdapter;
    JourneyAdapter = webAdapters.JourneyAdapter;
    NavigationAdapter = webAdapters.NavigationAdapter;
    NotificationAdapter = webAdapters.NotificationAdapter;
    StorageAdapter = webAdapters.StorageAdapter;
  } else {
    // Import mobile adapters
    const mobileAdapters = require('./mobile');
    
    // Export mobile-specific adapters
    AuthAdapter = mobileAdapters.AuthAdapter;
    GamificationAdapter = mobileAdapters.GamificationAdapter;
    JourneyAdapter = mobileAdapters.JourneyAdapter;
    NavigationAdapter = mobileAdapters.NavigationAdapter;
    NotificationAdapter = mobileAdapters.NotificationAdapter;
    StorageAdapter = mobileAdapters.StorageAdapter;
  }
} catch (error) {
  // Handle initialization errors
  console.error(`Failed to initialize ${currentPlatform} adapters:`, error);
  throw new Error(`Journey context adapters initialization failed: ${error.message}`);
}

// Export platform-specific adapters with consistent interface
export {
  AuthAdapter,
  GamificationAdapter,
  JourneyAdapter,
  NavigationAdapter,
  NotificationAdapter,
  StorageAdapter,
  currentPlatform,
};

// Export platform detection utility for consumers that need to perform
// platform-specific logic outside of the adapters
export { detectPlatform };