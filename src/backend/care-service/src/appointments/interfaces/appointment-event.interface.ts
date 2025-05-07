import { IBaseEvent } from '@austa/interfaces/common';
import { IAppointment } from '@austa/interfaces/journey/care';
import { AppointmentStatus, AppointmentType } from '../entities/appointment.entity';

/**
 * Event type constants for appointment-related events
 */
export enum AppointmentEventType {
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  APPOINTMENT_CANCELLED = 'appointment.cancelled'
}

/**
 * Base interface for all appointment-related events
 * Extends the standard IBaseEvent with appointment-specific properties
 */
export interface IAppointmentEvent extends IBaseEvent {
  /**
   * The journey this event belongs to
   */
  journey: 'care';
  
  /**
   * The specific type of appointment event
   */
  type: AppointmentEventType;
  
  /**
   * The user ID associated with this appointment event
   */
  userId: string;
}

/**
 * Interface for appointment creation events
 * Triggered when a new appointment is scheduled
 */
export interface IAppointmentCreatedEvent extends IAppointmentEvent {
  type: AppointmentEventType.APPOINTMENT_CREATED;
  payload: {
    /**
     * The appointment that was created
     */
    appointment: IAppointment;
    
    /**
     * The type of appointment (in-person or telemedicine)
     */
    appointmentType: AppointmentType;
    
    /**
     * The provider ID for the appointment
     */
    providerId: string;
    
    /**
     * The scheduled date and time of the appointment
     */
    scheduledDateTime: string;
  };
}

/**
 * Interface for appointment completion events
 * Triggered when an appointment is marked as completed
 */
export interface IAppointmentCompletedEvent extends IAppointmentEvent {
  type: AppointmentEventType.APPOINTMENT_COMPLETED;
  payload: {
    /**
     * The appointment that was completed
     */
    appointment: IAppointment;
    
    /**
     * The type of appointment (in-person or telemedicine)
     */
    appointmentType: AppointmentType;
    
    /**
     * The provider ID for the appointment
     */
    providerId: string;
    
    /**
     * The actual completion date and time of the appointment
     */
    completedDateTime: string;
    
    /**
     * Optional notes from the appointment
     */
    notes?: string;
  };
}

/**
 * Interface for appointment cancellation events
 * Triggered when an appointment is cancelled
 */
export interface IAppointmentCancelledEvent extends IAppointmentEvent {
  type: AppointmentEventType.APPOINTMENT_CANCELLED;
  payload: {
    /**
     * The appointment that was cancelled
     */
    appointment: IAppointment;
    
    /**
     * The type of appointment (in-person or telemedicine)
     */
    appointmentType: AppointmentType;
    
    /**
     * The provider ID for the appointment
     */
    providerId: string;
    
    /**
     * The date and time when the appointment was cancelled
     */
    cancelledDateTime: string;
    
    /**
     * Optional reason for cancellation
     */
    cancellationReason?: string;
  };
}

/**
 * Type representing all possible appointment event types
 * Used for type-safe event handling in consumers
 */
export type AppointmentEvent = 
  | IAppointmentCreatedEvent 
  | IAppointmentCompletedEvent 
  | IAppointmentCancelledEvent;