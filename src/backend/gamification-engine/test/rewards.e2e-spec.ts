import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import * as request from 'supertest';
import { JwtAuthGuard, RolesGuard } from '@nestjs/passport';
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
 * These tests verify the reward definition, distribution, and redemption processes.
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
  
  // Mock user reward
  const mockUserReward: Partial<UserReward> = {
    id: 'user-reward-123',
    profile: mockUserProfile,
    reward: testReward as Reward,
    earnedAt: new Date()
  };

  beforeAll(async () => {
    // Create a testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
    
    // Get service instances
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

  describe('GET /rewards', () => {
    it('should return all rewards', () => {
      return request(app.getHttpServer())
        .get('/rewards')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /rewards/:id', () => {
    let rewardId: string;
    
    beforeEach(async () => {
      // Get all rewards to find a valid ID
      const response = await request(app.getHttpServer()).get('/rewards');
      
      // If rewards exist, use the first one's ID
      if (response.body.length > 0) {
        rewardId = response.body[0].id;
      } else {
        // If no rewards exist, create a test reward
        const createResponse = await request(app.getHttpServer())
          .post('/rewards')
          .send(testReward);
        
        rewardId = createResponse.body.id;
      }
    });
    
    it('should return a single reward by ID', () => {
      return request(app.getHttpServer())
        .get(`/rewards/${rewardId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', rewardId);
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('description');
          expect(res.body).toHaveProperty('xpReward');
          expect(res.body).toHaveProperty('icon');
          expect(res.body).toHaveProperty('journey');
        });
    });
    
    it('should return 404 if reward is not found', () => {
      return request(app.getHttpServer())
        .get('/rewards/non-existent-id')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /rewards', () => {
    it('should create a new reward', () => {
      return request(app.getHttpServer())
        .post('/rewards')
        .send(testReward)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', testReward.title);
          expect(res.body).toHaveProperty('description', testReward.description);
          expect(res.body).toHaveProperty('xpReward', testReward.xpReward);
          expect(res.body).toHaveProperty('icon', testReward.icon);
          expect(res.body).toHaveProperty('journey', testReward.journey);
        });
    });
    
    it('should validate reward data', () => {
      return request(app.getHttpServer())
        .post('/rewards')
        .send({
          // Missing required fields
          title: 'Incomplete Reward'
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Reward distribution upon achievements', () => {
    it('should grant a reward when an achievement is completed', async () => {
      // Mock the profilesService to return a game profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the rewardsService to return a reward
      jest.spyOn(rewardsService, 'findOne').mockResolvedValue(testReward as Reward);
      
      // Mock the rewardsService to grant a reward
      jest.spyOn(rewardsService, 'grantReward').mockResolvedValue(mockUserReward as UserReward);
      
      // Mock the kafkaService to produce a message
      jest.spyOn(kafkaService, 'produce').mockResolvedValue(undefined);
      
      // Create a test achievement
      const testAchievement = {
        id: 'achievement-123',
        title: 'Test Achievement',
        description: 'An achievement for testing purposes',
        xpReward: 50,
        journey: 'health',
        criteria: 'event.type === "TEST_EVENT"',
        rewardId: 'reward-123' // ID of the reward to grant
      };
      
      // Mock the achievementsService to return the test achievement
      jest.spyOn(achievementsService, 'findById').mockResolvedValue(testAchievement);
      
      // Simulate an achievement completion event
      const eventData = {
        type: 'ACHIEVEMENT_COMPLETED',
        userId: testUserId,
        data: {
          achievementId: testAchievement.id
        },
        journey: 'health'
      };
      
      // Send the event to the API
      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert that the reward was granted
      expect(rewardsService.grantReward).toHaveBeenCalledWith(
        testUserId,
        testAchievement.rewardId
      );
      
      // Assert that a Kafka message was produced
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'reward-events',
        expect.objectContaining({
          type: 'REWARD_GRANTED',
          userId: testUserId,
          rewardId: expect.any(String)
        }),
        testUserId
      );
    });
  });

  describe('Reward distribution upon quest completion', () => {
    it('should grant a reward when a quest is completed', async () => {
      // Mock the profilesService to return a game profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the rewardsService to return a reward
      jest.spyOn(rewardsService, 'findOne').mockResolvedValue(testReward as Reward);
      
      // Mock the rewardsService to grant a reward
      jest.spyOn(rewardsService, 'grantReward').mockResolvedValue(mockUserReward as UserReward);
      
      // Mock the kafkaService to produce a message
      jest.spyOn(kafkaService, 'produce').mockResolvedValue(undefined);
      
      // Create a test quest
      const testQuest = {
        id: 'quest-123',
        title: 'Test Quest',
        description: 'A quest for testing purposes',
        xpReward: 200,
        journey: 'health',
        steps: [],
        rewardId: 'reward-123' // ID of the reward to grant
      };
      
      // Mock the questsService to return the test quest
      jest.spyOn(questsService, 'findOne').mockResolvedValue(testQuest);
      
      // Simulate a quest completion event
      const eventData = {
        type: 'QUEST_COMPLETED',
        userId: testUserId,
        data: {
          questId: testQuest.id
        },
        journey: 'health'
      };
      
      // Send the event to the API
      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert that the reward was granted
      expect(rewardsService.grantReward).toHaveBeenCalledWith(
        testUserId,
        testQuest.rewardId
      );
      
      // Assert that a Kafka message was produced
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'reward-events',
        expect.objectContaining({
          type: 'REWARD_GRANTED',
          userId: testUserId,
          rewardId: expect.any(String)
        }),
        testUserId
      );
    });
  });

  describe('Reward inventory and redemption', () => {
    it('should retrieve a user\'s reward inventory', async () => {
      // Mock user rewards
      const mockUserRewards = [
        {
          id: 'user-reward-1',
          reward: {
            id: 'reward-1',
            title: 'Health Badge',
            description: 'Earned for completing health goals',
            xpReward: 100,
            icon: 'health-badge',
            journey: 'health'
          },
          earnedAt: new Date().toISOString()
        },
        {
          id: 'user-reward-2',
          reward: {
            id: 'reward-2',
            title: 'Care Badge',
            description: 'Earned for completing care appointments',
            xpReward: 150,
            icon: 'care-badge',
            journey: 'care'
          },
          earnedAt: new Date().toISOString()
        }
      ];
      
      // Mock the profilesService to return user rewards
      jest.spyOn(profilesService, 'getUserRewards').mockResolvedValue(mockUserRewards);
      
      // Send request to get user rewards
      const response = await request(app.getHttpServer())
        .get(`/profiles/${testUserId}/rewards`)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert the response
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 'user-reward-1');
      expect(response.body[0].reward).toHaveProperty('title', 'Health Badge');
      expect(response.body[1]).toHaveProperty('id', 'user-reward-2');
      expect(response.body[1].reward).toHaveProperty('title', 'Care Badge');
    });
    
    it('should redeem a reward', async () => {
      // Mock the profilesService to return a game profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to check if user has the reward
      jest.spyOn(profilesService, 'hasReward').mockResolvedValue(true);
      
      // Mock the profilesService to redeem a reward
      jest.spyOn(profilesService, 'redeemReward').mockResolvedValue({
        success: true,
        message: 'Reward redeemed successfully',
        rewardId: 'reward-123'
      });
      
      // Mock the kafkaService to produce a message
      jest.spyOn(kafkaService, 'produce').mockResolvedValue(undefined);
      
      // Send request to redeem a reward
      const response = await request(app.getHttpServer())
        .post(`/profiles/${testUserId}/rewards/reward-123/redeem`)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert the response
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Reward redeemed successfully');
      expect(response.body).toHaveProperty('rewardId', 'reward-123');
      
      // Assert that a Kafka message was produced
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'reward-events',
        expect.objectContaining({
          type: 'REWARD_REDEEMED',
          userId: testUserId,
          rewardId: 'reward-123'
        }),
        testUserId
      );
    });
    
    it('should return 404 if user does not have the reward', async () => {
      // Mock the profilesService to return a game profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to check if user has the reward
      jest.spyOn(profilesService, 'hasReward').mockResolvedValue(false);
      
      // Send request to redeem a reward
      const response = await request(app.getHttpServer())
        .post(`/profiles/${testUserId}/rewards/non-existent-reward/redeem`)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert the response
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});