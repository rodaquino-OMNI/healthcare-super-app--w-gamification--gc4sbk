/**
 * Barrel file that exports all mock implementations for Kafka testing.
 * 
 * This file provides a centralized export interface for all Kafka mock implementations,
 * simplifying imports in test files and improving maintainability.
 */

// ===== MOCK KAFKA CLIENT =====
export {
  // Classes
  MockKafka,
  MockProducer,
  MockConsumer,
  MockAdmin,
  MessageStore,
  
  // Interfaces
  MethodCall,
  MockCallHistory,
  MockResponse,
  MockProducerConfig,
  MockConsumerConfig,
  MockAdminConfig,
  MockKafkaConfig
} from './mock-kafka-client';

// ===== MOCK KAFKA CONSUMER =====
export {
  // Classes
  MockKafkaConsumer,
  
  // Interfaces
  MockKafkaMessage,
  MockKafkaBatch,
  MockEachMessagePayload,
  MockEachBatchPayload,
  MockConsumerRunOptions,
  MockConsumerSubscribeOptions,
  MockConsumerConfig as MockKafkaConsumerConfig,
  RetryOptions,
  OffsetCommitOptions
} from './mock-kafka-consumer';

// ===== MOCK KAFKA PRODUCER =====
export {
  // Classes
  MockKafkaProducer
} from './mock-kafka-producer';

// ===== MOCK KAFKA MESSAGES =====
export {
  // Functions
  createMockKafkaMessage,
  createMockStringMessage,
  createMockJsonMessage,
  createMockSerializedMessage,
  createMockMessageBatch,
  createMockBinaryMessage,
  createMockErrorMessage,
  createMockJourneyEventMessage,
  createMockVersionedEventMessage,
  createMockTracedMessage,
  
  // Interfaces
  KafkaMessageHeaders,
  KafkaMessage,
  BatchContext,
  MockKafkaMessageOptions
} from './mock-kafka-message';

// ===== MOCK SERIALIZERS =====
export {
  // Functions
  mockJsonSerializer,
  mockJsonDeserializer,
  mockAvroSerializer,
  mockAvroDeserializer,
  createEventValidator,
  createEventSerializers,
  testBackwardCompatibility,
  benchmarkSerializer,
  
  // Classes
  MockSchemaRegistry,
  
  // Interfaces
  MockSerializerOptions,
  SerializationResult
} from './mock-serializers';

// ===== MOCK JOURNEY EVENTS =====
export {
  // Health Journey Event Generators
  createHealthMetricRecordedEvent,
  createHealthGoalAchievedEvent,
  createDeviceConnectedEvent,
  
  // Care Journey Event Generators
  createAppointmentBookedEvent,
  createMedicationAdherenceEvent,
  createTelemedicineSessionEvent,
  createTreatmentPlanUpdatedEvent,
  
  // Plan Journey Event Generators
  createClaimSubmittedEvent,
  createBenefitUtilizedEvent,
  createDocumentUploadedEvent,
  createCoverageCheckedEvent,
  
  // Base Event Generators
  createBaseEvent,
  
  // Invalid Event Generators
  createInvalidEventMissingFields,
  createInvalidEventWrongTypes,
  createInvalidEventUnsupportedJourney,
  createInvalidEventUnsupportedVersion,
  
  // Versioned Event Generators
  createVersionedEvent,
  createHealthMetricRecordedEventV1,
  createHealthMetricRecordedEventV2,
  
  // Interfaces
  BaseEvent,
  UserContext,
  MockEventOptions
} from './mock-journey-events';