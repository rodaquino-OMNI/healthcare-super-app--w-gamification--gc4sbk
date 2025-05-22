/**
 * @file Test Helpers Index
 * 
 * This barrel file exports all test helper utilities for event testing from a single import point.
 * It simplifies the import experience for test files by centralizing access to all testing utilities,
 * factories, and setup functions. This enables more readable test files and enforces consistent
 * testing patterns across the events package.
 * 
 * @example
 * // Import all needed test helpers with a single import
 * import { 
 *   createMockEvent, 
 *   mockKafkaProducer,
 *   mockEventValidator,
 *   setupTestingModule 
 * } from '../helpers';
 */

// ===================================================================
// Event Factory Helpers
// ===================================================================

/**
 * Creates a mock event with the specified type and optional custom properties.
 * 
 * @param eventType - The type of event to create
 * @param overrides - Optional properties to override defaults
 * @returns A complete mock event object for testing
 * 
 * @example
 * const mockHealthEvent = createMockEvent('HEALTH_METRIC_RECORDED', { 
 *   userId: 'test-user-123',
 *   data: { metricType: 'HEART_RATE', value: 75 }
 * });
 */
export function createMockEvent<T = any>(eventType: string, overrides?: Partial<any>): any {
  return {
    eventId: `test-event-${Date.now()}`,
    type: eventType,
    userId: 'test-user-id',
    timestamp: new Date().toISOString(),
    journey: getJourneyFromEventType(eventType),
    data: {},
    metadata: {
      version: '1.0.0',
      correlationId: `test-correlation-${Date.now()}`,
      source: 'test-service'
    },
    ...overrides
  };
}

/**
 * Creates a batch of mock events for testing batch processing scenarios.
 * 
 * @param eventType - The type of events to create
 * @param count - Number of events to generate
 * @param baseOverrides - Optional base properties to apply to all events
 * @returns An array of mock events
 * 
 * @example
 * const mockEvents = createMockEventBatch('APPOINTMENT_BOOKED', 5, { journey: 'care' });
 */
export function createMockEventBatch<T = any>(
  eventType: string, 
  count: number, 
  baseOverrides?: Partial<any>
): any[] {
  return Array.from({ length: count }, (_, index) => {
    return createMockEvent(eventType, {
      eventId: `test-event-batch-${index}-${Date.now()}`,
      ...baseOverrides
    });
  });
}

/**
 * Helper function to determine journey from event type
 * @internal
 */
function getJourneyFromEventType(eventType: string): string {
  if (eventType.startsWith('HEALTH_')) return 'health';
  if (eventType.startsWith('CARE_')) return 'care';
  if (eventType.startsWith('PLAN_')) return 'plan';
  if (eventType.startsWith('GAME_')) return 'gamification';
  return 'common';
}

// ===================================================================
// Journey-Specific Event Factories
// ===================================================================

/**
 * Creates a mock health journey event for testing.
 * 
 * @param eventType - The specific health event type
 * @param overrides - Optional properties to override defaults
 * @returns A mock health journey event
 * 
 * @example
 * const mockHealthMetricEvent = createMockHealthEvent('HEALTH_METRIC_RECORDED', {
 *   data: {
 *     metricType: 'BLOOD_PRESSURE',
 *     systolic: 120,
 *     diastolic: 80
 *   }
 * });
 */
export function createMockHealthEvent<T = any>(eventType: string, overrides?: Partial<any>): any {
  return createMockEvent(eventType, {
    journey: 'health',
    ...overrides
  });
}

/**
 * Creates a mock care journey event for testing.
 * 
 * @param eventType - The specific care event type
 * @param overrides - Optional properties to override defaults
 * @returns A mock care journey event
 * 
 * @example
 * const mockAppointmentEvent = createMockCareEvent('CARE_APPOINTMENT_BOOKED', {
 *   data: {
 *     providerId: 'provider-123',
 *     appointmentDate: '2025-06-15T10:30:00Z',
 *     specialtyId: 'cardiology'
 *   }
 * });
 */
export function createMockCareEvent<T = any>(eventType: string, overrides?: Partial<any>): any {
  return createMockEvent(eventType, {
    journey: 'care',
    ...overrides
  });
}

/**
 * Creates a mock plan journey event for testing.
 * 
 * @param eventType - The specific plan event type
 * @param overrides - Optional properties to override defaults
 * @returns A mock plan journey event
 * 
 * @example
 * const mockClaimEvent = createMockPlanEvent('PLAN_CLAIM_SUBMITTED', {
 *   data: {
 *     claimType: 'medical',
 *     amount: 150.75,
 *     currency: 'BRL',
 *     documentIds: ['doc-123', 'doc-456']
 *   }
 * });
 */
export function createMockPlanEvent<T = any>(eventType: string, overrides?: Partial<any>): any {
  return createMockEvent(eventType, {
    journey: 'plan',
    ...overrides
  });
}

// ===================================================================
// Kafka Testing Utilities
// ===================================================================

/**
 * Creates a mock Kafka producer for testing event production.
 * 
 * @returns A mock Kafka producer with spied methods
 * 
 * @example
 * const mockProducer = mockKafkaProducer();
 * await service.sendEvent(testEvent);
 * expect(mockProducer.send).toHaveBeenCalledWith(
 *   expect.objectContaining({ topic: 'health.events' })
 * );
 */
export function mockKafkaProducer() {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue({ success: true }),
    sendBatch: jest.fn().mockResolvedValue({ success: true }),
    isConnected: jest.fn().mockReturnValue(true),
    on: jest.fn(),
    transaction: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({ success: true }),
      commit: jest.fn().mockResolvedValue(undefined),
      abort: jest.fn().mockResolvedValue(undefined),
    })),
  };
}

/**
 * Creates a mock Kafka consumer for testing event consumption.
 * 
 * @param options - Configuration options for the mock consumer
 * @returns A mock Kafka consumer with spied methods
 * 
 * @example
 * const mockConsumer = mockKafkaConsumer();
 * await service.startConsumer();
 * expect(mockConsumer.subscribe).toHaveBeenCalledWith({ topic: 'health.events' });
 */
export function mockKafkaConsumer(options?: { autoTriggerMessages?: boolean }) {
  const messageListeners: Array<(payload: any) => void> = [];
  
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockImplementation((config: any) => {
      if (config && config.eachMessage && typeof config.eachMessage === 'function') {
        messageListeners.push(config.eachMessage);
      }
      return Promise.resolve();
    }),
    stop: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    resume: jest.fn(),
    seek: jest.fn(),
    on: jest.fn(),
    // Helper method to simulate message receipt in tests
    simulateMessage: (message: any) => {
      messageListeners.forEach(listener => {
        listener({
          topic: message.topic || 'test-topic',
          partition: message.partition || 0,
          message: {
            key: message.key || null,
            value: message.value ? 
              (typeof message.value === 'string' ? message.value : JSON.stringify(message.value)) : 
              null,
            headers: message.headers || {},
            timestamp: message.timestamp || Date.now().toString(),
            offset: message.offset || '0',
          },
        });
      });
    },
  };
  
  return mockConsumer;
}

// ===================================================================
// Validation Testing Helpers
// ===================================================================

/**
 * Creates a mock event validator for testing validation logic.
 * 
 * @param validateFn - Optional function to customize validation behavior
 * @returns A mock validator with spied methods
 * 
 * @example
 * const mockValidator = mockEventValidator(event => {
 *   if (!event.userId) return { valid: false, errors: ['Missing userId'] };
 *   return { valid: true };
 * });
 * 
 * await service.processEvent(invalidEvent);
 * expect(mockValidator.validate).toHaveBeenCalled();
 */
export function mockEventValidator(validateFn?: (event: any) => { valid: boolean, errors?: string[] }) {
  return {
    validate: jest.fn().mockImplementation(event => {
      if (validateFn) {
        return validateFn(event);
      }
      return { valid: true };
    }),
    validateSchema: jest.fn().mockImplementation(event => {
      if (validateFn) {
        return validateFn(event);
      }
      return { valid: true };
    }),
  };
}

/**
 * Creates a mock schema registry for testing schema validation.
 * 
 * @param schemas - Optional map of schema IDs to schema definitions
 * @returns A mock schema registry with spied methods
 * 
 * @example
 * const mockRegistry = mockSchemaRegistry({
 *   'health-metric-v1': { /* schema definition */ }
 * });
 * 
 * await service.validateEvent(event);
 * expect(mockRegistry.getSchema).toHaveBeenCalledWith('health-metric-v1');
 */
export function mockSchemaRegistry(schemas?: Record<string, any>) {
  const schemaMap = schemas || {};
  
  return {
    getSchema: jest.fn().mockImplementation((schemaId: string) => {
      return schemaMap[schemaId] || null;
    }),
    registerSchema: jest.fn().mockImplementation((schemaId: string, schema: any) => {
      schemaMap[schemaId] = schema;
      return { id: schemaId };
    }),
    validateAgainstSchema: jest.fn().mockReturnValue({ valid: true }),
  };
}

// ===================================================================
// Error Testing Utilities
// ===================================================================

/**
 * Creates a mock error handler for testing error handling logic.
 * 
 * @param handleFn - Optional function to customize error handling behavior
 * @returns A mock error handler with spied methods
 * 
 * @example
 * const mockErrorHandler = mockEventErrorHandler();
 * await service.processEventWithErrorHandling(event);
 * expect(mockErrorHandler.handleError).toHaveBeenCalled();
 */
export function mockEventErrorHandler(handleFn?: (error: Error, event: any) => any) {
  return {
    handleError: jest.fn().mockImplementation((error: Error, event: any) => {
      if (handleFn) {
        return handleFn(error, event);
      }
      return { handled: true, retryable: false };
    }),
    isRetryable: jest.fn().mockReturnValue(false),
    getRetryDelay: jest.fn().mockReturnValue(1000),
    logError: jest.fn(),
  };
}

/**
 * Creates a mock dead letter queue (DLQ) service for testing error scenarios.
 * 
 * @returns A mock DLQ service with spied methods
 * 
 * @example
 * const mockDlq = mockDeadLetterQueue();
 * await service.processEventWithRetries(event);
 * expect(mockDlq.sendToDlq).toHaveBeenCalledWith(
 *   expect.objectContaining({ event, error: expect.any(Error) })
 * );
 */
export function mockDeadLetterQueue() {
  return {
    sendToDlq: jest.fn().mockResolvedValue({ success: true }),
    retrieveFromDlq: jest.fn().mockResolvedValue([]),
    reprocessEvent: jest.fn().mockResolvedValue({ success: true }),
    getFailedEvents: jest.fn().mockResolvedValue([]),
  };
}

// ===================================================================
// Versioning Test Utilities
// ===================================================================

/**
 * Creates a mock version detector for testing version detection logic.
 * 
 * @param detectFn - Optional function to customize version detection behavior
 * @returns A mock version detector with spied methods
 * 
 * @example
 * const mockDetector = mockVersionDetector(event => '2.0.0');
 * await service.processVersionedEvent(event);
 * expect(mockDetector.detectVersion).toHaveBeenCalledWith(event);
 */
export function mockVersionDetector(detectFn?: (event: any) => string) {
  return {
    detectVersion: jest.fn().mockImplementation(event => {
      if (detectFn) {
        return detectFn(event);
      }
      return '1.0.0';
    }),
    detectFromHeader: jest.fn().mockReturnValue('1.0.0'),
    detectFromField: jest.fn().mockReturnValue('1.0.0'),
    detectFromStructure: jest.fn().mockReturnValue('1.0.0'),
  };
}

/**
 * Creates a mock version transformer for testing version transformation logic.
 * 
 * @param transformFn - Optional function to customize transformation behavior
 * @returns A mock transformer with spied methods
 * 
 * @example
 * const mockTransformer = mockVersionTransformer();
 * await service.upgradeEventVersion(oldEvent);
 * expect(mockTransformer.transform).toHaveBeenCalledWith(
 *   oldEvent, '1.0.0', '2.0.0'
 * );
 */
export function mockVersionTransformer(transformFn?: (event: any, fromVersion: string, toVersion: string) => any) {
  return {
    transform: jest.fn().mockImplementation((event, fromVersion, toVersion) => {
      if (transformFn) {
        return transformFn(event, fromVersion, toVersion);
      }
      return { ...event, metadata: { ...event.metadata, version: toVersion } };
    }),
    canTransform: jest.fn().mockReturnValue(true),
    getTransformationPath: jest.fn().mockImplementation((fromVersion, toVersion) => {
      return [fromVersion, toVersion];
    }),
  };
}

// ===================================================================
// NestJS Testing Utilities
// ===================================================================

/**
 * Creates a test module for NestJS-based event services and controllers.
 * 
 * @param options - Configuration options for the test module
 * @returns A configured test module builder
 * 
 * @example
 * const moduleRef = await setupTestingModule({
 *   providers: [EventsService],
 *   mocks: {
 *     KafkaService: mockKafkaService(),
 *     EventValidator: mockEventValidator(),
 *   }
 * }).compile();
 * 
 * const service = moduleRef.get(EventsService);
 */
export function setupTestingModule(options: {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
  mocks?: Record<string, any>;
}) {
  const { imports = [], controllers = [], providers = [], mocks = {} } = options;
  
  const mockProviders = Object.entries(mocks).map(([key, value]) => ({
    provide: key,
    useValue: value,
  }));
  
  // This is a placeholder - in a real implementation, this would use
  // NestJS's Test utilities, but we're keeping it simple for this example
  return {
    imports,
    controllers,
    providers: [...providers, ...mockProviders],
    compile: () => Promise.resolve({
      get: (token: any) => {
        if (typeof token === 'string' && mocks[token]) {
          return mocks[token];
        }
        // This is simplified - a real implementation would return the actual provider
        return {};
      },
      close: () => Promise.resolve(),
    }),
  };
}

// ===================================================================
// Utility Helpers
// ===================================================================

/**
 * Waits for a specified time period in tests.
 * 
 * @param ms - Milliseconds to wait
 * @returns A promise that resolves after the specified time
 * 
 * @example
 * // Wait for retry delay
 * await wait(1000);
 * expect(service.retryEvent).toHaveBeenCalled();
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock logger for testing logging behavior.
 * 
 * @returns A mock logger with spied methods
 * 
 * @example
 * const mockLogger = mockEventLogger();
 * await service.processEvent(event);
 * expect(mockLogger.info).toHaveBeenCalledWith(
 *   expect.stringContaining('Processing event'),
 *   expect.objectContaining({ eventId: event.eventId })
 * );
 */
export function mockEventLogger() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
  };
}

/**
 * Creates a mock correlation ID provider for testing distributed tracing.
 * 
 * @param idFn - Optional function to customize ID generation
 * @returns A mock correlation ID provider with spied methods
 * 
 * @example
 * const mockCorrelationProvider = mockCorrelationIdProvider();
 * await service.processEvent(event);
 * expect(mockCorrelationProvider.getCorrelationId).toHaveBeenCalled();
 */
export function mockCorrelationIdProvider(idFn?: () => string) {
  return {
    getCorrelationId: jest.fn().mockImplementation(() => {
      if (idFn) {
        return idFn();
      }
      return `test-correlation-${Date.now()}`;
    }),
    setCorrelationId: jest.fn(),
    clearCorrelationId: jest.fn(),
    withCorrelationId: jest.fn().mockImplementation((correlationId, fn) => fn()),
  };
}