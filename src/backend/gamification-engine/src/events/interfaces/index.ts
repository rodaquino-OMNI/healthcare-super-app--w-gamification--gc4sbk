/**
 * @file index.ts
 * @description Barrel file that exports all event interfaces from the folder, providing a single entry point
 * for importing event-related interfaces. Simplifies imports and ensures consistent usage patterns
 * throughout the codebase.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Integrate with @austa/interfaces package for standardized schema definitions
 * - Create proper export patterns for interfaces and utilities
 *
 * @example
 * // Import all event interfaces
 * import * as EventInterfaces from './events/interfaces';
 *
 * @example
 * // Import specific interfaces
 * import { IEvent, IBaseEvent, GamificationEvent } from './events/interfaces';
 *
 * @example
 * // Import journey-specific interfaces
 * import { IHealthEvent, ICareEvent, IPlanEvent } from './events/interfaces';
 *
 * @example
 * // Import type guards
 * import { isHealthEvent, isCareEvent, isPlanEvent } from './events/interfaces';
 */

// Re-export interfaces from @austa/interfaces package for standardized schema definitions
import * as GamificationInterfaces from '@austa/interfaces/gamification';

// Export the gamification interfaces namespace for selective importing
export { GamificationInterfaces };

// Export core event interfaces
export {
  IEvent,
  IBaseEvent,
  IEventPayload,
  GamificationEvent,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  ISystemEvent,
  IHealthEventData,
  ICareEventData,
  IPlanEventData,
  ISystemEventData,
  // Type guards
  isHealthEvent,
  isCareEvent,
  isPlanEvent,
  isSystemEvent,
  // Utility functions
  createEvent,
  fromProcessEventDto,
  toBaseEvent
} from './event.interface';

// Export event type interfaces
export {
  IEventType,
  IHealthEventType,
  ICareEventType,
  IPlanEventType,
  ICommonEventType,
  EventType,
  IEventTypeValidator,
  // Event type enums
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
  EventTypeId,
  // Type guards
  isHealthEventType,
  isCareEventType,
  isPlanEventType,
  isCommonEventType,
  isHealthEventTypeId,
  isCareEventTypeId,
  isPlanEventTypeId,
  isCommonEventTypeId,
  isEventTypeId,
  // Utility functions
  getEventTypeEnumForJourney,
  getJourneyForEventTypeId,
  // Event payload interfaces
  IHealthMetricRecordedPayload,
  IGoalAchievedPayload,
  IAppointmentBookedPayload,
  IClaimSubmittedPayload,
  // Registry interface
  IEventTypeRegistry,
  // Version interfaces
  IEventTypeVersion,
  createEventTypeVersion,
  compareEventTypeVersions,
  isCompatibleEventTypeVersion
} from './event-type.interface';

// Export event versioning interfaces
export {
  IEventVersion,
  IVersionedEvent,
  IEventTransformer,
  IEventMigration,
  IEventSchemaRegistry,
  // Utility functions
  parseVersion,
  compareVersions
} from './event-versioning.interface';

// Export journey-specific event interfaces
export {
  IJourneyEvent,
  // Health journey
  HealthEventType as HealthJourneyEventType,
  IHealthMetricRecordedPayload as IHealthMetricRecordedEventPayload,
  IGoalAchievedPayload as IGoalAchievedEventPayload,
  IGoalProgressUpdatedPayload,
  IDeviceConnectedPayload,
  IHealthInsightGeneratedPayload,
  HealthEventPayload,
  IHealthEvent as IJourneyHealthEvent,
  // Care journey
  CareEventType as CareJourneyEventType,
  IAppointmentBookedPayload as IAppointmentBookedEventPayload,
  IAppointmentCompletedPayload,
  IMedicationTakenPayload,
  IMedicationAdherenceStreakPayload,
  ITelemedicineSessionCompletedPayload,
  ISymptomCheckedPayload,
  CareEventPayload,
  ICareEvent as IJourneyCareEvent,
  // Plan journey
  PlanEventType as PlanJourneyEventType,
  IClaimSubmittedPayload as IClaimSubmittedEventPayload,
  IClaimApprovedPayload,
  IBenefitUtilizedPayload,
  IPlanSelectedPayload,
  IDocumentUploadedPayload,
  PlanEventPayload,
  IPlanEvent as IJourneyPlanEvent,
  // Union type and type guards
  JourneyEvent,
  isHealthEvent as isJourneyHealthEvent,
  isCareEvent as isJourneyCareEvent,
  isPlanEvent as isJourneyPlanEvent,
  // Utility mapping
  eventTypeToJourney
} from './journey-events.interface';

// Export event handler interfaces
export {
  IEventHandler,
  IJourneyEventHandler,
  IEventProcessor,
  IRuleEvaluator,
  IRuleEvaluationResult,
  IRule,
  IAchievementTracker,
  IQuestProgress as IHandlerQuestProgress,
  IQuestTracker,
  INotificationDelivery,
  IRetryPolicy,
  IExponentialBackoffRetryPolicy,
  IDeadLetterQueueHandler
} from './event-handler.interface';

// Export event response interfaces
export {
  IEventResponse,
  IEventSuccess,
  IEventError,
  IAchievementUnlocked,
  IQuestProgress,
  IRewardEarned,
  IHealthEventSuccess,
  ICareEventSuccess,
  IPlanEventSuccess,
  // Type guards
  isEventSuccess,
  isEventError,
  // Utility functions
  createSuccessResponse,
  createErrorResponse
} from './event-response.interface';

/**
 * Utility type to extract event payload based on event type
 */
export type EventPayloadType<T extends IEvent> = T extends IHealthEvent
  ? IHealthEventData
  : T extends ICareEvent
  ? ICareEventData
  : T extends IPlanEvent
  ? IPlanEventData
  : T extends ISystemEvent
  ? ISystemEventData
  : Record<string, any>;

/**
 * Utility type to extract journey from event type
 */
export type EventJourneyType<T extends IEvent> = T extends IHealthEvent
  ? 'health'
  : T extends ICareEvent
  ? 'care'
  : T extends IPlanEvent
  ? 'plan'
  : undefined;

/**
 * Utility type to filter events by journey
 */
export type EventsByJourney<T extends IEvent, J extends string | undefined> = T extends { journey: infer U }
  ? U extends J
    ? T
    : never
  : J extends undefined
  ? T
  : never;

/**
 * Utility type to filter events by type
 */
export type EventsByType<T extends IEvent, E extends EventTypeId> = T extends { type: infer U }
  ? U extends E
    ? T
    : never
  : never;

/**
 * Utility function to create a typed event handler
 * @param handler The event handler implementation
 * @returns A typed event handler
 */
export function createTypedEventHandler<T extends IEvent>(
  handler: IEventHandler<T>
): IEventHandler<T> {
  return handler;
}

/**
 * Utility function to create a typed journey event handler
 * @param journey The journey this handler is responsible for
 * @param handler The journey event handler implementation
 * @returns A typed journey event handler
 */
export function createJourneyEventHandler<T extends JourneyEvent>(
  journey: 'health' | 'care' | 'plan',
  handler: Omit<IJourneyEventHandler<T>, 'journey'>
): IJourneyEventHandler<T> {
  return {
    ...handler,
    journey
  };
}