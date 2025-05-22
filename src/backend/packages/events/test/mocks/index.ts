/**
 * @file Centralized exports for all mock implementations in the events/test/mocks directory.
 * 
 * This barrel file provides a clean and organized API for importing mocks into tests,
 * simplifying test setup by exposing all mock classes, interfaces, and utility functions
 * through a single import statement.
 * 
 * @example
 * // Import all mocks from a single entry point
 * import { MockEventBroker, createMockHealthEvent } from '@austa/events/test/mocks';
 * 
 * // Use in tests
 * const broker = new MockEventBroker();
 * const healthEvent = createMockHealthEvent({ userId: '123' });
 */

// ===================================================================
// Event Infrastructure Mocks
// ===================================================================

/**
 * Mock implementation of an event broker for testing event publishing and subscription
 * without requiring an actual Kafka instance.
 */
export { MockEventBroker } from './mock-event-broker';

/**
 * Mock implementation of an event processor for testing the full event processing pipeline
 * from reception to handling.
 */
export { MockEventProcessor } from './mock-event-processor';

/**
 * Factory function to create a pre-configured MockEventBroker instance with common test settings.
 * 
 * @param options - Configuration options for the mock broker
 * @returns A configured MockEventBroker instance
 */
export { createMockEventBroker } from './mock-event-broker';

/**
 * Factory function to create a pre-configured MockEventProcessor instance with common test settings.
 * 
 * @param options - Configuration options for the mock processor
 * @returns A configured MockEventProcessor instance
 */
export { createMockEventProcessor } from './mock-event-processor';

// ===================================================================
// Journey Service Mocks
// ===================================================================

/**
 * Mock implementations for journey-specific services (Health, Care, Plan) that produce
 * and consume events for testing cross-journey event flows.
 */
export { 
  MockHealthJourneyService,
  MockCareJourneyService,
  MockPlanJourneyService,
} from './mock-journey-services';

/**
 * Factory functions to create pre-configured journey service mocks with common test scenarios.
 */
export {
  createMockHealthJourneyService,
  createMockCareJourneyService,
  createMockPlanJourneyService,
} from './mock-journey-services';

// ===================================================================
// Validation & Error Handling Mocks
// ===================================================================

/**
 * Mock implementation of an event validator for testing event payload compliance with schemas.
 */
export { MockEventValidator } from './mock-event-validator';

/**
 * Mock implementation of an error handler for testing error scenarios in event processing.
 */
export { MockErrorHandler } from './mock-error-handler';

/**
 * Factory function to create a pre-configured MockEventValidator instance with common validation rules.
 * 
 * @param options - Configuration options for the mock validator
 * @returns A configured MockEventValidator instance
 */
export { createMockEventValidator } from './mock-event-validator';

/**
 * Factory function to create a pre-configured MockErrorHandler instance with common error scenarios.
 * 
 * @param options - Configuration options for the mock error handler
 * @returns A configured MockErrorHandler instance
 */
export { createMockErrorHandler } from './mock-error-handler';

// ===================================================================
// Storage & Persistence Mocks
// ===================================================================

/**
 * Mock implementation of an event store for testing event persistence and retrieval.
 */
export { MockEventStore } from './mock-event-store';

/**
 * Factory function to create a pre-configured MockEventStore instance with pre-populated events.
 * 
 * @param options - Configuration options for the mock event store
 * @returns A configured MockEventStore instance
 */
export { createMockEventStore } from './mock-event-store';

// ===================================================================
// Event Factory Functions
// ===================================================================

/**
 * Factory functions to create mock events for different journeys with customizable properties.
 * These functions make it easy to create valid test events with minimal configuration.
 */
export {
  // Health Journey Events
  createMockHealthMetricEvent,
  createMockHealthGoalEvent,
  createMockDeviceConnectionEvent,
  
  // Care Journey Events
  createMockAppointmentEvent,
  createMockMedicationEvent,
  createMockTelemedicineEvent,
  createMockTreatmentPlanEvent,
  
  // Plan Journey Events
  createMockClaimEvent,
  createMockBenefitEvent,
  createMockPlanSelectionEvent,
  
  // Base Event
  createMockBaseEvent,
} from './mock-event-factory';

// ===================================================================
// Interfaces
// ===================================================================

/**
 * Interfaces for configuring mock objects and factory functions.
 */
export {
  MockEventBrokerOptions,
  MockEventProcessorOptions,
  MockEventValidatorOptions,
  MockErrorHandlerOptions,
  MockEventStoreOptions,
  MockJourneyServiceOptions,
  MockEventFactoryOptions,
} from './mock-interfaces';

// ===================================================================
// Utilities
// ===================================================================

/**
 * Utility functions for working with mock events in tests.
 */
export {
  mockEventToKafkaMessage,
  kafkaMessageToMockEvent,
  createMockEventMetadata,
  createMockEventResponse,
  createMockValidationResult,
} from './mock-utils';