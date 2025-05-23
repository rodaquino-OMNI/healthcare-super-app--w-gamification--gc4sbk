import { ErrorCategory, JourneyType } from '@austa/errors';
import {
  KafkaError,
  KafkaErrorType,
  KafkaConnectionError,
  KafkaBrokerUnavailableError,
  KafkaAuthenticationError,
  KafkaAuthorizationError,
  KafkaProducerError,
  KafkaMessageSerializationError,
  KafkaTopicAuthorizationError,
  KafkaTopicNotFoundError,
  KafkaConsumerError,
  KafkaMessageDeserializationError,
  KafkaOffsetOutOfRangeError,
  KafkaGroupAuthorizationError,
  KafkaRebalanceError,
  KafkaAdminError,
  KafkaClusterAuthorizationError,
  KafkaTimeoutError,
  KafkaUnknownError,
  KafkaCircuitBreaker,
  CircuitState,
  createKafkaError,
  isRetryableKafkaError,
  getKafkaErrorRetryDelay,
  createKafkaDlqEntry,
  KAFKA_ERROR_CATEGORY_MAP,
  RETRYABLE_KAFKA_ERRORS,
  KafkaErrorContext
} from '../../../src/kafka/kafka.errors';

describe('Kafka Error Handling', () => {
  describe('KafkaError Base Class', () => {
    it('should create a KafkaError with the correct properties', () => {
      const message = 'Test error message';
      const errorType = KafkaErrorType.CONNECTION_ERROR;
      const context: KafkaErrorContext = {
        topic: 'test-topic',
        partition: 0,
        clientId: 'test-client'
      };
      
      const error = new KafkaError(message, errorType, context);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.message).toBe(message);
      expect(error.kafkaErrorType).toBe(errorType);
      expect(error.context).toEqual(expect.objectContaining({
        kafkaErrorType: errorType,
        topic: 'test-topic',
        partition: 0,
        clientId: 'test-client'
      }));
      expect(error.name).toBe('KafkaError');
    });

    it('should correctly map error types to error categories', () => {
      // Test a few representative error types
      const connectionError = new KafkaError('Connection error', KafkaErrorType.CONNECTION_ERROR);
      const authError = new KafkaError('Auth error', KafkaErrorType.AUTHENTICATION_ERROR);
      const serializationError = new KafkaError('Serialization error', KafkaErrorType.MESSAGE_SERIALIZATION_ERROR);
      
      expect(connectionError.getErrorCategory()).toBe(ErrorCategory.TRANSIENT);
      expect(authError.getErrorCategory()).toBe(ErrorCategory.SYSTEM);
      expect(serializationError.getErrorCategory()).toBe(ErrorCategory.CLIENT);
    });

    it('should correctly identify retryable errors', () => {
      const retryableError = new KafkaError('Retryable error', KafkaErrorType.CONNECTION_ERROR);
      const nonRetryableError = new KafkaError('Non-retryable error', KafkaErrorType.AUTHENTICATION_ERROR);
      
      expect(retryableError.isRetryable()).toBe(true);
      expect(nonRetryableError.isRetryable()).toBe(false);
    });

    it('should calculate retry delay with exponential backoff', () => {
      const error = new KafkaError('Retryable error', KafkaErrorType.CONNECTION_ERROR);
      
      // Test increasing retry counts
      const delay1 = error.getRetryDelay(1);
      const delay2 = error.getRetryDelay(2);
      const delay3 = error.getRetryDelay(3);
      
      // Verify exponential growth
      expect(delay1).toBeGreaterThan(0);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      
      // Verify non-retryable errors return 0 delay
      const nonRetryableError = new KafkaError('Non-retryable error', KafkaErrorType.AUTHENTICATION_ERROR);
      expect(nonRetryableError.getRetryDelay(1)).toBe(0);
    });

    it('should create a valid DLQ entry', () => {
      const error = new KafkaError('Test error', KafkaErrorType.CONNECTION_ERROR, {
        topic: 'test-topic',
        clientId: 'test-client'
      });
      
      const messageKey = 'test-key';
      const messageValue = { data: 'test-data' };
      
      const dlqEntry = error.toDlqEntry(messageKey, messageValue);
      
      expect(dlqEntry).toEqual(expect.objectContaining({
        errorType: KafkaErrorType.CONNECTION_ERROR,
        errorCategory: ErrorCategory.TRANSIENT,
        errorMessage: 'Test error',
        context: expect.objectContaining({
          kafkaErrorType: KafkaErrorType.CONNECTION_ERROR,
          topic: 'test-topic',
          clientId: 'test-client'
        }),
        messageKey: 'test-key',
        messageValue: JSON.stringify(messageValue),
        timestamp: expect.any(String)
      }));
    });
  });

  describe('Specific Kafka Error Classes', () => {
    it('should create connection-related error classes with correct types', () => {
      const connectionError = new KafkaConnectionError('Connection error');
      const brokerError = new KafkaBrokerUnavailableError('Broker unavailable');
      const authError = new KafkaAuthenticationError('Authentication failed');
      const authzError = new KafkaAuthorizationError('Authorization failed');
      
      expect(connectionError.kafkaErrorType).toBe(KafkaErrorType.CONNECTION_ERROR);
      expect(brokerError.kafkaErrorType).toBe(KafkaErrorType.BROKER_UNAVAILABLE);
      expect(authError.kafkaErrorType).toBe(KafkaErrorType.AUTHENTICATION_ERROR);
      expect(authzError.kafkaErrorType).toBe(KafkaErrorType.AUTHORIZATION_ERROR);
    });

    it('should create producer-related error classes with correct types', () => {
      const producerError = new KafkaProducerError('Producer error');
      const serializationError = new KafkaMessageSerializationError('Serialization error');
      const topicAuthError = new KafkaTopicAuthorizationError('Topic authorization failed');
      const topicNotFoundError = new KafkaTopicNotFoundError('Topic not found');
      
      expect(producerError.kafkaErrorType).toBe(KafkaErrorType.PRODUCER_ERROR);
      expect(serializationError.kafkaErrorType).toBe(KafkaErrorType.MESSAGE_SERIALIZATION_ERROR);
      expect(topicAuthError.kafkaErrorType).toBe(KafkaErrorType.TOPIC_AUTHORIZATION_ERROR);
      expect(topicNotFoundError.kafkaErrorType).toBe(KafkaErrorType.TOPIC_NOT_FOUND);
    });

    it('should create consumer-related error classes with correct types', () => {
      const consumerError = new KafkaConsumerError('Consumer error');
      const deserializationError = new KafkaMessageDeserializationError('Deserialization error');
      const offsetError = new KafkaOffsetOutOfRangeError('Offset out of range');
      const groupAuthError = new KafkaGroupAuthorizationError('Group authorization failed');
      const rebalanceError = new KafkaRebalanceError('Rebalance error');
      
      expect(consumerError.kafkaErrorType).toBe(KafkaErrorType.CONSUMER_ERROR);
      expect(deserializationError.kafkaErrorType).toBe(KafkaErrorType.MESSAGE_DESERIALIZATION_ERROR);
      expect(offsetError.kafkaErrorType).toBe(KafkaErrorType.OFFSET_OUT_OF_RANGE);
      expect(groupAuthError.kafkaErrorType).toBe(KafkaErrorType.GROUP_AUTHORIZATION_ERROR);
      expect(rebalanceError.kafkaErrorType).toBe(KafkaErrorType.REBALANCE_ERROR);
    });

    it('should create admin-related error classes with correct types', () => {
      const adminError = new KafkaAdminError('Admin error');
      const clusterAuthError = new KafkaClusterAuthorizationError('Cluster authorization failed');
      
      expect(adminError.kafkaErrorType).toBe(KafkaErrorType.ADMIN_ERROR);
      expect(clusterAuthError.kafkaErrorType).toBe(KafkaErrorType.CLUSTER_AUTHORIZATION_ERROR);
    });

    it('should create generic error classes with correct types', () => {
      const timeoutError = new KafkaTimeoutError('Timeout error');
      const unknownError = new KafkaUnknownError('Unknown error');
      
      expect(timeoutError.kafkaErrorType).toBe(KafkaErrorType.TIMEOUT_ERROR);
      expect(unknownError.kafkaErrorType).toBe(KafkaErrorType.UNKNOWN_ERROR);
    });
  });

  describe('Error Context Enrichment', () => {
    it('should enrich error context with operation details', () => {
      const context: KafkaErrorContext = {
        topic: 'health-metrics',
        partition: 3,
        offset: '1000',
        groupId: 'health-consumer-group',
        clientId: 'health-service-client',
        correlationId: 'corr-123',
        retryCount: 2,
        broker: 'kafka-broker-1:9092',
        journey: JourneyType.HEALTH,
        operation: 'publishHealthMetric',
        component: 'HealthMetricsProducer'
      };
      
      const error = new KafkaProducerError('Failed to publish health metric', context);
      
      expect(error.context).toEqual(expect.objectContaining({
        kafkaErrorType: KafkaErrorType.PRODUCER_ERROR,
        topic: 'health-metrics',
        partition: 3,
        offset: '1000',
        groupId: 'health-consumer-group',
        clientId: 'health-service-client',
        correlationId: 'corr-123',
        retryCount: 2,
        broker: 'kafka-broker-1:9092',
        journey: JourneyType.HEALTH,
        operation: 'publishHealthMetric',
        component: 'HealthMetricsProducer'
      }));
    });

    it('should include original message in error context when provided', () => {
      const originalMessage = {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify({ data: 'test-data' })),
        headers: { correlationId: Buffer.from('corr-123') },
        timestamp: '1621234567890',
        offset: '1000',
        partition: 3,
        topic: 'health-metrics'
      };
      
      const context: KafkaErrorContext = {
        originalMessage,
        operation: 'consumeHealthMetric'
      };
      
      const error = new KafkaConsumerError('Failed to process health metric', context);
      
      expect(error.context.originalMessage).toEqual(originalMessage);
    });
  });

  describe('Retry Policy Integration', () => {
    it('should correctly identify retryable Kafka error types', () => {
      // Test all error types defined as retryable
      for (const errorType of RETRYABLE_KAFKA_ERRORS) {
        const error = new KafkaError('Test error', errorType);
        expect(error.isRetryable()).toBe(true);
      }
      
      // Test a few non-retryable error types
      const nonRetryableTypes = [
        KafkaErrorType.AUTHENTICATION_ERROR,
        KafkaErrorType.AUTHORIZATION_ERROR,
        KafkaErrorType.MESSAGE_SERIALIZATION_ERROR,
        KafkaErrorType.TOPIC_NOT_FOUND
      ];
      
      for (const errorType of nonRetryableTypes) {
        const error = new KafkaError('Test error', errorType);
        expect(error.isRetryable()).toBe(false);
      }
    });

    it('should calculate appropriate retry delays based on retry count', () => {
      const error = new KafkaConnectionError('Connection error');
      
      // Test retry delays for multiple attempts
      const delays = [];
      for (let i = 1; i <= 5; i++) {
        delays.push(error.getRetryDelay(i));
      }
      
      // Verify exponential growth pattern
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i-1]);
      }
      
      // Verify maximum delay cap
      const maxDelay = error.getRetryDelay(15); // Very high retry count
      expect(maxDelay).toBeLessThanOrEqual(30000); // 30 seconds max
    });

    it('should integrate with helper functions for retry handling', () => {
      // Test isRetryableKafkaError helper
      const retryableError = new KafkaConnectionError('Connection error');
      const nonRetryableError = new KafkaAuthenticationError('Auth error');
      const regularError = new Error('Regular error');
      
      expect(isRetryableKafkaError(retryableError)).toBe(true);
      expect(isRetryableKafkaError(nonRetryableError)).toBe(false);
      expect(isRetryableKafkaError(regularError)).toBe(false); // Should create a KafkaUnknownError internally
      
      // Test getKafkaErrorRetryDelay helper
      expect(getKafkaErrorRetryDelay(retryableError, 1)).toBeGreaterThan(0);
      expect(getKafkaErrorRetryDelay(nonRetryableError, 1)).toBe(0);
      expect(getKafkaErrorRetryDelay(regularError, 1)).toBe(0); // Non-retryable by default
    });
  });

  describe('Circuit Breaker Pattern', () => {
    let circuitBreaker: KafkaCircuitBreaker;
    
    beforeEach(() => {
      // Create a circuit breaker with test-friendly settings
      circuitBreaker = new KafkaCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100, // 100ms for faster testing
        successThreshold: 1
      });
    });
    
    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to open state after failures exceed threshold', async () => {
      // Mock functions for success and failure
      const successFn = jest.fn().mockResolvedValue('success');
      const failureFn = jest.fn().mockRejectedValue(new KafkaConnectionError('Connection error'));
      
      // First execution should succeed
      await expect(circuitBreaker.execute(successFn)).resolves.toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      // Two consecutive failures should open the circuit
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow('Connection error');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED); // Still closed after first failure
      
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow('Connection error');
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN); // Open after second failure
      
      // Further calls should fail fast without executing the function
      await expect(circuitBreaker.execute(successFn)).rejects.toThrow('Circuit breaker is open');
      expect(successFn).toHaveBeenCalledTimes(1); // Not called again after circuit opened
    });

    it('should transition to half-open state after reset timeout', async () => {
      // Force circuit to open state
      const failureFn = jest.fn().mockRejectedValue(new KafkaConnectionError('Connection error'));
      
      // Two failures to open the circuit
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150)); // 150ms > 100ms reset timeout
      
      // Next call should put circuit in half-open state
      const successFn = jest.fn().mockResolvedValue('success');
      await expect(circuitBreaker.execute(successFn)).resolves.toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED); // Success in half-open closes the circuit
    });

    it('should transition back to open state on failure in half-open state', async () => {
      // Force circuit to open state
      const failureFn = jest.fn().mockRejectedValue(new KafkaConnectionError('Connection error'));
      
      // Two failures to open the circuit
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Failure in half-open state should reopen the circuit
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should handle timeout errors correctly', async () => {
      // Create circuit breaker with timeout
      const timeoutCircuitBreaker = new KafkaCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100,
        successThreshold: 1,
        timeout: 50 // 50ms timeout
      });
      
      // Function that takes longer than the timeout
      const slowFn = jest.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve('slow'), 100));
      });
      
      // Should timeout and throw KafkaTimeoutError
      await expect(timeoutCircuitBreaker.execute(slowFn)).rejects.toThrow('Operation timed out');
      expect(timeoutCircuitBreaker.getState()).toBe(CircuitState.CLOSED); // Still closed after first failure
      
      // Second timeout should open the circuit
      await expect(timeoutCircuitBreaker.execute(slowFn)).rejects.toThrow('Operation timed out');
      expect(timeoutCircuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reset circuit breaker state', async () => {
      // Force circuit to open state
      const failureFn = jest.fn().mockRejectedValue(new KafkaConnectionError('Connection error'));
      
      // Two failures to open the circuit
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(failureFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Reset the circuit breaker
      circuitBreaker.reset();
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      // Should be able to execute successfully again
      const successFn = jest.fn().mockResolvedValue('success');
      await expect(circuitBreaker.execute(successFn)).resolves.toBe('success');
    });
  });

  describe('Error Factory and Helper Functions', () => {
    it('should create appropriate error types based on error messages', () => {
      // Test connection errors
      expect(createKafkaError('connect ECONNREFUSED')).toBeInstanceOf(KafkaConnectionError);
      expect(createKafkaError('Broker not available')).toBeInstanceOf(KafkaBrokerUnavailableError);
      expect(createKafkaError('SASL Authentication failed')).toBeInstanceOf(KafkaAuthenticationError);
      expect(createKafkaError('not authorized')).toBeInstanceOf(KafkaAuthorizationError);
      
      // Test producer errors
      expect(createKafkaError('Failed to produce message')).toBeInstanceOf(KafkaProducerError);
      expect(createKafkaError('Invalid message format')).toBeInstanceOf(KafkaMessageSerializationError);
      expect(createKafkaError('Topic authorization failed')).toBeInstanceOf(KafkaTopicAuthorizationError);
      expect(createKafkaError('This server does not host this topic-partition')).toBeInstanceOf(KafkaTopicNotFoundError);
      
      // Test consumer errors
      expect(createKafkaError('Consumer error')).toBeInstanceOf(KafkaConsumerError);
      expect(createKafkaError('Error deserializing message')).toBeInstanceOf(KafkaMessageDeserializationError);
      expect(createKafkaError('Offset out of range')).toBeInstanceOf(KafkaOffsetOutOfRangeError);
      expect(createKafkaError('Group authorization failed')).toBeInstanceOf(KafkaGroupAuthorizationError);
      expect(createKafkaError('Rebalance')).toBeInstanceOf(KafkaRebalanceError);
      
      // Test admin errors
      expect(createKafkaError('Admin operation failed')).toBeInstanceOf(KafkaAdminError);
      expect(createKafkaError('Cluster authorization failed')).toBeInstanceOf(KafkaClusterAuthorizationError);
      
      // Test generic errors
      expect(createKafkaError('Request timed out')).toBeInstanceOf(KafkaTimeoutError);
      expect(createKafkaError('Unknown error type')).toBeInstanceOf(KafkaUnknownError);
    });

    it('should create error with context when provided', () => {
      const context: KafkaErrorContext = {
        topic: 'test-topic',
        clientId: 'test-client',
        journey: JourneyType.CARE
      };
      
      const error = createKafkaError('Connection error', context);
      
      expect(error.context).toEqual(expect.objectContaining({
        kafkaErrorType: expect.any(String),
        topic: 'test-topic',
        clientId: 'test-client',
        journey: JourneyType.CARE
      }));
    });

    it('should create error from existing Error object', () => {
      const originalError = new Error('Original error: connect ECONNREFUSED');
      const kafkaError = createKafkaError(originalError);
      
      expect(kafkaError).toBeInstanceOf(KafkaConnectionError);
      expect(kafkaError.message).toBe('Original error: connect ECONNREFUSED');
      expect(kafkaError.cause).toBe(originalError);
    });

    it('should create DLQ entry from any error type', () => {
      // From KafkaError
      const kafkaError = new KafkaConnectionError('Connection error', {
        topic: 'test-topic',
        clientId: 'test-client'
      });
      
      const kafkaDlqEntry = createKafkaDlqEntry(kafkaError, 'key1', { value: 'test1' });
      
      expect(kafkaDlqEntry).toEqual(expect.objectContaining({
        errorType: KafkaErrorType.CONNECTION_ERROR,
        errorCategory: ErrorCategory.TRANSIENT,
        errorMessage: 'Connection error',
        messageKey: 'key1',
        messageValue: expect.any(String)
      }));
      
      // From regular Error
      const regularError = new Error('Regular error');
      const regularDlqEntry = createKafkaDlqEntry(
        regularError, 
        'key2', 
        { value: 'test2' },
        { topic: 'error-topic' }
      );
      
      expect(regularDlqEntry).toEqual(expect.objectContaining({
        errorType: KafkaErrorType.UNKNOWN_ERROR,
        errorCategory: ErrorCategory.SYSTEM,
        errorMessage: 'Regular error',
        messageKey: 'key2',
        messageValue: expect.any(String),
        context: expect.objectContaining({
          topic: 'error-topic'
        })
      }));
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it('should handle health journey specific errors with appropriate context', () => {
      const healthContext: KafkaErrorContext = {
        topic: 'health-metrics',
        journey: JourneyType.HEALTH,
        operation: 'publishHealthMetric',
        component: 'HealthMetricsProducer',
        metadata: {
          metricType: 'HEART_RATE',
          userId: 'user-123',
          deviceId: 'device-456'
        }
      };
      
      const error = new KafkaProducerError('Failed to publish health metric', healthContext);
      
      expect(error.context.journey).toBe(JourneyType.HEALTH);
      expect(error.context.metadata).toEqual(expect.objectContaining({
        metricType: 'HEART_RATE',
        userId: 'user-123',
        deviceId: 'device-456'
      }));
      
      // Create DLQ entry with journey context
      const dlqEntry = error.toDlqEntry('health-key', { heartRate: 75 });
      expect(dlqEntry.context.journey).toBe(JourneyType.HEALTH);
      expect(dlqEntry.context.metadata.metricType).toBe('HEART_RATE');
    });

    it('should handle care journey specific errors with appropriate context', () => {
      const careContext: KafkaErrorContext = {
        topic: 'appointment-events',
        journey: JourneyType.CARE,
        operation: 'publishAppointmentCreated',
        component: 'AppointmentProducer',
        metadata: {
          appointmentId: 'appt-123',
          providerId: 'provider-456',
          patientId: 'patient-789',
          appointmentType: 'TELEMEDICINE'
        }
      };
      
      const error = new KafkaProducerError('Failed to publish appointment event', careContext);
      
      expect(error.context.journey).toBe(JourneyType.CARE);
      expect(error.context.metadata).toEqual(expect.objectContaining({
        appointmentId: 'appt-123',
        providerId: 'provider-456',
        patientId: 'patient-789',
        appointmentType: 'TELEMEDICINE'
      }));
      
      // Create DLQ entry with journey context
      const dlqEntry = error.toDlqEntry('appointment-key', { status: 'SCHEDULED' });
      expect(dlqEntry.context.journey).toBe(JourneyType.CARE);
      expect(dlqEntry.context.metadata.appointmentId).toBe('appt-123');
    });

    it('should handle plan journey specific errors with appropriate context', () => {
      const planContext: KafkaErrorContext = {
        topic: 'claim-events',
        journey: JourneyType.PLAN,
        operation: 'publishClaimSubmitted',
        component: 'ClaimProducer',
        metadata: {
          claimId: 'claim-123',
          memberId: 'member-456',
          planId: 'plan-789',
          claimAmount: 150.75,
          claimType: 'MEDICAL'
        }
      };
      
      const error = new KafkaProducerError('Failed to publish claim event', planContext);
      
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.metadata).toEqual(expect.objectContaining({
        claimId: 'claim-123',
        memberId: 'member-456',
        planId: 'plan-789',
        claimAmount: 150.75,
        claimType: 'MEDICAL'
      }));
      
      // Create DLQ entry with journey context
      const dlqEntry = error.toDlqEntry('claim-key', { status: 'SUBMITTED' });
      expect(dlqEntry.context.journey).toBe(JourneyType.PLAN);
      expect(dlqEntry.context.metadata.claimId).toBe('claim-123');
    });
  });
});