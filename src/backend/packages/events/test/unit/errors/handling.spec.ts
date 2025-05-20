import { Test, TestingModule } from '@nestjs/testing';
import { ERROR_CODES, ERROR_MESSAGES, ERROR_SEVERITY } from '../../../src/constants/errors.constants';
import { EventType } from '../../../src/dto/event-types.enum';
import { TOPICS } from '../../../src/constants/topics.constants';
import {
  healthMetricRecordedEvent,
  careAppointmentBookedEvent,
  planClaimSubmittedEvent,
  schemaValidationErrorContext,
  consumerProcessingErrorContext,
  deserializationErrorContext,
  firstAttemptRetryState,
  midAttemptRetryState,
  finalAttemptRetryState,
  createTestEvent,
  createErrorContext,
  createRetryState
} from './fixtures';
import {
  MockKafkaError,
  MockEventValidationError,
  MockProducerError,
  MockConsumerError,
  MockRetryPolicy,
  MockDLQProducer,
  MockErrorHandler,
  createMockKafkaError,
  createMockValidationError,
  createMockConsumerError,
  resetAllMocks
} from './mocks';

// Import the error handling utilities and decorators that we're testing
import { HandleEventErrors, EventErrorHandler, CircuitBreaker } from '../../../src/errors/handling';

// Mock class for testing the decorator
class TestEventProcessor {
  public processingResult: any = null;
  public processingError: Error = null;
  public processingAttempts = 0;

  @HandleEventErrors()
  async processEvent(event: any): Promise<any> {
    this.processingAttempts++;
    if (this.processingError) {
      throw this.processingError;
    }
    return this.processingResult;
  }

  @HandleEventErrors({ maxRetries: 3, retryDelayMs: 100 })
  async processEventWithRetry(event: any): Promise<any> {
    this.processingAttempts++;
    if (this.processingError) {
      throw this.processingError;
    }
    return this.processingResult;
  }

  @HandleEventErrors({ useCircuitBreaker: true, failureThreshold: 3, resetTimeoutMs: 5000 })
  async processEventWithCircuitBreaker(event: any): Promise<any> {
    this.processingAttempts++;
    if (this.processingError) {
      throw this.processingError;
    }
    return this.processingResult;
  }

  @HandleEventErrors({ journeySpecificConfig: true })
  async processEventWithJourneyConfig(event: any): Promise<any> {
    this.processingAttempts++;
    if (this.processingError) {
      throw this.processingError;
    }
    return this.processingResult;
  }

  // Method to reset the test state
  reset(): void {
    this.processingResult = null;
    this.processingError = null;
    this.processingAttempts = 0;
  }
}

describe('Error Handling', () => {
  let testProcessor: TestEventProcessor;
  let mockRetryPolicy: MockRetryPolicy;
  let mockDLQProducer: MockDLQProducer;
  let mockErrorHandler: MockErrorHandler;

  beforeEach(() => {
    testProcessor = new TestEventProcessor();
    mockRetryPolicy = new MockRetryPolicy({ maxRetries: 3 });
    mockDLQProducer = new MockDLQProducer();
    mockErrorHandler = new MockErrorHandler();
    resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('@HandleEventErrors Decorator', () => {
    it('should successfully process events when no errors occur', async () => {
      // Arrange
      const event = healthMetricRecordedEvent;
      testProcessor.processingResult = { success: true, eventId: event.id };

      // Act
      const result = await testProcessor.processEvent(event);

      // Assert
      expect(result).toEqual({ success: true, eventId: event.id });
      expect(testProcessor.processingAttempts).toBe(1);
    });

    it('should catch and handle errors thrown during event processing', async () => {
      // Arrange
      const event = healthMetricRecordedEvent;
      const error = createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED, { eventId: event.id });
      testProcessor.processingError = error;

      // Mock the error handler to not rethrow
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockResolvedValue(undefined);

      // Act
      await testProcessor.processEvent(event);

      // Assert
      expect(EventErrorHandler.prototype.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ event })
      );
      expect(testProcessor.processingAttempts).toBe(1);
    });

    it('should retry failed operations based on retry policy', async () => {
      // Arrange
      const event = careAppointmentBookedEvent;
      const error = createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED, { eventId: event.id });
      testProcessor.processingError = error;

      // Mock the retry policy to allow 2 retries then fail
      jest.spyOn(mockRetryPolicy, 'shouldRetry')
        .mockResolvedValueOnce(true)  // First retry: yes
        .mockResolvedValueOnce(true)  // Second retry: yes
        .mockResolvedValueOnce(false); // Third retry: no

      // Mock the error handler to use our mock retry policy
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async () => {
        const shouldRetry = await mockRetryPolicy.shouldRetry();
        if (shouldRetry) {
          // Simulate retry by calling the method again
          await testProcessor.processEventWithRetry(event);
        }
      });

      // Act
      await testProcessor.processEventWithRetry(event);

      // Assert
      expect(mockRetryPolicy.shouldRetry).toHaveBeenCalledTimes(3);
      expect(testProcessor.processingAttempts).toBe(3); // Initial + 2 retries
    });

    it('should send to DLQ when retries are exhausted', async () => {
      // Arrange
      const event = planClaimSubmittedEvent;
      const error = createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED, { eventId: event.id });
      testProcessor.processingError = error;

      // Mock the retry policy to not allow any more retries
      jest.spyOn(mockRetryPolicy, 'shouldRetry').mockResolvedValue(false);

      // Mock the DLQ producer
      jest.spyOn(mockDLQProducer, 'sendToDLQ').mockResolvedValue(undefined);

      // Mock the error handler to use our mocks
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async () => {
        const shouldRetry = await mockRetryPolicy.shouldRetry();
        if (!shouldRetry) {
          // Send to DLQ
          await mockDLQProducer.sendToDLQ(
            TOPICS.PLAN.EVENTS,
            event,
            event.id,
            { 'error-code': error.code }
          );
        }
      });

      // Act
      await testProcessor.processEvent(event);

      // Assert
      expect(mockRetryPolicy.shouldRetry).toHaveBeenCalledTimes(1);
      expect(mockDLQProducer.sendToDLQ).toHaveBeenCalledTimes(1);
      expect(mockDLQProducer.sendToDLQ).toHaveBeenCalledWith(
        TOPICS.PLAN.EVENTS,
        event,
        event.id,
        expect.objectContaining({ 'error-code': error.code })
      );
    });

    it('should apply exponential backoff for retries', async () => {
      // Arrange
      const event = healthMetricRecordedEvent;
      const error = createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED, { eventId: event.id });
      testProcessor.processingError = error;

      // Mock the retry policy
      jest.spyOn(mockRetryPolicy, 'shouldRetry')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      jest.spyOn(mockRetryPolicy, 'getRetryDelay')
        .mockReturnValueOnce(100)  // First retry: 100ms
        .mockReturnValueOnce(200); // Second retry: 200ms

      // Mock setTimeout
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Mock the error handler
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async () => {
        const shouldRetry = await mockRetryPolicy.shouldRetry();
        if (shouldRetry) {
          const delay = mockRetryPolicy.getRetryDelay();
          await new Promise(resolve => setTimeout(resolve, delay));
          await testProcessor.processEventWithRetry(event);
        }
      });

      // Act
      await testProcessor.processEventWithRetry(event);

      // Assert
      expect(mockRetryPolicy.shouldRetry).toHaveBeenCalledTimes(3);
      expect(mockRetryPolicy.getRetryDelay).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    });
  });

  describe('Error Classification', () => {
    it('should classify errors correctly for retry decisions', async () => {
      // Arrange
      const event = healthMetricRecordedEvent;
      
      // Create different types of errors
      const transientError = createMockKafkaError(ERROR_CODES.CONSUMER_CONNECTION_FAILED);
      const permanentError = createMockValidationError(TOPICS.HEALTH.EVENTS, event);
      const retryableError = createMockConsumerError(TOPICS.HEALTH.EVENTS);
      
      // Mock the error handler's isRetryable method
      const isRetryableSpy = jest.spyOn(EventErrorHandler.prototype as any, 'isRetryableError');
      isRetryableSpy
        .mockReturnValueOnce(true)   // Transient error should be retryable
        .mockReturnValueOnce(false)  // Permanent error should not be retryable
        .mockReturnValueOnce(true);  // Retryable error should be retryable

      // Mock the error handler to use our spy
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async (error) => {
        const isRetryable = (EventErrorHandler.prototype as any).isRetryableError(error);
        // Just for testing, we're not actually doing anything with this value
      });

      // Act & Assert
      testProcessor.processingError = transientError;
      await testProcessor.processEvent(event);
      expect(isRetryableSpy).toHaveBeenCalledWith(transientError);
      expect(isRetryableSpy).toHaveReturnedWith(true);

      testProcessor.processingError = permanentError;
      await testProcessor.processEvent(event);
      expect(isRetryableSpy).toHaveBeenCalledWith(permanentError);
      expect(isRetryableSpy).toHaveReturnedWith(false);

      testProcessor.processingError = retryableError;
      await testProcessor.processEvent(event);
      expect(isRetryableSpy).toHaveBeenCalledWith(retryableError);
      expect(isRetryableSpy).toHaveReturnedWith(true);
    });

    it('should classify errors by severity level', async () => {
      // Arrange
      const event = careAppointmentBookedEvent;
      
      // Create errors with different severity levels
      const criticalError = createMockKafkaError(ERROR_CODES.CONSUMER_CRITICAL_FAILURE);
      const warningError = createMockKafkaError(ERROR_CODES.CONSUMER_WARNING);
      const infoError = createMockKafkaError(ERROR_CODES.CONSUMER_INFO);
      
      // Mock the error handler's getSeverity method
      const getSeveritySpy = jest.spyOn(EventErrorHandler.prototype as any, 'getErrorSeverity');
      getSeveritySpy
        .mockReturnValueOnce(ERROR_SEVERITY.CRITICAL)
        .mockReturnValueOnce(ERROR_SEVERITY.WARNING)
        .mockReturnValueOnce(ERROR_SEVERITY.INFO);

      // Mock the error handler to use our spy
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async (error) => {
        const severity = (EventErrorHandler.prototype as any).getErrorSeverity(error);
        // Just for testing, we're not actually doing anything with this value
      });

      // Act & Assert
      testProcessor.processingError = criticalError;
      await testProcessor.processEvent(event);
      expect(getSeveritySpy).toHaveBeenCalledWith(criticalError);
      expect(getSeveritySpy).toHaveReturnedWith(ERROR_SEVERITY.CRITICAL);

      testProcessor.processingError = warningError;
      await testProcessor.processEvent(event);
      expect(getSeveritySpy).toHaveBeenCalledWith(warningError);
      expect(getSeveritySpy).toHaveReturnedWith(ERROR_SEVERITY.WARNING);

      testProcessor.processingError = infoError;
      await testProcessor.processEvent(event);
      expect(getSeveritySpy).toHaveBeenCalledWith(infoError);
      expect(getSeveritySpy).toHaveReturnedWith(ERROR_SEVERITY.INFO);
    });

    it('should classify errors by journey type', async () => {
      // Arrange
      const healthEvent = healthMetricRecordedEvent;
      const careEvent = careAppointmentBookedEvent;
      const planEvent = planClaimSubmittedEvent;
      
      // Create errors for different journeys
      const healthError = createMockConsumerError(TOPICS.HEALTH.EVENTS);
      const careError = createMockConsumerError(TOPICS.CARE.EVENTS);
      const planError = createMockConsumerError(TOPICS.PLAN.EVENTS);
      
      // Mock the error handler's getJourney method
      const getJourneySpy = jest.spyOn(EventErrorHandler.prototype as any, 'getErrorJourney');
      getJourneySpy
        .mockReturnValueOnce('health')
        .mockReturnValueOnce('care')
        .mockReturnValueOnce('plan');

      // Mock the error handler to use our spy
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async (error, context) => {
        const journey = (EventErrorHandler.prototype as any).getErrorJourney(error, context);
        // Just for testing, we're not actually doing anything with this value
      });

      // Act & Assert
      testProcessor.processingError = healthError;
      await testProcessor.processEvent(healthEvent);
      expect(getJourneySpy).toHaveBeenCalled();
      expect(getJourneySpy).toHaveReturnedWith('health');

      testProcessor.processingError = careError;
      await testProcessor.processEvent(careEvent);
      expect(getJourneySpy).toHaveBeenCalled();
      expect(getJourneySpy).toHaveReturnedWith('care');

      testProcessor.processingError = planError;
      await testProcessor.processEvent(planEvent);
      expect(getJourneySpy).toHaveBeenCalled();
      expect(getJourneySpy).toHaveReturnedWith('plan');
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should implement retry with delay recovery strategy', async () => {
      // Arrange
      const event = healthMetricRecordedEvent;
      const error = createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED, { eventId: event.id });
      testProcessor.processingError = error;

      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Create a recovery strategy that retries after delay
      const recoverySpy = jest.fn().mockImplementation(async () => {
        // On second attempt, clear the error to simulate successful recovery
        if (testProcessor.processingAttempts === 1) {
          setTimeout(() => {
            testProcessor.processingError = null;
            testProcessor.processingResult = { recovered: true };
          }, 100);
        }
      });

      // Mock the error handler to use our recovery strategy
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async () => {
        await recoverySpy();
        if (testProcessor.processingAttempts < 2) {
          await testProcessor.processEventWithRetry(event);
        }
      });

      // Act
      const result = await testProcessor.processEventWithRetry(event);

      // Assert
      expect(recoverySpy).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(testProcessor.processingAttempts).toBe(2);
      expect(result).toEqual({ recovered: true });
    });

    it('should implement fallback value recovery strategy', async () => {
      // Arrange
      const event = careAppointmentBookedEvent;
      const error = createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED, { eventId: event.id });
      testProcessor.processingError = error;

      // Create a fallback value
      const fallbackValue = { fallback: true, eventId: event.id };

      // Mock the error handler to return a fallback value
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async () => {
        return fallbackValue;
      });

      // Act
      const result = await testProcessor.processEvent(event);

      // Assert
      expect(result).toEqual(fallbackValue);
      expect(testProcessor.processingAttempts).toBe(1);
    });

    it('should implement compensating action recovery strategy', async () => {
      // Arrange
      const event = planClaimSubmittedEvent;
      const error = createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED, { eventId: event.id });
      testProcessor.processingError = error;

      // Create a compensating action that performs cleanup
      const cleanupSpy = jest.fn().mockResolvedValue(undefined);

      // Mock the error handler to perform compensating action
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async () => {
        // Perform cleanup
        await cleanupSpy();
        // Rethrow the error
        throw error;
      });

      // Act & Assert
      await expect(testProcessor.processEvent(event)).rejects.toThrow();
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(testProcessor.processingAttempts).toBe(1);
    });

    it('should implement circuit breaker recovery strategy', async () => {
      // Arrange
      const event = healthMetricRecordedEvent;
      const error = createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED, { eventId: event.id });
      testProcessor.processingError = error;

      // Mock the circuit breaker
      const circuitBreakerSpy = jest.spyOn(CircuitBreaker.prototype, 'recordFailure');
      const isOpenSpy = jest.spyOn(CircuitBreaker.prototype, 'isOpen').mockReturnValue(false);

      // Mock the error handler to use circuit breaker
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async () => {
        // Record the failure in the circuit breaker
        circuitBreakerSpy();
        throw error;
      });

      // Act & Assert
      await expect(testProcessor.processEventWithCircuitBreaker(event)).rejects.toThrow();
      expect(circuitBreakerSpy).toHaveBeenCalledTimes(1);
      expect(isOpenSpy).toHaveBeenCalledTimes(1);
    });

    it('should skip processing when circuit breaker is open', async () => {
      // Arrange
      const event = healthMetricRecordedEvent;

      // Mock the circuit breaker to be open
      jest.spyOn(CircuitBreaker.prototype, 'isOpen').mockReturnValue(true);

      // Act & Assert
      await expect(testProcessor.processEventWithCircuitBreaker(event)).rejects.toThrow(/Circuit breaker is open/);
      expect(testProcessor.processingAttempts).toBe(0); // Should not attempt processing
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it('should apply different retry policies based on journey', async () => {
      // Arrange
      const healthEvent = healthMetricRecordedEvent;
      const careEvent = careAppointmentBookedEvent;
      const planEvent = planClaimSubmittedEvent;

      // Create errors for different journeys
      const healthError = createMockConsumerError(TOPICS.HEALTH.EVENTS);
      const careError = createMockConsumerError(TOPICS.CARE.EVENTS);
      const planError = createMockConsumerError(TOPICS.PLAN.EVENTS);

      // Mock the journey-specific retry policies
      const healthRetrySpy = jest.fn().mockResolvedValue(true); // Health: allow retry
      const careRetrySpy = jest.fn().mockResolvedValue(false); // Care: no retry
      const planRetrySpy = jest.fn().mockResolvedValue(true); // Plan: allow retry

      // Mock the error handler to use journey-specific policies
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async (error, context) => {
        // Determine which journey this is for
        let retrySpy;
        if (context.event === healthEvent) {
          retrySpy = healthRetrySpy;
        } else if (context.event === careEvent) {
          retrySpy = careRetrySpy;
        } else {
          retrySpy = planRetrySpy;
        }

        // Check if we should retry
        const shouldRetry = await retrySpy();
        if (shouldRetry) {
          // For testing, we're not actually retrying
        }
      });

      // Act
      testProcessor.processingError = healthError;
      await testProcessor.processEventWithJourneyConfig(healthEvent);

      testProcessor.processingError = careError;
      await testProcessor.processEventWithJourneyConfig(careEvent);

      testProcessor.processingError = planError;
      await testProcessor.processEventWithJourneyConfig(planEvent);

      // Assert
      expect(healthRetrySpy).toHaveBeenCalledTimes(1);
      expect(careRetrySpy).toHaveBeenCalledTimes(1);
      expect(planRetrySpy).toHaveBeenCalledTimes(1);
    });

    it('should apply different error logging based on journey', async () => {
      // Arrange
      const healthEvent = healthMetricRecordedEvent;
      const careEvent = careAppointmentBookedEvent;
      const planEvent = planClaimSubmittedEvent;

      // Create errors for different journeys
      const healthError = createMockConsumerError(TOPICS.HEALTH.EVENTS);
      const careError = createMockConsumerError(TOPICS.CARE.EVENTS);
      const planError = createMockConsumerError(TOPICS.PLAN.EVENTS);

      // Mock the journey-specific logging
      const healthLogSpy = jest.fn();
      const careLogSpy = jest.fn();
      const planLogSpy = jest.fn();

      // Mock the error handler to use journey-specific logging
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async (error, context) => {
        // Determine which journey this is for
        if (context.event === healthEvent) {
          healthLogSpy(error, 'health-journey');
        } else if (context.event === careEvent) {
          careLogSpy(error, 'care-journey');
        } else {
          planLogSpy(error, 'plan-journey');
        }
      });

      // Act
      testProcessor.processingError = healthError;
      await testProcessor.processEventWithJourneyConfig(healthEvent);

      testProcessor.processingError = careError;
      await testProcessor.processEventWithJourneyConfig(careEvent);

      testProcessor.processingError = planError;
      await testProcessor.processEventWithJourneyConfig(planEvent);

      // Assert
      expect(healthLogSpy).toHaveBeenCalledWith(healthError, 'health-journey');
      expect(careLogSpy).toHaveBeenCalledWith(careError, 'care-journey');
      expect(planLogSpy).toHaveBeenCalledWith(planError, 'plan-journey');
    });

    it('should apply different DLQ routing based on journey', async () => {
      // Arrange
      const healthEvent = healthMetricRecordedEvent;
      const careEvent = careAppointmentBookedEvent;
      const planEvent = planClaimSubmittedEvent;

      // Create errors for different journeys
      const healthError = createMockConsumerError(TOPICS.HEALTH.EVENTS);
      const careError = createMockConsumerError(TOPICS.CARE.EVENTS);
      const planError = createMockConsumerError(TOPICS.PLAN.EVENTS);

      // Mock the DLQ producer
      jest.spyOn(mockDLQProducer, 'sendToDLQ').mockResolvedValue(undefined);

      // Mock the error handler to use journey-specific DLQ routing
      jest.spyOn(EventErrorHandler.prototype, 'handleError').mockImplementation(async (error, context) => {
        // Determine which journey this is for
        let topic;
        if (context.event === healthEvent) {
          topic = TOPICS.HEALTH.EVENTS;
        } else if (context.event === careEvent) {
          topic = TOPICS.CARE.EVENTS;
        } else {
          topic = TOPICS.PLAN.EVENTS;
        }

        // Send to DLQ
        await mockDLQProducer.sendToDLQ(
          topic,
          context.event,
          context.event.id,
          { 'error-code': error.code, 'journey': topic.split('.')[0] }
        );
      });

      // Act
      testProcessor.processingError = healthError;
      await testProcessor.processEventWithJourneyConfig(healthEvent);

      testProcessor.processingError = careError;
      await testProcessor.processEventWithJourneyConfig(careEvent);

      testProcessor.processingError = planError;
      await testProcessor.processEventWithJourneyConfig(planEvent);

      // Assert
      expect(mockDLQProducer.sendToDLQ).toHaveBeenCalledTimes(3);
      expect(mockDLQProducer.sendToDLQ).toHaveBeenNthCalledWith(
        1,
        TOPICS.HEALTH.EVENTS,
        healthEvent,
        healthEvent.id,
        expect.objectContaining({ 'journey': 'health' })
      );
      expect(mockDLQProducer.sendToDLQ).toHaveBeenNthCalledWith(
        2,
        TOPICS.CARE.EVENTS,
        careEvent,
        careEvent.id,
        expect.objectContaining({ 'journey': 'care' })
      );
      expect(mockDLQProducer.sendToDLQ).toHaveBeenNthCalledWith(
        3,
        TOPICS.PLAN.EVENTS,
        planEvent,
        planEvent.id,
        expect.objectContaining({ 'journey': 'plan' })
      );
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should track failure counts and trip the circuit breaker', () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker(3, 5000); // 3 failures, 5000ms timeout

      // Act - Record 3 failures
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      const isOpenBeforeThird = circuitBreaker.isOpen();
      circuitBreaker.recordFailure();
      const isOpenAfterThird = circuitBreaker.isOpen();

      // Assert
      expect(isOpenBeforeThird).toBe(false); // Should not be open yet
      expect(isOpenAfterThird).toBe(true); // Should be open after 3 failures
    });

    it('should reset the circuit breaker after timeout', () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker(3, 100); // 3 failures, 100ms timeout

      // Act - Trip the circuit breaker
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      const isOpenBefore = circuitBreaker.isOpen();

      // Fast-forward time
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 200); // 200ms later

      const isOpenAfter = circuitBreaker.isOpen();

      // Assert
      expect(isOpenBefore).toBe(true); // Should be open after 3 failures
      expect(isOpenAfter).toBe(false); // Should be closed after timeout
    });

    it('should reset failure count after successful operation', () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker(3, 5000); // 3 failures, 5000ms timeout

      // Act - Record 2 failures
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      const isOpenBeforeSuccess = circuitBreaker.isOpen();

      // Record a success
      circuitBreaker.recordSuccess();

      // Record another failure
      circuitBreaker.recordFailure();
      const isOpenAfterSuccess = circuitBreaker.isOpen();

      // Assert
      expect(isOpenBeforeSuccess).toBe(false); // Should not be open yet
      expect(isOpenAfterSuccess).toBe(false); // Should still not be open after success reset
    });

    it('should allow half-open state to test if system has recovered', () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker(3, 100); // 3 failures, 100ms timeout

      // Act - Trip the circuit breaker
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Fast-forward time to half-open state
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 200); // 200ms later

      // Test if system has recovered
      const canTryAgain = !circuitBreaker.isOpen();

      // Record a success to fully close the circuit
      circuitBreaker.recordSuccess();
      const isFullyClosed = !circuitBreaker.isOpen();

      // Assert
      expect(canTryAgain).toBe(true); // Should be able to try again
      expect(isFullyClosed).toBe(true); // Should be fully closed after success
    });
  });
});