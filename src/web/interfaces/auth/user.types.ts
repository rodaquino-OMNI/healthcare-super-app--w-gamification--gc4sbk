/**
 * User profile interfaces for the AUSTA SuperApp
 * Defines data structures for authenticated user profiles, permissions, and preferences.
 * These interfaces ensure consistency in how user data is handled across both web and mobile applications.
 */

/**
 * Represents a user's role in the system
 */
export enum UserRole {
  /**
   * Standard user with basic access
   */
  USER = 'USER',
  
  /**
   * Healthcare provider with additional clinical access
   */
  PROVIDER = 'PROVIDER',
  
  /**
   * Administrator with system management capabilities
   */
  ADMIN = 'ADMIN',
}

/**
 * Represents a specific permission granted to a user
 */
export interface UserPermission {
  /**
   * Unique identifier for the permission
   */
  id: string;
  
  /**
   * Name of the permission
   */
  name: string;
  
  /**
   * Resource that this permission applies to
   */
  resource: string;
  
  /**
   * Action that is permitted (e.g., 'read', 'write', 'delete')
   */
  action: string;
  
  /**
   * Optional conditions that restrict when this permission applies
   */
  conditions?: Record<string, any>;
}

/**
 * Represents user preferences and settings
 */
export interface UserPreferences {
  /**
   * Preferred language for the application
   */
  language: string;
  
  /**
   * Notification preferences
   */
  notifications: {
    /**
     * Email notification settings
     */
    email: boolean;
    
    /**
     * Push notification settings
     */
    push: boolean;
    
    /**
     * SMS notification settings
     */
    sms: boolean;
    
    /**
     * In-app notification settings
     */
    inApp: boolean;
  };
  
  /**
   * Theme preference
   */
  theme: 'light' | 'dark' | 'system';
  
  /**
   * Journey-specific preferences
   */
  journeyPreferences: {
    /**
     * Health journey preferences
     */
    health?: Record<string, any>;
    
    /**
     * Care journey preferences
     */
    care?: Record<string, any>;
    
    /**
     * Plan journey preferences
     */
    plan?: Record<string, any>;
  };
}

/**
 * Represents journey-specific user attributes
 */
export interface JourneyUserAttributes {
  /**
   * Health journey specific attributes
   */
  health?: {
    /**
     * Connected health devices
     */
    connectedDevices?: string[];
    
    /**
     * Active health goals
     */
    activeGoals?: string[];
    
    /**
     * Health metrics tracking preferences
     */
    trackingPreferences?: Record<string, boolean>;
  };
  
  /**
   * Care journey specific attributes
   */
  care?: {
    /**
     * Preferred healthcare providers
     */
    preferredProviders?: string[];
    
    /**
     * Upcoming appointments
     */
    upcomingAppointments?: number;
    
    /**
     * Active medications
     */
    activeMedications?: number;
  };
  
  /**
   * Plan journey specific attributes
   */
  plan?: {
    /**
     * Active insurance plan ID
     */
    activePlanId?: string;
    
    /**
     * Pending claims count
     */
    pendingClaims?: number;
    
    /**
     * Available benefits
     */
    availableBenefits?: string[];
  };
}

/**
 * Represents a user's identity information
 */
export interface UserIdentity {
  /**
   * Unique identifier for the user
   */
  id: string;
  
  /**
   * User's email address
   */
  email: string;
  
  /**
   * User's full name
   */
  name: string;
  
  /**
   * URL to the user's profile picture
   */
  profilePictureUrl?: string;
  
  /**
   * User's phone number
   */
  phoneNumber?: string;
  
  /**
   * Date when the user account was created
   */
  createdAt: string;
  
  /**
   * Date when the user account was last updated
   */
  updatedAt: string;
}

/**
 * Represents a complete user profile with all associated data
 */
export interface User {
  /**
   * User's identity information
   */
  identity: UserIdentity;
  
  /**
   * User's assigned roles
   */
  roles: UserRole[];
  
  /**
   * User's granted permissions
   */
  permissions: UserPermission[];
  
  /**
   * User's preferences and settings
   */
  preferences: UserPreferences;
  
  /**
   * Journey-specific user attributes
   */
  journeyAttributes: JourneyUserAttributes;
  
  /**
   * Whether the user's email has been verified
   */
  emailVerified: boolean;
  
  /**
   * Whether the user's phone number has been verified
   */
  phoneVerified: boolean;
  
  /**
   * Whether the user has completed the onboarding process
   */
  onboardingCompleted: boolean;
  
  /**
   * User's gamification profile information
   */
  gamification: {
    /**
     * User's current level
     */
    level: number;
    
    /**
     * User's current experience points
     */
    xp: number;
    
    /**
     * Count of achievements earned
     */
    achievementsCount: number;
    
    /**
     * IDs of active quests
     */
    activeQuests: string[];
  };
}