import { Kafka, Producer, RecordMetadata, Message, CompressionTypes, TopicMessages } from 'kafkajs';
import { Logger } from '@nestjs/common';
import { kafkaConfig, createDeadLetterTopicName } from './kafka.config';

/**
 * Interface for Dead Letter Queue message metadata
 */
export interface DLQMessageMetadata {
  /** Original topic the message was from */
  originalTopic: string;
  /** Original partition the message was from */
  originalPartition: number;
  /** Original offset of the message */
  originalOffset: string;
  /** Timestamp when the message was sent to DLQ */
  dlqTimestamp: number;
  /** Error message that caused the message to be sent to DLQ */
  errorMessage: string;
  /** Error stack trace */
  errorStack?: string;
  /** Number of retry attempts made */
  retryCount: number;
  /** Service that processed the message */
  serviceName: string;
}

/**
 * Class for handling dead letter queue operations
 */
export class DeadLetterQueueHandler {
  private readonly logger = new Logger(DeadLetterQueueHandler.name);
  private producer: Producer;
  private readonly serviceName: string;
  
  /**
   * Creates a new DeadLetterQueueHandler instance
   * 
   * @param kafka Kafka client instance
   * @param serviceName Name of the service using this handler
   */
  constructor(private readonly kafka: Kafka, serviceName?: string) {
    this.serviceName = serviceName || kafkaConfig().clientId;
    this.producer = this.kafka.producer(kafkaConfig().producer);
  }
  
  /**
   * Initializes the DLQ handler by connecting the producer
   */
  async init(): Promise<void> {
    try {
      await this.producer.connect();
      this.logger.log('DLQ producer connected');
    } catch (error) {
      this.logger.error('Failed to connect DLQ producer', error);
      throw error;
    }
  }
  
  /**
   * Sends a message to the dead letter queue
   * 
   * @param topic Original topic the message was from
   * @param message Original message that failed processing
   * @param error Error that caused the message to be sent to DLQ
   * @param retryCount Number of retry attempts made
   * @param partition Original partition the message was from
   * @param offset Original offset of the message
   * @returns Promise resolving to the record metadata
   */
  async sendToDLQ(
    topic: string,
    message: Message,
    error: Error,
    retryCount: number,
    partition?: number,
    offset?: string,
  ): Promise<RecordMetadata[]> {
    const dlqTopic = createDeadLetterTopicName(topic);
    
    // Create metadata to include with the message
    const metadata: DLQMessageMetadata = {
      originalTopic: topic,
      originalPartition: partition || -1,
      originalOffset: offset || '-1',
      dlqTimestamp: Date.now(),
      errorMessage: error.message,
      errorStack: error.stack,
      retryCount,
      serviceName: this.serviceName,
    };
    
    // Add metadata as headers
    const headers = {
      ...message.headers,
      'dlq-metadata': Buffer.from(JSON.stringify(metadata)),
      'dlq-original-topic': Buffer.from(topic),
      'dlq-error-message': Buffer.from(error.message),
      'dlq-retry-count': Buffer.from(retryCount.toString()),
      'dlq-timestamp': Buffer.from(Date.now().toString()),
    };
    
    try {
      const result = await this.producer.send({
        topic: dlqTopic,
        compression: CompressionTypes.GZIP,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers,
            timestamp: message.timestamp,
          },
        ],
      });
      
      this.logger.log(`Message sent to DLQ ${dlqTopic}`);
      return result;
    } catch (dlqError) {
      this.logger.error(`Failed to send message to DLQ ${dlqTopic}`, dlqError);
      throw dlqError;
    }
  }
  
  /**
   * Sends multiple messages to the dead letter queue
   * 
   * @param topicMessages Array of topic messages to send to DLQ
   * @param error Error that caused the messages to be sent to DLQ
   * @returns Promise resolving to the record metadata
   */
  async sendBatchToDLQ(
    topicMessages: TopicMessages[],
    error: Error,
  ): Promise<RecordMetadata[]> {
    try {
      const dlqTopicMessages: TopicMessages[] = topicMessages.map(tm => {
        const dlqTopic = createDeadLetterTopicName(tm.topic);
        
        return {
          topic: dlqTopic,
          messages: tm.messages.map(message => {
            // Create metadata to include with the message
            const metadata: DLQMessageMetadata = {
              originalTopic: tm.topic,
              originalPartition: -1,
              originalOffset: '-1',
              dlqTimestamp: Date.now(),
              errorMessage: error.message,
              errorStack: error.stack,
              retryCount: 0, // We don't know the retry count for batch messages
              serviceName: this.serviceName,
            };
            
            // Add metadata as headers
            const headers = {
              ...message.headers,
              'dlq-metadata': Buffer.from(JSON.stringify(metadata)),
              'dlq-original-topic': Buffer.from(tm.topic),
              'dlq-error-message': Buffer.from(error.message),
              'dlq-timestamp': Buffer.from(Date.now().toString()),
            };
            
            return {
              key: message.key,
              value: message.value,
              headers,
              timestamp: message.timestamp,
            };
          }),
        };
      });
      
      const result = await this.producer.sendBatch({
        topicMessages: dlqTopicMessages,
        compression: CompressionTypes.GZIP,
      });
      
      this.logger.log(`Batch messages sent to DLQ`);
      return result;
    } catch (dlqError) {
      this.logger.error('Failed to send batch messages to DLQ', dlqError);
      throw dlqError;
    }
  }
  
  /**
   * Extracts DLQ metadata from a message
   * 
   * @param message Message to extract metadata from
   * @returns DLQ metadata or null if not found
   */
  extractDLQMetadata(message: Message): DLQMessageMetadata | null {
    if (!message.headers || !message.headers['dlq-metadata']) {
      return null;
    }
    
    try {
      const metadataBuffer = message.headers['dlq-metadata'] as Buffer;
      return JSON.parse(metadataBuffer.toString()) as DLQMessageMetadata;
    } catch (error) {
      this.logger.error('Failed to parse DLQ metadata', error);
      return null;
    }
  }
  
  /**
   * Closes the DLQ handler by disconnecting the producer
   */
  async close(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.logger.log('DLQ producer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect DLQ producer', error);
    }
  }
}