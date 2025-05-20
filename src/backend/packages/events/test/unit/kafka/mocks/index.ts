/**
 * @file index.ts
 * @description Barrel file that exports all mock implementations for Kafka testing.
 * 
 * This file provides a centralized export interface for all Kafka mock implementations,
 * simplifying imports in test files and improving maintainability. It exports mock
 * implementations for Kafka consumers, producers, message factories, serializers,
 * and journey-specific event generators.
 */

// ===== KAFKA CONSUMER EXPORTS =====
export { 
  MockKafkaConsumer,
  MockKafkaConsumerConfig,
  TopicPartitionOffset,
  MockMessage
} from './mock-kafka-consumer';

// ===== KAFKA PRODUCER EXPORTS =====
export {
  MockKafkaProducer,
  MockKafkaProducerConfig,
  SentMessageRecord
} from './mock-kafka-producer';

// ===== KAFKA MESSAGE FACTORY EXPORTS =====
export {
  // Interfaces
  IHeaders,
  KafkaMessage,
  KafkaBatch,
  KafkaMessageWithError,
  
  // Basic message factories
  createMockMessage,
  createMockMessageWithHeaders,
  createMockMessageWithTracing,
  createMockBatch,
  createMockBatchWithTracing,
  createMockMessageWithError,
  
  // JSON message utilities
  createMockJsonMessage,
  createMockVersionedJsonMessage,
  deserializeMockJsonMessage,
  
  // Journey-specific message factories
  createMockJourneyMessage,
  createMockInvalidSchemaMessage
} from './mock-kafka-message';

// ===== SERIALIZER EXPORTS =====
export {
  // Interfaces
  MockSerializerOptions,
  SerializationPerformance,
  
  // Schema registry
  MockSchemaRegistry,
  
  // Serializer factories
  createMockJsonSerializer,
  createMockBinarySerializer,
  createMockAvroSerializer,
  createSerializerFactory,
  
  // Enhanced serializers
  createErrorInjectingSerializer,
  createVersionIncompatibleSerializer,
  createPerformanceMeasuringSerializer
} from './mock-serializers';

// ===== JOURNEY EVENT GENERATORS =====
export {
  // Base event generators
  createBaseEvent,
  createVersionedEvent,
  createInvalidEvent,
  
  // Health journey events
  createHealthMetricRecordedEvent,
  createHealthGoalAchievedEvent,
  createHealthDeviceConnectedEvent,
  createHealthInsightGeneratedEvent,
  
  // Care journey events
  createCareAppointmentBookedEvent,
  createCareAppointmentCompletedEvent,
  createCareMedicationTakenEvent,
  createCarePlanTaskCompletedEvent,
  
  // Plan journey events
  createPlanClaimSubmittedEvent,
  createPlanClaimProcessedEvent,
  createPlanBenefitUtilizedEvent,
  createPlanRewardRedeemedEvent,
  
  // Cross-journey events
  createGamificationPointsEarnedEvent,
  createGamificationAchievementUnlockedEvent,
  createCrossJourneyEventSequence,
  createRandomEventBatch
} from './mock-journey-events';