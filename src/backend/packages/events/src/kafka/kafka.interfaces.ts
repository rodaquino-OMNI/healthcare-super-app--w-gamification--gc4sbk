/**
 * Interfaces for Kafka integration.
 */

import { ConsumerConfig, ConsumerRunConfig, ProducerConfig, RetryOptions } from 'kafkajs';

/**
 * Configuration for Kafka client.
 */
export interface IKafkaConfig {
  clientId: string;
  brokers: string[];
  ssl?: boolean;
  sasl?: {
    mechanism: string;
    username: string;
    password: string;
  };
  retry?: RetryOptions;
  connectionTimeout?: number;
  requestTimeout?: number;
  logLevel?: number;
}

/**
 * Result of message validation.
 */
export interface IValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Configuration for dead letter queue.
 */
export interface IKafkaDeadLetterQueueConfig {
  enabled?: boolean;
  topic?: string;
  retryTopic?: string;
  retryEnabled?: boolean;
  maxRetries?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
}

/**
 * Options for Kafka producer.
 */
export interface IKafkaProducerOptions {
  producerId?: string;
  producerConfig?: ProducerConfig;
  serializer?: (message: any) => Buffer;
  validator?: (message: any) => Promise<IValidationResult> | IValidationResult;
  acks?: number;
  timeout?: number;
}

/**
 * Options for Kafka consumer.
 */
export interface IKafkaConsumerOptions {
  deserializer?: (buffer: Buffer) => any;
  validator?: (message: any) => Promise<IValidationResult> | IValidationResult;
  deadLetterQueue?: IKafkaDeadLetterQueueConfig;
  retry?: RetryOptions;
  sessionTimeout?: number;
  heartbeatInterval?: number;
  maxWaitTimeInMs?: number;
  maxBytes?: number;
  fromBeginning?: boolean;
  consumerRunConfig?: ConsumerRunConfig;
  throwOriginalError?: boolean;
}

/**
 * Interface for Kafka message handler.
 */
export interface IKafkaMessageHandler {
  handle(message: any, key?: string, headers?: Record<string, string>): Promise<void>;
  canHandle(topic: string, message: any): boolean;
}

/**
 * Interface for Kafka retry handler.
 */
export interface IKafkaRetryHandler {
  handleRetry(message: any, retryCount: number, originalTopic: string, key?: string, headers?: Record<string, string>): Promise<void>;
  canHandleRetry(topic: string, message: any): boolean;
}

/**
 * Interface for Kafka dead letter queue handler.
 */
export interface IKafkaDeadLetterQueueHandler {
  handleDeadLetter(message: any, error: any, metadata: any): Promise<void>;
  canHandleDeadLetter(topic: string, message: any): boolean;
}

/**
 * Interface for Kafka batch producer.
 */
export interface IKafkaBatchProducer {
  produceBatch(topic: string, messages: Array<{ value: any; key?: string; headers?: Record<string, string> }>, options?: IKafkaProducerOptions): Promise<void>;
}

/**
 * Interface for Kafka service.
 */
export interface IKafkaService {
  produce(topic: string, message: any, key?: string, headers?: Record<string, string>, options?: IKafkaProducerOptions): Promise<void>;
  produceBatch(topic: string, messages: Array<{ value: any; key?: string; headers?: Record<string, string> }>, options?: IKafkaProducerOptions): Promise<void>;
  consume(topic: string, groupId: string | undefined, callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>, options?: IKafkaConsumerOptions): Promise<void>;
  consumeRetry(originalTopic: string, groupId: string | undefined, callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>, options?: IKafkaConsumerOptions): Promise<void>;
  consumeDeadLetterQueue(originalTopic: string, groupId: string | undefined, callback: (message: any, error: any, metadata: any) => Promise<void>, options?: IKafkaConsumerOptions): Promise<void>;
  sendToDeadLetterQueue(originalTopic: string, message: any, error: Error, metadata?: Record<string, any>, config?: IKafkaDeadLetterQueueConfig): Promise<void>;
}