import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne, 
  JoinColumn,
  Index
} from 'typeorm'; // v0.3.20
import { DeviceType } from '@austa/interfaces/health';

/**
 * Enum representing possible device connection statuses
 * Used to track the current state of a device connection
 */
export enum ConnectionStatus {
  /**
   * Device is currently connected and actively syncing data
   */
  CONNECTED = 'connected',
  
  /**
   * Device was previously connected but is now disconnected
   */
  DISCONNECTED = 'disconnected',
  
  /**
   * Device is in the process of establishing a connection
   */
  PAIRING = 'pairing',
  
  /**
   * Connection encountered an error that prevented successful operation
   */
  ERROR = 'error'
}

/**
 * Represents a connection between a user's health record and a wearable device.
 * This entity stores information about the device, its connection status, and synchronization details.
 * 
 * @remarks
 * Device connections are essential for the Health journey as they enable automatic
 * data collection from wearable devices and health monitors. This data is used to
 * track health metrics, generate insights, and contribute to gamification achievements.
 */
@Entity('device_connections')
@Index(['recordId', 'deviceId'], { unique: true })
export class DeviceConnection {
  /**
   * Unique identifier for the device connection
   * Generated automatically as a UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the health record this device is connected to
   * Foreign key to the health_records table
   */
  @Column('uuid')
  @Index()
  recordId: string;

  /**
   * Type of wearable device (e.g., smartwatch, fitness tracker)
   * Uses standardized device types from @austa/interfaces
   */
  @Column({
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.OTHER
  })
  deviceType: DeviceType;

  /**
   * Unique identifier for the device (typically provided by the device itself)
   * Used to identify the specific device during synchronization
   */
  @Column({ length: 255 })
  deviceId: string;

  /**
   * When the device data was last synchronized
   * Updated each time data is successfully retrieved from the device
   */
  @Column({ type: 'timestamp', nullable: true })
  lastSync: Date | null;

  /**
   * Current connection status of the device
   * Tracks whether the device is currently connected, disconnected, pairing, or in error state
   */
  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.DISCONNECTED
  })
  status: ConnectionStatus;

  /**
   * Optional metadata about the device connection
   * Stores additional device-specific information as a JSON object
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  /**
   * When the device connection was created
   * Automatically set when the record is first inserted
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * When the device connection was last updated
   * Automatically updated whenever the record is modified
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Relationship with the HealthRecord entity
   * Note: Uncomment when HealthRecord entity is available
   */
  /*
  @ManyToOne(() => HealthRecord, healthRecord => healthRecord.deviceConnections)
  @JoinColumn({ name: 'recordId' })
  healthRecord: HealthRecord;
  */
}