/**
 * @file Error Test Fixtures Index
 * 
 * This file serves as the central export point for all error test fixtures,
 * providing a clean API for importing test data in unit, integration, and e2e tests.
 * 
 * Fixtures are organized by category for better discoverability:
 * - Base Errors: Standard error instances for testing core error functionality
 * - Error Metadata: Context, metadata, and serialization examples
 * - HTTP Contexts: Mock HTTP request/response objects
 * - Journey Errors: Journey-specific error instances
 * - NestJS Contexts: Mock NestJS execution contexts
 * - Retry Scenarios: Sample retry scenarios and transient error patterns
 * 
 * Helper functions are provided to customize fixtures for specific test scenarios.
 */

// Re-export all fixtures from their respective files
export * from './base-errors';
export * from './error-metadata';
export * from './http-contexts';
export * from './journey-errors';
export * from './nest-contexts';
export * from './retry-scenarios';

// Export categorized fixtures for better organization and discoverability
export const fixtures = {
  /**
   * Base error instances for testing core error functionality
   * Includes BaseError, ValidationError, BusinessError, TechnicalError, etc.
   */
  baseErrors: {
    // These will be imported from base-errors.ts
  },

  /**
   * Error context, metadata, and serialization examples
   * Useful for testing error enrichment, transformation, and formatting
   */
  errorMetadata: {
    // These will be imported from error-metadata.ts
  },

  /**
   * Mock HTTP request and response objects
   * For testing error middleware, filters, and serialization
   */
  httpContexts: {
    // These will be imported from http-contexts.ts
  },

  /**
   * Journey-specific error instances
   * Organized by journey (Health, Care, Plan) with common scenarios
   */
  journeyErrors: {
    // These will be imported from journey-errors.ts
  },

  /**
   * Mock NestJS execution contexts
   * For testing exception filters, guards, interceptors, and decorators
   */
  nestContexts: {
    // These will be imported from nest-contexts.ts
  },

  /**
   * Retry scenarios and transient error patterns
   * For testing retry mechanisms and circuit breakers
   */
  retryScenarios: {
    // These will be imported from retry-scenarios.ts
  },
};

/**
 * Helper functions for customizing test fixtures
 */
export const helpers = {
  /**
   * Creates a customized base error with specified properties
   * 
   * @param type - The type of base error to create
   * @param overrides - Properties to override in the base error
   * @returns A customized base error instance
   */
  createBaseError: (type: string, overrides: Record<string, any> = {}) => {
    // Implementation will depend on the actual structure of base-errors.ts
    return { type, ...overrides };
  },

  /**
   * Creates a journey-specific error with custom properties
   * 
   * @param journey - The journey (health, care, plan)
   * @param errorType - The type of error within that journey
   * @param overrides - Properties to override in the error
   * @returns A customized journey error instance
   */
  createJourneyError: (journey: string, errorType: string, overrides: Record<string, any> = {}) => {
    // Implementation will depend on the actual structure of journey-errors.ts
    return { journey, errorType, ...overrides };
  },

  /**
   * Creates a mock HTTP context with custom request and response properties
   * 
   * @param requestOverrides - Properties to override in the request object
   * @param responseOverrides - Properties to override in the response object
   * @returns A customized HTTP context object
   */
  createHttpContext: (requestOverrides: Record<string, any> = {}, responseOverrides: Record<string, any> = {}) => {
    // Implementation will depend on the actual structure of http-contexts.ts
    return {
      request: { ...requestOverrides },
      response: { ...responseOverrides },
    };
  },

  /**
   * Creates a retry scenario with custom properties
   * 
   * @param scenarioType - The type of retry scenario
   * @param overrides - Properties to override in the scenario
   * @returns A customized retry scenario
   */
  createRetryScenario: (scenarioType: string, overrides: Record<string, any> = {}) => {
    // Implementation will depend on the actual structure of retry-scenarios.ts
    return { scenarioType, ...overrides };
  },

  /**
   * Creates a NestJS execution context with custom properties
   * 
   * @param contextType - The type of NestJS context (http, rpc, ws)
   * @param overrides - Properties to override in the context
   * @returns A customized NestJS execution context
   */
  createNestContext: (contextType: string, overrides: Record<string, any> = {}) => {
    // Implementation will depend on the actual structure of nest-contexts.ts
    return { contextType, ...overrides };
  },

  /**
   * Creates error metadata with custom properties
   * 
   * @param metadataType - The type of metadata
   * @param overrides - Properties to override in the metadata
   * @returns Customized error metadata
   */
  createErrorMetadata: (metadataType: string, overrides: Record<string, any> = {}) => {
    // Implementation will depend on the actual structure of error-metadata.ts
    return { metadataType, ...overrides };
  },
};