import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from './test-app.module';
import { LoggerService } from '../../src/logger.service';
import { JourneyContextService } from './test-app.module';
import { TestService } from './test-app.module';
import { JourneyType } from '../../src/context/journey-context.interface';
import {
  LogCapture,
  createLogCapture,
  analyzeLogEntries,
  withLogCapture,
} from '../utils/log-capture.utils';
import {
  assertJourney,
  assertLogEntry,
  assertJourneySpecificFields,
} from '../utils/assertion.utils';
import {
  createTestHealthJourneyContext,
  createTestCareJourneyContext,
  createTestPlanJourneyContext,
  createTestCrossJourneyContext,
} from '../utils/test-context.utils';

describe('Journey Context E2E Tests', () => {
  let app: INestApplication;
  let loggerService: LoggerService;
  let journeyContextService: JourneyContextService;
  let testService: TestService;
  let logCapture: LogCapture;

  beforeAll(async () => {
    // Create a testing module with the TestAppModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    // Create the NestJS application
    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the required services
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    journeyContextService = moduleFixture.get<JourneyContextService>(JourneyContextService);
    testService = moduleFixture.get<TestService>(TestService);

    // Create a log capture for testing
    logCapture = createLogCapture({
      captureStdout: true,
      captureStderr: true,
      parseJson: true,
    });
  });

  beforeEach(() => {
    // Start capturing logs before each test
    logCapture.start();
    // Clear any existing journey context
    journeyContextService.clearContext();
  });

  afterEach(() => {
    // Stop capturing logs after each test
    logCapture.stop();
    logCapture.clear();
  });

  afterAll(async () => {
    // Close the application when tests are done
    await app.close();
  });

  describe('Health Journey Logging', () => {
    it('should include health journey context in logs', async () => {
      // Perform an operation in the health journey context
      await testService.performJourneySpecificOperation(JourneyType.HEALTH);

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Verify that logs were captured
      expect(logs.length).toBeGreaterThan(0);

      // Analyze logs to find those with journey context
      const journeyLogs = analyzeLogEntries(logs)
        .byJourneyType(JourneyType.HEALTH)
        .getLogs();

      // Verify that journey-specific logs were captured
      expect(journeyLogs.length).toBeGreaterThan(0);

      // Verify that logs include the correct journey type
      journeyLogs.forEach(log => {
        assertJourney(log, JourneyType.HEALTH);
      });

      // Verify that at least one log contains health-specific metadata
      const healthMetadataLog = journeyLogs.find(log => 
        log.context?.journeyState?.activeMetrics ||
        log.metadata?.healthMetric ||
        log.metadata?.metrics
      );
      expect(healthMetadataLog).toBeDefined();
    });

    it('should include health-specific state in journey context', async () => {
      // Perform an operation in the health journey context
      await testService.performJourneySpecificOperation(JourneyType.HEALTH);

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs with debug level that contain journey details
      const detailLogs = analyzeLogEntries(logs)
        .byJourneyType(JourneyType.HEALTH)
        .byMessage(/Health journey details/)
        .getLogs();

      // Verify that detail logs were captured
      expect(detailLogs.length).toBeGreaterThan(0);

      // Verify that the log contains health-specific metrics
      const detailLog = detailLogs[0];
      expect(detailLog.journeyType).toBe(JourneyType.HEALTH);
      expect(detailLog.metrics || detailLog.context?.metrics).toBeDefined();
    });

    it('should propagate health journey context through HTTP requests', async () => {
      // Make an HTTP request to the test endpoint with health journey
      const response = await request(app.getHttpServer())
        .get('/test/journey/health')
        .expect(200);

      // Verify the response
      expect(response.body.message).toContain('health journey operation completed');

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs from the controller and service
      const controllerLogs = analyzeLogEntries(logs)
        .byMessage(/Received journey-specific operation request/)
        .getLogs();
      
      const serviceLogs = analyzeLogEntries(logs)
        .byMessage(/Starting health journey operation/)
        .getLogs();

      // Verify that logs were captured from both components
      expect(controllerLogs.length).toBeGreaterThan(0);
      expect(serviceLogs.length).toBeGreaterThan(0);

      // Verify that the journey context was propagated
      controllerLogs.forEach(log => {
        expect(log.journey || log.context?.journey).toBe(JourneyType.HEALTH);
      });

      serviceLogs.forEach(log => {
        expect(log.journey || log.context?.journey).toBe(JourneyType.HEALTH);
      });
    });
  });

  describe('Care Journey Logging', () => {
    it('should include care journey context in logs', async () => {
      // Perform an operation in the care journey context
      await testService.performJourneySpecificOperation(JourneyType.CARE);

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Verify that logs were captured
      expect(logs.length).toBeGreaterThan(0);

      // Analyze logs to find those with journey context
      const journeyLogs = analyzeLogEntries(logs)
        .byJourneyType(JourneyType.CARE)
        .getLogs();

      // Verify that journey-specific logs were captured
      expect(journeyLogs.length).toBeGreaterThan(0);

      // Verify that logs include the correct journey type
      journeyLogs.forEach(log => {
        assertJourney(log, JourneyType.CARE);
      });

      // Verify that at least one log contains care-specific metadata
      const careMetadataLog = journeyLogs.find(log => 
        log.context?.journeyState?.appointmentType ||
        log.metadata?.careAppointment ||
        log.metadata?.appointment
      );
      expect(careMetadataLog).toBeDefined();
    });

    it('should include care-specific state in journey context', async () => {
      // Perform an operation in the care journey context
      await testService.performJourneySpecificOperation(JourneyType.CARE);

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs with debug level that contain journey details
      const detailLogs = analyzeLogEntries(logs)
        .byJourneyType(JourneyType.CARE)
        .byMessage(/Care journey details/)
        .getLogs();

      // Verify that detail logs were captured
      expect(detailLogs.length).toBeGreaterThan(0);

      // Verify that the log contains care-specific appointment info
      const detailLog = detailLogs[0];
      expect(detailLog.journeyType).toBe(JourneyType.CARE);
      expect(detailLog.appointment || detailLog.context?.appointment).toBeDefined();
    });

    it('should propagate care journey context through HTTP requests', async () => {
      // Make an HTTP request to the test endpoint with care journey
      const response = await request(app.getHttpServer())
        .get('/test/journey/care')
        .expect(200);

      // Verify the response
      expect(response.body.message).toContain('care journey operation completed');

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs from the controller and service
      const controllerLogs = analyzeLogEntries(logs)
        .byMessage(/Received journey-specific operation request/)
        .getLogs();
      
      const serviceLogs = analyzeLogEntries(logs)
        .byMessage(/Starting care journey operation/)
        .getLogs();

      // Verify that logs were captured from both components
      expect(controllerLogs.length).toBeGreaterThan(0);
      expect(serviceLogs.length).toBeGreaterThan(0);

      // Verify that the journey context was propagated
      controllerLogs.forEach(log => {
        expect(log.journey || log.context?.journey).toBe(JourneyType.CARE);
      });

      serviceLogs.forEach(log => {
        expect(log.journey || log.context?.journey).toBe(JourneyType.CARE);
      });
    });
  });

  describe('Plan Journey Logging', () => {
    it('should include plan journey context in logs', async () => {
      // Perform an operation in the plan journey context
      await testService.performJourneySpecificOperation(JourneyType.PLAN);

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Verify that logs were captured
      expect(logs.length).toBeGreaterThan(0);

      // Analyze logs to find those with journey context
      const journeyLogs = analyzeLogEntries(logs)
        .byJourneyType(JourneyType.PLAN)
        .getLogs();

      // Verify that journey-specific logs were captured
      expect(journeyLogs.length).toBeGreaterThan(0);

      // Verify that logs include the correct journey type
      journeyLogs.forEach(log => {
        assertJourney(log, JourneyType.PLAN);
      });

      // Verify that at least one log contains plan-specific metadata
      const planMetadataLog = journeyLogs.find(log => 
        log.context?.journeyState?.currentPlan ||
        log.metadata?.planBenefit ||
        log.metadata?.benefits
      );
      expect(planMetadataLog).toBeDefined();
    });

    it('should include plan-specific state in journey context', async () => {
      // Perform an operation in the plan journey context
      await testService.performJourneySpecificOperation(JourneyType.PLAN);

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs with debug level that contain journey details
      const detailLogs = analyzeLogEntries(logs)
        .byJourneyType(JourneyType.PLAN)
        .byMessage(/Plan journey details/)
        .getLogs();

      // Verify that detail logs were captured
      expect(detailLogs.length).toBeGreaterThan(0);

      // Verify that the log contains plan-specific benefits info
      const detailLog = detailLogs[0];
      expect(detailLog.journeyType).toBe(JourneyType.PLAN);
      expect(detailLog.benefits || detailLog.context?.benefits).toBeDefined();
    });

    it('should propagate plan journey context through HTTP requests', async () => {
      // Make an HTTP request to the test endpoint with plan journey
      const response = await request(app.getHttpServer())
        .get('/test/journey/plan')
        .expect(200);

      // Verify the response
      expect(response.body.message).toContain('plan journey operation completed');

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs from the controller and service
      const controllerLogs = analyzeLogEntries(logs)
        .byMessage(/Received journey-specific operation request/)
        .getLogs();
      
      const serviceLogs = analyzeLogEntries(logs)
        .byMessage(/Starting plan journey operation/)
        .getLogs();

      // Verify that logs were captured from both components
      expect(controllerLogs.length).toBeGreaterThan(0);
      expect(serviceLogs.length).toBeGreaterThan(0);

      // Verify that the journey context was propagated
      controllerLogs.forEach(log => {
        expect(log.journey || log.context?.journey).toBe(JourneyType.PLAN);
      });

      serviceLogs.forEach(log => {
        expect(log.journey || log.context?.journey).toBe(JourneyType.PLAN);
      });
    });
  });

  describe('Cross-Journey Context', () => {
    it('should maintain context when transitioning between journeys', async () => {
      // Create a cross-journey context from Health to Care
      const userId = 'test-user-123';
      const crossJourneyContext = createTestCrossJourneyContext(
        JourneyType.HEALTH,
        JourneyType.CARE,
        userId
      );

      // Set the cross-journey context
      journeyContextService.setContext({
        type: JourneyType.HEALTH,
        id: 'cross-journey-test',
        metadata: {
          crossJourney: {
            sourceJourney: JourneyType.HEALTH,
            targetJourney: JourneyType.CARE,
            flowId: 'test-flow-123',
          },
        },
      });

      // Log with the cross-journey context
      loggerService.log('Starting cross-journey flow from Health to Care', 'CrossJourneyTest');

      // Perform operations in both journeys
      await testService.performJourneySpecificOperation(JourneyType.HEALTH);
      
      // Transition to the target journey
      journeyContextService.setContext({
        type: JourneyType.CARE,
        id: 'cross-journey-test',
        metadata: {
          crossJourney: {
            sourceJourney: JourneyType.HEALTH,
            targetJourney: JourneyType.CARE,
            flowId: 'test-flow-123',
          },
        },
      });
      
      loggerService.log('Continuing cross-journey flow in Care journey', 'CrossJourneyTest');
      await testService.performJourneySpecificOperation(JourneyType.CARE);

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs related to the cross-journey flow
      const crossJourneyLogs = analyzeLogEntries(logs)
        .byMessage(/cross-journey flow/)
        .getLogs();

      // Verify that cross-journey logs were captured
      expect(crossJourneyLogs.length).toBeGreaterThan(0);

      // Find the initial log in the source journey
      const sourceLog = crossJourneyLogs.find(log => 
        log.message.includes('Starting cross-journey flow')
      );
      expect(sourceLog).toBeDefined();
      expect(sourceLog.journey || sourceLog.context?.journey).toBe(JourneyType.HEALTH);

      // Find the continuation log in the target journey
      const targetLog = crossJourneyLogs.find(log => 
        log.message.includes('Continuing cross-journey flow')
      );
      expect(targetLog).toBeDefined();
      expect(targetLog.journey || targetLog.context?.journey).toBe(JourneyType.CARE);

      // Verify that both logs have the same flow ID in their metadata
      const sourceFlowId = sourceLog.metadata?.crossJourney?.flowId || 
                          sourceLog.context?.metadata?.crossJourney?.flowId;
      const targetFlowId = targetLog.metadata?.crossJourney?.flowId || 
                          targetLog.context?.metadata?.crossJourney?.flowId;
      
      expect(sourceFlowId).toBeDefined();
      expect(targetFlowId).toBeDefined();
      expect(sourceFlowId).toBe(targetFlowId);
    });

    it('should handle errors with proper journey context during cross-journey flows', async () => {
      // Set up a cross-journey context from Care to Plan
      journeyContextService.setContext({
        type: JourneyType.CARE,
        id: 'error-cross-journey-test',
        metadata: {
          crossJourney: {
            sourceJourney: JourneyType.CARE,
            targetJourney: JourneyType.PLAN,
            flowId: 'error-flow-123',
          },
        },
      });

      // Trigger an error in the Care journey context
      try {
        await testService.failingOperation('business', JourneyType.CARE);
      } catch (error) {
        // Error is expected
      }

      // Transition to the target journey
      journeyContextService.setContext({
        type: JourneyType.PLAN,
        id: 'error-cross-journey-test',
        metadata: {
          crossJourney: {
            sourceJourney: JourneyType.CARE,
            targetJourney: JourneyType.PLAN,
            flowId: 'error-flow-123',
          },
        },
      });

      // Trigger another error in the Plan journey context
      try {
        await testService.failingOperation('validation', JourneyType.PLAN);
      } catch (error) {
        // Error is expected
      }

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find error logs from both journeys
      const careErrorLogs = analyzeLogEntries(logs)
        .byJourneyType(JourneyType.CARE)
        .byMessage(/About to throw an error/)
        .getLogs();

      const planErrorLogs = analyzeLogEntries(logs)
        .byJourneyType(JourneyType.PLAN)
        .byMessage(/About to throw an error/)
        .getLogs();

      // Verify that error logs were captured from both journeys
      expect(careErrorLogs.length).toBeGreaterThan(0);
      expect(planErrorLogs.length).toBeGreaterThan(0);

      // Verify that the error logs contain the correct journey context
      careErrorLogs.forEach(log => {
        expect(log.journey || log.context?.journey).toBe(JourneyType.CARE);
      });

      planErrorLogs.forEach(log => {
        expect(log.journey || log.context?.journey).toBe(JourneyType.PLAN);
      });

      // Verify that both error logs have the same flow ID in their metadata
      const careFlowId = careErrorLogs[0].metadata?.crossJourney?.flowId || 
                        careErrorLogs[0].context?.metadata?.crossJourney?.flowId;
      const planFlowId = planErrorLogs[0].metadata?.crossJourney?.flowId || 
                        planErrorLogs[0].context?.metadata?.crossJourney?.flowId;
      
      expect(careFlowId).toBeDefined();
      expect(planFlowId).toBeDefined();
      expect(careFlowId).toBe(planFlowId);
    });
  });

  describe('Journey Context Across Service Boundaries', () => {
    it('should preserve journey context when making HTTP requests between services', async () => {
      // Simulate a request from one service to another with journey context
      const response = await request(app.getHttpServer())
        .post('/test/journey')
        .send({ id: 'service-boundary-test', journeyType: JourneyType.HEALTH })
        .set('x-journey-id', 'health-journey-123')
        .set('x-journey-type', JourneyType.HEALTH)
        .set('x-correlation-id', 'correlation-123')
        .expect(200);

      // Verify the response
      expect(response.body.message).toContain('operation completed successfully');

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs that contain the correlation ID
      const correlatedLogs = analyzeLogEntries(logs)
        .filter(log => {
          const correlationId = log.correlationId || 
                              log.context?.correlationId || 
                              log['x-correlation-id'];
          return correlationId === 'correlation-123';
        })
        .getLogs();

      // Verify that correlated logs were captured
      expect(correlatedLogs.length).toBeGreaterThan(0);

      // Verify that all logs have the correct journey context
      correlatedLogs.forEach(log => {
        const journeyType = log.journey || 
                          log.journeyType || 
                          log.context?.journey || 
                          log.context?.journeyType;
        expect(journeyType).toBe(JourneyType.HEALTH);
      });

      // Verify that the journey ID was preserved
      correlatedLogs.forEach(log => {
        const journeyId = log.journeyId || 
                         log['x-journey-id'] || 
                         log.context?.journeyId || 
                         log.context?.['x-journey-id'];
        expect(journeyId).toBe('health-journey-123');
      });
    });

    it('should maintain journey context when propagating errors across service boundaries', async () => {
      // Simulate an error request from one service to another with journey context
      try {
        await request(app.getHttpServer())
          .post('/test/error-journey')
          .send({ errorType: 'technical', journeyType: JourneyType.PLAN })
          .set('x-journey-id', 'plan-journey-error-123')
          .set('x-journey-type', JourneyType.PLAN)
          .set('x-correlation-id', 'error-correlation-123')
          .expect(500);
      } catch (error) {
        // Error is expected
      }

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs that contain the correlation ID
      const correlatedLogs = analyzeLogEntries(logs)
        .filter(log => {
          const correlationId = log.correlationId || 
                              log.context?.correlationId || 
                              log['x-correlation-id'];
          return correlationId === 'error-correlation-123';
        })
        .getLogs();

      // Verify that correlated logs were captured
      expect(correlatedLogs.length).toBeGreaterThan(0);

      // Find the error log
      const errorLog = correlatedLogs.find(log => 
        log.message.includes('About to throw an error')
      );
      expect(errorLog).toBeDefined();

      // Verify that the error log has the correct journey context
      const journeyType = errorLog.journey || 
                         errorLog.journeyType || 
                         errorLog.context?.journey || 
                         errorLog.context?.journeyType;
      expect(journeyType).toBe(JourneyType.PLAN);

      // Verify that the journey ID was preserved
      const journeyId = errorLog.journeyId || 
                       errorLog['x-journey-id'] || 
                       errorLog.context?.journeyId || 
                       errorLog.context?.['x-journey-id'];
      expect(journeyId).toBe('plan-journey-error-123');
    });
  });

  describe('Business Transaction Tracking', () => {
    it('should track business transactions across journey boundaries', async () => {
      // Set up a business transaction in the Health journey
      journeyContextService.setContext({
        type: JourneyType.HEALTH,
        id: 'business-transaction-test',
        metadata: {
          businessTransaction: {
            transactionId: 'bt-123',
            transactionType: 'health-data-sync',
            status: 'started',
          },
        },
      });

      // Log the start of the business transaction
      loggerService.log('Starting health data sync business transaction', 'BusinessTransactionTest');

      // Perform an operation in the Health journey
      await testService.performJourneySpecificOperation(JourneyType.HEALTH);

      // Transition to the Care journey while maintaining the business transaction
      journeyContextService.setContext({
        type: JourneyType.CARE,
        id: 'business-transaction-test',
        metadata: {
          businessTransaction: {
            transactionId: 'bt-123',
            transactionType: 'health-data-sync',
            status: 'in-progress',
          },
          crossJourney: {
            sourceJourney: JourneyType.HEALTH,
            targetJourney: JourneyType.CARE,
            flowId: 'bt-flow-123',
          },
        },
      });

      // Log the continuation of the business transaction in the Care journey
      loggerService.log('Continuing health data sync in Care journey', 'BusinessTransactionTest');

      // Perform an operation in the Care journey
      await testService.performJourneySpecificOperation(JourneyType.CARE);

      // Complete the business transaction
      journeyContextService.setContext({
        type: JourneyType.CARE,
        id: 'business-transaction-test',
        metadata: {
          businessTransaction: {
            transactionId: 'bt-123',
            transactionType: 'health-data-sync',
            status: 'completed',
          },
        },
      });

      // Log the completion of the business transaction
      loggerService.log('Completed health data sync business transaction', 'BusinessTransactionTest');

      // Get the captured logs
      const logs = logCapture.getLogs();
      
      // Find logs related to the business transaction
      const transactionLogs = analyzeLogEntries(logs)
        .filter(log => {
          const metadata = log.metadata || log.context?.metadata;
          return metadata?.businessTransaction?.transactionId === 'bt-123';
        })
        .getLogs();

      // Verify that transaction logs were captured
      expect(transactionLogs.length).toBeGreaterThan(0);

      // Find logs from each stage of the transaction
      const startLog = transactionLogs.find(log => 
        log.message.includes('Starting health data sync')
      );
      const continueLog = transactionLogs.find(log => 
        log.message.includes('Continuing health data sync')
      );
      const completeLog = transactionLogs.find(log => 
        log.message.includes('Completed health data sync')
      );

      // Verify that logs from all stages were captured
      expect(startLog).toBeDefined();
      expect(continueLog).toBeDefined();
      expect(completeLog).toBeDefined();

      // Verify the journey types for each stage
      expect(startLog.journey || startLog.context?.journey).toBe(JourneyType.HEALTH);
      expect(continueLog.journey || continueLog.context?.journey).toBe(JourneyType.CARE);
      expect(completeLog.journey || completeLog.context?.journey).toBe(JourneyType.CARE);

      // Verify the transaction status for each stage
      const startStatus = startLog.metadata?.businessTransaction?.status || 
                         startLog.context?.metadata?.businessTransaction?.status;
      const continueStatus = continueLog.metadata?.businessTransaction?.status || 
                            continueLog.context?.metadata?.businessTransaction?.status;
      const completeStatus = completeLog.metadata?.businessTransaction?.status || 
                           completeLog.context?.metadata?.businessTransaction?.status;

      expect(startStatus).toBe('started');
      expect(continueStatus).toBe('in-progress');
      expect(completeStatus).toBe('completed');
    });
  });
});