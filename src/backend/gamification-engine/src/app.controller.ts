import { Controller, Get, HttpStatus, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoggerService } from '@app/shared/logging/logger.service';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { AppService, HealthCheckResult, ServiceInfo } from './app.service';
import { PrometheusService } from '@app/shared/monitoring/prometheus.service';

/**
 * Root controller for the Gamification Engine service.
 * Provides health check endpoints and service information.
 */
@ApiTags('System')
@Controller()
@UseFilters(AllExceptionsFilter)
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: LoggerService,
    private readonly prometheusService: PrometheusService,
  ) {}

  /**
   * Health check endpoint for monitoring and observability.
   * Returns the health status of the service and its dependencies.
   */
  @Get('health')
  @ApiOperation({ summary: 'Check service health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        details: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            kafka: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                consumerLag: { type: 'number', example: 0 },
              },
            },
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time', example: '2023-04-01T12:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Service is unhealthy',
  })
  async checkHealth(): Promise<HealthCheckResult> {
    this.logger.log('Health check requested', 'AppController');
    
    // Increment health check counter for monitoring
    this.prometheusService.incrementCounter('gamification_health_checks_total');
    
    const healthResult = await this.appService.checkHealth();
    
    if (healthResult.status === 'error') {
      this.logger.warn('Service is unhealthy', 'AppController');
    } else {
      this.logger.log('Service is healthy', 'AppController');
    }
    
    return healthResult;
  }

  /**
   * Service information endpoint for service discovery.
   * Returns detailed information about the service, including version,
   * status, and metrics.
   */
  @Get('info')
  @ApiOperation({ summary: 'Get service information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Gamification Engine' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string', example: 'Processes events from all journeys to drive user engagement through achievements, challenges, and rewards' },
        status: { type: 'string', example: 'available' },
        uptime: { type: 'number', example: 3600 },
        startTime: { type: 'string', format: 'date-time', example: '2023-04-01T12:00:00.000Z' },
        environment: { type: 'string', example: 'production' },
        dependencies: {
          type: 'object',
          properties: {
            database: { type: 'boolean', example: true },
            kafka: { type: 'boolean', example: true },
            redis: { type: 'boolean', example: true },
          },
        },
        metrics: {
          type: 'object',
          properties: {
            eventProcessingRate: { type: 'number', example: 120 },
            activeUsers: { type: 'number', example: 1500 },
            achievementsAwarded: { type: 'number', example: 750 },
            averageProcessingTime: { type: 'number', example: 45 },
          },
        },
      },
    },
  })
  async getServiceInfo(): Promise<ServiceInfo> {
    this.logger.log('Service info requested', 'AppController');
    return this.appService.getServiceInfo();
  }

  /**
   * Root endpoint that confirms the service is running.
   * Used for basic availability checks.
   */
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is running',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Gamification Engine API is running' },
        status: { type: 'string', example: 'available' },
        timestamp: { type: 'string', format: 'date-time', example: '2023-04-01T12:00:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  async getRoot() {
    const info = await this.appService.getServiceInfo();
    
    return {
      message: 'Gamification Engine API is running',
      status: this.appService.getStatus(),
      timestamp: new Date().toISOString(),
      version: info.version,
    };
  }
}