# AUSTA SuperApp Tracing Package Tests

## Overview

This directory contains the comprehensive test suite for the `@austa/tracing` package, which provides distributed tracing capabilities across the AUSTA SuperApp microservices architecture. The tests ensure that the tracing functionality works correctly across all three user journeys (Health, Care, and Plan) and properly integrates with the OpenTelemetry ecosystem.

## Test Architecture

The test suite is organized into three main categories, each with increasing scope and complexity:

1. **Unit Tests**: Verify individual components in isolation with mocked dependencies
2. **Integration Tests**: Verify interactions between components within the tracing package
3. **End-to-End Tests**: Verify tracing functionality across service boundaries in a multi-service environment

## Directory Structure

```
test/
├── fixtures/            # Test data and mock objects
│   ├── error-scenarios.ts       # Predefined error scenarios for testing
│   ├── mock-spans.ts            # Pre-configured mock spans for different journeys
│   ├── service-config.ts        # Mock configuration objects for services
│   ├── span-attributes.ts       # Common span attributes for different journeys
│   ├── trace-contexts.ts        # Sample trace context objects
│   └── tracing-headers.ts       # Mock HTTP headers with trace context
├── mocks/               # Mock implementations for testing
│   ├── index.ts                 # Barrel file for all mocks
│   ├── mock-config.service.ts   # Mock NestJS ConfigService
│   ├── mock-context.ts          # Mock OpenTelemetry Context
│   ├── mock-logger.service.ts   # Mock NestJS LoggerService
│   ├── mock-span.ts             # Mock OpenTelemetry Span
│   ├── mock-tracer.ts           # Mock OpenTelemetry Tracer
│   └── mock-tracing.service.ts  # Mock TracingService
├── utils/               # Testing utilities
│   ├── index.ts                 # Barrel file for all utilities
│   ├── mock-tracer.utils.ts     # Configurable mock TracingService
│   ├── span-assertion.utils.ts  # Assertion utilities for spans
│   ├── span-capture.utils.ts    # Utilities for capturing spans
│   ├── test-module.utils.ts     # Utilities for NestJS test modules
│   └── trace-context.utils.ts   # Utilities for trace contexts
├── unit/                # Unit tests
│   ├── index.spec.ts            # Tests for package exports
│   ├── tracing.module.spec.ts   # Tests for TracingModule
│   └── tracing.service.spec.ts  # Tests for TracingService
├── integration/         # Integration tests
│   ├── fixtures.ts              # Test fixtures for integration tests
│   ├── tracing-context-propagation.integration.spec.ts  # Tests for context propagation
│   ├── tracing-error-handling.integration.spec.ts       # Tests for error handling
│   ├── tracing-module.integration.spec.ts              # Tests for module integration
│   ├── tracing-service-logger.integration.spec.ts      # Tests for logger integration
│   ├── tracing-service-opentelemetry.integration.spec.ts # Tests for OpenTelemetry integration
│   └── utils.ts                 # Utilities for integration tests
├── e2e/                 # End-to-end tests
│   ├── integration.e2e-spec.ts  # E2E tests for tracing
│   ├── jest-e2e.config.json     # Jest configuration for E2E tests
│   ├── mock-services.ts         # Mock microservices for testing
│   ├── tracing-collector.ts     # Trace collector for E2E tests
│   └── tracing-setup.util.ts    # Setup utilities for E2E tests
├── jest.config.js       # Jest configuration
├── README.md            # This documentation file
├── setup.ts             # Test setup file
├── teardown.ts          # Test teardown file
└── test-constants.ts    # Constants used across tests
```

## Running Tests

### Prerequisites

Before running the tests, ensure you have the following installed:

- Node.js (v16+)
- Yarn (v1.22+)

### Running All Tests

From the package root directory:

```bash
yarn test
```

### Running Specific Test Types

```bash
# Run only unit tests
yarn test:unit

# Run only integration tests
yarn test:integration

# Run only end-to-end tests
yarn test:e2e

# Run tests with coverage report
yarn test:cov
```

### Running Individual Test Files

```bash
# Run a specific test file
yarn test -- -t "TracingService"

# Run tests in watch mode during development
yarn test:watch
```

## Testing Approach

### Unit Testing

Unit tests focus on testing individual components in isolation:

- **TracingModule**: Tests verify proper module configuration, dependency imports, and exports
- **TracingService**: Tests verify span creation, error handling, and interaction with OpenTelemetry
- **Package Exports**: Tests verify that all public components are properly exported

Example unit test for TracingService:

```typescript
describe('TracingService', () => {
  let service: TracingService;
  let configService: MockConfigService;
  let logger: MockLoggerService;
  
  beforeEach(() => {
    configService = new MockConfigService();
    logger = new MockLoggerService();
    service = new TracingService(configService, logger);
  });
  
  it('should create spans with the correct name', async () => {
    const result = await service.createSpan('test-span', async () => {
      return 'test-result';
    });
    
    expect(result).toBe('test-result');
    // Verify span was created with correct name
  });
  
  it('should handle errors properly', async () => {
    const error = new Error('test error');
    
    await expect(service.createSpan('error-span', async () => {
      throw error;
    })).rejects.toThrow(error);
    
    // Verify error was recorded in span
  });
});
```

### Integration Testing

Integration tests verify interactions between components:

- **Context Propagation**: Tests verify trace context is properly propagated across service boundaries
- **Error Handling**: Tests verify errors are properly recorded in spans and propagated to logs
- **OpenTelemetry Integration**: Tests verify correct interaction with OpenTelemetry API
- **Logger Integration**: Tests verify correlation between traces and logs

Example integration test for context propagation:

```typescript
describe('Trace Context Propagation', () => {
  let moduleRef: TestingModule;
  let tracingService: TracingService;
  let httpService: HttpService;
  
  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TracingModule, HttpModule],
      providers: [/* ... */],
    }).compile();
    
    tracingService = moduleRef.get<TracingService>(TracingService);
    httpService = moduleRef.get<HttpService>(HttpService);
  });
  
  it('should propagate trace context in HTTP headers', async () => {
    // Test HTTP request with trace context
    // Verify trace context is properly propagated
  });
});
```

### End-to-End Testing

End-to-end tests verify tracing functionality in a multi-service environment:

- **Cross-Service Tracing**: Tests verify trace context flows correctly between services
- **Real HTTP Requests**: Tests use actual HTTP requests between services
- **Complete Trace Lifecycle**: Tests verify the complete lifecycle of traces

Example E2E test setup:

```typescript
describe('Tracing E2E', () => {
  let healthService: INestApplication;
  let careService: INestApplication;
  let planService: INestApplication;
  let traceCollector: TraceCollector;
  
  beforeAll(async () => {
    // Set up multiple NestJS applications with TracingModule
    // Configure trace collector
  });
  
  it('should maintain trace context across service boundaries', async () => {
    // Make request from health service to care service to plan service
    // Verify trace context is maintained across all services
    // Check span hierarchy and relationships
  });
});
```

## Testing with Mocked OpenTelemetry Components

The test suite uses mock implementations of OpenTelemetry components to avoid dependencies on external tracing infrastructure:

- **MockTracer**: Simulates the OpenTelemetry Tracer interface
- **MockSpan**: Simulates the OpenTelemetry Span interface
- **MockContext**: Simulates the OpenTelemetry Context

These mocks allow tests to verify tracing behavior without requiring actual telemetry backends.

## Journey-Specific Testing

The test suite includes specific fixtures and utilities for testing tracing in each journey context:

### Health Journey

Tests verify tracing for health-specific operations:

- Health metric recording
- Goal achievement tracking
- Device synchronization
- Health insight generation

### Care Journey

Tests verify tracing for care-specific operations:

- Appointment booking
- Medication adherence
- Telemedicine sessions
- Care plan progress

### Plan Journey

Tests verify tracing for plan-specific operations:

- Claim submission
- Benefit utilization
- Plan selection and comparison
- Reward redemption

## Testing Trace Context Propagation

The test suite includes utilities for testing trace context propagation across different transport mechanisms:

- **HTTP Headers**: Tests verify W3C Trace Context headers
- **Kafka Messages**: Tests verify trace context in message headers
- **gRPC Metadata**: Tests verify trace context in gRPC metadata

Example of testing HTTP header propagation:

```typescript
it('should propagate trace context in HTTP headers', async () => {
  const headers = {};
  
  await tracingService.createSpan('http-request', async () => {
    // Inject trace context into headers
    const context = trace.getActiveContext();
    propagator.inject(context, headers, contextSetter);
    
    // Make HTTP request with headers
    return httpService.get('https://example.com', { headers }).toPromise();
  });
  
  // Verify headers contain trace context (traceparent, tracestate)
  expect(headers).toHaveProperty('traceparent');
});
```

## Contributing New Tests

### Adding Unit Tests

1. Create a new test file in the `unit/` directory
2. Import the component to test and any necessary mocks
3. Write test cases that verify component behavior in isolation
4. Run tests with `yarn test:unit` to verify

### Adding Integration Tests

1. Create a new test file in the `integration/` directory with the `.integration.spec.ts` suffix
2. Use the `test-module.utils.ts` to create NestJS test modules
3. Write test cases that verify interactions between components
4. Run tests with `yarn test:integration` to verify

### Adding End-to-End Tests

1. Create a new test file in the `e2e/` directory with the `.e2e-spec.ts` suffix
2. Use the `tracing-setup.util.ts` to create a multi-service test environment
3. Write test cases that verify tracing across service boundaries
4. Run tests with `yarn test:e2e` to verify

## Best Practices

### Span Verification

Use the `span-assertion.utils.ts` utilities to verify span content:

```typescript
// Verify span has the correct attributes
expect(span).toHaveAttribute('http.method', 'GET');
expect(span).toHaveAttribute('http.url', 'https://example.com');

// Verify span has the correct status
expect(span).toHaveStatus(SpanStatusCode.OK);

// Verify span has recorded an exception
expect(span).toHaveRecordedException(error);
```

### Context Propagation

Use the `trace-context.utils.ts` utilities to test context propagation:

```typescript
// Create a trace context for a specific journey
const context = createHealthJourneyContext(userId, sessionId);

// Inject context into carriers (headers, metadata)
injectContext(context, headers);

// Extract context from carriers
const extractedContext = extractContext(headers);

// Verify context is properly propagated
expect(extractedContext).toMatchTraceContext(context);
```

### Error Handling

Test both successful and error scenarios:

```typescript
// Test successful case
it('should complete span successfully', async () => {
  // Test successful operation
});

// Test error case
it('should record exception in span', async () => {
  // Test operation that throws an error
});
```

## Troubleshooting

### Common Issues

1. **Context Not Propagating**: Ensure the W3C Trace Context propagator is configured correctly
2. **Spans Not Being Created**: Verify the tracer is properly initialized with the correct service name
3. **Tests Interfering With Each Other**: Ensure proper cleanup in `afterEach` and `afterAll` hooks

### Debugging Tips

1. Use the `span-capture.utils.ts` to capture and inspect spans during tests
2. Enable debug logging with `DEBUG=true yarn test` for more detailed output
3. Use the `tracing-collector.ts` in E2E tests to capture and analyze complete traces

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

## License

This test suite is part of the AUSTA SuperApp and is subject to the same licensing terms as the main application.