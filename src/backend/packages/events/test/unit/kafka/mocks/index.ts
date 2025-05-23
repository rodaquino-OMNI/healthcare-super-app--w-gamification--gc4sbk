/**
 * @file index.ts
 * @description Barrel file that exports all mock implementations for Kafka testing from a single entry point.
 * This file simplifies importing Kafka mocks in test files by providing a centralized export interface.
 */

// Export from mock-kafka-client.ts
export {
  MockKafkaClient,
  MockKafkaClientConfig,
  MockProducer,
  MockConsumer,
  MockAdmin
} from './mock-kafka-client';

// Export from mock-kafka-consumer.ts
export {
  MockKafkaConsumer,
  MockKafkaConsumerOptions
} from './mock-kafka-consumer';

// Export from mock-kafka-producer.ts
export {
  MockKafkaProducer,
  MockKafkaProducerOptions,
  createMockKafkaProducer
} from './mock-kafka-producer';

// Export from mock-kafka-message.ts
export {
  MockKafkaMessageOptions,
  createMockKafkaMessage,
  createMockEventMessage,
  createMockSerializedEventMessage,
  createMockVersionedEventMessage,
  createMockKafkaMessageBatch,
  createMockEventMessageBatch,
  createMockKafkaMessageWithTracing,
  createMockCorruptedMessage,
  createMockInvalidEventMessage,
  createMockErrorScenarioMessage,
  createMockRetryMessage,
  createMockDLQMessage
} from './mock-kafka-message';

// Export from mock-serializers.ts
export {
  MockSerializerOptions,
  SerializationResult,
  DeserializationResult,
  MockSerializationError,
  createMockJsonSerializer,
  createMockJsonDeserializer,
  createMockAvroSerializer,
  createMockAvroDeserializer,
  createMockMultiFormatSerializer,
  createMockMultiFormatDeserializer,
  createMockKafkaMessage as createMockSerializedKafkaMessage,
  createMockEventMessage as createMockSerializedEventMessage,
  createMockSerializedEventMessage as createMockFullySerializedEventMessage,
  createMockSchemaRegistry,
  createMockSchemaValidator,
  createMockPerformanceMonitor
} from './mock-serializers';

// Export from mock-journey-events.ts
export {
  // Helper functions
  mockTimestamp,
  mockVersion,
  mockMetadata,
  mockUsers,
  
  // Health journey events
  mockHealthMetricRecordedEvent,
  mockHealthGoalCreatedEvent,
  mockHealthGoalAchievedEvent,
  mockHealthDeviceConnectedEvent,
  mockHealthDeviceSyncedEvent,
  
  // Care journey events
  mockCareAppointmentBookedEvent,
  mockCareAppointmentCompletedEvent,
  mockCareMedicationAddedEvent,
  mockCareMedicationAdherenceStreakEvent,
  mockCareTelemedicineSessionCompletedEvent,
  
  // Plan journey events
  mockPlanClaimSubmittedEvent,
  mockPlanClaimApprovedEvent,
  mockPlanBenefitUtilizedEvent,
  mockPlanDocumentUploadedEvent,
  
  // Invalid events for testing
  mockInvalidEvent,
  mockInvalidVersionEvent,
  mockUnknownEventTypeEvent,
  
  // Cross-journey event correlation
  mockCorrelatedEvents,
  mockUserJourneyFlow,
  mockVersionedEvents
} from './mock-journey-events';