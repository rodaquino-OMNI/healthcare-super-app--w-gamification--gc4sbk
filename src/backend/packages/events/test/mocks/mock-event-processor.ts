import { EventEmitter } from 'events';
import { IEventHandler } from '../../src/interfaces/event-handler.interface';
import { IBaseEvent } from '../../src/interfaces/base-event.interface';
import { ValidationResult } from '../../src/interfaces/event-validation.interface';
import { EventResponse } from '../../src/interfaces/event-response.interface';
import { IVersionedEvent } from '../../src/interfaces/event-versioning.interface';
import { EventTypes } from '../../src/dto/event-types.enum';

/**
 * Configuration options for the MockEventProcessor
 */
export interface MockEventProcessorOptions {
  /** Whether validation should succeed */
  validationShouldSucceed?: boolean;
  /** Whether processing should succeed */
  processingShouldSucceed?: boolean;
  /** Simulated processing delay in milliseconds */
  processingDelay?: number;
  /** Custom validation error message */
  validationErrorMessage?: string;
  /** Custom processing error message */
  processingErrorMessage?: string;
  /** Number of retries before success (for testing retry mechanisms) */
  retriesBeforeSuccess?: number;
  /** Whether to collect metrics during processing */
  collectMetrics?: boolean;
  /** Whether to simulate a network failure during processing */
  simulateNetworkFailure?: boolean;
  /** Probability of random failure (0-1) */
  randomFailureProbability?: number;
  /** Whether to validate event schema */
  validateSchema?: boolean;
  /** Whether to check event version compatibility */
  checkVersionCompatibility?: boolean;
  /** Whether to simulate transaction for batch processing */
  simulateTransaction?: boolean;
  /** Custom event handler for specific event types */
  customHandlers?: Map<string, (event: IBaseEvent) => Promise<EventResponse>>;
}

/**
 * Metrics collected during event processing
 */
export interface EventProcessingMetrics {
  /** Total number of events processed */
  totalProcessed: number;
  /** Number of successful events */
  successful: number;
  /** Number of failed events */
  failed: number;
  /** Number of validation errors */
  validationErrors: number;
  /** Number of processing errors */
  processingErrors: number;
  /** Number of retries performed */
  retries: number;
  /** Average processing time in milliseconds */
  averageProcessingTimeMs: number;
  /** Events processed by type */
  eventsByType: Map<string, number>;
  /** Events processed by journey */
  eventsByJourney: Map<string, number>;
}

/**
 * Result of a batch processing operation
 */
export interface BatchProcessingResult {
  /** Overall success status of the batch */
  success: boolean;
  /** Total number of events in the batch */
  totalEvents: number;
  /** Number of successful events */
  successfulEvents: number;
  /** Number of failed events */
  failedEvents: number;
  /** Individual results for each event */
  results: EventResponse[];
  /** Transaction ID if transaction simulation is enabled */
  transactionId?: string;
  /** Whether the transaction was committed */
  transactionCommitted?: boolean;
}

/**
 * A comprehensive mock implementation of the event processing pipeline for testing.
 * 
 * This service simulates the full event processing flow from reception to handling,
 * allowing tests to verify event transformations, validation, and routing without
 * connecting to actual Kafka topics or processing real events.
 */
export class MockEventProcessor<T extends IBaseEvent = IBaseEvent> implements IEventHandler<T> {
  private options: MockEventProcessorOptions;
  private retryAttempts: Map<string, number> = new Map();
  private metrics: EventProcessingMetrics;
  private eventEmitter = new EventEmitter();
  private processingTimes: number[] = [];
  private supportedEventTypes: Set<string>;
  private journeyHandlers: Map<string, (event: IBaseEvent) => Promise<EventResponse>>;
  
  /**
   * Creates a new MockEventProcessor with the specified options
   * 
   * @param options Configuration options for the mock processor
   * @param supportedEventTypes Optional set of event types this processor supports
   */
  constructor(
    options: MockEventProcessorOptions = {},
    supportedEventTypes: string[] = Object.values(EventTypes)
  ) {
    this.options = {
      validationShouldSucceed: true,
      processingShouldSucceed: true,
      processingDelay: 0,
      validationErrorMessage: 'Event validation failed',
      processingErrorMessage: 'Event processing failed',
      retriesBeforeSuccess: 0,
      collectMetrics: true,
      simulateNetworkFailure: false,
      randomFailureProbability: 0,
      validateSchema: true,
      checkVersionCompatibility: true,
      simulateTransaction: false,
      customHandlers: new Map(),
      ...options
    };
    
    this.supportedEventTypes = new Set(supportedEventTypes);
    this.resetMetrics();
    this.initializeJourneyHandlers();
  }
  
  /**
   * Initialize handlers for different journey types
   */
  private initializeJourneyHandlers(): void {
    this.journeyHandlers = new Map([
      ['health', this.handleHealthEvent.bind(this)],
      ['care', this.handleCareEvent.bind(this)],
      ['plan', this.handlePlanEvent.bind(this)]
    ]);
  }
  
  /**
   * Resets all collected metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      validationErrors: 0,
      processingErrors: 0,
      retries: 0,
      averageProcessingTimeMs: 0,
      eventsByType: new Map(),
      eventsByJourney: new Map()
    };
    this.processingTimes = [];
    this.retryAttempts.clear();
  }
  
  /**
   * Gets the current metrics
   */
  public getMetrics(): EventProcessingMetrics {
    // Calculate average processing time
    if (this.processingTimes.length > 0) {
      const sum = this.processingTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageProcessingTimeMs = sum / this.processingTimes.length;
    }
    
    return { ...this.metrics };
  }
  
  /**
   * Updates metrics based on event processing
   */
  private updateMetrics(event: IBaseEvent, success: boolean, validationError = false): void {
    if (!this.options.collectMetrics) return;
    
    this.metrics.totalProcessed++;
    
    if (success) {
      this.metrics.successful++;
    } else {
      this.metrics.failed++;
      if (validationError) {
        this.metrics.validationErrors++;
      } else {
        this.metrics.processingErrors++;
      }
    }
    
    // Track by event type
    const currentTypeCount = this.metrics.eventsByType.get(event.type) || 0;
    this.metrics.eventsByType.set(event.type, currentTypeCount + 1);
    
    // Track by journey
    if (event.journey) {
      const currentJourneyCount = this.metrics.eventsByJourney.get(event.journey) || 0;
      this.metrics.eventsByJourney.set(event.journey, currentJourneyCount + 1);
    }
  }
  
  /**
   * Checks if this processor can handle the given event type
   */
  public canHandle(event: T): boolean {
    return this.supportedEventTypes.has(event.type);
  }
  
  /**
   * Gets the event types this processor can handle
   */
  public getEventType(): string[] {
    return Array.from(this.supportedEventTypes);
  }
  
  /**
   * Validates an event against its schema
   */
  private validateEvent(event: T): ValidationResult {
    // Skip validation if not enabled
    if (!this.options.validateSchema) {
      return { valid: true };
    }
    
    // Simulate validation failure if configured
    if (!this.options.validationShouldSucceed) {
      return {
        valid: false,
        errors: [{
          field: 'payload',
          message: this.options.validationErrorMessage || 'Event validation failed'
        }]
      };
    }
    
    // Perform basic structure validation
    if (!event.type || !event.timestamp || !event.eventId) {
      return {
        valid: false,
        errors: [{
          field: 'event',
          message: 'Missing required fields: type, timestamp, or eventId'
        }]
      };
    }
    
    // Check version compatibility if enabled
    if (this.options.checkVersionCompatibility && this.isVersionedEvent(event)) {
      if (!this.isVersionCompatible(event)) {
        return {
          valid: false,
          errors: [{
            field: 'version',
            message: `Incompatible event version: ${event.version}`
          }]
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Checks if an event is a versioned event
   */
  private isVersionedEvent(event: any): event is IVersionedEvent {
    return typeof event.version === 'string' && event.version.match(/^\d+\.\d+\.\d+$/);
  }
  
  /**
   * Checks if an event version is compatible
   * This is a simplified version that just checks if the major version is supported
   */
  private isVersionCompatible(event: IVersionedEvent): boolean {
    // For testing purposes, we'll consider versions with major version 1 or 2 as compatible
    const majorVersion = parseInt(event.version.split('.')[0], 10);
    return majorVersion <= 2;
  }
  
  /**
   * Processes a single event
   */
  public async handle(event: T): Promise<EventResponse> {
    const startTime = Date.now();
    let response: EventResponse;
    
    try {
      // Check if we can handle this event type
      if (!this.canHandle(event)) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_EVENT_TYPE',
            message: `Event type ${event.type} is not supported by this processor`
          }
        };
      }
      
      // Validate the event
      const validationResult = this.validateEvent(event);
      if (!validationResult.valid) {
        this.updateMetrics(event, false, true);
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.errors?.[0]?.message || 'Validation failed',
            details: validationResult.errors
          }
        };
      }
      
      // Get current retry attempt
      const eventId = event.eventId;
      const currentAttempt = this.retryAttempts.get(eventId) || 0;
      
      // Check if we should succeed based on retry configuration
      const shouldSucceed = this.options.processingShouldSucceed || 
        (this.options.retriesBeforeSuccess !== undefined && 
         currentAttempt >= this.options.retriesBeforeSuccess);
      
      // Check for random failure
      const randomFailure = this.options.randomFailureProbability !== undefined && 
        Math.random() < this.options.randomFailureProbability;
      
      // Simulate processing delay
      if (this.options.processingDelay && this.options.processingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.options.processingDelay));
      }
      
      // Simulate network failure
      if (this.options.simulateNetworkFailure) {
        throw new Error('Network failure during event processing');
      }
      
      // Process the event based on journey type
      if (shouldSucceed && !randomFailure) {
        // Use custom handler if available for this event type
        if (this.options.customHandlers?.has(event.type)) {
          const customHandler = this.options.customHandlers.get(event.type);
          response = await customHandler!(event);
        } else if (event.journey && this.journeyHandlers.has(event.journey)) {
          // Use journey-specific handler
          const journeyHandler = this.journeyHandlers.get(event.journey);
          response = await journeyHandler!(event);
        } else {
          // Default success response
          response = {
            success: true,
            data: {
              eventId: event.eventId,
              processed: true,
              timestamp: new Date().toISOString()
            }
          };
        }
        
        // Emit success event
        this.eventEmitter.emit('eventProcessed', event, response);
      } else {
        // Increment retry counter
        this.retryAttempts.set(eventId, currentAttempt + 1);
        this.metrics.retries++;
        
        // Return failure response
        response = {
          success: false,
          error: {
            code: 'PROCESSING_ERROR',
            message: this.options.processingErrorMessage || 'Event processing failed',
            retryable: true,
            attempt: currentAttempt + 1
          }
        };
        
        // Emit failure event
        this.eventEmitter.emit('eventFailed', event, response);
      }
      
      // Update metrics
      this.updateMetrics(event, response.success);
      
      // Track processing time
      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);
      
      return response;
    } catch (error) {
      // Handle unexpected errors
      const errorResponse: EventResponse = {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error during event processing',
          retryable: true
        }
      };
      
      // Update metrics
      this.updateMetrics(event, false);
      
      // Emit error event
      this.eventEmitter.emit('eventError', event, error);
      
      return errorResponse;
    }
  }
  
  /**
   * Processes a batch of events, optionally in a transaction
   */
  public async processBatch(events: T[]): Promise<BatchProcessingResult> {
    const results: EventResponse[] = [];
    let transactionId: string | undefined;
    let transactionCommitted = false;
    
    // Start transaction if enabled
    if (this.options.simulateTransaction) {
      transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      this.eventEmitter.emit('transactionStarted', transactionId, events.length);
    }
    
    try {
      // Process each event
      for (const event of events) {
        const result = await this.handle(event);
        results.push(result);
        
        // If transaction is enabled and any event fails, we might want to abort
        // For this mock, we'll continue processing but mark the transaction as failed
      }
      
      // Calculate success/failure counts
      const successfulEvents = results.filter(r => r.success).length;
      const failedEvents = results.length - successfulEvents;
      
      // Commit transaction if all events succeeded
      if (this.options.simulateTransaction) {
        if (failedEvents === 0) {
          transactionCommitted = true;
          this.eventEmitter.emit('transactionCommitted', transactionId);
        } else {
          this.eventEmitter.emit('transactionRolledBack', transactionId, failedEvents);
        }
      }
      
      return {
        success: failedEvents === 0,
        totalEvents: events.length,
        successfulEvents,
        failedEvents,
        results,
        transactionId,
        transactionCommitted
      };
    } catch (error) {
      // Rollback transaction on unexpected error
      if (this.options.simulateTransaction) {
        this.eventEmitter.emit('transactionRolledBack', transactionId, events.length);
      }
      
      // Return failure result
      return {
        success: false,
        totalEvents: events.length,
        successfulEvents: 0,
        failedEvents: events.length,
        results: events.map(() => ({
          success: false,
          error: {
            code: 'BATCH_PROCESSING_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error during batch processing',
            retryable: true
          }
        })),
        transactionId,
        transactionCommitted: false
      };
    }
  }
  
  /**
   * Subscribes to event processing events
   */
  public on(event: 'eventProcessed' | 'eventFailed' | 'eventError' | 'transactionStarted' | 'transactionCommitted' | 'transactionRolledBack', 
           listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * Removes an event listener
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
  
  /**
   * Handles health journey events
   */
  private async handleHealthEvent(event: IBaseEvent): Promise<EventResponse> {
    // Simulate health journey specific processing
    const eventType = event.type.toLowerCase();
    
    if (eventType.includes('metric')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'health',
          processed: true,
          metricProcessed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    if (eventType.includes('goal')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'health',
          processed: true,
          goalProcessed: true,
          achievementEligible: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    if (eventType.includes('device')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'health',
          processed: true,
          deviceProcessed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Default health event response
    return {
      success: true,
      data: {
        eventId: event.eventId,
        journey: 'health',
        processed: true,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Handles care journey events
   */
  private async handleCareEvent(event: IBaseEvent): Promise<EventResponse> {
    // Simulate care journey specific processing
    const eventType = event.type.toLowerCase();
    
    if (eventType.includes('appointment')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'care',
          processed: true,
          appointmentProcessed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    if (eventType.includes('medication')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'care',
          processed: true,
          medicationProcessed: true,
          adherenceTracked: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    if (eventType.includes('telemedicine')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'care',
          processed: true,
          telemedicineProcessed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Default care event response
    return {
      success: true,
      data: {
        eventId: event.eventId,
        journey: 'care',
        processed: true,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Handles plan journey events
   */
  private async handlePlanEvent(event: IBaseEvent): Promise<EventResponse> {
    // Simulate plan journey specific processing
    const eventType = event.type.toLowerCase();
    
    if (eventType.includes('claim')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'plan',
          processed: true,
          claimProcessed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    if (eventType.includes('benefit')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'plan',
          processed: true,
          benefitProcessed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    if (eventType.includes('plan')) {
      return {
        success: true,
        data: {
          eventId: event.eventId,
          journey: 'plan',
          processed: true,
          planProcessed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Default plan event response
    return {
      success: true,
      data: {
        eventId: event.eventId,
        journey: 'plan',
        processed: true,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Calculates exponential backoff time for retries
   * 
   * @param attempt Current retry attempt (0-based)
   * @param baseDelayMs Base delay in milliseconds
   * @param maxDelayMs Maximum delay in milliseconds
   * @param jitter Whether to add random jitter
   */
  public static calculateBackoff(
    attempt: number, 
    baseDelayMs = 100, 
    maxDelayMs = 30000,
    jitter = true
  ): number {
    // Calculate exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
    
    // Add jitter if enabled (±20%)
    if (jitter) {
      const jitterFactor = 0.8 + (Math.random() * 0.4); // 0.8-1.2 range
      return Math.floor(cappedDelay * jitterFactor);
    }
    
    return Math.floor(cappedDelay);
  }
  
  /**
   * Creates a retry policy function that can be used with event processing
   * 
   * @param maxRetries Maximum number of retry attempts
   * @param baseDelayMs Base delay in milliseconds
   * @param maxDelayMs Maximum delay in milliseconds
   */
  public static createRetryPolicy(
    maxRetries = 3,
    baseDelayMs = 100,
    maxDelayMs = 30000
  ): (attempt: number, error: Error) => { retry: boolean; delayMs: number } {
    return (attempt: number, error: Error) => {
      // Determine if we should retry based on attempt count
      const shouldRetry = attempt < maxRetries;
      
      // Calculate delay with exponential backoff if retrying
      const delayMs = shouldRetry 
        ? MockEventProcessor.calculateBackoff(attempt, baseDelayMs, maxDelayMs) 
        : 0;
      
      return { retry: shouldRetry, delayMs };
    };
  }
}