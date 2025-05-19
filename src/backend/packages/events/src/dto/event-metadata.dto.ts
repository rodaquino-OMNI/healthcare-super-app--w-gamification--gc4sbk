/**
 * @file event-metadata.dto.ts
 * @description Defines standardized event metadata structure used across all journey events in the AUSTA SuperApp.
 * This DTO includes properties for event origin, version, correlation IDs, and additional context that enables
 * robust event tracking, debugging, and reconciliation. It ensures consistent metadata handling across services
 * and provides the foundation for distributed tracing and event correlation.
 */

import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  ValidateNested,
  IsObject,
  IsISO8601,
} from 'class-validator';

/**
 * Enum representing the available journeys in the AUSTA SuperApp.
 * Used to categorize events and provide journey-specific context.
 */
export enum Journey {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Enum representing the possible sources of events in the system.
 * Used to identify which service or component generated an event.
 */
export enum EventSource {
  // Services
  API_GATEWAY = 'api-gateway',
  AUTH_SERVICE = 'auth-service',
  HEALTH_SERVICE = 'health-service',
  CARE_SERVICE = 'care-service',
  PLAN_SERVICE = 'plan-service',
  GAMIFICATION_ENGINE = 'gamification-engine',
  NOTIFICATION_SERVICE = 'notification-service',
  
  // Clients
  WEB_CLIENT = 'web-client',
  MOBILE_CLIENT = 'mobile-client',
  
  // External
  EXTERNAL_INTEGRATION = 'external-integration',
  SCHEDULED_TASK = 'scheduled-task',
}

/**
 * DTO for event metadata that provides additional context and tracking information for events.
 * This class is used to standardize metadata across all events in the system, enabling
 * consistent tracking, debugging, and correlation of events across services.
 */
export class EventMetadataDto {
  /**
   * Correlation ID for tracking related events across services.
   * This ID should be preserved across service boundaries to maintain the event chain.
   * 
   * @example "abc123def456"
   */
  @IsString()
  @IsUUID(4)
  @IsOptional()
  correlationId?: string;

  /**
   * Trace ID for distributed tracing (OpenTelemetry compatible).
   * Used for end-to-end tracing of requests across multiple services.
   * 
   * @example "4bf92f3577b34da6a3ce929d0e0e4736"
   */
  @IsString()
  @IsOptional()
  traceId?: string;

  /**
   * User ID associated with this event, if applicable.
   * Identifies which user triggered or is affected by this event.
   * 
   * @example "user-123456"
   */
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * Journey context for the event (health, care, plan).
   * Identifies which journey this event belongs to for proper routing and processing.
   * 
   * @example "health", "care", "plan"
   */
  @IsEnum(Journey)
  @IsOptional()
  journey?: Journey;

  /**
   * The service or component that originated this event.
   * Used for debugging and auditing purposes.
   * 
   * @example "health-service", "mobile-client"
   */
  @IsEnum(EventSource)
  @IsOptional()
  source?: EventSource;

  /**
   * Timestamp when the event was created.
   * ISO 8601 format with timezone information.
   * 
   * @example "2023-04-15T14:32:17.123Z"
   */
  @IsISO8601()
  @IsOptional()
  timestamp?: string;

  /**
   * Additional context information relevant to the event.
   * Can contain any serializable data that provides more context.
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;

  /**
   * Error information if this event represents or contains an error.
   * Used for error tracking and debugging.
   */
  @ValidateNested()
  @Type(() => ErrorMetadataDto)
  @IsOptional()
  error?: ErrorMetadataDto;

  /**
   * Creates a new EventMetadataDto instance.
   * 
   * @param metadata - Optional initial metadata values
   */
  constructor(metadata?: Partial<EventMetadataDto>) {
    if (metadata) {
      Object.assign(this, metadata);
    }
  }

  /**
   * Creates a new EventMetadataDto with the same properties as this one,
   * but with additional or overridden properties.
   * 
   * @param additionalMetadata - The metadata to add or override
   * @returns A new EventMetadataDto instance
   */
  with(additionalMetadata: Partial<EventMetadataDto>): EventMetadataDto {
    return new EventMetadataDto({
      ...this,
      ...additionalMetadata,
      // Merge context objects if both exist
      context: this.context && additionalMetadata.context
        ? { ...this.context, ...additionalMetadata.context }
        : additionalMetadata.context || this.context,
    });
  }

  /**
   * Adds correlation information to the metadata.
   * 
   * @param correlationId - The correlation ID to add
   * @returns A new EventMetadataDto instance with the correlation ID
   */
  withCorrelation(correlationId: string): EventMetadataDto {
    return this.with({ correlationId });
  }

  /**
   * Adds tracing information to the metadata.
   * 
   * @param traceId - The trace ID to add
   * @returns A new EventMetadataDto instance with the trace ID
   */
  withTracing(traceId: string): EventMetadataDto {
    return this.with({ traceId });
  }

  /**
   * Adds user information to the metadata.
   * 
   * @param userId - The user ID to add
   * @returns A new EventMetadataDto instance with the user ID
   */
  withUser(userId: string): EventMetadataDto {
    return this.with({ userId });
  }

  /**
   * Adds journey information to the metadata.
   * 
   * @param journey - The journey to add
   * @returns A new EventMetadataDto instance with the journey
   */
  withJourney(journey: Journey): EventMetadataDto {
    return this.with({ journey });
  }

  /**
   * Adds source information to the metadata.
   * 
   * @param source - The source to add
   * @returns A new EventMetadataDto instance with the source
   */
  withSource(source: EventSource): EventMetadataDto {
    return this.with({ source });
  }

  /**
   * Adds error information to the metadata.
   * 
   * @param error - The error information to add
   * @returns A new EventMetadataDto instance with the error information
   */
  withError(error: ErrorMetadataDto | Error): EventMetadataDto {
    const errorMetadata = error instanceof ErrorMetadataDto
      ? error
      : new ErrorMetadataDto({
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
    
    return this.with({ error: errorMetadata });
  }

  /**
   * Adds context information to the metadata.
   * 
   * @param context - The context to add
   * @returns A new EventMetadataDto instance with the merged context
   */
  withContext(context: Record<string, unknown>): EventMetadataDto {
    return this.with({
      context: this.context ? { ...this.context, ...context } : context,
    });
  }

  /**
   * Creates a new EventMetadataDto from a plain object.
   * 
   * @param obj - The object to create the DTO from
   * @returns A new EventMetadataDto instance
   */
  static fromObject(obj: Record<string, unknown>): EventMetadataDto {
    const metadata = new EventMetadataDto();
    
    if (typeof obj.correlationId === 'string') {
      metadata.correlationId = obj.correlationId;
    }
    
    if (typeof obj.traceId === 'string') {
      metadata.traceId = obj.traceId;
    }
    
    if (typeof obj.userId === 'string') {
      metadata.userId = obj.userId;
    }
    
    if (obj.journey && Object.values(Journey).includes(obj.journey as Journey)) {
      metadata.journey = obj.journey as Journey;
    }
    
    if (obj.source && Object.values(EventSource).includes(obj.source as EventSource)) {
      metadata.source = obj.source as EventSource;
    }
    
    if (typeof obj.timestamp === 'string') {
      metadata.timestamp = obj.timestamp;
    }
    
    if (obj.context && typeof obj.context === 'object') {
      metadata.context = obj.context as Record<string, unknown>;
    }
    
    if (obj.error && typeof obj.error === 'object') {
      metadata.error = ErrorMetadataDto.fromObject(obj.error as Record<string, unknown>);
    }
    
    return metadata;
  }
}

/**
 * DTO for error metadata that provides structured error information for events.
 * This class is used to standardize error reporting across all events in the system.
 */
export class ErrorMetadataDto {
  /**
   * The error message.
   */
  @IsString()
  message: string;

  /**
   * The name or type of the error.
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * The error code, if applicable.
   * Used for categorizing and identifying specific error types.
   */
  @IsString()
  @IsOptional()
  code?: string;

  /**
   * The error stack trace, if available.
   * Used for debugging purposes.
   */
  @IsString()
  @IsOptional()
  stack?: string;

  /**
   * Additional details about the error.
   * Can contain any serializable data that provides more context.
   */
  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;

  /**
   * Creates a new ErrorMetadataDto instance.
   * 
   * @param error - Optional initial error values
   */
  constructor(error?: Partial<ErrorMetadataDto>) {
    if (error) {
      Object.assign(this, error);
    }
  }

  /**
   * Creates a new ErrorMetadataDto from a plain object.
   * 
   * @param obj - The object to create the DTO from
   * @returns A new ErrorMetadataDto instance
   */
  static fromObject(obj: Record<string, unknown>): ErrorMetadataDto {
    const error = new ErrorMetadataDto();
    
    if (typeof obj.message === 'string') {
      error.message = obj.message;
    } else {
      error.message = 'Unknown error';
    }
    
    if (typeof obj.name === 'string') {
      error.name = obj.name;
    }
    
    if (typeof obj.code === 'string') {
      error.code = obj.code;
    }
    
    if (typeof obj.stack === 'string') {
      error.stack = obj.stack;
    }
    
    if (obj.details && typeof obj.details === 'object') {
      error.details = obj.details as Record<string, unknown>;
    }
    
    return error;
  }

  /**
   * Creates a new ErrorMetadataDto from a standard Error object.
   * 
   * @param error - The Error object to create the DTO from
   * @returns A new ErrorMetadataDto instance
   */
  static fromError(error: Error): ErrorMetadataDto {
    return new ErrorMetadataDto({
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  }
}

/**
 * Factory function to create event metadata with correlation ID.
 * 
 * @param correlationId - The correlation ID to include
 * @param additionalMetadata - Additional metadata to include
 * @returns A new EventMetadataDto instance
 */
export function createEventMetadata(
  correlationId?: string,
  additionalMetadata?: Partial<EventMetadataDto>
): EventMetadataDto {
  const metadata = new EventMetadataDto(additionalMetadata);
  
  if (correlationId) {
    metadata.correlationId = correlationId;
  }
  
  return metadata;
}

/**
 * Factory function to create event metadata for a specific journey.
 * 
 * @param journey - The journey this event belongs to
 * @param additionalMetadata - Additional metadata to include
 * @returns A new EventMetadataDto instance
 */
export function createJourneyMetadata(
  journey: Journey,
  additionalMetadata?: Partial<EventMetadataDto>
): EventMetadataDto {
  return new EventMetadataDto({
    journey,
    ...additionalMetadata,
  });
}

/**
 * Factory function to create error metadata from an Error object.
 * 
 * @param error - The Error object to create metadata from
 * @param additionalDetails - Additional error details to include
 * @returns A new ErrorMetadataDto instance
 */
export function createErrorMetadata(
  error: Error,
  additionalDetails?: Record<string, unknown>
): ErrorMetadataDto {
  const errorMetadata = ErrorMetadataDto.fromError(error);
  
  if (additionalDetails) {
    errorMetadata.details = additionalDetails;
  }
  
  return errorMetadata;
}