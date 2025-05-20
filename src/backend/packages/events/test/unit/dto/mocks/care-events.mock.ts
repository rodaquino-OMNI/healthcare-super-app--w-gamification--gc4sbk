/**
 * @file care-events.mock.ts
 * @description Provides mock data for Care journey events (APPOINTMENT_BOOKED, MEDICATION_TAKEN, 
 * TELEMEDICINE_SESSION_COMPLETED, etc.) with properly structured data payloads matching the expected DTO schema.
 * These mocks are used for testing the validation, processing, and handling of care-related events 
 * by the gamification engine.
 *
 * @module events/test/unit/dto/mocks
 */

import { EventType, JourneyEvents } from '../../../../src/dto/event-types.enum';
import { createEventMetadata } from '../../../../src/dto/event-metadata.dto';

/**
 * Mock data for a CARE_APPOINTMENT_BOOKED event.
 * Represents a user booking a medical appointment.
 */
export const appointmentBookedEvent = {
  type: EventType.CARE_APPOINTMENT_BOOKED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  journey: 'care',
  data: {
    appointmentId: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    providerId: 'f9e8d7c6-b5a4-3210-9876-f5e4d3c2b1a0',
    providerName: 'Dr. Maria Silva',
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: '2025-06-15T14:30:00Z',
    bookedAt: '2025-06-01T10:15:22Z',
    locationName: 'Clínica AUSTA - Unidade Central',
    notes: 'Consulta de rotina para acompanhamento cardíaco'
  },
  metadata: createEventMetadata('care-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440001',
    timestamp: new Date('2025-06-01T10:15:22Z')
  })
};

/**
 * Mock data for a CARE_APPOINTMENT_COMPLETED event.
 * Represents a user completing a medical appointment.
 */
export const appointmentCompletedEvent = {
  type: EventType.CARE_APPOINTMENT_COMPLETED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  journey: 'care',
  data: {
    appointmentId: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    providerId: 'f9e8d7c6-b5a4-3210-9876-f5e4d3c2b1a0',
    providerName: 'Dr. Maria Silva',
    appointmentType: 'in_person',
    scheduledAt: '2025-06-15T14:30:00Z',
    completedAt: '2025-06-15T15:15:00Z',
    duration: 45, // in minutes
    followUpRequired: true,
    followUpTimeframe: '3 months'
  },
  metadata: createEventMetadata('care-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440002',
    timestamp: new Date('2025-06-15T15:15:00Z')
  })
};

/**
 * Mock data for a CARE_MEDICATION_TAKEN event.
 * Represents a user logging that they've taken their medication.
 */
export const medicationTakenEvent = {
  type: EventType.CARE_MEDICATION_TAKEN,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  journey: 'care',
  data: {
    medicationId: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    medicationName: 'Losartana Potássica',
    dosage: '50mg',
    takenAt: '2025-06-10T08:00:00Z',
    adherence: 'on_time',
    scheduledTime: '2025-06-10T08:00:00Z',
    frequency: 'daily',
    remainingDoses: 25
  },
  metadata: createEventMetadata('care-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440003',
    timestamp: new Date('2025-06-10T08:00:00Z')
  })
};

/**
 * Mock data for a CARE_MEDICATION_TAKEN event with late adherence.
 * Represents a user logging that they've taken their medication late.
 */
export const medicationTakenLateEvent = {
  type: EventType.CARE_MEDICATION_TAKEN,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  journey: 'care',
  data: {
    medicationId: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    medicationName: 'Losartana Potássica',
    dosage: '50mg',
    takenAt: '2025-06-10T10:30:00Z',
    adherence: 'late',
    scheduledTime: '2025-06-10T08:00:00Z',
    frequency: 'daily',
    remainingDoses: 25,
    delayMinutes: 150 // 2.5 hours late
  },
  metadata: createEventMetadata('care-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440004',
    timestamp: new Date('2025-06-10T10:30:00Z')
  })
};

/**
 * Mock data for a CARE_TELEMEDICINE_STARTED event.
 * Represents a user starting a telemedicine session.
 */
export const telemedicineStartedEvent = {
  type: EventType.CARE_TELEMEDICINE_STARTED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  journey: 'care',
  data: {
    sessionId: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
    appointmentId: 'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
    providerId: 'e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b',
    providerName: 'Dr. Carlos Mendes',
    specialtyType: 'Dermatologia',
    startedAt: '2025-06-20T09:00:00Z',
    deviceType: 'mobile',
    connectionType: '4G',
    deviceModel: 'iPhone 15 Pro'
  },
  metadata: createEventMetadata('care-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440005',
    timestamp: new Date('2025-06-20T09:00:00Z')
  })
};

/**
 * Mock data for a CARE_TELEMEDICINE_COMPLETED event.
 * Represents a user completing a telemedicine session.
 */
export const telemedicineCompletedEvent = {
  type: EventType.CARE_TELEMEDICINE_COMPLETED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  journey: 'care',
  data: {
    sessionId: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
    appointmentId: 'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
    providerId: 'e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b',
    providerName: 'Dr. Carlos Mendes',
    startedAt: '2025-06-20T09:00:00Z',
    endedAt: '2025-06-20T09:25:00Z',
    duration: 25, // in minutes
    quality: 'good',
    connectionIssues: false,
    followUpRequired: false
  },
  metadata: createEventMetadata('care-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440006',
    timestamp: new Date('2025-06-20T09:25:00Z')
  })
};

/**
 * Mock data for a CARE_PLAN_CREATED event.
 * Represents a care plan being created for a user.
 */
export const carePlanCreatedEvent = {
  type: EventType.CARE_PLAN_CREATED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  journey: 'care',
  data: {
    planId: 'f6a7b8c9-d0e1-8f2a-3b4c-5d6e7f8a9b0c',
    providerId: 'a7b8c9d0-e1f2-9a3b-4c5d-6e7f8a9b0c1d',
    providerName: 'Dra. Ana Beatriz Costa',
    planType: 'chronic_condition',
    condition: 'Hipertensão',
    startDate: '2025-06-01T00:00:00Z',
    endDate: '2025-12-01T00:00:00Z', // 6-month plan
    createdAt: '2025-06-01T11:30:00Z',
    taskCount: 5,
    description: 'Plano de controle de hipertensão com monitoramento regular e ajustes de medicação'
  },
  metadata: createEventMetadata('care-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440007',
    timestamp: new Date('2025-06-01T11:30:00Z')
  })
};

/**
 * Mock data for a CARE_PLAN_TASK_COMPLETED event.
 * Represents a user completing a task in their care plan.
 */
export const carePlanTaskCompletedEvent = {
  type: EventType.CARE_PLAN_TASK_COMPLETED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  journey: 'care',
  data: {
    taskId: 'a7b8c9d0-e1f2-9a3b-4c5d-6e7f8a9b0c1d',
    planId: 'f6a7b8c9-d0e1-8f2a-3b4c-5d6e7f8a9b0c',
    taskType: 'medication',
    taskName: 'Tomar Losartana diariamente',
    completedAt: '2025-06-10T08:00:00Z',
    status: 'completed',
    streak: 10, // Completed this task 10 days in a row
    progress: 100, // Percentage of completion
    notes: 'Medicação tomada conforme prescrito'
  },
  metadata: createEventMetadata('care-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440008',
    timestamp: new Date('2025-06-10T08:00:00Z')
  })
};

/**
 * Collection of all care journey event mocks.
 */
export const careEvents = {
  appointmentBooked: appointmentBookedEvent,
  appointmentCompleted: appointmentCompletedEvent,
  medicationTaken: medicationTakenEvent,
  medicationTakenLate: medicationTakenLateEvent,
  telemedicineStarted: telemedicineStartedEvent,
  telemedicineCompleted: telemedicineCompletedEvent,
  carePlanCreated: carePlanCreatedEvent,
  carePlanTaskCompleted: carePlanTaskCompletedEvent
};

/**
 * Collection of care journey events grouped by event type.
 */
export const careEventsByType = {
  [EventType.CARE_APPOINTMENT_BOOKED]: [appointmentBookedEvent],
  [EventType.CARE_APPOINTMENT_COMPLETED]: [appointmentCompletedEvent],
  [EventType.CARE_MEDICATION_TAKEN]: [medicationTakenEvent, medicationTakenLateEvent],
  [EventType.CARE_TELEMEDICINE_STARTED]: [telemedicineStartedEvent],
  [EventType.CARE_TELEMEDICINE_COMPLETED]: [telemedicineCompletedEvent],
  [EventType.CARE_PLAN_CREATED]: [carePlanCreatedEvent],
  [EventType.CARE_PLAN_TASK_COMPLETED]: [carePlanTaskCompletedEvent]
};

/**
 * Factory function to create a custom CARE_APPOINTMENT_BOOKED event.
 * 
 * @param overrides Properties to override in the default event
 * @returns A customized appointment booked event
 */
export function createAppointmentBookedEvent(overrides: Partial<typeof appointmentBookedEvent> = {}) {
  return {
    ...appointmentBookedEvent,
    ...overrides,
    data: {
      ...appointmentBookedEvent.data,
      ...(overrides.data || {})
    },
    metadata: {
      ...appointmentBookedEvent.metadata,
      ...(overrides.metadata || {})
    }
  };
}

/**
 * Factory function to create a custom CARE_MEDICATION_TAKEN event.
 * 
 * @param overrides Properties to override in the default event
 * @returns A customized medication taken event
 */
export function createMedicationTakenEvent(overrides: Partial<typeof medicationTakenEvent> = {}) {
  return {
    ...medicationTakenEvent,
    ...overrides,
    data: {
      ...medicationTakenEvent.data,
      ...(overrides.data || {})
    },
    metadata: {
      ...medicationTakenEvent.metadata,
      ...(overrides.metadata || {})
    }
  };
}

/**
 * Factory function to create a custom CARE_TELEMEDICINE_COMPLETED event.
 * 
 * @param overrides Properties to override in the default event
 * @returns A customized telemedicine completed event
 */
export function createTelemedicineCompletedEvent(overrides: Partial<typeof telemedicineCompletedEvent> = {}) {
  return {
    ...telemedicineCompletedEvent,
    ...overrides,
    data: {
      ...telemedicineCompletedEvent.data,
      ...(overrides.data || {})
    },
    metadata: {
      ...telemedicineCompletedEvent.metadata,
      ...(overrides.metadata || {})
    }
  };
}

/**
 * Default export of all care journey events.
 */
export default careEvents;