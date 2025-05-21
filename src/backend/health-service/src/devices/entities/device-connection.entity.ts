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
import { ConnectionStatus, DeviceType, IDeviceConnection } from '@austa/interfaces/journey/health';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsUUID, Length } from 'class-validator';

/**
 * Represents a connection between a user's health record and a wearable device.
 * This entity stores information about the device, its connection status, and synchronization details.
 * 
 * @implements {IDeviceConnection} - Implements the standardized device connection interface
 */
@Entity('device_connections')
@Index(['recordId', 'deviceId'], { unique: true })
export class DeviceConnection implements IDeviceConnection {
  /**
   * Unique identifier for the device connection
   * Generated automatically as a UUID
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID('4')
  id: string;

  /**
   * Reference to the health record this device is connected to
   * Foreign key to the health_records table
   */
  @Column('uuid')
  @IsUUID('4')
  @IsNotEmpty({ message: 'Health record ID is required' })
  recordId: string;

  /**
   * Type of wearable device (e.g., smartwatch, fitness tracker)
   * Uses the standardized DeviceType enum from @austa/interfaces
   */
  @Column({
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.OTHER
  })
  @IsEnum(DeviceType, { message: 'Invalid device type' })
  deviceType: DeviceType;

  /**
   * Unique identifier for the device (typically provided by the device itself)
   * Used to identify the specific device during synchronization
   */
  @Column({ length: 255 })
  @IsNotEmpty({ message: 'Device ID is required' })
  @Length(1, 255, { message: 'Device ID must be between 1 and 255 characters' })
  deviceId: string;

  /**
   * When the device data was last synchronized
   * Null if the device has never been synchronized
   */
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate({ message: 'Last sync must be a valid date' })
  lastSync?: Date;

  /**
   * Current connection status of the device
   * Uses the standardized ConnectionStatus enum from @austa/interfaces
   */
  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.DISCONNECTED
  })
  @IsEnum(ConnectionStatus, { message: 'Invalid connection status' })
  status: ConnectionStatus;

  /**
   * When the device connection was created
   * Automatically set by TypeORM
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * When the device connection was last updated
   * Automatically updated by TypeORM on each save
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Relationship with the HealthRecord entity
   * Commented out as the HealthRecord entity would be imported in a real implementation
   * using the proper path alias
   */
  /*
  @ManyToOne(() => HealthRecord, healthRecord => healthRecord.deviceConnections)
  @JoinColumn({ name: 'recordId' })
  healthRecord: HealthRecord;
  */
}