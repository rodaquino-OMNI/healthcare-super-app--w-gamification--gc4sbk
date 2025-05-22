/**
 * @file journey-context-scenarios.ts
 * @description Provides test fixtures for journey-specific database contexts, enabling isolated testing
 * of Health, Care, and Plan journey database operations. These fixtures validate that each journey's
 * database operations use the correct context, ensuring data isolation and proper cross-journey data
 * access patterns.
 */

import { PrismaClient } from '@prisma/client';
import { JourneyId } from '../../../src/types/journey.types';
import { JourneyContext } from '../../../src/middleware/middleware.interface';
import { DatabaseErrorType } from '../../../src/errors/database-error.types';
import { TransactionIsolationLevel } from '../../../src/transactions/transaction.interface';

/**
 * Interface for a journey context test scenario
 */
export interface JourneyContextScenario {
  /** Unique identifier for the scenario */
  id: string;
  
  /** Human-readable name of the scenario */
  name: string;
  
  /** Description of what the scenario tests */
  description: string;
  
  /** Journey ID that the scenario primarily tests */
  primaryJourneyId: JourneyId;
  
  /** Additional journey IDs involved in the scenario, if any */
  relatedJourneyIds?: JourneyId[];
  
  /** Test data setup function */
  setup: (prisma: PrismaClient) => Promise<any>;
  
  /** Test data cleanup function */
  cleanup: (prisma: PrismaClient) => Promise<void>;
  
  /** Expected outcomes for validation */
  expectedOutcomes: Record<string, any>;
  
  /** Configuration overrides for the journey context */
  contextConfig?: Record<string, any>;
  
  /** Metadata for the scenario */
  metadata?: Record<string, any>;
}

/**
 * Interface for a cross-journey access scenario
 */
export interface CrossJourneyAccessScenario extends JourneyContextScenario {
  /** Source journey ID */
  sourceJourneyId: JourneyId;
  
  /** Target journey ID */
  targetJourneyId: JourneyId;
  
  /** Access pattern being tested */
  accessPattern: 'read' | 'write' | 'both';
  
  /** Whether the access should be allowed */
  accessAllowed: boolean;
  
  /** Required permissions for the access to be allowed */
  requiredPermissions?: string[];
}

/**
 * Interface for a journey-specific connection configuration scenario
 */
export interface ConnectionConfigScenario extends JourneyContextScenario {
  /** Connection configuration overrides */
  connectionConfig: {
    poolMin?: number;
    poolMax?: number;
    poolIdle?: number;
    connectionTimeout?: number;
    queryTimeout?: number;
    enableQueryLogging?: boolean;
    enablePerformanceTracking?: boolean;
  };
  
  /** Expected connection behavior */
  expectedBehavior: {
    maxConcurrentQueries?: number;
    expectedResponseTimeMs?: number;
    shouldLogQueries?: boolean;
    shouldTrackPerformance?: boolean;
  };
}

/**
 * Health journey context test scenarios
 */
export const healthJourneyScenarios: JourneyContextScenario[] = [
  {
    id: 'health-metrics-isolation',
    name: 'Health Metrics Data Isolation',
    description: 'Tests that health metrics are properly isolated within the Health journey context',
    primaryJourneyId: 'health',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Health Test User',
          email: 'health-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678901',
        },
      });
      
      // Create health metric type
      const metricType = await prisma.healthMetricType.create({
        data: {
          name: 'TEST_HEART_RATE',
          unit: 'bpm',
          normalRangeMin: 60,
          normalRangeMax: 100,
        },
      });
      
      // Create health metrics for the user
      const metrics = [];
      for (let i = 0; i < 5; i++) {
        const metric = await prisma.healthMetric.create({
          data: {
            userId: user.id,
            typeId: metricType.id,
            value: 70 + i,
            recordedAt: new Date(Date.now() - i * 3600000),
            journeyId: 'health',
            source: 'TEST',
          },
        });
        metrics.push(metric);
      }
      
      return { user, metricType, metrics };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data in reverse order of creation
      await prisma.healthMetric.deleteMany({
        where: { source: 'TEST' },
      });
      await prisma.healthMetricType.deleteMany({
        where: { name: 'TEST_HEART_RATE' },
      });
      await prisma.user.deleteMany({
        where: { email: 'health-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      metricsCount: 5,
      journeyId: 'health',
      accessibleFromHealthContext: true,
      accessibleFromCareContext: false,
      accessibleFromPlanContext: false,
    },
    contextConfig: {
      maxConnections: 5,
      enableLogging: true,
      transactionTimeout: 10000,
      maxRetryAttempts: 2,
    },
  },
  {
    id: 'health-goals-transaction',
    name: 'Health Goals Transaction Management',
    description: 'Tests transaction management for health goals within the Health journey context',
    primaryJourneyId: 'health',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Health Goals Test User',
          email: 'health-goals-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678902',
        },
      });
      
      return { user };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.healthGoal.deleteMany({
        where: { userId: { in: (await prisma.user.findMany({
          where: { email: 'health-goals-test@austa.com.br' },
          select: { id: true },
        })).map(u => u.id) } },
      });
      await prisma.user.deleteMany({
        where: { email: 'health-goals-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      transactionSuccess: true,
      goalsCreated: 1,
      journeyId: 'health',
      isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    },
    contextConfig: {
      transactionTimeout: 5000,
      maxRetryAttempts: 3,
      retryableErrorTypes: [DatabaseErrorType.CONNECTION, DatabaseErrorType.TRANSACTION],
    },
  },
  {
    id: 'health-device-connections',
    name: 'Health Device Connections',
    description: 'Tests device connection management within the Health journey context',
    primaryJourneyId: 'health',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Device Test User',
          email: 'device-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678903',
        },
      });
      
      // Create device type
      const deviceType = await prisma.deviceType.create({
        data: {
          name: 'TEST_DEVICE',
          description: 'Test device for journey context testing',
          manufacturer: 'Test Manufacturer',
        },
      });
      
      return { user, deviceType };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.deviceConnection.deleteMany({
        where: { deviceId: { contains: 'TEST_' } },
      });
      await prisma.deviceType.deleteMany({
        where: { name: 'TEST_DEVICE' },
      });
      await prisma.user.deleteMany({
        where: { email: 'device-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      connectionSuccess: true,
      journeyId: 'health',
      deviceSyncEnabled: true,
    },
    contextConfig: {
      enableLogging: true,
    },
  },
];

/**
 * Care journey context test scenarios
 */
export const careJourneyScenarios: JourneyContextScenario[] = [
  {
    id: 'care-appointments-isolation',
    name: 'Care Appointments Data Isolation',
    description: 'Tests that appointments are properly isolated within the Care journey context',
    primaryJourneyId: 'care',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Care Test User',
          email: 'care-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678904',
        },
      });
      
      // Create provider specialty
      const specialty = await prisma.providerSpecialty.create({
        data: {
          name: 'TEST_SPECIALTY',
          description: 'Test specialty for journey context testing',
        },
      });
      
      // Create provider
      const provider = await prisma.provider.create({
        data: {
          name: 'Test Provider',
          email: 'test-provider@austa.com.br',
          specialtyId: specialty.id,
          journeyId: 'care',
        },
      });
      
      // Create appointments for the user
      const appointments = [];
      for (let i = 0; i < 3; i++) {
        const appointment = await prisma.appointment.create({
          data: {
            userId: user.id,
            providerId: provider.id,
            scheduledAt: new Date(Date.now() + (i + 1) * 86400000), // Future dates
            status: 'SCHEDULED',
            journeyId: 'care',
            notes: 'Test appointment',
          },
        });
        appointments.push(appointment);
      }
      
      return { user, provider, specialty, appointments };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data in reverse order of creation
      await prisma.appointment.deleteMany({
        where: { notes: 'Test appointment' },
      });
      await prisma.provider.deleteMany({
        where: { email: 'test-provider@austa.com.br' },
      });
      await prisma.providerSpecialty.deleteMany({
        where: { name: 'TEST_SPECIALTY' },
      });
      await prisma.user.deleteMany({
        where: { email: 'care-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      appointmentsCount: 3,
      journeyId: 'care',
      accessibleFromCareContext: true,
      accessibleFromHealthContext: false,
      accessibleFromPlanContext: false,
    },
    contextConfig: {
      maxConnections: 5,
      enableLogging: true,
    },
  },
  {
    id: 'care-medications-transaction',
    name: 'Care Medications Transaction Management',
    description: 'Tests transaction management for medications within the Care journey context',
    primaryJourneyId: 'care',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Medication Test User',
          email: 'medication-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678905',
        },
      });
      
      return { user };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.medication.deleteMany({
        where: { userId: { in: (await prisma.user.findMany({
          where: { email: 'medication-test@austa.com.br' },
          select: { id: true },
        })).map(u => u.id) } },
      });
      await prisma.user.deleteMany({
        where: { email: 'medication-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      transactionSuccess: true,
      medicationsCreated: 1,
      journeyId: 'care',
      isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    },
    contextConfig: {
      transactionTimeout: 5000,
      maxRetryAttempts: 3,
    },
  },
  {
    id: 'care-telemedicine-session',
    name: 'Care Telemedicine Session Management',
    description: 'Tests telemedicine session management within the Care journey context',
    primaryJourneyId: 'care',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Telemedicine Test User',
          email: 'telemedicine-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678906',
        },
      });
      
      // Create provider specialty
      const specialty = await prisma.providerSpecialty.create({
        data: {
          name: 'TEST_TELE_SPECIALTY',
          description: 'Test telemedicine specialty',
        },
      });
      
      // Create provider
      const provider = await prisma.provider.create({
        data: {
          name: 'Telemedicine Test Provider',
          email: 'test-tele-provider@austa.com.br',
          specialtyId: specialty.id,
          journeyId: 'care',
        },
      });
      
      return { user, provider, specialty };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.telemedicineSession.deleteMany({
        where: { providerId: { in: (await prisma.provider.findMany({
          where: { email: 'test-tele-provider@austa.com.br' },
          select: { id: true },
        })).map(p => p.id) } },
      });
      await prisma.provider.deleteMany({
        where: { email: 'test-tele-provider@austa.com.br' },
      });
      await prisma.providerSpecialty.deleteMany({
        where: { name: 'TEST_TELE_SPECIALTY' },
      });
      await prisma.user.deleteMany({
        where: { email: 'telemedicine-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      sessionCreationSuccess: true,
      journeyId: 'care',
      sessionStatus: 'SCHEDULED',
    },
    contextConfig: {
      enableLogging: true,
    },
  },
];

/**
 * Plan journey context test scenarios
 */
export const planJourneyScenarios: JourneyContextScenario[] = [
  {
    id: 'plan-claims-isolation',
    name: 'Plan Claims Data Isolation',
    description: 'Tests that claims are properly isolated within the Plan journey context',
    primaryJourneyId: 'plan',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Plan Test User',
          email: 'plan-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678907',
        },
      });
      
      // Create claim type
      const claimType = await prisma.claimType.create({
        data: {
          name: 'TEST_CLAIM_TYPE',
          description: 'Test claim type for journey context testing',
        },
      });
      
      // Create insurance plan type
      const planType = await prisma.insurancePlanType.create({
        data: {
          name: 'TEST_PLAN_TYPE',
          description: 'Test plan type for journey context testing',
        },
      });
      
      // Create insurance plan
      const plan = await prisma.insurancePlan.create({
        data: {
          userId: user.id,
          typeId: planType.id,
          number: 'TEST123456',
          provider: 'Test Insurance',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 86400000),
          journeyId: 'plan',
        },
      });
      
      // Create claims for the user
      const claims = [];
      for (let i = 0; i < 3; i++) {
        const claim = await prisma.claim.create({
          data: {
            userId: user.id,
            planId: plan.id,
            typeId: claimType.id,
            amount: 100 * (i + 1),
            status: 'SUBMITTED',
            submittedAt: new Date(),
            description: 'Test claim',
            journeyId: 'plan',
          },
        });
        claims.push(claim);
      }
      
      return { user, claimType, planType, plan, claims };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data in reverse order of creation
      await prisma.claim.deleteMany({
        where: { description: 'Test claim' },
      });
      await prisma.insurancePlan.deleteMany({
        where: { number: 'TEST123456' },
      });
      await prisma.insurancePlanType.deleteMany({
        where: { name: 'TEST_PLAN_TYPE' },
      });
      await prisma.claimType.deleteMany({
        where: { name: 'TEST_CLAIM_TYPE' },
      });
      await prisma.user.deleteMany({
        where: { email: 'plan-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      claimsCount: 3,
      journeyId: 'plan',
      accessibleFromPlanContext: true,
      accessibleFromHealthContext: false,
      accessibleFromCareContext: false,
    },
    contextConfig: {
      maxConnections: 5,
      enableLogging: true,
    },
  },
  {
    id: 'plan-documents-transaction',
    name: 'Plan Documents Transaction Management',
    description: 'Tests transaction management for documents within the Plan journey context',
    primaryJourneyId: 'plan',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Document Test User',
          email: 'document-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678908',
        },
      });
      
      // Create insurance plan type
      const planType = await prisma.insurancePlanType.create({
        data: {
          name: 'TEST_DOC_PLAN_TYPE',
          description: 'Test plan type for document testing',
        },
      });
      
      // Create insurance plan
      const plan = await prisma.insurancePlan.create({
        data: {
          userId: user.id,
          typeId: planType.id,
          number: 'TEST789012',
          provider: 'Test Insurance',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 86400000),
          journeyId: 'plan',
        },
      });
      
      return { user, planType, plan };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.document.deleteMany({
        where: { planId: { in: (await prisma.insurancePlan.findMany({
          where: { number: 'TEST789012' },
          select: { id: true },
        })).map(p => p.id) } },
      });
      await prisma.insurancePlan.deleteMany({
        where: { number: 'TEST789012' },
      });
      await prisma.insurancePlanType.deleteMany({
        where: { name: 'TEST_DOC_PLAN_TYPE' },
      });
      await prisma.user.deleteMany({
        where: { email: 'document-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      transactionSuccess: true,
      documentsCreated: 1,
      journeyId: 'plan',
      isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    },
    contextConfig: {
      transactionTimeout: 5000,
      maxRetryAttempts: 3,
    },
  },
  {
    id: 'plan-benefits-query',
    name: 'Plan Benefits Query Optimization',
    description: 'Tests query optimization for benefits within the Plan journey context',
    primaryJourneyId: 'plan',
    setup: async (prisma: PrismaClient) => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Benefits Test User',
          email: 'benefits-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678909',
        },
      });
      
      // Create insurance plan type
      const planType = await prisma.insurancePlanType.create({
        data: {
          name: 'TEST_BENEFIT_PLAN_TYPE',
          description: 'Test plan type for benefits testing',
        },
      });
      
      // Create insurance plan
      const plan = await prisma.insurancePlan.create({
        data: {
          userId: user.id,
          typeId: planType.id,
          number: 'TEST345678',
          provider: 'Test Insurance',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 86400000),
          journeyId: 'plan',
        },
      });
      
      // Create benefits for the plan
      const benefits = [];
      for (let i = 0; i < 10; i++) {
        const benefit = await prisma.benefit.create({
          data: {
            planId: plan.id,
            name: `Test Benefit ${i}`,
            description: 'Test benefit for query optimization',
            coveragePercentage: 80,
            annualLimit: 5000,
            journeyId: 'plan',
          },
        });
        benefits.push(benefit);
      }
      
      return { user, planType, plan, benefits };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.benefit.deleteMany({
        where: { description: 'Test benefit for query optimization' },
      });
      await prisma.insurancePlan.deleteMany({
        where: { number: 'TEST345678' },
      });
      await prisma.insurancePlanType.deleteMany({
        where: { name: 'TEST_BENEFIT_PLAN_TYPE' },
      });
      await prisma.user.deleteMany({
        where: { email: 'benefits-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      benefitsCount: 10,
      journeyId: 'plan',
      queryOptimized: true,
      queryTimeMs: { lessThan: 100 },
    },
    contextConfig: {
      enableLogging: true,
    },
  },
];

/**
 * Cross-journey access test scenarios
 */
export const crossJourneyScenarios: CrossJourneyAccessScenario[] = [
  {
    id: 'health-to-care-access',
    name: 'Health to Care Journey Access',
    description: 'Tests access from Health journey to Care journey data with proper permissions',
    primaryJourneyId: 'health',
    sourceJourneyId: 'health',
    targetJourneyId: 'care',
    relatedJourneyIds: ['care'],
    accessPattern: 'read',
    accessAllowed: true,
    requiredPermissions: ['care:appointments:read', 'care:medications:read'],
    setup: async (prisma: PrismaClient) => {
      // Create test user with roles that have cross-journey permissions
      const user = await prisma.user.create({
        data: {
          name: 'Cross Journey Test User',
          email: 'cross-journey-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678910',
        },
      });
      
      // Get the User role (which has cross-journey permissions)
      const userRole = await prisma.role.findFirst({
        where: { name: 'User' },
      });
      
      // Assign role to user
      if (userRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            roles: {
              connect: { id: userRole.id },
            },
          },
        });
      }
      
      // Create health metric type
      const metricType = await prisma.healthMetricType.create({
        data: {
          name: 'CROSS_TEST_HEART_RATE',
          unit: 'bpm',
          normalRangeMin: 60,
          normalRangeMax: 100,
        },
      });
      
      // Create health metric
      const healthMetric = await prisma.healthMetric.create({
        data: {
          userId: user.id,
          typeId: metricType.id,
          value: 75,
          recordedAt: new Date(),
          journeyId: 'health',
          source: 'CROSS_TEST',
        },
      });
      
      // Create provider specialty
      const specialty = await prisma.providerSpecialty.create({
        data: {
          name: 'CROSS_TEST_SPECIALTY',
          description: 'Cross-journey test specialty',
        },
      });
      
      // Create provider
      const provider = await prisma.provider.create({
        data: {
          name: 'Cross Test Provider',
          email: 'cross-test-provider@austa.com.br',
          specialtyId: specialty.id,
          journeyId: 'care',
        },
      });
      
      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          userId: user.id,
          providerId: provider.id,
          scheduledAt: new Date(Date.now() + 86400000),
          status: 'SCHEDULED',
          journeyId: 'care',
          notes: 'Cross-journey test appointment',
        },
      });
      
      return { user, userRole, metricType, healthMetric, specialty, provider, appointment };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.appointment.deleteMany({
        where: { notes: 'Cross-journey test appointment' },
      });
      await prisma.provider.deleteMany({
        where: { email: 'cross-test-provider@austa.com.br' },
      });
      await prisma.providerSpecialty.deleteMany({
        where: { name: 'CROSS_TEST_SPECIALTY' },
      });
      await prisma.healthMetric.deleteMany({
        where: { source: 'CROSS_TEST' },
      });
      await prisma.healthMetricType.deleteMany({
        where: { name: 'CROSS_TEST_HEART_RATE' },
      });
      await prisma.user.deleteMany({
        where: { email: 'cross-journey-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      canAccessCareAppointments: true,
      appointmentsCount: 1,
      healthMetricsCount: 1,
      crossJourneyRelationshipCreated: true,
    },
    contextConfig: {
      enableLogging: true,
    },
  },
  {
    id: 'care-to-plan-access',
    name: 'Care to Plan Journey Access',
    description: 'Tests access from Care journey to Plan journey data with proper permissions',
    primaryJourneyId: 'care',
    sourceJourneyId: 'care',
    targetJourneyId: 'plan',
    relatedJourneyIds: ['plan'],
    accessPattern: 'read',
    accessAllowed: true,
    requiredPermissions: ['plan:coverage:read', 'plan:benefits:read'],
    setup: async (prisma: PrismaClient) => {
      // Create test user with roles that have cross-journey permissions
      const user = await prisma.user.create({
        data: {
          name: 'Care-Plan Test User',
          email: 'care-plan-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678911',
        },
      });
      
      // Get the User role (which has cross-journey permissions)
      const userRole = await prisma.role.findFirst({
        where: { name: 'User' },
      });
      
      // Assign role to user
      if (userRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            roles: {
              connect: { id: userRole.id },
            },
          },
        });
      }
      
      // Create provider specialty
      const specialty = await prisma.providerSpecialty.create({
        data: {
          name: 'CARE_PLAN_TEST_SPECIALTY',
          description: 'Care-Plan cross-journey test specialty',
        },
      });
      
      // Create provider
      const provider = await prisma.provider.create({
        data: {
          name: 'Care-Plan Test Provider',
          email: 'care-plan-test-provider@austa.com.br',
          specialtyId: specialty.id,
          journeyId: 'care',
        },
      });
      
      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          userId: user.id,
          providerId: provider.id,
          scheduledAt: new Date(Date.now() + 86400000),
          status: 'SCHEDULED',
          journeyId: 'care',
          notes: 'Care-Plan cross-journey test appointment',
        },
      });
      
      // Create insurance plan type
      const planType = await prisma.insurancePlanType.create({
        data: {
          name: 'CARE_PLAN_TEST_TYPE',
          description: 'Care-Plan test plan type',
        },
      });
      
      // Create insurance plan
      const plan = await prisma.insurancePlan.create({
        data: {
          userId: user.id,
          typeId: planType.id,
          number: 'CAREPLAN123',
          provider: 'Test Insurance',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 86400000),
          journeyId: 'plan',
        },
      });
      
      // Create benefit
      const benefit = await prisma.benefit.create({
        data: {
          planId: plan.id,
          name: 'Care-Plan Test Benefit',
          description: 'Test benefit for cross-journey access',
          coveragePercentage: 80,
          annualLimit: 5000,
          journeyId: 'plan',
        },
      });
      
      return { user, userRole, specialty, provider, appointment, planType, plan, benefit };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.benefit.deleteMany({
        where: { name: 'Care-Plan Test Benefit' },
      });
      await prisma.insurancePlan.deleteMany({
        where: { number: 'CAREPLAN123' },
      });
      await prisma.insurancePlanType.deleteMany({
        where: { name: 'CARE_PLAN_TEST_TYPE' },
      });
      await prisma.appointment.deleteMany({
        where: { notes: 'Care-Plan cross-journey test appointment' },
      });
      await prisma.provider.deleteMany({
        where: { email: 'care-plan-test-provider@austa.com.br' },
      });
      await prisma.providerSpecialty.deleteMany({
        where: { name: 'CARE_PLAN_TEST_SPECIALTY' },
      });
      await prisma.user.deleteMany({
        where: { email: 'care-plan-test@austa.com.br' },
      });
    },
    expectedOutcomes: {
      canAccessPlanBenefits: true,
      benefitsCount: 1,
      appointmentsCount: 1,
      crossJourneyRelationshipCreated: true,
    },
    contextConfig: {
      enableLogging: true,
    },
  },
  {
    id: 'plan-to-health-access-denied',
    name: 'Plan to Health Journey Access Denied',
    description: 'Tests access denial from Plan journey to Health journey data without proper permissions',
    primaryJourneyId: 'plan',
    sourceJourneyId: 'plan',
    targetJourneyId: 'health',
    relatedJourneyIds: ['health'],
    accessPattern: 'read',
    accessAllowed: false,
    requiredPermissions: ['health:metrics:read'],
    setup: async (prisma: PrismaClient) => {
      // Create test user with limited permissions
      const user = await prisma.user.create({
        data: {
          name: 'Limited Access Test User',
          email: 'limited-access-test@austa.com.br',
          password: 'password-hash',
          phone: '+5511999999999',
          cpf: '12345678912',
        },
      });
      
      // Create a custom role with limited permissions
      const limitedRole = await prisma.role.create({
        data: {
          name: 'LimitedPlanRole',
          description: 'Limited role for testing access denial',
          isDefault: false,
          journey: 'plan',
        },
      });
      
      // Get only plan-related permissions
      const planPermissions = await prisma.permission.findMany({
        where: {
          name: {
            startsWith: 'plan:',
          },
        },
      });
      
      // Assign plan permissions to the role
      await prisma.role.update({
        where: { id: limitedRole.id },
        data: {
          permissions: {
            connect: planPermissions.map(p => ({ id: p.id })),
          },
        },
      });
      
      // Assign role to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: {
            connect: { id: limitedRole.id },
          },
        },
      });
      
      // Create insurance plan type
      const planType = await prisma.insurancePlanType.create({
        data: {
          name: 'LIMITED_TEST_TYPE',
          description: 'Limited access test plan type',
        },
      });
      
      // Create insurance plan
      const plan = await prisma.insurancePlan.create({
        data: {
          userId: user.id,
          typeId: planType.id,
          number: 'LIMITED123',
          provider: 'Test Insurance',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 86400000),
          journeyId: 'plan',
        },
      });
      
      // Create health metric type
      const metricType = await prisma.healthMetricType.create({
        data: {
          name: 'LIMITED_TEST_HEART_RATE',
          unit: 'bpm',
          normalRangeMin: 60,
          normalRangeMax: 100,
        },
      });
      
      // Create health metric
      const healthMetric = await prisma.healthMetric.create({
        data: {
          userId: user.id,
          typeId: metricType.id,
          value: 75,
          recordedAt: new Date(),
          journeyId: 'health',
          source: 'LIMITED_TEST',
        },
      });
      
      return { user, limitedRole, planPermissions, planType, plan, metricType, healthMetric };
    },
    cleanup: async (prisma: PrismaClient) => {
      // Clean up test data
      await prisma.healthMetric.deleteMany({
        where: { source: 'LIMITED_TEST' },
      });
      await prisma.healthMetricType.deleteMany({
        where: { name: 'LIMITED_TEST_HEART_RATE' },
      });
      await prisma.insurancePlan.deleteMany({
        where: { number: 'LIMITED123' },
      });
      await prisma.insurancePlanType.deleteMany({
        where: { name: 'LIMITED_TEST_TYPE' },
      });
      
      // Get the user to delete
      const user = await prisma.user.findUnique({
        where: { email: 'limited-access-test@austa.com.br' },
        include: { roles: true },
      });
      
      if (user) {
        // Delete the role
        for (const role of user.roles) {
          if (role.name === 'LimitedPlanRole') {
            await prisma.role.delete({
              where: { id: role.id },
            });
          }
        }
        
        // Delete the user
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
    expectedOutcomes: {
      canAccessHealthMetrics: false,
      accessDeniedError: true,
      planAccessSuccessful: true,
      crossJourneyRelationshipCreated: false,
    },
    contextConfig: {
      enableLogging: true,
    },
  },
];

/**
 * Connection configuration test scenarios
 */
export const connectionConfigScenarios: ConnectionConfigScenario[] = [
  {
    id: 'health-high-concurrency',
    name: 'Health Journey High Concurrency',
    description: 'Tests the Health journey context with high concurrency configuration',
    primaryJourneyId: 'health',
    connectionConfig: {
      poolMin: 5,
      poolMax: 20,
      poolIdle: 10000,
      connectionTimeout: 30000,
      queryTimeout: 10000,
      enableQueryLogging: false,
      enablePerformanceTracking: true,
    },
    expectedBehavior: {
      maxConcurrentQueries: 20,
      expectedResponseTimeMs: 100,
      shouldLogQueries: false,
      shouldTrackPerformance: true,
    },
    setup: async (prisma: PrismaClient) => {
      // No specific setup needed for connection testing
      return {};
    },
    cleanup: async (prisma: PrismaClient) => {
      // No specific cleanup needed for connection testing
    },
    expectedOutcomes: {
      connectionPoolSize: 20,
      performanceTracking: true,
      queryLogging: false,
    },
    contextConfig: {
      maxConnections: 20,
      enableLogging: false,
      transactionTimeout: 10000,
    },
  },
  {
    id: 'care-optimized-logging',
    name: 'Care Journey Optimized Logging',
    description: 'Tests the Care journey context with optimized logging configuration',
    primaryJourneyId: 'care',
    connectionConfig: {
      poolMin: 2,
      poolMax: 10,
      poolIdle: 30000,
      connectionTimeout: 15000,
      queryTimeout: 5000,
      enableQueryLogging: true,
      enablePerformanceTracking: true,
    },
    expectedBehavior: {
      maxConcurrentQueries: 10,
      expectedResponseTimeMs: 50,
      shouldLogQueries: true,
      shouldTrackPerformance: true,
    },
    setup: async (prisma: PrismaClient) => {
      // No specific setup needed for connection testing
      return {};
    },
    cleanup: async (prisma: PrismaClient) => {
      // No specific cleanup needed for connection testing
    },
    expectedOutcomes: {
      connectionPoolSize: 10,
      performanceTracking: true,
      queryLogging: true,
      logFormat: 'structured',
    },
    contextConfig: {
      maxConnections: 10,
      enableLogging: true,
      transactionTimeout: 5000,
    },
  },
  {
    id: 'plan-low-latency',
    name: 'Plan Journey Low Latency',
    description: 'Tests the Plan journey context with low latency configuration',
    primaryJourneyId: 'plan',
    connectionConfig: {
      poolMin: 3,
      poolMax: 15,
      poolIdle: 5000,
      connectionTimeout: 10000,
      queryTimeout: 3000,
      enableQueryLogging: false,
      enablePerformanceTracking: true,
    },
    expectedBehavior: {
      maxConcurrentQueries: 15,
      expectedResponseTimeMs: 30,
      shouldLogQueries: false,
      shouldTrackPerformance: true,
    },
    setup: async (prisma: PrismaClient) => {
      // No specific setup needed for connection testing
      return {};
    },
    cleanup: async (prisma: PrismaClient) => {
      // No specific cleanup needed for connection testing
    },
    expectedOutcomes: {
      connectionPoolSize: 15,
      performanceTracking: true,
      queryLogging: false,
      lowLatencyOptimized: true,
    },
    contextConfig: {
      maxConnections: 15,
      enableLogging: false,
      transactionTimeout: 3000,
    },
  },
];

/**
 * Combined export of all journey context test scenarios
 */
export const journeyContextScenarios = {
  health: healthJourneyScenarios,
  care: careJourneyScenarios,
  plan: planJourneyScenarios,
  crossJourney: crossJourneyScenarios,
  connectionConfig: connectionConfigScenarios,
  
  /**
   * Gets all scenarios for a specific journey
   * 
   * @param journeyId The journey ID to get scenarios for
   * @returns An array of scenarios for the specified journey
   */
  getForJourney(journeyId: JourneyId): JourneyContextScenario[] {
    switch (journeyId) {
      case 'health':
        return this.health;
      case 'care':
        return this.care;
      case 'plan':
        return this.plan;
      default:
        return [];
    }
  },
  
  /**
   * Gets a specific scenario by ID
   * 
   * @param scenarioId The scenario ID to get
   * @returns The scenario with the specified ID, or undefined if not found
   */
  getById(scenarioId: string): JourneyContextScenario | undefined {
    const allScenarios = [
      ...this.health,
      ...this.care,
      ...this.plan,
      ...this.crossJourney,
      ...this.connectionConfig,
    ];
    
    return allScenarios.find(scenario => scenario.id === scenarioId);
  },
  
  /**
   * Gets all scenarios that test a specific feature
   * 
   * @param feature The feature to get scenarios for (e.g., 'transaction', 'isolation')
   * @returns An array of scenarios that test the specified feature
   */
  getByFeature(feature: string): JourneyContextScenario[] {
    const allScenarios = [
      ...this.health,
      ...this.care,
      ...this.plan,
      ...this.crossJourney,
      ...this.connectionConfig,
    ];
    
    return allScenarios.filter(scenario => scenario.id.includes(feature));
  },
};