/**
 * @file Kafka Module Barrel Export
 * @description Centralized export point for all Kafka-related components in the events package.
 * This file enables simplified imports via @austa/events/kafka and provides a clean,
 * consistent API for consumers across the application.
 */

/**
 * Module exports
 * @module Kafka/Module
 */
export { KafkaModule } from './kafka.module';

/**
 * Service exports
 * @module Kafka/Services
 */
export { KafkaService } from './kafka.service';
export { KafkaConsumer } from './kafka.consumer';
export { KafkaProducer } from './kafka.producer';

/**
 * Interface exports
 * @module Kafka/Interfaces
 */
export * from './kafka.interfaces';

/**
 * Type exports
 * @module Kafka/Types
 */
export * from './kafka.types';

/**
 * Constant exports
 * @module Kafka/Constants
 */
export * from './kafka.constants';

/**
 * Configuration exports
 * @module Kafka/Config
 */
export * from './kafka.config';

/**
 * Error exports
 * @module Kafka/Errors
 */
export * from './kafka.errors';