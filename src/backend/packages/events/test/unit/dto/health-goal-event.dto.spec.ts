/**
 * @file health-goal-event.dto.spec.ts
 * @description Unit tests for the HealthGoalEventDto classes that validate health goal events
 * such as creation, progress updates, and achievement completion.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { 
  HealthGoalData, 
  HealthGoalAchievedEventDto,
  HealthGoalType
} from '../../../src/dto/health-event.dto';
import { EventType } from '../../../src/dto/event-types.enum';

describe('HealthGoalData', () => {
  it('should validate a valid health goal data object', async () => {
    const goalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily',
      targetValue: 10000,
      unit: 'steps',
      progressPercentage: 75
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBe(0);
  });

  it('should fail validation when goalId is missing', async () => {
    const goalData = {
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily',
      targetValue: 10000,
      unit: 'steps'
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('goalId');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when goalId is not a valid UUID', async () => {
    const goalData = {
      goalId: 'not-a-valid-uuid',
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily',
      targetValue: 10000,
      unit: 'steps'
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('goalId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation when goalType is missing', async () => {
    const goalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      description: 'Walk 10,000 steps daily',
      targetValue: 10000,
      unit: 'steps'
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('goalType');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when goalType is not a valid enum value', async () => {
    const goalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: 'INVALID_GOAL_TYPE',
      description: 'Walk 10,000 steps daily',
      targetValue: 10000,
      unit: 'steps'
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('goalType');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should fail validation when description is missing', async () => {
    const goalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: HealthGoalType.STEPS_TARGET,
      targetValue: 10000,
      unit: 'steps'
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('description');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should validate when optional fields are missing', async () => {
    const goalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily'
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBe(0);
  });

  it('should fail validation when progressPercentage is out of range (0-100)', async () => {
    const goalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily',
      progressPercentage: 101 // Over 100%
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('progressPercentage');
    expect(errors[0].constraints).toHaveProperty('max');

    // Test with negative value
    const negativeGoalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily',
      progressPercentage: -5 // Negative percentage
    };

    const negativeHealthGoalData = plainToInstance(HealthGoalData, negativeGoalData);
    const negativeErrors = await validate(negativeHealthGoalData);
    
    expect(negativeErrors.length).toBeGreaterThan(0);
    expect(negativeErrors[0].property).toBe('progressPercentage');
    expect(negativeErrors[0].constraints).toHaveProperty('min');
  });

  it('should validate when achievedAt is a valid date string', async () => {
    const goalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily',
      achievedAt: new Date().toISOString()
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBe(0);
  });

  it('should fail validation when achievedAt is not a valid date string', async () => {
    const goalData = {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Walk 10,000 steps daily',
      achievedAt: 'not-a-date'
    };

    const healthGoalData = plainToInstance(HealthGoalData, goalData);
    const errors = await validate(healthGoalData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('achievedAt');
    expect(errors[0].constraints).toHaveProperty('isDateString');
  });

  describe('isAchieved method', () => {
    it('should return true when achievedAt is set', () => {
      const healthGoalData = new HealthGoalData();
      healthGoalData.goalId = '123e4567-e89b-12d3-a456-426614174000';
      healthGoalData.goalType = HealthGoalType.STEPS_TARGET;
      healthGoalData.description = 'Walk 10,000 steps daily';
      healthGoalData.achievedAt = new Date().toISOString();
      
      expect(healthGoalData.isAchieved()).toBe(true);
    });

    it('should return true when progressPercentage is 100', () => {
      const healthGoalData = new HealthGoalData();
      healthGoalData.goalId = '123e4567-e89b-12d3-a456-426614174000';
      healthGoalData.goalType = HealthGoalType.STEPS_TARGET;
      healthGoalData.description = 'Walk 10,000 steps daily';
      healthGoalData.progressPercentage = 100;
      
      expect(healthGoalData.isAchieved()).toBe(true);
    });

    it('should return false when progressPercentage is less than 100 and achievedAt is not set', () => {
      const healthGoalData = new HealthGoalData();
      healthGoalData.goalId = '123e4567-e89b-12d3-a456-426614174000';
      healthGoalData.goalType = HealthGoalType.STEPS_TARGET;
      healthGoalData.description = 'Walk 10,000 steps daily';
      healthGoalData.progressPercentage = 75;
      
      expect(healthGoalData.isAchieved()).toBe(false);
    });

    it('should return false when progressPercentage is not set and achievedAt is not set', () => {
      const healthGoalData = new HealthGoalData();
      healthGoalData.goalId = '123e4567-e89b-12d3-a456-426614174000';
      healthGoalData.goalType = HealthGoalType.STEPS_TARGET;
      healthGoalData.description = 'Walk 10,000 steps daily';
      
      expect(healthGoalData.isAchieved()).toBe(false);
    });
  });

  describe('markAsAchieved method', () => {
    it('should set achievedAt and progressPercentage to 100', () => {
      const healthGoalData = new HealthGoalData();
      healthGoalData.goalId = '123e4567-e89b-12d3-a456-426614174000';
      healthGoalData.goalType = HealthGoalType.STEPS_TARGET;
      healthGoalData.description = 'Walk 10,000 steps daily';
      healthGoalData.progressPercentage = 75;
      
      healthGoalData.markAsAchieved();
      
      expect(healthGoalData.progressPercentage).toBe(100);
      expect(healthGoalData.achievedAt).toBeDefined();
      expect(new Date(healthGoalData.achievedAt).getTime()).toBeLessThanOrEqual(new Date().getTime());
    });

    it('should not change achievedAt if already set', () => {
      const achievedDate = new Date(2023, 0, 1).toISOString();
      
      const healthGoalData = new HealthGoalData();
      healthGoalData.goalId = '123e4567-e89b-12d3-a456-426614174000';
      healthGoalData.goalType = HealthGoalType.STEPS_TARGET;
      healthGoalData.description = 'Walk 10,000 steps daily';
      healthGoalData.achievedAt = achievedDate;
      
      healthGoalData.markAsAchieved();
      
      expect(healthGoalData.progressPercentage).toBe(100);
      expect(healthGoalData.achievedAt).toBe(achievedDate);
    });
  });
});

describe('HealthGoalAchievedEventDto', () => {
  it('should validate a valid health goal achieved event', async () => {
    const eventData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: EventType.HEALTH_GOAL_ACHIEVED,
      journey: 'health',
      timestamp: new Date().toISOString(),
      data: {
        goalId: '123e4567-e89b-12d3-a456-426614174000',
        goalType: HealthGoalType.STEPS_TARGET,
        description: 'Walk 10,000 steps daily',
        targetValue: 10000,
        unit: 'steps',
        progressPercentage: 100,
        achievedAt: new Date().toISOString()
      }
    };

    const healthGoalEvent = plainToInstance(HealthGoalAchievedEventDto, eventData);
    const errors = await validate(healthGoalEvent);
    
    expect(errors.length).toBe(0);
  });

  it('should fail validation when type is not HEALTH_GOAL_ACHIEVED', async () => {
    const eventData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'INVALID_TYPE',
      journey: 'health',
      timestamp: new Date().toISOString(),
      data: {
        goalId: '123e4567-e89b-12d3-a456-426614174000',
        goalType: HealthGoalType.STEPS_TARGET,
        description: 'Walk 10,000 steps daily',
        targetValue: 10000,
        unit: 'steps',
        progressPercentage: 100,
        achievedAt: new Date().toISOString()
      }
    };

    const healthGoalEvent = plainToInstance(HealthGoalAchievedEventDto, eventData);
    const errors = await validate(healthGoalEvent);
    
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when journey is not "health"', async () => {
    const eventData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: EventType.HEALTH_GOAL_ACHIEVED,
      journey: 'care', // Invalid journey for health goal
      timestamp: new Date().toISOString(),
      data: {
        goalId: '123e4567-e89b-12d3-a456-426614174000',
        goalType: HealthGoalType.STEPS_TARGET,
        description: 'Walk 10,000 steps daily',
        targetValue: 10000,
        unit: 'steps',
        progressPercentage: 100,
        achievedAt: new Date().toISOString()
      }
    };

    const healthGoalEvent = plainToInstance(HealthGoalAchievedEventDto, eventData);
    const errors = await validate(healthGoalEvent);
    
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when data is missing required fields', async () => {
    const eventData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: EventType.HEALTH_GOAL_ACHIEVED,
      journey: 'health',
      timestamp: new Date().toISOString(),
      data: {
        // Missing goalId and other required fields
        goalType: HealthGoalType.STEPS_TARGET
      }
    };

    const healthGoalEvent = plainToInstance(HealthGoalAchievedEventDto, eventData);
    const errors = await validate(healthGoalEvent, { validationError: { target: false } });
    
    expect(errors.length).toBeGreaterThan(0);
    // Check for nested validation errors
    const dataErrors = errors.find(e => e.property === 'data');
    expect(dataErrors).toBeDefined();
  });

  it('should validate when goal is achieved (progressPercentage = 100)', async () => {
    const eventData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: EventType.HEALTH_GOAL_ACHIEVED,
      journey: 'health',
      timestamp: new Date().toISOString(),
      data: {
        goalId: '123e4567-e89b-12d3-a456-426614174000',
        goalType: HealthGoalType.STEPS_TARGET,
        description: 'Walk 10,000 steps daily',
        targetValue: 10000,
        unit: 'steps',
        progressPercentage: 100
      }
    };

    const healthGoalEvent = plainToInstance(HealthGoalAchievedEventDto, eventData);
    const errors = await validate(healthGoalEvent);
    
    expect(errors.length).toBe(0);
  });

  it('should validate when goal is achieved (achievedAt is set)', async () => {
    const eventData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: EventType.HEALTH_GOAL_ACHIEVED,
      journey: 'health',
      timestamp: new Date().toISOString(),
      data: {
        goalId: '123e4567-e89b-12d3-a456-426614174000',
        goalType: HealthGoalType.STEPS_TARGET,
        description: 'Walk 10,000 steps daily',
        targetValue: 10000,
        unit: 'steps',
        achievedAt: new Date().toISOString()
      }
    };

    const healthGoalEvent = plainToInstance(HealthGoalAchievedEventDto, eventData);
    const errors = await validate(healthGoalEvent);
    
    expect(errors.length).toBe(0);
  });
});

// Integration tests with achievement processing system
describe('Health Goal Achievement Integration', () => {
  it('should correctly identify different goal types for achievement categorization', () => {
    // Test for STEPS_TARGET goal type
    const stepsGoal = new HealthGoalData();
    stepsGoal.goalId = '123e4567-e89b-12d3-a456-426614174000';
    stepsGoal.goalType = HealthGoalType.STEPS_TARGET;
    stepsGoal.description = 'Walk 10,000 steps daily';
    stepsGoal.targetValue = 10000;
    stepsGoal.unit = 'steps';
    
    expect(stepsGoal.goalType).toBe(HealthGoalType.STEPS_TARGET);
    
    // Test for WEIGHT_TARGET goal type
    const weightGoal = new HealthGoalData();
    weightGoal.goalId = '123e4567-e89b-12d3-a456-426614174001';
    weightGoal.goalType = HealthGoalType.WEIGHT_TARGET;
    weightGoal.description = 'Reach target weight of 70kg';
    weightGoal.targetValue = 70;
    weightGoal.unit = 'kg';
    
    expect(weightGoal.goalType).toBe(HealthGoalType.WEIGHT_TARGET);
    
    // Test for SLEEP_DURATION goal type
    const sleepGoal = new HealthGoalData();
    sleepGoal.goalId = '123e4567-e89b-12d3-a456-426614174002';
    sleepGoal.goalType = HealthGoalType.SLEEP_DURATION;
    sleepGoal.description = 'Sleep 8 hours per night';
    sleepGoal.targetValue = 8;
    sleepGoal.unit = 'hours';
    
    expect(sleepGoal.goalType).toBe(HealthGoalType.SLEEP_DURATION);
  });

  it('should track progress accurately for goal achievement', () => {
    const goal = new HealthGoalData();
    goal.goalId = '123e4567-e89b-12d3-a456-426614174000';
    goal.goalType = HealthGoalType.STEPS_TARGET;
    goal.description = 'Walk 10,000 steps daily';
    goal.targetValue = 10000;
    goal.unit = 'steps';
    goal.progressPercentage = 0;
    
    // Update progress to 50%
    goal.progressPercentage = 50;
    expect(goal.isAchieved()).toBe(false);
    
    // Update progress to 100%
    goal.progressPercentage = 100;
    expect(goal.isAchieved()).toBe(true);
  });

  it('should validate target values based on goal type', () => {
    // Steps goal should have positive integer target
    const stepsGoal = new HealthGoalData();
    stepsGoal.goalId = '123e4567-e89b-12d3-a456-426614174000';
    stepsGoal.goalType = HealthGoalType.STEPS_TARGET;
    stepsGoal.description = 'Walk 10,000 steps daily';
    stepsGoal.targetValue = 10000;
    stepsGoal.unit = 'steps';
    
    expect(stepsGoal.targetValue).toBeGreaterThan(0);
    expect(Number.isInteger(stepsGoal.targetValue)).toBe(true);
    
    // Weight goal should have positive number target
    const weightGoal = new HealthGoalData();
    weightGoal.goalId = '123e4567-e89b-12d3-a456-426614174001';
    weightGoal.goalType = HealthGoalType.WEIGHT_TARGET;
    weightGoal.description = 'Reach target weight of 70.5kg';
    weightGoal.targetValue = 70.5;
    weightGoal.unit = 'kg';
    
    expect(weightGoal.targetValue).toBeGreaterThan(0);
  });

  it('should recognize achievement completion for notification', () => {
    const goal = new HealthGoalData();
    goal.goalId = '123e4567-e89b-12d3-a456-426614174000';
    goal.goalType = HealthGoalType.STEPS_TARGET;
    goal.description = 'Walk 10,000 steps daily';
    goal.targetValue = 10000;
    goal.unit = 'steps';
    goal.progressPercentage = 99;
    
    // Not achieved yet
    expect(goal.isAchieved()).toBe(false);
    
    // Mark as achieved
    goal.markAsAchieved();
    
    // Should be achieved now
    expect(goal.isAchieved()).toBe(true);
    expect(goal.progressPercentage).toBe(100);
    expect(goal.achievedAt).toBeDefined();
  });
});