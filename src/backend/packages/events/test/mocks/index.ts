/**
 * @file index.ts
 * @description Centralized exports for all mock implementations in the events/test/mocks directory.
 * This barrel file provides a clean and organized API for importing mocks into tests,
 * simplifying test setup and improving readability and maintainability.
 */

// Import all mock implementations
import * as MockEventBroker from './mock-event-broker';
import * as MockEventProcessor from './mock-event-processor';
import * as MockEventStore from './mock-event-store';
import * as MockEventValidator from './mock-event-validator';
import * as MockErrorHandler from './mock-error-handler';
import * as MockJourneyServices from './mock-journey-services';

// Re-export all mocks by category

/**
 * Event Broker Mocks
 * 
 * Provides mock implementations for the event broker system that simulates
 * the publish/subscribe pattern for testing event-driven communication.
 * 
 * @example
 * ```typescript
 * import { EventBroker } from '@austa/events/test/mocks';
 * 
 * const broker = EventBroker.createMockBroker();
 * broker.publish('topic', { eventType: 'TEST_EVENT', payload: {} });
 * ```
 */
export const EventBroker = {
  ...MockEventBroker,
};

/**
 * Event Processor Mocks
 * 
 * Provides mock implementations for the event processing pipeline
 * that simulates the full event processing flow from reception to handling.
 * 
 * @example
 * ```typescript
 * import { EventProcessor } from '@austa/events/test/mocks';
 * 
 * const processor = new EventProcessor.MockEventProcessor({
 *   validateEvents: true,
 *   asyncProcessing: true,
 *   processingDelayRange: [10, 50],
 * });
 * ```
 */
export const EventProcessor = {
  ...MockEventProcessor,
  /**
   * Creates a new MockEventProcessor with the specified options
   * 
   * @param options Configuration options for the processor
   * @returns A configured MockEventProcessor instance
   */
  createMockProcessor: (options?: MockEventProcessor.MockEventProcessorOptions) => {
    return new MockEventProcessor.MockEventProcessor(options);
  }
};

/**
 * Event Store Mocks
 * 
 * Provides an in-memory event storage mechanism for testing
 * event persistence and retrieval without requiring a database.
 * 
 * @example
 * ```typescript
 * import { EventStore } from '@austa/events/test/mocks';
 * 
 * const store = EventStore.createInMemoryStore();
 * await store.saveEvent({ eventType: 'TEST_EVENT', payload: {} });
 * const events = await store.findEvents({ eventType: 'TEST_EVENT' });
 * ```
 */
export const EventStore = {
  ...MockEventStore,
};

/**
 * Event Validator Mocks
 * 
 * Provides a validation framework for testing event payload
 * compliance with schemas for each journey and event type.
 * 
 * @example
 * ```typescript
 * import { EventValidator } from '@austa/events/test/mocks';
 * 
 * const validator = EventValidator.createValidator();
 * const result = validator.validate('HEALTH_METRIC_RECORDED', payload);
 * expect(result.isValid).toBe(true);
 * ```
 */
export const EventValidator = {
  ...MockEventValidator,
};

/**
 * Error Handler Mocks
 * 
 * Implements a configurable error handling framework for testing
 * error scenarios in event processing, including retry policies.
 * 
 * @example
 * ```typescript
 * import { ErrorHandler } from '@austa/events/test/mocks';
 * 
 * const handler = ErrorHandler.createMockErrorHandler({
 *   retryPolicy: 'exponential',
 *   maxRetries: 3,
 * });
 * ```
 */
export const ErrorHandler = {
  ...MockErrorHandler,
};

/**
 * Journey Services Mocks
 * 
 * Provides mock implementations for journey-specific services
 * (Health, Care, Plan) that produce and consume events.
 * 
 * @example
 * ```typescript
 * import { JourneyServices } from '@austa/events/test/mocks';
 * 
 * const healthService = JourneyServices.createHealthService();
 * await healthService.recordMetric(userId, {
 *   type: 'HEART_RATE',
 *   value: 75,
 *   unit: 'bpm',
 * });
 * ```
 */
export const JourneyServices = {
  ...MockJourneyServices,
};

/**
 * Factory Functions
 * 
 * Convenience functions for creating common test scenarios with
 * pre-configured mock implementations.
 */

/**
 * Creates a complete mock event testing environment with all components
 * pre-configured and connected to each other.
 * 
 * @param options Configuration options for the test environment
 * @returns An object containing all mock implementations
 * 
 * @example
 * ```typescript
 * import { createTestEnvironment } from '@austa/events/test/mocks';
 * 
 * const {
 *   broker,
 *   processor,
 *   store,
 *   validator,
 *   errorHandler,
 *   healthService,
 *   careService,
 *   planService,
 * } = createTestEnvironment();
 * 
 * // Use the pre-configured environment for testing
 * await healthService.recordMetric(userId, { type: 'HEART_RATE', value: 75 });
 * expect(broker.getPublishedEvents()).toHaveLength(1);
 * ```
 */
export function createTestEnvironment(options: TestEnvironmentOptions = {}) {
  // This will be implemented when the actual mock files are created
  // For now, we're just defining the interface
  return {
    broker: EventBroker.createMockBroker(options.brokerOptions),
    processor: EventProcessor.createMockProcessor(options.processorOptions),
    store: EventStore.createInMemoryStore(options.storeOptions),
    validator: EventValidator.createValidator(options.validatorOptions),
    errorHandler: ErrorHandler.createMockErrorHandler(options.errorHandlerOptions),
    healthService: JourneyServices.createHealthService(options.healthServiceOptions),
    careService: JourneyServices.createCareService(options.careServiceOptions),
    planService: JourneyServices.createPlanService(options.planServiceOptions),
  };
}

/**
 * Creates a mock event broker with pre-registered topics and subscriptions
 * for testing event publishing and subscription.
 * 
 * @param topics List of topics to pre-register
 * @returns A configured mock event broker
 * 
 * @example
 * ```typescript
 * import { createMockBrokerWithTopics } from '@austa/events/test/mocks';
 * 
 * const broker = createMockBrokerWithTopics([
 *   'health.metrics',
 *   'care.appointments',
 *   'plan.claims',
 * ]);
 * 
 * broker.publish('health.metrics', { eventType: 'HEART_RATE_RECORDED', payload: {} });
 * ```
 */
export function createMockBrokerWithTopics(topics: string[]) {
  // This will be implemented when the actual mock files are created
  // For now, we're just defining the interface
  return EventBroker.createMockBroker({ topics });
}

/**
 * Creates a mock event processor with pre-configured handlers for
 * specific event types.
 * 
 * @param handlers Map of event types to handler functions
 * @returns A configured mock event processor
 * 
 * @example
 * ```typescript
 * import { createMockProcessorWithHandlers } from '@austa/events/test/mocks';
 * 
 * const processor = createMockProcessorWithHandlers({
 *   'HEART_RATE_RECORDED': (event) => {
 *     console.log('Processing heart rate event:', event);
 *     return { success: true };
 *   },
 * });
 * ```
 */
export function createMockProcessorWithHandlers(handlers: Record<string, (event: any) => any>) {
  // Convert the handlers record to an array of IEventHandler implementations
  const handlerImplementations = Object.entries(handlers).map(([eventType, handlerFn]) => {
    return {
      handle: handlerFn,
      canHandle: (event: any) => event.type === eventType,
      getEventType: () => eventType
    };
  });
  
  return EventProcessor.createMockProcessor({ handlers: handlerImplementations });
}

// Type definitions

/**
 * Options for configuring the test environment
 */
export interface TestEnvironmentOptions {
  /**
   * Options for configuring the mock event broker
   */
  brokerOptions?: any;
  
  /**
   * Options for configuring the mock event processor
   */
  processorOptions?: MockEventProcessor.MockEventProcessorOptions;
  
  /**
   * Options for configuring the mock event store
   */
  storeOptions?: any;
  
  /**
   * Options for configuring the mock event validator
   */
  validatorOptions?: any;
  
  /**
   * Options for configuring the mock error handler
   */
  errorHandlerOptions?: any;
  
  /**
   * Options for configuring the mock health service
   */
  healthServiceOptions?: any;
  
  /**
   * Options for configuring the mock care service
   */
  careServiceOptions?: any;
  
  /**
   * Options for configuring the mock plan service
   */
  planServiceOptions?: any;
}

// Export everything from each mock file for direct access if needed
export * from './mock-event-broker';
export * from './mock-event-processor';
export * from './mock-event-store';
export * from './mock-event-validator';
export * from './mock-error-handler';
export * from './mock-journey-services';