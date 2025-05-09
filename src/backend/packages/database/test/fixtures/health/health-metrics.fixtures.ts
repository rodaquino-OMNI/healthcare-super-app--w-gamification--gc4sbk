/**
 * @file Health metrics test fixtures for the AUSTA SuperApp
 * 
 * This file provides comprehensive test fixtures for health metrics (heart rate, blood pressure,
 * blood glucose, steps, weight, sleep) with realistic values and attributes. These fixtures are
 * essential for testing health tracking features, abnormality detection, trend analysis, and
 * metric visualization components in unit and integration tests.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Enum for health metric types
 * Matches the MetricType enum in the database schema
 */
export enum MetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  SLEEP = 'SLEEP',
  WEIGHT = 'WEIGHT',
}

/**
 * Enum for health metric sources
 * Matches the MetricSource enum in the database schema
 */
export enum MetricSource {
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  WEARABLE_DEVICE = 'WEARABLE_DEVICE',
  API = 'API',
  HEALTH_PROVIDER = 'HEALTH_PROVIDER',
}

/**
 * Interface for health metric test fixtures
 * Includes all properties from the HealthMetric entity
 */
export interface HealthMetricFixture {
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
 * Interface for blood pressure metric which has systolic and diastolic values
 * Extends the base HealthMetricFixture
 */
export interface BloodPressureMetricFixture extends HealthMetricFixture {
  systolic: number;
  diastolic: number;
}

/**
 * Normal ranges for different health metrics
 * Used to determine if a metric value is abnormal
 */
export const NORMAL_RANGES = {
  HEART_RATE: { min: 60, max: 100, unit: 'bpm' },
  BLOOD_PRESSURE: { 
    systolic: { min: 90, max: 120, unit: 'mmHg' },
    diastolic: { min: 60, max: 80, unit: 'mmHg' }
  },
  BLOOD_GLUCOSE: { min: 70, max: 100, unit: 'mg/dL' },
  STEPS: { min: 5000, max: null, unit: 'steps' },
  WEIGHT: { min: null, max: null, unit: 'kg' }, // Weight doesn't have a universal normal range
  SLEEP: { min: 7, max: 9, unit: 'hours' },
};

/**
 * Base factory function for creating health metric fixtures
 * 
 * @param overrides Optional properties to override default values
 * @returns A health metric fixture with default or overridden values
 */
export function createHealthMetricFixture(overrides?: Partial<HealthMetricFixture>): HealthMetricFixture {
  return {
    id: uuidv4(),
    userId: uuidv4(),
    type: MetricType.HEART_RATE,
    value: 75,
    unit: 'bpm',
    timestamp: new Date(),
    source: MetricSource.MANUAL_ENTRY,
    notes: null,
    trend: null,
    isAbnormal: false,
    ...overrides,
  };
}

/**
 * Factory function for creating heart rate metric fixtures
 * 
 * @param overrides Optional properties to override default values
 * @param abnormal Whether to create an abnormal heart rate reading
 * @returns A heart rate metric fixture
 */
export function createHeartRateMetric(
  overrides?: Partial<HealthMetricFixture>,
  abnormal: boolean = false
): HealthMetricFixture {
  const normalRange = NORMAL_RANGES.HEART_RATE;
  let value = abnormal 
    ? Math.random() > 0.5 
      ? normalRange.max + Math.floor(Math.random() * 40) + 1 // High heart rate
      : Math.max(normalRange.min - Math.floor(Math.random() * 20) - 1, 30) // Low heart rate, but not below 30
    : normalRange.min + Math.floor(Math.random() * (normalRange.max - normalRange.min + 1));
  
  return createHealthMetricFixture({
    type: MetricType.HEART_RATE,
    value,
    unit: normalRange.unit,
    isAbnormal: abnormal,
    ...overrides,
  });
}

/**
 * Factory function for creating blood pressure metric fixtures
 * Blood pressure is special as it has systolic and diastolic values
 * 
 * @param overrides Optional properties to override default values
 * @param abnormal Whether to create an abnormal blood pressure reading
 * @returns A blood pressure metric fixture with systolic and diastolic values
 */
export function createBloodPressureMetric(
  overrides?: Partial<BloodPressureMetricFixture>,
  abnormal: boolean = false
): BloodPressureMetricFixture {
  const normalRange = NORMAL_RANGES.BLOOD_PRESSURE;
  
  let systolic, diastolic;
  
  if (abnormal) {
    // Generate abnormal readings
    const isHigh = Math.random() > 0.5;
    
    if (isHigh) {
      // High blood pressure (hypertension)
      systolic = normalRange.systolic.max + Math.floor(Math.random() * 60) + 1;
      diastolic = normalRange.diastolic.max + Math.floor(Math.random() * 30) + 1;
    } else {
      // Low blood pressure (hypotension)
      systolic = Math.max(normalRange.systolic.min - Math.floor(Math.random() * 20) - 1, 70);
      diastolic = Math.max(normalRange.diastolic.min - Math.floor(Math.random() * 15) - 1, 40);
    }
  } else {
    // Generate normal readings
    systolic = normalRange.systolic.min + Math.floor(Math.random() * (normalRange.systolic.max - normalRange.systolic.min + 1));
    diastolic = normalRange.diastolic.min + Math.floor(Math.random() * (normalRange.diastolic.max - normalRange.diastolic.min + 1));
  }
  
  // Blood pressure is stored as a combined value (systolic/diastolic)
  const combinedValue = `${systolic}/${diastolic}`;
  
  return {
    ...createHealthMetricFixture({
      type: MetricType.BLOOD_PRESSURE,
      value: parseFloat(combinedValue.replace('/', '.')), // Store as a decimal for database compatibility
      unit: normalRange.systolic.unit,
      isAbnormal: abnormal,
      ...overrides,
    }),
    systolic,
    diastolic,
  };
}

/**
 * Factory function for creating blood glucose metric fixtures
 * 
 * @param overrides Optional properties to override default values
 * @param abnormal Whether to create an abnormal blood glucose reading
 * @returns A blood glucose metric fixture
 */
export function createBloodGlucoseMetric(
  overrides?: Partial<HealthMetricFixture>,
  abnormal: boolean = false
): HealthMetricFixture {
  const normalRange = NORMAL_RANGES.BLOOD_GLUCOSE;
  let value = abnormal
    ? Math.random() > 0.5
      ? normalRange.max + Math.floor(Math.random() * 150) + 1 // High blood glucose
      : Math.max(normalRange.min - Math.floor(Math.random() * 20) - 1, 40) // Low blood glucose, but not below 40
    : normalRange.min + Math.floor(Math.random() * (normalRange.max - normalRange.min + 1));
  
  return createHealthMetricFixture({
    type: MetricType.BLOOD_GLUCOSE,
    value,
    unit: normalRange.unit,
    isAbnormal: abnormal,
    ...overrides,
  });
}

/**
 * Factory function for creating steps metric fixtures
 * 
 * @param overrides Optional properties to override default values
 * @param abnormal Whether to create an abnormal steps reading (below recommended minimum)
 * @returns A steps metric fixture
 */
export function createStepsMetric(
  overrides?: Partial<HealthMetricFixture>,
  abnormal: boolean = false
): HealthMetricFixture {
  const normalRange = NORMAL_RANGES.STEPS;
  let value = abnormal
    ? Math.max(Math.floor(Math.random() * normalRange.min), 0) // Below minimum steps
    : normalRange.min + Math.floor(Math.random() * 10000); // Normal or above steps
  
  return createHealthMetricFixture({
    type: MetricType.STEPS,
    value,
    unit: normalRange.unit,
    isAbnormal: abnormal,
    ...overrides,
  });
}

/**
 * Factory function for creating weight metric fixtures
 * 
 * @param overrides Optional properties to override default values
 * @returns A weight metric fixture
 */
export function createWeightMetric(
  overrides?: Partial<HealthMetricFixture>
): HealthMetricFixture {
  const normalRange = NORMAL_RANGES.WEIGHT;
  // Generate a realistic weight between 50kg and 120kg
  const value = 50 + Math.floor(Math.random() * 70);
  
  return createHealthMetricFixture({
    type: MetricType.WEIGHT,
    value,
    unit: normalRange.unit,
    isAbnormal: false, // Weight doesn't have a universal abnormal range
    ...overrides,
  });
}

/**
 * Factory function for creating sleep metric fixtures
 * 
 * @param overrides Optional properties to override default values
 * @param abnormal Whether to create an abnormal sleep reading
 * @returns A sleep metric fixture
 */
export function createSleepMetric(
  overrides?: Partial<HealthMetricFixture>,
  abnormal: boolean = false
): HealthMetricFixture {
  const normalRange = NORMAL_RANGES.SLEEP;
  let value = abnormal
    ? Math.random() > 0.5
      ? normalRange.max + Math.random() * 3 // Too much sleep
      : Math.max(normalRange.min - Math.random() * 5, 2) // Too little sleep, but not below 2 hours
    : normalRange.min + Math.random() * (normalRange.max - normalRange.min);
  
  // Round to 1 decimal place for more realistic sleep values
  value = Math.round(value * 10) / 10;
  
  return createHealthMetricFixture({
    type: MetricType.SLEEP,
    value,
    unit: normalRange.unit,
    isAbnormal: abnormal,
    ...overrides,
  });
}

/**
 * Creates a set of health metrics for a user with a trend over time
 * 
 * @param userId The user ID to create metrics for
 * @param metricType The type of metric to create
 * @param count The number of metrics to create
 * @param startDate The start date for the metrics
 * @param trend The trend direction ('increasing', 'decreasing', 'stable', or 'fluctuating')
 * @returns An array of health metric fixtures with a consistent trend
 */
export function createMetricTrendSeries(
  userId: string,
  metricType: MetricType,
  count: number = 7,
  startDate: Date = new Date(Date.now() - (count * 24 * 60 * 60 * 1000)), // Default to 'count' days ago
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating' = 'stable'
): HealthMetricFixture[] {
  const metrics: HealthMetricFixture[] = [];
  let baseValue: number;
  let previousValue: number;
  
  // Set appropriate base value based on metric type
  switch (metricType) {
    case MetricType.HEART_RATE:
      baseValue = 70; // Normal resting heart rate
      break;
    case MetricType.BLOOD_PRESSURE:
      // Blood pressure is handled separately
      return createBloodPressureTrendSeries(userId, count, startDate, trend);
    case MetricType.BLOOD_GLUCOSE:
      baseValue = 85; // Normal fasting blood glucose
      break;
    case MetricType.STEPS:
      baseValue = 7500; // Moderate daily step count
      break;
    case MetricType.WEIGHT:
      baseValue = 70; // Average weight in kg
      break;
    case MetricType.SLEEP:
      baseValue = 7.5; // Average sleep duration
      break;
    default:
      baseValue = 0;
  }
  
  previousValue = baseValue;
  
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    let value: number;
    let trendPercentage: number | null = null;
    
    // Calculate value based on trend
    switch (trend) {
      case 'increasing':
        // Gradually increase by 1-3% each day
        value = previousValue * (1 + (0.01 + Math.random() * 0.02));
        break;
      case 'decreasing':
        // Gradually decrease by 1-3% each day
        value = previousValue * (1 - (0.01 + Math.random() * 0.02));
        break;
      case 'fluctuating':
        // Random fluctuation of ±5%
        value = previousValue * (1 + (Math.random() * 0.1 - 0.05));
        break;
      case 'stable':
      default:
        // Minimal random variation of ±1%
        value = previousValue * (1 + (Math.random() * 0.02 - 0.01));
        break;
    }
    
    // Round appropriately based on metric type
    switch (metricType) {
      case MetricType.HEART_RATE:
      case MetricType.STEPS:
        value = Math.round(value);
        break;
      case MetricType.BLOOD_GLUCOSE:
      case MetricType.WEIGHT:
        value = Math.round(value * 10) / 10; // Round to 1 decimal place
        break;
      case MetricType.SLEEP:
        value = Math.round(value * 10) / 10; // Round to 1 decimal place
        break;
    }
    
    // Calculate trend percentage if not the first entry
    if (i > 0) {
      trendPercentage = ((value - previousValue) / previousValue) * 100;
      trendPercentage = Math.round(trendPercentage * 10) / 10; // Round to 1 decimal place
    }
    
    // Create the metric based on type
    let metric: HealthMetricFixture;
    switch (metricType) {
      case MetricType.HEART_RATE:
        metric = createHeartRateMetric({
          userId,
          timestamp: date,
          value,
          trend: trendPercentage,
          source: MetricSource.WEARABLE_DEVICE,
        });
        break;
      case MetricType.BLOOD_GLUCOSE:
        metric = createBloodGlucoseMetric({
          userId,
          timestamp: date,
          value,
          trend: trendPercentage,
          source: MetricSource.WEARABLE_DEVICE,
        });
        break;
      case MetricType.STEPS:
        metric = createStepsMetric({
          userId,
          timestamp: date,
          value,
          trend: trendPercentage,
          source: MetricSource.WEARABLE_DEVICE,
        });
        break;
      case MetricType.WEIGHT:
        metric = createWeightMetric({
          userId,
          timestamp: date,
          value,
          trend: trendPercentage,
          source: MetricSource.MANUAL_ENTRY,
        });
        break;
      case MetricType.SLEEP:
        metric = createSleepMetric({
          userId,
          timestamp: date,
          value,
          trend: trendPercentage,
          source: MetricSource.WEARABLE_DEVICE,
        });
        break;
      default:
        metric = createHealthMetricFixture({
          userId,
          timestamp: date,
          type: metricType,
          value,
          trend: trendPercentage,
        });
    }
    
    metrics.push(metric);
    previousValue = value;
  }
  
  return metrics;
}

/**
 * Creates a set of blood pressure metrics for a user with a trend over time
 * Special handling for blood pressure since it has systolic and diastolic values
 * 
 * @param userId The user ID to create metrics for
 * @param count The number of metrics to create
 * @param startDate The start date for the metrics
 * @param trend The trend direction ('increasing', 'decreasing', 'stable', or 'fluctuating')
 * @returns An array of blood pressure metric fixtures with a consistent trend
 */
export function createBloodPressureTrendSeries(
  userId: string,
  count: number = 7,
  startDate: Date = new Date(Date.now() - (count * 24 * 60 * 60 * 1000)), // Default to 'count' days ago
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating' = 'stable'
): BloodPressureMetricFixture[] {
  const metrics: BloodPressureMetricFixture[] = [];
  
  // Base values for systolic and diastolic
  let baseSystolic = 115;
  let baseDiastolic = 75;
  
  let previousSystolic = baseSystolic;
  let previousDiastolic = baseDiastolic;
  
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    let systolic: number;
    let diastolic: number;
    let trendPercentage: number | null = null;
    
    // Calculate values based on trend
    switch (trend) {
      case 'increasing':
        // Gradually increase by 1-2% each day
        systolic = previousSystolic * (1 + (0.01 + Math.random() * 0.01));
        diastolic = previousDiastolic * (1 + (0.01 + Math.random() * 0.01));
        break;
      case 'decreasing':
        // Gradually decrease by 1-2% each day
        systolic = previousSystolic * (1 - (0.01 + Math.random() * 0.01));
        diastolic = previousDiastolic * (1 - (0.01 + Math.random() * 0.01));
        break;
      case 'fluctuating':
        // Random fluctuation of ±4%
        systolic = previousSystolic * (1 + (Math.random() * 0.08 - 0.04));
        diastolic = previousDiastolic * (1 + (Math.random() * 0.08 - 0.04));
        break;
      case 'stable':
      default:
        // Minimal random variation of ±1%
        systolic = previousSystolic * (1 + (Math.random() * 0.02 - 0.01));
        diastolic = previousDiastolic * (1 + (Math.random() * 0.02 - 0.01));
        break;
    }
    
    // Round to whole numbers
    systolic = Math.round(systolic);
    diastolic = Math.round(diastolic);
    
    // Calculate trend percentage if not the first entry
    if (i > 0) {
      // Use systolic for trend calculation as it's the primary indicator
      trendPercentage = ((systolic - previousSystolic) / previousSystolic) * 100;
      trendPercentage = Math.round(trendPercentage * 10) / 10; // Round to 1 decimal place
    }
    
    // Create the blood pressure metric
    const metric = createBloodPressureMetric({
      userId,
      timestamp: date,
      systolic,
      diastolic,
      trend: trendPercentage,
      source: MetricSource.MANUAL_ENTRY,
    });
    
    metrics.push(metric);
    previousSystolic = systolic;
    previousDiastolic = diastolic;
  }
  
  return metrics;
}

/**
 * Predefined test scenarios for health metrics
 */
export const healthMetricScenarios = {
  /**
   * Normal readings for all metric types
   */
  normalReadings: {
    heartRate: createHeartRateMetric(),
    bloodPressure: createBloodPressureMetric(),
    bloodGlucose: createBloodGlucoseMetric(),
    steps: createStepsMetric(),
    weight: createWeightMetric(),
    sleep: createSleepMetric(),
  },
  
  /**
   * Abnormal readings for all metric types
   */
  abnormalReadings: {
    heartRate: createHeartRateMetric({}, true),
    bloodPressure: createBloodPressureMetric({}, true),
    bloodGlucose: createBloodGlucoseMetric({}, true),
    steps: createStepsMetric({}, true),
    sleep: createSleepMetric({}, true),
  },
  
  /**
   * Trend scenarios for each metric type
   */
  trends: {
    heartRateIncreasing: createMetricTrendSeries(uuidv4(), MetricType.HEART_RATE, 7, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'increasing'),
    bloodPressureIncreasing: createBloodPressureTrendSeries(uuidv4(), 7, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'increasing'),
    bloodGlucoseDecreasing: createMetricTrendSeries(uuidv4(), MetricType.BLOOD_GLUCOSE, 7, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'decreasing'),
    stepsFluctuating: createMetricTrendSeries(uuidv4(), MetricType.STEPS, 7, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'fluctuating'),
    weightStable: createMetricTrendSeries(uuidv4(), MetricType.WEIGHT, 30, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'stable'),
    sleepImproving: createMetricTrendSeries(uuidv4(), MetricType.SLEEP, 14, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 'increasing'),
  },
  
  /**
   * Source scenarios for metrics
   */
  sources: {
    manualEntry: createHealthMetricFixture({ source: MetricSource.MANUAL_ENTRY }),
    wearableDevice: createHealthMetricFixture({ source: MetricSource.WEARABLE_DEVICE }),
    api: createHealthMetricFixture({ source: MetricSource.API }),
    healthProvider: createHealthMetricFixture({ source: MetricSource.HEALTH_PROVIDER }),
  },
};

/**
 * Default export for easier importing
 */
export default {
  createHealthMetricFixture,
  createHeartRateMetric,
  createBloodPressureMetric,
  createBloodGlucoseMetric,
  createStepsMetric,
  createWeightMetric,
  createSleepMetric,
  createMetricTrendSeries,
  createBloodPressureTrendSeries,
  healthMetricScenarios,
  NORMAL_RANGES,
  MetricType,
  MetricSource,
};