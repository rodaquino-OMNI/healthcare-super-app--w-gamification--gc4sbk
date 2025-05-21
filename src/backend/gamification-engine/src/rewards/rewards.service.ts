import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@austa/database';
import { ProfilesService } from '../profiles/profiles.service';
import { EventsService } from '@austa/events';
import { AchievementsService } from '../achievements/achievements.service';
import { Reward, UserReward } from '@austa/interfaces/gamification';
import { RewardNotFoundException, RewardCreationException, RewardGrantException } from './exceptions/rewards.exceptions';
import { FilterDto } from '@austa/interfaces/common/dto';
import { Prisma } from '@prisma/client';
import { retry } from '@austa/utils';

/**
 * Service for managing rewards.
 * Handles the business logic for managing rewards within the gamification engine.
 * It provides methods for creating, retrieving, and distributing rewards to users
 * based on their achievements and progress.
 */
@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  /**
   * Injects the required services.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly eventsService: EventsService,
    private readonly achievementsService: AchievementsService,
    private readonly configService: ConfigService
  ) {
    this.maxRetries = this.configService.get<number>('REWARD_MAX_RETRIES', 3);
    this.retryDelay = this.configService.get<number>('REWARD_RETRY_DELAY_MS', 1000);
  }

  /**
   * Creates a new reward.
   * @param rewardData The reward data to create
   * @returns A promise that resolves to the created reward.
   * @throws {RewardCreationException} If the reward creation fails
   */
  async create(rewardData: Omit<Reward, 'id'>): Promise<Reward> {
    try {
      this.logger.log(`Creating new reward: ${rewardData.title}`);
      
      const reward = await this.prisma.reward.create({
        data: rewardData,
      });
      
      return reward;
    } catch (error) {
      this.logger.error(
        `Failed to create reward: ${error.message}`,
        error.stack
      );
      throw new RewardCreationException(error, { rewardData });
    }
  }

  /**
   * Retrieves all rewards with optional filtering.
   * @param filterDto Optional filter parameters
   * @returns A promise that resolves to an array of rewards.
   */
  async findAll(filterDto?: FilterDto): Promise<Reward[]> {
    try {
      this.logger.log('Retrieving all rewards');
      
      const where: Prisma.RewardWhereInput = {};
      
      // Apply journey filter if provided
      if (filterDto?.journey) {
        where.journey = filterDto.journey;
      }
      
      // Apply search filter if provided
      if (filterDto?.search) {
        where.OR = [
          { title: { contains: filterDto.search, mode: 'insensitive' } },
          { description: { contains: filterDto.search, mode: 'insensitive' } },
        ];
      }
      
      const rewards = await this.prisma.reward.findMany({
        where,
        orderBy: { title: 'asc' },
      });
      
      return rewards;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve rewards: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Retrieves a single reward by its ID.
   * @param id The reward ID to find
   * @returns A promise that resolves to a single reward.
   * @throws {RewardNotFoundException} If the reward is not found
   */
  async findOne(id: string): Promise<Reward> {
    try {
      this.logger.log(`Retrieving reward with ID: ${id}`);
      
      const reward = await this.prisma.reward.findUnique({
        where: { id },
      });
      
      if (!reward) {
        this.logger.warn(`Reward with ID ${id} not found`);
        throw new RewardNotFoundException(id);
      }
      
      return reward;
    } catch (error) {
      if (error instanceof RewardNotFoundException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to retrieve reward with ID ${id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Grants a reward to a user with transaction support for atomicity.
   * @param userId The ID of the user to grant the reward to
   * @param rewardId The ID of the reward to grant
   * @returns A promise that resolves to the granted user reward.
   * @throws {RewardGrantException} If the reward granting fails
   */
  async grantReward(userId: string, rewardId: string): Promise<UserReward> {
    return retry(
      async () => {
        try {
          this.logger.log(`Granting reward ${rewardId} to user ${userId}`);
          
          // Use a transaction to ensure atomicity
          return await this.prisma.$transaction(async (tx) => {
            // Get user profile
            const profile = await this.profilesService.findById(userId, tx);
            
            // Get reward
            const reward = await tx.reward.findUnique({
              where: { id: rewardId },
            });
            
            if (!reward) {
              throw new RewardNotFoundException(rewardId);
            }
            
            // Check if user already has this reward
            const existingUserReward = await tx.userReward.findFirst({
              where: {
                profileId: profile.id,
                rewardId: reward.id,
              },
            });
            
            if (existingUserReward) {
              this.logger.log(`User ${userId} already has reward ${rewardId}`);
              return existingUserReward as UserReward;
            }
            
            // Create user reward
            const userReward = await tx.userReward.create({
              data: {
                profileId: profile.id,
                rewardId: reward.id,
                earnedAt: new Date(),
              },
              include: {
                profile: true,
                reward: true,
              },
            });
            
            // Update user XP if reward grants XP
            if (reward.xpReward > 0) {
              await this.profilesService.addXp(userId, reward.xpReward, tx);
            }
            
            // Publish event for notification and other systems
            await this.eventsService.publishRewardGranted({
              userId,
              rewardId: reward.id,
              rewardTitle: reward.title,
              xpReward: reward.xpReward,
              journey: reward.journey,
              timestamp: new Date().toISOString(),
            });
            
            this.logger.log(`Successfully granted reward ${reward.title} to user ${userId}`);
            
            return userReward as UserReward;
          });
        } catch (error) {
          if (error instanceof RewardNotFoundException) {
            throw error; // Don't retry if reward doesn't exist
          }
          
          this.logger.error(
            `Failed to grant reward ${rewardId} to user ${userId}: ${error.message}`,
            error.stack
          );
          throw new RewardGrantException(error, { userId, rewardId });
        }
      },
      {
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay,
        shouldRetry: (error) => !(error instanceof RewardNotFoundException),
      }
    );
  }

  /**
   * Grants rewards to a user based on an achievement.
   * @param userId The ID of the user to grant rewards to
   * @param achievementId The ID of the achievement that triggered the rewards
   * @returns A promise that resolves to an array of granted user rewards.
   */
  async grantAchievementRewards(userId: string, achievementId: string): Promise<UserReward[]> {
    try {
      this.logger.log(`Granting rewards for achievement ${achievementId} to user ${userId}`);
      
      // Get the achievement to determine which rewards to grant
      const achievement = await this.achievementsService.findOne(achievementId);
      
      // Find rewards associated with this achievement
      const rewards = await this.prisma.reward.findMany({
        where: {
          OR: [
            { journey: achievement.journey }, // Journey-specific rewards
            { journey: 'global' }, // Global rewards that apply to all journeys
          ],
          // Additional filtering could be added here based on achievement criteria
        },
      });
      
      if (rewards.length === 0) {
        this.logger.log(`No rewards found for achievement ${achievementId}`);
        return [];
      }
      
      // Grant each reward to the user
      const userRewards = await Promise.all(
        rewards.map(reward => this.grantReward(userId, reward.id))
      );
      
      this.logger.log(`Successfully granted ${userRewards.length} rewards for achievement ${achievementId} to user ${userId}`);
      
      return userRewards;
    } catch (error) {
      this.logger.error(
        `Failed to grant rewards for achievement ${achievementId} to user ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Retrieves all rewards earned by a specific user.
   * @param userId The ID of the user
   * @param filterDto Optional filter parameters
   * @returns A promise that resolves to an array of user rewards.
   */
  async findUserRewards(userId: string, filterDto?: FilterDto): Promise<UserReward[]> {
    try {
      this.logger.log(`Retrieving rewards for user ${userId}`);
      
      const where: Prisma.UserRewardWhereInput = {
        profile: { userId },
      };
      
      // Apply journey filter if provided
      if (filterDto?.journey) {
        where.reward = { journey: filterDto.journey };
      }
      
      const userRewards = await this.prisma.userReward.findMany({
        where,
        include: {
          reward: true,
          profile: true,
        },
        orderBy: { earnedAt: 'desc' },
      });
      
      return userRewards as UserReward[];
    } catch (error) {
      this.logger.error(
        `Failed to retrieve rewards for user ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}