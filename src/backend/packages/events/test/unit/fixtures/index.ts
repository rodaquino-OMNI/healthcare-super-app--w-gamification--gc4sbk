/**
 * @file Central barrel file that exports all event test fixtures for unit testing.
 * 
 * This file provides a single import point for accessing mock events, validation test cases,
 * Kafka message fixtures, and versioning test data. It simplifies test setup by organizing
 * fixtures into logical categories and ensuring consistent test data across the events package.
 */

// Base event fixtures
export * from './base-events.fixtures';

// Journey-specific event fixtures
export * from './health-events.fixtures';
export * from './care-events.fixtures';
export * from './plan-events.fixtures';

// Kafka integration fixtures
export * from './kafka-events.fixtures';

// Validation and versioning fixtures
export * from './validation.fixtures';
export * from './version.fixtures';

/**
 * Convenience namespace for organizing fixtures by journey
 */
export namespace JourneyFixtures {
  export * as Health from './health-events.fixtures';
  export * as Care from './care-events.fixtures';
  export * as Plan from './plan-events.fixtures';
}

/**
 * Convenience namespace for organizing fixtures by category
 */
export namespace CategoryFixtures {
  export * as Base from './base-events.fixtures';
  export * as Kafka from './kafka-events.fixtures';
  export * as Validation from './validation.fixtures';
  export * as Version from './version.fixtures';
}

/**
 * Re-export common test utilities and helpers
 * 
 * These utilities help with creating dynamic test fixtures and
 * simplifying test setup for event-related tests.
 */
export {
  createMockEvent,
  createMockKafkaMessage,
  createMockEventWithMetadata,
  createVersionedEvent,
} from './base-events.fixtures';

/**
 * Example usage:
 * 
 * ```typescript
 * // Import all fixtures
 * import * as fixtures from '@austa/events/test/unit/fixtures';
 * 
 * // Import specific journey fixtures
 * import { JourneyFixtures } from '@austa/events/test/unit/fixtures';
 * 
 * describe('Health Event Tests', () => {
 *   it('should process health metric events', () => {
 *     const event = JourneyFixtures.Health.createHealthMetricEvent();
 *     // Test with the fixture
 *   });
 * });
 * 
 * // Import specific category fixtures
 * import { CategoryFixtures } from '@austa/events/test/unit/fixtures';
 * 
 * describe('Kafka Consumer Tests', () => {
 *   it('should deserialize kafka messages', () => {
 *     const message = CategoryFixtures.Kafka.createConsumerRecord();
 *     // Test with the fixture
 *   });
 * });
 * 
 * // Import utility functions directly
 * import { createMockEvent } from '@austa/events/test/unit/fixtures';
 * 
 * describe('Event Handler Tests', () => {
 *   it('should handle custom events', () => {
 *     const event = createMockEvent({ type: 'custom-event' });
 *     // Test with the fixture
 *   });
 * });
 * ```
 */