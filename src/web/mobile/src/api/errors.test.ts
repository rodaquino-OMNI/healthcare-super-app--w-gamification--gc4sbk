/**
 * @file errors.test.ts
 * @description Tests for the error handling framework
 */

import { AxiosError } from 'axios';
import { ApolloError } from '@apollo/client';
import { ErrorCode } from '@austa/interfaces/common/error';
import {
  ApiError,
  ClientError,
  SystemError,
  TransientError,
  ExternalError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  CircuitBreaker,
  CircuitState,
  withRetry,
  parseError,
  createProtectedApiClient,
  withErrorHandling,
  ErrorCategory
} from './errors';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true })
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0'
  }
}));

describe('Error Classes', () => {
  test('ApiError should create a properly structured error', () => {
    const error = new ApiError({
      message: 'Test error',
      category: ErrorCategory.SYSTEM,
      code: ErrorCode.INTERNAL_ERROR,
      status: 500,
      context: { test: 'value' }
    });

    expect(error.message).toBe('Test error');
    expect(error.category).toBe(ErrorCategory.SYSTEM);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.status).toBe(500);
    expect(error.context).toHaveProperty('test', 'value');
    expect(error.context).toHaveProperty('platform', 'ios');
    expect(error.timestamp).toBeDefined();
    expect(error instanceof Error).toBe(true);
    expect(error instanceof ApiError).toBe(true);
  });

  test('ClientError should have CLIENT category', () => {
    const error = new ClientError({ message: 'Client error' });
    expect(error.category).toBe(ErrorCategory.CLIENT);
    expect(error.code).toBe(ErrorCode.INVALID_INPUT);
    expect(error.status).toBe(400);
  });

  test('SystemError should have SYSTEM category', () => {
    const error = new SystemError({ message: 'System error' });
    expect(error.category).toBe(ErrorCategory.SYSTEM);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.status).toBe(500);
  });

  test('TransientError should have TRANSIENT category', () => {
    const error = new TransientError({ message: 'Transient error' });
    expect(error.category).toBe(ErrorCategory.TRANSIENT);
    expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(error.status).toBe(503);
  });

  test('ExternalError should have EXTERNAL category', () => {
    const error = new ExternalError({ message: 'External error' });
    expect(error.category).toBe(ErrorCategory.EXTERNAL);
    expect(error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
    expect(error.status).toBe(502);
  });

  test('ValidationError should handle validation errors', () => {
    const validationErrors = {
      email: ['Email is invalid'],
      password: ['Password is too short']
    };
    const error = new ValidationError({ validationErrors });
    expect(error.category).toBe(ErrorCategory.CLIENT);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.status).toBe(422);
    expect(error.validationErrors).toEqual(validationErrors);
    
    const fieldErrors = error.getFieldErrors();
    expect(fieldErrors.email).toBe('Email is invalid');
    expect(fieldErrors.password).toBe('Password is too short');
  });
});

describe('Error Serialization', () => {
  test('serialize should return a structured error object', () => {
    const error = new ApiError({
      message: 'Test error',
      category: ErrorCategory.SYSTEM,
      code: ErrorCode.INTERNAL_ERROR,
      status: 500
    });

    const serialized = error.serialize();
    expect(serialized).toHaveProperty('message', 'Test error');
    expect(serialized).toHaveProperty('code', ErrorCode.INTERNAL_ERROR);
    expect(serialized).toHaveProperty('status', 500);
    expect(serialized).toHaveProperty('category', ErrorCategory.SYSTEM);
    expect(serialized).toHaveProperty('timestamp');
    expect(serialized).toHaveProperty('context');
    expect(serialized).toHaveProperty('stack');
  });

  test('getUserMessage should return user-friendly messages', () => {
    const clientError = new ClientError({ message: 'Client error' });
    const systemError = new SystemError({ message: 'System error' });
    const transientError = new TransientError({ message: 'Transient error' });
    const externalError = new ExternalError({ message: 'External error' });

    expect(clientError.getUserMessage()).toContain('verifique os dados');
    expect(systemError.getUserMessage()).toContain('erro no sistema');
    expect(transientError.getUserMessage()).toContain('instabilidade');
    expect(externalError.getUserMessage()).toContain('serviço externo');
  });
});

describe('Retry Mechanism', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('withRetry should retry on transient errors', async () => {
    const mockFn = jest.fn();
    let attempts = 0;

    mockFn.mockImplementation(() => {
      attempts++;
      if (attempts <= 2) {
        throw new TransientError({ message: 'Temporary error' });
      }
      return Promise.resolve('success');
    });

    const promise = withRetry(mockFn, { maxRetries: 3, initialDelayMs: 100 });
    
    // Fast-forward timers to simulate waiting
    jest.runAllTimers();
    
    const result = await promise;
    
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(result).toBe('success');
  });

  test('withRetry should not retry on non-retryable errors', async () => {
    const mockFn = jest.fn();
    mockFn.mockRejectedValueOnce(new ClientError({ message: 'Client error' }));

    await expect(withRetry(mockFn, { maxRetries: 3 })).rejects.toThrow('Client error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('withRetry should respect maxRetries', async () => {
    const mockFn = jest.fn();
    mockFn.mockRejectedValue(new TransientError({ message: 'Always fails' }));

    await expect(withRetry(mockFn, { maxRetries: 2, initialDelayMs: 10 })).rejects.toThrow('Always fails');
    
    // Fast-forward timers to simulate waiting
    jest.runAllTimers();
    
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

describe('Circuit Breaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    jest.useFakeTimers();
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 1,
      resetTimeoutMs: 1000,
      monitorIntervalMs: 100
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should start in CLOSED state', () => {
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  test('should open after reaching failure threshold', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

    // First failure
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test error');
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

    // Second failure - should open the circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test error');
    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

    // Should fail fast when circuit is open
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is open');
    expect(mockFn).toHaveBeenCalledTimes(2); // Only called twice, not on the third attempt
  });

  test('should transition to HALF_OPEN after reset timeout', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

    // Open the circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

    // Advance time past reset timeout
    jest.advanceTimersByTime(1100);

    // Next call should put circuit in HALF_OPEN state
    mockFn.mockRejectedValueOnce(new Error('Still failing'));
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Still failing');
    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN); // Back to OPEN after failure in HALF_OPEN

    // Advance time again
    jest.advanceTimersByTime(1100);

    // Success should close the circuit
    mockFn.mockResolvedValueOnce('success');
    const result = await circuitBreaker.execute(mockFn);
    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  test('reset should restore circuit to initial state', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

    // Open the circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

    // Reset the circuit
    circuitBreaker.reset();
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

    // Should be able to execute again
    mockFn.mockResolvedValueOnce('success');
    const result = await circuitBreaker.execute(mockFn);
    expect(result).toBe('success');
  });
});

describe('Error Parsing', () => {
  test('should parse Axios errors correctly', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          message: 'Unauthorized access'
        }
      },
      message: 'Request failed with status code 401'
    } as AxiosError;

    const parsedError = parseError(axiosError);
    expect(parsedError).toBeInstanceOf(AuthenticationError);
    expect(parsedError.message).toBe('Unauthorized access');
    expect(parsedError.status).toBe(401);
  });

  test('should parse Apollo errors correctly', () => {
    const apolloError = new ApolloError({
      graphQLErrors: [
        {
          message: 'Not found',
          extensions: {
            code: 'NOT_FOUND',
            status: 404
          }
        }
      ]
    });

    const parsedError = parseError(apolloError);
    expect(parsedError).toBeInstanceOf(NotFoundError);
    expect(parsedError.message).toBe('Not found');
    expect(parsedError.status).toBe(404);
  });

  test('should handle network errors', () => {
    const networkError = new Error('Network Error');
    const parsedError = parseError(networkError);
    expect(parsedError).toBeInstanceOf(NetworkError);
  });

  test('should handle timeout errors', () => {
    const timeoutError = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 10000ms exceeded'
    } as AxiosError;

    const parsedError = parseError(timeoutError);
    expect(parsedError).toBeInstanceOf(TimeoutError);
  });

  test('should default to SystemError for unknown errors', () => {
    const unknownError = new Error('Something went wrong');
    const parsedError = parseError(unknownError);
    expect(parsedError).toBeInstanceOf(SystemError);
    expect(parsedError.message).toBe('Something went wrong');
  });
});

describe('API Client Protection', () => {
  test('createProtectedApiClient should wrap API methods with error handling', async () => {
    const mockApiClient = {
      getData: jest.fn().mockResolvedValue({ data: 'test' }),
      property: 'value'
    };

    const protectedClient = createProtectedApiClient(mockApiClient);
    
    // Methods should be wrapped
    const result = await protectedClient.getData();
    expect(result).toEqual({ data: 'test' });
    expect(mockApiClient.getData).toHaveBeenCalled();
    
    // Properties should remain unchanged
    expect(protectedClient.property).toBe('value');
  });

  test('withErrorHandling should wrap functions with error handling', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = withErrorHandling(mockFn);
    
    const result = await wrappedFn('arg1', 'arg2');
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});