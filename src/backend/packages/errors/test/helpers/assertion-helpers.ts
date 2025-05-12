import { ErrorType } from '../../src/types';

/**
 * Interface for expected error response structure
 */
export interface ExpectedErrorResponse {
  type: ErrorType;
  code: string;
  message: string;
  status: number;
  details?: Record<string, any>;
  context?: Record<string, any>;
  cause?: ExpectedErrorResponse;
}

/**
 * Asserts that an error response matches the expected structure
 * @param actual The actual error response from the API
 * @param expected The expected error response structure
 */
export function assertErrorResponse(
  actual: any,
  expected: ExpectedErrorResponse
): void {
  // Check that the response has an error property
  expect(actual).toHaveProperty('error');
  const error = actual.error;

  // Check required properties
  expect(error).toHaveProperty('type', expected.type);
  expect(error).toHaveProperty('code', expected.code);
  expect(error).toHaveProperty('message', expected.message);

  // Check optional properties if they are expected
  if (expected.details) {
    expect(error).toHaveProperty('details');
    Object.entries(expected.details).forEach(([key, value]) => {
      expect(error.details).toHaveProperty(key, value);
    });
  }

  if (expected.context) {
    expect(error).toHaveProperty('context');
    Object.entries(expected.context).forEach(([key, value]) => {
      expect(error.context).toHaveProperty(key, value);
    });
  }

  // Check cause chain if expected
  if (expected.cause && process.env.NODE_ENV !== 'production') {
    expect(error).toHaveProperty('cause');
    assertErrorResponse({ error: error.cause }, { ...expected.cause });
  }
}

/**
 * Asserts that an HTTP response contains the expected error
 * @param response The HTTP response object
 * @param expected The expected error response structure
 */
export function assertHttpErrorResponse(
  response: any,
  expected: ExpectedErrorResponse
): void {
  // Check status code
  expect(response.status).toBe(expected.status);
  
  // Check response body
  assertErrorResponse(response.body, expected);

  // Check headers for specific error types
  if (expected.type === ErrorType.EXTERNAL && expected.context?.retryAfter) {
    expect(response.headers).toHaveProperty('retry-after', String(expected.context.retryAfter));
  }
}

/**
 * Asserts that a validation error response contains field-level errors
 * @param response The HTTP response object
 * @param fieldErrors Map of field names to expected error messages
 */
export function assertValidationFieldErrors(
  response: any,
  fieldErrors: Record<string, string>
): void {
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toHaveProperty('type', ErrorType.VALIDATION);
  expect(response.body.error).toHaveProperty('details');
  expect(Array.isArray(response.body.error.details)).toBe(true);

  // Check that each expected field error is present
  Object.entries(fieldErrors).forEach(([field, message]) => {
    const fieldError = response.body.error.details.find(
      (detail: any) => detail.field === field
    );
    expect(fieldError).toBeDefined();
    expect(fieldError).toHaveProperty('message', message);
  });
}

/**
 * Asserts that an error response includes journey-specific context
 * @param response The HTTP response object
 * @param journeyId The expected journey ID
 * @param additionalContext Additional context properties to check
 */
export function assertJourneyErrorContext(
  response: any,
  journeyId: string,
  additionalContext: Record<string, any> = {}
): void {
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toHaveProperty('context');
  expect(response.body.error.context).toHaveProperty('journeyId', journeyId);
  
  // Check additional context properties
  Object.entries(additionalContext).forEach(([key, value]) => {
    expect(response.body.error.context).toHaveProperty(key, value);
  });

  // Check that error code follows journey prefix convention
  expect(response.body.error).toHaveProperty('code');
  expect(response.body.error.code.startsWith(`${journeyId.toUpperCase()}_`)).toBe(true);
}