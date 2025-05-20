/**
 * @file Tracing Utilities Index
 * @description Barrel file that exports all utility functions from the tracing utilities directory.
 * This file provides a single import point for all tracing utility functions, simplifying imports
 * in other files and ensuring consistent usage patterns across the AUSTA SuperApp.
 */

/**
 * Correlation utilities for connecting traces with logs and metrics.
 * These utilities enable unified observability across the application by:
 * - Extracting trace and span IDs from the current context
 * - Enriching log objects with tracing information
 * - Generating correlation objects for external systems
 * - Correlating traces with metrics
 */
export * from './correlation';

/**
 * Span attribute utilities for enriching OpenTelemetry spans with standardized attributes.
 * These utilities enable consistent and searchable trace data by providing methods for:
 * - Adding common attributes (user ID, request ID, service info)
 * - Adding journey-specific attributes for health, care, and plan journeys
 * - Adding error information with consistent attribute patterns
 * - Adding performance metric attributes
 */
export * from './span-attributes';

/**
 * Context propagation utilities for maintaining trace context across service boundaries.
 * These utilities enable end-to-end tracing in distributed systems by providing methods for:
 * - Extracting and injecting trace context in HTTP headers
 * - Propagating trace context in Kafka messages
 * - Serializing and deserializing trace context
 * - Supporting journey-specific context propagation
 */
export * from './context-propagation';