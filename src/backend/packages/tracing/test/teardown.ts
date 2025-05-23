/**
 * Test teardown file for the tracing package.
 * 
 * This file is responsible for cleaning up the OpenTelemetry global state after tests complete,
 * ensuring that no state leaks between test runs. It resets the global tracer provider,
 * clears cached trace context, shuts down any mock spans or exporters, and restores
 * environment variables to their original state.
 */

import { context, trace, ROOT_CONTEXT } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';

/**
 * Global teardown function that runs after all tests complete.
 * This ensures the OpenTelemetry global state is properly reset.
 */
export default async function teardown(): Promise<void> {
  console.log('Cleaning up OpenTelemetry resources after tests...');
  
  // Reset the active context to the root context to prevent context leakage
  context.active().setValue(context.createKey('current-span'), undefined);
  context.disable();
  
  // Get the global tracer provider if it exists
  const globalTracerProvider = trace.getTracerProvider() as NodeTracerProvider;
  
  // If a tracer provider exists, shut it down properly
  if (globalTracerProvider && typeof globalTracerProvider.shutdown === 'function') {
    try {
      await globalTracerProvider.shutdown();
      console.log('Successfully shut down the tracer provider');
    } catch (error) {
      console.error('Error shutting down tracer provider:', error);
    }
  }
  
  // Reset the global tracer provider to the default no-op implementation
  trace.disable();
  
  // Clean up any in-memory span exporters that might be lingering
  cleanupMockExporters();
  
  // Restore original environment variables
  restoreEnvironmentVariables();
  
  console.log('OpenTelemetry teardown complete');
}

/**
 * Cleans up any mock exporters that might be lingering in the test environment.
 * This prevents spans from one test leaking into another.
 */
function cleanupMockExporters(): void {
  try {
    // Find any in-memory exporters that might be registered
    const globalThis = global as any;
    if (globalThis.__OTEL_TEST_EXPORTER__ && globalThis.__OTEL_TEST_EXPORTER__ instanceof InMemorySpanExporter) {
      globalThis.__OTEL_TEST_EXPORTER__.reset();
      console.log('Reset in-memory span exporter');
    }
    
    // Clear any cached exporters
    globalThis.__OTEL_TEST_EXPORTER__ = undefined;
  } catch (error) {
    console.error('Error cleaning up mock exporters:', error);
  }
}

/**
 * Restores environment variables to their original state.
 * This ensures that environment-specific configuration doesn't leak between tests.
 */
function restoreEnvironmentVariables(): void {
  try {
    // Restore original environment variables if they were saved
    const globalThis = global as any;
    if (globalThis.__ORIGINAL_ENV__) {
      Object.keys(process.env)
        .filter(key => key.startsWith('OTEL_'))
        .forEach(key => {
          delete process.env[key];
        });
      
      // Restore saved environment variables
      Object.keys(globalThis.__ORIGINAL_ENV__).forEach(key => {
        if (globalThis.__ORIGINAL_ENV__[key] !== undefined) {
          process.env[key] = globalThis.__ORIGINAL_ENV__[key];
        }
      });
      
      console.log('Restored original environment variables');
      globalThis.__ORIGINAL_ENV__ = undefined;
    }
  } catch (error) {
    console.error('Error restoring environment variables:', error);
  }
}