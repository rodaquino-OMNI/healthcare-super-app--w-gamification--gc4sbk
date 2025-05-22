import { v4 as uuidv4 } from 'uuid';

/**
 * Enum representing the types of health metrics that can be tracked.
 * Extracted from the health service for standardized test fixtures.
 */
export enum MetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  WEIGHT = 'WEIGHT',
  SLEEP = 'SLEEP'
}

/**
 * Enum representing the sources of health metric data.
 */
export enum MetricSource {
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  WEARABLE_DEVICE = 'WEARABLE_DEVICE',
  MEDICAL_DEVICE = 'MEDICAL_DEVICE',
  HEALTH_PROVIDER = 'HEALTH_PROVIDER',
  THIRD_PARTY_API = 'THIRD_PARTY_API'
}

/**
 * Interface representing a health metric for testing purposes.
 */
export interface HealthMetric {
  id: string;
  userId: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  source: MetricSource;
  notes: string | null;
  trend: number | null;
  isAbnormal: boolean;
}

/**
 * Interface representing the normal range for a health metric.
 */
export interface MetricRange {
  min: number | null;
  max: number | null;
  unit: string;
}

/**
 * Map of metric types to their normal ranges.
 */
export const METRIC_RANGES: Record<MetricType, MetricRange> = {
  [MetricType.HEART_RATE]: { min: 60, max: 100, unit: 'bpm' },
  [MetricType.BLOOD_PRESSURE]: { min: null, max: null, unit: 'mmHg' }, // Special case, handled separately
  [MetricType.BLOOD_GLUCOSE]: { min: 70, max: 100, unit: 'mg/dL' },
  [MetricType.STEPS]: { min: 5000, max: null, unit: 'steps' },
  [MetricType.WEIGHT]: { min: null, max: null, unit: 'kg' }, // Depends on individual
  [MetricType.SLEEP]: { min: 7, max: 9, unit: 'hours' }
};

/**
 * Options for creating a health metric fixture.
 */
export interface CreateHealthMetricOptions {
  userId?: string;
  timestamp?: Date;
  source?: MetricSource;
  notes?: string | null;
  trend?: number | null;
  isAbnormal?: boolean;
  value?: number; // Override the default value
}

/**
 * Base function to create a health metric fixture with default values.
 * 
 * @param type The type of health metric
 * @param options Optional parameters to customize the health metric
 * @returns A health metric fixture
 */
export function createHealthMetric(
  type: MetricType,
  options: CreateHealthMetricOptions = {}
): HealthMetric {
  const range = METRIC_RANGES[type];
  
  // Generate a value within the normal range if not provided
  let value = options.value;
  if (value === undefined) {
    if (range.min !== null && range.max !== null) {
      // Random value within range
      value = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    } else if (range.min !== null) {
      // Random value above minimum
      value = range.min + Math.floor(Math.random() * 20);
    } else if (range.max !== null) {
      // Random value below maximum
      value = Math.floor(Math.random() * range.max);
    } else {
      // Fallback for no range
      value = 0;
    }
  }

  // Determine if the value is abnormal based on the range
  let isAbnormal = options.isAbnormal;
  if (isAbnormal === undefined && range.min !== null && range.max !== null) {
    isAbnormal = value < range.min || value > range.max;
  } else if (isAbnormal === undefined && range.min !== null) {
    isAbnormal = value < range.min;
  } else if (isAbnormal === undefined && range.max !== null) {
    isAbnormal = value > range.max;
  } else if (isAbnormal === undefined) {
    isAbnormal = false;
  }

  return {
    id: uuidv4(),
    userId: options.userId || uuidv4(),
    type,
    value,
    unit: range.unit,
    timestamp: options.timestamp || new Date(),
    source: options.source || MetricSource.MANUAL_ENTRY,
    notes: options.notes || null,
    trend: options.trend || null,
    isAbnormal
  };
}

/**
 * Creates a heart rate metric fixture.
 * 
 * @param options Optional parameters to customize the heart rate metric
 * @returns A heart rate metric fixture
 */
export function createHeartRateMetric(options: CreateHealthMetricOptions = {}): HealthMetric {
  return createHealthMetric(MetricType.HEART_RATE, options);
}

/**
 * Options specific to blood pressure metrics.
 */
export interface BloodPressureOptions extends CreateHealthMetricOptions {
  systolic?: number;
  diastolic?: number;
}

/**
 * Creates a blood pressure metric fixture.
 * Blood pressure is a special case as it has two values: systolic and diastolic.
 * 
 * @param options Optional parameters to customize the blood pressure metric
 * @returns A blood pressure metric fixture
 */
export function createBloodPressureMetric(options: BloodPressureOptions = {}): HealthMetric {
  const systolic = options.systolic || Math.floor(Math.random() * (140 - 100 + 1)) + 100;
  const diastolic = options.diastolic || Math.floor(Math.random() * (90 - 60 + 1)) + 60;
  
  // Blood pressure is typically represented as systolic/diastolic
  const value = systolic * 1000 + diastolic; // Store as a single number for database compatibility
  const isAbnormal = options.isAbnormal !== undefined ? options.isAbnormal : 
    (systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60);
  
  const metric = createHealthMetric(MetricType.BLOOD_PRESSURE, {
    ...options,
    value,
    isAbnormal,
    notes: options.notes || `${systolic}/${diastolic} mmHg`
  });
  
  return metric;
}

/**
 * Creates a blood glucose metric fixture.
 * 
 * @param options Optional parameters to customize the blood glucose metric
 * @returns A blood glucose metric fixture
 */
export function createBloodGlucoseMetric(options: CreateHealthMetricOptions = {}): HealthMetric {
  return createHealthMetric(MetricType.BLOOD_GLUCOSE, options);
}

/**
 * Creates a steps metric fixture.
 * 
 * @param options Optional parameters to customize the steps metric
 * @returns A steps metric fixture
 */
export function createStepsMetric(options: CreateHealthMetricOptions = {}): HealthMetric {
  return createHealthMetric(MetricType.STEPS, options);
}

/**
 * Creates a weight metric fixture.
 * 
 * @param options Optional parameters to customize the weight metric
 * @returns A weight metric fixture
 */
export function createWeightMetric(options: CreateHealthMetricOptions = {}): HealthMetric {
  // Default to a reasonable weight if not provided
  const defaultOptions = { value: options.value || 70 };
  return createHealthMetric(MetricType.WEIGHT, { ...defaultOptions, ...options });
}

/**
 * Creates a sleep metric fixture.
 * 
 * @param options Optional parameters to customize the sleep metric
 * @returns A sleep metric fixture
 */
export function createSleepMetric(options: CreateHealthMetricOptions = {}): HealthMetric {
  return createHealthMetric(MetricType.SLEEP, options);
}

/**
 * Creates a collection of health metrics for a user over a period of time.
 * 
 * @param userId The user ID to create metrics for
 * @param days The number of days to create metrics for
 * @param options Optional parameters to customize the metrics
 * @returns An array of health metrics
 */
export function createUserHealthHistory(
  userId: string,
  days: number = 7,
  options: {
    includeHeartRate?: boolean;
    includeBloodPressure?: boolean;
    includeBloodGlucose?: boolean;
    includeSteps?: boolean;
    includeWeight?: boolean;
    includeSleep?: boolean;
  } = {
    includeHeartRate: true,
    includeBloodPressure: true,
    includeBloodGlucose: true,
    includeSteps: true,
    includeWeight: true,
    includeSleep: true
  }
): HealthMetric[] {
  const metrics: HealthMetric[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Morning metrics
    const morning = new Date(date);
    morning.setHours(8, 0, 0, 0);
    
    // Evening metrics
    const evening = new Date(date);
    evening.setHours(20, 0, 0, 0);
    
    if (options.includeHeartRate) {
      // Morning heart rate
      metrics.push(createHeartRateMetric({
        userId,
        timestamp: morning,
        source: MetricSource.WEARABLE_DEVICE
      }));
      
      // Evening heart rate
      metrics.push(createHeartRateMetric({
        userId,
        timestamp: evening,
        source: MetricSource.WEARABLE_DEVICE
      }));
    }
    
    if (options.includeBloodPressure) {
      // Morning blood pressure
      metrics.push(createBloodPressureMetric({
        userId,
        timestamp: morning,
        source: MetricSource.MEDICAL_DEVICE
      }));
    }
    
    if (options.includeBloodGlucose) {
      // Morning blood glucose (fasting)
      metrics.push(createBloodGlucoseMetric({
        userId,
        timestamp: morning,
        source: MetricSource.MEDICAL_DEVICE,
        notes: 'Fasting'
      }));
      
      // Evening blood glucose (after dinner)
      metrics.push(createBloodGlucoseMetric({
        userId,
        timestamp: evening,
        source: MetricSource.MEDICAL_DEVICE,
        notes: 'After dinner'
      }));
    }
    
    if (options.includeSteps) {
      // Daily steps
      const stepsTimestamp = new Date(date);
      stepsTimestamp.setHours(23, 59, 0, 0);
      metrics.push(createStepsMetric({
        userId,
        timestamp: stepsTimestamp,
        source: MetricSource.WEARABLE_DEVICE,
        value: 7000 + Math.floor(Math.random() * 5000) // Random steps between 7000-12000
      }));
    }
    
    if (options.includeWeight && i % 3 === 0) { // Weight every 3 days
      metrics.push(createWeightMetric({
        userId,
        timestamp: morning,
        source: MetricSource.MEDICAL_DEVICE
      }));
    }
    
    if (options.includeSleep) {
      // Sleep duration from previous night
      const sleepTimestamp = new Date(date);
      sleepTimestamp.setHours(7, 0, 0, 0);
      metrics.push(createSleepMetric({
        userId,
        timestamp: sleepTimestamp,
        source: MetricSource.WEARABLE_DEVICE
      }));
    }
  }
  
  return metrics;
}

/**
 * Predefined test scenarios for health metrics.
 */
export const healthMetricScenarios = {
  /**
   * Normal health metrics for a healthy user.
   */
  healthyUser: {
    userId: uuidv4(),
    heartRate: createHeartRateMetric({ value: 72 }),
    bloodPressure: createBloodPressureMetric({ systolic: 120, diastolic: 80 }),
    bloodGlucose: createBloodGlucoseMetric({ value: 85 }),
    steps: createStepsMetric({ value: 10000 }),
    weight: createWeightMetric({ value: 70 }),
    sleep: createSleepMetric({ value: 8 })
  },
  
  /**
   * Abnormal health metrics for testing edge cases.
   */
  abnormalReadings: {
    userId: uuidv4(),
    highHeartRate: createHeartRateMetric({ value: 110, isAbnormal: true }),
    lowHeartRate: createHeartRateMetric({ value: 45, isAbnormal: true }),
    highBloodPressure: createBloodPressureMetric({ systolic: 160, diastolic: 95, isAbnormal: true }),
    lowBloodPressure: createBloodPressureMetric({ systolic: 85, diastolic: 55, isAbnormal: true }),
    highBloodGlucose: createBloodGlucoseMetric({ value: 180, isAbnormal: true }),
    lowBloodGlucose: createBloodGlucoseMetric({ value: 60, isAbnormal: true }),
    lowSteps: createStepsMetric({ value: 2000, isAbnormal: true }),
    highWeight: createWeightMetric({ value: 120, isAbnormal: true }),
    lowWeight: createWeightMetric({ value: 40, isAbnormal: true }),
    lowSleep: createSleepMetric({ value: 4, isAbnormal: true }),
    highSleep: createSleepMetric({ value: 12, isAbnormal: true })
  },
  
  /**
   * Health metrics with trends for testing visualization components.
   */
  trendsOverTime: {
    userId: uuidv4(),
    improvingHeartRate: [
      createHeartRateMetric({ value: 88, trend: null, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }),
      createHeartRateMetric({ value: 85, trend: -3.4, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }),
      createHeartRateMetric({ value: 82, trend: -3.5, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }),
      createHeartRateMetric({ value: 80, trend: -2.4, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }),
      createHeartRateMetric({ value: 78, trend: -2.5, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }),
      createHeartRateMetric({ value: 75, trend: -3.8, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }),
      createHeartRateMetric({ value: 72, trend: -4.0, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) })
    ],
    fluctuatingBloodGlucose: [
      createBloodGlucoseMetric({ value: 95, trend: null, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }),
      createBloodGlucoseMetric({ value: 110, trend: 15.8, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }),
      createBloodGlucoseMetric({ value: 90, trend: -18.2, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }),
      createBloodGlucoseMetric({ value: 105, trend: 16.7, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }),
      createBloodGlucoseMetric({ value: 85, trend: -19.0, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }),
      createBloodGlucoseMetric({ value: 100, trend: 17.6, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }),
      createBloodGlucoseMetric({ value: 88, trend: -12.0, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) })
    ],
    increasingSteps: [
      createStepsMetric({ value: 5000, trend: null, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }),
      createStepsMetric({ value: 5500, trend: 10.0, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }),
      createStepsMetric({ value: 6200, trend: 12.7, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }),
      createStepsMetric({ value: 7000, trend: 12.9, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }),
      createStepsMetric({ value: 7800, trend: 11.4, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }),
      createStepsMetric({ value: 8500, trend: 9.0, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }),
      createStepsMetric({ value: 10000, trend: 17.6, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) })
    ]
  },
  
  /**
   * Health metrics from different sources for testing source filtering.
   */
  differentSources: {
    userId: uuidv4(),
    manualHeartRate: createHeartRateMetric({ source: MetricSource.MANUAL_ENTRY }),
    deviceHeartRate: createHeartRateMetric({ source: MetricSource.WEARABLE_DEVICE }),
    medicalDeviceBloodPressure: createBloodPressureMetric({ source: MetricSource.MEDICAL_DEVICE }),
    providerBloodGlucose: createBloodGlucoseMetric({ source: MetricSource.HEALTH_PROVIDER }),
    thirdPartySteps: createStepsMetric({ source: MetricSource.THIRD_PARTY_API })
  }
};