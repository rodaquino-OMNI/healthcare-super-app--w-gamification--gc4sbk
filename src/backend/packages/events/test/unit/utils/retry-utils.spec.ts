import { Test } from '@nestjs/testing';
import { RetryUtils, RetryOptions, RetryContext, RetryPolicy } from '../../../src/utils/retry-utils';
import { EventProcessingError, ErrorCategory } from '../../../src/constants/errors.constants';
import { DeadLetterService } from '../../../src/kafka/dead-letter.service';
import { LoggerService } from '@austa/logging';
import { mock, MockProxy } from 'jest-mock-extended';

describe('RetryUtils', () => {
  let retryUtils: RetryUtils;
  let deadLetterService: MockProxy<DeadLetterService>;
  let logger: MockProxy<LoggerService>;
  
  beforeEach(async () => {
    deadLetterService = mock<DeadLetterService>();
    logger = mock<LoggerService>();
    
    const moduleRef = await Test.createTestingModule({
      providers: [
        RetryUtils,
        { provide: DeadLetterService, useValue: deadLetterService },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();
    
    retryUtils = moduleRef.get<RetryUtils>(RetryUtils);
  });
  
  describe('calculateBackoff', () => {
    it('should calculate exponential backoff with default options', () => {
      // Default options: baseDelay = 100, factor = 2, maxDelay = 10000
      expect(retryUtils.calculateBackoff(1)).toBe(100);
      expect(retryUtils.calculateBackoff(2)).toBe(200);
      expect(retryUtils.calculateBackoff(3)).toBe(400);
      expect(retryUtils.calculateBackoff(4)).toBe(800);
      expect(retryUtils.calculateBackoff(5)).toBe(1600);
    });
    
    it('should calculate exponential backoff with custom options', () => {
      const options: RetryOptions = {
        baseDelay: 50,
        factor: 3,
        maxDelay: 5000,
        maxRetries: 5,
      };
      
      expect(retryUtils.calculateBackoff(1, options)).toBe(50);
      expect(retryUtils.calculateBackoff(2, options)).toBe(150);
      expect(retryUtils.calculateBackoff(3, options)).toBe(450);
      expect(retryUtils.calculateBackoff(4, options)).toBe(1350);
      expect(retryUtils.calculateBackoff(5, options)).toBe(4050);
    });
    
    it('should respect maxDelay limit', () => {
      const options: RetryOptions = {
        baseDelay: 1000,
        factor: 10,
        maxDelay: 5000,
        maxRetries: 5,
      };
      
      expect(retryUtils.calculateBackoff(1, options)).toBe(1000);
      expect(retryUtils.calculateBackoff(2, options)).toBe(5000); // Would be 10000, but capped at 5000
      expect(retryUtils.calculateBackoff(3, options)).toBe(5000); // Would be 100000, but capped at 5000
    });
    
    it('should add jitter to prevent thundering herd', () => {
      const options: RetryOptions = {
        baseDelay: 100,
        factor: 2,
        maxDelay: 10000,
        maxRetries: 5,
        jitter: true,
      };
      
      // Mock Math.random to return a predictable value
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
      
      // With 50% jitter and Math.random() = 0.5, we should get 75% of the original delay
      expect(retryUtils.calculateBackoff(1, options)).toBe(75);
      expect(retryUtils.calculateBackoff(2, options)).toBe(150);
      
      // Restore Math.random
      jest.spyOn(global.Math, 'random').mockRestore();
    });
  });
  
  describe('shouldRetry', () => {
    it('should return true if retry count is less than maxRetries', () => {
      const context: RetryContext = {
        retryCount: 2,
        error: new EventProcessingError('TEST_ERROR', 'Test error'),
        originalEvent: { id: '123', type: 'test.event', data: {} },
      };
      
      const options: RetryOptions = {
        maxRetries: 3,
      };
      
      expect(retryUtils.shouldRetry(context, options)).toBe(true);
    });
    
    it('should return false if retry count equals or exceeds maxRetries', () => {
      const context: RetryContext = {
        retryCount: 3,
        error: new EventProcessingError('TEST_ERROR', 'Test error'),
        originalEvent: { id: '123', type: 'test.event', data: {} },
      };
      
      const options: RetryOptions = {
        maxRetries: 3,
      };
      
      expect(retryUtils.shouldRetry(context, options)).toBe(false);
    });
    
    it('should respect custom retry policy', () => {
      const context: RetryContext = {
        retryCount: 1,
        error: new EventProcessingError('NETWORK_ERROR', 'Network error', ErrorCategory.TRANSIENT),
        originalEvent: { id: '123', type: 'test.event', data: {} },
      };
      
      const retryPolicy: RetryPolicy = (ctx) => {
        // Only retry transient errors
        return ctx.error.category === ErrorCategory.TRANSIENT;
      };
      
      const options: RetryOptions = {
        maxRetries: 3,
        retryPolicy,
      };
      
      expect(retryUtils.shouldRetry(context, options)).toBe(true);
      
      // Change error category to non-transient
      context.error = new EventProcessingError('VALIDATION_ERROR', 'Validation error', ErrorCategory.PERMANENT);
      expect(retryUtils.shouldRetry(context, options)).toBe(false);
    });
  });
  
  describe('executeWithRetry', () => {
    it('should execute function successfully without retries', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryUtils.executeWithRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Operation executed successfully'),
        expect.any(Object)
      );
    });
    
    it('should retry on failure and eventually succeed', async () => {
      // Fail twice, then succeed
      const operation = jest.fn()
        .mockRejectedValueOnce(new EventProcessingError('NETWORK_ERROR', 'Network error', ErrorCategory.TRANSIENT))
        .mockRejectedValueOnce(new EventProcessingError('NETWORK_ERROR', 'Network error', ErrorCategory.TRANSIENT))
        .mockResolvedValue('success');
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      const resultPromise = retryUtils.executeWithRetry(operation, {
        baseDelay: 100,
        maxRetries: 3,
      });
      
      // Fast-forward timers after each retry
      jest.advanceTimersByTime(100); // First retry
      jest.advanceTimersByTime(200); // Second retry
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
      
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrying operation'),
        expect.objectContaining({ retryCount: 1 })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrying operation'),
        expect.objectContaining({ retryCount: 2 })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Operation executed successfully after retries'),
        expect.objectContaining({ retryCount: 2 })
      );
      
      jest.useRealTimers();
    });
    
    it('should fail after maximum retries and send to dead letter queue', async () => {
      const error = new EventProcessingError('NETWORK_ERROR', 'Network error', ErrorCategory.TRANSIENT);
      const operation = jest.fn().mockRejectedValue(error);
      const event = { id: '123', type: 'test.event', data: {} };
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      const resultPromise = retryUtils.executeWithRetry(
        operation,
        {
          baseDelay: 100,
          maxRetries: 3,
        },
        event
      );
      
      // Fast-forward timers for all retries
      jest.advanceTimersByTime(100); // First retry
      jest.advanceTimersByTime(200); // Second retry
      jest.advanceTimersByTime(400); // Third retry
      
      await expect(resultPromise).rejects.toThrow(error);
      
      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed after maximum retries'),
        expect.objectContaining({ retryCount: 3, error })
      );
      
      expect(deadLetterService.sendToDeadLetter).toHaveBeenCalledWith(
        event,
        error,
        expect.objectContaining({ retryCount: 3 })
      );
      
      jest.useRealTimers();
    });
    
    it('should not retry if retryPolicy returns false', async () => {
      const error = new EventProcessingError('VALIDATION_ERROR', 'Validation error', ErrorCategory.PERMANENT);
      const operation = jest.fn().mockRejectedValue(error);
      const event = { id: '123', type: 'test.event', data: {} };
      
      const retryPolicy: RetryPolicy = (ctx) => {
        return ctx.error.category === ErrorCategory.TRANSIENT;
      };
      
      const resultPromise = retryUtils.executeWithRetry(
        operation,
        {
          baseDelay: 100,
          maxRetries: 3,
          retryPolicy,
        },
        event
      );
      
      await expect(resultPromise).rejects.toThrow(error);
      
      expect(operation).toHaveBeenCalledTimes(1); // No retries
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed, not retrying due to policy'),
        expect.objectContaining({ error })
      );
      
      expect(deadLetterService.sendToDeadLetter).toHaveBeenCalledWith(
        event,
        error,
        expect.objectContaining({ retryCount: 0 })
      );
    });
    
    it('should preserve retry context between attempts', async () => {
      // Fail twice, then succeed
      const operation = jest.fn()
        .mockRejectedValueOnce(new EventProcessingError('NETWORK_ERROR', 'Network error', ErrorCategory.TRANSIENT))
        .mockImplementationOnce((context) => {
          // Check if context is preserved
          expect(context.retryCount).toBe(1);
          expect(context.lastError).toBeDefined();
          expect(context.startTime).toBeDefined();
          return Promise.reject(new EventProcessingError('NETWORK_ERROR', 'Network error', ErrorCategory.TRANSIENT));
        })
        .mockImplementationOnce((context) => {
          // Check if context is updated
          expect(context.retryCount).toBe(2);
          expect(context.lastError).toBeDefined();
          expect(context.startTime).toBeDefined();
          return Promise.resolve('success');
        });
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      const resultPromise = retryUtils.executeWithRetry(operation, {
        baseDelay: 100,
        maxRetries: 3,
        preserveContext: true, // Enable context preservation
      });
      
      // Fast-forward timers after each retry
      jest.advanceTimersByTime(100); // First retry
      jest.advanceTimersByTime(200); // Second retry
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      
      jest.useRealTimers();
    });
  });
  
  describe('retryWithBackoff', () => {
    it('should retry a failed promise with exponential backoff', async () => {
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error(`Attempt ${attempts} failed`));
        }
        return Promise.resolve('success');
      });
      
      const resultPromise = retryUtils.retryWithBackoff(operation, {
        baseDelay: 100,
        maxRetries: 3,
      });
      
      // Fast-forward timers after each retry
      jest.advanceTimersByTime(100); // First retry
      jest.advanceTimersByTime(200); // Second retry
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
    
    it('should handle non-promise returning functions', async () => {
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return 'success';
      });
      
      const resultPromise = retryUtils.retryWithBackoff(operation, {
        baseDelay: 100,
        maxRetries: 3,
      });
      
      // Fast-forward timers after each retry
      jest.advanceTimersByTime(100); // First retry
      jest.advanceTimersByTime(200); // Second retry
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      
      jest.useRealTimers();
    });
  });
  
  describe('integration with dead letter queue', () => {
    it('should send failed events to dead letter queue after max retries', async () => {
      const error = new EventProcessingError('PROCESSING_ERROR', 'Processing error', ErrorCategory.TRANSIENT);
      const operation = jest.fn().mockRejectedValue(error);
      const event = { 
        id: '123', 
        type: 'test.event', 
        data: { value: 'test' },
        metadata: {
          userId: 'user-123',
          timestamp: new Date().toISOString(),
        }
      };
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      const resultPromise = retryUtils.executeWithRetry(
        operation,
        {
          baseDelay: 100,
          maxRetries: 2,
        },
        event
      );
      
      // Fast-forward timers for all retries
      jest.advanceTimersByTime(100); // First retry
      jest.advanceTimersByTime(200); // Second retry
      
      await expect(resultPromise).rejects.toThrow(error);
      
      expect(deadLetterService.sendToDeadLetter).toHaveBeenCalledWith(
        event,
        error,
        expect.objectContaining({ 
          retryCount: 2,
          retryHistory: expect.arrayContaining([
            expect.objectContaining({ attempt: 1, delay: 100, error: expect.any(Error) }),
            expect.objectContaining({ attempt: 2, delay: 200, error: expect.any(Error) }),
          ])
        })
      );
      
      jest.useRealTimers();
    });
    
    it('should include detailed retry context in dead letter message', async () => {
      const error = new EventProcessingError('PROCESSING_ERROR', 'Processing error', ErrorCategory.TRANSIENT);
      const operation = jest.fn().mockRejectedValue(error);
      const event = { id: '123', type: 'test.event', data: {} };
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      const startTime = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => startTime);
      
      const resultPromise = retryUtils.executeWithRetry(
        operation,
        {
          baseDelay: 100,
          maxRetries: 1,
        },
        event
      );
      
      // Fast-forward timer for retry
      jest.advanceTimersByTime(100);
      
      await expect(resultPromise).rejects.toThrow(error);
      
      expect(deadLetterService.sendToDeadLetter).toHaveBeenCalledWith(
        event,
        error,
        expect.objectContaining({ 
          retryCount: 1,
          startTime,
          totalDuration: expect.any(Number),
          lastError: error,
        })
      );
      
      jest.useRealTimers();
      jest.spyOn(global, 'Date').mockRestore();
    });
  });
});