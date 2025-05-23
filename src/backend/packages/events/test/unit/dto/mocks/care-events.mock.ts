/**
 * @file Care Journey Event Mocks
 * @description Mock data for Care journey events used in testing the gamification engine.
 * These mocks follow the standardized event schema and provide realistic test data for
 * appointment booking, medication adherence, and telemedicine session events.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  EventType,
  EventJourney,
  GamificationEvent,
  AppointmentEventPayload,
  MedicationEventPayload,
  TelemedicineEventPayload,
  TreatmentPlanEventPayload
} from '@austa/interfaces/gamification/events';

/**
 * Creates a base gamification event with common properties.
 * 
 * @param type - The type of event
 * @param userId - The ID of the user associated with the event
 * @param payload - The event-specific payload
 * @returns A gamification event object with standard properties
 */
const createBaseEvent = <T>(type: EventType, userId: string, payload: T): GamificationEvent => ({
  eventId: uuidv4(),
  type,
  userId,
  journey: EventJourney.CARE,
  payload: payload as any,
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'care-service',
  correlationId: uuidv4()
});

/**
 * Mock for APPOINTMENT_BOOKED event.
 * 
 * This event is triggered when a user books a new appointment with a healthcare provider.
 * It includes details about the appointment type and provider.
 */
export const mockAppointmentBookedEvent = (userId: string = 'user-123'): GamificationEvent => {
  const payload: AppointmentEventPayload = {
    timestamp: new Date().toISOString(),
    appointmentId: uuidv4(),
    appointmentType: 'consultation',
    providerId: 'provider-456',
    isFirstAppointment: false,
    metadata: {
      providerName: 'Dr. Ana Silva',
      providerSpecialty: 'Cardiologia',
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      appointmentLocation: 'Clínica Central - São Paulo'
    }
  };

  return createBaseEvent(EventType.APPOINTMENT_BOOKED, userId, payload);
};

/**
 * Mock for APPOINTMENT_BOOKED event with first-time appointment flag.
 * 
 * This variation represents a user's first appointment with a specific provider,
 * which may trigger special achievements or rewards in the gamification system.
 */
export const mockFirstAppointmentBookedEvent = (userId: string = 'user-123'): GamificationEvent => {
  const payload: AppointmentEventPayload = {
    timestamp: new Date().toISOString(),
    appointmentId: uuidv4(),
    appointmentType: 'initial-consultation',
    providerId: 'provider-789',
    isFirstAppointment: true,
    metadata: {
      providerName: 'Dr. Carlos Mendes',
      providerSpecialty: 'Ortopedia',
      appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      appointmentLocation: 'Hospital São Lucas - Rio de Janeiro'
    }
  };

  return createBaseEvent(EventType.APPOINTMENT_BOOKED, userId, payload);
};

/**
 * Mock for MEDICATION_TAKEN event.
 * 
 * This event is triggered when a user records taking their medication.
 * It includes details about the medication and adherence information.
 */
export const mockMedicationTakenEvent = (userId: string = 'user-123'): GamificationEvent => {
  const payload: MedicationEventPayload = {
    timestamp: new Date().toISOString(),
    medicationId: 'med-123',
    medicationName: 'Losartana 50mg',
    takenOnTime: true,
    metadata: {
      dosage: '1 comprimido',
      frequency: 'daily',
      scheduledTime: '08:00',
      actualTime: '08:05',
      notes: 'Tomado com água'
    }
  };

  return createBaseEvent(EventType.MEDICATION_TAKEN, userId, payload);
};

/**
 * Mock for MEDICATION_ADHERENCE_STREAK event.
 * 
 * This event represents a user maintaining a streak of medication adherence,
 * which is important for tracking treatment compliance and rewarding consistent behavior.
 */
export const mockMedicationAdherenceStreakEvent = (userId: string = 'user-123', streakCount: number = 7): GamificationEvent => {
  const payload: MedicationEventPayload = {
    timestamp: new Date().toISOString(),
    medicationId: 'med-123',
    medicationName: 'Losartana 50mg',
    streakCount,
    metadata: {
      frequency: 'daily',
      startDate: new Date(Date.now() - streakCount * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      adherencePercentage: 100
    }
  };

  return createBaseEvent(EventType.MEDICATION_ADHERENCE_STREAK, userId, payload);
};

/**
 * Mock for TELEMEDICINE_SESSION_COMPLETED event.
 * 
 * This event is triggered when a user completes a telemedicine video consultation.
 * It includes details about the session duration and provider.
 */
export const mockTelemedicineSessionCompletedEvent = (userId: string = 'user-123'): GamificationEvent => {
  const payload: TelemedicineEventPayload = {
    timestamp: new Date().toISOString(),
    sessionId: uuidv4(),
    providerId: 'provider-456',
    durationMinutes: 25,
    isFirstSession: false,
    metadata: {
      providerName: 'Dr. Ana Silva',
      providerSpecialty: 'Cardiologia',
      sessionQuality: 'good',
      connectionType: 'wifi',
      followUpRequired: true
    }
  };

  return createBaseEvent(EventType.TELEMEDICINE_SESSION_COMPLETED, userId, payload);
};

/**
 * Mock for TELEMEDICINE_SESSION_COMPLETED event for a first-time session.
 * 
 * This variation represents a user's first telemedicine session,
 * which may trigger special achievements or rewards in the gamification system.
 */
export const mockFirstTelemedicineSessionCompletedEvent = (userId: string = 'user-123'): GamificationEvent => {
  const payload: TelemedicineEventPayload = {
    timestamp: new Date().toISOString(),
    sessionId: uuidv4(),
    providerId: 'provider-789',
    durationMinutes: 30,
    isFirstSession: true,
    metadata: {
      providerName: 'Dr. Carlos Mendes',
      providerSpecialty: 'Ortopedia',
      sessionQuality: 'excellent',
      connectionType: 'wifi',
      followUpRequired: false
    }
  };

  return createBaseEvent(EventType.TELEMEDICINE_SESSION_COMPLETED, userId, payload);
};

/**
 * Mock for TREATMENT_PLAN_PROGRESS event.
 * 
 * This event represents progress in a user's treatment plan,
 * which is important for tracking longitudinal care compliance.
 */
export const mockTreatmentPlanProgressEvent = (userId: string = 'user-123', progressPercentage: number = 50): GamificationEvent => {
  const payload: TreatmentPlanEventPayload = {
    timestamp: new Date().toISOString(),
    planId: 'plan-123',
    planType: 'rehabilitation',
    progressPercentage,
    metadata: {
      planName: 'Plano de Reabilitação Cardíaca',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      targetEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
      lastUpdated: new Date().toISOString(),
      providerId: 'provider-456',
      providerName: 'Dr. Ana Silva'
    }
  };

  return createBaseEvent(EventType.TREATMENT_PLAN_PROGRESS, userId, payload);
};

/**
 * Mock for TREATMENT_PLAN_COMPLETED event.
 * 
 * This event is triggered when a user completes their treatment plan.
 * It includes details about the plan and completion status.
 */
export const mockTreatmentPlanCompletedEvent = (userId: string = 'user-123', completedOnSchedule: boolean = true): GamificationEvent => {
  const payload: TreatmentPlanEventPayload = {
    timestamp: new Date().toISOString(),
    planId: 'plan-123',
    planType: 'rehabilitation',
    completedOnSchedule,
    metadata: {
      planName: 'Plano de Reabilitação Cardíaca',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
      completionDate: new Date().toISOString(),
      targetEndDate: completedOnSchedule 
        ? new Date().toISOString() 
        : new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago if early
      providerId: 'provider-456',
      providerName: 'Dr. Ana Silva',
      outcomeNotes: 'Paciente apresentou recuperação completa conforme esperado'
    }
  };

  return createBaseEvent(EventType.TREATMENT_PLAN_COMPLETED, userId, payload);
};

/**
 * Collection of all care journey event mocks for easy import.
 */
export const careEventMocks = {
  appointmentBooked: mockAppointmentBookedEvent,
  firstAppointmentBooked: mockFirstAppointmentBookedEvent,
  medicationTaken: mockMedicationTakenEvent,
  medicationAdherenceStreak: mockMedicationAdherenceStreakEvent,
  telemedicineSessionCompleted: mockTelemedicineSessionCompletedEvent,
  firstTelemedicineSessionCompleted: mockFirstTelemedicineSessionCompletedEvent,
  treatmentPlanProgress: mockTreatmentPlanProgressEvent,
  treatmentPlanCompleted: mockTreatmentPlanCompletedEvent
};