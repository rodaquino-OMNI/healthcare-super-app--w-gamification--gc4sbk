import { 
  AppointmentBookedEventDto, 
  AppointmentStatusUpdatedEventDto, 
  MedicationTrackedEventDto, 
  TelemedicineSessionEventDto, 
  CarePlanProgressEventDto,
  ProviderInfoDto,
  LocationInfoDto,
  AppointmentStatus,
  CareProviderType,
  MedicationAdherenceStatus,
  TelemedicineSessionType,
  CarePlanProgressStatus
} from '../../../src/dto/care-event.dto';
import { EventTypes } from '../../../src/dto/event-types.enum';

/**
 * Test fixtures for Care journey events.
 * These fixtures provide realistic test data for validating care event processing,
 * with healthcare-related data for comprehensive event testing.
 */

// Common user IDs for test fixtures
const TEST_USER_IDS = {
  standard: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  premium: '7ecdf2a8-45cc-4e34-b18b-3670979a4d1a',
  family: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'
};

// Common provider IDs for test fixtures
const TEST_PROVIDER_IDS = {
  cardiologist: '5e8f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f8f',
  dermatologist: '6f9f9f9f-9f9f-9f9f-9f9f-9f9f9f9f9f9f',
  orthopedist: '7a0a0a0a-0a0a-0a0a-0a0a-0a0a0a0a0a0a',
  pediatrician: '8b1b1b1b-1b1b-1b1b-1b1b-1b1b1b1b1b1b',
  psychiatrist: '9c2c2c2c-2c2c-2c2c-2c2c-2c2c2c2c2c2c'
};

/**
 * Provider information fixtures for use in appointment and telemedicine events
 */
export const providerInfoFixtures: Record<string, ProviderInfoDto> = {
  cardiologist: {
    id: TEST_PROVIDER_IDS.cardiologist,
    name: 'Dr. Ana Cardoso',
    type: CareProviderType.SPECIALIST,
    specialization: 'Cardiologia'
  },
  dermatologist: {
    id: TEST_PROVIDER_IDS.dermatologist,
    name: 'Dr. Paulo Pele',
    type: CareProviderType.SPECIALIST,
    specialization: 'Dermatologia'
  },
  orthopedist: {
    id: TEST_PROVIDER_IDS.orthopedist,
    name: 'Dr. Oscar Ossos',
    type: CareProviderType.SPECIALIST,
    specialization: 'Ortopedia'
  },
  pediatrician: {
    id: TEST_PROVIDER_IDS.pediatrician,
    name: 'Dra. Patrícia Criança',
    type: CareProviderType.SPECIALIST,
    specialization: 'Pediatria'
  },
  psychiatrist: {
    id: TEST_PROVIDER_IDS.psychiatrist,
    name: 'Dr. Miguel Mente',
    type: CareProviderType.SPECIALIST,
    specialization: 'Psiquiatria'
  },
  generalPractitioner: {
    id: '1d3d3d3d-3d3d-3d3d-3d3d-3d3d3d3d3d3d',
    name: 'Dra. Gabriela Geral',
    type: CareProviderType.GENERAL_PRACTITIONER
  },
  nurse: {
    id: '2e4e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e',
    name: 'Enf. Natália Cuidado',
    type: CareProviderType.NURSE
  },
  nutritionist: {
    id: '3f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
    name: 'Nut. Nina Nutrição',
    type: CareProviderType.NUTRITIONIST
  }
};

/**
 * Location information fixtures for use in appointment events
 */
export const locationInfoFixtures: Record<string, LocationInfoDto> = {
  mainClinic: {
    name: 'Clínica AUSTA Central',
    address: 'Av. Paulista, 1000, São Paulo, SP',
    isVirtual: false
  },
  branchClinic: {
    name: 'Clínica AUSTA Zona Sul',
    address: 'Av. Ibirapuera, 500, São Paulo, SP',
    isVirtual: false
  },
  hospital: {
    name: 'Hospital AUSTA',
    address: 'Rua Augusta, 1500, São Paulo, SP',
    isVirtual: false
  },
  virtual: {
    name: 'Consulta Virtual AUSTA',
    isVirtual: true
  }
};

/**
 * Appointment booking event fixtures
 */
export const appointmentBookedEventFixtures: AppointmentBookedEventDto[] = [
  // Standard in-person appointment
  {
    type: EventTypes.CARE_APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-05-15T10:30:00Z',
    data: {
      appointmentId: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
      appointmentDate: '2023-05-20T14:00:00Z',
      provider: providerInfoFixtures.cardiologist,
      location: locationInfoFixtures.mainClinic,
      reason: 'Consulta de rotina para acompanhamento cardíaco',
      status: AppointmentStatus.SCHEDULED
    }
  },
  // Telemedicine appointment
  {
    type: EventTypes.CARE_APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.premium,
    journey: 'care',
    timestamp: '2023-05-16T09:15:00Z',
    data: {
      appointmentId: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
      appointmentDate: '2023-05-18T10:30:00Z',
      provider: providerInfoFixtures.dermatologist,
      location: locationInfoFixtures.virtual,
      reason: 'Avaliação de lesão na pele',
      status: AppointmentStatus.SCHEDULED
    }
  },
  // Urgent appointment
  {
    type: EventTypes.CARE_APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.family,
    journey: 'care',
    timestamp: '2023-05-16T16:45:00Z',
    data: {
      appointmentId: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
      appointmentDate: '2023-05-17T09:00:00Z',
      provider: providerInfoFixtures.pediatrician,
      location: locationInfoFixtures.branchClinic,
      reason: 'Febre alta e dor de garganta',
      status: AppointmentStatus.SCHEDULED
    }
  }
];

/**
 * Appointment status update event fixtures
 */
export const appointmentStatusUpdatedEventFixtures: AppointmentStatusUpdatedEventDto[] = [
  // Appointment checked in
  {
    type: EventTypes.CARE_APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-05-20T13:55:00Z',
    data: {
      appointmentId: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
      previousStatus: AppointmentStatus.SCHEDULED,
      newStatus: AppointmentStatus.CHECKED_IN,
      updatedAt: '2023-05-20T13:55:00Z'
    }
  },
  // Appointment completed
  {
    type: EventTypes.CARE_APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-05-20T14:45:00Z',
    data: {
      appointmentId: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
      previousStatus: AppointmentStatus.CHECKED_IN,
      newStatus: AppointmentStatus.COMPLETED,
      notes: 'Consulta realizada com sucesso. Paciente deve retornar em 3 meses.',
      updatedAt: '2023-05-20T14:45:00Z'
    }
  },
  // Appointment cancelled
  {
    type: EventTypes.CARE_APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.premium,
    journey: 'care',
    timestamp: '2023-05-17T18:30:00Z',
    data: {
      appointmentId: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
      previousStatus: AppointmentStatus.SCHEDULED,
      newStatus: AppointmentStatus.CANCELLED,
      notes: 'Paciente solicitou cancelamento por motivos pessoais.',
      updatedAt: '2023-05-17T18:30:00Z'
    }
  },
  // Appointment no-show
  {
    type: EventTypes.CARE_APPOINTMENT_BOOKED,
    userId: TEST_USER_IDS.family,
    journey: 'care',
    timestamp: '2023-05-17T09:30:00Z',
    data: {
      appointmentId: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
      previousStatus: AppointmentStatus.SCHEDULED,
      newStatus: AppointmentStatus.NO_SHOW,
      updatedAt: '2023-05-17T09:30:00Z'
    }
  }
];

/**
 * Medication tracking event fixtures
 */
export const medicationTrackedEventFixtures: MedicationTrackedEventDto[] = [
  // Medication taken on time
  {
    type: EventTypes.CARE_MEDICATION_TAKEN,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-05-15T08:00:00Z',
    data: {
      medicationId: 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a',
      medicationName: 'Losartana 50mg',
      status: MedicationAdherenceStatus.TAKEN,
      scheduledTime: '2023-05-15T08:00:00Z',
      trackedAt: '2023-05-15T08:00:00Z'
    }
  },
  // Medication taken late
  {
    type: EventTypes.CARE_MEDICATION_TAKEN,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-05-15T20:45:00Z',
    data: {
      medicationId: 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a',
      medicationName: 'Losartana 50mg',
      status: MedicationAdherenceStatus.DELAYED,
      scheduledTime: '2023-05-15T20:00:00Z',
      trackedAt: '2023-05-15T20:45:00Z',
      notes: 'Tomei com atraso devido a uma reunião de trabalho.'
    }
  },
  // Medication skipped
  {
    type: EventTypes.CARE_MEDICATION_TAKEN,
    userId: TEST_USER_IDS.premium,
    journey: 'care',
    timestamp: '2023-05-16T12:30:00Z',
    data: {
      medicationId: 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b',
      medicationName: 'Metformina 850mg',
      status: MedicationAdherenceStatus.SKIPPED,
      scheduledTime: '2023-05-16T12:00:00Z',
      trackedAt: '2023-05-16T12:30:00Z',
      notes: 'Pulei a dose por estar em jejum para exame de sangue.'
    }
  },
  // Medication missed
  {
    type: EventTypes.CARE_MEDICATION_TAKEN,
    userId: TEST_USER_IDS.family,
    journey: 'care',
    timestamp: '2023-05-17T09:00:00Z',
    data: {
      medicationId: 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c',
      medicationName: 'Amoxicilina 500mg',
      status: MedicationAdherenceStatus.MISSED,
      scheduledTime: '2023-05-16T22:00:00Z',
      trackedAt: '2023-05-17T09:00:00Z',
      notes: 'Esqueci de tomar a dose noturna.'
    }
  }
];

/**
 * Telemedicine session event fixtures
 */
export const telemedicineSessionEventFixtures: TelemedicineSessionEventDto[] = [
  // Video session started
  {
    type: EventTypes.CARE_TELEMEDICINE_STARTED,
    userId: TEST_USER_IDS.premium,
    journey: 'care',
    timestamp: '2023-05-18T10:30:00Z',
    data: {
      sessionId: 'g7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d',
      provider: providerInfoFixtures.dermatologist,
      sessionType: TelemedicineSessionType.VIDEO,
      startTime: '2023-05-18T10:30:00Z'
    }
  },
  // Video session completed
  {
    type: EventTypes.CARE_TELEMEDICINE_COMPLETED,
    userId: TEST_USER_IDS.premium,
    journey: 'care',
    timestamp: '2023-05-18T11:15:00Z',
    data: {
      sessionId: 'g7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d',
      provider: providerInfoFixtures.dermatologist,
      sessionType: TelemedicineSessionType.VIDEO,
      startTime: '2023-05-18T10:30:00Z',
      endTime: '2023-05-18T11:15:00Z',
      durationMinutes: 45,
      notes: 'Consulta realizada com sucesso. Receita enviada por e-mail.'
    }
  },
  // Audio-only session
  {
    type: EventTypes.CARE_TELEMEDICINE_COMPLETED,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-05-19T15:45:00Z',
    data: {
      sessionId: 'h8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e',
      provider: providerInfoFixtures.generalPractitioner,
      sessionType: TelemedicineSessionType.AUDIO,
      startTime: '2023-05-19T15:15:00Z',
      endTime: '2023-05-19T15:45:00Z',
      durationMinutes: 30,
      notes: 'Paciente com conexão instável de internet, consulta realizada apenas por áudio.'
    }
  },
  // Chat session
  {
    type: EventTypes.CARE_TELEMEDICINE_COMPLETED,
    userId: TEST_USER_IDS.family,
    journey: 'care',
    timestamp: '2023-05-20T09:30:00Z',
    data: {
      sessionId: 'i9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f',
      provider: providerInfoFixtures.nurse,
      sessionType: TelemedicineSessionType.CHAT,
      startTime: '2023-05-20T09:00:00Z',
      endTime: '2023-05-20T09:30:00Z',
      durationMinutes: 30,
      notes: 'Orientações de enfermagem fornecidas via chat.'
    }
  }
];

/**
 * Care plan progress event fixtures
 */
export const carePlanProgressEventFixtures: CarePlanProgressEventDto[] = [
  // Initial care plan with multiple items
  {
    type: EventTypes.CARE_PLAN_PROGRESS_UPDATED,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-05-15T11:00:00Z',
    data: {
      carePlanId: 'j0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a',
      items: [
        {
          itemId: 'k1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b',
          title: 'Medir pressão arterial diariamente',
          status: CarePlanProgressStatus.IN_PROGRESS,
          progress: 30,
          dueDate: '2023-06-15T23:59:59Z'
        },
        {
          itemId: 'l2a3b4c5-d6e7-5f6a-9b0c-1d2e3f4a5b6c',
          title: 'Realizar exame de sangue',
          status: CarePlanProgressStatus.NOT_STARTED,
          dueDate: '2023-05-30T23:59:59Z'
        },
        {
          itemId: 'm3b4c5d6-e7f8-6a7b-0c1d-2e3f4a5b6c7d',
          title: 'Consulta de retorno com cardiologista',
          status: CarePlanProgressStatus.SCHEDULED,
          dueDate: '2023-06-20T14:00:00Z'
        }
      ],
      overallProgress: 10,
      updatedAt: '2023-05-15T11:00:00Z'
    }
  },
  // Progress update on care plan
  {
    type: EventTypes.CARE_PLAN_PROGRESS_UPDATED,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-05-30T16:30:00Z',
    data: {
      carePlanId: 'j0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a',
      items: [
        {
          itemId: 'k1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b',
          title: 'Medir pressão arterial diariamente',
          status: CarePlanProgressStatus.IN_PROGRESS,
          progress: 65,
          dueDate: '2023-06-15T23:59:59Z'
        },
        {
          itemId: 'l2a3b4c5-d6e7-5f6a-9b0c-1d2e3f4a5b6c',
          title: 'Realizar exame de sangue',
          status: CarePlanProgressStatus.COMPLETED,
          progress: 100,
          dueDate: '2023-05-30T23:59:59Z',
          notes: 'Exame realizado no laboratório AUSTA em 29/05/2023.'
        },
        {
          itemId: 'm3b4c5d6-e7f8-6a7b-0c1d-2e3f4a5b6c7d',
          title: 'Consulta de retorno com cardiologista',
          status: CarePlanProgressStatus.SCHEDULED,
          dueDate: '2023-06-20T14:00:00Z'
        }
      ],
      overallProgress: 55,
      updatedAt: '2023-05-30T16:30:00Z'
    }
  },
  // Completed care plan
  {
    type: EventTypes.CARE_PLAN_PROGRESS_UPDATED,
    userId: TEST_USER_IDS.standard,
    journey: 'care',
    timestamp: '2023-06-20T15:00:00Z',
    data: {
      carePlanId: 'j0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a',
      items: [
        {
          itemId: 'k1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b',
          title: 'Medir pressão arterial diariamente',
          status: CarePlanProgressStatus.COMPLETED,
          progress: 100,
          dueDate: '2023-06-15T23:59:59Z',
          notes: 'Paciente manteve registro diário por 30 dias consecutivos.'
        },
        {
          itemId: 'l2a3b4c5-d6e7-5f6a-9b0c-1d2e3f4a5b6c',
          title: 'Realizar exame de sangue',
          status: CarePlanProgressStatus.COMPLETED,
          progress: 100,
          dueDate: '2023-05-30T23:59:59Z',
          notes: 'Exame realizado no laboratório AUSTA em 29/05/2023.'
        },
        {
          itemId: 'm3b4c5d6-e7f8-6a7b-0c1d-2e3f4a5b6c7d',
          title: 'Consulta de retorno com cardiologista',
          status: CarePlanProgressStatus.COMPLETED,
          progress: 100,
          dueDate: '2023-06-20T14:00:00Z',
          notes: 'Consulta realizada com Dr. Ana Cardoso. Paciente apresentou melhora significativa.'
        }
      ],
      overallProgress: 100,
      updatedAt: '2023-06-20T15:00:00Z'
    }
  },
  // Care plan with overdue items
  {
    type: EventTypes.CARE_PLAN_PROGRESS_UPDATED,
    userId: TEST_USER_IDS.premium,
    journey: 'care',
    timestamp: '2023-05-25T10:00:00Z',
    data: {
      carePlanId: 'n4c5d6e7-f8a9-7b8c-1d2e-3f4a5b6c7d8e',
      items: [
        {
          itemId: 'o5d6e7f8-a9b0-8c9d-2e3f-4a5b6c7d8e9f',
          title: 'Aplicar medicação tópica 2x ao dia',
          status: CarePlanProgressStatus.IN_PROGRESS,
          progress: 50,
          dueDate: '2023-06-10T23:59:59Z'
        },
        {
          itemId: 'p6e7f8a9-b0c1-9d0e-3f4a-5b6c7d8e9f0a',
          title: 'Evitar exposição solar',
          status: CarePlanProgressStatus.IN_PROGRESS,
          progress: 75,
          dueDate: '2023-06-10T23:59:59Z'
        },
        {
          itemId: 'q7f8a9b0-c1d2-0e1f-4a5b-6c7d8e9f0a1b',
          title: 'Realizar biópsia de pele',
          status: CarePlanProgressStatus.OVERDUE,
          progress: 0,
          dueDate: '2023-05-20T23:59:59Z',
          notes: 'Paciente não compareceu ao procedimento agendado.'
        }
      ],
      overallProgress: 40,
      updatedAt: '2023-05-25T10:00:00Z'
    }
  }
];

/**
 * All care event fixtures combined for easy export
 */
export const careEventFixtures = {
  appointmentBooked: appointmentBookedEventFixtures,
  appointmentStatusUpdated: appointmentStatusUpdatedEventFixtures,
  medicationTracked: medicationTrackedEventFixtures,
  telemedicineSession: telemedicineSessionEventFixtures,
  carePlanProgress: carePlanProgressEventFixtures,
  providerInfo: providerInfoFixtures,
  locationInfo: locationInfoFixtures
};

export default careEventFixtures;