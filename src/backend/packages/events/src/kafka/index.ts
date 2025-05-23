/**
 * @file Kafka Module Barrel Export
 * @description Centralized export point for all Kafka-related components.
 * This file enables simplified imports via @austa/events/kafka and provides
 * a clean, consistent API for consumers across the application.
 */

/**
 * Core Module
 * @module KafkaModule
 */
export { KafkaModule } from './kafka.module';

/**
 * Services
 * @module KafkaServices
 */
export { KafkaService } from './kafka.service';
export { KafkaProducer } from './kafka.producer';
export { KafkaConsumer } from './kafka.consumer';

/**
 * Interfaces
 * @module KafkaInterfaces
 */
export * from './kafka.interfaces';

/**
 * Types
 * @module KafkaTypes
 */
export * from './kafka.types';

/**
 * Constants
 * @module KafkaConstants
 */
export * from './kafka.constants';

/**
 * Configuration
 * @module KafkaConfig
 */
export * from './kafka.config';

/**
 * Error Handling
 * @module KafkaErrors
 */
export * from './kafka.errors';