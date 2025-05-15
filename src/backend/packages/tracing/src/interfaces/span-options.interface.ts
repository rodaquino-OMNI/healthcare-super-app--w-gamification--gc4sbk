import { Context, SpanAttributes, SpanStatusCode } from '@opentelemetry/api';

/**
 * Interface defining options for span creation in the tracing system.
 * Provides configuration for customizing spans with business-relevant information,
 * timing options, and parent context references.
 */
export interface SpanOptions {
  /**
   * Custom attributes to add to the span for additional context.
   * These can include business-specific information, technical details,
   * or any other relevant metadata.
   */
  attributes?: SpanAttributes;

  /**
   * Journey-specific attributes to identify which user journey the span belongs to.
   * This helps with categorizing and analyzing traces by business domain.
   */
  journeyContext?: {
    /**
     * The journey type this span is associated with (health, care, plan).
     */
    journeyType?: 'health' | 'care' | 'plan';
    
    /**
     * Optional journey-specific identifier (e.g., appointment ID, claim ID).
     */
    journeyId?: string;
    
    /**
     * Additional journey-specific context that might be relevant.
     */
    [key: string]: any;
  };

  /**
   * Parent context to link this span to an existing trace.
   * Used for maintaining trace continuity across service boundaries.
   */
  parentContext?: Context;

  /**
   * Whether to time the execution of the span.
   * When true, the span will automatically record the duration.
   */
  timed?: boolean;

  /**
   * Status code to set on the span.
   * Defaults to OK if not specified and no errors occur.
   */
  statusCode?: SpanStatusCode;

  /**
   * Optional status message to provide additional context for the span status.
   */
  statusMessage?: string;

  /**
   * Whether to record exceptions that occur during span execution.
   * Defaults to true.
   */
  recordExceptions?: boolean;

  /**
   * Custom error handler for exceptions that occur during span execution.
   * This allows for custom error processing before the exception is recorded and rethrown.
   */
  errorHandler?: (error: Error) => void;

  /**
   * Whether to end the span automatically after the operation completes.
   * Defaults to true. Set to false if you want to manually end the span.
   */
  autoEnd?: boolean;

  /**
   * Optional span kind to specify the relationship between the span, its parents, and its children.
   */
  kind?: 'internal' | 'server' | 'client' | 'producer' | 'consumer';

  /**
   * Optional sampling priority hint. Higher values indicate higher priority.
   * This can be used to ensure critical spans are sampled even when sampling is reduced.
   */
  samplingPriority?: number;
}