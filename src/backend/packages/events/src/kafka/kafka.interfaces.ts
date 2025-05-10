import { Consumer, Producer } from 'kafkajs';
import { KafkaMessage, KafkaMessageMetadata, KafkaConsumerConfig, KafkaProducerConfig, KafkaMessageBatch } from './kafka.types';

/**
 * Interface for the Kafka service that manages Kafka connections and operations.
 */
export interface KafkaServiceInterface {
  /**
   * Sends a message to a Kafka topic.
   * 
   * @param topic - The Kafka topic to send the message to
   * @param message - The message object to be serialized and sent
   * @param key - Optional message key for partitioning
   * @param headers - Optional message headers
   * @param options - Optional producer options
   */
  produce(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>,
    options?: { schemaId?: number, validateSchema?: boolean }
  ): Promise<void>;

  /**
   * Sends multiple messages to a Kafka topic in a batch operation.
   * 
   * @param topic - The Kafka topic to send the messages to
   * @param messages - Array of messages with optional keys and headers
   * @param options - Optional producer options
   */
  produceBatch(
    topic: string,
    messages: Array<{ value: any, key?: string, headers?: Record<string, string> }>,
    options?: { schemaId?: number, validateSchema?: boolean }
  ): Promise<void>;

  /**
   * Subscribes to a Kafka topic and processes messages.
   * 
   * @param topic - The Kafka topic to subscribe to
   * @param groupId - The consumer group ID
   * @param callback - The function to process each message
   * @param options - Optional consumer configuration
   */
  consume(
    topic: string,
    groupId: string,
    callback: (message: KafkaMessage, metadata: KafkaMessageMetadata) => Promise<void>,
    options?: {
      fromBeginning?: boolean,
      autoCommit?: boolean,
      schemaId?: number,
      validateSchema?: boolean
    }
  ): Promise<void>;

  /**
   * Disconnects a specific consumer by group ID and topic.
   * 
   * @param groupId - The consumer group ID
   * @param topic - The topic the consumer is subscribed to
   */
  disconnectConsumer(groupId: string, topic: string): Promise<void>;
}

/**
 * Interface for a Kafka producer service that handles message production.
 */
export interface KafkaProducerInterface {
  /**
   * Sends a message to a Kafka topic.
   * 
   * @param topic - The Kafka topic to send the message to
   * @param message - The message object to be serialized and sent
   * @param key - Optional message key for partitioning
   * @param headers - Optional message headers
   * @param options - Optional producer configuration
   */
  send(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>,
    options?: KafkaProducerConfig
  ): Promise<void>;

  /**
   * Sends multiple messages to a Kafka topic in a batch operation.
   * 
   * @param batch - Batch of messages to send
   */
  sendBatch(batch: KafkaMessageBatch): Promise<void>;

  /**
   * Sends multiple batches of messages to different Kafka topics.
   * 
   * @param batches - Array of message batches to send
   */
  sendMultipleBatches(batches: KafkaMessageBatch[]): Promise<void>;

  /**
   * Sends a message to a Kafka topic with transaction support.
   * 
   * @param topic - The Kafka topic to send the message to
   * @param message - The message object to be serialized and sent
   * @param key - Optional message key for partitioning
   * @param headers - Optional message headers
   * @param options - Optional producer configuration
   */
  sendWithTransaction(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>,
    options?: KafkaProducerConfig
  ): Promise<void>;
}

/**
 * Interface for a Kafka consumer service that handles message consumption.
 */
export interface KafkaConsumerInterface {
  /**
   * Subscribes to a Kafka topic and processes messages.
   * 
   * @param topic - The Kafka topic to subscribe to
   * @param callback - The function to process each message
   * @param options - Optional consumer configuration
   */
  subscribe(
    topic: string,
    callback: (message: KafkaMessage, metadata: KafkaMessageMetadata) => Promise<void>,
    options?: KafkaConsumerConfig
  ): Promise<void>;

  /**
   * Subscribes to multiple Kafka topics and processes messages.
   * 
   * @param topics - Array of Kafka topics to subscribe to
   * @param callback - The function to process each message
   * @param options - Optional consumer configuration
   */
  subscribeToMultipleTopics(
    topics: string[],
    callback: (message: KafkaMessage, metadata: KafkaMessageMetadata) => Promise<void>,
    options?: KafkaConsumerConfig
  ): Promise<void>;

  /**
   * Pauses consumption from a specific topic.
   * 
   * @param topic - The Kafka topic to pause consumption from
   */
  pause(topic: string): Promise<void>;

  /**
   * Resumes consumption from a specific topic.
   * 
   * @param topic - The Kafka topic to resume consumption from
   */
  resume(topic: string): Promise<void>;

  /**
   * Disconnects the consumer and stops all subscriptions.
   */
  disconnect(): Promise<void>;
}

/**
 * Interface for a message handler that processes Kafka messages.
 */
export interface KafkaMessageHandlerInterface {
  /**
   * Processes a Kafka message.
   * 
   * @param message - The message to process
   * @param metadata - Metadata associated with the message
   */
  handle(message: KafkaMessage, metadata: KafkaMessageMetadata): Promise<void>;

  /**
   * Gets the topic this handler is responsible for.
   */
  getTopic(): string;

  /**
   * Gets the consumer group ID for this handler.
   */
  getGroupId(): string;

  /**
   * Gets consumer configuration for this handler.
   */
  getConsumerConfig(): KafkaConsumerConfig;
}

/**
 * Interface for a schema validator that validates messages against schemas.
 */
export interface SchemaValidatorInterface {
  /**
   * Validates a message against a schema.
   * 
   * @param message - The message to validate
   * @param schemaId - ID of the schema to validate against
   * @param options - Optional validation options
   */
  validate(message: any, schemaId: number, options?: any): Promise<boolean>;

  /**
   * Registers a schema with the schema registry.
   * 
   * @param schema - The schema to register
   * @param subject - The subject to register the schema under
   * @param options - Optional registration options
   */
  registerSchema(schema: any, subject: string, options?: any): Promise<number>;

  /**
   * Gets a schema by ID from the schema registry.
   * 
   * @param schemaId - ID of the schema to retrieve
   */
  getSchema(schemaId: number): Promise<any>;
}