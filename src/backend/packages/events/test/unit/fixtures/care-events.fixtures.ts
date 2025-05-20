/**
 * @file care-events.fixtures.ts
 * @description Provides test fixtures for Care journey events, including appointment booking,
 * medication adherence, telemedicine sessions, and care plan progress updates. These fixtures
 * contain realistic healthcare-related data essential for testing care event validation,
 * processing, and integration with the gamification engine.
 *
 * @module events/test/unit/fixtures
 */

import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto } from '../../../src/dto/event-metadata.dto';
import { v4 as uuidv4 } from 'uuid';

// Common user IDs for consistent testing
const TEST_USER_IDS = {
  standard: '550e8400-e29b-41d4-a716-446655440000',
  premium: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  family: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  senior: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
};

// Common provider IDs for consistent testing
const TEST_PROVIDER_IDS = {
  cardiologist: '7ca7b810-9dad-11d1-80b4-00c04fd430c8',
  dermatologist: '7ca7b811-9dad-11d1-80b4-00c04fd430c8',
  orthopedist: '7ca7b812-9dad-11d1-80b4-00c04fd430c8',
  pediatrician: '7ca7b813-9dad-11d1-80b4-00c04fd430c8',
  psychiatrist: '7ca7b814-9dad-11d1-80b4-00c04fd430c8',
  generalPractitioner: '7ca7b815-9dad-11d1-80b4-00c04fd430c8',
};

// Common specialty types for consistent testing
const TEST_SPECIALTY_TYPES = {
  cardiology: 'Cardiologia',
  dermatology: 'Dermatologia',
  orthopedics: 'Ortopedia',
  pediatrics: 'Pediatria',
  psychiatry: 'Psiquiatria',
  generalPractice: 'Clínica Geral',
};

/**
 * Creates standard event metadata for care journey events.
 * 
 * @param options Optional overrides for metadata properties
 * @returns EventMetadataDto instance with care journey defaults
 */
export function createCareEventMetadata(options: Partial<EventMetadataDto> = {}): EventMetadataDto {
  const origin = new EventOriginDto();
  origin.service = 'care-service';
  origin.component = options.origin?.component || 'event-processor';
  
  const version = new EventVersionDto();
  version.major = '1';
  version.minor = '0';
  version.patch = '0';
  
  return new EventMetadataDto({
    eventId: uuidv4(),
    correlationId: options.correlationId || uuidv4(),
    timestamp: options.timestamp || new Date(),
    origin,
    version,
    ...options,
  });
}

/**
 * Base interface for all care journey events.
 */
export interface BaseCareEvent {
  type: EventType;
  userId: string;
  metadata: EventMetadataDto;
}

/**
 * Interface for appointment booking event payload.
 */
export interface AppointmentBookedPayload {
  appointmentId: string;
  providerId: string;
  specialtyType: string;
  appointmentType: 'in_person' | 'telemedicine' | 'home_visit';
  scheduledAt: string;
  bookedAt: string;
  reason?: string;
  notes?: string;
  isFirstVisit?: boolean;
  insurancePlanId?: string;
  locationId?: string;
}

/**
 * Interface for appointment completed event payload.
 */
export interface AppointmentCompletedPayload {
  appointmentId: string;
  providerId: string;
  appointmentType: 'in_person' | 'telemedicine' | 'home_visit';
  scheduledAt: string;
  completedAt: string;
  duration: number; // in minutes
  followUpRecommended?: boolean;
  followUpTimeframe?: string;
  diagnosisCodes?: string[];
  prescriptionIds?: string[];
  referralIds?: string[];
}

/**
 * Interface for medication taken event payload.
 */
export interface MedicationTakenPayload {
  medicationId: string;
  medicationName: string;
  dosage: string;
  takenAt: string;
  adherence: 'on_time' | 'late' | 'missed';
  scheduledTime?: string;
  sideEffects?: string[];
  mood?: string;
  symptoms?: string[];
  notes?: string;
}

/**
 * Interface for telemedicine started event payload.
 */
export interface TelemedicineStartedPayload {
  sessionId: string;
  appointmentId: string;
  providerId: string;
  startedAt: string;
  deviceType: 'mobile' | 'web' | 'tablet';
  connectionType?: string;
  browserInfo?: string;
  osInfo?: string;
  networkQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  hasVideo?: boolean;
  hasAudio?: boolean;
}

/**
 * Interface for telemedicine completed event payload.
 */
export interface TelemedicineCompletedPayload {
  sessionId: string;
  appointmentId: string;
  providerId: string;
  startedAt: string;
  endedAt: string;
  duration: number; // in minutes
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  disconnections?: number;
  technicalIssues?: string[];
  patientRating?: number;
  providerRating?: number;
  followUpScheduled?: boolean;
}

/**
 * Interface for care plan created event payload.
 */
export interface CarePlanCreatedPayload {
  planId: string;
  providerId: string;
  planType: 'chronic_condition' | 'recovery' | 'preventive' | 'mental_health' | 'maternity';
  condition: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  goals?: string[];
  taskCount?: number;
  checkInFrequency?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

/**
 * Interface for care plan task completed event payload.
 */
export interface CarePlanTaskCompletedPayload {
  taskId: string;
  planId: string;
  taskType: 'medication' | 'exercise' | 'appointment' | 'measurement' | 'education' | 'diet';
  completedAt: string;
  status: 'completed' | 'partially_completed' | 'skipped';
  scheduledAt?: string;
  difficulty?: 'easy' | 'moderate' | 'difficult';
  patientNotes?: string;
  measurementValue?: number;
  measurementUnit?: string;
  duration?: number; // in minutes
}

/**
 * Appointment booking event fixtures for testing.
 */
export const appointmentBookedEvents = {
  /**
   * Valid appointment booking event for a cardiologist.
   */
  cardiologist: {
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.standard,
    payload: {
      appointmentId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.cardiologist,
      specialtyType: TEST_SPECIALTY_TYPES.cardiology,
      appointmentType: 'in_person',
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days in future
      bookedAt: new Date().toISOString(),
      reason: 'Annual heart checkup',
      notes: 'Patient has family history of heart disease',
      isFirstVisit: false,
      locationId: uuidv4(),
    },
    metadata: createCareEventMetadata({
      origin: { component: 'appointment-scheduler' }
    }),
  } as BaseCareEvent & { payload: AppointmentBookedPayload },

  /**
   * Valid appointment booking event for a dermatologist.
   */
  dermatologist: {
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.premium,
    payload: {
      appointmentId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.dermatologist,
      specialtyType: TEST_SPECIALTY_TYPES.dermatology,
      appointmentType: 'in_person',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days in future
      bookedAt: new Date().toISOString(),
      reason: 'Skin rash evaluation',
      isFirstVisit: true,
      insurancePlanId: uuidv4(),
      locationId: uuidv4(),
    },
    metadata: createCareEventMetadata({
      origin: { component: 'appointment-scheduler' }
    }),
  } as BaseCareEvent & { payload: AppointmentBookedPayload },

  /**
   * Valid appointment booking event for a telemedicine session with a psychiatrist.
   */
  telePsychiatrist: {
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.family,
    payload: {
      appointmentId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.psychiatrist,
      specialtyType: TEST_SPECIALTY_TYPES.psychiatry,
      appointmentType: 'telemedicine',
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day in future
      bookedAt: new Date().toISOString(),
      reason: 'Anxiety follow-up',
      notes: 'Patient prefers video consultation',
      isFirstVisit: false,
    },
    metadata: createCareEventMetadata({
      origin: { component: 'appointment-scheduler' }
    }),
  } as BaseCareEvent & { payload: AppointmentBookedPayload },

  /**
   * Valid appointment booking event for a home visit by a general practitioner.
   */
  homeVisit: {
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.senior,
    payload: {
      appointmentId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.generalPractitioner,
      specialtyType: TEST_SPECIALTY_TYPES.generalPractice,
      appointmentType: 'home_visit',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days in future
      bookedAt: new Date().toISOString(),
      reason: 'Mobility issues, unable to travel to clinic',
      notes: 'Patient requires blood pressure monitoring',
      isFirstVisit: false,
      insurancePlanId: uuidv4(),
    },
    metadata: createCareEventMetadata({
      origin: { component: 'appointment-scheduler' }
    }),
  } as BaseCareEvent & { payload: AppointmentBookedPayload },

  /**
   * Invalid appointment booking event missing required fields.
   */
  invalid: {
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.standard,
    payload: {
      appointmentId: uuidv4(),
      // Missing providerId
      specialtyType: TEST_SPECIALTY_TYPES.cardiology,
      // Missing appointmentType
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      // Missing bookedAt
    } as any,
    metadata: createCareEventMetadata({
      origin: { component: 'appointment-scheduler' }
    }),
  } as BaseCareEvent & { payload: Partial<AppointmentBookedPayload> },
};

/**
 * Appointment completed event fixtures for testing.
 */
export const appointmentCompletedEvents = {
  /**
   * Valid appointment completed event for a cardiologist visit.
   */
  cardiologist: {
    type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
    userId: TEST_USER_IDS.standard,
    payload: {
      appointmentId: appointmentBookedEvents.cardiologist.payload.appointmentId,
      providerId: TEST_PROVIDER_IDS.cardiologist,
      appointmentType: 'in_person',
      scheduledAt: appointmentBookedEvents.cardiologist.payload.scheduledAt,
      completedAt: new Date(new Date(appointmentBookedEvents.cardiologist.payload.scheduledAt).getTime() + 45 * 60 * 1000).toISOString(), // 45 minutes after scheduled time
      duration: 45,
      followUpRecommended: true,
      followUpTimeframe: '6 months',
      diagnosisCodes: ['I10', 'E78.5'], // Hypertension, Hyperlipidemia
      prescriptionIds: [uuidv4(), uuidv4()],
    },
    metadata: createCareEventMetadata({
      correlationId: appointmentBookedEvents.cardiologist.metadata.correlationId,
      origin: { component: 'appointment-tracker' }
    }),
  } as BaseCareEvent & { payload: AppointmentCompletedPayload },

  /**
   * Valid appointment completed event for a dermatologist visit.
   */
  dermatologist: {
    type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
    userId: TEST_USER_IDS.premium,
    payload: {
      appointmentId: appointmentBookedEvents.dermatologist.payload.appointmentId,
      providerId: TEST_PROVIDER_IDS.dermatologist,
      appointmentType: 'in_person',
      scheduledAt: appointmentBookedEvents.dermatologist.payload.scheduledAt,
      completedAt: new Date(new Date(appointmentBookedEvents.dermatologist.payload.scheduledAt).getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes after scheduled time
      duration: 30,
      followUpRecommended: true,
      followUpTimeframe: '2 weeks',
      diagnosisCodes: ['L30.9'], // Dermatitis, unspecified
      prescriptionIds: [uuidv4()],
    },
    metadata: createCareEventMetadata({
      correlationId: appointmentBookedEvents.dermatologist.metadata.correlationId,
      origin: { component: 'appointment-tracker' }
    }),
  } as BaseCareEvent & { payload: AppointmentCompletedPayload },

  /**
   * Valid appointment completed event for a telemedicine session with a psychiatrist.
   */
  telePsychiatrist: {
    type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
    userId: TEST_USER_IDS.family,
    payload: {
      appointmentId: appointmentBookedEvents.telePsychiatrist.payload.appointmentId,
      providerId: TEST_PROVIDER_IDS.psychiatrist,
      appointmentType: 'telemedicine',
      scheduledAt: appointmentBookedEvents.telePsychiatrist.payload.scheduledAt,
      completedAt: new Date(new Date(appointmentBookedEvents.telePsychiatrist.payload.scheduledAt).getTime() + 50 * 60 * 1000).toISOString(), // 50 minutes after scheduled time
      duration: 50,
      followUpRecommended: true,
      followUpTimeframe: '1 month',
      diagnosisCodes: ['F41.1'], // Generalized anxiety disorder
      prescriptionIds: [uuidv4()],
    },
    metadata: createCareEventMetadata({
      correlationId: appointmentBookedEvents.telePsychiatrist.metadata.correlationId,
      origin: { component: 'appointment-tracker' }
    }),
  } as BaseCareEvent & { payload: AppointmentCompletedPayload },
};

/**
 * Medication taken event fixtures for testing.
 */
export const medicationTakenEvents = {
  /**
   * Valid medication taken event for blood pressure medication.
   */
  bloodPressure: {
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    userId: TEST_USER_IDS.standard,
    payload: {
      medicationId: uuidv4(),
      medicationName: 'Losartan',
      dosage: '50mg',
      takenAt: new Date().toISOString(),
      adherence: 'on_time',
      scheduledTime: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
      notes: 'Taken with breakfast',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'medication-tracker' }
    }),
  } as BaseCareEvent & { payload: MedicationTakenPayload },

  /**
   * Valid medication taken event for cholesterol medication.
   */
  cholesterol: {
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    userId: TEST_USER_IDS.standard,
    payload: {
      medicationId: uuidv4(),
      medicationName: 'Atorvastatina',
      dosage: '20mg',
      takenAt: new Date().toISOString(),
      adherence: 'on_time',
      scheduledTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(),
      notes: 'Taken after dinner',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'medication-tracker' }
    }),
  } as BaseCareEvent & { payload: MedicationTakenPayload },

  /**
   * Valid medication taken event for anxiety medication, taken late.
   */
  anxietyLate: {
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    userId: TEST_USER_IDS.family,
    payload: {
      medicationId: uuidv4(),
      medicationName: 'Escitalopram',
      dosage: '10mg',
      takenAt: new Date().toISOString(),
      adherence: 'late',
      scheduledTime: new Date(new Date().setHours(new Date().getHours() - 3, 0, 0, 0)).toISOString(), // 3 hours ago
      sideEffects: ['drowsiness', 'dry mouth'],
      mood: 'anxious',
      notes: 'Forgot to take in the morning',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'medication-tracker' }
    }),
  } as BaseCareEvent & { payload: MedicationTakenPayload },

  /**
   * Valid medication taken event for pain medication, missed dose.
   */
  painMissed: {
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    userId: TEST_USER_IDS.senior,
    payload: {
      medicationId: uuidv4(),
      medicationName: 'Paracetamol',
      dosage: '500mg',
      takenAt: new Date().toISOString(),
      adherence: 'missed',
      scheduledTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
      symptoms: ['pain', 'stiffness'],
      notes: 'Missed yesterday's dose, taking now',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'medication-tracker' }
    }),
  } as BaseCareEvent & { payload: MedicationTakenPayload },

  /**
   * Valid medication taken event for antibiotic, with side effects.
   */
  antibioticWithSideEffects: {
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    userId: TEST_USER_IDS.premium,
    payload: {
      medicationId: uuidv4(),
      medicationName: 'Amoxicilina',
      dosage: '500mg',
      takenAt: new Date().toISOString(),
      adherence: 'on_time',
      scheduledTime: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
      sideEffects: ['nausea', 'diarrhea'],
      notes: 'Side effects are moderate',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'medication-tracker' }
    }),
  } as BaseCareEvent & { payload: MedicationTakenPayload },
};

/**
 * Telemedicine started event fixtures for testing.
 */
export const telemedicineStartedEvents = {
  /**
   * Valid telemedicine started event for a psychiatrist session on mobile.
   */
  psychiatristMobile: {
    type: JourneyEvents.Care.TELEMEDICINE_STARTED,
    userId: TEST_USER_IDS.family,
    payload: {
      sessionId: uuidv4(),
      appointmentId: appointmentBookedEvents.telePsychiatrist.payload.appointmentId,
      providerId: TEST_PROVIDER_IDS.psychiatrist,
      startedAt: appointmentBookedEvents.telePsychiatrist.payload.scheduledAt,
      deviceType: 'mobile',
      connectionType: '4G',
      osInfo: 'iOS 15.4',
      networkQuality: 'good',
      hasVideo: true,
      hasAudio: true,
    },
    metadata: createCareEventMetadata({
      correlationId: appointmentBookedEvents.telePsychiatrist.metadata.correlationId,
      origin: { component: 'telemedicine-service' }
    }),
  } as BaseCareEvent & { payload: TelemedicineStartedPayload },

  /**
   * Valid telemedicine started event for a general practitioner session on web.
   */
  generalPractitionerWeb: {
    type: JourneyEvents.Care.TELEMEDICINE_STARTED,
    userId: TEST_USER_IDS.standard,
    payload: {
      sessionId: uuidv4(),
      appointmentId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.generalPractitioner,
      startedAt: new Date().toISOString(),
      deviceType: 'web',
      connectionType: 'WiFi',
      browserInfo: 'Chrome 98.0.4758.102',
      osInfo: 'Windows 11',
      networkQuality: 'excellent',
      hasVideo: true,
      hasAudio: true,
    },
    metadata: createCareEventMetadata({
      origin: { component: 'telemedicine-service' }
    }),
  } as BaseCareEvent & { payload: TelemedicineStartedPayload },

  /**
   * Valid telemedicine started event for a dermatologist session on tablet with poor connection.
   */
  dermatologistTabletPoorConnection: {
    type: JourneyEvents.Care.TELEMEDICINE_STARTED,
    userId: TEST_USER_IDS.premium,
    payload: {
      sessionId: uuidv4(),
      appointmentId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.dermatologist,
      startedAt: new Date().toISOString(),
      deviceType: 'tablet',
      connectionType: 'WiFi',
      osInfo: 'Android 12',
      networkQuality: 'poor',
      hasVideo: true,
      hasAudio: false, // Audio issues
    },
    metadata: createCareEventMetadata({
      origin: { component: 'telemedicine-service' }
    }),
  } as BaseCareEvent & { payload: TelemedicineStartedPayload },

  /**
   * Valid telemedicine started event for a pediatrician session on web with audio only.
   */
  pediatricianWebAudioOnly: {
    type: JourneyEvents.Care.TELEMEDICINE_STARTED,
    userId: TEST_USER_IDS.family,
    payload: {
      sessionId: uuidv4(),
      appointmentId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.pediatrician,
      startedAt: new Date().toISOString(),
      deviceType: 'web',
      connectionType: 'WiFi',
      browserInfo: 'Firefox 97.0',
      osInfo: 'macOS 12.2',
      networkQuality: 'fair',
      hasVideo: false, // Video disabled
      hasAudio: true,
    },
    metadata: createCareEventMetadata({
      origin: { component: 'telemedicine-service' }
    }),
  } as BaseCareEvent & { payload: TelemedicineStartedPayload },
};

/**
 * Telemedicine completed event fixtures for testing.
 */
export const telemedicineCompletedEvents = {
  /**
   * Valid telemedicine completed event for a psychiatrist session.
   */
  psychiatrist: {
    type: JourneyEvents.Care.TELEMEDICINE_COMPLETED,
    userId: TEST_USER_IDS.family,
    payload: {
      sessionId: telemedicineStartedEvents.psychiatristMobile.payload.sessionId,
      appointmentId: telemedicineStartedEvents.psychiatristMobile.payload.appointmentId,
      providerId: TEST_PROVIDER_IDS.psychiatrist,
      startedAt: telemedicineStartedEvents.psychiatristMobile.payload.startedAt,
      endedAt: new Date(new Date(telemedicineStartedEvents.psychiatristMobile.payload.startedAt).getTime() + 50 * 60 * 1000).toISOString(), // 50 minutes after start
      duration: 50,
      quality: 'good',
      disconnections: 0,
      patientRating: 4,
      providerRating: 5,
      followUpScheduled: true,
    },
    metadata: createCareEventMetadata({
      correlationId: telemedicineStartedEvents.psychiatristMobile.metadata.correlationId,
      origin: { component: 'telemedicine-service' }
    }),
  } as BaseCareEvent & { payload: TelemedicineCompletedPayload },

  /**
   * Valid telemedicine completed event for a general practitioner session with technical issues.
   */
  generalPractitionerWithIssues: {
    type: JourneyEvents.Care.TELEMEDICINE_COMPLETED,
    userId: TEST_USER_IDS.standard,
    payload: {
      sessionId: telemedicineStartedEvents.generalPractitionerWeb.payload.sessionId,
      appointmentId: telemedicineStartedEvents.generalPractitionerWeb.payload.appointmentId,
      providerId: TEST_PROVIDER_IDS.generalPractitioner,
      startedAt: telemedicineStartedEvents.generalPractitionerWeb.payload.startedAt,
      endedAt: new Date(new Date(telemedicineStartedEvents.generalPractitionerWeb.payload.startedAt).getTime() + 25 * 60 * 1000).toISOString(), // 25 minutes after start
      duration: 25,
      quality: 'fair',
      disconnections: 2,
      technicalIssues: ['video freezing', 'audio echo'],
      patientRating: 3,
      providerRating: 4,
      followUpScheduled: false,
    },
    metadata: createCareEventMetadata({
      correlationId: telemedicineStartedEvents.generalPractitionerWeb.metadata.correlationId,
      origin: { component: 'telemedicine-service' }
    }),
  } as BaseCareEvent & { payload: TelemedicineCompletedPayload },

  /**
   * Valid telemedicine completed event for a dermatologist session with poor quality.
   */
  dermatologistPoorQuality: {
    type: JourneyEvents.Care.TELEMEDICINE_COMPLETED,
    userId: TEST_USER_IDS.premium,
    payload: {
      sessionId: telemedicineStartedEvents.dermatologistTabletPoorConnection.payload.sessionId,
      appointmentId: telemedicineStartedEvents.dermatologistTabletPoorConnection.payload.appointmentId,
      providerId: TEST_PROVIDER_IDS.dermatologist,
      startedAt: telemedicineStartedEvents.dermatologistTabletPoorConnection.payload.startedAt,
      endedAt: new Date(new Date(telemedicineStartedEvents.dermatologistTabletPoorConnection.payload.startedAt).getTime() + 15 * 60 * 1000).toISOString(), // 15 minutes after start
      duration: 15,
      quality: 'poor',
      disconnections: 4,
      technicalIssues: ['connection lost', 'video not available', 'audio cutting out'],
      patientRating: 2,
      providerRating: 3,
      followUpScheduled: true, // In-person follow-up needed due to poor connection
    },
    metadata: createCareEventMetadata({
      correlationId: telemedicineStartedEvents.dermatologistTabletPoorConnection.metadata.correlationId,
      origin: { component: 'telemedicine-service' }
    }),
  } as BaseCareEvent & { payload: TelemedicineCompletedPayload },
};

/**
 * Care plan created event fixtures for testing.
 */
export const carePlanCreatedEvents = {
  /**
   * Valid care plan created event for hypertension management.
   */
  hypertension: {
    type: JourneyEvents.Care.PLAN_CREATED,
    userId: TEST_USER_IDS.standard,
    payload: {
      planId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.cardiologist,
      planType: 'chronic_condition',
      condition: 'Hypertension',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months in future
      createdAt: new Date().toISOString(),
      goals: ['Reduce blood pressure to below 130/80', 'Maintain regular medication schedule', 'Reduce sodium intake'],
      taskCount: 12,
      checkInFrequency: 'weekly',
      severity: 'moderate',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'care-plan-service' }
    }),
  } as BaseCareEvent & { payload: CarePlanCreatedPayload },

  /**
   * Valid care plan created event for post-surgery recovery.
   */
  postSurgery: {
    type: JourneyEvents.Care.PLAN_CREATED,
    userId: TEST_USER_IDS.premium,
    payload: {
      planId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.orthopedist,
      planType: 'recovery',
      condition: 'Post-knee surgery rehabilitation',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months in future
      createdAt: new Date().toISOString(),
      goals: ['Regain full range of motion', 'Return to normal walking without assistance', 'Strengthen supporting muscles'],
      taskCount: 24,
      checkInFrequency: 'twice-weekly',
      severity: 'moderate',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'care-plan-service' }
    }),
  } as BaseCareEvent & { payload: CarePlanCreatedPayload },

  /**
   * Valid care plan created event for anxiety management.
   */
  anxiety: {
    type: JourneyEvents.Care.PLAN_CREATED,
    userId: TEST_USER_IDS.family,
    payload: {
      planId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.psychiatrist,
      planType: 'mental_health',
      condition: 'Generalized Anxiety Disorder',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months in future
      createdAt: new Date().toISOString(),
      goals: ['Reduce anxiety symptoms', 'Develop coping mechanisms', 'Establish regular mindfulness practice'],
      taskCount: 18,
      checkInFrequency: 'weekly',
      severity: 'moderate',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'care-plan-service' }
    }),
  } as BaseCareEvent & { payload: CarePlanCreatedPayload },

  /**
   * Valid care plan created event for preventive health for seniors.
   */
  seniorPreventive: {
    type: JourneyEvents.Care.PLAN_CREATED,
    userId: TEST_USER_IDS.senior,
    payload: {
      planId: uuidv4(),
      providerId: TEST_PROVIDER_IDS.generalPractitioner,
      planType: 'preventive',
      condition: 'Senior preventive health',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year in future
      createdAt: new Date().toISOString(),
      goals: ['Complete all recommended screenings', 'Maintain physical activity', 'Monitor chronic conditions'],
      taskCount: 15,
      checkInFrequency: 'monthly',
      severity: 'mild',
    },
    metadata: createCareEventMetadata({
      origin: { component: 'care-plan-service' }
    }),
  } as BaseCareEvent & { payload: CarePlanCreatedPayload },
};

/**
 * Care plan task completed event fixtures for testing.
 */
export const carePlanTaskCompletedEvents = {
  /**
   * Valid care plan task completed event for medication task.
   */
  medication: {
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    userId: TEST_USER_IDS.standard,
    payload: {
      taskId: uuidv4(),
      planId: carePlanCreatedEvents.hypertension.payload.planId,
      taskType: 'medication',
      completedAt: new Date().toISOString(),
      status: 'completed',
      scheduledAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      difficulty: 'easy',
      patientNotes: 'Took medication with breakfast',
    },
    metadata: createCareEventMetadata({
      correlationId: carePlanCreatedEvents.hypertension.metadata.correlationId,
      origin: { component: 'care-plan-tracker' }
    }),
  } as BaseCareEvent & { payload: CarePlanTaskCompletedPayload },

  /**
   * Valid care plan task completed event for exercise task.
   */
  exercise: {
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    userId: TEST_USER_IDS.premium,
    payload: {
      taskId: uuidv4(),
      planId: carePlanCreatedEvents.postSurgery.payload.planId,
      taskType: 'exercise',
      completedAt: new Date().toISOString(),
      status: 'completed',
      scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      difficulty: 'moderate',
      patientNotes: 'Completed all exercises, knee feels better today',
      duration: 30, // 30 minutes
    },
    metadata: createCareEventMetadata({
      correlationId: carePlanCreatedEvents.postSurgery.metadata.correlationId,
      origin: { component: 'care-plan-tracker' }
    }),
  } as BaseCareEvent & { payload: CarePlanTaskCompletedPayload },

  /**
   * Valid care plan task completed event for measurement task.
   */
  measurement: {
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    userId: TEST_USER_IDS.standard,
    payload: {
      taskId: uuidv4(),
      planId: carePlanCreatedEvents.hypertension.payload.planId,
      taskType: 'measurement',
      completedAt: new Date().toISOString(),
      status: 'completed',
      scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      difficulty: 'easy',
      patientNotes: 'Blood pressure seems to be improving',
      measurementValue: 135, // Systolic blood pressure
      measurementUnit: 'mmHg',
    },
    metadata: createCareEventMetadata({
      correlationId: carePlanCreatedEvents.hypertension.metadata.correlationId,
      origin: { component: 'care-plan-tracker' }
    }),
  } as BaseCareEvent & { payload: CarePlanTaskCompletedPayload },

  /**
   * Valid care plan task completed event for education task.
   */
  education: {
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    userId: TEST_USER_IDS.family,
    payload: {
      taskId: uuidv4(),
      planId: carePlanCreatedEvents.anxiety.payload.planId,
      taskType: 'education',
      completedAt: new Date().toISOString(),
      status: 'completed',
      scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      difficulty: 'easy',
      patientNotes: 'Learned new breathing techniques for anxiety management',
      duration: 15, // 15 minutes
    },
    metadata: createCareEventMetadata({
      correlationId: carePlanCreatedEvents.anxiety.metadata.correlationId,
      origin: { component: 'care-plan-tracker' }
    }),
  } as BaseCareEvent & { payload: CarePlanTaskCompletedPayload },

  /**
   * Valid care plan task completed event for appointment task.
   */
  appointment: {
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    userId: TEST_USER_IDS.senior,
    payload: {
      taskId: uuidv4(),
      planId: carePlanCreatedEvents.seniorPreventive.payload.planId,
      taskType: 'appointment',
      completedAt: new Date().toISOString(),
      status: 'completed',
      scheduledAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      difficulty: 'moderate',
      patientNotes: 'Completed annual checkup with Dr. Silva',
      duration: 45, // 45 minutes
    },
    metadata: createCareEventMetadata({
      correlationId: carePlanCreatedEvents.seniorPreventive.metadata.correlationId,
      origin: { component: 'care-plan-tracker' }
    }),
  } as BaseCareEvent & { payload: CarePlanTaskCompletedPayload },

  /**
   * Valid care plan task completed event for diet task, partially completed.
   */
  dietPartial: {
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    userId: TEST_USER_IDS.standard,
    payload: {
      taskId: uuidv4(),
      planId: carePlanCreatedEvents.hypertension.payload.planId,
      taskType: 'diet',
      completedAt: new Date().toISOString(),
      status: 'partially_completed',
      scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      difficulty: 'difficult',
      patientNotes: 'Followed low-sodium diet for most meals but had dinner at restaurant',
    },
    metadata: createCareEventMetadata({
      correlationId: carePlanCreatedEvents.hypertension.metadata.correlationId,
      origin: { component: 'care-plan-tracker' }
    }),
  } as BaseCareEvent & { payload: CarePlanTaskCompletedPayload },

  /**
   * Valid care plan task completed event for exercise task, skipped.
   */
  exerciseSkipped: {
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    userId: TEST_USER_IDS.premium,
    payload: {
      taskId: uuidv4(),
      planId: carePlanCreatedEvents.postSurgery.payload.planId,
      taskType: 'exercise',
      completedAt: new Date().toISOString(),
      status: 'skipped',
      scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      difficulty: 'difficult',
      patientNotes: 'Knee pain was too severe today, will try again tomorrow',
    },
    metadata: createCareEventMetadata({
      correlationId: carePlanCreatedEvents.postSurgery.metadata.correlationId,
      origin: { component: 'care-plan-tracker' }
    }),
  } as BaseCareEvent & { payload: CarePlanTaskCompletedPayload },
};

/**
 * Comprehensive collection of all care journey event fixtures.
 */
export const careEventFixtures = {
  appointmentBooked: appointmentBookedEvents,
  appointmentCompleted: appointmentCompletedEvents,
  medicationTaken: medicationTakenEvents,
  telemedicineStarted: telemedicineStartedEvents,
  telemedicineCompleted: telemedicineCompletedEvents,
  carePlanCreated: carePlanCreatedEvents,
  carePlanTaskCompleted: carePlanTaskCompletedEvents,
};

/**
 * Creates a custom appointment booking event with the specified overrides.
 * 
 * @param overrides Properties to override in the default appointment booking event
 * @returns A customized appointment booking event
 */
export function createAppointmentBookedEvent(overrides: Partial<AppointmentBookedPayload> = {}): BaseCareEvent & { payload: AppointmentBookedPayload } {
  const baseEvent = { ...appointmentBookedEvents.cardiologist };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      appointmentId: overrides.appointmentId || uuidv4(),
    },
    metadata: createCareEventMetadata({
      origin: { component: 'appointment-scheduler' }
    }),
  };
}

/**
 * Creates a custom medication taken event with the specified overrides.
 * 
 * @param overrides Properties to override in the default medication taken event
 * @returns A customized medication taken event
 */
export function createMedicationTakenEvent(overrides: Partial<MedicationTakenPayload> = {}): BaseCareEvent & { payload: MedicationTakenPayload } {
  const baseEvent = { ...medicationTakenEvents.bloodPressure };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      medicationId: overrides.medicationId || uuidv4(),
    },
    metadata: createCareEventMetadata({
      origin: { component: 'medication-tracker' }
    }),
  };
}

/**
 * Creates a custom telemedicine started event with the specified overrides.
 * 
 * @param overrides Properties to override in the default telemedicine started event
 * @returns A customized telemedicine started event
 */
export function createTelemedicineStartedEvent(overrides: Partial<TelemedicineStartedPayload> = {}): BaseCareEvent & { payload: TelemedicineStartedPayload } {
  const baseEvent = { ...telemedicineStartedEvents.psychiatristMobile };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      sessionId: overrides.sessionId || uuidv4(),
      appointmentId: overrides.appointmentId || uuidv4(),
    },
    metadata: createCareEventMetadata({
      origin: { component: 'telemedicine-service' }
    }),
  };
}

/**
 * Creates a custom care plan created event with the specified overrides.
 * 
 * @param overrides Properties to override in the default care plan created event
 * @returns A customized care plan created event
 */
export function createCarePlanCreatedEvent(overrides: Partial<CarePlanCreatedPayload> = {}): BaseCareEvent & { payload: CarePlanCreatedPayload } {
  const baseEvent = { ...carePlanCreatedEvents.hypertension };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      planId: overrides.planId || uuidv4(),
    },
    metadata: createCareEventMetadata({
      origin: { component: 'care-plan-service' }
    }),
  };
}

/**
 * Creates a custom care plan task completed event with the specified overrides.
 * 
 * @param overrides Properties to override in the default care plan task completed event
 * @returns A customized care plan task completed event
 */
export function createCarePlanTaskCompletedEvent(overrides: Partial<CarePlanTaskCompletedPayload> = {}): BaseCareEvent & { payload: CarePlanTaskCompletedPayload } {
  const baseEvent = { ...carePlanTaskCompletedEvents.medication };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      taskId: overrides.taskId || uuidv4(),
    },
    metadata: createCareEventMetadata({
      origin: { component: 'care-plan-tracker' }
    }),
  };
}

export default careEventFixtures;