/**
 * Test fixtures for Care journey events.
 * 
 * This file contains test fixtures for events related to the Care journey, including:
 * - Appointment booking events
 * - Medication adherence events
 * - Telemedicine session events
 * - Care plan progress events
 * 
 * These fixtures are used for testing gamification rules, achievement processing,
 * and notifications related to the Care journey.
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, addHours, addMinutes, format, subDays } from 'date-fns';

// Import base event types and utilities
import { createBaseEvent } from './base-events';

// Import care journey interfaces
import { AppointmentStatus, AppointmentType } from '@austa/interfaces/journey/care';

// Import gamification event interfaces
import { EventType, GamificationEvent } from '@austa/interfaces/gamification/events';

/**
 * Appointment booking event fixture
 * 
 * @param overrides - Optional properties to override default values
 * @returns A complete appointment booking event
 */
export const createAppointmentBookedEvent = (overrides?: Partial<GamificationEvent>): GamificationEvent => {
  const now = new Date();
  const appointmentDate = addDays(now, 7);
  
  return {
    ...createBaseEvent({
      type: EventType.CARE_APPOINTMENT_BOOKED,
      journey: 'care',
      timestamp: now.toISOString(),
      userId: overrides?.userId || '123e4567-e89b-12d3-a456-426614174000',
    }),
    payload: {
      appointmentId: overrides?.payload?.appointmentId || uuidv4(),
      providerId: overrides?.payload?.providerId || uuidv4(),
      type: overrides?.payload?.type || AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      scheduledAt: overrides?.payload?.scheduledAt || appointmentDate.toISOString(),
      specialty: overrides?.payload?.specialty || 'Cardiologia',
      isFirstAppointment: overrides?.payload?.isFirstAppointment || false,
      location: overrides?.payload?.location || 'Clínica AUSTA - Unidade Centro',
    },
    ...overrides,
  };
};

/**
 * Appointment check-in event fixture
 * 
 * @param overrides - Optional properties to override default values
 * @returns A complete appointment check-in event
 */
export const createAppointmentCheckedInEvent = (overrides?: Partial<GamificationEvent>): GamificationEvent => {
  const now = new Date();
  const appointmentId = overrides?.payload?.appointmentId || uuidv4();
  
  return {
    ...createBaseEvent({
      type: EventType.CARE_APPOINTMENT_CHECKED_IN,
      journey: 'care',
      timestamp: now.toISOString(),
      userId: overrides?.userId || '123e4567-e89b-12d3-a456-426614174000',
    }),
    payload: {
      appointmentId,
      providerId: overrides?.payload?.providerId || uuidv4(),
      type: overrides?.payload?.type || AppointmentType.IN_PERSON,
      status: AppointmentStatus.IN_PROGRESS,
      scheduledAt: overrides?.payload?.scheduledAt || now.toISOString(),
      checkedInAt: now.toISOString(),
      waitTime: overrides?.payload?.waitTime || 5, // minutes
      onTime: overrides?.payload?.onTime || true,
    },
    ...overrides,
  };
};

/**
 * Appointment completed event fixture
 * 
 * @param overrides - Optional properties to override default values
 * @returns A complete appointment completed event
 */
export const createAppointmentCompletedEvent = (overrides?: Partial<GamificationEvent>): GamificationEvent => {
  const now = new Date();
  const startTime = subDays(now, 0);
  const appointmentId = overrides?.payload?.appointmentId || uuidv4();
  
  return {
    ...createBaseEvent({
      type: EventType.CARE_APPOINTMENT_COMPLETED,
      journey: 'care',
      timestamp: now.toISOString(),
      userId: overrides?.userId || '123e4567-e89b-12d3-a456-426614174000',
    }),
    payload: {
      appointmentId,
      providerId: overrides?.payload?.providerId || uuidv4(),
      type: overrides?.payload?.type || AppointmentType.IN_PERSON,
      status: AppointmentStatus.COMPLETED,
      scheduledAt: overrides?.payload?.scheduledAt || startTime.toISOString(),
      checkedInAt: overrides?.payload?.checkedInAt || addMinutes(startTime, 5).toISOString(),
      completedAt: now.toISOString(),
      duration: overrides?.payload?.duration || 30, // minutes
      followUpRecommended: overrides?.payload?.followUpRecommended || true,
      hasPrescription: overrides?.payload?.hasPrescription || true,
    },
    ...overrides,
  };
};

/**
 * Appointment canceled event fixture
 * 
 * @param overrides - Optional properties to override default values
 * @returns A complete appointment canceled event
 */
export const createAppointmentCanceledEvent = (overrides?: Partial<GamificationEvent>): GamificationEvent => {
  const now = new Date();
  const scheduledDate = addDays(now, 3);
  const appointmentId = overrides?.payload?.appointmentId || uuidv4();
  
  return {
    ...createBaseEvent({
      type: EventType.CARE_APPOINTMENT_CANCELED,
      journey: 'care',
      timestamp: now.toISOString(),
      userId: overrides?.userId || '123e4567-e89b-12d3-a456-426614174000',
    }),
    payload: {
      appointmentId,
      providerId: overrides?.payload?.providerId || uuidv4(),
      type: overrides?.payload?.type || AppointmentType.IN_PERSON,
      status: AppointmentStatus.CANCELED,
      scheduledAt: overrides?.payload?.scheduledAt || scheduledDate.toISOString(),
      canceledAt: now.toISOString(),
      cancelReason: overrides?.payload?.cancelReason || 'Conflito de agenda',
      canceledByUser: overrides?.payload?.canceledByUser || true,
      advanceNoticeDays: overrides?.payload?.advanceNoticeDays || 3,
    },
    ...overrides,
  };
};

/**
 * Medication adherence event fixture
 * 
 * @param overrides - Optional properties to override default values
 * @param adherenceStatus - Whether the medication was taken as prescribed
 * @returns A complete medication adherence event
 */
export const createMedicationAdherenceEvent = (
  adherenceStatus: 'taken' | 'missed' | 'delayed' = 'taken',
  overrides?: Partial<GamificationEvent>
): GamificationEvent => {
  const now = new Date();
  const medicationId = overrides?.payload?.medicationId || uuidv4();
  const scheduledTime = addHours(now, adherenceStatus === 'delayed' ? -3 : 0);
  
  let eventType: EventType;
  switch (adherenceStatus) {
    case 'taken':
      eventType = EventType.CARE_MEDICATION_TAKEN;
      break;
    case 'missed':
      eventType = EventType.CARE_MEDICATION_MISSED;
      break;
    case 'delayed':
      eventType = EventType.CARE_MEDICATION_DELAYED;
      break;
    default:
      eventType = EventType.CARE_MEDICATION_TAKEN;
  }
  
  return {
    ...createBaseEvent({
      type: eventType,
      journey: 'care',
      timestamp: now.toISOString(),
      userId: overrides?.userId || '123e4567-e89b-12d3-a456-426614174000',
    }),
    payload: {
      medicationId,
      medicationName: overrides?.payload?.medicationName || 'Losartana 50mg',
      scheduledTime: overrides?.payload?.scheduledTime || scheduledTime.toISOString(),
      actualTime: now.toISOString(),
      dosage: overrides?.payload?.dosage || '1 comprimido',
      frequency: overrides?.payload?.frequency || 'daily',
      streak: overrides?.payload?.streak || (adherenceStatus === 'taken' ? 5 : 0),
      adherenceRate: overrides?.payload?.adherenceRate || (adherenceStatus === 'taken' ? 95 : 80),
      delayMinutes: adherenceStatus === 'delayed' ? 180 : 0,
    },
    ...overrides,
  };
};

/**
 * Telemedicine session started event fixture
 * 
 * @param overrides - Optional properties to override default values
 * @returns A complete telemedicine session started event
 */
export const createTelemedicineSessionStartedEvent = (overrides?: Partial<GamificationEvent>): GamificationEvent => {
  const now = new Date();
  const sessionId = overrides?.payload?.sessionId || uuidv4();
  const appointmentId = overrides?.payload?.appointmentId || uuidv4();
  
  return {
    ...createBaseEvent({
      type: EventType.CARE_TELEMEDICINE_STARTED,
      journey: 'care',
      timestamp: now.toISOString(),
      userId: overrides?.userId || '123e4567-e89b-12d3-a456-426614174000',
    }),
    payload: {
      sessionId,
      appointmentId,
      providerId: overrides?.payload?.providerId || uuidv4(),
      startedAt: now.toISOString(),
      specialty: overrides?.payload?.specialty || 'Psiquiatria',
      isFirstSession: overrides?.payload?.isFirstSession || false,
      deviceType: overrides?.payload?.deviceType || 'mobile',
      connectionQuality: overrides?.payload?.connectionQuality || 'good',
    },
    ...overrides,
  };
};

/**
 * Telemedicine session ended event fixture
 * 
 * @param overrides - Optional properties to override default values
 * @returns A complete telemedicine session ended event
 */
export const createTelemedicineSessionEndedEvent = (overrides?: Partial<GamificationEvent>): GamificationEvent => {
  const now = new Date();
  const sessionId = overrides?.payload?.sessionId || uuidv4();
  const appointmentId = overrides?.payload?.appointmentId || uuidv4();
  const startedAt = subDays(now, 0);
  
  return {
    ...createBaseEvent({
      type: EventType.CARE_TELEMEDICINE_ENDED,
      journey: 'care',
      timestamp: now.toISOString(),
      userId: overrides?.userId || '123e4567-e89b-12d3-a456-426614174000',
    }),
    payload: {
      sessionId,
      appointmentId,
      providerId: overrides?.payload?.providerId || uuidv4(),
      startedAt: overrides?.payload?.startedAt || addMinutes(startedAt, -25).toISOString(),
      endedAt: now.toISOString(),
      duration: overrides?.payload?.duration || 25, // minutes
      completedSuccessfully: overrides?.payload?.completedSuccessfully || true,
      connectionIssues: overrides?.payload?.connectionIssues || false,
      followUpRecommended: overrides?.payload?.followUpRecommended || true,
      hasPrescription: overrides?.payload?.hasPrescription || true,
      patientRating: overrides?.payload?.patientRating || 4.5,
    },
    ...overrides,
  };
};

/**
 * Care plan progress event fixture
 * 
 * @param overrides - Optional properties to override default values
 * @param progressPercentage - The percentage of the care plan completed
 * @returns A complete care plan progress event
 */
export const createCarePlanProgressEvent = (
  progressPercentage: number = 25,
  overrides?: Partial<GamificationEvent>
): GamificationEvent => {
  const now = new Date();
  const planId = overrides?.payload?.planId || uuidv4();
  
  let eventType: EventType;
  if (progressPercentage >= 100) {
    eventType = EventType.CARE_PLAN_COMPLETED;
  } else {
    eventType = EventType.CARE_PLAN_PROGRESS;
  }
  
  return {
    ...createBaseEvent({
      type: eventType,
      journey: 'care',
      timestamp: now.toISOString(),
      userId: overrides?.userId || '123e4567-e89b-12d3-a456-426614174000',
    }),
    payload: {
      planId,
      planName: overrides?.payload?.planName || 'Plano de Recuperação Cardíaca',
      providerId: overrides?.payload?.providerId || uuidv4(),
      startDate: overrides?.payload?.startDate || subDays(now, 30).toISOString(),
      targetEndDate: overrides?.payload?.targetEndDate || addDays(now, 60).toISOString(),
      progressPercentage: progressPercentage,
      activitiesCompleted: overrides?.payload?.activitiesCompleted || Math.floor(progressPercentage / 10),
      totalActivities: overrides?.payload?.totalActivities || 10,
      lastActivityDate: now.toISOString(),
      onTrack: overrides?.payload?.onTrack || true,
      nextActivityDue: overrides?.payload?.nextActivityDue || addDays(now, 3).toISOString(),
    },
    ...overrides,
  };
};

/**
 * Collection of appointment events for a complete appointment lifecycle
 */
export const appointmentLifecycleEvents = (): GamificationEvent[] => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const providerId = '987e6543-e21b-12d3-a456-426614174000';
  const appointmentId = uuidv4();
  const now = new Date();
  const scheduledDate = addDays(now, 7);
  
  return [
    createAppointmentBookedEvent({
      userId,
      payload: {
        appointmentId,
        providerId,
        scheduledAt: scheduledDate.toISOString(),
        isFirstAppointment: true,
      },
    }),
    createAppointmentCheckedInEvent({
      userId,
      payload: {
        appointmentId,
        providerId,
        scheduledAt: scheduledDate.toISOString(),
      },
      timestamp: addMinutes(scheduledDate, 5).toISOString(),
    }),
    createAppointmentCompletedEvent({
      userId,
      payload: {
        appointmentId,
        providerId,
        scheduledAt: scheduledDate.toISOString(),
        checkedInAt: addMinutes(scheduledDate, 5).toISOString(),
      },
      timestamp: addMinutes(scheduledDate, 35).toISOString(),
    }),
  ];
};

/**
 * Collection of medication adherence events for a week-long period
 */
export const weeklyMedicationAdherenceEvents = (): GamificationEvent[] => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const medicationId = uuidv4();
  const now = new Date();
  const events: GamificationEvent[] = [];
  
  // Generate 7 days of medication events with one missed and one delayed
  for (let i = 0; i < 7; i++) {
    const date = subDays(now, 6 - i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const scheduledTime = `${formattedDate}T08:00:00.000Z`;
    
    let adherenceStatus: 'taken' | 'missed' | 'delayed' = 'taken';
    if (i === 2) adherenceStatus = 'missed';
    if (i === 5) adherenceStatus = 'delayed';
    
    events.push(
      createMedicationAdherenceEvent(adherenceStatus, {
        userId,
        timestamp: adherenceStatus === 'delayed' 
          ? `${formattedDate}T11:00:00.000Z` 
          : `${formattedDate}T08:05:00.000Z`,
        payload: {
          medicationId,
          scheduledTime,
          streak: adherenceStatus === 'taken' ? i : 0,
        },
      })
    );
  }
  
  return events;
};

/**
 * Collection of telemedicine session events for a complete session
 */
export const telemedicineSessionEvents = (): GamificationEvent[] => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const providerId = '987e6543-e21b-12d3-a456-426614174000';
  const appointmentId = uuidv4();
  const sessionId = uuidv4();
  const now = new Date();
  
  return [
    createTelemedicineSessionStartedEvent({
      userId,
      payload: {
        sessionId,
        appointmentId,
        providerId,
      },
    }),
    createTelemedicineSessionEndedEvent({
      userId,
      payload: {
        sessionId,
        appointmentId,
        providerId,
        startedAt: now.toISOString(),
      },
      timestamp: addMinutes(now, 30).toISOString(),
    }),
  ];
};

/**
 * Collection of care plan progress events showing progression over time
 */
export const carePlanProgressionEvents = (): GamificationEvent[] => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const providerId = '987e6543-e21b-12d3-a456-426614174000';
  const planId = uuidv4();
  const now = new Date();
  const startDate = subDays(now, 60);
  
  return [
    createCarePlanProgressEvent(25, {
      userId,
      payload: {
        planId,
        providerId,
        startDate: startDate.toISOString(),
      },
      timestamp: subDays(now, 45).toISOString(),
    }),
    createCarePlanProgressEvent(50, {
      userId,
      payload: {
        planId,
        providerId,
        startDate: startDate.toISOString(),
      },
      timestamp: subDays(now, 30).toISOString(),
    }),
    createCarePlanProgressEvent(75, {
      userId,
      payload: {
        planId,
        providerId,
        startDate: startDate.toISOString(),
      },
      timestamp: subDays(now, 15).toISOString(),
    }),
    createCarePlanProgressEvent(100, {
      userId,
      payload: {
        planId,
        providerId,
        startDate: startDate.toISOString(),
      },
      timestamp: now.toISOString(),
    }),
  ];
};