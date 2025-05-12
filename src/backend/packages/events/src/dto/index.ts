/**
 * @file Event Data Transfer Objects (DTOs) Barrel File
 * 
 * This barrel file exports all event DTOs from a single entry point, providing a clean
 * public API for the events/dto module. It simplifies imports and maintains consistent
 * access patterns for consumers across the AUSTA SuperApp.
 * 
 * Import pattern examples:
 * ```typescript
 * // Import all DTOs
 * import * as EventDTOs from '@austa/events/dto';
 * 
 * // Import specific DTOs
 * import { BaseEventDto, EventTypes, HealthMetricEventDto } from '@austa/events/dto';
 * ```
 */

// ========================================================================
// Base DTOs - Core event structures and utilities
// ========================================================================

/**
 * Core event structure that all other event DTOs extend
 */
export * from './base-event.dto';

/**
 * Standardized event metadata structure for tracking and correlation
 */
export * from './event-metadata.dto';

/**
 * Enum of all supported event types across all journeys
 */
export * from './event-types.enum';

/**
 * Event versioning support for schema evolution
 */
export * from './version.dto';

/**
 * Specialized validation utilities for event data
 */
export * from './validation';

// ========================================================================
// Journey-specific DTOs - Events organized by journey
// ========================================================================

/**
 * Health journey events (metrics, goals, devices)
 */
export * from './health-event.dto';

/**
 * Care journey events (appointments, medications, telemedicine)
 */
export * from './care-event.dto';

/**
 * Plan journey events (claims, benefits, plan selection)
 */
export * from './plan-event.dto';

// ========================================================================
// Specialized DTOs - Specific event types with detailed validation
// ========================================================================

/**
 * Health metric recording events (weight, heart rate, steps, etc.)
 */
export * from './health-metric-event.dto';

/**
 * Health goal events (creation, progress, achievement)
 */
export * from './health-goal-event.dto';

/**
 * Appointment events (booking, check-in, completion, cancellation)
 */
export * from './appointment-event.dto';

/**
 * Medication events (taken, skipped, scheduled)
 */
export * from './medication-event.dto';

/**
 * Insurance claim events (submission, approval, rejection, updates)
 */
export * from './claim-event.dto';

/**
 * Benefit events (utilization, redemption, status changes)
 */
export * from './benefit-event.dto';