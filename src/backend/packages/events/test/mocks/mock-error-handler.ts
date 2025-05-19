import { EventErrorType, EventProcessingError, EventValidationError } from '../../src/errors/event-errors';
import { RetryPolicy, RetryDecision } from '../../src/errors/retry-policies';
import { DLQProducer } from '../../src/errors/dlq';
import { IEvent } from '../../src/interfaces/base-event.interface';

/**
 * Configuration options for the MockErrorHandler
 */
export interface MockErrorHandlerConfig {
  /** Whether to simulate errors during event processing */
  shouldError?: boolean;
  /** The type of error to simulate */
  errorType?: EventErrorType;
  /** The error message to use */
  errorMessage?: string;
  /** The maximum number of retries before permanent failure */
  maxRetries?: number;
  /** Whether to simulate transient errors that resolve after retries */
  isTransient?: boolean;
  /** Number of failures before success (for testing recovery) */
  failureCount?: number;
  /** Whether to send failed events to DLQ */
  useDLQ?: boolean;
  /** Custom function to determine if an event should error */
  errorPredicate?: (event: IEvent) => boolean;
  /** Delay between retries in ms (can be a function for exponential backoff) */
  retryDelay?: number | ((attempt: number) => number);
  /** Whether to track and persist error states between calls */
  persistErrorState?: boolean;
  /** Journey to associate with the error */
  journey?: 'health' | 'care' | 'plan' | 'common';
  /** Severity level of the error */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Tracks the state of event processing for testing error scenarios
 */
interface EventErrorState {
  /** The event ID */
  eventId: string;
  /** Number of times this event has been retried */
  retryCount: number;
  /** Whether this event has been sent to DLQ */
  sentToDLQ: boolean;
  /** Timestamp of the first error */
  firstErrorTimestamp: number;
  /** Timestamp of the last retry attempt */
  lastRetryTimestamp: number;
  /** Whether the event has been successfully processed after retries */
  recovered: boolean;
}

/**
 * A configurable mock error handler for testing error scenarios in event processing.
 * 
 * This mock allows tests to simulate various error conditions, retry policies, and recovery
 * mechanisms without triggering actual failures. It provides fine-grained control over
 * error types, frequencies, and behaviors.
 */
export class MockErrorHandler {
  private config: MockErrorHandlerConfig;
  private errorStates: Map<string, EventErrorState> = new Map();
  private mockDLQProducer: MockDLQProducer;
  private mockRetryPolicy: MockRetryPolicy;
  
  /**
   * Creates a new MockErrorHandler with the specified configuration
   * 
   * @param config - Configuration options for error simulation
   */
  constructor(config: MockErrorHandlerConfig = {}) {
    this.config = {
      shouldError: false,
      errorType: EventErrorType.PROCESSING,
      errorMessage: 'Simulated event processing error',
      maxRetries: 3,
      isTransient: true,
      failureCount: 1,
      useDLQ: true,
      retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000), // Exponential backoff with 30s max
      persistErrorState: true,
      journey: 'common',
      severity: 'medium',
      ...config
    };
    
    this.mockDLQProducer = new MockDLQProducer();
    this.mockRetryPolicy = new MockRetryPolicy(this.config);
  }
  
  /**
   * Reconfigures the error handler with new settings
   * 
   * @param config - New configuration options to apply
   */
  public reconfigure(config: Partial<MockErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
    this.mockRetryPolicy.reconfigure(this.config);
  }
  
  /**
   * Clears all stored error states
   */
  public resetErrorStates(): void {
    this.errorStates.clear();
  }
  
  /**
   * Simulates processing an event with potential errors based on configuration
   * 
   * @param event - The event to process
   * @returns A promise that resolves when processing is complete or rejects with an error
   */
  public async processEvent<T extends IEvent>(event: T): Promise<T> {
    // Get or initialize error state for this event
    let errorState = this.getErrorState(event);
    
    // Check if we should simulate an error for this event
    if (this.shouldErrorOccur(event, errorState)) {
      // Increment retry count
      errorState.retryCount++;
      errorState.lastRetryTimestamp = Date.now();
      
      // Create the appropriate error
      const error = this.createError(event);
      
      // Get retry decision
      const retryDecision = this.mockRetryPolicy.getRetryDecision(error, errorState.retryCount);
      
      // Update error state
      if (this.config.persistErrorState) {
        this.errorStates.set(event.eventId, errorState);
      }
      
      // Handle based on retry decision
      if (retryDecision.shouldRetry) {
        // If we've reached the configured failure count, simulate recovery
        if (errorState.retryCount >= this.config.failureCount && this.config.isTransient) {
          errorState.recovered = true;
          if (this.config.persistErrorState) {
            this.errorStates.set(event.eventId, errorState);
          }
          return event;
        }
        
        // Otherwise throw the error for retry
        throw error;
      } else {
        // Send to DLQ if configured
        if (this.config.useDLQ) {
          await this.mockDLQProducer.sendToDLQ(event, error, errorState.retryCount);
          errorState.sentToDLQ = true;
          if (this.config.persistErrorState) {
            this.errorStates.set(event.eventId, errorState);
          }
        }
        
        // Throw the error
        throw error;
      }
    }
    
    // No error, return the event
    return event;
  }
  
  /**
   * Gets the current error state for an event, or creates a new one
   * 
   * @param event - The event to get state for
   * @returns The current error state
   */
  private getErrorState(event: IEvent): EventErrorState {
    if (this.config.persistErrorState && this.errorStates.has(event.eventId)) {
      return this.errorStates.get(event.eventId);
    }
    
    return {
      eventId: event.eventId,
      retryCount: 0,
      sentToDLQ: false,
      firstErrorTimestamp: Date.now(),
      lastRetryTimestamp: Date.now(),
      recovered: false
    };
  }
  
  /**
   * Determines if an error should occur for the given event
   * 
   * @param event - The event to check
   * @param errorState - The current error state
   * @returns Whether an error should occur
   */
  private shouldErrorOccur(event: IEvent, errorState: EventErrorState): boolean {
    // If we have a custom predicate, use it
    if (this.config.errorPredicate) {
      return this.config.errorPredicate(event);
    }
    
    // If we're configured to not error, return false
    if (!this.config.shouldError) {
      return false;
    }
    
    // If this is a transient error and we've already recovered, don't error
    if (this.config.isTransient && errorState.recovered) {
      return false;
    }
    
    // Otherwise, error based on configuration
    return true;
  }
  
  /**
   * Creates an appropriate error based on configuration
   * 
   * @param event - The event that triggered the error
   * @returns The created error
   */
  private createError(event: IEvent): EventProcessingError | EventValidationError {
    const errorContext = {
      eventId: event.eventId,
      eventType: event.type,
      source: event.source,
      journey: this.config.journey,
      severity: this.config.severity,
      timestamp: new Date().toISOString(),
    };
    
    if (this.config.errorType === EventErrorType.VALIDATION) {
      return new EventValidationError(
        this.config.errorMessage,
        errorContext,
        { field: 'payload', message: 'Invalid payload format' }
      );
    } else {
      return new EventProcessingError(
        this.config.errorMessage,
        errorContext,
        this.config.errorType
      );
    }
  }
  
  /**
   * Gets the mock DLQ producer for inspection in tests
   */
  public getDLQProducer(): MockDLQProducer {
    return this.mockDLQProducer;
  }
  
  /**
   * Gets the mock retry policy for inspection in tests
   */
  public getRetryPolicy(): MockRetryPolicy {
    return this.mockRetryPolicy;
  }
  
  /**
   * Gets all current error states for inspection in tests
   */
  public getAllErrorStates(): Map<string, EventErrorState> {
    return new Map(this.errorStates);
  }
  
  /**
   * Gets the error state for a specific event
   * 
   * @param eventId - The ID of the event to get state for
   */
  public getErrorStateForEvent(eventId: string): EventErrorState | undefined {
    return this.errorStates.get(eventId);
  }
}

/**
 * Mock implementation of a Dead Letter Queue producer for testing
 */
export class MockDLQProducer implements DLQProducer {
  private dlqMessages: Array<{
    event: IEvent;
    error: Error;
    retryCount: number;
    timestamp: string;
  }> = [];
  
  /**
   * Sends an event to the mock Dead Letter Queue
   * 
   * @param event - The event that failed processing
   * @param error - The error that caused the failure
   * @param retryCount - The number of retry attempts made
   */
  public async sendToDLQ(event: IEvent, error: Error, retryCount: number): Promise<void> {
    this.dlqMessages.push({
      event,
      error,
      retryCount,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Gets all messages sent to the DLQ for inspection in tests
   */
  public getMessages(): Array<{
    event: IEvent;
    error: Error;
    retryCount: number;
    timestamp: string;
  }> {
    return [...this.dlqMessages];
  }
  
  /**
   * Clears all DLQ messages
   */
  public clearMessages(): void {
    this.dlqMessages = [];
  }
  
  /**
   * Gets messages for a specific event ID
   * 
   * @param eventId - The ID of the event to filter by
   */
  public getMessagesForEvent(eventId: string): Array<{
    event: IEvent;
    error: Error;
    retryCount: number;
    timestamp: string;
  }> {
    return this.dlqMessages.filter(msg => msg.event.eventId === eventId);
  }
}

/**
 * Mock implementation of a retry policy for testing
 */
export class MockRetryPolicy implements RetryPolicy {
  private config: MockErrorHandlerConfig;
  
  /**
   * Creates a new MockRetryPolicy with the specified configuration
   * 
   * @param config - Configuration options for retry behavior
   */
  constructor(config: MockErrorHandlerConfig) {
    this.config = config;
  }
  
  /**
   * Reconfigures the retry policy with new settings
   * 
   * @param config - New configuration options to apply
   */
  public reconfigure(config: MockErrorHandlerConfig): void {
    this.config = config;
  }
  
  /**
   * Determines whether to retry processing an event after an error
   * 
   * @param error - The error that occurred
   * @param attemptNumber - The current retry attempt number
   * @returns A decision object with retry information
   */
  public getRetryDecision(error: Error, attemptNumber: number): RetryDecision {
    // If we've exceeded max retries, don't retry
    if (attemptNumber >= this.config.maxRetries) {
      return {
        shouldRetry: false,
        reason: 'MAX_RETRIES_EXCEEDED',
        nextRetryDelayMs: 0
      };
    }
    
    // If this is a non-transient error, don't retry
    if (!this.config.isTransient) {
      return {
        shouldRetry: false,
        reason: 'NON_RETRYABLE_ERROR',
        nextRetryDelayMs: 0
      };
    }
    
    // Calculate retry delay
    let nextRetryDelayMs: number;
    if (typeof this.config.retryDelay === 'function') {
      nextRetryDelayMs = this.config.retryDelay(attemptNumber);
    } else {
      nextRetryDelayMs = this.config.retryDelay;
    }
    
    // Return retry decision
    return {
      shouldRetry: true,
      reason: 'TRANSIENT_ERROR',
      nextRetryDelayMs
    };
  }
}