import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { ErrorResponseDto } from './error-response.dto';

/**
 * Interface for pagination metadata in response
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Whether there is a previous page available */
  hasPreviousPage: boolean;
}

/**
 * Data Transfer Object for standardized API responses throughout the gamification engine.
 * Provides consistent formatting with status, data, and metadata properties.
 * 
 * @template T Type of data being returned in the response
 */
export class BaseResponseDto<T = any> {
  /**
   * Indicates whether the request was successful
   */
  @ApiProperty({
    description: 'Indicates whether the request was successful',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  /**
   * The data returned by the API endpoint
   * Generic type parameter allows for type-safe responses
   */
  @ApiProperty({
    description: 'The data returned by the API endpoint',
    example: { id: '123', name: 'Achievement Unlocked' },
  })
  data?: T;

  /**
   * Error information (only present when success is false)
   */
  @ApiPropertyOptional({
    description: 'Error information (only present when success is false)',
    type: ErrorResponseDto,
  })
  @ValidateNested()
  @Type(() => ErrorResponseDto)
  @IsOptional()
  error?: ErrorResponseDto;

  /**
   * Additional metadata about the response
   * Can include pagination information, processing time, etc.
   */
  @ApiPropertyOptional({
    description: 'Additional metadata about the response',
    example: {
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 42,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      },
      processingTimeMs: 123,
    },
  })
  @IsObject()
  @IsOptional()
  meta?: {
    /** Pagination information if the response is paginated */
    pagination?: PaginationMeta;
    /** Processing time in milliseconds */
    processingTimeMs?: number;
    /** Journey context information */
    journeyContext?: {
      journeyType?: 'HEALTH' | 'CARE' | 'PLAN';
      journeyId?: string;
      journeyStep?: string;
      [key: string]: any;
    };
    /** Any additional metadata */
    [key: string]: any;
  };

  /**
   * Creates a successful response with the provided data and metadata
   * 
   * @param data The data to include in the response
   * @param meta Additional metadata to include in the response
   * @returns A new BaseResponseDto instance with success=true
   */
  static success<T>(data: T, meta?: BaseResponseDto['meta']): BaseResponseDto<T> {
    const response = new BaseResponseDto<T>();
    response.success = true;
    response.data = data;
    response.meta = meta;
    return response;
  }

  /**
   * Creates a successful paginated response with the provided data and pagination metadata
   * 
   * @param data The data to include in the response
   * @param pagination The pagination metadata
   * @param additionalMeta Additional metadata to include in the response
   * @returns A new BaseResponseDto instance with success=true and pagination metadata
   */
  static paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    additionalMeta?: Omit<BaseResponseDto['meta'], 'pagination'>
  ): BaseResponseDto<T[]> {
    const response = new BaseResponseDto<T[]>();
    response.success = true;
    response.data = data;
    response.meta = {
      ...additionalMeta,
      pagination,
    };
    return response;
  }

  /**
   * Creates an error response with the provided error information
   * 
   * @param error The error information to include in the response
   * @param meta Additional metadata to include in the response
   * @returns A new BaseResponseDto instance with success=false
   */
  static error(error: ErrorResponseDto, meta?: BaseResponseDto['meta']): BaseResponseDto<null> {
    const response = new BaseResponseDto<null>();
    response.success = false;
    response.error = error;
    response.meta = meta;
    return response;
  }

  /**
   * Creates an error response from an Error object using ErrorResponseDto.fromError
   * 
   * @param error The Error object
   * @param options Options for creating the ErrorResponseDto
   * @param meta Additional metadata to include in the response
   * @returns A new BaseResponseDto instance with success=false
   */
  static fromError(
    error: Error,
    options: Parameters<typeof ErrorResponseDto.fromError>[1],
    meta?: BaseResponseDto['meta']
  ): BaseResponseDto<null> {
    return BaseResponseDto.error(ErrorResponseDto.fromError(error, options), meta);
  }

  /**
   * Creates a validation error response using ErrorResponseDto.validationError
   * 
   * @param message The error message
   * @param options Options for creating the validation error
   * @param meta Additional metadata to include in the response
   * @returns A new BaseResponseDto instance with success=false
   */
  static validationError(
    message: string,
    options: Parameters<typeof ErrorResponseDto.validationError>[1],
    meta?: BaseResponseDto['meta']
  ): BaseResponseDto<null> {
    return BaseResponseDto.error(ErrorResponseDto.validationError(message, options), meta);
  }

  /**
   * Creates a business error response using ErrorResponseDto.businessError
   * 
   * @param message The error message
   * @param options Options for creating the business error
   * @param meta Additional metadata to include in the response
   * @returns A new BaseResponseDto instance with success=false
   */
  static businessError(
    message: string,
    options: Parameters<typeof ErrorResponseDto.businessError>[1],
    meta?: BaseResponseDto['meta']
  ): BaseResponseDto<null> {
    return BaseResponseDto.error(ErrorResponseDto.businessError(message, options), meta);
  }

  /**
   * Creates a technical error response using ErrorResponseDto.technicalError
   * 
   * @param error The Error object
   * @param options Options for creating the technical error
   * @param meta Additional metadata to include in the response
   * @returns A new BaseResponseDto instance with success=false
   */
  static technicalError(
    error: Error,
    options: Parameters<typeof ErrorResponseDto.technicalError>[1],
    meta?: BaseResponseDto['meta']
  ): BaseResponseDto<null> {
    return BaseResponseDto.error(ErrorResponseDto.technicalError(error, options), meta);
  }

  /**
   * Creates an external error response using ErrorResponseDto.externalError
   * 
   * @param message The error message
   * @param options Options for creating the external error
   * @param meta Additional metadata to include in the response
   * @returns A new BaseResponseDto instance with success=false
   */
  static externalError(
    message: string,
    options: Parameters<typeof ErrorResponseDto.externalError>[1],
    meta?: BaseResponseDto['meta']
  ): BaseResponseDto<null> {
    return BaseResponseDto.error(ErrorResponseDto.externalError(message, options), meta);
  }
}