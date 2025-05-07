import { User } from '@app/auth/users/entities/user.entity';
import { Provider } from '@app/care/providers/entities/provider.entity';
import { IAppointment } from '@austa/interfaces/journey/care';

/**
 * Enum defining the possible types of appointments.
 */
export enum AppointmentType {
  IN_PERSON = 'in-person',
  TELEMEDICINE = 'telemedicine'
}

/**
 * Enum defining the possible statuses of appointments.
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Represents an appointment entity in the database.
 * This entity is part of the Care Journey and tracks scheduled
 * appointments between users and healthcare providers.
 * 
 * Implements the IAppointment interface from @austa/interfaces to ensure
 * type consistency between backend and frontend.
 */
export class Appointment implements IAppointment {
  /**
   * Unique identifier for the appointment.
   */
  id: string;

  /**
   * ID of the user scheduling the appointment.
   */
  userId: string;

  /**
   * The user scheduling the appointment.
   */
  user: User;

  /**
   * ID of the healthcare provider for the appointment.
   */
  providerId: string;

  /**
   * The healthcare provider for the appointment.
   */
  provider: Provider;

  /**
   * Date and time of the appointment.
   */
  dateTime: Date;

  /**
   * Type of appointment (e.g., in-person, telemedicine).
   */
  type: AppointmentType;

  /**
   * Status of the appointment (e.g., scheduled, completed, cancelled).
   */
  status: AppointmentStatus;

  /**
   * Optional notes or comments about the appointment.
   */
  notes: string;

  /**
   * Timestamp when the appointment was created.
   * Used for tracking and auditing purposes.
   */
  createdAt?: Date;

  /**
   * Timestamp when the appointment was last updated.
   * Used for tracking and auditing purposes.
   */
  updatedAt?: Date;

  /**
   * Generates an appointment booking event payload for the gamification engine.
   * This method creates a standardized event structure that can be published
   * to the event system for processing by the gamification engine.
   * 
   * @returns An object conforming to the appointment event schema
   */
  toEventPayload() {
    return {
      appointmentId: this.id,
      userId: this.userId,
      providerId: this.providerId,
      type: this.type,
      status: this.status,
      dateTime: this.dateTime.toISOString(),
      journey: 'care'
    };
  }
}