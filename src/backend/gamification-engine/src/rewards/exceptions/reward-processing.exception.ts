/**
 * @file reward-processing.exception.ts
 * @description Implements a technical exception for internal errors that occur during reward processing operations.
 * This exception captures detailed error contexts including the operation being performed, affected rewards,
 * and system state, allowing for comprehensive debugging and root cause analysis while mapping to HTTP 500 Internal Server Error.
 *
 * This file implements the following requirements from the technical specification:
 * - Error classification (system errors for internal failures)
 * - Error aggregation and trend analysis
 * - Automatic alerting for critical errors
 * - Structured logging with correlation IDs
 */

import { HttpStatus } from '@nestjs/common';
import { BaseRewardException, BaseRewardExceptionMetadata } from './base-reward.exception';
import { Reward } from '../entities/reward.entity';

/**
 * Metadata interface for reward processing exceptions
 */
export interface RewardProcessingExceptionMetadata extends BaseRewardExceptionMetadata {
  /**
   * Processing stage where the error occurred
   */
  processingStage?: string;

  /**
   * Correlation ID for tracing the error across services
   */
  correlationId?: string;

  /**
   * Reward ID or object that was being processed
   */
  reward?: string | Reward;

  /**
   * User ID associated with the reward operation
   */
  userId?: string;

  /**
   * Journey associated with the reward
   */
  journey?: string;

  /**
   * Root cause of the error
   */
  cause?: Error | unknown;
}

/**
 * Exception thrown when an error occurs during the internal processing of rewards.
 * 
 * This exception is used for system errors that occur during reward operations. These errors
 * represent internal failures rather than client errors, and typically require system
 * administrator attention.
 * 
 * Examples include:
 * - Reward calculation errors
 * - Reward distribution failures
 * - Database transaction issues during reward operations
 * - Integration failures with notification systems
 * - XP calculation errors
 */
export class RewardProcessingException extends BaseRewardException {
  /**
   * Processing stage where the error occurred
   */
  private processingStage: string;

  /**
   * Correlation ID for tracing the error across services
   */
  private correlationId: string;

  /**
   * Reward ID or object that was being processed
   */
  private reward: string | Reward;

  /**
   * User ID associated with the reward operation
   */
  private userId: string;

  /**
   * Journey associated with the reward
   */
  private journey: string;

  /**
   * Root cause of the error
   */
  private cause: Error | unknown;

  /**
   * Creates a new RewardProcessingException
   * 
   * @param message Error message
   * @param metadata Additional metadata for the exception
   */
  constructor(message: string, metadata: RewardProcessingExceptionMetadata = {}) {
    // Set default metadata for system errors
    const enhancedMetadata: RewardProcessingExceptionMetadata = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorType: 'SYSTEM',
      errorCode: 'REWARD_501',
      ...metadata,
    };

    // Call parent constructor
    super(message, enhancedMetadata);

    // Set exception properties
    this.processingStage = metadata.processingStage || 'unknown';
    this.correlationId = metadata.correlationId || this.generateCorrelationId();
    this.reward = metadata.reward || 'unknown';
    this.userId = metadata.userId || 'unknown';
    this.journey = metadata.journey || 'unknown';
    this.cause = metadata.cause;

    // Set name explicitly for better error identification
    this.name = 'RewardProcessingException';

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, RewardProcessingException.prototype);

    // Capture stack trace if cause is an Error
    if (this.cause instanceof Error && !this.cause.stack) {
      Error.captureStackTrace(this.cause, this.constructor);
    }
  }

  /**
   * Get the processing stage where the error occurred
   */
  public getProcessingStage(): string {
    return this.processingStage;
  }

  /**
   * Get the correlation ID for tracing the error across services
   */
  public getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Get the reward ID or object that was being processed
   */
  public getReward(): string | Reward {
    return this.reward;
  }

  /**
   * Get the user ID associated with the reward operation
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * Get the journey associated with the reward
   */
  public getJourney(): string {
    return this.journey;
  }

  /**
   * Get the root cause of the error
   */
  public getCause(): Error | unknown {
    return this.cause;
  }

  /**
   * Generate a correlation ID if one was not provided
   * @private
   */
  private generateCorrelationId(): string {
    return `reward-error-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Serialize the exception for logging and monitoring
   * @override
   */
  public toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    return {
      ...baseJson,
      processingStage: this.processingStage,
      correlationId: this.correlationId,
      reward: typeof this.reward === 'string' ? this.reward : this.reward.id,
      userId: this.userId,
      journey: this.journey,
      cause: this.cause instanceof Error ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack,
      } : this.cause,
    };
  }

  /**
   * Create a RewardProcessingException from a reward calculation error
   * 
   * @param message Error message
   * @param reward The reward ID or object being processed
   * @param userId The user ID associated with the reward
   * @param cause The original error that caused the calculation failure
   * @param metadata Additional metadata
   */
  public static fromCalculationError(
    message: string,
    reward: string | Reward,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<RewardProcessingExceptionMetadata> = {},
  ): RewardProcessingException {
    return new RewardProcessingException(message, {
      processingStage: 'reward-calculation',
      reward,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create a RewardProcessingException from a reward distribution error
   * 
   * @param message Error message
   * @param reward The reward ID or object being processed
   * @param userId The user ID associated with the reward
   * @param cause The original error that caused the distribution failure
   * @param metadata Additional metadata
   */
  public static fromDistributionError(
    message: string,
    reward: string | Reward,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<RewardProcessingExceptionMetadata> = {},
  ): RewardProcessingException {
    return new RewardProcessingException(message, {
      processingStage: 'reward-distribution',
      reward,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create a RewardProcessingException from a database transaction error
   * 
   * @param message Error message
   * @param reward The reward ID or object being processed
   * @param userId The user ID associated with the reward
   * @param cause The original error that caused the database transaction failure
   * @param metadata Additional metadata
   */
  public static fromDatabaseError(
    message: string,
    reward: string | Reward,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<RewardProcessingExceptionMetadata> = {},
  ): RewardProcessingException {
    return new RewardProcessingException(message, {
      processingStage: 'database-transaction',
      reward,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create a RewardProcessingException from an XP calculation error
   * 
   * @param message Error message
   * @param reward The reward ID or object being processed
   * @param userId The user ID associated with the reward
   * @param cause The original error that caused the XP calculation failure
   * @param metadata Additional metadata
   */
  public static fromXpCalculationError(
    message: string,
    reward: string | Reward,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<RewardProcessingExceptionMetadata> = {},
  ): RewardProcessingException {
    return new RewardProcessingException(message, {
      processingStage: 'xp-calculation',
      reward,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create a RewardProcessingException from a notification error
   * 
   * @param message Error message
   * @param reward The reward ID or object being processed
   * @param userId The user ID associated with the reward
   * @param cause The original error that caused the notification failure
   * @param metadata Additional metadata
   */
  public static fromNotificationError(
    message: string,
    reward: string | Reward,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<RewardProcessingExceptionMetadata> = {},
  ): RewardProcessingException {
    return new RewardProcessingException(message, {
      processingStage: 'notification-delivery',
      reward,
      userId,
      cause,
      ...metadata,
    });
  }
}