import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Use standardized TypeScript path aliases
import { Configuration } from '@app/health/config/configuration';
import { WearableAdapter } from '@austa/interfaces/journey/health';
import { IHealthMetric, MetricType, MetricSource } from '@austa/interfaces/journey/health';
import { IDeviceConnection, ConnectionStatus, DeviceType } from '@austa/interfaces/journey/health';
import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';
import { ConnectionRetry, RetryOptions } from '@austa/database/connection';
import { HealthJourneyError, ErrorCategory, ErrorType } from '@austa/errors';
import { HealthMetricsErrors } from '@austa/errors/journey/health';

/**
 * Adapter for integrating with the Google Fit API.
 * Handles OAuth2 flow, data retrieval, and token management for Google Fit.
 */
@Injectable()
export class GoogleFitAdapter extends WearableAdapter {
  private readonly logger: LoggerService;
  private readonly baseUrl = 'https://www.googleapis.com/fitness/v1/users/me';
  private readonly connectionRetry: ConnectionRetry;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: Configuration,
    private readonly prismaService: PrismaService,
    loggerService: LoggerService
  ) {
    super();
    this.logger = loggerService.createLogger('GoogleFitAdapter');
    this.connectionRetry = new ConnectionRetry({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2,
      jitter: true
    });
  }

  /**
   * Initiates the connection to Google Fit API using OAuth 2.0 flow.
   * @param recordId The ID of the user's health record to connect
   * @returns A promise that resolves to a DeviceConnection entity
   */
  async connect(recordId: string): Promise<IDeviceConnection> {
    const correlationId = uuidv4();
    this.logger.log({
      message: `Initiating connection to Google Fit for record ${recordId}`,
      correlationId,
      journey: 'health',
      operation: 'connect_googlefit'
    });
    
    try {
      const clientId = this.configService.get<string>('GOOGLE_FIT_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_FIT_CLIENT_SECRET');
      const redirectUri = this.configService.get<string>('GOOGLE_FIT_REDIRECT_URI');
      
      if (!clientId || !clientSecret || !redirectUri) {
        this.logger.error({
          message: 'Missing Google Fit API credentials',
          correlationId,
          journey: 'health',
          operation: 'connect_googlefit',
          context: { recordId }
        });
        
        throw new HealthJourneyError({
          message: 'Missing Google Fit API credentials',
          category: ErrorCategory.CONFIGURATION,
          type: ErrorType.MISSING_CONFIGURATION,
          context: { recordId, service: 'GoogleFit' }
        });
      }
      
      // Note: In a real implementation, we would redirect the user to the Google OAuth consent screen
      // and handle the callback with the authorization code
      // For this example, we'll assume the authorization code has been obtained
      
      // This would be the URL to redirect the user to
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=https://www.googleapis.com/auth/fitness.activity.read ` +
        `https://www.googleapis.com/auth/fitness.blood_glucose.read ` +
        `https://www.googleapis.com/auth/fitness.blood_pressure.read ` +
        `https://www.googleapis.com/auth/fitness.body.read ` +
        `https://www.googleapis.com/auth/fitness.heart_rate.read ` +
        `https://www.googleapis.com/auth/fitness.sleep.read`;
      
      // In a real implementation, we would redirect the user to authUrl
      // Then, in the callback handler, we would exchange the authorization code for tokens
      
      // For this example, we'll assume we have an authorization code
      const authorizationCode = 'example_authorization_code';
      
      // Exchange authorization code for tokens with retry mechanism
      const retryOptions: RetryOptions = {
        operation: 'google_fit_token_exchange',
        context: { recordId },
        retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT]
      };
      
      const tokenResponse = await this.connectionRetry.execute(
        async () => {
          const response = await firstValueFrom(
            this.httpService.post('https://oauth2.googleapis.com/token', {
              client_id: clientId,
              client_secret: clientSecret,
              code: authorizationCode,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri
            })
          );
          return response.data;
        },
        retryOptions
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse;
      
      // Create a new device connection record using the enhanced PrismaService
      const deviceConnection = await this.prismaService.$healthContext.deviceConnection.create({
        data: {
          recordId,
          deviceType: DeviceType.FITNESS_TRACKER,
          deviceId: 'google_fit',
          status: ConnectionStatus.CONNECTED,
          lastSync: new Date(),
          connectionData: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000).toISOString()
          }
        }
      });
      
      this.logger.log({
        message: `Successfully connected to Google Fit for record ${recordId}`,
        correlationId,
        journey: 'health',
        operation: 'connect_googlefit',
        context: { recordId }
      });
      
      return deviceConnection as IDeviceConnection;
      
    } catch (error) {
      this.logger.error({
        message: `Failed to connect to Google Fit for record ${recordId}`,
        correlationId,
        journey: 'health',
        operation: 'connect_googlefit',
        error: error.stack,
        context: { recordId }
      });
      
      if (error instanceof HealthJourneyError) {
        throw error;
      }
      
      throw new HealthJourneyError({
        message: `Failed to connect to Google Fit: ${error.message}`,
        category: ErrorCategory.TECHNICAL,
        type: ErrorType.INTEGRATION_FAILURE,
        context: { recordId, service: 'GoogleFit' },
        cause: error
      });
    }
  }

  /**
   * Retrieves health metrics from the Google Fit API for a specific user and date range.
   * @param recordId The ID of the user's health record
   * @param startDate The start date for the metrics query
   * @param endDate The end date for the metrics query
   * @returns A promise that resolves to an array of HealthMetric entities
   */
  async getHealthMetrics(recordId: string, startDate: Date, endDate: Date): Promise<IHealthMetric[]> {
    const correlationId = uuidv4();
    this.logger.log({
      message: `Retrieving health metrics from Google Fit for record ${recordId}`,
      correlationId,
      journey: 'health',
      operation: 'get_googlefit_metrics',
      context: {
        recordId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    try {
      // Retrieve the device connection for the user using the enhanced PrismaService
      const deviceConnection = await this.prismaService.$healthContext.deviceConnection.findFirst({
        where: {
          recordId,
          deviceType: DeviceType.FITNESS_TRACKER,
          deviceId: 'google_fit'
        }
      });
      
      if (!deviceConnection || deviceConnection.status !== ConnectionStatus.CONNECTED) {
        this.logger.warn({
          message: `No active Google Fit connection found for record ${recordId}`,
          correlationId,
          journey: 'health',
          operation: 'get_googlefit_metrics',
          context: { recordId }
        });
        
        throw new HealthMetricsErrors.DeviceNotConnectedError({
          message: 'No active Google Fit connection found',
          context: { recordId, deviceType: DeviceType.FITNESS_TRACKER }
        });
      }
      
      // Check if the access token is expired and refresh if needed
      await this.refreshTokenIfNeeded(deviceConnection as IDeviceConnection, correlationId);
      
      const accessToken = deviceConnection.connectionData.accessToken;
      
      // Define the data sources to query
      const dataSources = [
        'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
        'derived:com.google.weight:com.google.android.gms:merge_weight',
        'derived:com.google.blood_pressure:com.google.android.gms:merged',
        'derived:com.google.blood_glucose:com.google.android.gms:merged',
        'derived:com.google.sleep.segment:com.google.android.gms:merged'
      ];
      
      // Collect metrics from all data sources
      const healthMetrics: IHealthMetric[] = [];
      
      for (const dataSource of dataSources) {
        // Construct request payload for Google Fit Data Sets API
        const requestBody = {
          aggregateBy: [{
            dataTypeName: dataSource
          }],
          bucketByTime: {
            durationMillis: 86400000 // 1 day in milliseconds
          },
          startTimeMillis: startDate.getTime(),
          endTimeMillis: endDate.getTime()
        };
        
        // Define retry options for the API request
        const retryOptions: RetryOptions = {
          operation: 'google_fit_data_fetch',
          context: { recordId, dataSource },
          retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT]
        };
        
        // Make request to Google Fit API with retry mechanism
        const response = await this.connectionRetry.execute(
          async () => {
            const result = await firstValueFrom(
              this.httpService.post(
                `${this.baseUrl}/dataset:aggregate`,
                requestBody,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              )
            );
            return result.data;
          },
          retryOptions
        );
        
        // Process the response and extract metrics
        const buckets = response.bucket || [];
        
        for (const bucket of buckets) {
          for (const dataset of bucket.dataset || []) {
            for (const point of dataset.point || []) {
              for (const value of point.value || []) {
                const metricType = this.mapGoogleFitTypeToMetricType(dataset.dataSourceId);
                
                if (!metricType) {
                  continue; // Skip unrecognized data types
                }
                
                // Create a new health metric
                const metric: IHealthMetric = {
                  id: uuidv4(),
                  recordId,
                  type: metricType,
                  timestamp: new Date(point.startTimeNanos / 1000000), // Convert nanos to millis
                  source: MetricSource.WEARABLE_DEVICE,
                  notes: null,
                  trend: null,
                  isAbnormal: false
                };
                
                // Extract and convert the value based on the metric type
                switch (metricType) {
                  case MetricType.STEPS:
                    metric.value = value.intVal;
                    metric.unit = 'steps';
                    break;
                  case MetricType.HEART_RATE:
                    metric.value = value.fpVal;
                    metric.unit = 'bpm';
                    break;
                  case MetricType.WEIGHT:
                    // Google Fit stores weight in kg, convert if necessary
                    metric.value = value.fpVal;
                    metric.unit = 'kg';
                    break;
                  case MetricType.BLOOD_PRESSURE:
                    // Google Fit stores blood pressure as systolic/diastolic in mmHg
                    metric.value = `${value.mapVal.find(m => m.key === 'systolic').value.fpVal}/${
                      value.mapVal.find(m => m.key === 'diastolic').value.fpVal}`;
                    metric.unit = 'mmHg';
                    break;
                  case MetricType.BLOOD_GLUCOSE:
                    // Google Fit stores blood glucose in mmol/L, convert to mg/dL if needed
                    metric.value = this.convertUnit(value.fpVal, 'mmol/L', 'mg/dL');
                    metric.unit = 'mg/dL';
                    break;
                  case MetricType.SLEEP:
                    // Sleep stages are encoded as integers in Google Fit
                    metric.value = this.mapSleepStage(value.intVal);
                    metric.unit = 'stage';
                    break;
                  default:
                    metric.value = value.fpVal || value.intVal;
                    metric.unit = 'unknown';
                }
                
                healthMetrics.push(metric);
              }
            }
          }
        }
      }
      
      // Update the last synced time for the device connection using the enhanced PrismaService
      await this.prismaService.$healthContext.deviceConnection.update({
        where: { id: deviceConnection.id },
        data: { lastSync: new Date() }
      });
      
      this.logger.log({
        message: `Retrieved ${healthMetrics.length} health metrics from Google Fit for record ${recordId}`,
        correlationId,
        journey: 'health',
        operation: 'get_googlefit_metrics',
        context: { recordId, metricCount: healthMetrics.length }
      });
      
      return healthMetrics;
      
    } catch (error) {
      this.logger.error({
        message: `Failed to retrieve health metrics from Google Fit for record ${recordId}`,
        correlationId,
        journey: 'health',
        operation: 'get_googlefit_metrics',
        error: error.stack,
        context: { recordId }
      });
      
      if (error instanceof HealthJourneyError) {
        throw error;
      }
      
      throw new HealthJourneyError({
        message: `Failed to retrieve health metrics: ${error.message}`,
        category: ErrorCategory.TECHNICAL,
        type: ErrorType.INTEGRATION_FAILURE,
        context: { recordId, service: 'GoogleFit' },
        cause: error
      });
    }
  }

  /**
   * Disconnects the user's account from the Google Fit API.
   * @param recordId The ID of the user's health record to disconnect
   */
  async disconnect(recordId: string): Promise<void> {
    const correlationId = uuidv4();
    this.logger.log({
      message: `Disconnecting from Google Fit for record ${recordId}`,
      correlationId,
      journey: 'health',
      operation: 'disconnect_googlefit',
      context: { recordId }
    });
    
    try {
      // Retrieve the device connection for the user using the enhanced PrismaService
      const deviceConnection = await this.prismaService.$healthContext.deviceConnection.findFirst({
        where: {
          recordId,
          deviceType: DeviceType.FITNESS_TRACKER,
          deviceId: 'google_fit'
        }
      });
      
      if (!deviceConnection || deviceConnection.status !== ConnectionStatus.CONNECTED) {
        this.logger.warn({
          message: `No active Google Fit connection found for record ${recordId}`,
          correlationId,
          journey: 'health',
          operation: 'disconnect_googlefit',
          context: { recordId }
        });
        return;
      }
      
      const clientId = this.configService.get<string>('GOOGLE_FIT_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_FIT_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        this.logger.error({
          message: 'Missing Google Fit API credentials',
          correlationId,
          journey: 'health',
          operation: 'disconnect_googlefit',
          context: { recordId }
        });
        
        throw new HealthJourneyError({
          message: 'Missing Google Fit API credentials',
          category: ErrorCategory.CONFIGURATION,
          type: ErrorType.MISSING_CONFIGURATION,
          context: { recordId, service: 'GoogleFit' }
        });
      }
      
      // Define retry options for token revocation
      const retryOptions: RetryOptions = {
        operation: 'google_fit_token_revocation',
        context: { recordId },
        retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT]
      };
      
      // Revoke the access token with retry mechanism
      await this.connectionRetry.execute(
        async () => {
          await firstValueFrom(
            this.httpService.post(
              'https://oauth2.googleapis.com/revoke',
              `token=${deviceConnection.connectionData.accessToken}`,
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            )
          );
        },
        retryOptions
      );
      
      // Update the device connection status using the enhanced PrismaService
      await this.prismaService.$healthContext.deviceConnection.update({
        where: { id: deviceConnection.id },
        data: {
          status: ConnectionStatus.DISCONNECTED,
          connectionData: null
        }
      });
      
      this.logger.log({
        message: `Successfully disconnected from Google Fit for record ${recordId}`,
        correlationId,
        journey: 'health',
        operation: 'disconnect_googlefit',
        context: { recordId }
      });
      
    } catch (error) {
      this.logger.error({
        message: `Failed to disconnect from Google Fit for record ${recordId}`,
        correlationId,
        journey: 'health',
        operation: 'disconnect_googlefit',
        error: error.stack,
        context: { recordId }
      });
      
      if (error instanceof HealthJourneyError) {
        throw error;
      }
      
      throw new HealthJourneyError({
        message: `Failed to disconnect from Google Fit: ${error.message}`,
        category: ErrorCategory.TECHNICAL,
        type: ErrorType.INTEGRATION_FAILURE,
        context: { recordId, service: 'GoogleFit' },
        cause: error
      });
    }
  }

  /**
   * Maps Google Fit data types to standardized metric types used in the application.
   * @param googleFitType The Google Fit data type identifier
   * @returns The standardized metric type or null if no mapping exists
   */
  private mapGoogleFitTypeToMetricType(googleFitType: string): MetricType | null {
    if (googleFitType.includes('step_count')) {
      return MetricType.STEPS;
    } else if (googleFitType.includes('heart_rate')) {
      return MetricType.HEART_RATE;
    } else if (googleFitType.includes('weight')) {
      return MetricType.WEIGHT;
    } else if (googleFitType.includes('blood_pressure')) {
      return MetricType.BLOOD_PRESSURE;
    } else if (googleFitType.includes('blood_glucose')) {
      return MetricType.BLOOD_GLUCOSE;
    } else if (googleFitType.includes('sleep')) {
      return MetricType.SLEEP;
    }
    
    return null;
  }

  /**
   * Converts a value from Google Fit's unit to the application's standard unit.
   * @param value The value to convert
   * @param fromUnit The source unit
   * @param toUnit The target unit
   * @returns The converted value
   */
  private convertUnit(value: number, fromUnit: string, toUnit: string): number {
    // Handle various unit conversions
    if (fromUnit === 'mmol/L' && toUnit === 'mg/dL') {
      // Convert blood glucose from mmol/L to mg/dL
      return value * 18.0182;
    } else if (fromUnit === 'kg' && toUnit === 'lb') {
      // Convert weight from kg to lb
      return value * 2.20462;
    } else if (fromUnit === 'lb' && toUnit === 'kg') {
      // Convert weight from lb to kg
      return value / 2.20462;
    } else if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
      // Convert blood glucose from mg/dL to mmol/L
      return value / 18.0182;
    }
    
    // If no conversion is needed or supported, return the original value
    return value;
  }

  /**
   * Maps Google Fit sleep stage values to human-readable stage names.
   * @param sleepStageValue The Google Fit sleep stage value
   * @returns The human-readable sleep stage name
   */
  private mapSleepStage(sleepStageValue: number): string {
    switch (sleepStageValue) {
      case 1:
        return 'AWAKE';
      case 2:
        return 'LIGHT';
      case 3:
        return 'DEEP';
      case 4:
        return 'REM';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Refreshes the access token if it's expired or about to expire.
   * @param deviceConnection The device connection containing the tokens
   * @param correlationId The correlation ID for tracing
   */
  private async refreshTokenIfNeeded(deviceConnection: IDeviceConnection, correlationId: string): Promise<void> {
    const expiresAt = new Date(deviceConnection.connectionData.expiresAt);
    const now = new Date();
    
    // If the token expires in less than 5 minutes, refresh it
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      this.logger.log({
        message: 'Refreshing access token for Google Fit connection',
        correlationId,
        journey: 'health',
        operation: 'refresh_googlefit_token',
        context: { deviceConnectionId: deviceConnection.id }
      });
      
      const clientId = this.configService.get<string>('GOOGLE_FIT_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_FIT_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        this.logger.error({
          message: 'Missing Google Fit API credentials',
          correlationId,
          journey: 'health',
          operation: 'refresh_googlefit_token',
          context: { deviceConnectionId: deviceConnection.id }
        });
        
        throw new HealthJourneyError({
          message: 'Missing Google Fit API credentials',
          category: ErrorCategory.CONFIGURATION,
          type: ErrorType.MISSING_CONFIGURATION,
          context: { deviceConnectionId: deviceConnection.id, service: 'GoogleFit' }
        });
      }
      
      try {
        // Define retry options for token refresh
        const retryOptions: RetryOptions = {
          operation: 'google_fit_token_refresh',
          context: { deviceConnectionId: deviceConnection.id },
          retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT]
        };
        
        // Refresh the token with retry mechanism
        const refreshResponse = await this.connectionRetry.execute(
          async () => {
            const response = await firstValueFrom(
              this.httpService.post('https://oauth2.googleapis.com/token', {
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: deviceConnection.connectionData.refreshToken,
                grant_type: 'refresh_token'
              })
            );
            return response.data;
          },
          retryOptions
        );
        
        const { access_token, expires_in } = refreshResponse;
        
        // Update the device connection with the new access token using the enhanced PrismaService
        await this.prismaService.$healthContext.deviceConnection.update({
          where: { id: deviceConnection.id },
          data: {
            connectionData: {
              ...deviceConnection.connectionData,
              accessToken: access_token,
              expiresAt: new Date(Date.now() + expires_in * 1000).toISOString()
            }
          }
        });
        
        this.logger.log({
          message: 'Successfully refreshed access token for Google Fit connection',
          correlationId,
          journey: 'health',
          operation: 'refresh_googlefit_token',
          context: { deviceConnectionId: deviceConnection.id }
        });
        
      } catch (error) {
        this.logger.error({
          message: 'Failed to refresh access token for Google Fit connection',
          correlationId,
          journey: 'health',
          operation: 'refresh_googlefit_token',
          error: error.stack,
          context: { deviceConnectionId: deviceConnection.id }
        });
        
        if (error instanceof HealthJourneyError) {
          throw error;
        }
        
        throw new HealthJourneyError({
          message: `Failed to refresh access token: ${error.message}`,
          category: ErrorCategory.TECHNICAL,
          type: ErrorType.INTEGRATION_FAILURE,
          context: { deviceConnectionId: deviceConnection.id, service: 'GoogleFit' },
          cause: error
        });
      }
    }
  }
}