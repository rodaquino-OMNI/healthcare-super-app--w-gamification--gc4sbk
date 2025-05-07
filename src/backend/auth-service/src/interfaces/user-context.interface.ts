/**
 * User Context Interfaces
 * 
 * This file defines interfaces for user context that includes user data, permissions, and roles.
 * These interfaces are used throughout the auth service to maintain consistent user context representation.
 * They are critical for authorization checks and user-specific operations.
 */

import { IUser, IRole, IPermission } from '@austa/interfaces/auth';

/**
 * Journey types supported by the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Interface for journey-specific context data
 */
export interface IJourneyContext {
  /**
   * The journey type this context belongs to
   */
  journeyType: JourneyType;
  
  /**
   * Journey-specific metadata
   */
  metadata: Record<string, any>;
  
  /**
   * Journey-specific preferences
   */
  preferences?: Record<string, any>;
  
  /**
   * Last accessed timestamp for this journey
   */
  lastAccessed?: Date;
}

/**
 * Interface for health journey specific context
 */
export interface IHealthJourneyContext extends IJourneyContext {
  journeyType: JourneyType.HEALTH;
  metadata: {
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
    metricPreferences?: Record<string, boolean>;
  };
}

/**
 * Interface for care journey specific context
 */
export interface ICareJourneyContext extends IJourneyContext {
  journeyType: JourneyType.CARE;
  metadata: {
    /**
     * Preferred healthcare providers
     */
    preferredProviders?: string[];
    
    /**
     * Upcoming appointments
     */
    upcomingAppointments?: string[];
    
    /**
     * Active treatments
     */
    activeTreatments?: string[];
  };
}

/**
 * Interface for plan journey specific context
 */
export interface IPlanJourneyContext extends IJourneyContext {
  journeyType: JourneyType.PLAN;
  metadata: {
    /**
     * Active insurance plans
     */
    activePlans?: string[];
    
    /**
     * Pending claims
     */
    pendingClaims?: string[];
    
    /**
     * Available benefits
     */
    availableBenefits?: string[];
  };
}

/**
 * Main user context interface that includes user data, permissions, and roles
 */
export interface IUserContext {
  /**
   * User data including id, email, name, etc.
   */
  user: IUser;
  
  /**
   * List of permissions the user has
   */
  permissions: IPermission[];
  
  /**
   * List of roles assigned to the user
   */
  roles: IRole[];
  
  /**
   * Journey-specific contexts
   */
  journeyContexts?: {
    health?: IHealthJourneyContext;
    care?: ICareJourneyContext;
    plan?: IPlanJourneyContext;
  };
  
  /**
   * Last authentication timestamp
   */
  lastAuthenticated: Date;
  
  /**
   * Authentication method used
   */
  authMethod: string;
  
  /**
   * Session identifier
   */
  sessionId: string;
}

/**
 * Interface for serializing user context to JSON
 */
export interface ISerializedUserContext {
  user: Omit<IUser, 'password'>;
  permissions: string[];
  roles: string[];
  journeyContexts?: Record<string, any>;
  lastAuthenticated: string;
  authMethod: string;
  sessionId: string;
}

/**
 * Interface for user context factory
 */
export interface IUserContextFactory {
  /**
   * Create a user context from user data, permissions, and roles
   */
  createContext(user: IUser, permissions: IPermission[], roles: IRole[]): IUserContext;
  
  /**
   * Serialize user context to JSON
   */
  serialize(context: IUserContext): ISerializedUserContext;
  
  /**
   * Deserialize user context from JSON
   */
  deserialize(serialized: ISerializedUserContext): IUserContext;
  
  /**
   * Add journey context to user context
   */
  addJourneyContext(userContext: IUserContext, journeyContext: IJourneyContext): IUserContext;
}