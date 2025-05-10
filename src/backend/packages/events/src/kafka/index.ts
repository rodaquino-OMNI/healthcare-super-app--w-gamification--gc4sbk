/**
 * @module Kafka
 * 
 * This module provides a comprehensive Kafka integration for the AUSTA SuperApp,
 * enabling event-driven architecture across all journey services and the gamification engine.
 * 
 * It includes:
 * - A configurable NestJS module for dependency injection
 * - Producer and consumer services with standardized error handling
 * - Type definitions and interfaces for consistent event schemas
 * - Configuration utilities and constants for consistent settings
 * 
 * @example
 * // Import and register the module in your NestJS application
 * import { KafkaModule } from '@austa/events/kafka';
 * 
 * @Module({
 *   imports: [
 *     KafkaModule.register({
 *       clientId: 'my-service',
 *       brokers: ['localhost:9092'],
 *       groupId: 'my-consumer-group'
 *     })
 *   ]
 * })
 * export class AppModule {}
 */

// Module exports
export { KafkaModule } from './kafka.module';

// Service exports
export { KafkaService } from './kafka.service';
export { KafkaProducer } from './kafka.producer';
export { KafkaConsumer } from './kafka.consumer';

// Configuration exports
export { createKafkaConfig, validateKafkaConfig } from './kafka.config';

// Type exports
export * from './kafka.types';
export * from './kafka.interfaces';

// Error exports
export * from './kafka.errors';

// Constants exports
export * from './kafka.constants';