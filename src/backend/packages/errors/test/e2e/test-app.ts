import { INestApplication, Module, Controller, Get, Post, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorsModule } from '../../src/nest/module';
import { Retry, CircuitBreaker, Fallback, ErrorBoundary } from '../../src/nest/decorators';
import { BaseError } from '../../src/base';
import { ErrorType } from '../../src/types';
import { 
  ValidationError, 
  MissingParameterError, 
  InvalidParameterError 
} from '../../src/categories/validation.errors';
import { 
  BusinessError, 
  ResourceNotFoundError, 
  BusinessRuleViolationError 
} from '../../src/categories/business.errors';
import { 
  TechnicalError, 
  DatabaseError, 
  InternalServerError 
} from '../../src/categories/technical.errors';
import { 
  ExternalError, 
  ExternalApiError, 
  ExternalDependencyUnavailableError 
} from '../../src/categories/external.errors';

// Import journey-specific errors for testing
import { Health } from '../../src/journey';

/**
 * Test controller that triggers validation errors
 */
@Controller('validation')
export class ValidationErrorsController {
  @Get('missing-param')
  missingParam(@Query('required') required: string): string {
    if (!required) {
      throw new MissingParameterError('required');
    }
    return `Parameter received: ${required}`;
  }

  @Get('invalid-param/:id')
  invalidParam(@Param('id') id: string): string {
    if (isNaN(Number(id))) {
      throw new InvalidParameterError('id', 'Must be a number');
    }
    return `Valid ID: ${id}`;
  }

  @Post('schema-validation')
  schemaValidation(@Body() body: { name: string; age: number }): string {
    if (!body.name) {
      throw new ValidationError('Name is required');
    }
    if (typeof body.age !== 'number' || body.age <= 0) {
      throw new ValidationError('Age must be a positive number');
    }
    return `Valid data: ${body.name}, ${body.age}`;
  }
}

/**
 * Test controller that triggers business errors
 */
@Controller('business')
export class BusinessErrorsController {
  @Get('resource/:id')
  getResource(@Param('id') id: string): string {
    if (id === '404') {
      throw new ResourceNotFoundError('resource', id);
    }
    return `Resource found: ${id}`;
  }

  @Post('rule-violation')
  ruleViolation(@Body() body: { action: string }): string {
    if (body.action === 'forbidden') {
      throw new BusinessRuleViolationError(
        'forbidden_action',
        'This action is not allowed in the current context'
      );
    }
    return `Action performed: ${body.action}`;
  }

  @Get('custom-business')
  customBusiness(): string {
    throw new BusinessError('Custom business logic error');
  }
}

/**
 * Test controller that triggers technical errors
 */
@Controller('technical')
export class TechnicalErrorsController {
  @Get('database')
  databaseError(): string {
    throw new DatabaseError('Failed to execute database query', {
      operation: 'SELECT',
      table: 'users',
      error: 'Connection timeout'
    });
  }

  @Get('internal')
  internalError(): string {
    throw new InternalServerError('Unexpected server error');
  }

  @Get('custom-technical')
  customTechnical(): string {
    throw new TechnicalError('Custom technical error');
  }
}

/**
 * Test controller that triggers external errors
 */
@Controller('external')
export class ExternalErrorsController {
  @Get('api')
  apiError(): string {
    throw new ExternalApiError(
      'Failed to call external API',
      {
        service: 'payment-gateway',
        endpoint: '/process',
        statusCode: 500
      }
    );
  }

  @Get('dependency')
  dependencyError(): string {
    throw new ExternalDependencyUnavailableError(
      'External service unavailable',
      { service: 'email-service' }
    );
  }

  @Get('custom-external')
  customExternal(): string {
    throw new ExternalError('Custom external system error');
  }
}

/**
 * Test controller that triggers journey-specific errors
 */
@Controller('journey')
export class JourneyErrorsController {
  @Get('health/metrics')
  healthMetricsError(): string {
    throw new Health.Metrics.InvalidMetricValueError(
      'heart_rate',
      '300',
      { min: 40, max: 200 }
    );
  }

  @Get('health/devices')
  healthDevicesError(): string {
    throw new Health.Devices.DeviceConnectionFailureError(
      'fitbit',
      { reason: 'authentication_failed' }
    );
  }
}

/**
 * Test controller that demonstrates recovery strategies
 */
@Controller('recovery')
export class RecoveryStrategiesController {
  private retryCount = 0;
  private circuitBreakerCount = 0;

  @Get('retry')
  @Retry({ maxAttempts: 3, delay: 100 })
  retryableOperation(@Query('succeed') succeed?: string): string {
    this.retryCount++;
    if (succeed === 'true' || this.retryCount >= 3) {
      const count = this.retryCount;
      this.retryCount = 0;
      return `Operation succeeded after ${count} attempts`;
    }
    throw new ExternalDependencyUnavailableError(
      'Transient error, should retry',
      { attempt: this.retryCount }
    );
  }

  @Get('circuit-breaker')
  @CircuitBreaker({ 
    failureThreshold: 3,
    resetTimeout: 5000
  })
  circuitBreakerOperation(@Query('succeed') succeed?: string): string {
    if (succeed === 'true') {
      return 'Circuit is closed, operation succeeded';
    }
    this.circuitBreakerCount++;
    throw new ExternalApiError(
      'External API failed, may trigger circuit breaker',
      { 
        service: 'test-service',
        failureCount: this.circuitBreakerCount 
      }
    );
  }

  @Get('fallback')
  @Fallback((_err) => 'Fallback response when operation fails')
  fallbackOperation(@Query('fail') fail?: string): string {
    if (fail === 'true') {
      throw new DatabaseError('Database operation failed', { operation: 'read' });
    }
    return 'Primary operation succeeded';
  }

  @Get('error-boundary')
  @ErrorBoundary()
  errorBoundaryOperation(@Query('error-type') errorType?: string): string {
    switch (errorType) {
      case 'validation':
        throw new ValidationError('Validation error inside boundary');
      case 'business':
        throw new BusinessError('Business error inside boundary');
      case 'technical':
        throw new TechnicalError('Technical error inside boundary');
      case 'external':
        throw new ExternalError('External error inside boundary');
      case 'unhandled':
        throw new Error('Unhandled error inside boundary');
      default:
        return 'No error triggered';
    }
  }
}

/**
 * Options for configuring the test module
 */
export interface TestModuleOptions {
  /**
   * Whether to include validation controllers
   * @default true
   */
  includeValidationErrors?: boolean;
  
  /**
   * Whether to include business error controllers
   * @default true
   */
  includeBusinessErrors?: boolean;
  
  /**
   * Whether to include technical error controllers
   * @default true
   */
  includeTechnicalErrors?: boolean;
  
  /**
   * Whether to include external error controllers
   * @default true
   */
  includeExternalErrors?: boolean;
  
  /**
   * Whether to include journey-specific error controllers
   * @default true
   */
  includeJourneyErrors?: boolean;
  
  /**
   * Whether to include recovery strategy controllers
   * @default true
   */
  includeRecoveryStrategies?: boolean;
  
  /**
   * Options to pass to the ErrorsModule
   */
  errorsModuleOptions?: {
    /**
     * Whether to include stack traces in error responses
     * @default false
     */
    includeStackTraces?: boolean;
    
    /**
     * Whether to log errors
     * @default true
     */
    logErrors?: boolean;
    
    /**
     * Whether to enable retry mechanisms
     * @default true
     */
    enableRetry?: boolean;
    
    /**
     * Whether to enable circuit breaker mechanisms
     * @default true
     */
    enableCircuitBreaker?: boolean;
    
    /**
     * Whether to enable fallback mechanisms
     * @default true
     */
    enableFallback?: boolean;
  };
}

/**
 * Creates a dynamic test module with the specified controllers
 */
export function createTestModule(options: TestModuleOptions = {}) {
  const {
    includeValidationErrors = true,
    includeBusinessErrors = true,
    includeTechnicalErrors = true,
    includeExternalErrors = true,
    includeJourneyErrors = true,
    includeRecoveryStrategies = true,
    errorsModuleOptions = {}
  } = options;

  const controllers = [];

  if (includeValidationErrors) controllers.push(ValidationErrorsController);
  if (includeBusinessErrors) controllers.push(BusinessErrorsController);
  if (includeTechnicalErrors) controllers.push(TechnicalErrorsController);
  if (includeExternalErrors) controllers.push(ExternalErrorsController);
  if (includeJourneyErrors) controllers.push(JourneyErrorsController);
  if (includeRecoveryStrategies) controllers.push(RecoveryStrategiesController);

  @Module({
    imports: [ErrorsModule.forRoot(errorsModuleOptions)],
    controllers,
  })
  class TestModule {}

  return TestModule;
}

/**
 * Creates a test NestJS application with the error handling framework configured
 */
export async function createTestApp(options: TestModuleOptions = {}): Promise<INestApplication> {
  const TestModule = createTestModule(options);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.init();

  return app;
}

/**
 * Creates a test NestJS application with all controllers and default error handling configuration
 */
export async function createDefaultTestApp(): Promise<INestApplication> {
  return createTestApp();
}

/**
 * Creates a test NestJS application with only validation error controllers
 */
export async function createValidationErrorsTestApp(): Promise<INestApplication> {
  return createTestApp({
    includeValidationErrors: true,
    includeBusinessErrors: false,
    includeTechnicalErrors: false,
    includeExternalErrors: false,
    includeJourneyErrors: false,
    includeRecoveryStrategies: false,
  });
}

/**
 * Creates a test NestJS application with only business error controllers
 */
export async function createBusinessErrorsTestApp(): Promise<INestApplication> {
  return createTestApp({
    includeValidationErrors: false,
    includeBusinessErrors: true,
    includeTechnicalErrors: false,
    includeExternalErrors: false,
    includeJourneyErrors: false,
    includeRecoveryStrategies: false,
  });
}

/**
 * Creates a test NestJS application with only technical error controllers
 */
export async function createTechnicalErrorsTestApp(): Promise<INestApplication> {
  return createTestApp({
    includeValidationErrors: false,
    includeBusinessErrors: false,
    includeTechnicalErrors: true,
    includeExternalErrors: false,
    includeJourneyErrors: false,
    includeRecoveryStrategies: false,
  });
}

/**
 * Creates a test NestJS application with only external error controllers
 */
export async function createExternalErrorsTestApp(): Promise<INestApplication> {
  return createTestApp({
    includeValidationErrors: false,
    includeBusinessErrors: false,
    includeTechnicalErrors: false,
    includeExternalErrors: true,
    includeJourneyErrors: false,
    includeRecoveryStrategies: false,
  });
}

/**
 * Creates a test NestJS application with only journey-specific error controllers
 */
export async function createJourneyErrorsTestApp(): Promise<INestApplication> {
  return createTestApp({
    includeValidationErrors: false,
    includeBusinessErrors: false,
    includeTechnicalErrors: false,
    includeExternalErrors: false,
    includeJourneyErrors: true,
    includeRecoveryStrategies: false,
  });
}

/**
 * Creates a test NestJS application with only recovery strategy controllers
 */
export async function createRecoveryStrategiesTestApp(): Promise<INestApplication> {
  return createTestApp({
    includeValidationErrors: false,
    includeBusinessErrors: false,
    includeTechnicalErrors: false,
    includeExternalErrors: false,
    includeJourneyErrors: false,
    includeRecoveryStrategies: true,
  });
}