import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord, RecordMetadata, Message, CompressionTypes } from 'kafkajs';
import { TracingService } from '@austa/tracing';
import { ErrorService } from '@austa/errors';
import { INotificationStatus } from '../interfaces/notification-status.interface';
import { INotificationEventResponse } from '../interfaces/notification-event-response.interface';
import { NotificationEventTypeEnum } from '../dto/notification-event-type.enum';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration options for the Kafka producer
 */
interface KafkaProducerOptions {
  /**
   * Number of retries for failed publish operations
   * @default 3
   */
  maxRetries?: number;

  /**
   * Retry backoff factor in milliseconds
   * @default 300
   */
  retryBackoffMs?: number;

  /**
   * Whether to enable batching of messages
   * @default true
   */
  enableBatching?: boolean;

  /**
   * Batch size in bytes
   * @default 16384 (16KB)
   */
  batchSize?: number;

  /**
   * Compression type for messages
   * @default 'snappy'
   */
  compression?: CompressionTypes;

  /**
   * Linger time in milliseconds for batching
   * @default 10
   */
  lingerMs?: number;
}

/**
 * Service responsible for publishing notification delivery status events to Kafka topics.
 * 
 * This service provides methods for publishing different types of notification status events
 * (sent, delivered, failed, read) with proper error handling, retries, and distributed tracing.
 * It supports both synchronous and asynchronous publishing modes.
 */
@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly producer: Producer;
  private readonly logger = new Logger(KafkaProducer.name);
  private readonly options: KafkaProducerOptions;
  private readonly topicPrefix: string;
  private isConnected = false;

  /**
   * Creates an instance of KafkaProducer.
   * 
   * @param configService - NestJS ConfigService for retrieving configuration
   * @param tracingService - Service for distributed tracing
   * @param errorService - Service for standardized error handling
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly tracingService: TracingService,
    private readonly errorService: ErrorService,
  ) {
    // Initialize Kafka client
    const kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID', 'notification-service'),
      brokers: this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
      ssl: this.configService.get<boolean>('KAFKA_SSL_ENABLED', false),
      sasl: this.getSaslConfig(),
      connectionTimeout: this.configService.get<number>('KAFKA_CONNECTION_TIMEOUT', 3000),
      requestTimeout: this.configService.get<number>('KAFKA_REQUEST_TIMEOUT', 30000),
    });

    // Configure producer options
    this.options = {
      maxRetries: this.configService.get<number>('KAFKA_PRODUCER_MAX_RETRIES', 3),
      retryBackoffMs: this.configService.get<number>('KAFKA_PRODUCER_RETRY_BACKOFF_MS', 300),
      enableBatching: this.configService.get<boolean>('KAFKA_PRODUCER_ENABLE_BATCHING', true),
      batchSize: this.configService.get<number>('KAFKA_PRODUCER_BATCH_SIZE', 16384),
      compression: this.configService.get<CompressionTypes>('KAFKA_PRODUCER_COMPRESSION', CompressionTypes.Snappy),
      lingerMs: this.configService.get<number>('KAFKA_PRODUCER_LINGER_MS', 10),
    };

    // Initialize producer
    this.producer = kafka.producer({
      allowAutoTopicCreation: this.configService.get<boolean>('KAFKA_ALLOW_AUTO_TOPIC_CREATION', true),
      transactionTimeout: this.configService.get<number>('KAFKA_TRANSACTION_TIMEOUT', 60000),
      idempotent: this.configService.get<boolean>('KAFKA_PRODUCER_IDEMPOTENT', true),
      maxInFlightRequests: this.configService.get<number>('KAFKA_PRODUCER_MAX_IN_FLIGHT', 5),
    });

    // Set topic prefix for environment isolation
    this.topicPrefix = this.configService.get<string>('KAFKA_TOPIC_PREFIX', '');
  }

  /**
   * Initializes the Kafka producer connection when the module starts.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
      this.logger.log('Kafka producer initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka producer', error);
      // Don't throw here to allow the service to start even if Kafka is temporarily unavailable
      // The producer will attempt to reconnect when publishing messages
    }
  }

  /**
   * Disconnects the Kafka producer when the module is destroyed.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnect();
      this.logger.log('Kafka producer disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka producer', error);
    }
  }

  /**
   * Connects to the Kafka broker.
   * @returns Promise that resolves when connected
   */
  private async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Connected to Kafka');
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to connect to Kafka', error);
      throw this.errorService.createError(
        'KAFKA_CONNECTION_ERROR',
        'Failed to connect to Kafka broker',
        error,
      );
    }
  }

  /**
   * Disconnects from the Kafka broker.
   * @returns Promise that resolves when disconnected
   */
  private async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.isConnected = false;
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka', error);
      throw this.errorService.createError(
        'KAFKA_DISCONNECT_ERROR',
        'Failed to disconnect from Kafka broker',
        error,
      );
    }
  }

  /**
   * Gets SASL configuration for Kafka if enabled.
   * @returns SASL configuration object or undefined if not enabled
   */
  private getSaslConfig(): any {
    const saslEnabled = this.configService.get<boolean>('KAFKA_SASL_ENABLED', false);
    
    if (!saslEnabled) {
      return undefined;
    }

    return {
      mechanism: this.configService.get<string>('KAFKA_SASL_MECHANISM', 'plain'),
      username: this.configService.get<string>('KAFKA_SASL_USERNAME', ''),
      password: this.configService.get<string>('KAFKA_SASL_PASSWORD', ''),
    };
  }

  /**
   * Publishes a notification status event to Kafka.
   * 
   * @param status - Notification status information
   * @param correlationId - Optional correlation ID for distributed tracing
   * @returns Promise resolving to the event response
   */
  async publishNotificationStatus(
    status: INotificationStatus,
    correlationId?: string,
  ): Promise<INotificationEventResponse> {
    const topic = this.getTopicName('notification.status');
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Create the event payload
    const event = {
      eventId,
      type: NotificationEventTypeEnum.STATUS_UPDATE,
      timestamp,
      version: '1.0.0',
      payload: status,
      metadata: {
        correlationId: correlationId || uuidv4(),
        source: 'notification-service',
      },
    };

    return this.publishEvent(topic, event, status.notificationId);
  }

  /**
   * Publishes a notification sent event to Kafka.
   * 
   * @param notificationId - ID of the notification
   * @param userId - ID of the user receiving the notification
   * @param channel - Delivery channel (email, sms, push, in-app)
   * @param correlationId - Optional correlation ID for distributed tracing
   * @returns Promise resolving to the event response
   */
  async publishNotificationSent(
    notificationId: string,
    userId: string,
    channel: string,
    correlationId?: string,
  ): Promise<INotificationEventResponse> {
    return this.publishNotificationStatus(
      {
        notificationId,
        userId,
        status: 'sent',
        channel,
        timestamp: new Date().toISOString(),
      },
      correlationId,
    );
  }

  /**
   * Publishes a notification delivered event to Kafka.
   * 
   * @param notificationId - ID of the notification
   * @param userId - ID of the user receiving the notification
   * @param channel - Delivery channel (email, sms, push, in-app)
   * @param correlationId - Optional correlation ID for distributed tracing
   * @returns Promise resolving to the event response
   */
  async publishNotificationDelivered(
    notificationId: string,
    userId: string,
    channel: string,
    correlationId?: string,
  ): Promise<INotificationEventResponse> {
    return this.publishNotificationStatus(
      {
        notificationId,
        userId,
        status: 'delivered',
        channel,
        timestamp: new Date().toISOString(),
      },
      correlationId,
    );
  }

  /**
   * Publishes a notification read event to Kafka.
   * 
   * @param notificationId - ID of the notification
   * @param userId - ID of the user receiving the notification
   * @param channel - Delivery channel (email, sms, push, in-app)
   * @param correlationId - Optional correlation ID for distributed tracing
   * @returns Promise resolving to the event response
   */
  async publishNotificationRead(
    notificationId: string,
    userId: string,
    channel: string,
    correlationId?: string,
  ): Promise<INotificationEventResponse> {
    return this.publishNotificationStatus(
      {
        notificationId,
        userId,
        status: 'read',
        channel,
        timestamp: new Date().toISOString(),
      },
      correlationId,
    );
  }

  /**
   * Publishes a notification failed event to Kafka.
   * 
   * @param notificationId - ID of the notification
   * @param userId - ID of the user receiving the notification
   * @param channel - Delivery channel (email, sms, push, in-app)
   * @param error - Error information
   * @param correlationId - Optional correlation ID for distributed tracing
   * @returns Promise resolving to the event response
   */
  async publishNotificationFailed(
    notificationId: string,
    userId: string,
    channel: string,
    error: any,
    correlationId?: string,
  ): Promise<INotificationEventResponse> {
    return this.publishNotificationStatus(
      {
        notificationId,
        userId,
        status: 'failed',
        channel,
        timestamp: new Date().toISOString(),
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Unknown error occurred',
          details: error.details || {},
        },
      },
      correlationId,
    );
  }

  /**
   * Publishes an event to a Kafka topic with retry logic.
   * 
   * @param topic - Kafka topic name
   * @param event - Event payload
   * @param key - Optional message key for partitioning
   * @returns Promise resolving to the event response
   */
  private async publishEvent(
    topic: string,
    event: any,
    key?: string,
  ): Promise<INotificationEventResponse> {
    // Create a span for tracing
    const span = this.tracingService.createSpan('kafka.producer.publish', {
      'kafka.topic': topic,
      'event.id': event.eventId,
      'event.type': event.type,
    });

    try {
      // Ensure we're connected
      if (!this.isConnected) {
        await this.connect();
      }

      // Prepare the message
      const message: Message = {
        value: JSON.stringify(event),
        headers: {
          'X-Correlation-ID': event.metadata?.correlationId || uuidv4(),
          'X-Event-ID': event.eventId,
          'X-Event-Type': event.type,
          'X-Event-Version': event.version,
          'X-Source-Service': 'notification-service',
          'X-Timestamp': event.timestamp,
        },
      };

      // Add key if provided
      if (key) {
        message.key = key;
      }

      // Prepare the record
      const record: ProducerRecord = {
        topic,
        messages: [message],
        acks: -1, // Wait for all replicas
        compression: this.options.compression,
      };

      // Send with retry logic
      const result = await this.sendWithRetry(record);

      // Add trace information
      span.setAttributes({
        'kafka.partition': result[0].partition,
        'kafka.offset': result[0].baseOffset,
      });

      // Return success response
      return {
        success: true,
        eventId: event.eventId,
        topic,
        partition: result[0].partition,
        offset: result[0].baseOffset,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Record error in span
      span.recordException(error);
      
      // Log the error
      this.logger.error(
        `Failed to publish event to topic ${topic}`,
        error.stack,
      );

      // Return error response
      return {
        success: false,
        eventId: event.eventId,
        topic,
        timestamp: new Date().toISOString(),
        error: {
          code: error.code || 'KAFKA_PUBLISH_ERROR',
          message: error.message || 'Failed to publish event to Kafka',
          details: error.details || {},
        },
      };
    } finally {
      // End the span
      span.end();
    }
  }

  /**
   * Sends a message to Kafka with retry logic.
   * 
   * @param record - Producer record to send
   * @param attempt - Current attempt number (for internal use in recursion)
   * @returns Promise resolving to record metadata
   */
  private async sendWithRetry(
    record: ProducerRecord,
    attempt = 1,
  ): Promise<RecordMetadata[]> {
    try {
      return await this.producer.send(record);
    } catch (error) {
      // If we've reached max retries, throw the error
      if (attempt >= this.options.maxRetries) {
        throw this.errorService.createError(
          'KAFKA_MAX_RETRIES_EXCEEDED',
          `Failed to publish to topic ${record.topic} after ${attempt} attempts`,
          error,
        );
      }

      // Log retry attempt
      this.logger.warn(
        `Retrying Kafka publish to topic ${record.topic} (attempt ${attempt + 1}/${this.options.maxRetries})`,
      );

      // Calculate backoff with exponential factor
      const backoff = this.options.retryBackoffMs * Math.pow(2, attempt - 1);
      
      // Wait for backoff period
      await new Promise(resolve => setTimeout(resolve, backoff));
      
      // Retry with incremented attempt counter
      return this.sendWithRetry(record, attempt + 1);
    }
  }

  /**
   * Publishes an event asynchronously without waiting for the result.
   * Useful for non-critical events where the caller doesn't need to wait.
   * 
   * @param topic - Kafka topic name
   * @param event - Event payload
   * @param key - Optional message key for partitioning
   */
  async publishEventAsync(
    topic: string,
    event: any,
    key?: string,
  ): Promise<void> {
    // Fire and forget - don't await the result
    this.publishEvent(this.getTopicName(topic), event, key)
      .catch(error => {
        this.logger.error(
          `Async event publication to topic ${topic} failed`,
          error.stack,
        );
      });
  }

  /**
   * Publishes a notification status event asynchronously.
   * 
   * @param status - Notification status information
   * @param correlationId - Optional correlation ID for distributed tracing
   */
  async publishNotificationStatusAsync(
    status: INotificationStatus,
    correlationId?: string,
  ): Promise<void> {
    const topic = this.getTopicName('notification.status');
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Create the event payload
    const event = {
      eventId,
      type: NotificationEventTypeEnum.STATUS_UPDATE,
      timestamp,
      version: '1.0.0',
      payload: status,
      metadata: {
        correlationId: correlationId || uuidv4(),
        source: 'notification-service',
      },
    };

    // Fire and forget
    this.publishEventAsync(topic, event, status.notificationId);
  }

  /**
   * Gets the full topic name with prefix if configured.
   * 
   * @param baseTopic - Base topic name
   * @returns Full topic name with prefix
   */
  private getTopicName(baseTopic: string): string {
    return this.topicPrefix ? `${this.topicPrefix}.${baseTopic}` : baseTopic;
  }

  /**
   * Publishes a batch of notification status events to Kafka.
   * 
   * @param statuses - Array of notification status information
   * @param correlationId - Optional correlation ID for distributed tracing
   * @returns Promise resolving to an array of event responses
   */
  async publishNotificationStatusBatch(
    statuses: INotificationStatus[],
    correlationId?: string,
  ): Promise<INotificationEventResponse[]> {
    const topic = this.getTopicName('notification.status');
    const batchCorrelationId = correlationId || uuidv4();
    const timestamp = new Date().toISOString();
    
    // Create a span for tracing
    const span = this.tracingService.createSpan('kafka.producer.publish_batch', {
      'kafka.topic': topic,
      'batch.size': statuses.length,
      'correlation.id': batchCorrelationId,
    });

    try {
      // Ensure we're connected
      if (!this.isConnected) {
        await this.connect();
      }

      // Prepare messages
      const messages: Message[] = statuses.map(status => {
        const eventId = uuidv4();
        const event = {
          eventId,
          type: NotificationEventTypeEnum.STATUS_UPDATE,
          timestamp,
          version: '1.0.0',
          payload: status,
          metadata: {
            correlationId: batchCorrelationId,
            source: 'notification-service',
            batchId: batchCorrelationId,
          },
        };

        return {
          key: status.notificationId,
          value: JSON.stringify(event),
          headers: {
            'X-Correlation-ID': batchCorrelationId,
            'X-Event-ID': eventId,
            'X-Event-Type': NotificationEventTypeEnum.STATUS_UPDATE,
            'X-Event-Version': '1.0.0',
            'X-Source-Service': 'notification-service',
            'X-Timestamp': timestamp,
            'X-Batch-ID': batchCorrelationId,
          },
        };
      });

      // Prepare the record
      const record: ProducerRecord = {
        topic,
        messages,
        acks: -1, // Wait for all replicas
        compression: this.options.compression,
      };

      // Send with retry logic
      const result = await this.sendWithRetry(record);

      // Add trace information
      span.setAttributes({
        'kafka.partition': result[0].partition,
        'kafka.offset': result[0].baseOffset,
        'batch.success': true,
      });

      // Return success responses
      return messages.map((message, index) => {
        const parsedEvent = JSON.parse(message.value.toString());
        return {
          success: true,
          eventId: parsedEvent.eventId,
          topic,
          partition: result[0].partition,
          offset: BigInt(result[0].baseOffset) + BigInt(index),
          timestamp: new Date().toISOString(),
        };
      });
    } catch (error) {
      // Record error in span
      span.recordException(error);
      
      // Log the error
      this.logger.error(
        `Failed to publish batch of ${statuses.length} events to topic ${topic}`,
        error.stack,
      );

      // Return error responses
      return statuses.map(status => ({
        success: false,
        eventId: uuidv4(), // We don't have the original event IDs here
        topic,
        timestamp: new Date().toISOString(),
        error: {
          code: error.code || 'KAFKA_BATCH_PUBLISH_ERROR',
          message: error.message || 'Failed to publish batch of events to Kafka',
          details: error.details || {},
        },
      }));
    } finally {
      // End the span
      span.end();
    }
  }
}