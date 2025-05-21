import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GoogleFitAdapter } from '@app/health/integrations/wearables/adapters/googlefit.adapter';
import { HealthKitAdapter } from '@app/health/integrations/wearables/adapters/healthkit.adapter';
import { Configuration } from '@app/health/config/configuration';
import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';
import { WearableAdapter } from '@austa/interfaces/journey/health';
import { IDeviceConnection, DeviceType } from '@austa/interfaces/journey/health';
import { IHealthMetric } from '@austa/interfaces/journey/health';
import { HealthJourneyError, ErrorCategory, ErrorType } from '@austa/errors';
import { ConnectionRetry, RetryOptions } from '@austa/database/connection';
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
  private configService: Configuration;
  private prisma: PrismaService;
  private connectionRetry: ConnectionRetry;

  /**
   * Initializes the WearablesService.
   * @param logger - The logger service for logging events
   * @param configService - The configuration service for accessing app settings
   * @param prisma - The Prisma service for database operations
   */
  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: Configuration,
    private readonly prismaService: PrismaService
  ) {
    this.logger = loggerService.createLogger('WearablesService');
    this.googleFitAdapter = new GoogleFitAdapter();
    this.healthKitAdapter = new HealthKitAdapter();
    this.configService = configService;
    this.prisma = prismaService;
    this.connectionRetry = new ConnectionRetry({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2,
      jitter: true
    });
  }

  /**
   * Connects a new wearable device to a user's health profile.
   * @param recordId - The health record ID to connect the device to
   * @param deviceType - The type of wearable device to connect
   * @returns A promise resolving to the newly created DeviceConnection entity
   */
  async connect(recordId: string, deviceType: string): Promise<IDeviceConnection> {
    const correlationId = uuidv4();
    this.logger.log({
      message: `Connecting device type ${deviceType} to record ${recordId}`,
      correlationId,
      journey: 'health',
      operation: 'connect_device'
    });
    
    // Validate the device type
    this.validateDeviceType(deviceType);
    
    try {
      // Get the appropriate adapter for the device type
      const adapter = this.getAdapter(deviceType);
      
      // Connect to the device using the adapter with retry mechanism
      const retryOptions: RetryOptions = {
        operation: 'connect_device',
        context: { deviceType, recordId },
        retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION]
      };
      
      const connection = await this.connectionRetry.execute(
        () => adapter.connect(recordId),
        retryOptions
      );
      
      // Save the connection in the database using the enhanced PrismaService
      const deviceConnection = await this.prisma.$healthContext.deviceConnection.create({
        data: {
          recordId,
          deviceType: deviceType.toLowerCase(),
          deviceId: connection.deviceId,
          status: 'connected',
          lastSync: new Date()
        }
      });
      
      this.logger.log({
        message: `Successfully connected ${deviceType} to record ${recordId}`,
        correlationId,
        journey: 'health',
        operation: 'connect_device',
        deviceId: connection.deviceId
      });
      
      return deviceConnection as IDeviceConnection;
    } catch (error) {
      this.logger.error({
        message: `Failed to connect ${deviceType} to record ${recordId}: ${error.message}`,
        correlationId,
        journey: 'health',
        operation: 'connect_device',
        error: error.stack,
        deviceType
      });
      
      // Enhance error with proper classification
      if (error instanceof BadRequestException) {
        throw new HealthJourneyError({
          message: `Invalid device type: ${deviceType}`,
          category: ErrorCategory.VALIDATION,
          type: ErrorType.INVALID_INPUT,
          context: { recordId, deviceType },
          cause: error
        });
      } else {
        throw new HealthJourneyError({
          message: `Failed to connect device: ${error.message}`,
          category: ErrorCategory.TECHNICAL,
          type: ErrorType.INTEGRATION_FAILURE,
          context: { recordId, deviceType },
          cause: error
        });
      }
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
  ): Promise<IHealthMetric[]> {
    const correlationId = uuidv4();
    this.logger.log({
      message: `Retrieving health metrics for record ${recordId} from ${deviceType} between ${startDate.toISOString()} and ${endDate.toISOString()}`,
      correlationId,
      journey: 'health',
      operation: 'get_health_metrics',
      context: { recordId, deviceType, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    });
    
    // Validate the device type
    this.validateDeviceType(deviceType);
    
    try {
      // Verify the device connection exists using a transaction for consistency
      const deviceConnection = await this.prisma.$transaction(async (tx) => {
        const connection = await tx.deviceConnection.findFirst({
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
        
        return connection as IDeviceConnection;
      });
      
      // Get the appropriate adapter for the device type
      const adapter = this.getAdapter(deviceType);
      
      // Retrieve health metrics using the adapter with retry mechanism
      const retryOptions: RetryOptions = {
        operation: 'get_health_metrics',
        context: { deviceType, recordId, startDate, endDate },
        retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT]
      };
      
      const metrics = await this.connectionRetry.execute(
        () => adapter.getHealthMetrics(recordId, startDate, endDate),
        retryOptions
      );
      
      // Update the last sync timestamp using the enhanced PrismaService
      await this.prisma.$healthContext.deviceConnection.update({
        where: { 
          id: deviceConnection.id 
        },
        data: { 
          lastSync: new Date() 
        }
      });
      
      this.logger.log({
        message: `Successfully retrieved ${metrics.length} metrics for record ${recordId} from ${deviceType}`,
        correlationId,
        journey: 'health',
        operation: 'get_health_metrics',
        metricCount: metrics.length
      });
      
      return metrics;
    } catch (error) {
      this.logger.error({
        message: `Failed to retrieve metrics for record ${recordId} from ${deviceType}: ${error.message}`,
        correlationId,
        journey: 'health',
        operation: 'get_health_metrics',
        error: error.stack,
        context: { recordId, deviceType, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      });
      
      // Enhance error with proper classification
      if (error instanceof NotFoundException) {
        throw new HealthJourneyError({
          message: `Device connection not found: ${error.message}`,
          category: ErrorCategory.BUSINESS,
          type: ErrorType.RESOURCE_NOT_FOUND,
          context: { recordId, deviceType },
          cause: error
        });
      } else {
        throw new HealthJourneyError({
          message: `Failed to retrieve health metrics: ${error.message}`,
          category: ErrorCategory.TECHNICAL,
          type: ErrorType.INTEGRATION_FAILURE,
          context: { recordId, deviceType, startDate, endDate },
          cause: error
        });
      }
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
    this.logger.log({
      message: `Disconnecting ${deviceType} from record ${recordId}`,
      correlationId,
      journey: 'health',
      operation: 'disconnect_device',
      context: { recordId, deviceType }
    });
    
    // Validate the device type
    this.validateDeviceType(deviceType);
    
    try {
      // Verify the device connection exists and get the adapter in a transaction
      const deviceConnection = await this.findDeviceConnection(recordId, deviceType);
      const adapter = this.getAdapter(deviceType);
      
      // Disconnect the device using the adapter with retry mechanism
      const retryOptions: RetryOptions = {
        operation: 'disconnect_device',
        context: { deviceType, recordId },
        retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION]
      };
      
      await this.connectionRetry.execute(
        () => adapter.disconnect(recordId),
        retryOptions
      );
      
      // Remove the device connection from the database using the enhanced PrismaService
      await this.prisma.$healthContext.deviceConnection.delete({
        where: {
          id: deviceConnection.id
        }
      });
      
      this.logger.log({
        message: `Successfully disconnected ${deviceType} from record ${recordId}`,
        correlationId,
        journey: 'health',
        operation: 'disconnect_device'
      });
    } catch (error) {
      this.logger.error({
        message: `Failed to disconnect ${deviceType} from record ${recordId}: ${error.message}`,
        correlationId,
        journey: 'health',
        operation: 'disconnect_device',
        error: error.stack,
        context: { recordId, deviceType }
      });
      
      // Enhance error with proper classification
      if (error instanceof NotFoundException) {
        throw new HealthJourneyError({
          message: `Device connection not found: ${error.message}`,
          category: ErrorCategory.BUSINESS,
          type: ErrorType.RESOURCE_NOT_FOUND,
          context: { recordId, deviceType },
          cause: error
        });
      } else {
        throw new HealthJourneyError({
          message: `Failed to disconnect device: ${error.message}`,
          category: ErrorCategory.TECHNICAL,
          type: ErrorType.INTEGRATION_FAILURE,
          context: { recordId, deviceType },
          cause: error
        });
      }
    }
  }

  /**
   * Validates the provided device type against the supported device types in the configuration.
   * @param deviceType - The device type to validate
   * @throws HealthJourneyError if the device type is not supported
   */
  validateDeviceType(deviceType: string): void {
    // Get the list of supported device types from the configuration
    const supportedDeviceTypes = this.configService.get('wearablesSupported')?.split(',') || [];
    
    if (!supportedDeviceTypes.includes(deviceType.toLowerCase())) {
      this.logger.warn({
        message: `Unsupported device type: ${deviceType}`,
        journey: 'health',
        operation: 'validate_device_type',
        deviceType
      });
      
      throw new HealthJourneyError({
        message: `Unsupported device type: ${deviceType}. Supported types are: ${supportedDeviceTypes.join(', ')}.`,
        category: ErrorCategory.VALIDATION,
        type: ErrorType.INVALID_INPUT,
        context: { deviceType, supportedDeviceTypes }
      });
    }
  }

  /**
   * Returns the appropriate adapter for the given device type.
   * @param deviceType - The device type to get the adapter for
   * @returns The appropriate adapter for the given device type
   * @throws HealthJourneyError if the device type is not supported
   */
  getAdapter(deviceType: string): WearableAdapter {
    const type = deviceType.toLowerCase();
    
    if (type === 'googlefit') {
      return this.googleFitAdapter;
    } else if (type === 'healthkit') {
      return this.healthKitAdapter;
    }
    
    throw new HealthJourneyError({
      message: `Unsupported device type: ${deviceType}`,
      category: ErrorCategory.VALIDATION,
      type: ErrorType.INVALID_INPUT,
      context: { deviceType }
    });
  }

  /**
   * Finds a device connection for a specific user and device type.
   * @param recordId - The health record ID to find the connection for
   * @param deviceType - The device type to find the connection for
   * @returns A promise resolving to the found DeviceConnection entity
   * @throws HealthJourneyError if no connection is found
   */
  async findDeviceConnection(recordId: string, deviceType: string): Promise<IDeviceConnection> {
    try {
      const connection = await this.prisma.$healthContext.deviceConnection.findFirst({
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
      
      return connection as IDeviceConnection;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HealthJourneyError({
          message: error.message,
          category: ErrorCategory.BUSINESS,
          type: ErrorType.RESOURCE_NOT_FOUND,
          context: { recordId, deviceType }
        });
      }
      throw error;
    }
  }

  /**
   * Creates a new device connection in the database.
   * @param recordId - The health record ID to create the connection for
   * @param deviceType - The device type to create the connection for
   * @param deviceId - The device ID to associate with the connection
   * @returns A promise resolving to the newly created DeviceConnection entity
   */
  async createDeviceConnection(
    recordId: string,
    deviceType: string,
    deviceId: string
  ): Promise<IDeviceConnection> {
    try {
      const newConnection = await this.prisma.$healthContext.deviceConnection.create({
        data: {
          recordId,
          deviceType: deviceType.toLowerCase(),
          deviceId,
          status: 'connected',
          lastSync: new Date()
        }
      });
      
      return newConnection as IDeviceConnection;
    } catch (error) {
      throw new HealthJourneyError({
        message: `Failed to create device connection: ${error.message}`,
        category: ErrorCategory.TECHNICAL,
        type: ErrorType.DATABASE_ERROR,
        context: { recordId, deviceType, deviceId },
        cause: error
      });
    }
  }

  /**
   * Deletes a device connection from the database.
   * @param recordId - The health record ID associated with the connection
   * @param deviceType - The device type associated with the connection
   * @returns A promise that resolves when the device connection has been deleted
   */
  async deleteDeviceConnection(recordId: string, deviceType: string): Promise<void> {
    try {
      await this.prisma.$healthContext.deviceConnection.deleteMany({
        where: {
          recordId,
          deviceType: deviceType.toLowerCase()
        }
      });
      
      this.logger.log({
        message: `Deleted ${deviceType} connection for record ${recordId}`,
        journey: 'health',
        operation: 'delete_device_connection',
        context: { recordId, deviceType }
      });
    } catch (error) {
      throw new HealthJourneyError({
        message: `Failed to delete device connection: ${error.message}`,
        category: ErrorCategory.TECHNICAL,
        type: ErrorType.DATABASE_ERROR,
        context: { recordId, deviceType },
        cause: error
      });
    }
  }
}