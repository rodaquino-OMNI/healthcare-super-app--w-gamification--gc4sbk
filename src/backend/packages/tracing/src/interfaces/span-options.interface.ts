import { Context } from '@opentelemetry/api';

/**
 * Interface defining options for span creation in the tracing system.
 * Provides configuration for customizing spans with attributes, timing, and parent context.
 */
export interface SpanOptions {
  /**
   * Custom attributes to add to the span.
   * These can be used to provide additional context about the operation being traced.
   * 
   * @example { userId: '123', operationType: 'payment' }
   */
  attributes?: Record<string, string | number | boolean>;

  /**
   * Journey-specific attributes to categorize spans by application journey.
   * Used to associate spans with specific user journeys (Health, Care, Plan).
   * 
   * @example { journey: 'health', journeyStep: 'metrics-recording' }
   */
  journeyAttributes?: {
    journey?: 'health' | 'care' | 'plan';
    journeyStep?: string;
    journeyId?: string;
  };

  /**
   * Whether to time the execution of the span operation.
   * If true, the span will automatically record the duration of the operation.
   * 
   * @default true
   */
  timed?: boolean;

  /**
   * Parent context to use for this span.
   * If provided, the new span will be created as a child of the span in this context.
   * If not provided, the current active context will be used.
   */
  parentContext?: Context;

  /**
   * Whether this span should be created as a root span (ignoring any parent context).
   * 
   * @default false
   */
  root?: boolean;

  /**
   * A manually specified start time for the span.
   * If not provided, the current time will be used.
   */
  startTime?: number | Date;
}