/**
 * Setup file for end-to-end tests of the error handling framework.
 * This file runs before each test file is executed.
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ErrorType } from '../src/categories/error-types.enum';

// Extend Jest's expect with custom matchers for error handling tests
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Custom matcher to check if a response contains a properly formatted error
       * with the expected type, code, and message.
       */
      toContainErrorResponse: (
        expectedType: ErrorType,
        expectedCode?: string,
        expectedMessage?: string | RegExp
      ) => R;
      
      /**
       * Custom matcher to check if a response contains journey-specific error context.
       */
      toContainJourneyContext: (journeyId: string) => R;
    }
  }
}

/**
 * Creates a supertest request object for the global test application.
 * This allows tests to make HTTP requests to the test application.
 */
global.createTestRequest = (): request.SuperTest<request.Test> => {
  if (!global.testApp) {
    throw new Error('Test application is not initialized. Make sure setup-e2e.ts is running properly.');
  }
  
  const httpServer = global.testApp.getHttpServer();
  return request(httpServer);
};

/**
 * Custom matcher to check if a response contains a properly formatted error.
 */
expect.extend({
  toContainErrorResponse(received, expectedType, expectedCode, expectedMessage) {
    const { error } = received.body;
    
    // Check if the response contains an error object
    if (!error) {
      return {
        message: () => `Expected response to contain an error object, but none was found`,
        pass: false,
      };
    }
    
    // Check if the error type matches
    const typeMatches = error.type === expectedType;
    
    // Check if the error code matches (if expected code is provided)
    const codeMatches = expectedCode ? error.code === expectedCode : true;
    
    // Check if the error message matches (if expected message is provided)
    let messageMatches = true;
    if (expectedMessage) {
      if (expectedMessage instanceof RegExp) {
        messageMatches = expectedMessage.test(error.message);
      } else {
        messageMatches = error.message === expectedMessage;
      }
    }
    
    const pass = typeMatches && codeMatches && messageMatches;
    
    return {
      message: () => {
        let message = `Expected response to ${pass ? 'not ' : ''}contain an error with`;
        if (!typeMatches) message += ` type ${expectedType}`;
        if (expectedCode && !codeMatches) message += ` code ${expectedCode}`;
        if (expectedMessage && !messageMatches) {
          message += ` message ${expectedMessage instanceof RegExp ? expectedMessage.toString() : `"${expectedMessage}"`}`;
        }
        message += `\n\nReceived: ${JSON.stringify(error, null, 2)}`;
        return message;
      },
      pass,
    };
  },
  
  toContainJourneyContext(received, journeyId) {
    const { error } = received.body;
    
    // Check if the response contains an error object
    if (!error) {
      return {
        message: () => `Expected response to contain an error object, but none was found`,
        pass: false,
      };
    }
    
    // Check if the error contains journey context
    const hasJourneyContext = error.context && error.context.journeyId === journeyId;
    
    return {
      message: () => {
        return hasJourneyContext
          ? `Expected response to not contain journey context for ${journeyId}, but it did`
          : `Expected response to contain journey context for ${journeyId}, but it did not\n\nReceived: ${JSON.stringify(error, null, 2)}`;
      },
      pass: hasJourneyContext,
    };
  },
});

// Set up global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});