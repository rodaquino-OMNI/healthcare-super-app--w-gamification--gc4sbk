/**
 * @file event-response.dto.ts
 * @description Defines the standardized response format for event processing operations
 * in the gamification engine. This DTO ensures consistent response structures across
 * all event processing endpoints and services.
 *
 * Part of the enhanced event architecture that provides:
 * - Consistent error handling for event processing
 * - Standardized response format with success/failure indicators
 * - Support for tracking points earned, achievements unlocked, and quests progressed
 * - Extensible metadata for journey-specific response data
 */

import { IsBoolean, IsNumber, IsString, IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Import interfaces from the shared packages for better integration
import { EventErrorType } from '@austa/interfaces/gamification';
import { GameProfile } from '@austa/interfaces/gamification/profiles';

/**
 * DTO for achievement updates in event responses
 * Tracks changes to achievement progress resulting from event processing
 */
export class AchievementUpdateDto {
  /**
   * ID of the achievement that was updated
   */
  @IsString()
  id: string;

  /**
   * Current progress value for the achievement
   */
  @IsNumber()
  progress: number;

  /**
   * Whether the achievement was newly unlocked by this event
   */
  @IsBoolean()
  @IsOptional()
  unlocked?: boolean;

  /**
   * Name of the achievement (included when unlocked)
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Description of the achievement (included when unlocked)
   */
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for quest updates in event responses
 * Tracks changes to quest progress resulting from event processing
 */
export class QuestUpdateDto {
  /**
   * ID of the quest that was updated
   */
  @IsString()
  id: string;

  /**
   * Current progress value for the quest
   */
  @IsNumber()
  progress: number;

  /**
   * Whether the quest was completed by this event
   */
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  /**
   * Name of the quest (included when completed)
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Description of the quest (included when completed)
   */
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for error details in event responses
 * Provides structured information about processing failures
 */
export class EventErrorDto {
  /**
   * Error type classification
   * Uses standardized error types from @austa/interfaces
   * Common types include:
   * - VALIDATION_ERROR: Event payload validation failed
   * - PROCESSING_ERROR: General processing error
   * - RULE_EVALUATION_ERROR: Error during rule evaluation
   * - DATABASE_ERROR: Database operation failed
   * - AUTHORIZATION_ERROR: User not authorized for this operation
   * - INTEGRATION_ERROR: Error in external system integration
   */
  @IsString()
  type: string;

  /**
   * Human-readable error message
   */
  @IsString()
  message: string;

  /**
   * Error code for programmatic handling
   */
  @IsString()
  @IsOptional()
  code?: string;

  /**
   * Additional context about the error
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  /**
   * Whether the error is retryable
   */
  @IsBoolean()
  @IsOptional()
  retryable?: boolean;
}

/**
 * Data transfer object for standardized responses from event processing operations.
 * Provides consistent structure for success or failure results with appropriate metadata.
 * Includes fields for tracking points earned, achievements unlocked, and error details if applicable.
 *
 * This DTO is used as the return type for all event processing operations in the gamification engine,
 * ensuring a consistent response format across all endpoints and services. It supports both successful
 * and failed event processing scenarios with appropriate context for each.
 *
 * The static factory methods `success()` and `failure()` provide convenient ways to create
 * properly formatted response objects with all required fields.
 *
 * @example
 * // Creating a successful response
 * const response = EventResponseDto.success({
 *   points: 50,
 *   message: 'Successfully processed health metric event',
 *   achievements: [{ id: 'ach-123', progress: 2, unlocked: true, name: 'Health Tracker' }],
 *   quests: [{ id: 'quest-456', progress: 3, completed: false }]
 * });
 *
 * @example
 * // Creating a failure response
 * const response = EventResponseDto.failure({
 *   message: 'Failed to process event due to invalid data',
 *   errorType: 'VALIDATION_ERROR',
 *   errorCode: 'INVALID_METRIC_VALUE',
 *   retryable: false
 * });
 */
export class EventResponseDto {
  /**
   * Indicates whether the event was processed successfully
   */
  @IsBoolean()
  success: boolean;

  /**
   * Number of points (XP) earned from this event
   * Will be 0 if no points were awarded or if processing failed
   */
  @IsNumber()
  points: number;

  /**
   * Optional message providing additional context about the event processing
   */
  @IsString()
  @IsOptional()
  message?: string;

  /**
   * List of achievements that were updated as a result of this event
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AchievementUpdateDto)
  @IsOptional()
  achievements?: AchievementUpdateDto[];

  /**
   * List of quests that were updated as a result of this event
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestUpdateDto)
  @IsOptional()
  quests?: QuestUpdateDto[];

  /**
   * User's updated game profile after processing the event
   * Only included when the profile was modified
   * Uses the GameProfile interface from @austa/interfaces/gamification/profiles
   */
  @IsObject()
  @IsOptional()
  profile?: GameProfile;

  /**
   * Error details if the event processing failed
   * Only included when success is false
   */
  @ValidateNested()
  @Type(() => EventErrorDto)
  @IsOptional()
  error?: EventErrorDto;

  /**
   * Journey-specific metadata related to the event processing
   * Can contain additional context relevant to the specific journey
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  /**
   * Correlation ID for tracing the event through the system
   */
  @IsString()
  @IsOptional()
  correlationId?: string;

  /**
   * Timestamp when the event processing was completed
   */
  @IsString()
  @IsOptional()
  timestamp?: string;

  /**
   * Creates a successful event response with all required fields
   * @param data Response data including points earned and optional achievements/quests
   * @returns EventResponseDto instance configured for a successful response
   */
  static success(data: {
    points: number;
    message?: string;
    achievements?: AchievementUpdateDto[];
    quests?: QuestUpdateDto[];
    profile?: GameProfile;
    metadata?: Record<string, any>;
    correlationId?: string;
  }): EventResponseDto {
    const response = new EventResponseDto();
    response.success = true;
    response.points = data.points;
    response.message = data.message;
    response.achievements = data.achievements || [];
    response.quests = data.quests || [];
    response.profile = data.profile;
    response.metadata = data.metadata;
    response.correlationId = data.correlationId;
    response.timestamp = new Date().toISOString();
    return response;
  }

  /**
   * Creates a failed event response
   * @param data Error data
   * @returns EventResponseDto instance
   */
  /**
   * Creates a failed event response
   * @param data Error data including message and optional error details
   * @returns EventResponseDto instance configured for an error response
   */
  static failure(data: {
    message: string;
    errorType?: string;
    errorCode?: string;
    errorContext?: Record<string, any>;
    retryable?: boolean;
    correlationId?: string;
    metadata?: Record<string, any>;
  }): EventResponseDto {
    const response = new EventResponseDto();
    response.success = false;
    response.points = 0;
    response.message = data.message;
    response.error = {
      type: data.errorType || 'PROCESSING_ERROR',
      message: data.message,
      code: data.errorCode,
      context: data.errorContext,
      retryable: data.retryable !== undefined ? data.retryable : false
    };
    response.correlationId = data.correlationId;
    response.metadata = data.metadata;
    response.timestamp = new Date().toISOString();
    return response;
  }
}