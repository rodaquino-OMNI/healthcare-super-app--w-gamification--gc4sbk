import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { IProvider } from '@austa/interfaces/journey/care';

/**
 * Represents a healthcare provider entity in the database.
 * This entity is part of the Care Journey and stores information about
 * healthcare providers available for appointments and consultations.
 * 
 * @implements {IProvider} - Implements the provider interface from @austa/interfaces
 */
@Entity()
export class Provider implements IProvider {
  /**
   * Unique identifier for the provider.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Name of the provider.
   */
  @Column()
  name: string;

  /**
   * Medical specialty of the provider.
   */
  @Column()
  specialty: string;

  /**
   * Location of the provider's practice.
   */
  @Column()
  location: string;

  /**
   * Contact phone number of the provider.
   */
  @Column()
  phone: string;

  /**
   * Contact email address of the provider.
   */
  @Column()
  email: string;

  /**
   * Indicates whether the provider offers telemedicine services.
   */
  @Column({ default: false })
  telemedicineAvailable: boolean;

  /**
   * Record creation timestamp.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Record update timestamp.
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Generates a provider data payload for the gamification engine.
   * This method creates a standardized event structure that can be published
   * to the event system for processing by the gamification engine.
   * 
   * @returns An object conforming to the provider event schema
   */
  toEventPayload() {
    return {
      providerId: this.id,
      name: this.name,
      specialty: this.specialty,
      telemedicineAvailable: this.telemedicineAvailable,
      journey: 'care'
    };
  }
}