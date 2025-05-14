import { v4 as uuidv4 } from 'uuid';
import { BaseEventDto } from '../../../../src/dto/base-event.dto';

/**
 * Mock data for Care journey events
 * 
 * These mocks are used for testing the validation, processing, and handling
 * of care-related events by the gamification engine.
 */

// Common user IDs for consistent testing
const TEST_USER_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const TEST_PROVIDER_ID = '7ea85f64-5717-4562-b3fc-2c963f66afa7';

// Appointment Events

/**
 * Mock for an appointment booking event
 */
export const APPOINTMENT_BOOKED_EVENT: BaseEventDto = {
  eventId: 'e1a85f64-5717-4562-b3fc-2c963f66afa1',
  type: 'APPOINTMENT_BOOKED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-15T10:30:00.000Z',
  data: {
    appointmentId: 'a1a85f64-5717-4562-b3fc-2c963f66afa1',
    status: 'booked',
    provider: {
      id: TEST_PROVIDER_ID,
      name: 'Dr. Carlos Silva',
      specialty: 'Cardiologia',
      crm: '123456'
    },
    scheduledAt: '2023-05-20T14:30:00.000Z',
    location: {
      name: 'Centro Médico AUSTA',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100'
    },
    notes: 'Consulta de rotina para avaliação cardíaca'
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c1a85f64-5717-4562-b3fc-2c963f66afa1',
    source: 'care-service'
  }
};

/**
 * Mock for an appointment check-in event
 */
export const APPOINTMENT_CHECKED_IN_EVENT: BaseEventDto = {
  eventId: 'e2a85f64-5717-4562-b3fc-2c963f66afa2',
  type: 'APPOINTMENT_CHECKED_IN',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-20T14:25:00.000Z',
  data: {
    appointmentId: 'a1a85f64-5717-4562-b3fc-2c963f66afa1',
    status: 'checked_in',
    provider: {
      id: TEST_PROVIDER_ID,
      name: 'Dr. Carlos Silva',
      specialty: 'Cardiologia',
      crm: '123456'
    },
    scheduledAt: '2023-05-20T14:30:00.000Z',
    checkedInAt: '2023-05-20T14:25:00.000Z',
    location: {
      name: 'Centro Médico AUSTA',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100'
    }
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c1a85f64-5717-4562-b3fc-2c963f66afa1',
    source: 'care-service'
  }
};

/**
 * Mock for an appointment completion event
 */
export const APPOINTMENT_COMPLETED_EVENT: BaseEventDto = {
  eventId: 'e3a85f64-5717-4562-b3fc-2c963f66afa3',
  type: 'APPOINTMENT_COMPLETED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-20T15:15:00.000Z',
  data: {
    appointmentId: 'a1a85f64-5717-4562-b3fc-2c963f66afa1',
    status: 'completed',
    provider: {
      id: TEST_PROVIDER_ID,
      name: 'Dr. Carlos Silva',
      specialty: 'Cardiologia',
      crm: '123456'
    },
    scheduledAt: '2023-05-20T14:30:00.000Z',
    checkedInAt: '2023-05-20T14:25:00.000Z',
    completedAt: '2023-05-20T15:15:00.000Z',
    durationMinutes: 45,
    location: {
      name: 'Centro Médico AUSTA',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100'
    },
    followUp: {
      recommended: true,
      timeframe: '3 months'
    }
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c1a85f64-5717-4562-b3fc-2c963f66afa1',
    source: 'care-service'
  }
};

/**
 * Mock for an appointment cancellation event
 */
export const APPOINTMENT_CANCELLED_EVENT: BaseEventDto = {
  eventId: 'e4a85f64-5717-4562-b3fc-2c963f66afa4',
  type: 'APPOINTMENT_CANCELLED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-18T09:45:00.000Z',
  data: {
    appointmentId: 'a2a85f64-5717-4562-b3fc-2c963f66afa2',
    status: 'cancelled',
    provider: {
      id: '8ea85f64-5717-4562-b3fc-2c963f66afa8',
      name: 'Dra. Ana Oliveira',
      specialty: 'Dermatologia',
      crm: '654321'
    },
    scheduledAt: '2023-05-22T10:00:00.000Z',
    cancelledAt: '2023-05-18T09:45:00.000Z',
    cancellationReason: 'Conflito de agenda',
    rescheduled: true,
    location: {
      name: 'Centro Médico AUSTA',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100'
    }
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c2a85f64-5717-4562-b3fc-2c963f66afa2',
    source: 'care-service'
  }
};

// Medication Events

/**
 * Mock for a medication taken event
 */
export const MEDICATION_TAKEN_EVENT: BaseEventDto = {
  eventId: 'e5a85f64-5717-4562-b3fc-2c963f66afa5',
  type: 'MEDICATION_TAKEN',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-15T08:00:00.000Z',
  data: {
    medicationId: 'm1a85f64-5717-4562-b3fc-2c963f66afa1',
    name: 'Atorvastatina',
    status: 'taken',
    dosage: {
      value: 20,
      unit: 'mg'
    },
    scheduledTime: '2023-05-15T08:00:00.000Z',
    actualTime: '2023-05-15T08:05:00.000Z',
    prescription: {
      id: 'p1a85f64-5717-4562-b3fc-2c963f66afa1',
      providerId: TEST_PROVIDER_ID,
      providerName: 'Dr. Carlos Silva',
      issuedAt: '2023-04-20T15:30:00.000Z',
      instructions: 'Tomar 1 comprimido por dia, pela manhã'
    },
    adherenceStreak: 7 // Number of consecutive days medication was taken
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c3a85f64-5717-4562-b3fc-2c963f66afa3',
    source: 'care-service'
  }
};

/**
 * Mock for a medication skipped event
 */
export const MEDICATION_SKIPPED_EVENT: BaseEventDto = {
  eventId: 'e6a85f64-5717-4562-b3fc-2c963f66afa6',
  type: 'MEDICATION_SKIPPED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-16T08:30:00.000Z',
  data: {
    medicationId: 'm1a85f64-5717-4562-b3fc-2c963f66afa1',
    name: 'Atorvastatina',
    status: 'skipped',
    dosage: {
      value: 20,
      unit: 'mg'
    },
    scheduledTime: '2023-05-16T08:00:00.000Z',
    skipReason: 'Esquecimento',
    prescription: {
      id: 'p1a85f64-5717-4562-b3fc-2c963f66afa1',
      providerId: TEST_PROVIDER_ID,
      providerName: 'Dr. Carlos Silva',
      issuedAt: '2023-04-20T15:30:00.000Z',
      instructions: 'Tomar 1 comprimido por dia, pela manhã'
    },
    adherenceStreak: 0 // Reset streak when medication is skipped
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c4a85f64-5717-4562-b3fc-2c963f66afa4',
    source: 'care-service'
  }
};

/**
 * Mock for a medication missed event
 */
export const MEDICATION_MISSED_EVENT: BaseEventDto = {
  eventId: 'e7a85f64-5717-4562-b3fc-2c963f66afa7',
  type: 'MEDICATION_MISSED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-17T12:00:00.000Z', // System detected missed medication
  data: {
    medicationId: 'm1a85f64-5717-4562-b3fc-2c963f66afa1',
    name: 'Atorvastatina',
    status: 'missed',
    dosage: {
      value: 20,
      unit: 'mg'
    },
    scheduledTime: '2023-05-17T08:00:00.000Z',
    detectedAt: '2023-05-17T12:00:00.000Z',
    prescription: {
      id: 'p1a85f64-5717-4562-b3fc-2c963f66afa1',
      providerId: TEST_PROVIDER_ID,
      providerName: 'Dr. Carlos Silva',
      issuedAt: '2023-04-20T15:30:00.000Z',
      instructions: 'Tomar 1 comprimido por dia, pela manhã'
    },
    adherenceStreak: 0, // Reset streak when medication is missed
    missedCount: 1 // Increment missed count
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c5a85f64-5717-4562-b3fc-2c963f66afa5',
    source: 'care-service'
  }
};

// Telemedicine Events

/**
 * Mock for a telemedicine session started event
 */
export const TELEMEDICINE_SESSION_STARTED_EVENT: BaseEventDto = {
  eventId: 'e8a85f64-5717-4562-b3fc-2c963f66afa8',
  type: 'TELEMEDICINE_SESSION_STARTED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-18T14:00:00.000Z',
  data: {
    sessionId: 's1a85f64-5717-4562-b3fc-2c963f66afa1',
    status: 'started',
    provider: {
      id: '9ea85f64-5717-4562-b3fc-2c963f66afa9',
      name: 'Dr. Roberto Mendes',
      specialty: 'Psiquiatria',
      crm: '789012'
    },
    startedAt: '2023-05-18T14:00:00.000Z',
    appointmentId: 'a3a85f64-5717-4562-b3fc-2c963f66afa3',
    technicalDetails: {
      connectionQuality: 'excellent',
      deviceType: 'mobile',
      browserOrApp: 'AUSTA App',
      networkType: 'wifi'
    }
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c6a85f64-5717-4562-b3fc-2c963f66afa6',
    source: 'care-service'
  }
};

/**
 * Mock for a telemedicine session completed event
 */
export const TELEMEDICINE_SESSION_COMPLETED_EVENT: BaseEventDto = {
  eventId: 'e9a85f64-5717-4562-b3fc-2c963f66afa9',
  type: 'TELEMEDICINE_SESSION_COMPLETED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-18T14:45:00.000Z',
  data: {
    sessionId: 's1a85f64-5717-4562-b3fc-2c963f66afa1',
    status: 'completed',
    provider: {
      id: '9ea85f64-5717-4562-b3fc-2c963f66afa9',
      name: 'Dr. Roberto Mendes',
      specialty: 'Psiquiatria',
      crm: '789012'
    },
    startedAt: '2023-05-18T14:00:00.000Z',
    endedAt: '2023-05-18T14:45:00.000Z',
    durationMinutes: 45,
    appointmentId: 'a3a85f64-5717-4562-b3fc-2c963f66afa3',
    notes: 'Consulta realizada com sucesso. Paciente relatou melhora dos sintomas.',
    prescriptionGenerated: true,
    followUpRecommended: true,
    technicalDetails: {
      connectionQuality: 'good',
      deviceType: 'mobile',
      browserOrApp: 'AUSTA App',
      networkType: 'wifi',
      disconnectionCount: 0
    },
    patientFeedback: {
      rating: 5,
      comments: 'Ótimo atendimento, muito prático.'
    }
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c6a85f64-5717-4562-b3fc-2c963f66afa6',
    source: 'care-service'
  }
};

/**
 * Mock for a telemedicine session cancelled event
 */
export const TELEMEDICINE_SESSION_CANCELLED_EVENT: BaseEventDto = {
  eventId: 'e0b85f64-5717-4562-b3fc-2c963f66afb0',
  type: 'TELEMEDICINE_SESSION_CANCELLED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-19T09:50:00.000Z',
  data: {
    sessionId: 's2a85f64-5717-4562-b3fc-2c963f66afa2',
    status: 'cancelled',
    provider: {
      id: '0fa85f64-5717-4562-b3fc-2c963f66afb0',
      name: 'Dra. Mariana Costa',
      specialty: 'Nutrição',
      crm: '345678'
    },
    scheduledAt: '2023-05-19T10:00:00.000Z',
    cancelledAt: '2023-05-19T09:50:00.000Z',
    appointmentId: 'a4a85f64-5717-4562-b3fc-2c963f66afa4',
    cancellationReason: 'Problemas técnicos',
    cancelledBy: 'patient',
    rescheduled: true
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c7a85f64-5717-4562-b3fc-2c963f66afa7',
    source: 'care-service'
  }
};

// Care Plan Events

/**
 * Mock for a care plan progress event
 */
export const CARE_PLAN_PROGRESS_EVENT: BaseEventDto = {
  eventId: 'e1b85f64-5717-4562-b3fc-2c963f66afb1',
  type: 'CARE_PLAN_PROGRESS_UPDATED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-05-20T18:30:00.000Z',
  data: {
    carePlanId: 'cp1a85f64-5717-4562-b3fc-2c963f66afa1',
    title: 'Plano de Tratamento Cardíaco',
    provider: {
      id: TEST_PROVIDER_ID,
      name: 'Dr. Carlos Silva',
      specialty: 'Cardiologia',
      crm: '123456'
    },
    startDate: '2023-04-20T00:00:00.000Z',
    endDate: '2023-07-20T00:00:00.000Z',
    progress: {
      previousPercentage: 35,
      currentPercentage: 40,
      lastUpdated: '2023-05-20T18:30:00.000Z'
    },
    activities: [
      {
        id: 'ca1a85f64-5717-4562-b3fc-2c963f66afa1',
        type: 'medication',
        title: 'Tomar Atorvastatina',
        status: 'in_progress',
        adherencePercentage: 85
      },
      {
        id: 'ca2a85f64-5717-4562-b3fc-2c963f66afa2',
        type: 'exercise',
        title: 'Caminhada diária',
        status: 'in_progress',
        adherencePercentage: 60
      },
      {
        id: 'ca3a85f64-5717-4562-b3fc-2c963f66afa3',
        type: 'diet',
        title: 'Dieta com baixo teor de sódio',
        status: 'in_progress',
        adherencePercentage: 75
      },
      {
        id: 'ca4a85f64-5717-4562-b3fc-2c963f66afa4',
        type: 'appointment',
        title: 'Consulta de acompanhamento',
        status: 'completed',
        adherencePercentage: 100
      }
    ],
    notes: 'Progresso satisfatório no plano de tratamento. Continuar monitoramento.'
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c8a85f64-5717-4562-b3fc-2c963f66afa8',
    source: 'care-service'
  }
};

/**
 * Mock for a care plan completed event
 */
export const CARE_PLAN_COMPLETED_EVENT: BaseEventDto = {
  eventId: 'e2b85f64-5717-4562-b3fc-2c963f66afb2',
  type: 'CARE_PLAN_COMPLETED',
  userId: TEST_USER_ID,
  journey: 'care',
  timestamp: '2023-07-20T16:45:00.000Z',
  data: {
    carePlanId: 'cp1a85f64-5717-4562-b3fc-2c963f66afa1',
    title: 'Plano de Tratamento Cardíaco',
    provider: {
      id: TEST_PROVIDER_ID,
      name: 'Dr. Carlos Silva',
      specialty: 'Cardiologia',
      crm: '123456'
    },
    startDate: '2023-04-20T00:00:00.000Z',
    endDate: '2023-07-20T00:00:00.000Z',
    completedAt: '2023-07-20T16:45:00.000Z',
    overallAdherencePercentage: 85,
    outcomes: {
      successful: true,
      healthImprovements: [
        'Redução dos níveis de colesterol',
        'Melhora da capacidade cardiovascular',
        'Redução da pressão arterial'
      ]
    },
    followUpPlan: {
      recommended: true,
      type: 'maintenance',
      nextAppointment: '2023-08-20T14:30:00.000Z'
    },
    notes: 'Plano de tratamento concluído com sucesso. Paciente apresentou melhora significativa.'
  },
  metadata: {
    version: '1.0.0',
    correlationId: 'c9a85f64-5717-4562-b3fc-2c963f66afa9',
    source: 'care-service'
  }
};

// Export collections for easier access in tests

/**
 * Collection of appointment-related events
 */
export const APPOINTMENT_EVENTS = {
  BOOKED: APPOINTMENT_BOOKED_EVENT,
  CHECKED_IN: APPOINTMENT_CHECKED_IN_EVENT,
  COMPLETED: APPOINTMENT_COMPLETED_EVENT,
  CANCELLED: APPOINTMENT_CANCELLED_EVENT
};

/**
 * Collection of medication-related events
 */
export const MEDICATION_EVENTS = {
  TAKEN: MEDICATION_TAKEN_EVENT,
  SKIPPED: MEDICATION_SKIPPED_EVENT,
  MISSED: MEDICATION_MISSED_EVENT
};

/**
 * Collection of telemedicine-related events
 */
export const TELEMEDICINE_EVENTS = {
  STARTED: TELEMEDICINE_SESSION_STARTED_EVENT,
  COMPLETED: TELEMEDICINE_SESSION_COMPLETED_EVENT,
  CANCELLED: TELEMEDICINE_SESSION_CANCELLED_EVENT
};

/**
 * Collection of care plan-related events
 */
export const CARE_PLAN_EVENTS = {
  PROGRESS_UPDATED: CARE_PLAN_PROGRESS_EVENT,
  COMPLETED: CARE_PLAN_COMPLETED_EVENT
};

/**
 * All care journey events grouped by category
 */
export const ALL_CARE_EVENTS = {
  APPOINTMENT: APPOINTMENT_EVENTS,
  MEDICATION: MEDICATION_EVENTS,
  TELEMEDICINE: TELEMEDICINE_EVENTS,
  CARE_PLAN: CARE_PLAN_EVENTS
};