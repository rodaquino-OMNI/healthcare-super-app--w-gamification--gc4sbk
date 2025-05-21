/**
 * @file base-producer.abstract.ts
 * @description Abstract base class for Kafka producers that handles message serialization,
 * topic routing, and delivery acknowledgment. Implements at-least-once delivery semantics
 * with configurable retry attempts, and provides hooks for message transformation and
 * validation before sending.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Producer, Kafka, RecordMetadata, ProducerRecord, Message } from 'kafkajs';

// Import from @austa/interfaces package for standardized event schemas
import {
  GamificationEvent,
  EventType,
  EventVersion
} from '@austa/interfaces/gamification/events';

// Import from kafka.types.ts for Kafka-specific types
import {
  KafkaHeaders,
  KafkaClientConfig,
  KafkaProducerConfig,
  KafkaError,
  KafkaErrorType,
  toKafkaEvent,
  createDeadLetterEvent
} from './kafka.types';

/**
 * Options for producing a message to Kafka
 */
export interface ProduceOptions<T = unknown> {
  /** The event to produce */
  event: GamificationEvent<T>;
  
  /** Optional topic override */
  topic?: string;
  
  /** Optional headers to include with the message */
  headers?: Record<string, string>;
  
  /** Optional key for the message (defaults to userId) */
  key?: string;
  
  /** Optional callback to be called when the message is acknowledged */
  onSuccess?: (metadata: RecordMetadata) => void;
  
  /** Optional callback to be called when the message delivery fails */
  onError?: (error: Error) => void;
}

/**
 * Result of a message production operation
 */
export interface ProduceResult {
  /** Topic the message was sent to */
  topic: string;
  
  /** Partition the message was sent to */
  partition: number;
  
  /** Offset of the message in the partition */
  offset: string;
  
  /** Timestamp of the message */
  timestamp: string;
  
  /** Correlation ID for distributed tracing */
  correlationId: string;
}

/**
 * Configuration for the BaseProducer
 */
export interface BaseProducerConfig {
  /** Client configuration for Kafka */
  client: KafkaClientConfig;
  
  /** Producer-specific configuration */
  producer: KafkaProducerConfig;
  
  /** Default topic to produce to if none specified */
  defaultTopic: string;
  
  /** Whether to enable idempotent production (exactly-once semantics) */
  idempotent?: boolean;
  
  /** Maximum number of retry attempts for failed productions */
  maxRetries?: number;
  
  /** Initial retry delay in milliseconds */
  initialRetryDelayMs?: number;
  
  /** Maximum retry delay in milliseconds */
  maxRetryDelayMs?: number;
}

/**
 * Abstract base class for Kafka producers that handles message serialization,
 * topic routing, and delivery acknowledgment. Implements at-least-once delivery semantics
 * with configurable retry attempts, and provides hooks for message transformation and
 * validation before sending.
 */
@Injectable()
export abstract class BaseProducer implements OnModuleInit, OnModuleDestroy {
  protected producer: Producer;
  protected kafka: Kafka;
  protected isConnected = false;
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly config: BaseProducerConfig;

  /**
   * Creates an instance of BaseProducer.
   * @param configService Service for accessing configuration
   */
  constructor(protected readonly configService: ConfigService) {
    this.config = this.loadConfiguration();
    this.logger.log(`Initialized with config: ${JSON.stringify({
      clientId: this.config.client.clientId,
      brokers: this.config.client.brokers,
      defaultTopic: this.config.defaultTopic,
      idempotent: this.config.idempotent
    })}`);
  }

  /**
   * Loads configuration from ConfigService
   * @returns BaseProducerConfig object
   */
  protected loadConfiguration(): BaseProducerConfig {
    return {
      client: {
        clientId: this.configService.get<string>(
          'kafka.producer.clientId',
          `${this.constructor.name.toLowerCase()}`
        ),
        brokers: this.configService.get<string>(
          'kafka.brokers',
          'localhost:9092'
        ).split(','),
        ssl: this.configService.get<boolean>(
          'kafka.ssl',
          false
        ),
        logLevel: this.configService.get(
          'kafka.logLevel',
          1 // ERROR
        ),
        sasl: this.getSaslConfig()
      },
      producer: {
        idempotent: this.configService.get<boolean>(
          'kafka.producer.idempotent',
          true
        ),
        transactional: this.configService.get<boolean>(
          'kafka.producer.transactional',
          false
        ),
        transactionalId: this.configService.get<string>(
          'kafka.producer.transactionalId',
          undefined
        ),
        maxInFlightRequests: this.configService.get<number>(
          'kafka.producer.maxInFlightRequests',
          5
        ),
        retry: {
          maxRetries: this.configService.get<number>(
            'kafka.producer.retry.maxRetries',
            5
          ),
          initialRetryTime: this.configService.get<number>(
            'kafka.producer.retry.initialDelayMs',
            100
          ),
          maxRetryTime: this.configService.get<number>(
            'kafka.producer.retry.maxDelayMs',
            30000
          )
        }
      },
      defaultTopic: this.configService.get<string>(
        'kafka.topics.default',
        'gamification-events'
      ),
      maxRetries: this.configService.get<number>(
        'kafka.producer.maxRetries',
        5
      ),
      initialRetryDelayMs: this.configService.get<number>(
        'kafka.producer.initialRetryDelayMs',
        100
      ),
      maxRetryDelayMs: this.configService.get<number>(
        'kafka.producer.maxRetryDelayMs',
        30000
      ),
      idempotent: this.configService.get<boolean>(
        'kafka.producer.idempotent',
        true
      )
    };
  }

  /**
   * Gets SASL configuration if enabled
   * @returns SASL configuration object or undefined
   */
  protected getSaslConfig() {
    const saslEnabled = this.configService.get<boolean>(
      'kafka.sasl.enabled',
      false
    );

    if (saslEnabled) {
      return {
        mechanism: this.configService.get<'plain' | 'scram-sha-256' | 'scram-sha-512'>(
          'kafka.sasl.mechanism',
          'plain'
        ),
        username: this.configService.get<string>(
          'kafka.sasl.username',
          ''
        ),
        password: this.configService.get<string>(
          'kafka.sasl.password',
          ''
        )
      };
    }

    return undefined;
  }

  /**
   * Initialize the Kafka producer on module initialization
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing Kafka producer');

      // Create Kafka instance
      this.kafka = new Kafka({
        clientId: this.config.client.clientId,
        brokers: this.config.client.brokers,
        ssl: this.config.client.ssl,
        sasl: this.config.client.sasl,
        logLevel: this.config.client.logLevel,
        retry: {
          initialRetryTime: this.config.producer.retry.initialRetryTime,
          retries: this.config.producer.retry.maxRetries,
          maxRetryTime: this.config.producer.retry.maxRetryTime
        }
      });

      // Create producer
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        idempotent: this.config.idempotent,
        maxInFlightRequests: this.config.producer.maxInFlightRequests,
        transactional: this.config.producer.transactional,
        transactionalId: this.config.producer.transactionalId
      });

      // Connect to Kafka
      await this.producer.connect();
      this.isConnected = true;

      this.logger.log('Kafka producer connected successfully');

      // Set up event handlers
      this.producer.on('producer.disconnect', () => {
        this.isConnected = false;
        this.logger.warn('Kafka producer disconnected');
      });

      this.producer.on('producer.connect', () => {
        this.isConnected = true;
        this.logger.log('Kafka producer reconnected');
      });

      // Call hook for subclass initialization
      await this.onProducerInit();
    } catch (error) {
      this.logger.error(
        `Failed to initialize Kafka producer: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Hook for subclasses to perform additional initialization
   * Override this method in subclasses to add custom initialization logic
   */
  protected async onProducerInit(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Clean up resources on module destruction
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.producer && this.isConnected) {
        this.logger.log('Disconnecting Kafka producer');
        await this.producer.disconnect();
        this.isConnected = false;
        this.logger.log('Kafka producer disconnected successfully');
      }
    } catch (error) {
      this.logger.error(
        `Error disconnecting Kafka producer: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Determines the appropriate Kafka topic for an event
   * Override this method in subclasses to implement custom topic routing logic
   * 
   * @param event The event to determine the topic for
   * @returns The appropriate Kafka topic
   */
  protected abstract getTopicForEvent<T>(event: GamificationEvent<T>): string;

  /**
   * Transforms an event before sending it to Kafka
   * Override this method in subclasses to implement custom transformation logic
   * 
   * @param event The event to transform
   * @returns The transformed event
   */
  protected transformEvent<T>(event: GamificationEvent<T>): GamificationEvent<T> {
    // Default implementation returns the event unchanged
    return event;
  }

  /**
   * Validates an event before sending it to Kafka
   * Override this method in subclasses to implement custom validation logic
   * 
   * @param event The event to validate
   * @returns True if the event is valid, false otherwise
   */
  protected validateEvent<T>(event: GamificationEvent<T>): boolean {
    // Default implementation considers all events valid
    return true;
  }

  /**
   * Checks if the producer is connected to Kafka
   * 
   * @returns True if the producer is connected, false otherwise
   * @throws Error if the producer is not initialized
   */
  public isProducerConnected(): boolean {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }
    return this.isConnected;
  }

  /**
   * Generates a correlation ID for distributed tracing
   * Override this method in subclasses to implement custom correlation ID generation
   * 
   * @returns A unique correlation ID
   */
  protected generateCorrelationId(): string {
    return crypto.randomUUID();
  }

  /**
   * Creates Kafka message headers for an event
   * 
   * @param event The event to create headers for
   * @param correlationId The correlation ID for distributed tracing
   * @param additionalHeaders Additional headers to include
   * @returns Headers object for the Kafka message
   */
  protected createMessageHeaders<T>(
    event: GamificationEvent<T>,
    correlationId: string,
    additionalHeaders?: Record<string, string>
  ): Record<string, string> {
    return {
      [KafkaHeaders.CORRELATION_ID]: correlationId,
      [KafkaHeaders.EVENT_TYPE]: event.type,
      [KafkaHeaders.JOURNEY]: event.journey || 'unknown',
      [KafkaHeaders.TIMESTAMP]: new Date().toISOString(),
      [KafkaHeaders.VERSION]: `${event.version.major}.${event.version.minor}.${event.version.patch}`,
      [KafkaHeaders.SOURCE]: event.source || this.config.client.clientId,
      [KafkaHeaders.CONTENT_TYPE]: 'application/json',
      ...additionalHeaders
    };
  }

  /**
   * Serializes an event for sending to Kafka
   * 
   * @param event The event to serialize
   * @returns Serialized event as a string
   */
  protected serializeEvent<T>(event: GamificationEvent<T>): string {
    try {
      return JSON.stringify(event);
    } catch (error) {
      this.logger.error(
        `Failed to serialize event: ${error.message}`,
        error.stack
      );
      throw new Error(`Event serialization failed: ${error.message}`);
    }
  }

  /**
   * Creates a Kafka message from an event
   * 
   * @param event The event to create a message from
   * @param key The message key (defaults to userId)
   * @param headers Additional headers to include
   * @param correlationId The correlation ID for distributed tracing
   * @returns Kafka message object
   */
  protected createMessage<T>(
    event: GamificationEvent<T>,
    key?: string,
    headers?: Record<string, string>,
    correlationId?: string
  ): Message {
    const messageCorrelationId = correlationId || this.generateCorrelationId();
    const messageKey = key || event.userId;
    const messageHeaders = this.createMessageHeaders(event, messageCorrelationId, headers);
    const messageValue = this.serializeEvent(event);

    return {
      key: messageKey,
      value: messageValue,
      headers: messageHeaders
    };
  }

  /**
   * Creates a producer record for sending to Kafka
   * 
   * @param topic The topic to send to
   * @param messages The messages to send
   * @returns Producer record object
   */
  protected createProducerRecord(topic: string, messages: Message[]): ProducerRecord {
    return {
      topic,
      messages
    };
  }

  /**
   * Handles errors that occur during message production
   * 
   * @param error The error that occurred
   * @param event The event that failed to produce
   * @param topic The topic that was being produced to
   * @param correlationId The correlation ID for distributed tracing
   * @returns KafkaError with additional context
   */
  protected handleProduceError<T>(
    error: Error,
    event: GamificationEvent<T>,
    topic: string,
    correlationId: string
  ): KafkaError {
    // Determine if the error is retriable
    const isRetriable = this.isRetriableError(error);
    const errorType = isRetriable ? KafkaErrorType.RETRIABLE : KafkaErrorType.TERMINAL;

    // Create a structured error with additional context
    const kafkaError = new Error(`Failed to produce event ${event.type} to topic ${topic}: ${error.message}`) as KafkaError;
    kafkaError.type = errorType;
    kafkaError.retriable = isRetriable;
    kafkaError.originalError = error;
    kafkaError.metadata = {
      eventType: event.type,
      userId: event.userId,
      correlationId,
      topic
    };

    // Log the error with context
    this.logger.error(
      `${kafkaError.message} (${errorType}, retriable: ${isRetriable})`,
      {
        error: error.stack,
        eventType: event.type,
        userId: event.userId,
        correlationId,
        topic
      }
    );

    return kafkaError;
  }

  /**
   * Determines if an error is retriable
   * 
   * @param error The error to check
   * @returns True if the error is retriable, false otherwise
   */
  protected isRetriableError(error: Error): boolean {
    // List of error types that are considered retriable
    const retriableErrorTypes = [
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'REQUEST_TIMEOUT',
      'LEADER_NOT_AVAILABLE',
      'NOT_LEADER_FOR_PARTITION',
      'BROKER_NOT_AVAILABLE',
      'GROUP_COORDINATOR_NOT_AVAILABLE',
      'NOT_COORDINATOR_FOR_GROUP',
      'INVALID_REQUIRED_ACKS',
      'TOPIC_AUTHORIZATION_FAILED'
    ];

    // Check if the error message contains any of the retriable error types
    return retriableErrorTypes.some(type => error.message.includes(type));
  }

  /**
   * Calculates the delay for the next retry attempt using exponential backoff
   * 
   * @param attempt The current attempt number (starting from 1)
   * @returns Delay in milliseconds before the next retry
   */
  protected calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.initialRetryDelayMs || 100;
    const maxDelay = this.config.maxRetryDelayMs || 30000;
    
    // Exponential backoff with jitter: baseDelay * 2^(attempt-1) * (0.5 + random(0, 0.5))
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = 0.5 + Math.random() * 0.5;
    const delay = exponentialDelay * jitter;
    
    // Cap at maximum delay
    return Math.min(delay, maxDelay);
  }

  /**
   * Produces a message to Kafka with type safety and reliability
   * 
   * @param options Options for producing the message
   * @returns A promise that resolves with the record metadata when the message is acknowledged
   * @throws Error if the message cannot be produced
   */
  public async produce<T>(options: ProduceOptions<T>): Promise<ProduceResult> {
    const { event, topic, headers, key, onSuccess, onError } = options;
    const correlationId = event.correlationId || this.generateCorrelationId();
    let attempt = 0;
    const maxRetries = this.config.maxRetries || 5;

    try {
      // Check if producer is connected
      if (!this.isProducerConnected()) {
        throw new Error('Kafka producer not connected');
      }

      // Validate the event
      if (!this.validateEvent(event)) {
        throw new Error(`Event validation failed for event type ${event.type}`);
      }

      // Transform the event
      const transformedEvent = this.transformEvent(event);

      // Add correlation ID to event if not present
      if (!transformedEvent.correlationId) {
        transformedEvent.correlationId = correlationId;
      }

      // Determine the topic to use
      const targetTopic = topic || this.getTopicForEvent(transformedEvent);

      // Convert to Kafka-specific event format
      const kafkaEvent = toKafkaEvent(transformedEvent);

      // Create the message
      const message = this.createMessage(kafkaEvent, key, headers, correlationId);

      // Create the producer record
      const record = this.createProducerRecord(targetTopic, [message]);

      // Retry loop for producing the message
      while (true) {
        attempt++;

        try {
          // Send the message to Kafka
          this.logger.log(
            `Producing event ${event.type} to topic ${targetTopic} (attempt ${attempt}/${maxRetries})`,
            {
              eventType: event.type,
              userId: event.userId,
              correlationId,
              topic: targetTopic,
              attempt
            }
          );

          const result = await this.producer.send(record);
          const metadata = result[0];

          // Log successful production
          this.logger.log(
            `Event ${event.type} produced successfully to topic ${targetTopic}`,
            {
              eventType: event.type,
              userId: event.userId,
              correlationId,
              topic: targetTopic,
              partition: metadata.partition,
              offset: metadata.offset
            }
          );

          // Call success callback if provided
          if (onSuccess) {
            onSuccess(metadata);
          }

          // Return the result
          return {
            topic: targetTopic,
            partition: metadata.partition,
            offset: metadata.offset,
            timestamp: metadata.timestamp,
            correlationId
          };
        } catch (error) {
          // Handle the error
          const kafkaError = this.handleProduceError(error, event, targetTopic, correlationId);

          // If the error is not retriable or we've reached the maximum number of retries, throw
          if (!kafkaError.retriable || attempt >= maxRetries) {
            // Create a dead letter event for the failed message
            const deadLetterEvent = createDeadLetterEvent(kafkaEvent, {
              message: error.message,
              code: kafkaError.type,
              stack: error.stack
            });

            // Try to send the dead letter event, but don't retry if it fails
            try {
              const deadLetterTopic = `${targetTopic}.dead-letter`;
              const deadLetterMessage = this.createMessage(deadLetterEvent);
              const deadLetterRecord = this.createProducerRecord(deadLetterTopic, [deadLetterMessage]);
              await this.producer.send(deadLetterRecord);
              this.logger.log(`Dead letter event sent to topic ${deadLetterTopic}`);
            } catch (dlqError) {
              this.logger.error(
                `Failed to send dead letter event: ${dlqError.message}`,
                dlqError.stack
              );
            }

            // Call error callback if provided
            if (onError) {
              onError(kafkaError);
            }

            throw kafkaError;
          }

          // Calculate the delay for the next retry
          const retryDelay = this.calculateRetryDelay(attempt);
          this.logger.log(
            `Retrying event ${event.type} in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`,
            {
              eventType: event.type,
              userId: event.userId,
              correlationId,
              topic: targetTopic,
              attempt,
              retryDelay
            }
          );

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch (error) {
      // Call error callback if provided
      if (onError) {
        onError(error);
      }

      // Rethrow the error
      throw error;
    }
  }

  /**
   * Produces a batch of messages to Kafka with type safety and reliability
   * 
   * @param events Array of events to produce
   * @param topic Optional topic override
   * @returns A promise that resolves with an array of record metadata when all messages are acknowledged
   * @throws Error if any message cannot be produced
   */
  public async produceBatch<T>(events: GamificationEvent<T>[], topic?: string): Promise<ProduceResult[]> {
    try {
      // Check if producer is connected
      if (!this.isProducerConnected()) {
        throw new Error('Kafka producer not connected');
      }

      // Group events by topic
      const eventsByTopic = new Map<string, GamificationEvent<T>[]>();

      for (const event of events) {
        // Validate the event
        if (!this.validateEvent(event)) {
          throw new Error(`Event validation failed for event type ${event.type}`);
        }

        // Transform the event
        const transformedEvent = this.transformEvent(event);

        // Add correlation ID to event if not present
        if (!transformedEvent.correlationId) {
          transformedEvent.correlationId = this.generateCorrelationId();
        }

        // Determine the topic to use
        const targetTopic = topic || this.getTopicForEvent(transformedEvent);

        // Add the event to the appropriate topic group
        if (!eventsByTopic.has(targetTopic)) {
          eventsByTopic.set(targetTopic, []);
        }
        eventsByTopic.get(targetTopic).push(transformedEvent);
      }

      // Create producer records for each topic
      const records: ProducerRecord[] = [];

      for (const [topicName, topicEvents] of eventsByTopic.entries()) {
        const messages = topicEvents.map(event => {
          // Convert to Kafka-specific event format
          const kafkaEvent = toKafkaEvent(event);
          return this.createMessage(kafkaEvent);
        });

        records.push(this.createProducerRecord(topicName, messages));
      }

      // Send all messages to Kafka
      this.logger.log(
        `Producing batch of ${events.length} events to ${records.length} topics`,
        { batchSize: events.length, topicCount: records.length }
      );

      const results = await Promise.all(records.map(record => this.producer.send(record)));
      const metadata = results.flatMap(result => result);

      // Log successful production
      this.logger.log(
        `Batch of ${events.length} events produced successfully`,
        { batchSize: events.length, topicCount: records.length }
      );

      // Return the results
      return metadata.map(meta => ({
        topic: meta.topicName,
        partition: meta.partition,
        offset: meta.offset,
        timestamp: meta.timestamp,
        correlationId: 'batch'
      }));
    } catch (error) {
      this.logger.error(
        `Failed to produce batch of events: ${error.message}`,
        { error: error.stack, batchSize: events.length }
      );

      // Rethrow the error
      throw error;
    }
  }

  /**
   * Flushes any pending messages to Kafka
   * 
   * @returns A promise that resolves when all pending messages are flushed
   */
  public async flush(): Promise<void> {
    if (this.isProducerConnected()) {
      await this.producer.flush();
      this.logger.log('Kafka producer flushed successfully');
    }
  }
}