import { ValidationError, BusinessError, TechnicalError, ExternalError } from '../../src/categories';
import { ErrorType } from '../../src/types';

/**
 * Creates a validation error for testing
 * @param message Error message
 * @param code Error code (defaults to 'VALIDATION_ERROR')
 * @param details Additional error details
 * @param cause The error that caused this error
 * @returns A ValidationError instance
 */
export function createValidationError(
  message: string,
  code: string = 'VALIDATION_ERROR',
  details: Record<string, any> = {},
  cause?: Error
): ValidationError {
  return new ValidationError(message, code, details, cause);
}

/**
 * Creates a business error for testing
 * @param message Error message
 * @param code Error code (defaults to 'BUSINESS_ERROR')
 * @param context Business context for the error
 * @param cause The error that caused this error
 * @returns A BusinessError instance
 */
export function createBusinessError(
  message: string,
  code: string = 'BUSINESS_ERROR',
  context: Record<string, any> = {},
  cause?: Error
): BusinessError {
  return new BusinessError(message, code, context, cause);
}

/**
 * Creates a technical error for testing
 * @param message Error message
 * @param code Error code (defaults to 'TECHNICAL_ERROR')
 * @param details Technical details about the error
 * @param cause The error that caused this error
 * @returns A TechnicalError instance
 */
export function createTechnicalError(
  message: string,
  code: string = 'TECHNICAL_ERROR',
  details: Record<string, any> = {},
  cause?: Error
): TechnicalError {
  return new TechnicalError(message, code, details, cause);
}

/**
 * Creates an external error for testing
 * @param message Error message
 * @param code Error code (defaults to 'EXTERNAL_ERROR')
 * @param context External system context
 * @param cause The error that caused this error
 * @returns An ExternalError instance
 */
export function createExternalError(
  message: string,
  code: string = 'EXTERNAL_ERROR',
  context: Record<string, any> = {},
  cause?: Error
): ExternalError {
  return new ExternalError(message, code, context, cause);
}

/**
 * Creates a health journey error for testing
 * @param message Error message
 * @param code Error code (will be prefixed with 'HEALTH_' if not already)
 * @param additionalContext Additional context beyond journeyId
 * @returns A BusinessError instance with health journey context
 */
export function createHealthJourneyError(
  message: string,
  code: string,
  additionalContext: Record<string, any> = {}
): BusinessError {
  const prefixedCode = code.startsWith('HEALTH_') ? code : `HEALTH_${code}`;
  return createBusinessError(message, prefixedCode, {
    journeyId: 'health',
    ...additionalContext
  });
}

/**
 * Creates a care journey error for testing
 * @param message Error message
 * @param code Error code (will be prefixed with 'CARE_' if not already)
 * @param additionalContext Additional context beyond journeyId
 * @returns A BusinessError instance with care journey context
 */
export function createCareJourneyError(
  message: string,
  code: string,
  additionalContext: Record<string, any> = {}
): BusinessError {
  const prefixedCode = code.startsWith('CARE_') ? code : `CARE_${code}`;
  return createBusinessError(message, prefixedCode, {
    journeyId: 'care',
    ...additionalContext
  });
}

/**
 * Creates a plan journey error for testing
 * @param message Error message
 * @param code Error code (will be prefixed with 'PLAN_' if not already)
 * @param additionalContext Additional context beyond journeyId
 * @returns A BusinessError instance with plan journey context
 */
export function createPlanJourneyError(
  message: string,
  code: string,
  additionalContext: Record<string, any> = {}
): BusinessError {
  const prefixedCode = code.startsWith('PLAN_') ? code : `PLAN_${code}`;
  return createBusinessError(message, prefixedCode, {
    journeyId: 'plan',
    ...additionalContext
  });
}

/**
 * Creates an error with nested causes for testing error chains
 * @param messages Array of error messages from top to bottom
 * @param types Array of error types from top to bottom
 * @param codes Array of error codes from top to bottom
 * @returns The top-level error with nested causes
 */
export function createErrorChain(
  messages: string[],
  types: ErrorType[],
  codes: string[] = []
): Error {
  if (messages.length === 0 || types.length === 0) {
    throw new Error('Must provide at least one message and type');
  }
  
  if (messages.length !== types.length) {
    throw new Error('Must provide the same number of messages and types');
  }
  
  // Ensure codes array is the same length as messages
  const fullCodes = [...codes];
  while (fullCodes.length < messages.length) {
    fullCodes.push(`ERROR_${fullCodes.length + 1}`);
  }
  
  // Create the bottom error first
  let currentError: Error;
  const lastIndex = messages.length - 1;
  
  switch (types[lastIndex]) {
    case ErrorType.VALIDATION:
      currentError = createValidationError(messages[lastIndex], fullCodes[lastIndex]);
      break;
    case ErrorType.BUSINESS:
      currentError = createBusinessError(messages[lastIndex], fullCodes[lastIndex]);
      break;
    case ErrorType.TECHNICAL:
      currentError = createTechnicalError(messages[lastIndex], fullCodes[lastIndex]);
      break;
    case ErrorType.EXTERNAL:
      currentError = createExternalError(messages[lastIndex], fullCodes[lastIndex]);
      break;
    default:
      currentError = new Error(messages[lastIndex]);
  }
  
  // Build the chain from bottom to top
  for (let i = lastIndex - 1; i >= 0; i--) {
    switch (types[i]) {
      case ErrorType.VALIDATION:
        currentError = createValidationError(messages[i], fullCodes[i], {}, currentError);
        break;
      case ErrorType.BUSINESS:
        currentError = createBusinessError(messages[i], fullCodes[i], {}, currentError);
        break;
      case ErrorType.TECHNICAL:
        currentError = createTechnicalError(messages[i], fullCodes[i], {}, currentError);
        break;
      case ErrorType.EXTERNAL:
        currentError = createExternalError(messages[i], fullCodes[i], {}, currentError);
        break;
      default:
        const err = new Error(messages[i]);
        err.cause = currentError;
        currentError = err;
    }
  }
  
  return currentError;
}