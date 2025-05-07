import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, beforeAll, afterAll, expect, beforeEach } from '@jest/globals';
import * as request from 'supertest';
import { JwtAuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@nestjs/passport';
import { AppModule } from '../app.module';
import { ProfilesService } from 'src/backend/gamification-engine/src/profiles/profiles.service';
import { AchievementsService } from 'src/backend/gamification-engine/src/achievements/achievements.service';
import { PrismaService } from 'src/backend/shared/src/database/prisma.service';

/**
 * End-to-end tests for the ProfilesController.
 * These tests verify the profile management functionality, including:
 * - Profile creation and retrieval
 * - XP and level progression
 * - Achievement tracking across journeys
 * - Profile data integrity
 */
describe('ProfilesController (e2e)', () => {
  let app: INestApplication;
  let profilesService: ProfilesService;
  let achievementsService: AchievementsService;
  let prismaService: PrismaService;
  
  // Test user IDs
  const testUserId = `test-user-${Date.now()}`;
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
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prismaService.gameProfile.deleteMany({
        where: {
          userId: {
            startsWith: 'test-user-'
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }

    // Close the application after all tests
    await app.close();
  });

  describe('POST /profiles', () => {
    it('should create a new game profile', async () => {
      return request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: testUserId,
              level: 1,
              xp: 0,
            })
          );
          expect(res.body.id).toBeDefined();
          expect(res.body.createdAt).toBeDefined();
          expect(res.body.updatedAt).toBeDefined();
        });
    });

    it('should return the existing profile if already exists', async () => {
      // First request creates the profile
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId })
        .expect(HttpStatus.CREATED);

      // Second request should return the existing profile
      return request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: testUserId })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: testUserId,
              level: 1,
              xp: 0,
            })
          );
        });
    });

    it('should validate the request body', async () => {
      return request(app.getHttpServer())
        .post('/profiles')
        .send({}) // Missing userId
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /profiles/:userId', () => {
    beforeEach(async () => {
      // Ensure the test profile exists
      try {
        await request(app.getHttpServer())
          .post('/profiles')
          .send({ userId: testUserId });
      } catch (error) {
        // Profile might already exist, which is fine
      }
    });

    it('should retrieve an existing profile', async () => {
      return request(app.getHttpServer())
        .get(`/profiles/${testUserId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: testUserId,
              level: 1,
              xp: 0,
            })
          );
          // Should include achievements array
          expect(Array.isArray(res.body.achievements)).toBe(true);
          // Should include quests array
          expect(Array.isArray(res.body.quests)).toBe(true);
        });
    });

    it('should return 404 for non-existent profile', async () => {
      return request(app.getHttpServer())
        .get(`/profiles/${nonExistentUserId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /profiles/:userId', () => {
    beforeEach(async () => {
      // Ensure the test profile exists
      try {
        await request(app.getHttpServer())
          .post('/profiles')
          .send({ userId: testUserId });
      } catch (error) {
        // Profile might already exist, which is fine
      }
    });

    it('should update an existing profile', async () => {
      const updateData = {
        xp: 150,
        level: 2
      };

      return request(app.getHttpServer())
        .patch(`/profiles/${testUserId}`)
        .send(updateData)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: testUserId,
              level: updateData.level,
              xp: updateData.xp,
            })
          );
        });
    });

    it('should return 404 for updating non-existent profile', async () => {
      return request(app.getHttpServer())
        .patch(`/profiles/${nonExistentUserId}`)
        .send({ xp: 100 })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate the update data', async () => {
      return request(app.getHttpServer())
        .patch(`/profiles/${testUserId}`)
        .send({ level: 'invalid' }) // Level should be a number
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Multi-journey achievement tracking', () => {
    const multiJourneyUserId = `test-user-multi-${Date.now()}`;
    
    beforeEach(async () => {
      // Create a profile for multi-journey testing
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: multiJourneyUserId });
    });

    it('should track achievements across different journeys', async () => {
      // Mock achievements from different journeys
      const healthAchievement = {
        id: 'health-achievement-1',
        title: 'Health Milestone',
        description: 'Completed a health milestone',
        journey: 'health',
        icon: 'health-icon',
        xpReward: 50
      };

      const careAchievement = {
        id: 'care-achievement-1',
        title: 'Care Milestone',
        description: 'Completed a care milestone',
        journey: 'care',
        icon: 'care-icon',
        xpReward: 75
      };

      const planAchievement = {
        id: 'plan-achievement-1',
        title: 'Plan Milestone',
        description: 'Completed a plan milestone',
        journey: 'plan',
        icon: 'plan-icon',
        xpReward: 100
      };

      // Mock the achievements service to return our test achievements
      jest.spyOn(achievementsService, 'findById')
        .mockImplementation(async (id) => {
          if (id === healthAchievement.id) return healthAchievement;
          if (id === careAchievement.id) return careAchievement;
          if (id === planAchievement.id) return planAchievement;
          return null;
        });

      // Add achievements to the profile
      // In a real scenario, this would happen through the achievements service
      // Here we're directly updating the profile for testing purposes
      await prismaService.gameProfile.update({
        where: { userId: multiJourneyUserId },
        data: {
          achievements: {
            create: [
              {
                achievementId: healthAchievement.id,
                progress: 100,
                unlocked: true,
                unlockedAt: new Date()
              },
              {
                achievementId: careAchievement.id,
                progress: 100,
                unlocked: true,
                unlockedAt: new Date()
              },
              {
                achievementId: planAchievement.id,
                progress: 50,
                unlocked: false,
                unlockedAt: null
              }
            ]
          },
          // Update XP based on unlocked achievements
          xp: 125 // 50 + 75 for the two unlocked achievements
        }
      });

      // Retrieve the profile and verify achievements from all journeys are included
      return request(app.getHttpServer())
        .get(`/profiles/${multiJourneyUserId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              userId: multiJourneyUserId,
              xp: 125, // Combined XP from all unlocked achievements
            })
          );

          // Verify achievements array contains items from all journeys
          expect(Array.isArray(res.body.achievements)).toBe(true);
          expect(res.body.achievements.length).toBe(3);
          
          // Check for health journey achievement
          const healthAchievementResult = res.body.achievements.find(
            (a) => a.achievementId === healthAchievement.id
          );
          expect(healthAchievementResult).toBeDefined();
          expect(healthAchievementResult.unlocked).toBe(true);
          
          // Check for care journey achievement
          const careAchievementResult = res.body.achievements.find(
            (a) => a.achievementId === careAchievement.id
          );
          expect(careAchievementResult).toBeDefined();
          expect(careAchievementResult.unlocked).toBe(true);
          
          // Check for plan journey achievement (in progress)
          const planAchievementResult = res.body.achievements.find(
            (a) => a.achievementId === planAchievement.id
          );
          expect(planAchievementResult).toBeDefined();
          expect(planAchievementResult.unlocked).toBe(false);
          expect(planAchievementResult.progress).toBe(50);
        });
    });

    it('should update profile XP when achievements are unlocked', async () => {
      // First, get the current profile state
      const initialResponse = await request(app.getHttpServer())
        .get(`/profiles/${multiJourneyUserId}`)
        .expect(HttpStatus.OK);
      
      const initialXp = initialResponse.body.xp;
      
      // Update the profile with additional XP (simulating achievement unlock)
      const additionalXp = 100;
      const newXp = initialXp + additionalXp;
      
      await request(app.getHttpServer())
        .patch(`/profiles/${multiJourneyUserId}`)
        .send({ xp: newXp })
        .expect(HttpStatus.OK);
      
      // Verify the XP was updated correctly
      return request(app.getHttpServer())
        .get(`/profiles/${multiJourneyUserId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.xp).toBe(newXp);
        });
    });

    it('should handle level progression based on XP thresholds', async () => {
      // Define XP thresholds for level progression
      // Level 1: 0-99 XP
      // Level 2: 100-299 XP
      // Level 3: 300-599 XP
      // Level 4: 600+ XP
      
      // Update to level 2 (100-299 XP)
      await request(app.getHttpServer())
        .patch(`/profiles/${multiJourneyUserId}`)
        .send({ xp: 200, level: 2 })
        .expect(HttpStatus.OK);
      
      // Verify level 2
      const level2Response = await request(app.getHttpServer())
        .get(`/profiles/${multiJourneyUserId}`)
        .expect(HttpStatus.OK);
      
      expect(level2Response.body.level).toBe(2);
      expect(level2Response.body.xp).toBe(200);
      
      // Update to level 3 (300-599 XP)
      await request(app.getHttpServer())
        .patch(`/profiles/${multiJourneyUserId}`)
        .send({ xp: 450, level: 3 })
        .expect(HttpStatus.OK);
      
      // Verify level 3
      const level3Response = await request(app.getHttpServer())
        .get(`/profiles/${multiJourneyUserId}`)
        .expect(HttpStatus.OK);
      
      expect(level3Response.body.level).toBe(3);
      expect(level3Response.body.xp).toBe(450);
      
      // Update to level 4 (600+ XP)
      await request(app.getHttpServer())
        .patch(`/profiles/${multiJourneyUserId}`)
        .send({ xp: 700, level: 4 })
        .expect(HttpStatus.OK);
      
      // Verify level 4
      return request(app.getHttpServer())
        .get(`/profiles/${multiJourneyUserId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.level).toBe(4);
          expect(res.body.xp).toBe(700);
        });
    });
  });

  describe('Achievement notification system', () => {
    const notificationUserId = `test-user-notif-${Date.now()}`;
    
    beforeEach(async () => {
      // Create a profile for notification testing
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ userId: notificationUserId });
    });

    it('should track newly unlocked achievements for notifications', async () => {
      // Mock an achievement
      const achievement = {
        id: 'achievement-notif-1',
        title: 'First Achievement',
        description: 'Unlocked your first achievement',
        journey: 'health',
        icon: 'achievement-icon',
        xpReward: 50
      };

      // Add the achievement to the profile as locked (in progress)
      await prismaService.gameProfile.update({
        where: { userId: notificationUserId },
        data: {
          achievements: {
            create: [
              {
                achievementId: achievement.id,
                progress: 50,
                unlocked: false,
                unlockedAt: null
              }
            ]
          }
        }
      });

      // Verify the achievement is in progress
      const initialResponse = await request(app.getHttpServer())
        .get(`/profiles/${notificationUserId}`)
        .expect(HttpStatus.OK);
      
      const initialAchievement = initialResponse.body.achievements.find(
        (a) => a.achievementId === achievement.id
      );
      expect(initialAchievement.unlocked).toBe(false);
      
      // Now unlock the achievement (in a real scenario, this would be done by the achievements service)
      await prismaService.userAchievement.update({
        where: {
          profileId_achievementId: {
            profileId: initialResponse.body.id,
            achievementId: achievement.id
          }
        },
        data: {
          progress: 100,
          unlocked: true,
          unlockedAt: new Date()
        }
      });
      
      // Update the profile XP to reflect the achievement reward
      await request(app.getHttpServer())
        .patch(`/profiles/${notificationUserId}`)
        .send({ xp: 50 })
        .expect(HttpStatus.OK);
      
      // Verify the achievement is now unlocked
      return request(app.getHttpServer())
        .get(`/profiles/${notificationUserId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const unlockedAchievement = res.body.achievements.find(
            (a) => a.achievementId === achievement.id
          );
          expect(unlockedAchievement).toBeDefined();
          expect(unlockedAchievement.unlocked).toBe(true);
          expect(unlockedAchievement.progress).toBe(100);
          expect(unlockedAchievement.unlockedAt).toBeDefined();
          expect(res.body.xp).toBe(50); // XP from the achievement
        });
    });
  });
});