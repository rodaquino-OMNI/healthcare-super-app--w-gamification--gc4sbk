import { BaseError, ErrorType, JourneyContext, SerializedError } from '../../src/base';
import { HttpException } from '@nestjs/common';
import { HealthErrorType, CareErrorType, PlanErrorType } from '../../src/types';

/**
 * Type definition for the custom matchers added to Jest
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Checks if the received value is a BaseError with the specified error type
       * @param type - Expected ErrorType
       */
      toBeErrorType(type: ErrorType): R;

      /**
       * Checks if the received value is a BaseError with the specified error code
       * @param code - Expected error code
       */
      toHaveErrorCode(code: string): R;

      /**
       * Checks if the received value is a BaseError with the specified journey context
       * @param journey - Expected JourneyContext
       */
      toHaveJourneyContext(journey: JourneyContext | string): R;

      /**
       * Checks if the received value is a BaseError with the specified error message
       * @param message - Expected error message or message substring
       * @param exact - Whether to check for exact match (default: false)
       */
      toContainErrorMessage(message: string, exact?: boolean): R;

      /**
       * Checks if the received value is a BaseError with the specified error details
       * @param details - Expected error details (partial match)
       */
      toHaveErrorDetails(details: Record<string, any>): R;

      /**
       * Checks if the received value is a BaseError with the specified suggestion
       * @param suggestion - Expected suggestion or suggestion substring
       * @param exact - Whether to check for exact match (default: false)
       */
      toHaveSuggestion(suggestion: string, exact?: boolean): R;

      /**
       * Checks if the received value is a BaseError with a cause that matches the specified criteria
       * @param errorClass - Expected error class of the cause
       * @param messageSubstring - Expected message substring of the cause (optional)
       */
      toHaveCause(errorClass?: any, messageSubstring?: string): R;

      /**
       * Checks if the received value is a BaseError that is retryable
       */
      toBeRetryable(): R;

      /**
       * Checks if the received value is a BaseError that is a client error (4xx)
       */
      toBeClientError(): R;

      /**
       * Checks if the received value is a BaseError that is a server error (5xx)
       */
      toBeServerError(): R;

      /**
       * Checks if the received value is a serialized error response with the expected structure
       * @param expectedError - Expected error properties (partial match)
       */
      toMatchErrorResponse(expectedError: Partial<SerializedError['error']>): R;

      /**
       * Checks if the received value is a BaseError with the specified health error type
       * @param healthErrorType - Expected HealthErrorType
       */
      toHaveHealthErrorType(healthErrorType: HealthErrorType): R;

      /**
       * Checks if the received value is a BaseError with the specified care error type
       * @param careErrorType - Expected CareErrorType
       */
      toHaveCareErrorType(careErrorType: CareErrorType): R;

      /**
       * Checks if the received value is a BaseError with the specified plan error type
       * @param planErrorType - Expected PlanErrorType
       */
      toHavePlanErrorType(planErrorType: PlanErrorType): R;

      /**
       * Checks if the received HttpException contains an error response with the specified properties
       * @param expectedError - Expected error properties (partial match)
       */
      toContainHttpError(expectedError: Partial<SerializedError['error']>): R;
    }
  }
}

/**
 * Helper function to check if a value is a BaseError
 */
function isBaseError(received: any): received is BaseError {
  return received instanceof BaseError;
}

/**
 * Helper function to check if a value is an HttpException
 */
function isHttpException(received: any): received is HttpException {
  return received instanceof HttpException;
}

/**
 * Helper function to check if a value is a serialized error response
 */
function isSerializedError(received: any): received is SerializedError {
  return (
    received &&
    typeof received === 'object' &&
    received.error &&
    typeof received.error === 'object' &&
    typeof received.error.type === 'string' &&
    typeof received.error.code === 'string' &&
    typeof received.error.message === 'string'
  );
}

/**
 * Helper function to extract error response from an HttpException
 */
function getErrorResponseFromHttpException(exception: HttpException): any {
  try {
    return exception.getResponse();
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to check if an object contains all properties of another object
 */
function containsProperties(obj: Record<string, any>, properties: Record<string, any>): boolean {
  for (const [key, value] of Object.entries(properties)) {
    if (obj[key] === undefined) {
      return false;
    }

    if (typeof value === 'object' && value !== null) {
      if (typeof obj[key] !== 'object' || obj[key] === null) {
        return false;
      }
      if (!containsProperties(obj[key], value)) {
        return false;
      }
    } else if (obj[key] !== value) {
      return false;
    }
  }

  return true;
}

/**
 * Custom Jest matchers for testing errors
 */
const errorMatchers = {
  /**
   * Checks if the received value is a BaseError with the specified error type
   */
  toBeErrorType(received: any, type: ErrorType) {
    const pass = isBaseError(received) && received.type === type;
    const message = pass
      ? () => `Expected error not to be of type ${type}, but it was`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          return `Expected error to be of type ${type}, but it was ${received.type}`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError with the specified error code
   */
  toHaveErrorCode(received: any, code: string) {
    const pass = isBaseError(received) && received.code === code;
    const message = pass
      ? () => `Expected error not to have code ${code}, but it did`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          return `Expected error to have code ${code}, but it had ${received.code}`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError with the specified journey context
   */
  toHaveJourneyContext(received: any, journey: JourneyContext | string) {
    const pass = isBaseError(received) && 
                received.context && 
                received.context.journey === journey;
    const message = pass
      ? () => `Expected error not to have journey context ${journey}, but it did`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          if (!received.context) {
            return `Expected error to have context with journey ${journey}, but it had no context`;
          }
          return `Expected error to have journey context ${journey}, but it had ${received.context.journey || 'undefined'}`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError with the specified error message
   */
  toContainErrorMessage(received: any, message: string, exact: boolean = false) {
    let pass = false;
    if (isBaseError(received)) {
      pass = exact 
        ? received.message === message 
        : received.message.includes(message);
    }

    const messageFunction = pass
      ? () => `Expected error message ${exact ? 'not to be' : 'not to contain'} "${message}", but it did`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          return `Expected error message ${exact ? 'to be' : 'to contain'} "${message}", but it was "${received.message}"`;
        };

    return { pass, message: messageFunction };
  },

  /**
   * Checks if the received value is a BaseError with the specified error details
   */
  toHaveErrorDetails(received: any, details: Record<string, any>) {
    let pass = false;
    if (isBaseError(received) && received.details) {
      pass = containsProperties(received.details, details);
    }

    const message = pass
      ? () => `Expected error not to have details matching ${JSON.stringify(details)}, but it did`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          if (!received.details) {
            return `Expected error to have details matching ${JSON.stringify(details)}, but it had no details`;
          }
          return `Expected error to have details matching ${JSON.stringify(details)}, but it had ${JSON.stringify(received.details)}`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError with the specified suggestion
   */
  toHaveSuggestion(received: any, suggestion: string, exact: boolean = false) {
    let pass = false;
    if (isBaseError(received) && received.suggestion) {
      pass = exact 
        ? received.suggestion === suggestion 
        : received.suggestion.includes(suggestion);
    }

    const message = pass
      ? () => `Expected error not to have suggestion ${exact ? 'equal to' : 'containing'} "${suggestion}", but it did`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          if (!received.suggestion) {
            return `Expected error to have suggestion ${exact ? 'equal to' : 'containing'} "${suggestion}", but it had no suggestion`;
          }
          return `Expected error to have suggestion ${exact ? 'equal to' : 'containing'} "${suggestion}", but it had "${received.suggestion}"`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError with a cause that matches the specified criteria
   */
  toHaveCause(received: any, errorClass?: any, messageSubstring?: string) {
    let pass = false;
    if (isBaseError(received) && received.cause) {
      if (errorClass && messageSubstring) {
        pass = received.cause instanceof errorClass && received.cause.message.includes(messageSubstring);
      } else if (errorClass) {
        pass = received.cause instanceof errorClass;
      } else if (messageSubstring) {
        pass = received.cause.message.includes(messageSubstring);
      } else {
        pass = !!received.cause;
      }
    }

    const message = pass
      ? () => {
          let msg = 'Expected error not to have';
          if (errorClass && messageSubstring) {
            msg += ` cause of type ${errorClass.name} with message containing "${messageSubstring}"`;
          } else if (errorClass) {
            msg += ` cause of type ${errorClass.name}`;
          } else if (messageSubstring) {
            msg += ` cause with message containing "${messageSubstring}"`;
          } else {
            msg += ' a cause';
          }
          return `${msg}, but it did`;
        }
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          if (!received.cause) {
            let msg = 'Expected error to have';
            if (errorClass && messageSubstring) {
              msg += ` cause of type ${errorClass.name} with message containing "${messageSubstring}"`;
            } else if (errorClass) {
              msg += ` cause of type ${errorClass.name}`;
            } else if (messageSubstring) {
              msg += ` cause with message containing "${messageSubstring}"`;
            } else {
              msg += ' a cause';
            }
            return `${msg}, but it had no cause`;
          }
          
          let msg = 'Expected error to have';
          if (errorClass && messageSubstring) {
            msg += ` cause of type ${errorClass.name} with message containing "${messageSubstring}"`;
            if (!(received.cause instanceof errorClass)) {
              return `${msg}, but cause was of type ${received.cause.constructor.name}`;
            }
            return `${msg}, but cause message was "${received.cause.message}"`;
          } else if (errorClass) {
            msg += ` cause of type ${errorClass.name}`;
            return `${msg}, but cause was of type ${received.cause.constructor.name}`;
          } else if (messageSubstring) {
            msg += ` cause with message containing "${messageSubstring}"`;
            return `${msg}, but cause message was "${received.cause.message}"`;
          }
          
          return 'Unexpected error in toHaveCause matcher';
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError that is retryable
   */
  toBeRetryable(received: any) {
    const pass = isBaseError(received) && received.isRetryable();
    const message = pass
      ? () => 'Expected error not to be retryable, but it was'
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          return 'Expected error to be retryable, but it was not';
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError that is a client error (4xx)
   */
  toBeClientError(received: any) {
    const pass = isBaseError(received) && received.isClientError();
    const message = pass
      ? () => 'Expected error not to be a client error (4xx), but it was'
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          return 'Expected error to be a client error (4xx), but it was not';
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError that is a server error (5xx)
   */
  toBeServerError(received: any) {
    const pass = isBaseError(received) && received.isServerError();
    const message = pass
      ? () => 'Expected error not to be a server error (5xx), but it was'
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          return 'Expected error to be a server error (5xx), but it was not';
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a serialized error response with the expected structure
   */
  toMatchErrorResponse(received: any, expectedError: Partial<SerializedError['error']>) {
    let pass = false;
    let errorObj: any = null;

    if (isSerializedError(received)) {
      errorObj = received.error;
      pass = containsProperties(errorObj, expectedError);
    } else if (isHttpException(received)) {
      const response = getErrorResponseFromHttpException(received);
      if (isSerializedError(response)) {
        errorObj = response.error;
        pass = containsProperties(errorObj, expectedError);
      }
    } else if (isBaseError(received)) {
      const serialized = received.toJSON();
      errorObj = serialized.error;
      pass = containsProperties(errorObj, expectedError);
    }

    const message = pass
      ? () => `Expected error response not to match ${JSON.stringify(expectedError)}, but it did`
      : () => {
          if (!errorObj) {
            return `Expected a serialized error response, HttpException, or BaseError, but received ${typeof received}`;
          }
          return `Expected error response to match ${JSON.stringify(expectedError)}, but it was ${JSON.stringify(errorObj)}`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError with the specified health error type
   */
  toHaveHealthErrorType(received: any, healthErrorType: HealthErrorType) {
    let pass = false;
    if (isBaseError(received) && received.details && received.details.journeyType === healthErrorType) {
      pass = true;
    }

    const message = pass
      ? () => `Expected error not to have health error type ${healthErrorType}, but it did`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          if (!received.details) {
            return `Expected error to have health error type ${healthErrorType}, but it had no details`;
          }
          return `Expected error to have health error type ${healthErrorType}, but it had ${received.details.journeyType || 'undefined'}`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError with the specified care error type
   */
  toHaveCareErrorType(received: any, careErrorType: CareErrorType) {
    let pass = false;
    if (isBaseError(received) && received.details && received.details.journeyType === careErrorType) {
      pass = true;
    }

    const message = pass
      ? () => `Expected error not to have care error type ${careErrorType}, but it did`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          if (!received.details) {
            return `Expected error to have care error type ${careErrorType}, but it had no details`;
          }
          return `Expected error to have care error type ${careErrorType}, but it had ${received.details.journeyType || 'undefined'}`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received value is a BaseError with the specified plan error type
   */
  toHavePlanErrorType(received: any, planErrorType: PlanErrorType) {
    let pass = false;
    if (isBaseError(received) && received.details && received.details.journeyType === planErrorType) {
      pass = true;
    }

    const message = pass
      ? () => `Expected error not to have plan error type ${planErrorType}, but it did`
      : () => {
          if (!isBaseError(received)) {
            return `Expected a BaseError instance, but received ${typeof received}`;
          }
          if (!received.details) {
            return `Expected error to have plan error type ${planErrorType}, but it had no details`;
          }
          return `Expected error to have plan error type ${planErrorType}, but it had ${received.details.journeyType || 'undefined'}`;
        };

    return { pass, message };
  },

  /**
   * Checks if the received HttpException contains an error response with the specified properties
   */
  toContainHttpError(received: any, expectedError: Partial<SerializedError['error']>) {
    let pass = false;
    let errorObj: any = null;

    if (isHttpException(received)) {
      const response = getErrorResponseFromHttpException(received);
      if (isSerializedError(response)) {
        errorObj = response.error;
        pass = containsProperties(errorObj, expectedError);
      }
    }

    const message = pass
      ? () => `Expected HttpException not to contain error matching ${JSON.stringify(expectedError)}, but it did`
      : () => {
          if (!isHttpException(received)) {
            return `Expected an HttpException, but received ${typeof received}`;
          }
          if (!errorObj) {
            return `Expected HttpException to contain a serialized error response, but it did not`;
          }
          return `Expected HttpException to contain error matching ${JSON.stringify(expectedError)}, but it contained ${JSON.stringify(errorObj)}`;
        };

    return { pass, message };
  }
};

/**
 * Add custom matchers to Jest
 */
expect.extend(errorMatchers);

/**
 * Export the matchers for direct usage
 */
export default errorMatchers;