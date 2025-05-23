import { Controller, Get, Post, Body, Param, Query, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { TestService } from './test.service';
import { LoggerService } from '../../src/logger.service';
import { TracingService } from '@austa/tracing';
import { JourneyType } from '../../src/context/context.constants';

/**
 * TestController provides endpoints for testing various logging scenarios
 * in the e2e test environment. It includes routes that trigger different
 * log levels, error scenarios, and journey-specific contexts.
 */
@Controller('test')
export class TestController {
  constructor(
    private readonly testService: TestService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Basic endpoint that logs at different levels
   */
  @Get('log-levels')
  async testLogLevels() {
    this.logger.debug('This is a debug message', 'TestController');
    this.logger.log('This is an info message', 'TestController');
    this.logger.warn('This is a warning message', 'TestController');
    this.logger.error('This is an error message', 'TestController');
    
    return { message: 'Logged at all levels' };
  }

  /**
   * Tests structured logging with context
   */
  @Get('structured')
  async testStructuredLogging(@Query('userId') userId: string) {
    const context = {
      userId: userId || 'anonymous',
      requestId: 'test-request-123',
      additionalData: {
        feature: 'logging-test',
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.log('Structured log with context', { context }, 'TestController');
    
    return { message: 'Structured log created', context };
  }

  /**
   * Tests journey-specific logging
   */
  @Get('journey/:journeyType')
  async testJourneyLogging(@Param('journeyType') journeyType: string) {
    let journey;
    
    switch (journeyType.toLowerCase()) {
      case 'health':
        journey = JourneyType.HEALTH;
        break;
      case 'care':
        journey = JourneyType.CARE;
        break;
      case 'plan':
        journey = JourneyType.PLAN;
        break;
      default:
        journey = 'unknown';
    }

    const journeyContext = {
      journeyType: journey,
      journeyId: `${journey}-journey-123`,
      metadata: {
        step: 'initial',
        action: 'test',
      },
    };

    this.logger.log(
      `Log entry for ${journey} journey`, 
      { journeyContext }, 
      'TestController'
    );

    return { message: `Journey log created for ${journey}`, journeyContext };
  }

  /**
   * Tests error logging
   */
  @Get('error')
  async testErrorLogging(@Query('type') errorType: string) {
    try {
      return await this.testService.simulateError(errorType);
    } catch (error) {
      this.logger.error(
        `Caught error in controller: ${error.message}`,
        error.stack,
        'TestController'
      );
      throw error;
    }
  }

  /**
   * Tests tracing integration
   */
  @Get('traced-operation')
  async testTracedOperation() {
    return this.tracingService.createSpan('test-operation', async () => {
      this.logger.log('Log within traced operation', 'TestController');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 50));
      
      this.logger.log('Operation completed', 'TestController');
      
      return { message: 'Traced operation completed' };
    });
  }

  /**
   * Tests logging with payload data
   */
  @Post('log-payload')
  async testLogWithPayload(@Body() payload: any) {
    this.logger.log(
      'Received payload for processing',
      { payload },
      'TestController'
    );
    
    return this.testService.processPayload(payload);
  }
}