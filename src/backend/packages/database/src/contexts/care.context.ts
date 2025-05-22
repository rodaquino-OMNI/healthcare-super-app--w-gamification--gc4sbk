import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { BaseJourneyContext } from './base-journey.context';
import { TransactionClient } from '../transactions/transaction.interface';
import { Transactional } from '../transactions/transaction.decorators';
import { TransactionService } from '../transactions/transaction.service';

// Import care-specific error classes
import {
  AppointmentNotFoundError,
  AppointmentConflictError,
  AppointmentCancellationError,
  AppointmentReschedulingError,
} from '@austa/errors/journey/care/appointments-errors';

import {
  ProviderNotFoundError,
  ProviderNotAvailableError,
  ProviderNotTelemedicineEnabledError,
} from '@austa/errors/journey/care/providers-errors';

import {
  MedicationNotFoundError,
  MedicationAdherenceError,
  MedicationReminderError,
} from '@austa/errors/journey/care/medications-errors';

import {
  TelemedicineSessionNotFoundError,
  TelemedicineSessionError,
  TelemedicineConnectionError,
} from '@austa/errors/journey/care/telemedicine-errors';

import {
  TreatmentPlanNotFoundError,
  TreatmentPlanProgressError,
  TreatmentActivityError,
} from '@austa/errors/journey/care/treatments-errors';

import { CarePersistenceError } from '@austa/errors/journey/care/care-errors';

// Import care-specific interfaces
import { IAppointment, AppointmentStatus, AppointmentType } from '@austa/interfaces/journey/care/appointment.interface';
import { IProvider } from '@austa/interfaces/journey/care/provider.interface';
import { IMedication } from '@austa/interfaces/journey/care/medication.interface';
import { ITelemedicineSession } from '@austa/interfaces/journey/care/telemedicine-session.interface';
import { ITreatmentPlan } from '@austa/interfaces/journey/care/treatment-plan.interface';

/**
 * Specialized database context for the Care journey ("Cuidar-me Agora")
 * that extends the base journey context with care-specific database operations.
 * 
 * Provides optimized methods for appointments, providers, medications, treatments,
 * and telemedicine sessions with care-specific transaction management and error handling.
 */
@Injectable()
export class CareContext extends BaseJourneyContext {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly transactionService: TransactionService,
  ) {
    super(prisma);
  }

  /**
   * Retrieves an appointment by ID with optimized query for appointment details
   * 
   * @param appointmentId - The unique identifier of the appointment
   * @returns The appointment details or throws AppointmentNotFoundError if not found
   */
  async getAppointmentById(appointmentId: string): Promise<IAppointment> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          provider: true,
          telemedicineSession: true,
        },
      });

      if (!appointment) {
        throw new AppointmentNotFoundError(`Appointment with ID ${appointmentId} not found`);
      }

      return appointment as unknown as IAppointment;
    } catch (error) {
      if (error instanceof AppointmentNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to retrieve appointment with ID ${appointmentId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves appointments for a specific user with pagination
   * 
   * @param userId - The unique identifier of the user
   * @param status - Optional filter for appointment status
   * @param type - Optional filter for appointment type
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns Paginated list of appointments for the specified user
   */
  async getUserAppointments(
    userId: string,
    status?: AppointmentStatus,
    type?: AppointmentType,
    page = 1,
    limit = 10,
  ): Promise<{ appointments: IAppointment[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.AppointmentWhereInput = { userId };
      
      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      const [appointments, total] = await Promise.all([
        this.prisma.appointment.findMany({
          where,
          include: {
            provider: true,
            telemedicineSession: true,
          },
          skip,
          take: limit,
          orderBy: {
            scheduledAt: 'asc',
          },
        }),
        this.prisma.appointment.count({ where }),
      ]);

      return {
        appointments: appointments as unknown as IAppointment[],
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new CarePersistenceError(
        `Failed to retrieve appointments for user ${userId}`,
        { cause: error },
      );
    }
  }

  /**
   * Creates a new appointment with optimized transaction pattern
   * 
   * @param data - The appointment data to create
   * @returns The created appointment
   */
  @Transactional()
  async createAppointment(
    data: Prisma.AppointmentCreateInput,
    client?: TransactionClient,
  ): Promise<IAppointment> {
    const prisma = client || this.prisma;
    
    try {
      // Validate appointment date (must be in the future)
      const scheduledAt = new Date(data.scheduledAt);
      if (scheduledAt <= new Date()) {
        throw new AppointmentConflictError('Appointment date must be in the future');
      }

      // Check provider availability
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          providerId: data.provider.connect?.id,
          scheduledAt: {
            gte: new Date(scheduledAt.getTime() - 30 * 60 * 1000), // 30 minutes before
            lte: new Date(scheduledAt.getTime() + 30 * 60 * 1000), // 30 minutes after
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
        },
      });

      if (existingAppointments.length > 0) {
        throw new ProviderNotAvailableError(
          `Provider is not available at the requested time`,
        );
      }

      // If telemedicine appointment, verify provider supports telemedicine
      if (data.type === AppointmentType.TELEMEDICINE) {
        const provider = await prisma.provider.findUnique({
          where: { id: data.provider.connect?.id },
          select: { telemedicineAvailable: true },
        });

        if (!provider || !provider.telemedicineAvailable) {
          throw new ProviderNotTelemedicineEnabledError(
            `Provider does not support telemedicine appointments`,
          );
        }
      }

      // Create the appointment
      const appointment = await prisma.appointment.create({
        data: {
          ...data,
          status: AppointmentStatus.SCHEDULED,
        },
        include: {
          provider: true,
        },
      });

      return appointment as unknown as IAppointment;
    } catch (error) {
      if (
        error instanceof AppointmentConflictError ||
        error instanceof ProviderNotAvailableError ||
        error instanceof ProviderNotTelemedicineEnabledError
      ) {
        throw error;
      }
      throw new CarePersistenceError('Failed to create appointment', { cause: error });
    }
  }

  /**
   * Updates an appointment status with optimized transaction pattern
   * 
   * @param appointmentId - The unique identifier of the appointment
   * @param status - The new status for the appointment
   * @param notes - Optional notes about the status change
   * @returns The updated appointment
   */
  @Transactional()
  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    notes?: string,
    client?: TransactionClient,
  ): Promise<IAppointment> {
    const prisma = client || this.prisma;
    
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new AppointmentNotFoundError(`Appointment with ID ${appointmentId} not found`);
      }

      // Validate status transition
      this.validateAppointmentStatusTransition(appointment.status as AppointmentStatus, status);

      // Update the appointment status
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status,
          notes,
          updatedAt: new Date(),
        },
        include: {
          provider: true,
          telemedicineSession: true,
        },
      });

      return updatedAppointment as unknown as IAppointment;
    } catch (error) {
      if (error instanceof AppointmentNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to update status for appointment ${appointmentId}`,
        { cause: error },
      );
    }
  }

  /**
   * Validates appointment status transitions to ensure they follow the correct flow
   * 
   * @param currentStatus - The current status of the appointment
   * @param newStatus - The new status to transition to
   * @throws AppointmentConflictError if the transition is invalid
   */
  private validateAppointmentStatusTransition(
    currentStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
  ): void {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.CHECKED_IN,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CHECKED_IN]: [
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.NO_SHOW,
      ],
      [AppointmentStatus.IN_PROGRESS]: [
        AppointmentStatus.COMPLETED,
      ],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [],
    };

    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(newStatus)
    ) {
      throw new AppointmentConflictError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Reschedules an appointment with optimized transaction pattern
   * 
   * @param appointmentId - The unique identifier of the appointment
   * @param newScheduledAt - The new date and time for the appointment
   * @returns The rescheduled appointment
   */
  @Transactional()
  async rescheduleAppointment(
    appointmentId: string,
    newScheduledAt: Date,
    client?: TransactionClient,
  ): Promise<IAppointment> {
    const prisma = client || this.prisma;
    
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { provider: true },
      });

      if (!appointment) {
        throw new AppointmentNotFoundError(`Appointment with ID ${appointmentId} not found`);
      }

      // Validate appointment status (can only reschedule SCHEDULED or CONFIRMED appointments)
      if (
        appointment.status !== AppointmentStatus.SCHEDULED &&
        appointment.status !== AppointmentStatus.CONFIRMED
      ) {
        throw new AppointmentReschedulingError(
          `Cannot reschedule appointment with status ${appointment.status}`,
        );
      }

      // Validate new date (must be in the future)
      if (newScheduledAt <= new Date()) {
        throw new AppointmentReschedulingError('New appointment date must be in the future');
      }

      // Check provider availability at new time
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          providerId: appointment.providerId,
          id: { not: appointmentId }, // Exclude current appointment
          scheduledAt: {
            gte: new Date(newScheduledAt.getTime() - 30 * 60 * 1000), // 30 minutes before
            lte: new Date(newScheduledAt.getTime() + 30 * 60 * 1000), // 30 minutes after
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
        },
      });

      if (existingAppointments.length > 0) {
        throw new ProviderNotAvailableError(
          `Provider is not available at the requested time`,
        );
      }

      // Update the appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduledAt: newScheduledAt,
          updatedAt: new Date(),
        },
        include: {
          provider: true,
          telemedicineSession: true,
        },
      });

      return updatedAppointment as unknown as IAppointment;
    } catch (error) {
      if (
        error instanceof AppointmentNotFoundError ||
        error instanceof AppointmentReschedulingError ||
        error instanceof ProviderNotAvailableError
      ) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to reschedule appointment ${appointmentId}`,
        { cause: error },
      );
    }
  }

  /**
   * Cancels an appointment with optimized transaction pattern
   * 
   * @param appointmentId - The unique identifier of the appointment
   * @param reason - The reason for cancellation
   * @returns The cancelled appointment
   */
  @Transactional()
  async cancelAppointment(
    appointmentId: string,
    reason: string,
    client?: TransactionClient,
  ): Promise<IAppointment> {
    const prisma = client || this.prisma;
    
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new AppointmentNotFoundError(`Appointment with ID ${appointmentId} not found`);
      }

      // Validate appointment status (can only cancel SCHEDULED or CONFIRMED appointments)
      if (
        appointment.status !== AppointmentStatus.SCHEDULED &&
        appointment.status !== AppointmentStatus.CONFIRMED
      ) {
        throw new AppointmentCancellationError(
          `Cannot cancel appointment with status ${appointment.status}`,
        );
      }

      // Check cancellation time policy (e.g., must cancel at least 2 hours before)
      const appointmentTime = new Date(appointment.scheduledAt);
      const currentTime = new Date();
      const hoursUntilAppointment = (appointmentTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilAppointment < 2) {
        throw new AppointmentCancellationError(
          'Appointments must be cancelled at least 2 hours in advance',
        );
      }

      // Update the appointment
      const cancelledAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          notes: reason,
          updatedAt: new Date(),
        },
        include: {
          provider: true,
          telemedicineSession: true,
        },
      });

      return cancelledAppointment as unknown as IAppointment;
    } catch (error) {
      if (
        error instanceof AppointmentNotFoundError ||
        error instanceof AppointmentCancellationError
      ) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to cancel appointment ${appointmentId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves a provider by ID with optimized query
   * 
   * @param providerId - The unique identifier of the provider
   * @returns The provider details or throws ProviderNotFoundError if not found
   */
  async getProviderById(providerId: string): Promise<IProvider> {
    try {
      const provider = await this.prisma.provider.findUnique({
        where: { id: providerId },
      });

      if (!provider) {
        throw new ProviderNotFoundError(`Provider with ID ${providerId} not found`);
      }

      return provider as unknown as IProvider;
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to retrieve provider with ID ${providerId}`,
        { cause: error },
      );
    }
  }

  /**
   * Searches for providers with filtering and pagination
   * 
   * @param filters - Optional filters for provider search
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns Paginated list of providers matching the filters
   */
  async searchProviders(
    filters: {
      name?: string;
      specialty?: string;
      location?: string;
      telemedicineAvailable?: boolean;
    },
    page = 1,
    limit = 10,
  ): Promise<{ providers: IProvider[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.ProviderWhereInput = {};
      
      if (filters.name) {
        where.name = {
          contains: filters.name,
          mode: 'insensitive',
        };
      }

      if (filters.specialty) {
        where.specialty = {
          contains: filters.specialty,
          mode: 'insensitive',
        };
      }

      if (filters.location) {
        where.practiceLocation = {
          contains: filters.location,
          mode: 'insensitive',
        };
      }

      if (filters.telemedicineAvailable !== undefined) {
        where.telemedicineAvailable = filters.telemedicineAvailable;
      }

      const [providers, total] = await Promise.all([
        this.prisma.provider.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.provider.count({ where }),
      ]);

      return {
        providers: providers as unknown as IProvider[],
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new CarePersistenceError(
        'Failed to search providers',
        { cause: error },
      );
    }
  }

  /**
   * Checks provider availability for a specific date and time
   * 
   * @param providerId - The unique identifier of the provider
   * @param date - The date to check availability for
   * @returns Array of available time slots for the specified date
   */
  async getProviderAvailability(
    providerId: string,
    date: Date,
  ): Promise<{ startTime: Date; endTime: Date }[]> {
    try {
      // Check if provider exists
      const provider = await this.prisma.provider.findUnique({
        where: { id: providerId },
      });

      if (!provider) {
        throw new ProviderNotFoundError(`Provider with ID ${providerId} not found`);
      }

      // Set start and end of the day
      const startOfDay = new Date(date);
      startOfDay.setHours(8, 0, 0, 0); // 8:00 AM
      
      const endOfDay = new Date(date);
      endOfDay.setHours(17, 0, 0, 0); // 5:00 PM

      // Get existing appointments for the provider on the specified date
      const existingAppointments = await this.prisma.appointment.findMany({
        where: {
          providerId,
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });

      // Generate available time slots (30-minute intervals)
      const availableSlots: { startTime: Date; endTime: Date }[] = [];
      const slotDuration = 30; // minutes
      
      for (
        let slotStart = new Date(startOfDay);
        slotStart < endOfDay;
        slotStart = new Date(slotStart.getTime() + slotDuration * 60 * 1000)
      ) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);
        
        // Check if slot conflicts with any existing appointment
        const isConflicting = existingAppointments.some(appointment => {
          const appointmentTime = new Date(appointment.scheduledAt);
          return (
            (appointmentTime >= slotStart && appointmentTime < slotEnd) ||
            (appointmentTime <= slotStart && 
              new Date(appointmentTime.getTime() + 30 * 60 * 1000) > slotStart)
          );
        });

        if (!isConflicting) {
          availableSlots.push({
            startTime: new Date(slotStart),
            endTime: new Date(slotEnd),
          });
        }
      }

      return availableSlots;
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to get availability for provider ${providerId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves a medication by ID with optimized query
   * 
   * @param medicationId - The unique identifier of the medication
   * @returns The medication details or throws MedicationNotFoundError if not found
   */
  async getMedicationById(medicationId: string): Promise<IMedication> {
    try {
      const medication = await this.prisma.medication.findUnique({
        where: { id: medicationId },
      });

      if (!medication) {
        throw new MedicationNotFoundError(`Medication with ID ${medicationId} not found`);
      }

      return medication as unknown as IMedication;
    } catch (error) {
      if (error instanceof MedicationNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to retrieve medication with ID ${medicationId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves medications for a specific user with pagination
   * 
   * @param userId - The unique identifier of the user
   * @param active - Optional filter for active medications
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns Paginated list of medications for the specified user
   */
  async getUserMedications(
    userId: string,
    active?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{ medications: IMedication[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.MedicationWhereInput = { userId };
      
      if (active !== undefined) {
        where.active = active;
      }

      const [medications, total] = await Promise.all([
        this.prisma.medication.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.medication.count({ where }),
      ]);

      return {
        medications: medications as unknown as IMedication[],
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new CarePersistenceError(
        `Failed to retrieve medications for user ${userId}`,
        { cause: error },
      );
    }
  }

  /**
   * Creates a new medication with optimized transaction pattern
   * 
   * @param data - The medication data to create
   * @returns The created medication
   */
  @Transactional()
  async createMedication(
    data: Prisma.MedicationCreateInput,
    client?: TransactionClient,
  ): Promise<IMedication> {
    const prisma = client || this.prisma;
    
    try {
      // Validate medication data
      if (!data.name || !data.dosage || !data.frequency || !data.startDate) {
        throw new MedicationAdherenceError('Missing required medication fields');
      }

      // Create the medication
      const medication = await prisma.medication.create({
        data: {
          ...data,
          active: true,
        },
      });

      return medication as unknown as IMedication;
    } catch (error) {
      if (error instanceof MedicationAdherenceError) {
        throw error;
      }
      throw new CarePersistenceError('Failed to create medication', { cause: error });
    }
  }

  /**
   * Updates medication adherence tracking
   * 
   * @param medicationId - The unique identifier of the medication
   * @param adherenceData - The adherence data to update
   * @returns The updated medication
   */
  @Transactional()
  async updateMedicationAdherence(
    medicationId: string,
    adherenceData: {
      takenAt: Date;
      taken: boolean;
      notes?: string;
    },
    client?: TransactionClient,
  ): Promise<IMedication> {
    const prisma = client || this.prisma;
    
    try {
      const medication = await prisma.medication.findUnique({
        where: { id: medicationId },
      });

      if (!medication) {
        throw new MedicationNotFoundError(`Medication with ID ${medicationId} not found`);
      }

      // Create adherence record
      await prisma.medicationAdherence.create({
        data: {
          medicationId,
          takenAt: adherenceData.takenAt,
          taken: adherenceData.taken,
          notes: adherenceData.notes,
        },
      });

      // Update medication last taken date if medication was taken
      if (adherenceData.taken) {
        await prisma.medication.update({
          where: { id: medicationId },
          data: {
            lastTakenAt: adherenceData.takenAt,
          },
        });
      }

      // Get updated medication
      const updatedMedication = await prisma.medication.findUnique({
        where: { id: medicationId },
      });

      return updatedMedication as unknown as IMedication;
    } catch (error) {
      if (error instanceof MedicationNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to update adherence for medication ${medicationId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves a telemedicine session by ID with optimized query
   * 
   * @param sessionId - The unique identifier of the telemedicine session
   * @returns The telemedicine session details or throws TelemedicineSessionNotFoundError if not found
   */
  async getTelemedicineSessionById(sessionId: string): Promise<ITelemedicineSession> {
    try {
      const session = await this.prisma.telemedicineSession.findUnique({
        where: { id: sessionId },
        include: {
          appointment: {
            include: {
              provider: true,
            },
          },
        },
      });

      if (!session) {
        throw new TelemedicineSessionNotFoundError(`Telemedicine session with ID ${sessionId} not found`);
      }

      return session as unknown as ITelemedicineSession;
    } catch (error) {
      if (error instanceof TelemedicineSessionNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to retrieve telemedicine session with ID ${sessionId}`,
        { cause: error },
      );
    }
  }

  /**
   * Creates a new telemedicine session with optimized transaction pattern
   * 
   * @param data - The telemedicine session data to create
   * @returns The created telemedicine session
   */
  @Transactional()
  async createTelemedicineSession(
    data: Prisma.TelemedicineSessionCreateInput,
    client?: TransactionClient,
  ): Promise<ITelemedicineSession> {
    const prisma = client || this.prisma;
    
    try {
      // Check if appointment exists and is of type TELEMEDICINE
      const appointment = await prisma.appointment.findUnique({
        where: { id: data.appointment.connect?.id },
        include: { provider: true },
      });

      if (!appointment) {
        throw new AppointmentNotFoundError(
          `Appointment with ID ${data.appointment.connect?.id} not found`,
        );
      }

      if (appointment.type !== AppointmentType.TELEMEDICINE) {
        throw new TelemedicineSessionError(
          `Appointment is not of type TELEMEDICINE`,
        );
      }

      // Check if provider supports telemedicine
      if (!appointment.provider.telemedicineAvailable) {
        throw new ProviderNotTelemedicineEnabledError(
          `Provider does not support telemedicine appointments`,
        );
      }

      // Create the telemedicine session
      const session = await prisma.telemedicineSession.create({
        data: {
          ...data,
          startTime: new Date(),
        },
        include: {
          appointment: {
            include: {
              provider: true,
            },
          },
        },
      });

      // Update appointment status to IN_PROGRESS
      await prisma.appointment.update({
        where: { id: data.appointment.connect?.id },
        data: {
          status: AppointmentStatus.IN_PROGRESS,
        },
      });

      return session as unknown as ITelemedicineSession;
    } catch (error) {
      if (
        error instanceof AppointmentNotFoundError ||
        error instanceof TelemedicineSessionError ||
        error instanceof ProviderNotTelemedicineEnabledError
      ) {
        throw error;
      }
      throw new CarePersistenceError('Failed to create telemedicine session', { cause: error });
    }
  }

  /**
   * Ends a telemedicine session with optimized transaction pattern
   * 
   * @param sessionId - The unique identifier of the telemedicine session
   * @returns The updated telemedicine session
   */
  @Transactional()
  async endTelemedicineSession(
    sessionId: string,
    client?: TransactionClient,
  ): Promise<ITelemedicineSession> {
    const prisma = client || this.prisma;
    
    try {
      const session = await prisma.telemedicineSession.findUnique({
        where: { id: sessionId },
        include: { appointment: true },
      });

      if (!session) {
        throw new TelemedicineSessionNotFoundError(`Telemedicine session with ID ${sessionId} not found`);
      }

      // Update session end time
      const updatedSession = await prisma.telemedicineSession.update({
        where: { id: sessionId },
        data: {
          endTime: new Date(),
        },
        include: {
          appointment: {
            include: {
              provider: true,
            },
          },
        },
      });

      // Update appointment status to COMPLETED
      await prisma.appointment.update({
        where: { id: session.appointmentId },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
      });

      return updatedSession as unknown as ITelemedicineSession;
    } catch (error) {
      if (error instanceof TelemedicineSessionNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to end telemedicine session ${sessionId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves a treatment plan by ID with optimized query
   * 
   * @param treatmentPlanId - The unique identifier of the treatment plan
   * @returns The treatment plan details or throws TreatmentPlanNotFoundError if not found
   */
  async getTreatmentPlanById(treatmentPlanId: string): Promise<ITreatmentPlan> {
    try {
      const treatmentPlan = await this.prisma.treatmentPlan.findUnique({
        where: { id: treatmentPlanId },
        include: {
          careActivities: true,
        },
      });

      if (!treatmentPlan) {
        throw new TreatmentPlanNotFoundError(`Treatment plan with ID ${treatmentPlanId} not found`);
      }

      return treatmentPlan as unknown as ITreatmentPlan;
    } catch (error) {
      if (error instanceof TreatmentPlanNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to retrieve treatment plan with ID ${treatmentPlanId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves treatment plans for a specific user with pagination
   * 
   * @param userId - The unique identifier of the user
   * @param active - Optional filter for active treatment plans
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns Paginated list of treatment plans for the specified user
   */
  async getUserTreatmentPlans(
    userId: string,
    active?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{ treatmentPlans: ITreatmentPlan[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.TreatmentPlanWhereInput = { userId };
      
      if (active !== undefined) {
        const now = new Date();
        if (active) {
          // Active plans: start date is in the past and end date is in the future or null
          where.start = { lte: now };
          where.OR = [
            { end: { gte: now } },
            { end: null },
          ];
        } else {
          // Inactive plans: end date is in the past
          where.end = { lte: now };
        }
      }

      const [treatmentPlans, total] = await Promise.all([
        this.prisma.treatmentPlan.findMany({
          where,
          include: {
            careActivities: true,
          },
          skip,
          take: limit,
          orderBy: {
            start: 'desc',
          },
        }),
        this.prisma.treatmentPlan.count({ where }),
      ]);

      return {
        treatmentPlans: treatmentPlans as unknown as ITreatmentPlan[],
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new CarePersistenceError(
        `Failed to retrieve treatment plans for user ${userId}`,
        { cause: error },
      );
    }
  }

  /**
   * Updates treatment plan progress with optimized transaction pattern
   * 
   * @param treatmentPlanId - The unique identifier of the treatment plan
   * @param progress - The new progress value (0-100)
   * @returns The updated treatment plan
   */
  @Transactional()
  async updateTreatmentPlanProgress(
    treatmentPlanId: string,
    progress: number,
    client?: TransactionClient,
  ): Promise<ITreatmentPlan> {
    const prisma = client || this.prisma;
    
    try {
      const treatmentPlan = await prisma.treatmentPlan.findUnique({
        where: { id: treatmentPlanId },
      });

      if (!treatmentPlan) {
        throw new TreatmentPlanNotFoundError(`Treatment plan with ID ${treatmentPlanId} not found`);
      }

      // Validate progress value
      if (progress < 0 || progress > 100) {
        throw new TreatmentPlanProgressError('Progress must be between 0 and 100');
      }

      // Update treatment plan progress
      const updatedTreatmentPlan = await prisma.treatmentPlan.update({
        where: { id: treatmentPlanId },
        data: {
          progress,
          updatedAt: new Date(),
        },
        include: {
          careActivities: true,
        },
      });

      return updatedTreatmentPlan as unknown as ITreatmentPlan;
    } catch (error) {
      if (
        error instanceof TreatmentPlanNotFoundError ||
        error instanceof TreatmentPlanProgressError
      ) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to update progress for treatment plan ${treatmentPlanId}`,
        { cause: error },
      );
    }
  }

  /**
   * Adds a care activity to a treatment plan with optimized transaction pattern
   * 
   * @param treatmentPlanId - The unique identifier of the treatment plan
   * @param activityData - The care activity data to add
   * @returns The updated treatment plan with the new activity
   */
  @Transactional()
  async addCareActivityToTreatmentPlan(
    treatmentPlanId: string,
    activityData: Prisma.CareActivityCreateInput,
    client?: TransactionClient,
  ): Promise<ITreatmentPlan> {
    const prisma = client || this.prisma;
    
    try {
      const treatmentPlan = await prisma.treatmentPlan.findUnique({
        where: { id: treatmentPlanId },
      });

      if (!treatmentPlan) {
        throw new TreatmentPlanNotFoundError(`Treatment plan with ID ${treatmentPlanId} not found`);
      }

      // Create care activity
      await prisma.careActivity.create({
        data: {
          ...activityData,
          treatmentPlan: {
            connect: { id: treatmentPlanId },
          },
        },
      });

      // Get updated treatment plan with activities
      const updatedTreatmentPlan = await prisma.treatmentPlan.findUnique({
        where: { id: treatmentPlanId },
        include: {
          careActivities: true,
        },
      });

      return updatedTreatmentPlan as unknown as ITreatmentPlan;
    } catch (error) {
      if (error instanceof TreatmentPlanNotFoundError) {
        throw error;
      }
      throw new CarePersistenceError(
        `Failed to add care activity to treatment plan ${treatmentPlanId}`,
        { cause: error },
      );
    }
  }
}