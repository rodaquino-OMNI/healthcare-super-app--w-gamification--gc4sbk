/**
 * Mock Services for E2E Testing of Tracing
 * 
 * This file defines lightweight NestJS services that simulate the microservice architecture
 * of the AUSTA SuperApp for testing trace context propagation. Each service includes
 * controllers, providers, and HTTP clients that generate and propagate tracing spans.
 */

import { Controller, Get, HttpService, Injectable, Logger, Module, Param } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SpanStatusCode, context, trace } from '@opentelemetry/api';
import { firstValueFrom } from 'rxjs';
import { TracingService } from '../../../../shared/src/tracing/tracing.service';

/**
 * Base service configuration for all mock services
 */
const baseConfig = {
  service: {
    name: 'mock-service',
    port: 3000,
  },
  tracing: {
    enabled: true,
  },
};

/**
 * Custom logger for mock services
 */
@Injectable()
class MockLogger extends Logger {
  constructor(private readonly serviceName: string) {
    super();
  }

  log(message: string, context?: string) {
    super.log(`[${this.serviceName}] ${message}`, context || 'MockService');
  }

  error(message: string, trace?: string, context?: string) {
    super.error(`[${this.serviceName}] ${message}`, trace, context || 'MockService');
  }
}

/**
 * Base service for all mock services
 */
@Injectable()
class BaseService {
  constructor(
    protected readonly httpService: HttpService,
    protected readonly tracingService: TracingService,
    protected readonly logger: MockLogger,
    protected readonly configService: ConfigService,
  ) {}

  /**
   * Makes an HTTP call to another service with trace context propagation
   */
  async callService(serviceName: string, endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const servicePort = this.configService.get<number>(`services.${serviceName}.port`);
    const url = `http://localhost:${servicePort}${endpoint}`;
    
    // Replace path parameters in the URL
    const finalUrl = Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(`:${key}`, value),
      url
    );

    return this.tracingService.createSpan(`call-${serviceName}${endpoint}`, async () => {
      try {
        // Get the current context to propagate trace information
        const currentContext = context.active();
        const currentSpan = trace.getSpan(currentContext);
        
        if (currentSpan) {
          // Add attributes to the span for better tracing
          currentSpan.setAttribute('service.name', serviceName);
          currentSpan.setAttribute('http.url', finalUrl);
          currentSpan.setAttribute('http.method', 'GET');
        }

        this.logger.log(`Calling ${serviceName} at ${finalUrl}`);
        
        // Make the HTTP call and return the response data
        const response = await firstValueFrom(
          this.httpService.get(finalUrl, {
            headers: {
              // In a real implementation, you would inject trace context headers here
              // This is simplified for the mock services
              'x-trace-id': trace.getSpanContext(currentContext)?.traceId || 'unknown',
            },
          })
        );

        if (currentSpan) {
          currentSpan.setAttribute('http.status_code', response.status);
          currentSpan.setStatus({ code: SpanStatusCode.OK });
        }

        return response.data;
      } catch (error) {
        this.logger.error(`Error calling ${serviceName}: ${error.message}`, error.stack);
        throw error;
      }
    });
  }
}

/**
 * Health Journey Mock Service
 */
@Injectable()
class HealthService extends BaseService {
  async getHealthMetrics(userId: string): Promise<any> {
    return this.tracingService.createSpan('health-get-metrics', async () => {
      this.logger.log(`Getting health metrics for user ${userId}`);
      
      // Simulate processing and database access
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Call the gamification service to record this activity
      await this.callService('gamification', '/api/events/record', { type: 'health_metrics_viewed' });
      
      return {
        userId,
        metrics: [
          { name: 'steps', value: 8500, unit: 'count' },
          { name: 'heart_rate', value: 72, unit: 'bpm' },
          { name: 'sleep', value: 7.5, unit: 'hours' },
        ],
      };
    });
  }

  async syncDeviceData(userId: string, deviceId: string): Promise<any> {
    return this.tracingService.createSpan('health-sync-device', async () => {
      this.logger.log(`Syncing device data for user ${userId} from device ${deviceId}`);
      
      // Simulate device data processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Call the gamification service to record this activity
      await this.callService('gamification', '/api/events/record', { type: 'device_synced' });
      
      return {
        userId,
        deviceId,
        lastSynced: new Date().toISOString(),
        dataPoints: 24,
      };
    });
  }
}

@Controller('api/health')
class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('metrics/:userId')
  async getHealthMetrics(@Param('userId') userId: string): Promise<any> {
    return this.healthService.getHealthMetrics(userId);
  }

  @Get('devices/:userId/sync/:deviceId')
  async syncDeviceData(
    @Param('userId') userId: string,
    @Param('deviceId') deviceId: string,
  ): Promise<any> {
    return this.healthService.syncDeviceData(userId, deviceId);
  }
}

/**
 * Care Journey Mock Service
 */
@Injectable()
class CareService extends BaseService {
  async getAppointments(userId: string): Promise<any> {
    return this.tracingService.createSpan('care-get-appointments', async () => {
      this.logger.log(`Getting appointments for user ${userId}`);
      
      // Simulate processing and database access
      await new Promise(resolve => setTimeout(resolve, 75));
      
      // Call the health service to get user health data for context
      const healthData = await this.callService('health', '/api/health/metrics/:userId', { userId });
      
      // Call the gamification service to record this activity
      await this.callService('gamification', '/api/events/record', { type: 'appointments_viewed' });
      
      return {
        userId,
        appointments: [
          {
            id: 'appt-123',
            provider: 'Dr. Smith',
            date: '2023-06-15T14:30:00Z',
            type: 'Check-up',
            healthContext: healthData.metrics,
          },
        ],
      };
    });
  }

  async bookAppointment(userId: string, providerId: string): Promise<any> {
    return this.tracingService.createSpan('care-book-appointment', async () => {
      this.logger.log(`Booking appointment for user ${userId} with provider ${providerId}`);
      
      // Simulate appointment booking process
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Call the plan service to check coverage
      const coverageData = await this.callService('plan', '/api/plan/coverage/:userId', { userId });
      
      // Call the gamification service to record this activity and possibly award points
      await this.callService('gamification', '/api/events/record', { type: 'appointment_booked' });
      
      return {
        userId,
        appointmentId: 'appt-456',
        provider: providerId,
        date: '2023-06-20T10:00:00Z',
        coverage: coverageData.coverageLevel,
      };
    });
  }
}

@Controller('api/care')
class CareController {
  constructor(private readonly careService: CareService) {}

  @Get('appointments/:userId')
  async getAppointments(@Param('userId') userId: string): Promise<any> {
    return this.careService.getAppointments(userId);
  }

  @Get('appointments/:userId/book/:providerId')
  async bookAppointment(
    @Param('userId') userId: string,
    @Param('providerId') providerId: string,
  ): Promise<any> {
    return this.careService.bookAppointment(userId, providerId);
  }
}

/**
 * Plan Journey Mock Service
 */
@Injectable()
class PlanService extends BaseService {
  async getCoverage(userId: string): Promise<any> {
    return this.tracingService.createSpan('plan-get-coverage', async () => {
      this.logger.log(`Getting coverage for user ${userId}`);
      
      // Simulate processing and database access
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Call the gamification service to record this activity
      await this.callService('gamification', '/api/events/record', { type: 'coverage_viewed' });
      
      return {
        userId,
        planId: 'premium-2023',
        coverageLevel: 'Gold',
        benefits: ['Medical', 'Dental', 'Vision', 'Wellness'],
      };
    });
  }

  async submitClaim(userId: string, claimType: string): Promise<any> {
    return this.tracingService.createSpan('plan-submit-claim', async () => {
      this.logger.log(`Submitting ${claimType} claim for user ${userId}`);
      
      // Simulate claim processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Call the care service to get appointment context if it's a medical claim
      let appointmentContext = null;
      if (claimType === 'medical') {
        appointmentContext = await this.callService('care', '/api/care/appointments/:userId', { userId });
      }
      
      // Call the gamification service to record this activity and award points
      await this.callService('gamification', '/api/events/record', { type: 'claim_submitted' });
      
      return {
        userId,
        claimId: 'claim-789',
        type: claimType,
        status: 'Submitted',
        submissionDate: new Date().toISOString(),
        appointmentContext: appointmentContext?.appointments || [],
      };
    });
  }
}

@Controller('api/plan')
class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get('coverage/:userId')
  async getCoverage(@Param('userId') userId: string): Promise<any> {
    return this.planService.getCoverage(userId);
  }

  @Get('claims/:userId/submit/:claimType')
  async submitClaim(
    @Param('userId') userId: string,
    @Param('claimType') claimType: string,
  ): Promise<any> {
    return this.planService.submitClaim(userId, claimType);
  }
}

/**
 * Gamification Engine Mock Service
 */
@Injectable()
class GamificationService extends BaseService {
  async recordEvent(eventType: string): Promise<any> {
    return this.tracingService.createSpan('gamification-record-event', async () => {
      this.logger.log(`Recording event of type ${eventType}`);
      
      // Simulate event processing
      await new Promise(resolve => setTimeout(resolve, 40));
      
      // Determine points based on event type
      let points = 0;
      let achievements = [];
      
      switch (eventType) {
        case 'health_metrics_viewed':
          points = 5;
          break;
        case 'device_synced':
          points = 10;
          achievements = ['Device Master'];
          break;
        case 'appointments_viewed':
          points = 5;
          break;
        case 'appointment_booked':
          points = 20;
          achievements = ['Care Planner'];
          break;
        case 'coverage_viewed':
          points = 5;
          break;
        case 'claim_submitted':
          points = 15;
          achievements = ['Claim Expert'];
          break;
        default:
          points = 1;
      }
      
      return {
        eventType,
        processed: true,
        timestamp: new Date().toISOString(),
        pointsAwarded: points,
        achievements,
      };
    });
  }

  async getUserAchievements(userId: string): Promise<any> {
    return this.tracingService.createSpan('gamification-get-achievements', async () => {
      this.logger.log(`Getting achievements for user ${userId}`);
      
      // Simulate processing and database access
      await new Promise(resolve => setTimeout(resolve, 80));
      
      // Call the health service to get health context
      await this.callService('health', '/api/health/metrics/:userId', { userId });
      
      return {
        userId,
        totalPoints: 350,
        level: 5,
        achievements: [
          { name: 'Health Enthusiast', date: '2023-05-10T14:30:00Z', points: 50 },
          { name: 'Care Planner', date: '2023-05-15T09:45:00Z', points: 30 },
          { name: 'Claim Expert', date: '2023-05-20T16:20:00Z', points: 40 },
        ],
      };
    });
  }
}

@Controller('api/gamification')
class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('events/record')
  async recordEvent(@Param('type') eventType: string): Promise<any> {
    return this.gamificationService.recordEvent(eventType || 'unknown');
  }

  @Get('achievements/:userId')
  async getUserAchievements(@Param('userId') userId: string): Promise<any> {
    return this.gamificationService.getUserAchievements(userId);
  }
}

/**
 * Module definitions for each mock service
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({
        ...baseConfig,
        service: {
          ...baseConfig.service,
          name: 'health-service',
          port: 3001,
        },
        services: {
          care: { port: 3002 },
          plan: { port: 3003 },
          gamification: { port: 3004 },
        },
      })],
    }),
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: MockLogger,
      useFactory: () => new MockLogger('health-service'),
    },
    {
      provide: TracingService,
      useFactory: (configService: ConfigService, logger: MockLogger) => {
        return new TracingService(configService, logger);
      },
      inject: [ConfigService, MockLogger],
    },
    HttpService,
    HealthService,
  ],
})
class HealthModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({
        ...baseConfig,
        service: {
          ...baseConfig.service,
          name: 'care-service',
          port: 3002,
        },
        services: {
          health: { port: 3001 },
          plan: { port: 3003 },
          gamification: { port: 3004 },
        },
      })],
    }),
  ],
  controllers: [CareController],
  providers: [
    {
      provide: MockLogger,
      useFactory: () => new MockLogger('care-service'),
    },
    {
      provide: TracingService,
      useFactory: (configService: ConfigService, logger: MockLogger) => {
        return new TracingService(configService, logger);
      },
      inject: [ConfigService, MockLogger],
    },
    HttpService,
    CareService,
  ],
})
class CareModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({
        ...baseConfig,
        service: {
          ...baseConfig.service,
          name: 'plan-service',
          port: 3003,
        },
        services: {
          health: { port: 3001 },
          care: { port: 3002 },
          gamification: { port: 3004 },
        },
      })],
    }),
  ],
  controllers: [PlanController],
  providers: [
    {
      provide: MockLogger,
      useFactory: () => new MockLogger('plan-service'),
    },
    {
      provide: TracingService,
      useFactory: (configService: ConfigService, logger: MockLogger) => {
        return new TracingService(configService, logger);
      },
      inject: [ConfigService, MockLogger],
    },
    HttpService,
    PlanService,
  ],
})
class PlanModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({
        ...baseConfig,
        service: {
          ...baseConfig.service,
          name: 'gamification-service',
          port: 3004,
        },
        services: {
          health: { port: 3001 },
          care: { port: 3002 },
          plan: { port: 3003 },
        },
      })],
    }),
  ],
  controllers: [GamificationController],
  providers: [
    {
      provide: MockLogger,
      useFactory: () => new MockLogger('gamification-service'),
    },
    {
      provide: TracingService,
      useFactory: (configService: ConfigService, logger: MockLogger) => {
        return new TracingService(configService, logger);
      },
      inject: [ConfigService, MockLogger],
    },
    HttpService,
    GamificationService,
  ],
})
class GamificationModule {}

/**
 * Helper function to start all mock services
 */
export async function startMockServices(): Promise<any[]> {
  const services = [
    { module: HealthModule, port: 3001 },
    { module: CareModule, port: 3002 },
    { module: PlanModule, port: 3003 },
    { module: GamificationModule, port: 3004 },
  ];

  const instances = [];

  for (const { module, port } of services) {
    const app = await NestFactory.create(module, {
      logger: ['error', 'warn', 'log'],
    });
    await app.listen(port);
    instances.push(app);
  }

  return instances;
}

/**
 * Helper function to stop all mock services
 */
export async function stopMockServices(instances: any[]): Promise<void> {
  for (const app of instances) {
    await app.close();
  }
}

/**
 * Export all modules for individual testing
 */
export {
  HealthModule,
  CareModule,
  PlanModule,
  GamificationModule,
  HealthService,
  CareService,
  PlanService,
  GamificationService,
};