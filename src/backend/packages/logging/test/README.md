# Logging Package Testing Documentation

## Overview

This directory contains the test suite for the `@austa/logging` package, which provides a centralized and consistent way to handle logging across all AUSTA SuperApp backend services. The testing architecture is designed to ensure the reliability, correctness, and performance of the logging system across different environments and use cases.

## Testing Philosophy

The logging package is a critical infrastructure component that affects all services in the AUSTA SuperApp. Our testing approach follows these principles:

1. **Comprehensive Coverage**: Tests should cover all aspects of the logging system, including different log levels, formatters, transports, and integrations.
2. **Journey-Aware Testing**: Tests should verify that logs properly include journey context (Health, Care, Plan) to support the journey-centered architecture.
3. **Realistic Scenarios**: Tests should simulate real-world usage patterns and edge cases that might occur in production.
4. **Isolation and Integration**: Both isolated component testing (unit tests) and integration testing are necessary to ensure components work correctly individually and together.
5. **Performance Considerations**: Tests should verify that logging operations don't significantly impact application performance.

## Test Directory Structure

The test directory is organized as follows:

```
test/
├── e2e/                      # End-to-end tests in a realistic application context
│   ├── exceptions-integration.e2e-spec.ts  # Tests for exception handling integration
│   ├── journey-context.e2e-spec.ts         # Tests for journey context in logs
│   ├── logger.e2e-spec.ts                  # Core logger functionality tests
│   ├── test-app.module.ts                  # Test application module for e2e tests
│   └── tracing-integration.e2e-spec.ts     # Tests for tracing integration
├── integration/               # Tests for component interactions
│   ├── fixtures.ts                         # Test fixtures for integration tests
│   ├── logger-context.integration.spec.ts  # Context management integration tests
│   ├── logger-module.integration.spec.ts   # Module integration tests
│   ├── logger-service-formatter.integration.spec.ts  # Formatter integration tests
│   ├── logger-service-transport.integration.spec.ts  # Transport integration tests
│   ├── logger-tracing.integration.spec.ts  # Tracing integration tests
│   └── utils.ts                            # Shared utilities for integration tests
├── unit/                      # Unit tests for individual components
│   ├── context-manager.spec.ts             # Context management unit tests
│   ├── integration.spec.ts                 # Component integration unit tests
│   ├── logger-module.spec.ts               # LoggerModule unit tests
│   └── logger-service.spec.ts              # LoggerService unit tests
├── jest.config.js             # Jest configuration
├── README.md                  # This documentation file
├── setup.ts                   # Test environment setup
├── teardown.ts                # Test environment cleanup
└── test-constants.ts          # Shared test constants and fixtures
```

## Test Types

### Unit Tests

Unit tests focus on testing individual components in isolation, using mocks for dependencies. These tests verify that each component behaves correctly according to its contract.

- **Location**: `test/unit/`
- **Naming Convention**: `*.spec.ts`
- **Focus**: Individual classes, functions, and methods

### Integration Tests

Integration tests verify that different components work correctly together. These tests use minimal mocking and test real interactions between components.

- **Location**: `test/integration/`
- **Naming Convention**: `*.integration.spec.ts`
- **Focus**: Interactions between components (e.g., LoggerService with formatters and transports)

### End-to-End Tests

End-to-end tests verify the logging system in a realistic application context, using a test NestJS application that includes the LoggerModule and related modules.

- **Location**: `test/e2e/`
- **Naming Convention**: `*.e2e-spec.ts`
- **Focus**: Complete logging flows in a realistic application context

## Running Tests

### Running All Tests

```bash
# From the package root directory
npm test

# Or with yarn
yarn test
```

### Running Specific Test Types

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only e2e tests
npm run test:e2e
```

### Running Tests with Coverage

```bash
npm run test:cov
```

### Running Tests in Watch Mode

```bash
npm run test:watch
```

## Adding New Tests

When adding new tests to the logging package, follow these guidelines:

### 1. Determine the Test Type

- **Unit Test**: If you're testing a single component in isolation
- **Integration Test**: If you're testing interactions between components
- **E2E Test**: If you're testing the logging system in a realistic application context

### 2. Follow the Naming Convention

- Unit tests: `component-name.spec.ts`
- Integration tests: `component-interaction.integration.spec.ts`
- E2E tests: `feature-name.e2e-spec.ts`

### 3. Use Existing Test Utilities

- Reuse test fixtures from `test-constants.ts` or create new ones if needed
- Use the helper functions in `integration/utils.ts` for integration tests
- Use the test application module in `e2e/test-app.module.ts` for e2e tests

### 4. Follow the Test Structure

```typescript
describe('ComponentName', () => {
  // Setup code (beforeEach, beforeAll)
  
  describe('methodName', () => {
    it('should do something specific', () => {
      // Test code
    });
    
    it('should handle error case', () => {
      // Test code for error case
    });
  });
  
  // More describe blocks for other methods
  
  // Cleanup code (afterEach, afterAll)
});
```

### 5. Test Journey-Specific Scenarios

Ensure your tests cover journey-specific scenarios where applicable:

- Health journey logging context
- Care journey logging context
- Plan journey logging context
- Cross-journey logging scenarios

## Test Coverage Requirements

The logging package has strict test coverage requirements:

- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

These requirements are enforced in the CI/CD pipeline, and PRs will fail if coverage drops below these thresholds.

## Mocking Strategy

### External Dependencies

External dependencies should be mocked in unit and integration tests. Common dependencies include:

- **TracingService**: For distributed tracing integration
- **ConfigService**: For configuration management
- **Transport Mechanisms**: For log delivery (Console, File, CloudWatch)

Example of mocking TracingService:

```typescript
const mockTracingService = {
  getCurrentTraceId: jest.fn().mockReturnValue('mock-trace-id'),
  getCurrentSpanId: jest.fn().mockReturnValue('mock-span-id'),
  recordError: jest.fn(),
};
```

### Internal Dependencies

For integration tests, prefer using real implementations of internal dependencies to test actual interactions. Only mock when necessary to control test conditions.

## Troubleshooting Common Test Issues

### Tests Failing Due to Async Context

If tests are failing because async context is not being properly maintained, ensure you're using the correct async testing patterns:

```typescript
it('should maintain context across async boundaries', async () => {
  // Use async/await for async tests
  await expect(asyncFunction()).resolves.toHaveProperty('contextValue');
});
```

### Tests Interfering with Each Other

If tests are interfering with each other, ensure proper cleanup in `afterEach` or `afterAll` hooks:

```typescript
afterEach(() => {
  jest.clearAllMocks();
  // Additional cleanup
});
```

### Inconsistent Test Results

If tests are producing inconsistent results, check for:

1. Time-dependent code (use jest's timer mocks)
2. Global state that's not being reset between tests
3. External dependencies that aren't properly mocked

## Best Practices

1. **Test One Thing at a Time**: Each test should verify one specific behavior or scenario.
2. **Use Descriptive Test Names**: Test names should clearly describe what's being tested and the expected outcome.
3. **Avoid Test Interdependence**: Tests should not depend on the results of other tests.
4. **Clean Up After Tests**: Reset any global state or mocks after each test.
5. **Use Realistic Test Data**: Test data should represent realistic scenarios that might occur in production.
6. **Test Edge Cases**: Include tests for error conditions, empty values, and other edge cases.
7. **Keep Tests Fast**: Tests should execute quickly to provide rapid feedback during development.

## Contributing to the Test Suite

When contributing to the test suite, follow these guidelines:

1. **Review Existing Tests**: Understand the existing test patterns before adding new ones.
2. **Maintain Test Quality**: Tests should be clear, concise, and maintainable.
3. **Update Documentation**: Update this README if you make significant changes to the testing approach.
4. **Run the Full Test Suite**: Ensure all tests pass before submitting a PR.
5. **Check Coverage**: Verify that your changes maintain or improve test coverage.

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Testing TypeScript Applications](https://www.typescriptlang.org/docs/handbook/testing-typescript.html)