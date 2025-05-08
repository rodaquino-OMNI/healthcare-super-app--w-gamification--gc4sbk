/**
 * @file quest-processing.exception.ts
 * @description Implements a technical exception for internal errors that occur during quest processing operations.
 * This exception captures detailed error contexts including the operation being performed, affected entities,
 * and system state, allowing for comprehensive debugging and root cause analysis while mapping to HTTP 500 Internal Server Error.
 *
 * This file implements the following requirements from the technical specification:
 * - Error classification (system errors for internal failures)
 * - Error aggregation and trend analysis
 * - Automatic alerting for critical errors
 * - Structured logging with correlation IDs
 */

import { HttpStatus } from '@nestjs/common';
import { BaseQuestException, BaseQuestExceptionMetadata } from './base-quest.exception';

/**
 * Metadata interface for quest processing exceptions
 */
export interface QuestProcessingExceptionMetadata extends BaseQuestExceptionMetadata {
  /**
   * Processing stage where the error occurred
   */
  processingStage?: string;

  /**
   * Correlation ID for tracing the error across services
   */
  correlationId?: string;

  /**
   * Quest ID that was being processed
   */
  questId?: string;

  /**
   * User ID associated with the quest
   */
  userId?: string;

  /**
   * Journey associated with the quest
   */
  journey?: string;

  /**
   * Root cause of the error
   */
  cause?: Error | unknown;
}

/**
 * Exception thrown when an error occurs during the internal processing of quest operations.
 * 
 * This exception is used for system errors that occur during quest processing operations.
 * These errors represent internal failures rather than client errors, and typically require
 * system administrator attention.
 * 
 * Examples include:
 * - Quest progress calculation errors
 * - Quest completion processing failures
 * - Database transaction issues
 * - XP reward calculation errors
 * - Achievement unlocking failures
 */
export class QuestProcessingException extends BaseQuestException {
  /**
   * Processing stage where the error occurred
   */
  private processingStage: string;

  /**
   * Correlation ID for tracing the error across services
   */
  private correlationId: string;

  /**
   * Quest ID that was being processed
   */
  private questId: string;

  /**
   * User ID associated with the quest
   */
  private userId: string;

  /**
   * Journey associated with the quest
   */
  private journey: string;

  /**
   * Root cause of the error
   */
  private cause: Error | unknown;

  /**
   * Creates a new QuestProcessingException
   * 
   * @param message Error message
   * @param metadata Additional metadata for the exception
   */
  constructor(message: string, metadata: QuestProcessingExceptionMetadata = {}) {
    // Set default metadata for system errors
    const enhancedMetadata: QuestProcessingExceptionMetadata = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorType: 'SYSTEM',
      errorCode: 'GAME_017',
      ...metadata,
    };

    // Call parent constructor
    super(message, enhancedMetadata);

    // Set exception properties
    this.processingStage = metadata.processingStage || 'unknown';
    this.correlationId = metadata.correlationId || this.generateCorrelationId();
    this.questId = metadata.questId || 'unknown';
    this.userId = metadata.userId || 'unknown';
    this.journey = metadata.journey || 'unknown';
    this.cause = metadata.cause;

    // Set name explicitly for better error identification
    this.name = 'QuestProcessingException';

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, QuestProcessingException.prototype);

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
   * Get the quest ID that was being processed
   */
  public getQuestId(): string {
    return this.questId;
  }

  /**
   * Get the user ID associated with the quest
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * Get the journey associated with the quest
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
    return `quest-error-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
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
      questId: this.questId,
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
   * Create a QuestProcessingException from a quest progress calculation error
   * 
   * @param message Error message
   * @param questId The ID of the quest being processed
   * @param userId The user ID associated with the quest
   * @param cause The original error that caused the progress calculation failure
   * @param metadata Additional metadata
   */
  public static fromProgressCalculationError(
    message: string,
    questId: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<QuestProcessingExceptionMetadata> = {},
  ): QuestProcessingException {
    return new QuestProcessingException(message, {
      processingStage: 'progress-calculation',
      questId,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create a QuestProcessingException from a quest completion processing error
   * 
   * @param message Error message
   * @param questId The ID of the quest being processed
   * @param userId The user ID associated with the quest
   * @param cause The original error that caused the completion processing failure
   * @param metadata Additional metadata
   */
  public static fromCompletionProcessingError(
    message: string,
    questId: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<QuestProcessingExceptionMetadata> = {},
  ): QuestProcessingException {
    return new QuestProcessingException(message, {
      processingStage: 'completion-processing',
      questId,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create a QuestProcessingException from a database transaction error
   * 
   * @param message Error message
   * @param questId The ID of the quest being processed
   * @param userId The user ID associated with the quest
   * @param cause The original error that caused the database transaction failure
   * @param metadata Additional metadata
   */
  public static fromDatabaseError(
    message: string,
    questId: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<QuestProcessingExceptionMetadata> = {},
  ): QuestProcessingException {
    return new QuestProcessingException(message, {
      processingStage: 'database-transaction',
      questId,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create a QuestProcessingException from an XP reward calculation error
   * 
   * @param message Error message
   * @param questId The ID of the quest being processed
   * @param userId The user ID associated with the quest
   * @param cause The original error that caused the XP reward calculation failure
   * @param metadata Additional metadata
   */
  public static fromXpCalculationError(
    message: string,
    questId: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<QuestProcessingExceptionMetadata> = {},
  ): QuestProcessingException {
    return new QuestProcessingException(message, {
      processingStage: 'xp-calculation',
      questId,
      userId,
      cause,
      ...metadata,
    });
  }

  /**
   * Create a QuestProcessingException from an achievement unlocking error
   * 
   * @param message Error message
   * @param questId The ID of the quest being processed
   * @param userId The user ID associated with the quest
   * @param cause The original error that caused the achievement unlocking failure
   * @param metadata Additional metadata
   */
  public static fromAchievementUnlockingError(
    message: string,
    questId: string,
    userId: string,
    cause: Error | unknown,
    metadata: Partial<QuestProcessingExceptionMetadata> = {},
  ): QuestProcessingException {
    return new QuestProcessingException(message, {
      processingStage: 'achievement-unlocking',
      questId,
      userId,
      cause,
      ...metadata,
    });
  }
}