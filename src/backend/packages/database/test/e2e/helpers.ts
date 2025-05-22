/**
 * Database E2E Test Helpers
 * 
 * This file provides helper utilities for database end-to-end tests, including:
 * - Test database connection utilities
 * - Data generation helpers for all journey contexts
 * - Assertion utilities for database operations
 * - Cleanup mechanisms for test isolation
 */

import { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../../src/database.module';
import { PrismaService } from '../../src/prisma.service';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { BaseJourneyContext } from '../../src/contexts/base-journey.context';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../../src/errors/database-error.types';
import { DatabaseException } from '../../src/errors/database-error.exception';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

/**
 * Configuration options for test database connections
 */
export interface TestDatabaseOptions {
  /** Whether to use an isolated schema for this test */
  isolatedSchema?: boolean;
  /** Custom database URL to override default test database */
  databaseUrl?: string;
  /** Whether to enable query logging */
  enableLogging?: boolean;
  /** Whether to automatically clean up after tests */
  autoCleanup?: boolean;
  /** Journey context to use (health, care, plan) */
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * Default test database options
 */
const defaultTestOptions: TestDatabaseOptions = {
  isolatedSchema: true,
  enableLogging: false,
  autoCleanup: true,
};

/**
 * Creates a test database connection with proper configuration
 * 
 * @param options - Test database connection options
 * @returns A configured PrismaClient instance for testing
 */
export async function createTestDatabase(options: TestDatabaseOptions = {}): Promise<PrismaClient> {
  const testOptions = { ...defaultTestOptions, ...options };
  
  // Generate a unique schema name for test isolation if requested
  const schemaName = testOptions.isolatedSchema 
    ? `test_${crypto.randomBytes(6).toString('hex')}` 
    : 'public';
  
  // Use provided database URL or default test database
  const databaseUrl = testOptions.databaseUrl || 
    process.env.TEST_DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/austa_test';
  
  // Create database URL with schema if isolated
  const dbUrlWithSchema = testOptions.isolatedSchema 
    ? `${databaseUrl}?schema=${schemaName}` 
    : databaseUrl;
  
  // Create a new PrismaClient with test configuration
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrlWithSchema,
      },
    },
    log: testOptions.enableLogging ? ['query', 'error', 'warn'] : [],
  });
  
  // Create schema if using isolation
  if (testOptions.isolatedSchema) {
    try {
      // Create the schema
      await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
      
      // Run migrations on the schema
      // Note: In a real implementation, you might want to use Prisma migrate
      await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}";`);
    } catch (error) {
      console.error(`Failed to create test schema: ${error.message}`);
      throw error;
    }
  }
  
  return prisma;
}

/**
 * Creates a NestJS testing module with database services
 * 
 * @param options - Test database options
 * @returns A configured TestingModule with database services
 */
export async function createTestDatabaseModule(options: TestDatabaseOptions = {}): Promise<TestingModule> {
  const testOptions = { ...defaultTestOptions, ...options };
  
  // Create a testing module with DatabaseModule
  const moduleRef = await Test.createTestingModule({
    imports: [
      DatabaseModule.forRoot({
        databaseUrl: testOptions.databaseUrl || process.env.TEST_DATABASE_URL,
        enableLogging: testOptions.enableLogging,
        maxConnections: 5, // Lower connection pool for tests
        journeyContext: testOptions.journeyContext,
      }),
    ],
  }).compile();
  
  return moduleRef;
}

/**
 * Gets a journey-specific database context from a testing module
 * 
 * @param moduleRef - The testing module reference
 * @param journeyType - The journey type to get context for
 * @returns A journey-specific database context
 */
export function getJourneyContext<T extends BaseJourneyContext>(
  moduleRef: TestingModule,
  journeyType: 'health' | 'care' | 'plan'
): T {
  switch (journeyType) {
    case 'health':
      return moduleRef.get<HealthContext>(HealthContext) as unknown as T;
    case 'care':
      return moduleRef.get<CareContext>(CareContext) as unknown as T;
    case 'plan':
      return moduleRef.get<PlanContext>(PlanContext) as unknown as T;
    default:
      throw new Error(`Unknown journey type: ${journeyType}`);
  }
}

/**
 * Cleans up a test database, removing all data
 * 
 * @param prisma - The PrismaClient instance to clean
 * @param options - Cleanup options
 */
export async function cleanupTestDatabase(
  prisma: PrismaClient,
  options: { dropSchema?: boolean } = {}
): Promise<void> {
  try {
    // Get current schema
    const schemaResult = await prisma.$queryRaw`SELECT current_schema();`;
    const currentSchema = schemaResult[0].current_schema;
    
    if (currentSchema !== 'public') {
      // If using a custom schema and dropSchema is true, drop the entire schema
      if (options.dropSchema) {
        await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${currentSchema}" CASCADE;`);
      } else {
        // Otherwise truncate all tables in the schema
        // This is a simplified version - in a real implementation you would want to
        // handle foreign key constraints properly
        await prisma.$transaction([
          // Disable foreign key checks during truncation
          prisma.$executeRawUnsafe('SET CONSTRAINTS ALL DEFERRED;'),
          
          // Truncate all tables
          // Note: In a real implementation, you would want to get the table list dynamically
          prisma.$executeRawUnsafe(`
            DO $$ 
            DECLARE
              r RECORD;
            BEGIN
              FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = '${currentSchema}') LOOP
                EXECUTE 'TRUNCATE TABLE "' || '${currentSchema}' || '"."' || r.tablename || '" CASCADE;';
              END LOOP;
            END $$;
          `),
          
          // Re-enable foreign key checks
          prisma.$executeRawUnsafe('SET CONSTRAINTS ALL IMMEDIATE;'),
        ]);
      }
    } else {
      // For public schema, just truncate all application tables
      // This is a simplified approach - in a real implementation you would want to
      // handle this more carefully
      await prisma.$transaction([
        // Disable foreign key checks during truncation
        prisma.$executeRawUnsafe('SET CONSTRAINTS ALL DEFERRED;'),
        
        // Truncate specific application tables
        // Note: This list should be generated based on your actual schema
        prisma.$executeRawUnsafe(`
          TRUNCATE TABLE "User", "Role", "Permission", "HealthMetric", "HealthGoal", 
          "DeviceConnection", "Appointment", "Provider", "Medication", "Treatment", 
          "InsurancePlan", "Claim", "Benefit", "Achievement", "GamificationProfile" CASCADE;
        `),
        
        // Re-enable foreign key checks
        prisma.$executeRawUnsafe('SET CONSTRAINTS ALL IMMEDIATE;'),
      ]);
    }
  } catch (error) {
    console.error(`Failed to clean test database: ${error.message}`);
    throw error;
  }
}

/**
 * Generates a test user with specified roles
 * 
 * @param prisma - The PrismaClient instance
 * @param options - User generation options
 * @returns The created test user
 */
export async function generateTestUser(
  prisma: PrismaClient,
  options: {
    name?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
  } = {}
) {
  // Generate a random suffix for email to ensure uniqueness
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const name = options.name || `Test User ${randomSuffix}`;
  const email = options.email || `test.user.${randomSuffix}@example.com`;
  
  // Create a hashed password
  const password = await bcrypt.hash('Password123!', 10);
  
  // Create the user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      phone: `+551199999${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      cpf: generateRandomCPF(),
    },
  });
  
  // Assign roles if specified
  if (options.roles && options.roles.length > 0) {
    // Find the roles
    const roles = await prisma.role.findMany({
      where: {
        name: {
          in: options.roles,
        },
      },
    });
    
    // Connect roles to user
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
  } else {
    // If no roles specified, assign the default User role
    const defaultRole = await prisma.role.findFirst({
      where: { isDefault: true },
    });
    
    if (defaultRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: {
            connect: { id: defaultRole.id },
          },
        },
      });
    }
  }
  
  // Assign direct permissions if specified
  if (options.permissions && options.permissions.length > 0) {
    // Find the permissions
    const permissions = await prisma.permission.findMany({
      where: {
        name: {
          in: options.permissions,
        },
      },
    });
    
    // Connect permissions to user
    if (permissions.length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          permissions: {
            connect: permissions.map(permission => ({ id: permission.id })),
          },
        },
      });
    }
  }
  
  return user;
}

/**
 * Generates test health metrics for a user
 * 
 * @param prisma - The PrismaClient instance
 * @param userId - The user ID to generate metrics for
 * @param options - Metric generation options
 * @returns The created health metrics
 */
export async function generateHealthMetrics(
  prisma: PrismaClient,
  userId: string,
  options: {
    count?: number;
    types?: string[];
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const count = options.count || 10;
  const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = options.endDate || new Date();
  
  // Get metric types from database or use provided types
  let metricTypes = [];
  if (options.types && options.types.length > 0) {
    metricTypes = await prisma.healthMetricType.findMany({
      where: {
        name: {
          in: options.types,
        },
      },
    });
  } else {
    metricTypes = await prisma.healthMetricType.findMany();
  }
  
  if (metricTypes.length === 0) {
    // If no metric types found, create some default ones
    metricTypes = await Promise.all([
      prisma.healthMetricType.create({
        data: { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
      }),
      prisma.healthMetricType.create({
        data: { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
      }),
      prisma.healthMetricType.create({
        data: { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
      }),
      prisma.healthMetricType.create({
        data: { name: 'STEPS', unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
      }),
      prisma.healthMetricType.create({
        data: { name: 'WEIGHT', unit: 'kg', normalRangeMin: null, normalRangeMax: null },
      }),
    ]);
  }
  
  // Generate random metrics
  const metrics = [];
  for (let i = 0; i < count; i++) {
    // Pick a random metric type
    const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)];
    
    // Generate a random date between start and end
    const date = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    
    // Generate a random value based on the metric type
    let value: number;
    let systolic: number | null = null;
    let diastolic: number | null = null;
    
    switch (metricType.name) {
      case 'HEART_RATE':
        value = Math.floor(60 + Math.random() * 40); // 60-100 bpm
        break;
      case 'BLOOD_PRESSURE':
        systolic = Math.floor(110 + Math.random() * 40); // 110-150 mmHg
        diastolic = Math.floor(70 + Math.random() * 20); // 70-90 mmHg
        value = 0; // Not used for blood pressure
        break;
      case 'BLOOD_GLUCOSE':
        value = Math.floor(70 + Math.random() * 30); // 70-100 mg/dL
        break;
      case 'STEPS':
        value = Math.floor(2000 + Math.random() * 8000); // 2000-10000 steps
        break;
      case 'WEIGHT':
        value = Math.floor(50 + Math.random() * 50); // 50-100 kg
        break;
      default:
        value = Math.floor(Math.random() * 100);
    }
    
    // Create the metric
    const metric = await prisma.healthMetric.create({
      data: {
        userId,
        typeId: metricType.id,
        value,
        systolic,
        diastolic,
        recordedAt: date,
        source: 'TEST',
        notes: `Test metric generated for ${metricType.name}`,
      },
    });
    
    metrics.push(metric);
  }
  
  return metrics;
}

/**
 * Generates test appointments for a user
 * 
 * @param prisma - The PrismaClient instance
 * @param userId - The user ID to generate appointments for
 * @param options - Appointment generation options
 * @returns The created appointments
 */
export async function generateAppointments(
  prisma: PrismaClient,
  userId: string,
  options: {
    count?: number;
    startDate?: Date;
    endDate?: Date;
    status?: string[];
  } = {}
) {
  const count = options.count || 5;
  const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = options.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days in future
  const statuses = options.status || ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'PENDING'];
  
  // Get or create provider specialties
  const specialties = await prisma.providerSpecialty.findMany();
  if (specialties.length === 0) {
    // Create default specialties if none exist
    await Promise.all([
      prisma.providerSpecialty.create({
        data: { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
      }),
      prisma.providerSpecialty.create({
        data: { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
      }),
      prisma.providerSpecialty.create({
        data: { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
      }),
      prisma.providerSpecialty.create({
        data: { name: 'Pediatria', description: 'Especialista em saúde infantil' },
      }),
      prisma.providerSpecialty.create({
        data: { name: 'Psiquiatria', description: 'Especialista em saúde mental' },
      }),
    ]);
  }
  
  // Get updated specialties list
  const updatedSpecialties = await prisma.providerSpecialty.findMany();
  
  // Generate providers if needed
  const providers = await prisma.provider.findMany({ take: 5 });
  if (providers.length < 5) {
    // Create some test providers
    for (let i = 0; i < 5 - providers.length; i++) {
      const specialty = updatedSpecialties[Math.floor(Math.random() * updatedSpecialties.length)];
      await prisma.provider.create({
        data: {
          name: `Dr. Test Provider ${i + 1}`,
          specialtyId: specialty.id,
          licenseNumber: `CRM-${Math.floor(10000 + Math.random() * 90000)}`,
          email: `provider${i + 1}@example.com`,
          phone: `+551199999${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        },
      });
    }
  }
  
  // Get updated providers list
  const updatedProviders = await prisma.provider.findMany();
  
  // Generate random appointments
  const appointments = [];
  for (let i = 0; i < count; i++) {
    // Pick a random provider
    const provider = updatedProviders[Math.floor(Math.random() * updatedProviders.length)];
    
    // Generate a random date between start and end
    const date = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    
    // Round to nearest hour
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + Math.floor(Math.random() * 8) + 9); // 9 AM - 5 PM
    
    // Pick a random status
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId,
        providerId: provider.id,
        scheduledAt: date,
        duration: 30, // 30 minutes
        status,
        type: Math.random() > 0.5 ? 'IN_PERSON' : 'TELEMEDICINE',
        notes: `Test appointment with ${provider.name}`,
      },
    });
    
    appointments.push(appointment);
  }
  
  return appointments;
}

/**
 * Generates test insurance claims for a user
 * 
 * @param prisma - The PrismaClient instance
 * @param userId - The user ID to generate claims for
 * @param options - Claim generation options
 * @returns The created claims
 */
export async function generateInsuranceClaims(
  prisma: PrismaClient,
  userId: string,
  options: {
    count?: number;
    startDate?: Date;
    endDate?: Date;
    status?: string[];
  } = {}
) {
  const count = options.count || 3;
  const startDate = options.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
  const endDate = options.endDate || new Date();
  const statuses = options.status || ['SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING'];
  
  // Get or create claim types
  const claimTypes = await prisma.claimType.findMany();
  if (claimTypes.length === 0) {
    // Create default claim types if none exist
    await Promise.all([
      prisma.claimType.create({
        data: { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
      }),
      prisma.claimType.create({
        data: { name: 'Exame', description: 'Reembolso para exames médicos' },
      }),
      prisma.claimType.create({
        data: { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
      }),
      prisma.claimType.create({
        data: { name: 'Internação', description: 'Reembolso para internação hospitalar' },
      }),
      prisma.claimType.create({
        data: { name: 'Medicamento', description: 'Reembolso para medicamentos prescritos' },
      }),
    ]);
  }
  
  // Get updated claim types
  const updatedClaimTypes = await prisma.claimType.findMany();
  
  // Get or create insurance plan types
  const planTypes = await prisma.insurancePlanType.findMany();
  if (planTypes.length === 0) {
    // Create default plan types if none exist
    await Promise.all([
      prisma.insurancePlanType.create({
        data: { name: 'Básico', description: 'Plano com cobertura básica' },
      }),
      prisma.insurancePlanType.create({
        data: { name: 'Standard', description: 'Plano com cobertura intermediária' },
      }),
      prisma.insurancePlanType.create({
        data: { name: 'Premium', description: 'Plano com cobertura ampla' },
      }),
    ]);
  }
  
  // Get updated plan types
  const updatedPlanTypes = await prisma.insurancePlanType.findMany();
  
  // Get or create user's insurance plan
  let userPlan = await prisma.insurancePlan.findFirst({
    where: { userId },
  });
  
  if (!userPlan) {
    // Create a plan for the user if none exists
    const planType = updatedPlanTypes[Math.floor(Math.random() * updatedPlanTypes.length)];
    userPlan = await prisma.insurancePlan.create({
      data: {
        userId,
        typeId: planType.id,
        policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year in future
        status: 'ACTIVE',
      },
    });
  }
  
  // Generate random claims
  const claims = [];
  for (let i = 0; i < count; i++) {
    // Pick a random claim type
    const claimType = updatedClaimTypes[Math.floor(Math.random() * updatedClaimTypes.length)];
    
    // Generate a random date between start and end
    const date = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    
    // Pick a random status
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate a random amount based on claim type
    let amount: number;
    switch (claimType.name) {
      case 'Consulta Médica':
        amount = Math.floor(200 + Math.random() * 300); // R$200-500
        break;
      case 'Exame':
        amount = Math.floor(100 + Math.random() * 900); // R$100-1000
        break;
      case 'Terapia':
        amount = Math.floor(150 + Math.random() * 150); // R$150-300
        break;
      case 'Internação':
        amount = Math.floor(5000 + Math.random() * 15000); // R$5000-20000
        break;
      case 'Medicamento':
        amount = Math.floor(50 + Math.random() * 450); // R$50-500
        break;
      default:
        amount = Math.floor(100 + Math.random() * 900); // R$100-1000
    }
    
    // Create the claim
    const claim = await prisma.claim.create({
      data: {
        userId,
        planId: userPlan.id,
        typeId: claimType.id,
        amount,
        submittedAt: date,
        status,
        providerName: `Test Provider for ${claimType.name}`,
        description: `Test claim for ${claimType.name}`,
        documentUrl: status !== 'PENDING' ? `https://example.com/documents/claim-${i + 1}.pdf` : null,
      },
    });
    
    claims.push(claim);
  }
  
  return claims;
}

/**
 * Generates test achievements for a user
 * 
 * @param prisma - The PrismaClient instance
 * @param userId - The user ID to generate achievements for
 * @param options - Achievement generation options
 * @returns The created achievements
 */
export async function generateAchievements(
  prisma: PrismaClient,
  userId: string,
  options: {
    count?: number;
    journeys?: string[];
    completed?: boolean;
  } = {}
) {
  const count = options.count || 5;
  const journeys = options.journeys || ['health', 'care', 'plan'];
  const completed = options.completed !== undefined ? options.completed : true;
  
  // Get or create achievement types
  const achievementTypes = await prisma.achievementType.findMany();
  if (achievementTypes.length === 0) {
    // Create default achievement types if none exist
    await Promise.all([
      prisma.achievementType.create({
        data: { 
          name: 'health-check-streak', 
          title: 'Monitor de Saúde', 
          description: 'Registre suas métricas de saúde por dias consecutivos',
          journey: 'health',
          icon: 'heart-pulse',
          levels: 3
        },
      }),
      prisma.achievementType.create({
        data: { 
          name: 'steps-goal', 
          title: 'Caminhante Dedicado', 
          description: 'Atinja sua meta diária de passos',
          journey: 'health',
          icon: 'footprints',
          levels: 3
        },
      }),
      prisma.achievementType.create({
        data: { 
          name: 'appointment-keeper', 
          title: 'Compromisso com a Saúde', 
          description: 'Compareça às consultas agendadas',
          journey: 'care',
          icon: 'calendar-check',
          levels: 3
        },
      }),
      prisma.achievementType.create({
        data: { 
          name: 'medication-adherence', 
          title: 'Aderência ao Tratamento', 
          description: 'Tome seus medicamentos conforme prescrito',
          journey: 'care',
          icon: 'pill',
          levels: 3
        },
      }),
      prisma.achievementType.create({
        data: { 
          name: 'claim-master', 
          title: 'Mestre em Reembolsos', 
          description: 'Submeta solicitações de reembolso completas',
          journey: 'plan',
          icon: 'receipt',
          levels: 3
        },
      }),
    ]);
  }
  
  // Get updated achievement types filtered by journey
  const filteredTypes = await prisma.achievementType.findMany({
    where: {
      journey: {
        in: journeys,
      },
    },
  });
  
  // Create or get user's gamification profile
  let profile = await prisma.gamificationProfile.findUnique({
    where: { userId },
  });
  
  if (!profile) {
    profile = await prisma.gamificationProfile.create({
      data: {
        userId,
        level: 1,
        xp: 0,
        streak: 0,
        lastActive: new Date(),
      },
    });
  }
  
  // Generate random achievements
  const achievements = [];
  for (let i = 0; i < count; i++) {
    // Pick a random achievement type from filtered list
    const achievementType = filteredTypes[Math.floor(Math.random() * filteredTypes.length)];
    
    // Generate a random level (1 to max level)
    const level = Math.floor(Math.random() * achievementType.levels) + 1;
    
    // Create the achievement
    const achievement = await prisma.achievement.create({
      data: {
        userId,
        typeId: achievementType.id,
        level,
        progress: completed ? 100 : Math.floor(Math.random() * 100),
        completedAt: completed ? new Date() : null,
        xpAwarded: completed ? level * 100 : 0,
      },
    });
    
    // Update user's XP if achievement is completed
    if (completed) {
      await prisma.gamificationProfile.update({
        where: { userId },
        data: {
          xp: { increment: achievement.xpAwarded },
          // Update level based on XP (simplified formula)
          level: Math.floor((profile.xp + achievement.xpAwarded) / 1000) + 1,
        },
      });
    }
    
    achievements.push(achievement);
  }
  
  return achievements;
}

/**
 * Database assertion utilities for testing
 */
export const dbAssert = {
  /**
   * Asserts that a record exists in the database
   * 
   * @param prisma - The PrismaClient instance
   * @param model - The model name to query
   * @param where - The where clause to find the record
   * @returns The found record
   * @throws Error if record not found
   */
  async exists(prisma: PrismaClient, model: string, where: any): Promise<any> {
    const record = await (prisma as any)[model].findFirst({ where });
    if (!record) {
      throw new Error(`Expected ${model} record to exist with ${JSON.stringify(where)}, but none was found`);
    }
    return record;
  },
  
  /**
   * Asserts that a record does not exist in the database
   * 
   * @param prisma - The PrismaClient instance
   * @param model - The model name to query
   * @param where - The where clause to find the record
   * @throws Error if record is found
   */
  async notExists(prisma: PrismaClient, model: string, where: any): Promise<void> {
    const record = await (prisma as any)[model].findFirst({ where });
    if (record) {
      throw new Error(`Expected no ${model} record to exist with ${JSON.stringify(where)}, but one was found`);
    }
  },
  
  /**
   * Asserts that a record matches expected values
   * 
   * @param prisma - The PrismaClient instance
   * @param model - The model name to query
   * @param where - The where clause to find the record
   * @param expected - The expected values to match
   * @returns The found record
   * @throws Error if record not found or doesn't match
   */
  async matches(prisma: PrismaClient, model: string, where: any, expected: any): Promise<any> {
    const record = await (prisma as any)[model].findFirst({ where });
    if (!record) {
      throw new Error(`Expected ${model} record to exist with ${JSON.stringify(where)}, but none was found`);
    }
    
    // Check each expected field
    for (const [key, value] of Object.entries(expected)) {
      if (record[key] !== value) {
        throw new Error(
          `Expected ${model}.${key} to be ${value}, but got ${record[key]} for record with ${JSON.stringify(where)}`
        );
      }
    }
    
    return record;
  },
  
  /**
   * Asserts that a count of records matches expected count
   * 
   * @param prisma - The PrismaClient instance
   * @param model - The model name to query
   * @param where - The where clause to filter records
   * @param expectedCount - The expected count
   * @throws Error if count doesn't match
   */
  async count(prisma: PrismaClient, model: string, where: any, expectedCount: number): Promise<void> {
    const count = await (prisma as any)[model].count({ where });
    if (count !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} ${model} records with ${JSON.stringify(where)}, but found ${count}`
      );
    }
  },
  
  /**
   * Asserts that a database error is thrown with expected type
   * 
   * @param action - The database action to perform
   * @param expectedErrorType - The expected error type
   * @throws Error if no error is thrown or error type doesn't match
   */
  async throws(action: () => Promise<any>, expectedErrorType: DatabaseErrorType): Promise<void> {
    try {
      await action();
      throw new Error(`Expected database action to throw ${expectedErrorType}, but it succeeded`);
    } catch (error) {
      if (!(error instanceof DatabaseException)) {
        throw new Error(
          `Expected error to be DatabaseException, but got ${error.constructor.name}: ${error.message}`
        );
      }
      
      if (error.type !== expectedErrorType) {
        throw new Error(
          `Expected error type to be ${expectedErrorType}, but got ${error.type}: ${error.message}`
        );
      }
    }
  },
};

/**
 * Utility function to generate a random valid CPF (Brazilian tax ID)
 * This is a simplified version that doesn't validate the check digits
 * 
 * @returns A random CPF string
 */
function generateRandomCPF(): string {
  const randomDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += randomDigits[i] * (10 - i);
  }
  const firstCheckDigit = (sum * 10) % 11 % 10;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += randomDigits[i] * (11 - i);
  }
  sum += firstCheckDigit * 2;
  const secondCheckDigit = (sum * 10) % 11 % 10;
  
  // Combine all digits
  return [...randomDigits, firstCheckDigit, secondCheckDigit].join('');
}