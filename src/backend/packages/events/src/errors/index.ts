/**
 * @file Error handling utilities and types for event processing
 * @module @austa/events/errors
 * @description Provides a comprehensive set of error handling utilities, types, and mechanisms
 * for event processing across all journeys. This module ensures consistent error handling,
 * retry policies, and dead letter queue (DLQ) integration for failed events.
 *
 * This module is part of the AUSTA SuperApp event processing architecture and provides
 * standardized error handling patterns for all event-driven communication. It supports the
 * journey-centered architecture by providing specialized error handling for each journey
 * context while maintaining a consistent approach to error management.
 *
 * @example
 * // Import specific error handling utilities
 * import { handleEventErrors, sendToDlq, isRetryableError } from '@austa/events/errors';
 *
 * // Use the decorator to add standardized error handling to an event handler
 * @handleEventErrors({ enableRetry: true, journeyContext: 'health' })
 * async processHealthMetricEvent(event: HealthMetricEvent) {
 *   // Process the event...
 * }
 *
 * @example
 * // Import error types for type checking
 * import { EventProcessingError, EventErrorContext } from '@austa/events/errors';
 *
 * // Create a specialized error with event context
 * throw new EventProcessingError('Failed to process event', {
 *   eventId: event.id,
 *   eventType: event.type,
 *   source: 'health-service',
 *   processingStage: 'validation'
 * });
 */

// Export event-specific error types
export * from './event-errors';

/**
 * Error handling utilities and decorators for event processing
 * @namespace handling
 */
export * from './handling';

/**
 * Dead Letter Queue (DLQ) integration for event processing failures
 * @namespace dlq
 */
export * from './dlq';

/**
 * Retry policies for event processing failures
 * @namespace retryPolicies
 */
export * from './retry-policies';

// Named exports for specific error handling components

/**
 * Decorator for wrapping event handlers with standardized error handling
 * @function
 * @param {Object} options - Configuration options for the error handler
 * @param {boolean} [options.enableRetry=true] - Whether to enable automatic retry for failed events
 * @param {boolean} [options.sendToDlq=true] - Whether to send to DLQ after retry exhaustion
 * @param {string} [options.journeyContext] - Optional journey context for specialized handling
 * @param {boolean} [options.logErrors=true] - Whether to log errors to the monitoring system
 * @param {boolean} [options.captureMetrics=true] - Whether to capture metrics for failed events
 * @returns {MethodDecorator} A decorator function for event handler methods
 * 
 * @example
 * // Basic usage with default options
 * @handleEventErrors()
 * async processEvent(event: KafkaMessage) {
 *   // Process the event...
 * }
 * 
 * @example
 * // Advanced usage with custom options
 * @handleEventErrors({
 *   enableRetry: true,
 *   sendToDlq: true,
 *   journeyContext: 'care',
 *   logErrors: true,
 *   captureMetrics: true
 * })
 * async processAppointmentEvent(event: AppointmentEvent) {
 *   // Process the event...
 * }
 */
export { handleEventErrors } from './handling';

/**
 * Circuit breaker for preventing cascading failures in event processing
 * @function
 * @param {Object} options - Configuration options for the circuit breaker
 * @param {number} [options.failureThreshold=5] - Number of failures before opening the circuit
 * @param {number} [options.resetTimeout=30000] - Time in ms before attempting to close the circuit
 * @param {number} [options.halfOpenSuccessThreshold=3] - Number of successful calls needed in half-open state
 * @param {Function} [options.fallbackFn] - Optional fallback function to call when circuit is open
 * @returns {MethodDecorator} A decorator function for event handler methods
 * 
 * @example
 * // Basic usage with default options
 * @circuitBreaker()
 * async processEvent(event: KafkaMessage) {
 *   // Process the event...
 * }
 * 
 * @example
 * // Advanced usage with custom options and fallback
 * @circuitBreaker({
 *   failureThreshold: 10,
 *   resetTimeout: 60000,
 *   halfOpenSuccessThreshold: 5,
 *   fallbackFn: async (event) => {
 *     // Handle the event when circuit is open
 *     console.log('Circuit open, using fallback for event:', event.id);
 *     await sendToDlq(event, new Error('Circuit open'), { circuitOpen: true });
 *   }
 * })
 * async processPaymentEvent(event: PaymentEvent) {
 *   // Process the event...
 * }
 */
export { circuitBreaker } from './handling';

/**
 * Sends a failed event to the appropriate Dead Letter Queue
 * @function
 * @param {Object} event - The failed event
 * @param {Error} error - The error that caused the failure
 * @param {Object} metadata - Additional metadata about the failure
 * @param {string} [journeyContext] - Optional journey context for routing to specific DLQ
 * @param {number} [retryCount] - Number of retry attempts made before sending to DLQ
 * @param {Date} [firstFailureTime] - Timestamp of the first failure
 * @param {string} [processingStage] - Stage of processing where the failure occurred
 * @returns {Promise<void>}
 * 
 * @example
 * // Basic usage
 * try {
 *   await processEvent(event);
 * } catch (error) {
 *   await sendToDlq(event, error, { processorId: 'health-metrics' });
 * }
 * 
 * @example
 * // Advanced usage with journey context and retry information
 * try {
 *   await processEvent(event);
 * } catch (error) {
 *   await sendToDlq(
 *     event,
 *     error,
 *     {
 *       processorId: 'appointment-booking',
 *       userId: event.userId,
 *       correlationId: event.correlationId
 *     },
 *     'care',
 *     retryCount,
 *     firstFailureTime,
 *     'validation'
 *   );
 * }
 */
export { sendToDlq } from './dlq';

/**
 * Creates a retry policy based on event type and error classification
 * @function
 * @param {string} eventType - The type of event being processed
 * @param {string} [journeyContext] - Optional journey context for specialized policies
 * @param {Object} [options] - Additional options for the retry policy
 * @param {number} [options.maxRetries] - Maximum number of retry attempts
 * @param {number} [options.initialDelay] - Initial delay in milliseconds
 * @param {number} [options.maxDelay] - Maximum delay in milliseconds
 * @param {boolean} [options.useJitter] - Whether to add jitter to retry delays
 * @returns {RetryPolicy} A configured retry policy for the specified event type
 * 
 * @example
 * // Basic usage with event type
 * const policy = createRetryPolicy('health.metric.recorded');
 * 
 * @example
 * // Advanced usage with journey context and options
 * const policy = createRetryPolicy(
 *   'appointment.booked',
 *   'care',
 *   {
 *     maxRetries: 5,
 *     initialDelay: 1000,
 *     maxDelay: 60000,
 *     useJitter: true
 *   }
 * );
 * 
 * // Use the policy to determine retry behavior
 * if (policy.shouldRetry(error, retryCount)) {
 *   const delay = policy.getDelayMs(retryCount);
 *   setTimeout(() => retryOperation(), delay);
 * }
 */
export { createRetryPolicy } from './retry-policies';

/**
 * Determines if an error is retryable based on error type and context
 * @function
 * @param {Error} error - The error to evaluate
 * @param {Object} context - Additional context about the event and processing state
 * @param {string} [context.eventType] - Type of event being processed
 * @param {string} [context.journeyContext] - Journey context of the event
 * @param {string} [context.processingStage] - Stage of processing where the error occurred
 * @param {number} [context.retryCount] - Current retry count
 * @param {Object} [options] - Additional options for retry decision
 * @param {string[]} [options.nonRetryableErrorTypes] - Error types that should never be retried
 * @param {Function} [options.customRetryCheck] - Custom function for retry decision
 * @returns {boolean} Whether the error should be retried
 * 
 * @example
 * // Basic usage
 * if (isRetryableError(error, { eventType: 'health.metric.recorded' })) {
 *   await retryProcessing(event);
 * } else {
 *   await sendToDlq(event, error, { retryable: false });
 * }
 * 
 * @example
 * // Advanced usage with custom retry check
 * const retryable = isRetryableError(
 *   error,
 *   {
 *     eventType: 'appointment.booked',
 *     journeyContext: 'care',
 *     processingStage: 'validation',
 *     retryCount: currentRetryCount
 *   },
 *   {
 *     nonRetryableErrorTypes: ['ValidationError', 'AuthorizationError'],
 *     customRetryCheck: (err) => {
 *       // Custom logic to determine if this specific error should be retried
 *       return !err.message.includes('permanently failed');
 *     }
 *   }
 * );
 */
export { isRetryableError } from './event-errors';

/**
 * Specialized error for event validation failures
 * @class EventValidationError
 * @extends Error
 * 
 * @description
 * Thrown when an event fails validation checks, such as schema validation,
 * data integrity checks, or business rule validation. This error typically
 * indicates issues with the event data itself rather than processing problems.
 * 
 * @property {string} name - Always set to 'EventValidationError'
 * @property {string} message - Descriptive error message
 * @property {EventErrorContext} context - Additional context about the event and validation failure
 * @property {boolean} retryable - Whether this error type is retryable (typically false for validation errors)
 * 
 * @example
 * // Creating a validation error
 * throw new EventValidationError('Invalid event format: missing required field userId', {
 *   eventId: event.id,
 *   eventType: event.type,
 *   source: 'health-service',
 *   processingStage: 'validation',
 *   validationErrors: [
 *     { field: 'userId', message: 'Required field is missing' }
 *   ]
 * });
 */
export { EventValidationError } from './event-errors';

/**
 * Specialized error for event processing failures
 * @class EventProcessingError
 * @extends Error
 * 
 * @description
 * Thrown when an event fails during processing due to system errors, resource
 * unavailability, or other runtime issues. Unlike validation errors, processing
 * errors typically indicate problems with the system rather than the event data.
 * 
 * @property {string} name - Always set to 'EventProcessingError'
 * @property {string} message - Descriptive error message
 * @property {EventErrorContext} context - Additional context about the event and processing failure
 * @property {boolean} retryable - Whether this error type is retryable (typically true for processing errors)
 * @property {Error} [cause] - Optional underlying error that caused this processing error
 * 
 * @example
 * // Creating a processing error
 * throw new EventProcessingError('Failed to process health metric: database connection error', {
 *   eventId: event.id,
 *   eventType: 'health.metric.recorded',
 *   source: 'health-service',
 *   processingStage: 'persistence',
 *   retryable: true
 * }, originalDatabaseError);
 */
export { EventProcessingError } from './event-errors';

/**
 * Specialized error for event schema-related failures
 * @class EventSchemaError
 * @extends Error
 * 
 * @description
 * Thrown when an event's schema does not match the expected schema for its type.
 * This typically occurs during event versioning transitions or when receiving events
 * from external systems with incompatible schemas.
 * 
 * @property {string} name - Always set to 'EventSchemaError'
 * @property {string} message - Descriptive error message
 * @property {EventErrorContext} context - Additional context about the event and schema mismatch
 * @property {boolean} retryable - Whether this error type is retryable (typically false)
 * @property {Object} expectedSchema - The expected schema for this event type
 * @property {Object} actualSchema - The actual schema of the received event
 * 
 * @example
 * // Creating a schema error
 * throw new EventSchemaError('Event schema version mismatch: expected v2, received v1', {
 *   eventId: event.id,
 *   eventType: event.type,
 *   source: 'external-system',
 *   processingStage: 'deserialization',
 *   schemaVersion: {
 *     expected: 2,
 *     actual: 1
 *   }
 * });
 */
export { EventSchemaError } from './event-errors';

/**
 * Specialized error for event delivery failures
 * @class EventDeliveryError
 * @extends Error
 * 
 * @description
 * Thrown when errors occur during event delivery operations such as producing to Kafka,
 * sending to message queues, or publishing to subscribers. This error type helps distinguish
 * infrastructure-related issues from application-level processing errors.
 * 
 * @property {string} name - Always set to 'EventDeliveryError'
 * @property {string} message - Descriptive error message
 * @property {EventErrorContext} context - Additional context about the delivery operation
 * @property {boolean} retryable - Whether this error type is retryable (typically true)
 * 
 * @example
 * // Creating a delivery error
 * throw new EventDeliveryError('Failed to deliver event to destination', {
 *   eventId: event.id,
 *   eventType: event.type,
 *   source: 'health-service',
 *   processingStage: 'delivery',
 *   destination: 'kafka-topic-health-metrics'
 * });
 */
export { EventDeliveryError } from './event-errors';

/**
 * Specialized error for event persistence failures
 * @class EventPersistenceError
 * @extends EventError
 * 
 * @description
 * Thrown when an event fails to be saved to storage, such as database errors,
 * connection issues, or other persistence-related problems.
 * 
 * @property {string} name - Always set to 'EventPersistenceError'
 * @property {string} message - Descriptive error message
 * @property {EventErrorContext} context - Additional context about the event and persistence failure
 * @property {boolean} retryable - Whether this error type is retryable (typically true)
 * 
 * @example
 * // Creating a persistence error
 * throw new EventPersistenceError('Failed to save event to database', {
 *   eventId: event.id,
 *   eventType: event.type,
 *   source: 'health-service',
 *   processingStage: 'persistence'
 * });
 */
export { EventPersistenceError } from './event-errors';

/**
 * Specialized error for retryable event failures
 * @class EventRetryableError
 * @extends EventError
 * 
 * @description
 * Base class for errors that can be retried. This is used to explicitly mark
 * errors as retryable regardless of their specific type.
 * 
 * @property {string} name - Always set to 'EventRetryableError'
 * @property {string} message - Descriptive error message
 * @property {EventErrorContext} context - Additional context about the event
 * @property {boolean} retryable - Always true
 * 
 * @example
 * // Creating a retryable error
 * throw new EventRetryableError('Temporary failure, can be retried', {
 *   eventId: event.id,
 *   eventType: event.type,
 *   source: 'health-service',
 *   processingStage: 'processing',
 *   retryAttempts: 1,
 *   maxRetryAttempts: 3
 * });
 */
export { EventRetryableError } from './event-errors';

/**
 * Specialized error for non-retryable event failures
 * @class EventNonRetryableError
 * @extends EventError
 * 
 * @description
 * Base class for errors that cannot be retried. This is used to explicitly mark
 * errors as non-retryable regardless of their specific type.
 * 
 * @property {string} name - Always set to 'EventNonRetryableError'
 * @property {string} message - Descriptive error message
 * @property {EventErrorContext} context - Additional context about the event
 * @property {boolean} retryable - Always false
 * 
 * @example
 * // Creating a non-retryable error
 * throw new EventNonRetryableError('Permanent failure, cannot be retried', {
 *   eventId: event.id,
 *   eventType: event.type,
 *   source: 'health-service',
 *   processingStage: 'processing'
 * });
 */
export { EventNonRetryableError } from './event-errors';

/**
 * Specialized error for health journey event failures
 * @class HealthEventError
 * @extends EventError
 * 
 * @description
 * Used for errors specific to health journey events, providing context
 * relevant to health-related processing.
 * 
 * @property {string} name - Always set to 'HealthEventError'
 * @property {string} message - Descriptive error message
 * @property {EventErrorContext} context - Additional context about the event
 * @property {string} journey - Always 'health'
 * 
 * @example
 * // Creating a health journey error
 * throw new HealthEventError('Failed to process health metric: invalid value range', 
 *   ErrorType.VALIDATION,
 *   'HEALTH_METRIC_VALIDATION_ERROR',
 *   {
 *     eventId: event.id,
 *     eventType: 'HEALTH_METRIC_RECORDED',
 *     source: 'health-service',
 *     processingStage: EventProcessingStage.VALIDATION,
 *     details: {
 *       metricType: 'blood_pressure',
 *       value: 300,
 *       allowedRange: [60, 220]
 *     }
 *   }
 * );
 */
export { HealthEventError } from './event-errors';

/**
 * Specialized error for care journey event failures
 * @class CareEventError
 * @extends EventError
 */
export { CareEventError } from './event-errors';

/**
 * Specialized error for plan journey event failures
 * @class PlanEventError
 * @extends EventError
 */
export { PlanEventError } from './event-errors';

/**
 * Exponential backoff retry policy with jitter
 * @const
 * @type {RetryPolicy}
 * 
 * @description
 * A retry policy that implements exponential backoff with jitter. The delay between
 * retry attempts increases exponentially with each attempt, and random jitter is added
 * to prevent thundering herd problems when multiple services retry simultaneously.
 * 
 * @example
 * // Using the exponential backoff policy
 * const policy = exponentialBackoffPolicy;
 * const delay = policy.getDelayMs(retryCount);
 * setTimeout(() => retryOperation(), delay);
 */
export { exponentialBackoffPolicy } from './retry-policies';

/**
 * Constant interval retry policy
 * @const
 * @type {RetryPolicy}
 * 
 * @description
 * A retry policy that uses a constant interval between retry attempts. This policy
 * is simpler than exponential backoff but may be appropriate for certain types of
 * operations where consistent retry timing is desired.
 * 
 * @example
 * // Using the constant interval policy
 * const policy = constantIntervalPolicy;
 * const delay = policy.getDelayMs(retryCount); // Always returns the same delay
 * setTimeout(() => retryOperation(), delay);
 */
export { constantIntervalPolicy } from './retry-policies';

/**
 * Linear backoff retry policy
 * @const
 * @type {RetryPolicy}
 * 
 * @description
 * A retry policy that implements linear backoff. The delay between retry attempts
 * increases linearly with each attempt, providing a middle ground between constant
 * interval and exponential backoff.
 * 
 * @example
 * // Using the linear backoff policy
 * const policy = linearBackoffPolicy;
 * const delay = policy.getDelayMs(retryCount);
 * setTimeout(() => retryOperation(), delay);
 */
export { linearBackoffPolicy } from './retry-policies';

/**
 * Factory for creating journey-specific retry policies
 * @function
 * @param {string} journeyType - The journey type (health, care, plan)
 * @returns {RetryPolicyFactory} A factory for creating journey-specific retry policies
 * 
 * @description
 * Creates a factory function that produces retry policies tailored to specific journeys.
 * Different journeys may have different retry requirements based on their specific
 * business needs and technical constraints.
 * 
 * @example
 * // Create a factory for health journey retry policies
 * const healthPolicyFactory = createJourneyRetryPolicyFactory('health');
 * 
 * // Use the factory to create a policy for a specific event type
 * const healthMetricPolicy = healthPolicyFactory.createPolicy('health.metric.recorded');
 * 
 * // Use the policy to determine retry behavior
 * if (healthMetricPolicy.shouldRetry(error, retryCount)) {
 *   const delay = healthMetricPolicy.getDelayMs(retryCount);
 *   setTimeout(() => retryProcessing(event), delay);
 * }
 */
export { createJourneyRetryPolicyFactory } from './retry-policies';

/**
 * Utility for analyzing DLQ contents and supporting manual reprocessing
 * @namespace dlqUtils
 * 
 * @description
 * Provides utilities for working with Dead Letter Queues, including analyzing
 * the contents of DLQs, supporting manual reprocessing of failed events, and
 * generating reports on error patterns.
 * 
 * @example
 * // Analyze DLQ contents to identify error patterns
 * const errorPatterns = await dlqUtils.analyzeErrorPatterns('health-dlq');
 * console.log('Most common errors:', errorPatterns.mostCommon);
 * 
 * @example
 * // Reprocess failed events from a DLQ
 * const results = await dlqUtils.reprocessEvents('care-dlq', {
 *   filter: (event) => event.metadata.retryCount < 5,
 *   batchSize: 100,
 *   concurrency: 10
 * });
 * console.log(`Reprocessed ${results.successful} events successfully, ${results.failed} failed`);
 */
export { dlqUtils } from './dlq';

/**
 * Interface for retry policy configuration
 * @interface RetryPolicyConfig
 * 
 * @property {number} maxRetries - Maximum number of retry attempts
 * @property {number} initialDelayMs - Initial delay in milliseconds
 * @property {number} maxDelayMs - Maximum delay in milliseconds
 * @property {boolean} useJitter - Whether to add jitter to retry delays
 * @property {Function} [shouldRetry] - Optional custom function to determine if an error should be retried
 */
export type { RetryPolicyConfig } from './retry-policies';

/**
 * Interface for retry policy
 * @interface RetryPolicy
 * 
 * @property {Function} shouldRetry - Determines if an error should be retried
 * @property {Function} getDelayMs - Calculates the delay before the next retry attempt
 * @property {number} maxRetries - Maximum number of retry attempts
 * @property {Function} [reset] - Optional method to reset the policy state
 */
export type { RetryPolicy } from './retry-policies';

/**
 * Interface for retry policy factory
 * @interface RetryPolicyFactory
 * 
 * @property {Function} createPolicy - Creates a retry policy for a specific event type
 * @property {Function} getDefaultPolicy - Gets the default policy for the factory
 * @property {Function} registerPolicyForEventType - Registers a custom policy for an event type
 */
export type { RetryPolicyFactory } from './retry-policies';

/**
 * Interface for DLQ message metadata
 * @interface DlqMetadata
 * 
 * @property {string} eventId - ID of the original event
 * @property {string} eventType - Type of the original event
 * @property {string} source - Source service that published the event
 * @property {string} processingService - Service that was processing the event when it failed
 * @property {string} processingStage - Stage of processing where the failure occurred
 * @property {string} errorType - Type of error that caused the failure
 * @property {string} errorMessage - Error message
 * @property {number} retryCount - Number of retry attempts made
 * @property {Date} firstFailureTime - Timestamp of the first failure
 * @property {Date} lastFailureTime - Timestamp of the last failure
 * @property {Object} [additionalContext] - Any additional context about the failure
 */
export type { DlqMetadata } from './dlq';

/**
 * Interface for error handling options
 * @interface ErrorHandlingOptions
 * 
 * @property {boolean} [enableRetry=true] - Whether to enable automatic retry for failed events
 * @property {boolean} [sendToDlq=true] - Whether to send to DLQ after retry exhaustion
 * @property {string} [journeyContext] - Optional journey context for specialized handling
 * @property {boolean} [logErrors=true] - Whether to log errors to the monitoring system
 * @property {boolean} [captureMetrics=true] - Whether to capture metrics for failed events
 * @property {RetryPolicy} [retryPolicy] - Optional custom retry policy
 * @property {Function} [errorTransformer] - Optional function to transform errors before handling
 */
export type { ErrorHandlingOptions } from './handling';

/**
 * Interface for circuit breaker options
 * @interface CircuitBreakerOptions
 * 
 * @property {number} [failureThreshold=5] - Number of failures before opening the circuit
 * @property {number} [resetTimeout=30000] - Time in ms before attempting to close the circuit
 * @property {number} [halfOpenSuccessThreshold=3] - Number of successful calls needed in half-open state
 * @property {Function} [fallbackFn] - Optional fallback function to call when circuit is open
 * @property {Function} [isFailure] - Optional function to determine if a result should count as a failure
 */
export type { CircuitBreakerOptions } from './handling';

/**
 * Interface for event error context
 * @interface IEventErrorContext
 * 
 * @property {string} eventId - ID of the event being processed
 * @property {string} eventType - Type of the event being processed
 * @property {string} journey - Journey associated with the event
 * @property {string} sourceService - Source service that published the event
 * @property {EventProcessingStage} processingStage - Stage of processing where the error occurred
 * @property {boolean} [retryable] - Whether the error is retryable
 * @property {number} [retryAttempts] - Current retry count if applicable
 * @property {number} [maxRetryAttempts] - Maximum number of retry attempts allowed
 * @property {Object} [details] - Additional context-specific details
 */
export type { IEventErrorContext } from './event-errors';

/**
 * Enum representing different stages of event processing where errors can occur
 * @enum {string}
 */
export { EventProcessingStage } from './event-errors';

/**
 * Error codes for event processing errors
 * @enum {string}
 */
export { EventErrorCode } from './event-errors';

/**
 * Base class for all event-related errors
 * @class EventError
 * @extends AppException
 */
export { EventError } from './event-errors';

/**
 * Utility function to determine if an error is an EventError
 * @function
 */
export { isEventError } from './event-errors';

/**
 * Utility function to create an event error from a generic error
 * @function
 */
export { createEventErrorFromError } from './event-errors';

/**
 * Utility function to create a journey-specific event error
 * @function
 */
export { createJourneyEventError } from './event-errors';

/**
 * Utility function to determine if an error has exceeded the maximum number of retry attempts
 * @function
 */
export { hasExceededMaxRetries } from './event-errors';

/**
 * Utility function to create a new error with an incremented retry count
 * @function
 */
export { incrementRetryCount } from './event-errors';

/**
 * Interface for DLQ consumer options
 * @interface DlqConsumerOptions
 * 
 * @property {number} [batchSize=100] - Number of messages to process in each batch
 * @property {number} [concurrency=10] - Number of messages to process concurrently
 * @property {Function} [filter] - Optional filter function to select which messages to process
 * @property {Function} [transform] - Optional transform function to modify messages before processing
 * @property {boolean} [autoCommit=true] - Whether to automatically commit offsets
 */
export type { DlqConsumerOptions } from './dlq';

/**
 * Interface for DLQ producer options
 * @interface DlqProducerOptions
 * 
 * @property {boolean} [captureStackTrace=true] - Whether to capture and include stack traces
 * @property {boolean} [includeEventPayload=true] - Whether to include the full event payload
 * @property {Function} [metadataEnricher] - Optional function to enrich metadata
 * @property {string} [topicPrefix='dlq'] - Prefix for DLQ topic names
 */
export type { DlqProducerOptions } from './dlq';