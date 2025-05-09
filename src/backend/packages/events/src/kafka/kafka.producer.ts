/**
 * @file kafka.producer.ts
 * @description Implements a reliable Kafka producer with guaranteed message delivery, retry policies,
 * circuit breaker patterns, and observability. This service handles the production of messages to
 * Kafka topics with standardized serialization, headers for distributed tracing, and comprehensive
 * error handling.
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord, RecordMetadata, Message as KafkaJsMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IKafkaMessage, IKafkaProducer, IKafkaProducerConfig } from './kafka.interfaces';
import { KafkaHeaders, KafkaRetryPolicy } from './kafka.constants';
import {
  KafkaCircuitBreaker,
  KafkaError,
  KafkaErrorCategory,
  KafkaProducerError,
  KafkaSerializationError,
  KafkaTopicError,
  KafkaValidationError,
  categorizeKafkaError,
  calculateRetryDelay,
  shouldRetry,
  CircuitState
} from './kafka.errors';

/**
 * Implementation of the Kafka producer service
 * Provides reliable message production with retry policies and circuit breaker patterns
 */
@Injectable()
export class KafkaProducer implements IKafkaProducer, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private producer: Producer;
  private connected = false;
  private readonly circuitBreaker: KafkaCircuitBreaker;
  private readonly config: IKafkaProducerConfig;
  private readonly defaultTopic?: string;
  private readonly clientId: string;
  private readonly metrics = {
    messagesProduced: 0,
    productionErrors: 0,
    retries: 0,
    totalLatencyMs: 0,
    topicMetrics: new Map<string, {
      messagesProduced: number;
      productionErrors: number;
      retries: number;
      totalLatencyMs: number;
    }>(),
  };

  /**
   * Creates a new KafkaProducer instance
   * @param kafka - Kafka client instance
   * @param config - Producer configuration
   */
  constructor(
    private readonly kafka: Kafka,
    @Optional() config?: IKafkaProducerConfig
  ) {
    this.config = {
      ...config,
      maxRetries: config?.maxRetries ?? KafkaRetryPolicy.DEFAULT_PRODUCER_MAX_RETRIES,
      retryBackoffStrategy: config?.retryBackoffStrategy ?? 'exponential',
      initialRetryDelayMs: config?.initialRetryDelayMs ?? KafkaRetryPolicy.DEFAULT_INITIAL_RETRY_DELAY,
    };
    
    this.defaultTopic = config?.defaultTopic;
    this.clientId = kafka.config.clientId;
    
    // Initialize circuit breaker
    this.circuitBreaker = new KafkaCircuitBreaker(`producer-${this.clientId}`, {
      failureThreshold: KafkaRetryPolicy.DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
      resetTimeoutMs: KafkaRetryPolicy.DEFAULT_CIRCUIT_BREAKER_RESET_TIMEOUT,
    });
    
    // Initialize producer
    this.producer = this.kafka.producer(this.config);
  }

  /**
   * Lifecycle hook that runs when the module is initialized
   * Connects to Kafka
   */
  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  /**
   * Lifecycle hook that runs when the module is destroyed
   * Disconnects from Kafka
   */
  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Connects the producer to Kafka
   * @throws {KafkaConnectionError} If connection fails
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      this.logger.log('Connecting Kafka producer...');
      await this.producer.connect();
      this.connected = true;
      this.logger.log('Kafka producer connected successfully');
      
      // Reset circuit breaker on successful connection
      this.circuitBreaker.reset();
    } catch (error) {
      const kafkaError = categorizeKafkaError(error as Error, {
        clientId: this.clientId,
      });
      
      this.logger.error(`Failed to connect Kafka producer: ${kafkaError.message}`, kafkaError.stack);
      this.connected = false;
      throw kafkaError;
    }
  }

  /**
   * Disconnects the producer from Kafka
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      this.logger.log('Disconnecting Kafka producer...');
      await this.producer.disconnect();
      this.connected = false;
      this.logger.log('Kafka producer disconnected successfully');
    } catch (error) {
      const kafkaError = categorizeKafkaError(error as Error, {
        clientId: this.clientId,
      });
      
      this.logger.error(`Error disconnecting Kafka producer: ${kafkaError.message}`, kafkaError.stack);
      // Don't throw here to avoid issues during shutdown
    } finally {
      this.connected = false;
    }
  }

  /**
   * Produces a message to a Kafka topic with retry logic and circuit breaker
   * @param message - Message to produce
   * @returns Promise resolving to the record metadata
   * @throws {KafkaProducerError} If production fails after retries
   * @throws {KafkaTopicError} If topic is not provided and no default topic is configured
   * @throws {KafkaValidationError} If message validation fails
   */
  async produce<T = any>(message: IKafkaMessage<T>): Promise<RecordMetadata> {
    // Check circuit breaker state
    if (!this.circuitBreaker.isAllowed()) {
      const error = new KafkaProducerError(
        `Circuit breaker is open, message production to topic ${message.topic} is not allowed`,
        {
          topic: message.topic,
          clientId: this.clientId,
          circuitState: this.circuitBreaker.getState(),
        }
      );
      
      this.logger.warn(`Circuit breaker open: ${error.message}`);
      throw error;
    }

    // Validate message
    this.validateMessage(message);

    // Ensure connection
    if (!this.connected) {
      await this.connect();
    }

    const topic = message.topic || this.defaultTopic;
    if (!topic) {
      throw new KafkaTopicError(
        'No topic specified and no default topic configured',
        { clientId: this.clientId }
      );
    }

    // Prepare the Kafka message
    const kafkaMessage: KafkaJsMessage = {
      key: message.key,
      value: this.serializeValue(message.value),
      headers: this.prepareHeaders(message.headers),
      timestamp: message.timestamp,
    };

    // Prepare the producer record
    const record: ProducerRecord = {
      topic,
      messages: [kafkaMessage],
      ...(message.partition !== undefined ? { partition: message.partition } : {}),
    };

    // Implement retry logic
    let retryCount = 0;
    let lastError: Error | null = null;
    const startTime = Date.now();

    while (retryCount <= this.config.maxRetries!) {
      try {
        const result = await this.producer.send(record);
        
        // Record metrics on success
        const latency = Date.now() - startTime;
        this.recordMetrics(topic, true, retryCount, latency);
        
        // Record success in circuit breaker
        this.circuitBreaker.recordSuccess();
        
        if (retryCount > 0) {
          this.logger.log(`Successfully produced message to ${topic} after ${retryCount} retries`);
        } else {
          this.logger.debug(`Successfully produced message to ${topic}`);
        }
        
        return result[0]; // Return the first partition's metadata
      } catch (error) {
        lastError = error as Error;
        
        const kafkaError = categorizeKafkaError(lastError, {
          topic,
          clientId: this.clientId,
          retryCount,
        });

        // Check if we should retry
        if (retryCount < this.config.maxRetries! && shouldRetry(kafkaError, retryCount)) {
          retryCount++;
          this.metrics.retries++;
          
          const delay = calculateRetryDelay(
            kafkaError,
            retryCount,
            {
              maxRetries: this.config.maxRetries!,
              initialDelayMs: this.config.initialRetryDelayMs!,
              maxDelayMs: KafkaRetryPolicy.DEFAULT_MAX_RETRY_DELAY,
              backoffFactor: KafkaRetryPolicy.DEFAULT_RETRY_DELAY_MULTIPLIER,
            }
          );
          
          this.logger.warn(
            `Error producing message to ${topic}, retrying (${retryCount}/${this.config.maxRetries}) after ${delay}ms: ${kafkaError.message}`
          );
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Record failure in circuit breaker
        this.circuitBreaker.recordFailure(kafkaError);
        
        // Record metrics on failure
        this.recordMetrics(topic, false, retryCount, Date.now() - startTime);
        
        this.logger.error(
          `Failed to produce message to ${topic} after ${retryCount} retries: ${kafkaError.message}`,
          kafkaError.stack
        );
        
        throw kafkaError;
      }
    }

    // This should never happen due to the while loop condition, but TypeScript needs it
    const finalError = lastError || new Error('Unknown error during message production');
    throw categorizeKafkaError(finalError, {
      topic,
      clientId: this.clientId,
      retryCount,
    });
  }

  /**
   * Produces multiple messages to Kafka topics
   * @param messages - Array of messages to produce
   * @returns Promise resolving to an array of record metadata
   */
  async produceMany<T = any>(messages: IKafkaMessage<T>[]): Promise<RecordMetadata[]> {
    return Promise.all(messages.map(message => this.produce(message)));
  }

  /**
   * Produces an event to a Kafka topic
   * @param event - Event to produce
   * @param topic - Topic to produce to
   * @param key - Optional message key
   * @param headers - Optional message headers
   * @returns Promise resolving to the record metadata
   */
  async produceEvent<T extends IBaseEvent = IBaseEvent>(
    event: T,
    topic: string,
    key?: string,
    headers?: Record<string, any>
  ): Promise<RecordMetadata> {
    // Ensure event has required fields
    if (!event.eventId) {
      event.eventId = uuidv4();
    }
    
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    // Create standard headers for the event
    const eventHeaders = {
      [KafkaHeaders.CORRELATION_ID]: event.metadata?.correlationId || uuidv4(),
      [KafkaHeaders.EVENT_TYPE]: event.type,
      [KafkaHeaders.SOURCE_SERVICE]: event.source,
      [KafkaHeaders.TIMESTAMP]: event.timestamp,
      [KafkaHeaders.CONTENT_TYPE]: 'application/json',
      ...(event.metadata?.userId ? { [KafkaHeaders.USER_ID]: event.metadata.userId } : {}),
      ...(event.metadata?.journeyContext?.journey ? { 
        [KafkaHeaders.SOURCE_JOURNEY]: event.metadata.journeyContext.journey 
      } : {}),
      ...headers,
    };

    // Produce the event as a message
    return this.produce({
      topic,
      value: event,
      key: key || event.eventId,
      headers: eventHeaders,
    });
  }

  /**
   * Validates a Kafka message before production
   * @param message - Message to validate
   * @throws {KafkaValidationError} If validation fails
   */
  private validateMessage<T>(message: IKafkaMessage<T>): void {
    if (!message) {
      throw new KafkaValidationError('Message cannot be null or undefined', {
        clientId: this.clientId,
      });
    }

    if (!message.topic && !this.defaultTopic) {
      throw new KafkaValidationError('Topic must be specified when no default topic is configured', {
        clientId: this.clientId,
      });
    }

    if (message.value === undefined || message.value === null) {
      throw new KafkaValidationError('Message value cannot be null or undefined', {
        topic: message.topic || this.defaultTopic,
        clientId: this.clientId,
      });
    }
  }

  /**
   * Serializes a message value to a Buffer
   * @param value - Value to serialize
   * @returns Serialized value as a Buffer
   * @throws {KafkaSerializationError} If serialization fails
   */
  private serializeValue<T>(value: T): Buffer {
    try {
      if (value instanceof Buffer) {
        return value;
      }

      if (typeof value === 'string') {
        return Buffer.from(value);
      }

      return Buffer.from(JSON.stringify(value));
    } catch (error) {
      throw new KafkaSerializationError(
        `Failed to serialize message value: ${(error as Error).message}`,
        { clientId: this.clientId },
        error as Error
      );
    }
  }

  /**
   * Prepares headers for a Kafka message
   * @param headers - Headers to prepare
   * @returns Prepared headers with values converted to Buffers
   */
  private prepareHeaders(headers?: Record<string, any>): Record<string, Buffer> | undefined {
    if (!headers) {
      return undefined;
    }

    const result: Record<string, Buffer> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        if (value instanceof Buffer) {
          result[key] = value;
        } else if (typeof value === 'string') {
          result[key] = Buffer.from(value);
        } else {
          result[key] = Buffer.from(String(value));
        }
      }
    }

    return result;
  }

  /**
   * Records metrics for message production
   * @param topic - Topic the message was produced to
   * @param success - Whether production was successful
   * @param retryCount - Number of retries performed
   * @param latencyMs - Latency in milliseconds
   */
  private recordMetrics(topic: string, success: boolean, retryCount: number, latencyMs: number): void {
    // Update global metrics
    if (success) {
      this.metrics.messagesProduced++;
      this.metrics.totalLatencyMs += latencyMs;
    } else {
      this.metrics.productionErrors++;
    }

    // Update topic-specific metrics
    let topicMetrics = this.metrics.topicMetrics.get(topic);
    if (!topicMetrics) {
      topicMetrics = {
        messagesProduced: 0,
        productionErrors: 0,
        retries: 0,
        totalLatencyMs: 0,
      };
      this.metrics.topicMetrics.set(topic, topicMetrics);
    }

    if (success) {
      topicMetrics.messagesProduced++;
      topicMetrics.totalLatencyMs += latencyMs;
    } else {
      topicMetrics.productionErrors++;
    }

    topicMetrics.retries += retryCount;
  }

  /**
   * Gets producer metrics
   * @returns Producer metrics
   */
  getMetrics(): {
    messagesProduced: number;
    productionErrors: number;
    retries: number;
    avgLatencyMs: number;
    topicMetrics: Record<string, {
      messagesProduced: number;
      productionErrors: number;
      retries: number;
      avgLatencyMs: number;
    }>;
    circuitBreakerState: CircuitState;
  } {
    const avgLatencyMs = this.metrics.messagesProduced > 0
      ? this.metrics.totalLatencyMs / this.metrics.messagesProduced
      : 0;

    const topicMetrics: Record<string, any> = {};
    for (const [topic, metrics] of this.metrics.topicMetrics.entries()) {
      topicMetrics[topic] = {
        messagesProduced: metrics.messagesProduced,
        productionErrors: metrics.productionErrors,
        retries: metrics.retries,
        avgLatencyMs: metrics.messagesProduced > 0
          ? metrics.totalLatencyMs / metrics.messagesProduced
          : 0,
      };
    }

    return {
      messagesProduced: this.metrics.messagesProduced,
      productionErrors: this.metrics.productionErrors,
      retries: this.metrics.retries,
      avgLatencyMs,
      topicMetrics,
      circuitBreakerState: this.circuitBreaker.getState(),
    };
  }

  /**
   * Resets producer metrics
   */
  resetMetrics(): void {
    this.metrics.messagesProduced = 0;
    this.metrics.productionErrors = 0;
    this.metrics.retries = 0;
    this.metrics.totalLatencyMs = 0;
    this.metrics.topicMetrics.clear();
  }

  /**
   * Gets the underlying KafkaJS Producer instance
   * @returns KafkaJS Producer instance
   */
  getNativeProducer(): Producer {
    return this.producer;
  }

  /**
   * Checks if the producer is connected
   * @returns Whether the producer is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets the circuit breaker state
   * @returns Circuit breaker state
   */
  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  /**
   * Resets the circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}