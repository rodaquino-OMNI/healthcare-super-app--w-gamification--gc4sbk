import { IAppointment, AppointmentType, AppointmentStatus } from '@austa/interfaces/journey/care';
import { IUser } from '@austa/interfaces/auth';
import { IProvider } from '@austa/interfaces/journey/care';
import { IVersionedEvent } from '@austa/interfaces/gamification';

/**
 * Base interface for all appointment-related events.
 * Extends the IVersionedEvent interface to ensure proper versioning and metadata.
 */
export interface IAppointmentEventBase extends IVersionedEvent {
  /**
   * Unique identifier for the event.
   */
  eventId: string;

  /**
   * Timestamp when the event occurred.
   */
  timestamp: Date;

  /**
   * User ID associated with the appointment.
   */
  userId: string;

  /**
   * Appointment ID that this event relates to.
   */
  appointmentId: string;
}

/**
 * Event emitted when a new appointment is created.
 * This event is published to the gamification engine to track appointment booking activities.
 */
export interface IAppointmentCreatedEvent extends IAppointmentEventBase {
  /**
   * Type of the event.
   */
  type: 'appointment.created';

  /**
   * Payload containing appointment details.
   */
  payload: {
    /**
     * The appointment that was created.
     */
    appointment: {
      /**
       * Unique identifier for the appointment.
       */
      id: string;

      /**
       * ID of the healthcare provider for the appointment.
       */
      providerId: string;

      /**
       * Date and time of the appointment.
       */
      dateTime: Date;

      /**
       * Type of appointment (e.g., in-person, telemedicine).
       */
      type: AppointmentType;
    };
  };
}

/**
 * Event emitted when an appointment is completed.
 * This event is published to the gamification engine to track completed appointments
 * and potentially award achievements or points.
 */
export interface IAppointmentCompletedEvent extends IAppointmentEventBase {
  /**
   * Type of the event.
   */
  type: 'appointment.completed';

  /**
   * Payload containing appointment completion details.
   */
  payload: {
    /**
     * The appointment that was completed.
     */
    appointment: {
      /**
       * Unique identifier for the appointment.
       */
      id: string;

      /**
       * ID of the healthcare provider for the appointment.
       */
      providerId: string;

      /**
       * Date and time when the appointment was completed.
       */
      completedAt: Date;

      /**
       * Type of appointment (e.g., in-person, telemedicine).
       */
      type: AppointmentType;
    };
  };
}

/**
 * Event emitted when an appointment is cancelled.
 * This event is published to the gamification engine to track cancelled appointments.
 */
export interface IAppointmentCancelledEvent extends IAppointmentEventBase {
  /**
   * Type of the event.
   */
  type: 'appointment.cancelled';

  /**
   * Payload containing appointment cancellation details.
   */
  payload: {
    /**
     * The appointment that was cancelled.
     */
    appointment: {
      /**
       * Unique identifier for the appointment.
       */
      id: string;

      /**
       * ID of the healthcare provider for the appointment.
       */
      providerId: string;

      /**
       * Date and time when the appointment was cancelled.
       */
      cancelledAt: Date;

      /**
       * Type of appointment (e.g., in-person, telemedicine).
       */
      type: AppointmentType;

      /**
       * Optional reason for cancellation.
       */
      cancellationReason?: string;
    };
  };
}

/**
 * Union type of all appointment-related events.
 * Use this type when handling appointment events in a generic way.
 */
export type AppointmentEvent = 
  | IAppointmentCreatedEvent 
  | IAppointmentCompletedEvent 
  | IAppointmentCancelledEvent;