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
 * This entity is part of the Care Journey and tracks virtual healthcare
 * consultations between patients and healthcare providers.
 * 
 * Implements the ITelemedicineSession interface from @austa/interfaces to ensure
 * type consistency between backend and frontend.
 */
@Entity()
export class TelemedicineSession implements ITelemedicineSession {
  /**
   * Unique identifier for the telemedicine session.
   * Generated as a UUID to ensure global uniqueness across environments.
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
   * Contains details about the scheduled time, provider, and patient.
   */
  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  /**
   * ID of the patient participating in the telemedicine session.
   * References a user in the auth service with the patient role.
   */
  @Column()
  patientId: string;

  /**
   * The patient participating in the telemedicine session.
   * Contains user details and profile information.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'patientId' })
  patient: User;

  /**
   * ID of the healthcare provider conducting the telemedicine session.
   * References a user in the auth service with the provider role.
   */
  @Column()
  providerId: string;

  /**
   * The healthcare provider conducting the telemedicine session.
   * Contains provider details, specialties, and credentials.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  /**
   * Start time of the telemedicine session.
   * Recorded when the session is initiated by either participant.
   */
  @Column()
  startTime: Date;

  /**
   * End time of the telemedicine session (nullable if the session is ongoing).
   * Recorded when the session is terminated by either participant or due to technical issues.
   */
  @Column({ nullable: true })
  endTime: Date;

  /**
   * Status of the telemedicine session (e.g., scheduled, ongoing, completed, cancelled).
   * Tracks the lifecycle state of the telemedicine consultation.
   */
  @Column()
  status: string;

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
   * Generates a telemedicine session event payload for the gamification engine.
   * This method creates a standardized event structure that can be published
   * to the event system for processing by the gamification engine.
   * 
   * @returns An object conforming to the telemedicine session event schema
   */
  toEventPayload() {
    return {
      sessionId: this.id,
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      providerId: this.providerId,
      status: this.status,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime ? this.endTime.toISOString() : null,
      journey: 'care'
    };
  }
}