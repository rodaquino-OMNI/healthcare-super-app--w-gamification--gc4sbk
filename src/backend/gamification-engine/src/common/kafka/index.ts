/**
 * @file Kafka Integration Module
 * @description Centralized exports for all Kafka-related components in the gamification engine.
 * Provides a unified API for Kafka operations, ensuring consistent usage patterns across the codebase.
 * Integrates with @austa/interfaces for type-safe event schemas and implements robust error handling
 * with dead letter queues and exponential backoff retry strategies.
 *
 * This module is part of the standardized event architecture that processes events from all journeys
 * (Health, Care, Plan) to drive the gamification engine. It ensures reliable message delivery with
 * proper error handling, retry mechanisms, and observability.
 *
 * @version 1.0.0
 * @package @austa/gamification-engine
 */

// -------------------------------------------------------------------------
// Core Module
// -------------------------------------------------------------------------

/**
 * NestJS module that registers all Kafka-related services and providers.
 * Configures Kafka using the factory pattern for flexible configuration options.
 * Imports necessary dependencies like LoggerModule and TracingModule.
 * 
 * @example
 * // Import and register the module in your application
 * import { Module } from '@nestjs/common';
 * import { KafkaModule } from '@austa/gamification-engine/common/kafka';
 * 
 * @Module({
 *   imports: [
 *     KafkaModule.forRoot({
 *       clientId: 'gamification-engine',
 *       brokers: ['kafka:9092'],
 *       groupId: 'gamification-group'
 *     })
 *   ]
 * })
 * export class AppModule {}
 */
export { KafkaModule } from './kafka.module';

// -------------------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------------------

/**
 * Comprehensive TypeScript interfaces and types for Kafka operations.
 * Includes definitions for messages, headers, configuration options,
 * consumer/producer options, and callback signatures.
 * Integrates with @austa/interfaces for standardized event schemas.
 * 
 * @example
 * // Import and use types in your application
 * import { KafkaMessage, KafkaHeaders, KafkaConfig } from '@austa/gamification-engine/common/kafka';
 * import { HealthMetricEvent } from '@austa/interfaces/journey/health';
 * 
 * // Type-safe event handling
 * function processMessage(message: KafkaMessage<HealthMetricEvent>) {
 *   // Process the message with type safety
 * }
 */
export * from './kafka.types';

// -------------------------------------------------------------------------
// Base Classes
// -------------------------------------------------------------------------

/**
 * Abstract base class for Kafka consumers that implements the OnModuleInit lifecycle hook.
 * Provides automatic topic subscription, error handling with configurable retry attempts,
 * and dead letter queue routing for persistently failed messages.
 * Implements exponential backoff retry mechanism and correlation ID tracking.
 * 
 * @example
 * // Extend the base consumer in your application
 * import { Injectable } from '@nestjs/common';
 * import { BaseConsumer } from '@austa/gamification-engine/common/kafka';
 * import { HealthMetricEvent } from '@austa/interfaces/journey/health';
 * 
 * @Injectable()
 * export class HealthMetricConsumer extends BaseConsumer<HealthMetricEvent> {
 *   constructor() {
 *     super({
 *       topic: 'health.metrics',
 *       groupId: 'gamification-health-metrics',
 *       maxRetries: 3
 *     });
 *   }
 * 
 *   async processMessage(message: HealthMetricEvent): Promise<void> {
 *     // Process the health metric event
 *   }
 * }
 */
export { BaseConsumer } from './base-consumer.abstract';

/**
 * Abstract base class for Kafka producers that handles message serialization,
 * topic routing, and delivery acknowledgment. Implements at-least-once delivery
 * semantics with configurable retry attempts. Provides hooks for message
 * transformation and validation before sending.
 * 
 * @example
 * // Extend the base producer in your application
 * import { Injectable } from '@nestjs/common';
 * import { BaseProducer } from '@austa/gamification-engine/common/kafka';
 * import { AchievementEvent } from '@austa/interfaces/gamification';
 * 
 * @Injectable()
 * export class AchievementProducer extends BaseProducer<AchievementEvent> {
 *   constructor() {
 *     super({
 *       topic: 'gamification.achievements',
 *       acks: -1, // Wait for all replicas
 *       retries: 5
 *     });
 *   }
 * 
 *   async publishAchievement(achievement: AchievementEvent): Promise<void> {
 *     await this.send(achievement);
 *   }
 * }
 */
export { BaseProducer } from './base-producer.abstract';

// -------------------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------------------

/**
 * Interface contract for Kafka event handlers in the gamification engine.
 * Specifies required methods for message validation, processing, and error handling.
 * Ensures all event handlers follow consistent patterns and can be used
 * interchangeably with the base consumer.
 * 
 * @example
 * // Implement the event handler interface in your application
 * import { Injectable } from '@nestjs/common';
 * import { EventHandler } from '@austa/gamification-engine/common/kafka';
 * import { HealthMetricEvent } from '@austa/interfaces/journey/health';
 * 
 * @Injectable()
 * export class HealthMetricHandler implements EventHandler<HealthMetricEvent> {
 *   async validate(event: HealthMetricEvent): Promise<boolean> {
 *     return event.userId && event.metricType && event.value !== undefined;
 *   }
 * 
 *   async process(event: HealthMetricEvent): Promise<void> {
 *     // Process the health metric event
 *   }
 * 
 *   async handleError(error: Error, event: HealthMetricEvent): Promise<boolean> {
 *     // Handle error and return true if the message should be retried
 *     return false;
 *   }
 * }
 */
export { EventHandler } from './event-handler.interface';

// -------------------------------------------------------------------------
// Services
// -------------------------------------------------------------------------

/**
 * Service that manages dead letter queues for failed Kafka message processing.
 * Routes messages that have exhausted their retry attempts to specialized DLQ topics.
 * Preserves the original message with error context and provides methods for
 * message inspection and replay during recovery operations.
 * 
 * @example
 * // Use the DLQ service in your application
 * import { Injectable } from '@nestjs/common';
 * import { DLQService } from '@austa/gamification-engine/common/kafka';
 * 
 * @Injectable()
 * export class MessageRecoveryService {
 *   constructor(private readonly dlqService: DLQService) {}
 * 
 *   async recoverFailedMessages(topic: string): Promise<number> {
 *     return this.dlqService.replayMessages(topic);
 *   }
 * 
 *   async inspectFailedMessage(messageId: string): Promise<any> {
 *     return this.dlqService.getMessageDetails(messageId);
 *   }
 * }
 */
export { DLQService } from './dlq.service';

// -------------------------------------------------------------------------
// Utilities
// -------------------------------------------------------------------------

/**
 * Standardized error handling for Kafka operations.
 * Classifies errors into retriable vs. terminal categories,
 * manages retry decision logic, logs detailed error context,
 * and ensures proper correlation ID propagation for distributed tracing.
 * 
 * @example
 * // Use the error handler in your application
 * import { handleKafkaError } from '@austa/gamification-engine/common/kafka';
 * import { Logger } from '@nestjs/common';
 * 
 * const logger = new Logger('KafkaConsumer');
 * 
 * try {
 *   // Kafka operation
 * } catch (error) {
 *   const { isRetriable, errorContext } = handleKafkaError(error, {
 *     topic: 'health.metrics',
 *     correlationId: 'abc-123',
 *     attempt: 1
 *   });
 *   
 *   logger.error(`Kafka error: ${errorContext.message}`, errorContext);
 *   
 *   if (isRetriable) {
 *     // Retry the operation
 *   }
 * }
 */
export { handleKafkaError } from './error-handler';

/**
 * Configurable retry strategies for Kafka consumers, including exponential backoff with jitter.
 * Provides a robust mechanism for retrying failed message processing with increasing delays
 * between attempts, preventing system overload during recovery.
 * 
 * @example
 * // Create and use a retry strategy in your application
 * import { RetryStrategy, createExponentialBackoffStrategy } from '@austa/gamification-engine/common/kafka';
 * 
 * const retryStrategy = createExponentialBackoffStrategy({
 *   initialDelayMs: 100,
 *   maxDelayMs: 10000,
 *   maxRetries: 5,
 *   jitterFactor: 0.2
 * });
 * 
 * // Get delay for the current retry attempt
 * const delayMs = retryStrategy.getDelayForAttempt(2); // Returns delay for the 2nd retry
 */
export { RetryStrategy, createExponentialBackoffStrategy } from './retry.strategy';

/**
 * Utilities for serializing and deserializing Kafka messages with type safety.
 * Handles JSON transformation, schema validation against @austa/interfaces types,
 * and preserves message metadata across the wire.
 * 
 * @example
 * // Use serialization utilities in your application
 * import {
 *   serializeMessage,
 *   deserializeMessage,
 *   validateMessageSchema
 * } from '@austa/gamification-engine/common/kafka';
 * import { HealthMetricEvent } from '@austa/interfaces/journey/health';
 * 
 * // Serialize a message
 * const rawMessage = serializeMessage<HealthMetricEvent>({
 *   userId: '123',
 *   metricType: 'steps',
 *   value: 10000,
 *   timestamp: new Date().toISOString()
 * }, {
 *   correlationId: 'abc-123',
 *   journeyType: 'health'
 * });
 * 
 * // Deserialize a message
 * const { payload, headers } = deserializeMessage<HealthMetricEvent>(rawMessage);
 * 
 * // Validate message against schema
 * const isValid = validateMessageSchema<HealthMetricEvent>(payload, 'HealthMetricEvent');
 */
export { 
  serializeMessage, 
  deserializeMessage,
  validateMessageSchema 
} from './message-serializer';