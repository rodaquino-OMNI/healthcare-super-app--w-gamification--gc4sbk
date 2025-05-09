/**
 * @file base-event.interface.ts
 * @description Defines the core event interface that all event types must implement.
 * It establishes the standardized structure with required properties such as eventId,
 * timestamp, source, type, and payload. This interface is the foundation for event-driven
 * communication across all services and journeys.
 */

/**
 * Base interface for all events in the system
 * Provides the core structure that all events must follow
 */
export interface IBaseEvent {
  /**
   * Unique identifier for the event
   * Used for deduplication and tracing
   */
  eventId: string;
  
  /**
   * Timestamp when the event was created
   * ISO 8601 format (e.g., "2023-01-01T12:00:00Z")
   */
  timestamp: string;
  
  /**
   * Type of the event
   * Used for routing and processing
   */
  type: string;
  
  /**
   * Source service or component that generated the event
   */
  source: string;
  
  /**
   * Event payload containing the actual data
   * Structure depends on the event type
   */
  payload: Record<string, any>;
  
  /**
   * Optional metadata for cross-cutting concerns
   * Can include tracing IDs, correlation IDs, etc.
   */
  metadata?: {
    /**
     * Correlation ID for tracking related events
     */
    correlationId?: string;
    
    /**
     * User ID associated with the event
     */
    userId?: string;
    
    /**
     * Journey context for the event
     */
    journeyContext?: {
      /**
       * Journey type (health, care, plan)
       */
      journey: 'health' | 'care' | 'plan';
      
      /**
       * Journey-specific context
       */
      context?: Record<string, any>;
    };
    
    /**
     * Additional metadata properties
     */
    [key: string]: any;
  };
}

/**
 * Interface for event with generic payload type
 * Allows for type-safe access to the payload
 */
export interface ITypedEvent<T> extends IBaseEvent {
  /**
   * Typed payload for the event
   */
  payload: T;
}

/**
 * Interface for events with validation errors
 */
export interface IEventValidationError {
  /**
   * Field that failed validation
   */
  field: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code
   */
  code?: string;
  
  /**
   * Additional context for the error
   */
  context?: Record<string, any>;
}

/**
 * Interface for event validation result
 */
export interface IEventValidationResult {
  /**
   * Whether the event is valid
   */
  isValid: boolean;
  
  /**
   * Validation errors if any
   */
  errors?: IEventValidationError[];
}

/**
 * Type guard to check if an object is a base event
 * @param obj The object to check
 * @returns Whether the object is a base event
 */
export function isBaseEvent(obj: any): obj is IBaseEvent {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.eventId === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.source === 'string' &&
    obj.payload !== undefined
  );
}