/**
 * Journey Contexts E2E Tests
 * 
 * End-to-end tests for journey-specific database contexts (Health, Care, Plan).
 * Tests specialized database operations for each journey against a real database,
 * validating that journey-specific queries, data integrity rules, and optimizations
 * work correctly.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DatabaseModule } from '../../src/database.module';
import { PrismaService } from '../../src/prisma.service';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { TransactionService } from '../../src/transactions/transaction.service';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import {
  createTestDatabase,
  createTestDatabaseModule,
  getJourneyContext,
  cleanupTestDatabase,
  generateTestUser,
  generateHealthMetrics,
  generateAppointments,
  generateInsuranceClaims,
  dbAssert,
} from './helpers';

// Test timeout increased for database operations
jest.setTimeout(30000);

describe('Journey Contexts E2E Tests', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaClient;
  let healthContext: HealthContext;
  let careContext: CareContext;
  let planContext: PlanContext;
  let testUser: any;

  beforeAll(async () => {
    // Create test database connection
    prisma = await createTestDatabase({
      isolatedSchema: true,
      enableLogging: false,
    });

    // Create test module with database services
    moduleRef = await Test.createTestingModule({
      imports: [
        DatabaseModule.forRoot({
          databaseUrl: process.env.TEST_DATABASE_URL,
          enableLogging: false,
        }),
      ],
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    })
      .compile();

    // Get journey contexts
    healthContext = moduleRef.get<HealthContext>(HealthContext);
    careContext = moduleRef.get<CareContext>(CareContext);
    planContext = moduleRef.get<PlanContext>(PlanContext);

    // Create test user for all tests
    testUser = await generateTestUser(prisma);
  });

  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase(prisma, { dropSchema: true });
    await prisma.$disconnect();
    await moduleRef.close();
  });

  describe('Health Journey Context', () => {
    let healthMetrics: any[];

    beforeAll(async () => {
      // Generate test health metrics
      healthMetrics = await generateHealthMetrics(prisma, testUser.id, {
        count: 20,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(),
      });
    });

    describe('getMetricById', () => {
      it('should retrieve a health metric by ID', async () => {
        // Arrange
        const metricId = healthMetrics[0].id;

        // Act
        const result = await healthContext.getMetricById(metricId);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(metricId);
        expect(result.userId).toBe(testUser.id);
      });

      it('should throw MetricNotFoundError for non-existent metric ID', async () => {
        // Arrange
        const nonExistentId = 'non-existent-id';

        // Act & Assert
        await expect(healthContext.getMetricById(nonExistentId))
          .rejects
          .toThrow('Health metric with ID non-existent-id not found');
      });
    });

    describe('getUserMetrics', () => {
      it('should retrieve health metrics for a user with pagination', async () => {
        // Act
        const result = await healthContext.getUserMetrics(testUser.id, undefined, undefined, undefined, 1, 10);

        // Assert
        expect(result).toBeDefined();
        expect(result.metrics).toBeInstanceOf(Array);
        expect(result.metrics.length).toBeLessThanOrEqual(10);
        expect(result.total).toBeGreaterThanOrEqual(result.metrics.length);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
      });

      it('should filter metrics by type', async () => {
        // Arrange
        const metricType = healthMetrics[0].type;

        // Act
        const result = await healthContext.getUserMetrics(testUser.id, metricType);

        // Assert
        expect(result).toBeDefined();
        expect(result.metrics).toBeInstanceOf(Array);
        result.metrics.forEach(metric => {
          expect(metric.type).toBe(metricType);
        });
      });

      it('should filter metrics by date range', async () => {
        // Arrange
        const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
        const endDate = new Date();

        // Act
        const result = await healthContext.getUserMetrics(testUser.id, undefined, startDate, endDate);

        // Assert
        expect(result).toBeDefined();
        expect(result.metrics).toBeInstanceOf(Array);
        result.metrics.forEach(metric => {
          const metricDate = new Date(metric.timestamp);
          expect(metricDate).toBeGreaterThanOrEqual(startDate);
          expect(metricDate).toBeLessThanOrEqual(endDate);
        });
      });
    });

    describe('TimescaleDB optimizations', () => {
      it('should use TimescaleDB optimizations for time-range queries', async () => {
        // Arrange
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const endDate = new Date();
        const spy = jest.spyOn(healthContext as any, 'getMetricsWithTimescaleDB');

        // Act
        await healthContext.getUserMetrics(testUser.id, undefined, startDate, endDate);

        // Assert
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
      });

      it('should determine appropriate time_bucket interval based on date range', async () => {
        // Arrange
        const shortRange = {
          startDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          endDate: new Date(),
        };
        const mediumRange = {
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          endDate: new Date(),
        };
        const longRange = {
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          endDate: new Date(),
        };

        // Access private methods for testing
        const shouldUseTimeBucket = (healthContext as any).shouldUseTimeBucket.bind(healthContext);
        const determineTimeBucketInterval = (healthContext as any).determineTimeBucketInterval.bind(healthContext);

        // Assert
        expect(shouldUseTimeBucket(shortRange.startDate, shortRange.endDate)).toBe(false);
        expect(shouldUseTimeBucket(mediumRange.startDate, mediumRange.endDate)).toBe(true);
        expect(shouldUseTimeBucket(longRange.startDate, longRange.endDate)).toBe(true);

        expect(determineTimeBucketInterval(mediumRange.startDate, mediumRange.endDate)).toBe('3 hours');
        expect(determineTimeBucketInterval(longRange.startDate, longRange.endDate)).toBe('1 day');
      });
    });

    describe('createMetric', () => {
      it('should create a new health metric', async () => {
        // Arrange
        const metricData = {
          userId: testUser.id,
          type: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date(),
          source: 'MANUAL',
        };

        // Act
        const result = await healthContext.createMetric(metricData);

        // Assert
        expect(result).toBeDefined();
        expect(result.userId).toBe(testUser.id);
        expect(result.type).toBe(metricData.type);
        expect(result.value).toBe(metricData.value);
        expect(result.unit).toBe(metricData.unit);

        // Verify in database
        await dbAssert.exists(prisma, 'healthMetric', { id: result.id });
      });

      it('should validate metric data and set isAbnormal flag', async () => {
        // Arrange
        const abnormalMetricData = {
          userId: testUser.id,
          type: 'HEART_RATE',
          value: 120, // Abnormal heart rate
          unit: 'bpm',
          timestamp: new Date(),
          source: 'MANUAL',
        };

        // Act
        const result = await healthContext.createMetric(abnormalMetricData);

        // Assert
        expect(result).toBeDefined();
        expect(result.isAbnormal).toBe(true);
      });

      it('should throw InvalidMetricValueError for invalid metric data', async () => {
        // Arrange
        const invalidMetricData = {
          userId: testUser.id,
          type: 'HEART_RATE',
          value: 300, // Invalid heart rate
          unit: 'bpm',
          timestamp: new Date(),
          source: 'MANUAL',
        };

        // Act & Assert
        await expect(healthContext.createMetric(invalidMetricData))
          .rejects
          .toThrow('Heart rate value 300 is outside valid range');
      });
    });

    describe('bulkCreateMetrics', () => {
      it('should create multiple health metrics in a single transaction', async () => {
        // Arrange
        const metricsData = [
          {
            userId: testUser.id,
            type: 'STEPS',
            value: 8000,
            unit: 'steps',
            timestamp: new Date(),
            source: 'WEARABLE_DEVICE',
          },
          {
            userId: testUser.id,
            type: 'HEART_RATE',
            value: 72,
            unit: 'bpm',
            timestamp: new Date(),
            source: 'WEARABLE_DEVICE',
          },
          {
            userId: testUser.id,
            type: 'SLEEP',
            value: 7.5,
            unit: 'hours',
            timestamp: new Date(),
            source: 'WEARABLE_DEVICE',
          },
        ];

        // Act
        const result = await healthContext.bulkCreateMetrics(metricsData);

        // Assert
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(metricsData.length);

        // Verify all metrics were created
        for (const metric of result) {
          await dbAssert.exists(prisma, 'healthMetric', { id: metric.id });
        }
      });

      it('should validate all metrics and fail if any are invalid', async () => {
        // Arrange
        const metricsData = [
          {
            userId: testUser.id,
            type: 'STEPS',
            value: 8000,
            unit: 'steps',
            timestamp: new Date(),
            source: 'WEARABLE_DEVICE',
          },
          {
            userId: testUser.id,
            type: 'HEART_RATE',
            value: 300, // Invalid heart rate
            unit: 'bpm',
            timestamp: new Date(),
            source: 'WEARABLE_DEVICE',
          },
        ];

        // Act & Assert
        await expect(healthContext.bulkCreateMetrics(metricsData))
          .rejects
          .toThrow('Heart rate value 300 is outside valid range');

        // Verify no metrics were created (transaction should have rolled back)
        const createdMetrics = await prisma.healthMetric.findMany({
          where: {
            userId: testUser.id,
            timestamp: {
              gte: new Date(Date.now() - 60 * 1000), // Last minute
            },
            source: 'WEARABLE_DEVICE',
          },
        });

        expect(createdMetrics.length).toBe(0);
      });
    });

    describe('Health Goals', () => {
      it('should create and retrieve health goals', async () => {
        // Arrange
        const goalData = {
          recordId: testUser.id,
          type: 'STEPS',
          title: 'Daily Steps Goal',
          targetValue: 10000,
          unit: 'steps',
          period: 'DAILY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        };

        // Act - Create goal
        const createdGoal = await healthContext.createGoal(goalData);

        // Assert - Created goal
        expect(createdGoal).toBeDefined();
        expect(createdGoal.recordId).toBe(testUser.id);
        expect(createdGoal.type).toBe(goalData.type);
        expect(createdGoal.targetValue).toBe(goalData.targetValue);
        expect(createdGoal.status).toBe('ACTIVE');

        // Act - Retrieve goal
        const retrievedGoal = await healthContext.getGoalById(createdGoal.id);

        // Assert - Retrieved goal
        expect(retrievedGoal).toBeDefined();
        expect(retrievedGoal.id).toBe(createdGoal.id);

        // Act - Get user goals
        const userGoals = await healthContext.getUserGoals(testUser.id);

        // Assert - User goals
        expect(userGoals).toBeInstanceOf(Array);
        expect(userGoals.length).toBeGreaterThan(0);
        expect(userGoals.some(goal => goal.id === createdGoal.id)).toBe(true);
      });

      it('should update goal progress and mark as completed when target reached', async () => {
        // Arrange
        const goalData = {
          recordId: testUser.id,
          type: 'WEIGHT',
          title: 'Weight Loss Goal',
          targetValue: 5, // 5 kg weight loss
          unit: 'kg',
          period: 'MONTHLY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        };

        // Act - Create goal
        const createdGoal = await healthContext.createGoal(goalData);

        // Act - Update progress (50%)
        const updatedGoal = await healthContext.updateGoalProgress(createdGoal.id, 2.5);

        // Assert - Updated goal
        expect(updatedGoal).toBeDefined();
        expect(updatedGoal.currentValue).toBe(2.5);
        expect(updatedGoal.status).toBe('ACTIVE');

        // Act - Update progress to completion
        const completedGoal = await healthContext.updateGoalProgress(createdGoal.id, 5);

        // Assert - Completed goal
        expect(completedGoal).toBeDefined();
        expect(completedGoal.currentValue).toBe(5);
        expect(completedGoal.status).toBe('COMPLETED');
        expect(completedGoal.completedDate).toBeDefined();
      });

      it('should validate goal data and prevent conflicting goals', async () => {
        // Arrange
        const goalData = {
          recordId: testUser.id,
          type: 'STEPS',
          title: 'Daily Steps Goal',
          targetValue: 10000,
          unit: 'steps',
          period: 'DAILY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        };

        // Act - Create first goal
        await healthContext.createGoal(goalData);

        // Act & Assert - Try to create conflicting goal
        await expect(healthContext.createGoal(goalData))
          .rejects
          .toThrow('A goal of type STEPS already exists for this period');
      });
    });

    describe('Device Connections', () => {
      it('should create and retrieve device connections', async () => {
        // Arrange
        const connectionData = {
          recordId: testUser.id,
          deviceId: 'test-device-123',
          deviceType: 'SMARTWATCH',
          deviceName: 'Test Smartwatch',
          manufacturer: 'Test Manufacturer',
          model: 'Test Model',
        };

        // Act - Create connection
        const createdConnection = await healthContext.createDeviceConnection(connectionData);

        // Assert - Created connection
        expect(createdConnection).toBeDefined();
        expect(createdConnection.recordId).toBe(testUser.id);
        expect(createdConnection.deviceId).toBe(connectionData.deviceId);
        expect(createdConnection.status).toBe('CONNECTED');

        // Act - Retrieve connection
        const retrievedConnection = await healthContext.getDeviceConnectionById(createdConnection.id);

        // Assert - Retrieved connection
        expect(retrievedConnection).toBeDefined();
        expect(retrievedConnection.id).toBe(createdConnection.id);

        // Act - Get user connections
        const userConnections = await healthContext.getUserDeviceConnections(testUser.id);

        // Assert - User connections
        expect(userConnections).toBeInstanceOf(Array);
        expect(userConnections.length).toBeGreaterThan(0);
        expect(userConnections.some(conn => conn.id === createdConnection.id)).toBe(true);
      });

      it('should update device connection status', async () => {
        // Arrange
        const connectionData = {
          recordId: testUser.id,
          deviceId: 'test-device-456',
          deviceType: 'BLOOD_PRESSURE_MONITOR',
          deviceName: 'Test BP Monitor',
          manufacturer: 'Test Manufacturer',
          model: 'Test Model',
        };

        // Act - Create connection
        const createdConnection = await healthContext.createDeviceConnection(connectionData);

        // Act - Update status to disconnected
        const updatedConnection = await healthContext.updateDeviceConnectionStatus(
          createdConnection.id,
          'DISCONNECTED'
        );

        // Assert - Updated connection
        expect(updatedConnection).toBeDefined();
        expect(updatedConnection.status).toBe('DISCONNECTED');

        // Act - Get user connections with status filter
        const disconnectedConnections = await healthContext.getUserDeviceConnections(
          testUser.id,
          'DISCONNECTED'
        );

        // Assert - Filtered connections
        expect(disconnectedConnections).toBeInstanceOf(Array);
        expect(disconnectedConnections.some(conn => conn.id === createdConnection.id)).toBe(true);
      });

      it('should synchronize device data', async () => {
        // Arrange
        const connectionData = {
          recordId: testUser.id,
          deviceId: 'test-device-789',
          deviceType: 'SMARTWATCH',
          deviceName: 'Test Smartwatch',
          manufacturer: 'Test Manufacturer',
          model: 'Test Model',
        };

        const metricsData = [
          {
            userId: testUser.id,
            type: 'STEPS',
            value: 8000,
            unit: 'steps',
            timestamp: new Date(),
          },
          {
            userId: testUser.id,
            type: 'HEART_RATE',
            value: 72,
            unit: 'bpm',
            timestamp: new Date(),
          },
        ];

        // Act - Create connection
        const createdConnection = await healthContext.createDeviceConnection(connectionData);

        // Act - Synchronize data
        const result = await healthContext.synchronizeDeviceData(
          createdConnection.id,
          metricsData
        );

        // Assert - Sync result
        expect(result).toBeDefined();
        expect(result.connection).toBeDefined();
        expect(result.connection.id).toBe(createdConnection.id);
        expect(result.connection.lastSync).toBeDefined();
        expect(result.metrics).toBeInstanceOf(Array);
        expect(result.metrics.length).toBe(metricsData.length);

        // Verify metrics were created with correct source
        for (const metric of result.metrics) {
          expect(metric.source).toBe('WEARABLE_DEVICE');
          await dbAssert.exists(prisma, 'healthMetric', { id: metric.id });
        }
      });

      it('should reject synchronization for disconnected devices', async () => {
        // Arrange
        const connectionData = {
          recordId: testUser.id,
          deviceId: 'test-device-disconnected',
          deviceType: 'SMARTWATCH',
          deviceName: 'Test Smartwatch',
          manufacturer: 'Test Manufacturer',
          model: 'Test Model',
        };

        const metricsData = [
          {
            userId: testUser.id,
            type: 'STEPS',
            value: 8000,
            unit: 'steps',
            timestamp: new Date(),
          },
        ];

        // Act - Create connection
        const createdConnection = await healthContext.createDeviceConnection(connectionData);

        // Act - Disconnect device
        await healthContext.updateDeviceConnectionStatus(
          createdConnection.id,
          'DISCONNECTED'
        );

        // Act & Assert - Try to sync with disconnected device
        await expect(healthContext.synchronizeDeviceData(
          createdConnection.id,
          metricsData
        ))
          .rejects
          .toThrow('Cannot synchronize data for device with status DISCONNECTED');
      });
    });
  });

  describe('Care Journey Context', () => {
    let appointments: any[];

    beforeAll(async () => {
      // Generate test appointments
      appointments = await generateAppointments(prisma, testUser.id, {
        count: 10,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
      });
    });

    describe('getAppointmentById', () => {
      it('should retrieve an appointment by ID with provider details', async () => {
        // Arrange
        const appointmentId = appointments[0].id;

        // Act
        const result = await careContext.getAppointmentById(appointmentId);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(appointmentId);
        expect(result.userId).toBe(testUser.id);
        expect(result.provider).toBeDefined();
        expect(result.provider.id).toBe(appointments[0].providerId);
      });

      it('should throw AppointmentNotFoundError for non-existent appointment ID', async () => {
        // Arrange
        const nonExistentId = 'non-existent-id';

        // Act & Assert
        await expect(careContext.getAppointmentById(nonExistentId))
          .rejects
          .toThrow('Appointment with ID non-existent-id not found');
      });
    });

    describe('getUserAppointments', () => {
      it('should retrieve appointments for a user with pagination', async () => {
        // Act
        const result = await careContext.getUserAppointments(testUser.id, undefined, undefined, 1, 5);

        // Assert
        expect(result).toBeDefined();
        expect(result.appointments).toBeInstanceOf(Array);
        expect(result.appointments.length).toBeLessThanOrEqual(5);
        expect(result.total).toBeGreaterThanOrEqual(result.appointments.length);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(5);
      });

      it('should filter appointments by status', async () => {
        // Arrange
        const status = 'SCHEDULED';

        // Act
        const result = await careContext.getUserAppointments(testUser.id, status);

        // Assert
        expect(result).toBeDefined();
        expect(result.appointments).toBeInstanceOf(Array);
        result.appointments.forEach(appointment => {
          expect(appointment.status).toBe(status);
        });
      });

      it('should filter appointments by type', async () => {
        // Arrange
        const type = 'TELEMEDICINE';

        // Act
        const result = await careContext.getUserAppointments(testUser.id, undefined, type);

        // Assert
        expect(result).toBeDefined();
        expect(result.appointments).toBeInstanceOf(Array);
        result.appointments.forEach(appointment => {
          expect(appointment.type).toBe(type);
        });
      });
    });

    describe('createAppointment', () => {
      it('should create a new appointment with provider validation', async () => {
        // Arrange
        // Get a provider from existing appointments
        const provider = await prisma.provider.findUnique({
          where: { id: appointments[0].providerId },
        });

        const appointmentData = {
          userId: testUser.id,
          provider: {
            connect: { id: provider.id },
          },
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
          duration: 30,
          type: 'IN_PERSON',
          notes: 'Test appointment',
        };

        // Act
        const result = await careContext.createAppointment(appointmentData);

        // Assert
        expect(result).toBeDefined();
        expect(result.userId).toBe(testUser.id);
        expect(result.providerId).toBe(provider.id);
        expect(result.status).toBe('SCHEDULED');

        // Verify in database
        await dbAssert.exists(prisma, 'appointment', { id: result.id });
      });

      it('should validate appointment date is in the future', async () => {
        // Arrange
        const provider = await prisma.provider.findUnique({
          where: { id: appointments[0].providerId },
        });

        const appointmentData = {
          userId: testUser.id,
          provider: {
            connect: { id: provider.id },
          },
          scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in past
          duration: 30,
          type: 'IN_PERSON',
          notes: 'Test appointment',
        };

        // Act & Assert
        await expect(careContext.createAppointment(appointmentData))
          .rejects
          .toThrow('Appointment date must be in the future');
      });

      it('should check provider availability and prevent conflicts', async () => {
        // Arrange
        // Get a provider from existing appointments
        const provider = await prisma.provider.findUnique({
          where: { id: appointments[0].providerId },
        });

        // Find a scheduled appointment for this provider
        const existingAppointment = await prisma.appointment.findFirst({
          where: {
            providerId: provider.id,
            status: 'SCHEDULED',
            scheduledAt: {
              gte: new Date(), // Future appointments
            },
          },
        });

        if (!existingAppointment) {
          // Skip test if no future appointments found
          console.log('Skipping provider availability test - no future appointments found');
          return;
        }

        const conflictingAppointmentData = {
          userId: testUser.id,
          provider: {
            connect: { id: provider.id },
          },
          scheduledAt: existingAppointment.scheduledAt, // Same time as existing appointment
          duration: 30,
          type: 'IN_PERSON',
          notes: 'Test appointment',
        };

        // Act & Assert
        await expect(careContext.createAppointment(conflictingAppointmentData))
          .rejects
          .toThrow('Provider is not available at the requested time');
      });
    });

    describe('updateAppointmentStatus', () => {
      it('should update appointment status with valid transition', async () => {
        // Arrange
        // Create a new appointment for this test
        const provider = await prisma.provider.findUnique({
          where: { id: appointments[0].providerId },
        });

        const appointmentData = {
          userId: testUser.id,
          provider: {
            connect: { id: provider.id },
          },
          scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days in future
          duration: 30,
          type: 'IN_PERSON',
          notes: 'Test appointment for status update',
          status: 'SCHEDULED',
        };

        const appointment = await prisma.appointment.create({
          data: appointmentData,
        });

        // Act - Update to CONFIRMED
        const confirmedAppointment = await careContext.updateAppointmentStatus(
          appointment.id,
          'CONFIRMED',
          'Appointment confirmed by patient'
        );

        // Assert
        expect(confirmedAppointment).toBeDefined();
        expect(confirmedAppointment.id).toBe(appointment.id);
        expect(confirmedAppointment.status).toBe('CONFIRMED');
        expect(confirmedAppointment.notes).toBe('Appointment confirmed by patient');

        // Verify in database
        await dbAssert.matches(prisma, 'appointment', { id: appointment.id }, { status: 'CONFIRMED' });
      });

      it('should validate status transitions and reject invalid ones', async () => {
        // Arrange
        // Create a new appointment for this test
        const provider = await prisma.provider.findUnique({
          where: { id: appointments[0].providerId },
        });

        const appointmentData = {
          userId: testUser.id,
          provider: {
            connect: { id: provider.id },
          },
          scheduledAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days in future
          duration: 30,
          type: 'IN_PERSON',
          notes: 'Test appointment for invalid status transition',
          status: 'SCHEDULED',
        };

        const appointment = await prisma.appointment.create({
          data: appointmentData,
        });

        // Act & Assert - Try invalid transition from SCHEDULED to IN_PROGRESS
        await expect(careContext.updateAppointmentStatus(
          appointment.id,
          'IN_PROGRESS'
        ))
          .rejects
          .toThrow('Invalid status transition from SCHEDULED to IN_PROGRESS');
      });
    });

    describe('rescheduleAppointment', () => {
      it('should reschedule an appointment to a new date', async () => {
        // Arrange
        // Create a new appointment for this test
        const provider = await prisma.provider.findUnique({
          where: { id: appointments[0].providerId },
        });

        const appointmentData = {
          userId: testUser.id,
          provider: {
            connect: { id: provider.id },
          },
          scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
          duration: 30,
          type: 'IN_PERSON',
          notes: 'Test appointment for rescheduling',
          status: 'SCHEDULED',
        };

        const appointment = await prisma.appointment.create({
          data: appointmentData,
        });

        // New date for rescheduling
        const newDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days in future

        // Act
        const rescheduledAppointment = await careContext.rescheduleAppointment(
          appointment.id,
          newDate
        );

        // Assert
        expect(rescheduledAppointment).toBeDefined();
        expect(rescheduledAppointment.id).toBe(appointment.id);
        expect(new Date(rescheduledAppointment.scheduledAt).getTime()).toBe(newDate.getTime());

        // Verify in database
        const dbAppointment = await prisma.appointment.findUnique({
          where: { id: appointment.id },
        });
        expect(new Date(dbAppointment.scheduledAt).getTime()).toBe(newDate.getTime());
      });

      it('should validate new date is in the future', async () => {
        // Arrange
        const appointmentId = appointments[0].id;
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in past

        // Act & Assert
        await expect(careContext.rescheduleAppointment(appointmentId, pastDate))
          .rejects
          .toThrow('New appointment date must be in the future');
      });
    });

    describe('Provider Operations', () => {
      it('should retrieve a provider by ID', async () => {
        // Arrange
        const providerId = appointments[0].providerId;

        // Act
        const result = await careContext.getProviderById(providerId);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(providerId);
      });

      it('should search providers with filtering', async () => {
        // Act
        const result = await careContext.searchProviders({
          telemedicineAvailable: true,
        });

        // Assert
        expect(result).toBeDefined();
        expect(result.providers).toBeInstanceOf(Array);
        result.providers.forEach(provider => {
          expect(provider.telemedicineAvailable).toBe(true);
        });
      });

      it('should get provider availability for a specific date', async () => {
        // Arrange
        const providerId = appointments[0].providerId;
        const date = new Date();
        date.setDate(date.getDate() + 7); // 7 days in future

        // Act
        const result = await careContext.getProviderAvailability(providerId, date);

        // Assert
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(Array);
        result.forEach(slot => {
          expect(slot.startTime).toBeInstanceOf(Date);
          expect(slot.endTime).toBeInstanceOf(Date);
          expect(slot.endTime.getTime() - slot.startTime.getTime()).toBe(30 * 60 * 1000); // 30 minutes
        });
      });
    });

    describe('Medication Management', () => {
      it('should create and retrieve medications', async () => {
        // Arrange
        const medicationData = {
          userId: testUser.id,
          name: 'Test Medication',
          dosage: '10mg',
          frequency: 'Once daily',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
          instructions: 'Take with food',
          prescribedBy: 'Dr. Test Doctor',
        };

        // Act - Create medication
        const createdMedication = await careContext.createMedication(medicationData);

        // Assert - Created medication
        expect(createdMedication).toBeDefined();
        expect(createdMedication.userId).toBe(testUser.id);
        expect(createdMedication.name).toBe(medicationData.name);
        expect(createdMedication.active).toBe(true);

        // Act - Retrieve medication
        const retrievedMedication = await careContext.getMedicationById(createdMedication.id);

        // Assert - Retrieved medication
        expect(retrievedMedication).toBeDefined();
        expect(retrievedMedication.id).toBe(createdMedication.id);

        // Act - Get user medications
        const userMedications = await careContext.getUserMedications(testUser.id, true);

        // Assert - User medications
        expect(userMedications).toBeDefined();
        expect(userMedications.medications).toBeInstanceOf(Array);
        expect(userMedications.medications.some(med => med.id === createdMedication.id)).toBe(true);
      });

      it('should update medication adherence tracking', async () => {
        // Arrange
        const medicationData = {
          userId: testUser.id,
          name: 'Adherence Test Medication',
          dosage: '20mg',
          frequency: 'Twice daily',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
          instructions: 'Take with water',
          prescribedBy: 'Dr. Test Doctor',
        };

        // Act - Create medication
        const createdMedication = await careContext.createMedication(medicationData);

        // Act - Update adherence
        const adherenceData = {
          takenAt: new Date(),
          taken: true,
          notes: 'Taken as prescribed',
        };

        const updatedMedication = await careContext.updateMedicationAdherence(
          createdMedication.id,
          adherenceData
        );

        // Assert
        expect(updatedMedication).toBeDefined();
        expect(updatedMedication.id).toBe(createdMedication.id);
        expect(updatedMedication.lastTakenAt).toBeDefined();

        // Verify adherence record in database
        const adherenceRecord = await prisma.medicationAdherence.findFirst({
          where: {
            medicationId: createdMedication.id,
          },
        });

        expect(adherenceRecord).toBeDefined();
        expect(adherenceRecord.taken).toBe(true);
        expect(adherenceRecord.notes).toBe('Taken as prescribed');
      });
    });

    describe('Telemedicine Sessions', () => {
      it('should create and end telemedicine sessions', async () => {
        // Arrange - Create a provider with telemedicine available
        const provider = await prisma.provider.create({
          data: {
            name: 'Dr. Telemedicine Test',
            specialtyId: (await prisma.providerSpecialty.findFirst()).id,
            licenseNumber: 'TM12345',
            email: 'telemedicine.test@example.com',
            phone: '+5511999998888',
            telemedicineAvailable: true,
          },
        });

        // Create a telemedicine appointment
        const appointmentData = {
          userId: testUser.id,
          providerId: provider.id,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in future
          duration: 30,
          type: 'TELEMEDICINE',
          status: 'CONFIRMED',
          notes: 'Test telemedicine appointment',
        };

        const appointment = await prisma.appointment.create({
          data: appointmentData,
        });

        // Act - Create telemedicine session
        const sessionData = {
          appointment: {
            connect: { id: appointment.id },
          },
          connectionUrl: 'https://example.com/telemedicine/session123',
          provider: {
            connect: { id: provider.id },
          },
          patient: {
            connect: { id: testUser.id },
          },
        };

        const createdSession = await careContext.createTelemedicineSession(sessionData);

        // Assert - Created session
        expect(createdSession).toBeDefined();
        expect(createdSession.appointmentId).toBe(appointment.id);
        expect(createdSession.startTime).toBeDefined();
        expect(createdSession.endTime).toBeNull();

        // Verify appointment status updated
        const updatedAppointment = await prisma.appointment.findUnique({
          where: { id: appointment.id },
        });
        expect(updatedAppointment.status).toBe('IN_PROGRESS');

        // Act - End telemedicine session
        const endedSession = await careContext.endTelemedicineSession(createdSession.id);

        // Assert - Ended session
        expect(endedSession).toBeDefined();
        expect(endedSession.id).toBe(createdSession.id);
        expect(endedSession.endTime).toBeDefined();

        // Verify appointment status updated
        const completedAppointment = await prisma.appointment.findUnique({
          where: { id: appointment.id },
        });
        expect(completedAppointment.status).toBe('COMPLETED');
      });
    });
  });

  describe('Plan Journey Context', () => {
    let claims: any[];

    beforeAll(async () => {
      // Generate test insurance claims
      claims = await generateInsuranceClaims(prisma, testUser.id, {
        count: 5,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        endDate: new Date(),
      });
    });

    describe('getPlanById', () => {
      it('should retrieve a plan by ID with benefits and coverage', async () => {
        // Arrange
        // Get user's insurance plan
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        if (!userPlan) {
          // Skip test if no plan found
          console.log('Skipping plan retrieval test - no plan found');
          return;
        }

        // Act
        const result = await planContext.getPlanById(userPlan.id);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(userPlan.id);
        expect(result.userId).toBe(testUser.id);
        expect(result.benefits).toBeDefined();
        expect(result.coverage).toBeDefined();
      });

      it('should throw PlanNotFoundError for non-existent plan ID', async () => {
        // Arrange
        const nonExistentId = 'non-existent-id';

        // Act & Assert
        await expect(planContext.getPlanById(nonExistentId))
          .rejects
          .toThrow('Plan with ID non-existent-id not found');
      });
    });

    describe('getClaimById', () => {
      it('should retrieve a claim by ID with documents', async () => {
        // Arrange
        const claimId = claims[0].id;

        // Act
        const result = await planContext.getClaimById(claimId);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(claimId);
        expect(result.userId).toBe(testUser.id);
        expect(result.documents).toBeDefined();
      });

      it('should throw ClaimNotFoundError for non-existent claim ID', async () => {
        // Arrange
        const nonExistentId = 'non-existent-id';

        // Act & Assert
        await expect(planContext.getClaimById(nonExistentId))
          .rejects
          .toThrow('Claim with ID non-existent-id not found');
      });
    });

    describe('getUserClaims', () => {
      it('should retrieve claims for a user with pagination', async () => {
        // Act
        const result = await planContext.getUserClaims(testUser.id, undefined, 1, 3);

        // Assert
        expect(result).toBeDefined();
        expect(result.claims).toBeInstanceOf(Array);
        expect(result.claims.length).toBeLessThanOrEqual(3);
        expect(result.total).toBeGreaterThanOrEqual(result.claims.length);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(3);
      });

      it('should filter claims by status', async () => {
        // Arrange
        const status = 'APPROVED';

        // Act
        const result = await planContext.getUserClaims(testUser.id, status);

        // Assert
        expect(result).toBeDefined();
        expect(result.claims).toBeInstanceOf(Array);
        result.claims.forEach(claim => {
          expect(claim.status).toBe(status);
        });
      });
    });

    describe('createClaim', () => {
      it('should create a new claim', async () => {
        // Arrange
        // Get user's insurance plan
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        // Get a claim type
        const claimType = await prisma.claimType.findFirst();

        const claimData = {
          userId: testUser.id,
          planId: userPlan.id,
          typeId: claimType.id,
          amount: 250.0,
          serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          serviceCode: 'TEST-SERVICE-001',
          providerId: appointments[0].providerId,
          providerName: 'Test Provider',
          description: 'Test claim for consultation',
        };

        // Act
        const result = await planContext.createClaim(claimData);

        // Assert
        expect(result).toBeDefined();
        expect(result.userId).toBe(testUser.id);
        expect(result.planId).toBe(userPlan.id);
        expect(result.amount).toBe(claimData.amount);
        expect(result.status).toBe('SUBMITTED');

        // Verify in database
        await dbAssert.exists(prisma, 'claim', { id: result.id });
      });

      it('should validate claim data and prevent duplicates', async () => {
        // Arrange
        // Get user's insurance plan
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        // Get a claim type
        const claimType = await prisma.claimType.findFirst();

        // Create a claim
        const claimData = {
          userId: testUser.id,
          planId: userPlan.id,
          typeId: claimType.id,
          amount: 150.0,
          serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          serviceCode: 'TEST-SERVICE-002',
          providerId: appointments[0].providerId,
          providerName: 'Test Provider',
          description: 'Test claim for duplicate check',
        };

        // Act - Create first claim
        await planContext.createClaim(claimData);

        // Act & Assert - Try to create duplicate claim
        await expect(planContext.createClaim(claimData))
          .rejects
          .toThrow('A claim for this service already exists');
      });

      it('should validate claim amount is greater than zero', async () => {
        // Arrange
        // Get user's insurance plan
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        // Get a claim type
        const claimType = await prisma.claimType.findFirst();

        const invalidClaimData = {
          userId: testUser.id,
          planId: userPlan.id,
          typeId: claimType.id,
          amount: 0, // Invalid amount
          serviceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          serviceCode: 'TEST-SERVICE-003',
          providerId: appointments[0].providerId,
          providerName: 'Test Provider',
          description: 'Test claim with invalid amount',
        };

        // Act & Assert
        await expect(planContext.createClaim(invalidClaimData))
          .rejects
          .toThrow('Claim amount must be greater than zero');
      });
    });

    describe('updateClaimStatus', () => {
      it('should update claim status with valid transition', async () => {
        // Arrange
        // Create a new claim for this test
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        const claimType = await prisma.claimType.findFirst();

        const claimData = {
          userId: testUser.id,
          planId: userPlan.id,
          typeId: claimType.id,
          amount: 300.0,
          serviceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          serviceCode: 'TEST-SERVICE-004',
          providerId: appointments[0].providerId,
          providerName: 'Test Provider',
          description: 'Test claim for status update',
          status: 'SUBMITTED',
        };

        const claim = await prisma.claim.create({
          data: claimData,
        });

        // Act - Update to VALIDATING
        const validatingClaim = await planContext.updateClaimStatus(
          claim.id,
          'VALIDATING',
          'Claim is being validated'
        );

        // Assert
        expect(validatingClaim).toBeDefined();
        expect(validatingClaim.id).toBe(claim.id);
        expect(validatingClaim.status).toBe('VALIDATING');
        expect(validatingClaim.statusNotes).toBe('Claim is being validated');

        // Verify in database
        await dbAssert.matches(prisma, 'claim', { id: claim.id }, { status: 'VALIDATING' });

        // Act - Update to PROCESSING
        const processingClaim = await planContext.updateClaimStatus(
          claim.id,
          'PROCESSING',
          'Claim is being processed'
        );

        // Assert
        expect(processingClaim).toBeDefined();
        expect(processingClaim.status).toBe('PROCESSING');

        // Verify in database
        await dbAssert.matches(prisma, 'claim', { id: claim.id }, { status: 'PROCESSING' });
      });

      it('should validate status transitions and reject invalid ones', async () => {
        // Arrange
        // Create a new claim for this test
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        const claimType = await prisma.claimType.findFirst();

        const claimData = {
          userId: testUser.id,
          planId: userPlan.id,
          typeId: claimType.id,
          amount: 200.0,
          serviceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          serviceCode: 'TEST-SERVICE-005',
          providerId: appointments[0].providerId,
          providerName: 'Test Provider',
          description: 'Test claim for invalid status transition',
          status: 'SUBMITTED',
        };

        const claim = await prisma.claim.create({
          data: claimData,
        });

        // Act & Assert - Try invalid transition from SUBMITTED to APPROVED
        await expect(planContext.updateClaimStatus(
          claim.id,
          'APPROVED'
        ))
          .rejects
          .toThrow('Invalid status transition from SUBMITTED to APPROVED');
      });
    });

    describe('Document Management', () => {
      it('should add a document to a claim', async () => {
        // Arrange
        const claimId = claims[0].id;

        const documentData = {
          name: 'Test Document',
          fileUrl: 'https://example.com/documents/test.pdf',
          fileType: 'application/pdf',
          fileSize: 1024 * 1024, // 1MB
          uploadedBy: testUser.id,
        };

        // Act
        const result = await planContext.addDocumentToClaim(claimId, documentData);

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe(documentData.name);
        expect(result.fileUrl).toBe(documentData.fileUrl);
        expect(result.claimId).toBe(claimId);

        // Verify in database
        await dbAssert.exists(prisma, 'document', { id: result.id });

        // Act - Get claim documents
        const claimDocuments = await planContext.getClaimDocuments(claimId);

        // Assert
        expect(claimDocuments).toBeInstanceOf(Array);
        expect(claimDocuments.some(doc => doc.id === result.id)).toBe(true);
      });

      it('should validate document format', async () => {
        // Arrange
        const claimId = claims[0].id;

        const invalidDocumentData = {
          name: 'Invalid Document',
          fileUrl: 'https://example.com/documents/test.exe', // Invalid format
          fileType: 'application/octet-stream',
          fileSize: 1024 * 1024, // 1MB
          uploadedBy: testUser.id,
        };

        // Act & Assert
        await expect(planContext.addDocumentToClaim(claimId, invalidDocumentData))
          .rejects
          .toThrow('Invalid document format: exe');
      });

      it('should validate document size', async () => {
        // Arrange
        const claimId = claims[0].id;

        const largeDocumentData = {
          name: 'Large Document',
          fileUrl: 'https://example.com/documents/large.pdf',
          fileType: 'application/pdf',
          fileSize: 20 * 1024 * 1024, // 20MB (exceeds 10MB limit)
          uploadedBy: testUser.id,
        };

        // Act & Assert
        await expect(planContext.addDocumentToClaim(claimId, largeDocumentData))
          .rejects
          .toThrow('Document size exceeds maximum allowed size of 10MB');
      });
    });

    describe('Coverage and Benefits', () => {
      it('should retrieve plan coverage', async () => {
        // Arrange
        // Get user's insurance plan
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        if (!userPlan) {
          // Skip test if no plan found
          console.log('Skipping coverage test - no plan found');
          return;
        }

        // Create coverage if none exists
        const existingCoverage = await prisma.coverage.findFirst({
          where: { planId: userPlan.id },
        });

        if (!existingCoverage) {
          await prisma.coverage.create({
            data: {
              planId: userPlan.id,
              type: 'MEDICAL',
              description: 'Medical coverage',
              copaymentAmount: 20.0,
              coinsurancePercentage: 10.0,
              serviceCodes: ['CONSULT', 'EXAM'],
            },
          });
        }

        // Act
        const result = await planContext.getPlanCoverage(userPlan.id);

        // Assert
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].planId).toBe(userPlan.id);
      });

      it('should check if a service is covered', async () => {
        // Arrange
        // Get user's insurance plan
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        if (!userPlan) {
          // Skip test if no plan found
          console.log('Skipping service coverage test - no plan found');
          return;
        }

        // Create coverage with specific service codes if none exists
        const existingCoverage = await prisma.coverage.findFirst({
          where: { planId: userPlan.id },
        });

        const serviceCode = 'TEST-SERVICE';

        if (!existingCoverage) {
          await prisma.coverage.create({
            data: {
              planId: userPlan.id,
              type: 'MEDICAL',
              description: 'Medical coverage',
              copaymentAmount: 20.0,
              coinsurancePercentage: 10.0,
              serviceCodes: [serviceCode],
            },
          });
        } else if (!existingCoverage.serviceCodes.includes(serviceCode)) {
          await prisma.coverage.update({
            where: { id: existingCoverage.id },
            data: {
              serviceCodes: [...existingCoverage.serviceCodes, serviceCode],
            },
          });
        }

        // Act
        const result = await planContext.isServiceCovered(userPlan.id, serviceCode);

        // Assert
        expect(result).toBeDefined();
        expect(result.planId).toBe(userPlan.id);
        expect(result.serviceCodes).toContain(serviceCode);
      });

      it('should throw ServiceNotCoveredError for non-covered services', async () => {
        // Arrange
        // Get user's insurance plan
        const userPlan = await prisma.insurancePlan.findFirst({
          where: { userId: testUser.id },
        });

        if (!userPlan) {
          // Skip test if no plan found
          console.log('Skipping non-covered service test - no plan found');
          return;
        }

        const nonCoveredServiceCode = 'NON-COVERED-SERVICE';

        // Act & Assert
        await expect(planContext.isServiceCovered(userPlan.id, nonCoveredServiceCode))
          .rejects
          .toThrow(`Service ${nonCoveredServiceCode} is not covered by plan ${userPlan.id}`);
      });
    });
  });

  describe('Cross-Journey Data Consistency', () => {
    it('should maintain data consistency across journeys', async () => {
      // This test verifies that data created in one journey context can be accessed
      // and used correctly in another journey context

      // Arrange - Create health metric in Health journey
      const metricData = {
        userId: testUser.id,
        type: 'HEART_RATE',
        value: 85,
        unit: 'bpm',
        timestamp: new Date(),
        source: 'MANUAL',
      };

      const healthMetric = await healthContext.createMetric(metricData);

      // Arrange - Create appointment in Care journey
      const provider = await prisma.provider.findFirst();
      const appointmentData = {
        userId: testUser.id,
        provider: {
          connect: { id: provider.id },
        },
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
        duration: 30,
        type: 'IN_PERSON',
        notes: `Follow-up for heart rate of ${healthMetric.value} ${healthMetric.unit}`,
      };

      const appointment = await careContext.createAppointment(appointmentData);

      // Arrange - Create claim in Plan journey for the appointment
      const userPlan = await prisma.insurancePlan.findFirst({
        where: { userId: testUser.id },
      });
      const claimType = await prisma.claimType.findFirst();

      const claimData = {
        userId: testUser.id,
        planId: userPlan.id,
        typeId: claimType.id,
        amount: 150.0,
        serviceDate: appointment.scheduledAt,
        serviceCode: 'FOLLOW-UP-CONSULT',
        providerId: provider.id,
        providerName: provider.name,
        description: `Claim for appointment: ${appointment.id}`,
      };

      const claim = await planContext.createClaim(claimData);

      // Assert - Verify cross-journey data consistency
      expect(appointment.notes).toContain(`${healthMetric.value} ${healthMetric.unit}`);
      expect(claim.description).toContain(appointment.id);
      expect(claim.serviceDate).toEqual(appointment.scheduledAt);
      expect(claim.providerId).toBe(appointment.providerId);
    });

    it('should handle transactions across journey contexts', async () => {
      // This test verifies that transactions work correctly across journey contexts

      // Arrange - Start a transaction in the Health journey
      const healthMetricResult = await healthContext.transaction(async (client) => {
        // Create health metric in transaction
        const metricData = {
          userId: testUser.id,
          type: 'BLOOD_PRESSURE',
          value: '120/80',
          unit: 'mmHg',
          timestamp: new Date(),
          source: 'MANUAL',
        };

        const metric = await healthContext.createMetric(metricData, client);

        // Use Care journey context in the same transaction
        const provider = await prisma.provider.findFirst();
        const appointmentData = {
          userId: testUser.id,
          provider: {
            connect: { id: provider.id },
          },
          scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days in future
          duration: 30,
          type: 'IN_PERSON',
          notes: `Follow-up for blood pressure of ${metric.value} ${metric.unit}`,
        };

        const appointment = await careContext.createAppointment(appointmentData, client);

        return { metric, appointment };
      });

      // Assert - Verify transaction results
      expect(healthMetricResult).toBeDefined();
      expect(healthMetricResult.metric).toBeDefined();
      expect(healthMetricResult.appointment).toBeDefined();
      expect(healthMetricResult.appointment.notes).toContain(healthMetricResult.metric.value);

      // Verify data was persisted
      await dbAssert.exists(prisma, 'healthMetric', { id: healthMetricResult.metric.id });
      await dbAssert.exists(prisma, 'appointment', { id: healthMetricResult.appointment.id });
    });

    it('should roll back transactions on error across journey contexts', async () => {
      // This test verifies that transactions are rolled back on error across journey contexts

      // Arrange - Start a transaction that will fail
      try {
        await healthContext.transaction(async (client) => {
          // Create health metric in transaction
          const metricData = {
            userId: testUser.id,
            type: 'HEART_RATE',
            value: 75,
            unit: 'bpm',
            timestamp: new Date(),
            source: 'MANUAL',
          };

          const metric = await healthContext.createMetric(metricData, client);

          // Store the metric ID for later verification
          const metricId = metric.id;

          // Try to create an appointment with invalid data (past date)
          const provider = await prisma.provider.findFirst();
          const invalidAppointmentData = {
            userId: testUser.id,
            provider: {
              connect: { id: provider.id },
            },
            scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in past (invalid)
            duration: 30,
            type: 'IN_PERSON',
            notes: 'This appointment should fail and roll back the transaction',
          };

          // This should throw an error
          await careContext.createAppointment(invalidAppointmentData, client);

          return { metricId };
        });

        // If we get here, the test should fail
        fail('Transaction should have thrown an error');
      } catch (error) {
        // Assert - Verify error was thrown
        expect(error).toBeDefined();
        expect(error.message).toContain('Appointment date must be in the future');
      }

      // Assert - Verify no data was persisted (transaction rolled back)
      const recentMetrics = await prisma.healthMetric.findMany({
        where: {
          userId: testUser.id,
          timestamp: {
            gte: new Date(Date.now() - 60 * 1000), // Last minute
          },
          source: 'MANUAL',
          type: 'HEART_RATE',
          value: 75,
        },
      });

      expect(recentMetrics.length).toBe(0);
    });
  });
});