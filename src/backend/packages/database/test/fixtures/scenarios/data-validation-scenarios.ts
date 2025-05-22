/**
 * Data Validation Test Scenarios
 * 
 * This file contains test fixtures for data validation scenarios across all journeys.
 * These fixtures are used to validate Prisma schema constraints, custom validators,
 * and runtime type checking to ensure proper validation and error handling for application data.
 */

import { z } from 'zod';
import { DatabaseErrorType } from '../../../src/errors/database-error.types';

/**
 * Interface for a validation test scenario
 */
export interface ValidationScenario<T> {
  /** Unique identifier for the scenario */
  id: string;
  /** Human-readable description of the scenario */
  description: string;
  /** The journey this scenario belongs to (health, care, plan, gamification) */
  journey: 'health' | 'care' | 'plan' | 'gamification' | 'common';
  /** The entity being validated */
  entity: string;
  /** Valid data that should pass validation */
  validData: T;
  /** Invalid data that should fail validation with specific errors */
  invalidData: Array<{
    /** The invalid data */
    data: Partial<T>;
    /** Description of why this data is invalid */
    reason: string;
    /** Expected error type */
    expectedErrorType: DatabaseErrorType;
    /** Expected error message pattern (regex or string) */
    expectedErrorPattern?: string | RegExp;
  }>;
  /** Optional Zod schema for validation */
  zodSchema?: z.ZodType<T>;
  /** Whether this scenario tests schema migration compatibility */
  testsMigrationCompatibility?: boolean;
}

/**
 * Interface for a collection of validation scenarios
 */
export interface ValidationScenarioCollection {
  health: ValidationScenario<any>[];
  care: ValidationScenario<any>[];
  plan: ValidationScenario<any>[];
  gamification: ValidationScenario<any>[];
  common: ValidationScenario<any>[];
}

// ==========================================
// Health Journey Validation Scenarios
// ==========================================

/**
 * Health Metric validation scenarios
 */
export const healthMetricScenarios: ValidationScenario<any>[] = [
  {
    id: 'health-metric-basic',
    description: 'Basic health metric validation',
    journey: 'health',
    entity: 'HealthMetric',
    validData: {
      userId: 'user-123',
      type: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: new Date(),
      source: 'MANUAL',
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          type: 'INVALID_TYPE', // Invalid metric type
          value: 75,
          unit: 'bpm',
          timestamp: new Date(),
          source: 'MANUAL',
        },
        reason: 'Invalid metric type',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /invalid.*type/i,
      },
      {
        data: {
          userId: 'user-123',
          type: 'HEART_RATE',
          value: -10, // Negative value not allowed for heart rate
          unit: 'bpm',
          timestamp: new Date(),
          source: 'MANUAL',
        },
        reason: 'Negative value for heart rate',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /value.*must be positive/i,
      },
      {
        data: {
          userId: 'user-123',
          type: 'HEART_RATE',
          value: 75,
          unit: 'invalid', // Invalid unit
          timestamp: new Date(),
          source: 'MANUAL',
        },
        reason: 'Invalid unit for heart rate',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /invalid unit/i,
      },
      {
        data: {
          userId: 'user-123',
          type: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date(Date.now() + 86400000), // Future date
          source: 'MANUAL',
        },
        reason: 'Future timestamp not allowed',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /timestamp.*cannot be in the future/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      type: z.enum(['HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'STEPS', 'WEIGHT', 'SLEEP']),
      value: z.number().positive(),
      unit: z.string().min(1),
      timestamp: z.date().max(new Date(), { message: 'Timestamp cannot be in the future' }),
      source: z.enum(['MANUAL', 'DEVICE', 'INTEGRATION']),
    }),
  },
  {
    id: 'health-metric-blood-pressure',
    description: 'Blood pressure metric validation with systolic and diastolic values',
    journey: 'health',
    entity: 'HealthMetric',
    validData: {
      userId: 'user-123',
      type: 'BLOOD_PRESSURE',
      value: null, // Main value is null for blood pressure
      unit: 'mmHg',
      timestamp: new Date(),
      source: 'MANUAL',
      systolic: 120,
      diastolic: 80,
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          type: 'BLOOD_PRESSURE',
          value: null,
          unit: 'mmHg',
          timestamp: new Date(),
          source: 'MANUAL',
          systolic: 120,
          // Missing diastolic
        },
        reason: 'Missing diastolic value for blood pressure',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /diastolic.*required/i,
      },
      {
        data: {
          userId: 'user-123',
          type: 'BLOOD_PRESSURE',
          value: null,
          unit: 'mmHg',
          timestamp: new Date(),
          source: 'MANUAL',
          systolic: 300, // Too high
          diastolic: 80,
        },
        reason: 'Systolic value too high',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /systolic.*range/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      type: z.literal('BLOOD_PRESSURE'),
      value: z.null(),
      unit: z.literal('mmHg'),
      timestamp: z.date().max(new Date(), { message: 'Timestamp cannot be in the future' }),
      source: z.enum(['MANUAL', 'DEVICE', 'INTEGRATION']),
      systolic: z.number().int().min(60).max(250),
      diastolic: z.number().int().min(40).max(150),
    }),
  },
  {
    id: 'health-metric-migration-compatibility',
    description: 'Tests compatibility with schema migrations for health metrics',
    journey: 'health',
    entity: 'HealthMetric',
    testsMigrationCompatibility: true,
    validData: {
      userId: 'user-123',
      type: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: new Date(),
      source: 'MANUAL',
      // New field added in migration
      metadata: { deviceId: 'device-123', accuracy: 'high' },
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          type: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date(),
          source: 'MANUAL',
          // Invalid metadata structure
          metadata: 'not-an-object',
        },
        reason: 'Metadata must be an object',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /metadata.*must be an object/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      type: z.enum(['HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'STEPS', 'WEIGHT', 'SLEEP']),
      value: z.number().positive().nullable(),
      unit: z.string().min(1),
      timestamp: z.date().max(new Date(), { message: 'Timestamp cannot be in the future' }),
      source: z.enum(['MANUAL', 'DEVICE', 'INTEGRATION']),
      metadata: z.record(z.string(), z.any()).optional(),
    }),
  },
];

/**
 * Health Goal validation scenarios
 */
export const healthGoalScenarios: ValidationScenario<any>[] = [
  {
    id: 'health-goal-basic',
    description: 'Basic health goal validation',
    journey: 'health',
    entity: 'HealthGoal',
    validData: {
      userId: 'user-123',
      type: 'STEPS',
      target: 10000,
      unit: 'steps',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000), // 30 days in the future
      recurrence: 'DAILY',
      status: 'ACTIVE',
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          type: 'STEPS',
          target: 0, // Target must be positive
          unit: 'steps',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 86400000),
          recurrence: 'DAILY',
          status: 'ACTIVE',
        },
        reason: 'Target must be positive',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /target.*positive/i,
      },
      {
        data: {
          userId: 'user-123',
          type: 'STEPS',
          target: 10000,
          unit: 'steps',
          startDate: new Date(),
          endDate: new Date(Date.now() - 86400000), // End date in the past
          recurrence: 'DAILY',
          status: 'ACTIVE',
        },
        reason: 'End date cannot be before start date',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /end date.*after.*start date/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      type: z.enum(['HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'STEPS', 'WEIGHT', 'SLEEP']),
      target: z.number().positive(),
      unit: z.string().min(1),
      startDate: z.date(),
      endDate: z.date(),
      recurrence: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
      status: z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']),
    }).refine(data => data.endDate > data.startDate, {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),
  },
];

// ==========================================
// Care Journey Validation Scenarios
// ==========================================

/**
 * Appointment validation scenarios
 */
export const appointmentScenarios: ValidationScenario<any>[] = [
  {
    id: 'appointment-basic',
    description: 'Basic appointment validation',
    journey: 'care',
    entity: 'Appointment',
    validData: {
      userId: 'user-123',
      providerId: 'provider-123',
      specialtyId: 'specialty-123',
      date: new Date(Date.now() + 86400000), // Tomorrow
      startTime: '09:00',
      endTime: '09:30',
      status: 'SCHEDULED',
      type: 'IN_PERSON',
      notes: 'Regular checkup',
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          providerId: 'provider-123',
          specialtyId: 'specialty-123',
          date: new Date(Date.now() - 86400000), // Yesterday
          startTime: '09:00',
          endTime: '09:30',
          status: 'SCHEDULED',
          type: 'IN_PERSON',
          notes: 'Regular checkup',
        },
        reason: 'Cannot schedule appointment in the past',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /cannot schedule.*past/i,
      },
      {
        data: {
          userId: 'user-123',
          providerId: 'provider-123',
          specialtyId: 'specialty-123',
          date: new Date(Date.now() + 86400000),
          startTime: '09:30', // Start time after end time
          endTime: '09:00',
          status: 'SCHEDULED',
          type: 'IN_PERSON',
          notes: 'Regular checkup',
        },
        reason: 'Start time must be before end time',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /start time.*before.*end time/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      providerId: z.string().min(1),
      specialtyId: z.string().min(1),
      date: z.date().min(new Date(new Date().setHours(0, 0, 0, 0)), { message: 'Cannot schedule appointment in the past' }),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
      type: z.enum(['IN_PERSON', 'TELEMEDICINE']),
      notes: z.string().optional(),
    }).refine(data => data.startTime < data.endTime, {
      message: 'Start time must be before end time',
      path: ['startTime'],
    }),
  },
];

/**
 * Medication validation scenarios
 */
export const medicationScenarios: ValidationScenario<any>[] = [
  {
    id: 'medication-basic',
    description: 'Basic medication validation',
    journey: 'care',
    entity: 'Medication',
    validData: {
      userId: 'user-123',
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: '8h',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 86400000), // 7 days from now
      instructions: 'Take with water',
      status: 'ACTIVE',
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          name: '', // Empty name
          dosage: '500mg',
          frequency: '8h',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 86400000),
          instructions: 'Take with water',
          status: 'ACTIVE',
        },
        reason: 'Medication name cannot be empty',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /name.*empty/i,
      },
      {
        data: {
          userId: 'user-123',
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: '8h',
          startDate: new Date(),
          endDate: new Date(Date.now() - 86400000), // End date in the past
          instructions: 'Take with water',
          status: 'ACTIVE',
        },
        reason: 'End date cannot be before start date',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /end date.*after.*start date/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      name: z.string().min(1, { message: 'Medication name cannot be empty' }),
      dosage: z.string().min(1),
      frequency: z.string().min(1),
      startDate: z.date(),
      endDate: z.date().optional(),
      instructions: z.string().optional(),
      status: z.enum(['ACTIVE', 'COMPLETED', 'DISCONTINUED']),
    }).refine(data => !data.endDate || data.endDate > data.startDate, {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),
  },
];

// ==========================================
// Plan Journey Validation Scenarios
// ==========================================

/**
 * Insurance Claim validation scenarios
 */
export const insuranceClaimScenarios: ValidationScenario<any>[] = [
  {
    id: 'insurance-claim-basic',
    description: 'Basic insurance claim validation',
    journey: 'plan',
    entity: 'InsuranceClaim',
    validData: {
      userId: 'user-123',
      claimTypeId: 'claim-type-123',
      serviceDate: new Date(Date.now() - 30 * 86400000), // 30 days ago
      providerName: 'Dr. Smith',
      amount: 150.75,
      receiptUrl: 'https://storage.example.com/receipts/receipt-123.pdf',
      status: 'SUBMITTED',
      submissionDate: new Date(),
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          claimTypeId: 'claim-type-123',
          serviceDate: new Date(Date.now() + 86400000), // Future date
          providerName: 'Dr. Smith',
          amount: 150.75,
          receiptUrl: 'https://storage.example.com/receipts/receipt-123.pdf',
          status: 'SUBMITTED',
          submissionDate: new Date(),
        },
        reason: 'Service date cannot be in the future',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /service date.*future/i,
      },
      {
        data: {
          userId: 'user-123',
          claimTypeId: 'claim-type-123',
          serviceDate: new Date(Date.now() - 30 * 86400000),
          providerName: 'Dr. Smith',
          amount: -50, // Negative amount
          receiptUrl: 'https://storage.example.com/receipts/receipt-123.pdf',
          status: 'SUBMITTED',
          submissionDate: new Date(),
        },
        reason: 'Amount cannot be negative',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /amount.*negative/i,
      },
      {
        data: {
          userId: 'user-123',
          claimTypeId: 'claim-type-123',
          serviceDate: new Date(Date.now() - 30 * 86400000),
          providerName: 'Dr. Smith',
          amount: 150.75,
          receiptUrl: 'invalid-url', // Invalid URL
          status: 'SUBMITTED',
          submissionDate: new Date(),
        },
        reason: 'Receipt URL must be a valid URL',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /receipt.*url.*valid/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      claimTypeId: z.string().min(1),
      serviceDate: z.date().max(new Date(), { message: 'Service date cannot be in the future' }),
      providerName: z.string().min(1),
      amount: z.number().positive({ message: 'Amount cannot be negative or zero' }),
      receiptUrl: z.string().url({ message: 'Receipt URL must be a valid URL' }),
      status: z.enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PAID']),
      submissionDate: z.date().optional(),
    }),
  },
];

/**
 * Insurance Plan validation scenarios
 */
export const insurancePlanScenarios: ValidationScenario<any>[] = [
  {
    id: 'insurance-plan-basic',
    description: 'Basic insurance plan validation',
    journey: 'plan',
    entity: 'InsurancePlan',
    validData: {
      userId: 'user-123',
      planTypeId: 'plan-type-123',
      planNumber: 'PLN12345678',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000), // 1 year from now
      status: 'ACTIVE',
      monthlyPremium: 250.00,
      annualDeductible: 1000.00,
      coverageDetails: {
        hasDentalCoverage: true,
        hasVisionCoverage: false,
        hasInternationalCoverage: true,
      },
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          planTypeId: 'plan-type-123',
          planNumber: 'PLN123', // Too short
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 86400000),
          status: 'ACTIVE',
          monthlyPremium: 250.00,
          annualDeductible: 1000.00,
          coverageDetails: {
            hasDentalCoverage: true,
            hasVisionCoverage: false,
            hasInternationalCoverage: true,
          },
        },
        reason: 'Plan number must be at least 8 characters',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /plan number.*characters/i,
      },
      {
        data: {
          userId: 'user-123',
          planTypeId: 'plan-type-123',
          planNumber: 'PLN12345678',
          startDate: new Date(),
          endDate: new Date(Date.now() - 86400000), // End date in the past
          status: 'ACTIVE',
          monthlyPremium: 250.00,
          annualDeductible: 1000.00,
          coverageDetails: {
            hasDentalCoverage: true,
            hasVisionCoverage: false,
            hasInternationalCoverage: true,
          },
        },
        reason: 'End date must be after start date',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /end date.*after.*start date/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      planTypeId: z.string().min(1),
      planNumber: z.string().min(8, { message: 'Plan number must be at least 8 characters' }),
      startDate: z.date(),
      endDate: z.date(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'EXPIRED']),
      monthlyPremium: z.number().nonnegative(),
      annualDeductible: z.number().nonnegative(),
      coverageDetails: z.object({
        hasDentalCoverage: z.boolean(),
        hasVisionCoverage: z.boolean(),
        hasInternationalCoverage: z.boolean(),
      }).optional(),
    }).refine(data => data.endDate > data.startDate, {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),
  },
];

// ==========================================
// Gamification Journey Validation Scenarios
// ==========================================

/**
 * Achievement validation scenarios
 */
export const achievementScenarios: ValidationScenario<any>[] = [
  {
    id: 'achievement-basic',
    description: 'Basic achievement validation',
    journey: 'gamification',
    entity: 'Achievement',
    validData: {
      userId: 'user-123',
      achievementTypeId: 'achievement-type-123',
      level: 1,
      progress: 50,
      isCompleted: false,
      completedAt: null,
      journey: 'health',
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          achievementTypeId: 'achievement-type-123',
          level: 0, // Level must be positive
          progress: 50,
          isCompleted: false,
          completedAt: null,
          journey: 'health',
        },
        reason: 'Level must be positive',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /level.*positive/i,
      },
      {
        data: {
          userId: 'user-123',
          achievementTypeId: 'achievement-type-123',
          level: 1,
          progress: 120, // Progress cannot exceed 100
          isCompleted: false,
          completedAt: null,
          journey: 'health',
        },
        reason: 'Progress cannot exceed 100',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /progress.*exceed.*100/i,
      },
      {
        data: {
          userId: 'user-123',
          achievementTypeId: 'achievement-type-123',
          level: 1,
          progress: 50,
          isCompleted: true,
          completedAt: null, // Completed but no completedAt date
          journey: 'health',
        },
        reason: 'Completed achievement must have completedAt date',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /completed.*must have.*date/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      achievementTypeId: z.string().min(1),
      level: z.number().int().positive(),
      progress: z.number().min(0).max(100),
      isCompleted: z.boolean(),
      completedAt: z.date().nullable(),
      journey: z.enum(['health', 'care', 'plan']),
    }).refine(data => !data.isCompleted || data.completedAt !== null, {
      message: 'Completed achievement must have completedAt date',
      path: ['completedAt'],
    }),
  },
];

/**
 * Reward validation scenarios
 */
export const rewardScenarios: ValidationScenario<any>[] = [
  {
    id: 'reward-basic',
    description: 'Basic reward validation',
    journey: 'gamification',
    entity: 'Reward',
    validData: {
      userId: 'user-123',
      title: 'Discount Coupon',
      description: '10% off on next appointment',
      pointsCost: 500,
      expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days from now
      isRedeemed: false,
      redeemedAt: null,
      code: 'REWARD123',
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          title: 'Discount Coupon',
          description: '10% off on next appointment',
          pointsCost: -100, // Negative points cost
          expiresAt: new Date(Date.now() + 30 * 86400000),
          isRedeemed: false,
          redeemedAt: null,
          code: 'REWARD123',
        },
        reason: 'Points cost cannot be negative',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /points.*negative/i,
      },
      {
        data: {
          userId: 'user-123',
          title: 'Discount Coupon',
          description: '10% off on next appointment',
          pointsCost: 500,
          expiresAt: new Date(Date.now() - 86400000), // Expired date
          isRedeemed: false,
          redeemedAt: null,
          code: 'REWARD123',
        },
        reason: 'Expiration date cannot be in the past',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /expiration.*past/i,
      },
      {
        data: {
          userId: 'user-123',
          title: 'Discount Coupon',
          description: '10% off on next appointment',
          pointsCost: 500,
          expiresAt: new Date(Date.now() + 30 * 86400000),
          isRedeemed: true,
          redeemedAt: null, // Redeemed but no redeemedAt date
          code: 'REWARD123',
        },
        reason: 'Redeemed reward must have redeemedAt date',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /redeemed.*must have.*date/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      pointsCost: z.number().int().nonnegative(),
      expiresAt: z.date().min(new Date(), { message: 'Expiration date cannot be in the past' }),
      isRedeemed: z.boolean(),
      redeemedAt: z.date().nullable(),
      code: z.string().min(1),
    }).refine(data => !data.isRedeemed || data.redeemedAt !== null, {
      message: 'Redeemed reward must have redeemedAt date',
      path: ['redeemedAt'],
    }),
  },
];

// ==========================================
// Common Validation Scenarios (Cross-Journey)
// ==========================================

/**
 * User validation scenarios
 */
export const userScenarios: ValidationScenario<any>[] = [
  {
    id: 'user-basic',
    description: 'Basic user validation',
    journey: 'common',
    entity: 'User',
    validData: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      phone: '+5511999999999',
      cpf: '12345678901',
    },
    invalidData: [
      {
        data: {
          name: 'John Doe',
          email: 'invalid-email', // Invalid email format
          password: 'Password123!',
          phone: '+5511999999999',
          cpf: '12345678901',
        },
        reason: 'Invalid email format',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /invalid.*email/i,
      },
      {
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'short', // Password too short
          phone: '+5511999999999',
          cpf: '12345678901',
        },
        reason: 'Password too short',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /password.*length/i,
      },
      {
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'Password123!',
          phone: '123456', // Invalid phone format
          cpf: '12345678901',
        },
        reason: 'Invalid phone format',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /invalid.*phone/i,
      },
      {
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'Password123!',
          phone: '+5511999999999',
          cpf: '1234567890', // CPF with wrong length
        },
        reason: 'Invalid CPF length',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /invalid.*cpf/i,
      },
    ],
    zodSchema: z.object({
      name: z.string().min(1),
      email: z.string().email({ message: 'Invalid email format' }),
      password: z.string().min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' })
        .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
      phone: z.string().regex(/^\+[0-9]{10,15}$/, { message: 'Invalid phone format' }),
      cpf: z.string().length(11, { message: 'CPF must be 11 digits' }).regex(/^[0-9]+$/, { message: 'CPF must contain only digits' }),
    }),
  },
];

/**
 * Cross-journey event validation scenarios
 */
export const eventScenarios: ValidationScenario<any>[] = [
  {
    id: 'event-basic',
    description: 'Basic event validation for cross-journey events',
    journey: 'common',
    entity: 'Event',
    validData: {
      userId: 'user-123',
      type: 'ACHIEVEMENT_PROGRESS',
      payload: {
        achievementTypeId: 'achievement-type-123',
        progress: 10,
        journey: 'health',
      },
      timestamp: new Date(),
      source: 'health-service',
    },
    invalidData: [
      {
        data: {
          userId: 'user-123',
          type: 'INVALID_TYPE', // Invalid event type
          payload: {
            achievementTypeId: 'achievement-type-123',
            progress: 10,
            journey: 'health',
          },
          timestamp: new Date(),
          source: 'health-service',
        },
        reason: 'Invalid event type',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /invalid.*event type/i,
      },
      {
        data: {
          userId: 'user-123',
          type: 'ACHIEVEMENT_PROGRESS',
          payload: 'not-an-object', // Invalid payload format
          timestamp: new Date(),
          source: 'health-service',
        },
        reason: 'Payload must be an object',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /payload.*object/i,
      },
      {
        data: {
          userId: 'user-123',
          type: 'ACHIEVEMENT_PROGRESS',
          payload: {
            achievementTypeId: 'achievement-type-123',
            progress: 10,
            journey: 'invalid-journey', // Invalid journey
          },
          timestamp: new Date(),
          source: 'health-service',
        },
        reason: 'Invalid journey in payload',
        expectedErrorType: DatabaseErrorType.DATA_INTEGRITY,
        expectedErrorPattern: /invalid.*journey/i,
      },
    ],
    zodSchema: z.object({
      userId: z.string().min(1),
      type: z.enum([
        'ACHIEVEMENT_PROGRESS',
        'ACHIEVEMENT_COMPLETED',
        'REWARD_EARNED',
        'REWARD_REDEEMED',
        'LEVEL_UP',
        'QUEST_PROGRESS',
        'QUEST_COMPLETED',
      ]),
      payload: z.record(z.string(), z.any()),
      timestamp: z.date(),
      source: z.string().min(1),
    }).refine(data => {
      if (data.type === 'ACHIEVEMENT_PROGRESS' || data.type === 'ACHIEVEMENT_COMPLETED') {
        return data.payload.journey && ['health', 'care', 'plan'].includes(data.payload.journey);
      }
      return true;
    }, {
      message: 'Invalid journey in payload',
      path: ['payload', 'journey'],
    }),
  },
];

// ==========================================
// Export all scenarios as a collection
// ==========================================

/**
 * Complete collection of validation scenarios organized by journey
 */
export const validationScenarios: ValidationScenarioCollection = {
  health: [
    ...healthMetricScenarios,
    ...healthGoalScenarios,
  ],
  care: [
    ...appointmentScenarios,
    ...medicationScenarios,
  ],
  plan: [
    ...insuranceClaimScenarios,
    ...insurancePlanScenarios,
  ],
  gamification: [
    ...achievementScenarios,
    ...rewardScenarios,
  ],
  common: [
    ...userScenarios,
    ...eventScenarios,
  ],
};

/**
 * Helper function to get scenarios by journey
 * 
 * @param journey The journey to get scenarios for
 * @returns Array of validation scenarios for the specified journey
 */
export function getScenariosByJourney(journey: keyof ValidationScenarioCollection): ValidationScenario<any>[] {
  return validationScenarios[journey] || [];
}

/**
 * Helper function to get scenarios by entity
 * 
 * @param entity The entity to get scenarios for
 * @returns Array of validation scenarios for the specified entity
 */
export function getScenariosByEntity(entity: string): ValidationScenario<any>[] {
  return Object.values(validationScenarios)
    .flat()
    .filter(scenario => scenario.entity === entity);
}

/**
 * Helper function to get scenarios that test migration compatibility
 * 
 * @returns Array of validation scenarios that test migration compatibility
 */
export function getMigrationCompatibilityScenarios(): ValidationScenario<any>[] {
  return Object.values(validationScenarios)
    .flat()
    .filter(scenario => scenario.testsMigrationCompatibility === true);
}

export default validationScenarios;