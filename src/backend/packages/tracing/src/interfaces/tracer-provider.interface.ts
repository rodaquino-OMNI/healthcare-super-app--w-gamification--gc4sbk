import { Context, Tracer } from '@opentelemetry/api';

/**
 * Options for creating a tracer
 */
export interface TracerOptions {
  /**
   * Additional options for the tracer
   */
  [key: string]: unknown;
}

/**
 * TracerProvider interface which abstracts the underlying OpenTelemetry tracer implementation.
 * This interface allows for easier testing and potential future changes to the tracing backend.
 */
export interface TracerProvider {
  /**
   * Returns a Tracer, creating one if one with the given name and version is not already created.
   *
   * @param name The name of the tracer or instrumentation library
   * @param version The version of the tracer or instrumentation library (optional)
   * @param options Additional options for the tracer (optional)
   * @returns A Tracer with the given name and version
   */
  getTracer(name: string, version?: string, options?: TracerOptions): Tracer;

  /**
   * Checks if the tracer provider is enabled for the given parameters.
   *
   * @param name The name of the tracer or instrumentation library (optional)
   * @param version The version of the tracer or instrumentation library (optional)
   * @param options Additional options for the tracer (optional)
   * @returns A boolean indicating whether the tracer provider is enabled
   */
  isEnabled(name?: string, version?: string, options?: TracerOptions): boolean;

  /**
   * Forcefully flushes all spans that have not yet been exported.
   * 
   * @param timeoutMillis The maximum time to wait for the flush to complete in milliseconds
   * @returns A promise that resolves when the flush is complete or rejects if the timeout is reached
   */
  forceFlush(timeoutMillis?: number): Promise<void>;

  /**
   * Shuts down the tracer provider, ending all active spans and flushing any remaining spans.
   * After shutdown, the tracer provider should not be used.
   * 
   * @param timeoutMillis The maximum time to wait for the shutdown to complete in milliseconds
   * @returns A promise that resolves when the shutdown is complete or rejects if the timeout is reached
   */
  shutdown(timeoutMillis?: number): Promise<void>;

  /**
   * Gets the active context for the current execution.
   * 
   * @returns The current active context
   */
  getActiveContext(): Context;

  /**
   * Sets the active context for the current execution.
   * 
   * @param context The context to set as active
   * @returns A function that restores the previous context when called
   */
  setActiveContext(context: Context): () => void;

  /**
   * Extracts context from carrier using the configured propagator.
   * 
   * @param carrier The carrier object containing the propagation context
   * @returns The extracted context
   */
  extractContext(carrier: Record<string, unknown>): Context;

  /**
   * Injects the current context into the carrier using the configured propagator.
   * 
   * @param carrier The carrier object to inject the context into
   * @param context The context to inject (defaults to the current active context)
   */
  injectContext(carrier: Record<string, unknown>, context?: Context): void;
}