/**
 * @file care-events.fixtures.ts
 * @description Provides test fixtures for Care journey events, including appointment booking,
 * medication adherence, telemedicine sessions, and care plan progress updates. These fixtures
 * contain realistic healthcare-related data essential for testing care event validation,
 * processing, and integration with the gamification engine.
 */

import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import { CareEventType, ICareEventPayload } from '../../../src/interfaces/journey-events.interface';
import { AppointmentStatus, AppointmentType } from '@austa/interfaces/journey/care';

// Common values for reuse across fixtures
const USER_ID = 'user_12345';
const PROVIDER_ID = 'provider_67890';
const SOURCE = 'care-service';
const VERSION = '1.0.0';

/**
 * Creates a base care event with common properties
 * @param type The care event type
 * @param payload The event payload
 * @returns A BaseEvent with care journey context
 */
const createCareEvent = <T extends ICareEventPayload>(type: CareEventType, payload: T): BaseEvent<T> => ({
  eventId: `care-event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  type,
  timestamp: new Date().toISOString(),
  version: VERSION,
  source: SOURCE,
  journey: JourneyType.CARE,
  userId: USER_ID,
  payload,
  metadata: {
    correlationId: `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  },
});

// ===== APPOINTMENT BOOKING EVENTS =====

/**
 * Valid appointment booked event fixture
 */
export const validAppointmentBookedEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_BOOKED,
  {
    appointment: {
      id: 'appointment_12345',
      userId: USER_ID,
      providerId: PROVIDER_ID,
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days in future
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Regular check-up appointment',
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: PROVIDER_ID,
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isFirstAppointment: false,
    isUrgent: false,
  }
);

/**
 * Urgent appointment booked event fixture
 */
export const urgentAppointmentBookedEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_BOOKED,
  {
    appointment: {
      id: 'appointment_12346',
      userId: USER_ID,
      providerId: PROVIDER_ID,
      dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day in future
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Urgent appointment for acute symptoms',
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: PROVIDER_ID,
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    isFirstAppointment: false,
    isUrgent: true,
  }
);

/**
 * Telemedicine appointment booked event fixture
 */
export const telemedicineAppointmentBookedEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_BOOKED,
  {
    appointment: {
      id: 'appointment_12347',
      userId: USER_ID,
      providerId: PROVIDER_ID,
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days in future
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Follow-up telemedicine consultation',
    },
    appointmentType: AppointmentType.TELEMEDICINE,
    providerId: PROVIDER_ID,
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    isFirstAppointment: false,
    isUrgent: false,
  }
);

/**
 * First appointment booked event fixture
 */
export const firstAppointmentBookedEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_BOOKED,
  {
    appointment: {
      id: 'appointment_12348',
      userId: USER_ID,
      providerId: PROVIDER_ID,
      dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in future
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Initial consultation with new provider',
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: PROVIDER_ID,
    scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    isFirstAppointment: true,
    isUrgent: false,
  }
);

/**
 * Valid appointment completed event fixture
 */
export const validAppointmentCompletedEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_COMPLETED,
  {
    appointment: {
      id: 'appointment_12349',
      userId: USER_ID,
      providerId: PROVIDER_ID,
      dateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.COMPLETED,
      notes: 'Regular check-up completed',
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: PROVIDER_ID,
    completionDate: new Date().toISOString(),
    duration: 30, // 30 minutes
    followUpScheduled: false,
  }
);

/**
 * Appointment completed with follow-up event fixture
 */
export const appointmentCompletedWithFollowUpEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_COMPLETED,
  {
    appointment: {
      id: 'appointment_12350',
      userId: USER_ID,
      providerId: PROVIDER_ID,
      dateTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.COMPLETED,
      notes: 'Treatment initiated, follow-up required',
    },
    appointmentType: AppointmentType.IN_PERSON,
    providerId: PROVIDER_ID,
    completionDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    duration: 45, // 45 minutes
    followUpScheduled: true,
  }
);

/**
 * Telemedicine appointment completed event fixture
 */
export const telemedicineAppointmentCompletedEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_COMPLETED,
  {
    appointment: {
      id: 'appointment_12351',
      userId: USER_ID,
      providerId: PROVIDER_ID,
      dateTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90 minutes ago
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.COMPLETED,
      notes: 'Telemedicine consultation completed',
    },
    appointmentType: AppointmentType.TELEMEDICINE,
    providerId: PROVIDER_ID,
    completionDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    duration: 20, // 20 minutes
    followUpScheduled: false,
  }
);

/**
 * Valid appointment canceled event fixture
 */
export const validAppointmentCanceledEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_CANCELED,
  {
    appointmentId: 'appointment_12352',
    appointmentType: AppointmentType.IN_PERSON,
    providerId: PROVIDER_ID,
    cancellationDate: new Date().toISOString(),
    rescheduled: false,
    reason: 'Patient unavailable',
  }
);

/**
 * Appointment canceled and rescheduled event fixture
 */
export const appointmentCanceledAndRescheduledEvent: BaseEvent = createCareEvent(
  CareEventType.APPOINTMENT_CANCELED,
  {
    appointmentId: 'appointment_12353',
    appointmentType: AppointmentType.IN_PERSON,
    providerId: PROVIDER_ID,
    cancellationDate: new Date().toISOString(),
    rescheduled: true,
    reason: 'Provider requested rescheduling',
  }
);

// ===== MEDICATION ADHERENCE EVENTS =====

/**
 * Valid medication added event fixture
 */
export const validMedicationAddedEvent: BaseEvent = createCareEvent(
  CareEventType.MEDICATION_ADDED,
  {
    medication: {
      id: 'medication_12345',
      userId: USER_ID,
      name: 'Atorvastatin',
      dosage: 20,
      frequency: 'daily',
      startDate: new Date().toISOString(),
      reminderEnabled: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    startDate: new Date().toISOString(),
    dosage: '20mg',
    frequency: 'Once daily at night',
    isChronicMedication: true,
  }
);

/**
 * Short-term medication added event fixture
 */
export const shortTermMedicationAddedEvent: BaseEvent = createCareEvent(
  CareEventType.MEDICATION_ADDED,
  {
    medication: {
      id: 'medication_12346',
      userId: USER_ID,
      name: 'Amoxicillin',
      dosage: 500,
      frequency: 'three times daily',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days in future
      reminderEnabled: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    dosage: '500mg',
    frequency: 'Three times daily with meals',
    isChronicMedication: false,
  }
);

/**
 * Valid medication taken event fixture
 */
export const validMedicationTakenEvent: BaseEvent = createCareEvent(
  CareEventType.MEDICATION_TAKEN,
  {
    medicationId: 'medication_12345',
    medicationName: 'Atorvastatin',
    takenDate: new Date().toISOString(),
    takenOnTime: true,
    dosage: '20mg',
  }
);

/**
 * Medication taken late event fixture
 */
export const medicationTakenLateEvent: BaseEvent = createCareEvent(
  CareEventType.MEDICATION_TAKEN,
  {
    medicationId: 'medication_12345',
    medicationName: 'Atorvastatin',
    takenDate: new Date().toISOString(),
    takenOnTime: false,
    dosage: '20mg',
  }
);

/**
 * Valid medication adherence streak event fixture
 */
export const validMedicationAdherenceStreakEvent: BaseEvent = createCareEvent(
  CareEventType.MEDICATION_ADHERENCE_STREAK,
  {
    medicationId: 'medication_12345',
    medicationName: 'Atorvastatin',
    streakDays: 7,
    adherencePercentage: 100,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    endDate: new Date().toISOString(),
  }
);

/**
 * Long medication adherence streak event fixture
 */
export const longMedicationAdherenceStreakEvent: BaseEvent = createCareEvent(
  CareEventType.MEDICATION_ADHERENCE_STREAK,
  {
    medicationId: 'medication_12345',
    medicationName: 'Atorvastatin',
    streakDays: 30,
    adherencePercentage: 95,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    endDate: new Date().toISOString(),
  }
);

/**
 * Partial medication adherence streak event fixture
 */
export const partialMedicationAdherenceStreakEvent: BaseEvent = createCareEvent(
  CareEventType.MEDICATION_ADHERENCE_STREAK,
  {
    medicationId: 'medication_12346',
    medicationName: 'Amoxicillin',
    streakDays: 5,
    adherencePercentage: 80,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  }
);

// ===== TELEMEDICINE SESSION EVENTS =====

/**
 * Valid telemedicine session started event fixture
 */
export const validTelemedicineSessionStartedEvent: BaseEvent = createCareEvent(
  CareEventType.TELEMEDICINE_SESSION_STARTED,
  {
    session: {
      id: 'telemedicine_12345',
      appointmentId: 'appointment_12347',
      patientId: USER_ID,
      providerId: PROVIDER_ID,
      startTime: new Date().toISOString(),
      status: 'ongoing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    sessionId: 'telemedicine_12345',
    providerId: PROVIDER_ID,
    startTime: new Date().toISOString(),
    appointmentId: 'appointment_12347',
  }
);

/**
 * Valid telemedicine session completed event fixture
 */
export const validTelemedicineSessionCompletedEvent: BaseEvent = createCareEvent(
  CareEventType.TELEMEDICINE_SESSION_COMPLETED,
  {
    session: {
      id: 'telemedicine_12345',
      appointmentId: 'appointment_12347',
      patientId: USER_ID,
      providerId: PROVIDER_ID,
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      endTime: new Date().toISOString(),
      status: 'completed',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    sessionId: 'telemedicine_12345',
    providerId: PROVIDER_ID,
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 30,
    appointmentId: 'appointment_12347',
    technicalIssues: false,
  }
);

/**
 * Telemedicine session with technical issues event fixture
 */
export const telemedicineSessionWithIssuesEvent: BaseEvent = createCareEvent(
  CareEventType.TELEMEDICINE_SESSION_COMPLETED,
  {
    session: {
      id: 'telemedicine_12346',
      appointmentId: 'appointment_12348',
      patientId: USER_ID,
      providerId: PROVIDER_ID,
      startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      endTime: new Date().toISOString(),
      status: 'completed',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    sessionId: 'telemedicine_12346',
    providerId: PROVIDER_ID,
    startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 45,
    appointmentId: 'appointment_12348',
    technicalIssues: true,
  }
);

// ===== CARE PLAN EVENTS =====

/**
 * Valid care plan created event fixture
 */
export const validCarePlanCreatedEvent: BaseEvent = createCareEvent(
  CareEventType.CARE_PLAN_CREATED,
  {
    treatmentPlan: {
      id: 'treatment_12345',
      name: 'Hypertension Management Plan',
      description: 'Comprehensive plan to manage hypertension through medication and lifestyle changes',
      startDate: new Date().toISOString(),
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    planId: 'treatment_12345',
    planType: 'hypertension-management',
    startDate: new Date().toISOString(),
    providerId: PROVIDER_ID,
    activitiesCount: 5,
  }
);

/**
 * Short-term care plan created event fixture
 */
export const shortTermCarePlanCreatedEvent: BaseEvent = createCareEvent(
  CareEventType.CARE_PLAN_CREATED,
  {
    treatmentPlan: {
      id: 'treatment_12346',
      name: 'Post-Surgery Recovery Plan',
      description: 'Short-term recovery plan following knee surgery',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    planId: 'treatment_12346',
    planType: 'post-surgery-recovery',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    providerId: PROVIDER_ID,
    activitiesCount: 8,
  }
);

/**
 * Valid care plan updated event fixture
 */
export const validCarePlanUpdatedEvent: BaseEvent = createCareEvent(
  CareEventType.CARE_PLAN_UPDATED,
  {
    treatmentPlan: {
      id: 'treatment_12345',
      name: 'Hypertension Management Plan',
      description: 'Comprehensive plan to manage hypertension through medication and lifestyle changes',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      progress: 40,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    planId: 'treatment_12345',
    progress: 40,
    completedActivities: 2,
    totalActivities: 5,
    isOnSchedule: true,
  }
);

/**
 * Care plan behind schedule updated event fixture
 */
export const carePlanBehindScheduleEvent: BaseEvent = createCareEvent(
  CareEventType.CARE_PLAN_UPDATED,
  {
    treatmentPlan: {
      id: 'treatment_12346',
      name: 'Post-Surgery Recovery Plan',
      description: 'Short-term recovery plan following knee surgery',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days in future
      progress: 25,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    planId: 'treatment_12346',
    progress: 25,
    completedActivities: 2,
    totalActivities: 8,
    isOnSchedule: false,
  }
);

/**
 * Valid care plan completed event fixture
 */
export const validCarePlanCompletedEvent: BaseEvent = createCareEvent(
  CareEventType.CARE_PLAN_COMPLETED,
  {
    treatmentPlan: {
      id: 'treatment_12347',
      name: 'Antibiotic Treatment Plan',
      description: 'Short-term antibiotic treatment for respiratory infection',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      endDate: new Date().toISOString(),
      progress: 100,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    planId: 'treatment_12347',
    planType: 'antibiotic-treatment',
    completionDate: new Date().toISOString(),
    fullyCompleted: true,
    completionPercentage: 100,
    daysActive: 10,
  }
);

/**
 * Partially completed care plan event fixture
 */
export const partiallyCompletedCarePlanEvent: BaseEvent = createCareEvent(
  CareEventType.CARE_PLAN_COMPLETED,
  {
    treatmentPlan: {
      id: 'treatment_12348',
      name: 'Physical Therapy Plan',
      description: 'Physical therapy regimen for shoulder rehabilitation',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      endDate: new Date().toISOString(),
      progress: 75,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    planId: 'treatment_12348',
    planType: 'physical-therapy',
    completionDate: new Date().toISOString(),
    fullyCompleted: false,
    completionPercentage: 75,
    daysActive: 60,
  }
);

// ===== PROVIDER RATED EVENTS =====

/**
 * Valid provider rated event fixture
 */
export const validProviderRatedEvent: BaseEvent = createCareEvent(
  CareEventType.PROVIDER_RATED,
  {
    providerId: PROVIDER_ID,
    appointmentId: 'appointment_12349',
    rating: 5,
    feedback: 'Excellent care and attention to detail',
    wouldRecommend: true,
  }
);

/**
 * Low provider rating event fixture
 */
export const lowProviderRatingEvent: BaseEvent = createCareEvent(
  CareEventType.PROVIDER_RATED,
  {
    providerId: PROVIDER_ID,
    appointmentId: 'appointment_12350',
    rating: 2,
    feedback: 'Long wait time and rushed consultation',
    wouldRecommend: false,
  }
);

// ===== SYMPTOM CHECK EVENTS =====

/**
 * Valid symptom check completed event fixture
 */
export const validSymptomCheckCompletedEvent: BaseEvent = createCareEvent(
  CareEventType.SYMPTOM_CHECK_COMPLETED,
  {
    checkId: 'symptom_check_12345',
    completionDate: new Date().toISOString(),
    symptomCount: 3,
    urgencyLevel: 'medium',
    recommendedAction: 'Schedule an appointment within 48 hours',
  }
);

/**
 * High urgency symptom check event fixture
 */
export const highUrgencySymptomCheckEvent: BaseEvent = createCareEvent(
  CareEventType.SYMPTOM_CHECK_COMPLETED,
  {
    checkId: 'symptom_check_12346',
    completionDate: new Date().toISOString(),
    symptomCount: 5,
    urgencyLevel: 'high',
    recommendedAction: 'Seek immediate medical attention',
  }
);

/**
 * Low urgency symptom check event fixture
 */
export const lowUrgencySymptomCheckEvent: BaseEvent = createCareEvent(
  CareEventType.SYMPTOM_CHECK_COMPLETED,
  {
    checkId: 'symptom_check_12347',
    completionDate: new Date().toISOString(),
    symptomCount: 1,
    urgencyLevel: 'low',
    recommendedAction: 'Self-care at home and monitor symptoms',
  }
);

// ===== COLLECTIONS OF EVENTS =====

/**
 * Collection of appointment events for testing
 */
export const appointmentEvents = {
  validAppointmentBookedEvent,
  urgentAppointmentBookedEvent,
  telemedicineAppointmentBookedEvent,
  firstAppointmentBookedEvent,
  validAppointmentCompletedEvent,
  appointmentCompletedWithFollowUpEvent,
  telemedicineAppointmentCompletedEvent,
  validAppointmentCanceledEvent,
  appointmentCanceledAndRescheduledEvent,
};

/**
 * Collection of medication events for testing
 */
export const medicationEvents = {
  validMedicationAddedEvent,
  shortTermMedicationAddedEvent,
  validMedicationTakenEvent,
  medicationTakenLateEvent,
  validMedicationAdherenceStreakEvent,
  longMedicationAdherenceStreakEvent,
  partialMedicationAdherenceStreakEvent,
};

/**
 * Collection of telemedicine events for testing
 */
export const telemedicineEvents = {
  validTelemedicineSessionStartedEvent,
  validTelemedicineSessionCompletedEvent,
  telemedicineSessionWithIssuesEvent,
};

/**
 * Collection of care plan events for testing
 */
export const carePlanEvents = {
  validCarePlanCreatedEvent,
  shortTermCarePlanCreatedEvent,
  validCarePlanUpdatedEvent,
  carePlanBehindScheduleEvent,
  validCarePlanCompletedEvent,
  partiallyCompletedCarePlanEvent,
};

/**
 * Collection of provider rating events for testing
 */
export const providerRatingEvents = {
  validProviderRatedEvent,
  lowProviderRatingEvent,
};

/**
 * Collection of symptom check events for testing
 */
export const symptomCheckEvents = {
  validSymptomCheckCompletedEvent,
  highUrgencySymptomCheckEvent,
  lowUrgencySymptomCheckEvent,
};

/**
 * All care events for testing
 */
export const allCareEvents = {
  ...appointmentEvents,
  ...medicationEvents,
  ...telemedicineEvents,
  ...carePlanEvents,
  ...providerRatingEvents,
  ...symptomCheckEvents,
};

/**
 * Invalid care events for testing validation
 */
export const invalidCareEvents = {
  // Missing required fields
  missingAppointmentId: createCareEvent(
    CareEventType.APPOINTMENT_CANCELED,
    {
      // Missing appointmentId
      appointmentType: AppointmentType.IN_PERSON,
      providerId: PROVIDER_ID,
      cancellationDate: new Date().toISOString(),
      rescheduled: false,
      reason: 'Patient unavailable',
    }
  ),
  
  // Invalid field values
  invalidMedicationAdherencePercentage: createCareEvent(
    CareEventType.MEDICATION_ADHERENCE_STREAK,
    {
      medicationId: 'medication_12345',
      medicationName: 'Atorvastatin',
      streakDays: 7,
      adherencePercentage: 120, // Invalid: over 100%
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    }
  ),
  
  // Inconsistent dates
  inconsistentDatesMedicationStreak: createCareEvent(
    CareEventType.MEDICATION_ADHERENCE_STREAK,
    {
      medicationId: 'medication_12345',
      medicationName: 'Atorvastatin',
      streakDays: 7,
      adherencePercentage: 100,
      startDate: new Date().toISOString(), // Start date is after end date
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ),
  
  // Invalid enum value
  invalidAppointmentType: createCareEvent(
    CareEventType.APPOINTMENT_BOOKED,
    {
      appointment: {
        id: 'appointment_12345',
        userId: USER_ID,
        providerId: PROVIDER_ID,
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'virtual' as any, // Invalid appointment type
        status: AppointmentStatus.SCHEDULED,
        notes: 'Regular check-up appointment',
      },
      appointmentType: 'virtual' as any, // Invalid appointment type
      providerId: PROVIDER_ID,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isFirstAppointment: false,
      isUrgent: false,
    }
  ),
};