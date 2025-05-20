/**
 * Configuration options for the TracingModule.
 */
export interface TracingModuleOptions {
  /**
   * The name of the service to be used in traces.
   * If not provided, defaults to the value in constants/defaults.ts
   */
  serviceName?: string;

  /**
   * Whether to disable tracing entirely.
   * Useful for testing environments or when tracing should be conditionally enabled.
   */
  disabled?: boolean;

  /**
   * Configuration for journey-specific tracing context.
   */
  journeyContext?: {
    /**
     * Whether to include journey information in trace spans.
     * Defaults to true.
     */
    enabled?: boolean;

    /**
     * List of journey types to be tracked in traces.
     * If not provided, all journeys will be tracked.
     */
    journeyTypes?: ('health' | 'care' | 'plan')[];
  };

  /**
   * Configuration for trace sampling.
   */
  sampling?: {
    /**
     * The sampling ratio (0.0 to 1.0) for traces.
     * 1.0 means all traces are sampled, 0.0 means no traces are sampled.
     * Defaults to 1.0 in development and 0.1 in production.
     */
    ratio?: number;
  };

  /**
   * Configuration for trace exporting.
   */
  exporter?: {
    /**
     * The type of exporter to use.
     * Defaults to 'console' in development and 'otlp' in production.
     */
    type?: 'console' | 'otlp' | 'jaeger' | 'zipkin';

    /**
     * The endpoint for the exporter.
     * Only applicable for 'otlp', 'jaeger', and 'zipkin' exporters.
     */
    endpoint?: string;
  };
}