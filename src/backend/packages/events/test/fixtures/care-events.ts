/**
 * @file care-events.ts
 * @description Test fixtures for Care journey events in the AUSTA SuperApp.
 * 
 * This file provides standardized test data for care-related events with realistic values
 * for testing gamification rules, achievement processing, and notifications related to the
 * Care journey. These fixtures ensure consistent test data across care-related event consumers.
 * 
 * Includes fixtures for:
 * - Appointment booking events (booked, checked-in, completed, canceled)
 * - Medication adherence events (different compliance scenarios)
 * - Telemedicine session events (full lifecycle)
 * - Care plan progress events (different completion states)
 */

import { JourneyEvents } from '../../src/dto/event-types.enum';

/**
 * Enum for appointment types in the Care journey
 */
export enum AppointmentType {
  IN_PERSON = 'in_person',
  TELEMEDICINE = 'telemedicine',
  HOME_VISIT = 'home_visit'
}

/**
 * Enum for appointment status in the Care journey
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  NO_SHOW = 'no_show'
}

/**
 * Enum for medication adherence status in the Care journey
 */
export enum MedicationAdherenceStatus {
  ON_TIME = 'on_time',
  LATE = 'late',
  MISSED = 'missed',
  SKIPPED = 'skipped'
}

/**
 * Enum for telemedicine session quality in the Care journey
 */
export enum TelemedicineQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

/**
 * Enum for care plan task types in the Care journey
 */
export enum CarePlanTaskType {
  MEDICATION = 'medication',
  EXERCISE = 'exercise',
  APPOINTMENT = 'appointment',
  MEASUREMENT = 'measurement',
  EDUCATION = 'education'
}

/**
 * Enum for care plan task completion status in the Care journey
 */
export enum CarePlanTaskStatus {
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  SKIPPED = 'skipped',
  MISSED = 'missed'
}

/**
 * Enum for provider specialties in the Care journey
 */
export enum ProviderSpecialty {
  CARDIOLOGIA = 'Cardiologia',
  DERMATOLOGIA = 'Dermatologia',
  ORTOPEDIA = 'Ortopedia',
  PEDIATRIA = 'Pediatria',
  PSIQUIATRIA = 'Psiquiatria'
}

/**
 * Base event fixture with common properties
 */
const baseEvent = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  timestamp: new Date().toISOString(),
  metadata: {
    source: 'care-service',
    version: '1.0.0',
    correlationId: '123e4567-e89b-12d3-a456-426614174001'
  }
};

/**
 * Appointment booking event fixtures
 */
export const appointmentBookedEvents = {
  /**
   * Standard in-person appointment booking
   */
  standard: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174002',
      providerId: '123e4567-e89b-12d3-a456-426614174003',
      specialtyType: ProviderSpecialty.CARDIOLOGIA,
      appointmentType: AppointmentType.IN_PERSON,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days in the future
      bookedAt: new Date().toISOString(),
      status: AppointmentStatus.SCHEDULED,
      location: 'AUSTA Clínica - Unidade Centro',
      notes: 'Consulta de rotina'
    }
  },

  /**
   * Telemedicine appointment booking
   */
  telemedicine: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174004',
      providerId: '123e4567-e89b-12d3-a456-426614174005',
      specialtyType: ProviderSpecialty.PSIQUIATRIA,
      appointmentType: AppointmentType.TELEMEDICINE,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days in the future
      bookedAt: new Date().toISOString(),
      status: AppointmentStatus.SCHEDULED,
      platform: 'AUSTA Telemedicina',
      notes: 'Acompanhamento mensal'
    }
  },

  /**
   * Home visit appointment booking
   */
  homeVisit: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174006',
      providerId: '123e4567-e89b-12d3-a456-426614174007',
      specialtyType: ProviderSpecialty.ORTOPEDIA,
      appointmentType: AppointmentType.HOME_VISIT,
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in the future
      bookedAt: new Date().toISOString(),
      status: AppointmentStatus.SCHEDULED,
      address: 'Rua das Flores, 123 - Jardim Primavera',
      notes: 'Paciente com dificuldade de locomoção'
    }
  },

  /**
   * Urgent same-day appointment booking
   */
  urgent: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_BOOKED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174008',
      providerId: '123e4567-e89b-12d3-a456-426614174009',
      specialtyType: ProviderSpecialty.DERMATOLOGIA,
      appointmentType: AppointmentType.IN_PERSON,
      scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours in the future
      bookedAt: new Date().toISOString(),
      status: AppointmentStatus.SCHEDULED,
      location: 'AUSTA Clínica - Unidade Norte',
      isUrgent: true,
      notes: 'Reação alérgica severa'
    }
  }
};

/**
 * Appointment completed event fixtures
 */
export const appointmentCompletedEvents = {
  /**
   * Standard in-person appointment completion
   */
  standard: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174002',
      providerId: '123e4567-e89b-12d3-a456-426614174003',
      appointmentType: AppointmentType.IN_PERSON,
      scheduledAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour in the past
      completedAt: new Date().toISOString(),
      duration: 30, // minutes
      status: AppointmentStatus.COMPLETED,
      followUpNeeded: true,
      followUpIn: 90, // days
      notes: 'Paciente apresentou melhora. Recomendado retorno em 3 meses.'
    }
  },

  /**
   * Telemedicine appointment completion
   */
  telemedicine: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174004',
      providerId: '123e4567-e89b-12d3-a456-426614174005',
      appointmentType: AppointmentType.TELEMEDICINE,
      scheduledAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes in the past
      completedAt: new Date().toISOString(),
      duration: 25, // minutes
      status: AppointmentStatus.COMPLETED,
      connectionQuality: TelemedicineQuality.GOOD,
      followUpNeeded: true,
      followUpIn: 30, // days
      notes: 'Consulta realizada com sucesso. Ajuste na medicação.'
    }
  },

  /**
   * Home visit appointment completion
   */
  homeVisit: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174006',
      providerId: '123e4567-e89b-12d3-a456-426614174007',
      appointmentType: AppointmentType.HOME_VISIT,
      scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours in the past
      completedAt: new Date().toISOString(),
      duration: 45, // minutes
      status: AppointmentStatus.COMPLETED,
      followUpNeeded: true,
      followUpIn: 14, // days
      notes: 'Avaliação realizada em domicílio. Paciente com boa evolução.'
    }
  },

  /**
   * No-show appointment
   */
  noShow: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174010',
      providerId: '123e4567-e89b-12d3-a456-426614174011',
      appointmentType: AppointmentType.IN_PERSON,
      scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day in the past
      completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // 23 hours in the past
      status: AppointmentStatus.NO_SHOW,
      notes: 'Paciente não compareceu à consulta agendada.'
    }
  },

  /**
   * Canceled appointment
   */
  canceled: {
    ...baseEvent,
    type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
    journey: 'care',
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174012',
      providerId: '123e4567-e89b-12d3-a456-426614174013',
      appointmentType: AppointmentType.TELEMEDICINE,
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days in the past
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days in the past (canceled in advance)
      status: AppointmentStatus.CANCELED,
      cancellationReason: 'Paciente solicitou cancelamento',
      rescheduled: true,
      notes: 'Consulta cancelada pelo paciente e reagendada.'
    }
  }
};

/**
 * Medication taken event fixtures
 */
export const medicationTakenEvents = {
  /**
   * On-time medication adherence
   */
  onTime: {
    ...baseEvent,
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    journey: 'care',
    data: {
      medicationId: '123e4567-e89b-12d3-a456-426614174014',
      medicationName: 'Losartana 50mg',
      dosage: '1 comprimido',
      takenAt: new Date().toISOString(),
      scheduledAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes in the past
      adherence: MedicationAdherenceStatus.ON_TIME,
      streak: 7, // days in a row
      notes: 'Tomado conforme prescrito'
    }
  },

  /**
   * Late medication adherence
   */
  late: {
    ...baseEvent,
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    journey: 'care',
    data: {
      medicationId: '123e4567-e89b-12d3-a456-426614174015',
      medicationName: 'Metformina 850mg',
      dosage: '1 comprimido',
      takenAt: new Date().toISOString(),
      scheduledAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours in the past
      adherence: MedicationAdherenceStatus.LATE,
      streak: 4, // days in a row
      notes: 'Tomado com atraso'
    }
  },

  /**
   * Missed medication
   */
  missed: {
    ...baseEvent,
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    journey: 'care',
    data: {
      medicationId: '123e4567-e89b-12d3-a456-426614174016',
      medicationName: 'Levotiroxina 75mcg',
      dosage: '1 comprimido',
      takenAt: null,
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours in the past
      adherence: MedicationAdherenceStatus.MISSED,
      streak: 0, // reset streak
      notes: 'Medicação não tomada'
    }
  },

  /**
   * Skipped medication (intentionally)
   */
  skipped: {
    ...baseEvent,
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    journey: 'care',
    data: {
      medicationId: '123e4567-e89b-12d3-a456-426614174017',
      medicationName: 'Dipirona 500mg',
      dosage: '1 comprimido se necessário',
      takenAt: null,
      scheduledAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours in the past
      adherence: MedicationAdherenceStatus.SKIPPED,
      reason: 'Não foi necessário tomar',
      notes: 'Medicação de uso conforme necessidade não foi tomada por ausência de sintomas'
    }
  },

  /**
   * Multiple medications taken at once
   */
  multiple: {
    ...baseEvent,
    type: JourneyEvents.Care.MEDICATION_TAKEN,
    journey: 'care',
    data: {
      medications: [
        {
          medicationId: '123e4567-e89b-12d3-a456-426614174018',
          medicationName: 'Enalapril 10mg',
          dosage: '1 comprimido',
          adherence: MedicationAdherenceStatus.ON_TIME
        },
        {
          medicationId: '123e4567-e89b-12d3-a456-426614174019',
          medicationName: 'Hidroclorotiazida 25mg',
          dosage: '1 comprimido',
          adherence: MedicationAdherenceStatus.ON_TIME
        }
      ],
      takenAt: new Date().toISOString(),
      scheduledAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes in the past
      streak: 12, // days in a row
      notes: 'Medicações matinais tomadas juntas'
    }
  }
};

/**
 * Telemedicine session event fixtures
 */
export const telemedicineEvents = {
  /**
   * Telemedicine session started
   */
  started: {
    ...baseEvent,
    type: JourneyEvents.Care.TELEMEDICINE_STARTED,
    journey: 'care',
    data: {
      sessionId: '123e4567-e89b-12d3-a456-426614174020',
      appointmentId: '123e4567-e89b-12d3-a456-426614174004',
      providerId: '123e4567-e89b-12d3-a456-426614174005',
      startedAt: new Date().toISOString(),
      deviceType: 'mobile',
      platform: 'AUSTA Telemedicina',
      networkType: 'wifi',
      notes: 'Sessão iniciada pelo paciente'
    }
  },

  /**
   * Telemedicine session completed successfully
   */
  completed: {
    ...baseEvent,
    type: JourneyEvents.Care.TELEMEDICINE_COMPLETED,
    journey: 'care',
    data: {
      sessionId: '123e4567-e89b-12d3-a456-426614174020',
      appointmentId: '123e4567-e89b-12d3-a456-426614174004',
      providerId: '123e4567-e89b-12d3-a456-426614174005',
      startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes in the past
      endedAt: new Date().toISOString(),
      duration: 28, // minutes
      quality: TelemedicineQuality.EXCELLENT,
      technicalIssues: false,
      notes: 'Consulta realizada com sucesso sem problemas técnicos'
    }
  },

  /**
   * Telemedicine session with technical issues
   */
  technicalIssues: {
    ...baseEvent,
    type: JourneyEvents.Care.TELEMEDICINE_COMPLETED,
    journey: 'care',
    data: {
      sessionId: '123e4567-e89b-12d3-a456-426614174021',
      appointmentId: '123e4567-e89b-12d3-a456-426614174022',
      providerId: '123e4567-e89b-12d3-a456-426614174023',
      startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes in the past
      endedAt: new Date().toISOString(),
      duration: 35, // minutes
      quality: TelemedicineQuality.POOR,
      technicalIssues: true,
      issueType: 'connection',
      reconnectionCount: 3,
      notes: 'Consulta realizada com dificuldades técnicas de conexão'
    }
  },

  /**
   * Telemedicine session abandoned due to technical issues
   */
  abandoned: {
    ...baseEvent,
    type: JourneyEvents.Care.TELEMEDICINE_COMPLETED,
    journey: 'care',
    data: {
      sessionId: '123e4567-e89b-12d3-a456-426614174024',
      appointmentId: '123e4567-e89b-12d3-a456-426614174025',
      providerId: '123e4567-e89b-12d3-a456-426614174026',
      startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes in the past
      endedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes in the past
      duration: 5, // minutes
      quality: TelemedicineQuality.POOR,
      technicalIssues: true,
      issueType: 'audio',
      abandoned: true,
      rescheduled: true,
      notes: 'Consulta abandonada devido a problemas técnicos de áudio. Reagendada.'
    }
  }
};

/**
 * Care plan event fixtures
 */
export const carePlanEvents = {
  /**
   * Care plan created
   */
  created: {
    ...baseEvent,
    type: JourneyEvents.Care.PLAN_CREATED,
    journey: 'care',
    data: {
      planId: '123e4567-e89b-12d3-a456-426614174027',
      providerId: '123e4567-e89b-12d3-a456-426614174003',
      planType: 'chronic_condition',
      condition: 'Hipertensão',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days in the future
      createdAt: new Date().toISOString(),
      taskCount: 12,
      notes: 'Plano de cuidados para controle de hipertensão'
    }
  },

  /**
   * Care plan task completed (medication)
   */
  medicationTaskCompleted: {
    ...baseEvent,
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    journey: 'care',
    data: {
      taskId: '123e4567-e89b-12d3-a456-426614174028',
      planId: '123e4567-e89b-12d3-a456-426614174027',
      taskType: CarePlanTaskType.MEDICATION,
      completedAt: new Date().toISOString(),
      status: CarePlanTaskStatus.COMPLETED,
      description: 'Tomar Losartana 50mg diariamente',
      dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour in the past
      completionPercentage: 100,
      notes: 'Medicação tomada conforme prescrito'
    }
  },

  /**
   * Care plan task completed (exercise)
   */
  exerciseTaskCompleted: {
    ...baseEvent,
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    journey: 'care',
    data: {
      taskId: '123e4567-e89b-12d3-a456-426614174029',
      planId: '123e4567-e89b-12d3-a456-426614174027',
      taskType: CarePlanTaskType.EXERCISE,
      completedAt: new Date().toISOString(),
      status: CarePlanTaskStatus.COMPLETED,
      description: 'Realizar 30 minutos de caminhada',
      dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours in the past
      completionPercentage: 100,
      duration: 35, // minutes
      notes: 'Exercício realizado por mais tempo que o recomendado'
    }
  },

  /**
   * Care plan task partially completed
   */
  partiallyCompleted: {
    ...baseEvent,
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    journey: 'care',
    data: {
      taskId: '123e4567-e89b-12d3-a456-426614174030',
      planId: '123e4567-e89b-12d3-a456-426614174027',
      taskType: CarePlanTaskType.EXERCISE,
      completedAt: new Date().toISOString(),
      status: CarePlanTaskStatus.PARTIALLY_COMPLETED,
      description: 'Realizar 30 minutos de caminhada',
      dueDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours in the past
      completionPercentage: 50,
      duration: 15, // minutes
      notes: 'Exercício realizado parcialmente devido a dores nas pernas'
    }
  },

  /**
   * Care plan task missed
   */
  missed: {
    ...baseEvent,
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    journey: 'care',
    data: {
      taskId: '123e4567-e89b-12d3-a456-426614174031',
      planId: '123e4567-e89b-12d3-a456-426614174027',
      taskType: CarePlanTaskType.MEASUREMENT,
      completedAt: null,
      status: CarePlanTaskStatus.MISSED,
      description: 'Medir pressão arterial',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours in the past
      completionPercentage: 0,
      notes: 'Paciente esqueceu de realizar a medição'
    }
  },

  /**
   * Care plan task skipped
   */
  skipped: {
    ...baseEvent,
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    journey: 'care',
    data: {
      taskId: '123e4567-e89b-12d3-a456-426614174032',
      planId: '123e4567-e89b-12d3-a456-426614174027',
      taskType: CarePlanTaskType.EDUCATION,
      completedAt: null,
      status: CarePlanTaskStatus.SKIPPED,
      description: 'Assistir vídeo educativo sobre hipertensão',
      dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours in the past
      completionPercentage: 0,
      skipReason: 'Já conhece o conteúdo',
      notes: 'Paciente já assistiu a este vídeo anteriormente'
    }
  },

  /**
   * Care plan appointment task completed
   */
  appointmentTaskCompleted: {
    ...baseEvent,
    type: JourneyEvents.Care.PLAN_TASK_COMPLETED,
    journey: 'care',
    data: {
      taskId: '123e4567-e89b-12d3-a456-426614174033',
      planId: '123e4567-e89b-12d3-a456-426614174027',
      taskType: CarePlanTaskType.APPOINTMENT,
      completedAt: new Date().toISOString(),
      status: CarePlanTaskStatus.COMPLETED,
      description: 'Consulta de acompanhamento com cardiologista',
      dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour in the past
      completionPercentage: 100,
      appointmentId: '123e4567-e89b-12d3-a456-426614174002',
      notes: 'Consulta realizada conforme agendado'
    }
  }
};

/**
 * Export all care journey event fixtures
 */
export const careEvents = {
  appointmentBookedEvents,
  appointmentCompletedEvents,
  medicationTakenEvents,
  telemedicineEvents,
  carePlanEvents
};

export default careEvents;