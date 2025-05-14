/**
 * @file Logging Utilities Barrel File
 * @description Exports all utility functions for the logging system, providing a clean,
 * organized way to import logging utilities throughout the application.
 * 
 * This barrel file ensures consistent import patterns and reduces the risk of circular
 * dependencies by centralizing exports. It is essential for maintaining a well-structured
 * module system within the logging package.
 */

/**
 * Log Level Utilities
 * 
 * Provides utilities for working with log levels throughout the logging system,
 * enabling consistent level management and filtering.
 * 
 * @example
 * import { parseLogLevel, shouldLog, LogLevel } from '@austa/logging/utils';
 * 
 * const level = parseLogLevel('debug');
 * if (shouldLog(level, LogLevel.INFO)) {
 *   // Log the message
 * }
 */
export * from './level.utils';

/**
 * Formatting Utilities
 * 
 * Provides utilities for formatting various data types for structured logging,
 * ensuring consistent and readable log output.
 * 
 * @example
 * import { formatError, safeSerialize } from '@austa/logging/utils';
 * 
 * try {
 *   // Some operation
 * } catch (error) {
 *   logger.error('Operation failed', formatError(error));
 * }
 */
export * from './format.utils';

/**
 * Sanitization Utilities
 * 
 * Provides utilities for sanitizing sensitive data in logs to ensure compliance
 * with privacy regulations and protect user information.
 * 
 * @example
 * import { redactSensitiveFields, sanitizeLogEntry } from '@austa/logging/utils';
 * 
 * const sanitizedData = redactSensitiveFields(userData);
 * logger.info('User data processed', sanitizedData);
 */
export * from './sanitization.utils';

/**
 * Context Utilities
 * 
 * Provides utilities for working with logging contexts in the journey-based architecture,
 * enabling the creation, merging, and manipulation of various context types.
 * 
 * @example
 * import { createLogContext, createHealthJourneyContext } from '@austa/logging/utils';
 * 
 * const context = createLogContext(
 *   { requestId: '123', userId: '456' },
 *   { method: 'GET', path: '/health' },
 *   createHealthJourneyContext({ metricType: 'steps' })
 * );
 * 
 * logger.info('Health metric recorded', { steps: 10000 }, context);
 */
export * from './context.utils';

/**
 * Trace Correlation Utilities
 * 
 * Provides utilities for correlating logs with distributed traces and metrics,
 * enabling comprehensive observability across service boundaries.
 * 
 * @example
 * import { enrichLogWithTraceInfo, getTraceInfoFromRequest } from '@austa/logging/utils';
 * 
 * app.use((req, res, next) => {
 *   const traceInfo = getTraceInfoFromRequest(req);
 *   req.logger = createLogger(enrichLogWithTraceInfo({ requestId: req.id }));
 *   next();
 * });
 */
export * from './trace-correlation.utils';