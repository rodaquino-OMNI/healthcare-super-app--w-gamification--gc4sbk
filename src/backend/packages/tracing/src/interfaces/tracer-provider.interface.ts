import { Tracer, Context, SpanOptions, Span } from '@opentelemetry/api';

/**
 * Interface for a tracer provider that abstracts the underlying OpenTelemetry implementation.
 * This abstraction allows for easier testing and potential future changes to the tracing backend.
 */
export interface TracerProvider {
  /**
   * Gets a tracer instance for the specified service or component.
   * 
   * @param name The name of the service or component requesting the tracer
   * @param version Optional version of the service or component
   * @returns A Tracer instance that can be used to create spans
   */
  getTracer(name: string, version?: string): Tracer;

  /**
   * Creates and returns a new span.
   * 
   * @param name The name of the span
   * @param options Optional configuration for the span
   * @param context Optional parent context for the span
   * @returns A new Span instance
   */
  createSpan(name: string, options?: SpanOptions, context?: Context): Span;

  /**
   * Executes a function within the context of a new span.
   * 
   * @param name The name of the span
   * @param fn The function to execute within the span context
   * @param options Optional configuration for the span
   * @returns The result of the function execution
   */
  withSpan<T>(name: string, fn: () => Promise<T>, options?: SpanOptions): Promise<T>;

  /**
   * Gets the current active context.
   * 
   * @returns The current active Context
   */
  getCurrentContext(): Context;

  /**
   * Sets the current active context.
   * 
   * @param context The Context to set as active
   * @returns A function that restores the previous context when called
   */
  setCurrentContext(context: Context): () => void;

  /**
   * Executes a function with the provided context as the active context.
   * 
   * @param context The Context to use during execution
   * @param fn The function to execute within the context
   * @returns The result of the function execution
   */
  withContext<T>(context: Context, fn: () => T): T;

  /**
   * Injects the current context into a carrier object for propagation across process boundaries.
   * 
   * @param carrier The carrier object to inject context into
   * @param context Optional specific context to inject, defaults to current context
   */
  inject(carrier: Record<string, string>, context?: Context): void;

  /**
   * Extracts context from a carrier object that was previously injected into.
   * 
   * @param carrier The carrier object containing the propagated context
   * @returns The extracted Context
   */
  extract(carrier: Record<string, string>): Context;

  /**
   * Configures the tracer provider with the specified options.
   * 
   * @param options Configuration options for the tracer provider
   */
  configure(options: TracerProviderOptions): void;
}

/**
 * Configuration options for the tracer provider.
 */
export interface TracerProviderOptions {
  /**
   * The name of the service using the tracer.
   */
  serviceName: string;

  /**
   * The version of the service.
   */
  serviceVersion?: string;

  /**
   * Whether to enable or disable tracing.
   */
  enabled?: boolean;

  /**
   * The sampling rate for traces (0.0 to 1.0).
   */
  samplingRatio?: number;

  /**
   * Additional attributes to add to all spans.
   */
  defaultAttributes?: Record<string, string | number | boolean | string[]>;

  /**
   * Configuration for exporting traces.
   */
  exporterConfig?: {
    /**
     * The type of exporter to use.
     */
    type: 'jaeger' | 'zipkin' | 'otlp' | 'console' | 'none';

    /**
     * The endpoint for the exporter.
     */
    endpoint?: string;

    /**
     * Headers to include with exported traces.
     */
    headers?: Record<string, string>;
  };

  /**
   * Journey-specific configuration for tracing.
   */
  journeyConfig?: {
    /**
     * The journey identifier to include in traces.
     */
    journeyId: 'health' | 'care' | 'plan' | 'common';

    /**
     * Additional journey-specific attributes.
     */
    attributes?: Record<string, string | number | boolean | string[]>;
  };
}