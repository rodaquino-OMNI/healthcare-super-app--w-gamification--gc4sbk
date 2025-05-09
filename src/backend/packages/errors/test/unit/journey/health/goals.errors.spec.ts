import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../shared/src/exceptions/exceptions.types';
import {
  HealthGoalError,
  HealthGoalErrorContext,
  InvalidGoalParametersError,
  ConflictingGoalsError,
  UnachievableGoalError,
  GoalLimitExceededError,
  GoalTrackingFailureError,
  GoalSynchronizationError,
  GoalAchievementProcessingError
} from '../../../../src/journey/health/goals.errors';

describe('Health Goals Error Classes', () => {
  // Common test data
  const testMessage = 'Test error message';
  const testContext: HealthGoalErrorContext = {
    goalId: 'goal123',
    goalType: 'steps',
    targetValue: 10000,
    unit: 'steps',
    period: 'daily',
    startDate: new Date('2023-05-15'),
    endDate: new Date('2023-06-15'),
    additionalInfo: { difficulty: 'moderate' }
  };
  const testCause = new Error('Original error');

  // Helper function to test common error properties
  const testErrorProperties = (
    error: HealthGoalError,
    expectedType: ErrorType,
    expectedCodePrefix: string,
    expectedContext: any
  ) => {
    expect(error).toBeInstanceOf(HealthGoalError);
    expect(error.message).toBe(testMessage);
    expect(error.type).toBe(expectedType);
    expect(error.code).toContain(expectedCodePrefix);
    expect(error.context).toEqual(expectedContext);
    expect(error.cause).toBe(testCause);
  };

  // Helper function to test HTTP status code mapping
  const testHttpStatusCode = (
    error: HealthGoalError,
    expectedStatus: HttpStatus
  ) => {
    const httpException = error.toHttpException();
    expect(httpException.getStatus()).toBe(expectedStatus);
  };

  describe('Validation Errors', () => {
    it('should create InvalidGoalParametersError with correct properties', () => {
      const error = new InvalidGoalParametersError(testMessage, testContext, testCause);
      
      testErrorProperties(error, ErrorType.VALIDATION, 'HEALTH_GOALS_INVALID_PARAMETERS', testContext);
      testHttpStatusCode(error, HttpStatus.BAD_REQUEST);
    });
  });

  describe('Business Logic Errors', () => {
    it('should create ConflictingGoalsError with correct properties', () => {
      const error = new ConflictingGoalsError(testMessage, testContext, testCause);
      
      testErrorProperties(error, ErrorType.BUSINESS, 'HEALTH_GOALS_CONFLICT', testContext);
      testHttpStatusCode(error, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create UnachievableGoalError with correct properties', () => {
      const error = new UnachievableGoalError(testMessage, testContext, testCause);
      
      testErrorProperties(error, ErrorType.BUSINESS, 'HEALTH_GOALS_UNACHIEVABLE', testContext);
      testHttpStatusCode(error, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create GoalLimitExceededError with correct properties', () => {
      const limitContext = {
        ...testContext,
        currentCount: 5,
        maxAllowed: 10
      };
      const error = new GoalLimitExceededError(testMessage, limitContext, testCause);
      
      testErrorProperties(error, ErrorType.BUSINESS, 'HEALTH_GOALS_LIMIT_EXCEEDED', limitContext);
      testHttpStatusCode(error, HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Technical Errors', () => {
    it('should create GoalTrackingFailureError with correct properties', () => {
      const error = new GoalTrackingFailureError(testMessage, testContext, testCause);
      
      testErrorProperties(error, ErrorType.TECHNICAL, 'HEALTH_GOALS_TRACKING_FAILURE', testContext);
      testHttpStatusCode(error, HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should create GoalAchievementProcessingError with correct properties', () => {
      const achievementContext = {
        ...testContext,
        achievementId: 'achievement123',
        eventId: 'event456'
      };
      const error = new GoalAchievementProcessingError(testMessage, achievementContext, testCause);
      
      testErrorProperties(error, ErrorType.TECHNICAL, 'HEALTH_GOALS_ACHIEVEMENT_PROCESSING_FAILURE', achievementContext);
      testHttpStatusCode(error, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('External System Errors', () => {
    it('should create GoalSynchronizationError with correct properties', () => {
      const syncContext = {
        ...testContext,
        externalSystem: 'fitbit',
        operationType: 'create'
      };
      const error = new GoalSynchronizationError(testMessage, syncContext, testCause);
      
      testErrorProperties(error, ErrorType.EXTERNAL, 'HEALTH_GOALS_SYNC_FAILURE', syncContext);
      testHttpStatusCode(error, HttpStatus.BAD_GATEWAY);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize error to JSON with all context', () => {
      const error = new InvalidGoalParametersError(testMessage, testContext, testCause);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'HEALTH_GOALS_INVALID_PARAMETERS',
          message: testMessage,
          details: testContext,
          journey: 'health',
          feature: 'goals',
          context: testContext
        }
      });
    });

    it('should include extended context in serialized error', () => {
      const limitContext = {
        ...testContext,
        currentCount: 5,
        maxAllowed: 10
      };
      const error = new GoalLimitExceededError(testMessage, limitContext, testCause);
      const json = error.toJSON();
      
      expect(json.error.context).toEqual(limitContext);
      expect(json.error.context.currentCount).toBe(5);
      expect(json.error.context.maxAllowed).toBe(10);
    });
  });

  describe('Default Error Messages', () => {
    it('should use default message when no message is provided for InvalidGoalParametersError', () => {
      const error = new InvalidGoalParametersError('', testContext);
      expect(error.message).toBe('Invalid health goal parameters');
    });

    it('should use default message for ConflictingGoalsError', () => {
      const error = new ConflictingGoalsError('', testContext);
      expect(error.message).toBe('Goal conflicts with existing goals');
    });

    it('should use default message for UnachievableGoalError', () => {
      const error = new UnachievableGoalError('', testContext);
      expect(error.message).toBe('Goal appears to be unachievable based on history');
    });

    it('should use default message for GoalLimitExceededError', () => {
      const limitContext = {
        ...testContext,
        currentCount: 5,
        maxAllowed: 10
      };
      const error = new GoalLimitExceededError('', limitContext);
      expect(error.message).toBe('Maximum number of allowed goals exceeded');
    });

    it('should use default message for GoalTrackingFailureError', () => {
      const error = new GoalTrackingFailureError('', testContext);
      expect(error.message).toBe('Failed to track goal progress');
    });

    it('should use default message for GoalSynchronizationError', () => {
      const syncContext = {
        ...testContext,
        externalSystem: 'fitbit',
        operationType: 'create'
      };
      const error = new GoalSynchronizationError('', syncContext);
      expect(error.message).toBe('Failed to synchronize goal with external system');
    });

    it('should use default message for GoalAchievementProcessingError', () => {
      const achievementContext = {
        ...testContext,
        achievementId: 'achievement123',
        eventId: 'event456'
      };
      const error = new GoalAchievementProcessingError('', achievementContext);
      expect(error.message).toBe('Failed to process goal achievement');
    });
  });

  describe('Error Classification', () => {
    it('should classify validation errors correctly', () => {
      const errors = [
        new InvalidGoalParametersError(testMessage, testContext)
      ];
      
      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_REQUEST);
      });
    });

    it('should classify business errors correctly', () => {
      const limitContext = {
        ...testContext,
        currentCount: 5,
        maxAllowed: 10
      };
      
      const errors = [
        new ConflictingGoalsError(testMessage, testContext),
        new UnachievableGoalError(testMessage, testContext),
        new GoalLimitExceededError(testMessage, limitContext)
      ];
      
      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });
    });

    it('should classify technical errors correctly', () => {
      const achievementContext = {
        ...testContext,
        achievementId: 'achievement123',
        eventId: 'event456'
      };
      
      const errors = [
        new GoalTrackingFailureError(testMessage, testContext),
        new GoalAchievementProcessingError(testMessage, achievementContext)
      ];
      
      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });

    it('should classify external system errors correctly', () => {
      const syncContext = {
        ...testContext,
        externalSystem: 'fitbit',
        operationType: 'create'
      };
      
      const errors = [
        new GoalSynchronizationError(testMessage, syncContext)
      ];
      
      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      });
    });
  });

  describe('Goal-specific context', () => {
    it('should include goal type in error context', () => {
      const error = new InvalidGoalParametersError(testMessage, testContext);
      expect(error.context?.goalType).toBe('steps');
    });

    it('should include target value in error context', () => {
      const error = new InvalidGoalParametersError(testMessage, testContext);
      expect(error.context?.targetValue).toBe(10000);
    });

    it('should include time period in error context', () => {
      const error = new InvalidGoalParametersError(testMessage, testContext);
      expect(error.context?.period).toBe('daily');
    });

    it('should include date range in error context', () => {
      const error = new InvalidGoalParametersError(testMessage, testContext);
      expect(error.context?.startDate).toEqual(new Date('2023-05-15'));
      expect(error.context?.endDate).toEqual(new Date('2023-06-15'));
    });

    it('should include additional info in error context', () => {
      const error = new InvalidGoalParametersError(testMessage, testContext);
      expect(error.context?.additionalInfo).toEqual({ difficulty: 'moderate' });
    });
  });

  describe('Integration with gamification', () => {
    it('should include achievement details in GoalAchievementProcessingError', () => {
      const achievementContext = {
        ...testContext,
        achievementId: 'achievement123',
        eventId: 'event456'
      };
      
      const error = new GoalAchievementProcessingError(testMessage, achievementContext);
      expect(error.context?.achievementId).toBe('achievement123');
      expect(error.context?.eventId).toBe('event456');
    });
  });
});