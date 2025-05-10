/**
 * @file Event DTO Barrel File
 * @description Centralizes exports for all event DTOs in a single entry point.
 * This file provides a clean public API for the events/dto module, simplifying
 * imports and maintaining consistent access patterns for consumers.
 *
 * @example
 * // Import all event DTOs
 * import * as EventDTOs from '@austa/events/dto';
 *
 * // Import specific DTOs
 * import { BaseEventDto, EventTypes } from '@austa/events/dto';
 *
 * // Import journey-specific DTOs
 * import { HealthEventDto, HealthMetricEventDto } from '@austa/events/dto';
 */

/**
 * Base/Core DTOs
 * These DTOs provide the foundation for all event types in the system.
 */
export * from './base-event.dto';
export * from './event-metadata.dto';
export * from './event-types.enum';
export * from './version.dto';
export * from './validation';

/**
 * Journey-specific DTOs
 * These DTOs extend the base event with journey-specific validation and properties.
 */
export * from './health-event.dto';
export * from './care-event.dto';
export * from './plan-event.dto';

/**
 * Specialized Event DTOs
 * These DTOs provide detailed validation and structure for specific event types.
 */

// Health Journey
export * from './health-metric-event.dto';
export * from './health-goal-event.dto';

// Care Journey
export * from './appointment-event.dto';
export * from './medication-event.dto';

// Plan Journey
export * from './claim-event.dto';
export * from './benefit-event.dto';