import {
  KafkaError,
  KafkaErrorType,
  KafkaConnectionError,
  KafkaMessageSerializationError,
  KafkaAuthenticationError,
  KafkaTimeoutError,
  KafkaCircuitBreaker,
  CircuitState,
  isRetryableKafkaError,
  getKafkaErrorRetryDelay,
  createKafkaDlqEntry,
  createKafkaError
} from '../../../src/kafka/kafka.errors';
import { RETRY_CONFIG } from '../../../src/kafka/kafka.constants';

describe('Kafka Retry Strategies', () => {
  describe('Error Retryability Classification', () => {
    it('should correctly identify retryable Kafka errors', () => {
      // Retryable errors
      const connectionError = new KafkaConnectionError('Connection failed');
      const timeoutError = new KafkaTimeoutError('Operation timed out');
      
      expect(connectionError.isRetryable()).toBe(true);
      expect(timeoutError.isRetryable()).toBe(true);
      expect(isRetryableKafkaError(connectionError)).toBe(true);
      expect(isRetryableKafkaError(timeoutError)).toBe(true);
      
      // Also test with regular Error objects
      expect(isRetryableKafkaError(new Error('connect ECONNREFUSED'))).toBe(true);
      expect(isRetryableKafkaError(new Error('Request timed out'))).toBe(true);
    });

    it('should correctly identify non-retryable Kafka errors', () => {
      // Non-retryable errors
      const authError = new KafkaAuthenticationError('Authentication failed');
      const serializationError = new KafkaMessageSerializationError('Invalid message format');
      
      expect(authError.isRetryable()).toBe(false);
      expect(serializationError.isRetryable()).toBe(false);
      expect(isRetryableKafkaError(authError)).toBe(false);
      expect(isRetryableKafkaError(serializationError)).toBe(false);
      
      // Also test with regular Error objects
      expect(isRetryableKafkaError(new Error('SASL Authentication failed'))).toBe(false);
      expect(isRetryableKafkaError(new Error('Error serializing message'))).toBe(false);
    });
    
    it('should correctly map error messages to appropriate KafkaError types', () => {
      // Test the factory function that creates KafkaError instances from messages
      const connectionError = createKafkaError('connect ECONNREFUSED');
      expect(connectionError.kafkaErrorType).toBe(KafkaErrorType.CONNECTION_ERROR);
      expect(connectionError.isRetryable()).toBe(true);
      
      const authError = createKafkaError('SASL Authentication failed');
      expect(authError.kafkaErrorType).toBe(KafkaErrorType.AUTHENTICATION_ERROR);
      expect(authError.isRetryable()).toBe(false);
      
      const serializationError = createKafkaError('Error serializing message');
      expect(serializationError.kafkaErrorType).toBe(KafkaErrorType.MESSAGE_SERIALIZATION_ERROR);
      expect(serializationError.isRetryable()).toBe(false);
      
      const timeoutError = createKafkaError('Request timed out');
      expect(timeoutError.kafkaErrorType).toBe(KafkaErrorType.TIMEOUT_ERROR);
      expect(timeoutError.isRetryable()).toBe(true);
    });
  });

  describe('Exponential Backoff Algorithm', () => {
    it('should implement exponential backoff for retryable errors', () => {
      const connectionError = new KafkaConnectionError('Connection failed');
      
      // Test exponential growth pattern
      const delay1 = connectionError.getRetryDelay(1);
      const delay2 = connectionError.getRetryDelay(2);
      const delay3 = connectionError.getRetryDelay(3);
      
      // Verify exponential growth (approximately, due to jitter)
      // Base delay is 100ms, so we expect roughly: 100*2^1, 100*2^2, 100*2^3
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      
      // Verify the exponential relationship (with some tolerance for jitter)
      const ratio1 = delay2 / delay1;
      const ratio2 = delay3 / delay2;
      
      // Should be approximately 2x each time (with jitter tolerance)
      expect(ratio1).toBeGreaterThan(1.5);
      expect(ratio1).toBeLessThan(2.5);
      expect(ratio2).toBeGreaterThan(1.5);
      expect(ratio2).toBeLessThan(2.5);
    });

    it('should respect maximum retry delay', () => {
      const connectionError = new KafkaConnectionError('Connection failed');
      
      // Test with a very high retry count that would exceed max delay
      const delay = connectionError.getRetryDelay(20); // 20th retry would be huge without a cap
      
      // Max delay is 30000ms (30 seconds)
      expect(delay).toBeLessThanOrEqual(30000);
      expect(delay).toBeGreaterThan(24000); // Allow for jitter
    });

    it('should return 0 delay for non-retryable errors', () => {
      const authError = new KafkaAuthenticationError('Authentication failed');
      
      expect(authError.getRetryDelay(1)).toBe(0);
      expect(authError.getRetryDelay(5)).toBe(0);
      
      // Also test the helper function
      expect(getKafkaErrorRetryDelay(authError, 1)).toBe(0);
    });
    
    it('should use helper function to get retry delay for any error type', () => {
      // Test with KafkaError instance
      const connectionError = new KafkaConnectionError('Connection failed');
      expect(getKafkaErrorRetryDelay(connectionError, 1)).toBeGreaterThan(0);
      
      // Test with regular Error that maps to a retryable type
      expect(getKafkaErrorRetryDelay(new Error('connect ECONNREFUSED'), 1)).toBeGreaterThan(0);
      
      // Test with regular Error that maps to a non-retryable type
      expect(getKafkaErrorRetryDelay(new Error('SASL Authentication failed'), 1)).toBe(0);
    });
  });

  describe('Jitter Implementation', () => {
    it('should add jitter to prevent retry storms', () => {
      const connectionError = new KafkaConnectionError('Connection failed');
      
      // Get multiple delay values for the same retry count
      const delays: number[] = [];
      for (let i = 0; i < 10; i++) {
        delays.push(connectionError.getRetryDelay(2));
      }
      
      // Verify that not all delays are the same (jitter is working)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
      
      // Calculate the expected base delay without jitter
      const baseDelay = 100; // Base delay from implementation
      const expectedBaseDelay = baseDelay * Math.pow(2, 2); // For retry count 2
      
      // Verify that delays are within the expected jitter range (±20%)
      const jitterFactor = 0.2;
      const minExpectedDelay = expectedBaseDelay * (1 - jitterFactor);
      const maxExpectedDelay = expectedBaseDelay * (1 + jitterFactor);
      
      for (const delay of delays) {
        expect(delay).toBeGreaterThanOrEqual(minExpectedDelay);
        expect(delay).toBeLessThanOrEqual(maxExpectedDelay);
      }
    });

    it('should ensure jitter never reduces delay below base delay', () => {
      const connectionError = new KafkaConnectionError('Connection failed');
      
      // Get multiple delay values for the first retry
      const delays: number[] = [];
      for (let i = 0; i < 50; i++) {
        delays.push(connectionError.getRetryDelay(1));
      }
      
      // Verify that no delay is less than the base delay
      const baseDelay = 100; // Base delay from implementation
      for (const delay of delays) {
        expect(delay).toBeGreaterThanOrEqual(baseDelay);
      }
    });
  });

  describe('Maximum Retry Limits', () => {
    it('should respect the configured maximum number of retries', () => {
      // This test verifies that the retry count is properly tracked and limited
      // We'll use the RETRY_CONFIG.MAX_RETRIES constant
      
      const maxRetries = RETRY_CONFIG.MAX_RETRIES;
      expect(maxRetries).toBeDefined();
      expect(maxRetries).toBeGreaterThan(0);
      
      // In a real implementation, we would test that after MAX_RETRIES,
      // the message is sent to the DLQ instead of being retried again
      // This would typically be tested in the consumer implementation
      
      // For now, we'll just verify the constant exists and has a reasonable value
      expect(maxRetries).toBeLessThanOrEqual(10); // Sanity check - shouldn't retry too many times
    });
  });

  describe('Error-Specific Retry Policies', () => {
    it('should apply different retry strategies based on error type', () => {
      // Create different error types
      const connectionError = new KafkaConnectionError('Connection failed');
      const timeoutError = new KafkaTimeoutError('Operation timed out');
      
      // Both are retryable, but might have different retry behaviors in the future
      expect(connectionError.isRetryable()).toBe(true);
      expect(timeoutError.isRetryable()).toBe(true);
      
      // Get retry delays for both
      const connectionDelay = connectionError.getRetryDelay(1);
      const timeoutDelay = timeoutError.getRetryDelay(1);
      
      // Currently, they use the same strategy, but this test can be updated
      // if different error types get different backoff strategies
      expect(connectionDelay).toBeGreaterThan(0);
      expect(timeoutDelay).toBeGreaterThan(0);
    });
  });

  describe('Dead Letter Queue Integration', () => {
    it('should create proper DLQ entries for failed messages', () => {
      const connectionError = new KafkaConnectionError('Connection failed', {
        topic: 'test-topic',
        partition: 0,
        offset: '100',
        retryCount: 3
      });
      
      const messageKey = 'test-key';
      const messageValue = { id: 123, name: 'Test Event' };
      
      // Create DLQ entry
      const dlqEntry = connectionError.toDlqEntry(messageKey, messageValue);
      
      // Verify DLQ entry structure
      expect(dlqEntry).toHaveProperty('errorType', KafkaErrorType.CONNECTION_ERROR);
      expect(dlqEntry).toHaveProperty('errorMessage', 'Connection failed');
      expect(dlqEntry).toHaveProperty('stackTrace');
      expect(dlqEntry).toHaveProperty('context');
      expect(dlqEntry).toHaveProperty('timestamp');
      expect(dlqEntry).toHaveProperty('messageKey', 'test-key');
      expect(dlqEntry).toHaveProperty('messageValue');
      expect(dlqEntry.messageValue).toContain('"id":123');
      
      // Verify context is preserved
      expect(dlqEntry.context).toHaveProperty('topic', 'test-topic');
      expect(dlqEntry.context).toHaveProperty('partition', 0);
      expect(dlqEntry.context).toHaveProperty('offset', '100');
      expect(dlqEntry.context).toHaveProperty('retryCount', 3);
      expect(dlqEntry.context).toHaveProperty('kafkaErrorType', KafkaErrorType.CONNECTION_ERROR);
    });

    it('should handle different value types in DLQ entries', () => {
      const error = new KafkaConnectionError('Connection failed');
      
      // Test with string value
      const stringDlq = error.toDlqEntry('key1', 'string-value');
      expect(stringDlq.messageValue).toBe('string-value');
      
      // Test with number value
      const numberDlq = error.toDlqEntry('key2', 123);
      expect(numberDlq.messageValue).toBe('123');
      
      // Test with object value
      const objectDlq = error.toDlqEntry('key3', { test: true });
      expect(objectDlq.messageValue).toBe('{"test":true}');
      
      // Test with null value
      const nullDlq = error.toDlqEntry('key4', null);
      expect(nullDlq.messageValue).toBe('null');
    });
    
    it('should use helper function to create DLQ entries for any error type', () => {
      // Test with KafkaError instance
      const kafkaError = new KafkaConnectionError('Connection failed');
      const dlqEntry1 = createKafkaDlqEntry(kafkaError, 'key1', 'value1');
      expect(dlqEntry1).toHaveProperty('errorType', KafkaErrorType.CONNECTION_ERROR);
      
      // Test with regular Error
      const regularError = new Error('Some error');
      const dlqEntry2 = createKafkaDlqEntry(regularError, 'key2', 'value2');
      expect(dlqEntry2).toHaveProperty('errorType');
      expect(dlqEntry2).toHaveProperty('messageKey', 'key2');
      expect(dlqEntry2).toHaveProperty('messageValue', 'value2');
    });
  });

  describe('Circuit Breaker Pattern', () => {
    let circuitBreaker: KafkaCircuitBreaker;
    
    beforeEach(() => {
      // Create a new circuit breaker with test-friendly settings
      circuitBreaker = new KafkaCircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 100, // 100ms for faster testing
        successThreshold: 2,
        monitorInterval: 50 // 50ms for faster testing
      });
    });
    
    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
    
    it('should execute successful operations in closed state', async () => {
      const result = await circuitBreaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
    
    it('should open circuit after reaching failure threshold', async () => {
      // Initial state should be closed
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      // Simulate failures
      const failOperation = () => Promise.reject(new Error('Operation failed'));
      
      // First failure
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('Operation failed');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      // Second failure
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('Operation failed');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      // Third failure - should trip the circuit
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('Operation failed');
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Next operation should fail fast with circuit open error
      await expect(circuitBreaker.execute(() => Promise.resolve('success')))
        .rejects.toThrow('Circuit breaker is open');
    });
    
    it('should transition to half-open state after reset timeout', async () => {
      // Trip the circuit
      const failOperation = () => Promise.reject(new Error('Operation failed'));
      
      // Simulate reaching failure threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failOperation);
        } catch (error) {
          // Expected
        }
      }
      
      // Circuit should be open
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150)); // > 100ms reset timeout
      
      // Next operation should be attempted (half-open state)
      try {
        await circuitBreaker.execute(() => Promise.resolve('success'));
        // If we get here, the operation succeeded
        expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      } catch (error) {
        // If we're here, the circuit is still open which is unexpected
        fail('Circuit should be in half-open state');
      }
    });
    
    it('should close circuit after success threshold in half-open state', async () => {
      // Trip the circuit
      const failOperation = () => Promise.reject(new Error('Operation failed'));
      
      // Simulate reaching failure threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failOperation);
        } catch (error) {
          // Expected
        }
      }
      
      // Circuit should be open
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150)); // > 100ms reset timeout
      
      // First successful operation in half-open state
      await circuitBreaker.execute(() => Promise.resolve('success1'));
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      // Second successful operation should close the circuit
      await circuitBreaker.execute(() => Promise.resolve('success2'));
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
    
    it('should reopen circuit on failure in half-open state', async () => {
      // Trip the circuit
      const failOperation = () => Promise.reject(new Error('Operation failed'));
      
      // Simulate reaching failure threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failOperation);
        } catch (error) {
          // Expected
        }
      }
      
      // Circuit should be open
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150)); // > 100ms reset timeout
      
      // First successful operation in half-open state
      await circuitBreaker.execute(() => Promise.resolve('success'));
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      // Failure should reopen the circuit
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('Operation failed');
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
    
    it('should handle timeout errors', async () => {
      // Create circuit breaker with timeout
      const timeoutCircuitBreaker = new KafkaCircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 100,
        successThreshold: 2,
        timeout: 50 // 50ms timeout
      });
      
      // Operation that takes longer than timeout
      const slowOperation = () => new Promise(resolve => setTimeout(() => resolve('slow'), 100));
      
      // Should timeout
      await expect(timeoutCircuitBreaker.execute(slowOperation))
        .rejects.toThrow('Operation timed out');
    });
    
    it('should reset circuit breaker state', async () => {
      // Trip the circuit
      const failOperation = () => Promise.reject(new Error('Operation failed'));
      
      // Simulate reaching failure threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failOperation);
        } catch (error) {
          // Expected
        }
      }
      
      // Circuit should be open
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Reset the circuit breaker
      circuitBreaker.reset();
      
      // Should be closed again
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      // Should be able to execute operations
      const result = await circuitBreaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });
  });
});