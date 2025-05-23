# AUSTA SuperApp Tracing Package Tests

## Overview

This directory contains the comprehensive test suite for the AUSTA SuperApp tracing package. The tracing package provides distributed tracing capabilities across all journey services (Health, Care, Plan) using OpenTelemetry, enabling end-to-end request visualization, performance monitoring, and error tracking throughout the application.

## Testing Philosophy

The testing approach for the tracing package follows these key principles:

1. **Isolation**: Tests should run independently of actual telemetry infrastructure, using mocks and in-memory exporters to verify tracing behavior without external dependencies.

2. **Comprehensiveness**: Tests cover all aspects of tracing functionality, from individual span creation to cross-service context propagation.

3. **Journey-Awareness**: Tests verify that journey-specific context (Health, Care, Plan) is properly maintained in traces across service boundaries.

4. **Performance Verification**: Tests include performance assertions to ensure tracing overhead remains within acceptable limits.

5. **Error Handling**: Tests verify proper error recording, status setting, and exception handling within traced operations.

## Folder Structure

The test directory is organized as follows:

```
test/
u251cu2500u2500 e2e/                    # End-to-end tests across service boundaries
u251cu2500u2500 fixtures/               # Test data and sample objects
u251cu2500u2500 integration/            # Tests for component interactions
u251cu2500u2500 mocks/                  # Mock implementations of dependencies
u251cu2500u2500 unit/                   # Unit tests for individual components
u251cu2500u2500 utils/                  # Test utilities and helpers
u251cu2500u2500 jest.config.js          # Jest configuration for tests
u251cu2500u2500 README.md               # This documentation file
u251cu2500u2500 setup.ts                # Test environment setup
u251cu2500u2500 teardown.ts             # Test environment cleanup
u2514u2500u2500 test-constants.ts       # Shared constants for tests
```

### Key Directories

#### Unit Tests (`unit/`)

Contains tests for individual components in isolation:

- `tracing.service.spec.ts`: Tests for the TracingService class
- `tracing.module.spec.ts`: Tests for the TracingModule NestJS module
- `index.spec.ts`: Tests for the package exports

#### Integration Tests (`integration/`)

Tests interactions between components:

- `tracing-service-opentelemetry.integration.spec.ts`: Tests TracingService interaction with OpenTelemetry
- `tracing-service-logger.integration.spec.ts`: Tests correlation between traces and logs
- `tracing-context-propagation.integration.spec.ts`: Tests trace context propagation mechanisms
- `tracing-error-handling.integration.spec.ts`: Tests error handling in traced operations
- `tracing-module.integration.spec.ts`: Tests TracingModule in a NestJS application

#### End-to-End Tests (`e2e/`)

Tests tracing functionality across service boundaries:

- `integration.e2e-spec.ts`: Tests complete trace lifecycle across multiple services
- `mock-services.ts`: Lightweight services that simulate the microservice architecture
- `tracing-collector.ts`: Utility to capture and analyze traces during tests
- `tracing-setup.util.ts`: Setup utilities for e2e test environment

#### Test Utilities (`utils/`)

Reusable utilities for testing tracing functionality:

- `mock-tracer.utils.ts`: Mock implementation of TracingService
- `span-assertion.utils.ts`: Custom assertions for verifying span content
- `span-capture.utils.ts`: Utilities for capturing and inspecting spans
- `test-module.utils.ts`: Utilities for bootstrapping test modules
- `trace-context.utils.ts`: Utilities for creating and manipulating trace contexts

#### Mocks (`mocks/`)

Mock implementations of dependencies:

- `mock-config.service.ts`: Mock ConfigService for configuration
- `mock-context.ts`: Mock OpenTelemetry Context
- `mock-logger.service.ts`: Mock LoggerService for logging
- `mock-span.ts`: Mock OpenTelemetry Span
- `mock-tracer.ts`: Mock OpenTelemetry Tracer
- `mock-tracing.service.ts`: Mock TracingService

#### Fixtures (`fixtures/`)

Test data and sample objects:

- `error-scenarios.ts`: Predefined error scenarios for testing
- `mock-spans.ts`: Pre-configured mock spans for different contexts
- `service-config.ts`: Mock configuration objects
- `span-attributes.ts`: Common span attributes for testing
- `trace-contexts.ts`: Sample trace context objects
- `tracing-headers.ts`: Mock HTTP headers with trace context

## Running Tests

### Running Unit Tests

To run unit tests for the tracing package:

```bash
# From the package root
npm run test

# Or specifically for unit tests
npm run test:unit
```

Unit tests focus on individual components and run quickly without external dependencies.

### Running Integration Tests

To run integration tests:

```bash
# From the package root
npm run test:integration
```

Integration tests verify interactions between components and may take longer to run.

### Running End-to-End Tests

To run end-to-end tests:

```bash
# From the package root
npm run test:e2e
```

E2E tests verify tracing functionality across service boundaries and require more resources.

### Running All Tests

To run all tests (unit, integration, and e2e):

```bash
# From the package root
npm run test:all
```

## Testing with Mocked OpenTelemetry Components

The tracing package tests use mock implementations of OpenTelemetry components to isolate tests from actual telemetry infrastructure. This approach provides several benefits:

1. Tests run faster without external dependencies
2. Tests are more reliable and deterministic
3. Tests can verify specific tracing behavior without side effects

### Example: Testing with Mock Tracer

```typescript
import { MockTracer } from '../mocks/mock-tracer';
import { TracingService } from '../../src/tracing.service';

describe('TracingService', () => {
  let mockTracer: MockTracer;
  let tracingService: TracingService;

  beforeEach(() => {
    mockTracer = new MockTracer();
    tracingService = new TracingService(mockConfigService, mockLoggerService);
    // Replace the real tracer with our mock
    (tracingService as any).tracer = mockTracer;
  });

  it('should create a span with the correct name', async () => {
    await tracingService.createSpan('test-span', async () => {
      // Operation being traced
    });

    expect(mockTracer.startSpan).toHaveBeenCalledWith('test-span');
  });
});
```

## Testing Trace Context Propagation

Testing trace context propagation across service boundaries is a critical aspect of the tracing package tests. The e2e tests use lightweight mock services that communicate with each other to simulate the microservice architecture of the AUSTA SuperApp.

### Example: Testing Cross-Service Trace Propagation

```typescript
import { TraceCollector } from './tracing-collector';
import { setupTestServices } from './tracing-setup.util';

describe('Cross-Service Tracing', () => {
  let traceCollector: TraceCollector;
  let services: TestServices;

  beforeEach(async () => {
    traceCollector = new TraceCollector();
    services = await setupTestServices(traceCollector);
  });

  it('should propagate trace context across service boundaries', async () => {
    // Make a request that crosses service boundaries
    await services.gateway.makeRequest('/health/metrics');

    // Verify that the trace spans form a connected trace
    const spans = traceCollector.getSpans();
    const traceId = spans[0].traceId;
    
    // All spans should have the same trace ID
    expect(spans.every(span => span.traceId === traceId)).toBe(true);
    
    // Verify the parent-child relationships between spans
    expect(traceCollector.hasParentChildRelationship('gateway-request', 'health-service-request')).toBe(true);
  });
});
```

## Adding New Tests

When adding new tests for the tracing package, follow these guidelines:

1. **Choose the Right Test Type**:
   - Use unit tests for testing individual components in isolation
   - Use integration tests for testing interactions between components
   - Use e2e tests for testing functionality across service boundaries

2. **Use Existing Utilities**:
   - Leverage the test utilities in the `utils/` directory
   - Use the mock implementations in the `mocks/` directory
   - Use the fixtures in the `fixtures/` directory

3. **Follow Naming Conventions**:
   - Unit tests: `*.spec.ts`
   - Integration tests: `*.integration.spec.ts`
   - E2E tests: `*.e2e-spec.ts`

4. **Include Journey-Specific Tests**:
   - Test with Health journey context
   - Test with Care journey context
   - Test with Plan journey context
   - Test cross-journey scenarios

5. **Test Error Handling**:
   - Test successful operations
   - Test error scenarios
   - Verify proper error recording in spans
   - Verify proper error propagation to logs

### Example: Adding a New Unit Test

```typescript
import { Test } from '@nestjs/testing';
import { TracingService } from '../../src/tracing.service';
import { MockConfigService, MockLoggerService } from '../mocks';

describe('TracingService - New Feature', () => {
  let tracingService: TracingService;
  let configService: MockConfigService;
  let loggerService: MockLoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TracingService,
        { provide: ConfigService, useClass: MockConfigService },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }).compile();

    tracingService = moduleRef.get<TracingService>(TracingService);
    configService = moduleRef.get(ConfigService) as MockConfigService;
    loggerService = moduleRef.get(LoggerService) as MockLoggerService;
  });

  it('should test new feature', async () => {
    // Test implementation
  });
});
```

## Best Practices for Tracing Tests

1. **Isolate Tests**: Each test should run independently without relying on external services or state from other tests.

2. **Mock External Dependencies**: Use mock implementations for external dependencies like OpenTelemetry, ConfigService, and LoggerService.

3. **Verify Span Attributes**: Check that spans have the expected attributes, especially journey-specific attributes.

4. **Test Error Handling**: Verify that errors are properly recorded in spans and propagated to logs.

5. **Test Performance**: Include assertions to verify that tracing overhead remains within acceptable limits.

6. **Test Context Propagation**: Verify that trace context is properly propagated across service boundaries.

7. **Clean Up Resources**: Ensure that all resources are properly cleaned up after tests, especially in e2e tests.

8. **Use Descriptive Test Names**: Use clear, descriptive names for tests that indicate what is being tested.

9. **Test Journey-Specific Behavior**: Include tests for Health, Care, and Plan journey-specific tracing behavior.

10. **Document Test Purpose**: Include comments explaining the purpose and expectations of each test.

## Journey-Specific Testing Guidelines

The AUSTA SuperApp is built around three distinct user journeys: Health, Care, and Plan. Each journey has specific tracing requirements and context information that should be included in traces.

### Health Journey

When testing tracing for the Health journey:

- Include health metrics in span attributes
- Test device connection tracing
- Verify health goal tracking spans
- Test integration with wearable devices

### Care Journey

When testing tracing for the Care journey:

- Include appointment information in span attributes
- Test telemedicine session tracing
- Verify medication tracking spans
- Test provider interaction tracing

### Plan Journey

When testing tracing for the Plan journey:

- Include plan and benefit information in span attributes
- Test claim processing tracing
- Verify coverage verification spans
- Test document submission tracing

## Conclusion

The tracing package tests provide comprehensive verification of the distributed tracing functionality in the AUSTA SuperApp. By following the guidelines in this document, you can ensure that your tests are effective, reliable, and maintainable.

For more information on the tracing package implementation, refer to the main package documentation.