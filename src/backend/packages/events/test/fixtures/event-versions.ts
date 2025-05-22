/**
 * @file event-versions.ts
 * @description Test fixtures for verifying event versioning capabilities and schema evolution.
 * This file provides event samples of the same type but with different versions, allowing tests
 * to verify backward compatibility, upgrade paths, and version handling strategies.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseEvent } from '../../src/interfaces/base-event.interface';
import { 
  JourneyType, 
  HealthEventType, 
  CareEventType, 
  PlanEventType 
} from '../../src/interfaces/journey-events.interface';
import { EventVersion } from '../../src/interfaces/event-versioning.interface';

// Helper function to create a versioned event
const createVersionedEvent = <T>(
  type: string,
  version: string,
  source: string,
  journey: JourneyType,
  payload: T,
  options: {
    userId?: string;
    eventId?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
  } = {}
): BaseEvent<T> => ({
  eventId: options.eventId || uuidv4(),
  type,
  timestamp: options.timestamp || new Date().toISOString(),
  version,
  source,
  journey,
  userId: options.userId || 'test-user-123',
  payload,
  metadata: options.metadata || {},
});

// Helper function to parse version string to EventVersion object
const parseVersion = (versionStr: string): EventVersion => {
  const [major, minor, patch] = versionStr.split('.').map(Number);
  return { major, minor, patch };
};

/**
 * ===== HEALTH JOURNEY EVENT VERSIONS =====
 */

/**
 * HEALTH_METRIC_RECORDED event versions
 * 
 * Changes between versions:
 * - v0.5.0 to v0.6.0 (Minor): Added 'source' field (non-breaking)
 * - v0.6.0 to v0.7.0 (Minor): Added 'previousValue' and 'change' fields (non-breaking)
 * - v0.7.0 to v1.0.0 (Major): Renamed 'value' to 'metricValue' and changed 'unit' to required (breaking)
 */
export const healthMetricRecordedV050: BaseEvent<any> = createVersionedEvent(
  HealthEventType.METRIC_RECORDED,
  '0.5.0',
  'health-service',
  JourneyType.HEALTH,
  {
    metric: {
      id: 'metric-123',
      userId: 'test-user-123',
      type: 'HEART_RATE',
    },
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: '2023-04-15T10:30:00.000Z',
  }
);

export const healthMetricRecordedV060: BaseEvent<any> = createVersionedEvent(
  HealthEventType.METRIC_RECORDED,
  '0.6.0',
  'health-service',
  JourneyType.HEALTH,
  {
    metric: {
      id: 'metric-123',
      userId: 'test-user-123',
      type: 'HEART_RATE',
    },
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: '2023-04-15T10:30:00.000Z',
    source: 'manual', // Added in v0.6.0
  }
);

export const healthMetricRecordedV070: BaseEvent<any> = createVersionedEvent(
  HealthEventType.METRIC_RECORDED,
  '0.7.0',
  'health-service',
  JourneyType.HEALTH,
  {
    metric: {
      id: 'metric-123',
      userId: 'test-user-123',
      type: 'HEART_RATE',
    },
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: '2023-04-15T10:30:00.000Z',
    source: 'manual',
    previousValue: 72, // Added in v0.7.0
    change: 3, // Added in v0.7.0
  }
);

export const healthMetricRecordedV100: BaseEvent<any> = createVersionedEvent(
  HealthEventType.METRIC_RECORDED,
  '1.0.0',
  'health-service',
  JourneyType.HEALTH,
  {
    metric: {
      id: 'metric-123',
      userId: 'test-user-123',
      type: 'HEART_RATE',
    },
    metricType: 'HEART_RATE',
    metricValue: 75, // Renamed from 'value' in v1.0.0 (breaking change)
    unit: 'bpm', // Now required
    timestamp: '2023-04-15T10:30:00.000Z',
    source: 'manual',
    previousValue: 72,
    change: 3,
    isImprovement: true, // Added in v1.0.0
  }
);

/**
 * HEALTH_GOAL_ACHIEVED event versions
 * 
 * Changes between versions:
 * - v0.5.0 to v0.7.0 (Minor): Added 'daysToAchieve' field (non-breaking)
 * - v0.7.0 to v1.0.0 (Major): Changed 'achievedValue' and 'targetValue' to require specific units (breaking)
 */
export const healthGoalAchievedV050: BaseEvent<any> = createVersionedEvent(
  HealthEventType.GOAL_ACHIEVED,
  '0.5.0',
  'health-service',
  JourneyType.HEALTH,
  {
    goal: {
      id: 'goal-123',
      userId: 'test-user-123',
      type: 'STEPS',
      targetValue: 10000,
      status: 'ACHIEVED',
    },
    goalType: 'STEPS',
    achievedValue: 10500,
    targetValue: 10000,
  }
);

export const healthGoalAchievedV070: BaseEvent<any> = createVersionedEvent(
  HealthEventType.GOAL_ACHIEVED,
  '0.7.0',
  'health-service',
  JourneyType.HEALTH,
  {
    goal: {
      id: 'goal-123',
      userId: 'test-user-123',
      type: 'STEPS',
      targetValue: 10000,
      status: 'ACHIEVED',
    },
    goalType: 'STEPS',
    achievedValue: 10500,
    targetValue: 10000,
    daysToAchieve: 5, // Added in v0.7.0
  }
);

export const healthGoalAchievedV100: BaseEvent<any> = createVersionedEvent(
  HealthEventType.GOAL_ACHIEVED,
  '1.0.0',
  'health-service',
  JourneyType.HEALTH,
  {
    goal: {
      id: 'goal-123',
      userId: 'test-user-123',
      type: 'STEPS',
      targetValue: 10000,
      status: 'ACHIEVED',
    },
    goalType: 'STEPS',
    achievedValue: { // Changed to object with value and unit in v1.0.0 (breaking change)
      value: 10500,
      unit: 'steps'
    },
    targetValue: { // Changed to object with value and unit in v1.0.0 (breaking change)
      value: 10000,
      unit: 'steps'
    },
    daysToAchieve: 5,
    isEarlyCompletion: true, // Added in v1.0.0
  }
);

/**
 * HEALTH_DEVICE_CONNECTED event versions
 * 
 * Changes between versions:
 * - v0.6.0 to v0.8.0 (Minor): Added 'deviceManufacturer' field (non-breaking)
 * - v0.8.0 to v1.0.0 (Major): Restructured 'deviceConnection' to include more details (breaking)
 */
export const healthDeviceConnectedV060: BaseEvent<any> = createVersionedEvent(
  HealthEventType.DEVICE_CONNECTED,
  '0.6.0',
  'health-service',
  JourneyType.HEALTH,
  {
    deviceConnection: {
      id: 'connection-123',
      userId: 'test-user-123',
      deviceId: 'device-123',
    },
    deviceId: 'device-123',
    deviceType: 'SMARTWATCH',
    connectionDate: '2023-04-15T14:20:00.000Z',
    isFirstConnection: true,
  }
);

export const healthDeviceConnectedV080: BaseEvent<any> = createVersionedEvent(
  HealthEventType.DEVICE_CONNECTED,
  '0.8.0',
  'health-service',
  JourneyType.HEALTH,
  {
    deviceConnection: {
      id: 'connection-123',
      userId: 'test-user-123',
      deviceId: 'device-123',
    },
    deviceId: 'device-123',
    deviceType: 'SMARTWATCH',
    connectionDate: '2023-04-15T14:20:00.000Z',
    isFirstConnection: true,
    deviceManufacturer: 'Acme', // Added in v0.8.0
  }
);

export const healthDeviceConnectedV100: BaseEvent<any> = createVersionedEvent(
  HealthEventType.DEVICE_CONNECTED,
  '1.0.0',
  'health-service',
  JourneyType.HEALTH,
  {
    deviceConnection: { // Restructured in v1.0.0 (breaking change)
      id: 'connection-123',
      userId: 'test-user-123',
      device: {
        id: 'device-123',
        type: 'SMARTWATCH',
        manufacturer: 'Acme',
        model: 'Watch Pro',
      },
      status: 'CONNECTED',
      connectionDate: '2023-04-15T14:20:00.000Z',
    },
    deviceId: 'device-123',
    deviceType: 'SMARTWATCH',
    connectionDate: '2023-04-15T14:20:00.000Z',
    isFirstConnection: true,
    deviceManufacturer: 'Acme',
    supportedMetrics: ['HEART_RATE', 'STEPS', 'SLEEP'], // Added in v1.0.0
  }
);

/**
 * ===== CARE JOURNEY EVENT VERSIONS =====
 */

/**
 * CARE_APPOINTMENT_BOOKED event versions
 * 
 * Changes between versions:
 * - v0.5.0 to v0.7.0 (Minor): Added 'isUrgent' field (non-breaking)
 * - v0.7.0 to v1.0.0 (Major): Changed 'providerId' to required provider object (breaking)
 */
export const careAppointmentBookedV050: BaseEvent<any> = createVersionedEvent(
  CareEventType.APPOINTMENT_BOOKED,
  '0.5.0',
  'care-service',
  JourneyType.CARE,
  {
    appointment: {
      id: 'appointment-123',
      userId: 'test-user-123',
      status: 'SCHEDULED',
    },
    appointmentType: 'IN_PERSON',
    providerId: 'provider-123',
    scheduledDate: '2023-05-10T09:00:00.000Z',
    isFirstAppointment: false,
  }
);

export const careAppointmentBookedV070: BaseEvent<any> = createVersionedEvent(
  CareEventType.APPOINTMENT_BOOKED,
  '0.7.0',
  'care-service',
  JourneyType.CARE,
  {
    appointment: {
      id: 'appointment-123',
      userId: 'test-user-123',
      status: 'SCHEDULED',
    },
    appointmentType: 'IN_PERSON',
    providerId: 'provider-123',
    scheduledDate: '2023-05-10T09:00:00.000Z',
    isFirstAppointment: false,
    isUrgent: false, // Added in v0.7.0
  }
);

export const careAppointmentBookedV100: BaseEvent<any> = createVersionedEvent(
  CareEventType.APPOINTMENT_BOOKED,
  '1.0.0',
  'care-service',
  JourneyType.CARE,
  {
    appointment: {
      id: 'appointment-123',
      userId: 'test-user-123',
      status: 'SCHEDULED',
    },
    appointmentType: 'IN_PERSON',
    provider: { // Changed from providerId to provider object in v1.0.0 (breaking change)
      id: 'provider-123',
      name: 'Dr. Smith',
      specialty: 'Cardiologia',
      location: 'Clinic A',
    },
    scheduledDate: '2023-05-10T09:00:00.000Z',
    isFirstAppointment: false,
    isUrgent: false,
    schedulingMethod: 'APP', // Added in v1.0.0
  }
);

/**
 * CARE_MEDICATION_ADHERENCE_STREAK event versions
 * 
 * Changes between versions:
 * - v0.6.0 to v0.8.0 (Minor): Added 'adherencePercentage' field (non-breaking)
 * - v0.8.0 to v1.0.0 (Major): Changed 'streakDays' calculation method and added required fields (breaking)
 */
export const careMedicationAdherenceStreakV060: BaseEvent<any> = createVersionedEvent(
  CareEventType.MEDICATION_ADHERENCE_STREAK,
  '0.6.0',
  'care-service',
  JourneyType.CARE,
  {
    medicationId: 'medication-123',
    medicationName: 'Medication A',
    streakDays: 7,
    startDate: '2023-04-01T00:00:00.000Z',
    endDate: '2023-04-07T23:59:59.999Z',
  }
);

export const careMedicationAdherenceStreakV080: BaseEvent<any> = createVersionedEvent(
  CareEventType.MEDICATION_ADHERENCE_STREAK,
  '0.8.0',
  'care-service',
  JourneyType.CARE,
  {
    medicationId: 'medication-123',
    medicationName: 'Medication A',
    streakDays: 7,
    adherencePercentage: 95, // Added in v0.8.0
    startDate: '2023-04-01T00:00:00.000Z',
    endDate: '2023-04-07T23:59:59.999Z',
  }
);

export const careMedicationAdherenceStreakV100: BaseEvent<any> = createVersionedEvent(
  CareEventType.MEDICATION_ADHERENCE_STREAK,
  '1.0.0',
  'care-service',
  JourneyType.CARE,
  {
    medicationId: 'medication-123',
    medicationName: 'Medication A',
    streakDays: 7, // Now calculated differently in v1.0.0 (breaking change)
    adherencePercentage: 95,
    startDate: '2023-04-01T00:00:00.000Z',
    endDate: '2023-04-07T23:59:59.999Z',
    dosesScheduled: 14, // Required in v1.0.0 (breaking change)
    dosesTaken: 13, // Required in v1.0.0 (breaking change)
    dosesMissed: 1, // Required in v1.0.0 (breaking change)
    streakType: 'DAILY', // Added in v1.0.0
  }
);

/**
 * CARE_TELEMEDICINE_SESSION_COMPLETED event versions
 * 
 * Changes between versions:
 * - v0.5.0 to v0.9.0 (Minor): Added 'technicalIssues' field (non-breaking)
 * - v0.9.0 to v1.0.0 (Major): Added required 'sessionQuality' field and restructured time fields (breaking)
 */
export const careTelemedicineSessionCompletedV050: BaseEvent<any> = createVersionedEvent(
  CareEventType.TELEMEDICINE_SESSION_COMPLETED,
  '0.5.0',
  'care-service',
  JourneyType.CARE,
  {
    session: {
      id: 'session-123',
      userId: 'test-user-123',
      status: 'COMPLETED',
    },
    sessionId: 'session-123',
    providerId: 'provider-123',
    startTime: '2023-05-15T14:00:00.000Z',
    endTime: '2023-05-15T14:30:00.000Z',
    duration: 30,
    appointmentId: 'appointment-123',
  }
);

export const careTelemedicineSessionCompletedV090: BaseEvent<any> = createVersionedEvent(
  CareEventType.TELEMEDICINE_SESSION_COMPLETED,
  '0.9.0',
  'care-service',
  JourneyType.CARE,
  {
    session: {
      id: 'session-123',
      userId: 'test-user-123',
      status: 'COMPLETED',
    },
    sessionId: 'session-123',
    providerId: 'provider-123',
    startTime: '2023-05-15T14:00:00.000Z',
    endTime: '2023-05-15T14:30:00.000Z',
    duration: 30,
    appointmentId: 'appointment-123',
    technicalIssues: false, // Added in v0.9.0
  }
);

export const careTelemedicineSessionCompletedV100: BaseEvent<any> = createVersionedEvent(
  CareEventType.TELEMEDICINE_SESSION_COMPLETED,
  '1.0.0',
  'care-service',
  JourneyType.CARE,
  {
    session: {
      id: 'session-123',
      userId: 'test-user-123',
      status: 'COMPLETED',
    },
    sessionId: 'session-123',
    providerId: 'provider-123',
    timing: { // Restructured time fields in v1.0.0 (breaking change)
      startTime: '2023-05-15T14:00:00.000Z',
      endTime: '2023-05-15T14:30:00.000Z',
      duration: 30,
      waitTime: 2,
    },
    appointmentId: 'appointment-123',
    technicalIssues: false,
    sessionQuality: 'GOOD', // Required in v1.0.0 (breaking change)
    features: ['VIDEO', 'AUDIO', 'CHAT'], // Added in v1.0.0
  }
);

/**
 * ===== PLAN JOURNEY EVENT VERSIONS =====
 */

/**
 * PLAN_CLAIM_SUBMITTED event versions
 * 
 * Changes between versions:
 * - v0.5.0 to v0.8.0 (Minor): Added 'isComplete' field (non-breaking)
 * - v0.8.0 to v1.0.0 (Major): Added required 'documentIds' array and changed 'amount' to structured object (breaking)
 */
export const planClaimSubmittedV050: BaseEvent<any> = createVersionedEvent(
  PlanEventType.CLAIM_SUBMITTED,
  '0.5.0',
  'plan-service',
  JourneyType.PLAN,
  {
    claim: {
      id: 'claim-123',
      userId: 'test-user-123',
      status: 'SUBMITTED',
    },
    submissionDate: '2023-06-01T10:15:00.000Z',
    amount: 150.75,
    claimType: 'MEDICAL_CONSULTATION',
    hasDocuments: true,
  }
);

export const planClaimSubmittedV080: BaseEvent<any> = createVersionedEvent(
  PlanEventType.CLAIM_SUBMITTED,
  '0.8.0',
  'plan-service',
  JourneyType.PLAN,
  {
    claim: {
      id: 'claim-123',
      userId: 'test-user-123',
      status: 'SUBMITTED',
    },
    submissionDate: '2023-06-01T10:15:00.000Z',
    amount: 150.75,
    claimType: 'MEDICAL_CONSULTATION',
    hasDocuments: true,
    isComplete: true, // Added in v0.8.0
  }
);

export const planClaimSubmittedV100: BaseEvent<any> = createVersionedEvent(
  PlanEventType.CLAIM_SUBMITTED,
  '1.0.0',
  'plan-service',
  JourneyType.PLAN,
  {
    claim: {
      id: 'claim-123',
      userId: 'test-user-123',
      status: 'SUBMITTED',
    },
    submissionDate: '2023-06-01T10:15:00.000Z',
    amount: { // Changed to structured object in v1.0.0 (breaking change)
      value: 150.75,
      currency: 'BRL',
    },
    claimType: 'MEDICAL_CONSULTATION',
    hasDocuments: true,
    isComplete: true,
    documentIds: ['doc-123', 'doc-124'], // Required in v1.0.0 (breaking change)
    submissionMethod: 'APP', // Added in v1.0.0
  }
);

/**
 * PLAN_BENEFIT_UTILIZED event versions
 * 
 * Changes between versions:
 * - v0.6.0 to v0.9.0 (Minor): Added 'isFirstUtilization' field (non-breaking)
 * - v0.9.0 to v1.0.0 (Major): Added required 'utilizationId' and changed optional fields to required (breaking)
 */
export const planBenefitUtilizedV060: BaseEvent<any> = createVersionedEvent(
  PlanEventType.BENEFIT_UTILIZED,
  '0.6.0',
  'plan-service',
  JourneyType.PLAN,
  {
    benefit: {
      id: 'benefit-123',
      name: 'Annual Check-up',
      description: 'Yearly comprehensive health examination',
    },
    utilizationDate: '2023-06-15T11:30:00.000Z',
    serviceProvider: 'Provider XYZ',
    amount: 200.00,
    remainingCoverage: 1800.00,
  }
);

export const planBenefitUtilizedV090: BaseEvent<any> = createVersionedEvent(
  PlanEventType.BENEFIT_UTILIZED,
  '0.9.0',
  'plan-service',
  JourneyType.PLAN,
  {
    benefit: {
      id: 'benefit-123',
      name: 'Annual Check-up',
      description: 'Yearly comprehensive health examination',
    },
    utilizationDate: '2023-06-15T11:30:00.000Z',
    serviceProvider: 'Provider XYZ',
    amount: 200.00,
    remainingCoverage: 1800.00,
    isFirstUtilization: true, // Added in v0.9.0
  }
);

export const planBenefitUtilizedV100: BaseEvent<any> = createVersionedEvent(
  PlanEventType.BENEFIT_UTILIZED,
  '1.0.0',
  'plan-service',
  JourneyType.PLAN,
  {
    benefit: {
      id: 'benefit-123',
      name: 'Annual Check-up',
      description: 'Yearly comprehensive health examination',
    },
    utilizationId: 'utilization-123', // Required in v1.0.0 (breaking change)
    utilizationDate: '2023-06-15T11:30:00.000Z',
    serviceProvider: 'Provider XYZ', // Now required in v1.0.0 (breaking change)
    amount: 200.00, // Now required in v1.0.0 (breaking change)
    remainingCoverage: 1800.00, // Now required in v1.0.0 (breaking change)
    isFirstUtilization: true,
    utilizationCategory: 'PREVENTIVE', // Added in v1.0.0
    locationId: 'location-123', // Added in v1.0.0
  }
);

/**
 * PLAN_REWARD_REDEEMED event versions
 * 
 * Changes between versions:
 * - v0.7.0 to v0.9.0 (Minor): Added 'isPremiumReward' field (non-breaking)
 * - v0.9.0 to v1.0.0 (Major): Changed 'pointValue' to required 'points' object with history (breaking)
 */
export const planRewardRedeemedV070: BaseEvent<any> = createVersionedEvent(
  PlanEventType.REWARD_REDEEMED,
  '0.7.0',
  'plan-service',
  JourneyType.PLAN,
  {
    rewardId: 'reward-123',
    rewardName: 'Discount Voucher',
    redemptionDate: '2023-06-20T15:45:00.000Z',
    pointValue: 500,
    monetaryValue: 50.00,
    rewardType: 'VOUCHER',
  }
);

export const planRewardRedeemedV090: BaseEvent<any> = createVersionedEvent(
  PlanEventType.REWARD_REDEEMED,
  '0.9.0',
  'plan-service',
  JourneyType.PLAN,
  {
    rewardId: 'reward-123',
    rewardName: 'Discount Voucher',
    redemptionDate: '2023-06-20T15:45:00.000Z',
    pointValue: 500,
    monetaryValue: 50.00,
    rewardType: 'VOUCHER',
    isPremiumReward: false, // Added in v0.9.0
  }
);

export const planRewardRedeemedV100: BaseEvent<any> = createVersionedEvent(
  PlanEventType.REWARD_REDEEMED,
  '1.0.0',
  'plan-service',
  JourneyType.PLAN,
  {
    rewardId: 'reward-123',
    rewardName: 'Discount Voucher',
    redemptionDate: '2023-06-20T15:45:00.000Z',
    points: { // Changed from pointValue to points object in v1.0.0 (breaking change)
      redeemed: 500,
      remaining: 250,
      history: [
        {
          date: '2023-06-20T15:45:00.000Z',
          amount: 500,
          type: 'REDEMPTION',
        }
      ]
    },
    monetaryValue: 50.00,
    rewardType: 'VOUCHER',
    isPremiumReward: false,
    expirationDate: '2023-07-20T23:59:59.999Z', // Added in v1.0.0
    redemptionCode: 'DISCOUNT50', // Added in v1.0.0
  }
);

/**
 * ===== MIGRATION TEST CASES =====
 */

/**
 * Migration test cases for HEALTH_METRIC_RECORDED
 */
export const healthMetricRecordedMigrations = {
  // v0.5.0 to v0.6.0 (add source field)
  v050_to_v060: {
    source: healthMetricRecordedV050,
    target: healthMetricRecordedV060,
    transform: (source: BaseEvent<any>): BaseEvent<any> => ({
      ...source,
      version: '0.6.0',
      payload: {
        ...source.payload,
        source: 'manual', // Add default source
      },
    }),
  },
  
  // v0.6.0 to v0.7.0 (add previousValue and change fields)
  v060_to_v070: {
    source: healthMetricRecordedV060,
    target: healthMetricRecordedV070,
    transform: (source: BaseEvent<any>): BaseEvent<any> => ({
      ...source,
      version: '0.7.0',
      payload: {
        ...source.payload,
        previousValue: null, // Add default previousValue
        change: null, // Add default change
      },
    }),
  },
  
  // v0.7.0 to v1.0.0 (rename value to metricValue and add isImprovement)
  v070_to_v100: {
    source: healthMetricRecordedV070,
    target: healthMetricRecordedV100,
    transform: (source: BaseEvent<any>): BaseEvent<any> => {
      const { value, ...rest } = source.payload;
      return {
        ...source,
        version: '1.0.0',
        payload: {
          ...rest,
          metricValue: value, // Rename value to metricValue
          isImprovement: source.payload.change > 0, // Add calculated isImprovement
        },
      };
    },
  },
};

/**
 * Migration test cases for CARE_APPOINTMENT_BOOKED
 */
export const careAppointmentBookedMigrations = {
  // v0.5.0 to v0.7.0 (add isUrgent field)
  v050_to_v070: {
    source: careAppointmentBookedV050,
    target: careAppointmentBookedV070,
    transform: (source: BaseEvent<any>): BaseEvent<any> => ({
      ...source,
      version: '0.7.0',
      payload: {
        ...source.payload,
        isUrgent: false, // Add default isUrgent
      },
    }),
  },
  
  // v0.7.0 to v1.0.0 (change providerId to provider object)
  v070_to_v100: {
    source: careAppointmentBookedV070,
    target: careAppointmentBookedV100,
    transform: (source: BaseEvent<any>): BaseEvent<any> => {
      const { providerId, ...rest } = source.payload;
      return {
        ...source,
        version: '1.0.0',
        payload: {
          ...rest,
          provider: { // Transform providerId to provider object
            id: providerId,
            name: 'Unknown Provider', // Default value
            specialty: 'Unknown', // Default value
            location: 'Unknown', // Default value
          },
          schedulingMethod: 'APP', // Add default schedulingMethod
        },
      };
    },
  },
};

/**
 * Migration test cases for PLAN_CLAIM_SUBMITTED
 */
export const planClaimSubmittedMigrations = {
  // v0.5.0 to v0.8.0 (add isComplete field)
  v050_to_v080: {
    source: planClaimSubmittedV050,
    target: planClaimSubmittedV080,
    transform: (source: BaseEvent<any>): BaseEvent<any> => ({
      ...source,
      version: '0.8.0',
      payload: {
        ...source.payload,
        isComplete: source.payload.hasDocuments, // Derive isComplete from hasDocuments
      },
    }),
  },
  
  // v0.8.0 to v1.0.0 (change amount to structured object and add documentIds)
  v080_to_v100: {
    source: planClaimSubmittedV080,
    target: planClaimSubmittedV100,
    transform: (source: BaseEvent<any>): BaseEvent<any> => {
      const { amount, ...rest } = source.payload;
      return {
        ...source,
        version: '1.0.0',
        payload: {
          ...rest,
          amount: { // Transform amount to structured object
            value: amount,
            currency: 'BRL', // Default currency
          },
          documentIds: [], // Add empty documentIds array
          submissionMethod: 'APP', // Add default submissionMethod
        },
      };
    },
  },
};

/**
 * ===== EXPORT GROUPS =====
 */

// Group all events by journey
export const healthEvents = {
  METRIC_RECORDED: {
    v050: healthMetricRecordedV050,
    v060: healthMetricRecordedV060,
    v070: healthMetricRecordedV070,
    v100: healthMetricRecordedV100,
  },
  GOAL_ACHIEVED: {
    v050: healthGoalAchievedV050,
    v070: healthGoalAchievedV070,
    v100: healthGoalAchievedV100,
  },
  DEVICE_CONNECTED: {
    v060: healthDeviceConnectedV060,
    v080: healthDeviceConnectedV080,
    v100: healthDeviceConnectedV100,
  },
};

export const careEvents = {
  APPOINTMENT_BOOKED: {
    v050: careAppointmentBookedV050,
    v070: careAppointmentBookedV070,
    v100: careAppointmentBookedV100,
  },
  MEDICATION_ADHERENCE_STREAK: {
    v060: careMedicationAdherenceStreakV060,
    v080: careMedicationAdherenceStreakV080,
    v100: careMedicationAdherenceStreakV100,
  },
  TELEMEDICINE_SESSION_COMPLETED: {
    v050: careTelemedicineSessionCompletedV050,
    v090: careTelemedicineSessionCompletedV090,
    v100: careTelemedicineSessionCompletedV100,
  },
};

export const planEvents = {
  CLAIM_SUBMITTED: {
    v050: planClaimSubmittedV050,
    v080: planClaimSubmittedV080,
    v100: planClaimSubmittedV100,
  },
  BENEFIT_UTILIZED: {
    v060: planBenefitUtilizedV060,
    v090: planBenefitUtilizedV090,
    v100: planBenefitUtilizedV100,
  },
  REWARD_REDEEMED: {
    v070: planRewardRedeemedV070,
    v090: planRewardRedeemedV090,
    v100: planRewardRedeemedV100,
  },
};

// Group all migrations
export const migrations = {
  HEALTH_METRIC_RECORDED: healthMetricRecordedMigrations,
  CARE_APPOINTMENT_BOOKED: careAppointmentBookedMigrations,
  PLAN_CLAIM_SUBMITTED: planClaimSubmittedMigrations,
};

// Helper function to get all events of a specific version
export const getEventsByVersion = (version: string): Record<string, BaseEvent<any>> => {
  const result: Record<string, BaseEvent<any>> = {};
  
  // Process health events
  Object.entries(healthEvents).forEach(([eventType, versions]) => {
    const versionKey = `v${version.replace(/\./g, '')}`;
    if (versions[versionKey]) {
      result[`HEALTH_${eventType}`] = versions[versionKey];
    }
  });
  
  // Process care events
  Object.entries(careEvents).forEach(([eventType, versions]) => {
    const versionKey = `v${version.replace(/\./g, '')}`;
    if (versions[versionKey]) {
      result[`CARE_${eventType}`] = versions[versionKey];
    }
  });
  
  // Process plan events
  Object.entries(planEvents).forEach(([eventType, versions]) => {
    const versionKey = `v${version.replace(/\./g, '')}`;
    if (versions[versionKey]) {
      result[`PLAN_${eventType}`] = versions[versionKey];
    }
  });
  
  return result;
};

// Helper function to get all events with breaking changes between versions
export const getBreakingChanges = (): Array<{
  eventType: string;
  fromVersion: string;
  toVersion: string;
  source: BaseEvent<any>;
  target: BaseEvent<any>;
  changes: string[];
}> => [
  {
    eventType: HealthEventType.METRIC_RECORDED,
    fromVersion: '0.7.0',
    toVersion: '1.0.0',
    source: healthMetricRecordedV070,
    target: healthMetricRecordedV100,
    changes: [
      'Renamed field "value" to "metricValue"',
      'Made "unit" field required',
    ],
  },
  {
    eventType: HealthEventType.GOAL_ACHIEVED,
    fromVersion: '0.7.0',
    toVersion: '1.0.0',
    source: healthGoalAchievedV070,
    target: healthGoalAchievedV100,
    changes: [
      'Changed "achievedValue" from number to object with value and unit',
      'Changed "targetValue" from number to object with value and unit',
    ],
  },
  {
    eventType: HealthEventType.DEVICE_CONNECTED,
    fromVersion: '0.8.0',
    toVersion: '1.0.0',
    source: healthDeviceConnectedV080,
    target: healthDeviceConnectedV100,
    changes: [
      'Restructured "deviceConnection" to include more device details',
      'Added required "supportedMetrics" array',
    ],
  },
  {
    eventType: CareEventType.APPOINTMENT_BOOKED,
    fromVersion: '0.7.0',
    toVersion: '1.0.0',
    source: careAppointmentBookedV070,
    target: careAppointmentBookedV100,
    changes: [
      'Changed "providerId" to required "provider" object with detailed information',
    ],
  },
  {
    eventType: CareEventType.MEDICATION_ADHERENCE_STREAK,
    fromVersion: '0.8.0',
    toVersion: '1.0.0',
    source: careMedicationAdherenceStreakV080,
    target: careMedicationAdherenceStreakV100,
    changes: [
      'Changed calculation method for "streakDays"',
      'Added required fields: "dosesScheduled", "dosesTaken", "dosesMissed"',
    ],
  },
  {
    eventType: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    fromVersion: '0.9.0',
    toVersion: '1.0.0',
    source: careTelemedicineSessionCompletedV090,
    target: careTelemedicineSessionCompletedV100,
    changes: [
      'Restructured time fields into "timing" object',
      'Added required "sessionQuality" field',
    ],
  },
  {
    eventType: PlanEventType.CLAIM_SUBMITTED,
    fromVersion: '0.8.0',
    toVersion: '1.0.0',
    source: planClaimSubmittedV080,
    target: planClaimSubmittedV100,
    changes: [
      'Changed "amount" from number to structured object with value and currency',
      'Added required "documentIds" array',
    ],
  },
  {
    eventType: PlanEventType.BENEFIT_UTILIZED,
    fromVersion: '0.9.0',
    toVersion: '1.0.0',
    source: planBenefitUtilizedV090,
    target: planBenefitUtilizedV100,
    changes: [
      'Added required "utilizationId" field',
      'Changed optional fields to required: "serviceProvider", "amount", "remainingCoverage"',
    ],
  },
  {
    eventType: PlanEventType.REWARD_REDEEMED,
    fromVersion: '0.9.0',
    toVersion: '1.0.0',
    source: planRewardRedeemedV090,
    target: planRewardRedeemedV100,
    changes: [
      'Changed "pointValue" to structured "points" object with history',
      'Added required "expirationDate" and "redemptionCode" fields',
    ],
  },
];

// Helper function to get all events with non-breaking changes between versions
export const getNonBreakingChanges = (): Array<{
  eventType: string;
  fromVersion: string;
  toVersion: string;
  source: BaseEvent<any>;
  target: BaseEvent<any>;
  changes: string[];
}> => [
  {
    eventType: HealthEventType.METRIC_RECORDED,
    fromVersion: '0.5.0',
    toVersion: '0.6.0',
    source: healthMetricRecordedV050,
    target: healthMetricRecordedV060,
    changes: [
      'Added optional "source" field',
    ],
  },
  {
    eventType: HealthEventType.METRIC_RECORDED,
    fromVersion: '0.6.0',
    toVersion: '0.7.0',
    source: healthMetricRecordedV060,
    target: healthMetricRecordedV070,
    changes: [
      'Added optional "previousValue" field',
      'Added optional "change" field',
    ],
  },
  {
    eventType: HealthEventType.GOAL_ACHIEVED,
    fromVersion: '0.5.0',
    toVersion: '0.7.0',
    source: healthGoalAchievedV050,
    target: healthGoalAchievedV070,
    changes: [
      'Added optional "daysToAchieve" field',
    ],
  },
  {
    eventType: HealthEventType.DEVICE_CONNECTED,
    fromVersion: '0.6.0',
    toVersion: '0.8.0',
    source: healthDeviceConnectedV060,
    target: healthDeviceConnectedV080,
    changes: [
      'Added optional "deviceManufacturer" field',
    ],
  },
  {
    eventType: CareEventType.APPOINTMENT_BOOKED,
    fromVersion: '0.5.0',
    toVersion: '0.7.0',
    source: careAppointmentBookedV050,
    target: careAppointmentBookedV070,
    changes: [
      'Added optional "isUrgent" field',
    ],
  },
  {
    eventType: CareEventType.MEDICATION_ADHERENCE_STREAK,
    fromVersion: '0.6.0',
    toVersion: '0.8.0',
    source: careMedicationAdherenceStreakV060,
    target: careMedicationAdherenceStreakV080,
    changes: [
      'Added optional "adherencePercentage" field',
    ],
  },
  {
    eventType: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    fromVersion: '0.5.0',
    toVersion: '0.9.0',
    source: careTelemedicineSessionCompletedV050,
    target: careTelemedicineSessionCompletedV090,
    changes: [
      'Added optional "technicalIssues" field',
    ],
  },
  {
    eventType: PlanEventType.CLAIM_SUBMITTED,
    fromVersion: '0.5.0',
    toVersion: '0.8.0',
    source: planClaimSubmittedV050,
    target: planClaimSubmittedV080,
    changes: [
      'Added optional "isComplete" field',
    ],
  },
  {
    eventType: PlanEventType.BENEFIT_UTILIZED,
    fromVersion: '0.6.0',
    toVersion: '0.9.0',
    source: planBenefitUtilizedV060,
    target: planBenefitUtilizedV090,
    changes: [
      'Added optional "isFirstUtilization" field',
    ],
  },
  {
    eventType: PlanEventType.REWARD_REDEEMED,
    fromVersion: '0.7.0',
    toVersion: '0.9.0',
    source: planRewardRedeemedV070,
    target: planRewardRedeemedV090,
    changes: [
      'Added optional "isPremiumReward" field',
    ],
  },
];