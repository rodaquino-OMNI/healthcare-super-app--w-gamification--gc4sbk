/**
 * @file Profile Event Interfaces
 * @description Defines TypeScript interfaces for profile-related events in the gamification engine.
 * These interfaces provide type-safe structures for events related to user profiles, such as
 * profile creation, XP changes, and level-ups. They support the standardized event schema
 * implementation required by the technical specification.
 */

import { IBaseEvent, IGamificationEventPayload } from '../../../events/interfaces/event.interface';
import { IGameProfile } from '@austa/interfaces/gamification';

/**
 * Enum defining all possible profile-related event types.
 * Used for type-safe event handling throughout the gamification engine.
 */
export enum ProfileEventType {
  PROFILE_CREATED = 'PROFILE_CREATED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  XP_ADDED = 'XP_ADDED',
  LEVEL_UP = 'LEVEL_UP',
  PROFILE_RESET = 'PROFILE_RESET'
}

/**
 * Interface for profile event payloads.
 * Extends the base gamification event payload with profile-specific properties.
 */
export interface IProfileEventPayload extends IGamificationEventPayload {
  /**
   * User ID associated with the profile
   * @example "user_123456"
   */
  userId: string;
  
  /**
   * Optional profile ID for the event
   * @example "profile_123456"
   */
  profileId?: string;
  
  /**
   * Optional XP amount for XP-related events
   * @example 100
   */
  xp?: number;
  
  /**
   * Optional level information for level-related events
   * @example { oldLevel: 1, newLevel: 2 }
   */
  level?: {
    oldLevel: number;
    newLevel: number;
  };
  
  /**
   * Optional snapshot of the profile state after the event
   * Used for audit and synchronization purposes
   */
  profileSnapshot?: Partial<IGameProfile>;
}

/**
 * Base interface for all profile-related events.
 * Extends the base event interface with profile-specific typing.
 */
export interface IProfileEvent extends IBaseEvent {
  /**
   * The type of profile event that occurred
   * Must be one of the ProfileEventType enum values
   */
  type: ProfileEventType;
  
  /**
   * Profile-specific event payload data
   */
  data: IProfileEventPayload;
}

/**
 * Interface for profile creation events.
 * Triggered when a new user profile is created in the gamification engine.
 */
export interface IProfileCreatedEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_CREATED;
  data: IProfileEventPayload & {
    /**
     * Initial profile state
     */
    profileSnapshot: {
      userId: string;
      level: number;
      xp: number;
      createdAt: string;
    };
  };
}

/**
 * Interface for profile update events.
 * Triggered when a user profile is updated with non-XP related changes.
 */
export interface IProfileUpdatedEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_UPDATED;
  data: IProfileEventPayload & {
    /**
     * Fields that were updated
     */
    updatedFields: string[];
    
    /**
     * Updated profile state
     */
    profileSnapshot: Partial<IGameProfile>;
  };
}

/**
 * Interface for XP addition events.
 * Triggered when XP is added to a user profile.
 */
export interface IXpAddedEvent extends IProfileEvent {
  type: ProfileEventType.XP_ADDED;
  data: IProfileEventPayload & {
    /**
     * Amount of XP added
     */
    xp: number;
    
    /**
     * Source of the XP (achievement, quest, etc.)
     */
    source?: string;
    
    /**
     * Source ID (achievement ID, quest ID, etc.)
     */
    sourceId?: string;
    
    /**
     * Updated profile state
     */
    profileSnapshot: {
      userId: string;
      level: number;
      xp: number;
      updatedAt: string;
    };
  };
}

/**
 * Interface for level-up events.
 * Triggered when a user gains enough XP to level up.
 */
export interface ILevelUpEvent extends IProfileEvent {
  type: ProfileEventType.LEVEL_UP;
  data: IProfileEventPayload & {
    /**
     * Level information
     */
    level: {
      oldLevel: number;
      newLevel: number;
    };
    
    /**
     * Current XP after leveling up
     */
    xp: number;
    
    /**
     * XP required for the next level
     */
    nextLevelXp: number;
    
    /**
     * Updated profile state
     */
    profileSnapshot: {
      userId: string;
      level: number;
      xp: number;
      updatedAt: string;
    };
  };
}

/**
 * Interface for profile reset events.
 * Triggered when a user profile is reset to default values.
 */
export interface IProfileResetEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_RESET;
  data: IProfileEventPayload & {
    /**
     * Reason for the reset
     */
    reason?: string;
    
    /**
     * Previous profile state before reset
     */
    previousState?: {
      level: number;
      xp: number;
    };
    
    /**
     * Updated profile state after reset
     */
    profileSnapshot: {
      userId: string;
      level: number;
      xp: number;
      updatedAt: string;
    };
  };
}

/**
 * Type union of all profile event interfaces.
 * Used for comprehensive type checking of profile events.
 */
export type ProfileEvent = 
  | IProfileCreatedEvent
  | IProfileUpdatedEvent
  | IXpAddedEvent
  | ILevelUpEvent
  | IProfileResetEvent;

/**
 * Interface for profile event handlers.
 * Provides a standardized contract for components that process profile events.
 */
export interface IProfileEventHandler {
  /**
   * Handles a profile event
   * @param event The profile event to handle
   * @returns A promise that resolves when the event has been handled
   */
  handleEvent(event: ProfileEvent): Promise<void>;
  
  /**
   * Validates a profile event
   * @param event The profile event to validate
   * @returns Whether the event is valid
   */
  validateEvent(event: ProfileEvent): boolean;
}