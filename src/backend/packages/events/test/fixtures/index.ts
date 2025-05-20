/**
 * @file index.ts
 * @description Barrel file that exports all test fixtures from the events package.
 * This file provides a centralized entry point for accessing test fixtures across
 * all journeys, ensuring consistent test data usage throughout the application.
 */

// Export main fixtures
export * from './base-events';
export * from './care-events';
export * from './event-versions';
export * from './health-events';
export * from './kafka-events';
export * from './plan-events';
export * from './validation-events';

// Export unit test fixtures with namespaces to prevent collisions
import * as BaseEventFixtures from '../unit/fixtures/base-events.fixtures';
import * as CareEventFixtures from '../unit/fixtures/care-events.fixtures';
import * as HealthEventFixtures from '../unit/fixtures/health-events.fixtures';
import * as KafkaEventFixtures from '../unit/fixtures/kafka-events.fixtures';
import * as PlanEventFixtures from '../unit/fixtures/plan-events.fixtures';
import * as ValidationFixtures from '../unit/fixtures/validation.fixtures';
import * as VersionFixtures from '../unit/fixtures/version.fixtures';

// Export DTO mocks with namespaces
import * as CareEventMocks from '../unit/dto/mocks/care-events.mock';
import * as CommonEventMocks from '../unit/dto/mocks/common-events.mock';
import * as EventFactory from '../unit/dto/mocks/event-factory';
import * as HealthEventMocks from '../unit/dto/mocks/health-events.mock';
import * as InvalidEventMocks from '../unit/dto/mocks/invalid-events.mock';
import * as PlanEventMocks from '../unit/dto/mocks/plan-events.mock';
import * as ValidEventMocks from '../unit/dto/mocks/valid-events.mock';

// Export Kafka mocks with namespaces
import * as MockJourneyEvents from '../unit/kafka/mocks/mock-journey-events';
import * as MockKafkaConsumer from '../unit/kafka/mocks/mock-kafka-consumer';
import * as MockKafkaMessage from '../unit/kafka/mocks/mock-kafka-message';
import * as MockKafkaProducer from '../unit/kafka/mocks/mock-kafka-producer';
import * as MockSerializers from '../unit/kafka/mocks/mock-serializers';

// Re-export namespaced fixtures
export {
  // Unit test fixtures
  BaseEventFixtures,
  CareEventFixtures,
  HealthEventFixtures,
  KafkaEventFixtures,
  PlanEventFixtures,
  ValidationFixtures,
  VersionFixtures,
  
  // DTO mocks
  CareEventMocks,
  CommonEventMocks,
  EventFactory,
  HealthEventMocks,
  InvalidEventMocks,
  PlanEventMocks,
  ValidEventMocks,
  
  // Kafka mocks
  MockJourneyEvents,
  MockKafkaConsumer,
  MockKafkaMessage,
  MockKafkaProducer,
  MockSerializers,
};

// Export journey-specific fixture collections for convenience
export const HealthFixtures = {
  events: HealthEventMocks,
  fixtures: HealthEventFixtures,
  mocks: MockJourneyEvents.healthEvents,
};

export const CareFixtures = {
  events: CareEventMocks,
  fixtures: CareEventFixtures,
  mocks: MockJourneyEvents.careEvents,
};

export const PlanFixtures = {
  events: PlanEventMocks,
  fixtures: PlanEventFixtures,
  mocks: MockJourneyEvents.planEvents,
};

// Export validation-specific fixture collections
export const ValidationTestFixtures = {
  valid: ValidEventMocks,
  invalid: InvalidEventMocks,
  fixtures: ValidationFixtures,
};

// Export Kafka-specific fixture collections
export const KafkaTestFixtures = {
  messages: MockKafkaMessage,
  consumer: MockKafkaConsumer,
  producer: MockKafkaProducer,
  serializers: MockSerializers,
  fixtures: KafkaEventFixtures,
};

// Export versioning-specific fixture collections
export const VersioningTestFixtures = {
  fixtures: VersionFixtures,
  events: EventFactory.createVersionedEvents,
};

// Export factory functions for creating custom test fixtures
export const createTestFixture = {
  baseEvent: BaseEventFixtures.createBaseEvent,
  healthEvent: HealthEventFixtures.createHealthEvent,
  careEvent: CareEventFixtures.createCareEvent,
  planEvent: PlanEventFixtures.createPlanEvent,
  kafkaMessage: MockKafkaMessage.createKafkaMessage,
  journeyEvent: EventFactory.createJourneyEvent,
  versionedEvent: EventFactory.createVersionedEvent,
};