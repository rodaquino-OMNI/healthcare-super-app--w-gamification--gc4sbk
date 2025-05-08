import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { plainToInstance } from 'class-transformer';
import { validate, ValidatorOptions, ValidationError } from 'class-validator';
import { ZodError, ZodSchema, z } from 'zod';
import {
  GamificationEvent,
  EventPayload,
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload,
} from '@austa/interfaces/gamification/events';
import {
  Achievement,
  AchievementCriteria,
} from '@austa/interfaces/gamification/achievements';
import { Rule, RuleCondition } from '@austa/interfaces/gamification/rules';
import { Quest, QuestRequirement } from '@austa/interfaces/gamification/quests';
import { Reward } from '@austa/interfaces/gamification/rewards';

/**
 * Validation utility service for the gamification engine.
 * Provides methods for validating event payloads, achievement criteria,
 * rule conditions, and other gamification-related data structures.
 */
@Injectable()
export class ValidationUtil {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Default validator options for class-validator
   */
  private readonly defaultValidatorOptions: ValidatorOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    skipMissingProperties: false,
    validationError: {
      target: false,
      value: true,
    },
  };

  /**
   * Validates an object against a class-validator decorated class
   * @param object The object to validate
   * @param validationClass The class with validation decorators
   * @param options Optional validator options
   * @returns A promise resolving to validation errors or null if valid
   */
  async validateWithClassValidator<T extends object, V>(object: T, validationClass: new () => V, options?: ValidatorOptions): Promise<ValidationError[] | null> {
    try {
      // Transform plain object to class instance
      const instance = plainToInstance(validationClass, object);
      
      // Validate the instance
      const errors = await validate(instance as object, {
        ...this.defaultValidatorOptions,
        ...options,
      });
      
      return errors.length > 0 ? errors : null;
    } catch (error) {
      this.logger.error('Class validation failed with exception', { error });
      throw new Error(`Validation error: ${error.message}`);
    }
  }

  /**
   * Validates an object against a Zod schema
   * @param object The object to validate
   * @param schema The Zod schema to validate against
   * @returns The validated and typed object or null if invalid
   */
  validateWithZod<T extends object, S extends z.ZodType<any, any, T>>(object: T, schema: S): z.infer<S> | null {
    try {
      return schema.parse(object);
    } catch (error) {
      if (error instanceof ZodError) {
        this.logger.debug('Zod validation failed', {
          errors: error.errors,
          formattedErrors: this.formatZodErrors(error),
        });
      } else {
        this.logger.error('Zod validation failed with exception', { error });
      }
      return null;
    }
  }

  /**
   * Formats Zod errors into a more readable structure
   * @param error The ZodError to format
   * @returns A formatted error object
   */
  formatZodErrors(error: ZodError): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};
    
    for (const err of error.errors) {
      const path = err.path.join('.');
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(err.message);
    }
    
    return formattedErrors;
  }

  /**
   * Validates a gamification event against its expected schema
   * @param event The event to validate
   * @returns True if the event is valid, false otherwise
   */
  validateEvent<T extends EventPayload>(event: GamificationEvent<T>): boolean {
    try {
      // Basic structure validation
      if (!this.validateEventStructure(event)) {
        return false;
      }
      
      // Journey-specific payload validation
      if (event.journey === 'health') {
        return this.validateHealthEventPayload(event as GamificationEvent<HealthEventPayload>);
      } else if (event.journey === 'care') {
        return this.validateCareEventPayload(event as GamificationEvent<CareEventPayload>);
      } else if (event.journey === 'plan') {
        return this.validatePlanEventPayload(event as GamificationEvent<PlanEventPayload>);
      }
      
      this.logger.warn('Unknown journey type for event validation', {
        eventId: event.eventId,
        journey: event.journey,
      });
      return false;
    } catch (error) {
      this.logger.error('Event validation failed with exception', {
        eventId: event.eventId,
        error,
      });
      return false;
    }
  }

  /**
   * Validates the basic structure of a gamification event
   * @param event The event to validate
   * @returns True if the event structure is valid, false otherwise
   */
  private validateEventStructure<T extends EventPayload>(event: GamificationEvent<T>): boolean {
    // Define the base event schema with Zod
    const baseEventSchema = z.object({
      eventId: z.string().uuid(),
      type: z.string().min(1),
      userId: z.string().min(1),
      journey: z.enum(['health', 'care', 'plan']),
      timestamp: z.string().datetime(),
      version: z.string().min(1),
      payload: z.record(z.any()).optional(),
      metadata: z.record(z.any()).optional(),
    });
    
    const result = this.validateWithZod(event, baseEventSchema);
    return result !== null;
  }

  /**
   * Validates a Health journey event payload
   * @param event The Health event to validate
   * @returns True if the payload is valid, false otherwise
   */
  private validateHealthEventPayload(event: GamificationEvent<HealthEventPayload>): boolean {
    // Define schemas for different health event types
    const schemas: Record<string, ZodSchema> = {
      'HEALTH_METRIC_RECORDED': z.object({
        metricType: z.enum(['STEPS', 'HEART_RATE', 'SLEEP', 'WEIGHT', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE']),
        value: z.number(),
        unit: z.string(),
        recordedAt: z.string().datetime(),
        source: z.string().optional(),
      }),
      'HEALTH_GOAL_CREATED': z.object({
        goalId: z.string().uuid(),
        metricType: z.enum(['STEPS', 'HEART_RATE', 'SLEEP', 'WEIGHT', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE']),
        targetValue: z.number(),
        unit: z.string(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime().optional(),
        frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
      }),
      'HEALTH_GOAL_ACHIEVED': z.object({
        goalId: z.string().uuid(),
        achievedAt: z.string().datetime(),
        metricType: z.enum(['STEPS', 'HEART_RATE', 'SLEEP', 'WEIGHT', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE']),
        actualValue: z.number(),
        targetValue: z.number(),
      }),
      'DEVICE_CONNECTED': z.object({
        deviceId: z.string(),
        deviceType: z.string(),
        manufacturer: z.string(),
        connectedAt: z.string().datetime(),
      }),
      'DEVICE_SYNCED': z.object({
        deviceId: z.string(),
        syncedAt: z.string().datetime(),
        dataPoints: z.number().int().positive(),
      }),
      'HEALTH_INSIGHT_GENERATED': z.object({
        insightId: z.string().uuid(),
        insightType: z.string(),
        generatedAt: z.string().datetime(),
        relatedMetrics: z.array(z.string()).optional(),
      }),
    };
    
    const schema = schemas[event.type];
    if (!schema) {
      this.logger.warn('No validation schema defined for health event type', {
        eventId: event.eventId,
        eventType: event.type,
      });
      return false;
    }
    
    const result = this.validateWithZod(event.payload, schema);
    return result !== null;
  }

  /**
   * Validates a Care journey event payload
   * @param event The Care event to validate
   * @returns True if the payload is valid, false otherwise
   */
  private validateCareEventPayload(event: GamificationEvent<CareEventPayload>): boolean {
    // Define schemas for different care event types
    const schemas: Record<string, ZodSchema> = {
      'APPOINTMENT_BOOKED': z.object({
        appointmentId: z.string().uuid(),
        providerId: z.string(),
        specialtyType: z.string(),
        scheduledAt: z.string().datetime(),
        bookedAt: z.string().datetime(),
        virtual: z.boolean().optional(),
      }),
      'APPOINTMENT_COMPLETED': z.object({
        appointmentId: z.string().uuid(),
        providerId: z.string(),
        completedAt: z.string().datetime(),
        duration: z.number().int().positive(),
        virtual: z.boolean().optional(),
      }),
      'APPOINTMENT_CANCELLED': z.object({
        appointmentId: z.string().uuid(),
        cancelledAt: z.string().datetime(),
        reason: z.string().optional(),
      }),
      'MEDICATION_TAKEN': z.object({
        medicationId: z.string().uuid(),
        takenAt: z.string().datetime(),
        dosage: z.number().positive(),
        unit: z.string(),
        adherenceStreak: z.number().int().nonnegative().optional(),
      }),
      'MEDICATION_SKIPPED': z.object({
        medicationId: z.string().uuid(),
        skippedAt: z.string().datetime(),
        reason: z.string().optional(),
      }),
      'TELEMEDICINE_SESSION_STARTED': z.object({
        sessionId: z.string().uuid(),
        providerId: z.string(),
        startedAt: z.string().datetime(),
        appointmentId: z.string().uuid().optional(),
      }),
      'TELEMEDICINE_SESSION_COMPLETED': z.object({
        sessionId: z.string().uuid(),
        providerId: z.string(),
        completedAt: z.string().datetime(),
        duration: z.number().int().positive(),
        appointmentId: z.string().uuid().optional(),
      }),
      'CARE_PLAN_UPDATED': z.object({
        carePlanId: z.string().uuid(),
        updatedAt: z.string().datetime(),
        changes: z.array(z.object({
          field: z.string(),
          oldValue: z.any().optional(),
          newValue: z.any(),
        })),
      }),
    };
    
    const schema = schemas[event.type];
    if (!schema) {
      this.logger.warn('No validation schema defined for care event type', {
        eventId: event.eventId,
        eventType: event.type,
      });
      return false;
    }
    
    const result = this.validateWithZod(event.payload, schema);
    return result !== null;
  }

  /**
   * Validates a Plan journey event payload
   * @param event The Plan event to validate
   * @returns True if the payload is valid, false otherwise
   */
  private validatePlanEventPayload(event: GamificationEvent<PlanEventPayload>): boolean {
    // Define schemas for different plan event types
    const schemas: Record<string, ZodSchema> = {
      'CLAIM_SUBMITTED': z.object({
        claimId: z.string().uuid(),
        submittedAt: z.string().datetime(),
        amount: z.number().positive(),
        serviceType: z.string(),
        serviceDate: z.string().datetime(),
        providerId: z.string().optional(),
      }),
      'CLAIM_APPROVED': z.object({
        claimId: z.string().uuid(),
        approvedAt: z.string().datetime(),
        approvedAmount: z.number().positive(),
        submittedAmount: z.number().positive(),
        coveragePercentage: z.number().min(0).max(100),
      }),
      'CLAIM_REJECTED': z.object({
        claimId: z.string().uuid(),
        rejectedAt: z.string().datetime(),
        reason: z.string(),
        submittedAmount: z.number().positive(),
      }),
      'BENEFIT_UTILIZED': z.object({
        benefitId: z.string().uuid(),
        utilizedAt: z.string().datetime(),
        benefitType: z.string(),
        value: z.number().positive(),
        remainingValue: z.number().nonnegative().optional(),
      }),
      'PLAN_SELECTED': z.object({
        planId: z.string().uuid(),
        selectedAt: z.string().datetime(),
        planType: z.string(),
        coverageStartDate: z.string().datetime(),
        coverageEndDate: z.string().datetime().optional(),
        previousPlanId: z.string().uuid().optional(),
      }),
      'PLAN_COMPARED': z.object({
        planIds: z.array(z.string().uuid()).min(2),
        comparedAt: z.string().datetime(),
        selectedPlanId: z.string().uuid().optional(),
      }),
      'REWARD_REDEEMED': z.object({
        rewardId: z.string().uuid(),
        redeemedAt: z.string().datetime(),
        rewardType: z.string(),
        value: z.number().positive(),
        pointsUsed: z.number().int().positive(),
      }),
    };
    
    const schema = schemas[event.type];
    if (!schema) {
      this.logger.warn('No validation schema defined for plan event type', {
        eventId: event.eventId,
        eventType: event.type,
      });
      return false;
    }
    
    const result = this.validateWithZod(event.payload, schema);
    return result !== null;
  }

  /**
   * Validates achievement criteria against its schema
   * @param criteria The achievement criteria to validate
   * @returns True if the criteria is valid, false otherwise
   */
  validateAchievementCriteria(criteria: AchievementCriteria): boolean {
    const criteriaSchema = z.object({
      type: z.enum(['EVENT_BASED', 'THRESHOLD', 'STREAK', 'COLLECTION', 'MILESTONE']),
      eventType: z.string().optional(),
      threshold: z.number().optional(),
      targetValue: z.number().optional(),
      requiredDays: z.number().int().positive().optional(),
      requiredItems: z.array(z.string()).optional(),
      timeframe: z.object({
        type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME']),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }).optional(),
      conditions: z.array(z.record(z.any())).optional(),
    });
    
    const result = this.validateWithZod(criteria, criteriaSchema);
    return result !== null;
  }

  /**
   * Validates a rule condition against its schema
   * @param condition The rule condition to validate
   * @returns True if the condition is valid, false otherwise
   */
  validateRuleCondition(condition: RuleCondition): boolean {
    const conditionSchema = z.object({
      field: z.string(),
      operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'NOT_CONTAINS', 'IN', 'NOT_IN']),
      value: z.any(),
      path: z.string().optional(),
      negate: z.boolean().optional(),
    });
    
    const result = this.validateWithZod(condition, conditionSchema);
    return result !== null;
  }

  /**
   * Validates a quest requirement against its schema
   * @param requirement The quest requirement to validate
   * @returns True if the requirement is valid, false otherwise
   */
  validateQuestRequirement(requirement: QuestRequirement): boolean {
    const requirementSchema = z.object({
      type: z.enum(['EVENT_COUNT', 'ACHIEVEMENT', 'METRIC_VALUE', 'CUSTOM']),
      eventType: z.string().optional(),
      count: z.number().int().positive().optional(),
      achievementId: z.string().uuid().optional(),
      metricType: z.string().optional(),
      targetValue: z.number().optional(),
      customData: z.record(z.any()).optional(),
      conditions: z.array(z.record(z.any())).optional(),
    });
    
    const result = this.validateWithZod(requirement, requirementSchema);
    return result !== null;
  }

  /**
   * Validates a complete achievement object
   * @param achievement The achievement to validate
   * @returns True if the achievement is valid, false otherwise
   */
  validateAchievement(achievement: Achievement): boolean {
    const achievementSchema = z.object({
      id: z.string().uuid().optional(), // Optional for new achievements
      title: z.string().min(1),
      description: z.string().min(1),
      journey: z.enum(['health', 'care', 'plan', 'cross_journey']),
      type: z.enum(['STANDARD', 'HIDDEN', 'PROGRESSIVE', 'RARE', 'DAILY', 'WEEKLY']),
      iconUrl: z.string().url().optional(),
      points: z.number().int().nonnegative(),
      criteria: z.object({
        type: z.enum(['EVENT_BASED', 'THRESHOLD', 'STREAK', 'COLLECTION', 'MILESTONE']),
        eventType: z.string().optional(),
        threshold: z.number().optional(),
        targetValue: z.number().optional(),
        requiredDays: z.number().int().positive().optional(),
        requiredItems: z.array(z.string()).optional(),
        timeframe: z.object({
          type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME']),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
        }).optional(),
        conditions: z.array(z.record(z.any())).optional(),
      }),
      isActive: z.boolean().optional(),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional(),
    });
    
    const result = this.validateWithZod(achievement, achievementSchema);
    return result !== null;
  }

  /**
   * Validates a complete rule object
   * @param rule The rule to validate
   * @returns True if the rule is valid, false otherwise
   */
  validateRule(rule: Rule): boolean {
    const ruleSchema = z.object({
      id: z.string().uuid().optional(), // Optional for new rules
      name: z.string().min(1),
      description: z.string().min(1),
      eventType: z.string(),
      journey: z.enum(['health', 'care', 'plan', 'cross_journey']),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'NOT_CONTAINS', 'IN', 'NOT_IN']),
        value: z.any(),
        path: z.string().optional(),
        negate: z.boolean().optional(),
      })),
      actions: z.array(z.object({
        type: z.enum(['AWARD_POINTS', 'UNLOCK_ACHIEVEMENT', 'PROGRESS_QUEST', 'TRIGGER_EVENT', 'CUSTOM']),
        points: z.number().int().nonnegative().optional(),
        achievementId: z.string().uuid().optional(),
        questId: z.string().uuid().optional(),
        eventType: z.string().optional(),
        eventData: z.record(z.any()).optional(),
        customData: z.record(z.any()).optional(),
      })),
      priority: z.number().int().nonnegative(),
      isActive: z.boolean().optional(),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional(),
    });
    
    const result = this.validateWithZod(rule, ruleSchema);
    return result !== null;
  }

  /**
   * Validates a complete quest object
   * @param quest The quest to validate
   * @returns True if the quest is valid, false otherwise
   */
  validateQuest(quest: Quest): boolean {
    const questSchema = z.object({
      id: z.string().uuid().optional(), // Optional for new quests
      title: z.string().min(1),
      description: z.string().min(1),
      journey: z.enum(['health', 'care', 'plan', 'cross_journey']),
      iconUrl: z.string().url().optional(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      points: z.number().int().nonnegative(),
      requirements: z.array(z.object({
        type: z.enum(['EVENT_COUNT', 'ACHIEVEMENT', 'METRIC_VALUE', 'CUSTOM']),
        eventType: z.string().optional(),
        count: z.number().int().positive().optional(),
        achievementId: z.string().uuid().optional(),
        metricType: z.string().optional(),
        targetValue: z.number().optional(),
        customData: z.record(z.any()).optional(),
        conditions: z.array(z.record(z.any())).optional(),
      })),
      rewards: z.array(z.object({
        type: z.enum(['POINTS', 'BADGE', 'DISCOUNT', 'CUSTOM']),
        points: z.number().int().nonnegative().optional(),
        badgeId: z.string().uuid().optional(),
        discountValue: z.number().nonnegative().optional(),
        customData: z.record(z.any()).optional(),
      })).optional(),
      isActive: z.boolean().optional(),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional(),
    });
    
    const result = this.validateWithZod(quest, questSchema);
    return result !== null;
  }

  /**
   * Validates a complete reward object
   * @param reward The reward to validate
   * @returns True if the reward is valid, false otherwise
   */
  validateReward(reward: Reward): boolean {
    const rewardSchema = z.object({
      id: z.string().uuid().optional(), // Optional for new rewards
      name: z.string().min(1),
      description: z.string().min(1),
      journey: z.enum(['health', 'care', 'plan', 'cross_journey']),
      type: z.enum(['POINTS', 'BADGE', 'DISCOUNT', 'CUSTOM']),
      value: z.number().nonnegative(),
      iconUrl: z.string().url().optional(),
      pointCost: z.number().int().nonnegative(),
      quantity: z.number().int().nonnegative().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional(),
    });
    
    const result = this.validateWithZod(reward, rewardSchema);
    return result !== null;
  }

  /**
   * Type guard to check if a value is a valid event payload
   * @param value The value to check
   * @returns True if the value is a valid event payload
   */
  isValidEventPayload(value: any): value is EventPayload {
    return value !== null && typeof value === 'object';
  }

  /**
   * Type guard to check if a value is a valid health event payload
   * @param value The value to check
   * @param eventType Optional event type to validate against
   * @returns True if the value is a valid health event payload
   */
  isValidHealthEventPayload(value: any, eventType?: string): value is HealthEventPayload {
    if (!this.isValidEventPayload(value)) {
      return false;
    }
    
    if (eventType) {
      const mockEvent: GamificationEvent<HealthEventPayload> = {
        eventId: 'test-id',
        type: eventType,
        userId: 'test-user',
        journey: 'health',
        timestamp: new Date().toISOString(),
        version: '1.0',
        payload: value,
        metadata: {},
      };
      
      return this.validateHealthEventPayload(mockEvent);
    }
    
    // Basic structure check if no event type provided
    return true;
  }

  /**
   * Type guard to check if a value is a valid care event payload
   * @param value The value to check
   * @param eventType Optional event type to validate against
   * @returns True if the value is a valid care event payload
   */
  isValidCareEventPayload(value: any, eventType?: string): value is CareEventPayload {
    if (!this.isValidEventPayload(value)) {
      return false;
    }
    
    if (eventType) {
      const mockEvent: GamificationEvent<CareEventPayload> = {
        eventId: 'test-id',
        type: eventType,
        userId: 'test-user',
        journey: 'care',
        timestamp: new Date().toISOString(),
        version: '1.0',
        payload: value,
        metadata: {},
      };
      
      return this.validateCareEventPayload(mockEvent);
    }
    
    // Basic structure check if no event type provided
    return true;
  }

  /**
   * Type guard to check if a value is a valid plan event payload
   * @param value The value to check
   * @param eventType Optional event type to validate against
   * @returns True if the value is a valid plan event payload
   */
  isValidPlanEventPayload(value: any, eventType?: string): value is PlanEventPayload {
    if (!this.isValidEventPayload(value)) {
      return false;
    }
    
    if (eventType) {
      const mockEvent: GamificationEvent<PlanEventPayload> = {
        eventId: 'test-id',
        type: eventType,
        userId: 'test-user',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        version: '1.0',
        payload: value,
        metadata: {},
      };
      
      return this.validatePlanEventPayload(mockEvent);
    }
    
    // Basic structure check if no event type provided
    return true;
  }

  /**
   * Formats validation errors into a consistent structure for logging and debugging
   * @param errors The validation errors to format
   * @returns A formatted error object
   */
  formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};
    
    const formatError = (error: ValidationError, parentPath = '') => {
      const path = parentPath ? `${parentPath}.${error.property}` : error.property;
      
      if (error.constraints) {
        formattedErrors[path] = Object.values(error.constraints);
      }
      
      if (error.children && error.children.length > 0) {
        error.children.forEach(child => formatError(child, path));
      }
    };
    
    errors.forEach(error => formatError(error));
    return formattedErrors;
  }
}

/**
 * Standalone utility function to check if an object is a valid GamificationEvent
 * @param obj The object to check
 * @returns True if the object is a valid GamificationEvent
 */
export function isValidGamificationEvent(obj: any): obj is GamificationEvent<EventPayload> {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  // Check required properties
  const requiredProps = ['eventId', 'type', 'userId', 'journey', 'timestamp', 'version', 'payload'];
  for (const prop of requiredProps) {
    if (!(prop in obj)) {
      return false;
    }
  }
  
  // Basic type checks
  if (typeof obj.eventId !== 'string' || obj.eventId.trim() === '') {
    return false;
  }
  
  if (typeof obj.type !== 'string' || obj.type.trim() === '') {
    return false;
  }
  
  if (typeof obj.userId !== 'string' || obj.userId.trim() === '') {
    return false;
  }
  
  if (!['health', 'care', 'plan'].includes(obj.journey)) {
    return false;
  }
  
  if (typeof obj.timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj.timestamp)) {
    return false;
  }
  
  if (typeof obj.version !== 'string' || obj.version.trim() === '') {
    return false;
  }
  
  if (obj.payload === null || typeof obj.payload !== 'object') {
    return false;
  }
  
  return true;
}

/**
 * Standalone utility function to validate a rule condition
 * @param condition The condition to validate
 * @returns True if the condition is valid, false otherwise
 */
export function isValidRuleCondition(condition: any): condition is RuleCondition {
  if (!condition || typeof condition !== 'object') {
    return false;
  }
  
  // Check required properties
  if (typeof condition.field !== 'string' || condition.field.trim() === '') {
    return false;
  }
  
  const validOperators = ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'NOT_CONTAINS', 'IN', 'NOT_IN'];
  if (!validOperators.includes(condition.operator)) {
    return false;
  }
  
  // Value can be any type, but must be present
  if (condition.value === undefined) {
    return false;
  }
  
  // Optional properties
  if (condition.path !== undefined && (typeof condition.path !== 'string' || condition.path.trim() === '')) {
    return false;
  }
  
  if (condition.negate !== undefined && typeof condition.negate !== 'boolean') {
    return false;
  }
  
  return true;
}

/**
 * Standalone utility function to validate achievement criteria
 * @param criteria The criteria to validate
 * @returns True if the criteria is valid, false otherwise
 */
export function isValidAchievementCriteria(criteria: any): criteria is AchievementCriteria {
  if (!criteria || typeof criteria !== 'object') {
    return false;
  }
  
  // Check required properties
  const validTypes = ['EVENT_BASED', 'THRESHOLD', 'STREAK', 'COLLECTION', 'MILESTONE'];
  if (!validTypes.includes(criteria.type)) {
    return false;
  }
  
  // Type-specific validations
  if (criteria.type === 'EVENT_BASED' && (typeof criteria.eventType !== 'string' || criteria.eventType.trim() === '')) {
    return false;
  }
  
  if (criteria.type === 'THRESHOLD' && (typeof criteria.threshold !== 'number' || criteria.threshold <= 0)) {
    return false;
  }
  
  if (criteria.type === 'STREAK' && (typeof criteria.requiredDays !== 'number' || criteria.requiredDays <= 0)) {
    return false;
  }
  
  if (criteria.type === 'COLLECTION' && (!Array.isArray(criteria.requiredItems) || criteria.requiredItems.length === 0)) {
    return false;
  }
  
  if (criteria.type === 'MILESTONE' && (typeof criteria.targetValue !== 'number' || criteria.targetValue <= 0)) {
    return false;
  }
  
  // Validate timeframe if present
  if (criteria.timeframe) {
    const validTimeframeTypes = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];
    if (!validTimeframeTypes.includes(criteria.timeframe.type)) {
      return false;
    }
    
    // Validate dates if present
    if (criteria.timeframe.startDate && typeof criteria.timeframe.startDate !== 'string') {
      return false;
    }
    
    if (criteria.timeframe.endDate && typeof criteria.timeframe.endDate !== 'string') {
      return false;
    }
  }
  
  // Validate conditions if present
  if (criteria.conditions) {
    if (!Array.isArray(criteria.conditions)) {
      return false;
    }
    
    for (const condition of criteria.conditions) {
      if (typeof condition !== 'object' || condition === null) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Standalone utility function to validate a quest requirement
 * @param requirement The requirement to validate
 * @returns True if the requirement is valid, false otherwise
 */
export function isValidQuestRequirement(requirement: any): requirement is QuestRequirement {
  if (!requirement || typeof requirement !== 'object') {
    return false;
  }
  
  // Check required properties
  const validTypes = ['EVENT_COUNT', 'ACHIEVEMENT', 'METRIC_VALUE', 'CUSTOM'];
  if (!validTypes.includes(requirement.type)) {
    return false;
  }
  
  // Type-specific validations
  if (requirement.type === 'EVENT_COUNT') {
    if (typeof requirement.eventType !== 'string' || requirement.eventType.trim() === '') {
      return false;
    }
    
    if (typeof requirement.count !== 'number' || requirement.count <= 0) {
      return false;
    }
  }
  
  if (requirement.type === 'ACHIEVEMENT' && (typeof requirement.achievementId !== 'string' || requirement.achievementId.trim() === '')) {
    return false;
  }
  
  if (requirement.type === 'METRIC_VALUE') {
    if (typeof requirement.metricType !== 'string' || requirement.metricType.trim() === '') {
      return false;
    }
    
    if (typeof requirement.targetValue !== 'number') {
      return false;
    }
  }
  
  if (requirement.type === 'CUSTOM' && (typeof requirement.customData !== 'object' || requirement.customData === null)) {
    return false;
  }
  
  // Validate conditions if present
  if (requirement.conditions) {
    if (!Array.isArray(requirement.conditions)) {
      return false;
    }
    
    for (const condition of requirement.conditions) {
      if (typeof condition !== 'object' || condition === null) {
        return false;
      }
    }
  }
  
  return true;
}