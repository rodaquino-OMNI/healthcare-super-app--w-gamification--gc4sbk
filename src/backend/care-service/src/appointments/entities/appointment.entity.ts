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
 * It implements the IAppointment interface from @austa/interfaces
 * to ensure type consistency across the application.
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
   * Timestamp of when the appointment was created.
   * Used for event tracking and auditing.
   */
  createdAt: Date;

  /**
   * Timestamp of when the appointment was last updated.
   * Used for event tracking and auditing.
   */
  updatedAt: Date;

  /**
   * Generates an appointment booking event for the gamification system.
   * This method creates a standardized event object that can be processed
   * by the gamification engine to award points or achievements.
   * 
   * @returns An object conforming to the appointment event schema
   */
  toGamificationEvent(): Record<string, any> {
    return {
      eventType: 'appointment_booking',
      journeyType: 'care',
      userId: this.userId,
      metadata: {
        appointmentId: this.id,
        appointmentType: this.type,
        providerId: this.providerId,
        dateTime: this.dateTime.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}