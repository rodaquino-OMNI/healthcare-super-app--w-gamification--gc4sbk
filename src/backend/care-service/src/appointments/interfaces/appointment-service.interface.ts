import { AppointmentStatus, AppointmentType, IAppointment } from '@austa/interfaces/journey/care';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';

/**
 * Interface defining the contract for the Appointment Service.
 * This interface establishes the public API for appointment-related operations
 * in the Care Journey, ensuring consistent implementation across the application.
 */
export interface IAppointmentService {
  /**
   * Creates a new appointment based on the provided data.
   * 
   * @param createAppointmentDto - Data required to create a new appointment
   * @returns Promise resolving to the newly created appointment
   * @throws AppointmentValidationException - If appointment data is invalid
   * @throws ProviderNotFoundException - If the specified provider does not exist
   * @throws UserNotFoundException - If the specified user does not exist
   * @throws AppointmentConflictException - If there is a scheduling conflict
   */
  createAppointment(createAppointmentDto: CreateAppointmentDto): Promise<IAppointment>;

  /**
   * Retrieves an appointment by its unique identifier.
   * 
   * @param id - Unique identifier of the appointment
   * @returns Promise resolving to the appointment if found, null otherwise
   * @throws AppointmentNotFoundException - If the appointment with the given ID does not exist
   */
  getAppointmentById(id: string): Promise<IAppointment>;

  /**
   * Retrieves all appointments for a specific user.
   * 
   * @param userId - Unique identifier of the user
   * @param status - Optional filter for appointment status
   * @returns Promise resolving to an array of appointments
   * @throws UserNotFoundException - If the specified user does not exist
   */
  getAppointmentsByUserId(userId: string, status?: AppointmentStatus): Promise<IAppointment[]>;

  /**
   * Retrieves all appointments for a specific provider.
   * 
   * @param providerId - Unique identifier of the healthcare provider
   * @param status - Optional filter for appointment status
   * @returns Promise resolving to an array of appointments
   * @throws ProviderNotFoundException - If the specified provider does not exist
   */
  getAppointmentsByProviderId(providerId: string, status?: AppointmentStatus): Promise<IAppointment[]>;

  /**
   * Updates an existing appointment with the provided data.
   * 
   * @param id - Unique identifier of the appointment to update
   * @param updateAppointmentDto - Data to update the appointment with
   * @returns Promise resolving to the updated appointment
   * @throws AppointmentNotFoundException - If the appointment with the given ID does not exist
   * @throws AppointmentValidationException - If the updated appointment data is invalid
   * @throws AppointmentConflictException - If the update creates a scheduling conflict
   */
  updateAppointment(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<IAppointment>;

  /**
   * Cancels an existing appointment.
   * 
   * @param id - Unique identifier of the appointment to cancel
   * @param reason - Optional reason for cancellation
   * @returns Promise resolving to the cancelled appointment
   * @throws AppointmentNotFoundException - If the appointment with the given ID does not exist
   * @throws AppointmentStatusException - If the appointment is already cancelled or completed
   */
  cancelAppointment(id: string, reason?: string): Promise<IAppointment>;

  /**
   * Marks an appointment as completed.
   * 
   * @param id - Unique identifier of the appointment to mark as completed
   * @param notes - Optional notes about the completed appointment
   * @returns Promise resolving to the completed appointment
   * @throws AppointmentNotFoundException - If the appointment with the given ID does not exist
   * @throws AppointmentStatusException - If the appointment is already cancelled or completed
   */
  completeAppointment(id: string, notes?: string): Promise<IAppointment>;

  /**
   * Checks if a proposed appointment time conflicts with existing appointments
   * for either the user or provider.
   * 
   * @param userId - Unique identifier of the user
   * @param providerId - Unique identifier of the healthcare provider
   * @param dateTime - Proposed date and time for the appointment
   * @param duration - Duration of the appointment in minutes (default: 30)
   * @param excludeAppointmentId - Optional ID of an appointment to exclude from conflict check
   * @returns Promise resolving to true if a conflict exists, false otherwise
   */
  checkForConflicts(
    userId: string,
    providerId: string,
    dateTime: Date,
    duration?: number,
    excludeAppointmentId?: string
  ): Promise<boolean>;

  /**
   * Retrieves available time slots for a specific provider on a given date.
   * 
   * @param providerId - Unique identifier of the healthcare provider
   * @param date - The date to check for availability
   * @returns Promise resolving to an array of available time slots
   * @throws ProviderNotFoundException - If the specified provider does not exist
   */
  getAvailableTimeSlots(providerId: string, date: Date): Promise<Date[]>;
}