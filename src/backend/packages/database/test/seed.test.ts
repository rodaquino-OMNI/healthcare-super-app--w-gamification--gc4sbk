import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../src/connection/prisma.service';
import { TransactionService } from '../src/transactions/transaction.service';
import { TransactionIsolationLevel } from '../src/transactions/transaction.interface';
import {
  createHealthMetricFactory,
  createDeviceConnectionFactory,
  createHealthGoalFactory,
  createAppointmentFactory,
  createProviderFactory,
  createMedicationFactory,
  createInsurancePlanFactory,
  createClaimFactory,
  createBenefitFactory,
  createAchievementFactory,
  createRewardFactory,
  createUserFactory,
  createRoleFactory,
  createPermissionFactory
} from './utils/factory.utils';
import { setupTestDatabase, teardownTestDatabase } from './utils/database-test.utils';

/**
 * Configuration options for test database seeding
 */
export interface TestSeedOptions {
  /**
   * Unique identifier for the test suite to ensure isolation
   * @default Random UUID
   */
  testSuiteId?: string;
  
  /**
   * Controls the volume of data to generate
   * @default 'minimal'
   */
  volume?: 'minimal' | 'moderate' | 'large';
  
  /**
   * Specific journeys to seed data for
   * @default ['health', 'care', 'plan', 'gamification']
   */
  journeys?: Array<'health' | 'care' | 'plan' | 'gamification'>;
  
  /**
   * Whether to clean the database before seeding
   * @default true
   */
  cleanBeforeSeeding?: boolean;
  
  /**
   * Whether to use transactions for seeding (recommended for test isolation)
   * @default true
   */
  useTransactions?: boolean;
  
  /**
   * Custom Prisma client to use (useful for transaction contexts)
   * @default new PrismaClient()
   */
  prismaClient?: PrismaClient;
  
  /**
   * Whether to log seeding operations
   * @default false
   */
  verbose?: boolean;
}

/**
 * Default test seed options
 */
const defaultTestSeedOptions: TestSeedOptions = {
  testSuiteId: uuidv4(),
  volume: 'minimal',
  journeys: ['health', 'care', 'plan', 'gamification'],
  cleanBeforeSeeding: true,
  useTransactions: true,
  verbose: false
};

/**
 * Data volume configurations for different entity types
 */
const volumeConfigs = {
  minimal: {
    users: 2,
    healthMetrics: 5,
    devices: 1,
    goals: 2,
    appointments: 3,
    providers: 2,
    medications: 3,
    plans: 1,
    claims: 2,
    benefits: 3,
    achievements: 2,
    rewards: 2
  },
  moderate: {
    users: 10,
    healthMetrics: 50,
    devices: 5,
    goals: 10,
    appointments: 20,
    providers: 15,
    medications: 25,
    plans: 5,
    claims: 15,
    benefits: 20,
    achievements: 15,
    rewards: 10
  },
  large: {
    users: 50,
    healthMetrics: 500,
    devices: 20,
    goals: 50,
    appointments: 100,
    providers: 75,
    medications: 150,
    plans: 20,
    claims: 100,
    benefits: 150,
    achievements: 50,
    rewards: 40
  }
};

/**
 * Main function to seed a test database with configurable options
 * 
 * @param options - Configuration options for test database seeding
 * @returns A promise that resolves when the database is seeded
 */
export async function seedTestDatabase(options: TestSeedOptions = {}): Promise<void> {
  // Merge provided options with defaults
  const config = { ...defaultTestSeedOptions, ...options };
  
  // Log start of seeding if verbose
  if (config.verbose) {
    console.log(`Starting test database seeding with options:`, config);
  }
  
  // Create or use provided PrismaClient
  const prisma = config.prismaClient || new PrismaClient();
  // Create PrismaService for database operations
  const prismaService = new PrismaService();
  // Create TransactionService for transaction management
  const transactionService = new TransactionService(prismaService);
  
  try {
    // Set up test database if needed
    if (!config.prismaClient) {
      await setupTestDatabase(config.testSuiteId);
    }
    
    // Clean database if requested
    if (config.cleanBeforeSeeding) {
      if (config.verbose) console.log('Cleaning database before seeding...');
      await prismaService.cleanDatabase();
    }
    
    // Determine which seed function to use based on transaction preference
    if (config.useTransactions) {
      // Use transaction to ensure all-or-nothing seeding
      await transactionService.executeTransaction(
        async (tx) => {
          await seedTestData(tx as PrismaClient, config);
        },
        { isolationLevel: TransactionIsolationLevel.SERIALIZABLE }
      );
    } else {
      // Seed without transaction
      await seedTestData(prisma, config);
    }
    
    if (config.verbose) {
      console.log('Test database seeding completed successfully!');
    }
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  } finally {
    // Close the database connection if we created it
    if (!config.prismaClient) {
      await prisma.$disconnect();
    }
  }
}

/**
 * Seeds test data based on configuration
 * 
 * @param prisma - The Prisma client instance
 * @param config - Seeding configuration options
 */
async function seedTestData(prisma: PrismaClient, config: TestSeedOptions): Promise<void> {
  const { journeys, volume, verbose } = config;
  const volumeConfig = volumeConfigs[volume];
  
  // Always seed core data (permissions, roles, users)
  if (verbose) console.log('Seeding core data...');
  await seedCoreData(prisma, volumeConfig, config);
  
  // Seed journey-specific data based on configuration
  for (const journey of journeys) {
    if (verbose) console.log(`Seeding ${journey} journey data...`);
    
    switch (journey) {
      case 'health':
        await seedHealthJourneyData(prisma, volumeConfig, config);
        break;
      case 'care':
        await seedCareJourneyData(prisma, volumeConfig, config);
        break;
      case 'plan':
        await seedPlanJourneyData(prisma, volumeConfig, config);
        break;
      case 'gamification':
        await seedGamificationData(prisma, volumeConfig, config);
        break;
    }
  }
}

/**
 * Seeds core data (permissions, roles, users)
 * 
 * @param prisma - The Prisma client instance
 * @param volumeConfig - Configuration for data volume
 * @param options - Seeding configuration options
 */
async function seedCoreData(
  prisma: PrismaClient,
  volumeConfig: typeof volumeConfigs.minimal,
  options: TestSeedOptions
): Promise<void> {
  const { testSuiteId, verbose } = options;
  
  // Create permissions factory with test suite ID for isolation
  const createPermission = createPermissionFactory(testSuiteId);
  
  // Health journey permissions
  const healthPermissions = [
    createPermission({ name: 'health:metrics:read', description: 'View health metrics' }),
    createPermission({ name: 'health:metrics:write', description: 'Record health metrics' }),
    createPermission({ name: 'health:history:read', description: 'View medical history' }),
    createPermission({ name: 'health:history:write', description: 'Update medical history' }),
    createPermission({ name: 'health:goals:read', description: 'View health goals' }),
    createPermission({ name: 'health:goals:write', description: 'Set health goals' }),
    createPermission({ name: 'health:devices:read', description: 'View connected devices' }),
    createPermission({ name: 'health:devices:write', description: 'Manage device connections' }),
  ];
  
  // Care journey permissions
  const carePermissions = [
    createPermission({ name: 'care:appointments:read', description: 'View appointments' }),
    createPermission({ name: 'care:appointments:write', description: 'Manage appointments' }),
    createPermission({ name: 'care:telemedicine:read', description: 'View telemedicine sessions' }),
    createPermission({ name: 'care:telemedicine:write', description: 'Manage telemedicine sessions' }),
    createPermission({ name: 'care:medications:read', description: 'View medications' }),
    createPermission({ name: 'care:medications:write', description: 'Manage medications' }),
    createPermission({ name: 'care:treatments:read', description: 'View treatment plans' }),
    createPermission({ name: 'care:treatments:write', description: 'Manage treatment plans' }),
  ];
  
  // Plan journey permissions
  const planPermissions = [
    createPermission({ name: 'plan:coverage:read', description: 'View coverage information' }),
    createPermission({ name: 'plan:claims:read', description: 'View claims' }),
    createPermission({ name: 'plan:claims:write', description: 'Submit and manage claims' }),
    createPermission({ name: 'plan:benefits:read', description: 'View benefits' }),
    createPermission({ name: 'plan:documents:read', description: 'View insurance documents' }),
    createPermission({ name: 'plan:documents:write', description: 'Upload insurance documents' }),
    createPermission({ name: 'plan:payments:read', description: 'View payment information' }),
    createPermission({ name: 'plan:simulator:use', description: 'Use cost simulator' }),
  ];
  
  // Gamification permissions
  const gamificationPermissions = [
    createPermission({ name: 'game:achievements:read', description: 'View achievements' }),
    createPermission({ name: 'game:progress:read', description: 'View progress' }),
    createPermission({ name: 'game:rewards:read', description: 'View rewards' }),
    createPermission({ name: 'game:rewards:redeem', description: 'Redeem rewards' }),
    createPermission({ name: 'game:leaderboard:read', description: 'View leaderboards' }),
  ];
  
  const allPermissions = [
    ...healthPermissions,
    ...carePermissions,
    ...planPermissions,
    ...gamificationPermissions,
  ];
  
  // Create all permissions in the database
  if (verbose) console.log(`Creating ${allPermissions.length} permissions...`);
  for (const permission of allPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  
  // Create roles factory with test suite ID for isolation
  const createRole = createRoleFactory(testSuiteId);
  
  // Define roles with their permissions
  const roles = [
    createRole({
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
    }),
    createRole({
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
    }),
    createRole({
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
    }),
    createRole({
      name: 'Administrator',
      description: 'System administrator with full access',
      isDefault: false,
      journey: null,
      permissions: allPermissions.map(p => p.name),
    }),
  ];
  
  // Create roles and assign permissions
  if (verbose) console.log(`Creating ${roles.length} roles...`);
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
      const permissionsToConnect = await prisma.permission.findMany({
        where: {
          name: {
            in: permissionNames,
          },
        },
      });
      
      // Connect permissions to the role
      if (permissionsToConnect.length > 0) {
        await prisma.role.update({
          where: { id: createdRole.id },
          data: {
            permissions: {
              connect: permissionsToConnect.map(p => ({ id: p.id })),
            },
          },
        });
      }
      
      if (verbose) {
        console.log(`Created role: ${roleData.name} with ${permissionsToConnect.length} permissions`);
      }
    } catch (error) {
      console.error(`Error creating role: ${error.message}`);
      throw error;
    }
  }
  
  // Create users factory with test suite ID for isolation
  const createUser = createUserFactory(testSuiteId);
  
  // Create admin user
  const adminPassword = await bcrypt.hash('Password123!', 10);
  const adminUser = await prisma.user.create({
    data: createUser({
      name: 'Test Admin',
      email: `admin-${testSuiteId}@test.austa.com.br`,
      password: adminPassword,
      phone: '+5511999999999',
      cpf: '12345678901',
    }),
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
    if (verbose) console.log(`Created admin user: ${adminUser.email} with Administrator role`);
  }
  
  // Create regular test user
  const userPassword = await bcrypt.hash('Password123!', 10);
  const testUser = await prisma.user.create({
    data: createUser({
      name: 'Test User',
      email: `user-${testSuiteId}@test.austa.com.br`,
      password: userPassword,
      phone: '+5511888888888',
      cpf: '98765432109',
    }),
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
    if (verbose) console.log(`Created test user: ${testUser.email} with ${userRole.name} role`);
  }
  
  // Create additional users based on volume configuration
  if (volumeConfig.users > 2) {
    if (verbose) console.log(`Creating ${volumeConfig.users - 2} additional users...`);
    
    for (let i = 0; i < volumeConfig.users - 2; i++) {
      const password = await bcrypt.hash('Password123!', 10);
      const user = await prisma.user.create({
        data: createUser({
          name: `Test User ${i + 1}`,
          email: `user-${i + 1}-${testSuiteId}@test.austa.com.br`,
          password,
          phone: `+55118888${i.toString().padStart(5, '0')}`,
          cpf: `${(9876543210 - i).toString().padStart(11, '0')}`,
        }),
      });
      
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
    }
  }
}

/**
 * Seeds Health journey data
 * 
 * @param prisma - The Prisma client instance
 * @param volumeConfig - Configuration for data volume
 * @param options - Seeding configuration options
 */
async function seedHealthJourneyData(
  prisma: PrismaClient,
  volumeConfig: typeof volumeConfigs.minimal,
  options: TestSeedOptions
): Promise<void> {
  const { testSuiteId, verbose } = options;
  
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
    
    if (verbose) console.log(`Created ${metricTypes.length} health metric types`);
    
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
    
    if (verbose) console.log(`Created ${deviceTypes.length} device types`);
    
    // Get users to associate with health data
    const users = await prisma.user.findMany({
      take: Math.min(volumeConfig.users, 10), // Limit to 10 users max for health data
    });
    
    if (users.length === 0) {
      throw new Error('No users found to associate with health data');
    }
    
    // Create health metrics factory
    const createHealthMetric = createHealthMetricFactory(testSuiteId);
    
    // Create health metrics for each user
    if (verbose) console.log(`Creating health metrics for ${users.length} users...`);
    
    const metricsPerUser = Math.ceil(volumeConfig.healthMetrics / users.length);
    const metricTypeIds = await prisma.healthMetricType.findMany().then(types => types.map(t => t.id));
    
    for (const user of users) {
      // Create metrics with different dates over the past 30 days
      for (let i = 0; i < metricsPerUser; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        // Randomly select a metric type
        const metricTypeId = metricTypeIds[Math.floor(Math.random() * metricTypeIds.length)];
        
        await prisma.healthMetric.create({
          data: createHealthMetric({
            userId: user.id,
            healthMetricTypeId: metricTypeId,
            value: (Math.random() * 100).toFixed(1),
            recordedAt: date,
          }),
        });
      }
    }
    
    // Create device connections
    const createDeviceConnection = createDeviceConnectionFactory(testSuiteId);
    const deviceTypeIds = await prisma.deviceType.findMany().then(types => types.map(t => t.id));
    
    if (verbose) console.log(`Creating device connections...`);
    
    // Create device connections for users
    const devicesPerUser = Math.ceil(volumeConfig.devices / users.length);
    
    for (const user of users) {
      for (let i = 0; i < devicesPerUser; i++) {
        // Randomly select a device type
        const deviceTypeId = deviceTypeIds[Math.floor(Math.random() * deviceTypeIds.length)];
        
        await prisma.deviceConnection.create({
          data: createDeviceConnection({
            userId: user.id,
            deviceTypeId,
            deviceIdentifier: `device-${testSuiteId}-${i}`,
            lastSyncedAt: new Date(),
            isActive: Math.random() > 0.2, // 80% chance of being active
          }),
        });
      }
    }
    
    // Create health goals
    const createHealthGoal = createHealthGoalFactory(testSuiteId);
    
    if (verbose) console.log(`Creating health goals...`);
    
    const goalsPerUser = Math.ceil(volumeConfig.goals / users.length);
    
    for (const user of users) {
      for (let i = 0; i < goalsPerUser; i++) {
        // Randomly select a metric type
        const metricTypeId = metricTypeIds[Math.floor(Math.random() * metricTypeIds.length)];
        
        // Create a goal with a target date in the future
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + Math.floor(Math.random() * 90) + 30); // 30-120 days in future
        
        await prisma.healthGoal.create({
          data: createHealthGoal({
            userId: user.id,
            healthMetricTypeId: metricTypeId,
            targetValue: (Math.random() * 100).toFixed(1),
            startValue: (Math.random() * 50).toFixed(1),
            startDate: new Date(),
            targetDate,
            status: Math.random() > 0.7 ? 'IN_PROGRESS' : 'NOT_STARTED', // 70% in progress
          }),
        });
      }
    }
  } catch (error) {
    console.error(`Error seeding health journey data: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds Care journey data
 * 
 * @param prisma - The Prisma client instance
 * @param volumeConfig - Configuration for data volume
 * @param options - Seeding configuration options
 */
async function seedCareJourneyData(
  prisma: PrismaClient,
  volumeConfig: typeof volumeConfigs.minimal,
  options: TestSeedOptions
): Promise<void> {
  const { testSuiteId, verbose } = options;
  
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
    
    if (verbose) console.log(`Created ${specialties.length} provider specialties`);
    
    // Get specialty IDs for later use
    const specialtyIds = await prisma.providerSpecialty.findMany().then(specs => specs.map(s => s.id));
    
    // Create providers
    const createProvider = createProviderFactory(testSuiteId);
    
    if (verbose) console.log(`Creating ${volumeConfig.providers} healthcare providers...`);
    
    for (let i = 0; i < volumeConfig.providers; i++) {
      // Randomly select a specialty
      const specialtyId = specialtyIds[Math.floor(Math.random() * specialtyIds.length)];
      
      const provider = await prisma.provider.create({
        data: createProvider({
          name: `Dr. Test Provider ${i + 1}`,
          email: `provider-${i + 1}-${testSuiteId}@test.austa.com.br`,
          phone: `+55119999${i.toString().padStart(5, '0')}`,
          crm: `${(10000 + i).toString()}`,
          specialtyId,
          isActive: Math.random() > 0.1, // 90% chance of being active
        }),
      });
    }
    
    // Get users to associate with care data
    const users = await prisma.user.findMany({
      take: Math.min(volumeConfig.users, 10), // Limit to 10 users max for care data
    });
    
    if (users.length === 0) {
      throw new Error('No users found to associate with care data');
    }
    
    // Get providers for appointments
    const providers = await prisma.provider.findMany();
    
    if (providers.length === 0) {
      throw new Error('No providers found for appointments');
    }
    
    // Create appointments
    const createAppointment = createAppointmentFactory(testSuiteId);
    
    if (verbose) console.log(`Creating appointments...`);
    
    const appointmentsPerUser = Math.ceil(volumeConfig.appointments / users.length);
    
    for (const user of users) {
      for (let i = 0; i < appointmentsPerUser; i++) {
        // Randomly select a provider
        const provider = providers[Math.floor(Math.random() * providers.length)];
        
        // Create appointment dates (past, present, future)
        let appointmentDate = new Date();
        const appointmentType = Math.floor(Math.random() * 3);
        
        if (appointmentType === 0) {
          // Past appointment (1-30 days ago)
          appointmentDate.setDate(appointmentDate.getDate() - Math.floor(Math.random() * 30) - 1);
        } else if (appointmentType === 1) {
          // Future appointment (1-30 days in future)
          appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30) + 1);
        } else {
          // Today's appointment
          appointmentDate.setHours(9 + Math.floor(Math.random() * 8)); // Between 9 AM and 5 PM
        }
        
        // Determine status based on date
        let status = 'SCHEDULED';
        if (appointmentDate < new Date()) {
          status = Math.random() > 0.2 ? 'COMPLETED' : 'MISSED'; // 80% completed, 20% missed
        }
        
        await prisma.appointment.create({
          data: createAppointment({
            userId: user.id,
            providerId: provider.id,
            scheduledAt: appointmentDate,
            duration: 30, // 30 minutes
            status,
            notes: status === 'COMPLETED' ? 'Test appointment notes' : null,
            type: Math.random() > 0.3 ? 'IN_PERSON' : 'TELEMEDICINE', // 70% in-person, 30% telemedicine
          }),
        });
      }
    }
    
    // Create medications
    const createMedication = createMedicationFactory(testSuiteId);
    
    if (verbose) console.log(`Creating medications...`);
    
    const medicationsPerUser = Math.ceil(volumeConfig.medications / users.length);
    
    for (const user of users) {
      for (let i = 0; i < medicationsPerUser; i++) {
        // Create start and end dates
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // Started 0-30 days ago
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 90) + 30); // 30-120 days duration
        
        // Randomly select a provider
        const provider = providers[Math.floor(Math.random() * providers.length)];
        
        await prisma.medication.create({
          data: createMedication({
            userId: user.id,
            name: `Test Medication ${i + 1}`,
            dosage: `${Math.floor(Math.random() * 500) + 100}mg`,
            frequency: `${Math.floor(Math.random() * 3) + 1}x daily`,
            startDate,
            endDate,
            instructions: 'Take with food',
            prescribedById: provider.id,
            isActive: new Date() < endDate, // Active if end date is in the future
          }),
        });
      }
    }
  } catch (error) {
    console.error(`Error seeding care journey data: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds Plan journey data
 * 
 * @param prisma - The Prisma client instance
 * @param volumeConfig - Configuration for data volume
 * @param options - Seeding configuration options
 */
async function seedPlanJourneyData(
  prisma: PrismaClient,
  volumeConfig: typeof volumeConfigs.minimal,
  options: TestSeedOptions
): Promise<void> {
  const { testSuiteId, verbose } = options;
  
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
    
    if (verbose) console.log(`Created ${planTypes.length} insurance plan types`);
    
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
    
    if (verbose) console.log(`Created ${claimTypes.length} claim types`);
    
    // Get users to associate with plan data
    const users = await prisma.user.findMany({
      take: Math.min(volumeConfig.users, 10), // Limit to 10 users max for plan data
    });
    
    if (users.length === 0) {
      throw new Error('No users found to associate with plan data');
    }
    
    // Get plan type IDs
    const planTypeIds = await prisma.insurancePlanType.findMany().then(types => types.map(t => t.id));
    
    // Create insurance plans
    const createInsurancePlan = createInsurancePlanFactory(testSuiteId);
    
    if (verbose) console.log(`Creating insurance plans...`);
    
    const plansPerUser = Math.ceil(volumeConfig.plans / users.length);
    
    for (const user of users) {
      for (let i = 0; i < plansPerUser; i++) {
        // Randomly select a plan type
        const planTypeId = planTypeIds[Math.floor(Math.random() * planTypeIds.length)];
        
        // Create start and end dates
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1); // Started 1 year ago
        
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 2); // 2 year duration
        
        await prisma.insurancePlan.create({
          data: createInsurancePlan({
            userId: user.id,
            planTypeId,
            policyNumber: `POL-${testSuiteId}-${i + 1}`,
            startDate,
            endDate,
            isActive: true,
            monthlyPremium: (Math.random() * 500 + 100).toFixed(2),
          }),
        });
      }
    }
    
    // Get insurance plans
    const plans = await prisma.insurancePlan.findMany();
    
    // Create benefits
    const createBenefit = createBenefitFactory(testSuiteId);
    
    if (verbose) console.log(`Creating benefits...`);
    
    const benefitsPerPlan = Math.ceil(volumeConfig.benefits / plans.length);
    
    for (const plan of plans) {
      for (let i = 0; i < benefitsPerPlan; i++) {
        await prisma.benefit.create({
          data: createBenefit({
            insurancePlanId: plan.id,
            name: `Test Benefit ${i + 1}`,
            description: `Description for test benefit ${i + 1}`,
            coveragePercentage: Math.floor(Math.random() * 50) + 50, // 50-100%
            annualLimit: Math.random() > 0.3 ? (Math.random() * 10000 + 1000).toFixed(2) : null, // 70% have limit
            waitingPeriod: Math.floor(Math.random() * 6), // 0-6 months
          }),
        });
      }
    }
    
    // Get claim type IDs
    const claimTypeIds = await prisma.claimType.findMany().then(types => types.map(t => t.id));
    
    // Create claims
    const createClaim = createClaimFactory(testSuiteId);
    
    if (verbose) console.log(`Creating claims...`);
    
    const claimsPerPlan = Math.ceil(volumeConfig.claims / plans.length);
    
    for (const plan of plans) {
      for (let i = 0; i < claimsPerPlan; i++) {
        // Randomly select a claim type
        const claimTypeId = claimTypeIds[Math.floor(Math.random() * claimTypeIds.length)];
        
        // Create claim date (past 6 months)
        const claimDate = new Date();
        claimDate.setMonth(claimDate.getMonth() - Math.floor(Math.random() * 6));
        
        // Determine status randomly
        const statusOptions = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID'];
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        await prisma.claim.create({
          data: createClaim({
            insurancePlanId: plan.id,
            claimTypeId,
            claimDate,
            submissionDate: new Date(claimDate.getTime() + 1000 * 60 * 60 * 24 * 3), // 3 days after claim date
            amount: (Math.random() * 1000 + 100).toFixed(2),
            status,
            receiptNumber: `REC-${testSuiteId}-${i + 1}`,
            providerName: `Test Provider ${i + 1}`,
            notes: status === 'REJECTED' ? 'Missing documentation' : null,
          }),
        });
      }
    }
  } catch (error) {
    console.error(`Error seeding plan journey data: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds Gamification data
 * 
 * @param prisma - The Prisma client instance
 * @param volumeConfig - Configuration for data volume
 * @param options - Seeding configuration options
 */
async function seedGamificationData(
  prisma: PrismaClient,
  volumeConfig: typeof volumeConfigs.minimal,
  options: TestSeedOptions
): Promise<void> {
  const { testSuiteId, verbose } = options;
  
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
    
    if (verbose) console.log(`Created ${achievementTypes.length} achievement types`);
    
    // Get users to associate with gamification data
    const users = await prisma.user.findMany({
      take: Math.min(volumeConfig.users, 10), // Limit to 10 users max for gamification data
    });
    
    if (users.length === 0) {
      throw new Error('No users found to associate with gamification data');
    }
    
    // Get achievement type IDs
    const achievementTypeIds = await prisma.achievementType.findMany().then(types => types.map(t => t.id));
    
    // Create achievements
    const createAchievement = createAchievementFactory(testSuiteId);
    
    if (verbose) console.log(`Creating achievements...`);
    
    const achievementsPerUser = Math.ceil(volumeConfig.achievements / users.length);
    
    for (const user of users) {
      for (let i = 0; i < achievementsPerUser; i++) {
        // Randomly select an achievement type
        const achievementTypeId = achievementTypeIds[Math.floor(Math.random() * achievementTypeIds.length)];
        
        // Get the achievement type to determine level
        const achievementType = await prisma.achievementType.findUnique({
          where: { id: achievementTypeId },
        });
        
        if (!achievementType) continue;
        
        // Randomly select a level (1 to max levels)
        const level = Math.floor(Math.random() * achievementType.levels) + 1;
        
        // Create achievement date (past 6 months)
        const achievedAt = new Date();
        achievedAt.setMonth(achievedAt.getMonth() - Math.floor(Math.random() * 6));
        
        await prisma.achievement.create({
          data: createAchievement({
            userId: user.id,
            achievementTypeId,
            level,
            achievedAt,
            pointsAwarded: level * 100, // Points based on level
          }),
        });
      }
    }
    
    // Create rewards
    const createReward = createRewardFactory(testSuiteId);
    
    if (verbose) console.log(`Creating rewards...`);
    
    const rewardsPerUser = Math.ceil(volumeConfig.rewards / users.length);
    
    for (const user of users) {
      for (let i = 0; i < rewardsPerUser; i++) {
        // Create reward with random redemption status
        const isRedeemed = Math.random() > 0.5; // 50% chance of being redeemed
        
        let redeemedAt = null;
        if (isRedeemed) {
          redeemedAt = new Date();
          redeemedAt.setDate(redeemedAt.getDate() - Math.floor(Math.random() * 30)); // Redeemed in last 30 days
        }
        
        await prisma.reward.create({
          data: createReward({
            userId: user.id,
            name: `Test Reward ${i + 1}`,
            description: `Description for test reward ${i + 1}`,
            pointsCost: Math.floor(Math.random() * 500) + 100, // 100-600 points
            isRedeemed,
            redeemedAt,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year from now
            type: Math.random() > 0.5 ? 'DISCOUNT' : 'BENEFIT', // 50/50 split
          }),
        });
      }
    }
  } catch (error) {
    console.error(`Error seeding gamification data: ${error.message}`);
    throw error;
  }
}

/**
 * Cleans up test database resources
 * 
 * @param testSuiteId - The unique identifier for the test suite
 * @returns A promise that resolves when cleanup is complete
 */
export async function cleanupTestDatabase(testSuiteId: string): Promise<void> {
  try {
    await teardownTestDatabase(testSuiteId);
  } catch (error) {
    console.error(`Error cleaning up test database: ${error.message}`);
    throw error;
  }
}

/**
 * Resets a test database to a clean state
 * 
 * @param testSuiteId - The unique identifier for the test suite
 * @returns A promise that resolves when the database is reset
 */
export async function resetTestDatabase(testSuiteId: string): Promise<void> {
  const prismaService = new PrismaService();
  
  try {
    await prismaService.cleanDatabase();
  } catch (error) {
    console.error(`Error resetting test database: ${error.message}`);
    throw error;
  } finally {
    await prismaService.$disconnect();
  }
}

/**
 * Creates a minimal test database with just the essential data
 * 
 * @param testSuiteId - The unique identifier for the test suite
 * @returns A promise that resolves when the database is created
 */
export async function createMinimalTestDatabase(testSuiteId: string = uuidv4()): Promise<void> {
  return seedTestDatabase({
    testSuiteId,
    volume: 'minimal',
    cleanBeforeSeeding: true,
    useTransactions: true,
    verbose: false
  });
}

/**
 * Creates an isolated test database for a specific journey
 * 
 * @param journey - The journey to create data for
 * @param testSuiteId - The unique identifier for the test suite
 * @returns A promise that resolves when the database is created
 */
export async function createJourneyTestDatabase(
  journey: 'health' | 'care' | 'plan' | 'gamification',
  testSuiteId: string = uuidv4()
): Promise<void> {
  return seedTestDatabase({
    testSuiteId,
    volume: 'moderate',
    journeys: ['health', 'care', 'plan', 'gamification'].includes(journey) ? [journey] : ['health'],
    cleanBeforeSeeding: true,
    useTransactions: true,
    verbose: false
  });
}

/**
 * Creates a comprehensive test database with data for all journeys
 * 
 * @param testSuiteId - The unique identifier for the test suite
 * @returns A promise that resolves when the database is created
 */
export async function createComprehensiveTestDatabase(testSuiteId: string = uuidv4()): Promise<void> {
  return seedTestDatabase({
    testSuiteId,
    volume: 'large',
    journeys: ['health', 'care', 'plan', 'gamification'],
    cleanBeforeSeeding: true,
    useTransactions: true,
    verbose: false
  });
}

// Export all seed functions for use in tests
export {
  seedCoreData,
  seedHealthJourneyData,
  seedCareJourneyData,
  seedPlanJourneyData,
  seedGamificationData,
  seedTestData
};