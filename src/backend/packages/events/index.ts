/**
 * @austa/events
 * 
 * This package provides a standardized event processing system for the AUSTA SuperApp,
 * enabling consistent event handling across all services and journeys. It includes
 * producers, consumers, DTOs, validation utilities, and error handling mechanisms.
 * 
 * @packageDocumentation
 */

// Re-export all components from their respective modules

/**
 * Base event interfaces and types
 * @module interfaces
 */
export * from './src/interfaces';

/**
 * Data Transfer Objects for event validation and serialization
 * @module dto
 */
export * from './src/dto';

/**
 * Kafka integration for event production and consumption
 * @module kafka
 */
export * from './src/kafka';

/**
 * Error handling utilities and custom error classes
 * @module errors
 */
export * from './src/errors';

/**
 * Constants used throughout the event system
 * @module constants
 */
export * from './src/constants';

/**
 * Utility functions for event processing
 * @module utils
 */
export * from './src/utils/correlation-id';
export * from './src/utils/event-serializer';
export * from './src/utils/event-validator';
export * from './src/utils/event-tracing';
export * from './src/utils/journey-context';
export * from './src/utils/payload-transformer';
export * from './src/utils/retry-utils';
export * from './src/utils/schema-utils';
export * from './src/utils/secure-event';
export * from './src/utils/type-converters';

/**
 * Event versioning utilities for backward compatibility
 * @module versioning
 */
export * from './src/versioning';

// Export commonly used types directly for convenience

/**
 * Common event types used throughout the application
 * @module types
 */
export type {
  BaseEvent,
  EventMetadata,
  EventPayload,
  EventType,
  JourneyEvent,
  KafkaEvent,
  VersionedEvent,
} from './src/interfaces/base-event.interface';

export type {
  HealthEvent,
  HealthMetricEvent,
  HealthGoalEvent,
} from './src/interfaces/journey-events.interface';

export type {
  CareEvent,
  AppointmentEvent,
  MedicationEvent,
} from './src/interfaces/journey-events.interface';

export type {
  PlanEvent,
  ClaimEvent,
  BenefitEvent,
} from './src/interfaces/journey-events.interface';

export type {
  EventHandler,
  EventProcessor,
  EventResponse,
} from './src/interfaces/event-handler.interface';

export type {
  EventValidator,
  ValidationResult,
} from './src/interfaces/event-validation.interface';

export type {
  EventVersionStrategy,
  VersionMigration,
} from './src/interfaces/event-versioning.interface';

// Export commonly used constants directly for convenience

/**
 * Event type constants
 * @module constants
 */
export { EventTypes } from './src/dto/event-types.enum';
export { ErrorCodes } from './src/constants/errors.constants';
export { Topics } from './src/constants/topics.constants';
export { Headers } from './src/constants/headers.constants';

// Export commonly used classes directly for convenience

/**
 * Core event classes
 * @module core
 */
export { BaseEventDto } from './src/dto/base-event.dto';
export { KafkaService } from './src/kafka/kafka.service';
export { KafkaConsumer } from './src/kafka/kafka.consumer';
export { KafkaProducer } from './src/kafka/kafka.producer';
export { KafkaModule } from './src/kafka/kafka.module';
export { EventValidator } from './src/utils/event-validator';
export { EventSerializer } from './src/utils/event-serializer';
export { RetryPolicy } from './src/errors/retry-policies';
export { DeadLetterQueue } from './src/errors/dlq';
export { EventError } from './src/errors/event-errors';