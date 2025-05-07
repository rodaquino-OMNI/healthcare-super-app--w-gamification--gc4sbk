import { IsNotEmpty, IsString, IsEnum } from 'class-validator'; // class-validator@0.14.0 - Validation decorators for DTO properties
import { DeviceType } from '@austa/interfaces/health'; // Import from centralized interfaces package

/**
 * Data Transfer Object for connecting a wearable device to a user's health profile.
 * Used when a client requests to establish a connection with a supported device.
 * 
 * This DTO validates incoming requests to ensure they contain all required information
 * for establishing a connection with a health tracking device.
 */
export class ConnectDeviceDto {
  /**
   * Unique identifier for the device
   * This could be a manufacturer serial number, MAC address, or another unique ID
   * that allows the system to identify and communicate with the specific device.
   * 
   * @example "F8:23:B4:D5:9C:E1" (MAC address)
   * @example "SN12345678" (Serial number)
   */
  @IsNotEmpty({ message: 'Device ID is required' })
  @IsString({ message: 'Device ID must be a string' })
  deviceId: string;

  /**
   * Type of wearable device being connected
   * Must be one of the supported device types defined in the DeviceType enum
   * from the @austa/interfaces package.
   * 
   * The device type determines which integration adapter will be used to
   * communicate with the device and process its data.
   * 
   * @example DeviceType.SMARTWATCH
   * @example DeviceType.BLOOD_PRESSURE_MONITOR
   */
  @IsNotEmpty({ message: 'Device type is required' })
  @IsEnum(DeviceType, { 
    message: 'Invalid device type. Supported types: SMARTWATCH, FITNESS_TRACKER, HEART_RATE_MONITOR, BLOOD_PRESSURE_MONITOR, GLUCOSE_MONITOR, SCALE, SLEEP_TRACKER, OTHER' 
  })
  deviceType: DeviceType;
}