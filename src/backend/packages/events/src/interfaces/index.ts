/**
 * @file Barrel file for event interfaces
 * @description Exports all event-related interfaces for the @austa/events package.
 * This file provides a centralized export point for all event interfaces,
 * organized by category for better code organization and maintainability.
 */

// Base Event Interfaces
export { 
  IBaseEvent,
  IEventMetadata,
  IEventSource,
  IEventType,
  IEventPayload
} from './base-event.interface';

// Event Versioning Interfaces
export {
  IVersionedEvent,
  EventVersion,
  EventVersioningStrategy,
  EventVersioningRegistry,
  EventTransformer,
  VersionCompatibility,
  VersionString,
  versionToString,
  parseVersion,
  compareVersions
} from './event-versioning.interface';

// Event Validation Interfaces
export {
  IEventValidator,
  ValidationResult,
  ValidationError,
  ValidationSeverity
} from './event-validation.interface';

// Event Processing Interfaces
export {
  IEventHandler,
  EventHandlerResult,
  EventHandlerOptions,
  EventHandlerType
} from './event-handler.interface';

// Event Response Interfaces
export {
  IEventResponse,
  EventResponseStatus,
  EventResponseError,
  EventResponseMetadata
} from './event-response.interface';

// Kafka-specific Event Interfaces
export {
  KafkaEvent,
  KafkaEventHeaders,
  KafkaEventOptions,
  KafkaTopicConfig
} from './kafka-event.interface';

// Journey-specific Event Interfaces
export {
  // Health Journey Events
  HealthJourneyEvent,
  HealthMetricEvent,
  HealthGoalEvent,
  HealthInsightEvent,
  DeviceSyncEvent,
  
  // Care Journey Events
  CareJourneyEvent,
  AppointmentEvent,
  MedicationEvent,
  TelemedicineEvent,
  CarePlanEvent,
  
  // Plan Journey Events
  PlanJourneyEvent,
  ClaimEvent,
  BenefitEvent,
  PlanSelectionEvent,
  RewardRedemptionEvent,
  
  // Cross-Journey Events
  CrossJourneyEvent,
  AchievementEvent,
  UserProgressEvent
} from './journey-events.interface';