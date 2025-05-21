import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { PrismaService } from '@app/shared/database/prisma.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto, PaginatedResponse } from '@app/shared/dto/pagination.dto';
import { Service } from '@app/shared/interfaces/service.interface';
import { Repository } from '@app/shared/interfaces/repository.interface';
import { ProvidersService } from '../providers/providers.service';
import { TelemedicineService } from '../telemedicine/telemedicine.service';
import { configuration } from '../config/configuration';

// Import interfaces from @austa/interfaces package
import { 
  IAppointment, 
  AppointmentStatus, 
  AppointmentType,
  ITelemedicineSession 
} from '@austa/interfaces/journey/care';

// Import error handling utilities from @austa/errors package
import {
  Retry,
  RetryWithBackoff,
  WithCircuitBreaker,
  WithFallback,
  Resilient
} from '@austa/errors/decorators';

import {
  AppointmentNotFoundError,
  AppointmentDateInPastError,
  AppointmentOverlapError,
  AppointmentProviderUnavailableError,
  AppointmentPersistenceError,
  AppointmentCalendarSyncError
} from '@austa/errors/journey/care';

import { BaseError, ErrorType } from '@austa/errors';

/**
 * Handles the business logic for managing appointments within the Care Service.
 * This service provides methods for creating, retrieving, updating, and deleting appointments,
 * ensuring proper data validation and interaction with the data access layer.
 * 
 * Implements the requirements for appointment booking and management in the Care Now journey.
 */
@Injectable()
export class AppointmentsService implements Service<IAppointment, CreateAppointmentDto, UpdateAppointmentDto> {
  private readonly logger = new LoggerService(AppointmentsService.name);
  private readonly config = configuration();

  /**
   * Initializes the AppointmentsService with required dependencies.
   * 
   * @param prisma Database service for appointment data access
   * @param providersService Service for managing healthcare providers
   * @param telemedicineService Service for managing telemedicine sessions
   * @param kafkaService Service for event streaming
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly telemedicineService: TelemedicineService,
    private readonly kafkaService: KafkaService
  ) {
    this.logger.log('AppointmentsService initialized');
  }

  /**
   * Retrieves an appointment by its unique identifier.
   * 
   * @param id Appointment ID
   * @returns The requested appointment or null if not found
   */
  async findById(id: string): Promise<IAppointment | null> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          provider: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return appointment;
    } catch (error) {
      this.logger.error(`Failed to find appointment: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to retrieve appointment with ID ${id}`,
        { id },
        error
      );
    }
  }

  /**
   * Retrieves a paginated list of appointments based on filter criteria.
   * 
   * @param pagination Pagination parameters
   * @param filter Filter criteria for appointments
   * @returns Paginated list of appointments
   */
  async findAll(pagination?: PaginationDto, filter?: FilterDto): Promise<PaginatedResponse<IAppointment>> {
    try {
      const { page = 1, limit = 10 } = pagination || {};
      const skip = (page - 1) * limit;

      // Prepare where clause from filter
      const where = filter?.where || {};

      // Get appointments with pagination
      const appointments = await this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: filter?.orderBy || { dateTime: 'desc' },
        include: {
          provider: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      // Get total count for pagination
      const totalItems = await this.count(filter);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: appointments,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      this.logger.error(`Failed to find appointments: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        'Failed to retrieve appointments',
        { pagination, filter },
        error
      );
    }
  }

  /**
   * Creates a new appointment.
   * 
   * @param data Appointment data
   * @returns The created appointment
   */
  async create(data: CreateAppointmentDto): Promise<IAppointment> {
    try {
      // Use transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // Check if provider exists
        const provider = await this.getProviderWithRetry(data.providerId);

        // Check appointment time is in the future
        const appointmentDate = new Date(data.dateTime);
        const now = new Date();
        if (appointmentDate < now) {
          throw new AppointmentDateInPastError(
            'Appointment date must be in the future',
            { dateTime: data.dateTime }
          );
        }

        // Check if the appointment time is within allowed advance booking range
        const maxAdvanceDays = this.config.appointments.maxAdvanceDays;
        const maxAdvanceDate = new Date();
        maxAdvanceDate.setDate(maxAdvanceDate.getDate() + maxAdvanceDays);

        if (appointmentDate > maxAdvanceDate) {
          throw new AppointmentDateInPastError(
            `Appointments can only be booked up to ${maxAdvanceDays} days in advance`,
            { dateTime: data.dateTime, maxAdvanceDate }
          );
        }

        // Check for user appointment conflicts
        const hasConflict = await this.checkUserAppointmentConflict(data.userId, appointmentDate);
        if (hasConflict) {
          throw new AppointmentOverlapError(
            'User already has an appointment scheduled at this time',
            { userId: data.userId, dateTime: data.dateTime }
          );
        }

        // Check provider availability for the requested time
        const isAvailable = await this.checkProviderAvailabilityWithRetry(
          data.providerId, 
          appointmentDate
        );

        if (!isAvailable) {
          throw new AppointmentProviderUnavailableError(
            `Provider is not available at the requested time`,
            { providerId: data.providerId, dateTime: data.dateTime }
          );
        }

        // For telemedicine, check if provider offers it
        if (data.type === AppointmentType.TELEMEDICINE && !provider.telemedicineAvailable) {
          throw new AppointmentProviderUnavailableError(
            `Provider does not offer telemedicine services`,
            { providerId: data.providerId }
          );
        }

        // Create appointment
        const appointment = await tx.appointment.create({
          data: {
            userId: data.userId,
            providerId: data.providerId,
            dateTime: appointmentDate,
            type: data.type as AppointmentType,
            status: AppointmentStatus.SCHEDULED,
            reason: data.reason || null,
            notes: null
          },
          include: {
            provider: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        });

        // Publish appointment creation event for gamification and notifications
        await this.publishAppointmentEventWithRetry(
          'care.appointment.created',
          {
            appointmentId: appointment.id,
            userId: appointment.userId,
            providerId: appointment.providerId,
            dateTime: appointment.dateTime,
            type: appointment.type,
            eventType: this.config.gamification.defaultEvents.appointmentBooked
          },
          appointment.id
        );

        this.logger.log(`Appointment created: ${appointment.id}`);
        return appointment;
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to create appointment: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        'Failed to create appointment',
        { data },
        error
      );
    }
  }

  /**
   * Updates an existing appointment.
   * 
   * @param id Appointment ID
   * @param data Updated appointment data
   * @returns The updated appointment
   */
  async update(id: string, data: UpdateAppointmentDto): Promise<IAppointment> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Check if appointment exists
        const existingAppointment = await this.findById(id);
        
        if (!existingAppointment) {
          throw new AppointmentNotFoundError(
            `Appointment with ID ${id} not found`,
            { id }
          );
        }

        // Check if the appointment is already completed or cancelled
        if (
          existingAppointment.status === AppointmentStatus.COMPLETED || 
          existingAppointment.status === AppointmentStatus.CANCELLED
        ) {
          throw new AppointmentProviderUnavailableError(
            `Cannot update a ${existingAppointment.status.toLowerCase()} appointment`,
            { id, status: existingAppointment.status }
          );
        }

        // If changing date/time, validate availability
        if (data.dateTime && data.dateTime !== existingAppointment.dateTime) {
          const newDateTime = new Date(data.dateTime);
          const now = new Date();
          
          // Check if the new date is in the future
          if (newDateTime < now) {
            throw new AppointmentDateInPastError(
              'Appointment date must be in the future',
              { dateTime: data.dateTime }
            );
          }

          // Check if the new date is within allowed rescheduling window
          const maxAdvanceDays = this.config.appointments.maxAdvanceDays;
          const maxAdvanceDate = new Date();
          maxAdvanceDate.setDate(maxAdvanceDate.getDate() + maxAdvanceDays);

          if (newDateTime > maxAdvanceDate) {
            throw new AppointmentDateInPastError(
              `Appointments can only be rescheduled up to ${maxAdvanceDays} days in advance`,
              { dateTime: data.dateTime, maxAdvanceDate }
            );
          }

          // Check for user appointment conflicts
          const hasConflict = await this.checkUserAppointmentConflict(
            existingAppointment.userId, 
            newDateTime
          );
          
          if (hasConflict) {
            throw new AppointmentOverlapError(
              'User already has an appointment scheduled at this time',
              { userId: existingAppointment.userId, dateTime: data.dateTime }
            );
          }

          // Check provider availability for the new time
          const isAvailable = await this.checkProviderAvailabilityWithRetry(
            existingAppointment.providerId, 
            newDateTime
          );

          if (!isAvailable) {
            throw new AppointmentProviderUnavailableError(
              `Provider is not available at the requested time`,
              { providerId: existingAppointment.providerId, dateTime: data.dateTime }
            );
          }
        }

        // If changing type to telemedicine, check if provider offers it
        if (
          data.type === AppointmentType.TELEMEDICINE && 
          existingAppointment.type !== AppointmentType.TELEMEDICINE
        ) {
          const provider = await this.getProviderWithRetry(existingAppointment.providerId);
          
          if (!provider.telemedicineAvailable) {
            throw new AppointmentProviderUnavailableError(
              `Provider does not offer telemedicine services`,
              { providerId: existingAppointment.providerId }
            );
          }
        }

        // Check if cancelling an appointment
        const isCancelling = data.status === AppointmentStatus.CANCELLED && 
                            existingAppointment.status !== AppointmentStatus.CANCELLED;

        // Apply cancellation policy if applicable
        let xpLoss = 0;
        if (isCancelling && this.config.appointments.cancellationPolicy.enabled) {
          const appointmentDate = new Date(existingAppointment.dateTime);
          const now = new Date();
          const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (hoursUntilAppointment < this.config.appointments.cancellationPolicy.minimumNoticeHours) {
            xpLoss = this.config.appointments.cancellationPolicy.penaltyXpLoss;
          }
        }

        // Update appointment
        const updatedAppointment = await tx.appointment.update({
          where: { id },
          data: {
            dateTime: data.dateTime,
            type: data.type,
            status: data.status,
            notes: data.notes
          },
          include: {
            provider: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        });

        // Publish event for appointment update
        const eventType = isCancelling ? 
          this.config.gamification.defaultEvents.appointmentCancelled : 
          'APPOINTMENT_UPDATED';

        await this.publishAppointmentEventWithRetry(
          'care.appointment.updated',
          {
            appointmentId: updatedAppointment.id,
            userId: updatedAppointment.userId,
            providerId: updatedAppointment.providerId,
            dateTime: updatedAppointment.dateTime,
            type: updatedAppointment.type,
            status: updatedAppointment.status,
            eventType,
            xpLoss
          },
          updatedAppointment.id
        );

        this.logger.log(`Appointment updated: ${id}`);
        return updatedAppointment;
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to update appointment: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to update appointment with ID ${id}`,
        { id, data },
        error
      );
    }
  }

  /**
   * Deletes an appointment.
   * Note: This is a soft delete operation that cancels the appointment instead of removing it.
   * 
   * @param id Appointment ID
   * @returns True if the appointment was successfully cancelled
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Check if appointment exists
      const existingAppointment = await this.findById(id);
      
      if (!existingAppointment) {
        throw new AppointmentNotFoundError(
          `Appointment with ID ${id} not found`,
          { id }
        );
      }

      // Cancel the appointment instead of deleting it
      await this.update(id, { status: AppointmentStatus.CANCELLED });
      
      this.logger.log(`Appointment cancelled: ${id}`);
      return true;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to delete appointment: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to delete appointment with ID ${id}`,
        { id },
        error
      );
    }
  }

  /**
   * Counts appointments based on filter criteria.
   * 
   * @param filter Filter criteria for appointments
   * @returns The count of matching appointments
   */
  async count(filter?: FilterDto): Promise<number> {
    try {
      const where = filter?.where || {};
      return await this.prisma.appointment.count({ where });
    } catch (error) {
      this.logger.error(`Failed to count appointments: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        'Failed to count appointments',
        { filter },
        error
      );
    }
  }

  /**
   * Marks an appointment as completed.
   * 
   * @param id Appointment ID
   * @returns The updated appointment
   */
  async completeAppointment(id: string): Promise<IAppointment> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Check if appointment exists
        const existingAppointment = await this.findById(id);
        
        if (!existingAppointment) {
          throw new AppointmentNotFoundError(
            `Appointment with ID ${id} not found`,
            { id }
          );
        }

        // Check if the appointment is already completed or cancelled
        if (
          existingAppointment.status === AppointmentStatus.COMPLETED || 
          existingAppointment.status === AppointmentStatus.CANCELLED
        ) {
          throw new AppointmentProviderUnavailableError(
            `Cannot complete a ${existingAppointment.status.toLowerCase()} appointment`,
            { id, status: existingAppointment.status }
          );
        }

        // Update appointment status
        const completedAppointment = await this.update(id, { 
          status: AppointmentStatus.COMPLETED 
        });

        // Publish event for appointment completion and gamification
        await this.publishAppointmentEventWithRetry(
          'care.appointment.completed',
          {
            appointmentId: completedAppointment.id,
            userId: completedAppointment.userId,
            providerId: completedAppointment.providerId,
            dateTime: completedAppointment.dateTime,
            type: completedAppointment.type,
            eventType: this.config.gamification.defaultEvents.appointmentAttended,
            xpReward: this.config.gamification.pointValues.appointmentAttended
          },
          completedAppointment.id
        );

        this.logger.log(`Appointment completed: ${id}`);
        return completedAppointment;
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to complete appointment: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to complete appointment with ID ${id}`,
        { id },
        error
      );
    }
  }

  /**
   * Gets upcoming appointments for a user.
   * 
   * @param userId User ID
   * @param pagination Pagination parameters
   * @returns Paginated list of upcoming appointments
   */
  async getUpcomingAppointments(userId: string, pagination?: PaginationDto): Promise<PaginatedResponse<IAppointment>> {
    try {
      const now = new Date();
      
      return this.findAll(pagination, {
        where: {
          userId,
          dateTime: { gte: now },
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] }
        },
        orderBy: { dateTime: 'asc' }
      });
    } catch (error) {
      this.logger.error(`Failed to get upcoming appointments: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to retrieve upcoming appointments for user ${userId}`,
        { userId, pagination },
        error
      );
    }
  }

  /**
   * Gets past appointments for a user.
   * 
   * @param userId User ID
   * @param pagination Pagination parameters
   * @returns Paginated list of past appointments
   */
  async getPastAppointments(userId: string, pagination?: PaginationDto): Promise<PaginatedResponse<IAppointment>> {
    try {
      const now = new Date();
      
      return this.findAll(pagination, {
        where: {
          userId,
          OR: [
            { dateTime: { lt: now } },
            { status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED] } }
          ]
        },
        orderBy: { dateTime: 'desc' }
      });
    } catch (error) {
      this.logger.error(`Failed to get past appointments: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to retrieve past appointments for user ${userId}`,
        { userId, pagination },
        error
      );
    }
  }

  /**
   * Confirms an appointment.
   * 
   * @param id Appointment ID
   * @returns The updated appointment
   */
  async confirmAppointment(id: string): Promise<IAppointment> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Check if appointment exists
        const existingAppointment = await this.findById(id);
        
        if (!existingAppointment) {
          throw new AppointmentNotFoundError(
            `Appointment with ID ${id} not found`,
            { id }
          );
        }

        // Check if the appointment is in a valid state for confirmation
        if (existingAppointment.status !== AppointmentStatus.SCHEDULED) {
          throw new AppointmentProviderUnavailableError(
            `Cannot confirm appointment with status ${existingAppointment.status}`,
            { id, status: existingAppointment.status }
          );
        }

        // Update appointment status
        const confirmedAppointment = await this.update(id, { 
          status: AppointmentStatus.CONFIRMED 
        });

        // Publish event for appointment confirmation
        await this.publishAppointmentEventWithRetry(
          'care.appointment.confirmed',
          {
            appointmentId: confirmedAppointment.id,
            userId: confirmedAppointment.userId,
            providerId: confirmedAppointment.providerId,
            dateTime: confirmedAppointment.dateTime,
            type: confirmedAppointment.type
          },
          confirmedAppointment.id
        );

        this.logger.log(`Appointment confirmed: ${id}`);
        return confirmedAppointment;
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to confirm appointment: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to confirm appointment with ID ${id}`,
        { id },
        error
      );
    }
  }

  /**
   * Initiates a telemedicine session for an appointment.
   * 
   * @param appointmentId Appointment ID
   * @param userId User ID initiating the session
   * @returns The created telemedicine session
   */
  @Resilient({
    retry: { maxAttempts: 3, delay: 1000, backoffFactor: 2 },
    circuitBreaker: { failureThreshold: 5, resetTimeout: 30000 },
    fallback: { handler: (appointmentId, userId) => {
      throw new AppointmentCalendarSyncError(
        'Telemedicine service is currently unavailable. Please try again later.',
        { appointmentId, userId }
      );
    }}
  })
  async startTelemedicineSession(appointmentId: string, userId: string): Promise<ITelemedicineSession> {
    try {
      // Check if appointment exists
      const appointment = await this.findById(appointmentId);
      
      if (!appointment) {
        throw new AppointmentNotFoundError(
          `Appointment with ID ${appointmentId} not found`,
          { appointmentId }
        );
      }

      // Check if the appointment is of type telemedicine
      if (appointment.type !== AppointmentType.TELEMEDICINE) {
        throw new AppointmentProviderUnavailableError(
          `Cannot start telemedicine session for non-telemedicine appointment`,
          { appointmentId, type: appointment.type }
        );
      }

      // Check if the user is either the patient or the provider
      if (appointment.userId !== userId && appointment.providerId !== userId) {
        throw new AppointmentProviderUnavailableError(
          `User ${userId} is not authorized for this appointment`,
          { appointmentId, userId }
        );
      }

      // Create telemedicine session using the telemedicine service
      const session = await this.startTelemedicineSessionWithRetry({
        userId,
        appointmentId,
        providerId: appointment.providerId
      });

      this.logger.log(`Telemedicine session started for appointment: ${appointmentId}`);
      return session;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to start telemedicine session: ${error.message}`, error.stack);
      throw new AppointmentCalendarSyncError(
        `Failed to start telemedicine session for appointment ${appointmentId}`,
        { appointmentId, userId },
        error
      );
    }
  }

  /**
   * Checks for appointment conflicts for a user.
   * 
   * @param userId User ID
   * @param dateTime Proposed appointment date and time
   * @returns True if a conflict exists
   */
  async checkUserAppointmentConflict(userId: string, dateTime: Date): Promise<boolean> {
    try {
      const proposedTime = new Date(dateTime);
      
      // Check for existing appointments within a buffer time (e.g., 1 hour before and after)
      const bufferMinutes = this.config.appointments.availabilityBuffer;
      const startTime = new Date(proposedTime.getTime() - bufferMinutes * 60000);
      const endTime = new Date(proposedTime.getTime() + bufferMinutes * 60000);
      
      const conflictingAppointments = await this.prisma.appointment.findMany({
        where: {
          userId,
          dateTime: {
            gte: startTime,
            lte: endTime
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
          }
        }
      });
      
      return conflictingAppointments.length > 0;
    } catch (error) {
      this.logger.error(`Failed to check appointment conflict: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to check appointment conflict for user ${userId}`,
        { userId, dateTime },
        error
      );
    }
  }

  /**
   * Gets appointments for a provider.
   * 
   * @param providerId Provider ID
   * @param pagination Pagination parameters
   * @param filter Filter criteria
   * @returns Paginated list of provider appointments
   */
  async getProviderAppointments(
    providerId: string, 
    pagination?: PaginationDto, 
    filter?: FilterDto
  ): Promise<PaginatedResponse<IAppointment>> {
    try {
      const providerFilter = {
        ...filter,
        where: {
          ...filter?.where,
          providerId
        }
      };
      
      return this.findAll(pagination, providerFilter);
    } catch (error) {
      this.logger.error(`Failed to get provider appointments: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to retrieve appointments for provider ${providerId}`,
        { providerId, pagination, filter },
        error
      );
    }
  }

  /**
   * Gets today's appointments for a provider.
   * 
   * @param providerId Provider ID
   * @returns List of today's appointments
   */
  async getProviderTodayAppointments(providerId: string): Promise<IAppointment[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await this.findAll(
        { limit: 100 }, // Higher limit to get all of today's appointments
        {
          where: {
            providerId,
            dateTime: {
              gte: today,
              lt: tomorrow
            },
            status: {
              in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
            }
          },
          orderBy: { dateTime: 'asc' }
        }
      );
      
      return result.data;
    } catch (error) {
      this.logger.error(`Failed to get provider's today appointments: ${error.message}`, error.stack);
      throw new AppointmentPersistenceError(
        `Failed to retrieve today's appointments for provider ${providerId}`,
        { providerId },
        error
      );
    }
  }

  /**
   * Helper method to get a provider with retry logic.
   * 
   * @param providerId Provider ID
   * @returns The provider
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    delay: 500,
    backoffFactor: 2,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL]
  })
  private async getProviderWithRetry(providerId: string): Promise<any> {
    return this.providersService.findById(providerId);
  }

  /**
   * Helper method to check provider availability with retry logic.
   * 
   * @param providerId Provider ID
   * @param dateTime Date and time to check
   * @returns True if the provider is available
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    delay: 500,
    backoffFactor: 2,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL]
  })
  private async checkProviderAvailabilityWithRetry(providerId: string, dateTime: Date): Promise<boolean> {
    return this.providersService.checkAvailability(providerId, dateTime);
  }

  /**
   * Helper method to start a telemedicine session with retry logic.
   * 
   * @param data Session data
   * @returns The created telemedicine session
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    delay: 1000,
    backoffFactor: 2,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL]
  })
  private async startTelemedicineSessionWithRetry(data: { userId: string; appointmentId: string; providerId: string }): Promise<ITelemedicineSession> {
    return this.telemedicineService.startTelemedicineSession(data);
  }

  /**
   * Helper method to publish appointment events with retry logic.
   * 
   * @param topic Kafka topic
   * @param payload Event payload
   * @param key Message key
   */
  @RetryWithBackoff({
    maxAttempts: 5,
    delay: 200,
    backoffFactor: 1.5,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL]
  })
  @WithCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 10000,
    fallbackHandler: () => Promise.resolve() // Silent fallback to prevent blocking user operations
  })
  private async publishAppointmentEventWithRetry(topic: string, payload: any, key: string): Promise<void> {
    await this.kafkaService.produce(topic, payload, key);
  }
}