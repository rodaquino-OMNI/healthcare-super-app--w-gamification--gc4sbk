import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Producer, ProducerRecord, RecordMetadata, Kafka } from 'kafkajs';

// Import from @austa/interfaces package for standardized event schemas
import {
  GamificationEvent,
  EventType,
  JourneyType,
  EventMetadata
} from '@austa/interfaces/gamification/events';

// Import from @austa/events package for event handling utilities
import {
  KafkaTopics,
  KafkaProducerOptions,
  KafkaHeaders
} from '@austa/events/kafka';

// Import error handling utilities
import {
  EventProcessingError,
  RetryOptions
} from '@austa/events/errors';

// Import logging and tracing utilities
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';

/**
 * Configuration options for the Kafka producer
 */
interface KafkaProducerConfig {
  /**
   * Client ID for the Kafka producer
   */
  clientId: string;

  /**
   * Broker addresses for the Kafka cluster
   */
  brokers: string[];

  /**
   * Retry options for failed message deliveries
   */
  retry: RetryOptions;

  /**
   * Whether to use SSL for Kafka connections
   */
  ssl: boolean;

  /**
   * SASL authentication configuration
   */
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

/**
 * Options for producing a message to Kafka
 */
interface ProduceOptions<T extends GamificationEvent> {
  /**
   * The event to produce
   */
  event: T;

  /**
   * Optional topic override
   * If not provided, the topic will be determined based on the event's journey
   */
  topic?: string;

  /**
   * Optional headers to include with the message
   */
  headers?: Record<string, string>;

  /**
   * Optional key for the message
   * If not provided, the event's userId will be used
   */
  key?: string;

  /**
   * Optional callback to be called when the message is acknowledged
   */
  onSuccess?: (metadata: RecordMetadata) => void;

  /**
   * Optional callback to be called when the message delivery fails
   */
  onError?: (error: Error) => void;
}

/**
 * Service for producing Kafka messages with type safety and reliability.
 * Handles serialization, topic routing, acknowledgment, and retry logic.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private producer: Producer;
  private kafka: Kafka;
  private readonly config: KafkaProducerConfig;
  private isConnected = false;
  private readonly defaultTopic: string;

  /**
   * Creates an instance of KafkaProducerService.
   * 
   * @param configService Service for accessing configuration
   * @param logger Service for logging
   * @param tracingService Service for distributed tracing
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService
  ) {
    // Load configuration from ConfigService
    this.config = {
      clientId: this.configService.get<string>(
        'gamificationEngine.kafka.producer.clientId',
        'gamification-engine-producer'
      ),
      brokers: this.configService.get<string>(
        'gamificationEngine.kafka.brokers',
        'localhost:9092'
      ).split(','),
      ssl: this.configService.get<boolean>(
        'gamificationEngine.kafka.ssl',
        false
      ),
      retry: {
        maxRetries: this.configService.get<number>(
          'gamificationEngine.kafka.producer.retry.maxRetries',
          5
        ),
        initialDelay: this.configService.get<number>(
          'gamificationEngine.kafka.producer.retry.initialDelayMs',
          100
        ),
        maxDelay: this.configService.get<number>(
          'gamificationEngine.kafka.producer.retry.maxDelayMs',
          30000
        ),
        exponentialBackoff: this.configService.get<boolean>(
          'gamificationEngine.kafka.producer.retry.exponentialBackoff',
          true
        ),
        jitter: this.configService.get<boolean>(
          'gamificationEngine.kafka.producer.retry.jitter',
          true
        )
      }
    };

    // Add SASL configuration if enabled
    const saslEnabled = this.configService.get<boolean>(
      'gamificationEngine.kafka.sasl.enabled',
      false
    );

    if (saslEnabled) {
      this.config.sasl = {
        mechanism: this.configService.get<'plain' | 'scram-sha-256' | 'scram-sha-512'>(
          'gamificationEngine.kafka.sasl.mechanism',
          'plain'
        ),
        username: this.configService.get<string>(
          'gamificationEngine.kafka.sasl.username',
          ''
        ),
        password: this.configService.get<string>(
          'gamificationEngine.kafka.sasl.password',
          ''
        )
      };
    }

    // Set default topic
    this.defaultTopic = this.configService.get<string>(
      'gamificationEngine.kafka.topics.gamificationEvents',
      KafkaTopics.GAMIFICATION_EVENTS
    );

    this.logger.log('KafkaProducerService initialized with config', {
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      ssl: this.config.ssl,
      saslEnabled
    }, 'KafkaProducerService');
  }

  /**
   * Initialize the Kafka producer on module initialization
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing Kafka producer', 'KafkaProducerService');

      // Create Kafka instance
      this.kafka = new Kafka({
        clientId: this.config.clientId,
        brokers: this.config.brokers,
        ssl: this.config.ssl,
        sasl: this.config.sasl,
        retry: {
          initialRetryTime: this.config.retry.initialDelay,
          retries: this.config.retry.maxRetries,
          maxRetryTime: this.config.retry.maxDelay
        }
      });

      // Create producer
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000,
        idempotent: true, // Ensures exactly-once delivery semantics
        maxInFlightRequests: 5
      });

      // Connect to Kafka
      await this.producer.connect();
      this.isConnected = true;

      this.logger.log('Kafka producer connected successfully', 'KafkaProducerService');

      // Set up event handlers
      this.producer.on('producer.disconnect', () => {
        this.isConnected = false;
        this.logger.warn('Kafka producer disconnected', 'KafkaProducerService');
      });

      this.producer.on('producer.connect', () => {
        this.isConnected = true;
        this.logger.log('Kafka producer reconnected', 'KafkaProducerService');
      });
    } catch (error) {
      this.logger.error(
        `Failed to initialize Kafka producer: ${error.message}`,
        { error: error.stack },
        'KafkaProducerService'
      );
      throw error;
    }
  }

  /**
   * Clean up resources on module destruction
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.producer && this.isConnected) {
        this.logger.log('Disconnecting Kafka producer', 'KafkaProducerService');
        await this.producer.disconnect();
        this.isConnected = false;
        this.logger.log('Kafka producer disconnected successfully', 'KafkaProducerService');
      }
    } catch (error) {
      this.logger.error(
        `Error disconnecting Kafka producer: ${error.message}`,
        { error: error.stack },
        'KafkaProducerService'
      );
    }
  }

  /**
   * Determines the appropriate Kafka topic for an event based on its journey
   * 
   * @param event The event to determine the topic for
   * @returns The appropriate Kafka topic
   */
  private getTopicForEvent(event: GamificationEvent): string {
    // If the event has a journey, use the corresponding topic
    if (event.journey) {
      switch (event.journey) {
        case JourneyType.HEALTH:
          return KafkaTopics.HEALTH_EVENTS;
        case JourneyType.CARE:
          return KafkaTopics.CARE_EVENTS;
        case JourneyType.PLAN:
          return KafkaTopics.PLAN_EVENTS;
        default:
          return this.defaultTopic;
      }
    }

    // If no journey is specified, use the default topic
    return this.defaultTopic;
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
   * Produces a message to Kafka with type safety and reliability
   * 
   * @param options Options for producing the message
   * @returns A promise that resolves with the record metadata when the message is acknowledged
   * @throws EventProcessingError if the message cannot be produced
   */
  public async produce<T extends GamificationEvent>(options: ProduceOptions<T>): Promise<RecordMetadata> {
    const { event, topic, headers, key, onSuccess, onError } = options;
    const correlationId = event.metadata?.correlationId || this.tracingService.generateTraceId();

    try {
      // Check if producer is connected
      if (!this.isProducerConnected()) {
        throw new Error('Kafka producer not connected');
      }

      // Determine the topic to use
      const targetTopic = topic || this.getTopicForEvent(event);

      // Add correlation ID to event metadata if not present
      if (!event.metadata) {
        event.metadata = {} as EventMetadata;
      }

      event.metadata.correlationId = correlationId;
      event.metadata.timestamp = event.metadata.timestamp || new Date().toISOString();

      // Create the producer record
      const record: ProducerRecord = {
        topic: targetTopic,
        messages: [
          {
            key: key || event.userId,
            value: JSON.stringify(event),
            headers: {
              ...headers,
              [KafkaHeaders.CORRELATION_ID]: correlationId,
              [KafkaHeaders.EVENT_TYPE]: event.type,
              [KafkaHeaders.JOURNEY]: event.journey || 'unknown',
              [KafkaHeaders.TIMESTAMP]: new Date().toISOString()
            }
          }
        ]
      };

      // Start a trace span for the produce operation
      const span = this.tracingService.startSpan('kafka.produce', {
        'kafka.topic': targetTopic,
        'kafka.event_type': event.type,
        'kafka.correlation_id': correlationId,
        'kafka.user_id': event.userId,
        'kafka.journey': event.journey || 'unknown'
      });

      try {
        // Send the message to Kafka
        this.logger.log(
          `Producing event ${event.type} to topic ${targetTopic}`,
          { eventType: event.type, userId: event.userId, correlationId, topic: targetTopic },
          'KafkaProducerService'
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
          },
          'KafkaProducerService'
        );

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(metadata);
        }

        // End the trace span
        span.end();

        return metadata;
      } catch (error) {
        // Record error in the trace span
        span.recordException(error);
        span.end();

        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Failed to produce event ${event.type}: ${error.message}`,
        { error: error.stack, eventType: event.type, userId: event.userId, correlationId },
        'KafkaProducerService'
      );

      // Call error callback if provided
      if (onError) {
        onError(error);
      }

      // Rethrow as EventProcessingError for consistent error handling
      throw new EventProcessingError(
        `Event production failed: ${error.message}`,
        'PRODUCTION_ERROR',
        {
          correlationId,
          eventType: event.type,
          userId: event.userId,
          journey: event.journey
        },
        error
      );
    }
  }

  /**
   * Produces a batch of messages to Kafka with type safety and reliability
   * 
   * @param events Array of events to produce
   * @param topic Optional topic override
   * @returns A promise that resolves with an array of record metadata when all messages are acknowledged
   * @throws EventProcessingError if any message cannot be produced
   */
  public async produceBatch<T extends GamificationEvent>(
    events: T[],
    topic?: string
  ): Promise<RecordMetadata[]> {
    try {
      // Check if producer is connected
      if (!this.isProducerConnected()) {
        throw new Error('Kafka producer not connected');
      }

      // Group events by topic
      const eventsByTopic = new Map<string, T[]>();

      for (const event of events) {
        const targetTopic = topic || this.getTopicForEvent(event);
        if (!eventsByTopic.has(targetTopic)) {
          eventsByTopic.set(targetTopic, []);
        }
        eventsByTopic.get(targetTopic).push(event);
      }

      // Create producer records for each topic
      const records: ProducerRecord[] = [];

      for (const [topicName, topicEvents] of eventsByTopic.entries()) {
        const messages = topicEvents.map(event => {
          const correlationId = event.metadata?.correlationId || this.tracingService.generateTraceId();

          // Add correlation ID to event metadata if not present
          if (!event.metadata) {
            event.metadata = {} as EventMetadata;
          }

          event.metadata.correlationId = correlationId;
          event.metadata.timestamp = event.metadata.timestamp || new Date().toISOString();

          return {
            key: event.userId,
            value: JSON.stringify(event),
            headers: {
              [KafkaHeaders.CORRELATION_ID]: correlationId,
              [KafkaHeaders.EVENT_TYPE]: event.type,
              [KafkaHeaders.JOURNEY]: event.journey || 'unknown',
              [KafkaHeaders.TIMESTAMP]: new Date().toISOString()
            }
          };
        });

        records.push({
          topic: topicName,
          messages
        });
      }

      // Start a trace span for the batch produce operation
      const span = this.tracingService.startSpan('kafka.produce_batch', {
        'kafka.batch_size': events.length,
        'kafka.topic_count': records.length
      });

      try {
        // Send all messages to Kafka
        this.logger.log(
          `Producing batch of ${events.length} events to ${records.length} topics`,
          { batchSize: events.length, topicCount: records.length },
          'KafkaProducerService'
        );

        const results = await Promise.all(records.map(record => this.producer.send(record)));
        const metadata = results.flatMap(result => result);

        // Log successful production
        this.logger.log(
          `Batch of ${events.length} events produced successfully`,
          { batchSize: events.length, topicCount: records.length },
          'KafkaProducerService'
        );

        // End the trace span
        span.end();

        return metadata;
      } catch (error) {
        // Record error in the trace span
        span.recordException(error);
        span.end();

        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Failed to produce batch of events: ${error.message}`,
        { error: error.stack, batchSize: events.length },
        'KafkaProducerService'
      );

      // Rethrow as EventProcessingError for consistent error handling
      throw new EventProcessingError(
        `Batch event production failed: ${error.message}`,
        'BATCH_PRODUCTION_ERROR',
        {
          batchSize: events.length
        },
        error
      );
    }
  }

  /**
   * Produces a health event to Kafka
   * 
   * @param event The health event to produce
   * @returns A promise that resolves with the record metadata when the message is acknowledged
   */
  public async produceHealthEvent<T extends GamificationEvent>(event: T): Promise<RecordMetadata> {
    return this.produce({
      event,
      topic: KafkaTopics.HEALTH_EVENTS
    });
  }

  /**
   * Produces a care event to Kafka
   * 
   * @param event The care event to produce
   * @returns A promise that resolves with the record metadata when the message is acknowledged
   */
  public async produceCareEvent<T extends GamificationEvent>(event: T): Promise<RecordMetadata> {
    return this.produce({
      event,
      topic: KafkaTopics.CARE_EVENTS
    });
  }

  /**
   * Produces a plan event to Kafka
   * 
   * @param event The plan event to produce
   * @returns A promise that resolves with the record metadata when the message is acknowledged
   */
  public async producePlanEvent<T extends GamificationEvent>(event: T): Promise<RecordMetadata> {
    return this.produce({
      event,
      topic: KafkaTopics.PLAN_EVENTS
    });
  }

  /**
   * Produces a system event to Kafka
   * 
   * @param event The system event to produce
   * @returns A promise that resolves with the record metadata when the message is acknowledged
   */
  public async produceSystemEvent<T extends GamificationEvent>(event: T): Promise<RecordMetadata> {
    return this.produce({
      event,
      topic: KafkaTopics.SYSTEM_EVENTS
    });
  }

  /**
   * Flushes any pending messages to Kafka
   * 
   * @returns A promise that resolves when all pending messages are flushed
   */
  public async flush(): Promise<void> {
    if (this.isProducerConnected()) {
      await this.producer.flush();
      this.logger.log('Kafka producer flushed successfully', 'KafkaProducerService');
    }
  }
}