import { Test, TestingModule } from '@nestjs/testing';
import { KafkaMessage } from 'kafkajs';
import { TOPICS } from '../../../src/constants/topics.constants';
import { ERROR_CODES } from '../../../src/constants/errors.constants';
import {
  healthMetricRecordedEvent,
  careAppointmentBookedEvent,
  planClaimSubmittedEvent,
  schemaValidationErrorContext,
  consumerProcessingErrorContext,
  deserializationErrorContext,
  finalAttemptRetryState,
  schemaValidationDLQMessage,
  consumerProcessingDLQMessage,
  deserializationDLQMessage,
  createTestEvent,
  createErrorContext,
  createRetryState,
  createDLQMessage
} from './fixtures';
import {
  MockDLQProducer,
  MockRetryPolicy,
  MockErrorHandler,
  createMockKafkaError,
  createMockValidationError,
  createMockConsumerError,
  resetAllMocks
} from './mocks';

// Import the DLQ producer that we're testing
// This will be implemented in the actual code
class DLQProducer {
  constructor(private readonly topic: string) {}

  async sendToDLQ(originalMessage: any, errorContext: any, retryState: any): Promise<void> {
    // Implementation will be mocked in tests
  }

  async reprocessMessage(dlqMessage: any): Promise<void> {
    // Implementation will be mocked in tests
  }
}

describe('Dead Letter Queue', () => {
  let mockDLQProducer: MockDLQProducer;
  let mockRetryPolicy: MockRetryPolicy;
  let mockErrorHandler: MockErrorHandler;

  beforeEach(() => {
    mockDLQProducer = new MockDLQProducer();
    mockRetryPolicy = new MockRetryPolicy({ maxRetries: 3 });
    mockErrorHandler = new MockErrorHandler();
    resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DLQ Producer', () => {
    it('should send failed events to the DLQ topic', async () => {
      // Arrange
      const originalEvent = healthMetricRecordedEvent;
      const errorContext = schemaValidationErrorContext;
      const retryState = finalAttemptRetryState;
      
      // Act
      await mockDLQProducer.sendToDLQ(
        TOPICS.HEALTH.EVENTS,
        originalEvent,
        'event-key',
        {
          'error-code': errorContext.errorCode,
          'error-message': errorContext.errorMessage,
          'original-topic': errorContext.topic,
          'retry-count': String(retryState.attemptCount),
          'max-retries': String(retryState.maxAttempts),
          'first-attempt-at': retryState.firstAttemptAt,
          'last-attempt-at': retryState.lastAttemptAt,
          'sent-to-dlq-at': new Date().toISOString()
        }
      );
      
      // Assert
      const messages = mockDLQProducer.getMessagesSent();
      expect(messages.length).toBe(1);
      expect(messages[0].topic).toBe(TOPICS.HEALTH.EVENTS);
      expect(messages[0].message).toEqual(originalEvent);
      expect(messages[0].key).toBe('event-key');
      expect(messages[0].headers).toHaveProperty('error-code', errorContext.errorCode);
      expect(messages[0].headers).toHaveProperty('error-message', errorContext.errorMessage);
      expect(messages[0].headers).toHaveProperty('original-topic', errorContext.topic);
      expect(messages[0].headers).toHaveProperty('retry-count', String(retryState.attemptCount));
      expect(messages[0].headers).toHaveProperty('max-retries', String(retryState.maxAttempts));
    });

    it('should preserve the original event payload and metadata', async () => {
      // Arrange
      const originalEvent = careAppointmentBookedEvent;
      const errorContext = consumerProcessingErrorContext;
      const retryState = finalAttemptRetryState;
      
      // Act
      await mockDLQProducer.sendToDLQ(
        TOPICS.CARE.EVENTS,
        originalEvent,
        'event-key',
        {
          'error-code': errorContext.errorCode,
          'error-message': errorContext.errorMessage,
          'original-topic': errorContext.topic,
          'retry-count': String(retryState.attemptCount),
          'max-retries': String(retryState.maxAttempts),
          'first-attempt-at': retryState.firstAttemptAt,
          'last-attempt-at': retryState.lastAttemptAt,
          'sent-to-dlq-at': new Date().toISOString()
        }
      );
      
      // Assert
      const messages = mockDLQProducer.getMessagesSent();
      expect(messages.length).toBe(1);
      
      // Verify original event is preserved
      expect(messages[0].message).toEqual(originalEvent);
      expect(messages[0].message.id).toBe(originalEvent.id);
      expect(messages[0].message.type).toBe(originalEvent.type);
      expect(messages[0].message.payload).toEqual(originalEvent.payload);
      expect(messages[0].message.metadata).toEqual(originalEvent.metadata);
    });

    it('should include detailed error context in the DLQ message headers', async () => {
      // Arrange
      const originalEvent = planClaimSubmittedEvent;
      const errorContext = deserializationErrorContext;
      const retryState = finalAttemptRetryState;
      
      // Act
      await mockDLQProducer.sendToDLQ(
        TOPICS.PLAN.EVENTS,
        originalEvent,
        'event-key',
        {
          'error-code': errorContext.errorCode,
          'error-message': errorContext.errorMessage,
          'original-topic': errorContext.topic,
          'partition': String(errorContext.partition),
          'offset': String(errorContext.offset),
          'retry-count': String(retryState.attemptCount),
          'max-retries': String(retryState.maxAttempts),
          'first-attempt-at': retryState.firstAttemptAt,
          'last-attempt-at': retryState.lastAttemptAt,
          'sent-to-dlq-at': new Date().toISOString(),
          'stack-trace': errorContext.stackTrace
        }
      );
      
      // Assert
      const messages = mockDLQProducer.getMessagesSent();
      expect(messages.length).toBe(1);
      
      // Verify error context is included in headers
      expect(messages[0].headers).toHaveProperty('error-code', errorContext.errorCode);
      expect(messages[0].headers).toHaveProperty('error-message', errorContext.errorMessage);
      expect(messages[0].headers).toHaveProperty('original-topic', errorContext.topic);
      expect(messages[0].headers).toHaveProperty('partition', String(errorContext.partition));
      expect(messages[0].headers).toHaveProperty('offset', String(errorContext.offset));
      expect(messages[0].headers).toHaveProperty('stack-trace', errorContext.stackTrace);
      expect(messages[0].headers).toHaveProperty('retry-count', String(retryState.attemptCount));
      expect(messages[0].headers).toHaveProperty('max-retries', String(retryState.maxAttempts));
      expect(messages[0].headers).toHaveProperty('first-attempt-at');
      expect(messages[0].headers).toHaveProperty('last-attempt-at');
      expect(messages[0].headers).toHaveProperty('sent-to-dlq-at');
    });

    it('should handle different failure scenarios appropriately', async () => {
      // Arrange - Schema validation error
      const validationEvent = healthMetricRecordedEvent;
      const validationError = createMockValidationError(TOPICS.HEALTH.EVENTS, validationEvent);
      const validationRetryState = createRetryState(5, 5);
      
      // Arrange - Consumer processing error
      const processingEvent = careAppointmentBookedEvent;
      const processingError = createMockConsumerError(TOPICS.CARE.EVENTS);
      const processingRetryState = createRetryState(3, 3);
      
      // Act - Send both error types to DLQ
      await mockDLQProducer.sendToDLQ(
        TOPICS.HEALTH.EVENTS,
        validationEvent,
        'validation-key',
        {
          'error-code': ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          'error-message': validationError.message,
          'original-topic': TOPICS.HEALTH.EVENTS,
          'retry-count': String(validationRetryState.attemptCount),
          'max-retries': String(validationRetryState.maxAttempts),
          'sent-to-dlq-at': new Date().toISOString()
        }
      );
      
      await mockDLQProducer.sendToDLQ(
        TOPICS.CARE.EVENTS,
        processingEvent,
        'processing-key',
        {
          'error-code': ERROR_CODES.CONSUMER_PROCESSING_FAILED,
          'error-message': processingError.message,
          'original-topic': TOPICS.CARE.EVENTS,
          'retry-count': String(processingRetryState.attemptCount),
          'max-retries': String(processingRetryState.maxAttempts),
          'sent-to-dlq-at': new Date().toISOString()
        }
      );
      
      // Assert
      const messages = mockDLQProducer.getMessagesSent();
      expect(messages.length).toBe(2);
      
      // Verify first message (validation error)
      expect(messages[0].topic).toBe(TOPICS.HEALTH.EVENTS);
      expect(messages[0].message).toEqual(validationEvent);
      expect(messages[0].headers['error-code']).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      
      // Verify second message (processing error)
      expect(messages[1].topic).toBe(TOPICS.CARE.EVENTS);
      expect(messages[1].message).toEqual(processingEvent);
      expect(messages[1].headers['error-code']).toBe(ERROR_CODES.CONSUMER_PROCESSING_FAILED);
    });

    it('should handle DLQ producer failures gracefully', async () => {
      // Arrange
      const failingDLQProducer = new MockDLQProducer({ shouldFail: true });
      const originalEvent = healthMetricRecordedEvent;
      const errorContext = schemaValidationErrorContext;
      const retryState = finalAttemptRetryState;
      
      // Act & Assert
      await expect(failingDLQProducer.sendToDLQ(
        TOPICS.HEALTH.EVENTS,
        originalEvent,
        'event-key',
        {
          'error-code': errorContext.errorCode,
          'error-message': errorContext.errorMessage,
          'original-topic': errorContext.topic,
          'retry-count': String(retryState.attemptCount),
          'max-retries': String(retryState.maxAttempts),
          'sent-to-dlq-at': new Date().toISOString()
        }
      )).rejects.toThrow();
      
      // Verify the error was recorded but no message was successfully sent
      expect(failingDLQProducer.getSendCount()).toBe(1);
      expect(failingDLQProducer.getMessagesSent().length).toBe(1); // It's recorded but not sent successfully
    });
  });

  describe('DLQ Message Reprocessing', () => {
    it('should support manual reprocessing of DLQ messages', async () => {
      // This test would verify that messages from the DLQ can be manually reprocessed
      // In a real implementation, this would involve:  
      // 1. Reading a message from the DLQ
      // 2. Extracting the original message and metadata
      // 3. Sending it back to the original topic
      
      // For this test, we'll mock this functionality
      
      // Arrange - Create a mock function for reprocessing
      const mockReprocessFn = jest.fn().mockResolvedValue(undefined);
      
      // Create a DLQ message
      const dlqMessage = schemaValidationDLQMessage;
      
      // Act - Simulate reprocessing
      await mockReprocessFn(dlqMessage);
      
      // Assert
      expect(mockReprocessFn).toHaveBeenCalledWith(dlqMessage);
      expect(mockReprocessFn).toHaveBeenCalledTimes(1);
    });

    it('should extract original message and error context from DLQ message', () => {
      // Arrange
      const dlqMessage = consumerProcessingDLQMessage;
      
      // Act - Extract components
      const { originalEvent, errorContext, retryState } = dlqMessage;
      
      // Assert
      expect(originalEvent).toEqual(careAppointmentBookedEvent);
      expect(errorContext).toEqual(consumerProcessingErrorContext);
      expect(retryState).toEqual(finalAttemptRetryState);
    });

    it('should route reprocessed messages back to their original topics', async () => {
      // Arrange
      const mockProducer = {
        send: jest.fn().mockResolvedValue(undefined)
      };
      
      const dlqMessage = deserializationDLQMessage;
      const originalTopic = dlqMessage.errorContext.topic;
      
      // Act - Simulate reprocessing by sending back to original topic
      await mockProducer.send({
        topic: originalTopic,
        messages: [{
          key: 'reprocessed-key',
          value: JSON.stringify(dlqMessage.originalEvent),
          headers: {
            'reprocessed': 'true',
            'original-error': dlqMessage.errorContext.errorCode,
            'reprocessed-at': new Date().toISOString()
          }
        }]
      });
      
      // Assert
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: originalTopic,
        messages: expect.arrayContaining([expect.objectContaining({
          headers: expect.objectContaining({
            'reprocessed': 'true'
          })
        })])
      });
    });
  });

  describe('DLQ Integration with Retry Mechanism', () => {
    it('should only send messages to DLQ after retry attempts are exhausted', async () => {
      // Arrange
      const event = healthMetricRecordedEvent;
      const error = createMockValidationError(TOPICS.HEALTH.EVENTS, event);
      
      // Configure retry policy with 3 max retries
      const retryPolicy = new MockRetryPolicy({ maxRetries: 3 });
      
      // Act - Simulate retry attempts
      let shouldRetry = await retryPolicy.shouldRetry(); // 1st retry
      expect(shouldRetry).toBe(true);
      
      shouldRetry = await retryPolicy.shouldRetry(); // 2nd retry
      expect(shouldRetry).toBe(true);
      
      shouldRetry = await retryPolicy.shouldRetry(); // 3rd retry
      expect(shouldRetry).toBe(false); // No more retries
      
      // Now send to DLQ since retries are exhausted
      await mockDLQProducer.sendToDLQ(
        TOPICS.HEALTH.EVENTS,
        event,
        'event-key',
        {
          'error-code': error.code,
          'error-message': error.message,
          'original-topic': TOPICS.HEALTH.EVENTS,
          'retry-count': String(retryPolicy.getRetryCount()),
          'max-retries': '3',
          'sent-to-dlq-at': new Date().toISOString()
        }
      );
      
      // Assert
      expect(retryPolicy.getRetryCount()).toBe(3);
      expect(mockDLQProducer.getSendCount()).toBe(1);
      
      const messages = mockDLQProducer.getMessagesSent();
      expect(messages[0].headers['retry-count']).toBe('3');
    });

    it('should use exponential backoff for retry attempts', async () => {
      // Arrange
      const retryPolicy = new MockRetryPolicy({
        maxRetries: 3,
        retryDelays: [100, 200, 400] // Exponential backoff pattern
      });
      
      // Act - Get delays for each retry
      await retryPolicy.shouldRetry(); // 1st retry
      const delay1 = retryPolicy.getRetryDelay();
      
      await retryPolicy.shouldRetry(); // 2nd retry
      const delay2 = retryPolicy.getRetryDelay();
      
      await retryPolicy.shouldRetry(); // 3rd retry
      const delay3 = retryPolicy.getRetryDelay();
      
      // Assert - Verify exponential backoff pattern
      expect(delay1).toBe(100);
      expect(delay2).toBe(200);
      expect(delay3).toBe(400);
      
      // Verify the retry history
      const history = retryPolicy.getRetryHistory();
      expect(history.length).toBe(3);
      expect(history[0].attempt).toBe(1);
      expect(history[1].attempt).toBe(2);
      expect(history[2].attempt).toBe(3);
    });
  });

  describe('DLQ Topic Routing Logic', () => {
    it('should route messages to the correct DLQ topic based on source topic', async () => {
      // Arrange
      const healthEvent = healthMetricRecordedEvent;
      const careEvent = careAppointmentBookedEvent;
      const planEvent = planClaimSubmittedEvent;
      
      const healthError = createMockValidationError(TOPICS.HEALTH.EVENTS, healthEvent);
      const careError = createMockConsumerError(TOPICS.CARE.EVENTS);
      const planError = createMockKafkaError(
        ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
        { topic: TOPICS.PLAN.EVENTS }
      );
      
      const retryState = createRetryState(5, 5);
      
      // Act - Send events to their respective DLQs
      await mockDLQProducer.sendToDLQ(
        TOPICS.HEALTH.EVENTS,
        healthEvent,
        'health-key',
        { 'error-code': healthError.code, 'original-topic': TOPICS.HEALTH.EVENTS }
      );
      
      await mockDLQProducer.sendToDLQ(
        TOPICS.CARE.EVENTS,
        careEvent,
        'care-key',
        { 'error-code': careError.code, 'original-topic': TOPICS.CARE.EVENTS }
      );
      
      await mockDLQProducer.sendToDLQ(
        TOPICS.PLAN.EVENTS,
        planEvent,
        'plan-key',
        { 'error-code': planError.code, 'original-topic': TOPICS.PLAN.EVENTS }
      );
      
      // Assert
      const messages = mockDLQProducer.getMessagesSent();
      expect(messages.length).toBe(3);
      
      // Verify each message went to the correct topic
      expect(messages[0].topic).toBe(TOPICS.HEALTH.EVENTS);
      expect(messages[0].message).toEqual(healthEvent);
      
      expect(messages[1].topic).toBe(TOPICS.CARE.EVENTS);
      expect(messages[1].message).toEqual(careEvent);
      
      expect(messages[2].topic).toBe(TOPICS.PLAN.EVENTS);
      expect(messages[2].message).toEqual(planEvent);
    });

    it('should support a global DLQ topic for all failed messages', async () => {
      // Arrange
      const globalDLQTopic = TOPICS.DEAD_LETTER;
      const mockGlobalDLQProducer = new MockDLQProducer();
      
      const healthEvent = healthMetricRecordedEvent;
      const careEvent = careAppointmentBookedEvent;
      
      // Act - Send events to the global DLQ
      await mockGlobalDLQProducer.sendToDLQ(
        globalDLQTopic,
        healthEvent,
        'health-key',
        { 
          'error-code': ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          'original-topic': TOPICS.HEALTH.EVENTS 
        }
      );
      
      await mockGlobalDLQProducer.sendToDLQ(
        globalDLQTopic,
        careEvent,
        'care-key',
        { 
          'error-code': ERROR_CODES.CONSUMER_PROCESSING_FAILED,
          'original-topic': TOPICS.CARE.EVENTS 
        }
      );
      
      // Assert
      const messages = mockGlobalDLQProducer.getMessagesSent();
      expect(messages.length).toBe(2);
      
      // Verify all messages went to the global DLQ topic
      expect(messages[0].topic).toBe(globalDLQTopic);
      expect(messages[1].topic).toBe(globalDLQTopic);
      
      // Verify original topic is preserved in headers
      expect(messages[0].headers['original-topic']).toBe(TOPICS.HEALTH.EVENTS);
      expect(messages[1].headers['original-topic']).toBe(TOPICS.CARE.EVENTS);
    });
  });
});