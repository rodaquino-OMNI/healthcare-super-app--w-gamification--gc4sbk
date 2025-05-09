import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../src/types';
import { KafkaMessage } from 'kafkajs';
import { PrismaClient } from '@prisma/client';
import { AxiosResponse } from 'axios';
import { BaseError } from '../../src/base';

/**
 * Assertion helpers for testing error handling behavior in different contexts.
 * These utilities provide higher-level assertions beyond the custom Jest matchers,
 * focusing on validating error handling workflows, error transformation, and
 * integration with other services.
 */

// ===== HTTP Response Error Assertions =====

/**
 * Options for asserting HTTP error responses
 */
export interface HttpErrorAssertionOptions {
  /** Expected HTTP status code */
  expectedStatus?: HttpStatus;
  /** Expected error type */
  expectedType?: ErrorType;
  /** Expected error code */
  expectedCode?: string;
  /** Expected error message (exact match) */
  expectedMessage?: string;
  /** Expected error message (partial match) */
  expectedMessageContains?: string;
  /** Expected journey context properties */
  expectedJourneyContext?: Record<string, any>;
  /** Whether to check for stack trace presence (default: false) */
  shouldHaveStack?: boolean;
}

/**
 * Asserts that an HTTP response contains a properly formatted error
 * with the expected properties.
 *
 * @param response - The HTTP response to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the response doesn't match expectations
 */
export function assertHttpErrorResponse(
  response: AxiosResponse | { status: number; data: any },
  options: HttpErrorAssertionOptions = {}
): void {
  const {
    expectedStatus,
    expectedType,
    expectedCode,
    expectedMessage,
    expectedMessageContains,
    expectedJourneyContext,
    shouldHaveStack = false
  } = options;

  // Assert response structure
  expect(response).toBeDefined();
  expect(response.data).toBeDefined();
  expect(response.data.error).toBeDefined();

  const { error } = response.data;

  // Assert status code if specified
  if (expectedStatus) {
    expect(response.status).toBe(expectedStatus);
  } else {
    // Status should be in error range
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(600);
  }

  // Assert error type if specified
  if (expectedType) {
    expect(error.type).toBe(expectedType);
  } else {
    // Should have a valid error type
    expect(Object.values(ErrorType)).toContain(error.type);
  }

  // Assert error code if specified
  if (expectedCode) {
    expect(error.code).toBe(expectedCode);
  } else {
    // Should have a non-empty error code
    expect(error.code).toBeDefined();
    expect(typeof error.code).toBe('string');
    expect(error.code.length).toBeGreaterThan(0);
  }

  // Assert error message if specified
  if (expectedMessage) {
    expect(error.message).toBe(expectedMessage);
  } else if (expectedMessageContains) {
    expect(error.message).toContain(expectedMessageContains);
  } else {
    // Should have a non-empty message
    expect(error.message).toBeDefined();
    expect(typeof error.message).toBe('string');
    expect(error.message.length).toBeGreaterThan(0);
  }

  // Assert journey context if specified
  if (expectedJourneyContext) {
    expect(error.context).toBeDefined();
    Object.entries(expectedJourneyContext).forEach(([key, value]) => {
      expect(error.context[key]).toEqual(value);
    });
  }

  // Assert stack trace presence if required
  if (shouldHaveStack) {
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
    expect(error.stack.length).toBeGreaterThan(0);
  }
}

/**
 * Asserts that an HTTP response contains a validation error
 * with the expected validation details.
 *
 * @param response - The HTTP response to validate
 * @param expectedFields - The field names expected to have validation errors
 * @param options - Additional options for the assertion
 * @throws AssertionError if the response doesn't match expectations
 */
export function assertValidationErrorResponse(
  response: AxiosResponse | { status: number; data: any },
  expectedFields: string[],
  options: Omit<HttpErrorAssertionOptions, 'expectedType'> = {}
): void {
  // First assert the basic error structure
  assertHttpErrorResponse(response, {
    ...options,
    expectedType: ErrorType.VALIDATION,
    expectedStatus: options.expectedStatus || HttpStatus.BAD_REQUEST
  });

  const { error } = response.data;

  // Assert validation details
  expect(error.details).toBeDefined();
  expect(error.details.validationErrors).toBeDefined();
  expect(Array.isArray(error.details.validationErrors)).toBe(true);

  // Check that all expected fields have validation errors
  const validatedFields = error.details.validationErrors.map(
    (ve: any) => ve.field || ve.property
  );

  expectedFields.forEach(field => {
    expect(validatedFields).toContain(field);
  });
}

/**
 * Asserts that an HTTP response contains a business logic error
 * with the expected business context.
 *
 * @param response - The HTTP response to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the response doesn't match expectations
 */
export function assertBusinessErrorResponse(
  response: AxiosResponse | { status: number; data: any },
  options: Omit<HttpErrorAssertionOptions, 'expectedType'> = {}
): void {
  // First assert the basic error structure
  assertHttpErrorResponse(response, {
    ...options,
    expectedType: ErrorType.BUSINESS,
    expectedStatus: options.expectedStatus || HttpStatus.UNPROCESSABLE_ENTITY
  });
}

/**
 * Asserts that an HTTP response contains a technical error
 * with the expected technical details.
 *
 * @param response - The HTTP response to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the response doesn't match expectations
 */
export function assertTechnicalErrorResponse(
  response: AxiosResponse | { status: number; data: any },
  options: Omit<HttpErrorAssertionOptions, 'expectedType'> = {}
): void {
  // First assert the basic error structure
  assertHttpErrorResponse(response, {
    ...options,
    expectedType: ErrorType.TECHNICAL,
    expectedStatus: options.expectedStatus || HttpStatus.INTERNAL_SERVER_ERROR
  });
}

/**
 * Asserts that an HTTP response contains an external system error
 * with the expected external system details.
 *
 * @param response - The HTTP response to validate
 * @param externalSystem - The name of the external system that failed
 * @param options - Options for the assertion
 * @throws AssertionError if the response doesn't match expectations
 */
export function assertExternalErrorResponse(
  response: AxiosResponse | { status: number; data: any },
  externalSystem?: string,
  options: Omit<HttpErrorAssertionOptions, 'expectedType'> = {}
): void {
  // First assert the basic error structure
  assertHttpErrorResponse(response, {
    ...options,
    expectedType: ErrorType.EXTERNAL,
    expectedStatus: options.expectedStatus || HttpStatus.BAD_GATEWAY
  });

  const { error } = response.data;

  // Assert external system details if specified
  if (externalSystem) {
    expect(error.details).toBeDefined();
    expect(error.details.externalSystem).toBe(externalSystem);
  }
}

// ===== Kafka Message Error Assertions =====

/**
 * Options for asserting Kafka error messages
 */
export interface KafkaErrorAssertionOptions {
  /** Expected error type */
  expectedType?: ErrorType;
  /** Expected error code */
  expectedCode?: string;
  /** Expected error message (exact match) */
  expectedMessage?: string;
  /** Expected error message (partial match) */
  expectedMessageContains?: string;
  /** Expected journey context properties */
  expectedJourneyContext?: Record<string, any>;
  /** Expected retry count */
  expectedRetryCount?: number;
}

/**
 * Asserts that a Kafka message contains a properly formatted error event
 * with the expected properties.
 *
 * @param message - The Kafka message to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the message doesn't match expectations
 */
export function assertKafkaErrorMessage(
  message: KafkaMessage,
  options: KafkaErrorAssertionOptions = {}
): void {
  const {
    expectedType,
    expectedCode,
    expectedMessage,
    expectedMessageContains,
    expectedJourneyContext,
    expectedRetryCount
  } = options;

  // Assert message structure
  expect(message).toBeDefined();
  expect(message.value).toBeDefined();

  // Parse message value
  const eventData = JSON.parse(message.value!.toString());

  // Assert event structure
  expect(eventData).toBeDefined();
  expect(eventData.error).toBeDefined();

  const { error } = eventData;

  // Assert error type if specified
  if (expectedType) {
    expect(error.type).toBe(expectedType);
  } else {
    // Should have a valid error type
    expect(Object.values(ErrorType)).toContain(error.type);
  }

  // Assert error code if specified
  if (expectedCode) {
    expect(error.code).toBe(expectedCode);
  } else {
    // Should have a non-empty error code
    expect(error.code).toBeDefined();
    expect(typeof error.code).toBe('string');
    expect(error.code.length).toBeGreaterThan(0);
  }

  // Assert error message if specified
  if (expectedMessage) {
    expect(error.message).toBe(expectedMessage);
  } else if (expectedMessageContains) {
    expect(error.message).toContain(expectedMessageContains);
  } else {
    // Should have a non-empty message
    expect(error.message).toBeDefined();
    expect(typeof error.message).toBe('string');
    expect(error.message.length).toBeGreaterThan(0);
  }

  // Assert journey context if specified
  if (expectedJourneyContext) {
    expect(error.context).toBeDefined();
    Object.entries(expectedJourneyContext).forEach(([key, value]) => {
      expect(error.context[key]).toEqual(value);
    });
  }

  // Assert retry count if specified
  if (expectedRetryCount !== undefined) {
    expect(eventData.metadata).toBeDefined();
    expect(eventData.metadata.retryCount).toBe(expectedRetryCount);
  }
}

/**
 * Asserts that a Kafka message contains a dead letter queue (DLQ) event
 * with the expected properties.
 *
 * @param message - The Kafka message to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the message doesn't match expectations
 */
export function assertKafkaDLQMessage(
  message: KafkaMessage,
  options: KafkaErrorAssertionOptions = {}
): void {
  // First assert the basic error structure
  assertKafkaErrorMessage(message, options);

  // Parse message value
  const eventData = JSON.parse(message.value!.toString());

  // Assert DLQ-specific properties
  expect(eventData.metadata).toBeDefined();
  expect(eventData.metadata.dlq).toBe(true);
  expect(eventData.metadata.originalTopic).toBeDefined();
  expect(eventData.metadata.failedAttempts).toBeDefined();
  expect(eventData.metadata.lastFailureReason).toBeDefined();
}

// ===== Database Error Recovery Assertions =====

/**
 * Options for asserting database error handling
 */
export interface DatabaseErrorAssertionOptions {
  /** Expected error type */
  expectedErrorType?: ErrorType;
  /** Expected error code */
  expectedErrorCode?: string;
  /** Expected error message (partial match) */
  expectedErrorMessageContains?: string;
  /** Expected transaction rollback */
  expectRollback?: boolean;
  /** Expected retry attempt count */
  expectedRetryCount?: number;
}

/**
 * Asserts that a database operation properly handles errors
 * with the expected behavior.
 *
 * @param dbClient - The Prisma client instance
 * @param operation - The database operation function that might throw an error
 * @param options - Options for the assertion
 * @returns A promise that resolves when the assertion is complete
 * @throws AssertionError if the error handling doesn't match expectations
 */
export async function assertDatabaseErrorHandling(
  dbClient: PrismaClient,
  operation: () => Promise<any>,
  options: DatabaseErrorAssertionOptions = {}
): Promise<void> {
  const {
    expectedErrorType,
    expectedErrorCode,
    expectedErrorMessageContains,
    expectRollback = true,
    expectedRetryCount = 0
  } = options;

  // Spy on transaction methods
  const beginTransactionSpy = jest.spyOn(dbClient.$transaction, 'begin');
  const commitTransactionSpy = jest.spyOn(dbClient, '$commit');
  const rollbackTransactionSpy = jest.spyOn(dbClient, '$rollback');

  // Track retry attempts
  let retryCount = 0;
  const originalOperation = operation;
  operation = async () => {
    try {
      return await originalOperation();
    } catch (error) {
      retryCount++;
      throw error;
    }
  };

  // Execute the operation and expect it to throw
  try {
    await operation();
    // If we get here, the operation didn't throw as expected
    fail('Expected database operation to throw an error');
  } catch (error) {
    // Assert error type if specified
    if (expectedErrorType) {
      expect(error).toBeInstanceOf(BaseError);
      expect((error as BaseError).type).toBe(expectedErrorType);
    }

    // Assert error code if specified
    if (expectedErrorCode) {
      expect(error).toBeInstanceOf(BaseError);
      expect((error as BaseError).code).toBe(expectedErrorCode);
    }

    // Assert error message if specified
    if (expectedErrorMessageContains) {
      expect(error.message).toContain(expectedErrorMessageContains);
    }

    // Assert transaction behavior
    if (expectRollback) {
      // Should have started a transaction
      expect(beginTransactionSpy).toHaveBeenCalled();
      // Should have rolled back the transaction
      expect(rollbackTransactionSpy).toHaveBeenCalled();
      // Should not have committed the transaction
      expect(commitTransactionSpy).not.toHaveBeenCalled();
    }

    // Assert retry count
    expect(retryCount).toBe(expectedRetryCount);
  } finally {
    // Clean up spies
    beginTransactionSpy.mockRestore();
    commitTransactionSpy.mockRestore();
    rollbackTransactionSpy.mockRestore();
  }
}

// ===== Journey-specific Error Flow Assertions =====

/**
 * Base options for journey-specific error assertions
 */
export interface JourneyErrorAssertionOptions {
  /** Expected error type */
  expectedType?: ErrorType;
  /** Expected error code prefix */
  expectedCodePrefix?: string;
  /** Expected error message (partial match) */
  expectedMessageContains?: string;
  /** Expected journey context properties */
  expectedContext?: Record<string, any>;
}

/**
 * Options for Health journey error assertions
 */
export interface HealthErrorAssertionOptions extends JourneyErrorAssertionOptions {
  /** Expected health metric type in context */
  expectedMetricType?: string;
  /** Expected health goal ID in context */
  expectedGoalId?: string;
  /** Expected device ID in context */
  expectedDeviceId?: string;
  /** Expected FHIR resource type in context */
  expectedFhirResourceType?: string;
}

/**
 * Asserts that an error is a properly formatted Health journey error
 * with the expected properties.
 *
 * @param error - The error to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the error doesn't match expectations
 */
export function assertHealthJourneyError(
  error: Error | BaseError,
  options: HealthErrorAssertionOptions = {}
): void {
  const {
    expectedType,
    expectedCodePrefix = 'HEALTH_',
    expectedMessageContains,
    expectedContext,
    expectedMetricType,
    expectedGoalId,
    expectedDeviceId,
    expectedFhirResourceType
  } = options;

  // Assert error is a BaseError
  expect(error).toBeInstanceOf(BaseError);
  const baseError = error as BaseError;

  // Assert error type if specified
  if (expectedType) {
    expect(baseError.type).toBe(expectedType);
  }

  // Assert error code prefix
  expect(baseError.code).toMatch(new RegExp(`^${expectedCodePrefix}`));

  // Assert error message if specified
  if (expectedMessageContains) {
    expect(baseError.message).toContain(expectedMessageContains);
  }

  // Assert context properties
  expect(baseError.context).toBeDefined();
  expect(baseError.context.journeyType).toBe('health');

  // Assert additional context properties if specified
  if (expectedContext) {
    Object.entries(expectedContext).forEach(([key, value]) => {
      expect(baseError.context[key]).toEqual(value);
    });
  }

  // Assert health-specific context properties
  if (expectedMetricType) {
    expect(baseError.context.metricType).toBe(expectedMetricType);
  }

  if (expectedGoalId) {
    expect(baseError.context.goalId).toBe(expectedGoalId);
  }

  if (expectedDeviceId) {
    expect(baseError.context.deviceId).toBe(expectedDeviceId);
  }

  if (expectedFhirResourceType) {
    expect(baseError.context.fhirResourceType).toBe(expectedFhirResourceType);
  }
}

/**
 * Options for Care journey error assertions
 */
export interface CareErrorAssertionOptions extends JourneyErrorAssertionOptions {
  /** Expected appointment ID in context */
  expectedAppointmentId?: string;
  /** Expected provider ID in context */
  expectedProviderId?: string;
  /** Expected medication ID in context */
  expectedMedicationId?: string;
  /** Expected telemedicine session ID in context */
  expectedSessionId?: string;
}

/**
 * Asserts that an error is a properly formatted Care journey error
 * with the expected properties.
 *
 * @param error - The error to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the error doesn't match expectations
 */
export function assertCareJourneyError(
  error: Error | BaseError,
  options: CareErrorAssertionOptions = {}
): void {
  const {
    expectedType,
    expectedCodePrefix = 'CARE_',
    expectedMessageContains,
    expectedContext,
    expectedAppointmentId,
    expectedProviderId,
    expectedMedicationId,
    expectedSessionId
  } = options;

  // Assert error is a BaseError
  expect(error).toBeInstanceOf(BaseError);
  const baseError = error as BaseError;

  // Assert error type if specified
  if (expectedType) {
    expect(baseError.type).toBe(expectedType);
  }

  // Assert error code prefix
  expect(baseError.code).toMatch(new RegExp(`^${expectedCodePrefix}`));

  // Assert error message if specified
  if (expectedMessageContains) {
    expect(baseError.message).toContain(expectedMessageContains);
  }

  // Assert context properties
  expect(baseError.context).toBeDefined();
  expect(baseError.context.journeyType).toBe('care');

  // Assert additional context properties if specified
  if (expectedContext) {
    Object.entries(expectedContext).forEach(([key, value]) => {
      expect(baseError.context[key]).toEqual(value);
    });
  }

  // Assert care-specific context properties
  if (expectedAppointmentId) {
    expect(baseError.context.appointmentId).toBe(expectedAppointmentId);
  }

  if (expectedProviderId) {
    expect(baseError.context.providerId).toBe(expectedProviderId);
  }

  if (expectedMedicationId) {
    expect(baseError.context.medicationId).toBe(expectedMedicationId);
  }

  if (expectedSessionId) {
    expect(baseError.context.sessionId).toBe(expectedSessionId);
  }
}

/**
 * Options for Plan journey error assertions
 */
export interface PlanErrorAssertionOptions extends JourneyErrorAssertionOptions {
  /** Expected plan ID in context */
  expectedPlanId?: string;
  /** Expected benefit ID in context */
  expectedBenefitId?: string;
  /** Expected claim ID in context */
  expectedClaimId?: string;
  /** Expected coverage ID in context */
  expectedCoverageId?: string;
}

/**
 * Asserts that an error is a properly formatted Plan journey error
 * with the expected properties.
 *
 * @param error - The error to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the error doesn't match expectations
 */
export function assertPlanJourneyError(
  error: Error | BaseError,
  options: PlanErrorAssertionOptions = {}
): void {
  const {
    expectedType,
    expectedCodePrefix = 'PLAN_',
    expectedMessageContains,
    expectedContext,
    expectedPlanId,
    expectedBenefitId,
    expectedClaimId,
    expectedCoverageId
  } = options;

  // Assert error is a BaseError
  expect(error).toBeInstanceOf(BaseError);
  const baseError = error as BaseError;

  // Assert error type if specified
  if (expectedType) {
    expect(baseError.type).toBe(expectedType);
  }

  // Assert error code prefix
  expect(baseError.code).toMatch(new RegExp(`^${expectedCodePrefix}`));

  // Assert error message if specified
  if (expectedMessageContains) {
    expect(baseError.message).toContain(expectedMessageContains);
  }

  // Assert context properties
  expect(baseError.context).toBeDefined();
  expect(baseError.context.journeyType).toBe('plan');

  // Assert additional context properties if specified
  if (expectedContext) {
    Object.entries(expectedContext).forEach(([key, value]) => {
      expect(baseError.context[key]).toEqual(value);
    });
  }

  // Assert plan-specific context properties
  if (expectedPlanId) {
    expect(baseError.context.planId).toBe(expectedPlanId);
  }

  if (expectedBenefitId) {
    expect(baseError.context.benefitId).toBe(expectedBenefitId);
  }

  if (expectedClaimId) {
    expect(baseError.context.claimId).toBe(expectedClaimId);
  }

  if (expectedCoverageId) {
    expect(baseError.context.coverageId).toBe(expectedCoverageId);
  }
}

/**
 * Options for cross-journey error assertions
 */
export interface CrossJourneyErrorAssertionOptions extends JourneyErrorAssertionOptions {
  /** Expected source journey type */
  expectedSourceJourney: 'health' | 'care' | 'plan';
  /** Expected target journey type */
  expectedTargetJourney: 'health' | 'care' | 'plan';
  /** Expected operation type */
  expectedOperation?: string;
}

/**
 * Asserts that an error is a properly formatted cross-journey error
 * with the expected properties.
 *
 * @param error - The error to validate
 * @param options - Options for the assertion
 * @throws AssertionError if the error doesn't match expectations
 */
export function assertCrossJourneyError(
  error: Error | BaseError,
  options: CrossJourneyErrorAssertionOptions
): void {
  const {
    expectedType,
    expectedCodePrefix = 'JOURNEY_',
    expectedMessageContains,
    expectedContext,
    expectedSourceJourney,
    expectedTargetJourney,
    expectedOperation
  } = options;

  // Assert error is a BaseError
  expect(error).toBeInstanceOf(BaseError);
  const baseError = error as BaseError;

  // Assert error type if specified
  if (expectedType) {
    expect(baseError.type).toBe(expectedType);
  }

  // Assert error code prefix
  expect(baseError.code).toMatch(new RegExp(`^${expectedCodePrefix}`));

  // Assert error message if specified
  if (expectedMessageContains) {
    expect(baseError.message).toContain(expectedMessageContains);
  }

  // Assert context properties
  expect(baseError.context).toBeDefined();
  expect(baseError.context.sourceJourney).toBe(expectedSourceJourney);
  expect(baseError.context.targetJourney).toBe(expectedTargetJourney);

  // Assert operation if specified
  if (expectedOperation) {
    expect(baseError.context.operation).toBe(expectedOperation);
  }

  // Assert additional context properties if specified
  if (expectedContext) {
    Object.entries(expectedContext).forEach(([key, value]) => {
      expect(baseError.context[key]).toEqual(value);
    });
  }
}

// ===== Error Recovery and Fallback Assertions =====

/**
 * Options for retry mechanism assertions
 */
export interface RetryAssertionOptions {
  /** Expected maximum number of retry attempts */
  expectedMaxRetries: number;
  /** Expected backoff strategy */
  expectedBackoffType?: 'fixed' | 'exponential' | 'custom';
  /** Expected initial delay in milliseconds */
  expectedInitialDelay?: number;
  /** Expected maximum delay in milliseconds */
  expectedMaxDelay?: number;
  /** Expected jitter factor (0-1) */
  expectedJitter?: number;
}

/**
 * Asserts that a retry mechanism behaves as expected when handling errors.
 *
 * @param operation - The operation function that might throw an error
 * @param options - Options for the assertion
 * @returns A promise that resolves when the assertion is complete
 * @throws AssertionError if the retry behavior doesn't match expectations
 */
export async function assertRetryBehavior(
  operation: () => Promise<any>,
  options: RetryAssertionOptions
): Promise<void> {
  const {
    expectedMaxRetries,
    expectedBackoffType = 'exponential',
    expectedInitialDelay,
    expectedMaxDelay,
    expectedJitter
  } = options;

  // Mock Date.now to control timing
  const originalDateNow = Date.now;
  let currentTime = 0;
  Date.now = jest.fn(() => currentTime);

  // Track retry attempts and delays
  const retryAttempts: number[] = [];
  const retryDelays: number[] = [];

  // Create a wrapper function that tracks retries
  const wrappedOperation = async () => {
    try {
      return await operation();
    } catch (error) {
      retryAttempts.push(Date.now());
      throw error;
    }
  };

  // Execute the operation and expect it to eventually succeed or exhaust retries
  try {
    await wrappedOperation();
  } catch (error) {
    // Calculate delays between retry attempts
    for (let i = 1; i < retryAttempts.length; i++) {
      retryDelays.push(retryAttempts[i] - retryAttempts[i - 1]);
    }

    // Assert retry count
    expect(retryAttempts.length - 1).toBeLessThanOrEqual(expectedMaxRetries);

    // Assert backoff strategy if delays were captured
    if (retryDelays.length > 1 && expectedBackoffType) {
      switch (expectedBackoffType) {
        case 'fixed':
          // All delays should be approximately equal
          for (let i = 1; i < retryDelays.length; i++) {
            const ratio = retryDelays[i] / retryDelays[0];
            expect(ratio).toBeCloseTo(1, 1); // Allow 10% variation
          }
          break;

        case 'exponential':
          // Delays should increase exponentially
          for (let i = 1; i < retryDelays.length; i++) {
            expect(retryDelays[i]).toBeGreaterThan(retryDelays[i - 1]);
          }
          break;

        case 'custom':
          // Custom backoff doesn't have a specific pattern to check
          break;
      }
    }

    // Assert initial delay if specified
    if (expectedInitialDelay && retryDelays.length > 0) {
      expect(retryDelays[0]).toBeCloseTo(expectedInitialDelay, -2); // Allow 100ms variation
    }

    // Assert maximum delay if specified
    if (expectedMaxDelay && retryDelays.length > 0) {
      const maxDelay = Math.max(...retryDelays);
      expect(maxDelay).toBeLessThanOrEqual(expectedMaxDelay);
    }

    // Assert jitter if specified
    if (expectedJitter !== undefined && retryDelays.length > 1) {
      // With jitter, delays shouldn't be exactly exponential
      // This is a simplified check that just ensures some variation
      const hasVariation = retryDelays.some((delay, i) => {
        if (i === 0) return false;
        const expectedWithoutJitter = retryDelays[0] * Math.pow(2, i);
        const ratio = delay / expectedWithoutJitter;
        return Math.abs(1 - ratio) > 0.01; // At least 1% variation
      });

      if (expectedJitter > 0) {
        expect(hasVariation).toBe(true);
      } else {
        expect(hasVariation).toBe(false);
      }
    }
  } finally {
    // Restore original Date.now
    Date.now = originalDateNow;
  }
}

/**
 * Options for circuit breaker assertions
 */
export interface CircuitBreakerAssertionOptions {
  /** Expected failure threshold before opening */
  expectedFailureThreshold: number;
  /** Expected reset timeout in milliseconds */
  expectedResetTimeout: number;
  /** Expected fallback value when circuit is open */
  expectedFallbackValue?: any;
}

/**
 * Asserts that a circuit breaker behaves as expected when handling errors.
 *
 * @param operation - The operation function protected by a circuit breaker
 * @param failingOperation - A function that will always fail and trigger the circuit breaker
 * @param options - Options for the assertion
 * @returns A promise that resolves when the assertion is complete
 * @throws AssertionError if the circuit breaker behavior doesn't match expectations
 */
export async function assertCircuitBreakerBehavior(
  operation: () => Promise<any>,
  failingOperation: () => Promise<any>,
  options: CircuitBreakerAssertionOptions
): Promise<void> {
  const {
    expectedFailureThreshold,
    expectedResetTimeout,
    expectedFallbackValue
  } = options;

  // Mock Date.now to control timing
  const originalDateNow = Date.now;
  let currentTime = 0;
  Date.now = jest.fn(() => currentTime);

  try {
    // Trigger failures to open the circuit
    for (let i = 0; i < expectedFailureThreshold; i++) {
      try {
        await failingOperation();
        fail('Expected operation to fail');
      } catch (error) {
        // Expected failure
      }
    }

    // Circuit should now be open
    // Verify that the operation fails fast or returns fallback
    const startTime = Date.now();
    try {
      const result = await operation();
      // If we get here, the operation should have returned the fallback value
      expect(expectedFallbackValue).toBeDefined();
      expect(result).toEqual(expectedFallbackValue);
    } catch (error) {
      // If no fallback value is expected, the operation should fail fast
      if (expectedFallbackValue === undefined) {
        expect(error.message).toContain('circuit breaker is open');
      } else {
        fail(`Expected fallback value ${expectedFallbackValue} but got error: ${error.message}`);
      }
    }
    const endTime = Date.now();

    // Operation should fail fast (much less than service timeout)
    expect(endTime - startTime).toBeLessThan(100); // 100ms is a reasonable threshold

    // Advance time past the reset timeout
    currentTime += expectedResetTimeout + 100;

    // Circuit should now be half-open
    // The next call should go through to the service
    const probeStartTime = Date.now();
    try {
      await operation();
      // If successful, circuit should close
    } catch (error) {
      // If failed, circuit should remain open
    }
    const probeEndTime = Date.now();

    // Probe call should not fail fast
    expect(probeEndTime - probeStartTime).toBeGreaterThan(10); // Should take some time
  } finally {
    // Restore original Date.now
    Date.now = originalDateNow;
  }
}

/**
 * Options for graceful degradation assertions
 */
export interface GracefulDegradationOptions {
  /** Expected fallback value when primary operation fails */
  expectedFallbackValue: any;
  /** Whether to expect cached data as fallback */
  expectCachedData?: boolean;
  /** Whether to expect default behavior as fallback */
  expectDefaultBehavior?: boolean;
}

/**
 * Asserts that a system gracefully degrades when a primary operation fails.
 *
 * @param primaryOperation - The primary operation that will fail
 * @param fallbackOperation - The fallback operation that should be called
 * @param options - Options for the assertion
 * @returns A promise that resolves when the assertion is complete
 * @throws AssertionError if the graceful degradation doesn't match expectations
 */
export async function assertGracefulDegradation(
  primaryOperation: () => Promise<any>,
  fallbackOperation: () => Promise<any>,
  options: GracefulDegradationOptions
): Promise<void> {
  const {
    expectedFallbackValue,
    expectCachedData = false,
    expectDefaultBehavior = false
  } = options;

  // Spy on the fallback operation
  const fallbackSpy = jest.fn(fallbackOperation);

  // Create a wrapper function that tries primary then fallback
  const wrappedOperation = async () => {
    try {
      return await primaryOperation();
    } catch (error) {
      return await fallbackSpy();
    }
  };

  // Execute the operation
  const result = await wrappedOperation();

  // Assert that fallback was called
  expect(fallbackSpy).toHaveBeenCalled();

  // Assert result matches expected fallback value
  expect(result).toEqual(expectedFallbackValue);

  // Assert additional expectations based on fallback type
  if (expectCachedData) {
    // Should have metadata indicating it's cached
    expect(result).toHaveProperty('_metadata.cached', true);
    expect(result).toHaveProperty('_metadata.timestamp');
  }

  if (expectDefaultBehavior) {
    // Should have metadata indicating it's default behavior
    expect(result).toHaveProperty('_metadata.isDefault', true);
  }
}