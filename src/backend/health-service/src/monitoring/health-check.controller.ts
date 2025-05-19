import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService as TerminusHealthCheckService,
  HttpHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { HealthCheckService } from './health-check.service';

/**
 * Controller that provides health check endpoints for the Health Service.
 * Exposes endpoints for checking the health of the service and its dependencies.
 */
@ApiTags('health-check')
@Controller('health')
export class HealthCheckController {
  constructor(
    private readonly health: TerminusHealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  /**
   * Performs a comprehensive health check of the service and its dependencies.
   * Checks database connection, disk space, memory usage, and external service availability.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check health of the service and its dependencies' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return this.health.check([
      // Check database connection
      () => this.healthCheckService.checkDatabaseConnection(),
      // Check disk space
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      // Check memory usage
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      // Check external services
      () => this.http.pingCheck('auth-service', 'http://auth-service/api/v1/health'),
      () => this.http.pingCheck('gamification-engine', 'http://gamification-engine/api/v1/health'),
    ]);
  }

  /**
   * Performs a basic liveness check to determine if the service is running.
   * Used by Kubernetes liveness probe to restart the service if it's unresponsive.
   */
  @Get('liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Check if the service is running' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  @ApiResponse({ status: 503, description: 'Service is not running' })
  liveness() {
    return this.health.check([
      // Basic check to see if the service is running
      () => this.healthCheckService.isServiceRunning(),
    ]);
  }

  /**
   * Performs a readiness check to determine if the service is ready to accept requests.
   * Used by Kubernetes readiness probe to determine if traffic should be routed to the service.
   */
  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Check if the service is ready to accept requests' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  readiness() {
    return this.health.check([
      // Check database connection
      () => this.healthCheckService.checkDatabaseConnection(),
      // Check external services that are critical for operation
      () => this.http.pingCheck('auth-service', 'http://auth-service/api/v1/health'),
    ]);
  }
}