import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import * as request from 'supertest';
import { EventsModule } from 'src/backend/gamification-engine/src/events/events.module';
import { EventsService } from 'src/backend/gamification-engine/src/events/events.service';
import { AchievementsModule } from 'src/backend/gamification-engine/src/achievements/achievements.module';
import { AchievementsService } from 'src/backend/gamification-engine/src/achievements/achievements.service';
import { ProfilesModule } from 'src/backend/gamification-engine/src/profiles/profiles.module';
import { ProfilesService } from 'src/backend/gamification-engine/src/profiles/profiles.service';
import { RulesModule } from 'src/backend/gamification-engine/src/rules/rules.module';
import { RulesService } from 'src/backend/gamification-engine/src/rules/rules.service';
import { QuestsModule } from 'src/backend/gamification-engine/src/quests/quests.module';
import { QuestsService } from 'src/backend/gamification-engine/src/quests/quests.service';
import { RewardsModule } from 'src/backend/gamification-engine/src/rewards/rewards.module';
import { RewardsService } from 'src/backend/gamification-engine/src/rewards/rewards.service';
import { KafkaService } from 'src/backend/shared/src/kafka/kafka.service';
import { PrismaService } from 'src/backend/shared/src/database/prisma.service';

/**
 * End-to-end tests for journey-specific event processing.
 * These tests verify that events from each journey (Health, Care, Plan) are properly
 * processed, validated, and affect user profiles, achievements, and quests appropriately.
 */
describe('Journey Events Processing (e2e)', () => {
  let app: INestApplication;
  let eventsService: EventsService;
  let achievementsService: AchievementsService;
  let profilesService: ProfilesService;
  let rulesService: RulesService;
  let questsService: QuestsService;
  let rewardsService: RewardsService;
  let kafkaService: KafkaService;
  let prismaService: PrismaService;

  // Test user ID used across all tests
  const userId = 'test-user-123';
  
  // Base profile used for testing
  const baseProfile = {
    id: 'profile-id',
    userId,
    level: 1,
    xp: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    achievements: [],
    quests: [],
    rewards: []
  };

  beforeEach(async () => {
    // Create a testing module with all necessary dependencies
    const moduleFixture = await Test.createTestingModule({
      imports: [
        EventsModule, 
        AchievementsModule, 
        ProfilesModule,
        RulesModule,
        QuestsModule,
        RewardsModule
      ],
    })
    .overrideProvider(KafkaService)
    .useValue({
      produce: jest.fn().mockResolvedValue(undefined),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get instances of the services for assertions and mocking
    eventsService = moduleFixture.get<EventsService>(EventsService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    rulesService = moduleFixture.get<RulesService>(RulesService);
    questsService = moduleFixture.get<QuestsService>(QuestsService);
    rewardsService = moduleFixture.get<RewardsService>(RewardsService);
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    
    // Mock the profilesService to return a game profile
    jest.spyOn(profilesService, 'findById').mockResolvedValue(baseProfile);
    
    // Mock the kafkaService to produce a message
    jest.spyOn(kafkaService, 'produce').mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Clean up resources after each test
    if (app) {
      await app.close();
    }
    jest.clearAllMocks();
  });

  /**
   * Health Journey Event Tests
   */
  describe('Health Journey Events', () => {
    beforeEach(() => {
      // Mock the profilesService to update the profile with health-specific data
      jest.spyOn(profilesService, 'update').mockImplementation(async (id, data) => ({
        ...baseProfile,
        xp: data.xp || baseProfile.xp,
        achievements: data.achievements || baseProfile.achievements,
        quests: data.quests || baseProfile.quests,
      }));
    });

    it('should process STEPS_RECORDED event and award XP', async () => {
      // Mock the rulesService to return a rule for steps
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-steps',
          event: 'STEPS_RECORDED',
          condition: 'event.data.steps >= 5000',
          actions: JSON.stringify([{ type: 'AWARD_XP', value: 50 }]),
          journey: 'health',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

      const eventData = {
        type: 'STEPS_RECORDED',
        userId,
        data: { steps: 5000 },
        journey: 'health',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 50,
          profile: expect.objectContaining({
            userId,
            xp: 50,
          }),
        }),
      );
      
      expect(rulesService.evaluateRule).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { steps: 5000 } })
      );
    });

    it('should process GOAL_COMPLETED event and unlock achievement', async () => {
      // Mock the rulesService to return a rule for goal completion
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-goal',
          event: 'GOAL_COMPLETED',
          condition: 'event.data.goalType === "STEPS" && event.data.achieved === true',
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 100 },
            { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'achievement-steps' }
          ]),
          journey: 'health',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Mock achievement service to return an achievement
      jest.spyOn(achievementsService, 'findById').mockResolvedValue({
        id: 'achievement-steps',
        name: 'Step Master',
        description: 'Complete a steps goal',
        xpReward: 100,
        journey: 'health',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock achievement unlocking
      jest.spyOn(achievementsService, 'unlockForUser').mockResolvedValue({
        id: 'user-achievement-1',
        userId,
        achievementId: 'achievement-steps',
        unlockedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const eventData = {
        type: 'GOAL_COMPLETED',
        userId,
        data: { 
          goalId: 'goal-123',
          goalType: 'STEPS',
          target: 10000,
          achieved: true
        },
        journey: 'health',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 100,
          achievements: expect.arrayContaining([
            expect.objectContaining({
              achievementId: 'achievement-steps',
            }),
          ]),
        }),
      );
      
      expect(achievementsService.unlockForUser).toHaveBeenCalledWith(
        userId,
        'achievement-steps'
      );
    });

    it('should process HEALTH_METRIC_RECORDED event and update quest progress', async () => {
      // Mock the rulesService to return a rule for health metrics
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-metric',
          event: 'HEALTH_METRIC_RECORDED',
          condition: 'event.data.metricType === "HEART_RATE"',
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 25 },
            { type: 'UPDATE_QUEST_PROGRESS', questId: 'quest-health-tracking', progress: 1 }
          ]),
          journey: 'health',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Mock quest service to return a quest
      jest.spyOn(questsService, 'findById').mockResolvedValue({
        id: 'quest-health-tracking',
        name: 'Health Tracker',
        description: 'Record different health metrics',
        requiredProgress: 5,
        xpReward: 200,
        journey: 'health',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock quest progress update
      jest.spyOn(questsService, 'updateUserQuestProgress').mockResolvedValue({
        id: 'user-quest-1',
        userId,
        questId: 'quest-health-tracking',
        currentProgress: 3, // Assuming this is the 3rd metric recorded
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const eventData = {
        type: 'HEALTH_METRIC_RECORDED',
        userId,
        data: { 
          metricId: 'metric-123',
          metricType: 'HEART_RATE',
          value: 72,
          unit: 'bpm'
        },
        journey: 'health',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 25,
          quests: expect.arrayContaining([
            expect.objectContaining({
              questId: 'quest-health-tracking',
              currentProgress: 3,
            }),
          ]),
        }),
      );
      
      expect(questsService.updateUserQuestProgress).toHaveBeenCalledWith(
        userId,
        'quest-health-tracking',
        1
      );
    });

    it('should process DEVICE_SYNCED event and award XP', async () => {
      // Mock the rulesService to return a rule for device syncing
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-device',
          event: 'DEVICE_SYNCED',
          condition: 'true', // Always trigger for any device sync
          actions: JSON.stringify([{ type: 'AWARD_XP', value: 15 }]),
          journey: 'health',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

      const eventData = {
        type: 'DEVICE_SYNCED',
        userId,
        data: { 
          deviceId: 'device-123',
          deviceType: 'SMARTWATCH',
          syncedAt: new Date().toISOString()
        },
        journey: 'health',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 15,
          profile: expect.objectContaining({
            userId,
            xp: 15,
          }),
        }),
      );
    });
  });

  /**
   * Care Journey Event Tests
   */
  describe('Care Journey Events', () => {
    beforeEach(() => {
      // Mock the profilesService to update the profile with care-specific data
      jest.spyOn(profilesService, 'update').mockImplementation(async (id, data) => ({
        ...baseProfile,
        xp: data.xp || baseProfile.xp,
        achievements: data.achievements || baseProfile.achievements,
        quests: data.quests || baseProfile.quests,
      }));
    });

    it('should process APPOINTMENT_BOOKED event and award XP', async () => {
      // Mock the rulesService to return a rule for appointment booking
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-appointment',
          event: 'APPOINTMENT_BOOKED',
          condition: 'true', // Always trigger for any appointment
          actions: JSON.stringify([{ type: 'AWARD_XP', value: 30 }]),
          journey: 'care',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

      const eventData = {
        type: 'APPOINTMENT_BOOKED',
        userId,
        data: { 
          appointmentId: 'appointment-123',
          providerId: 'provider-456',
          appointmentType: 'IN_PERSON',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        },
        journey: 'care',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 30,
          profile: expect.objectContaining({
            userId,
            xp: 30,
          }),
        }),
      );
    });

    it('should process MEDICATION_ADHERENCE event and update quest progress', async () => {
      // Mock the rulesService to return a rule for medication adherence
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-medication',
          event: 'MEDICATION_ADHERENCE',
          condition: 'event.data.taken === true',
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 20 },
            { type: 'UPDATE_QUEST_PROGRESS', questId: 'quest-medication-adherence', progress: 1 }
          ]),
          journey: 'care',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Mock quest service to return a quest
      jest.spyOn(questsService, 'findById').mockResolvedValue({
        id: 'quest-medication-adherence',
        name: 'Medication Master',
        description: 'Take your medications on time for 7 days',
        requiredProgress: 7,
        xpReward: 150,
        journey: 'care',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock quest progress update
      jest.spyOn(questsService, 'updateUserQuestProgress').mockResolvedValue({
        id: 'user-quest-2',
        userId,
        questId: 'quest-medication-adherence',
        currentProgress: 5, // 5th day of taking medication
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const eventData = {
        type: 'MEDICATION_ADHERENCE',
        userId,
        data: { 
          medicationId: 'medication-123',
          medicationName: 'Test Medication',
          scheduledTime: new Date().toISOString(),
          taken: true,
          takenAt: new Date().toISOString()
        },
        journey: 'care',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 20,
          quests: expect.arrayContaining([
            expect.objectContaining({
              questId: 'quest-medication-adherence',
              currentProgress: 5,
            }),
          ]),
        }),
      );
      
      expect(questsService.updateUserQuestProgress).toHaveBeenCalledWith(
        userId,
        'quest-medication-adherence',
        1
      );
    });

    it('should process TELEMEDICINE_SESSION_COMPLETED event and unlock achievement', async () => {
      // Mock the rulesService to return a rule for telemedicine sessions
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-telemedicine',
          event: 'TELEMEDICINE_SESSION_COMPLETED',
          condition: 'event.data.duration >= 10', // At least 10 minutes
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 75 },
            { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'achievement-telemedicine' }
          ]),
          journey: 'care',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Mock achievement service to return an achievement
      jest.spyOn(achievementsService, 'findById').mockResolvedValue({
        id: 'achievement-telemedicine',
        name: 'Virtual Care Pioneer',
        description: 'Complete your first telemedicine session',
        xpReward: 75,
        journey: 'care',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock achievement unlocking
      jest.spyOn(achievementsService, 'unlockForUser').mockResolvedValue({
        id: 'user-achievement-2',
        userId,
        achievementId: 'achievement-telemedicine',
        unlockedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const eventData = {
        type: 'TELEMEDICINE_SESSION_COMPLETED',
        userId,
        data: { 
          sessionId: 'session-123',
          providerId: 'provider-456',
          startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
          endTime: new Date().toISOString(),
          duration: 15 // 15 minutes
        },
        journey: 'care',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 75,
          achievements: expect.arrayContaining([
            expect.objectContaining({
              achievementId: 'achievement-telemedicine',
            }),
          ]),
        }),
      );
      
      expect(achievementsService.unlockForUser).toHaveBeenCalledWith(
        userId,
        'achievement-telemedicine'
      );
    });
  });

  /**
   * Plan Journey Event Tests
   */
  describe('Plan Journey Events', () => {
    beforeEach(() => {
      // Mock the profilesService to update the profile with plan-specific data
      jest.spyOn(profilesService, 'update').mockImplementation(async (id, data) => ({
        ...baseProfile,
        xp: data.xp || baseProfile.xp,
        achievements: data.achievements || baseProfile.achievements,
        quests: data.quests || baseProfile.quests,
      }));
    });

    it('should process CLAIM_SUBMITTED event and award XP', async () => {
      // Mock the rulesService to return a rule for claim submission
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-claim',
          event: 'CLAIM_SUBMITTED',
          condition: 'event.data.amount > 0',
          actions: JSON.stringify([{ type: 'AWARD_XP', value: 40 }]),
          journey: 'plan',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

      const eventData = {
        type: 'CLAIM_SUBMITTED',
        userId,
        data: { 
          claimId: 'claim-123',
          planId: 'plan-456',
          amount: 150.00,
          serviceDate: new Date().toISOString(),
          providerName: 'Test Provider'
        },
        journey: 'plan',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 40,
          profile: expect.objectContaining({
            userId,
            xp: 40,
          }),
        }),
      );
    });

    it('should process BENEFIT_UTILIZED event and update quest progress', async () => {
      // Mock the rulesService to return a rule for benefit utilization
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-benefit',
          event: 'BENEFIT_UTILIZED',
          condition: 'true', // Always trigger
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 35 },
            { type: 'UPDATE_QUEST_PROGRESS', questId: 'quest-benefit-utilization', progress: 1 }
          ]),
          journey: 'plan',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Mock quest service to return a quest
      jest.spyOn(questsService, 'findById').mockResolvedValue({
        id: 'quest-benefit-utilization',
        name: 'Benefit Explorer',
        description: 'Utilize 3 different benefits from your plan',
        requiredProgress: 3,
        xpReward: 200,
        journey: 'plan',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock quest progress update
      jest.spyOn(questsService, 'updateUserQuestProgress').mockResolvedValue({
        id: 'user-quest-3',
        userId,
        questId: 'quest-benefit-utilization',
        currentProgress: 2, // 2nd benefit utilized
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const eventData = {
        type: 'BENEFIT_UTILIZED',
        userId,
        data: { 
          benefitId: 'benefit-123',
          planId: 'plan-456',
          benefitType: 'WELLNESS',
          utilizationDate: new Date().toISOString(),
          description: 'Gym membership discount'
        },
        journey: 'plan',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 35,
          quests: expect.arrayContaining([
            expect.objectContaining({
              questId: 'quest-benefit-utilization',
              currentProgress: 2,
            }),
          ]),
        }),
      );
      
      expect(questsService.updateUserQuestProgress).toHaveBeenCalledWith(
        userId,
        'quest-benefit-utilization',
        1
      );
    });

    it('should process REWARD_REDEEMED event and update profile', async () => {
      // Mock the rulesService to return a rule for reward redemption
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-reward',
          event: 'REWARD_REDEEMED',
          condition: 'true', // Always trigger
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 25 }
          ]),
          journey: 'plan',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Mock reward service
      jest.spyOn(rewardsService, 'findById').mockResolvedValue({
        id: 'reward-123',
        name: 'Premium Discount',
        description: 'Get a discount on your next premium payment',
        cost: 500, // XP cost
        journey: 'plan',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock reward redemption
      jest.spyOn(rewardsService, 'redeemForUser').mockResolvedValue({
        id: 'user-reward-1',
        userId,
        rewardId: 'reward-123',
        redeemedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const eventData = {
        type: 'REWARD_REDEEMED',
        userId,
        data: { 
          rewardId: 'reward-123',
          redeemedAt: new Date().toISOString(),
          xpCost: 500
        },
        journey: 'plan',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 25,
          profile: expect.objectContaining({
            userId,
            xp: 25,
          }),
        }),
      );
    });
  });

  /**
   * Cross-Journey Achievement Tests
   */
  describe('Cross-Journey Achievements', () => {
    beforeEach(() => {
      // Mock the profilesService to update the profile with cross-journey data
      jest.spyOn(profilesService, 'update').mockImplementation(async (id, data) => ({
        ...baseProfile,
        xp: data.xp || baseProfile.xp,
        achievements: data.achievements || baseProfile.achievements,
        quests: data.quests || baseProfile.quests,
      }));
      
      // Mock the profilesService to return a profile with existing achievements
      jest.spyOn(profilesService, 'findById').mockResolvedValue({
        ...baseProfile,
        achievements: [
          {
            id: 'user-achievement-health',
            userId,
            achievementId: 'achievement-steps',
            unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'user-achievement-care',
            userId,
            achievementId: 'achievement-telemedicine',
            unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          }
        ]
      });
    });

    it('should unlock cross-journey achievement when completing achievements from all journeys', async () => {
      // Mock the rulesService to return a rule for cross-journey achievement
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([
        {
          id: 'rule-cross-journey',
          event: 'CLAIM_APPROVED',
          condition: `
            // Check if user has achievements from all three journeys
            const hasHealthAchievement = profile.achievements.some(a => a.achievementId === 'achievement-steps');
            const hasCareAchievement = profile.achievements.some(a => a.achievementId === 'achievement-telemedicine');
            const hasPlanAchievement = true; // This event will trigger the plan achievement
            
            return hasHealthAchievement && hasCareAchievement && hasPlanAchievement;
          `,
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 50 },
            { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'achievement-cross-journey' }
          ]),
          journey: 'plan', // Event is from plan journey
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      // Mock rule evaluation to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Mock achievement service to return the cross-journey achievement
      jest.spyOn(achievementsService, 'findById').mockResolvedValue({
        id: 'achievement-cross-journey',
        name: 'Journey Master',
        description: 'Complete achievements across all three journeys',
        xpReward: 200,
        journey: 'all', // Cross-journey achievement
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock achievement unlocking
      jest.spyOn(achievementsService, 'unlockForUser').mockResolvedValue({
        id: 'user-achievement-cross',
        userId,
        achievementId: 'achievement-cross-journey',
        unlockedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const eventData = {
        type: 'CLAIM_APPROVED',
        userId,
        data: { 
          claimId: 'claim-123',
          planId: 'plan-456',
          amount: 150.00,
          approvedAt: new Date().toISOString()
        },
        journey: 'plan',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 50,
          achievements: expect.arrayContaining([
            expect.objectContaining({
              achievementId: 'achievement-cross-journey',
            }),
          ]),
        }),
      );
      
      expect(achievementsService.unlockForUser).toHaveBeenCalledWith(
        userId,
        'achievement-cross-journey'
      );
    });

    it('should process events from different journeys in sequence and update profile correctly', async () => {
      // Set up a sequence of events from different journeys
      const events = [
        {
          type: 'STEPS_RECORDED',
          userId,
          data: { steps: 8000 },
          journey: 'health',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          type: 'APPOINTMENT_BOOKED',
          userId,
          data: { 
            appointmentId: 'appointment-123',
            providerId: 'provider-456',
            appointmentType: 'IN_PERSON',
            scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
          },
          journey: 'care',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        },
        {
          type: 'CLAIM_SUBMITTED',
          userId,
          data: { 
            claimId: 'claim-123',
            planId: 'plan-456',
            amount: 150.00,
            serviceDate: new Date().toISOString(),
            providerName: 'Test Provider'
          },
          journey: 'plan',
          timestamp: new Date().toISOString(), // Now
        }
      ];
      
      // Mock the rulesService to return different rules for each event type
      jest.spyOn(rulesService, 'findAll').mockImplementation(async (options) => {
        const eventType = options?.where?.event;
        
        switch (eventType) {
          case 'STEPS_RECORDED':
            return [{
              id: 'rule-steps',
              event: 'STEPS_RECORDED',
              condition: 'event.data.steps >= 5000',
              actions: JSON.stringify([{ type: 'AWARD_XP', value: 50 }]),
              journey: 'health',
              createdAt: new Date(),
              updatedAt: new Date(),
            }];
          case 'APPOINTMENT_BOOKED':
            return [{
              id: 'rule-appointment',
              event: 'APPOINTMENT_BOOKED',
              condition: 'true',
              actions: JSON.stringify([{ type: 'AWARD_XP', value: 30 }]),
              journey: 'care',
              createdAt: new Date(),
              updatedAt: new Date(),
            }];
          case 'CLAIM_SUBMITTED':
            return [{
              id: 'rule-claim',
              event: 'CLAIM_SUBMITTED',
              condition: 'event.data.amount > 0',
              actions: JSON.stringify([{ type: 'AWARD_XP', value: 40 }]),
              journey: 'plan',
              createdAt: new Date(),
              updatedAt: new Date(),
            }];
          default:
            return [];
        }
      });
      
      // Mock rule evaluation to return true for all events
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Mock the profilesService to accumulate XP across events
      let accumulatedXp = 0;
      jest.spyOn(profilesService, 'update').mockImplementation(async (id, data) => {
        if (data.xp) {
          accumulatedXp += data.xp;
        }
        return {
          ...baseProfile,
          xp: accumulatedXp,
          achievements: data.achievements || baseProfile.achievements,
          quests: data.quests || baseProfile.quests,
        };
      });

      // Process each event in sequence
      for (const event of events) {
        const response = await request(app.getHttpServer())
          .post('/events')
          .send(event)
          .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.success).toBe(true);
      }
      
      // After all events, the total XP should be the sum of all awards
      expect(accumulatedXp).toBe(120); // 50 + 30 + 40
      
      // The rulesService.findAll should have been called 3 times (once for each event)
      expect(rulesService.findAll).toHaveBeenCalledTimes(3);
      
      // The profilesService.update should have been called 3 times (once for each event)
      expect(profilesService.update).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * Event Validation Tests
   */
  describe('Event Validation', () => {
    it('should reject events with missing required fields', async () => {
      const invalidEvents = [
        // Missing type
        {
          userId,
          data: { steps: 5000 },
          journey: 'health',
          timestamp: new Date().toISOString(),
        },
        // Missing userId
        {
          type: 'STEPS_RECORDED',
          data: { steps: 5000 },
          journey: 'health',
          timestamp: new Date().toISOString(),
        },
        // Missing journey
        {
          type: 'STEPS_RECORDED',
          userId,
          data: { steps: 5000 },
          timestamp: new Date().toISOString(),
        },
        // Invalid journey value
        {
          type: 'STEPS_RECORDED',
          userId,
          data: { steps: 5000 },
          journey: 'invalid-journey',
          timestamp: new Date().toISOString(),
        }
      ];

      for (const event of invalidEvents) {
        const response = await request(app.getHttpServer())
          .post('/events')
          .send(event)
          .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should handle events with no matching rules gracefully', async () => {
      // Mock the rulesService to return no rules
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([]);

      const eventData = {
        type: 'CUSTOM_EVENT',
        userId,
        data: { customField: 'value' },
        journey: 'health',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 0, // No points awarded
          message: expect.stringContaining('No matching rules found'),
        }),
      );
    });
  });
});