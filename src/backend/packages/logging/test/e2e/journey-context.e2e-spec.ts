import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { LoggerService } from '../../src/logger.service';
import { TestAppModule } from './test-app.module';
import { JourneyType } from '../../src/context/context.constants';
import { ContextManager } from '../../src/context/context-manager';
import { JourneyContext } from '../../src/context/journey-context.interface';

/**
 * Mock transport to capture logs for testing
 */
class MockLogTransport {
  logs: any[] = [];
  
  log(info: any): void {
    this.logs.push(info);
  }
  
  clear(): void {
    this.logs = [];
  }
  
  getLogs(): any[] {
    return this.logs;
  }
  
  getLogsByJourney(journeyType: JourneyType): any[] {
    return this.logs.filter(log => {
      return log.context && 
             log.context.journey && 
             log.context.journey.type === journeyType;
    });
  }
}

describe('Journey Context E2E Tests', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let contextManager: ContextManager;
  let mockTransport: MockLogTransport;
  
  beforeAll(async () => {
    // Create mock transport for capturing logs
    mockTransport = new MockLogTransport();
    
    // Create test module with TestAppModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    
    // Create NestJS application
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get logger service and context manager
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    contextManager = moduleFixture.get<ContextManager>(ContextManager);
    
    // Add mock transport to logger service for capturing logs
    (loggerService as any).addTransport(mockTransport);
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  beforeEach(() => {
    // Clear logs before each test
    mockTransport.clear();
  });
  
  describe('Journey-specific logging', () => {
    it('should include health journey context in logs', () => {
      // Create health journey context
      const healthContext: JourneyContext = {
        journey: {
          type: JourneyType.HEALTH,
          metadata: {
            metricId: 'blood-pressure',
            goalId: 'reduce-bp-goal'
          }
        },
        correlationId: 'test-correlation-id',
        userId: 'user-123',
        timestamp: new Date().toISOString()
      };
      
      // Log with health journey context
      loggerService.log('Health metric recorded', healthContext);
      
      // Get logs for health journey
      const healthLogs = mockTransport.getLogsByJourney(JourneyType.HEALTH);
      
      // Verify logs include health journey context
      expect(healthLogs.length).toBe(1);
      expect(healthLogs[0].message).toBe('Health metric recorded');
      expect(healthLogs[0].context.journey.type).toBe(JourneyType.HEALTH);
      expect(healthLogs[0].context.journey.metadata.metricId).toBe('blood-pressure');
      expect(healthLogs[0].context.correlationId).toBe('test-correlation-id');
      expect(healthLogs[0].context.userId).toBe('user-123');
    });
    
    it('should include care journey context in logs', () => {
      // Create care journey context
      const careContext: JourneyContext = {
        journey: {
          type: JourneyType.CARE,
          metadata: {
            appointmentId: 'appointment-456',
            providerId: 'provider-789'
          }
        },
        correlationId: 'test-correlation-id',
        userId: 'user-123',
        timestamp: new Date().toISOString()
      };
      
      // Log with care journey context
      loggerService.log('Appointment scheduled', careContext);
      
      // Get logs for care journey
      const careLogs = mockTransport.getLogsByJourney(JourneyType.CARE);
      
      // Verify logs include care journey context
      expect(careLogs.length).toBe(1);
      expect(careLogs[0].message).toBe('Appointment scheduled');
      expect(careLogs[0].context.journey.type).toBe(JourneyType.CARE);
      expect(careLogs[0].context.journey.metadata.appointmentId).toBe('appointment-456');
      expect(careLogs[0].context.correlationId).toBe('test-correlation-id');
      expect(careLogs[0].context.userId).toBe('user-123');
    });
    
    it('should include plan journey context in logs', () => {
      // Create plan journey context
      const planContext: JourneyContext = {
        journey: {
          type: JourneyType.PLAN,
          metadata: {
            claimId: 'claim-789',
            benefitId: 'benefit-101'
          }
        },
        correlationId: 'test-correlation-id',
        userId: 'user-123',
        timestamp: new Date().toISOString()
      };
      
      // Log with plan journey context
      loggerService.log('Claim submitted', planContext);
      
      // Get logs for plan journey
      const planLogs = mockTransport.getLogsByJourney(JourneyType.PLAN);
      
      // Verify logs include plan journey context
      expect(planLogs.length).toBe(1);
      expect(planLogs[0].message).toBe('Claim submitted');
      expect(planLogs[0].context.journey.type).toBe(JourneyType.PLAN);
      expect(planLogs[0].context.journey.metadata.claimId).toBe('claim-789');
      expect(planLogs[0].context.correlationId).toBe('test-correlation-id');
      expect(planLogs[0].context.userId).toBe('user-123');
    });
  });
  
  describe('Cross-journey logging', () => {
    it('should maintain consistent context across multiple journey logs', () => {
      // Create a shared correlation ID for the request flow
      const correlationId = 'cross-journey-correlation-id';
      const userId = 'user-456';
      
      // Create contexts for each journey with the same correlation ID
      const healthContext: JourneyContext = {
        journey: {
          type: JourneyType.HEALTH,
          metadata: { metricId: 'weight' }
        },
        correlationId,
        userId,
        timestamp: new Date().toISOString()
      };
      
      const careContext: JourneyContext = {
        journey: {
          type: JourneyType.CARE,
          metadata: { appointmentId: 'follow-up-123' }
        },
        correlationId,
        userId,
        timestamp: new Date().toISOString()
      };
      
      const planContext: JourneyContext = {
        journey: {
          type: JourneyType.PLAN,
          metadata: { claimId: 'weight-program-claim' }
        },
        correlationId,
        userId,
        timestamp: new Date().toISOString()
      };
      
      // Log with each journey context in a sequence that simulates a user flow
      loggerService.log('Weight measurement recorded', healthContext);
      loggerService.log('Follow-up appointment scheduled', careContext);
      loggerService.log('Weight program claim submitted', planContext);
      
      // Get all logs for this correlation ID
      const allLogs = mockTransport.getLogs().filter(log => 
        log.context && log.context.correlationId === correlationId
      );
      
      // Verify all logs have the same correlation ID and user ID
      expect(allLogs.length).toBe(3);
      allLogs.forEach(log => {
        expect(log.context.correlationId).toBe(correlationId);
        expect(log.context.userId).toBe(userId);
      });
      
      // Verify the sequence of journey transitions
      expect(allLogs[0].context.journey.type).toBe(JourneyType.HEALTH);
      expect(allLogs[1].context.journey.type).toBe(JourneyType.CARE);
      expect(allLogs[2].context.journey.type).toBe(JourneyType.PLAN);
    });
  });
  
  describe('Context manager integration', () => {
    it('should create and apply journey context using context manager', () => {
      // Create journey context using context manager
      const context = contextManager.createJourneyContext({
        journeyType: JourneyType.HEALTH,
        metadata: { goalId: 'exercise-goal' },
        userId: 'user-789',
        correlationId: 'manager-test-correlation-id'
      });
      
      // Log with context created by context manager
      loggerService.log('Goal progress updated', context);
      
      // Get logs for this correlation ID
      const logs = mockTransport.getLogs().filter(log => 
        log.context && log.context.correlationId === 'manager-test-correlation-id'
      );
      
      // Verify log contains correct context
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Goal progress updated');
      expect(logs[0].context.journey.type).toBe(JourneyType.HEALTH);
      expect(logs[0].context.journey.metadata.goalId).toBe('exercise-goal');
      expect(logs[0].context.userId).toBe('user-789');
    });
    
    it('should merge contexts from different sources', () => {
      // Create base context with user info
      const userContext = contextManager.createUserContext({
        userId: 'user-101',
        roles: ['patient'],
        correlationId: 'merge-test-correlation-id'
      });
      
      // Create journey context
      const journeyContext = contextManager.createJourneyContext({
        journeyType: JourneyType.CARE,
        metadata: { medicationId: 'med-202' },
        correlationId: 'merge-test-correlation-id'
      });
      
      // Merge contexts
      const mergedContext = contextManager.mergeContexts([userContext, journeyContext]);
      
      // Log with merged context
      loggerService.log('Medication reminder sent', mergedContext);
      
      // Get logs for this correlation ID
      const logs = mockTransport.getLogs().filter(log => 
        log.context && log.context.correlationId === 'merge-test-correlation-id'
      );
      
      // Verify log contains merged context information
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Medication reminder sent');
      expect(logs[0].context.journey.type).toBe(JourneyType.CARE);
      expect(logs[0].context.journey.metadata.medicationId).toBe('med-202');
      expect(logs[0].context.userId).toBe('user-101');
      expect(logs[0].context.roles).toContain('patient');
    });
  });
  
  describe('Error logging with journey context', () => {
    it('should include journey context in error logs', () => {
      // Create journey context
      const context: JourneyContext = {
        journey: {
          type: JourneyType.PLAN,
          metadata: { benefitId: 'dental-coverage' }
        },
        correlationId: 'error-test-correlation-id',
        userId: 'user-303',
        timestamp: new Date().toISOString()
      };
      
      // Create error
      const error = new Error('Benefit verification failed');
      
      // Log error with journey context
      loggerService.error('Failed to verify dental coverage', error.stack, context);
      
      // Get error logs for this correlation ID
      const errorLogs = mockTransport.getLogs().filter(log => 
        log.context && 
        log.context.correlationId === 'error-test-correlation-id' &&
        log.level === 'error'
      );
      
      // Verify error log contains journey context
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toBe('Failed to verify dental coverage');
      expect(errorLogs[0].context.journey.type).toBe(JourneyType.PLAN);
      expect(errorLogs[0].context.journey.metadata.benefitId).toBe('dental-coverage');
      expect(errorLogs[0].context.userId).toBe('user-303');
      expect(errorLogs[0].stack).toBeDefined();
    });
  });
  
  describe('Different log levels with journey context', () => {
    it('should maintain journey context across different log levels', () => {
      // Create journey context
      const context: JourneyContext = {
        journey: {
          type: JourneyType.HEALTH,
          metadata: { deviceId: 'fitbit-123' }
        },
        correlationId: 'levels-test-correlation-id',
        userId: 'user-404',
        timestamp: new Date().toISOString()
      };
      
      // Log at different levels with the same context
      loggerService.debug('Connecting to device', context);
      loggerService.log('Device connected successfully', context);
      loggerService.warn('Device battery low', context);
      loggerService.error('Failed to sync data', new Error('Sync error').stack, context);
      
      // Get logs for this correlation ID
      const logs = mockTransport.getLogs().filter(log => 
        log.context && log.context.correlationId === 'levels-test-correlation-id'
      );
      
      // Verify all logs have the same journey context
      expect(logs.length).toBe(4);
      logs.forEach(log => {
        expect(log.context.journey.type).toBe(JourneyType.HEALTH);
        expect(log.context.journey.metadata.deviceId).toBe('fitbit-123');
        expect(log.context.userId).toBe('user-404');
      });
      
      // Verify log levels
      expect(logs.find(log => log.level === 'debug')).toBeDefined();
      expect(logs.find(log => log.level === 'info')).toBeDefined();
      expect(logs.find(log => log.level === 'warn')).toBeDefined();
      expect(logs.find(log => log.level === 'error')).toBeDefined();
    });
  });
});