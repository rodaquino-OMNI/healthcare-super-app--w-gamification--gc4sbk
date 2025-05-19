/**
 * @module @austa/logging/context
 * @description
 * This module provides a comprehensive set of interfaces, classes, and constants for managing
 * logging contexts throughout the AUSTA SuperApp. Logging contexts enable structured, consistent
 * logging with rich contextual information across all services and journeys.
 *
 * The context system is designed to support the journey-centered architecture of the AUSTA SuperApp,
 * with specific context types for each journey (Health, Care, Plan) as well as cross-cutting
 * concerns like user information and request details.
 *
 * @example
 * ```typescript
 * import { ContextManager, JourneyType, LoggingContext } from '@austa/logging/context';
 *
 * // Create a context manager
 * const contextManager = new ContextManager();
 *
 * // Create a journey-specific context
 * const healthJourneyContext = contextManager.createJourneyContext({
 *   journeyType: JourneyType.HEALTH,
 *   // Additional journey-specific properties
 * });
 *
 * // Use the context in logging
 * logger.log('User viewed health metrics', healthJourneyContext);
 * ```
 */

// Export base context interface
export * from './context.interface';

// Export specialized context interfaces
export * from './journey-context.interface';
export * from './user-context.interface';
export * from './request-context.interface';

// Export context constants and enums
export * from './context.constants';

// Export context management utilities
export * from './context-manager';