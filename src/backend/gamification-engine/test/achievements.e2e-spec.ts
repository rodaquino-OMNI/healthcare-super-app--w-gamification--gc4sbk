import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as request from 'supertest';

// Updated imports using standardized TypeScript path aliases
import { JwtAuthGuard } from '@app/auth/guards';
import { RolesGuard } from '@app/auth/guards';
import { AppModule } from '../src/app.module';
import { IJourneyType } from '@austa/interfaces/journey';
import { ErrorResponse } from '@app/errors/interfaces';

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

  // New test for filtering achievements by journey type
  it('GET /achievements?journey=health - Should return only health journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements?journey=health')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned achievements are from the health journey
        res.body.forEach((achievement) => {
          expect(achievement.journey).toBe('health');
        });
      });
  });

  // New test for filtering achievements by journey type
  it('GET /achievements?journey=care - Should return only care journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements?journey=care')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned achievements are from the care journey
        res.body.forEach((achievement) => {
          expect(achievement.journey).toBe('care');
        });
      });
  });

  // New test for filtering achievements by journey type
  it('GET /achievements?journey=plan - Should return only plan journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements?journey=plan')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned achievements are from the plan journey
        res.body.forEach((achievement) => {
          expect(achievement.journey).toBe('plan');
        });
      });
  });

  // New test for cross-journey achievements
  it('GET /achievements?type=CROSS_JOURNEY - Should return only cross-journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements?type=CROSS_JOURNEY')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify all returned achievements are cross-journey type
        res.body.forEach((achievement) => {
          expect(achievement.type).toBe('CROSS_JOURNEY');
        });
      });
  });

  // Test for invalid journey parameter
  it('GET /achievements?journey=invalid - Should return 400 with standardized error response', () => {
    return request(app.getHttpServer())
      .get('/achievements?journey=invalid')
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        // Verify standardized error response format
        expect(res.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('error');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path', '/achievements');
        
        // Verify error message contains information about valid journey types
        expect(res.body.message).toContain('journey');
        expect(res.body.message).toContain('health');
        expect(res.body.message).toContain('care');
        expect(res.body.message).toContain('plan');
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

  // Enhanced error handling test
  it('GET /achievements/:id - Should return 404 with standardized error response if achievement is not found', () => {
    // Using a non-existent achievement ID
    const nonExistentId = 'non-existent-id';
    
    return request(app.getHttpServer())
      .get(`/achievements/${nonExistentId}`)
      .expect(HttpStatus.NOT_FOUND)
      .expect((res) => {
        // Verify standardized error response format
        expect(res.body).toHaveProperty('statusCode', HttpStatus.NOT_FOUND);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('error', 'Not Found');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path', `/achievements/${nonExistentId}`);
        
        // Verify error message contains information about the achievement not being found
        expect(res.body.message).toContain('Achievement');
        expect(res.body.message).toContain('not found');
      });
  });

  // New test for user achievement progress
  it('GET /achievements/:id/progress - Should return achievement progress for the current user', async () => {
    // First, get all achievements to find a valid ID
    const achievementsRes = await request(app.getHttpServer()).get('/achievements');
    
    // Skip the test if no achievements exist
    if (achievementsRes.body.length === 0) {
      console.warn('Skipping test: No achievements found in the database');
      return;
    }

    const firstAchievement = achievementsRes.body[0];
    
    return request(app.getHttpServer())
      .get(`/achievements/${firstAchievement.id}/progress`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(typeof res.body).toBe('object');
        expect(res.body).toHaveProperty('achievementId', firstAchievement.id);
        expect(res.body).toHaveProperty('progress');
        expect(res.body).toHaveProperty('unlocked');
        // If unlocked is true, unlockedAt should be present
        if (res.body.unlocked) {
          expect(res.body).toHaveProperty('unlockedAt');
        }
      });
  });

  // New test for cross-journey achievement progress
  it('GET /achievements/progress/cross-journey - Should return progress for all cross-journey achievements', () => {
    return request(app.getHttpServer())
      .get('/achievements/progress/cross-journey')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Each item should have achievement and progress information
        if (res.body.length > 0) {
          res.body.forEach((progressItem) => {
            expect(progressItem).toHaveProperty('achievement');
            expect(progressItem).toHaveProperty('progress');
            expect(progressItem).toHaveProperty('unlocked');
            expect(progressItem.achievement.type).toBe('CROSS_JOURNEY');
          });
        }
      });
  });
});