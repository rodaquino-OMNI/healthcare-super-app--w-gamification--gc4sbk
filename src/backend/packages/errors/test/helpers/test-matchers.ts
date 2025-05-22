/**
 * Custom Jest matchers for error-specific testing scenarios.
 * 
 * These matchers extend Jest's assertion library to provide more readable and
 * expressive tests for error handling across the AUSTA SuperApp.
 */

import { ErrorType } from '../../src/categories/index';
import { AppException } from '../../src/base/app-exception';

// Type definitions for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Verifies that an error is of a specific error type (VALIDATION, BUSINESS, TECHNICAL, EXTERNAL)
       * @param expectedType The expected ErrorType
       */
      toBeErrorType(expectedType: ErrorType): R;

      /**
       * Checks if an error contains a specific error code
       * @param expectedCode The expected error code
       */
      toContainErrorCode(expectedCode: string): R;

      /**
       * Validates that an error contains journey-specific context
       * @param journeyType The expected journey type ('health', 'care', or 'plan')
       * @param contextProps Optional specific context properties to check for
       */
      toHaveJourneyContext(journeyType: 'health' | 'care' | 'plan', contextProps?: string[]): R;

      /**
       * Verifies that an error response matches the expected structure
       * @param expectedResponse The expected error response structure
       */
      toMatchErrorResponse(expectedResponse: Record<string, any>): R;

      /**
       * Checks if an error has another error as its cause
       * @param expectedCauseType The expected error type of the cause
       */
      toHaveCauseOfType(expectedCauseType: ErrorType | Function): R;
    }
  }
}

/**
 * Helper function to check if an object is an AppException
 */
function isAppException(received: any): received is AppException {
  return (
    received &&
    typeof received === 'object' &&
    'type' in received &&
    'code' in received &&
    'message' in received
  );
}

/**
 * Helper function to check if an object is an error response
 */
function isErrorResponse(received: any): boolean {
  return (
    received &&
    typeof received === 'object' &&
    'error' in received &&
    typeof received.error === 'object'
  );
}

/**
 * Helper function to extract the error object from various inputs
 */
function extractError(received: any): any {
  if (isAppException(received)) {
    return received;
  } else if (isErrorResponse(received)) {
    return received.error;
  } else if (received instanceof Error) {
    return received;
  }
  return received;
}

/**
 * Helper function to get journey context from an error
 */
function getJourneyContext(error: any, journeyType: string): any {
  if (!error || typeof error !== 'object') return null;
  
  // Check for context in different possible locations
  if (error.context && error.context[journeyType]) {
    return error.context[journeyType];
  } else if (error.details && error.details[journeyType]) {
    return error.details[journeyType];
  } else if (error[journeyType + 'Context']) {
    return error[journeyType + 'Context'];
  }
  
  return null;
}

// Define custom matchers
expect.extend({
  /**
   * Verifies that an error is of a specific error type
   */
  toBeErrorType(received: any, expectedType: ErrorType): jest.CustomMatcherResult {
    const error = extractError(received);
    const pass = error && error.type === expectedType;
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected error not to be of type ${expectedType}, but it was`
          : `Expected error to be of type ${expectedType}, but got ${error?.type || 'undefined'}`
    };
  },

  /**
   * Checks if an error contains a specific error code
   */
  toContainErrorCode(received: any, expectedCode: string): jest.CustomMatcherResult {
    const error = extractError(received);
    const pass = error && error.code === expectedCode;
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected error not to have code ${expectedCode}, but it did`
          : `Expected error to have code ${expectedCode}, but got ${error?.code || 'undefined'}`
    };
  },

  /**
   * Validates that an error contains journey-specific context
   */
  toHaveJourneyContext(
    received: any,
    journeyType: 'health' | 'care' | 'plan',
    contextProps?: string[]
  ): jest.CustomMatcherResult {
    const error = extractError(received);
    const context = getJourneyContext(error, journeyType);
    const pass = !!context;
    
    // If specific properties are provided, check that they exist in the context
    let missingProps: string[] = [];
    if (pass && contextProps && contextProps.length > 0) {
      missingProps = contextProps.filter(prop => !(prop in context));
      if (missingProps.length > 0) {
        return {
          pass: false,
          message: () =>
            `Expected ${journeyType} context to contain properties: ${missingProps.join(', ')}, but they were missing`
        };
      }
    }
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected error not to have ${journeyType} context, but it did`
          : `Expected error to have ${journeyType} context, but it was missing`
    };
  },

  /**
   * Verifies that an error response matches the expected structure
   */
  toMatchErrorResponse(received: any, expectedResponse: Record<string, any>): jest.CustomMatcherResult {
    // Handle both error objects and response objects with error property
    const errorResponse = isErrorResponse(received) ? received : { error: extractError(received) };
    
    // Check if the expected structure is present
    const expectedError = expectedResponse.error || expectedResponse;
    const actualError = errorResponse.error;
    
    // Check for required properties
    const requiredProps = ['type', 'code', 'message'];
    const missingProps = requiredProps.filter(prop => !(prop in actualError));
    
    if (missingProps.length > 0) {
      return {
        pass: false,
        message: () =>
          `Expected error response to contain properties: ${missingProps.join(', ')}, but they were missing`
      };
    }
    
    // Check if the properties match the expected values
    const mismatchedProps = Object.entries(expectedError)
      .filter(([key, value]) => actualError[key] !== value)
      .map(([key]) => key);
    
    const pass = mismatchedProps.length === 0;
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected error response not to match ${JSON.stringify(expectedError)}, but it did`
          : `Expected error response to match ${JSON.stringify(expectedError)}, but properties ${mismatchedProps.join(', ')} did not match`
    };
  },

  /**
   * Checks if an error has another error as its cause
   */
  toHaveCauseOfType(received: any, expectedCauseType: ErrorType | Function): jest.CustomMatcherResult {
    const error = extractError(received);
    
    // Check if the error has a cause property
    if (!error || !error.cause) {
      return {
        pass: false,
        message: () => `Expected error to have a cause, but it didn't`
      };
    }
    
    let pass = false;
    
    // Check if the cause matches the expected type
    if (typeof expectedCauseType === 'string') {
      // Check against ErrorType enum
      pass = isAppException(error.cause) && error.cause.type === expectedCauseType;
    } else if (typeof expectedCauseType === 'function') {
      // Check against constructor/class
      pass = error.cause instanceof expectedCauseType;
    }
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected error not to have cause of type ${expectedCauseType.toString()}, but it did`
          : `Expected error to have cause of type ${expectedCauseType.toString()}, but it didn't`
    };
  }
});

export {}; // This export is needed to make the file a module