import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * Configuration options for test database seeding
 */
export interface TestSeedOptions {
  /**
   * The volume of test data to generate
   * - 'small': Minimal data for basic tests (default)
   * - 'medium': Moderate amount of data for more complex tests
   * - 'large': Large dataset for performance testing
   */
  dataVolume?: 'small' | 'medium' | 'large';
  
  /**
   * Whether to isolate this test run from others
   * When true, generates unique identifiers for test data
   */
  isolate?: boolean;
  
  /**
   * Specific journeys to seed
   * If not provided, all journeys will be seeded
   */
  journeys?: ('health' | 'care' | 'plan' | 'gamification')[];
  
  /**
   * Test-specific prefix for data isolation
   * Automatically generated if isolate is true and no prefix is provided
   */
  testPrefix?: string;
  
  /**
   * Whether to log seeding operations
   */
  logging?: boolean;
}

/**
 * Default seed options
 */
const defaultSeedOptions: TestSeedOptions = {
  dataVolume: 'small',
  isolate: true,
  journeys: ['health', 'care', 'plan', 'gamification'],
  logging: false
};

/**
 * Seeds the test database with configurable test data.
 * 
 * @param options - Configuration options for test seeding
 * @returns A promise that resolves when the database is seeded
 */
export async function seedTestDatabase(options: TestSeedOptions = {}): Promise<void> {
  // Merge provided options with defaults
  const seedOptions = { ...defaultSeedOptions, ...options };
  
  // Generate a test prefix if isolation is enabled and no prefix is provided
  if (seedOptions.isolate && !seedOptions.testPrefix) {
    seedOptions.testPrefix = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  
  // Create an instance of PrismaService for database operations
  const prismaService = new PrismaService();
  // Create a standard PrismaClient for data operations
  const prisma = new PrismaClient();
  
  try {
    if (seedOptions.logging) {
      console.log(`Starting test database seeding with options:`, seedOptions);
    }
    
    // Clean the database first to ensure a consistent state
    if (seedOptions.logging) {
      console.log('Cleaning test database...');
    }
    await cleanTestDatabase(prismaService, seedOptions);
    
    // Create permissions
    if (seedOptions.logging) {
      console.log('Creating test permissions...');
    }
    await seedTestPermissions(prisma, seedOptions);
    
    // Create roles
    if (seedOptions.logging) {
      console.log('Creating test roles...');
    }
    await seedTestRoles(prisma, seedOptions);
    
    // Create users
    if (seedOptions.logging) {
      console.log('Creating test users...');
    }
    await seedTestUsers(prisma, seedOptions);
    
    // Create journey-specific data
    if (seedOptions.logging) {
      console.log(`Creating journey-specific test data for: ${seedOptions.journeys.join(', ')}`);
    }
    await seedTestJourneyData(prisma, seedOptions);
    
    if (seedOptions.logging) {
      console.log('Test database seeding completed successfully!');
    }
    
    return;
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  } finally {
    // Close the database connection
    await prisma.$disconnect();
  }
}

/**
 * Cleans the test database to ensure a consistent state for tests.
 * 
 * @param prismaService - The PrismaService instance
 * @param options - Test seed options
 */
async function cleanTestDatabase(prismaService: PrismaService, options: TestSeedOptions): Promise<void> {
  try {
    // If isolation is enabled, only clean data with the test prefix
    if (options.isolate && options.testPrefix) {
      // Clean only data with the specific test prefix
      // This is a simplified approach - in a real implementation, you would need
      // to delete data based on the prefix in a more sophisticated way
      await prismaService.cleanDatabaseByPrefix(options.testPrefix);
    } else {
      // Clean all test data
      await prismaService.cleanDatabase();
    }
  } catch (error) {
    console.error('Error cleaning test database:', error);
    throw error;
  }
}

/**
 * Seeds test permissions for all journeys.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedTestPermissions(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Health journey permissions
  const healthPermissions = [
    { name: prefixTestData('health:metrics:read', options), description: 'View health metrics' },
    { name: prefixTestData('health:metrics:write', options), description: 'Record health metrics' },
    { name: prefixTestData('health:history:read', options), description: 'View medical history' },
    { name: prefixTestData('health:history:write', options), description: 'Update medical history' },
    { name: prefixTestData('health:goals:read', options), description: 'View health goals' },
    { name: prefixTestData('health:goals:write', options), description: 'Set health goals' },
    { name: prefixTestData('health:devices:read', options), description: 'View connected devices' },
    { name: prefixTestData('health:devices:write', options), description: 'Manage device connections' },
  ];
  
  // Care journey permissions
  const carePermissions = [
    { name: prefixTestData('care:appointments:read', options), description: 'View appointments' },
    { name: prefixTestData('care:appointments:write', options), description: 'Manage appointments' },
    { name: prefixTestData('care:telemedicine:read', options), description: 'View telemedicine sessions' },
    { name: prefixTestData('care:telemedicine:write', options), description: 'Manage telemedicine sessions' },
    { name: prefixTestData('care:medications:read', options), description: 'View medications' },
    { name: prefixTestData('care:medications:write', options), description: 'Manage medications' },
    { name: prefixTestData('care:treatments:read', options), description: 'View treatment plans' },
    { name: prefixTestData('care:treatments:write', options), description: 'Manage treatment plans' },
  ];
  
  // Plan journey permissions
  const planPermissions = [
    { name: prefixTestData('plan:coverage:read', options), description: 'View coverage information' },
    { name: prefixTestData('plan:claims:read', options), description: 'View claims' },
    { name: prefixTestData('plan:claims:write', options), description: 'Submit and manage claims' },
    { name: prefixTestData('plan:benefits:read', options), description: 'View benefits' },
    { name: prefixTestData('plan:documents:read', options), description: 'View insurance documents' },
    { name: prefixTestData('plan:documents:write', options), description: 'Upload insurance documents' },
    { name: prefixTestData('plan:payments:read', options), description: 'View payment information' },
    { name: prefixTestData('plan:simulator:use', options), description: 'Use cost simulator' },
  ];
  
  // Gamification permissions
  const gamificationPermissions = [
    { name: prefixTestData('game:achievements:read', options), description: 'View achievements' },
    { name: prefixTestData('game:progress:read', options), description: 'View progress' },
    { name: prefixTestData('game:rewards:read', options), description: 'View rewards' },
    { name: prefixTestData('game:rewards:redeem', options), description: 'Redeem rewards' },
    { name: prefixTestData('game:leaderboard:read', options), description: 'View leaderboards' },
  ];
  
  // Filter permissions based on selected journeys
  let allPermissions = [];
  
  if (options.journeys?.includes('health')) {
    allPermissions = [...allPermissions, ...healthPermissions];
  }
  
  if (options.journeys?.includes('care')) {
    allPermissions = [...allPermissions, ...carePermissions];
  }
  
  if (options.journeys?.includes('plan')) {
    allPermissions = [...allPermissions, ...planPermissions];
  }
  
  if (options.journeys?.includes('gamification')) {
    allPermissions = [...allPermissions, ...gamificationPermissions];
  }
  
  // Create all permissions in the database
  for (const permission of allPermissions) {
    try {
      // Try to create the permission, ignore if it already exists
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    } catch (error) {
      // If creation fails due to unique constraint, just log and continue
      if (error.code === 'P2002') {
        if (options.logging) {
          console.log(`Permission ${permission.name} already exists, skipping...`);
        }
      } else {
        // For other errors, re-throw
        throw error;
      }
    }
  }
}

/**
 * Seeds test roles and assigns permissions to them.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedTestRoles(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
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
      name: prefixTestData('User', options),
      description: 'Standard user with access to all journeys',
      isDefault: true,
      journey: null,
      permissions: permissions
        .filter(p => !p.name.includes('ADMIN'))
        .map(p => p.name),
    },
    {
      name: prefixTestData('Caregiver', options),
      description: 'User with delegated access to another user\'s health data',
      isDefault: false,
      journey: null,
      permissions: permissions
        .filter(p => p.name.includes('health:') || p.name.includes('care:'))
        .filter(p => p.name.includes(':read'))
        .map(p => p.name),
    },
    {
      name: prefixTestData('Provider', options),
      description: 'Healthcare provider with access to patient data',
      isDefault: false,
      journey: 'care',
      permissions: permissions
        .filter(p => p.name.includes('health:') || p.name.includes('care:'))
        .map(p => p.name),
    },
    {
      name: prefixTestData('Administrator', options),
      description: 'System administrator with full access',
      isDefault: false,
      journey: null,
      permissions: permissions.map(p => p.name), // All permissions
    },
  ];
  
  // Create roles and assign permissions
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
        } else if (options.logging) {
          console.warn(`Permission not found: ${name}`);
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
      
      if (options.logging) {
        console.log(`Created test role: ${roleData.name} with ${permissionConnections.length} permissions`);
      }
    } catch (error) {
      console.error(`Error creating test role: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Seeds test users with different roles.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedTestUsers(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  try {
    // Determine number of users to create based on data volume
    const userCount = getUserCountByVolume(options.dataVolume);
    
    // Create admin user
    const adminPassword = await bcrypt.hash('TestPassword123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: prefixTestData('Admin User', options),
        email: prefixTestData('admin@test.com', options),
        password: adminPassword,
        phone: '+5511999999999',
        cpf: '12345678901',
      },
    });
    
    // Get the admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: { contains: 'Administrator' } },
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
      if (options.logging) {
        console.log(`Created test admin user: ${adminUser.email} with Administrator role`);
      }
    }
    
    // Create regular test users
    const userPassword = await bcrypt.hash('TestPassword123!', 10);
    const userRole = await prisma.role.findFirst({
      where: { isDefault: true },
    });
    
    // Create additional test users based on volume
    for (let i = 1; i <= userCount; i++) {
      const testUser = await prisma.user.create({
        data: {
          name: prefixTestData(`Test User ${i}`, options),
          email: prefixTestData(`user${i}@test.com`, options),
          password: userPassword,
          phone: `+551188888888${i.toString().padStart(2, '0')}`,
          cpf: `9876543210${i.toString().padStart(2, '0')}`,
        },
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
      }
    }
    
    if (options.logging) {
      console.log(`Created ${userCount} test users with default role`);
    }
  } catch (error) {
    console.error(`Error creating test users: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds journey-specific test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedTestJourneyData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Seed journey-specific data based on selected journeys
  if (options.journeys?.includes('health')) {
    await seedHealthJourneyData(prisma, options);
  }
  
  if (options.journeys?.includes('care')) {
    await seedCareJourneyData(prisma, options);
  }
  
  if (options.journeys?.includes('plan')) {
    await seedPlanJourneyData(prisma, options);
  }
  
  if (options.journeys?.includes('gamification')) {
    await seedGamificationData(prisma, options);
  }
}

/**
 * Seeds Health Journey test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedHealthJourneyData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  try {
    // Sample health metrics types
    const metricTypes = [
      { name: prefixTestData('HEART_RATE', options), unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
      { name: prefixTestData('BLOOD_PRESSURE', options), unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
      { name: prefixTestData('BLOOD_GLUCOSE', options), unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
      { name: prefixTestData('STEPS', options), unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
      { name: prefixTestData('WEIGHT', options), unit: 'kg', normalRangeMin: null, normalRangeMax: null },
      { name: prefixTestData('SLEEP', options), unit: 'hours', normalRangeMin: 7, normalRangeMax: 9 },
    ];

    for (const metricType of metricTypes) {
      await prisma.healthMetricType.upsert({
        where: { name: metricType.name },
        update: {},
        create: metricType,
      });
    }
    
    // Sample device types
    const deviceTypes = [
      { name: prefixTestData('Smartwatch', options), description: 'Wearable smartwatch device', manufacturer: 'Various' },
      { name: prefixTestData('Blood Pressure Monitor', options), description: 'Blood pressure monitoring device', manufacturer: 'Various' },
      { name: prefixTestData('Glucose Monitor', options), description: 'Blood glucose monitoring device', manufacturer: 'Various' },
      { name: prefixTestData('Smart Scale', options), description: 'Weight and body composition scale', manufacturer: 'Various' },
    ];
    
    for (const deviceType of deviceTypes) {
      await prisma.deviceType.upsert({
        where: { name: deviceType.name },
        update: {},
        create: deviceType,
      });
    }
    
    // Create health metrics data based on volume
    if (options.dataVolume !== 'small') {
      await seedHealthMetricsData(prisma, options);
    }
    
    if (options.logging) {
      console.log(`Created health journey test data: ${metricTypes.length} metric types, ${deviceTypes.length} device types`);
    }
  } catch (error) {
    console.error(`Error seeding health journey test data: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds Care Journey test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedCareJourneyData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  try {
    // Sample provider specialties
    const specialties = [
      { name: prefixTestData('Cardiologia', options), description: 'Especialista em coração e sistema cardiovascular' },
      { name: prefixTestData('Dermatologia', options), description: 'Especialista em pele, cabelo e unhas' },
      { name: prefixTestData('Ortopedia', options), description: 'Especialista em sistema músculo-esquelético' },
      { name: prefixTestData('Pediatria', options), description: 'Especialista em saúde infantil' },
      { name: prefixTestData('Psiquiatria', options), description: 'Especialista em saúde mental' },
    ];
    
    for (const specialty of specialties) {
      await prisma.providerSpecialty.upsert({
        where: { name: specialty.name },
        update: {},
        create: specialty,
      });
    }
    
    // Create providers based on volume
    if (options.dataVolume !== 'small') {
      await seedProvidersData(prisma, options);
    }
    
    // Create appointments based on volume
    if (options.dataVolume !== 'small') {
      await seedAppointmentsData(prisma, options);
    }
    
    if (options.logging) {
      console.log(`Created care journey test data: ${specialties.length} provider specialties`);
    }
  } catch (error) {
    console.error(`Error seeding care journey test data: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds Plan Journey test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedPlanJourneyData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  try {
    // Sample plan types
    const planTypes = [
      { name: prefixTestData('Básico', options), description: 'Plano com cobertura básica' },
      { name: prefixTestData('Standard', options), description: 'Plano com cobertura intermediária' },
      { name: prefixTestData('Premium', options), description: 'Plano com cobertura ampla' },
    ];
    
    for (const planType of planTypes) {
      await prisma.insurancePlanType.upsert({
        where: { name: planType.name },
        update: {},
        create: planType,
      });
    }
    
    // Sample claim types
    const claimTypes = [
      { name: prefixTestData('Consulta Médica', options), description: 'Reembolso para consulta médica' },
      { name: prefixTestData('Exame', options), description: 'Reembolso para exames médicos' },
      { name: prefixTestData('Terapia', options), description: 'Reembolso para sessões terapêuticas' },
      { name: prefixTestData('Internação', options), description: 'Reembolso para internação hospitalar' },
      { name: prefixTestData('Medicamento', options), description: 'Reembolso para medicamentos prescritos' },
    ];
    
    for (const claimType of claimTypes) {
      await prisma.claimType.upsert({
        where: { name: claimType.name },
        update: {},
        create: claimType,
      });
    }
    
    // Create insurance plans based on volume
    if (options.dataVolume !== 'small') {
      await seedInsurancePlansData(prisma, options);
    }
    
    // Create claims based on volume
    if (options.dataVolume !== 'small') {
      await seedClaimsData(prisma, options);
    }
    
    if (options.logging) {
      console.log(`Created plan journey test data: ${planTypes.length} plan types, ${claimTypes.length} claim types`);
    }
  } catch (error) {
    console.error(`Error seeding plan journey test data: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds Gamification test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedGamificationData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  try {
    // Sample achievement types
    const achievementTypes = [
      { 
        name: prefixTestData('health-check-streak', options), 
        title: 'Monitor de Saúde', 
        description: 'Registre suas métricas de saúde por dias consecutivos',
        journey: 'health',
        icon: 'heart-pulse',
        levels: 3
      },
      { 
        name: prefixTestData('steps-goal', options), 
        title: 'Caminhante Dedicado', 
        description: 'Atinja sua meta diária de passos',
        journey: 'health',
        icon: 'footprints',
        levels: 3
      },
      { 
        name: prefixTestData('appointment-keeper', options), 
        title: 'Compromisso com a Saúde', 
        description: 'Compareça às consultas agendadas',
        journey: 'care',
        icon: 'calendar-check',
        levels: 3
      },
      { 
        name: prefixTestData('medication-adherence', options), 
        title: 'Aderência ao Tratamento', 
        description: 'Tome seus medicamentos conforme prescrito',
        journey: 'care',
        icon: 'pill',
        levels: 3
      },
      { 
        name: prefixTestData('claim-master', options), 
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
    
    // Create achievements and rewards based on volume
    if (options.dataVolume !== 'small') {
      await seedAchievementsData(prisma, options);
    }
    
    if (options.logging) {
      console.log(`Created gamification test data: ${achievementTypes.length} achievement types`);
    }
  } catch (error) {
    console.error(`Error seeding gamification test data: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds health metrics data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedHealthMetricsData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Implementation depends on data volume
  const metricCount = getMetricCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${metricCount} health metrics per user...`);
  }
  
  // Get users
  const users = await prisma.user.findMany({
    take: 5, // Limit to 5 users for metrics
  });
  
  // Get metric types
  const metricTypes = await prisma.healthMetricType.findMany();
  
  if (users.length === 0 || metricTypes.length === 0) {
    return;
  }
  
  // Create metrics for each user
  for (const user of users) {
    for (const metricType of metricTypes) {
      // Create a smaller number of metrics for each type
      const metricsPerType = Math.ceil(metricCount / metricTypes.length);
      
      for (let i = 0; i < metricsPerType; i++) {
        // Create metrics with dates spanning the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - (i % 30));
        
        // Generate random value based on metric type
        let value: number;
        switch (metricType.name) {
          case 'HEART_RATE':
          case prefixTestData('HEART_RATE', options):
            value = 60 + Math.floor(Math.random() * 40); // 60-100 bpm
            break;
          case 'BLOOD_GLUCOSE':
          case prefixTestData('BLOOD_GLUCOSE', options):
            value = 70 + Math.floor(Math.random() * 50); // 70-120 mg/dL
            break;
          case 'STEPS':
          case prefixTestData('STEPS', options):
            value = 2000 + Math.floor(Math.random() * 8000); // 2000-10000 steps
            break;
          case 'WEIGHT':
          case prefixTestData('WEIGHT', options):
            value = 50 + Math.floor(Math.random() * 50); // 50-100 kg
            break;
          case 'SLEEP':
          case prefixTestData('SLEEP', options):
            value = 5 + Math.random() * 4; // 5-9 hours
            break;
          default:
            value = Math.floor(Math.random() * 100);
        }
        
        // Create the metric
        await prisma.healthMetric.create({
          data: {
            userId: user.id,
            typeId: metricType.id,
            value: value.toString(),
            unit: metricType.unit,
            recordedAt: date,
            source: 'test_data',
          },
        });
      }
    }
  }
}

/**
 * Seeds providers data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedProvidersData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Implementation depends on data volume
  const providerCount = getProviderCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${providerCount} healthcare providers...`);
  }
  
  // Get specialties
  const specialties = await prisma.providerSpecialty.findMany();
  
  if (specialties.length === 0) {
    return;
  }
  
  // Create providers
  for (let i = 0; i < providerCount; i++) {
    // Select a random specialty
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    
    // Create the provider
    await prisma.provider.create({
      data: {
        name: prefixTestData(`Dr. Test Provider ${i + 1}`, options),
        email: prefixTestData(`provider${i + 1}@test.com`, options),
        phone: `+551177777777${(i + 1).toString().padStart(2, '0')}`,
        crm: `${100000 + i}`,
        specialtyId: specialty.id,
        active: true,
      },
    });
  }
}

/**
 * Seeds appointments data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedAppointmentsData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Implementation depends on data volume
  const appointmentCount = getAppointmentCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${appointmentCount} appointments...`);
  }
  
  // Get users and providers
  const users = await prisma.user.findMany({
    take: 5, // Limit to 5 users for appointments
  });
  
  const providers = await prisma.provider.findMany();
  
  if (users.length === 0 || providers.length === 0) {
    return;
  }
  
  // Create appointments
  for (let i = 0; i < appointmentCount; i++) {
    // Select a random user and provider
    const user = users[Math.floor(Math.random() * users.length)];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    
    // Create appointment with dates spanning the next 30 days
    const date = new Date();
    date.setDate(date.getDate() + (i % 30));
    date.setHours(9 + (i % 8), 0, 0, 0); // 9 AM to 5 PM
    
    // Create the appointment
    await prisma.appointment.create({
      data: {
        userId: user.id,
        providerId: provider.id,
        scheduledAt: date,
        duration: 30, // 30 minutes
        status: i % 5 === 0 ? 'CANCELLED' : (i % 3 === 0 ? 'COMPLETED' : 'SCHEDULED'),
        notes: `Test appointment ${i + 1}`,
      },
    });
  }
}

/**
 * Seeds insurance plans data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedInsurancePlansData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Implementation depends on data volume
  const planCount = getPlanCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${planCount} insurance plans...`);
  }
  
  // Get plan types
  const planTypes = await prisma.insurancePlanType.findMany();
  
  if (planTypes.length === 0) {
    return;
  }
  
  // Create plans
  for (let i = 0; i < planCount; i++) {
    // Select a random plan type
    const planType = planTypes[Math.floor(Math.random() * planTypes.length)];
    
    // Create the plan
    await prisma.insurancePlan.create({
      data: {
        name: prefixTestData(`Plano ${planType.name} ${i + 1}`, options),
        description: `Plano de teste ${i + 1}`,
        typeId: planType.id,
        coverage: JSON.stringify({
          consultations: i % 3 === 0 ? 'full' : 'partial',
          exams: i % 2 === 0 ? 'full' : 'partial',
          hospitalizations: planType.name === 'Premium' ? 'full' : 'partial',
        }),
        monthlyPrice: 100 + (i * 50), // 100-600 BRL
        active: true,
      },
    });
  }
  
  // Assign plans to users
  const users = await prisma.user.findMany();
  const plans = await prisma.insurancePlan.findMany();
  
  if (users.length === 0 || plans.length === 0) {
    return;
  }
  
  for (const user of users) {
    // Select a random plan
    const plan = plans[Math.floor(Math.random() * plans.length)];
    
    // Create user plan
    await prisma.userPlan.create({
      data: {
        userId: user.id,
        planId: plan.id,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
        status: 'ACTIVE',
        policyNumber: `POL-${100000 + Math.floor(Math.random() * 900000)}`,
      },
    });
  }
}

/**
 * Seeds claims data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedClaimsData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Implementation depends on data volume
  const claimCount = getClaimCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${claimCount} insurance claims...`);
  }
  
  // Get users, plans, and claim types
  const userPlans = await prisma.userPlan.findMany({
    include: {
      user: true,
      plan: true,
    },
  });
  
  const claimTypes = await prisma.claimType.findMany();
  
  if (userPlans.length === 0 || claimTypes.length === 0) {
    return;
  }
  
  // Create claims
  for (let i = 0; i < claimCount; i++) {
    // Select a random user plan and claim type
    const userPlan = userPlans[Math.floor(Math.random() * userPlans.length)];
    const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
    
    // Create claim with dates spanning the last 90 days
    const date = new Date();
    date.setDate(date.getDate() - (i % 90));
    
    // Create the claim
    await prisma.claim.create({
      data: {
        userId: userPlan.userId,
        planId: userPlan.planId,
        typeId: claimType.id,
        amount: 100 + (i * 10), // 100-1000 BRL
        description: `Claim for ${claimType.name}`,
        status: i % 5 === 0 ? 'REJECTED' : (i % 3 === 0 ? 'APPROVED' : 'PENDING'),
        submittedAt: date,
        documentUrls: JSON.stringify([`https://example.com/docs/claim_${i + 1}.pdf`]),
      },
    });
  }
}

/**
 * Seeds achievements data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedAchievementsData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Implementation depends on data volume
  const achievementCount = getAchievementCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${achievementCount} user achievements...`);
  }
  
  // Get users and achievement types
  const users = await prisma.user.findMany();
  const achievementTypes = await prisma.achievementType.findMany();
  
  if (users.length === 0 || achievementTypes.length === 0) {
    return;
  }
  
  // Create user achievements
  for (const user of users) {
    // Assign a subset of achievements to each user
    const userAchievementCount = Math.min(
      achievementCount, 
      achievementTypes.length
    );
    
    // Shuffle achievement types to randomize selection
    const shuffledAchievements = [...achievementTypes]
      .sort(() => Math.random() - 0.5)
      .slice(0, userAchievementCount);
    
    for (const achievement of shuffledAchievements) {
      // Randomly assign a level (1-3)
      const level = Math.floor(Math.random() * 3) + 1;
      
      // Create the user achievement
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementTypeId: achievement.id,
          level,
          progress: level * 100, // 100% for each level
          achievedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date in last 30 days
        },
      });
    }
  }
  
  // Create rewards if gamification journey is included
  if (options.journeys?.includes('gamification')) {
    await seedRewardsData(prisma, options);
  }
}

/**
 * Seeds rewards data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedRewardsData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Implementation depends on data volume
  const rewardCount = getRewardCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${rewardCount} rewards...`);
  }
  
  // Create reward types
  const rewardTypes = [
    { name: prefixTestData('discount', options), description: 'Discount on services', pointCost: 100 },
    { name: prefixTestData('gift_card', options), description: 'Gift card for partner stores', pointCost: 200 },
    { name: prefixTestData('premium_access', options), description: 'Premium access to features', pointCost: 300 },
    { name: prefixTestData('consultation', options), description: 'Free consultation', pointCost: 500 },
    { name: prefixTestData('exam', options), description: 'Free medical exam', pointCost: 800 },
  ];
  
  for (const rewardType of rewardTypes) {
    await prisma.rewardType.upsert({
      where: { name: rewardType.name },
      update: {},
      create: rewardType,
    });
  }
  
  // Get users and reward types from database
  const users = await prisma.user.findMany();
  const dbRewardTypes = await prisma.rewardType.findMany();
  
  if (users.length === 0 || dbRewardTypes.length === 0) {
    return;
  }
  
  // Create user rewards
  for (let i = 0; i < rewardCount; i++) {
    // Select a random user and reward type
    const user = users[Math.floor(Math.random() * users.length)];
    const rewardType = dbRewardTypes[Math.floor(Math.random() * dbRewardTypes.length)];
    
    // Create the user reward
    await prisma.userReward.create({
      data: {
        userId: user.id,
        rewardTypeId: rewardType.id,
        status: i % 3 === 0 ? 'REDEEMED' : 'AVAILABLE',
        code: `REWARD-${100000 + i}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        redeemedAt: i % 3 === 0 ? new Date() : null,
      },
    });
  }
}

/**
 * Prefixes test data with the test prefix if isolation is enabled.
 * 
 * @param value - The value to prefix
 * @param options - Test seed options
 * @returns The prefixed value if isolation is enabled, otherwise the original value
 */
function prefixTestData(value: string, options: TestSeedOptions): string {
  if (options.isolate && options.testPrefix) {
    return `${options.testPrefix}_${value}`;
  }
  return value;
}

/**
 * Gets the number of users to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of users to create
 */
function getUserCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  switch (dataVolume) {
    case 'small':
      return 2;
    case 'medium':
      return 10;
    case 'large':
      return 50;
    default:
      return 2;
  }
}

/**
 * Gets the number of metrics to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of metrics to create
 */
function getMetricCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  switch (dataVolume) {
    case 'small':
      return 0;
    case 'medium':
      return 30;
    case 'large':
      return 100;
    default:
      return 0;
  }
}

/**
 * Gets the number of providers to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of providers to create
 */
function getProviderCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  switch (dataVolume) {
    case 'small':
      return 0;
    case 'medium':
      return 5;
    case 'large':
      return 20;
    default:
      return 0;
  }
}

/**
 * Gets the number of appointments to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of appointments to create
 */
function getAppointmentCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  switch (dataVolume) {
    case 'small':
      return 0;
    case 'medium':
      return 10;
    case 'large':
      return 50;
    default:
      return 0;
  }
}

/**
 * Gets the number of plans to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of plans to create
 */
function getPlanCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  switch (dataVolume) {
    case 'small':
      return 0;
    case 'medium':
      return 3;
    case 'large':
      return 10;
    default:
      return 0;
  }
}

/**
 * Gets the number of claims to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of claims to create
 */
function getClaimCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  switch (dataVolume) {
    case 'small':
      return 0;
    case 'medium':
      return 10;
    case 'large':
      return 50;
    default:
      return 0;
  }
}

/**
 * Gets the number of achievements to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of achievements to create
 */
function getAchievementCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  switch (dataVolume) {
    case 'small':
      return 0;
    case 'medium':
      return 3;
    case 'large':
      return 5;
    default:
      return 0;
  }
}

/**
 * Gets the number of rewards to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of rewards to create
 */
function getRewardCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  switch (dataVolume) {
    case 'small':
      return 0;
    case 'medium':
      return 5;
    case 'large':
      return 20;
    default:
      return 0;
  }
}

// Export functions for testing
export {
  seedTestPermissions,
  seedTestRoles,
  seedTestUsers,
  seedTestJourneyData,
  seedHealthJourneyData,
  seedCareJourneyData,
  seedPlanJourneyData,
  seedGamificationData,
  cleanTestDatabase
};