/**
 * @file base-producer.abstract.ts
 * @description Abstract base class for Kafka producers that handles message serialization,
 * topic routing, and delivery acknowledgment. Implements at-least-once delivery semantics
 * with configurable retry attempts, and provides hooks for message transformation and
 * validation before sending.
 * 
 * This file is part of the AUSTA SuperApp gamification engine and implements the
 * standardized event schema requirements from the technical specification.
 * 
 * @see Technical Specification Section 5.2.1 - Gamification Engine (updated)
 * @see Technical Specification Section 0.2.3 - Phase 4: Gamification Event Architecture
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, RecordMetadata, ProducerRecord } from 'kafkajs';

// Import from @austa/interfaces for type-safe event schemas
import {
  GamificationEvent,
  EventType,
  EventPayload
} from '@austa/interfaces/gamification';

// Import from @austa/logging for structured logging
import { LoggerService } from '@austa/logging';

// Import from @austa/tracing for distributed tracing
import { TracingService } from '@austa/tracing';

// Import from @austa/errors for error handling
import { ErrorReporter } from '@austa/errors';

// Import local types and utilities
import {
  ProducerConfig,
  KafkaConfig,
  KafkaHeaders,
  KafkaMessageValue,
  TypedProducer,
  createKafkaMessage,
  KafkaError,
  KafkaErrorType
} from './kafka.types';
import { KafkaErrorHandler, KafkaErrorContext } from './error-handler';
import { MessageSerializer, SerializationOptions } from './message-serializer';

/**
 * Options for sending messages
 */
export interface SendOptions {
  /** Topic to send the message to (overrides default) */
  topic?: string;
  
  /** Partition key for the message */
  key?: string;
  
  /** Additional headers to include with the message */
  headers?: Record<string, string>;
  
  /** Whether to wait for acknowledgment (default: true) */
  requireAck?: boolean;
  
  /** Timeout in milliseconds for acknowledgment */
  ackTimeoutMs?: number;
  
  /** Number of retry attempts for failed sends */
  retries?: number;
  
  /** Whether to throw an error on failure (default: true) */
  throwOnError?: boolean;
  
  /** Serialization options */
  serialization?: SerializationOptions;
  
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  
  /** Whether to use transactions for this send (default: false) */
  transactional?: boolean;
  
  /** Transaction ID for transactional messages */
  transactionId?: string;
}

/**
 * Result of a message send operation
 */
export interface SendResult {
  /** Whether the send was successful */
  success: boolean;
  
  /** Error message if the send failed */
  error?: string;
  
  /** Error code if the send failed */
  errorCode?: string;
  
  /** Kafka record metadata if the send was successful */
  metadata?: RecordMetadata[];
  
  /** Topic the message was sent to */
  topic: string;
  
  /** Partition the message was sent to */
  partition?: number;
  
  /** Offset of the message */
  offset?: string;
  
  /** Timestamp when the message was sent */
  timestamp?: string;
  
  /** Correlation ID for distributed tracing */
  correlationId?: string;
}

/**
 * Abstract base class for Kafka producers in the gamification engine.
 * 
 * This class provides a foundation for implementing type-safe Kafka producers
 * with standardized error handling, retry mechanisms, and delivery acknowledgment.
 * It integrates with the @austa/interfaces package for type-safe event schemas
 * and implements the requirements from the technical specification.
 * 
 * @template T - The type of event payload this producer handles
 */
@Injectable()
export abstract class BaseProducer<T extends EventPayload = EventPayload> implements OnModuleInit {
  protected readonly logger: Logger;
  protected producer: Producer;
  protected typedProducer: TypedProducer<T>;
  protected isConnected = false;
  protected isInitialized = false;
  protected defaultTopic: string;
  protected errorHandler: KafkaErrorHandler;
  protected serializer: MessageSerializer;
  
  /**
   * Creates a new BaseProducer instance
   * 
   * @param kafkaConfig Kafka client configuration
   * @param producerConfig Producer-specific configuration
   * @param loggerService Optional logger service for structured logging
   * @param tracingService Optional tracing service for distributed tracing
   * @param errorReporter Optional error reporter for error tracking
   */
  constructor(
    protected readonly kafkaConfig: KafkaConfig,
    protected readonly producerConfig: ProducerConfig,
    protected readonly loggerService?: LoggerService,
    protected readonly tracingService?: TracingService,
    protected readonly errorReporter?: ErrorReporter
  ) {
    this.logger = new Logger(this.constructor.name);
    this.defaultTopic = this.producerConfig.topics.default;
    
    // Create error handler
    this.errorHandler = new KafkaErrorHandler(
      {
        serviceName: this.constructor.name,
        defaultTopic: this.defaultTopic,
        baseRetryDelayMs: this.producerConfig.retry?.initialRetryTime || 100,
        maxRetryDelayMs: this.producerConfig.retry?.maxRetryTime || 30000,
        maxRetryAttempts: this.producerConfig.retry?.retries || 8,
        useJitter: this.producerConfig.retry?.jitter !== false,
        logger: this.logger
      },
      this.loggerService,
      this.tracingService,
      this.errorReporter
    );
    
    // Create message serializer
    this.serializer = new MessageSerializer();
  }
  
  /**
   * Initializes the producer when the module is initialized
   */
  async onModuleInit(): Promise<void> {
    await this.initialize();
  }
  
  /**
   * Handles graceful shutdown when the module is destroyed
   * 
   * This method is called by NestJS when the application is shutting down.
   * It ensures that the producer is properly disconnected and all resources are released.
   */
  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }
  
  /**
   * Performs a graceful shutdown of the producer
   * 
   * This method ensures that all pending messages are sent before disconnecting.
   * It also cleans up any resources used by the producer.
   * 
   * @param timeoutMs Maximum time to wait for pending messages in milliseconds
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(timeoutMs: number = 10000): Promise<void> {
    this.logger.log(`Shutting down Kafka producer (timeout: ${timeoutMs}ms)...`);
    
    // Clear health check interval if running
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
      this._healthCheckInterval = null;
    }
    
    // Only proceed with disconnect if connected
    if (this.isConnected) {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<void>(resolve => {
          setTimeout(() => {
            this.logger.warn(`Kafka producer shutdown timed out after ${timeoutMs}ms`);
            resolve();
          }, timeoutMs);
        });
        
        // Disconnect with timeout
        await Promise.race([
          this.disconnect(),
          timeoutPromise
        ]);
      } catch (error) {
        this.logger.error(`Error during Kafka producer shutdown: ${error.message}`, error.stack);
      }
    }
    
    this.logger.log('Kafka producer shutdown complete');
  }
  
  /**
   * Initializes the Kafka producer
   * 
   * This method creates and connects the Kafka producer, making it ready to send messages.
   * It is called automatically during module initialization, but can also be called
   * manually if needed.
   * 
   * @returns Promise that resolves when the producer is initialized
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      this.logger.log(`Initializing Kafka producer for topics: ${Object.values(this.producerConfig.topics).join(', ')}`);
      
      // Create Kafka client
      const kafka = new Kafka(this.kafkaConfig);
      
      // Create producer
      this.producer = kafka.producer(this.producerConfig.options);
      
      // Cast to typed producer
      this.typedProducer = this.producer as unknown as TypedProducer<T>;
      
      // Add custom methods to the producer
      this.enhanceProducer();
      
      // Connect to Kafka
      await this.connect();
      
      this.isInitialized = true;
      this.logger.log('Kafka producer initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Kafka producer: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Connects the producer to Kafka
   * 
   * @returns Promise that resolves when the producer is connected
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    
    try {
      this.logger.log('Connecting Kafka producer...');
      
      // Add connection timeout to prevent hanging indefinitely
      const connectionPromise = this.producer.connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeout = setTimeout(() => {
          clearTimeout(timeout);
          reject(new Error(`Connection timeout after ${this.kafkaConfig.connectionTimeout || 30000}ms`));
        }, this.kafkaConfig.connectionTimeout || 30000);
      });
      
      // Race the connection promise against the timeout
      await Promise.race([connectionPromise, timeoutPromise]);
      
      this.isConnected = true;
      this.logger.log('Kafka producer connected successfully');
      
      // Start a background health check if not already running
      this.startHealthCheck();
    } catch (error) {
      this.logger.error(`Failed to connect Kafka producer: ${error.message}`, error.stack);
      
      // Report the error to monitoring systems if available
      if (this.errorReporter) {
        this.errorReporter.report(error, {
          context: 'kafka.producer.connect',
          brokers: this.kafkaConfig.brokers,
          clientId: this.kafkaConfig.clientId,
          serviceName: this.constructor.name
        });
      }
      
      // Create a standardized Kafka error
      throw KafkaError.connectionError(
        `Failed to connect Kafka producer: ${error.message}`,
        error,
        { 
          brokers: this.kafkaConfig.brokers,
          clientId: this.kafkaConfig.clientId,
          connectionTimeout: this.kafkaConfig.connectionTimeout
        }
      );
    }
  }
  
  /**
   * Starts a background health check for the Kafka connection
   * 
   * This method periodically checks the Kafka connection and attempts to reconnect
   * if the connection is lost.
   */
  protected startHealthCheck(): void {
    // Only start if not already running
    if (this._healthCheckInterval) {
      return;
    }
    
    // Check every 30 seconds by default
    const interval = 30000;
    
    this._healthCheckInterval = setInterval(async () => {
      try {
        // Skip if already reconnecting
        if (this._isReconnecting) {
          return;
        }
        
        // Check if producer is connected by sending a test message to admin topic
        // or by checking the producer's internal state
        if (!this.isConnected || !(this.producer as any).isConnected?.()) {
          this.logger.warn('Kafka producer connection lost, attempting to reconnect...');
          
          // Mark as reconnecting to prevent multiple simultaneous reconnection attempts
          this._isReconnecting = true;
          this.isConnected = false;
          
          try {
            // Attempt to reconnect
            await this.connect();
            this.logger.log('Kafka producer reconnected successfully');
          } catch (reconnectError) {
            this.logger.error(
              `Failed to reconnect Kafka producer: ${reconnectError.message}`,
              reconnectError.stack
            );
          } finally {
            // Clear reconnecting flag
            this._isReconnecting = false;
          }
        }
      } catch (error) {
        // Don't let errors in the health check crash the interval
        this.logger.error(`Error in Kafka producer health check: ${error.message}`, error.stack);
      }
    }, interval);
    
    // Ensure the interval is cleared when the application shuts down
    process.on('beforeExit', () => {
      if (this._healthCheckInterval) {
        clearInterval(this._healthCheckInterval);
        this._healthCheckInterval = null;
      }
    });
  }
  
  // Private properties for health check
  private _healthCheckInterval: NodeJS.Timeout | null = null;
  private _isReconnecting = false;
  
  /**
   * Disconnects the producer from Kafka
   * 
   * @returns Promise that resolves when the producer is disconnected
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    
    try {
      this.logger.log('Disconnecting Kafka producer...');
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka producer disconnected successfully');
    } catch (error) {
      this.logger.error(`Failed to disconnect Kafka producer: ${error.message}`, error.stack);
      // Don't throw here, just log the error
    }
  }
  
  /**
   * Sends a gamification event to Kafka
   * 
   * This method serializes the event, sends it to Kafka, and handles acknowledgment
   * and retries according to the configured options.
   * 
   * @param event The gamification event to send
   * @param options Options for sending the message
   * @returns Promise that resolves with the send result
   */
  async sendEvent(event: GamificationEvent<T>, options: SendOptions = {}): Promise<SendResult> {
    const startTime = Date.now();
    const correlationId = options.correlationId || this.generateCorrelationId(event);
    const topic = options.topic || this.getTopicForEvent(event) || this.defaultTopic;
    const retries = options.retries !== undefined ? options.retries : this.producerConfig.retry?.retries || 3;
    const requireAck = options.requireAck !== undefined ? options.requireAck : true;
    const throwOnError = options.throwOnError !== undefined ? options.throwOnError : true;
    const useTransaction = options.transactional === true && !!this.producerConfig.options?.transactionalId;
    const transactionId = options.transactionId || this.producerConfig.options?.transactionalId;
    
    // Add correlation ID to event metadata if not already present
    if (!event.metadata) {
      event.metadata = {};
    }
    if (!event.metadata.correlationId) {
      event.metadata.correlationId = correlationId;
    }
    
    // Prepare headers
    const headers: Record<string, string> = {
      ...this.producerConfig.defaultHeaders,
      correlationId,
      source: event.source || this.constructor.name,
      timestamp: event.timestamp || new Date().toISOString(),
      schemaVersion: event.version || '1.0.0',
      ...options.headers
    };
    
    // Start a trace span if tracing service is available
    const span = this.tracingService?.startSpan(
      `kafka.produce.${topic}`,
      { correlationId, attributes: { topic, eventType: event.eventType } }
    );
    
    try {
      // Validate the event before sending
      await this.validateEvent(event);
      
      // Transform the event if needed
      const transformedEvent = await this.transformEvent(event);
      
      // Log the event being sent
      this.logEventSending(transformedEvent, topic, correlationId);
      
      // Create Kafka message
      const kafkaMessage = createKafkaMessage(transformedEvent, headers);
      
      // Send the message with retries
      let result: SendResult;
      let currentRetry = 0;
      
      do {
        try {
          // If not the first attempt, log retry
          if (currentRetry > 0) {
            this.logger.log(
              `Retrying send to topic ${topic} (attempt ${currentRetry + 1}/${retries + 1})`,
              { correlationId, eventId: transformedEvent.eventId, eventType: transformedEvent.eventType }
            );
          }
          
          // Send the message, using transactions if configured
          let metadata: RecordMetadata[];
          
          if (useTransaction) {
            metadata = await this.sendTransactional(
              topic,
              kafkaMessage.value,
              options.key,
              kafkaMessage.headers as unknown as KafkaHeaders,
              transactionId
            );
          } else {
            metadata = await this.sendToKafka(
              topic,
              kafkaMessage.value,
              options.key,
              kafkaMessage.headers as unknown as KafkaHeaders,
              requireAck
            );
          }
          
          // Create successful result
          result = {
            success: true,
            topic,
            partition: metadata?.[0]?.partition,
            offset: metadata?.[0]?.offset,
            timestamp: new Date().toISOString(),
            correlationId,
            metadata
          };
          
          // Log success
          this.logEventSent(transformedEvent, result, Date.now() - startTime);
          
          // Record successful span
          span?.end();
          
          return result;
        } catch (error) {
          // If this is the last retry, create error result
          if (currentRetry >= retries) {
            result = {
              success: false,
              error: error.message,
              errorCode: error.code || 'UNKNOWN_ERROR',
              topic,
              timestamp: new Date().toISOString(),
              correlationId
            };
            
            // Log failure
            this.logEventSendFailure(transformedEvent, error, currentRetry, Date.now() - startTime);
            
            // Record error in span
            span?.recordException(error);
            span?.end();
            
            // Handle the error
            await this.handleSendError(error, transformedEvent, topic, correlationId, currentRetry);
            
            // Throw if configured to do so
            if (throwOnError) {
              throw error;
            }
            
            return result;
          }
          
          // Log retry
          this.logger.warn(
            `Failed to send message to topic ${topic}, will retry: ${error.message}`,
            { correlationId, eventId: transformedEvent.eventId, eventType: transformedEvent.eventType, retry: currentRetry + 1 }
          );
          
          // Wait before retrying
          const retryDelay = this.calculateRetryDelay(currentRetry);
          await this.sleep(retryDelay);
          
          // Increment retry counter
          currentRetry++;
        }
      } while (currentRetry <= retries);
      
      // This should never be reached due to the return in the last retry
      // but TypeScript needs it for type safety
      return result!;
    } catch (error) {
      // Record error in span
      span?.recordException(error);
      span?.end();
      
      // Create error result
      const result: SendResult = {
        success: false,
        error: error.message,
        errorCode: error.code || 'UNKNOWN_ERROR',
        topic,
        timestamp: new Date().toISOString(),
        correlationId
      };
      
      // Log failure
      this.logEventSendFailure(event, error, -1, Date.now() - startTime);
      
      // Handle the error
      await this.handleSendError(error, event, topic, correlationId, -1);
      
      // Throw if configured to do so
      if (throwOnError) {
        throw error;
      }
      
      return result;
    }
  }
  
  /**
   * Sends multiple gamification events to Kafka in a batch
   * 
   * @param events The gamification events to send
   * @param options Options for sending the messages
   * @returns Promise that resolves with an array of send results
   */
  async sendEvents(events: GamificationEvent<T>[], options: SendOptions = {}): Promise<SendResult[]> {
    // If no events, return empty array
    if (!events || events.length === 0) {
      return [];
    }
    
    // If only one event, use sendEvent for simplicity
    if (events.length === 1) {
      const result = await this.sendEvent(events[0], options);
      return [result];
    }
    
    // Group events by topic for efficient batching
    const eventsByTopic = this.groupEventsByTopic(events, options.topic);
    const results: SendResult[] = [];
    
    // Send each batch of events
    for (const [topic, topicEvents] of Object.entries(eventsByTopic)) {
      try {
        // If optimized batching is possible, use it
        if (this.canUseBatchSend(topicEvents, options)) {
          const batchResults = await this.sendEventBatch(topicEvents, { ...options, topic });
          results.push(...batchResults);
        } else {
          // Otherwise send events in parallel
          const batchOptions = { ...options, topic };
          
          const batchResults = await Promise.all(
            topicEvents.map(event => this.sendEvent(event, batchOptions))
          );
          
          results.push(...batchResults);
        }
      } catch (error) {
        // Log batch failure
        this.logger.error(
          `Failed to send batch of ${topicEvents.length} events to topic ${topic}: ${error.message}`,
          { topic, eventCount: topicEvents.length }
        );
        
        // If configured to throw on error, rethrow
        if (options.throwOnError !== false) {
          throw error;
        }
        
        // Otherwise, add failure results for remaining events
        const failureResults: SendResult[] = topicEvents.map(event => ({
          success: false,
          error: error.message,
          errorCode: error.code || 'BATCH_SEND_FAILED',
          topic,
          timestamp: new Date().toISOString(),
          correlationId: options.correlationId || this.generateCorrelationId(event)
        }));
        
        results.push(...failureResults);
      }
    }
    
    return results;
  }
  
  /**
   * Sends a batch of events to Kafka in a single request
   * 
   * This method optimizes sending multiple events by batching them into a single Kafka request,
   * which reduces network overhead and improves throughput.
   * 
   * @param events The events to send in a batch
   * @param options Options for sending the batch
   * @returns Promise that resolves with an array of send results
   */
  protected async sendEventBatch(events: GamificationEvent<T>[], options: SendOptions = {}): Promise<SendResult[]> {
    const startTime = Date.now();
    const topic = options.topic || this.defaultTopic;
    const correlationId = options.correlationId || `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const requireAck = options.requireAck !== undefined ? options.requireAck : true;
    
    // Start a trace span if tracing service is available
    const span = this.tracingService?.startSpan(
      `kafka.produce.batch.${topic}`,
      { correlationId, attributes: { topic, eventCount: events.length } }
    );
    
    try {
      // Validate and transform events
      const processedEvents = await Promise.all(
        events.map(async event => {
          // Add correlation ID to event metadata if not already present
          if (!event.metadata) {
            event.metadata = {};
          }
          if (!event.metadata.correlationId) {
            event.metadata.correlationId = correlationId;
          }
          
          // Validate the event
          await this.validateEvent(event);
          
          // Transform the event
          return this.transformEvent(event);
        })
      );
      
      // Log batch sending
      this.logger.log(
        `Sending batch of ${processedEvents.length} events to topic ${topic}`,
        { correlationId, eventCount: processedEvents.length }
      );
      
      // Prepare messages for Kafka
      const messages = processedEvents.map(event => {
        // Create Kafka message
        const kafkaMessage = createKafkaMessage(event, {
          ...this.producerConfig.defaultHeaders,
          correlationId: event.metadata?.correlationId as string || correlationId,
          source: event.source || this.constructor.name,
          timestamp: event.timestamp || new Date().toISOString(),
          schemaVersion: event.version || '1.0.0',
          ...options.headers
        });
        
        return {
          value: Buffer.from(JSON.stringify(kafkaMessage.value)),
          key: options.key ? Buffer.from(options.key) : (event.eventId ? Buffer.from(event.eventId) : null),
          headers: kafkaMessage.headers ? this.convertHeadersToBuffers(kafkaMessage.headers as unknown as Record<string, string>) : undefined
        };
      });
      
      // Ensure producer is connected
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Prepare the record
      const record: ProducerRecord = {
        topic,
        messages
      };
      
      // Send the batch
      let metadata: RecordMetadata[];
      if (requireAck) {
        // Send with acknowledgment
        metadata = await this.producer.send(record);
      } else {
        // Send without waiting for acknowledgment
        this.producer.send(record).catch(error => {
          this.logger.error(
            `Failed to send batch to topic ${topic} (no ack required): ${error.message}`,
            { topic, error: error.message, eventCount: messages.length }
          );
        });
        
        // Return empty metadata since we're not waiting for acknowledgment
        metadata = [];
      }
      
      // Create results for each event
      const results: SendResult[] = processedEvents.map((event, index) => ({
        success: true,
        topic,
        partition: metadata[index]?.partition,
        offset: metadata[index]?.offset,
        timestamp: new Date().toISOString(),
        correlationId: event.metadata?.correlationId as string || correlationId,
        metadata: metadata.length > 0 ? [metadata[index]] : []
      }));
      
      // Log success
      this.logger.log(
        `Batch of ${processedEvents.length} events sent to topic ${topic} (${Date.now() - startTime}ms)`,
        { correlationId, eventCount: processedEvents.length }
      );
      
      // End span
      span?.end();
      
      return results;
    } catch (error) {
      // Record error in span
      span?.recordException(error);
      span?.end();
      
      // Log failure
      this.logger.error(
        `Failed to send batch to topic ${topic}: ${error.message}`,
        { correlationId, eventCount: events.length, error: error.message }
      );
      
      // Create error context
      const errorContext: KafkaErrorContext = {
        topic,
        correlationId,
        operation: 'produce',
        batchSize: events.length
      };
      
      // Use error handler to handle the error
      await this.errorHandler.handleError(error, undefined, errorContext);
      
      // If configured to throw on error, rethrow
      if (options.throwOnError !== false) {
        throw error;
      }
      
      // Otherwise, return failure results for all events
      return events.map(event => ({
        success: false,
        error: error.message,
        errorCode: error.code || 'BATCH_SEND_FAILED',
        topic,
        timestamp: new Date().toISOString(),
        correlationId: event.metadata?.correlationId as string || correlationId
      }));
    }
  }
  
  /**
   * Determines if a batch of events can be sent using optimized batch sending
   * 
   * @param events The events to check
   * @param options The send options
   * @returns Whether batch sending can be used
   */
  protected canUseBatchSend(events: GamificationEvent<T>[], options: SendOptions): boolean {
    // If only one event, no need for batching
    if (events.length <= 1) {
      return false;
    }
    
    // If producer options disable batching, respect that
    if (this.producerConfig.options?.batchSize === 0) {
      return false;
    }
    
    // If events are too many, split into smaller batches
    const maxBatchSize = this.producerConfig.options?.batchSize || 16384;
    if (events.length > maxBatchSize) {
      return false;
    }
    
    // All events must be of the same type for efficient batching
    const eventTypes = new Set(events.map(e => e.eventType));
    if (eventTypes.size > 1) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Sends a message to the dead letter queue
   * 
   * @param event The original event that failed
   * @param error The error that caused the failure
   * @param retryCount The number of retry attempts
   * @returns Promise that resolves with the send result
   */
  async sendToDLQ(event: GamificationEvent<T>, error: Error, retryCount: number): Promise<SendResult> {
    const dlqTopic = this.producerConfig.topics.deadLetter;
    
    // If no DLQ topic is configured, log and return
    if (!dlqTopic) {
      this.logger.warn(
        'No dead letter queue topic configured, cannot send failed message to DLQ',
        { eventId: event.eventId, eventType: event.eventType, error: error.message }
      );
      
      return {
        success: false,
        error: 'No DLQ topic configured',
        errorCode: 'NO_DLQ_TOPIC',
        topic: 'none',
        timestamp: new Date().toISOString(),
        correlationId: event.metadata?.correlationId as string
      };
    }
    
    try {
      // Add error information to event metadata
      if (!event.metadata) {
        event.metadata = {};
      }
      
      event.metadata.error = {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack,
        retryCount
      };
      
      // Add original topic to metadata
      event.metadata.originalTopic = this.getTopicForEvent(event) || this.defaultTopic;
      
      // Send to DLQ with special options
      return await this.sendEvent(event, {
        topic: dlqTopic,
        headers: {
          'x-original-topic': event.metadata.originalTopic as string,
          'x-error-message': error.message,
          'x-retry-count': retryCount.toString(),
          'x-error-time': new Date().toISOString()
        },
        // Don't retry DLQ sends to avoid infinite loops
        retries: 0,
        // Don't throw on DLQ errors to avoid crashing the application
        throwOnError: false
      });
    } catch (dlqError) {
      // Log DLQ failure but don't throw
      this.logger.error(
        `Failed to send message to DLQ topic ${dlqTopic}: ${dlqError.message}`,
        { eventId: event.eventId, eventType: event.eventType, originalError: error.message }
      );
      
      return {
        success: false,
        error: dlqError.message,
        errorCode: 'DLQ_SEND_FAILED',
        topic: dlqTopic,
        timestamp: new Date().toISOString(),
        correlationId: event.metadata?.correlationId as string
      };
    }
  }
  
  /**
   * Validates an event before sending
   * 
   * This method can be overridden by subclasses to implement custom validation logic.
   * By default, it performs basic validation of required fields.
   * 
   * @param event The event to validate
   * @returns Promise that resolves if validation passes, or rejects if validation fails
   */
  protected async validateEvent(event: GamificationEvent<T>): Promise<void> {
    // Basic validation of required fields
    if (!event) {
      throw new Error('Event cannot be null or undefined');
    }
    
    if (!event.eventType) {
      throw new Error('Event must have an eventType');
    }
    
    if (!event.payload) {
      throw new Error('Event must have a payload');
    }
    
    // Schema validation if enabled
    if (this.producerConfig.schemaValidation?.enabled !== false) {
      // Perform schema validation
      const isValid = await this.validateEventSchema(event);
      
      if (!isValid && this.producerConfig.schemaValidation?.failOnError !== false) {
        throw new Error(`Event failed schema validation: ${event.eventType}`);
      }
    }
  }
  
  /**
   * Validates an event against its schema
   * 
   * This method should be implemented by subclasses to perform schema validation
   * specific to their event types. By default, it returns true.
   * 
   * @param event The event to validate
   * @returns Promise that resolves with a boolean indicating whether validation passed
   */
  protected async validateEventSchema(event: GamificationEvent<T>): Promise<boolean> {
    // Default implementation performs basic structural validation
    // Subclasses should override this method to implement more specific schema validation
    
    // Check for required fields in the event
    const requiredEventFields = ['eventId', 'eventType', 'timestamp', 'source', 'version', 'payload'];
    for (const field of requiredEventFields) {
      if (!event[field]) {
        this.logger.warn(
          `Event schema validation failed: missing required field '${field}'`,
          { eventType: event.eventType, correlationId: event.metadata?.correlationId }
        );
        return false;
      }
    }
    
    // Check that eventType is a valid enum value
    if (!Object.values(EventType).includes(event.eventType as EventType)) {
      this.logger.warn(
        `Event schema validation failed: invalid eventType '${event.eventType}'`,
        { eventType: event.eventType, correlationId: event.metadata?.correlationId }
      );
      return false;
    }
    
    // Check timestamp format (ISO 8601)
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
    if (!timestampRegex.test(event.timestamp)) {
      this.logger.warn(
        `Event schema validation failed: invalid timestamp format '${event.timestamp}'`,
        { eventType: event.eventType, correlationId: event.metadata?.correlationId }
      );
      return false;
    }
    
    // Check version format (semver)
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    if (!semverRegex.test(event.version)) {
      this.logger.warn(
        `Event schema validation failed: invalid version format '${event.version}'`,
        { eventType: event.eventType, correlationId: event.metadata?.correlationId }
      );
      return false;
    }
    
    // Payload should be an object
    if (!event.payload || typeof event.payload !== 'object') {
      this.logger.warn(
        `Event schema validation failed: payload must be an object`,
        { eventType: event.eventType, correlationId: event.metadata?.correlationId }
      );
      return false;
    }
    
    return true;
  }
  
  /**
   * Transforms an event before sending
   * 
   * This method can be overridden by subclasses to implement custom transformation logic.
   * By default, it returns the event unchanged.
   * 
   * @param event The event to transform
   * @returns Promise that resolves with the transformed event
   */
  protected async transformEvent(event: GamificationEvent<T>): Promise<GamificationEvent<T>> {
    // Default implementation returns the event unchanged
    // Subclasses should override this method to implement transformations
    return event;
  }
  
  /**
   * Gets the appropriate topic for an event based on its type
   * 
   * This method determines which topic to send an event to based on its type.
   * It uses the topic mappings from the producer configuration.
   * 
   * @param event The event to get the topic for
   * @returns The topic name, or undefined if no mapping is found
   */
  protected getTopicForEvent(event: GamificationEvent<T>): string | undefined {
    // Check for journey-specific topics based on event type
    if (event.eventType.startsWith('HEALTH_')) {
      return this.producerConfig.topics.health;
    }
    
    if (event.eventType.startsWith('CARE_')) {
      return this.producerConfig.topics.care;
    }
    
    if (event.eventType.startsWith('PLAN_')) {
      return this.producerConfig.topics.plan;
    }
    
    // Check for specific event categories
    if (event.eventType.includes('ACHIEVEMENT')) {
      return this.producerConfig.topics.achievements;
    }
    
    if (event.eventType.includes('QUEST')) {
      return this.producerConfig.topics.quests;
    }
    
    if (event.eventType.includes('REWARD')) {
      return this.producerConfig.topics.rewards;
    }
    
    if (event.eventType.includes('LEADERBOARD')) {
      return this.producerConfig.topics.leaderboards;
    }
    
    if (event.eventType.includes('NOTIFICATION')) {
      return this.producerConfig.topics.notifications;
    }
    
    // Fall back to default topic
    return this.defaultTopic;
  }
  
  /**
   * Sends a message to Kafka
   * 
   * This method handles the actual sending of a message to Kafka, including
   * serialization and acknowledgment handling.
   * 
   * @param topic The topic to send to
   * @param value The message value
   * @param key Optional message key for partitioning
   * @param headers Optional message headers
   * @param requireAck Whether to wait for acknowledgment
   * @returns Promise that resolves with the record metadata
   */
  protected async sendToKafka(
    topic: string,
    value: KafkaMessageValue<T>,
    key?: string,
    headers?: KafkaHeaders,
    requireAck = true
  ): Promise<RecordMetadata[]> {
    // Ensure producer is connected
    if (!this.isConnected) {
      await this.connect();
    }
    
    // Serialize the value to JSON
    const jsonValue = JSON.stringify(value);
    
    // Determine if compression should be applied
    const useCompression = this.shouldCompressMessage(jsonValue);
    let messageValue: Buffer;
    let messageHeaders = headers ? { ...headers } : {};
    
    if (useCompression) {
      // Compress the message
      messageValue = await this.compressMessage(jsonValue);
      messageHeaders['compression'] = 'gzip';
      
      this.logger.debug(
        `Compressed message from ${jsonValue.length} to ${messageValue.length} bytes`,
        { topic, compressionRatio: (messageValue.length / jsonValue.length).toFixed(2) }
      );
    } else {
      // Use uncompressed message
      messageValue = Buffer.from(jsonValue);
    }
    
    // Prepare the record
    const record: ProducerRecord = {
      topic,
      messages: [
        {
          value: messageValue,
          key: key ? Buffer.from(key) : null,
          headers: messageHeaders ? this.convertHeadersToBuffers(messageHeaders) : undefined
        }
      ]
    };
    
    // Send the record
    if (requireAck) {
      // Send with acknowledgment
      return await this.producer.send(record);
    } else {
      // Send without waiting for acknowledgment
      this.producer.send(record).catch(error => {
        this.logger.error(
          `Failed to send message to topic ${topic} (no ack required): ${error.message}`,
          { topic, error: error.message }
        );
      });
      
      // Return empty metadata since we're not waiting for acknowledgment
      return [];
    }
  }
  
  /**
   * Determines if a message should be compressed
   * 
   * @param jsonValue The JSON string to check
   * @returns Whether the message should be compressed
   */
  protected shouldCompressMessage(jsonValue: string): boolean {
    // Check if compression is enabled in producer options
    const compressionEnabled = this.producerConfig.options?.compression !== 'none';
    if (!compressionEnabled) {
      return false;
    }
    
    // Check if message exceeds compression threshold
    const threshold = this.producerConfig.options?.compressionThreshold || 1024;
    return Buffer.byteLength(jsonValue) > threshold;
  }
  
  /**
   * Compresses a message using gzip
   * 
   * @param jsonValue The JSON string to compress
   * @returns Promise that resolves with the compressed buffer
   */
  protected async compressMessage(jsonValue: string): Promise<Buffer> {
    // Use zlib to compress the message
    return new Promise<Buffer>((resolve, reject) => {
      const input = Buffer.from(jsonValue);
      import('zlib').then(zlib => {
        zlib.gzip(input, (err, compressed) => {
          if (err) {
            reject(err);
          } else {
            resolve(compressed);
          }
        });
      }).catch(reject);
    });
  }
  
  /**
   * Handles an error that occurred during message sending
   * 
   * @param error The error that occurred
   * @param event The event being sent
   * @param topic The topic being sent to
   * @param correlationId The correlation ID for tracing
   * @param retryCount The current retry count
   */
  protected async handleSendError(
    error: Error,
    event: GamificationEvent<T>,
    topic: string,
    correlationId: string,
    retryCount: number
  ): Promise<void> {
    // Create error context
    const errorContext: KafkaErrorContext = {
      topic,
      correlationId,
      retryCount,
      operation: 'produce',
      messageKey: event.eventId,
      messageValue: event,
      eventType: event.eventType
    };
    
    // Use error handler to handle the error
    await this.errorHandler.handleError(error, undefined, errorContext);
    
    // Send to DLQ if appropriate
    if (retryCount >= 0 && (retryCount >= (this.producerConfig.retry?.retries || 3))) {
      await this.sendToDLQ(event, error, retryCount);
    }
  }
  
  /**
   * Logs an event being sent
   * 
   * @param event The event being sent
   * @param topic The topic being sent to
   * @param correlationId The correlation ID for tracing
   */
  protected logEventSending(event: GamificationEvent<T>, topic: string, correlationId: string): void {
    // Use structured logger if available
    if (this.loggerService) {
      this.loggerService.log(
        `Sending event to topic ${topic}`,
        {
          eventId: event.eventId,
          eventType: event.eventType,
          topic,
          correlationId,
          source: event.source,
          timestamp: event.timestamp
        }
      );
      return;
    }
    
    // Otherwise use standard logger
    this.logger.log(
      `Sending event to topic ${topic}: ${event.eventType}`,
      { correlationId, eventId: event.eventId }
    );
  }
  
  /**
   * Logs a successfully sent event
   * 
   * @param event The event that was sent
   * @param result The send result
   * @param durationMs The duration of the send operation in milliseconds
   */
  protected logEventSent(event: GamificationEvent<T>, result: SendResult, durationMs: number): void {
    // Use structured logger if available
    if (this.loggerService) {
      this.loggerService.log(
        `Event sent to topic ${result.topic}`,
        {
          eventId: event.eventId,
          eventType: event.eventType,
          topic: result.topic,
          partition: result.partition,
          offset: result.offset,
          correlationId: result.correlationId,
          durationMs
        }
      );
      return;
    }
    
    // Otherwise use standard logger
    this.logger.log(
      `Event sent to topic ${result.topic}: ${event.eventType} (${durationMs}ms)`,
      { correlationId: result.correlationId, eventId: event.eventId, partition: result.partition, offset: result.offset }
    );
  }
  
  /**
   * Logs a failed event send
   * 
   * @param event The event that failed to send
   * @param error The error that occurred
   * @param retryCount The current retry count
   * @param durationMs The duration of the send operation in milliseconds
   */
  protected logEventSendFailure(event: GamificationEvent<T>, error: Error, retryCount: number, durationMs: number): void {
    // Use structured logger if available
    if (this.loggerService) {
      this.loggerService.error(
        `Failed to send event: ${error.message}`,
        {
          eventId: event.eventId,
          eventType: event.eventType,
          error: error.message,
          stack: error.stack,
          retryCount,
          correlationId: event.metadata?.correlationId,
          durationMs
        },
        error.stack
      );
      return;
    }
    
    // Otherwise use standard logger
    this.logger.error(
      `Failed to send event: ${error.message}`,
      { correlationId: event.metadata?.correlationId, eventId: event.eventId, retryCount, durationMs }
    );
  }
  
  /**
   * Generates a correlation ID for an event
   * 
   * @param event The event to generate a correlation ID for
   * @returns A unique correlation ID
   */
  protected generateCorrelationId(event: GamificationEvent<T>): string {
    return `${this.constructor.name}-${event.eventType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Calculates the delay before retrying a failed send
   * 
   * @param retryCount The current retry count
   * @returns The delay in milliseconds
   */
  protected calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.producerConfig.retry?.initialRetryTime || 100;
    const maxDelay = this.producerConfig.retry?.maxRetryTime || 30000;
    const useJitter = this.producerConfig.retry?.jitter !== false;
    
    // Calculate exponential backoff: baseDelay * 2^retryCount
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    
    // Apply jitter if enabled
    if (useJitter) {
      // Apply a random jitter of up to 25% to prevent thundering herd problem
      const jitter = Math.random() * 0.25 * exponentialDelay;
      
      // Apply the jitter (randomly add or subtract)
      const delayWithJitter = Math.random() > 0.5 
        ? exponentialDelay + jitter 
        : Math.max(baseDelay, exponentialDelay - jitter);
      
      // Ensure we don't exceed the maximum delay
      return Math.min(delayWithJitter, maxDelay);
    }
    
    // Without jitter, just cap at maximum delay
    return Math.min(exponentialDelay, maxDelay);
  }
  
  /**
   * Groups events by the topic they should be sent to
   * 
   * @param events The events to group
   * @param overrideTopic Optional topic to override the default topic mapping
   * @returns A map of topic to events
   */
  protected groupEventsByTopic(events: GamificationEvent<T>[], overrideTopic?: string): Record<string, GamificationEvent<T>[]> {
    const eventsByTopic: Record<string, GamificationEvent<T>[]> = {};
    
    for (const event of events) {
      const topic = overrideTopic || this.getTopicForEvent(event) || this.defaultTopic;
      
      if (!eventsByTopic[topic]) {
        eventsByTopic[topic] = [];
      }
      
      eventsByTopic[topic].push(event);
    }
    
    return eventsByTopic;
  }
  
  /**
   * Converts string headers to Buffer headers for KafkaJS
   * 
   * @param headers The headers to convert
   * @returns Headers with Buffer values
   */
  protected convertHeadersToBuffers(headers: Record<string, string>): Record<string, Buffer> {
    const result: Record<string, Buffer> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        result[key] = Buffer.from(value);
      }
    }
    
    return result;
  }
  
  /**
   * Enhances the producer with custom methods
   * 
   * This method adds the sendEvent and sendEvents methods to the typed producer
   * to provide a more convenient API for sending messages.
   */
  protected enhanceProducer(): void {
    // Add sendEvent method to the producer
    this.typedProducer.sendEvent = async (
      event: GamificationEvent<T>,
      topic?: string,
      key?: string,
      headers?: KafkaHeaders
    ): Promise<RecordMetadata[]> => {
      return (await this.sendEvent(event, { topic, key, headers })).metadata || [];
    };
    
    // Add sendEvents method to the producer
    this.typedProducer.sendEvents = async (
      events: GamificationEvent<T>[],
      topic?: string
    ): Promise<RecordMetadata[]> => {
      const results = await this.sendEvents(events, { topic });
      return results.flatMap(result => result.metadata || []);
    };
    
    // Add sendToDLQ method to the producer
    this.typedProducer.sendToDLQ = async (
      message: any,
      error: Error,
      retryCount: number
    ): Promise<RecordMetadata[]> => {
      return (await this.sendToDLQ(message, error, retryCount)).metadata || [];
    };
  }
  
  /**
   * Utility method to sleep for a specified duration
   * 
   * @param ms The duration to sleep in milliseconds
   * @returns Promise that resolves after the specified duration
   */
  /**
   * Sends a message to Kafka within a transaction
   * 
   * This method handles sending a message within a Kafka transaction, ensuring
   * that the message is either committed or aborted atomically.
   * 
   * @param topic The topic to send to
   * @param value The message value
   * @param key Optional message key for partitioning
   * @param headers Optional message headers
   * @param transactionId Optional transaction ID
   * @returns Promise that resolves with the record metadata
   */
  protected async sendTransactional(
    topic: string,
    value: KafkaMessageValue<T>,
    key?: string,
    headers?: KafkaHeaders,
    transactionId?: string
  ): Promise<RecordMetadata[]> {
    // Ensure producer is connected
    if (!this.isConnected) {
      await this.connect();
    }
    
    // Serialize the value to JSON
    const jsonValue = JSON.stringify(value);
    
    // Determine if compression should be applied
    const useCompression = this.shouldCompressMessage(jsonValue);
    let messageValue: Buffer;
    let messageHeaders = headers ? { ...headers } : {};
    
    if (useCompression) {
      // Compress the message
      messageValue = await this.compressMessage(jsonValue);
      messageHeaders['compression'] = 'gzip';
    } else {
      // Use uncompressed message
      messageValue = Buffer.from(jsonValue);
    }
    
    // Prepare the record
    const record: ProducerRecord = {
      topic,
      messages: [
        {
          value: messageValue,
          key: key ? Buffer.from(key) : null,
          headers: messageHeaders ? this.convertHeadersToBuffers(messageHeaders) : undefined
        }
      ]
    };
    
    try {
      // Initialize transaction
      await this.producer.transaction();
      
      // Send the record within the transaction
      const metadata = await this.producer.send(record);
      
      // Commit the transaction
      await this.producer.commitTransaction();
      
      return metadata;
    } catch (error) {
      // Abort the transaction on error
      try {
        await this.producer.abortTransaction();
      } catch (abortError) {
        this.logger.error(
          `Failed to abort transaction: ${abortError.message}`,
          { topic, originalError: error.message }
        );
      }
      
      // Rethrow the original error
      throw error;
    }
  }
  
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}