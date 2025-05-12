/**
 * Base event interface that all event types must implement.
 * Provides a standardized structure for event-driven communication across all services and journeys.
 * 
 * This interface ensures consistent event structures for reliable processing within
 * the gamification engine and notification system.
 */
export interface IBaseEvent<T = unknown> {
  /**
   * Unique identifier for the event
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  eventId: string;

  /**
   * ISO 8601 timestamp when the event was created
   * @example "2023-04-15T14:32:17.123Z"
   */
  timestamp: string;

  /**
   * Semantic version of the event schema (major.minor.patch)
   * Used to support the event versioning strategy and ensure backward compatibility
   * @example "1.0.0"
   */
  version: string;

  /**
   * Identifies the service or journey that originated the event
   * @example "health-service", "care-service", "plan-service", "auth-service"
   */
  source: string;

  /**
   * The type of event, used for routing and processing
   * @example "health.metric.recorded", "care.appointment.booked", "plan.claim.submitted"
   */
  type: string;

  /**
   * The event payload containing event-specific data
   * Type parameter T allows for type-safe payload definitions
   */
  payload: T;

  /**
   * Optional metadata for cross-cutting concerns
   * Includes tracing IDs, correlation IDs, and other context information
   */
  metadata?: EventMetadata;
}

/**
 * Metadata structure for events to support cross-cutting concerns
 * like distributed tracing, correlation, and debugging
 */
export interface EventMetadata {
  /**
   * Correlation ID for tracking related events across services
   * @example "abc123def456"
   */
  correlationId?: string;

  /**
   * Trace ID for distributed tracing (OpenTelemetry compatible)
   * @example "4bf92f3577b34da6a3ce929d0e0e4736"
   */
  traceId?: string;

  /**
   * User ID associated with this event, if applicable
   * @example "user-123456"
   */
  userId?: string;

  /**
   * Journey context for the event (health, care, plan)
   * @example "health", "care", "plan"
   */
  journey?: 'health' | 'care' | 'plan';

  /**
   * Additional context information relevant to the event
   * Can contain any serializable data
   */
  context?: Record<string, unknown>;
}

/**
 * Interface for versioned events that explicitly declares compatibility information
 */
export interface IVersionedEvent<T = unknown> extends IBaseEvent<T> {
  /**
   * Minimum version of the consumer required to process this event
   * @example "1.0.0"
   */
  minConsumerVersion?: string;

  /**
   * Whether this event uses a deprecated schema that will be removed in future versions
   */
  deprecated?: boolean;
}