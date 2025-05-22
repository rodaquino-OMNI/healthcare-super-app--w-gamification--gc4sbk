import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@austa/database';
import { BaseJourneyContext } from '@austa/database/contexts';
import { HealthContext } from '@austa/database/contexts/health.context';
import { CareContext } from '@austa/database/contexts/care.context';
import { PlanContext } from '@austa/database/contexts/plan.context';
import { TransactionService } from '@austa/database/transactions';
import { TransactionIsolationLevel } from '@austa/database/transactions/transaction.interface';
import { DatabaseException, TransactionException } from '@austa/database/errors';
import { 
  BusinessRuleViolationError, 
  ResourceExistsError, 
  ResourceNotFoundError 
} from '@austa/errors/categories';
import { Health, Care, Plan } from '@austa/errors/journey';
import { 
  getEnv, 
  getOptionalEnv, 
  parseBoolean 
} from '@austa/utils/env';
import { Logger } from '@austa/logging';
import * as bcrypt from 'bcrypt';

// Create a logger instance for the seeding process
const logger = new Logger('DatabaseSeeder');

/**
 * Environment configuration for database seeding
 */
interface SeedConfig {
  // Whether to clean the database before seeding
  cleanDatabase: boolean;
  // Which journeys to seed (all if empty)
  journeys: string[];
  // Whether to seed in development mode (more data)
  developmentMode: boolean;
  // Number of retry attempts for failed operations
  maxRetries: number;
  // Whether to continue on non-critical errors
  continueOnError: boolean;
}

/**
 * Get seeding configuration from environment variables
 */
function getSeedConfig(): SeedConfig {
  return {
    cleanDatabase: parseBoolean(getOptionalEnv('SEED_CLEAN_DATABASE', 'true')),
    journeys: getOptionalEnv('SEED_JOURNEYS', '')?.split(',').filter(Boolean) || [],
    developmentMode: parseBoolean(getOptionalEnv('SEED_DEVELOPMENT_MODE', 'false')),
    maxRetries: parseInt(getOptionalEnv('SEED_MAX_RETRIES', '3'), 10),
    continueOnError: parseBoolean(getOptionalEnv('SEED_CONTINUE_ON_ERROR', 'false')),
  };
}

/**
 * Seeds the database with initial data.
 * 
 * @returns A promise that resolves when the database is seeded.
 */
async function seed(): Promise<void> {
  logger.log('Starting database seeding process...');
  const startTime = Date.now();
  
  // Get seeding configuration from environment
  const config = getSeedConfig();
  logger.log(`Seeding configuration: ${JSON.stringify(config)}`);
  
  // Create database services
  const prismaService = new PrismaService();
  const prisma = new PrismaClient();
  const transactionService = new TransactionService(prisma);
  
  // Create journey-specific database contexts
  const healthContext = new HealthContext(prisma);
  const careContext = new CareContext(prisma);
  const planContext = new PlanContext(prisma);
  
  try {
    // Clean the database if configured to do so
    if (config.cleanDatabase) {
      logger.log('Cleaning database before seeding...');
      await prismaService.cleanDatabase();
    }
    
    // Start a transaction for the entire seeding process
    await transactionService.withTransaction(
      async (tx) => {
        // Seed core data (always required)
        await seedCoreData(tx, config);
        
        // Seed journey-specific data based on configuration
        const journeys = config.journeys.length > 0 ? config.journeys : ['health', 'care', 'plan', 'gamification'];
        
        for (const journey of journeys) {
          try {
            const journeyStartTime = Date.now();
            logger.log(`Seeding ${journey} journey data...`);
            
            switch (journey) {
              case 'health':
                await seedHealthJourney(healthContext, config);
                break;
              case 'care':
                await seedCareJourney(careContext, config);
                break;
              case 'plan':
                await seedPlanJourney(planContext, config);
                break;
              case 'gamification':
                await seedGamificationData(tx, config);
                break;
              default:
                logger.warn(`Unknown journey: ${journey}, skipping...`);
            }
            
            const journeyDuration = Date.now() - journeyStartTime;
            logger.log(`Completed seeding ${journey} journey data in ${journeyDuration}ms`);
          } catch (error) {
            if (config.continueOnError) {
              logger.error(`Error seeding ${journey} journey data: ${error.message}`, error.stack);
              logger.warn(`Continuing with next journey due to continueOnError=true`);
            } else {
              throw error;
            }
          }
        }
      },
      {
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        maxRetries: config.maxRetries,
      }
    );
    
    const duration = Date.now() - startTime;
    logger.log(`Database seeding completed successfully in ${duration}ms!`);
  } catch (error) {
    const duration = Date.now() - startTime;
    if (error instanceof DatabaseException || error instanceof TransactionException) {
      logger.error(
        `Database error during seeding (${duration}ms): ${error.message}`,
        { error: error.toJSON(), stack: error.stack }
      );
    } else if (error instanceof BusinessRuleViolationError) {
      logger.error(
        `Business rule violation during seeding (${duration}ms): ${error.message}`,
        { error: error.toJSON(), stack: error.stack }
      );
    } else {
      logger.error(
        `Unexpected error during seeding (${duration}ms): ${error.message}`,
        { stack: error.stack }
      );
    }
    throw error;
  } finally {
    // Close database connections
    await prisma.$disconnect();
  }
}

/**
 * Seeds core data required by all journeys (permissions, roles, users).
 * 
 * @param tx - The transaction client
 * @param config - Seeding configuration
 */
async function seedCoreData(
  tx: PrismaClient,
  config: SeedConfig
): Promise<void> {
  try {
    logger.log('Seeding core permissions...');
    await seedPermissions(tx);
    
    logger.log('Seeding core roles...');
    await seedRoles(tx);
    
    logger.log('Seeding core users...');
    await seedUsers(tx, config.developmentMode);
  } catch (error) {
    if (error instanceof ResourceExistsError) {
      logger.warn(`Resource already exists: ${error.message}`);
    } else {
      logger.error(`Error seeding core data: ${error.message}`, error.stack);
      throw error;
    }
  }
}

/**
 * Seeds permissions for all journeys.
 * 
 * @param tx - The transaction client
 */
async function seedPermissions(tx: PrismaClient): Promise<void> {
  // Health journey permissions
  const healthPermissions = [
    { name: 'health:metrics:read', description: 'View health metrics' },
    { name: 'health:metrics:write', description: 'Record health metrics' },
    { name: 'health:history:read', description: 'View medical history' },
    { name: 'health:history:write', description: 'Update medical history' },
    { name: 'health:goals:read', description: 'View health goals' },
    { name: 'health:goals:write', description: 'Set health goals' },
    { name: 'health:devices:read', description: 'View connected devices' },
    { name: 'health:devices:write', description: 'Manage device connections' },
  ];
  
  // Care journey permissions
  const carePermissions = [
    { name: 'care:appointments:read', description: 'View appointments' },
    { name: 'care:appointments:write', description: 'Manage appointments' },
    { name: 'care:telemedicine:read', description: 'View telemedicine sessions' },
    { name: 'care:telemedicine:write', description: 'Manage telemedicine sessions' },
    { name: 'care:medications:read', description: 'View medications' },
    { name: 'care:medications:write', description: 'Manage medications' },
    { name: 'care:treatments:read', description: 'View treatment plans' },
    { name: 'care:treatments:write', description: 'Manage treatment plans' },
  ];
  
  // Plan journey permissions
  const planPermissions = [
    { name: 'plan:coverage:read', description: 'View coverage information' },
    { name: 'plan:claims:read', description: 'View claims' },
    { name: 'plan:claims:write', description: 'Submit and manage claims' },
    { name: 'plan:benefits:read', description: 'View benefits' },
    { name: 'plan:documents:read', description: 'View insurance documents' },
    { name: 'plan:documents:write', description: 'Upload insurance documents' },
    { name: 'plan:payments:read', description: 'View payment information' },
    { name: 'plan:simulator:use', description: 'Use cost simulator' },
  ];
  
  // Gamification permissions
  const gamificationPermissions = [
    { name: 'game:achievements:read', description: 'View achievements' },
    { name: 'game:progress:read', description: 'View progress' },
    { name: 'game:rewards:read', description: 'View rewards' },
    { name: 'game:rewards:redeem', description: 'Redeem rewards' },
    { name: 'game:leaderboard:read', description: 'View leaderboards' },
  ];
  
  const allPermissions = [
    ...healthPermissions,
    ...carePermissions,
    ...planPermissions,
    ...gamificationPermissions,
  ];
  
  // Create all permissions in the database
  logger.log(`Creating ${allPermissions.length} permissions...`);
  
  for (const permission of allPermissions) {
    try {
      // Try to create the permission, ignore if it already exists
      await tx.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    } catch (error) {
      // Handle Prisma unique constraint violation
      if (error.code === 'P2002') {
        logger.debug(`Permission ${permission.name} already exists, skipping...`);
      } else {
        // Transform database error to domain error
        throw new DatabaseException(
          `Failed to create permission ${permission.name}`,
          { cause: error, context: { permission } }
        );
      }
    }
  }
  
  logger.log(`Successfully created permissions`);
}

/**
 * Seeds roles and assigns permissions to them.
 * 
 * @param tx - The transaction client
 */
async function seedRoles(tx: PrismaClient): Promise<void> {
  // Get all permissions
  const permissions = await tx.permission.findMany();
  const permissionsByName = new Map();
  
  // Create a map of permission names to IDs
  permissions.forEach(permission => {
    permissionsByName.set(permission.name, permission);
  });
  
  // Define roles with their permissions
  const roles = [
    {
      name: 'User',
      description: 'Standard user with access to all journeys',
      isDefault: true,
      journey: null,
      permissions: [
        // Health journey - basic access
        'health:metrics:read',
        'health:metrics:write',
        'health:history:read',
        'health:goals:read',
        'health:goals:write',
        'health:devices:read',
        'health:devices:write',
        
        // Care journey - basic access
        'care:appointments:read',
        'care:appointments:write',
        'care:telemedicine:read',
        'care:telemedicine:write',
        'care:medications:read',
        'care:medications:write',
        'care:treatments:read',
        
        // Plan journey - basic access
        'plan:coverage:read',
        'plan:claims:read',
        'plan:claims:write',
        'plan:benefits:read',
        'plan:documents:read',
        'plan:documents:write',
        'plan:payments:read',
        'plan:simulator:use',
        
        // Gamification
        'game:achievements:read',
        'game:progress:read',
        'game:rewards:read',
        'game:rewards:redeem',
        'game:leaderboard:read',
      ],
    },
    {
      name: 'Caregiver',
      description: 'User with delegated access to another user\'s health data',
      isDefault: false,
      journey: null,
      permissions: [
        'health:metrics:read',
        'health:history:read',
        'health:goals:read',
        'care:appointments:read',
        'care:appointments:write',
        'care:medications:read',
        'care:treatments:read',
      ],
    },
    {
      name: 'Provider',
      description: 'Healthcare provider with access to patient data',
      isDefault: false,
      journey: 'care',
      permissions: [
        'health:metrics:read',
        'health:history:read',
        'health:history:write',
        'care:appointments:read',
        'care:appointments:write',
        'care:telemedicine:read',
        'care:telemedicine:write',
        'care:medications:read',
        'care:medications:write',
        'care:treatments:read',
        'care:treatments:write',
      ],
    },
    {
      name: 'Administrator',
      description: 'System administrator with full access',
      isDefault: false,
      journey: null,
      permissions: permissions.map(p => p.name), // All permissions
    },
  ];
  
  // Create roles and assign permissions
  logger.log(`Creating ${roles.length} roles...`);
  
  for (const role of roles) {
    try {
      const { permissions: permissionNames, ...roleData } = role;
      
      // Create the role
      const createdRole = await tx.role.upsert({
        where: { name: roleData.name },
        update: roleData,
        create: roleData,
      });
      
      // Get valid permissions to connect
      const permissionConnections = [];
      const missingPermissions = [];
      
      for (const name of permissionNames) {
        const permission = permissionsByName.get(name);
        if (permission) {
          permissionConnections.push({ id: permission.id });
        } else {
          missingPermissions.push(name);
        }
      }
      
      if (missingPermissions.length > 0) {
        logger.warn(
          `Some permissions were not found for role ${roleData.name}: ${missingPermissions.join(', ')}`
        );
      }
      
      // Connect permissions to the role
      if (permissionConnections.length > 0) {
        await tx.role.update({
          where: { id: createdRole.id },
          data: {
            permissions: {
              connect: permissionConnections,
            },
          },
        });
      }
      
      logger.log(`Created role: ${roleData.name} with ${permissionConnections.length} permissions`);
    } catch (error) {
      if (error.code === 'P2002') {
        logger.debug(`Role ${role.name} already exists, updating permissions...`);
      } else {
        throw new DatabaseException(
          `Failed to create role ${role.name}`,
          { cause: error, context: { role } }
        );
      }
    }
  }
}

/**
 * Seeds default users.
 * 
 * @param tx - The transaction client
 * @param developmentMode - Whether to seed additional development data
 */
async function seedUsers(
  tx: PrismaClient,
  developmentMode: boolean
): Promise<void> {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('Password123!', 10);
    const adminUser = await tx.user.upsert({
      where: { email: 'admin@austa.com.br' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@austa.com.br',
        password: adminPassword,
        phone: '+5511999999999',
        cpf: '12345678901',
      },
    });
    
    // Get the admin role
    const adminRole = await tx.role.findUnique({
      where: { name: 'Administrator' },
    });
    
    if (!adminRole) {
      throw new ResourceNotFoundError(
        'Administrator role not found',
        { context: { user: adminUser.email } }
      );
    }
    
    // Assign admin role to admin user
    await tx.user.update({
      where: { id: adminUser.id },
      data: {
        roles: {
          connect: { id: adminRole.id },
        },
      },
    });
    
    logger.log(`Created/updated admin user: ${adminUser.email} with Administrator role`);
    
    // Create regular test user
    const userPassword = await bcrypt.hash('Password123!', 10);
    const testUser = await tx.user.upsert({
      where: { email: 'user@austa.com.br' },
      update: {},
      create: {
        name: 'Test User',
        email: 'user@austa.com.br',
        password: userPassword,
        phone: '+5511888888888',
        cpf: '98765432109',
      },
    });
    
    // Get the default user role
    const userRole = await tx.role.findFirst({
      where: { isDefault: true },
    });
    
    if (!userRole) {
      throw new ResourceNotFoundError(
        'Default user role not found',
        { context: { user: testUser.email } }
      );
    }
    
    // Assign user role to test user
    await tx.user.update({
      where: { id: testUser.id },
      data: {
        roles: {
          connect: { id: userRole.id },
        },
      },
    });
    
    logger.log(`Created/updated test user: ${testUser.email} with ${userRole.name} role`);
    
    // Create additional development users if in development mode
    if (developmentMode) {
      logger.log('Creating additional development users...');
      
      // Create a caregiver user
      const caregiverPassword = await bcrypt.hash('Password123!', 10);
      const caregiverUser = await tx.user.upsert({
        where: { email: 'caregiver@austa.com.br' },
        update: {},
        create: {
          name: 'Caregiver User',
          email: 'caregiver@austa.com.br',
          password: caregiverPassword,
          phone: '+5511777777777',
          cpf: '45678912345',
        },
      });
      
      // Get the caregiver role
      const caregiverRole = await tx.role.findUnique({
        where: { name: 'Caregiver' },
      });
      
      if (caregiverRole) {
        // Assign caregiver role
        await tx.user.update({
          where: { id: caregiverUser.id },
          data: {
            roles: {
              connect: { id: caregiverRole.id },
            },
          },
        });
        
        logger.log(`Created/updated caregiver user: ${caregiverUser.email} with Caregiver role`);
      }
      
      // Create a provider user
      const providerPassword = await bcrypt.hash('Password123!', 10);
      const providerUser = await tx.user.upsert({
        where: { email: 'provider@austa.com.br' },
        update: {},
        create: {
          name: 'Provider User',
          email: 'provider@austa.com.br',
          password: providerPassword,
          phone: '+5511666666666',
          cpf: '78912345678',
        },
      });
      
      // Get the provider role
      const providerRole = await tx.role.findUnique({
        where: { name: 'Provider' },
      });
      
      if (providerRole) {
        // Assign provider role
        await tx.user.update({
          where: { id: providerUser.id },
          data: {
            roles: {
              connect: { id: providerRole.id },
            },
          },
        });
        
        logger.log(`Created/updated provider user: ${providerUser.email} with Provider role`);
      }
    }
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      throw error; // Re-throw domain errors
    } else if (error.code === 'P2002') {
      logger.debug(`User already exists, skipping...`);
    } else {
      throw new DatabaseException(
        `Failed to create users`,
        { cause: error, context: { developmentMode } }
      );
    }
  }
}

/**
 * Seeds Health journey-specific data.
 * 
 * @param healthContext - The Health journey database context
 * @param config - Seeding configuration
 */
async function seedHealthJourney(
  healthContext: HealthContext,
  config: SeedConfig
): Promise<void> {
  try {
    // Use the Health context to seed data with proper error handling
    await healthContext.withTransaction(async (tx) => {
      // Sample health metrics types
      const metricTypes = [
        { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
        { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
        { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
        { name: 'STEPS', unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
        { name: 'WEIGHT', unit: 'kg', normalRangeMin: null, normalRangeMax: null },
        { name: 'SLEEP', unit: 'hours', normalRangeMin: 7, normalRangeMax: 9 },
      ];

      logger.log(`Creating ${metricTypes.length} health metric types...`);
      for (const metricType of metricTypes) {
        try {
          await tx.healthMetricType.upsert({
            where: { name: metricType.name },
            update: {},
            create: metricType,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            logger.debug(`Health metric type ${metricType.name} already exists, skipping...`);
          } else {
            throw new Health.Metrics.MetricTypeCreationError(
              `Failed to create health metric type ${metricType.name}`,
              { cause: error, context: { metricType } }
            );
          }
        }
      }
      
      // Sample device types
      const deviceTypes = [
        { name: 'Smartwatch', description: 'Wearable smartwatch device', manufacturer: 'Various' },
        { name: 'Blood Pressure Monitor', description: 'Blood pressure monitoring device', manufacturer: 'Various' },
        { name: 'Glucose Monitor', description: 'Blood glucose monitoring device', manufacturer: 'Various' },
        { name: 'Smart Scale', description: 'Weight and body composition scale', manufacturer: 'Various' },
      ];
      
      logger.log(`Creating ${deviceTypes.length} device types...`);
      for (const deviceType of deviceTypes) {
        try {
          await tx.deviceType.upsert({
            where: { name: deviceType.name },
            update: {},
            create: deviceType,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            logger.debug(`Device type ${deviceType.name} already exists, skipping...`);
          } else {
            throw new Health.Devices.DeviceTypeCreationError(
              `Failed to create device type ${deviceType.name}`,
              { cause: error, context: { deviceType } }
            );
          }
        }
      }
      
      // Add additional development data if in development mode
      if (config.developmentMode) {
        logger.log('Creating additional health development data...');
        
        // Sample health goals
        const healthGoals = [
          { 
            name: 'Daily Steps', 
            description: 'Walk 10,000 steps daily', 
            metricType: 'STEPS',
            targetValue: 10000,
            frequency: 'DAILY',
          },
          { 
            name: 'Sleep Duration', 
            description: 'Sleep 8 hours per night', 
            metricType: 'SLEEP',
            targetValue: 8,
            frequency: 'DAILY',
          },
          { 
            name: 'Weight Management', 
            description: 'Maintain weight within healthy range', 
            metricType: 'WEIGHT',
            targetValue: null, // Target depends on the user
            frequency: 'WEEKLY',
          },
        ];
        
        // Create sample goal templates
        logger.log(`Creating ${healthGoals.length} health goal templates...`);
        for (const goal of healthGoals) {
          try {
            // Find the metric type
            const metricType = await tx.healthMetricType.findUnique({
              where: { name: goal.metricType },
            });
            
            if (!metricType) {
              throw new ResourceNotFoundError(
                `Metric type ${goal.metricType} not found`,
                { context: { goal } }
              );
            }
            
            // Create the goal template
            await tx.healthGoalTemplate.upsert({
              where: { name: goal.name },
              update: {},
              create: {
                name: goal.name,
                description: goal.description,
                metricTypeId: metricType.id,
                targetValue: goal.targetValue,
                frequency: goal.frequency,
              },
            });
          } catch (error) {
            if (error instanceof ResourceNotFoundError) {
              throw error; // Re-throw domain errors
            } else if (error.code === 'P2002') {
              logger.debug(`Health goal template ${goal.name} already exists, skipping...`);
            } else {
              throw new Health.Goals.GoalCreationError(
                `Failed to create health goal template ${goal.name}`,
                { cause: error, context: { goal } }
              );
            }
          }
        }
      }
    }, {
      isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
      maxRetries: config.maxRetries,
    });
    
    logger.log('Health journey data seeded successfully');
  } catch (error) {
    logger.error(`Error seeding Health journey data: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds Care journey-specific data.
 * 
 * @param careContext - The Care journey database context
 * @param config - Seeding configuration
 */
async function seedCareJourney(
  careContext: CareContext,
  config: SeedConfig
): Promise<void> {
  try {
    // Use the Care context to seed data with proper error handling
    await careContext.withTransaction(async (tx) => {
      // Sample provider specialties
      const specialties = [
        { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
        { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
        { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
        { name: 'Pediatria', description: 'Especialista em saúde infantil' },
        { name: 'Psiquiatria', description: 'Especialista em saúde mental' },
      ];
      
      logger.log(`Creating ${specialties.length} provider specialties...`);
      for (const specialty of specialties) {
        try {
          await tx.providerSpecialty.upsert({
            where: { name: specialty.name },
            update: {},
            create: specialty,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            logger.debug(`Provider specialty ${specialty.name} already exists, skipping...`);
          } else {
            throw new Care.Providers.SpecialtyCreationError(
              `Failed to create provider specialty ${specialty.name}`,
              { cause: error, context: { specialty } }
            );
          }
        }
      }
      
      // Add additional development data if in development mode
      if (config.developmentMode) {
        logger.log('Creating additional care development data...');
        
        // Sample medication categories
        const medicationCategories = [
          { name: 'Analgésico', description: 'Medicamentos para alívio da dor' },
          { name: 'Anti-inflamatório', description: 'Medicamentos para redução de inflamação' },
          { name: 'Antibiótico', description: 'Medicamentos para combate a infecções bacterianas' },
          { name: 'Anti-hipertensivo', description: 'Medicamentos para controle da pressão arterial' },
          { name: 'Antidepressivo', description: 'Medicamentos para tratamento de depressão' },
        ];
        
        logger.log(`Creating ${medicationCategories.length} medication categories...`);
        for (const category of medicationCategories) {
          try {
            await tx.medicationCategory.upsert({
              where: { name: category.name },
              update: {},
              create: category,
            });
          } catch (error) {
            if (error.code === 'P2002') {
              logger.debug(`Medication category ${category.name} already exists, skipping...`);
            } else {
              throw new Care.Medications.CategoryCreationError(
                `Failed to create medication category ${category.name}`,
                { cause: error, context: { category } }
              );
            }
          }
        }
        
        // Sample appointment types
        const appointmentTypes = [
          { name: 'Consulta Inicial', description: 'Primeira consulta com o médico', durationMinutes: 60 },
          { name: 'Retorno', description: 'Consulta de acompanhamento', durationMinutes: 30 },
          { name: 'Emergência', description: 'Atendimento de emergência', durationMinutes: 45 },
          { name: 'Telemedicina', description: 'Consulta remota por vídeo', durationMinutes: 30 },
          { name: 'Exame', description: 'Realização de exames médicos', durationMinutes: 45 },
        ];
        
        logger.log(`Creating ${appointmentTypes.length} appointment types...`);
        for (const appointmentType of appointmentTypes) {
          try {
            await tx.appointmentType.upsert({
              where: { name: appointmentType.name },
              update: {},
              create: appointmentType,
            });
          } catch (error) {
            if (error.code === 'P2002') {
              logger.debug(`Appointment type ${appointmentType.name} already exists, skipping...`);
            } else {
              throw new Care.Appointments.TypeCreationError(
                `Failed to create appointment type ${appointmentType.name}`,
                { cause: error, context: { appointmentType } }
              );
            }
          }
        }
      }
    }, {
      isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
      maxRetries: config.maxRetries,
    });
    
    logger.log('Care journey data seeded successfully');
  } catch (error) {
    logger.error(`Error seeding Care journey data: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds Plan journey-specific data.
 * 
 * @param planContext - The Plan journey database context
 * @param config - Seeding configuration
 */
async function seedPlanJourney(
  planContext: PlanContext,
  config: SeedConfig
): Promise<void> {
  try {
    // Use the Plan context to seed data with proper error handling
    await planContext.withTransaction(async (tx) => {
      // Sample plan types
      const planTypes = [
        { name: 'Básico', description: 'Plano com cobertura básica' },
        { name: 'Standard', description: 'Plano com cobertura intermediária' },
        { name: 'Premium', description: 'Plano com cobertura ampla' },
      ];
      
      logger.log(`Creating ${planTypes.length} insurance plan types...`);
      for (const planType of planTypes) {
        try {
          await tx.insurancePlanType.upsert({
            where: { name: planType.name },
            update: {},
            create: planType,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            logger.debug(`Insurance plan type ${planType.name} already exists, skipping...`);
          } else {
            throw new Plan.Coverage.PlanTypeCreationError(
              `Failed to create insurance plan type ${planType.name}`,
              { cause: error, context: { planType } }
            );
          }
        }
      }
      
      // Sample claim types
      const claimTypes = [
        { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
        { name: 'Exame', description: 'Reembolso para exames médicos' },
        { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
        { name: 'Internação', description: 'Reembolso para internação hospitalar' },
        { name: 'Medicamento', description: 'Reembolso para medicamentos prescritos' },
      ];
      
      logger.log(`Creating ${claimTypes.length} claim types...`);
      for (const claimType of claimTypes) {
        try {
          await tx.claimType.upsert({
            where: { name: claimType.name },
            update: {},
            create: claimType,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            logger.debug(`Claim type ${claimType.name} already exists, skipping...`);
          } else {
            throw new Plan.Claims.ClaimTypeCreationError(
              `Failed to create claim type ${claimType.name}`,
              { cause: error, context: { claimType } }
            );
          }
        }
      }
      
      // Add additional development data if in development mode
      if (config.developmentMode) {
        logger.log('Creating additional plan development data...');
        
        // Sample document types
        const documentTypes = [
          { name: 'Receita Médica', description: 'Prescrição médica para medicamentos', requiredForClaim: true },
          { name: 'Nota Fiscal', description: 'Comprovante de pagamento', requiredForClaim: true },
          { name: 'Laudo Médico', description: 'Relatório detalhado do médico', requiredForClaim: false },
          { name: 'Pedido de Exame', description: 'Solicitação de exames médicos', requiredForClaim: true },
          { name: 'Resultado de Exame', description: 'Resultado de exames realizados', requiredForClaim: false },
        ];
        
        logger.log(`Creating ${documentTypes.length} document types...`);
        for (const documentType of documentTypes) {
          try {
            await tx.documentType.upsert({
              where: { name: documentType.name },
              update: {},
              create: documentType,
            });
          } catch (error) {
            if (error.code === 'P2002') {
              logger.debug(`Document type ${documentType.name} already exists, skipping...`);
            } else {
              throw new Plan.Documents.DocumentTypeCreationError(
                `Failed to create document type ${documentType.name}`,
                { cause: error, context: { documentType } }
              );
            }
          }
        }
        
        // Sample benefit categories
        const benefitCategories = [
          { name: 'Consultas', description: 'Benefícios relacionados a consultas médicas' },
          { name: 'Exames', description: 'Benefícios relacionados a exames diagnósticos' },
          { name: 'Terapias', description: 'Benefícios relacionados a tratamentos terapêuticos' },
          { name: 'Internação', description: 'Benefícios relacionados a internação hospitalar' },
          { name: 'Medicamentos', description: 'Benefícios relacionados a medicamentos' },
        ];
        
        logger.log(`Creating ${benefitCategories.length} benefit categories...`);
        for (const category of benefitCategories) {
          try {
            await tx.benefitCategory.upsert({
              where: { name: category.name },
              update: {},
              create: category,
            });
          } catch (error) {
            if (error.code === 'P2002') {
              logger.debug(`Benefit category ${category.name} already exists, skipping...`);
            } else {
              throw new Plan.Benefits.CategoryCreationError(
                `Failed to create benefit category ${category.name}`,
                { cause: error, context: { category } }
              );
            }
          }
        }
      }
    }, {
      isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
      maxRetries: config.maxRetries,
    });
    
    logger.log('Plan journey data seeded successfully');
  } catch (error) {
    logger.error(`Error seeding Plan journey data: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds Gamification data.
 * 
 * @param tx - The transaction client
 * @param config - Seeding configuration
 */
async function seedGamificationData(
  tx: PrismaClient,
  config: SeedConfig
): Promise<void> {
  try {
    // Sample achievement types
    const achievementTypes = [
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
    
    logger.log(`Creating ${achievementTypes.length} achievement types...`);
    for (const achievement of achievementTypes) {
      try {
        await tx.achievementType.upsert({
          where: { name: achievement.name },
          update: {},
          create: achievement,
        });
      } catch (error) {
        if (error.code === 'P2002') {
          logger.debug(`Achievement type ${achievement.name} already exists, skipping...`);
        } else {
          throw new BusinessRuleViolationError(
            `Failed to create achievement type ${achievement.name}`,
            { cause: error, context: { achievement } }
          );
        }
      }
    }
    
    // Add additional development data if in development mode
    if (config.developmentMode) {
      logger.log('Creating additional gamification development data...');
      
      // Sample reward types
      const rewardTypes = [
        { 
          name: 'discount-consultation', 
          title: 'Desconto em Consulta', 
          description: 'Desconto de 10% em consultas médicas',
          pointsCost: 100,
          journey: 'care',
          icon: 'stethoscope',
        },
        { 
          name: 'free-delivery', 
          title: 'Entrega Grátis de Medicamentos', 
          description: 'Entrega gratuita de medicamentos',
          pointsCost: 50,
          journey: 'care',
          icon: 'truck',
        },
        { 
          name: 'premium-content', 
          title: 'Conteúdo Premium', 
          description: 'Acesso a conteúdo exclusivo sobre saúde',
          pointsCost: 30,
          journey: 'health',
          icon: 'book-open',
        },
        { 
          name: 'priority-scheduling', 
          title: 'Agendamento Prioritário', 
          description: 'Prioridade no agendamento de consultas',
          pointsCost: 150,
          journey: 'care',
          icon: 'calendar-star',
        },
        { 
          name: 'claim-fast-track', 
          title: 'Reembolso Expresso', 
          description: 'Processamento prioritário de reembolsos',
          pointsCost: 200,
          journey: 'plan',
          icon: 'bolt',
        },
      ];
      
      logger.log(`Creating ${rewardTypes.length} reward types...`);
      for (const reward of rewardTypes) {
        try {
          await tx.rewardType.upsert({
            where: { name: reward.name },
            update: {},
            create: reward,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            logger.debug(`Reward type ${reward.name} already exists, skipping...`);
          } else {
            throw new BusinessRuleViolationError(
              `Failed to create reward type ${reward.name}`,
              { cause: error, context: { reward } }
            );
          }
        }
      }
      
      // Sample quest types
      const questTypes = [
        { 
          name: 'health-check-week', 
          title: 'Semana da Saúde', 
          description: 'Registre suas métricas de saúde todos os dias por uma semana',
          pointsReward: 50,
          journey: 'health',
          icon: 'calendar-heart',
          durationDays: 7,
        },
        { 
          name: 'medication-month', 
          title: 'Mês da Medicação', 
          description: 'Registre a tomada de medicamentos por 30 dias consecutivos',
          pointsReward: 100,
          journey: 'care',
          icon: 'calendar-pill',
          durationDays: 30,
        },
        { 
          name: 'complete-profile', 
          title: 'Perfil Completo', 
          description: 'Complete todas as informações do seu perfil de saúde',
          pointsReward: 30,
          journey: 'health',
          icon: 'user-check',
          durationDays: null,
        },
      ];
      
      logger.log(`Creating ${questTypes.length} quest types...`);
      for (const quest of questTypes) {
        try {
          await tx.questType.upsert({
            where: { name: quest.name },
            update: {},
            create: quest,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            logger.debug(`Quest type ${quest.name} already exists, skipping...`);
          } else {
            throw new BusinessRuleViolationError(
              `Failed to create quest type ${quest.name}`,
              { cause: error, context: { quest } }
            );
          }
        }
      }
    }
    
    logger.log('Gamification data seeded successfully');
  } catch (error) {
    logger.error(`Error seeding Gamification data: ${error.message}`, error.stack);
    throw error;
  }
}

// Run the seed function
seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });