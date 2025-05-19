/**
 * Journey Data Fixture
 * 
 * This file provides sample journey-specific data for testing logging integration with the journey-centered architecture.
 * It contains journey identifiers, context objects, events, and metadata for the three core journeys (Health, Care, Plan).
 * 
 * This fixture is essential for verifying that the logging system properly handles journey-specific context
 * and provides appropriate journey-aware logging capabilities.
 */

import { JourneyType, LogContext, LogLevel } from '../../src/interfaces';
import { JOURNEY_IDS, JOURNEY_NAMES } from '../../../../shared/src/constants/journey.constants';

/**
 * Sample user IDs for testing
 */
export const SAMPLE_USER_IDS = {
  STANDARD: '550e8400-e29b-41d4-a716-446655440000',
  PREMIUM: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  NEW: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
};

/**
 * Sample request IDs for testing
 */
export const SAMPLE_REQUEST_IDS = {
  HEALTH_JOURNEY: 'health-req-7b23ec53-e83c-4b78-a877-49ab160c7bb0',
  CARE_JOURNEY: 'care-req-9c47ec12-a237-4b2a-b8e5-3f2a8a3d5c9b',
  PLAN_JOURNEY: 'plan-req-5e9f8a7b-6c2d-4e3f-9a1b-2c8d7e6f5a4b',
  CROSS_JOURNEY: 'cross-req-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
};

/**
 * Sample trace IDs for testing
 */
export const SAMPLE_TRACE_IDS = {
  HEALTH_JOURNEY: 'trace-health-8a7b6c5d-4e3f-2a1b-9c8d-7e6f5a4b3c2d',
  CARE_JOURNEY: 'trace-care-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  PLAN_JOURNEY: 'trace-plan-7b23ec53-e83c-4b78-a877-49ab160c7bb0',
  CROSS_JOURNEY: 'trace-cross-9c47ec12-a237-4b2a-b8e5-3f2a8a3d5c9b',
};

/**
 * Sample span IDs for testing
 */
export const SAMPLE_SPAN_IDS = {
  HEALTH_JOURNEY: 'span-health-1234567890',
  CARE_JOURNEY: 'span-care-0987654321',
  PLAN_JOURNEY: 'span-plan-1357924680',
  CROSS_JOURNEY: 'span-cross-2468013579',
};

/**
 * Sample correlation IDs for testing
 */
export const SAMPLE_CORRELATION_IDS = {
  HEALTH_JOURNEY: 'corr-health-a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  CARE_JOURNEY: 'corr-care-q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6',
  PLAN_JOURNEY: 'corr-plan-z1x2c3v4-b5n6-m7k8-j9h0-g1f2d3s4a5',
  CROSS_JOURNEY: 'corr-cross-1q2w3e4r-5t6y-7u8i-9o0p-a1s2d3f4g5',
};

/**
 * Health journey context objects for testing
 */
export const HEALTH_JOURNEY_CONTEXTS: Record<string, LogContext> = {
  METRICS_RECORDING: {
    journey: 'health',
    userId: SAMPLE_USER_IDS.STANDARD,
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.HEALTH_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.HEALTH_JOURNEY,
    spanId: SAMPLE_SPAN_IDS.HEALTH_JOURNEY,
    service: 'health-service',
    operation: 'recordMetric',
    metadata: {
      metricType: 'blood_pressure',
      deviceId: 'device-123456',
      value: '120/80',
      unit: 'mmHg',
      timestamp: new Date().toISOString(),
    },
  },
  GOAL_TRACKING: {
    journey: 'health',
    userId: SAMPLE_USER_IDS.PREMIUM,
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.HEALTH_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.HEALTH_JOURNEY,
    spanId: 'span-health-goal-tracking',
    service: 'health-service',
    operation: 'updateGoalProgress',
    metadata: {
      goalId: 'goal-789012',
      goalType: 'steps',
      targetValue: 10000,
      currentValue: 8500,
      progressPercentage: 85,
      startDate: '2023-01-01',
      endDate: '2023-01-31',
    },
  },
  DEVICE_SYNC: {
    journey: 'health',
    userId: SAMPLE_USER_IDS.STANDARD,
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.HEALTH_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.HEALTH_JOURNEY,
    spanId: 'span-health-device-sync',
    service: 'health-service',
    operation: 'syncDevice',
    metadata: {
      deviceId: 'device-123456',
      deviceType: 'smartwatch',
      manufacturer: 'FitBit',
      model: 'Versa 3',
      lastSyncTime: new Date().toISOString(),
      dataPoints: 42,
      syncDuration: 3.5, // seconds
    },
  },
  HEALTH_INSIGHT: {
    journey: 'health',
    userId: SAMPLE_USER_IDS.PREMIUM,
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.HEALTH_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.HEALTH_JOURNEY,
    spanId: 'span-health-insight',
    service: 'health-service',
    operation: 'generateInsight',
    metadata: {
      insightId: 'insight-345678',
      insightType: 'trend',
      metricType: 'heart_rate',
      timeRange: '30d',
      severity: 'info',
      generatedAt: new Date().toISOString(),
    },
  },
};

/**
 * Care journey context objects for testing
 */
export const CARE_JOURNEY_CONTEXTS: Record<string, LogContext> = {
  APPOINTMENT_BOOKING: {
    journey: 'care',
    userId: SAMPLE_USER_IDS.STANDARD,
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CARE_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.CARE_JOURNEY,
    spanId: SAMPLE_SPAN_IDS.CARE_JOURNEY,
    service: 'care-service',
    operation: 'bookAppointment',
    metadata: {
      appointmentId: 'appt-123456',
      providerId: 'provider-789012',
      specialtyId: 'specialty-345678',
      appointmentType: 'consultation',
      appointmentDate: '2023-02-15T14:30:00Z',
      appointmentDuration: 30, // minutes
      appointmentStatus: 'scheduled',
    },
  },
  MEDICATION_TRACKING: {
    journey: 'care',
    userId: SAMPLE_USER_IDS.PREMIUM,
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CARE_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.CARE_JOURNEY,
    spanId: 'span-care-medication',
    service: 'care-service',
    operation: 'recordMedicationAdherence',
    metadata: {
      medicationId: 'med-456789',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      frequency: 'daily',
      takenAt: new Date().toISOString(),
      adherenceStatus: 'taken',
      reminderSent: true,
    },
  },
  TELEMEDICINE_SESSION: {
    journey: 'care',
    userId: SAMPLE_USER_IDS.STANDARD,
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CARE_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.CARE_JOURNEY,
    spanId: 'span-care-telemedicine',
    service: 'care-service',
    operation: 'startTelemedicineSession',
    metadata: {
      sessionId: 'session-567890',
      appointmentId: 'appt-123456',
      providerId: 'provider-789012',
      startTime: new Date().toISOString(),
      platform: 'webrtc',
      deviceType: 'mobile',
      networkQuality: 'good',
    },
  },
  SYMPTOM_CHECK: {
    journey: 'care',
    userId: SAMPLE_USER_IDS.NEW,
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CARE_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.CARE_JOURNEY,
    spanId: 'span-care-symptom',
    service: 'care-service',
    operation: 'checkSymptoms',
    metadata: {
      checkId: 'check-678901',
      symptoms: ['headache', 'fever', 'fatigue'],
      severity: 'moderate',
      duration: '2d',
      recommendationType: 'appointment',
      urgency: 'medium',
    },
  },
};

/**
 * Plan journey context objects for testing
 */
export const PLAN_JOURNEY_CONTEXTS: Record<string, LogContext> = {
  CLAIM_SUBMISSION: {
    journey: 'plan',
    userId: SAMPLE_USER_IDS.STANDARD,
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.PLAN_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.PLAN_JOURNEY,
    spanId: SAMPLE_SPAN_IDS.PLAN_JOURNEY,
    service: 'plan-service',
    operation: 'submitClaim',
    metadata: {
      claimId: 'claim-123456',
      planId: 'plan-789012',
      claimType: 'medical',
      claimAmount: 250.75,
      serviceDate: '2023-01-20',
      providerName: 'Dr. Smith',
      providerNPI: '1234567890',
      submissionDate: new Date().toISOString(),
      attachmentCount: 2,
    },
  },
  BENEFIT_CHECK: {
    journey: 'plan',
    userId: SAMPLE_USER_IDS.PREMIUM,
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.PLAN_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.PLAN_JOURNEY,
    spanId: 'span-plan-benefit',
    service: 'plan-service',
    operation: 'checkBenefitCoverage',
    metadata: {
      benefitId: 'benefit-456789',
      planId: 'plan-789012',
      benefitType: 'prescription',
      coveragePercentage: 80,
      remainingDeductible: 500.00,
      outOfPocketMax: 2000.00,
      effectiveDate: '2023-01-01',
      expirationDate: '2023-12-31',
    },
  },
  PLAN_COMPARISON: {
    journey: 'plan',
    userId: SAMPLE_USER_IDS.NEW,
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.PLAN_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.PLAN_JOURNEY,
    spanId: 'span-plan-comparison',
    service: 'plan-service',
    operation: 'comparePlans',
    metadata: {
      comparisonId: 'comparison-567890',
      planIds: ['plan-789012', 'plan-345678', 'plan-901234'],
      comparisonCriteria: ['premium', 'deductible', 'coverage', 'network'],
      userPreferences: {
        maxPremium: 500,
        preferredProviders: ['provider-123456'],
        essentialBenefits: ['prescription', 'specialist'],
      },
      generatedAt: new Date().toISOString(),
    },
  },
  DOCUMENT_UPLOAD: {
    journey: 'plan',
    userId: SAMPLE_USER_IDS.STANDARD,
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.PLAN_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.PLAN_JOURNEY,
    spanId: 'span-plan-document',
    service: 'plan-service',
    operation: 'uploadDocument',
    metadata: {
      documentId: 'doc-678901',
      documentType: 'claim_receipt',
      claimId: 'claim-123456',
      fileName: 'receipt_2023-01-20.pdf',
      fileSize: 1024 * 1024 * 2.5, // 2.5 MB
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      storageLocation: 's3://austa-documents/claims/claim-123456/receipt_2023-01-20.pdf',
    },
  },
};

/**
 * Cross-journey context objects for testing
 */
export const CROSS_JOURNEY_CONTEXTS: Record<string, LogContext> = {
  HEALTH_TO_CARE_REFERRAL: {
    journey: 'health',
    userId: SAMPLE_USER_IDS.STANDARD,
    requestId: SAMPLE_REQUEST_IDS.CROSS_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CROSS_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.CROSS_JOURNEY,
    spanId: SAMPLE_SPAN_IDS.CROSS_JOURNEY,
    service: 'health-service',
    operation: 'referToCare',
    metadata: {
      sourceJourney: JOURNEY_IDS.HEALTH,
      targetJourney: JOURNEY_IDS.CARE,
      healthMetricId: 'metric-123456',
      metricType: 'blood_pressure',
      metricValue: '160/100',
      referralReason: 'elevated_blood_pressure',
      urgency: 'medium',
      recommendedAction: 'schedule_appointment',
      timestamp: new Date().toISOString(),
    },
  },
  CARE_TO_PLAN_CLAIM: {
    journey: 'care',
    userId: SAMPLE_USER_IDS.PREMIUM,
    requestId: SAMPLE_REQUEST_IDS.CROSS_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CROSS_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.CROSS_JOURNEY,
    spanId: 'span-cross-care-to-plan',
    service: 'care-service',
    operation: 'initiateClaim',
    metadata: {
      sourceJourney: JOURNEY_IDS.CARE,
      targetJourney: JOURNEY_IDS.PLAN,
      appointmentId: 'appt-123456',
      providerId: 'provider-789012',
      serviceDate: '2023-02-15',
      serviceCost: 150.00,
      serviceDescription: 'General consultation',
      diagnosisCodes: ['J00', 'R50.9'],
      timestamp: new Date().toISOString(),
    },
  },
  PLAN_TO_HEALTH_BENEFIT: {
    journey: 'plan',
    userId: SAMPLE_USER_IDS.STANDARD,
    requestId: SAMPLE_REQUEST_IDS.CROSS_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CROSS_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.CROSS_JOURNEY,
    spanId: 'span-cross-plan-to-health',
    service: 'plan-service',
    operation: 'activateHealthBenefit',
    metadata: {
      sourceJourney: JOURNEY_IDS.PLAN,
      targetJourney: JOURNEY_IDS.HEALTH,
      benefitId: 'benefit-456789',
      benefitType: 'wellness_program',
      benefitName: 'Fitness Tracker Discount',
      discountAmount: 50.00,
      eligibleDevices: ['FitBit', 'Apple Watch', 'Garmin'],
      activationDate: new Date().toISOString(),
      expirationDate: '2023-12-31',
    },
  },
  GAMIFICATION_ACHIEVEMENT: {
    journey: 'shared',
    userId: SAMPLE_USER_IDS.PREMIUM,
    requestId: SAMPLE_REQUEST_IDS.CROSS_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CROSS_JOURNEY,
    traceId: SAMPLE_TRACE_IDS.CROSS_JOURNEY,
    spanId: 'span-cross-gamification',
    service: 'gamification-engine',
    operation: 'unlockAchievement',
    metadata: {
      achievementId: 'achievement-123456',
      achievementName: 'Health Explorer',
      achievementDescription: 'Complete activities in all three journeys',
      journeysInvolved: [JOURNEY_IDS.HEALTH, JOURNEY_IDS.CARE, JOURNEY_IDS.PLAN],
      pointsAwarded: 500,
      unlockedAt: new Date().toISOString(),
      userLevel: 5,
      userTotalPoints: 2500,
    },
  },
};

/**
 * Sample journey events that trigger logging
 */
export const JOURNEY_EVENTS = {
  HEALTH: {
    METRIC_RECORDED: {
      eventType: 'health.metric.recorded',
      userId: SAMPLE_USER_IDS.STANDARD,
      journeyId: JOURNEY_IDS.HEALTH,
      timestamp: new Date().toISOString(),
      data: {
        metricId: 'metric-123456',
        metricType: 'blood_pressure',
        value: '120/80',
        unit: 'mmHg',
        deviceId: 'device-123456',
        recordedAt: new Date().toISOString(),
      },
    },
    GOAL_ACHIEVED: {
      eventType: 'health.goal.achieved',
      userId: SAMPLE_USER_IDS.PREMIUM,
      journeyId: JOURNEY_IDS.HEALTH,
      timestamp: new Date().toISOString(),
      data: {
        goalId: 'goal-789012',
        goalType: 'steps',
        targetValue: 10000,
        achievedValue: 10250,
        achievedAt: new Date().toISOString(),
        streakCount: 3,
      },
    },
    DEVICE_CONNECTED: {
      eventType: 'health.device.connected',
      userId: SAMPLE_USER_IDS.STANDARD,
      journeyId: JOURNEY_IDS.HEALTH,
      timestamp: new Date().toISOString(),
      data: {
        deviceId: 'device-123456',
        deviceType: 'smartwatch',
        manufacturer: 'FitBit',
        model: 'Versa 3',
        connectionMethod: 'bluetooth',
        connectedAt: new Date().toISOString(),
      },
    },
  },
  CARE: {
    APPOINTMENT_BOOKED: {
      eventType: 'care.appointment.booked',
      userId: SAMPLE_USER_IDS.STANDARD,
      journeyId: JOURNEY_IDS.CARE,
      timestamp: new Date().toISOString(),
      data: {
        appointmentId: 'appt-123456',
        providerId: 'provider-789012',
        specialtyId: 'specialty-345678',
        appointmentType: 'consultation',
        appointmentDate: '2023-02-15T14:30:00Z',
        appointmentDuration: 30, // minutes
        bookedAt: new Date().toISOString(),
      },
    },
    MEDICATION_TAKEN: {
      eventType: 'care.medication.taken',
      userId: SAMPLE_USER_IDS.PREMIUM,
      journeyId: JOURNEY_IDS.CARE,
      timestamp: new Date().toISOString(),
      data: {
        medicationId: 'med-456789',
        medicationName: 'Lisinopril',
        dosage: '10mg',
        takenAt: new Date().toISOString(),
        scheduledFor: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        adherenceStatus: 'on_time',
      },
    },
    TELEMEDICINE_COMPLETED: {
      eventType: 'care.telemedicine.completed',
      userId: SAMPLE_USER_IDS.STANDARD,
      journeyId: JOURNEY_IDS.CARE,
      timestamp: new Date().toISOString(),
      data: {
        sessionId: 'session-567890',
        appointmentId: 'appt-123456',
        providerId: 'provider-789012',
        startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        endTime: new Date().toISOString(),
        duration: 30, // minutes
        quality: 'good',
        followUpRecommended: true,
      },
    },
  },
  PLAN: {
    CLAIM_SUBMITTED: {
      eventType: 'plan.claim.submitted',
      userId: SAMPLE_USER_IDS.STANDARD,
      journeyId: JOURNEY_IDS.PLAN,
      timestamp: new Date().toISOString(),
      data: {
        claimId: 'claim-123456',
        planId: 'plan-789012',
        claimType: 'medical',
        claimAmount: 250.75,
        serviceDate: '2023-01-20',
        providerName: 'Dr. Smith',
        submittedAt: new Date().toISOString(),
        attachmentIds: ['doc-678901', 'doc-678902'],
      },
    },
    BENEFIT_USED: {
      eventType: 'plan.benefit.used',
      userId: SAMPLE_USER_IDS.PREMIUM,
      journeyId: JOURNEY_IDS.PLAN,
      timestamp: new Date().toISOString(),
      data: {
        benefitId: 'benefit-456789',
        planId: 'plan-789012',
        benefitType: 'prescription',
        usageAmount: 75.50,
        coverageAmount: 60.40,
        outOfPocketAmount: 15.10,
        usedAt: new Date().toISOString(),
        transactionId: 'tx-123456',
      },
    },
    PLAN_SELECTED: {
      eventType: 'plan.plan.selected',
      userId: SAMPLE_USER_IDS.NEW,
      journeyId: JOURNEY_IDS.PLAN,
      timestamp: new Date().toISOString(),
      data: {
        planId: 'plan-789012',
        planName: 'Premium Health Plus',
        planType: 'PPO',
        premium: 450.00,
        deductible: 1000.00,
        outOfPocketMax: 5000.00,
        coverageStartDate: '2023-03-01',
        coverageEndDate: '2024-02-29',
        selectedAt: new Date().toISOString(),
      },
    },
  },
  CROSS_JOURNEY: {
    ACHIEVEMENT_UNLOCKED: {
      eventType: 'gamification.achievement.unlocked',
      userId: SAMPLE_USER_IDS.PREMIUM,
      journeyId: 'cross_journey',
      timestamp: new Date().toISOString(),
      data: {
        achievementId: 'achievement-123456',
        achievementName: 'Health Explorer',
        achievementDescription: 'Complete activities in all three journeys',
        journeysInvolved: [JOURNEY_IDS.HEALTH, JOURNEY_IDS.CARE, JOURNEY_IDS.PLAN],
        pointsAwarded: 500,
        unlockedAt: new Date().toISOString(),
        userLevel: 5,
        userTotalPoints: 2500,
      },
    },
    CROSS_JOURNEY_REFERRAL: {
      eventType: 'journey.referral.created',
      userId: SAMPLE_USER_IDS.STANDARD,
      journeyId: 'cross_journey',
      timestamp: new Date().toISOString(),
      data: {
        referralId: 'referral-123456',
        sourceJourney: JOURNEY_IDS.HEALTH,
        targetJourney: JOURNEY_IDS.CARE,
        referralReason: 'elevated_blood_pressure',
        urgency: 'medium',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
      },
    },
  },
};

/**
 * Sample journey metadata for testing
 */
export const JOURNEY_METADATA = {
  [JOURNEY_IDS.HEALTH]: {
    journeyName: JOURNEY_NAMES.HEALTH,
    metrics: ['steps', 'heart_rate', 'blood_pressure', 'weight', 'sleep', 'blood_glucose'],
    goals: ['daily_steps', 'weight_loss', 'sleep_improvement', 'blood_pressure_management'],
    devices: ['smartwatch', 'scale', 'blood_pressure_monitor', 'glucose_meter'],
    insights: ['trend', 'anomaly', 'recommendation', 'achievement'],
  },
  [JOURNEY_IDS.CARE]: {
    journeyName: JOURNEY_NAMES.CARE,
    appointmentTypes: ['consultation', 'follow_up', 'specialist', 'emergency', 'annual_checkup'],
    medicationCategories: ['prescription', 'over_the_counter', 'supplement'],
    providerSpecialties: ['general_practice', 'cardiology', 'dermatology', 'orthopedics', 'pediatrics'],
    telemedicineOptions: ['video', 'audio', 'chat'],
  },
  [JOURNEY_IDS.PLAN]: {
    journeyName: JOURNEY_NAMES.PLAN,
    planTypes: ['HMO', 'PPO', 'EPO', 'POS', 'HDHP'],
    claimCategories: ['medical', 'dental', 'vision', 'pharmacy', 'wellness'],
    benefitTypes: ['preventive_care', 'specialist_visit', 'emergency', 'hospitalization', 'prescription', 'wellness_program'],
    documentTypes: ['insurance_card', 'claim_receipt', 'explanation_of_benefits', 'referral', 'prior_authorization'],
  },
};

/**
 * Sample business transaction tracking data for testing
 */
export const BUSINESS_TRANSACTIONS = {
  APPOINTMENT_BOOKING_FLOW: [
    {
      step: 'initiate_booking',
      journey: 'care',
      service: 'care-service',
      operation: 'searchProviders',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      level: LogLevel.INFO,
      message: 'User initiated appointment booking flow',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
        correlationId: 'tx-appointment-booking-123456',
      },
    },
    {
      step: 'select_provider',
      journey: 'care',
      service: 'care-service',
      operation: 'getProviderDetails',
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), // 4 minutes ago
      level: LogLevel.INFO,
      message: 'User selected healthcare provider',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
        correlationId: 'tx-appointment-booking-123456',
        metadata: {
          providerId: 'provider-789012',
          specialtyId: 'specialty-345678',
        },
      },
    },
    {
      step: 'select_timeslot',
      journey: 'care',
      service: 'care-service',
      operation: 'getAvailableTimeslots',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
      level: LogLevel.INFO,
      message: 'User selected appointment timeslot',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
        correlationId: 'tx-appointment-booking-123456',
        metadata: {
          providerId: 'provider-789012',
          appointmentDate: '2023-02-15T14:30:00Z',
          appointmentDuration: 30,
        },
      },
    },
    {
      step: 'confirm_appointment',
      journey: 'care',
      service: 'care-service',
      operation: 'bookAppointment',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
      level: LogLevel.INFO,
      message: 'User confirmed appointment booking',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
        correlationId: 'tx-appointment-booking-123456',
        metadata: {
          appointmentId: 'appt-123456',
          providerId: 'provider-789012',
          appointmentDate: '2023-02-15T14:30:00Z',
          appointmentStatus: 'scheduled',
        },
      },
    },
    {
      step: 'check_insurance',
      journey: 'plan',
      service: 'plan-service',
      operation: 'verifyProviderCoverage',
      timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(), // 1 minute ago
      level: LogLevel.INFO,
      message: 'System verified insurance coverage for appointment',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
        correlationId: 'tx-appointment-booking-123456',
        metadata: {
          appointmentId: 'appt-123456',
          planId: 'plan-789012',
          providerId: 'provider-789012',
          coverageStatus: 'covered',
          copayAmount: 25.00,
        },
      },
    },
    {
      step: 'send_notification',
      journey: 'care',
      service: 'notification-service',
      operation: 'sendAppointmentConfirmation',
      timestamp: new Date().toISOString(), // now
      level: LogLevel.INFO,
      message: 'Appointment confirmation notification sent',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
        correlationId: 'tx-appointment-booking-123456',
        metadata: {
          appointmentId: 'appt-123456',
          notificationType: 'appointment_confirmation',
          channels: ['push', 'email'],
          deliveryStatus: 'sent',
        },
      },
    },
  ],
  CLAIM_SUBMISSION_FLOW: [
    {
      step: 'initiate_claim',
      journey: 'plan',
      service: 'plan-service',
      operation: 'initiateClaim',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
      level: LogLevel.INFO,
      message: 'User initiated claim submission flow',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
        correlationId: 'tx-claim-submission-123456',
      },
    },
    {
      step: 'select_claim_type',
      journey: 'plan',
      service: 'plan-service',
      operation: 'getClaimTypes',
      timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(), // 9 minutes ago
      level: LogLevel.INFO,
      message: 'User selected claim type',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
        correlationId: 'tx-claim-submission-123456',
        metadata: {
          claimType: 'medical',
          planId: 'plan-789012',
        },
      },
    },
    {
      step: 'enter_claim_details',
      journey: 'plan',
      service: 'plan-service',
      operation: 'validateClaimDetails',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 minutes ago
      level: LogLevel.INFO,
      message: 'User entered claim details',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
        correlationId: 'tx-claim-submission-123456',
        metadata: {
          claimAmount: 250.75,
          serviceDate: '2023-01-20',
          providerName: 'Dr. Smith',
          providerNPI: '1234567890',
          diagnosisCodes: ['J00', 'R50.9'],
        },
      },
    },
    {
      step: 'upload_documents',
      journey: 'plan',
      service: 'plan-service',
      operation: 'uploadClaimDocuments',
      timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(), // 7 minutes ago
      level: LogLevel.INFO,
      message: 'User uploaded claim documents',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
        correlationId: 'tx-claim-submission-123456',
        metadata: {
          documentIds: ['doc-678901', 'doc-678902'],
          documentTypes: ['claim_receipt', 'medical_report'],
          totalSize: 1024 * 1024 * 3.5, // 3.5 MB
        },
      },
    },
    {
      step: 'submit_claim',
      journey: 'plan',
      service: 'plan-service',
      operation: 'submitClaim',
      timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(), // 6 minutes ago
      level: LogLevel.INFO,
      message: 'User submitted claim',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
        correlationId: 'tx-claim-submission-123456',
        metadata: {
          claimId: 'claim-123456',
          submissionStatus: 'submitted',
          submissionTimestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
        },
      },
    },
    {
      step: 'process_claim',
      journey: 'plan',
      service: 'plan-service',
      operation: 'processClaimSubmission',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      level: LogLevel.INFO,
      message: 'System processed claim submission',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
        correlationId: 'tx-claim-submission-123456',
        metadata: {
          claimId: 'claim-123456',
          processingStatus: 'processing',
          estimatedCompletionTime: '2-3 business days',
        },
      },
    },
    {
      step: 'send_confirmation',
      journey: 'plan',
      service: 'notification-service',
      operation: 'sendClaimConfirmation',
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), // 4 minutes ago
      level: LogLevel.INFO,
      message: 'Claim submission confirmation sent',
      context: {
        userId: SAMPLE_USER_IDS.STANDARD,
        requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
        correlationId: 'tx-claim-submission-123456',
        metadata: {
          claimId: 'claim-123456',
          notificationType: 'claim_confirmation',
          channels: ['push', 'email'],
          deliveryStatus: 'sent',
        },
      },
    },
  ],
};

/**
 * Comprehensive journey data fixture for testing
 */
export const JOURNEY_DATA_FIXTURE = {
  JOURNEY_IDS,
  JOURNEY_NAMES,
  SAMPLE_USER_IDS,
  SAMPLE_REQUEST_IDS,
  SAMPLE_TRACE_IDS,
  SAMPLE_SPAN_IDS,
  SAMPLE_CORRELATION_IDS,
  HEALTH_JOURNEY_CONTEXTS,
  CARE_JOURNEY_CONTEXTS,
  PLAN_JOURNEY_CONTEXTS,
  CROSS_JOURNEY_CONTEXTS,
  JOURNEY_EVENTS,
  JOURNEY_METADATA,
  BUSINESS_TRANSACTIONS,
};

export default JOURNEY_DATA_FIXTURE;