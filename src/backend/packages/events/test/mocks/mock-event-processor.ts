import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Import types from the events package
import { EventTypes } from '../../src/dto/event-types.enum';
import { EventMetadata } from '../../src/dto/event-metadata.dto';
import { VersionedEvent } from '../../src/dto/version.dto';
import { ErrorCodes } from '../../src/constants/errors.constants';

/**
 * Configuration options for the mock event processor
 */
export interface MockEventProcessorOptions {
  /** Whether to validate events before processing */
  validateEvents?: boolean;
  /** Whether to simulate processing delays */
  simulateProcessingDelay?: boolean;
  /** Base processing delay in milliseconds */
  processingDelayMs?: number;
  /** Whether to collect metrics during processing */
  collectMetrics?: boolean;
  /** Whether to simulate random failures */
  simulateRandomFailures?: boolean;
  /** Failure rate (0-1) when simulating random failures */
  failureRate?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay for retry backoff in milliseconds */
  retryBaseDelayMs?: number;
  /** Whether to use exponential backoff for retries */
  useExponentialBackoff?: boolean;
  /** Whether to track event processing history */
  trackHistory?: boolean;
  /** Whether to use transaction batching */
  useTransactions?: boolean;
  /** Maximum batch size for transactions */
  maxBatchSize?: number;
  /** Whether to simulate network issues */
  simulateNetworkIssues?: boolean;
  /** Network issue rate (0-1) when simulating network issues */
  networkIssueRate?: number;
  /** Whether to validate event schema versions */
  validateSchemaVersions?: boolean;
  /** Whether to simulate schema evolution */
  simulateSchemaEvolution?: boolean;
}

/**
 * Event processing result status
 */
export enum EventProcessingStatus {
  SUCCESS = 'success',
  VALIDATION_ERROR = 'validation_error',
  PROCESSING_ERROR = 'processing_error',
  RETRY = 'retry',
  DEAD_LETTER = 'dead_letter',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  SCHEMA_ERROR = 'schema_error',
}

/**
 * Event processing result
 */
export interface EventProcessingResult<T = any> {
  /** Unique ID for this processing attempt */
  processingId: string;
  /** Original event that was processed */
  event: T;
  /** Processing status */
  status: EventProcessingStatus;
  /** Error message if processing failed */
  error?: string;
  /** Error code if processing failed */
  errorCode?: string;
  /** Processing timestamp */
  timestamp: Date;
  /** Processing duration in milliseconds */
  durationMs: number;
  /** Number of retry attempts if applicable */
  retryCount?: number;
  /** Whether the event was processed in a transaction */
  inTransaction?: boolean;
  /** Transaction ID if processed in a transaction */
  transactionId?: string;
  /** Journey associated with the event */
  journey?: string;
  /** Event type */
  eventType?: string;
  /** User ID associated with the event */
  userId?: string;
  /** Metadata associated with the event */
  metadata?: EventMetadata;
}

/**
 * Event processing metrics
 */
export interface EventProcessingMetrics {
  /** Total number of events processed */
  totalProcessed: number;
  /** Number of successfully processed events */
  successful: number;
  /** Number of failed events */
  failed: number;
  /** Number of events that required retries */
  retried: number;
  /** Number of events sent to dead letter queue */
  deadLettered: number;
  /** Number of events with validation errors */
  validationErrors: number;
  /** Number of events with schema errors */
  schemaErrors: number;
  /** Number of events with network errors */
  networkErrors: number;
  /** Number of events that timed out */
  timeouts: number;
  /** Average processing time in milliseconds */
  averageProcessingTimeMs: number;
  /** Processing times by journey */
  processingTimeByJourney: Record<string, number>;
  /** Processing times by event type */
  processingTimeByEventType: Record<string, number>;
  /** Error counts by error code */
  errorsByCode: Record<string, number>;
  /** Counts by journey */
  countsByJourney: Record<string, number>;
  /** Counts by event type */
  countsByEventType: Record<string, number>;
}

/**
 * Event processing history entry
 */
export interface EventProcessingHistoryEntry<T = any> extends EventProcessingResult<T> {
  /** Sequence number in the processing history */
  sequence: number;
}

/**
 * Transaction batch
 */
export interface TransactionBatch<T = any> {
  /** Transaction ID */
  id: string;
  /** Events in the batch */
  events: T[];
  /** Transaction start timestamp */
  startedAt: Date;
  /** Transaction completion timestamp */
  completedAt?: Date;
  /** Transaction status */
  status: 'pending' | 'committed' | 'rolled_back';
  /** Error if transaction failed */
  error?: string;
}

/**
 * Mock implementation of an event processor for testing
 */
export class MockEventProcessor<T = any> extends EventEmitter {
  private options: Required<MockEventProcessorOptions>;
  private metrics: EventProcessingMetrics;
  private history: EventProcessingHistoryEntry<T>[] = [];
  private pendingTransactions: Map<string, TransactionBatch<T>> = new Map();
  private processingQueue: T[] = [];
  private isProcessing = false;
  private historySequence = 0;
  private schemaVersions: Map<string, number> = new Map();

  /**
   * Creates a new MockEventProcessor instance
   * 
   * @param options Configuration options
   */
  constructor(options: MockEventProcessorOptions = {}) {
    super();
    
    // Set default options
    this.options = {
      validateEvents: true,
      simulateProcessingDelay: false,
      processingDelayMs: 100,
      collectMetrics: true,
      simulateRandomFailures: false,
      failureRate: 0.1,
      maxRetries: 3,
      retryBaseDelayMs: 200,
      useExponentialBackoff: true,
      trackHistory: true,
      useTransactions: false,
      maxBatchSize: 10,
      simulateNetworkIssues: false,
      networkIssueRate: 0.05,
      validateSchemaVersions: true,
      simulateSchemaEvolution: false,
      ...options,
    };

    // Initialize metrics
    this.resetMetrics();

    // Initialize schema versions
    this.initializeSchemaVersions();
  }

  /**
   * Initializes schema versions for different event types
   */
  private initializeSchemaVersions(): void {
    // Set initial versions for all event types
    Object.values(EventTypes).forEach(eventType => {
      this.schemaVersions.set(eventType, 1);
    });
  }

  /**
   * Resets the metrics to initial values
   */
  public resetMetrics(): void {
    this.metrics = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      retried: 0,
      deadLettered: 0,
      validationErrors: 0,
      schemaErrors: 0,
      networkErrors: 0,
      timeouts: 0,
      averageProcessingTimeMs: 0,
      processingTimeByJourney: {},
      processingTimeByEventType: {},
      errorsByCode: {},
      countsByJourney: {},
      countsByEventType: {},
    };
  }

  /**
   * Clears the processing history
   */
  public clearHistory(): void {
    this.history = [];
    this.historySequence = 0;
  }

  /**
   * Gets the current metrics
   * 
   * @returns Current event processing metrics
   */
  public getMetrics(): EventProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Gets the processing history
   * 
   * @returns Array of processing history entries
   */
  public getHistory(): EventProcessingHistoryEntry<T>[] {
    return [...this.history];
  }

  /**
   * Gets the pending transactions
   * 
   * @returns Map of transaction ID to transaction batch
   */
  public getPendingTransactions(): Map<string, TransactionBatch<T>> {
    return new Map(this.pendingTransactions);
  }

  /**
   * Processes a single event
   * 
   * @param event Event to process
   * @param retryCount Current retry count (default: 0)
   * @returns Promise that resolves to the processing result
   */
  public async processEvent(event: T, retryCount = 0): Promise<EventProcessingResult<T>> {
    const startTime = Date.now();
    const processingId = uuidv4();
    
    try {
      // Extract event information for metrics and logging
      const eventInfo = this.extractEventInfo(event);
      
      // Validate the event if enabled
      if (this.options.validateEvents) {
        const validationResult = this.validateEvent(event);
        if (!validationResult.valid) {
          return this.handleValidationError(event, validationResult.error, processingId, startTime, eventInfo);
        }
      }
      
      // Validate schema version if enabled
      if (this.options.validateSchemaVersions) {
        const versionValidationResult = this.validateSchemaVersion(event);
        if (!versionValidationResult.valid) {
          return this.handleSchemaError(event, versionValidationResult.error, processingId, startTime, eventInfo);
        }
      }
      
      // Simulate network issues if enabled
      if (this.options.simulateNetworkIssues && Math.random() < this.options.networkIssueRate) {
        return this.handleNetworkError(event, processingId, startTime, retryCount, eventInfo);
      }
      
      // Simulate random failures if enabled
      if (this.options.simulateRandomFailures && Math.random() < this.options.failureRate) {
        return this.handleRandomFailure(event, processingId, startTime, retryCount, eventInfo);
      }
      
      // Simulate processing delay if enabled
      if (this.options.simulateProcessingDelay) {
        await this.delay(this.options.processingDelayMs);
      }
      
      // Process the event successfully
      const result: EventProcessingResult<T> = {
        processingId,
        event,
        status: EventProcessingStatus.SUCCESS,
        timestamp: new Date(),
        durationMs: Date.now() - startTime,
        retryCount,
        journey: eventInfo.journey,
        eventType: eventInfo.eventType,
        userId: eventInfo.userId,
        metadata: eventInfo.metadata,
      };
      
      // Update metrics if enabled
      if (this.options.collectMetrics) {
        this.updateMetricsForSuccess(result);
      }
      
      // Add to history if enabled
      if (this.options.trackHistory) {
        this.addToHistory(result);
      }
      
      // Emit success event
      this.emit('success', result);
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      return this.handleUnexpectedError(event, error, processingId, startTime, retryCount);
    }
  }

  /**
   * Processes multiple events
   * 
   * @param events Array of events to process
   * @param useTransaction Whether to process events in a transaction
   * @returns Promise that resolves to an array of processing results
   */
  public async processEvents(events: T[], useTransaction = false): Promise<EventProcessingResult<T>[]> {
    if (useTransaction || this.options.useTransactions) {
      return this.processEventsInTransaction(events);
    } else {
      const results: EventProcessingResult<T>[] = [];
      
      for (const event of events) {
        const result = await this.processEvent(event);
        results.push(result);
      }
      
      return results;
    }
  }

  /**
   * Processes events in a transaction
   * 
   * @param events Array of events to process
   * @returns Promise that resolves to an array of processing results
   */
  private async processEventsInTransaction(events: T[]): Promise<EventProcessingResult<T>[]> {
    const transactionId = uuidv4();
    const batch: TransactionBatch<T> = {
      id: transactionId,
      events: [...events],
      startedAt: new Date(),
      status: 'pending',
    };
    
    this.pendingTransactions.set(transactionId, batch);
    this.emit('transaction:started', { transactionId, eventCount: events.length });
    
    try {
      const results: EventProcessingResult<T>[] = [];
      let hasErrors = false;
      
      // Process each event in the transaction
      for (const event of events) {
        const result = await this.processEvent(event);
        result.inTransaction = true;
        result.transactionId = transactionId;
        
        results.push(result);
        
        if (result.status !== EventProcessingStatus.SUCCESS) {
          hasErrors = true;
        }
      }
      
      // Commit or rollback the transaction based on results
      if (hasErrors) {
        await this.rollbackTransaction(transactionId);
        
        // Mark all results as failed due to transaction rollback
        for (const result of results) {
          if (result.status === EventProcessingStatus.SUCCESS) {
            result.status = EventProcessingStatus.PROCESSING_ERROR;
            result.error = 'Transaction rolled back due to errors in batch';
            result.errorCode = ErrorCodes.TRANSACTION_ROLLBACK;
          }
        }
      } else {
        await this.commitTransaction(transactionId);
      }
      
      return results;
    } catch (error) {
      // Rollback the transaction on unexpected errors
      await this.rollbackTransaction(transactionId, error.message);
      
      // Return error results for all events
      return events.map(event => ({
        processingId: uuidv4(),
        event,
        status: EventProcessingStatus.PROCESSING_ERROR,
        error: `Transaction error: ${error.message}`,
        errorCode: ErrorCodes.TRANSACTION_ERROR,
        timestamp: new Date(),
        durationMs: 0,
        inTransaction: true,
        transactionId,
        ...this.extractEventInfo(event),
      }));
    }
  }

  /**
   * Commits a transaction
   * 
   * @param transactionId ID of the transaction to commit
   */
  private async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.pendingTransactions.get(transactionId);
    
    if (transaction) {
      transaction.status = 'committed';
      transaction.completedAt = new Date();
      
      this.emit('transaction:committed', { 
        transactionId, 
        eventCount: transaction.events.length,
        duration: transaction.completedAt.getTime() - transaction.startedAt.getTime(),
      });
      
      // Remove from pending after a delay to allow inspection
      setTimeout(() => {
        this.pendingTransactions.delete(transactionId);
      }, 1000);
    }
  }

  /**
   * Rolls back a transaction
   * 
   * @param transactionId ID of the transaction to roll back
   * @param error Optional error message
   */
  private async rollbackTransaction(transactionId: string, error?: string): Promise<void> {
    const transaction = this.pendingTransactions.get(transactionId);
    
    if (transaction) {
      transaction.status = 'rolled_back';
      transaction.completedAt = new Date();
      transaction.error = error;
      
      this.emit('transaction:rolled_back', { 
        transactionId, 
        eventCount: transaction.events.length,
        error,
        duration: transaction.completedAt.getTime() - transaction.startedAt.getTime(),
      });
      
      // Remove from pending after a delay to allow inspection
      setTimeout(() => {
        this.pendingTransactions.delete(transactionId);
      }, 1000);
    }
  }

  /**
   * Adds events to the processing queue
   * 
   * @param events Events to add to the queue
   */
  public enqueueEvents(events: T[]): void {
    this.processingQueue.push(...events);
    this.emit('queue:updated', { queueSize: this.processingQueue.length });
    
    // Start processing if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Processes events in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0) {
      this.isProcessing = false;
      this.emit('queue:empty');
      return;
    }
    
    this.isProcessing = true;
    
    // Process events in batches if transactions are enabled
    if (this.options.useTransactions) {
      while (this.processingQueue.length > 0) {
        const batchSize = Math.min(this.options.maxBatchSize, this.processingQueue.length);
        const batch = this.processingQueue.splice(0, batchSize);
        
        await this.processEventsInTransaction(batch);
        this.emit('queue:updated', { queueSize: this.processingQueue.length });
      }
    } else {
      // Process events one by one
      while (this.processingQueue.length > 0) {
        const event = this.processingQueue.shift();
        await this.processEvent(event);
        this.emit('queue:updated', { queueSize: this.processingQueue.length });
      }
    }
    
    this.isProcessing = false;
    this.emit('queue:empty');
  }

  /**
   * Retries processing an event with exponential backoff
   * 
   * @param event Event to retry
   * @param retryCount Current retry count
   * @param error Error that caused the retry
   * @returns Promise that resolves to the processing result
   */
  public async retryWithBackoff(event: T, retryCount: number, error: string): Promise<EventProcessingResult<T>> {
    if (retryCount >= this.options.maxRetries) {
      // Max retries reached, send to dead letter queue
      return this.sendToDeadLetterQueue(event, error, retryCount);
    }
    
    // Calculate backoff delay
    const backoffDelay = this.calculateBackoffDelay(retryCount);
    
    // Emit retry event
    this.emit('retry', { 
      event, 
      retryCount, 
      error, 
      backoffDelay,
      maxRetries: this.options.maxRetries,
    });
    
    // Wait for backoff delay
    await this.delay(backoffDelay);
    
    // Retry processing
    return this.processEvent(event, retryCount + 1);
  }

  /**
   * Calculates the backoff delay for a retry
   * 
   * @param retryCount Current retry count
   * @returns Backoff delay in milliseconds
   */
  private calculateBackoffDelay(retryCount: number): number {
    if (this.options.useExponentialBackoff) {
      // Exponential backoff with jitter
      const exponentialDelay = this.options.retryBaseDelayMs * Math.pow(2, retryCount);
      const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
      return exponentialDelay + jitter;
    } else {
      // Linear backoff
      return this.options.retryBaseDelayMs * (retryCount + 1);
    }
  }

  /**
   * Sends an event to the dead letter queue
   * 
   * @param event Event to send to the dead letter queue
   * @param error Error message
   * @param retryCount Number of retry attempts
   * @returns Processing result with dead letter status
   */
  private sendToDeadLetterQueue(event: T, error: string, retryCount: number): EventProcessingResult<T> {
    const eventInfo = this.extractEventInfo(event);
    const result: EventProcessingResult<T> = {
      processingId: uuidv4(),
      event,
      status: EventProcessingStatus.DEAD_LETTER,
      error: `Max retries (${this.options.maxRetries}) exceeded: ${error}`,
      errorCode: ErrorCodes.MAX_RETRIES_EXCEEDED,
      timestamp: new Date(),
      durationMs: 0,
      retryCount,
      journey: eventInfo.journey,
      eventType: eventInfo.eventType,
      userId: eventInfo.userId,
      metadata: eventInfo.metadata,
    };
    
    // Update metrics
    if (this.options.collectMetrics) {
      this.metrics.deadLettered++;
      this.metrics.failed++;
      this.metrics.totalProcessed++;
      
      // Update error counts
      this.metrics.errorsByCode[ErrorCodes.MAX_RETRIES_EXCEEDED] = 
        (this.metrics.errorsByCode[ErrorCodes.MAX_RETRIES_EXCEEDED] || 0) + 1;
      
      // Update journey and event type counts
      if (eventInfo.journey) {
        this.metrics.countsByJourney[eventInfo.journey] = 
          (this.metrics.countsByJourney[eventInfo.journey] || 0) + 1;
      }
      
      if (eventInfo.eventType) {
        this.metrics.countsByEventType[eventInfo.eventType] = 
          (this.metrics.countsByEventType[eventInfo.eventType] || 0) + 1;
      }
    }
    
    // Add to history
    if (this.options.trackHistory) {
      this.addToHistory(result);
    }
    
    // Emit dead letter event
    this.emit('dead_letter', result);
    
    return result;
  }

  /**
   * Validates an event
   * 
   * @param event Event to validate
   * @returns Validation result
   */
  private validateEvent(event: T): { valid: boolean; error?: string } {
    try {
      // Basic structure validation
      if (!event) {
        return { valid: false, error: 'Event is null or undefined' };
      }
      
      if (typeof event !== 'object') {
        return { valid: false, error: 'Event must be an object' };
      }
      
      // Extract event info for validation
      const eventInfo = this.extractEventInfo(event);
      
      // Validate required fields
      if (!eventInfo.eventType) {
        return { valid: false, error: 'Event type is required' };
      }
      
      if (!eventInfo.userId) {
        return { valid: false, error: 'User ID is required' };
      }
      
      if (!eventInfo.journey) {
        return { valid: false, error: 'Journey is required' };
      }
      
      // Validate event type is known
      const isKnownEventType = Object.values(EventTypes).includes(eventInfo.eventType as any);
      if (!isKnownEventType) {
        return { valid: false, error: `Unknown event type: ${eventInfo.eventType}` };
      }
      
      // Validate journey is valid
      const validJourneys = ['health', 'care', 'plan'];
      if (!validJourneys.includes(eventInfo.journey)) {
        return { valid: false, error: `Invalid journey: ${eventInfo.journey}` };
      }
      
      // Validate event type matches journey
      if (eventInfo.eventType.startsWith('HEALTH_') && eventInfo.journey !== 'health') {
        return { valid: false, error: `Event type ${eventInfo.eventType} must be in health journey` };
      }
      
      if (eventInfo.eventType.startsWith('CARE_') && eventInfo.journey !== 'care') {
        return { valid: false, error: `Event type ${eventInfo.eventType} must be in care journey` };
      }
      
      if (eventInfo.eventType.startsWith('PLAN_') && eventInfo.journey !== 'plan') {
        return { valid: false, error: `Event type ${eventInfo.eventType} must be in plan journey` };
      }
      
      // All validations passed
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Validation error: ${error.message}` };
    }
  }

  /**
   * Validates the schema version of an event
   * 
   * @param event Event to validate
   * @returns Validation result
   */
  private validateSchemaVersion(event: T): { valid: boolean; error?: string } {
    try {
      // Check if event has version information
      const versionedEvent = event as unknown as VersionedEvent<any>;
      if (!versionedEvent.version) {
        return { valid: false, error: 'Event is missing version information' };
      }
      
      // Extract event type
      const eventInfo = this.extractEventInfo(event);
      if (!eventInfo.eventType) {
        return { valid: false, error: 'Cannot validate schema version: missing event type' };
      }
      
      // Get current schema version for this event type
      const currentVersion = this.schemaVersions.get(eventInfo.eventType) || 1;
      
      // Check if event version is compatible with current schema version
      const eventVersion = versionedEvent.version;
      
      // Major version must match
      const eventMajor = parseInt(eventVersion.split('.')[0]);
      const currentMajor = parseInt(currentVersion.toString().split('.')[0]);
      
      if (eventMajor !== currentMajor) {
        return { 
          valid: false, 
          error: `Incompatible major version: event has v${eventVersion}, current schema is v${currentVersion}` 
        };
      }
      
      // All validations passed
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Schema version validation error: ${error.message}` };
    }
  }

  /**
   * Extracts event information for metrics and logging
   * 
   * @param event Event to extract information from
   * @returns Extracted event information
   */
  private extractEventInfo(event: T): {
    eventType?: string;
    userId?: string;
    journey?: string;
    metadata?: EventMetadata;
  } {
    try {
      const eventObj = event as any;
      
      return {
        eventType: eventObj.type || eventObj.eventType,
        userId: eventObj.userId || (eventObj.user && eventObj.user.id),
        journey: eventObj.journey,
        metadata: eventObj.metadata,
      };
    } catch {
      return {};
    }
  }

  /**
   * Handles a validation error
   * 
   * @param event Event that failed validation
   * @param error Error message
   * @param processingId Processing ID
   * @param startTime Processing start time
   * @param eventInfo Extracted event information
   * @returns Processing result with validation error status
   */
  private handleValidationError(
    event: T, 
    error: string, 
    processingId: string, 
    startTime: number,
    eventInfo: ReturnType<typeof this.extractEventInfo>
  ): EventProcessingResult<T> {
    const result: EventProcessingResult<T> = {
      processingId,
      event,
      status: EventProcessingStatus.VALIDATION_ERROR,
      error,
      errorCode: ErrorCodes.VALIDATION_ERROR,
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
      journey: eventInfo.journey,
      eventType: eventInfo.eventType,
      userId: eventInfo.userId,
      metadata: eventInfo.metadata,
    };
    
    // Update metrics
    if (this.options.collectMetrics) {
      this.updateMetricsForError(result, true);
    }
    
    // Add to history
    if (this.options.trackHistory) {
      this.addToHistory(result);
    }
    
    // Emit validation error event
    this.emit('validation_error', result);
    
    return result;
  }

  /**
   * Handles a schema error
   * 
   * @param event Event that failed schema validation
   * @param error Error message
   * @param processingId Processing ID
   * @param startTime Processing start time
   * @param eventInfo Extracted event information
   * @returns Processing result with schema error status
   */
  private handleSchemaError(
    event: T, 
    error: string, 
    processingId: string, 
    startTime: number,
    eventInfo: ReturnType<typeof this.extractEventInfo>
  ): EventProcessingResult<T> {
    const result: EventProcessingResult<T> = {
      processingId,
      event,
      status: EventProcessingStatus.SCHEMA_ERROR,
      error,
      errorCode: ErrorCodes.SCHEMA_VERSION_ERROR,
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
      journey: eventInfo.journey,
      eventType: eventInfo.eventType,
      userId: eventInfo.userId,
      metadata: eventInfo.metadata,
    };
    
    // Update metrics
    if (this.options.collectMetrics) {
      this.metrics.schemaErrors++;
      this.metrics.failed++;
      this.metrics.totalProcessed++;
      
      // Update error counts
      this.metrics.errorsByCode[ErrorCodes.SCHEMA_VERSION_ERROR] = 
        (this.metrics.errorsByCode[ErrorCodes.SCHEMA_VERSION_ERROR] || 0) + 1;
      
      // Update journey and event type counts
      if (eventInfo.journey) {
        this.metrics.countsByJourney[eventInfo.journey] = 
          (this.metrics.countsByJourney[eventInfo.journey] || 0) + 1;
      }
      
      if (eventInfo.eventType) {
        this.metrics.countsByEventType[eventInfo.eventType] = 
          (this.metrics.countsByEventType[eventInfo.eventType] || 0) + 1;
      }
    }
    
    // Add to history
    if (this.options.trackHistory) {
      this.addToHistory(result);
    }
    
    // Emit schema error event
    this.emit('schema_error', result);
    
    return result;
  }

  /**
   * Handles a network error
   * 
   * @param event Event that encountered a network error
   * @param processingId Processing ID
   * @param startTime Processing start time
   * @param retryCount Current retry count
   * @param eventInfo Extracted event information
   * @returns Processing result with network error status
   */
  private handleNetworkError(
    event: T, 
    processingId: string, 
    startTime: number, 
    retryCount: number,
    eventInfo: ReturnType<typeof this.extractEventInfo>
  ): EventProcessingResult<T> {
    const error = 'Network error: connection failed';
    
    const result: EventProcessingResult<T> = {
      processingId,
      event,
      status: EventProcessingStatus.NETWORK_ERROR,
      error,
      errorCode: ErrorCodes.NETWORK_ERROR,
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
      retryCount,
      journey: eventInfo.journey,
      eventType: eventInfo.eventType,
      userId: eventInfo.userId,
      metadata: eventInfo.metadata,
    };
    
    // Update metrics
    if (this.options.collectMetrics) {
      this.metrics.networkErrors++;
      this.metrics.failed++;
      this.metrics.totalProcessed++;
      
      // Update error counts
      this.metrics.errorsByCode[ErrorCodes.NETWORK_ERROR] = 
        (this.metrics.errorsByCode[ErrorCodes.NETWORK_ERROR] || 0) + 1;
      
      // Update journey and event type counts
      if (eventInfo.journey) {
        this.metrics.countsByJourney[eventInfo.journey] = 
          (this.metrics.countsByJourney[eventInfo.journey] || 0) + 1;
      }
      
      if (eventInfo.eventType) {
        this.metrics.countsByEventType[eventInfo.eventType] = 
          (this.metrics.countsByEventType[eventInfo.eventType] || 0) + 1;
      }
    }
    
    // Add to history
    if (this.options.trackHistory) {
      this.addToHistory(result);
    }
    
    // Emit network error event
    this.emit('network_error', result);
    
    // Retry with backoff if not at max retries
    if (retryCount < this.options.maxRetries) {
      return {
        ...result,
        status: EventProcessingStatus.RETRY,
      };
    }
    
    return result;
  }

  /**
   * Handles a random failure
   * 
   * @param event Event that encountered a random failure
   * @param processingId Processing ID
   * @param startTime Processing start time
   * @param retryCount Current retry count
   * @param eventInfo Extracted event information
   * @returns Processing result with processing error status
   */
  private handleRandomFailure(
    event: T, 
    processingId: string, 
    startTime: number, 
    retryCount: number,
    eventInfo: ReturnType<typeof this.extractEventInfo>
  ): EventProcessingResult<T> {
    const error = 'Processing error: random failure simulated';
    
    const result: EventProcessingResult<T> = {
      processingId,
      event,
      status: EventProcessingStatus.PROCESSING_ERROR,
      error,
      errorCode: ErrorCodes.PROCESSING_ERROR,
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
      retryCount,
      journey: eventInfo.journey,
      eventType: eventInfo.eventType,
      userId: eventInfo.userId,
      metadata: eventInfo.metadata,
    };
    
    // Update metrics
    if (this.options.collectMetrics) {
      this.updateMetricsForError(result);
    }
    
    // Add to history
    if (this.options.trackHistory) {
      this.addToHistory(result);
    }
    
    // Emit processing error event
    this.emit('processing_error', result);
    
    // Retry with backoff if not at max retries
    if (retryCount < this.options.maxRetries) {
      return {
        ...result,
        status: EventProcessingStatus.RETRY,
      };
    }
    
    return result;
  }

  /**
   * Handles an unexpected error
   * 
   * @param event Event that encountered an unexpected error
   * @param error Error object
   * @param processingId Processing ID
   * @param startTime Processing start time
   * @param retryCount Current retry count
   * @returns Processing result with processing error status
   */
  private handleUnexpectedError(
    event: T, 
    error: Error, 
    processingId: string, 
    startTime: number, 
    retryCount: number
  ): EventProcessingResult<T> {
    const eventInfo = this.extractEventInfo(event);
    const errorMessage = `Unexpected error: ${error.message}`;
    
    const result: EventProcessingResult<T> = {
      processingId,
      event,
      status: EventProcessingStatus.PROCESSING_ERROR,
      error: errorMessage,
      errorCode: ErrorCodes.UNEXPECTED_ERROR,
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
      retryCount,
      journey: eventInfo.journey,
      eventType: eventInfo.eventType,
      userId: eventInfo.userId,
      metadata: eventInfo.metadata,
    };
    
    // Update metrics
    if (this.options.collectMetrics) {
      this.updateMetricsForError(result);
    }
    
    // Add to history
    if (this.options.trackHistory) {
      this.addToHistory(result);
    }
    
    // Emit processing error event
    this.emit('processing_error', result);
    
    // Retry with backoff if not at max retries
    if (retryCount < this.options.maxRetries) {
      return {
        ...result,
        status: EventProcessingStatus.RETRY,
      };
    }
    
    return result;
  }

  /**
   * Updates metrics for a successful event processing
   * 
   * @param result Processing result
   */
  private updateMetricsForSuccess(result: EventProcessingResult<T>): void {
    this.metrics.successful++;
    this.metrics.totalProcessed++;
    
    // Update average processing time
    const totalTime = this.metrics.averageProcessingTimeMs * (this.metrics.totalProcessed - 1) + result.durationMs;
    this.metrics.averageProcessingTimeMs = totalTime / this.metrics.totalProcessed;
    
    // Update journey-specific metrics
    if (result.journey) {
      this.metrics.countsByJourney[result.journey] = 
        (this.metrics.countsByJourney[result.journey] || 0) + 1;
      
      // Update journey processing time
      const journeyTime = this.metrics.processingTimeByJourney[result.journey] || 0;
      const journeyCount = this.metrics.countsByJourney[result.journey] || 1;
      this.metrics.processingTimeByJourney[result.journey] = 
        (journeyTime * (journeyCount - 1) + result.durationMs) / journeyCount;
    }
    
    // Update event type-specific metrics
    if (result.eventType) {
      this.metrics.countsByEventType[result.eventType] = 
        (this.metrics.countsByEventType[result.eventType] || 0) + 1;
      
      // Update event type processing time
      const eventTypeTime = this.metrics.processingTimeByEventType[result.eventType] || 0;
      const eventTypeCount = this.metrics.countsByEventType[result.eventType] || 1;
      this.metrics.processingTimeByEventType[result.eventType] = 
        (eventTypeTime * (eventTypeCount - 1) + result.durationMs) / eventTypeCount;
    }
  }

  /**
   * Updates metrics for an error event processing
   * 
   * @param result Processing result
   * @param isValidationError Whether the error is a validation error
   */
  private updateMetricsForError(result: EventProcessingResult<T>, isValidationError = false): void {
    this.metrics.failed++;
    this.metrics.totalProcessed++;
    
    // Update specific error metrics
    if (isValidationError) {
      this.metrics.validationErrors++;
    }
    
    // Update error counts by code
    if (result.errorCode) {
      this.metrics.errorsByCode[result.errorCode] = 
        (this.metrics.errorsByCode[result.errorCode] || 0) + 1;
    }
    
    // Update journey-specific metrics
    if (result.journey) {
      this.metrics.countsByJourney[result.journey] = 
        (this.metrics.countsByJourney[result.journey] || 0) + 1;
    }
    
    // Update event type-specific metrics
    if (result.eventType) {
      this.metrics.countsByEventType[result.eventType] = 
        (this.metrics.countsByEventType[result.eventType] || 0) + 1;
    }
    
    // Update retry metrics if applicable
    if (result.status === EventProcessingStatus.RETRY) {
      this.metrics.retried++;
    }
  }

  /**
   * Adds a processing result to the history
   * 
   * @param result Processing result to add to history
   */
  private addToHistory(result: EventProcessingResult<T>): void {
    const historyEntry: EventProcessingHistoryEntry<T> = {
      ...result,
      sequence: ++this.historySequence,
    };
    
    this.history.push(historyEntry);
    
    // Limit history size to prevent memory issues
    const maxHistorySize = 1000;
    if (this.history.length > maxHistorySize) {
      this.history = this.history.slice(-maxHistorySize);
    }
  }

  /**
   * Creates a delay promise
   * 
   * @param ms Delay in milliseconds
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Updates the schema version for an event type
   * 
   * @param eventType Event type to update
   * @param version New schema version
   */
  public updateSchemaVersion(eventType: string, version: number): void {
    this.schemaVersions.set(eventType, version);
    this.emit('schema:updated', { eventType, version });
  }

  /**
   * Gets the current schema version for an event type
   * 
   * @param eventType Event type to get version for
   * @returns Current schema version
   */
  public getSchemaVersion(eventType: string): number {
    return this.schemaVersions.get(eventType) || 1;
  }

  /**
   * Simulates schema evolution for testing
   * 
   * @param eventTypes Event types to evolve (defaults to all)
   * @param majorVersion Whether to increment major version (breaking change)
   */
  public simulateSchemaEvolution(eventTypes?: string[], majorVersion = false): void {
    const typesToUpdate = eventTypes || Array.from(this.schemaVersions.keys());
    
    for (const eventType of typesToUpdate) {
      const currentVersion = this.schemaVersions.get(eventType) || 1;
      let newVersion: number;
      
      if (majorVersion) {
        // Increment major version (breaking change)
        const major = Math.floor(currentVersion);
        newVersion = major + 1;
      } else {
        // Increment minor version (backward compatible)
        newVersion = currentVersion + 0.1;
      }
      
      this.updateSchemaVersion(eventType, newVersion);
    }
    
    this.emit('schema:evolution', { 
      eventTypes: typesToUpdate, 
      majorVersion,
      schemaVersions: Object.fromEntries(this.schemaVersions),
    });
  }

  /**
   * Gets the current queue size
   * 
   * @returns Current queue size
   */
  public getQueueSize(): number {
    return this.processingQueue.length;
  }

  /**
   * Clears the processing queue
   */
  public clearQueue(): void {
    const previousSize = this.processingQueue.length;
    this.processingQueue = [];
    this.emit('queue:cleared', { previousSize });
  }

  /**
   * Gets the processing status
   * 
   * @returns Whether the processor is currently processing events
   */
  public isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Gets the current configuration options
   * 
   * @returns Current configuration options
   */
  public getOptions(): Required<MockEventProcessorOptions> {
    return { ...this.options };
  }

  /**
   * Updates the configuration options
   * 
   * @param options New configuration options
   */
  public updateOptions(options: Partial<MockEventProcessorOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
    
    this.emit('options:updated', { options: this.options });
  }
}