/**
 * @file kafka.interfaces.ts
 * @description Defines interfaces for Kafka operations, including consumer, producer, message handler, and configuration interfaces.
 * These interfaces provide contracts for implementation and enable dependency injection with proper typing.
 */

import { ModuleMetadata, Type } from '@nestjs/common';
import { Admin, Consumer, ConsumerConfig, ConsumerSubscribeTopics, Kafka, KafkaConfig, Producer, ProducerConfig, ProducerRecord, RecordMetadata } from 'kafkajs';
import { Observable } from 'rxjs';

/**
 * Configuration options for the Kafka module
 */
export interface KafkaModuleOptions {
  /**
   * Client configuration for the Kafka connection
   */
  client: KafkaConfig;
  
  /**
   * Consumer configuration
   */
  consumer?: ConsumerConfig;
  
  /**
   * Producer configuration
   */
  producer?: ProducerConfig;
  
  /**
   * Whether to enable health checks for Kafka connections
   * @default true
   */
  enableHealthCheck?: boolean;
  
  /**
   * Service name to use for logging and metrics
   */
  serviceName?: string;
}

/**
 * Async options for the Kafka module
 */
export interface KafkaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Injection token to use for the Kafka module options
   */
  useExisting?: Type<KafkaOptionsFactory>;
  
  /**
   * Factory class to use for creating Kafka module options
   */
  useClass?: Type<KafkaOptionsFactory>;
  
  /**
   * Factory function to use for creating Kafka module options
   */
  useFactory?: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
  
  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];
}

/**
 * Factory interface for creating Kafka module options
 */
export interface KafkaOptionsFactory {
  /**
   * Creates Kafka module options
   */
  createKafkaOptions(): Promise<KafkaModuleOptions> | KafkaModuleOptions;
}

/**
 * Interface for Kafka client service
 */
export interface IKafkaService {
  /**
   * Gets the underlying KafkaJS client instance
   */
  getClient(): Kafka;
  
  /**
   * Gets the producer instance
   */
  getProducer(): Producer;
  
  /**
   * Gets the consumer instance
   */
  getConsumer(): Consumer;
  
  /**
   * Gets the admin instance
   */
  getAdmin(): Admin;
  
  /**
   * Connects the producer
   */
  connectProducer(): Promise<void>;
  
  /**
   * Disconnects the producer
   */
  disconnectProducer(): Promise<void>;
  
  /**
   * Sends a message to a Kafka topic
   * @param record The record to send
   */
  send(record: ProducerRecord): Promise<RecordMetadata[]>;
  
  /**
   * Subscribes to a Kafka topic
   * @param topics The topics to subscribe to
   * @param groupId The consumer group ID
   * @param callback The callback to invoke for each message
   */
  consume(topics: ConsumerSubscribeTopics, groupId: string, callback: KafkaMessageHandler): Promise<void>;
}

/**
 * Interface for Kafka producer service
 */
export interface IKafkaProducer {
  /**
   * Connects the producer
   */
  connect(): Promise<void>;
  
  /**
   * Disconnects the producer
   */
  disconnect(): Promise<void>;
  
  /**
   * Sends a message to a Kafka topic
   * @param topic The topic to send to
   * @param messages The messages to send
   * @param key Optional message key
   * @param headers Optional message headers
   */
  send<T>(topic: string, messages: T | T[], key?: string, headers?: Record<string, string>): Promise<RecordMetadata[]>;
  
  /**
   * Sends a message to a Kafka topic with transaction support
   * @param topic The topic to send to
   * @param messages The messages to send
   * @param transactionId The transaction ID
   * @param key Optional message key
   * @param headers Optional message headers
   */
  sendWithTransaction<T>(topic: string, messages: T | T[], transactionId: string, key?: string, headers?: Record<string, string>): Promise<RecordMetadata[]>;
  
  /**
   * Checks if the producer is connected
   */
  isConnected(): boolean;
}

/**
 * Interface for Kafka consumer service
 */
export interface IKafkaConsumer {
  /**
   * Connects the consumer
   */
  connect(): Promise<void>;
  
  /**
   * Disconnects the consumer
   */
  disconnect(): Promise<void>;
  
  /**
   * Subscribes to a Kafka topic
   * @param topics The topics to subscribe to
   * @param fromBeginning Whether to consume from the beginning of the topic
   */
  subscribe(topics: string | string[], fromBeginning?: boolean): Promise<void>;
  
  /**
   * Starts consuming messages from subscribed topics
   * @param handler The handler to invoke for each message
   */
  consume(handler: KafkaMessageHandler): Promise<void>;
  
  /**
   * Pauses consumption from specified topics
   * @param topics The topics to pause
   */
  pause(topics: string[]): void;
  
  /**
   * Resumes consumption from specified topics
   * @param topics The topics to resume
   */
  resume(topics: string[]): void;
  
  /**
   * Seeks to a specific offset
   * @param topic The topic to seek in
   * @param partition The partition to seek in
   * @param offset The offset to seek to
   */
  seek(topic: string, partition: number, offset: number): Promise<void>;
  
  /**
   * Commits offsets
   */
  commitOffsets(): Promise<void>;
  
  /**
   * Checks if the consumer is connected
   */
  isConnected(): boolean;
}

/**
 * Interface for Kafka message
 */
export interface KafkaMessage<T = any> {
  /**
   * The topic the message was received from
   */
  topic: string;
  
  /**
   * The partition the message was received from
   */
  partition: number;
  
  /**
   * The message offset
   */
  offset: string;
  
  /**
   * The message key, if any
   */
  key?: string;
  
  /**
   * The message value
   */
  value: T;
  
  /**
   * The message headers, if any
   */
  headers?: Record<string, string>;
  
  /**
   * The message timestamp
   */
  timestamp: string;
}

/**
 * Type for Kafka message handler function
 */
export type KafkaMessageHandler = (message: KafkaMessage) => Promise<void> | void;

/**
 * Interface for Kafka message batch
 */
export interface KafkaMessageBatch<T = any> {
  /**
   * The topic the batch was received from
   */
  topic: string;
  
  /**
   * The partition the batch was received from
   */
  partition: number;
  
  /**
   * The messages in the batch
   */
  messages: KafkaMessage<T>[];
}

/**
 * Type for Kafka batch message handler function
 */
export type KafkaBatchMessageHandler = (batch: KafkaMessageBatch) => Promise<void> | void;

/**
 * Interface for Kafka event
 */
export interface KafkaEvent<T = any> {
  /**
   * The event type
   */
  type: string;
  
  /**
   * The user ID associated with the event
   */
  userId: string;
  
  /**
   * The event data
   */
  data: T;
  
  /**
   * The event timestamp
   */
  timestamp?: string;
  
  /**
   * The event version
   */
  version?: string;
  
  /**
   * The event source
   */
  source?: string;
  
  /**
   * The event journey context
   */
  journey?: 'health' | 'care' | 'plan';
  
  /**
   * Additional event metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for Kafka event handler
 */
export interface IKafkaEventHandler<T = any> {
  /**
   * Handles a Kafka event
   * @param event The event to handle
   */
  handle(event: KafkaEvent<T>): Promise<void>;
  
  /**
   * Gets the event types this handler can process
   */
  getEventTypes(): string[];
}

/**
 * Interface for Kafka event processor
 */
export interface IKafkaEventProcessor {
  /**
   * Processes a Kafka event
   * @param event The event to process
   */
  processEvent<T>(event: KafkaEvent<T>): Promise<void>;
  
  /**
   * Registers an event handler
   * @param handler The handler to register
   */
  registerHandler(handler: IKafkaEventHandler): void;
  
  /**
   * Gets all registered event handlers
   */
  getHandlers(): Map<string, IKafkaEventHandler[]>;
}

/**
 * Interface for Kafka event publisher
 */
export interface IKafkaEventPublisher {
  /**
   * Publishes an event to a Kafka topic
   * @param topic The topic to publish to
   * @param event The event to publish
   */
  publish<T>(topic: string, event: KafkaEvent<T>): Promise<RecordMetadata[]>;
  
  /**
   * Publishes multiple events to a Kafka topic
   * @param topic The topic to publish to
   * @param events The events to publish
   */
  publishBatch<T>(topic: string, events: KafkaEvent<T>[]): Promise<RecordMetadata[]>;
  
  /**
   * Publishes an event to a journey-specific topic
   * @param journey The journey to publish to
   * @param event The event to publish
   */
  publishToJourney<T>(journey: 'health' | 'care' | 'plan', event: KafkaEvent<T>): Promise<RecordMetadata[]>;
}

/**
 * Interface for Kafka health indicator
 */
export interface IKafkaHealthIndicator {
  /**
   * Checks the health of the Kafka connection
   * @param key The key to use for the health check
   */
  checkHealth(key: string): Promise<Record<string, any>>;
  
  /**
   * Checks if the Kafka connection is healthy
   */
  isHealthy(): Promise<boolean>;
}

/**
 * Interface for Kafka retry policy
 */
export interface IKafkaRetryPolicy {
  /**
   * Gets the retry delay for a given attempt
   * @param attempt The current attempt number
   */
  getDelay(attempt: number): number;
  
  /**
   * Checks if a retry should be attempted
   * @param attempt The current attempt number
   * @param error The error that occurred
   */
  shouldRetry(attempt: number, error: Error): boolean;
  
  /**
   * Gets the maximum number of retry attempts
   */
  getMaxAttempts(): number;
}

/**
 * Interface for Kafka dead letter queue
 */
export interface IKafkaDeadLetterQueue {
  /**
   * Sends a failed message to the dead letter queue
   * @param message The failed message
   * @param error The error that occurred
   * @param topic The original topic
   */
  sendToDeadLetterQueue<T>(message: KafkaMessage<T>, error: Error, topic: string): Promise<void>;
  
  /**
   * Processes messages from the dead letter queue
   * @param handler The handler to process messages with
   */
  processDeadLetterQueue(handler: KafkaMessageHandler): Promise<void>;
}

/**
 * Interface for Kafka circuit breaker
 */
export interface IKafkaCircuitBreaker {
  /**
   * Executes a function with circuit breaker protection
   * @param fn The function to execute
   */
  execute<T>(fn: () => Promise<T>): Promise<T>;
  
  /**
   * Gets the current state of the circuit breaker
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  
  /**
   * Resets the circuit breaker to closed state
   */
  reset(): void;
}

/**
 * Interface for Kafka observability
 */
export interface IKafkaObservability {
  /**
   * Records a metric
   * @param name The metric name
   * @param value The metric value
   * @param tags The metric tags
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  
  /**
   * Starts a timer
   * @param name The timer name
   * @param tags The timer tags
   */
  startTimer(name: string, tags?: Record<string, string>): () => void;
  
  /**
   * Records an error
   * @param error The error to record
   * @param context The error context
   */
  recordError(error: Error, context?: Record<string, any>): void;
  
  /**
   * Creates a span for distributed tracing
   * @param name The span name
   * @param context The span context
   */
  createSpan(name: string, context?: Record<string, any>): Observable<any>;
}