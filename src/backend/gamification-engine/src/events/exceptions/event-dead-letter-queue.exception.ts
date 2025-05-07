import { HttpStatus } from '@nestjs/common';
import { ProcessEventDto } from '../dto/process-event.dto';

/**
 * Interface representing a single retry attempt for an event
 */
export interface RetryAttempt {
  /** Timestamp when the retry was attempted */
  timestamp: Date;
  /** Error message from the failed attempt */
  errorMessage: string;
  /** Full error stack if available */
  errorStack?: string;
  /** Retry attempt number (1-based) */
  attemptNumber: number;
  /** Backoff duration in milliseconds that was used for this attempt */
  backoffMs?: number;
  /** Additional context about the retry attempt */
  context?: Record<string, any>;
}

/**
 * Interface for metadata related to manual intervention
 */
export interface ManualInterventionMetadata {
  /** Suggested actions for manual intervention */
  suggestedActions?: string[];
  /** Priority level for intervention (1-5, with 1 being highest) */
  priority?: number;
  /** Team or individual responsible for handling this type of failure */
  assignedTo?: string;
  /** URL to documentation about this type of failure */
  documentationUrl?: string;
  /** Whether this failure requires immediate attention */
  requiresImmediateAttention?: boolean;
  /** Custom metadata specific to the event type */
  [key: string]: any;
}

/**
 * Interface for monitoring integration metadata
 */
export interface MonitoringMetadata {
  /** Alert ID if an alert was triggered */
  alertId?: string;
  /** Severity level of the alert */
  severity?: 'critical' | 'high' | 'medium' | 'low';
  /** Whether the alert was acknowledged */
  acknowledged?: boolean;
  /** Timestamp when the alert was triggered */
  alertTimestamp?: Date;
  /** Incident ID if this failure is part of a larger incident */
  incidentId?: string;
  /** Custom monitoring metadata */
  [key: string]: any;
}

/**
 * Exception thrown when an event has exhausted all retry attempts and is being sent to a dead-letter queue.
 * This exception captures the complete history of retry attempts, original errors, and provides context
 * for manual intervention or automated recovery processes.
 */
export class EventDeadLetterQueueException extends Error {
  /** HTTP status code (503 Service Unavailable) */
  readonly statusCode: number = HttpStatus.SERVICE_UNAVAILABLE;
  
  /** Error code for this type of exception */
  readonly errorCode: string = 'EVENT_DLQ_ERROR';
  
  /** Timestamp when the exception was created */
  readonly timestamp: Date;
  
  /** The original event that failed processing */
  readonly originalEvent: ProcessEventDto;
  
  /** History of retry attempts */
  readonly retryHistory: RetryAttempt[];
  
  /** Maximum number of retry attempts configured */
  readonly maxRetryAttempts: number;
  
  /** The original error that caused the first failure */
  readonly originalError: Error;
  
  /** Metadata for manual intervention */
  readonly manualInterventionMetadata: ManualInterventionMetadata;
  
  /** Metadata for monitoring integration */
  readonly monitoringMetadata: MonitoringMetadata;
  
  /** The dead letter queue topic where the event was sent */
  readonly dlqTopic: string;
  
  /** Unique identifier for this DLQ event */
  readonly dlqEventId: string;
  
  /**
   * Creates a new EventDeadLetterQueueException
   * 
   * @param message Error message
   * @param originalEvent The original event that failed processing
   * @param retryHistory History of retry attempts
   * @param originalError The original error that caused the first failure
   * @param maxRetryAttempts Maximum number of retry attempts configured
   * @param dlqTopic The dead letter queue topic where the event was sent
   * @param manualInterventionMetadata Metadata for manual intervention
   * @param monitoringMetadata Metadata for monitoring integration
   */
  constructor(
    message: string,
    originalEvent: ProcessEventDto,
    retryHistory: RetryAttempt[],
    originalError: Error,
    maxRetryAttempts: number,
    dlqTopic: string,
    manualInterventionMetadata: ManualInterventionMetadata = {},
    monitoringMetadata: MonitoringMetadata = {}
  ) {
    super(message);
    this.name = 'EventDeadLetterQueueException';
    this.timestamp = new Date();
    this.originalEvent = originalEvent;
    this.retryHistory = retryHistory;
    this.originalError = originalError;
    this.maxRetryAttempts = maxRetryAttempts;
    this.dlqTopic = dlqTopic;
    this.manualInterventionMetadata = manualInterventionMetadata;
    this.monitoringMetadata = monitoringMetadata;
    this.dlqEventId = this.generateDlqEventId();
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventDeadLetterQueueException.prototype);
  }
  
  /**
   * Generates a unique identifier for this DLQ event
   * Format: dlq-{eventType}-{userId}-{timestamp}
   */
  private generateDlqEventId(): string {
    const timestamp = Date.now();
    const eventType = this.originalEvent.type.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const userId = this.originalEvent.userId.split('-')[0]; // Use first part of UUID
    
    return `dlq-${eventType}-${userId}-${timestamp}`;
  }
  
  /**
   * Creates a detailed summary of the exception for logging and monitoring
   */
  toDetailedSummary(): Record<string, any> {
    return {
      errorCode: this.errorCode,
      message: this.message,
      timestamp: this.timestamp,
      dlqEventId: this.dlqEventId,
      dlqTopic: this.dlqTopic,
      event: {
        type: this.originalEvent.type,
        userId: this.originalEvent.userId,
        journey: this.originalEvent.journey,
        // Exclude potentially large data payload from summary
        hasData: !!this.originalEvent.data
      },
      retryAttempts: this.retryHistory.length,
      maxRetryAttempts: this.maxRetryAttempts,
      originalError: {
        message: this.originalError.message,
        name: this.originalError.name
      },
      lastRetryAttempt: this.retryHistory.length > 0 
        ? this.retryHistory[this.retryHistory.length - 1]
        : null,
      requiresImmediateAttention: 
        this.manualInterventionMetadata.requiresImmediateAttention || false,
      alertSeverity: this.monitoringMetadata.severity || 'medium'
    };
  }
  
  /**
   * Creates a JSON representation of the exception for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      dlqEventId: this.dlqEventId,
      dlqTopic: this.dlqTopic,
      originalEvent: {
        type: this.originalEvent.type,
        userId: this.originalEvent.userId,
        journey: this.originalEvent.journey,
        data: this.originalEvent.data
      },
      retryHistory: this.retryHistory,
      maxRetryAttempts: this.maxRetryAttempts,
      originalError: {
        message: this.originalError.message,
        name: this.originalError.name,
        stack: this.originalError.stack
      },
      manualInterventionMetadata: this.manualInterventionMetadata,
      monitoringMetadata: this.monitoringMetadata
    };
  }
  
  /**
   * Creates a recovery plan for this failed event
   */
  generateRecoveryPlan(): Record<string, any> {
    // Analyze retry history to determine failure patterns
    const failurePatterns = this.analyzeFailurePatterns();
    
    return {
      dlqEventId: this.dlqEventId,
      eventType: this.originalEvent.type,
      userId: this.originalEvent.userId,
      journey: this.originalEvent.journey,
      failurePatterns,
      suggestedActions: this.manualInterventionMetadata.suggestedActions || [
        'Verify external service availability',
        'Check event payload for validity',
        'Review system logs for related errors',
        'Manually reprocess the event after fixing the root cause'
      ],
      canBeReprocessed: true, // Default assumption
      reprocessingEndpoint: `/api/events/dlq/reprocess/${this.dlqEventId}`,
      requiredChanges: this.determineRequiredChanges(failurePatterns)
    };
  }
  
  /**
   * Analyzes retry history to identify patterns in failures
   */
  private analyzeFailurePatterns(): Record<string, any> {
    if (!this.retryHistory || this.retryHistory.length === 0) {
      return { noRetryDataAvailable: true };
    }
    
    // Extract error messages to look for patterns
    const errorMessages = this.retryHistory.map(attempt => attempt.errorMessage);
    
    // Check for common patterns
    const containsConnectionError = errorMessages.some(msg => 
      msg.includes('connection') || msg.includes('timeout') || msg.includes('network')
    );
    
    const containsValidationError = errorMessages.some(msg =>
      msg.includes('validation') || msg.includes('invalid') || msg.includes('schema')
    );
    
    const containsDatabaseError = errorMessages.some(msg =>
      msg.includes('database') || msg.includes('query') || msg.includes('SQL')
    );
    
    const containsAuthError = errorMessages.some(msg =>
      msg.includes('authentication') || msg.includes('authorization') || 
      msg.includes('permission') || msg.includes('access denied')
    );
    
    // Calculate time between retries to detect increasing backoff
    const backoffPattern = this.retryHistory.length > 1 ? 
      this.calculateBackoffPattern() : 'insufficient_data';
    
    return {
      connectionIssues: containsConnectionError,
      validationIssues: containsValidationError,
      databaseIssues: containsDatabaseError,
      authorizationIssues: containsAuthError,
      consistentErrorMessages: new Set(errorMessages).size !== errorMessages.length,
      backoffPattern,
      totalRetryDuration: this.calculateTotalRetryDuration(),
      errorMessageSamples: errorMessages.slice(0, 3) // First 3 error messages as samples
    };
  }
  
  /**
   * Calculates the backoff pattern from retry history
   */
  private calculateBackoffPattern(): string {
    if (this.retryHistory.length <= 1) {
      return 'insufficient_data';
    }
    
    const intervals: number[] = [];
    
    for (let i = 1; i < this.retryHistory.length; i++) {
      const current = this.retryHistory[i].timestamp.getTime();
      const previous = this.retryHistory[i-1].timestamp.getTime();
      intervals.push(current - previous);
    }
    
    // Check if intervals are increasing (exponential backoff)
    let increasing = true;
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i] <= intervals[i-1]) {
        increasing = false;
        break;
      }
    }
    
    if (increasing) {
      return 'exponential_backoff';
    }
    
    // Check if intervals are constant
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const allSimilar = intervals.every(interval => 
      Math.abs(interval - avgInterval) / avgInterval < 0.2 // Within 20% of average
    );
    
    if (allSimilar) {
      return 'constant_interval';
    }
    
    return 'irregular_pattern';
  }
  
  /**
   * Calculates the total duration of all retry attempts
   */
  private calculateTotalRetryDuration(): number {
    if (!this.retryHistory || this.retryHistory.length <= 1) {
      return 0;
    }
    
    const firstAttempt = this.retryHistory[0].timestamp.getTime();
    const lastAttempt = this.retryHistory[this.retryHistory.length - 1].timestamp.getTime();
    
    return lastAttempt - firstAttempt;
  }
  
  /**
   * Determines required changes based on failure patterns
   */
  private determineRequiredChanges(failurePatterns: Record<string, any>): string[] {
    const changes: string[] = [];
    
    if (failurePatterns.connectionIssues) {
      changes.push('Verify network connectivity to external services');
      changes.push('Check for service outages in dependent systems');
    }
    
    if (failurePatterns.validationIssues) {
      changes.push('Review event payload structure against schema');
      changes.push('Verify data types and required fields');
    }
    
    if (failurePatterns.databaseIssues) {
      changes.push('Check database connectivity and performance');
      changes.push('Review query structure and indexes');
    }
    
    if (failurePatterns.authorizationIssues) {
      changes.push('Verify authentication credentials');
      changes.push('Check permission settings for the operation');
    }
    
    return changes.length > 0 ? changes : ['Investigate root cause in system logs'];
  }
}