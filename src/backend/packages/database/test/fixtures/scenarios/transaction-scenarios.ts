/**
 * @file transaction-scenarios.ts
 * @description Contains specialized test fixtures for transaction management testing, with a focus on
 * transaction commits, rollbacks, and nested transactions across journey services. These fixtures
 * simulate various transaction scenarios including successful completions, partial rollbacks due to
 * errors, and complex nested transactions spanning multiple journey contexts.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { TransactionIsolationLevel } from '../../../src/transactions/transaction.interface';
import { HealthContext } from '../../../src/contexts/health.context';
import { CareContext } from '../../../src/contexts/care.context';
import { PlanContext } from '../../../src/contexts/plan.context';
import { PrismaService } from '../../../src/prisma.service';

/**
 * Interface for a transaction test scenario.
 */
export interface TransactionScenario {
  /**
   * Unique identifier for the scenario.
   */
  id: string;

  /**
   * Human-readable name of the scenario.
   */
  name: string;

  /**
   * Detailed description of the scenario and what it tests.
   */
  description: string;

  /**
   * The journey contexts involved in this scenario.
   */
  journeys: Array<'health' | 'care' | 'plan'>;

  /**
   * Whether this scenario is expected to succeed or fail.
   */
  expectedOutcome: 'success' | 'failure';

  /**
   * The isolation level to use for the transaction.
   */
  isolationLevel: TransactionIsolationLevel;

  /**
   * Setup function to prepare the database for the scenario.
   * @param prisma PrismaClient instance
   */
  setup: (prisma: PrismaClient) => Promise<void>;

  /**
   * The transaction function to execute for the scenario.
   * @param contexts Map of journey contexts
   */
  execute: (contexts: {
    health?: HealthContext;
    care?: CareContext;
    plan?: PlanContext;
  }) => Promise<any>;

  /**
   * Verification function to check if the scenario executed correctly.
   * @param prisma PrismaClient instance
   * @param result Result of the execute function
   */
  verify: (prisma: PrismaClient, result: any) => Promise<boolean>;

  /**
   * Cleanup function to reset the database after the scenario.
   * @param prisma PrismaClient instance
   */
  cleanup: (prisma: PrismaClient) => Promise<void>;
}

/**
 * Creates test data for a user with a specific ID.
 * @param prisma PrismaClient instance
 * @param userId User ID to create
 */
async function createTestUser(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: `Test User ${userId.substring(0, 4)}`,
      email: `test-${userId.substring(0, 4)}@austa.com.br`,
      password: 'Password123!',
      phone: '+5511999999999',
      cpf: '12345678901',
    },
  });
}

/**
 * Creates test data for health metrics for a specific user.
 * @param prisma PrismaClient instance
 * @param userId User ID to create metrics for
 */
async function createHealthMetrics(prisma: PrismaClient, userId: string): Promise<void> {
  // Ensure health metric types exist
  const metricTypes = [
    { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
    { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
    { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
  ];

  for (const metricType of metricTypes) {
    await prisma.healthMetricType.upsert({
      where: { name: metricType.name },
      update: {},
      create: metricType,
    });
  }

  // Create a health metric for the user
  const heartRateType = await prisma.healthMetricType.findUnique({
    where: { name: 'HEART_RATE' },
  });

  if (heartRateType) {
    await prisma.healthMetric.create({
      data: {
        userId,
        typeId: heartRateType.id,
        value: '75',
        recordedAt: new Date(),
        source: 'TEST',
      },
    });
  }
}

/**
 * Creates test data for a medical appointment for a specific user.
 * @param prisma PrismaClient instance
 * @param userId User ID to create appointment for
 */
async function createAppointment(prisma: PrismaClient, userId: string): Promise<void> {
  // Ensure provider specialty exists
  await prisma.providerSpecialty.upsert({
    where: { name: 'Cardiologia' },
    update: {},
    create: {
      name: 'Cardiologia',
      description: 'Especialista em coração e sistema cardiovascular',
    },
  });

  const specialty = await prisma.providerSpecialty.findUnique({
    where: { name: 'Cardiologia' },
  });

  if (specialty) {
    // Create a provider
    const provider = await prisma.provider.create({
      data: {
        name: 'Dr. Cardio Test',
        crm: '12345SP',
        specialtyId: specialty.id,
        email: 'cardio@test.com',
        phone: '+5511888888888',
      },
    });

    // Create an appointment
    await prisma.appointment.create({
      data: {
        userId,
        providerId: provider.id,
        scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
        status: 'SCHEDULED',
        type: 'IN_PERSON',
        notes: 'Test appointment',
      },
    });
  }
}

/**
 * Creates test data for an insurance plan for a specific user.
 * @param prisma PrismaClient instance
 * @param userId User ID to create plan for
 */
async function createInsurancePlan(prisma: PrismaClient, userId: string): Promise<void> {
  // Ensure plan type exists
  await prisma.insurancePlanType.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      description: 'Plano com cobertura intermediária',
    },
  });

  const planType = await prisma.insurancePlanType.findUnique({
    where: { name: 'Standard' },
  });

  if (planType) {
    // Create an insurance plan
    await prisma.insurancePlan.create({
      data: {
        userId,
        typeId: planType.id,
        planNumber: `PLAN-${userId.substring(0, 4)}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 31536000000), // 1 year from now
        status: 'ACTIVE',
      },
    });
  }
}

/**
 * Collection of transaction test scenarios for single-journey transactions.
 */
export const singleJourneyTransactionScenarios: TransactionScenario[] = [
  {
    id: 'health-transaction-success',
    name: 'Health Journey - Successful Transaction',
    description: 'Tests a successful transaction within the Health journey that creates health metrics for a user',
    journeys: ['health'],
    expectedOutcome: 'success',
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);
    },
    execute: async (contexts) => {
      const healthContext = contexts.health;
      if (!healthContext) throw new Error('Health context not provided');

      // Get a test user
      const user = await healthContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      // Execute a transaction to create multiple health metrics
      return await healthContext.transaction(async (tx) => {
        // Get heart rate metric type
        const heartRateType = await tx.healthMetricType.findUnique({
          where: { name: 'HEART_RATE' },
        });

        if (!heartRateType) {
          // Create the metric type if it doesn't exist
          await tx.healthMetricType.create({
            data: {
              name: 'HEART_RATE',
              unit: 'bpm',
              normalRangeMin: 60,
              normalRangeMax: 100,
            },
          });
        }

        // Create multiple health metrics in a single transaction
        const metrics = [];
        for (let i = 0; i < 3; i++) {
          const metric = await tx.healthMetric.create({
            data: {
              userId: user.id,
              typeId: heartRateType?.id || '',
              value: `${70 + i}`,
              recordedAt: new Date(Date.now() - i * 3600000), // Hours ago
              source: 'TEST',
            },
          });
          metrics.push(metric);
        }

        return { userId: user.id, metrics };
      }, {
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
        operationType: 'health-metrics-creation',
      });
    },
    verify: async (prisma, result) => {
      // Verify that all metrics were created
      const metrics = await prisma.healthMetric.findMany({
        where: { userId: result.userId },
      });
      return metrics.length >= 3;
    },
    cleanup: async (prisma) => {
      // Clean up created metrics and user
      const user = await prisma.user.findFirst();
      if (user) {
        await prisma.healthMetric.deleteMany({
          where: { userId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
  {
    id: 'care-transaction-rollback',
    name: 'Care Journey - Transaction Rollback',
    description: 'Tests a transaction rollback within the Care journey when an error occurs during appointment creation',
    journeys: ['care'],
    expectedOutcome: 'failure',
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);

      // Create a provider specialty
      await prisma.providerSpecialty.upsert({
        where: { name: 'Cardiologia' },
        update: {},
        create: {
          name: 'Cardiologia',
          description: 'Especialista em coração e sistema cardiovascular',
        },
      });
    },
    execute: async (contexts) => {
      const careContext = contexts.care;
      if (!careContext) throw new Error('Care context not provided');

      // Get a test user
      const user = await careContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      try {
        // Execute a transaction that will fail
        return await careContext.transaction(async (tx) => {
          // Get the specialty
          const specialty = await tx.providerSpecialty.findUnique({
            where: { name: 'Cardiologia' },
          });

          if (!specialty) throw new Error('Specialty not found');

          // Create a provider
          const provider = await tx.provider.create({
            data: {
              name: 'Dr. Cardio Test',
              crm: '12345SP',
              specialtyId: specialty.id,
              email: 'cardio@test.com',
              phone: '+5511888888888',
            },
          });

          // Create an appointment
          await tx.appointment.create({
            data: {
              userId: user.id,
              providerId: provider.id,
              scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
              status: 'SCHEDULED',
              type: 'IN_PERSON',
              notes: 'Test appointment',
            },
          });

          // Create a medication with invalid data to trigger a rollback
          await tx.medication.create({
            data: {
              // Missing required fields to trigger an error
              userId: user.id,
              // name is missing
              // dosage is missing
              // frequency is missing
            } as any,
          });

          return { userId: user.id, providerId: provider.id };
        }, {
          isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
          operationType: 'appointment-creation',
        });
      } catch (error) {
        // Expected to fail
        return { userId: user.id, error: error.message };
      }
    },
    verify: async (prisma, result) => {
      // Verify that no appointments were created due to rollback
      const appointments = await prisma.appointment.findMany({
        where: { userId: result.userId },
      });

      // Verify that no providers were created due to rollback
      const providers = await prisma.provider.findMany({
        where: result.providerId ? { id: result.providerId } : {},
      });

      // Transaction should have failed and rolled back
      return appointments.length === 0 && providers.length === 0 && !!result.error;
    },
    cleanup: async (prisma) => {
      // Clean up user
      const user = await prisma.user.findFirst();
      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
  {
    id: 'plan-transaction-savepoint',
    name: 'Plan Journey - Transaction with Savepoint',
    description: 'Tests a transaction with savepoints in the Plan journey, allowing partial rollbacks',
    journeys: ['plan'],
    expectedOutcome: 'success',
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);

      // Create plan type
      await prisma.insurancePlanType.upsert({
        where: { name: 'Standard' },
        update: {},
        create: {
          name: 'Standard',
          description: 'Plano com cobertura intermediária',
        },
      });

      // Create claim type
      await prisma.claimType.upsert({
        where: { name: 'Consulta Médica' },
        update: {},
        create: {
          name: 'Consulta Médica',
          description: 'Reembolso para consulta médica',
        },
      });
    },
    execute: async (contexts) => {
      const planContext = contexts.plan;
      if (!planContext) throw new Error('Plan context not provided');

      // Get a test user
      const user = await planContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      // Execute a transaction with savepoints
      return await planContext.transaction(async (tx) => {
        // Get plan type
        const planType = await tx.insurancePlanType.findUnique({
          where: { name: 'Standard' },
        });

        if (!planType) throw new Error('Plan type not found');

        // Create an insurance plan
        const plan = await tx.insurancePlan.create({
          data: {
            userId: user.id,
            typeId: planType.id,
            planNumber: `PLAN-${user.id.substring(0, 4)}`,
            startDate: new Date(),
            endDate: new Date(Date.now() + 31536000000), // 1 year from now
            status: 'ACTIVE',
          },
        });

        // Create a savepoint after plan creation
        const savepoint1 = await planContext.createSavepoint(tx, 'after_plan_creation');

        // Get claim type
        const claimType = await tx.claimType.findUnique({
          where: { name: 'Consulta Médica' },
        });

        if (!claimType) throw new Error('Claim type not found');

        // Create a claim
        const claim = await tx.claim.create({
          data: {
            userId: user.id,
            planId: plan.id,
            typeId: claimType.id,
            amount: 150.0,
            status: 'SUBMITTED',
            submittedAt: new Date(),
            description: 'Consulta com cardiologista',
          },
        });

        // Create a savepoint after claim creation
        const savepoint2 = await planContext.createSavepoint(tx, 'after_claim_creation');

        try {
          // Try to create a document with invalid data
          await tx.document.create({
            data: {
              // Missing required fields to trigger an error
              userId: user.id,
              claimId: claim.id,
              // type is missing
              // url is missing
            } as any,
          });
        } catch (error) {
          // Roll back to the savepoint after claim creation
          await planContext.rollbackToSavepoint(tx, savepoint2);

          // Create a valid document instead
          await tx.document.create({
            data: {
              userId: user.id,
              claimId: claim.id,
              type: 'RECEIPT',
              url: 'https://example.com/receipt.pdf',
              uploadedAt: new Date(),
            },
          });
        }

        return { userId: user.id, planId: plan.id, claimId: claim.id };
      }, {
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
        operationType: 'plan-claim-creation',
      });
    },
    verify: async (prisma, result) => {
      // Verify that the plan was created
      const plan = await prisma.insurancePlan.findUnique({
        where: { id: result.planId },
      });

      // Verify that the claim was created
      const claim = await prisma.claim.findUnique({
        where: { id: result.claimId },
      });

      // Verify that a valid document was created
      const document = await prisma.document.findFirst({
        where: { claimId: result.claimId },
      });

      return !!plan && !!claim && !!document && document.type === 'RECEIPT';
    },
    cleanup: async (prisma) => {
      // Clean up created entities
      const user = await prisma.user.findFirst();
      if (user) {
        // Delete documents, claims, plans, and user
        await prisma.document.deleteMany({
          where: { userId: user.id },
        });
        await prisma.claim.deleteMany({
          where: { userId: user.id },
        });
        await prisma.insurancePlan.deleteMany({
          where: { userId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
];

/**
 * Collection of transaction test scenarios for cross-journey transactions.
 */
export const crossJourneyTransactionScenarios: TransactionScenario[] = [
  {
    id: 'health-care-transaction',
    name: 'Health and Care Journeys - Cross-Journey Transaction',
    description: 'Tests a transaction that spans both Health and Care journeys, creating health metrics and appointments',
    journeys: ['health', 'care'],
    expectedOutcome: 'success',
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);

      // Create provider specialty
      await prisma.providerSpecialty.upsert({
        where: { name: 'Cardiologia' },
        update: {},
        create: {
          name: 'Cardiologia',
          description: 'Especialista em coração e sistema cardiovascular',
        },
      });

      // Create health metric type
      await prisma.healthMetricType.upsert({
        where: { name: 'HEART_RATE' },
        update: {},
        create: {
          name: 'HEART_RATE',
          unit: 'bpm',
          normalRangeMin: 60,
          normalRangeMax: 100,
        },
      });
    },
    execute: async (contexts) => {
      const healthContext = contexts.health;
      const careContext = contexts.care;
      if (!healthContext) throw new Error('Health context not provided');
      if (!careContext) throw new Error('Care context not provided');

      // Get a test user
      const user = await healthContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      // Use the distributed transaction coordinator to execute a cross-journey transaction
      const prismaService = new PrismaService();
      return await prismaService.executeDistributedTransaction(async (tx) => {
        // Health journey operations
        const heartRateType = await tx.healthMetricType.findUnique({
          where: { name: 'HEART_RATE' },
        });

        if (!heartRateType) throw new Error('Heart rate metric type not found');

        // Create an abnormal heart rate metric
        const healthMetric = await tx.healthMetric.create({
          data: {
            userId: user.id,
            typeId: heartRateType.id,
            value: '120', // Abnormal heart rate
            recordedAt: new Date(),
            source: 'TEST',
          },
        });

        // Care journey operations
        const specialty = await tx.providerSpecialty.findUnique({
          where: { name: 'Cardiologia' },
        });

        if (!specialty) throw new Error('Specialty not found');

        // Create a provider
        const provider = await tx.provider.create({
          data: {
            name: 'Dr. Cardio Emergency',
            crm: '54321SP',
            specialtyId: specialty.id,
            email: 'cardio.emergency@test.com',
            phone: '+5511777777777',
          },
        });

        // Create an urgent appointment due to abnormal heart rate
        const appointment = await tx.appointment.create({
          data: {
            userId: user.id,
            providerId: provider.id,
            scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
            status: 'SCHEDULED',
            type: 'IN_PERSON',
            priority: 'HIGH',
            notes: 'Urgent appointment due to abnormal heart rate',
          },
        });

        return {
          userId: user.id,
          metricId: healthMetric.id,
          appointmentId: appointment.id,
          providerId: provider.id,
        };
      }, {
        participants: ['health-service', 'care-service'],
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
        journeyContext: {
          journeyType: 'health',
          userId: user.id,
        },
      });
    },
    verify: async (prisma, result) => {
      // Verify that the health metric was created
      const metric = await prisma.healthMetric.findUnique({
        where: { id: result.metricId },
      });

      // Verify that the appointment was created
      const appointment = await prisma.appointment.findUnique({
        where: { id: result.appointmentId },
      });

      // Verify that the provider was created
      const provider = await prisma.provider.findUnique({
        where: { id: result.providerId },
      });

      return !!metric && !!appointment && !!provider && appointment.priority === 'HIGH';
    },
    cleanup: async (prisma) => {
      // Clean up created entities
      const user = await prisma.user.findFirst();
      if (user) {
        await prisma.healthMetric.deleteMany({
          where: { userId: user.id },
        });
        await prisma.appointment.deleteMany({
          where: { userId: user.id },
        });
        // Delete provider
        const appointment = await prisma.appointment.findFirst({
          where: { userId: user.id },
        });
        if (appointment) {
          await prisma.provider.delete({
            where: { id: appointment.providerId },
          });
        }
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
  {
    id: 'care-plan-transaction-rollback',
    name: 'Care and Plan Journeys - Cross-Journey Transaction with Rollback',
    description: 'Tests a transaction that spans Care and Plan journeys with a rollback when an error occurs',
    journeys: ['care', 'plan'],
    expectedOutcome: 'failure',
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);

      // Create provider specialty
      await prisma.providerSpecialty.upsert({
        where: { name: 'Cardiologia' },
        update: {},
        create: {
          name: 'Cardiologia',
          description: 'Especialista em coração e sistema cardiovascular',
        },
      });

      // Create plan type
      await prisma.insurancePlanType.upsert({
        where: { name: 'Standard' },
        update: {},
        create: {
          name: 'Standard',
          description: 'Plano com cobertura intermediária',
        },
      });

      // Create claim type
      await prisma.claimType.upsert({
        where: { name: 'Consulta Médica' },
        update: {},
        create: {
          name: 'Consulta Médica',
          description: 'Reembolso para consulta médica',
        },
      });
    },
    execute: async (contexts) => {
      const careContext = contexts.care;
      const planContext = contexts.plan;
      if (!careContext) throw new Error('Care context not provided');
      if (!planContext) throw new Error('Plan context not provided');

      // Get a test user
      const user = await careContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      try {
        // Use the distributed transaction coordinator to execute a cross-journey transaction
        const prismaService = new PrismaService();
        return await prismaService.executeDistributedTransaction(async (tx) => {
          // Care journey operations
          const specialty = await tx.providerSpecialty.findUnique({
            where: { name: 'Cardiologia' },
          });

          if (!specialty) throw new Error('Specialty not found');

          // Create a provider
          const provider = await tx.provider.create({
            data: {
              name: 'Dr. Cardio Test',
              crm: '12345SP',
              specialtyId: specialty.id,
              email: 'cardio@test.com',
              phone: '+5511888888888',
            },
          });

          // Create an appointment
          const appointment = await tx.appointment.create({
            data: {
              userId: user.id,
              providerId: provider.id,
              scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
              status: 'SCHEDULED',
              type: 'IN_PERSON',
              notes: 'Test appointment',
            },
          });

          // Plan journey operations
          const planType = await tx.insurancePlanType.findUnique({
            where: { name: 'Standard' },
          });

          if (!planType) throw new Error('Plan type not found');

          // Create an insurance plan
          const plan = await tx.insurancePlan.create({
            data: {
              userId: user.id,
              typeId: planType.id,
              planNumber: `PLAN-${user.id.substring(0, 4)}`,
              startDate: new Date(),
              endDate: new Date(Date.now() + 31536000000), // 1 year from now
              status: 'ACTIVE',
            },
          });

          // Get claim type
          const claimType = await tx.claimType.findUnique({
            where: { name: 'Consulta Médica' },
          });

          if (!claimType) throw new Error('Claim type not found');

          // Create a claim with invalid data to trigger a rollback
          await tx.claim.create({
            data: {
              userId: user.id,
              planId: plan.id,
              typeId: claimType.id,
              // amount is missing (required field)
              status: 'INVALID_STATUS', // Invalid enum value
              submittedAt: new Date(),
              description: 'Consulta com cardiologista',
            } as any,
          });

          return {
            userId: user.id,
            appointmentId: appointment.id,
            providerId: provider.id,
            planId: plan.id,
          };
        }, {
          participants: ['care-service', 'plan-service'],
          isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
          journeyContext: {
            journeyType: 'care',
            userId: user.id,
          },
        });
      } catch (error) {
        // Expected to fail
        return { userId: user.id, error: error.message };
      }
    },
    verify: async (prisma, result) => {
      // Verify that no appointments were created due to rollback
      const appointments = await prisma.appointment.findMany({
        where: { userId: result.userId },
      });

      // Verify that no providers were created due to rollback
      const providers = await prisma.provider.findMany();

      // Verify that no plans were created due to rollback
      const plans = await prisma.insurancePlan.findMany({
        where: { userId: result.userId },
      });

      // Transaction should have failed and rolled back
      return appointments.length === 0 && providers.length === 0 && plans.length === 0 && !!result.error;
    },
    cleanup: async (prisma) => {
      // Clean up user
      const user = await prisma.user.findFirst();
      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
  {
    id: 'all-journeys-transaction',
    name: 'All Journeys - Complex Cross-Journey Transaction',
    description: 'Tests a complex transaction that spans all three journeys (Health, Care, Plan) with nested operations',
    journeys: ['health', 'care', 'plan'],
    expectedOutcome: 'success',
    isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);

      // Create health metric type
      await prisma.healthMetricType.upsert({
        where: { name: 'HEART_RATE' },
        update: {},
        create: {
          name: 'HEART_RATE',
          unit: 'bpm',
          normalRangeMin: 60,
          normalRangeMax: 100,
        },
      });

      // Create provider specialty
      await prisma.providerSpecialty.upsert({
        where: { name: 'Cardiologia' },
        update: {},
        create: {
          name: 'Cardiologia',
          description: 'Especialista em coração e sistema cardiovascular',
        },
      });

      // Create plan type
      await prisma.insurancePlanType.upsert({
        where: { name: 'Standard' },
        update: {},
        create: {
          name: 'Standard',
          description: 'Plano com cobertura intermediária',
        },
      });

      // Create claim type
      await prisma.claimType.upsert({
        where: { name: 'Consulta Médica' },
        update: {},
        create: {
          name: 'Consulta Médica',
          description: 'Reembolso para consulta médica',
        },
      });
    },
    execute: async (contexts) => {
      const healthContext = contexts.health;
      const careContext = contexts.care;
      const planContext = contexts.plan;
      if (!healthContext) throw new Error('Health context not provided');
      if (!careContext) throw new Error('Care context not provided');
      if (!planContext) throw new Error('Plan context not provided');

      // Get a test user
      const user = await healthContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      // Use the distributed transaction coordinator to execute a cross-journey transaction
      const prismaService = new PrismaService();
      return await prismaService.executeDistributedTransaction(async (tx) => {
        // Health journey operations
        const heartRateType = await tx.healthMetricType.findUnique({
          where: { name: 'HEART_RATE' },
        });

        if (!heartRateType) throw new Error('Heart rate metric type not found');

        // Create an abnormal heart rate metric
        const healthMetric = await tx.healthMetric.create({
          data: {
            userId: user.id,
            typeId: heartRateType.id,
            value: '130', // Abnormal heart rate
            recordedAt: new Date(),
            source: 'TEST',
          },
        });

        // Create a health goal based on the metric
        const healthGoal = await tx.healthGoal.create({
          data: {
            userId: user.id,
            metricTypeId: heartRateType.id,
            targetValue: '80',
            startDate: new Date(),
            endDate: new Date(Date.now() + 2592000000), // 30 days from now
            status: 'ACTIVE',
            description: 'Reduce heart rate to normal levels',
          },
        });

        // Care journey operations
        const specialty = await tx.providerSpecialty.findUnique({
          where: { name: 'Cardiologia' },
        });

        if (!specialty) throw new Error('Specialty not found');

        // Create a provider
        const provider = await tx.provider.create({
          data: {
            name: 'Dr. Cardio Specialist',
            crm: '98765SP',
            specialtyId: specialty.id,
            email: 'cardio.specialist@test.com',
            phone: '+5511666666666',
          },
        });

        // Create an urgent appointment due to abnormal heart rate
        const appointment = await tx.appointment.create({
          data: {
            userId: user.id,
            providerId: provider.id,
            scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
            status: 'SCHEDULED',
            type: 'IN_PERSON',
            priority: 'HIGH',
            notes: 'Urgent appointment due to abnormal heart rate',
          },
        });

        // Create a treatment plan
        const treatment = await tx.treatment.create({
          data: {
            userId: user.id,
            providerId: provider.id,
            name: 'Heart Rate Management',
            description: 'Treatment plan to manage elevated heart rate',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7776000000), // 90 days from now
            status: 'ACTIVE',
          },
        });

        // Plan journey operations
        const planType = await tx.insurancePlanType.findUnique({
          where: { name: 'Standard' },
        });

        if (!planType) throw new Error('Plan type not found');

        // Create an insurance plan
        const plan = await tx.insurancePlan.create({
          data: {
            userId: user.id,
            typeId: planType.id,
            planNumber: `PLAN-${user.id.substring(0, 4)}`,
            startDate: new Date(),
            endDate: new Date(Date.now() + 31536000000), // 1 year from now
            status: 'ACTIVE',
          },
        });

        // Get claim type
        const claimType = await tx.claimType.findUnique({
          where: { name: 'Consulta Médica' },
        });

        if (!claimType) throw new Error('Claim type not found');

        // Create a claim for the appointment
        const claim = await tx.claim.create({
          data: {
            userId: user.id,
            planId: plan.id,
            typeId: claimType.id,
            amount: 200.0,
            status: 'SUBMITTED',
            submittedAt: new Date(),
            description: 'Consulta de emergência com cardiologista',
          },
        });

        // Create a document for the claim
        const document = await tx.document.create({
          data: {
            userId: user.id,
            claimId: claim.id,
            type: 'RECEIPT',
            url: 'https://example.com/emergency-receipt.pdf',
            uploadedAt: new Date(),
          },
        });

        return {
          userId: user.id,
          metricId: healthMetric.id,
          goalId: healthGoal.id,
          appointmentId: appointment.id,
          treatmentId: treatment.id,
          providerId: provider.id,
          planId: plan.id,
          claimId: claim.id,
          documentId: document.id,
        };
      }, {
        participants: ['health-service', 'care-service', 'plan-service'],
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        journeyContext: {
          journeyType: 'health',
          userId: user.id,
        },
      });
    },
    verify: async (prisma, result) => {
      // Verify that all entities were created
      const metric = await prisma.healthMetric.findUnique({
        where: { id: result.metricId },
      });

      const goal = await prisma.healthGoal.findUnique({
        where: { id: result.goalId },
      });

      const appointment = await prisma.appointment.findUnique({
        where: { id: result.appointmentId },
      });

      const treatment = await prisma.treatment.findUnique({
        where: { id: result.treatmentId },
      });

      const provider = await prisma.provider.findUnique({
        where: { id: result.providerId },
      });

      const plan = await prisma.insurancePlan.findUnique({
        where: { id: result.planId },
      });

      const claim = await prisma.claim.findUnique({
        where: { id: result.claimId },
      });

      const document = await prisma.document.findUnique({
        where: { id: result.documentId },
      });

      return (
        !!metric &&
        !!goal &&
        !!appointment &&
        !!treatment &&
        !!provider &&
        !!plan &&
        !!claim &&
        !!document
      );
    },
    cleanup: async (prisma) => {
      // Clean up created entities
      const user = await prisma.user.findFirst();
      if (user) {
        // Delete in reverse order of creation to avoid foreign key constraints
        await prisma.document.deleteMany({
          where: { userId: user.id },
        });
        await prisma.claim.deleteMany({
          where: { userId: user.id },
        });
        await prisma.insurancePlan.deleteMany({
          where: { userId: user.id },
        });
        await prisma.treatment.deleteMany({
          where: { userId: user.id },
        });
        await prisma.appointment.deleteMany({
          where: { userId: user.id },
        });
        await prisma.provider.deleteMany();
        await prisma.healthGoal.deleteMany({
          where: { userId: user.id },
        });
        await prisma.healthMetric.deleteMany({
          where: { userId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
];

/**
 * Collection of transaction test scenarios for nested transactions.
 */
export const nestedTransactionScenarios: TransactionScenario[] = [
  {
    id: 'nested-transaction-success',
    name: 'Nested Transactions - Successful Completion',
    description: 'Tests nested transactions where both inner and outer transactions complete successfully',
    journeys: ['health'],
    expectedOutcome: 'success',
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);

      // Create health metric type
      await prisma.healthMetricType.upsert({
        where: { name: 'HEART_RATE' },
        update: {},
        create: {
          name: 'HEART_RATE',
          unit: 'bpm',
          normalRangeMin: 60,
          normalRangeMax: 100,
        },
      });

      await prisma.healthMetricType.upsert({
        where: { name: 'WEIGHT' },
        update: {},
        create: {
          name: 'WEIGHT',
          unit: 'kg',
          normalRangeMin: null,
          normalRangeMax: null,
        },
      });
    },
    execute: async (contexts) => {
      const healthContext = contexts.health;
      if (!healthContext) throw new Error('Health context not provided');

      // Get a test user
      const user = await healthContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      // Execute an outer transaction
      return await healthContext.transaction(async (outerTx) => {
        // Create a device type in the outer transaction
        const deviceType = await outerTx.deviceType.create({
          data: {
            name: 'Smartwatch',
            description: 'Wearable smartwatch device',
            manufacturer: 'Test Manufacturer',
          },
        });

        // Create a device connection in the outer transaction
        const deviceConnection = await outerTx.deviceConnection.create({
          data: {
            userId: user.id,
            deviceTypeId: deviceType.id,
            status: 'ACTIVE',
            lastSyncAt: new Date(),
            deviceIdentifier: 'TEST-DEVICE-001',
          },
        });

        // Execute an inner transaction for health metrics
        const metricsResult = await healthContext.transaction(async (innerTx) => {
          // Get metric types
          const heartRateType = await innerTx.healthMetricType.findUnique({
            where: { name: 'HEART_RATE' },
          });

          const weightType = await innerTx.healthMetricType.findUnique({
            where: { name: 'WEIGHT' },
          });

          if (!heartRateType || !weightType) {
            throw new Error('Metric types not found');
          }

          // Create heart rate metric
          const heartRateMetric = await innerTx.healthMetric.create({
            data: {
              userId: user.id,
              typeId: heartRateType.id,
              value: '75',
              recordedAt: new Date(),
              source: 'TEST-DEVICE',
              deviceConnectionId: deviceConnection.id,
            },
          });

          // Create weight metric
          const weightMetric = await innerTx.healthMetric.create({
            data: {
              userId: user.id,
              typeId: weightType.id,
              value: '70.5',
              recordedAt: new Date(),
              source: 'TEST-DEVICE',
              deviceConnectionId: deviceConnection.id,
            },
          });

          return {
            heartRateMetricId: heartRateMetric.id,
            weightMetricId: weightMetric.id,
          };
        }, {
          isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
          operationType: 'health-metrics-creation',
        });

        // Create a health goal in the outer transaction based on the metrics
        const heartRateType = await outerTx.healthMetricType.findUnique({
          where: { name: 'HEART_RATE' },
        });

        if (!heartRateType) throw new Error('Heart rate metric type not found');

        const healthGoal = await outerTx.healthGoal.create({
          data: {
            userId: user.id,
            metricTypeId: heartRateType.id,
            targetValue: '70',
            startDate: new Date(),
            endDate: new Date(Date.now() + 2592000000), // 30 days from now
            status: 'ACTIVE',
            description: 'Maintain healthy heart rate',
          },
        });

        return {
          userId: user.id,
          deviceTypeId: deviceType.id,
          deviceConnectionId: deviceConnection.id,
          heartRateMetricId: metricsResult.heartRateMetricId,
          weightMetricId: metricsResult.weightMetricId,
          goalId: healthGoal.id,
        };
      }, {
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
        operationType: 'health-device-setup',
      });
    },
    verify: async (prisma, result) => {
      // Verify that all entities were created
      const deviceType = await prisma.deviceType.findUnique({
        where: { id: result.deviceTypeId },
      });

      const deviceConnection = await prisma.deviceConnection.findUnique({
        where: { id: result.deviceConnectionId },
      });

      const heartRateMetric = await prisma.healthMetric.findUnique({
        where: { id: result.heartRateMetricId },
      });

      const weightMetric = await prisma.healthMetric.findUnique({
        where: { id: result.weightMetricId },
      });

      const goal = await prisma.healthGoal.findUnique({
        where: { id: result.goalId },
      });

      return (
        !!deviceType &&
        !!deviceConnection &&
        !!heartRateMetric &&
        !!weightMetric &&
        !!goal
      );
    },
    cleanup: async (prisma) => {
      // Clean up created entities
      const user = await prisma.user.findFirst();
      if (user) {
        // Delete in reverse order of creation to avoid foreign key constraints
        await prisma.healthGoal.deleteMany({
          where: { userId: user.id },
        });
        await prisma.healthMetric.deleteMany({
          where: { userId: user.id },
        });
        await prisma.deviceConnection.deleteMany({
          where: { userId: user.id },
        });
        await prisma.deviceType.deleteMany();
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
  {
    id: 'nested-transaction-inner-failure',
    name: 'Nested Transactions - Inner Transaction Failure',
    description: 'Tests nested transactions where the inner transaction fails but the outer transaction continues',
    journeys: ['care'],
    expectedOutcome: 'success',
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);

      // Create provider specialty
      await prisma.providerSpecialty.upsert({
        where: { name: 'Cardiologia' },
        update: {},
        create: {
          name: 'Cardiologia',
          description: 'Especialista em coração e sistema cardiovascular',
        },
      });
    },
    execute: async (contexts) => {
      const careContext = contexts.care;
      if (!careContext) throw new Error('Care context not provided');

      // Get a test user
      const user = await careContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      // Execute an outer transaction
      return await careContext.transaction(async (outerTx) => {
        // Get the specialty
        const specialty = await outerTx.providerSpecialty.findUnique({
          where: { name: 'Cardiologia' },
        });

        if (!specialty) throw new Error('Specialty not found');

        // Create a provider in the outer transaction
        const provider = await outerTx.provider.create({
          data: {
            name: 'Dr. Cardio Test',
            crm: '12345SP',
            specialtyId: specialty.id,
            email: 'cardio@test.com',
            phone: '+5511888888888',
          },
        });

        // Create an appointment in the outer transaction
        const appointment = await outerTx.appointment.create({
          data: {
            userId: user.id,
            providerId: provider.id,
            scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
            status: 'SCHEDULED',
            type: 'IN_PERSON',
            notes: 'Test appointment',
          },
        });

        // Try to execute an inner transaction that will fail
        let medicationError = null;
        try {
          await careContext.transaction(async (innerTx) => {
            // Create a medication with invalid data to trigger a failure
            await innerTx.medication.create({
              data: {
                // Missing required fields to trigger an error
                userId: user.id,
                // name is missing
                // dosage is missing
                // frequency is missing
              } as any,
            });
          }, {
            isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
            operationType: 'medication-creation',
          });
        } catch (error) {
          // Expected to fail
          medicationError = error.message;
        }

        // Continue with the outer transaction despite inner transaction failure
        // Create a treatment plan in the outer transaction
        const treatment = await outerTx.treatment.create({
          data: {
            userId: user.id,
            providerId: provider.id,
            name: 'Test Treatment',
            description: 'Test treatment plan',
            startDate: new Date(),
            endDate: new Date(Date.now() + 2592000000), // 30 days from now
            status: 'ACTIVE',
          },
        });

        return {
          userId: user.id,
          providerId: provider.id,
          appointmentId: appointment.id,
          treatmentId: treatment.id,
          medicationError,
        };
      }, {
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
        operationType: 'care-appointment-setup',
      });
    },
    verify: async (prisma, result) => {
      // Verify that outer transaction entities were created
      const provider = await prisma.provider.findUnique({
        where: { id: result.providerId },
      });

      const appointment = await prisma.appointment.findUnique({
        where: { id: result.appointmentId },
      });

      const treatment = await prisma.treatment.findUnique({
        where: { id: result.treatmentId },
      });

      // Verify that no medications were created due to inner transaction failure
      const medications = await prisma.medication.findMany({
        where: { userId: result.userId },
      });

      return (
        !!provider &&
        !!appointment &&
        !!treatment &&
        medications.length === 0 &&
        !!result.medicationError
      );
    },
    cleanup: async (prisma) => {
      // Clean up created entities
      const user = await prisma.user.findFirst();
      if (user) {
        // Delete in reverse order of creation to avoid foreign key constraints
        await prisma.treatment.deleteMany({
          where: { userId: user.id },
        });
        await prisma.appointment.deleteMany({
          where: { userId: user.id },
        });
        // Delete provider
        const appointment = await prisma.appointment.findFirst({
          where: { userId: user.id },
        });
        if (appointment) {
          await prisma.provider.delete({
            where: { id: appointment.providerId },
          });
        }
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
  {
    id: 'nested-transaction-savepoint',
    name: 'Nested Transactions - With Savepoints',
    description: 'Tests nested transactions with savepoints for partial rollbacks',
    journeys: ['plan'],
    expectedOutcome: 'success',
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    setup: async (prisma) => {
      const userId = uuidv4();
      await createTestUser(prisma, userId);

      // Create plan type
      await prisma.insurancePlanType.upsert({
        where: { name: 'Standard' },
        update: {},
        create: {
          name: 'Standard',
          description: 'Plano com cobertura intermediária',
        },
      });

      // Create claim type
      await prisma.claimType.upsert({
        where: { name: 'Consulta Médica' },
        update: {},
        create: {
          name: 'Consulta Médica',
          description: 'Reembolso para consulta médica',
        },
      });
    },
    execute: async (contexts) => {
      const planContext = contexts.plan;
      if (!planContext) throw new Error('Plan context not provided');

      // Get a test user
      const user = await planContext.getClient().user.findFirst();
      if (!user) throw new Error('Test user not found');

      // Execute an outer transaction
      return await planContext.transaction(async (outerTx) => {
        // Get plan type
        const planType = await outerTx.insurancePlanType.findUnique({
          where: { name: 'Standard' },
        });

        if (!planType) throw new Error('Plan type not found');

        // Create an insurance plan in the outer transaction
        const plan = await outerTx.insurancePlan.create({
          data: {
            userId: user.id,
            typeId: planType.id,
            planNumber: `PLAN-${user.id.substring(0, 4)}`,
            startDate: new Date(),
            endDate: new Date(Date.now() + 31536000000), // 1 year from now
            status: 'ACTIVE',
          },
        });

        // Create a savepoint after plan creation
        const savepoint1 = await planContext.createSavepoint(outerTx, 'after_plan_creation');

        // Execute an inner transaction for claims
        const claimsResult = await planContext.transaction(async (innerTx) => {
          // Get claim type
          const claimType = await innerTx.claimType.findUnique({
            where: { name: 'Consulta Médica' },
          });

          if (!claimType) throw new Error('Claim type not found');

          // Create multiple claims
          const claims = [];
          for (let i = 0; i < 3; i++) {
            const claim = await innerTx.claim.create({
              data: {
                userId: user.id,
                planId: plan.id,
                typeId: claimType.id,
                amount: 100.0 + i * 50.0,
                status: 'SUBMITTED',
                submittedAt: new Date(Date.now() - i * 86400000), // Days ago
                description: `Consulta médica ${i + 1}`,
              },
            });
            claims.push(claim);
          }

          return { claims };
        }, {
          isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
          operationType: 'claims-creation',
        });

        // Create a savepoint after claims creation
        const savepoint2 = await planContext.createSavepoint(outerTx, 'after_claims_creation');

        // Try to create an invalid document and roll back to savepoint
        try {
          // Create a document with invalid data
          await outerTx.document.create({
            data: {
              // Missing required fields to trigger an error
              userId: user.id,
              claimId: claimsResult.claims[0].id,
              // type is missing
              // url is missing
            } as any,
          });
        } catch (error) {
          // Roll back to the savepoint after claims creation
          await planContext.rollbackToSavepoint(outerTx, savepoint2);
        }

        // Create valid documents for each claim
        const documents = [];
        for (const claim of claimsResult.claims) {
          const document = await outerTx.document.create({
            data: {
              userId: user.id,
              claimId: claim.id,
              type: 'RECEIPT',
              url: `https://example.com/receipt-${claim.id}.pdf`,
              uploadedAt: new Date(),
            },
          });
          documents.push(document);
        }

        return {
          userId: user.id,
          planId: plan.id,
          claimIds: claimsResult.claims.map(claim => claim.id),
          documentIds: documents.map(doc => doc.id),
        };
      }, {
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
        operationType: 'plan-claims-documents-creation',
      });
    },
    verify: async (prisma, result) => {
      // Verify that the plan was created
      const plan = await prisma.insurancePlan.findUnique({
        where: { id: result.planId },
      });

      // Verify that all claims were created
      const claims = await prisma.claim.findMany({
        where: {
          id: {
            in: result.claimIds,
          },
        },
      });

      // Verify that all documents were created
      const documents = await prisma.document.findMany({
        where: {
          id: {
            in: result.documentIds,
          },
        },
      });

      return (
        !!plan &&
        claims.length === result.claimIds.length &&
        documents.length === result.documentIds.length
      );
    },
    cleanup: async (prisma) => {
      // Clean up created entities
      const user = await prisma.user.findFirst();
      if (user) {
        // Delete in reverse order of creation to avoid foreign key constraints
        await prisma.document.deleteMany({
          where: { userId: user.id },
        });
        await prisma.claim.deleteMany({
          where: { userId: user.id },
        });
        await prisma.insurancePlan.deleteMany({
          where: { userId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    },
  },
];

/**
 * All transaction test scenarios combined.
 */
export const allTransactionScenarios: TransactionScenario[] = [
  ...singleJourneyTransactionScenarios,
  ...crossJourneyTransactionScenarios,
  ...nestedTransactionScenarios,
];