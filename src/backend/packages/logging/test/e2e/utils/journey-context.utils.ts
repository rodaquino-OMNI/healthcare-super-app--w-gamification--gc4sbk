/**
 * @file Journey Context Utilities
 * @description Provides utilities for creating and manipulating journey-specific contexts in tests.
 * Includes functions to generate Health, Care, and Plan journey contexts with appropriate metadata
 * and user information. Essential for testing that logs correctly include journey context information
 * for proper filtering and analysis.
 *
 * @module @austa/logging/test/e2e/utils
 */

import { v4 as uuidv4 } from 'uuid';
import { JourneyContext, JourneyType, LogContext } from '../../../src/interfaces/log-entry.interface';

/**
 * Options for creating a journey context
 */
export interface JourneyContextOptions {
  /**
   * Optional resource ID to use (generates a UUID if not provided)
   */
  resourceId?: string;
  
  /**
   * Optional action being performed in the journey
   */
  action?: string;
  
  /**
   * Optional additional journey-specific data
   */
  data?: Record<string, any>;
}

/**
 * Options for creating a log context with journey information
 */
export interface LogContextWithJourneyOptions extends JourneyContextOptions {
  /**
   * Optional user ID to include in the context
   */
  userId?: string;
  
  /**
   * Optional request ID to include in the context
   */
  requestId?: string;
  
  /**
   * Optional session ID to include in the context
   */
  sessionId?: string;
  
  /**
   * Optional trace ID for distributed tracing
   */
  traceId?: string;
  
  /**
   * Optional context name (e.g., class or method name)
   */
  context?: string;
  
  /**
   * Optional client IP address
   */
  clientIp?: string;
  
  /**
   * Optional user agent string
   */
  userAgent?: string;
  
  /**
   * Optional additional context data
   */
  [key: string]: any;
}

/**
 * Creates a Health journey context for testing
 * 
 * @param options Optional configuration for the journey context
 * @returns A JourneyContext object for the Health journey
 */
export function createHealthJourneyContext(options: JourneyContextOptions = {}): JourneyContext {
  return {
    type: JourneyType.HEALTH,
    resourceId: options.resourceId || uuidv4(),
    action: options.action || 'view_health_metrics',
    data: options.data || {
      metricType: 'blood_pressure',
      deviceId: `device_${uuidv4().substring(0, 8)}`,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Creates a Care journey context for testing
 * 
 * @param options Optional configuration for the journey context
 * @returns A JourneyContext object for the Care journey
 */
export function createCareJourneyContext(options: JourneyContextOptions = {}): JourneyContext {
  return {
    type: JourneyType.CARE,
    resourceId: options.resourceId || uuidv4(),
    action: options.action || 'schedule_appointment',
    data: options.data || {
      providerId: `provider_${uuidv4().substring(0, 8)}`,
      specialtyId: `specialty_${uuidv4().substring(0, 8)}`,
      appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    },
  };
}

/**
 * Creates a Plan journey context for testing
 * 
 * @param options Optional configuration for the journey context
 * @returns A JourneyContext object for the Plan journey
 */
export function createPlanJourneyContext(options: JourneyContextOptions = {}): JourneyContext {
  return {
    type: JourneyType.PLAN,
    resourceId: options.resourceId || uuidv4(),
    action: options.action || 'submit_claim',
    data: options.data || {
      claimType: 'medical',
      amount: Math.floor(Math.random() * 1000) + 100,
      policyId: `policy_${uuidv4().substring(0, 8)}`,
      documentIds: [uuidv4(), uuidv4()],
    },
  };
}

/**
 * Creates a log context with Health journey information for testing
 * 
 * @param options Optional configuration for the log context
 * @returns A LogContext object with Health journey information
 */
export function createHealthLogContext(options: LogContextWithJourneyOptions = {}): LogContext {
  return {
    context: options.context || 'HealthMetricsService',
    requestId: options.requestId || uuidv4(),
    userId: options.userId || `user_${uuidv4().substring(0, 8)}`,
    sessionId: options.sessionId || uuidv4(),
    traceId: options.traceId || uuidv4(),
    clientIp: options.clientIp || '192.168.1.1',
    userAgent: options.userAgent || 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    journey: createHealthJourneyContext(options),
    ...Object.fromEntries(Object.entries(options).filter(([key]) => 
      !['context', 'requestId', 'userId', 'sessionId', 'traceId', 'clientIp', 'userAgent', 'resourceId', 'action', 'data'].includes(key)
    )),
  };
}

/**
 * Creates a log context with Care journey information for testing
 * 
 * @param options Optional configuration for the log context
 * @returns A LogContext object with Care journey information
 */
export function createCareLogContext(options: LogContextWithJourneyOptions = {}): LogContext {
  return {
    context: options.context || 'AppointmentService',
    requestId: options.requestId || uuidv4(),
    userId: options.userId || `user_${uuidv4().substring(0, 8)}`,
    sessionId: options.sessionId || uuidv4(),
    traceId: options.traceId || uuidv4(),
    clientIp: options.clientIp || '192.168.1.2',
    userAgent: options.userAgent || 'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    journey: createCareJourneyContext(options),
    ...Object.fromEntries(Object.entries(options).filter(([key]) => 
      !['context', 'requestId', 'userId', 'sessionId', 'traceId', 'clientIp', 'userAgent', 'resourceId', 'action', 'data'].includes(key)
    )),
  };
}

/**
 * Creates a log context with Plan journey information for testing
 * 
 * @param options Optional configuration for the log context
 * @returns A LogContext object with Plan journey information
 */
export function createPlanLogContext(options: LogContextWithJourneyOptions = {}): LogContext {
  return {
    context: options.context || 'ClaimsService',
    requestId: options.requestId || uuidv4(),
    userId: options.userId || `user_${uuidv4().substring(0, 8)}`,
    sessionId: options.sessionId || uuidv4(),
    traceId: options.traceId || uuidv4(),
    clientIp: options.clientIp || '192.168.1.3',
    userAgent: options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    journey: createPlanJourneyContext(options),
    ...Object.fromEntries(Object.entries(options).filter(([key]) => 
      !['context', 'requestId', 'userId', 'sessionId', 'traceId', 'clientIp', 'userAgent', 'resourceId', 'action', 'data'].includes(key)
    )),
  };
}

/**
 * Creates a consistent set of journey contexts for all three journeys with the same user information
 * Useful for testing cross-journey scenarios
 * 
 * @param baseOptions Base options to apply to all contexts
 * @returns An object containing contexts for all three journeys
 */
export function createAllJourneyContexts(baseOptions: Partial<LogContextWithJourneyOptions> = {}): {
  health: LogContext;
  care: LogContext;
  plan: LogContext;
} {
  const userId = baseOptions.userId || `user_${uuidv4().substring(0, 8)}`;
  const sessionId = baseOptions.sessionId || uuidv4();
  const traceId = baseOptions.traceId || uuidv4();
  
  return {
    health: createHealthLogContext({ ...baseOptions, userId, sessionId, traceId }),
    care: createCareLogContext({ ...baseOptions, userId, sessionId, traceId }),
    plan: createPlanLogContext({ ...baseOptions, userId, sessionId, traceId }),
  };
}

/**
 * Verifies that a log entry contains the expected journey context
 * 
 * @param logEntry The log entry to verify
 * @param expectedJourneyType The expected journey type
 * @param expectedResourceId Optional expected resource ID
 * @returns True if the log entry contains the expected journey context, false otherwise
 */
export function verifyJourneyContext(
  logEntry: any,
  expectedJourneyType: JourneyType,
  expectedResourceId?: string
): boolean {
  if (!logEntry || !logEntry.journey || logEntry.journey.type !== expectedJourneyType) {
    return false;
  }
  
  if (expectedResourceId && logEntry.journey.resourceId !== expectedResourceId) {
    return false;
  }
  
  return true;
}

/**
 * Extracts all log entries for a specific journey type from an array of log entries
 * 
 * @param logEntries Array of log entries to filter
 * @param journeyType The journey type to filter by
 * @returns Array of log entries for the specified journey type
 */
export function filterLogsByJourney(logEntries: any[], journeyType: JourneyType): any[] {
  return logEntries.filter(entry => 
    entry && entry.journey && entry.journey.type === journeyType
  );
}

/**
 * Extracts all log entries for a specific resource ID from an array of log entries
 * 
 * @param logEntries Array of log entries to filter
 * @param resourceId The resource ID to filter by
 * @returns Array of log entries for the specified resource ID
 */
export function filterLogsByResourceId(logEntries: any[], resourceId: string): any[] {
  return logEntries.filter(entry => 
    entry && entry.journey && entry.journey.resourceId === resourceId
  );
}

/**
 * Extracts all log entries for a specific user ID from an array of log entries
 * 
 * @param logEntries Array of log entries to filter
 * @param userId The user ID to filter by
 * @returns Array of log entries for the specified user ID
 */
export function filterLogsByUserId(logEntries: any[], userId: string): any[] {
  return logEntries.filter(entry => entry && entry.userId === userId);
}

/**
 * Extracts all log entries for a specific trace ID from an array of log entries
 * Useful for following a request across multiple services
 * 
 * @param logEntries Array of log entries to filter
 * @param traceId The trace ID to filter by
 * @returns Array of log entries for the specified trace ID
 */
export function filterLogsByTraceId(logEntries: any[], traceId: string): any[] {
  return logEntries.filter(entry => entry && entry.traceId === traceId);
}

/**
 * Creates a mock log entry with journey context for testing
 * 
 * @param message The log message
 * @param level The log level
 * @param context The log context with journey information
 * @returns A mock log entry
 */
export function createMockLogEntry(message: string, level: string, context: LogContext): any {
  return {
    message,
    level,
    timestamp: new Date(),
    ...context,
  };
}