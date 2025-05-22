import { JourneyContextMock } from './journey-context.mock';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock data for health metrics
 */
const mockHealthMetrics = [
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'HEART_RATE',
    value: 72,
    unit: 'bpm',
    timestamp: new Date('2023-01-01T08:00:00Z'),
    source: 'MANUAL',
    deviceId: null,
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'BLOOD_PRESSURE',
    value: 120,
    unit: 'mmHg',
    timestamp: new Date('2023-01-01T08:00:00Z'),
    source: 'MANUAL',
    deviceId: null,
    metadata: { diastolic: 80 },
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'BLOOD_GLUCOSE',
    value: 95,
    unit: 'mg/dL',
    timestamp: new Date('2023-01-01T08:00:00Z'),
    source: 'MANUAL',
    deviceId: null,
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'STEPS',
    value: 8500,
    unit: 'steps',
    timestamp: new Date('2023-01-01T18:00:00Z'),
    source: 'DEVICE',
    deviceId: 'test-device-id-1',
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'WEIGHT',
    value: 70.5,
    unit: 'kg',
    timestamp: new Date('2023-01-01T07:30:00Z'),
    source: 'DEVICE',
    deviceId: 'test-device-id-2',
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'SLEEP',
    value: 7.5,
    unit: 'hours',
    timestamp: new Date('2023-01-01T07:00:00Z'),
    source: 'DEVICE',
    deviceId: 'test-device-id-1',
    metadata: { deepSleep: 2.5, lightSleep: 4, remSleep: 1 },
  },
];

/**
 * Mock data for health goals
 */
const mockHealthGoals = [
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'STEPS',
    target: 10000,
    unit: 'steps',
    frequency: 'DAILY',
    startDate: new Date('2023-01-01'),
    endDate: null,
    status: 'ACTIVE',
    progress: 85,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'WEIGHT',
    target: 68,
    unit: 'kg',
    frequency: 'WEEKLY',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-03-31'),
    status: 'ACTIVE',
    progress: 30,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'SLEEP',
    target: 8,
    unit: 'hours',
    frequency: 'DAILY',
    startDate: new Date('2023-01-01'),
    endDate: null,
    status: 'ACTIVE',
    progress: 90,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-10'),
  },
];

/**
 * Mock data for device connections
 */
const mockDeviceConnections = [
  {
    id: 'test-device-id-1',
    userId: 'test-user-id',
    deviceType: 'Smartwatch',
    manufacturer: 'FitBit',
    model: 'Versa 3',
    serialNumber: 'FB12345678',
    connectionStatus: 'CONNECTED',
    lastSyncDate: new Date('2023-01-01T18:00:00Z'),
    authToken: 'mock-auth-token-1',
    refreshToken: 'mock-refresh-token-1',
    createdAt: new Date('2022-12-15'),
    updatedAt: new Date('2023-01-01'),
    metadata: { batteryLevel: 75, firmware: '1.2.3' },
  },
  {
    id: 'test-device-id-2',
    userId: 'test-user-id',
    deviceType: 'Smart Scale',
    manufacturer: 'Withings',
    model: 'Body+',
    serialNumber: 'WS87654321',
    connectionStatus: 'CONNECTED',
    lastSyncDate: new Date('2023-01-01T07:30:00Z'),
    authToken: 'mock-auth-token-2',
    refreshToken: 'mock-refresh-token-2',
    createdAt: new Date('2022-12-20'),
    updatedAt: new Date('2023-01-01'),
    metadata: { batteryLevel: 90, firmware: '2.1.0' },
  },
  {
    id: 'test-device-id-3',
    userId: 'test-user-id',
    deviceType: 'Blood Pressure Monitor',
    manufacturer: 'Omron',
    model: 'M7 Intelli IT',
    serialNumber: 'OM12345678',
    connectionStatus: 'DISCONNECTED',
    lastSyncDate: new Date('2022-12-25T10:15:00Z'),
    authToken: null,
    refreshToken: null,
    createdAt: new Date('2022-12-10'),
    updatedAt: new Date('2022-12-25'),
    metadata: { batteryLevel: 50, firmware: '1.0.5' },
  },
];

/**
 * Mock data for medical events
 */
const mockMedicalEvents = [
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'DIAGNOSIS',
    title: 'Hypertension Diagnosis',
    description: 'Diagnosed with Stage 1 Hypertension',
    date: new Date('2022-11-15'),
    provider: 'Dr. Smith',
    location: 'Central Medical Clinic',
    fhirResourceId: 'Condition/hypertension-123',
    fhirResourceType: 'Condition',
    createdAt: new Date('2022-11-15'),
    updatedAt: new Date('2022-11-15'),
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'MEDICATION',
    title: 'Lisinopril Prescription',
    description: '10mg daily for blood pressure management',
    date: new Date('2022-11-15'),
    provider: 'Dr. Smith',
    location: 'Central Medical Clinic',
    fhirResourceId: 'MedicationRequest/lisinopril-456',
    fhirResourceType: 'MedicationRequest',
    createdAt: new Date('2022-11-15'),
    updatedAt: new Date('2022-11-15'),
  },
  {
    id: uuidv4(),
    userId: 'test-user-id',
    type: 'PROCEDURE',
    title: 'Blood Test',
    description: 'Complete Blood Count and Metabolic Panel',
    date: new Date('2022-12-01'),
    provider: 'LabCorp',
    location: 'LabCorp Testing Center',
    fhirResourceId: 'Procedure/bloodtest-789',
    fhirResourceType: 'Procedure',
    createdAt: new Date('2022-12-01'),
    updatedAt: new Date('2022-12-01'),
  },
];

/**
 * Mock FHIR resources for testing
 */
const mockFhirResources = {
  'Condition/hypertension-123': {
    resourceType: 'Condition',
    id: 'hypertension-123',
    subject: {
      reference: 'Patient/test-user-id',
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '38341003',
          display: 'Hypertensive disorder, systemic arterial',
        },
      ],
      text: 'Hypertension',
    },
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active',
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed',
        },
      ],
    },
    onsetDateTime: '2022-11-15',
  },
  'MedicationRequest/lisinopril-456': {
    resourceType: 'MedicationRequest',
    id: 'lisinopril-456',
    status: 'active',
    intent: 'order',
    subject: {
      reference: 'Patient/test-user-id',
    },
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '314076',
          display: 'Lisinopril 10 MG Oral Tablet',
        },
      ],
      text: 'Lisinopril 10mg',
    },
    dosageInstruction: [
      {
        text: 'Take 1 tablet by mouth once daily',
        timing: {
          repeat: {
            frequency: 1,
            period: 1,
            periodUnit: 'd',
          },
        },
        doseAndRate: [
          {
            doseQuantity: {
              value: 1,
              unit: 'tablet',
              system: 'http://unitsofmeasure.org',
              code: 'TAB',
            },
          },
        ],
      },
    ],
    authoredOn: '2022-11-15',
  },
  'Procedure/bloodtest-789': {
    resourceType: 'Procedure',
    id: 'bloodtest-789',
    status: 'completed',
    subject: {
      reference: 'Patient/test-user-id',
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '396550006',
          display: 'Blood test',
        },
      ],
      text: 'Blood Test',
    },
    performedDateTime: '2022-12-01',
    performer: [
      {
        actor: {
          display: 'LabCorp',
        },
      },
    ],
  },
};

/**
 * Interface for TimescaleDB query options
 */
interface TimeseriesQueryOptions {
  startTime?: Date;
  endTime?: Date;
  interval?: string;
  aggregation?: 'avg' | 'min' | 'max' | 'sum' | 'count';
  groupBy?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Mock implementation of the Health journey database context
 * Extends the base JourneyContextMock with health-specific functionality
 */
export class HealthContextMock extends JourneyContextMock {
  private healthMetrics: any[] = [...mockHealthMetrics];
  private healthGoals: any[] = [...mockHealthGoals];
  private deviceConnections: any[] = [...mockDeviceConnections];
  private medicalEvents: any[] = [...mockMedicalEvents];
  private fhirResources: Record<string, any> = { ...mockFhirResources };

  constructor() {
    super('health');
    this.setupMockMethods();
  }

  /**
   * Sets up all mock methods for the Health context
   */
  private setupMockMethods(): void {
    this.setupHealthMetricsMethods();
    this.setupHealthGoalsMethods();
    this.setupDeviceConnectionsMethods();
    this.setupMedicalEventsMethods();
    this.setupFhirIntegrationMethods();
  }

  /**
   * Sets up mock methods for health metrics operations
   * Includes TimescaleDB simulation for time-series data
   */
  private setupHealthMetricsMethods(): void {
    // Mock the healthMetric model methods
    this.prisma.healthMetric = {
      findUnique: jest.fn().mockImplementation((args) => {
        const metric = this.healthMetrics.find(m => m.id === args.where.id);
        return Promise.resolve(metric || null);
      }),
      findFirst: jest.fn().mockImplementation((args) => {
        const metric = this.healthMetrics.find(m => {
          if (args.where.userId && m.userId !== args.where.userId) return false;
          if (args.where.type && m.type !== args.where.type) return false;
          return true;
        });
        return Promise.resolve(metric || null);
      }),
      findMany: jest.fn().mockImplementation((args) => {
        let metrics = this.healthMetrics;
        
        // Apply filters
        if (args.where) {
          if (args.where.userId) {
            metrics = metrics.filter(m => m.userId === args.where.userId);
          }
          if (args.where.type) {
            metrics = metrics.filter(m => m.type === args.where.type);
          }
          if (args.where.timestamp) {
            if (args.where.timestamp.gte) {
              metrics = metrics.filter(m => m.timestamp >= args.where.timestamp.gte);
            }
            if (args.where.timestamp.lte) {
              metrics = metrics.filter(m => m.timestamp <= args.where.timestamp.lte);
            }
          }
          if (args.where.source) {
            metrics = metrics.filter(m => m.source === args.where.source);
          }
          if (args.where.deviceId) {
            metrics = metrics.filter(m => m.deviceId === args.where.deviceId);
          }
        }
        
        // Apply sorting
        if (args.orderBy) {
          const orderField = Object.keys(args.orderBy)[0];
          const orderDir = args.orderBy[orderField];
          metrics = [...metrics].sort((a, b) => {
            if (orderDir === 'asc') {
              return a[orderField] < b[orderField] ? -1 : 1;
            } else {
              return a[orderField] > b[orderField] ? -1 : 1;
            }
          });
        }
        
        // Apply pagination
        if (args.skip) {
          metrics = metrics.slice(args.skip);
        }
        if (args.take) {
          metrics = metrics.slice(0, args.take);
        }
        
        return Promise.resolve(metrics);
      }),
      create: jest.fn().mockImplementation((args) => {
        const newMetric = {
          id: args.data.id || uuidv4(),
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.healthMetrics.push(newMetric);
        return Promise.resolve(newMetric);
      }),
      update: jest.fn().mockImplementation((args) => {
        const index = this.healthMetrics.findIndex(m => m.id === args.where.id);
        if (index === -1) {
          throw new Error(`Health metric with ID ${args.where.id} not found`);
        }
        const updatedMetric = {
          ...this.healthMetrics[index],
          ...args.data,
          updatedAt: new Date(),
        };
        this.healthMetrics[index] = updatedMetric;
        return Promise.resolve(updatedMetric);
      }),
      delete: jest.fn().mockImplementation((args) => {
        const index = this.healthMetrics.findIndex(m => m.id === args.where.id);
        if (index === -1) {
          throw new Error(`Health metric with ID ${args.where.id} not found`);
        }
        const deletedMetric = this.healthMetrics[index];
        this.healthMetrics.splice(index, 1);
        return Promise.resolve(deletedMetric);
      }),
      count: jest.fn().mockImplementation((args) => {
        let count = this.healthMetrics.length;
        if (args?.where) {
          if (args.where.userId) {
            count = this.healthMetrics.filter(m => m.userId === args.where.userId).length;
          }
          if (args.where.type) {
            count = this.healthMetrics.filter(m => m.type === args.where.type).length;
          }
        }
        return Promise.resolve(count);
      }),
    };
    
    // Add TimescaleDB-specific methods
    this.addTimescaleDBMethods();
  }

  /**
   * Adds TimescaleDB-specific methods for time-series data operations
   */
  private addTimescaleDBMethods(): void {
    // Mock method for time-bucketed queries (TimescaleDB time_bucket function)
    this.timeBucketQuery = jest.fn().mockImplementation(
      (metricType: string, userId: string, options: TimeseriesQueryOptions = {}) => {
        const {
          startTime,
          endTime,
          interval = '1 day',
          aggregation = 'avg',
          limit = 100,
          offset = 0,
        } = options;
        
        // Filter metrics by type and user
        let metrics = this.healthMetrics.filter(m => 
          m.type === metricType && m.userId === userId
        );
        
        // Apply time range filters
        if (startTime) {
          metrics = metrics.filter(m => m.timestamp >= startTime);
        }
        if (endTime) {
          metrics = metrics.filter(m => m.timestamp <= endTime);
        }
        
        // Sort by timestamp
        metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        // Simulate time bucketing
        const buckets: Record<string, any[]> = {};
        const intervalMs = this.parseInterval(interval);
        
        metrics.forEach(metric => {
          const bucketTime = new Date(
            Math.floor(metric.timestamp.getTime() / intervalMs) * intervalMs
          );
          const bucketKey = bucketTime.toISOString();
          
          if (!buckets[bucketKey]) {
            buckets[bucketKey] = [];
          }
          
          buckets[bucketKey].push(metric);
        });
        
        // Apply aggregation to each bucket
        const results = Object.entries(buckets).map(([bucketTime, bucketMetrics]) => {
          let value: number;
          
          switch (aggregation) {
            case 'min':
              value = Math.min(...bucketMetrics.map(m => m.value));
              break;
            case 'max':
              value = Math.max(...bucketMetrics.map(m => m.value));
              break;
            case 'sum':
              value = bucketMetrics.reduce((sum, m) => sum + m.value, 0);
              break;
            case 'count':
              value = bucketMetrics.length;
              break;
            case 'avg':
            default:
              value = bucketMetrics.reduce((sum, m) => sum + m.value, 0) / bucketMetrics.length;
              break;
          }
          
          return {
            bucket: new Date(bucketTime),
            value: Number(value.toFixed(2)),
            count: bucketMetrics.length,
          };
        });
        
        // Sort by bucket time
        results.sort((a, b) => a.bucket.getTime() - b.bucket.getTime());
        
        // Apply pagination
        return Promise.resolve(results.slice(offset, offset + limit));
      }
    );
    
    // Mock method for continuous aggregates (TimescaleDB materialized views)
    this.getMetricAggregates = jest.fn().mockImplementation(
      (metricType: string, userId: string, period: 'daily' | 'weekly' | 'monthly') => {
        // Map period to interval
        const intervalMap = {
          daily: '1 day',
          weekly: '7 days',
          monthly: '30 days',
        };
        
        // Use the time bucket query with the appropriate interval
        return this.timeBucketQuery(metricType, userId, {
          interval: intervalMap[period],
          aggregation: 'avg',
        });
      }
    );
  }

  /**
   * Helper method to parse interval string to milliseconds
   */
  private parseInterval(interval: string): number {
    const [amount, unit] = interval.split(' ');
    const amountNum = parseInt(amount, 10);
    
    switch (unit) {
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
        return amountNum * 24 * 60 * 60 * 1000; // Default to days
    }
  }

  /**
   * Sets up mock methods for health goals operations
   */
  private setupHealthGoalsMethods(): void {
    this.prisma.healthGoal = {
      findUnique: jest.fn().mockImplementation((args) => {
        const goal = this.healthGoals.find(g => g.id === args.where.id);
        return Promise.resolve(goal || null);
      }),
      findFirst: jest.fn().mockImplementation((args) => {
        const goal = this.healthGoals.find(g => {
          if (args.where.userId && g.userId !== args.where.userId) return false;
          if (args.where.type && g.type !== args.where.type) return false;
          if (args.where.status && g.status !== args.where.status) return false;
          return true;
        });
        return Promise.resolve(goal || null);
      }),
      findMany: jest.fn().mockImplementation((args) => {
        let goals = this.healthGoals;
        
        // Apply filters
        if (args.where) {
          if (args.where.userId) {
            goals = goals.filter(g => g.userId === args.where.userId);
          }
          if (args.where.type) {
            goals = goals.filter(g => g.type === args.where.type);
          }
          if (args.where.status) {
            goals = goals.filter(g => g.status === args.where.status);
          }
        }
        
        // Apply sorting
        if (args.orderBy) {
          const orderField = Object.keys(args.orderBy)[0];
          const orderDir = args.orderBy[orderField];
          goals = [...goals].sort((a, b) => {
            if (orderDir === 'asc') {
              return a[orderField] < b[orderField] ? -1 : 1;
            } else {
              return a[orderField] > b[orderField] ? -1 : 1;
            }
          });
        }
        
        // Apply pagination
        if (args.skip) {
          goals = goals.slice(args.skip);
        }
        if (args.take) {
          goals = goals.slice(0, args.take);
        }
        
        return Promise.resolve(goals);
      }),
      create: jest.fn().mockImplementation((args) => {
        const newGoal = {
          id: args.data.id || uuidv4(),
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.healthGoals.push(newGoal);
        return Promise.resolve(newGoal);
      }),
      update: jest.fn().mockImplementation((args) => {
        const index = this.healthGoals.findIndex(g => g.id === args.where.id);
        if (index === -1) {
          throw new Error(`Health goal with ID ${args.where.id} not found`);
        }
        const updatedGoal = {
          ...this.healthGoals[index],
          ...args.data,
          updatedAt: new Date(),
        };
        this.healthGoals[index] = updatedGoal;
        return Promise.resolve(updatedGoal);
      }),
      delete: jest.fn().mockImplementation((args) => {
        const index = this.healthGoals.findIndex(g => g.id === args.where.id);
        if (index === -1) {
          throw new Error(`Health goal with ID ${args.where.id} not found`);
        }
        const deletedGoal = this.healthGoals[index];
        this.healthGoals.splice(index, 1);
        return Promise.resolve(deletedGoal);
      }),
      count: jest.fn().mockImplementation((args) => {
        let count = this.healthGoals.length;
        if (args?.where) {
          if (args.where.userId) {
            count = this.healthGoals.filter(g => g.userId === args.where.userId).length;
          }
          if (args.where.type) {
            count = this.healthGoals.filter(g => g.type === args.where.type).length;
          }
          if (args.where.status) {
            count = this.healthGoals.filter(g => g.status === args.where.status).length;
          }
        }
        return Promise.resolve(count);
      }),
    };
    
    // Add goal progress calculation method
    this.calculateGoalProgress = jest.fn().mockImplementation(
      async (goalId: string) => {
        const goal = await this.prisma.healthGoal.findUnique({ where: { id: goalId } });
        if (!goal) {
          throw new Error(`Health goal with ID ${goalId} not found`);
        }
        
        // Get the latest metric for this goal type
        const latestMetric = await this.prisma.healthMetric.findFirst({
          where: {
            userId: goal.userId,
            type: goal.type,
          },
          orderBy: {
            timestamp: 'desc',
          },
        });
        
        if (!latestMetric) {
          return { progress: 0, isCompleted: false };
        }
        
        // Calculate progress based on goal type
        let progress = 0;
        let isCompleted = false;
        
        switch (goal.type) {
          case 'STEPS':
            progress = Math.min(100, Math.round((latestMetric.value / goal.target) * 100));
            isCompleted = latestMetric.value >= goal.target;
            break;
          case 'WEIGHT':
            // For weight loss goals, progress is inverse
            const startWeight = 70.5; // Mock starting weight
            const weightDiff = startWeight - latestMetric.value;
            const targetDiff = startWeight - goal.target;
            progress = Math.min(100, Math.max(0, Math.round((weightDiff / targetDiff) * 100)));
            isCompleted = latestMetric.value <= goal.target;
            break;
          case 'SLEEP':
            progress = Math.min(100, Math.round((latestMetric.value / goal.target) * 100));
            isCompleted = latestMetric.value >= goal.target;
            break;
          default:
            progress = 0;
            isCompleted = false;
        }
        
        // Update the goal progress
        await this.prisma.healthGoal.update({
          where: { id: goalId },
          data: { progress },
        });
        
        return { progress, isCompleted };
      }
    );
  }

  /**
   * Sets up mock methods for device connections operations
   */
  private setupDeviceConnectionsMethods(): void {
    this.prisma.deviceConnection = {
      findUnique: jest.fn().mockImplementation((args) => {
        const device = this.deviceConnections.find(d => d.id === args.where.id);
        return Promise.resolve(device || null);
      }),
      findFirst: jest.fn().mockImplementation((args) => {
        const device = this.deviceConnections.find(d => {
          if (args.where.userId && d.userId !== args.where.userId) return false;
          if (args.where.deviceType && d.deviceType !== args.where.deviceType) return false;
          if (args.where.connectionStatus && d.connectionStatus !== args.where.connectionStatus) return false;
          return true;
        });
        return Promise.resolve(device || null);
      }),
      findMany: jest.fn().mockImplementation((args) => {
        let devices = this.deviceConnections;
        
        // Apply filters
        if (args.where) {
          if (args.where.userId) {
            devices = devices.filter(d => d.userId === args.where.userId);
          }
          if (args.where.deviceType) {
            devices = devices.filter(d => d.deviceType === args.where.deviceType);
          }
          if (args.where.connectionStatus) {
            devices = devices.filter(d => d.connectionStatus === args.where.connectionStatus);
          }
        }
        
        // Apply sorting
        if (args.orderBy) {
          const orderField = Object.keys(args.orderBy)[0];
          const orderDir = args.orderBy[orderField];
          devices = [...devices].sort((a, b) => {
            if (orderDir === 'asc') {
              return a[orderField] < b[orderField] ? -1 : 1;
            } else {
              return a[orderField] > b[orderField] ? -1 : 1;
            }
          });
        }
        
        // Apply pagination
        if (args.skip) {
          devices = devices.slice(args.skip);
        }
        if (args.take) {
          devices = devices.slice(0, args.take);
        }
        
        return Promise.resolve(devices);
      }),
      create: jest.fn().mockImplementation((args) => {
        const newDevice = {
          id: args.data.id || uuidv4(),
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.deviceConnections.push(newDevice);
        return Promise.resolve(newDevice);
      }),
      update: jest.fn().mockImplementation((args) => {
        const index = this.deviceConnections.findIndex(d => d.id === args.where.id);
        if (index === -1) {
          throw new Error(`Device connection with ID ${args.where.id} not found`);
        }
        const updatedDevice = {
          ...this.deviceConnections[index],
          ...args.data,
          updatedAt: new Date(),
        };
        this.deviceConnections[index] = updatedDevice;
        return Promise.resolve(updatedDevice);
      }),
      delete: jest.fn().mockImplementation((args) => {
        const index = this.deviceConnections.findIndex(d => d.id === args.where.id);
        if (index === -1) {
          throw new Error(`Device connection with ID ${args.where.id} not found`);
        }
        const deletedDevice = this.deviceConnections[index];
        this.deviceConnections.splice(index, 1);
        return Promise.resolve(deletedDevice);
      }),
      count: jest.fn().mockImplementation((args) => {
        let count = this.deviceConnections.length;
        if (args?.where) {
          if (args.where.userId) {
            count = this.deviceConnections.filter(d => d.userId === args.where.userId).length;
          }
          if (args.where.deviceType) {
            count = this.deviceConnections.filter(d => d.deviceType === args.where.deviceType).length;
          }
          if (args.where.connectionStatus) {
            count = this.deviceConnections.filter(d => d.connectionStatus === args.where.connectionStatus).length;
          }
        }
        return Promise.resolve(count);
      }),
    };
    
    // Add device sync method
    this.syncDeviceData = jest.fn().mockImplementation(
      async (deviceId: string) => {
        const device = await this.prisma.deviceConnection.findUnique({ where: { id: deviceId } });
        if (!device) {
          throw new Error(`Device with ID ${deviceId} not found`);
        }
        
        if (device.connectionStatus !== 'CONNECTED') {
          throw new Error(`Device with ID ${deviceId} is not connected`);
        }
        
        // Simulate device sync by creating new metrics
        const now = new Date();
        const mockMetrics = [];
        
        // Generate mock metrics based on device type
        switch (device.deviceType) {
          case 'Smartwatch':
            // Heart rate
            mockMetrics.push({
              userId: device.userId,
              type: 'HEART_RATE',
              value: 65 + Math.floor(Math.random() * 20), // 65-85 bpm
              unit: 'bpm',
              timestamp: now,
              source: 'DEVICE',
              deviceId: device.id,
            });
            
            // Steps
            mockMetrics.push({
              userId: device.userId,
              type: 'STEPS',
              value: 8000 + Math.floor(Math.random() * 4000), // 8000-12000 steps
              unit: 'steps',
              timestamp: now,
              source: 'DEVICE',
              deviceId: device.id,
            });
            
            // Sleep
            mockMetrics.push({
              userId: device.userId,
              type: 'SLEEP',
              value: 6 + Math.random() * 2, // 6-8 hours
              unit: 'hours',
              timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
              source: 'DEVICE',
              deviceId: device.id,
              metadata: {
                deepSleep: 1.5 + Math.random(),
                lightSleep: 3 + Math.random(),
                remSleep: 1 + Math.random() * 0.5,
              },
            });
            break;
            
          case 'Smart Scale':
            // Weight
            mockMetrics.push({
              userId: device.userId,
              type: 'WEIGHT',
              value: 70 + Math.random() * 2, // 70-72 kg
              unit: 'kg',
              timestamp: now,
              source: 'DEVICE',
              deviceId: device.id,
              metadata: {
                bodyFat: 20 + Math.random() * 5,
                muscleMass: 50 + Math.random() * 3,
                waterPercentage: 55 + Math.random() * 5,
              },
            });
            break;
            
          case 'Blood Pressure Monitor':
            // Blood pressure
            mockMetrics.push({
              userId: device.userId,
              type: 'BLOOD_PRESSURE',
              value: 120 + Math.floor(Math.random() * 10), // 120-130 systolic
              unit: 'mmHg',
              timestamp: now,
              source: 'DEVICE',
              deviceId: device.id,
              metadata: {
                diastolic: 75 + Math.floor(Math.random() * 10), // 75-85 diastolic
                pulse: 70 + Math.floor(Math.random() * 10), // 70-80 pulse
              },
            });
            break;
        }
        
        // Create the metrics
        const createdMetrics = [];
        for (const metric of mockMetrics) {
          const created = await this.prisma.healthMetric.create({ data: metric });
          createdMetrics.push(created);
        }
        
        // Update device last sync date
        await this.prisma.deviceConnection.update({
          where: { id: deviceId },
          data: { lastSyncDate: now },
        });
        
        return {
          syncedAt: now,
          metricsCount: createdMetrics.length,
          metrics: createdMetrics,
        };
      }
    );
    
    // Add device connection method
    this.connectDevice = jest.fn().mockImplementation(
      async (userId: string, deviceInfo: any) => {
        // Check if device already exists
        const existingDevice = await this.prisma.deviceConnection.findFirst({
          where: {
            userId,
            serialNumber: deviceInfo.serialNumber,
          },
        });
        
        if (existingDevice) {
          // Update existing device
          return this.prisma.deviceConnection.update({
            where: { id: existingDevice.id },
            data: {
              connectionStatus: 'CONNECTED',
              authToken: `mock-auth-token-${Date.now()}`,
              refreshToken: `mock-refresh-token-${Date.now()}`,
              lastSyncDate: new Date(),
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new device connection
          return this.prisma.deviceConnection.create({
            data: {
              userId,
              deviceType: deviceInfo.deviceType,
              manufacturer: deviceInfo.manufacturer,
              model: deviceInfo.model,
              serialNumber: deviceInfo.serialNumber,
              connectionStatus: 'CONNECTED',
              authToken: `mock-auth-token-${Date.now()}`,
              refreshToken: `mock-refresh-token-${Date.now()}`,
              lastSyncDate: new Date(),
              metadata: deviceInfo.metadata || {},
            },
          });
        }
      }
    );
  }

  /**
   * Sets up mock methods for medical events operations
   */
  private setupMedicalEventsMethods(): void {
    this.prisma.medicalEvent = {
      findUnique: jest.fn().mockImplementation((args) => {
        const event = this.medicalEvents.find(e => e.id === args.where.id);
        return Promise.resolve(event || null);
      }),
      findFirst: jest.fn().mockImplementation((args) => {
        const event = this.medicalEvents.find(e => {
          if (args.where.userId && e.userId !== args.where.userId) return false;
          if (args.where.type && e.type !== args.where.type) return false;
          if (args.where.fhirResourceId && e.fhirResourceId !== args.where.fhirResourceId) return false;
          return true;
        });
        return Promise.resolve(event || null);
      }),
      findMany: jest.fn().mockImplementation((args) => {
        let events = this.medicalEvents;
        
        // Apply filters
        if (args.where) {
          if (args.where.userId) {
            events = events.filter(e => e.userId === args.where.userId);
          }
          if (args.where.type) {
            events = events.filter(e => e.type === args.where.type);
          }
          if (args.where.fhirResourceType) {
            events = events.filter(e => e.fhirResourceType === args.where.fhirResourceType);
          }
        }
        
        // Apply sorting
        if (args.orderBy) {
          const orderField = Object.keys(args.orderBy)[0];
          const orderDir = args.orderBy[orderField];
          events = [...events].sort((a, b) => {
            if (orderDir === 'asc') {
              return a[orderField] < b[orderField] ? -1 : 1;
            } else {
              return a[orderField] > b[orderField] ? -1 : 1;
            }
          });
        }
        
        // Apply pagination
        if (args.skip) {
          events = events.slice(args.skip);
        }
        if (args.take) {
          events = events.slice(0, args.take);
        }
        
        return Promise.resolve(events);
      }),
      create: jest.fn().mockImplementation((args) => {
        const newEvent = {
          id: args.data.id || uuidv4(),
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.medicalEvents.push(newEvent);
        return Promise.resolve(newEvent);
      }),
      update: jest.fn().mockImplementation((args) => {
        const index = this.medicalEvents.findIndex(e => e.id === args.where.id);
        if (index === -1) {
          throw new Error(`Medical event with ID ${args.where.id} not found`);
        }
        const updatedEvent = {
          ...this.medicalEvents[index],
          ...args.data,
          updatedAt: new Date(),
        };
        this.medicalEvents[index] = updatedEvent;
        return Promise.resolve(updatedEvent);
      }),
      delete: jest.fn().mockImplementation((args) => {
        const index = this.medicalEvents.findIndex(e => e.id === args.where.id);
        if (index === -1) {
          throw new Error(`Medical event with ID ${args.where.id} not found`);
        }
        const deletedEvent = this.medicalEvents[index];
        this.medicalEvents.splice(index, 1);
        return Promise.resolve(deletedEvent);
      }),
      count: jest.fn().mockImplementation((args) => {
        let count = this.medicalEvents.length;
        if (args?.where) {
          if (args.where.userId) {
            count = this.medicalEvents.filter(e => e.userId === args.where.userId).length;
          }
          if (args.where.type) {
            count = this.medicalEvents.filter(e => e.type === args.where.type).length;
          }
        }
        return Promise.resolve(count);
      }),
    };
  }

  /**
   * Sets up mock methods for FHIR integration
   */
  private setupFhirIntegrationMethods(): void {
    // Mock method to get FHIR resource
    this.getFhirResource = jest.fn().mockImplementation(
      async (resourceId: string) => {
        if (this.fhirResources[resourceId]) {
          return Promise.resolve(this.fhirResources[resourceId]);
        }
        return Promise.resolve(null);
      }
    );
    
    // Mock method to create FHIR resource
    this.createFhirResource = jest.fn().mockImplementation(
      async (resourceType: string, resource: any) => {
        const id = resource.id || `${resourceType.toLowerCase()}-${uuidv4()}`;
        const fullId = `${resourceType}/${id}`;
        
        this.fhirResources[fullId] = {
          resourceType,
          id,
          ...resource,
        };
        
        return Promise.resolve({
          resourceType,
          id,
          ...resource,
        });
      }
    );
    
    // Mock method to update FHIR resource
    this.updateFhirResource = jest.fn().mockImplementation(
      async (resourceId: string, updates: any) => {
        if (!this.fhirResources[resourceId]) {
          throw new Error(`FHIR resource ${resourceId} not found`);
        }
        
        this.fhirResources[resourceId] = {
          ...this.fhirResources[resourceId],
          ...updates,
        };
        
        return Promise.resolve(this.fhirResources[resourceId]);
      }
    );
    
    // Mock method to search FHIR resources
    this.searchFhirResources = jest.fn().mockImplementation(
      async (resourceType: string, params: Record<string, string>) => {
        const results = Object.values(this.fhirResources).filter(resource => {
          if (resource.resourceType !== resourceType) return false;
          
          // Check if all params match
          for (const [key, value] of Object.entries(params)) {
            // Handle special case for patient reference
            if (key === 'patient' && resource.subject?.reference === `Patient/${value}`) {
              continue;
            }
            
            // Simple string match for other parameters
            if (!resource[key] || !resource[key].toString().includes(value)) {
              return false;
            }
          }
          
          return true;
        });
        
        return Promise.resolve({
          resourceType: 'Bundle',
          type: 'searchset',
          total: results.length,
          entry: results.map(resource => ({
            resource,
          })),
        });
      }
    );
    
    // Mock method to import FHIR data
    this.importFhirData = jest.fn().mockImplementation(
      async (userId: string, fhirBundle: any) => {
        if (!fhirBundle || !fhirBundle.entry || !Array.isArray(fhirBundle.entry)) {
          throw new Error('Invalid FHIR bundle format');
        }
        
        const importedResources = [];
        const createdEvents = [];
        
        for (const entry of fhirBundle.entry) {
          const resource = entry.resource;
          if (!resource || !resource.resourceType) continue;
          
          // Store the FHIR resource
          const resourceId = `${resource.resourceType}/${resource.id}`;
          this.fhirResources[resourceId] = resource;
          importedResources.push(resource);
          
          // Create a medical event for relevant resource types
          if (['Condition', 'MedicationRequest', 'Procedure', 'Observation'].includes(resource.resourceType)) {
            let eventType, title, description;
            
            switch (resource.resourceType) {
              case 'Condition':
                eventType = 'DIAGNOSIS';
                title = resource.code?.text || 'Unknown Condition';
                description = `Diagnosed with ${title}`;
                break;
              case 'MedicationRequest':
                eventType = 'MEDICATION';
                title = resource.medicationCodeableConcept?.text || 'Unknown Medication';
                description = resource.dosageInstruction?.[0]?.text || 'No dosage information';
                break;
              case 'Procedure':
                eventType = 'PROCEDURE';
                title = resource.code?.text || 'Unknown Procedure';
                description = resource.note?.[0]?.text || 'No procedure details';
                break;
              case 'Observation':
                eventType = 'OBSERVATION';
                title = resource.code?.text || 'Unknown Observation';
                description = `Value: ${resource.valueQuantity?.value || 'N/A'} ${resource.valueQuantity?.unit || ''}`;
                break;
            }
            
            // Create the medical event
            const event = await this.prisma.medicalEvent.create({
              data: {
                userId,
                type: eventType,
                title,
                description,
                date: new Date(resource.effectiveDateTime || resource.onsetDateTime || resource.performedDateTime || resource.authoredOn || new Date()),
                provider: resource.performer?.[0]?.actor?.display || resource.recorder?.display || 'Unknown Provider',
                location: resource.location?.display || 'Unknown Location',
                fhirResourceId: resourceId,
                fhirResourceType: resource.resourceType,
              },
            });
            
            createdEvents.push(event);
          }
        }
        
        return Promise.resolve({
          importedCount: importedResources.length,
          eventsCreated: createdEvents.length,
          resources: importedResources,
          events: createdEvents,
        });
      }
    );
  }

  /**
   * Resets all mock data to initial state
   */
  resetMockData(): void {
    this.healthMetrics = [...mockHealthMetrics];
    this.healthGoals = [...mockHealthGoals];
    this.deviceConnections = [...mockDeviceConnections];
    this.medicalEvents = [...mockMedicalEvents];
    this.fhirResources = { ...mockFhirResources };
  }

  /**
   * Adds custom mock data for testing
   */
  addMockData(data: {
    healthMetrics?: any[];
    healthGoals?: any[];
    deviceConnections?: any[];
    medicalEvents?: any[];
    fhirResources?: Record<string, any>;
  }): void {
    if (data.healthMetrics) {
      this.healthMetrics = [...this.healthMetrics, ...data.healthMetrics];
    }
    if (data.healthGoals) {
      this.healthGoals = [...this.healthGoals, ...data.healthGoals];
    }
    if (data.deviceConnections) {
      this.deviceConnections = [...this.deviceConnections, ...data.deviceConnections];
    }
    if (data.medicalEvents) {
      this.medicalEvents = [...this.medicalEvents, ...data.medicalEvents];
    }
    if (data.fhirResources) {
      this.fhirResources = { ...this.fhirResources, ...data.fhirResources };
    }
  }
}