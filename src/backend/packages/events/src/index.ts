/**
 * @austa/events
 * 
 * This package provides a standardized event processing system for the AUSTA SuperApp,
 * enabling consistent event-driven communication between services across all journeys.
 * It includes interfaces, DTOs, Kafka utilities, error handling, and versioning support
 * for building robust event-driven architectures.
 *
 * @packageDocumentation
 */

/**
 * Re-export all event interfaces
 * 
 * These interfaces define the contract for all event types in the system,
 * ensuring consistent event structure and type safety across services.
 */
export * from './interfaces';

/**
 * Re-export all event DTOs
 * 
 * These Data Transfer Objects provide validation and serialization for events,
 * ensuring data integrity and consistency across services.
 */
export * from './dto';

/**
 * Re-export all Kafka-related utilities
 * 
 * These utilities provide a consistent interface for interacting with Kafka,
 * including producers, consumers, and message handling.
 */
export * from './kafka';

/**
 * Re-export all versioning utilities
 * 
 * These utilities support event schema evolution with backward compatibility,
 * enabling services to process events from different versions.
 */
export * from './versioning/types';
export * from './versioning/errors';

/**
 * Re-export all error handling utilities
 * 
 * These utilities provide consistent error handling for event processing,
 * including retry policies, dead letter queues, and error classification.
 */
export * from './errors';

/**
 * Re-export all constants
 * 
 * These constants define standard values used throughout the event system,
 * ensuring consistency across services.
 */
export * from './constants';

// Export specific utility functions with more descriptive names

/**
 * Event validation utilities
 * 
 * These utilities provide validation for event payloads against defined schemas,
 * ensuring data integrity and preventing invalid events from being processed.
 */
export { 
  default as validateEvent,
  validateJourneyEvent,
  validateHealthEvent,
  validateCareEvent,
  validatePlanEvent,
  createEventValidator,
  createJourneyValidator,
  validateEventBatch,
  isValidEvent,
  getValidationErrors,
  formatValidationErrors,
  formatZodError,
  clearValidationCache,
  getValidationCacheStats,
  applyJourneyValidation,
  ValidationResult,
  ValidationError,
  ValidationOptions,
  JourneyValidationContext
} from './utils/event-validator';

/**
 * Event serialization utilities
 * 
 * These utilities provide standardized serialization and deserialization for events,
 * ensuring consistent formatting across services.
 */
export { 
  serialize as serializeEvent,
  deserialize as deserializeEvent,
} from './utils/event-serializer';

/**
 * Journey context utilities
 * 
 * These utilities manage journey-specific context within events, ensuring proper
 * routing and processing based on the journey (health, care, plan).
 */
export {
  JourneyType,
  isValidJourney,
  JourneyContext,
  JourneyContextError,
  createJourneyContext,
  validateJourneyContext,
  extractJourneyContext,
  addJourneyContext,
  isJourneyEvent,
  isHealthJourneyEvent,
  isCareJourneyEvent,
  isPlanJourneyEvent,
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  ensureJourneyContext,
  routeEventByJourney,
  createCrossJourneyEvent,
  isCrossJourneyEvent,
  getCrossJourneyContexts
} from './utils/journey-context';

/**
 * Event tracing utilities
 * 
 * These utilities provide integration with OpenTelemetry for distributed tracing
 * of events across services.
 */
export {
  createEventSpan,
  injectTraceContext,
  extractTraceContext,
} from './utils/event-tracing';

/**
 * Correlation ID utilities
 * 
 * These utilities manage correlation IDs for tracking related events across services,
 * enabling end-to-end tracing of event flows.
 */
export {
  generateCorrelationId,
  extractCorrelationId,
  withCorrelationId,
} from './utils/correlation-id';

/**
 * Retry utilities
 * 
 * These utilities provide retry mechanisms for failed event processing,
 * implementing exponential backoff and circuit breaker patterns.
 */
export {
  createRetryPolicy,
  withRetry,
  isRetryableError,
} from './utils/retry-utils';

/**
 * Schema utilities
 * 
 * These utilities manage event schemas, including registration, retrieval, and versioning.
 */
export {
  registerSchema,
  getSchema,
  validateAgainstSchema,
} from './utils/schema-utils';

/**
 * Secure event utilities
 * 
 * These utilities provide security features for event payloads, including sanitization
 * and validation to prevent data leakage or injection attacks.
 */
export {
  sanitizeEventPayload,
  validateEventSource,
  applySecurityPolicy,
} from './utils/secure-event';

/**
 * Payload transformation utilities
 * 
 * These utilities transform event payloads between different formats or versions,
 * supporting schema evolution and backward compatibility.
 */
export {
  transformPayload,
  migratePayload,
  createTransformer,
} from './utils/payload-transformer';

/**
 * Type conversion utilities
 * 
 * These utilities provide safe type conversion for event data,
 * ensuring consistent handling of different data types.
 */
export {
  safeParseInt,
  safeParseFloat,
  safeParseBoolean,
  safeParseDate,
} from './utils/type-converters';