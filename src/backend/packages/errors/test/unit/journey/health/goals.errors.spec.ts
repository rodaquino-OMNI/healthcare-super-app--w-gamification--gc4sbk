import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';
import {
  HealthGoalException,
  InvalidGoalParametersError,
  ConflictingGoalsError,
  UnachievableGoalError,
  GoalUpdateRestrictedError,
  GoalTrackingFailureError,
  GoalAchievementProcessingError,
  GoalNotFoundError,
  HealthGoalErrorContext
} from '../../../../src/journey/health/goals.errors';

describe('Health Goals Error Classes', () => {
  // Sample goal context for testing
  const sampleGoalContext: HealthGoalErrorContext = {
    goalId: 'goal-123',
    goalType: 'steps',
    targetValue: 10000,
    unit: 'steps',
    startDate: '2023-01-01',
    endDate: '2023-01-31',
    currentProgress: 5000,
    userId: 'user-456'
  };

  describe('HealthGoalException', () => {
    // We can't directly test the abstract class, but we can test through its subclasses
    it('should be extended by all health goal error classes', () => {
      const invalidParamsError = new InvalidGoalParametersError('Invalid parameters', sampleGoalContext);
      const conflictingGoalsError = new ConflictingGoalsError('Conflicting goals', sampleGoalContext, ['goal-789']);
      const unachievableGoalError = new UnachievableGoalError('Unachievable goal', sampleGoalContext, 8000);
      const updateRestrictedError = new GoalUpdateRestrictedError('Update restricted', sampleGoalContext, 'COMPLETED');
      const trackingFailureError = new GoalTrackingFailureError('Tracking failure', sampleGoalContext, 'UPDATE');
      const achievementError = new GoalAchievementProcessingError('Achievement processing failed', sampleGoalContext, 'achievement-123');
      const notFoundError = new GoalNotFoundError('Goal not found', 'goal-123', 'user-456');

      expect(invalidParamsError).toBeInstanceOf(HealthGoalException);
      expect(conflictingGoalsError).toBeInstanceOf(HealthGoalException);
      expect(unachievableGoalError).toBeInstanceOf(HealthGoalException);
      expect(updateRestrictedError).toBeInstanceOf(HealthGoalException);
      expect(trackingFailureError).toBeInstanceOf(HealthGoalException);
      expect(achievementError).toBeInstanceOf(HealthGoalException);
      expect(notFoundError).toBeInstanceOf(HealthGoalException);
    });
  });

  describe('InvalidGoalParametersError', () => {
    it('should create an error with VALIDATION type and correct error code', () => {
      const error = new InvalidGoalParametersError('Invalid goal parameters', sampleGoalContext);
      
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('HEALTH_GOALS_INVALID_PARAMETERS');
      expect(error.code).toMatch(/^HEALTH_GOALS_/);
      expect(error.message).toBe('Invalid goal parameters');
    });

    it('should capture goal context in the error object', () => {
      const error = new InvalidGoalParametersError('Invalid goal parameters', sampleGoalContext);
      
      expect(error.goalContext).toEqual(sampleGoalContext);
    });

    it('should convert to HTTP exception with BAD_REQUEST status', () => {
      const error = new InvalidGoalParametersError('Invalid goal parameters', sampleGoalContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to JSON with proper structure', () => {
      const error = new InvalidGoalParametersError('Invalid goal parameters', sampleGoalContext);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'HEALTH_GOALS_INVALID_PARAMETERS',
          message: 'Invalid goal parameters',
          details: sampleGoalContext
        }
      });
    });
  });

  describe('ConflictingGoalsError', () => {
    const conflictingGoalIds = ['goal-789', 'goal-101'];

    it('should create an error with BUSINESS type and correct error code', () => {
      const error = new ConflictingGoalsError('Conflicting goals detected', sampleGoalContext, conflictingGoalIds);
      
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_GOALS_CONFLICT');
      expect(error.code).toMatch(/^HEALTH_GOALS_/);
      expect(error.message).toBe('Conflicting goals detected');
    });

    it('should capture goal context and conflicting goal IDs', () => {
      const error = new ConflictingGoalsError('Conflicting goals detected', sampleGoalContext, conflictingGoalIds);
      
      expect(error.goalContext).toMatchObject({
        ...sampleGoalContext,
        conflictingGoalIds
      });
      expect(error.conflictingGoalIds).toEqual(conflictingGoalIds);
    });

    it('should convert to HTTP exception with UNPROCESSABLE_ENTITY status', () => {
      const error = new ConflictingGoalsError('Conflicting goals detected', sampleGoalContext, conflictingGoalIds);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('UnachievableGoalError', () => {
    const recommendedTarget = 8000;

    it('should create an error with BUSINESS type and correct error code', () => {
      const error = new UnachievableGoalError('Goal is unachievable based on history', sampleGoalContext, recommendedTarget);
      
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_GOALS_UNACHIEVABLE');
      expect(error.code).toMatch(/^HEALTH_GOALS_/);
      expect(error.message).toBe('Goal is unachievable based on history');
    });

    it('should capture goal context and recommended target', () => {
      const error = new UnachievableGoalError('Goal is unachievable based on history', sampleGoalContext, recommendedTarget);
      
      expect(error.goalContext).toMatchObject({
        ...sampleGoalContext,
        recommendedTarget
      });
      expect(error.recommendedTarget).toBe(recommendedTarget);
    });

    it('should work without a recommended target', () => {
      const error = new UnachievableGoalError('Goal is unachievable based on history', sampleGoalContext);
      
      expect(error.recommendedTarget).toBeUndefined();
      expect(error.goalContext.recommendedTarget).toBeUndefined();
    });
  });

  describe('GoalUpdateRestrictedError', () => {
    it('should create an error with BUSINESS type and correct error code', () => {
      const error = new GoalUpdateRestrictedError('Cannot update completed goal', sampleGoalContext, 'COMPLETED');
      
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_GOALS_UPDATE_RESTRICTED');
      expect(error.code).toMatch(/^HEALTH_GOALS_/);
      expect(error.message).toBe('Cannot update completed goal');
    });

    it('should capture goal context and restriction reason', () => {
      const error = new GoalUpdateRestrictedError('Cannot update completed goal', sampleGoalContext, 'COMPLETED');
      
      expect(error.goalContext).toMatchObject({
        ...sampleGoalContext,
        restrictionReason: 'COMPLETED'
      });
      expect(error.restrictionReason).toBe('COMPLETED');
    });

    it('should support different restriction reasons', () => {
      const reasons: Array<'COMPLETED' | 'IN_PROGRESS' | 'LOCKED' | 'SYSTEM_GENERATED'> = [
        'COMPLETED', 'IN_PROGRESS', 'LOCKED', 'SYSTEM_GENERATED'
      ];
      
      reasons.forEach(reason => {
        const error = new GoalUpdateRestrictedError(`Cannot update goal: ${reason}`, sampleGoalContext, reason);
        expect(error.restrictionReason).toBe(reason);
        expect(error.goalContext.restrictionReason).toBe(reason);
      });
    });
  });

  describe('GoalTrackingFailureError', () => {
    it('should create an error with TECHNICAL type and correct error code', () => {
      const error = new GoalTrackingFailureError('Failed to update goal progress', sampleGoalContext, 'PROGRESS');
      
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('HEALTH_GOALS_TRACKING_FAILURE');
      expect(error.code).toMatch(/^HEALTH_GOALS_/);
      expect(error.message).toBe('Failed to update goal progress');
    });

    it('should capture goal context and operation type', () => {
      const error = new GoalTrackingFailureError('Failed to update goal progress', sampleGoalContext, 'PROGRESS');
      
      expect(error.goalContext).toMatchObject({
        ...sampleGoalContext,
        operationType: 'PROGRESS'
      });
      expect(error.operationType).toBe('PROGRESS');
    });

    it('should capture original cause if provided', () => {
      const originalError = new Error('Database connection failed');
      const error = new GoalTrackingFailureError(
        'Failed to update goal progress', 
        sampleGoalContext, 
        'PROGRESS',
        originalError
      );
      
      expect(error.cause).toBe(originalError);
    });

    it('should convert to HTTP exception with INTERNAL_SERVER_ERROR status', () => {
      const error = new GoalTrackingFailureError('Failed to update goal progress', sampleGoalContext, 'PROGRESS');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should support all operation types', () => {
      const operations: Array<'CREATE' | 'UPDATE' | 'DELETE' | 'PROGRESS' | 'ACHIEVEMENT'> = [
        'CREATE', 'UPDATE', 'DELETE', 'PROGRESS', 'ACHIEVEMENT'
      ];
      
      operations.forEach(operation => {
        const error = new GoalTrackingFailureError(`Failed to ${operation.toLowerCase()} goal`, sampleGoalContext, operation);
        expect(error.operationType).toBe(operation);
        expect(error.goalContext.operationType).toBe(operation);
      });
    });
  });

  describe('GoalAchievementProcessingError', () => {
    const achievementId = 'achievement-123';

    it('should create an error with TECHNICAL type and correct error code', () => {
      const error = new GoalAchievementProcessingError(
        'Failed to process goal achievement', 
        sampleGoalContext,
        achievementId
      );
      
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('HEALTH_GOALS_ACHIEVEMENT_FAILURE');
      expect(error.code).toMatch(/^HEALTH_GOALS_/);
      expect(error.message).toBe('Failed to process goal achievement');
    });

    it('should capture goal context and achievement ID', () => {
      const error = new GoalAchievementProcessingError(
        'Failed to process goal achievement', 
        sampleGoalContext,
        achievementId
      );
      
      expect(error.goalContext).toMatchObject({
        ...sampleGoalContext,
        achievementId
      });
      expect(error.achievementId).toBe(achievementId);
    });

    it('should work without an achievement ID', () => {
      const error = new GoalAchievementProcessingError('Failed to process goal achievement', sampleGoalContext);
      
      expect(error.achievementId).toBeUndefined();
      expect(error.goalContext.achievementId).toBeUndefined();
    });

    it('should capture original cause if provided', () => {
      const originalError = new Error('Gamification service unavailable');
      const error = new GoalAchievementProcessingError(
        'Failed to process goal achievement', 
        sampleGoalContext, 
        achievementId,
        originalError
      );
      
      expect(error.cause).toBe(originalError);
    });
  });

  describe('GoalNotFoundError', () => {
    const goalId = 'goal-123';
    const userId = 'user-456';

    it('should create an error with BUSINESS type and correct error code', () => {
      const error = new GoalNotFoundError('Goal not found', goalId, userId);
      
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_GOALS_NOT_FOUND');
      expect(error.code).toMatch(/^HEALTH_GOALS_/);
      expect(error.message).toBe('Goal not found');
    });

    it('should capture goal ID and user ID in context', () => {
      const error = new GoalNotFoundError('Goal not found', goalId, userId);
      
      expect(error.goalContext).toEqual({
        goalId,
        userId
      });
    });

    it('should convert to HTTP exception with UNPROCESSABLE_ENTITY status', () => {
      const error = new GoalNotFoundError('Goal not found', goalId, userId);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Integration with gamification error handling', () => {
    it('should properly handle goal achievement errors related to gamification', () => {
      // Simulate a gamification service error
      const gamificationError = new Error('Failed to award points for achievement');
      
      // Create a goal achievement processing error that wraps the gamification error
      const error = new GoalAchievementProcessingError(
        'Failed to process goal achievement rewards', 
        {
          ...sampleGoalContext,
          goalType: 'steps',
          targetValue: 10000,
          currentProgress: 10500 // Goal exceeded
        },
        'achievement-123',
        gamificationError
      );
      
      // Verify error properties
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('HEALTH_GOALS_ACHIEVEMENT_FAILURE');
      expect(error.cause).toBe(gamificationError);
      expect(error.goalContext.goalType).toBe('steps');
      expect(error.goalContext.achievementId).toBe('achievement-123');
      
      // Verify JSON serialization includes all relevant context
      const json = error.toJSON();
      expect(json.error.details.goalType).toBe('steps');
      expect(json.error.details.targetValue).toBe(10000);
      expect(json.error.details.currentProgress).toBe(10500);
      expect(json.error.details.achievementId).toBe('achievement-123');
    });
  });
});