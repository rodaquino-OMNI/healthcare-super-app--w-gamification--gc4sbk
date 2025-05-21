import { Injectable, Logger } from '@nestjs/common';
import { AchievementsService } from '../achievements.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { EventType } from '@austa/interfaces/gamification';
import { IEventPayload } from '@austa/interfaces/gamification';
import { IPlanEvent } from '@austa/interfaces/gamification';
import { BaseConsumer } from './base.consumer';

/**
 * Consumer that processes achievement-related events from the Plan Journey service.
 * Handles claim submissions, benefit utilization, plan selection/comparison, and reward redemption events.
 */
@Injectable()
export class PlanJourneyConsumer extends BaseConsumer {
  private readonly logger = new Logger(PlanJourneyConsumer.name);

  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly profilesService: ProfilesService,
  ) {
    super();
  }

  /**
   * Process events from the Plan Journey service
   * @param payload The event payload
   * @returns Promise resolving to the processing result
   */
  async processEvent(payload: IEventPayload): Promise<boolean> {
    this.logger.debug(`Processing plan journey event: ${payload.eventType}`);
    
    try {
      const planEvent = payload as IPlanEvent;
      
      switch (planEvent.eventType) {
        case EventType.CLAIM_SUBMITTED:
          return await this.processClaimSubmission(planEvent);
        case EventType.BENEFIT_USED:
          return await this.processBenefitUtilization(planEvent);
        case EventType.PLAN_SELECTED:
        case EventType.PLAN_COMPARED:
          return await this.processPlanSelection(planEvent);
        case EventType.REWARD_REDEEMED:
          return await this.processRewardRedemption(planEvent);
        default:
          this.logger.warn(`Unhandled plan journey event type: ${planEvent.eventType}`);
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Error processing plan journey event: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Process claim submission events
   * @param event The claim submission event
   * @returns Promise resolving to the processing result
   */
  private async processClaimSubmission(event: IPlanEvent): Promise<boolean> {
    this.logger.debug(
      `Processing claim submission for user ${event.userId}, claim ID: ${event.payload.claimId}`,
    );

    try {
      // Award XP for submitting a claim
      await this.profilesService.awardExperiencePoints(event.userId, 25);

      // Check for achievements related to claim submission
      await this.achievementsService.checkAndUnlockAchievements({
        userId: event.userId,
        journeyType: 'plan',
        actionType: 'claim_submission',
        metadata: {
          claimId: event.payload.claimId,
          claimType: event.payload.claimType,
          claimAmount: event.payload.claimAmount,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process claim submission: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Process benefit utilization events
   * @param event The benefit utilization event
   * @returns Promise resolving to the processing result
   */
  private async processBenefitUtilization(event: IPlanEvent): Promise<boolean> {
    this.logger.debug(
      `Processing benefit utilization for user ${event.userId}, benefit ID: ${event.payload.benefitId}`,
    );

    try {
      // Award XP for using a benefit
      await this.profilesService.awardExperiencePoints(event.userId, 15);

      // Check for achievements related to benefit utilization
      await this.achievementsService.checkAndUnlockAchievements({
        userId: event.userId,
        journeyType: 'plan',
        actionType: 'benefit_utilization',
        metadata: {
          benefitId: event.payload.benefitId,
          benefitType: event.payload.benefitType,
          utilizationDate: event.payload.utilizationDate,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process benefit utilization: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Process plan selection and comparison events
   * @param event The plan selection or comparison event
   * @returns Promise resolving to the processing result
   */
  private async processPlanSelection(event: IPlanEvent): Promise<boolean> {
    const actionType = event.eventType === EventType.PLAN_SELECTED 
      ? 'plan_selection' 
      : 'plan_comparison';
    
    this.logger.debug(
      `Processing ${actionType} for user ${event.userId}, plan ID: ${event.payload.planId}`,
    );

    try {
      // Award XP based on the action type
      const xpAmount = event.eventType === EventType.PLAN_SELECTED ? 30 : 10;
      await this.profilesService.awardExperiencePoints(event.userId, xpAmount);

      // Check for achievements related to plan selection or comparison
      await this.achievementsService.checkAndUnlockAchievements({
        userId: event.userId,
        journeyType: 'plan',
        actionType,
        metadata: {
          planId: event.payload.planId,
          planType: event.payload.planType,
          planProvider: event.payload.planProvider,
          comparedPlans: event.payload.comparedPlans,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process ${actionType}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Process reward redemption events
   * @param event The reward redemption event
   * @returns Promise resolving to the processing result
   */
  private async processRewardRedemption(event: IPlanEvent): Promise<boolean> {
    this.logger.debug(
      `Processing reward redemption for user ${event.userId}, reward ID: ${event.payload.rewardId}`,
    );

    try {
      // No XP for redeeming rewards to prevent circular rewards
      
      // Check for achievements related to reward redemption
      await this.achievementsService.checkAndUnlockAchievements({
        userId: event.userId,
        journeyType: 'plan',
        actionType: 'reward_redemption',
        metadata: {
          rewardId: event.payload.rewardId,
          rewardType: event.payload.rewardType,
          redemptionDate: event.payload.redemptionDate,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process reward redemption: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}