import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { IBaseEvent } from '../../src/interfaces/base-event.interface';
import { IEventHandler } from '../../src/interfaces/event-handler.interface';
import { IEventResponse } from '../../src/interfaces/event-response.interface';
import { IEventValidator } from '../../src/interfaces/event-validation.interface';
import { IJourneyEvent } from '../../src/interfaces/journey-events.interface';
import { IVersionedEvent } from '../../src/interfaces/event-versioning.interface';

/**
 * Configuration options for the MockEventProcessor
 */
export interface MockEventProcessorOptions {
  /** Whether to validate events before processing */
  validateEvents?: boolean;
  /** Percentage of events that should fail validation (0-100) */
  validationFailureRate?: number;
  /** Percentage of events that should fail processing (0-100) */
  processingFailureRate?: number;
  /** Whether to simulate asynchronous processing */
  asyncProcessing?: boolean;
  /** Delay range for async processing in ms [min, max] */
  processingDelayRange?: [number, number];
  /** Maximum number of retry attempts for failed events */
  maxRetryAttempts?: number;
  /** Whether to collect metrics during processing */
  collectMetrics?: boolean;
  /** Whether to enable transaction support for batch processing */
  enableTransactions?: boolean;
  /** Custom validators to use for event validation */
  validators?: IEventValidator[];
  /** Custom handlers to use for event processing */
  handlers?: IEventHandler<any>[];
}

/**
 * Metrics collected during event processing
 */
export interface EventProcessingMetrics {
  /** Total number of events received */
  totalEventsReceived: number;
  /** Number of events that passed validation */
  validEvents: number;
  /** Number of events that failed validation */
  invalidEvents: number;
  /** Number of events successfully processed */
  successfullyProcessed: number;
  /** Number of events that failed processing */
  failedProcessing: number;
  /** Number of events that were retried */
  retriedEvents: number;
  /** Number of events that exceeded max retry attempts */
  deadLetterEvents: number;
  /** Average processing time in ms */
  averageProcessingTimeMs: number;
  /** Events processed per journey */
  eventsByJourney: Record<string, number>;
  /** Events processed by type */
  eventsByType: Record<string, number>;
}

/**
 * Status of an event in the processing pipeline
 */
enum EventStatus {
  RECEIVED = 'received',
  VALIDATING = 'validating',
  VALIDATED = 'validated',
  VALIDATION_FAILED = 'validation_failed',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  PROCESSING_FAILED = 'processing_failed',
  RETRYING = 'retrying',
  DEAD_LETTER = 'dead_letter',
}

/**
 * Internal tracking of an event through the processing pipeline
 */
interface EventTracking {
  /** Unique tracking ID for this event instance */
  trackingId: string;
  /** The event being processed */
  event: IBaseEvent;
  /** Current status of the event */
  status: EventStatus;
  /** Number of retry attempts made */
  retryCount: number;
  /** Timestamp when the event was received */
  receivedAt: Date;
  /** Timestamp when processing started */
  processingStartedAt?: Date;
  /** Timestamp when processing completed */
  processingCompletedAt?: Date;
  /** Error information if processing failed */
  error?: Error;
  /** Transaction ID if part of a batch */
  transactionId?: string;
}

/**
 * Transaction for batch processing of events
 */
interface EventTransaction {
  /** Unique ID for this transaction */
  id: string;
  /** Events included in this transaction */
  events: EventTracking[];
  /** Whether the transaction is committed */
  committed: boolean;
  /** Whether the transaction is rolled back */
  rolledBack: boolean;
  /** Timestamp when the transaction started */
  startedAt: Date;
  /** Timestamp when the transaction was committed or rolled back */
  completedAt?: Date;
}

/**
 * Mock implementation of an event processor for testing purposes.
 * 
 * This class simulates the full event processing pipeline from reception to handling,
 * allowing tests to verify event transformations, validation, and routing without
 * connecting to actual Kafka topics or processing real events.
 */
export class MockEventProcessor extends EventEmitter {
  private options: Required<MockEventProcessorOptions>;
  private eventQueue: EventTracking[] = [];
  private activeTransactions: Map<string, EventTransaction> = new Map();
  private metrics: EventProcessingMetrics = {
    totalEventsReceived: 0,
    validEvents: 0,
    invalidEvents: 0,
    successfullyProcessed: 0,
    failedProcessing: 0,
    retriedEvents: 0,
    deadLetterEvents: 0,
    averageProcessingTimeMs: 0,
    eventsByJourney: {},
    eventsByType: {},
  };
  private processingTimes: number[] = [];
  private isProcessing = false;
  private validators: IEventValidator[] = [];
  private handlers: Map<string, IEventHandler<any>> = new Map();

  /**
   * Creates a new MockEventProcessor with the specified options
   * 
   * @param options Configuration options for the processor
   */
  constructor(options?: MockEventProcessorOptions) {
    super();
    this.options = {
      validateEvents: options?.validateEvents ?? true,
      validationFailureRate: options?.validationFailureRate ?? 0,
      processingFailureRate: options?.processingFailureRate ?? 0,
      asyncProcessing: options?.asyncProcessing ?? true,
      processingDelayRange: options?.processingDelayRange ?? [10, 50],
      maxRetryAttempts: options?.maxRetryAttempts ?? 3,
      collectMetrics: options?.collectMetrics ?? true,
      enableTransactions: options?.enableTransactions ?? false,
      validators: options?.validators ?? [],
      handlers: options?.handlers ?? [],
    };

    // Initialize validators and handlers
    this.validators = [...this.options.validators];
    this.options.handlers.forEach(handler => {
      this.registerHandler(handler);
    });
  }

  /**
   * Registers a custom event validator
   * 
   * @param validator The validator to register
   */
  registerValidator(validator: IEventValidator): void {
    this.validators.push(validator);
  }

  /**
   * Registers a custom event handler
   * 
   * @param handler The handler to register
   */
  registerHandler(handler: IEventHandler<any>): void {
    const eventType = handler.getEventType();
    this.handlers.set(eventType, handler);
  }

  /**
   * Processes a single event through the pipeline
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing response
   */
  async processEvent(event: IBaseEvent): Promise<IEventResponse> {
    const tracking = this.trackEvent(event);
    
    if (this.options.collectMetrics) {
      this.metrics.totalEventsReceived++;
      
      // Track events by journey and type
      const journeyEvent = event as IJourneyEvent;
      if (journeyEvent.journey) {
        this.metrics.eventsByJourney[journeyEvent.journey] = 
          (this.metrics.eventsByJourney[journeyEvent.journey] || 0) + 1;
      }
      
      this.metrics.eventsByType[event.type] = 
        (this.metrics.eventsByType[event.type] || 0) + 1;
    }

    // If async processing is enabled, add to queue and process asynchronously
    if (this.options.asyncProcessing) {
      this.eventQueue.push(tracking);
      this.startProcessing();
      
      return new Promise((resolve) => {
        const listener = (processedTracking: EventTracking, response: IEventResponse) => {
          if (processedTracking.trackingId === tracking.trackingId) {
            this.removeListener('eventProcessed', listener);
            resolve(response);
          }
        };
        
        this.on('eventProcessed', listener);
      });
    }
    
    // Otherwise, process synchronously
    return this.processEventTracking(tracking);
  }

  /**
   * Processes multiple events as a batch, optionally in a transaction
   * 
   * @param events The events to process
   * @param useTransaction Whether to process the events in a transaction
   * @returns A promise that resolves with the processing responses
   */
  async processBatch(events: IBaseEvent[], useTransaction = false): Promise<IEventResponse[]> {
    const trackingItems: EventTracking[] = events.map(event => this.trackEvent(event));
    
    if (this.options.collectMetrics) {
      this.metrics.totalEventsReceived += events.length;
      
      // Track events by journey and type
      events.forEach(event => {
        const journeyEvent = event as IJourneyEvent;
        if (journeyEvent.journey) {
          this.metrics.eventsByJourney[journeyEvent.journey] = 
            (this.metrics.eventsByJourney[journeyEvent.journey] || 0) + 1;
        }
        
        this.metrics.eventsByType[event.type] = 
          (this.metrics.eventsByType[event.type] || 0) + 1;
      });
    }

    // If transactions are enabled and requested, create a transaction
    let transaction: EventTransaction | undefined;
    if (this.options.enableTransactions && useTransaction) {
      transaction = this.beginTransaction(trackingItems);
    }

    // If async processing is enabled, add to queue and process asynchronously
    if (this.options.asyncProcessing) {
      trackingItems.forEach(tracking => {
        this.eventQueue.push(tracking);
      });
      
      this.startProcessing();
      
      return new Promise((resolve) => {
        const processedEvents = new Map<string, IEventResponse>();
        const trackingIds = new Set(trackingItems.map(t => t.trackingId));
        
        const listener = (processedTracking: EventTracking, response: IEventResponse) => {
          if (trackingIds.has(processedTracking.trackingId)) {
            processedEvents.set(processedTracking.trackingId, response);
            
            // If all events are processed, resolve the promise
            if (processedEvents.size === trackingItems.length) {
              this.removeListener('eventProcessed', listener);
              
              // If using a transaction, commit or rollback based on success
              if (transaction) {
                const allSuccessful = Array.from(processedEvents.values())
                  .every(response => response.success);
                
                if (allSuccessful) {
                  this.commitTransaction(transaction.id);
                } else {
                  this.rollbackTransaction(transaction.id);
                }
              }
              
              resolve(trackingItems.map(t => processedEvents.get(t.trackingId)!));
            }
          }
        };
        
        this.on('eventProcessed', listener);
      });
    }
    
    // Otherwise, process synchronously
    const responses: IEventResponse[] = [];
    
    for (const tracking of trackingItems) {
      const response = await this.processEventTracking(tracking);
      responses.push(response);
      
      // If using a transaction and an event fails, rollback and stop processing
      if (transaction && !response.success) {
        this.rollbackTransaction(transaction.id);
        break;
      }
    }
    
    // If using a transaction and all events succeeded, commit the transaction
    if (transaction && responses.every(r => r.success)) {
      this.commitTransaction(transaction.id);
    }
    
    return responses;
  }

  /**
   * Gets the current metrics for event processing
   * 
   * @returns The current metrics
   */
  getMetrics(): EventProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Resets all metrics to zero
   */
  resetMetrics(): void {
    this.metrics = {
      totalEventsReceived: 0,
      validEvents: 0,
      invalidEvents: 0,
      successfullyProcessed: 0,
      failedProcessing: 0,
      retriedEvents: 0,
      deadLetterEvents: 0,
      averageProcessingTimeMs: 0,
      eventsByJourney: {},
      eventsByType: {},
    };
    this.processingTimes = [];
  }

  /**
   * Gets all events in the dead letter queue (events that exceeded max retry attempts)
   * 
   * @returns Array of events in the dead letter queue
   */
  getDeadLetterEvents(): IBaseEvent[] {
    return this.eventQueue
      .filter(tracking => tracking.status === EventStatus.DEAD_LETTER)
      .map(tracking => tracking.event);
  }

  /**
   * Clears all events from the processing queue
   */
  clearQueue(): void {
    this.eventQueue = [];
  }

  /**
   * Begins a new transaction for batch processing
   * 
   * @param events Events to include in the transaction
   * @returns The created transaction
   */
  private beginTransaction(events: EventTracking[]): EventTransaction {
    const transactionId = uuidv4();
    
    // Mark all events as part of this transaction
    events.forEach(event => {
      event.transactionId = transactionId;
    });
    
    const transaction: EventTransaction = {
      id: transactionId,
      events,
      committed: false,
      rolledBack: false,
      startedAt: new Date(),
    };
    
    this.activeTransactions.set(transactionId, transaction);
    return transaction;
  }

  /**
   * Commits a transaction, finalizing all event processing
   * 
   * @param transactionId ID of the transaction to commit
   */
  private commitTransaction(transactionId: string): void {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    transaction.committed = true;
    transaction.completedAt = new Date();
    this.activeTransactions.delete(transactionId);
    
    this.emit('transactionCommitted', transaction);
  }

  /**
   * Rolls back a transaction, reverting all event processing
   * 
   * @param transactionId ID of the transaction to roll back
   */
  private rollbackTransaction(transactionId: string): void {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    transaction.rolledBack = true;
    transaction.completedAt = new Date();
    this.activeTransactions.delete(transactionId);
    
    this.emit('transactionRolledBack', transaction);
  }

  /**
   * Creates tracking information for an event
   * 
   * @param event The event to track
   * @returns Tracking information for the event
   */
  private trackEvent(event: IBaseEvent): EventTracking {
    return {
      trackingId: uuidv4(),
      event,
      status: EventStatus.RECEIVED,
      retryCount: 0,
      receivedAt: new Date(),
    };
  }

  /**
   * Starts asynchronous processing of the event queue
   */
  private startProcessing(): void {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    this.processNextEvent();
  }

  /**
   * Processes the next event in the queue
   */
  private async processNextEvent(): Promise<void> {
    if (this.eventQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    const tracking = this.eventQueue.shift()!;
    
    // Simulate processing delay
    if (this.options.asyncProcessing) {
      const [min, max] = this.options.processingDelayRange;
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const response = await this.processEventTracking(tracking);
    this.emit('eventProcessed', tracking, response);
    
    // Continue processing the queue
    this.processNextEvent();
  }

  /**
   * Processes a tracked event through validation and handling
   * 
   * @param tracking The event tracking information
   * @returns The processing response
   */
  private async processEventTracking(tracking: EventTracking): Promise<IEventResponse> {
    const startTime = Date.now();
    tracking.processingStartedAt = new Date();
    
    // Validate the event if validation is enabled
    if (this.options.validateEvents) {
      tracking.status = EventStatus.VALIDATING;
      
      // Check if we should simulate a validation failure
      const shouldFailValidation = Math.random() * 100 < this.options.validationFailureRate;
      
      if (shouldFailValidation) {
        tracking.status = EventStatus.VALIDATION_FAILED;
        tracking.error = new Error('Simulated validation failure');
        
        if (this.options.collectMetrics) {
          this.metrics.invalidEvents++;
        }
        
        tracking.processingCompletedAt = new Date();
        return {
          success: false,
          error: {
            message: 'Event validation failed',
            code: 'VALIDATION_ERROR',
            details: tracking.error.message,
          },
        };
      }
      
      // Run through registered validators
      for (const validator of this.validators) {
        const validationResult = await validator.validate(tracking.event);
        
        if (!validationResult.valid) {
          tracking.status = EventStatus.VALIDATION_FAILED;
          tracking.error = new Error(validationResult.errors?.join(', ') || 'Validation failed');
          
          if (this.options.collectMetrics) {
            this.metrics.invalidEvents++;
          }
          
          tracking.processingCompletedAt = new Date();
          return {
            success: false,
            error: {
              message: 'Event validation failed',
              code: 'VALIDATION_ERROR',
              details: validationResult.errors,
            },
          };
        }
      }
      
      tracking.status = EventStatus.VALIDATED;
      
      if (this.options.collectMetrics) {
        this.metrics.validEvents++;
      }
    }
    
    // Process the event
    tracking.status = EventStatus.PROCESSING;
    
    // Check if we should simulate a processing failure
    const shouldFailProcessing = Math.random() * 100 < this.options.processingFailureRate;
    
    if (shouldFailProcessing) {
      tracking.status = EventStatus.PROCESSING_FAILED;
      tracking.error = new Error('Simulated processing failure');
      
      // Check if we should retry
      if (tracking.retryCount < this.options.maxRetryAttempts) {
        tracking.status = EventStatus.RETRYING;
        tracking.retryCount++;
        
        if (this.options.collectMetrics) {
          this.metrics.retriedEvents++;
        }
        
        // Add back to the queue with exponential backoff
        const backoffDelay = Math.pow(2, tracking.retryCount) * 100;
        setTimeout(() => {
          this.eventQueue.push(tracking);
          this.startProcessing();
        }, backoffDelay);
        
        return {
          success: false,
          error: {
            message: 'Event processing failed, retrying',
            code: 'PROCESSING_RETRY',
            details: tracking.error.message,
          },
          retryCount: tracking.retryCount,
          retryAfter: backoffDelay,
        };
      }
      
      // Max retries exceeded, move to dead letter
      tracking.status = EventStatus.DEAD_LETTER;
      
      if (this.options.collectMetrics) {
        this.metrics.failedProcessing++;
        this.metrics.deadLetterEvents++;
      }
      
      tracking.processingCompletedAt = new Date();
      return {
        success: false,
        error: {
          message: 'Event processing failed after max retries',
          code: 'MAX_RETRIES_EXCEEDED',
          details: tracking.error.message,
        },
        retryCount: tracking.retryCount,
        deadLetter: true,
      };
    }
    
    // Find a handler for this event type
    const handler = this.handlers.get(tracking.event.type);
    
    if (!handler) {
      tracking.status = EventStatus.PROCESSING_FAILED;
      tracking.error = new Error(`No handler registered for event type: ${tracking.event.type}`);
      
      if (this.options.collectMetrics) {
        this.metrics.failedProcessing++;
      }
      
      tracking.processingCompletedAt = new Date();
      return {
        success: false,
        error: {
          message: 'No handler found for event type',
          code: 'HANDLER_NOT_FOUND',
          details: tracking.error.message,
        },
      };
    }
    
    // Check if the handler can handle this specific event
    if (!handler.canHandle(tracking.event)) {
      tracking.status = EventStatus.PROCESSING_FAILED;
      tracking.error = new Error(`Handler cannot process this event: ${tracking.event.type}`);
      
      if (this.options.collectMetrics) {
        this.metrics.failedProcessing++;
      }
      
      tracking.processingCompletedAt = new Date();
      return {
        success: false,
        error: {
          message: 'Handler cannot process this event',
          code: 'HANDLER_INCOMPATIBLE',
          details: tracking.error.message,
        },
      };
    }
    
    try {
      // Handle versioned events if applicable
      let eventToProcess = tracking.event;
      if ('version' in tracking.event) {
        const versionedEvent = tracking.event as IVersionedEvent;
        // Here we would normally handle version compatibility
        // For the mock, we just pass it through
        eventToProcess = versionedEvent;
      }
      
      // Process the event with the handler
      const result = await handler.handle(eventToProcess);
      
      tracking.status = EventStatus.PROCESSED;
      
      if (this.options.collectMetrics) {
        this.metrics.successfullyProcessed++;
      }
      
      tracking.processingCompletedAt = new Date();
      
      // Update processing time metrics
      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);
      this.updateAverageProcessingTime();
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      tracking.status = EventStatus.PROCESSING_FAILED;
      tracking.error = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      if (tracking.retryCount < this.options.maxRetryAttempts) {
        tracking.status = EventStatus.RETRYING;
        tracking.retryCount++;
        
        if (this.options.collectMetrics) {
          this.metrics.retriedEvents++;
        }
        
        // Add back to the queue with exponential backoff
        const backoffDelay = Math.pow(2, tracking.retryCount) * 100;
        setTimeout(() => {
          this.eventQueue.push(tracking);
          this.startProcessing();
        }, backoffDelay);
        
        return {
          success: false,
          error: {
            message: 'Event processing failed, retrying',
            code: 'PROCESSING_RETRY',
            details: tracking.error.message,
          },
          retryCount: tracking.retryCount,
          retryAfter: backoffDelay,
        };
      }
      
      // Max retries exceeded, move to dead letter
      tracking.status = EventStatus.DEAD_LETTER;
      
      if (this.options.collectMetrics) {
        this.metrics.failedProcessing++;
        this.metrics.deadLetterEvents++;
      }
      
      tracking.processingCompletedAt = new Date();
      return {
        success: false,
        error: {
          message: 'Event processing failed after max retries',
          code: 'MAX_RETRIES_EXCEEDED',
          details: tracking.error.message,
        },
        retryCount: tracking.retryCount,
        deadLetter: true,
      };
    }
  }

  /**
   * Updates the average processing time metric
   */
  private updateAverageProcessingTime(): void {
    if (this.processingTimes.length === 0) {
      this.metrics.averageProcessingTimeMs = 0;
      return;
    }
    
    const sum = this.processingTimes.reduce((acc, time) => acc + time, 0);
    this.metrics.averageProcessingTimeMs = Math.round(sum / this.processingTimes.length);
  }
}