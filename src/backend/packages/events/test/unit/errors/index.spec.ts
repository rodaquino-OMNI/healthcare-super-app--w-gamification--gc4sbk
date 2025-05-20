import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import * as ErrorsModule from '../../../src/errors';
import { EventErrorCode } from '../../../src/constants/errors.constants';

// Import mocks to avoid circular dependencies during testing
import { mockEventError, mockValidationError, mockDLQService } from '../errors/mocks';

/**
 * Test suite for the errors barrel file (index.ts)
 * 
 * This test ensures that all error-related components are properly exported
 * from the barrel file with the correct names and types. It maintains the
 * public API contract for error handling components and prevents accidental
 * breaking changes through missing exports.
 * 
 * The errors barrel file exports:
 * - Error classes for different types of event processing failures
 * - Journey-specific error classes for health, care, and plan journeys
 * - Error handling decorators for consistent error processing
 * - Retry policies for failed events with different backoff strategies
 * - Dead Letter Queue (DLQ) functionality for events that can't be processed
 * - Utility functions for error classification and formatting
 * - Constants and types for error handling configuration
 */
describe('Errors Barrel File', () => {
  let testingModule: TestingModule;

  beforeAll(async () => {
    // Create a testing module with the ErrorsModule
    testingModule = await Test.createTestingModule({
      imports: [ErrorsModule.ErrorsModule],
    }).compile();
  });
  /**
   * Tests for base error classes and their specialized variants
   * These classes form the foundation of the error handling system
   */
  describe('Error Classes', () => {
    it('should export EventError base class', () => {
      expect(ErrorsModule.EventError).toBeDefined();
      expect(typeof ErrorsModule.EventError).toBe('function');
      
      // Test instantiation
      const error = new ErrorsModule.EventError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('EventError');
      expect(error.message).toBe('Test error');
      expect(error.stack).toBeDefined();
    });

    it('should export ValidationError class', () => {
      expect(ErrorsModule.ValidationError).toBeDefined();
      expect(typeof ErrorsModule.ValidationError).toBe('function');
      
      // Test instantiation with validation details
      const error = new ErrorsModule.ValidationError('Invalid event data', {
        field: 'eventType',
        message: 'Event type is required',
      });
      expect(error).toBeInstanceOf(ErrorsModule.EventError);
      expect(error.name).toBe('ValidationError');
      expect(error.details).toBeDefined();
    });

    it('should export SchemaError class', () => {
      expect(ErrorsModule.SchemaError).toBeDefined();
      expect(typeof ErrorsModule.SchemaError).toBe('function');
      
      // Test instantiation
      const error = new ErrorsModule.SchemaError('Schema validation failed');
      expect(error).toBeInstanceOf(ErrorsModule.EventError);
      expect(error.name).toBe('SchemaError');
    });

    it('should export DeliveryError class', () => {
      expect(ErrorsModule.DeliveryError).toBeDefined();
      expect(typeof ErrorsModule.DeliveryError).toBe('function');
      
      // Test instantiation
      const error = new ErrorsModule.DeliveryError('Failed to deliver event');
      expect(error).toBeInstanceOf(ErrorsModule.EventError);
      expect(error.name).toBe('DeliveryError');
    });

    it('should export ProcessingError class', () => {
      expect(ErrorsModule.ProcessingError).toBeDefined();
      expect(typeof ErrorsModule.ProcessingError).toBe('function');
      
      // Test instantiation
      const error = new ErrorsModule.ProcessingError('Failed to process event');
      expect(error).toBeInstanceOf(ErrorsModule.EventError);
      expect(error.name).toBe('ProcessingError');
    });

    it('should export TimeoutError class', () => {
      expect(ErrorsModule.TimeoutError).toBeDefined();
      expect(typeof ErrorsModule.TimeoutError).toBe('function');
      
      // Test instantiation
      const error = new ErrorsModule.TimeoutError('Event processing timed out');
      expect(error).toBeInstanceOf(ErrorsModule.EventError);
      expect(error.name).toBe('TimeoutError');
    });
  });

  /**
   * Tests for journey-specific error classes that extend the base error system
   * These classes capture context specific to each journey (health, care, plan)
   */
  describe('Journey-Specific Error Classes', () => {
    it('should export HealthEventError class', () => {
      expect(ErrorsModule.HealthEventError).toBeDefined();
      expect(typeof ErrorsModule.HealthEventError).toBe('function');
      
      // Test instantiation
      const error = new ErrorsModule.HealthEventError('Health event processing failed');
      expect(error).toBeInstanceOf(ErrorsModule.EventError);
      expect(error.journey).toBe('health');
    });

    it('should export CareEventError class', () => {
      expect(ErrorsModule.CareEventError).toBeDefined();
      expect(typeof ErrorsModule.CareEventError).toBe('function');
      
      // Test instantiation
      const error = new ErrorsModule.CareEventError('Care event processing failed');
      expect(error).toBeInstanceOf(ErrorsModule.EventError);
      expect(error.journey).toBe('care');
    });

    it('should export PlanEventError class', () => {
      expect(ErrorsModule.PlanEventError).toBeDefined();
      expect(typeof ErrorsModule.PlanEventError).toBe('function');
      
      // Test instantiation
      const error = new ErrorsModule.PlanEventError('Plan event processing failed');
      expect(error).toBeInstanceOf(ErrorsModule.EventError);
      expect(error.journey).toBe('plan');
    });
  });

  /**
   * Tests for decorators that provide error handling functionality
   * These decorators wrap event processors to handle errors consistently
   */
  describe('Error Handling Decorators', () => {
    it('should export HandleEventErrors decorator', () => {
      expect(ErrorsModule.HandleEventErrors).toBeDefined();
      expect(typeof ErrorsModule.HandleEventErrors).toBe('function');
    });

    it('should export RetryOnFailure decorator', () => {
      expect(ErrorsModule.RetryOnFailure).toBeDefined();
      expect(typeof ErrorsModule.RetryOnFailure).toBe('function');
    });

    it('should export SendToDLQ decorator', () => {
      expect(ErrorsModule.SendToDLQ).toBeDefined();
      expect(typeof ErrorsModule.SendToDLQ).toBe('function');
    });
  });

  /**
   * Tests for retry policy implementations that determine retry behavior
   * These policies control when and how failed events are retried
   */
  describe('Retry Policies', () => {
    it('should export RetryPolicy interface', () => {
      // Can't directly test interface existence, but we can check if it's referenced
      expect(ErrorsModule.RetryPolicyType).toBeDefined();
    });

    it('should export ExponentialBackoffPolicy class', () => {
      expect(ErrorsModule.ExponentialBackoffPolicy).toBeDefined();
      expect(typeof ErrorsModule.ExponentialBackoffPolicy).toBe('function');
      
      // Test instantiation
      const policy = new ErrorsModule.ExponentialBackoffPolicy();
      expect(policy.shouldRetry).toBeDefined();
      expect(typeof policy.shouldRetry).toBe('function');
      expect(policy.getDelay).toBeDefined();
      expect(typeof policy.getDelay).toBe('function');
    });

    it('should export ConstantIntervalPolicy class', () => {
      expect(ErrorsModule.ConstantIntervalPolicy).toBeDefined();
      expect(typeof ErrorsModule.ConstantIntervalPolicy).toBe('function');
      
      // Test instantiation
      const policy = new ErrorsModule.ConstantIntervalPolicy();
      expect(policy.shouldRetry).toBeDefined();
      expect(typeof policy.shouldRetry).toBe('function');
      expect(policy.getDelay).toBeDefined();
      expect(typeof policy.getDelay).toBe('function');
    });

    it('should export RetryPolicyFactory', () => {
      expect(ErrorsModule.RetryPolicyFactory).toBeDefined();
      expect(typeof ErrorsModule.RetryPolicyFactory.createPolicy).toBe('function');
    });
  });

  /**
   * Tests for Dead Letter Queue (DLQ) functionality
   * DLQ handles events that have exceeded retry limits or cannot be processed
   */
  describe('Dead Letter Queue (DLQ)', () => {
    it('should export DLQService', () => {
      expect(ErrorsModule.DLQService).toBeDefined();
      expect(typeof ErrorsModule.DLQService).toBe('function');
      
      // Verify it's a NestJS injectable service
      const metadata = Reflect.getMetadata('__injectable__', ErrorsModule.DLQService);
      expect(metadata).toBeDefined();
    });

    it('should export DLQMessage interface', () => {
      // Can't directly test interface existence, but we can check if it's referenced
      expect(ErrorsModule.DLQMessageType).toBeDefined();
    });

    it('should export sendToDLQ function', () => {
      expect(ErrorsModule.sendToDLQ).toBeDefined();
      expect(typeof ErrorsModule.sendToDLQ).toBe('function');
    });

    it('should export reprocessFromDLQ function', () => {
      expect(ErrorsModule.reprocessFromDLQ).toBeDefined();
      expect(typeof ErrorsModule.reprocessFromDLQ).toBe('function');
    });
  });

  /**
   * Tests for utility functions that support error handling
   * These utilities help classify, format, and process errors
   */
  describe('Error Utilities', () => {
    it('should export isRetryableError function', () => {
      expect(ErrorsModule.isRetryableError).toBeDefined();
      expect(typeof ErrorsModule.isRetryableError).toBe('function');
    });

    it('should export getErrorContext function', () => {
      expect(ErrorsModule.getErrorContext).toBeDefined();
      expect(typeof ErrorsModule.getErrorContext).toBe('function');
    });

    it('should export formatErrorForLogging function', () => {
      expect(ErrorsModule.formatErrorForLogging).toBeDefined();
      expect(typeof ErrorsModule.formatErrorForLogging).toBe('function');
    });

    it('should export classifyError function', () => {
      expect(ErrorsModule.classifyError).toBeDefined();
      expect(typeof ErrorsModule.classifyError).toBe('function');
    });
  });

  /**
   * Tests for constants used in error handling
   * These constants define error codes, retry limits, and backoff parameters
   */
  describe('Error Constants', () => {
    it('should export EventErrorCode enum', () => {
      expect(ErrorsModule.EventErrorCode).toBeDefined();
      expect(ErrorsModule.EventErrorCode).toEqual(EventErrorCode);
    });

    it('should export MAX_RETRY_ATTEMPTS constant', () => {
      expect(ErrorsModule.MAX_RETRY_ATTEMPTS).toBeDefined();
      expect(typeof ErrorsModule.MAX_RETRY_ATTEMPTS).toBe('number');
    });

    it('should export DEFAULT_BACKOFF_MULTIPLIER constant', () => {
      expect(ErrorsModule.DEFAULT_BACKOFF_MULTIPLIER).toBeDefined();
      expect(typeof ErrorsModule.DEFAULT_BACKOFF_MULTIPLIER).toBe('number');
    });

    it('should export DEFAULT_INITIAL_DELAY constant', () => {
      expect(ErrorsModule.DEFAULT_INITIAL_DELAY).toBeDefined();
      expect(typeof ErrorsModule.DEFAULT_INITIAL_DELAY).toBe('number');
    });
  });

  /**
   * Tests for type definitions and interfaces
   * These types provide structure and type safety for error handling
   */
  describe('Types and Interfaces', () => {
    it('should export ErrorContext type', () => {
      // Can't directly test type existence, but we can check if it's referenced
      expect(ErrorsModule.ErrorContextType).toBeDefined();
    });

    it('should export RetryState interface', () => {
      // Can't directly test interface existence, but we can check if it's referenced
      expect(ErrorsModule.RetryStateType).toBeDefined();
    });

    it('should export ErrorHandlerOptions interface', () => {
      // Can't directly test interface existence, but we can check if it's referenced
      expect(ErrorsModule.ErrorHandlerOptionsType).toBeDefined();
    });
  });

  /**
   * Tests for module structure and organization
   * These tests ensure the module is properly structured for dependency injection
   */
  describe('Module Structure', () => {
    it('should provide ErrorsService through dependency injection', () => {
      const errorsService = testingModule.get(ErrorsModule.ErrorsService);
      expect(errorsService).toBeInstanceOf(ErrorsModule.ErrorsService);
    });
    
    it('should provide DLQService through dependency injection', () => {
      const dlqService = testingModule.get(ErrorsModule.DLQService);
      expect(dlqService).toBeInstanceOf(ErrorsModule.DLQService);
    });
    it('should export ErrorsModule', () => {
      expect(ErrorsModule.ErrorsModule).toBeDefined();
      expect(typeof ErrorsModule.ErrorsModule).toBe('function');
      
      // Verify it's a NestJS module
      const metadata = Reflect.getMetadata('__module__', ErrorsModule.ErrorsModule);
      expect(metadata).toBeDefined();
    });

    it('should export ErrorsService', () => {
      expect(ErrorsModule.ErrorsService).toBeDefined();
      expect(typeof ErrorsModule.ErrorsService).toBe('function');
      
      // Verify it's a NestJS injectable service
      const metadata = Reflect.getMetadata('__injectable__', ErrorsModule.ErrorsService);
      expect(metadata).toBeDefined();
    });
  });
});