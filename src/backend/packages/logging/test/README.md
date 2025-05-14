# Logging Package Test Documentation

## Overview

This directory contains the test suite for the `@austa/logging` package, which provides a centralized and consistent logging system for the AUSTA SuperApp backend services. The tests ensure that the logging system correctly handles journey-specific context, integrates with distributed tracing, formats logs appropriately for different environments, and reliably delivers logs to configured destinations.

## Table of Contents

- [Test Architecture](#test-architecture)
- [Folder Structure](#folder-structure)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Adding New Tests](#adding-new-tests)
- [Testing Utilities](#testing-utilities)
- [Mocks and Fixtures](#mocks-and-fixtures)
- [Troubleshooting](#troubleshooting)

## Test Architecture

The logging package test suite follows a comprehensive testing strategy that covers all aspects of the logging system:

- **Unit Tests**: Test individual components in isolation (formatters, transports, service methods)
- **Integration Tests**: Test interactions between components (logger + formatter + transport)
- **End-to-End Tests**: Test the logging system in a realistic NestJS application context

The tests use Jest as the primary testing framework, with custom utilities for log capture, assertion, and context simulation. The test architecture emphasizes:

- **Journey-Awareness**: Tests verify that logs correctly include journey context (Health, Care, Plan)
- **Trace Correlation**: Tests ensure proper integration with the distributed tracing system
- **Environment Adaptability**: Tests validate behavior across development, staging, and production environments
- **Error Resilience**: Tests verify proper handling of transport failures and formatting errors

## Folder Structure

The test directory is organized as follows:

```
test/
├── e2e/                    # End-to-end tests in a NestJS application context
│   ├── fixtures/           # E2E-specific test fixtures
│   └── utils/              # E2E-specific test utilities
├── fixtures/               # Shared test fixtures (log entries, contexts, etc.)
├── integration/            # Integration tests between components
├── mocks/                  # Mock implementations of dependencies
├── unit/                   # Unit tests for individual components
│   ├── formatters/         # Tests for log formatters
│   ├── transports/         # Tests for log transports
│   └── utils/              # Unit test utilities
├── utils/                  # Shared test utilities
├── jest.config.js          # Jest configuration
├── setup.ts                # Test setup file
├── teardown.ts             # Test teardown file
└── test-constants.ts       # Shared test constants
```

## Test Types

### Unit Tests

Unit tests focus on testing individual components in isolation:

- **Logger Service**: Tests for the core logging methods (log, error, warn, debug, verbose)
- **Formatters**: Tests for each formatter implementation (JSON, text, CloudWatch)
- **Transports**: Tests for each transport implementation (console, file, CloudWatch)
- **Context Management**: Tests for the context handling and propagation

Unit tests use extensive mocking to isolate the component under test from its dependencies.

### Integration Tests

Integration tests verify the correct interaction between components:

- **Logger + Formatter**: Tests that logs are correctly formatted
- **Logger + Transport**: Tests that logs are correctly delivered
- **Formatter + Transport**: Tests that formatted logs are correctly handled by transports
- **Complete Pipeline**: Tests the entire logging pipeline from logger to transport

Integration tests use minimal mocking, focusing on the interactions between real components.

### End-to-End Tests

E2E tests validate the logging system in a realistic application context:

- **NestJS Integration**: Tests within a NestJS application module
- **Journey Context**: Tests with realistic journey-specific requests
- **Exception Handling**: Tests integration with the exception system
- **Tracing Integration**: Tests correlation with the distributed tracing system

E2E tests use a test NestJS application with minimal mocking of external dependencies.

## Running Tests

### Running All Tests

```bash
# From the package root
npm test

# From the monorepo root
npm test -- --scope=@austa/logging
```

### Running Specific Test Types

```bash
# Run only unit tests
npm test -- --testPathPattern=unit

# Run only integration tests
npm test -- --testPathPattern=integration

# Run only e2e tests
npm test -- --testPathPattern=e2e
```

### Running Tests with Coverage

```bash
npm test -- --coverage
```

### Running Tests in Watch Mode

```bash
npm test -- --watch
```

## Adding New Tests

### Adding a Unit Test

1. Identify the component to test (formatter, transport, service method)
2. Create a new test file in the appropriate directory:
   - `unit/formatters/` for formatter tests
   - `unit/transports/` for transport tests
   - `unit/` for service and utility tests
3. Use the naming convention `[component-name].[type].spec.ts`
4. Import necessary test utilities and mocks
5. Structure your test with describe/it blocks
6. Use appropriate assertions for the component type

Example unit test structure:

```typescript
import { MockTransport } from '../../mocks/transport.mock';
import { JsonFormatter } from '../../../src/formatters/json.formatter';
import { logEntries } from '../../fixtures/log-entries.fixture';

describe('JsonFormatter', () => {
  let formatter: JsonFormatter;

  beforeEach(() => {
    formatter = new JsonFormatter();
  });

  it('should format log entries as JSON', () => {
    // Arrange
    const entry = logEntries.info;

    // Act
    const result = formatter.format(entry);

    // Assert
    expect(JSON.parse(result)).toMatchObject({
      level: 'info',
      message: entry.message,
      timestamp: expect.any(String),
    });
  });

  // Additional tests...
});
```

### Adding an Integration Test

1. Identify the components to test together
2. Create a new test file in the `integration/` directory
3. Use the naming convention `[component-a]-[component-b].integration.spec.ts`
4. Import the actual components (minimal mocking)
5. Test the interaction between components

Example integration test structure:

```typescript
import { LoggerService } from '../../src/logger.service';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { logCapture } from '../utils/log-capture.utils';

describe('Logger-Formatter-Transport Integration', () => {
  let logger: LoggerService;
  let formatter: JsonFormatter;
  let transport: ConsoleTransport;
  let capturedLogs: string[];

  beforeEach(() => {
    formatter = new JsonFormatter();
    transport = new ConsoleTransport({ formatter });
    logger = new LoggerService({ transports: [transport] });
    capturedLogs = logCapture.start();
  });

  afterEach(() => {
    logCapture.stop();
  });

  it('should log formatted messages through the transport', () => {
    // Act
    logger.log('Test message', { userId: '123' });

    // Assert
    expect(capturedLogs).toHaveLength(1);
    const loggedJson = JSON.parse(capturedLogs[0]);
    expect(loggedJson).toMatchObject({
      level: 'info',
      message: 'Test message',
      context: { userId: '123' },
    });
  });

  // Additional tests...
});
```

### Adding an E2E Test

1. Identify the scenario to test in a realistic application context
2. Create a new test file in the `e2e/` directory
3. Use the naming convention `[feature].e2e-spec.ts`
4. Use the test application module from `e2e/test-app.module.ts`
5. Test the logging behavior in a NestJS application context

Example E2E test structure:

```typescript
import { Test } from '@nestjs/testing';
import { TestAppModule } from './test-app.module';
import { LoggerService } from '../../src/logger.service';
import { logCapture } from '../utils/log-capture.utils';
import { createJourneyContext } from '../utils/test-context.utils';

describe('Logger E2E', () => {
  let app;
  let logger: LoggerService;
  let capturedLogs: string[];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    logger = app.get(LoggerService);
    capturedLogs = logCapture.start();
  });

  afterEach(async () => {
    logCapture.stop();
    await app.close();
  });

  it('should log with journey context in a NestJS application', () => {
    // Arrange
    const healthContext = createJourneyContext('health');
    
    // Act
    logger.log('Health metric recorded', healthContext);

    // Assert
    expect(capturedLogs).toHaveLength(1);
    const loggedJson = JSON.parse(capturedLogs[0]);
    expect(loggedJson).toMatchObject({
      journey: 'health',
      message: 'Health metric recorded',
    });
  });

  // Additional tests...
});
```

## Testing Utilities

The test suite provides several utilities to simplify testing:

### Log Capture

Utilities for capturing logs during tests:

```typescript
import { logCapture } from '../utils/log-capture.utils';

// Start capturing logs
const capturedLogs = logCapture.start();

// Your test code that produces logs
logger.log('Test message');

// Assert on captured logs
expect(capturedLogs).toHaveLength(1);
expect(capturedLogs[0]).toContain('Test message');

// Stop capturing
logCapture.stop();
```

### Test Context

Utilities for creating test contexts:

```typescript
import { createJourneyContext, createRequestContext } from '../utils/test-context.utils';

// Create a journey-specific context
const healthContext = createJourneyContext('health', { userId: '123' });

// Create a request context
const requestContext = createRequestContext({
  requestId: 'req-123',
  path: '/api/health',
  method: 'GET',
});

// Use in tests
logger.log('Test message', healthContext);
```

### Assertions

Custom assertions for verifying logs:

```typescript
import { assertLogContains, assertLogLevel } from '../utils/assertion.utils';

// Assert log contains specific fields
assertLogContains(capturedLogs[0], {
  message: 'Test message',
  userId: '123',
  journey: 'health',
});

// Assert log has correct level
assertLogLevel(capturedLogs[0], 'info');
```

## Mocks and Fixtures

### Mock Implementations

The test suite provides mock implementations of dependencies:

```typescript
import { MockLogger } from '../mocks/logger.service.mock';
import { MockTransport } from '../mocks/transport.mock';
import { MockFormatter } from '../mocks/formatter.mock';

// Create mock instances
const logger = new MockLogger();
const transport = new MockTransport();
const formatter = new MockFormatter();

// Use in tests
logger.log('Test message');

// Assert on mock calls
expect(logger.logs).toHaveLength(1);
expect(logger.logs[0].message).toBe('Test message');
```

### Test Fixtures

The test suite provides fixtures for common test data:

```typescript
import { logEntries } from '../fixtures/log-entries.fixture';
import { logContexts } from '../fixtures/log-contexts.fixture';
import { errorObjects } from '../fixtures/error-objects.fixture';

// Use fixtures in tests
const result = formatter.format(logEntries.error);
logger.log('Test message', logContexts.health);
logger.error('Error occurred', errorObjects.validation);
```

## Troubleshooting

### Common Issues

#### Tests Failing with Timeout Errors

**Problem**: Tests fail with timeout errors, especially in E2E tests.

**Solution**: Increase the test timeout in Jest configuration or for specific tests:

```typescript
// For a specific test
it('should complete a long-running operation', async () => {
  // Test code
}, 10000); // 10 second timeout

// Or in jest.config.js
module.exports = {
  // ...
  testTimeout: 10000,
};
```

#### Inconsistent Test Results

**Problem**: Tests pass sometimes and fail other times.

**Solution**: Check for test isolation issues:

1. Ensure proper cleanup in `afterEach` blocks
2. Use the `logCapture.stop()` method to stop capturing logs
3. Reset mocks between tests
4. Check for shared state between tests

#### Console Output During Tests

**Problem**: Tests produce unwanted console output.

**Solution**: Use silent logging during tests:

```typescript
// In setup.ts or beforeEach
const originalConsoleLog = console.log;
console.log = jest.fn();

// In teardown.ts or afterEach
console.log = originalConsoleLog;
```

#### Environment-Specific Test Failures

**Problem**: Tests pass locally but fail in CI or vice versa.

**Solution**: Ensure consistent environment variables:

1. Use `setup.ts` to set environment variables for tests
2. Mock environment-dependent services consistently
3. Check for timing issues that might be environment-dependent

### Debugging Tests

#### Using Jest Debug Mode

Run tests in debug mode:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then connect with Chrome DevTools or your IDE debugger.

#### Adding Debug Logs

Add temporary debug logs to troubleshoot test issues:

```typescript
it('should handle complex context', () => {
  // Arrange
  const context = createJourneyContext('health');
  console.log('Test context:', JSON.stringify(context, null, 2));
  
  // Act & Assert
  // ...
});
```

#### Isolating Failing Tests

Run only the failing test:

```bash
npm test -- -t "should handle complex context"
```

### Getting Help

If you encounter persistent issues with the logging tests:

1. Check the logging package documentation
2. Review recent changes to the logging implementation
3. Consult with the platform team responsible for the logging infrastructure
4. Open an issue in the project repository with detailed reproduction steps