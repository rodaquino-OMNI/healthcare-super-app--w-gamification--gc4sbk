/**
 * @file notification-retry-config.dto.ts
 * @description Defines the structure and validation rules for configuring notification retry behavior.
 * This DTO enables fine-grained control over retry attempts, backoff strategies, and dead-letter queue routing
 * for failed notifications.
 */

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
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationErrorCategory } from '@austa/interfaces/notification';

/**
 * Enum defining the available retry policy types.
 */
export enum RetryPolicyType {
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR = 'linear',
  FIXED = 'fixed',
}

/**
 * Base DTO for retry configuration options shared across all policy types.
 */
export class BaseRetryConfigDto {
  /**
   * Maximum number of retry attempts before sending to dead-letter queue.
   */
  @ApiProperty({
    description: 'Maximum number of retry attempts before sending to dead-letter queue',
    type: Number,
    example: 3,
    minimum: 0,
    maximum: 10,
  })
  @IsInt()
  @Min(0)
  @Max(10)
  maxRetries: number;

  /**
   * Whether to use jitter to randomize retry intervals.
   * Helps prevent thundering herd problems when many retries occur simultaneously.
   */
  @ApiPropertyOptional({
    description: 'Whether to use jitter to randomize retry intervals',
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  useJitter?: boolean = true;

  /**
   * Maximum delay in milliseconds between retries.
   * Prevents excessive wait times for exponential or linear backoff strategies.
   */
  @ApiPropertyOptional({
    description: 'Maximum delay in milliseconds between retries',
    type: Number,
    example: 30000, // 30 seconds
    default: 30000,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  maxDelayMs?: number = 30000;

  /**
   * Error categories that should trigger retries.
   * If not specified, all transient errors will be retried.
   */
  @ApiPropertyOptional({
    description: 'Error categories that should trigger retries',
    type: [String],
    enum: NotificationErrorCategory,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(NotificationErrorCategory, { each: true })
  retryableErrorCategories?: NotificationErrorCategory[];

  /**
   * Whether to enable circuit breaker pattern for this notification type.
   * When enabled, consecutive failures will temporarily disable retries.
   */
  @ApiPropertyOptional({
    description: 'Whether to enable circuit breaker pattern for this notification type',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enableCircuitBreaker?: boolean = false;

  /**
   * Number of consecutive failures before opening the circuit breaker.
   * Only applicable if enableCircuitBreaker is true.
   */
  @ApiPropertyOptional({
    description: 'Number of consecutive failures before opening the circuit breaker',
    type: Number,
    example: 5,
    default: 5,
  })
  @IsOptional()
  @ValidateIf((o) => o.enableCircuitBreaker === true)
  @IsInt()
  @IsPositive()
  circuitBreakerThreshold?: number = 5;

  /**
   * Time in milliseconds to keep the circuit breaker open before trying again.
   * Only applicable if enableCircuitBreaker is true.
   */
  @ApiPropertyOptional({
    description: 'Time in milliseconds to keep the circuit breaker open before trying again',
    type: Number,
    example: 60000, // 1 minute
    default: 60000,
  })
  @IsOptional()
  @ValidateIf((o) => o.enableCircuitBreaker === true)
  @IsInt()
  @IsPositive()
  circuitBreakerResetTimeMs?: number = 60000;
}

/**
 * DTO for configuring exponential backoff retry strategy.
 * Delay increases exponentially with each retry attempt: initialDelayMs * (backoffFactor ^ attemptNumber).
 */
export class ExponentialBackoffConfigDto extends BaseRetryConfigDto {
  /**
   * Initial delay in milliseconds before the first retry.
   */
  @ApiProperty({
    description: 'Initial delay in milliseconds before the first retry',
    type: Number,
    example: 1000, // 1 second
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  initialDelayMs: number;

  /**
   * Factor by which the delay increases with each retry attempt.
   * For example, 2.0 means each retry waits twice as long as the previous one.
   */
  @ApiProperty({
    description: 'Factor by which the delay increases with each retry attempt',
    type: Number,
    example: 2.0,
    minimum: 1.1,
    maximum: 10.0,
  })
  @IsNumber()
  @Min(1.1)
  @Max(10.0)
  backoffFactor: number;
}

/**
 * DTO for configuring linear backoff retry strategy.
 * Delay increases linearly with each retry attempt: initialDelayMs + (incrementMs * attemptNumber).
 */
export class LinearBackoffConfigDto extends BaseRetryConfigDto {
  /**
   * Initial delay in milliseconds before the first retry.
   */
  @ApiProperty({
    description: 'Initial delay in milliseconds before the first retry',
    type: Number,
    example: 1000, // 1 second
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  initialDelayMs: number;

  /**
   * Amount in milliseconds to increment the delay for each retry attempt.
   */
  @ApiProperty({
    description: 'Amount in milliseconds to increment the delay for each retry attempt',
    type: Number,
    example: 1000, // 1 second
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  incrementMs: number;
}

/**
 * DTO for configuring fixed interval retry strategy.
 * Each retry attempt uses the same delay: delayMs.
 */
export class FixedIntervalConfigDto extends BaseRetryConfigDto {
  /**
   * Fixed delay in milliseconds between retry attempts.
   */
  @ApiProperty({
    description: 'Fixed delay in milliseconds between retry attempts',
    type: Number,
    example: 5000, // 5 seconds
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  delayMs: number;
}

/**
 * DTO for configuring dead-letter queue behavior for failed notifications.
 */
export class DeadLetterQueueConfigDto {
  /**
   * Whether to enable the dead-letter queue for failed notifications.
   */
  @ApiProperty({
    description: 'Whether to enable the dead-letter queue for failed notifications',
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  enabled: boolean = true;

  /**
   * Maximum time in milliseconds to keep entries in the dead-letter queue.
   */
  @ApiPropertyOptional({
    description: 'Maximum time in milliseconds to keep entries in the dead-letter queue',
    type: Number,
    example: 604800000, // 7 days
    default: 604800000,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  retentionMs?: number = 604800000; // 7 days

  /**
   * Whether to automatically retry entries from the dead-letter queue when the service restarts.
   */
  @ApiPropertyOptional({
    description: 'Whether to automatically retry entries from the dead-letter queue when the service restarts',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  retryOnRestart?: boolean = false;

  /**
   * Topic or queue name for the dead-letter queue.
   * If not specified, a default name will be used based on the notification type.
   */
  @ApiPropertyOptional({
    description: 'Topic or queue name for the dead-letter queue',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  queueName?: string;

  /**
   * Additional metadata to store with dead-letter queue entries.
   */
  @ApiPropertyOptional({
    description: 'Additional metadata to store with dead-letter queue entries',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Main DTO for configuring notification retry behavior.
 * Supports different retry strategies and dead-letter queue configuration.
 */
export class NotificationRetryConfigDto {
  /**
   * Type of retry policy to use.
   */
  @ApiProperty({
    description: 'Type of retry policy to use',
    enum: RetryPolicyType,
    example: RetryPolicyType.EXPONENTIAL_BACKOFF,
  })
  @IsEnum(RetryPolicyType)
  policyType: RetryPolicyType;

  /**
   * Configuration for exponential backoff retry policy.
   * Required when policyType is EXPONENTIAL_BACKOFF.
   */
  @ApiPropertyOptional({
    description: 'Configuration for exponential backoff retry policy',
    type: ExponentialBackoffConfigDto,
  })
  @ValidateIf((o) => o.policyType === RetryPolicyType.EXPONENTIAL_BACKOFF)
  @ValidateNested()
  @Type(() => ExponentialBackoffConfigDto)
  exponentialBackoffConfig?: ExponentialBackoffConfigDto;

  /**
   * Configuration for linear backoff retry policy.
   * Required when policyType is LINEAR.
   */
  @ApiPropertyOptional({
    description: 'Configuration for linear backoff retry policy',
    type: LinearBackoffConfigDto,
  })
  @ValidateIf((o) => o.policyType === RetryPolicyType.LINEAR)
  @ValidateNested()
  @Type(() => LinearBackoffConfigDto)
  linearBackoffConfig?: LinearBackoffConfigDto;

  /**
   * Configuration for fixed interval retry policy.
   * Required when policyType is FIXED.
   */
  @ApiPropertyOptional({
    description: 'Configuration for fixed interval retry policy',
    type: FixedIntervalConfigDto,
  })
  @ValidateIf((o) => o.policyType === RetryPolicyType.FIXED)
  @ValidateNested()
  @Type(() => FixedIntervalConfigDto)
  fixedIntervalConfig?: FixedIntervalConfigDto;

  /**
   * Configuration for dead-letter queue behavior.
   */
  @ApiPropertyOptional({
    description: 'Configuration for dead-letter queue behavior',
    type: DeadLetterQueueConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeadLetterQueueConfigDto)
  deadLetterQueueConfig?: DeadLetterQueueConfigDto = new DeadLetterQueueConfigDto();

  /**
   * Whether to apply this retry configuration to all notification channels.
   * If false, the configuration will only apply to the specified channels.
   */
  @ApiPropertyOptional({
    description: 'Whether to apply this retry configuration to all notification channels',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  applyToAllChannels?: boolean = false;

  /**
   * Notification channels to apply this retry configuration to.
   * Only applicable if applyToAllChannels is false.
   */
  @ApiPropertyOptional({
    description: 'Notification channels to apply this retry configuration to',
    type: [String],
    example: ['email', 'push'],
  })
  @IsOptional()
  @ValidateIf((o) => o.applyToAllChannels === false)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  channels?: string[];

  /**
   * Notification types to apply this retry configuration to.
   * If not specified, the configuration will apply to all notification types.
   */
  @ApiPropertyOptional({
    description: 'Notification types to apply this retry configuration to',
    type: [String],
    example: ['appointment_reminder', 'achievement_unlocked'],
  })
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  notificationTypes?: string[];

  /**
   * Journey types to apply this retry configuration to.
   * If not specified, the configuration will apply to all journeys.
   */
  @ApiPropertyOptional({
    description: 'Journey types to apply this retry configuration to',
    type: [String],
    example: ['health', 'care', 'plan'],
  })
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  journeyTypes?: string[];
}