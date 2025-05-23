import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../src/logger.service';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * TestService provides methods for testing various logging scenarios
 * in the e2e test environment. It includes functions that generate logs
 * at different levels, with different contexts, and in error scenarios.
 */
@Injectable()
export class TestService {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Processes a payload and logs the operation
   */
  async processPayload(payload: any): Promise<any> {
    this.logger.log('Processing payload', { payload }, 'TestService');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Log the result
    const result = {
      processed: true,
      timestamp: new Date().toISOString(),
      originalSize: JSON.stringify(payload).length,
      status: 'success',
    };
    
    this.logger.log('Payload processed successfully', { result }, 'TestService');
    
    return result;
  }

  /**
   * Simulates different types of errors for testing error logging
   */
  async simulateError(errorType: string): Promise<never> {
    this.logger.log(`Simulating ${errorType} error`, 'TestService');
    
    switch (errorType) {
      case 'validation':
        this.logger.warn('Validation error will be thrown', 'TestService');
        throw new HttpException('Invalid input parameters', HttpStatus.BAD_REQUEST);
        
      case 'business':
        this.logger.warn('Business logic error will be thrown', 'TestService');
        throw new HttpException('Business rule violation', HttpStatus.CONFLICT);
        
      case 'technical':
        this.logger.warn('Technical error will be thrown', 'TestService');
        throw new Error('Internal system error occurred');
        
      case 'external':
        this.logger.warn('External dependency error will be thrown', 'TestService');
        throw new HttpException('External service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
        
      case 'unhandled':
        this.logger.warn('Unhandled error will be thrown', 'TestService');
        // Simulate an unhandled error
        throw new Error('Unexpected error occurred');
        
      default:
        this.logger.warn('Default error will be thrown', 'TestService');
        throw new Error(`Unknown error type: ${errorType}`);
    }
  }

  /**
   * Performs a complex operation with multiple log entries
   */
  async performComplexOperation(params: any): Promise<any> {
    this.logger.log('Starting complex operation', { params }, 'TestService');
    
    try {
      // Step 1
      this.logger.debug('Performing step 1', 'TestService');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Step 2
      this.logger.debug('Performing step 2', 'TestService');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Step 3 - simulate a warning condition
      this.logger.warn(
        'Potential issue detected in step 3', 
        { issue: 'resource-constraint', severity: 'medium' }, 
        'TestService'
      );
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Final step
      this.logger.log('Complex operation completed', 'TestService');
      
      return {
        status: 'success',
        duration: 150,
        warnings: 1,
      };
    } catch (error) {
      this.logger.error(
        `Error in complex operation: ${error.message}`,
        error.stack,
        'TestService'
      );
      throw error;
    }
  }

  /**
   * Tests logging with sensitive data that should be sanitized
   */
  async processSensitiveData(userData: any): Promise<any> {
    // This should be sanitized in the logs
    this.logger.log('Processing user data', { userData }, 'TestService');
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      status: 'success',
      message: 'User data processed securely',
    };
  }
}