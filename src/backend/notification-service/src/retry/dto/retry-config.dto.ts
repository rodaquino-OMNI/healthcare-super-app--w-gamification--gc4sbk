import { IsEnum, IsInt, IsBoolean, IsNumber, Min, IsOptional } from 'class-validator';
import { PolicyType } from '../constants/policy-types.constants';

/**
 * Data transfer object for configuring retry policies in the notification service.
 * This DTO establishes the contract for retry behavior across different notification
 * channels and error types, ensuring consistent retry handling throughout the system.
 */
export class RetryConfigDto {
  /**
   * The type of retry policy to apply.
   * - EXPONENTIAL_BACKOFF: Increases delay exponentially between retries
   * - LINEAR: Increases delay linearly between retries
   * - FIXED: Uses the same delay for all retry attempts
   */
  @IsEnum(PolicyType, {
    message: 'Policy type must be one of: EXPONENTIAL_BACKOFF, LINEAR, FIXED',
  })
  policyType: PolicyType;

  /**
   * Maximum number of retry attempts before considering the operation failed.
   * After reaching this limit, the notification will be moved to the dead-letter queue.
   */
  @IsInt()
  @Min(1, { message: 'Maximum retries must be at least 1' })
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry attempt.
   * This value serves as the base for calculating subsequent delays
   * according to the selected policy type.
   */
  @IsInt()
  @Min(100, { message: 'Initial delay must be at least 100ms' })
  initialDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   * This caps the delay for exponential and linear policies to prevent
   * excessively long waits between retries.
   */
  @IsInt()
  @Min(100, { message: 'Maximum delay must be at least 100ms' })
  maxDelay: number;

  /**
   * Factor used to calculate the delay between retry attempts.
   * - For EXPONENTIAL_BACKOFF: The base for the exponential calculation
   * - For LINEAR: The increment added for each retry
   * - For FIXED: Not used (can be omitted)
   */
  @IsNumber()
  @Min(1, { message: 'Backoff factor must be at least 1' })
  @IsOptional()
  backoffFactor?: number;

  /**
   * Whether to add random jitter to the delay calculation.
   * Adding jitter helps prevent thundering herd problems when many
   * notifications are being retried simultaneously.
   */
  @IsBoolean()
  @IsOptional()
  jitter?: boolean;
}