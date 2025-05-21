import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import * as request from 'supertest';
import { JwtAuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@nestjs/passport';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quest } from '../src/quests/entities/quest.entity';
import { UserQuest } from '../src/quests/entities/user-quest.entity';
import { ProfilesService } from '../src/profiles/profiles.service';

/**
 * End-to-end tests for the QuestsController.
 * These tests validate the functionality of quest creation, progress tracking,
 * completion detection, and reward distribution.
 */
describe('QuestsController (e2e)', () => {
  let app: INestApplication;
  let questRepository: Repository<Quest>;
  let userQuestRepository: Repository<UserQuest>;
  let profilesService: ProfilesService;
  
  // Mock user for testing
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    email: 'test@example.com'
  };

  // Mock quest data
  const mockQuests = [
    {
      title: 'Complete Health Assessment',
      description: 'Complete your first health assessment to earn XP',
      journey: 'health',
      icon: 'clipboard-check',
      xpReward: 100
    },
    {
      title: 'Book First Appointment',
      description: 'Schedule your first appointment with a healthcare provider',
      journey: 'care',
      icon: 'calendar-plus',
      xpReward: 150
    },
    {
      title: 'Review Insurance Benefits',
      description: 'Review your insurance benefits and coverage details',
      journey: 'plan',
      icon: 'shield-check',
      xpReward: 75
    }
  ];

  beforeAll(async () => {
    // Create a testing module
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Mock the guards to bypass authentication and authorization
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    // Initialize the application
    app = moduleFixture.createNestApplication();
    
    // Get repository instances
    questRepository = moduleFixture.get(getRepositoryToken(Quest));
    userQuestRepository = moduleFixture.get(getRepositoryToken(UserQuest));
    profilesService = moduleFixture.get(ProfilesService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clear existing data
    await userQuestRepository.clear();
    await questRepository.clear();
    
    // Seed test quests
    for (const questData of mockQuests) {
      await questRepository.save(questRepository.create(questData));
    }
    
    // Ensure test user profile exists
    try {
      await profilesService.findById(mockUser.id);
    } catch (error) {
      // Create profile if it doesn't exist
      await profilesService.create({
        userId: mockUser.id,
        username: mockUser.username,
        xp: 0,
        level: 1
      });
    }
  });

  afterAll(async () => {
    // Clean up
    await userQuestRepository.clear();
    await questRepository.clear();
    
    // Close the application after all tests
    await app.close();
  });

  /**
   * Test for retrieving all quests
   */
  it('GET /quests - Should return all quests', () => {
    return request(app.getHttpServer())
      .get('/quests')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(mockQuests.length);
        
        // Verify quest properties
        const quest = res.body[0];
        expect(quest).toHaveProperty('id');
        expect(quest).toHaveProperty('title');
        expect(quest).toHaveProperty('description');
        expect(quest).toHaveProperty('journey');
        expect(quest).toHaveProperty('icon');
        expect(quest).toHaveProperty('xpReward');
      });
  });

  /**
   * Test for retrieving quests with filtering by journey
   */
  it('GET /quests?journey=health - Should return quests filtered by journey', () => {
    return request(app.getHttpServer())
      .get('/quests')
      .query({ journey: 'health' })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        
        // All returned quests should be from the health journey
        res.body.forEach(quest => {
          expect(quest.journey).toBe('health');
        });
        
        // Should find at least one health journey quest
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  /**
   * Test for retrieving a single quest by ID
   */
  it('GET /quests/:id - Should return a single quest by ID', async () => {
    // First, get all quests to find a valid ID
    const questsRes = await request(app.getHttpServer()).get('/quests');
    const firstQuest = questsRes.body[0];
    
    return request(app.getHttpServer())
      .get(`/quests/${firstQuest.id}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty('id', firstQuest.id);
        expect(res.body).toHaveProperty('title', firstQuest.title);
        expect(res.body).toHaveProperty('description', firstQuest.description);
        expect(res.body).toHaveProperty('journey', firstQuest.journey);
        expect(res.body).toHaveProperty('xpReward', firstQuest.xpReward);
      });
  });

  /**
   * Test for 404 response when quest is not found
   */
  it('GET /quests/:id - Should return 404 if quest is not found', () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    
    return request(app.getHttpServer())
      .get(`/quests/${nonExistentId}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  /**
   * Test for starting a quest
   */
  it('POST /quests/:id/start - Should start a quest for a user', async () => {
    // Get a quest ID to use
    const questsRes = await request(app.getHttpServer()).get('/quests');
    const questId = questsRes.body[0].id;
    
    // Mock the request user
    const requestWithUser = request(app.getHttpServer())
      .post(`/quests/${questId}/start`)
      .set('user', JSON.stringify(mockUser));
    
    return requestWithUser
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body).toHaveProperty('quest');
        expect(res.body).toHaveProperty('profile');
        expect(res.body).toHaveProperty('progress', 0);
        expect(res.body).toHaveProperty('completed', false);
        expect(res.body.quest.id).toBe(questId);
      });
  });

  /**
   * Test for idempotent quest starting (starting the same quest twice)
   */
  it('POST /quests/:id/start - Should be idempotent when starting the same quest twice', async () => {
    // Get a quest ID to use
    const questsRes = await request(app.getHttpServer()).get('/quests');
    const questId = questsRes.body[0].id;
    
    // Start the quest first time
    await request(app.getHttpServer())
      .post(`/quests/${questId}/start`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED);
    
    // Start the same quest again
    return request(app.getHttpServer())
      .post(`/quests/${questId}/start`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body).toHaveProperty('quest');
        expect(res.body).toHaveProperty('profile');
        expect(res.body.quest.id).toBe(questId);
        
        // Should return the existing user quest, not create a duplicate
        expect(res.body).toHaveProperty('progress', 0);
        expect(res.body).toHaveProperty('completed', false);
      });
  });

  /**
   * Test for completing a quest
   */
  it('POST /quests/:id/complete - Should complete a quest and award XP', async () => {
    // Get a quest ID to use
    const questsRes = await request(app.getHttpServer()).get('/quests');
    const quest = questsRes.body[0];
    const questId = quest.id;
    
    // Start the quest first
    await request(app.getHttpServer())
      .post(`/quests/${questId}/start`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED);
    
    // Get initial XP
    const initialProfile = await profilesService.findById(mockUser.id);
    const initialXp = initialProfile.xp;
    
    // Complete the quest
    return request(app.getHttpServer())
      .post(`/quests/${questId}/complete`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED)
      .expect(async (res) => {
        expect(res.body).toHaveProperty('quest');
        expect(res.body).toHaveProperty('profile');
        expect(res.body).toHaveProperty('progress', 100);
        expect(res.body).toHaveProperty('completed', true);
        expect(res.body.quest.id).toBe(questId);
        
        // Verify XP was awarded
        const updatedProfile = await profilesService.findById(mockUser.id);
        expect(updatedProfile.xp).toBe(initialXp + quest.xpReward);
      });
  });

  /**
   * Test for completing a quest that hasn't been started
   */
  it('POST /quests/:id/complete - Should return 404 if quest has not been started', async () => {
    // Get a quest ID to use
    const questsRes = await request(app.getHttpServer()).get('/quests');
    const questId = questsRes.body[0].id;
    
    // Try to complete without starting
    return request(app.getHttpServer())
      .post(`/quests/${questId}/complete`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.NOT_FOUND);
  });

  /**
   * Test for idempotent quest completion (completing the same quest twice)
   */
  it('POST /quests/:id/complete - Should be idempotent when completing the same quest twice', async () => {
    // Get a quest ID to use
    const questsRes = await request(app.getHttpServer()).get('/quests');
    const quest = questsRes.body[0];
    const questId = quest.id;
    
    // Start the quest first
    await request(app.getHttpServer())
      .post(`/quests/${questId}/start`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED);
    
    // Get initial XP
    const initialProfile = await profilesService.findById(mockUser.id);
    const initialXp = initialProfile.xp;
    
    // Complete the quest first time
    await request(app.getHttpServer())
      .post(`/quests/${questId}/complete`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED);
    
    // Get XP after first completion
    const midProfile = await profilesService.findById(mockUser.id);
    const midXp = midProfile.xp;
    
    // Complete the same quest again
    return request(app.getHttpServer())
      .post(`/quests/${questId}/complete`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED)
      .expect(async (res) => {
        expect(res.body).toHaveProperty('quest');
        expect(res.body).toHaveProperty('profile');
        expect(res.body).toHaveProperty('progress', 100);
        expect(res.body).toHaveProperty('completed', true);
        
        // Verify XP was not awarded twice
        const finalProfile = await profilesService.findById(mockUser.id);
        expect(finalProfile.xp).toBe(midXp);
        expect(finalProfile.xp).toBe(initialXp + quest.xpReward);
      });
  });

  /**
   * Test for cross-journey quest tracking
   */
  it('Should track quests across different journeys', async () => {
    // Get all quests
    const questsRes = await request(app.getHttpServer()).get('/quests');
    const healthQuest = questsRes.body.find(q => q.journey === 'health');
    const careQuest = questsRes.body.find(q => q.journey === 'care');
    
    // Start both quests
    await request(app.getHttpServer())
      .post(`/quests/${healthQuest.id}/start`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED);
    
    await request(app.getHttpServer())
      .post(`/quests/${careQuest.id}/start`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED);
    
    // Complete both quests
    await request(app.getHttpServer())
      .post(`/quests/${healthQuest.id}/complete`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED);
    
    await request(app.getHttpServer())
      .post(`/quests/${careQuest.id}/complete`)
      .set('user', JSON.stringify(mockUser))
      .expect(HttpStatus.CREATED);
    
    // Verify XP was awarded for both quests
    const finalProfile = await profilesService.findById(mockUser.id);
    expect(finalProfile.xp).toBe(healthQuest.xpReward + careQuest.xpReward);
  });
});