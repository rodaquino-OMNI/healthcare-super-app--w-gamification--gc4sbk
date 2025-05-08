/**
 * @file Kafka Module Exports
 * @description Centralized exports for all Kafka-related components in the gamification engine.
 * This module provides a unified entry point for importing Kafka utilities, reducing import
 * statements and ensuring consistent usage patterns across the codebase.
 */

/**
 * Core Kafka Module
 * @module KafkaModule
 * @description NestJS module that registers all Kafka-related services and providers.
 * Configurable using the factory pattern for flexible configuration options.
 */
export { KafkaModule } from './kafka.module';

/**
 * Type Definitions
 * @description TypeScript interfaces and types for Kafka operations.
 */
export * from './kafka.types';

/**
 * Base Consumer
 * @class BaseConsumer
 * @description Abstract base class for Kafka consumers with automatic topic subscription,
 * error handling, retry attempts, and dead letter queue routing.
 */
export { BaseConsumer } from './base-consumer.abstract';

/**
 * Base Producer
 * @class BaseProducer
 * @description Abstract base class for Kafka producers with message serialization,
 * topic routing, and delivery acknowledgment.
 */
export { BaseProducer } from './base-producer.abstract';

/**
 * Event Handler Interface
 * @interface EventHandler
 * @description Interface contract for Kafka event handlers with methods for
 * message validation, processing, and error handling.
 */
export { EventHandler } from './event-handler.interface';

/**
 * Error Handling
 * @module KafkaErrorHandler
 * @description Utilities for standardized error handling in Kafka operations.
 */
export {
  KafkaErrorHandler,
  createKafkaErrorHandler,
  createDefaultRetryStrategy,
  createDefaultErrorHandler,
  KafkaErrorHandlerOptions,
  KafkaErrorContext,
} from './error-handler';

/**
 * Message Serialization
 * @module MessageSerializer
 * @description Utilities for serializing and deserializing Kafka messages with type safety.
 */
export {
  MessageSerializer,
  SerializationOptions,
} from './message-serializer';

/**
 * Retry Strategies
 * @module RetryStrategy
 * @description Configurable retry strategies for Kafka consumers, including
 * exponential backoff with jitter.
 */
export {
  RetryStrategyService,
  createRetryStrategyService,
  createExponentialBackoffStrategy,
  createLinearBackoffStrategy,
  createFixedDelayStrategy,
  createJourneyAwareRetryStrategy,
  createErrorTypeAwareRetryStrategy,
  defaultRetryStrategy,
  RetryStrategyOptions,
  RetryContext,
  RetryResult
} from './retry.strategy';

/**
 * Dead Letter Queue
 * @module DLQService
 * @description Service for managing dead letter queues for failed Kafka message processing.
 */
export { DLQService } from './dlq.service';

/**
 * Convenience re-exports of common types from @austa/interfaces
 * @description Type definitions for event schemas shared across the application.
 */
export {
  GamificationEvent,
  HealthJourneyEvent,
  CareJourneyEvent,
  PlanJourneyEvent,
  EventType,
  EventStatus,
  EventPriority,
} from '@austa/interfaces/gamification';