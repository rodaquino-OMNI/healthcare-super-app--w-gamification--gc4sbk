import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, beforeAll, afterAll, expect, beforeEach } from '@jest/globals';
import * as request from 'supertest';
import { JwtAuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@nestjs/passport';
import { AppModule } from '../app.module';
import { ProfilesService } from '@app/gamification/profiles/profiles.service';
import { AchievementsService } from '@app/gamification/achievements/achievements.service';
import { EventsService } from '@app/gamification/events/events.service';
import { PrismaService } from '@app/shared/database/prisma.service';
import { JourneyType } from '@austa/interfaces';

/**
 * End-to-end tests for the ProfilesController.
 * These tests verify user profile management, XP accumulation, level progression,
 * and achievement tracking across journeys.
 */
describe('ProfilesController (e2e)', () => {
  let app: INestApplication;
  let profilesService: ProfilesService;
  let achievementsService: AchievementsService;
  let eventsService: EventsService;
  let prismaService: PrismaService;
  
  // Test user IDs
  const testUserId = 'test-user-123';
  const nonExistentUserId = 'non-existent-user';

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

    // Get service instances for test setup and assertions
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    eventsService = moduleFixture.get<EventsService>(EventsService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up the database after tests
    await prismaService.gameProfile.deleteMany({
      where: {
        userId: {
          in: [testUserId]
        }
      }
    });
    
    // Close the application after all tests
    await app.close();
  });

  beforeEach(async () => {
    // Clean up the test user profile before each test to ensure a clean state
    await prismaService.gameProfile.deleteMany({
      where: {
        userId: testUserId
      }
    });
  });

  describe('Profile Creation', () => {
    it('POST /profiles - Should create a new profile', () => {
      return request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: testUserId,
              level: 1,
              xp: 0
            })
          );
        });
    });

    it('POST /profiles - Should return existing profile if already exists', async () => {
      // First create a profile
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId });
      
      // Try to create it again
      return request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: testUserId,
              level: 1,
              xp: 0
            })
          );
        });
    });

    it('POST /profiles - Should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/profiles')
        .send({}) // Missing userId
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Profile Retrieval', () => {
    it('GET /profiles/:userId - Should retrieve an existing profile', async () => {
      // First create a profile
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId });
      
      // Then retrieve it
      return request(app.getHttpServer())
        .get(`/profiles/${testUserId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: testUserId,
              level: 1,
              xp: 0,
              achievements: expect.any(Array),
              quests: expect.any(Array)
            })
          );
        });
    });

    it('GET /profiles/:userId - Should return 404 for non-existent profile', () => {
      return request(app.getHttpServer())
        .get(`/profiles/${nonExistentUserId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Profile Updates', () => {
    it('PATCH /profiles/:userId - Should update an existing profile', async () => {
      // First create a profile
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId });
      
      // Then update it
      const updatedXp = 150;
      const updatedLevel = 2;
      
      return request(app.getHttpServer())
        .patch(`/profiles/${testUserId}`)
        .send({ xp: updatedXp, level: updatedLevel })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: testUserId,
              level: updatedLevel,
              xp: updatedXp
            })
          );
        });
    });

    it('PATCH /profiles/:userId - Should return 404 for non-existent profile', () => {
      return request(app.getHttpServer())
        .patch(`/profiles/${nonExistentUserId}`)
        .send({ xp: 100 })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('XP Accumulation and Level Progression', () => {
    it('Should accumulate XP and progress level through profile updates', async () => {
      // Create a profile
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId });
      
      // Update XP to just below level threshold
      await request(app.getHttpServer())
        .patch(`/profiles/${testUserId}`)
        .send({ xp: 95 });
      
      // Get profile and verify level is still 1
      let response = await request(app.getHttpServer())
        .get(`/profiles/${testUserId}`);
      
      expect(response.body.level).toBe(1);
      expect(response.body.xp).toBe(95);
      
      // Update XP to cross level threshold
      await request(app.getHttpServer())
        .patch(`/profiles/${testUserId}`)
        .send({ xp: 105 });
      
      // Get profile and verify level has increased
      response = await request(app.getHttpServer())
        .get(`/profiles/${testUserId}`);
      
      expect(response.body.level).toBe(2);
      expect(response.body.xp).toBe(105);
    });
  });

  describe('Cross-Journey Achievement Tracking', () => {
    it('Should track achievements across different journeys', async () => {
      // Mock the achievementsService to return achievements from different journeys
      jest.spyOn(achievementsService, 'findAll').mockImplementation(async () => [
        {
          id: 'health-achievement-1',
          name: 'Health Milestone',
          description: 'Complete a health goal',
          journey: JourneyType.HEALTH,
          xpReward: 50,
          conditions: 'event.type === "GOAL_ACHIEVED"',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'care-achievement-1',
          name: 'Care Milestone',
          description: 'Book an appointment',
          journey: JourneyType.CARE,
          xpReward: 30,
          conditions: 'event.type === "APPOINTMENT_BOOKED"',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'plan-achievement-1',
          name: 'Plan Milestone',
          description: 'Submit a claim',
          journey: JourneyType.PLAN,
          xpReward: 40,
          conditions: 'event.type === "CLAIM_SUBMITTED"',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Create a profile with achievements from different journeys
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId });
      
      // Mock the user achievements
      const mockUserAchievements = [
        {
          id: 'user-achievement-1',
          userId: testUserId,
          achievementId: 'health-achievement-1',
          unlockedAt: new Date(),
          progress: 100,
          metadata: { journey: JourneyType.HEALTH },
        },
        {
          id: 'user-achievement-2',
          userId: testUserId,
          achievementId: 'care-achievement-1',
          unlockedAt: new Date(),
          progress: 100,
          metadata: { journey: JourneyType.CARE },
        },
      ];
      
      // Mock the profilesService to include achievements
      jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
        id: 'profile-id',
        userId: testUserId,
        level: 2,
        xp: 80, // 50 from health + 30 from care
        createdAt: new Date(),
        updatedAt: new Date(),
        achievements: mockUserAchievements,
        quests: [],
      }));
      
      // Retrieve the profile
      const response = await request(app.getHttpServer())
        .get(`/profiles/${testUserId}`);
      
      // Verify cross-journey achievements
      expect(response.body.achievements).toHaveLength(2);
      expect(response.body.achievements[0].achievementId).toBe('health-achievement-1');
      expect(response.body.achievements[1].achievementId).toBe('care-achievement-1');
      
      // Verify XP accumulation from different journeys
      expect(response.body.xp).toBe(80); // 50 from health + 30 from care
    });

    it('Should track partial progress on achievements across journeys', async () => {
      // Create a profile
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId });
      
      // Mock achievements with partial progress
      const mockUserAchievements = [
        {
          id: 'user-achievement-1',
          userId: testUserId,
          achievementId: 'health-achievement-1',
          unlockedAt: null, // Not yet unlocked
          progress: 50, // 50% progress
          metadata: { 
            journey: JourneyType.HEALTH,
            stepsCompleted: 5000,
            stepsRequired: 10000
          },
        },
        {
          id: 'user-achievement-2',
          userId: testUserId,
          achievementId: 'care-achievement-1',
          unlockedAt: null, // Not yet unlocked
          progress: 75, // 75% progress
          metadata: { 
            journey: JourneyType.CARE,
            appointmentsScheduled: 3,
            appointmentsRequired: 4
          },
        },
      ];
      
      // Mock the profilesService to include achievements with partial progress
      jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
        id: 'profile-id',
        userId: testUserId,
        level: 1,
        xp: 0, // No XP yet as achievements aren't completed
        createdAt: new Date(),
        updatedAt: new Date(),
        achievements: mockUserAchievements,
        quests: [],
      }));
      
      // Retrieve the profile
      const response = await request(app.getHttpServer())
        .get(`/profiles/${testUserId}`);
      
      // Verify partial progress tracking
      expect(response.body.achievements).toHaveLength(2);
      expect(response.body.achievements[0].progress).toBe(50);
      expect(response.body.achievements[0].unlockedAt).toBeNull();
      expect(response.body.achievements[1].progress).toBe(75);
      expect(response.body.achievements[1].unlockedAt).toBeNull();
    });
  });

  describe('Achievement Notification System', () => {
    it('Should include notification data when achievements are unlocked', async () => {
      // Create a profile
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId });
      
      // Mock a newly unlocked achievement with notification data
      const mockUserAchievements = [
        {
          id: 'user-achievement-1',
          userId: testUserId,
          achievementId: 'health-achievement-1',
          unlockedAt: new Date(), // Just unlocked
          progress: 100,
          metadata: { 
            journey: JourneyType.HEALTH,
            notification: {
              title: 'Achievement Unlocked!',
              message: 'You completed your health goal!',
              imageUrl: 'https://example.com/achievements/health-milestone.png',
              unlockTime: new Date().toISOString()
            }
          },
        }
      ];
      
      // Mock the profilesService to include the newly unlocked achievement
      jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
        id: 'profile-id',
        userId: testUserId,
        level: 1,
        xp: 50, // XP from the unlocked achievement
        createdAt: new Date(),
        updatedAt: new Date(),
        achievements: mockUserAchievements,
        quests: [],
      }));
      
      // Retrieve the profile
      const response = await request(app.getHttpServer())
        .get(`/profiles/${testUserId}`);
      
      // Verify notification data is included
      expect(response.body.achievements).toHaveLength(1);
      expect(response.body.achievements[0].metadata.notification).toBeDefined();
      expect(response.body.achievements[0].metadata.notification.title).toBe('Achievement Unlocked!');
      expect(response.body.achievements[0].metadata.notification.message).toBe('You completed your health goal!');
      expect(response.body.achievements[0].metadata.notification.imageUrl).toBeDefined();
      expect(response.body.achievements[0].metadata.notification.unlockTime).toBeDefined();
    });
  });

  describe('Reward Distribution Mechanisms', () => {
    it('Should track rewards associated with achievements', async () => {
      // Create a profile
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId });
      
      // Mock achievements with rewards
      const mockUserAchievements = [
        {
          id: 'user-achievement-1',
          userId: testUserId,
          achievementId: 'health-achievement-1',
          unlockedAt: new Date(),
          progress: 100,
          metadata: { 
            journey: JourneyType.HEALTH,
            rewards: [
              {
                id: 'reward-1',
                name: 'Health Badge',
                type: 'BADGE',
                imageUrl: 'https://example.com/rewards/health-badge.png',
                awardedAt: new Date().toISOString()
              },
              {
                id: 'reward-2',
                name: 'Discount Coupon',
                type: 'COUPON',
                code: 'HEALTH10',
                value: '10%',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
              }
            ]
          },
        }
      ];
      
      // Mock the profilesService to include achievements with rewards
      jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
        id: 'profile-id',
        userId: testUserId,
        level: 1,
        xp: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        achievements: mockUserAchievements,
        quests: [],
      }));
      
      // Retrieve the profile
      const response = await request(app.getHttpServer())
        .get(`/profiles/${testUserId}`);
      
      // Verify rewards are included
      expect(response.body.achievements).toHaveLength(1);
      expect(response.body.achievements[0].metadata.rewards).toHaveLength(2);
      expect(response.body.achievements[0].metadata.rewards[0].type).toBe('BADGE');
      expect(response.body.achievements[0].metadata.rewards[1].type).toBe('COUPON');
      expect(response.body.achievements[0].metadata.rewards[1].code).toBe('HEALTH10');
    });
  });
});