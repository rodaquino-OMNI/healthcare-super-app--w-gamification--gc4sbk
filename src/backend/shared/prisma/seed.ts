import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@backend/shared/src/database/prisma.service';
import { Logger } from '@backend/packages/logging/src/logger';
import { ConfigService } from '@nestjs/config';
import { DatabaseError, SeedingError } from '@backend/packages/errors/src/categories';
import { JourneyContext } from '@backend/packages/database/src/contexts/journey.context';
import * as bcrypt from 'bcrypt';

// Import journey-specific seeders
import { seedHealthJourney } from './seeders/health.seeder';
import { seedCareJourney } from './seeders/care.seeder';
import { seedPlanJourney } from './seeders/plan.seeder';
import { seedGamificationJourney } from './seeders/gamification.seeder';

// Create a logger instance for the seeding process
const logger = new Logger('DatabaseSeeder');

// Load environment configuration
const config = new ConfigService();

/**
 * Configuration for the seeding process based on environment
 */
interface SeedConfig {
  cleanDatabase: boolean;
  seedUsers: boolean;
  seedPermissions: boolean;
  seedRoles: boolean;
  seedJourneys: {
    health: boolean;
    care: boolean;
    plan: boolean;
    gamification: boolean;
  };
  retryAttempts: number;
  retryDelay: number; // in milliseconds
}

/**
 * Get environment-specific seeding configuration
 */
function getSeedConfig(): SeedConfig {
  const environment = config.get('NODE_ENV', 'development');
  
  // Default configuration
  const defaultConfig: SeedConfig = {
    cleanDatabase: false,
    seedUsers: true,
    seedPermissions: true,
    seedRoles: true,
    seedJourneys: {
      health: true,
      care: true,
      plan: true,
      gamification: true,
    },
    retryAttempts: 3,
    retryDelay: 1000,
  };
  
  // Environment-specific overrides
  switch (environment) {
    case 'development':
      return {
        ...defaultConfig,
        cleanDatabase: true,
      };
    case 'test':
      return {
        ...defaultConfig,
        cleanDatabase: true,
      };
    case 'production':
      return {
        ...defaultConfig,
        cleanDatabase: false,
        // In production, we might want to be more selective about what we seed
        seedUsers: false, // Don't seed test users in production
        seedJourneys: {
          health: false,
          care: false,
          plan: false,
          gamification: true, // Only seed gamification data in production
        },
      };
    default:
      return defaultConfig;
  }
}

/**
 * Seeds the database with initial data using transactions for atomicity.
 * Implements retry logic for transient errors and proper error classification.
 * 
 * @returns A promise that resolves when the database is seeded.
 */
async function seed(): Promise<void> {
  logger.info('Starting database seeding process', { environment: config.get('NODE_ENV') });
  
  // Get environment-specific configuration
  const seedConfig = getSeedConfig();
  logger.debug('Loaded seed configuration', { config: seedConfig });
  
  // Create an instance of PrismaService for database operations
  const prismaService = new PrismaService();
  // Create a standard PrismaClient for data operations
  const prisma = new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });
  
  // Set up error listeners for Prisma client
  prisma.$on('error', (e) => {
    logger.error('Prisma client error', { error: e.message, target: e.target });
  });
  
  prisma.$on('warn', (e) => {
    logger.warn('Prisma client warning', { message: e.message, target: e.target });
  });
  
  try {
    // Clean the database if configured to do so
    if (seedConfig.cleanDatabase) {
      logger.info('Cleaning database before seeding');
      await prismaService.cleanDatabase();
    }
    
    // Use a transaction for the entire seeding process to ensure atomicity
    await prisma.$transaction(async (tx) => {
      logger.info('Starting database transaction for seeding');
      
      // Create permissions if configured
      if (seedConfig.seedPermissions) {
        logger.info('Seeding permissions');
        await seedPermissions(tx);
      }
      
      // Create roles if configured
      if (seedConfig.seedRoles) {
        logger.info('Seeding roles');
        await seedRoles(tx);
      }
      
      // Create users if configured
      if (seedConfig.seedUsers) {
        logger.info('Seeding users');
        await seedUsers(tx);
      }
      
      // Create journey-specific data if configured
      await seedJourneyData(tx, seedConfig.seedJourneys);
      
      logger.info('Database transaction completed successfully');
    }, {
      // Transaction options
      maxWait: 5000, // Maximum time to wait for a transaction slot
      timeout: 30000, // Maximum time for the transaction to complete
      isolationLevel: 'Serializable', // Highest isolation level for data consistency
    });
    
    logger.info('Database seeding completed successfully');
  } catch (error) {
    // Classify and handle the error appropriately
    if (error.code && error.code.startsWith('P')) {
      // Prisma-specific error
      const dbError = new DatabaseError(
        'Database error during seeding',
        {
          originalError: error,
          code: error.code,
          meta: error.meta,
        }
      );
      logger.error('Database error during seeding', {
        error: dbError,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      });
      throw dbError;
    } else {
      // General seeding error
      const seedError = new SeedingError(
        'Error during database seeding',
        {
          originalError: error,
          phase: error.phase || 'unknown',
        }
      );
      logger.error('Seeding process failed', {
        error: seedError,
        message: error.message,
        stack: error.stack,
      });
      throw seedError;
    }
  } finally {
    // Close the database connection
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
}

/**
 * Seeds permissions for all journeys with retry logic for transient errors.
 * 
 * @param prisma - The Prisma client instance (transaction context)
 */
async function seedPermissions(prisma: PrismaClient): Promise<void> {
  const seedConfig = getSeedConfig();
  
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
  
  // Create all permissions in the database with retry logic
  logger.info(`Creating ${allPermissions.length} permissions`);
  
  for (const permission of allPermissions) {
    let attempts = 0;
    let success = false;
    
    while (!success && attempts < seedConfig.retryAttempts) {
      try {
        attempts++;
        // Try to create the permission, ignore if it already exists
        await prisma.permission.upsert({
          where: { name: permission.name },
          update: {},
          create: permission,
        });
        success = true;
        logger.debug(`Created permission: ${permission.name}`);
      } catch (error) {
        // If creation fails due to unique constraint, just log and continue
        if (error.code === 'P2002') {
          logger.debug(`Permission ${permission.name} already exists, skipping`);
          success = true; // Consider this a success and move on
        } else if (attempts < seedConfig.retryAttempts) {
          // For transient errors, retry after delay
          logger.warn(`Error creating permission ${permission.name}, retrying (${attempts}/${seedConfig.retryAttempts})`, {
            error: error.message,
            code: error.code,
          });
          await new Promise(resolve => setTimeout(resolve, seedConfig.retryDelay));
        } else {
          // Max retries reached, throw a classified error
          const dbError = new DatabaseError(
            `Failed to create permission ${permission.name} after ${seedConfig.retryAttempts} attempts`,
            {
              originalError: error,
              code: error.code,
              meta: error.meta,
              entity: 'Permission',
              operation: 'upsert',
            }
          );
          logger.error('Permission creation failed', { error: dbError });
          throw dbError;
        }
      }
    }
  }
  
  logger.info(`Successfully created ${allPermissions.length} permissions`);
}

/**
 * Seeds roles and assigns permissions to them.
 * 
 * @param prisma - The Prisma client instance (transaction context)
 */
async function seedRoles(prisma: PrismaClient): Promise<void> {
  // Get all permissions
  const permissions = await prisma.permission.findMany();
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
  logger.info(`Creating ${roles.length} roles`);
  
  for (const role of roles) {
    try {
      const { permissions: permissionNames, ...roleData } = role;
      
      // Create the role
      const createdRole = await prisma.role.upsert({
        where: { name: roleData.name },
        update: roleData,
        create: roleData,
      });
      
      // Get valid permissions to connect
      const permissionConnections = [];
      for (const name of permissionNames) {
        const permission = permissionsByName.get(name);
        if (permission) {
          permissionConnections.push({ id: permission.id });
        } else {
          logger.warn(`Permission not found: ${name}`, { role: roleData.name });
        }
      }
      
      // Connect permissions to the role
      if (permissionConnections.length > 0) {
        await prisma.role.update({
          where: { id: createdRole.id },
          data: {
            permissions: {
              connect: permissionConnections,
            },
          },
        });
      }
      
      logger.info(`Created role: ${roleData.name} with ${permissionConnections.length} permissions`);
    } catch (error) {
      // Classify and handle the error
      const dbError = new DatabaseError(
        `Error creating role: ${role.name}`,
        {
          originalError: error,
          entity: 'Role',
          operation: 'upsert',
          data: { roleName: role.name },
        }
      );
      logger.error('Role creation failed', { error: dbError, stack: error.stack });
      throw dbError;
    }
  }
}

/**
 * Seeds default users with proper error handling.
 * 
 * @param prisma - The Prisma client instance (transaction context)
 */
async function seedUsers(prisma: PrismaClient): Promise<void> {
  try {
    logger.info('Creating default users');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('Password123!', 10);
    const adminUser = await prisma.user.upsert({
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
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Administrator' },
    });
    
    if (adminRole) {
      // Assign admin role to admin user
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          roles: {
            connect: { id: adminRole.id },
          },
        },
      });
      logger.info(`Created admin user: ${adminUser.email} with Administrator role`);
    } else {
      logger.warn('Administrator role not found, admin user created without role');
    }
    
    // Create regular test user
    const userPassword = await bcrypt.hash('Password123!', 10);
    const testUser = await prisma.user.upsert({
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
    const userRole = await prisma.role.findFirst({
      where: { isDefault: true },
    });
    
    if (userRole) {
      // Assign user role to test user
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          roles: {
            connect: { id: userRole.id },
          },
        },
      });
      logger.info(`Created test user: ${testUser.email} with ${userRole.name} role`);
    } else {
      logger.warn('Default user role not found, test user created without role');
    }
  } catch (error) {
    // Classify and handle the error
    const dbError = new DatabaseError(
      'Error creating users',
      {
        originalError: error,
        entity: 'User',
        operation: 'create',
      }
    );
    logger.error('User creation failed', { error: dbError, stack: error.stack });
    throw dbError;
  }
}

/**
 * Seeds journey-specific data using journey contexts for better separation.
 * 
 * @param prisma - The Prisma client instance (transaction context)
 * @param journeyConfig - Configuration specifying which journeys to seed
 */
async function seedJourneyData(
  prisma: PrismaClient,
  journeyConfig: { health: boolean; care: boolean; plan: boolean; gamification: boolean }
): Promise<void> {
  logger.info('Seeding journey-specific data', { journeys: journeyConfig });
  
  // Create journey contexts for better separation and organization
  const healthContext = new JourneyContext(prisma, 'health');
  const careContext = new JourneyContext(prisma, 'care');
  const planContext = new JourneyContext(prisma, 'plan');
  const gamificationContext = new JourneyContext(prisma, 'gamification');
  
  try {
    // Health Journey sample data
    if (journeyConfig.health) {
      logger.info('Seeding Health journey data');
      await seedHealthJourney(healthContext);
    }
    
    // Care Journey sample data
    if (journeyConfig.care) {
      logger.info('Seeding Care journey data');
      await seedCareJourney(careContext);
    }
    
    // Plan Journey sample data
    if (journeyConfig.plan) {
      logger.info('Seeding Plan journey data');
      await seedPlanJourney(planContext);
    }
    
    // Gamification sample data
    if (journeyConfig.gamification) {
      logger.info('Seeding Gamification journey data');
      await seedGamificationJourney(gamificationContext);
    }
    
    logger.info('Successfully seeded all journey data');
  } catch (error) {
    // Classify the error based on which journey failed
    let journey = 'unknown';
    if (error.context && error.context.journey) {
      journey = error.context.journey;
    } else if (error.message && error.message.toLowerCase().includes('health')) {
      journey = 'health';
    } else if (error.message && error.message.toLowerCase().includes('care')) {
      journey = 'care';
    } else if (error.message && error.message.toLowerCase().includes('plan')) {
      journey = 'plan';
    } else if (error.message && error.message.toLowerCase().includes('gamification')) {
      journey = 'gamification';
    }
    
    const seedError = new SeedingError(
      `Error seeding ${journey} journey data`,
      {
        originalError: error,
        journey,
        phase: 'journey-seeding',
      }
    );
    
    logger.error(`Failed to seed ${journey} journey data`, {
      error: seedError,
      stack: error.stack,
    });
    
    throw seedError;
  }
}

/**
 * Fallback implementation for health journey seeding if the module is not available.
 * This will be replaced by the actual implementation in health.seeder.ts
 */
async function seedHealthJourney(context: JourneyContext): Promise<void> {
  const prisma = context.getPrismaClient();
  
  try {
    // Sample health metrics types
    const metricTypes = [
      { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
      { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
      { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
      { name: 'STEPS', unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
      { name: 'WEIGHT', unit: 'kg', normalRangeMin: null, normalRangeMax: null },
      { name: 'SLEEP', unit: 'hours', normalRangeMin: 7, normalRangeMax: 9 },
    ];

    for (const metricType of metricTypes) {
      await prisma.healthMetricType.upsert({
        where: { name: metricType.name },
        update: {},
        create: metricType,
      });
    }
    
    logger.info(`Created ${metricTypes.length} health metric types`);
    
    // Sample device types
    const deviceTypes = [
      { name: 'Smartwatch', description: 'Wearable smartwatch device', manufacturer: 'Various' },
      { name: 'Blood Pressure Monitor', description: 'Blood pressure monitoring device', manufacturer: 'Various' },
      { name: 'Glucose Monitor', description: 'Blood glucose monitoring device', manufacturer: 'Various' },
      { name: 'Smart Scale', description: 'Weight and body composition scale', manufacturer: 'Various' },
    ];
    
    for (const deviceType of deviceTypes) {
      await prisma.deviceType.upsert({
        where: { name: deviceType.name },
        update: {},
        create: deviceType,
      });
    }
    
    logger.info(`Created ${deviceTypes.length} device types`);
  } catch (error) {
    throw new SeedingError('Error seeding health journey data', {
      originalError: error,
      journey: 'health',
      phase: 'health-seeding',
    });
  }
}

/**
 * Fallback implementation for care journey seeding if the module is not available.
 * This will be replaced by the actual implementation in care.seeder.ts
 */
async function seedCareJourney(context: JourneyContext): Promise<void> {
  const prisma = context.getPrismaClient();
  
  try {
    // Sample provider specialties
    const specialties = [
      { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
      { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
      { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
      { name: 'Pediatria', description: 'Especialista em saúde infantil' },
      { name: 'Psiquiatria', description: 'Especialista em saúde mental' },
    ];
    
    for (const specialty of specialties) {
      await prisma.providerSpecialty.upsert({
        where: { name: specialty.name },
        update: {},
        create: specialty,
      });
    }
    
    logger.info(`Created ${specialties.length} provider specialties`);
  } catch (error) {
    throw new SeedingError('Error seeding care journey data', {
      originalError: error,
      journey: 'care',
      phase: 'care-seeding',
    });
  }
}

/**
 * Fallback implementation for plan journey seeding if the module is not available.
 * This will be replaced by the actual implementation in plan.seeder.ts
 */
async function seedPlanJourney(context: JourneyContext): Promise<void> {
  const prisma = context.getPrismaClient();
  
  try {
    // Sample plan types
    const planTypes = [
      { name: 'Básico', description: 'Plano com cobertura básica' },
      { name: 'Standard', description: 'Plano com cobertura intermediária' },
      { name: 'Premium', description: 'Plano com cobertura ampla' },
    ];
    
    for (const planType of planTypes) {
      await prisma.insurancePlanType.upsert({
        where: { name: planType.name },
        update: {},
        create: planType,
      });
    }
    
    logger.info(`Created ${planTypes.length} insurance plan types`);
    
    // Sample claim types
    const claimTypes = [
      { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
      { name: 'Exame', description: 'Reembolso para exames médicos' },
      { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
      { name: 'Internação', description: 'Reembolso para internação hospitalar' },
      { name: 'Medicamento', description: 'Reembolso para medicamentos prescritos' },
    ];
    
    for (const claimType of claimTypes) {
      await prisma.claimType.upsert({
        where: { name: claimType.name },
        update: {},
        create: claimType,
      });
    }
    
    logger.info(`Created ${claimTypes.length} claim types`);
  } catch (error) {
    throw new SeedingError('Error seeding plan journey data', {
      originalError: error,
      journey: 'plan',
      phase: 'plan-seeding',
    });
  }
}

/**
 * Fallback implementation for gamification journey seeding if the module is not available.
 * This will be replaced by the actual implementation in gamification.seeder.ts
 */
async function seedGamificationJourney(context: JourneyContext): Promise<void> {
  const prisma = context.getPrismaClient();
  
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
    
    for (const achievement of achievementTypes) {
      await prisma.achievementType.upsert({
        where: { name: achievement.name },
        update: {},
        create: achievement,
      });
    }
    
    logger.info(`Created ${achievementTypes.length} achievement types`);
  } catch (error) {
    throw new SeedingError('Error seeding gamification data', {
      originalError: error,
      journey: 'gamification',
      phase: 'gamification-seeding',
    });
  }
}

/**
 * Main execution function with proper error handling
 */
function main() {
  seed()
    .then(() => {
      logger.info('Database seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Database seeding failed', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });
}

// Run the main function
main();