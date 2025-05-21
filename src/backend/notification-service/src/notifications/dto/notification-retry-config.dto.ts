import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Enum defining the available retry policy types for notification delivery.
 * These policies determine how retry intervals are calculated between attempts.
 */
export enum RetryPolicyType {
  EXPONENTIAL_BACKOFF = 'EXPONENTIAL_BACKOFF',
  LINEAR = 'LINEAR',
  FIXED = 'FIXED',
}

/**
 * Enum defining the circuit breaker states for notification delivery.
 * Used to prevent overwhelming failing external services.
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation, requests flow through
  OPEN = 'OPEN',     // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if service has recovered
}

/**
 * Data transfer object for configuring circuit breaker behavior.
 * Circuit breakers prevent overwhelming failing external services by
 * temporarily stopping retry attempts after a threshold of failures.
 */
export class CircuitBreakerConfigDto {
  /**
   * Number of consecutive failures before opening the circuit
   * @example 5
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  failureThreshold: number;

  /**
   * Time in milliseconds the circuit stays open before moving to half-open
   * @example 60000 (1 minute)
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  resetTimeout: number;

  /**
   * Number of successful requests needed in half-open state to close the circuit
   * @example 3
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  successThreshold: number;

  /**
   * Whether to track failures by error type (more granular circuit breaking)
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  trackByErrorType?: boolean;
}

/**
 * Data transfer object for configuring dead letter queue behavior.
 * DLQ stores notifications that have exhausted all retry attempts
 * for later analysis or manual reprocessing.
 */
export class DlqConfigDto {
  /**
   * Whether to enable DLQ for failed notifications
   * @example true
   */
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;

  /**
   * Topic/queue name for the DLQ
   * @example 'notification-dlq'
   */
  @IsString()
  @IsOptional()
  queueName?: string;

  /**
   * Additional metadata to store with DLQ entries
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Data transfer object for configuring exponential backoff retry strategy.
 * Exponential backoff increases the delay between retry attempts exponentially,
 * which helps prevent overwhelming external services during recovery.
 */
export class ExponentialBackoffConfigDto {
  /**
   * Initial delay in milliseconds before the first retry
   * @example 1000 (1 second)
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  initialDelayMs: number;

  /**
   * Maximum delay in milliseconds between retries
   * @example 300000 (5 minutes)
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  maxDelayMs: number;

  /**
   * Multiplier for calculating next delay (delay = initialDelay * (backoffFactor ^ attemptNumber))
   * @example 2.0
   */
  @IsNumber()
  @Min(1.1)
  @Max(10)
  @IsNotEmpty()
  backoffFactor: number;

  /**
   * Whether to add randomized jitter to prevent thundering herd problem
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  jitter?: boolean = true;
}

/**
 * Data transfer object for configuring linear backoff retry strategy.
 * Linear backoff increases the delay between retry attempts linearly.
 */
export class LinearBackoffConfigDto {
  /**
   * Initial delay in milliseconds before the first retry
   * @example 1000 (1 second)
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  initialDelayMs: number;

  /**
   * Increment in milliseconds added to delay for each subsequent retry
   * @example 5000 (5 seconds)
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  incrementMs: number;

  /**
   * Maximum delay in milliseconds between retries
   * @example 60000 (1 minute)
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  maxDelayMs: number;

  /**
   * Whether to add randomized jitter to prevent thundering herd problem
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  jitter?: boolean = true;
}

/**
 * Data transfer object for configuring fixed interval retry strategy.
 * Fixed interval uses the same delay between all retry attempts.
 */
export class FixedIntervalConfigDto {
  /**
   * Fixed delay in milliseconds between retry attempts
   * @example 5000 (5 seconds)
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  delayMs: number;

  /**
   * Whether to add randomized jitter to prevent thundering herd problem
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  jitter?: boolean = false;
}

/**
 * Data transfer object for configuring notification retry behavior.
 * This DTO enables fine-grained control over retry attempts, backoff strategies,
 * and dead-letter queue routing for failed notifications.
 */
export class NotificationRetryConfigDto {
  /**
   * Maximum number of retry attempts before giving up
   * @example 5
   */
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  maxRetries: number;

  /**
   * Type of retry policy to use
   * @example RetryPolicyType.EXPONENTIAL_BACKOFF
   */
  @IsEnum(RetryPolicyType)
  @IsNotEmpty()
  policyType: RetryPolicyType;

  /**
   * Configuration for exponential backoff retry strategy
   * Required when policyType is EXPONENTIAL_BACKOFF
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ExponentialBackoffConfigDto)
  exponentialBackoffConfig?: ExponentialBackoffConfigDto;

  /**
   * Configuration for linear backoff retry strategy
   * Required when policyType is LINEAR
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => LinearBackoffConfigDto)
  linearBackoffConfig?: LinearBackoffConfigDto;

  /**
   * Configuration for fixed interval retry strategy
   * Required when policyType is FIXED
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => FixedIntervalConfigDto)
  fixedIntervalConfig?: FixedIntervalConfigDto;

  /**
   * Configuration for circuit breaker behavior
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CircuitBreakerConfigDto)
  circuitBreakerConfig?: CircuitBreakerConfigDto;

  /**
   * Configuration for dead letter queue behavior
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => DlqConfigDto)
  dlqConfig?: DlqConfigDto;

  /**
   * Timeout in milliseconds for each retry attempt
   * @example 30000 (30 seconds)
   */
  @IsInt()
  @IsPositive()
  @IsOptional()
  timeoutMs?: number = 30000; // Default to 30 seconds to meet SLA requirements

  /**
   * Whether to track and log detailed retry history
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  trackRetryHistory?: boolean = true;

  /**
   * Additional metadata for retry operations
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}