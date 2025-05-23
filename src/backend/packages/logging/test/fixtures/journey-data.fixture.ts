/**
 * Journey Data Fixtures
 * 
 * This file provides sample journey-specific data for testing logging integration
 * with the journey-centered architecture of the AUSTA SuperApp.
 * 
 * It contains journey identifiers, context objects, events, and metadata for the
 * three core journeys (Health, Care, Plan) to verify that the logging system
 * properly handles journey-specific context.
 */

import { JourneyContext, JourneyType, LogEntry } from '../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { JOURNEY_IDS, JOURNEY_NAMES } from '../../../shared/src/constants/journey.constants';

// Sample User IDs for testing
export const SAMPLE_USER_IDS = {
  STANDARD: '550e8400-e29b-41d4-a716-446655440000',
  PREMIUM: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  ADMIN: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
};

// Sample Request IDs for testing
export const SAMPLE_REQUEST_IDS = {
  HEALTH_JOURNEY: 'health-req-7b23ec53-e83c-4ebb-a2ad-7c6d3e3c51b2',
  CARE_JOURNEY: 'care-req-9a4f5beb-c4b1-4b4b-8a3e-3c5c9e1f8a7b',
  PLAN_JOURNEY: 'plan-req-2c3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a',
  CROSS_JOURNEY: 'cross-req-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
};

// Sample Session IDs for testing
export const SAMPLE_SESSION_IDS = {
  WEB_SESSION: 'web-session-5f9a4b3c-2e1d-4c8b-9a7f-6b5c4d3e2f1a',
  MOBILE_SESSION: 'mobile-session-3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d',
  TABLET_SESSION: 'tablet-session-9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
};

// Sample Trace IDs for testing distributed tracing
export const SAMPLE_TRACE_IDS = {
  HEALTH_TRACE: 'health-trace-8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
  CARE_TRACE: 'care-trace-2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
  PLAN_TRACE: 'plan-trace-7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
  CROSS_JOURNEY_TRACE: 'cross-trace-4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
};

// Sample Span IDs for testing distributed tracing
export const SAMPLE_SPAN_IDS = {
  HEALTH_SPAN: 'health-span-1a2b3c4d5e6f7a8b',
  CARE_SPAN: 'care-span-9a8b7c6d5e4f3a2b',
  PLAN_SPAN: 'plan-span-5f6a7b8c9d0e1f2a',
  CROSS_JOURNEY_SPAN: 'cross-span-3c4d5e6f7a8b9c0d',
};

/**
 * Sample Health Journey Context
 * 
 * Provides context objects for the Health journey ("Minha Saúde") with various
 * resource types and actions for testing logging in health-related scenarios.
 */
export const HEALTH_JOURNEY_CONTEXTS: Record<string, JourneyContext> = {
  // Health metrics recording context
  RECORD_METRICS: {
    type: JourneyType.HEALTH,
    resourceId: 'health-metric-7b23ec53',
    action: 'record_metrics',
    data: {
      metricType: 'blood_pressure',
      systolic: 120,
      diastolic: 80,
      heartRate: 72,
      recordedAt: new Date().toISOString(),
      deviceId: 'device-123456',
    },
  },
  
  // Health goal tracking context
  GOAL_PROGRESS: {
    type: JourneyType.HEALTH,
    resourceId: 'health-goal-9a4f5beb',
    action: 'update_goal_progress',
    data: {
      goalType: 'steps',
      target: 10000,
      current: 7500,
      progressPercentage: 75,
      startDate: '2023-01-01',
      endDate: '2023-01-31',
    },
  },
  
  // Device connection context
  DEVICE_CONNECTION: {
    type: JourneyType.HEALTH,
    resourceId: 'device-conn-2c3e4f5a',
    action: 'connect_device',
    data: {
      deviceType: 'smartwatch',
      manufacturer: 'Garmin',
      model: 'Forerunner 245',
      connectionMethod: 'bluetooth',
      authStatus: 'authorized',
    },
  },
  
  // Medical record access context
  MEDICAL_RECORD: {
    type: JourneyType.HEALTH,
    resourceId: 'med-record-1a2b3c4d',
    action: 'view_medical_record',
    data: {
      recordType: 'lab_result',
      providerId: 'provider-5678',
      recordDate: '2023-02-15',
      accessReason: 'patient_requested',
      sensitivityLevel: 'high',
    },
  },
};

/**
 * Sample Care Journey Context
 * 
 * Provides context objects for the Care journey ("Cuidar-me Agora") with various
 * resource types and actions for testing logging in care-related scenarios.
 */
export const CARE_JOURNEY_CONTEXTS: Record<string, JourneyContext> = {
  // Appointment booking context
  BOOK_APPOINTMENT: {
    type: JourneyType.CARE,
    resourceId: 'appointment-5f9a4b3c',
    action: 'book_appointment',
    data: {
      specialtyId: 'cardiology',
      providerId: 'provider-9876',
      appointmentDate: '2023-03-15T14:30:00Z',
      appointmentType: 'in_person',
      locationId: 'clinic-456',
      insurancePlanId: 'plan-789',
    },
  },
  
  // Telemedicine session context
  TELEMEDICINE_SESSION: {
    type: JourneyType.CARE,
    resourceId: 'telemedicine-3a4b5c6d',
    action: 'join_telemedicine_session',
    data: {
      providerId: 'provider-5432',
      sessionStartTime: new Date().toISOString(),
      connectionType: 'webrtc',
      deviceType: 'mobile',
      networkQuality: 'good',
      appointmentId: 'appointment-5f9a4b3c',
    },
  },
  
  // Medication tracking context
  MEDICATION_ADHERENCE: {
    type: JourneyType.CARE,
    resourceId: 'medication-9a8b7c6d',
    action: 'record_medication_intake',
    data: {
      medicationId: 'med-12345',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: '2023-03-10T08:00:00Z',
      actualTime: '2023-03-10T08:15:00Z',
      adherenceStatus: 'taken_late',
    },
  },
  
  // Symptom checker context
  SYMPTOM_CHECK: {
    type: JourneyType.CARE,
    resourceId: 'symptom-check-7c8d9e0f',
    action: 'check_symptoms',
    data: {
      primarySymptom: 'headache',
      secondarySymptoms: ['nausea', 'sensitivity_to_light'],
      symptomSeverity: 'moderate',
      symptomDuration: '3_days',
      previousOccurrence: true,
      recommendationId: 'rec-789',
    },
  },
};

/**
 * Sample Plan Journey Context
 * 
 * Provides context objects for the Plan journey ("Meu Plano & Benefícios") with various
 * resource types and actions for testing logging in insurance-related scenarios.
 */
export const PLAN_JOURNEY_CONTEXTS: Record<string, JourneyContext> = {
  // Insurance claim submission context
  SUBMIT_CLAIM: {
    type: JourneyType.PLAN,
    resourceId: 'claim-4d5e6f7a',
    action: 'submit_claim',
    data: {
      claimType: 'medical_consultation',
      providerId: 'provider-1234',
      serviceDate: '2023-02-20',
      claimAmount: 150.00,
      receiptId: 'receipt-567',
      coverageId: 'coverage-890',
      documentIds: ['doc-123', 'doc-456'],
    },
  },
  
  // Coverage verification context
  VERIFY_COVERAGE: {
    type: JourneyType.PLAN,
    resourceId: 'coverage-check-8a7b6c5d',
    action: 'verify_coverage',
    data: {
      procedureCode: 'PROC12345',
      specialtyId: 'orthopedics',
      providerId: 'provider-6789',
      estimatedCost: 350.00,
      coveragePercentage: 80,
      patientResponsibility: 70.00,
      preAuthorizationRequired: true,
    },
  },
  
  // Benefit usage context
  BENEFIT_USAGE: {
    type: JourneyType.PLAN,
    resourceId: 'benefit-usage-2a3b4c5d',
    action: 'check_benefit_usage',
    data: {
      benefitType: 'physical_therapy',
      totalAllowed: 20,
      used: 12,
      remaining: 8,
      periodStart: '2023-01-01',
      periodEnd: '2023-12-31',
      nextEligibleDate: '2023-03-15',
    },
  },
  
  // Plan comparison context
  PLAN_COMPARISON: {
    type: JourneyType.PLAN,
    resourceId: 'plan-compare-7c9e6679',
    action: 'compare_plans',
    data: {
      currentPlanId: 'plan-123',
      comparedPlanIds: ['plan-456', 'plan-789'],
      comparisonCriteria: ['premium', 'deductible', 'coverage', 'network'],
      userProfile: 'family_with_children',
      recommendedPlanId: 'plan-456',
    },
  },
};

/**
 * Sample Cross-Journey Correlation
 * 
 * Provides examples of related contexts across different journeys to test
 * cross-journey correlation in logging.
 */
export const CROSS_JOURNEY_CORRELATION = {
  // Health to Care journey correlation (health metric leads to appointment)
  HEALTH_TO_CARE: {
    healthContext: HEALTH_JOURNEY_CONTEXTS.RECORD_METRICS,
    careContext: CARE_JOURNEY_CONTEXTS.BOOK_APPOINTMENT,
    correlationId: 'corr-health-care-1a2b3c4d',
    metadata: {
      flowType: 'abnormal_metric_to_appointment',
      triggerValue: 'high_blood_pressure',
      urgencyLevel: 'medium',
      automatedRecommendation: true,
    },
  },
  
  // Care to Plan journey correlation (appointment leads to claim)
  CARE_TO_PLAN: {
    careContext: CARE_JOURNEY_CONTEXTS.BOOK_APPOINTMENT,
    planContext: PLAN_JOURNEY_CONTEXTS.SUBMIT_CLAIM,
    correlationId: 'corr-care-plan-5e6f7a8b',
    metadata: {
      flowType: 'appointment_to_claim',
      automatedSubmission: false,
      claimStatus: 'pending',
      appointmentCompleted: true,
    },
  },
  
  // Plan to Health journey correlation (benefit usage impacts health goal)
  PLAN_TO_HEALTH: {
    planContext: PLAN_JOURNEY_CONTEXTS.BENEFIT_USAGE,
    healthContext: HEALTH_JOURNEY_CONTEXTS.GOAL_PROGRESS,
    correlationId: 'corr-plan-health-9c0d1e2f',
    metadata: {
      flowType: 'benefit_usage_to_health_goal',
      benefitCategory: 'wellness',
      impactType: 'positive',
      goalAdjustment: 'increased_target',
    },
  },
  
  // Full journey cycle (health → care → plan → health)
  FULL_JOURNEY_CYCLE: {
    healthInitialContext: HEALTH_JOURNEY_CONTEXTS.RECORD_METRICS,
    careContext: CARE_JOURNEY_CONTEXTS.TELEMEDICINE_SESSION,
    planContext: PLAN_JOURNEY_CONTEXTS.SUBMIT_CLAIM,
    healthFollowupContext: HEALTH_JOURNEY_CONTEXTS.GOAL_PROGRESS,
    correlationId: 'corr-full-cycle-3a4b5c6d',
    metadata: {
      flowType: 'complete_care_cycle',
      cycleStartTime: '2023-03-10T08:00:00Z',
      cycleEndTime: '2023-03-15T16:00:00Z',
      touchpoints: 4,
      outcome: 'improved_health_metric',
    },
  },
};

/**
 * Sample Journey Events
 * 
 * Provides sample events that would trigger logging in each journey.
 * These events represent typical user actions or system events within each journey.
 */
export const JOURNEY_EVENTS = {
  HEALTH: {
    // User records a new health metric
    METRIC_RECORDED: {
      eventType: 'health.metric.recorded',
      journeyType: JourneyType.HEALTH,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.STANDARD,
      data: {
        metricType: 'blood_glucose',
        value: 110,
        unit: 'mg/dL',
        recordedAt: new Date().toISOString(),
        source: 'manual_entry',
      },
    },
    
    // User achieves a health goal
    GOAL_ACHIEVED: {
      eventType: 'health.goal.achieved',
      journeyType: JourneyType.HEALTH,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.STANDARD,
      data: {
        goalId: 'goal-12345',
        goalType: 'weight_loss',
        targetValue: 75,
        achievedValue: 74.8,
        startDate: '2023-01-01',
        achievedDate: new Date().toISOString(),
        daysToAchieve: 68,
      },
    },
    
    // System generates a health insight
    INSIGHT_GENERATED: {
      eventType: 'health.insight.generated',
      journeyType: JourneyType.HEALTH,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.STANDARD,
      data: {
        insightId: 'insight-789',
        insightType: 'trend_detection',
        metricType: 'blood_pressure',
        trend: 'decreasing',
        significance: 'positive',
        recommendationId: 'rec-456',
        generatedBy: 'algorithm',
      },
    },
  },
  
  CARE: {
    // User books a new appointment
    APPOINTMENT_BOOKED: {
      eventType: 'care.appointment.booked',
      journeyType: JourneyType.CARE,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.PREMIUM,
      data: {
        appointmentId: 'appt-12345',
        providerId: 'provider-789',
        specialtyId: 'dermatology',
        appointmentType: 'video_consultation',
        scheduledTime: '2023-04-15T10:30:00Z',
        bookingChannel: 'mobile_app',
      },
    },
    
    // User completes a telemedicine session
    TELEMEDICINE_COMPLETED: {
      eventType: 'care.telemedicine.completed',
      journeyType: JourneyType.CARE,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.PREMIUM,
      data: {
        sessionId: 'session-456',
        appointmentId: 'appt-12345',
        providerId: 'provider-789',
        duration: 1800, // seconds
        startTime: '2023-04-15T10:30:00Z',
        endTime: '2023-04-15T11:00:00Z',
        connectionQuality: 'excellent',
        prescriptionIssued: true,
      },
    },
    
    // System sends a medication reminder
    MEDICATION_REMINDER: {
      eventType: 'care.medication.reminder',
      journeyType: JourneyType.CARE,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.STANDARD,
      data: {
        medicationId: 'med-789',
        medicationName: 'Metformin',
        dosage: '500mg',
        scheduledTime: '2023-03-15T20:00:00Z',
        reminderChannel: 'push_notification',
        reminderSequence: 1,
        previousAdherence: 0.92, // 92% adherence rate
      },
    },
  },
  
  PLAN: {
    // User submits an insurance claim
    CLAIM_SUBMITTED: {
      eventType: 'plan.claim.submitted',
      journeyType: JourneyType.PLAN,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.STANDARD,
      data: {
        claimId: 'claim-12345',
        claimType: 'medical_procedure',
        providerId: 'provider-456',
        serviceDate: '2023-03-10',
        submissionDate: new Date().toISOString(),
        claimAmount: 250.00,
        attachmentCount: 2,
        submissionChannel: 'mobile_app',
      },
    },
    
    // System updates claim status
    CLAIM_STATUS_UPDATED: {
      eventType: 'plan.claim.status_updated',
      journeyType: JourneyType.PLAN,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.STANDARD,
      data: {
        claimId: 'claim-12345',
        previousStatus: 'under_review',
        newStatus: 'approved',
        updateTime: new Date().toISOString(),
        approvedAmount: 200.00,
        patientResponsibility: 50.00,
        processingDuration: 48, // hours
        paymentEstimatedDate: '2023-03-25',
      },
    },
    
    // User views benefit details
    BENEFIT_VIEWED: {
      eventType: 'plan.benefit.viewed',
      journeyType: JourneyType.PLAN,
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.PREMIUM,
      data: {
        benefitId: 'benefit-789',
        benefitType: 'preventive_care',
        benefitCategory: 'wellness',
        viewDuration: 45, // seconds
        viewChannel: 'web_app',
        detailLevel: 'comprehensive',
        relatedBenefitsViewed: ['benefit-790', 'benefit-791'],
      },
    },
  },
  
  // Cross-journey events (typically for gamification)
  CROSS_JOURNEY: {
    // User earns points for completing actions across journeys
    POINTS_EARNED: {
      eventType: 'gamification.points.earned',
      journeyType: null, // Cross-journey event
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.STANDARD,
      data: {
        pointsEarned: 50,
        activityType: 'cross_journey_completion',
        journeysInvolved: [JourneyType.HEALTH, JourneyType.CARE],
        triggeringEvents: ['health.metric.recorded', 'care.appointment.booked'],
        currentPointsBalance: 1250,
        achievementUnlocked: 'health_conscious',
      },
    },
    
    // User completes a quest involving multiple journeys
    QUEST_COMPLETED: {
      eventType: 'gamification.quest.completed',
      journeyType: null, // Cross-journey event
      timestamp: new Date().toISOString(),
      userId: SAMPLE_USER_IDS.PREMIUM,
      data: {
        questId: 'quest-456',
        questName: 'Holistic Health Manager',
        journeysInvolved: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
        tasksCompleted: 5,
        totalTasks: 5,
        completionTime: '2023-03-15T14:30:00Z',
        rewardId: 'reward-789',
        rewardType: 'premium_discount',
      },
    },
  },
};

/**
 * Sample Journey Metadata
 * 
 * Provides additional metadata structures for each journey to enrich log entries
 * with journey-specific information.
 */
export const JOURNEY_METADATA = {
  HEALTH: {
    journeyId: JOURNEY_IDS.HEALTH,
    journeyName: JOURNEY_NAMES.HEALTH,
    metrics: ['steps', 'heart_rate', 'blood_pressure', 'blood_glucose', 'weight', 'sleep'],
    goals: ['daily_steps', 'weight_management', 'blood_pressure_control', 'sleep_improvement'],
    devices: ['smartwatch', 'blood_pressure_monitor', 'glucose_meter', 'scale', 'sleep_tracker'],
    insights: ['trend_detection', 'anomaly_detection', 'correlation_analysis', 'recommendation'],
  },
  
  CARE: {
    journeyId: JOURNEY_IDS.CARE,
    journeyName: JOURNEY_NAMES.CARE,
    appointmentTypes: ['in_person', 'video_consultation', 'phone_call', 'home_visit'],
    specialties: ['general_practice', 'cardiology', 'dermatology', 'orthopedics', 'pediatrics'],
    medicationCategories: ['prescription', 'over_the_counter', 'supplement', 'vaccine'],
    symptomCategories: ['respiratory', 'digestive', 'musculoskeletal', 'neurological', 'dermatological'],
  },
  
  PLAN: {
    journeyId: JOURNEY_IDS.PLAN,
    journeyName: JOURNEY_NAMES.PLAN,
    claimTypes: ['medical_consultation', 'medical_procedure', 'medication', 'laboratory', 'imaging'],
    benefitCategories: ['preventive_care', 'specialist_care', 'emergency', 'hospitalization', 'medication'],
    coverageTypes: ['basic', 'standard', 'premium', 'family', 'senior'],
    documentTypes: ['receipt', 'medical_report', 'prescription', 'referral', 'authorization'],
  },
};

/**
 * Sample Log Entries with Journey Context
 * 
 * Provides complete log entry examples with journey context for testing the logging system.
 * These entries demonstrate how journey context is integrated into log entries.
 */
export const SAMPLE_LOG_ENTRIES: LogEntry[] = [
  // Health journey log entry
  {
    message: 'Health metric recorded successfully',
    level: LogLevel.INFO,
    timestamp: new Date(),
    serviceName: 'health-service',
    context: 'MetricsController',
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.HEALTH_TRACE,
    spanId: SAMPLE_SPAN_IDS.HEALTH_SPAN,
    journey: HEALTH_JOURNEY_CONTEXTS.RECORD_METRICS,
    metadata: {
      metricType: 'blood_pressure',
      deviceType: 'bluetooth_monitor',
      processingTime: 120, // ms
    },
  },
  
  // Care journey log entry
  {
    message: 'Appointment booked successfully',
    level: LogLevel.INFO,
    timestamp: new Date(),
    serviceName: 'care-service',
    context: 'AppointmentController',
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    userId: SAMPLE_USER_IDS.PREMIUM,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.CARE_TRACE,
    spanId: SAMPLE_SPAN_IDS.CARE_SPAN,
    journey: CARE_JOURNEY_CONTEXTS.BOOK_APPOINTMENT,
    metadata: {
      providerAvailability: 'confirmed',
      slotReservationId: 'slot-12345',
      processingTime: 350, // ms
    },
  },
  
  // Plan journey log entry
  {
    message: 'Claim submitted successfully',
    level: LogLevel.INFO,
    timestamp: new Date(),
    serviceName: 'plan-service',
    context: 'ClaimController',
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.PLAN_TRACE,
    spanId: SAMPLE_SPAN_IDS.PLAN_SPAN,
    journey: PLAN_JOURNEY_CONTEXTS.SUBMIT_CLAIM,
    metadata: {
      validationPassed: true,
      documentUploadStatus: 'complete',
      processingTime: 450, // ms
    },
  },
  
  // Cross-journey log entry
  {
    message: 'Cross-journey event processed',
    level: LogLevel.INFO,
    timestamp: new Date(),
    serviceName: 'gamification-engine',
    context: 'EventProcessor',
    requestId: SAMPLE_REQUEST_IDS.CROSS_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.CROSS_JOURNEY_TRACE,
    spanId: SAMPLE_SPAN_IDS.CROSS_JOURNEY_SPAN,
    journey: null, // Cross-journey event doesn't have a specific journey
    metadata: {
      eventType: 'gamification.points.earned',
      journeysInvolved: [JourneyType.HEALTH, JourneyType.CARE],
      correlationId: CROSS_JOURNEY_CORRELATION.HEALTH_TO_CARE.correlationId,
      processingTime: 200, // ms
    },
  },
  
  // Error log entry with journey context
  {
    message: 'Failed to process health metric',
    level: LogLevel.ERROR,
    timestamp: new Date(),
    serviceName: 'health-service',
    context: 'MetricsService',
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.HEALTH_TRACE,
    spanId: 'health-span-error-1a2b3c4d',
    journey: HEALTH_JOURNEY_CONTEXTS.RECORD_METRICS,
    error: {
      message: 'Invalid metric value',
      name: 'ValidationError',
      code: 'INVALID_METRIC_VALUE',
      stack: 'Error: Invalid metric value\n    at validateMetric (/src/services/metrics.service.ts:45:23)\n    at processMetric (/src/services/metrics.service.ts:72:19)',
      isClientError: true,
    },
    metadata: {
      metricType: 'blood_pressure',
      invalidValue: { systolic: 300, diastolic: 200 }, // Clearly invalid values
      validationRules: { systolic: { min: 70, max: 220 }, diastolic: { min: 40, max: 130 } },
    },
  },
];