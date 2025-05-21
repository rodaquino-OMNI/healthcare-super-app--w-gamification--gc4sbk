/**
 * @file Gamification Engine Utilities
 * @description Centralized exports for all utility functions used throughout the gamification engine.
 * This barrel file provides a single import point for all utility functions, ensuring consistent
 * usage patterns across the codebase and improving code maintainability.
 */

/**
 * Date and time utilities for managing achievement deadlines, quest durations, and reward expiration.
 * Handles timezone conversions and date comparisons across all gamification components.
 * 
 * @example
 * import { calculateQuestDeadline, isRewardExpired } from '@app/common/utils';
 */
export * from './date-time.util';

/**
 * Data formatting utilities for standardizing event formats, normalizing achievement data,
 * and formatting user-facing notifications about gamification events.
 * 
 * @example
 * import { formatAchievementNotification, normalizeJourneyEvent } from '@app/common/utils';
 */
export * from './format.util';

/**
 * Circuit breaker pattern implementation for managing failures in external dependencies and services.
 * Prevents cascading failures by automatically detecting repeated failures and temporarily
 * disabling problematic operations with fallback mechanisms.
 * 
 * @example
 * import { createCircuitBreaker, CircuitBreakerOptions } from '@app/common/utils';
 */
export * from './circuit-breaker.util';

/**
 * Gamification-specific logging utilities with correlation IDs that trace events across journey services.
 * Implements structured JSON logging with configurable levels and context enrichment for all gamification operations.
 * 
 * @example
 * import { logGamificationEvent, createLoggerWithContext } from '@app/common/utils';
 */
export * from './logging.util';

/**
 * Utilities for standardized event handling, schema validation, and event transformation.
 * Ensures consistent processing of events from all journeys and integrates with the retry mechanism
 * for resilient event handling.
 * 
 * @example
 * import { validateEventSchema, transformJourneyEvent } from '@app/common/utils';
 */
export * from './event-processing.util';

/**
 * Validation utilities using Zod/class-validator for the gamification engine.
 * Implements consistent validation patterns for event payloads, achievement criteria,
 * and reward conditions to ensure data integrity across all gamification components.
 * 
 * @example
 * import { validateAchievementCriteria, validateEventPayload } from '@app/common/utils';
 */
export * from './validation.util';

/**
 * Configurable retry strategies with exponential backoff for handling transient failures
 * in event processing and external service calls. Critical for ensuring resilience and
 * fault tolerance in the gamification engine when processing cross-journey events.
 * 
 * @example
 * import { withRetry, createRetryPolicy } from '@app/common/utils';
 */
export * from './retry.util';

/**
 * Comprehensive error handling framework with journey-specific error classification,
 * standardized error codes, and context enrichment. Enables consistent error responses
 * and proper troubleshooting across gamification components.
 * 
 * @example
 * import { handleGamificationError, enrichErrorContext } from '@app/common/utils';
 */
export * from './error-handling.util';