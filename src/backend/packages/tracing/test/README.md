# AUSTA SuperApp Tracing Package Tests

## Overview

This directory contains the test suite for the AUSTA SuperApp tracing package, which provides distributed tracing capabilities across all journey services. The tests verify the correct functioning of the tracing infrastructure, including span creation, context propagation, error handling, and integration with the logging system.

The tracing package is a critical component of the AUSTA SuperApp's observability infrastructure, enabling end-to-end request tracking across service boundaries and providing insights into system performance and error conditions.

## Test Structure

The test suite is organized into the following directories:

```
/test
  ├── unit/                 # Unit tests for individual components
  ├── integration/          # Tests for component interactions
  ├── e2e/                  # End-to-end tests for cross-service tracing
  ├── fixtures/             # Test data and scenarios
  ├── utils/                # Testing utilities and helpers
  ├── mocks/                # Mock implementations for testing
  ├── setup.ts              # Test environment setup
  ├── teardown.ts           # Test environment cleanup
  ├── jest.config.js        # Jest configuration
  └── README.md             # This file
```

### Unit Tests

Unit tests focus on testing individual components in isolation:

- `tracing.module.spec.ts` - Tests for the TracingModule class
- `tracing.service.spec.ts` - Tests for the TracingService class
- `index.spec.ts` - Tests for the package exports

### Integration Tests

Integration tests verify the correct interaction between components:

- `tracing-service-opentelemetry.integration.spec.ts` - Tests TracingService interaction with OpenTelemetry
- `tracing-service-logger.integration.spec.ts` - Tests integration with LoggerService
- `tracing-context-propagation.integration.spec.ts` - Tests trace context propagation
- `tracing-error-handling.integration.spec.ts` - Tests error handling in traces
- `tracing-module.integration.spec.ts` - Tests TracingModule integration with NestJS

### E2E Tests

End-to-end tests verify tracing functionality across service boundaries:

- Tests for trace context propagation across HTTP requests
- Tests for trace context propagation across Kafka messages
- Tests for end-to-end request visualization

### Test Utilities

The `utils` directory contains helper functions for testing:

- `test-module.utils.ts` - Utilities for creating test modules
- `span-assertion.utils.ts` - Custom assertions for verifying spans
- `mock-tracer.utils.ts` - Mock implementation of TracingService

### Mocks

The `mocks` directory contains mock implementations for testing:

- `mock-tracer.ts` - Mock implementation of OpenTelemetry Tracer
- `mock-logger.service.ts` - Mock implementation of LoggerService

### Fixtures

The `fixtures` directory contains test data and scenarios:

- `error-scenarios.ts` - Predefined error scenarios for testing
- `span-attributes.ts` - Common span attributes for testing
- `mock-spans.ts` - Pre-configured mock spans for different journeys

## Running Tests

### Running All Tests

To run all tests for the tracing package:

```bash
# From the root of the monorepo
npm run test:tracing

# Or from the tracing package directory
cd src/backend/packages/tracing
npm run test
```

### Running Specific Test Types

To run only unit tests:

```bash
npm run test:unit
```

To run only integration tests:

```bash
npm run test:integration
```

To run only e2e tests:

```bash
npm run test:e2e
```

### Running Individual Test Files

To run a specific test file:

```bash
npm run test -- -t "TracingService"
```

### Running Tests with Coverage

To run tests with coverage reporting:

```bash
npm run test:cov
```

## Testing Guidelines

### Testing with Mocked OpenTelemetry Components

The tracing package provides mock implementations of OpenTelemetry components for testing. These mocks allow you to verify tracing behavior without requiring actual telemetry infrastructure.

Example of testing with a mocked tracer:

```typescript
import { MockTracer } from '../mocks/mock-tracer';
import { TracingService } from '../../src/tracing.service';

describe('TracingService', () => {
  let tracingService: TracingService;
  let mockTracer: MockTracer;

  beforeEach(() => {
    mockTracer = new MockTracer();
    tracingService = new TracingService(mockConfigService, mockLogger);
    // Replace the real tracer with the mock
    (tracingService as any).tracer = mockTracer;
  });

  it('should create a span with the correct name', async () => {
    await tracingService.createSpan('test-span', async () => {
      // Operation being traced
    });

    expect(mockTracer.getSpans()).toHaveLength(1);
    expect(mockTracer.getSpans()[0].name).toBe('test-span');
  });
});
```

### Testing Trace Context Propagation

Testing trace context propagation across service boundaries is a critical aspect of the tracing package. The integration tests provide examples of how to verify context propagation across different transport mechanisms.

Example of testing HTTP context propagation:

```typescript
import { TestingModule, Test } from '@nestjs/testing';
import { TracingModule } from '../../src/tracing.module';
import { HttpService } from '@nestjs/axios';
import { createTestModule } from '../utils/test-module.utils';

describe('Trace Context Propagation - HTTP', () => {
  let moduleA: TestingModule;
  let moduleB: TestingModule;
  let httpService: HttpService;

  beforeEach(async () => {
    // Create two test modules to simulate two services
    moduleA = await createTestModule('service-a');
    moduleB = await createTestModule('service-b');
    httpService = moduleA.get<HttpService>(HttpService);
  });

  it('should propagate trace context across HTTP requests', async () => {
    // Make a request from service A to service B
    const response = await httpService.get('http://service-b/api').toPromise();

    // Verify that the trace ID is the same in both services
    const traceIdA = getActiveTraceId(moduleA);
    const traceIdB = response.data.traceId;
    expect(traceIdA).toBe(traceIdB);
  });
});
```

### Testing Error Handling in Traces

The tracing package includes comprehensive error handling to ensure that errors are properly recorded in spans and that spans are properly completed even in error scenarios.

Example of testing error handling:

```typescript
import { TracingService } from '../../src/tracing.service';
import { SpanStatusCode } from '@opentelemetry/api';

describe('TracingService - Error Handling', () => {
  let tracingService: TracingService;
  let mockTracer: MockTracer;

  beforeEach(() => {
    mockTracer = new MockTracer();
    tracingService = new TracingService(mockConfigService, mockLogger);
    (tracingService as any).tracer = mockTracer;
  });

  it('should record an exception and set status to ERROR when an error occurs', async () => {
    const error = new Error('Test error');

    await expect(tracingService.createSpan('error-span', async () => {
      throw error;
    })).rejects.toThrow(error);

    const span = mockTracer.getSpans()[0];
    expect(span.status.code).toBe(SpanStatusCode.ERROR);
    expect(span.events).toContainEqual(expect.objectContaining({
      name: 'exception',
      attributes: expect.objectContaining({
        'exception.message': 'Test error'
      })
    }));
  });
});
```

### Testing Journey-Specific Tracing

The AUSTA SuperApp has three distinct user journeys (Health, Care, and Plan), each with specific tracing requirements. The test fixtures include journey-specific span attributes and mock spans for testing these scenarios.

Example of testing journey-specific tracing:

```typescript
import { TracingService } from '../../src/tracing.service';
import { healthJourneyAttributes } from '../fixtures/span-attributes';

describe('Health Journey Tracing', () => {
  let tracingService: TracingService;
  let mockTracer: MockTracer;

  beforeEach(() => {
    mockTracer = new MockTracer();
    tracingService = new TracingService(mockConfigService, mockLogger);
    (tracingService as any).tracer = mockTracer;
  });

  it('should add health journey attributes to spans', async () => {
    await tracingService.createSpan('health-metric-update', async () => {
      // Health journey operation
    }, healthJourneyAttributes);

    const span = mockTracer.getSpans()[0];
    expect(span.attributes['journey.type']).toBe('health');
    expect(span.attributes['health.metric.type']).toBe('heart-rate');
  });
});
```

## Best Practices

### 1. Use the Provided Test Utilities

The test utilities in the `utils` directory provide a consistent way to create test modules, assert span properties, and mock tracing components. Always use these utilities to ensure consistent testing patterns.

### 2. Test All Aspects of Tracing

Ensure that your tests cover all aspects of tracing:

- Span creation and completion
- Attribute annotation
- Error handling
- Context propagation
- Integration with logging

### 3. Use Journey-Specific Fixtures

When testing journey-specific functionality, use the provided fixtures to ensure consistent testing across all journeys:

- `healthJourneyAttributes` for Health journey
- `careJourneyAttributes` for Care journey
- `planJourneyAttributes` for Plan journey

### 4. Test Both Success and Error Scenarios

Always test both successful operations and error scenarios to ensure that tracing works correctly in all cases.

### 5. Verify Trace Context Propagation

When testing services that communicate with each other, always verify that trace context is properly propagated across service boundaries.

## Contributing

When adding new tests to the tracing package, follow these guidelines:

1. Place tests in the appropriate directory based on their type (unit, integration, e2e)
2. Use the provided test utilities and mocks
3. Follow the existing naming conventions
4. Update this README.md if you add new test categories or utilities

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)