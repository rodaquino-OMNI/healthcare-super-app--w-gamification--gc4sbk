/**
 * @file Kafka Producer Implementation
 * @description Implements a reliable Kafka producer with guaranteed message delivery, retry policies,
 * circuit breaker patterns, and observability. This service handles the production of messages to
 * Kafka topics with standardized serialization, headers for distributed tracing, and comprehensive
 * error handling.
 */

import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Producer, Kafka, Message, ProducerRecord, RecordMetadata, CompressionTypes } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { Observable, from, throwError } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { TracingService } from '@austa/tracing';
import { LoggingService } from '@austa/logging';

import { IBaseEvent } from '../interfaces/base-event.interface';
import { IKafkaProducer, IKafkaMessage, IKafkaHeaders, IKafkaProducerRecord, IKafkaProducerBatchRecord, IKafkaTransaction } from './kafka.interfaces';
import { KafkaError, KafkaProducerError, KafkaMessageSerializationError, KafkaCircuitBreaker, isRetryableKafkaError, getKafkaErrorRetryDelay, createKafkaError } from './kafka.errors';
import { KAFKA_HEADERS, RETRY_CONFIG, CIRCUIT_BREAKER_CONFIG } from './kafka.constants';

/**
 * Implementation of the Kafka producer for reliable event delivery
 */
@Injectable()
export class KafkaProducer implements IKafkaProducer, OnModuleInit, OnModuleDestroy {
  private producer: Producer;
  private readonly logger = new Logger(KafkaProducer.name);
  private connected = false;
  private readonly circuitBreaker: KafkaCircuitBreaker;

  constructor(
    private readonly kafka: Kafka,
    private readonly tracingService: TracingService,
    private readonly loggingService: LoggingService,
  ) {
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      idempotent: true, // Ensures exactly-once delivery semantics
      maxInFlightRequests: 5,
      retry: {
        initialRetryTime: RETRY_CONFIG.INITIAL_RETRY_DELAY_MS,
        maxRetryTime: RETRY_CONFIG.MAX_RETRY_DELAY_MS,
        retries: RETRY_CONFIG.MAX_RETRIES,
        factor: RETRY_CONFIG.RETRY_FACTOR,
      },
    });

    this.circuitBreaker = new KafkaCircuitBreaker({
      failureThreshold: CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD,
      resetTimeout: CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS,
      successThreshold: CIRCUIT_BREAKER_CONFIG.SUCCESS_THRESHOLD,
    });
  }

  /**
   * Initialize the producer when the module is initialized
   */
  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  /**
   * Disconnect the producer when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Connect to the Kafka broker
   */
  async connect(): Promise<void> {
    try {
      if (!this.connected) {
        this.logger.log('Connecting Kafka producer...');
        await this.producer.connect();
        this.connected = true;
        this.logger.log('Kafka producer connected successfully');
      }
    } catch (error) {
      this.connected = false;
      const kafkaError = createKafkaError(error, { clientId: 'kafka-producer' });
      this.logger.error(`Failed to connect Kafka producer: ${kafkaError.message}`, kafkaError.stack);
      throw kafkaError;
    }
  }

  /**
   * Disconnect from the Kafka broker
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        this.logger.log('Disconnecting Kafka producer...');
        await this.producer.disconnect();
        this.connected = false;
        this.logger.log('Kafka producer disconnected successfully');
      }
    } catch (error) {
      const kafkaError = createKafkaError(error, { clientId: 'kafka-producer' });
      this.logger.error(`Failed to disconnect Kafka producer: ${kafkaError.message}`, kafkaError.stack);
      throw kafkaError;
    }
  }

  /**
   * Check if the producer is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Send a message to a Kafka topic
   * @param message The message to send
   * @returns Promise that resolves with the message metadata
   */
  async send<T = any>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord> {
    if (!this.connected) {
      await this.connect();
    }

    const { topic, partition, key, value, headers } = message;

    try {
      // Use circuit breaker to protect against broker failures
      return await this.circuitBreaker.execute(async () => {
        const serializedValue = this.serializeValue(value);

        const kafkaMessage: Message = {
          key: key ? Buffer.from(key) : null,
          value: serializedValue,
          headers: headers ? this.serializeHeaders(headers) : {},
        };

        const record: ProducerRecord = {
          topic,
          messages: [kafkaMessage],
          ...(partition !== undefined ? { partition } : {}),
        };

        const metadata = await this.producer.send(record);
        const result = this.processMetadata(metadata, topic);

        this.logger.debug(`Message sent to topic ${topic}`, {
          topic,
          partition: result.partition,
          offset: result.offset,
        });

        return result;
      });
    } catch (error) {
      const context = {
        topic,
        partition,
        clientId: 'kafka-producer',
      };

      let kafkaError: KafkaError;

      if (error instanceof KafkaError) {
        kafkaError = error;
      } else if (error instanceof Error && error.message.includes('Serialization')) {
        kafkaError = new KafkaMessageSerializationError(
          `Failed to serialize message for topic ${topic}: ${error.message}`,
          context,
          error
        );
      } else {
        kafkaError = new KafkaProducerError(
          `Failed to send message to topic ${topic}: ${error.message}`,
          context,
          error instanceof Error ? error : undefined
        );
      }

      this.logger.error(
        `Kafka producer error: ${kafkaError.message}`,
        kafkaError.stack,
        { topic, partition, error: kafkaError }
      );

      throw kafkaError;
    }
  }

  /**
   * Send a batch of messages to Kafka topics
   * @param messages Array of messages to send
   * @returns Promise that resolves with the batch metadata
   */
  async sendBatch<T = any>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord> {
    if (!this.connected) {
      await this.connect();
    }

    if (!messages || messages.length === 0) {
      return { records: [] };
    }

    try {
      // Group messages by topic
      const messagesByTopic = this.groupMessagesByTopic(messages);

      // Use circuit breaker to protect against broker failures
      return await this.circuitBreaker.execute(async () => {
        const topicRecords: ProducerRecord[] = Object.entries(messagesByTopic).map(
          ([topic, topicMessages]) => ({
            topic,
            messages: topicMessages.map((msg) => ({
              key: msg.key ? Buffer.from(msg.key) : null,
              value: this.serializeValue(msg.value),
              headers: msg.headers ? this.serializeHeaders(msg.headers) : {},
              ...(msg.partition !== undefined ? { partition: msg.partition } : {}),
            })),
          })
        );

        const results: IKafkaProducerRecord[] = [];

        // Send each topic's messages in a batch
        for (const record of topicRecords) {
          const metadata = await this.producer.send(record);
          const topicResults = metadata.map((meta) => ({
            topic: meta.topicName,
            partition: meta.partition,
            offset: meta.baseOffset,
            timestamp: meta.timestamp?.toString(),
          }));

          results.push(...topicResults);

          this.logger.debug(`Batch sent to topic ${record.topic}`, {
            topic: record.topic,
            messageCount: record.messages.length,
          });
        }

        return { records: results };
      });
    } catch (error) {
      const context = {
        messageCount: messages.length,
        topics: [...new Set(messages.map((msg) => msg.topic))],
        clientId: 'kafka-producer',
      };

      let kafkaError: KafkaError;

      if (error instanceof KafkaError) {
        kafkaError = error;
      } else if (error instanceof Error && error.message.includes('Serialization')) {
        kafkaError = new KafkaMessageSerializationError(
          `Failed to serialize messages in batch: ${error.message}`,
          context,
          error
        );
      } else {
        kafkaError = new KafkaProducerError(
          `Failed to send message batch: ${error.message}`,
          context,
          error instanceof Error ? error : undefined
        );
      }

      this.logger.error(
        `Kafka producer batch error: ${kafkaError.message}`,
        kafkaError.stack,
        { context, error: kafkaError }
      );

      throw kafkaError;
    }
  }

  /**
   * Send an event to a Kafka topic
   * @param topic The topic to send to
   * @param event The event to send
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Promise that resolves with the message metadata
   */
  async sendEvent(
    topic: string,
    event: IBaseEvent,
    key?: string,
    headers?: IKafkaHeaders
  ): Promise<IKafkaProducerRecord> {
    // Create a correlation ID for tracing if not provided
    const correlationId = headers?.[KAFKA_HEADERS.CORRELATION_ID] || this.tracingService.getCorrelationId() || uuidv4();

    // Enhance the event with metadata if not already present
    const enhancedEvent = this.enhanceEventWithMetadata(event, correlationId);

    // Create standard headers with tracing information
    const enhancedHeaders: IKafkaHeaders = {
      ...headers,
      [KAFKA_HEADERS.CORRELATION_ID]: correlationId,
      [KAFKA_HEADERS.EVENT_TYPE]: event.type,
      [KAFKA_HEADERS.EVENT_VERSION]: event.version || '1.0.0',
      [KAFKA_HEADERS.TIMESTAMP]: new Date().toISOString(),
      [KAFKA_HEADERS.SOURCE_SERVICE]: process.env.SERVICE_NAME || 'unknown-service',
    };

    // Add user ID and journey if available in the event
    if (event.userId) {
      enhancedHeaders[KAFKA_HEADERS.USER_ID] = event.userId;
    }

    if (event.journey) {
      enhancedHeaders[KAFKA_HEADERS.JOURNEY] = event.journey;
    }

    // Create a span for tracing the event production
    return this.tracingService.traceAsync(
      'kafka.producer.sendEvent',
      async (span) => {
        // Add relevant attributes to the span
        span.setAttribute('kafka.topic', topic);
        span.setAttribute('kafka.event.type', event.type);
        span.setAttribute('kafka.event.version', event.version || '1.0.0');
        span.setAttribute('kafka.correlation_id', correlationId);

        if (event.userId) {
          span.setAttribute('user.id', event.userId);
        }

        if (event.journey) {
          span.setAttribute('journey', event.journey);
        }

        // Send the event with enhanced headers
        const result = await this.send({
          topic,
          key: key || event.userId || event.id || uuidv4(),
          value: enhancedEvent,
          headers: enhancedHeaders,
        });

        // Add result information to the span
        span.setAttribute('kafka.partition', result.partition);
        if (result.offset) {
          span.setAttribute('kafka.offset', result.offset);
        }

        return result;
      },
      { correlationId }
    );
  }

  /**
   * Begin a transaction
   * @returns Promise that resolves with a transaction object
   */
  async transaction(): Promise<IKafkaTransaction> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const transaction = await this.producer.transaction();

      return {
        send: async <T>(message: IKafkaMessage<T>): Promise<IKafkaProducerRecord> => {
          const { topic, partition, key, value, headers } = message;

          try {
            const serializedValue = this.serializeValue(value);

            const kafkaMessage: Message = {
              key: key ? Buffer.from(key) : null,
              value: serializedValue,
              headers: headers ? this.serializeHeaders(headers) : {},
            };

            const record: ProducerRecord = {
              topic,
              messages: [kafkaMessage],
              ...(partition !== undefined ? { partition } : {}),
            };

            const metadata = await transaction.send(record);
            return this.processMetadata(metadata, topic);
          } catch (error) {
            const kafkaError = createKafkaError(error, {
              topic,
              partition,
              clientId: 'kafka-producer-transaction',
            });

            this.logger.error(
              `Transaction send error: ${kafkaError.message}`,
              kafkaError.stack,
              { topic, partition, error: kafkaError }
            );

            throw kafkaError;
          }
        },

        sendBatch: async <T>(messages: IKafkaMessage<T>[]): Promise<IKafkaProducerBatchRecord> => {
          if (!messages || messages.length === 0) {
            return { records: [] };
          }

          try {
            // Group messages by topic
            const messagesByTopic = this.groupMessagesByTopic(messages);
            const results: IKafkaProducerRecord[] = [];

            // Send each topic's messages in a batch
            for (const [topic, topicMessages] of Object.entries(messagesByTopic)) {
              const record: ProducerRecord = {
                topic,
                messages: topicMessages.map((msg) => ({
                  key: msg.key ? Buffer.from(msg.key) : null,
                  value: this.serializeValue(msg.value),
                  headers: msg.headers ? this.serializeHeaders(msg.headers) : {},
                  ...(msg.partition !== undefined ? { partition: msg.partition } : {}),
                })),
              };

              const metadata = await transaction.send(record);
              const topicResults = metadata.map((meta) => ({
                topic: meta.topicName,
                partition: meta.partition,
                offset: meta.baseOffset,
                timestamp: meta.timestamp?.toString(),
              }));

              results.push(...topicResults);
            }

            return { records: results };
          } catch (error) {
            const kafkaError = createKafkaError(error, {
              messageCount: messages.length,
              topics: [...new Set(messages.map((msg) => msg.topic))],
              clientId: 'kafka-producer-transaction',
            });

            this.logger.error(
              `Transaction sendBatch error: ${kafkaError.message}`,
              kafkaError.stack,
              { error: kafkaError }
            );

            throw kafkaError;
          }
        },

        commit: async (): Promise<void> => {
          try {
            await transaction.commit();
            this.logger.debug('Transaction committed successfully');
          } catch (error) {
            const kafkaError = createKafkaError(error, {
              clientId: 'kafka-producer-transaction',
            });

            this.logger.error(
              `Transaction commit error: ${kafkaError.message}`,
              kafkaError.stack,
              { error: kafkaError }
            );

            throw kafkaError;
          }
        },

        abort: async (): Promise<void> => {
          try {
            await transaction.abort();
            this.logger.debug('Transaction aborted successfully');
          } catch (error) {
            const kafkaError = createKafkaError(error, {
              clientId: 'kafka-producer-transaction',
            });

            this.logger.error(
              `Transaction abort error: ${kafkaError.message}`,
              kafkaError.stack,
              { error: kafkaError }
            );

            throw kafkaError;
          }
        },
      };
    } catch (error) {
      const kafkaError = createKafkaError(error, {
        clientId: 'kafka-producer',
      });

      this.logger.error(
        `Failed to create transaction: ${kafkaError.message}`,
        kafkaError.stack,
        { error: kafkaError }
      );

      throw kafkaError;
    }
  }

  /**
   * Send a message with retry logic using RxJS
   * @param message The message to send
   * @returns Observable that emits the message metadata
   */
  sendWithRetry<T = any>(message: IKafkaMessage<T>): Observable<IKafkaProducerRecord> {
    return from(this.send(message)).pipe(
      retry({
        count: RETRY_CONFIG.MAX_RETRIES,
        delay: (error, retryCount) => {
          if (!isRetryableKafkaError(error)) {
            return throwError(() => error);
          }

          const delay = getKafkaErrorRetryDelay(error, retryCount);
          this.logger.warn(
            `Retrying Kafka message send (attempt ${retryCount}/${RETRY_CONFIG.MAX_RETRIES}) after ${delay}ms`,
            { topic: message.topic, error: error.message, retryCount, delay }
          );

          return from(new Promise((resolve) => setTimeout(resolve, delay)));
        },
      }),
      catchError((error) => {
        this.logger.error(
          `Failed to send message after ${RETRY_CONFIG.MAX_RETRIES} retries`,
          error.stack,
          { topic: message.topic, error: error.message }
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Send a batch of messages with retry logic using RxJS
   * @param messages Array of messages to send
   * @returns Observable that emits the batch metadata
   */
  sendBatchWithRetry<T = any>(messages: IKafkaMessage<T>[]): Observable<IKafkaProducerBatchRecord> {
    return from(this.sendBatch(messages)).pipe(
      retry({
        count: RETRY_CONFIG.MAX_RETRIES,
        delay: (error, retryCount) => {
          if (!isRetryableKafkaError(error)) {
            return throwError(() => error);
          }

          const delay = getKafkaErrorRetryDelay(error, retryCount);
          const topics = [...new Set(messages.map((msg) => msg.topic))];

          this.logger.warn(
            `Retrying Kafka batch send (attempt ${retryCount}/${RETRY_CONFIG.MAX_RETRIES}) after ${delay}ms`,
            { topics, messageCount: messages.length, error: error.message, retryCount, delay }
          );

          return from(new Promise((resolve) => setTimeout(resolve, delay)));
        },
      }),
      catchError((error) => {
        const topics = [...new Set(messages.map((msg) => msg.topic))];

        this.logger.error(
          `Failed to send batch after ${RETRY_CONFIG.MAX_RETRIES} retries`,
          error.stack,
          { topics, messageCount: messages.length, error: error.message }
        );

        return throwError(() => error);
      })
    );
  }

  /**
   * Send an event with retry logic using RxJS
   * @param topic The topic to send to
   * @param event The event to send
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Observable that emits the message metadata
   */
  sendEventWithRetry(
    topic: string,
    event: IBaseEvent,
    key?: string,
    headers?: IKafkaHeaders
  ): Observable<IKafkaProducerRecord> {
    return from(this.sendEvent(topic, event, key, headers)).pipe(
      retry({
        count: RETRY_CONFIG.MAX_RETRIES,
        delay: (error, retryCount) => {
          if (!isRetryableKafkaError(error)) {
            return throwError(() => error);
          }

          const delay = getKafkaErrorRetryDelay(error, retryCount);

          this.logger.warn(
            `Retrying Kafka event send (attempt ${retryCount}/${RETRY_CONFIG.MAX_RETRIES}) after ${delay}ms`,
            { topic, eventType: event.type, error: error.message, retryCount, delay }
          );

          return from(new Promise((resolve) => setTimeout(resolve, delay)));
        },
      }),
      catchError((error) => {
        this.logger.error(
          `Failed to send event after ${RETRY_CONFIG.MAX_RETRIES} retries`,
          error.stack,
          { topic, eventType: event.type, error: error.message }
        );

        return throwError(() => error);
      })
    );
  }

  /**
   * Process metadata from Kafka producer send operation
   * @param metadata The metadata from Kafka
   * @param topic The topic the message was sent to
   * @returns Standardized producer record
   */
  private processMetadata(metadata: RecordMetadata[], topic: string): IKafkaProducerRecord {
    if (!metadata || metadata.length === 0) {
      throw new KafkaProducerError(`No metadata returned for topic ${topic}`, { topic });
    }

    const meta = metadata[0];
    return {
      topic: meta.topicName,
      partition: meta.partition,
      offset: meta.baseOffset,
      timestamp: meta.timestamp?.toString(),
    };
  }

  /**
   * Serialize message value to Buffer
   * @param value The value to serialize
   * @returns Serialized value as Buffer
   */
  private serializeValue(value: any): Buffer {
    try {
      if (value === null || value === undefined) {
        return null;
      }

      if (Buffer.isBuffer(value)) {
        return value;
      }

      if (typeof value === 'string') {
        return Buffer.from(value);
      }

      return Buffer.from(JSON.stringify(value));
    } catch (error) {
      throw new KafkaMessageSerializationError(
        `Failed to serialize message value: ${error.message}`,
        {},
        error
      );
    }
  }

  /**
   * Serialize message headers to Kafka format
   * @param headers The headers to serialize
   * @returns Serialized headers
   */
  private serializeHeaders(headers: IKafkaHeaders): Record<string, Buffer> {
    const result: Record<string, Buffer> = {};

    try {
      for (const [key, value] of Object.entries(headers)) {
        if (value === null || value === undefined) {
          continue;
        }

        if (Buffer.isBuffer(value)) {
          result[key] = value;
        } else if (typeof value === 'string') {
          result[key] = Buffer.from(value);
        } else {
          result[key] = Buffer.from(JSON.stringify(value));
        }
      }

      return result;
    } catch (error) {
      throw new KafkaMessageSerializationError(
        `Failed to serialize message headers: ${error.message}`,
        {},
        error
      );
    }
  }

  /**
   * Group messages by topic for batch sending
   * @param messages Array of messages to group
   * @returns Messages grouped by topic
   */
  private groupMessagesByTopic<T>(messages: IKafkaMessage<T>[]): Record<string, IKafkaMessage<T>[]> {
    return messages.reduce((acc, message) => {
      const { topic } = message;
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic].push(message);
      return acc;
    }, {} as Record<string, IKafkaMessage<T>[]>);
  }

  /**
   * Enhance an event with metadata if not already present
   * @param event The event to enhance
   * @param correlationId The correlation ID for tracing
   * @returns Enhanced event
   */
  private enhanceEventWithMetadata(event: IBaseEvent, correlationId: string): IBaseEvent {
    // Create a copy of the event to avoid modifying the original
    const enhancedEvent = { ...event };

    // Add ID if not present
    if (!enhancedEvent.id) {
      enhancedEvent.id = uuidv4();
    }

    // Add timestamp if not present
    if (!enhancedEvent.timestamp) {
      enhancedEvent.timestamp = new Date().toISOString();
    }

    // Add metadata if not present
    if (!enhancedEvent.metadata) {
      enhancedEvent.metadata = {};
    }

    // Add correlation ID to metadata if not present
    if (!enhancedEvent.metadata.correlationId) {
      enhancedEvent.metadata.correlationId = correlationId;
    }

    // Add source service to metadata if not present
    if (!enhancedEvent.metadata.sourceService) {
      enhancedEvent.metadata.sourceService = process.env.SERVICE_NAME || 'unknown-service';
    }

    return enhancedEvent;
  }
}