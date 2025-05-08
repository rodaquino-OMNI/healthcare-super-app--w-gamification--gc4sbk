/**
 * @file reward-event.interface.ts
 * @description Defines TypeScript interfaces for reward-related event payloads transmitted through Kafka.
 * This file establishes the contract for REWARD_GRANTED events and other reward lifecycle events,
 * ensuring consistent event structure across producers and consumers.
 *
 * This file implements the following requirements from the technical specification:
 * - Standardized, versioned event schemas defined in @austa/interfaces package
 * - Kafka.js consumers configured with dead-letter queues and exponential backoff retry strategies
 * - Enhanced event processing with improved reliability
 * - Type-safe event schema with consistent processing
 */

import { BaseEvent, EventMetadata, JourneyType } from '@austa/interfaces/common';
import { IVersionedEvent } from '../../events/interfaces/event-versioning.interface';

/**
 * Enum defining all possible reward event types.
 * These event types are used for Kafka topics and event routing.
 */
export enum RewardEventType {
  REWARD_GRANTED = 'REWARD.GRANTED',
  REWARD_REDEEMED = 'REWARD.REDEEMED',
  REWARD_EXPIRED = 'REWARD.EXPIRED'
}

/**
 * Base interface for all reward-related events in the gamification system.
 * Extends the BaseEvent interface from @austa/interfaces and adds reward-specific properties.
 */
export interface IRewardEvent extends BaseEvent, IVersionedEvent {
  /**
   * The type of reward event.
   */
  eventType: RewardEventType;
  
  /**
   * Metadata for event tracking and processing.
   */
  metadata: EventMetadata;
}

/**
 * Interface for events indicating that a reward has been granted to a user.
 * This event is published when a user earns a reward through achievements, quests, or other means.
 */
export interface IRewardGrantedEvent extends IRewardEvent {
  eventType: RewardEventType.REWARD_GRANTED;
  payload: {
    /**
     * The ID of the user who received the reward.
     */
    userId: string;
    
    /**
     * The ID of the reward that was granted.
     */
    rewardId: string;
    
    /**
     * The title of the granted reward.
     */
    rewardTitle: string;
    
    /**
     * The XP value associated with this reward, if any.
     */
    xpReward?: number;
    
    /**
     * The journey that triggered the reward grant.
     */
    journey?: JourneyType;
    
    /**
     * The timestamp when the reward was granted.
     * ISO 8601 format.
     */
    grantedAt: string;
    
    /**
     * The expiration date of the reward, if applicable.
     * ISO 8601 format.
     */
    expiresAt?: string;
    
    /**
     * The type of reward (discount, cashback, gift, etc.)
     */
    rewardType?: string;
    
    /**
     * The monetary or point value of the reward, if applicable.
     */
    value?: number;
    
    /**
     * Optional context about what triggered this reward.
     */
    context?: Record<string, any>;
  };
}

/**
 * Interface for events indicating that a user has redeemed a reward.
 * This event is published when a user exchanges or uses a previously granted reward.
 */
export interface IRewardRedeemedEvent extends IRewardEvent {
  eventType: RewardEventType.REWARD_REDEEMED;
  payload: {
    /**
     * The ID of the user who redeemed the reward.
     */
    userId: string;
    
    /**
     * The ID of the reward that was redeemed.
     */
    rewardId: string;
    
    /**
     * The title of the redeemed reward.
     */
    rewardTitle: string;
    
    /**
     * The timestamp when the reward was redeemed.
     * ISO 8601 format.
     */
    redeemedAt: string;
    
    /**
     * The journey where the reward was redeemed, if applicable.
     */
    journey?: JourneyType;
    
    /**
     * The type of reward (discount, cashback, gift, etc.)
     */
    rewardType?: string;
    
    /**
     * The monetary or point value of the reward, if applicable.
     */
    value?: number;
    
    /**
     * Optional redemption code or identifier.
     */
    redemptionCode?: string;
    
    /**
     * Optional context about the redemption process.
     */
    context?: Record<string, any>;
  };
}

/**
 * Interface for events indicating that a reward has expired without being redeemed.
 * This event is published when a reward reaches its expiration date without being used.
 */
export interface IRewardExpiredEvent extends IRewardEvent {
  eventType: RewardEventType.REWARD_EXPIRED;
  payload: {
    /**
     * The ID of the user who owned the expired reward.
     */
    userId: string;
    
    /**
     * The ID of the reward that expired.
     */
    rewardId: string;
    
    /**
     * The title of the expired reward.
     */
    rewardTitle: string;
    
    /**
     * The timestamp when the reward expired.
     * ISO 8601 format.
     */
    expiredAt: string;
    
    /**
     * The timestamp when the reward was originally granted.
     * ISO 8601 format.
     */
    grantedAt: string;
    
    /**
     * The journey that originally granted the reward, if applicable.
     */
    journey?: JourneyType;
    
    /**
     * The type of reward (discount, cashback, gift, etc.)
     */
    rewardType?: string;
    
    /**
     * The monetary or point value of the expired reward, if applicable.
     */
    value?: number;
  };
}

/**
 * Union type of all reward event interfaces.
 * This type can be used for functions that handle any type of reward event.
 */
export type RewardEvent = IRewardGrantedEvent | IRewardRedeemedEvent | IRewardExpiredEvent;

/**
 * Type guard to check if an event is a reward granted event.
 * @param event The event to check
 * @returns True if the event is a reward granted event
 */
export function isRewardGrantedEvent(event: IRewardEvent): event is IRewardGrantedEvent {
  return event.eventType === RewardEventType.REWARD_GRANTED;
}

/**
 * Type guard to check if an event is a reward redeemed event.
 * @param event The event to check
 * @returns True if the event is a reward redeemed event
 */
export function isRewardRedeemedEvent(event: IRewardEvent): event is IRewardRedeemedEvent {
  return event.eventType === RewardEventType.REWARD_REDEEMED;
}

/**
 * Type guard to check if an event is a reward expired event.
 * @param event The event to check
 * @returns True if the event is a reward expired event
 */
export function isRewardExpiredEvent(event: IRewardEvent): event is IRewardExpiredEvent {
  return event.eventType === RewardEventType.REWARD_EXPIRED;
}

/**
 * Creates a new reward granted event with the specified properties.
 * @param userId The ID of the user who received the reward
 * @param rewardId The ID of the granted reward
 * @param rewardTitle The title of the granted reward
 * @param options Additional options for the event
 * @returns A new IRewardGrantedEvent object
 */
export function createRewardGrantedEvent(
  userId: string,
  rewardId: string,
  rewardTitle: string,
  options?: {
    xpReward?: number;
    journey?: JourneyType;
    expiresAt?: string;
    rewardType?: string;
    value?: number;
    context?: Record<string, any>;
  }
): IRewardGrantedEvent {
  const now = new Date().toISOString();
  const correlationId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  return {
    eventType: RewardEventType.REWARD_GRANTED,
    version: '1.0.0',
    metadata: {
      timestamp: now,
      correlationId,
      source: 'gamification-engine'
    },
    payload: {
      userId,
      rewardId,
      rewardTitle,
      grantedAt: now,
      xpReward: options?.xpReward,
      journey: options?.journey,
      expiresAt: options?.expiresAt,
      rewardType: options?.rewardType,
      value: options?.value,
      context: options?.context
    }
  };
}

/**
 * Creates a new reward redeemed event with the specified properties.
 * @param userId The ID of the user who redeemed the reward
 * @param rewardId The ID of the redeemed reward
 * @param rewardTitle The title of the redeemed reward
 * @param options Additional options for the event
 * @returns A new IRewardRedeemedEvent object
 */
export function createRewardRedeemedEvent(
  userId: string,
  rewardId: string,
  rewardTitle: string,
  options?: {
    journey?: JourneyType;
    rewardType?: string;
    value?: number;
    redemptionCode?: string;
    context?: Record<string, any>;
  }
): IRewardRedeemedEvent {
  const now = new Date().toISOString();
  const correlationId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  return {
    eventType: RewardEventType.REWARD_REDEEMED,
    version: '1.0.0',
    metadata: {
      timestamp: now,
      correlationId,
      source: 'gamification-engine'
    },
    payload: {
      userId,
      rewardId,
      rewardTitle,
      redeemedAt: now,
      journey: options?.journey,
      rewardType: options?.rewardType,
      value: options?.value,
      redemptionCode: options?.redemptionCode,
      context: options?.context
    }
  };
}

/**
 * Creates a new reward expired event with the specified properties.
 * @param userId The ID of the user who owned the expired reward
 * @param rewardId The ID of the expired reward
 * @param rewardTitle The title of the expired reward
 * @param grantedAt The timestamp when the reward was originally granted
 * @param options Additional options for the event
 * @returns A new IRewardExpiredEvent object
 */
export function createRewardExpiredEvent(
  userId: string,
  rewardId: string,
  rewardTitle: string,
  grantedAt: string,
  options?: {
    journey?: JourneyType;
    rewardType?: string;
    value?: number;
  }
): IRewardExpiredEvent {
  const now = new Date().toISOString();
  const correlationId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  return {
    eventType: RewardEventType.REWARD_EXPIRED,
    version: '1.0.0',
    metadata: {
      timestamp: now,
      correlationId,
      source: 'gamification-engine'
    },
    payload: {
      userId,
      rewardId,
      rewardTitle,
      expiredAt: now,
      grantedAt,
      journey: options?.journey,
      rewardType: options?.rewardType,
      value: options?.value
    }
  };
}