/**
 * @file event-metadata.dto.ts
 * @description Defines the standardized event metadata structure used across all journey events
 * in the AUSTA SuperApp. This DTO includes properties for event origin, version, correlation IDs,
 * and additional context that enables robust event tracking, debugging, and reconciliation.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Priority levels for event processing
 */
export enum EventPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Data Transfer Object for event metadata that contains cross-cutting concerns
 * such as tracing, correlation IDs, and other system-level information.
 * 
 * This DTO ensures consistent metadata handling across services and provides
 * the foundation for distributed tracing and event correlation.
 */
export class EventMetadataDto {
  /**
   * Correlation ID for tracing requests across services
   * @example "corr-550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiPropertyOptional({
    description: 'Correlation ID for tracing requests across services',
    example: 'corr-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  correlationId?: string;

  /**
   * Trace ID for distributed tracing
   * @example "trace-550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiPropertyOptional({
    description: 'Trace ID for distributed tracing',
    example: 'trace-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  traceId?: string;

  /**
   * Span ID for distributed tracing
   * @example "span-550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiPropertyOptional({
    description: 'Span ID for distributed tracing',
    example: 'span-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  spanId?: string;

  /**
   * Priority level for event processing
   * @example "high", "medium", "low"
   */
  @ApiPropertyOptional({
    description: 'Priority level for event processing',
    enum: EventPriority,
    example: EventPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(EventPriority)
  priority?: EventPriority;

  /**
   * Indicates if this is a retry of a previously failed event
   */
  @ApiPropertyOptional({
    description: 'Indicates if this is a retry of a previously failed event',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  isRetry?: boolean;

  /**
   * Number of retry attempts if this is a retry
   */
  @ApiPropertyOptional({
    description: 'Number of retry attempts if this is a retry',
    example: 0,
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @ValidateIf((o) => o.isRetry === true)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  retryCount?: number;

  /**
   * Original timestamp of the event if this is a retry
   */
  @ApiPropertyOptional({
    description: 'Original timestamp of the event if this is a retry',
    example: '2023-04-15T14:32:17.000Z',
  })
  @IsOptional()
  @ValidateIf((o) => o.isRetry === true)
  @IsISO8601()
  originalTimestamp?: string;

  /**
   * Request ID associated with the event
   */
  @ApiPropertyOptional({
    description: 'Request ID associated with the event',
    example: 'req-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  requestId?: string;

  /**
   * Session ID associated with the event
   */
  @ApiPropertyOptional({
    description: 'Session ID associated with the event',
    example: 'sess-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  /**
   * Device ID associated with the event
   */
  @ApiPropertyOptional({
    description: 'Device ID associated with the event',
    example: 'device-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  /**
   * IP address associated with the event
   */
  @ApiPropertyOptional({
    description: 'IP address associated with the event',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  /**
   * User agent associated with the event
   */
  @ApiPropertyOptional({
    description: 'User agent associated with the event',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  /**
   * Environment where the event was generated
   */
  @ApiPropertyOptional({
    description: 'Environment where the event was generated',
    example: 'production',
  })
  @IsOptional()
  @IsString()
  environment?: string;

  /**
   * Parent event ID if this event was triggered by another event
   */
  @ApiPropertyOptional({
    description: 'Parent event ID if this event was triggered by another event',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4')
  parentEventId?: string;

  /**
   * Additional custom metadata properties
   */
  [key: string]: any;

  /**
   * Creates a new EventMetadataDto with default values
   * @returns A new EventMetadataDto instance
   */
  static create(metadata: Partial<EventMetadataDto> = {}): EventMetadataDto {
    const dto = new EventMetadataDto();
    return Object.assign(dto, metadata);
  }

  /**
   * Creates a new EventMetadataDto for a retry event
   * @param originalMetadata The original event metadata
   * @param retryCount The current retry count
   * @returns A new EventMetadataDto instance for a retry
   */
  static createForRetry(
    originalMetadata: EventMetadataDto,
    retryCount: number = 1,
    originalTimestamp?: string,
  ): EventMetadataDto {
    const retryMetadata = { ...originalMetadata };
    retryMetadata.isRetry = true;
    retryMetadata.retryCount = retryCount;
    retryMetadata.originalTimestamp = originalTimestamp || retryMetadata.originalTimestamp;
    
    // Generate new span ID for the retry while maintaining the trace context
    if (retryMetadata.spanId) {
      retryMetadata.spanId = `span-${crypto.randomUUID()}`;
    }
    
    return EventMetadataDto.create(retryMetadata);
  }

  /**
   * Creates a new EventMetadataDto with correlation tracking information
   * @param correlationId Optional correlation ID (will be generated if not provided)
   * @param traceId Optional trace ID (will be generated if not provided)
   * @param spanId Optional span ID (will be generated if not provided)
   * @returns A new EventMetadataDto instance with correlation tracking
   */
  static createWithCorrelation(
    correlationId?: string,
    traceId?: string,
    spanId?: string,
  ): EventMetadataDto {
    return EventMetadataDto.create({
      correlationId: correlationId || `corr-${crypto.randomUUID()}`,
      traceId: traceId || `trace-${crypto.randomUUID()}`,
      spanId: spanId || `span-${crypto.randomUUID()}`,
    });
  }

  /**
   * Creates a child EventMetadataDto that inherits correlation context from a parent
   * @param parentMetadata The parent event metadata
   * @returns A new EventMetadataDto instance with inherited correlation context
   */
  static createChildFromParent(parentMetadata: EventMetadataDto): EventMetadataDto {
    // Create a new metadata object with the same correlation and trace IDs
    // but with a new span ID to represent the child operation
    return EventMetadataDto.create({
      correlationId: parentMetadata.correlationId,
      traceId: parentMetadata.traceId,
      spanId: `span-${crypto.randomUUID()}`,
      parentEventId: parentMetadata.parentEventId,
    });
  }

  /**
   * Merges additional metadata into this instance
   * @param additionalMetadata Additional metadata to merge
   * @returns This instance with merged metadata
   */
  merge(additionalMetadata: Partial<EventMetadataDto>): EventMetadataDto {
    return Object.assign(this, additionalMetadata);
  }
}