/**
 * @file care-events.ts
 * @description Test fixtures for Care journey events including appointment booking, medication adherence,
 * telemedicine sessions, and care plan progress. These fixtures provide realistic test data for
 * care-related events to facilitate testing of gamification rules, achievement processing, and
 * notifications related to the Care journey.
 */

import { BaseEvent, createEvent } from '../../src/interfaces/base-event.interface';
import {
  CareEventType,
  ICareAppointmentBookedPayload,
  ICareAppointmentCompletedPayload,
  ICareAppointmentCanceledPayload,
  ICareMedicationAddedPayload,
  ICareMedicationTakenPayload,
  ICareMedicationAdherenceStreakPayload,
  ICareTelemedicineSessionStartedPayload,
  ICareTelemedicineSessionCompletedPayload,
  ICareProviderRatedPayload,
  ICareSymptomCheckCompletedPayload,
  ICarePlanCreatedPayload,
  ICarePlanUpdatedPayload,
  ICarePlanCompletedPayload,
  JourneyType
} from '../../src/interfaces/journey-events.interface';
import { AppointmentStatus, AppointmentType } from '@austa/interfaces/journey/care';

// Common test data
const TEST_USER_ID = 'user_12345';
const TEST_PROVIDER_ID = 'provider_67890';
const TEST_SOURCE = 'care-service';
const TEST_VERSION = '1.0.0';

/**
 * Creates a base Care journey event with common properties
 */
export function createCareEvent<T>(
  type: CareEventType,
  payload: T,
  options?: {
    userId?: string;
    eventId?: string;
    timestamp?: string;
    source?: string;
    version?: string;
    metadata?: Record<string, any>;
  }
): BaseEvent<T> {
  return createEvent(
    type,
    options?.source || TEST_SOURCE,
    payload,
    {
      userId: options?.userId || TEST_USER_ID,
      journey: JourneyType.CARE,
      eventId: options?.eventId || `care-event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: options?.timestamp || new Date().toISOString(),
      version: options?.version || TEST_VERSION,
      metadata: options?.metadata
    }
  );
}

// ===== APPOINTMENT EVENTS =====

/**
 * Test fixture for CARE_APPOINTMENT_BOOKED event
 */
export const appointmentBookedEvent = createCareEvent<ICareAppointmentBookedPayload>(
  CareEventType.APPOINTMENT_BOOKED,
  {
    appointment: {
      id: 'appointment_12345',
      userId: TEST_USER_ID,
      providerId: TEST_PROVIDER_ID,
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.IN_PERSON,
      scheduledAt: new Date('2023-06-15T14:30:00Z'),
      createdAt: new Date('2023-06-01T10:15:00Z'),
      updatedAt: new Date('2023-06-01T10:15:00Z'),
      notes: 'Regular check-up appointment',
      location: 'Clínica AUSTA - Unidade Centro',
      specialty: 'Cardiologia'
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: TEST_PROVIDER_ID,
    scheduledDate: '2023-06-15T14:30:00Z',
    isFirstAppointment: false,
    isUrgent: false
  },
  {
    eventId: 'care-event-appointment-booked-12345',
    timestamp: '2023-06-01T10:15:00Z'
  }
);

/**
 * Test fixture for CARE_APPOINTMENT_BOOKED event (urgent appointment)
 */
export const urgentAppointmentBookedEvent = createCareEvent<ICareAppointmentBookedPayload>(
  CareEventType.APPOINTMENT_BOOKED,
  {
    appointment: {
      id: 'appointment_67890',
      userId: TEST_USER_ID,
      providerId: TEST_PROVIDER_ID,
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.IN_PERSON,
      scheduledAt: new Date('2023-06-05T09:00:00Z'),
      createdAt: new Date('2023-06-04T16:30:00Z'),
      updatedAt: new Date('2023-06-04T16:30:00Z'),
      notes: 'Urgent appointment due to chest pain',
      location: 'Clínica AUSTA - Unidade Centro',
      specialty: 'Cardiologia'
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: TEST_PROVIDER_ID,
    scheduledDate: '2023-06-05T09:00:00Z',
    isFirstAppointment: false,
    isUrgent: true
  },
  {
    eventId: 'care-event-urgent-appointment-booked-67890',
    timestamp: '2023-06-04T16:30:00Z'
  }
);

/**
 * Test fixture for CARE_APPOINTMENT_BOOKED event (first appointment)
 */
export const firstAppointmentBookedEvent = createCareEvent<ICareAppointmentBookedPayload>(
  CareEventType.APPOINTMENT_BOOKED,
  {
    appointment: {
      id: 'appointment_54321',
      userId: 'user_new_98765',
      providerId: TEST_PROVIDER_ID,
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.IN_PERSON,
      scheduledAt: new Date('2023-06-20T11:00:00Z'),
      createdAt: new Date('2023-06-02T09:45:00Z'),
      updatedAt: new Date('2023-06-02T09:45:00Z'),
      notes: 'Initial consultation',
      location: 'Clínica AUSTA - Unidade Redentora',
      specialty: 'Clínica Geral'
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: TEST_PROVIDER_ID,
    scheduledDate: '2023-06-20T11:00:00Z',
    isFirstAppointment: true,
    isUrgent: false
  },
  {
    eventId: 'care-event-first-appointment-booked-54321',
    timestamp: '2023-06-02T09:45:00Z',
    userId: 'user_new_98765'
  }
);

/**
 * Test fixture for CARE_APPOINTMENT_BOOKED event (telemedicine appointment)
 */
export const telemedicineAppointmentBookedEvent = createCareEvent<ICareAppointmentBookedPayload>(
  CareEventType.APPOINTMENT_BOOKED,
  {
    appointment: {
      id: 'appointment_24680',
      userId: TEST_USER_ID,
      providerId: 'provider_13579',
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.TELEMEDICINE,
      scheduledAt: new Date('2023-06-10T16:00:00Z'),
      createdAt: new Date('2023-06-03T14:20:00Z'),
      updatedAt: new Date('2023-06-03T14:20:00Z'),
      notes: 'Follow-up consultation via telemedicine',
      specialty: 'Dermatologia'
    },
    appointmentType: AppointmentType.TELEMEDICINE,
    providerId: 'provider_13579',
    scheduledDate: '2023-06-10T16:00:00Z',
    isFirstAppointment: false,
    isUrgent: false
  },
  {
    eventId: 'care-event-telemedicine-appointment-booked-24680',
    timestamp: '2023-06-03T14:20:00Z'
  }
);

/**
 * Test fixture for CARE_APPOINTMENT_COMPLETED event
 */
export const appointmentCompletedEvent = createCareEvent<ICareAppointmentCompletedPayload>(
  CareEventType.APPOINTMENT_COMPLETED,
  {
    appointment: {
      id: 'appointment_12345',
      userId: TEST_USER_ID,
      providerId: TEST_PROVIDER_ID,
      status: AppointmentStatus.COMPLETED,
      type: AppointmentType.IN_PERSON,
      scheduledAt: new Date('2023-06-15T14:30:00Z'),
      completedAt: new Date('2023-06-15T15:15:00Z'),
      createdAt: new Date('2023-06-01T10:15:00Z'),
      updatedAt: new Date('2023-06-15T15:15:00Z'),
      notes: 'Regular check-up appointment. Patient in good health.',
      location: 'Clínica AUSTA - Unidade Centro',
      specialty: 'Cardiologia'
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: TEST_PROVIDER_ID,
    completionDate: '2023-06-15T15:15:00Z',
    duration: 45,
    followUpScheduled: true
  },
  {
    eventId: 'care-event-appointment-completed-12345',
    timestamp: '2023-06-15T15:15:00Z'
  }
);

/**
 * Test fixture for CARE_APPOINTMENT_COMPLETED event (telemedicine)
 */
export const telemedicineAppointmentCompletedEvent = createCareEvent<ICareAppointmentCompletedPayload>(
  CareEventType.APPOINTMENT_COMPLETED,
  {
    appointment: {
      id: 'appointment_24680',
      userId: TEST_USER_ID,
      providerId: 'provider_13579',
      status: AppointmentStatus.COMPLETED,
      type: AppointmentType.TELEMEDICINE,
      scheduledAt: new Date('2023-06-10T16:00:00Z'),
      completedAt: new Date('2023-06-10T16:25:00Z'),
      createdAt: new Date('2023-06-03T14:20:00Z'),
      updatedAt: new Date('2023-06-10T16:25:00Z'),
      notes: 'Follow-up consultation via telemedicine. Condition improving.',
      specialty: 'Dermatologia'
    },
    appointmentType: AppointmentType.TELEMEDICINE,
    providerId: 'provider_13579',
    completionDate: '2023-06-10T16:25:00Z',
    duration: 25,
    followUpScheduled: false
  },
  {
    eventId: 'care-event-telemedicine-appointment-completed-24680',
    timestamp: '2023-06-10T16:25:00Z'
  }
);

/**
 * Test fixture for CARE_APPOINTMENT_CANCELED event
 */
export const appointmentCanceledEvent = createCareEvent<ICareAppointmentCanceledPayload>(
  CareEventType.APPOINTMENT_CANCELED,
  {
    appointmentId: 'appointment_67890',
    appointmentType: AppointmentType.IN_PERSON,
    providerId: TEST_PROVIDER_ID,
    cancellationDate: '2023-06-04T18:45:00Z',
    rescheduled: true,
    reason: 'Patient requested rescheduling due to personal conflict'
  },
  {
    eventId: 'care-event-appointment-canceled-67890',
    timestamp: '2023-06-04T18:45:00Z'
  }
);

/**
 * Test fixture for CARE_APPOINTMENT_CANCELED event (not rescheduled)
 */
export const appointmentCanceledNotRescheduledEvent = createCareEvent<ICareAppointmentCanceledPayload>(
  CareEventType.APPOINTMENT_CANCELED,
  {
    appointmentId: 'appointment_13579',
    appointmentType: AppointmentType.IN_PERSON,
    providerId: 'provider_24680',
    cancellationDate: '2023-06-07T09:30:00Z',
    rescheduled: false,
    reason: 'Provider unavailable due to emergency'
  },
  {
    eventId: 'care-event-appointment-canceled-not-rescheduled-13579',
    timestamp: '2023-06-07T09:30:00Z'
  }
);

// ===== MEDICATION EVENTS =====

/**
 * Test fixture for CARE_MEDICATION_ADDED event
 */
export const medicationAddedEvent = createCareEvent<ICareMedicationAddedPayload>(
  CareEventType.MEDICATION_ADDED,
  {
    medication: {
      id: 'medication_12345',
      userId: TEST_USER_ID,
      name: 'Losartana Potássica',
      dosage: '50mg',
      frequency: 'Uma vez ao dia',
      startDate: new Date('2023-06-15'),
      endDate: new Date('2023-09-15'),
      instructions: 'Tomar pela manhã com água',
      createdAt: new Date('2023-06-15T15:30:00Z'),
      updatedAt: new Date('2023-06-15T15:30:00Z'),
      prescribedBy: TEST_PROVIDER_ID,
      active: true
    },
    startDate: '2023-06-15',
    endDate: '2023-09-15',
    dosage: '50mg',
    frequency: 'Uma vez ao dia',
    isChronicMedication: false
  },
  {
    eventId: 'care-event-medication-added-12345',
    timestamp: '2023-06-15T15:30:00Z'
  }
);

/**
 * Test fixture for CARE_MEDICATION_ADDED event (chronic medication)
 */
export const chronicMedicationAddedEvent = createCareEvent<ICareMedicationAddedPayload>(
  CareEventType.MEDICATION_ADDED,
  {
    medication: {
      id: 'medication_67890',
      userId: TEST_USER_ID,
      name: 'Levotiroxina',
      dosage: '75mcg',
      frequency: 'Uma vez ao dia',
      startDate: new Date('2023-06-10'),
      instructions: 'Tomar em jejum, 30 minutos antes do café da manhã',
      createdAt: new Date('2023-06-10T10:45:00Z'),
      updatedAt: new Date('2023-06-10T10:45:00Z'),
      prescribedBy: 'provider_54321',
      active: true
    },
    startDate: '2023-06-10',
    dosage: '75mcg',
    frequency: 'Uma vez ao dia',
    isChronicMedication: true
  },
  {
    eventId: 'care-event-chronic-medication-added-67890',
    timestamp: '2023-06-10T10:45:00Z'
  }
);

/**
 * Test fixture for CARE_MEDICATION_TAKEN event
 */
export const medicationTakenEvent = createCareEvent<ICareMedicationTakenPayload>(
  CareEventType.MEDICATION_TAKEN,
  {
    medicationId: 'medication_12345',
    medicationName: 'Losartana Potássica',
    takenDate: '2023-06-16T08:15:00Z',
    takenOnTime: true,
    dosage: '50mg'
  },
  {
    eventId: 'care-event-medication-taken-12345-20230616',
    timestamp: '2023-06-16T08:15:00Z'
  }
);

/**
 * Test fixture for CARE_MEDICATION_TAKEN event (late)
 */
export const medicationTakenLateEvent = createCareEvent<ICareMedicationTakenPayload>(
  CareEventType.MEDICATION_TAKEN,
  {
    medicationId: 'medication_12345',
    medicationName: 'Losartana Potássica',
    takenDate: '2023-06-17T11:30:00Z',
    takenOnTime: false,
    dosage: '50mg'
  },
  {
    eventId: 'care-event-medication-taken-late-12345-20230617',
    timestamp: '2023-06-17T11:30:00Z'
  }
);

/**
 * Test fixture for CARE_MEDICATION_ADHERENCE_STREAK event
 */
export const medicationAdherenceStreakEvent = createCareEvent<ICareMedicationAdherenceStreakPayload>(
  CareEventType.MEDICATION_ADHERENCE_STREAK,
  {
    medicationId: 'medication_12345',
    medicationName: 'Losartana Potássica',
    streakDays: 7,
    adherencePercentage: 100,
    startDate: '2023-06-15',
    endDate: '2023-06-21'
  },
  {
    eventId: 'care-event-medication-adherence-streak-12345-7days',
    timestamp: '2023-06-21T23:59:59Z'
  }
);

/**
 * Test fixture for CARE_MEDICATION_ADHERENCE_STREAK event (partial adherence)
 */
export const medicationPartialAdherenceStreakEvent = createCareEvent<ICareMedicationAdherenceStreakPayload>(
  CareEventType.MEDICATION_ADHERENCE_STREAK,
  {
    medicationId: 'medication_67890',
    medicationName: 'Levotiroxina',
    streakDays: 30,
    adherencePercentage: 85,
    startDate: '2023-06-10',
    endDate: '2023-07-09'
  },
  {
    eventId: 'care-event-medication-partial-adherence-streak-67890-30days',
    timestamp: '2023-07-09T23:59:59Z'
  }
);

// ===== TELEMEDICINE EVENTS =====

/**
 * Test fixture for CARE_TELEMEDICINE_SESSION_STARTED event
 */
export const telemedicineSessionStartedEvent = createCareEvent<ICareTelemedicineSessionStartedPayload>(
  CareEventType.TELEMEDICINE_SESSION_STARTED,
  {
    session: {
      id: 'telemedicine_12345',
      userId: TEST_USER_ID,
      providerId: 'provider_13579',
      appointmentId: 'appointment_24680',
      startTime: new Date('2023-06-10T16:00:00Z'),
      status: 'in-progress',
      createdAt: new Date('2023-06-10T16:00:00Z'),
      updatedAt: new Date('2023-06-10T16:00:00Z'),
      platform: 'AUSTA Connect',
      connectionQuality: 'good'
    },
    sessionId: 'telemedicine_12345',
    providerId: 'provider_13579',
    startTime: '2023-06-10T16:00:00Z',
    appointmentId: 'appointment_24680'
  },
  {
    eventId: 'care-event-telemedicine-session-started-12345',
    timestamp: '2023-06-10T16:00:00Z'
  }
);

/**
 * Test fixture for CARE_TELEMEDICINE_SESSION_COMPLETED event
 */
export const telemedicineSessionCompletedEvent = createCareEvent<ICareTelemedicineSessionCompletedPayload>(
  CareEventType.TELEMEDICINE_SESSION_COMPLETED,
  {
    session: {
      id: 'telemedicine_12345',
      userId: TEST_USER_ID,
      providerId: 'provider_13579',
      appointmentId: 'appointment_24680',
      startTime: new Date('2023-06-10T16:00:00Z'),
      endTime: new Date('2023-06-10T16:25:00Z'),
      status: 'completed',
      createdAt: new Date('2023-06-10T16:00:00Z'),
      updatedAt: new Date('2023-06-10T16:25:00Z'),
      platform: 'AUSTA Connect',
      connectionQuality: 'good',
      notes: 'Successful consultation. Patient showing improvement.'
    },
    sessionId: 'telemedicine_12345',
    providerId: 'provider_13579',
    startTime: '2023-06-10T16:00:00Z',
    endTime: '2023-06-10T16:25:00Z',
    duration: 25,
    appointmentId: 'appointment_24680',
    technicalIssues: false
  },
  {
    eventId: 'care-event-telemedicine-session-completed-12345',
    timestamp: '2023-06-10T16:25:00Z'
  }
);

/**
 * Test fixture for CARE_TELEMEDICINE_SESSION_COMPLETED event (with technical issues)
 */
export const telemedicineSessionWithIssuesCompletedEvent = createCareEvent<ICareTelemedicineSessionCompletedPayload>(
  CareEventType.TELEMEDICINE_SESSION_COMPLETED,
  {
    session: {
      id: 'telemedicine_67890',
      userId: TEST_USER_ID,
      providerId: 'provider_24680',
      appointmentId: 'appointment_13579',
      startTime: new Date('2023-06-12T10:00:00Z'),
      endTime: new Date('2023-06-12T10:20:00Z'),
      status: 'completed',
      createdAt: new Date('2023-06-12T10:00:00Z'),
      updatedAt: new Date('2023-06-12T10:20:00Z'),
      platform: 'AUSTA Connect',
      connectionQuality: 'poor',
      notes: 'Session completed despite connection issues. Follow-up scheduled.'
    },
    sessionId: 'telemedicine_67890',
    providerId: 'provider_24680',
    startTime: '2023-06-12T10:00:00Z',
    endTime: '2023-06-12T10:20:00Z',
    duration: 20,
    appointmentId: 'appointment_13579',
    technicalIssues: true
  },
  {
    eventId: 'care-event-telemedicine-session-with-issues-completed-67890',
    timestamp: '2023-06-12T10:20:00Z'
  }
);

/**
 * Test fixture for CARE_PROVIDER_RATED event
 */
export const providerRatedEvent = createCareEvent<ICareProviderRatedPayload>(
  CareEventType.PROVIDER_RATED,
  {
    providerId: 'provider_13579',
    appointmentId: 'appointment_24680',
    rating: 5,
    feedback: 'Excelente atendimento. Médico muito atencioso e explicou tudo claramente.',
    wouldRecommend: true
  },
  {
    eventId: 'care-event-provider-rated-13579',
    timestamp: '2023-06-10T16:30:00Z'
  }
);

/**
 * Test fixture for CARE_PROVIDER_RATED event (average rating)
 */
export const providerAverageRatedEvent = createCareEvent<ICareProviderRatedPayload>(
  CareEventType.PROVIDER_RATED,
  {
    providerId: 'provider_24680',
    appointmentId: 'appointment_13579',
    rating: 3,
    feedback: 'Atendimento normal. Poderia ter sido mais detalhado nas explicações.',
    wouldRecommend: false
  },
  {
    eventId: 'care-event-provider-average-rated-24680',
    timestamp: '2023-06-12T10:25:00Z'
  }
);

/**
 * Test fixture for CARE_SYMPTOM_CHECK_COMPLETED event
 */
export const symptomCheckCompletedEvent = createCareEvent<ICareSymptomCheckCompletedPayload>(
  CareEventType.SYMPTOM_CHECK_COMPLETED,
  {
    checkId: 'symptom_check_12345',
    completionDate: '2023-06-05T15:30:00Z',
    symptomCount: 3,
    urgencyLevel: 'medium',
    recommendedAction: 'Agende uma consulta nos próximos 3 dias'
  },
  {
    eventId: 'care-event-symptom-check-completed-12345',
    timestamp: '2023-06-05T15:30:00Z'
  }
);

/**
 * Test fixture for CARE_SYMPTOM_CHECK_COMPLETED event (high urgency)
 */
export const urgentSymptomCheckCompletedEvent = createCareEvent<ICareSymptomCheckCompletedPayload>(
  CareEventType.SYMPTOM_CHECK_COMPLETED,
  {
    checkId: 'symptom_check_67890',
    completionDate: '2023-06-04T16:15:00Z',
    symptomCount: 5,
    urgencyLevel: 'high',
    recommendedAction: 'Procure atendimento médico imediatamente'
  },
  {
    eventId: 'care-event-urgent-symptom-check-completed-67890',
    timestamp: '2023-06-04T16:15:00Z'
  }
);

// ===== CARE PLAN EVENTS =====

/**
 * Test fixture for CARE_PLAN_CREATED event
 */
export const carePlanCreatedEvent = createCareEvent<ICarePlanCreatedPayload>(
  CareEventType.CARE_PLAN_CREATED,
  {
    treatmentPlan: {
      id: 'care_plan_12345',
      userId: TEST_USER_ID,
      providerId: TEST_PROVIDER_ID,
      title: 'Plano de Recuperação Cardíaca',
      description: 'Plano de tratamento para recuperação após evento cardíaco',
      startDate: new Date('2023-06-20'),
      endDate: new Date('2023-09-20'),
      createdAt: new Date('2023-06-15T15:45:00Z'),
      updatedAt: new Date('2023-06-15T15:45:00Z'),
      status: 'active',
      progress: 0
    },
    planId: 'care_plan_12345',
    planType: 'cardiac-recovery',
    startDate: '2023-06-20',
    endDate: '2023-09-20',
    providerId: TEST_PROVIDER_ID,
    activitiesCount: 12
  },
  {
    eventId: 'care-event-care-plan-created-12345',
    timestamp: '2023-06-15T15:45:00Z'
  }
);

/**
 * Test fixture for CARE_PLAN_UPDATED event
 */
export const carePlanUpdatedEvent = createCareEvent<ICarePlanUpdatedPayload>(
  CareEventType.CARE_PLAN_UPDATED,
  {
    treatmentPlan: {
      id: 'care_plan_12345',
      userId: TEST_USER_ID,
      providerId: TEST_PROVIDER_ID,
      title: 'Plano de Recuperação Cardíaca',
      description: 'Plano de tratamento para recuperação após evento cardíaco',
      startDate: new Date('2023-06-20'),
      endDate: new Date('2023-09-20'),
      createdAt: new Date('2023-06-15T15:45:00Z'),
      updatedAt: new Date('2023-07-05T10:30:00Z'),
      status: 'active',
      progress: 25
    },
    planId: 'care_plan_12345',
    progress: 25,
    completedActivities: 3,
    totalActivities: 12,
    isOnSchedule: true
  },
  {
    eventId: 'care-event-care-plan-updated-12345',
    timestamp: '2023-07-05T10:30:00Z'
  }
);

/**
 * Test fixture for CARE_PLAN_UPDATED event (behind schedule)
 */
export const carePlanBehindScheduleEvent = createCareEvent<ICarePlanUpdatedPayload>(
  CareEventType.CARE_PLAN_UPDATED,
  {
    treatmentPlan: {
      id: 'care_plan_67890',
      userId: TEST_USER_ID,
      providerId: 'provider_54321',
      title: 'Plano de Fisioterapia',
      description: 'Plano de fisioterapia para recuperação de lesão no joelho',
      startDate: new Date('2023-06-10'),
      endDate: new Date('2023-08-10'),
      createdAt: new Date('2023-06-10T09:15:00Z'),
      updatedAt: new Date('2023-07-10T14:20:00Z'),
      status: 'active',
      progress: 15
    },
    planId: 'care_plan_67890',
    progress: 15,
    completedActivities: 3,
    totalActivities: 20,
    isOnSchedule: false
  },
  {
    eventId: 'care-event-care-plan-behind-schedule-67890',
    timestamp: '2023-07-10T14:20:00Z'
  }
);

/**
 * Test fixture for CARE_PLAN_COMPLETED event
 */
export const carePlanCompletedEvent = createCareEvent<ICarePlanCompletedPayload>(
  CareEventType.CARE_PLAN_COMPLETED,
  {
    treatmentPlan: {
      id: 'care_plan_12345',
      userId: TEST_USER_ID,
      providerId: TEST_PROVIDER_ID,
      title: 'Plano de Recuperação Cardíaca',
      description: 'Plano de tratamento para recuperação após evento cardíaco',
      startDate: new Date('2023-06-20'),
      endDate: new Date('2023-09-20'),
      createdAt: new Date('2023-06-15T15:45:00Z'),
      updatedAt: new Date('2023-09-18T11:30:00Z'),
      status: 'completed',
      progress: 100
    },
    planId: 'care_plan_12345',
    planType: 'cardiac-recovery',
    completionDate: '2023-09-18T11:30:00Z',
    fullyCompleted: true,
    completionPercentage: 100,
    daysActive: 90
  },
  {
    eventId: 'care-event-care-plan-completed-12345',
    timestamp: '2023-09-18T11:30:00Z'
  }
);

/**
 * Test fixture for CARE_PLAN_COMPLETED event (partially completed)
 */
export const carePlanPartiallyCompletedEvent = createCareEvent<ICarePlanCompletedPayload>(
  CareEventType.CARE_PLAN_COMPLETED,
  {
    treatmentPlan: {
      id: 'care_plan_67890',
      userId: TEST_USER_ID,
      providerId: 'provider_54321',
      title: 'Plano de Fisioterapia',
      description: 'Plano de fisioterapia para recuperação de lesão no joelho',
      startDate: new Date('2023-06-10'),
      endDate: new Date('2023-08-10'),
      createdAt: new Date('2023-06-10T09:15:00Z'),
      updatedAt: new Date('2023-08-10T16:45:00Z'),
      status: 'completed',
      progress: 75
    },
    planId: 'care_plan_67890',
    planType: 'physiotherapy',
    completionDate: '2023-08-10T16:45:00Z',
    fullyCompleted: false,
    completionPercentage: 75,
    daysActive: 61
  },
  {
    eventId: 'care-event-care-plan-partially-completed-67890',
    timestamp: '2023-08-10T16:45:00Z'
  }
);

// Export all care events as a collection
export const careEvents = {
  // Appointment events
  appointmentBookedEvent,
  urgentAppointmentBookedEvent,
  firstAppointmentBookedEvent,
  telemedicineAppointmentBookedEvent,
  appointmentCompletedEvent,
  telemedicineAppointmentCompletedEvent,
  appointmentCanceledEvent,
  appointmentCanceledNotRescheduledEvent,
  
  // Medication events
  medicationAddedEvent,
  chronicMedicationAddedEvent,
  medicationTakenEvent,
  medicationTakenLateEvent,
  medicationAdherenceStreakEvent,
  medicationPartialAdherenceStreakEvent,
  
  // Telemedicine events
  telemedicineSessionStartedEvent,
  telemedicineSessionCompletedEvent,
  telemedicineSessionWithIssuesCompletedEvent,
  providerRatedEvent,
  providerAverageRatedEvent,
  symptomCheckCompletedEvent,
  urgentSymptomCheckCompletedEvent,
  
  // Care plan events
  carePlanCreatedEvent,
  carePlanUpdatedEvent,
  carePlanBehindScheduleEvent,
  carePlanCompletedEvent,
  carePlanPartiallyCompletedEvent
};

// Export default
export default careEvents;