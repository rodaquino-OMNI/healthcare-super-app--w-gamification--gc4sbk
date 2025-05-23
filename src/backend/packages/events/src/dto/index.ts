/**
 * @file Event DTO Barrel File
 * @description Centralizes exports for all event DTOs in a single entry point.
 * This file provides a clean public API for the events/dto module, simplifying
 * imports and maintaining consistent access patterns for consumers.
 *
 * @example
 * // Import all event DTOs from a single entry point
 * import { BaseEventDto, HealthEventDto, AppointmentEventDto } from '@austa/events/dto';
 */

// ============================================================================
// Base/Core DTOs
// ============================================================================

/**
 * Core event DTOs that serve as the foundation for the event system.
 * These provide the base structure, metadata, and validation for all events.
 */
export * from './base-event.dto';
export * from './event-metadata.dto';
export * from './event-types.enum';
export * from './version.dto';
export * from './validation';

// ============================================================================
// Journey-specific DTOs
// ============================================================================

/**
 * Journey-specific event DTOs that extend the base event with journey context.
 * These DTOs are organized by the three main user journeys in the AUSTA SuperApp.
 */
export * from './health-event.dto';
export * from './care-event.dto';
export * from './plan-event.dto';

// ============================================================================
// Specialized Event DTOs
// ============================================================================

/**
 * Health Journey specialized event DTOs
 */
export * from './health-metric-event.dto';
export * from './health-goal-event.dto';

/**
 * Care Journey specialized event DTOs
 */
export * from './appointment-event.dto';
export * from './medication-event.dto';

/**
 * Plan Journey specialized event DTOs
 */
export * from './claim-event.dto';
export * from './benefit-event.dto';