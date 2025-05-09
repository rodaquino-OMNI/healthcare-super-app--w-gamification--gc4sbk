/**
 * @file health-context.mock.ts
 * @description Specialized mock for the Health journey database context that extends the base journey context mock
 * with health-specific data models and operations. Provides mock implementations for health metrics, goals,
 * device connections, and medical events with pre-configured test data tailored to the Health journey.
 */

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Import interfaces from the Health journey
import {
  IHealthMetric,
  IHealthGoal,
  IDeviceConnection,
  IMedicalEvent,
  HealthMetricType,
  GoalStatus,
  DeviceConnectionStatus,
  MedicalEventType,
  IHealthInsight
} from '@austa/interfaces/journey/health';

// Import base mock and types
import { BaseJourneyContextMock } from './journey-context.mock';
import { JourneyType } from '../../src/contexts/care.context';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { FilterOptions, SortOptions, PaginationOptions } from '../../src/types/query.types';

/**
 * Mock implementation of the Health journey database context for testing.
 * Provides pre-configured test data and mock implementations for health-specific operations.
 */
export class HealthContextMock extends BaseJourneyContextMock {
  /**
   * Mock data for health metrics
   */
  private healthMetrics: IHealthMetric[] = [
    {
      id: 'metric1',
      userId: 'user1',
      type: HealthMetricType.HEART_RATE,
      value: 72,
      unit: 'bpm',
      timestamp: new Date('2023-06-01T08:00:00Z'),
      source: 'manual',
      deviceId: null,
      metadata: {},
      createdAt: new Date('2023-06-01T08:00:00Z')
    },
    {
      id: 'metric2',
      userId: 'user1',
      type: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      timestamp: new Date('2023-06-01T12:00:00Z'),
      source: 'manual',
      deviceId: null,
      metadata: {},
      createdAt: new Date('2023-06-01T12:00:00Z')
    },
    {
      id: 'metric3',
      userId: 'user1',
      type: HealthMetricType.HEART_RATE,
      value: 68,
      unit: 'bpm',
      timestamp: new Date('2023-06-01T20:00:00Z'),
      source: 'manual',
      deviceId: null,
      metadata: {},
      createdAt: new Date('2023-06-01T20:00:00Z')
    },
    {
      id: 'metric4',
      userId: 'user1',
      type: HealthMetricType.BLOOD_PRESSURE,
      value: 120,
      unit: 'mmHg',
      timestamp: new Date('2023-06-01T08:00:00Z'),
      source: 'manual',
      deviceId: null,
      metadata: { diastolic: 80 },
      createdAt: new Date('2023-06-01T08:00:00Z')
    },
    {
      id: 'metric5',
      userId: 'user1',
      type: HealthMetricType.BLOOD_PRESSURE,
      value: 118,
      unit: 'mmHg',
      timestamp: new Date('2023-06-01T20:00:00Z'),
      source: 'manual',
      deviceId: null,
      metadata: { diastolic: 78 },
      createdAt: new Date('2023-06-01T20:00:00Z')
    },
    {
      id: 'metric6',
      userId: 'user1',
      type: HealthMetricType.BLOOD_GLUCOSE,
      value: 95,
      unit: 'mg/dL',
      timestamp: new Date('2023-06-01T08:00:00Z'),
      source: 'manual',
      deviceId: null,
      metadata: { mealContext: 'fasting' },
      createdAt: new Date('2023-06-01T08:00:00Z')
    },
    {
      id: 'metric7',
      userId: 'user1',
      type: HealthMetricType.STEPS,
      value: 8500,
      unit: 'steps',
      timestamp: new Date('2023-06-01T23:59:59Z'),
      source: 'device',
      deviceId: 'device1',
      metadata: { caloriesBurned: 320 },
      createdAt: new Date('2023-06-01T23:59:59Z')
    },
    {
      id: 'metric8',
      userId: 'user1',
      type: HealthMetricType.WEIGHT,
      value: 70.5,
      unit: 'kg',
      timestamp: new Date('2023-06-01T08:00:00Z'),
      source: 'manual',
      deviceId: null,
      metadata: { bmi: 24.2 },
      createdAt: new Date('2023-06-01T08:00:00Z')
    },
    {
      id: 'metric9',
      userId: 'user1',
      type: HealthMetricType.SLEEP,
      value: 7.5,
      unit: 'hours',
      timestamp: new Date('2023-06-01T08:00:00Z'),
      source: 'device',
      deviceId: 'device1',
      metadata: {
        deepSleep: 2.5,
        lightSleep: 4.0,
        remSleep: 1.0
      },
      createdAt: new Date('2023-06-01T08:00:00Z')
    },
    {
      id: 'metric10',
      userId: 'user2',
      type: HealthMetricType.HEART_RATE,
      value: 65,
      unit: 'bpm',
      timestamp: new Date('2023-06-01T08:00:00Z'),
      source: 'manual',
      deviceId: null,
      metadata: {},
      createdAt: new Date('2023-06-01T08:00:00Z')
    }
  ];

  /**
   * Mock data for health goals
   */
  private healthGoals: IHealthGoal[] = [
    {
      id: 'goal1',
      userId: 'user1',
      type: HealthMetricType.STEPS,
      target: 10000,
      unit: 'steps',
      frequency: 'daily',
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: null,
      status: GoalStatus.ACTIVE,
      progress: 85,
      streakDays: 5,
      lastUpdated: new Date('2023-06-01T23:59:59Z'),
      createdAt: new Date('2023-06-01T00:00:00Z'),
      updatedAt: new Date('2023-06-01T23:59:59Z')
    },
    {
      id: 'goal2',
      userId: 'user1',
      type: HealthMetricType.WEIGHT,
      target: 68.0,
      unit: 'kg',
      frequency: 'weekly',
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: new Date('2023-09-01T00:00:00Z'),
      status: GoalStatus.ACTIVE,
      progress: 30,
      streakDays: 0,
      lastUpdated: new Date('2023-06-01T08:00:00Z'),
      createdAt: new Date('2023-06-01T00:00:00Z'),
      updatedAt: new Date('2023-06-01T08:00:00Z')
    },
    {
      id: 'goal3',
      userId: 'user1',
      type: HealthMetricType.SLEEP,
      target: 8.0,
      unit: 'hours',
      frequency: 'daily',
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: null,
      status: GoalStatus.ACTIVE,
      progress: 93,
      streakDays: 3,
      lastUpdated: new Date('2023-06-01T08:00:00Z'),
      createdAt: new Date('2023-06-01T00:00:00Z'),
      updatedAt: new Date('2023-06-01T08:00:00Z')
    },
    {
      id: 'goal4',
      userId: 'user2',
      type: HealthMetricType.STEPS,
      target: 8000,
      unit: 'steps',
      frequency: 'daily',
      startDate: new Date('2023-06-01T00:00:00Z'),
      endDate: null,
      status: GoalStatus.ACTIVE,
      progress: 75,
      streakDays: 2,
      lastUpdated: new Date('2023-06-01T23:59:59Z'),
      createdAt: new Date('2023-06-01T00:00:00Z'),
      updatedAt: new Date('2023-06-01T23:59:59Z')
    }
  ];

  /**
   * Mock data for device connections
   */
  private deviceConnections: IDeviceConnection[] = [
    {
      id: 'device1',
      userId: 'user1',
      deviceType: 'Smartwatch',
      manufacturer: 'Apple',
      model: 'Apple Watch Series 7',
      serialNumber: 'AW7123456789',
      connectionStatus: DeviceConnectionStatus.CONNECTED,
      lastSyncTime: new Date('2023-06-01T23:59:59Z'),
      supportedMetrics: [
        HealthMetricType.HEART_RATE,
        HealthMetricType.STEPS,
        HealthMetricType.SLEEP
      ],
      settings: {
        syncFrequency: 'hourly',
        autoSync: true
      },
      createdAt: new Date('2023-05-15T10:00:00Z'),
      updatedAt: new Date('2023-06-01T23:59:59Z')
    },
    {
      id: 'device2',
      userId: 'user1',
      deviceType: 'Blood Pressure Monitor',
      manufacturer: 'Omron',
      model: 'M7 Intelli IT',
      serialNumber: 'OMR987654321',
      connectionStatus: DeviceConnectionStatus.CONNECTED,
      lastSyncTime: new Date('2023-06-01T08:00:00Z'),
      supportedMetrics: [
        HealthMetricType.BLOOD_PRESSURE
      ],
      settings: {
        syncFrequency: 'manual',
        autoSync: false
      },
      createdAt: new Date('2023-05-20T14:30:00Z'),
      updatedAt: new Date('2023-06-01T08:00:00Z')
    },
    {
      id: 'device3',
      userId: 'user2',
      deviceType: 'Smartwatch',
      manufacturer: 'Samsung',
      model: 'Galaxy Watch 4',
      serialNumber: 'GW4987654321',
      connectionStatus: DeviceConnectionStatus.CONNECTED,
      lastSyncTime: new Date('2023-06-01T22:00:00Z'),
      supportedMetrics: [
        HealthMetricType.HEART_RATE,
        HealthMetricType.STEPS,
        HealthMetricType.SLEEP
      ],
      settings: {
        syncFrequency: 'hourly',
        autoSync: true
      },
      createdAt: new Date('2023-05-10T09:15:00Z'),
      updatedAt: new Date('2023-06-01T22:00:00Z')
    }
  ];

  /**
   * Mock data for medical events
   */
  private medicalEvents: IMedicalEvent[] = [
    {
      id: 'event1',
      userId: 'user1',
      type: MedicalEventType.DOCTOR_VISIT,
      title: 'Annual Physical Examination',
      description: 'Routine annual physical with Dr. Silva',
      date: new Date('2023-05-15T10:00:00Z'),
      provider: 'Dr. Maria Silva',
      location: 'Clínica Austa, São Paulo',
      notes: 'All tests within normal ranges. Blood pressure slightly elevated, recommended monitoring.',
      attachments: [],
      fhirReference: 'Encounter/12345',
      createdAt: new Date('2023-05-15T12:00:00Z'),
      updatedAt: new Date('2023-05-15T12:00:00Z')
    },
    {
      id: 'event2',
      userId: 'user1',
      type: MedicalEventType.LAB_TEST,
      title: 'Blood Work',
      description: 'Complete blood count and metabolic panel',
      date: new Date('2023-05-16T08:30:00Z'),
      provider: 'Laboratório Austa',
      location: 'Laboratório Austa, São Paulo',
      notes: 'Fasting blood test. Results available in 3 days.',
      attachments: [
        {
          id: 'attach1',
          fileName: 'blood_test_results.pdf',
          fileType: 'application/pdf',
          fileSize: 1024 * 1024, // 1MB
          uploadDate: new Date('2023-05-19T14:00:00Z'),
          url: 'https://storage.austa.app/user1/medical/blood_test_results.pdf'
        }
      ],
      fhirReference: 'DiagnosticReport/67890',
      createdAt: new Date('2023-05-16T09:00:00Z'),
      updatedAt: new Date('2023-05-19T14:00:00Z')
    },
    {
      id: 'event3',
      userId: 'user1',
      type: MedicalEventType.MEDICATION,
      title: 'Started Losartana',
      description: 'Started blood pressure medication',
      date: new Date('2023-05-15T10:00:00Z'),
      provider: 'Dr. Maria Silva',
      location: null,
      notes: 'Prescribed 50mg daily for hypertension management',
      attachments: [],
      fhirReference: 'MedicationStatement/54321',
      createdAt: new Date('2023-05-15T12:00:00Z'),
      updatedAt: new Date('2023-05-15T12:00:00Z')
    },
    {
      id: 'event4',
      userId: 'user2',
      type: MedicalEventType.DOCTOR_VISIT,
      title: 'Dermatology Consultation',
      description: 'Skin examination with Dr. Santos',
      date: new Date('2023-05-20T15:30:00Z'),
      provider: 'Dr. João Santos',
      location: 'Clínica Dermatológica, São Paulo',
      notes: 'Prescribed topical cream for eczema',
      attachments: [],
      fhirReference: 'Encounter/24680',
      createdAt: new Date('2023-05-20T16:45:00Z'),
      updatedAt: new Date('2023-05-20T16:45:00Z')
    }
  ];

  /**
   * Mock data for health insights
   */
  private healthInsights: IHealthInsight[] = [
    {
      id: 'insight1',
      userId: 'user1',
      title: 'Heart Rate Trend',
      description: 'Your resting heart rate has decreased by 5 bpm over the last month, indicating improved cardiovascular fitness.',
      type: 'trend',
      metricType: HealthMetricType.HEART_RATE,
      severity: 'positive',
      generatedAt: new Date('2023-06-01T00:00:00Z'),
      expiresAt: new Date('2023-06-08T00:00:00Z'),
      read: false,
      data: {
        currentValue: 68,
        previousValue: 73,
        changePercentage: -6.8,
        period: '30 days'
      },
      recommendations: [
        'Continue your regular exercise routine',
        'Maintain good sleep habits'
      ],
      createdAt: new Date('2023-06-01T00:00:00Z'),
      updatedAt: new Date('2023-06-01T00:00:00Z')
    },
    {
      id: 'insight2',
      userId: 'user1',
      title: 'Step Goal Achievement',
      description: 'You\'ve consistently met your step goal for 5 consecutive days!',
      type: 'achievement',
      metricType: HealthMetricType.STEPS,
      severity: 'positive',
      generatedAt: new Date('2023-06-01T23:59:59Z'),
      expiresAt: new Date('2023-06-08T23:59:59Z'),
      read: false,
      data: {
        streakDays: 5,
        averageSteps: 9200,
        goalTarget: 10000
      },
      recommendations: [
        'Try to increase your goal to 12,000 steps for an additional challenge',
        'Share your achievement with friends for motivation'
      ],
      createdAt: new Date('2023-06-01T23:59:59Z'),
      updatedAt: new Date('2023-06-01T23:59:59Z')
    },
    {
      id: 'insight3',
      userId: 'user1',
      title: 'Blood Pressure Alert',
      description: 'Your systolic blood pressure readings have been consistently above the recommended range.',
      type: 'alert',
      metricType: HealthMetricType.BLOOD_PRESSURE,
      severity: 'warning',
      generatedAt: new Date('2023-06-01T12:00:00Z'),
      expiresAt: new Date('2023-06-08T12:00:00Z'),
      read: true,
      data: {
        averageSystolic: 135,
        averageDiastolic: 85,
        recommendedRangeSystolic: [90, 120],
        recommendedRangeDiastolic: [60, 80],
        readings: 5
      },
      recommendations: [
        'Schedule a follow-up with your healthcare provider',
        'Reduce sodium intake in your diet',
        'Practice stress-reduction techniques like meditation'
      ],
      createdAt: new Date('2023-06-01T12:00:00Z'),
      updatedAt: new Date('2023-06-01T14:30:00Z')
    }
  ];

  // Mock functions for all HealthContext methods
  public recordHealthMetric = jest.fn();
  public getHealthMetrics = jest.fn();
  public getHealthMetricsByTimeRange = jest.fn();
  public getHealthMetricAggregates = jest.fn();
  public createHealthGoal = jest.fn();
  public updateHealthGoal = jest.fn();
  public getHealthGoals = jest.fn();
  public trackGoalProgress = jest.fn();
  public connectDevice = jest.fn();
  public disconnectDevice = jest.fn();
  public syncDeviceData = jest.fn();
  public getConnectedDevices = jest.fn();
  public recordMedicalEvent = jest.fn();
  public getMedicalEvents = jest.fn();
  public importFHIRData = jest.fn();
  public exportFHIRData = jest.fn();
  public generateHealthInsights = jest.fn();
  public getHealthInsights = jest.fn();
  public markInsightAsRead = jest.fn();
  public getHealthSummary = jest.fn();
  public validateHealthData = jest.fn();
  public sendHealthJourneyEvent = jest.fn();

  /**
   * Creates a new instance of HealthContextMock with pre-configured mock implementations.
   */
  constructor() {
    super(JourneyType.HEALTH);
    this.setupMockImplementations();
  }

  /**
   * Sets up mock implementations for all Health journey database operations.
   * @private
   */
  private setupMockImplementations(): void {
    // Mock recordHealthMetric implementation
    this.recordHealthMetric.mockImplementation(
      (userId: string, metricType: HealthMetricType, value: number, unit: string, timestamp?: Date, source?: string, deviceId?: string, metadata?: Record<string, any>) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!metricType || !Object.values(HealthMetricType).includes(metricType)) {
          throw new DatabaseException(
            `Invalid metric type: ${metricType}`,
            DatabaseErrorType.VALIDATION,
            { metricType, validTypes: Object.values(HealthMetricType) }
          );
        }

        if (value === undefined || value === null) {
          throw new DatabaseException(
            'Metric value is required',
            DatabaseErrorType.VALIDATION,
            { value }
          );
        }

        if (!unit) {
          throw new DatabaseException(
            'Unit is required',
            DatabaseErrorType.VALIDATION,
            { unit }
          );
        }

        // Set defaults for optional parameters
        const now = new Date();
        const metricTimestamp = timestamp || now;
        const metricSource = source || 'manual';
        const metricMetadata = metadata || {};

        // Create the health metric
        const metricId = `metric-${Date.now()}`;
        const healthMetric: IHealthMetric = {
          id: metricId,
          userId,
          type: metricType,
          value,
          unit,
          timestamp: metricTimestamp,
          source: metricSource,
          deviceId: deviceId || null,
          metadata: metricMetadata,
          createdAt: now
        };

        // Add to health metrics array
        this.healthMetrics.push(healthMetric);

        // Update goal progress if applicable
        this.updateGoalProgressForMetric(userId, metricType, value, metricTimestamp);

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'HEALTH_METRIC_RECORDED',
          userId,
          {
            metricId,
            metricType,
            value,
            unit,
            source: metricSource,
            deviceId: deviceId || null,
          }
        );

        return healthMetric;
      }
    );

    // Mock getHealthMetrics implementation
    this.getHealthMetrics.mockImplementation(
      (userId: string, metricType?: HealthMetricType, limit?: number, offset?: number) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        // Filter metrics by user ID and optionally by metric type
        let filteredMetrics = this.healthMetrics.filter(m => m.userId === userId);
        
        if (metricType) {
          filteredMetrics = filteredMetrics.filter(m => m.type === metricType);
        }

        // Sort by timestamp (newest first)
        filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Apply pagination if specified
        const startIndex = offset || 0;
        const endIndex = limit ? startIndex + limit : filteredMetrics.length;
        const paginatedMetrics = filteredMetrics.slice(startIndex, endIndex);

        return {
          metrics: paginatedMetrics,
          total: filteredMetrics.length,
          limit: limit || filteredMetrics.length,
          offset: offset || 0
        };
      }
    );

    // Mock getHealthMetricsByTimeRange implementation with TimescaleDB simulation
    this.getHealthMetricsByTimeRange.mockImplementation(
      (userId: string, metricType: HealthMetricType, startTime: Date, endTime: Date, interval?: string) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!metricType) {
          throw new DatabaseException(
            'Metric type is required',
            DatabaseErrorType.VALIDATION,
            { metricType }
          );
        }

        if (!startTime || !endTime) {
          throw new DatabaseException(
            'Start and end times are required',
            DatabaseErrorType.VALIDATION,
            { startTime, endTime }
          );
        }

        // Filter metrics by user ID, metric type, and time range
        const filteredMetrics = this.healthMetrics.filter(m => 
          m.userId === userId && 
          m.type === metricType && 
          m.timestamp >= startTime && 
          m.timestamp <= endTime
        );

        // Sort by timestamp (oldest first for time series)
        filteredMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // If interval is specified, simulate TimescaleDB time bucketing
        if (interval) {
          // Parse interval (e.g., '1 hour', '30 minutes', '1 day')
          const [amount, unit] = interval.split(' ');
          const intervalMs = this.parseTimeInterval(amount, unit);
          
          if (intervalMs === 0) {
            throw new DatabaseException(
              `Invalid interval: ${interval}`,
              DatabaseErrorType.VALIDATION,
              { interval }
            );
          }

          // Create time buckets
          const buckets: Record<string, IHealthMetric[]> = {};
          let currentBucketStart = new Date(startTime);
          
          while (currentBucketStart <= endTime) {
            const bucketKey = currentBucketStart.toISOString();
            const bucketEnd = new Date(currentBucketStart.getTime() + intervalMs);
            
            // Find metrics in this bucket
            const metricsInBucket = filteredMetrics.filter(m => 
              m.timestamp >= currentBucketStart && 
              m.timestamp < bucketEnd
            );
            
            buckets[bucketKey] = metricsInBucket;
            
            // Move to next bucket
            currentBucketStart = bucketEnd;
          }

          // Calculate aggregates for each bucket
          const timeSeriesData = Object.entries(buckets).map(([bucketTime, metrics]) => {
            // Skip empty buckets if no metrics
            if (metrics.length === 0) {
              return {
                timestamp: new Date(bucketTime),
                value: null,
                count: 0,
                min: null,
                max: null,
                avg: null
              };
            }

            // Calculate aggregates
            const values = metrics.map(m => m.value);
            const sum = values.reduce((acc, val) => acc + val, 0);
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);

            return {
              timestamp: new Date(bucketTime),
              value: avg, // Use average as the main value
              count: metrics.length,
              min,
              max,
              avg
            };
          });

          return {
            metricType,
            unit: filteredMetrics.length > 0 ? filteredMetrics[0].unit : '',
            interval,
            timeRange: { startTime, endTime },
            dataPoints: timeSeriesData
          };
        }

        // If no interval, return raw data points
        return {
          metricType,
          unit: filteredMetrics.length > 0 ? filteredMetrics[0].unit : '',
          timeRange: { startTime, endTime },
          dataPoints: filteredMetrics.map(m => ({
            timestamp: m.timestamp,
            value: m.value,
            metadata: m.metadata
          }))
        };
      }
    );

    // Mock getHealthMetricAggregates implementation
    this.getHealthMetricAggregates.mockImplementation(
      (userId: string, metricType: HealthMetricType, timeRange: { startTime: Date, endTime: Date }, aggregations: string[]) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!metricType) {
          throw new DatabaseException(
            'Metric type is required',
            DatabaseErrorType.VALIDATION,
            { metricType }
          );
        }

        if (!timeRange || !timeRange.startTime || !timeRange.endTime) {
          throw new DatabaseException(
            'Time range with start and end times is required',
            DatabaseErrorType.VALIDATION,
            { timeRange }
          );
        }

        if (!aggregations || !Array.isArray(aggregations) || aggregations.length === 0) {
          throw new DatabaseException(
            'At least one aggregation function is required',
            DatabaseErrorType.VALIDATION,
            { aggregations }
          );
        }

        // Valid aggregation functions
        const validAggregations = ['avg', 'min', 'max', 'count', 'sum', 'first', 'last'];
        const invalidAggregations = aggregations.filter(agg => !validAggregations.includes(agg));
        
        if (invalidAggregations.length > 0) {
          throw new DatabaseException(
            `Invalid aggregation functions: ${invalidAggregations.join(', ')}`,
            DatabaseErrorType.VALIDATION,
            { invalidAggregations, validAggregations }
          );
        }

        // Filter metrics by user ID, metric type, and time range
        const filteredMetrics = this.healthMetrics.filter(m => 
          m.userId === userId && 
          m.type === metricType && 
          m.timestamp >= timeRange.startTime && 
          m.timestamp <= timeRange.endTime
        );

        // Sort by timestamp for first/last calculations
        filteredMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Calculate requested aggregations
        const result: Record<string, any> = {
          metricType,
          unit: filteredMetrics.length > 0 ? filteredMetrics[0].unit : '',
          timeRange,
          count: filteredMetrics.length
        };

        if (filteredMetrics.length === 0) {
          // Return null for all aggregations if no data
          aggregations.forEach(agg => {
            result[agg] = null;
          });
          return result;
        }

        const values = filteredMetrics.map(m => m.value);

        // Calculate each requested aggregation
        aggregations.forEach(agg => {
          switch (agg) {
            case 'avg':
              const sum = values.reduce((acc, val) => acc + val, 0);
              result.avg = sum / values.length;
              break;
            case 'min':
              result.min = Math.min(...values);
              break;
            case 'max':
              result.max = Math.max(...values);
              break;
            case 'sum':
              result.sum = values.reduce((acc, val) => acc + val, 0);
              break;
            case 'first':
              result.first = filteredMetrics[0].value;
              result.firstTimestamp = filteredMetrics[0].timestamp;
              break;
            case 'last':
              result.last = filteredMetrics[filteredMetrics.length - 1].value;
              result.lastTimestamp = filteredMetrics[filteredMetrics.length - 1].timestamp;
              break;
            // 'count' is already included by default
          }
        });

        return result;
      }
    );

    // Mock createHealthGoal implementation
    this.createHealthGoal.mockImplementation(
      (userId: string, metricType: HealthMetricType, target: number, unit: string, frequency: string, startDate?: Date, endDate?: Date) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!metricType || !Object.values(HealthMetricType).includes(metricType)) {
          throw new DatabaseException(
            `Invalid metric type: ${metricType}`,
            DatabaseErrorType.VALIDATION,
            { metricType, validTypes: Object.values(HealthMetricType) }
          );
        }

        if (target === undefined || target === null) {
          throw new DatabaseException(
            'Target value is required',
            DatabaseErrorType.VALIDATION,
            { target }
          );
        }

        if (!unit) {
          throw new DatabaseException(
            'Unit is required',
            DatabaseErrorType.VALIDATION,
            { unit }
          );
        }

        if (!frequency) {
          throw new DatabaseException(
            'Frequency is required',
            DatabaseErrorType.VALIDATION,
            { frequency }
          );
        }

        // Check if a goal for this metric type already exists and is active
        const existingGoal = this.healthGoals.find(g => 
          g.userId === userId && 
          g.type === metricType && 
          g.status === GoalStatus.ACTIVE
        );

        if (existingGoal) {
          throw new DatabaseException(
            `An active goal for ${metricType} already exists`,
            DatabaseErrorType.CONFLICT,
            { existingGoalId: existingGoal.id }
          );
        }

        // Set defaults for optional parameters
        const now = new Date();
        const goalStartDate = startDate || now;

        // Create the health goal
        const goalId = `goal-${Date.now()}`;
        const healthGoal: IHealthGoal = {
          id: goalId,
          userId,
          type: metricType,
          target,
          unit,
          frequency,
          startDate: goalStartDate,
          endDate: endDate || null,
          status: GoalStatus.ACTIVE,
          progress: 0,
          streakDays: 0,
          lastUpdated: now,
          createdAt: now,
          updatedAt: now
        };

        // Add to health goals array
        this.healthGoals.push(healthGoal);

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'HEALTH_GOAL_CREATED',
          userId,
          {
            goalId,
            metricType,
            target,
            unit,
            frequency,
          }
        );

        return healthGoal;
      }
    );

    // Mock updateHealthGoal implementation
    this.updateHealthGoal.mockImplementation(
      (goalId: string, updates: Partial<IHealthGoal>) => {
        // Validate input parameters
        if (!goalId) {
          throw new DatabaseException(
            'Goal ID is required',
            DatabaseErrorType.VALIDATION,
            { goalId }
          );
        }

        if (!updates || Object.keys(updates).length === 0) {
          throw new DatabaseException(
            'Updates are required',
            DatabaseErrorType.VALIDATION,
            { updates }
          );
        }

        // Find the goal
        const goalIndex = this.healthGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) {
          throw new DatabaseException(
            `Goal not found with ID ${goalId}`,
            DatabaseErrorType.NOT_FOUND,
            { goalId }
          );
        }

        const goal = this.healthGoals[goalIndex];

        // Update the goal
        const updatedGoal = {
          ...goal,
          ...updates,
          updatedAt: new Date()
        };

        // Replace the goal in the array
        this.healthGoals[goalIndex] = updatedGoal;

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'HEALTH_GOAL_UPDATED',
          updatedGoal.userId,
          {
            goalId,
            updates: Object.keys(updates),
            status: updatedGoal.status,
          }
        );

        return updatedGoal;
      }
    );

    // Mock getHealthGoals implementation
    this.getHealthGoals.mockImplementation(
      (userId: string, status?: GoalStatus) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        // Filter goals by user ID and optionally by status
        let filteredGoals = this.healthGoals.filter(g => g.userId === userId);
        
        if (status) {
          filteredGoals = filteredGoals.filter(g => g.status === status);
        }

        // Sort by creation date (newest first)
        filteredGoals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return filteredGoals;
      }
    );

    // Mock trackGoalProgress implementation
    this.trackGoalProgress.mockImplementation(
      (goalId: string, progress: number, timestamp?: Date) => {
        // Validate input parameters
        if (!goalId) {
          throw new DatabaseException(
            'Goal ID is required',
            DatabaseErrorType.VALIDATION,
            { goalId }
          );
        }

        if (progress === undefined || progress === null) {
          throw new DatabaseException(
            'Progress value is required',
            DatabaseErrorType.VALIDATION,
            { progress }
          );
        }

        // Find the goal
        const goalIndex = this.healthGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) {
          throw new DatabaseException(
            `Goal not found with ID ${goalId}`,
            DatabaseErrorType.NOT_FOUND,
            { goalId }
          );
        }

        const goal = this.healthGoals[goalIndex];

        // Ensure the goal is active
        if (goal.status !== GoalStatus.ACTIVE) {
          throw new DatabaseException(
            `Goal with ID ${goalId} is not active`,
            DatabaseErrorType.VALIDATION,
            { goalId, status: goal.status }
          );
        }

        // Update the goal progress
        const now = timestamp || new Date();
        const previousProgress = goal.progress;
        const previousStreakDays = goal.streakDays;

        // Calculate if this is a new day for streak counting
        const isNewDay = this.isNewDayForStreak(goal.lastUpdated, now);
        let newStreakDays = previousStreakDays;

        // Update streak days if applicable
        if (isNewDay) {
          // Check if the goal was met (progress >= 100%)
          if (progress >= 100) {
            newStreakDays += 1;
          } else {
            // Reset streak if goal not met on a new day
            newStreakDays = 0;
          }
        }

        // Update the goal
        const updatedGoal = {
          ...goal,
          progress: Math.min(100, progress), // Cap at 100%
          streakDays: newStreakDays,
          lastUpdated: now,
          updatedAt: now
        };

        // Replace the goal in the array
        this.healthGoals[goalIndex] = updatedGoal;

        // Check if goal is completed
        let goalCompleted = false;
        if (progress >= 100 && goal.progress < 100) {
          goalCompleted = true;
        }

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          goalCompleted ? 'HEALTH_GOAL_COMPLETED' : 'HEALTH_GOAL_PROGRESS_UPDATED',
          goal.userId,
          {
            goalId,
            metricType: goal.type,
            previousProgress,
            currentProgress: updatedGoal.progress,
            streakDays: updatedGoal.streakDays,
            completed: goalCompleted,
          }
        );

        return {
          goalId,
          previousProgress,
          currentProgress: updatedGoal.progress,
          previousStreakDays,
          currentStreakDays: updatedGoal.streakDays,
          timestamp: now,
          completed: goalCompleted,
        };
      }
    );

    // Mock connectDevice implementation
    this.connectDevice.mockImplementation(
      (userId: string, deviceType: string, manufacturer: string, model: string, serialNumber: string, supportedMetrics: HealthMetricType[], settings?: Record<string, any>) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!deviceType) {
          throw new DatabaseException(
            'Device type is required',
            DatabaseErrorType.VALIDATION,
            { deviceType }
          );
        }

        if (!manufacturer) {
          throw new DatabaseException(
            'Manufacturer is required',
            DatabaseErrorType.VALIDATION,
            { manufacturer }
          );
        }

        if (!model) {
          throw new DatabaseException(
            'Model is required',
            DatabaseErrorType.VALIDATION,
            { model }
          );
        }

        if (!serialNumber) {
          throw new DatabaseException(
            'Serial number is required',
            DatabaseErrorType.VALIDATION,
            { serialNumber }
          );
        }

        if (!supportedMetrics || !Array.isArray(supportedMetrics) || supportedMetrics.length === 0) {
          throw new DatabaseException(
            'At least one supported metric is required',
            DatabaseErrorType.VALIDATION,
            { supportedMetrics }
          );
        }

        // Check if the device is already connected
        const existingDevice = this.deviceConnections.find(d => 
          d.userId === userId && 
          d.serialNumber === serialNumber
        );

        if (existingDevice) {
          throw new DatabaseException(
            `Device with serial number ${serialNumber} is already connected`,
            DatabaseErrorType.CONFLICT,
            { existingDeviceId: existingDevice.id }
          );
        }

        // Create the device connection
        const now = new Date();
        const deviceId = `device-${Date.now()}`;
        const deviceConnection: IDeviceConnection = {
          id: deviceId,
          userId,
          deviceType,
          manufacturer,
          model,
          serialNumber,
          connectionStatus: DeviceConnectionStatus.CONNECTED,
          lastSyncTime: now,
          supportedMetrics,
          settings: settings || {
            syncFrequency: 'daily',
            autoSync: true
          },
          createdAt: now,
          updatedAt: now
        };

        // Add to device connections array
        this.deviceConnections.push(deviceConnection);

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'DEVICE_CONNECTED',
          userId,
          {
            deviceId,
            deviceType,
            manufacturer,
            model,
            supportedMetrics,
          }
        );

        return deviceConnection;
      }
    );

    // Mock disconnectDevice implementation
    this.disconnectDevice.mockImplementation(
      (deviceId: string) => {
        // Validate input parameters
        if (!deviceId) {
          throw new DatabaseException(
            'Device ID is required',
            DatabaseErrorType.VALIDATION,
            { deviceId }
          );
        }

        // Find the device
        const deviceIndex = this.deviceConnections.findIndex(d => d.id === deviceId);
        if (deviceIndex === -1) {
          throw new DatabaseException(
            `Device not found with ID ${deviceId}`,
            DatabaseErrorType.NOT_FOUND,
            { deviceId }
          );
        }

        const device = this.deviceConnections[deviceIndex];

        // Update the device connection status
        const updatedDevice = {
          ...device,
          connectionStatus: DeviceConnectionStatus.DISCONNECTED,
          updatedAt: new Date()
        };

        // Replace the device in the array
        this.deviceConnections[deviceIndex] = updatedDevice;

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'DEVICE_DISCONNECTED',
          device.userId,
          {
            deviceId,
            deviceType: device.deviceType,
            manufacturer: device.manufacturer,
            model: device.model,
          }
        );

        return updatedDevice;
      }
    );

    // Mock syncDeviceData implementation
    this.syncDeviceData.mockImplementation(
      (deviceId: string, metrics: Array<{ type: HealthMetricType; value: number; timestamp: Date; metadata?: Record<string, any> }>) => {
        // Validate input parameters
        if (!deviceId) {
          throw new DatabaseException(
            'Device ID is required',
            DatabaseErrorType.VALIDATION,
            { deviceId }
          );
        }

        if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
          throw new DatabaseException(
            'At least one metric is required',
            DatabaseErrorType.VALIDATION,
            { metrics }
          );
        }

        // Find the device
        const device = this.deviceConnections.find(d => d.id === deviceId);
        if (!device) {
          throw new DatabaseException(
            `Device not found with ID ${deviceId}`,
            DatabaseErrorType.NOT_FOUND,
            { deviceId }
          );
        }

        // Ensure the device is connected
        if (device.connectionStatus !== DeviceConnectionStatus.CONNECTED) {
          throw new DatabaseException(
            `Device with ID ${deviceId} is not connected`,
            DatabaseErrorType.VALIDATION,
            { deviceId, status: device.connectionStatus }
          );
        }

        // Process each metric
        const now = new Date();
        const recordedMetrics = [];

        for (const metric of metrics) {
          // Validate the metric type is supported by the device
          if (!device.supportedMetrics.includes(metric.type)) {
            throw new DatabaseException(
              `Metric type ${metric.type} is not supported by the device`,
              DatabaseErrorType.VALIDATION,
              { deviceId, metricType: metric.type, supportedMetrics: device.supportedMetrics }
            );
          }

          // Create the health metric
          const metricId = `metric-${Date.now()}-${recordedMetrics.length}`;
          const healthMetric: IHealthMetric = {
            id: metricId,
            userId: device.userId,
            type: metric.type,
            value: metric.value,
            unit: this.getUnitForMetricType(metric.type),
            timestamp: metric.timestamp,
            source: 'device',
            deviceId,
            metadata: metric.metadata || {},
            createdAt: now
          };

          // Add to health metrics array
          this.healthMetrics.push(healthMetric);
          recordedMetrics.push(healthMetric);

          // Update goal progress if applicable
          this.updateGoalProgressForMetric(device.userId, metric.type, metric.value, metric.timestamp);
        }

        // Update the device's last sync time
        const deviceIndex = this.deviceConnections.findIndex(d => d.id === deviceId);
        this.deviceConnections[deviceIndex] = {
          ...device,
          lastSyncTime: now,
          updatedAt: now
        };

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'DEVICE_DATA_SYNCED',
          device.userId,
          {
            deviceId,
            deviceType: device.deviceType,
            metricsCount: recordedMetrics.length,
            metricTypes: [...new Set(recordedMetrics.map(m => m.type))],
          }
        );

        return {
          deviceId,
          syncTime: now,
          metricsCount: recordedMetrics.length,
          metrics: recordedMetrics
        };
      }
    );

    // Mock getConnectedDevices implementation
    this.getConnectedDevices.mockImplementation(
      (userId: string, status?: DeviceConnectionStatus) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        // Filter devices by user ID and optionally by status
        let filteredDevices = this.deviceConnections.filter(d => d.userId === userId);
        
        if (status) {
          filteredDevices = filteredDevices.filter(d => d.connectionStatus === status);
        }

        // Sort by last sync time (newest first)
        filteredDevices.sort((a, b) => b.lastSyncTime.getTime() - a.lastSyncTime.getTime());

        return filteredDevices;
      }
    );

    // Mock recordMedicalEvent implementation
    this.recordMedicalEvent.mockImplementation(
      (userId: string, eventType: MedicalEventType, title: string, description: string, date: Date, provider?: string, location?: string, notes?: string, attachments?: Array<{ fileName: string; fileType: string; fileSize: number; url: string }>, fhirReference?: string) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!eventType || !Object.values(MedicalEventType).includes(eventType)) {
          throw new DatabaseException(
            `Invalid event type: ${eventType}`,
            DatabaseErrorType.VALIDATION,
            { eventType, validTypes: Object.values(MedicalEventType) }
          );
        }

        if (!title) {
          throw new DatabaseException(
            'Title is required',
            DatabaseErrorType.VALIDATION,
            { title }
          );
        }

        if (!description) {
          throw new DatabaseException(
            'Description is required',
            DatabaseErrorType.VALIDATION,
            { description }
          );
        }

        if (!date) {
          throw new DatabaseException(
            'Date is required',
            DatabaseErrorType.VALIDATION,
            { date }
          );
        }

        // Create the medical event
        const now = new Date();
        const eventId = `event-${Date.now()}`;
        const medicalEvent: IMedicalEvent = {
          id: eventId,
          userId,
          type: eventType,
          title,
          description,
          date,
          provider: provider || null,
          location: location || null,
          notes: notes || '',
          attachments: [],
          fhirReference: fhirReference || null,
          createdAt: now,
          updatedAt: now
        };

        // Add attachments if provided
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
          medicalEvent.attachments = attachments.map((attachment, index) => ({
            id: `attach-${Date.now()}-${index}`,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            uploadDate: now,
            url: attachment.url
          }));
        }

        // Add to medical events array
        this.medicalEvents.push(medicalEvent);

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'MEDICAL_EVENT_RECORDED',
          userId,
          {
            eventId,
            eventType,
            title,
            date,
            attachmentsCount: medicalEvent.attachments.length,
          }
        );

        return medicalEvent;
      }
    );

    // Mock getMedicalEvents implementation
    this.getMedicalEvents.mockImplementation(
      (userId: string, eventType?: MedicalEventType, startDate?: Date, endDate?: Date, filter?: FilterOptions, sort?: SortOptions, pagination?: PaginationOptions) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        // Filter events by user ID and optionally by event type and date range
        let filteredEvents = this.medicalEvents.filter(e => e.userId === userId);
        
        if (eventType) {
          filteredEvents = filteredEvents.filter(e => e.type === eventType);
        }

        if (startDate) {
          filteredEvents = filteredEvents.filter(e => e.date >= startDate);
        }

        if (endDate) {
          filteredEvents = filteredEvents.filter(e => e.date <= endDate);
        }

        // Apply additional filters if provided
        if (filter) {
          if (filter.provider) {
            filteredEvents = filteredEvents.filter(e => 
              e.provider && e.provider.toLowerCase().includes(filter.provider.toLowerCase())
            );
          }

          if (filter.location) {
            filteredEvents = filteredEvents.filter(e => 
              e.location && e.location.toLowerCase().includes(filter.location.toLowerCase())
            );
          }

          if (filter.title) {
            filteredEvents = filteredEvents.filter(e => 
              e.title.toLowerCase().includes(filter.title.toLowerCase())
            );
          }

          if (filter.hasAttachments !== undefined) {
            filteredEvents = filteredEvents.filter(e => 
              (e.attachments.length > 0) === filter.hasAttachments
            );
          }
        }

        // Apply sorting if provided
        if (sort) {
          const { field, direction } = sort;
          const sortDirection = direction === 'asc' ? 1 : -1;

          filteredEvents.sort((a, b) => {
            if (field === 'date') {
              return sortDirection * (a.date.getTime() - b.date.getTime());
            } else if (field === 'title') {
              return sortDirection * a.title.localeCompare(b.title);
            } else if (field === 'type') {
              return sortDirection * a.type.localeCompare(b.type);
            } else if (field === 'provider') {
              const providerA = a.provider || '';
              const providerB = b.provider || '';
              return sortDirection * providerA.localeCompare(providerB);
            } else {
              // Default sort by date (newest first)
              return -1 * (a.date.getTime() - b.date.getTime());
            }
          });
        } else {
          // Default sort by date (newest first)
          filteredEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
        }

        // Apply pagination if specified
        const total = filteredEvents.length;
        let paginatedEvents = filteredEvents;

        if (pagination) {
          const { page, pageSize } = pagination;
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          paginatedEvents = filteredEvents.slice(startIndex, endIndex);
        }

        return {
          events: paginatedEvents,
          total,
          pagination: pagination || { page: 1, pageSize: total }
        };
      }
    );

    // Mock importFHIRData implementation
    this.importFHIRData.mockImplementation(
      (userId: string, fhirData: Record<string, any>) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!fhirData || Object.keys(fhirData).length === 0) {
          throw new DatabaseException(
            'FHIR data is required',
            DatabaseErrorType.VALIDATION,
            { fhirData }
          );
        }

        // Process FHIR data (simplified implementation)
        const now = new Date();
        const importedData = {
          metrics: [],
          medicalEvents: [],
          timestamp: now
        };

        // Process Observation resources for health metrics
        if (fhirData.Observation && Array.isArray(fhirData.Observation)) {
          for (const observation of fhirData.Observation) {
            try {
              // Map FHIR Observation to health metric
              const metricType = this.mapFHIRCodeToMetricType(observation.code?.coding?.[0]?.code);
              if (!metricType) continue; // Skip if not a supported metric type

              const value = this.extractValueFromFHIRObservation(observation);
              if (value === null) continue; // Skip if no value

              const timestamp = observation.effectiveDateTime ? new Date(observation.effectiveDateTime) : now;
              const unit = observation.valueQuantity?.unit || this.getUnitForMetricType(metricType);

              // Create the health metric
              const metricId = `metric-fhir-${Date.now()}-${importedData.metrics.length}`;
              const healthMetric: IHealthMetric = {
                id: metricId,
                userId,
                type: metricType,
                value,
                unit,
                timestamp,
                source: 'fhir',
                deviceId: null,
                metadata: {
                  fhirId: observation.id,
                  fhirResourceType: 'Observation',
                  fhirSystem: observation.code?.coding?.[0]?.system || null
                },
                createdAt: now
              };

              // Add to health metrics array
              this.healthMetrics.push(healthMetric);
              importedData.metrics.push(healthMetric);

              // Update goal progress if applicable
              this.updateGoalProgressForMetric(userId, metricType, value, timestamp);
            } catch (error) {
              // Log error and continue with next observation
              console.error('Error processing FHIR Observation:', error);
            }
          }
        }

        // Process Encounter resources for medical events
        if (fhirData.Encounter && Array.isArray(fhirData.Encounter)) {
          for (const encounter of fhirData.Encounter) {
            try {
              // Map FHIR Encounter to medical event
              const eventType = MedicalEventType.DOCTOR_VISIT;
              const title = encounter.type?.[0]?.text || 'Medical Visit';
              const description = encounter.reasonCode?.[0]?.text || 'Visit from FHIR data';
              const date = encounter.period?.start ? new Date(encounter.period.start) : now;
              const provider = encounter.participant?.[0]?.individual?.display || null;
              const location = encounter.location?.[0]?.location?.display || null;

              // Create the medical event
              const eventId = `event-fhir-${Date.now()}-${importedData.medicalEvents.length}`;
              const medicalEvent: IMedicalEvent = {
                id: eventId,
                userId,
                type: eventType,
                title,
                description,
                date,
                provider,
                location,
                notes: encounter.reasonCode?.[0]?.text || '',
                attachments: [],
                fhirReference: `Encounter/${encounter.id}`,
                createdAt: now,
                updatedAt: now
              };

              // Add to medical events array
              this.medicalEvents.push(medicalEvent);
              importedData.medicalEvents.push(medicalEvent);
            } catch (error) {
              // Log error and continue with next encounter
              console.error('Error processing FHIR Encounter:', error);
            }
          }
        }

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'FHIR_DATA_IMPORTED',
          userId,
          {
            metricsCount: importedData.metrics.length,
            eventsCount: importedData.medicalEvents.length,
            timestamp: now,
          }
        );

        return {
          userId,
          metricsImported: importedData.metrics.length,
          eventsImported: importedData.medicalEvents.length,
          timestamp: now,
        };
      }
    );

    // Mock exportFHIRData implementation
    this.exportFHIRData.mockImplementation(
      (userId: string, options?: { startDate?: Date; endDate?: Date; resourceTypes?: string[] }) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        const startDate = options?.startDate || new Date(0); // Default to epoch start
        const endDate = options?.endDate || new Date(); // Default to now
        const resourceTypes = options?.resourceTypes || ['Observation', 'Encounter', 'MedicationStatement'];

        // Initialize FHIR Bundle
        const fhirBundle = {
          resourceType: 'Bundle',
          type: 'collection',
          entry: []
        };

        // Export health metrics as FHIR Observations
        if (resourceTypes.includes('Observation')) {
          const metrics = this.healthMetrics.filter(m => 
            m.userId === userId && 
            m.timestamp >= startDate && 
            m.timestamp <= endDate
          );

          for (const metric of metrics) {
            const observation = this.convertMetricToFHIRObservation(metric);
            fhirBundle.entry.push({
              resource: observation
            });
          }
        }

        // Export medical events as FHIR resources
        const events = this.medicalEvents.filter(e => 
          e.userId === userId && 
          e.date >= startDate && 
          e.date <= endDate
        );

        for (const event of events) {
          if (event.type === MedicalEventType.DOCTOR_VISIT && resourceTypes.includes('Encounter')) {
            const encounter = this.convertEventToFHIREncounter(event);
            fhirBundle.entry.push({
              resource: encounter
            });
          } else if (event.type === MedicalEventType.MEDICATION && resourceTypes.includes('MedicationStatement')) {
            const medicationStatement = this.convertEventToFHIRMedicationStatement(event);
            fhirBundle.entry.push({
              resource: medicationStatement
            });
          }
        }

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'FHIR_DATA_EXPORTED',
          userId,
          {
            resourceCount: fhirBundle.entry.length,
            resourceTypes: [...new Set(fhirBundle.entry.map(e => e.resource.resourceType))],
            timeRange: { startDate, endDate },
          }
        );

        return fhirBundle;
      }
    );

    // Mock generateHealthInsights implementation
    this.generateHealthInsights.mockImplementation(
      (userId: string) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        // Get user's health metrics
        const userMetrics = this.healthMetrics.filter(m => m.userId === userId);
        
        // Get user's health goals
        const userGoals = this.healthGoals.filter(g => g.userId === userId && g.status === GoalStatus.ACTIVE);
        
        // Generate insights (simplified implementation)
        const now = new Date();
        const insights: IHealthInsight[] = [];
        
        // Generate trend insights
        const metricTypes = [...new Set(userMetrics.map(m => m.type))];
        
        for (const metricType of metricTypes) {
          // Get metrics of this type, sorted by timestamp
          const typeMetrics = userMetrics
            .filter(m => m.type === metricType)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          if (typeMetrics.length >= 5) { // Need at least 5 data points for a trend
            // Calculate trend (simplified)
            const recentMetrics = typeMetrics.slice(-10); // Last 10 readings
            const oldestValue = recentMetrics[0].value;
            const newestValue = recentMetrics[recentMetrics.length - 1].value;
            const changePercentage = ((newestValue - oldestValue) / oldestValue) * 100;
            
            // Only create insight if change is significant (> 5%)
            if (Math.abs(changePercentage) > 5) {
              const severity = this.getTrendSeverity(metricType, changePercentage);
              const insightId = `insight-trend-${Date.now()}-${insights.length}`;
              
              const insight: IHealthInsight = {
                id: insightId,
                userId,
                title: `${this.getMetricTypeDisplayName(metricType)} Trend`,
                description: this.generateTrendDescription(metricType, changePercentage),
                type: 'trend',
                metricType,
                severity,
                generatedAt: now,
                expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                read: false,
                data: {
                  currentValue: newestValue,
                  previousValue: oldestValue,
                  changePercentage,
                  period: '30 days'
                },
                recommendations: this.generateRecommendations(metricType, severity),
                createdAt: now,
                updatedAt: now
              };
              
              insights.push(insight);
              this.healthInsights.push(insight);
            }
          }
        }
        
        // Generate goal achievement insights
        for (const goal of userGoals) {
          if (goal.streakDays >= 5) { // Significant streak
            const insightId = `insight-goal-${Date.now()}-${insights.length}`;
            
            const insight: IHealthInsight = {
              id: insightId,
              userId,
              title: `${this.getMetricTypeDisplayName(goal.type)} Goal Achievement`,
              description: `You've consistently met your ${this.getMetricTypeDisplayName(goal.type).toLowerCase()} goal for ${goal.streakDays} consecutive days!`,
              type: 'achievement',
              metricType: goal.type,
              severity: 'positive',
              generatedAt: now,
              expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              read: false,
              data: {
                streakDays: goal.streakDays,
                goalTarget: goal.target,
                goalUnit: goal.unit
              },
              recommendations: [
                `Try to increase your goal to ${Math.round(goal.target * 1.2)} ${goal.unit} for an additional challenge`,
                'Share your achievement with friends for motivation'
              ],
              createdAt: now,
              updatedAt: now
            };
            
            insights.push(insight);
            this.healthInsights.push(insight);
          }
        }
        
        // Generate alerts for concerning metrics
        for (const metricType of metricTypes) {
          // Get recent metrics of this type
          const recentMetrics = userMetrics
            .filter(m => m.type === metricType && m.timestamp >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          
          if (recentMetrics.length >= 3) { // Need at least 3 recent readings
            const isOutsideNormalRange = this.checkMetricsOutsideNormalRange(metricType, recentMetrics);
            
            if (isOutsideNormalRange) {
              const insightId = `insight-alert-${Date.now()}-${insights.length}`;
              const normalRange = this.getNormalRangeForMetricType(metricType);
              const averageValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
              
              const insight: IHealthInsight = {
                id: insightId,
                userId,
                title: `${this.getMetricTypeDisplayName(metricType)} Alert`,
                description: this.generateAlertDescription(metricType, recentMetrics),
                type: 'alert',
                metricType,
                severity: 'warning',
                generatedAt: now,
                expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                read: false,
                data: {
                  averageValue,
                  recommendedRangeMin: normalRange.min,
                  recommendedRangeMax: normalRange.max,
                  readings: recentMetrics.length
                },
                recommendations: [
                  'Schedule a follow-up with your healthcare provider',
                  ...this.generateRecommendations(metricType, 'warning')
                ],
                createdAt: now,
                updatedAt: now
              };
              
              insights.push(insight);
              this.healthInsights.push(insight);
            }
          }
        }

        // Simulate sending journey event
        this.sendHealthJourneyEvent(
          'HEALTH_INSIGHTS_GENERATED',
          userId,
          {
            insightsCount: insights.length,
            insightTypes: [...new Set(insights.map(i => i.type))],
          }
        );

        return insights;
      }
    );

    // Mock getHealthInsights implementation
    this.getHealthInsights.mockImplementation(
      (userId: string, options?: { type?: string; metricType?: HealthMetricType; read?: boolean; limit?: number; offset?: number }) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        // Filter insights by user ID and options
        let filteredInsights = this.healthInsights.filter(i => i.userId === userId);
        
        if (options?.type) {
          filteredInsights = filteredInsights.filter(i => i.type === options.type);
        }
        
        if (options?.metricType) {
          filteredInsights = filteredInsights.filter(i => i.metricType === options.metricType);
        }
        
        if (options?.read !== undefined) {
          filteredInsights = filteredInsights.filter(i => i.read === options.read);
        }
        
        // Sort by generation date (newest first)
        filteredInsights.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
        
        // Apply pagination if specified
        const total = filteredInsights.length;
        let paginatedInsights = filteredInsights;
        
        if (options?.limit !== undefined) {
          const startIndex = options.offset || 0;
          const endIndex = startIndex + options.limit;
          paginatedInsights = filteredInsights.slice(startIndex, endIndex);
        }
        
        return {
          insights: paginatedInsights,
          total,
          unreadCount: filteredInsights.filter(i => !i.read).length
        };
      }
    );

    // Mock markInsightAsRead implementation
    this.markInsightAsRead.mockImplementation(
      (insightId: string) => {
        // Validate input parameters
        if (!insightId) {
          throw new DatabaseException(
            'Insight ID is required',
            DatabaseErrorType.VALIDATION,
            { insightId }
          );
        }

        // Find the insight
        const insightIndex = this.healthInsights.findIndex(i => i.id === insightId);
        if (insightIndex === -1) {
          throw new DatabaseException(
            `Insight not found with ID ${insightId}`,
            DatabaseErrorType.NOT_FOUND,
            { insightId }
          );
        }

        const insight = this.healthInsights[insightIndex];

        // Update the insight
        const updatedInsight = {
          ...insight,
          read: true,
          updatedAt: new Date()
        };

        // Replace the insight in the array
        this.healthInsights[insightIndex] = updatedInsight;

        return updatedInsight;
      }
    );

    // Mock getHealthSummary implementation
    this.getHealthSummary.mockImplementation(
      (userId: string) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get user's health metrics in the last 30 days
        const recentMetrics = this.healthMetrics.filter(m => 
          m.userId === userId && 
          m.timestamp >= thirtyDaysAgo
        );

        // Get user's active health goals
        const activeGoals = this.healthGoals.filter(g => 
          g.userId === userId && 
          g.status === GoalStatus.ACTIVE
        );

        // Get user's connected devices
        const connectedDevices = this.deviceConnections.filter(d => 
          d.userId === userId && 
          d.connectionStatus === DeviceConnectionStatus.CONNECTED
        );

        // Get user's medical events in the last 30 days
        const recentEvents = this.medicalEvents.filter(e => 
          e.userId === userId && 
          e.date >= thirtyDaysAgo
        );

        // Get user's unread insights
        const unreadInsights = this.healthInsights.filter(i => 
          i.userId === userId && 
          !i.read
        );

        // Calculate metrics by type
        const metricsByType = new Map<HealthMetricType, IHealthMetric[]>();
        for (const metric of recentMetrics) {
          if (!metricsByType.has(metric.type)) {
            metricsByType.set(metric.type, []);
          }
          metricsByType.get(metric.type)?.push(metric);
        }

        // Calculate latest values and trends for each metric type
        const metricSummaries = [];
        for (const [type, metrics] of metricsByType.entries()) {
          // Sort by timestamp (newest first)
          metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          
          const latestMetric = metrics[0];
          let trend = 0;
          
          if (metrics.length >= 2) {
            // Calculate simple trend (comparing latest to previous)
            const previousMetric = metrics[1];
            trend = latestMetric.value - previousMetric.value;
          }
          
          metricSummaries.push({
            type,
            displayName: this.getMetricTypeDisplayName(type),
            latestValue: latestMetric.value,
            unit: latestMetric.unit,
            timestamp: latestMetric.timestamp,
            trend,
            normalRange: this.getNormalRangeForMetricType(type),
            dataPoints: metrics.length
          });
        }

        // Calculate goal progress summary
        const goalSummaries = activeGoals.map(goal => ({
          id: goal.id,
          type: goal.type,
          displayName: this.getMetricTypeDisplayName(goal.type),
          target: goal.target,
          unit: goal.unit,
          progress: goal.progress,
          streakDays: goal.streakDays,
          frequency: goal.frequency
        }));

        // Calculate device summary
        const deviceSummaries = connectedDevices.map(device => ({
          id: device.id,
          type: device.deviceType,
          manufacturer: device.manufacturer,
          model: device.model,
          lastSyncTime: device.lastSyncTime,
          supportedMetrics: device.supportedMetrics.map(m => this.getMetricTypeDisplayName(m))
        }));

        return {
          userId,
          timestamp: now,
          metrics: {
            total: recentMetrics.length,
            types: metricSummaries.length,
            summaries: metricSummaries
          },
          goals: {
            active: activeGoals.length,
            completed: this.healthGoals.filter(g => 
              g.userId === userId && 
              g.status === GoalStatus.COMPLETED
            ).length,
            summaries: goalSummaries
          },
          devices: {
            connected: connectedDevices.length,
            summaries: deviceSummaries
          },
          medicalEvents: {
            recent: recentEvents.length,
            byType: this.countMedicalEventsByType(recentEvents)
          },
          insights: {
            total: unreadInsights.length,
            byType: this.countInsightsByType(unreadInsights),
            bySeverity: this.countInsightsBySeverity(unreadInsights)
          }
        };
      }
    );

    // Mock validateHealthData implementation
    this.validateHealthData.mockImplementation(
      (dataType: string, data: Record<string, any>) => {
        const errors = [];

        switch (dataType) {
          case 'healthMetric':
            if (!data.type) errors.push({ field: 'type', message: 'Metric type is required' });
            if (data.value === undefined || data.value === null) errors.push({ field: 'value', message: 'Value is required' });
            if (!data.unit) errors.push({ field: 'unit', message: 'Unit is required' });
            break;

          case 'healthGoal':
            if (!data.type) errors.push({ field: 'type', message: 'Metric type is required' });
            if (data.target === undefined || data.target === null) errors.push({ field: 'target', message: 'Target value is required' });
            if (!data.unit) errors.push({ field: 'unit', message: 'Unit is required' });
            if (!data.frequency) errors.push({ field: 'frequency', message: 'Frequency is required' });
            break;

          case 'deviceConnection':
            if (!data.deviceType) errors.push({ field: 'deviceType', message: 'Device type is required' });
            if (!data.manufacturer) errors.push({ field: 'manufacturer', message: 'Manufacturer is required' });
            if (!data.model) errors.push({ field: 'model', message: 'Model is required' });
            if (!data.serialNumber) errors.push({ field: 'serialNumber', message: 'Serial number is required' });
            if (!data.supportedMetrics || !Array.isArray(data.supportedMetrics) || data.supportedMetrics.length === 0) {
              errors.push({ field: 'supportedMetrics', message: 'At least one supported metric is required' });
            }
            break;

          case 'medicalEvent':
            if (!data.type) errors.push({ field: 'type', message: 'Event type is required' });
            if (!data.title) errors.push({ field: 'title', message: 'Title is required' });
            if (!data.description) errors.push({ field: 'description', message: 'Description is required' });
            if (!data.date) errors.push({ field: 'date', message: 'Date is required' });
            break;

          default:
            errors.push({ field: 'dataType', message: `Unknown data type: ${dataType}` });
        }

        return {
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined,
        };
      }
    );

    // Mock sendHealthJourneyEvent implementation (just logs the event)
    this.sendHealthJourneyEvent.mockImplementation(
      (eventType: string, userId: string, payload: Record<string, any>) => {
        console.log(`[MOCK] Health Journey Event: ${eventType}`, { userId, ...payload });
        return Promise.resolve();
      }
    );
  }

  /**
   * Helper method to update goal progress when a new metric is recorded
   * @param userId User ID
   * @param metricType Type of metric
   * @param value Metric value
   * @param timestamp Timestamp of the metric
   * @private
   */
  private updateGoalProgressForMetric(userId: string, metricType: HealthMetricType, value: number, timestamp: Date): void {
    // Find active goals for this metric type
    const goals = this.healthGoals.filter(g => 
      g.userId === userId && 
      g.type === metricType && 
      g.status === GoalStatus.ACTIVE
    );

    if (goals.length === 0) return;

    for (const goal of goals) {
      // Calculate progress based on metric type and goal target
      let progress = 0;

      switch (metricType) {
        case HealthMetricType.STEPS:
          // For steps, progress is percentage of target
          progress = Math.min(100, Math.round((value / goal.target) * 100));
          break;

        case HealthMetricType.SLEEP:
          // For sleep, progress is percentage of target
          progress = Math.min(100, Math.round((value / goal.target) * 100));
          break;

        case HealthMetricType.WEIGHT:
          // For weight, progress depends on whether target is higher or lower than starting weight
          // This is a simplified implementation
          const startingWeight = 75; // Hardcoded for mock
          const targetWeight = goal.target;
          const totalChange = Math.abs(targetWeight - startingWeight);
          const currentChange = Math.abs(value - startingWeight);
          progress = Math.min(100, Math.round((currentChange / totalChange) * 100));
          break;

        default:
          // For other metrics, just set a default progress
          progress = 50;
      }

      // Update the goal
      const goalIndex = this.healthGoals.findIndex(g => g.id === goal.id);
      if (goalIndex !== -1) {
        // Calculate if this is a new day for streak counting
        const isNewDay = this.isNewDayForStreak(goal.lastUpdated, timestamp);
        let newStreakDays = goal.streakDays;

        // Update streak days if applicable
        if (isNewDay) {
          // Check if the goal was met (progress >= 100%)
          if (progress >= 100) {
            newStreakDays += 1;
          } else {
            // Reset streak if goal not met on a new day
            newStreakDays = 0;
          }
        }

        // Update the goal
        this.healthGoals[goalIndex] = {
          ...goal,
          progress,
          streakDays: newStreakDays,
          lastUpdated: timestamp,
          updatedAt: new Date()
        };

        // Check if goal is completed
        if (progress >= 100 && goal.progress < 100) {
          // Simulate sending journey event
          this.sendHealthJourneyEvent(
            'HEALTH_GOAL_COMPLETED',
            goal.userId,
            {
              goalId: goal.id,
              metricType: goal.type,
              target: goal.target,
              unit: goal.unit,
              streakDays: newStreakDays,
            }
          );
        }
      }
    }
  }

  /**
   * Helper method to check if two dates are on different days
   * @param date1 First date
   * @param date2 Second date
   * @returns True if the dates are on different days
   * @private
   */
  private isNewDayForStreak(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Reset time to compare only dates
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    // Check if dates are different and date2 is later than date1
    return d2.getTime() > d1.getTime();
  }

  /**
   * Helper method to parse time interval string into milliseconds
   * @param amount Amount of time units
   * @param unit Time unit (hour, minute, day, etc.)
   * @returns Interval in milliseconds
   * @private
   */
  private parseTimeInterval(amount: string, unit: string): number {
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) return 0;

    switch (unit.toLowerCase()) {
      case 'minute':
      case 'minutes':
        return amountNum * 60 * 1000;
      case 'hour':
      case 'hours':
        return amountNum * 60 * 60 * 1000;
      case 'day':
      case 'days':
        return amountNum * 24 * 60 * 60 * 1000;
      case 'week':
      case 'weeks':
        return amountNum * 7 * 24 * 60 * 60 * 1000;
      case 'month':
      case 'months':
        return amountNum * 30 * 24 * 60 * 60 * 1000; // Approximation
      default:
        return 0;
    }
  }

  /**
   * Helper method to get the unit for a metric type
   * @param metricType Type of metric
   * @returns Unit for the metric type
   * @private
   */
  private getUnitForMetricType(metricType: HealthMetricType): string {
    switch (metricType) {
      case HealthMetricType.HEART_RATE:
        return 'bpm';
      case HealthMetricType.BLOOD_PRESSURE:
        return 'mmHg';
      case HealthMetricType.BLOOD_GLUCOSE:
        return 'mg/dL';
      case HealthMetricType.STEPS:
        return 'steps';
      case HealthMetricType.WEIGHT:
        return 'kg';
      case HealthMetricType.SLEEP:
        return 'hours';
      default:
        return '';
    }
  }

  /**
   * Helper method to map FHIR code to metric type
   * @param code FHIR code
   * @returns Corresponding metric type or null if not supported
   * @private
   */
  private mapFHIRCodeToMetricType(code: string): HealthMetricType | null {
    // This is a simplified mapping
    const codeMap: Record<string, HealthMetricType> = {
      '8867-4': HealthMetricType.HEART_RATE,        // Heart rate
      '85354-9': HealthMetricType.BLOOD_PRESSURE,   // Blood pressure panel
      '8480-6': HealthMetricType.BLOOD_PRESSURE,    // Systolic blood pressure
      '8462-4': HealthMetricType.BLOOD_PRESSURE,    // Diastolic blood pressure
      '15074-8': HealthMetricType.BLOOD_GLUCOSE,    // Glucose [Mass/volume] in Blood
      '41950-7': HealthMetricType.STEPS,            // Number of steps in 24 hour Measured
      '29463-7': HealthMetricType.WEIGHT,           // Body weight
      '93832-4': HealthMetricType.SLEEP,            // Sleep duration
    };

    return code && codeMap[code] ? codeMap[code] : null;
  }

  /**
   * Helper method to extract value from FHIR Observation
   * @param observation FHIR Observation resource
   * @returns Extracted value or null if not found
   * @private
   */
  private extractValueFromFHIRObservation(observation: Record<string, any>): number | null {
    if (observation.valueQuantity?.value !== undefined) {
      return observation.valueQuantity.value;
    }
    
    if (observation.valueInteger !== undefined) {
      return observation.valueInteger;
    }
    
    if (observation.valueDecimal !== undefined) {
      return observation.valueDecimal;
    }
    
    if (observation.component && Array.isArray(observation.component)) {
      // For blood pressure, extract systolic
      for (const component of observation.component) {
        if (component.code?.coding?.[0]?.code === '8480-6' && component.valueQuantity?.value !== undefined) {
          return component.valueQuantity.value; // Return systolic value
        }
      }
    }
    
    return null;
  }

  /**
   * Helper method to convert health metric to FHIR Observation
   * @param metric Health metric
   * @returns FHIR Observation resource
   * @private
   */
  private convertMetricToFHIRObservation(metric: IHealthMetric): Record<string, any> {
    // This is a simplified implementation
    const observation: Record<string, any> = {
      resourceType: 'Observation',
      id: `generated-${metric.id}`,
      status: 'final',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: this.getFHIRCodeForMetricType(metric.type),
            display: this.getMetricTypeDisplayName(metric.type)
          }
        ],
        text: this.getMetricTypeDisplayName(metric.type)
      },
      subject: {
        reference: `Patient/${metric.userId}`
      },
      effectiveDateTime: metric.timestamp.toISOString(),
      issued: metric.createdAt.toISOString(),
      valueQuantity: {
        value: metric.value,
        unit: metric.unit,
        system: 'http://unitsofmeasure.org',
        code: this.getUnitCodeForMetricUnit(metric.unit)
      }
    };

    // Special handling for blood pressure
    if (metric.type === HealthMetricType.BLOOD_PRESSURE && metric.metadata?.diastolic) {
      // Blood pressure is represented as components in FHIR
      delete observation.valueQuantity;
      observation.component = [
        {
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '8480-6',
                display: 'Systolic blood pressure'
              }
            ],
            text: 'Systolic blood pressure'
          },
          valueQuantity: {
            value: metric.value, // Systolic
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        },
        {
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '8462-4',
                display: 'Diastolic blood pressure'
              }
            ],
            text: 'Diastolic blood pressure'
          },
          valueQuantity: {
            value: metric.metadata.diastolic,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }
      ];
    }

    return observation;
  }

  /**
   * Helper method to convert medical event to FHIR Encounter
   * @param event Medical event
   * @returns FHIR Encounter resource
   * @private
   */
  private convertEventToFHIREncounter(event: IMedicalEvent): Record<string, any> {
    // This is a simplified implementation
    return {
      resourceType: 'Encounter',
      id: `generated-${event.id}`,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory'
      },
      type: [
        {
          text: event.title
        }
      ],
      subject: {
        reference: `Patient/${event.userId}`
      },
      participant: event.provider ? [
        {
          individual: {
            display: event.provider
          }
        }
      ] : [],
      period: {
        start: event.date.toISOString(),
        end: event.date.toISOString() // Same as start for simplicity
      },
      location: event.location ? [
        {
          location: {
            display: event.location
          }
        }
      ] : [],
      reasonCode: [
        {
          text: event.description
        }
      ],
      note: event.notes ? [
        {
          text: event.notes
        }
      ] : []
    };
  }

  /**
   * Helper method to convert medical event to FHIR MedicationStatement
   * @param event Medical event
   * @returns FHIR MedicationStatement resource
   * @private
   */
  private convertEventToFHIRMedicationStatement(event: IMedicalEvent): Record<string, any> {
    // This is a simplified implementation
    return {
      resourceType: 'MedicationStatement',
      id: `generated-${event.id}`,
      status: 'active',
      medicationCodeableConcept: {
        text: event.title.replace('Started ', '')
      },
      subject: {
        reference: `Patient/${event.userId}`
      },
      effectiveDateTime: event.date.toISOString(),
      dateAsserted: event.createdAt.toISOString(),
      informationSource: event.provider ? {
        display: event.provider
      } : undefined,
      note: event.notes ? [
        {
          text: event.notes
        }
      ] : [],
      dosage: [
        {
          text: event.description
        }
      ]
    };
  }

  /**
   * Helper method to get FHIR code for metric type
   * @param metricType Type of metric
   * @returns FHIR LOINC code
   * @private
   */
  private getFHIRCodeForMetricType(metricType: HealthMetricType): string {
    switch (metricType) {
      case HealthMetricType.HEART_RATE:
        return '8867-4';
      case HealthMetricType.BLOOD_PRESSURE:
        return '85354-9';
      case HealthMetricType.BLOOD_GLUCOSE:
        return '15074-8';
      case HealthMetricType.STEPS:
        return '41950-7';
      case HealthMetricType.WEIGHT:
        return '29463-7';
      case HealthMetricType.SLEEP:
        return '93832-4';
      default:
        return 'unknown';
    }
  }

  /**
   * Helper method to get unit code for metric unit
   * @param unit Unit string
   * @returns UCUM code
   * @private
   */
  private getUnitCodeForMetricUnit(unit: string): string {
    switch (unit.toLowerCase()) {
      case 'bpm':
        return '/min';
      case 'mmhg':
        return 'mm[Hg]';
      case 'mg/dl':
        return 'mg/dL';
      case 'steps':
        return 'steps';
      case 'kg':
        return 'kg';
      case 'hours':
      case 'hour':
      case 'hr':
        return 'h';
      default:
        return unit;
    }
  }

  /**
   * Helper method to get display name for metric type
   * @param metricType Type of metric
   * @returns Human-readable display name
   * @private
   */
  private getMetricTypeDisplayName(metricType: HealthMetricType): string {
    switch (metricType) {
      case HealthMetricType.HEART_RATE:
        return 'Heart Rate';
      case HealthMetricType.BLOOD_PRESSURE:
        return 'Blood Pressure';
      case HealthMetricType.BLOOD_GLUCOSE:
        return 'Blood Glucose';
      case HealthMetricType.STEPS:
        return 'Steps';
      case HealthMetricType.WEIGHT:
        return 'Weight';
      case HealthMetricType.SLEEP:
        return 'Sleep';
      default:
        return metricType;
    }
  }

  /**
   * Helper method to get normal range for metric type
   * @param metricType Type of metric
   * @returns Normal range object with min and max values
   * @private
   */
  private getNormalRangeForMetricType(metricType: HealthMetricType): { min: number | null; max: number | null } {
    switch (metricType) {
      case HealthMetricType.HEART_RATE:
        return { min: 60, max: 100 };
      case HealthMetricType.BLOOD_PRESSURE:
        return { min: 90, max: 120 }; // Systolic
      case HealthMetricType.BLOOD_GLUCOSE:
        return { min: 70, max: 100 }; // Fasting
      case HealthMetricType.STEPS:
        return { min: 5000, max: null };
      case HealthMetricType.WEIGHT:
        return { min: null, max: null }; // Depends on individual
      case HealthMetricType.SLEEP:
        return { min: 7, max: 9 };
      default:
        return { min: null, max: null };
    }
  }

  /**
   * Helper method to check if metrics are outside normal range
   * @param metricType Type of metric
   * @param metrics Array of metrics to check
   * @returns True if metrics are outside normal range
   * @private
   */
  private checkMetricsOutsideNormalRange(metricType: HealthMetricType, metrics: IHealthMetric[]): boolean {
    const normalRange = this.getNormalRangeForMetricType(metricType);
    
    // If no normal range defined, return false
    if (normalRange.min === null && normalRange.max === null) {
      return false;
    }
    
    // Check if a significant number of metrics are outside the range
    const outsideRangeCount = metrics.filter(m => {
      if (normalRange.min !== null && m.value < normalRange.min) {
        return true;
      }
      if (normalRange.max !== null && m.value > normalRange.max) {
        return true;
      }
      return false;
    }).length;
    
    // Consider it outside range if at least 60% of readings are outside
    return outsideRangeCount >= Math.ceil(metrics.length * 0.6);
  }

  /**
   * Helper method to get trend severity
   * @param metricType Type of metric
   * @param changePercentage Percentage change
   * @returns Severity level (positive, neutral, warning, critical)
   * @private
   */
  private getTrendSeverity(metricType: HealthMetricType, changePercentage: number): string {
    // For some metrics, an increase is good, for others it's bad
    const isIncreasePositive = [
      HealthMetricType.STEPS,
      HealthMetricType.SLEEP
    ].includes(metricType);
    
    const isDecreasePositive = [
      HealthMetricType.BLOOD_PRESSURE,
      HealthMetricType.BLOOD_GLUCOSE
    ].includes(metricType);
    
    // For heart rate, both increase and decrease can be concerning
    const isStabilityPositive = [
      HealthMetricType.HEART_RATE
    ].includes(metricType);
    
    // Weight depends on individual goals, but we'll treat stability as positive for simplicity
    const isWeightMetric = metricType === HealthMetricType.WEIGHT;
    
    // Determine severity based on metric type and change direction
    if (Math.abs(changePercentage) < 5) {
      return isStabilityPositive || isWeightMetric ? 'positive' : 'neutral';
    }
    
    if (changePercentage > 0) { // Increase
      if (isIncreasePositive) {
        return changePercentage > 20 ? 'positive' : 'neutral';
      } else if (isDecreasePositive) {
        return changePercentage > 10 ? 'warning' : 'neutral';
      } else if (isStabilityPositive) {
        return changePercentage > 15 ? 'warning' : 'neutral';
      } else {
        return 'neutral';
      }
    } else { // Decrease
      if (isDecreasePositive) {
        return changePercentage < -20 ? 'positive' : 'neutral';
      } else if (isIncreasePositive) {
        return changePercentage < -10 ? 'warning' : 'neutral';
      } else if (isStabilityPositive) {
        return changePercentage < -15 ? 'warning' : 'neutral';
      } else {
        return 'neutral';
      }
    }
  }

  /**
   * Helper method to generate trend description
   * @param metricType Type of metric
   * @param changePercentage Percentage change
   * @returns Description of the trend
   * @private
   */
  private generateTrendDescription(metricType: HealthMetricType, changePercentage: number): string {
    const direction = changePercentage > 0 ? 'increased' : 'decreased';
    const absChange = Math.abs(changePercentage).toFixed(1);
    const metricName = this.getMetricTypeDisplayName(metricType).toLowerCase();
    
    return `Your ${metricName} has ${direction} by ${absChange}% over the last month.`;
  }

  /**
   * Helper method to generate alert description
   * @param metricType Type of metric
   * @param metrics Recent metrics
   * @returns Description of the alert
   * @private
   */
  private generateAlertDescription(metricType: HealthMetricType, metrics: IHealthMetric[]): string {
    const normalRange = this.getNormalRangeForMetricType(metricType);
    const metricName = this.getMetricTypeDisplayName(metricType);
    const averageValue = (metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length).toFixed(1);
    
    if (normalRange.min !== null && metrics.some(m => m.value < normalRange.min!)) {
      return `Your ${metricName.toLowerCase()} readings have been consistently below the recommended range.`;
    }
    
    if (normalRange.max !== null && metrics.some(m => m.value > normalRange.max!)) {
      return `Your ${metricName.toLowerCase()} readings have been consistently above the recommended range.`;
    }
    
    return `Your ${metricName.toLowerCase()} readings (avg: ${averageValue} ${metrics[0].unit}) require attention.`;
  }

  /**
   * Helper method to generate recommendations
   * @param metricType Type of metric
   * @param severity Severity level
   * @returns Array of recommendations
   * @private
   */
  private generateRecommendations(metricType: HealthMetricType, severity: string): string[] {
    const recommendations: string[] = [];
    
    // Common recommendations
    if (severity === 'warning' || severity === 'critical') {
      recommendations.push('Schedule a follow-up with your healthcare provider');
    }
    
    // Metric-specific recommendations
    switch (metricType) {
      case HealthMetricType.HEART_RATE:
        recommendations.push('Practice stress-reduction techniques like meditation');
        recommendations.push('Maintain regular physical activity');
        if (severity === 'warning') {
          recommendations.push('Monitor your heart rate more frequently');
        }
        break;
        
      case HealthMetricType.BLOOD_PRESSURE:
        recommendations.push('Reduce sodium intake in your diet');
        recommendations.push('Practice stress-reduction techniques');
        recommendations.push('Maintain regular physical activity');
        if (severity === 'warning') {
          recommendations.push('Monitor your blood pressure daily');
        }
        break;
        
      case HealthMetricType.BLOOD_GLUCOSE:
        recommendations.push('Follow a balanced diet with controlled carbohydrate intake');
        recommendations.push('Maintain regular physical activity');
        recommendations.push('Stay hydrated throughout the day');
        break;
        
      case HealthMetricType.STEPS:
        if (severity === 'positive') {
          recommendations.push('Consider increasing your daily step goal for an additional challenge');
          recommendations.push('Try incorporating interval walking for added benefits');
        } else {
          recommendations.push('Try to incorporate short walks throughout your day');
          recommendations.push('Set reminders to take walking breaks');
        }
        break;
        
      case HealthMetricType.WEIGHT:
        recommendations.push('Maintain a balanced diet rich in fruits, vegetables, and lean proteins');
        recommendations.push('Stay consistent with regular physical activity');
        recommendations.push('Track your food intake to maintain awareness');
        break;
        
      case HealthMetricType.SLEEP:
        recommendations.push('Maintain a consistent sleep schedule');
        recommendations.push('Create a relaxing bedtime routine');
        recommendations.push('Limit screen time before bed');
        recommendations.push('Ensure your sleeping environment is comfortable and dark');
        break;
    }
    
    return recommendations;
  }

  /**
   * Helper method to count medical events by type
   * @param events Array of medical events
   * @returns Count by type
   * @private
   */
  private countMedicalEventsByType(events: IMedicalEvent[]): Record<string, number> {
    return events.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Helper method to count insights by type
   * @param insights Array of insights
   * @returns Count by type
   * @private
   */
  private countInsightsByType(insights: IHealthInsight[]): Record<string, number> {
    return insights.reduce((counts, insight) => {
      counts[insight.type] = (counts[insight.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Helper method to count insights by severity
   * @param insights Array of insights
   * @returns Count by severity
   * @private
   */
  private countInsightsBySeverity(insights: IHealthInsight[]): Record<string, number> {
    return insights.reduce((counts, insight) => {
      counts[insight.severity] = (counts[insight.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Reset all mock data to initial state
   */
  public reset(): void {
    // Reset all mock data to initial values
    this.healthMetrics = [
      {
        id: 'metric1',
        userId: 'user1',
        type: HealthMetricType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        timestamp: new Date('2023-06-01T08:00:00Z'),
        source: 'manual',
        deviceId: null,
        metadata: {},
        createdAt: new Date('2023-06-01T08:00:00Z')
      },
      // ... other initial metrics
    ];

    // Reset all mock implementations
    this.setupMockImplementations();
  }

  /**
   * Get a copy of the mock data for testing
   */
  public getMockData() {
    return {
      healthMetrics: [...this.healthMetrics],
      healthGoals: [...this.healthGoals],
      deviceConnections: [...this.deviceConnections],
      medicalEvents: [...this.medicalEvents],
      healthInsights: [...this.healthInsights],
    };
  }

  /**
   * Add custom mock data for testing
   */
  public addMockData(data: {
    healthMetrics?: IHealthMetric[],
    healthGoals?: IHealthGoal[],
    deviceConnections?: IDeviceConnection[],
    medicalEvents?: IMedicalEvent[],
    healthInsights?: IHealthInsight[],
  }) {
    if (data.healthMetrics) {
      this.healthMetrics.push(...data.healthMetrics);
    }
    if (data.healthGoals) {
      this.healthGoals.push(...data.healthGoals);
    }
    if (data.deviceConnections) {
      this.deviceConnections.push(...data.deviceConnections);
    }
    if (data.medicalEvents) {
      this.medicalEvents.push(...data.medicalEvents);
    }
    if (data.healthInsights) {
      this.healthInsights.push(...data.healthInsights);
    }
  }
}