import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsBoolean, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { PolicyType } from '../constants/policy-types.constants';

/**
 * Data transfer object for configuring retry policies in the notification service.
 * This DTO establishes the contract for configuring how retry operations behave,
 * including policy type, maximum attempts, delays, and backoff factors.
 */
export class RetryConfigDto {
  /**
   * The type of retry policy to use (exponential backoff, linear, or fixed)
   */
  @IsEnum(PolicyType, {
    message: 'Policy type must be one of: EXPONENTIAL_BACKOFF, LINEAR, FIXED',
  })
  policyType: PolicyType;

  /**
   * Maximum number of retry attempts before considering the operation as failed
   * and potentially moving it to the dead-letter queue
   */
  @IsInt()
  @IsPositive()
  @Max(10, { message: 'Maximum retry attempts cannot exceed 10 for system stability' })
  @Type(() => Number)
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry attempt
   */
  @IsInt()
  @IsPositive()
  @Max(60000, { message: 'Initial delay cannot exceed 60 seconds (60000ms)' })
  @Type(() => Number)
  initialDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts
   * This caps the exponential growth for backoff policies
   */
  @IsInt()
  @IsPositive()
  @Max(3600000, { message: 'Maximum delay cannot exceed 1 hour (3600000ms)' })
  @ValidateIf((o) => o.policyType === PolicyType.EXPONENTIAL_BACKOFF)
  @Type(() => Number)
  @IsOptional()
  maxDelay?: number;

  /**
   * Factor by which the delay increases between retry attempts
   * - For EXPONENTIAL_BACKOFF: Used as the base for exponential calculation
   * - For LINEAR: Used as the increment for each retry
   * - For FIXED: Not used
   */
  @IsNumber()
  @IsPositive()
  @Min(1.1, { message: 'Backoff factor must be at least 1.1 for exponential policies' })
  @Max(5, { message: 'Backoff factor cannot exceed 5 for system stability' })
  @ValidateIf((o) => o.policyType !== PolicyType.FIXED)
  @Type(() => Number)
  @IsOptional()
  backoffFactor?: number;

  /**
   * Whether to add random jitter to retry delays to prevent thundering herd problems
   * when multiple retries happen simultaneously
   */
  @IsBoolean()
  @IsOptional()
  jitter?: boolean;
}