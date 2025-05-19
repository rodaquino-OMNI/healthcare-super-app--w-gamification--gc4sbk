import { Module, Controller, Get, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { ErrorsModule } from '../../src/nest/module';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

/**
 * DTO for testing validation errors
 */
export class TestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  age: number;
}

/**
 * Controller with endpoints that trigger different types of errors
 * for testing the GlobalExceptionFilter
 */
@Controller('test')
export class TestController {
  @Get('validation-error')
  triggerValidationError() {
    // This will be mocked to throw a validation error
    return { message: 'This should not be returned' };
  }

  @Post('validate-dto')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  validateDto(@Body() dto: TestDto) {
    return dto;
  }

  @Get('business-error')
  triggerBusinessError() {
    // This will be mocked to throw a business error
    return { message: 'This should not be returned' };
  }

  @Get('business-error-with-context')
  triggerBusinessErrorWithContext() {
    // This will be mocked to throw a business error with context
    return { message: 'This should not be returned' };
  }

  @Get('technical-error')
  triggerTechnicalError() {
    // This will be mocked to throw a technical error
    return { message: 'This should not be returned' };
  }

  @Get('technical-error-with-sensitive-data')
  triggerTechnicalErrorWithSensitiveData() {
    // This will be mocked to throw a technical error with sensitive data
    return { message: 'This should not be returned' };
  }

  @Get('external-error')
  triggerExternalError() {
    // This will be mocked to throw an external error
    return { message: 'This should not be returned' };
  }

  @Get('external-rate-limit-error')
  triggerExternalRateLimitError() {
    // This will be mocked to throw an external rate limit error
    return { message: 'This should not be returned' };
  }

  @Get('generic-error')
  triggerGenericError() {
    // This will be mocked to throw a generic Error
    return { message: 'This should not be returned' };
  }

  @Get('async-error')
  async triggerAsyncError() {
    // This will be mocked to throw an async error
    return { message: 'This should not be returned' };
  }

  @Get('health-journey-error')
  triggerHealthJourneyError() {
    // This will be mocked to throw a health journey error
    return { message: 'This should not be returned' };
  }

  @Get('care-journey-error')
  triggerCareJourneyError() {
    // This will be mocked to throw a care journey error
    return { message: 'This should not be returned' };
  }

  @Get('plan-journey-error')
  triggerPlanJourneyError() {
    // This will be mocked to throw a plan journey error
    return { message: 'This should not be returned' };
  }

  @Get('error-with-circular-reference')
  triggerErrorWithCircularReference() {
    // This will be mocked to throw an error with circular reference
    return { message: 'This should not be returned' };
  }

  @Get('error-with-nested-causes')
  triggerErrorWithNestedCauses() {
    // This will be mocked to throw an error with nested causes
    return { message: 'This should not be returned' };
  }
}

/**
 * Creates a test module with the ErrorsModule and TestController
 * for testing the GlobalExceptionFilter
 */
export function createTestModule() {
  @Module({
    imports: [
      ErrorsModule.forRoot({
        // Configure ErrorsModule for testing
        logErrors: true,
        exposeErrorDetails: true,
      }),
    ],
    controllers: [TestController],
  })
  class TestModule {}

  return TestModule;
}