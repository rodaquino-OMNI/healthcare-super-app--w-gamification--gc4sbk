import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { GoalPeriod, GoalStatus, GoalType } from '@austa/interfaces/journey/health';
import {
  BaseHealthGoalEventDto,
  HealthGoalCreatedEventDto,
  HealthGoalProgressEventDto,
  HealthGoalAchievedEventDto,
  HealthGoalStatusChangedEventDto,
  HealthGoalStreakEventDto,
  HealthGoalCompleteDto,
  HealthGoalGamificationPayloadDto
} from '../../../src/dto/health-goal-event.dto';
import { validateDto } from '../dto/test-utils';

describe('HealthGoalEventDto', () => {
  // Test BaseHealthGoalEventDto
  describe('BaseHealthGoalEventDto', () => {
    it('should validate a valid BaseHealthGoalEventDto', async () => {
      // Arrange
      const dto = plainToInstance(BaseHealthGoalEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        description: 'Walk 10,000 steps every day',
        unit: 'steps',
        period: GoalPeriod.DAILY
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate required fields in BaseHealthGoalEventDto', async () => {
      // Arrange
      const dto = plainToInstance(BaseHealthGoalEventDto, {});

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('goalId')).toBe(true);
      expect(result.hasErrorForProperty('type')).toBe(true);
      expect(result.hasErrorForProperty('title')).toBe(true);
      expect(result.hasErrorForProperty('unit')).toBe(true);
      expect(result.hasErrorForProperty('period')).toBe(true);
    });

    it('should validate goalId is a valid UUID', async () => {
      // Arrange
      const dto = plainToInstance(BaseHealthGoalEventDto, {
        goalId: 'not-a-uuid',
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('goalId')).toBe(true);
    });

    it('should validate type is a valid GoalType enum value', async () => {
      // Arrange
      const dto = plainToInstance(BaseHealthGoalEventDto, {
        goalId: uuidv4(),
        type: 'INVALID_TYPE',
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('type')).toBe(true);
    });

    it('should validate period is a valid GoalPeriod enum value', async () => {
      // Arrange
      const dto = plainToInstance(BaseHealthGoalEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: 'INVALID_PERIOD'
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('period')).toBe(true);
    });
  });

  // Test HealthGoalCreatedEventDto
  describe('HealthGoalCreatedEventDto', () => {
    it('should validate a valid HealthGoalCreatedEventDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalCreatedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        description: 'Walk 10,000 steps every day',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        initialValue: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate required fields in HealthGoalCreatedEventDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalCreatedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('targetValue')).toBe(true);
      expect(result.hasErrorForProperty('initialValue')).toBe(true);
      expect(result.hasErrorForProperty('startDate')).toBe(true);
    });

    it('should validate targetValue is positive', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalCreatedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: -100,
        initialValue: 0,
        startDate: new Date()
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('targetValue')).toBe(true);
    });

    it('should validate initialValue is not negative', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalCreatedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        initialValue: -100,
        startDate: new Date()
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('initialValue')).toBe(true);
    });

    it('should validate startDate is a valid date', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalCreatedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        initialValue: 0,
        startDate: 'not-a-date'
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('startDate')).toBe(true);
    });
  });

  // Test HealthGoalProgressEventDto
  describe('HealthGoalProgressEventDto', () => {
    it('should validate a valid HealthGoalProgressEventDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalProgressEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        previousValue: 5000,
        currentValue: 7500,
        progressPercentage: 75,
        isCompleted: false
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate required fields in HealthGoalProgressEventDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalProgressEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('targetValue')).toBe(true);
      expect(result.hasErrorForProperty('previousValue')).toBe(true);
      expect(result.hasErrorForProperty('currentValue')).toBe(true);
      expect(result.hasErrorForProperty('progressPercentage')).toBe(true);
      expect(result.hasErrorForProperty('isCompleted')).toBe(true);
    });

    it('should validate progressPercentage is between 0 and 100', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalProgressEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        previousValue: 5000,
        currentValue: 7500,
        progressPercentage: 150, // Invalid: > 100
        isCompleted: false
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('progressPercentage')).toBe(true);

      // Test with negative value
      const dto2 = plainToInstance(HealthGoalProgressEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        previousValue: 5000,
        currentValue: 7500,
        progressPercentage: -10, // Invalid: < 0
        isCompleted: false
      });

      const result2 = await validateDto(dto2);
      expect(result2.isValid).toBe(false);
      expect(result2.hasErrorForProperty('progressPercentage')).toBe(true);
    });

    it('should validate currentValue is not less than previousValue for increasing goals', async () => {
      // This test is for business logic that might be implemented in a service layer
      // The DTO itself doesn't enforce this constraint, but it's a good practice to test it
      
      // For a steps goal (where higher is better), current should be >= previous
      const currentValue = 4000;
      const previousValue = 5000; // Higher than current, which is invalid for steps
      
      // This would pass DTO validation but fail business logic validation
      const dto = plainToInstance(HealthGoalProgressEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        previousValue,
        currentValue,
        progressPercentage: 40,
        isCompleted: false
      });

      // The DTO validation should pass since it doesn't enforce this business rule
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
      
      // In a real application, you would have service-layer validation for this business rule
      // For example:
      // expect(goalService.validateProgressUpdate(dto)).rejects.toThrow('Current value cannot be less than previous value for increasing goals');
    });
  });

  // Test HealthGoalAchievedEventDto
  describe('HealthGoalAchievedEventDto', () => {
    it('should validate a valid HealthGoalAchievedEventDto', async () => {
      // Arrange
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const completedDate = new Date();
      
      const dto = plainToInstance(HealthGoalAchievedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        finalValue: 10500,
        startDate,
        completedDate,
        durationDays: 7,
        aheadOfSchedule: true
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate required fields in HealthGoalAchievedEventDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalAchievedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('targetValue')).toBe(true);
      expect(result.hasErrorForProperty('finalValue')).toBe(true);
      expect(result.hasErrorForProperty('startDate')).toBe(true);
      expect(result.hasErrorForProperty('completedDate')).toBe(true);
      expect(result.hasErrorForProperty('durationDays')).toBe(true);
    });

    it('should validate durationDays is positive', async () => {
      // Arrange
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const completedDate = new Date();
      
      const dto = plainToInstance(HealthGoalAchievedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        finalValue: 10500,
        startDate,
        completedDate,
        durationDays: 0, // Invalid: should be positive
        aheadOfSchedule: true
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('durationDays')).toBe(true);
    });

    it('should validate finalValue is not negative', async () => {
      // Arrange
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const completedDate = new Date();
      
      const dto = plainToInstance(HealthGoalAchievedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        targetValue: 10000,
        finalValue: -500, // Invalid: negative value
        startDate,
        completedDate,
        durationDays: 7,
        aheadOfSchedule: true
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('finalValue')).toBe(true);
    });
  });

  // Test HealthGoalStatusChangedEventDto
  describe('HealthGoalStatusChangedEventDto', () => {
    it('should validate a valid HealthGoalStatusChangedEventDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalStatusChangedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        previousStatus: GoalStatus.ACTIVE,
        newStatus: GoalStatus.COMPLETED,
        reason: 'Goal achieved',
        currentValue: 10500,
        targetValue: 10000,
        progressPercentage: 100
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate required fields in HealthGoalStatusChangedEventDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalStatusChangedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('previousStatus')).toBe(true);
      expect(result.hasErrorForProperty('newStatus')).toBe(true);
      expect(result.hasErrorForProperty('currentValue')).toBe(true);
      expect(result.hasErrorForProperty('targetValue')).toBe(true);
      expect(result.hasErrorForProperty('progressPercentage')).toBe(true);
    });

    it('should validate status values are valid GoalStatus enum values', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalStatusChangedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        previousStatus: 'INVALID_STATUS',
        newStatus: GoalStatus.COMPLETED,
        currentValue: 10500,
        targetValue: 10000,
        progressPercentage: 100
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('previousStatus')).toBe(true);

      // Test with invalid new status
      const dto2 = plainToInstance(HealthGoalStatusChangedEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        previousStatus: GoalStatus.ACTIVE,
        newStatus: 'INVALID_STATUS',
        currentValue: 10500,
        targetValue: 10000,
        progressPercentage: 100
      });

      const result2 = await validateDto(dto2);
      expect(result2.isValid).toBe(false);
      expect(result2.hasErrorForProperty('newStatus')).toBe(true);
    });
  });

  // Test HealthGoalStreakEventDto
  describe('HealthGoalStreakEventDto', () => {
    it('should validate a valid HealthGoalStreakEventDto', async () => {
      // Arrange
      const streakStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const latestCompletionDate = new Date();
      
      const dto = plainToInstance(HealthGoalStreakEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        streakCount: 30,
        isPersonalBest: true,
        previousBest: 25,
        streakStartDate,
        latestCompletionDate
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate required fields in HealthGoalStreakEventDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalStreakEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('streakCount')).toBe(true);
      expect(result.hasErrorForProperty('isPersonalBest')).toBe(true);
      expect(result.hasErrorForProperty('streakStartDate')).toBe(true);
      expect(result.hasErrorForProperty('latestCompletionDate')).toBe(true);
    });

    it('should validate streakCount is at least 1', async () => {
      // Arrange
      const streakStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const latestCompletionDate = new Date();
      
      const dto = plainToInstance(HealthGoalStreakEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        streakCount: 0, // Invalid: should be at least 1
        isPersonalBest: true,
        previousBest: 25,
        streakStartDate,
        latestCompletionDate
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('streakCount')).toBe(true);
    });

    it('should validate previousBest is not negative', async () => {
      // Arrange
      const streakStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const latestCompletionDate = new Date();
      
      const dto = plainToInstance(HealthGoalStreakEventDto, {
        goalId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        streakCount: 30,
        isPersonalBest: true,
        previousBest: -5, // Invalid: negative value
        streakStartDate,
        latestCompletionDate
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('previousBest')).toBe(true);
    });
  });

  // Test HealthGoalCompleteDto
  describe('HealthGoalCompleteDto', () => {
    it('should validate a valid HealthGoalCompleteDto', async () => {
      // Arrange
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const completedDate = new Date();
      const createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const updatedAt = new Date();
      
      const dto = plainToInstance(HealthGoalCompleteDto, {
        id: uuidv4(),
        recordId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        description: 'Walk 10,000 steps every day',
        targetValue: 10000,
        unit: 'steps',
        currentValue: 10500,
        status: GoalStatus.COMPLETED,
        period: GoalPeriod.DAILY,
        startDate,
        endDate: null,
        completedDate,
        createdAt,
        updatedAt
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate required fields in HealthGoalCompleteDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalCompleteDto, {});

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('id')).toBe(true);
      expect(result.hasErrorForProperty('recordId')).toBe(true);
      expect(result.hasErrorForProperty('type')).toBe(true);
      expect(result.hasErrorForProperty('title')).toBe(true);
      expect(result.hasErrorForProperty('targetValue')).toBe(true);
      expect(result.hasErrorForProperty('unit')).toBe(true);
      expect(result.hasErrorForProperty('currentValue')).toBe(true);
      expect(result.hasErrorForProperty('status')).toBe(true);
      expect(result.hasErrorForProperty('period')).toBe(true);
      expect(result.hasErrorForProperty('startDate')).toBe(true);
      expect(result.hasErrorForProperty('createdAt')).toBe(true);
      expect(result.hasErrorForProperty('updatedAt')).toBe(true);
    });

    it('should validate enum values in HealthGoalCompleteDto', async () => {
      // Arrange
      const startDate = new Date();
      const createdAt = new Date();
      const updatedAt = new Date();
      
      const dto = plainToInstance(HealthGoalCompleteDto, {
        id: uuidv4(),
        recordId: uuidv4(),
        type: 'INVALID_TYPE',
        title: 'Daily Steps Goal',
        targetValue: 10000,
        unit: 'steps',
        currentValue: 5000,
        status: 'INVALID_STATUS',
        period: 'INVALID_PERIOD',
        startDate,
        createdAt,
        updatedAt
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('type')).toBe(true);
      expect(result.hasErrorForProperty('status')).toBe(true);
      expect(result.hasErrorForProperty('period')).toBe(true);
    });
  });

  // Test HealthGoalGamificationPayloadDto
  describe('HealthGoalGamificationPayloadDto', () => {
    it('should validate a valid HealthGoalGamificationPayloadDto', async () => {
      // Arrange
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const completedDate = new Date();
      const createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const updatedAt = new Date();
      
      const streakStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const latestCompletionDate = new Date();
      
      const goal = plainToInstance(HealthGoalCompleteDto, {
        id: uuidv4(),
        recordId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        description: 'Walk 10,000 steps every day',
        targetValue: 10000,
        unit: 'steps',
        currentValue: 10500,
        status: GoalStatus.COMPLETED,
        period: GoalPeriod.DAILY,
        startDate,
        endDate: null,
        completedDate,
        createdAt,
        updatedAt
      });
      
      const streak = plainToInstance(HealthGoalStreakEventDto, {
        goalId: goal.id,
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        unit: 'steps',
        period: GoalPeriod.DAILY,
        streakCount: 30,
        isPersonalBest: true,
        previousBest: 25,
        streakStartDate,
        latestCompletionDate
      });
      
      const dto = plainToInstance(HealthGoalGamificationPayloadDto, {
        goal,
        streak,
        isFirstCompletion: false,
        isChallengingGoal: true,
        completionCount: 5,
        aheadOfSchedule: true,
        suggestedXp: 100
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate required fields in HealthGoalGamificationPayloadDto', async () => {
      // Arrange
      const dto = plainToInstance(HealthGoalGamificationPayloadDto, {});

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('goal')).toBe(true);
      expect(result.hasErrorForProperty('isFirstCompletion')).toBe(true);
      expect(result.hasErrorForProperty('isChallengingGoal')).toBe(true);
      expect(result.hasErrorForProperty('completionCount')).toBe(true);
      expect(result.hasErrorForProperty('suggestedXp')).toBe(true);
    });

    it('should validate completionCount is at least 1', async () => {
      // Arrange
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const completedDate = new Date();
      const createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const updatedAt = new Date();
      
      const goal = plainToInstance(HealthGoalCompleteDto, {
        id: uuidv4(),
        recordId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        description: 'Walk 10,000 steps every day',
        targetValue: 10000,
        unit: 'steps',
        currentValue: 10500,
        status: GoalStatus.COMPLETED,
        period: GoalPeriod.DAILY,
        startDate,
        endDate: null,
        completedDate,
        createdAt,
        updatedAt
      });
      
      const dto = plainToInstance(HealthGoalGamificationPayloadDto, {
        goal,
        isFirstCompletion: false,
        isChallengingGoal: true,
        completionCount: 0, // Invalid: should be at least 1
        suggestedXp: 100
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('completionCount')).toBe(true);
    });

    it('should validate suggestedXp is not negative', async () => {
      // Arrange
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const completedDate = new Date();
      const createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const updatedAt = new Date();
      
      const goal = plainToInstance(HealthGoalCompleteDto, {
        id: uuidv4(),
        recordId: uuidv4(),
        type: GoalType.STEPS,
        title: 'Daily Steps Goal',
        description: 'Walk 10,000 steps every day',
        targetValue: 10000,
        unit: 'steps',
        currentValue: 10500,
        status: GoalStatus.COMPLETED,
        period: GoalPeriod.DAILY,
        startDate,
        endDate: null,
        completedDate,
        createdAt,
        updatedAt
      });
      
      const dto = plainToInstance(HealthGoalGamificationPayloadDto, {
        goal,
        isFirstCompletion: false,
        isChallengingGoal: true,
        completionCount: 5,
        suggestedXp: -50 // Invalid: negative value
      });

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('suggestedXp')).toBe(true);
    });
  });
});