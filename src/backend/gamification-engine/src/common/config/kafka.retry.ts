import { Logger } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka, Producer, RecordMetadata } from 'kafkajs';
import { kafkaConfig, RetryStrategyConfig, calculateBackoffDelay, shouldRetryMessage } from './kafka.config';
import { DeadLetterQueueHandler } from './kafka.dlq';

/**
 * Interface for retry message metadata
 */
export interface RetryMessageMetadata {
  /** Original topic the message was from */
  originalTopic: string;
  /** Current retry attempt (1-based) */
  retryAttempt: number;
  /** Timestamp when the retry was scheduled */
  retryTimestamp: number;
  /** Error message that caused the retry */
  errorMessage: string;
  /** Service that processed the message */
  serviceName: string;
}

/**
 * Class for handling message retry operations with exponential backoff
 */
export class RetryHandler {
  private readonly logger = new Logger(RetryHandler.name);
  private producer: Producer;
  private consumer: Consumer;
  private dlqHandler: DeadLetterQueueHandler;
  private readonly serviceName: string;
  private readonly retryTopicPrefix = 'retry';
  private readonly retryConfig: RetryStrategyConfig;
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Creates a new RetryHandler instance
   * 
   * @param kafka Kafka client instance
   * @param serviceName Name of the service using this handler
   */
  constructor(private readonly kafka: Kafka, serviceName?: string) {
    this.serviceName = serviceName || kafkaConfig().clientId;
    this.producer = this.kafka.producer(kafkaConfig().producer);
    this.consumer = this.kafka.consumer({
      ...kafkaConfig().consumer,
      groupId: `${this.serviceName}-retry-consumer`,
    });
    this.dlqHandler = new DeadLetterQueueHandler(kafka, serviceName);
    this.retryConfig = kafkaConfig().errorHandling.retryStrategy;
  }
  
  /**
   * Initializes the retry handler by connecting the producer and consumer
   */
  async init(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      await this.dlqHandler.init();
      this.logger.log('Retry handler initialized');
    } catch (error) {
      this.logger.error('Failed to initialize retry handler', error);
      throw error;
    }
  }
  
  /**
   * Creates a retry topic name for a source topic and retry attempt
   * 
   * @param sourceTopic The source topic name
   * @param attempt The retry attempt (1-based)
   * @returns The retry topic name
   */
  private createRetryTopicName(sourceTopic: string, attempt: number): string {
    return `${this.retryTopicPrefix}.${sourceTopic}.${attempt}`;
  }
  
  /**
   * Schedules a message for retry with exponential backoff
   * 
   * @param messagePayload The original message payload
   * @param error The error that occurred
   * @param attempt The current retry attempt (1-based)
   * @returns Promise resolving to the record metadata or null if sent to DLQ
   */
  async scheduleRetry(
    messagePayload: EachMessagePayload,
    error: Error,
    attempt: number = 1,
  ): Promise<RecordMetadata[] | null> {
    const { topic, partition, message } = messagePayload;
    
    // Check if we should retry or send to DLQ
    if (!shouldRetryMessage(attempt, error, this.retryConfig)) {
      this.logger.warn(
        `Maximum retry attempts (${this.retryConfig.maxRetries}) reached or non-retriable error. Sending to DLQ.`,
        { topic, partition, error: error.message, attempt },
      );
      
      return this.dlqHandler.sendToDLQ(
        topic,
        message,
        error,
        attempt,
        partition,
        message.offset,
      );
    }
    
    // Calculate backoff delay for this attempt
    const delay = calculateBackoffDelay(attempt, this.retryConfig);
    const retryTopic = this.createRetryTopicName(topic, attempt);
    
    // Create metadata to include with the retry message
    const metadata: RetryMessageMetadata = {
      originalTopic: topic,
      retryAttempt: attempt,
      retryTimestamp: Date.now(),
      errorMessage: error.message,
      serviceName: this.serviceName,
    };
    
    // Add metadata as headers
    const headers = {
      ...message.headers,
      'retry-metadata': Buffer.from(JSON.stringify(metadata)),
      'retry-original-topic': Buffer.from(topic),
      'retry-attempt': Buffer.from(attempt.toString()),
      'retry-timestamp': Buffer.from(Date.now().toString()),
      'retry-error-message': Buffer.from(error.message),
    };
    
    this.logger.log(
      `Scheduling retry ${attempt}/${this.retryConfig.maxRetries} for message after ${delay}ms`,
      { topic, partition, error: error.message },
    );
    
    // Use setTimeout to implement the backoff delay
    return new Promise((resolve, reject) => {
      const timerId = setTimeout(async () => {
        try {
          const result = await this.producer.send({
            topic: retryTopic,
            messages: [
              {
                key: message.key,
                value: message.value,
                headers,
                timestamp: message.timestamp,
              },
            ],
          });
          
          this.logger.log(`Retry message sent to ${retryTopic}`);
          this.retryTimers.delete(message.offset.toString());
          resolve(result);
        } catch (retryError) {
          this.logger.error(`Failed to send retry message to ${retryTopic}`, retryError);
          this.retryTimers.delete(message.offset.toString());
          reject(retryError);
        }
      }, delay);
      
      // Store the timer so we can clear it if needed
      this.retryTimers.set(message.offset.toString(), timerId);
    });
  }
  
  /**
   * Extracts retry metadata from a message
   * 
   * @param message Message to extract metadata from
   * @returns Retry metadata or null if not found
   */
  extractRetryMetadata(message: any): RetryMessageMetadata | null {
    if (!message.headers || !message.headers['retry-metadata']) {
      return null;
    }
    
    try {
      const metadataBuffer = message.headers['retry-metadata'] as Buffer;
      return JSON.parse(metadataBuffer.toString()) as RetryMessageMetadata;
    } catch (error) {
      this.logger.error('Failed to parse retry metadata', error);
      return null;
    }
  }
  
  /**
   * Subscribes to retry topics for a list of source topics
   * 
   * @param topics List of source topics to subscribe to retries for
   * @param messageHandler Handler function for retry messages
   */
  async subscribeToRetryTopics(
    topics: string[],
    messageHandler: (payload: EachMessagePayload) => Promise<void>,
  ): Promise<void> {
    // Create retry topic patterns for all attempts
    const retryTopicPatterns = [];
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      for (const topic of topics) {
        retryTopicPatterns.push(this.createRetryTopicName(topic, attempt));
      }
    }
    
    // Subscribe to all retry topics
    for (const retryTopic of retryTopicPatterns) {
      await this.consumer.subscribe({ topic: retryTopic });
    }
    
    // Start consuming retry messages
    await this.consumer.run({
      eachMessage: async (payload) => {
        try {
          // Extract retry metadata
          const metadata = this.extractRetryMetadata(payload.message);
          if (!metadata) {
            this.logger.error('Received retry message without metadata', {
              topic: payload.topic,
              partition: payload.partition,
              offset: payload.message.offset,
            });
            return;
          }
          
          this.logger.log(
            `Processing retry message (attempt ${metadata.retryAttempt})`,
            { originalTopic: metadata.originalTopic },
          );
          
          // Process the message with the provided handler
          await messageHandler({
            ...payload,
            // Override topic with original topic for proper processing
            topic: metadata.originalTopic,
          });
        } catch (error) {
          // Extract retry metadata to determine the next attempt
          const metadata = this.extractRetryMetadata(payload.message);
          if (!metadata) {
            this.logger.error('Failed to process retry message and could not extract metadata', error);
            return;
          }
          
          // Schedule the next retry or send to DLQ
          await this.scheduleRetry(
            {
              ...payload,
              // Use the original topic for proper retry tracking
              topic: metadata.originalTopic,
            },
            error as Error,
            metadata.retryAttempt + 1,
          );
        }
      },
    });
  }
  
  /**
   * Closes the retry handler by disconnecting the producer and consumer
   */
  async close(): Promise<void> {
    // Clear any pending retry timers
    for (const timerId of this.retryTimers.values()) {
      clearTimeout(timerId);
    }
    this.retryTimers.clear();
    
    try {
      await this.consumer.disconnect();
      await this.producer.disconnect();
      await this.dlqHandler.close();
      this.logger.log('Retry handler closed');
    } catch (error) {
      this.logger.error('Failed to close retry handler', error);
    }
  }
}