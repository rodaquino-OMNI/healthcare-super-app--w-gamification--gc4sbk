import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { faker } from '@faker-js/faker';

/**
 * Configuration options for Health journey test data seeding
 */
export interface HealthSeedOptions {
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
   * Test-specific prefix for data isolation
   * Automatically generated if isolate is true and no prefix is provided
   */
  testPrefix?: string;
  
  /**
   * Whether to log seeding operations
   */
  logging?: boolean;

  /**
   * Specific test scenario to seed data for
   * - 'basic': Standard health metrics and devices (default)
   * - 'goals': Focus on health goals and progress tracking
   * - 'devices': Focus on multiple connected devices and data integration
   * - 'trends': Focus on long-term health trends with historical data
   * - 'anomalies': Include abnormal health readings for testing alerts
   */
  scenario?: 'basic' | 'goals' | 'devices' | 'trends' | 'anomalies';

  /**
   * Date range for generated health data
   * - startDate: Beginning of the date range (default: 30 days ago)
   * - endDate: End of the date range (default: current date)
   */
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };

  /**
   * User IDs to generate health data for
   * If not provided, will use all available test users
   */
  userIds?: string[];

  /**
   * Database context to use for seeding
   * Allows for journey-specific database operations
   */
  dbContext?: any;
}

/**
 * Default health seed options
 */
const defaultHealthSeedOptions: HealthSeedOptions = {
  dataVolume: 'small',
  isolate: true,
  logging: false,
  scenario: 'basic',
  dateRange: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  }
};

/**
 * Validation schema for health metric data
 */
const healthMetricSchema = z.object({
  userId: z.string(),
  typeId: z.string(),
  value: z.string(),
  unit: z.string(),
  recordedAt: z.date(),
  source: z.string(),
  deviceId: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for health goal data
 */
const healthGoalSchema = z.object({
  userId: z.string(),
  metricTypeId: z.string(),
  targetValue: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']),
  progress: z.number().min(0).max(100),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().optional(),
  notes: z.string().optional()
});

/**
 * Validation schema for device connection data
 */
const deviceConnectionSchema = z.object({
  userId: z.string(),
  deviceTypeId: z.string(),
  deviceIdentifier: z.string(),
  name: z.string(),
  connectionStatus: z.enum(['CONNECTED', 'DISCONNECTED', 'PAIRING']),
  lastSyncedAt: z.date().optional(),
  authData: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional()
});

/**
 * Seeds the Health journey test database with configurable test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for Health journey test seeding
 * @returns A promise that resolves when the database is seeded
 */
export async function seedHealthJourney(prisma: PrismaClient, options: HealthSeedOptions = {}): Promise<void> {
  // Merge provided options with defaults
  const seedOptions = { ...defaultHealthSeedOptions, ...options };
  
  // Generate a test prefix if isolation is enabled and no prefix is provided
  if (seedOptions.isolate && !seedOptions.testPrefix) {
    seedOptions.testPrefix = `health_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  
  try {
    if (seedOptions.logging) {
      console.log(`Starting Health journey test database seeding with options:`, seedOptions);
    }
    
    // Seed health metric types
    await seedHealthMetricTypes(prisma, seedOptions);
    
    // Seed device types
    await seedDeviceTypes(prisma, seedOptions);
    
    // Get or create test users if not provided
    const userIds = seedOptions.userIds || await getOrCreateTestUsers(prisma, seedOptions);
    
    // Seed device connections
    await seedDeviceConnections(prisma, userIds, seedOptions);
    
    // Seed health goals
    await seedHealthGoals(prisma, userIds, seedOptions);
    
    // Seed health metrics based on scenario
    switch (seedOptions.scenario) {
      case 'goals':
        await seedHealthMetricsForGoals(prisma, userIds, seedOptions);
        break;
      case 'devices':
        await seedHealthMetricsFromDevices(prisma, userIds, seedOptions);
        break;
      case 'trends':
        await seedHealthMetricsWithTrends(prisma, userIds, seedOptions);
        break;
      case 'anomalies':
        await seedHealthMetricsWithAnomalies(prisma, userIds, seedOptions);
        break;
      case 'basic':
      default:
        await seedBasicHealthMetrics(prisma, userIds, seedOptions);
        break;
    }
    
    if (seedOptions.logging) {
      console.log('Health journey test database seeding completed successfully!');
    }
    
    return;
  } catch (error) {
    console.error('Error seeding Health journey test database:', error);
    throw error;
  }
}

/**
 * Seeds health metric types.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Health seed options
 */
async function seedHealthMetricTypes(prisma: PrismaClient, options: HealthSeedOptions): Promise<void> {
  // Standard health metrics types
  const metricTypes = [
    { name: prefixTestData('HEART_RATE', options), unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
    { name: prefixTestData('BLOOD_PRESSURE_SYSTOLIC', options), unit: 'mmHg', normalRangeMin: 90, normalRangeMax: 120 },
    { name: prefixTestData('BLOOD_PRESSURE_DIASTOLIC', options), unit: 'mmHg', normalRangeMin: 60, normalRangeMax: 80 },
    { name: prefixTestData('BLOOD_GLUCOSE', options), unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
    { name: prefixTestData('STEPS', options), unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
    { name: prefixTestData('WEIGHT', options), unit: 'kg', normalRangeMin: null, normalRangeMax: null },
    { name: prefixTestData('SLEEP', options), unit: 'hours', normalRangeMin: 7, normalRangeMax: 9 },
    { name: prefixTestData('OXYGEN_SATURATION', options), unit: '%', normalRangeMin: 95, normalRangeMax: 100 },
    { name: prefixTestData('BODY_TEMPERATURE', options), unit: '°C', normalRangeMin: 36.1, normalRangeMax: 37.2 },
    { name: prefixTestData('RESPIRATORY_RATE', options), unit: 'breaths/min', normalRangeMin: 12, normalRangeMax: 20 },
  ];

  // Add additional metric types for specific scenarios
  if (options.scenario === 'trends' || options.scenario === 'anomalies' || options.dataVolume === 'large') {
    metricTypes.push(
      { name: prefixTestData('BODY_FAT', options), unit: '%', normalRangeMin: 10, normalRangeMax: 25 },
      { name: prefixTestData('MUSCLE_MASS', options), unit: 'kg', normalRangeMin: null, normalRangeMax: null },
      { name: prefixTestData('HYDRATION', options), unit: '%', normalRangeMin: 45, normalRangeMax: 65 },
      { name: prefixTestData('STRESS_LEVEL', options), unit: 'score', normalRangeMin: 0, normalRangeMax: 25 },
      { name: prefixTestData('CALORIES_BURNED', options), unit: 'kcal', normalRangeMin: 1500, normalRangeMax: 3000 }
    );
  }

  for (const metricType of metricTypes) {
    await prisma.healthMetricType.upsert({
      where: { name: metricType.name },
      update: {},
      create: metricType,
    });
  }
  
  if (options.logging) {
    console.log(`Created ${metricTypes.length} health metric types`);
  }
}

/**
 * Seeds device types.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Health seed options
 */
async function seedDeviceTypes(prisma: PrismaClient, options: HealthSeedOptions): Promise<void> {
  // Standard device types
  const deviceTypes = [
    { 
      name: prefixTestData('Smartwatch', options), 
      description: 'Wearable smartwatch device', 
      manufacturer: 'Various',
      supportedMetrics: ['HEART_RATE', 'STEPS', 'SLEEP', 'OXYGEN_SATURATION']
    },
    { 
      name: prefixTestData('Blood Pressure Monitor', options), 
      description: 'Blood pressure monitoring device', 
      manufacturer: 'Various',
      supportedMetrics: ['BLOOD_PRESSURE_SYSTOLIC', 'BLOOD_PRESSURE_DIASTOLIC']
    },
    { 
      name: prefixTestData('Glucose Monitor', options), 
      description: 'Blood glucose monitoring device', 
      manufacturer: 'Various',
      supportedMetrics: ['BLOOD_GLUCOSE']
    },
    { 
      name: prefixTestData('Smart Scale', options), 
      description: 'Weight and body composition scale', 
      manufacturer: 'Various',
      supportedMetrics: ['WEIGHT']
    },
    { 
      name: prefixTestData('Thermometer', options), 
      description: 'Body temperature measurement device', 
      manufacturer: 'Various',
      supportedMetrics: ['BODY_TEMPERATURE']
    },
  ];
  
  // Add additional device types for specific scenarios
  if (options.scenario === 'devices' || options.dataVolume === 'large') {
    deviceTypes.push(
      { 
        name: prefixTestData('Advanced Smart Scale', options), 
        description: 'Advanced body composition analysis scale', 
        manufacturer: 'HealthTech',
        supportedMetrics: ['WEIGHT', 'BODY_FAT', 'MUSCLE_MASS', 'HYDRATION']
      },
      { 
        name: prefixTestData('Fitness Tracker', options), 
        description: 'Activity and fitness tracking wristband', 
        manufacturer: 'FitCorp',
        supportedMetrics: ['STEPS', 'HEART_RATE', 'CALORIES_BURNED', 'SLEEP']
      },
      { 
        name: prefixTestData('Sleep Monitor', options), 
        description: 'Dedicated sleep quality monitoring device', 
        manufacturer: 'DreamTech',
        supportedMetrics: ['SLEEP', 'RESPIRATORY_RATE']
      },
      { 
        name: prefixTestData('Pulse Oximeter', options), 
        description: 'Blood oxygen saturation monitor', 
        manufacturer: 'MediCorp',
        supportedMetrics: ['OXYGEN_SATURATION', 'HEART_RATE']
      }
    );
  }
  
  for (const deviceType of deviceTypes) {
    // Extract supported metrics for metadata
    const { supportedMetrics, ...deviceTypeData } = deviceType;
    
    // Create device type with metadata
    await prisma.deviceType.upsert({
      where: { name: deviceTypeData.name },
      update: {},
      create: {
        ...deviceTypeData,
        metadata: JSON.stringify({ supportedMetrics })
      },
    });
  }
  
  if (options.logging) {
    console.log(`Created ${deviceTypes.length} device types`);
  }
}

/**
 * Gets existing test users or creates new ones if needed.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Health seed options
 * @returns Array of user IDs
 */
async function getOrCreateTestUsers(prisma: PrismaClient, options: HealthSeedOptions): Promise<string[]> {
  // Determine number of users to create based on data volume
  const userCount = getUserCountByVolume(options.dataVolume);
  
  // Try to find existing test users first
  const existingUsers = await prisma.user.findMany({
    take: userCount,
    where: options.isolate && options.testPrefix 
      ? { name: { contains: options.testPrefix } }
      : undefined
  });
  
  if (existingUsers.length >= userCount) {
    return existingUsers.map(user => user.id);
  }
  
  // If not enough existing users, create new ones
  const userIds = [...existingUsers.map(user => user.id)];
  const usersToCreate = userCount - existingUsers.length;
  
  if (usersToCreate > 0) {
    if (options.logging) {
      console.log(`Creating ${usersToCreate} test users for Health journey...`);
    }
    
    for (let i = 0; i < usersToCreate; i++) {
      const user = await prisma.user.create({
        data: {
          name: prefixTestData(`Health Test User ${i + 1}`, options),
          email: prefixTestData(`health_user${i + 1}@test.com`, options),
          password: await generateTestPassword(),
          phone: `+551199999${(i + 1).toString().padStart(4, '0')}`,
          cpf: generateRandomCPF(),
        },
      });
      
      userIds.push(user.id);
    }
  }
  
  return userIds;
}

/**
 * Seeds device connections for test users.
 * 
 * @param prisma - The Prisma client instance
 * @param userIds - Array of user IDs
 * @param options - Health seed options
 */
async function seedDeviceConnections(prisma: PrismaClient, userIds: string[], options: HealthSeedOptions): Promise<void> {
  // Get device types
  const deviceTypes = await prisma.deviceType.findMany();
  
  if (deviceTypes.length === 0) {
    if (options.logging) {
      console.log('No device types found, skipping device connections');
    }
    return;
  }
  
  // Determine number of devices per user based on scenario and volume
  let devicesPerUser = 1; // Default for 'small' volume
  
  if (options.scenario === 'devices') {
    devicesPerUser = 4; // More devices for device-focused scenario
  } else if (options.dataVolume === 'medium') {
    devicesPerUser = 2;
  } else if (options.dataVolume === 'large') {
    devicesPerUser = 3;
  }
  
  // Create device connections for each user
  for (const userId of userIds) {
    // Shuffle device types to randomize selection
    const shuffledDeviceTypes = [...deviceTypes].sort(() => Math.random() - 0.5);
    
    // Select a subset of device types based on devicesPerUser
    const selectedDeviceTypes = shuffledDeviceTypes.slice(0, Math.min(devicesPerUser, deviceTypes.length));
    
    for (const deviceType of selectedDeviceTypes) {
      // Create device connection data
      const deviceConnection = {
        userId,
        deviceTypeId: deviceType.id,
        deviceIdentifier: `DEV-${faker.string.alphanumeric(8).toUpperCase()}`,
        name: `${deviceType.name} ${faker.string.alphanumeric(4).toUpperCase()}`,
        connectionStatus: faker.helpers.arrayElement(['CONNECTED', 'DISCONNECTED', 'PAIRING']) as 'CONNECTED' | 'DISCONNECTED' | 'PAIRING',
        lastSyncedAt: faker.date.recent({ days: 7 }),
        authData: JSON.stringify({
          token: faker.string.alphanumeric(24),
          expiresAt: faker.date.future()
        }),
        settings: JSON.stringify({
          syncFrequency: faker.helpers.arrayElement(['realtime', 'hourly', 'daily']),
          notifications: faker.datatype.boolean(),
          dataSharing: faker.datatype.boolean()
        })
      };
      
      // Validate device connection data
      try {
        deviceConnectionSchema.parse(deviceConnection);
        
        // Create the device connection
        await prisma.deviceConnection.create({
          data: deviceConnection
        });
      } catch (error) {
        console.error('Invalid device connection data:', error);
        throw error;
      }
    }
  }
  
  if (options.logging) {
    console.log(`Created ${userIds.length * devicesPerUser} device connections`);
  }
}

/**
 * Seeds health goals for test users.
 * 
 * @param prisma - The Prisma client instance
 * @param userIds - Array of user IDs
 * @param options - Health seed options
 */
async function seedHealthGoals(prisma: PrismaClient, userIds: string[], options: HealthSeedOptions): Promise<void> {
  // Get metric types
  const metricTypes = await prisma.healthMetricType.findMany();
  
  if (metricTypes.length === 0) {
    if (options.logging) {
      console.log('No metric types found, skipping health goals');
    }
    return;
  }
  
  // Determine number of goals per user based on scenario and volume
  let goalsPerUser = 1; // Default for 'small' volume
  
  if (options.scenario === 'goals') {
    goalsPerUser = 5; // More goals for goal-focused scenario
  } else if (options.dataVolume === 'medium') {
    goalsPerUser = 3;
  } else if (options.dataVolume === 'large') {
    goalsPerUser = 5;
  }
  
  // Create health goals for each user
  for (const userId of userIds) {
    // Shuffle metric types to randomize selection
    const shuffledMetricTypes = [...metricTypes].sort(() => Math.random() - 0.5);
    
    // Select a subset of metric types based on goalsPerUser
    const selectedMetricTypes = shuffledMetricTypes.slice(0, Math.min(goalsPerUser, metricTypes.length));
    
    for (const metricType of selectedMetricTypes) {
      // Generate target value based on metric type
      const targetValue = generateTargetValue(metricType.name);
      
      // Create health goal data
      const healthGoal = {
        userId,
        metricTypeId: metricType.id,
        targetValue: targetValue.toString(),
        startDate: faker.date.recent({ days: 30 }),
        endDate: faker.date.future({ days: 30 }),
        status: faker.helpers.arrayElement(['ACTIVE', 'COMPLETED', 'ABANDONED']) as 'ACTIVE' | 'COMPLETED' | 'ABANDONED',
        progress: faker.number.int({ min: 0, max: 100 }),
        frequency: faker.helpers.arrayElement(['DAILY', 'WEEKLY', 'MONTHLY']) as 'DAILY' | 'WEEKLY' | 'MONTHLY',
        reminderEnabled: faker.datatype.boolean(),
        reminderTime: faker.helpers.arrayElement(['08:00', '12:00', '18:00', '21:00']),
        notes: faker.lorem.sentence()
      };
      
      // Validate health goal data
      try {
        healthGoalSchema.parse(healthGoal);
        
        // Create the health goal
        await prisma.healthGoal.create({
          data: healthGoal
        });
      } catch (error) {
        console.error('Invalid health goal data:', error);
        throw error;
      }
    }
  }
  
  if (options.logging) {
    console.log(`Created ${userIds.length * goalsPerUser} health goals`);
  }
}

/**
 * Seeds basic health metrics for test users.
 * 
 * @param prisma - The Prisma client instance
 * @param userIds - Array of user IDs
 * @param options - Health seed options
 */
async function seedBasicHealthMetrics(prisma: PrismaClient, userIds: string[], options: HealthSeedOptions): Promise<void> {
  // Get metric types
  const metricTypes = await prisma.healthMetricType.findMany();
  
  if (metricTypes.length === 0) {
    if (options.logging) {
      console.log('No metric types found, skipping health metrics');
    }
    return;
  }
  
  // Get device connections for data sources
  const deviceConnections = await prisma.deviceConnection.findMany({
    where: {
      userId: { in: userIds },
      connectionStatus: 'CONNECTED'
    }
  });
  
  // Determine number of metrics per type based on volume
  const metricsPerType = getMetricCountByVolume(options.dataVolume);
  
  // Calculate date range
  const { startDate, endDate } = options.dateRange || defaultHealthSeedOptions.dateRange;
  const dateRange = endDate.getTime() - startDate.getTime();
  
  // Create metrics for each user
  for (const userId of userIds) {
    // Get user's connected devices
    const userDevices = deviceConnections.filter(dc => dc.userId === userId);
    
    for (const metricType of metricTypes) {
      // Find a device that supports this metric type (if any)
      const supportingDevice = findDeviceForMetricType(userDevices, metricType.name);
      
      for (let i = 0; i < metricsPerType; i++) {
        // Create a date within the range
        const recordedAt = new Date(startDate.getTime() + Math.random() * dateRange);
        
        // Generate value based on metric type
        const value = generateMetricValue(metricType.name, metricType.normalRangeMin, metricType.normalRangeMax);
        
        // Create health metric data
        const healthMetric = {
          userId,
          typeId: metricType.id,
          value: value.toString(),
          unit: metricType.unit,
          recordedAt,
          source: supportingDevice ? 'device' : 'manual',
          deviceId: supportingDevice?.id,
          notes: i % 5 === 0 ? faker.lorem.sentence() : undefined,
          metadata: JSON.stringify({
            appVersion: '1.0.0',
            recordingMethod: supportingDevice ? 'automatic' : 'manual'
          })
        };
        
        // Validate health metric data
        try {
          healthMetricSchema.parse(healthMetric);
          
          // Create the health metric
          await prisma.healthMetric.create({
            data: healthMetric
          });
        } catch (error) {
          console.error('Invalid health metric data:', error);
          throw error;
        }
      }
    }
  }
  
  if (options.logging) {
    console.log(`Created ${userIds.length * metricTypes.length * metricsPerType} basic health metrics`);
  }
}

/**
 * Seeds health metrics specifically for goal tracking scenarios.
 * 
 * @param prisma - The Prisma client instance
 * @param userIds - Array of user IDs
 * @param options - Health seed options
 */
async function seedHealthMetricsForGoals(prisma: PrismaClient, userIds: string[], options: HealthSeedOptions): Promise<void> {
  // Get health goals
  const healthGoals = await prisma.healthGoal.findMany({
    where: {
      userId: { in: userIds }
    },
    include: {
      metricType: true
    }
  });
  
  if (healthGoals.length === 0) {
    if (options.logging) {
      console.log('No health goals found, skipping goal-specific metrics');
    }
    return;
  }
  
  // Determine number of metrics per goal based on volume
  const metricsPerGoal = getMetricCountByVolume(options.dataVolume);
  
  // Create metrics for each goal
  for (const goal of healthGoals) {
    // Parse target value
    const targetValue = parseFloat(goal.targetValue);
    
    // Generate a progression of values towards the target
    for (let i = 0; i < metricsPerGoal; i++) {
      // Calculate progress percentage
      const progressPercent = (i / metricsPerGoal) * 100;
      
      // Generate value based on progress towards goal
      let value: number;
      
      if (goal.status === 'COMPLETED') {
        // For completed goals, show progression to success
        if (i < metricsPerGoal - 1) {
          value = generateProgressionValue(goal.metricType.name, targetValue, progressPercent);
        } else {
          // Final value meets or exceeds target
          value = targetValue * (1 + Math.random() * 0.1); // Slightly exceed target
        }
      } else if (goal.status === 'ABANDONED') {
        // For abandoned goals, show initial progress then plateau or decline
        if (i < metricsPerGoal / 3) {
          value = generateProgressionValue(goal.metricType.name, targetValue, progressPercent * 2);
        } else {
          // Plateau or decline after initial progress
          const peakValue = generateProgressionValue(goal.metricType.name, targetValue, 66);
          value = peakValue * (1 - (Math.random() * 0.2)); // Decline by up to 20%
        }
      } else { // ACTIVE
        // For active goals, show steady progress
        value = generateProgressionValue(goal.metricType.name, targetValue, progressPercent);
      }
      
      // Create a date within the goal period
      const startTime = goal.startDate.getTime();
      const endTime = goal.endDate ? goal.endDate.getTime() : new Date().getTime();
      const timeRange = endTime - startTime;
      const recordedAt = new Date(startTime + (i / metricsPerGoal) * timeRange);
      
      // Create health metric data
      const healthMetric = {
        userId: goal.userId,
        typeId: goal.metricTypeId,
        value: value.toString(),
        unit: goal.metricType.unit,
        recordedAt,
        source: 'manual',
        notes: i === metricsPerGoal - 1 ? 'Goal tracking measurement' : undefined,
        metadata: JSON.stringify({
          goalId: goal.id,
          progressPercent: Math.min(Math.round(progressPercent), 100)
        })
      };
      
      // Validate health metric data
      try {
        healthMetricSchema.parse(healthMetric);
        
        // Create the health metric
        await prisma.healthMetric.create({
          data: healthMetric
        });
      } catch (error) {
        console.error('Invalid health metric data:', error);
        throw error;
      }
    }
  }
  
  if (options.logging) {
    console.log(`Created ${healthGoals.length * metricsPerGoal} goal-specific health metrics`);
  }
}

/**
 * Seeds health metrics from connected devices.
 * 
 * @param prisma - The Prisma client instance
 * @param userIds - Array of user IDs
 * @param options - Health seed options
 */
async function seedHealthMetricsFromDevices(prisma: PrismaClient, userIds: string[], options: HealthSeedOptions): Promise<void> {
  // Get device connections
  const deviceConnections = await prisma.deviceConnection.findMany({
    where: {
      userId: { in: userIds },
      connectionStatus: 'CONNECTED'
    },
    include: {
      deviceType: true
    }
  });
  
  if (deviceConnections.length === 0) {
    if (options.logging) {
      console.log('No connected devices found, skipping device-specific metrics');
    }
    return;
  }
  
  // Get metric types
  const metricTypes = await prisma.healthMetricType.findMany();
  
  if (metricTypes.length === 0) {
    return;
  }
  
  // Create a map of metric type names to IDs
  const metricTypeMap = new Map();
  metricTypes.forEach(mt => {
    // Remove test prefix if present
    const baseName = options.testPrefix ? 
      mt.name.replace(`${options.testPrefix}_`, '') : 
      mt.name;
    
    metricTypeMap.set(baseName, mt.id);
  });
  
  // Determine number of metrics per device based on volume
  const metricsPerDevice = getMetricCountByVolume(options.dataVolume) * 2; // More metrics for device scenario
  
  // Calculate date range
  const { startDate, endDate } = options.dateRange || defaultHealthSeedOptions.dateRange;
  const dateRange = endDate.getTime() - startDate.getTime();
  
  // Create metrics for each device
  for (const device of deviceConnections) {
    // Parse supported metrics from device metadata
    let supportedMetrics = [];
    try {
      const metadata = JSON.parse(device.deviceType.metadata || '{}');
      supportedMetrics = metadata.supportedMetrics || [];
    } catch (error) {
      console.warn(`Could not parse metadata for device ${device.id}`);
      continue;
    }
    
    // Generate metrics for each supported metric type
    for (const metricName of supportedMetrics) {
      // Find the metric type ID
      const metricTypeId = metricTypeMap.get(metricName);
      if (!metricTypeId) {
        continue;
      }
      
      // Find the metric type for range information
      const metricType = metricTypes.find(mt => mt.id === metricTypeId);
      if (!metricType) {
        continue;
      }
      
      // Generate metrics with timestamps
      for (let i = 0; i < metricsPerDevice; i++) {
        // Create a date within the range
        const recordedAt = new Date(startDate.getTime() + Math.random() * dateRange);
        
        // Generate value based on metric type
        const value = generateMetricValue(metricType.name, metricType.normalRangeMin, metricType.normalRangeMax);
        
        // Create health metric data
        const healthMetric = {
          userId: device.userId,
          typeId: metricTypeId,
          value: value.toString(),
          unit: metricType.unit,
          recordedAt,
          source: 'device',
          deviceId: device.id,
          metadata: JSON.stringify({
            deviceName: device.name,
            deviceIdentifier: device.deviceIdentifier,
            syncBatch: `${device.deviceIdentifier}-${recordedAt.toISOString().split('T')[0]}`,
            accuracy: 0.95 + (Math.random() * 0.05) // 95-100% accuracy
          })
        };
        
        // Validate health metric data
        try {
          healthMetricSchema.parse(healthMetric);
          
          // Create the health metric
          await prisma.healthMetric.create({
            data: healthMetric
          });
        } catch (error) {
          console.error('Invalid health metric data:', error);
          throw error;
        }
      }
    }
  }
  
  if (options.logging) {
    console.log(`Created device-specific health metrics for ${deviceConnections.length} devices`);
  }
}

/**
 * Seeds health metrics with long-term trends.
 * 
 * @param prisma - The Prisma client instance
 * @param userIds - Array of user IDs
 * @param options - Health seed options
 */
async function seedHealthMetricsWithTrends(prisma: PrismaClient, userIds: string[], options: HealthSeedOptions): Promise<void> {
  // Get metric types
  const metricTypes = await prisma.healthMetricType.findMany();
  
  if (metricTypes.length === 0) {
    if (options.logging) {
      console.log('No metric types found, skipping trend metrics');
    }
    return;
  }
  
  // Override date range for trends - use 90 days instead of default 30
  const trendStartDate = new Date();
  trendStartDate.setDate(trendStartDate.getDate() - 90);
  const trendEndDate = new Date();
  
  // Determine number of data points per trend
  const dataPointsPerTrend = options.dataVolume === 'large' ? 90 : 
                             options.dataVolume === 'medium' ? 45 : 30;
  
  // Create trend metrics for each user
  for (const userId of userIds) {
    // Select a subset of metric types for trends
    const trendMetricTypes = metricTypes
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(4, metricTypes.length));
    
    for (const metricType of trendMetricTypes) {
      // Generate trend parameters
      const trendType = faker.helpers.arrayElement([
        'improving', // Steady improvement
        'declining', // Steady decline
        'fluctuating', // Random fluctuations
        'seasonal', // Cyclical pattern
        'stable' // Stable with minor variations
      ]);
      
      // Generate baseline value
      let baselineValue: number;
      if (metricType.normalRangeMin !== null && metricType.normalRangeMax !== null) {
        baselineValue = metricType.normalRangeMin + 
          (Math.random() * (metricType.normalRangeMax - metricType.normalRangeMin));
      } else if (metricType.normalRangeMin !== null) {
        baselineValue = metricType.normalRangeMin * (1 + Math.random());
      } else if (metricType.normalRangeMax !== null) {
        baselineValue = metricType.normalRangeMax * Math.random();
      } else {
        baselineValue = 50 + (Math.random() * 50); // Default 50-100 range
      }
      
      // Generate data points along the trend
      for (let i = 0; i < dataPointsPerTrend; i++) {
        // Calculate progress through the trend (0-1)
        const progress = i / dataPointsPerTrend;
        
        // Calculate date for this data point
        const dayOffset = Math.floor(progress * 90); // 0-90 days
        const recordedAt = new Date(trendStartDate.getTime());
        recordedAt.setDate(recordedAt.getDate() + dayOffset);
        
        // Calculate value based on trend type
        let value: number;
        
        switch (trendType) {
          case 'improving':
            // Steady improvement - up to 30% better by the end
            value = baselineValue * (1 + (progress * 0.3));
            break;
          case 'declining':
            // Steady decline - up to 30% worse by the end
            value = baselineValue * (1 - (progress * 0.3));
            break;
          case 'fluctuating':
            // Random fluctuations - ±20% around baseline
            value = baselineValue * (0.8 + (Math.random() * 0.4));
            break;
          case 'seasonal':
            // Cyclical pattern - sine wave with 3 cycles over period
            value = baselineValue * (1 + 0.15 * Math.sin(progress * Math.PI * 6));
            break;
          case 'stable':
          default:
            // Stable with minor variations - ±5% around baseline
            value = baselineValue * (0.95 + (Math.random() * 0.1));
            break;
        }
        
        // Create health metric data
        const healthMetric = {
          userId,
          typeId: metricType.id,
          value: value.toString(),
          unit: metricType.unit,
          recordedAt,
          source: 'manual',
          metadata: JSON.stringify({
            trendType,
            trendDay: dayOffset,
            baselineValue
          })
        };
        
        // Validate health metric data
        try {
          healthMetricSchema.parse(healthMetric);
          
          // Create the health metric
          await prisma.healthMetric.create({
            data: healthMetric
          });
        } catch (error) {
          console.error('Invalid health metric data:', error);
          throw error;
        }
      }
    }
  }
  
  if (options.logging) {
    console.log(`Created trend health metrics for ${userIds.length} users`);
  }
}

/**
 * Seeds health metrics with anomalies for testing alerts.
 * 
 * @param prisma - The Prisma client instance
 * @param userIds - Array of user IDs
 * @param options - Health seed options
 */
async function seedHealthMetricsWithAnomalies(prisma: PrismaClient, userIds: string[], options: HealthSeedOptions): Promise<void> {
  // Get metric types
  const metricTypes = await prisma.healthMetricType.findMany();
  
  if (metricTypes.length === 0) {
    if (options.logging) {
      console.log('No metric types found, skipping anomaly metrics');
    }
    return;
  }
  
  // Calculate date range
  const { startDate, endDate } = options.dateRange || defaultHealthSeedOptions.dateRange;
  const dateRange = endDate.getTime() - startDate.getTime();
  
  // Determine number of metrics per type based on volume
  const normalMetricsPerType = getMetricCountByVolume(options.dataVolume);
  
  // Number of anomalies to introduce
  const anomaliesPerUser = options.dataVolume === 'large' ? 5 : 
                          options.dataVolume === 'medium' ? 3 : 1;
  
  // Create metrics for each user
  for (const userId of userIds) {
    // Select a subset of metric types for anomalies
    const anomalyMetricTypes = metricTypes
      .filter(mt => mt.normalRangeMin !== null || mt.normalRangeMax !== null) // Only use metrics with defined ranges
      .sort(() => Math.random() - 0.5)
      .slice(0, anomaliesPerUser);
    
    // Create normal metrics with occasional anomalies
    for (const metricType of metricTypes) {
      const isAnomalyType = anomalyMetricTypes.some(amt => amt.id === metricType.id);
      
      for (let i = 0; i < normalMetricsPerType; i++) {
        // Create a date within the range
        const recordedAt = new Date(startDate.getTime() + Math.random() * dateRange);
        
        // Determine if this should be an anomaly
        const isAnomaly = isAnomalyType && i === normalMetricsPerType - 1;
        
        // Generate value based on whether this is an anomaly
        let value: number;
        if (isAnomaly) {
          value = generateAnomalyValue(metricType.name, metricType.normalRangeMin, metricType.normalRangeMax);
        } else {
          value = generateMetricValue(metricType.name, metricType.normalRangeMin, metricType.normalRangeMax);
        }
        
        // Create health metric data
        const healthMetric = {
          userId,
          typeId: metricType.id,
          value: value.toString(),
          unit: metricType.unit,
          recordedAt,
          source: 'manual',
          notes: isAnomaly ? 'Unusual reading - please verify' : undefined,
          metadata: JSON.stringify({
            isAnomaly,
            severity: isAnomaly ? 'high' : 'normal',
            needsAttention: isAnomaly
          })
        };
        
        // Validate health metric data
        try {
          healthMetricSchema.parse(healthMetric);
          
          // Create the health metric
          await prisma.healthMetric.create({
            data: healthMetric
          });
        } catch (error) {
          console.error('Invalid health metric data:', error);
          throw error;
        }
      }
    }
  }
  
  if (options.logging) {
    console.log(`Created health metrics with anomalies for ${userIds.length} users`);
  }
}

/**
 * Prefixes test data with the test prefix if isolation is enabled.
 * 
 * @param value - The value to prefix
 * @param options - Health seed options
 * @returns The prefixed value if isolation is enabled, otherwise the original value
 */
function prefixTestData(value: string, options: HealthSeedOptions): string {
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
      return 5;
    case 'large':
      return 10;
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
      return 5;
    case 'medium':
      return 15;
    case 'large':
      return 30;
    default:
      return 5;
  }
}

/**
 * Generates a random CPF (Brazilian tax ID).
 * 
 * @returns A random CPF string
 */
function generateRandomCPF(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  // Calculate first verification digit
  let sum = digits.reduce((acc, digit, index) => acc + digit * (10 - index), 0);
  const firstVerificationDigit = (sum % 11 < 2) ? 0 : 11 - (sum % 11);
  digits.push(firstVerificationDigit);
  
  // Calculate second verification digit
  sum = digits.reduce((acc, digit, index) => acc + digit * (11 - index), 0);
  const secondVerificationDigit = (sum % 11 < 2) ? 0 : 11 - (sum % 11);
  digits.push(secondVerificationDigit);
  
  return digits.join('');
}

/**
 * Generates a test password.
 * 
 * @returns A hashed password for test users
 */
async function generateTestPassword(): Promise<string> {
  // In a real implementation, this would use bcrypt or similar
  // For this test file, we'll just return a placeholder
  return 'TestPassword123!';
}

/**
 * Generates a target value for a health goal based on metric type.
 * 
 * @param metricType - The metric type name
 * @returns A target value appropriate for the metric type
 */
function generateTargetValue(metricType: string): number {
  // Remove test prefix if present
  const cleanMetricType = metricType.includes('_') ? 
    metricType.split('_').slice(1).join('_') : 
    metricType;
  
  switch (cleanMetricType) {
    case 'HEART_RATE':
      return 70; // Target heart rate of 70 bpm
    case 'BLOOD_PRESSURE_SYSTOLIC':
      return 120; // Target systolic BP of 120 mmHg
    case 'BLOOD_PRESSURE_DIASTOLIC':
      return 80; // Target diastolic BP of 80 mmHg
    case 'BLOOD_GLUCOSE':
      return 90; // Target blood glucose of 90 mg/dL
    case 'STEPS':
      return 10000; // Target 10,000 steps per day
    case 'WEIGHT':
      return 70 + Math.floor(Math.random() * 20); // Target weight between 70-90 kg
    case 'SLEEP':
      return 8; // Target 8 hours of sleep
    case 'OXYGEN_SATURATION':
      return 98; // Target 98% oxygen saturation
    case 'BODY_TEMPERATURE':
      return 36.5; // Target body temperature of 36.5°C
    case 'RESPIRATORY_RATE':
      return 16; // Target respiratory rate of 16 breaths/min
    case 'BODY_FAT':
      return 20; // Target 20% body fat
    case 'MUSCLE_MASS':
      return 30 + Math.floor(Math.random() * 10); // Target muscle mass between 30-40 kg
    case 'HYDRATION':
      return 60; // Target 60% hydration
    case 'STRESS_LEVEL':
      return 15; // Target stress level of 15 (moderate)
    case 'CALORIES_BURNED':
      return 2000; // Target 2000 calories burned per day
    default:
      return 100; // Default target value
  }
}

/**
 * Generates a metric value based on metric type and normal range.
 * 
 * @param metricType - The metric type name
 * @param minRange - The minimum normal range value
 * @param maxRange - The maximum normal range value
 * @returns A value appropriate for the metric type within normal range
 */
function generateMetricValue(metricType: string, minRange: number | null, maxRange: number | null): number {
  // Remove test prefix if present
  const cleanMetricType = metricType.includes('_') ? 
    metricType.split('_').slice(1).join('_') : 
    metricType;
  
  // If both min and max range are provided, generate a value within that range
  if (minRange !== null && maxRange !== null) {
    return minRange + Math.random() * (maxRange - minRange);
  }
  
  // Otherwise, use metric-specific logic
  switch (cleanMetricType) {
    case 'HEART_RATE':
      return 60 + Math.random() * 40; // 60-100 bpm
    case 'BLOOD_PRESSURE_SYSTOLIC':
      return 90 + Math.random() * 30; // 90-120 mmHg
    case 'BLOOD_PRESSURE_DIASTOLIC':
      return 60 + Math.random() * 20; // 60-80 mmHg
    case 'BLOOD_GLUCOSE':
      return 70 + Math.random() * 30; // 70-100 mg/dL
    case 'STEPS':
      return 2000 + Math.random() * 8000; // 2000-10000 steps
    case 'WEIGHT':
      return 50 + Math.random() * 50; // 50-100 kg
    case 'SLEEP':
      return 5 + Math.random() * 4; // 5-9 hours
    case 'OXYGEN_SATURATION':
      return 95 + Math.random() * 5; // 95-100%
    case 'BODY_TEMPERATURE':
      return 36.1 + Math.random() * 1.1; // 36.1-37.2°C
    case 'RESPIRATORY_RATE':
      return 12 + Math.random() * 8; // 12-20 breaths/min
    case 'BODY_FAT':
      return 10 + Math.random() * 15; // 10-25%
    case 'MUSCLE_MASS':
      return 25 + Math.random() * 20; // 25-45 kg
    case 'HYDRATION':
      return 45 + Math.random() * 20; // 45-65%
    case 'STRESS_LEVEL':
      return Math.random() * 25; // 0-25 score
    case 'CALORIES_BURNED':
      return 1500 + Math.random() * 1500; // 1500-3000 kcal
    default:
      return Math.random() * 100; // 0-100 default range
  }
}

/**
 * Generates an anomaly value outside the normal range for testing alerts.
 * 
 * @param metricType - The metric type name
 * @param minRange - The minimum normal range value
 * @param maxRange - The maximum normal range value
 * @returns A value outside the normal range
 */
function generateAnomalyValue(metricType: string, minRange: number | null, maxRange: number | null): number {
  // Remove test prefix if present
  const cleanMetricType = metricType.includes('_') ? 
    metricType.split('_').slice(1).join('_') : 
    metricType;
  
  // Determine if we should go below or above the normal range
  const goHigh = Math.random() > 0.5;
  
  // If both min and max range are provided
  if (minRange !== null && maxRange !== null) {
    if (goHigh) {
      return maxRange * (1.2 + Math.random() * 0.3); // 20-50% above max
    } else {
      return minRange * (0.5 + Math.random() * 0.3); // 20-50% below min
    }
  }
  
  // If only min range is provided
  if (minRange !== null && maxRange === null) {
    if (goHigh) {
      return minRange * (2 + Math.random()); // 200-300% of min
    } else {
      return minRange * (0.5 + Math.random() * 0.3); // 20-50% below min
    }
  }
  
  // If only max range is provided
  if (minRange === null && maxRange !== null) {
    if (goHigh) {
      return maxRange * (1.2 + Math.random() * 0.3); // 20-50% above max
    } else {
      return maxRange * (0.2 + Math.random() * 0.2); // 20-40% of max
    }
  }
  
  // Otherwise, use metric-specific logic
  switch (cleanMetricType) {
    case 'HEART_RATE':
      return goHigh ? 120 + Math.random() * 40 : 40 - Math.random() * 10; // High: 120-160, Low: 30-40
    case 'BLOOD_PRESSURE_SYSTOLIC':
      return goHigh ? 140 + Math.random() * 40 : 80 - Math.random() * 10; // High: 140-180, Low: 70-80
    case 'BLOOD_PRESSURE_DIASTOLIC':
      return goHigh ? 90 + Math.random() * 20 : 50 - Math.random() * 10; // High: 90-110, Low: 40-50
    case 'BLOOD_GLUCOSE':
      return goHigh ? 140 + Math.random() * 60 : 50 - Math.random() * 10; // High: 140-200, Low: 40-50
    case 'OXYGEN_SATURATION':
      return 85 + Math.random() * 7; // 85-92% (below normal)
    case 'BODY_TEMPERATURE':
      return goHigh ? 38 + Math.random() * 2 : 35 - Math.random() * 1; // High: 38-40, Low: 34-35
    case 'RESPIRATORY_RATE':
      return goHigh ? 25 + Math.random() * 10 : 8 - Math.random() * 2; // High: 25-35, Low: 6-8
    default:
      // For other metrics, just double or halve the normal value
      const normalValue = generateMetricValue(metricType, minRange, maxRange);
      return goHigh ? normalValue * 2 : normalValue * 0.5;
  }
}

/**
 * Generates a value showing progression towards a target.
 * 
 * @param metricType - The metric type name
 * @param targetValue - The target value to progress towards
 * @param progressPercent - The percentage of progress (0-100)
 * @returns A value showing appropriate progression towards the target
 */
function generateProgressionValue(metricType: string, targetValue: number, progressPercent: number): number {
  // Remove test prefix if present
  const cleanMetricType = metricType.includes('_') ? 
    metricType.split('_').slice(1).join('_') : 
    metricType;
  
  // Get a baseline starting value
  let startValue: number;
  
  switch (cleanMetricType) {
    case 'STEPS':
      startValue = 2000; // Start at 2000 steps
      break;
    case 'WEIGHT':
      // For weight loss goals, start higher; for weight gain, start lower
      if (targetValue < 70) {
        startValue = targetValue * 1.2; // Start 20% above target for weight loss
      } else {
        startValue = targetValue * 0.9; // Start 10% below target for weight gain
      }
      break;
    case 'BODY_FAT':
      startValue = targetValue * 1.3; // Start 30% above target
      break;
    case 'MUSCLE_MASS':
      startValue = targetValue * 0.8; // Start 20% below target
      break;
    default:
      // For other metrics, start halfway between normal and target
      const normalValue = generateMetricValue(metricType, null, null);
      startValue = normalValue + ((targetValue - normalValue) * 0.5);
  }
  
  // Calculate value based on progress percentage
  return startValue + ((targetValue - startValue) * (progressPercent / 100));
}

/**
 * Finds a device that supports a specific metric type.
 * 
 * @param devices - Array of device connections
 * @param metricTypeName - The metric type name to check support for
 * @returns A device that supports the metric type, or undefined if none found
 */
function findDeviceForMetricType(devices: any[], metricTypeName: string): any | undefined {
  // Remove test prefix if present
  const cleanMetricType = metricTypeName.includes('_') ? 
    metricTypeName.split('_').slice(1).join('_') : 
    metricTypeName;
  
  return devices.find(device => {
    try {
      const metadata = JSON.parse(device.deviceType?.metadata || '{}');
      const supportedMetrics = metadata.supportedMetrics || [];
      return supportedMetrics.includes(cleanMetricType);
    } catch (error) {
      return false;
    }
  });
}

// Export utility functions for testing
export {
  generateMetricValue,
  generateAnomalyValue,
  generateProgressionValue,
  generateTargetValue,
  prefixTestData,
  getUserCountByVolume,
  getMetricCountByVolume
};