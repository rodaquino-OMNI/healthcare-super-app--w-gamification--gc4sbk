/**
 * Base event interface that all event types must implement.
 * Provides a standardized structure for event-driven communication across all services and journeys.
 * 
 * This interface establishes the foundation for reliable event processing within the gamification engine
 * and notification system, ensuring consistent event structures throughout the AUSTA SuperApp.
 */
export interface IBaseEvent<T = unknown> {
  /**
   * Unique identifier for the event.
   * Should be a UUID v4 to ensure global uniqueness across all services.
   */
  eventId: string;

  /**
   * ISO 8601 timestamp indicating when the event occurred.
   * Format: YYYY-MM-DDTHH:mm:ss.sssZ
   */
  timestamp: string;

  /**
   * Semantic version of the event schema.
   * Used for backward compatibility and event evolution.
   * Format: MAJOR.MINOR.PATCH (e.g., "1.0.0")
   */
  version: string;

  /**
   * Identifies the originating service or journey that produced the event.
   * Examples: "health-service", "care-service", "plan-service", "auth-service"
   */
  source: string;

  /**
   * Categorizes the event for proper routing and processing.
   * Should follow the format: "journey.entity.action"
   * Examples: "health.metric.created", "care.appointment.booked", "plan.claim.submitted"
   */
  type: string;

  /**
   * The actual event data.
   * Structure varies based on event type and should be properly typed when extending this interface.
   */
  payload: T;

  /**
   * Optional metadata for cross-cutting concerns.
   * Useful for tracing, correlation IDs, and other operational data.
   */
  metadata?: IEventMetadata;
}

/**
 * Metadata interface for cross-cutting concerns in events.
 * Provides context for tracing, debugging, and operational monitoring.
 */
export interface IEventMetadata {
  /**
   * Correlation ID for tracing requests across services.
   * Should be propagated from the original user request.
   */
  correlationId?: string;

  /**
   * User ID associated with the event, if applicable.
   */
  userId?: string;

  /**
   * Journey context in which the event occurred.
   * Examples: "health", "care", "plan"
   */
  journeyContext?: string;

  /**
   * Additional custom metadata properties.
   * Can be used for journey-specific or event-specific metadata.
   */
  [key: string]: unknown;
}

/**
 * Type guard to check if an object conforms to the IBaseEvent interface.
 * Useful for runtime validation of event objects.
 * 
 * @param obj - The object to check
 * @returns True if the object is a valid IBaseEvent
 */
export function isBaseEvent(obj: unknown): obj is IBaseEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'eventId' in obj &&
    'timestamp' in obj &&
    'version' in obj &&
    'source' in obj &&
    'type' in obj &&
    'payload' in obj
  );
}

/**
 * Creates a new base event with the required properties.
 * Generates a UUID v4 for the eventId and sets the current timestamp.
 * 
 * @param type - The event type
 * @param source - The source service or journey
 * @param payload - The event payload
 * @param version - The event schema version (defaults to "1.0.0")
 * @param metadata - Optional event metadata
 * @returns A new IBaseEvent instance
 */
export function createBaseEvent<T>(
  type: string,
  source: string,
  payload: T,
  version = '1.0.0',
  metadata?: IEventMetadata
): IBaseEvent<T> {
  return {
    eventId: generateUUID(), // Implementation would be provided elsewhere
    timestamp: new Date().toISOString(),
    version,
    source,
    type,
    payload,
    metadata
  };
}

// Helper function to generate UUID v4 (implementation would be in a separate utility file)
function generateUUID(): string {
  // This is just a placeholder - the actual implementation would be imported from a utility module
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}