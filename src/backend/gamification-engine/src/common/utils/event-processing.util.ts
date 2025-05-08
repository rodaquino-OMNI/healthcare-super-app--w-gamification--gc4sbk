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
import { ValidationUtil, isValidGamificationEvent } from './validation.util';
import { z } from 'zod';

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
    private readonly journeyContext: JourneyContext,
    private readonly validationUtil: ValidationUtil
  ) {}

  /**
   * Validates an event against its schema definition
   * @param event The event to validate
   * @returns A boolean indicating whether the event is valid
   */
  public validateEvent<T extends EventPayload>(event: GamificationEvent<T>): boolean {
    try {
      this.logger.debug(`Validating event: ${event.type}`, { eventId: event.eventId });
      
      // First validate with the generic event validator
      const isValidGeneric = this.eventValidator.validate(event);
      if (!isValidGeneric) {
        this.logger.warn('Event failed generic validation', { eventId: event.eventId });
        return false;
      }
      
      // Then validate with our gamification-specific validator
      return this.validationUtil.validateEvent(event);
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
    // Validate the event before extracting context
    if (!this.validateEvent(event)) {
      this.logger.warn('Extracting context from invalid event', { eventId: event.eventId });
    }
    
    const context = this.journeyContext.extract(event);
    
    // Validate the extracted context
    this.validateJourneyContext(context, event.journey);
    
    return context;
  }
  
  /**
   * Validates journey context data
   * @param context The journey context to validate
   * @param journey The journey the context belongs to
   * @returns True if the context is valid for the journey
   */
  private validateJourneyContext(context: Record<string, any>, journey: string): boolean {
    if (!context || typeof context !== 'object') {
      this.logger.warn('Journey context is not an object', { journey });
      return false;
    }
    
    // Basic validation based on journey type
    if (journey === 'health' && !context.healthProfile) {
      this.logger.warn('Health journey context missing healthProfile', { journey });
      return false;
    }
    
    if (journey === 'care' && !context.careProfile) {
      this.logger.warn('Care journey context missing careProfile', { journey });
      return false;
    }
    
    if (journey === 'plan' && !context.planProfile) {
      this.logger.warn('Plan journey context missing planProfile', { journey });
      return false;
    }
    
    return true;
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
    
    // Validate the payload data based on journey type
    this.validateLegacyEventData(legacyEvent.data, legacyEvent.type, journey);
    
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
   * Validates legacy event data based on journey type and event type
   * @param data The event data to validate
   * @param eventType The type of the event
   * @param journey The journey the event belongs to
   * @returns True if the data is valid for the event type and journey
   */
  private validateLegacyEventData(data: any, eventType: string, journey: string): boolean {
    if (!data || typeof data !== 'object') {
      this.logger.warn('Legacy event data is not an object', { eventType, journey });
      return false;
    }
    
    // Create a mock event to validate with our journey-specific validators
    const mockEvent: GamificationEvent<EventPayload> = {
      eventId: 'validation-check',
      type: eventType,
      userId: 'validation-user',
      journey,
      timestamp: new Date().toISOString(),
      version: '1.0',
      payload: data,
      metadata: {}
    };
    
    // Use our validation utility to validate the event
    let isValid = false;
    
    if (journey === 'health') {
      isValid = this.validationUtil.isValidHealthEventPayload(data, eventType);
    } else if (journey === 'care') {
      isValid = this.validationUtil.isValidCareEventPayload(data, eventType);
    } else if (journey === 'plan') {
      isValid = this.validationUtil.isValidPlanEventPayload(data, eventType);
    }
    
    if (!isValid) {
      this.logger.warn('Legacy event data failed validation', { eventType, journey });
    }
    
    return isValid;
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
  return isValidGamificationEvent(obj);
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
 * @param schema Optional Zod schema to validate the extracted value
 * @returns The value at the specified path or the default value
 */
export function getPayloadValue<T, D = undefined>(
  event: GamificationEvent<EventPayload>,
  path: string,
  defaultValue?: D,
  schema?: z.ZodType<T>
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
    
    // If a schema is provided, validate the value
    if (schema && current !== undefined) {
      try {
        return schema.parse(current);
      } catch (validationError) {
        console.warn(`Validation failed for path ${path}:`, validationError);
        return defaultValue as D;
      }
    }
    
    return current !== undefined ? current : defaultValue as D;
  } catch (error) {
    return defaultValue as D;
  }
}