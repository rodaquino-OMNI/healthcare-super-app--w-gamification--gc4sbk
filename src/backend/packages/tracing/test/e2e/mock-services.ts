import { Controller, Get, HttpService, Injectable, LoggerService, Module, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { HttpAdapterHost } from '@nestjs/core';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { firstValueFrom } from 'rxjs';

/**
 * A simplified version of the TracingService for testing purposes.
 * This mimics the behavior of the actual TracingService in the application.
 */
@Injectable()
class MockTracingService {
  private tracer: any;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const serviceName = this.configService.get<string>('service.name', 'mock-service');
    this.tracer = trace.getTracer(serviceName);
    this.logger.log(`Initialized tracer for ${serviceName}`, 'MockTracing');
  }

  /**
   * Creates and starts a new span for tracing a specific operation.
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @returns The result of the function execution
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan(name);
    
    try {
      const result = await trace.with(trace.setSpan(trace.context(), span), fn);
      
      if (span.isRecording()) {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      
      return result;
    } catch (error) {
      if (span.isRecording()) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      
      this.logger.error(`Error in span ${name}: ${error.message}`, error.stack, 'MockTracing');
      throw error;
    } finally {
      span.end();
    }
  }
}

/**
 * Mock Logger Service for testing purposes
 */
@Injectable()
class MockLoggerService implements LoggerService {
  log(message: string, context?: string) {
    console.log(`[${context || 'LOG'}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${context || 'ERROR'}] ${message}${trace ? `\n${trace}` : ''}`);
  }

  warn(message: string, context?: string) {
    console.warn(`[${context || 'WARN'}] ${message}`);
  }

  debug(message: string, context?: string) {
    console.debug(`[${context || 'DEBUG'}] ${message}`);
  }

  verbose(message: string, context?: string) {
    console.log(`[${context || 'VERBOSE'}] ${message}`);
  }
}

/**
 * Base provider for mock services
 */
@Injectable()
class BaseServiceProvider {
  constructor(
    protected readonly httpService: HttpService,
    protected readonly tracingService: MockTracingService,
  ) {}

  /**
   * Makes an HTTP request to another service with trace context propagation
   */
  protected async makeRequest(url: string, operationName: string): Promise<any> {
    return this.tracingService.createSpan(`HTTP_REQUEST_${operationName}`, async () => {
      try {
        const response = await firstValueFrom(this.httpService.get(url));
        return response.data;
      } catch (error) {
        throw new Error(`Failed to make request to ${url}: ${error.message}`);
      }
    });
  }
}

/**
 * Health Journey Service Provider
 */
@Injectable()
class HealthServiceProvider extends BaseServiceProvider {
  async getHealthMetrics(userId: string): Promise<any> {
    return this.tracingService.createSpan('HEALTH_GET_METRICS', async () => {
      // Simulate some internal processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Return mock health metrics
      return {
        userId,
        metrics: {
          steps: 8432,
          heartRate: 72,
          sleepHours: 7.5,
        },
      };
    });
  }

  async trackAchievement(userId: string, metricType: string): Promise<any> {
    return this.tracingService.createSpan('HEALTH_TRACK_ACHIEVEMENT', async () => {
      // Make a request to the gamification service to track an achievement
      const gamificationUrl = `http://localhost:3004/gamification/achievement/${userId}/${metricType}`;
      return this.makeRequest(gamificationUrl, 'GAMIFICATION_ACHIEVEMENT');
    });
  }
}

/**
 * Care Journey Service Provider
 */
@Injectable()
class CareServiceProvider extends BaseServiceProvider {
  async getAppointments(userId: string): Promise<any> {
    return this.tracingService.createSpan('CARE_GET_APPOINTMENTS', async () => {
      // Simulate some internal processing
      await new Promise(resolve => setTimeout(resolve, 30));
      
      // Return mock appointments
      return {
        userId,
        appointments: [
          { id: '1', date: '2025-06-01T10:00:00Z', provider: 'Dr. Smith', type: 'Check-up' },
          { id: '2', date: '2025-06-15T14:30:00Z', provider: 'Dr. Johnson', type: 'Follow-up' },
        ],
      };
    });
  }

  async bookAppointment(userId: string, appointmentId: string): Promise<any> {
    return this.tracingService.createSpan('CARE_BOOK_APPOINTMENT', async () => {
      // Simulate some internal processing
      await new Promise(resolve => setTimeout(resolve, 40));
      
      // Make a request to the gamification service to track an achievement
      const gamificationUrl = `http://localhost:3004/gamification/achievement/${userId}/appointment_booked`;
      await this.makeRequest(gamificationUrl, 'GAMIFICATION_ACHIEVEMENT');
      
      // Return booking confirmation
      return {
        userId,
        appointmentId,
        status: 'confirmed',
        points: 50,
      };
    });
  }
}

/**
 * Plan Journey Service Provider
 */
@Injectable()
class PlanServiceProvider extends BaseServiceProvider {
  async getPlanDetails(userId: string): Promise<any> {
    return this.tracingService.createSpan('PLAN_GET_DETAILS', async () => {
      // Simulate some internal processing
      await new Promise(resolve => setTimeout(resolve, 25));
      
      // Return mock plan details
      return {
        userId,
        plan: {
          id: 'premium-2025',
          name: 'Premium Health Plan',
          coverage: 'Comprehensive',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        },
      };
    });
  }

  async submitClaim(userId: string, claimId: string): Promise<any> {
    return this.tracingService.createSpan('PLAN_SUBMIT_CLAIM', async () => {
      // Simulate some internal processing
      await new Promise(resolve => setTimeout(resolve, 35));
      
      // Make a request to the gamification service to track an achievement
      const gamificationUrl = `http://localhost:3004/gamification/achievement/${userId}/claim_submitted`;
      await this.makeRequest(gamificationUrl, 'GAMIFICATION_ACHIEVEMENT');
      
      // Return claim submission confirmation
      return {
        userId,
        claimId,
        status: 'submitted',
        points: 30,
      };
    });
  }
}

/**
 * Gamification Engine Service Provider
 */
@Injectable()
class GamificationServiceProvider extends BaseServiceProvider {
  async trackAchievement(userId: string, achievementType: string): Promise<any> {
    return this.tracingService.createSpan('GAMIFICATION_TRACK_ACHIEVEMENT', async () => {
      // Simulate some internal processing
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Calculate points based on achievement type
      let points = 10;
      switch (achievementType) {
        case 'steps':
          points = 15;
          break;
        case 'appointment_booked':
          points = 50;
          break;
        case 'claim_submitted':
          points = 30;
          break;
        default:
          points = 10;
      }
      
      // Make a request to the notification service to send an achievement notification
      const notificationUrl = `http://localhost:3005/notification/send/${userId}/achievement/${achievementType}`;
      await this.makeRequest(notificationUrl, 'NOTIFICATION_SEND');
      
      // Return achievement tracking result
      return {
        userId,
        achievementType,
        points,
        timestamp: new Date().toISOString(),
      };
    });
  }

  async getUserProfile(userId: string): Promise<any> {
    return this.tracingService.createSpan('GAMIFICATION_GET_PROFILE', async () => {
      // Simulate some internal processing
      await new Promise(resolve => setTimeout(resolve, 15));
      
      // Return mock user profile with gamification data
      return {
        userId,
        level: 5,
        points: 1250,
        achievements: [
          { id: '1', type: 'steps', date: '2025-05-01T10:00:00Z', points: 15 },
          { id: '2', type: 'appointment_booked', date: '2025-05-05T14:30:00Z', points: 50 },
        ],
      };
    });
  }
}

/**
 * Notification Service Provider
 */
@Injectable()
class NotificationServiceProvider extends BaseServiceProvider {
  async sendNotification(userId: string, type: string, content: string): Promise<any> {
    return this.tracingService.createSpan('NOTIFICATION_SEND', async () => {
      // Simulate some internal processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Return notification sending result
      return {
        userId,
        type,
        content,
        sent: true,
        timestamp: new Date().toISOString(),
      };
    });
  }
}

/**
 * Health Journey Controller
 */
@Controller('health')
class HealthController {
  constructor(private readonly healthService: HealthServiceProvider) {}

  @Get('metrics/:userId')
  async getHealthMetrics(@Param('userId') userId: string): Promise<any> {
    return this.healthService.getHealthMetrics(userId);
  }

  @Get('track/:userId/:metricType')
  async trackAchievement(
    @Param('userId') userId: string,
    @Param('metricType') metricType: string,
  ): Promise<any> {
    return this.healthService.trackAchievement(userId, metricType);
  }
}

/**
 * Care Journey Controller
 */
@Controller('care')
class CareController {
  constructor(private readonly careService: CareServiceProvider) {}

  @Get('appointments/:userId')
  async getAppointments(@Param('userId') userId: string): Promise<any> {
    return this.careService.getAppointments(userId);
  }

  @Get('book/:userId/:appointmentId')
  async bookAppointment(
    @Param('userId') userId: string,
    @Param('appointmentId') appointmentId: string,
  ): Promise<any> {
    return this.careService.bookAppointment(userId, appointmentId);
  }
}

/**
 * Plan Journey Controller
 */
@Controller('plan')
class PlanController {
  constructor(private readonly planService: PlanServiceProvider) {}

  @Get('details/:userId')
  async getPlanDetails(@Param('userId') userId: string): Promise<any> {
    return this.planService.getPlanDetails(userId);
  }

  @Get('claim/:userId/:claimId')
  async submitClaim(
    @Param('userId') userId: string,
    @Param('claimId') claimId: string,
  ): Promise<any> {
    return this.planService.submitClaim(userId, claimId);
  }
}

/**
 * Gamification Engine Controller
 */
@Controller('gamification')
class GamificationController {
  constructor(private readonly gamificationService: GamificationServiceProvider) {}

  @Get('achievement/:userId/:achievementType')
  async trackAchievement(
    @Param('userId') userId: string,
    @Param('achievementType') achievementType: string,
  ): Promise<any> {
    return this.gamificationService.trackAchievement(userId, achievementType);
  }

  @Get('profile/:userId')
  async getUserProfile(@Param('userId') userId: string): Promise<any> {
    return this.gamificationService.getUserProfile(userId);
  }
}

/**
 * Notification Service Controller
 */
@Controller('notification')
class NotificationController {
  constructor(private readonly notificationService: NotificationServiceProvider) {}

  @Get('send/:userId/:type/:content')
  async sendNotification(
    @Param('userId') userId: string,
    @Param('type') type: string,
    @Param('content') content: string,
  ): Promise<any> {
    return this.notificationService.sendNotification(userId, type, content);
  }
}

/**
 * Health Journey Module
 */
@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: ConfigService,
      useValue: {
        get: (key: string, defaultValue: string) => {
          if (key === 'service.name') return 'health-journey-service';
          return defaultValue;
        },
      },
    },
    {
      provide: LoggerService,
      useClass: MockLoggerService,
    },
    {
      provide: HttpService,
      useValue: {
        get: (url: string) => {
          const axios = require('axios');
          return axios.get(url);
        },
      },
    },
    MockTracingService,
    HealthServiceProvider,
  ],
})
class HealthModule {}

/**
 * Care Journey Module
 */
@Module({
  controllers: [CareController],
  providers: [
    {
      provide: ConfigService,
      useValue: {
        get: (key: string, defaultValue: string) => {
          if (key === 'service.name') return 'care-journey-service';
          return defaultValue;
        },
      },
    },
    {
      provide: LoggerService,
      useClass: MockLoggerService,
    },
    {
      provide: HttpService,
      useValue: {
        get: (url: string) => {
          const axios = require('axios');
          return axios.get(url);
        },
      },
    },
    MockTracingService,
    CareServiceProvider,
  ],
})
class CareModule {}

/**
 * Plan Journey Module
 */
@Module({
  controllers: [PlanController],
  providers: [
    {
      provide: ConfigService,
      useValue: {
        get: (key: string, defaultValue: string) => {
          if (key === 'service.name') return 'plan-journey-service';
          return defaultValue;
        },
      },
    },
    {
      provide: LoggerService,
      useClass: MockLoggerService,
    },
    {
      provide: HttpService,
      useValue: {
        get: (url: string) => {
          const axios = require('axios');
          return axios.get(url);
        },
      },
    },
    MockTracingService,
    PlanServiceProvider,
  ],
})
class PlanModule {}

/**
 * Gamification Engine Module
 */
@Module({
  controllers: [GamificationController],
  providers: [
    {
      provide: ConfigService,
      useValue: {
        get: (key: string, defaultValue: string) => {
          if (key === 'service.name') return 'gamification-engine';
          return defaultValue;
        },
      },
    },
    {
      provide: LoggerService,
      useClass: MockLoggerService,
    },
    {
      provide: HttpService,
      useValue: {
        get: (url: string) => {
          const axios = require('axios');
          return axios.get(url);
        },
      },
    },
    MockTracingService,
    GamificationServiceProvider,
  ],
})
class GamificationModule {}

/**
 * Notification Service Module
 */
@Module({
  controllers: [NotificationController],
  providers: [
    {
      provide: ConfigService,
      useValue: {
        get: (key: string, defaultValue: string) => {
          if (key === 'service.name') return 'notification-service';
          return defaultValue;
        },
      },
    },
    {
      provide: LoggerService,
      useClass: MockLoggerService,
    },
    {
      provide: HttpService,
      useValue: {
        get: (url: string) => {
          const axios = require('axios');
          return axios.get(url);
        },
      },
    },
    MockTracingService,
    NotificationServiceProvider,
  ],
})
class NotificationModule {}

/**
 * Interface for a mock service instance
 */
interface MockServiceInstance {
  app: any;
  port: number;
  name: string;
  module: any;
  server?: any;
}

/**
 * Mock services for testing trace context propagation
 */
export class MockServices {
  private services: MockServiceInstance[] = [
    { app: null, port: 3001, name: 'health-journey', module: HealthModule },
    { app: null, port: 3002, name: 'care-journey', module: CareModule },
    { app: null, port: 3003, name: 'plan-journey', module: PlanModule },
    { app: null, port: 3004, name: 'gamification-engine', module: GamificationModule },
    { app: null, port: 3005, name: 'notification-service', module: NotificationModule },
  ];

  /**
   * Starts all mock services
   */
  async startAll(): Promise<void> {
    for (const service of this.services) {
      await this.startService(service);
    }
    console.log('All mock services started successfully');
  }

  /**
   * Stops all mock services
   */
  async stopAll(): Promise<void> {
    for (const service of this.services) {
      await this.stopService(service);
    }
    console.log('All mock services stopped successfully');
  }

  /**
   * Starts a single mock service
   */
  private async startService(service: MockServiceInstance): Promise<void> {
    try {
      service.app = await NestFactory.create(service.module, {
        logger: ['error', 'warn'],
      });
      
      // Get the HTTP adapter to ensure proper context propagation
      const httpAdapter = service.app.get(HttpAdapterHost);
      
      await service.app.listen(service.port);
      service.server = service.app.getHttpServer();
      console.log(`Started ${service.name} on port ${service.port}`);
    } catch (error) {
      console.error(`Failed to start ${service.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stops a single mock service
   */
  private async stopService(service: MockServiceInstance): Promise<void> {
    if (service.app) {
      await service.app.close();
      service.app = null;
      service.server = null;
      console.log(`Stopped ${service.name} on port ${service.port}`);
    }
  }

  /**
   * Makes a request to a mock service to test trace context propagation
   */
  async makeTestRequest(path: string): Promise<any> {
    try {
      const axios = require('axios');
      const response = await axios.get(`http://localhost:3001/${path}`);
      return response.data;
    } catch (error) {
      console.error(`Test request failed: ${error.message}`);
      throw error;
    }
  }
}