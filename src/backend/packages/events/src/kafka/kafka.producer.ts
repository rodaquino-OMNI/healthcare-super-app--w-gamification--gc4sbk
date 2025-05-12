/**
 * @file kafka.producer.ts
 * @description Implements a reliable Kafka producer with guaranteed message delivery, retry policies,
 * circuit breaker patterns, and observability. This service handles the production of messages to
 * Kafka topics with standardized serialization, headers for distributed tracing, and comprehensive
 * error handling.
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { Producer, RecordMetadata, Kafka, Transaction, CompressionTypes } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { Observable, firstValueFrom } from 'rxjs';

import { IKafkaProducer } from './kafka.interfaces';
import { KafkaHeaders, KafkaProducerConfig, KafkaTypedPayload, EventJourney } from './kafka.types';
import {
  CircuitBreaker,
  CircuitBreakerOptions,
  KafkaError,
  KafkaProducerError,
  KafkaConnectionError,
  KafkaSerializationError,
  KafkaRetryPolicy,
  RetryPolicyOptions,
  createKafkaError,
} from './kafka.errors';
import {
  DEFAULT_PRODUCER_CONFIG,
  DEFAULT_KAFKA_RETRY_CONFIG,
  DEFAULT_TRANSACTION_CONFIG,
  KAFKA_METRICS,
  KAFKA_PROVIDERS,
} from './kafka.constants';
import { validateKafkaConfig } from './kafka.config';

/**
 * Options for the Kafka producer
 */
export interface KafkaProducerOptions {
  /**
   * The Kafka client instance
   */
  client: Kafka;

  /**
   * Producer configuration
   */
  config?: KafkaProducerConfig;

  /**
   * Service name for logging and metrics
   */
  serviceName?: string;

  /**
   * Circuit breaker options
   */
  circuitBreaker?: CircuitBreakerOptions;

  /**
   * Retry policy options
   */
  retryPolicy?: RetryPolicyOptions;

  /**
   * Whether to enable metrics
   */
  enableMetrics?: boolean;

  /**
   * Whether to enable tracing
   */
  enableTracing?: boolean;
}

/**
 * Implementation of a reliable Kafka producer with retry, circuit breaker, and observability
 */
@Injectable()
export class KafkaProducer implements IKafkaProducer, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private readonly producer: Producer;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly retryPolicy: KafkaRetryPolicy;
  private readonly serviceName: string;
  private readonly enableMetrics: boolean;
  private readonly enableTracing: boolean;
  private readonly config: KafkaProducerConfig;
  private connected = false;
  private connecting = false;

  constructor(
    @Inject(KAFKA_PROVIDERS.CLIENT) private readonly client: Kafka,
    @Optional() @Inject(KAFKA_PROVIDERS.OPTIONS) private readonly options?: KafkaProducerOptions,
  ) {
    this.serviceName = options?.serviceName || 'unknown-service';
    this.enableMetrics = options?.enableMetrics ?? true;
    this.enableTracing = options?.enableTracing ?? true;
    this.config = options?.config || DEFAULT_PRODUCER_CONFIG;

    // Create the producer instance
    this.producer = this.client.producer({
      allowAutoTopicCreation: this.config.allowAutoTopicCreation ?? DEFAULT_PRODUCER_CONFIG.allowAutoTopicCreation,
      idempotent: this.config.idempotent ?? DEFAULT_PRODUCER_CONFIG.idempotent,
      transactionalId: this.config.transactionalId,
      maxInFlightRequests: this.config.maxInFlightRequests ?? DEFAULT_PRODUCER_CONFIG.maxInFlightRequests,
      metadataMaxAge: this.config.metadataMaxAge,
      retry: {
        maxRetryTime: DEFAULT_KAFKA_RETRY_CONFIG.maxRetryTimeMs,
        initialRetryTime: DEFAULT_KAFKA_RETRY_CONFIG.initialRetryTimeMs,
        factor: DEFAULT_KAFKA_RETRY_CONFIG.factor,
        retries: DEFAULT_KAFKA_RETRY_CONFIG.retries,
      },
      acks: this.config.acks ?? DEFAULT_PRODUCER_CONFIG.acks,
      compression: this.getCompressionType(this.config.compression),
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      resetTimeout: 10000, // 10 seconds
      ...options?.circuitBreaker,
      onStateChange: (from, to) => {
        this.logger.warn(`Kafka producer circuit breaker state changed from ${from} to ${to}`);
        if (options?.circuitBreaker?.onStateChange) {
          options.circuitBreaker.onStateChange(from, to);
        }
      },
    });

    // Initialize retry policy
    this.retryPolicy = new KafkaRetryPolicy({
      maxRetries: DEFAULT_KAFKA_RETRY_CONFIG.retries,
      initialDelay: DEFAULT_KAFKA_RETRY_CONFIG.initialRetryTimeMs,
      maxDelay: DEFAULT_KAFKA_RETRY_CONFIG.maxRetryTimeMs,
      backoffFactor: DEFAULT_KAFKA_RETRY_CONFIG.factor,
      ...options?.retryPolicy,
    });

    this.logger.log(`Kafka producer initialized for service: ${this.serviceName}`);
  }

  /**
   * Lifecycle hook that is called once the module has been initialized
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer during module initialization', error);
      // Don't throw here to allow the application to start even if Kafka is not available
      // The circuit breaker will handle reconnection attempts
    }
  }

  /**
   * Lifecycle hook that is called once the module is being destroyed
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnect();
    } catch (error) {
      this.logger.error('Error disconnecting Kafka producer during module destruction', error);
    }
  }

  /**
   * Connects the producer to the Kafka broker
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.connecting) {
      this.logger.debug('Kafka producer is already connecting');
      return;
    }

    this.connecting = true;

    try {
      this.logger.log('Connecting Kafka producer...');
      await this.circuitBreaker.execute(async () => {
        await this.producer.connect();
      });

      this.connected = true;
      this.connecting = false;
      this.logger.log('Kafka producer connected successfully');

      if (this.enableMetrics) {
        this.recordMetric(KAFKA_METRICS.CONNECTION_STATUS, 1);
      }
    } catch (error) {
      this.connecting = false;
      this.connected = false;

      const kafkaError = createKafkaError(error as Error, {
        correlationId: uuidv4(),
      });

      if (this.enableMetrics) {
        this.recordMetric(KAFKA_METRICS.CONNECTION_STATUS, 0);
      }

      this.logger.error(`Failed to connect Kafka producer: ${kafkaError.message}`, kafkaError.stack);
      throw new KafkaConnectionError('Failed to connect Kafka producer', {
        correlationId: kafkaError.details.correlationId,
      }, error as Error);
    }
  }

  /**
   * Disconnects the producer from the Kafka broker
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

      if (this.enableMetrics) {
        this.recordMetric(KAFKA_METRICS.CONNECTION_STATUS, 0);
      }
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, {
        correlationId: uuidv4(),
      });

      this.logger.error(`Failed to disconnect Kafka producer: ${kafkaError.message}`, kafkaError.stack);
      throw new KafkaConnectionError('Failed to disconnect Kafka producer', {
        correlationId: kafkaError.details.correlationId,
      }, error as Error);
    }
  }

  /**
   * Sends a message or batch of messages to a Kafka topic
   * @param topic The topic to send to
   * @param messages The message(s) to send
   * @param key Optional message key for partitioning
   * @param headers Optional message headers
   * @returns Promise resolving to the record metadata
   */
  async send<T>(
    topic: string,
    messages: T | T[],
    key?: string,
    headers?: Record<string, string>,
  ): Promise<RecordMetadata[]> {
    // Ensure producer is connected
    if (!this.connected) {
      await this.connect();
    }

    const correlationId = headers?.['correlation-id'] || uuidv4();
    const messageArray = Array.isArray(messages) ? messages : [messages];
    const startTime = Date.now();

    try {
      // Use circuit breaker and retry policy for reliable delivery
      return await this.circuitBreaker.execute(() => {
        return this.retryPolicy.execute(async (attempt) => {
          try {
            // Prepare the messages with headers
            const kafkaMessages = messageArray.map((message) => ({
              value: this.serializeMessage(message),
              key: key ? Buffer.from(key) : null,
              headers: this.prepareHeaders(headers, correlationId),
            }));

            // Send the messages
            const result = await this.producer.send({
              topic,
              messages: kafkaMessages,
              acks: this.config.acks ?? DEFAULT_PRODUCER_CONFIG.acks,
              timeout: this.config.timeout ?? DEFAULT_PRODUCER_CONFIG.timeout,
              compression: this.getCompressionType(this.config.compression),
            });

            // Record metrics
            if (this.enableMetrics) {
              this.recordMetric(KAFKA_METRICS.MESSAGES_PRODUCED, messageArray.length, {
                topic,
                service: this.serviceName,
              });
              this.recordMetric(KAFKA_METRICS.PRODUCTION_LATENCY, Date.now() - startTime, {
                topic,
                service: this.serviceName,
              });
              this.recordMetric(KAFKA_METRICS.BATCH_SIZE, messageArray.length, {
                topic,
                service: this.serviceName,
              });
            }

            this.logger.debug(
              `Successfully sent ${messageArray.length} message(s) to topic ${topic}`,
              { correlationId, messageCount: messageArray.length },
            );

            return result;
          } catch (error) {
            // Handle errors with proper categorization
            const kafkaError = createKafkaError(error as Error, {
              topic,
              correlationId,
              retryCount: attempt,
            });

            // Log the error with appropriate level based on retry attempt
            if (attempt < this.retryPolicy.getMaxRetries()) {
              this.logger.warn(
                `Failed to send message(s) to topic ${topic}, retrying (${attempt + 1}/${this.retryPolicy.getMaxRetries()})`,
                { correlationId, error: kafkaError.message, attempt, maxRetries: this.retryPolicy.getMaxRetries() },
              );
            } else {
              this.logger.error(
                `Failed to send message(s) to topic ${topic} after ${attempt} attempts`,
                { correlationId, error: kafkaError.message, attempt },
              );

              // Record error metrics
              if (this.enableMetrics) {
                this.recordMetric(KAFKA_METRICS.PRODUCTION_ERRORS, 1, {
                  topic,
                  service: this.serviceName,
                  errorType: kafkaError.kafkaErrorType,
                });
              }
            }

            // Rethrow the error for the retry policy to handle
            throw kafkaError;
          }
        });
      });
    } catch (error) {
      // Final error handling after all retries have failed
      const kafkaError = error instanceof KafkaError
        ? error
        : new KafkaProducerError(
            `Failed to send message(s) to topic ${topic}`,
            { topic, correlationId },
            error as Error,
          );

      this.logger.error(
        `Failed to send message(s) to topic ${topic}: ${kafkaError.message}`,
        { correlationId, errorType: kafkaError.kafkaErrorType, details: kafkaError.details },
      );

      throw kafkaError;
    }
  }

  /**
   * Sends a message to a Kafka topic within a transaction
   * @param topic The topic to send to
   * @param messages The message(s) to send
   * @param transactionId The transaction ID
   * @param key Optional message key for partitioning
   * @param headers Optional message headers
   * @returns Promise resolving to the record metadata
   */
  async sendWithTransaction<T>(
    topic: string,
    messages: T | T[],
    transactionId: string,
    key?: string,
    headers?: Record<string, string>,
  ): Promise<RecordMetadata[]> {
    // Ensure producer is connected
    if (!this.connected) {
      await this.connect();
    }

    // Validate that the producer is configured for transactions
    if (!this.config.transactionalId) {
      throw new Error('Producer is not configured for transactions. Set transactionalId in producer config.');
    }

    const correlationId = headers?.['correlation-id'] || uuidv4();
    const messageArray = Array.isArray(messages) ? messages : [messages];
    const startTime = Date.now();
    let transaction: Transaction | null = null;

    try {
      // Use circuit breaker and retry policy for reliable delivery
      return await this.circuitBreaker.execute(() => {
        return this.retryPolicy.execute(async (attempt) => {
          try {
            // Initialize transaction
            transaction = await this.producer.transaction();

            // Prepare the messages with headers
            const kafkaMessages = messageArray.map((message) => ({
              value: this.serializeMessage(message),
              key: key ? Buffer.from(key) : null,
              headers: this.prepareHeaders(headers, correlationId, transactionId),
            }));

            // Send the messages within the transaction
            const result = await this.producer.send({
              topic,
              messages: kafkaMessages,
              acks: this.config.acks ?? DEFAULT_PRODUCER_CONFIG.acks,
              timeout: this.config.timeout ?? DEFAULT_PRODUCER_CONFIG.timeout,
              compression: this.getCompressionType(this.config.compression),
            });

            // Commit the transaction
            await transaction.commit();
            transaction = null;

            // Record metrics
            if (this.enableMetrics) {
              this.recordMetric(KAFKA_METRICS.MESSAGES_PRODUCED, messageArray.length, {
                topic,
                service: this.serviceName,
                transactional: 'true',
              });
              this.recordMetric(KAFKA_METRICS.PRODUCTION_LATENCY, Date.now() - startTime, {
                topic,
                service: this.serviceName,
                transactional: 'true',
              });
            }

            this.logger.debug(
              `Successfully sent ${messageArray.length} message(s) to topic ${topic} in transaction ${transactionId}`,
              { correlationId, transactionId, messageCount: messageArray.length },
            );

            return result;
          } catch (error) {
            // Abort the transaction if it exists
            if (transaction) {
              try {
                await transaction.abort();
              } catch (abortError) {
                this.logger.error(
                  `Failed to abort transaction ${transactionId}: ${(abortError as Error).message}`,
                  { correlationId, transactionId },
                );
              }
              transaction = null;
            }

            // Handle errors with proper categorization
            const kafkaError = createKafkaError(error as Error, {
              topic,
              correlationId,
              retryCount: attempt,
            });

            // Log the error with appropriate level based on retry attempt
            if (attempt < this.retryPolicy.getMaxRetries()) {
              this.logger.warn(
                `Failed to send message(s) to topic ${topic} in transaction ${transactionId}, retrying (${attempt + 1}/${this.retryPolicy.getMaxRetries()})`,
                { correlationId, transactionId, error: kafkaError.message, attempt, maxRetries: this.retryPolicy.getMaxRetries() },
              );
            } else {
              this.logger.error(
                `Failed to send message(s) to topic ${topic} in transaction ${transactionId} after ${attempt} attempts`,
                { correlationId, transactionId, error: kafkaError.message, attempt },
              );

              // Record error metrics
              if (this.enableMetrics) {
                this.recordMetric(KAFKA_METRICS.PRODUCTION_ERRORS, 1, {
                  topic,
                  service: this.serviceName,
                  transactional: 'true',
                  errorType: kafkaError.kafkaErrorType,
                });
              }
            }

            // Rethrow the error for the retry policy to handle
            throw kafkaError;
          }
        });
      });
    } catch (error) {
      // Final error handling after all retries have failed
      const kafkaError = error instanceof KafkaError
        ? error
        : new KafkaProducerError(
            `Failed to send message(s) to topic ${topic} in transaction ${transactionId}`,
            { topic, correlationId, transactionId },
            error as Error,
          );

      this.logger.error(
        `Failed to send message(s) to topic ${topic} in transaction ${transactionId}: ${kafkaError.message}`,
        { correlationId, transactionId, errorType: kafkaError.kafkaErrorType, details: kafkaError.details },
      );

      throw kafkaError;
    }
  }

  /**
   * Sends a typed message to a journey-specific topic
   * @param journey The journey to send to
   * @param payload The typed payload to send
   * @returns Promise resolving to the record metadata
   */
  async sendToJourney<T>(journey: EventJourney, payload: KafkaTypedPayload<T>): Promise<RecordMetadata[]> {
    const { topic, key, value, headers } = payload;
    const journeyTopic = this.getJourneyTopic(journey, topic);
    
    return this.send(journeyTopic, value, key as string, headers);
  }

  /**
   * Checks if the producer is connected to the Kafka broker
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Serializes a message to a Buffer for sending to Kafka
   * @param message The message to serialize
   * @returns The serialized message as a Buffer
   * @throws KafkaSerializationError if serialization fails
   */
  private serializeMessage<T>(message: T): Buffer {
    try {
      if (message === null || message === undefined) {
        return Buffer.from('');
      }

      if (Buffer.isBuffer(message)) {
        return message;
      }

      if (typeof message === 'string') {
        return Buffer.from(message);
      }

      return Buffer.from(JSON.stringify(message));
    } catch (error) {
      const correlationId = uuidv4();
      this.logger.error(`Failed to serialize message: ${(error as Error).message}`, {
        correlationId,
        messageType: typeof message,
      });

      throw new KafkaSerializationError('Failed to serialize message', {
        correlationId,
        messageType: typeof message,
      }, error as Error);
    }
  }

  /**
   * Prepares headers for a Kafka message
   * @param customHeaders Custom headers to include
   * @param correlationId Correlation ID for tracing
   * @param transactionId Optional transaction ID
   * @returns Prepared headers as a Record<string, Buffer>
   */
  private prepareHeaders(
    customHeaders?: Record<string, string>,
    correlationId?: string,
    transactionId?: string,
  ): Record<string, Buffer> {
    const headers: Record<string, Buffer> = {};

    // Add standard headers
    headers['content-type'] = Buffer.from('application/json');
    headers['timestamp'] = Buffer.from(new Date().toISOString());
    headers['source-service'] = Buffer.from(this.serviceName);

    // Add correlation ID for tracing
    if (correlationId) {
      headers['correlation-id'] = Buffer.from(correlationId);
    }

    // Add transaction ID if provided
    if (transactionId) {
      headers['transaction-id'] = Buffer.from(transactionId);
    }

    // Add custom headers
    if (customHeaders) {
      Object.entries(customHeaders).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers[key] = Buffer.from(value);
        }
      });
    }

    return headers;
  }

  /**
   * Gets the compression type for KafkaJS from the configuration
   * @param compression The compression type from configuration
   * @returns The CompressionTypes value for KafkaJS
   */
  private getCompressionType(compression?: string): CompressionTypes {
    switch (compression) {
      case 'gzip':
        return CompressionTypes.GZIP;
      case 'snappy':
        return CompressionTypes.Snappy;
      case 'lz4':
        return CompressionTypes.LZ4;
      default:
        return CompressionTypes.None;
    }
  }

  /**
   * Gets the journey-specific topic name
   * @param journey The journey
   * @param eventType The event type
   * @returns The journey-specific topic name
   */
  private getJourneyTopic(journey: EventJourney, eventType: string): string {
    return `austa.${journey.toLowerCase()}.${eventType}`;
  }

  /**
   * Records a metric for observability
   * @param name The metric name
   * @param value The metric value
   * @param tags Optional tags for the metric
   */
  private recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    // This is a placeholder for actual metric recording
    // In a real implementation, this would use a metrics library like Prometheus
    this.logger.debug(`METRIC: ${name} = ${value}`, { tags });
    
    // Here you would typically call a metrics service or library
    // For example with Prometheus:
    // this.metricsService.recordMetric(name, value, tags);
  }

  /**
   * Creates a tracing span for distributed tracing
   * @param name The span name
   * @param context The span context
   * @returns An Observable that completes when the span is finished
   */
  private createSpan(name: string, context?: Record<string, any>): Observable<any> {
    // This is a placeholder for actual span creation
    // In a real implementation, this would use a tracing library like OpenTelemetry
    this.logger.debug(`SPAN: ${name}`, { context });
    
    // Here you would typically call a tracing service or library
    // For example with OpenTelemetry:
    // return this.tracingService.createSpan(name, context);
    
    // Return a dummy observable that completes immediately
    return new Observable((subscriber) => {
      subscriber.complete();
    });
  }
}