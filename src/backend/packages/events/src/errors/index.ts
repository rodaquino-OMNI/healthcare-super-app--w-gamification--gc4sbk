/**
 * @file Error handling utilities and types for event processing
 * @module @austa/events/errors
 * @description Exports all error-related functionality for event processing,
 * including error types, retry policies, DLQ utilities, and error handling functions.
 * This module provides a clean, organized API surface for importing error handling
 * capabilities without dealing with internal file organization details.
 * 
 * The error handling system is designed to support the journey-centered architecture
 * of the AUSTA SuperApp, with specialized handling for each journey type (Health, Care, Plan)
 * while maintaining consistent patterns across the application. It integrates with the
 * centralized gamification engine to ensure that event processing failures don't impact
 * the user experience and engagement mechanisms.
 * 
 * Key features:
 * - Journey-specific error classification and handling
 * - Consistent retry policies across all services
 * - Dead letter queue (DLQ) integration for reliable event processing
 * - Standardized error logging and monitoring
 * - Circuit breaking to prevent cascading failures
 * 
 * This module works in conjunction with other packages in the monorepo:
 * - @austa/errors: Provides base error classes and common error handling patterns
 * - @austa/logging: Integrates with structured logging for error reporting
 * - @austa/tracing: Supports distributed tracing for error context across services
 * - @austa/interfaces: Defines shared interfaces for error types and metadata
 */

/**
 * Event-specific error classes for different failure scenarios in event processing.
 * Includes specialized error types with event context (event type, ID, source, stage).
 * These error types enable precise error handling and automatic retry classification.
 * 
 * @example
 * ```typescript
 * import { EventValidationError } from '@austa/events/errors';
 * 
 * throw new EventValidationError('Invalid event schema', {
 *   eventId: 'abc-123',
 *   eventType: 'health.metric.recorded',
 *   source: 'health-service',
 *   stage: 'validation'
 * });
 * ```
 */
export * from './event-errors';

/**
 * Configurable retry policies for event processing failures.
 * Includes implementations for exponential backoff, constant interval, and custom strategies.
 * Each policy determines retry behavior based on error type, event context, and failure count.
 * 
 * @example
 * ```typescript
 * import { createExponentialBackoffPolicy, applyRetryPolicy } from '@austa/events/errors';
 * 
 * const retryPolicy = createExponentialBackoffPolicy({
 *   maxRetries: 5,
 *   initialDelayMs: 100,
 *   maxDelayMs: 10000,
 *   journeyType: 'health'
 * });
 * 
 * await applyRetryPolicy(retryPolicy, processEvent, event, error);
 * ```
 */
export * from './retry-policies';

/**
 * Dead letter queue (DLQ) integration for event processing failures.
 * Provides utilities for moving failed events to appropriate DLQ topics,
 * capturing failure context and retry history, and supporting manual reprocessing.
 * 
 * @example
 * ```typescript
 * import { sendToDLQ, reprocessFromDLQ } from '@austa/events/errors';
 * 
 * // Send failed event to DLQ
 * await sendToDLQ({
 *   event,
 *   error,
 *   retryCount: 5,
 *   journeyType: 'health',
 *   metadata: { userId: '123', correlationId: 'abc-xyz' }
 * });
 * 
 * // Reprocess events from DLQ
 * await reprocessFromDLQ({
 *   dlqTopic: 'health-events-dlq',
 *   processor: processHealthEvent,
 *   filter: (event) => event.type === 'health.metric.recorded'
 * });
 * ```
 */
export * from './dlq';

/**
 * Utility functions and decorators for error handling in event processing.
 * Includes decorators for wrapping event processors with standardized error handling,
 * utilities for error classification and logging, and helper functions for error recovery.
 * 
 * @example
 * ```typescript
 * import { WithEventErrorHandling, logEventError } from '@austa/events/errors';
 * 
 * // Use decorator for consistent error handling
 * @WithEventErrorHandling({
 *   retryPolicy: 'exponentialBackoff',
 *   useDLQ: true,
 *   journeyType: 'health'
 * })
 * async function processHealthEvent(event: HealthEvent): Promise<void> {
 *   // Process event...
 * }
 * 
 * // Manual error handling
 * try {
 *   await processEvent(event);
 * } catch (error) {
 *   logEventError(error, { event, context: { userId: '123' } });
 *   // Handle error...
 * }
 * ```
 */
export * from './handling';