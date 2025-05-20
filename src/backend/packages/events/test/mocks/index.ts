/**
 * @file index.ts
 * @description Centralized exports for all mock implementations in the events/test/mocks directory.
 * This barrel file provides a clean and organized API for importing mocks into tests,
 * simplifying test setup and improving readability and maintainability.
 *
 * @example
 * // Import all mocks from a single entry point
 * import { MockEventBroker, MockEventProcessor, createMockHealthJourneyService } from '@austa/events/test/mocks';
 *
 * // Use factory functions for common test scenarios
 * const mockBroker = createMockEventBroker({ simulateErrors: true });
 */

// Journey Service Mocks
import {
  MockHealthJourneyService,
  MockCareJourneyService,
  MockPlanJourneyService,
  createMockHealthJourneyService,
  createMockCareJourneyService,
  createMockPlanJourneyService,
  JourneyServiceMockOptions,
  HealthJourneyEventPayload,
  CareJourneyEventPayload,
  PlanJourneyEventPayload,
} from './mock-journey-services';

// Event Processing Mocks
import {
  MockEventProcessor,
  createMockEventProcessor,
  EventProcessorMockOptions,
  EventProcessingResult,
  EventProcessingMetrics,
} from './mock-event-processor';

// Event Broker Mocks
import {
  MockEventBroker,
  createMockEventBroker,
  EventBrokerMockOptions,
  TopicSubscription,
  MessageDeliveryStatus,
} from './mock-event-broker';

// Event Store Mocks
import {
  MockEventStore,
  createMockEventStore,
  EventStoreMockOptions,
  EventQuery,
  EventAggregation,
} from './mock-event-store';

// Event Validation Mocks
import {
  MockEventValidator,
  createMockEventValidator,
  EventValidatorMockOptions,
  ValidationResult,
  SchemaVersion,
} from './mock-event-validator';

// Error Handling Mocks
import {
  MockErrorHandler,
  createMockErrorHandler,
  ErrorHandlerMockOptions,
  RetryPolicy,
  ErrorCategory,
  DeadLetterQueueEntry,
} from './mock-error-handler';

/**
 * Journey Service Mocks
 * @description Mock implementations for journey-specific services (Health, Care, Plan)
 * that produce and consume events. These mocks allow testing of cross-journey event
 * flows and gamification integration without requiring the actual microservices.
 */
export {
  // Classes
  MockHealthJourneyService,
  MockCareJourneyService,
  MockPlanJourneyService,
  
  // Factory Functions
  createMockHealthJourneyService,
  createMockCareJourneyService,
  createMockPlanJourneyService,
  
  // Types
  JourneyServiceMockOptions,
  HealthJourneyEventPayload,
  CareJourneyEventPayload,
  PlanJourneyEventPayload,
};

/**
 * Event Processing Mocks
 * @description Mock implementation of the event processing pipeline for testing.
 * Simulates the full event processing flow from reception to handling, allowing
 * tests to verify event transformations, validation, and routing.
 */
export {
  // Classes
  MockEventProcessor,
  
  // Factory Functions
  createMockEventProcessor,
  
  // Types
  EventProcessorMockOptions,
  EventProcessingResult,
  EventProcessingMetrics,
};

/**
 * Event Broker Mocks
 * @description In-memory event broker that simulates the publish/subscribe pattern
 * for testing event-driven communication between services. Supports topics,
 * subscriptions, and message routing without requiring an actual Kafka instance.
 */
export {
  // Classes
  MockEventBroker,
  
  // Factory Functions
  createMockEventBroker,
  
  // Types
  EventBrokerMockOptions,
  TopicSubscription,
  MessageDeliveryStatus,
};

/**
 * Event Store Mocks
 * @description In-memory event storage mechanism for testing event persistence
 * and retrieval. Simulates database operations for storing, querying, and
 * retrieving events without requiring an actual database connection.
 */
export {
  // Classes
  MockEventStore,
  
  // Factory Functions
  createMockEventStore,
  
  // Types
  EventStoreMockOptions,
  EventQuery,
  EventAggregation,
};

/**
 * Event Validation Mocks
 * @description Validation framework for testing event payload compliance with schemas.
 * Allows tests to verify that events conform to the expected structure for each
 * journey and event type without requiring the full validation pipeline.
 */
export {
  // Classes
  MockEventValidator,
  
  // Factory Functions
  createMockEventValidator,
  
  // Types
  EventValidatorMockOptions,
  ValidationResult,
  SchemaVersion,
};

/**
 * Error Handling Mocks
 * @description Configurable error handling framework for testing error scenarios
 * in event processing. Allows tests to simulate various error conditions, retry
 * policies, and recovery mechanisms without triggering actual failures.
 */
export {
  // Classes
  MockErrorHandler,
  
  // Factory Functions
  createMockErrorHandler,
  
  // Types
  ErrorHandlerMockOptions,
  RetryPolicy,
  ErrorCategory,
  DeadLetterQueueEntry,
};

/**
 * Convenience function to create a complete mock environment for event testing.
 * @param options Configuration options for the mock environment
 * @returns An object containing all necessary mock instances for comprehensive event testing
 */
export function createMockEventTestEnvironment(options: {
  simulateErrors?: boolean;
  validateEvents?: boolean;
  trackMetrics?: boolean;
  persistEvents?: boolean;
}) {
  return {
    broker: createMockEventBroker({ simulateErrors: options.simulateErrors }),
    processor: createMockEventProcessor({ trackMetrics: options.trackMetrics }),
    validator: createMockEventValidator({ active: options.validateEvents }),
    errorHandler: createMockErrorHandler(),
    eventStore: createMockEventStore({ active: options.persistEvents }),
    healthJourney: createMockHealthJourneyService(),
    careJourney: createMockCareJourneyService(),
    planJourney: createMockPlanJourneyService(),
  };
}