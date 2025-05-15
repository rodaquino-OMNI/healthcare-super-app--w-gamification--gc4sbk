/**
 * Test teardown for OpenTelemetry tracing tests.
 * 
 * This file is responsible for cleaning up the OpenTelemetry global state after tests
 * to prevent state leakage between test runs. It resets the global tracer provider,
 * clears cached trace context, shuts down mock spans and exporters, and restores
 * environment variables to their original state.
 */

import { Context, trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';

// Import mock implementations and utilities from the test directory
import { MockTracer } from './mocks/mock-tracer';
import { MockSpan } from './mocks/mock-span';
import { MockContext } from './mocks/mock-context';

/**
 * Store original environment variables to restore them after tests
 */
const originalEnv: Record<string, string | undefined> = {};

/**
 * Track active mock exporters to ensure they're properly shut down
 */
const activeExporters: InMemorySpanExporter[] = [];

/**
 * Track active mock spans to ensure they're properly ended
 */
const activeSpans: MockSpan[] = [];

/**
 * Register a mock exporter for cleanup
 * @param exporter The exporter to register for cleanup
 */
export function registerMockExporter(exporter: InMemorySpanExporter): void {
  activeExporters.push(exporter);
}

/**
 * Register a mock span for cleanup
 * @param span The span to register for cleanup
 */
export function registerMockSpan(span: MockSpan): void {
  activeSpans.push(span);
}

/**
 * Save the current value of an environment variable to restore it later
 * @param key The environment variable name
 */
export function saveEnvironmentVariable(key: string): void {
  originalEnv[key] = process.env[key];
}

/**
 * Reset the OpenTelemetry global state
 * 
 * This function performs the following cleanup operations:
 * 1. Ends any active mock spans
 * 2. Shuts down any active mock exporters
 * 3. Resets the global tracer provider
 * 4. Clears any cached trace context
 * 5. Restores environment variables to their original values
 */
export async function resetOpenTelemetryGlobalState(): Promise<void> {
  // End any active mock spans
  activeSpans.forEach(span => {
    if (span.isRecording()) {
      span.end();
    }
  });
  activeSpans.length = 0;

  // Shut down any active mock exporters
  await Promise.all(
    activeExporters.map(exporter => exporter.shutdown())
  );
  activeExporters.length = 0;

  // Reset the global tracer provider
  // Note: OpenTelemetry doesn't officially support resetting the global provider,
  // but we can create a new no-op provider for testing purposes
  const noopProvider = new NodeTracerProvider();
  trace.setGlobalTracerProvider(noopProvider);

  // Clear any cached trace context
  // Use an empty context to reset the active context
  const emptyContext = Context.ROOT;
  trace.setSpan(emptyContext, trace.wrapSpanContext({
    traceId: '00000000000000000000000000000000',
    spanId: '0000000000000000',
    traceFlags: 0,
    isRemote: false,
  }));

  // Restore environment variables
  Object.entries(originalEnv).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
}

/**
 * Main teardown function to be called after tests
 */
export default async function teardown(): Promise<void> {
  try {
    await resetOpenTelemetryGlobalState();
    console.log('OpenTelemetry global state has been reset successfully.');
  } catch (error) {
    console.error('Error during OpenTelemetry teardown:', error);
  }
}