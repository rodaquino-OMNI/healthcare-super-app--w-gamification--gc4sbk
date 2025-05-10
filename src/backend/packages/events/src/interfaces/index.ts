/**
 * @file Event Interfaces Index
 * @description Central export point for all event interface definitions in the package.
 * This barrel file simplifies importing multiple interfaces by providing a single import path.
 * It ensures that consumers can easily access all event-related interfaces without having to
 * know the specific file structure, promoting better code organization and maintainability.
 *
 * @example
 * // Import all event interfaces
 * import { IBaseEvent, IEventHandler, IEventResponse } from '@austa/events/interfaces';
 *
 * // Use interfaces in your code
 * const myEvent: IBaseEvent = { ... };
 */

// -----------------------------------------------
// Base Event Interfaces
// -----------------------------------------------
// Core event structure that all events must implement
export * from './base-event.interface';

// -----------------------------------------------
// Event Processing Interfaces
// -----------------------------------------------
// Contracts for event handlers and processors
export * from './event-handler.interface';
// Standardized response structure for event processing
export * from './event-response.interface';
// Interfaces for event data validation
export * from './event-validation.interface';

// -----------------------------------------------
// Event Versioning Interfaces
// -----------------------------------------------
// Support for event schema evolution over time
export * from './event-versioning.interface';

// -----------------------------------------------
// Journey-Specific Event Interfaces
// -----------------------------------------------
// Type-safe interfaces for Health, Care, and Plan journeys
export * from './journey-events.interface';

// -----------------------------------------------
// Kafka-Specific Event Interfaces
// -----------------------------------------------
// Interfaces for Kafka-based event messaging
export * from './kafka-event.interface';