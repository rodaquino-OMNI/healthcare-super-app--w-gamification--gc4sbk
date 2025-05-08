import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord, RecordMetadata, Message } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { GamificationEvent, EventType, EventProcessingResult } from '@austa/interfaces/gamification';

/**
 * Configuration options for the Kafka producer
 */
interface KafkaProducerOptions {
  /**
   * Kafka broker addresses
   */
  brokers: string[];
  
  /**
   * Client ID for the producer
   */
  clientId: string;
  
  /**
   * Number of retries for failed message deliveries
   */
  maxRetries?: number;
  
  /**
   * Timeout in milliseconds for message delivery
   */
  timeout?: number;
}

/**
 * Options for producing a message
 */
interface ProduceOptions {
  /**
   * Topic to produce the message to
   * If not provided, will be determined from the event type
   */
  topic?: string;
  
  /**
   * Headers to include with the message
   */
  headers?: Record<string, string>;
  
  /**
   * Partition key for the message
   * If not provided, will use the userId from the event
   */
  key?: string;
  
  /**
   * Whether to wait for acknowledgment from the broker
   * Default: true (at-least-once delivery)
   */
  requireAcks?: boolean;
}

/**
 * Service for producing Kafka messages with type safety and reliability
 * 
 * This service provides a type-safe way to produce events to Kafka topics
 * with proper error handling, retries, and acknowledgment strategies.
 * It integrates with the tracing service for distributed request tracking
 * and provides structured logging for all operations.
 */
@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private producer: Producer;
  private readonly options: KafkaProducerOptions;
  private readonly topicPrefix: string;
  private isConnected = false;
  
  /**
   * Topic mapping for event types
   * Maps event types to their corresponding topics
   */
  private readonly topicMapping: Record<string, string> = {
    // Health journey events
    [EventType.HEALTH_METRIC_RECORDED]: 'health.events',
    [EventType.GOAL_ACHIEVED]: 'health.events',
    [EventType.DEVICE_CONNECTED]: 'health.events',
    
    // Care journey events
    [EventType.APPOINTMENT_BOOKED]: 'care.events',
    [EventType.MEDICATION_TAKEN]: 'care.events',
    [EventType.TELEMEDICINE_SESSION_COMPLETED]: 'care.events',
    
    // Plan journey events
    [EventType.CLAIM_SUBMITTED]: 'plan.events',
    [EventType.BENEFIT_USED]: 'plan.events',
    [EventType.PLAN_SELECTED]: 'plan.events',
    
    // Gamification events
    [EventType.ACHIEVEMENT_UNLOCKED]: 'gamification.events',
    [EventType.REWARD_EARNED]: 'gamification.events',
    [EventType.QUEST_COMPLETED]: 'gamification.events',
    [EventType.LEVEL_UP]: 'gamification.events',
    
    // Default topic for unknown event types
    default: 'gamification.events'
  };
  
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService
  ) {
    // Get Kafka configuration from config service
    const brokers = this.configService.get<string[]>('gamificationEngine.kafka.brokers') || 
                    this.configService.get<string[]>('kafka.brokers') || 
                    ['localhost:9092'];
    
    const clientId = this.configService.get<string>('gamificationEngine.kafka.clientId') || 
                     this.configService.get<string>('kafka.clientId') || 
                     'gamification-engine-producer';
    
    const maxRetries = this.configService.get<number>('gamificationEngine.kafka.producer.maxRetries') || 
                       this.configService.get<number>('kafka.producer.maxRetries') || 
                       5;
    
    const timeout = this.configService.get<number>('gamificationEngine.kafka.producer.timeout') || 
                    this.configService.get<number>('kafka.producer.timeout') || 
                    30000; // 30 seconds
    
    this.topicPrefix = this.configService.get<string>('gamificationEngine.kafka.topicPrefix') || 
                       this.configService.get<string>('kafka.topicPrefix') || 
                       '';
    
    this.options = {
      brokers,
      clientId,
      maxRetries,
      timeout
    };
    
    this.logger.log('KafkaProducerService initialized with options', {
      brokers,
      clientId,
      maxRetries,
      timeout,
      topicPrefix: this.topicPrefix
    });
    
    // Initialize Kafka client and producer
    const kafka = new Kafka({
      clientId: this.options.clientId,
      brokers: this.options.brokers,
      retry: {
        initialRetryTime: 100,
        retries: this.options.maxRetries
      }
    });
    
    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: this.options.timeout
    });
  }
  
  /**
   * Connect to Kafka when the module initializes
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Connecting to Kafka brokers', { brokers: this.options.brokers });
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to Kafka');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', { error: error.message, stack: error.stack });
      // Don't throw here to allow the application to start even if Kafka is not available
      // The producer will attempt to reconnect when produce() is called
    }
  }
  
  /**
   * Disconnect from Kafka when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    if (this.isConnected) {
      try {
        this.logger.log('Flushing and disconnecting from Kafka');
        
        // Flush any pending messages before disconnecting
        await this.flush();
        
        // Disconnect from Kafka
        await this.producer.disconnect();
        this.isConnected = false;
        this.logger.log('Successfully disconnected from Kafka');
      } catch (error) {
        this.logger.error('Failed to disconnect from Kafka', { error: error.message, stack: error.stack });
      }
    }
  }
  
  /**
   * Flush any pending messages to ensure they are sent
   * @returns Promise that resolves when all pending messages are sent
   */
  async flush(): Promise<void> {
    if (this.isConnected) {
      try {
        this.logger.log('Flushing pending Kafka messages');
        await this.producer.flush();
        this.logger.log('Successfully flushed pending Kafka messages');
      } catch (error) {
        this.logger.error('Failed to flush Kafka messages', { error: error.message, stack: error.stack });
        throw error;
      }
    }
  }
  
  /**
   * Determine the appropriate topic for an event type
   * @param eventType The type of the event
   * @returns The corresponding Kafka topic
   */
  private getTopicForEventType(eventType: string): string {
    const topic = this.topicMapping[eventType] || this.topicMapping.default;
    return this.topicPrefix ? `${this.topicPrefix}.${topic}` : topic;
  }
  
  /**
   * Produce a typed event to Kafka
   * @param event The event to produce
   * @param options Options for producing the message
   * @param retryCount Current retry count (used internally for retries)
   * @returns Promise resolving to the record metadata if successful
   */
  async produce<T extends GamificationEvent>(
    event: T,
    options: ProduceOptions = {},
    retryCount = 0
  ): Promise<RecordMetadata[]> {
    // Ensure we're connected to Kafka
    if (!this.isConnected) {
      try {
        this.logger.log('Reconnecting to Kafka before producing message');
        await this.producer.connect();
        this.isConnected = true;
      } catch (error) {
        this.logger.error('Failed to reconnect to Kafka', { error: error.message, stack: error.stack });
        throw new Error(`Failed to connect to Kafka: ${error.message}`);
      }
    }
    
    // Validate the event against the GamificationEvent interface
    if (!event.type || !event.userId || !event.data) {
      const validationError = new Error('Invalid event: missing required fields (type, userId, or data)');
      this.logger.error('Event validation failed', { 
        error: validationError.message,
        event: JSON.stringify(event)
      });
      throw validationError;
    }
    
    // Generate a unique message ID for tracing
    const messageId = uuidv4();
    
    // Determine the topic based on event type if not provided
    const topic = options.topic || this.getTopicForEventType(event.type);
    
    // Use userId as the partition key if not provided
    const key = options.key || event.userId;
    
    // Create tracing headers
    const traceContext = this.tracingService.getTraceContext();
    const headers = {
      ...options.headers,
      'message-id': messageId,
      'content-type': 'application/json',
      ...traceContext
    };
    
    // Add timestamp and correlationId if not present
    const eventWithMetadata = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      correlationId: event.correlationId || messageId
    };
    
    // Create the message
    const message: Message = {
      key: key ? Buffer.from(key) : null,
      value: Buffer.from(JSON.stringify(eventWithMetadata)),
      headers: Object.entries(headers).reduce((acc, [key, value]) => {
        acc[key] = Buffer.from(String(value));
        return acc;
      }, {})
    };
    
    // Create the producer record
    const record: ProducerRecord = {
      topic,
      messages: [message]
    };
    
    // Start a trace span for the produce operation
    const span = this.tracingService.startSpan('kafka.produce', {
      'kafka.topic': topic,
      'kafka.message_id': messageId,
      'event.type': event.type,
      'user.id': event.userId
    });
    
    try {
      this.logger.log('Producing message to Kafka', {
        topic,
        messageId,
        eventType: event.type,
        userId: event.userId
      });
      
      // Send the message with acknowledgment if required
      const result = await this.producer.send({
        ...record,
        acks: options.requireAcks !== false ? -1 : 0 // -1 = all brokers must acknowledge (default)
      });
      
      this.logger.log('Successfully produced message to Kafka', {
        topic,
        messageId,
        eventType: event.type,
        userId: event.userId,
        partition: result[0]?.partition,
        offset: result[0]?.offset
      });
      
      // End the trace span with success
      span.end();
      
      return result;
    } catch (error) {
      // Log the error
      this.logger.error('Failed to produce message to Kafka', {
        topic,
        messageId,
        eventType: event.type,
        userId: event.userId,
        error: error.message,
        stack: error.stack,
        retryCount
      });
      
      // End the trace span with error
      span.end(error);
      
      // Retry logic for retriable errors
      const maxRetries = this.options.maxRetries || 5;
      const isRetriable = (
        error.name === 'KafkaJSConnectionError' ||
        error.name === 'KafkaJSRequestTimeoutError' ||
        error.name === 'KafkaJSBrokerNotFound' ||
        error.retriable === true
      );
      
      if (isRetriable && retryCount < maxRetries) {
        const nextRetryCount = retryCount + 1;
        const backoffTime = Math.min(100 * Math.pow(2, nextRetryCount), 10000); // Exponential backoff with max 10s
        
        this.logger.log(`Retrying message production after ${backoffTime}ms (attempt ${nextRetryCount}/${maxRetries})`, {
          topic,
          messageId,
          eventType: event.type,
          userId: event.userId,
          retryCount: nextRetryCount
        });
        
        // Wait for backoff time
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Retry the produce operation
        return this.produce(event, options, nextRetryCount);
      }
      
      // If we've exhausted retries or the error is not retriable, rethrow
      throw error;
    }
  }
  
  /**
   * Produce a batch of typed events to Kafka
   * @param events Array of events to produce
   * @param options Options for producing the messages
   * @param retryCount Current retry count (used internally for retries)
   * @returns Promise resolving to the record metadata if successful
   */
  async produceBatch<T extends GamificationEvent>(
    events: T[],
    options: ProduceOptions = {},
    retryCount = 0
  ): Promise<RecordMetadata[]> {
    if (!events.length) {
      return [];
    }
    
    // Ensure we're connected to Kafka
    if (!this.isConnected) {
      try {
        this.logger.log('Reconnecting to Kafka before producing batch');
        await this.producer.connect();
        this.isConnected = true;
      } catch (error) {
        this.logger.error('Failed to reconnect to Kafka', { error: error.message, stack: error.stack });
        throw new Error(`Failed to connect to Kafka: ${error.message}`);
      }
    }
    
    // Validate all events in the batch
    const invalidEvents = events.filter(event => !event.type || !event.userId || !event.data);
    if (invalidEvents.length > 0) {
      const validationError = new Error(`Invalid events in batch: ${invalidEvents.length} events missing required fields`);
      this.logger.error('Batch validation failed', { 
        error: validationError.message,
        invalidCount: invalidEvents.length,
        totalCount: events.length,
        invalidEvents: JSON.stringify(invalidEvents.slice(0, 3)) // Log first 3 invalid events
      });
      throw validationError;
    }
    
    // Group events by topic
    const eventsByTopic: Record<string, { event: T, key: string, messageId: string }[]> = {};
    
    // Process each event
    for (const event of events) {
      const messageId = uuidv4();
      const topic = options.topic || this.getTopicForEventType(event.type);
      const key = options.key || event.userId;
      
      if (!eventsByTopic[topic]) {
        eventsByTopic[topic] = [];
      }
      
      eventsByTopic[topic].push({ event, key, messageId });
    }
    
    // Create tracing headers
    const traceContext = this.tracingService.getTraceContext();
    const batchId = uuidv4();
    
    // Start a trace span for the batch produce operation
    const span = this.tracingService.startSpan('kafka.produce_batch', {
      'kafka.batch_id': batchId,
      'kafka.message_count': events.length
    });
    
    try {
      this.logger.log('Producing batch of messages to Kafka', {
        batchId,
        messageCount: events.length,
        topics: Object.keys(eventsByTopic)
      });
      
      // Create producer records for each topic
      const records: ProducerRecord[] = Object.entries(eventsByTopic).map(([topic, items]) => {
        return {
          topic,
          messages: items.map(({ event, key, messageId }) => {
            // Add timestamp and correlationId if not present
            const eventWithMetadata = {
              ...event,
              timestamp: event.timestamp || new Date().toISOString(),
              correlationId: event.correlationId || messageId
            };
            
            // Create headers
            const headers = {
              ...options.headers,
              'message-id': messageId,
              'batch-id': batchId,
              'content-type': 'application/json',
              ...traceContext
            };
            
            return {
              key: key ? Buffer.from(key) : null,
              value: Buffer.from(JSON.stringify(eventWithMetadata)),
              headers: Object.entries(headers).reduce((acc, [key, value]) => {
                acc[key] = Buffer.from(String(value));
                return acc;
              }, {})
            };
          })
        };
      });
      
      // Send all records in a transaction
      const results: RecordMetadata[] = [];
      
      // Start a transaction if we have multiple topics
      if (records.length > 1 && this.producer.isTransactional) {
        await this.producer.transaction();
      }
      
      try {
        // Send each record
        for (const record of records) {
          const result = await this.producer.send({
            ...record,
            acks: options.requireAcks !== false ? -1 : 0 // -1 = all brokers must acknowledge (default)
          });
          
          results.push(...result);
        }
        
        // Commit the transaction if we started one
        if (records.length > 1 && this.producer.isTransactional) {
          await this.producer.commitTransaction();
        }
        
        this.logger.log('Successfully produced batch of messages to Kafka', {
          batchId,
          messageCount: events.length,
          topics: Object.keys(eventsByTopic)
        });
        
        // End the trace span with success
        span.end();
        
        return results;
      } catch (error) {
        // Abort the transaction if we started one
        if (records.length > 1 && this.producer.isTransactional) {
          await this.producer.abortTransaction();
        }
        
        throw error;
      }
    } catch (error) {
      // Log the error
      this.logger.error('Failed to produce batch of messages to Kafka', {
        batchId,
        messageCount: events.length,
        topics: Object.keys(eventsByTopic),
        error: error.message,
        stack: error.stack,
        retryCount
      });
      
      // End the trace span with error
      span.end(error);
      
      // Retry logic for retriable errors
      const maxRetries = this.options.maxRetries || 5;
      const isRetriable = (
        error.name === 'KafkaJSConnectionError' ||
        error.name === 'KafkaJSRequestTimeoutError' ||
        error.name === 'KafkaJSBrokerNotFound' ||
        error.retriable === true
      );
      
      if (isRetriable && retryCount < maxRetries) {
        const nextRetryCount = retryCount + 1;
        const backoffTime = Math.min(100 * Math.pow(2, nextRetryCount), 10000); // Exponential backoff with max 10s
        
        this.logger.log(`Retrying batch production after ${backoffTime}ms (attempt ${nextRetryCount}/${maxRetries})`, {
          batchId,
          messageCount: events.length,
          topics: Object.keys(eventsByTopic),
          retryCount: nextRetryCount
        });
        
        // Wait for backoff time
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Retry the produce operation
        return this.produceBatch(events, options, nextRetryCount);
      }
      
      // If we've exhausted retries or the error is not retriable, rethrow
      throw error;
    }
  }
  
  /**
   * Check if the producer is connected to Kafka
   * @returns True if connected, false otherwise
   */
  isProducerConnected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Produce an event processing result to Kafka
   * @param userId User ID associated with the result
   * @param result The event processing result
   * @param correlationId Correlation ID for tracing
   * @returns Promise resolving to the record metadata if successful
   */
  async produceResult(
    userId: string,
    result: EventProcessingResult,
    correlationId?: string
  ): Promise<RecordMetadata[]> {
    // Create the event from the result
    const event: GamificationEvent = {
      type: EventType.EVENT_PROCESSED,
      userId,
      data: result,
      timestamp: new Date().toISOString(),
      correlationId: correlationId || uuidv4()
    };
    
    // Produce the event to the gamification events topic
    return this.produce(event, {
      topic: 'gamification.events',
      requireAcks: true,
      headers: {
        'correlation-id': event.correlationId,
        'event-type': EventType.EVENT_PROCESSED
      }
    });
  }
  
  /**
   * Check the health of the Kafka connection
   * @returns Object with health status and details
   */
  async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy', details?: string }> {
    if (!this.isConnected) {
      return { status: 'unhealthy', details: 'Not connected to Kafka' };
    }
    
    try {
      // Try to send a test message to the producer's admin topic
      const testTopic = `${this.options.clientId}.health-check`;
      const testMessage = {
        type: 'HEALTH_CHECK',
        userId: 'system',
        data: { timestamp: new Date().toISOString() }
      };
      
      // Use a short timeout for health checks
      const healthCheckTimeout = 5000; // 5 seconds
      
      // Create a promise that times out
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timed out')), healthCheckTimeout);
      });
      
      // Create a promise for the produce operation
      const producePromise = this.producer.send({
        topic: testTopic,
        messages: [{
          key: Buffer.from('health-check'),
          value: Buffer.from(JSON.stringify(testMessage))
        }],
        acks: 1 // Only require leader acknowledgment for health checks
      });
      
      // Race the produce operation against the timeout
      await Promise.race([producePromise, timeoutPromise]);
      
      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: `Kafka health check failed: ${error.message}` 
      };
    }
  }
}