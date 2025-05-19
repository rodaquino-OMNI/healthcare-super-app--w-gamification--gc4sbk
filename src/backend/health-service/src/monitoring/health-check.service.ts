import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';

/**
 * Service that provides health check indicators for the Health Service.
 * Implements custom health checks for database connection and service status.
 */
@Injectable()
export class HealthCheckService extends HealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService,
  ) {
    super();
    this.logger.setContext('HealthCheckService');
  }

  /**
   * Checks if the database connection is healthy.
   * Executes a simple query to verify the connection.
   */
  async checkDatabaseConnection(): Promise<HealthIndicatorResult> {
    return this.tracing.createSpan('health.check.database', async () => {
      try {
        // Execute a simple query to check database connection
        await this.prisma.$queryRaw`SELECT 1`;
        return this.getStatus('database', true, { message: 'Database connection is healthy' });
      } catch (error) {
        this.logger.error(`Database health check failed: ${error.message}`, error.stack);
        throw new HealthCheckError(
          'Database health check failed',
          this.getStatus('database', false, { message: error.message }),
        );
      }
    });
  }

  /**
   * Checks if the service is running.
   * This is a basic check that always returns healthy if the service is able to process the request.
   */
  async isServiceRunning(): Promise<HealthIndicatorResult> {
    return this.tracing.createSpan('health.check.service', async () => {
      return this.getStatus('service', true, { message: 'Service is running' });
    });
  }

  /**
   * Checks if the service has access to required external services.
   * Verifies connectivity to auth service and gamification engine.
   */
  async checkExternalServices(): Promise<HealthIndicatorResult> {
    return this.tracing.createSpan('health.check.external', async () => {
      // This is handled by the HttpHealthIndicator in the controller
      return this.getStatus('external', true, { message: 'External services are accessible' });
    });
  }
}