/**
 * @file Gamification Engine Utilities
 * @description Centralized exports for all utility functions used throughout the gamification engine.
 * This barrel file provides a single import point for consistent usage patterns across the codebase.
 */

/**
 * Date and time utilities for managing achievement deadlines, quest durations, and reward expiration.
 * Handles timezone conversions and date comparisons across all gamification components.
 */
export * from './date-time.util';

/**
 * Data formatting utilities for standardizing event formats, normalizing achievement data,
 * and formatting user-facing notifications about gamification events.
 */
export * from './format.util';

/**
 * Circuit breaker pattern implementation for managing failures in external dependencies and services.
 * Prevents cascading failures by automatically detecting repeated failures and temporarily
 * disabling problematic operations with fallback mechanisms.
 */
export * from './circuit-breaker.util';

/**
 * Gamification-specific logging utilities with correlation IDs that trace events across journey services.
 * Implements structured JSON logging with configurable levels and context enrichment for all gamification operations.
 */
export * from './logging.util';

/**
 * Event processing utilities for standardized event handling, schema validation, and event transformation.
 * Ensures consistent processing of events from all journeys and integrates with the retry mechanism
 * for resilient event handling.
 */
export * from './event-processing.util';

/**
 * Validation utilities using Zod/class-validator for consistent validation patterns.
 * Implements validation for event payloads, achievement criteria, and reward conditions
 * to ensure data integrity across all gamification components.
 */
export * from './validation.util';

/**
 * Retry utilities with configurable strategies and exponential backoff for handling transient failures.
 * Critical for ensuring resilience and fault tolerance in the gamification engine when processing
 * cross-journey events.
 */
export * from './retry.util';

/**
 * Error handling framework with journey-specific error classification, standardized error codes,
 * and context enrichment. Enables consistent error responses and proper troubleshooting
 * across gamification components.
 */
export * from './error-handling.util';