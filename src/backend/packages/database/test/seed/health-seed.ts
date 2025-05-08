import { PrismaClient } from '@prisma/client';
import { DatabaseContext } from '@backend/packages/database/src/contexts/database.context';
import { z } from 'zod';
import { addDays, subDays, subMonths } from 'date-fns';

/**
 * Configuration options for health journey seeding
 */
export interface HealthSeedOptions {
  /**
   * Controls the volume of data to generate
   * - low: Minimal data for basic tests (default)
   * - medium: Moderate amount of data for integration tests
   * - high: Large volume for performance testing
   */
  volume?: 'low' | 'medium' | 'high';

  /**
   * Specific test scenarios to seed
   * - basic: Standard health metrics and goals
   * - abnormal: Includes abnormal health metrics
   * - achievement: Data that triggers achievements
   * - trends: Data with clear trends for analysis
   * - devices: Includes various device connections
   * - all: All scenarios (default)
   */
  scenarios?: Array<'basic' | 'abnormal' | 'achievement' | 'trends' | 'devices' | 'all'>;

  /**
   * User IDs to create data for
   * If not provided, will use the test user from the database
   */
  userIds?: string[];

  /**
   * Whether to clean existing health data before seeding
   * Default: true
   */
  clean?: boolean;

  /**
   * Whether to log detailed information during seeding
   * Default: false
   */
  verbose?: boolean;
}

/**
 * Default seed options
 */
const defaultOptions: HealthSeedOptions = {
  volume: 'low',
  scenarios: ['basic'],
  clean: true,
  verbose: false,
};

/**
 * Volume configuration for data generation
 */
const volumeConfig = {
  low: {
    metricsPerUser: 50,
    goalsPerUser: 3,
    devicesPerUser: 1,
    medicalEventsPerUser: 5,
    daysOfHistory: 30,
  },
  medium: {
    metricsPerUser: 500,
    goalsPerUser: 10,
    devicesPerUser: 3,
    medicalEventsPerUser: 20,
    daysOfHistory: 90,
  },
  high: {
    metricsPerUser: 5000,
    goalsPerUser: 30,
    devicesPerUser: 5,
    medicalEventsPerUser: 100,
    daysOfHistory: 365,
  },
};

/**
 * Validation schema for health seed options
 */
const healthSeedOptionsSchema = z.object({
  volume: z.enum(['low', 'medium', 'high']).optional(),
  scenarios: z.array(
    z.enum(['basic', 'abnormal', 'achievement', 'trends', 'devices', 'all'])
  ).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  clean: z.boolean().optional(),
  verbose: z.boolean().optional(),
});

/**
 * Enum for health metric types
 */
enum MetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  WEIGHT = 'WEIGHT',
  SLEEP = 'SLEEP',
}

/**
 * Enum for health metric sources
 */
enum MetricSource {
  MANUAL = 'MANUAL',
  DEVICE = 'DEVICE',
  INTEGRATION = 'INTEGRATION',
}

/**
 * Enum for device types
 */
enum DeviceType {
  SMARTWATCH = 'Smartwatch',
  BLOOD_PRESSURE_MONITOR = 'Blood Pressure Monitor',
  GLUCOSE_MONITOR = 'Glucose Monitor',
  SMART_SCALE = 'Smart Scale',
}

/**
 * Enum for device connection status
 */
enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PAIRING = 'pairing',
  ERROR = 'error',
}

/**
 * Enum for goal types
 */
enum GoalType {
  STEPS = 'STEPS',
  WEIGHT = 'WEIGHT',
  SLEEP = 'SLEEP',
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
}

/**
 * Enum for goal status
 */
enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

/**
 * Enum for goal period
 */
enum GoalPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

/**
 * Helper function to generate random health metrics based on type
 */
function generateMetricValue(type: MetricType): number {
  switch (type) {
    case MetricType.HEART_RATE:
      return Math.floor(60 + Math.random() * 40); // 60-100 bpm
    case MetricType.BLOOD_GLUCOSE:
      return Math.floor(70 + Math.random() * 30); // 70-100 mg/dL
    case MetricType.STEPS:
      return Math.floor(2000 + Math.random() * 8000); // 2000-10000 steps
    case MetricType.WEIGHT:
      return 60 + Math.random() * 40; // 60-100 kg
    case MetricType.SLEEP:
      return 5 + Math.random() * 4; // 5-9 hours
    case MetricType.BLOOD_PRESSURE:
      return 120 + Math.floor(Math.random() * 20); // 120-140 (systolic)
    default:
      return 0;
  }
}

/**
 * Helper function to generate abnormal health metrics based on type
 */
function generateAbnormalMetricValue(type: MetricType): number {
  switch (type) {
    case MetricType.HEART_RATE:
      return Math.random() > 0.5 
        ? Math.floor(40 + Math.random() * 10) // Low: 40-50 bpm
        : Math.floor(100 + Math.random() * 40); // High: 100-140 bpm
    case MetricType.BLOOD_GLUCOSE:
      return Math.random() > 0.5
        ? Math.floor(50 + Math.random() * 10) // Low: 50-60 mg/dL
        : Math.floor(120 + Math.random() * 80); // High: 120-200 mg/dL
    case MetricType.STEPS:
      return Math.floor(100 + Math.random() * 1000); // Low: 100-1100 steps
    case MetricType.WEIGHT:
      return Math.random() > 0.5
        ? 40 + Math.random() * 10 // Low: 40-50 kg
        : 110 + Math.random() * 40; // High: 110-150 kg
    case MetricType.SLEEP:
      return Math.random() > 0.5
        ? 2 + Math.random() * 2 // Low: 2-4 hours
        : 10 + Math.random() * 2; // High: 10-12 hours
    case MetricType.BLOOD_PRESSURE:
      return Math.random() > 0.5
        ? 90 + Math.floor(Math.random() * 10) // Low: 90-100 (systolic)
        : 140 + Math.floor(Math.random() * 40); // High: 140-180 (systolic)
    default:
      return 0;
  }
}

/**
 * Helper function to generate trending health metrics
 */
function generateTrendingMetricValue(type: MetricType, day: number, totalDays: number, trendDirection: 'up' | 'down'): number {
  const progress = day / totalDays;
  const baseValue = generateMetricValue(type);
  
  switch (type) {
    case MetricType.WEIGHT:
      // Weight trending down (weight loss) or up (weight gain)
      const weightChange = 10; // 10kg change over the period
      return trendDirection === 'down'
        ? baseValue - (weightChange * progress)
        : baseValue + (weightChange * progress);
    case MetricType.STEPS:
      // Steps trending up (increasing activity) or down (decreasing activity)
      const stepsChange = 5000; // 5000 steps change over the period
      return trendDirection === 'up'
        ? 3000 + (stepsChange * progress)
        : 8000 - (stepsChange * progress);
    case MetricType.HEART_RATE:
      // Heart rate trending down (improving fitness) or up (decreasing fitness)
      const hrChange = 20; // 20bpm change over the period
      return trendDirection === 'down'
        ? 90 - (hrChange * progress)
        : 70 + (hrChange * progress);
    default:
      return baseValue;
  }
}

/**
 * Helper function to get metric unit based on type
 */
function getMetricUnit(type: MetricType): string {
  switch (type) {
    case MetricType.HEART_RATE:
      return 'bpm';
    case MetricType.BLOOD_GLUCOSE:
      return 'mg/dL';
    case MetricType.STEPS:
      return 'steps';
    case MetricType.WEIGHT:
      return 'kg';
    case MetricType.SLEEP:
      return 'hours';
    case MetricType.BLOOD_PRESSURE:
      return 'mmHg';
    default:
      return '';
  }
}

/**
 * Helper function to determine if a metric value is abnormal
 */
function isAbnormalValue(type: MetricType, value: number): boolean {
  switch (type) {
    case MetricType.HEART_RATE:
      return value < 60 || value > 100;
    case MetricType.BLOOD_GLUCOSE:
      return value < 70 || value > 100;
    case MetricType.STEPS:
      return value < 5000;
    case MetricType.SLEEP:
      return value < 7 || value > 9;
    case MetricType.BLOOD_PRESSURE:
      return value > 140 || value < 90;
    default:
      return false;
  }
}

/**
 * Helper function to generate a device connection
 */
function generateDeviceConnection(userId: string, deviceType: DeviceType) {
  return {
    userId,
    deviceType: deviceType,
    status: ConnectionStatus.CONNECTED,
    deviceId: `device-${Math.random().toString(36).substring(2, 10)}`,
    lastSync: new Date(),
  };
}

/**
 * Helper function to generate a health goal
 */
function generateHealthGoal(userId: string, type: GoalType, status: GoalStatus = GoalStatus.ACTIVE) {
  const targetValue = (() => {
    switch (type) {
      case GoalType.STEPS:
        return 10000;
      case GoalType.WEIGHT:
        return 70;
      case GoalType.SLEEP:
        return 8;
      case GoalType.HEART_RATE:
        return 70;
      case GoalType.BLOOD_GLUCOSE:
        return 80;
      case GoalType.BLOOD_PRESSURE:
        return 120;
      default:
        return 0;
    }
  })();

  const currentValue = status === GoalStatus.COMPLETED 
    ? targetValue 
    : status === GoalStatus.FAILED 
      ? targetValue * 0.5 
      : targetValue * 0.7;

  return {
    userId,
    type,
    status,
    period: GoalPeriod.WEEKLY,
    targetValue,
    currentValue,
    startDate: subDays(new Date(), 7),
    endDate: addDays(new Date(), 7),
  };
}

/**
 * Helper function to generate a medical event
 */
function generateMedicalEvent(userId: string, index: number) {
  const eventTypes = [
    'CONSULTATION',
    'EXAM',
    'VACCINATION',
    'MEDICATION',
    'PROCEDURE',
  ];
  
  const providers = [
    'Dr. Silva',
    'Dr. Santos',
    'Clínica Saúde',
    'Hospital São Lucas',
    'Centro Médico Austa',
  ];

  return {
    userId,
    type: eventTypes[index % eventTypes.length],
    description: `Medical event ${index + 1}`,
    date: subDays(new Date(), index * 30),
    provider: providers[index % providers.length],
    documents: [],
  };
}

/**
 * Seeds health metric types
 */
async function seedHealthMetricTypes(prisma: PrismaClient, options: HealthSeedOptions): Promise<void> {
  const metricTypes = [
    { name: MetricType.HEART_RATE, unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
    { name: MetricType.BLOOD_PRESSURE, unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
    { name: MetricType.BLOOD_GLUCOSE, unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
    { name: MetricType.STEPS, unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
    { name: MetricType.WEIGHT, unit: 'kg', normalRangeMin: null, normalRangeMax: null },
    { name: MetricType.SLEEP, unit: 'hours', normalRangeMin: 7, normalRangeMax: 9 },
  ];

  for (const metricType of metricTypes) {
    await prisma.healthMetricType.upsert({
      where: { name: metricType.name },
      update: {},
      create: metricType,
    });
  }
  
  if (options.verbose) {
    console.log(`Created ${metricTypes.length} health metric types`);
  }
}

/**
 * Seeds device types
 */
async function seedDeviceTypes(prisma: PrismaClient, options: HealthSeedOptions): Promise<void> {
  const deviceTypes = [
    { name: DeviceType.SMARTWATCH, description: 'Wearable smartwatch device', manufacturer: 'Various' },
    { name: DeviceType.BLOOD_PRESSURE_MONITOR, description: 'Blood pressure monitoring device', manufacturer: 'Various' },
    { name: DeviceType.GLUCOSE_MONITOR, description: 'Blood glucose monitoring device', manufacturer: 'Various' },
    { name: DeviceType.SMART_SCALE, description: 'Weight and body composition scale', manufacturer: 'Various' },
  ];
  
  for (const deviceType of deviceTypes) {
    await prisma.deviceType.upsert({
      where: { name: deviceType.name },
      update: {},
      create: deviceType,
    });
  }
  
  if (options.verbose) {
    console.log(`Created ${deviceTypes.length} device types`);
  }
}

/**
 * Seeds health metrics for testing
 */
async function seedHealthMetrics(
  prisma: PrismaClient, 
  options: HealthSeedOptions, 
  userIds: string[]
): Promise<void> {
  const { volume = 'low', scenarios = ['basic'] } = options;
  const config = volumeConfig[volume];
  const includeAll = scenarios.includes('all');
  const includeAbnormal = includeAll || scenarios.includes('abnormal');
  const includeTrends = includeAll || scenarios.includes('trends');
  const includeAchievement = includeAll || scenarios.includes('achievement');
  
  // Batch size for database operations
  const BATCH_SIZE = 100;
  let metricsCreated = 0;
  
  for (const userId of userIds) {
    const metricTypes = Object.values(MetricType);
    const metricBatch = [];
    
    // Generate metrics for each day in the history period
    for (let day = 0; day < config.daysOfHistory; day++) {
      const date = subDays(new Date(), day);
      
      for (const type of metricTypes) {
        // Skip some days randomly to create more realistic data
        if (Math.random() > 0.8 && type !== MetricType.STEPS) {
          continue;
        }
        
        let value: number;
        let isAbnormal = false;
        
        // Determine which type of data to generate
        if (includeAbnormal && Math.random() < 0.2) {
          // Generate abnormal values 20% of the time if abnormal scenario is included
          value = generateAbnormalMetricValue(type as MetricType);
          isAbnormal = isAbnormalValue(type as MetricType, value);
        } else if (includeTrends && (type === MetricType.WEIGHT || type === MetricType.STEPS || type === MetricType.HEART_RATE)) {
          // Generate trending data for specific metrics if trends scenario is included
          const trendDirection = type === MetricType.WEIGHT ? 'down' : 'up';
          value = generateTrendingMetricValue(type as MetricType, day, config.daysOfHistory, trendDirection as 'up' | 'down');
          isAbnormal = isAbnormalValue(type as MetricType, value);
        } else {
          // Generate normal values
          value = generateMetricValue(type as MetricType);
          isAbnormal = isAbnormalValue(type as MetricType, value);
        }
        
        // For blood pressure, we need to generate both systolic and diastolic
        if (type === MetricType.BLOOD_PRESSURE) {
          const systolic = value;
          const diastolic = Math.floor(systolic * 0.6); // Approximate diastolic as 60% of systolic
          value = systolic; // Store systolic as the main value
          
          metricBatch.push({
            userId,
            type: MetricType.BLOOD_PRESSURE,
            value: systolic,
            unit: 'mmHg',
            timestamp: new Date(date),
            source: Math.random() > 0.7 ? MetricSource.DEVICE : MetricSource.MANUAL,
            notes: `Systolic: ${systolic}, Diastolic: ${diastolic}`,
            isAbnormal: systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60,
            trendPercentage: null,
          });
        } else {
          metricBatch.push({
            userId,
            type,
            value,
            unit: getMetricUnit(type as MetricType),
            timestamp: new Date(date),
            source: Math.random() > 0.7 ? MetricSource.DEVICE : MetricSource.MANUAL,
            notes: null,
            isAbnormal,
            trendPercentage: null,
          });
        }
        
        // Insert in batches to improve performance
        if (metricBatch.length >= BATCH_SIZE) {
          await prisma.healthMetric.createMany({
            data: metricBatch,
            skipDuplicates: true,
          });
          metricsCreated += metricBatch.length;
          metricBatch.length = 0;
        }
      }
    }
    
    // Insert any remaining metrics
    if (metricBatch.length > 0) {
      await prisma.healthMetric.createMany({
        data: metricBatch,
        skipDuplicates: true,
      });
      metricsCreated += metricBatch.length;
    }
    
    // Generate achievement-specific data if needed
    if (includeAchievement) {
      // Create a streak of daily step goals met
      const stepsGoalMetrics = [];
      for (let day = 0; day < 7; day++) { // 7-day streak
        stepsGoalMetrics.push({
          userId,
          type: MetricType.STEPS,
          value: 10000 + Math.floor(Math.random() * 2000), // Exceeding 10k steps
          unit: 'steps',
          timestamp: subDays(new Date(), day),
          source: MetricSource.DEVICE,
          notes: 'Achievement: Daily steps goal met',
          isAbnormal: false,
          trendPercentage: null,
        });
      }
      
      await prisma.healthMetric.createMany({
        data: stepsGoalMetrics,
        skipDuplicates: true,
      });
      metricsCreated += stepsGoalMetrics.length;
    }
  }
  
  if (options.verbose) {
    console.log(`Created ${metricsCreated} health metrics for ${userIds.length} users`);
  }
}

/**
 * Seeds device connections for testing
 */
async function seedDeviceConnections(
  prisma: PrismaClient, 
  options: HealthSeedOptions, 
  userIds: string[]
): Promise<void> {
  const { volume = 'low', scenarios = ['basic'] } = options;
  const config = volumeConfig[volume];
  const includeDevices = scenarios.includes('all') || scenarios.includes('devices');
  
  if (!includeDevices && !scenarios.includes('basic')) {
    return; // Skip if devices scenario is not included
  }
  
  const deviceTypes = [
    DeviceType.SMARTWATCH,
    DeviceType.BLOOD_PRESSURE_MONITOR,
    DeviceType.GLUCOSE_MONITOR,
    DeviceType.SMART_SCALE,
  ];
  
  let connectionsCreated = 0;
  
  for (const userId of userIds) {
    const devicesToCreate = Math.min(deviceTypes.length, config.devicesPerUser);
    
    for (let i = 0; i < devicesToCreate; i++) {
      const deviceType = deviceTypes[i % deviceTypes.length];
      const connection = generateDeviceConnection(userId, deviceType);
      
      await prisma.deviceConnection.create({
        data: connection,
      });
      connectionsCreated++;
    }
  }
  
  if (options.verbose) {
    console.log(`Created ${connectionsCreated} device connections for ${userIds.length} users`);
  }
}

/**
 * Seeds health goals for testing
 */
async function seedHealthGoals(
  prisma: PrismaClient, 
  options: HealthSeedOptions, 
  userIds: string[]
): Promise<void> {
  const { volume = 'low', scenarios = ['basic'] } = options;
  const config = volumeConfig[volume];
  
  const goalTypes = Object.values(GoalType);
  const goalStatuses = [GoalStatus.ACTIVE, GoalStatus.COMPLETED, GoalStatus.FAILED, GoalStatus.PAUSED];
  
  let goalsCreated = 0;
  
  for (const userId of userIds) {
    const goalsToCreate = Math.min(goalTypes.length * goalStatuses.length, config.goalsPerUser);
    
    for (let i = 0; i < goalsToCreate; i++) {
      const type = goalTypes[i % goalTypes.length];
      const status = goalStatuses[Math.floor(i / goalTypes.length) % goalStatuses.length];
      const goal = generateHealthGoal(userId, type, status);
      
      await prisma.healthGoal.create({
        data: goal,
      });
      goalsCreated++;
    }
  }
  
  if (options.verbose) {
    console.log(`Created ${goalsCreated} health goals for ${userIds.length} users`);
  }
}

/**
 * Seeds medical events for testing
 */
async function seedMedicalEvents(
  prisma: PrismaClient, 
  options: HealthSeedOptions, 
  userIds: string[]
): Promise<void> {
  const { volume = 'low', scenarios = ['basic'] } = options;
  const config = volumeConfig[volume];
  
  let eventsCreated = 0;
  
  for (const userId of userIds) {
    for (let i = 0; i < config.medicalEventsPerUser; i++) {
      const event = generateMedicalEvent(userId, i);
      
      await prisma.medicalEvent.create({
        data: event,
      });
      eventsCreated++;
    }
  }
  
  if (options.verbose) {
    console.log(`Created ${eventsCreated} medical events for ${userIds.length} users`);
  }
}

/**
 * Cleans existing health data for the specified users
 */
async function cleanHealthData(prisma: PrismaClient, userIds: string[], options: HealthSeedOptions): Promise<void> {
  if (!options.clean) {
    return;
  }
  
  if (options.verbose) {
    console.log(`Cleaning health data for ${userIds.length} users...`);
  }
  
  // Delete in reverse order of dependencies
  await prisma.healthMetric.deleteMany({
    where: { userId: { in: userIds } },
  });
  
  await prisma.healthGoal.deleteMany({
    where: { userId: { in: userIds } },
  });
  
  await prisma.deviceConnection.deleteMany({
    where: { userId: { in: userIds } },
  });
  
  await prisma.medicalEvent.deleteMany({
    where: { userId: { in: userIds } },
  });
  
  if (options.verbose) {
    console.log('Health data cleaned successfully');
  }
}

/**
 * Gets test user IDs from the database if not provided
 */
async function getTestUserIds(prisma: PrismaClient, options: HealthSeedOptions): Promise<string[]> {
  if (options.userIds && options.userIds.length > 0) {
    return options.userIds;
  }
  
  // Find the test user by email
  const testUser = await prisma.user.findFirst({
    where: { email: 'user@austa.com.br' },
  });
  
  if (!testUser) {
    throw new Error('Test user not found. Please run the main seed script first or provide userIds.');
  }
  
  return [testUser.id];
}

/**
 * Main function to seed health journey test data
 * 
 * @param options - Configuration options for seeding
 * @param dbContext - Optional database context for journey-specific database access
 * @returns A promise that resolves when seeding is complete
 */
export async function seedHealthJourney(
  options: HealthSeedOptions = defaultOptions,
  dbContext?: DatabaseContext
): Promise<void> {
  // Validate options
  try {
    healthSeedOptionsSchema.parse(options);
  } catch (error) {
    console.error('Invalid health seed options:', error);
    throw new Error('Invalid health seed options');
  }
  
  // Merge with default options
  const mergedOptions: HealthSeedOptions = {
    ...defaultOptions,
    ...options,
  };
  
  // If 'all' is in scenarios, replace with all scenarios
  if (mergedOptions.scenarios?.includes('all')) {
    mergedOptions.scenarios = ['basic', 'abnormal', 'achievement', 'trends', 'devices'];
  }
  
  // Use provided database context or create a new PrismaClient
  const prisma = dbContext?.prisma || new PrismaClient();
  
  try {
    if (mergedOptions.verbose) {
      console.log('Starting health journey seed with options:', mergedOptions);
    }
    
    // Get user IDs to create data for
    const userIds = await getTestUserIds(prisma, mergedOptions);
    
    // Clean existing data if requested
    await cleanHealthData(prisma, userIds, mergedOptions);
    
    // Seed reference data
    await seedHealthMetricTypes(prisma, mergedOptions);
    await seedDeviceTypes(prisma, mergedOptions);
    
    // Seed test data
    await seedHealthMetrics(prisma, mergedOptions, userIds);
    await seedDeviceConnections(prisma, mergedOptions, userIds);
    await seedHealthGoals(prisma, mergedOptions, userIds);
    await seedMedicalEvents(prisma, mergedOptions, userIds);
    
    if (mergedOptions.verbose) {
      console.log('Health journey seed completed successfully');
    }
  } catch (error) {
    console.error('Error seeding health journey data:', error);
    throw error;
  } finally {
    // Only disconnect if we created our own client
    if (!dbContext) {
      await prisma.$disconnect();
    }
  }
}

/**
 * Standalone execution for direct invocation
 */
if (require.main === module) {
  seedHealthJourney({ verbose: true })
    .catch(error => {
      console.error('Failed to seed health journey data:', error);
      process.exit(1);
    });
}