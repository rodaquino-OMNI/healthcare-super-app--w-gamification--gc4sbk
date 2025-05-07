import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.module';
import { KafkaHealthService } from './kafka/kafka.health.service';
import { KafkaMonitoringService } from './kafka/kafka.monitoring.service';
import { HealthCheckError } from '@nestjs/terminus';
import { PrometheusService } from '@app/shared/monitoring/prometheus.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { SystemException } from '@app/shared/exceptions/system.exception';
import { ErrorCategory } from '@app/shared/exceptions/error-category.enum';

/**
 * Service information interface
 */
export interface ServiceInfo {
  name: string;
  version: string;
  description: string;
  status: 'available' | 'degraded' | 'unavailable';
  uptime: number;
  startTime: Date;
  environment: string;
  dependencies: {
    database: boolean;
    kafka: boolean;
    redis: boolean;
  };
  metrics: {
    eventProcessingRate: number;
    activeUsers: number;
    achievementsAwarded: number;
    averageProcessingTime: number;
  };
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: 'ok' | 'error';
  details: {
    database: {
      status: 'up' | 'down';
      message?: string;
    };
    kafka: {
      status: 'up' | 'down';
      message?: string;
      consumerLag?: number;
    };
    redis: {
      status: 'up' | 'down';
      message?: string;
    };
  };
  timestamp: Date;
}

/**
 * Root service that implements basic functionality for the gamification engine,
 * including health checks and service information retrieval.
 */
@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private startTime: Date;
  private serviceVersion: string;
  private serviceStatus: 'available' | 'degraded' | 'unavailable' = 'available';
  private metrics = {
    eventProcessingRate: 0,
    activeUsers: 0,
    achievementsAwarded: 0,
    averageProcessingTime: 0,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaHealthService: KafkaHealthService,
    private readonly kafkaMonitoringService: KafkaMonitoringService,
    private readonly prometheusService: PrometheusService,
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.startTime = new Date();
    this.serviceVersion = this.configService.get<string>('gamificationEngine.version', '1.0.0');
    
    // Register metrics collectors
    this.registerMetrics();
  }

  /**
   * Initialize the service when the module is initialized
   */
  async onModuleInit() {
    try {
      this.logger.log('Initializing AppService...');
      
      // Perform initial health check
      await this.checkHealth();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      this.logger.log('AppService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AppService', error);
      this.serviceStatus = 'degraded';
    }
  }

  /**
   * Register Prometheus metrics collectors
   */
  private registerMetrics() {
    // Register gauges for key metrics
    this.prometheusService.registerGauge('gamification_event_processing_rate', 'Event processing rate per minute');
    this.prometheusService.registerGauge('gamification_active_users', 'Number of active users in the system');
    this.prometheusService.registerGauge('gamification_achievements_awarded', 'Number of achievements awarded');
    this.prometheusService.registerGauge('gamification_average_processing_time', 'Average event processing time in ms');
    
    // Register health check metrics
    this.prometheusService.registerGauge('gamification_database_health', 'Database health status (1=up, 0=down)');
    this.prometheusService.registerGauge('gamification_kafka_health', 'Kafka health status (1=up, 0=down)');
    this.prometheusService.registerGauge('gamification_redis_health', 'Redis health status (1=up, 0=down)');
    
    // Register histogram for event processing time
    this.prometheusService.registerHistogram('gamification_event_processing_duration', 'Event processing duration in ms', [
      5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000
    ]);
  }

  /**
   * Start collecting metrics at regular intervals
   */
  private startMetricsCollection() {
    // Update metrics every 15 seconds
    setInterval(async () => {
      try {
        // Get metrics from Kafka monitoring service
        const kafkaMetrics = await this.kafkaMonitoringService.getMetrics();
        this.metrics.eventProcessingRate = kafkaMetrics.messagesPerSecond * 60; // Convert to per minute
        this.metrics.averageProcessingTime = kafkaMetrics.averageProcessingTime;
        
        // Update Prometheus metrics
        this.prometheusService.setGaugeValue('gamification_event_processing_rate', this.metrics.eventProcessingRate);
        this.prometheusService.setGaugeValue('gamification_average_processing_time', this.metrics.averageProcessingTime);
        
        // Get active users count from Redis
        const activeUsers = await this.getActiveUsersCount();
        this.metrics.activeUsers = activeUsers;
        this.prometheusService.setGaugeValue('gamification_active_users', activeUsers);
        
        // Get achievements awarded count from database
        const achievementsAwarded = await this.getAchievementsAwardedCount();
        this.metrics.achievementsAwarded = achievementsAwarded;
        this.prometheusService.setGaugeValue('gamification_achievements_awarded', achievementsAwarded);
        
        // Perform health check and update health metrics
        const health = await this.checkHealth();
        this.prometheusService.setGaugeValue('gamification_database_health', health.details.database.status === 'up' ? 1 : 0);
        this.prometheusService.setGaugeValue('gamification_kafka_health', health.details.kafka.status === 'up' ? 1 : 0);
        this.prometheusService.setGaugeValue('gamification_redis_health', health.details.redis.status === 'up' ? 1 : 0);
        
        // Update service status based on health check
        if (health.status === 'ok') {
          this.serviceStatus = 'available';
        } else if (
          health.details.database.status === 'down' || 
          (health.details.kafka.status === 'down' && health.details.redis.status === 'down')
        ) {
          this.serviceStatus = 'unavailable';
        } else {
          this.serviceStatus = 'degraded';
        }
      } catch (error) {
        this.logger.error('Error collecting metrics', error);
      }
    }, 15000); // 15 seconds
  }

  /**
   * Get active users count from Redis
   * @returns Number of active users
   */
  private async getActiveUsersCount(): Promise<number> {
    try {
      // Use Redis to get active users in the last 24 hours
      const activeUsersKey = 'gamification:active_users:24h';
      const activeUsers = await this.redisService.get(activeUsersKey);
      return activeUsers ? parseInt(activeUsers, 10) : 0;
    } catch (error) {
      this.logger.error('Error getting active users count', error);
      return 0;
    }
  }

  /**
   * Get achievements awarded count from database
   * @returns Number of achievements awarded
   */
  private async getAchievementsAwardedCount(): Promise<number> {
    try {
      // Query the database for total achievements awarded
      const count = await this.prismaService.userAchievement.count();
      return count;
    } catch (error) {
      this.logger.error('Error getting achievements awarded count', error);
      return 0;
    }
  }

  /**
   * Get service information
   * @returns Service information object
   */
  async getServiceInfo(): Promise<ServiceInfo> {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000); // in seconds
    
    // Get dependency status
    const health = await this.checkHealth();
    
    return {
      name: 'Gamification Engine',
      version: this.serviceVersion,
      description: 'Processes events from all journeys to drive user engagement through achievements, challenges, and rewards',
      status: this.serviceStatus,
      uptime,
      startTime: this.startTime,
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      dependencies: {
        database: health.details.database.status === 'up',
        kafka: health.details.kafka.status === 'up',
        redis: health.details.redis.status === 'up',
      },
      metrics: this.metrics,
    };
  }

  /**
   * Check the health of all dependencies
   * @returns Health check result
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'ok',
      details: {
        database: { status: 'up' },
        kafka: { status: 'up' },
        redis: { status: 'up' },
      },
      timestamp: new Date(),
    };

    // Check database health
    try {
      // Use a simple query to check database connectivity
      await this.prismaService.$queryRaw`SELECT 1`;
    } catch (error) {
      result.status = 'error';
      result.details.database = {
        status: 'down',
        message: `Database connection error: ${error.message}`,
      };
      this.logger.error('Database health check failed', error);
    }

    // Check Kafka health
    try {
      const kafkaHealth = await this.kafkaHealthService.checkHealth();
      if (!kafkaHealth.isHealthy) {
        result.status = 'error';
        result.details.kafka = {
          status: 'down',
          message: kafkaHealth.message,
          consumerLag: kafkaHealth.consumerLag,
        };
        this.logger.warn(`Kafka health check failed: ${kafkaHealth.message}`);
      } else if (kafkaHealth.consumerLag !== undefined) {
        result.details.kafka.consumerLag = kafkaHealth.consumerLag;
      }
    } catch (error) {
      result.status = 'error';
      result.details.kafka = {
        status: 'down',
        message: `Kafka health check error: ${error.message}`,
      };
      this.logger.error('Kafka health check failed', error);
    }

    // Check Redis health
    try {
      const redisHealth = await this.redisService.healthCheck();
      if (!redisHealth) {
        result.status = 'error';
        result.details.redis = {
          status: 'down',
          message: 'Redis connection failed',
        };
        this.logger.warn('Redis health check failed');
      }
    } catch (error) {
      result.status = 'error';
      result.details.redis = {
        status: 'down',
        message: `Redis health check error: ${error.message}`,
      };
      this.logger.error('Redis health check failed', error);
    }

    return result;
  }

  /**
   * Perform a comprehensive health check and throw an error if any dependency is down
   * @throws HealthCheckError if any dependency is unhealthy
   */
  async healthCheck(): Promise<void> {
    const health = await this.checkHealth();
    
    if (health.status === 'error') {
      // Create a detailed error message
      const errorDetails = [];
      
      if (health.details.database.status === 'down') {
        errorDetails.push(`Database: ${health.details.database.message}`);
      }
      
      if (health.details.kafka.status === 'down') {
        errorDetails.push(`Kafka: ${health.details.kafka.message}`);
      }
      
      if (health.details.redis.status === 'down') {
        errorDetails.push(`Redis: ${health.details.redis.message}`);
      }
      
      const errorMessage = `Health check failed: ${errorDetails.join(', ')}`;
      
      // Create a system exception with appropriate category
      throw new SystemException(
        errorMessage,
        'HEALTH_CHECK_FAILED',
        ErrorCategory.SYSTEM,
        {
          healthDetails: health.details,
          timestamp: health.timestamp,
        }
      );
    }
  }

  /**
   * Record event processing time for metrics
   * @param durationMs Processing time in milliseconds
   * @param eventType Type of event processed
   */
  recordEventProcessingTime(durationMs: number, eventType: string): void {
    try {
      // Record in Prometheus histogram
      this.prometheusService.recordHistogramValue(
        'gamification_event_processing_duration',
        durationMs,
        { eventType }
      );
    } catch (error) {
      this.logger.error('Error recording event processing time', error);
    }
  }

  /**
   * Get the current service status
   * @returns Service status string
   */
  getStatus(): 'available' | 'degraded' | 'unavailable' {
    return this.serviceStatus;
  }

  /**
   * Get the service uptime in seconds
   * @returns Uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
}