import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { IMedication } from '@austa/interfaces/journey/care';

/**
 * Represents a medication entity in the database.
 * This entity is used for tracking medications as part of the Care Now journey.
 * It supports medication tracking with reminders and adherence monitoring.
 * 
 * It implements the IMedication interface from @austa/interfaces
 * to ensure type consistency across the application.
 */
@Entity()
export class Medication implements IMedication {
  /**
   * Unique identifier for the medication
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the user who owns this medication record
   */
  @Column()
  userId: string;

  /**
   * Name of the medication
   */
  @Column()
  name: string;

  /**
   * Dosage amount (e.g., 500 for 500mg)
   */
  @Column('float')
  dosage: number;

  /**
   * Frequency of medication (e.g., "daily", "twice daily", "every 8 hours")
   */
  @Column()
  frequency: string;

  /**
   * Date when the medication regimen starts
   */
  @Column()
  startDate: Date;

  /**
   * Optional end date for the medication regimen
   */
  @Column({ nullable: true })
  endDate: Date;

  /**
   * Whether reminders are enabled for this medication
   */
  @Column({ default: true })
  reminderEnabled: boolean;

  /**
   * Any additional notes or instructions
   */
  @Column({ nullable: true })
  notes: string;

  /**
   * Whether the medication is currently active
   */
  @Column({ default: true })
  active: boolean;

  /**
   * Record creation timestamp
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Record update timestamp
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Generates a medication tracking event for the gamification system.
   * This method creates a standardized event object that can be processed
   * by the gamification engine to award points or achievements for medication adherence.
   * 
   * @returns An object conforming to the medication event schema
   */
  toGamificationEvent(): Record<string, any> {
    return {
      eventType: 'medication_tracking',
      journeyType: 'care',
      userId: this.userId,
      metadata: {
        medicationId: this.id,
        medicationName: this.name,
        adherenceType: 'taken_as_scheduled',
      },
      timestamp: new Date().toISOString(),
    };
  }
}