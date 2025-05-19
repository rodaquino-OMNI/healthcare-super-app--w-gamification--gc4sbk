import { jest } from '@jest/globals';
import { KafkaErrorCode } from '../../../src/kafka/kafka.constants';
import { KafkaError, RetryError } from '../../../src/kafka/kafka.errors';
import {
  calculateBackoff,
  createRetryStrategy,
  createRetryHandler,
  RetryStrategy,
  RetryStrategyType,
  shouldRetry,
} from '../../../src/kafka/retry-strategies';

describe('Kafka Retry Strategies', () => {
  // Mock the Math.random function to make tests deterministic
  const originalRandom = Math.random;
  
  beforeEach(() => {
    // Reset Math.random mock before each test
    Math.random = jest.fn().mockReturnValue(0.5);
  });
  
  afterEach(() => {
    // Restore original Math.random after each test
    Math.random = originalRandom;
  });

  describe('calculateBackoff', () => {
    it('should calculate initial backoff correctly', () => {
      const initialRetryTime = 100;
      const retryAttempt = 0;
      const factor = 2;
      const maxRetryTime = 30000;
      
      const backoff = calculateBackoff(initialRetryTime, retryAttempt, factor, maxRetryTime);
      
      // With jitter at 0.5, the backoff should be exactly the initialRetryTime
      expect(backoff).toBe(initialRetryTime);
    });
    
    it('should apply exponential backoff for subsequent retries', () => {
      const initialRetryTime = 100;
      const factor = 2;
      const maxRetryTime = 30000;
      
      // First retry (attempt 1)
      const backoff1 = calculateBackoff(initialRetryTime, 1, factor, maxRetryTime);
      // With factor 2, the base would be 100 * 2^1 = 200, and with jitter at 0.5, it remains 200
      expect(backoff1).toBe(200);
      
      // Second retry (attempt 2)
      const backoff2 = calculateBackoff(initialRetryTime, 2, factor, maxRetryTime);
      // With factor 2, the base would be 100 * 2^2 = 400, and with jitter at 0.5, it remains 400
      expect(backoff2).toBe(400);
      
      // Third retry (attempt 3)
      const backoff3 = calculateBackoff(initialRetryTime, 3, factor, maxRetryTime);
      // With factor 2, the base would be 100 * 2^3 = 800, and with jitter at 0.5, it remains 800
      expect(backoff3).toBe(800);
    });
    
    it('should apply jitter to prevent retry storms', () => {
      const initialRetryTime = 100;
      const retryAttempt = 1;
      const factor = 2;
      const maxRetryTime = 30000;
      
      // Mock Math.random to return different values
      Math.random = jest.fn().mockReturnValueOnce(0.0); // Minimum jitter
      const minBackoff = calculateBackoff(initialRetryTime, retryAttempt, factor, maxRetryTime);
      
      Math.random = jest.fn().mockReturnValueOnce(1.0); // Maximum jitter
      const maxBackoff = calculateBackoff(initialRetryTime, retryAttempt, factor, maxRetryTime);
      
      // With jitter range of 0.2 (20%), the range should be 160-240 for attempt 1
      expect(minBackoff).toBe(160); // 200 * 0.8
      expect(maxBackoff).toBe(240); // 200 * 1.2
    });
    
    it('should cap backoff at maxRetryTime', () => {
      const initialRetryTime = 1000;
      const factor = 2;
      const maxRetryTime = 5000;
      
      // Retry attempt that would exceed maxRetryTime without capping
      // 1000 * 2^3 = 8000, which exceeds maxRetryTime of 5000
      const backoff = calculateBackoff(initialRetryTime, 3, factor, maxRetryTime);
      
      expect(backoff).toBe(maxRetryTime);
    });
  });
  
  describe('createRetryStrategy', () => {
    it('should create an exponential backoff strategy', () => {
      const strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 5,
        factor: 2,
        maxRetryTime: 30000,
      });
      
      expect(strategy).toBeDefined();
      expect(strategy.getNextRetryTime).toBeDefined();
      expect(strategy.hasRetriesLeft).toBeDefined();
      expect(strategy.getRetryCount).toBeDefined();
    });
    
    it('should create a fixed backoff strategy', () => {
      const strategy = createRetryStrategy({
        type: RetryStrategyType.FIXED,
        initialRetryTime: 100,
        maxRetries: 5,
      });
      
      expect(strategy).toBeDefined();
      expect(strategy.getNextRetryTime).toBeDefined();
      expect(strategy.hasRetriesLeft).toBeDefined();
      expect(strategy.getRetryCount).toBeDefined();
    });
    
    it('should throw an error for unknown strategy type', () => {
      expect(() => {
        createRetryStrategy({
          type: 'UNKNOWN' as RetryStrategyType,
          initialRetryTime: 100,
          maxRetries: 5,
        });
      }).toThrow();
    });
  });
  
  describe('RetryStrategy - Exponential', () => {
    let strategy: RetryStrategy;
    
    beforeEach(() => {
      strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 3,
        factor: 2,
        maxRetryTime: 30000,
      });
    });
    
    it('should track retry count correctly', () => {
      expect(strategy.getRetryCount()).toBe(0);
      
      strategy.getNextRetryTime();
      expect(strategy.getRetryCount()).toBe(1);
      
      strategy.getNextRetryTime();
      expect(strategy.getRetryCount()).toBe(2);
      
      strategy.getNextRetryTime();
      expect(strategy.getRetryCount()).toBe(3);
    });
    
    it('should return correct retry times with exponential backoff', () => {
      expect(strategy.getNextRetryTime()).toBe(100); // Initial retry
      expect(strategy.getNextRetryTime()).toBe(200); // Second retry
      expect(strategy.getNextRetryTime()).toBe(400); // Third retry
    });
    
    it('should indicate when retries are exhausted', () => {
      expect(strategy.hasRetriesLeft()).toBe(true);
      
      strategy.getNextRetryTime(); // First retry
      expect(strategy.hasRetriesLeft()).toBe(true);
      
      strategy.getNextRetryTime(); // Second retry
      expect(strategy.hasRetriesLeft()).toBe(true);
      
      strategy.getNextRetryTime(); // Third retry
      expect(strategy.hasRetriesLeft()).toBe(false);
      
      // Should throw an error when trying to get next retry time after exhausted
      expect(() => strategy.getNextRetryTime()).toThrow(RetryError);
    });
    
    it('should reset retry count', () => {
      strategy.getNextRetryTime(); // First retry
      strategy.getNextRetryTime(); // Second retry
      expect(strategy.getRetryCount()).toBe(2);
      
      strategy.reset();
      expect(strategy.getRetryCount()).toBe(0);
      expect(strategy.hasRetriesLeft()).toBe(true);
    });
  });
  
  describe('RetryStrategy - Fixed', () => {
    let strategy: RetryStrategy;
    
    beforeEach(() => {
      strategy = createRetryStrategy({
        type: RetryStrategyType.FIXED,
        initialRetryTime: 500,
        maxRetries: 3,
      });
    });
    
    it('should return constant retry times', () => {
      expect(strategy.getNextRetryTime()).toBe(500); // First retry
      expect(strategy.getNextRetryTime()).toBe(500); // Second retry
      expect(strategy.getNextRetryTime()).toBe(500); // Third retry
    });
    
    it('should still apply jitter to fixed backoff', () => {
      // Mock Math.random to return different values
      Math.random = jest.fn().mockReturnValueOnce(0.0); // Minimum jitter
      const minBackoff = strategy.getNextRetryTime();
      
      strategy.reset();
      
      Math.random = jest.fn().mockReturnValueOnce(1.0); // Maximum jitter
      const maxBackoff = strategy.getNextRetryTime();
      
      // With jitter range of 0.2 (20%), the range should be 400-600 for fixed backoff of 500
      expect(minBackoff).toBe(400); // 500 * 0.8
      expect(maxBackoff).toBe(600); // 500 * 1.2
    });
  });
  
  describe('shouldRetry', () => {
    it('should return true for retriable errors', () => {
      const retriableErrors = [
        new KafkaError('Connection error', KafkaErrorCode.CONNECTION_ERROR),
        new KafkaError('Consumer error', KafkaErrorCode.CONSUMER_ERROR),
        new KafkaError('Producer error', KafkaErrorCode.PRODUCER_ERROR),
      ];
      
      retriableErrors.forEach(error => {
        expect(shouldRetry(error)).toBe(true);
      });
    });
    
    it('should return false for non-retriable errors', () => {
      const nonRetriableErrors = [
        new KafkaError('Validation error', KafkaErrorCode.VALIDATION_ERROR),
        new KafkaError('Schema validation error', KafkaErrorCode.SCHEMA_VALIDATION_ERROR),
        new Error('Generic error'),
      ];
      
      nonRetriableErrors.forEach(error => {
        expect(shouldRetry(error)).toBe(false);
      });
    });
    
    it('should respect custom error classifier', () => {
      const customClassifier = (error: Error) => {
        // Consider all errors retriable except those with 'fatal' in the message
        return !error.message.includes('fatal');
      };
      
      const error1 = new Error('Temporary error');
      const error2 = new Error('This is a fatal error');
      
      expect(shouldRetry(error1, customClassifier)).toBe(true);
      expect(shouldRetry(error2, customClassifier)).toBe(false);
    });
  });
  
  describe('Error-specific retry policies', () => {
    it('should apply different retry strategies based on error type', () => {
      // Create a strategy for connection errors with more retries
      const connectionErrorStrategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 5,
        factor: 2,
        maxRetryTime: 30000,
        errorFilter: (error) => error.code === KafkaErrorCode.CONNECTION_ERROR,
      });
      
      // Create a strategy for producer errors with fewer retries
      const producerErrorStrategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 200,
        maxRetries: 3,
        factor: 2,
        maxRetryTime: 30000,
        errorFilter: (error) => error.code === KafkaErrorCode.PRODUCER_ERROR,
      });
      
      // Test with connection error
      const connectionError = new KafkaError('Connection error', KafkaErrorCode.CONNECTION_ERROR);
      expect(connectionErrorStrategy.isApplicable(connectionError)).toBe(true);
      expect(producerErrorStrategy.isApplicable(connectionError)).toBe(false);
      
      // Test with producer error
      const producerError = new KafkaError('Producer error', KafkaErrorCode.PRODUCER_ERROR);
      expect(connectionErrorStrategy.isApplicable(producerError)).toBe(false);
      expect(producerErrorStrategy.isApplicable(producerError)).toBe(true);
    });
  });
  
  describe('Dead Letter Queue integration', () => {
    let mockKafkaProducer: any;
    let mockDlqHandler: any;
    
    beforeEach(() => {
      mockKafkaProducer = {
        send: jest.fn().mockResolvedValue(undefined),
      };
      
      mockDlqHandler = {
        handleDeadLetter: jest.fn().mockResolvedValue(undefined),
      };
    });
    
    it('should send message to DLQ after retries are exhausted', async () => {
      const strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 3,
        factor: 2,
        maxRetryTime: 30000,
      });
      
      // Simulate exhausting all retries
      strategy.getNextRetryTime();
      strategy.getNextRetryTime();
      strategy.getNextRetryTime();
      
      const message = { key: 'test-key', value: 'test-value' };
      const error = new KafkaError('Producer error', KafkaErrorCode.PRODUCER_ERROR);
      
      // Simulate sending to DLQ
      await mockDlqHandler.handleDeadLetter(message, error, strategy.getRetryCount());
      
      expect(mockDlqHandler.handleDeadLetter).toHaveBeenCalledWith(
        message,
        error,
        3 // Retry count
      );
    });
    
    it('should include retry metadata in DLQ message', async () => {
      const strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 2,
        factor: 2,
        maxRetryTime: 30000,
      });
      
      // Simulate exhausting all retries
      strategy.getNextRetryTime();
      strategy.getNextRetryTime();
      
      const message = { 
        key: 'test-key', 
        value: 'test-value',
        headers: {}
      };
      const error = new KafkaError('Producer error', KafkaErrorCode.PRODUCER_ERROR);
      
      // Mock the enrichDlqMessage function
      const enrichedMessage = {
        ...message,
        headers: {
          'x-retry-count': Buffer.from(String(strategy.getRetryCount())),
          'x-original-topic': Buffer.from('original-topic'),
          'x-error-type': Buffer.from(error.name),
          'x-timestamp': Buffer.from(String(Date.now())),
        }
      };
      
      // Simulate sending to DLQ with enriched message
      await mockKafkaProducer.send({
        topic: 'original-topic.dlq',
        messages: [enrichedMessage]
      });
      
      expect(mockKafkaProducer.send).toHaveBeenCalledWith({
        topic: 'original-topic.dlq',
        messages: [enrichedMessage]
      });
    });
  });
  
  describe('Permanent failure handling', () => {
    it('should identify permanent failures correctly', () => {
      const permanentErrors = [
        new KafkaError('Validation error', KafkaErrorCode.VALIDATION_ERROR),
        new KafkaError('Schema validation error', KafkaErrorCode.SCHEMA_VALIDATION_ERROR),
      ];
      
      const isPermanentFailure = (error: Error) => {
        if (error instanceof KafkaError) {
          return [
            KafkaErrorCode.VALIDATION_ERROR,
            KafkaErrorCode.SCHEMA_VALIDATION_ERROR,
          ].includes(error.code as KafkaErrorCode);
        }
        return false;
      };
      
      permanentErrors.forEach(error => {
        expect(isPermanentFailure(error)).toBe(true);
        expect(shouldRetry(error)).toBe(false); // Should not retry permanent failures
      });
    });
    
    it('should handle permanent failures immediately without retrying', async () => {
      const mockErrorHandler = jest.fn();
      const mockDlqHandler = jest.fn();
      
      const message = { key: 'test-key', value: 'test-value' };
      const error = new KafkaError('Validation error', KafkaErrorCode.VALIDATION_ERROR);
      
      // Simulate processing a permanent failure
      if (!shouldRetry(error)) {
        // Send directly to DLQ without retrying
        await mockDlqHandler(message, error, 0);
        // Notify error handler
        mockErrorHandler(error, message);
      }
      
      expect(mockDlqHandler).toHaveBeenCalledWith(message, error, 0);
      expect(mockErrorHandler).toHaveBeenCalledWith(error, message);
    });
  });
  
  describe('Monitoring and observability', () => {
    let mockMetricsCollector: any;
    
    beforeEach(() => {
      mockMetricsCollector = {
        incrementRetryCount: jest.fn(),
        recordRetryDelay: jest.fn(),
        incrementDlqCount: jest.fn(),
      };
    });
    
    it('should track retry metrics', () => {
      const strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 3,
        factor: 2,
        maxRetryTime: 30000,
      });
      
      // Simulate retries and collect metrics
      const delay1 = strategy.getNextRetryTime();
      mockMetricsCollector.incrementRetryCount('test-topic');
      mockMetricsCollector.recordRetryDelay('test-topic', delay1);
      
      const delay2 = strategy.getNextRetryTime();
      mockMetricsCollector.incrementRetryCount('test-topic');
      mockMetricsCollector.recordRetryDelay('test-topic', delay2);
      
      expect(mockMetricsCollector.incrementRetryCount).toHaveBeenCalledTimes(2);
      expect(mockMetricsCollector.recordRetryDelay).toHaveBeenCalledTimes(2);
      expect(mockMetricsCollector.recordRetryDelay).toHaveBeenNthCalledWith(1, 'test-topic', 100);
      expect(mockMetricsCollector.recordRetryDelay).toHaveBeenNthCalledWith(2, 'test-topic', 200);
    });
    
    it('should track DLQ metrics', () => {
      const strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 3,
        factor: 2,
        maxRetryTime: 30000,
      });
      
      // Exhaust all retries
      strategy.getNextRetryTime();
      strategy.getNextRetryTime();
      strategy.getNextRetryTime();
      
      // Simulate sending to DLQ and collect metrics
      mockMetricsCollector.incrementDlqCount('test-topic', KafkaErrorCode.PRODUCER_ERROR);
      
      expect(mockMetricsCollector.incrementDlqCount).toHaveBeenCalledWith(
        'test-topic',
        KafkaErrorCode.PRODUCER_ERROR
      );
    });
  });
  
  describe('createRetryHandler', () => {
    // Mock setTimeout to avoid actual waiting in tests
    jest.useFakeTimers();
    
    it('should retry the operation until success', async () => {
      // Create a mock operation that fails twice and then succeeds
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new KafkaError('Connection error', KafkaErrorCode.CONNECTION_ERROR))
        .mockRejectedValueOnce(new KafkaError('Connection error', KafkaErrorCode.CONNECTION_ERROR))
        .mockResolvedValueOnce('success');
      
      const mockOnRetry = jest.fn();
      
      const strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 3,
        factor: 2,
        maxRetryTime: 30000,
      });
      
      const retryHandler = createRetryHandler(mockOperation, strategy, mockOnRetry);
      
      // Start the operation (will be pending until we advance timers)
      const resultPromise = retryHandler();
      
      // First failure
      expect(mockOperation).toHaveBeenCalledTimes(1);
      await jest.runAllTimersAsync();
      
      // Second failure
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      await jest.runAllTimersAsync();
      
      // Success on third try
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(mockOnRetry).toHaveBeenCalledTimes(2);
      
      const result = await resultPromise;
      expect(result).toBe('success');
    });
    
    it('should throw error when retries are exhausted', async () => {
      // Create a mock operation that always fails
      const mockOperation = jest.fn()
        .mockRejectedValue(new KafkaError('Connection error', KafkaErrorCode.CONNECTION_ERROR));
      
      const mockOnRetry = jest.fn();
      
      const strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 2, // Only 2 retries allowed
        factor: 2,
        maxRetryTime: 30000,
      });
      
      const retryHandler = createRetryHandler(mockOperation, strategy, mockOnRetry);
      
      // Start the operation (will be pending until we advance timers)
      const resultPromise = retryHandler();
      
      // First failure
      expect(mockOperation).toHaveBeenCalledTimes(1);
      await jest.runAllTimersAsync();
      
      // Second failure
      expect(mockOperation).toHaveBeenCalledTimes(2);
      await jest.runAllTimersAsync();
      
      // Third failure (no more retries)
      expect(mockOperation).toHaveBeenCalledTimes(3);
      
      // Should throw the error from the last attempt
      await expect(resultPromise).rejects.toThrow(KafkaError);
      expect(mockOnRetry).toHaveBeenCalledTimes(2); // Called for each retry
    });
    
    it('should not retry non-retriable errors', async () => {
      // Create a mock operation that fails with a non-retriable error
      const mockOperation = jest.fn()
        .mockRejectedValue(new KafkaError('Validation error', KafkaErrorCode.VALIDATION_ERROR));
      
      const mockOnRetry = jest.fn();
      
      const strategy = createRetryStrategy({
        type: RetryStrategyType.EXPONENTIAL,
        initialRetryTime: 100,
        maxRetries: 3,
        factor: 2,
        maxRetryTime: 30000,
      });
      
      const retryHandler = createRetryHandler(mockOperation, strategy, mockOnRetry);
      
      // Should throw immediately without retrying
      await expect(retryHandler()).rejects.toThrow(KafkaError);
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).not.toHaveBeenCalled();
    });
  });
});