/**
 * @file mocks.ts
 * @description Provides mock implementations of error handling components for testing.
 * Includes mock error classes, retry policies, DLQ producers, and error handlers with
 * controllable behavior for simulating various error scenarios.
 */

import { ErrorType } from '@austa/errors';
import {
  EventError,
  EventErrorContext,
  EventProcessingStage,
  EventValidationError,
  EventSchemaError,
  EventDeserializationError,
  EventRoutingError,
  EventProcessingError,
  EventPersistenceError,
  EventExternalSystemError,
  EventTimeoutError,
  EventDatabaseError,
  EventDataProcessingError,
  EventVersionError,
  DuplicateEventError,
  EventRateLimitError,
  HealthEventErrors,
  CareEventErrors,
  PlanEventErrors
} from '../../../src/errors/event-errors';
import {
  RetryPolicy,
  RetryContext,
  RetryStatus,
  RetryOptions,
  ExponentialBackoffOptions,
  FixedIntervalOptions,
  JourneyRetryConfig,
  RetryPolicyFactory
} from '../../../src/errors/retry-policies';
import {
  DlqEntry,
  DlqEntryMetadata,
  IDlqProducer,
  IDlqConsumer
} from '../../../src/errors/dlq';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';

// ===================================================================
// Mock Event Error Classes
// ===================================================================

/**
 * Creates a mock event error with configurable properties
 * 
 * @param message Error message
 * @param type Error type
 * @param code Error code
 * @param context Event context information
 * @param isRetriable Whether the error should be retriable
 * @param cause Original error that caused this exception
 * @returns A mock event error instance
 */
export function createMockEventError(
  message: string = 'Mock event error',
  type: ErrorType = ErrorType.TECHNICAL,
  code: string = 'MOCK_ERROR',
  context: EventErrorContext = {},
  isRetriable: boolean = true,
  cause?: Error
): EventError {
  const error = new EventError(message, type, code, context, cause);
  
  // Override the isRetriable method to return the configured value
  error.isRetriable = () => isRetriable;
  
  return error;
}

/**
 * Creates a mock validation error with configurable properties
 * 
 * @param message Error message
 * @param context Event context information
 * @param validationErrors Optional validation error details
 * @param cause Original error that caused this exception
 * @returns A mock validation error instance
 */
export function createMockValidationError(
  message: string = 'Mock validation error',
  context: EventErrorContext = {},
  validationErrors: Record<string, string[]> = {},
  cause?: Error
): EventValidationError {
  const error = new EventValidationError(message, context, cause);
  
  // Add validation errors property for testing
  (error as any).validationErrors = validationErrors;
  
  return error;
}

/**
 * Creates a mock schema error with configurable properties
 * 
 * @param message Error message
 * @param context Event context information
 * @param cause Original error that caused this exception
 * @returns A mock schema error instance
 */
export function createMockSchemaError(
  message: string = 'Mock schema error',
  context: EventErrorContext = {},
  cause?: Error
): EventSchemaError {
  return new EventSchemaError(message, context, cause);
}

/**
 * Creates a mock processing error with configurable properties
 * 
 * @param message Error message
 * @param code Error code
 * @param details Additional error details
 * @param isRetriable Whether the error should be retriable
 * @param processingStage Stage where the error occurred
 * @param context Event context information
 * @param cause Original error that caused this exception
 * @returns A mock processing error instance
 */
export function createMockProcessingError(
  message: string = 'Mock processing error',
  code: string = 'PROCESSING_ERROR',
  details: Record<string, any> = {},
  isRetriable: boolean = false,
  processingStage: EventProcessingStage = EventProcessingStage.PROCESSING,
  context: EventErrorContext = {},
  cause?: Error
): EventProcessingError {
  const error = new EventProcessingError(message, context, cause);
  
  // Add additional properties for testing
  (error as any).code = code;
  (error as any).details = details;
  (error as any).isRetriable = () => isRetriable;
  (error as any).processingStage = processingStage;
  
  return error;
}

/**
 * Creates a mock database error with configurable properties
 * 
 * @param message Error message
 * @param context Event context information
 * @param operation Database operation that failed
 * @param isRetriable Whether the error should be retriable
 * @param cause Original error that caused this exception
 * @returns A mock database error instance
 */
export function createMockDatabaseError(
  message: string = 'Mock database error',
  context: EventErrorContext = {},
  operation: string = 'query',
  isRetriable: boolean = true,
  cause?: Error
): EventDatabaseError {
  const error = new EventDatabaseError(message, context, operation, cause);
  
  // Override the isRetriable method to return the configured value
  error.isRetriable = () => isRetriable;
  
  return error;
}

/**
 * Creates a mock timeout error with configurable properties
 * 
 * @param message Error message
 * @param context Event context information
 * @param timeoutMs Timeout in milliseconds
 * @param isRetriable Whether the error should be retriable
 * @param cause Original error that caused this exception
 * @returns A mock timeout error instance
 */
export function createMockTimeoutError(
  message: string = 'Mock timeout error',
  context: EventErrorContext = {},
  timeoutMs: number = 5000,
  isRetriable: boolean = true,
  cause?: Error
): EventTimeoutError {
  const error = new EventTimeoutError(message, context, timeoutMs, cause);
  
  // Override the isRetriable method to return the configured value
  error.isRetriable = () => isRetriable;
  
  return error;
}

/**
 * Creates a mock external system error with configurable properties
 * 
 * @param message Error message
 * @param context Event context information
 * @param statusCode HTTP status code
 * @param isRetriable Whether the error should be retriable
 * @param cause Original error that caused this exception
 * @returns A mock external system error instance
 */
export function createMockExternalSystemError(
  message: string = 'Mock external system error',
  context: EventErrorContext = {},
  statusCode: number = 500,
  isRetriable: boolean = true,
  cause?: Error
): EventExternalSystemError {
  const error = new EventExternalSystemError(message, context, statusCode, cause);
  
  // Override the isRetriable method to return the configured value
  error.isRetriable = () => isRetriable;
  
  return error;
}

/**
 * Creates a mock rate limit error with configurable properties
 * 
 * @param message Error message
 * @param context Event context information
 * @param retryAfterMs Retry after milliseconds
 * @param cause Original error that caused this exception
 * @returns A mock rate limit error instance
 */
export function createMockRateLimitError(
  message: string = 'Mock rate limit error',
  context: EventErrorContext = {},
  retryAfterMs: number = 5000,
  cause?: Error
): EventRateLimitError {
  const error = new EventRateLimitError(message, context, retryAfterMs, cause);
  return error;
}

/**
 * Creates a mock journey-specific error with configurable properties
 * 
 * @param journey The journey to create an error for
 * @param errorType The specific error type within the journey
 * @param message Error message
 * @param context Event context information
 * @param isRetriable Whether the error should be retriable
 * @param cause Original error that caused this exception
 * @returns A mock journey-specific error instance
 */
export function createMockJourneyError(
  journey: 'health' | 'care' | 'plan',
  errorType: string,
  message: string = `Mock ${journey} journey error`,
  context: EventErrorContext = {},
  isRetriable: boolean = false,
  cause?: Error
): EventError {
  let error: EventError;
  
  switch (journey) {
    case 'health':
      switch (errorType) {
        case 'metric':
          error = new HealthEventErrors.MetricEventError(message, context, cause);
          break;
        case 'goal':
          error = new HealthEventErrors.GoalEventError(message, context, cause);
          break;
        case 'device':
          error = new HealthEventErrors.DeviceSyncEventError(message, context, cause);
          break;
        default:
          error = new HealthEventErrors.MetricEventError(message, context, cause);
      }
      break;
      
    case 'care':
      switch (errorType) {
        case 'appointment':
          error = new CareEventErrors.AppointmentEventError(message, context, cause);
          break;
        case 'medication':
          error = new CareEventErrors.MedicationEventError(message, context, cause);
          break;
        case 'telemedicine':
          error = new CareEventErrors.TelemedicineEventError(message, context, cause);
          break;
        default:
          error = new CareEventErrors.AppointmentEventError(message, context, cause);
      }
      break;
      
    case 'plan':
      switch (errorType) {
        case 'claim':
          error = new PlanEventErrors.ClaimEventError(message, context, cause);
          break;
        case 'benefit':
          error = new PlanEventErrors.BenefitEventError(message, context, cause);
          break;
        case 'coverage':
          error = new PlanEventErrors.CoverageEventError(message, context, cause);
          break;
        default:
          error = new PlanEventErrors.ClaimEventError(message, context, cause);
      }
      break;
      
    default:
      error = new EventError(message, ErrorType.BUSINESS, `${journey.toUpperCase()}_ERROR`, context, cause);
  }
  
  // Override the isRetriable method to return the configured value
  error.isRetriable = () => isRetriable;
  
  return error;
}

// ===================================================================
// Mock Retry Policies
// ===================================================================

/**
 * Mock implementation of RetryPolicy for testing
 */
export class MockRetryPolicy implements RetryPolicy {
  private readonly name: string;
  private shouldRetryValue: boolean;
  private nextRetryDelay: number;
  private retryHistory: RetryContext[] = [];
  
  /**
   * Creates a new MockRetryPolicy instance
   * 
   * @param name Policy name
   * @param shouldRetryValue Whether shouldRetry should return true
   * @param nextRetryDelay The delay to return from calculateNextRetryDelay
   */
  constructor(
    name: string = 'MockRetryPolicy',
    shouldRetryValue: boolean = true,
    nextRetryDelay: number = 1000
  ) {
    this.name = name;
    this.shouldRetryValue = shouldRetryValue;
    this.nextRetryDelay = nextRetryDelay;
  }
  
  /**
   * Determines if an operation should be retried
   * 
   * @param context The retry context
   * @returns The configured shouldRetryValue
   */
  shouldRetry(context: RetryContext): boolean {
    this.retryHistory.push(context);
    return this.shouldRetryValue;
  }
  
  /**
   * Calculates the next retry delay
   * 
   * @param context The retry context
   * @returns The configured nextRetryDelay
   */
  calculateNextRetryDelay(context: RetryContext): number {
    return this.nextRetryDelay;
  }
  
  /**
   * Gets the name of the retry policy
   * 
   * @returns The configured name
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Configures whether shouldRetry should return true or false
   * 
   * @param value The value to return from shouldRetry
   */
  setShouldRetry(value: boolean): void {
    this.shouldRetryValue = value;
  }
  
  /**
   * Configures the delay to return from calculateNextRetryDelay
   * 
   * @param delay The delay in milliseconds
   */
  setNextRetryDelay(delay: number): void {
    this.nextRetryDelay = delay;
  }
  
  /**
   * Gets the history of retry contexts passed to shouldRetry
   * 
   * @returns Array of retry contexts
   */
  getRetryHistory(): RetryContext[] {
    return [...this.retryHistory];
  }
  
  /**
   * Clears the retry history
   */
  clearRetryHistory(): void {
    this.retryHistory = [];
  }
}

/**
 * Mock implementation of RetryPolicyFactory for testing
 */
export class MockRetryPolicyFactory extends RetryPolicyFactory {
  private mockPolicies: Map<string, MockRetryPolicy> = new Map();
  private defaultMockPolicy: MockRetryPolicy;
  
  /**
   * Creates a new MockRetryPolicyFactory instance
   * 
   * @param defaultShouldRetry Default value for shouldRetry
   * @param defaultNextRetryDelay Default value for nextRetryDelay
   */
  constructor(
    defaultShouldRetry: boolean = true,
    defaultNextRetryDelay: number = 1000
  ) {
    super();
    this.defaultMockPolicy = new MockRetryPolicy(
      'DefaultMockPolicy',
      defaultShouldRetry,
      defaultNextRetryDelay
    );
  }
  
  /**
   * Creates a retry policy for a specific journey and error type
   * 
   * @param journey The journey
   * @param errorType The error type
   * @returns A mock retry policy
   */
  override createPolicyForJourneyAndErrorType(journey: string, errorType: ErrorType): RetryPolicy {
    const key = `${journey}:${errorType}`;
    
    if (!this.mockPolicies.has(key)) {
      this.mockPolicies.set(
        key,
        new MockRetryPolicy(`${journey}:${errorType}Policy`, this.defaultMockPolicy.shouldRetry({} as any), 1000)
      );
    }
    
    return this.mockPolicies.get(key)!;
  }
  
  /**
   * Gets a retry policy for a specific event type
   * 
   * @param eventType The event type
   * @returns A mock retry policy
   */
  override getPolicyForEventType(eventType: string): RetryPolicy {
    // Extract journey from event type
    let journey = 'default';
    
    if (eventType.startsWith('health.')) {
      journey = 'health';
    } else if (eventType.startsWith('care.')) {
      journey = 'care';
    } else if (eventType.startsWith('plan.')) {
      journey = 'plan';
    }
    
    const key = `${journey}:event`;
    
    if (!this.mockPolicies.has(key)) {
      this.mockPolicies.set(
        key,
        new MockRetryPolicy(`${journey}EventPolicy`, this.defaultMockPolicy.shouldRetry({} as any), 1000)
      );
    }
    
    return this.mockPolicies.get(key)!;
  }
  
  /**
   * Gets a mock policy for a specific journey and error type
   * 
   * @param journey The journey
   * @param errorType The error type
   * @returns The mock policy or undefined if not found
   */
  getMockPolicy(journey: string, errorType: ErrorType): MockRetryPolicy | undefined {
    return this.mockPolicies.get(`${journey}:${errorType}`);
  }
  
  /**
   * Gets a mock policy for a specific event type
   * 
   * @param eventType The event type
   * @returns The mock policy or undefined if not found
   */
  getMockPolicyForEventType(eventType: string): MockRetryPolicy | undefined {
    // Extract journey from event type
    let journey = 'default';
    
    if (eventType.startsWith('health.')) {
      journey = 'health';
    } else if (eventType.startsWith('care.')) {
      journey = 'care';
    } else if (eventType.startsWith('plan.')) {
      journey = 'plan';
    }
    
    return this.mockPolicies.get(`${journey}:event`);
  }
  
  /**
   * Gets the default mock policy
   * 
   * @returns The default mock policy
   */
  getDefaultMockPolicy(): MockRetryPolicy {
    return this.defaultMockPolicy;
  }
  
  /**
   * Configures all mock policies to return the specified value from shouldRetry
   * 
   * @param value The value to return from shouldRetry
   */
  setAllShouldRetry(value: boolean): void {
    this.defaultMockPolicy.setShouldRetry(value);
    
    for (const policy of this.mockPolicies.values()) {
      policy.setShouldRetry(value);
    }
  }
  
  /**
   * Configures all mock policies to return the specified delay from calculateNextRetryDelay
   * 
   * @param delay The delay in milliseconds
   */
  setAllNextRetryDelay(delay: number): void {
    this.defaultMockPolicy.setNextRetryDelay(delay);
    
    for (const policy of this.mockPolicies.values()) {
      policy.setNextRetryDelay(delay);
    }
  }
  
  /**
   * Clears the retry history for all mock policies
   */
  clearAllRetryHistory(): void {
    this.defaultMockPolicy.clearRetryHistory();
    
    for (const policy of this.mockPolicies.values()) {
      policy.clearRetryHistory();
    }
  }
}

// ===================================================================
// Mock DLQ Producer/Consumer
// ===================================================================

/**
 * Mock implementation of DLQ producer for testing
 */
export class MockDlqProducer implements IDlqProducer {
  private sentEntries: Array<{
    event: BaseEvent;
    error: Error;
    retryHistory?: DlqEntryMetadata['retryHistory'];
  }> = [];
  private shouldFailSending: boolean = false;
  
  /**
   * Sends a failed event to the DLQ
   * 
   * @param event The original event that failed
   * @param error The error that caused the failure
   * @param retryHistory Optional history of retry attempts
   * @returns Promise resolving to boolean indicating success
   */
  async sendToDlq<T extends BaseEvent>(
    event: T,
    error: Error,
    retryHistory?: DlqEntryMetadata['retryHistory']
  ): Promise<boolean> {
    if (this.shouldFailSending) {
      return false;
    }
    
    this.sentEntries.push({ event, error, retryHistory });
    return true;
  }
  
  /**
   * Gets all events sent to the DLQ
   * 
   * @returns Array of sent events with their errors and retry history
   */
  getSentEntries(): Array<{
    event: BaseEvent;
    error: Error;
    retryHistory?: DlqEntryMetadata['retryHistory'];
  }> {
    return [...this.sentEntries];
  }
  
  /**
   * Gets the count of events sent to the DLQ
   * 
   * @returns Number of events sent to the DLQ
   */
  getSentCount(): number {
    return this.sentEntries.length;
  }
  
  /**
   * Checks if a specific event was sent to the DLQ
   * 
   * @param eventId The event ID to check for
   * @returns True if the event was sent to the DLQ
   */
  wasEventSentToDlq(eventId: string): boolean {
    return this.sentEntries.some(entry => entry.event.eventId === eventId);
  }
  
  /**
   * Configures whether sendToDlq should fail
   * 
   * @param shouldFail Whether sendToDlq should return false
   */
  setShouldFailSending(shouldFail: boolean): void {
    this.shouldFailSending = shouldFail;
  }
  
  /**
   * Clears the history of sent entries
   */
  clearSentEntries(): void {
    this.sentEntries = [];
  }
}

/**
 * Mock implementation of DLQ consumer for testing
 */
export class MockDlqConsumer implements IDlqConsumer {
  private entries: DlqEntry[] = [];
  private reprocessedEntries: string[] = [];
  private shouldFailReprocessing: boolean = false;
  
  /**
   * Creates a new MockDlqConsumer instance
   * 
   * @param initialEntries Optional initial entries to populate the DLQ
   */
  constructor(initialEntries: DlqEntry[] = []) {
    this.entries = [...initialEntries];
  }
  
  /**
   * Retrieves entries from the DLQ
   * 
   * @param journey Optional journey to filter entries
   * @param limit Maximum number of entries to retrieve
   * @returns Promise resolving to array of DLQ entries
   */
  async getEntries<T extends BaseEvent>(
    journey?: string,
    limit: number = 100
  ): Promise<DlqEntry<T>[]> {
    let filteredEntries = this.entries;
    
    if (journey) {
      filteredEntries = this.entries.filter(
        entry => entry.metadata.journey === journey
      );
    }
    
    return filteredEntries.slice(0, limit) as DlqEntry<T>[];
  }
  
  /**
   * Reprocesses a specific DLQ entry
   * 
   * @param entryId ID of the DLQ entry to reprocess
   * @returns Promise resolving to boolean indicating success
   */
  async reprocessEntry(entryId: string): Promise<boolean> {
    if (this.shouldFailReprocessing) {
      return false;
    }
    
    const entryIndex = this.entries.findIndex(
      entry => entry.originalEvent.eventId === entryId
    );
    
    if (entryIndex === -1) {
      return false;
    }
    
    this.reprocessedEntries.push(entryId);
    return true;
  }
  
  /**
   * Adds an entry to the mock DLQ
   * 
   * @param entry The entry to add
   */
  addEntry(entry: DlqEntry): void {
    this.entries.push(entry);
  }
  
  /**
   * Gets all entries in the mock DLQ
   * 
   * @returns Array of all DLQ entries
   */
  getAllEntries(): DlqEntry[] {
    return [...this.entries];
  }
  
  /**
   * Gets all reprocessed entry IDs
   * 
   * @returns Array of reprocessed entry IDs
   */
  getReprocessedEntries(): string[] {
    return [...this.reprocessedEntries];
  }
  
  /**
   * Checks if a specific entry was reprocessed
   * 
   * @param entryId The entry ID to check
   * @returns True if the entry was reprocessed
   */
  wasEntryReprocessed(entryId: string): boolean {
    return this.reprocessedEntries.includes(entryId);
  }
  
  /**
   * Configures whether reprocessEntry should fail
   * 
   * @param shouldFail Whether reprocessEntry should return false
   */
  setShouldFailReprocessing(shouldFail: boolean): void {
    this.shouldFailReprocessing = shouldFail;
  }
  
  /**
   * Clears all entries from the mock DLQ
   */
  clearEntries(): void {
    this.entries = [];
  }
  
  /**
   * Clears the history of reprocessed entries
   */
  clearReprocessedEntries(): void {
    this.reprocessedEntries = [];
  }
}

// ===================================================================
// Mock Error Handler
// ===================================================================

/**
 * Mock implementation of error handler for testing
 */
export class MockErrorHandler {
  private handledErrors: Array<{
    error: Error;
    event: BaseEvent;
    context?: Record<string, any>;
  }> = [];
  private shouldRethrow: boolean = false;
  private customResponse: any = null;
  
  /**
   * Handles an error
   * 
   * @param error The error to handle
   * @param event The event being processed
   * @param context Additional context information
   * @returns The custom response or undefined
   * @throws The original error if shouldRethrow is true
   */
  handleError(error: Error, event: BaseEvent, context?: Record<string, any>): any {
    this.handledErrors.push({ error, event, context });
    
    if (this.shouldRethrow) {
      throw error;
    }
    
    return this.customResponse;
  }
  
  /**
   * Gets all handled errors
   * 
   * @returns Array of handled errors with their events and context
   */
  getHandledErrors(): Array<{
    error: Error;
    event: BaseEvent;
    context?: Record<string, any>;
  }> {
    return [...this.handledErrors];
  }
  
  /**
   * Gets the count of handled errors
   * 
   * @returns Number of handled errors
   */
  getHandledErrorCount(): number {
    return this.handledErrors.length;
  }
  
  /**
   * Checks if a specific error type was handled
   * 
   * @param errorType The error constructor to check for
   * @returns True if an error of the specified type was handled
   */
  wasErrorTypeHandled(errorType: new (...args: any[]) => Error): boolean {
    return this.handledErrors.some(entry => entry.error instanceof errorType);
  }
  
  /**
   * Configures whether handleError should rethrow the error
   * 
   * @param shouldRethrow Whether handleError should rethrow the error
   */
  setShouldRethrow(shouldRethrow: boolean): void {
    this.shouldRethrow = shouldRethrow;
  }
  
  /**
   * Sets a custom response to return from handleError
   * 
   * @param response The response to return
   */
  setCustomResponse(response: any): void {
    this.customResponse = response;
  }
  
  /**
   * Clears the history of handled errors
   */
  clearHandledErrors(): void {
    this.handledErrors = [];
  }
}

// ===================================================================
// Factory Functions for Test Scenarios
// ===================================================================

/**
 * Creates a complete test error scenario with all mock components
 * 
 * @param options Configuration options for the test scenario
 * @returns Object containing all mock components for the scenario
 */
export function createTestErrorScenario(options: {
  shouldRetry?: boolean;
  retryDelay?: number;
  shouldSendToDlq?: boolean;
  shouldRethrow?: boolean;
  errorType?: 'validation' | 'processing' | 'database' | 'timeout' | 'external';
  journey?: 'health' | 'care' | 'plan';
  journeyErrorType?: string;
  customErrorMessage?: string;
} = {}) {
  const {
    shouldRetry = false,
    retryDelay = 1000,
    shouldSendToDlq = true,
    shouldRethrow = false,
    errorType = 'processing',
    journey,
    journeyErrorType,
    customErrorMessage
  } = options;
  
  // Create mock components
  const retryPolicy = new MockRetryPolicy('TestScenarioPolicy', shouldRetry, retryDelay);
  const retryFactory = new MockRetryPolicyFactory(shouldRetry, retryDelay);
  const dlqProducer = new MockDlqProducer();
  const dlqConsumer = new MockDlqConsumer();
  const errorHandler = new MockErrorHandler();
  
  // Configure error handler
  errorHandler.setShouldRethrow(shouldRethrow);
  
  // Create appropriate error based on type
  let error: Error;
  
  if (journey && journeyErrorType) {
    error = createMockJourneyError(
      journey,
      journeyErrorType,
      customErrorMessage || `Mock ${journey} ${journeyErrorType} error`,
      {},
      shouldRetry
    );
  } else {
    switch (errorType) {
      case 'validation':
        error = createMockValidationError(
          customErrorMessage || 'Mock validation error'
        );
        break;
      case 'database':
        error = createMockDatabaseError(
          customErrorMessage || 'Mock database error',
          {},
          'query',
          shouldRetry
        );
        break;
      case 'timeout':
        error = createMockTimeoutError(
          customErrorMessage || 'Mock timeout error',
          {},
          5000,
          shouldRetry
        );
        break;
      case 'external':
        error = createMockExternalSystemError(
          customErrorMessage || 'Mock external system error',
          {},
          500,
          shouldRetry
        );
        break;
      case 'processing':
      default:
        error = createMockProcessingError(
          customErrorMessage || 'Mock processing error',
          'PROCESSING_ERROR',
          {},
          shouldRetry
        );
    }
  }
  
  return {
    error,
    retryPolicy,
    retryFactory,
    dlqProducer,
    dlqConsumer,
    errorHandler,
    
    // Helper function to create a test event
    createTestEvent: (eventId: string = 'test-event-id', eventType: string = 'test.event'): BaseEvent => ({
      eventId,
      type: eventType,
      timestamp: new Date().toISOString(),
      source: 'test-service',
      journey: journey || 'test',
      version: '1.0',
      payload: {}
    }),
    
    // Helper function to create a DLQ entry
    createDlqEntry: (event: BaseEvent): DlqEntry => ({
      originalEvent: event,
      metadata: {
        originalEventId: event.eventId,
        errorMessage: error.message,
        errorType: 'system',
        sourceService: event.source || 'test-service',
        journey: (event.journey || 'test') as any,
        dlqTimestamp: new Date().toISOString(),
        retryHistory: []
      }
    })
  };
}

/**
 * Creates a test event with configurable properties
 * 
 * @param options Configuration options for the test event
 * @returns A test event object
 */
export function createTestEvent(options: {
  eventId?: string;
  eventType?: string;
  source?: string;
  journey?: string;
  version?: string;
  payload?: Record<string, any>;
} = {}): BaseEvent {
  const {
    eventId = `test-event-${Date.now()}`,
    eventType = 'test.event',
    source = 'test-service',
    journey = 'test',
    version = '1.0',
    payload = {}
  } = options;
  
  return {
    eventId,
    type: eventType,
    timestamp: new Date().toISOString(),
    source,
    journey,
    version,
    payload
  };
}

/**
 * Creates a retry context for testing
 * 
 * @param options Configuration options for the retry context
 * @returns A retry context object
 */
export function createRetryContext(options: {
  error?: Error;
  attemptCount?: number;
  eventType?: string;
  source?: string;
  metadata?: Record<string, any>;
} = {}): RetryContext {
  const {
    error = new Error('Test error'),
    attemptCount = 1,
    eventType = 'test.event',
    source = 'test-service',
    metadata = {}
  } = options;
  
  return {
    error,
    attemptCount,
    eventType,
    source,
    metadata
  };
}