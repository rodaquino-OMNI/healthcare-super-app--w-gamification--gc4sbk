/**
 * @module @austa/logging/context
 * @description
 * This module provides a comprehensive context system for structured logging
 * throughout the AUSTA SuperApp. It enables context-enriched logs with request IDs,
 * user information, journey details, and correlation IDs that connect logs, traces,
 * and metrics for enhanced observability.
 *
 * The context system is designed to support the journey-centered architecture
 * of the AUSTA SuperApp, providing specific context types for each journey
 * while maintaining a consistent structure for log aggregation and analysis.
 */

// Export base context interface
export { LoggingContext } from './context.interface';

// Export specific context interfaces
export { JourneyContext } from './journey-context.interface';
export { UserContext } from './user-context.interface';
export { RequestContext } from './request-context.interface';

// Export context management utilities
export { ContextManager } from './context-manager';

/**
 * Namespace containing all context types for convenient access.
 * This allows consumers to import all types from a single location
 * without creating circular dependencies.
 * 
 * @example
 * import { ContextTypes } from '@austa/logging/context';
 * 
 * const context: ContextTypes.JourneyContext = {
 *   journeyType: 'Health',
 *   // other journey context properties
 * };
 */
import * as ContextTypes from './context.interface';
export { ContextTypes };