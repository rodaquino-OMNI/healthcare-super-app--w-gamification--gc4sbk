import { HttpStatus, INestApplication } from '@nestjs/common'; // v10.3.0
import { Test } from '@nestjs/testing'; // v10.3.0
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals'; // v29.0.0+
import * as request from 'supertest'; // 6.3.3

// Use standardized TypeScript path aliases
import { EventsModule } from '@app/gamification/events/events.module';
import { EventsService } from '@app/gamification/events/events.service';
import { AchievementsModule } from '@app/gamification/achievements/achievements.module';
import { AchievementsService } from '@app/gamification/achievements/achievements.service';
import { ProfilesModule } from '@app/gamification/profiles/profiles.module';
import { ProfilesService } from '@app/gamification/profiles/profiles.service';
import { RulesService } from '@app/gamification/rules/rules.service';
import { QuestsService } from '@app/gamification/quests/quests.service';
import { RewardsService } from '@app/gamification/rewards/rewards.service';

// Import from shared packages with standardized paths
import { KafkaService } from '@austa/events/kafka/kafka.service';
import { PrismaService } from '@austa/database/prisma.service';
import { AUTH_INVALID_CREDENTIALS } from '@austa/errors/constants/error-codes.constants';
import { DeadLetterQueueService } from '@austa/events/dlq/dlq.service';

// Import event interfaces
import { IEventResponse } from '@app/gamification/events/interfaces/event-response.interface';
import { JourneyType } from '@austa/interfaces/journey/journey-type.enum';
import { EventSchemaValidator } from '@app/gamification/events/validation/event-schema.validator';

/**
 * End-to-end tests for the Events module.
 * These tests verify the event processing flow by sending events to the API and checking that 
 * the user's game profile is updated correctly. Tests cover all journey types (health, care, plan)
 * and verify error handling and retry mechanisms.
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
  let dlqService: DeadLetterQueueService;
  let schemaValidator: EventSchemaValidator;

  beforeEach(async () => {
    // Create a testing module with all necessary dependencies
    const moduleFixture = await Test.createTestingModule({
      imports: [EventsModule, AchievementsModule, ProfilesModule],
    })
    .overrideProvider(KafkaService)
    .useValue({
      produce: jest.fn().mockResolvedValue(undefined),
    })
    .overrideProvider(DeadLetterQueueService)
    .useValue({
      addToQueue: jest.fn().mockResolvedValue(undefined),
      processQueue: jest.fn().mockResolvedValue(undefined),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get instances of the services for assertions
    eventsService = moduleFixture.get<EventsService>(EventsService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    dlqService = moduleFixture.get<DeadLetterQueueService>(DeadLetterQueueService);
    schemaValidator = moduleFixture.get<EventSchemaValidator>(EventSchemaValidator);
    
    // Mock these services since they're not directly provided by the testing module
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

  /**
   * Test for processing a valid health journey event
   */
  it('/events (POST) - should process a valid health journey event and update the user profile', async () => {
    const userId = 'test-user-123';
    const eventData = {
      type: 'STEPS_RECORDED',
      userId: userId,
      data: { steps: 1000 },
      journey: JourneyType.HEALTH,
    };

    // Mock the schema validator
    jest.spyOn(schemaValidator, 'validate').mockReturnValue({ isValid: true });

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
        event: 'STEPS_RECORDED',
        condition: 'event.data.steps >= 1000',
        actions: '[{"type": "AWARD_XP", "value": 50}]',
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

    // Verify that the Kafka service was called to produce an event
    expect(kafkaService.produce).toHaveBeenCalledWith(
      'gamification-events',
      expect.objectContaining({
        type: 'XP_EARNED',
        userId: userId,
        amount: 50,
        sourceEvent: 'STEPS_RECORDED',
        journey: JourneyType.HEALTH,
      })
    );
  });

  /**
   * Test for processing a valid care journey event
   */
  it('/events (POST) - should process a valid care journey event and update the user profile', async () => {
    const userId = 'test-user-456';
    const eventData = {
      type: 'APPOINTMENT_BOOKED',
      userId: userId,
      data: { providerId: 'doctor-123', appointmentTime: '2025-06-15T10:00:00Z' },
      journey: JourneyType.CARE,
    };

    // Mock the schema validator
    jest.spyOn(schemaValidator, 'validate').mockReturnValue({ isValid: true });

    // Mock the profilesService to return a game profile
    jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
      id: 'profile-id',
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
        event: 'APPOINTMENT_BOOKED',
        condition: 'true',
        actions: '[{"type": "AWARD_XP", "value": 30}, {"type": "PROGRESS_ACHIEVEMENT", "achievementId": "ach-1", "value": 1}]',
      },
    ]);

    // Mock the rulesService to evaluate the rule
    jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

    // Mock the profilesService to update the profile
    jest.spyOn(profilesService, 'update').mockImplementation(async () => ({
      id: 'profile-id',
      userId: userId,
      level: 2,
      xp: 130,
      createdAt: new Date(),
      updatedAt: new Date(),
      achievements: [{ id: 'ach-1', progress: 1, completed: false }],
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
        points: 30,
        profile: expect.objectContaining({
          userId: userId,
          xp: 130,
        }),
        achievements: expect.arrayContaining([
          expect.objectContaining({
            id: 'ach-1',
            progress: 1
          })
        ])
      }),
    );

    // Verify that the Kafka service was called to produce an event
    expect(kafkaService.produce).toHaveBeenCalledWith(
      'gamification-events',
      expect.objectContaining({
        type: 'XP_EARNED',
        userId: userId,
        amount: 30,
        sourceEvent: 'APPOINTMENT_BOOKED',
        journey: JourneyType.CARE,
      })
    );
  });

  /**
   * Test for processing a valid plan journey event
   */
  it('/events (POST) - should process a valid plan journey event and update the user profile', async () => {
    const userId = 'test-user-789';
    const eventData = {
      type: 'CLAIM_SUBMITTED',
      userId: userId,
      data: { claimId: 'claim-123', amount: 500, category: 'medical' },
      journey: JourneyType.PLAN,
    };

    // Mock the schema validator
    jest.spyOn(schemaValidator, 'validate').mockReturnValue({ isValid: true });

    // Mock the profilesService to return a game profile
    jest.spyOn(profilesService, 'findById').mockImplementation(async () => ({
      id: 'profile-id',
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
        event: 'CLAIM_SUBMITTED',
        condition: 'event.data.amount >= 100',
        actions: '[{"type": "AWARD_XP", "value": 25}, {"type": "PROGRESS_QUEST", "questId": "quest-1", "value": 1}]',
      },
    ]);

    // Mock the rulesService to evaluate the rule
    jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);

    // Mock the profilesService to update the profile
    jest.spyOn(profilesService, 'update').mockImplementation(async () => ({
      id: 'profile-id',
      userId: userId,
      level: 3,
      xp: 225,
      createdAt: new Date(),
      updatedAt: new Date(),
      achievements: [],
      quests: [{ id: 'quest-1', progress: 1, completed: false }],
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
        points: 25,
        profile: expect.objectContaining({
          userId: userId,
          xp: 225,
        }),
        quests: expect.arrayContaining([
          expect.objectContaining({
            id: 'quest-1',
            progress: 1
          })
        ])
      }),
    );

    // Verify that the Kafka service was called to produce an event
    expect(kafkaService.produce).toHaveBeenCalledWith(
      'gamification-events',
      expect.objectContaining({
        type: 'XP_EARNED',
        userId: userId,
        amount: 25,
        sourceEvent: 'CLAIM_SUBMITTED',
        journey: JourneyType.PLAN,
      })
    );
  });

  /**
   * Test for invalid event schema validation
   */
  it('/events (POST) - should reject an event with invalid schema', async () => {
    const userId = 'test-user-123';
    const eventData = {
      type: 'INVALID_EVENT_TYPE',
      userId: userId,
      data: { invalid: 'data' },
      journey: 'invalid-journey',
    };

    // Mock the schema validator to return invalid
    jest.spyOn(schemaValidator, 'validate').mockReturnValue({ 
      isValid: false, 
      errors: ['Invalid event type', 'Invalid journey type']
    });

    // Send the event to the API
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData)
      .set('Authorization', `Bearer valid-token`);

    // Assert the response status code
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);

    // Assert the response body contains validation errors
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.arrayContaining([
          'Invalid event type',
          'Invalid journey type'
        ])
      }),
    );

    // Verify that the DLQ service was called to add the failed event
    expect(dlqService.addToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        event: eventData,
        reason: 'Schema validation failed',
        errors: expect.arrayContaining([
          'Invalid event type',
          'Invalid journey type'
        ])
      })
    );
  });

  /**
   * Test for retry mechanism when processing fails
   */
  it('/events (POST) - should add event to DLQ when processing fails', async () => {
    const userId = 'test-user-123';
    const eventData = {
      type: 'STEPS_RECORDED',
      userId: userId,
      data: { steps: 1000 },
      journey: JourneyType.HEALTH,
    };

    // Mock the schema validator
    jest.spyOn(schemaValidator, 'validate').mockReturnValue({ isValid: true });

    // Mock the profilesService to throw an error
    jest.spyOn(profilesService, 'findById').mockImplementation(async () => {
      throw new Error('Database connection error');
    });

    // Send the event to the API
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData)
      .set('Authorization', `Bearer valid-token`);

    // Assert the response status code
    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

    // Assert the response body contains error information
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Error processing event'),
      }),
    );

    // Verify that the DLQ service was called to add the failed event
    expect(dlqService.addToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        event: eventData,
        reason: 'Processing error',
        error: expect.stringContaining('Database connection error')
      })
    );
  });

  /**
   * Test for unauthorized access
   */
  it('/events (POST) - should return 401 if no token is provided', async () => {
    const eventData = {
      type: 'STEPS_RECORDED',
      userId: 'test-user-123',
      data: { steps: 1000 },
      journey: JourneyType.HEALTH,
    };

    // Send the event to the API without a token
    const response = await request(app.getHttpServer())
      .post('/events')
      .send(eventData);

    // Assert the response status code
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.error).toBe(AUTH_INVALID_CREDENTIALS);
  });
});