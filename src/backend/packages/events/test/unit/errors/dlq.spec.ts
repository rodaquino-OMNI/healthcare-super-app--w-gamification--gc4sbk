import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { DlqService, DlqEntry, DlqEntryMetadata } from '../../../src/errors/dlq';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { JourneyType } from '../../../src/interfaces/journey-events.interface';
import { 
  healthEvents, 
  careEvents, 
  planEvents, 
  dlqEntries, 
  createDlqEntry 
} from './fixtures';
import { 
  MockDlqProducer, 
  MockDlqConsumer, 
  createMockProcessingError,
  createMockExternalSystemError,
  createMockDatabaseError,
  createMockValidationError,
  createTestEvent
} from './mocks';

// Mock implementations
class MockKafkaService {
  private readonly sentMessages: Record<string, any[]> = {};
  private readonly mockMessages: Record<string, any[]> = {};
  private shouldFailProduce = false;
  private shouldFailConsume = false;

  async produce(params: { topic: string; messages: any[] }): Promise<void> {
    if (this.shouldFailProduce) {
      throw new Error('Failed to produce message to Kafka');
    }

    if (!this.sentMessages[params.topic]) {
      this.sentMessages[params.topic] = [];
    }

    this.sentMessages[params.topic].push(...params.messages);
    return Promise.resolve();
  }

  async consumeBatch(topic: string, groupId: string, limit: number): Promise<any[]> {
    if (this.shouldFailConsume) {
      throw new Error('Failed to consume messages from Kafka');
    }

    const messages = this.mockMessages[topic] || [];
    return messages.slice(0, limit).map(message => ({
      key: message.key,
      value: Buffer.from(message.value),
      headers: message.headers || {}
    }));
  }

  // Test helper methods
  getSentMessages(topic: string): any[] {
    return this.sentMessages[topic] || [];
  }

  getAllSentMessages(): Record<string, any[]> {
    return { ...this.sentMessages };
  }

  setMockMessages(topic: string, messages: any[]): void {
    this.mockMessages[topic] = messages;
  }

  setShouldFailProduce(shouldFail: boolean): void {
    this.shouldFailProduce = shouldFail;
  }

  setShouldFailConsume(shouldFail: boolean): void {
    this.shouldFailConsume = shouldFail;
  }

  clearSentMessages(): void {
    Object.keys(this.sentMessages).forEach(key => {
      this.sentMessages[key] = [];
    });
  }
}

class MockLoggerService {
  logs: any[] = [];
  warnings: any[] = [];
  errors: any[] = [];

  setContext(): void {}
  log(message: string, context?: any): void {
    this.logs.push({ message, context });
  }
  warn(message: string, context?: any): void {
    this.warnings.push({ message, context });
  }
  error(message: string, trace?: string, context?: any): void {
    this.errors.push({ message, trace, context });
  }

  // Test helper methods
  getLogs(): any[] {
    return [...this.logs];
  }
  getWarnings(): any[] {
    return [...this.warnings];
  }
  getErrors(): any[] {
    return [...this.errors];
  }
  clearLogs(): void {
    this.logs = [];
    this.warnings = [];
    this.errors = [];
  }
}

class MockTracingService {
  startSpan(name: string): any {
    return {
      end: jest.fn(),
    };
  }

  getTraceContext(): { traceId: string; spanId: string } | null {
    return {
      traceId: 'mock-trace-id',
      spanId: 'mock-span-id',
    };
  }
}

class MockConfigService {
  private readonly configs: Record<string, any> = {
    'kafka.dlqTopicPrefix': 'dlq-',
    'kafka.defaultDlqTopic': 'dlq-events',
  };

  get<T>(key: string, defaultValue?: T): T {
    return (this.configs[key] !== undefined ? this.configs[key] : defaultValue) as T;
  }

  // Test helper methods
  setConfig(key: string, value: any): void {
    this.configs[key] = value;
  }
}

describe('DlqService', () => {
  let dlqService: DlqService;
  let kafkaService: MockKafkaService;
  let loggerService: MockLoggerService;
  let configService: MockConfigService;
  let module: TestingModule;

  beforeEach(async () => {
    kafkaService = new MockKafkaService();
    loggerService = new MockLoggerService();
    configService = new MockConfigService();

    module = await Test.createTestingModule({
      providers: [
        DlqService,
        { provide: KafkaService, useValue: kafkaService },
        { provide: LoggerService, useValue: loggerService },
        { provide: TracingService, useValue: new MockTracingService() },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    dlqService = module.get<DlqService>(DlqService);
  });

  afterEach(() => {
    kafkaService.clearSentMessages();
    loggerService.clearLogs();
  });

  describe('sendToDlq', () => {
    it('should send a failed event to the appropriate DLQ topic based on journey', async () => {
      // Test with events from different journeys
      const healthEvent = healthEvents.metricRecorded;
      const careEvent = careEvents.appointmentBooked;
      const planEvent = planEvents.claimSubmitted;

      const error = new Error('Test error');

      // Send each event to DLQ
      await dlqService.sendToDlq(healthEvent, error);
      await dlqService.sendToDlq(careEvent, error);
      await dlqService.sendToDlq(planEvent, error);

      // Verify messages were sent to the correct topics
      expect(kafkaService.getSentMessages('dlq-health')).toHaveLength(1);
      expect(kafkaService.getSentMessages('dlq-care')).toHaveLength(1);
      expect(kafkaService.getSentMessages('dlq-plan')).toHaveLength(1);

      // Verify the message content for one of the events
      const healthDlqMessage = kafkaService.getSentMessages('dlq-health')[0];
      expect(healthDlqMessage.key).toBe(healthEvent.eventId);
      
      const healthDlqEntry = JSON.parse(healthDlqMessage.value);
      expect(healthDlqEntry.originalEvent.eventId).toBe(healthEvent.eventId);
      expect(healthDlqEntry.metadata.errorMessage).toBe(error.message);
      expect(healthDlqEntry.metadata.journey).toBe('health');
    });

    it('should use the default DLQ topic when journey cannot be determined', async () => {
      // Create an event without a journey
      const eventWithoutJourney: BaseEvent = {
        eventId: 'no-journey-event',
        type: 'unknown.event',
        timestamp: new Date().toISOString(),
        source: 'unknown-service',
        version: '1.0.0',
        payload: {},
      };

      const error = new Error('Test error');

      // Send to DLQ
      await dlqService.sendToDlq(eventWithoutJourney, error);

      // Verify message was sent to the default topic
      expect(kafkaService.getSentMessages('dlq-events')).toHaveLength(1);
      
      const dlqMessage = kafkaService.getSentMessages('dlq-events')[0];
      expect(dlqMessage.key).toBe(eventWithoutJourney.eventId);
    });

    it('should correctly classify different types of errors', async () => {
      const event = healthEvents.metricRecorded;
      
      // Test with different error types
      const validationError = createMockValidationError('Validation failed');
      const processingError = createMockProcessingError('Processing failed');
      const databaseError = createMockDatabaseError('Database error');
      const externalError = createMockExternalSystemError('External system error');

      // Send each error type to DLQ
      await dlqService.sendToDlq(event, validationError);
      await dlqService.sendToDlq(event, processingError);
      await dlqService.sendToDlq(event, databaseError);
      await dlqService.sendToDlq(event, externalError);

      // Verify all messages were sent to the health DLQ
      expect(kafkaService.getSentMessages('dlq-health')).toHaveLength(4);

      // Verify error classification in headers
      const messages = kafkaService.getSentMessages('dlq-health');
      
      // Validation errors should be classified as client errors
      expect(messages[0].headers['error-type']).toBe('client');
      
      // Processing errors should be classified as system errors
      expect(messages[1].headers['error-type']).toBe('system');
      
      // Database errors should be classified as transient errors
      expect(messages[2].headers['error-type']).toBe('transient');
      
      // External system errors should be classified as external errors
      expect(messages[3].headers['error-type']).toBe('external');
    });

    it('should include retry history when provided', async () => {
      const event = careEvents.telemedicineStarted;
      const error = new Error('External service unavailable');
      
      // Create retry history
      const retryHistory: DlqEntryMetadata['retryHistory'] = [
        {
          timestamp: new Date(Date.now() - 10000).toISOString(),
          errorMessage: 'External service unavailable',
          attempt: 1,
        },
        {
          timestamp: new Date(Date.now() - 5000).toISOString(),
          errorMessage: 'External service unavailable',
          attempt: 2,
        },
      ];

      // Send to DLQ with retry history
      await dlqService.sendToDlq(event, error, retryHistory);

      // Verify message was sent
      expect(kafkaService.getSentMessages('dlq-care')).toHaveLength(1);
      
      // Verify retry history is included
      const dlqMessage = kafkaService.getSentMessages('dlq-care')[0];
      const dlqEntry = JSON.parse(dlqMessage.value);
      
      expect(dlqEntry.metadata.retryHistory).toHaveLength(2);
      expect(dlqEntry.metadata.retryHistory[0].attempt).toBe(1);
      expect(dlqEntry.metadata.retryHistory[1].attempt).toBe(2);
    });

    it('should include tracing information when available', async () => {
      const event = planEvents.benefitUsed;
      const error = new Error('Test error');

      // Send to DLQ
      await dlqService.sendToDlq(event, error);

      // Verify tracing headers are included
      const dlqMessage = kafkaService.getSentMessages('dlq-plan')[0];
      
      expect(dlqMessage.headers['trace-id']).toBe('mock-trace-id');
      expect(dlqMessage.headers['span-id']).toBe('mock-span-id');
      
      // Verify tracing info is in the metadata
      const dlqEntry = JSON.parse(dlqMessage.value);
      expect(dlqEntry.metadata['traceId']).toBe('mock-trace-id');
      expect(dlqEntry.metadata['spanId']).toBe('mock-span-id');
    });

    it('should log successful DLQ operations', async () => {
      const event = healthEvents.goalAchieved;
      const error = new Error('Test error');

      // Send to DLQ
      await dlqService.sendToDlq(event, error);

      // Verify logging
      const logs = loggerService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const dlqLog = logs.find(log => 
        log.message.includes('sent to DLQ') && 
        log.context.eventId === event.eventId
      );
      
      expect(dlqLog).toBeDefined();
      expect(dlqLog.context.dlqTopic).toBe('dlq-health');
    });

    it('should handle errors during DLQ operations and return false', async () => {
      const event = careEvents.medicationTaken;
      const error = new Error('Test error');

      // Configure Kafka to fail
      kafkaService.setShouldFailProduce(true);

      // Attempt to send to DLQ
      const result = await dlqService.sendToDlq(event, error);

      // Verify result is false
      expect(result).toBe(false);

      // Verify error was logged
      const errors = loggerService.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      const dlqError = errors.find(err => 
        err.message.includes('Failed to send event') && 
        err.context.eventId === event.eventId
      );
      
      expect(dlqError).toBeDefined();
    });
  });

  describe('getEntries', () => {
    beforeEach(() => {
      // Set up mock DLQ messages for different journeys
      const healthDlqMessages = [
        {
          key: healthEvents.metricRecorded.eventId,
          value: JSON.stringify(dlqEntries.healthValidationError),
          headers: { 'event-type': 'dlq-entry' }
        },
        {
          key: healthEvents.goalAchieved.eventId,
          value: JSON.stringify(createDlqEntry(healthEvents.goalAchieved, 'Goal validation failed', 'client')),
          headers: { 'event-type': 'dlq-entry' }
        }
      ];

      const careDlqMessages = [
        {
          key: careEvents.telemedicineStarted.eventId,
          value: JSON.stringify(dlqEntries.careExternalError),
          headers: { 'event-type': 'dlq-entry' }
        }
      ];

      const planDlqMessages = [
        {
          key: planEvents.claimSubmitted.eventId,
          value: JSON.stringify(dlqEntries.planDatabaseError),
          headers: { 'event-type': 'dlq-entry' }
        },
        {
          key: planEvents.benefitUsed.eventId,
          value: JSON.stringify(createDlqEntry(planEvents.benefitUsed, 'Benefit processing error', 'system')),
          headers: { 'event-type': 'dlq-entry' }
        }
      ];

      // Set up mock messages in Kafka service
      kafkaService.setMockMessages('dlq-health', healthDlqMessages);
      kafkaService.setMockMessages('dlq-care', careDlqMessages);
      kafkaService.setMockMessages('dlq-plan', planDlqMessages);
      kafkaService.setMockMessages('dlq-events', [...healthDlqMessages, ...careDlqMessages, ...planDlqMessages]);
    });

    it('should retrieve entries from a specific journey DLQ', async () => {
      // Get entries for health journey
      const healthEntries = await dlqService.getEntries('health');
      
      // Verify correct entries were retrieved
      expect(healthEntries).toHaveLength(2);
      expect(healthEntries[0].originalEvent.eventId).toBe(healthEvents.metricRecorded.eventId);
      expect(healthEntries[1].originalEvent.eventId).toBe(healthEvents.goalAchieved.eventId);
      
      // Get entries for care journey
      const careEntries = await dlqService.getEntries('care');
      
      // Verify correct entries were retrieved
      expect(careEntries).toHaveLength(1);
      expect(careEntries[0].originalEvent.eventId).toBe(careEvents.telemedicineStarted.eventId);
    });

    it('should respect the limit parameter', async () => {
      // Get entries with limit 1
      const planEntries = await dlqService.getEntries('plan', 1);
      
      // Verify only one entry was retrieved
      expect(planEntries).toHaveLength(1);
    });

    it('should retrieve entries from the default DLQ when no journey is specified', async () => {
      // Get entries without specifying journey
      const allEntries = await dlqService.getEntries();
      
      // Verify all entries were retrieved
      expect(allEntries).toHaveLength(5);
    });

    it('should handle malformed DLQ entries gracefully', async () => {
      // Add a malformed message
      const malformedMessages = [
        {
          key: 'malformed-entry',
          value: '{"not": "valid" JSON',
          headers: { 'event-type': 'dlq-entry' }
        }
      ];
      
      kafkaService.setMockMessages('dlq-health', [
        ...kafkaService.getSentMessages('dlq-health'),
        ...malformedMessages
      ]);

      // Get entries
      const healthEntries = await dlqService.getEntries('health');
      
      // Verify only valid entries were returned
      expect(healthEntries).toHaveLength(2);
      
      // Verify warning was logged
      const warnings = loggerService.getWarnings();
      expect(warnings.some(w => w.message.includes('Failed to parse DLQ entry'))).toBe(true);
    });

    it('should handle errors during retrieval and return empty array', async () => {
      // Configure Kafka to fail
      kafkaService.setShouldFailConsume(true);

      // Attempt to get entries
      const entries = await dlqService.getEntries('health');

      // Verify empty array is returned
      expect(entries).toEqual([]);

      // Verify error was logged
      const errors = loggerService.getErrors();
      expect(errors.some(e => e.message.includes('Failed to retrieve entries from DLQ'))).toBe(true);
    });

    it('should log successful retrieval operations', async () => {
      // Get entries
      await dlqService.getEntries('plan');

      // Verify logging
      const logs = loggerService.getLogs();
      const retrievalLog = logs.find(log => 
        log.message.includes('Retrieved') && 
        log.context.dlqTopic === 'dlq-plan'
      );
      
      expect(retrievalLog).toBeDefined();
      expect(retrievalLog.context.requestedLimit).toBe(100);
    });
  });

  describe('reprocessEntry', () => {
    beforeEach(() => {
      // Set up mock DLQ messages for different journeys
      const healthDlqMessages = [
        {
          key: healthEvents.metricRecorded.eventId,
          value: JSON.stringify(dlqEntries.healthValidationError),
          headers: { 'event-type': 'dlq-entry' }
        }
      ];

      const careDlqMessages = [
        {
          key: careEvents.telemedicineStarted.eventId,
          value: JSON.stringify(dlqEntries.careExternalError),
          headers: { 'event-type': 'dlq-entry' }
        }
      ];

      const planDlqMessages = [
        {
          key: planEvents.claimSubmitted.eventId,
          value: JSON.stringify(dlqEntries.planDatabaseError),
          headers: { 'event-type': 'dlq-entry' }
        }
      ];

      // Set up mock messages in Kafka service
      kafkaService.setMockMessages('dlq-health', healthDlqMessages);
      kafkaService.setMockMessages('dlq-care', careDlqMessages);
      kafkaService.setMockMessages('dlq-plan', planDlqMessages);
    });

    it('should reprocess an entry from the DLQ to its original topic', async () => {
      // Reprocess a health event
      const result = await dlqService.reprocessEntry(healthEvents.metricRecorded.eventId);

      // Verify result is true
      expect(result).toBe(true);

      // Verify message was sent to the original topic
      const sentMessages = kafkaService.getAllSentMessages();
      expect(sentMessages['health-metrics']).toBeDefined();
      expect(sentMessages['health-metrics']).toHaveLength(1);
      
      // Verify the message content
      const reprocessedMessage = sentMessages['health-metrics'][0];
      expect(reprocessedMessage.key).toBe(healthEvents.metricRecorded.eventId);
      
      // Verify headers indicate reprocessing
      expect(reprocessedMessage.headers['reprocessed-from-dlq']).toBe('true');
      expect(reprocessedMessage.headers['original-error']).toBeDefined();
      expect(reprocessedMessage.headers['reprocessed-at']).toBeDefined();
    });

    it('should return false when entry is not found', async () => {
      // Attempt to reprocess a non-existent entry
      const result = await dlqService.reprocessEntry('non-existent-id');

      // Verify result is false
      expect(result).toBe(false);

      // Verify warning was logged
      const warnings = loggerService.getWarnings();
      expect(warnings.some(w => w.message.includes('not found for reprocessing'))).toBe(true);
    });

    it('should return false when original topic cannot be determined', async () => {
      // Create a DLQ entry with an unknown event type
      const unknownEvent = createTestEvent({
        eventId: 'unknown-event',
        eventType: 'unknown.type',
        journey: 'health'
      });
      
      const unknownDlqEntry = createDlqEntry(unknownEvent, 'Unknown event type', 'client');
      
      // Add to mock messages
      kafkaService.setMockMessages('dlq-health', [
        ...kafkaService.getSentMessages('dlq-health'),
        {
          key: unknownEvent.eventId,
          value: JSON.stringify(unknownDlqEntry),
          headers: { 'event-type': 'dlq-entry' }
        }
      ]);

      // Mock the determineOriginalTopic method to return null
      jest.spyOn(DlqService.prototype as any, 'determineOriginalTopic').mockReturnValueOnce(null);

      // Attempt to reprocess
      const result = await dlqService.reprocessEntry(unknownEvent.eventId);

      // Verify result is false
      expect(result).toBe(false);

      // Verify warning was logged
      const warnings = loggerService.getWarnings();
      expect(warnings.some(w => w.message.includes('Could not determine original topic'))).toBe(true);
    });

    it('should handle errors during reprocessing and return false', async () => {
      // Configure Kafka to fail
      kafkaService.setShouldFailProduce(true);

      // Attempt to reprocess
      const result = await dlqService.reprocessEntry(healthEvents.metricRecorded.eventId);

      // Verify result is false
      expect(result).toBe(false);

      // Verify error was logged
      const errors = loggerService.getErrors();
      expect(errors.some(e => e.message.includes('Failed to reprocess DLQ entry'))).toBe(true);
    });

    it('should log successful reprocessing operations', async () => {
      // Reprocess an entry
      await dlqService.reprocessEntry(careEvents.telemedicineStarted.eventId);

      // Verify logging
      const logs = loggerService.getLogs();
      const reprocessLog = logs.find(log => 
        log.message.includes('Reprocessed event') && 
        log.context.eventId === careEvents.telemedicineStarted.eventId
      );
      
      expect(reprocessLog).toBeDefined();
      expect(reprocessLog.context.originalTopic).toBeDefined();
    });
  });

  describe('determineOriginalTopic', () => {
    it('should correctly map health journey events to topics', async () => {
      // Test with different health events
      const metricEvent = healthEvents.metricRecorded;
      const goalEvent = healthEvents.goalAchieved;
      const deviceEvent = healthEvents.deviceConnected;

      // Get the original topics
      const metricTopic = (dlqService as any).determineOriginalTopic(metricEvent);
      const goalTopic = (dlqService as any).determineOriginalTopic(goalEvent);
      const deviceTopic = (dlqService as any).determineOriginalTopic(deviceEvent);

      // Verify correct topics were determined
      expect(metricTopic).toBe('health-metrics');
      expect(goalTopic).toBe('health-achievements');
      expect(deviceTopic).toBe('health-devices');
    });

    it('should correctly map care journey events to topics', async () => {
      // Test with different care events
      const appointmentEvent = careEvents.appointmentBooked;
      const medicationEvent = careEvents.medicationTaken;
      const telemedicineEvent = careEvents.telemedicineStarted;

      // Get the original topics
      const appointmentTopic = (dlqService as any).determineOriginalTopic(appointmentEvent);
      const medicationTopic = (dlqService as any).determineOriginalTopic(medicationEvent);
      const telemedicineTopic = (dlqService as any).determineOriginalTopic(telemedicineEvent);

      // Verify correct topics were determined
      expect(appointmentTopic).toBe('care-appointments');
      expect(medicationTopic).toBe('care-medications');
      expect(telemedicineTopic).toBe('care-telemedicine');
    });

    it('should correctly map plan journey events to topics', async () => {
      // Test with different plan events
      const claimEvent = planEvents.claimSubmitted;
      const benefitEvent = planEvents.benefitUsed;
      const rewardEvent = planEvents.rewardRedeemed;

      // Get the original topics
      const claimTopic = (dlqService as any).determineOriginalTopic(claimEvent);
      const benefitTopic = (dlqService as any).determineOriginalTopic(benefitEvent);
      const rewardTopic = (dlqService as any).determineOriginalTopic(rewardEvent);

      // Verify correct topics were determined
      expect(claimTopic).toBe('plan-claims');
      expect(benefitTopic).toBe('plan-benefits');
      expect(rewardTopic).toBe('plan-rewards');
    });

    it('should fall back to journey-events topic when specific mapping is not found', async () => {
      // Create an event with an unknown type
      const unknownEvent: BaseEvent = {
        eventId: 'unknown-event',
        type: 'health.unknown.type',
        timestamp: new Date().toISOString(),
        source: 'health-service',
        journey: 'health',
        version: '1.0.0',
        payload: {},
      };

      // Get the original topic
      const topic = (dlqService as any).determineOriginalTopic(unknownEvent);

      // Verify fallback topic was used
      expect(topic).toBe('health-events');
    });

    it('should handle common events correctly', async () => {
      // Create common events
      const userEvent: BaseEvent = {
        eventId: 'user-event',
        type: 'user.registered',
        timestamp: new Date().toISOString(),
        source: 'auth-service',
        journey: 'common',
        version: '1.0.0',
        payload: {},
      };

      // Get the original topic
      const topic = (dlqService as any).determineOriginalTopic(userEvent);

      // Verify correct topic was determined
      expect(topic).toBe('user-events');
    });
  });
});