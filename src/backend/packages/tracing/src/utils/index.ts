/**
 * @file Utility functions for OpenTelemetry tracing
 * 
 * This barrel file exports all utility functions from the tracing utilities directory,
 * providing a single import point for all tracing utility functions. This simplifies
 * importing utilities in other files and ensures consistent usage patterns across the
 * AUSTA SuperApp.
 *
 * @module @austa/tracing/utils
 */

/**
 * Utilities for correlating traces with logs and metrics
 * 
 * These utilities enable unified observability across the application by providing
 * methods to extract trace and span IDs from the current context and enrich log
 * objects with tracing information.
 */
export * from './correlation';

/**
 * Utilities for enriching OpenTelemetry spans with standardized attributes
 * 
 * These utilities provide methods for adding common attributes (e.g., user ID, request ID),
 * journey-specific attributes for different healthcare journeys, and error information
 * to spans, enabling consistent and searchable trace data.
 */
export * from './span-attributes';

/**
 * Utilities for propagating trace context across service boundaries
 * 
 * These utilities enable end-to-end tracing by offering methods to extract and inject
 * trace context into various transport mechanisms including HTTP headers and Kafka messages,
 * ensuring trace continuity in distributed systems.
 */
export * from './context-propagation';