import { retryWithBackoff, RetryOptions, isRetryableError } from '../../../src/utils/retry';

// Mock timers for testing delay calculations
jest.useFakeTimers();

describe('Retry Utility', () => {
  // Mock functions for testing
  let mockOperation: jest.Mock;
  let mockLogger: jest.Mock;
  let mockOnRetry: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks before each test
    mockOperation = jest.fn();
    mockLogger = jest.fn();
    mockOnRetry = jest.fn();
    jest.clearAllMocks();
  });

  describe('retryWithBackoff', () => {
    it('should execute operation successfully without retries when it succeeds on first attempt', async () => {
      // Arrange
      mockOperation.mockResolvedValueOnce('success');
      
      // Act
      const result = await retryWithBackoff(mockOperation);
      
      // Assert
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry operation when it fails with a retryable error', async () => {
      // Arrange
      const transientError = new Error('Temporary failure');
      transientError.name = 'TransientError';
      
      mockOperation
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success after retry');
      
      // Act
      const result = await retryWithBackoff(mockOperation, {
        maxRetries: 3,
        initialDelayMs: 100,
        logger: mockLogger
      });
      
      // Assert
      expect(result).toBe('success after retry');
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Retrying operation'),
        expect.objectContaining({ attempt: 1, error: transientError })
      );
    });

    it('should respect maxRetries and throw the last error after exhausting retries', async () => {
      // Arrange
      const transientError = new Error('Persistent transient error');
      transientError.name = 'TransientError';
      
      mockOperation.mockRejectedValue(transientError);
      
      // Act & Assert
      await expect(retryWithBackoff(mockOperation, {
        maxRetries: 3,
        initialDelayMs: 100,
        logger: mockLogger
      })).rejects.toThrow('Persistent transient error');
      
      expect(mockOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(mockLogger).toHaveBeenCalledTimes(3); // Log for each retry
    });

    it('should not retry when error is not retryable', async () => {
      // Arrange
      const permanentError = new Error('Permanent failure');
      permanentError.name = 'ValidationError'; // Non-retryable error type
      
      mockOperation.mockRejectedValue(permanentError);
      
      // Act & Assert
      await expect(retryWithBackoff(mockOperation, {
        maxRetries: 3,
        initialDelayMs: 100,
        logger: mockLogger
      })).rejects.toThrow('Permanent failure');
      
      expect(mockOperation).toHaveBeenCalledTimes(1); // No retries
      expect(mockLogger).not.toHaveBeenCalled(); // No retry logs
    });

    it('should use custom isRetryable function when provided', async () => {
      // Arrange
      const customError = new Error('Custom error');
      customError.name = 'CustomError';
      
      const customIsRetryable = jest.fn().mockImplementation((error) => {
        return error.name === 'CustomError';
      });
      
      mockOperation
        .mockRejectedValueOnce(customError)
        .mockResolvedValueOnce('success after custom retry');
      
      // Act
      const result = await retryWithBackoff(mockOperation, {
        maxRetries: 3,
        initialDelayMs: 100,
        isRetryable: customIsRetryable,
        logger: mockLogger
      });
      
      // Assert
      expect(result).toBe('success after custom retry');
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(customIsRetryable).toHaveBeenCalledWith(customError);
    });

    it('should calculate exponential backoff delays correctly', async () => {
      // Arrange
      const transientError = new Error('Network error');
      transientError.name = 'NetworkError';
      
      mockOperation.mockRejectedValue(transientError);
      
      // Mock Date.now for predictable jitter calculations
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(1000);
      
      // Spy on setTimeout to verify delay calculations
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      try {
        // Act & Assert
        const retryPromise = retryWithBackoff(mockOperation, {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffFactor: 2,
          jitterFactor: 0.2, // 20% jitter
          logger: mockLogger
        });
        
        // Fast-forward timers for first retry
        jest.runAllTimers();
        
        // Fast-forward timers for second retry
        jest.runAllTimers();
        
        // Fast-forward timers for third retry
        jest.runAllTimers();
        
        await expect(retryPromise).rejects.toThrow('Network error');
        
        // Verify exponential backoff delays
        // First retry: 100ms (initial delay)
        // Second retry: 200ms (100ms * 2^1)
        // Third retry: 400ms (100ms * 2^2)
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), expect.any(Number));
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), expect.any(Number));
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(3, expect.any(Function), expect.any(Number));
        
        // Verify delays are within expected ranges (accounting for jitter)
        const firstDelay = setTimeoutSpy.mock.calls[0][1];
        const secondDelay = setTimeoutSpy.mock.calls[1][1];
        const thirdDelay = setTimeoutSpy.mock.calls[2][1];
        
        // With 20% jitter, delays should be within these ranges:
        // First: 80-120ms
        // Second: 160-240ms
        // Third: 320-480ms
        expect(firstDelay).toBeGreaterThanOrEqual(80);
        expect(firstDelay).toBeLessThanOrEqual(120);
        
        expect(secondDelay).toBeGreaterThanOrEqual(160);
        expect(secondDelay).toBeLessThanOrEqual(240);
        
        expect(thirdDelay).toBeGreaterThanOrEqual(320);
        expect(thirdDelay).toBeLessThanOrEqual(480);
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
        setTimeoutSpy.mockRestore();
      }
    });

    it('should respect maxDelayMs when calculating backoff', async () => {
      // Arrange
      const transientError = new Error('Network error');
      transientError.name = 'NetworkError';
      
      mockOperation.mockRejectedValue(transientError);
      
      // Spy on setTimeout to verify delay calculations
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      try {
        // Act
        const retryPromise = retryWithBackoff(mockOperation, {
          maxRetries: 5,
          initialDelayMs: 100,
          maxDelayMs: 500, // Cap at 500ms
          backoffFactor: 2,
          jitterFactor: 0, // No jitter for this test
          logger: mockLogger
        });
        
        // Fast-forward all timers
        for (let i = 0; i < 5; i++) {
          jest.runAllTimers();
        }
        
        await expect(retryPromise).rejects.toThrow('Network error');
        
        // Verify delays (100, 200, 400, 500, 500)
        // First three follow exponential pattern, last two capped at maxDelayMs
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(3, expect.any(Function), 400);
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(4, expect.any(Function), 500); // Capped at maxDelayMs
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(5, expect.any(Function), 500); // Capped at maxDelayMs
      } finally {
        setTimeoutSpy.mockRestore();
      }
    });

    it('should call onRetry callback with attempt number and error', async () => {
      // Arrange
      const transientError = new Error('Temporary failure');
      transientError.name = 'TransientError';
      
      mockOperation
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success after retries');
      
      // Act
      const result = await retryWithBackoff(mockOperation, {
        maxRetries: 3,
        initialDelayMs: 10, // Small delay for faster tests
        onRetry: mockOnRetry
      });
      
      // Fast-forward all timers
      jest.runAllTimers();
      jest.runAllTimers();
      
      // Assert
      expect(result).toBe('success after retries');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(mockOnRetry).toHaveBeenCalledTimes(2);
      expect(mockOnRetry).toHaveBeenNthCalledWith(1, 1, transientError); // First retry
      expect(mockOnRetry).toHaveBeenNthCalledWith(2, 2, transientError); // Second retry
    });

    it('should pass operation arguments correctly on each retry', async () => {
      // Arrange
      const transientError = new Error('Temporary failure');
      transientError.name = 'TransientError';
      
      mockOperation
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success');
      
      // Act
      const result = await retryWithBackoff(
        () => mockOperation('arg1', 'arg2'),
        { maxRetries: 1, initialDelayMs: 10 }
      );
      
      // Fast-forward timer
      jest.runAllTimers();
      
      // Assert
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockOperation).toHaveBeenNthCalledWith(1, 'arg1', 'arg2');
      expect(mockOperation).toHaveBeenNthCalledWith(2, 'arg1', 'arg2');
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      // Arrange
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      // Act & Assert
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      // Arrange
      const timeoutError = new Error('Request timed out');
      timeoutError.name = 'TimeoutError';
      
      // Act & Assert
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it('should identify connection errors as retryable', () => {
      // Arrange
      const connectionError = new Error('Connection refused');
      connectionError.name = 'ConnectionError';
      
      // Act & Assert
      expect(isRetryableError(connectionError)).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      // Arrange
      const rateLimitError = new Error('Too many requests');
      rateLimitError.name = 'RateLimitError';
      
      // Act & Assert
      expect(isRetryableError(rateLimitError)).toBe(true);
    });

    it('should identify errors with status code 429 as retryable', () => {
      // Arrange
      const tooManyRequestsError = new Error('Too Many Requests');
      (tooManyRequestsError as any).statusCode = 429;
      
      // Act & Assert
      expect(isRetryableError(tooManyRequestsError)).toBe(true);
    });

    it('should identify errors with status code 503 as retryable', () => {
      // Arrange
      const serviceUnavailableError = new Error('Service Unavailable');
      (serviceUnavailableError as any).statusCode = 503;
      
      // Act & Assert
      expect(isRetryableError(serviceUnavailableError)).toBe(true);
    });

    it('should not identify validation errors as retryable', () => {
      // Arrange
      const validationError = new Error('Invalid input');
      validationError.name = 'ValidationError';
      
      // Act & Assert
      expect(isRetryableError(validationError)).toBe(false);
    });

    it('should not identify authentication errors as retryable', () => {
      // Arrange
      const authError = new Error('Unauthorized');
      authError.name = 'AuthenticationError';
      
      // Act & Assert
      expect(isRetryableError(authError)).toBe(false);
    });

    it('should not identify errors with status code 400 as retryable', () => {
      // Arrange
      const badRequestError = new Error('Bad Request');
      (badRequestError as any).statusCode = 400;
      
      // Act & Assert
      expect(isRetryableError(badRequestError)).toBe(false);
    });

    it('should not identify errors with status code 404 as retryable', () => {
      // Arrange
      const notFoundError = new Error('Not Found');
      (notFoundError as any).statusCode = 404;
      
      // Act & Assert
      expect(isRetryableError(notFoundError)).toBe(false);
    });
  });
});