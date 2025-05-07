import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../../../common/kafka';
import { LoggerService } from '@app/shared/logging/logger.service';
import { LOGGER_SERVICE } from '@app/shared/logging/logger.constants';
import { AchievementsService } from '../achievements.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { TracingService } from '@app/shared/tracing/tracing.service';

// Import interfaces from @austa/interfaces package
import { 
  GamificationEvent, 
  EventType,
  PlanClaimSubmissionPayload,
  PlanBenefitUtilizationPayload,
  PlanSelectionPayload,
  PlanRewardRedemptionPayload
} from '@austa/interfaces/gamification/events';
import { Journey } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Kafka consumer that processes achievement-related events from the Plan Journey service.
 * Handles claim submissions, benefit utilization, plan selection/comparison, and reward redemption events.
 * Extends BaseConsumer with plan-specific event processing logic.
 * 
 * This consumer is responsible for:
 * - Processing claim submission events
 * - Tracking benefit utilization
 * - Handling plan selection and comparison events
 * - Processing reward redemption events
 */
@Injectable()
export class PlanJourneyConsumer implements OnModuleDestroy {
  private readonly consumerGroup: string;
  private readonly topics: string[];
  private readonly dlqEnabled: boolean;
  private readonly maxRetries: number;
  private connected = false;

  /**
   * Constructor initializes the Plan Journey consumer with necessary dependencies
   * and configuration settings from the environment.
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    private readonly achievementsService: AchievementsService,
    private readonly profilesService: ProfilesService,
    private readonly tracingService: TracingService,
    @Inject(LOGGER_SERVICE) private readonly logger: LoggerService,
  ) {
    // Get consumer configuration from environment
    this.consumerGroup = this.configService.get<string>('KAFKA_CONSUMER_GROUP', 'gamification-achievements-consumers');
    this.topics = this.configService.get<string[]>('KAFKA_PLAN_TOPICS', [
      'plan-claims',
      'plan-benefits',
      'plan-selection',
      'plan-rewards',
    ]);
    this.dlqEnabled = this.configService.get<boolean>('KAFKA_DLQ_ENABLED', true);
    this.maxRetries = this.configService.get<number>('KAFKA_DLQ_MAX_RETRIES', 3);

    this.logger.log(
      'Initialized Plan Journey Consumer',
      {
        topics: this.topics,
        consumerGroup: this.consumerGroup,
        dlqEnabled: this.dlqEnabled,
        maxRetries: this.maxRetries,
      },
      'PlanJourneyConsumer',
    );
  }

  /**
   * Connects the consumer to Kafka and subscribes to the configured topics.
   * Sets up message handlers for each topic with proper error handling and DLQ support.
   */
  async connect(): Promise<void> {
    try {
      this.logger.log('Connecting Plan Journey consumer to Kafka...', {}, 'PlanJourneyConsumer');

      // Create a consumer instance with the configured group ID
      const consumer = this.kafkaService.createConsumer({
        groupId: this.consumerGroup,
        allowAutoTopicCreation: false,
      });

      // Subscribe to all plan journey topics
      await consumer.subscribe({ topics: this.topics });

      // Set up the message handler with tracing and error handling
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          // Create a new trace span for this message
          const span = this.tracingService.createSpan('process_plan_journey_event', {
            'messaging.system': 'kafka',
            'messaging.destination': topic,
            'messaging.destination_kind': 'topic',
            'messaging.kafka.partition': partition,
            'messaging.kafka.offset': message.offset,
          });

          try {
            // Parse the message value as JSON
            const messageValue = message.value?.toString();
            if (!messageValue) {
              this.logger.warn('Received empty message from Plan Journey', { topic }, 'PlanJourneyConsumer');
              return;
            }

            const event: GamificationEvent = JSON.parse(messageValue);
            
            // Add event details to the trace span
            span.setAttributes({
              'event.type': event.type,
              'event.id': event.id,
              'event.user_id': event.userId,
            });

            this.logger.log(
              `Processing Plan Journey event: ${event.type}`,
              {
                eventId: event.id,
                userId: event.userId,
                topic,
              },
              'PlanJourneyConsumer',
            );

            // Process the event based on its type
            await this.processEvent(event);

            this.logger.log(
              `Successfully processed Plan Journey event: ${event.type}`,
              {
                eventId: event.id,
                userId: event.userId,
                topic,
              },
              'PlanJourneyConsumer',
            );
          } catch (error) {
            // Log the error and add it to the trace span
            this.logger.error(
              'Error processing Plan Journey event',
              {
                error: error.message,
                stack: error.stack,
                topic,
                partition,
                offset: message.offset,
              },
              'PlanJourneyConsumer',
            );

            span.setStatus({
              code: 2, // ERROR
              message: error.message,
            });

            // Handle DLQ logic if enabled
            if (this.dlqEnabled) {
              const retryCount = parseInt(message.headers?.['retry-count']?.toString() || '0', 10);
              
              if (retryCount < this.maxRetries) {
                // Retry the message with an incremented retry count
                await this.kafkaService.sendToDLQ(topic, {
                  ...message,
                  headers: {
                    ...message.headers,
                    'retry-count': Buffer.from((retryCount + 1).toString()),
                    'error-message': Buffer.from(error.message),
                    'timestamp': Buffer.from(Date.now().toString()),
                  },
                });
                
                this.logger.log(
                  `Sent failed message to DLQ for retry (${retryCount + 1}/${this.maxRetries})`,
                  {
                    topic,
                    partition,
                    offset: message.offset,
                    retryCount: retryCount + 1,
                  },
                  'PlanJourneyConsumer',
                );
              } else {
                this.logger.error(
                  `Message exceeded maximum retry attempts (${this.maxRetries})`,
                  {
                    topic,
                    partition,
                    offset: message.offset,
                    retryCount,
                  },
                  'PlanJourneyConsumer',
                );
              }
            }

            // Re-throw the error to prevent committing the offset for this message
            throw error;
          } finally {
            // End the trace span
            span.end();
          }
        },
      });

      this.connected = true;
      this.logger.log(
        'Plan Journey consumer connected and subscribed to topics',
        { topics: this.topics },
        'PlanJourneyConsumer',
      );
    } catch (error) {
      this.logger.error(
        'Failed to connect Plan Journey consumer',
        {
          error: error.message,
          stack: error.stack,
        },
        'PlanJourneyConsumer',
      );
      throw error;
    }
  }

  /**
   * Processes a gamification event from the Plan Journey service.
   * Routes the event to the appropriate handler based on its type.
   * 
   * @param event The gamification event to process
   */
  private async processEvent(event: GamificationEvent): Promise<void> {
    switch (event.type) {
      case EventType.PLAN_CLAIM_SUBMISSION:
        await this.processClaimSubmissionEvent(event);
        break;
      case EventType.PLAN_BENEFIT_UTILIZATION:
        await this.processBenefitUtilizationEvent(event);
        break;
      case EventType.PLAN_SELECTION:
        await this.processPlanSelectionEvent(event);
        break;
      case EventType.PLAN_REWARD_REDEMPTION:
        await this.processRewardRedemptionEvent(event);
        break;
      default:
        this.logger.warn(
          `Unhandled Plan Journey event type: ${event.type}`,
          {
            eventId: event.id,
            userId: event.userId,
          },
          'PlanJourneyConsumer',
        );
    }
  }

  /**
   * Processes a claim submission event from the Plan Journey.
   * Unlocks achievements related to submitting claims and awards XP.
   * 
   * @param event The claim submission event
   */
  private async processClaimSubmissionEvent(event: GamificationEvent): Promise<void> {
    try {
      const payload = event.payload as PlanClaimSubmissionPayload;
      
      this.logger.log(
        'Processing claim submission event',
        {
          eventId: event.id,
          userId: event.userId,
          claimId: payload.claimId,
          claimAmount: payload.amount,
          claimType: payload.claimType,
        },
        'PlanJourneyConsumer',
      );

      // Get the user's game profile
      const profile = await this.profilesService.findByUserId(event.userId);
      if (!profile) {
        this.logger.warn(
          'User profile not found for claim submission event',
          {
            eventId: event.id,
            userId: event.userId,
          },
          'PlanJourneyConsumer',
        );
        return;
      }

      // Track the total number of claims submitted by the user
      const claimsSubmittedCount = await this.profilesService.incrementMetric(
        profile.id,
        'claims_submitted_count',
        1,
      );

      // Award XP for submitting a claim
      await this.profilesService.awardXP(profile.id, 10, {
        source: 'claim_submission',
        eventId: event.id,
        metadata: {
          claimId: payload.claimId,
          claimType: payload.claimType,
        },
      });

      // Check for and unlock achievements based on claim submission
      // First Claim achievement
      if (claimsSubmittedCount === 1) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'FIRST_CLAIM_SUBMITTED',
          100, // 100% progress
          {
            eventId: event.id,
            metadata: {
              claimId: payload.claimId,
              claimType: payload.claimType,
            },
          },
        );
      }

      // Claim Milestone achievements
      if (claimsSubmittedCount === 5) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'FIVE_CLAIMS_SUBMITTED',
          100,
          {
            eventId: event.id,
            metadata: {
              claimsSubmittedCount,
            },
          },
        );
      } else if (claimsSubmittedCount === 10) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'TEN_CLAIMS_SUBMITTED',
          100,
          {
            eventId: event.id,
            metadata: {
              claimsSubmittedCount,
            },
          },
        );
      } else if (claimsSubmittedCount === 25) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'TWENTY_FIVE_CLAIMS_SUBMITTED',
          100,
          {
            eventId: event.id,
            metadata: {
              claimsSubmittedCount,
            },
          },
        );
      }

      // Check for high-value claim achievement
      if (payload.amount >= 1000) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'HIGH_VALUE_CLAIM_SUBMITTED',
          100,
          {
            eventId: event.id,
            metadata: {
              claimId: payload.claimId,
              claimAmount: payload.amount,
            },
          },
        );
      }

      // Update progress on the claim master achievement (requires 50 claims)
      const claimMasterProgress = Math.min(Math.floor((claimsSubmittedCount / 50) * 100), 100);
      await this.achievementsService.updateAchievementProgress(
        profile.id,
        'CLAIM_MASTER',
        claimMasterProgress,
        {
          eventId: event.id,
          metadata: {
            claimsSubmittedCount,
            progress: claimMasterProgress,
          },
        },
      );

      this.logger.log(
        'Successfully processed claim submission event',
        {
          eventId: event.id,
          userId: event.userId,
          profileId: profile.id,
          claimsSubmittedCount,
        },
        'PlanJourneyConsumer',
      );
    } catch (error) {
      this.logger.error(
        'Error processing claim submission event',
        {
          eventId: event.id,
          userId: event.userId,
          error: error.message,
          stack: error.stack,
        },
        'PlanJourneyConsumer',
      );
      throw error;
    }
  }

  /**
   * Processes a benefit utilization event from the Plan Journey.
   * Unlocks achievements related to using benefits and awards XP.
   * 
   * @param event The benefit utilization event
   */
  private async processBenefitUtilizationEvent(event: GamificationEvent): Promise<void> {
    try {
      const payload = event.payload as PlanBenefitUtilizationPayload;
      
      this.logger.log(
        'Processing benefit utilization event',
        {
          eventId: event.id,
          userId: event.userId,
          benefitId: payload.benefitId,
          benefitType: payload.benefitType,
        },
        'PlanJourneyConsumer',
      );

      // Get the user's game profile
      const profile = await this.profilesService.findByUserId(event.userId);
      if (!profile) {
        this.logger.warn(
          'User profile not found for benefit utilization event',
          {
            eventId: event.id,
            userId: event.userId,
          },
          'PlanJourneyConsumer',
        );
        return;
      }

      // Track the total number of benefits utilized by the user
      const benefitsUtilizedCount = await this.profilesService.incrementMetric(
        profile.id,
        'benefits_utilized_count',
        1,
      );

      // Track unique benefit types utilized
      const uniqueBenefitTypes = await this.profilesService.addToSet(
        profile.id,
        'unique_benefit_types',
        payload.benefitType,
      );

      // Award XP for utilizing a benefit
      await this.profilesService.awardXP(profile.id, 15, {
        source: 'benefit_utilization',
        eventId: event.id,
        metadata: {
          benefitId: payload.benefitId,
          benefitType: payload.benefitType,
        },
      });

      // Check for and unlock achievements based on benefit utilization
      // First Benefit achievement
      if (benefitsUtilizedCount === 1) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'FIRST_BENEFIT_UTILIZED',
          100, // 100% progress
          {
            eventId: event.id,
            metadata: {
              benefitId: payload.benefitId,
              benefitType: payload.benefitType,
            },
          },
        );
      }

      // Benefit Diversity achievement - using 3 different benefit types
      if (uniqueBenefitTypes.length >= 3) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'BENEFIT_DIVERSITY',
          100,
          {
            eventId: event.id,
            metadata: {
              uniqueBenefitTypes,
            },
          },
        );
      }

      // Benefit Milestone achievements
      if (benefitsUtilizedCount === 5) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'FIVE_BENEFITS_UTILIZED',
          100,
          {
            eventId: event.id,
            metadata: {
              benefitsUtilizedCount,
            },
          },
        );
      } else if (benefitsUtilizedCount === 10) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'TEN_BENEFITS_UTILIZED',
          100,
          {
            eventId: event.id,
            metadata: {
              benefitsUtilizedCount,
            },
          },
        );
      }

      // Update progress on the benefit master achievement (requires 25 benefit utilizations)
      const benefitMasterProgress = Math.min(Math.floor((benefitsUtilizedCount / 25) * 100), 100);
      await this.achievementsService.updateAchievementProgress(
        profile.id,
        'BENEFIT_MASTER',
        benefitMasterProgress,
        {
          eventId: event.id,
          metadata: {
            benefitsUtilizedCount,
            progress: benefitMasterProgress,
          },
        },
      );

      this.logger.log(
        'Successfully processed benefit utilization event',
        {
          eventId: event.id,
          userId: event.userId,
          profileId: profile.id,
          benefitsUtilizedCount,
          uniqueBenefitTypesCount: uniqueBenefitTypes.length,
        },
        'PlanJourneyConsumer',
      );
    } catch (error) {
      this.logger.error(
        'Error processing benefit utilization event',
        {
          eventId: event.id,
          userId: event.userId,
          error: error.message,
          stack: error.stack,
        },
        'PlanJourneyConsumer',
      );
      throw error;
    }
  }

  /**
   * Processes a plan selection event from the Plan Journey.
   * Unlocks achievements related to selecting and comparing plans.
   * 
   * @param event The plan selection event
   */
  private async processPlanSelectionEvent(event: GamificationEvent): Promise<void> {
    try {
      const payload = event.payload as PlanSelectionPayload;
      
      this.logger.log(
        'Processing plan selection event',
        {
          eventId: event.id,
          userId: event.userId,
          planId: payload.planId,
          isComparison: payload.isComparison,
        },
        'PlanJourneyConsumer',
      );

      // Get the user's game profile
      const profile = await this.profilesService.findByUserId(event.userId);
      if (!profile) {
        this.logger.warn(
          'User profile not found for plan selection event',
          {
            eventId: event.id,
            userId: event.userId,
          },
          'PlanJourneyConsumer',
        );
        return;
      }

      // Track metrics based on whether this is a comparison or selection
      if (payload.isComparison) {
        // Track the total number of plan comparisons by the user
        const plansComparedCount = await this.profilesService.incrementMetric(
          profile.id,
          'plans_compared_count',
          1,
        );

        // Award XP for comparing plans
        await this.profilesService.awardXP(profile.id, 5, {
          source: 'plan_comparison',
          eventId: event.id,
          metadata: {
            planId: payload.planId,
          },
        });

        // Check for and unlock achievements based on plan comparisons
        if (plansComparedCount === 3) {
          await this.achievementsService.unlockAchievement(
            profile.id,
            'PLAN_RESEARCHER',
            100,
            {
              eventId: event.id,
              metadata: {
                plansComparedCount,
              },
            },
          );
        } else if (plansComparedCount === 10) {
          await this.achievementsService.unlockAchievement(
            profile.id,
            'PLAN_EXPERT',
            100,
            {
              eventId: event.id,
              metadata: {
                plansComparedCount,
              },
            },
          );
        }
      } else {
        // Track the total number of plan selections by the user
        const plansSelectedCount = await this.profilesService.incrementMetric(
          profile.id,
          'plans_selected_count',
          1,
        );

        // Track unique plans selected
        const uniquePlansSelected = await this.profilesService.addToSet(
          profile.id,
          'unique_plans_selected',
          payload.planId,
        );

        // Award XP for selecting a plan
        await this.profilesService.awardXP(profile.id, 20, {
          source: 'plan_selection',
          eventId: event.id,
          metadata: {
            planId: payload.planId,
          },
        });

        // Check for and unlock achievements based on plan selections
        // First Plan achievement
        if (plansSelectedCount === 1) {
          await this.achievementsService.unlockAchievement(
            profile.id,
            'FIRST_PLAN_SELECTED',
            100,
            {
              eventId: event.id,
              metadata: {
                planId: payload.planId,
              },
            },
          );
        }

        // Plan Explorer achievement - selecting 3 different plans
        if (uniquePlansSelected.length >= 3) {
          await this.achievementsService.unlockAchievement(
            profile.id,
            'PLAN_EXPLORER',
            100,
            {
              eventId: event.id,
              metadata: {
                uniquePlansSelected,
              },
            },
          );
        }
      }

      // Cross-journey achievement check - if user has activity in all three journeys
      const hasHealthActivity = await this.profilesService.hasMetric(profile.id, 'health_metrics_recorded_count');
      const hasCareActivity = await this.profilesService.hasMetric(profile.id, 'appointments_booked_count');
      
      if (hasHealthActivity && hasCareActivity) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'JOURNEY_EXPLORER',
          100,
          {
            eventId: event.id,
            metadata: {
              journeys: [Journey.HEALTH, Journey.CARE, Journey.PLAN],
            },
          },
        );
      }

      this.logger.log(
        'Successfully processed plan selection event',
        {
          eventId: event.id,
          userId: event.userId,
          profileId: profile.id,
          isComparison: payload.isComparison,
        },
        'PlanJourneyConsumer',
      );
    } catch (error) {
      this.logger.error(
        'Error processing plan selection event',
        {
          eventId: event.id,
          userId: event.userId,
          error: error.message,
          stack: error.stack,
        },
        'PlanJourneyConsumer',
      );
      throw error;
    }
  }

  /**
   * Processes a reward redemption event from the Plan Journey.
   * Unlocks achievements related to redeeming rewards and awards XP.
   * 
   * @param event The reward redemption event
   */
  private async processRewardRedemptionEvent(event: GamificationEvent): Promise<void> {
    try {
      const payload = event.payload as PlanRewardRedemptionPayload;
      
      this.logger.log(
        'Processing reward redemption event',
        {
          eventId: event.id,
          userId: event.userId,
          rewardId: payload.rewardId,
          rewardType: payload.rewardType,
          rewardValue: payload.value,
        },
        'PlanJourneyConsumer',
      );

      // Get the user's game profile
      const profile = await this.profilesService.findByUserId(event.userId);
      if (!profile) {
        this.logger.warn(
          'User profile not found for reward redemption event',
          {
            eventId: event.id,
            userId: event.userId,
          },
          'PlanJourneyConsumer',
        );
        return;
      }

      // Track the total number of rewards redeemed by the user
      const rewardsRedeemedCount = await this.profilesService.incrementMetric(
        profile.id,
        'rewards_redeemed_count',
        1,
      );

      // Track the total value of rewards redeemed
      const totalRewardValue = await this.profilesService.incrementMetric(
        profile.id,
        'total_reward_value',
        payload.value,
      );

      // Track unique reward types redeemed
      const uniqueRewardTypes = await this.profilesService.addToSet(
        profile.id,
        'unique_reward_types',
        payload.rewardType,
      );

      // Award XP for redeeming a reward
      await this.profilesService.awardXP(profile.id, 25, {
        source: 'reward_redemption',
        eventId: event.id,
        metadata: {
          rewardId: payload.rewardId,
          rewardType: payload.rewardType,
          rewardValue: payload.value,
        },
      });

      // Check for and unlock achievements based on reward redemption
      // First Reward achievement
      if (rewardsRedeemedCount === 1) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'FIRST_REWARD_REDEEMED',
          100,
          {
            eventId: event.id,
            metadata: {
              rewardId: payload.rewardId,
              rewardType: payload.rewardType,
            },
          },
        );
      }

      // Reward Milestone achievements
      if (rewardsRedeemedCount === 5) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'FIVE_REWARDS_REDEEMED',
          100,
          {
            eventId: event.id,
            metadata: {
              rewardsRedeemedCount,
            },
          },
        );
      } else if (rewardsRedeemedCount === 10) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'TEN_REWARDS_REDEEMED',
          100,
          {
            eventId: event.id,
            metadata: {
              rewardsRedeemedCount,
            },
          },
        );
      }

      // Reward Diversity achievement - redeeming 3 different reward types
      if (uniqueRewardTypes.length >= 3) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'REWARD_DIVERSITY',
          100,
          {
            eventId: event.id,
            metadata: {
              uniqueRewardTypes,
            },
          },
        );
      }

      // High Value Rewards achievement - redeeming rewards worth at least 500 in total
      if (totalRewardValue >= 500) {
        await this.achievementsService.unlockAchievement(
          profile.id,
          'HIGH_VALUE_REWARDS',
          100,
          {
            eventId: event.id,
            metadata: {
              totalRewardValue,
            },
          },
        );
      }

      // Update progress on the reward master achievement (requires 25 reward redemptions)
      const rewardMasterProgress = Math.min(Math.floor((rewardsRedeemedCount / 25) * 100), 100);
      await this.achievementsService.updateAchievementProgress(
        profile.id,
        'REWARD_MASTER',
        rewardMasterProgress,
        {
          eventId: event.id,
          metadata: {
            rewardsRedeemedCount,
            progress: rewardMasterProgress,
          },
        },
      );

      this.logger.log(
        'Successfully processed reward redemption event',
        {
          eventId: event.id,
          userId: event.userId,
          profileId: profile.id,
          rewardsRedeemedCount,
          totalRewardValue,
          uniqueRewardTypesCount: uniqueRewardTypes.length,
        },
        'PlanJourneyConsumer',
      );
    } catch (error) {
      this.logger.error(
        'Error processing reward redemption event',
        {
          eventId: event.id,
          userId: event.userId,
          error: error.message,
          stack: error.stack,
        },
        'PlanJourneyConsumer',
      );
      throw error;
    }
  }

  /**
   * Lifecycle hook that runs when the module is destroyed.
   * Disconnects the consumer from Kafka to ensure clean shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    if (this.connected) {
      try {
        this.logger.log('Disconnecting Plan Journey consumer...', {}, 'PlanJourneyConsumer');
        await this.kafkaService.disconnect();
        this.logger.log('Plan Journey consumer disconnected successfully', {}, 'PlanJourneyConsumer');
      } catch (error) {
        this.logger.error(
          'Error disconnecting Plan Journey consumer',
          {
            error: error.message,
            stack: error.stack,
          },
          'PlanJourneyConsumer',
        );
      }
    }
  }
}