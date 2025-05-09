/**
 * Database E2E Test Helpers
 * 
 * This file provides helper utilities for database end-to-end tests, including:
 * - Test database connection utilities
 * - Data generation for test scenarios across all journeys
 * - Assertion utilities for database operations
 * - Cleanup mechanisms for test isolation
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { BaseJourneyContext } from '../../src/contexts/base-journey.context';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import * as bcrypt from 'bcrypt';

// Import fixtures for test data generation
import { userFixtures } from '../fixtures/common/users.fixtures';
import { roleFixtures } from '../fixtures/common/roles.fixtures';
import { permissionFixtures } from '../fixtures/common/permissions.fixtures';

/**
 * Test database configuration
 */
export interface TestDatabaseConfig {
  url?: string;
  schema?: string;
  debug?: boolean;
  cleanupAfterTest?: boolean;
}

/**
 * Default test database configuration
 */
export const DEFAULT_TEST_DB_CONFIG: TestDatabaseConfig = {
  url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_test',
  schema: process.env.TEST_DATABASE_SCHEMA || 'public',
  debug: process.env.TEST_DATABASE_DEBUG === 'true',
  cleanupAfterTest: true,
};

/**
 * Creates a test database client with the specified configuration
 * 
 * @param config - Test database configuration
 * @returns A configured PrismaClient instance for testing
 */
export function createTestDatabaseClient(config: TestDatabaseConfig = DEFAULT_TEST_DB_CONFIG): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.url,
      },
    },
    log: config.debug ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Creates a test PrismaService instance with the specified configuration
 * 
 * @param config - Test database configuration
 * @returns A configured PrismaService instance for testing
 */
export function createTestPrismaService(config: TestDatabaseConfig = DEFAULT_TEST_DB_CONFIG): PrismaService {
  const prismaService = new PrismaService({
    datasources: {
      db: {
        url: config.url,
      },
    },
    log: config.debug ? ['query', 'error', 'warn'] : ['error'],
  });
  
  // Initialize the service
  prismaService.onModuleInit();
  
  return prismaService;
}

/**
 * Creates journey-specific database contexts for testing
 * 
 * @param prismaService - The PrismaService instance to use
 * @returns An object containing all journey contexts
 */
export function createTestJourneyContexts(prismaService: PrismaService) {
  return {
    health: new HealthContext(prismaService),
    care: new CareContext(prismaService),
    plan: new PlanContext(prismaService),
  };
}

/**
 * Cleans up the test database by truncating all tables
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 */
export async function cleanupTestDatabase(prisma: PrismaClient | PrismaService): Promise<void> {
  try {
    // Execute raw SQL to truncate all tables while respecting foreign key constraints
    await prisma.$executeRaw`TRUNCATE TABLE "User", "Role", "Permission", "RolesOnUsers", "PermissionsOnRoles", 
      "HealthMetricType", "HealthMetric", "HealthGoal", "DeviceType", "DeviceConnection", "MedicalEvent",
      "ProviderSpecialty", "Provider", "Appointment", "Medication", "MedicationSchedule", "Treatment", "TelemedicineSession",
      "InsurancePlanType", "InsurancePlan", "Benefit", "Coverage", "ClaimType", "Claim", "Document",
      "AchievementType", "Achievement", "GamificationProfile", "Quest", "Reward", "Rule", "Event", "Leaderboard"
      CASCADE;`;
      
    console.log('Test database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning test database:', error);
    throw new DatabaseException(
      'Failed to clean test database',
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Test data generation utilities
 */

/**
 * Options for generating test users
 */
export interface TestUserOptions {
  count?: number;
  withRoles?: boolean;
  password?: string;
  roleNames?: string[];
}

/**
 * Creates test users in the database
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param options - Options for user generation
 * @returns The created test users
 */
export async function createTestUsers(prisma: PrismaClient | PrismaService, options: TestUserOptions = {}) {
  const {
    count = 1,
    withRoles = true,
    password = 'Password123!',
    roleNames = ['User'],
  } = options;
  
  const users = [];
  const hashedPassword = await bcrypt.hash(password, 10);
  
  for (let i = 0; i < count; i++) {
    // Create a unique email for each test user
    const email = `test-user-${Date.now()}-${i}@austa.com.br`;
    
    try {
      // Create the user
      const user = await prisma.user.create({
        data: {
          name: `Test User ${i + 1}`,
          email,
          password: hashedPassword,
          phone: `+551199999${1000 + i}`,
          cpf: `1234567890${i}`,
        },
      });
      
      // Assign roles if requested
      if (withRoles && roleNames.length > 0) {
        // Find the roles
        const roles = await prisma.role.findMany({
          where: {
            name: {
              in: roleNames,
            },
          },
        });
        
        // Connect roles to the user
        if (roles.length > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              roles: {
                connect: roles.map(role => ({ id: role.id })),
              },
            },
          });
        }
      }
      
      // Fetch the complete user with roles
      const completeUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            include: {
              permissions: true,
            },
          },
        },
      });
      
      users.push(completeUser);
    } catch (error) {
      console.error(`Error creating test user ${email}:`, error);
      throw new DatabaseException(
        'Failed to create test user',
        DatabaseErrorType.QUERY_ERROR,
        { cause: error }
      );
    }
  }
  
  return users;
}

/**
 * Options for generating health journey test data
 */
export interface HealthTestDataOptions {
  userId: string;
  includeMetrics?: boolean;
  includeGoals?: boolean;
  includeDevices?: boolean;
  metricCount?: number;
}

/**
 * Creates test data for the Health journey
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param options - Options for health data generation
 * @returns The created health test data
 */
export async function createHealthTestData(prisma: PrismaClient | PrismaService, options: HealthTestDataOptions) {
  const {
    userId,
    includeMetrics = true,
    includeGoals = true,
    includeDevices = true,
    metricCount = 5,
  } = options;
  
  const result: any = {
    metrics: [],
    goals: [],
    devices: [],
  };
  
  try {
    // Get metric types
    const metricTypes = await prisma.healthMetricType.findMany();
    
    if (metricTypes.length === 0) {
      // Create default metric types if none exist
      const defaultTypes = [
        { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
        { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
        { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
        { name: 'STEPS', unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
        { name: 'WEIGHT', unit: 'kg', normalRangeMin: null, normalRangeMax: null },
        { name: 'SLEEP', unit: 'hours', normalRangeMin: 7, normalRangeMax: 9 },
      ];
      
      for (const type of defaultTypes) {
        await prisma.healthMetricType.create({ data: type });
      }
      
      // Fetch the created types
      metricTypes.push(...await prisma.healthMetricType.findMany());
    }
    
    // Create health metrics
    if (includeMetrics && metricTypes.length > 0) {
      const now = new Date();
      
      for (let i = 0; i < metricCount; i++) {
        // Select a random metric type
        const metricType = metricTypes[i % metricTypes.length];
        
        // Create a metric with a timestamp in the past
        const metric = await prisma.healthMetric.create({
          data: {
            userId,
            typeId: metricType.id,
            value: metricType.name === 'BLOOD_PRESSURE' ? '120/80' : String(Math.floor(Math.random() * 100) + 50),
            timestamp: new Date(now.getTime() - (i * 3600000)), // Each metric 1 hour apart
            source: 'TEST',
            notes: `Test metric ${i + 1}`,
          },
        });
        
        result.metrics.push(metric);
      }
    }
    
    // Create health goals
    if (includeGoals && metricTypes.length > 0) {
      for (let i = 0; i < Math.min(2, metricTypes.length); i++) {
        // Select a metric type
        const metricType = metricTypes[i];
        
        // Create a goal
        const goal = await prisma.healthGoal.create({
          data: {
            userId,
            typeId: metricType.id,
            targetValue: metricType.name === 'STEPS' ? '10000' : 
                        metricType.name === 'SLEEP' ? '8' : '70',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'ACTIVE',
            notes: `Test goal for ${metricType.name}`,
          },
        });
        
        result.goals.push(goal);
      }
    }
    
    // Create device connections
    if (includeDevices) {
      // Get device types
      const deviceTypes = await prisma.deviceType.findMany();
      
      if (deviceTypes.length === 0) {
        // Create default device types if none exist
        const defaultTypes = [
          { name: 'Smartwatch', description: 'Wearable smartwatch device', manufacturer: 'Various' },
          { name: 'Blood Pressure Monitor', description: 'Blood pressure monitoring device', manufacturer: 'Various' },
          { name: 'Glucose Monitor', description: 'Blood glucose monitoring device', manufacturer: 'Various' },
          { name: 'Smart Scale', description: 'Weight and body composition scale', manufacturer: 'Various' },
        ];
        
        for (const type of defaultTypes) {
          await prisma.deviceType.create({ data: type });
        }
        
        // Fetch the created types
        deviceTypes.push(...await prisma.deviceType.findMany());
      }
      
      // Create a device connection
      if (deviceTypes.length > 0) {
        const device = await prisma.deviceConnection.create({
          data: {
            userId,
            typeId: deviceTypes[0].id,
            deviceId: `test-device-${Date.now()}`,
            status: 'CONNECTED',
            lastSyncDate: new Date(),
            connectionDate: new Date(),
            settings: JSON.stringify({ testSetting: true }),
          },
        });
        
        result.devices.push(device);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error creating health test data:', error);
    throw new DatabaseException(
      'Failed to create health test data',
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Options for generating care journey test data
 */
export interface CareTestDataOptions {
  userId: string;
  includeAppointments?: boolean;
  includeMedications?: boolean;
  includeTreatments?: boolean;
  includeTelemedicine?: boolean;
}

/**
 * Creates test data for the Care journey
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param options - Options for care data generation
 * @returns The created care test data
 */
export async function createCareTestData(prisma: PrismaClient | PrismaService, options: CareTestDataOptions) {
  const {
    userId,
    includeAppointments = true,
    includeMedications = true,
    includeTreatments = true,
    includeTelemedicine = true,
  } = options;
  
  const result: any = {
    providers: [],
    appointments: [],
    medications: [],
    treatments: [],
    telemedicine: [],
  };
  
  try {
    // Get provider specialties
    const specialties = await prisma.providerSpecialty.findMany();
    
    if (specialties.length === 0) {
      // Create default specialties if none exist
      const defaultSpecialties = [
        { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
        { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
        { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
        { name: 'Pediatria', description: 'Especialista em saúde infantil' },
        { name: 'Psiquiatria', description: 'Especialista em saúde mental' },
      ];
      
      for (const specialty of defaultSpecialties) {
        await prisma.providerSpecialty.create({ data: specialty });
      }
      
      // Fetch the created specialties
      specialties.push(...await prisma.providerSpecialty.findMany());
    }
    
    // Create test providers
    const providers = [];
    for (let i = 0; i < Math.min(2, specialties.length); i++) {
      const provider = await prisma.provider.create({
        data: {
          name: `Dr. Test Provider ${i + 1}`,
          specialtyId: specialties[i].id,
          crm: `12345${i}`,
          email: `provider-${i + 1}@austa.com.br`,
          phone: `+551199888${1000 + i}`,
          address: 'Test Address',
          city: 'São Paulo',
          state: 'SP',
          acceptsInsurance: true,
          rating: 4.5,
        },
      });
      
      providers.push(provider);
      result.providers.push(provider);
    }
    
    // Create appointments
    if (includeAppointments && providers.length > 0) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Past appointment
      const pastAppointment = await prisma.appointment.create({
        data: {
          userId,
          providerId: providers[0].id,
          date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          time: '14:00',
          status: 'COMPLETED',
          notes: 'Past test appointment',
          type: 'IN_PERSON',
          location: 'Test Clinic',
          reason: 'Regular checkup',
        },
      });
      
      // Upcoming appointment
      const upcomingAppointment = await prisma.appointment.create({
        data: {
          userId,
          providerId: providers[0].id,
          date: tomorrow,
          time: '10:00',
          status: 'SCHEDULED',
          notes: 'Upcoming test appointment',
          type: 'IN_PERSON',
          location: 'Test Clinic',
          reason: 'Follow-up',
        },
      });
      
      // Future appointment
      const futureAppointment = await prisma.appointment.create({
        data: {
          userId,
          providerId: providers.length > 1 ? providers[1].id : providers[0].id,
          date: nextWeek,
          time: '15:30',
          status: 'SCHEDULED',
          notes: 'Future test appointment',
          type: 'IN_PERSON',
          location: 'Test Hospital',
          reason: 'Consultation',
        },
      });
      
      result.appointments.push(pastAppointment, upcomingAppointment, futureAppointment);
    }
    
    // Create medications
    if (includeMedications) {
      const medication = await prisma.medication.create({
        data: {
          userId,
          name: 'Test Medication',
          dosage: '10mg',
          instructions: 'Take once daily with food',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'ACTIVE',
          prescribedBy: providers.length > 0 ? providers[0].name : 'Dr. Test',
          prescriptionDate: new Date(),
          refillReminder: true,
          notes: 'Test medication notes',
        },
      });
      
      // Create medication schedule
      const schedule = await prisma.medicationSchedule.create({
        data: {
          medicationId: medication.id,
          time: '08:00',
          frequency: 'DAILY',
          daysOfWeek: 'ALL',
          reminderEnabled: true,
        },
      });
      
      result.medications.push({ ...medication, schedule });
    }
    
    // Create treatments
    if (includeTreatments) {
      const treatment = await prisma.treatment.create({
        data: {
          userId,
          name: 'Test Treatment Plan',
          description: 'Test treatment description',
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          status: 'ACTIVE',
          providerId: providers.length > 0 ? providers[0].id : null,
          notes: 'Test treatment notes',
          type: 'PHYSICAL_THERAPY',
          frequency: 'WEEKLY',
          progress: 0,
        },
      });
      
      result.treatments.push(treatment);
    }
    
    // Create telemedicine sessions
    if (includeTelemedicine && providers.length > 0) {
      const futureSession = await prisma.telemedicineSession.create({
        data: {
          userId,
          providerId: providers[0].id,
          scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          scheduledTime: '11:00',
          status: 'SCHEDULED',
          sessionUrl: 'https://test-session.austa.com.br/12345',
          notes: 'Test telemedicine session',
          type: 'VIDEO',
          duration: 30, // minutes
        },
      });
      
      result.telemedicine.push(futureSession);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating care test data:', error);
    throw new DatabaseException(
      'Failed to create care test data',
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Options for generating plan journey test data
 */
export interface PlanTestDataOptions {
  userId: string;
  includePlans?: boolean;
  includeBenefits?: boolean;
  includeClaims?: boolean;
  includeDocuments?: boolean;
}

/**
 * Creates test data for the Plan journey
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param options - Options for plan data generation
 * @returns The created plan test data
 */
export async function createPlanTestData(prisma: PrismaClient | PrismaService, options: PlanTestDataOptions) {
  const {
    userId,
    includePlans = true,
    includeBenefits = true,
    includeClaims = true,
    includeDocuments = true,
  } = options;
  
  const result: any = {
    plans: [],
    benefits: [],
    claims: [],
    documents: [],
  };
  
  try {
    // Get plan types
    const planTypes = await prisma.insurancePlanType.findMany();
    
    if (planTypes.length === 0) {
      // Create default plan types if none exist
      const defaultTypes = [
        { name: 'Básico', description: 'Plano com cobertura básica' },
        { name: 'Standard', description: 'Plano com cobertura intermediária' },
        { name: 'Premium', description: 'Plano com cobertura ampla' },
      ];
      
      for (const type of defaultTypes) {
        await prisma.insurancePlanType.create({ data: type });
      }
      
      // Fetch the created types
      planTypes.push(...await prisma.insurancePlanType.findMany());
    }
    
    // Create insurance plan
    if (includePlans && planTypes.length > 0) {
      const plan = await prisma.insurancePlan.create({
        data: {
          userId,
          typeId: planTypes[planTypes.length - 1].id, // Use the highest tier plan
          policyNumber: `TEST-${Date.now()}`,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          status: 'ACTIVE',
          monthlyPremium: 500.00,
          annualLimit: 100000.00,
          provider: 'AUSTA Seguros',
          groupNumber: 'G12345',
          notes: 'Test insurance plan',
        },
      });
      
      result.plans.push(plan);
      
      // Create benefits
      if (includeBenefits) {
        const benefits = [
          {
            planId: plan.id,
            name: 'Consultas Médicas',
            description: 'Cobertura para consultas médicas',
            coveragePercentage: 100,
            annualLimit: 10000.00,
            requiresAuthorization: false,
            waitingPeriod: 0,
            notes: 'Sem carência para consultas',
          },
          {
            planId: plan.id,
            name: 'Exames Laboratoriais',
            description: 'Cobertura para exames laboratoriais',
            coveragePercentage: 80,
            annualLimit: 5000.00,
            requiresAuthorization: false,
            waitingPeriod: 30,
            notes: 'Carência de 30 dias para exames',
          },
          {
            planId: plan.id,
            name: 'Internação Hospitalar',
            description: 'Cobertura para internação hospitalar',
            coveragePercentage: 90,
            annualLimit: 50000.00,
            requiresAuthorization: true,
            waitingPeriod: 90,
            notes: 'Carência de 90 dias para internação',
          },
        ];
        
        for (const benefitData of benefits) {
          const benefit = await prisma.benefit.create({ data: benefitData });
          result.benefits.push(benefit);
        }
      }
      
      // Create claims
      if (includeClaims) {
        // Get claim types
        const claimTypes = await prisma.claimType.findMany();
        
        if (claimTypes.length === 0) {
          // Create default claim types if none exist
          const defaultTypes = [
            { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
            { name: 'Exame', description: 'Reembolso para exames médicos' },
            { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
            { name: 'Internação', description: 'Reembolso para internação hospitalar' },
            { name: 'Medicamento', description: 'Reembolso para medicamentos prescritos' },
          ];
          
          for (const type of defaultTypes) {
            await prisma.claimType.create({ data: type });
          }
          
          // Fetch the created types
          claimTypes.push(...await prisma.claimType.findMany());
        }
        
        if (claimTypes.length > 0) {
          // Create claims with different statuses
          const claimData = [
            {
              userId,
              planId: plan.id,
              typeId: claimTypes[0].id,
              serviceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
              submissionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
              amount: 200.00,
              status: 'APPROVED',
              approvedAmount: 200.00,
              paymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
              notes: 'Approved test claim',
              providerName: 'Test Provider',
              serviceDescription: 'Consulta médica',
            },
            {
              userId,
              planId: plan.id,
              typeId: claimTypes[1].id,
              serviceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
              submissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
              amount: 350.00,
              status: 'PENDING',
              approvedAmount: null,
              paymentDate: null,
              notes: 'Pending test claim',
              providerName: 'Test Lab',
              serviceDescription: 'Exame de sangue',
            },
            {
              userId,
              planId: plan.id,
              typeId: claimTypes[4].id,
              serviceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
              submissionDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
              amount: 150.00,
              status: 'REJECTED',
              approvedAmount: 0,
              paymentDate: null,
              notes: 'Rejected test claim - medication not covered',
              providerName: 'Test Pharmacy',
              serviceDescription: 'Medicamento não coberto',
            },
          ];
          
          for (const data of claimData) {
            const claim = await prisma.claim.create({ data });
            result.claims.push(claim);
          }
        }
      }
      
      // Create documents
      if (includeDocuments) {
        const documents = [
          {
            userId,
            planId: plan.id,
            name: 'Carteirinha do Plano',
            type: 'ID_CARD',
            url: 'https://test-storage.austa.com.br/documents/id-card.pdf',
            uploadDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            status: 'ACTIVE',
            notes: 'Test ID card document',
          },
          {
            userId,
            planId: plan.id,
            name: 'Contrato do Plano',
            type: 'CONTRACT',
            url: 'https://test-storage.austa.com.br/documents/contract.pdf',
            uploadDate: new Date(),
            expiryDate: null,
            status: 'ACTIVE',
            notes: 'Test contract document',
          },
        ];
        
        for (const docData of documents) {
          const document = await prisma.document.create({ data: docData });
          result.documents.push(document);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error creating plan test data:', error);
    throw new DatabaseException(
      'Failed to create plan test data',
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Options for generating gamification test data
 */
export interface GamificationTestDataOptions {
  userId: string;
  includeProfile?: boolean;
  includeAchievements?: boolean;
  includeQuests?: boolean;
  includeRewards?: boolean;
}

/**
 * Creates test data for the Gamification engine
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param options - Options for gamification data generation
 * @returns The created gamification test data
 */
export async function createGamificationTestData(prisma: PrismaClient | PrismaService, options: GamificationTestDataOptions) {
  const {
    userId,
    includeProfile = true,
    includeAchievements = true,
    includeQuests = true,
    includeRewards = true,
  } = options;
  
  const result: any = {
    profile: null,
    achievements: [],
    quests: [],
    rewards: [],
  };
  
  try {
    // Create gamification profile
    if (includeProfile) {
      const profile = await prisma.gamificationProfile.create({
        data: {
          userId,
          level: 1,
          xp: 100,
          totalXp: 100,
          streak: 3,
          lastActivityDate: new Date(),
          joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          settings: JSON.stringify({ notifications: true }),
        },
      });
      
      result.profile = profile;
    }
    
    // Get achievement types
    const achievementTypes = await prisma.achievementType.findMany();
    
    if (achievementTypes.length === 0) {
      // Create default achievement types if none exist
      const defaultTypes = [
        { 
          name: 'health-check-streak', 
          title: 'Monitor de Saúde', 
          description: 'Registre suas métricas de saúde por dias consecutivos',
          journey: 'health',
          icon: 'heart-pulse',
          levels: 3
        },
        { 
          name: 'steps-goal', 
          title: 'Caminhante Dedicado', 
          description: 'Atinja sua meta diária de passos',
          journey: 'health',
          icon: 'footprints',
          levels: 3
        },
        { 
          name: 'appointment-keeper', 
          title: 'Compromisso com a Saúde', 
          description: 'Compareça às consultas agendadas',
          journey: 'care',
          icon: 'calendar-check',
          levels: 3
        },
        { 
          name: 'medication-adherence', 
          title: 'Aderência ao Tratamento', 
          description: 'Tome seus medicamentos conforme prescrito',
          journey: 'care',
          icon: 'pill',
          levels: 3
        },
        { 
          name: 'claim-master', 
          title: 'Mestre em Reembolsos', 
          description: 'Submeta solicitações de reembolso completas',
          journey: 'plan',
          icon: 'receipt',
          levels: 3
        },
      ];
      
      for (const type of defaultTypes) {
        await prisma.achievementType.create({ data: type });
      }
      
      // Fetch the created types
      achievementTypes.push(...await prisma.achievementType.findMany());
    }
    
    // Create achievements
    if (includeAchievements && achievementTypes.length > 0) {
      // Create one achievement for each journey
      const journeys = ['health', 'care', 'plan'];
      
      for (const journey of journeys) {
        // Find an achievement type for this journey
        const type = achievementTypes.find(t => t.journey === journey);
        
        if (type) {
          const achievement = await prisma.achievement.create({
            data: {
              userId,
              typeId: type.id,
              level: 1,
              progress: 100, // Completed
              unlockedAt: new Date(Date.now() - (Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date in last 30 days
              xpAwarded: 50,
            },
          });
          
          result.achievements.push(achievement);
        }
      }
    }
    
    // Create quests
    if (includeQuests) {
      const quests = [
        {
          userId,
          title: 'Semana da Saúde',
          description: 'Complete tarefas de saúde durante a semana',
          journey: 'health',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'ACTIVE',
          progress: 25,
          xpReward: 100,
          requirements: JSON.stringify([
            { type: 'METRIC_RECORD', count: 7, current: 2 },
            { type: 'GOAL_ACHIEVE', count: 1, current: 0 },
          ]),
        },
        {
          userId,
          title: 'Cuidado Preventivo',
          description: 'Realize ações de cuidado preventivo',
          journey: 'care',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'ACTIVE',
          progress: 0,
          xpReward: 200,
          requirements: JSON.stringify([
            { type: 'APPOINTMENT_SCHEDULE', count: 1, current: 0 },
            { type: 'MEDICATION_ADHERENCE', count: 7, current: 0 },
          ]),
        },
      ];
      
      for (const questData of quests) {
        const quest = await prisma.quest.create({ data: questData });
        result.quests.push(quest);
      }
    }
    
    // Create rewards
    if (includeRewards) {
      const rewards = [
        {
          userId,
          title: 'Desconto em Farmácia',
          description: 'Cupom de 10% de desconto em farmácias parceiras',
          type: 'DISCOUNT',
          value: '10%',
          code: `REWARD-${Date.now()}`,
          status: 'AVAILABLE',
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          xpCost: 500,
          journey: 'care',
        },
        {
          userId,
          title: 'Consulta Gratuita',
          description: 'Uma consulta gratuita com especialista',
          type: 'SERVICE',
          value: '1 consulta',
          code: `REWARD-${Date.now() + 1}`,
          status: 'AVAILABLE',
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
          xpCost: 1000,
          journey: 'health',
        },
      ];
      
      for (const rewardData of rewards) {
        const reward = await prisma.reward.create({ data: rewardData });
        result.rewards.push(reward);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error creating gamification test data:', error);
    throw new DatabaseException(
      'Failed to create gamification test data',
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Creates a complete test environment with data for all journeys
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param options - Options for test environment creation
 * @returns The created test environment data
 */
export async function createTestEnvironment(prisma: PrismaClient | PrismaService, options: {
  userCount?: number;
  cleanupBeforeCreation?: boolean;
} = {}) {
  const {
    userCount = 1,
    cleanupBeforeCreation = true,
  } = options;
  
  try {
    // Clean up the database if requested
    if (cleanupBeforeCreation) {
      await cleanupTestDatabase(prisma);
    }
    
    // Create test users
    const users = await createTestUsers(prisma, { count: userCount });
    
    const result: any = {
      users,
      health: [],
      care: [],
      plan: [],
      gamification: [],
    };
    
    // Create journey data for each user
    for (const user of users) {
      // Create health data
      const healthData = await createHealthTestData(prisma, { userId: user.id });
      result.health.push(healthData);
      
      // Create care data
      const careData = await createCareTestData(prisma, { userId: user.id });
      result.care.push(careData);
      
      // Create plan data
      const planData = await createPlanTestData(prisma, { userId: user.id });
      result.plan.push(planData);
      
      // Create gamification data
      const gamificationData = await createGamificationTestData(prisma, { userId: user.id });
      result.gamification.push(gamificationData);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating test environment:', error);
    throw new DatabaseException(
      'Failed to create test environment',
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Assertion utilities for database tests
 */

/**
 * Asserts that a database record exists with the specified criteria
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param model - The Prisma model to query
 * @param where - The filter criteria
 * @returns The found record if it exists
 * @throws Error if the record does not exist
 */
export async function assertRecordExists<T = any>(prisma: PrismaClient | PrismaService, model: string, where: any): Promise<T> {
  try {
    // @ts-ignore - Dynamic model access
    const record = await prisma[model].findFirst({ where });
    
    if (!record) {
      throw new Error(`Record not found in ${model} with criteria: ${JSON.stringify(where)}`);
    }
    
    return record as T;
  } catch (error) {
    if (error.message.includes('Record not found')) {
      throw error;
    }
    
    throw new DatabaseException(
      `Failed to assert record exists in ${model}`,
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Asserts that a database record does not exist with the specified criteria
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param model - The Prisma model to query
 * @param where - The filter criteria
 * @throws Error if the record exists
 */
export async function assertRecordNotExists(prisma: PrismaClient | PrismaService, model: string, where: any): Promise<void> {
  try {
    // @ts-ignore - Dynamic model access
    const record = await prisma[model].findFirst({ where });
    
    if (record) {
      throw new Error(`Record found in ${model} with criteria: ${JSON.stringify(where)}`);
    }
  } catch (error) {
    if (error.message.includes('Record found')) {
      throw error;
    }
    
    throw new DatabaseException(
      `Failed to assert record does not exist in ${model}`,
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Asserts that a database record count matches the expected count
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param model - The Prisma model to query
 * @param where - The filter criteria
 * @param expectedCount - The expected count
 * @throws Error if the count does not match
 */
export async function assertRecordCount(prisma: PrismaClient | PrismaService, model: string, where: any, expectedCount: number): Promise<void> {
  try {
    // @ts-ignore - Dynamic model access
    const count = await prisma[model].count({ where });
    
    if (count !== expectedCount) {
      throw new Error(`Expected ${expectedCount} records in ${model} with criteria: ${JSON.stringify(where)}, but found ${count}`);
    }
  } catch (error) {
    if (error.message.includes('Expected')) {
      throw error;
    }
    
    throw new DatabaseException(
      `Failed to assert record count in ${model}`,
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Asserts that a database record has the expected properties
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param model - The Prisma model to query
 * @param where - The filter criteria
 * @param expectedProps - The expected properties
 * @returns The found record if it exists and matches
 * @throws Error if the record does not exist or does not match
 */
export async function assertRecordMatches<T = any>(prisma: PrismaClient | PrismaService, model: string, where: any, expectedProps: Partial<T>): Promise<T> {
  try {
    // @ts-ignore - Dynamic model access
    const record = await prisma[model].findFirst({ where });
    
    if (!record) {
      throw new Error(`Record not found in ${model} with criteria: ${JSON.stringify(where)}`);
    }
    
    // Check that all expected properties match
    for (const [key, value] of Object.entries(expectedProps)) {
      if (record[key] !== value) {
        throw new Error(`Record property mismatch in ${model}: expected ${key} to be ${value}, but got ${record[key]}`);
      }
    }
    
    return record as T;
  } catch (error) {
    if (error.message.includes('Record not found') || error.message.includes('Record property mismatch')) {
      throw error;
    }
    
    throw new DatabaseException(
      `Failed to assert record matches in ${model}`,
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Test cleanup utilities
 */

/**
 * Deletes test data for a specific user
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param userId - The user ID to clean up
 */
export async function cleanupUserTestData(prisma: PrismaClient | PrismaService, userId: string): Promise<void> {
  try {
    // Delete user-specific data in reverse order of dependencies
    
    // Gamification data
    await prisma.reward.deleteMany({ where: { userId } });
    await prisma.quest.deleteMany({ where: { userId } });
    await prisma.achievement.deleteMany({ where: { userId } });
    await prisma.gamificationProfile.deleteMany({ where: { userId } });
    
    // Plan data
    await prisma.document.deleteMany({ where: { userId } });
    await prisma.claim.deleteMany({ where: { userId } });
    
    // Find user's plans
    const plans = await prisma.insurancePlan.findMany({ where: { userId } });
    const planIds = plans.map(plan => plan.id);
    
    // Delete benefits associated with user's plans
    if (planIds.length > 0) {
      await prisma.benefit.deleteMany({
        where: {
          planId: {
            in: planIds,
          },
        },
      });
    }
    
    // Delete plans
    await prisma.insurancePlan.deleteMany({ where: { userId } });
    
    // Care data
    await prisma.telemedicineSession.deleteMany({ where: { userId } });
    await prisma.appointment.deleteMany({ where: { userId } });
    
    // Find user's medications
    const medications = await prisma.medication.findMany({ where: { userId } });
    const medicationIds = medications.map(med => med.id);
    
    // Delete medication schedules
    if (medicationIds.length > 0) {
      await prisma.medicationSchedule.deleteMany({
        where: {
          medicationId: {
            in: medicationIds,
          },
        },
      });
    }
    
    // Delete medications and treatments
    await prisma.medication.deleteMany({ where: { userId } });
    await prisma.treatment.deleteMany({ where: { userId } });
    
    // Health data
    await prisma.deviceConnection.deleteMany({ where: { userId } });
    await prisma.healthGoal.deleteMany({ where: { userId } });
    await prisma.healthMetric.deleteMany({ where: { userId } });
    await prisma.medicalEvent.deleteMany({ where: { userId } });
    
    // User data - disconnect roles first
    await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: [],
        },
      },
    });
    
    // Delete the user
    await prisma.user.delete({ where: { id: userId } });
    
    console.log(`Test data for user ${userId} cleaned up successfully`);
  } catch (error) {
    console.error(`Error cleaning up test data for user ${userId}:`, error);
    throw new DatabaseException(
      'Failed to clean up user test data',
      DatabaseErrorType.QUERY_ERROR,
      { cause: error }
    );
  }
}

/**
 * Registers cleanup functions to run after tests complete
 * 
 * @param prisma - The PrismaClient or PrismaService instance to clean up
 * @param testIds - Object containing IDs of test entities to clean up
 */
export function registerTestCleanup(prisma: PrismaClient | PrismaService, testIds: { userIds?: string[] } = {}): void {
  // Register afterAll hook if in Jest environment
  if (typeof afterAll === 'function') {
    afterAll(async () => {
      try {
        // Clean up specific users if provided
        if (testIds.userIds && testIds.userIds.length > 0) {
          for (const userId of testIds.userIds) {
            await cleanupUserTestData(prisma, userId);
          }
        }
        
        // Close the database connection
        await prisma.$disconnect();
        console.log('Test database connection closed');
      } catch (error) {
        console.error('Error during test cleanup:', error);
      }
    });
  }
}