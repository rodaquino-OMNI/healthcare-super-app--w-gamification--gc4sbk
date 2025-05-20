/**
 * Kafka module for the AUSTA SuperApp.
 * 
 * This module provides services and utilities for event-driven communication
 * between microservices using Apache Kafka.
 * 
 * @module kafka
 */

// Export the main module and service
export * from './kafka.module';
export * from './kafka.service';

// Re-export interfaces and types
export * from '../interfaces/kafka-message.interface';
export * from '../interfaces/kafka-options.interface';

// Re-export errors
export * from '../errors/kafka.errors';

// Re-export constants
export * from '../constants/topics.constants';
export * from '../constants/errors.constants';
export * from '../constants/tokens.constants';

// Re-export schema registry
export * from '../schema/schema-registry.service';

// Re-export DTOs
export * from '../dto/event-metadata.dto';