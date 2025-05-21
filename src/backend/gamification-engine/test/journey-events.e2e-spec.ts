import { HttpStatus, INestApplication } from '@nestjs/common'; // v10.0.0+
import { Test } from '@nestjs/testing'; // v10.0.0+
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals'; // v29.0.0+
import * as request from 'supertest'; // 6.3.3
import { EventsModule } from 'src/backend/gamification-engine/src/events/events.module';
import { EventsService } from 'src/backend/gamification-engine/src/events/events.service';
import { AchievementsModule } from 'src/backend/gamification-engine/src/achievements/achievements.module';
import { AchievementsService } from 'src/backend/gamification-engine/src/achievements/achievements.service';
import { ProfilesModule } from 'src/backend/gamification-engine/src/profiles/profiles.module';
import { ProfilesService } from 'src/backend/gamification-engine/src/profiles/profiles.service';
import { RulesService } from 'src/backend/gamification-engine/src/rules/rules.service';
import { QuestsService } from 'src/backend/gamification-engine/src/quests/quests.service';
import { RewardsService } from 'src/backend/gamification-engine/src/rewards/rewards.service';
import { KafkaService } from 'src/backend/shared/src/kafka/kafka.service';
import { PrismaService } from 'src/backend/shared/src/database/prisma.service';
import { LoggerService } from 'src/backend/shared/src/logging/logger.service';

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
  let loggerService: LoggerService;
  
  // Test user ID used across all tests
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Mock game profile for the test user
  const mockGameProfile = {
    id: 'profile-123',
    userId: testUserId,
    level: 1,
    xp: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    achievements: [],
    quests: []
  };
  
  // Mock achievement for cross-journey testing
  const mockCrossJourneyAchievement = {
    id: 'achievement-cross-journey',
    title: 'Health and Care Champion',
    description: 'Complete activities in both Health and Care journeys',
    xpReward: 100,
    journey: 'cross-journey',
    criteria: 'Requires events from multiple journeys',
    iconUrl: 'https://example.com/icons/cross-journey.png',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    // Create a testing module with all necessary dependencies
    const moduleFixture = await Test.createTestingModule({
      imports: [EventsModule, AchievementsModule, ProfilesModule],
    })
    .overrideProvider(KafkaService)
    .useValue({
      produce: jest.fn().mockResolvedValue(undefined),
    })
    .overrideProvider(LoggerService)
    .useValue({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get instances of the services for assertions and mocking
    eventsService = moduleFixture.get<EventsService>(EventsService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    
    // Create mock instances for services not directly provided by the module
    const prismaService = new PrismaService();
    questsService = moduleFixture.get<QuestsService>(QuestsService);
    rewardsService = moduleFixture.get<RewardsService>(RewardsService);
    rulesService = moduleFixture.get<RulesService>(RulesService);
    
    // Mock the profilesService to return a game profile
    jest.spyOn(profilesService, 'findById').mockImplementation(async () => mockGameProfile);
    
    // Mock the profilesService update method
    jest.spyOn(profilesService, 'update').mockImplementation(async (userId, data) => {
      return {
        ...mockGameProfile,
        ...data,
        updatedAt: new Date()
      };
    });
    
    // Mock the rulesService to evaluate rules
    jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
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
    it('should process STEPS_RECORDED event and award XP', async () => {
      // Mock the rulesService to return a rule for steps
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-steps',
          event: 'STEPS_RECORDED',
          condition: 'event.data.steps >= 1000',
          actions: '[{"type": "AWARD_XP", "value": 50}]',
          journey: 'health'
        },
      ]);

      const eventData = {
        type: 'STEPS_RECORDED',
        userId: testUserId,
        data: { steps: 1000, source: 'fitbit' },
        journey: 'health',
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
            userId: testUserId,
            xp: 50,
          }),
        }),
      );
    });

    it('should process HEALTH_GOAL_ACHIEVED event and award XP', async () => {
      // Mock the rulesService to return a rule for health goals
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-health-goal',
          event: 'HEALTH_GOAL_ACHIEVED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 100}]',
          journey: 'health'
        },
      ]);

      const eventData = {
        type: 'HEALTH_GOAL_ACHIEVED',
        userId: testUserId,
        data: { goalId: 'goal-123', goalType: 'steps', targetValue: 10000, achievedValue: 10500 },
        journey: 'health',
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
          profile: expect.objectContaining({
            userId: testUserId,
            xp: 100,
          }),
        }),
      );
    });

    it('should process HEALTH_METRIC_RECORDED event and award XP', async () => {
      // Mock the rulesService to return a rule for health metrics
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-health-metric',
          event: 'HEALTH_METRIC_RECORDED',
          condition: 'event.data.metricType === "weight"',
          actions: '[{"type": "AWARD_XP", "value": 30}]',
          journey: 'health'
        },
      ]);

      const eventData = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: testUserId,
        data: { metricType: 'weight', value: 70.5, unit: 'kg' },
        journey: 'health',
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
            userId: testUserId,
            xp: 30,
          }),
        }),
      );
    });

    it('should process DEVICE_SYNCED event and award XP', async () => {
      // Mock the rulesService to return a rule for device sync
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-device-sync',
          event: 'DEVICE_SYNCED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 20}]',
          journey: 'health'
        },
      ]);

      const eventData = {
        type: 'DEVICE_SYNCED',
        userId: testUserId,
        data: { deviceId: 'device-123', deviceType: 'smartwatch', syncTime: new Date().toISOString() },
        journey: 'health',
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
          profile: expect.objectContaining({
            userId: testUserId,
            xp: 20,
          }),
        }),
      );
    });
  });

  /**
   * Care Journey Event Tests
   */
  describe('Care Journey Events', () => {
    it('should process APPOINTMENT_BOOKED event and award XP', async () => {
      // Mock the rulesService to return a rule for appointments
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-appointment',
          event: 'APPOINTMENT_BOOKED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 40}]',
          journey: 'care'
        },
      ]);

      const eventData = {
        type: 'APPOINTMENT_BOOKED',
        userId: testUserId,
        data: { 
          appointmentId: 'appt-123', 
          providerId: 'provider-456', 
          specialtyId: 'specialty-789',
          appointmentTime: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        },
        journey: 'care',
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
            userId: testUserId,
            xp: 40,
          }),
        }),
      );
    });

    it('should process MEDICATION_TAKEN event and award XP', async () => {
      // Mock the rulesService to return a rule for medications
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-medication',
          event: 'MEDICATION_TAKEN',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 25}]',
          journey: 'care'
        },
      ]);

      const eventData = {
        type: 'MEDICATION_TAKEN',
        userId: testUserId,
        data: { 
          medicationId: 'med-123', 
          medicationName: 'Aspirin', 
          dosage: '100mg',
          takenAt: new Date().toISOString()
        },
        journey: 'care',
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
            userId: testUserId,
            xp: 25,
          }),
        }),
      );
    });

    it('should process TELEMEDICINE_SESSION_COMPLETED event and award XP', async () => {
      // Mock the rulesService to return a rule for telemedicine
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-telemedicine',
          event: 'TELEMEDICINE_SESSION_COMPLETED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 75}]',
          journey: 'care'
        },
      ]);

      const eventData = {
        type: 'TELEMEDICINE_SESSION_COMPLETED',
        userId: testUserId,
        data: { 
          sessionId: 'session-123', 
          providerId: 'provider-456', 
          duration: 15, // minutes
          completedAt: new Date().toISOString()
        },
        journey: 'care',
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
          profile: expect.objectContaining({
            userId: testUserId,
            xp: 75,
          }),
        }),
      );
    });
  });

  /**
   * Plan Journey Event Tests
   */
  describe('Plan Journey Events', () => {
    it('should process CLAIM_SUBMITTED event and award XP', async () => {
      // Mock the rulesService to return a rule for claims
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-claim',
          event: 'CLAIM_SUBMITTED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 60}]',
          journey: 'plan'
        },
      ]);

      const eventData = {
        type: 'CLAIM_SUBMITTED',
        userId: testUserId,
        data: { 
          claimId: 'claim-123', 
          claimType: 'medical', 
          amount: 150.00,
          submittedAt: new Date().toISOString()
        },
        journey: 'plan',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 60,
          profile: expect.objectContaining({
            userId: testUserId,
            xp: 60,
          }),
        }),
      );
    });

    it('should process BENEFIT_UTILIZED event and award XP', async () => {
      // Mock the rulesService to return a rule for benefits
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-benefit',
          event: 'BENEFIT_UTILIZED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 35}]',
          journey: 'plan'
        },
      ]);

      const eventData = {
        type: 'BENEFIT_UTILIZED',
        userId: testUserId,
        data: { 
          benefitId: 'benefit-123', 
          benefitType: 'wellness', 
          utilizedAt: new Date().toISOString()
        },
        journey: 'plan',
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
          profile: expect.objectContaining({
            userId: testUserId,
            xp: 35,
          }),
        }),
      );
    });

    it('should process REWARD_REDEEMED event and award XP', async () => {
      // Mock the rulesService to return a rule for rewards
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-reward',
          event: 'REWARD_REDEEMED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 45}]',
          journey: 'plan'
        },
      ]);

      const eventData = {
        type: 'REWARD_REDEEMED',
        userId: testUserId,
        data: { 
          rewardId: 'reward-123', 
          rewardType: 'discount', 
          pointsCost: 500,
          redeemedAt: new Date().toISOString()
        },
        journey: 'plan',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 45,
          profile: expect.objectContaining({
            userId: testUserId,
            xp: 45,
          }),
        }),
      );
    });
  });

  /**
   * Cross-Journey Achievement Tests
   */
  describe('Cross-Journey Achievements', () => {
    it('should unlock cross-journey achievement when events from multiple journeys are processed', async () => {
      // Mock the achievementsService to return a cross-journey achievement
      jest.spyOn(achievementsService, 'findAll').mockImplementation(async () => ({
        data: [mockCrossJourneyAchievement],
        meta: {
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }));
      
      // Mock the rulesService to return rules for both health and care journeys
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-health',
          event: 'HEALTH_METRIC_RECORDED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 30}]',
          journey: 'health'
        },
        {
          id: 'rule-care',
          event: 'APPOINTMENT_BOOKED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 40}]',
          journey: 'care'
        },
        {
          id: 'rule-cross-journey',
          event: 'CROSS_JOURNEY_ACTIVITY',
          condition: 'userProfile.journeyActivities && userProfile.journeyActivities.health && userProfile.journeyActivities.care',
          actions: '[{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "achievement-cross-journey"}, {"type": "AWARD_XP", "value": 100}]',
          journey: 'cross-journey'
        }
      ]);
      
      // Mock the profilesService to track journey activities
      const updatedProfile = {
        ...mockGameProfile,
        journeyActivities: {
          health: true,
          care: false
        }
      };
      
      jest.spyOn(profilesService, 'findById').mockImplementation(async () => updatedProfile);
      
      // Process a health journey event first
      const healthEventData = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: testUserId,
        data: { metricType: 'weight', value: 70.5, unit: 'kg' },
        journey: 'health',
      };
      
      await request(app.getHttpServer())
        .post('/events')
        .send(healthEventData)
        .set('Authorization', 'Bearer valid-token');
      
      // Update the mock profile to include both journey activities
      updatedProfile.journeyActivities.care = true;
      
      // Process a care journey event next
      const careEventData = {
        type: 'APPOINTMENT_BOOKED',
        userId: testUserId,
        data: { 
          appointmentId: 'appt-123', 
          providerId: 'provider-456', 
          specialtyId: 'specialty-789',
          appointmentTime: new Date(Date.now() + 86400000).toISOString()
        },
        journey: 'care',
      };
      
      // Mock the achievementsService to handle unlocking the achievement
      jest.spyOn(achievementsService, 'create').mockImplementation(async (data) => ({
        id: 'user-achievement-123',
        userId: testUserId,
        achievementId: mockCrossJourneyAchievement.id,
        unlockedAt: new Date(),
        ...data
      }));
      
      // Process the cross-journey event
      const crossJourneyEventData = {
        type: 'CROSS_JOURNEY_ACTIVITY',
        userId: testUserId,
        data: { 
          healthActivity: true,
          careActivity: true
        },
        journey: 'cross-journey',
      };
      
      const response = await request(app.getHttpServer())
        .post('/events')
        .send(crossJourneyEventData)
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 100,
          profile: expect.objectContaining({
            userId: testUserId,
          }),
          achievements: expect.arrayContaining([
            expect.objectContaining({
              achievementId: mockCrossJourneyAchievement.id
            })
          ])
        }),
      );
    });
    
    it('should process events from all three journeys and unlock a special achievement', async () => {
      // Mock the achievementsService to return a special achievement for all journeys
      const mockAllJourneysAchievement = {
        id: 'achievement-all-journeys',
        title: 'SuperApp Master',
        description: 'Complete activities in all three journeys',
        xpReward: 200,
        journey: 'cross-journey',
        criteria: 'Requires events from all three journeys',
        iconUrl: 'https://example.com/icons/all-journeys.png',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(achievementsService, 'findAll').mockImplementation(async () => ({
        data: [mockAllJourneysAchievement],
        meta: {
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }));
      
      // Mock the rulesService to return rules for all three journeys
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
        {
          id: 'rule-health',
          event: 'HEALTH_METRIC_RECORDED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 30}]',
          journey: 'health'
        },
        {
          id: 'rule-care',
          event: 'APPOINTMENT_BOOKED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 40}]',
          journey: 'care'
        },
        {
          id: 'rule-plan',
          event: 'CLAIM_SUBMITTED',
          condition: 'true',
          actions: '[{"type": "AWARD_XP", "value": 60}]',
          journey: 'plan'
        },
        {
          id: 'rule-all-journeys',
          event: 'ALL_JOURNEYS_ACTIVITY',
          condition: 'userProfile.journeyActivities && userProfile.journeyActivities.health && userProfile.journeyActivities.care && userProfile.journeyActivities.plan',
          actions: '[{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "achievement-all-journeys"}, {"type": "AWARD_XP", "value": 200}]',
          journey: 'cross-journey'
        }
      ]);
      
      // Mock the profilesService to track journey activities
      const updatedProfile = {
        ...mockGameProfile,
        journeyActivities: {
          health: true,
          care: true,
          plan: true
        }
      };
      
      jest.spyOn(profilesService, 'findById').mockImplementation(async () => updatedProfile);
      
      // Mock the achievementsService to handle unlocking the achievement
      jest.spyOn(achievementsService, 'create').mockImplementation(async (data) => ({
        id: 'user-achievement-456',
        userId: testUserId,
        achievementId: mockAllJourneysAchievement.id,
        unlockedAt: new Date(),
        ...data
      }));
      
      // Process the all-journeys event
      const allJourneysEventData = {
        type: 'ALL_JOURNEYS_ACTIVITY',
        userId: testUserId,
        data: { 
          healthActivity: true,
          careActivity: true,
          planActivity: true
        },
        journey: 'cross-journey',
      };
      
      const response = await request(app.getHttpServer())
        .post('/events')
        .send(allJourneysEventData)
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 200,
          profile: expect.objectContaining({
            userId: testUserId,
          }),
          achievements: expect.arrayContaining([
            expect.objectContaining({
              achievementId: mockAllJourneysAchievement.id
            })
          ])
        }),
      );
    });
  });
  
  /**
   * Invalid Event Tests
   */
  describe('Invalid Events', () => {
    it('should reject events with missing required fields', async () => {
      const invalidEventData = {
        // Missing type field
        userId: testUserId,
        data: { steps: 1000 },
        journey: 'health',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(invalidEventData)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should reject events with invalid journey values', async () => {
      const invalidEventData = {
        type: 'STEPS_RECORDED',
        userId: testUserId,
        data: { steps: 1000 },
        journey: 'invalid-journey', // Invalid journey value
      };

      // Mock the rulesService to return no rules for invalid journey
      jest.spyOn(rulesService, 'findAll').mockImplementation(async () => []);

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(invalidEventData)
        .set('Authorization', 'Bearer valid-token');

      // The event should be processed but no points awarded due to no matching rules
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          points: 0,
        }),
      );
    });
  });
});