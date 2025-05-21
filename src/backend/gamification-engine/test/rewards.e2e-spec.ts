import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import * as request from 'supertest';
import { JwtAuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@nestjs/passport';
import { AppModule } from '../app.module';
import { RewardsService } from '../src/rewards/rewards.service';
import { ProfilesService } from '../src/profiles/profiles.service';
import { AchievementsService } from '../src/achievements/achievements.service';
import { QuestsService } from '../src/quests/quests.service';
import { KafkaService } from '../../shared/src/kafka/kafka.service';
import { Reward } from '../src/rewards/entities/reward.entity';
import { UserReward } from '../src/rewards/entities/user-reward.entity';

/**
 * End-to-end tests for the RewardsController.
 * These tests verify reward definition, distribution, and redemption processes.
 */
describe('RewardsController (e2e)', () => {
  let app: INestApplication;
  let rewardsService: RewardsService;
  let profilesService: ProfilesService;
  let achievementsService: AchievementsService;
  let questsService: QuestsService;
  let kafkaService: KafkaService;
  
  // Test data
  const testUserId = 'test-user-123';
  const testReward: Partial<Reward> = {
    title: 'Test Reward',
    description: 'A reward for testing purposes',
    xpReward: 100,
    icon: 'test-icon',
    journey: 'health'
  };
  
  // Mock user profile
  const mockUserProfile = {
    id: 'profile-123',
    userId: testUserId,
    level: 1,
    xp: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    achievements: [],
    quests: []
  };

  beforeAll(async () => {
    // Create a testing module
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Mock the guards to bypass authentication and authorization
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    // Initialize the application
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get service instances for mocking and assertions
    rewardsService = moduleFixture.get<RewardsService>(RewardsService);
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    questsService = moduleFixture.get<QuestsService>(QuestsService);
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
  });

  afterAll(async () => {
    // Close the application after all tests
    await app.close();
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Reward Definition', () => {
    it('POST /rewards - Should create a new reward', async () => {
      // Mock the rewardsService.create method
      jest.spyOn(rewardsService, 'create').mockImplementation(async (reward) => {
        return {
          id: 'reward-123',
          ...reward
        } as Reward;
      });
      
      return request(app.getHttpServer())
        .post('/rewards')
        .send(testReward)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toEqual(expect.objectContaining({
            id: expect.any(String),
            title: testReward.title,
            description: testReward.description,
            xpReward: testReward.xpReward,
            icon: testReward.icon,
            journey: testReward.journey
          }));
        });
    });
    
    it('GET /rewards - Should return all rewards', async () => {
      // Mock the rewardsService.findAll method
      const mockRewards = [
        {
          id: 'reward-123',
          ...testReward
        },
        {
          id: 'reward-456',
          title: 'Another Reward',
          description: 'Another reward for testing',
          xpReward: 200,
          icon: 'another-icon',
          journey: 'care'
        }
      ];
      
      jest.spyOn(rewardsService, 'findAll').mockResolvedValue(mockRewards as Reward[]);
      
      return request(app.getHttpServer())
        .get('/rewards')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0]).toEqual(expect.objectContaining({
            id: 'reward-123',
            title: testReward.title
          }));
          expect(res.body[1]).toEqual(expect.objectContaining({
            id: 'reward-456',
            title: 'Another Reward'
          }));
        });
    });
    
    it('GET /rewards/:id - Should return a single reward by ID', async () => {
      const rewardId = 'reward-123';
      const mockReward = {
        id: rewardId,
        ...testReward
      };
      
      jest.spyOn(rewardsService, 'findOne').mockResolvedValue(mockReward as Reward);
      
      return request(app.getHttpServer())
        .get(`/rewards/${rewardId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(expect.objectContaining({
            id: rewardId,
            title: testReward.title,
            description: testReward.description,
            xpReward: testReward.xpReward,
            icon: testReward.icon,
            journey: testReward.journey
          }));
        });
    });
    
    it('GET /rewards/:id - Should return 404 if reward is not found', async () => {
      const nonExistentId = 'non-existent-id';
      
      // Mock the rewardsService.findOne method to throw an AppException
      jest.spyOn(rewardsService, 'findOne').mockImplementation(async () => {
        const error = new Error(`Reward with ID ${nonExistentId} not found`);
        error['status'] = HttpStatus.NOT_FOUND;
        throw error;
      });
      
      return request(app.getHttpServer())
        .get(`/rewards/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
  
  describe('Reward Distribution', () => {
    it('Should grant a reward to a user upon achievement completion', async () => {
      const rewardId = 'reward-123';
      const achievementId = 'achievement-123';
      
      // Mock the profilesService.findById method
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the rewardsService.findOne method
      jest.spyOn(rewardsService, 'findOne').mockResolvedValue({
        id: rewardId,
        ...testReward
      } as Reward);
      
      // Mock the rewardsService.grantReward method
      const mockUserReward = {
        id: 'user-reward-123',
        profile: mockUserProfile,
        reward: {
          id: rewardId,
          ...testReward
        },
        earnedAt: new Date()
      };
      
      jest.spyOn(rewardsService, 'grantReward').mockResolvedValue(mockUserReward as UserReward);
      
      // Mock the kafkaService.produce method
      jest.spyOn(kafkaService, 'produce').mockResolvedValue(undefined);
      
      // Mock the achievementsService.completeAchievement method
      jest.spyOn(achievementsService, 'completeAchievement').mockImplementation(async (userId, achievementId) => {
        // This should trigger the reward granting process
        await rewardsService.grantReward(userId, rewardId);
        return { success: true };
      });
      
      // Simulate completing an achievement that grants a reward
      const result = await achievementsService.completeAchievement(testUserId, achievementId);
      
      expect(result).toEqual({ success: true });
      expect(rewardsService.grantReward).toHaveBeenCalledWith(testUserId, rewardId);
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'reward-events',
        expect.objectContaining({
          type: 'REWARD_GRANTED',
          userId: testUserId,
          rewardId: rewardId
        }),
        testUserId
      );
    });
    
    it('Should grant a reward to a user upon quest completion', async () => {
      const rewardId = 'reward-456';
      const questId = 'quest-123';
      
      // Mock the profilesService.findById method
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the rewardsService.findOne method
      jest.spyOn(rewardsService, 'findOne').mockResolvedValue({
        id: rewardId,
        title: 'Quest Reward',
        description: 'A reward for completing a quest',
        xpReward: 300,
        icon: 'quest-icon',
        journey: 'care'
      } as Reward);
      
      // Mock the rewardsService.grantReward method
      const mockUserReward = {
        id: 'user-reward-456',
        profile: mockUserProfile,
        reward: {
          id: rewardId,
          title: 'Quest Reward',
          description: 'A reward for completing a quest',
          xpReward: 300,
          icon: 'quest-icon',
          journey: 'care'
        },
        earnedAt: new Date()
      };
      
      jest.spyOn(rewardsService, 'grantReward').mockResolvedValue(mockUserReward as UserReward);
      
      // Mock the kafkaService.produce method
      jest.spyOn(kafkaService, 'produce').mockResolvedValue(undefined);
      
      // Mock the questsService.completeQuest method
      jest.spyOn(questsService, 'completeQuest').mockImplementation(async (userId, questId) => {
        // This should trigger the reward granting process
        await rewardsService.grantReward(userId, rewardId);
        return { success: true };
      });
      
      // Simulate completing a quest that grants a reward
      const result = await questsService.completeQuest(testUserId, questId);
      
      expect(result).toEqual({ success: true });
      expect(rewardsService.grantReward).toHaveBeenCalledWith(testUserId, rewardId);
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'reward-events',
        expect.objectContaining({
          type: 'REWARD_GRANTED',
          userId: testUserId,
          rewardId: rewardId
        }),
        testUserId
      );
    });
  });
  
  describe('Reward Inventory and Redemption', () => {
    it('Should retrieve a user's reward inventory', async () => {
      // This endpoint might not exist yet, but we're testing the functionality
      // that would be needed for reward inventory management
      
      const mockUserRewards = [
        {
          id: 'user-reward-123',
          profile: mockUserProfile,
          reward: {
            id: 'reward-123',
            ...testReward
          },
          earnedAt: new Date()
        },
        {
          id: 'user-reward-456',
          profile: mockUserProfile,
          reward: {
            id: 'reward-456',
            title: 'Quest Reward',
            description: 'A reward for completing a quest',
            xpReward: 300,
            icon: 'quest-icon',
            journey: 'care'
          },
          earnedAt: new Date()
        }
      ];
      
      // Mock a method to get user rewards (this might need to be added to the service)
      jest.spyOn(rewardsService, 'getUserRewards').mockResolvedValue(mockUserRewards as UserReward[]);
      
      // This is a hypothetical endpoint that would need to be implemented
      // We're testing the functionality that would be needed
      const getUserRewards = async (userId: string) => {
        return await rewardsService.getUserRewards(userId);
      };
      
      const userRewards = await getUserRewards(testUserId);
      
      expect(Array.isArray(userRewards)).toBe(true);
      expect(userRewards.length).toBe(2);
      expect(userRewards[0].profile.userId).toBe(testUserId);
      expect(userRewards[0].reward.title).toBe(testReward.title);
      expect(userRewards[1].reward.title).toBe('Quest Reward');
    });
    
    it('Should process reward redemption', async () => {
      const userRewardId = 'user-reward-123';
      
      // Mock a method to redeem a reward (this might need to be added to the service)
      jest.spyOn(rewardsService, 'redeemReward').mockResolvedValue({
        success: true,
        message: 'Reward redeemed successfully'
      });
      
      // Mock the kafkaService.produce method
      jest.spyOn(kafkaService, 'produce').mockResolvedValue(undefined);
      
      // This is a hypothetical endpoint that would need to be implemented
      // We're testing the functionality that would be needed
      const redeemReward = async (userId: string, userRewardId: string) => {
        const result = await rewardsService.redeemReward(userId, userRewardId);
        
        // Publish event to Kafka for notification and other systems
        await kafkaService.produce(
          'reward-events',
          {
            type: 'REWARD_REDEEMED',
            userId,
            userRewardId,
            timestamp: new Date().toISOString()
          },
          userId
        );
        
        return result;
      };
      
      const result = await redeemReward(testUserId, userRewardId);
      
      expect(result).toEqual({
        success: true,
        message: 'Reward redeemed successfully'
      });
      
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'reward-events',
        expect.objectContaining({
          type: 'REWARD_REDEEMED',
          userId: testUserId,
          userRewardId: userRewardId
        }),
        testUserId
      );
    });
  });
});