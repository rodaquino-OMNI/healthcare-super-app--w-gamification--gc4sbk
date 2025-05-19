import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../src/types';
import {
  InvalidGoalParametersError,
  ConflictingGoalsError,
  GoalTrackingFailureError,
  UnachievableGoalError,
  GoalAchievementProcessingError,
  GoalNotFoundError
} from '../../../../src/journey/health/goals.errors';

describe('Health Journey Goals Errors', () => {
  describe('InvalidGoalParametersError', () => {
    it('should create an error with HEALTH_GOALS_ prefixed error code', () => {
      const error = new InvalidGoalParametersError('Invalid goal target value', {
        goalType: 'steps',
        targetValue: -100,
        timeframe: 'daily'
      });

      expect(error.code).toMatch(/^HEALTH_GOALS_/);
    });

    it('should capture goal parameters in error context', () => {
      const goalContext = {
        goalType: 'steps',
        targetValue: -100,
        timeframe: 'daily'
      };
      
      const error = new InvalidGoalParametersError('Invalid goal target value', goalContext);

      expect(error.context).toEqual(expect.objectContaining(goalContext));
    });

    it('should be classified as a validation error', () => {
      const error = new InvalidGoalParametersError('Invalid goal target value', {
        goalType: 'steps',
        targetValue: -100,
        timeframe: 'daily'
      });

      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should map to HTTP 400 Bad Request status', () => {
      const error = new InvalidGoalParametersError('Invalid goal target value', {
        goalType: 'steps',
        targetValue: -100,
        timeframe: 'daily'
      });

      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('ConflictingGoalsError', () => {
    it('should create an error with HEALTH_GOALS_ prefixed error code', () => {
      const error = new ConflictingGoalsError('Conflicting goals detected', {
        conflictingGoalId: '123',
        goalType: 'steps',
        conflictReason: 'overlapping_timeframe'
      });

      expect(error.code).toMatch(/^HEALTH_GOALS_/);
    });

    it('should capture conflict details in error context', () => {
      const conflictContext = {
        conflictingGoalId: '123',
        goalType: 'steps',
        conflictReason: 'overlapping_timeframe'
      };
      
      const error = new ConflictingGoalsError('Conflicting goals detected', conflictContext);

      expect(error.context).toEqual(expect.objectContaining(conflictContext));
    });

    it('should be classified as a business error', () => {
      const error = new ConflictingGoalsError('Conflicting goals detected', {
        conflictingGoalId: '123',
        goalType: 'steps',
        conflictReason: 'overlapping_timeframe'
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should map to HTTP 409 Conflict status', () => {
      const error = new ConflictingGoalsError('Conflicting goals detected', {
        conflictingGoalId: '123',
        goalType: 'steps',
        conflictReason: 'overlapping_timeframe'
      });

      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });

  describe('GoalTrackingFailureError', () => {
    it('should create an error with HEALTH_GOALS_ prefixed error code', () => {
      const error = new GoalTrackingFailureError('Failed to track goal progress', {
        goalId: '456',
        goalType: 'weight',
        currentValue: 75.5,
        targetValue: 70.0,
        failureReason: 'data_inconsistency'
      });

      expect(error.code).toMatch(/^HEALTH_GOALS_/);
    });

    it('should capture tracking details in error context', () => {
      const trackingContext = {
        goalId: '456',
        goalType: 'weight',
        currentValue: 75.5,
        targetValue: 70.0,
        failureReason: 'data_inconsistency'
      };
      
      const error = new GoalTrackingFailureError('Failed to track goal progress', trackingContext);

      expect(error.context).toEqual(expect.objectContaining(trackingContext));
    });

    it('should be classified as a technical error', () => {
      const error = new GoalTrackingFailureError('Failed to track goal progress', {
        goalId: '456',
        goalType: 'weight',
        currentValue: 75.5,
        targetValue: 70.0,
        failureReason: 'data_inconsistency'
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should map to HTTP 500 Internal Server Error status', () => {
      const error = new GoalTrackingFailureError('Failed to track goal progress', {
        goalId: '456',
        goalType: 'weight',
        currentValue: 75.5,
        targetValue: 70.0,
        failureReason: 'data_inconsistency'
      });

      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('UnachievableGoalError', () => {
    it('should create an error with HEALTH_GOALS_ prefixed error code', () => {
      const error = new UnachievableGoalError('Goal is unachievable based on user history', {
        goalId: '789',
        goalType: 'steps',
        targetValue: 20000,
        userAverage: 5000,
        recommendedTarget: 7000
      });

      expect(error.code).toMatch(/^HEALTH_GOALS_/);
    });

    it('should capture goal achievability context in error object', () => {
      const achievabilityContext = {
        goalId: '789',
        goalType: 'steps',
        targetValue: 20000,
        userAverage: 5000,
        recommendedTarget: 7000
      };
      
      const error = new UnachievableGoalError('Goal is unachievable based on user history', achievabilityContext);

      expect(error.context).toEqual(expect.objectContaining(achievabilityContext));
    });

    it('should be classified as a business error', () => {
      const error = new UnachievableGoalError('Goal is unachievable based on user history', {
        goalId: '789',
        goalType: 'steps',
        targetValue: 20000,
        userAverage: 5000,
        recommendedTarget: 7000
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should map to HTTP 422 Unprocessable Entity status', () => {
      const error = new UnachievableGoalError('Goal is unachievable based on user history', {
        goalId: '789',
        goalType: 'steps',
        targetValue: 20000,
        userAverage: 5000,
        recommendedTarget: 7000
      });

      expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('GoalAchievementProcessingError', () => {
    it('should create an error with HEALTH_GOALS_ prefixed error code', () => {
      const error = new GoalAchievementProcessingError('Failed to process goal achievement', {
        goalId: '101',
        goalType: 'sleep',
        achievementId: 'ach-123',
        gamificationEventId: 'evt-456',
        failureReason: 'gamification_service_unavailable'
      });

      expect(error.code).toMatch(/^HEALTH_GOALS_/);
    });

    it('should capture gamification integration details in error context', () => {
      const gamificationContext = {
        goalId: '101',
        goalType: 'sleep',
        achievementId: 'ach-123',
        gamificationEventId: 'evt-456',
        failureReason: 'gamification_service_unavailable'
      };
      
      const error = new GoalAchievementProcessingError('Failed to process goal achievement', gamificationContext);

      expect(error.context).toEqual(expect.objectContaining(gamificationContext));
    });

    it('should be classified as an external error when gamification service fails', () => {
      const error = new GoalAchievementProcessingError('Failed to process goal achievement', {
        goalId: '101',
        goalType: 'sleep',
        achievementId: 'ach-123',
        gamificationEventId: 'evt-456',
        failureReason: 'gamification_service_unavailable'
      });

      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should map to HTTP 503 Service Unavailable status for external service failures', () => {
      const error = new GoalAchievementProcessingError('Failed to process goal achievement', {
        goalId: '101',
        goalType: 'sleep',
        achievementId: 'ach-123',
        gamificationEventId: 'evt-456',
        failureReason: 'gamification_service_unavailable'
      });

      expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });

  describe('GoalNotFoundError', () => {
    it('should create an error with HEALTH_GOALS_ prefixed error code', () => {
      const error = new GoalNotFoundError('Goal not found', {
        goalId: '999',
        userId: 'user-123'
      });

      expect(error.code).toMatch(/^HEALTH_GOALS_/);
    });

    it('should capture goal identification details in error context', () => {
      const notFoundContext = {
        goalId: '999',
        userId: 'user-123'
      };
      
      const error = new GoalNotFoundError('Goal not found', notFoundContext);

      expect(error.context).toEqual(expect.objectContaining(notFoundContext));
    });

    it('should be classified as a business error', () => {
      const error = new GoalNotFoundError('Goal not found', {
        goalId: '999',
        userId: 'user-123'
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should map to HTTP 404 Not Found status', () => {
      const error = new GoalNotFoundError('Goal not found', {
        goalId: '999',
        userId: 'user-123'
      });

      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });
});