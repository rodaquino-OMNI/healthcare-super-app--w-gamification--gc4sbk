/**
 * @file Unit tests for Kafka error handling classes and utilities
 * @description Verifies proper error classification, retry policy integration, circuit breaker functionality, and error propagation
 */

import {
  KafkaError,
  KafkaConnectionError,
  KafkaProducerError,
  KafkaConsumerError,
  KafkaSerializationError,
  EventValidationError,
  DeadLetterQueueError,
  RetryError,
  SchemaValidationError,
  BatchOperationError,
} from '../../../src/kafka/kafka.errors';
import { KafkaErrorCode } from '../../../src/kafka/kafka.constants';

describe('Kafka Error Classes', () => {
  describe('Base KafkaError', () => {
    it('should create a base error with default values', () => {
      const error = new KafkaError('Test error message', KafkaErrorCode.UNKNOWN_ERROR);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('KafkaError');
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe(KafkaErrorCode.UNKNOWN_ERROR);
      expect(error.context).toEqual({});
      expect(error.originalError).toBeUndefined();
    });

    it('should create a base error with context', () => {
      const context = { topic: 'test-topic', partition: 0 };
      const error = new KafkaError('Test error message', KafkaErrorCode.UNKNOWN_ERROR, context);
      
      expect(error.context).toEqual(context);
    });

    it('should create a base error with original error', () => {
      const originalError = new Error('Original error');
      const error = new KafkaError(
        'Test error message', 
        KafkaErrorCode.UNKNOWN_ERROR, 
        {}, 
        originalError
      );
      
      expect(error.originalError).toBe(originalError);
    });

    it('should serialize to JSON correctly', () => {
      const context = { topic: 'test-topic', partition: 0 };
      const originalError = new Error('Original error');
      const error = new KafkaError(
        'Test error message', 
        KafkaErrorCode.UNKNOWN_ERROR, 
        context, 
        originalError
      );
      
      const json = error.toJSON();
      
      expect(json).toHaveProperty('name', 'KafkaError');
      expect(json).toHaveProperty('message', 'Test error message');
      expect(json).toHaveProperty('code', KafkaErrorCode.UNKNOWN_ERROR);
      expect(json).toHaveProperty('context', context);
      expect(json).toHaveProperty('stack');
      expect(json).toHaveProperty('originalError');
      expect(json.originalError).toHaveProperty('name', 'Error');
      expect(json.originalError).toHaveProperty('message', 'Original error');
    });
  });

  describe('Network Error Categories', () => {
    it('should create a connection error with correct defaults', () => {
      const error = new KafkaConnectionError('Failed to connect to Kafka broker');
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('KafkaConnectionError');
      expect(error.code).toBe(KafkaErrorCode.CONNECTION_ERROR);
    });

    it('should create a connection error with broker details', () => {
      const brokerContext = { 
        broker: 'kafka-broker-1:9092', 
        connectionAttempts: 3,
        timeout: 5000
      };
      
      const error = new KafkaConnectionError(
        'Failed to connect to Kafka broker', 
        KafkaErrorCode.CONNECTION_ERROR,
        brokerContext
      );
      
      expect(error.context).toEqual(brokerContext);
    });

    it('should handle producer connection errors', () => {
      const error = new KafkaConnectionError(
        'Producer failed to connect', 
        KafkaErrorCode.PRODUCER_CONNECTION_ERROR,
        { clientId: 'test-producer' }
      );
      
      expect(error.code).toBe(KafkaErrorCode.PRODUCER_CONNECTION_ERROR);
    });

    it('should handle consumer connection errors', () => {
      const error = new KafkaConnectionError(
        'Consumer failed to connect', 
        KafkaErrorCode.CONSUMER_CONNECTION_ERROR,
        { groupId: 'test-consumer-group' }
      );
      
      expect(error.code).toBe(KafkaErrorCode.CONSUMER_CONNECTION_ERROR);
    });
  });

  describe('Broker Error Categories', () => {
    it('should create a producer error with correct defaults', () => {
      const error = new KafkaProducerError('Failed to produce message');
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('KafkaProducerError');
      expect(error.code).toBe(KafkaErrorCode.PRODUCER_ERROR);
    });

    it('should create a producer error with message details', () => {
      const messageContext = { 
        topic: 'test-topic', 
        partition: 0,
        key: 'test-key',
        timestamp: Date.now()
      };
      
      const error = new KafkaProducerError(
        'Failed to produce message', 
        KafkaErrorCode.MESSAGE_DELIVERY_ERROR,
        messageContext
      );
      
      expect(error.context).toEqual(messageContext);
      expect(error.code).toBe(KafkaErrorCode.MESSAGE_DELIVERY_ERROR);
    });

    it('should handle topic creation errors', () => {
      const error = new KafkaProducerError(
        'Failed to create topic', 
        KafkaErrorCode.TOPIC_CREATION_ERROR,
        { topic: 'new-topic', partitions: 3, replicationFactor: 2 }
      );
      
      expect(error.code).toBe(KafkaErrorCode.TOPIC_CREATION_ERROR);
    });

    it('should handle consumer errors', () => {
      const error = new KafkaConsumerError(
        'Failed to consume message', 
        KafkaErrorCode.CONSUMER_ERROR,
        { topic: 'test-topic', partition: 0, offset: 42 }
      );
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('KafkaConsumerError');
      expect(error.code).toBe(KafkaErrorCode.CONSUMER_ERROR);
    });

    it('should handle subscription errors', () => {
      const error = new KafkaConsumerError(
        'Failed to subscribe to topic', 
        KafkaErrorCode.SUBSCRIPTION_ERROR,
        { topics: ['test-topic-1', 'test-topic-2'], groupId: 'test-group' }
      );
      
      expect(error.code).toBe(KafkaErrorCode.SUBSCRIPTION_ERROR);
    });

    it('should handle offset commit errors', () => {
      const error = new KafkaConsumerError(
        'Failed to commit offset', 
        KafkaErrorCode.OFFSET_COMMIT_ERROR,
        { topic: 'test-topic', partition: 0, offset: 42 }
      );
      
      expect(error.code).toBe(KafkaErrorCode.OFFSET_COMMIT_ERROR);
    });

    it('should handle consumer group errors', () => {
      const error = new KafkaConsumerError(
        'Failed to join consumer group', 
        KafkaErrorCode.GROUP_JOIN_ERROR,
        { groupId: 'test-group', memberId: 'consumer-1' }
      );
      
      expect(error.code).toBe(KafkaErrorCode.GROUP_JOIN_ERROR);
    });
  });

  describe('Message Validation Error Categories', () => {
    it('should create a serialization error with correct defaults', () => {
      const error = new KafkaSerializationError('Failed to serialize message');
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('KafkaSerializationError');
      expect(error.code).toBe(KafkaErrorCode.SERIALIZATION_ERROR);
    });

    it('should create a deserialization error with message details', () => {
      const messageContext = { 
        topic: 'test-topic', 
        partition: 0,
        offset: 42,
        size: 1024
      };
      
      const error = new KafkaSerializationError(
        'Failed to deserialize message', 
        KafkaErrorCode.DESERIALIZATION_ERROR,
        messageContext
      );
      
      expect(error.context).toEqual(messageContext);
      expect(error.code).toBe(KafkaErrorCode.DESERIALIZATION_ERROR);
    });

    it('should handle event validation errors', () => {
      const validationContext = { 
        eventType: 'health.metrics.recorded',
        validationErrors: [
          { field: 'userId', message: 'Required field missing' },
          { field: 'value', message: 'Must be a positive number' }
        ]
      };
      
      const error = new EventValidationError(
        'Event validation failed', 
        KafkaErrorCode.VALIDATION_ERROR,
        validationContext
      );
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('EventValidationError');
      expect(error.code).toBe(KafkaErrorCode.VALIDATION_ERROR);
      expect(error.context).toEqual(validationContext);
    });

    it('should handle schema validation errors', () => {
      const schemaContext = { 
        schemaId: 'health-metrics-v1',
        eventType: 'health.metrics.recorded',
        validationErrors: [
          { field: 'metricType', message: 'Must be one of: HEART_RATE, BLOOD_PRESSURE, BLOOD_GLUCOSE, STEPS, WEIGHT, SLEEP' }
        ]
      };
      
      const error = new SchemaValidationError(
        'Schema validation failed', 
        KafkaErrorCode.SCHEMA_VALIDATION_ERROR,
        schemaContext
      );
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('SchemaValidationError');
      expect(error.code).toBe(KafkaErrorCode.SCHEMA_VALIDATION_ERROR);
      expect(error.context).toEqual(schemaContext);
    });
  });

  describe('Error Context Enrichment', () => {
    it('should enrich errors with operation details', () => {
      const operationContext = {
        operation: 'produceMessage',
        timestamp: Date.now(),
        duration: 150, // ms
        service: 'health-service',
        correlationId: '1234-5678-9012-3456'
      };
      
      const error = new KafkaProducerError(
        'Failed to produce message', 
        KafkaErrorCode.PRODUCER_ERROR,
        operationContext
      );
      
      expect(error.context).toEqual(operationContext);
      expect(error.context.operation).toBe('produceMessage');
      expect(error.context.service).toBe('health-service');
      expect(error.context).toHaveProperty('timestamp');
      expect(error.context).toHaveProperty('correlationId');
    });

    it('should enrich errors with distributed tracing information', () => {
      const tracingContext = {
        traceId: '1234567890abcdef1234567890abcdef',
        spanId: 'abcdef1234567890',
        parentSpanId: '1234567890abcdef',
        sampled: true
      };
      
      const error = new KafkaConsumerError(
        'Failed to consume message', 
        KafkaErrorCode.CONSUMER_ERROR,
        { topic: 'test-topic', partition: 0, offset: 42, tracing: tracingContext }
      );
      
      expect(error.context).toHaveProperty('tracing');
      expect(error.context.tracing).toEqual(tracingContext);
    });

    it('should enrich errors with journey context', () => {
      const journeyContext = {
        journey: 'health',
        userId: 'user-123',
        action: 'recordMetric',
        resource: 'healthMetric'
      };
      
      const error = new EventValidationError(
        'Event validation failed', 
        KafkaErrorCode.VALIDATION_ERROR,
        { eventType: 'health.metrics.recorded', journey: journeyContext }
      );
      
      expect(error.context).toHaveProperty('journey');
      expect(error.context.journey).toEqual(journeyContext);
      expect(error.context.journey.journey).toBe('health');
    });
  });

  describe('Retry Policy Integration', () => {
    it('should create a retry error with retry information', () => {
      const retryContext = {
        topic: 'test-topic',
        partition: 0,
        retryCount: 3,
        maxRetries: 5,
        retryBackoff: 2000, // ms
        nextRetryAt: Date.now() + 2000
      };
      
      const error = new RetryError(
        'Message retry scheduled', 
        KafkaErrorCode.RETRY_ERROR,
        retryContext
      );
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('RetryError');
      expect(error.code).toBe(KafkaErrorCode.RETRY_ERROR);
      expect(error.context).toEqual(retryContext);
    });

    it('should handle permanent failures after max retries', () => {
      const dlqContext = {
        topic: 'test-topic',
        partition: 0,
        retryCount: 5,
        maxRetries: 5,
        originalMessage: { key: 'test-key', value: 'test-value' },
        dlqTopic: 'test-topic.dlq'
      };
      
      const error = new DeadLetterQueueError(
        'Message moved to dead letter queue after max retries', 
        KafkaErrorCode.DLQ_ERROR,
        dlqContext
      );
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('DeadLetterQueueError');
      expect(error.code).toBe(KafkaErrorCode.DLQ_ERROR);
      expect(error.context).toEqual(dlqContext);
      expect(error.context.retryCount).toEqual(error.context.maxRetries);
    });

    it('should handle batch operation errors with partial success', () => {
      const batchContext = {
        topic: 'test-topic',
        totalMessages: 10,
        successCount: 7,
        failedMessages: [
          { offset: 3, error: 'Validation failed' },
          { offset: 5, error: 'Serialization failed' },
          { offset: 8, error: 'Broker connection lost' }
        ]
      };
      
      const error = new BatchOperationError(
        'Batch operation partially failed', 
        KafkaErrorCode.BATCH_OPERATION_ERROR,
        batchContext
      );
      
      expect(error).toBeInstanceOf(KafkaError);
      expect(error.name).toBe('BatchOperationError');
      expect(error.code).toBe(KafkaErrorCode.BATCH_OPERATION_ERROR);
      expect(error.context).toEqual(batchContext);
      expect(error.context.failedMessages.length).toBe(3);
      expect(error.context.successCount).toBe(7);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should track consecutive failures for circuit breaker', () => {
      const circuitBreakerContext = {
        broker: 'kafka-broker-1:9092',
        consecutiveFailures: 5,
        failureThreshold: 10,
        lastFailure: Date.now(),
        circuitState: 'HALF_OPEN'
      };
      
      const error = new KafkaConnectionError(
        'Connection unstable, circuit half-open', 
        KafkaErrorCode.CONNECTION_ERROR,
        circuitBreakerContext
      );
      
      expect(error.context).toEqual(circuitBreakerContext);
      expect(error.context.circuitState).toBe('HALF_OPEN');
      expect(error.context.consecutiveFailures).toBeLessThan(error.context.failureThreshold);
    });

    it('should handle open circuit state', () => {
      const circuitBreakerContext = {
        broker: 'kafka-broker-1:9092',
        consecutiveFailures: 10,
        failureThreshold: 10,
        lastFailure: Date.now(),
        circuitState: 'OPEN',
        resetTimeout: 30000, // 30 seconds
        nextRetryAt: Date.now() + 30000
      };
      
      const error = new KafkaConnectionError(
        'Circuit breaker open, connection attempts suspended', 
        KafkaErrorCode.CONNECTION_ERROR,
        circuitBreakerContext
      );
      
      expect(error.context).toEqual(circuitBreakerContext);
      expect(error.context.circuitState).toBe('OPEN');
      expect(error.context.consecutiveFailures).toBeGreaterThanOrEqual(error.context.failureThreshold);
      expect(error.context).toHaveProperty('nextRetryAt');
    });

    it('should handle circuit reset after successful operation', () => {
      const circuitBreakerContext = {
        broker: 'kafka-broker-1:9092',
        previousState: 'HALF_OPEN',
        circuitState: 'CLOSED',
        resetTime: Date.now(),
        downtime: 120000 // 2 minutes of downtime
      };
      
      const error = new KafkaConnectionError(
        'Circuit breaker reset after recovery', 
        KafkaErrorCode.CONNECTION_ERROR,
        circuitBreakerContext
      );
      
      expect(error.context).toEqual(circuitBreakerContext);
      expect(error.context.circuitState).toBe('CLOSED');
      expect(error.context.previousState).toBe('HALF_OPEN');
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it('should handle health journey event errors', () => {
      const healthContext = {
        journey: 'health',
        eventType: 'health.metrics.recorded',
        userId: 'user-123',
        metricType: 'HEART_RATE',
        value: 'invalid', // Should be a number
        validationErrors: [
          { field: 'value', message: 'Must be a number' }
        ]
      };
      
      const error = new EventValidationError(
        'Health metric validation failed', 
        KafkaErrorCode.VALIDATION_ERROR,
        healthContext
      );
      
      expect(error.context.journey).toBe('health');
      expect(error.context.eventType).toBe('health.metrics.recorded');
      expect(error.context.validationErrors.length).toBe(1);
    });

    it('should handle care journey event errors', () => {
      const careContext = {
        journey: 'care',
        eventType: 'care.appointment.booked',
        userId: 'user-123',
        appointmentId: 'appt-456',
        validationErrors: [
          { field: 'providerId', message: 'Required field missing' }
        ]
      };
      
      const error = new EventValidationError(
        'Appointment booking event validation failed', 
        KafkaErrorCode.VALIDATION_ERROR,
        careContext
      );
      
      expect(error.context.journey).toBe('care');
      expect(error.context.eventType).toBe('care.appointment.booked');
      expect(error.context.validationErrors.length).toBe(1);
    });

    it('should handle plan journey event errors', () => {
      const planContext = {
        journey: 'plan',
        eventType: 'plan.claim.submitted',
        userId: 'user-123',
        claimId: 'claim-789',
        validationErrors: [
          { field: 'amount', message: 'Must be greater than zero' },
          { field: 'receiptImage', message: 'Required field missing' }
        ]
      };
      
      const error = new EventValidationError(
        'Claim submission event validation failed', 
        KafkaErrorCode.VALIDATION_ERROR,
        planContext
      );
      
      expect(error.context.journey).toBe('plan');
      expect(error.context.eventType).toBe('plan.claim.submitted');
      expect(error.context.validationErrors.length).toBe(2);
    });

    it('should handle gamification event errors', () => {
      const gamificationContext = {
        journey: 'gamification',
        eventType: 'gamification.achievement.unlocked',
        userId: 'user-123',
        achievementId: 'achievement-001',
        validationErrors: [
          { field: 'progress', message: 'Required field missing' }
        ]
      };
      
      const error = new EventValidationError(
        'Achievement event validation failed', 
        KafkaErrorCode.VALIDATION_ERROR,
        gamificationContext
      );
      
      expect(error.context.journey).toBe('gamification');
      expect(error.context.eventType).toBe('gamification.achievement.unlocked');
      expect(error.context.validationErrors.length).toBe(1);
    });
  });
});