/**
 * Journey-specific validation test fixtures
 * 
 * This file provides test fixtures for validating journey-specific data models
 * across the Health, Care, and Plan journeys. These fixtures ensure that each
 * journey can properly validate its specific data requirements while maintaining
 * consistent validation patterns across the SuperApp.
 */

import { z } from 'zod';
import * as Joi from 'joi';
import { JOURNEY_NAMES } from '../../../src/constants';

// Common date constants for testing
const TODAY = new Date();
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);
const TOMORROW = new Date(TODAY);
TOMORROW.setDate(TODAY.getDate() + 1);
const ONE_YEAR_AGO = new Date(TODAY);
ONE_YEAR_AGO.setFullYear(TODAY.getFullYear() - 1);

/**
 * Health Journey Validation Fixtures
 */
export const healthJourneyFixtures = {
  // Health Metrics validation fixtures
  metrics: {
    // Zod schema for health metrics validation
    schema: z.object({
      metricType: z.enum(['WEIGHT', 'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'STEPS', 'SLEEP']),
      value: z.number().positive(),
      unit: z.string().min(1),
      timestamp: z.date().refine((date) => date <= TODAY, { message: 'Date cannot be in the future' }),
      source: z.enum(['MANUAL', 'DEVICE', 'INTEGRATION']),
      deviceId: z.string().optional(),
    }),
    
    // Valid test cases
    valid: {
      weight: {
        metricType: 'WEIGHT',
        value: 75.5,
        unit: 'kg',
        timestamp: YESTERDAY,
        source: 'MANUAL',
      },
      bloodPressure: {
        metricType: 'BLOOD_PRESSURE',
        value: 120,
        unit: 'mmHg',
        timestamp: YESTERDAY,
        source: 'DEVICE',
        deviceId: 'device-123',
      },
      steps: {
        metricType: 'STEPS',
        value: 10000,
        unit: 'steps',
        timestamp: YESTERDAY,
        source: 'INTEGRATION',
        deviceId: 'fitbit-456',
      },
    },
    
    // Invalid test cases
    invalid: {
      futureDate: {
        metricType: 'WEIGHT',
        value: 75.5,
        unit: 'kg',
        timestamp: TOMORROW,
        source: 'MANUAL',
      },
      negativeValue: {
        metricType: 'HEART_RATE',
        value: -60,
        unit: 'bpm',
        timestamp: YESTERDAY,
        source: 'DEVICE',
        deviceId: 'device-123',
      },
      missingUnit: {
        metricType: 'BLOOD_GLUCOSE',
        value: 120,
        unit: '',
        timestamp: YESTERDAY,
        source: 'MANUAL',
      },
      invalidMetricType: {
        metricType: 'INVALID_TYPE',
        value: 75.5,
        unit: 'kg',
        timestamp: YESTERDAY,
        source: 'MANUAL',
      },
    },
  },
  
  // Health Goals validation fixtures
  goals: {
    // Zod schema for health goals validation
    schema: z.object({
      goalType: z.enum(['WEIGHT', 'STEPS', 'ACTIVITY', 'SLEEP', 'NUTRITION', 'CUSTOM']),
      targetValue: z.number().positive(),
      unit: z.string().min(1),
      startDate: z.date(),
      targetDate: z.date().refine((date) => date > TODAY, { message: 'Target date must be in the future' }),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
      reminderEnabled: z.boolean(),
      reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }).refine((data) => data.targetDate > data.startDate, {
      message: 'Target date must be after start date',
      path: ['targetDate'],
    }),
    
    // Valid test cases
    valid: {
      weightGoal: {
        goalType: 'WEIGHT',
        targetValue: 70,
        unit: 'kg',
        startDate: TODAY,
        targetDate: TOMORROW,
        frequency: 'WEEKLY',
        reminderEnabled: true,
        reminderTime: '08:00',
      },
      stepsGoal: {
        goalType: 'STEPS',
        targetValue: 10000,
        unit: 'steps',
        startDate: TODAY,
        targetDate: TOMORROW,
        frequency: 'DAILY',
        reminderEnabled: false,
      },
    },
    
    // Invalid test cases
    invalid: {
      pastTargetDate: {
        goalType: 'WEIGHT',
        targetValue: 70,
        unit: 'kg',
        startDate: ONE_YEAR_AGO,
        targetDate: YESTERDAY,
        frequency: 'WEEKLY',
        reminderEnabled: true,
        reminderTime: '08:00',
      },
      targetBeforeStart: {
        goalType: 'STEPS',
        targetValue: 10000,
        unit: 'steps',
        startDate: TOMORROW,
        targetDate: TODAY,
        frequency: 'DAILY',
        reminderEnabled: false,
      },
      invalidReminderTime: {
        goalType: 'SLEEP',
        targetValue: 8,
        unit: 'hours',
        startDate: TODAY,
        targetDate: TOMORROW,
        frequency: 'DAILY',
        reminderEnabled: true,
        reminderTime: '25:00',
      },
    },
  },
  
  // Device connection validation fixtures
  deviceConnections: {
    // Zod schema for device connections validation
    schema: z.object({
      deviceType: z.enum(['FITBIT', 'GOOGLEFIT', 'APPLEHEALTH', 'GARMIN', 'SAMSUNG', 'OTHER']),
      connectionStatus: z.enum(['CONNECTED', 'DISCONNECTED', 'PENDING', 'FAILED']),
      lastSyncDate: z.date().optional(),
      accessToken: z.string().min(1),
      refreshToken: z.string().min(1),
      expiresAt: z.date(),
      scopes: z.array(z.string()),
    }),
    
    // Valid test cases
    valid: {
      fitbitConnection: {
        deviceType: 'FITBIT',
        connectionStatus: 'CONNECTED',
        lastSyncDate: YESTERDAY,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: TOMORROW,
        scopes: ['activity', 'heartrate', 'sleep'],
      },
      googleFitConnection: {
        deviceType: 'GOOGLEFIT',
        connectionStatus: 'CONNECTED',
        lastSyncDate: YESTERDAY,
        accessToken: 'access-token-456',
        refreshToken: 'refresh-token-456',
        expiresAt: TOMORROW,
        scopes: ['activity', 'body', 'location'],
      },
    },
    
    // Invalid test cases
    invalid: {
      expiredToken: {
        deviceType: 'FITBIT',
        connectionStatus: 'CONNECTED',
        lastSyncDate: YESTERDAY,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: YESTERDAY,
        scopes: ['activity', 'heartrate', 'sleep'],
      },
      emptyAccessToken: {
        deviceType: 'GOOGLEFIT',
        connectionStatus: 'CONNECTED',
        lastSyncDate: YESTERDAY,
        accessToken: '',
        refreshToken: 'refresh-token-456',
        expiresAt: TOMORROW,
        scopes: ['activity', 'body', 'location'],
      },
      invalidDeviceType: {
        deviceType: 'INVALID_DEVICE',
        connectionStatus: 'CONNECTED',
        lastSyncDate: YESTERDAY,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: TOMORROW,
        scopes: ['activity', 'heartrate', 'sleep'],
      },
    },
  },
};

/**
 * Care Journey Validation Fixtures
 */
export const careJourneyFixtures = {
  // Appointment validation fixtures
  appointments: {
    // Zod schema for appointment validation
    schema: z.object({
      providerId: z.string().uuid(),
      specialtyId: z.string().uuid(),
      appointmentType: z.enum(['IN_PERSON', 'VIDEO', 'PHONE']),
      date: z.date().refine((date) => date > TODAY, { message: 'Appointment date must be in the future' }),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      duration: z.number().int().min(15).max(120),
      reason: z.string().min(5).max(500),
      insurancePlanId: z.string().uuid().optional(),
      notes: z.string().max(1000).optional(),
    }),
    
    // Valid test cases
    valid: {
      inPersonAppointment: {
        providerId: '123e4567-e89b-12d3-a456-426614174000',
        specialtyId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentType: 'IN_PERSON',
        date: TOMORROW,
        startTime: '14:30',
        duration: 30,
        reason: 'Annual physical examination',
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174002',
        notes: 'Please bring previous test results',
      },
      videoAppointment: {
        providerId: '123e4567-e89b-12d3-a456-426614174003',
        specialtyId: '123e4567-e89b-12d3-a456-426614174004',
        appointmentType: 'VIDEO',
        date: TOMORROW,
        startTime: '10:00',
        duration: 15,
        reason: 'Follow-up consultation',
      },
    },
    
    // Invalid test cases
    invalid: {
      pastDate: {
        providerId: '123e4567-e89b-12d3-a456-426614174000',
        specialtyId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentType: 'IN_PERSON',
        date: YESTERDAY,
        startTime: '14:30',
        duration: 30,
        reason: 'Annual physical examination',
      },
      invalidTime: {
        providerId: '123e4567-e89b-12d3-a456-426614174003',
        specialtyId: '123e4567-e89b-12d3-a456-426614174004',
        appointmentType: 'VIDEO',
        date: TOMORROW,
        startTime: '25:00',
        duration: 15,
        reason: 'Follow-up consultation',
      },
      tooShortReason: {
        providerId: '123e4567-e89b-12d3-a456-426614174000',
        specialtyId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentType: 'PHONE',
        date: TOMORROW,
        startTime: '14:30',
        duration: 30,
        reason: 'Hi',
      },
      invalidDuration: {
        providerId: '123e4567-e89b-12d3-a456-426614174003',
        specialtyId: '123e4567-e89b-12d3-a456-426614174004',
        appointmentType: 'VIDEO',
        date: TOMORROW,
        startTime: '10:00',
        duration: 5,
        reason: 'Follow-up consultation',
      },
    },
  },
  
  // Medication validation fixtures
  medications: {
    // Zod schema for medication validation
    schema: z.object({
      name: z.string().min(3).max(100),
      dosage: z.string().min(1).max(50),
      frequency: z.enum(['ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'AS_NEEDED', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
      customFrequency: z.string().max(100).optional(),
      startDate: z.date(),
      endDate: z.date().optional(),
      instructions: z.string().max(500).optional(),
      reminderEnabled: z.boolean(),
      reminderTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(),
    }).refine(
      (data) => !data.endDate || data.endDate >= data.startDate,
      {
        message: 'End date must be after or equal to start date',
        path: ['endDate'],
      }
    ).refine(
      (data) => data.frequency !== 'CUSTOM' || (data.customFrequency && data.customFrequency.length > 0),
      {
        message: 'Custom frequency is required when frequency is set to CUSTOM',
        path: ['customFrequency'],
      }
    ).refine(
      (data) => !data.reminderEnabled || (data.reminderTimes && data.reminderTimes.length > 0),
      {
        message: 'Reminder times are required when reminders are enabled',
        path: ['reminderTimes'],
      }
    ),
    
    // Valid test cases
    valid: {
      dailyMedication: {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'ONCE_DAILY',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, TODAY.getDate()),
        instructions: 'Take with food',
        reminderEnabled: true,
        reminderTimes: ['08:00'],
      },
      asNeededMedication: {
        name: 'Ibuprofen',
        dosage: '200mg',
        frequency: 'AS_NEEDED',
        startDate: TODAY,
        instructions: 'Take for pain as needed, not to exceed 6 tablets in 24 hours',
        reminderEnabled: false,
      },
      customMedication: {
        name: 'Insulin',
        dosage: '10 units',
        frequency: 'CUSTOM',
        customFrequency: 'Before meals and at bedtime',
        startDate: TODAY,
        instructions: 'Adjust based on blood glucose readings',
        reminderEnabled: true,
        reminderTimes: ['07:30', '12:30', '18:30', '22:00'],
      },
    },
    
    // Invalid test cases
    invalid: {
      endBeforeStart: {
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'THREE_TIMES_DAILY',
        startDate: TOMORROW,
        endDate: TODAY,
        instructions: 'Take until completed',
        reminderEnabled: true,
        reminderTimes: ['08:00', '14:00', '20:00'],
      },
      missingCustomFrequency: {
        name: 'Metformin',
        dosage: '1000mg',
        frequency: 'CUSTOM',
        startDate: TODAY,
        reminderEnabled: false,
      },
      missingReminderTimes: {
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'ONCE_DAILY',
        startDate: TODAY,
        reminderEnabled: true,
      },
      nameTooShort: {
        name: 'Rx',
        dosage: '10mg',
        frequency: 'ONCE_DAILY',
        startDate: TODAY,
        reminderEnabled: false,
      },
    },
  },
  
  // Telemedicine session validation fixtures
  telemedicineSessions: {
    // Zod schema for telemedicine session validation
    schema: z.object({
      appointmentId: z.string().uuid(),
      sessionType: z.enum(['VIDEO', 'AUDIO']),
      scheduledStartTime: z.date(),
      actualStartTime: z.date().optional(),
      endTime: z.date().optional(),
      status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
      providerNotes: z.string().max(2000).optional(),
      patientNotes: z.string().max(1000).optional(),
      technicalIssues: z.array(z.enum(['AUDIO', 'VIDEO', 'CONNECTION', 'OTHER'])).optional(),
      recordingEnabled: z.boolean(),
      recordingUrl: z.string().url().optional(),
    }).refine(
      (data) => !data.actualStartTime || data.actualStartTime >= data.scheduledStartTime,
      {
        message: 'Actual start time cannot be before scheduled start time',
        path: ['actualStartTime'],
      }
    ).refine(
      (data) => !data.endTime || !data.actualStartTime || data.endTime >= data.actualStartTime,
      {
        message: 'End time cannot be before actual start time',
        path: ['endTime'],
      }
    ).refine(
      (data) => !data.recordingUrl || data.recordingEnabled,
      {
        message: 'Recording URL cannot be provided if recording is not enabled',
        path: ['recordingUrl'],
      }
    ),
    
    // Valid test cases
    valid: {
      scheduledSession: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        sessionType: 'VIDEO',
        scheduledStartTime: TOMORROW,
        status: 'SCHEDULED',
        recordingEnabled: false,
      },
      completedSession: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174001',
        sessionType: 'VIDEO',
        scheduledStartTime: YESTERDAY,
        actualStartTime: new Date(YESTERDAY.getTime() + 5 * 60000), // 5 minutes after scheduled
        endTime: new Date(YESTERDAY.getTime() + 35 * 60000), // 30 minutes duration
        status: 'COMPLETED',
        providerNotes: 'Patient reported improvement in symptoms',
        patientNotes: 'Doctor recommended continuing current medication',
        recordingEnabled: true,
        recordingUrl: 'https://telemedicine.austa.com.br/recordings/session-123.mp4',
      },
      cancelledSession: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174002',
        sessionType: 'AUDIO',
        scheduledStartTime: YESTERDAY,
        status: 'CANCELLED',
        patientNotes: 'Need to reschedule due to emergency',
        recordingEnabled: false,
      },
    },
    
    // Invalid test cases
    invalid: {
      actualStartBeforeScheduled: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        sessionType: 'VIDEO',
        scheduledStartTime: TOMORROW,
        actualStartTime: TODAY,
        status: 'IN_PROGRESS',
        recordingEnabled: false,
      },
      endBeforeActualStart: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174001',
        sessionType: 'VIDEO',
        scheduledStartTime: YESTERDAY,
        actualStartTime: new Date(YESTERDAY.getTime() + 30 * 60000),
        endTime: new Date(YESTERDAY.getTime() + 15 * 60000),
        status: 'COMPLETED',
        recordingEnabled: false,
      },
      recordingUrlWithoutEnabled: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174002',
        sessionType: 'VIDEO',
        scheduledStartTime: YESTERDAY,
        actualStartTime: YESTERDAY,
        endTime: new Date(YESTERDAY.getTime() + 30 * 60000),
        status: 'COMPLETED',
        recordingEnabled: false,
        recordingUrl: 'https://telemedicine.austa.com.br/recordings/session-123.mp4',
      },
    },
  },
};

/**
 * Plan Journey Validation Fixtures
 */
export const planJourneyFixtures = {
  // Claims validation fixtures
  claims: {
    // Zod schema for claims validation
    schema: z.object({
      procedureType: z.enum(['CONSULTATION', 'EXAMINATION', 'PROCEDURE', 'EMERGENCY', 'MEDICATION', 'OTHER']),
      date: z.date().refine((date) => date <= TODAY, { message: 'Date cannot be in the future' }),
      provider: z.string().min(1),
      amount: z.number().positive(),
      receiptUrls: z.array(z.string().url()).min(1),
      additionalDocumentUrls: z.array(z.string().url()).optional(),
      description: z.string().min(10).max(500),
      insurancePlanId: z.string().uuid(),
      preAuthorized: z.boolean(),
      preAuthorizationCode: z.string().optional(),
    }).refine(
      (data) => !data.preAuthorized || (data.preAuthorizationCode && data.preAuthorizationCode.length > 0),
      {
        message: 'Pre-authorization code is required when pre-authorized is true',
        path: ['preAuthorizationCode'],
      }
    ),
    
    // Valid test cases
    valid: {
      consultationClaim: {
        procedureType: 'CONSULTATION',
        date: YESTERDAY,
        provider: 'Dr. Maria Silva',
        amount: 250.00,
        receiptUrls: ['https://storage.austa.com.br/receipts/receipt-123.pdf'],
        description: 'Routine consultation with cardiologist',
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174000',
        preAuthorized: false,
      },
      preAuthorizedClaim: {
        procedureType: 'PROCEDURE',
        date: YESTERDAY,
        provider: 'Hospital São Paulo',
        amount: 1500.00,
        receiptUrls: ['https://storage.austa.com.br/receipts/receipt-456.pdf'],
        additionalDocumentUrls: [
          'https://storage.austa.com.br/documents/medical-report-456.pdf',
          'https://storage.austa.com.br/documents/prescription-456.pdf',
        ],
        description: 'Endoscopy procedure with biopsy',
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174001',
        preAuthorized: true,
        preAuthorizationCode: 'AUTH-12345-XYZ',
      },
    },
    
    // Invalid test cases
    invalid: {
      futureDate: {
        procedureType: 'CONSULTATION',
        date: TOMORROW,
        provider: 'Dr. Maria Silva',
        amount: 250.00,
        receiptUrls: ['https://storage.austa.com.br/receipts/receipt-123.pdf'],
        description: 'Routine consultation with cardiologist',
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174000',
        preAuthorized: false,
      },
      missingPreAuthCode: {
        procedureType: 'PROCEDURE',
        date: YESTERDAY,
        provider: 'Hospital São Paulo',
        amount: 1500.00,
        receiptUrls: ['https://storage.austa.com.br/receipts/receipt-456.pdf'],
        description: 'Endoscopy procedure with biopsy',
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174001',
        preAuthorized: true,
      },
      negativeAmount: {
        procedureType: 'MEDICATION',
        date: YESTERDAY,
        provider: 'Farmácia Popular',
        amount: -50.00,
        receiptUrls: ['https://storage.austa.com.br/receipts/receipt-789.pdf'],
        description: 'Monthly prescription medications',
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174002',
        preAuthorized: false,
      },
      noReceipts: {
        procedureType: 'EXAMINATION',
        date: YESTERDAY,
        provider: 'Laboratório Diagnóstico',
        amount: 350.00,
        receiptUrls: [],
        description: 'Blood tests for annual checkup',
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174003',
        preAuthorized: false,
      },
    },
  },
  
  // Benefits validation fixtures
  benefits: {
    // Zod schema for benefits validation
    schema: z.object({
      benefitType: z.enum(['WELLNESS', 'DISCOUNT', 'SERVICE', 'PRODUCT', 'REIMBURSEMENT']),
      name: z.string().min(3).max(100),
      description: z.string().min(10).max(1000),
      startDate: z.date(),
      endDate: z.date().optional(),
      usageLimit: z.number().int().min(0).optional(),
      usageCount: z.number().int().min(0).default(0),
      partnerName: z.string().min(1).optional(),
      partnerLogo: z.string().url().optional(),
      termsUrl: z.string().url().optional(),
      redemptionCode: z.string().optional(),
      redemptionUrl: z.string().url().optional(),
      insurancePlanIds: z.array(z.string().uuid()),
    }).refine(
      (data) => !data.endDate || data.endDate > data.startDate,
      {
        message: 'End date must be after start date',
        path: ['endDate'],
      }
    ).refine(
      (data) => !data.usageLimit || data.usageCount <= data.usageLimit,
      {
        message: 'Usage count cannot exceed usage limit',
        path: ['usageCount'],
      }
    ).refine(
      (data) => data.benefitType !== 'DISCOUNT' || (data.partnerName && data.partnerName.length > 0),
      {
        message: 'Partner name is required for discount benefits',
        path: ['partnerName'],
      }
    ),
    
    // Valid test cases
    valid: {
      wellnessBenefit: {
        benefitType: 'WELLNESS',
        name: 'Free Gym Membership',
        description: 'Access to partner gyms nationwide with your insurance card',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear() + 1, TODAY.getMonth(), TODAY.getDate()),
        usageLimit: 1,
        usageCount: 0,
        partnerName: 'FitNetwork',
        partnerLogo: 'https://storage.austa.com.br/partners/fitnetwork-logo.png',
        termsUrl: 'https://austa.com.br/benefits/terms/gym-membership',
        redemptionUrl: 'https://austa.com.br/benefits/redeem/gym-membership',
        insurancePlanIds: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
      },
      discountBenefit: {
        benefitType: 'DISCOUNT',
        name: '20% Off Prescription Medications',
        description: 'Get 20% off all prescription medications at partner pharmacies',
        startDate: TODAY,
        partnerName: 'Farmácia Popular',
        partnerLogo: 'https://storage.austa.com.br/partners/farmaciapopular-logo.png',
        redemptionCode: 'AUSTA20',
        insurancePlanIds: ['123e4567-e89b-12d3-a456-426614174000'],
      },
    },
    
    // Invalid test cases
    invalid: {
      endBeforeStart: {
        benefitType: 'SERVICE',
        name: 'Annual Health Checkup',
        description: 'Comprehensive annual health assessment',
        startDate: TOMORROW,
        endDate: TODAY,
        usageLimit: 1,
        usageCount: 0,
        insurancePlanIds: ['123e4567-e89b-12d3-a456-426614174000'],
      },
      usageExceedsLimit: {
        benefitType: 'PRODUCT',
        name: 'Free Health Monitor',
        description: 'Receive a complimentary health monitoring device',
        startDate: TODAY,
        usageLimit: 1,
        usageCount: 2,
        insurancePlanIds: ['123e4567-e89b-12d3-a456-426614174000'],
      },
      missingPartnerForDiscount: {
        benefitType: 'DISCOUNT',
        name: '15% Off Health Supplements',
        description: 'Discount on health supplements at partner stores',
        startDate: TODAY,
        redemptionCode: 'HEALTH15',
        insurancePlanIds: ['123e4567-e89b-12d3-a456-426614174000'],
      },
    },
  },
  
  // Coverage validation fixtures
  coverage: {
    // Zod schema for coverage validation
    schema: z.object({
      insurancePlanId: z.string().uuid(),
      coverageType: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'CUSTOM']),
      startDate: z.date(),
      endDate: z.date(),
      isActive: z.boolean(),
      memberId: z.string().min(5),
      memberName: z.string().min(3),
      coverageDetails: z.object({
        consultations: z.number().min(0).max(100),
        examinations: z.number().min(0).max(100),
        procedures: z.number().min(0).max(100),
        emergencies: z.number().min(0).max(100),
        medications: z.number().min(0).max(100),
        hospitalizations: z.number().min(0).max(100),
      }),
      annualLimit: z.number().min(0).optional(),
      usedAmount: z.number().min(0).default(0),
      dependents: z.array(z.object({
        name: z.string().min(3),
        relationship: z.enum(['SPOUSE', 'CHILD', 'PARENT', 'OTHER']),
        birthDate: z.date(),
        memberId: z.string().min(5),
      })).optional(),
    }).refine(
      (data) => data.endDate > data.startDate,
      {
        message: 'End date must be after start date',
        path: ['endDate'],
      }
    ).refine(
      (data) => !data.annualLimit || data.usedAmount <= data.annualLimit,
      {
        message: 'Used amount cannot exceed annual limit',
        path: ['usedAmount'],
      }
    ),
    
    // Valid test cases
    valid: {
      basicCoverage: {
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174000',
        coverageType: 'BASIC',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear() + 1, TODAY.getMonth(), TODAY.getDate()),
        isActive: true,
        memberId: 'AUSTA12345',
        memberName: 'João Silva',
        coverageDetails: {
          consultations: 70,
          examinations: 60,
          procedures: 50,
          emergencies: 80,
          medications: 40,
          hospitalizations: 60,
        },
        annualLimit: 50000,
        usedAmount: 5000,
        dependents: [
          {
            name: 'Maria Silva',
            relationship: 'SPOUSE',
            birthDate: new Date(1985, 5, 15),
            memberId: 'AUSTA12346',
          },
          {
            name: 'Pedro Silva',
            relationship: 'CHILD',
            birthDate: new Date(2010, 8, 22),
            memberId: 'AUSTA12347',
          },
        ],
      },
      premiumCoverage: {
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174001',
        coverageType: 'PREMIUM',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear() + 1, TODAY.getMonth(), TODAY.getDate()),
        isActive: true,
        memberId: 'AUSTA67890',
        memberName: 'Ana Oliveira',
        coverageDetails: {
          consultations: 90,
          examinations: 90,
          procedures: 80,
          emergencies: 100,
          medications: 70,
          hospitalizations: 90,
        },
        annualLimit: 100000,
        usedAmount: 0,
      },
    },
    
    // Invalid test cases
    invalid: {
      endBeforeStart: {
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174000',
        coverageType: 'BASIC',
        startDate: TOMORROW,
        endDate: TODAY,
        isActive: true,
        memberId: 'AUSTA12345',
        memberName: 'João Silva',
        coverageDetails: {
          consultations: 70,
          examinations: 60,
          procedures: 50,
          emergencies: 80,
          medications: 40,
          hospitalizations: 60,
        },
      },
      usedExceedsLimit: {
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174001',
        coverageType: 'STANDARD',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear() + 1, TODAY.getMonth(), TODAY.getDate()),
        isActive: true,
        memberId: 'AUSTA67890',
        memberName: 'Ana Oliveira',
        coverageDetails: {
          consultations: 80,
          examinations: 70,
          procedures: 60,
          emergencies: 90,
          medications: 50,
          hospitalizations: 70,
        },
        annualLimit: 50000,
        usedAmount: 60000,
      },
      invalidCoveragePercentage: {
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174002',
        coverageType: 'CUSTOM',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear() + 1, TODAY.getMonth(), TODAY.getDate()),
        isActive: true,
        memberId: 'AUSTA54321',
        memberName: 'Carlos Mendes',
        coverageDetails: {
          consultations: 110, // Invalid: over 100%
          examinations: 70,
          procedures: 60,
          emergencies: 90,
          medications: 50,
          hospitalizations: 70,
        },
      },
    },
  },
};

/**
 * Cross-Journey Validation Fixtures
 * These fixtures test scenarios that span multiple journeys
 */
export const crossJourneyFixtures = {
  // Health + Care journey integration
  healthCareCrossover: {
    // Zod schema for health metrics that trigger care recommendations
    schema: z.object({
      metricType: z.enum(['BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'HEART_RATE']),
      value: z.number(),
      unit: z.string().min(1),
      timestamp: z.date(),
      source: z.enum(['MANUAL', 'DEVICE', 'INTEGRATION']),
      deviceId: z.string().optional(),
      thresholds: z.object({
        low: z.number(),
        high: z.number(),
        critical: z.number().optional(),
      }),
      careActionRequired: z.boolean(),
      careActionType: z.enum(['MONITOR', 'CONSULT', 'EMERGENCY']).optional(),
    }).refine(
      (data) => !data.careActionRequired || data.careActionType !== undefined,
      {
        message: 'Care action type is required when care action is required',
        path: ['careActionType'],
      }
    ).refine(
      (data) => data.thresholds.low < data.thresholds.high,
      {
        message: 'Low threshold must be less than high threshold',
        path: ['thresholds'],
      }
    ).refine(
      (data) => !data.thresholds.critical || data.thresholds.high < data.thresholds.critical,
      {
        message: 'High threshold must be less than critical threshold',
        path: ['thresholds'],
      }
    ),
    
    // Valid test cases
    valid: {
      normalBloodPressure: {
        metricType: 'BLOOD_PRESSURE',
        value: 120,
        unit: 'mmHg',
        timestamp: YESTERDAY,
        source: 'DEVICE',
        deviceId: 'device-123',
        thresholds: {
          low: 90,
          high: 140,
          critical: 180,
        },
        careActionRequired: false,
      },
      highBloodGlucose: {
        metricType: 'BLOOD_GLUCOSE',
        value: 180,
        unit: 'mg/dL',
        timestamp: YESTERDAY,
        source: 'MANUAL',
        thresholds: {
          low: 70,
          high: 140,
          critical: 250,
        },
        careActionRequired: true,
        careActionType: 'CONSULT',
      },
      criticalHeartRate: {
        metricType: 'HEART_RATE',
        value: 150,
        unit: 'bpm',
        timestamp: YESTERDAY,
        source: 'DEVICE',
        deviceId: 'device-456',
        thresholds: {
          low: 50,
          high: 100,
          critical: 140,
        },
        careActionRequired: true,
        careActionType: 'EMERGENCY',
      },
    },
    
    // Invalid test cases
    invalid: {
      missingCareActionType: {
        metricType: 'BLOOD_PRESSURE',
        value: 160,
        unit: 'mmHg',
        timestamp: YESTERDAY,
        source: 'DEVICE',
        deviceId: 'device-123',
        thresholds: {
          low: 90,
          high: 140,
          critical: 180,
        },
        careActionRequired: true,
      },
      invalidThresholds: {
        metricType: 'BLOOD_GLUCOSE',
        value: 120,
        unit: 'mg/dL',
        timestamp: YESTERDAY,
        source: 'MANUAL',
        thresholds: {
          low: 140, // Invalid: low > high
          high: 70,
          critical: 250,
        },
        careActionRequired: false,
      },
      criticalLowerThanHigh: {
        metricType: 'HEART_RATE',
        value: 90,
        unit: 'bpm',
        timestamp: YESTERDAY,
        source: 'DEVICE',
        deviceId: 'device-456',
        thresholds: {
          low: 50,
          high: 120,
          critical: 100, // Invalid: critical < high
        },
        careActionRequired: false,
      },
    },
  },
  
  // Care + Plan journey integration
  carePlanCrossover: {
    // Zod schema for appointment with insurance coverage validation
    schema: z.object({
      appointmentId: z.string().uuid(),
      providerId: z.string().uuid(),
      specialtyId: z.string().uuid(),
      appointmentType: z.enum(['IN_PERSON', 'VIDEO', 'PHONE']),
      date: z.date().refine((date) => date > TODAY, { message: 'Appointment date must be in the future' }),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      duration: z.number().int().min(15).max(120),
      reason: z.string().min(5).max(500),
      insuranceCoverage: z.object({
        insurancePlanId: z.string().uuid(),
        coveragePercentage: z.number().min(0).max(100),
        preAuthorizationRequired: z.boolean(),
        preAuthorizationCode: z.string().optional(),
        estimatedCost: z.number().positive(),
        estimatedCopay: z.number().min(0),
        inNetwork: z.boolean(),
      }),
    }).refine(
      (data) => !data.insuranceCoverage.preAuthorizationRequired || 
               (data.insuranceCoverage.preAuthorizationCode && 
                data.insuranceCoverage.preAuthorizationCode.length > 0),
      {
        message: 'Pre-authorization code is required when pre-authorization is required',
        path: ['insuranceCoverage', 'preAuthorizationCode'],
      }
    ).refine(
      (data) => {
        const { estimatedCost, coveragePercentage, estimatedCopay } = data.insuranceCoverage;
        const calculatedCopay = estimatedCost * (1 - coveragePercentage / 100);
        return Math.abs(calculatedCopay - estimatedCopay) < 0.01; // Allow for small floating point differences
      },
      {
        message: 'Estimated copay must match the calculated amount based on coverage percentage',
        path: ['insuranceCoverage', 'estimatedCopay'],
      }
    ),
    
    // Valid test cases
    valid: {
      inNetworkAppointment: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        specialtyId: '123e4567-e89b-12d3-a456-426614174002',
        appointmentType: 'IN_PERSON',
        date: TOMORROW,
        startTime: '14:30',
        duration: 30,
        reason: 'Annual physical examination',
        insuranceCoverage: {
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174003',
          coveragePercentage: 80,
          preAuthorizationRequired: false,
          estimatedCost: 250.00,
          estimatedCopay: 50.00,
          inNetwork: true,
        },
      },
      preAuthorizedAppointment: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174004',
        providerId: '123e4567-e89b-12d3-a456-426614174005',
        specialtyId: '123e4567-e89b-12d3-a456-426614174006',
        appointmentType: 'VIDEO',
        date: TOMORROW,
        startTime: '10:00',
        duration: 45,
        reason: 'Specialist consultation',
        insuranceCoverage: {
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174007',
          coveragePercentage: 70,
          preAuthorizationRequired: true,
          preAuthorizationCode: 'AUTH-67890-XYZ',
          estimatedCost: 350.00,
          estimatedCopay: 105.00,
          inNetwork: true,
        },
      },
    },
    
    // Invalid test cases
    invalid: {
      missingPreAuthCode: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174008',
        providerId: '123e4567-e89b-12d3-a456-426614174009',
        specialtyId: '123e4567-e89b-12d3-a456-426614174010',
        appointmentType: 'IN_PERSON',
        date: TOMORROW,
        startTime: '15:45',
        duration: 60,
        reason: 'Specialized procedure',
        insuranceCoverage: {
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174011',
          coveragePercentage: 60,
          preAuthorizationRequired: true, // Missing preAuthorizationCode
          estimatedCost: 500.00,
          estimatedCopay: 200.00,
          inNetwork: true,
        },
      },
      incorrectCopayCalculation: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174012',
        providerId: '123e4567-e89b-12d3-a456-426614174013',
        specialtyId: '123e4567-e89b-12d3-a456-426614174014',
        appointmentType: 'PHONE',
        date: TOMORROW,
        startTime: '09:15',
        duration: 15,
        reason: 'Follow-up consultation',
        insuranceCoverage: {
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174015',
          coveragePercentage: 75,
          preAuthorizationRequired: false,
          estimatedCost: 200.00,
          estimatedCopay: 30.00, // Incorrect: should be 50.00 (25% of 200)
          inNetwork: true,
        },
      },
    },
  },
  
  // Health + Plan journey integration
  healthPlanCrossover: {
    // Zod schema for wellness program with insurance benefits
    schema: z.object({
      programId: z.string().uuid(),
      programName: z.string().min(3).max(100),
      programType: z.enum(['FITNESS', 'NUTRITION', 'MENTAL_HEALTH', 'CHRONIC_CONDITION']),
      startDate: z.date(),
      endDate: z.date(),
      healthMetrics: z.array(z.enum(['WEIGHT', 'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'STEPS', 'SLEEP'])).min(1),
      targetGoals: z.array(z.object({
        metricType: z.enum(['WEIGHT', 'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'STEPS', 'SLEEP']),
        targetValue: z.number().positive(),
        unit: z.string().min(1),
      })).min(1),
      insuranceBenefits: z.object({
        insurancePlanId: z.string().uuid(),
        discountPercentage: z.number().min(0).max(100),
        pointsPerMetric: z.number().int().min(0),
        rewardsThreshold: z.number().int().min(0),
        maxAnnualReward: z.number().min(0),
      }),
    }).refine(
      (data) => data.endDate > data.startDate,
      {
        message: 'End date must be after start date',
        path: ['endDate'],
      }
    ).refine(
      (data) => {
        // Ensure all targetGoals metrics are included in healthMetrics
        const healthMetricsSet = new Set(data.healthMetrics);
        return data.targetGoals.every(goal => healthMetricsSet.has(goal.metricType));
      },
      {
        message: 'Target goals must only include metrics listed in health metrics',
        path: ['targetGoals'],
      }
    ),
    
    // Valid test cases
    valid: {
      fitnessProgram: {
        programId: '123e4567-e89b-12d3-a456-426614174000',
        programName: 'Active Lifestyle Program',
        programType: 'FITNESS',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear(), TODAY.getMonth() + 3, TODAY.getDate()),
        healthMetrics: ['WEIGHT', 'STEPS', 'HEART_RATE'],
        targetGoals: [
          {
            metricType: 'STEPS',
            targetValue: 10000,
            unit: 'steps',
          },
          {
            metricType: 'WEIGHT',
            targetValue: 70,
            unit: 'kg',
          },
        ],
        insuranceBenefits: {
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174001',
          discountPercentage: 5,
          pointsPerMetric: 10,
          rewardsThreshold: 500,
          maxAnnualReward: 1000,
        },
      },
      chronicConditionProgram: {
        programId: '123e4567-e89b-12d3-a456-426614174002',
        programName: 'Diabetes Management Program',
        programType: 'CHRONIC_CONDITION',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear() + 1, TODAY.getMonth(), TODAY.getDate()),
        healthMetrics: ['BLOOD_GLUCOSE', 'WEIGHT', 'STEPS'],
        targetGoals: [
          {
            metricType: 'BLOOD_GLUCOSE',
            targetValue: 120,
            unit: 'mg/dL',
          },
          {
            metricType: 'WEIGHT',
            targetValue: 75,
            unit: 'kg',
          },
        ],
        insuranceBenefits: {
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174003',
          discountPercentage: 10,
          pointsPerMetric: 20,
          rewardsThreshold: 1000,
          maxAnnualReward: 2000,
        },
      },
    },
    
    // Invalid test cases
    invalid: {
      endBeforeStart: {
        programId: '123e4567-e89b-12d3-a456-426614174004',
        programName: 'Mental Wellness Program',
        programType: 'MENTAL_HEALTH',
        startDate: TOMORROW,
        endDate: TODAY,
        healthMetrics: ['SLEEP', 'HEART_RATE'],
        targetGoals: [
          {
            metricType: 'SLEEP',
            targetValue: 8,
            unit: 'hours',
          },
        ],
        insuranceBenefits: {
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174005',
          discountPercentage: 3,
          pointsPerMetric: 5,
          rewardsThreshold: 300,
          maxAnnualReward: 500,
        },
      },
      metricNotInHealthMetrics: {
        programId: '123e4567-e89b-12d3-a456-426614174006',
        programName: 'Nutrition Program',
        programType: 'NUTRITION',
        startDate: TODAY,
        endDate: new Date(TODAY.getFullYear(), TODAY.getMonth() + 6, TODAY.getDate()),
        healthMetrics: ['WEIGHT', 'STEPS'],
        targetGoals: [
          {
            metricType: 'BLOOD_GLUCOSE', // Not in healthMetrics
            targetValue: 100,
            unit: 'mg/dL',
          },
          {
            metricType: 'WEIGHT',
            targetValue: 68,
            unit: 'kg',
          },
        ],
        insuranceBenefits: {
          insurancePlanId: '123e4567-e89b-12d3-a456-426614174007',
          discountPercentage: 5,
          pointsPerMetric: 10,
          rewardsThreshold: 500,
          maxAnnualReward: 1000,
        },
      },
    },
  },
};

/**
 * Export all journey validation fixtures
 */
export const journeyValidationFixtures = {
  health: healthJourneyFixtures,
  care: careJourneyFixtures,
  plan: planJourneyFixtures,
  crossJourney: crossJourneyFixtures,
};

export default journeyValidationFixtures;