/**
 * @file care-context.mock.ts
 * @description Specialized mock for the Care journey database context that extends the base journey context mock
 * with care-specific data models and operations. Provides mock implementations for appointments, providers,
 * medications, treatments, and telemedicine sessions tailored to the Care journey.
 */

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Import interfaces from the Care journey
import {
  IAppointment,
  AppointmentStatus,
  AppointmentType,
  IProvider,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan
} from '@austa/interfaces/journey/care';

// Import base mock and types
import { BaseJourneyContextMock } from './journey-context.mock';
import { JourneyType } from '../../src/contexts/care.context';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { DatabaseException } from '../../src/errors/database-error.exception';

/**
 * Mock implementation of the Care journey database context for testing.
 * Provides pre-configured test data and mock implementations for care-specific operations.
 */
export class CareContextMock extends BaseJourneyContextMock {
  /**
   * Mock data for appointments
   */
  private appointments: IAppointment[] = [
    {
      id: '1',
      userId: 'user1',
      providerId: 'provider1',
      dateTime: new Date('2023-06-15T10:00:00Z'),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Regular checkup',
      createdAt: new Date('2023-06-01T08:30:00Z'),
      updatedAt: new Date('2023-06-01T08:30:00Z')
    },
    {
      id: '2',
      userId: 'user1',
      providerId: 'provider2',
      dateTime: new Date('2023-06-20T14:30:00Z'),
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Follow-up consultation',
      createdAt: new Date('2023-06-05T11:45:00Z'),
      updatedAt: new Date('2023-06-05T11:45:00Z')
    },
    {
      id: '3',
      userId: 'user2',
      providerId: 'provider1',
      dateTime: new Date('2023-06-10T09:15:00Z'),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.COMPLETED,
      notes: 'Annual physical',
      createdAt: new Date('2023-05-20T16:00:00Z'),
      updatedAt: new Date('2023-06-10T10:30:00Z')
    }
  ];

  /**
   * Mock data for providers
   */
  private providers: IProvider[] = [
    {
      id: 'provider1',
      name: 'Dr. Maria Silva',
      specialty: 'Cardiologia',
      telemedicineAvailable: true,
      address: 'Av. Paulista, 1000, São Paulo, SP',
      phone: '+551139876543',
      email: 'maria.silva@austa.com.br',
      schedule: [
        { dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
        { dayOfWeek: 3, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
        { dayOfWeek: 5, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 }
      ],
      createdAt: new Date('2023-01-15T00:00:00Z'),
      updatedAt: new Date('2023-01-15T00:00:00Z')
    },
    {
      id: 'provider2',
      name: 'Dr. João Santos',
      specialty: 'Dermatologia',
      telemedicineAvailable: true,
      address: 'Rua Augusta, 500, São Paulo, SP',
      phone: '+551138765432',
      email: 'joao.santos@austa.com.br',
      schedule: [
        { dayOfWeek: 2, startHour: 8, startMinute: 0, endHour: 16, endMinute: 0 },
        { dayOfWeek: 4, startHour: 8, startMinute: 0, endHour: 16, endMinute: 0 }
      ],
      createdAt: new Date('2023-02-10T00:00:00Z'),
      updatedAt: new Date('2023-02-10T00:00:00Z')
    },
    {
      id: 'provider3',
      name: 'Dra. Ana Oliveira',
      specialty: 'Pediatria',
      telemedicineAvailable: false,
      address: 'Av. Brigadeiro Faria Lima, 2000, São Paulo, SP',
      phone: '+551137654321',
      email: 'ana.oliveira@austa.com.br',
      schedule: [
        { dayOfWeek: 1, startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 },
        { dayOfWeek: 2, startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 },
        { dayOfWeek: 3, startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 },
        { dayOfWeek: 4, startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 },
        { dayOfWeek: 5, startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 }
      ],
      createdAt: new Date('2023-03-05T00:00:00Z'),
      updatedAt: new Date('2023-03-05T00:00:00Z')
    }
  ];

  /**
   * Mock data for medications
   */
  private medications: IMedication[] = [
    {
      id: 'med1',
      userId: 'user1',
      name: 'Losartana',
      dosage: '50mg',
      frequency: 'daily',
      startDate: new Date('2023-05-01T00:00:00Z'),
      endDate: null,
      active: true,
      instructions: 'Tomar 1 comprimido pela manhã',
      intakes: [
        {
          id: 'intake1',
          medicationId: 'med1',
          userId: 'user1',
          intakeTime: new Date('2023-06-01T08:00:00Z'),
          dosage: 1,
          notes: '',
          createdAt: new Date('2023-06-01T08:00:00Z')
        },
        {
          id: 'intake2',
          medicationId: 'med1',
          userId: 'user1',
          intakeTime: new Date('2023-06-02T08:00:00Z'),
          dosage: 1,
          notes: '',
          createdAt: new Date('2023-06-02T08:00:00Z')
        }
      ],
      createdAt: new Date('2023-05-01T00:00:00Z'),
      updatedAt: new Date('2023-05-01T00:00:00Z')
    },
    {
      id: 'med2',
      userId: 'user1',
      name: 'Atorvastatina',
      dosage: '20mg',
      frequency: 'daily',
      startDate: new Date('2023-05-01T00:00:00Z'),
      endDate: null,
      active: true,
      instructions: 'Tomar 1 comprimido à noite',
      intakes: [
        {
          id: 'intake3',
          medicationId: 'med2',
          userId: 'user1',
          intakeTime: new Date('2023-06-01T20:00:00Z'),
          dosage: 1,
          notes: '',
          createdAt: new Date('2023-06-01T20:00:00Z')
        }
      ],
      createdAt: new Date('2023-05-01T00:00:00Z'),
      updatedAt: new Date('2023-05-01T00:00:00Z')
    },
    {
      id: 'med3',
      userId: 'user2',
      name: 'Amoxicilina',
      dosage: '500mg',
      frequency: 'three times daily',
      startDate: new Date('2023-06-05T00:00:00Z'),
      endDate: new Date('2023-06-15T00:00:00Z'),
      active: true,
      instructions: 'Tomar 1 comprimido a cada 8 horas',
      intakes: [],
      createdAt: new Date('2023-06-05T00:00:00Z'),
      updatedAt: new Date('2023-06-05T00:00:00Z')
    }
  ];

  /**
   * Mock data for telemedicine sessions
   */
  private telemedicineSessions: ITelemedicineSession[] = [
    {
      id: 'tele1',
      appointmentId: '2',
      patientId: 'user1',
      providerId: 'provider2',
      startTime: new Date('2023-06-20T14:30:00Z'),
      endTime: null,
      status: 'scheduled',
      sessionUrl: 'https://telemedicine.austa.app/session/tele1',
      createdAt: new Date('2023-06-05T11:45:00Z'),
      updatedAt: new Date('2023-06-05T11:45:00Z')
    }
  ];

  /**
   * Mock data for treatment plans
   */
  private treatmentPlans: ITreatmentPlan[] = [
    {
      id: 'plan1',
      name: 'Treatment Plan for Hypertension',
      description: 'Comprehensive plan to manage hypertension',
      startDate: new Date('2023-05-01T00:00:00Z'),
      endDate: new Date('2023-11-01T00:00:00Z'),
      progress: 30,
      careActivity: {
        id: 'care1',
        userId: 'user1',
        providerId: 'provider1',
        diagnosis: {
          condition: 'Hypertension',
          notes: 'Stage 1 hypertension, requires lifestyle changes and medication'
        },
        type: 'treatment',
        status: 'active',
        lastUpdated: new Date('2023-05-01T00:00:00Z')
      },
      items: [
        {
          id: 'item1',
          treatmentPlanId: 'plan1',
          name: 'Blood pressure medication',
          description: 'Take prescribed medication daily',
          frequency: 'daily',
          duration: '6 months',
          instructions: 'Take Losartana 50mg every morning',
          status: 'active',
          progress: [
            {
              id: 'progress1',
              treatmentItemId: 'item1',
              treatmentPlanId: 'plan1',
              userId: 'user1',
              status: 'completed',
              notes: '',
              recordedAt: new Date('2023-06-01T08:00:00Z')
            }
          ],
          lastUpdated: new Date('2023-06-01T08:00:00Z')
        },
        {
          id: 'item2',
          treatmentPlanId: 'plan1',
          name: 'Regular exercise',
          description: 'Engage in moderate physical activity',
          frequency: '3 times per week',
          duration: '6 months',
          instructions: '30 minutes of walking or swimming',
          status: 'active',
          progress: [],
          lastUpdated: new Date('2023-05-01T00:00:00Z')
        },
        {
          id: 'item3',
          treatmentPlanId: 'plan1',
          name: 'Low sodium diet',
          description: 'Reduce salt intake',
          frequency: 'daily',
          duration: '6 months',
          instructions: 'Limit sodium to 2000mg per day',
          status: 'active',
          progress: [],
          lastUpdated: new Date('2023-05-01T00:00:00Z')
        }
      ],
      createdAt: new Date('2023-05-01T00:00:00Z'),
      updatedAt: new Date('2023-06-01T08:00:00Z')
    }
  ];

  /**
   * Mock data for symptom checker sessions
   */
  private symptomCheckerSessions: any[] = [
    {
      id: 'symptom1',
      userId: 'user1',
      symptoms: [
        { name: 'headache', severity: 'moderate', duration: '2 days' },
        { name: 'fever', severity: 'mild', duration: '1 day' }
      ],
      demographics: {
        age: 45,
        gender: 'male',
        hasChronicConditions: true
      },
      medicalHistory: {
        conditions: ['hypertension'],
        medications: ['Losartana', 'Atorvastatina']
      },
      status: 'completed',
      timestamp: new Date('2023-06-10T15:30:00Z'),
      results: {
        urgency: 'medium',
        careOptions: [
          {
            type: 'primary_care',
            recommendation: 'Schedule an appointment with your primary care provider',
            urgency: 'medium'
          },
          {
            type: 'telemedicine',
            recommendation: 'Schedule a telemedicine appointment',
            urgency: 'medium'
          }
        ],
        recommendedProviders: [
          {
            id: 'provider1',
            name: 'Dr. Maria Silva',
            specialty: 'Cardiologia',
            telemedicineAvailable: true
          }
        ],
        selfCareRecommendations: [
          { action: 'Rest in a quiet, dark room', rationale: 'Reduces sensory stimulation that can worsen headaches' },
          { action: 'Stay hydrated', rationale: 'Helps replace fluids lost due to fever' },
          { action: 'Use a light blanket', rationale: 'Helps manage body temperature' }
        ],
        disclaimer: 'This is not medical advice. Please consult with a healthcare professional for proper diagnosis and treatment.'
      }
    }
  ];

  // Mock functions for all CareContext methods
  public findAvailableAppointmentSlots = jest.fn();
  public bookAppointment = jest.fn();
  public getMedicationAdherence = jest.fn();
  public recordMedicationIntake = jest.fn();
  public findProviders = jest.fn();
  public upsertTreatmentPlan = jest.fn();
  public trackTreatmentProgress = jest.fn();
  public createTelemedicineSession = jest.fn();
  public updateTelemedicineSessionStatus = jest.fn();
  public processSymptomCheckerInput = jest.fn();
  public validateJourneyData = jest.fn();
  public getJourneyMetrics = jest.fn();
  public sendJourneyEvent = jest.fn();

  /**
   * Creates a new instance of CareContextMock with pre-configured mock implementations.
   */
  constructor() {
    super(JourneyType.CARE);
    this.setupMockImplementations();
  }

  /**
   * Sets up mock implementations for all Care journey database operations.
   * @private
   */
  private setupMockImplementations(): void {
    // Mock findAvailableAppointmentSlots implementation
    this.findAvailableAppointmentSlots.mockImplementation(
      (providerId: string, startDate: Date, endDate: Date, specialtyId?: string) => {
        // Validate input parameters
        if (!providerId) {
          throw new DatabaseException(
            'Provider ID is required',
            DatabaseErrorType.VALIDATION,
            { providerId }
          );
        }

        if (!startDate || !endDate) {
          throw new DatabaseException(
            'Start and end dates are required',
            DatabaseErrorType.VALIDATION,
            { startDate, endDate }
          );
        }

        // Find the provider
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider) {
          throw new DatabaseException(
            `Provider not found with ID ${providerId}`,
            DatabaseErrorType.NOT_FOUND,
            { providerId }
          );
        }

        // Get existing appointments for the provider in the date range
        const existingAppointments = this.appointments.filter(a => 
          a.providerId === providerId && 
          a.dateTime >= startDate && 
          a.dateTime <= endDate &&
          a.status !== AppointmentStatus.CANCELLED
        );

        // Generate available slots based on provider's schedule and existing appointments
        const availableSlots = [];
        const currentDate = new Date(startDate);
        const slotDurationMinutes = 30; // Default slot duration in minutes

        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          
          // Check if provider works on this day
          const daySchedule = provider.schedule.find(s => s.dayOfWeek === dayOfWeek);
          
          if (daySchedule) {
            const startTime = new Date(currentDate);
            startTime.setHours(daySchedule.startHour, daySchedule.startMinute, 0, 0);
            
            const endTime = new Date(currentDate);
            endTime.setHours(daySchedule.endHour, daySchedule.endMinute, 0, 0);
            
            // Generate slots for the day
            const currentSlot = new Date(startTime);
            
            while (currentSlot < endTime) {
              // Check if slot is already booked
              const isBooked = existingAppointments.some(appointment => {
                const appointmentTime = new Date(appointment.dateTime);
                return (
                  appointmentTime.getFullYear() === currentSlot.getFullYear() &&
                  appointmentTime.getMonth() === currentSlot.getMonth() &&
                  appointmentTime.getDate() === currentSlot.getDate() &&
                  appointmentTime.getHours() === currentSlot.getHours() &&
                  appointmentTime.getMinutes() === currentSlot.getMinutes()
                );
              });
              
              if (!isBooked) {
                // Add available slot
                availableSlots.push({
                  providerId,
                  providerName: provider.name,
                  dateTime: new Date(currentSlot),
                  availableTypes: [
                    AppointmentType.IN_PERSON,
                    provider.telemedicineAvailable ? AppointmentType.TELEMEDICINE : null,
                  ].filter(Boolean),
                });
              }
              
              // Move to next slot
              currentSlot.setMinutes(currentSlot.getMinutes() + slotDurationMinutes);
            }
          }
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(0, 0, 0, 0);
        }

        // Filter by specialty if provided
        if (specialtyId) {
          return availableSlots.filter(() => provider.specialty === specialtyId);
        }

        return availableSlots;
      }
    );

    // Mock bookAppointment implementation
    this.bookAppointment.mockImplementation(
      (userId: string, providerId: string, startTime: Date, endTime: Date, appointmentType: string, notes?: string) => {
        // Validate input parameters
        if (!userId || !providerId || !startTime) {
          throw new DatabaseException(
            'User ID, provider ID, and start time are required',
            DatabaseErrorType.VALIDATION,
            { userId, providerId, startTime }
          );
        }

        if (!Object.values(AppointmentType).includes(appointmentType as AppointmentType)) {
          throw new DatabaseException(
            `Invalid appointment type: ${appointmentType}`,
            DatabaseErrorType.VALIDATION,
            { appointmentType, validTypes: Object.values(AppointmentType) }
          );
        }

        // Check if the provider exists
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider) {
          throw new DatabaseException(
            `Provider not found with ID ${providerId}`,
            DatabaseErrorType.NOT_FOUND,
            { providerId }
          );
        }

        // Check if the provider supports telemedicine for telemedicine appointments
        if (
          appointmentType === AppointmentType.TELEMEDICINE &&
          !provider.telemedicineAvailable
        ) {
          throw new DatabaseException(
            `Provider ${providerId} does not support telemedicine appointments`,
            DatabaseErrorType.VALIDATION,
            { providerId, appointmentType }
          );
        }

        // Check if the slot is available (not already booked)
        const existingAppointment = this.appointments.find(a => 
          a.providerId === providerId && 
          a.dateTime.getTime() === startTime.getTime() && 
          a.status !== AppointmentStatus.CANCELLED
        );

        if (existingAppointment) {
          throw new DatabaseException(
            `Appointment slot is already booked`,
            DatabaseErrorType.CONFLICT,
            { providerId, startTime }
          );
        }

        // Create the appointment
        const newAppointmentId = `appointment-${Date.now()}`;
        const now = new Date();
        const newAppointment: IAppointment = {
          id: newAppointmentId,
          userId,
          providerId,
          dateTime: startTime,
          type: appointmentType as AppointmentType,
          status: AppointmentStatus.SCHEDULED,
          notes: notes || '',
          createdAt: now,
          updatedAt: now
        };

        // Add to appointments array
        this.appointments.push(newAppointment);

        // If it's a telemedicine appointment, create a telemedicine session
        if (appointmentType === AppointmentType.TELEMEDICINE) {
          const newSessionId = `tele-${Date.now()}`;
          const newSession: ITelemedicineSession = {
            id: newSessionId,
            appointmentId: newAppointmentId,
            patientId: userId,
            providerId,
            startTime,
            endTime: null,
            status: 'scheduled',
            sessionUrl: `https://telemedicine.austa.app/session/${newSessionId}`,
            createdAt: now,
            updatedAt: now
          };

          this.telemedicineSessions.push(newSession);
        }

        // Simulate sending journey event
        this.sendJourneyEvent(
          'APPOINTMENT_BOOKED',
          userId,
          {
            appointmentId: newAppointmentId,
            providerId,
            appointmentType,
            startTime,
          }
        );

        return newAppointment;
      }
    );

    // Mock getMedicationAdherence implementation
    this.getMedicationAdherence.mockImplementation(
      (userId: string, startDate: Date, endDate: Date) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!startDate || !endDate) {
          throw new DatabaseException(
            'Start and end dates are required',
            DatabaseErrorType.VALIDATION,
            { startDate, endDate }
          );
        }

        // Get user's medications
        const userMedications = this.medications.filter(m => 
          m.userId === userId && 
          m.active && 
          m.startDate <= endDate && 
          (!m.endDate || m.endDate >= startDate)
        );

        // Calculate adherence for each medication
        const adherenceData = userMedications.map(medication => {
          // Calculate expected intakes based on frequency
          let expectedIntakes = 0;
          const frequencyMap: Record<string, number> = {
            'daily': 1,
            'twice daily': 2,
            'three times daily': 3,
            'four times daily': 4,
            'every other day': 0.5,
            'weekly': 1/7,
            'as needed': 0, // Cannot calculate adherence for as-needed medications
          };

          const dailyFrequency = frequencyMap[medication.frequency] || 0;
          if (dailyFrequency > 0) {
            // Calculate days in the period
            const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            expectedIntakes = dailyFrequency * daysDiff;
          }

          // Filter intakes within the date range
          const intakesInRange = medication.intakes.filter(intake => 
            intake.intakeTime >= startDate && intake.intakeTime <= endDate
          );

          // Actual intakes recorded
          const actualIntakes = intakesInRange.length;

          // Calculate adherence percentage
          const adherencePercentage = expectedIntakes > 0
            ? Math.min(100, Math.round((actualIntakes / expectedIntakes) * 100))
            : null;

          return {
            medicationId: medication.id,
            name: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            expectedIntakes,
            actualIntakes,
            adherencePercentage,
            intakes: intakesInRange.map(intake => ({
              id: intake.id,
              intakeTime: intake.intakeTime,
              dosage: intake.dosage,
              notes: intake.notes,
            })),
          };
        });

        // Calculate overall adherence
        const totalExpectedIntakes = adherenceData.reduce(
          (sum, med) => sum + (med.expectedIntakes || 0),
          0
        );

        const totalActualIntakes = adherenceData.reduce(
          (sum, med) => sum + med.actualIntakes,
          0
        );

        const overallAdherence = totalExpectedIntakes > 0
          ? Math.min(100, Math.round((totalActualIntakes / totalExpectedIntakes) * 100))
          : null;

        // Simulate sending journey event
        this.sendJourneyEvent(
          'MEDICATION_ADHERENCE_CHECKED',
          userId,
          {
            overallAdherence,
            medicationCount: userMedications.length,
            period: { startDate, endDate },
          }
        );

        return {
          userId,
          period: {
            startDate,
            endDate,
          },
          overallAdherence,
          medications: adherenceData,
        };
      }
    );

    // Mock recordMedicationIntake implementation
    this.recordMedicationIntake.mockImplementation(
      (userId: string, medicationId: string, intakeTime: Date, dosage: number, notes?: string) => {
        // Validate input parameters
        if (!userId || !medicationId) {
          throw new DatabaseException(
            'User ID and medication ID are required',
            DatabaseErrorType.VALIDATION,
            { userId, medicationId }
          );
        }

        if (!intakeTime) {
          throw new DatabaseException(
            'Intake time is required',
            DatabaseErrorType.VALIDATION,
            { intakeTime }
          );
        }

        if (typeof dosage !== 'number' || dosage <= 0) {
          throw new DatabaseException(
            'Dosage must be a positive number',
            DatabaseErrorType.VALIDATION,
            { dosage }
          );
        }

        // Check if the medication exists and belongs to the user
        const medication = this.medications.find(m => m.id === medicationId && m.userId === userId);
        if (!medication) {
          throw new DatabaseException(
            `Medication not found with ID ${medicationId} for user ${userId}`,
            DatabaseErrorType.NOT_FOUND,
            { medicationId, userId }
          );
        }

        // Create the intake record
        const intakeId = `intake-${Date.now()}`;
        const now = new Date();
        const intake = {
          id: intakeId,
          medicationId,
          userId,
          intakeTime,
          dosage,
          notes: notes || '',
          createdAt: now
        };

        // Add to medication's intakes
        medication.intakes.push(intake);

        // Simulate sending journey event
        this.sendJourneyEvent(
          'MEDICATION_INTAKE_RECORDED',
          userId,
          {
            medicationId,
            medicationName: medication.name,
            intakeTime,
            dosage,
          }
        );

        return {
          id: intake.id,
          medicationId,
          medicationName: medication.name,
          userId,
          intakeTime,
          dosage,
          notes: intake.notes,
          createdAt: intake.createdAt,
        };
      }
    );

    // Mock findProviders implementation
    this.findProviders.mockImplementation(
      (specialtyId?: string, location?: { lat: number; lng: number } | string, maxDistance?: number, filters?: Record<string, any>) => {
        let filteredProviders = [...this.providers];

        // Filter by specialty if provided
        if (specialtyId) {
          filteredProviders = filteredProviders.filter(p => p.specialty === specialtyId);
        }

        // Apply additional filters if provided
        if (filters) {
          if (filters.telemedicineAvailable !== undefined) {
            filteredProviders = filteredProviders.filter(p => p.telemedicineAvailable === filters.telemedicineAvailable);
          }

          if (filters.name) {
            const nameFilter = filters.name.toLowerCase();
            filteredProviders = filteredProviders.filter(p => p.name.toLowerCase().includes(nameFilter));
          }
        }

        // If location is provided, filter and sort by distance (simplified implementation)
        if (location && maxDistance) {
          // In a real implementation, this would use geospatial calculations
          // For the mock, we'll just return all filtered providers
        }

        return filteredProviders;
      }
    );

    // Mock upsertTreatmentPlan implementation
    this.upsertTreatmentPlan.mockImplementation(
      (userId: string, providerId: string, diagnosis: Record<string, any>, treatments: Record<string, any>[], startDate: Date, endDate?: Date) => {
        // Validate input parameters
        if (!userId || !providerId) {
          throw new DatabaseException(
            'User ID and provider ID are required',
            DatabaseErrorType.VALIDATION,
            { userId, providerId }
          );
        }

        if (!diagnosis || !treatments || !Array.isArray(treatments)) {
          throw new DatabaseException(
            'Diagnosis and treatments are required',
            DatabaseErrorType.VALIDATION,
            { diagnosis, treatments }
          );
        }

        if (!startDate) {
          throw new DatabaseException(
            'Start date is required',
            DatabaseErrorType.VALIDATION,
            { startDate }
          );
        }

        // Check if the provider exists
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider) {
          throw new DatabaseException(
            `Provider not found with ID ${providerId}`,
            DatabaseErrorType.NOT_FOUND,
            { providerId }
          );
        }

        // Check if a treatment plan already exists for this user and provider
        const existingPlan = this.treatmentPlans.find(p => 
          p.careActivity.userId === userId && 
          p.careActivity.providerId === providerId
        );

        const now = new Date();
        let treatmentPlan: ITreatmentPlan;

        if (existingPlan) {
          // Update existing plan
          existingPlan.name = `Treatment Plan for ${diagnosis.condition || 'Condition'}`;
          existingPlan.description = diagnosis.notes;
          existingPlan.startDate = startDate;
          existingPlan.endDate = endDate;
          existingPlan.progress = 0; // Reset progress on update
          existingPlan.updatedAt = now;
          existingPlan.careActivity.diagnosis = diagnosis;
          existingPlan.careActivity.lastUpdated = now;

          // Clear existing items and add new ones
          existingPlan.items = treatments.map((treatment, index) => ({
            id: `item-${existingPlan.id}-${index}`,
            treatmentPlanId: existingPlan.id,
            name: treatment.name,
            description: treatment.description,
            frequency: treatment.frequency,
            duration: treatment.duration,
            instructions: treatment.instructions,
            status: 'active',
            progress: [],
            lastUpdated: now
          }));

          treatmentPlan = existingPlan;
        } else {
          // Create new plan
          const planId = `plan-${Date.now()}`;
          const careActivityId = `care-${Date.now()}`;

          const careActivity = {
            id: careActivityId,
            userId,
            providerId,
            diagnosis,
            type: 'treatment',
            status: 'active',
            lastUpdated: now
          };

          const newPlan: ITreatmentPlan = {
            id: planId,
            name: `Treatment Plan for ${diagnosis.condition || 'Condition'}`,
            description: diagnosis.notes,
            startDate,
            endDate,
            progress: 0,
            careActivity,
            items: treatments.map((treatment, index) => ({
              id: `item-${planId}-${index}`,
              treatmentPlanId: planId,
              name: treatment.name,
              description: treatment.description,
              frequency: treatment.frequency,
              duration: treatment.duration,
              instructions: treatment.instructions,
              status: 'active',
              progress: [],
              lastUpdated: now
            })),
            createdAt: now,
            updatedAt: now
          };

          this.treatmentPlans.push(newPlan);
          treatmentPlan = newPlan;
        }

        // Simulate sending journey event
        this.sendJourneyEvent(
          'TREATMENT_PLAN_UPDATED',
          userId,
          {
            treatmentPlanId: treatmentPlan.id,
            providerId,
            diagnosis: diagnosis.condition,
            treatmentCount: treatments.length,
          }
        );

        return treatmentPlan;
      }
    );

    // Mock trackTreatmentProgress implementation
    this.trackTreatmentProgress.mockImplementation(
      (treatmentPlanId: string, progressData: Record<string, any>, recordedAt?: Date) => {
        // Validate input parameters
        if (!treatmentPlanId) {
          throw new DatabaseException(
            'Treatment plan ID is required',
            DatabaseErrorType.VALIDATION,
            { treatmentPlanId }
          );
        }

        if (!progressData) {
          throw new DatabaseException(
            'Progress data is required',
            DatabaseErrorType.VALIDATION,
            { progressData }
          );
        }

        // Get the treatment plan
        const treatmentPlan = this.treatmentPlans.find(p => p.id === treatmentPlanId);
        if (!treatmentPlan) {
          throw new DatabaseException(
            `Treatment plan not found with ID ${treatmentPlanId}`,
            DatabaseErrorType.NOT_FOUND,
            { treatmentPlanId }
          );
        }

        // Record progress for each treatment item
        const progressRecords = [];
        const timestamp = recordedAt || new Date();

        for (const itemId in progressData) {
          const item = treatmentPlan.items.find(i => i.id === itemId);
          if (!item) continue;

          const progressRecord = {
            id: `progress-${Date.now()}-${itemId}`,
            treatmentItemId: itemId,
            treatmentPlanId,
            userId: treatmentPlan.careActivity.userId,
            status: progressData[itemId].status || 'completed',
            notes: progressData[itemId].notes || '',
            recordedAt: timestamp,
          };

          // Add to item's progress
          if (!item.progress) {
            item.progress = [];
          }
          item.progress.push(progressRecord);
          progressRecords.push(progressRecord);
        }

        // Calculate overall progress
        const totalItems = treatmentPlan.items.length;
        const completedItems = treatmentPlan.items.filter(item => 
          item.progress && item.progress.some(p => p.status === 'completed')
        ).length;

        const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Update the treatment plan progress
        treatmentPlan.progress = overallProgress;
        treatmentPlan.updatedAt = timestamp;

        // Simulate sending journey event
        this.sendJourneyEvent(
          'TREATMENT_PROGRESS_UPDATED',
          treatmentPlan.careActivity.userId,
          {
            treatmentPlanId,
            progress: overallProgress,
            itemsUpdated: Object.keys(progressData).length,
          }
        );

        return {
          treatmentPlanId,
          progress: overallProgress,
          timestamp,
          items: progressRecords.map(record => ({
            id: record.id,
            treatmentItemId: record.treatmentItemId,
            status: record.status,
            notes: record.notes,
            recordedAt: record.recordedAt,
          })),
        };
      }
    );

    // Mock createTelemedicineSession implementation
    this.createTelemedicineSession.mockImplementation(
      (userId: string, providerId: string, scheduledTime: Date, sessionType: string, metadata?: Record<string, any>) => {
        // Validate input parameters
        if (!userId || !providerId) {
          throw new DatabaseException(
            'User ID and provider ID are required',
            DatabaseErrorType.VALIDATION,
            { userId, providerId }
          );
        }

        if (!scheduledTime) {
          throw new DatabaseException(
            'Scheduled time is required',
            DatabaseErrorType.VALIDATION,
            { scheduledTime }
          );
        }

        // Check if the provider exists and supports telemedicine
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider) {
          throw new DatabaseException(
            `Provider not found with ID ${providerId}`,
            DatabaseErrorType.NOT_FOUND,
            { providerId }
          );
        }

        if (!provider.telemedicineAvailable) {
          throw new DatabaseException(
            `Provider ${providerId} does not support telemedicine`,
            DatabaseErrorType.VALIDATION,
            { providerId }
          );
        }

        // Create an appointment for the telemedicine session
        const now = new Date();
        const appointmentId = `appointment-${Date.now()}`;
        const appointment: IAppointment = {
          id: appointmentId,
          userId,
          providerId,
          dateTime: scheduledTime,
          type: AppointmentType.TELEMEDICINE,
          status: AppointmentStatus.SCHEDULED,
          notes: metadata?.notes || '',
          createdAt: now,
          updatedAt: now
        };

        this.appointments.push(appointment);

        // Create the telemedicine session
        const sessionId = `tele-${Date.now()}`;
        const sessionUrl = `https://telemedicine.austa.app/session/${sessionId}`;
        const session: ITelemedicineSession = {
          id: sessionId,
          appointmentId,
          patientId: userId,
          providerId,
          startTime: scheduledTime,
          endTime: null,
          status: 'scheduled',
          sessionUrl,
          createdAt: now,
          updatedAt: now
        };

        this.telemedicineSessions.push(session);

        // Simulate sending journey event
        this.sendJourneyEvent(
          'TELEMEDICINE_SESSION_CREATED',
          userId,
          {
            sessionId,
            appointmentId,
            providerId,
            scheduledTime,
            sessionType,
          }
        );

        return {
          ...session,
          appointment,
        };
      }
    );

    // Mock updateTelemedicineSessionStatus implementation
    this.updateTelemedicineSessionStatus.mockImplementation(
      (sessionId: string, status: string, metadata?: Record<string, any>) => {
        // Validate input parameters
        if (!sessionId) {
          throw new DatabaseException(
            'Session ID is required',
            DatabaseErrorType.VALIDATION,
            { sessionId }
          );
        }

        if (!status) {
          throw new DatabaseException(
            'Status is required',
            DatabaseErrorType.VALIDATION,
            { status }
          );
        }

        // Valid statuses
        const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'];
        if (!validStatuses.includes(status)) {
          throw new DatabaseException(
            `Invalid status: ${status}`,
            DatabaseErrorType.VALIDATION,
            { status, validStatuses }
          );
        }

        // Get the session
        const session = this.telemedicineSessions.find(s => s.id === sessionId);
        if (!session) {
          throw new DatabaseException(
            `Telemedicine session not found with ID ${sessionId}`,
            DatabaseErrorType.NOT_FOUND,
            { sessionId }
          );
        }

        // Get the associated appointment
        const appointment = this.appointments.find(a => a.id === session.appointmentId);

        // Update the session status
        const previousStatus = session.status;
        session.status = status;
        session.updatedAt = new Date();
        
        if (status === 'completed') {
          session.endTime = new Date();
        }

        if (metadata) {
          session.metadata = metadata;
        }

        // Update the appointment status if needed
        if (appointment) {
          if (status === 'completed') {
            appointment.status = AppointmentStatus.COMPLETED;
          } else if (status === 'cancelled' || status === 'no-show') {
            appointment.status = AppointmentStatus.CANCELLED;
          }
          appointment.updatedAt = new Date();
        }

        // Simulate sending journey event
        this.sendJourneyEvent(
          'TELEMEDICINE_SESSION_UPDATED',
          session.patientId,
          {
            sessionId,
            appointmentId: session.appointmentId,
            providerId: session.providerId,
            status,
            previousStatus,
          }
        );

        return {
          ...session,
          appointment,
        };
      }
    );

    // Mock processSymptomCheckerInput implementation
    this.processSymptomCheckerInput.mockImplementation(
      (userId: string, symptoms: Record<string, any>[], demographics: Record<string, any>, medicalHistory?: Record<string, any>) => {
        // Validate input parameters
        if (!userId) {
          throw new DatabaseException(
            'User ID is required',
            DatabaseErrorType.VALIDATION,
            { userId }
          );
        }

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
          throw new DatabaseException(
            'At least one symptom is required',
            DatabaseErrorType.VALIDATION,
            { symptoms }
          );
        }

        if (!demographics) {
          throw new DatabaseException(
            'Demographics information is required',
            DatabaseErrorType.VALIDATION,
            { demographics }
          );
        }

        // Store the symptom check session
        const sessionId = `symptom-${Date.now()}`;
        const now = new Date();

        // Generate recommendations based on symptoms
        const urgencyLevels = ['low', 'medium', 'high', 'emergency'];
        const urgency = symptoms.some(s => s.severity === 'severe') ? 'high' :
                       symptoms.some(s => s.severity === 'moderate') ? 'medium' : 'low';

        // Generate care options based on urgency
        const careOptions = [];
        
        if (urgency === 'emergency') {
          careOptions.push({
            type: 'emergency',
            recommendation: 'Seek emergency care immediately',
            urgency: 'emergency',
          });
        } else if (urgency === 'high') {
          careOptions.push({
            type: 'urgent_care',
            recommendation: 'Visit an urgent care center today',
            urgency: 'high',
          });
          careOptions.push({
            type: 'telemedicine',
            recommendation: 'Schedule a telemedicine appointment',
            urgency: 'high',
          });
        } else {
          careOptions.push({
            type: 'primary_care',
            recommendation: 'Schedule an appointment with your primary care provider',
            urgency: urgency,
          });
          careOptions.push({
            type: 'telemedicine',
            recommendation: 'Schedule a telemedicine appointment',
            urgency: urgency,
          });
          careOptions.push({
            type: 'self_care',
            recommendation: 'Self-care recommendations provided below',
            urgency: 'low',
          });
        }

        // Find relevant providers based on symptoms
        const relevantSpecialties = this.getRelevantSpecialties(symptoms);
        const recommendedProviders = this.providers
          .filter(p => relevantSpecialties.includes(p.specialty) && p.telemedicineAvailable)
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            name: p.name,
            specialty: p.specialty,
            telemedicineAvailable: p.telemedicineAvailable,
          }));

        // Generate self-care recommendations
        const selfCareRecommendations = this.generateSelfCareRecommendations(symptoms);

        // Create the results
        const results = {
          sessionId,
          urgency,
          careOptions,
          recommendedProviders,
          selfCareRecommendations,
          disclaimer: 'This is not medical advice. Please consult with a healthcare professional for proper diagnosis and treatment.',
        };

        // Store the session
        const session = {
          id: sessionId,
          userId,
          symptoms,
          demographics,
          medicalHistory: medicalHistory || {},
          status: 'completed',
          timestamp: now,
          results,
        };

        this.symptomCheckerSessions.push(session);

        // Simulate sending journey event
        this.sendJourneyEvent(
          'SYMPTOM_CHECKER_USED',
          userId,
          {
            sessionId,
            symptomCount: symptoms.length,
            urgency,
          }
        );

        return results;
      }
    );

    // Mock validateJourneyData implementation
    this.validateJourneyData.mockImplementation(
      (dataType: string, data: Record<string, any>) => {
        const errors = [];

        switch (dataType) {
          case 'appointment':
            if (!data.providerId) errors.push({ field: 'providerId', message: 'Provider ID is required' });
            if (!data.dateTime) errors.push({ field: 'dateTime', message: 'Date and time are required' });
            if (!data.type) errors.push({ field: 'type', message: 'Appointment type is required' });
            break;

          case 'medication':
            if (!data.name) errors.push({ field: 'name', message: 'Medication name is required' });
            if (!data.dosage) errors.push({ field: 'dosage', message: 'Dosage is required' });
            if (!data.frequency) errors.push({ field: 'frequency', message: 'Frequency is required' });
            break;

          case 'provider':
            if (!data.name) errors.push({ field: 'name', message: 'Provider name is required' });
            if (!data.specialty) errors.push({ field: 'specialty', message: 'Specialty is required' });
            break;

          case 'treatmentPlan':
            if (!data.name) errors.push({ field: 'name', message: 'Treatment plan name is required' });
            if (!data.startDate) errors.push({ field: 'startDate', message: 'Start date is required' });
            break;

          case 'telemedicineSession':
            if (!data.appointmentId) errors.push({ field: 'appointmentId', message: 'Appointment ID is required' });
            if (!data.patientId) errors.push({ field: 'patientId', message: 'Patient ID is required' });
            if (!data.providerId) errors.push({ field: 'providerId', message: 'Provider ID is required' });
            if (!data.startTime) errors.push({ field: 'startTime', message: 'Start time is required' });
            break;

          default:
            errors.push({ field: 'dataType', message: `Unknown data type: ${dataType}` });
        }

        return {
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined,
        };
      }
    );

    // Mock getJourneyMetrics implementation
    this.getJourneyMetrics.mockImplementation(() => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get appointment metrics
      const appointmentsByStatus = this.appointments.reduce((acc, appointment) => {
        acc[appointment.status] = (acc[appointment.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get recent appointments
      const recentAppointmentsCount = this.appointments.filter(
        a => a.dateTime >= thirtyDaysAgo
      ).length;

      // Get medication adherence metrics
      const activeMedicationsCount = this.medications.filter(
        m => m.active
      ).length;

      // Get telemedicine metrics
      const telemedicineSessionsByStatus = this.telemedicineSessions.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get provider metrics
      const providersCount = this.providers.length;
      const telemedicineProvidersCount = this.providers.filter(
        p => p.telemedicineAvailable
      ).length;

      return {
        appointmentsByStatus,
        recentAppointmentsCount,
        activeMedicationsCount,
        telemedicineSessionsByStatus,
        providersCount,
        telemedicineProvidersCount,
        telemedicineProviderPercentage: providersCount > 0
          ? Math.round((telemedicineProvidersCount / providersCount) * 100)
          : 0,
        timestamp: now,
      };
    });

    // Mock sendJourneyEvent implementation (just logs the event)
    this.sendJourneyEvent.mockImplementation(
      (eventType: string, userId: string, payload: Record<string, any>) => {
        console.log(`[MOCK] Care Journey Event: ${eventType}`, { userId, ...payload });
        return Promise.resolve();
      }
    );
  }

  /**
   * Get relevant specialties based on symptoms
   * @param symptoms Reported symptoms
   * @returns List of relevant medical specialties
   * @private
   */
  private getRelevantSpecialties(symptoms: Record<string, any>[]): string[] {
    // This is a simplified implementation
    const specialtyMap: Record<string, string[]> = {
      'headache': ['Neurologia', 'Clínica Geral'],
      'chest pain': ['Cardiologia', 'Clínica Geral'],
      'abdominal pain': ['Gastroenterologia', 'Clínica Geral'],
      'fever': ['Infectologia', 'Clínica Geral'],
      'cough': ['Pneumologia', 'Clínica Geral'],
      'rash': ['Dermatologia', 'Clínica Geral'],
      'joint pain': ['Reumatologia', 'Ortopedia'],
      'back pain': ['Ortopedia', 'Neurologia', 'Fisioterapia'],
      'dizziness': ['Neurologia', 'Otorrinolaringologia'],
      'fatigue': ['Clínica Geral', 'Endocrinologia'],
    };

    // Collect all relevant specialties based on symptoms
    const specialties = new Set<string>();
    specialties.add('Clínica Geral'); // Always include general practice

    symptoms.forEach(symptom => {
      const symptomName = symptom.name.toLowerCase();
      if (specialtyMap[symptomName]) {
        specialtyMap[symptomName].forEach(specialty => specialties.add(specialty));
      }
    });

    return Array.from(specialties);
  }

  /**
   * Generate self-care recommendations based on symptoms
   * @param symptoms Reported symptoms
   * @returns Self-care recommendations
   * @private
   */
  private generateSelfCareRecommendations(symptoms: Record<string, any>[]): any[] {
    // This is a simplified implementation
    const recommendationMap: Record<string, any[]> = {
      'headache': [
        { action: 'Rest in a quiet, dark room', rationale: 'Reduces sensory stimulation that can worsen headaches' },
        { action: 'Stay hydrated', rationale: 'Dehydration can trigger or worsen headaches' },
        { action: 'Apply a cold or warm compress', rationale: 'May help reduce pain and inflammation' },
      ],
      'fever': [
        { action: 'Stay hydrated', rationale: 'Helps replace fluids lost due to fever' },
        { action: 'Rest', rationale: 'Allows your body to focus energy on fighting infection' },
        { action: 'Use a light blanket', rationale: 'Helps manage body temperature' },
      ],
      'cough': [
        { action: 'Stay hydrated', rationale: 'Keeps mucus thin and easier to clear' },
        { action: 'Use a humidifier', rationale: 'Adds moisture to the air, which may help ease coughing' },
        { action: 'Avoid irritants', rationale: 'Smoke and strong odors can worsen coughing' },
      ],
      'sore throat': [
        { action: 'Gargle with salt water', rationale: 'May help reduce swelling and discomfort' },
        { action: 'Stay hydrated', rationale: 'Keeps the throat moist and prevents dehydration' },
        { action: 'Use throat lozenges', rationale: 'May provide temporary pain relief' },
      ],
    };

    // Collect all relevant recommendations based on symptoms
    const recommendations: any[] = [];

    symptoms.forEach(symptom => {
      const symptomName = symptom.name.toLowerCase();
      if (recommendationMap[symptomName]) {
        recommendationMap[symptomName].forEach(recommendation => {
          // Check if recommendation is already added
          const exists = recommendations.some(r => r.action === recommendation.action);
          if (!exists) {
            recommendations.push(recommendation);
          }
        });
      }
    });

    // Add general recommendations if no specific ones are found
    if (recommendations.length === 0) {
      recommendations.push(
        { action: 'Rest and get adequate sleep', rationale: 'Helps your body recover' },
        { action: 'Stay hydrated', rationale: 'Supports overall health and recovery' },
        { action: 'Monitor your symptoms', rationale: 'Seek medical attention if symptoms worsen' }
      );
    }

    return recommendations;
  }

  /**
   * Reset all mock data to initial state
   */
  public reset(): void {
    // Reset all mock data to initial values
    this.appointments = [
      {
        id: '1',
        userId: 'user1',
        providerId: 'provider1',
        dateTime: new Date('2023-06-15T10:00:00Z'),
        type: AppointmentType.IN_PERSON,
        status: AppointmentStatus.SCHEDULED,
        notes: 'Regular checkup',
        createdAt: new Date('2023-06-01T08:30:00Z'),
        updatedAt: new Date('2023-06-01T08:30:00Z')
      },
      {
        id: '2',
        userId: 'user1',
        providerId: 'provider2',
        dateTime: new Date('2023-06-20T14:30:00Z'),
        type: AppointmentType.TELEMEDICINE,
        status: AppointmentStatus.SCHEDULED,
        notes: 'Follow-up consultation',
        createdAt: new Date('2023-06-05T11:45:00Z'),
        updatedAt: new Date('2023-06-05T11:45:00Z')
      },
      {
        id: '3',
        userId: 'user2',
        providerId: 'provider1',
        dateTime: new Date('2023-06-10T09:15:00Z'),
        type: AppointmentType.IN_PERSON,
        status: AppointmentStatus.COMPLETED,
        notes: 'Annual physical',
        createdAt: new Date('2023-05-20T16:00:00Z'),
        updatedAt: new Date('2023-06-10T10:30:00Z')
      }
    ];

    // Reset all mock implementations
    this.setupMockImplementations();
  }

  /**
   * Get a copy of the mock data for testing
   */
  public getMockData() {
    return {
      appointments: [...this.appointments],
      providers: [...this.providers],
      medications: [...this.medications],
      telemedicineSessions: [...this.telemedicineSessions],
      treatmentPlans: [...this.treatmentPlans],
      symptomCheckerSessions: [...this.symptomCheckerSessions],
    };
  }

  /**
   * Add custom mock data for testing
   */
  public addMockData(data: {
    appointments?: IAppointment[],
    providers?: IProvider[],
    medications?: IMedication[],
    telemedicineSessions?: ITelemedicineSession[],
    treatmentPlans?: ITreatmentPlan[],
    symptomCheckerSessions?: any[],
  }) {
    if (data.appointments) {
      this.appointments.push(...data.appointments);
    }
    if (data.providers) {
      this.providers.push(...data.providers);
    }
    if (data.medications) {
      this.medications.push(...data.medications);
    }
    if (data.telemedicineSessions) {
      this.telemedicineSessions.push(...data.telemedicineSessions);
    }
    if (data.treatmentPlans) {
      this.treatmentPlans.push(...data.treatmentPlans);
    }
    if (data.symptomCheckerSessions) {
      this.symptomCheckerSessions.push(...data.symptomCheckerSessions);
    }
  }
}