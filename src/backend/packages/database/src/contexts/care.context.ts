/**
 * @file care.context.ts
 * @description Specialized database context for the Care journey ("Cuidar-me Agora") that extends
 * the base journey context with care-specific database operations. It provides optimized methods for
 * appointments, providers, medications, treatments, and telemedicine sessions with care-specific
 * transaction management and error handling.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';

import { BaseJourneyContext } from './base-journey.context';
import { DatabaseContextConfig, DEFAULT_CARE_CONTEXT_CONFIG, CareDatabaseContext } from '../types/context.types';
import { TransactionOptions, TransactionIsolationLevel } from '../types/transaction.types';
import { DatabaseErrorType } from '../errors/database-error.types';
import { DatabaseException } from '../errors/database-error.exception';
import { RetryStrategy } from '../errors/retry-strategies';
import { ConnectionManager } from '../connection/connection-manager';

// Import Care journey interfaces
import {
  IAppointment,
  AppointmentStatus,
  AppointmentType,
  IProvider,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan
} from '@austa/interfaces/journey/care';

/**
 * Enum defining the journey types in the AUSTA SuperApp.
 * This is used to identify which journey a database context belongs to.
 */
export enum JourneyType {
  /** Health journey ("Minha Saúde") */
  HEALTH = 'health',
  
  /** Care journey ("Cuidar-me Agora") */
  CARE = 'care',
  
  /** Plan journey ("Meu Plano & Benefícios") */
  PLAN = 'plan'
}

/**
 * Specialized database context for the Care journey ("Cuidar-me Agora")
 * Provides optimized methods for appointments, providers, medications, treatments,
 * and telemedicine sessions with care-specific transaction management and error handling.
 */
@Injectable()
export class CareContext extends BaseJourneyContext implements CareDatabaseContext {
  private readonly logger = new Logger(CareContext.name);

  /**
   * Creates a new Care journey database context
   * @param connectionManager Connection manager for database connections
   * @param config Configuration options for this context
   */
  constructor(
    connectionManager: ConnectionManager,
    config: Partial<DatabaseContextConfig> = {}
  ) {
    super(
      connectionManager,
      {
        ...DEFAULT_CARE_CONTEXT_CONFIG,
        ...config,
        journey: {
          journeyType: JourneyType.CARE,
          options: {
            ...DEFAULT_CARE_CONTEXT_CONFIG.journey?.options,
            ...config.journey?.options,
          },
        },
      }
    );

    this.logger.log('Care journey database context initialized');
  }

  /**
   * Get the journey type for this context
   * @returns The journey type (CARE)
   */
  get journeyType(): JourneyType {
    return JourneyType.CARE;
  }

  /**
   * Find available appointment slots for a provider within a date range
   * @param providerId Provider ID
   * @param startDate Start date for availability search
   * @param endDate End date for availability search
   * @param specialtyId Optional specialty ID
   * @returns Available appointment slots
   * @throws DatabaseException if the query fails
   */
  async findAvailableAppointmentSlots(
    providerId: string,
    startDate: Date,
    endDate: Date,
    specialtyId?: string
  ): Promise<any[]> {
    return this.executeJourneyOperation<any[]>(
      'findAvailableAppointmentSlots',
      async () => {
        const prisma = this.getPrismaClient();
        
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

        if (startDate > endDate) {
          throw new DatabaseException(
            'Start date must be before end date',
            DatabaseErrorType.VALIDATION,
            { startDate, endDate }
          );
        }

        // Get provider's schedule
        const provider = await prisma.provider.findUnique({
          where: { id: providerId },
          include: {
            schedule: true,
          },
        });

        if (!provider) {
          throw new DatabaseException(
            `Provider not found with ID ${providerId}`,
            DatabaseErrorType.NOT_FOUND,
            { providerId }
          );
        }

        // Get existing appointments for the provider in the date range
        const existingAppointments = await prisma.appointment.findMany({
          where: {
            providerId,
            dateTime: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              not: AppointmentStatus.CANCELLED,
            },
          },
          select: {
            dateTime: true,
            type: true,
          },
        });

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
      },
      {
        // Cache appointment slots for faster access
        journeyContext: { useJourneyCaching: true },
      }
    );
  }

  /**
   * Book an appointment with optimized transaction handling
   * @param userId User ID
   * @param providerId Provider ID
   * @param startTime Appointment start time
   * @param endTime Appointment end time
   * @param appointmentType Type of appointment
   * @param notes Additional notes
   * @returns The booked appointment
   * @throws DatabaseException if the booking fails
   */
  async bookAppointment(
    userId: string,
    providerId: string,
    startTime: Date,
    endTime: Date,
    appointmentType: string,
    notes?: string
  ): Promise<IAppointment> {
    return this.executeJourneyOperation<IAppointment>(
      'bookAppointment',
      async () => {
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

        // Use a transaction with serializable isolation to prevent double-booking
        return this.transaction<IAppointment>(async (tx) => {
          // Check if the provider exists
          const provider = await tx.provider.findUnique({
            where: { id: providerId },
          });

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
          const existingAppointment = await tx.appointment.findFirst({
            where: {
              providerId,
              dateTime: startTime,
              status: {
                not: AppointmentStatus.CANCELLED,
              },
            },
          });

          if (existingAppointment) {
            throw new DatabaseException(
              `Appointment slot is already booked`,
              DatabaseErrorType.CONFLICT,
              { providerId, startTime }
            );
          }

          // Create the appointment
          const appointment = await tx.appointment.create({
            data: {
              userId,
              providerId,
              dateTime: startTime,
              type: appointmentType as AppointmentType,
              status: AppointmentStatus.SCHEDULED,
              notes: notes || '',
            },
          });

          // If it's a telemedicine appointment, create a telemedicine session
          if (appointmentType === AppointmentType.TELEMEDICINE) {
            await tx.telemedicineSession.create({
              data: {
                appointmentId: appointment.id,
                patientId: userId,
                providerId,
                startTime,
                status: 'scheduled',
              },
            });
          }

          // Send journey event for appointment booking
          await this.sendJourneyEvent(
            'APPOINTMENT_BOOKED',
            userId,
            {
              appointmentId: appointment.id,
              providerId,
              appointmentType,
              startTime,
            }
          );

          return appointment as unknown as IAppointment;
        }, {
          // Use serializable isolation for appointment booking to prevent conflicts
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
          // Configure timeout for appointment booking
          timeout: {
            timeoutMs: 30000, // 30 seconds
          },
          // Configure retry options for appointment booking
          retry: {
            maxRetries: 3,
            baseDelayMs: 500,
          },
        });
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'appointment_booking',
          priority: 'high',
        },
      }
    );
  }

  /**
   * Get medication adherence data for a user within a date range
   * @param userId User ID
   * @param startDate Start date for adherence data
   * @param endDate End date for adherence data
   * @returns Medication adherence data
   * @throws DatabaseException if the query fails
   */
  async getMedicationAdherence(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return this.executeJourneyOperation<any>(
      'getMedicationAdherence',
      async () => {
        const prisma = this.getPrismaClient();

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
        const medications = await prisma.medication.findMany({
          where: {
            userId,
            active: true,
            startDate: {
              lte: endDate, // Medication started before or during the period
            },
            OR: [
              { endDate: null }, // No end date
              { endDate: { gte: startDate } }, // End date after or during the period
            ],
          },
          include: {
            intakes: {
              where: {
                intakeTime: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        });

        // Calculate adherence for each medication
        const adherenceData = medications.map((medication) => {
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

          // Actual intakes recorded
          const actualIntakes = medication.intakes.length;

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
            intakes: medication.intakes.map(intake => ({
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

        // Send journey event for medication adherence check
        await this.sendJourneyEvent(
          'MEDICATION_ADHERENCE_CHECKED',
          userId,
          {
            overallAdherence,
            medicationCount: medications.length,
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
      },
      {
        // Cache adherence data for faster access
        journeyContext: { useJourneyCaching: true },
      }
    );
  }

  /**
   * Record medication intake with validation
   * @param userId User ID
   * @param medicationId Medication ID
   * @param intakeTime Time of intake
   * @param dosage Dosage taken
   * @param notes Additional notes
   * @returns The recorded medication intake
   * @throws DatabaseException if the operation fails
   */
  async recordMedicationIntake(
    userId: string,
    medicationId: string,
    intakeTime: Date,
    dosage: number,
    notes?: string
  ): Promise<any> {
    return this.executeJourneyOperation<any>(
      'recordMedicationIntake',
      async () => {
        const prisma = this.getPrismaClient();

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
        const medication = await prisma.medication.findFirst({
          where: {
            id: medicationId,
            userId,
          },
        });

        if (!medication) {
          throw new DatabaseException(
            `Medication not found with ID ${medicationId} for user ${userId}`,
            DatabaseErrorType.NOT_FOUND,
            { medicationId, userId }
          );
        }

        // Record the intake
        const intake = await prisma.medicationIntake.create({
          data: {
            medicationId,
            userId,
            intakeTime,
            dosage,
            notes: notes || '',
          },
        });

        // Send journey event for medication intake
        await this.sendJourneyEvent(
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
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'medication_intake',
          priority: 'medium',
        },
      }
    );
  }

  /**
   * Find healthcare providers based on various criteria
   * @param specialtyId Specialty ID
   * @param location Location coordinates or address
   * @param maxDistance Maximum distance in kilometers
   * @param filters Additional filters
   * @returns Matching healthcare providers
   * @throws DatabaseException if the query fails
   */
  async findProviders(
    specialtyId?: string,
    location?: { lat: number; lng: number } | string,
    maxDistance?: number,
    filters?: Record<string, any>
  ): Promise<IProvider[]> {
    return this.executeJourneyOperation<IProvider[]>(
      'findProviders',
      async () => {
        const prisma = this.getPrismaClient();

        // Build the query
        const query: Prisma.ProviderFindManyArgs = {
          where: {
            // Filter by specialty if provided
            ...(specialtyId ? { specialty: specialtyId } : {}),
            
            // Apply additional filters if provided
            ...(filters ? {
              ...(filters.telemedicineAvailable !== undefined ? { telemedicineAvailable: filters.telemedicineAvailable } : {}),
              ...(filters.name ? { name: { contains: filters.name, mode: 'insensitive' } } : {}),
            } : {}),
          },
          orderBy: {
            name: 'asc',
          },
        };

        // Execute the query
        const providers = await prisma.provider.findMany(query);

        // If location is provided, filter and sort by distance
        if (location && maxDistance) {
          // This is a simplified implementation
          // In a real-world scenario, this would use geospatial queries
          // For now, we'll just return all providers and assume they're within range
          return providers as unknown as IProvider[];
        }

        return providers as unknown as IProvider[];
      },
      {
        // Cache provider search results
        journeyContext: { useJourneyCaching: true },
      }
    );
  }

  /**
   * Create or update a treatment plan with transaction safety
   * @param userId User ID
   * @param providerId Provider ID
   * @param diagnosis Diagnosis information
   * @param treatments Treatment details
   * @param startDate Start date of the treatment plan
   * @param endDate End date of the treatment plan
   * @returns The created or updated treatment plan
   * @throws DatabaseException if the operation fails
   */
  async upsertTreatmentPlan(
    userId: string,
    providerId: string,
    diagnosis: Record<string, any>,
    treatments: Record<string, any>[],
    startDate: Date,
    endDate?: Date
  ): Promise<ITreatmentPlan> {
    return this.executeJourneyOperation<ITreatmentPlan>(
      'upsertTreatmentPlan',
      async () => {
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

        // Use a transaction to ensure data consistency
        return this.transaction<ITreatmentPlan>(async (tx) => {
          // Check if the provider exists
          const provider = await tx.provider.findUnique({
            where: { id: providerId },
          });

          if (!provider) {
            throw new DatabaseException(
              `Provider not found with ID ${providerId}`,
              DatabaseErrorType.NOT_FOUND,
              { providerId }
            );
          }

          // Create or update the care activity
          const careActivity = await tx.careActivity.upsert({
            where: {
              userId_providerId: {
                userId,
                providerId,
              },
            },
            update: {
              diagnosis: diagnosis,
              lastUpdated: new Date(),
            },
            create: {
              userId,
              providerId,
              diagnosis: diagnosis,
              type: 'treatment',
              status: 'active',
              lastUpdated: new Date(),
            },
          });

          // Create or update the treatment plan
          const treatmentPlan = await tx.treatmentPlan.upsert({
            where: {
              careActivityId: careActivity.id,
            },
            update: {
              name: `Treatment Plan for ${diagnosis.condition || 'Condition'}`,
              description: diagnosis.notes,
              startDate,
              endDate,
              progress: 0, // Reset progress on update
              lastUpdated: new Date(),
            },
            create: {
              careActivityId: careActivity.id,
              name: `Treatment Plan for ${diagnosis.condition || 'Condition'}`,
              description: diagnosis.notes,
              startDate,
              endDate,
              progress: 0,
              lastUpdated: new Date(),
            },
          });

          // Create or update treatment items
          await Promise.all(
            treatments.map(async (treatment) => {
              return tx.treatmentItem.upsert({
                where: {
                  treatmentPlanId_name: {
                    treatmentPlanId: treatmentPlan.id,
                    name: treatment.name,
                  },
                },
                update: {
                  description: treatment.description,
                  frequency: treatment.frequency,
                  duration: treatment.duration,
                  instructions: treatment.instructions,
                  status: 'active',
                  lastUpdated: new Date(),
                },
                create: {
                  treatmentPlanId: treatmentPlan.id,
                  name: treatment.name,
                  description: treatment.description,
                  frequency: treatment.frequency,
                  duration: treatment.duration,
                  instructions: treatment.instructions,
                  status: 'active',
                  lastUpdated: new Date(),
                },
              });
            })
          );

          // Send journey event for treatment plan creation/update
          await this.sendJourneyEvent(
            'TREATMENT_PLAN_UPDATED',
            userId,
            {
              treatmentPlanId: treatmentPlan.id,
              providerId,
              diagnosis: diagnosis.condition,
              treatmentCount: treatments.length,
            }
          );

          // Return the treatment plan with care activity
          return {
            id: treatmentPlan.id,
            name: treatmentPlan.name,
            description: treatmentPlan.description,
            startDate: treatmentPlan.startDate,
            endDate: treatmentPlan.endDate,
            progress: treatmentPlan.progress,
            careActivity: careActivity as any,
            createdAt: treatmentPlan.createdAt,
            updatedAt: treatmentPlan.lastUpdated,
          } as unknown as ITreatmentPlan;
        }, {
          // Use serializable isolation for treatment plan creation/update
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
          // Configure timeout for treatment plan creation/update
          timeout: {
            timeoutMs: 30000, // 30 seconds
          },
        });
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'treatment_plan_management',
          priority: 'high',
        },
      }
    );
  }

  /**
   * Track progress for a treatment plan
   * @param treatmentPlanId Treatment plan ID
   * @param progressData Progress data
   * @param recordedAt Time when progress was recorded
   * @returns The updated treatment progress
   * @throws DatabaseException if the operation fails
   */
  async trackTreatmentProgress(
    treatmentPlanId: string,
    progressData: Record<string, any>,
    recordedAt?: Date
  ): Promise<any> {
    return this.executeJourneyOperation<any>(
      'trackTreatmentProgress',
      async () => {
        const prisma = this.getPrismaClient();

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
        const treatmentPlan = await prisma.treatmentPlan.findUnique({
          where: { id: treatmentPlanId },
          include: {
            careActivity: true,
            items: true,
          },
        });

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

          const progressRecord = await prisma.treatmentProgress.create({
            data: {
              treatmentItemId: itemId,
              treatmentPlanId,
              userId: treatmentPlan.careActivity.userId,
              status: progressData[itemId].status || 'completed',
              notes: progressData[itemId].notes || '',
              recordedAt: timestamp,
            },
          });

          progressRecords.push(progressRecord);
        }

        // Calculate overall progress
        const totalItems = treatmentPlan.items.length;
        const completedItems = await prisma.treatmentItem.count({
          where: {
            treatmentPlanId,
            progress: {
              some: {
                status: 'completed',
              },
            },
          },
        });

        const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Update the treatment plan progress
        await prisma.treatmentPlan.update({
          where: { id: treatmentPlanId },
          data: {
            progress: overallProgress,
            lastUpdated: timestamp,
          },
        });

        // Send journey event for treatment progress update
        await this.sendJourneyEvent(
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
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'treatment_progress',
          priority: 'medium',
        },
      }
    );
  }

  /**
   * Create a telemedicine session with validation
   * @param userId User ID
   * @param providerId Provider ID
   * @param scheduledTime Scheduled time for the session
   * @param sessionType Type of telemedicine session
   * @param metadata Additional metadata
   * @returns The created telemedicine session
   * @throws DatabaseException if the operation fails
   */
  async createTelemedicineSession(
    userId: string,
    providerId: string,
    scheduledTime: Date,
    sessionType: string,
    metadata?: Record<string, any>
  ): Promise<ITelemedicineSession> {
    return this.executeJourneyOperation<ITelemedicineSession>(
      'createTelemedicineSession',
      async () => {
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

        // Use a transaction to ensure data consistency
        return this.transaction<ITelemedicineSession>(async (tx) => {
          // Check if the provider exists and supports telemedicine
          const provider = await tx.provider.findUnique({
            where: { id: providerId },
          });

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
          const appointment = await tx.appointment.create({
            data: {
              userId,
              providerId,
              dateTime: scheduledTime,
              type: AppointmentType.TELEMEDICINE,
              status: AppointmentStatus.SCHEDULED,
              notes: metadata?.notes || '',
            },
          });

          // Create the telemedicine session
          const session = await tx.telemedicineSession.create({
            data: {
              appointmentId: appointment.id,
              patientId: userId,
              providerId,
              startTime: scheduledTime,
              status: 'scheduled',
              sessionType: sessionType || 'standard',
              metadata: metadata || {},
            },
          });

          // Generate a session URL (simplified implementation)
          const sessionUrl = `https://telemedicine.austa.app/session/${session.id}`;

          // Update the session with the URL
          await tx.telemedicineSession.update({
            where: { id: session.id },
            data: {
              metadata: {
                ...metadata,
                sessionUrl,
              },
            },
          });

          // Send journey event for telemedicine session creation
          await this.sendJourneyEvent(
            'TELEMEDICINE_SESSION_CREATED',
            userId,
            {
              sessionId: session.id,
              appointmentId: appointment.id,
              providerId,
              scheduledTime,
              sessionType,
            }
          );

          return {
            id: session.id,
            appointmentId: appointment.id,
            appointment: appointment as any,
            patientId: userId,
            providerId,
            startTime: scheduledTime,
            status: 'scheduled',
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          } as unknown as ITelemedicineSession;
        }, {
          // Use serializable isolation for telemedicine session creation
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
          // Configure timeout for telemedicine session creation
          timeout: {
            timeoutMs: 30000, // 30 seconds
          },
        });
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'telemedicine_session_creation',
          priority: 'high',
        },
      }
    );
  }

  /**
   * Update telemedicine session status with validation
   * @param sessionId Session ID
   * @param status New status
   * @param metadata Additional metadata
   * @returns The updated telemedicine session
   * @throws DatabaseException if the operation fails
   */
  async updateTelemedicineSessionStatus(
    sessionId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<ITelemedicineSession> {
    return this.executeJourneyOperation<ITelemedicineSession>(
      'updateTelemedicineSessionStatus',
      async () => {
        const prisma = this.getPrismaClient();

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
        const session = await prisma.telemedicineSession.findUnique({
          where: { id: sessionId },
          include: {
            appointment: true,
          },
        });

        if (!session) {
          throw new DatabaseException(
            `Telemedicine session not found with ID ${sessionId}`,
            DatabaseErrorType.NOT_FOUND,
            { sessionId }
          );
        }

        // Update the session status
        const updatedSession = await prisma.telemedicineSession.update({
          where: { id: sessionId },
          data: {
            status,
            metadata: metadata ? { ...session.metadata, ...metadata } : session.metadata,
            endTime: status === 'completed' ? new Date() : session.endTime,
          },
        });

        // Update the appointment status if needed
        if (status === 'completed' || status === 'cancelled' || status === 'no-show') {
          const appointmentStatus = status === 'completed'
            ? AppointmentStatus.COMPLETED
            : AppointmentStatus.CANCELLED;

          await prisma.appointment.update({
            where: { id: session.appointmentId },
            data: {
              status: appointmentStatus,
            },
          });
        }

        // Send journey event for telemedicine session status update
        await this.sendJourneyEvent(
          'TELEMEDICINE_SESSION_UPDATED',
          session.patientId,
          {
            sessionId,
            appointmentId: session.appointmentId,
            providerId: session.providerId,
            status,
            previousStatus: session.status,
          }
        );

        return {
          id: updatedSession.id,
          appointmentId: updatedSession.appointmentId,
          appointment: session.appointment as any,
          patientId: updatedSession.patientId,
          providerId: updatedSession.providerId,
          startTime: updatedSession.startTime,
          endTime: updatedSession.endTime,
          status: updatedSession.status,
          createdAt: updatedSession.createdAt,
          updatedAt: updatedSession.updatedAt,
        } as unknown as ITelemedicineSession;
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'telemedicine_session_update',
          priority: 'high',
        },
      }
    );
  }

  /**
   * Process symptom checker input and provide recommendations
   * @param userId User ID
   * @param symptoms Reported symptoms
   * @param demographics User demographics
   * @param medicalHistory Medical history information
   * @returns Symptom checker results
   * @throws DatabaseException if the operation fails
   */
  async processSymptomCheckerInput(
    userId: string,
    symptoms: Record<string, any>[],
    demographics: Record<string, any>,
    medicalHistory?: Record<string, any>
  ): Promise<any> {
    return this.executeJourneyOperation<any>(
      'processSymptomCheckerInput',
      async () => {
        const prisma = this.getPrismaClient();

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
        const session = await prisma.symptomCheckerSession.create({
          data: {
            userId,
            symptoms,
            demographics,
            medicalHistory: medicalHistory || {},
            status: 'completed',
            timestamp: new Date(),
          },
        });

        // This is a simplified implementation
        // In a real-world scenario, this would use a medical knowledge base or AI service
        // to analyze symptoms and provide recommendations

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
        const providers = await prisma.provider.findMany({
          where: {
            specialty: {
              in: relevantSpecialties,
            },
            telemedicineAvailable: true,
          },
          take: 3,
        });

        // Generate self-care recommendations
        const selfCareRecommendations = this.generateSelfCareRecommendations(symptoms);

        // Store the results
        const results = {
          sessionId: session.id,
          urgency,
          careOptions,
          recommendedProviders: providers.map(p => ({
            id: p.id,
            name: p.name,
            specialty: p.specialty,
            telemedicineAvailable: p.telemedicineAvailable,
          })),
          selfCareRecommendations,
          disclaimer: 'This is not medical advice. Please consult with a healthcare professional for proper diagnosis and treatment.',
        };

        // Update the session with results
        await prisma.symptomCheckerSession.update({
          where: { id: session.id },
          data: {
            results,
          },
        });

        // Send journey event for symptom checker usage
        await this.sendJourneyEvent(
          'SYMPTOM_CHECKER_USED',
          userId,
          {
            sessionId: session.id,
            symptomCount: symptoms.length,
            urgency,
          }
        );

        return results;
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'symptom_checker',
          priority: 'high',
        },
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
    // In a real-world scenario, this would use a medical knowledge base
    const specialtyMap: Record<string, string[]> = {
      'headache': ['neurology', 'general practice'],
      'chest pain': ['cardiology', 'emergency medicine'],
      'abdominal pain': ['gastroenterology', 'general practice'],
      'fever': ['infectious disease', 'general practice'],
      'cough': ['pulmonology', 'general practice'],
      'rash': ['dermatology', 'general practice'],
      'joint pain': ['rheumatology', 'orthopedics'],
      'back pain': ['orthopedics', 'neurology', 'physical therapy'],
      'dizziness': ['neurology', 'otolaryngology'],
      'fatigue': ['internal medicine', 'endocrinology'],
    };

    // Collect all relevant specialties based on symptoms
    const specialties = new Set<string>();
    specialties.add('general practice'); // Always include general practice

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
    // In a real-world scenario, this would use a medical knowledge base
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
   * Validate journey-specific data against schema
   * @param dataType Type of data to validate
   * @param data Data to validate
   * @returns Validation result with errors if any
   */
  async validateJourneyData(
    dataType: string,
    data: Record<string, any>
  ): Promise<{ valid: boolean; errors?: any[] }> {
    // This is a simplified implementation
    // In a real-world scenario, this would use a validation library like Zod or class-validator
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

  /**
   * Get journey-specific metrics for monitoring and observability
   * @returns Journey-specific metrics
   */
  async getJourneyMetrics(): Promise<Record<string, any>> {
    const prisma = this.getPrismaClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get appointment metrics
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get recent appointments
    const recentAppointmentsCount = await prisma.appointment.count({
      where: {
        dateTime: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get medication adherence metrics
    const activeMedicationsCount = await prisma.medication.count({
      where: {
        active: true,
      },
    });

    // Get telemedicine metrics
    const telemedicineSessionsByStatus = await prisma.telemedicineSession.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get provider metrics
    const providersCount = await prisma.provider.count();
    const telemedicineProvidersCount = await prisma.provider.count({
      where: {
        telemedicineAvailable: true,
      },
    });

    return {
      appointmentsByStatus: appointmentsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentAppointmentsCount,
      activeMedicationsCount,
      telemedicineSessionsByStatus: telemedicineSessionsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      providersCount,
      telemedicineProvidersCount,
      telemedicineProviderPercentage: providersCount > 0
        ? Math.round((telemedicineProvidersCount / providersCount) * 100)
        : 0,
      timestamp: now,
    };
  }

  /**
   * Send a journey-specific event to the gamification engine
   * @param eventType Type of journey event
   * @param userId User ID
   * @param payload Event payload
   * @throws DatabaseException if event sending fails
   */
  async sendJourneyEvent(
    eventType: string,
    userId: string,
    payload: Record<string, any>
  ): Promise<void> {
    try {
      this.logger.debug(`Sending journey event: ${eventType}`, { userId, ...payload });

      // Prepare the event with journey context
      const event = {
        eventType,
        userId,
        journeyId: JourneyType.CARE,
        timestamp: new Date().toISOString(),
        payload,
      };

      // In a real implementation, this would publish to Kafka or another event system
      // For now, we'll just log the event
      this.logger.log(`[CARE_JOURNEY_EVENT] ${eventType}`, event);

      // Simulate sending to gamification engine
      await this.sendDatabaseEvent('journey_event', event);
    } catch (error) {
      this.logger.error(`Failed to send journey event: ${eventType}`, error);
      // Don't throw here to prevent operation failure due to event sending issues
      // Just log the error and continue
    }
  }

  /**
   * Get journey-specific configuration
   * @returns Journey-specific configuration options
   */
  getJourneyConfig(): Record<string, any> {
    return this.config.journey?.options || {};
  }
}