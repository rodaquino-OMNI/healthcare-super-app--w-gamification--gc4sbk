import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../src/types';
import {
  PlanNotFoundError,
  PlanNotAvailableInRegionError,
  PlanSelectionValidationError,
  PlanComparisonError,
  PlanPersistenceError,
  PlanProviderApiError
} from '../../../../../../src/journey/plan/plans-errors';

describe('Plan Journey - Plans Errors', () => {
  describe('PlanNotFoundError', () => {
    it('should extend BaseError with BUSINESS type', () => {
      const error = new PlanNotFoundError('Plan not found', { planId: '123' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.message).toBe('Plan not found');
      expect(error.context).toEqual({ planId: '123' });
    });

    it('should map to NOT_FOUND HTTP status code', () => {
      const error = new PlanNotFoundError('Plan not found', { planId: '123' });
      
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should serialize with proper error code and context', () => {
      const error = new PlanNotFoundError('Plan not found', { planId: '123' });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('code');
      expect(serialized.code).toMatch(/^PLAN_PLANS_/);
      expect(serialized).toHaveProperty('message', 'Plan not found');
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toEqual({ planId: '123' });
    });
  });

  describe('PlanNotAvailableInRegionError', () => {
    it('should extend BaseError with BUSINESS type', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region', { 
        planId: '123', 
        regionCode: 'NYC' 
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.message).toBe('Plan not available in region');
      expect(error.context).toEqual({ planId: '123', regionCode: 'NYC' });
    });

    it('should map to UNPROCESSABLE_ENTITY HTTP status code', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region', { 
        planId: '123', 
        regionCode: 'NYC' 
      });
      
      expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize with proper error code and context', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region', { 
        planId: '123', 
        regionCode: 'NYC' 
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('code');
      expect(serialized.code).toMatch(/^PLAN_PLANS_/);
      expect(serialized).toHaveProperty('message', 'Plan not available in region');
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toEqual({ planId: '123', regionCode: 'NYC' });
    });
  });

  describe('PlanSelectionValidationError', () => {
    it('should extend BaseError with VALIDATION type', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection', { 
        planId: '123', 
        validationErrors: ['Missing required field: dependents'] 
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe('Invalid plan selection');
      expect(error.context).toEqual({ 
        planId: '123', 
        validationErrors: ['Missing required field: dependents'] 
      });
    });

    it('should map to BAD_REQUEST HTTP status code', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection', { 
        planId: '123', 
        validationErrors: ['Missing required field: dependents'] 
      });
      
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize with proper error code and context', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection', { 
        planId: '123', 
        validationErrors: ['Missing required field: dependents'] 
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('code');
      expect(serialized.code).toMatch(/^PLAN_PLANS_/);
      expect(serialized).toHaveProperty('message', 'Invalid plan selection');
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toEqual({ 
        planId: '123', 
        validationErrors: ['Missing required field: dependents'] 
      });
    });
  });

  describe('PlanComparisonError', () => {
    it('should extend BaseError with TECHNICAL type', () => {
      const error = new PlanComparisonError('Failed to compare plans', { 
        planIds: ['123', '456'], 
        reason: 'Missing comparable features' 
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.message).toBe('Failed to compare plans');
      expect(error.context).toEqual({ 
        planIds: ['123', '456'], 
        reason: 'Missing comparable features' 
      });
    });

    it('should map to INTERNAL_SERVER_ERROR HTTP status code', () => {
      const error = new PlanComparisonError('Failed to compare plans', { 
        planIds: ['123', '456'], 
        reason: 'Missing comparable features' 
      });
      
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize with proper error code and context', () => {
      const error = new PlanComparisonError('Failed to compare plans', { 
        planIds: ['123', '456'], 
        reason: 'Missing comparable features' 
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('code');
      expect(serialized.code).toMatch(/^PLAN_PLANS_/);
      expect(serialized).toHaveProperty('message', 'Failed to compare plans');
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toEqual({ 
        planIds: ['123', '456'], 
        reason: 'Missing comparable features' 
      });
    });
  });

  describe('PlanPersistenceError', () => {
    it('should extend BaseError with TECHNICAL type', () => {
      const error = new PlanPersistenceError('Failed to save plan data', { 
        planId: '123', 
        operation: 'update' 
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.message).toBe('Failed to save plan data');
      expect(error.context).toEqual({ planId: '123', operation: 'update' });
    });

    it('should map to INTERNAL_SERVER_ERROR HTTP status code', () => {
      const error = new PlanPersistenceError('Failed to save plan data', { 
        planId: '123', 
        operation: 'update' 
      });
      
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize with proper error code and context', () => {
      const error = new PlanPersistenceError('Failed to save plan data', { 
        planId: '123', 
        operation: 'update' 
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('code');
      expect(serialized.code).toMatch(/^PLAN_PLANS_/);
      expect(serialized).toHaveProperty('message', 'Failed to save plan data');
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toEqual({ planId: '123', operation: 'update' });
    });
  });

  describe('PlanProviderApiError', () => {
    it('should extend BaseError with EXTERNAL type', () => {
      const error = new PlanProviderApiError('Insurance provider API error', { 
        planId: '123', 
        providerName: 'ACME Insurance', 
        statusCode: 503,
        endpoint: '/api/plans/details'
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.message).toBe('Insurance provider API error');
      expect(error.context).toEqual({ 
        planId: '123', 
        providerName: 'ACME Insurance', 
        statusCode: 503,
        endpoint: '/api/plans/details'
      });
    });

    it('should map to SERVICE_UNAVAILABLE HTTP status code', () => {
      const error = new PlanProviderApiError('Insurance provider API error', { 
        planId: '123', 
        providerName: 'ACME Insurance', 
        statusCode: 503,
        endpoint: '/api/plans/details'
      });
      
      expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should serialize with proper error code and context', () => {
      const error = new PlanProviderApiError('Insurance provider API error', { 
        planId: '123', 
        providerName: 'ACME Insurance', 
        statusCode: 503,
        endpoint: '/api/plans/details'
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('code');
      expect(serialized.code).toMatch(/^PLAN_PLANS_/);
      expect(serialized).toHaveProperty('message', 'Insurance provider API error');
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toEqual({ 
        planId: '123', 
        providerName: 'ACME Insurance', 
        statusCode: 503,
        endpoint: '/api/plans/details'
      });
    });
  });

  describe('Error recovery guidance', () => {
    it('should include recovery steps for PlanNotFoundError', () => {
      const error = new PlanNotFoundError('Plan not found', { planId: '123' });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('recoverySteps');
      expect(Array.isArray(serialized.recoverySteps)).toBe(true);
      expect(serialized.recoverySteps.length).toBeGreaterThan(0);
    });

    it('should include recovery steps for PlanNotAvailableInRegionError', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region', { 
        planId: '123', 
        regionCode: 'NYC' 
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('recoverySteps');
      expect(Array.isArray(serialized.recoverySteps)).toBe(true);
      expect(serialized.recoverySteps.length).toBeGreaterThan(0);
    });

    it('should include validation guidance for PlanSelectionValidationError', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection', { 
        planId: '123', 
        validationErrors: ['Missing required field: dependents'] 
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('recoverySteps');
      expect(Array.isArray(serialized.recoverySteps)).toBe(true);
      expect(serialized.recoverySteps.length).toBeGreaterThan(0);
      expect(serialized.recoverySteps.some(step => 
        step.includes('required field') || step.includes('validation')
      )).toBe(true);
    });
  });

  describe('Error tracking metadata', () => {
    it('should include tracking metadata for technical errors', () => {
      const error = new PlanPersistenceError('Failed to save plan data', { 
        planId: '123', 
        operation: 'update' 
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('trackingId');
      expect(typeof serialized.trackingId).toBe('string');
      expect(serialized.trackingId).toMatch(/^[a-f0-9-]+$/);
    });

    it('should include timestamp in serialized errors', () => {
      const error = new PlanComparisonError('Failed to compare plans', { 
        planIds: ['123', '456'], 
        reason: 'Missing comparable features' 
      });
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('timestamp');
      expect(typeof serialized.timestamp).toBe('string');
      // Check if it's a valid ISO date string
      expect(() => new Date(serialized.timestamp)).not.toThrow();
    });
  });
});