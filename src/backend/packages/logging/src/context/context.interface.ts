/**
 * @file Logging Context Interface
 * @description Defines the base LoggingContext interface that all other context types extend,
 * establishing the foundation for structured, context-enriched logging throughout the application.
 */

/**
 * Base LoggingContext interface that all other context types extend.
 * 
 * This interface specifies common context properties like correlation IDs, timestamps,
 * and service information that are essential for proper log aggregation and analysis.
 * It serves as the foundation for the context system, ensuring type safety and
 * consistent structure across all logging contexts.
 */
export interface LoggingContext {
  /** Unique identifier for correlating logs, traces, and metrics */
  correlationId?: string;
  
  /** Unique identifier for the current request or transaction */
  requestId?: string;
  
  /** Timestamp when the context was created */
  timestamp?: string;
  
  /** Name of the service generating the log */
  serviceName?: string;
  
  /** Version of the service generating the log */
  serviceVersion?: string;
  
  /** Environment where the service is running (dev, staging, prod) */
  environment?: string;
  
  /** Host or container identifier where the service is running */
  hostName?: string;
  
  /** Instance ID for horizontally scaled services */
  instanceId?: string;
  
  /** Additional metadata relevant to the current context */
  metadata?: Record<string, any>;
}

/**
 * Re-export all context types for convenient access.
 */
export * from './journey-context.interface';
export * from './user-context.interface';
export * from './request-context.interface';