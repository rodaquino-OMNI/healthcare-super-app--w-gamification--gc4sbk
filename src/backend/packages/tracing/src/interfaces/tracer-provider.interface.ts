import { Context, Span, SpanOptions, Tracer, TracerOptions } from '@opentelemetry/api';

/**
 * Interface for a TracerProvider that abstracts the underlying OpenTelemetry tracer implementation.
 * This abstraction allows for easier testing and potential future changes to the tracing backend.
 */
export interface TracerProvider {
  /**
   * Gets a tracer instance with the specified name and options.
   * 
   * @param name The name of the tracer, typically the service name
   * @param options Optional configuration for the tracer
   * @returns A Tracer instance that can be used to create spans
   */
  getTracer(name: string, options?: TracerOptions): Tracer;

  /**
   * Creates and starts a new span with the given name and options.
   * 
   * @param tracer The tracer to use for creating the span
   * @param name The name of the span
   * @param options Optional configuration for the span
   * @returns The created and started span
   */
  startSpan(tracer: Tracer, name: string, options?: SpanOptions): Span;

  /**
   * Executes a function within the context of a span.
   * 
   * @param span The span to use as the current context
   * @param fn The function to execute within the span's context
   * @returns The result of the function execution
   */
  withSpan<T>(span: Span, fn: () => Promise<T>): Promise<T>;

  /**
   * Gets the current active span from the context.
   * 
   * @returns The current active span or undefined if no span is active
   */
  getCurrentSpan(): Span | undefined;

  /**
   * Sets the current span in the context.
   * 
   * @param span The span to set as the current span
   * @returns The updated context
   */
  setSpan(span: Span): Context;

  /**
   * Gets the current context.
   * 
   * @returns The current context
   */
  getContext(): Context;

  /**
   * Executes a function within the given context.
   * 
   * @param context The context to use
   * @param fn The function to execute within the context
   * @returns The result of the function execution
   */
  withContext<T>(context: Context, fn: () => Promise<T>): Promise<T>;
}