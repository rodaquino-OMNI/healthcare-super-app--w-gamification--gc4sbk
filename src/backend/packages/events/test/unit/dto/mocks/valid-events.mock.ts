/**
 * @file valid-events.mock.ts
 * @description Provides a comprehensive collection of valid event mock data from all journeys
 * to support positive test scenarios. This file aggregates well-formed events that pass all
 * validation rules, providing a reliable reference for testing the happy path of event
 * processing pipelines.
 */

import { EventType } from '../../../../src/dto/event-types.enum';
import { EventMetadataDto, EventPriority } from '../../../../src/dto/event-metadata.dto';

// Common test UUIDs for consistency
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_PROVIDER_ID = '223e4567-e89b-12d3-a456-426614174001';
const TEST_DEVICE_ID = '323e4567-e89b-12d3-a456-426614174002';
const TEST_GOAL_ID = '423e4567-e89b-12d3-a456-426614174003';
const TEST_APPOINTMENT_ID = '523e4567-e89b-12d3-a456-426614174004';
const TEST_MEDICATION_ID = '623e4567-e89b-12d3-a456-426614174005';
const TEST_CLAIM_ID = '723e4567-e89b-12d3-a456-426614174006';
const TEST_BENEFIT_ID = '823e4567-e89b-12d3-a456-426614174007';
const TEST_PLAN_ID = '923e4567-e89b-12d3-a456-426614174008';
const TEST_ACHIEVEMENT_ID = 'a23e4567-e89b-12d3-a456-426614174009';
const TEST_QUEST_ID = 'b23e4567-e89b-12d3-a456-426614174010';

// Common test timestamps for consistency
const TEST_TIMESTAMP = new Date().toISOString();
const TEST_PAST_TIMESTAMP = new Date(Date.now() - 86400000).toISOString(); // 1 day ago

// Common test metadata
const TEST_METADATA = EventMetadataDto.createWithCorrelation();

/**
 * Valid Health Journey Events
 */
export const validHealthEvents = {
  /**
   * Valid HEALTH_METRIC_RECORDED event for heart rate
   */
  heartRateRecorded: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      timestamp: TEST_TIMESTAMP,
      deviceId: TEST_DEVICE_ID,
      source: 'MANUAL_ENTRY'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_METRIC_RECORDED event for blood pressure
   */
  bloodPressureRecorded: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      metricType: 'BLOOD_PRESSURE',
      value: {
        systolic: 120,
        diastolic: 80
      },
      unit: 'mmHg',
      timestamp: TEST_TIMESTAMP,
      deviceId: TEST_DEVICE_ID,
      source: 'DEVICE'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_METRIC_RECORDED event for steps
   */
  stepsRecorded: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      metricType: 'STEPS',
      value: 8500,
      unit: 'steps',
      timestamp: TEST_TIMESTAMP,
      deviceId: TEST_DEVICE_ID,
      source: 'DEVICE'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_METRIC_RECORDED event for weight
   */
  weightRecorded: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      metricType: 'WEIGHT',
      value: 70.5,
      unit: 'kg',
      timestamp: TEST_TIMESTAMP,
      deviceId: TEST_DEVICE_ID,
      source: 'MANUAL_ENTRY'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_METRIC_RECORDED event for blood glucose
   */
  bloodGlucoseRecorded: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      metricType: 'BLOOD_GLUCOSE',
      value: 95,
      unit: 'mg/dL',
      timestamp: TEST_TIMESTAMP,
      deviceId: TEST_DEVICE_ID,
      source: 'DEVICE',
      mealContext: 'FASTING'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_METRIC_RECORDED event for sleep
   */
  sleepRecorded: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      metricType: 'SLEEP',
      value: {
        totalDuration: 7.5,
        deepSleep: 2.3,
        lightSleep: 4.1,
        remSleep: 1.1
      },
      unit: 'hours',
      timestamp: TEST_TIMESTAMP,
      deviceId: TEST_DEVICE_ID,
      source: 'DEVICE'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_GOAL_ACHIEVED event
   */
  goalAchieved: {
    type: EventType.HEALTH_GOAL_ACHIEVED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      goalId: TEST_GOAL_ID,
      goalType: 'STEPS',
      targetValue: 10000,
      achievedValue: 10250,
      timestamp: TEST_TIMESTAMP,
      streakCount: 3
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_GOAL_CREATED event
   */
  goalCreated: {
    type: EventType.HEALTH_GOAL_CREATED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      goalId: TEST_GOAL_ID,
      goalType: 'WEIGHT',
      targetValue: 68,
      startValue: 72,
      unit: 'kg',
      startDate: TEST_TIMESTAMP,
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
      recurrence: 'NONE'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_GOAL_PROGRESS_UPDATED event
   */
  goalProgressUpdated: {
    type: EventType.HEALTH_GOAL_PROGRESS_UPDATED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      goalId: TEST_GOAL_ID,
      currentValue: 70.2,
      previousValue: 71.5,
      percentComplete: 45,
      timestamp: TEST_TIMESTAMP
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_DEVICE_CONNECTED event
   */
  deviceConnected: {
    type: EventType.HEALTH_DEVICE_CONNECTED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      deviceId: TEST_DEVICE_ID,
      deviceType: 'Smartwatch',
      manufacturer: 'Garmin',
      model: 'Forerunner 245',
      connectionDate: TEST_TIMESTAMP,
      supportedMetrics: ['HEART_RATE', 'STEPS', 'SLEEP']
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_DEVICE_SYNCED event
   */
  deviceSynced: {
    type: EventType.HEALTH_DEVICE_SYNCED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      deviceId: TEST_DEVICE_ID,
      deviceType: 'Smartwatch',
      syncDate: TEST_TIMESTAMP,
      metricCount: 5,
      syncDuration: 12.5, // seconds
      metrics: ['HEART_RATE', 'STEPS', 'SLEEP']
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid HEALTH_ASSESSMENT_COMPLETED event
   */
  assessmentCompleted: {
    type: EventType.HEALTH_ASSESSMENT_COMPLETED,
    userId: TEST_USER_ID,
    journey: 'health',
    timestamp: TEST_TIMESTAMP,
    data: {
      assessmentId: crypto.randomUUID(),
      assessmentType: 'GENERAL_HEALTH',
      score: 85,
      completionDate: TEST_TIMESTAMP,
      duration: 420, // seconds
      recommendations: [
        {
          category: 'NUTRITION',
          text: 'Increase vegetable intake to 5 servings per day'
        },
        {
          category: 'EXERCISE',
          text: 'Add 2 strength training sessions per week'
        }
      ]
    },
    metadata: TEST_METADATA
  }
};

/**
 * Valid Care Journey Events
 */
export const validCareEvents = {
  /**
   * Valid CARE_APPOINTMENT_BOOKED event
   */
  appointmentBooked: {
    type: EventType.CARE_APPOINTMENT_BOOKED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      appointmentId: TEST_APPOINTMENT_ID,
      providerId: TEST_PROVIDER_ID,
      specialtyType: 'Cardiologia',
      date: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days from now
      time: '14:30',
      duration: 30, // minutes
      location: {
        type: 'IN_PERSON',
        address: 'Av. Paulista, 1000, São Paulo, SP'
      },
      reason: 'Consulta de rotina'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_APPOINTMENT_ATTENDED event
   */
  appointmentAttended: {
    type: EventType.CARE_APPOINTMENT_ATTENDED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      appointmentId: TEST_APPOINTMENT_ID,
      providerId: TEST_PROVIDER_ID,
      attendanceDate: TEST_TIMESTAMP,
      duration: 35, // minutes
      rating: 4.5,
      feedback: 'Ótimo atendimento, médico muito atencioso'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_APPOINTMENT_CANCELLED event
   */
  appointmentCancelled: {
    type: EventType.CARE_APPOINTMENT_CANCELLED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      appointmentId: TEST_APPOINTMENT_ID,
      providerId: TEST_PROVIDER_ID,
      cancellationReason: 'SCHEDULE_CONFLICT',
      cancellationDate: TEST_TIMESTAMP,
      rescheduled: true,
      newAppointmentId: crypto.randomUUID()
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_MEDICATION_TAKEN event
   */
  medicationTaken: {
    type: EventType.CARE_MEDICATION_TAKEN,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      medicationId: TEST_MEDICATION_ID,
      medicationName: 'Losartana',
      dosage: '50mg',
      timestamp: TEST_TIMESTAMP,
      adherenceStreak: 7, // days
      scheduledTime: '08:00',
      takenOnTime: true
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_MEDICATION_ADDED event
   */
  medicationAdded: {
    type: EventType.CARE_MEDICATION_ADDED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      medicationId: TEST_MEDICATION_ID,
      medicationName: 'Atorvastatina',
      dosage: '20mg',
      frequency: 'DAILY',
      times: ['20:00'],
      startDate: TEST_TIMESTAMP,
      endDate: new Date(Date.now() + 90 * 86400000).toISOString(), // 90 days from now
      instructions: 'Tomar após a refeição da noite',
      prescribedBy: TEST_PROVIDER_ID
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_TELEMEDICINE_STARTED event
   */
  telemedicineStarted: {
    type: EventType.CARE_TELEMEDICINE_STARTED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      sessionId: crypto.randomUUID(),
      providerId: TEST_PROVIDER_ID,
      specialtyType: 'Psiquiatria',
      startTime: TEST_TIMESTAMP,
      appointmentId: TEST_APPOINTMENT_ID,
      connectionQuality: 'GOOD'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_TELEMEDICINE_COMPLETED event
   */
  telemedicineCompleted: {
    type: EventType.CARE_TELEMEDICINE_COMPLETED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      sessionId: crypto.randomUUID(),
      providerId: TEST_PROVIDER_ID,
      duration: 25, // minutes
      endTime: TEST_TIMESTAMP,
      connectionQuality: 'GOOD',
      technicalIssues: false,
      rating: 5
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_PLAN_RECEIVED event
   */
  planReceived: {
    type: EventType.CARE_PLAN_RECEIVED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      planId: crypto.randomUUID(),
      providerId: TEST_PROVIDER_ID,
      planType: 'TREATMENT',
      startDate: TEST_TIMESTAMP,
      endDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
      itemCount: 5,
      condition: 'Hipertensão'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_PLAN_ITEM_COMPLETED event
   */
  planItemCompleted: {
    type: EventType.CARE_PLAN_ITEM_COMPLETED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      planId: crypto.randomUUID(),
      itemId: crypto.randomUUID(),
      itemType: 'MEDICATION',
      completionDate: TEST_TIMESTAMP,
      notes: 'Completado conforme prescrito'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid CARE_SYMPTOM_CHECK_COMPLETED event
   */
  symptomCheckCompleted: {
    type: EventType.CARE_SYMPTOM_CHECK_COMPLETED,
    userId: TEST_USER_ID,
    journey: 'care',
    timestamp: TEST_TIMESTAMP,
    data: {
      checkerId: crypto.randomUUID(),
      symptoms: ['headache', 'fatigue', 'fever'],
      recommendedAction: 'CONSULT_DOCTOR',
      severity: 'MODERATE',
      timestamp: TEST_TIMESTAMP,
      duration: 180 // seconds
    },
    metadata: TEST_METADATA
  }
};

/**
 * Valid Plan Journey Events
 */
export const validPlanEvents = {
  /**
   * Valid PLAN_CLAIM_SUBMITTED event
   */
  claimSubmitted: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: TEST_CLAIM_ID,
      claimType: 'Consulta Médica',
      amount: 250.00,
      currency: 'BRL',
      serviceDate: TEST_PAST_TIMESTAMP,
      submissionDate: TEST_TIMESTAMP,
      provider: {
        name: 'Clínica São Paulo',
        id: TEST_PROVIDER_ID
      },
      documents: [
        {
          type: 'RECEIPT',
          fileId: crypto.randomUUID(),
          fileName: 'recibo_consulta.pdf'
        },
        {
          type: 'MEDICAL_REPORT',
          fileId: crypto.randomUUID(),
          fileName: 'relatorio_medico.pdf'
        }
      ]
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_CLAIM_APPROVED event
   */
  claimApproved: {
    type: EventType.PLAN_CLAIM_APPROVED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: TEST_CLAIM_ID,
      approvalDate: TEST_TIMESTAMP,
      approvedAmount: 225.00,
      currency: 'BRL',
      paymentDate: new Date(Date.now() + 5 * 86400000).toISOString(), // 5 days from now
      paymentMethod: 'BANK_TRANSFER',
      bankAccount: {
        bank: 'Itaú',
        accountType: 'CHECKING',
        lastFour: '4321'
      }
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_BENEFIT_VIEWED event
   */
  benefitViewed: {
    type: EventType.PLAN_BENEFIT_VIEWED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      benefitId: TEST_BENEFIT_ID,
      benefitType: 'DENTAL',
      viewDate: TEST_TIMESTAMP,
      viewDuration: 45, // seconds
      deviceType: 'MOBILE'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_BENEFIT_UTILIZED event
   */
  benefitUtilized: {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      benefitId: TEST_BENEFIT_ID,
      benefitType: 'GYM_MEMBERSHIP',
      utilizationDate: TEST_TIMESTAMP,
      provider: 'Academia SmartFit',
      location: 'São Paulo - Paulista',
      value: 120.00,
      currency: 'BRL'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_SELECTED event
   */
  planSelected: {
    type: EventType.PLAN_SELECTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      planId: TEST_PLAN_ID,
      planType: 'Premium',
      coverageLevel: 'FAMILY',
      startDate: new Date(Date.now() + 15 * 86400000).toISOString(), // 15 days from now
      selectionDate: TEST_TIMESTAMP,
      monthlyPremium: 850.00,
      currency: 'BRL',
      dependents: 2,
      previousPlanId: crypto.randomUUID()
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_COMPARISON_PERFORMED event
   */
  planComparisonPerformed: {
    type: EventType.PLAN_COMPARISON_PERFORMED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      planIds: [TEST_PLAN_ID, crypto.randomUUID(), crypto.randomUUID()],
      comparisonDate: TEST_TIMESTAMP,
      selectedFilters: ['PRICE', 'COVERAGE', 'NETWORK'],
      comparisonDuration: 180, // seconds
      selectedPlanId: TEST_PLAN_ID
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_DOCUMENT_UPLOADED event
   */
  documentUploaded: {
    type: EventType.PLAN_DOCUMENT_UPLOADED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      documentId: crypto.randomUUID(),
      documentType: 'MEDICAL_CERTIFICATE',
      uploadDate: TEST_TIMESTAMP,
      fileSize: 1250000, // bytes
      fileName: 'atestado_medico.pdf',
      mimeType: 'application/pdf',
      relatedEntityId: TEST_CLAIM_ID,
      relatedEntityType: 'CLAIM'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_REWARD_REDEEMED event
   */
  rewardRedeemed: {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      rewardId: crypto.randomUUID(),
      rewardType: 'DISCOUNT',
      pointsCost: 500,
      redemptionDate: TEST_TIMESTAMP,
      value: 50.00,
      currency: 'BRL',
      expirationDate: new Date(Date.now() + 90 * 86400000).toISOString(), // 90 days from now
      category: 'PHARMACY'
    },
    metadata: TEST_METADATA
  }
};

/**
 * Valid Cross-Journey Events
 */
export const validCrossJourneyEvents = {
  /**
   * Valid PROFILE_COMPLETED event
   */
  profileCompleted: {
    type: EventType.PROFILE_COMPLETED,
    userId: TEST_USER_ID,
    journey: 'common',
    timestamp: TEST_TIMESTAMP,
    data: {
      completionDate: TEST_TIMESTAMP,
      fieldsCompleted: [
        'PERSONAL_INFO',
        'CONTACT_INFO',
        'HEALTH_PROFILE',
        'INSURANCE_INFO'
      ],
      percentComplete: 100,
      missingFields: []
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid ACHIEVEMENT_EARNED event
   */
  achievementEarned: {
    type: EventType.ACHIEVEMENT_EARNED,
    userId: TEST_USER_ID,
    journey: 'gamification',
    timestamp: TEST_TIMESTAMP,
    data: {
      achievementId: TEST_ACHIEVEMENT_ID,
      achievementType: 'health-check-streak',
      title: 'Monitor de Saúde',
      level: 2,
      earnedDate: TEST_TIMESTAMP,
      xpAwarded: 150,
      description: 'Registre suas métricas de saúde por 7 dias consecutivos',
      icon: 'heart-pulse'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid QUEST_COMPLETED event
   */
  questCompleted: {
    type: EventType.QUEST_COMPLETED,
    userId: TEST_USER_ID,
    journey: 'gamification',
    timestamp: TEST_TIMESTAMP,
    data: {
      questId: TEST_QUEST_ID,
      questType: 'WEEKLY',
      title: 'Semana Saudável',
      completionDate: TEST_TIMESTAMP,
      rewardId: crypto.randomUUID(),
      xpAwarded: 300,
      steps: [
        {
          stepId: crypto.randomUUID(),
          description: 'Registre seus passos por 5 dias',
          completed: true,
          completionDate: TEST_PAST_TIMESTAMP
        },
        {
          stepId: crypto.randomUUID(),
          description: 'Complete uma consulta médica',
          completed: true,
          completionDate: TEST_TIMESTAMP
        }
      ]
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid LEVEL_UP event
   */
  levelUp: {
    type: EventType.LEVEL_UP,
    userId: TEST_USER_ID,
    journey: 'gamification',
    timestamp: TEST_TIMESTAMP,
    data: {
      oldLevel: 3,
      newLevel: 4,
      xpTotal: 2500,
      levelUpDate: TEST_TIMESTAMP,
      rewards: [
        {
          rewardId: crypto.randomUUID(),
          rewardType: 'BADGE',
          name: 'Nível 4 Desbloqueado'
        },
        {
          rewardId: crypto.randomUUID(),
          rewardType: 'POINTS',
          value: 100
        }
      ],
      unlockedFeatures: ['PREMIUM_CONTENT']
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid JOURNEY_STARTED event
   */
  journeyStarted: {
    type: EventType.JOURNEY_STARTED,
    userId: TEST_USER_ID,
    journey: 'common',
    timestamp: TEST_TIMESTAMP,
    data: {
      journeyType: 'health',
      actionType: 'FIRST_METRIC',
      completionDate: TEST_TIMESTAMP,
      entryPoint: 'HOME_SCREEN'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid JOURNEY_MILESTONE_REACHED event
   */
  journeyMilestoneReached: {
    type: EventType.JOURNEY_MILESTONE_REACHED,
    userId: TEST_USER_ID,
    journey: 'common',
    timestamp: TEST_TIMESTAMP,
    data: {
      journeyType: 'care',
      milestoneId: crypto.randomUUID(),
      milestoneType: 'FIRST_APPOINTMENT',
      completionDate: TEST_TIMESTAMP,
      xpAwarded: 200
    },
    metadata: TEST_METADATA
  }
};

/**
 * All valid events combined for easy access
 */
export const validEvents = {
  health: validHealthEvents,
  care: validCareEvents,
  plan: validPlanEvents,
  crossJourney: validCrossJourneyEvents
};

/**
 * Flat array of all valid events for testing
 */
export const allValidEvents = [
  ...Object.values(validHealthEvents),
  ...Object.values(validCareEvents),
  ...Object.values(validPlanEvents),
  ...Object.values(validCrossJourneyEvents)
];

/**
 * Creates a valid event with custom properties
 * @param eventType The type of event to create
 * @param customProps Custom properties to override defaults
 * @returns A valid event with the specified properties
 */
export function createValidEvent(eventType: EventType, customProps: Record<string, any> = {}) {
  // Find a matching event template based on the event type
  const allEvents = allValidEvents as any[];
  const templateEvent = allEvents.find(event => event.type === eventType);
  
  if (!templateEvent) {
    throw new Error(`No template found for event type: ${eventType}`);
  }
  
  // Create a deep copy of the template and merge with custom properties
  const event = JSON.parse(JSON.stringify(templateEvent));
  return { ...event, ...customProps };
}

/**
 * Creates a valid event with the specified journey
 * @param journey The journey to create an event for ('health', 'care', 'plan')
 * @param customProps Custom properties to override defaults
 * @returns A valid event for the specified journey
 */
export function createValidEventForJourney(journey: 'health' | 'care' | 'plan', customProps: Record<string, any> = {}) {
  let eventType: EventType;
  
  // Select a representative event type for the journey
  switch (journey) {
    case 'health':
      eventType = EventType.HEALTH_METRIC_RECORDED;
      break;
    case 'care':
      eventType = EventType.CARE_APPOINTMENT_BOOKED;
      break;
    case 'plan':
      eventType = EventType.PLAN_CLAIM_SUBMITTED;
      break;
    default:
      throw new Error(`Invalid journey: ${journey}`);
  }
  
  return createValidEvent(eventType, { journey, ...customProps });
}

export default validEvents;