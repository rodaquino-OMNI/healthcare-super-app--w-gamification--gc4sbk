/**
 * User-related interfaces for the AUSTA SuperApp
 * Defines data structures for authenticated user profiles, permissions, roles, and settings.
 */

import { IBaseEntity } from '../common/model';
import { Nullable } from '../common/types';

/**
 * Core user interface with basic identity information
 * Used for representing the authenticated user throughout the application
 */
export interface IUser extends IBaseEntity {
  /**
   * User's email address, used as the primary identifier for authentication
   */
  email: string;
  
  /**
   * User's full name for display purposes
   */
  name: string;
  
  /**
   * URL to the user's profile picture
   */
  avatarUrl: Nullable<string>;
  
  /**
   * Indicates if the user's email has been verified
   */
  isEmailVerified: boolean;
  
  /**
   * Indicates if the user account is currently active
   */
  isActive: boolean;
  
  /**
   * The user's assigned roles
   */
  roles: IUserRole[];
  
  /**
   * The user's permissions derived from roles and direct assignments
   */
  permissions: IUserPermission[];
  
  /**
   * The user's profile information
   */
  profile: Nullable<IUserProfile>;
  
  /**
   * The user's preferences and settings
   */
  settings: IUserSettings;
  
  /**
   * Journey-specific user data
   */
  journeyData: IUserJourneyData;
}

/**
 * Extended user profile information
 * Contains additional personal details beyond the core user identity
 */
export interface IUserProfile extends IBaseEntity {
  /**
   * User's unique identifier
   */
  userId: string;
  
  /**
   * User's phone number
   */
  phoneNumber: Nullable<string>;
  
  /**
   * Indicates if the phone number has been verified
   */
  isPhoneVerified: boolean;
  
  /**
   * User's date of birth
   */
  dateOfBirth: Nullable<string>;
  
  /**
   * User's gender
   */
  gender: Nullable<'male' | 'female' | 'other' | 'prefer_not_to_say'>;
  
  /**
   * User's address information
   */
  address: Nullable<IUserAddress>;
  
  /**
   * User's preferred language for the application
   */
  preferredLanguage: string;
  
  /**
   * Additional custom attributes for the user profile
   */
  attributes: Record<string, any>;
}

/**
 * User address information
 */
export interface IUserAddress {
  /**
   * Street address line 1
   */
  street1: string;
  
  /**
   * Street address line 2 (optional)
   */
  street2: Nullable<string>;
  
  /**
   * City
   */
  city: string;
  
  /**
   * State or province
   */
  state: string;
  
  /**
   * Postal or ZIP code
   */
  postalCode: string;
  
  /**
   * Country
   */
  country: string;
}

/**
 * User permission structure
 * Represents a single permission assigned to a user
 */
export interface IUserPermission {
  /**
   * Unique identifier for the permission
   */
  id: string;
  
  /**
   * Permission name (e.g., 'read:health_metrics')
   */
  name: string;
  
  /**
   * Human-readable description of the permission
   */
  description: string;
  
  /**
   * The journey this permission applies to (if journey-specific)
   */
  journey: Nullable<'health' | 'care' | 'plan'>;
  
  /**
   * The resource this permission applies to (e.g., 'health_metrics')
   */
  resource: string;
  
  /**
   * The action this permission allows (e.g., 'read', 'write', 'delete')
   */
  action: string;
  
  /**
   * Indicates if this permission was granted through a role or directly
   */
  grantedViaRole: boolean;
  
  /**
   * The role ID that granted this permission (if applicable)
   */
  roleId: Nullable<string>;
}

/**
 * User role structure
 * Represents a role assigned to a user
 */
export interface IUserRole {
  /**
   * Unique identifier for the role
   */
  id: string;
  
  /**
   * Role name (e.g., 'admin', 'user', 'health_coach')
   */
  name: string;
  
  /**
   * Human-readable description of the role
   */
  description: string;
  
  /**
   * The journey this role applies to (if journey-specific)
   */
  journey: Nullable<'health' | 'care' | 'plan'>;
  
  /**
   * Indicates if this is a default role assigned to all users
   */
  isDefault: boolean;
}

/**
 * User preferences and settings
 * Contains user-configurable options for the application
 */
export interface IUserSettings {
  /**
   * User's unique identifier
   */
  userId: string;
  
  /**
   * Notification preferences
   */
  notifications: INotificationSettings;
  
  /**
   * Privacy settings
   */
  privacy: IPrivacySettings;
  
  /**
   * Display and theme preferences
   */
  display: IDisplaySettings;
  
  /**
   * Journey-specific settings
   */
  journeySettings: IJourneySettings;
}

/**
 * Notification preferences
 */
export interface INotificationSettings {
  /**
   * Enable/disable email notifications
   */
  emailEnabled: boolean;
  
  /**
   * Enable/disable push notifications
   */
  pushEnabled: boolean;
  
  /**
   * Enable/disable SMS notifications
   */
  smsEnabled: boolean;
  
  /**
   * Enable/disable in-app notifications
   */
  inAppEnabled: boolean;
  
  /**
   * Specific notification types to enable/disable
   */
  preferences: {
    /**
     * Notifications for achievements and rewards
     */
    achievements: boolean;
    
    /**
     * Notifications for appointments and reminders
     */
    appointments: boolean;
    
    /**
     * Notifications for health goals and metrics
     */
    healthUpdates: boolean;
    
    /**
     * Notifications for plan and benefit updates
     */
    planUpdates: boolean;
    
    /**
     * Marketing and promotional notifications
     */
    marketing: boolean;
  };
}

/**
 * Privacy settings
 */
export interface IPrivacySettings {
  /**
   * Share profile with other users
   */
  shareProfile: boolean;
  
  /**
   * Appear in leaderboards and social features
   */
  showInLeaderboards: boolean;
  
  /**
   * Share health data with healthcare providers
   */
  shareHealthData: boolean;
  
  /**
   * Allow data to be used for personalized recommendations
   */
  allowPersonalization: boolean;
}

/**
 * Display and theme preferences
 */
export interface IDisplaySettings {
  /**
   * Preferred theme (light, dark, system)
   */
  theme: 'light' | 'dark' | 'system';
  
  /**
   * Font size preference
   */
  fontSize: 'small' | 'medium' | 'large';
  
  /**
   * Enable/disable animations
   */
  enableAnimations: boolean;
  
  /**
   * Enable/disable high contrast mode
   */
  highContrast: boolean;
}

/**
 * Journey-specific settings
 */
export interface IJourneySettings {
  /**
   * Health journey settings
   */
  health: {
    /**
     * Preferred units for health metrics (metric or imperial)
     */
    units: 'metric' | 'imperial';
    
    /**
     * Default dashboard view
     */
    defaultView: 'summary' | 'metrics' | 'goals';
    
    /**
     * Health metrics to display on dashboard
     */
    dashboardMetrics: string[];
  };
  
  /**
   * Care journey settings
   */
  care: {
    /**
     * Preferred appointment reminder time (in minutes before appointment)
     */
    appointmentReminder: number;
    
    /**
     * Preferred telemedicine provider
     */
    preferredProvider: Nullable<string>;
    
    /**
     * Default view for care dashboard
     */
    defaultView: 'appointments' | 'medications' | 'providers';
  };
  
  /**
   * Plan journey settings
   */
  plan: {
    /**
     * Default view for plan dashboard
     */
    defaultView: 'overview' | 'benefits' | 'claims';
    
    /**
     * Enable/disable automatic claim submission
     */
    autoSubmitClaims: boolean;
    
    /**
     * Preferred currency for displaying costs
     */
    currency: string;
  };
}

/**
 * Journey-specific user data
 * Contains data specific to each journey that needs to be available in the user context
 */
export interface IUserJourneyData {
  /**
   * Health journey data
   */
  health: {
    /**
     * Active health goals count
     */
    activeGoalsCount: number;
    
    /**
     * Connected devices count
     */
    connectedDevicesCount: number;
    
    /**
     * Latest health metrics summary
     */
    latestMetrics: Record<string, any>;
  };
  
  /**
   * Care journey data
   */
  care: {
    /**
     * Upcoming appointments count
     */
    upcomingAppointmentsCount: number;
    
    /**
     * Active medications count
     */
    activeMedicationsCount: number;
    
    /**
     * Next appointment date (if any)
     */
    nextAppointmentDate: Nullable<string>;
  };
  
  /**
   * Plan journey data
   */
  plan: {
    /**
     * Current plan ID
     */
    currentPlanId: Nullable<string>;
    
    /**
     * Current plan name
     */
    currentPlanName: Nullable<string>;
    
    /**
     * Pending claims count
     */
    pendingClaimsCount: number;
    
    /**
     * Benefits utilization percentage
     */
    benefitsUtilization: number;
  };
  
  /**
   * Gamification data
   */
  gamification: {
    /**
     * Current user level
     */
    level: number;
    
    /**
     * Current experience points
     */
    xp: number;
    
    /**
     * Experience points needed for next level
     */
    nextLevelXp: number;
    
    /**
     * Completed achievements count
     */
    achievementsCount: number;
    
    /**
     * Active quests count
     */
    activeQuestsCount: number;
  };
}