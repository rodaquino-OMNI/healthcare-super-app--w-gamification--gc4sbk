import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleFitAdapter } from '@app/health/integrations/wearables/adapters/googlefit.adapter';
import { HealthKitAdapter } from '@app/health/integrations/wearables/adapters/healthkit.adapter';
import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';
import { WearableAdapter } from '@austa/interfaces/health';
import { DeviceConnection } from '@austa/interfaces/health';
import { HealthMetric } from '@austa/interfaces/health';
import { ErrorCodes, RetryOptions } from '@austa/errors/constants';
import { HealthError } from '@austa/errors/journey/health';
import { retry } from '@austa/errors/utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing wearable device integrations.
 * Provides a unified interface for connecting to different wearable APIs and retrieving health metrics.
 * Abstracts the complexities of each wearable's specific API and provides consistent data formats.
 */
@Injectable()
export class WearablesService {
  private readonly logger: LoggerService;
  private googleFitAdapter: GoogleFitAdapter;
  private healthKitAdapter: HealthKitAdapter;

  /**
   * Initializes the WearablesService.
   * @param logger - The logger service for logging events
   * @param configService - The configuration service for accessing app settings
   * @param prisma - The Prisma service for database operations
   */
  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {
    this.logger = loggerService.createLogger('WearablesService');
    this.googleFitAdapter = new GoogleFitAdapter();
    this.healthKitAdapter = new HealthKitAdapter();
  }

  /**
   * Connects a new wearable device to a user's health profile.
   * @param recordId - The health record ID to connect the device to
   * @param deviceType - The type of wearable device to connect
   * @returns A promise resolving to the newly created DeviceConnection entity
   */
  async connect(recordId: string, deviceType: string): Promise<DeviceConnection> {
    const correlationId = uuidv4();
    this.logger.log(`Connecting device type ${deviceType} to record ${recordId}`, { correlationId, recordId, deviceType });
    
    // Validate the device type
    this.validateDeviceType(deviceType);
    
    try {
      // Get the appropriate adapter for the device type
      const adapter = this.getAdapter(deviceType);
      
      // Connect to the device using the adapter with retry mechanism
      const connection = await retry(
        () => adapter.connect(recordId),
        {
          maxRetries: RetryOptions.DEVICE_CONNECTION.MAX_RETRIES,
          backoffFactor: RetryOptions.DEVICE_CONNECTION.BACKOFF_FACTOR,
          initialDelay: RetryOptions.DEVICE_CONNECTION.INITIAL_DELAY,
          maxDelay: RetryOptions.DEVICE_CONNECTION.MAX_DELAY,
          retryableErrors: [ErrorCodes.HEALTH_CONNECTION_TIMEOUT, ErrorCodes.HEALTH_SERVICE_UNAVAILABLE]
        }
      );
      
      // Save the connection in the database using connection pooling
      const deviceConnection = await this.prismaService.$transaction(async (prisma) => {
        return await prisma.deviceConnection.create({
          data: {
            recordId,
            deviceType: deviceType.toLowerCase(),
            deviceId: connection.deviceId,
            status: 'connected',
            lastSync: new Date()
          }
        });
      });
      
      this.logger.log(
        `Successfully connected ${deviceType} to record ${recordId}`,
        { correlationId, recordId, deviceType, deviceId: connection.deviceId }
      );
      
      return deviceConnection as DeviceConnection;
    } catch (error) {
      this.logger.error(
        `Failed to connect ${deviceType} to record ${recordId}: ${error.message}`,
        error.stack,
        { correlationId, recordId, deviceType, errorCode: ErrorCodes.HEALTH_CONNECTION_FAILED }
      );
      
      throw new HealthError(
        ErrorCodes.HEALTH_CONNECTION_FAILED,
        `Failed to connect ${deviceType} device: ${error.message}`,
        { recordId, deviceType }
      );
    }
  }

  /**
   * Retrieves health metrics from a wearable device for a specific user and date range.
   * @param recordId - The health record ID associated with the device
   * @param startDate - The start date for the metrics query
   * @param endDate - The end date for the metrics query
   * @param deviceType - The type of wearable device to retrieve metrics from
   * @returns A promise resolving to an array of HealthMetric entities
   */
  async getHealthMetrics(
    recordId: string,
    startDate: Date,
    endDate: Date,
    deviceType: string
  ): Promise<HealthMetric[]> {
    const correlationId = uuidv4();
    this.logger.log(
      `Retrieving health metrics for record ${recordId} from ${deviceType} ` +
      `between ${startDate.toISOString()} and ${endDate.toISOString()}`,
      { correlationId, recordId, deviceType, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    );
    
    // Validate the device type
    this.validateDeviceType(deviceType);
    
    try {
      // Verify the device connection exists using connection pooling
      const deviceConnection = await this.prismaService.$transaction(async (prisma) => {
        const connection = await prisma.deviceConnection.findFirst({
          where: {
            recordId,
            deviceType: deviceType.toLowerCase()
          }
        });
        
        if (!connection) {
          throw new NotFoundException(
            `No ${deviceType} connection found for record ${recordId}`
          );
        }
        
        return connection;
      });
      
      // Get the appropriate adapter for the device type
      const adapter = this.getAdapter(deviceType);
      
      // Retrieve health metrics using the adapter with retry mechanism
      const metrics = await retry(
        () => adapter.getHealthMetrics(recordId, startDate, endDate),
        {
          maxRetries: RetryOptions.METRICS_RETRIEVAL.MAX_RETRIES,
          backoffFactor: RetryOptions.METRICS_RETRIEVAL.BACKOFF_FACTOR,
          initialDelay: RetryOptions.METRICS_RETRIEVAL.INITIAL_DELAY,
          maxDelay: RetryOptions.METRICS_RETRIEVAL.MAX_DELAY,
          retryableErrors: [ErrorCodes.HEALTH_CONNECTION_TIMEOUT, ErrorCodes.HEALTH_SERVICE_UNAVAILABLE]
        }
      );
      
      // Update the last sync timestamp using connection pooling
      await this.prismaService.$transaction(async (prisma) => {
        await prisma.deviceConnection.update({
          where: { 
            id: deviceConnection.id 
          },
          data: { 
            lastSync: new Date() 
          }
        });
      });
      
      this.logger.log(
        `Successfully retrieved ${metrics.length} metrics for record ${recordId} from ${deviceType}`,
        { correlationId, recordId, deviceType, metricsCount: metrics.length }
      );
      
      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve metrics for record ${recordId} from ${deviceType}: ${error.message}`,
        error.stack,
        { correlationId, recordId, deviceType, errorCode: ErrorCodes.HEALTH_METRICS_RETRIEVAL_FAILED }
      );
      
      throw new HealthError(
        ErrorCodes.HEALTH_METRICS_RETRIEVAL_FAILED,
        `Failed to retrieve health metrics from ${deviceType}: ${error.message}`,
        { recordId, deviceType, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      );
    }
  }

  /**
   * Disconnects a wearable device from a user's health profile.
   * @param recordId - The health record ID associated with the device
   * @param deviceType - The type of wearable device to disconnect
   * @returns A promise that resolves when the device has been disconnected
   */
  async disconnect(recordId: string, deviceType: string): Promise<void> {
    const correlationId = uuidv4();
    this.logger.log(
      `Disconnecting ${deviceType} from record ${recordId}`,
      { correlationId, recordId, deviceType }
    );
    
    // Validate the device type
    this.validateDeviceType(deviceType);
    
    try {
      // Verify the device connection exists using connection pooling
      const deviceConnection = await this.prismaService.$transaction(async (prisma) => {
        const connection = await prisma.deviceConnection.findFirst({
          where: {
            recordId,
            deviceType: deviceType.toLowerCase()
          }
        });
        
        if (!connection) {
          throw new NotFoundException(
            `No ${deviceType} connection found for record ${recordId}`
          );
        }
        
        return connection;
      });
      
      // Get the appropriate adapter for the device type
      const adapter = this.getAdapter(deviceType);
      
      // Disconnect the device using the adapter with retry mechanism
      await retry(
        () => adapter.disconnect(recordId),
        {
          maxRetries: RetryOptions.DEVICE_DISCONNECTION.MAX_RETRIES,
          backoffFactor: RetryOptions.DEVICE_DISCONNECTION.BACKOFF_FACTOR,
          initialDelay: RetryOptions.DEVICE_DISCONNECTION.INITIAL_DELAY,
          maxDelay: RetryOptions.DEVICE_DISCONNECTION.MAX_DELAY,
          retryableErrors: [ErrorCodes.HEALTH_CONNECTION_TIMEOUT, ErrorCodes.HEALTH_SERVICE_UNAVAILABLE]
        }
      );
      
      // Remove the device connection from the database using connection pooling
      await this.prismaService.$transaction(async (prisma) => {
        await prisma.deviceConnection.deleteMany({
          where: {
            recordId,
            deviceType: deviceType.toLowerCase()
          }
        });
      });
      
      this.logger.log(
        `Successfully disconnected ${deviceType} from record ${recordId}`,
        { correlationId, recordId, deviceType }
      );
    } catch (error) {
      this.logger.error(
        `Failed to disconnect ${deviceType} from record ${recordId}: ${error.message}`,
        error.stack,
        { correlationId, recordId, deviceType, errorCode: ErrorCodes.HEALTH_DISCONNECTION_FAILED }
      );
      
      throw new HealthError(
        ErrorCodes.HEALTH_DISCONNECTION_FAILED,
        `Failed to disconnect ${deviceType} device: ${error.message}`,
        { recordId, deviceType }
      );
    }
  }

  /**
   * Validates the provided device type against the supported device types in the configuration.
   * @param deviceType - The device type to validate
   * @throws BadRequestException if the device type is not supported
   */
  validateDeviceType(deviceType: string): void {
    // Get the list of supported device types from the configuration
    const supportedDeviceTypes = this.configService.get<string>('wearablesSupported')?.split(',') || [];
    
    if (!supportedDeviceTypes.includes(deviceType.toLowerCase())) {
      this.logger.warn(
        `Unsupported device type: ${deviceType}`,
        { deviceType, supportedTypes: supportedDeviceTypes }
      );
      
      throw new BadRequestException(
        `Unsupported device type: ${deviceType}. Supported types are: ${supportedDeviceTypes.join(', ')}.`
      );
    }
  }

  /**
   * Returns the appropriate adapter for the given device type.
   * @param deviceType - The device type to get the adapter for
   * @returns The appropriate adapter for the given device type
   * @throws BadRequestException if the device type is not supported
   */
  getAdapter(deviceType: string): GoogleFitAdapter | HealthKitAdapter {
    const type = deviceType.toLowerCase();
    
    if (type === 'googlefit') {
      return this.googleFitAdapter;
    } else if (type === 'healthkit') {
      return this.healthKitAdapter;
    }
    
    throw new BadRequestException(`Unsupported device type: ${deviceType}`);
  }

  /**
   * Finds a device connection for a specific user and device type.
   * @param recordId - The health record ID to find the connection for
   * @param deviceType - The device type to find the connection for
   * @returns A promise resolving to the found DeviceConnection entity
   * @throws NotFoundException if no connection is found
   * @deprecated Use the prismaService.$transaction approach instead for better connection pooling
   */
  async findDeviceConnection(recordId: string, deviceType: string): Promise<DeviceConnection> {
    const connection = await this.prismaService.deviceConnection.findFirst({
      where: {
        recordId,
        deviceType: deviceType.toLowerCase()
      }
    });
    
    if (!connection) {
      throw new NotFoundException(
        `No ${deviceType} connection found for record ${recordId}`
      );
    }
    
    return connection as DeviceConnection;
  }

  /**
   * Creates a new device connection in the database.
   * @param recordId - The health record ID to create the connection for
   * @param deviceType - The device type to create the connection for
   * @param deviceId - The device ID to associate with the connection
   * @returns A promise resolving to the newly created DeviceConnection entity
   * @deprecated Use the prismaService.$transaction approach instead for better connection pooling
   */
  async createDeviceConnection(
    recordId: string,
    deviceType: string,
    deviceId: string
  ): Promise<DeviceConnection> {
    const newConnection = await this.prismaService.deviceConnection.create({
      data: {
        recordId,
        deviceType: deviceType.toLowerCase(),
        deviceId,
        status: 'connected',
        lastSync: new Date()
      }
    });
    
    return newConnection as DeviceConnection;
  }

  /**
   * Deletes a device connection from the database.
   * @param recordId - The health record ID associated with the connection
   * @param deviceType - The device type associated with the connection
   * @returns A promise that resolves when the device connection has been deleted
   * @deprecated Use the prismaService.$transaction approach instead for better connection pooling
   */
  async deleteDeviceConnection(recordId: string, deviceType: string): Promise<void> {
    await this.prismaService.deviceConnection.deleteMany({
      where: {
        recordId,
        deviceType: deviceType.toLowerCase()
      }
    });
    
    this.logger.log(`Deleted ${deviceType} connection for record ${recordId}`);
  }
}