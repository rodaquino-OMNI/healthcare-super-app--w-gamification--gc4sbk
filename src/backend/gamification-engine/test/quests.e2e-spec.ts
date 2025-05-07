import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, beforeAll, afterAll, expect, jest, beforeEach } from '@jest/globals';
import * as request from 'supertest';
import { JwtAuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@nestjs/passport';
import { AppModule } from '../app.module';
import { QuestsService } from '../src/quests/quests.service';
import { ProfilesService } from '../src/profiles/profiles.service';
import { AchievementsService } from '../src/achievements/achievements.service';
import { KafkaService } from 'src/backend/shared/src/kafka/kafka.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Quest } from '../src/quests/entities/quest.entity';
import { UserQuest } from '../src/quests/entities/user-quest.entity';

/**
 * End-to-end tests for the QuestsController.
 * These tests verify quest creation, progress tracking, completion detection, and reward distribution.
 */
describe('QuestsController (e2e)', () => {
  let app: INestApplication;
  let questsService: QuestsService;
  let profilesService: ProfilesService;
  let achievementsService: AchievementsService;
  let kafkaService: KafkaService;
  let questRepository: Repository<Quest>;
  let userQuestRepository: Repository<UserQuest>;
  
  // Mock user for testing
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  };

  // Mock profile for testing
  const mockProfile = {
    id: 'profile-123',
    userId: mockUser.id,
    level: 1,
    xp: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    achievements: [],
    quests: []
  };

  // Mock quests for testing
  const mockQuests = [
    {
      id: 'quest-123',
      title: 'Complete 10,000 steps',
      description: 'Walk 10,000 steps in a single day',
      journey: 'health',
      icon: 'steps',
      xpReward: 50
    },
    {
      id: 'quest-456',
      title: 'Book a doctor appointment',
      description: 'Schedule a check-up with your doctor',
      journey: 'care',
      icon: 'appointment',
      xpReward: 75
    },
    {
      id: 'quest-789',
      title: 'Submit a claim',
      description: 'Submit a health insurance claim',
      journey: 'plan',
      icon: 'claim',
      xpReward: 100
    }
  ];

  // Mock user quest for testing
  const mockUserQuest = {
    id: 'user-quest-123',
    profile: mockProfile,
    quest: mockQuests[0],
    progress: 0,
    completed: false
  };

  // Mock completed user quest for testing
  const mockCompletedUserQuest = {
    ...mockUserQuest,
    progress: 100,
    completed: true
  };

  // Mock achievements for testing
  const mockAchievements = [
    {
      id: 'achievement-123',
      title: 'Health Enthusiast',
      description: 'Complete 5 health quests',
      journey: 'health',
      icon: 'health',
      xpReward: 200
    }
  ];

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

    // Get service instances for mocking
    questsService = moduleFixture.get<QuestsService>(QuestsService);
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    questRepository = moduleFixture.get<Repository<Quest>>(getRepositoryToken(Quest));
    userQuestRepository = moduleFixture.get<Repository<UserQuest>>(getRepositoryToken(UserQuest));

    // Mock request.user for the CurrentUser decorator
    jest.spyOn(app.getHttpAdapter(), 'getInstance').mockImplementation(() => ({
      use: (fn) => {
        fn({}, {}, () => {});
      },
    }));
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();

    // Mock the request.user object for the CurrentUser decorator
    jest.spyOn(app.getHttpAdapter(), 'getInstance').mockImplementation(() => ({
      use: (fn) => {
        fn({ user: mockUser }, {}, () => {});
      },
    }));

    // Mock the questsService.findAll method
    jest.spyOn(questsService, 'findAll').mockResolvedValue(mockQuests);

    // Mock the profilesService.findById method
    jest.spyOn(profilesService, 'findById').mockResolvedValue(mockProfile);

    // Mock the achievementsService.findByJourney method
    jest.spyOn(achievementsService, 'findByJourney').mockResolvedValue(mockAchievements);

    // Mock the kafkaService.produce method
    jest.spyOn(kafkaService, 'produce').mockResolvedValue(undefined);
  });

  afterAll(async () => {
    // Close the application after all tests
    await app.close();
  });

  describe('GET /quests', () => {
    it('should return all quests', async () => {
      // Mock the questsService.findAll method
      jest.spyOn(questsService, 'findAll').mockResolvedValue(mockQuests);

      return request(app.getHttpServer())
        .get('/quests')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(mockQuests.length);
          expect(res.body[0].id).toBe(mockQuests[0].id);
          expect(res.body[0].title).toBe(mockQuests[0].title);
        });
    });

    it('should filter quests by journey', async () => {
      // Mock the questsService.findAll method to filter by journey
      const healthQuests = mockQuests.filter(q => q.journey === 'health');
      jest.spyOn(questsService, 'findAll').mockImplementation(async () => {
        return healthQuests;
      });

      return request(app.getHttpServer())
        .get('/quests?journey=health')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(healthQuests.length);
          expect(res.body[0].journey).toBe('health');
        });
    });
  });

  describe('GET /quests/:id', () => {
    it('should return a single quest by ID', async () => {
      const questId = mockQuests[0].id;
      
      // Mock the questsService.findOne method
      jest.spyOn(questsService, 'findOne').mockResolvedValue(mockQuests[0]);

      return request(app.getHttpServer())
        .get(`/quests/${questId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockQuests[0]);
        });
    });

    it('should return 404 if quest is not found', async () => {
      const nonExistentId = 'non-existent-id';
      
      // Mock the questsService.findOne method to throw NotFoundException
      jest.spyOn(questsService, 'findOne').mockImplementation(async () => {
        throw new Error(`Quest with ID ${nonExistentId} not found`);
      });

      return request(app.getHttpServer())
        .get(`/quests/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /quests/:id/start', () => {
    it('should start a quest for a user', async () => {
      const questId = mockQuests[0].id;
      
      // Mock the questsService.findOne method
      jest.spyOn(questsService, 'findOne').mockResolvedValue(mockQuests[0]);
      
      // Mock the questsService.startQuest method
      jest.spyOn(questsService, 'startQuest').mockResolvedValue(mockUserQuest);

      return request(app.getHttpServer())
        .post(`/quests/${questId}/start`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockUserQuest);
          expect(res.body.progress).toBe(0);
          expect(res.body.completed).toBe(false);
        });
    });

    it('should return existing user quest if already started', async () => {
      const questId = mockQuests[0].id;
      
      // Mock the questsService.findOne method
      jest.spyOn(questsService, 'findOne').mockResolvedValue(mockQuests[0]);
      
      // Mock the userQuestRepository.findOne method to return an existing user quest
      jest.spyOn(userQuestRepository, 'findOne').mockResolvedValue(mockUserQuest);
      
      // Mock the questsService.startQuest method
      jest.spyOn(questsService, 'startQuest').mockResolvedValue(mockUserQuest);

      return request(app.getHttpServer())
        .post(`/quests/${questId}/start`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockUserQuest);
        });
    });

    it('should return 404 if quest is not found', async () => {
      const nonExistentId = 'non-existent-id';
      
      // Mock the questsService.startQuest method to throw NotFoundException
      jest.spyOn(questsService, 'startQuest').mockImplementation(async () => {
        throw new Error(`Quest with ID ${nonExistentId} not found`);
      });

      return request(app.getHttpServer())
        .post(`/quests/${nonExistentId}/start`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /quests/:id/complete', () => {
    it('should complete a quest for a user', async () => {
      const questId = mockQuests[0].id;
      
      // Mock the questsService.findOne method
      jest.spyOn(questsService, 'findOne').mockResolvedValue(mockQuests[0]);
      
      // Mock the userQuestRepository.findOne method
      jest.spyOn(userQuestRepository, 'findOne').mockResolvedValue(mockUserQuest);
      
      // Mock the questsService.completeQuest method
      jest.spyOn(questsService, 'completeQuest').mockResolvedValue(mockCompletedUserQuest);
      
      // Mock the profilesService.update method
      jest.spyOn(profilesService, 'update').mockResolvedValue({
        ...mockProfile,
        xp: mockProfile.xp + mockQuests[0].xpReward
      });

      return request(app.getHttpServer())
        .post(`/quests/${questId}/complete`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockCompletedUserQuest);
          expect(res.body.progress).toBe(100);
          expect(res.body.completed).toBe(true);
          
          // Verify that the quest completion was published to Kafka
          expect(kafkaService.produce).toHaveBeenCalledWith('quest.completed', expect.objectContaining({
            userId: mockUser.id,
            questId: questId,
            xpAwarded: mockQuests[0].xpReward
          }));
        });
    });

    it('should return 404 if user has not started the quest', async () => {
      const questId = mockQuests[0].id;
      
      // Mock the questsService.completeQuest method to throw NotFoundException
      jest.spyOn(questsService, 'completeQuest').mockImplementation(async () => {
        throw new Error(`User ${mockUser.id} has not started quest ${questId}`);
      });

      return request(app.getHttpServer())
        .post(`/quests/${questId}/complete`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return the user quest if already completed', async () => {
      const questId = mockQuests[0].id;
      
      // Mock the questsService.completeQuest method to return already completed quest
      jest.spyOn(questsService, 'completeQuest').mockResolvedValue(mockCompletedUserQuest);

      return request(app.getHttpServer())
        .post(`/quests/${questId}/complete`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockCompletedUserQuest);
          expect(res.body.completed).toBe(true);
        });
    });

    it('should verify reward distribution upon quest completion', async () => {
      const questId = mockQuests[0].id;
      
      // Mock the questsService.findOne method
      jest.spyOn(questsService, 'findOne').mockResolvedValue(mockQuests[0]);
      
      // Mock the userQuestRepository.findOne method
      jest.spyOn(userQuestRepository, 'findOne').mockResolvedValue(mockUserQuest);
      
      // Mock the questsService.completeQuest method
      jest.spyOn(questsService, 'completeQuest').mockResolvedValue(mockCompletedUserQuest);
      
      // Mock the profilesService.update method
      const updatedProfile = {
        ...mockProfile,
        xp: mockProfile.xp + mockQuests[0].xpReward
      };
      jest.spyOn(profilesService, 'update').mockResolvedValue(updatedProfile);

      return request(app.getHttpServer())
        .post(`/quests/${questId}/complete`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          // Verify that XP was awarded
          expect(profilesService.update).toHaveBeenCalledWith(
            mockUser.id,
            expect.objectContaining({ xp: mockProfile.xp + mockQuests[0].xpReward })
          );
          
          // Verify that achievements were checked
          expect(achievementsService.findByJourney).toHaveBeenCalledWith(mockQuests[0].journey);
          
          // Verify that the quest completion was published to Kafka
          expect(kafkaService.produce).toHaveBeenCalledWith('quest.completed', expect.objectContaining({
            userId: mockUser.id,
            questId: questId,
            xpAwarded: mockQuests[0].xpReward
          }));
        });
    });
  });

  describe('Cross-journey quest functionality', () => {
    it('should handle quests from different journeys', async () => {
      // Test with quests from different journeys
      const healthQuestId = mockQuests[0].id; // health journey
      const careQuestId = mockQuests[1].id;   // care journey
      const planQuestId = mockQuests[2].id;   // plan journey
      
      // Mock the questsService.findAll method to return all quests
      jest.spyOn(questsService, 'findAll').mockResolvedValue(mockQuests);
      
      // Verify that quests from all journeys are returned
      const response = await request(app.getHttpServer())
        .get('/quests')
        .expect(HttpStatus.OK);
      
      expect(response.body.length).toBe(3);
      expect(response.body.map(q => q.journey)).toContain('health');
      expect(response.body.map(q => q.journey)).toContain('care');
      expect(response.body.map(q => q.journey)).toContain('plan');
    });

    it('should track progress across multiple journeys', async () => {
      // Mock the questsService.startQuest method for different journeys
      jest.spyOn(questsService, 'startQuest')
        .mockImplementation(async (userId, questId) => {
          const quest = mockQuests.find(q => q.id === questId);
          return {
            id: `user-quest-${questId}`,
            profile: mockProfile,
            quest,
            progress: 0,
            completed: false
          };
        });
      
      // Start quests from different journeys
      await request(app.getHttpServer())
        .post(`/quests/${mockQuests[0].id}/start`) // health journey
        .expect(HttpStatus.OK);
      
      await request(app.getHttpServer())
        .post(`/quests/${mockQuests[1].id}/start`) // care journey
        .expect(HttpStatus.OK);
      
      await request(app.getHttpServer())
        .post(`/quests/${mockQuests[2].id}/start`) // plan journey
        .expect(HttpStatus.OK);
      
      // Verify that quests from different journeys were started
      expect(questsService.startQuest).toHaveBeenCalledTimes(3);
      expect(questsService.startQuest).toHaveBeenCalledWith(mockUser.id, mockQuests[0].id);
      expect(questsService.startQuest).toHaveBeenCalledWith(mockUser.id, mockQuests[1].id);
      expect(questsService.startQuest).toHaveBeenCalledWith(mockUser.id, mockQuests[2].id);
    });
  });
});