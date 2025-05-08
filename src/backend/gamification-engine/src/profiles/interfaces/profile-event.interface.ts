/**
 * @file profile-event.interface.ts
 * @description Defines interfaces for profile-related events processed by the gamification engine.
 * These interfaces support the standardized event schema implementation required by the technical specification.
 *
 * This file implements the following requirements from the technical specification:
 * - Standardized, versioned event schemas defined in @austa/interfaces package
 * - Kafka.js consumers configured with dead-letter queues and exponential backoff retry strategies
 * - Enhanced event processing pipeline with proper validation mechanisms for all event types
 */

import { IBaseEvent, IEventPayload, IVersionedEvent } from '../../events/interfaces/event.interface';
import { IEventVersion } from '../../events/interfaces/event-versioning.interface';
import { EventTypeId } from '../../events/interfaces/event-type.interface';
import { GameProfile } from '@austa/interfaces/gamification';

/**
 * Enum defining all profile-related event types
 */
export enum ProfileEventType {
  PROFILE_CREATED = 'PROFILE_CREATED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PROFILE_LEVEL_UP = 'PROFILE_LEVEL_UP',
  PROFILE_XP_ADDED = 'PROFILE_XP_ADDED',
  PROFILE_XP_REMOVED = 'PROFILE_XP_REMOVED',
  PROFILE_RESET = 'PROFILE_RESET',
  PROFILE_METADATA_UPDATED = 'PROFILE_METADATA_UPDATED'
}

/**
 * Base interface for all profile-related events
 * @interface IProfileEvent
 * @extends {IBaseEvent}
 * @extends {IVersionedEvent}
 */
export interface IProfileEvent extends IBaseEvent, IVersionedEvent {
  /**
   * Type of the profile event
   */
  type: ProfileEventType;

  /**
   * Profile event payload
   */
  payload: IEventPayload<IProfileEventData>;
}

/**
 * Base interface for all profile event data
 * @interface IProfileEventData
 */
export interface IProfileEventData {
  /**
   * User ID associated with the profile
   */
  userId: string;

  /**
   * Optional profile data
   */
  profile?: Partial<GameProfile>;

  /**
   * Optional metadata for additional context
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for profile creation events
 * @interface IProfileCreatedEvent
 * @extends {IProfileEvent}
 */
export interface IProfileCreatedEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_CREATED;
  payload: IEventPayload<IProfileCreatedEventData>;
}

/**
 * Interface for profile creation event data
 * @interface IProfileCreatedEventData
 * @extends {IProfileEventData}
 */
export interface IProfileCreatedEventData extends IProfileEventData {
  /**
   * Complete profile data for the newly created profile
   */
  profile: GameProfile;

  /**
   * Whether this is the first time the user has created a profile
   */
  isFirstProfile: boolean;
}

/**
 * Interface for profile update events
 * @interface IProfileUpdatedEvent
 * @extends {IProfileEvent}
 */
export interface IProfileUpdatedEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_UPDATED;
  payload: IEventPayload<IProfileUpdatedEventData>;
}

/**
 * Interface for profile update event data
 * @interface IProfileUpdatedEventData
 * @extends {IProfileEventData}
 */
export interface IProfileUpdatedEventData extends IProfileEventData {
  /**
   * Updated profile data
   */
  profile: Partial<GameProfile>;

  /**
   * Previous profile data before the update
   */
  previousProfile?: Partial<GameProfile>;

  /**
   * Fields that were updated
   */
  updatedFields: string[];
}

/**
 * Interface for profile level up events
 * @interface IProfileLevelUpEvent
 * @extends {IProfileEvent}
 */
export interface IProfileLevelUpEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_LEVEL_UP;
  payload: IEventPayload<IProfileLevelUpEventData>;
}

/**
 * Interface for profile level up event data
 * @interface IProfileLevelUpEventData
 * @extends {IProfileEventData}
 */
export interface IProfileLevelUpEventData extends IProfileEventData {
  /**
   * Previous level before the level up
   */
  previousLevel: number;

  /**
   * New level after the level up
   */
  newLevel: number;

  /**
   * Current XP after the level up
   */
  currentXp: number;

  /**
   * XP required for the next level
   */
  nextLevelXp: number;

  /**
   * Whether this is a milestone level (e.g., 5, 10, 25, 50, etc.)
   */
  isMilestone: boolean;

  /**
   * Rewards earned from the level up, if any
   */
  rewards?: {
    id: string;
    type: string;
    name: string;
    description?: string;
    value?: number;
  }[];
}

/**
 * Interface for profile XP addition events
 * @interface IProfileXpAddedEvent
 * @extends {IProfileEvent}
 */
export interface IProfileXpAddedEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_XP_ADDED;
  payload: IEventPayload<IProfileXpAddedEventData>;
}

/**
 * Interface for profile XP addition event data
 * @interface IProfileXpAddedEventData
 * @extends {IProfileEventData}
 */
export interface IProfileXpAddedEventData extends IProfileEventData {
  /**
   * Amount of XP added
   */
  amount: number;

  /**
   * Previous XP before the addition
   */
  previousXp: number;

  /**
   * Current XP after the addition
   */
  currentXp: number;

  /**
   * Source of the XP (e.g., achievement, quest, daily login, etc.)
   */
  source: string;

  /**
   * Source ID (e.g., achievement ID, quest ID, etc.)
   */
  sourceId?: string;

  /**
   * Journey that generated the XP, if applicable
   */
  journey?: 'health' | 'care' | 'plan' | 'cross-journey';

  /**
   * Whether this XP addition triggered a level up
   */
  triggeredLevelUp: boolean;
}

/**
 * Interface for profile XP removal events
 * @interface IProfileXpRemovedEvent
 * @extends {IProfileEvent}
 */
export interface IProfileXpRemovedEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_XP_REMOVED;
  payload: IEventPayload<IProfileXpRemovedEventData>;
}

/**
 * Interface for profile XP removal event data
 * @interface IProfileXpRemovedEventData
 * @extends {IProfileEventData}
 */
export interface IProfileXpRemovedEventData extends IProfileEventData {
  /**
   * Amount of XP removed
   */
  amount: number;

  /**
   * Previous XP before the removal
   */
  previousXp: number;

  /**
   * Current XP after the removal
   */
  currentXp: number;

  /**
   * Reason for the XP removal
   */
  reason: string;

  /**
   * Whether this XP removal triggered a level down
   */
  triggeredLevelDown: boolean;

  /**
   * Admin user ID who performed the removal, if applicable
   */
  adminId?: string;
}

/**
 * Interface for profile reset events
 * @interface IProfileResetEvent
 * @extends {IProfileEvent}
 */
export interface IProfileResetEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_RESET;
  payload: IEventPayload<IProfileResetEventData>;
}

/**
 * Interface for profile reset event data
 * @interface IProfileResetEventData
 * @extends {IProfileEventData}
 */
export interface IProfileResetEventData extends IProfileEventData {
  /**
   * Previous profile data before the reset
   */
  previousProfile: Partial<GameProfile>;

  /**
   * New profile data after the reset
   */
  newProfile: Partial<GameProfile>;

  /**
   * Reason for the reset
   */
  reason: string;

  /**
   * Whether achievements were also reset
   */
  resetAchievements: boolean;

  /**
   * Whether quests were also reset
   */
  resetQuests: boolean;

  /**
   * Admin user ID who performed the reset, if applicable
   */
  adminId?: string;
}

/**
 * Interface for profile metadata update events
 * @interface IProfileMetadataUpdatedEvent
 * @extends {IProfileEvent}
 */
export interface IProfileMetadataUpdatedEvent extends IProfileEvent {
  type: ProfileEventType.PROFILE_METADATA_UPDATED;
  payload: IEventPayload<IProfileMetadataUpdatedEventData>;
}

/**
 * Interface for profile metadata update event data
 * @interface IProfileMetadataUpdatedEventData
 * @extends {IProfileEventData}
 */
export interface IProfileMetadataUpdatedEventData extends IProfileEventData {
  /**
   * Previous metadata before the update
   */
  previousMetadata?: Record<string, any>;

  /**
   * New metadata after the update
   */
  newMetadata: Record<string, any>;

  /**
   * Keys that were updated
   */
  updatedKeys: string[];
}

/**
 * Union type of all profile event types
 * @type ProfileEvent
 */
export type ProfileEvent =
  | IProfileCreatedEvent
  | IProfileUpdatedEvent
  | IProfileLevelUpEvent
  | IProfileXpAddedEvent
  | IProfileXpRemovedEvent
  | IProfileResetEvent
  | IProfileMetadataUpdatedEvent;

/**
 * Type guard to check if an event is a profile event
 * @param event The event to check
 * @returns True if the event is a profile event
 */
export function isProfileEvent(event: IBaseEvent): event is ProfileEvent {
  return Object.values(ProfileEventType).includes(event.type as ProfileEventType);
}

/**
 * Type guard to check if an event is a profile created event
 * @param event The event to check
 * @returns True if the event is a profile created event
 */
export function isProfileCreatedEvent(event: IBaseEvent): event is IProfileCreatedEvent {
  return event.type === ProfileEventType.PROFILE_CREATED;
}

/**
 * Type guard to check if an event is a profile level up event
 * @param event The event to check
 * @returns True if the event is a profile level up event
 */
export function isProfileLevelUpEvent(event: IBaseEvent): event is IProfileLevelUpEvent {
  return event.type === ProfileEventType.PROFILE_LEVEL_UP;
}

/**
 * Type guard to check if an event is a profile XP added event
 * @param event The event to check
 * @returns True if the event is a profile XP added event
 */
export function isProfileXpAddedEvent(event: IBaseEvent): event is IProfileXpAddedEvent {
  return event.type === ProfileEventType.PROFILE_XP_ADDED;
}

/**
 * Creates a profile created event
 * @param userId The user ID
 * @param profile The created profile
 * @param isFirstProfile Whether this is the first profile for the user
 * @param metadata Optional metadata
 * @returns A profile created event
 */
export function createProfileCreatedEvent(
  userId: string,
  profile: GameProfile,
  isFirstProfile: boolean,
  metadata?: Record<string, any>
): IProfileCreatedEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: ProfileEventType.PROFILE_CREATED,
    userId,
    data: { profile, isFirstProfile },
    timestamp: new Date().toISOString(),
    version: '1.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    payload: {
      data: {
        userId,
        profile,
        isFirstProfile,
        metadata
      }
    }
  };
}

/**
 * Creates a profile level up event
 * @param userId The user ID
 * @param previousLevel The previous level
 * @param newLevel The new level
 * @param currentXp The current XP
 * @param nextLevelXp The XP required for the next level
 * @param isMilestone Whether this is a milestone level
 * @param rewards Optional rewards earned from the level up
 * @param metadata Optional metadata
 * @returns A profile level up event
 */
export function createProfileLevelUpEvent(
  userId: string,
  previousLevel: number,
  newLevel: number,
  currentXp: number,
  nextLevelXp: number,
  isMilestone: boolean,
  rewards?: Array<{ id: string; type: string; name: string; description?: string; value?: number }>,
  metadata?: Record<string, any>
): IProfileLevelUpEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: ProfileEventType.PROFILE_LEVEL_UP,
    userId,
    data: { previousLevel, newLevel, currentXp, nextLevelXp, isMilestone, rewards },
    timestamp: new Date().toISOString(),
    version: '1.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    payload: {
      data: {
        userId,
        previousLevel,
        newLevel,
        currentXp,
        nextLevelXp,
        isMilestone,
        rewards,
        metadata
      }
    }
  };
}

/**
 * Creates a profile XP added event
 * @param userId The user ID
 * @param amount The amount of XP added
 * @param previousXp The previous XP
 * @param currentXp The current XP
 * @param source The source of the XP
 * @param sourceId Optional source ID
 * @param journey Optional journey that generated the XP
 * @param triggeredLevelUp Whether this XP addition triggered a level up
 * @param metadata Optional metadata
 * @returns A profile XP added event
 */
export function createProfileXpAddedEvent(
  userId: string,
  amount: number,
  previousXp: number,
  currentXp: number,
  source: string,
  sourceId?: string,
  journey?: 'health' | 'care' | 'plan' | 'cross-journey',
  triggeredLevelUp: boolean = false,
  metadata?: Record<string, any>
): IProfileXpAddedEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: ProfileEventType.PROFILE_XP_ADDED,
    userId,
    data: { amount, previousXp, currentXp, source, sourceId, journey, triggeredLevelUp },
    timestamp: new Date().toISOString(),
    version: '1.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    payload: {
      data: {
        userId,
        amount,
        previousXp,
        currentXp,
        source,
        sourceId,
        journey,
        triggeredLevelUp,
        metadata
      }
    }
  };
}

/**
 * Gets the version of a profile event
 * @param event The profile event
 * @returns The event version
 */
export function getProfileEventVersion(event: ProfileEvent): IEventVersion {
  const versionParts = event.version.split('.');
  return {
    major: parseInt(versionParts[0], 10) || 0,
    minor: parseInt(versionParts[1], 10) || 0,
    patch: parseInt(versionParts[2], 10) || 0,
    toString: () => event.version
  };
}

/**
 * Validates a profile event
 * @param event The profile event to validate
 * @returns True if the event is valid
 */
export function validateProfileEvent(event: ProfileEvent): boolean {
  // Basic validation
  if (!event.type || !event.userId || !event.timestamp || !event.version) {
    return false;
  }

  // Type-specific validation
  switch (event.type) {
    case ProfileEventType.PROFILE_CREATED:
      return !!event.payload?.data?.profile;

    case ProfileEventType.PROFILE_LEVEL_UP:
      return (
        typeof event.payload?.data?.previousLevel === 'number' &&
        typeof event.payload?.data?.newLevel === 'number' &&
        event.payload.data.newLevel > event.payload.data.previousLevel
      );

    case ProfileEventType.PROFILE_XP_ADDED:
      return (
        typeof event.payload?.data?.amount === 'number' &&
        event.payload.data.amount > 0 &&
        typeof event.payload?.data?.previousXp === 'number' &&
        typeof event.payload?.data?.currentXp === 'number' &&
        event.payload.data.currentXp === event.payload.data.previousXp + event.payload.data.amount
      );

    case ProfileEventType.PROFILE_XP_REMOVED:
      return (
        typeof event.payload?.data?.amount === 'number' &&
        event.payload.data.amount > 0 &&
        typeof event.payload?.data?.previousXp === 'number' &&
        typeof event.payload?.data?.currentXp === 'number' &&
        event.payload.data.currentXp === event.payload.data.previousXp - event.payload.data.amount
      );

    case ProfileEventType.PROFILE_RESET:
      return !!event.payload?.data?.previousProfile && !!event.payload?.data?.newProfile;

    case ProfileEventType.PROFILE_METADATA_UPDATED:
      return !!event.payload?.data?.newMetadata && Array.isArray(event.payload?.data?.updatedKeys);

    default:
      return true;
  }
}