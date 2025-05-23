/**
 * Jest setup file for end-to-end tests of the tracing package
 * 
 * This file is executed before each test file runs and sets up the global test environment
 * for tracing e2e tests, including:
 * - Configuring OpenTelemetry for testing
 * - Setting up the in-memory trace collector
 * - Initializing environment variables
 * - Extending Jest with custom matchers for trace assertions
 */

// Increase timeout for all tests to accommodate tracing operations
jest.setTimeout(30000);

// Silence OpenTelemetry SDK warnings during tests
process.env.OTEL_LOG_LEVEL = 'error';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OTEL_SERVICE_NAME = 'test-service';
process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4318';

// Extend Jest with custom matchers for trace assertions
expect.extend({
  toContainSpanWithName: (traces, expectedName) => {
    const found = traces.some(trace => 
      trace.spans.some(span => span.name === expectedName)
    );
    
    return {
      message: () => `Expected traces to contain span with name "${expectedName}"`,
      pass: found
    };
  },
  
  toHaveSpanWithAttributes: (traces, spanName, attributes) => {
    let foundSpan = null;
    
    // Find the span with the given name
    traces.some(trace => {
      foundSpan = trace.spans.find(span => span.name === spanName);
      return !!foundSpan;
    });
    
    if (!foundSpan) {
      return {
        message: () => `Expected to find span with name "${spanName}" but none was found`,
        pass: false
      };
    }
    
    // Check if the span has all the expected attributes
    const missingAttributes = [];
    for (const [key, value] of Object.entries(attributes)) {
      if (!foundSpan.attributes[key] || foundSpan.attributes[key] !== value) {
        missingAttributes.push(key);
      }
    }
    
    return {
      message: () => `Expected span "${spanName}" to have attributes ${JSON.stringify(attributes)} but missing: ${missingAttributes.join(', ')}`,
      pass: missingAttributes.length === 0
    };
  }
});

// Clean up resources after all tests complete
afterAll(async () => {
  // Allow time for any pending spans to be exported
  await new Promise(resolve => setTimeout(resolve, 1000));
});