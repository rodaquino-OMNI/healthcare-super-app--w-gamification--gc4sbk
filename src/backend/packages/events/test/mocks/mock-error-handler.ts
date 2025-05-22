/**
 * @file mock-error-handler.ts
 * @description Implements a configurable error handling framework for testing error scenarios in event processing.
 * This mock allows tests to simulate various error conditions, retry policies, and recovery mechanisms
 * without triggering actual failures. It provides fine-grained control over error types, frequencies,
 * and behaviors, making it ideal for testing resilience and recovery logic.
 */

import { EventErrorCategory, EventException, EventProcessingStage } from '../../src/errors/event-errors';
import { IEventHandler, EventHandlerContext, EventHandlerOptions } from '../../src/interfaces/event-handler.interface';
import { IEventResponse, createSuccessResponse, createErrorResponse } from '../../src/interfaces/event-response.interface';
import { ValidationResult } from '../../src/interfaces/event-validation.interface';
import { BaseEvent } from '../../src/interfaces/base-event.interface';

/**
 * Error simulation mode for the mock error handler
 */
export enum ErrorSimulationMode {
  /**
   * Never produce errors, always succeed
   */
  NEVER = 'never',
  
  /**
   * Always produce errors, always fail
   */
  ALWAYS = 'always',
  
  /**
   * Produce errors based on a percentage chance
   */
  PERCENTAGE = 'percentage',
  
  /**
   * Produce errors on specific event IDs or types
   */
  SELECTIVE = 'selective',
  
  /**
   * Produce errors on specific retry attempts
   */
  RETRY_COUNT = 'retry_count',
  
  /**
   * Produce errors based on a pattern (e.g., every Nth event)
   */
  PATTERN = 'pattern',
  
  /**
   * Transition between success and failure states
   */
  TRANSITION = 'transition'
}

/**
 * Retry strategy types for the mock error handler
 */
export enum RetryStrategyType {
  /**
   * Fixed delay between retry attempts
   */
  FIXED = 'fixed',
  
  /**
   * Exponential backoff with optional jitter
   */
  EXPONENTIAL = 'exponential',
  
  /**
   * Linear backoff (increases by a fixed amount each retry)
   */
  LINEAR = 'linear',
  
  /**
   * Custom retry strategy defined by a function
   */
  CUSTOM = 'custom'
}

/**
 * Configuration for the retry strategy
 */
export interface RetryStrategyConfig {
  /**
   * Type of retry strategy to use
   */
  type: RetryStrategyType;
  
  /**
   * Base delay in milliseconds
   */
  baseDelayMs: number;
  
  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs: number;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Whether to add jitter to the delay
   */
  withJitter?: boolean;
  
  /**
   * Multiplier for exponential backoff
   */
  multiplier?: number;
  
  /**
   * Increment for linear backoff
   */
  increment?: number;
  
  /**
   * Custom function for calculating retry delay
   */
  customDelayFn?: (retryCount: number, baseDelay: number) => number;
}

/**
 * Configuration for the dead letter queue simulation
 */
export interface DLQConfig {
  /**
   * Whether to enable DLQ simulation
   */
  enabled: boolean;
  
  /**
   * Maximum number of retries before sending to DLQ
   */
  maxRetries: number;
  
  /**
   * Whether to track DLQ events
   */
  trackEvents: boolean;
  
  /**
   * Whether to allow reprocessing from DLQ
   */
  allowReprocessing: boolean;
  
  /**
   * Callback function when an event is sent to DLQ
   */
  onSendToDLQ?: (event: any, error: Error, retryCount: number) => void;
}

/**
 * Configuration for error transitions
 */
export interface ErrorTransitionConfig {
  /**
   * Initial state (success or failure)
   */
  initialState: 'success' | 'failure';
  
  /**
   * Number of operations before transitioning to the opposite state
   */
  transitionAfter: number;
  
  /**
   * Whether to cycle between states
   */
  cycle: boolean;
  
  /**
   * Custom transition function
   */
  transitionFn?: (currentState: 'success' | 'failure', operationCount: number) => 'success' | 'failure';
}

/**
 * Configuration for selective error simulation
 */
export interface SelectiveErrorConfig {
  /**
   * Event IDs that should fail
   */
  eventIds?: string[];
  
  /**
   * Event types that should fail
   */
  eventTypes?: string[];
  
  /**
   * User IDs that should fail
   */
  userIds?: string[];
  
  /**
   * Custom predicate function for determining failure
   */
  predicate?: (event: any) => boolean;
}

/**
 * Configuration for pattern-based error simulation
 */
export interface PatternErrorConfig {
  /**
   * Fail every Nth event
   */
  failEveryN?: number;
  
  /**
   * Fail events at specific indices
   */
  failAtIndices?: number[];
  
  /**
   * Custom pattern function
   */
  patternFn?: (index: number) => boolean;
}

/**
 * Configuration for the mock error handler
 */
export interface MockErrorHandlerConfig<T = any> {
  /**
   * Event type this handler processes
   */
  eventType: string;
  
  /**
   * Error simulation mode
   */
  errorMode: ErrorSimulationMode;
  
  /**
   * Percentage chance of error (0-100) when using PERCENTAGE mode
   */
  errorPercentage?: number;
  
  /**
   * Configuration for selective error simulation
   */
  selectiveErrors?: SelectiveErrorConfig;
  
  /**
   * Configuration for pattern-based error simulation
   */
  patternErrors?: PatternErrorConfig;
  
  /**
   * Configuration for retry-count-based error simulation
   */
  retryCountErrors?: {
    /**
     * Retry counts that should fail
     */
    failOnRetries: number[];
  };
  
  /**
   * Configuration for error transitions
   */
  transitionConfig?: ErrorTransitionConfig;
  
  /**
   * Retry strategy configuration
   */
  retryStrategy: RetryStrategyConfig;
  
  /**
   * Dead letter queue configuration
   */
  dlqConfig: DLQConfig;
  
  /**
   * Error category to simulate
   */
  errorCategory: EventErrorCategory;
  
  /**
   * Error code to use in simulated errors
   */
  errorCode: string;
  
  /**
   * Error message template to use in simulated errors
   */
  errorMessage: string;
  
  /**
   * Processing stage where the error occurs
   */
  processingStage: EventProcessingStage;
  
  /**
   * Whether to persist error states between calls
   */
  persistErrorStates: boolean;
  
  /**
   * Whether to track and log operations
   */
  enableAudit: boolean;
  
  /**
   * Custom success handler function
   */
  onSuccess?: (event: T, context?: EventHandlerContext) => any;
  
  /**
   * Custom error handler function
   */
  onError?: (event: T, error: Error, context?: EventHandlerContext) => void;
  
  /**
   * Handler priority
   */
  priority?: number;
}

/**
 * Entry in the dead letter queue
 */
export interface DLQEntry<T = any> {
  /**
   * The event that was sent to the DLQ
   */
  event: T;
  
  /**
   * The error that caused the event to be sent to the DLQ
   */
  error: Error;
  
  /**
   * Number of retry attempts before sending to DLQ
   */
  retryCount: number;
  
  /**
   * Timestamp when the event was sent to the DLQ
   */
  timestamp: string;
  
  /**
   * Whether the event has been reprocessed from the DLQ
   */
  reprocessed: boolean;
  
  /**
   * Result of reprocessing, if applicable
   */
  reprocessingResult?: IEventResponse;
}

/**
 * Audit log entry for the mock error handler
 */
export interface AuditLogEntry<T = any> {
  /**
   * Operation ID
   */
  operationId: string;
  
  /**
   * Event ID
   */
  eventId: string;
  
  /**
   * Event type
   */
  eventType: string;
  
  /**
   * Operation type
   */
  operation: 'handle' | 'canHandle' | 'retry' | 'dlq' | 'reprocess';
  
  /**
   * Operation result
   */
  result: 'success' | 'failure';
  
  /**
   * Error if operation failed
   */
  error?: Error;
  
  /**
   * Retry count if applicable
   */
  retryCount?: number;
  
  /**
   * Timestamp of the operation
   */
  timestamp: string;
  
  /**
   * Duration of the operation in milliseconds
   */
  durationMs: number;
  
  /**
   * Additional context
   */
  context?: Record<string, any>;
}

/**
 * Statistics for the mock error handler
 */
export interface ErrorHandlerStats {
  /**
   * Total number of events processed
   */
  totalEvents: number;
  
  /**
   * Number of successful events
   */
  successfulEvents: number;
  
  /**
   * Number of failed events
   */
  failedEvents: number;
  
  /**
   * Number of retry attempts
   */
  retryAttempts: number;
  
  /**
   * Number of events sent to DLQ
   */
  eventsInDLQ: number;
  
  /**
   * Number of events reprocessed from DLQ
   */
  reprocessedEvents: number;
  
  /**
   * Average processing time in milliseconds
   */
  avgProcessingTimeMs: number;
  
  /**
   * Error categories encountered
   */
  errorCategories: Record<EventErrorCategory, number>;
  
  /**
   * Processing stages where errors occurred
   */
  errorStages: Record<EventProcessingStage, number>;
}

/**
 * Mock implementation of an event handler for testing error scenarios.
 * Provides configurable error simulation, retry policies, and DLQ handling.
 */
export class MockErrorHandler<T = any, R = any> implements IEventHandler<T, R> {
  private config: MockErrorHandlerConfig<T>;
  private operationCount: number = 0;
  private currentState: 'success' | 'failure';
  private dlqEntries: Map<string, DLQEntry<T>> = new Map();
  private auditLog: AuditLogEntry<T>[] = [];
  private stats: ErrorHandlerStats;
  private eventIndex: number = 0;
  private errorStates: Map<string, boolean> = new Map();
  
  /**
   * Creates a new MockErrorHandler instance.
   * 
   * @param config - Configuration for the mock error handler
   */
  constructor(config: Partial<MockErrorHandlerConfig<T>>) {
    // Set default configuration
    this.config = {
      eventType: 'TEST_EVENT',
      errorMode: ErrorSimulationMode.NEVER,
      errorPercentage: 50,
      retryStrategy: {
        type: RetryStrategyType.EXPONENTIAL,
        baseDelayMs: 100,
        maxDelayMs: 10000,
        maxRetries: 3,
        withJitter: true,
        multiplier: 2
      },
      dlqConfig: {
        enabled: true,
        maxRetries: 3,
        trackEvents: true,
        allowReprocessing: true
      },
      errorCategory: EventErrorCategory.TRANSIENT,
      errorCode: 'TEST_ERROR',
      errorMessage: 'Simulated error for testing',
      processingStage: EventProcessingStage.PROCESSING,
      persistErrorStates: false,
      enableAudit: true,
      ...config
    };
    
    // Initialize state
    this.currentState = this.config.transitionConfig?.initialState || 'success';
    
    // Initialize stats
    this.stats = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      retryAttempts: 0,
      eventsInDLQ: 0,
      reprocessedEvents: 0,
      avgProcessingTimeMs: 0,
      errorCategories: {
        [EventErrorCategory.TRANSIENT]: 0,
        [EventErrorCategory.PERMANENT]: 0,
        [EventErrorCategory.RETRIABLE]: 0,
        [EventErrorCategory.MANUAL]: 0
      },
      errorStages: {
        [EventProcessingStage.VALIDATION]: 0,
        [EventProcessingStage.DESERIALIZATION]: 0,
        [EventProcessingStage.PROCESSING]: 0,
        [EventProcessingStage.PUBLISHING]: 0,
        [EventProcessingStage.PERSISTENCE]: 0
      }
    };
  }
  
  /**
   * Processes an event and returns a standardized response.
   * Simulates errors based on the configured error mode.
   * 
   * @param event - The event to process
   * @param context - Additional context information
   * @param options - Options for controlling the handling behavior
   * @returns A promise resolving to a standardized event response
   */
  async handle(event: T, context?: EventHandlerContext, options?: EventHandlerOptions): Promise<IEventResponse<R>> {
    const startTime = Date.now();
    const operationId = crypto.randomUUID();
    const retryCount = options?.retryCount || 0;
    const eventId = (event as any).eventId || 'unknown';
    const eventType = (event as any).type || this.config.eventType;
    
    // Update stats
    this.stats.totalEvents++;
    if (retryCount > 0) {
      this.stats.retryAttempts++;
    }
    
    // Update operation count
    this.operationCount++;
    this.eventIndex++;
    
    // Check if we should transition state
    this.updateTransitionState();
    
    // Determine if this operation should fail
    const shouldFail = this.shouldFail(event, retryCount);
    
    // If we have persistent error states, check or set the state for this event
    if (this.config.persistErrorStates) {
      const persistedState = this.errorStates.get(eventId);
      if (persistedState !== undefined) {
        // Use the persisted state
        const result = await this.createResponse(event, !persistedState, context, startTime, operationId);
        return result;
      } else if (shouldFail) {
        // Set the persisted state
        this.errorStates.set(eventId, true);
      }
    }
    
    // Create the response based on whether we should fail
    const result = await this.createResponse(event, !shouldFail, context, startTime, operationId);
    
    // Check if we should send to DLQ
    if (!result.success && this.config.dlqConfig.enabled && retryCount >= this.config.dlqConfig.maxRetries) {
      await this.sendToDLQ(event, new Error(result.error?.message || 'Unknown error'), retryCount);
    }
    
    return result;
  }
  
  /**
   * Determines whether this handler can process the given event.
   * 
   * @param event - The event to check
   * @param context - Additional context information
   * @returns A validation result indicating whether the handler can process the event
   */
  async canHandle(event: any, context?: EventHandlerContext): Promise<ValidationResult> {
    const startTime = Date.now();
    const operationId = crypto.randomUUID();
    const eventType = event.type || 'unknown';
    
    // Always return true for the configured event type
    const canHandle = eventType === this.config.eventType;
    
    // Log the operation
    if (this.config.enableAudit) {
      this.auditLog.push({
        operationId,
        eventId: event.eventId || 'unknown',
        eventType,
        operation: 'canHandle',
        result: canHandle ? 'success' : 'failure',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        context: { canHandle }
      });
    }
    
    return {
      isValid: canHandle,
      errors: canHandle ? [] : [{
        code: 'INVALID_EVENT_TYPE',
        message: `Handler can only process ${this.config.eventType} events, received ${eventType}`,
        path: 'type'
      }]
    };
  }
  
  /**
   * Returns the type of event this handler processes.
   * 
   * @returns The event type string
   */
  getEventType(): string {
    return this.config.eventType;
  }
  
  /**
   * Returns the priority of this handler.
   * 
   * @returns The handler priority
   */
  getPriority(): number {
    return this.config.priority || 0;
  }
  
  /**
   * Reprocesses an event from the dead letter queue.
   * 
   * @param eventId - ID of the event to reprocess
   * @returns The result of reprocessing, or null if the event is not in the DLQ
   */
  async reprocessFromDLQ(eventId: string): Promise<IEventResponse<R> | null> {
    if (!this.config.dlqConfig.allowReprocessing) {
      throw new Error('Reprocessing from DLQ is not allowed');
    }
    
    const dlqEntry = this.dlqEntries.get(eventId);
    if (!dlqEntry) {
      return null;
    }
    
    const startTime = Date.now();
    const operationId = crypto.randomUUID();
    
    // Mark as reprocessed
    dlqEntry.reprocessed = true;
    
    // Force success for reprocessing
    const result = await this.createResponse(dlqEntry.event, true, undefined, startTime, operationId);
    
    // Update stats
    this.stats.reprocessedEvents++;
    
    // Store the result
    dlqEntry.reprocessingResult = result;
    
    // Log the operation
    if (this.config.enableAudit) {
      this.auditLog.push({
        operationId,
        eventId,
        eventType: (dlqEntry.event as any).type || this.config.eventType,
        operation: 'reprocess',
        result: 'success',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime
      });
    }
    
    return result;
  }
  
  /**
   * Gets all events in the dead letter queue.
   * 
   * @returns Array of DLQ entries
   */
  getDLQEntries(): DLQEntry<T>[] {
    return Array.from(this.dlqEntries.values());
  }
  
  /**
   * Gets a specific event from the dead letter queue.
   * 
   * @param eventId - ID of the event to retrieve
   * @returns The DLQ entry, or null if not found
   */
  getDLQEntry(eventId: string): DLQEntry<T> | null {
    return this.dlqEntries.get(eventId) || null;
  }
  
  /**
   * Clears all events from the dead letter queue.
   */
  clearDLQ(): void {
    this.dlqEntries.clear();
    this.stats.eventsInDLQ = 0;
  }
  
  /**
   * Gets the audit log for this handler.
   * 
   * @returns Array of audit log entries
   */
  getAuditLog(): AuditLogEntry<T>[] {
    return this.auditLog;
  }
  
  /**
   * Clears the audit log.
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }
  
  /**
   * Gets statistics for this handler.
   * 
   * @returns Handler statistics
   */
  getStats(): ErrorHandlerStats {
    return { ...this.stats };
  }
  
  /**
   * Resets all statistics.
   */
  resetStats(): void {
    this.stats = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      retryAttempts: 0,
      eventsInDLQ: 0,
      reprocessedEvents: 0,
      avgProcessingTimeMs: 0,
      errorCategories: {
        [EventErrorCategory.TRANSIENT]: 0,
        [EventErrorCategory.PERMANENT]: 0,
        [EventErrorCategory.RETRIABLE]: 0,
        [EventErrorCategory.MANUAL]: 0
      },
      errorStages: {
        [EventProcessingStage.VALIDATION]: 0,
        [EventProcessingStage.DESERIALIZATION]: 0,
        [EventProcessingStage.PROCESSING]: 0,
        [EventProcessingStage.PUBLISHING]: 0,
        [EventProcessingStage.PERSISTENCE]: 0
      }
    };
  }
  
  /**
   * Resets the handler to its initial state.
   */
  reset(): void {
    this.operationCount = 0;
    this.eventIndex = 0;
    this.currentState = this.config.transitionConfig?.initialState || 'success';
    this.dlqEntries.clear();
    this.auditLog = [];
    this.errorStates.clear();
    this.resetStats();
  }
  
  /**
   * Updates the configuration of this handler.
   * 
   * @param config - New configuration options
   */
  updateConfig(config: Partial<MockErrorHandlerConfig<T>>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * Calculates the retry delay based on the configured retry strategy.
   * 
   * @param retryCount - Number of retry attempts so far
   * @returns Delay in milliseconds before the next retry
   */
  getRetryDelayMs(retryCount: number): number {
    const { retryStrategy } = this.config;
    let delay: number;
    
    switch (retryStrategy.type) {
      case RetryStrategyType.FIXED:
        delay = retryStrategy.baseDelayMs;
        break;
        
      case RetryStrategyType.LINEAR:
        delay = retryStrategy.baseDelayMs + (retryCount * (retryStrategy.increment || 1000));
        break;
        
      case RetryStrategyType.EXPONENTIAL:
        delay = retryStrategy.baseDelayMs * Math.pow(retryStrategy.multiplier || 2, retryCount);
        break;
        
      case RetryStrategyType.CUSTOM:
        if (retryStrategy.customDelayFn) {
          delay = retryStrategy.customDelayFn(retryCount, retryStrategy.baseDelayMs);
        } else {
          delay = retryStrategy.baseDelayMs;
        }
        break;
        
      default:
        delay = retryStrategy.baseDelayMs;
    }
    
    // Apply jitter if configured
    if (retryStrategy.withJitter) {
      // Add random jitter between -25% and +25%
      const jitterFactor = 0.25;
      const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
      delay = Math.max(1, delay + jitter);
    }
    
    // Ensure delay doesn't exceed max
    return Math.min(delay, retryStrategy.maxDelayMs);
  }
  
  /**
   * Determines if an event should be retried based on the error category.
   * 
   * @param event - The failed event
   * @param error - The error that occurred
   * @param retryCount - Number of retry attempts so far
   * @returns True if the event should be retried, false otherwise
   */
  shouldRetry(event: T, error: Error, retryCount: number): boolean {
    // Check if we've exceeded max retries
    if (retryCount >= this.config.retryStrategy.maxRetries) {
      return false;
    }
    
    // Check if the error is retriable based on category
    if (error instanceof EventException) {
      return error.isRetriable();
    }
    
    // Default behavior based on configured error category
    return this.config.errorCategory === EventErrorCategory.TRANSIENT || 
           this.config.errorCategory === EventErrorCategory.RETRIABLE;
  }
  
  /**
   * Sends an event to the dead letter queue.
   * 
   * @param event - The event to send to the DLQ
   * @param error - The error that caused the event to be sent to the DLQ
   * @param retryCount - Number of retry attempts before sending to DLQ
   */
  private async sendToDLQ(event: T, error: Error, retryCount: number): Promise<void> {
    if (!this.config.dlqConfig.enabled) {
      return;
    }
    
    const eventId = (event as any).eventId || 'unknown';
    
    // Create DLQ entry
    const dlqEntry: DLQEntry<T> = {
      event,
      error,
      retryCount,
      timestamp: new Date().toISOString(),
      reprocessed: false
    };
    
    // Store in DLQ
    this.dlqEntries.set(eventId, dlqEntry);
    
    // Update stats
    this.stats.eventsInDLQ++;
    
    // Call the onSendToDLQ callback if configured
    if (this.config.dlqConfig.onSendToDLQ) {
      this.config.dlqConfig.onSendToDLQ(event, error, retryCount);
    }
    
    // Log the operation
    if (this.config.enableAudit) {
      this.auditLog.push({
        operationId: crypto.randomUUID(),
        eventId,
        eventType: (event as any).type || this.config.eventType,
        operation: 'dlq',
        result: 'success',
        error,
        retryCount,
        timestamp: new Date().toISOString(),
        durationMs: 0
      });
    }
  }
  
  /**
   * Creates a response for an event based on success or failure.
   * 
   * @param event - The event being processed
   * @param success - Whether the operation should succeed
   * @param context - Additional context information
   * @param startTime - Start time of the operation in milliseconds
   * @param operationId - Unique ID for this operation
   * @returns A standardized event response
   */
  private async createResponse(
    event: T, 
    success: boolean, 
    context?: EventHandlerContext,
    startTime?: number,
    operationId?: string
  ): Promise<IEventResponse<R>> {
    const eventId = (event as any).eventId || 'unknown';
    const eventType = (event as any).type || this.config.eventType;
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : 0;
    
    // Update stats
    if (success) {
      this.stats.successfulEvents++;
    } else {
      this.stats.failedEvents++;
      this.stats.errorCategories[this.config.errorCategory]++;
      this.stats.errorStages[this.config.processingStage]++;
    }
    
    // Update average processing time
    const totalProcessed = this.stats.successfulEvents + this.stats.failedEvents;
    this.stats.avgProcessingTimeMs = (
      (this.stats.avgProcessingTimeMs * (totalProcessed - 1)) + duration
    ) / totalProcessed;
    
    let result: IEventResponse<R>;
    
    if (success) {
      // Create success response
      let data: R | undefined;
      
      // Call onSuccess callback if configured
      if (this.config.onSuccess) {
        data = await this.config.onSuccess(event, context) as R;
      }
      
      result = createSuccessResponse<R>(
        eventId,
        eventType,
        data,
        {
          processingTimeMs: duration,
          correlationId: context?.correlationId,
          serviceId: context?.serviceId || 'mock-error-handler',
          completedAt: new Date().toISOString(),
          retryCount: context?.retryCount || 0
        }
      );
    } else {
      // Create error response
      const error = {
        code: this.config.errorCode,
        message: this.config.errorMessage.replace('{eventId}', eventId),
        details: {
          category: this.config.errorCategory,
          stage: this.config.processingStage
        },
        retryable: this.config.errorCategory === EventErrorCategory.TRANSIENT || 
                  this.config.errorCategory === EventErrorCategory.RETRIABLE,
        retryDelayMs: this.getRetryDelayMs(context?.retryCount || 0)
      };
      
      result = createErrorResponse<R>(
        eventId,
        eventType,
        error,
        {
          processingTimeMs: duration,
          correlationId: context?.correlationId,
          serviceId: context?.serviceId || 'mock-error-handler',
          completedAt: new Date().toISOString(),
          retryCount: context?.retryCount || 0
        }
      );
      
      // Call onError callback if configured
      if (this.config.onError) {
        const errorObj = new Error(error.message);
        this.config.onError(event, errorObj, context);
      }
    }
    
    // Log the operation
    if (this.config.enableAudit && operationId) {
      this.auditLog.push({
        operationId,
        eventId,
        eventType,
        operation: 'handle',
        result: success ? 'success' : 'failure',
        error: success ? undefined : new Error(result.error?.message || 'Unknown error'),
        retryCount: context?.retryCount,
        timestamp: new Date().toISOString(),
        durationMs: duration,
        context: {
          success,
          ...context
        }
      });
    }
    
    return result;
  }
  
  /**
   * Updates the transition state if transition mode is enabled.
   */
  private updateTransitionState(): void {
    const { transitionConfig } = this.config;
    
    if (this.config.errorMode !== ErrorSimulationMode.TRANSITION || !transitionConfig) {
      return;
    }
    
    // Check if we should transition
    if (transitionConfig.transitionFn) {
      // Use custom transition function
      this.currentState = transitionConfig.transitionFn(this.currentState, this.operationCount);
    } else if (this.operationCount % transitionConfig.transitionAfter === 0) {
      // Toggle state
      if (transitionConfig.cycle) {
        this.currentState = this.currentState === 'success' ? 'failure' : 'success';
      } else if (this.currentState === transitionConfig.initialState) {
        // Only transition once from initial state to opposite state
        this.currentState = this.currentState === 'success' ? 'failure' : 'success';
      }
    }
  }
  
  /**
   * Determines if an operation should fail based on the configured error mode.
   * 
   * @param event - The event being processed
   * @param retryCount - Number of retry attempts so far
   * @returns True if the operation should fail, false otherwise
   */
  private shouldFail(event: T, retryCount: number): boolean {
    const eventId = (event as any).eventId || 'unknown';
    const eventType = (event as any).type || this.config.eventType;
    const userId = (event as any).userId;
    
    switch (this.config.errorMode) {
      case ErrorSimulationMode.ALWAYS:
        return true;
        
      case ErrorSimulationMode.NEVER:
        return false;
        
      case ErrorSimulationMode.PERCENTAGE:
        return Math.random() * 100 < (this.config.errorPercentage || 50);
        
      case ErrorSimulationMode.SELECTIVE:
        if (!this.config.selectiveErrors) {
          return false;
        }
        
        // Check if event ID is in the list
        if (this.config.selectiveErrors.eventIds?.includes(eventId)) {
          return true;
        }
        
        // Check if event type is in the list
        if (this.config.selectiveErrors.eventTypes?.includes(eventType)) {
          return true;
        }
        
        // Check if user ID is in the list
        if (userId && this.config.selectiveErrors.userIds?.includes(userId)) {
          return true;
        }
        
        // Check custom predicate
        if (this.config.selectiveErrors.predicate && this.config.selectiveErrors.predicate(event)) {
          return true;
        }
        
        return false;
        
      case ErrorSimulationMode.RETRY_COUNT:
        if (!this.config.retryCountErrors) {
          return false;
        }
        
        // Check if retry count is in the list
        return this.config.retryCountErrors.failOnRetries.includes(retryCount);
        
      case ErrorSimulationMode.PATTERN:
        if (!this.config.patternErrors) {
          return false;
        }
        
        // Check if event index matches the pattern
        if (this.config.patternErrors.failEveryN && this.eventIndex % this.config.patternErrors.failEveryN === 0) {
          return true;
        }
        
        // Check if event index is in the list
        if (this.config.patternErrors.failAtIndices?.includes(this.eventIndex)) {
          return true;
        }
        
        // Check custom pattern function
        if (this.config.patternErrors.patternFn && this.config.patternErrors.patternFn(this.eventIndex)) {
          return true;
        }
        
        return false;
        
      case ErrorSimulationMode.TRANSITION:
        // Return true if current state is failure
        return this.currentState === 'failure';
        
      default:
        return false;
    }
  }
}

/**
 * Creates a mock error handler with default configuration.
 * 
 * @param config - Partial configuration for the mock error handler
 * @returns A new MockErrorHandler instance
 */
export function createMockErrorHandler<T = any, R = any>(
  config: Partial<MockErrorHandlerConfig<T>> = {}
): MockErrorHandler<T, R> {
  return new MockErrorHandler<T, R>(config);
}

/**
 * Creates a mock error handler that always succeeds.
 * 
 * @param eventType - The event type this handler processes
 * @returns A new MockErrorHandler instance that always succeeds
 */
export function createSuccessHandler<T = any, R = any>(eventType: string): MockErrorHandler<T, R> {
  return new MockErrorHandler<T, R>({
    eventType,
    errorMode: ErrorSimulationMode.NEVER
  });
}

/**
 * Creates a mock error handler that always fails.
 * 
 * @param eventType - The event type this handler processes
 * @param errorCategory - The error category to simulate
 * @param errorMessage - The error message to use
 * @returns A new MockErrorHandler instance that always fails
 */
export function createFailureHandler<T = any, R = any>(
  eventType: string,
  errorCategory: EventErrorCategory = EventErrorCategory.TRANSIENT,
  errorMessage: string = 'Simulated failure for testing'
): MockErrorHandler<T, R> {
  return new MockErrorHandler<T, R>({
    eventType,
    errorMode: ErrorSimulationMode.ALWAYS,
    errorCategory,
    errorMessage
  });
}

/**
 * Creates a mock error handler with a percentage-based failure rate.
 * 
 * @param eventType - The event type this handler processes
 * @param errorPercentage - Percentage chance of failure (0-100)
 * @returns A new MockErrorHandler instance with percentage-based failures
 */
export function createPercentageFailureHandler<T = any, R = any>(
  eventType: string,
  errorPercentage: number = 50
): MockErrorHandler<T, R> {
  return new MockErrorHandler<T, R>({
    eventType,
    errorMode: ErrorSimulationMode.PERCENTAGE,
    errorPercentage
  });
}

/**
 * Creates a mock error handler that transitions between success and failure states.
 * 
 * @param eventType - The event type this handler processes
 * @param transitionAfter - Number of operations before transitioning
 * @param initialState - Initial state (success or failure)
 * @param cycle - Whether to cycle between states
 * @returns A new MockErrorHandler instance with state transitions
 */
export function createTransitioningHandler<T = any, R = any>(
  eventType: string,
  transitionAfter: number = 5,
  initialState: 'success' | 'failure' = 'success',
  cycle: boolean = true
): MockErrorHandler<T, R> {
  return new MockErrorHandler<T, R>({
    eventType,
    errorMode: ErrorSimulationMode.TRANSITION,
    transitionConfig: {
      initialState,
      transitionAfter,
      cycle
    }
  });
}

/**
 * Creates a mock error handler that simulates retry failures.
 * 
 * @param eventType - The event type this handler processes
 * @param failOnRetries - Retry counts that should fail
 * @param maxRetries - Maximum number of retries
 * @returns A new MockErrorHandler instance that fails on specific retry attempts
 */
export function createRetryFailureHandler<T = any, R = any>(
  eventType: string,
  failOnRetries: number[] = [0, 1],
  maxRetries: number = 3
): MockErrorHandler<T, R> {
  return new MockErrorHandler<T, R>({
    eventType,
    errorMode: ErrorSimulationMode.RETRY_COUNT,
    retryCountErrors: {
      failOnRetries
    },
    retryStrategy: {
      type: RetryStrategyType.EXPONENTIAL,
      baseDelayMs: 100,
      maxDelayMs: 10000,
      maxRetries
    }
  });
}

/**
 * Creates a mock error handler with a dead letter queue.
 * 
 * @param eventType - The event type this handler processes
 * @param errorMode - Error simulation mode
 * @param maxRetries - Maximum number of retries before sending to DLQ
 * @returns A new MockErrorHandler instance with DLQ support
 */
export function createDLQHandler<T = any, R = any>(
  eventType: string,
  errorMode: ErrorSimulationMode = ErrorSimulationMode.PERCENTAGE,
  maxRetries: number = 3
): MockErrorHandler<T, R> {
  return new MockErrorHandler<T, R>({
    eventType,
    errorMode,
    retryStrategy: {
      type: RetryStrategyType.EXPONENTIAL,
      baseDelayMs: 100,
      maxDelayMs: 10000,
      maxRetries
    },
    dlqConfig: {
      enabled: true,
      maxRetries,
      trackEvents: true,
      allowReprocessing: true
    }
  });
}