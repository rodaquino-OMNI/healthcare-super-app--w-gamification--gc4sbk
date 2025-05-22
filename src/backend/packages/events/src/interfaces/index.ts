/**
 * @file Event Interfaces Index
 * @description Central export point for all event interface definitions in the package.
 * This barrel file simplifies importing multiple interfaces by providing a single import path.
 */

// Base Event Interfaces
// These interfaces define the core structure for all events in the system
export * from './base-event.interface';

// Journey-Specific Event Interfaces
// Specialized interfaces for Health, Care, and Plan journeys
export * from './journey-events.interface';

// Event Processing Interfaces
// Interfaces for handling, processing, and responding to events
export * from './event-handler.interface';
export * from './event-response.interface';

// Event Validation Interfaces
// Interfaces for validating event data throughout the processing pipeline
export * from './event-validation.interface';

// Event Versioning Interfaces
// Interfaces for supporting evolution of event schemas over time
export * from './event-versioning.interface';

// Kafka-Specific Event Interfaces
// Interfaces specific to Kafka-based event messaging
export * from './kafka-event.interface';