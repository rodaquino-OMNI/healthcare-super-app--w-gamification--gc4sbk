/**
 * Care Journey GraphQL Resolvers
 * 
 * This file defines the GraphQL resolvers for the Care Journey, including
 * appointment booking, provider search, telemedicine sessions, and care plan management.
 * It implements enhanced error handling with fallback strategies and improved validation.
 */
import { Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';

// Use standardized module resolution with path aliases
import { AppointmentsService } from '@app/care/appointments/appointments.service';
import { ProvidersService } from '@app/care/providers/providers.service';
import { TelemedicineService } from '@app/care/telemedicine/telemedicine.service';

// Import interfaces from @austa/interfaces package for type safety
import {
  IAppointment,
  AppointmentType,
  AppointmentStatus,
  IProvider,
  ITelemedicineSession
} from '@austa/interfaces/journey/care';

// Import shared error handling utilities
import { ErrorType, AppException } from '@app/shared/exceptions/exceptions.types';

/**
 * Factory function that creates and returns the Care Journey resolvers
 * 
 * @param appointmentsService - The appointments service instance
 * @returns Object containing Query and Mutation resolvers for the Care Journey
 */
export const careResolvers = (appointmentsService: AppointmentsService) => {
  // Initialize logger
  const logger = new Logger('CareResolvers');

  // Create provider service instance for fallback strategies
  const providersService = new ProvidersService();
  const telemedicineService = new TelemedicineService();

  return {
    Query: {
      /**
       * Get an appointment by ID
       * 
       * @param _ - Parent resolver
       * @param args - Contains the appointment ID
       * @param context - GraphQL context containing user information
       * @returns The requested appointment
       */
      appointment: async (_: any, args: { id: string }, context: any): Promise<IAppointment> => {
        try {
          const { id } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          const appointment = await appointmentsService.findById(id);

          if (!appointment) {
            throw new GraphQLError(`Appointment with ID ${id} not found`, {
              extensions: {
                code: 'NOT_FOUND',
                http: { status: 404 }
              }
            });
          }

          // Check if user is authorized to view this appointment
          if (appointment.userId !== user.id && appointment.providerId !== user.id) {
            throw new GraphQLError('Not authorized to view this appointment', {
              extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 }
              }
            });
          }

          return appointment;
        } catch (error) {
          logger.error(`Error fetching appointment: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to fetch appointment', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Get upcoming appointments for the current user
       * 
       * @param _ - Parent resolver
       * @param args - Contains pagination parameters
       * @param context - GraphQL context containing user information
       * @returns Paginated list of upcoming appointments
       */
      upcomingAppointments: async (_: any, args: { page?: number, limit?: number }, context: any) => {
        try {
          const { page = 1, limit = 10 } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          const result = await appointmentsService.getUpcomingAppointments(
            user.id,
            { page, limit }
          );

          return result;
        } catch (error) {
          logger.error(`Error fetching upcoming appointments: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to fetch upcoming appointments', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Get past appointments for the current user
       * 
       * @param _ - Parent resolver
       * @param args - Contains pagination parameters
       * @param context - GraphQL context containing user information
       * @returns Paginated list of past appointments
       */
      pastAppointments: async (_: any, args: { page?: number, limit?: number }, context: any) => {
        try {
          const { page = 1, limit = 10 } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          const result = await appointmentsService.getPastAppointments(
            user.id,
            { page, limit }
          );

          return result;
        } catch (error) {
          logger.error(`Error fetching past appointments: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to fetch past appointments', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Get available providers based on search criteria
       * 
       * @param _ - Parent resolver
       * @param args - Contains search parameters
       * @param context - GraphQL context containing user information
       * @returns List of providers matching the search criteria
       */
      availableProviders: async (_: any, args: { specialty?: string, date?: string, type?: AppointmentType }, context: any) => {
        try {
          const { specialty, date, type } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          // Implement fallback strategy for provider availability
          try {
            const providers = await providersService.findAvailableProviders({
              specialty,
              date: date ? new Date(date) : undefined,
              type
            });

            return providers;
          } catch (error) {
            logger.warn(`Primary provider search failed, using fallback: ${error.message}`);
            
            // Fallback strategy: Get all providers and filter client-side
            const allProviders = await providersService.findAll();
            
            // Filter by specialty if provided
            let filteredProviders = allProviders.data;
            if (specialty) {
              filteredProviders = filteredProviders.filter(provider => 
                provider.specialty.toLowerCase().includes(specialty.toLowerCase())
              );
            }
            
            // Filter by appointment type if provided
            if (type === AppointmentType.TELEMEDICINE) {
              filteredProviders = filteredProviders.filter(provider => 
                provider.telemedicineAvailable
              );
            }
            
            return {
              data: filteredProviders,
              meta: {
                currentPage: 1,
                itemsPerPage: filteredProviders.length,
                totalItems: filteredProviders.length,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false
              }
            };
          }
        } catch (error) {
          logger.error(`Error fetching available providers: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to fetch available providers', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Get provider details by ID
       * 
       * @param _ - Parent resolver
       * @param args - Contains the provider ID
       * @param context - GraphQL context containing user information
       * @returns The requested provider
       */
      provider: async (_: any, args: { id: string }, context: any): Promise<IProvider> => {
        try {
          const { id } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          const provider = await providersService.findById(id);

          if (!provider) {
            throw new GraphQLError(`Provider with ID ${id} not found`, {
              extensions: {
                code: 'NOT_FOUND',
                http: { status: 404 }
              }
            });
          }

          return provider;
        } catch (error) {
          logger.error(`Error fetching provider: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to fetch provider', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Get active telemedicine session for the current user
       * 
       * @param _ - Parent resolver
       * @param args - Empty arguments
       * @param context - GraphQL context containing user information
       * @returns The active telemedicine session if exists
       */
      activeTelemedicineSession: async (_: any, args: {}, context: any): Promise<ITelemedicineSession | null> => {
        try {
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          const session = await telemedicineService.getActiveSessionForUser(user.id);
          return session;
        } catch (error) {
          logger.error(`Error fetching active telemedicine session: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to fetch active telemedicine session', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      }
    },

    Mutation: {
      /**
       * Book a new appointment
       * 
       * @param _ - Parent resolver
       * @param args - Contains appointment data
       * @param context - GraphQL context containing user information
       * @returns The created appointment
       */
      bookAppointment: async (_: any, args: { 
        providerId: string, 
        dateTime: string, 
        type: AppointmentType, 
        reason?: string 
      }, context: any): Promise<IAppointment> => {
        try {
          const { providerId, dateTime, type, reason } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          // Improved validation for appointment scheduling conflicts
          const appointmentDate = new Date(dateTime);
          const hasConflict = await appointmentsService.checkUserAppointmentConflict(
            user.id,
            appointmentDate
          );

          if (hasConflict) {
            throw new GraphQLError('You already have an appointment scheduled at this time', {
              extensions: {
                code: 'CONFLICT',
                http: { status: 409 }
              }
            });
          }

          // Check provider availability with fallback strategy
          let isProviderAvailable = false;
          try {
            isProviderAvailable = await providersService.checkAvailability(
              providerId,
              appointmentDate
            );
          } catch (error) {
            logger.warn(`Primary availability check failed, using fallback: ${error.message}`);
            
            // Fallback strategy: Check provider's existing appointments
            const providerAppointments = await appointmentsService.getProviderTodayAppointments(providerId);
            
            // Check if there's an overlap with existing appointments
            const bufferMinutes = 30; // 30 minutes buffer
            const startTime = new Date(appointmentDate.getTime() - bufferMinutes * 60000);
            const endTime = new Date(appointmentDate.getTime() + bufferMinutes * 60000);
            
            const conflictingAppointments = providerAppointments.filter(appointment => {
              const appointmentTime = new Date(appointment.dateTime);
              return appointmentTime >= startTime && appointmentTime <= endTime;
            });
            
            isProviderAvailable = conflictingAppointments.length === 0;
          }

          if (!isProviderAvailable) {
            throw new GraphQLError('Provider is not available at the requested time', {
              extensions: {
                code: 'CONFLICT',
                http: { status: 409 }
              }
            });
          }

          // Create the appointment
          const appointment = await appointmentsService.create({
            userId: user.id,
            providerId,
            dateTime,
            type,
            reason
          });

          return appointment;
        } catch (error) {
          logger.error(`Error booking appointment: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to book appointment', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Update an existing appointment
       * 
       * @param _ - Parent resolver
       * @param args - Contains appointment ID and updated data
       * @param context - GraphQL context containing user information
       * @returns The updated appointment
       */
      updateAppointment: async (_: any, args: { 
        id: string, 
        dateTime?: string, 
        type?: AppointmentType, 
        status?: AppointmentStatus, 
        notes?: string 
      }, context: any): Promise<IAppointment> => {
        try {
          const { id, dateTime, type, status, notes } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          // Check if appointment exists and user is authorized
          const existingAppointment = await appointmentsService.findById(id);

          if (!existingAppointment) {
            throw new GraphQLError(`Appointment with ID ${id} not found`, {
              extensions: {
                code: 'NOT_FOUND',
                http: { status: 404 }
              }
            });
          }

          // Check if user is authorized to update this appointment
          if (existingAppointment.userId !== user.id && existingAppointment.providerId !== user.id) {
            throw new GraphQLError('Not authorized to update this appointment', {
              extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 }
              }
            });
          }

          // If changing date/time, check for conflicts
          if (dateTime && dateTime !== existingAppointment.dateTime) {
            const appointmentDate = new Date(dateTime);
            
            // Check for user conflicts
            const hasUserConflict = await appointmentsService.checkUserAppointmentConflict(
              existingAppointment.userId,
              appointmentDate
            );

            if (hasUserConflict) {
              throw new GraphQLError('User already has an appointment scheduled at this time', {
                extensions: {
                  code: 'CONFLICT',
                  http: { status: 409 }
                }
              });
            }

            // Check provider availability with fallback strategy
            let isProviderAvailable = false;
            try {
              isProviderAvailable = await providersService.checkAvailability(
                existingAppointment.providerId,
                appointmentDate
              );
            } catch (error) {
              logger.warn(`Primary availability check failed, using fallback: ${error.message}`);
              
              // Fallback strategy: Check provider's existing appointments
              const providerAppointments = await appointmentsService.getProviderTodayAppointments(
                existingAppointment.providerId
              );
              
              // Check if there's an overlap with existing appointments (excluding this one)
              const bufferMinutes = 30; // 30 minutes buffer
              const startTime = new Date(appointmentDate.getTime() - bufferMinutes * 60000);
              const endTime = new Date(appointmentDate.getTime() + bufferMinutes * 60000);
              
              const conflictingAppointments = providerAppointments.filter(appointment => {
                if (appointment.id === id) return false; // Exclude current appointment
                const appointmentTime = new Date(appointment.dateTime);
                return appointmentTime >= startTime && appointmentTime <= endTime;
              });
              
              isProviderAvailable = conflictingAppointments.length === 0;
            }

            if (!isProviderAvailable) {
              throw new GraphQLError('Provider is not available at the requested time', {
                extensions: {
                  code: 'CONFLICT',
                  http: { status: 409 }
                }
              });
            }
          }

          // Update the appointment
          const updatedAppointment = await appointmentsService.update(id, {
            dateTime,
            type,
            status,
            notes
          });

          return updatedAppointment;
        } catch (error) {
          logger.error(`Error updating appointment: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to update appointment', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Cancel an appointment
       * 
       * @param _ - Parent resolver
       * @param args - Contains the appointment ID
       * @param context - GraphQL context containing user information
       * @returns True if the appointment was successfully cancelled
       */
      cancelAppointment: async (_: any, args: { id: string }, context: any): Promise<boolean> => {
        try {
          const { id } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          // Check if appointment exists and user is authorized
          const existingAppointment = await appointmentsService.findById(id);

          if (!existingAppointment) {
            throw new GraphQLError(`Appointment with ID ${id} not found`, {
              extensions: {
                code: 'NOT_FOUND',
                http: { status: 404 }
              }
            });
          }

          // Check if user is authorized to cancel this appointment
          if (existingAppointment.userId !== user.id && existingAppointment.providerId !== user.id) {
            throw new GraphQLError('Not authorized to cancel this appointment', {
              extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 }
              }
            });
          }

          // Cancel the appointment
          const result = await appointmentsService.delete(id);
          return result;
        } catch (error) {
          logger.error(`Error cancelling appointment: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to cancel appointment', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Complete an appointment
       * 
       * @param _ - Parent resolver
       * @param args - Contains the appointment ID
       * @param context - GraphQL context containing user information
       * @returns The completed appointment
       */
      completeAppointment: async (_: any, args: { id: string }, context: any): Promise<IAppointment> => {
        try {
          const { id } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          // Check if appointment exists and user is authorized
          const existingAppointment = await appointmentsService.findById(id);

          if (!existingAppointment) {
            throw new GraphQLError(`Appointment with ID ${id} not found`, {
              extensions: {
                code: 'NOT_FOUND',
                http: { status: 404 }
              }
            });
          }

          // Only providers can mark appointments as completed
          if (existingAppointment.providerId !== user.id) {
            throw new GraphQLError('Only providers can mark appointments as completed', {
              extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 }
              }
            });
          }

          // Complete the appointment
          const completedAppointment = await appointmentsService.completeAppointment(id);
          return completedAppointment;
        } catch (error) {
          logger.error(`Error completing appointment: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to complete appointment', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Confirm an appointment
       * 
       * @param _ - Parent resolver
       * @param args - Contains the appointment ID
       * @param context - GraphQL context containing user information
       * @returns The confirmed appointment
       */
      confirmAppointment: async (_: any, args: { id: string }, context: any): Promise<IAppointment> => {
        try {
          const { id } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          // Check if appointment exists and user is authorized
          const existingAppointment = await appointmentsService.findById(id);

          if (!existingAppointment) {
            throw new GraphQLError(`Appointment with ID ${id} not found`, {
              extensions: {
                code: 'NOT_FOUND',
                http: { status: 404 }
              }
            });
          }

          // Only providers can confirm appointments
          if (existingAppointment.providerId !== user.id) {
            throw new GraphQLError('Only providers can confirm appointments', {
              extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 }
              }
            });
          }

          // Confirm the appointment
          const confirmedAppointment = await appointmentsService.confirmAppointment(id);
          return confirmedAppointment;
        } catch (error) {
          logger.error(`Error confirming appointment: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to confirm appointment', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      },

      /**
       * Start a telemedicine session for an appointment
       * 
       * @param _ - Parent resolver
       * @param args - Contains the appointment ID
       * @param context - GraphQL context containing user information
       * @returns The created telemedicine session
       */
      startTelemedicineSession: async (_: any, args: { appointmentId: string }, context: any): Promise<ITelemedicineSession> => {
        try {
          const { appointmentId } = args;
          const { user } = context;

          if (!user) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 }
              }
            });
          }

          // Check if appointment exists and is of type telemedicine
          const appointment = await appointmentsService.findById(appointmentId);

          if (!appointment) {
            throw new GraphQLError(`Appointment with ID ${appointmentId} not found`, {
              extensions: {
                code: 'NOT_FOUND',
                http: { status: 404 }
              }
            });
          }

          if (appointment.type !== AppointmentType.TELEMEDICINE) {
            throw new GraphQLError('Cannot start telemedicine session for non-telemedicine appointment', {
              extensions: {
                code: 'BAD_REQUEST',
                http: { status: 400 }
              }
            });
          }

          // Check if user is authorized to start this session
          if (appointment.userId !== user.id && appointment.providerId !== user.id) {
            throw new GraphQLError('Not authorized to start this telemedicine session', {
              extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 }
              }
            });
          }

          // Start the telemedicine session
          const session = await appointmentsService.startTelemedicineSession(appointmentId, user.id);
          return session;
        } catch (error) {
          logger.error(`Error starting telemedicine session: ${error.message}`, error.stack);
          
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          if (error instanceof AppException) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.errorType,
                errorCode: error.errorCode,
                http: { status: error.errorType === ErrorType.VALIDATION ? 400 : 500 }
              }
            });
          }
          
          throw new GraphQLError('Failed to start telemedicine session', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              http: { status: 500 }
            }
          });
        }
      }
    }
  };
};