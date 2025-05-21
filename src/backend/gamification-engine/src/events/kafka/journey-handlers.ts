import { Injectable } from '@nestjs/common';
import { LoggerService } from '@app/shared/logging/logger.service';
import { AchievementsService } from '../../achievements/achievements.service';
import { QuestsService } from '../../quests/quests.service';
import { RewardsService } from '../../rewards/rewards.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { RulesService } from '../../rules/rules.service';
import { NotificationService } from '../../common/services/notification.service';
import { 
  IEventHandler,
  IEventHandlerResult,
  IRuleEvaluationResult
} from '../interfaces/event-handler.interface';
import {
  IJourneyEvent,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  HealthEventType,
  CareEventType,
  PlanEventType,
  isHealthEvent,
  isCareEvent,
  isPlanEvent
} from '../interfaces/journey-events.interface';

/**
 * Base abstract class for journey event handlers.
 * Provides common functionality for all journey handlers.
 */
@Injectable()
export abstract class BaseJourneyHandler implements IEventHandler<IJourneyEvent> {
  constructor(
    protected readonly logger: LoggerService,
    protected readonly achievementsService: AchievementsService,
    protected readonly questsService: QuestsService,
    protected readonly rewardsService: RewardsService,
    protected readonly profilesService: ProfilesService,
    protected readonly rulesService: RulesService,
    protected readonly notificationService: NotificationService
  ) {}

  /**
   * Determines if this handler can process the given event.
   * 
   * @param event The event to check
   * @returns True if this handler can process the event, false otherwise
   */
  abstract canHandle(event: IJourneyEvent): boolean;

  /**
   * Processes the given event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the result of the event processing
   */
  abstract handle(event: IJourneyEvent): Promise<IEventHandlerResult>;

  /**
   * Processes rule evaluations and updates user achievements, quests, and rewards.
   * 
   * @param userId The ID of the user
   * @param ruleResults The results of rule evaluations
   * @returns A promise that resolves with the processed rule results
   */
  protected async processRuleResults(
    userId: string,
    ruleResults: IRuleEvaluationResult[]
  ): Promise<IEventHandlerResult> {
    let totalPoints = 0;
    const achievementIds: string[] = [];
    const questIds: string[] = [];
    const rewardIds: string[] = [];

    // Process each triggered rule
    for (const result of ruleResults.filter(r => r.triggered)) {
      for (const action of result.actions || []) {
        switch (action.type) {
          case 'AWARD_POINTS':
            const points = Number(action.params.points) || 0;
            if (points > 0) {
              await this.profilesService.addPoints(userId, points, {
                ruleId: result.ruleId,
                context: result.context
              });
              totalPoints += points;
            }
            break;

          case 'PROGRESS_ACHIEVEMENT':
            const achievementId = action.params.achievementId;
            const progress = Number(action.params.progress) || 0;
            if (achievementId && progress > 0) {
              const achievementResult = await this.achievementsService.progressAchievement(
                userId,
                achievementId,
                progress,
                { ruleId: result.ruleId, context: result.context }
              );
              if (achievementResult.completed) {
                achievementIds.push(achievementId);
                // Send achievement notification
                await this.notificationService.sendAchievementNotification(
                  userId,
                  achievementId,
                  { ruleId: result.ruleId, context: result.context }
                );
              }
            }
            break;

          case 'PROGRESS_QUEST':
            const questId = action.params.questId;
            const questProgress = Number(action.params.progress) || 0;
            if (questId && questProgress > 0) {
              const questResult = await this.questsService.progressQuest(
                userId,
                questId,
                questProgress,
                { ruleId: result.ruleId, context: result.context }
              );
              if (questResult.completed) {
                questIds.push(questId);
                // Send quest completion notification
                await this.notificationService.sendQuestCompletionNotification(
                  userId,
                  questId,
                  { ruleId: result.ruleId, context: result.context }
                );
              }
            }
            break;

          case 'GRANT_REWARD':
            const rewardId = action.params.rewardId;
            if (rewardId) {
              const rewardResult = await this.rewardsService.grantReward(
                userId,
                rewardId,
                { ruleId: result.ruleId, context: result.context }
              );
              rewardIds.push(rewardId);
              
              // Send reward notification
              await this.notificationService.sendRewardNotification(
                userId,
                rewardId,
                { ruleId: result.ruleId, context: result.context }
              );
            }
            break;

          default:
            this.logger.warn(
              `Unknown rule action type: ${action.type}`,
              'JourneyHandler'
            );
        }
      }
    }

    return {
      success: true,
      data: {
        points: totalPoints,
        achievements: achievementIds,
        quests: questIds,
        rewards: rewardIds
      }
    };
  }

  /**
   * Creates a standardized error result.
   * 
   * @param error The error that occurred
   * @param context Additional context for the error
   * @returns An error result object
   */
  protected createErrorResult(error: Error, context?: Record<string, any>): IEventHandlerResult {
    return {
      success: false,
      error: error.message,
      errorCode: error.name,
      metadata: context
    };
  }
}

/**
 * Handler for Health journey events.
 * Processes events related to health metrics, goals, and devices.
 */
@Injectable()
export class HealthJourneyHandler extends BaseJourneyHandler {
  constructor(
    protected readonly logger: LoggerService,
    protected readonly achievementsService: AchievementsService,
    protected readonly questsService: QuestsService,
    protected readonly rewardsService: RewardsService,
    protected readonly profilesService: ProfilesService,
    protected readonly rulesService: RulesService
  ) {
    super(logger, achievementsService, questsService, rewardsService, profilesService, rulesService);
    this.logger.log('HealthJourneyHandler initialized', 'HealthJourneyHandler');
  }

  /**
   * Determines if this handler can process the given event.
   * 
   * @param event The event to check
   * @returns True if this is a health journey event, false otherwise
   */
  canHandle(event: IJourneyEvent): boolean {
    return isHealthEvent(event);
  }

  /**
   * Processes a health journey event.
   * 
   * @param event The health event to process
   * @returns A promise that resolves with the result of the event processing
   */
  async handle(event: IJourneyEvent): Promise<IEventHandlerResult> {
    try {
      if (!isHealthEvent(event)) {
        throw new Error('Event is not a health event');
      }

      const healthEvent = event as IHealthEvent;
      this.logger.log(
        `Processing health event: ${healthEvent.type} for user: ${healthEvent.userId}`,
        'HealthJourneyHandler'
      );

      // Apply specialized processing based on event type
      switch (healthEvent.type) {
        case HealthEventType.METRIC_RECORDED:
          return await this.handleMetricRecorded(healthEvent);

        case HealthEventType.GOAL_ACHIEVED:
          return await this.handleGoalAchieved(healthEvent);

        case HealthEventType.DEVICE_CONNECTED:
          return await this.handleDeviceConnected(healthEvent);

        default:
          // For other event types, use standard rule evaluation
          const ruleResults = await this.rulesService.evaluateRules(
            healthEvent.userId,
            healthEvent.type,
            healthEvent.data
          );

          return await this.processRuleResults(healthEvent.userId, ruleResults);
      }
    } catch (error) {
      this.logger.error(
        `Error processing health event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        'HealthJourneyHandler'
      );

      return this.createErrorResult(
        error instanceof Error ? error : new Error(String(error)),
        { eventType: event.type }
      );
    }
  }

  /**
   * Handles a HEALTH_METRIC_RECORDED event.
   * 
   * @param event The health metric event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handleMetricRecorded(event: IHealthEvent): Promise<IEventHandlerResult> {
    // Evaluate rules specific to metric recording
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // Check for streak achievements based on consistent metric recording
    const metricType = event.data.metricType;
    const value = event.data.value;
    const unit = event.data.unit;
    
    // Track the metric value in the user's profile
    await this.profilesService.recordMetricValue(
      event.userId,
      metricType,
      value,
      unit,
      event.data.timestamp || new Date()
    );
    
    // Update streak information
    const streakData = await this.profilesService.updateMetricStreak(
      event.userId,
      metricType,
      event.data.timestamp || new Date()
    );

    // If streak milestone reached, trigger additional achievements
    if (streakData.milestone) {
      const streakAchievements = await this.achievementsService.checkStreakAchievements(
        event.userId,
        metricType,
        streakData.currentStreak
      );
      
      // Send notifications for any new streak achievements
      for (const achievementId of streakAchievements) {
        await this.notificationService.sendAchievementNotification(
          event.userId,
          achievementId,
          { streakType: metricType, streakCount: streakData.currentStreak }
        );
      }
    }
    
    // Check if this metric value represents an improvement
    if (event.data.isImprovement) {
      // Trigger improvement-based achievements
      const improvementAchievements = await this.achievementsService.checkMetricImprovementAchievements(
        event.userId,
        metricType,
        value,
        event.data.previousValue || 0,
        event.data.change || 0
      );
      
      // Send notifications for any improvement achievements
      for (const achievementId of improvementAchievements) {
        await this.notificationService.sendAchievementNotification(
          event.userId,
          achievementId,
          { metricType, value, improvement: event.data.change }
        );
      }
    }

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }

  /**
   * Handles a HEALTH_GOAL_ACHIEVED event.
   * 
   * @param event The goal achieved event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handleGoalAchieved(event: IHealthEvent): Promise<IEventHandlerResult> {
    // Evaluate rules for goal achievement
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // Track goal completion in user profile
    await this.profilesService.recordGoalAchievement(
      event.userId,
      event.data.goal.id,
      event.data.goalType,
      event.data.achievedValue,
      event.data.targetValue,
      event.data.isEarlyCompletion || false
    );

    // Check for goal-specific achievements
    const goalAchievements = await this.achievementsService.checkGoalAchievements(
      event.userId,
      event.data.goalType,
      event.data.isEarlyCompletion || false
    );
    
    // Send notifications for any goal achievements
    for (const achievementId of goalAchievements) {
      await this.notificationService.sendAchievementNotification(
        event.userId,
        achievementId,
        { 
          goalType: event.data.goalType, 
          achievedValue: event.data.achievedValue,
          targetValue: event.data.targetValue,
          isEarlyCompletion: event.data.isEarlyCompletion || false
        }
      );
    }

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }

  /**
   * Handles a HEALTH_DEVICE_CONNECTED event.
   * 
   * @param event The device connected event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handleDeviceConnected(event: IHealthEvent): Promise<IEventHandlerResult> {
    // Evaluate rules for device connection
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // If this is the first connection, check for first-time connection achievements
    if (event.data.isFirstConnection) {
      const deviceAchievements = await this.achievementsService.checkDeviceAchievements(
        event.userId,
        event.data.deviceType
      );
      
      // Send notifications for any device connection achievements
      for (const achievementId of deviceAchievements) {
        await this.notificationService.sendAchievementNotification(
          event.userId,
          achievementId,
          { deviceType: event.data.deviceType }
        );
      }
    }

    // Update user profile with connected device
    await this.profilesService.addConnectedDevice(
      event.userId,
      event.data.deviceId,
      event.data.deviceType
    );

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }
}

/**
 * Handler for Care journey events.
 * Processes events related to appointments, medications, and telemedicine.
 */
@Injectable()
export class CareJourneyHandler extends BaseJourneyHandler {
  constructor(
    protected readonly logger: LoggerService,
    protected readonly achievementsService: AchievementsService,
    protected readonly questsService: QuestsService,
    protected readonly rewardsService: RewardsService,
    protected readonly profilesService: ProfilesService,
    protected readonly rulesService: RulesService
  ) {
    super(logger, achievementsService, questsService, rewardsService, profilesService, rulesService);
    this.logger.log('CareJourneyHandler initialized', 'CareJourneyHandler');
  }

  /**
   * Determines if this handler can process the given event.
   * 
   * @param event The event to check
   * @returns True if this is a care journey event, false otherwise
   */
  canHandle(event: IJourneyEvent): boolean {
    return isCareEvent(event);
  }

  /**
   * Processes a care journey event.
   * 
   * @param event The care event to process
   * @returns A promise that resolves with the result of the event processing
   */
  async handle(event: IJourneyEvent): Promise<IEventHandlerResult> {
    try {
      if (!isCareEvent(event)) {
        throw new Error('Event is not a care event');
      }

      const careEvent = event as ICareEvent;
      this.logger.log(
        `Processing care event: ${careEvent.type} for user: ${careEvent.userId}`,
        'CareJourneyHandler'
      );

      // Apply specialized processing based on event type
      switch (careEvent.type) {
        case CareEventType.APPOINTMENT_COMPLETED:
          return await this.handleAppointmentCompleted(careEvent);

        case CareEventType.MEDICATION_ADHERENCE_STREAK:
          return await this.handleMedicationAdherenceStreak(careEvent);

        case CareEventType.TELEMEDICINE_SESSION_COMPLETED:
          return await this.handleTelemedicineSessionCompleted(careEvent);

        default:
          // For other event types, use standard rule evaluation
          const ruleResults = await this.rulesService.evaluateRules(
            careEvent.userId,
            careEvent.type,
            careEvent.data
          );

          return await this.processRuleResults(careEvent.userId, ruleResults);
      }
    } catch (error) {
      this.logger.error(
        `Error processing care event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        'CareJourneyHandler'
      );

      return this.createErrorResult(
        error instanceof Error ? error : new Error(String(error)),
        { eventType: event.type }
      );
    }
  }

  /**
   * Handles a CARE_APPOINTMENT_COMPLETED event.
   * 
   * @param event The appointment completed event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handleAppointmentCompleted(event: ICareEvent): Promise<IEventHandlerResult> {
    // Evaluate rules for appointment completion
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // Update user profile with completed appointment
    await this.profilesService.recordCompletedAppointment(
      event.userId,
      event.data.appointment.id,
      event.data.appointmentType,
      event.data.completionDate || new Date()
    );

    // Check for appointment-specific achievements
    const appointmentAchievements = await this.achievementsService.checkAppointmentAchievements(
      event.userId,
      event.data.appointmentType
    );
    
    // Send notifications for any appointment achievements
    for (const achievementId of appointmentAchievements) {
      await this.notificationService.sendAchievementNotification(
        event.userId,
        achievementId,
        { appointmentType: event.data.appointmentType }
      );
    }

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }

  /**
   * Handles a CARE_MEDICATION_ADHERENCE_STREAK event.
   * 
   * @param event The medication adherence streak event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handleMedicationAdherenceStreak(event: ICareEvent): Promise<IEventHandlerResult> {
    // Evaluate rules for medication adherence streak
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // Check for streak-based achievements
    if (event.data.streakDays >= 7) {
      const medicationStreakAchievements = await this.achievementsService.checkMedicationStreakAchievements(
        event.userId,
        event.data.streakDays
      );
      
      // Send notifications for any medication streak achievements
      for (const achievementId of medicationStreakAchievements) {
        await this.notificationService.sendAchievementNotification(
          event.userId,
          achievementId,
          { 
            streakDays: event.data.streakDays,
            adherencePercentage: event.data.adherencePercentage,
            medicationName: event.data.medicationName
          }
        );
      }
    }

    // Update user profile with medication adherence data
    await this.profilesService.updateMedicationAdherence(
      event.userId,
      event.data.medicationId,
      event.data.adherencePercentage,
      event.data.streakDays
    );

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }

  /**
   * Handles a CARE_TELEMEDICINE_SESSION_COMPLETED event.
   * 
   * @param event The telemedicine session completed event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handleTelemedicineSessionCompleted(event: ICareEvent): Promise<IEventHandlerResult> {
    // Evaluate rules for telemedicine session completion
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // Update user profile with completed telemedicine session
    await this.profilesService.recordTelemedicineSession(
      event.userId,
      event.data.sessionId,
      event.data.duration,
      event.data.startTime || new Date(),
      event.data.endTime || new Date()
    );

    // Check for telemedicine-specific achievements
    const telemedicineAchievements = await this.achievementsService.checkTelemedicineAchievements(
      event.userId,
      event.data.duration
    );
    
    // Send notifications for any telemedicine achievements
    for (const achievementId of telemedicineAchievements) {
      await this.notificationService.sendAchievementNotification(
        event.userId,
        achievementId,
        { duration: event.data.duration }
      );
    }

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }
}

/**
 * Handler for Plan journey events.
 * Processes events related to insurance claims, benefits, and plan management.
 */
@Injectable()
export class PlanJourneyHandler extends BaseJourneyHandler {
  constructor(
    protected readonly logger: LoggerService,
    protected readonly achievementsService: AchievementsService,
    protected readonly questsService: QuestsService,
    protected readonly rewardsService: RewardsService,
    protected readonly profilesService: ProfilesService,
    protected readonly rulesService: RulesService,
    protected readonly notificationService: NotificationService
  ) {
    super(logger, achievementsService, questsService, rewardsService, profilesService, rulesService, notificationService);
    this.logger.log('PlanJourneyHandler initialized', 'PlanJourneyHandler');
  }

  /**
   * Determines if this handler can process the given event.
   * 
   * @param event The event to check
   * @returns True if this is a plan journey event, false otherwise
   */
  canHandle(event: IJourneyEvent): boolean {
    return isPlanEvent(event);
  }

  /**
   * Processes a plan journey event.
   * 
   * @param event The plan event to process
   * @returns A promise that resolves with the result of the event processing
   */
  async handle(event: IJourneyEvent): Promise<IEventHandlerResult> {
    try {
      if (!isPlanEvent(event)) {
        throw new Error('Event is not a plan event');
      }

      const planEvent = event as IPlanEvent;
      this.logger.log(
        `Processing plan event: ${planEvent.type} for user: ${planEvent.userId}`,
        'PlanJourneyHandler'
      );

      // Apply specialized processing based on event type
      switch (planEvent.type) {
        case PlanEventType.CLAIM_APPROVED:
          return await this.handleClaimApproved(planEvent);

        case PlanEventType.BENEFIT_UTILIZED:
          return await this.handleBenefitUtilized(planEvent);

        case PlanEventType.PLAN_RENEWED:
          return await this.handlePlanRenewed(planEvent);

        default:
          // For other event types, use standard rule evaluation
          const ruleResults = await this.rulesService.evaluateRules(
            planEvent.userId,
            planEvent.type,
            planEvent.data
          );

          return await this.processRuleResults(planEvent.userId, ruleResults);
      }
    } catch (error) {
      this.logger.error(
        `Error processing plan event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        'PlanJourneyHandler'
      );

      return this.createErrorResult(
        error instanceof Error ? error : new Error(String(error)),
        { eventType: event.type }
      );
    }
  }

  /**
   * Handles a PLAN_CLAIM_APPROVED event.
   * 
   * @param event The claim approved event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handleClaimApproved(event: IPlanEvent): Promise<IEventHandlerResult> {
    // Evaluate rules for claim approval
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // Update user profile with approved claim
    await this.profilesService.recordApprovedClaim(
      event.userId,
      event.data.claimId,
      event.data.approvedAmount,
      event.data.processingDays
    );

    // Check for fast-processing achievement if claim was processed quickly
    if (event.data.processingDays <= 3) {
      const fastClaimAchievements = await this.achievementsService.checkFastClaimAchievements(
        event.userId,
        event.data.processingDays
      );
      
      // Send notifications for any fast claim processing achievements
      for (const achievementId of fastClaimAchievements) {
        await this.notificationService.sendAchievementNotification(
          event.userId,
          achievementId,
          { 
            processingDays: event.data.processingDays,
            claimId: event.data.claimId,
            approvedAmount: event.data.approvedAmount
          }
        );
      }
    }

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }

  /**
   * Handles a PLAN_BENEFIT_UTILIZED event.
   * 
   * @param event The benefit utilized event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handleBenefitUtilized(event: IPlanEvent): Promise<IEventHandlerResult> {
    // Evaluate rules for benefit utilization
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // Update user profile with utilized benefit
    await this.profilesService.recordBenefitUtilization(
      event.userId,
      event.data.benefit.id,
      event.data.amount || 0,
      event.data.remainingCoverage || 0,
      event.data.utilizationDate || new Date()
    );

    // Check for first-time benefit utilization achievement
    if (event.data.isFirstUtilization) {
      const benefitAchievements = await this.achievementsService.checkBenefitUtilizationAchievements(
        event.userId,
        event.data.benefit.id
      );
      
      // Send notifications for any benefit utilization achievements
      for (const achievementId of benefitAchievements) {
        await this.notificationService.sendAchievementNotification(
          event.userId,
          achievementId,
          { 
            benefitId: event.data.benefit.id,
            benefitName: event.data.benefit.name || 'Benefit',
            isFirstUtilization: true
          }
        );
      }
    }

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }

  /**
   * Handles a PLAN_PLAN_RENEWED event.
   * 
   * @param event The plan renewed event
   * @returns A promise that resolves with the result of the event processing
   */
  private async handlePlanRenewed(event: IPlanEvent): Promise<IEventHandlerResult> {
    // Evaluate rules for plan renewal
    const ruleResults = await this.rulesService.evaluateRules(
      event.userId,
      event.type,
      event.data
    );

    // Update user profile with renewed plan
    await this.profilesService.recordPlanRenewal(
      event.userId,
      event.data.planId,
      event.data.renewalDate || new Date(),
      event.data.newEndDate,
      event.data.consecutiveYears
    );

    // Check for loyalty achievements based on consecutive years
    if (event.data.consecutiveYears >= 2) {
      const loyaltyAchievements = await this.achievementsService.checkLoyaltyAchievements(
        event.userId,
        event.data.consecutiveYears
      );
      
      // Send notifications for any loyalty achievements
      for (const achievementId of loyaltyAchievements) {
        await this.notificationService.sendAchievementNotification(
          event.userId,
          achievementId,
          { 
            consecutiveYears: event.data.consecutiveYears,
            planName: event.data.planName,
            renewalDate: event.data.renewalDate
          }
        );
      }
    }

    // Process standard rule results
    return await this.processRuleResults(event.userId, ruleResults);
  }
}

/**
 * Factory for creating journey handlers.
 * Provides a centralized way to create handlers for different journey types.
 */
@Injectable()
export class JourneyHandlerFactory {
  private handlers: Map<string, IEventHandler<IJourneyEvent>> = new Map();

  constructor(
    private readonly healthHandler: HealthJourneyHandler,
    private readonly careHandler: CareJourneyHandler,
    private readonly planHandler: PlanJourneyHandler,
    private readonly logger: LoggerService
  ) {
    this.registerHandlers();
    this.logger.log('JourneyHandlerFactory initialized with 3 journey handlers', 'JourneyHandlerFactory');
  }

  /**
   * Registers all journey handlers.
   */
  private registerHandlers(): void {
    this.handlers.set('health', this.healthHandler);
    this.handlers.set('care', this.careHandler);
    this.handlers.set('plan', this.planHandler);
  }

  /**
   * Gets the appropriate handler for the given event.
   * 
   * @param event The event to get a handler for
   * @returns The appropriate handler for the event, or undefined if none is found
   */
  getHandler(event: IJourneyEvent): IEventHandler<IJourneyEvent> | undefined {
    // First try to get handler by journey type
    if (event.journey && this.handlers.has(event.journey)) {
      const handler = this.handlers.get(event.journey);
      this.logger.debug(
        `Found handler for journey type: ${event.journey}`,
        'JourneyHandlerFactory'
      );
      return handler;
    }

    // If no handler found by journey type, try to find one that can handle the event
    for (const handler of this.handlers.values()) {
      if (handler.canHandle(event)) {
        this.logger.debug(
          `Found handler by canHandle check for event type: ${event.type}`,
          'JourneyHandlerFactory'
        );
        return handler;
      }
    }

    this.logger.warn(
      `No handler found for event: ${JSON.stringify(event)}`,
      'JourneyHandlerFactory'
    );
    return undefined;
  }
  
  /**
   * Gets all registered handlers.
   * 
   * @returns An array of all registered handlers
   */
  getAllHandlers(): IEventHandler<IJourneyEvent>[] {
    return Array.from(this.handlers.values());
  }
}