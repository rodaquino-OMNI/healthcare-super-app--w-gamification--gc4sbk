import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { RetryService } from '@austa/events/utils/retry-utils';
import { CorrelationIdService } from '@austa/events/utils/correlation-id';
import { EventValidator } from '@austa/events/utils/event-validator';
import { EventSerializer } from '@austa/events/utils/event-serializer';
import { JourneyContext } from '@austa/events/utils/journey-context';
import { EventType } from '@austa/events/dto/event-types.enum';
import { GamificationEvent, EventPayload } from '@austa/interfaces/gamification/events';
import { HealthEventPayload, CareEventPayload, PlanEventPayload } from '@austa/interfaces/gamification/events';

/**
 * Utility service for standardized event processing within the gamification engine.
 * Provides methods for event validation, enrichment, transformation, and journey-specific handling.
 */
@Injectable()
export class EventProcessingUtil {
  constructor(
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly retryService: RetryService,
    private readonly correlationService: CorrelationIdService,
    private readonly eventValidator: EventValidator,
    private readonly eventSerializer: EventSerializer,
    private readonly journeyContext: JourneyContext
  ) {}

  /**
   * Validates an event against its schema definition
   * @param event The event to validate
   * @returns A boolean indicating whether the event is valid
   */
  public validateEvent<T extends EventPayload>(event: GamificationEvent<T>): boolean {
    try {
      this.logger.debug(`Validating event: ${event.type}`, { eventId: event.eventId });
      return this.eventValidator.validate(event);
    } catch (error) {
      this.logger.error(`Event validation failed: ${error.message}`, {
        eventId: event.eventId,
        eventType: event.type,
        error
      });
      return false;
    }
  }

  /**
   * Enriches an event with metadata, correlation IDs, and tracking information
   * @param event The event to enrich
   * @returns The enriched event
   */
  public enrichEvent<T extends EventPayload>(event: GamificationEvent<T>): GamificationEvent<T> {
    try {
      // Generate a correlation ID if one doesn't exist
      const correlationId = event.metadata?.correlationId || this.correlationService.generate();
      
      // Create a span for this event processing
      const span = this.tracingService.createSpan('event.process', {
        'event.id': event.eventId,
        'event.type': event.type,
        'event.journey': event.journey,
        'correlation.id': correlationId
      });
      
      // Enrich the event with metadata
      const enriched = {
        ...event,
        metadata: {
          ...event.metadata,
          correlationId,
          processedAt: new Date().toISOString(),
          spanId: span.spanId,
          traceId: span.traceId
        }
      };
      
      this.logger.debug('Event enriched with metadata', { eventId: event.eventId });
      return enriched;
    } catch (error) {
      this.logger.error(`Failed to enrich event: ${error.message}`, {
        eventId: event.eventId,
        eventType: event.type,
        error
      });
      return event; // Return original event if enrichment fails
    }
  }

  /**
   * Processes an event with retry capabilities for resilient event handling
   * @param event The event to process
   * @param processor The function that processes the event
   * @returns The result of the event processing
   */
  public async processWithRetry<T extends EventPayload, R>(
    event: GamificationEvent<T>,
    processor: (event: GamificationEvent<T>) => Promise<R>
  ): Promise<R> {
    return this.retryService.executeWithRetry(
      async () => processor(event),
      {
        retryCount: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
        context: {
          eventId: event.eventId,
          eventType: event.type,
          userId: event.userId
        }
      }
    );
  }

  /**
   * Serializes an event for storage or transmission
   * @param event The event to serialize
   * @returns The serialized event as a string
   */
  public serializeEvent<T extends EventPayload>(event: GamificationEvent<T>): string {
    try {
      return this.eventSerializer.serialize(event);
    } catch (error) {
      this.logger.error(`Failed to serialize event: ${error.message}`, {
        eventId: event.eventId,
        eventType: event.type,
        error
      });
      throw error;
    }
  }

  /**
   * Deserializes an event from a string
   * @param serializedEvent The serialized event string
   * @returns The deserialized event object
   */
  public deserializeEvent<T extends EventPayload>(serializedEvent: string): GamificationEvent<T> {
    try {
      return this.eventSerializer.deserialize<GamificationEvent<T>>(serializedEvent);
    } catch (error) {
      this.logger.error(`Failed to deserialize event: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Determines if an event belongs to the Health journey
   * @param event The event to check
   * @returns True if the event is from the Health journey
   */
  public isHealthEvent<T extends EventPayload>(event: GamificationEvent<T>): event is GamificationEvent<HealthEventPayload> {
    return event.journey === 'health' || this.isHealthEventType(event.type);
  }

  /**
   * Determines if an event belongs to the Care journey
   * @param event The event to check
   * @returns True if the event is from the Care journey
   */
  public isCareEvent<T extends EventPayload>(event: GamificationEvent<T>): event is GamificationEvent<CareEventPayload> {
    return event.journey === 'care' || this.isCareEventType(event.type);
  }

  /**
   * Determines if an event belongs to the Plan journey
   * @param event The event to check
   * @returns True if the event is from the Plan journey
   */
  public isPlanEvent<T extends EventPayload>(event: GamificationEvent<T>): event is GamificationEvent<PlanEventPayload> {
    return event.journey === 'plan' || this.isPlanEventType(event.type);
  }

  /**
   * Checks if an event type belongs to the Health journey
   * @param eventType The event type to check
   * @returns True if the event type is from the Health journey
   */
  public isHealthEventType(eventType: string): boolean {
    return [
      EventType.HEALTH_METRIC_RECORDED,
      EventType.HEALTH_GOAL_CREATED,
      EventType.HEALTH_GOAL_UPDATED,
      EventType.HEALTH_GOAL_ACHIEVED,
      EventType.DEVICE_CONNECTED,
      EventType.DEVICE_SYNCED,
      EventType.HEALTH_INSIGHT_GENERATED
    ].includes(eventType as EventType);
  }

  /**
   * Checks if an event type belongs to the Care journey
   * @param eventType The event type to check
   * @returns True if the event type is from the Care journey
   */
  public isCareEventType(eventType: string): boolean {
    return [
      EventType.APPOINTMENT_BOOKED,
      EventType.APPOINTMENT_COMPLETED,
      EventType.APPOINTMENT_CANCELLED,
      EventType.MEDICATION_TAKEN,
      EventType.MEDICATION_SKIPPED,
      EventType.TELEMEDICINE_SESSION_STARTED,
      EventType.TELEMEDICINE_SESSION_COMPLETED,
      EventType.CARE_PLAN_UPDATED
    ].includes(eventType as EventType);
  }

  /**
   * Checks if an event type belongs to the Plan journey
   * @param eventType The event type to check
   * @returns True if the event type is from the Plan journey
   */
  public isPlanEventType(eventType: string): boolean {
    return [
      EventType.CLAIM_SUBMITTED,
      EventType.CLAIM_APPROVED,
      EventType.CLAIM_REJECTED,
      EventType.BENEFIT_UTILIZED,
      EventType.PLAN_SELECTED,
      EventType.PLAN_COMPARED,
      EventType.REWARD_REDEEMED
    ].includes(eventType as EventType);
  }

  /**
   * Extracts journey-specific context from an event
   * @param event The event to extract context from
   * @returns The journey context object
   */
  public extractJourneyContext<T extends EventPayload>(event: GamificationEvent<T>): Record<string, any> {
    return this.journeyContext.extract(event);
  }

  /**
   * Transforms a legacy event format to the standardized GamificationEvent format
   * @param legacyEvent The legacy event object (from ProcessEventDto)
   * @returns A standardized GamificationEvent object
   */
  public transformLegacyEvent(legacyEvent: {
    type: string;
    userId: string;
    data: any;
    journey?: string;
  }): GamificationEvent<EventPayload> {
    // Generate a unique event ID if not present
    const eventId = crypto.randomUUID();
    
    // Determine the journey if not explicitly provided
    const journey = legacyEvent.journey || this.determineJourneyFromEventType(legacyEvent.type);
    
    // Create a standardized event object
    return {
      eventId,
      type: legacyEvent.type,
      userId: legacyEvent.userId,
      journey,
      timestamp: new Date().toISOString(),
      version: '1.0',
      payload: legacyEvent.data,
      metadata: {
        correlationId: this.correlationService.generate(),
        source: 'gamification-engine',
        transformedFromLegacy: true,
        originalType: legacyEvent.type
      }
    };
  }

  /**
   * Determines the journey from an event type if not explicitly provided
   * @param eventType The event type to analyze
   * @returns The determined journey ('health', 'care', 'plan', or 'unknown')
   */
  private determineJourneyFromEventType(eventType: string): string {
    if (this.isHealthEventType(eventType)) {
      return 'health';
    }
    
    if (this.isCareEventType(eventType)) {
      return 'care';
    }
    
    if (this.isPlanEventType(eventType)) {
      return 'plan';
    }
    
    this.logger.warn(`Could not determine journey for event type: ${eventType}`);
    return 'unknown';
  }
}

/**
 * Type guard to check if an object is a valid GamificationEvent
 * @param obj The object to check
 * @returns True if the object is a GamificationEvent
 */
export function isGamificationEvent(obj: any): obj is GamificationEvent<EventPayload> {
  return (
    obj &&
    typeof obj === 'object' &&
    'eventId' in obj &&
    'type' in obj &&
    'userId' in obj &&
    'timestamp' in obj &&
    'payload' in obj
  );
}

/**
 * Utility function to create a new GamificationEvent
 * @param type The event type
 * @param userId The user ID associated with the event
 * @param payload The event payload data
 * @param journey The journey the event belongs to
 * @returns A new GamificationEvent object
 */
export function createGamificationEvent<T extends EventPayload>(
  type: string,
  userId: string,
  payload: T,
  journey: string
): GamificationEvent<T> {
  return {
    eventId: crypto.randomUUID(),
    type,
    userId,
    journey,
    timestamp: new Date().toISOString(),
    version: '1.0',
    payload,
    metadata: {
      correlationId: crypto.randomUUID(),
      source: 'gamification-engine'
    }
  };
}

/**
 * Utility function to safely extract a value from an event payload
 * @param event The event containing the payload
 * @param path The dot-notation path to the value in the payload
 * @param defaultValue The default value to return if the path doesn't exist
 * @returns The value at the specified path or the default value
 */
export function getPayloadValue<T, D = undefined>(
  event: GamificationEvent<EventPayload>,
  path: string,
  defaultValue?: D
): T | D {
  try {
    const parts = path.split('.');
    let current: any = event.payload;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue as D;
      }
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue as D;
  } catch (error) {
    return defaultValue as D;
  }
}