import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for the RetryConfig.
 * This is used as a nested DTO within ScheduleRetryDto to configure
 * custom retry behavior for specific operations.
 */
export class RetryConfigDto {
  /**
   * Type of retry policy to use (EXPONENTIAL_BACKOFF, LINEAR, FIXED)
   * Determines the algorithm used to calculate delay between retry attempts
   */
  @IsString()
  @IsNotEmpty()
  policyType: string;

  /**
   * Maximum number of retry attempts before considering the operation as failed
   * Must be a positive integer
   */
  @IsInt()
  @Min(1)
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry attempt
   * Must be a positive integer
   */
  @IsInt()
  @Min(0)
  initialDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts
   * Used to cap the exponential growth of delay in backoff policies
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  maxDelay?: number;

  /**
   * Factor by which the delay increases in exponential backoff policy
   * For example, 2.0 means each retry waits twice as long as the previous one
   */
  @IsOptional()
  @Min(1)
  backoffFactor?: number;

  /**
   * Whether to add randomness to the retry delay to prevent thundering herd problem
   * When true, a random factor is applied to the calculated delay
   */
  @IsOptional()
  jitter?: boolean;
}

/**
 * Data transfer object for scheduling retry operations.
 * This DTO establishes the contract for manually scheduling retry operations
 * through the notification service API, providing flexibility while ensuring
 * proper validation of retry parameters.
 */
export class ScheduleRetryDto {
  /**
   * The unique identifier of the notification to retry
   * Must be a valid UUID v4
   */
  @IsUUID(4)
  @IsNotEmpty()
  notificationId: string;

  /**
   * Type of operation to retry (e.g., 'send_email', 'send_push', 'send_sms')
   * Used to determine the appropriate handler for the retry operation
   */
  @IsString()
  @IsNotEmpty()
  operationType: string;

  /**
   * Additional context about the error that caused the operation to fail
   * Can include error type, message, stack trace, and other diagnostic information
   */
  @IsObject()
  @IsOptional()
  errorContext?: {
    /**
     * Classification of the error (TRANSIENT, CLIENT, SYSTEM, EXTERNAL)
     * Used to determine appropriate retry strategy
     */
    errorType?: string;
    
    /**
     * Error message describing what went wrong
     */
    message?: string;
    
    /**
     * Error code or identifier for the specific error
     */
    code?: string;
    
    /**
     * Additional error details specific to the operation or channel
     */
    details?: any;
  };

  /**
   * Priority level for the retry operation (higher values indicate higher priority)
   * Used to prioritize critical notifications in the retry queue
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  priorityLevel?: number;

  /**
   * Custom configuration for the retry policy
   * Overrides the default retry configuration for the operation type
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  customRetryConfig?: RetryConfigDto;
}