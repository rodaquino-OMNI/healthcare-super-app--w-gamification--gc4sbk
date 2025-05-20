/**
 * @file Journey Context Fixtures
 * @description Sample journey context objects for the three main journeys (Health, Care, and Plan)
 * with realistic metadata and identifiers for testing journey-specific log enrichment.
 */

import { JourneyContext, JourneyType } from '../../../src/context/journey-context.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Base context properties shared across all journey contexts
 */
const baseContext = {
  correlationId: '8f7d9b2e-3f4a-4b5c-9d8e-7f6a5b4c3d2e',
  timestamp: new Date().toISOString(),
  applicationName: 'austa-superapp',
  serviceName: 'test-service',
  environment: 'test',
  logLevel: LogLevel.INFO,
  hostname: 'test-host',
};

/**
 * User session data shared across journey contexts
 */
const userSession = {
  userId: 'usr_7f8e9d6c5b4a3f2e1d',
  authStatus: 'authenticated',
  sessionId: 'sess_9d8e7f6a5b4c3d2e1f',
  deviceId: 'dev_5b4c3d2e1f9d8e7f6a',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
};

/**
 * Health Journey Context
 * Contains health-specific attributes like metrics, goals, and device data
 */
export const healthJourneyContext: JourneyContext = {
  ...baseContext,
  journeyType: JourneyType.HEALTH,
  journeyState: {
    journeySessionId: 'health_sess_3f4a5b6c7d8e9f0a1b2c',
    currentStep: 'health-dashboard',
    previousStep: 'health-metrics-input',
    stepDuration: 4500,
    activeMetric: 'blood-pressure',
    activeGoal: 'weight-loss-10kg',
    connectedDevices: ['fitbit-versa-3', 'withings-scale'],
    lastSyncTime: new Date(Date.now() - 3600000).toISOString(),
  },
  journeyFeatureFlags: {
    enableHealthInsights: true,
    showDetailedMetrics: true,
    enableDeviceSync: true,
    betaFeatures: false,
  },
  journeyPerformance: {
    timeToInteractive: 1250,
    actionDuration: 350,
    apiCallCount: 5,
    renderTime: 780,
    dataLoadTime: 450,
  },
  businessTransaction: {
    transactionId: 'health_tx_9f8e7d6c5b4a3f2e1d0c',
    transactionType: 'health-metric-recording',
    status: 'completed',
    startedAt: new Date(Date.now() - 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      metricType: 'blood-pressure',
      metricValue: '120/80',
      metricUnit: 'mmHg',
      recordingMethod: 'manual-entry',
    },
  },
  userInteraction: {
    interactionType: 'form-submission',
    interactionTarget: 'blood-pressure-form',
    interactionResult: 'success',
    interactionDuration: 8500,
  },
  // Additional health-specific context
  healthMetrics: {
    bloodPressure: { systolic: 120, diastolic: 80, timestamp: new Date(Date.now() - 3600000).toISOString() },
    heartRate: { value: 72, timestamp: new Date(Date.now() - 7200000).toISOString() },
    weight: { value: 75.5, unit: 'kg', timestamp: new Date(Date.now() - 86400000).toISOString() },
    steps: { value: 8750, goal: 10000, timestamp: new Date(Date.now() - 1800000).toISOString() },
    sleep: { duration: 7.5, quality: 'good', timestamp: new Date(Date.now() - 28800000).toISOString() },
  },
  healthGoals: [
    { id: 'goal_1', type: 'weight', target: 70, unit: 'kg', progress: 0.65, dueDate: new Date(Date.now() + 2592000000).toISOString() },
    { id: 'goal_2', type: 'steps', target: 10000, unit: 'steps/day', progress: 0.88, dueDate: new Date(Date.now() + 86400000).toISOString() },
  ],
  userProfile: {
    ...userSession,
    name: 'Maria Silva',
    age: 42,
    gender: 'female',
    height: 165,
    chronicConditions: ['hypertension'],
    medications: ['lisinopril'],
    preferences: { measurementSystem: 'metric', notifications: true },
  },
};

/**
 * Care Journey Context
 * Contains care-specific attributes like appointments, providers, and medications
 */
export const careJourneyContext: JourneyContext = {
  ...baseContext,
  journeyType: JourneyType.CARE,
  journeyState: {
    journeySessionId: 'care_sess_5b6c7d8e9f0a1b2c3d4e',
    currentStep: 'appointment-scheduling',
    previousStep: 'provider-selection',
    stepDuration: 6200,
    selectedSpecialty: 'cardiology',
    selectedProvider: 'dr-santos',
    appointmentType: 'video-consultation',
  },
  journeyFeatureFlags: {
    enableTelemedicine: true,
    showProviderRatings: true,
    enablePrescriptionRefills: true,
    betaFeatures: true,
  },
  journeyPerformance: {
    timeToInteractive: 1450,
    actionDuration: 520,
    apiCallCount: 7,
    renderTime: 920,
    dataLoadTime: 630,
  },
  businessTransaction: {
    transactionId: 'care_tx_7d6c5b4a3f2e1d0c9b8a',
    transactionType: 'appointment-booking',
    status: 'in-progress',
    startedAt: new Date(Date.now() - 120000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      providerId: 'prov_3f2e1d0c9b8a7f6e5d4c',
      specialtyId: 'spec_cardiology',
      appointmentType: 'video-consultation',
      proposedDate: new Date(Date.now() + 172800000).toISOString(),
    },
  },
  userInteraction: {
    interactionType: 'calendar-selection',
    interactionTarget: 'appointment-date-picker',
    interactionResult: 'date-selected',
    interactionDuration: 12500,
  },
  // Additional care-specific context
  appointments: [
    {
      id: 'appt_9b8a7f6e5d4c3b2a1f0e',
      providerId: 'prov_3f2e1d0c9b8a7f6e5d4c',
      providerName: 'Dr. Carlos Santos',
      specialty: 'Cardiology',
      type: 'video-consultation',
      status: 'scheduled',
      dateTime: new Date(Date.now() + 172800000).toISOString(),
      duration: 30,
    },
    {
      id: 'appt_8a7f6e5d4c3b2a1f0e9d',
      providerId: 'prov_2e1d0c9b8a7f6e5d4c3b',
      providerName: 'Dra. Ana Oliveira',
      specialty: 'Endocrinology',
      type: 'in-person',
      status: 'completed',
      dateTime: new Date(Date.now() - 604800000).toISOString(),
      duration: 45,
    },
  ],
  medications: [
    {
      id: 'med_7f6e5d4c3b2a1f0e9d8c',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'once daily',
      startDate: new Date(Date.now() - 7776000000).toISOString(),
      endDate: null,
      refillsRemaining: 2,
      prescribedBy: 'Dr. Carlos Santos',
    },
    {
      id: 'med_6e5d4c3b2a1f0e9d8c7b',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'twice daily',
      startDate: new Date(Date.now() - 5184000000).toISOString(),
      endDate: null,
      refillsRemaining: 3,
      prescribedBy: 'Dra. Ana Oliveira',
    },
  ],
  userProfile: {
    ...userSession,
    name: 'Maria Silva',
    preferredLanguage: 'pt-BR',
    communicationPreferences: { email: true, sms: true, push: true },
    emergencyContact: { name: 'João Silva', relationship: 'Spouse', phone: '+5511987654321' },
  },
};

/**
 * Plan Journey Context
 * Contains plan-specific attributes like insurance details, claims, and benefits
 */
export const planJourneyContext: JourneyContext = {
  ...baseContext,
  journeyType: JourneyType.PLAN,
  journeyState: {
    journeySessionId: 'plan_sess_7d8e9f0a1b2c3d4e5f6g',
    currentStep: 'claim-submission',
    previousStep: 'benefit-details',
    stepDuration: 5800,
    activeClaim: 'claim_5d4c3b2a1f0e9d8c7b6a',
    selectedBenefit: 'benefit_prescription',
    documentUploadStatus: 'in-progress',
  },
  journeyFeatureFlags: {
    enableDigitalIDCard: true,
    showNetworkProviders: true,
    enableClaimTracking: true,
    betaFeatures: false,
  },
  journeyPerformance: {
    timeToInteractive: 1650,
    actionDuration: 480,
    apiCallCount: 6,
    renderTime: 850,
    dataLoadTime: 580,
  },
  businessTransaction: {
    transactionId: 'plan_tx_5d4c3b2a1f0e9d8c7b6a',
    transactionType: 'claim-submission',
    status: 'in-progress',
    startedAt: new Date(Date.now() - 300000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      claimType: 'prescription-reimbursement',
      claimAmount: 157.89,
      serviceDate: new Date(Date.now() - 604800000).toISOString(),
      documentCount: 2,
    },
  },
  userInteraction: {
    interactionType: 'file-upload',
    interactionTarget: 'claim-receipt-upload',
    interactionResult: 'upload-success',
    interactionDuration: 15000,
  },
  // Additional plan-specific context
  insurancePlan: {
    id: 'plan_3b2a1f0e9d8c7b6a5f4e',
    name: 'AUSTA Premium',
    type: 'PPO',
    effectiveDate: new Date(Date.now() - 31536000000).toISOString(),
    expirationDate: new Date(Date.now() + 31536000000).toISOString(),
    status: 'active',
    memberId: 'MBR123456789',
    groupNumber: 'GRP987654321',
  },
  claims: [
    {
      id: 'claim_5d4c3b2a1f0e9d8c7b6a',
      type: 'prescription-reimbursement',
      status: 'in-progress',
      submissionDate: new Date(Date.now() - 300000).toISOString(),
      serviceDate: new Date(Date.now() - 604800000).toISOString(),
      amount: 157.89,
      provider: 'Farmácia São Paulo',
      documents: ['receipt.pdf', 'prescription.pdf'],
    },
    {
      id: 'claim_4c3b2a1f0e9d8c7b6a5f',
      type: 'specialist-visit',
      status: 'approved',
      submissionDate: new Date(Date.now() - 2592000000).toISOString(),
      serviceDate: new Date(Date.now() - 2678400000).toISOString(),
      amount: 350.00,
      provider: 'Dr. Carlos Santos',
      documents: ['invoice.pdf'],
      approvalDate: new Date(Date.now() - 1296000000).toISOString(),
      reimbursementAmount: 280.00,
    },
  ],
  benefits: [
    {
      id: 'benefit_prescription',
      name: 'Prescription Coverage',
      coverage: '80% after deductible',
      remainingDeductible: 150.00,
      yearToDateSpending: 850.00,
      annualLimit: 3000.00,
    },
    {
      id: 'benefit_specialist',
      name: 'Specialist Visits',
      coverage: '80% after deductible',
      remainingDeductible: 0.00,
      yearToDateSpending: 1200.00,
      annualLimit: 5000.00,
    },
    {
      id: 'benefit_hospital',
      name: 'Hospital Services',
      coverage: '90% after deductible',
      remainingDeductible: 500.00,
      yearToDateSpending: 0.00,
      annualLimit: 50000.00,
    },
  ],
  userProfile: {
    ...userSession,
    name: 'Maria Silva',
    dependents: [
      { id: 'dep_1', name: 'João Silva', relationship: 'Spouse', dateOfBirth: '1978-05-15' },
      { id: 'dep_2', name: 'Ana Silva', relationship: 'Child', dateOfBirth: '2010-08-22' },
    ],
    billingAddress: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567',
      country: 'Brasil',
    },
  },
};

/**
 * Cross-Journey Context
 * Represents a user flow that transitions between multiple journeys
 */
export const crossJourneyContext: JourneyContext = {
  ...baseContext,
  journeyType: JourneyType.HEALTH,  // Starting in Health journey
  journeyState: {
    journeySessionId: 'health_sess_3f4a5b6c7d8e9f0a1b2c',
    currentStep: 'health-metric-alert',
    previousStep: 'health-dashboard',
    stepDuration: 2500,
    alertType: 'high-blood-pressure',
    alertSeverity: 'moderate',
    recommendedAction: 'schedule-appointment',
  },
  crossJourneyContext: {
    sourceJourney: JourneyType.HEALTH,
    targetJourney: JourneyType.CARE,
    flowId: 'cross_flow_9f0a1b2c3d4e5f6g7h8i',
    startedAt: new Date().toISOString(),
    metadata: {
      reason: 'high-blood-pressure-alert',
      sourceMetric: {
        type: 'blood-pressure',
        value: '160/95',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      recommendedSpecialty: 'cardiology',
    },
  },
  businessTransaction: {
    transactionId: 'cross_tx_1b2c3d4e5f6g7h8i9j0k',
    transactionType: 'health-alert-to-appointment',
    status: 'in-progress',
    startedAt: new Date(Date.now() - 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      alertId: 'alert_7h8i9j0k1l2m3n4o5p6q',
      metricType: 'blood-pressure',
      metricValue: '160/95',
      recommendedAction: 'schedule-appointment',
    },
  },
  userInteraction: {
    interactionType: 'button-click',
    interactionTarget: 'schedule-appointment-button',
    interactionResult: 'navigation-to-care',
    interactionDuration: 500,
  },
  userProfile: {
    ...userSession,
    name: 'Maria Silva',
  },
  // Health-specific context that triggered the cross-journey flow
  healthMetrics: {
    bloodPressure: { systolic: 160, diastolic: 95, timestamp: new Date(Date.now() - 1800000).toISOString() },
  },
  // Care-specific context for the target journey
  targetJourneyData: {
    recommendedProvider: {
      id: 'prov_3f2e1d0c9b8a7f6e5d4c',
      name: 'Dr. Carlos Santos',
      specialty: 'Cardiology',
      availability: [
        new Date(Date.now() + 86400000).toISOString(),
        new Date(Date.now() + 172800000).toISOString(),
        new Date(Date.now() + 259200000).toISOString(),
      ],
    },
    appointmentType: 'urgent-consultation',
    insuranceCoverage: {
      covered: true,
      copay: 30.00,
      requiresAuthorization: false,
    },
  },
};

/**
 * Collection of all journey contexts for easy import
 */
export const journeyContexts = {
  health: healthJourneyContext,
  care: careJourneyContext,
  plan: planJourneyContext,
  crossJourney: crossJourneyContext,
};