import { INestApplication, Module, Controller, Get, Post, Body, Query, Param, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorsModule } from '../../src/nest/module';
import { BaseError } from '../../src/base';
import { ErrorType } from '../../src/types';
import { ValidationError, MissingParameterError, InvalidParameterError } from '../../src/categories/validation.errors';
import { BusinessRuleViolationError, ResourceNotFoundError, ConflictError } from '../../src/categories/business.errors';
import { InternalServerError, DatabaseError, TimeoutError } from '../../src/categories/technical.errors';
import { ExternalApiError, ExternalDependencyUnavailableError } from '../../src/categories/external.errors';
import { Retry, RetryWithBackoff } from '../../src/decorators/retry.decorator';
import { WithFallback } from '../../src/decorators/fallback.decorator';
import { CircuitBreaker } from '../../src/decorators/circuit-breaker.decorator';
import { WithErrorContext } from '../../src/decorators/error-context.decorator';
import { Resilient } from '../../src/decorators/resilient.decorator';

/**
 * Interface for configuring the test application
 */
export interface TestAppOptions {
  /** Enable or disable global validation pipe */
  enableValidation?: boolean;
  /** Custom ErrorsModule options */
  errorsModuleOptions?: Record<string, any>;
  /** Additional modules to import */
  imports?: any[];
  /** Additional controllers to include */
  controllers?: any[];
  /** Additional providers to include */
  providers?: any[];
}

/**
 * Controller that triggers validation errors
 */
@Controller('validation')
export class ValidationErrorsController {
  @Get('missing-param')
  getMissingParam(@Query('required') required: string) {
    if (!required) {
      throw new MissingParameterError('required');
    }
    return { success: true, value: required };
  }

  @Get('invalid-param/:id')
  getInvalidParam(@Param('id') id: string) {
    if (isNaN(Number(id))) {
      throw new InvalidParameterError('id', 'Must be a number');
    }
    return { success: true, id: Number(id) };
  }

  @Post('validate-body')
  validateBody(@Body() body: any) {
    if (!body || !body.name) {
      throw new ValidationError('Body must contain a name property');
    }
    return { success: true, name: body.name };
  }
}

/**
 * Controller that triggers business errors
 */
@Controller('business')
export class BusinessErrorsController {
  @Get('resource/:id')
  getResource(@Param('id') id: string) {
    if (id === '404') {
      throw new ResourceNotFoundError('Resource', id);
    }
    return { success: true, id };
  }

  @Post('conflict')
  createConflict(@Body() body: any) {
    if (body && body.id === 'existing') {
      throw new ConflictError('Resource with this ID already exists');
    }
    return { success: true, id: body.id };
  }

  @Get('rule-violation')
  checkBusinessRule(@Query('value') value: string) {
    if (value && Number(value) < 0) {
      throw new BusinessRuleViolationError('Value must be positive', 'POSITIVE_VALUE_RULE');
    }
    return { success: true, value };
  }
}

/**
 * Controller that triggers technical errors
 */
@Controller('technical')
export class TechnicalErrorsController {
  @Get('internal-error')
  getInternalError() {
    throw new InternalServerError('Something went wrong internally');
  }

  @Get('database-error')
  getDatabaseError() {
    throw new DatabaseError('Failed to execute database query', 'SELECT_OPERATION');
  }

  @Get('timeout')
  getTimeout() {
    throw new TimeoutError('Operation timed out after 5000ms', 5000);
  }

  @Get('unhandled-error')
  getUnhandledError() {
    // This will be caught by the global exception filter
    throw new Error('Unhandled error');
  }
}

/**
 * Controller that triggers external dependency errors
 */
@Controller('external')
export class ExternalErrorsController {
  @Get('api-error')
  getApiError() {
    throw new ExternalApiError(
      'Failed to fetch data from external API',
      'https://api.example.com/data',
      HttpStatus.BAD_GATEWAY
    );
  }

  @Get('dependency-unavailable')
  getDependencyUnavailable() {
    throw new ExternalDependencyUnavailableError(
      'External payment service is currently unavailable',
      'PAYMENT_SERVICE'
    );
  }
}

/**
 * Controller that tests resilience patterns
 */
@Controller('resilience')
export class ResiliencePatternsController {
  private retryCount = 0;
  private circuitBreakerCount = 0;
  private fallbackCalled = false;

  @Get('retry')
  @Retry({ maxAttempts: 3 })
  getWithRetry(@Query('fail') shouldFail?: string) {
    this.retryCount++;
    if (shouldFail === 'true' && this.retryCount < 3) {
      throw new TimeoutError('Operation timed out, will retry', 1000);
    }
    const result = { success: true, attempts: this.retryCount };
    this.retryCount = 0;
    return result;
  }

  @Get('retry-backoff')
  @RetryWithBackoff({ maxAttempts: 3, initialDelayMs: 100 })
  getWithBackoffRetry(@Query('fail') shouldFail?: string) {
    this.retryCount++;
    if (shouldFail === 'true' && this.retryCount < 3) {
      throw new ExternalApiError('External API failed, will retry with backoff', 'https://api.example.com', 503);
    }
    const result = { success: true, attempts: this.retryCount };
    this.retryCount = 0;
    return result;
  }

  @Get('circuit-breaker')
  @CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 5000 })
  getWithCircuitBreaker(@Query('fail') shouldFail?: string) {
    this.circuitBreakerCount++;
    if (shouldFail === 'true') {
      throw new ExternalDependencyUnavailableError('Service unavailable', 'TEST_SERVICE');
    }
    return { success: true, count: this.circuitBreakerCount };
  }

  @Get('fallback')
  @WithFallback(() => ({ success: false, fallback: true, message: 'Using fallback data' }))
  getWithFallback(@Query('fail') shouldFail?: string) {
    if (shouldFail === 'true') {
      throw new DatabaseError('Database query failed', 'SELECT_OPERATION');
    }
    return { success: true, fallback: false, message: 'Using real data' };
  }

  @Get('resilient')
  @Resilient({
    retry: { maxAttempts: 2 },
    circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 5000 },
    fallback: () => ({ success: false, resilient: true, message: 'Using resilient fallback' })
  })
  getResilient(@Query('fail') shouldFail?: string) {
    if (shouldFail === 'true') {
      throw new ExternalApiError('External API failed in resilient endpoint', 'https://api.example.com', 503);
    }
    return { success: true, resilient: false, message: 'Using real data with resilience' };
  }

  @Get('reset')
  reset() {
    this.retryCount = 0;
    this.circuitBreakerCount = 0;
    this.fallbackCalled = false;
    return { success: true, message: 'Counters reset' };
  }
}

/**
 * Controller that tests error context and journey-specific errors
 */
@Controller('context')
export class ErrorContextController {
  @Get('with-context')
  @WithErrorContext({ journey: 'TEST_JOURNEY', feature: 'ERROR_TESTING' })
  getWithContext(@Query('type') errorType?: string) {
    switch (errorType) {
      case 'validation':
        throw new ValidationError('Validation error with context');
      case 'business':
        throw new BusinessRuleViolationError('Business rule violation with context', 'TEST_RULE');
      case 'technical':
        throw new InternalServerError('Technical error with context');
      case 'external':
        throw new ExternalApiError('External error with context', 'https://api.example.com', 502);
      default:
        return { success: true, context: { journey: 'TEST_JOURNEY', feature: 'ERROR_TESTING' } };
    }
  }

  @Get('custom-error')
  getCustomError() {
    class CustomJourneyError extends BaseError {
      constructor(message: string) {
        super({
          message,
          type: ErrorType.BUSINESS,
          code: 'CUSTOM_JOURNEY_ERROR',
          statusCode: HttpStatus.BAD_REQUEST,
          context: {
            journey: 'CUSTOM_JOURNEY',
            feature: 'CUSTOM_FEATURE'
          }
        });
      }
    }

    throw new CustomJourneyError('This is a custom journey-specific error');
  }
}

/**
 * Default test module with controllers for testing various error scenarios
 */
@Module({
  imports: [ErrorsModule.forRoot()],
  controllers: [
    ValidationErrorsController,
    BusinessErrorsController,
    TechnicalErrorsController,
    ExternalErrorsController,
    ResiliencePatternsController,
    ErrorContextController
  ]
})
export class TestModule {}

/**
 * Creates a configurable test module for testing the error handling framework
 */
export function createTestModule(options: TestAppOptions = {}) {
  const {
    enableValidation = true,
    errorsModuleOptions = {},
    imports = [],
    controllers = [],
    providers = []
  } = options;

  @Module({
    imports: [ErrorsModule.forRoot(errorsModuleOptions), ...imports],
    controllers: [
      ValidationErrorsController,
      BusinessErrorsController,
      TechnicalErrorsController,
      ExternalErrorsController,
      ResiliencePatternsController,
      ErrorContextController,
      ...controllers
    ],
    providers: [...providers]
  })
  class ConfigurableTestModule {}

  return ConfigurableTestModule;
}

/**
 * Creates and initializes a NestJS application for testing the error handling framework
 */
export async function createTestApplication(options: TestAppOptions = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [createTestModule(options)]
  }).compile();

  const app = moduleRef.createNestApplication();
  
  if (options.enableValidation) {
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    }));
  }

  await app.init();
  return app;
}