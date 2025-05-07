import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as request from 'supertest';

// Updated import paths using standardized TypeScript path aliases
import { JwtAuthGuard } from '@austa/auth/guards';
import { RolesGuard } from '@austa/auth/guards';
import { AppModule } from '@app/gamification-engine/app.module';
import { AchievementType } from '@app/gamification-engine/achievements/interfaces/achievement-types.enum';
import { AchievementStatus } from '@app/gamification-engine/achievements/interfaces/achievement-status.enum';
import { ErrorResponse } from '@austa/errors/interfaces';

describe('AchievementsController (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    // Close the application after all tests
    await app.close();
  });

  it('GET /achievements - Should return all achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // We expect there to be at least one achievement in the database
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  // Added test for filtering achievements by journey type (health)
  it('GET /achievements?journeyType=health - Should return health journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements?journeyType=health')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned achievements are from the health journey
        res.body.forEach((achievement) => {
          expect(achievement.journeyType).toBe('health');
        });
      });
  });

  // Added test for filtering achievements by journey type (care)
  it('GET /achievements?journeyType=care - Should return care journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements?journeyType=care')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned achievements are from the care journey
        res.body.forEach((achievement) => {
          expect(achievement.journeyType).toBe('care');
        });
      });
  });

  // Added test for filtering achievements by journey type (plan)
  it('GET /achievements?journeyType=plan - Should return plan journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements?journeyType=plan')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned achievements are from the plan journey
        res.body.forEach((achievement) => {
          expect(achievement.journeyType).toBe('plan');
        });
      });
  });

  // Added test for cross-journey achievements
  it('GET /achievements?type=CROSS_JOURNEY - Should return cross-journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements?type=CROSS_JOURNEY')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned achievements are cross-journey type
        res.body.forEach((achievement) => {
          expect(achievement.type).toBe(AchievementType.CROSS_JOURNEY);
        });
      });
  });

  it('GET /achievements/:id - Should return a single achievement by ID', async () => {
    // First, get all achievements to find a valid ID
    const achievementsRes = await request(app.getHttpServer()).get('/achievements');
    
    // Skip the test if no achievements exist
    if (achievementsRes.body.length === 0) {
      console.warn('Skipping test: No achievements found in the database');
      return;
    }

    const firstAchievement = achievementsRes.body[0];
    
    return request(app.getHttpServer())
      .get(`/achievements/${firstAchievement.id}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(typeof res.body).toBe('object');
        expect(res.body.id).toBe(firstAchievement.id);
      });
  });

  // Enhanced error handling verification with standardized error response
  it('GET /achievements/:id - Should return 404 with standardized error response if achievement is not found', () => {
    // Using a non-existent achievement ID
    const nonExistentId = 'non-existent-id';
    
    return request(app.getHttpServer())
      .get(`/achievements/${nonExistentId}`)
      .expect(HttpStatus.NOT_FOUND)
      .expect((res) => {
        // Verify standardized error response structure
        expect(res.body).toHaveProperty('statusCode', HttpStatus.NOT_FOUND);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('error');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path');
        
        // Verify error details
        const errorResponse = res.body as ErrorResponse;
        expect(errorResponse.error).toBe('Not Found');
        expect(errorResponse.message).toContain('Achievement not found');
        expect(errorResponse.path).toContain(`/achievements/${nonExistentId}`);
      });
  });

  // Added test for user achievement progress
  it('GET /achievements/progress/:userId - Should return achievement progress for a user', async () => {
    // Using a test user ID
    const testUserId = 'test-user-id';
    
    return request(app.getHttpServer())
      .get(`/achievements/progress/${testUserId}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify progress response structure
        if (res.body.length > 0) {
          const progress = res.body[0];
          expect(progress).toHaveProperty('achievementId');
          expect(progress).toHaveProperty('userId');
          expect(progress).toHaveProperty('status');
          expect(progress).toHaveProperty('currentValue');
          expect(progress).toHaveProperty('targetValue');
          expect(progress).toHaveProperty('percentComplete');
          
          // Verify status is one of the valid statuses
          expect([
            AchievementStatus.LOCKED,
            AchievementStatus.IN_PROGRESS,
            AchievementStatus.UNLOCKED
          ]).toContain(progress.status);
        }
      });
  });

  // Added test for cross-journey achievement progress
  it('GET /achievements/progress/:userId?type=CROSS_JOURNEY - Should return cross-journey achievement progress', async () => {
    // Using a test user ID
    const testUserId = 'test-user-id';
    
    return request(app.getHttpServer())
      .get(`/achievements/progress/${testUserId}?type=CROSS_JOURNEY`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned progress items are for cross-journey achievements
        if (res.body.length > 0) {
          res.body.forEach((progress) => {
            expect(progress.achievement.type).toBe(AchievementType.CROSS_JOURNEY);
          });
        }
      });
  });

  // Added test for journey-specific achievement progress
  it('GET /achievements/progress/:userId?journeyType=health - Should return health journey achievement progress', async () => {
    // Using a test user ID
    const testUserId = 'test-user-id';
    
    return request(app.getHttpServer())
      .get(`/achievements/progress/${testUserId}?journeyType=health`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned progress items are for health journey achievements
        if (res.body.length > 0) {
          res.body.forEach((progress) => {
            expect(progress.achievement.journeyType).toBe('health');
          });
        }
      });
  });

  // Added test for invalid query parameters with enhanced error handling
  it('GET /achievements?invalidParam=value - Should return 400 with standardized error response for invalid query parameters', () => {
    return request(app.getHttpServer())
      .get('/achievements?invalidParam=value')
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        // Verify standardized error response structure
        expect(res.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('error');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path');
        
        // Verify error details
        const errorResponse = res.body as ErrorResponse;
        expect(errorResponse.error).toBe('Bad Request');
        expect(errorResponse.message).toContain('Invalid query parameter');
        expect(errorResponse.path).toContain('/achievements');
      });
  });
});