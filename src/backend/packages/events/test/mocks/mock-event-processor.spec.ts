import { MockEventProcessor, MockEventProcessorOptions } from './mock-event-processor';
import { IBaseEvent } from '../../src/interfaces/base-event.interface';
import { IEventHandler } from '../../src/interfaces/event-handler.interface';
import { IEventValidator } from '../../src/interfaces/event-validation.interface';

/**
 * This file demonstrates how to use the MockEventProcessor in tests.
 * It provides examples of common testing scenarios and patterns.
 */
describe('MockEventProcessor', () => {
  // Sample event for testing
  const createSampleEvent = (type: string = 'TEST_EVENT'): IBaseEvent => ({
    eventId: 'test-event-id',
    type,
    timestamp: new Date().toISOString(),
    source: 'test',
    payload: { data: 'test-data' },
  });

  // Sample event with journey information
  const createJourneyEvent = (journey: string, type: string) => ({
    ...createSampleEvent(type),
    journey,
  });

  // Sample event handler implementation
  const createTestHandler = (eventType: string): IEventHandler<any> => ({
    handle: jest.fn().mockResolvedValue({ processed: true }),
    canHandle: (event: IBaseEvent) => event.type === eventType,
    getEventType: () => eventType,
  });

  // Sample validator implementation
  const createTestValidator = (shouldPass: boolean = true): IEventValidator => ({
    validate: jest.fn().mockResolvedValue({
      valid: shouldPass,
      errors: shouldPass ? undefined : ['Validation error'],
    }),
  });

  describe('Basic event processing', () => {
    it('should process an event successfully', async () => {
      // Create a handler for the test event
      const handler = createTestHandler('TEST_EVENT');
      
      // Create the processor with the handler
      const processor = new MockEventProcessor({
        handlers: [handler],
      });

      // Process a test event
      const event = createSampleEvent();
      const result = await processor.processEvent(event);

      // Verify the result
      expect(result.success).toBe(true);
      expect(handler.handle).toHaveBeenCalledWith(event);
    });

    it('should fail when no handler is registered for the event type', async () => {
      // Create a processor with no handlers
      const processor = new MockEventProcessor();

      // Process a test event
      const event = createSampleEvent();
      const result = await processor.processEvent(event);

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HANDLER_NOT_FOUND');
    });
  });

  describe('Event validation', () => {
    it('should validate events before processing', async () => {
      // Create a validator that passes
      const validator = createTestValidator(true);
      
      // Create a handler for the test event
      const handler = createTestHandler('TEST_EVENT');
      
      // Create the processor with validation enabled
      const processor = new MockEventProcessor({
        validateEvents: true,
        validators: [validator],
        handlers: [handler],
      });

      // Process a test event
      const event = createSampleEvent();
      const result = await processor.processEvent(event);

      // Verify the result
      expect(result.success).toBe(true);
      expect(validator.validate).toHaveBeenCalledWith(event);
      expect(handler.handle).toHaveBeenCalledWith(event);
    });

    it('should fail when validation fails', async () => {
      // Create a validator that fails
      const validator = createTestValidator(false);
      
      // Create a handler for the test event
      const handler = createTestHandler('TEST_EVENT');
      
      // Create the processor with validation enabled
      const processor = new MockEventProcessor({
        validateEvents: true,
        validators: [validator],
        handlers: [handler],
      });

      // Process a test event
      const event = createSampleEvent();
      const result = await processor.processEvent(event);

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(validator.validate).toHaveBeenCalledWith(event);
      expect(handler.handle).not.toHaveBeenCalled();
    });
  });

  describe('Retry mechanism', () => {
    it('should retry failed events with exponential backoff', async () => {
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      // Create a handler that fails on first call but succeeds on retry
      const handler = createTestHandler('TEST_EVENT');
      const handleSpy = jest.spyOn(handler, 'handle');
      
      // First call fails, second succeeds
      handleSpy.mockImplementationOnce(() => {
        throw new Error('Processing failed');
      });
      
      // Create the processor with the handler
      const processor = new MockEventProcessor({
        handlers: [handler],
        maxRetryAttempts: 3,
        asyncProcessing: false, // Use synchronous processing for easier testing
      });

      // Process a test event
      const event = createSampleEvent();
      const result = await processor.processEvent(event);

      // Fast-forward timers to trigger retry
      jest.runAllTimers();

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROCESSING_RETRY');
      expect(result.retryCount).toBe(1);
      
      // Verify metrics
      const metrics = processor.getMetrics();
      expect(metrics.retriedEvents).toBe(1);
      
      // Restore timers
      jest.useRealTimers();
    });

    it('should move events to dead letter after max retries', async () => {
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      // Create a handler that always fails
      const handler = createTestHandler('TEST_EVENT');
      const handleSpy = jest.spyOn(handler, 'handle');
      
      // Always throw an error
      handleSpy.mockImplementation(() => {
        throw new Error('Processing failed');
      });
      
      // Create the processor with the handler
      const processor = new MockEventProcessor({
        handlers: [handler],
        maxRetryAttempts: 2,
        asyncProcessing: false, // Use synchronous processing for easier testing
      });

      // Process a test event
      const event = createSampleEvent();
      let result = await processor.processEvent(event);
      
      // First retry
      jest.runAllTimers();
      
      // Second retry (exceeds max)
      jest.runAllTimers();

      // Get the final result from the dead letter queue
      const deadLetterEvents = processor.getDeadLetterEvents();

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(1);
      expect(deadLetterEvents.length).toBe(1);
      expect(deadLetterEvents[0].eventId).toBe(event.eventId);
      
      // Verify metrics
      const metrics = processor.getMetrics();
      expect(metrics.deadLetterEvents).toBe(1);
      
      // Restore timers
      jest.useRealTimers();
    });
  });

  describe('Batch processing', () => {
    it('should process multiple events in a batch', async () => {
      // Create handlers for different event types
      const handler1 = createTestHandler('EVENT_TYPE_1');
      const handler2 = createTestHandler('EVENT_TYPE_2');
      
      // Create the processor with the handlers
      const processor = new MockEventProcessor({
        handlers: [handler1, handler2],
      });

      // Create a batch of events
      const events = [
        createSampleEvent('EVENT_TYPE_1'),
        createSampleEvent('EVENT_TYPE_2'),
      ];
      
      // Process the batch
      const results = await processor.processBatch(events);

      // Verify the results
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(handler1.handle).toHaveBeenCalledWith(events[0]);
      expect(handler2.handle).toHaveBeenCalledWith(events[1]);
    });

    it('should support transactions for batch processing', async () => {
      // Create handlers for different event types
      const handler1 = createTestHandler('EVENT_TYPE_1');
      const handler2 = createTestHandler('EVENT_TYPE_2');
      
      // Create the processor with transactions enabled
      const processor = new MockEventProcessor({
        handlers: [handler1, handler2],
        enableTransactions: true,
      });

      // Create a transaction listener
      const transactionCommittedSpy = jest.fn();
      processor.on('transactionCommitted', transactionCommittedSpy);

      // Create a batch of events
      const events = [
        createSampleEvent('EVENT_TYPE_1'),
        createSampleEvent('EVENT_TYPE_2'),
      ];
      
      // Process the batch with a transaction
      const results = await processor.processBatch(events, true);

      // Verify the results
      expect(results.length).toBe(2);
      expect(results.every(r => r.success)).toBe(true);
      expect(transactionCommittedSpy).toHaveBeenCalled();
    });
  });

  describe('Metrics collection', () => {
    it('should collect metrics during processing', async () => {
      // Create handlers for different event types
      const handler1 = createTestHandler('HEALTH_EVENT');
      const handler2 = createTestHandler('CARE_EVENT');
      const handler3 = createTestHandler('PLAN_EVENT');
      
      // Create the processor with metrics collection enabled
      const processor = new MockEventProcessor({
        handlers: [handler1, handler2, handler3],
        collectMetrics: true,
      });

      // Process events from different journeys
      await processor.processEvent(createJourneyEvent('health', 'HEALTH_EVENT'));
      await processor.processEvent(createJourneyEvent('care', 'CARE_EVENT'));
      await processor.processEvent(createJourneyEvent('plan', 'PLAN_EVENT'));

      // Verify the metrics
      const metrics = processor.getMetrics();
      expect(metrics.totalEventsReceived).toBe(3);
      expect(metrics.successfullyProcessed).toBe(3);
      expect(metrics.eventsByJourney).toEqual({
        health: 1,
        care: 1,
        plan: 1,
      });
      expect(metrics.eventsByType).toEqual({
        HEALTH_EVENT: 1,
        CARE_EVENT: 1,
        PLAN_EVENT: 1,
      });
    });

    it('should reset metrics when requested', async () => {
      // Create a handler
      const handler = createTestHandler('TEST_EVENT');
      
      // Create the processor with metrics collection enabled
      const processor = new MockEventProcessor({
        handlers: [handler],
        collectMetrics: true,
      });

      // Process some events
      await processor.processEvent(createSampleEvent());
      await processor.processEvent(createSampleEvent());

      // Verify initial metrics
      let metrics = processor.getMetrics();
      expect(metrics.totalEventsReceived).toBe(2);

      // Reset metrics
      processor.resetMetrics();

      // Verify metrics are reset
      metrics = processor.getMetrics();
      expect(metrics.totalEventsReceived).toBe(0);
      expect(metrics.successfullyProcessed).toBe(0);
    });
  });
});