import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './common/database/prisma.service';
import { BaseConsumer } from './common/kafka/base-consumer.abstract';
import { BaseProducer } from './common/kafka/base-producer.abstract';
import { IErrorResponse } from './common/interfaces/error.interface';
import { JourneyType } from './common/interfaces/journey.interface';
import { HealthStatus, ServiceInfo, DatabaseStatus, KafkaStatus } from './common/interfaces';

/**
 * Root service for the Gamification Engine
 * Provides health check functionality and service information
 */
@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private serviceStartTime: Date;
  private serviceVersion: string;
  private serviceEnvironment: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly kafkaConsumer: BaseConsumer,
    private readonly kafkaProducer: BaseProducer,
  ) {}

  /**
   * Initialize service on module initialization
   */
  async onModuleInit(): Promise<void> {
    this.serviceStartTime = new Date();
    this.serviceVersion = this.configService.get<string>('app.version', '1.0.0');
    this.serviceEnvironment = this.configService.get<string>('app.environment', 'development');
    this.logger.log(`Gamification Engine initialized - Version: ${this.serviceVersion}, Environment: ${this.serviceEnvironment}`);
  }

  /**
   * Get service information
   * @returns ServiceInfo object with service details
   */
  getServiceInfo(): ServiceInfo {
    return {
      name: 'Gamification Engine',
      version: this.serviceVersion,
      environment: this.serviceEnvironment,
      uptime: this.getUptime(),
      startTime: this.serviceStartTime.toISOString(),
      supportedJourneys: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
    };
  }

  /**
   * Check health of all service dependencies
   * @returns HealthStatus object with health check results
   */
  async checkHealth(): Promise<HealthStatus> {
    this.logger.debug('Performing health check');
    
    const [databaseStatus, kafkaStatus] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkKafkaHealth(),
    ]);

    const isHealthy = databaseStatus.isHealthy && kafkaStatus.isHealthy;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: this.serviceVersion,
      uptime: this.getUptime(),
      dependencies: {
        database: databaseStatus,
        kafka: kafkaStatus,
      },
    };
  }

  /**
   * Check database connection health
   * @returns DatabaseStatus object with database health information
   */
  private async checkDatabaseHealth(): Promise<DatabaseStatus> {
    try {
      // Execute a simple query to check database connectivity
      await this.prismaService.$queryRaw`SELECT 1`;
      
      // Get connection pool metrics
      const poolMetrics = await this.prismaService.getConnectionPoolMetrics();
      
      return {
        isHealthy: true,
        message: 'Database connection is healthy',
        latency: poolMetrics.queryLatencyMs,
        connectionPool: {
          total: poolMetrics.totalConnections,
          active: poolMetrics.activeConnections,
          idle: poolMetrics.idleConnections,
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        isHealthy: false,
        message: 'Database connection failed',
        error: this.formatError(error),
      };
    }
  }

  /**
   * Check Kafka connection health
   * @returns KafkaStatus object with Kafka health information
   */
  private async checkKafkaHealth(): Promise<KafkaStatus> {
    try {
      // Check if Kafka consumer is connected
      const consumerConnected = this.kafkaConsumer.isConnected();
      
      // Check if Kafka producer is connected
      const producerConnected = this.kafkaProducer.isConnected();
      
      // Get consumer metrics
      const consumerMetrics = this.kafkaConsumer.getMetrics();
      
      // Get producer metrics
      const producerMetrics = this.kafkaProducer.getMetrics();
      
      const isHealthy = consumerConnected && producerConnected;
      
      return {
        isHealthy,
        message: isHealthy ? 'Kafka connections are healthy' : 'One or more Kafka connections are unhealthy',
        consumer: {
          connected: consumerConnected,
          lagByPartition: consumerMetrics.lagByPartition || {},
          messagesProcessed: consumerMetrics.messagesProcessed || 0,
          lastMessageProcessedAt: consumerMetrics.lastMessageProcessedAt,
          errors: consumerMetrics.errors || 0,
        },
        producer: {
          connected: producerConnected,
          messagesSent: producerMetrics.messagesSent || 0,
          lastMessageSentAt: producerMetrics.lastMessageSentAt,
          errors: producerMetrics.errors || 0,
        },
      };
    } catch (error) {
      this.logger.error('Kafka health check failed', error);
      return {
        isHealthy: false,
        message: 'Kafka connection check failed',
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get service uptime in seconds
   * @returns number of seconds the service has been running
   */
  private getUptime(): number {
    const uptimeMs = Date.now() - this.serviceStartTime.getTime();
    return Math.floor(uptimeMs / 1000);
  }

  /**
   * Format error for health check responses
   * @param error The error to format
   * @returns Formatted error response
   */
  private formatError(error: any): IErrorResponse {
    return {
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      details: this.serviceEnvironment === 'development' ? error.stack : undefined,
    };
  }
}