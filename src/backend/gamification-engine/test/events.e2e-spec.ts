import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import * as request from 'supertest';

// Updated imports using standardized TypeScript path aliases
import { EventsModule } from '@app/gamification-engine/events/events.module';
import { EventsService } from '@app/gamification-engine/events/events.service';
import { AchievementsModule } from '@app/gamification-engine/achievements/achievements.module';
import { AchievementsService } from '@app/gamification-engine/achievements/achievements.service';
import { ProfilesModule } from '@app/gamification-engine/profiles/profiles.module';
import { ProfilesService } from '@app/gamification-engine/profiles/profiles.service';
import { RulesService } from '@app/gamification-engine/rules/rules.service';
import { QuestsService } from '@app/gamification-engine/quests/quests.service';
import { RewardsService } from '@app/gamification-engine/rewards/rewards.service';

// Shared packages with standardized imports
import { KafkaService } from '@austa/events/kafka/kafka.service';
import { PrismaService } from '@austa/database/prisma.service';
import { AUTH_INVALID_CREDENTIALS } from '@austa/errors/constants/error-codes.constants';
import { DeadLetterQueueService } from '@austa/events/kafka/dead-letter-queue.service';
import { RetryService } from '@austa/events/retry/retry.service';

// Import event interfaces for type-safe testing
import { 
  GamificationEvent, 
  EventType, 
  HealthJourneyEvent, 
  CareJourneyEvent, 
  PlanJourneyEvent,
  JourneyType
} from '@austa/interfaces/gamification/events';

/**
 * End-to-end tests for the Events module.
 * These tests verify the event processing flow by sending events to the API and checking that 
 * the user's game profile is updated correctly. The tests cover all three journey types 
 * (Health, Care, Plan) and verify error handling and retry mechanisms.
 */
describe('EventsModule (e2e)', () => {
  let app: INestApplication;
  let eventsService: EventsService;
  let achievementsService: AchievementsService;
  let profilesService: ProfilesService;
  let kafkaService: KafkaService;
  let prismaService: PrismaService;
  let rulesService: RulesService;
  let questsService: QuestsService;
  let rewardsService: RewardsService;
  let deadLetterQueueService: DeadLetterQueueService;
  let retryService: RetryService;

  beforeEach(async () => {
    // Create a testing module with all necessary dependencies
    const moduleFixture = await Test.createTestingModule({
      imports: [EventsModule, AchievementsModule, ProfilesModule],
    })
    .overrideProvider(KafkaService)
    .useValue({
      produce: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
    })
    .overrideProvider(DeadLetterQueueService)
    .useValue({
      addToDeadLetterQueue: jest.fn().mockResolvedValue(undefined),
      processDeadLetterQueue: jest.fn().mockResolvedValue(undefined),
      getDeadLetterQueueItems: jest.fn().mockResolvedValue([]),
    })
    .overrideProvider(RetryService)
    .useValue({
      scheduleRetry: jest.fn().mockResolvedValue(undefined),
      getRetryAttempts: jest.fn().mockResolvedValue(0),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get instances of the services for assertions
    eventsService = moduleFixture.get<EventsService>(EventsService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    deadLetterQueueService = moduleFixture.get<DeadLetterQueueService>(DeadLetterQueueService);
    retryService = moduleFixture.get<RetryService>(RetryService);
    
    // Create instances for services not directly provided by the module
    prismaService = new PrismaService();
    questsService = moduleFixture.get<QuestsService>(QuestsService);
    rewardsService = moduleFixture.get<RewardsService>(RewardsService);
    rulesService = moduleFixture.get<RulesService>(RulesService);
  });

  afterEach(async () => {
    // Clean up resources after each test
    if (app) {
      await app.close();
    }
    jest.clearAllMocks();
  });

  // Test for Health Journey event processing
  it('/events (POST) - should process a valid Health journey event and update the user profile', async () => {
    const userId = 'test-user-123';
    const eventData: HealthJourneyEvent = {
      type: EventType.STEPS_RECORDED,
      userId: userId,
      data: { steps: 1000, source: 'fitbit', timestamp: new Date().toISOString() },
      journey: JourneyType.HEALTH,
      version: '1.0.0',
      eventId: 'event-123',
      timestamp: new Date().toISOString(),
    };

    // Mock the profilesService to return a game profile
    jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
      id: 'profile-id',
      userId: userId,
      level: 1,
      xp: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      achievements: [],
      quests: [],
    }));

    // Mock the rulesService to return a rule
    jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
      {
        id: 'rule-1',
        event: EventType.STEPS_RECORDED,
        condition: 'event.data.steps >= 1000',
        actions: '[{"type": "AWARD_XP", "value": 50}]',
        journey: JourneyType.HEALTH,
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Mock the rulesService to evaluate the rule
    jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

    // Mock the profilesService to update the profile
    jest.spyOn(profilesService, 'update').mockImplementation(async () => ({
      id: 'profile-id',
      userId: userId,
      level: 1,
      xp: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      achievements: [],
      quests: [],
    }));

    // Send the event to the API
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData)
      .set('Authorization', `Bearer valid-token`);

    // Assert the response status code
    expect(response.status).toBe(HttpStatus.OK);

    // Assert the response body
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        points: 50,
        profile: expect.objectContaining({
          userId: userId,
          xp: 50,
        }),
      }),
    );

    // Verify Kafka message was produced for the XP earned event
    expect(kafkaService.produce).toHaveBeenCalledWith(
      'gamification-events',
      expect.objectContaining({
        type: 'XP_EARNED',
        userId: userId,
        amount: 50,
        sourceEvent: EventType.STEPS_RECORDED,
        journey: JourneyType.HEALTH,
      })
    );
  });

  // Test for Care Journey event processing
  it('/events (POST) - should process a valid Care journey event and update the user profile', async () => {
    const userId = 'test-user-456';
    const eventData: CareJourneyEvent = {
      type: EventType.APPOINTMENT_BOOKED,
      userId: userId,
      data: { 
        providerId: 'provider-123', 
        specialtyId: 'cardiology',
        appointmentDate: new Date().toISOString(),
        isFirstAppointment: true
      },
      journey: JourneyType.CARE,
      version: '1.0.0',
      eventId: 'event-456',
      timestamp: new Date().toISOString(),
    };

    // Mock the profilesService to return a game profile
    jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
      id: 'profile-id-2',
      userId: userId,
      level: 2,
      xp: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      achievements: [],
      quests: [],
    }));

    // Mock the rulesService to return a rule
    jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
      {
        id: 'rule-2',
        event: EventType.APPOINTMENT_BOOKED,
        condition: 'event.data.isFirstAppointment === true',
        actions: '[{"type": "AWARD_XP", "value": 75}, {"type": "PROGRESS_ACHIEVEMENT", "achievementId": "achievement-1", "value": 1}]',
        journey: JourneyType.CARE,
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Mock the rulesService to evaluate the rule
    jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

    // Mock the profilesService to update the profile
    jest.spyOn(profilesService, 'update').mockImplementation(async () => ({
      id: 'profile-id-2',
      userId: userId,
      level: 2,
      xp: 175,
      createdAt: new Date(),
      updatedAt: new Date(),
      achievements: [{ id: 'achievement-1', progress: 1 }],
      quests: [],
    }));

    // Mock the achievementsService to update achievement progress
    jest.spyOn(achievementsService, 'updateProgress').mockResolvedValue({
      id: 'user-achievement-1',
      userId: userId,
      achievementId: 'achievement-1',
      progress: 1,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send the event to the API
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData)
      .set('Authorization', `Bearer valid-token`);

    // Assert the response status code
    expect(response.status).toBe(HttpStatus.OK);

    // Assert the response body
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        points: 75,
        profile: expect.objectContaining({
          userId: userId,
          xp: 175,
        }),
        achievements: expect.arrayContaining([
          expect.objectContaining({
            id: 'achievement-1',
            progress: 1
          })
        ])
      }),
    );

    // Verify achievement progress was updated
    expect(achievementsService.updateProgress).toHaveBeenCalledWith(
      userId,
      'achievement-1',
      1
    );
  });

  // Test for Plan Journey event processing
  it('/events (POST) - should process a valid Plan journey event and update the user profile', async () => {
    const userId = 'test-user-789';
    const eventData: PlanJourneyEvent = {
      type: EventType.CLAIM_SUBMITTED,
      userId: userId,
      data: { 
        claimId: 'claim-123', 
        amount: 500.00,
        category: 'medical',
        isComplete: true
      },
      journey: JourneyType.PLAN,
      version: '1.0.0',
      eventId: 'event-789',
      timestamp: new Date().toISOString(),
    };

    // Mock the profilesService to return a game profile
    jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
      id: 'profile-id-3',
      userId: userId,
      level: 3,
      xp: 200,
      createdAt: new Date(),
      updatedAt: new Date(),
      achievements: [],
      quests: [],
    }));

    // Mock the rulesService to return a rule
    jest.spyOn(rulesService, 'findAll').mockImplementation(async () => [
      {
        id: 'rule-3',
        event: EventType.CLAIM_SUBMITTED,
        condition: 'event.data.isComplete === true',
        actions: '[{"type": "AWARD_XP", "value": 100}, {"type": "PROGRESS_QUEST", "questId": "quest-1", "value": 1}]',
        journey: JourneyType.PLAN,
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Mock the rulesService to evaluate the rule
    jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

    // Mock the profilesService to update the profile
    jest.spyOn(profilesService, 'update').mockImplementation(async () => ({
      id: 'profile-id-3',
      userId: userId,
      level: 3,
      xp: 300,
      createdAt: new Date(),
      updatedAt: new Date(),
      achievements: [],
      quests: [{ id: 'quest-1', progress: 1 }],
    }));

    // Mock the questsService to update quest progress
    jest.spyOn(questsService, 'updateProgress').mockResolvedValue({
      id: 'user-quest-1',
      userId: userId,
      questId: 'quest-1',
      progress: 1,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send the event to the API
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData)
      .set('Authorization', `Bearer valid-token`);

    // Assert the response status code
    expect(response.status).toBe(HttpStatus.OK);

    // Assert the response body
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        points: 100,
        profile: expect.objectContaining({
          userId: userId,
          xp: 300,
        }),
        quests: expect.arrayContaining([
          expect.objectContaining({
            id: 'quest-1',
            progress: 1
          })
        ])
      }),
    );

    // Verify quest progress was updated
    expect(questsService.updateProgress).toHaveBeenCalledWith(
      userId,
      'quest-1',
      1
    );
  });

  // Test for event schema validation
  it('/events (POST) - should return 400 for invalid event schema', async () => {
    const invalidEvent = {
      // Missing required type field
      userId: 'test-user-123',
      data: { steps: 1000 },
      journey: JourneyType.HEALTH,
    };

    // Send the invalid event to the API
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(invalidEvent)
      .set('Authorization', `Bearer valid-token`);

    // Assert the response status code
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    
    // Assert the response contains validation error details
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: expect.arrayContaining([
          expect.stringContaining('type')
        ]),
        error: 'Bad Request'
      })
    );
  });

  // Test for retry mechanism
  it('/events (POST) - should handle temporary failures with retry mechanism', async () => {
    const userId = 'test-user-retry';
    const eventData: HealthJourneyEvent = {
      type: EventType.STEPS_RECORDED,
      userId: userId,
      data: { steps: 1000, source: 'fitbit', timestamp: new Date().toISOString() },
      journey: JourneyType.HEALTH,
      version: '1.0.0',
      eventId: 'event-retry',
      timestamp: new Date().toISOString(),
    };

    // Mock the profilesService to throw an error on first call
    jest.spyOn(profilesService, 'findById')
      .mockRejectedValueOnce(new Error('Temporary database connection error'))
      .mockImplementationOnce(async () => ({
        id: 'profile-id-retry',
        userId: userId,
        level: 1,
        xp: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        achievements: [],
        quests: [],
      }));

    // Mock the retryService
    jest.spyOn(retryService, 'scheduleRetry').mockResolvedValue(undefined);
    jest.spyOn(retryService, 'getRetryAttempts').mockResolvedValue(1);

    // Send the event to the API
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData)
      .set('Authorization', `Bearer valid-token`);

    // Assert the response status code for retry in progress
    expect(response.status).toBe(HttpStatus.ACCEPTED);
    
    // Verify retry was scheduled
    expect(retryService.scheduleRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-retry',
        userId: userId,
        type: EventType.STEPS_RECORDED,
      }),
      expect.any(Number), // Retry delay
      expect.any(Number)  // Attempt number
    );
  });

  // Test for dead letter queue
  it('/events (POST) - should move event to dead letter queue after max retries', async () => {
    const userId = 'test-user-dlq';
    const eventData: HealthJourneyEvent = {
      type: EventType.STEPS_RECORDED,
      userId: userId,
      data: { steps: 1000, source: 'fitbit', timestamp: new Date().toISOString() },
      journey: JourneyType.HEALTH,
      version: '1.0.0',
      eventId: 'event-dlq',
      timestamp: new Date().toISOString(),
    };

    // Mock the profilesService to consistently throw an error
    jest.spyOn(profilesService, 'findById').mockRejectedValue(
      new Error('Persistent database connection error')
    );

    // Mock the retryService to indicate max retries reached
    jest.spyOn(retryService, 'getRetryAttempts').mockResolvedValue(5); // Max retries
    
    // Mock the deadLetterQueueService
    jest.spyOn(deadLetterQueueService, 'addToDeadLetterQueue').mockResolvedValue(undefined);

    // Send the event to the API
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData)
      .set('Authorization', `Bearer valid-token`);

    // Assert the response status code for permanent failure
    expect(response.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    
    // Verify event was added to dead letter queue
    expect(deadLetterQueueService.addToDeadLetterQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-dlq',
        userId: userId,
        type: EventType.STEPS_RECORDED,
        error: expect.stringContaining('Persistent database connection error'),
        retryCount: 5
      })
    );
  });

  // Test for authentication
  it('/events (POST) - should return 401 if no token is provided', async () => {
    const eventData: HealthJourneyEvent = {
      type: EventType.STEPS_RECORDED,
      userId: 'test-user-123',
      data: { steps: 1000, source: 'fitbit', timestamp: new Date().toISOString() },
      journey: JourneyType.HEALTH,
      version: '1.0.0',
      eventId: 'event-auth',
      timestamp: new Date().toISOString(),
    };

    // Send the event to the API without a token
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData);

    // Assert the response status code
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    
    // Assert the response contains the correct error code
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        error: expect.stringContaining(AUTH_INVALID_CREDENTIALS)
      })
    );
  });
});