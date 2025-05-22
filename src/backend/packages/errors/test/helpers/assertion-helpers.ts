/**
 * Specialized assertion functions for verifying error handling behavior in different contexts.
 * 
 * This utility provides higher-level assertions beyond the custom Jest matchers,
 * focusing on validating error handling workflows, error transformation, and
 * integration with other services.
 */

import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../src/types';
import { BaseError } from '../../src/base';
import { KafkaMessage } from 'kafkajs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * HTTP Response Error Assertions
 */

/**
 * Asserts that an HTTP response contains a properly structured error object
 * with the expected status code, error type, and optional error code.
 */
export function assertHttpErrorResponse(
  response: any,
  expectedStatus: HttpStatus,
  expectedErrorType: ErrorType,
  expectedErrorCode?: string
): void {
  // Verify status code
  expect(response.status).toBe(expectedStatus);
  
  // Verify response has error object
  expect(response.body).toHaveProperty('error');
  
  // Verify error type
  expect(response.body.error.type).toBe(expectedErrorType);
  
  // Verify error code if provided
  if (expectedErrorCode) {
    expect(response.body.error.code).toBe(expectedErrorCode);
  }
  
  // Verify error has a message
  expect(response.body.error.message).toBeDefined();
  expect(typeof response.body.error.message).toBe('string');
}

/**
 * Asserts that an HTTP response contains a journey-specific error with the
 * expected journey context and metadata.
 */
export function assertJourneyHttpErrorResponse(
  response: any,
  journeyType: 'health' | 'care' | 'plan',
  expectedStatus: HttpStatus,
  expectedErrorType: ErrorType,
  expectedErrorCode?: string
): void {
  // First verify basic error structure
  assertHttpErrorResponse(response, expectedStatus, expectedErrorType, expectedErrorCode);
  
  // Verify journey-specific context
  expect(response.body.error.context).toBeDefined();
  expect(response.body.error.context.journey).toBe(journeyType);
  
  // Verify journey-specific error code format if provided
  if (expectedErrorCode) {
    const journeyPrefix = journeyType.toUpperCase();
    expect(expectedErrorCode.startsWith(journeyPrefix)).toBeTruthy();
  }
}

/**
 * Asserts that an HTTP response contains a validation error with field-specific
 * validation details.
 */
export function assertValidationErrorResponse(
  response: any,
  expectedInvalidFields: string[]
): void {
  // Verify basic error structure
  assertHttpErrorResponse(response, HttpStatus.BAD_REQUEST, ErrorType.VALIDATION);
  
  // Verify validation details
  expect(response.body.error.details).toBeDefined();
  expect(response.body.error.details.fields).toBeDefined();
  
  // Verify each expected invalid field is present in the response
  for (const field of expectedInvalidFields) {
    expect(response.body.error.details.fields).toContain(field);
  }
}

/**
 * Kafka Message Error Assertions
 */

/**
 * Asserts that a Kafka message contains a properly serialized error payload.
 */
export function assertKafkaErrorMessage(
  message: KafkaMessage,
  expectedErrorType: ErrorType,
  expectedErrorCode?: string
): void {
  // Parse message value
  const payload = JSON.parse(message.value?.toString() || '{}');
  
  // Verify error structure
  expect(payload).toHaveProperty('error');
  expect(payload.error.type).toBe(expectedErrorType);
  
  // Verify error code if provided
  if (expectedErrorCode) {
    expect(payload.error.code).toBe(expectedErrorCode);
  }
  
  // Verify error has a message
  expect(payload.error.message).toBeDefined();
  expect(typeof payload.error.message).toBe('string');
}

/**
 * Asserts that a Kafka message contains a properly serialized journey-specific error.
 */
export function assertJourneyKafkaErrorMessage(
  message: KafkaMessage,
  journeyType: 'health' | 'care' | 'plan',
  expectedErrorType: ErrorType,
  expectedErrorCode?: string
): void {
  // Parse message value
  const payload = JSON.parse(message.value?.toString() || '{}');
  
  // Verify basic error structure
  expect(payload).toHaveProperty('error');
  expect(payload.error.type).toBe(expectedErrorType);
  
  // Verify journey-specific context
  expect(payload.error.context).toBeDefined();
  expect(payload.error.context.journey).toBe(journeyType);
  
  // Verify error code if provided
  if (expectedErrorCode) {
    expect(payload.error.code).toBe(expectedErrorCode);
    const journeyPrefix = journeyType.toUpperCase();
    expect(expectedErrorCode.startsWith(journeyPrefix)).toBeTruthy();
  }
}

/**
 * Asserts that a Kafka message contains a dead letter queue entry with proper error context.
 */
export function assertKafkaDLQMessage(
  message: KafkaMessage,
  originalTopic: string,
  expectedErrorType: ErrorType,
  expectedRetryCount?: number
): void {
  // Parse message value
  const payload = JSON.parse(message.value?.toString() || '{}');
  
  // Verify DLQ structure
  expect(payload).toHaveProperty('originalMessage');
  expect(payload).toHaveProperty('error');
  expect(payload).toHaveProperty('metadata');
  
  // Verify original topic
  expect(payload.metadata.originalTopic).toBe(originalTopic);
  
  // Verify error type
  expect(payload.error.type).toBe(expectedErrorType);
  
  // Verify retry count if provided
  if (expectedRetryCount !== undefined) {
    expect(payload.metadata.retryCount).toBe(expectedRetryCount);
  }
}

/**
 * Database Error Assertions
 */

/**
 * Asserts that a database error is properly transformed into a BaseError with
 * the expected error type and code.
 */
export function assertDatabaseErrorTransformation(
  originalError: PrismaClientKnownRequestError,
  transformedError: BaseError,
  expectedErrorType: ErrorType,
  expectedErrorCode?: string
): void {
  // Verify error type
  expect(transformedError.type).toBe(expectedErrorType);
  
  // Verify error code if provided
  if (expectedErrorCode) {
    expect(transformedError.code).toBe(expectedErrorCode);
  }
  
  // Verify original error is preserved in the cause chain
  expect(transformedError.cause).toBe(originalError);
  
  // Verify error has a message
  expect(transformedError.message).toBeDefined();
  expect(typeof transformedError.message).toBe('string');
}

/**
 * Asserts that a database unique constraint violation is properly transformed
 * into a business error with the expected error code.
 */
export function assertUniqueConstraintViolation(
  error: BaseError,
  expectedErrorCode: string,
  expectedField: string
): void {
  // Verify error type
  expect(error.type).toBe(ErrorType.BUSINESS);
  
  // Verify error code
  expect(error.code).toBe(expectedErrorCode);
  
  // Verify error details contain the field information
  expect(error.details).toBeDefined();
  expect(error.details.fields).toContain(expectedField);
  
  // Verify cause is a Prisma error
  expect(error.cause).toBeDefined();
  expect((error.cause as PrismaClientKnownRequestError).code).toBe('P2002');
}

/**
 * Asserts that a database foreign key constraint violation is properly transformed
 * into a business error with the expected error code.
 */
export function assertForeignKeyConstraintViolation(
  error: BaseError,
  expectedErrorCode: string,
  expectedField: string
): void {
  // Verify error type
  expect(error.type).toBe(ErrorType.BUSINESS);
  
  // Verify error code
  expect(error.code).toBe(expectedErrorCode);
  
  // Verify error details contain the field information
  expect(error.details).toBeDefined();
  expect(error.details.fields).toContain(expectedField);
  
  // Verify cause is a Prisma error
  expect(error.cause).toBeDefined();
  expect((error.cause as PrismaClientKnownRequestError).code).toBe('P2003');
}

/**
 * Journey-Specific Error Assertions
 */

/**
 * Asserts that a Health journey error contains the expected error properties
 * and health-specific context.
 */
export function assertHealthJourneyError(
  error: BaseError,
  expectedErrorCode: string,
  expectedSubdomain?: 'metrics' | 'goals' | 'insights' | 'devices' | 'fhir'
): void {
  // Verify error code format
  expect(error.code).toBe(expectedErrorCode);
  expect(expectedErrorCode.startsWith('HEALTH_')).toBeTruthy();
  
  // Verify journey context
  expect(error.context).toBeDefined();
  expect(error.context.journey).toBe('health');
  
  // Verify subdomain if provided
  if (expectedSubdomain) {
    expect(error.context.subdomain).toBe(expectedSubdomain);
    expect(expectedErrorCode.includes(`_${expectedSubdomain.toUpperCase()}_`)).toBeTruthy();
  }
}

/**
 * Asserts that a Care journey error contains the expected error properties
 * and care-specific context.
 */
export function assertCareJourneyError(
  error: BaseError,
  expectedErrorCode: string,
  expectedSubdomain?: 'appointment' | 'provider' | 'telemedicine' | 'medication' | 'symptom' | 'treatment'
): void {
  // Verify error code format
  expect(error.code).toBe(expectedErrorCode);
  expect(expectedErrorCode.startsWith('CARE_')).toBeTruthy();
  
  // Verify journey context
  expect(error.context).toBeDefined();
  expect(error.context.journey).toBe('care');
  
  // Verify subdomain if provided
  if (expectedSubdomain) {
    expect(error.context.subdomain).toBe(expectedSubdomain);
    expect(expectedErrorCode.includes(`_${expectedSubdomain.toUpperCase()}_`)).toBeTruthy();
  }
}

/**
 * Asserts that a Plan journey error contains the expected error properties
 * and plan-specific context.
 */
export function assertPlanJourneyError(
  error: BaseError,
  expectedErrorCode: string,
  expectedSubdomain?: 'plans' | 'benefits' | 'coverage' | 'claims' | 'documents'
): void {
  // Verify error code format
  expect(error.code).toBe(expectedErrorCode);
  expect(expectedErrorCode.startsWith('PLAN_')).toBeTruthy();
  
  // Verify journey context
  expect(error.context).toBeDefined();
  expect(error.context.journey).toBe('plan');
  
  // Verify subdomain if provided
  if (expectedSubdomain) {
    expect(error.context.subdomain).toBe(expectedSubdomain);
    expect(expectedErrorCode.includes(`_${expectedSubdomain.toUpperCase()}_`)).toBeTruthy();
  }
}

/**
 * Error Recovery and Fallback Assertions
 */

/**
 * Asserts that a function properly implements retry logic with exponential backoff
 * for transient errors.
 */
export async function assertRetryWithBackoff(
  fn: () => Promise<any>,
  mockFn: jest.Mock,
  expectedRetries: number,
  expectedResult: any
): Promise<void> {
  // Setup mock to fail the expected number of times then succeed
  for (let i = 0; i < expectedRetries; i++) {
    mockFn.mockRejectedValueOnce(new Error('Transient error'));
  }
  mockFn.mockResolvedValueOnce(expectedResult);
  
  // Call the function and verify result
  const result = await fn();
  expect(result).toEqual(expectedResult);
  
  // Verify the function was called the expected number of times
  expect(mockFn).toHaveBeenCalledTimes(expectedRetries + 1);
}

/**
 * Asserts that a function properly implements circuit breaker logic
 * for persistent external errors.
 */
export async function assertCircuitBreaker(
  fn: () => Promise<any>,
  mockFn: jest.Mock,
  failureThreshold: number
): Promise<void> {
  // Setup mock to always fail
  mockFn.mockRejectedValue(new Error('Persistent error'));
  
  // Call the function multiple times to trigger circuit breaker
  for (let i = 0; i < failureThreshold; i++) {
    try {
      await fn();
    } catch (error) {
      // Expected to fail
    }
  }
  
  // Verify the function was called exactly failureThreshold times
  // (circuit breaker should prevent additional calls)
  expect(mockFn).toHaveBeenCalledTimes(failureThreshold);
  
  // Call again and verify it fails fast without calling the mock
  mockFn.mockClear();
  await expect(fn()).rejects.toThrow(/circuit.*open/i);
  expect(mockFn).not.toHaveBeenCalled();
}

/**
 * Asserts that a function properly implements fallback logic
 * when the primary operation fails.
 */
export async function assertFallbackStrategy(
  fn: () => Promise<any>,
  primaryMock: jest.Mock,
  fallbackMock: jest.Mock,
  expectedFallbackResult: any
): Promise<void> {
  // Setup primary mock to fail
  primaryMock.mockRejectedValue(new Error('Primary operation failed'));
  
  // Setup fallback mock to succeed
  fallbackMock.mockResolvedValue(expectedFallbackResult);
  
  // Call the function and verify result
  const result = await fn();
  expect(result).toEqual(expectedFallbackResult);
  
  // Verify both mocks were called
  expect(primaryMock).toHaveBeenCalled();
  expect(fallbackMock).toHaveBeenCalled();
}

/**
 * Asserts that a function properly implements graceful degradation
 * when a non-critical feature fails.
 */
export async function assertGracefulDegradation(
  fn: () => Promise<any>,
  mockFn: jest.Mock,
  expectedDegradedResult: any
): Promise<void> {
  // Setup mock to fail
  mockFn.mockRejectedValue(new Error('Feature unavailable'));
  
  // Call the function and verify it returns a degraded result without throwing
  const result = await fn();
  expect(result).toEqual(expectedDegradedResult);
  
  // Verify the mock was called
  expect(mockFn).toHaveBeenCalled();
}

/**
 * Cross-Journey Error Assertions
 */

/**
 * Asserts that an error is properly propagated across journey boundaries
 * with the original journey context preserved.
 */
export function assertCrossJourneyErrorPropagation(
  originalError: BaseError,
  propagatedError: BaseError,
  expectedSourceJourney: 'health' | 'care' | 'plan',
  expectedTargetJourney: 'health' | 'care' | 'plan'
): void {
  // Verify error type and code are preserved
  expect(propagatedError.type).toBe(originalError.type);
  expect(propagatedError.code).toBe(originalError.code);
  
  // Verify original error is in the cause chain
  expect(propagatedError.cause).toBe(originalError);
  
  // Verify journey context
  expect(propagatedError.context).toBeDefined();
  expect(propagatedError.context.journey).toBe(expectedTargetJourney);
  
  // Verify source journey is tracked
  expect(propagatedError.context.sourceJourney).toBe(expectedSourceJourney);
  
  // Verify original error context is preserved
  expect(originalError.context).toBeDefined();
  expect(originalError.context.journey).toBe(expectedSourceJourney);
}

/**
 * Asserts that a gamification event error contains the expected properties
 * and preserves the source journey context.
 */
export function assertGamificationEventError(
  error: BaseError,
  expectedSourceJourney: 'health' | 'care' | 'plan',
  expectedEventType: string
): void {
  // Verify error is from gamification
  expect(error.context).toBeDefined();
  expect(error.context.journey).toBe('gamification');
  
  // Verify source journey is tracked
  expect(error.context.sourceJourney).toBe(expectedSourceJourney);
  
  // Verify event type is tracked
  expect(error.context.eventType).toBe(expectedEventType);
  
  // Verify error code format
  expect(error.code.startsWith('GAMIFICATION_')).toBeTruthy();
}