import { ERROR_CODES, ERROR_MESSAGES } from '../../src/constants/errors.constants';

/**
 * Error severity levels for categorizing errors in testing scenarios.
 */
export enum ErrorSeverity {
  LOW = 'low',       // Non-critical errors that shouldn't affect processing
  MEDIUM = 'medium', // Errors that may require retry but should eventually succeed
  HIGH = 'high',     // Critical errors that should trigger immediate failure
  FATAL = 'fatal',   // Catastrophic errors that should bypass retry and go to DLQ
}

/**
 * Error sources for categorizing where errors originate in the event processing pipeline.
 */
export enum ErrorSource {
  PRODUCER = 'producer',       // Errors from the event producer
  CONSUMER = 'consumer',       // Errors from the event consumer
  SERIALIZATION = 'serialization', // Errors during message serialization/deserialization
  VALIDATION = 'validation',   // Errors during schema validation
  PROCESSING = 'processing',   // Errors during event processing logic
  EXTERNAL = 'external',       // Errors from external dependencies
  NETWORK = 'network',         // Network-related errors
  DATABASE = 'database',       // Database-related errors
}

/**
 * Retry policy types for configuring how errors are retried in tests.
 */
export enum RetryPolicyType {
  NONE = 'none',               // No retries
  CONSTANT = 'constant',       // Constant interval between retries
  EXPONENTIAL = 'exponential', // Exponential backoff between retries
  LINEAR = 'linear',           // Linear increase in delay between retries
  CUSTOM = 'custom',           // Custom retry logic
}

/**
 * Interface for configuring retry policies in tests.
 */
export interface RetryPolicyConfig {
  type: RetryPolicyType;       // Type of retry policy
  maxRetries: number;          // Maximum number of retry attempts
  initialDelay?: number;       // Initial delay in milliseconds
  maxDelay?: number;           // Maximum delay in milliseconds
  factor?: number;             // Multiplier for exponential backoff
  jitter?: boolean;            // Whether to add random jitter to delays
  customLogic?: (attempt: number, error: Error, context: any) => number; // Custom delay calculation
}

/**
 * Interface for error state persistence in tests.
 */
export interface ErrorState {
  errorCode: string;           // Error code from ERROR_CODES
  message: string;             // Error message
  severity: ErrorSeverity;     // Error severity level
  source: ErrorSource;         // Error source
  timestamp: Date;             // When the error occurred
  retryCount: number;          // Current retry count
  maxRetries: number;          // Maximum retry attempts
  lastRetryTimestamp?: Date;   // When the last retry occurred
  nextRetryTimestamp?: Date;   // When the next retry is scheduled
  context: any;                // Additional context for the error
  resolved: boolean;           // Whether the error has been resolved
  sentToDlq: boolean;          // Whether the error was sent to DLQ
}

/**
 * Interface for configuring error behavior in tests.
 */
export interface ErrorBehaviorConfig {
  errorCode: string;           // Error code from ERROR_CODES
  message?: string;            // Custom error message (defaults to ERROR_MESSAGES)
  severity: ErrorSeverity;     // Error severity level
  source: ErrorSource;         // Error source
  retryPolicy: RetryPolicyConfig; // Retry policy configuration
  failureRate?: number;        // Probability of failure (0-1)
  failureCount?: number;       // Number of consecutive failures before success
  resolveAfter?: number;       // Automatically resolve after N attempts
  sendToDlq?: boolean;         // Whether to send to DLQ on max retries
  transitionStates?: Array<{ // State transitions for testing recovery paths
    afterAttempts: number;     // After how many attempts to transition
    to: {
      errorCode?: string;      // New error code
      severity?: ErrorSeverity; // New severity
      failureRate?: number;    // New failure rate
      resolved?: boolean;      // Whether to resolve the error
    };
  }>;
}

/**
 * Interface for DLQ message in tests.
 */
export interface DlqMessage {
  originalMessage: any;         // Original event message
  errorState: ErrorState;       // Error state that caused the DLQ
  metadata: {
    topic: string;             // Original topic
    partition: number;          // Original partition
    offset: number;             // Original offset
    timestamp: Date;            // When sent to DLQ
    retryCount: number;         // How many retries were attempted
    processingTime: number;     // Total processing time in ms
  };
}

/**
 * Mock error handler for testing error scenarios in event processing.
 * 
 * This class provides a configurable framework for simulating various error conditions,
 * retry policies, and recovery mechanisms without triggering actual failures.
 */
export class MockErrorHandler {
  private errorBehaviors: Map<string, ErrorBehaviorConfig> = new Map();
  private errorStates: Map<string, ErrorState> = new Map();
  private dlqMessages: DlqMessage[] = [];
  private defaultRetryPolicy: RetryPolicyConfig = {
    type: RetryPolicyType.EXPONENTIAL,
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    factor: 2,
    jitter: true,
  };
  private eventIdCounter = 0;

  /**
   * Creates a new MockErrorHandler instance.
   * 
   * @param defaultBehaviors - Optional default error behaviors to configure
   */
  constructor(defaultBehaviors?: ErrorBehaviorConfig[]) {
    if (defaultBehaviors) {
      defaultBehaviors.forEach(behavior => this.addErrorBehavior(behavior));
    }
  }

  /**
   * Adds a new error behavior configuration for testing.
   * 
   * @param behavior - The error behavior configuration
   * @returns The MockErrorHandler instance for chaining
   */
  public addErrorBehavior(behavior: ErrorBehaviorConfig): MockErrorHandler {
    const fullBehavior = {
      ...behavior,
      message: behavior.message || ERROR_MESSAGES[behavior.errorCode] || 'Unknown error',
      failureRate: behavior.failureRate ?? 1, // Default to always fail
      sendToDlq: behavior.sendToDlq ?? true,  // Default to sending to DLQ
    };
    this.errorBehaviors.set(behavior.errorCode, fullBehavior);
    return this;
  }

  /**
   * Removes an error behavior configuration.
   * 
   * @param errorCode - The error code to remove
   * @returns The MockErrorHandler instance for chaining
   */
  public removeErrorBehavior(errorCode: string): MockErrorHandler {
    this.errorBehaviors.delete(errorCode);
    return this;
  }

  /**
   * Clears all error behaviors.
   * 
   * @returns The MockErrorHandler instance for chaining
   */
  public clearErrorBehaviors(): MockErrorHandler {
    this.errorBehaviors.clear();
    return this;
  }

  /**
   * Sets the default retry policy for all errors that don't specify one.
   * 
   * @param policy - The retry policy configuration
   * @returns The MockErrorHandler instance for chaining
   */
  public setDefaultRetryPolicy(policy: RetryPolicyConfig): MockErrorHandler {
    this.defaultRetryPolicy = policy;
    return this;
  }

  /**
   * Simulates processing an event with potential errors based on configured behaviors.
   * 
   * @param eventType - The type of event being processed
   * @param payload - The event payload
   * @param context - Additional context for error handling
   * @returns A promise that resolves with the processing result or rejects with an error
   */
  public async processEvent<T>(eventType: string, payload: any, context: any = {}): Promise<T> {
    const eventId = `${eventType}-${this.eventIdCounter++}`;
    const errorCode = this.selectErrorCode(eventType, context);
    
    // If no error code selected, process successfully
    if (!errorCode) {
      return payload as T;
    }
    
    const behavior = this.errorBehaviors.get(errorCode);
    if (!behavior) {
      return payload as T; // No behavior configured, process successfully
    }
    
    // Get or create error state
    let errorState = this.errorStates.get(eventId);
    if (!errorState) {
      errorState = this.createErrorState(eventId, errorCode, behavior, context);
      this.errorStates.set(eventId, errorState);
    }
    
    // Check if we should fail based on failure rate
    if (Math.random() > behavior.failureRate) {
      this.resolveError(eventId);
      return payload as T;
    }
    
    // Check if we've reached failureCount (if specified)
    if (behavior.failureCount !== undefined && errorState.retryCount >= behavior.failureCount) {
      this.resolveError(eventId);
      return payload as T;
    }
    
    // Check if we should resolve after specific attempts
    if (behavior.resolveAfter !== undefined && errorState.retryCount >= behavior.resolveAfter) {
      this.resolveError(eventId);
      return payload as T;
    }
    
    // Check for state transitions
    this.checkStateTransitions(eventId, errorState, behavior);
    
    // If resolved, return success
    if (errorState.resolved) {
      return payload as T;
    }
    
    // Check if max retries exceeded
    if (errorState.retryCount >= errorState.maxRetries) {
      if (behavior.sendToDlq) {
        this.sendToDlq(eventId, payload, errorState);
      }
      throw this.createError(errorState);
    }
    
    // Increment retry count and update timestamps
    errorState.retryCount++;
    errorState.lastRetryTimestamp = new Date();
    
    // Calculate next retry timestamp
    const delay = this.calculateRetryDelay(errorState, behavior.retryPolicy);
    errorState.nextRetryTimestamp = new Date(Date.now() + delay);
    
    // Throw error for this attempt
    throw this.createError(errorState);
  }

  /**
   * Resolves an error state, marking it as successful.
   * 
   * @param eventId - The event ID to resolve
   * @returns The MockErrorHandler instance for chaining
   */
  public resolveError(eventId: string): MockErrorHandler {
    const errorState = this.errorStates.get(eventId);
    if (errorState) {
      errorState.resolved = true;
    }
    return this;
  }

  /**
   * Gets the current error state for an event.
   * 
   * @param eventId - The event ID to get state for
   * @returns The error state or undefined if not found
   */
  public getErrorState(eventId: string): ErrorState | undefined {
    return this.errorStates.get(eventId);
  }

  /**
   * Gets all error states.
   * 
   * @returns A map of event IDs to error states
   */
  public getAllErrorStates(): Map<string, ErrorState> {
    return new Map(this.errorStates);
  }

  /**
   * Clears all error states.
   * 
   * @returns The MockErrorHandler instance for chaining
   */
  public clearErrorStates(): MockErrorHandler {
    this.errorStates.clear();
    return this;
  }

  /**
   * Gets all messages sent to the dead letter queue.
   * 
   * @returns An array of DLQ messages
   */
  public getDlqMessages(): DlqMessage[] {
    return [...this.dlqMessages];
  }

  /**
   * Clears all DLQ messages.
   * 
   * @returns The MockErrorHandler instance for chaining
   */
  public clearDlqMessages(): MockErrorHandler {
    this.dlqMessages = [];
    return this;
  }

  /**
   * Reprocesses a message from the DLQ.
   * 
   * @param index - The index of the DLQ message to reprocess
   * @returns A promise that resolves with the reprocessing result
   */
  public async reprocessDlqMessage<T>(index: number): Promise<T> {
    if (index < 0 || index >= this.dlqMessages.length) {
      throw new Error(`DLQ message index ${index} out of bounds`);
    }
    
    const dlqMessage = this.dlqMessages[index];
    const eventType = dlqMessage.metadata.topic;
    const payload = dlqMessage.originalMessage;
    
    // Reset error state for this event
    const eventId = `${eventType}-reprocessed-${this.eventIdCounter++}`;
    this.errorStates.delete(eventId);
    
    // Remove from DLQ
    this.dlqMessages.splice(index, 1);
    
    // Try processing again
    return this.processEvent<T>(eventType, payload, { reprocessed: true });
  }

  /**
   * Creates a monitoring report of error handling statistics.
   * 
   * @returns An object with error monitoring statistics
   */
  public createMonitoringReport() {
    const totalErrors = this.errorStates.size;
    const resolvedErrors = Array.from(this.errorStates.values()).filter(state => state.resolved).length;
    const dlqMessages = this.dlqMessages.length;
    
    const errorsByCode = new Map<string, number>();
    const errorsBySeverity = new Map<ErrorSeverity, number>();
    const errorsBySource = new Map<ErrorSource, number>();
    
    for (const state of this.errorStates.values()) {
      // Count by error code
      const codeCount = errorsByCode.get(state.errorCode) || 0;
      errorsByCode.set(state.errorCode, codeCount + 1);
      
      // Count by severity
      const severityCount = errorsBySeverity.get(state.severity) || 0;
      errorsBySeverity.set(state.severity, severityCount + 1);
      
      // Count by source
      const sourceCount = errorsBySource.get(state.source) || 0;
      errorsBySource.set(state.source, sourceCount + 1);
    }
    
    return {
      totalErrors,
      resolvedErrors,
      unresolvedErrors: totalErrors - resolvedErrors,
      dlqMessages,
      errorsByCode: Object.fromEntries(errorsByCode),
      errorsBySeverity: Object.fromEntries(errorsBySeverity),
      errorsBySource: Object.fromEntries(errorsBySource),
      retryRate: totalErrors > 0 ? resolvedErrors / totalErrors : 0,
      dlqRate: totalErrors > 0 ? dlqMessages / totalErrors : 0,
    };
  }

  /**
   * Simulates an audit log entry for error handling.
   * 
   * @param eventId - The event ID to create an audit log for
   * @returns An audit log entry object
   */
  public createAuditLogEntry(eventId: string) {
    const errorState = this.errorStates.get(eventId);
    if (!errorState) {
      return null;
    }
    
    return {
      eventId,
      timestamp: new Date(),
      errorCode: errorState.errorCode,
      severity: errorState.severity,
      source: errorState.source,
      retryCount: errorState.retryCount,
      maxRetries: errorState.maxRetries,
      resolved: errorState.resolved,
      sentToDlq: errorState.sentToDlq,
      processingTime: errorState.lastRetryTimestamp
        ? errorState.lastRetryTimestamp.getTime() - errorState.timestamp.getTime()
        : 0,
      context: errorState.context,
    };
  }

  /**
   * Creates all audit log entries for error handling.
   * 
   * @returns An array of audit log entries
   */
  public createAllAuditLogEntries() {
    return Array.from(this.errorStates.keys())
      .map(eventId => this.createAuditLogEntry(eventId))
      .filter(entry => entry !== null);
  }

  // Private helper methods

  /**
   * Selects an error code based on event type and context.
   * 
   * @param eventType - The type of event being processed
   * @param context - Additional context for error selection
   * @returns An error code or undefined if no error should occur
   */
  private selectErrorCode(eventType: string, context: any): string | undefined {
    // If context specifies an error code, use that
    if (context.errorCode && this.errorBehaviors.has(context.errorCode)) {
      return context.errorCode;
    }
    
    // If context specifies an error source, find a matching error
    if (context.errorSource) {
      for (const [code, behavior] of this.errorBehaviors.entries()) {
        if (behavior.source === context.errorSource) {
          return code;
        }
      }
    }
    
    // If context specifies a journey, find a relevant error
    if (context.journey) {
      // This is a simplified example - in a real implementation,
      // you would have more sophisticated mapping of journeys to error types
      const journeyErrorMap: Record<string, string> = {
        health: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        care: ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        plan: ERROR_CODES.PRODUCER_SEND_FAILED,
      };
      
      const errorCode = journeyErrorMap[context.journey];
      if (errorCode && this.errorBehaviors.has(errorCode)) {
        return errorCode;
      }
    }
    
    // If context specifies forceError=true, pick a random error
    if (context.forceError) {
      const errorCodes = Array.from(this.errorBehaviors.keys());
      if (errorCodes.length > 0) {
        return errorCodes[Math.floor(Math.random() * errorCodes.length)];
      }
    }
    
    // Default: no error
    return undefined;
  }

  /**
   * Creates a new error state for an event.
   * 
   * @param eventId - The event ID
   * @param errorCode - The error code
   * @param behavior - The error behavior configuration
   * @param context - Additional context for the error
   * @returns A new error state object
   */
  private createErrorState(
    eventId: string,
    errorCode: string,
    behavior: ErrorBehaviorConfig,
    context: any
  ): ErrorState {
    return {
      errorCode,
      message: behavior.message || ERROR_MESSAGES[errorCode] || 'Unknown error',
      severity: behavior.severity,
      source: behavior.source,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: behavior.retryPolicy.maxRetries,
      context: { ...context, eventId },
      resolved: false,
      sentToDlq: false,
    };
  }

  /**
   * Creates an Error object from an error state.
   * 
   * @param errorState - The error state
   * @returns An Error object
   */
  private createError(errorState: ErrorState): Error {
    const error = new Error(errorState.message);
    (error as any).code = errorState.errorCode;
    (error as any).severity = errorState.severity;
    (error as any).source = errorState.source;
    (error as any).retryCount = errorState.retryCount;
    (error as any).maxRetries = errorState.maxRetries;
    (error as any).context = errorState.context;
    return error;
  }

  /**
   * Calculates the delay before the next retry attempt.
   * 
   * @param errorState - The current error state
   * @param retryPolicy - The retry policy configuration
   * @returns The delay in milliseconds
   */
  private calculateRetryDelay(errorState: ErrorState, retryPolicy: RetryPolicyConfig): number {
    const policy = retryPolicy || this.defaultRetryPolicy;
    const attempt = errorState.retryCount;
    
    switch (policy.type) {
      case RetryPolicyType.NONE:
        return 0;
        
      case RetryPolicyType.CONSTANT:
        return policy.initialDelay || 1000;
        
      case RetryPolicyType.LINEAR:
        const linearDelay = (policy.initialDelay || 1000) * (attempt + 1);
        return Math.min(linearDelay, policy.maxDelay || Infinity);
        
      case RetryPolicyType.EXPONENTIAL:
        const factor = policy.factor || 2;
        const initialDelay = policy.initialDelay || 100;
        let exponentialDelay = initialDelay * Math.pow(factor, attempt);
        
        // Add jitter if configured
        if (policy.jitter) {
          const jitterFactor = 0.5 + Math.random();
          exponentialDelay *= jitterFactor;
        }
        
        return Math.min(exponentialDelay, policy.maxDelay || Infinity);
        
      case RetryPolicyType.CUSTOM:
        if (policy.customLogic) {
          return policy.customLogic(attempt, this.createError(errorState), errorState.context);
        }
        return policy.initialDelay || 1000;
        
      default:
        return 1000; // Default fallback
    }
  }

  /**
   * Checks for and applies state transitions based on retry count.
   * 
   * @param eventId - The event ID
   * @param errorState - The current error state
   * @param behavior - The error behavior configuration
   */
  private checkStateTransitions(
    eventId: string,
    errorState: ErrorState,
    behavior: ErrorBehaviorConfig
  ): void {
    if (!behavior.transitionStates || behavior.transitionStates.length === 0) {
      return;
    }
    
    for (const transition of behavior.transitionStates) {
      if (errorState.retryCount === transition.afterAttempts) {
        // Apply transitions
        if (transition.to.errorCode) {
          errorState.errorCode = transition.to.errorCode;
          errorState.message = ERROR_MESSAGES[transition.to.errorCode] || errorState.message;
        }
        
        if (transition.to.severity) {
          errorState.severity = transition.to.severity;
        }
        
        if (transition.to.resolved !== undefined) {
          errorState.resolved = transition.to.resolved;
        }
        
        // If behavior has a new failure rate, update the behavior
        if (transition.to.failureRate !== undefined) {
          const updatedBehavior = { ...behavior, failureRate: transition.to.failureRate };
          this.errorBehaviors.set(errorState.errorCode, updatedBehavior);
        }
        
        break; // Only apply the first matching transition
      }
    }
  }

  /**
   * Sends a failed event to the dead letter queue.
   * 
   * @param eventId - The event ID
   * @param payload - The original event payload
   * @param errorState - The current error state
   */
  private sendToDlq(eventId: string, payload: any, errorState: ErrorState): void {
    errorState.sentToDlq = true;
    
    const dlqMessage: DlqMessage = {
      originalMessage: payload,
      errorState: { ...errorState },
      metadata: {
        topic: eventId.split('-')[0], // Extract topic from eventId
        partition: Math.floor(Math.random() * 10), // Mock partition
        offset: Math.floor(Math.random() * 10000), // Mock offset
        timestamp: new Date(),
        retryCount: errorState.retryCount,
        processingTime: errorState.lastRetryTimestamp
          ? errorState.lastRetryTimestamp.getTime() - errorState.timestamp.getTime()
          : 0,
      },
    };
    
    this.dlqMessages.push(dlqMessage);
  }
}

/**
 * Creates a pre-configured MockErrorHandler with common error scenarios.
 * 
 * @returns A configured MockErrorHandler instance
 */
export function createDefaultMockErrorHandler(): MockErrorHandler {
  return new MockErrorHandler([
    // Validation error with exponential backoff
    {
      errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.VALIDATION,
      retryPolicy: {
        type: RetryPolicyType.EXPONENTIAL,
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
      },
      failureRate: 1,
      resolveAfter: 2, // Resolve after 2 retries
    },
    
    // Network error with linear backoff
    {
      errorCode: ERROR_CODES.PRODUCER_CONNECTION_FAILED,
      severity: ErrorSeverity.HIGH,
      source: ErrorSource.NETWORK,
      retryPolicy: {
        type: RetryPolicyType.LINEAR,
        maxRetries: 5,
        initialDelay: 500,
        maxDelay: 10000,
      },
      // Transition to success after 3 attempts
      transitionStates: [
        {
          afterAttempts: 3,
          to: {
            failureRate: 0, // Stop failing
            resolved: true,
          },
        },
      ],
    },
    
    // Processing error that always fails and goes to DLQ
    {
      errorCode: ERROR_CODES.CONSUMER_PROCESSING_FAILED,
      severity: ErrorSeverity.FATAL,
      source: ErrorSource.PROCESSING,
      retryPolicy: {
        type: RetryPolicyType.CONSTANT,
        maxRetries: 2,
        initialDelay: 1000,
      },
      sendToDlq: true,
    },
    
    // Transient error that changes type after retries
    {
      errorCode: ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERIALIZATION,
      retryPolicy: {
        type: RetryPolicyType.EXPONENTIAL,
        maxRetries: 4,
        initialDelay: 200,
        factor: 1.5,
      },
      transitionStates: [
        {
          afterAttempts: 2,
          to: {
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            severity: ErrorSeverity.LOW,
          },
        },
      ],
    },
  ]);
}

/**
 * Creates a mock error handler configured for testing dead letter queue functionality.
 * 
 * @returns A configured MockErrorHandler instance
 */
export function createDlqTestErrorHandler(): MockErrorHandler {
  return new MockErrorHandler([
    // Error that always goes to DLQ after max retries
    {
      errorCode: ERROR_CODES.RETRY_EXHAUSTED,
      severity: ErrorSeverity.HIGH,
      source: ErrorSource.PROCESSING,
      retryPolicy: {
        type: RetryPolicyType.EXPONENTIAL,
        maxRetries: 3,
        initialDelay: 100,
        factor: 2,
      },
      sendToDlq: true,
    },
    
    // Error that immediately goes to DLQ without retries
    {
      errorCode: ERROR_CODES.DLQ_SEND_FAILED,
      severity: ErrorSeverity.FATAL,
      source: ErrorSource.EXTERNAL,
      retryPolicy: {
        type: RetryPolicyType.NONE,
        maxRetries: 0,
      },
      sendToDlq: true,
    },
  ]);
}

/**
 * Creates a mock error handler configured for testing retry policies.
 * 
 * @returns A configured MockErrorHandler instance
 */
export function createRetryTestErrorHandler(): MockErrorHandler {
  return new MockErrorHandler([
    // Exponential backoff
    {
      errorCode: ERROR_CODES.PRODUCER_SEND_FAILED,
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.PRODUCER,
      retryPolicy: {
        type: RetryPolicyType.EXPONENTIAL,
        maxRetries: 5,
        initialDelay: 100,
        maxDelay: 10000,
        factor: 2,
        jitter: true,
      },
      resolveAfter: 4, // Resolve after 4 retries
    },
    
    // Linear backoff
    {
      errorCode: ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED,
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.CONSUMER,
      retryPolicy: {
        type: RetryPolicyType.LINEAR,
        maxRetries: 5,
        initialDelay: 200,
        maxDelay: 5000,
      },
      resolveAfter: 3, // Resolve after 3 retries
    },
    
    // Constant backoff
    {
      errorCode: ERROR_CODES.SCHEMA_NOT_FOUND,
      severity: ErrorSeverity.LOW,
      source: ErrorSource.VALIDATION,
      retryPolicy: {
        type: RetryPolicyType.CONSTANT,
        maxRetries: 3,
        initialDelay: 500,
      },
      resolveAfter: 2, // Resolve after 2 retries
    },
    
    // Custom backoff
    {
      errorCode: ERROR_CODES.MESSAGE_SERIALIZATION_FAILED,
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERIALIZATION,
      retryPolicy: {
        type: RetryPolicyType.CUSTOM,
        maxRetries: 4,
        customLogic: (attempt, error, context) => {
          // Example: Fibonacci sequence for delays
          const fibonacci = (n: number): number => {
            if (n <= 1) return n;
            return fibonacci(n - 1) + fibonacci(n - 2);
          };
          return fibonacci(attempt + 2) * 100; // 100, 200, 300, 500, 800, 1300, ...
        },
      },
      resolveAfter: 3, // Resolve after 3 retries
    },
  ]);
}

/**
 * Creates a mock error handler configured for testing state transitions.
 * 
 * @returns A configured MockErrorHandler instance
 */
export function createTransitionTestErrorHandler(): MockErrorHandler {
  return new MockErrorHandler([
    // Error that transitions through multiple states
    {
      errorCode: ERROR_CODES.CONSUMER_PROCESSING_FAILED,
      severity: ErrorSeverity.HIGH,
      source: ErrorSource.PROCESSING,
      retryPolicy: {
        type: RetryPolicyType.EXPONENTIAL,
        maxRetries: 6,
        initialDelay: 100,
        factor: 2,
      },
      transitionStates: [
        {
          afterAttempts: 1,
          to: {
            severity: ErrorSeverity.MEDIUM,
            failureRate: 0.8, // 80% chance of failure
          },
        },
        {
          afterAttempts: 3,
          to: {
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            severity: ErrorSeverity.LOW,
            failureRate: 0.5, // 50% chance of failure
          },
        },
        {
          afterAttempts: 5,
          to: {
            resolved: true, // Force resolution
          },
        },
      ],
    },
  ]);
}