/**
 * @austa/events
 * 
 * This package provides a comprehensive set of utilities, interfaces, and components
 * for standardized event processing across all AUSTA SuperApp services. It enables
 * consistent event handling, validation, and communication between services while
 * ensuring type safety and proper error handling.
 * 
 * The package is organized into several modules:
 * - Interfaces: Type definitions for events, handlers, and responses
 * - DTOs: Data Transfer Objects for event validation and serialization
 * - Kafka: Utilities for Kafka integration (producers, consumers, etc.)
 * - Errors: Error handling utilities and custom error classes
 * - Utils: Utility functions for event processing
 * - Constants: Constants used throughout the event system
 * - Versioning: Utilities for event versioning and schema evolution
 * 
 * @packageDocumentation
 */

// Re-export all components from their respective modules

/**
 * Core interfaces for event processing
 * 
 * These interfaces define the contract for events, handlers, and responses
 * throughout the AUSTA SuperApp. They ensure consistent event structure
 * and processing across all services.
 */
export * from './src/interfaces';

/**
 * Data Transfer Objects for event validation and serialization
 * 
 * These DTOs provide runtime validation for events using class-validator
 * and ensure consistent event structure across all services. They include
 * specialized DTOs for each journey (Health, Care, Plan) and cross-cutting
 * concerns.
 */
export * from './src/dto';

/**
 * Kafka integration utilities
 * 
 * These components provide a standardized way to interact with Kafka for
 * event production and consumption. They include producers, consumers,
 * serializers, and configuration utilities.
 */
export * from './src/kafka';

/**
 * Error handling utilities and custom error classes
 * 
 * These components provide specialized error handling for event processing,
 * including retry policies, dead letter queues, and custom error classes.
 */
export * from './src/errors';

/**
 * Utility functions for event processing
 * 
 * These utilities provide common functionality for event processing, including
 * validation, transformation, correlation, and tracing.
 */
export * from './src/utils/correlation-id';
export * from './src/utils/event-serializer';
export * from './src/utils/event-tracing';
export * from './src/utils/event-validator';
export * from './src/utils/journey-context';
export * from './src/utils/payload-transformer';
export * from './src/utils/retry-utils';
export * from './src/utils/schema-utils';
export * from './src/utils/secure-event';
export * from './src/utils/type-converters';

/**
 * Constants used throughout the event system
 * 
 * These constants provide standardized values for event types, topics,
 * error codes, and configuration settings.
 */
export * from './src/constants';

/**
 * Versioning utilities for event schema evolution
 * 
 * These utilities provide support for versioned event schemas, enabling
 * backward compatibility and graceful schema evolution.
 */
export * from './src/versioning';

// Type exports for improved developer experience

/**
 * Event types for type-safe event handling
 * 
 * These type exports provide a convenient way to access common event types
 * without having to import from specific modules.
 */
export type {
  // Base event types
  BaseEvent,
  EventMetadata,
  EventPayload,
  EventResponse,
  EventHandler,
  EventValidator,
  
  // Journey-specific event types
  HealthEvent,
  CareEvent,
  PlanEvent,
  
  // Kafka-specific types
  KafkaEvent,
  KafkaMessage,
  KafkaHeaders,
  
  // Versioning types
  VersionedEvent,
  EventVersion,
  VersioningStrategy,
} from './src/interfaces';

/**
 * Event DTOs for validation and serialization
 * 
 * These type exports provide a convenient way to access common event DTOs
 * without having to import from specific modules.
 */
export type {
  // Base event DTOs
  BaseEventDto,
  EventMetadataDto,
  
  // Journey-specific event DTOs
  HealthEventDto,
  HealthMetricEventDto,
  HealthGoalEventDto,
  
  CareEventDto,
  AppointmentEventDto,
  MedicationEventDto,
  
  PlanEventDto,
  ClaimEventDto,
  BenefitEventDto,
} from './src/dto';

/**
 * Event constants for standardized values
 * 
 * These constant exports provide a convenient way to access common event constants
 * without having to import from specific modules.
 */
export {
  EventTypes,
  Topics,
  ErrorCodes,
  Headers,
} from './src/constants';