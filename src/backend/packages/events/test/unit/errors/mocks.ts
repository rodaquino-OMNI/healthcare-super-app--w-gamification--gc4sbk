/**
 * @file Mock implementations of error handling components for testing
 * @description Provides mock implementations of error classes, retry policies, DLQ producers,
 * and error handlers with controllable behavior for simulating various error scenarios.
 * This utility file centralizes mock implementations to ensure consistency across all error
 * handling tests, making test maintenance easier and more reliable.
 */

import { 
  EventException, 
  EventErrorCategory, 
  EventErrorContext, 
  EventProcessingStage,
  EventValidationException,
  EventDeserializationException,
  EventSchemaVersionException,
  EventProcessingException,
  EventPublishingException,
  EventPersistenceException,
  EventHandlerNotFoundException,
  EventMaxRetriesExceededException,
  HealthEventException,
  CareEventException,
  PlanEventException
} from '../../../src/errors/event-errors';

import {
  IRetryPolicy,
  RetryContext,
  RetryStatus,
  RetryOptions,
  ExponentialBackoffRetryOptions,
  FixedIntervalRetryOptions,
  LinearBackoffRetryOptions
} from '../../../src/errors/retry-policies';

import {
  DlqErrorType,
  DlqEntryStatus,
  DlqProcessAction,
  RetryAttempt,
  IDlqEntry
} from '../../../src/errors/dlq';

import { ErrorCategory } from '../../../src/errors/handling';
import { ErrorType } from '@austa/errors';
import { IBaseEvent } from '../../../src/interfaces/base-event.interface';
import { JourneyType } from '../../../src/interfaces/journey-events.interface';

// Import fixtures for test data
import {
  sampleBaseEvent,
  sampleHealthEvent,
  sampleCareEvent,
  samplePlanEvent,
  validationErrorContext,
  schemaVersionErrorContext,
  processingErrorContext,
  publishingErrorContext,
  persistenceErrorContext,
  sampleRetryAttempt,
  multipleRetryAttempts,
  healthDlqEntry,
  careDlqEntry,
  planDlqEntry
} from './fixtures';

// ===== MOCK EVENT EXCEPTIONS =====

/**
 * Creates a mock EventException with configurable properties
 * @param message Error message
 * @param type Error type
 * @param code Error code
 * @param category Error category for retry classification
 * @param eventContext Event context information
 * @param details Additional error details
 * @param cause Original error that caused this exception
 * @returns A mock EventException
 */
export function createMockEventException(
  message: string = 'Mock event error',
  type: ErrorType = ErrorType.TECHNICAL,
  code: string = 'MOCK_EVENT_ERROR',
  category: EventErrorCategory = EventErrorCategory.TRANSIENT,
  eventContext: EventErrorContext = processingErrorContext,
  details: any = {},
  cause?: Error
): EventException {
  return new EventException(
    message,
    type,
    code,
    category,
    eventContext,
    details,
    cause
  );
}

/**
 * Creates a mock EventValidationException
 * @param message Error message
 * @param code Error code
 * @param eventContext Event context information
 * @param details Validation details
 * @param cause Original error that caused this exception
 * @returns A mock EventValidationException
 */
export function createMockValidationException(
  message: string = 'Event validation failed',
  code: string = 'EVENT_VALIDATION_ERROR',
  eventContext: EventErrorContext = validationErrorContext,
  details: any = { validationErrors: ['Field required', 'Invalid format'] },
  cause?: Error
): EventValidationException {
  return new EventValidationException(
    message,
    code,
    eventContext,
    details,
    cause
  );
}

/**
 * Creates a mock EventSchemaVersionException
 * @param message Error message
 * @param code Error code
 * @param eventContext Event context information
 * @param details Schema version details
 * @param cause Original error that caused this exception
 * @returns A mock EventSchemaVersionException
 */
export function createMockSchemaVersionException(
  message: string = 'Event schema version mismatch',
  code: string = 'EVENT_SCHEMA_VERSION_ERROR',
  eventContext: EventErrorContext = schemaVersionErrorContext,
  details: any = { expectedVersion: '1.0.0', actualVersion: '2.0.0' },
  cause?: Error
): EventSchemaVersionException {
  return new EventSchemaVersionException(
    message,
    code,
    eventContext,
    details,
    cause
  );
}

/**
 * Creates a mock EventProcessingException
 * @param message Error message
 * @param code Error code
 * @param category Error category for retry classification
 * @param eventContext Event context information
 * @param details Processing details
 * @param cause Original error that caused this exception
 * @returns A mock EventProcessingException
 */
export function createMockProcessingException(
  message: string = 'Event processing failed',
  code: string = 'EVENT_PROCESSING_ERROR',
  category: EventErrorCategory = EventErrorCategory.RETRIABLE,
  eventContext: EventErrorContext = processingErrorContext,
  details: any = { processingStep: 'saveMetricToDatabase' },
  cause?: Error
): EventProcessingException {
  return new EventProcessingException(
    message,
    code,
    category,
    eventContext,
    details,
    cause
  );
}

/**
 * Creates a mock EventPublishingException
 * @param message Error message
 * @param code Error code
 * @param category Error category for retry classification
 * @param eventContext Event context information
 * @param details Publishing details
 * @param cause Original error that caused this exception
 * @returns A mock EventPublishingException
 */
export function createMockPublishingException(
  message: string = 'Event publishing failed',
  code: string = 'EVENT_PUBLISHING_ERROR',
  category: EventErrorCategory = EventErrorCategory.TRANSIENT,
  eventContext: EventErrorContext = publishingErrorContext,
  details: any = { destination: 'gamification-events' },
  cause?: Error
): EventPublishingException {
  return new EventPublishingException(
    message,
    code,
    category,
    eventContext,
    details,
    cause
  );
}

/**
 * Creates a mock EventPersistenceException
 * @param message Error message
 * @param code Error code
 * @param category Error category for retry classification
 * @param eventContext Event context information
 * @param details Persistence details
 * @param cause Original error that caused this exception
 * @returns A mock EventPersistenceException
 */
export function createMockPersistenceException(
  message: string = 'Event persistence failed',
  code: string = 'EVENT_PERSISTENCE_ERROR',
  category: EventErrorCategory = EventErrorCategory.TRANSIENT,
  eventContext: EventErrorContext = persistenceErrorContext,
  details: any = { storageTarget: 'claims_table' },
  cause?: Error
): EventPersistenceException {
  return new EventPersistenceException(
    message,
    code,
    category,
    eventContext,
    details,
    cause
  );
}

/**
 * Creates a mock journey-specific exception
 * @param journey Journey type
 * @param message Error message
 * @param code Error code
 * @param category Error category for retry classification
 * @param eventContext Event context information
 * @param details Additional error details
 * @param cause Original error that caused this exception
 * @returns A mock journey-specific exception
 */
export function createMockJourneyException(
  journey: JourneyType,
  message: string = `${journey} journey error`,
  code: string = `${journey.toUpperCase()}_EVENT_ERROR`,
  category: EventErrorCategory = EventErrorCategory.RETRIABLE,
  eventContext?: EventErrorContext,
  details: any = {},
  cause?: Error
): EventException {
  // Create appropriate context if not provided
  if (!eventContext) {
    let event: IBaseEvent;
    switch (journey) {
      case JourneyType.HEALTH:
        event = sampleHealthEvent;
        break;
      case JourneyType.CARE:
        event = sampleCareEvent;
        break;
      case JourneyType.PLAN:
        event = samplePlanEvent;
        break;
      default:
        event = sampleBaseEvent;
    }
    
    eventContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      processingStage: EventProcessingStage.PROCESSING,
      journey,
      userId: event.userId,
      metadata: {}
    };
  }
  
  // Create appropriate journey-specific exception
  switch (journey) {
    case JourneyType.HEALTH:
      return new HealthEventException(message, code, category, eventContext, details, cause);
    case JourneyType.CARE:
      return new CareEventException(message, code, category, eventContext, details, cause);
    case JourneyType.PLAN:
      return new PlanEventException(message, code, category, eventContext, details, cause);
    default:
      return new EventException(message, ErrorType.BUSINESS, code, category, eventContext, details, cause);
  }
}

/**
 * Creates a mock EventMaxRetriesExceededException
 * @param event The event that exceeded maximum retries
 * @param maxRetries The maximum number of retries allowed
 * @param lastError The last error that occurred during processing
 * @returns A mock EventMaxRetriesExceededException
 */
export function createMockMaxRetriesExceededException(
  event: IBaseEvent = sampleHealthEvent,
  maxRetries: number = 3,
  lastError?: Error
): EventMaxRetriesExceededException {
  return EventMaxRetriesExceededException.fromEvent(event, maxRetries, lastError);
}

// ===== MOCK RETRY POLICIES =====

/**
 * Mock implementation of IRetryPolicy with configurable behavior
 */
export class MockRetryPolicy implements IRetryPolicy {
  private name: string;
  private shouldRetryResult: boolean;
  private nextRetryDelay: number;
  
  /**
   * Creates a new MockRetryPolicy
   * @param name Name of the policy
   * @param shouldRetryResult Whether shouldRetry should return true or false
   * @param nextRetryDelay The delay to return from calculateNextRetryDelay
   */
  constructor(
    name: string = 'MockRetryPolicy',
    shouldRetryResult: boolean = true,
    nextRetryDelay: number = 1000
  ) {
    this.name = name;
    this.shouldRetryResult = shouldRetryResult;
    this.nextRetryDelay = nextRetryDelay;
  }
  
  /**
   * Calculate the next retry time based on the retry context
   * @param context The retry context
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateNextRetryDelay(context: RetryContext): number {
    return this.nextRetryDelay;
  }
  
  /**
   * Determine if a retry should be attempted based on the retry context
   * @param context The retry context
   * @returns True if retry should be attempted, false otherwise
   */
  shouldRetry(context: RetryContext): boolean {
    return this.shouldRetryResult;
  }
  
  /**
   * Get the name of the retry policy
   * @returns The name of the retry policy
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Set whether shouldRetry should return true or false
   * @param value The value to return from shouldRetry
   */
  setShouldRetryResult(value: boolean): void {
    this.shouldRetryResult = value;
  }
  
  /**
   * Set the delay to return from calculateNextRetryDelay
   * @param value The delay in milliseconds
   */
  setNextRetryDelay(value: number): void {
    this.nextRetryDelay = value;
  }
}

/**
 * Mock implementation of ExponentialBackoffRetryPolicy with predictable behavior
 */
export class MockExponentialBackoffRetryPolicy extends MockRetryPolicy {
  private initialDelayMs: number;
  private maxDelayMs: number;
  private backoffFactor: number;
  private maxRetries: number;
  
  /**
   * Creates a new MockExponentialBackoffRetryPolicy
   * @param options Configuration options
   */
  constructor(options: Partial<ExponentialBackoffRetryOptions> = {}) {
    super('MockExponentialBackoffRetryPolicy');
    this.initialDelayMs = options.initialDelayMs || 1000;
    this.maxDelayMs = options.maxDelayMs || 30000;
    this.backoffFactor = options.backoffFactor || 2;
    this.maxRetries = options.maxRetries || 3;
  }
  
  /**
   * Calculate the next retry time based on the retry context
   * @param context The retry context
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateNextRetryDelay(context: RetryContext): number {
    const exponentialDelay = this.initialDelayMs * Math.pow(this.backoffFactor, context.retryCount);
    return Math.min(exponentialDelay, this.maxDelayMs);
  }
  
  /**
   * Determine if a retry should be attempted based on the retry context
   * @param context The retry context
   * @returns True if retry should be attempted, false otherwise
   */
  shouldRetry(context: RetryContext): boolean {
    return context.retryCount < this.maxRetries;
  }
  
  /**
   * Get the name of the retry policy
   * @returns The name of the retry policy
   */
  getName(): string {
    return 'ExponentialBackoffRetryPolicy';
  }
}

/**
 * Factory for creating mock retry policies
 */
export class MockRetryPolicyFactory {
  /**
   * Create a mock retry policy with the specified behavior
   * @param shouldRetry Whether the policy should allow retries
   * @param nextRetryDelay The delay to return for the next retry
   * @returns A mock retry policy
   */
  static createMockPolicy(shouldRetry: boolean = true, nextRetryDelay: number = 1000): IRetryPolicy {
    return new MockRetryPolicy('MockPolicy', shouldRetry, nextRetryDelay);
  }
  
  /**
   * Create a mock exponential backoff policy
   * @param options Configuration options
   * @returns A mock exponential backoff policy
   */
  static createMockExponentialBackoffPolicy(options?: Partial<ExponentialBackoffRetryOptions>): IRetryPolicy {
    return new MockExponentialBackoffRetryPolicy(options);
  }
  
  /**
   * Create a mock policy that always allows retries
   * @returns A mock retry policy that always allows retries
   */
  static createAlwaysRetryPolicy(): IRetryPolicy {
    return new MockRetryPolicy('AlwaysRetryPolicy', true, 1000);
  }
  
  /**
   * Create a mock policy that never allows retries
   * @returns A mock retry policy that never allows retries
   */
  static createNeverRetryPolicy(): IRetryPolicy {
    return new MockRetryPolicy('NeverRetryPolicy', false, 0);
  }
}

// ===== MOCK DLQ COMPONENTS =====

/**
 * Mock implementation of DLQ producer for testing
 */
export class MockDlqProducer {
  private sentEvents: Array<{ event: IBaseEvent, options: any }> = [];
  private shouldFail: boolean = false;
  private failureError?: Error;
  
  /**
   * Sends a failed event to the DLQ
   * @param event The event that failed processing
   * @param options Options for sending to DLQ
   * @returns A mock DLQ entry
   */
  async sendToDlq<T extends IBaseEvent>(event: T, options: any): Promise<IDlqEntry> {
    if (this.shouldFail) {
      throw this.failureError || new Error('Mock DLQ producer failure');
    }
    
    this.sentEvents.push({ event, options });
    
    // Create a mock DLQ entry
    const dlqEntry: IDlqEntry = {
      id: `mock-dlq-${Date.now()}`,
      eventId: event.eventId,
      userId: event.userId,
      journey: event.journey as JourneyType,
      eventType: event.type,
      payload: event.payload || {},
      errorType: options.errorType || DlqErrorType.PROCESSING,
      errorMessage: options.errorMessage || 'Mock error',
      errorStack: options.errorStack,
      retryAttempts: options.retryAttempts || [],
      status: DlqEntryStatus.PENDING,
      originalTopic: options.originalTopic || 'mock-topic',
      kafkaMetadata: options.kafkaMetadata,
      processingMetadata: options.processingMetadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return dlqEntry;
  }
  
  /**
   * Sends a failed Kafka event to the DLQ
   * @param kafkaEvent The Kafka event that failed processing
   * @param error The error that occurred
   * @param retryAttempts Previous retry attempts
   * @returns A mock DLQ entry
   */
  async sendKafkaEventToDlq(kafkaEvent: any, error: Error, retryAttempts: RetryAttempt[] = []): Promise<IDlqEntry> {
    if (this.shouldFail) {
      throw this.failureError || new Error('Mock DLQ producer failure');
    }
    
    this.sentEvents.push({ 
      event: kafkaEvent.event, 
      options: { 
        error, 
        retryAttempts,
        kafkaEvent
      } 
    });
    
    // Create a mock DLQ entry
    const dlqEntry: IDlqEntry = {
      id: `mock-dlq-${Date.now()}`,
      eventId: kafkaEvent.event.eventId,
      userId: kafkaEvent.event.userId,
      journey: kafkaEvent.event.journey as JourneyType,
      eventType: kafkaEvent.event.type,
      payload: kafkaEvent.event.payload || {},
      errorType: this.classifyError(error),
      errorMessage: error.message,
      errorStack: error.stack,
      retryAttempts,
      status: DlqEntryStatus.PENDING,
      originalTopic: kafkaEvent.topic,
      kafkaMetadata: {
        topic: kafkaEvent.topic,
        partition: kafkaEvent.partition,
        offset: kafkaEvent.offset,
        timestamp: kafkaEvent.timestamp,
        headers: kafkaEvent.headers
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return dlqEntry;
  }
  
  /**
   * Get all events sent to the DLQ
   * @returns Array of events sent to the DLQ
   */
  getSentEvents(): Array<{ event: IBaseEvent, options: any }> {
    return this.sentEvents;
  }
  
  /**
   * Clear the list of sent events
   */
  clearSentEvents(): void {
    this.sentEvents = [];
  }
  
  /**
   * Configure whether the DLQ producer should fail
   * @param shouldFail Whether the producer should fail
   * @param error The error to throw when failing
   */
  setFailure(shouldFail: boolean, error?: Error): void {
    this.shouldFail = shouldFail;
    this.failureError = error;
  }
  
  /**
   * Classify an error into a DLQ error type
   * @param error The error to classify
   * @returns The classified error type
   */
  private classifyError(error: Error): DlqErrorType {
    if (!error) return DlqErrorType.UNKNOWN;
    
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorName.includes('validation') || errorMessage.includes('validation')) {
      return DlqErrorType.VALIDATION;
    }
    
    if (errorName.includes('schema') || errorMessage.includes('schema')) {
      return DlqErrorType.SCHEMA;
    }
    
    if (errorName.includes('timeout') || errorMessage.includes('timeout')) {
      return DlqErrorType.TIMEOUT;
    }
    
    if (errorName.includes('network') || errorMessage.includes('network') ||
        errorName.includes('connection') || errorMessage.includes('connection')) {
      return DlqErrorType.NETWORK;
    }
    
    if (errorName.includes('database') || errorMessage.includes('database') ||
        errorName.includes('db') || errorMessage.includes('db') ||
        errorName.includes('sql') || errorMessage.includes('sql')) {
      return DlqErrorType.DATABASE;
    }
    
    return DlqErrorType.PROCESSING;
  }
}

/**
 * Factory for creating mock DLQ entries
 */
export class MockDlqEntryFactory {
  /**
   * Create a mock DLQ entry
   * @param journey Journey type
   * @param errorType Error type
   * @param status Entry status
   * @returns A mock DLQ entry
   */
  static createMockDlqEntry(
    journey: JourneyType = JourneyType.HEALTH,
    errorType: DlqErrorType = DlqErrorType.PROCESSING,
    status: DlqEntryStatus = DlqEntryStatus.PENDING
  ): IDlqEntry {
    switch (journey) {
      case JourneyType.HEALTH:
        return { ...healthDlqEntry, errorType, status };
      case JourneyType.CARE:
        return { ...careDlqEntry, errorType, status };
      case JourneyType.PLAN:
        return { ...planDlqEntry, errorType, status };
      default:
        return { ...healthDlqEntry, errorType, status };
    }
  }
  
  /**
   * Create multiple mock DLQ entries
   * @param count Number of entries to create
   * @param journey Journey type
   * @param errorType Error type
   * @returns Array of mock DLQ entries
   */
  static createMockDlqEntries(
    count: number,
    journey: JourneyType = JourneyType.HEALTH,
    errorType: DlqErrorType = DlqErrorType.PROCESSING
  ): IDlqEntry[] {
    const entries: IDlqEntry[] = [];
    
    for (let i = 0; i < count; i++) {
      const entry = this.createMockDlqEntry(journey, errorType);
      // Modify ID to make it unique
      entry.id = `${entry.id}-${i}`;
      entries.push(entry);
    }
    
    return entries;
  }
}

// ===== MOCK ERROR HANDLERS =====

/**
 * Mock implementation of error classifier for testing
 */
export class MockErrorClassifier {
  private classificationMap: Map<string, ErrorCategory> = new Map();
  private defaultCategory: ErrorCategory = ErrorCategory.INDETERMINATE;
  
  /**
   * Classify an error into a category
   * @param error The error to classify
   * @returns The error category
   */
  classify(error: Error): ErrorCategory {
    // Check if we have a specific classification for this error
    if (error.name && this.classificationMap.has(error.name)) {
      return this.classificationMap.get(error.name)!;
    }
    
    // Check if we have a classification based on message content
    for (const [pattern, category] of this.classificationMap.entries()) {
      if (error.message && error.message.includes(pattern)) {
        return category;
      }
    }
    
    // Use default category if no specific classification found
    return this.defaultCategory;
  }
  
  /**
   * Set the classification for a specific error type or message pattern
   * @param errorNameOrPattern Error name or message pattern
   * @param category Error category
   */
  setClassification(errorNameOrPattern: string, category: ErrorCategory): void {
    this.classificationMap.set(errorNameOrPattern, category);
  }
  
  /**
   * Set the default category for errors that don't match any specific classification
   * @param category Default error category
   */
  setDefaultCategory(category: ErrorCategory): void {
    this.defaultCategory = category;
  }
  
  /**
   * Clear all classifications
   */
  clearClassifications(): void {
    this.classificationMap.clear();
    this.defaultCategory = ErrorCategory.INDETERMINATE;
  }
}

/**
 * Mock implementation of error handler for testing
 */
export class MockErrorHandler {
  private shouldRethrow: boolean = false;
  private errorClassifier: MockErrorClassifier = new MockErrorClassifier();
  private handledErrors: Error[] = [];
  private fallbackFn?: (event: any) => Promise<any>;
  
  /**
   * Handle an error
   * @param error The error to handle
   * @param event The event being processed when the error occurred
   * @returns Result of error handling
   */
  async handleError(error: Error, event: any): Promise<any> {
    this.handledErrors.push(error);
    
    const category = this.errorClassifier.classify(error);
    
    // If configured to rethrow, rethrow the error
    if (this.shouldRethrow) {
      throw error;
    }
    
    // If we have a fallback function and the error is permanent, use it
    if (this.fallbackFn && category === ErrorCategory.PERMANENT) {
      return this.fallbackFn(event);
    }
    
    // Return a standard error response
    return {
      success: false,
      error: {
        message: error.message,
        code: error instanceof EventException ? error.code : 'UNKNOWN_ERROR',
        category
      },
      metadata: {
        eventId: event?.eventId,
        eventType: event?.type,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Configure whether the handler should rethrow errors
   * @param shouldRethrow Whether to rethrow errors
   */
  setShouldRethrow(shouldRethrow: boolean): void {
    this.shouldRethrow = shouldRethrow;
  }
  
  /**
   * Set the fallback function to use for permanent errors
   * @param fallbackFn Fallback function
   */
  setFallbackFn(fallbackFn: (event: any) => Promise<any>): void {
    this.fallbackFn = fallbackFn;
  }
  
  /**
   * Get the error classifier
   * @returns The error classifier
   */
  getErrorClassifier(): MockErrorClassifier {
    return this.errorClassifier;
  }
  
  /**
   * Get all errors handled by this handler
   * @returns Array of handled errors
   */
  getHandledErrors(): Error[] {
    return this.handledErrors;
  }
  
  /**
   * Clear the list of handled errors
   */
  clearHandledErrors(): void {
    this.handledErrors = [];
  }
}

// ===== TEST SCENARIO FACTORIES =====

/**
 * Factory for creating test error scenarios
 */
export class ErrorScenarioFactory {
  /**
   * Create a validation error scenario
   * @param event The event that failed validation
   * @param validationErrors Array of validation error messages
   * @returns Object containing the event and error
   */
  static createValidationErrorScenario(event: IBaseEvent = sampleHealthEvent, validationErrors: string[] = ['Field required', 'Invalid format']): { event: IBaseEvent, error: EventValidationException } {
    const context: EventErrorContext = {
      eventId: event.eventId,
      eventType: event.type,
      eventSource: event.source,
      processingStage: EventProcessingStage.VALIDATION,
      journey: event.journey,
      userId: event.userId,
      metadata: {
        validationErrors
      }
    };
    
    const error = new EventValidationException(
      `Event validation failed: ${validationErrors.join(', ')}`,
      'EVENT_VALIDATION_ERROR',
      context,
      { validationErrors }
    );
    
    return { event, error };
  }
  
  /**
   * Create a schema version error scenario
   * @param event The event with incompatible schema version
   * @param expectedVersion Expected schema version
   * @param actualVersion Actual schema version
   * @returns Object containing the event and error
   */
  static createSchemaVersionErrorScenario(event: IBaseEvent = sampleHealthEvent, expectedVersion: string = '1.0.0', actualVersion: string = '2.0.0'): { event: IBaseEvent, error: EventSchemaVersionException } {
    const error = EventSchemaVersionException.fromEvent(event, expectedVersion, actualVersion);
    return { event, error };
  }
  
  /**
   * Create a processing error scenario
   * @param event The event that failed processing
   * @param message Error message
   * @param category Error category
   * @param retryCount Current retry count
   * @returns Object containing the event and error
   */
  static createProcessingErrorScenario(event: IBaseEvent = sampleHealthEvent, message: string = 'Database connection error', category: EventErrorCategory = EventErrorCategory.TRANSIENT, retryCount: number = 0): { event: IBaseEvent, error: EventProcessingException } {
    // Add retry count to event metadata
    const eventWithRetry = {
      ...event,
      metadata: {
        ...event.metadata,
        retryCount
      }
    };
    
    const error = EventProcessingException.fromEvent(eventWithRetry, message, category);
    return { event: eventWithRetry, error };
  }
  
  /**
   * Create a publishing error scenario
   * @param event The event that failed to publish
   * @param destination Destination where publishing failed
   * @param message Error message
   * @returns Object containing the event and error
   */
  static createPublishingErrorScenario(event: IBaseEvent = sampleHealthEvent, destination: string = 'gamification-events', message: string = 'Kafka broker unavailable'): { event: IBaseEvent, error: EventPublishingException } {
    const error = EventPublishingException.fromEvent(event, destination, message);
    return { event, error };
  }
  
  /**
   * Create a max retries exceeded scenario
   * @param event The event that exceeded maximum retries
   * @param maxRetries Maximum number of retries allowed
   * @param lastError Last error that occurred during processing
   * @returns Object containing the event and error
   */
  static createMaxRetriesExceededScenario(event: IBaseEvent = sampleHealthEvent, maxRetries: number = 3, lastError?: Error): { event: IBaseEvent, error: EventMaxRetriesExceededException } {
    // Add retry count to event metadata
    const eventWithRetry = {
      ...event,
      metadata: {
        ...event.metadata,
        retryCount: maxRetries
      }
    };
    
    const error = EventMaxRetriesExceededException.fromEvent(eventWithRetry, maxRetries, lastError);
    return { event: eventWithRetry, error };
  }
  
  /**
   * Create a journey-specific error scenario
   * @param journey Journey type
   * @param message Error message
   * @param category Error category
   * @returns Object containing the event and error
   */
  static createJourneyErrorScenario(journey: JourneyType, message: string = `${journey} journey error`, category: EventErrorCategory = EventErrorCategory.RETRIABLE): { event: IBaseEvent, error: EventException } {
    let event: IBaseEvent;
    switch (journey) {
      case JourneyType.HEALTH:
        event = sampleHealthEvent;
        break;
      case JourneyType.CARE:
        event = sampleCareEvent;
        break;
      case JourneyType.PLAN:
        event = samplePlanEvent;
        break;
      default:
        event = sampleBaseEvent;
    }
    
    const error = createMockJourneyException(journey, message, `${journey.toUpperCase()}_EVENT_ERROR`, category);
    return { event, error };
  }
}