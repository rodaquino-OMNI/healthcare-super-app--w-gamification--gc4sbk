/**
 * @file index.ts
 * @description Barrel file that exports all event DTOs for clean imports throughout the application.
 * This file provides a single entry point for importing event-related data structures, simplifying
 * imports and ensuring consistent usage patterns throughout the codebase.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Integrate with @austa/interfaces package for consistent type definitions across the platform
 * - Implement proper export patterns for components and utilities
 * - Standardized, versioned event schemas defined in @austa/interfaces package
 * - Kafka.js consumers configured with dead-letter queues and exponential backoff retry strategies
 *
 * @example
 * // Import all event DTOs
 * import * as EventDTOs from './events/dto';
 *
 * @example
 * // Import specific DTOs
 * import { ProcessEventDto, CreateEventDto } from './events/dto';
 *
 * @example
 * // Use with validation pipe in NestJS
 * @Post()
 * processEvent(@Body() eventDto: ProcessEventDto) {
 *   // Process the validated event
 * }
 *
 * @example
 * // Use with Kafka consumer
 * @EventPattern('gamification.events')
 * async handleEvent(@Payload() eventDto: ProcessEventDto) {
 *   try {
 *     const response = await this.eventsService.processEvent(eventDto);
 *     return response;
 *   } catch (error) {
 *     // Handle error with retry mechanism
 *     this.deadLetterQueue.addEvent(eventDto, error);
 *     throw error;
 *   }
 * }
 */

// Export the main ProcessEventDto
export { ProcessEventDto } from './process-event.dto';

// Re-export event interfaces from @austa/interfaces for consistency
import {
  GamificationEvent,
  IEvent,
  IBaseEvent,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  ISystemEvent,
  EventTypeId,
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
  IEventPayload,
  IHealthEventData,
  ICareEventData,
  IPlanEventData,
  ISystemEventData,
  IEventVersion,
  IVersionedEvent
} from '@austa/interfaces/gamification';

// Export the interfaces namespace for selective importing
export {
  GamificationEvent,
  IEvent,
  IBaseEvent,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  ISystemEvent,
  EventTypeId,
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
  IEventPayload,
  IHealthEventData,
  ICareEventData,
  IPlanEventData,
  ISystemEventData,
  IEventVersion,
  IVersionedEvent
};

/**
 * DTO for creating a new event in the gamification system.
 * This is used when programmatically creating events within the application.
 */
export class CreateEventDto {
  /**
   * The type of the event.
   * @example 'HEALTH_METRIC_RECORDED', 'APPOINTMENT_BOOKED', 'CLAIM_SUBMITTED'
   */
  type: EventTypeId;

  /**
   * The ID of the user associated with the event.
   */
  userId: string;

  /**
   * The data associated with the event.
   * This contains journey-specific details about the event.
   */
  data: Record<string, any>;

  /**
   * The journey associated with the event.
   * @example 'health', 'care', 'plan'
   */
  journey?: 'health' | 'care' | 'plan';

  /**
   * Optional timestamp for the event.
   * If not provided, the current time will be used.
   */
  timestamp?: string;

  /**
   * Optional correlation ID for tracking related events.
   */
  correlationId?: string;
}

/**
 * DTO for bulk processing multiple events at once.
 * This is used for batch processing of events.
 */
export class BulkProcessEventsDto {
  /**
   * Array of events to process.
   */
  events: ProcessEventDto[];
}

/**
 * DTO for event processing response.
 * This is returned after an event has been processed.
 */
export class EventResponseDto {
  /**
   * Whether the event was processed successfully.
   */
  success: boolean;

  /**
   * The ID of the processed event.
   */
  eventId: string;

  /**
   * The user ID associated with the event.
   */
  userId: string;

  /**
   * Optional error message if processing failed.
   */
  error?: string;

  /**
   * Optional error code if processing failed.
   */
  errorCode?: string;

  /**
   * Optional retry information if processing failed and will be retried.
   */
  retry?: {
    /**
     * The number of retry attempts made so far.
     */
    attemptCount: number;
    
    /**
     * The maximum number of retry attempts that will be made.
     */
    maxAttempts: number;
    
    /**
     * The delay before the next retry attempt in milliseconds.
     */
    nextRetryDelay: number;
    
    /**
     * Whether the event has been sent to the dead letter queue.
     */
    sentToDLQ: boolean;
  };

  /**
   * Optional achievements unlocked by this event.
   */
  achievementsUnlocked?: {
    id: string;
    name: string;
    description: string;
    points: number;
    unlockedAt: string;
    journey?: 'health' | 'care' | 'plan' | 'cross-journey';
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    badgeUrl?: string;
  }[];

  /**
   * Optional quests progressed by this event.
   */
  questsProgressed?: {
    id: string;
    name: string;
    progress: number;
    completed: boolean;
    stepsCompleted?: number;
    totalSteps?: number;
    completedAt?: string;
    journey?: 'health' | 'care' | 'plan' | 'cross-journey';
  }[];

  /**
   * Optional rewards earned from this event.
   */
  rewardsEarned?: {
    id: string;
    name: string;
    description: string;
    value: number;
    earnedAt: string;
    type?: 'discount' | 'cashback' | 'gift' | 'subscription' | 'access' | 'other';
    expiresAt?: string;
    redeemUrl?: string;
  }[];

  /**
   * Optional points earned from this event.
   */
  pointsEarned?: number;

  /**
   * Optional level up information if the user leveled up from this event.
   */
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    pointsToNextLevel: number;
    newPerks?: string[];
  };
  
  /**
   * Optional metadata for additional context.
   */
  metadata?: Record<string, any>;
  
  /**
   * Optional correlation ID for tracking related events.
   */
  correlationId?: string;
  
  /**
   * Timestamp when the event was processed.
   */
  processedAt: string;
  
  /**
   * Version of the event schema used for processing.
   */
  schemaVersion: string;
}

/**
 * DTO for filtering events in queries.
 * This is used when retrieving events from the database.
 */
export class EventFilterDto {
  /**
   * Optional user ID to filter events by.
   */
  userId?: string;

  /**
   * Optional event types to include.
   */
  types?: EventTypeId[];

  /**
   * Optional journeys to include.
   */
  journeys?: ('health' | 'care' | 'plan')[];

  /**
   * Optional start date for filtering events.
   */
  startDate?: string;

  /**
   * Optional end date for filtering events.
   */
  endDate?: string;

  /**
   * Optional limit for the number of events to return.
   */
  limit?: number;

  /**
   * Optional offset for pagination.
   */
  offset?: number;

  /**
   * Optional sort direction.
   */
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Type guard to check if an event is from the health journey.
 * @param event The event to check
 * @returns True if the event is from the health journey
 */
export function isHealthJourneyEvent(event: { journey?: string }): boolean {
  return event.journey === 'health';
}

/**
 * Type guard to check if an event is from the care journey.
 * @param event The event to check
 * @returns True if the event is from the care journey
 */
export function isCareJourneyEvent(event: { journey?: string }): boolean {
  return event.journey === 'care';
}

/**
 * Type guard to check if an event is from the plan journey.
 * @param event The event to check
 * @returns True if the event is from the plan journey
 */
export function isPlanJourneyEvent(event: { journey?: string }): boolean {
  return event.journey === 'plan';
}

/**
 * Utility type to extract the data type based on event type.
 * This provides type safety when working with event data.
 */
export type EventDataType<T extends EventTypeId> = T extends HealthEventType
  ? IHealthEvent['payload']['data']
  : T extends CareEventType
  ? ICareEvent['payload']['data']
  : T extends PlanEventType
  ? IPlanEvent['payload']['data']
  : Record<string, any>;

/**
 * DTO for dead letter queue events.
 * This is used when an event fails processing and is sent to the dead letter queue.
 */
export class DeadLetterQueueEventDto {
  /**
   * The original event that failed processing.
   */
  originalEvent: ProcessEventDto;

  /**
   * The error that caused the event to fail processing.
   */
  error: {
    /**
     * The error message.
     */
    message: string;

    /**
     * The error stack trace.
     */
    stack?: string;

    /**
     * The error code.
     */
    code?: string;

    /**
     * Additional error details.
     */
    details?: Record<string, any>;
  };

  /**
   * The number of retry attempts made.
   */
  retryAttempts: number;

  /**
   * The maximum number of retry attempts that will be made.
   */
  maxRetryAttempts: number;

  /**
   * The timestamp when the event was added to the dead letter queue.
   */
  enqueuedAt: string;

  /**
   * Optional correlation ID for tracking related events.
   */
  correlationId?: string;

  /**
   * Optional reason for the failure.
   */
  reason?: 'validation_error' | 'processing_error' | 'timeout' | 'unknown';
}

/**
 * DTO for event versioning information.
 * This is used to track and manage event schema versions.
 */
export class EventVersionDto {
  /**
   * The major version number.
   * Incremented for breaking changes.
   */
  major: number;

  /**
   * The minor version number.
   * Incremented for backward-compatible additions.
   */
  minor: number;

  /**
   * The patch version number.
   * Incremented for backward-compatible fixes.
   */
  patch: number;

  /**
   * Creates a string representation of the version.
   * @returns The version string in semver format (e.g., "1.2.3")
   */
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  /**
   * Creates a new EventVersionDto from a version string.
   * @param versionString The version string in semver format (e.g., "1.2.3")
   * @returns A new EventVersionDto
   */
  static fromString(versionString: string): EventVersionDto {
    const parts = versionString.split('.');
    const version = new EventVersionDto();
    version.major = parseInt(parts[0] || '0', 10);
    version.minor = parseInt(parts[1] || '0', 10);
    version.patch = parseInt(parts[2] || '0', 10);
    return version;
  }

  /**
   * Compares this version with another version.
   * @param other The other version to compare with
   * @returns -1 if this < other, 0 if this === other, 1 if this > other
   */
  compareTo(other: EventVersionDto): -1 | 0 | 1 {
    if (this.major < other.major) return -1;
    if (this.major > other.major) return 1;
    if (this.minor < other.minor) return -1;
    if (this.minor > other.minor) return 1;
    if (this.patch < other.patch) return -1;
    if (this.patch > other.patch) return 1;
    return 0;
  }

  /**
   * Checks if this version is compatible with a required version.
   * @param required The required version
   * @returns True if this version is compatible with the required version
   */
  isCompatibleWith(required: EventVersionDto): boolean {
    // Major version must match exactly for compatibility
    if (this.major !== required.major) return false;
    
    // This minor version must be greater than or equal to required
    if (this.minor < required.minor) return false;
    
    // If minor versions match, this patch must be greater than or equal to required
    if (this.minor === required.minor && this.patch < required.patch) return false;
    
    return true;
  }
}