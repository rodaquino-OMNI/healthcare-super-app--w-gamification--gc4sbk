/**
 * @file Care Journey Database Context Mock
 * 
 * This file provides a specialized mock for the Care journey database context that extends
 * the base journey context mock with care-specific data models and operations. It includes
 * mock implementations for appointments, providers, medications, treatments, and telemedicine
 * sessions tailored to the Care journey.
 * 
 * @module @austa/database/test/mocks/care-context
 */

import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { v4 as uuidv4 } from 'uuid';

// Import care journey interfaces
import {
  IAppointment,
  AppointmentStatus,
  AppointmentType,
  IProvider,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan
} from '@austa/interfaces/journey/care';

// Import common interfaces
import { IUser } from '@austa/interfaces/common';

/**
 * Mock data for providers
 */
const mockProviders: IProvider[] = [
  {
    id: '1',
    name: 'Dr. Ana Silva',
    specialty: 'Cardiologia',
    crm: '12345-SP',
    email: 'ana.silva@austa.com.br',
    phone: '+5511999999999',
    address: 'Av. Paulista, 1000, São Paulo, SP',
    bio: 'Cardiologista com 15 anos de experiência',
    photoUrl: 'https://example.com/photos/ana-silva.jpg',
    availableForTelemedicine: true,
    rating: 4.8,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Dr. Carlos Mendes',
    specialty: 'Dermatologia',
    crm: '54321-SP',
    email: 'carlos.mendes@austa.com.br',
    phone: '+5511888888888',
    address: 'Rua Augusta, 500, São Paulo, SP',
    bio: 'Dermatologista especializado em tratamentos estéticos',
    photoUrl: 'https://example.com/photos/carlos-mendes.jpg',
    availableForTelemedicine: true,
    rating: 4.5,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  },
  {
    id: '3',
    name: 'Dra. Mariana Costa',
    specialty: 'Ortopedia',
    crm: '67890-SP',
    email: 'mariana.costa@austa.com.br',
    phone: '+5511777777777',
    address: 'Av. Brigadeiro Faria Lima, 2000, São Paulo, SP',
    bio: 'Ortopedista especializada em medicina esportiva',
    photoUrl: 'https://example.com/photos/mariana-costa.jpg',
    availableForTelemedicine: false,
    rating: 4.9,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03')
  }
];

/**
 * Mock data for appointments
 */
const mockAppointments: IAppointment[] = [
  {
    id: '1',
    userId: '1',
    providerId: '1',
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.CONFIRMED,
    date: new Date('2023-06-15T10:00:00Z'),
    duration: 30,
    notes: 'Consulta de rotina',
    location: 'Av. Paulista, 1000, São Paulo, SP',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
    cancelReason: null,
    followUpDate: null,
    provider: mockProviders[0],
    user: { id: '1', name: 'Test User' } as IUser
  },
  {
    id: '2',
    userId: '1',
    providerId: '2',
    type: AppointmentType.TELEMEDICINE,
    status: AppointmentStatus.SCHEDULED,
    date: new Date('2023-06-20T14:00:00Z'),
    duration: 45,
    notes: 'Consulta para avaliação de tratamento',
    location: null,
    createdAt: new Date('2023-06-02'),
    updatedAt: new Date('2023-06-02'),
    cancelReason: null,
    followUpDate: null,
    provider: mockProviders[1],
    user: { id: '1', name: 'Test User' } as IUser
  },
  {
    id: '3',
    userId: '1',
    providerId: '3',
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.COMPLETED,
    date: new Date('2023-05-10T11:00:00Z'),
    duration: 60,
    notes: 'Avaliação de lesão no joelho',
    location: 'Av. Brigadeiro Faria Lima, 2000, São Paulo, SP',
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2023-05-11'),
    cancelReason: null,
    followUpDate: new Date('2023-06-10'),
    provider: mockProviders[2],
    user: { id: '1', name: 'Test User' } as IUser
  }
];

/**
 * Mock data for medications
 */
const mockMedications: IMedication[] = [
  {
    id: '1',
    userId: '1',
    name: 'Losartana',
    dosage: '50mg',
    frequency: 'Uma vez ao dia',
    startDate: new Date('2023-01-15'),
    endDate: null,
    instructions: 'Tomar pela manhã com água',
    prescribedBy: 'Dr. Ana Silva',
    prescriptionDate: new Date('2023-01-15'),
    active: true,
    reminderEnabled: true,
    reminderTime: '08:00',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    lastTaken: new Date('2023-06-14T08:00:00Z'),
    adherenceRate: 0.95
  },
  {
    id: '2',
    userId: '1',
    name: 'Ibuprofeno',
    dosage: '600mg',
    frequency: 'A cada 8 horas, se necessário',
    startDate: new Date('2023-05-10'),
    endDate: new Date('2023-05-17'),
    instructions: 'Tomar após as refeições para dor no joelho',
    prescribedBy: 'Dra. Mariana Costa',
    prescriptionDate: new Date('2023-05-10'),
    active: false,
    reminderEnabled: false,
    reminderTime: null,
    createdAt: new Date('2023-05-10'),
    updatedAt: new Date('2023-05-17'),
    lastTaken: new Date('2023-05-17T12:00:00Z'),
    adherenceRate: 0.85
  }
];

/**
 * Mock data for telemedicine sessions
 */
const mockTelemedicineSessions: ITelemedicineSession[] = [
  {
    id: '1',
    appointmentId: '2',
    sessionUrl: 'https://meet.austa.com.br/session/abc123',
    startTime: null,
    endTime: null,
    status: 'SCHEDULED',
    providerJoined: false,
    userJoined: false,
    recordingUrl: null,
    notes: null,
    createdAt: new Date('2023-06-02'),
    updatedAt: new Date('2023-06-02'),
    appointment: mockAppointments[1]
  }
];

/**
 * Mock data for treatment plans
 */
const mockTreatmentPlans: ITreatmentPlan[] = [
  {
    id: '1',
    userId: '1',
    providerId: '3',
    title: 'Plano de Recuperação - Joelho',
    description: 'Plano de tratamento para recuperação de lesão no joelho direito',
    startDate: new Date('2023-05-10'),
    endDate: new Date('2023-07-10'),
    status: 'IN_PROGRESS',
    progress: 0.4,
    notes: 'Paciente respondendo bem aos exercícios iniciais',
    createdAt: new Date('2023-05-10'),
    updatedAt: new Date('2023-06-01'),
    activities: [
      {
        id: '1',
        treatmentPlanId: '1',
        title: 'Exercícios de fortalecimento',
        description: 'Série de exercícios para fortalecer os músculos ao redor do joelho',
        frequency: 'Diária',
        duration: 20,
        completed: false,
        startDate: new Date('2023-05-11'),
        endDate: null
      },
      {
        id: '2',
        treatmentPlanId: '1',
        title: 'Fisioterapia',
        description: 'Sessões de fisioterapia com profissional especializado',
        frequency: '2x por semana',
        duration: 60,
        completed: false,
        startDate: new Date('2023-05-15'),
        endDate: null
      }
    ]
  }
];

/**
 * Type definition for the Care Context mock options
 */
export interface CareContextMockOptions {
  seedTestData?: boolean;
  mockResponses?: Record<string, unknown>;
  simulateErrors?: boolean;
}

/**
 * Type definition for the Care Context mock
 */
export type MockCareContext = {
  // Standard Prisma methods
  appointment: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  provider: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  medication: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  telemedicineSession: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  treatmentPlan: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  
  // Care-specific methods
  findAvailableProviders: jest.Mock;
  findUpcomingAppointments: jest.Mock;
  trackMedicationAdherence: jest.Mock;
  updateTreatmentProgress: jest.Mock;
  createTelemedicineSession: jest.Mock;
  
  // Transaction methods
  $transaction: jest.Mock;
  $disconnect: jest.Mock;
  $connect: jest.Mock;
} & DeepMockProxy<PrismaClient>;

/**
 * Creates a mock Care journey database context for testing.
 * 
 * @param options - Configuration options for the mock context
 * @returns A mock Care journey database context
 */
export function mockCareContext(options: CareContextMockOptions = {}): MockCareContext {
  const {
    seedTestData = true,
    mockResponses = {},
    simulateErrors = false
  } = options;
  
  // Create a deep mock of PrismaClient
  const mockContext = mockDeep<PrismaClient>() as MockCareContext;
  
  // Setup appointment methods
  mockContext.appointment.findMany.mockImplementation(() => {
    if (simulateErrors) throw new Error('Database error: Could not fetch appointments');
    return Promise.resolve(mockAppointments);
  });
  
  mockContext.appointment.findUnique.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not fetch appointment');
    const appointment = mockAppointments.find(a => a.id === where.id);
    return Promise.resolve(appointment || null);
  });
  
  mockContext.appointment.create.mockImplementation(({ data }) => {
    if (simulateErrors) throw new Error('Database error: Could not create appointment');
    const newAppointment: IAppointment = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: mockProviders.find(p => p.id === data.providerId) || null,
      user: { id: data.userId, name: 'Test User' } as IUser
    };
    return Promise.resolve(newAppointment);
  });
  
  mockContext.appointment.update.mockImplementation(({ where, data }) => {
    if (simulateErrors) throw new Error('Database error: Could not update appointment');
    const appointmentIndex = mockAppointments.findIndex(a => a.id === where.id);
    if (appointmentIndex === -1) {
      throw new Error(`Appointment with ID ${where.id} not found`);
    }
    const updatedAppointment = {
      ...mockAppointments[appointmentIndex],
      ...data,
      updatedAt: new Date()
    };
    return Promise.resolve(updatedAppointment);
  });
  
  mockContext.appointment.delete.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not delete appointment');
    const appointmentIndex = mockAppointments.findIndex(a => a.id === where.id);
    if (appointmentIndex === -1) {
      throw new Error(`Appointment with ID ${where.id} not found`);
    }
    return Promise.resolve(mockAppointments[appointmentIndex]);
  });
  
  // Setup provider methods
  mockContext.provider.findMany.mockImplementation(() => {
    if (simulateErrors) throw new Error('Database error: Could not fetch providers');
    return Promise.resolve(mockProviders);
  });
  
  mockContext.provider.findUnique.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not fetch provider');
    const provider = mockProviders.find(p => p.id === where.id);
    return Promise.resolve(provider || null);
  });
  
  // Setup medication methods
  mockContext.medication.findMany.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not fetch medications');
    let medications = mockMedications;
    if (where?.userId) {
      medications = medications.filter(m => m.userId === where.userId);
    }
    if (where?.active !== undefined) {
      medications = medications.filter(m => m.active === where.active);
    }
    return Promise.resolve(medications);
  });
  
  mockContext.medication.findUnique.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not fetch medication');
    const medication = mockMedications.find(m => m.id === where.id);
    return Promise.resolve(medication || null);
  });
  
  mockContext.medication.create.mockImplementation(({ data }) => {
    if (simulateErrors) throw new Error('Database error: Could not create medication');
    const newMedication: IMedication = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      adherenceRate: 0
    };
    return Promise.resolve(newMedication);
  });
  
  mockContext.medication.update.mockImplementation(({ where, data }) => {
    if (simulateErrors) throw new Error('Database error: Could not update medication');
    const medicationIndex = mockMedications.findIndex(m => m.id === where.id);
    if (medicationIndex === -1) {
      throw new Error(`Medication with ID ${where.id} not found`);
    }
    const updatedMedication = {
      ...mockMedications[medicationIndex],
      ...data,
      updatedAt: new Date()
    };
    return Promise.resolve(updatedMedication);
  });
  
  // Setup telemedicine session methods
  mockContext.telemedicineSession.findMany.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not fetch telemedicine sessions');
    let sessions = mockTelemedicineSessions;
    if (where?.appointmentId) {
      sessions = sessions.filter(s => s.appointmentId === where.appointmentId);
    }
    return Promise.resolve(sessions);
  });
  
  mockContext.telemedicineSession.findUnique.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not fetch telemedicine session');
    const session = mockTelemedicineSessions.find(s => s.id === where.id);
    return Promise.resolve(session || null);
  });
  
  mockContext.telemedicineSession.create.mockImplementation(({ data }) => {
    if (simulateErrors) throw new Error('Database error: Could not create telemedicine session');
    const newSession: ITelemedicineSession = {
      id: uuidv4(),
      ...data,
      status: 'SCHEDULED',
      providerJoined: false,
      userJoined: false,
      startTime: null,
      endTime: null,
      recordingUrl: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      appointment: mockAppointments.find(a => a.id === data.appointmentId) || null
    };
    return Promise.resolve(newSession);
  });
  
  mockContext.telemedicineSession.update.mockImplementation(({ where, data }) => {
    if (simulateErrors) throw new Error('Database error: Could not update telemedicine session');
    const sessionIndex = mockTelemedicineSessions.findIndex(s => s.id === where.id);
    if (sessionIndex === -1) {
      throw new Error(`Telemedicine session with ID ${where.id} not found`);
    }
    const updatedSession = {
      ...mockTelemedicineSessions[sessionIndex],
      ...data,
      updatedAt: new Date()
    };
    return Promise.resolve(updatedSession);
  });
  
  // Setup treatment plan methods
  mockContext.treatmentPlan.findMany.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not fetch treatment plans');
    let plans = mockTreatmentPlans;
    if (where?.userId) {
      plans = plans.filter(p => p.userId === where.userId);
    }
    if (where?.providerId) {
      plans = plans.filter(p => p.providerId === where.providerId);
    }
    if (where?.status) {
      plans = plans.filter(p => p.status === where.status);
    }
    return Promise.resolve(plans);
  });
  
  mockContext.treatmentPlan.findUnique.mockImplementation(({ where }) => {
    if (simulateErrors) throw new Error('Database error: Could not fetch treatment plan');
    const plan = mockTreatmentPlans.find(p => p.id === where.id);
    return Promise.resolve(plan || null);
  });
  
  mockContext.treatmentPlan.create.mockImplementation(({ data }) => {
    if (simulateErrors) throw new Error('Database error: Could not create treatment plan');
    const newPlan: ITreatmentPlan = {
      id: uuidv4(),
      ...data,
      progress: 0,
      status: 'NOT_STARTED',
      createdAt: new Date(),
      updatedAt: new Date(),
      activities: []
    };
    return Promise.resolve(newPlan);
  });
  
  mockContext.treatmentPlan.update.mockImplementation(({ where, data }) => {
    if (simulateErrors) throw new Error('Database error: Could not update treatment plan');
    const planIndex = mockTreatmentPlans.findIndex(p => p.id === where.id);
    if (planIndex === -1) {
      throw new Error(`Treatment plan with ID ${where.id} not found`);
    }
    const updatedPlan = {
      ...mockTreatmentPlans[planIndex],
      ...data,
      updatedAt: new Date()
    };
    return Promise.resolve(updatedPlan);
  });
  
  // Care-specific methods
  mockContext.findAvailableProviders = jest.fn().mockImplementation((specialty, date) => {
    if (simulateErrors) throw new Error('Database error: Could not find available providers');
    let providers = mockProviders;
    if (specialty) {
      providers = providers.filter(p => p.specialty === specialty);
    }
    // In a real implementation, we would check provider availability for the given date
    return Promise.resolve(providers);
  });
  
  mockContext.findUpcomingAppointments = jest.fn().mockImplementation((userId, limit = 5) => {
    if (simulateErrors) throw new Error('Database error: Could not find upcoming appointments');
    const now = new Date();
    const upcomingAppointments = mockAppointments
      .filter(a => a.userId === userId && a.date > now && a.status !== AppointmentStatus.CANCELLED)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, limit);
    return Promise.resolve(upcomingAppointments);
  });
  
  mockContext.trackMedicationAdherence = jest.fn().mockImplementation((medicationId, taken = true) => {
    if (simulateErrors) throw new Error('Database error: Could not track medication adherence');
    const medicationIndex = mockMedications.findIndex(m => m.id === medicationId);
    if (medicationIndex === -1) {
      throw new Error(`Medication with ID ${medicationId} not found`);
    }
    
    const medication = mockMedications[medicationIndex];
    const updatedMedication = {
      ...medication,
      lastTaken: taken ? new Date() : medication.lastTaken,
      adherenceRate: taken ? Math.min(1, medication.adherenceRate + 0.05) : Math.max(0, medication.adherenceRate - 0.05),
      updatedAt: new Date()
    };
    
    return Promise.resolve(updatedMedication);
  });
  
  mockContext.updateTreatmentProgress = jest.fn().mockImplementation((treatmentPlanId, activityId, completed = true) => {
    if (simulateErrors) throw new Error('Database error: Could not update treatment progress');
    const planIndex = mockTreatmentPlans.findIndex(p => p.id === treatmentPlanId);
    if (planIndex === -1) {
      throw new Error(`Treatment plan with ID ${treatmentPlanId} not found`);
    }
    
    const plan = mockTreatmentPlans[planIndex];
    const activityIndex = plan.activities.findIndex(a => a.id === activityId);
    if (activityIndex === -1) {
      throw new Error(`Activity with ID ${activityId} not found in treatment plan`);
    }
    
    // Update the activity
    const updatedActivities = [...plan.activities];
    updatedActivities[activityIndex] = {
      ...updatedActivities[activityIndex],
      completed
    };
    
    // Calculate new progress
    const completedActivities = updatedActivities.filter(a => a.completed).length;
    const totalActivities = updatedActivities.length;
    const progress = totalActivities > 0 ? completedActivities / totalActivities : 0;
    
    // Update the plan
    const updatedPlan = {
      ...plan,
      activities: updatedActivities,
      progress,
      status: progress === 1 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      updatedAt: new Date()
    };
    
    return Promise.resolve(updatedPlan);
  });
  
  mockContext.createTelemedicineSession = jest.fn().mockImplementation((appointmentId) => {
    if (simulateErrors) throw new Error('Database error: Could not create telemedicine session');
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    if (!appointment) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }
    
    if (appointment.type !== AppointmentType.TELEMEDICINE) {
      throw new Error(`Appointment with ID ${appointmentId} is not a telemedicine appointment`);
    }
    
    const newSession: ITelemedicineSession = {
      id: uuidv4(),
      appointmentId,
      sessionUrl: `https://meet.austa.com.br/session/${Math.random().toString(36).substring(2, 8)}`,
      status: 'SCHEDULED',
      providerJoined: false,
      userJoined: false,
      startTime: null,
      endTime: null,
      recordingUrl: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      appointment
    };
    
    return Promise.resolve(newSession);
  });
  
  // Transaction methods
  mockContext.$transaction.mockImplementation(async (callback) => {
    if (simulateErrors) throw new Error('Database error: Transaction failed');
    return callback(mockContext);
  });
  
  // Override with custom mock responses if provided
  if (mockResponses) {
    Object.entries(mockResponses).forEach(([key, value]) => {
      const [model, method] = key.split('.');
      if (mockContext[model] && mockContext[model][method]) {
        mockContext[model][method].mockResolvedValue(value);
      }
    });
  }
  
  return mockContext;
}

/**
 * Re-export the mock function for easier imports
 */
export default { mockCareContext };