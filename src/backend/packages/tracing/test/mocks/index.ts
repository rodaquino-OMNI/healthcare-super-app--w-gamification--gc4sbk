/**
 * @file Barrel file that exports all mock implementations for the tracing package
 * 
 * This file simplifies test setup by providing a single import point for all
 * tracing-related mocks. Without this file, developers would need to import
 * each mock individually, making test setup more verbose and error-prone.
 */

// Export all mocks for easy importing in tests
export * from './mock-tracing.service';
export * from './mock-logger.service';
export * from './mock-config.service';
export * from './mock-context';
export * from './mock-span';
export * from './mock-tracer';

// Re-export specific types or constants if needed for testing
// For example, if there are specific test constants or helper functions

/**
 * Common test constants for tracing tests
 */
export const MOCK_TRACING_CONSTANTS = {
  DEFAULT_SERVICE_NAME: 'test-service',
  DEFAULT_SPAN_NAME: 'test-span',
  DEFAULT_TRACE_ID: '0af7651916cd43dd8448eb211c80319c',
  DEFAULT_SPAN_ID: 'b7ad6b7169203331',
};

/**
 * Helper function to create a mock span with pre-configured attributes
 * This simplifies test setup for components that require spans with specific attributes
 * 
 * @param name The name of the span
 * @param attributes Optional attributes to add to the span
 * @returns A configured mock span ready for testing
 */
export function createTestSpan(name: string, attributes?: Record<string, unknown>) {
  // This function would typically use the MockSpan class from mock-span.ts
  // Since we don't have access to the actual implementation, we're providing a placeholder
  // that would be implemented based on the actual MockSpan implementation
  return {
    name,
    attributes: attributes || {},
    // Additional properties would be added based on the actual MockSpan implementation
  };
}