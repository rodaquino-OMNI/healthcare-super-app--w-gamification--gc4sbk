import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import { KafkaConfig, ConsumerConfig, ProducerConfig } from 'kafkajs';
import { GamificationEvent } from '@austa/interfaces/gamification';

/**
 * Configuration options for the Kafka module
 */
export interface KafkaModuleOptions {
  /**
   * KafkaJS client configuration
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
   * Consumer group ID
   */
  consumerGroupId?: string;
  
  /**
   * Topics to subscribe to
   */
  topics?: string[];
  
  /**
   * Dead letter queue configuration
   */
  dlq?: {
    enabled: boolean;
    topics?: Record<string, string>;
  };
  
  /**
   * Retry configuration
   */
  retry?: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
    jitterFactor: number;
  };
}

/**
 * Factory function for creating Kafka module options
 */
export type KafkaModuleOptionsFactory = {
  createKafkaOptions(): Promise<KafkaModuleOptions> | KafkaModuleOptions;
};

/**
 * Async options for the Kafka module
 */
export interface KafkaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * List of providers to be registered in the module
   */
  providers?: Provider[];
  
  /**
   * Factory function for creating Kafka module options
   */
  useFactory?: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
  
  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];
  
  /**
   * Class to use for creating Kafka module options
   */
  useClass?: Type<KafkaModuleOptionsFactory>;
  
  /**
   * Existing provider to use for creating Kafka module options
   */
  useExisting?: Type<KafkaModuleOptionsFactory>;
}

/**
 * Kafka message with headers and value
 */
export interface KafkaMessage<T = any> {
  /**
   * Message headers
   */
  headers?: Record<string, string>;
  
  /**
   * Message key
   */
  key?: string;
  
  /**
   * Message value
   */
  value: T;
  
  /**
   * Message timestamp
   */
  timestamp?: string;
  
  /**
   * Message partition
   */
  partition?: number;
  
  /**
   * Message offset
   */
  offset?: string;
}

/**
 * Kafka message handler function
 */
export type KafkaMessageHandler<T = GamificationEvent> = (
  message: KafkaMessage<T>,
  topic: string,
  partition: number,
) => Promise<void>;

/**
 * Error handler function for Kafka operations
 */
export type KafkaErrorHandler = (
  error: Error,
  topic?: string,
  partition?: number,
  offset?: string,
) => Promise<boolean>;

/**
 * Retry decision for failed Kafka operations
 */
export enum RetryDecision {
  RETRY = 'RETRY',
  FAIL = 'FAIL',
  IGNORE = 'IGNORE',
}

/**
 * Context for retry decisions
 */
export interface RetryContext {
  /**
   * Error that occurred
   */
  error: Error;
  
  /**
   * Topic where the error occurred
   */
  topic?: string;
  
  /**
   * Partition where the error occurred
   */
  partition?: number;
  
  /**
   * Offset where the error occurred
   */
  offset?: string;
  
  /**
   * Number of retry attempts so far
   */
  retryCount: number;
  
  /**
   * Original message that failed
   */
  originalMessage?: KafkaMessage;
}