# Logging Package Testing Documentation

## Overview

This document provides comprehensive guidance for the testing approach used in the AUSTA SuperApp logging package. The logging package is a critical component that provides structured, context-enriched logging capabilities across all backend services, with special support for the journey-centered architecture of the platform.

## Testing Philosophy

The logging package testing follows these core principles:

1. **Complete Coverage**: Tests should cover all functionality, edge cases, and error scenarios.
2. **Journey Awareness**: Tests must verify journey-specific context enrichment for all three journeys (Health, Care, Plan).
3. **Realistic Environments**: Tests should simulate production-like environments where appropriate.
4. **Isolation**: Unit tests should isolate components with proper mocking of dependencies.
5. **Integration**: Integration tests should verify components work together correctly.
6. **End-to-End**: E2E tests should verify the logging system works in a complete NestJS application.

## Folder Structure

The test directory is organized as follows:

```
test/
├── README.md                 # This documentation file
├── jest.config.js            # Jest configuration for all tests
├── setup.ts                  # Global test setup
├── teardown.ts               # Global test teardown
├── test-constants.ts         # Shared test constants
├── e2e/                      # End-to-end tests
│   ├── exceptions-integration.e2e-spec.ts
│   ├── journey-context.e2e-spec.ts
│   ├── logger.e2e-spec.ts
│   ├── test-app.module.ts    # Test NestJS application
│   └── tracing-integration.e2e-spec.ts
├── fixtures/                 # Test data and objects
│   ├── config-options.fixture.ts
│   ├── error-objects.fixture.ts
│   ├── journey-data.fixture.ts
│   ├── log-contexts.fixture.ts
│   └── log-entries.fixture.ts
├── unit/                     # Unit tests
│   ├── context-manager.spec.ts
│   ├── integration.spec.ts
│   ├── logger-module.spec.ts
│   └── logger-service.spec.ts
└── utils/                    # Test utilities
    ├── assertion.utils.ts
    ├── index.ts
    ├── log-capture.utils.ts
    ├── mocks.ts
    └── test-context.utils.ts
```

## Test Types

### Unit Tests

Unit tests focus on testing individual components in isolation. They use mocks to replace dependencies and focus on verifying the component's behavior under various conditions.

**Key Unit Test Files:**
- `logger-service.spec.ts` - Tests the core LoggerService functionality
- `logger-module.spec.ts` - Tests the NestJS module registration
- `context-manager.spec.ts` - Tests the context management functionality

### Integration Tests

Integration tests verify that components work together correctly. They use minimal mocking and focus on the interactions between components.

**Key Integration Test Files:**
- `integration.spec.ts` - Tests the complete logging pipeline

### End-to-End Tests

E2E tests verify that the logging system works correctly in a complete NestJS application. They use a test application that simulates a real AUSTA SuperApp backend service.

**Key E2E Test Files:**
- `logger.e2e-spec.ts` - Tests core logging functionality
- `journey-context.e2e-spec.ts` - Tests journey-specific context enrichment
- `exceptions-integration.e2e-spec.ts` - Tests exception handling and logging
- `tracing-integration.e2e-spec.ts` - Tests distributed tracing integration

## Test Utilities

The `utils` directory contains utilities that support testing:

- **Assertion Utilities** (`assertion.utils.ts`) - Custom assertions for verifying log content and format
- **Log Capture Utilities** (`log-capture.utils.ts`) - Utilities for capturing log output during tests
- **Mock Utilities** (`mocks.ts`) - Mock implementations of logging dependencies
- **Test Context Utilities** (`test-context.utils.ts`) - Utilities for creating test contexts

## Test Fixtures

The `fixtures` directory contains test data and objects:

- **Config Options** (`config-options.fixture.ts`) - Sample logger configurations
- **Error Objects** (`error-objects.fixture.ts`) - Sample error objects for testing error logging
- **Journey Data** (`journey-data.fixture.ts`) - Journey-specific test data
- **Log Contexts** (`log-contexts.fixture.ts`) - Sample logging contexts
- **Log Entries** (`log-entries.fixture.ts`) - Sample log entries

## Running Tests

### Running All Tests

```bash
# From the package root
npm test

# Or with yarn
yarn test
```

### Running Specific Test Types

```bash
# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# With coverage report
npm run test:cov
```

### Running Individual Test Files

```bash
# Run a specific test file
npm test -- -t "LoggerService"

# Run tests matching a pattern
npm test -- --testPathPattern="unit/logger"
```

## Adding New Tests

### Adding a Unit Test

1. Create a new file in the `unit` directory with the `.spec.ts` extension
2. Import necessary utilities and fixtures
3. Use Jest's `describe` and `it` functions to structure your tests
4. Use the assertion utilities for consistent verification

Example:

```typescript
import { LoggerService } from '../../src/logger.service';
import { assertLogContains } from '../utils/assertion.utils';
import { sampleLogEntries } from '../fixtures/log-entries.fixture';

describe('YourComponent', () => {
  let component: YourComponent;
  
  beforeEach(() => {
    component = new YourComponent();
  });
  
  it('should log correctly', () => {
    // Arrange
    const logCapture = captureLogOutput();
    
    // Act
    component.doSomething();
    
    // Assert
    assertLogContains(logCapture, {
      level: 'info',
      message: 'Expected message',
      context: { journey: 'health' }
    });
  });
});
```

### Adding an E2E Test

1. Create a new file in the `e2e` directory with the `.e2e-spec.ts` extension
2. Import the test application module
3. Use NestJS testing utilities to create a test application
4. Test the logging functionality in a complete application context

Example:

```typescript
import { Test } from '@nestjs/testing';
import { TestAppModule } from './test-app.module';
import { LoggerService } from '../../src/logger.service';
import { captureAppLogs } from '../utils/log-capture.utils';

describe('Logger E2E', () => {
  let app;
  let loggerService: LoggerService;
  
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    
    app = moduleRef.createNestApplication();
    await app.init();
    
    loggerService = app.get(LoggerService);
  });
  
  afterEach(async () => {
    await app.close();
  });
  
  it('should log with journey context', async () => {
    // Arrange
    const logCapture = captureAppLogs(app);
    
    // Act
    loggerService.log('Test message', { journey: 'health' });
    
    // Assert
    expect(logCapture).toContainLogWithContext({
      journey: 'health',
      message: 'Test message'
    });
  });
});
```

## Journey-Specific Testing

The AUSTA SuperApp is built around three core journeys: Health, Care, and Plan. The logging package must support journey-specific context enrichment to enable effective debugging and monitoring of journey-specific functionality.

When testing journey-specific logging:

1. Use the journey data fixtures to create realistic journey contexts
2. Verify that logs include the correct journey identifier
3. Test all three journeys to ensure consistent behavior
4. Test cross-journey scenarios to verify context isolation

Example:

```typescript
import { healthJourneyContext, careJourneyContext, planJourneyContext } 
  from '../fixtures/journey-data.fixture';

describe('Journey Context Logging', () => {
  it('should log with Health journey context', () => {
    // Test with Health journey context
  });
  
  it('should log with Care journey context', () => {
    // Test with Care journey context
  });
  
  it('should log with Plan journey context', () => {
    // Test with Plan journey context
  });
  
  it('should maintain journey isolation in cross-journey scenarios', () => {
    // Test cross-journey context isolation
  });
});
```

## Troubleshooting

### Common Test Issues

1. **Context Leakage**: If tests are failing due to unexpected context values, check for context leakage between tests. Use the `beforeEach` hook to reset context.

2. **Async Context Issues**: When testing async code, ensure that the async context is properly maintained. Use the async context utilities provided in the test utils.

3. **Mock Transport Failures**: If tests fail due to transport issues, check that the mock transports are properly configured and reset between tests.

4. **Environment Variables**: Some tests may depend on environment variables. Ensure that the test environment is properly configured in `setup.ts` and reset in `teardown.ts`.

### Debugging Tests

```bash
# Run tests in debug mode
npm run test:debug

# Run a specific test file in debug mode
npm run test:debug -- path/to/test.spec.ts
```

## Best Practices

1. **Use Fixtures**: Always use the provided fixtures for test data to ensure consistency.

2. **Isolate Tests**: Each test should be independent and not rely on the state from other tests.

3. **Mock External Dependencies**: Use the provided mock utilities to replace external dependencies.

4. **Test Edge Cases**: Include tests for error conditions, edge cases, and unusual inputs.

5. **Journey Coverage**: Ensure tests cover all three journeys (Health, Care, Plan) where applicable.

6. **Realistic Data**: Use realistic data that matches production patterns for more effective testing.

7. **Clear Assertions**: Use the custom assertion utilities for clear, specific test assertions.

## Conclusion

The logging package is a critical component of the AUSTA SuperApp backend infrastructure, providing structured, context-enriched logging across all services. The comprehensive testing approach ensures that the logging system works correctly in all scenarios, with special attention to the journey-centered architecture of the platform.

By following the guidelines in this document, you can maintain and extend the logging package tests to ensure continued reliability and functionality as the AUSTA SuperApp evolves.