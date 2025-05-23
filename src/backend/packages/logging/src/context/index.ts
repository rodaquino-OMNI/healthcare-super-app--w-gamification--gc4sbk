/**
 * @module @austa/logging/context
 * @description
 * This module provides a comprehensive context system for structured logging
 * throughout the AUSTA SuperApp. It enables journey-specific, user-specific,
 * and request-specific context to be attached to logs, enhancing observability
 * and facilitating troubleshooting across the application's microservices.
 *
 * The context system is designed to support the journey-centered architecture
 * of the AUSTA SuperApp, with specific context types for each journey (Health,
 * Care, and Plan) while maintaining a consistent structure for log aggregation
 * and analysis.
 */

// Export base context interface
export { LoggingContext } from './context.interface';

// Export specific context interfaces
export { RequestContext } from './request-context.interface';
export { UserContext } from './user-context.interface';
export { JourneyContext } from './journey-context.interface';

// Export context manager
export { ContextManager } from './context-manager';

// Export constants and enums
export { 
  JourneyType,
  CONTEXT_KEYS,
  DEFAULT_CONTEXT_VALUES,
  LOG_LEVELS
} from './context.constants';

/**
 * Creates a new logging context with the specified properties.
 * This is a convenience function for creating context objects.
 * 
 * @param contextData - The data to include in the context
 * @returns A new LoggingContext object
 */
export function createContext(contextData: Partial<LoggingContext>): LoggingContext {
  return {
    ...DEFAULT_CONTEXT_VALUES,
    ...contextData,
    timestamp: contextData.timestamp || new Date().toISOString(),
  };
}

/**
 * Creates a journey-specific logging context.
 * 
 * @param journeyType - The type of journey (Health, Care, or Plan)
 * @param contextData - Additional context data
 * @returns A new JourneyContext object
 */
export function createJourneyContext(
  journeyType: JourneyType,
  contextData: Partial<JourneyContext>
): JourneyContext {
  return {
    ...createContext(contextData),
    journeyType,
  } as JourneyContext;
}

/**
 * Creates a user-specific logging context.
 * 
 * @param userId - The ID of the user
 * @param contextData - Additional context data
 * @returns A new UserContext object
 */
export function createUserContext(
  userId: string,
  contextData: Partial<UserContext>
): UserContext {
  return {
    ...createContext(contextData),
    userId,
  } as UserContext;
}

/**
 * Creates a request-specific logging context.
 * 
 * @param requestId - The ID of the request
 * @param contextData - Additional context data
 * @returns A new RequestContext object
 */
export function createRequestContext(
  requestId: string,
  contextData: Partial<RequestContext>
): RequestContext {
  return {
    ...createContext(contextData),
    requestId,
  } as RequestContext;
}