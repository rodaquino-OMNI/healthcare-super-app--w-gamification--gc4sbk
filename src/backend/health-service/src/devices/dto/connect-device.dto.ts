import { IsNotEmpty, IsString, IsEnum } from 'class-validator'; // class-validator@0.14.0 - Validation decorators for DTO properties
import { DeviceType } from '@austa/interfaces/health'; // Import DeviceType from shared interfaces package

/**
 * Data Transfer Object for connecting a wearable device to a user's health profile.
 * Used when a client requests to establish a connection with a supported device.
 * 
 * @remarks
 * This DTO validates incoming requests to connect wearable devices to the AUSTA SuperApp.
 * It ensures that all required fields are present and properly formatted before processing.
 */
export class ConnectDeviceDto {
  /**
   * Unique identifier for the device
   * This could be a manufacturer serial number, MAC address, or another unique ID
   * 
   * @example "F8:23:B4:D5:9C:E1" (MAC address)
   * @example "SN-12345-ABCDE" (Serial number)
   */
  @IsNotEmpty({ message: 'Device ID is required' })
  @IsString({ message: 'Device ID must be a string' })
  deviceId: string;

  /**
   * Type of wearable device being connected
   * Must be one of the supported device types defined in the DeviceType enum
   * 
   * @example DeviceType.SMARTWATCH
   * @example DeviceType.BLOOD_PRESSURE_MONITOR
   */
  @IsNotEmpty({ message: 'Device type is required' })
  @IsEnum(DeviceType, { message: 'Invalid device type. Supported types: SMARTWATCH, FITNESS_TRACKER, HEART_RATE_MONITOR, BLOOD_PRESSURE_MONITOR, GLUCOSE_MONITOR, SCALE, SLEEP_TRACKER, OTHER' })
  deviceType: DeviceType;
}