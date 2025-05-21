import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@austa/errors/base';
import { ErrorType } from '@austa/errors/types';
import { IEventPayload } from '../interfaces/event.interface';

/**
 * Interface for retry attempt history
 */
export interface IRetryAttempt {
  /** Timestamp when the retry was attempted */
  timestamp: Date;
  /** Error message from the failed attempt */
  errorMessage: string;
  /** Error stack trace if available */
  stack?: string;
  /** Delay before this retry attempt in milliseconds */
  delayMs?: number;
  /** Additional context about the retry attempt */
  context?: Record<string, any>;
}

/**
 * Interface for dead letter queue metadata
 */
export interface IDLQMetadata {
  /** Original event that failed processing */
  originalEvent: IEventPayload;
  /** Number of retry attempts made before sending to DLQ */
  retryCount: number;
  /** History of retry attempts with timestamps and errors */
  retryHistory: IRetryAttempt[];
  /** Original error that caused the event to be sent to DLQ */
  originalError: Error | unknown;
  /** Timestamp when the event was sent to DLQ */
  enqueuedAt: Date;
  /** Unique identifier for the DLQ entry */
  dlqId: string;
  /** Topic or queue where the event was originally published */
  sourceTopic: string;
  /** Journey context (health, care, plan) */
  journey?: string;
  /** Suggested recovery action */
  recoveryAction?: string;
  /** Flag indicating if this event requires manual intervention */
  requiresManualIntervention: boolean;
  /** Priority level for manual processing (1-5, with 1 being highest) */
  priority?: number;
}

/**
 * Exception thrown when an event has exhausted all retry attempts and is being sent to a dead-letter queue.
 * This exception captures the complete history of retry attempts, original errors, and provides context
 * for manual intervention or automated recovery processes.
 */
export class EventDeadLetterQueueException extends BaseError {
  /** Metadata about the dead letter queue entry */
  public readonly dlqMetadata: IDLQMetadata;

  /**
   * Creates a new EventDeadLetterQueueException instance
   * 
   * @param message - Human-readable error message
   * @param dlqMetadata - Metadata about the dead letter queue entry
   */
  constructor(
    message: string,
    dlqMetadata: IDLQMetadata
  ) {
    super(
      message,
      'EVENT_DLQ_ERROR',
      ErrorType.TECHNICAL, // System error since it's a processing failure
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        dlqId: dlqMetadata.dlqId,
        eventType: dlqMetadata.originalEvent.type,
        userId: dlqMetadata.originalEvent.userId,
        retryCount: dlqMetadata.retryCount,
        journey: dlqMetadata.journey || dlqMetadata.originalEvent.journey,
        requiresManualIntervention: dlqMetadata.requiresManualIntervention,
        priority: dlqMetadata.priority || 3, // Default to medium priority
        sourceTopic: dlqMetadata.sourceTopic,
        enqueuedAt: dlqMetadata.enqueuedAt.toISOString(),
      }
    );

    this.dlqMetadata = dlqMetadata;

    // Capture original error stack if available
    if (dlqMetadata.originalError instanceof Error) {
      this.cause = dlqMetadata.originalError;
    }
  }

  /**
   * Creates a new EventDeadLetterQueueException from an event and error
   * 
   * @param event - The event that failed processing
   * @param error - The error that caused the failure
   * @param retryHistory - History of retry attempts
   * @param sourceTopic - Topic or queue where the event was originally published
   * @param options - Additional options for the DLQ entry
   * @returns A new EventDeadLetterQueueException instance
   */
  static fromEventAndError(
    event: IEventPayload,
    error: Error | unknown,
    retryHistory: IRetryAttempt[],
    sourceTopic: string,
    options?: {
      requiresManualIntervention?: boolean;
      priority?: number;
      recoveryAction?: string;
      dlqId?: string;
    }
  ): EventDeadLetterQueueException {
    const dlqId = options?.dlqId || `dlq-${event.type}-${event.userId}-${Date.now()}`;
    const requiresManualIntervention = options?.requiresManualIntervention ?? true;
    const errorMessage = error instanceof Error ? error.message : String(error);

    const message = `Event ${event.type} for user ${event.userId} sent to DLQ after ${retryHistory.length} failed attempts: ${errorMessage}`;

    const dlqMetadata: IDLQMetadata = {
      originalEvent: event,
      retryCount: retryHistory.length,
      retryHistory,
      originalError: error,
      enqueuedAt: new Date(),
      dlqId,
      sourceTopic,
      journey: event.journey,
      requiresManualIntervention,
      priority: options?.priority,
      recoveryAction: options?.recoveryAction,
    };

    return new EventDeadLetterQueueException(message, dlqMetadata);
  }

  /**
   * Generates a detailed report of the DLQ entry for troubleshooting
   * 
   * @returns A formatted string with detailed information about the DLQ entry
   */
  generateDLQReport(): string {
    const { dlqMetadata } = this;
    const { originalEvent, retryHistory, originalError } = dlqMetadata;

    let report = `DLQ ENTRY REPORT - ID: ${dlqMetadata.dlqId}\n`;
    report += `Timestamp: ${dlqMetadata.enqueuedAt.toISOString()}\n`;
    report += `Source Topic: ${dlqMetadata.sourceTopic}\n`;
    report += `Event Type: ${originalEvent.type}\n`;
    report += `User ID: ${originalEvent.userId}\n`;
    report += `Journey: ${dlqMetadata.journey || originalEvent.journey || 'Unknown'}\n`;
    report += `Retry Count: ${dlqMetadata.retryCount}\n`;
    report += `Priority: ${dlqMetadata.priority || 3}\n`;
    report += `Requires Manual Intervention: ${dlqMetadata.requiresManualIntervention ? 'Yes' : 'No'}\n`;
    
    if (dlqMetadata.recoveryAction) {
      report += `Suggested Recovery Action: ${dlqMetadata.recoveryAction}\n`;
    }

    report += `\nOriginal Event Payload:\n${JSON.stringify(originalEvent.data, null, 2)}\n`;

    report += `\nRetry History:\n`;
    retryHistory.forEach((attempt, index) => {
      report += `Attempt ${index + 1} - ${attempt.timestamp.toISOString()}\n`;
      report += `Error: ${attempt.errorMessage}\n`;
      if (attempt.delayMs) {
        report += `Delay: ${attempt.delayMs}ms\n`;
      }
      if (attempt.context) {
        report += `Context: ${JSON.stringify(attempt.context, null, 2)}\n`;
      }
      report += `\n`;
    });

    report += `Original Error:\n`;
    if (originalError instanceof Error) {
      report += `Name: ${originalError.name}\n`;
      report += `Message: ${originalError.message}\n`;
      report += `Stack: ${originalError.stack}\n`;
    } else {
      report += `${String(originalError)}\n`;
    }

    return report;
  }

  /**
   * Determines if the event can be automatically reprocessed
   * 
   * @returns True if the event can be automatically reprocessed, false otherwise
   */
  canAutoReprocess(): boolean {
    return !this.dlqMetadata.requiresManualIntervention;
  }

  /**
   * Creates a reprocessing payload for the event
   * 
   * @param options - Options for reprocessing
   * @returns A payload that can be used to reprocess the event
   */
  createReprocessingPayload(options?: { resetRetryCount?: boolean }): {
    event: IEventPayload;
    metadata: {
      dlqId: string;
      previousRetryCount: number;
      reprocessedAt: Date;
      originalError: string;
    };
  } {
    const resetRetryCount = options?.resetRetryCount ?? false;

    return {
      event: this.dlqMetadata.originalEvent,
      metadata: {
        dlqId: this.dlqMetadata.dlqId,
        previousRetryCount: resetRetryCount ? 0 : this.dlqMetadata.retryCount,
        reprocessedAt: new Date(),
        originalError: this.dlqMetadata.originalError instanceof Error
          ? this.dlqMetadata.originalError.message
          : String(this.dlqMetadata.originalError),
      },
    };
  }
}