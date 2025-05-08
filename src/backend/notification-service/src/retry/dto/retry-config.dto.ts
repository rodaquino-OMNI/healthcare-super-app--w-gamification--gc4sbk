import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsBoolean, Min, Max, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum defining the available retry policy types in the notification service.
 * Each policy type implements a different strategy for timing retry attempts.
 */
export enum PolicyType {
  /**
   * Exponential backoff increases the delay between retry attempts exponentially,
   * helping to reduce load on external systems during outages while still ensuring
   * eventual delivery.
   */
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  
  /**
   * Fixed delay uses the same delay between all retry attempts,
   * suitable for operations with consistent processing times.
   */
  FIXED = 'fixed',
  
  /**
   * Linear delay increases the delay between retry attempts linearly,
   * providing a middle ground between fixed and exponential strategies.
   */
  LINEAR = 'linear'
}

/**
 * Data transfer object for configuring retry policies in the notification service.
 * This DTO establishes the contract for configuring retry behavior for different
 * notification channels and error types.
 */
export class RetryConfigDto {
  /**
   * The type of retry policy to use.
   * Different policy types implement different strategies for timing retry attempts.
   */
  @IsEnum(PolicyType, {
    message: 'Policy type must be one of: exponential_backoff, fixed, linear'
  })
  policyType: PolicyType;

  /**
   * Maximum number of retry attempts before considering the operation as failed
   * and potentially moving it to the dead-letter queue.
   * 
   * Must be a positive integer. Recommended values: 3-5 for most operations.
   */
  @IsInt()
  @IsPositive()
  @Max(10, { message: 'Maximum retries cannot exceed 10 for system stability' })
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry attempt.
   * 
   * Must be a positive integer. Recommended values:
   * - 100-500ms for in-app notifications
   * - 1000-5000ms for external delivery channels (email, SMS, push)
   */
  @IsInt()
  @IsPositive()
  @Min(100, { message: 'Initial delay must be at least 100ms' })
  @Max(60000, { message: 'Initial delay cannot exceed 60 seconds' })
  initialDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   * Prevents exponential backoff from creating extremely long delays.
   * 
   * Must be a positive integer greater than initialDelay.
   * Recommended maximum: 5 minutes (300000ms) to meet SLA requirements.
   */
  @IsInt()
  @IsPositive()
  @Max(300000, { message: 'Maximum delay cannot exceed 5 minutes to meet SLA requirements' })
  maxDelay: number;

  /**
   * Factor by which the delay increases between retry attempts.
   * Only applicable for EXPONENTIAL_BACKOFF and LINEAR policy types.
   * 
   * For exponential backoff, typical values are between 2 and 3.
   * For linear backoff, typical values are between 1 and 2.
   */
  @IsNumber()
  @IsPositive()
  @Max(5, { message: 'Backoff factor cannot exceed 5 to prevent excessive delays' })
  @IsOptional()
  backoffFactor?: number;

  /**
   * Whether to add random jitter to retry delays to prevent thundering herd problems
   * when many operations are retried simultaneously.
   * 
   * Recommended: true for production environments with high volume.
   */
  @IsBoolean()
  @IsOptional()
  jitter?: boolean;

  /**
   * Optional channel-specific identifier to associate this retry configuration
   * with a specific notification channel (email, SMS, push, in-app).
   * 
   * When specified, this configuration will only apply to the specified channel.
   */
  @IsString()
  @IsOptional()
  channel?: string;

  /**
   * Optional error type identifier to associate this retry configuration
   * with specific error types (e.g., 'connection_timeout', 'rate_limit').
   * 
   * When specified, this configuration will only apply to the specified error type.
   */
  @IsString()
  @IsOptional()
  errorType?: string;
}

/**
 * Data transfer object for channel-specific retry configurations.
 * Allows defining different retry policies for each notification channel.
 */
export class ChannelRetryConfigDto {
  /**
   * Retry configuration for email notifications.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  email?: RetryConfigDto;

  /**
   * Retry configuration for SMS notifications.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  sms?: RetryConfigDto;

  /**
   * Retry configuration for push notifications.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  push?: RetryConfigDto;

  /**
   * Retry configuration for in-app notifications.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  inApp?: RetryConfigDto;
}