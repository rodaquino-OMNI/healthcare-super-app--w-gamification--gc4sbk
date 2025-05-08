import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from '@nestjs/common';
import { ErrorResponseDto, ErrorSeverity, ErrorSource } from './error-response.dto';

/**
 * Enum representing the status of an API response
 */
export enum ResponseStatus {
  /** The request was successful */
  SUCCESS = 'success',
  /** The request failed */
  ERROR = 'error',
  /** The request is being processed asynchronously */
  PENDING = 'pending',
  /** The request was partially successful */
  PARTIAL = 'partial',
}

/**
 * Interface for metadata that can be included in API responses
 */
export interface ResponseMetadata {
  /** Total number of items (for paginated responses) */
  totalItems?: number;
  /** Total number of pages (for paginated responses) */
  totalPages?: number;
  /** Current page number (for paginated responses) */
  currentPage?: number;
  /** Number of items per page (for paginated responses) */
  pageSize?: number;
  /** Request processing time in milliseconds */
  processingTimeMs?: number;
  /** Retry information for failed requests */
  retry?: {
    /** Number of retry attempts made */
    attempts?: number;
    /** Maximum number of retry attempts allowed */
    maxAttempts?: number;
    /** Time to wait before next retry attempt (in milliseconds) */
    backoffMs?: number;
    /** Whether the operation can be retried */
    retryable?: boolean;
  };
  /** Circuit breaker status information */
  circuitBreaker?: {
    /** Current state of the circuit breaker (closed, open, half-open) */
    state?: 'closed' | 'open' | 'half-open';
    /** Time until the circuit breaker resets (in milliseconds) */
    resetTimeMs?: number;
    /** Failure rate that triggered circuit breaker (if open) */
    failureRate?: number;
  };
  /** Fallback strategy information */
  fallback?: {
    /** Whether a fallback strategy was applied */
    applied?: boolean;
    /** Type of fallback strategy used */
    strategy?: 'cached-data' | 'default-value' | 'degraded-service' | 'alternative-path';
    /** Source of fallback data if applicable */
    source?: string;
    /** Age of fallback data if applicable (in seconds) */
    dataAgeSeconds?: number;
  };
  /** Additional context information */
  [key: string]: any;
}

/**
 * Base response DTO class that provides a standardized structure for all API responses
 * @template T The type of data contained in the response
 */
export class BaseResponseDto<T = any> {
  /**
   * Status of the response (success or error)
   */
  @ApiProperty({
    description: 'Status of the response',
    enum: ResponseStatus,
    example: ResponseStatus.SUCCESS,
  })
  status: ResponseStatus;

  /**
   * Timestamp when the response was generated
   */
  @ApiProperty({
    description: 'Timestamp when the response was generated',
    example: '2023-04-15T14:32:21.432Z',
  })
  timestamp: string;

  /**
   * Data returned by the API (for successful responses)
   */
  @ApiPropertyOptional({
    description: 'Data returned by the API (for successful responses)',
    type: 'object',
    example: { id: '123', name: 'Achievement Unlocked' },
  })
  data?: T;

  /**
   * Error information (for error responses)
   */
  @ApiPropertyOptional({
    description: 'Error information (for error responses)',
    type: () => ErrorResponseDto,
  })
  error?: ErrorResponseDto;

  /**
   * Additional metadata for the response
   * May include pagination information, processing statistics, etc.
   */
  @ApiPropertyOptional({
    description: 'Additional metadata for the response',
    type: 'object',
    example: { totalItems: 100, totalPages: 10, currentPage: 1, pageSize: 10 },
  })
  metadata?: ResponseMetadata;

  /**
   * Journey context information
   * Helps identify which journey and feature was involved
   */
  @ApiPropertyOptional({
    description: 'Journey context information',
    example: { journey: 'gamification', feature: 'achievements' },
  })
  journeyContext?: {
    journey: string;
    feature?: string;
    action?: string;
  };

  /**
   * Creates a success response with the provided data and metadata
   * @param data The data to include in the response
   * @param metadata Additional metadata for the response
   * @param journeyContext Journey context information
   * @param startTime Optional start time for calculating processing time
   * @returns A new BaseResponseDto instance with success status
   */
  static success<T>(
    data: T, 
    metadata?: ResponseMetadata, 
    journeyContext?: { journey: string; feature?: string; action?: string },
    startTime?: number
  ): BaseResponseDto<T> {
    const response = new BaseResponseDto<T>();
    response.status = ResponseStatus.SUCCESS;
    response.timestamp = new Date().toISOString();
    response.data = data;
    
    // Initialize metadata if not provided
    if (!metadata) {
      metadata = {};
    }
    
    // Add processing time if start time was provided
    if (startTime && !metadata.processingTimeMs) {
      metadata.processingTimeMs = Date.now() - startTime;
    }
    
    response.metadata = metadata;
    
    if (journeyContext) {
      response.journeyContext = journeyContext;
    } else {
      // Default journey context for gamification engine
      response.journeyContext = { journey: 'gamification' };
    }
    
    return response;
  }

  /**
   * Creates an error response with the provided error information
   * @param error The error object or ErrorResponseDto instance
   * @param metadata Additional metadata for the response
   * @param retryInfo Retry information for the failed request
   * @param circuitBreakerInfo Circuit breaker status information
   * @param fallbackInfo Fallback strategy information
   * @returns A new BaseResponseDto instance with error status
   */
  static error<T>(
    error: Error | ErrorResponseDto, 
    metadata?: ResponseMetadata,
    retryInfo?: {
      attempts?: number;
      maxAttempts?: number;
      backoffMs?: number;
      retryable?: boolean;
    },
    circuitBreakerInfo?: {
      state?: 'closed' | 'open' | 'half-open';
      resetTimeMs?: number;
      failureRate?: number;
    },
    fallbackInfo?: {
      applied?: boolean;
      strategy?: 'cached-data' | 'default-value' | 'degraded-service' | 'alternative-path';
      source?: string;
      dataAgeSeconds?: number;
    }
  ): BaseResponseDto<T> {
    const response = new BaseResponseDto<T>();
    response.status = ResponseStatus.ERROR;
    response.timestamp = new Date().toISOString();
    
    // Convert Error to ErrorResponseDto if needed
    if (error instanceof ErrorResponseDto) {
      response.error = error;
    } else {
      response.error = ErrorResponseDto.fromError(error, {
        includeStack: process.env.NODE_ENV !== 'production',
      });
    }
    
    // Initialize metadata if not provided
    if (!metadata) {
      metadata = {};
    }
    
    // Add retry information if provided
    if (retryInfo) {
      metadata.retry = retryInfo;
    }
    
    // Add circuit breaker information if provided
    if (circuitBreakerInfo) {
      metadata.circuitBreaker = circuitBreakerInfo;
    }
    
    // Add fallback information if provided
    if (fallbackInfo) {
      metadata.fallback = fallbackInfo;
    }
    
    // Add processing time if available
    if (!metadata.processingTimeMs) {
      metadata.processingTimeMs = Date.now() - new Date(response.timestamp).getTime();
    }
    
    response.metadata = metadata;
    
    // Use journey context from error if available
    if (response.error.journeyContext) {
      response.journeyContext = response.error.journeyContext;
    } else {
      // Default journey context for gamification engine
      response.journeyContext = { journey: 'gamification' };
    }
    
    return response;
  }

  /**
   * Creates a paginated success response with the provided data and pagination information
   * @param data The data to include in the response
   * @param totalItems Total number of items
   * @param currentPage Current page number
   * @param pageSize Number of items per page
   * @param additionalMetadata Additional metadata to include
   * @param journeyContext Journey context information
   * @param startTime Optional start time for calculating processing time
   * @returns A new BaseResponseDto instance with success status and pagination metadata
   */
  static paginated<T>(
    data: T[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
    additionalMetadata?: Record<string, any>,
    journeyContext?: { journey: string; feature?: string; action?: string },
    startTime?: number,
  ): BaseResponseDto<T[]> {
    const totalPages = Math.ceil(totalItems / pageSize);
    
    const metadata: ResponseMetadata = {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
      ...additionalMetadata,
    };
    
    // Add processing time if start time was provided
    if (startTime && !metadata.processingTimeMs) {
      metadata.processingTimeMs = Date.now() - startTime;
    }
    
    // Add navigation links for pagination
    metadata.links = {
      self: `/api/v1/${journeyContext?.journey || 'gamification'}?page=${currentPage}&size=${pageSize}`,
    };
    
    if (currentPage > 1) {
      metadata.links.prev = `/api/v1/${journeyContext?.journey || 'gamification'}?page=${currentPage - 1}&size=${pageSize}`;
      metadata.links.first = `/api/v1/${journeyContext?.journey || 'gamification'}?page=1&size=${pageSize}`;
    }
    
    if (currentPage < totalPages) {
      metadata.links.next = `/api/v1/${journeyContext?.journey || 'gamification'}?page=${currentPage + 1}&size=${pageSize}`;
      metadata.links.last = `/api/v1/${journeyContext?.journey || 'gamification'}?page=${totalPages}&size=${pageSize}`;
    }
    
    return BaseResponseDto.success(data, metadata, journeyContext, startTime);
  }

  /**
   * Creates a response DTO class with a specific data type
   * Useful for Swagger documentation to correctly reflect the response structure
   * @param dataDto The DTO class for the data property
   * @returns A class extending BaseResponseDto with the specified data type
   */
  static withDataType<T>(dataDto: Type<T>): Type<BaseResponseDto<T>> {
    class ResponseDto extends BaseResponseDto<T> {}
    return ResponseDto;
  }
  
  /**
   * Creates a partial success response for operations that succeeded with some warnings or issues
   * @param data The data to include in the response
   * @param warnings Array of warning messages or issues
   * @param metadata Additional metadata for the response
   * @param journeyContext Journey context information
   * @returns A new BaseResponseDto instance with partial success status
   */
  static partial<T>(
    data: T,
    warnings: Array<{ code: string; message: string; details?: Record<string, any> }>,
    metadata?: ResponseMetadata,
    journeyContext?: { journey: string; feature?: string; action?: string }
  ): BaseResponseDto<T> {
    const response = new BaseResponseDto<T>();
    response.status = ResponseStatus.PARTIAL;
    response.timestamp = new Date().toISOString();
    response.data = data;
    
    // Initialize metadata if not provided
    if (!metadata) {
      metadata = {};
    }
    
    // Add warnings to metadata
    metadata.warnings = warnings;
    
    response.metadata = metadata;
    
    if (journeyContext) {
      response.journeyContext = journeyContext;
    } else {
      // Default journey context for gamification engine
      response.journeyContext = { journey: 'gamification' };
    }
    
    return response;
  }
  
  /**
   * Creates a pending response for asynchronous operations
   * @param operationId Identifier for the async operation
   * @param estimatedCompletionTime Estimated time when the operation will complete
   * @param metadata Additional metadata for the response
   * @param journeyContext Journey context information
   * @returns A new BaseResponseDto instance with pending status
   */
  static pending<T>(
    operationId: string,
    estimatedCompletionTime?: Date,
    metadata?: ResponseMetadata,
    journeyContext?: { journey: string; feature?: string; action?: string }
  ): BaseResponseDto<T> {
    const response = new BaseResponseDto<T>();
    response.status = ResponseStatus.PENDING;
    response.timestamp = new Date().toISOString();
    
    // Initialize metadata if not provided
    if (!metadata) {
      metadata = {};
    }
    
    // Add async operation details to metadata
    metadata.asyncOperation = {
      operationId,
      estimatedCompletionTime: estimatedCompletionTime?.toISOString(),
      statusCheckEndpoint: `/operations/${operationId}/status`,
    };
    
    response.metadata = metadata;
    
    if (journeyContext) {
      response.journeyContext = journeyContext;
    } else {
      // Default journey context for gamification engine
      response.journeyContext = { journey: 'gamification' };
    }
    
    return response;
  }
  
  /**
   * Creates a fallback response when the primary operation fails but a fallback strategy is applied
   * @param data The fallback data to include in the response
   * @param fallbackInfo Information about the fallback strategy applied
   * @param originalError The original error that triggered the fallback
   * @param metadata Additional metadata for the response
   * @param journeyContext Journey context information
   * @returns A new BaseResponseDto instance with success status and fallback metadata
   */
  static fallback<T>(
    data: T,
    fallbackInfo: {
      strategy: 'cached-data' | 'default-value' | 'degraded-service' | 'alternative-path';
      source?: string;
      dataAgeSeconds?: number;
    },
    originalError: Error | ErrorResponseDto,
    metadata?: ResponseMetadata,
    journeyContext?: { journey: string; feature?: string; action?: string }
  ): BaseResponseDto<T> {
    const response = new BaseResponseDto<T>();
    response.status = ResponseStatus.SUCCESS; // Still a success, but with fallback data
    response.timestamp = new Date().toISOString();
    response.data = data;
    
    // Initialize metadata if not provided
    if (!metadata) {
      metadata = {};
    }
    
    // Add fallback information
    metadata.fallback = {
      applied: true,
      ...fallbackInfo
    };
    
    // Add original error information (without exposing sensitive details)
    let errorInfo: Record<string, any>;
    
    if (originalError instanceof ErrorResponseDto) {
      errorInfo = {
        code: originalError.code,
        message: originalError.message,
        severity: originalError.severity,
        source: originalError.source
      };
    } else {
      errorInfo = {
        message: originalError.message,
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.SYSTEM
      };
    }
    
    metadata.originalError = errorInfo;
    
    response.metadata = metadata;
    
    if (journeyContext) {
      response.journeyContext = journeyContext;
    } else {
      // Default journey context for gamification engine
      response.journeyContext = { journey: 'gamification' };
    }
    
    return response;
  }
}