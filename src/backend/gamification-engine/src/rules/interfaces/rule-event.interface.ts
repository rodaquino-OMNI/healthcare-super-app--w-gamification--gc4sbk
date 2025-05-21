import { 
  GamificationEvent, 
  EventType, 
  EventVersion,
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload
} from '@austa/interfaces/gamification/events';

/**
 * Interface for rule-specific events in the gamification engine.
 * Extends the base GamificationEvent interface from @austa/interfaces
 * with additional properties specific to rule processing.
 */
export interface IRuleEvent extends GamificationEvent {
  /**
   * Unique identifier for the rule event
   * Used for tracking and debugging rule processing
   */
  eventId?: string;

  /**
   * Metadata specific to rule processing
   * Contains information about the rule evaluation context
   */
  metadata?: IRuleEventMetadata;
}

/**
 * Metadata for rule events
 * Contains additional context for rule processing
 */
export interface IRuleEventMetadata {
  /**
   * Source of the event (which service or component generated it)
   */
  source: EventSource;

  /**
   * Priority level for processing this event
   * Higher priority events are processed first
   */
  priority?: EventPriority;

  /**
   * Additional context data for rule evaluation
   * Can contain journey-specific information
   */
  context?: Record<string, any>;

  /**
   * Correlation ID for tracing related events
   * Used for debugging and monitoring
   */
  correlationId?: string;
}

/**
 * Enum defining the source of events
 * Used for filtering and routing events to appropriate handlers
 */
export enum EventSource {
  HEALTH_JOURNEY = 'health-journey',
  CARE_JOURNEY = 'care-journey',
  PLAN_JOURNEY = 'plan-journey',
  GAMIFICATION = 'gamification',
  USER_ACTION = 'user-action',
  SYSTEM = 'system'
}

/**
 * Enum defining the priority levels for event processing
 * Higher priority events are processed before lower priority ones
 */
export enum EventPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Type guard to check if an event is a health journey event
 * @param event The event to check
 * @returns True if the event is from the health journey
 */
export function isHealthRuleEvent(event: IRuleEvent): event is IRuleEvent & { data: HealthEventPayload } {
  return event.journey === 'health' || 
         (event.metadata?.source === EventSource.HEALTH_JOURNEY) ||
         Object.values(HealthEventTypes).includes(event.type as HealthEventTypes);
}

/**
 * Type guard to check if an event is a care journey event
 * @param event The event to check
 * @returns True if the event is from the care journey
 */
export function isCareRuleEvent(event: IRuleEvent): event is IRuleEvent & { data: CareEventPayload } {
  return event.journey === 'care' || 
         (event.metadata?.source === EventSource.CARE_JOURNEY) ||
         Object.values(CareEventTypes).includes(event.type as CareEventTypes);
}

/**
 * Type guard to check if an event is a plan journey event
 * @param event The event to check
 * @returns True if the event is from the plan journey
 */
export function isPlanRuleEvent(event: IRuleEvent): event is IRuleEvent & { data: PlanEventPayload } {
  return event.journey === 'plan' || 
         (event.metadata?.source === EventSource.PLAN_JOURNEY) ||
         Object.values(PlanEventTypes).includes(event.type as PlanEventTypes);
}

/**
 * Health journey specific event types
 * Subset of EventType enum specific to health journey
 */
export enum HealthEventTypes {
  HEALTH_GOAL_CREATED = EventType.HEALTH_GOAL_CREATED,
  HEALTH_GOAL_UPDATED = EventType.HEALTH_GOAL_UPDATED,
  HEALTH_GOAL_COMPLETED = EventType.HEALTH_GOAL_COMPLETED,
  HEALTH_METRIC_RECORDED = EventType.HEALTH_METRIC_RECORDED,
  DEVICE_CONNECTED = EventType.DEVICE_CONNECTED,
  HEALTH_INSIGHT_VIEWED = EventType.HEALTH_INSIGHT_VIEWED
}

/**
 * Care journey specific event types
 * Subset of EventType enum specific to care journey
 */
export enum CareEventTypes {
  APPOINTMENT_BOOKED = EventType.APPOINTMENT_BOOKED,
  APPOINTMENT_COMPLETED = EventType.APPOINTMENT_COMPLETED,
  MEDICATION_TRACKED = EventType.MEDICATION_TRACKED,
  TELEMEDICINE_SESSION_COMPLETED = EventType.TELEMEDICINE_SESSION_COMPLETED,
  SYMPTOM_CHECKED = EventType.SYMPTOM_CHECKED,
  PROVIDER_RATED = EventType.PROVIDER_RATED
}

/**
 * Plan journey specific event types
 * Subset of EventType enum specific to plan journey
 */
export enum PlanEventTypes {
  CLAIM_SUBMITTED = EventType.CLAIM_SUBMITTED,
  CLAIM_PROCESSED = EventType.CLAIM_PROCESSED,
  BENEFIT_USED = EventType.BENEFIT_USED,
  PLAN_SELECTED = EventType.PLAN_SELECTED,
  DOCUMENT_UPLOADED = EventType.DOCUMENT_UPLOADED,
  COVERAGE_CHECKED = EventType.COVERAGE_CHECKED
}

/**
 * Interface for versioned rule events
 * Used for handling backward compatibility during schema evolution
 */
export interface IVersionedRuleEvent extends IRuleEvent {
  /**
   * The version of the event schema
   * Used for handling backward compatibility
   */
  version: EventVersion;
}

/**
 * Factory function to create a rule event from a gamification event
 * @param event The base gamification event
 * @param source The source of the event
 * @param priority The priority of the event
 * @returns A rule event with metadata
 */
export function createRuleEvent(
  event: GamificationEvent,
  source: EventSource = EventSource.SYSTEM,
  priority: EventPriority = EventPriority.MEDIUM
): IRuleEvent {
  return {
    ...event,
    eventId: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    metadata: {
      source,
      priority,
      correlationId: `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      context: {}
    }
  };
}