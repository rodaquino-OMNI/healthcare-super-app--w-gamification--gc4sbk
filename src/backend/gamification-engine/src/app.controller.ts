import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  PrismaHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from './prisma.service';
import { AppService } from './app.service';
import { RedisHealthIndicator } from '@nestjs/terminus/dist/health-indicator/redis.health';
import { Transport } from '@nestjs/microservices';

/**
 * Root controller for the Gamification Engine service.
 * Provides health check endpoints for monitoring and service discovery.
 */
@ApiTags('health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly redisHealthIndicator: RedisHealthIndicator,
    private readonly microserviceHealthIndicator: MicroserviceHealthIndicator,
  ) {}

  /**
   * Basic health check endpoint that returns service information.
   * Used for service discovery and basic monitoring.
   */
  @Get()
  @ApiOperation({ summary: 'Get service information' })
  @ApiResponse({
    status: 200,
    description: 'Service information retrieved successfully',
  })
  getServiceInfo() {
    return this.appService.getServiceInfo();
  }

  /**
   * Health check endpoint that verifies if the service is running.
   * Used for monitoring and observability.
   */
  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  async checkHealth(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      async (): Promise<HealthIndicatorResult> => ({
        gamificationEngine: {
          status: 'up',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
      }),
    ]);
  }

  /**
   * Liveness probe endpoint that verifies if the service is running.
   * Used by Kubernetes to determine if the pod should be restarted.
   */
  @Get('health/liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Check service liveness' })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not alive',
  })
  async checkLiveness(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      async (): Promise<HealthIndicatorResult> => ({
        gamificationEngine: {
          status: 'up',
        },
      }),
    ]);
  }

  /**
   * Readiness probe endpoint that verifies if the service is ready to accept requests.
   * Checks database connectivity and other dependencies.
   * Used by Kubernetes to determine if traffic should be sent to the pod.
   */
  @Get('health/readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Check service readiness' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready',
  })
  async checkReadiness(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      // Check database connectivity
      async () => this.prismaHealthIndicator.pingCheck('database', () => 
        this.prismaService.$queryRaw`SELECT 1`
      ),
      // Check Redis connectivity
      async () => this.redisHealthIndicator.checkHealth('redis', { type: 'redis', timeout: 300 }),
      // Check Kafka connectivity
      async () => this.microserviceHealthIndicator.pingCheck('kafka', {
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gamification-engine',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
        },
        timeout: 300,
      }),
    ]);
  }

  /**
   * Metrics endpoint that exposes Prometheus metrics for monitoring.
   * Used by Prometheus to scrape metrics for the service.
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get service metrics' })
  @ApiResponse({
    status: 200,
    description: 'Service metrics retrieved successfully',
  })
  getMetrics() {
    return this.appService.getMetrics();
  }
}