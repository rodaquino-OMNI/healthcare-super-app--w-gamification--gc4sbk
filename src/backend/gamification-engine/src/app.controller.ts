import { Controller, Get, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { AppService, ServiceInfo, HealthCheckResult } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TracingService } from '@app/shared/tracing/tracing.service';

/**
 * Root controller that handles basic endpoints like health checks and service information
 * for the gamification engine. Provides monitoring endpoints for service health and status.
 */
@ApiTags('System')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Health check endpoint for monitoring and observability
   * @returns Health check result
   */
  @Get('health')
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async health(): Promise<HealthCheckResult> {
    const span = this.tracingService.startSpan('health-check');
    
    try {
      const health = await this.appService.checkHealth();
      
      if (health.status === 'error') {
        throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
      }
      
      return health;
    } catch (error) {
      this.logger.error('Health check failed', error);
      span.setTag('error', true);
      span.log({ event: 'error', 'error.object': error });
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Liveness probe endpoint for Kubernetes
   * @returns Simple OK response
   */
  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Readiness probe endpoint for Kubernetes
   * @returns Health check result
   */
  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness(): Promise<HealthCheckResult> {
    try {
      // Use the same health check logic as the health endpoint
      const health = await this.appService.checkHealth();
      
      if (health.status === 'error') {
        throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
      }
      
      return health;
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      throw error;
    }
  }

  /**
   * Service information endpoint
   * @returns Service information
   */
  @Get('info')
  @ApiOperation({ summary: 'Get service information' })
  @ApiResponse({ status: 200, description: 'Service information retrieved successfully' })
  async getServiceInfo(): Promise<ServiceInfo> {
    const span = this.tracingService.startSpan('get-service-info');
    
    try {
      return await this.appService.getServiceInfo();
    } catch (error) {
      this.logger.error('Failed to get service information', error);
      span.setTag('error', true);
      span.log({ event: 'error', 'error.object': error });
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Simple status endpoint
   * @returns Service status
   */
  @Get('status')
  @ApiOperation({ summary: 'Get service status' })
  @ApiResponse({ status: 200, description: 'Service status retrieved successfully' })
  getStatus(): { status: string; uptime: number } {
    return {
      status: this.appService.getStatus(),
      uptime: this.appService.getUptime(),
    };
  }

  /**
   * Version endpoint
   * @returns Service version
   */
  @Get('version')
  @ApiOperation({ summary: 'Get service version' })
  @ApiResponse({ status: 200, description: 'Service version retrieved successfully' })
  async getVersion(): Promise<{ version: string }> {
    const info = await this.appService.getServiceInfo();
    return { version: info.version };
  }
}