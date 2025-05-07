/**
 * Core TypeScript interfaces for event data structures used throughout the gamification engine.
 * 
 * This file provides the foundation for all event-related types, ensuring type safety
 * and consistent data modeling across the event processing pipeline.
 */

/**
 * Base interface for all events processed by the gamification engine
 */
export interface IBaseEvent {
  /**
   * The type of the event
   * Examples: HEALTH_METRIC_RECORDED, APPOINTMENT_BOOKED, CLAIM_SUBMITTED
   */
  type: string;

  /**
   * The ID of the user associated with the event
   */
  userId: string;

  /**
   * The timestamp when the event occurred
   */
  timestamp: Date;

  /**
   * The journey associated with the event
   * Possible values: health, care, plan
   */
  journey?: string;

  /**
   * The data associated with the event
   * This contains journey-specific details about the event
   */
  data: IEventPayload;
}

/**
 * Interface for event payload data
 */
export interface IEventPayload {
  /**
   * Additional properties specific to the event type
   */
  [key: string]: any;
}

/**
 * Interface for event metadata
 */
export interface IEventMetadata {
  /**
   * The source of the event
   * Examples: api, kafka, system
   */
  source?: string;

  /**
   * The version of the event schema
   */
  version?: string;

  /**
   * The correlation ID for distributed tracing
   */
  correlationId?: string;

  /**
   * Additional metadata properties
   */
  [key: string]: any;
}

/**
 * Complete event interface with metadata
 */
export interface IEvent extends IBaseEvent {
  /**
   * Metadata associated with the event
   */
  metadata?: IEventMetadata;
}