import { Controller, Get, Module, Post, Body, Param, Query, Injectable, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorsModule } from '../../src/nest/module';
import { Retry, CircuitBreaker, Fallback, ErrorBoundary, TimeoutConfig } from '../../src/nest/decorators';
import { 
  ValidationError, 
  BusinessError, 
  TechnicalError, 
  ExternalError,
  ResourceNotFoundError,
  DatabaseError,
  ExternalApiError,
  InvalidParameterError,
  BusinessRuleViolationError,
  InternalServerError,
  TimeoutError
} from '../../src';
import { Health } from '../../src/journey';

/**
 * Service that simulates various error scenarios for testing
 */
@Injectable()
export class TestErrorService {
  private failureCount = 0;
  private circuitOpen = false;

  /**
   * Simulates a transient error that succeeds after a specified number of retries
   * @param failUntil Number of times to fail before succeeding
   * @returns A success message
   */
  async simulateTransientError(failUntil = 3): Promise<string> {
    this.failureCount++;
    
    if (this.failureCount <= failUntil) {
      throw new TimeoutError('Connection timed out', {
        operation: 'database.query',
        duration: 3000,
        attempt: this.failureCount
      });
    }
    
    // Reset for next test
    const result = `Success after ${this.failureCount} attempts`;
    this.failureCount = 0;
    return result;
  }

  /**
   * Simulates a persistent error that never succeeds
   */
  async simulatePersistentError(): Promise<never> {
    throw new DatabaseError('Database connection failed', {
      operation: 'connect',
      database: 'users',
      code: 'ECONNREFUSED'
    });
  }

  /**
   * Simulates an external API error
   */
  async simulateExternalApiError(): Promise<never> {
    throw new ExternalApiError('External API request failed', {
      endpoint: 'https://api.example.com/data',
      method: 'GET',
      statusCode: 503,
      responseBody: '{"error":"Service Unavailable"}'
    });
  }

  /**
   * Simulates a circuit breaker scenario
   */
  async simulateCircuitBreaker(): Promise<string> {
    if (this.circuitOpen) {
      return 'Circuit is open, using fallback';
    }
    
    this.failureCount++;
    
    if (this.failureCount >= 5) {
      this.circuitOpen = true;
      setTimeout(() => {
        this.circuitOpen = false;
        this.failureCount = 0;
      }, 5000); // Reset after 5 seconds
    }
    
    throw new ExternalApiError('External service unavailable', {
      endpoint: 'https://api.example.com/data',
      method: 'GET',
      statusCode: 503,
      attempt: this.failureCount
    });
  }

  /**
   * Simulates a health journey specific error
   */
  async simulateHealthJourneyError(): Promise<never> {
    throw new Health.Metrics.InvalidMetricValueError('Blood pressure reading is out of valid range', {
      metricType: 'bloodPressure',
      value: '300/200',
      validRange: '70-180/40-120'
    });
  }

  /**
   * Provides a fallback response for testing
   */
  getFallbackResponse(): string {
    return 'This is a fallback response';
  }

  /**
   * Resets the service state for testing
   */
  reset(): void {
    this.failureCount = 0;
    this.circuitOpen = false;
  }
}

/**
 * Controller with endpoints that trigger various error scenarios
 */
@Controller('test-errors')
export class TestErrorController {
  constructor(private readonly errorService: TestErrorService) {}

  @Get('validation')
  triggerValidationError(@Query('param') param: string): string {
    if (!param) {
      throw new InvalidParameterError('Missing required parameter', {
        parameter: 'param',
        expected: 'non-empty string'
      });
    }
    return `Received parameter: ${param}`;
  }

  @Get('business')
  triggerBusinessError(): never {
    throw new BusinessRuleViolationError('Operation would violate business rules', {
      rule: 'appointment.scheduling',
      details: 'Cannot schedule more than 3 appointments per day'
    });
  }

  @Get('technical')
  triggerTechnicalError(): never {
    throw new InternalServerError('Unexpected server error', {
      component: 'UserService',
      operation: 'getUserProfile'
    });
  }

  @Get('external')
  triggerExternalError(): Promise<never> {
    return this.errorService.simulateExternalApiError();
  }

  @Get('not-found')
  triggerNotFoundError(@Param('id') id: string): never {
    throw new ResourceNotFoundError('Resource not found', {
      resourceType: 'User',
      resourceId: id || 'unknown'
    });
  }

  @Get('health-journey')
  triggerHealthJourneyError(): Promise<never> {
    return this.errorService.simulateHealthJourneyError();
  }

  @Get('transient')
  @Retry({ maxAttempts: 5, delay: 100, backoffFactor: 2 })
  triggerTransientError(@Query('failUntil') failUntil?: string): Promise<string> {
    return this.errorService.simulateTransientError(failUntil ? parseInt(failUntil, 10) : 3);
  }

  @Get('circuit-breaker')
  @CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 5000,
    fallbackMethod: 'getFallbackForCircuitBreaker'
  })
  triggerCircuitBreaker(): Promise<string> {
    return this.errorService.simulateCircuitBreaker();
  }

  getFallbackForCircuitBreaker(): string {
    return 'Circuit breaker fallback response';
  }

  @Get('fallback')
  @Fallback({ method: 'getFallbackResponse' })
  triggerWithFallback(): Promise<string> {
    return this.errorService.simulatePersistentError();
  }

  getFallbackResponse(): string {
    return this.errorService.getFallbackResponse();
  }

  @Get('timeout')
  @TimeoutConfig({ timeout: 1000 })
  triggerTimeout(): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => resolve('This should timeout before resolving'), 5000);
    });
  }

  @Get('reset')
  resetService(): string {
    this.errorService.reset();
    return 'Service state reset';
  }
}

/**
 * Controller with error boundary for testing error containment
 */
@Controller('error-boundary')
@ErrorBoundary({ fallbackMethod: 'handleControllerError' })
export class ErrorBoundaryController {
  handleControllerError(error: Error): { message: string; originalError: string } {
    return {
      message: 'Error was caught by controller error boundary',
      originalError: error.message
    };
  }

  @Get('contained-error')
  triggerContainedError(): never {
    throw new Error('This error should be contained by the controller error boundary');
  }
}

/**
 * Options for configuring the test module
 */
export interface TestModuleOptions {
  /**
   * Options to pass to the ErrorsModule
   */
  errorsModuleOptions?: {
    /**
     * Whether to enable detailed error responses (includes stack traces)
     */
    detailedErrors?: boolean;
    /**
     * Whether to enable logging of errors
     */
    enableLogging?: boolean;
    /**
     * Whether to enable tracing integration
     */
    enableTracing?: boolean;
  };
  /**
   * Additional controllers to include in the test module
   */
  controllers?: any[];
  /**
   * Additional providers to include in the test module
   */
  providers?: any[];
}

/**
 * Creates a test module with error handling capabilities
 */
export function createTestModule(options: TestModuleOptions = {}): any {
  const { errorsModuleOptions = {}, controllers = [], providers = [] } = options;
  
  @Module({
    imports: [
      ErrorsModule.forRoot({
        detailedErrors: errorsModuleOptions.detailedErrors ?? true,
        enableLogging: errorsModuleOptions.enableLogging ?? false,
        enableTracing: errorsModuleOptions.enableTracing ?? false,
      }),
    ],
    controllers: [TestErrorController, ErrorBoundaryController, ...controllers],
    providers: [TestErrorService, ...providers],
  })
  class TestModule {}
  
  return TestModule;
}

/**
 * Creates and initializes a NestJS application for testing
 */
export async function createTestApplication(
  options: TestModuleOptions = {}
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [createTestModule(options)],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  
  return app;
}