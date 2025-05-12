import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum representing the valid journey types in the AUSTA SuperApp.
 * These values correspond to the three distinct user journeys.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Enum representing cross-journey event types that can be processed by multiple journeys.
 * These events maintain context from their originating journey but may be relevant to other journeys.
 */
export enum CrossJourneyEventType {
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  REWARD_EARNED = 'REWARD_EARNED',
  JOURNEY_COMPLETED = 'JOURNEY_COMPLETED',
  NOTIFICATION_PREFERENCE_UPDATED = 'NOTIFICATION_PREFERENCE_UPDATED',
}

/**
 * Interface representing the journey context within an event.
 * This context is used to track which journey an event originated from
 * and ensure proper routing and processing.
 */
export interface JourneyContext {
  /**
   * The journey type associated with the event.
   */
  journey: JourneyType;
  
  /**
   * Optional additional context specific to the journey.
   */
  journeyContext?: Record<string, any>;
}

/**
 * Interface for an event with journey context.
 */
export interface EventWithJourneyContext {
  /**
   * The type of the event.
   */
  type: string;
  
  /**
   * The ID of the user associated with the event.
   */
  userId: string;
  
  /**
   * The data associated with the event.
   */
  data: object;
  
  /**
   * The journey associated with the event.
   */
  journey: JourneyType;
  
  /**
   * Optional additional context specific to the journey.
   */
  journeyContext?: Record<string, any>;
}

/**
 * Validates if the provided journey type is valid.
 * @param journey The journey type to validate
 * @returns True if the journey type is valid, false otherwise
 */
export function isValidJourney(journey: string): journey is JourneyType {
  return Object.values(JourneyType).includes(journey as JourneyType);
}

/**
 * Creates a journey context object for the specified journey type.
 * @param journey The journey type
 * @param additionalContext Optional additional context specific to the journey
 * @returns A JourneyContext object
 * @throws Error if the journey type is invalid
 */
export function createJourneyContext(
  journey: JourneyType | string,
  additionalContext?: Record<string, any>
): JourneyContext {
  if (!isValidJourney(journey)) {
    throw new Error(`Invalid journey type: ${journey}. Valid types are: ${Object.values(JourneyType).join(', ')}`);
  }
  
  return {
    journey: journey as JourneyType,
    journeyContext: additionalContext,
  };
}

/**
 * Adds journey context to an event.
 * @param event The event to add journey context to
 * @param journeyContext The journey context to add
 * @returns The event with journey context added
 */
export function addJourneyContextToEvent<T extends { type: string; userId: string; data: object }>(  
  event: T,
  journeyContext: JourneyContext
): T & JourneyContext {
  return {
    ...event,
    journey: journeyContext.journey,
    journeyContext: journeyContext.journeyContext,
  };
}

/**
 * Extracts journey context from an event.
 * @param event The event to extract journey context from
 * @returns The journey context extracted from the event, or null if no valid journey context exists
 */
export function extractJourneyContext(event: any): JourneyContext | null {
  if (!event || typeof event !== 'object') {
    return null;
  }
  
  const { journey, journeyContext } = event;
  
  if (!journey || !isValidJourney(journey)) {
    return null;
  }
  
  return {
    journey: journey as JourneyType,
    journeyContext: journeyContext || {},
  };
}

/**
 * Validates that an event has valid journey context.
 * @param event The event to validate
 * @returns True if the event has valid journey context, false otherwise
 */
export function hasValidJourneyContext(event: any): boolean {
  return extractJourneyContext(event) !== null;
}

/**
 * Gets the journey type from an event.
 * @param event The event to get the journey type from
 * @returns The journey type, or null if no valid journey type exists
 */
export function getJourneyType(event: any): JourneyType | null {
  const journeyContext = extractJourneyContext(event);
  return journeyContext ? journeyContext.journey : null;
}

/**
 * Creates an event with journey context.
 * @param type The event type
 * @param userId The user ID associated with the event
 * @param data The event data
 * @param journey The journey type
 * @param journeyContext Optional additional context specific to the journey
 * @returns An event with journey context
 */
export function createEventWithJourneyContext(
  type: string,
  userId: string,
  data: object,
  journey: JourneyType | string,
  journeyContext?: Record<string, any>
): EventWithJourneyContext {
  if (!isValidJourney(journey)) {
    throw new Error(`Invalid journey type: ${journey}. Valid types are: ${Object.values(JourneyType).join(', ')}`);
  }
  
  return {
    type,
    userId,
    data,
    journey: journey as JourneyType,
    journeyContext,
  };
}

/**
 * Class decorator that validates journey context in event DTOs.
 * This can be used to ensure that DTOs have valid journey context.
 * @returns A class decorator function
 */
export function ValidateJourneyContext() {
  return function (constructor: Function) {
    const originalValidate = constructor.prototype.validate;
    
    constructor.prototype.validate = function() {
      const result = originalValidate ? originalValidate.apply(this) : true;
      
      if (result === false) {
        return false;
      }
      
      return hasValidJourneyContext(this);
    };
    
    return constructor;
  };
}

/**
 * Property decorator that validates that a property is a valid journey type.
 * This can be used in DTOs to ensure that journey properties are valid.
 * @returns A property decorator function
 */
export function IsValidJourney() {
  return function (target: any, propertyKey: string) {
    IsEnum(JourneyType)(target, propertyKey);
  };
}

/**
 * Class representing journey context for use in DTOs with validation.
 * This can be used with class-validator and class-transformer for automatic validation.
 */
export class JourneyContextDto implements JourneyContext {
  @IsNotEmpty()
  @IsEnum(JourneyType)
  journey: JourneyType;

  @IsOptional()
  @IsObject()
  journeyContext?: Record<string, any>;
}

/**
 * Base class for event DTOs that include journey context.
 * Extend this class to create event DTOs with built-in journey context validation.
 */
export class BaseEventWithJourneyDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsObject()
  data: object;

  @IsNotEmpty()
  @IsEnum(JourneyType)
  journey: JourneyType;

  @IsOptional()
  @IsObject()
  journeyContext?: Record<string, any>;

  /**
   * Converts this DTO to an EventWithJourneyContext object.
   * @returns An EventWithJourneyContext object
   */
  toEventWithJourneyContext(): EventWithJourneyContext {
    return {
      type: this.type,
      userId: this.userId,
      data: this.data,
      journey: this.journey,
      journeyContext: this.journeyContext,
    };
  }
}

/**
 * Routes an event to the appropriate handler based on its journey type.
 * @param event The event to route
 * @param handlers An object mapping journey types to handler functions
 * @param defaultHandler Optional default handler for events with no journey or invalid journey
 * @returns The result of the handler function
 */
export function routeEventByJourney<T, R>(
  event: T,
  handlers: Record<JourneyType, (event: T) => R>,
  defaultHandler?: (event: T) => R
): R | undefined {
  const journeyType = getJourneyType(event);
  
  if (journeyType && handlers[journeyType]) {
    return handlers[journeyType](event);
  }
  
  if (defaultHandler) {
    return defaultHandler(event);
  }
  
  return undefined;
}

/**
 * Determines if an event is a cross-journey event.
 * Cross-journey events are relevant to multiple journeys but maintain their original context.
 * @param eventType The type of the event to check
 * @returns True if the event is a cross-journey event, false otherwise
 */
export function isCrossJourneyEvent(eventType: string): boolean {
  return Object.values(CrossJourneyEventType).includes(eventType as CrossJourneyEventType);
}

/**
 * Routes a cross-journey event to multiple handlers based on configuration.
 * This allows events to be processed by multiple journey handlers while maintaining original context.
 * @param event The event to route
 * @param handlers An object mapping journey types to handler functions
 * @param config Configuration for cross-journey routing
 * @returns An array of results from all applicable handlers
 */
export function routeCrossJourneyEvent<T, R>(
  event: T & { type: string },
  handlers: Record<JourneyType, (event: T) => R>,
  config: {
    routeToOriginating: boolean; // Whether to route to the originating journey
    routeToAll: boolean; // Whether to route to all journeys
    targetJourneys?: JourneyType[]; // Specific journeys to route to
  }
): R[] {
  const results: R[] = [];
  const journeyType = getJourneyType(event);
  const eventType = (event as any).type;
  
  // Only process if it's a cross-journey event
  if (!isCrossJourneyEvent(eventType)) {
    // If not a cross-journey event, just route to originating journey if available
    if (journeyType && handlers[journeyType]) {
      results.push(handlers[journeyType](event));
    }
    return results;
  }
  
  // Route to originating journey if configured and available
  if (config.routeToOriginating && journeyType && handlers[journeyType]) {
    results.push(handlers[journeyType](event));
  }
  
  // Route to all journeys if configured
  if (config.routeToAll) {
    Object.values(JourneyType).forEach(journey => {
      // Skip if already routed to originating journey
      if (journey === journeyType && config.routeToOriginating) {
        return;
      }
      
      if (handlers[journey]) {
        results.push(handlers[journey](event));
      }
    });
  }
  // Route to specific target journeys if configured
  else if (config.targetJourneys && config.targetJourneys.length > 0) {
    config.targetJourneys.forEach(journey => {
      // Skip if already routed to originating journey
      if (journey === journeyType && config.routeToOriginating) {
        return;
      }
      
      if (handlers[journey]) {
        results.push(handlers[journey](event));
      }
    });
  }
  
  return results;
}

/**
 * Transfers journey context from one event to another.
 * This is useful when creating derived events that should maintain the original context.
 * @param sourceEvent The source event to get journey context from
 * @param targetEvent The target event to add journey context to
 * @returns The target event with journey context from the source event
 */
export function transferJourneyContext<T extends object, U extends object>(
  sourceEvent: T,
  targetEvent: U
): U & Partial<JourneyContext> {
  const journeyContext = extractJourneyContext(sourceEvent);
  
  if (!journeyContext) {
    return targetEvent;
  }
  
  return {
    ...targetEvent,
    journey: journeyContext.journey,
    journeyContext: journeyContext.journeyContext,
  };
}

/**
 * Creates a journey-specific error with context information.
 * This helps maintain journey context in error handling and logging.
 * @param message The error message
 * @param journeyContext The journey context
 * @param originalError Optional original error that caused this error
 * @returns An Error object with journey context information
 */
export function createJourneyError(
  message: string,
  journeyContext: JourneyContext,
  originalError?: Error
): Error & { journeyContext: JourneyContext } {
  const error = originalError || new Error(message);
  
  return Object.assign(error, {
    message: message || error.message,
    journeyContext,
  });
}

/**
 * Validates an event's journey context against expected journey types.
 * Useful for ensuring events are being processed by the correct service.
 * @param event The event to validate
 * @param expectedJourneys The expected journey types
 * @returns True if the event's journey matches one of the expected journeys
 */
export function validateEventJourney(
  event: any,
  expectedJourneys: JourneyType | JourneyType[]
): boolean {
  const journeyType = getJourneyType(event);
  
  if (!journeyType) {
    return false;
  }
  
  if (Array.isArray(expectedJourneys)) {
    return expectedJourneys.includes(journeyType);
  }
  
  return journeyType === expectedJourneys;
}

/**
 * Enriches an event with additional journey-specific context.
 * This is useful when additional context needs to be added to an event during processing.
 * @param event The event to enrich
 * @param additionalContext The additional context to add
 * @returns The enriched event
 */
export function enrichJourneyContext<T extends object>(
  event: T,
  additionalContext: Record<string, any>
): T {
  const journeyContext = extractJourneyContext(event);
  
  if (!journeyContext) {
    return event;
  }
  
  return {
    ...event,
    journeyContext: {
      ...journeyContext.journeyContext,
      ...additionalContext,
    },
  };
}

/**
 * Adapts a ProcessEventDto to include proper journey context validation.
 * This function can be used to enhance existing ProcessEventDto instances with
 * journey context validation without modifying the original class.
 * 
 * @param dto The ProcessEventDto to adapt
 * @returns A validated EventWithJourneyContext object
 * @throws Error if the journey is invalid
 */
export function adaptProcessEventDto(dto: any): EventWithJourneyContext {
  if (!dto || typeof dto !== 'object') {
    throw new Error('Invalid event DTO: must be an object');
  }

  const { type, userId, data, journey } = dto;

  if (!type || !userId || !data) {
    throw new Error('Invalid event DTO: missing required fields (type, userId, data)');
  }

  if (!journey || !isValidJourney(journey)) {
    throw new Error(`Invalid journey type: ${journey}. Valid types are: ${Object.values(JourneyType).join(', ')}`);
  }

  return createEventWithJourneyContext(
    type,
    userId,
    data,
    journey,
    dto.journeyContext
  );
}

/**
 * Creates a journey-specific event factory for a particular journey.
 * This factory can be used to create events with consistent journey context.
 * 
 * @param journey The journey type for this factory
 * @returns A function that creates events with the specified journey context
 */
export function createJourneyEventFactory(journey: JourneyType) {
  if (!isValidJourney(journey)) {
    throw new Error(`Invalid journey type: ${journey}. Valid types are: ${Object.values(JourneyType).join(', ')}`);
  }

  return function createEvent(
    type: string,
    userId: string,
    data: object,
    additionalContext?: Record<string, any>
  ): EventWithJourneyContext {
    return createEventWithJourneyContext(
      type,
      userId,
      data,
      journey,
      additionalContext
    );
  };
}

// Pre-configured event factories for each journey
export const HealthEventFactory = createJourneyEventFactory(JourneyType.HEALTH);
export const CareEventFactory = createJourneyEventFactory(JourneyType.CARE);
export const PlanEventFactory = createJourneyEventFactory(JourneyType.PLAN);

/**
 * Maps an array of events, preserving their journey context.
 * This is useful when transforming events while maintaining their original context.
 * 
 * @param events Array of events to map
 * @param mapFn Mapping function to apply to each event
 * @returns Array of mapped events with preserved journey context
 */
export function mapEventsWithContext<T extends object, R extends object>(
  events: T[],
  mapFn: (event: T) => R
): (R & Partial<JourneyContext>)[] {
  return events.map(event => {
    const mappedEvent = mapFn(event);
    return transferJourneyContext(event, mappedEvent);
  });
}

/**
 * Filters events by journey type.
 * 
 * @param events Array of events to filter
 * @param journeyType Journey type to filter by
 * @returns Array of events matching the specified journey type
 */
export function filterEventsByJourney<T>(events: T[], journeyType: JourneyType): T[] {
  return events.filter(event => {
    const eventJourneyType = getJourneyType(event);
    return eventJourneyType === journeyType;
  });
}

/**
 * Groups events by their journey type.
 * 
 * @param events Array of events to group
 * @returns Object with journey types as keys and arrays of events as values
 */
export function groupEventsByJourney<T>(events: T[]): Record<JourneyType, T[]> {
  const result = {
    [JourneyType.HEALTH]: [] as T[],
    [JourneyType.CARE]: [] as T[],
    [JourneyType.PLAN]: [] as T[],
  };

  events.forEach(event => {
    const journeyType = getJourneyType(event);
    if (journeyType) {
      result[journeyType].push(event);
    }
  });

  return result;
}