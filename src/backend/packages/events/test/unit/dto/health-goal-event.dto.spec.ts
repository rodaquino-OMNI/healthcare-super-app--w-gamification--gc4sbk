import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { HealthGoalEventDto } from '../../../src/dto/health-goal-event.dto';
import { GoalType, GoalStatus, GoalPeriod } from '@austa/interfaces/journey/health';
import { EventType } from '../../../src/dto/event-types.enum';

describe('HealthGoalEventDto', () => {
  describe('Goal Creation Validation', () => {
    it('should validate a valid goal creation event', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_CREATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        currentValue: 0,
        period: GoalPeriod.DAILY,
        status: GoalStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        description: 'Daily step goal'
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
    });

    it('should reject goal creation with invalid goal type', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_CREATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: 'INVALID_TYPE' as GoalType, // Invalid goal type
        targetValue: 10000,
        currentValue: 0,
        period: GoalPeriod.DAILY,
        status: GoalStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        description: 'Daily step goal'
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should reject goal creation with negative target value', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_CREATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: -100, // Negative target value
        currentValue: 0,
        period: GoalPeriod.DAILY,
        status: GoalStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        description: 'Daily step goal'
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should reject goal creation with end date before start date', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_CREATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        currentValue: 0,
        period: GoalPeriod.DAILY,
        status: GoalStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        description: 'Daily step goal'
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('dateComparison');
    });
  });

  describe('Goal Progress Validation', () => {
    it('should validate a valid goal progress update event', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_PROGRESS_UPDATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        previousValue: 5000,
        currentValue: 7500,
        progressPercentage: 75,
        period: GoalPeriod.DAILY,
        status: GoalStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        description: 'Daily step goal'
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
    });

    it('should reject progress update with current value exceeding target for non-minimizing goals', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_PROGRESS_UPDATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        previousValue: 9000,
        currentValue: 15000, // Exceeds target
        progressPercentage: 150, // Exceeds 100%
        period: GoalPeriod.DAILY,
        status: GoalStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        description: 'Daily step goal'
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should accept progress update with current value below target for minimizing goals', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_PROGRESS_UPDATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.WEIGHT, // Weight is a minimizing goal
        targetValue: 70, // Target weight in kg
        previousValue: 75,
        currentValue: 72, // Progress toward target (lower is better)
        progressPercentage: 60, // 60% progress toward target
        period: GoalPeriod.WEEKLY,
        status: GoalStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 604800000).toISOString(), // One week
        description: 'Weekly weight goal'
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
    });

    it('should validate progress percentage calculation', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_PROGRESS_UPDATED;
      goalEvent.timestamp = new Date().toISOString();
      
      // For a steps goal (maximizing - higher is better)
      const stepsGoalData = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        previousValue: 5000,
        currentValue: 7500,
        progressPercentage: 75, // Correct percentage
        period: GoalPeriod.DAILY,
        status: GoalStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        description: 'Daily step goal'
      };
      
      goalEvent.data = stepsGoalData;
      let errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
      
      // Test with incorrect percentage
      stepsGoalData.progressPercentage = 50; // Incorrect percentage
      goalEvent.data = stepsGoalData;
      errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('progressCalculation');
    });
  });

  describe('Goal Achievement Validation', () => {
    it('should validate a valid goal achievement event', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_ACHIEVED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        currentValue: 10000,
        progressPercentage: 100,
        period: GoalPeriod.DAILY,
        status: GoalStatus.COMPLETED,
        startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        endDate: new Date().toISOString(), // Today
        completedDate: new Date().toISOString(),
        description: 'Daily step goal',
        achievementEligible: true,
        xpEarned: 50
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
    });

    it('should reject achievement event with incomplete progress', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_ACHIEVED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        currentValue: 9000, // Not complete
        progressPercentage: 90, // Not 100%
        period: GoalPeriod.DAILY,
        status: GoalStatus.COMPLETED, // Status says completed but progress doesn't match
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        description: 'Daily step goal',
        achievementEligible: true,
        xpEarned: 50
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('achievementValidation');
    });

    it('should reject achievement event with incorrect status', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_ACHIEVED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        currentValue: 10000, // Complete
        progressPercentage: 100, // 100%
        period: GoalPeriod.DAILY,
        status: GoalStatus.ACTIVE, // Should be COMPLETED
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        description: 'Daily step goal',
        achievementEligible: true,
        xpEarned: 50
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('statusValidation');
    });

    it('should validate XP earned based on goal difficulty', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_ACHIEVED;
      goalEvent.timestamp = new Date().toISOString();
      
      // Easy goal (daily)
      const easyGoalData = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        currentValue: 10000,
        progressPercentage: 100,
        period: GoalPeriod.DAILY,
        status: GoalStatus.COMPLETED,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        description: 'Daily step goal',
        achievementEligible: true,
        xpEarned: 50 // Correct XP for daily goal
      };
      
      goalEvent.data = easyGoalData;
      let errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
      
      // Medium goal (weekly)
      const mediumGoalData = {
        ...easyGoalData,
        period: GoalPeriod.WEEKLY,
        xpEarned: 150 // Correct XP for weekly goal
      };
      
      goalEvent.data = mediumGoalData;
      errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
      
      // Hard goal (monthly)
      const hardGoalData = {
        ...easyGoalData,
        period: GoalPeriod.MONTHLY,
        xpEarned: 500 // Correct XP for monthly goal
      };
      
      goalEvent.data = hardGoalData;
      errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
      
      // Incorrect XP for goal difficulty
      const incorrectXpData = {
        ...easyGoalData,
        period: GoalPeriod.MONTHLY,
        xpEarned: 50 // Incorrect XP for monthly goal
      };
      
      goalEvent.data = incorrectXpData;
      errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('xpValidation');
    });
  });

  describe('Cross-Journey Achievement Integration', () => {
    it('should validate goal event with achievement data for gamification', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_ACHIEVED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        currentValue: 10000,
        progressPercentage: 100,
        period: GoalPeriod.DAILY,
        status: GoalStatus.COMPLETED,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        description: 'Daily step goal',
        achievementEligible: true,
        xpEarned: 50,
        achievementData: {
          achievementType: 'steps-goal',
          level: 1,
          progress: 1,
          streakCount: 1,
          metadata: {
            goalCount: 1,
            totalSteps: 10000
          }
        }
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
    });

    it('should validate goal streak events for multi-day achievements', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_STREAK_UPDATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalType: GoalType.STEPS,
        currentStreakDays: 5,
        previousStreakDays: 4,
        longestStreak: 10,
        achievementEligible: true,
        achievementData: {
          achievementType: 'health-check-streak',
          level: 1,
          progress: 5,
          streakCount: 5,
          metadata: {
            goalType: 'STEPS',
            streakDays: 5
          }
        }
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
    });

    it('should reject streak event with invalid streak count', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_STREAK_UPDATED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalType: GoalType.STEPS,
        currentStreakDays: 3, // Current streak
        previousStreakDays: 5, // Previous streak higher than current
        longestStreak: 10,
        achievementEligible: true,
        achievementData: {
          achievementType: 'health-check-streak',
          level: 1,
          progress: 3,
          streakCount: 3,
          metadata: {
            goalType: 'STEPS',
            streakDays: 3
          }
        }
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('streakValidation');
    });

    it('should validate notification data for achievement events', async () => {
      const goalEvent = new HealthGoalEventDto();
      goalEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      goalEvent.type = EventType.HEALTH_GOAL_ACHIEVED;
      goalEvent.timestamp = new Date().toISOString();
      goalEvent.data = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        goalType: GoalType.STEPS,
        targetValue: 10000,
        currentValue: 10000,
        progressPercentage: 100,
        period: GoalPeriod.DAILY,
        status: GoalStatus.COMPLETED,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        description: 'Daily step goal',
        achievementEligible: true,
        xpEarned: 50,
        achievementData: {
          achievementType: 'steps-goal',
          level: 1,
          progress: 1,
          streakCount: 1,
          metadata: {
            goalCount: 1,
            totalSteps: 10000
          }
        },
        notificationData: {
          title: 'Goal Achieved!',
          body: 'Congratulations! You reached your daily step goal of 10,000 steps.',
          type: 'achievement',
          priority: 'high',
          data: {
            achievementType: 'steps-goal',
            xpEarned: 50,
            iconUrl: 'https://assets.austa.com.br/achievements/steps-goal-1.png'
          }
        }
      };

      const errors = await validate(goalEvent);
      expect(errors.length).toBe(0);
    });
  });
});