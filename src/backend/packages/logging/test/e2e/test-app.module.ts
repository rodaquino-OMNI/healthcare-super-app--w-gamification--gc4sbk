import { Controller, Get, Injectable, Module, Post, Body, Param, HttpStatus, HttpException, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '../../../src/logger.module';
import { LoggerService } from '../../../src/logger.service';
import { TracingModule } from '../../../../tracing/src/tracing.module';
import { TracingService } from '../../../../tracing/src/tracing.service';

// Import the ExceptionsModule from the shared package
import { ExceptionsModule } from '../../../../../shared/src/exceptions/exceptions.module';
import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Enum representing the different journey types in the AUSTA SuperApp
 */
enum JourneyType {
  Health = 'health',
  Care = 'care',
  Plan = 'plan',
}

/**
 * Interface for journey context information
 */
interface JourneyContext {
  type: JourneyType;
  id: string;
  metadata?: Record<string, any>;
}

/**
 * Service that provides journey context for logging
 * This simulates the @austa/journey-context package functionality
 */
@Injectable({ scope: Scope.REQUEST })
export class JourneyContextService {
  private context: JourneyContext | null = null;

  constructor(private readonly logger: LoggerService) {}

  /**
   * Sets the current journey context
   */
  setContext(context: JourneyContext): void {
    this.context = context;
    this.logger.setContext({ journey: this.context });
    this.logger.log(`Journey context set: ${context.type}`, 'JourneyContextService');
  }

  /**
   * Gets the current journey context
   */
  getContext(): JourneyContext | null {
    return this.context;
  }

  /**
   * Clears the current journey context
   */
  clearContext(): void {
    this.context = null;
    this.logger.log('Journey context cleared', 'JourneyContextService');
  }
}

/**
 * Test service that demonstrates logging in different contexts
 */
@Injectable()
export class TestService {
  constructor(
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly configService: ConfigService,
    private readonly journeyContextService: JourneyContextService,
  ) {}

  /**
   * Performs a simple operation with logging
   */
  async performOperation(operationId: string, journeyType?: string): Promise<string> {
    // Create a span for this operation
    return this.tracingService.createSpan('test-operation', async () => {
      // Log with different levels
      this.logger.log(`Starting operation ${operationId}`, 'TestService');
      
      // Add journey-specific context if provided
      if (journeyType) {
        // Set journey context using the JourneyContextService
        this.journeyContextService.setContext({
          type: journeyType as JourneyType,
          id: `journey-${operationId}`,
          metadata: {
            operationId,
            timestamp: new Date().toISOString(),
          },
        });
        
        this.logger.log(`Operation in journey context: ${journeyType}`, 'TestService');
      }

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      this.logger.debug('Operation details processed', { operationId });
      this.logger.log(`Completed operation ${operationId}`, 'TestService');
      
      return `Operation ${operationId} completed successfully`;
    });
  }

  /**
   * Simulates an operation that throws an error
   */
  async failingOperation(errorType: string, journeyType?: string): Promise<never> {
    // Set journey context if provided
    if (journeyType) {
      this.journeyContextService.setContext({
        type: journeyType as JourneyType,
        id: `journey-error-${Date.now()}`,
        metadata: {
          errorType,
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    this.logger.warn(`About to throw an error of type: ${errorType}`, 'TestService');
    
    switch (errorType) {
      case 'validation':
        throw new AppException({
          type: ErrorType.Validation,
          message: 'Validation failed',
          details: { field: 'testField', error: 'Invalid value' },
        });
      case 'business':
        throw new AppException({
          type: ErrorType.Business,
          message: 'Business rule violation',
        });
      case 'technical':
        throw new AppException({
          type: ErrorType.Technical,
          message: 'Internal server error',
        });
      case 'external':
        throw new AppException({
          type: ErrorType.External,
          message: 'External service unavailable',
        });
      case 'http':
        throw new HttpException('HTTP exception', HttpStatus.BAD_REQUEST);
      default:
        throw new Error('Unknown error');
    }
  }
  
  /**
   * Performs operations specific to each journey type
   */
  async performJourneySpecificOperation(journeyType: JourneyType): Promise<string> {
    return this.tracingService.createSpan(`${journeyType}-operation`, async () => {
      // Set journey context
      this.journeyContextService.setContext({
        type: journeyType,
        id: `${journeyType}-${Date.now()}`,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
      
      this.logger.log(`Starting ${journeyType} journey operation`, 'TestService');
      
      // Simulate journey-specific work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Log different messages based on journey type
      switch (journeyType) {
        case JourneyType.Health:
          this.logger.log('Processing health metrics', 'TestService');
          this.logger.debug('Health journey details', { journeyType, metrics: ['steps', 'heartRate'] });
          break;
        case JourneyType.Care:
          this.logger.log('Processing care appointment', 'TestService');
          this.logger.debug('Care journey details', { journeyType, appointment: { id: 'app123', type: 'checkup' } });
          break;
        case JourneyType.Plan:
          this.logger.log('Processing plan benefits', 'TestService');
          this.logger.debug('Plan journey details', { journeyType, benefits: ['dental', 'vision'] });
          break;
      }
      
      this.logger.log(`Completed ${journeyType} journey operation`, 'TestService');
      
      return `${journeyType} journey operation completed successfully`;
    });
  }
}

/**
 * Test controller that provides endpoints for testing logging
 */
@Controller('test')
export class TestController {
  constructor(
    private readonly testService: TestService,
    private readonly logger: LoggerService,
    private readonly journeyContextService: JourneyContextService,
  ) {}

  @Get('log/:id')
  async testLogging(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Received request for ID: ${id}`, 'TestController');
    const result = await this.testService.performOperation(id);
    return { message: result };
  }

  @Post('journey')
  async testJourneyLogging(@Body() body: { id: string; journeyType: string }): Promise<{ message: string }> {
    this.logger.log(`Received journey request for ID: ${body.id} in journey: ${body.journeyType}`, 'TestController');
    const result = await this.testService.performOperation(body.id, body.journeyType);
    return { message: result };
  }

  @Get('error/:type')
  async testError(@Param('type') errorType: string): Promise<{ message: string }> {
    this.logger.log(`Received error test request for type: ${errorType}`, 'TestController');
    try {
      await this.testService.failingOperation(errorType);
      return { message: 'This should not happen' };
    } catch (error) {
      // This error will be caught by the ExceptionsFilter
      throw error;
    }
  }
  
  @Post('error-journey')
  async testJourneyError(@Body() body: { errorType: string; journeyType: string }): Promise<{ message: string }> {
    this.logger.log(`Received journey error request for type: ${body.errorType} in journey: ${body.journeyType}`, 'TestController');
    try {
      await this.testService.failingOperation(body.errorType, body.journeyType);
      return { message: 'This should not happen' };
    } catch (error) {
      // This error will be caught by the ExceptionsFilter
      throw error;
    }
  }
  
  @Get('journey/:type')
  async testJourneySpecificOperation(@Param('type') journeyType: string): Promise<{ message: string }> {
    this.logger.log(`Received journey-specific operation request for journey: ${journeyType}`, 'TestController');
    
    // Validate journey type
    if (!Object.values(JourneyType).includes(journeyType as JourneyType)) {
      throw new AppException({
        type: ErrorType.Validation,
        message: `Invalid journey type: ${journeyType}`,
        details: { validTypes: Object.values(JourneyType) },
      });
    }
    
    const result = await this.testService.performJourneySpecificOperation(journeyType as JourneyType);
    return { message: result };
  }
  
  @Get('clear-context')
  clearJourneyContext(): { message: string } {
    this.journeyContextService.clearContext();
    return { message: 'Journey context cleared' };
  }
}

/**
 * TestAppModule creates a minimal but realistic NestJS application for e2e testing
 * of the logging package. It includes the LoggerModule, TracingModule, ExceptionsModule,
 * and test controllers/services to simulate a production-like environment.
 *
 * This module provides the foundation for all e2e tests of the logging package,
 * allowing tests to verify logging behavior in a context similar to real applications.
 * It also includes journey-specific components to test the journey-centered architecture
 * of the AUSTA SuperApp.
 */
@Module({
  imports: [
    // Configure environment variables for testing
    ConfigModule.forRoot({
      isGlobal: true,
      // Load test-specific environment variables
      envFilePath: '.env.test',
      // Provide default values for required configuration
      load: [() => ({
        service: {
          name: 'test-logging-service',
          version: '1.0.0',
        },
        logging: {
          level: process.env.LOG_LEVEL || 'debug',
          format: process.env.LOG_FORMAT || 'json',
          // Disable CloudWatch in tests by default
          cloudwatch: {
            enabled: false,
          },
        },
        tracing: {
          enabled: true,
          exporter: 'console',
        },
        // Journey-specific configuration
        journeys: {
          health: { enabled: true },
          care: { enabled: true },
          plan: { enabled: true },
        },
      })],
    }),
    
    // Import LoggerModule with test configuration
    LoggerModule.forRoot({
      // Use test-specific configuration
      useTestTransport: true,
      // Capture logs for test assertions
      captureLogsForTesting: true,
    }),
    
    // Import TracingModule with test configuration
    TracingModule.forRoot({
      // Use test-specific configuration
      useTestExporter: true,
    }),
    
    // Import ExceptionsModule for error handling
    ExceptionsModule,
  ],
  controllers: [TestController],
  providers: [
    TestService,
    // Register JourneyContextService as a request-scoped provider
    JourneyContextService,
  ],
  exports: [
    TestService,
    JourneyContextService,
  ],
})
export class TestAppModule {}