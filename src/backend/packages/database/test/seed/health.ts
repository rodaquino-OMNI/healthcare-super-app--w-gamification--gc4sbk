/**
 * @file Health Journey Seed Functions
 * 
 * Contains seed functions for the Health journey ("Minha Saúde") test data,
 * including health metrics, goals, device connections, and medical events.
 */

import { PrismaClient } from '@prisma/client';
import { HealthContext } from '../../src/contexts/health.context';
import { TestSeedOptions, prefixTestData, getCountByVolume, handleSeedError } from './types';

/**
 * Seeds Health Journey test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param healthContext - Optional HealthContext instance for optimized operations
 */
export async function seedHealthJourneyData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  healthContext?: HealthContext
): Promise<void> {
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
      // Use health context if available for optimized operations
      if (healthContext) {
        await healthContext.upsertMetricType(metricType);
      } else {
        await prisma.healthMetricType.upsert({
          where: { name: metricType.name },
          update: {},
          create: metricType,
        });
      }
    }
    
    // Sample device types
    const deviceTypes = [
      { name: prefixTestData('Smartwatch', options), description: 'Wearable smartwatch device', manufacturer: 'Various' },
      { name: prefixTestData('Blood Pressure Monitor', options), description: 'Blood pressure monitoring device', manufacturer: 'Various' },
      { name: prefixTestData('Glucose Monitor', options), description: 'Blood glucose monitoring device', manufacturer: 'Various' },
      { name: prefixTestData('Smart Scale', options), description: 'Weight and body composition scale', manufacturer: 'Various' },
    ];
    
    for (const deviceType of deviceTypes) {
      // Use health context if available for optimized operations
      if (healthContext) {
        await healthContext.upsertDeviceType(deviceType);
      } else {
        await prisma.deviceType.upsert({
          where: { name: deviceType.name },
          update: {},
          create: deviceType,
        });
      }
    }
    
    // Create health metrics data based on volume
    if (options.dataVolume !== 'small') {
      await seedHealthMetricsData(prisma, options, healthContext);
    }
    
    // Create health goals based on volume
    if (options.dataVolume !== 'small') {
      await seedHealthGoalsData(prisma, options, healthContext);
    }
    
    // Create device connections based on volume
    if (options.dataVolume !== 'small') {
      await seedDeviceConnectionsData(prisma, options, healthContext);
    }
    
    if (options.logging) {
      console.log(`Created health journey test data: ${metricTypes.length} metric types, ${deviceTypes.length} device types`);
    }
  } catch (error) {
    if (options.errorHandling === 'throw') {
      throw error;
    } else if (options.errorHandling === 'log') {
      console.error(`Error seeding health journey test data:`, error);
    }
  }
}

/**
 * Seeds health metrics data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param healthContext - Optional HealthContext instance for optimized operations
 */
export async function seedHealthMetricsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  healthContext?: HealthContext
): Promise<void> {
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
      
      // Use transaction for better performance if health context is available
      if (healthContext) {
        await healthContext.transaction(async (tx) => {
          await createMetricsForUser(tx, user, metricType, metricsPerType, options);
        });
      } else {
        await createMetricsForUser(prisma, user, metricType, metricsPerType, options);
      }
    }
  }
}

/**
 * Creates health metrics for a user.
 * 
 * @param prisma - The Prisma client instance or transaction
 * @param user - The user to create metrics for
 * @param metricType - The metric type
 * @param count - The number of metrics to create
 * @param options - Test seed options
 */
async function createMetricsForUser(prisma: any, user: any, metricType: any, count: number, options: TestSeedOptions): Promise<void> {
  for (let i = 0; i < count; i++) {
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

/**
 * Seeds health goals data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param healthContext - Optional HealthContext instance for optimized operations
 */
export async function seedHealthGoalsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  healthContext?: HealthContext
): Promise<void> {
  // Implementation depends on data volume
  const goalCount = getGoalCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${goalCount} health goals per user...`);
  }
  
  // Get users
  const users = await prisma.user.findMany({
    take: 5, // Limit to 5 users for goals
  });
  
  // Get metric types
  const metricTypes = await prisma.healthMetricType.findMany();
  
  if (users.length === 0 || metricTypes.length === 0) {
    return;
  }
  
  // Create goals for each user
  for (const user of users) {
    // Create goals for a subset of metric types
    const selectedMetricTypes = metricTypes
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(goalCount, metricTypes.length));
    
    for (const metricType of selectedMetricTypes) {
      // Generate target value based on metric type
      let targetValue: number;
      switch (metricType.name) {
        case 'HEART_RATE':
        case prefixTestData('HEART_RATE', options):
          targetValue = 70; // Target heart rate
          break;
        case 'BLOOD_GLUCOSE':
        case prefixTestData('BLOOD_GLUCOSE', options):
          targetValue = 90; // Target blood glucose
          break;
        case 'STEPS':
        case prefixTestData('STEPS', options):
          targetValue = 10000; // Target steps
          break;
        case 'WEIGHT':
        case prefixTestData('WEIGHT', options):
          targetValue = 70; // Target weight
          break;
        case 'SLEEP':
        case prefixTestData('SLEEP', options):
          targetValue = 8; // Target sleep hours
          break;
        default:
          targetValue = 100;
      }
      
      // Create the goal
      const goalData = {
        userId: user.id,
        typeId: metricType.id,
        targetValue: targetValue.toString(),
        unit: metricType.unit,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
        status: Math.random() > 0.3 ? 'ACTIVE' : 'COMPLETED', // 70% active, 30% completed
        progress: Math.floor(Math.random() * 100), // Random progress
      };
      
      // Use health context if available for optimized operations
      if (healthContext) {
        await healthContext.createHealthGoal(goalData);
      } else {
        await prisma.healthGoal.create({ data: goalData });
      }
    }
  }
}

/**
 * Seeds device connections data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param healthContext - Optional HealthContext instance for optimized operations
 */
export async function seedDeviceConnectionsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  healthContext?: HealthContext
): Promise<void> {
  // Implementation depends on data volume
  const deviceCount = getDeviceCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${deviceCount} device connections per user...`);
  }
  
  // Get users
  const users = await prisma.user.findMany({
    take: 5, // Limit to 5 users for device connections
  });
  
  // Get device types
  const deviceTypes = await prisma.deviceType.findMany();
  
  if (users.length === 0 || deviceTypes.length === 0) {
    return;
  }
  
  // Create device connections for each user
  for (const user of users) {
    // Create connections for a subset of device types
    const selectedDeviceTypes = deviceTypes
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(deviceCount, deviceTypes.length));
    
    for (const deviceType of selectedDeviceTypes) {
      // Create the device connection
      const deviceData = {
        userId: user.id,
        typeId: deviceType.id,
        deviceIdentifier: `${deviceType.name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 1000000)}`,
        connectionStatus: Math.random() > 0.2 ? 'CONNECTED' : 'DISCONNECTED', // 80% connected, 20% disconnected
        lastSyncAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Random date in last 7 days
        metadata: JSON.stringify({
          manufacturer: deviceType.manufacturer,
          model: `Model ${Math.floor(Math.random() * 10) + 1}`,
          firmware: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        }),
      };
      
      // Use health context if available for optimized operations
      if (healthContext) {
        await healthContext.createDeviceConnection(deviceData);
      } else {
        await prisma.deviceConnection.create({ data: deviceData });
      }
    }
  }
}

/**
 * Gets the number of metrics to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of metrics to create
 */
function getMetricCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 30, 100);
}

/**
 * Gets the number of goals to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of goals to create
 */
function getGoalCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 3, 6);
}

/**
 * Gets the number of device connections to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of device connections to create
 */
function getDeviceCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 2, 4);
}