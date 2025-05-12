/**
 * @austa/events
 * 
 * This package provides a standardized event processing system for the AUSTA SuperApp,
 * enabling consistent event-driven communication between services across all journeys.
 * It includes utilities for event validation, serialization, Kafka integration, error handling,
 * and versioning to ensure reliable event processing throughout the application.
 *
 * The package is organized into several key areas:
 * - Core event interfaces and types for type-safe event handling
 * - Data Transfer Objects (DTOs) for event validation and structure
 * - Kafka integration for reliable event production and consumption
 * - Error handling utilities with retry mechanisms and dead letter queues
 * - Versioning support for backward compatibility as schemas evolve
 * - Utility functions for common event processing tasks
 *
 * @example
 * // Producing an event
 * import { KafkaProducer, HealthMetricEvent, EventTypes } from '@austa/events';
 * 
 * const producer = new KafkaProducer();
 * await producer.produce({
 *   type: EventTypes.HEALTH.METRIC_RECORDED,
 *   userId: '123',
 *   data: {
 *     metricType: 'WEIGHT',
 *     value: 75.5,
 *     unit: 'kg',
 *     timestamp: new Date().toISOString()
 *   }
 * });
 *
 * @example
 * // Consuming an event
 * import { KafkaConsumer, EventHandler } from '@austa/events';
 * 
 * class MetricEventHandler implements EventHandler<HealthMetricEvent> {
 *   async handle(event: HealthMetricEvent): Promise<EventResponse> {
 *     // Process the event
 *     return { success: true };
 *   }
 * }
 *
 * @packageDocumentation
 */

/**
 * Core event interfaces that define the structure and behavior of events
 * throughout the AUSTA SuperApp. These interfaces provide type safety and
 * consistent event handling across all services.
 * 
 * @example
 * import { IBaseEvent, IJourneyEvent } from '@austa/events';
 * 
 * function processEvent(event: IBaseEvent) {
 *   // Process any event type
 * }
 * 
 * function processHealthEvent(event: IJourneyEvent<'health'>) {
 *   // Process only health journey events
 * }
 */
export * from './interfaces';

/**
 * Data Transfer Objects (DTOs) for event validation and structure.
 * These classes provide runtime validation using class-validator decorators
 * and ensure that events conform to their expected structure before processing.
 * 
 * @example
 * import { BaseEventDto, HealthMetricEventDto } from '@austa/events';
 * 
 * const event = new HealthMetricEventDto();
 * event.userId = '123';
 * event.data = {
 *   metricType: 'WEIGHT',
 *   value: 75.5,
 *   unit: 'kg'
 * };
 * 
 * // Validate the event
 * const errors = await validate(event);
 * if (errors.length > 0) {
 *   // Handle validation errors
 * }
 */
export * from './dto';

/**
 * Kafka integration for reliable event production and consumption.
 * These utilities provide a consistent interface for working with Kafka
 * across all services, with support for error handling, retries, and
 * dead letter queues.
 * 
 * @example
 * import { KafkaModule, KafkaProducer } from '@austa/events';
 * 
 * // In your module
 * @Module({
 *   imports: [
 *     KafkaModule.forRoot({
 *       clientId: 'my-service',
 *       brokers: ['kafka:9092']
 *     })
 *   ]
 * })
 * export class AppModule {}
 * 
 * // In your service
 * @Injectable()
 * export class EventService {
 *   constructor(private producer: KafkaProducer) {}
 * 
 *   async sendEvent(event: IBaseEvent) {
 *     return this.producer.produce(event);
 *   }
 * }
 */
export * from './kafka';

/**
 * Error handling utilities for event processing, including custom error classes,
 * retry policies, and dead letter queue integration. These utilities ensure
 * consistent error handling across all services and provide robust recovery
 * mechanisms for transient failures.
 * 
 * @example
 * import { EventError, RetryPolicy, DLQ } from '@austa/events';
 * 
 * try {
 *   // Process event
 * } catch (error) {
 *   if (error instanceof EventError) {
 *     if (RetryPolicy.shouldRetry(error)) {
 *       // Retry the operation
 *     } else {
 *       // Send to dead letter queue
 *       await DLQ.sendToDeadLetterQueue(event, error);
 *     }
 *   }
 * }
 */
export * from './errors';

/**
 * Versioning utilities for event schema evolution, including version detection,
 * compatibility checking, and transformation between versions. These utilities
 * ensure backward compatibility as event schemas evolve over time.
 * 
 * @example
 * import { VersionDetector, CompatibilityChecker, Transformer } from '@austa/events';
 * 
 * // Detect the version of an event
 * const version = VersionDetector.detectVersion(event);
 * 
 * // Check if the event is compatible with the current version
 * if (CompatibilityChecker.isCompatible(version, currentVersion)) {
 *   // Process the event
 * } else {
 *   // Transform the event to the current version
 *   const transformedEvent = Transformer.transform(event, currentVersion);
 *   // Process the transformed event
 * }
 */
export * from './versioning';

/**
 * Constants used throughout the event processing system, including event types,
 * error codes, topic names, and configuration defaults. These constants ensure
 * consistent naming and behavior across all services.
 * 
 * @example
 * import { EventTypes, ErrorCodes, Topics } from '@austa/events';
 * 
 * // Use event type constants
 * const eventType = EventTypes.HEALTH.METRIC_RECORDED;
 * 
 * // Use topic constants
 * const topic = Topics.HEALTH_EVENTS;
 * 
 * // Use error code constants
 * const errorCode = ErrorCodes.VALIDATION_ERROR;
 */
export * from './constants';

/**
 * Utility functions for common event processing tasks, including correlation ID
 * management, event serialization, tracing, validation, and more. These utilities
 * provide consistent behavior across all services and simplify common operations.
 */

/**
 * Correlation ID utilities for distributed tracing of events across services.
 * These utilities enable end-to-end visibility of event flows and help with
 * debugging and monitoring.
 * 
 * @example
 * import { correlationId } from '@austa/events';
 * 
 * // Generate a new correlation ID
 * const id = correlationId.generate();
 * 
 * // Extract correlation ID from an event
 * const id = correlationId.extract(event);
 * 
 * // Add correlation ID to an event
 * const eventWithCorrelation = correlationId.add(event, id);
 */
export * from './utils/correlation-id';

/**
 * Event serialization utilities for converting events between different formats,
 * including JSON, binary, and custom formats. These utilities ensure consistent
 * serialization across all services.
 * 
 * @example
 * import { eventSerializer } from '@austa/events';
 * 
 * // Serialize an event to JSON
 * const json = eventSerializer.toJson(event);
 * 
 * // Deserialize an event from JSON
 * const event = eventSerializer.fromJson(json);
 */
export * from './utils/event-serializer';

/**
 * Event tracing utilities for distributed tracing of events across services.
 * These utilities integrate with OpenTelemetry to provide end-to-end visibility
 * of event flows.
 * 
 * @example
 * import { eventTracing } from '@austa/events';
 * 
 * // Create a span for event processing
 * const span = eventTracing.createSpan('process-event');
 * 
 * // Add event details to the span
 * eventTracing.addEventToSpan(span, event);
 * 
 * // End the span
 * span.end();
 */
export * from './utils/event-tracing';

/**
 * Event validation utilities for validating events against schemas and business rules.
 * These utilities ensure that events conform to their expected structure before processing.
 * 
 * @example
 * import { eventValidator } from '@austa/events';
 * 
 * // Validate an event against its schema
 * const result = await eventValidator.validate(event);
 * if (!result.valid) {
 *   // Handle validation errors
 *   console.error(result.errors);
 * }
 */
export * from './utils/event-validator';

/**
 * Journey context utilities for managing journey-specific context within events.
 * These utilities ensure that events contain and preserve the necessary journey
 * information throughout the processing pipeline.
 * 
 * @example
 * import { journeyContext } from '@austa/events';
 * 
 * // Get the journey from an event
 * const journey = journeyContext.getJourney(event);
 * 
 * // Add journey context to an event
 * const eventWithContext = journeyContext.addContext(event, 'health');
 */
export * from './utils/journey-context';

/**
 * Payload transformation utilities for converting event payloads between different
 * formats, structures, or versions. These utilities enable schema evolution while
 * maintaining backward compatibility.
 * 
 * @example
 * import { payloadTransformer } from '@austa/events';
 * 
 * // Transform a payload from one version to another
 * const transformedPayload = payloadTransformer.transform(
 *   payload,
 *   '1.0.0',
 *   '2.0.0'
 * );
 */
export * from './utils/payload-transformer';

/**
 * Retry utilities for implementing resilient event processing with retry mechanisms.
 * These utilities help services recover from transient failures during event processing.
 * 
 * @example
 * import { retryUtils } from '@austa/events';
 * 
 * // Retry an operation with exponential backoff
 * const result = await retryUtils.withRetry(
 *   () => processEvent(event),
 *   {
 *     maxRetries: 3,
 *     backoff: 'exponential',
 *     initialDelay: 100
 *   }
 * );
 */
export * from './utils/retry-utils';

/**
 * Schema utilities for working with event schemas, including schema registration,
 * retrieval, and versioning. These utilities manage the schema registry for all
 * event types and support schema evolution.
 * 
 * @example
 * import { schemaUtils } from '@austa/events';
 * 
 * // Register a schema
 * schemaUtils.registerSchema('health.metric.recorded', '1.0.0', schema);
 * 
 * // Get a schema
 * const schema = schemaUtils.getSchema('health.metric.recorded', '1.0.0');
 * 
 * // Validate an event against its schema
 * const valid = schemaUtils.validate(event, schema);
 */
export * from './utils/schema-utils';

/**
 * Security utilities for event payloads, ensuring that sensitive data is properly
 * handled and protected. These utilities help prevent data leakage and injection
 * attacks through the event system.
 * 
 * @example
 * import { secureEvent } from '@austa/events';
 * 
 * // Sanitize an event payload
 * const sanitizedEvent = secureEvent.sanitize(event);
 * 
 * // Validate event source
 * const valid = secureEvent.validateSource(event, allowedSources);
 */
export * from './utils/secure-event';

/**
 * Type conversion utilities for safely handling different data types in events.
 * These utilities ensure that data conversions are performed consistently across
 * all services, preventing type-related errors during event processing.
 * 
 * @example
 * import { typeConverters } from '@austa/events';
 * 
 * // Convert a string to a number
 * const num = typeConverters.toNumber('123');
 * 
 * // Convert a string to a date
 * const date = typeConverters.toDate('2023-01-01T00:00:00Z');
 * 
 * // Convert a value to a boolean
 * const bool = typeConverters.toBoolean('true');
 */
export * from './utils/type-converters';

// Type exports for improved TypeScript integration

/**
 * Re-export specific types for better TypeScript integration and documentation.
 * These explicit type exports make it easier for consumers to import specific
 * types without having to know the internal file structure.
 */
export type {
  // Base event types
  IBaseEvent,
  IJourneyEvent,
  IEventHandler,
  IEventResponse,
  IVersionedEvent,
  IEventValidator,
  IValidationResult,
  IKafkaEvent,
} from './interfaces';

export type {
  // Journey-specific event types
  HealthMetricEvent,
  HealthGoalEvent,
  AppointmentEvent,
  MedicationEvent,
  ClaimEvent,
  BenefitEvent,
} from './dto';

export type {
  // Kafka types
  KafkaConfig,
  KafkaMessage,
  KafkaProducerOptions,
  KafkaConsumerOptions,
} from './kafka';

export type {
  // Error and retry types
  RetryOptions,
  RetryResult,
  DLQOptions,
} from './errors';

export type {
  // Versioning types
  VersionInfo,
  CompatibilityResult,
  TransformOptions,
  MigrationPath,
} from './versioning';