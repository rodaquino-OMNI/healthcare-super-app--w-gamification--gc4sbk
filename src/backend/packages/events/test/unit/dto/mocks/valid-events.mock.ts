/**
 * @file valid-events.mock.ts
 * 
 * This file provides a comprehensive collection of valid event mock data from all journeys
 * (Health, Care, Plan) to support positive test scenarios. These mock events pass all validation
 * rules and provide a reliable reference for testing the happy path of event processing pipelines.
 */

import { v4 as uuidv4 } from 'uuid';

// Common test values
const TEST_USER_ID = '12345678-1234-1234-1234-123456789012';
const TEST_TIMESTAMP = new Date().toISOString();
const TEST_CORRELATION_ID = uuidv4();

/**
 * Base event structure that all valid events should follow
 */
export interface BaseEventMock {
  eventId: string;
  type: string;
  userId: string;
  journey: string;
  timestamp: string;
  version: string;
  correlationId: string;
  data: Record<string, any>;
}

/**
 * Creates a base event with common properties
 */
const createBaseEvent = (type: string, journey: string, data: Record<string, any>): BaseEventMock => ({
  eventId: uuidv4(),
  type,
  userId: TEST_USER_ID,
  journey,
  timestamp: TEST_TIMESTAMP,
  version: '1.0.0',
  correlationId: TEST_CORRELATION_ID,
  data,
});

/**
 * Valid Health Journey Events
 */
export const validHealthEvents: BaseEventMock[] = [
  // Health Metric Recorded - Heart Rate
  createBaseEvent('HEALTH_METRIC_RECORDED', 'health', {
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: TEST_TIMESTAMP,
    source: 'manual',
  }),

  // Health Metric Recorded - Blood Pressure
  createBaseEvent('HEALTH_METRIC_RECORDED', 'health', {
    metricType: 'BLOOD_PRESSURE',
    systolic: 120,
    diastolic: 80,
    unit: 'mmHg',
    recordedAt: TEST_TIMESTAMP,
    source: 'device',
    deviceId: uuidv4(),
  }),

  // Health Metric Recorded - Blood Glucose
  createBaseEvent('HEALTH_METRIC_RECORDED', 'health', {
    metricType: 'BLOOD_GLUCOSE',
    value: 85,
    unit: 'mg/dL',
    recordedAt: TEST_TIMESTAMP,
    source: 'manual',
    mealContext: 'fasting',
  }),

  // Health Metric Recorded - Steps
  createBaseEvent('HEALTH_METRIC_RECORDED', 'health', {
    metricType: 'STEPS',
    value: 8500,
    unit: 'steps',
    recordedAt: TEST_TIMESTAMP,
    source: 'device',
    deviceId: uuidv4(),
    startTime: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
    endTime: TEST_TIMESTAMP,
  }),

  // Health Metric Recorded - Weight
  createBaseEvent('HEALTH_METRIC_RECORDED', 'health', {
    metricType: 'WEIGHT',
    value: 70.5,
    unit: 'kg',
    recordedAt: TEST_TIMESTAMP,
    source: 'manual',
  }),

  // Health Metric Recorded - Sleep
  createBaseEvent('HEALTH_METRIC_RECORDED', 'health', {
    metricType: 'SLEEP',
    value: 7.5,
    unit: 'hours',
    recordedAt: TEST_TIMESTAMP,
    source: 'device',
    deviceId: uuidv4(),
    sleepQuality: 'good',
    startTime: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
    endTime: TEST_TIMESTAMP,
  }),

  // Goal Created
  createBaseEvent('GOAL_CREATED', 'health', {
    goalId: uuidv4(),
    goalType: 'STEPS',
    targetValue: 10000,
    unit: 'steps',
    frequency: 'daily',
    startDate: TEST_TIMESTAMP,
    endDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
  }),

  // Goal Progress Updated
  createBaseEvent('GOAL_PROGRESS_UPDATED', 'health', {
    goalId: uuidv4(),
    goalType: 'STEPS',
    currentValue: 8500,
    targetValue: 10000,
    progressPercentage: 85,
    unit: 'steps',
    updatedAt: TEST_TIMESTAMP,
  }),

  // Goal Achieved
  createBaseEvent('GOAL_ACHIEVED', 'health', {
    goalId: uuidv4(),
    goalType: 'STEPS',
    targetValue: 10000,
    achievedValue: 10200,
    unit: 'steps',
    achievedAt: TEST_TIMESTAMP,
    streakCount: 3,
  }),

  // Device Connected
  createBaseEvent('DEVICE_CONNECTED', 'health', {
    deviceId: uuidv4(),
    deviceType: 'Smartwatch',
    manufacturer: 'Various',
    model: 'Health Tracker Pro',
    connectedAt: TEST_TIMESTAMP,
    supportedMetrics: ['HEART_RATE', 'STEPS', 'SLEEP'],
  }),

  // Device Synced
  createBaseEvent('DEVICE_SYNCED', 'health', {
    deviceId: uuidv4(),
    deviceType: 'Smartwatch',
    syncedAt: TEST_TIMESTAMP,
    metricsCount: 5,
    syncDuration: 3.2, // seconds
    batteryLevel: 75, // percentage
  }),
];

/**
 * Valid Care Journey Events
 */
export const validCareEvents: BaseEventMock[] = [
  // Appointment Booked
  createBaseEvent('APPOINTMENT_BOOKED', 'care', {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyName: 'Cardiologia',
    appointmentType: 'consultation',
    scheduledAt: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
    bookedAt: TEST_TIMESTAMP,
    location: 'Clínica Central',
    virtual: false,
  }),

  // Appointment Confirmed
  createBaseEvent('APPOINTMENT_CONFIRMED', 'care', {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyName: 'Dermatologia',
    appointmentType: 'consultation',
    scheduledAt: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    confirmedAt: TEST_TIMESTAMP,
  }),

  // Appointment Completed
  createBaseEvent('APPOINTMENT_COMPLETED', 'care', {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyName: 'Ortopedia',
    appointmentType: 'follow-up',
    scheduledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    completedAt: TEST_TIMESTAMP,
    duration: 30, // minutes
    followUpRecommended: true,
  }),

  // Appointment Cancelled
  createBaseEvent('APPOINTMENT_CANCELLED', 'care', {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyName: 'Pediatria',
    appointmentType: 'consultation',
    scheduledAt: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
    cancelledAt: TEST_TIMESTAMP,
    cancellationReason: 'schedule_conflict',
    cancelledBy: 'user',
  }),

  // Medication Added
  createBaseEvent('MEDICATION_ADDED', 'care', {
    medicationId: uuidv4(),
    name: 'Atorvastatina',
    dosage: '20mg',
    frequency: 'daily',
    startDate: TEST_TIMESTAMP,
    endDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    instructions: 'Take with evening meal',
    prescribedBy: uuidv4(), // provider ID
    prescribedAt: TEST_TIMESTAMP,
  }),

  // Medication Taken
  createBaseEvent('MEDICATION_TAKEN', 'care', {
    medicationId: uuidv4(),
    name: 'Atorvastatina',
    dosage: '20mg',
    takenAt: TEST_TIMESTAMP,
    scheduledFor: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    adherence: 'on_time',
  }),

  // Medication Skipped
  createBaseEvent('MEDICATION_SKIPPED', 'care', {
    medicationId: uuidv4(),
    name: 'Atorvastatina',
    dosage: '20mg',
    skippedAt: TEST_TIMESTAMP,
    scheduledFor: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    reason: 'side_effects',
  }),

  // Telemedicine Session Started
  createBaseEvent('TELEMEDICINE_SESSION_STARTED', 'care', {
    sessionId: uuidv4(),
    providerId: uuidv4(),
    specialtyName: 'Psiquiatria',
    appointmentId: uuidv4(),
    startedAt: TEST_TIMESTAMP,
    platform: 'integrated',
  }),

  // Telemedicine Session Completed
  createBaseEvent('TELEMEDICINE_SESSION_COMPLETED', 'care', {
    sessionId: uuidv4(),
    providerId: uuidv4(),
    specialtyName: 'Psiquiatria',
    appointmentId: uuidv4(),
    startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    completedAt: TEST_TIMESTAMP,
    duration: 30, // minutes
    quality: 'good',
    followUpRecommended: true,
  }),

  // Treatment Plan Created
  createBaseEvent('TREATMENT_PLAN_CREATED', 'care', {
    planId: uuidv4(),
    providerId: uuidv4(),
    specialtyName: 'Cardiologia',
    createdAt: TEST_TIMESTAMP,
    startDate: TEST_TIMESTAMP,
    endDate: new Date(Date.now() + 7776000000).toISOString(), // 90 days from now
    condition: 'Hypertension',
    goals: ['Blood pressure control', 'Lifestyle modifications'],
    medications: [uuidv4(), uuidv4()], // medication IDs
  }),
];

/**
 * Valid Plan Journey Events
 */
export const validPlanEvents: BaseEventMock[] = [
  // Claim Submitted
  createBaseEvent('CLAIM_SUBMITTED', 'plan', {
    claimId: uuidv4(),
    claimType: 'Consulta Médica',
    amount: 250.00,
    currency: 'BRL',
    serviceDate: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    submittedAt: TEST_TIMESTAMP,
    provider: 'Dr. Silva',
    documentCount: 2,
  }),

  // Claim Approved
  createBaseEvent('CLAIM_APPROVED', 'plan', {
    claimId: uuidv4(),
    claimType: 'Exame',
    amount: 350.00,
    approvedAmount: 300.00,
    currency: 'BRL',
    serviceDate: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
    submittedAt: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
    approvedAt: TEST_TIMESTAMP,
    reimbursementMethod: 'bank_transfer',
    estimatedPaymentDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
  }),

  // Claim Rejected
  createBaseEvent('CLAIM_REJECTED', 'plan', {
    claimId: uuidv4(),
    claimType: 'Terapia',
    amount: 150.00,
    currency: 'BRL',
    serviceDate: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
    submittedAt: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
    rejectedAt: TEST_TIMESTAMP,
    rejectionReason: 'missing_documentation',
    appealable: true,
  }),

  // Benefit Used
  createBaseEvent('BENEFIT_USED', 'plan', {
    benefitId: uuidv4(),
    benefitType: 'preventive_care',
    usedAt: TEST_TIMESTAMP,
    provider: 'Clínica Preventiva',
    location: 'São Paulo',
    value: 200.00,
    currency: 'BRL',
  }),

  // Plan Selected
  createBaseEvent('PLAN_SELECTED', 'plan', {
    planId: uuidv4(),
    planType: 'Premium',
    selectedAt: TEST_TIMESTAMP,
    startDate: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
    monthlyPremium: 850.00,
    currency: 'BRL',
    coverageLevel: 'comprehensive',
    familyMembers: 2,
  }),

  // Document Uploaded
  createBaseEvent('DOCUMENT_UPLOADED', 'plan', {
    documentId: uuidv4(),
    documentType: 'medical_receipt',
    uploadedAt: TEST_TIMESTAMP,
    fileName: 'receipt_2023_05_15.pdf',
    fileSize: 1250000, // bytes
    mimeType: 'application/pdf',
    relatedClaimId: uuidv4(),
  }),

  // Coverage Verified
  createBaseEvent('COVERAGE_VERIFIED', 'plan', {
    procedureCode: 'ABC123',
    procedureName: 'Annual physical examination',
    verifiedAt: TEST_TIMESTAMP,
    covered: true,
    copayAmount: 50.00,
    currency: 'BRL',
    coveragePercentage: 90,
    networkType: 'in_network',
    preAuthorizationRequired: false,
  }),
];

/**
 * Valid Gamification Events
 */
export const validGamificationEvents: BaseEventMock[] = [
  // Achievement Unlocked
  createBaseEvent('ACHIEVEMENT_UNLOCKED', 'gamification', {
    achievementId: uuidv4(),
    achievementName: 'health-check-streak',
    achievementTitle: 'Monitor de Saúde',
    level: 1,
    unlockedAt: TEST_TIMESTAMP,
    xpAwarded: 100,
    sourceJourney: 'health',
    icon: 'heart-pulse',
  }),

  // XP Awarded
  createBaseEvent('XP_AWARDED', 'gamification', {
    amount: 50,
    reason: 'daily_activity',
    awardedAt: TEST_TIMESTAMP,
    sourceJourney: 'health',
    sourceEvent: 'HEALTH_METRIC_RECORDED',
    currentTotal: 1250,
  }),

  // Level Up
  createBaseEvent('LEVEL_UP', 'gamification', {
    previousLevel: 2,
    newLevel: 3,
    xpTotal: 1500,
    leveledUpAt: TEST_TIMESTAMP,
    unlockedFeatures: ['premium_content'],
    unlockedRewards: [uuidv4()],
  }),

  // Quest Completed
  createBaseEvent('QUEST_COMPLETED', 'gamification', {
    questId: uuidv4(),
    questTitle: 'Semana Saudável',
    completedAt: TEST_TIMESTAMP,
    xpAwarded: 200,
    rewardsAwarded: [uuidv4()],
    sourceJourney: 'health',
  }),

  // Reward Redeemed
  createBaseEvent('REWARD_REDEEMED', 'gamification', {
    rewardId: uuidv4(),
    rewardTitle: 'Desconto em Consulta',
    redeemedAt: TEST_TIMESTAMP,
    pointsCost: 500,
    rewardType: 'discount',
    expiresAt: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
  }),
];

/**
 * All valid events combined
 */
export const allValidEvents: BaseEventMock[] = [
  ...validHealthEvents,
  ...validCareEvents,
  ...validPlanEvents,
  ...validGamificationEvents,
];

/**
 * Valid events with specific versions for testing version compatibility
 */
export const versionedEvents: Record<string, BaseEventMock[]> = {
  'v1.0.0': allValidEvents.map(event => ({ ...event, version: '1.0.0' })),
  'v1.1.0': allValidEvents.map(event => ({ ...event, version: '1.1.0' })),
  'v2.0.0': allValidEvents.map(event => ({
    ...event,
    version: '2.0.0',
    schemaVersion: 2,
    metadata: {
      correlationId: event.correlationId,
      source: `${event.journey}-journey`,
      timestamp: event.timestamp,
    },
  })),
};

/**
 * Default export for all valid events
 */
export default allValidEvents;