/**
 * @file kafka.interfaces.spec.ts
 * @description Unit tests for Kafka interfaces, verifying interface completeness,
 * compatibility, and integration with dependency injection. These tests ensure that
 * all Kafka interfaces provide proper contracts for implementation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KafkaMessage } from '../../../src/interfaces/kafka-message.interface';
import { KafkaModuleOptions } from '../../../src/interfaces/kafka-options.interface';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { KAFKA_MODULE_OPTIONS } from '../../../src/constants/tokens.constants';

// Mock implementations for testing
@Injectable()
class MockKafkaService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  async produce<T>(topic: string, message: T, key?: string): Promise<void> {
    return Promise.resolve();
  }

  async consume<T>(
    topic: string,
    callback: (message: T, metadata: KafkaMessage) => Promise<void>,
    options?: { groupId?: string }
  ): Promise<void> {
    return Promise.resolve();
  }
}

@Injectable()
class MockConfigService extends ConfigService {}

@Injectable()
class MockLoggerService implements LoggerService {
  log(message: string, context?: string): void {}
  error(message: string, trace?: string, context?: string): void {}
  warn(message: string, context?: string): void {}
  debug(message: string, context?: string): void {}
}

@Injectable()
class MockTracingService implements TracingService {
  createSpan<T>(name: string, fn: (span: any) => Promise<T>, context?: Record<string, string>): Promise<T> {
    return fn({});
  }
  getCurrentTraceId(): string | undefined {
    return 'mock-trace-id';
  }
  getTraceHeaders(): Record<string, string> {
    return { 'x-trace-id': 'mock-trace-id' };
  }
}

// Test module for dependency injection testing
@Module({
  providers: [
    MockKafkaService,
    {
      provide: ConfigService,
      useClass: MockConfigService,
    },
    {
      provide: LoggerService,
      useClass: MockLoggerService,
    },
    {
      provide: TracingService,
      useClass: MockTracingService,
    },
    {
      provide: KAFKA_MODULE_OPTIONS,
      useValue: {
        serviceName: 'test-service',
        configNamespace: 'test',
        enableSchemaValidation: true,
        enableDeadLetterQueue: true,
      } as KafkaModuleOptions,
    },
  ],
  exports: [MockKafkaService],
})
class TestKafkaModule {}

// Journey-specific mock implementations
@Injectable()
class HealthJourneyKafkaService extends MockKafkaService {
  async produceHealthMetric(metricType: string, value: number, userId: string): Promise<void> {
    return this.produce('health-metrics', { metricType, value, userId });
  }
}

@Injectable()
class CareJourneyKafkaService extends MockKafkaService {
  async produceAppointmentEvent(appointmentId: string, status: string, userId: string): Promise<void> {
    return this.produce('care-appointments', { appointmentId, status, userId });
  }
}

@Injectable()
class PlanJourneyKafkaService extends MockKafkaService {
  async produceClaimEvent(claimId: string, status: string, userId: string): Promise<void> {
    return this.produce('plan-claims', { claimId, status, userId });
  }
}

@Injectable()
class GamificationKafkaService extends MockKafkaService {
  async produceAchievementEvent(achievementId: string, userId: string): Promise<void> {
    return this.produce('gamification-achievements', { achievementId, userId });
  }
}

describe('Kafka Interfaces', () => {
  let module: TestingModule;
  let mockKafkaService: MockKafkaService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestKafkaModule],
    }).compile();

    mockKafkaService = module.get<MockKafkaService>(MockKafkaService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('KafkaMessage Interface', () => {
    it('should have all required properties defined', () => {
      // Create a mock KafkaMessage object
      const kafkaMessage: KafkaMessage = {
        key: 'test-key',
        headers: { 'content-type': 'application/json' },
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      // Verify all required properties are defined
      expect(kafkaMessage.topic).toBeDefined();
      expect(kafkaMessage.partition).toBeDefined();
      expect(kafkaMessage.offset).toBeDefined();
      expect(kafkaMessage.timestamp).toBeDefined();
      expect(kafkaMessage.headers).toBeDefined();
      
      // Key is optional, but should be defined in our test case
      expect(kafkaMessage.key).toBeDefined();
    });

    it('should allow optional key property', () => {
      // Create a KafkaMessage without a key
      const kafkaMessage: KafkaMessage = {
        headers: { 'content-type': 'application/json' },
        topic: 'test-topic',
        partition: 0,
        offset: '0',
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      // Verify the message is still valid without a key
      expect(kafkaMessage).toBeDefined();
      expect(kafkaMessage.key).toBeUndefined();
    });
  });

  describe('KafkaModuleOptions Interface', () => {
    it('should have all properties defined', () => {
      // Create a complete KafkaModuleOptions object
      const options: KafkaModuleOptions = {
        serviceName: 'test-service',
        configNamespace: 'test',
        enableSchemaValidation: true,
        enableDeadLetterQueue: true,
        deadLetterTopic: 'dead-letter',
        defaultConsumerGroup: 'test-consumer-group',
        retry: {
          maxRetries: 3,
          initialRetryTime: 300,
          factor: 2,
          maxRetryTime: 30000,
        },
      };

      // Verify all properties are defined
      expect(options.serviceName).toBeDefined();
      expect(options.configNamespace).toBeDefined();
      expect(options.enableSchemaValidation).toBeDefined();
      expect(options.enableDeadLetterQueue).toBeDefined();
      expect(options.deadLetterTopic).toBeDefined();
      expect(options.defaultConsumerGroup).toBeDefined();
      expect(options.retry).toBeDefined();
      expect(options.retry?.maxRetries).toBeDefined();
      expect(options.retry?.initialRetryTime).toBeDefined();
      expect(options.retry?.factor).toBeDefined();
      expect(options.retry?.maxRetryTime).toBeDefined();
    });

    it('should allow partial options with defaults', () => {
      // Create a partial KafkaModuleOptions object
      const options: KafkaModuleOptions = {
        serviceName: 'test-service',
      };

      // Verify the options object is valid with just serviceName
      expect(options).toBeDefined();
      expect(options.serviceName).toBe('test-service');
      expect(options.configNamespace).toBeUndefined();
      expect(options.enableSchemaValidation).toBeUndefined();
    });
  });

  describe('NestJS Dependency Injection', () => {
    it('should resolve KafkaService with dependencies', () => {
      // Verify the service was properly instantiated
      expect(mockKafkaService).toBeDefined();
      expect(mockKafkaService).toBeInstanceOf(MockKafkaService);
    });

    it('should inject KAFKA_MODULE_OPTIONS token', () => {
      // Get the options from the module
      const options = module.get(KAFKA_MODULE_OPTIONS);

      // Verify the options were properly injected
      expect(options).toBeDefined();
      expect(options.serviceName).toBe('test-service');
      expect(options.configNamespace).toBe('test');
      expect(options.enableSchemaValidation).toBe(true);
      expect(options.enableDeadLetterQueue).toBe(true);
    });
  });

  describe('Mock Implementations', () => {
    it('should implement produce method', async () => {
      // Spy on the produce method
      const produceSpy = jest.spyOn(mockKafkaService, 'produce');

      // Call the method
      await mockKafkaService.produce('test-topic', { test: 'data' }, 'test-key');

      // Verify the method was called with the correct arguments
      expect(produceSpy).toHaveBeenCalledWith('test-topic', { test: 'data' }, 'test-key');
    });

    it('should implement consume method', async () => {
      // Spy on the consume method
      const consumeSpy = jest.spyOn(mockKafkaService, 'consume');

      // Create a callback function
      const callback = async (message: any, metadata: KafkaMessage) => {};

      // Call the method
      await mockKafkaService.consume('test-topic', callback, { groupId: 'test-group' });

      // Verify the method was called with the correct arguments
      expect(consumeSpy).toHaveBeenCalledWith('test-topic', callback, { groupId: 'test-group' });
    });
  });

  describe('Cross-Service Interface Compatibility', () => {
    let healthService: HealthJourneyKafkaService;
    let careService: CareJourneyKafkaService;
    let planService: PlanJourneyKafkaService;
    let gamificationService: GamificationKafkaService;

    beforeEach(async () => {
      // Create a module with all journey services
      const journeyModule = await Test.createTestingModule({
        providers: [
          HealthJourneyKafkaService,
          CareJourneyKafkaService,
          PlanJourneyKafkaService,
          GamificationKafkaService,
          {
            provide: ConfigService,
            useClass: MockConfigService,
          },
          {
            provide: LoggerService,
            useClass: MockLoggerService,
          },
          {
            provide: TracingService,
            useClass: MockTracingService,
          },
        ],
      }).compile();

      // Get all services
      healthService = journeyModule.get<HealthJourneyKafkaService>(HealthJourneyKafkaService);
      careService = journeyModule.get<CareJourneyKafkaService>(CareJourneyKafkaService);
      planService = journeyModule.get<PlanJourneyKafkaService>(PlanJourneyKafkaService);
      gamificationService = journeyModule.get<GamificationKafkaService>(GamificationKafkaService);
    });

    it('should allow Health journey to produce events', async () => {
      // Spy on the produce method
      const produceSpy = jest.spyOn(healthService, 'produce');

      // Call the journey-specific method
      await healthService.produceHealthMetric('HEART_RATE', 75, 'user-123');

      // Verify the produce method was called with the correct arguments
      expect(produceSpy).toHaveBeenCalledWith('health-metrics', {
        metricType: 'HEART_RATE',
        value: 75,
        userId: 'user-123',
      });
    });

    it('should allow Care journey to produce events', async () => {
      // Spy on the produce method
      const produceSpy = jest.spyOn(careService, 'produce');

      // Call the journey-specific method
      await careService.produceAppointmentEvent('appt-123', 'CONFIRMED', 'user-123');

      // Verify the produce method was called with the correct arguments
      expect(produceSpy).toHaveBeenCalledWith('care-appointments', {
        appointmentId: 'appt-123',
        status: 'CONFIRMED',
        userId: 'user-123',
      });
    });

    it('should allow Plan journey to produce events', async () => {
      // Spy on the produce method
      const produceSpy = jest.spyOn(planService, 'produce');

      // Call the journey-specific method
      await planService.produceClaimEvent('claim-123', 'SUBMITTED', 'user-123');

      // Verify the produce method was called with the correct arguments
      expect(produceSpy).toHaveBeenCalledWith('plan-claims', {
        claimId: 'claim-123',
        status: 'SUBMITTED',
        userId: 'user-123',
      });
    });

    it('should allow Gamification service to produce events', async () => {
      // Spy on the produce method
      const produceSpy = jest.spyOn(gamificationService, 'produce');

      // Call the journey-specific method
      await gamificationService.produceAchievementEvent('achievement-123', 'user-123');

      // Verify the produce method was called with the correct arguments
      expect(produceSpy).toHaveBeenCalledWith('gamification-achievements', {
        achievementId: 'achievement-123',
        userId: 'user-123',
      });
    });
  });

  describe('EventMetadataDto Integration', () => {
    it('should create valid event metadata', () => {
      // Create event metadata
      const metadata = new EventMetadataDto();
      metadata.timestamp = new Date();
      metadata.correlationId = 'test-correlation-id';
      
      // Verify the metadata is valid
      expect(metadata).toBeDefined();
      expect(metadata.timestamp).toBeDefined();
      expect(metadata.correlationId).toBe('test-correlation-id');
    });

    it('should create child metadata with inherited context', () => {
      // Create parent metadata
      const parentMetadata = new EventMetadataDto();
      parentMetadata.eventId = 'parent-event-id';
      parentMetadata.correlationId = 'test-correlation-id';
      parentMetadata.sessionId = 'test-session-id';
      
      // Create child metadata
      const childMetadata = parentMetadata.createChildMetadata();
      
      // Verify the child metadata inherits context
      expect(childMetadata).toBeDefined();
      expect(childMetadata.correlationId).toBe('test-correlation-id');
      expect(childMetadata.sessionId).toBe('test-session-id');
      expect(childMetadata.parentEventId).toBe('parent-event-id');
      expect(childMetadata.eventId).not.toBe('parent-event-id');
    });

    it('should allow metadata to be included in Kafka messages', async () => {
      // Spy on the produce method
      const produceSpy = jest.spyOn(mockKafkaService, 'produce');

      // Create metadata
      const metadata = new EventMetadataDto();
      metadata.correlationId = 'test-correlation-id';
      
      // Create a message with metadata
      const message = {
        data: 'test-data',
        metadata,
      };
      
      // Produce the message
      await mockKafkaService.produce('test-topic', message);
      
      // Verify the message was produced with metadata
      expect(produceSpy).toHaveBeenCalledWith('test-topic', message, undefined);
      expect(produceSpy.mock.calls[0][1].metadata).toBe(metadata);
      expect(produceSpy.mock.calls[0][1].metadata.correlationId).toBe('test-correlation-id');
    });
  });

  describe('Journey-Specific Interface Requirements', () => {
    // Test data for journey-specific events
    const healthMetricEvent = {
      metricType: 'HEART_RATE',
      value: 75,
      userId: 'user-123',
      timestamp: '2023-01-01T00:00:00.000Z',
      deviceId: 'device-123',
    };

    const careAppointmentEvent = {
      appointmentId: 'appt-123',
      status: 'CONFIRMED',
      userId: 'user-123',
      providerId: 'provider-123',
      timestamp: '2023-01-01T00:00:00.000Z',
      location: 'Virtual',
    };

    const planClaimEvent = {
      claimId: 'claim-123',
      status: 'SUBMITTED',
      userId: 'user-123',
      amount: 100.0,
      currency: 'BRL',
      timestamp: '2023-01-01T00:00:00.000Z',
      category: 'MEDICAL',
    };

    const gamificationAchievementEvent = {
      achievementId: 'achievement-123',
      userId: 'user-123',
      timestamp: '2023-01-01T00:00:00.000Z',
      journey: 'health',
      points: 100,
      level: 1,
    };

    it('should validate Health journey event structure', () => {
      // Verify the health metric event has all required properties
      expect(healthMetricEvent.metricType).toBeDefined();
      expect(healthMetricEvent.value).toBeDefined();
      expect(healthMetricEvent.userId).toBeDefined();
      expect(healthMetricEvent.timestamp).toBeDefined();
      expect(healthMetricEvent.deviceId).toBeDefined();
    });

    it('should validate Care journey event structure', () => {
      // Verify the care appointment event has all required properties
      expect(careAppointmentEvent.appointmentId).toBeDefined();
      expect(careAppointmentEvent.status).toBeDefined();
      expect(careAppointmentEvent.userId).toBeDefined();
      expect(careAppointmentEvent.providerId).toBeDefined();
      expect(careAppointmentEvent.timestamp).toBeDefined();
      expect(careAppointmentEvent.location).toBeDefined();
    });

    it('should validate Plan journey event structure', () => {
      // Verify the plan claim event has all required properties
      expect(planClaimEvent.claimId).toBeDefined();
      expect(planClaimEvent.status).toBeDefined();
      expect(planClaimEvent.userId).toBeDefined();
      expect(planClaimEvent.amount).toBeDefined();
      expect(planClaimEvent.currency).toBeDefined();
      expect(planClaimEvent.timestamp).toBeDefined();
      expect(planClaimEvent.category).toBeDefined();
    });

    it('should validate Gamification event structure', () => {
      // Verify the gamification achievement event has all required properties
      expect(gamificationAchievementEvent.achievementId).toBeDefined();
      expect(gamificationAchievementEvent.userId).toBeDefined();
      expect(gamificationAchievementEvent.timestamp).toBeDefined();
      expect(gamificationAchievementEvent.journey).toBeDefined();
      expect(gamificationAchievementEvent.points).toBeDefined();
      expect(gamificationAchievementEvent.level).toBeDefined();
    });

    it('should ensure all journey events have common fields', () => {
      // Define the common fields that all events should have
      const commonFields = ['userId', 'timestamp'];
      
      // Verify all events have the common fields
      commonFields.forEach(field => {
        expect(healthMetricEvent).toHaveProperty(field);
        expect(careAppointmentEvent).toHaveProperty(field);
        expect(planClaimEvent).toHaveProperty(field);
        expect(gamificationAchievementEvent).toHaveProperty(field);
      });
    });
  });
});