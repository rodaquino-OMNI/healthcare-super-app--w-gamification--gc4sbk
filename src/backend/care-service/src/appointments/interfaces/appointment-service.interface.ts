import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { IAppointment } from '@austa/interfaces/journey/care';

/**
 * Interface defining the contract for the Appointment Service.
 * This service handles all appointment-related operations in the Care journey.
 */
export interface IAppointmentService {
  /**
   * Creates a new appointment based on the provided data.
   * 
   * @param createAppointmentDto - Data required to create a new appointment
   * @returns Promise resolving to the created appointment
   * @throws AppointmentDateInPastError if the appointment date is in the past
   * @throws AppointmentOverlapError if the appointment overlaps with an existing one
   * @throws AppointmentProviderUnavailableError if the provider is not available
   * @throws AppointmentPersistenceError if there's a database error
   */
  createAppointment(createAppointmentDto: CreateAppointmentDto): Promise<Appointment>;

  /**
   * Retrieves an appointment by its unique identifier.
   * 
   * @param id - Unique identifier of the appointment
   * @returns Promise resolving to the appointment if found
   * @throws AppointmentNotFoundError if the appointment doesn't exist
   */
  getAppointmentById(id: string): Promise<Appointment>;

  /**
   * Retrieves all appointments for a specific user.
   * 
   * @param userId - Unique identifier of the user
   * @param status - Optional filter for appointment status
   * @returns Promise resolving to an array of appointments
   */
  getAppointmentsByUserId(
    userId: string,
    status?: AppointmentStatus
  ): Promise<Appointment[]>;

  /**
   * Retrieves all appointments for a specific healthcare provider.
   * 
   * @param providerId - Unique identifier of the provider
   * @param status - Optional filter for appointment status
   * @returns Promise resolving to an array of appointments
   */
  getAppointmentsByProviderId(
    providerId: string,
    status?: AppointmentStatus
  ): Promise<Appointment[]>;

  /**
   * Updates an existing appointment with new data.
   * 
   * @param id - Unique identifier of the appointment to update
   * @param updateAppointmentDto - Data to update the appointment with
   * @returns Promise resolving to the updated appointment
   * @throws AppointmentNotFoundError if the appointment doesn't exist
   * @throws AppointmentDateInPastError if the new appointment date is in the past
   * @throws AppointmentOverlapError if the new appointment time overlaps with an existing one
   * @throws AppointmentProviderUnavailableError if the provider is not available at the new time
   * @throws AppointmentPersistenceError if there's a database error
   */
  updateAppointment(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto
  ): Promise<Appointment>;

  /**
   * Cancels an existing appointment.
   * 
   * @param id - Unique identifier of the appointment to cancel
   * @returns Promise resolving to the canceled appointment
   * @throws AppointmentNotFoundError if the appointment doesn't exist
   * @throws AppointmentAlreadyCanceledError if the appointment is already canceled
   * @throws AppointmentCancellationTimeError if the cancellation is too close to the appointment time
   * @throws AppointmentPersistenceError if there's a database error
   */
  cancelAppointment(id: string): Promise<Appointment>;

  /**
   * Checks if a specific time slot is available for a provider.
   * 
   * @param providerId - Unique identifier of the provider
   * @param dateTime - Date and time to check availability for
   * @param appointmentId - Optional ID of an appointment to exclude from the check (for updates)
   * @returns Promise resolving to a boolean indicating if the slot is available
   */
  isTimeSlotAvailable(
    providerId: string,
    dateTime: Date,
    appointmentId?: string
  ): Promise<boolean>;

  /**
   * Converts an Appointment entity to an IAppointment interface.
   * This method is used for data transfer between services and clients.
   * 
   * @param appointment - The appointment entity to convert
   * @returns The appointment data as an IAppointment interface
   */
  toInterface(appointment: Appointment): IAppointment;

  /**
   * Converts multiple Appointment entities to IAppointment interfaces.
   * 
   * @param appointments - Array of appointment entities to convert
   * @returns Array of appointment data as IAppointment interfaces
   */
  toInterfaces(appointments: Appointment[]): IAppointment[];
}