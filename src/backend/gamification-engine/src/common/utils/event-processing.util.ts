import { Injectable, Logger } from '@nestjs/common';
import { GamificationEvent, EventType, EventPayload } from '@austa/interfaces/gamification/events';
import { ProcessEventDto } from '../../events/dto/process-event.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Type definition for event validation errors
 */
export interface EventValidationError {
  field: string;
  message: string;
}

/**
 * Type definition for event validation result
 */
export interface EventValidationResult {
  isValid: boolean;
  errors: EventValidationError[];
}

/**
 * Type definition for event processing options
 */
export interface EventProcessingOptions {
  /** Whether to enrich the event with additional metadata */
  enrichEvent?: boolean;
  /** Whether to validate the event schema */
  validateSchema?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Whether to use exponential backoff for retries */
  useExponentialBackoff?: boolean;
}

/**
 * Default event processing options
 */
export const DEFAULT_EVENT_PROCESSING_OPTIONS: EventProcessingOptions = {
  enrichEvent: true,
  validateSchema: true,
  maxRetries: 3,
  retryDelay: 1000,
  useExponentialBackoff: true,
};

/**
 * Type guard to check if an object is a valid GamificationEvent
 * @param event The event to check
 * @returns True if the event is a valid GamificationEvent
 */
export function isGamificationEvent(event: any): event is GamificationEvent {
  return (
    event &&
    typeof event === 'object' &&
    typeof event.type === 'string' &&
    typeof event.userId === 'string' &&
    typeof event.data === 'object' &&
    event.data !== null
  );
}

/**
 * Validates an event against the GamificationEvent schema
 * @param event The event to validate
 * @returns Validation result with errors if any
 */
export function validateEventSchema(event: any): EventValidationResult {
  const errors: EventValidationError[] = [];

  if (!event) {
    errors.push({ field: 'event', message: 'Event is required' });
    return { isValid: false, errors };
  }

  if (typeof event !== 'object') {
    errors.push({ field: 'event', message: 'Event must be an object' });
    return { isValid: false, errors };
  }

  if (!event.type) {
    errors.push({ field: 'type', message: 'Event type is required' });
  } else if (typeof event.type !== 'string') {
    errors.push({ field: 'type', message: 'Event type must be a string' });
  } else if (!Object.values(EventType).includes(event.type as EventType)) {
    errors.push({ 
      field: 'type', 
      message: `Event type must be one of: ${Object.values(EventType).join(', ')}` 
    });
  }

  if (!event.userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (typeof event.userId !== 'string') {
    errors.push({ field: 'userId', message: 'User ID must be a string' });
  }

  if (!event.data) {
    errors.push({ field: 'data', message: 'Event data is required' });
  } else if (typeof event.data !== 'object' || event.data === null) {
    errors.push({ field: 'data', message: 'Event data must be an object' });
  }

  if (event.journey && typeof event.journey !== 'string') {
    errors.push({ field: 'journey', message: 'Journey must be a string' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Converts a ProcessEventDto to a standardized GamificationEvent
 * @param dto The ProcessEventDto to convert
 * @returns A standardized GamificationEvent
 */
export function convertDtoToGamificationEvent(dto: ProcessEventDto): GamificationEvent {
  return {
    type: dto.type as EventType,
    userId: dto.userId,
    data: dto.data as EventPayload,
    journey: dto.journey,
    timestamp: new Date(),
    eventId: uuidv4(),
  };
}

/**
 * Enriches an event with additional metadata
 * @param event The event to enrich
 * @returns The enriched event
 */
export function enrichEvent(event: GamificationEvent): GamificationEvent {
  return {
    ...event,
    timestamp: event.timestamp || new Date(),
    eventId: event.eventId || uuidv4(),
    processedAt: new Date(),
    version: '1.0',
  };
}

/**
 * Utility class for processing events in the gamification engine
 */
@Injectable()
export class EventProcessingUtil {
  private readonly logger = new Logger(EventProcessingUtil.name);

  /**
   * Processes an event with validation, enrichment, and retry logic
   * @param event The event to process
   * @param options Processing options
   * @param processor Function to process the event
   * @returns The processing result
   */
  async processEvent<T>(
    event: GamificationEvent | ProcessEventDto,
    options: EventProcessingOptions = DEFAULT_EVENT_PROCESSING_OPTIONS,
    processor: (event: GamificationEvent) => Promise<T>
  ): Promise<T> {
    const mergedOptions = { ...DEFAULT_EVENT_PROCESSING_OPTIONS, ...options };
    let gamificationEvent: GamificationEvent;

    // Convert DTO to GamificationEvent if needed
    if (!(event as GamificationEvent).eventId) {
      gamificationEvent = convertDtoToGamificationEvent(event as ProcessEventDto);
    } else {
      gamificationEvent = event as GamificationEvent;
    }

    // Validate schema if enabled
    if (mergedOptions.validateSchema) {
      const validationResult = validateEventSchema(gamificationEvent);
      if (!validationResult.isValid) {
        this.logger.error(
          `Event validation failed: ${JSON.stringify(validationResult.errors)}`,
          { event: gamificationEvent }
        );
        throw new Error(`Event validation failed: ${JSON.stringify(validationResult.errors)}`);
      }
    }

    // Enrich event if enabled
    if (mergedOptions.enrichEvent) {
      gamificationEvent = enrichEvent(gamificationEvent);
    }

    // Process with retry logic
    return this.processWithRetry(
      gamificationEvent,
      processor,
      mergedOptions.maxRetries,
      mergedOptions.retryDelay,
      mergedOptions.useExponentialBackoff
    );
  }

  /**
   * Processes an event with retry logic
   * @param event The event to process
   * @param processor Function to process the event
   * @param maxRetries Maximum number of retry attempts
   * @param retryDelay Retry delay in milliseconds
   * @param useExponentialBackoff Whether to use exponential backoff
   * @returns The processing result
   */
  private async processWithRetry<T>(
    event: GamificationEvent,
    processor: (event: GamificationEvent) => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000,
    useExponentialBackoff: boolean = true
  ): Promise<T> {
    let attempts = 0;
    let lastError: Error;

    while (attempts <= maxRetries) {
      try {
        return await processor(event);
      } catch (error) {
        attempts++;
        lastError = error;

        if (attempts > maxRetries) {
          this.logger.error(
            `Event processing failed after ${maxRetries} attempts`,
            { event, error }
          );
          break;
        }

        const delay = useExponentialBackoff
          ? retryDelay * Math.pow(2, attempts - 1)
          : retryDelay;

        this.logger.warn(
          `Event processing attempt ${attempts} failed, retrying in ${delay}ms`,
          { event, error }
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Processes a health journey event
   * @param event The health journey event to process
   * @param options Processing options
   * @param processor Function to process the event
   * @returns The processing result
   */
  async processHealthEvent<T>(
    event: GamificationEvent,
    options: EventProcessingOptions = DEFAULT_EVENT_PROCESSING_OPTIONS,
    processor: (event: GamificationEvent) => Promise<T>
  ): Promise<T> {
    // Validate that this is a health journey event
    if (event.journey !== 'health') {
      throw new Error(`Expected health journey event, got ${event.journey}`);
    }

    // Process the event with standard processing logic
    return this.processEvent(event, options, processor);
  }

  /**
   * Processes a care journey event
   * @param event The care journey event to process
   * @param options Processing options
   * @param processor Function to process the event
   * @returns The processing result
   */
  async processCareEvent<T>(
    event: GamificationEvent,
    options: EventProcessingOptions = DEFAULT_EVENT_PROCESSING_OPTIONS,
    processor: (event: GamificationEvent) => Promise<T>
  ): Promise<T> {
    // Validate that this is a care journey event
    if (event.journey !== 'care') {
      throw new Error(`Expected care journey event, got ${event.journey}`);
    }

    // Process the event with standard processing logic
    return this.processEvent(event, options, processor);
  }

  /**
   * Processes a plan journey event
   * @param event The plan journey event to process
   * @param options Processing options
   * @param processor Function to process the event
   * @returns The processing result
   */
  async processPlanEvent<T>(
    event: GamificationEvent,
    options: EventProcessingOptions = DEFAULT_EVENT_PROCESSING_OPTIONS,
    processor: (event: GamificationEvent) => Promise<T>
  ): Promise<T> {
    // Validate that this is a plan journey event
    if (event.journey !== 'plan') {
      throw new Error(`Expected plan journey event, got ${event.journey}`);
    }

    // Process the event with standard processing logic
    return this.processEvent(event, options, processor);
  }

  /**
   * Creates a standardized health journey event
   * @param type The event type
   * @param userId The user ID
   * @param data The event data
   * @returns A standardized health journey event
   */
  createHealthEvent(type: EventType, userId: string, data: EventPayload): GamificationEvent {
    return {
      type,
      userId,
      data,
      journey: 'health',
      timestamp: new Date(),
      eventId: uuidv4(),
    };
  }

  /**
   * Creates a standardized care journey event
   * @param type The event type
   * @param userId The user ID
   * @param data The event data
   * @returns A standardized care journey event
   */
  createCareEvent(type: EventType, userId: string, data: EventPayload): GamificationEvent {
    return {
      type,
      userId,
      data,
      journey: 'care',
      timestamp: new Date(),
      eventId: uuidv4(),
    };
  }

  /**
   * Creates a standardized plan journey event
   * @param type The event type
   * @param userId The user ID
   * @param data The event data
   * @returns A standardized plan journey event
   */
  createPlanEvent(type: EventType, userId: string, data: EventPayload): GamificationEvent {
    return {
      type,
      userId,
      data,
      journey: 'plan',
      timestamp: new Date(),
      eventId: uuidv4(),
    };
  }

  /**
   * Extracts tracking information from an event for monitoring and analytics
   * @param event The event to extract tracking information from
   * @returns Tracking information object
   */
  extractTrackingInfo(event: GamificationEvent): Record<string, any> {
    return {
      eventId: event.eventId,
      eventType: event.type,
      userId: event.userId,
      journey: event.journey,
      timestamp: event.timestamp,
      processedAt: event.processedAt || new Date(),
    };
  }
}