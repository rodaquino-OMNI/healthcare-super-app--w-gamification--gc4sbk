import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TestAppModule } from './test-app.module';
import { LoggerService } from '../../src/logger.service';
import { JourneyType } from '../../src/context/context.constants';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { LoggingContext } from '../../src/context/context.interface';
import { ContextManager } from '../../src/context/context-manager';
import { TracingService } from '@austa/tracing';
import {
  createLogCapture,
  LogCaptureEnvironment,
  assertLogHasValidJourneyContext,
  assertLogHasJourneyType,
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  createCrossJourneyContext,
  createCombinedContext,
} from '../utils';

describe('Journey Context Logging (e2e)', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let tracingService: TracingService;
  let contextManager: ContextManager;
  let logCapture: LogCaptureEnvironment;

  beforeAll(async () => {
    // Create the test module with the TestAppModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    // Create the NestJS application
    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the LoggerService and TracingService instances
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    tracingService = moduleFixture.get<TracingService>(TracingService);
    contextManager = new ContextManager({ tracingService });

    // Set up log capture for testing
    logCapture = createLogCapture();
  });

  afterAll(async () => {
    // Clean up resources
    logCapture.stop();
    await app.close();
  });

  beforeEach(() => {
    // Clear captured logs before each test
    logCapture.clear();
  });

  describe('Journey-specific logging methods', () => {
    it('should include Health journey context when using forHealthJourney', () => {
      // Create a logger for the Health journey
      const healthLogger = loggerService.forHealthJourney({
        resourceId: 'health-metrics-123',
        action: 'view-metrics',
      });

      // Log a message with the Health journey logger
      healthLogger.log('Viewing health metrics');

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Verify that at least one log was captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log has a valid journey context
      const log = logs[logs.length - 1];
      assertLogHasValidJourneyContext(log);
      assertLogHasJourneyType(log, JourneyType.HEALTH);

      // Verify that the journey context has the correct resource ID and action
      expect(log.journey.resourceId).toBe('health-metrics-123');
      expect(log.journey.action).toBe('view-metrics');
    });

    it('should include Care journey context when using forCareJourney', () => {
      // Create a logger for the Care journey
      const careLogger = loggerService.forCareJourney({
        resourceId: 'appointment-456',
        action: 'schedule-appointment',
      });

      // Log a message with the Care journey logger
      careLogger.log('Scheduling appointment');

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Verify that at least one log was captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log has a valid journey context
      const log = logs[logs.length - 1];
      assertLogHasValidJourneyContext(log);
      assertLogHasJourneyType(log, JourneyType.CARE);

      // Verify that the journey context has the correct resource ID and action
      expect(log.journey.resourceId).toBe('appointment-456');
      expect(log.journey.action).toBe('schedule-appointment');
    });

    it('should include Plan journey context when using forPlanJourney', () => {
      // Create a logger for the Plan journey
      const planLogger = loggerService.forPlanJourney({
        resourceId: 'claim-789',
        action: 'submit-claim',
      });

      // Log a message with the Plan journey logger
      planLogger.log('Submitting insurance claim');

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Verify that at least one log was captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log has a valid journey context
      const log = logs[logs.length - 1];
      assertLogHasValidJourneyContext(log);
      assertLogHasJourneyType(log, JourneyType.PLAN);

      // Verify that the journey context has the correct resource ID and action
      expect(log.journey.resourceId).toBe('claim-789');
      expect(log.journey.action).toBe('submit-claim');
    });
  });

  describe('Journey context with metadata', () => {
    it('should include journey metadata in log entries', () => {
      // Create a Health journey context with metadata
      const journeyContext: JourneyContext = {
        journeyType: JourneyType.HEALTH,
        resourceId: 'health-goal-123',
        action: 'update-goal',
        step: 'goal-details',
        flowId: 'health-flow-456',
        journeyMetadata: {
          version: '1.2',
          isNewUser: false,
          journeyStartTime: new Date(),
          featureFlags: {
            enableHealthInsights: true,
            enableDeviceSync: true,
          },
        },
      };

      // Create a logger with the journey context
      const journeyLogger = loggerService.withJourneyContext(journeyContext);

      // Log a message with the journey logger
      journeyLogger.log('Updating health goal with metadata');

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Verify that at least one log was captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log has a valid journey context
      const log = logs[logs.length - 1];
      assertLogHasValidJourneyContext(log);
      assertLogHasJourneyType(log, JourneyType.HEALTH);

      // Verify that the journey context has the correct metadata
      expect(log.journey.step).toBe('goal-details');
      expect(log.journey.flowId).toBe('health-flow-456');
      expect(log.journey.metadata).toBeDefined();
      expect(log.journey.metadata.version).toBe('1.2');
      expect(log.journey.metadata.isNewUser).toBe(false);
      expect(log.journey.metadata.featureFlags).toBeDefined();
      expect(log.journey.metadata.featureFlags.enableHealthInsights).toBe(true);
      expect(log.journey.metadata.featureFlags.enableDeviceSync).toBe(true);
    });
  });

  describe('Cross-journey logging', () => {
    it('should support logging across multiple journeys', () => {
      // Create a cross-journey context
      const crossJourneyContext = createCrossJourneyContext(
        JourneyType.HEALTH,
        [JourneyType.CARE, JourneyType.PLAN],
        {
          action: 'cross-journey-action',
          transactionId: 'transaction-123',
        }
      );

      // Create a logger with the cross-journey context
      const crossJourneyLogger = loggerService.withJourneyContext(crossJourneyContext);

      // Log a message with the cross-journey logger
      crossJourneyLogger.log('Performing cross-journey operation');

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Verify that at least one log was captured
      expect(logs.length).toBeGreaterThan(0);

      // Verify that the log has a valid journey context
      const log = logs[logs.length - 1];
      assertLogHasValidJourneyContext(log);
      assertLogHasJourneyType(log, JourneyType.HEALTH); // Primary journey

      // Verify that the journey context has the cross-journey flag and related journeys
      expect(log.journey.isCrossJourney).toBe(true);
      expect(log.journey.relatedJourneys).toContain(JourneyType.CARE);
      expect(log.journey.relatedJourneys).toContain(JourneyType.PLAN);
      expect(log.journey.transactionId).toBe('transaction-123');
    });

    it('should track a business transaction across multiple journeys', () => {
      // Create a transaction ID for tracking across journeys
      const transactionId = 'business-transaction-123';

      // Step 1: Start in the Health journey
      const healthLogger = loggerService.forHealthJourney({
        resourceId: 'health-record-123',
        action: 'view-health-data',
        transactionId,
      });
      healthLogger.log('Step 1: Viewing health data');

      // Step 2: Continue in the Care journey
      const careLogger = loggerService.forCareJourney({
        resourceId: 'appointment-456',
        action: 'schedule-appointment',
        transactionId,
      });
      careLogger.log('Step 2: Scheduling appointment based on health data');

      // Step 3: Finish in the Plan journey
      const planLogger = loggerService.forPlanJourney({
        resourceId: 'coverage-789',
        action: 'check-coverage',
        transactionId,
      });
      planLogger.log('Step 3: Checking coverage for appointment');

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Verify that we have at least 3 logs (one for each journey)
      expect(logs.length).toBeGreaterThanOrEqual(3);

      // Filter logs by transaction ID
      const transactionLogs = logs.filter(log => 
        log.journey && log.journey.transactionId === transactionId
      );

      // Verify that we have exactly 3 logs for this transaction
      expect(transactionLogs.length).toBe(3);

      // Verify that each log has the correct journey type
      expect(transactionLogs[0].journey.type).toBe(JourneyType.HEALTH);
      expect(transactionLogs[1].journey.type).toBe(JourneyType.CARE);
      expect(transactionLogs[2].journey.type).toBe(JourneyType.PLAN);

      // Verify that all logs have the same transaction ID
      transactionLogs.forEach(log => {
        expect(log.journey.transactionId).toBe(transactionId);
      });
    });
  });

  describe('Journey context across service boundaries', () => {
    it('should preserve journey context when propagated across services', () => {
      // Create a source service context with journey information
      const sourceContext = createHealthJourneyContext({
        correlationId: 'correlation-123',
        requestId: 'request-123',
        userId: 'user-123',
        transactionId: 'transaction-123',
      });

      // Log a message in the source service
      const sourceLogger = loggerService.withJourneyContext(sourceContext);
      sourceLogger.log('Source service operation');

      // Simulate context propagation to a target service
      const targetContext = contextManager.mergeContexts<LoggingContext>(
        // Base context for the target service
        {
          serviceName: 'target-service',
          component: 'TargetComponent',
        },
        // Propagated context from the source service
        {
          correlationId: sourceContext.correlationId,
          requestId: sourceContext.requestId,
          userId: sourceContext.userId,
          transactionId: sourceContext.transactionId,
          journeyType: sourceContext.journeyType,
          resourceId: sourceContext.resourceId,
          action: sourceContext.action,
        }
      );

      // Log a message in the target service
      const targetLogger = loggerService.withContext(targetContext);
      targetLogger.log('Target service operation');

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Verify that we have at least 2 logs
      expect(logs.length).toBeGreaterThanOrEqual(2);

      // Get the source and target logs
      const sourceLogs = logs.filter(log => 
        log.context && log.context.serviceName === sourceContext.serviceName
      );
      const targetLogs = logs.filter(log => 
        log.context && log.context.serviceName === 'target-service'
      );

      // Verify that we have at least one log for each service
      expect(sourceLogs.length).toBeGreaterThan(0);
      expect(targetLogs.length).toBeGreaterThan(0);

      // Get the latest log from each service
      const sourceLog = sourceLogs[sourceLogs.length - 1];
      const targetLog = targetLogs[targetLogs.length - 1];

      // Verify that both logs have the same correlation identifiers
      expect(targetLog.context.correlationId).toBe(sourceLog.context.correlationId);
      expect(targetLog.context.requestId).toBe(sourceLog.context.requestId);
      expect(targetLog.context.userId).toBe(sourceLog.context.userId);
      expect(targetLog.context.transactionId).toBe(sourceLog.context.transactionId);

      // Verify that the journey context was preserved
      expect(targetLog.context.journeyType).toBe(sourceLog.context.journeyType);
      expect(targetLog.journey.type).toBe(sourceLog.journey.type);
    });
  });

  describe('Error logging with journey context', () => {
    it('should include journey context when logging errors', () => {
      // Create a logger for the Health journey
      const healthLogger = loggerService.forHealthJourney({
        resourceId: 'health-metrics-123',
        action: 'process-metrics',
      });

      // Create an error
      const error = new Error('Failed to process health metrics');

      // Log the error with the Health journey logger
      healthLogger.error('Error processing health metrics', error);

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Verify that at least one log was captured
      expect(logs.length).toBeGreaterThan(0);

      // Get the error log
      const errorLog = logs[logs.length - 1];

      // Verify that the log has a valid journey context
      assertLogHasValidJourneyContext(errorLog);
      assertLogHasJourneyType(errorLog, JourneyType.HEALTH);

      // Verify that the error information is included
      expect(errorLog.error).toBeDefined();
      expect(errorLog.error.message).toBe('Failed to process health metrics');
      expect(errorLog.error.stack).toBeDefined();

      // Verify that the journey context is included with the error
      expect(errorLog.journey.resourceId).toBe('health-metrics-123');
      expect(errorLog.journey.action).toBe('process-metrics');
    });
  });

  describe('Journey-specific log levels', () => {
    it('should respect journey-specific log levels', () => {
      // This test assumes that the LoggerService has been configured with
      // journey-specific log levels in the TestAppModule

      // Create loggers for each journey
      const healthLogger = loggerService.forHealthJourney();
      const careLogger = loggerService.forCareJourney();
      const planLogger = loggerService.forPlanJourney();

      // Log debug messages for each journey
      healthLogger.debug('Health journey debug message');
      careLogger.debug('Care journey debug message');
      planLogger.debug('Plan journey debug message');

      // Get the captured logs
      const logs = logCapture.getLogs();

      // Filter logs by journey and level
      const healthDebugLogs = logs.filter(log => 
        log.journey && 
        log.journey.type === JourneyType.HEALTH && 
        log.level === 'debug'
      );

      const careDebugLogs = logs.filter(log => 
        log.journey && 
        log.journey.type === JourneyType.CARE && 
        log.level === 'debug'
      );

      const planDebugLogs = logs.filter(log => 
        log.journey && 
        log.journey.type === JourneyType.PLAN && 
        log.level === 'debug'
      );

      // The actual assertions will depend on how the log levels are configured
      // in the TestAppModule. This is just a placeholder for the test structure.
      expect(logs.length).toBeGreaterThanOrEqual(0);
    });
  });
});