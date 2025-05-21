import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Appointment } from '@app/care/appointments/entities/appointment.entity';
import { User } from '@app/auth/users/entities/user.entity';
import { ITelemedicineSession } from '@austa/interfaces/journey/care';

/**
 * Represents a telemedicine session entity in the database.
 * 
 * This entity tracks virtual healthcare consultations between patients and providers,
 * including session timing, status, and participant information. It is linked to an
 * appointment record and maintains the lifecycle of a telemedicine consultation.
 * 
 * It implements the ITelemedicineSession interface from @austa/interfaces
 * to ensure type consistency across the application.
 */
@Entity()
export class TelemedicineSession implements ITelemedicineSession {
  /**
   * Unique identifier for the telemedicine session.
   * Generated as a UUID to ensure global uniqueness across the system.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the appointment associated with the telemedicine session.
   * Each telemedicine session must be linked to a scheduled appointment.
   */
  @Column()
  appointmentId: string;

  /**
   * The appointment associated with the telemedicine session.
   * This relationship allows tracking the appointment details that initiated this session.
   */
  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  /**
   * ID of the patient participating in the telemedicine session.
   * Identifies the user receiving healthcare services.
   */
  @Column()
  patientId: string;

  /**
   * The patient participating in the telemedicine session.
   * References the User entity from the auth service.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'patientId' })
  patient: User;

  /**
   * ID of the healthcare provider conducting the telemedicine session.
   * Identifies the healthcare professional delivering services.
   */
  @Column()
  providerId: string;

  /**
   * The healthcare provider conducting the telemedicine session.
   * References the User entity from the auth service.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  /**
   * Start time of the telemedicine session.
   * Recorded when both participants join the session.
   */
  @Column()
  startTime: Date;

  /**
   * End time of the telemedicine session (nullable if the session is ongoing).
   * Recorded when either participant ends the session or when it's terminated.
   */
  @Column({ nullable: true })
  endTime: Date;

  /**
   * Status of the telemedicine session.
   * Tracks the current state of the session (e.g., scheduled, ongoing, completed, cancelled).
   */
  @Column()
  status: string;

  /**
   * Connection details for the telemedicine session.
   * Contains technical information needed for establishing the video connection.
   */
  @Column({ type: 'json', nullable: true })
  connectionDetails: Record<string, any>;

  /**
   * Timestamp of when the telemedicine session was created.
   * Automatically managed by TypeORM.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp of when the telemedicine session was last updated.
   * Automatically managed by TypeORM.
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Calculates the duration of the telemedicine session in minutes.
   * Returns null if the session is still ongoing (endTime is null).
   * 
   * @returns The session duration in minutes, or null if ongoing
   */
  getDurationInMinutes(): number | null {
    if (!this.endTime) {
      return null;
    }
    
    const durationMs = this.endTime.getTime() - this.startTime.getTime();
    return Math.round(durationMs / (1000 * 60));
  }

  /**
   * Generates a telemedicine session event for the gamification system.
   * This method creates a standardized event object that can be processed
   * by the gamification engine to award points or achievements.
   * 
   * @returns An object conforming to the telemedicine event schema
   */
  toGamificationEvent(): Record<string, any> {
    return {
      eventType: 'telemedicine_session',
      journeyType: 'care',
      userId: this.patientId,
      metadata: {
        sessionId: this.id,
        appointmentId: this.appointmentId,
        providerId: this.providerId,
        duration: this.getDurationInMinutes(),
        status: this.status
      },
      timestamp: new Date().toISOString(),
    };
  }
}