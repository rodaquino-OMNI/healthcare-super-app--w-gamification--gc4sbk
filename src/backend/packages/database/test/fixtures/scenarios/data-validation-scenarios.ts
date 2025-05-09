/**
 * Data Validation Test Scenarios
 * 
 * This file contains test fixtures for data validation scenarios across all journeys.
 * These fixtures are designed to test Prisma schema constraints, custom validators,
 * and runtime type checking for all entity types in the AUSTA SuperApp.
 * 
 * The scenarios include both valid and invalid data patterns to ensure proper validation
 * and error handling for all data operations.
 */

import { z } from 'zod';
import { DatabaseErrorType } from '../../../src/errors/database-error.types';

/**
 * Interface for validation test scenario
 */
export interface ValidationScenario<T> {
  /** Descriptive name of the scenario */
  name: string;
  /** Test data to validate */
  data: T;
  /** Whether the data should pass validation */
  isValid: boolean;
  /** Expected error type if validation fails */
  expectedErrorType?: DatabaseErrorType;
  /** Expected error message pattern if validation fails */
  expectedErrorMessage?: string | RegExp;
  /** Additional context for the test scenario */
  context?: Record<string, any>;
}

/**
 * Interface for a collection of validation scenarios
 */
export interface ValidationScenarioCollection<T> {
  /** Entity type being validated */
  entityType: string;
  /** Journey the entity belongs to */
  journey: 'health' | 'care' | 'plan' | 'gamification' | 'common';
  /** Description of the validation scenarios */
  description: string;
  /** Array of validation scenarios */
  scenarios: ValidationScenario<T>[];
  /** Zod schema for validation (if applicable) */
  zodSchema?: z.ZodType<any>;
}

// ============================================================================
// HEALTH JOURNEY VALIDATION SCENARIOS
// ============================================================================

/**
 * Health Metric validation scenarios
 */
export const healthMetricValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'HealthMetric',
  journey: 'health',
  description: 'Validation scenarios for health metrics data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid heart rate metric',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174001',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date(),
        source: 'MANUAL',
        notes: 'Resting heart rate',
      },
      isValid: true,
    },
    {
      name: 'Valid blood pressure metric',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174002',
        value: '120/80', // String value for blood pressure
        unit: 'mmHg',
        recordedAt: new Date(),
        source: 'DEVICE',
        deviceId: '123e4567-e89b-12d3-a456-426614174003',
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required userId',
      data: {
        typeId: '123e4567-e89b-12d3-a456-426614174001',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date(),
        source: 'MANUAL',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /userId.*required/i,
    },
    {
      name: 'Invalid UUID format for userId',
      data: {
        userId: 'invalid-uuid',
        typeId: '123e4567-e89b-12d3-a456-426614174001',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date(),
        source: 'MANUAL',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*uuid/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'Invalid blood pressure format',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174002',
        value: '12080', // Missing separator
        unit: 'mmHg',
        recordedAt: new Date(),
        source: 'MANUAL',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*blood pressure/i,
    },
    {
      name: 'Future recordedAt date',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174001',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date(Date.now() + 86400000), // Tomorrow
        source: 'MANUAL',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /date.*future/i,
    },
    {
      name: 'Invalid source enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174001',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date(),
        source: 'INVALID_SOURCE', // Not a valid enum value
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*source/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    typeId: z.string().uuid(),
    value: z.union([z.number(), z.string()]),
    unit: z.string(),
    recordedAt: z.date().max(new Date(), { message: 'Date cannot be in the future' }),
    source: z.enum(['MANUAL', 'DEVICE', 'IMPORTED']),
    deviceId: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
};

/**
 * Health Goal validation scenarios
 */
export const healthGoalValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'HealthGoal',
  journey: 'health',
  description: 'Validation scenarios for health goals data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid steps goal',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricTypeId: '123e4567-e89b-12d3-a456-426614174004', // STEPS
        targetValue: 10000,
        currentValue: 5000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000), // 30 days from now
        status: 'ACTIVE',
        recurrence: 'DAILY',
      },
      isValid: true,
    },
    {
      name: 'Valid weight goal with no end date',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricTypeId: '123e4567-e89b-12d3-a456-426614174005', // WEIGHT
        targetValue: 70,
        currentValue: 75,
        startDate: new Date(),
        status: 'ACTIVE',
        recurrence: 'NONE',
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required metricTypeId',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        targetValue: 10000,
        currentValue: 5000,
        startDate: new Date(),
        status: 'ACTIVE',
        recurrence: 'DAILY',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /metricTypeId.*required/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'End date before start date',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricTypeId: '123e4567-e89b-12d3-a456-426614174004', // STEPS
        targetValue: 10000,
        currentValue: 5000,
        startDate: new Date(),
        endDate: new Date(Date.now() - 86400000), // Yesterday
        status: 'ACTIVE',
        recurrence: 'DAILY',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /end date.*before.*start date/i,
    },
    {
      name: 'Invalid status enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricTypeId: '123e4567-e89b-12d3-a456-426614174004', // STEPS
        targetValue: 10000,
        currentValue: 5000,
        startDate: new Date(),
        status: 'INVALID_STATUS', // Not a valid enum value
        recurrence: 'DAILY',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*status/i,
    },
    {
      name: 'Negative target value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricTypeId: '123e4567-e89b-12d3-a456-426614174004', // STEPS
        targetValue: -1000, // Negative value
        currentValue: 5000,
        startDate: new Date(),
        status: 'ACTIVE',
        recurrence: 'DAILY',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /target.*positive/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    metricTypeId: z.string().uuid(),
    targetValue: z.number().positive(),
    currentValue: z.number().optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']),
    recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']),
    notes: z.string().optional(),
  }).refine(data => {
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      return false;
    }
    return true;
  }, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }),
};

/**
 * Device Connection validation scenarios
 */
export const deviceConnectionValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'DeviceConnection',
  journey: 'health',
  description: 'Validation scenarios for device connections data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid smartwatch connection',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        deviceTypeId: '123e4567-e89b-12d3-a456-426614174006', // Smartwatch
        deviceIdentifier: 'ABC123456789',
        connectionStatus: 'CONNECTED',
        lastSyncedAt: new Date(),
        accessToken: 'valid-access-token',
        refreshToken: 'valid-refresh-token',
        settings: { autoSync: true, syncInterval: 60 },
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required deviceTypeId',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        deviceIdentifier: 'ABC123456789',
        connectionStatus: 'CONNECTED',
        lastSyncedAt: new Date(),
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /deviceTypeId.*required/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'Invalid connection status enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        deviceTypeId: '123e4567-e89b-12d3-a456-426614174006', // Smartwatch
        deviceIdentifier: 'ABC123456789',
        connectionStatus: 'INVALID_STATUS', // Not a valid enum value
        lastSyncedAt: new Date(),
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*status/i,
    },
    {
      name: 'Future lastSyncedAt date',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        deviceTypeId: '123e4567-e89b-12d3-a456-426614174006', // Smartwatch
        deviceIdentifier: 'ABC123456789',
        connectionStatus: 'CONNECTED',
        lastSyncedAt: new Date(Date.now() + 86400000), // Tomorrow
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /date.*future/i,
    },
    {
      name: 'Invalid settings JSON structure',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        deviceTypeId: '123e4567-e89b-12d3-a456-426614174006', // Smartwatch
        deviceIdentifier: 'ABC123456789',
        connectionStatus: 'CONNECTED',
        lastSyncedAt: new Date(),
        settings: 'not-a-json-object', // Should be an object
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /settings.*object/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    deviceTypeId: z.string().uuid(),
    deviceIdentifier: z.string(),
    connectionStatus: z.enum(['CONNECTED', 'DISCONNECTED', 'PENDING', 'FAILED']),
    lastSyncedAt: z.date().max(new Date(), { message: 'Date cannot be in the future' }).optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    settings: z.record(z.any()).optional(),
  }),
};

// ============================================================================
// CARE JOURNEY VALIDATION SCENARIOS
// ============================================================================

/**
 * Appointment validation scenarios
 */
export const appointmentValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'Appointment',
  journey: 'care',
  description: 'Validation scenarios for appointment data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid in-person appointment',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174007',
        scheduledAt: new Date(Date.now() + 7 * 86400000), // 7 days from now
        duration: 30, // minutes
        type: 'IN_PERSON',
        status: 'SCHEDULED',
        location: 'Clínica São Paulo, Sala 302',
        notes: 'Consulta de rotina',
      },
      isValid: true,
    },
    {
      name: 'Valid telemedicine appointment',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174007',
        scheduledAt: new Date(Date.now() + 3 * 86400000), // 3 days from now
        duration: 20, // minutes
        type: 'TELEMEDICINE',
        status: 'SCHEDULED',
        meetingUrl: 'https://meet.austa.com.br/dr-silva/123456',
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required providerId',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        scheduledAt: new Date(Date.now() + 7 * 86400000),
        duration: 30,
        type: 'IN_PERSON',
        status: 'SCHEDULED',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /providerId.*required/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'Past scheduledAt date',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174007',
        scheduledAt: new Date(Date.now() - 86400000), // Yesterday
        duration: 30,
        type: 'IN_PERSON',
        status: 'SCHEDULED',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /date.*past/i,
    },
    {
      name: 'Invalid appointment type enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174007',
        scheduledAt: new Date(Date.now() + 7 * 86400000),
        duration: 30,
        type: 'INVALID_TYPE', // Not a valid enum value
        status: 'SCHEDULED',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*type/i,
    },
    {
      name: 'Telemedicine appointment without meetingUrl',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174007',
        scheduledAt: new Date(Date.now() + 3 * 86400000),
        duration: 20,
        type: 'TELEMEDICINE',
        status: 'SCHEDULED',
        // Missing meetingUrl
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /meetingUrl.*required/i,
    },
    {
      name: 'Invalid duration (too short)',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174007',
        scheduledAt: new Date(Date.now() + 7 * 86400000),
        duration: 5, // Too short
        type: 'IN_PERSON',
        status: 'SCHEDULED',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /duration.*minimum/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    providerId: z.string().uuid(),
    scheduledAt: z.date().min(new Date(), { message: 'Appointment date cannot be in the past' }),
    duration: z.number().min(10, { message: 'Duration must be at least 10 minutes' }),
    type: z.enum(['IN_PERSON', 'TELEMEDICINE', 'HOME_VISIT']),
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    location: z.string().optional(),
    meetingUrl: z.string().url().optional(),
    notes: z.string().optional(),
  }).refine(data => {
    if (data.type === 'TELEMEDICINE' && !data.meetingUrl) {
      return false;
    }
    return true;
  }, {
    message: 'Meeting URL is required for telemedicine appointments',
    path: ['meetingUrl'],
  }),
};

/**
 * Medication validation scenarios
 */
export const medicationValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'Medication',
  journey: 'care',
  description: 'Validation scenarios for medication data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid medication with schedule',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Losartana Potássica',
        dosage: '50mg',
        frequency: 'DAILY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000), // 30 days from now
        instructions: 'Tomar 1 comprimido pela manhã',
        status: 'ACTIVE',
        schedule: [
          { time: '08:00', taken: false },
        ],
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required name',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        dosage: '50mg',
        frequency: 'DAILY',
        startDate: new Date(),
        status: 'ACTIVE',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /name.*required/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'End date before start date',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Losartana Potássica',
        dosage: '50mg',
        frequency: 'DAILY',
        startDate: new Date(),
        endDate: new Date(Date.now() - 86400000), // Yesterday
        status: 'ACTIVE',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /end date.*before.*start date/i,
    },
    {
      name: 'Invalid frequency enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Losartana Potássica',
        dosage: '50mg',
        frequency: 'INVALID_FREQUENCY', // Not a valid enum value
        startDate: new Date(),
        status: 'ACTIVE',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*frequency/i,
    },
    {
      name: 'Invalid schedule format',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Losartana Potássica',
        dosage: '50mg',
        frequency: 'DAILY',
        startDate: new Date(),
        status: 'ACTIVE',
        schedule: 'not-an-array', // Should be an array
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /schedule.*array/i,
    },
    {
      name: 'Invalid time format in schedule',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Losartana Potássica',
        dosage: '50mg',
        frequency: 'DAILY',
        startDate: new Date(),
        status: 'ACTIVE',
        schedule: [
          { time: '25:00', taken: false }, // Invalid time
        ],
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /time.*format/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    name: z.string(),
    dosage: z.string(),
    frequency: z.enum(['DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'WEEKLY', 'MONTHLY', 'AS_NEEDED']),
    startDate: z.date(),
    endDate: z.date().optional(),
    instructions: z.string().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'DISCONTINUED']),
    schedule: z.array(
      z.object({
        time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM format' }),
        taken: z.boolean().optional(),
      })
    ).optional(),
  }).refine(data => {
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      return false;
    }
    return true;
  }, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }),
};

// ============================================================================
// PLAN JOURNEY VALIDATION SCENARIOS
// ============================================================================

/**
 * Insurance Claim validation scenarios
 */
export const insuranceClaimValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'InsuranceClaim',
  journey: 'plan',
  description: 'Validation scenarios for insurance claim data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid medical consultation claim',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        claimTypeId: '123e4567-e89b-12d3-a456-426614174008', // Consulta Médica
        amount: 250.00,
        serviceDate: new Date(Date.now() - 7 * 86400000), // 7 days ago
        providerName: 'Dr. Carlos Silva',
        providerDocument: '12345678901',
        status: 'SUBMITTED',
        receiptUrls: ['https://storage.austa.com.br/receipts/123456.pdf'],
        additionalDocuments: [
          { type: 'MEDICAL_REPORT', url: 'https://storage.austa.com.br/docs/123456.pdf' },
        ],
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required claimTypeId',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 250.00,
        serviceDate: new Date(Date.now() - 7 * 86400000),
        providerName: 'Dr. Carlos Silva',
        status: 'SUBMITTED',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /claimTypeId.*required/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'Future service date',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        claimTypeId: '123e4567-e89b-12d3-a456-426614174008',
        amount: 250.00,
        serviceDate: new Date(Date.now() + 7 * 86400000), // 7 days in the future
        providerName: 'Dr. Carlos Silva',
        status: 'SUBMITTED',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /service date.*future/i,
    },
    {
      name: 'Negative amount',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        claimTypeId: '123e4567-e89b-12d3-a456-426614174008',
        amount: -250.00, // Negative amount
        serviceDate: new Date(Date.now() - 7 * 86400000),
        providerName: 'Dr. Carlos Silva',
        status: 'SUBMITTED',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /amount.*positive/i,
    },
    {
      name: 'Invalid status enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        claimTypeId: '123e4567-e89b-12d3-a456-426614174008',
        amount: 250.00,
        serviceDate: new Date(Date.now() - 7 * 86400000),
        providerName: 'Dr. Carlos Silva',
        status: 'INVALID_STATUS', // Not a valid enum value
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*status/i,
    },
    {
      name: 'Invalid document type in additionalDocuments',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        claimTypeId: '123e4567-e89b-12d3-a456-426614174008',
        amount: 250.00,
        serviceDate: new Date(Date.now() - 7 * 86400000),
        providerName: 'Dr. Carlos Silva',
        status: 'SUBMITTED',
        additionalDocuments: [
          { type: 'INVALID_TYPE', url: 'https://storage.austa.com.br/docs/123456.pdf' }, // Invalid type
        ],
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /document type/i,
    },
    {
      name: 'Invalid URL format in receiptUrls',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        claimTypeId: '123e4567-e89b-12d3-a456-426614174008',
        amount: 250.00,
        serviceDate: new Date(Date.now() - 7 * 86400000),
        providerName: 'Dr. Carlos Silva',
        status: 'SUBMITTED',
        receiptUrls: ['invalid-url'], // Not a valid URL
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /url.*format/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    claimTypeId: z.string().uuid(),
    amount: z.number().positive(),
    serviceDate: z.date().max(new Date(), { message: 'Service date cannot be in the future' }),
    providerName: z.string(),
    providerDocument: z.string().optional(),
    status: z.enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID']),
    receiptUrls: z.array(z.string().url()).optional(),
    additionalDocuments: z.array(
      z.object({
        type: z.enum(['MEDICAL_REPORT', 'PRESCRIPTION', 'EXAM_RESULT', 'INVOICE', 'OTHER']),
        url: z.string().url(),
      })
    ).optional(),
    notes: z.string().optional(),
  }),
};

/**
 * Insurance Plan validation scenarios
 */
export const insurancePlanValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'InsurancePlan',
  journey: 'plan',
  description: 'Validation scenarios for insurance plan data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid insurance plan',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        planTypeId: '123e4567-e89b-12d3-a456-426614174009', // Standard
        planNumber: 'PLN12345678',
        cardNumber: 'CRD98765432',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 86400000), // 1 year from now
        status: 'ACTIVE',
        coverageDetails: {
          hasDentalCoverage: true,
          hasVisionCoverage: false,
          hasInternationalCoverage: false,
          networkType: 'PREFERRED',
        },
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required planTypeId',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        planNumber: 'PLN12345678',
        startDate: new Date(),
        status: 'ACTIVE',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /planTypeId.*required/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'End date before start date',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        planTypeId: '123e4567-e89b-12d3-a456-426614174009',
        planNumber: 'PLN12345678',
        startDate: new Date(),
        endDate: new Date(Date.now() - 86400000), // Yesterday
        status: 'ACTIVE',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /end date.*before.*start date/i,
    },
    {
      name: 'Invalid status enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        planTypeId: '123e4567-e89b-12d3-a456-426614174009',
        planNumber: 'PLN12345678',
        startDate: new Date(),
        status: 'INVALID_STATUS', // Not a valid enum value
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*status/i,
    },
    {
      name: 'Invalid coverageDetails format',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        planTypeId: '123e4567-e89b-12d3-a456-426614174009',
        planNumber: 'PLN12345678',
        startDate: new Date(),
        status: 'ACTIVE',
        coverageDetails: 'not-an-object', // Should be an object
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /coverageDetails.*object/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    planTypeId: z.string().uuid(),
    planNumber: z.string(),
    cardNumber: z.string().optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'EXPIRED']),
    coverageDetails: z.record(z.any()).optional(),
  }).refine(data => {
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      return false;
    }
    return true;
  }, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }),
};

// ============================================================================
// GAMIFICATION JOURNEY VALIDATION SCENARIOS
// ============================================================================

/**
 * Achievement validation scenarios
 */
export const achievementValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'Achievement',
  journey: 'gamification',
  description: 'Validation scenarios for achievement data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid achievement',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174010', // health-check-streak
        level: 1,
        progress: 100,
        completedAt: new Date(),
        journey: 'health',
      },
      isValid: true,
    },
    {
      name: 'Valid in-progress achievement',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174011', // steps-goal
        level: 2,
        progress: 75, // Not yet completed
        journey: 'health',
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required typeId',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        level: 1,
        progress: 100,
        journey: 'health',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /typeId.*required/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'Invalid journey enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174010',
        level: 1,
        progress: 100,
        journey: 'INVALID_JOURNEY', // Not a valid enum value
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*journey/i,
    },
    {
      name: 'Negative level value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174010',
        level: -1, // Negative level
        progress: 100,
        journey: 'health',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /level.*positive/i,
    },
    {
      name: 'Progress value out of range',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174010',
        level: 1,
        progress: 120, // Over 100%
        journey: 'health',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /progress.*range/i,
    },
    {
      name: 'Completed achievement without completedAt',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        typeId: '123e4567-e89b-12d3-a456-426614174010',
        level: 1,
        progress: 100, // Completed
        journey: 'health',
        // Missing completedAt
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /completedAt.*required/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    typeId: z.string().uuid(),
    level: z.number().positive(),
    progress: z.number().min(0).max(100),
    completedAt: z.date().optional(),
    journey: z.enum(['health', 'care', 'plan']),
  }).refine(data => {
    if (data.progress === 100 && !data.completedAt) {
      return false;
    }
    return true;
  }, {
    message: 'completedAt is required when progress is 100%',
    path: ['completedAt'],
  }),
};

/**
 * Reward validation scenarios
 */
export const rewardValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'Reward',
  journey: 'gamification',
  description: 'Validation scenarios for reward data',
  scenarios: [
    // Valid scenarios
    {
      name: 'Valid available reward',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Desconto em Consulta',
        description: '20% de desconto em consulta médica',
        pointsCost: 500,
        expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days from now
        status: 'AVAILABLE',
        type: 'DISCOUNT',
        details: {
          discountPercentage: 20,
          serviceType: 'MEDICAL_CONSULTATION',
        },
      },
      isValid: true,
    },
    {
      name: 'Valid redeemed reward',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Desconto em Exame',
        description: '15% de desconto em exame laboratorial',
        pointsCost: 300,
        expiresAt: new Date(Date.now() + 30 * 86400000),
        status: 'REDEEMED',
        redeemedAt: new Date(),
        type: 'DISCOUNT',
        details: {
          discountPercentage: 15,
          serviceType: 'LABORATORY_EXAM',
        },
      },
      isValid: true,
    },
    
    // Invalid scenarios - Prisma constraints
    {
      name: 'Missing required title',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        description: '20% de desconto em consulta médica',
        pointsCost: 500,
        status: 'AVAILABLE',
        type: 'DISCOUNT',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /title.*required/i,
    },
    
    // Invalid scenarios - Custom validators
    {
      name: 'Expired reward with AVAILABLE status',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Desconto em Consulta',
        description: '20% de desconto em consulta médica',
        pointsCost: 500,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
        status: 'AVAILABLE', // Should be EXPIRED
        type: 'DISCOUNT',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /expired.*status/i,
    },
    {
      name: 'Redeemed reward without redeemedAt',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Desconto em Consulta',
        description: '20% de desconto em consulta médica',
        pointsCost: 500,
        status: 'REDEEMED', // Redeemed status
        // Missing redeemedAt
        type: 'DISCOUNT',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /redeemedAt.*required/i,
    },
    {
      name: 'Invalid status enum value',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Desconto em Consulta',
        description: '20% de desconto em consulta médica',
        pointsCost: 500,
        status: 'INVALID_STATUS', // Not a valid enum value
        type: 'DISCOUNT',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /invalid.*status/i,
    },
    {
      name: 'Negative pointsCost',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Desconto em Consulta',
        description: '20% de desconto em consulta médica',
        pointsCost: -500, // Negative value
        status: 'AVAILABLE',
        type: 'DISCOUNT',
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /pointsCost.*positive/i,
    },
  ],
  zodSchema: z.object({
    userId: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    pointsCost: z.number().positive(),
    expiresAt: z.date().optional(),
    status: z.enum(['AVAILABLE', 'REDEEMED', 'EXPIRED']),
    redeemedAt: z.date().optional(),
    type: z.enum(['DISCOUNT', 'CASHBACK', 'PRODUCT', 'SERVICE', 'OTHER']),
    details: z.record(z.any()).optional(),
  }).refine(data => {
    if (data.status === 'REDEEMED' && !data.redeemedAt) {
      return false;
    }
    return true;
  }, {
    message: 'redeemedAt is required when status is REDEEMED',
    path: ['redeemedAt'],
  }).refine(data => {
    if (data.expiresAt && data.expiresAt < new Date() && data.status === 'AVAILABLE') {
      return false;
    }
    return true;
  }, {
    message: 'Expired rewards cannot have AVAILABLE status',
    path: ['status'],
  }),
};

// ============================================================================
// CROSS-JOURNEY VALIDATION SCENARIOS
// ============================================================================

/**
 * Cross-journey validation scenarios
 */
export const crossJourneyValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'CrossJourneyValidation',
  journey: 'common',
  description: 'Validation scenarios that span multiple journeys',
  scenarios: [
    // Health + Care journey validation
    {
      name: 'Valid health metric with provider reference',
      data: {
        healthMetric: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          typeId: '123e4567-e89b-12d3-a456-426614174001',
          value: 75,
          unit: 'bpm',
          recordedAt: new Date(),
          source: 'PROVIDER',
          providerId: '123e4567-e89b-12d3-a456-426614174007', // Valid provider ID
        },
      },
      isValid: true,
      context: { journeys: ['health', 'care'] },
    },
    {
      name: 'Invalid health metric with non-existent provider',
      data: {
        healthMetric: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          typeId: '123e4567-e89b-12d3-a456-426614174001',
          value: 75,
          unit: 'bpm',
          recordedAt: new Date(),
          source: 'PROVIDER',
          providerId: '123e4567-e89b-12d3-a456-426614174999', // Non-existent provider ID
        },
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /provider.*not found/i,
      context: { journeys: ['health', 'care'] },
    },
    
    // Care + Plan journey validation
    {
      name: 'Valid appointment with insurance plan reference',
      data: {
        appointment: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          providerId: '123e4567-e89b-12d3-a456-426614174007',
          scheduledAt: new Date(Date.now() + 7 * 86400000),
          duration: 30,
          type: 'IN_PERSON',
          status: 'SCHEDULED',
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174012', // Valid plan ID
        },
      },
      isValid: true,
      context: { journeys: ['care', 'plan'] },
    },
    {
      name: 'Invalid appointment with expired insurance plan',
      data: {
        appointment: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          providerId: '123e4567-e89b-12d3-a456-426614174007',
          scheduledAt: new Date(Date.now() + 7 * 86400000),
          duration: 30,
          type: 'IN_PERSON',
          status: 'SCHEDULED',
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174013', // Expired plan ID
        },
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /insurance plan.*expired/i,
      context: { journeys: ['care', 'plan'] },
    },
    
    // Health + Gamification journey validation
    {
      name: 'Valid health goal with achievement reference',
      data: {
        healthGoal: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          metricTypeId: '123e4567-e89b-12d3-a456-426614174004', // STEPS
          targetValue: 10000,
          currentValue: 10000, // Goal reached
          startDate: new Date(Date.now() - 7 * 86400000),
          status: 'COMPLETED',
          recurrence: 'DAILY',
          achievementId: '123e4567-e89b-12d3-a456-426614174014', // Valid achievement ID
        },
      },
      isValid: true,
      context: { journeys: ['health', 'gamification'] },
    },
    {
      name: 'Invalid health goal completion without achievement',
      data: {
        healthGoal: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          metricTypeId: '123e4567-e89b-12d3-a456-426614174004', // STEPS
          targetValue: 10000,
          currentValue: 10000, // Goal reached
          startDate: new Date(Date.now() - 7 * 86400000),
          status: 'COMPLETED',
          recurrence: 'DAILY',
          // Missing achievementId for completed goal
        },
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /completed goal.*achievement/i,
      context: { journeys: ['health', 'gamification'] },
    },
    
    // Plan + Gamification journey validation
    {
      name: 'Valid claim with reward reference',
      data: {
        claim: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          claimTypeId: '123e4567-e89b-12d3-a456-426614174008', // Consulta Médica
          amount: 250.00,
          serviceDate: new Date(Date.now() - 7 * 86400000),
          providerName: 'Dr. Carlos Silva',
          status: 'APPROVED',
          rewardId: '123e4567-e89b-12d3-a456-426614174015', // Valid reward ID
        },
      },
      isValid: true,
      context: { journeys: ['plan', 'gamification'] },
    },
    {
      name: 'Invalid claim with already redeemed reward',
      data: {
        claim: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          claimTypeId: '123e4567-e89b-12d3-a456-426614174008', // Consulta Médica
          amount: 250.00,
          serviceDate: new Date(Date.now() - 7 * 86400000),
          providerName: 'Dr. Carlos Silva',
          status: 'APPROVED',
          rewardId: '123e4567-e89b-12d3-a456-426614174016', // Already redeemed reward ID
        },
      },
      isValid: false,
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /reward.*already redeemed/i,
      context: { journeys: ['plan', 'gamification'] },
    },
  ],
};

// ============================================================================
// SCHEMA MIGRATION COMPATIBILITY SCENARIOS
// ============================================================================

/**
 * Schema migration compatibility scenarios
 */
export const schemaMigrationValidationScenarios: ValidationScenarioCollection<any> = {
  entityType: 'SchemaMigrationCompatibility',
  journey: 'common',
  description: 'Validation scenarios for schema migration compatibility',
  scenarios: [
    // Adding new required fields with defaults
    {
      name: 'Valid data with new required field using default',
      data: {
        // Old schema data without the new required field
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Entity',
        createdAt: new Date(),
        // Missing 'status' field that is now required
      },
      isValid: true, // Should be valid because the migration adds a default value
      context: { 
        migrationVersion: '20230301000000_add_indices_and_relations',
        defaultValues: { status: 'ACTIVE' },
      },
    },
    
    // Changing field types
    {
      name: 'Valid data with field type change (string to enum)',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Entity',
        type: 'basic', // Old string value that needs to be mapped to enum
      },
      isValid: true, // Should be valid because the migration maps old values to new enum
      context: { 
        migrationVersion: '20230301000000_add_indices_and_relations',
        typeMapping: { type: { 'basic': 'BASIC', 'premium': 'PREMIUM' } },
      },
    },
    
    // Renaming fields
    {
      name: 'Valid data with renamed field',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        fullName: 'Test User', // Old field name
        // New schema expects 'name' instead of 'fullName'
      },
      isValid: true, // Should be valid because the migration renames the field
      context: { 
        migrationVersion: '20230301000000_add_indices_and_relations',
        renamedFields: { fullName: 'name' },
      },
    },
    
    // Adding new constraints
    {
      name: 'Invalid data with new constraint (minimum value)',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Entity',
        score: 0, // New constraint requires score > 0
      },
      isValid: false, // Should be invalid because it violates the new constraint
      expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
      expectedErrorMessage: /score.*positive/i,
      context: { 
        migrationVersion: '20230301000000_add_indices_and_relations',
        newConstraints: { score: 'positive' },
      },
    },
    
    // Removing fields
    {
      name: 'Valid data with removed field',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Entity',
        deprecated: 'This field will be removed', // Field that will be removed
      },
      isValid: true, // Should be valid because the migration removes the field
      context: { 
        migrationVersion: '20230301000000_add_indices_and_relations',
        removedFields: ['deprecated'],
      },
    },
  ],
};

// Export all validation scenarios
export const validationScenarios = {
  // Health journey
  healthMetricValidationScenarios,
  healthGoalValidationScenarios,
  deviceConnectionValidationScenarios,
  
  // Care journey
  appointmentValidationScenarios,
  medicationValidationScenarios,
  
  // Plan journey
  insuranceClaimValidationScenarios,
  insurancePlanValidationScenarios,
  
  // Gamification journey
  achievementValidationScenarios,
  rewardValidationScenarios,
  
  // Cross-journey and migration scenarios
  crossJourneyValidationScenarios,
  schemaMigrationValidationScenarios,
};