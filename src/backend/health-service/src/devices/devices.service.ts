import { Injectable } from '@nestjs/common';
import { ConnectDeviceDto } from '@app/health/devices/dto/connect-device.dto';
import { PrismaService } from '@austa/database/connection/prisma.service';
import { LoggerService } from '@austa/logging';
import { WearablesService } from '@app/health/integrations/wearables/wearables.service';
import { FilterDto } from '@austa/interfaces/common/dto';
import { IDeviceConnection } from '@austa/interfaces/journey/health/device-connection.interface';
import { BaseError, TechnicalError, ExternalError } from '@austa/errors';
import { retry } from '@austa/utils/retry';

/**
 * Handles the business logic for connecting, retrieving, and managing wearable devices
 * associated with user health records. It orchestrates interactions with different
 * wearable APIs and ensures data consistency.
 */
@Injectable()
export class DevicesService {
  private logger: LoggerService;
  
  /**
   * Initializes the DevicesService.
   * 
   * @param logger - Logger service for device-related operations
   * @param wearablesService - Service for interacting with wearable device APIs
   * @param prismaService - Enhanced database service with connection pooling
   */
  constructor(
    private readonly loggerService: LoggerService,
    private readonly wearablesService: WearablesService,
    private readonly prismaService: PrismaService
  ) {
    this.logger = this.loggerService.createLogger('DevicesService');
  }

  /**
   * Connects a new wearable device to a user's health profile.
   * Implements retry logic with exponential backoff for external API calls.
   * 
   * @param recordId - ID of the health record to connect the device to
   * @param connectDeviceDto - Data for connecting the device
   * @returns The newly created DeviceConnection entity.
   */
  async connectDevice(recordId: string, connectDeviceDto: ConnectDeviceDto): Promise<IDeviceConnection> {
    try {
      this.logger.log(`Connecting device ${connectDeviceDto.deviceType} for record ${recordId}`);
      
      // Convert the deviceType enum to a string format that the WearablesService expects
      const deviceType = String(connectDeviceDto.deviceType).toLowerCase();
      
      // Calls the appropriate adapter to connect to the device using WearablesService
      // with retry logic for transient errors
      const deviceConnection = await retry(
        () => this.wearablesService.connect(recordId, deviceType),
        {
          maxRetries: 3,
          initialDelay: 300,
          maxDelay: 3000,
          factor: 2,
          retryCondition: (error) => {
            // Only retry on network or transient errors
            return error instanceof ExternalError && error.isTransient();
          },
          onRetry: (error, attempt) => {
            this.logger.warn(
              `Retry attempt ${attempt} connecting device ${connectDeviceDto.deviceType} for record ${recordId}: ${error.message}`
            );
          }
        }
      );
      
      this.logger.log(`Successfully connected device ${connectDeviceDto.deviceType} for record ${recordId}`);
      
      return deviceConnection;
    } catch (error) {
      this.logger.error(
        `Failed to connect device ${connectDeviceDto.deviceType} for record ${recordId}: ${error.message}`,
        error.stack
      );
      
      // Enhanced error handling with proper classification
      if (error instanceof BaseError) {
        // Rethrow existing classified errors
        throw error;
      }
      
      // Classify as external error if it's related to the device API
      if (error.message.includes('API') || error.message.includes('device')) {
        throw new ExternalError({
          message: `Failed to connect device: ${error.message}`,
          code: 'HEALTH_DEVICE_CONNECTION_FAILED',
          context: {
            deviceType: connectDeviceDto.deviceType,
            recordId,
            deviceId: connectDeviceDto.deviceId
          },
          cause: error
        });
      }
      
      // Default to technical error for other cases
      throw new TechnicalError({
        message: `Failed to connect device: ${error.message}`,
        code: 'HEALTH_DEVICE_CONNECTION_FAILED',
        context: {
          deviceType: connectDeviceDto.deviceType,
          recordId
        },
        cause: error
      });
    }
  }

  /**
   * Retrieves all connected devices for a given user record.
   * Uses enhanced PrismaService with connection pooling for database operations.
   * 
   * @param recordId - ID of the health record to get devices for
   * @param filterDto - Optional filtering criteria
   * @returns A promise that resolves to an array of DeviceConnection entities.
   */
  async getDevices(recordId: string, filterDto?: FilterDto): Promise<IDeviceConnection[]> {
    try {
      this.logger.log(`Retrieving connected devices for record ${recordId}`);
      
      // Create a filter that includes the record ID
      const filter = {
        where: {
          recordId,
          ...(filterDto?.where || {})
        },
        orderBy: filterDto?.orderBy || { lastSync: 'desc' },
        ...filterDto
      };
      
      // Use the enhanced PrismaService with connection pooling
      // to retrieve device connections from the database
      const deviceConnections = await this.prismaService.deviceConnection.findMany(filter);
      
      this.logger.log(`Retrieved ${deviceConnections.length} devices for record ${recordId}`);
      
      return deviceConnections as unknown as IDeviceConnection[];
    } catch (error) {
      this.logger.error(
        `Failed to retrieve devices for record ${recordId}: ${error.message}`,
        error.stack
      );
      
      // Enhanced error handling with proper classification
      if (error instanceof BaseError) {
        // Rethrow existing classified errors
        throw error;
      }
      
      // Classify database errors as technical errors
      throw new TechnicalError({
        message: `Failed to retrieve devices: ${error.message}`,
        code: 'HEALTH_DATABASE_ERROR',
        context: {
          recordId,
          operation: 'getDevices'
        },
        cause: error
      });
    }
  }

  /**
   * Disconnects a device from a user's health record.
   * Implements retry logic for external API calls.
   * 
   * @param recordId - ID of the health record
   * @param deviceId - ID of the device to disconnect
   * @returns A promise that resolves when the device is disconnected
   */
  async disconnectDevice(recordId: string, deviceId: string): Promise<void> {
    try {
      this.logger.log(`Disconnecting device ${deviceId} from record ${recordId}`);
      
      // Find the device connection to get the device type
      const deviceConnection = await this.prismaService.deviceConnection.findFirst({
        where: {
          recordId,
          deviceId
        }
      });
      
      if (!deviceConnection) {
        throw new Error(`Device connection not found for record ${recordId} and device ${deviceId}`);
      }
      
      // Disconnect the device with retry logic for transient errors
      await retry(
        () => this.wearablesService.disconnect(recordId, deviceConnection.deviceType),
        {
          maxRetries: 3,
          initialDelay: 300,
          maxDelay: 3000,
          factor: 2,
          retryCondition: (error) => {
            // Only retry on network or transient errors
            return error instanceof ExternalError && error.isTransient();
          },
          onRetry: (error, attempt) => {
            this.logger.warn(
              `Retry attempt ${attempt} disconnecting device ${deviceId} for record ${recordId}: ${error.message}`
            );
          }
        }
      );
      
      this.logger.log(`Successfully disconnected device ${deviceId} from record ${recordId}`);
    } catch (error) {
      this.logger.error(
        `Failed to disconnect device ${deviceId} from record ${recordId}: ${error.message}`,
        error.stack
      );
      
      // Enhanced error handling with proper classification
      if (error instanceof BaseError) {
        // Rethrow existing classified errors
        throw error;
      }
      
      // Classify as external error if it's related to the device API
      if (error.message.includes('API') || error.message.includes('device')) {
        throw new ExternalError({
          message: `Failed to disconnect device: ${error.message}`,
          code: 'HEALTH_DEVICE_DISCONNECTION_FAILED',
          context: {
            recordId,
            deviceId
          },
          cause: error
        });
      }
      
      // Default to technical error for other cases
      throw new TechnicalError({
        message: `Failed to disconnect device: ${error.message}`,
        code: 'HEALTH_DEVICE_DISCONNECTION_FAILED',
        context: {
          recordId,
          deviceId
        },
        cause: error
      });
    }
  }

  /**
   * Synchronizes health data from a connected device.
   * Implements retry logic with exponential backoff for external API calls.
   * 
   * @param recordId - ID of the health record
   * @param deviceId - ID of the device to sync
   * @param startDate - Start date for data synchronization
   * @param endDate - End date for data synchronization
   * @returns A promise that resolves when synchronization is complete
   */
  async syncDeviceData(
    recordId: string,
    deviceId: string,
    startDate: Date = new Date(Date.now() - 24 * 60 * 60 * 1000), // Default to last 24 hours
    endDate: Date = new Date()
  ): Promise<void> {
    try {
      this.logger.log(`Syncing data from device ${deviceId} for record ${recordId}`);
      
      // Find the device connection to get the device type
      const deviceConnection = await this.prismaService.deviceConnection.findFirst({
        where: {
          recordId,
          deviceId
        }
      });
      
      if (!deviceConnection) {
        throw new Error(`Device connection not found for record ${recordId} and device ${deviceId}`);
      }
      
      // Sync data with retry logic for transient errors
      await retry(
        () => this.wearablesService.getHealthMetrics(
          recordId,
          startDate,
          endDate,
          deviceConnection.deviceType
        ),
        {
          maxRetries: 3,
          initialDelay: 300,
          maxDelay: 3000,
          factor: 2,
          retryCondition: (error) => {
            // Only retry on network or transient errors
            return error instanceof ExternalError && error.isTransient();
          },
          onRetry: (error, attempt) => {
            this.logger.warn(
              `Retry attempt ${attempt} syncing data from device ${deviceId} for record ${recordId}: ${error.message}`
            );
          }
        }
      );
      
      // Update the last sync timestamp
      await this.prismaService.deviceConnection.update({
        where: { id: deviceConnection.id },
        data: { lastSync: new Date() }
      });
      
      this.logger.log(`Successfully synced data from device ${deviceId} for record ${recordId}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync data from device ${deviceId} for record ${recordId}: ${error.message}`,
        error.stack
      );
      
      // Enhanced error handling with proper classification
      if (error instanceof BaseError) {
        // Rethrow existing classified errors
        throw error;
      }
      
      // Classify as external error if it's related to the device API
      if (error.message.includes('API') || error.message.includes('device')) {
        throw new ExternalError({
          message: `Failed to sync device data: ${error.message}`,
          code: 'HEALTH_DEVICE_SYNC_FAILED',
          context: {
            recordId,
            deviceId,
            startDate,
            endDate
          },
          cause: error
        });
      }
      
      // Default to technical error for other cases
      throw new TechnicalError({
        message: `Failed to sync device data: ${error.message}`,
        code: 'HEALTH_DEVICE_SYNC_FAILED',
        context: {
          recordId,
          deviceId
        },
        cause: error
      });
    }
  }
}