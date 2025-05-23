/**
 * @file Barrel file that exports all utility functions for the logging system.
 * Provides a clean, organized way to import logging utilities throughout the application.
 * Ensures consistent import patterns and reduces the risk of circular dependencies by centralizing exports.
 */

/**
 * Log Level Utilities
 * Provides functions for working with log levels, level comparison, and environment-based configuration.
 */
export {
  // Core log level utilities
  parseLogLevel,
  logLevelToString,
  getLogLevelValue,
  isLevelEnabled,
  parseLogLevelFromEnv,
  
  // Journey-specific log level utilities
  getJourneyLogLevel,
  getHealthJourneyLogLevel,
  getCareJourneyLogLevel,
  getPlanJourneyLogLevel,
  
  // Log level comparison utilities
  isMoreSevere,
  isLessSevere,
  getMostSevereLevel,
  
  // Constants
  DEFAULT_LOG_LEVEL,
  JOURNEY_ENV_PREFIXES,
} from './level.utils';

/**
 * Formatting Utilities
 * Provides functions for formatting various data types for structured logging.
 */
export {
  // Error formatting
  formatError,
  
  // Data formatting
  formatTimestamp,
  safeSerialize,
  formatObject,
  formatContext,
  
  // Journey-specific formatting
  formatJourneyData,
  
  // Log entry creation
  createLogEntry,
} from './format.utils';

/**
 * Sanitization Utilities
 * Provides functions for sanitizing sensitive data in logs to ensure compliance with privacy regulations.
 */
export {
  // Core sanitization utilities
  maskValue,
  maskPII,
  maskCredentials,
  sanitizeString,
  sanitizeObject,
  
  // Request/response sanitization
  sanitizeRequest,
  sanitizeResponse,
  sanitizeError,
  createSanitizationMiddleware,
  
  // Journey-specific sanitization
  sanitizeJourneyData,
  sanitizeGamificationEvent,
  
  // Types
  SanitizationOptions,
} from './sanitization.utils';

/**
 * Context Utilities
 * Provides utilities for working with logging contexts in the journey-based architecture.
 */
export {
  // Context creation
  createBaseContext,
  createRequestContext,
  createUserContext,
  createJourneyContext,
  
  // Journey-specific context creation
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  
  // Context manipulation
  mergeContexts,
  extractContextFromHeaders,
  createContextPropagationHeaders,
  extractContextFromRequest,
} from './context.utils';

/**
 * Trace Correlation Utilities
 * Provides utilities for correlating logs with distributed traces and metrics.
 */
export {
  // Trace info extraction
  getCurrentTraceInfo,
  getTraceInfoFromSpanContext,
  extractTraceInfoFromHeaders,
  
  // Log enrichment
  enrichLogWithTraceInfo,
  enrichLogWithJourneyContext,
  
  // Trace ID conversion
  convertToXRayTraceId,
  convertFromXRayTraceId,
  
  // Correlation objects for different backends
  createCloudWatchCorrelation,
  createDatadogCorrelation,
  createTraceHeaders,
  
  // Error handling
  addErrorToActiveSpan,
  
  // Trace visualization
  createTraceLink,
  
  // Types
  TraceCorrelationInfo,
  XRayTraceId,
} from './trace-correlation.utils';