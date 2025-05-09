/**
 * @file journey-context-scenarios.ts
 * @description Test fixtures for journey-specific database contexts, enabling isolated testing
 * of Health, Care, and Plan journey database operations. These fixtures validate that each
 * journey's database operations use the correct context, ensuring data isolation and proper
 * cross-journey data access patterns.
 */

import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JourneyType } from '../../../src/types/journey.types';
import { HealthContext } from '../../../src/contexts/health.context';
import { CareContext } from '../../../src/contexts/care.context';
import { PlanContext } from '../../../src/contexts/plan.context';
import { BaseJourneyContext } from '../../../src/contexts/base-journey.context';
import { DatabaseContextOptions } from '../../../src/types/context.types';
import { TransactionIsolationLevel } from '../../../src/transactions/transaction.interface';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../../../src/errors/database-error.types';

/**
 * Interface for journey context test scenario
 */
export interface JourneyContextScenario {
  /** Unique name for the scenario */
  name: string;
  
  /** Description of what the scenario tests */
  description: string;
  
  /** The journey type being tested */
  journeyType: JourneyType;
  
  /** Configuration options for the context */
  contextOptions?: DatabaseContextOptions;
  
  /** Mock data to be used in the scenario */
  mockData?: Record<string, any>;
  
  /** Expected results for the scenario */
  expectedResults?: Record<string, any>;
  
  /** Whether this scenario tests cross-journey access */
  isCrossJourney?: boolean;
  
  /** Additional journey types involved in cross-journey scenarios */
  additionalJourneyTypes?: JourneyType[];
  
  /** Whether this scenario should throw an error */
  shouldThrowError?: boolean;
  
  /** Expected error type if shouldThrowError is true */
  expectedErrorType?: DatabaseErrorType;
}

/**
 * Health journey context test scenarios
 */
export const healthJourneyScenarios: JourneyContextScenario[] = [
  {
    name: 'health-metrics-basic',
    description: 'Basic health metrics storage and retrieval with proper context',
    journeyType: JourneyType.HEALTH,
    contextOptions: {
      enableTimeSeriesOptimization: true,
      healthMetricsBatchSize: 100,
    },
    mockData: {
      userId: 'user-123',
      metrics: [
        { type: 'HEART_RATE', value: 72, timestamp: new Date() },
        { type: 'BLOOD_PRESSURE', value: '120/80', timestamp: new Date() },
        { type: 'STEPS', value: 8500, timestamp: new Date() },
      ],
    },
    expectedResults: {
      storedMetricsCount: 3,
      journeyEvents: ['health_metric_recorded'],
    },
  },
  {
    name: 'health-context-isolation',
    description: 'Validates that health context cannot access care journey data directly',
    journeyType: JourneyType.HEALTH,
    isCrossJourney: true,
    additionalJourneyTypes: [JourneyType.CARE],
    mockData: {
      userId: 'user-123',
      careAppointmentId: 'appointment-456',
    },
    shouldThrowError: true,
    expectedErrorType: DatabaseErrorType.AUTHORIZATION_ERROR,
  },
  {
    name: 'health-device-connection',
    description: 'Tests device connection and data synchronization',
    journeyType: JourneyType.HEALTH,
    contextOptions: {
      enableWearableIntegration: true,
    },
    mockData: {
      userId: 'user-123',
      deviceType: 'Smartwatch',
      deviceId: 'device-789',
      connectionData: {
        token: 'mock-token-123',
        refreshToken: 'mock-refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
      },
      syncData: {
        startTime: new Date(Date.now() - 86400000), // 24 hours ago
        endTime: new Date(),
        dataTypes: ['HEART_RATE', 'STEPS'],
      },
    },
    expectedResults: {
      connectionStatus: 'connected',
      syncedMetricsCount: 48, // Assuming hourly data points
      journeyEvents: ['device_connected', 'device_synced'],
    },
  },
  {
    name: 'health-transaction-rollback',
    description: 'Tests transaction rollback when an error occurs during health metric storage',
    journeyType: JourneyType.HEALTH,
    contextOptions: {
      transactionOptions: {
        defaultIsolationLevel: TransactionIsolationLevel.SERIALIZABLE,
      },
    },
    mockData: {
      userId: 'user-123',
      metrics: [
        { type: 'HEART_RATE', value: 72, timestamp: new Date() },
        { type: 'INVALID_METRIC', value: 'invalid', timestamp: new Date() }, // This will cause an error
      ],
    },
    shouldThrowError: true,
    expectedErrorType: DatabaseErrorType.VALIDATION_ERROR,
  },
  {
    name: 'health-cross-journey-authorized',
    description: 'Tests authorized cross-journey access from health to care journey',
    journeyType: JourneyType.HEALTH,
    isCrossJourney: true,
    additionalJourneyTypes: [JourneyType.CARE],
    contextOptions: {
      crossJourneyAccess: {
        enabled: true,
        authorizedJourneys: [JourneyType.CARE],
        accessPatterns: ['read'],
      },
    },
    mockData: {
      userId: 'user-123',
      careAppointmentId: 'appointment-456',
      healthMetricId: 'metric-789',
      crossJourneyRelationship: {
        sourceJourneyType: JourneyType.HEALTH,
        sourceEntityType: 'HealthMetric',
        sourceEntityId: 'metric-789',
        targetJourneyType: JourneyType.CARE,
        targetEntityType: 'Appointment',
        targetEntityId: 'appointment-456',
        relationshipType: 'recorded_during',
      },
    },
    expectedResults: {
      relationshipCreated: true,
      journeyEvents: ['cross_journey_relationship_created'],
    },
  },
];

/**
 * Care journey context test scenarios
 */
export const careJourneyScenarios: JourneyContextScenario[] = [
  {
    name: 'care-appointment-booking',
    description: 'Tests appointment booking with proper care context',
    journeyType: JourneyType.CARE,
    contextOptions: {
      appointmentSlotLockTimeSeconds: 300,
    },
    mockData: {
      userId: 'user-123',
      providerId: 'provider-456',
      appointmentData: {
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        endTime: new Date(Date.now() + 86400000 + 1800000), // Tomorrow + 30 minutes
        appointmentType: 'CONSULTATION',
        notes: 'Regular checkup',
      },
    },
    expectedResults: {
      appointmentStatus: 'scheduled',
      slotLocked: true,
      journeyEvents: ['appointment_booked'],
    },
  },
  {
    name: 'care-context-isolation',
    description: 'Validates that care context cannot access plan journey data directly',
    journeyType: JourneyType.CARE,
    isCrossJourney: true,
    additionalJourneyTypes: [JourneyType.PLAN],
    mockData: {
      userId: 'user-123',
      planClaimId: 'claim-456',
    },
    shouldThrowError: true,
    expectedErrorType: DatabaseErrorType.AUTHORIZATION_ERROR,
  },
  {
    name: 'care-medication-adherence',
    description: 'Tests medication adherence tracking',
    journeyType: JourneyType.CARE,
    mockData: {
      userId: 'user-123',
      medicationId: 'medication-456',
      intakeData: {
        intakeTime: new Date(),
        dosage: 1,
        notes: 'Taken with food',
      },
    },
    expectedResults: {
      adherenceStatus: 'on_track',
      journeyEvents: ['medication_taken'],
    },
  },
  {
    name: 'care-telemedicine-session',
    description: 'Tests telemedicine session creation and status updates',
    journeyType: JourneyType.CARE,
    contextOptions: {
      enableTelemedicineIntegration: true,
    },
    mockData: {
      userId: 'user-123',
      providerId: 'provider-456',
      sessionData: {
        scheduledTime: new Date(Date.now() + 3600000), // 1 hour from now
        sessionType: 'VIDEO',
        metadata: {
          platform: 'WebRTC',
          features: ['screen-sharing', 'chat'],
        },
      },
      statusUpdates: [
        { status: 'created', timestamp: new Date() },
        { status: 'provider_joined', timestamp: new Date(Date.now() + 3600000) },
        { status: 'patient_joined', timestamp: new Date(Date.now() + 3605000) },
        { status: 'completed', timestamp: new Date(Date.now() + 3900000) },
      ],
    },
    expectedResults: {
      finalStatus: 'completed',
      sessionDuration: 15, // minutes
      journeyEvents: ['telemedicine_session_created', 'telemedicine_session_completed'],
    },
  },
  {
    name: 'care-cross-journey-authorized',
    description: 'Tests authorized cross-journey access from care to health journey',
    journeyType: JourneyType.CARE,
    isCrossJourney: true,
    additionalJourneyTypes: [JourneyType.HEALTH],
    contextOptions: {
      crossJourneyAccess: {
        enabled: true,
        authorizedJourneys: [JourneyType.HEALTH],
        accessPatterns: ['read'],
      },
    },
    mockData: {
      userId: 'user-123',
      appointmentId: 'appointment-456',
      healthMetricTypes: ['HEART_RATE', 'BLOOD_PRESSURE'],
      timeRange: {
        start: new Date(Date.now() - 604800000), // 7 days ago
        end: new Date(),
      },
    },
    expectedResults: {
      metricsRetrieved: true,
      journeyEvents: ['cross_journey_data_accessed'],
    },
  },
];

/**
 * Plan journey context test scenarios
 */
export const planJourneyScenarios: JourneyContextScenario[] = [
  {
    name: 'plan-claim-submission',
    description: 'Tests insurance claim submission with proper plan context',
    journeyType: JourneyType.PLAN,
    contextOptions: {
      claimProcessingBatchSize: 50,
      enableInsuranceSystemIntegration: true,
    },
    mockData: {
      userId: 'user-123',
      claimData: {
        claimType: 'MEDICAL_CONSULTATION',
        serviceDate: new Date(Date.now() - 259200000), // 3 days ago
        providerName: 'Dr. Smith',
        providerNPI: '1234567890',
        amount: 150.00,
        receiptNumber: 'REC-12345',
      },
      documentIds: ['document-789'],
    },
    expectedResults: {
      claimStatus: 'submitted',
      claimNumber: expect.stringMatching(/^CLM-\d{8}$/),
      journeyEvents: ['claim_submitted'],
    },
  },
  {
    name: 'plan-context-isolation',
    description: 'Validates that plan context cannot access health journey data directly',
    journeyType: JourneyType.PLAN,
    isCrossJourney: true,
    additionalJourneyTypes: [JourneyType.HEALTH],
    mockData: {
      userId: 'user-123',
      healthMetricId: 'metric-456',
    },
    shouldThrowError: true,
    expectedErrorType: DatabaseErrorType.AUTHORIZATION_ERROR,
  },
  {
    name: 'plan-document-storage',
    description: 'Tests document storage and retrieval',
    journeyType: JourneyType.PLAN,
    contextOptions: {
      enableDocumentStorage: true,
    },
    mockData: {
      userId: 'user-123',
      documentType: 'MEDICAL_RECEIPT',
      documentData: Buffer.from('mock-document-data'),
      metadata: {
        filename: 'receipt.pdf',
        contentType: 'application/pdf',
        size: 1024,
        tags: ['receipt', 'consultation'],
      },
    },
    expectedResults: {
      documentId: expect.stringMatching(/^DOC-\d{8}$/),
      storageLocation: expect.stringContaining('user-123'),
      journeyEvents: ['document_uploaded'],
    },
  },
  {
    name: 'plan-benefit-utilization',
    description: 'Tests benefit utilization tracking',
    journeyType: JourneyType.PLAN,
    mockData: {
      userId: 'user-123',
      benefitType: 'DENTAL',
      year: new Date().getFullYear(),
      claims: [
        { amount: 100.00, serviceDate: new Date(Date.now() - 7776000000) }, // 90 days ago
        { amount: 150.00, serviceDate: new Date(Date.now() - 2592000000) }, // 30 days ago
      ],
    },
    expectedResults: {
      totalUtilized: 250.00,
      remainingBenefit: 750.00, // Assuming 1000.00 annual limit
      utilizationPercentage: 25,
      journeyEvents: ['benefit_utilization_updated'],
    },
  },
  {
    name: 'plan-cross-journey-authorized',
    description: 'Tests authorized cross-journey access from plan to care journey',
    journeyType: JourneyType.PLAN,
    isCrossJourney: true,
    additionalJourneyTypes: [JourneyType.CARE],
    contextOptions: {
      crossJourneyAccess: {
        enabled: true,
        authorizedJourneys: [JourneyType.CARE],
        accessPatterns: ['read'],
      },
    },
    mockData: {
      userId: 'user-123',
      claimId: 'claim-456',
      appointmentId: 'appointment-789',
      crossJourneyRelationship: {
        sourceJourneyType: JourneyType.PLAN,
        sourceEntityType: 'Claim',
        sourceEntityId: 'claim-456',
        targetJourneyType: JourneyType.CARE,
        targetEntityType: 'Appointment',
        targetEntityId: 'appointment-789',
        relationshipType: 'related_to',
      },
    },
    expectedResults: {
      relationshipCreated: true,
      journeyEvents: ['cross_journey_relationship_created'],
    },
  },
];

/**
 * Combined journey context test scenarios
 */
export const journeyContextScenarios: JourneyContextScenario[] = [
  ...healthJourneyScenarios,
  ...careJourneyScenarios,
  ...planJourneyScenarios,
];

/**
 * Creates a mock journey context for testing
 * 
 * @param journeyType - The journey type to create a context for
 * @param configService - The config service to use
 * @param options - Additional options for the context
 * @returns A journey-specific context instance
 */
export function createMockJourneyContext(
  journeyType: JourneyType,
  configService: ConfigService,
  options: DatabaseContextOptions = {}
): BaseJourneyContext {
  switch (journeyType) {
    case JourneyType.HEALTH:
      return new HealthContext(configService, options);
    case JourneyType.CARE:
      return new CareContext(configService, options);
    case JourneyType.PLAN:
      return new PlanContext(configService, options);
    default:
      throw new Error(`Unsupported journey type: ${journeyType}`);
  }
}

/**
 * Creates a mock PrismaClient for testing
 * 
 * @param journeyType - The journey type to create a mock client for
 * @returns A mock PrismaClient instance
 */
export function createMockPrismaClient(journeyType: JourneyType): PrismaClient {
  // Create a base mock client
  const mockClient = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    $transaction: jest.fn().mockImplementation(async (fn) => {
      return await fn(mockClient);
    }),
  } as unknown as PrismaClient;
  
  // Add journey-specific mock models
  switch (journeyType) {
    case JourneyType.HEALTH:
      Object.assign(mockClient, {
        healthMetric: {
          create: jest.fn().mockResolvedValue({ id: 'metric-123' }),
          findMany: jest.fn().mockResolvedValue([{ id: 'metric-123', type: 'HEART_RATE', value: 72 }]),
          findUnique: jest.fn().mockResolvedValue({ id: 'metric-123', type: 'HEART_RATE', value: 72 }),
        },
        healthGoal: {
          create: jest.fn().mockResolvedValue({ id: 'goal-123' }),
          findMany: jest.fn().mockResolvedValue([{ id: 'goal-123', type: 'STEPS', targetValue: 10000 }]),
        },
        deviceConnection: {
          create: jest.fn().mockResolvedValue({ id: 'connection-123' }),
          findUnique: jest.fn().mockResolvedValue({ id: 'connection-123', status: 'connected' }),
        },
      });
      break;
    case JourneyType.CARE:
      Object.assign(mockClient, {
        appointment: {
          create: jest.fn().mockResolvedValue({ id: 'appointment-123' }),
          findMany: jest.fn().mockResolvedValue([{ id: 'appointment-123', status: 'scheduled' }]),
          findUnique: jest.fn().mockResolvedValue({ id: 'appointment-123', status: 'scheduled' }),
        },
        medicationIntake: {
          create: jest.fn().mockResolvedValue({ id: 'intake-123' }),
          findMany: jest.fn().mockResolvedValue([{ id: 'intake-123', status: 'taken' }]),
        },
        telemedicineSession: {
          create: jest.fn().mockResolvedValue({ id: 'session-123' }),
          update: jest.fn().mockResolvedValue({ id: 'session-123', status: 'completed' }),
        },
      });
      break;
    case JourneyType.PLAN:
      Object.assign(mockClient, {
        claim: {
          create: jest.fn().mockResolvedValue({ id: 'claim-123' }),
          findMany: jest.fn().mockResolvedValue([{ id: 'claim-123', status: 'submitted' }]),
          findUnique: jest.fn().mockResolvedValue({ id: 'claim-123', status: 'submitted' }),
        },
        document: {
          create: jest.fn().mockResolvedValue({ id: 'document-123' }),
          findUnique: jest.fn().mockResolvedValue({ id: 'document-123', type: 'MEDICAL_RECEIPT' }),
        },
        benefit: {
          findMany: jest.fn().mockResolvedValue([{ id: 'benefit-123', type: 'DENTAL', annualLimit: 1000 }]),
        },
      });
      break;
  }
  
  return mockClient;
}

/**
 * Creates a mock config service for testing
 * 
 * @param journeyType - The journey type to create a config service for
 * @returns A mock ConfigService instance
 */
export function createMockConfigService(journeyType: JourneyType): ConfigService {
  const baseConfig = {
    'DATABASE_LOG_LEVEL': 'error',
    'DATABASE_SLOW_QUERY_THRESHOLD': 1000,
    'DATABASE_CIRCUIT_BREAKER_THRESHOLD': 5,
    'DATABASE_CIRCUIT_BREAKER_RESET': 30000,
  };
  
  // Add journey-specific configuration
  const journeyConfig = {
    [JourneyType.HEALTH]: {
      'HEALTH_DATABASE_URL': 'postgresql://user:password@localhost:5432/health_db',
      'HEALTH_DATABASE_MIN_CONNECTIONS': 5,
      'HEALTH_DATABASE_MAX_CONNECTIONS': 20,
      'HEALTH_TIMESCALE_ENABLED': 'true',
    },
    [JourneyType.CARE]: {
      'CARE_DATABASE_URL': 'postgresql://user:password@localhost:5432/care_db',
      'CARE_DATABASE_MIN_CONNECTIONS': 3,
      'CARE_DATABASE_MAX_CONNECTIONS': 15,
      'CARE_TELEMEDICINE_ENABLED': 'true',
    },
    [JourneyType.PLAN]: {
      'PLAN_DATABASE_URL': 'postgresql://user:password@localhost:5432/plan_db',
      'PLAN_DATABASE_MIN_CONNECTIONS': 3,
      'PLAN_DATABASE_MAX_CONNECTIONS': 15,
      'PLAN_DOCUMENT_STORAGE_ENABLED': 'true',
    },
  }[journeyType];
  
  const config = { ...baseConfig, ...journeyConfig };
  
  return {
    get: jest.fn((key: string) => config[key]),
  } as unknown as ConfigService;
}

/**
 * Creates a mock cross-journey relationship for testing
 * 
 * @param sourceJourneyType - The source journey type
 * @param targetJourneyType - The target journey type
 * @param relationshipType - The type of relationship
 * @returns A mock cross-journey relationship
 */
export function createMockCrossJourneyRelationship(
  sourceJourneyType: JourneyType,
  targetJourneyType: JourneyType,
  relationshipType: string = 'related_to'
): Record<string, any> {
  return {
    id: `relationship-${Date.now()}`,
    sourceJourneyType,
    sourceEntityType: `${sourceJourneyType}Entity`,
    sourceEntityId: `${sourceJourneyType.toLowerCase()}-entity-${Date.now()}`,
    targetJourneyType,
    targetEntityType: `${targetJourneyType}Entity`,
    targetEntityId: `${targetJourneyType.toLowerCase()}-entity-${Date.now()}`,
    relationshipType,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}