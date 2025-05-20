/**
 * Test teardown for OpenTelemetry tracing tests.
 * 
 * This file is executed after tests complete to clean up the OpenTelemetry global state,
 * ensuring that no state leaks between test runs. It handles resetting the global tracer,
 * clearing cached trace context, and shutting down any mock spans or exporters.
 * 
 * @module @austa/tracing/test/teardown
 */

import { context, trace, diag, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';

/**
 * Store original environment variables that might be modified during tests
 */
const originalEnv = { ...process.env };

/**
 * List of environment variables that are commonly set during tracing tests
 * and should be restored to their original values
 */
const TRACING_ENV_VARS = [
  'OTEL_SERVICE_NAME',
  'OTEL_TRACES_EXPORTER',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT',
  'OTEL_RESOURCE_ATTRIBUTES',
  'OTEL_LOG_LEVEL',
  'OTEL_SDK_DISABLED'
];

/**
 * Clean up OpenTelemetry global state after tests
 * 
 * This function performs the following cleanup operations:
 * 1. Resets the active context to prevent span leakage between tests
 * 2. Shuts down any active tracer providers
 * 3. Cleans up any span processors and exporters
 * 4. Restores original environment variables
 * 5. Resets diagnostic logging configuration
 * 
 * This is critical for test isolation as OpenTelemetry maintains global state
 * that can leak between tests, causing unpredictable behavior and false positives/negatives.
 * 
 * @returns Promise that resolves when cleanup is complete
 */
async function teardown(): Promise<void> {
  try {
    // Reset the active context to ensure no spans are leaked between tests
    context.disable();
    
    // Get the current global tracer provider if it exists
    const globalTracerProvider = trace.getTracerProvider();
    
    // If the provider is a NodeTracerProvider, shut it down properly
    if (globalTracerProvider instanceof NodeTracerProvider) {
      // End any active spans with an error status to prevent leaks
      const activeSpan = trace.getSpan(context.active());
      if (activeSpan?.isRecording()) {
        activeSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Span was still active during test teardown'
        });
        activeSpan.end();
      }
      
      // Properly shutdown the provider which will flush any pending spans
      await globalTracerProvider.shutdown();
    }
    
    // Reset the global tracer provider to the no-op implementation
    trace.disable();
    
    // Clear any diagnostic logger that might have been set during tests
    diag.disable();
    
    // Restore original environment variables
    for (const envVar of TRACING_ENV_VARS) {
      if (originalEnv[envVar]) {
        process.env[envVar] = originalEnv[envVar];
      } else {
        delete process.env[envVar];
      }
    }
    
    // Clean up any mock exporters that might have been created
    // This is important for tests that create their own exporters
    const mockExporter = new ConsoleSpanExporter();
    await mockExporter.shutdown();
    
    console.log('OpenTelemetry test teardown completed successfully');
  } catch (error) {
    console.error('Error during OpenTelemetry test teardown:', error);
    throw error;
  }
}

/**
 * Handle specific journey-related trace context cleanup
 * This ensures that any journey-specific trace context is properly cleaned up
 * between tests to prevent cross-journey contamination
 */
function cleanupJourneyTraceContext(): void {
  // Clean up health journey trace context
  if (process.env.HEALTH_JOURNEY_TRACE_CONTEXT) {
    delete process.env.HEALTH_JOURNEY_TRACE_CONTEXT;
  }
  
  // Clean up care journey trace context
  if (process.env.CARE_JOURNEY_TRACE_CONTEXT) {
    delete process.env.CARE_JOURNEY_TRACE_CONTEXT;
  }
  
  // Clean up plan journey trace context
  if (process.env.PLAN_JOURNEY_TRACE_CONTEXT) {
    delete process.env.PLAN_JOURNEY_TRACE_CONTEXT;
  }
}

// Execute teardown when this module is loaded
teardown()
  .then(() => cleanupJourneyTraceContext())
  .catch(error => {
    console.error('Failed to complete OpenTelemetry test teardown:', error);
    process.exit(1);
  });