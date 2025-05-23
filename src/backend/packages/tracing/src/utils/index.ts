/**
 * @file Barrel file that exports all utility functions from the tracing utilities directory.
 * This file provides a single import point for all tracing utility functions,
 * simplifying imports in other files and ensuring consistent usage patterns.
 * 
 * @module @austa/tracing/utils
 */

/**
 * Correlation utilities for connecting traces with logs and metrics.
 * These utilities enable unified observability across the application by
 * extracting trace and span IDs from the current context and enriching
 * log objects with tracing information.
 * 
 * @example
 * // Extract current trace context for logging
 * const traceContext = getTraceContext();
 * logger.info('Processing request', { ...traceContext });
 */
export * from './correlation';

/**
 * Span attribute utilities for enriching OpenTelemetry spans with standardized attributes.
 * These utilities ensure consistent and searchable trace data by providing methods
 * for adding common attributes, journey-specific attributes, and error information.
 * 
 * @example
 * // Add user and request attributes to a span
 * addUserAttributes(span, userId);
 * addRequestAttributes(span, requestId, method, path);
 */
export * from './span-attributes';

/**
 * Context propagation utilities for maintaining trace context across service boundaries.
 * These utilities enable end-to-end tracing by providing methods to extract and inject
 * trace context into various transport mechanisms including HTTP headers and Kafka messages.
 * 
 * @example
 * // Inject trace context into outgoing HTTP request headers
 * const headers = {};
 * injectTraceContext(headers);
 * // Make HTTP request with headers
 */
export * from './context-propagation';