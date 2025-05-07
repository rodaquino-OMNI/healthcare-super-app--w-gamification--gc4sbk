import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Import from @austa/interfaces instead of relative paths
import { WearableAdapter } from '@austa/interfaces/health';
import { IHealthMetric, MetricType, MetricSource } from '@austa/interfaces/health';
import { IDeviceConnection, ConnectionStatus, DeviceType } from '@austa/interfaces/health';

// Import from @austa/logging for enhanced logging
import { LoggerService } from '@austa/logging';

// Import from @austa/database for optimized database operations
import { PrismaService } from '@austa/database';
import { HealthContext } from '@austa/database/contexts';

// Import from @austa/errors for specialized error handling
import { ErrorCodes, RetryOptions } from '@austa/errors/constants';
import { Health } from '@austa/errors/journey/health';
import { retry } from '@austa/errors/utils';

/**
 * Adapter for integrating with the Google Fit API.
 * Handles OAuth2 flow, data retrieval, and mapping to application data models.
 */
@Injectable()
export class GoogleFitAdapter extends WearableAdapter {
  private readonly logger: LoggerService;
  private readonly baseUrl = 'https://www.googleapis.com/fitness/v1/users/me';
  private readonly healthContext: HealthContext;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    loggerService: LoggerService
  ) {
    super();
    this.logger = loggerService.createLogger(GoogleFitAdapter.name);
    this.healthContext = new HealthContext(this.prismaService);
  }

  /**
   * Initiates the connection to Google Fit API using OAuth 2.0 flow.
   * @param userId The ID of the user to connect
   * @returns A promise that resolves to a DeviceConnection entity
   */
  async connect(userId: string): Promise<IDeviceConnection> {
    const correlationId = uuidv4();
    this.logger.log(
      `Initiating connection to Google Fit for user ${userId}`,
      { correlationId, userId, deviceType: DeviceType.GOOGLE_FIT }
    );
    
    try {
      const clientId = this.configService.get<string>('GOOGLE_FIT_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_FIT_CLIENT_SECRET');
      const redirectUri = this.configService.get<string>('GOOGLE_FIT_REDIRECT_URI');
      
      if (!clientId || !clientSecret || !redirectUri) {
        this.logger.error(
          `Missing Google Fit API credentials`,
          null,
          { correlationId, userId, errorCode: ErrorCodes.HEALTH_CONFIGURATION_ERROR }
        );
        throw new Health.Devices.DeviceConfigurationError(
          'Missing Google Fit API credentials',
          { userId, deviceType: DeviceType.GOOGLE_FIT }
        );
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
      
      // Exchange authorization code for tokens with retry mechanism for transient errors
      const tokenResponse = await retry(
        async () => {
          return await firstValueFrom(
            this.httpService.post('https://oauth2.googleapis.com/token', {
              client_id: clientId,
              client_secret: clientSecret,
              code: authorizationCode,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri
            })
          );
        },
        {
          maxRetries: RetryOptions.TOKEN_EXCHANGE.MAX_RETRIES,
          backoffFactor: RetryOptions.TOKEN_EXCHANGE.BACKOFF_FACTOR,
          initialDelay: RetryOptions.TOKEN_EXCHANGE.INITIAL_DELAY,
          maxDelay: RetryOptions.TOKEN_EXCHANGE.MAX_DELAY,
          retryableErrors: [
            ErrorCodes.HEALTH_CONNECTION_TIMEOUT,
            ErrorCodes.HEALTH_SERVICE_UNAVAILABLE
          ]
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Create a new device connection record using the health context for optimized database operations
      const deviceConnection = await this.healthContext.createDeviceConnection({
        userId,
        deviceType: DeviceType.GOOGLE_FIT,
        status: ConnectionStatus.CONNECTED,
        connectionData: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000).toISOString()
        },
        lastSyncedAt: new Date()
      });
      
      this.logger.log(
        `Successfully connected to Google Fit for user ${userId}`,
        { correlationId, userId, deviceType: DeviceType.GOOGLE_FIT }
      );
      
      return deviceConnection;
      
    } catch (error) {
      // Classify and handle different types of errors
      if (error instanceof Health.Devices.DeviceConfigurationError) {
        // Re-throw configuration errors as they are already properly classified
        throw error;
      }
      
      // Check for network-related errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        this.logger.error(
          `Network error connecting to Google Fit for user ${userId}: ${error.message}`,
          error.stack,
          { correlationId, userId, errorCode: ErrorCodes.HEALTH_CONNECTION_TIMEOUT }
        );
        throw new Health.Devices.DeviceConnectionFailureError(
          `Network error connecting to Google Fit: ${error.message}`,
          { userId, deviceType: DeviceType.GOOGLE_FIT, transient: true }
        );
      }
      
      // Check for authorization errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        this.logger.error(
          `Authorization error connecting to Google Fit for user ${userId}: ${error.message}`,
          error.stack,
          { correlationId, userId, errorCode: ErrorCodes.HEALTH_AUTHORIZATION_ERROR }
        );
        throw new Health.Devices.DeviceAuthorizationError(
          `Authorization error connecting to Google Fit: ${error.message}`,
          { userId, deviceType: DeviceType.GOOGLE_FIT }
        );
      }
      
      // Handle other errors
      this.logger.error(
        `Failed to connect to Google Fit for user ${userId}: ${error.message}`,
        error.stack,
        { correlationId, userId, errorCode: ErrorCodes.HEALTH_CONNECTION_FAILED }
      );
      throw new Health.Devices.DeviceConnectionFailureError(
        `Failed to connect to Google Fit: ${error.message}`,
        { userId, deviceType: DeviceType.GOOGLE_FIT }
      );
    }
  }

  /**
   * Retrieves health metrics from the Google Fit API for a specific user and date range.
   * @param userId The ID of the user
   * @param startDate The start date for the metrics query
   * @param endDate The end date for the metrics query
   * @returns A promise that resolves to an array of HealthMetric entities
   */
  async getHealthMetrics(userId: string, startDate: Date, endDate: Date): Promise<IHealthMetric[]> {
    const correlationId = uuidv4();
    this.logger.log(
      `Retrieving health metrics from Google Fit for user ${userId}`,
      { 
        correlationId, 
        userId, 
        deviceType: DeviceType.GOOGLE_FIT,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    );
    
    try {
      // Retrieve the device connection for the user using the health context
      const deviceConnection = await this.healthContext.findDeviceConnection({
        userId,
        deviceType: DeviceType.GOOGLE_FIT,
        status: ConnectionStatus.CONNECTED
      });
      
      if (!deviceConnection) {
        this.logger.warn(
          `No active Google Fit connection found for user ${userId}`,
          { correlationId, userId, errorCode: ErrorCodes.HEALTH_NO_DEVICE_CONNECTION }
        );
        throw new Health.Devices.DeviceNotConnectedError(
          'No active Google Fit connection found',
          { userId, deviceType: DeviceType.GOOGLE_FIT }
        );
      }
      
      // Check if the access token is expired and refresh if needed
      await this.refreshTokenIfNeeded(deviceConnection, correlationId);
      
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
        
        try {
          // Make request to Google Fit API with retry mechanism for transient errors
          const response = await retry(
            async () => {
              return await firstValueFrom(
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
            },
            {
              maxRetries: RetryOptions.API_REQUEST.MAX_RETRIES,
              backoffFactor: RetryOptions.API_REQUEST.BACKOFF_FACTOR,
              initialDelay: RetryOptions.API_REQUEST.INITIAL_DELAY,
              maxDelay: RetryOptions.API_REQUEST.MAX_DELAY,
              retryableErrors: [
                ErrorCodes.HEALTH_CONNECTION_TIMEOUT,
                ErrorCodes.HEALTH_SERVICE_UNAVAILABLE
              ]
            }
          );
          
          // Process the response and extract metrics
          const buckets = response.data.bucket || [];
          
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
                    userId,
                    type: metricType as MetricType,
                    timestamp: new Date(point.startTimeNanos / 1000000), // Convert nanos to millis
                    source: MetricSource.GOOGLE_FIT,
                    value: null,
                    unit: null
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
        } catch (error) {
          // Log the error but continue processing other data sources
          this.logger.warn(
            `Error retrieving ${dataSource} metrics from Google Fit for user ${userId}: ${error.message}`,
            { correlationId, userId, dataSource, errorMessage: error.message }
          );
          // Continue with the next data source instead of failing the entire request
          continue;
        }
      }
      
      // Update the last synced time for the device connection using the health context
      await this.healthContext.updateDeviceConnection(
        deviceConnection.id,
        { lastSyncedAt: new Date() }
      );
      
      this.logger.log(
        `Retrieved ${healthMetrics.length} health metrics from Google Fit for user ${userId}`,
        { correlationId, userId, deviceType: DeviceType.GOOGLE_FIT, metricsCount: healthMetrics.length }
      );
      
      return healthMetrics;
      
    } catch (error) {
      // Classify and handle different types of errors
      if (error instanceof Health.Devices.DeviceNotConnectedError ||
          error instanceof Health.Devices.DeviceAuthorizationError) {
        // Re-throw these errors as they are already properly classified
        throw error;
      }
      
      // Check for network-related errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        this.logger.error(
          `Network error retrieving metrics from Google Fit for user ${userId}: ${error.message}`,
          error.stack,
          { correlationId, userId, errorCode: ErrorCodes.HEALTH_CONNECTION_TIMEOUT }
        );
        throw new Health.Metrics.MetricRetrievalError(
          `Network error retrieving metrics from Google Fit: ${error.message}`,
          { userId, deviceType: DeviceType.GOOGLE_FIT, transient: true }
        );
      }
      
      // Handle other errors
      this.logger.error(
        `Failed to retrieve health metrics from Google Fit for user ${userId}: ${error.message}`,
        error.stack,
        { correlationId, userId, errorCode: ErrorCodes.HEALTH_METRICS_RETRIEVAL_FAILED }
      );
      throw new Health.Metrics.MetricRetrievalError(
        `Failed to retrieve health metrics from Google Fit: ${error.message}`,
        { userId, deviceType: DeviceType.GOOGLE_FIT }
      );
    }
  }

  /**
   * Disconnects the user's account from the Google Fit API.
   * @param userId The ID of the user to disconnect
   */
  async disconnect(userId: string): Promise<void> {
    const correlationId = uuidv4();
    this.logger.log(
      `Disconnecting from Google Fit for user ${userId}`,
      { correlationId, userId, deviceType: DeviceType.GOOGLE_FIT }
    );
    
    try {
      // Retrieve the device connection for the user using the health context
      const deviceConnection = await this.healthContext.findDeviceConnection({
        userId,
        deviceType: DeviceType.GOOGLE_FIT
      });
      
      if (!deviceConnection || deviceConnection.status !== ConnectionStatus.CONNECTED) {
        this.logger.warn(
          `No active Google Fit connection found for user ${userId}`,
          { correlationId, userId, errorCode: ErrorCodes.HEALTH_NO_DEVICE_CONNECTION }
        );
        // Not throwing an error here as the end result is the same - the user is disconnected
        return;
      }
      
      const clientId = this.configService.get<string>('GOOGLE_FIT_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_FIT_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        this.logger.error(
          `Missing Google Fit API credentials`,
          null,
          { correlationId, userId, errorCode: ErrorCodes.HEALTH_CONFIGURATION_ERROR }
        );
        throw new Health.Devices.DeviceConfigurationError(
          'Missing Google Fit API credentials',
          { userId, deviceType: DeviceType.GOOGLE_FIT }
        );
      }
      
      // Revoke the access token with retry mechanism for transient errors
      await retry(
        async () => {
          return await firstValueFrom(
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
        {
          maxRetries: RetryOptions.TOKEN_REVOCATION.MAX_RETRIES,
          backoffFactor: RetryOptions.TOKEN_REVOCATION.BACKOFF_FACTOR,
          initialDelay: RetryOptions.TOKEN_REVOCATION.INITIAL_DELAY,
          maxDelay: RetryOptions.TOKEN_REVOCATION.MAX_DELAY,
          retryableErrors: [
            ErrorCodes.HEALTH_CONNECTION_TIMEOUT,
            ErrorCodes.HEALTH_SERVICE_UNAVAILABLE
          ]
        }
      );
      
      // Update the device connection status using the health context
      await this.healthContext.updateDeviceConnection(
        deviceConnection.id,
        {
          status: ConnectionStatus.DISCONNECTED,
          connectionData: null
        }
      );
      
      this.logger.log(
        `Successfully disconnected from Google Fit for user ${userId}`,
        { correlationId, userId, deviceType: DeviceType.GOOGLE_FIT }
      );
      
    } catch (error) {
      // Classify and handle different types of errors
      if (error instanceof Health.Devices.DeviceConfigurationError) {
        // Re-throw configuration errors as they are already properly classified
        throw error;
      }
      
      // Check for network-related errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        this.logger.error(
          `Network error disconnecting from Google Fit for user ${userId}: ${error.message}`,
          error.stack,
          { correlationId, userId, errorCode: ErrorCodes.HEALTH_CONNECTION_TIMEOUT }
        );
        throw new Health.Devices.DeviceDisconnectionError(
          `Network error disconnecting from Google Fit: ${error.message}`,
          { userId, deviceType: DeviceType.GOOGLE_FIT, transient: true }
        );
      }
      
      // Handle other errors
      this.logger.error(
        `Failed to disconnect from Google Fit for user ${userId}: ${error.message}`,
        error.stack,
        { correlationId, userId, errorCode: ErrorCodes.HEALTH_DISCONNECTION_FAILED }
      );
      throw new Health.Devices.DeviceDisconnectionError(
        `Failed to disconnect from Google Fit: ${error.message}`,
        { userId, deviceType: DeviceType.GOOGLE_FIT }
      );
    }
  }

  /**
   * Maps Google Fit data types to standardized metric types used in the application.
   * @param googleFitType The Google Fit data type identifier
   * @returns The standardized metric type
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
    
    // If no mapping is found, return null
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
   * @param correlationId Optional correlation ID for logging
   */
  private async refreshTokenIfNeeded(deviceConnection: IDeviceConnection, correlationId?: string): Promise<void> {
    const expiresAt = new Date(deviceConnection.connectionData.expiresAt);
    const now = new Date();
    
    // If the token expires in less than 5 minutes, refresh it
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      this.logger.log(
        `Refreshing access token for Google Fit connection`,
        { correlationId: correlationId || uuidv4(), userId: deviceConnection.userId }
      );
      
      const clientId = this.configService.get<string>('GOOGLE_FIT_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_FIT_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        this.logger.error(
          `Missing Google Fit API credentials`,
          null,
          { correlationId: correlationId || uuidv4(), userId: deviceConnection.userId, errorCode: ErrorCodes.HEALTH_CONFIGURATION_ERROR }
        );
        throw new Health.Devices.DeviceConfigurationError(
          'Missing Google Fit API credentials',
          { userId: deviceConnection.userId, deviceType: DeviceType.GOOGLE_FIT }
        );
      }
      
      try {
        // Refresh the token with retry mechanism for transient errors
        const refreshResponse = await retry(
          async () => {
            return await firstValueFrom(
              this.httpService.post('https://oauth2.googleapis.com/token', {
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: deviceConnection.connectionData.refreshToken,
                grant_type: 'refresh_token'
              })
            );
          },
          {
            maxRetries: RetryOptions.TOKEN_REFRESH.MAX_RETRIES,
            backoffFactor: RetryOptions.TOKEN_REFRESH.BACKOFF_FACTOR,
            initialDelay: RetryOptions.TOKEN_REFRESH.INITIAL_DELAY,
            maxDelay: RetryOptions.TOKEN_REFRESH.MAX_DELAY,
            retryableErrors: [
              ErrorCodes.HEALTH_CONNECTION_TIMEOUT,
              ErrorCodes.HEALTH_SERVICE_UNAVAILABLE
            ]
          }
        );
        
        const { access_token, expires_in } = refreshResponse.data;
        
        // Update the device connection with the new access token using the health context
        await this.healthContext.updateDeviceConnection(
          deviceConnection.id,
          {
            connectionData: {
              ...deviceConnection.connectionData,
              accessToken: access_token,
              expiresAt: new Date(Date.now() + expires_in * 1000).toISOString()
            }
          }
        );
        
        // Update the in-memory connection data as well
        deviceConnection.connectionData.accessToken = access_token;
        deviceConnection.connectionData.expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
        
        this.logger.log(
          `Successfully refreshed access token for Google Fit connection`,
          { correlationId: correlationId || uuidv4(), userId: deviceConnection.userId }
        );
        
      } catch (error) {
        // Classify and handle different types of errors
        if (error.response && error.response.status === 400 && 
            error.response.data && error.response.data.error === 'invalid_grant') {
          // Invalid refresh token
          this.logger.error(
            `Invalid refresh token for Google Fit connection: ${error.message}`,
            error.stack,
            { correlationId: correlationId || uuidv4(), userId: deviceConnection.userId, errorCode: ErrorCodes.HEALTH_AUTHORIZATION_ERROR }
          );
          throw new Health.Devices.DeviceAuthorizationError(
            'Invalid refresh token for Google Fit connection',
            { userId: deviceConnection.userId, deviceType: DeviceType.GOOGLE_FIT }
          );
        }
        
        // Check for network-related errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
          this.logger.error(
            `Network error refreshing token for Google Fit connection: ${error.message}`,
            error.stack,
            { correlationId: correlationId || uuidv4(), userId: deviceConnection.userId, errorCode: ErrorCodes.HEALTH_CONNECTION_TIMEOUT }
          );
          throw new Health.Devices.TokenRefreshError(
            `Network error refreshing token: ${error.message}`,
            { userId: deviceConnection.userId, deviceType: DeviceType.GOOGLE_FIT, transient: true }
          );
        }
        
        // Handle other errors
        this.logger.error(
          `Failed to refresh access token for Google Fit connection: ${error.message}`,
          error.stack,
          { correlationId: correlationId || uuidv4(), userId: deviceConnection.userId, errorCode: ErrorCodes.HEALTH_TOKEN_REFRESH_FAILED }
        );
        throw new Health.Devices.TokenRefreshError(
          `Failed to refresh access token: ${error.message}`,
          { userId: deviceConnection.userId, deviceType: DeviceType.GOOGLE_FIT }
        );
      }
    }
  }
}