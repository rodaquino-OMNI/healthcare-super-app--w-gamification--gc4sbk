import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reward } from '@app/gamification/rewards/entities/reward.entity';
import { UserReward } from '@app/gamification/rewards/entities/user-reward.entity';
import { ProfilesService } from '@app/gamification/profiles/profiles.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { PrismaService } from '@app/shared/database/prisma.service';
import { TransactionService } from '@app/shared/database/transactions/transaction.service';
import { FilterRewardDto } from '@app/gamification/rewards/dto/filter-reward.dto';
import { RewardEventPayload } from '@app/gamification/rewards/interfaces/reward-event.interface';
import { AchievementsService } from '@app/gamification/achievements/achievements.service';
import { AppException, ErrorType } from '@app/shared/errors/exceptions.types';
import { Prisma } from '@prisma/client';
import { RetryService } from '@app/shared/retry/retry.service';
import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Service for managing rewards.
 * Handles the business logic for managing rewards within the gamification engine.
 * It provides methods for creating, retrieving, and distributing rewards to users
 * based on their achievements and progress.
 */
@Injectable()
export class RewardsService {
  /**
   * Injects the required services.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly achievementsService: AchievementsService,
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly retryService: RetryService
  ) {}

  /**
   * Creates a new reward.
   * @param reward The reward data to create
   * @returns A promise that resolves to the created reward.
   */
  async create(reward: Omit<Reward, 'id'>): Promise<Reward> {
    try {
      this.logger.log(`Creating new reward: ${reward.title}`, 'RewardsService');
      
      return await this.transactionService.executeInTransaction(async (tx) => {
        const createdReward = await tx.reward.create({
          data: {
            title: reward.title,
            description: reward.description,
            xpReward: reward.xpReward,
            icon: reward.icon,
            journey: reward.journey
          }
        });
        
        this.logger.log(`Successfully created reward with ID: ${createdReward.id}`, 'RewardsService');
        return createdReward as Reward;
      });
    } catch (error) {
      this.logger.error(`Failed to create reward: ${error.message}`, error.stack, 'RewardsService');
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppException(
          'Failed to create reward due to database error',
          ErrorType.TECHNICAL,
          'REWARD_001',
          { reward, errorCode: error.code },
          error
        );
      }
      
      throw new AppException(
        'Failed to create reward',
        ErrorType.TECHNICAL,
        'REWARD_001',
        { reward },
        error
      );
    }
  }

  /**
   * Retrieves all rewards with optional filtering.
   * @param filterDto Optional filter criteria
   * @returns A promise that resolves to an array of rewards.
   */
  async findAll(filterDto?: FilterRewardDto): Promise<{ rewards: Reward[]; total: number }> {
    try {
      this.logger.log('Retrieving rewards with filters', 'RewardsService');
      
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', journeyFilter, titleSearch } = filterDto || {};
      const skip = (page - 1) * limit;
      
      // Build where conditions based on filters
      const where: Prisma.RewardWhereInput = {};
      
      if (journeyFilter) {
        where.journey = journeyFilter;
      }
      
      if (titleSearch) {
        where.title = {
          contains: titleSearch,
          mode: 'insensitive' // Case-insensitive search
        };
      }
      
      // Execute query with transaction for consistency
      const [rewards, total] = await this.transactionService.executeInTransaction(async (tx) => {
        const rewards = await tx.reward.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          }
        });
        
        const total = await tx.reward.count({ where });
        return [rewards as Reward[], total];
      });
      
      this.logger.log(`Retrieved ${rewards.length} rewards out of ${total} total`, 'RewardsService');
      return { rewards, total };
    } catch (error) {
      this.logger.error(`Failed to retrieve rewards: ${error.message}`, error.stack, 'RewardsService');
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppException(
          'Failed to retrieve rewards due to database error',
          ErrorType.TECHNICAL,
          'REWARD_002',
          { filterDto, errorCode: error.code },
          error
        );
      }
      
      throw new AppException(
        'Failed to retrieve rewards',
        ErrorType.TECHNICAL,
        'REWARD_002',
        { filterDto },
        error
      );
    }
  }

  /**
   * Retrieves a single reward by its ID.
   * @param id The reward ID to find
   * @returns A promise that resolves to a single reward.
   */
  async findOne(id: string): Promise<Reward> {
    try {
      this.logger.log(`Retrieving reward with ID: ${id}`, 'RewardsService');
      
      const reward = await this.prisma.reward.findUnique({
        where: { id }
      });
      
      if (!reward) {
        this.logger.warn(`Reward with ID ${id} not found`, 'RewardsService');
        throw new AppException(
          `Reward with ID ${id} not found`,
          ErrorType.BUSINESS,
          'REWARD_003',
          { id }
        );
      }
      
      return reward as Reward;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve reward with ID ${id}: ${error.message}`, error.stack, 'RewardsService');
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppException(
          `Failed to retrieve reward with ID ${id} due to database error`,
          ErrorType.TECHNICAL,
          'REWARD_004',
          { id, errorCode: error.code },
          error
        );
      }
      
      throw new AppException(
        `Failed to retrieve reward with ID ${id}`,
        ErrorType.TECHNICAL,
        'REWARD_004',
        { id },
        error
      );
    }
  }

  /**
   * Grants a reward to a user with transaction support and retry mechanisms.
   * @param userId The ID of the user to grant the reward to
   * @param rewardId The ID of the reward to grant
   * @returns A promise that resolves to the granted user reward.
   */
  async grantReward(userId: string, rewardId: string): Promise<UserReward> {
    // Use retry service for resilience
    return this.retryService.executeWithRetry(
      async () => {
        try {
          this.logger.log(`Granting reward ${rewardId} to user ${userId}`, 'RewardsService');
          
          // Execute everything in a transaction for atomicity
          return await this.transactionService.executeInTransaction(async (tx) => {
            // Get user profile
            const profile = await this.profilesService.findById(userId);
            
            // Get reward
            const reward = await this.findOne(rewardId);
            
            // Check if user already has this reward
            const existingUserReward = await tx.userReward.findFirst({
              where: {
                profileId: profile.id,
                rewardId: reward.id
              }
            });
            
            if (existingUserReward) {
              this.logger.warn(
                `User ${userId} already has reward ${rewardId}`,
                'RewardsService'
              );
              return existingUserReward as UserReward;
            }
            
            // Create user reward
            const userReward = await tx.userReward.create({
              data: {
                profileId: profile.id,
                rewardId: reward.id,
                earnedAt: new Date()
              },
              include: {
                profile: true,
                reward: true
              }
            });
            
            // Update user XP in the same transaction
            await tx.gameProfile.update({
              where: { id: profile.id },
              data: { xp: { increment: reward.xpReward } }
            });
            
            // Prepare event payload with standardized schema
            const eventPayload: RewardEventPayload = {
              type: 'REWARD_GRANTED',
              version: '1.0',
              userId,
              rewardId,
              rewardTitle: reward.title,
              xpReward: reward.xpReward,
              journey: reward.journey as JourneyType,
              timestamp: new Date().toISOString(),
              metadata: {
                icon: reward.icon,
                description: reward.description
              }
            };
            
            // Publish event to Kafka for notification and other systems
            // This is outside the transaction as it's an external system
            await this.kafkaService.produce(
              'reward-events',
              eventPayload,
              userId
            );
            
            this.logger.log(
              `Successfully granted reward ${reward.title} to user ${userId}`,
              'RewardsService'
            );
            
            return userReward as UserReward;
          });
        } catch (error) {
          this.logger.error(
            `Failed to grant reward ${rewardId} to user ${userId}: ${error.message}`,
            error.stack,
            'RewardsService'
          );
          
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific database errors
            if (error.code === 'P2002') { // Unique constraint violation
              throw new AppException(
                'User already has this reward',
                ErrorType.BUSINESS,
                'REWARD_006',
                { userId, rewardId },
                error
              );
            }
            
            throw new AppException(
              'Failed to grant reward due to database error',
              ErrorType.TECHNICAL,
              'REWARD_005',
              { userId, rewardId, errorCode: error.code },
              error
            );
          }
          
          if (error instanceof AppException) {
            throw error;
          }
          
          throw new AppException(
            'Failed to grant reward',
            ErrorType.TECHNICAL,
            'REWARD_005',
            { userId, rewardId },
            error
          );
        }
      },
      {
        maxRetries: 3,
        retryDelayMs: 500,
        exponentialBackoff: true,
        retryCondition: (error) => {
          // Only retry on transient errors, not business logic errors
          if (error instanceof AppException) {
            return error.type === ErrorType.TECHNICAL;
          }
          return true;
        }
      }
    );
  }

  /**
   * Grants journey-specific rewards to a user based on their achievements.
   * @param userId The ID of the user to grant rewards to
   * @param journey The journey context (health, care, plan, or global)
   * @returns A promise that resolves to an array of granted rewards.
   */
  async grantJourneyRewards(userId: string, journey: JourneyType): Promise<UserReward[]> {
    try {
      this.logger.log(`Granting ${journey} journey rewards to user ${userId}`, 'RewardsService');
      
      // Get user's achievements for this journey
      const achievements = await this.achievementsService.findUserAchievementsByJourney(userId, journey);
      
      if (!achievements.length) {
        this.logger.log(`No achievements found for user ${userId} in ${journey} journey`, 'RewardsService');
        return [];
      }
      
      // Find rewards associated with this journey
      const { rewards } = await this.findAll({
        journeyFilter: journey,
        limit: 100 // Reasonable limit for journey rewards
      });
      
      if (!rewards.length) {
        this.logger.log(`No rewards found for ${journey} journey`, 'RewardsService');
        return [];
      }
      
      // Grant rewards based on achievement criteria
      const grantedRewards: UserReward[] = [];
      
      // Execute in transaction for atomicity
      await this.transactionService.executeInTransaction(async (tx) => {
        for (const reward of rewards) {
          // Implement journey-specific reward granting logic
          // This is a simplified example - actual implementation would have more complex criteria
          const shouldGrantReward = achievements.length >= reward.xpReward / 100;
          
          if (shouldGrantReward) {
            try {
              const userReward = await this.grantReward(userId, reward.id);
              grantedRewards.push(userReward);
            } catch (error) {
              // Log error but continue with other rewards
              if (error instanceof AppException && error.code === 'REWARD_006') {
                // User already has this reward, just log and continue
                this.logger.log(
                  `User ${userId} already has reward ${reward.id}, skipping`,
                  'RewardsService'
                );
              } else {
                this.logger.error(
                  `Failed to grant reward ${reward.id} to user ${userId}: ${error.message}`,
                  error.stack,
                  'RewardsService'
                );
              }
            }
          }
        }
      });
      
      this.logger.log(
        `Granted ${grantedRewards.length} rewards to user ${userId} for ${journey} journey`,
        'RewardsService'
      );
      
      return grantedRewards;
    } catch (error) {
      this.logger.error(
        `Failed to grant journey rewards for ${journey} to user ${userId}: ${error.message}`,
        error.stack,
        'RewardsService'
      );
      
      throw new AppException(
        `Failed to grant journey rewards for ${journey}`,
        ErrorType.TECHNICAL,
        'REWARD_007',
        { userId, journey },
        error
      );
    }
  }

  /**
   * Updates an existing reward.
   * @param id The ID of the reward to update
   * @param updateData The data to update the reward with
   * @returns A promise that resolves to the updated reward.
   */
  async update(id: string, updateData: Partial<Reward>): Promise<Reward> {
    try {
      this.logger.log(`Updating reward with ID: ${id}`, 'RewardsService');
      
      // First check if reward exists
      await this.findOne(id);
      
      return await this.transactionService.executeInTransaction(async (tx) => {
        const updatedReward = await tx.reward.update({
          where: { id },
          data: updateData
        });
        
        this.logger.log(`Successfully updated reward with ID: ${id}`, 'RewardsService');
        return updatedReward as Reward;
      });
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(`Failed to update reward with ID ${id}: ${error.message}`, error.stack, 'RewardsService');
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppException(
          `Failed to update reward with ID ${id} due to database error`,
          ErrorType.TECHNICAL,
          'REWARD_008',
          { id, updateData, errorCode: error.code },
          error
        );
      }
      
      throw new AppException(
        `Failed to update reward with ID ${id}`,
        ErrorType.TECHNICAL,
        'REWARD_008',
        { id, updateData },
        error
      );
    }
  }

  /**
   * Retrieves all rewards earned by a specific user.
   * @param userId The ID of the user
   * @param filterDto Optional filter criteria
   * @returns A promise that resolves to an array of user rewards.
   */
  async findUserRewards(userId: string, filterDto?: FilterRewardDto): Promise<{ userRewards: UserReward[]; total: number }> {
    try {
      this.logger.log(`Retrieving rewards for user ${userId}`, 'RewardsService');
      
      const { page = 1, limit = 10, sortBy = 'earnedAt', sortOrder = 'desc', journeyFilter } = filterDto || {};
      const skip = (page - 1) * limit;
      
      // Get user profile
      const profile = await this.profilesService.findById(userId);
      
      // Build where conditions
      const where: Prisma.UserRewardWhereInput = {
        profileId: profile.id
      };
      
      if (journeyFilter) {
        where.reward = {
          journey: journeyFilter
        };
      }
      
      // Execute query with transaction for consistency
      const [userRewards, total] = await this.transactionService.executeInTransaction(async (tx) => {
        const userRewards = await tx.userReward.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          },
          include: {
            reward: true
          }
        });
        
        const total = await tx.userReward.count({ where });
        return [userRewards as UserReward[], total];
      });
      
      this.logger.log(`Retrieved ${userRewards.length} rewards for user ${userId}`, 'RewardsService');
      return { userRewards, total };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve rewards for user ${userId}: ${error.message}`,
        error.stack,
        'RewardsService'
      );
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppException(
          `Failed to retrieve rewards for user ${userId} due to database error`,
          ErrorType.TECHNICAL,
          'REWARD_009',
          { userId, filterDto, errorCode: error.code },
          error
        );
      }
      
      throw new AppException(
        `Failed to retrieve rewards for user ${userId}`,
        ErrorType.TECHNICAL,
        'REWARD_009',
        { userId, filterDto },
        error
      );
    }
  }
}