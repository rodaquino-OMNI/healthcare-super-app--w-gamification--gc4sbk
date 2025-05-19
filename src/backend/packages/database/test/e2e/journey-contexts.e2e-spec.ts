/**
 * Journey Contexts E2E Tests
 * 
 * This file contains end-to-end tests for journey-specific database contexts:
 * - Health journey context with TimescaleDB optimizations
 * - Care journey context with provider and appointment operations
 * - Plan journey context with claim and benefit operations
 * - Cross-journey data consistency tests
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';

// Import test utilities
import {
  createTestPrismaService,
  createTestJourneyContexts,
  createTestUsers,
  createHealthTestData,
  createCareTestData,
  createPlanTestData,
  cleanupTestDatabase,
  cleanupUserTestData,
  assertRecordExists,
  assertRecordNotExists,
  assertRecordCount,
  assertRecordMatches,
} from './helpers';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from './setup';

describe('Journey Contexts E2E Tests', () => {
  let prismaService: PrismaService;
  let healthContext: HealthContext;
  let careContext: CareContext;
  let planContext: PlanContext;
  let testUserIds: string[] = [];

  // Set up the test database before all tests
  beforeAll(async () => {
    // Initialize the test database
    await setupTestDatabase();
    
    // Create PrismaService and journey contexts
    prismaService = createTestPrismaService();
    const contexts = createTestJourneyContexts(prismaService);
    healthContext = contexts.health;
    careContext = contexts.care;
    planContext = contexts.plan;
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up test users
    for (const userId of testUserIds) {
      await cleanupUserTestData(prismaService, userId);
    }
    
    // Disconnect from the database
    await prismaService.$disconnect();
    
    // Tear down the test database
    await teardownTestDatabase();
  });

  // Reset the database before each test
  beforeEach(async () => {
    await resetTestDatabase();
    testUserIds = [];
  });

  /**
   * Health Journey Context Tests
   */
  describe('HealthContext', () => {
    let userId: string;
    let healthData: any;

    beforeEach(async () => {
      // Create a test user
      const users = await createTestUsers(prismaService, { count: 1 });
      userId = users[0].id;
      testUserIds.push(userId);

      // Create health test data
      healthData = await createHealthTestData(prismaService, { userId });
    });

    test('should retrieve health metrics with TimescaleDB optimizations', async () => {
      // Get metrics for the user
      const metrics = await healthContext.getHealthMetricsWithTimescaleOptimization(
        userId,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date(),
          limit: 10,
        }
      );

      // Verify metrics were retrieved
      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.length).toBeLessThanOrEqual(10);

      // Verify metrics have the correct structure with TimescaleDB-specific fields
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('id');
        expect(metric).toHaveProperty('userId', userId);
        expect(metric).toHaveProperty('typeId');
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('timestamp');
        // TimescaleDB-specific aggregation fields
        expect(metric).toHaveProperty('interval');
        expect(metric).toHaveProperty('bucketStart');
        expect(metric).toHaveProperty('bucketEnd');
      });
    });

    test('should calculate health metric statistics with TimescaleDB', async () => {
      // Get statistics for a specific metric type
      const metricTypes = await prismaService.healthMetricType.findMany();
      const metricTypeId = metricTypes[0].id;

      const stats = await healthContext.getHealthMetricStatistics(
        userId,
        metricTypeId,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date(),
        }
      );

      // Verify statistics were calculated
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('min');
      expect(stats).toHaveProperty('max');
      expect(stats).toHaveProperty('avg');
      expect(stats).toHaveProperty('stdDev');
      expect(stats).toHaveProperty('trend');
    });

    test('should create health metrics with validation', async () => {
      // Get a metric type
      const metricTypes = await prismaService.healthMetricType.findMany();
      const metricType = metricTypes[0];

      // Create a new metric
      const newMetric = await healthContext.createHealthMetric({
        userId,
        typeId: metricType.id,
        value: '75',
        timestamp: new Date(),
        source: 'TEST',
        notes: 'Test metric created by E2E test',
      });

      // Verify the metric was created
      expect(newMetric).toBeDefined();
      expect(newMetric).toHaveProperty('id');
      expect(newMetric).toHaveProperty('userId', userId);
      expect(newMetric).toHaveProperty('typeId', metricType.id);
      expect(newMetric).toHaveProperty('value', '75');
      expect(newMetric).toHaveProperty('source', 'TEST');
      expect(newMetric).toHaveProperty('notes', 'Test metric created by E2E test');

      // Verify the metric exists in the database
      await assertRecordExists(prismaService, 'healthMetric', { id: newMetric.id });
    });

    test('should reject invalid health metric values', async () => {
      // Get a metric type
      const metricTypes = await prismaService.healthMetricType.findMany();
      const metricType = metricTypes[0];

      // Attempt to create a metric with an invalid value
      await expect(healthContext.createHealthMetric({
        userId,
        typeId: metricType.id,
        value: 'invalid-value', // Invalid value for the metric type
        timestamp: new Date(),
        source: 'TEST',
      })).rejects.toThrow(DatabaseException);
    });

    test('should track health goals progress', async () => {
      // Get a metric type
      const metricTypes = await prismaService.healthMetricType.findMany();
      const metricType = metricTypes.find(type => type.name === 'STEPS') || metricTypes[0];

      // Create a health goal
      const goal = await healthContext.createHealthGoal({
        userId,
        typeId: metricType.id,
        targetValue: '10000', // 10,000 steps
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'ACTIVE',
        notes: 'Test goal created by E2E test',
      });

      // Create metrics to track progress towards the goal
      await healthContext.createHealthMetric({
        userId,
        typeId: metricType.id,
        value: '8000', // 8,000 steps
        timestamp: new Date(),
        source: 'TEST',
      });

      // Get goal progress
      const progress = await healthContext.getHealthGoalProgress(goal.id);

      // Verify progress was calculated
      expect(progress).toBeDefined();
      expect(progress).toHaveProperty('goalId', goal.id);
      expect(progress).toHaveProperty('currentValue');
      expect(progress).toHaveProperty('targetValue', '10000');
      expect(progress).toHaveProperty('percentComplete');
      expect(progress.percentComplete).toBeGreaterThan(0);
      expect(progress.percentComplete).toBeLessThanOrEqual(100);
    });

    test('should manage device connections', async () => {
      // Get a device type
      const deviceTypes = await prismaService.deviceType.findMany();
      const deviceType = deviceTypes[0];

      // Create a device connection
      const deviceConnection = await healthContext.createDeviceConnection({
        userId,
        typeId: deviceType.id,
        deviceId: `test-device-${Date.now()}`,
        status: 'CONNECTED',
        connectionDate: new Date(),
        settings: JSON.stringify({ testSetting: true }),
      });

      // Verify the device connection was created
      expect(deviceConnection).toBeDefined();
      expect(deviceConnection).toHaveProperty('id');
      expect(deviceConnection).toHaveProperty('userId', userId);
      expect(deviceConnection).toHaveProperty('typeId', deviceType.id);
      expect(deviceConnection).toHaveProperty('status', 'CONNECTED');

      // Update the device connection
      const updatedConnection = await healthContext.updateDeviceConnection(
        deviceConnection.id,
        {
          status: 'DISCONNECTED',
          lastSyncDate: new Date(),
        }
      );

      // Verify the update
      expect(updatedConnection).toHaveProperty('status', 'DISCONNECTED');
      expect(updatedConnection).toHaveProperty('lastSyncDate');

      // Delete the device connection
      await healthContext.deleteDeviceConnection(deviceConnection.id);

      // Verify the device connection was deleted
      await assertRecordNotExists(prismaService, 'deviceConnection', { id: deviceConnection.id });
    });
  });

  /**
   * Care Journey Context Tests
   */
  describe('CareContext', () => {
    let userId: string;
    let careData: any;

    beforeEach(async () => {
      // Create a test user
      const users = await createTestUsers(prismaService, { count: 1 });
      userId = users[0].id;
      testUserIds.push(userId);

      // Create care test data
      careData = await createCareTestData(prismaService, { userId });
    });

    test('should manage appointments with providers', async () => {
      // Get a provider
      const provider = careData.providers[0];

      // Create a new appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointment = await careContext.createAppointment({
        userId,
        providerId: provider.id,
        date: tomorrow,
        time: '14:30',
        status: 'SCHEDULED',
        type: 'IN_PERSON',
        location: 'Test Clinic',
        reason: 'Annual checkup',
        notes: 'Test appointment created by E2E test',
      });

      // Verify the appointment was created
      expect(appointment).toBeDefined();
      expect(appointment).toHaveProperty('id');
      expect(appointment).toHaveProperty('userId', userId);
      expect(appointment).toHaveProperty('providerId', provider.id);
      expect(appointment).toHaveProperty('date');
      expect(appointment).toHaveProperty('time', '14:30');
      expect(appointment).toHaveProperty('status', 'SCHEDULED');

      // Update the appointment
      const updatedAppointment = await careContext.updateAppointment(
        appointment.id,
        {
          time: '15:00',
          notes: 'Updated test appointment',
        }
      );

      // Verify the update
      expect(updatedAppointment).toHaveProperty('time', '15:00');
      expect(updatedAppointment).toHaveProperty('notes', 'Updated test appointment');

      // Get appointments for the user
      const userAppointments = await careContext.getUserAppointments(userId, {
        status: 'SCHEDULED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });

      // Verify appointments were retrieved
      expect(userAppointments).toBeDefined();
      expect(Array.isArray(userAppointments)).toBe(true);
      expect(userAppointments.length).toBeGreaterThan(0);
      expect(userAppointments.some(a => a.id === appointment.id)).toBe(true);

      // Cancel the appointment
      const cancelledAppointment = await careContext.updateAppointmentStatus(
        appointment.id,
        'CANCELLED',
        'Cancelled by E2E test'
      );

      // Verify the cancellation
      expect(cancelledAppointment).toHaveProperty('status', 'CANCELLED');
      expect(cancelledAppointment).toHaveProperty('notes', 'Cancelled by E2E test');
    });

    test('should manage medications with schedules', async () => {
      // Create a new medication
      const medication = await careContext.createMedication({
        userId,
        name: 'Test Medication',
        dosage: '10mg',
        instructions: 'Take once daily with food',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'ACTIVE',
        prescribedBy: 'Dr. Test',
        prescriptionDate: new Date(),
        refillReminder: true,
        notes: 'Test medication created by E2E test',
      });

      // Verify the medication was created
      expect(medication).toBeDefined();
      expect(medication).toHaveProperty('id');
      expect(medication).toHaveProperty('userId', userId);
      expect(medication).toHaveProperty('name', 'Test Medication');
      expect(medication).toHaveProperty('status', 'ACTIVE');

      // Create a medication schedule
      const schedule = await careContext.createMedicationSchedule({
        medicationId: medication.id,
        time: '08:00',
        frequency: 'DAILY',
        daysOfWeek: 'ALL',
        reminderEnabled: true,
      });

      // Verify the schedule was created
      expect(schedule).toBeDefined();
      expect(schedule).toHaveProperty('id');
      expect(schedule).toHaveProperty('medicationId', medication.id);
      expect(schedule).toHaveProperty('time', '08:00');
      expect(schedule).toHaveProperty('frequency', 'DAILY');

      // Get medications with schedules
      const medications = await careContext.getUserMedicationsWithSchedules(userId);

      // Verify medications were retrieved with schedules
      expect(medications).toBeDefined();
      expect(Array.isArray(medications)).toBe(true);
      expect(medications.length).toBeGreaterThan(0);
      
      const foundMedication = medications.find(m => m.id === medication.id);
      expect(foundMedication).toBeDefined();
      expect(foundMedication).toHaveProperty('schedules');
      expect(Array.isArray(foundMedication.schedules)).toBe(true);
      expect(foundMedication.schedules.length).toBeGreaterThan(0);
      expect(foundMedication.schedules[0]).toHaveProperty('id', schedule.id);
    });

    test('should track medication adherence', async () => {
      // Create a medication
      const medication = await careContext.createMedication({
        userId,
        name: 'Adherence Test Med',
        dosage: '5mg',
        instructions: 'Take twice daily',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'ACTIVE',
        prescribedBy: 'Dr. Test',
        prescriptionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        refillReminder: true,
      });

      // Create schedules
      await careContext.createMedicationSchedule({
        medicationId: medication.id,
        time: '08:00',
        frequency: 'DAILY',
        daysOfWeek: 'ALL',
        reminderEnabled: true,
      });

      await careContext.createMedicationSchedule({
        medicationId: medication.id,
        time: '20:00',
        frequency: 'DAILY',
        daysOfWeek: 'ALL',
        reminderEnabled: true,
      });

      // Record adherence for the past few days
      const today = new Date();
      const adherenceDates = [];
      
      // Create adherence records for the past 5 days
      for (let i = 5; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        adherenceDates.push(date);
        
        // Record morning dose (taken)
        await careContext.recordMedicationAdherence({
          medicationId: medication.id,
          scheduledTime: '08:00',
          takenTime: '08:15', // 15 minutes after scheduled
          takenDate: date,
          status: 'TAKEN',
          notes: `Morning dose for day -${i}`,
        });
        
        // Record evening dose (missed for some days to test adherence calculation)
        if (i % 2 === 0) { // Only record as taken on even days
          await careContext.recordMedicationAdherence({
            medicationId: medication.id,
            scheduledTime: '20:00',
            takenTime: '20:10',
            takenDate: date,
            status: 'TAKEN',
            notes: `Evening dose for day -${i}`,
          });
        } else {
          await careContext.recordMedicationAdherence({
            medicationId: medication.id,
            scheduledTime: '20:00',
            takenTime: null,
            takenDate: date,
            status: 'MISSED',
            notes: `Missed evening dose for day -${i}`,
          });
        }
      }

      // Calculate adherence
      const adherence = await careContext.calculateMedicationAdherence(
        medication.id,
        {
          startDate: adherenceDates[0],
          endDate: today,
        }
      );

      // Verify adherence calculation
      expect(adherence).toBeDefined();
      expect(adherence).toHaveProperty('medicationId', medication.id);
      expect(adherence).toHaveProperty('totalDoses');
      expect(adherence).toHaveProperty('takenDoses');
      expect(adherence).toHaveProperty('missedDoses');
      expect(adherence).toHaveProperty('adherenceRate');
      
      // We should have 10 total doses (2 per day for 5 days)
      expect(adherence.totalDoses).toBe(10);
      // We took 5 morning doses and 2-3 evening doses
      expect(adherence.takenDoses).toBeGreaterThanOrEqual(7);
      expect(adherence.missedDoses).toBeLessThanOrEqual(3);
      // Adherence rate should be between 70-80%
      expect(adherence.adherenceRate).toBeGreaterThanOrEqual(70);
      expect(adherence.adherenceRate).toBeLessThanOrEqual(80);
    });

    test('should manage telemedicine sessions', async () => {
      // Get a provider
      const provider = careData.providers[0];

      // Create a telemedicine session
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() + 2); // 2 days from now

      const session = await careContext.createTelemedicineSession({
        userId,
        providerId: provider.id,
        scheduledDate: sessionDate,
        scheduledTime: '10:00',
        status: 'SCHEDULED',
        type: 'VIDEO',
        duration: 30, // 30 minutes
        sessionUrl: 'https://test-session.austa.com.br/test',
        notes: 'Test telemedicine session created by E2E test',
      });

      // Verify the session was created
      expect(session).toBeDefined();
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('userId', userId);
      expect(session).toHaveProperty('providerId', provider.id);
      expect(session).toHaveProperty('scheduledDate');
      expect(session).toHaveProperty('scheduledTime', '10:00');
      expect(session).toHaveProperty('status', 'SCHEDULED');
      expect(session).toHaveProperty('type', 'VIDEO');
      expect(session).toHaveProperty('duration', 30);

      // Get upcoming telemedicine sessions
      const upcomingSessions = await careContext.getUpcomingTelemedicineSessions(userId);

      // Verify sessions were retrieved
      expect(upcomingSessions).toBeDefined();
      expect(Array.isArray(upcomingSessions)).toBe(true);
      expect(upcomingSessions.length).toBeGreaterThan(0);
      expect(upcomingSessions.some(s => s.id === session.id)).toBe(true);

      // Update the session status
      const completedSession = await careContext.updateTelemedicineSessionStatus(
        session.id,
        'COMPLETED',
        {
          actualDuration: 25, // 25 minutes
          notes: 'Session completed successfully',
        }
      );

      // Verify the update
      expect(completedSession).toHaveProperty('status', 'COMPLETED');
      expect(completedSession).toHaveProperty('actualDuration', 25);
      expect(completedSession).toHaveProperty('notes', 'Session completed successfully');
    });
  });

  /**
   * Plan Journey Context Tests
   */
  describe('PlanContext', () => {
    let userId: string;
    let planData: any;

    beforeEach(async () => {
      // Create a test user
      const users = await createTestUsers(prismaService, { count: 1 });
      userId = users[0].id;
      testUserIds.push(userId);

      // Create plan test data
      planData = await createPlanTestData(prismaService, { userId });
    });

    test('should retrieve insurance plan with benefits', async () => {
      // Get the test plan
      const plan = planData.plans[0];

      // Get plan with benefits
      const planWithBenefits = await planContext.getInsurancePlanWithBenefits(plan.id);

      // Verify plan was retrieved with benefits
      expect(planWithBenefits).toBeDefined();
      expect(planWithBenefits).toHaveProperty('id', plan.id);
      expect(planWithBenefits).toHaveProperty('userId', userId);
      expect(planWithBenefits).toHaveProperty('benefits');
      expect(Array.isArray(planWithBenefits.benefits)).toBe(true);
      expect(planWithBenefits.benefits.length).toBeGreaterThan(0);

      // Verify benefit properties
      planWithBenefits.benefits.forEach(benefit => {
        expect(benefit).toHaveProperty('id');
        expect(benefit).toHaveProperty('planId', plan.id);
        expect(benefit).toHaveProperty('name');
        expect(benefit).toHaveProperty('coveragePercentage');
      });
    });

    test('should manage claims with proper status transitions', async () => {
      // Get the test plan
      const plan = planData.plans[0];

      // Get claim types
      const claimTypes = await prismaService.claimType.findMany();
      const claimType = claimTypes[0];

      // Create a new claim
      const claim = await planContext.createClaim({
        userId,
        planId: plan.id,
        typeId: claimType.id,
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        submissionDate: new Date(),
        amount: 250.00,
        status: 'SUBMITTED',
        providerName: 'Test Provider',
        serviceDescription: 'Test service for E2E test',
        notes: 'Test claim created by E2E test',
      });

      // Verify the claim was created
      expect(claim).toBeDefined();
      expect(claim).toHaveProperty('id');
      expect(claim).toHaveProperty('userId', userId);
      expect(claim).toHaveProperty('planId', plan.id);
      expect(claim).toHaveProperty('typeId', claimType.id);
      expect(claim).toHaveProperty('amount', 250.00);
      expect(claim).toHaveProperty('status', 'SUBMITTED');

      // Update claim status to UNDER_REVIEW
      const reviewClaim = await planContext.updateClaimStatus(
        claim.id,
        'UNDER_REVIEW',
        'Claim is being reviewed'
      );

      // Verify status update
      expect(reviewClaim).toHaveProperty('status', 'UNDER_REVIEW');
      expect(reviewClaim).toHaveProperty('notes', 'Claim is being reviewed');

      // Approve the claim
      const approvedClaim = await planContext.approveClaim(
        claim.id,
        {
          approvedAmount: 200.00, // Partial approval
          paymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          notes: 'Claim approved with partial amount',
        }
      );

      // Verify approval
      expect(approvedClaim).toHaveProperty('status', 'APPROVED');
      expect(approvedClaim).toHaveProperty('approvedAmount', 200.00);
      expect(approvedClaim).toHaveProperty('paymentDate');
      expect(approvedClaim).toHaveProperty('notes', 'Claim approved with partial amount');

      // Get claims by status
      const approvedClaims = await planContext.getClaimsByStatus(userId, 'APPROVED');

      // Verify claims were retrieved
      expect(approvedClaims).toBeDefined();
      expect(Array.isArray(approvedClaims)).toBe(true);
      expect(approvedClaims.length).toBeGreaterThan(0);
      expect(approvedClaims.some(c => c.id === claim.id)).toBe(true);
    });

    test('should reject invalid claim transitions', async () => {
      // Get the test plan
      const plan = planData.plans[0];

      // Get claim types
      const claimTypes = await prismaService.claimType.findMany();
      const claimType = claimTypes[0];

      // Create a new claim
      const claim = await planContext.createClaim({
        userId,
        planId: plan.id,
        typeId: claimType.id,
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        submissionDate: new Date(),
        amount: 150.00,
        status: 'SUBMITTED',
        providerName: 'Test Provider',
        serviceDescription: 'Invalid transition test',
      });

      // Try to update from SUBMITTED directly to APPROVED (invalid transition)
      await expect(planContext.updateClaimStatus(
        claim.id,
        'APPROVED',
        'Invalid transition'
      )).rejects.toThrow(DatabaseException);

      // Try to update from SUBMITTED to PAID (invalid transition)
      await expect(planContext.updateClaimStatus(
        claim.id,
        'PAID',
        'Invalid transition'
      )).rejects.toThrow(DatabaseException);

      // Verify claim still has original status
      const unchangedClaim = await prismaService.claim.findUnique({
        where: { id: claim.id },
      });

      expect(unchangedClaim).toHaveProperty('status', 'SUBMITTED');
    });

    test('should manage insurance documents', async () => {
      // Get the test plan
      const plan = planData.plans[0];

      // Create a new document
      const document = await planContext.createDocument({
        userId,
        planId: plan.id,
        name: 'Test Document',
        type: 'RECEIPT',
        url: 'https://test-storage.austa.com.br/documents/test.pdf',
        uploadDate: new Date(),
        status: 'ACTIVE',
        notes: 'Test document created by E2E test',
      });

      // Verify the document was created
      expect(document).toBeDefined();
      expect(document).toHaveProperty('id');
      expect(document).toHaveProperty('userId', userId);
      expect(document).toHaveProperty('planId', plan.id);
      expect(document).toHaveProperty('name', 'Test Document');
      expect(document).toHaveProperty('type', 'RECEIPT');
      expect(document).toHaveProperty('status', 'ACTIVE');

      // Get documents by type
      const receipts = await planContext.getDocumentsByType(userId, 'RECEIPT');

      // Verify documents were retrieved
      expect(receipts).toBeDefined();
      expect(Array.isArray(receipts)).toBe(true);
      expect(receipts.length).toBeGreaterThan(0);
      expect(receipts.some(d => d.id === document.id)).toBe(true);

      // Update document status
      const archivedDocument = await planContext.updateDocumentStatus(
        document.id,
        'ARCHIVED',
        'Document archived by E2E test'
      );

      // Verify status update
      expect(archivedDocument).toHaveProperty('status', 'ARCHIVED');
      expect(archivedDocument).toHaveProperty('notes', 'Document archived by E2E test');
    });

    test('should calculate coverage utilization', async () => {
      // Get the test plan
      const plan = planData.plans[0];

      // Get a benefit
      const benefit = planData.benefits[0];

      // Create approved claims for the benefit
      const claimTypes = await prismaService.claimType.findMany();
      const claimType = claimTypes[0];

      // Create multiple claims to test utilization calculation
      const claims = [];
      const amounts = [100.00, 150.00, 200.00];

      for (const amount of amounts) {
        const claim = await planContext.createClaim({
          userId,
          planId: plan.id,
          typeId: claimType.id,
          serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          amount,
          status: 'APPROVED',
          approvedAmount: amount,
          paymentDate: new Date(),
          providerName: 'Test Provider',
          serviceDescription: `Utilization test - ${amount}`,
          benefitId: benefit.id, // Link to the benefit
        });

        claims.push(claim);
      }

      // Calculate utilization
      const utilization = await planContext.calculateBenefitUtilization(benefit.id);

      // Verify utilization calculation
      expect(utilization).toBeDefined();
      expect(utilization).toHaveProperty('benefitId', benefit.id);
      expect(utilization).toHaveProperty('totalClaims', claims.length);
      expect(utilization).toHaveProperty('totalApproved');
      expect(utilization).toHaveProperty('annualLimit', benefit.annualLimit);
      expect(utilization).toHaveProperty('utilizationPercentage');

      // Total approved should be sum of all claim amounts
      const totalApproved = amounts.reduce((sum, amount) => sum + amount, 0);
      expect(utilization.totalApproved).toBe(totalApproved);

      // Utilization percentage should be calculated correctly
      const expectedPercentage = (totalApproved / benefit.annualLimit) * 100;
      expect(utilization.utilizationPercentage).toBeCloseTo(expectedPercentage, 2);
    });
  });

  /**
   * Cross-Journey Tests
   */
  describe('Cross-Journey Integration', () => {
    let userId: string;
    let healthData: any;
    let careData: any;
    let planData: any;

    beforeEach(async () => {
      // Create a test user
      const users = await createTestUsers(prismaService, { count: 1 });
      userId = users[0].id;
      testUserIds.push(userId);

      // Create data for all journeys
      healthData = await createHealthTestData(prismaService, { userId });
      careData = await createCareTestData(prismaService, { userId });
      planData = await createPlanTestData(prismaService, { userId });
    });

    test('should link health metrics to care appointments', async () => {
      // Get a provider and create an appointment
      const provider = careData.providers[0];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() - 1); // Yesterday

      const appointment = await careContext.createAppointment({
        userId,
        providerId: provider.id,
        date: appointmentDate,
        time: '14:00',
        status: 'COMPLETED',
        type: 'IN_PERSON',
        location: 'Test Clinic',
        reason: 'Blood pressure check',
        notes: 'Cross-journey test appointment',
      });

      // Get a metric type for blood pressure
      const metricTypes = await prismaService.healthMetricType.findMany();
      const bpType = metricTypes.find(type => type.name === 'BLOOD_PRESSURE') || metricTypes[0];

      // Create a health metric linked to the appointment
      const metric = await healthContext.createHealthMetric({
        userId,
        typeId: bpType.id,
        value: '120/80',
        timestamp: appointmentDate,
        source: 'PROVIDER',
        notes: 'Recorded during appointment',
        appointmentId: appointment.id, // Link to appointment
      });

      // Verify the metric was created with appointment link
      expect(metric).toBeDefined();
      expect(metric).toHaveProperty('appointmentId', appointment.id);

      // Get metrics for the appointment
      const appointmentMetrics = await healthContext.getMetricsForAppointment(appointment.id);

      // Verify metrics were retrieved
      expect(appointmentMetrics).toBeDefined();
      expect(Array.isArray(appointmentMetrics)).toBe(true);
      expect(appointmentMetrics.length).toBeGreaterThan(0);
      expect(appointmentMetrics.some(m => m.id === metric.id)).toBe(true);

      // Get appointment with metrics
      const appointmentWithMetrics = await careContext.getAppointmentWithHealthData(appointment.id);

      // Verify appointment has metrics
      expect(appointmentWithMetrics).toBeDefined();
      expect(appointmentWithMetrics).toHaveProperty('id', appointment.id);
      expect(appointmentWithMetrics).toHaveProperty('healthMetrics');
      expect(Array.isArray(appointmentWithMetrics.healthMetrics)).toBe(true);
      expect(appointmentWithMetrics.healthMetrics.length).toBeGreaterThan(0);
      expect(appointmentWithMetrics.healthMetrics.some(m => m.id === metric.id)).toBe(true);
    });

    test('should link care treatments to plan claims', async () => {
      // Create a treatment
      const treatment = await careContext.createTreatment({
        userId,
        name: 'Physical Therapy',
        description: 'Weekly physical therapy sessions',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: 'ACTIVE',
        type: 'PHYSICAL_THERAPY',
        frequency: 'WEEKLY',
        notes: 'Cross-journey test treatment',
      });

      // Get the plan and claim type
      const plan = planData.plans[0];
      const claimTypes = await prismaService.claimType.findMany();
      const claimType = claimTypes.find(type => type.name === 'Terapia') || claimTypes[0];

      // Create a claim linked to the treatment
      const claim = await planContext.createClaim({
        userId,
        planId: plan.id,
        typeId: claimType.id,
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        submissionDate: new Date(),
        amount: 150.00,
        status: 'SUBMITTED',
        providerName: 'Test Physical Therapy Clinic',
        serviceDescription: 'Physical therapy session',
        notes: 'Claim for treatment session',
        treatmentId: treatment.id, // Link to treatment
      });

      // Verify the claim was created with treatment link
      expect(claim).toBeDefined();
      expect(claim).toHaveProperty('treatmentId', treatment.id);

      // Get claims for the treatment
      const treatmentClaims = await planContext.getClaimsForTreatment(treatment.id);

      // Verify claims were retrieved
      expect(treatmentClaims).toBeDefined();
      expect(Array.isArray(treatmentClaims)).toBe(true);
      expect(treatmentClaims.length).toBeGreaterThan(0);
      expect(treatmentClaims.some(c => c.id === claim.id)).toBe(true);

      // Get treatment with claims
      const treatmentWithClaims = await careContext.getTreatmentWithClaims(treatment.id);

      // Verify treatment has claims
      expect(treatmentWithClaims).toBeDefined();
      expect(treatmentWithClaims).toHaveProperty('id', treatment.id);
      expect(treatmentWithClaims).toHaveProperty('claims');
      expect(Array.isArray(treatmentWithClaims.claims)).toBe(true);
      expect(treatmentWithClaims.claims.length).toBeGreaterThan(0);
      expect(treatmentWithClaims.claims.some(c => c.id === claim.id)).toBe(true);
    });

    test('should maintain data integrity across journeys', async () => {
      // Create data in all journeys for the same user
      
      // 1. Create a health goal
      const metricTypes = await prismaService.healthMetricType.findMany();
      const stepsType = metricTypes.find(type => type.name === 'STEPS') || metricTypes[0];
      
      const healthGoal = await healthContext.createHealthGoal({
        userId,
        typeId: stepsType.id,
        targetValue: '10000',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'ACTIVE',
        notes: 'Cross-journey integrity test goal',
      });
      
      // 2. Create a care appointment
      const provider = careData.providers[0];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 7); // 7 days from now
      
      const appointment = await careContext.createAppointment({
        userId,
        providerId: provider.id,
        date: appointmentDate,
        time: '10:00',
        status: 'SCHEDULED',
        type: 'IN_PERSON',
        location: 'Test Clinic',
        reason: 'Fitness consultation',
        notes: 'Appointment to discuss step goal progress',
      });
      
      // 3. Create a plan benefit
      const plan = planData.plans[0];
      
      const benefit = await planContext.createBenefit({
        planId: plan.id,
        name: 'Fitness Program',
        description: 'Coverage for fitness programs and equipment',
        coveragePercentage: 70,
        annualLimit: 1000.00,
        requiresAuthorization: false,
        waitingPeriod: 0,
        notes: 'Benefit for fitness activities',
      });
      
      // Now verify cross-journey integrity by retrieving user data from all contexts
      
      // Get user health profile
      const healthProfile = await healthContext.getUserHealthProfile(userId);
      
      // Verify health profile contains the goal
      expect(healthProfile).toBeDefined();
      expect(healthProfile).toHaveProperty('goals');
      expect(Array.isArray(healthProfile.goals)).toBe(true);
      expect(healthProfile.goals.some(g => g.id === healthGoal.id)).toBe(true);
      
      // Get user care profile
      const careProfile = await careContext.getUserCareProfile(userId);
      
      // Verify care profile contains the appointment
      expect(careProfile).toBeDefined();
      expect(careProfile).toHaveProperty('upcomingAppointments');
      expect(Array.isArray(careProfile.upcomingAppointments)).toBe(true);
      expect(careProfile.upcomingAppointments.some(a => a.id === appointment.id)).toBe(true);
      
      // Get user plan profile
      const planProfile = await planContext.getUserPlanProfile(userId);
      
      // Verify plan profile contains the plan with benefit
      expect(planProfile).toBeDefined();
      expect(planProfile).toHaveProperty('plans');
      expect(Array.isArray(planProfile.plans)).toBe(true);
      expect(planProfile.plans.some(p => p.id === plan.id)).toBe(true);
      
      const userPlan = planProfile.plans.find(p => p.id === plan.id);
      expect(userPlan).toHaveProperty('benefits');
      expect(Array.isArray(userPlan.benefits)).toBe(true);
      expect(userPlan.benefits.some(b => b.id === benefit.id)).toBe(true);
      
      // Get comprehensive user profile across all journeys
      const userProfile = await prismaService.$transaction(async (tx) => {
        // Create journey contexts with the transaction
        const txHealthContext = new HealthContext(tx as any);
        const txCareContext = new CareContext(tx as any);
        const txPlanContext = new PlanContext(tx as any);
        
        // Get data from all journeys in a single transaction
        const health = await txHealthContext.getUserHealthProfile(userId);
        const care = await txCareContext.getUserCareProfile(userId);
        const plan = await txPlanContext.getUserPlanProfile(userId);
        
        return { health, care, plan };
      });
      
      // Verify comprehensive profile contains data from all journeys
      expect(userProfile).toBeDefined();
      expect(userProfile).toHaveProperty('health');
      expect(userProfile).toHaveProperty('care');
      expect(userProfile).toHaveProperty('plan');
      
      // Verify health data
      expect(userProfile.health.goals.some(g => g.id === healthGoal.id)).toBe(true);
      
      // Verify care data
      expect(userProfile.care.upcomingAppointments.some(a => a.id === appointment.id)).toBe(true);
      
      // Verify plan data
      const profilePlan = userProfile.plan.plans.find(p => p.id === plan.id);
      expect(profilePlan.benefits.some(b => b.id === benefit.id)).toBe(true);
    });
  });
});