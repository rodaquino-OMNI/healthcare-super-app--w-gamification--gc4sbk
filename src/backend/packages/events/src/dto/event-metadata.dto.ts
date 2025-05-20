/**
 * @file event-metadata.dto.ts
 * @description Defines standardized event metadata structure used across all journey events
 * in the AUSTA SuperApp. This DTO includes properties for event origin, version, correlation IDs,
 * and additional context that enables robust event tracking, debugging, and reconciliation.
 *
 * Example usage:
 * 
 * ```typescript
 * // Create event metadata with correlation ID for distributed tracing
 * const metadata = new EventMetadataDto();
 * metadata.correlationId = '550e8400-e29b-41d4-a716-446655440000';
 * metadata.origin = {
 *   service: 'health-service',
 *   instance: 'health-service-pod-1234',
 *   component: 'metric-processor'
 * };
 * 
 * // Add the metadata to an event
 * const event = {
 *   type: 'HEALTH_METRIC_RECORDED',
 *   payload: { ... },
 *   metadata
 * };
 * ```
 *
 * @module events/dto
 */

import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  Matches
} from 'class-validator';

/**
 * Data Transfer Object for event version information.
 * 
 * Follows semantic versioning principles with major, minor, and patch components.
 * This enables proper version tracking and compatibility checking for event schemas.
 */
export class EventVersionDto {
  /**
   * Major version number. Incremented for breaking changes.
   * Events with different major versions are considered incompatible.
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Major version must be a numeric string' })
  major: string = '1';

  /**
   * Minor version number. Incremented for backward-compatible feature additions.
   * Events with the same major version but different minor versions are compatible
   * if the consumer's expected minor version is less than or equal to the event's minor version.
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Minor version must be a numeric string' })
  minor: string = '0';

  /**
   * Patch version number. Incremented for backward-compatible bug fixes.
   * Events with the same major and minor versions but different patch versions
   * are fully compatible.
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Patch version must be a numeric string' })
  patch: string = '0';

  /**
   * Returns the full version string in semver format (major.minor.patch).
   */
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  /**
   * Creates a new EventVersionDto from a version string.
   * 
   * @param versionStr Version string in 'major.minor.patch' format
   * @returns A new EventVersionDto instance
   */
  static fromString(versionStr: string): EventVersionDto {
    const version = new EventVersionDto();
    const parts = versionStr.split('.');
    
    if (parts.length >= 1) version.major = parts[0];
    if (parts.length >= 2) version.minor = parts[1];
    if (parts.length >= 3) version.patch = parts[2];
    
    return version;
  }
}

/**
 * Data Transfer Object for event origin information.
 * 
 * Tracks the source of events for debugging, monitoring, and auditing purposes.
 * This information is critical for distributed tracing and error investigation.
 */
export class EventOriginDto {
  /**
   * Name of the service that generated the event (e.g., 'health-service', 'care-service').
   */
  @IsString()
  @IsNotEmpty()
  service: string;

  /**
   * Unique identifier for the service instance (e.g., pod name, container ID).
   */
  @IsString()
  @IsOptional()
  instance?: string;

  /**
   * Specific component within the service that generated the event (e.g., 'metric-processor').
   */
  @IsString()
  @IsOptional()
  component?: string;

  /**
   * Additional context about the event origin (e.g., 'scheduled-task', 'user-initiated').
   */
  @IsString()
  @IsOptional()
  context?: string;
}

/**
 * Data Transfer Object for event metadata.
 * 
 * Provides standardized metadata for all events in the AUSTA SuperApp, enabling
 * robust event tracking, debugging, and reconciliation across services.
 */
export class EventMetadataDto {
  /**
   * Unique identifier for the event.
   * Automatically generated if not provided.
   */
  @IsUUID(4)
  @IsOptional()
  eventId?: string;

  /**
   * Correlation ID for distributed tracing.
   * Used to track related events across multiple services.
   */
  @IsString()
  @IsOptional()
  correlationId?: string;

  /**
   * Parent event ID for event chains.
   * Used to track causal relationships between events.
   */
  @IsString()
  @IsOptional()
  parentEventId?: string;

  /**
   * User session ID associated with the event.
   * Used to correlate events with user sessions.
   */
  @IsString()
  @IsOptional()
  sessionId?: string;

  /**
   * Request ID associated with the event.
   * Used to correlate events with API requests.
   */
  @IsString()
  @IsOptional()
  requestId?: string;

  /**
   * Timestamp when the event was created.
   * Automatically set to the current time if not provided.
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  timestamp?: Date = new Date();

  /**
   * Version information for the event schema.
   */
  @IsObject()
  @ValidateNested()
  @Type(() => EventVersionDto)
  @IsOptional()
  version?: EventVersionDto = new EventVersionDto();

  /**
   * Origin information for the event.
   */
  @IsObject()
  @ValidateNested()
  @Type(() => EventOriginDto)
  @IsOptional()
  origin?: EventOriginDto;

  /**
   * Additional context for the event.
   * Can contain any JSON-serializable data.
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  /**
   * Creates a new EventMetadataDto with default values.
   * 
   * @param defaults Default values to apply
   */
  constructor(defaults?: Partial<EventMetadataDto>) {
    if (defaults) {
      Object.assign(this, defaults);
    }

    // Set default timestamp if not provided
    if (!this.timestamp) {
      this.timestamp = new Date();
    }

    // Set default version if not provided
    if (!this.version) {
      this.version = new EventVersionDto();
    }
  }

  /**
   * Creates a copy of this metadata with the specified changes.
   * 
   * @param changes Changes to apply to the copy
   * @returns A new EventMetadataDto instance
   */
  with(changes: Partial<EventMetadataDto>): EventMetadataDto {
    return new EventMetadataDto({
      ...this,
      ...changes,
    });
  }

  /**
   * Creates metadata for a child event that inherits correlation context.
   * 
   * @param parentEventId ID of the parent event (defaults to this event's ID)
   * @returns A new EventMetadataDto instance with inherited context
   */
  createChildMetadata(parentEventId?: string): EventMetadataDto {
    return new EventMetadataDto({
      correlationId: this.correlationId,
      parentEventId: parentEventId || this.eventId,
      sessionId: this.sessionId,
      requestId: this.requestId,
      origin: this.origin,
      version: this.version,
    });
  }
}

/**
 * Creates event metadata with the specified service origin.
 * 
 * @param service Name of the service generating the event
 * @param options Additional metadata options
 * @returns A new EventMetadataDto instance
 */
export function createEventMetadata(
  service: string,
  options: Partial<EventMetadataDto> = {}
): EventMetadataDto {
  const origin = new EventOriginDto();
  origin.service = service;
  
  if (options.origin) {
    Object.assign(origin, options.origin);
  }
  
  return new EventMetadataDto({
    ...options,
    origin,
  });
}

/**
 * Creates event metadata with correlation ID for distributed tracing.
 * 
 * @param correlationId Correlation ID for distributed tracing
 * @param service Name of the service generating the event
 * @param options Additional metadata options
 * @returns A new EventMetadataDto instance
 */
export function createCorrelatedEventMetadata(
  correlationId: string,
  service: string,
  options: Partial<EventMetadataDto> = {}
): EventMetadataDto {
  return createEventMetadata(service, {
    ...options,
    correlationId,
  });
}

/**
 * Extracts correlation context from existing metadata for propagation.
 * 
 * @param metadata Source metadata to extract correlation context from
 * @returns Object containing correlation context properties
 */
export function extractCorrelationContext(metadata: EventMetadataDto): {
  correlationId?: string;
  sessionId?: string;
  requestId?: string;
} {
  return {
    correlationId: metadata.correlationId,
    sessionId: metadata.sessionId,
    requestId: metadata.requestId,
  };
}