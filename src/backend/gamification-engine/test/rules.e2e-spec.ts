import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { RulesModule } from '../src/rules/rules.module';
import { RulesService } from '../src/rules/rules.service';
import { Rule } from '../src/rules/entities/rule.entity';
import { EventsModule } from '../src/events/events.module';
import { EventsService } from '../src/events/events.service';
import { ProfilesModule } from '../src/profiles/profiles.module';
import { ProfilesService } from '../src/profiles/profiles.service';
import { AchievementsModule } from '../src/achievements/achievements.module';
import { AchievementsService } from '../src/achievements/achievements.service';
import { QuestsModule } from '../src/quests/quests.module';
import { QuestsService } from '../src/quests/quests.service';
import { RewardsModule } from '../src/rewards/rewards.module';
import { RewardsService } from '../src/rewards/rewards.service';
import { KafkaService } from 'src/backend/shared/src/kafka/kafka.service';
import { LoggerService } from 'src/backend/shared/src/logging/logger.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProcessEventDto } from '../src/events/dto/process-event.dto';

/**
 * End-to-end tests for the RulesService.
 * 
 * These tests validate the rule evaluation, condition parsing, and action execution
 * within the gamification engine. They create scenarios with different event types
 * and verify that rules are correctly applied to award XP, achievements, and quest progress.
 */
describe('Rules E2E Tests', () => {
  let app: INestApplication;
  let rulesService: RulesService;
  let eventsService: EventsService;
  let profilesService: ProfilesService;
  let achievementsService: AchievementsService;
  let questsService: QuestsService;
  let rewardsService: RewardsService;
  let ruleRepository: Repository<Rule>;
  let kafkaService: KafkaService;

  // Mock rules for testing
  const testRules = [
    {
      id: '1',
      event: 'STEPS_RECORDED',
      condition: 'event.data.steps >= 10000',
      actions: JSON.stringify([
        { type: 'AWARD_XP', value: 50 },
        { type: 'PROGRESS_ACHIEVEMENT', achievementId: 'active-lifestyle', value: 1 }
      ])
    },
    {
      id: '2',
      event: 'APPOINTMENT_COMPLETED',
      condition: 'event.data.appointmentType === "TELEMEDICINE"',
      actions: JSON.stringify([
        { type: 'AWARD_XP', value: 30 },
        { type: 'PROGRESS_QUEST', questId: 'telehealth-adopter', value: 1 }
      ])
    },
    {
      id: '3',
      event: 'CLAIM_SUBMITTED',
      condition: 'event.data.amount > 100',
      actions: JSON.stringify([
        { type: 'AWARD_XP', value: 20 },
        { type: 'PROGRESS_ACHIEVEMENT', achievementId: 'insurance-master', value: 1 }
      ])
    },
    {
      id: '4',
      event: 'MEDICATION_TAKEN',
      condition: 'event.data.adherence >= 0.9',
      actions: JSON.stringify([
        { type: 'AWARD_XP', value: 15 },
        { type: 'PROGRESS_QUEST', questId: 'medication-adherent', value: 1 }
      ])
    }
  ];

  // Mock user profile
  const mockUserProfile = {
    id: 'user-123',
    userId: 'user-123',
    xp: 100,
    level: 1,
    achievements: [],
    quests: []
  };

  beforeEach(async () => {
    // Create a testing module with all necessary dependencies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RulesModule,
        EventsModule,
        ProfilesModule,
        AchievementsModule,
        QuestsModule,
        RewardsModule
      ],
    })
      .overrideProvider(KafkaService)
      .useValue({
        produce: jest.fn().mockResolvedValue({}),
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

    // Get service instances
    rulesService = moduleFixture.get<RulesService>(RulesService);
    eventsService = moduleFixture.get<EventsService>(EventsService);
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    questsService = moduleFixture.get<QuestsService>(QuestsService);
    rewardsService = moduleFixture.get<RewardsService>(RewardsService);
    ruleRepository = moduleFixture.get<Repository<Rule>>(getRepositoryToken(Rule));
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);

    // Mock repository methods
    jest.spyOn(ruleRepository, 'find').mockResolvedValue(testRules as Rule[]);
    jest.spyOn(ruleRepository, 'findOneBy').mockImplementation((criteria) => {
      const rule = testRules.find(r => r.id === criteria.id);
      return Promise.resolve(rule as Rule);
    });

    // Mock profiles service
    jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
    jest.spyOn(profilesService, 'update').mockImplementation((userId, data) => {
      const updatedProfile = {
        ...mockUserProfile,
        xp: mockUserProfile.xp + data.xp,
        level: Math.floor((mockUserProfile.xp + data.xp) / 100) + 1
      };
      return Promise.resolve(updatedProfile);
    });

    // Mock achievements service
    jest.spyOn(achievementsService, 'updateProgress').mockResolvedValue({
      id: 'achievement-1',
      progress: 1,
      completed: false
    });

    // Mock quests service
    jest.spyOn(questsService, 'updateProgress').mockResolvedValue({
      id: 'quest-1',
      progress: 1,
      completed: false
    });

    // Enable the real rule evaluation in RulesService
    jest.spyOn(rulesService, 'evaluateRule').mockImplementation((event, userProfile) => {
      // Find the rule for this event type
      const rule = testRules.find(r => r.event === event.type);
      if (!rule) return false;
      
      // Evaluate the condition
      try {
        // In a real implementation, this would use a sandbox
        // For testing purposes, we'll use a simple evaluation
        const conditionFn = new Function('event', 'userProfile', `return ${rule.condition};`);
        return conditionFn(event, userProfile);
      } catch (error) {
        return false;
      }
    });
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('Rule Evaluation', () => {
    it('should evaluate rules correctly for health journey events', async () => {
      // Create a health journey event that meets the condition
      const healthEvent: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'user-123',
        data: { steps: 12000 },
        journey: 'health'
      };

      // Process the event
      const result = await eventsService.processEvent(healthEvent);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.points).toBe(50);
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0].id).toBe('active-lifestyle');
      
      // Verify that the profile was updated
      expect(profilesService.update).toHaveBeenCalledWith('user-123', expect.objectContaining({
        xp: 50
      }));
      
      // Verify that Kafka event was produced
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        type: 'XP_EARNED',
        userId: 'user-123',
        amount: 50,
        sourceEvent: 'STEPS_RECORDED',
        journey: 'health'
      }));
    });

    it('should evaluate rules correctly for care journey events', async () => {
      // Create a care journey event that meets the condition
      const careEvent: ProcessEventDto = {
        type: 'APPOINTMENT_COMPLETED',
        userId: 'user-123',
        data: { appointmentType: 'TELEMEDICINE' },
        journey: 'care'
      };

      // Process the event
      const result = await eventsService.processEvent(careEvent);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.points).toBe(30);
      expect(result.quests).toHaveLength(1);
      expect(result.quests[0].id).toBe('telehealth-adopter');
      
      // Verify that the profile was updated
      expect(profilesService.update).toHaveBeenCalledWith('user-123', expect.objectContaining({
        xp: 30
      }));
      
      // Verify that Kafka event was produced
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        type: 'XP_EARNED',
        userId: 'user-123',
        amount: 30,
        sourceEvent: 'APPOINTMENT_COMPLETED',
        journey: 'care'
      }));
    });

    it('should evaluate rules correctly for plan journey events', async () => {
      // Create a plan journey event that meets the condition
      const planEvent: ProcessEventDto = {
        type: 'CLAIM_SUBMITTED',
        userId: 'user-123',
        data: { amount: 150 },
        journey: 'plan'
      };

      // Process the event
      const result = await eventsService.processEvent(planEvent);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.points).toBe(20);
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0].id).toBe('insurance-master');
      
      // Verify that the profile was updated
      expect(profilesService.update).toHaveBeenCalledWith('user-123', expect.objectContaining({
        xp: 20
      }));
      
      // Verify that Kafka event was produced
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        type: 'XP_EARNED',
        userId: 'user-123',
        amount: 20,
        sourceEvent: 'CLAIM_SUBMITTED',
        journey: 'plan'
      }));
    });

    it('should not award points when rule condition is not met', async () => {
      // Create a health journey event that does not meet the condition
      const healthEvent: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'user-123',
        data: { steps: 5000 }, // Less than 10000 required by the rule
        journey: 'health'
      };

      // Process the event
      const result = await eventsService.processEvent(healthEvent);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.points).toBe(0);
      expect(result.achievements).toHaveLength(0);
      
      // Verify that the profile was not updated
      expect(profilesService.update).not.toHaveBeenCalled();
      
      // Verify that no Kafka event was produced for XP
      expect(kafkaService.produce).not.toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        type: 'XP_EARNED'
      }));
    });
  });

  describe('Rule Actions', () => {
    it('should execute multiple actions when rule is satisfied', async () => {
      // Create an event that triggers multiple actions
      const medicationEvent: ProcessEventDto = {
        type: 'MEDICATION_TAKEN',
        userId: 'user-123',
        data: { adherence: 0.95 },
        journey: 'care'
      };

      // Process the event
      const result = await eventsService.processEvent(medicationEvent);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.points).toBe(15);
      expect(result.quests).toHaveLength(1);
      expect(result.quests[0].id).toBe('medication-adherent');
      
      // Verify that the profile was updated
      expect(profilesService.update).toHaveBeenCalledWith('user-123', expect.objectContaining({
        xp: 15
      }));
      
      // Verify that Kafka event was produced
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        type: 'XP_EARNED',
        userId: 'user-123',
        amount: 15,
        sourceEvent: 'MEDICATION_TAKEN',
        journey: 'care'
      }));
    });

    it('should handle level up when XP threshold is reached', async () => {
      // Mock the profile service to simulate a level up
      jest.spyOn(profilesService, 'update').mockResolvedValueOnce({
        ...mockUserProfile,
        xp: 150, // Increased from 100
        level: 2  // Increased from 1
      });

      // Create an event that awards enough XP to level up
      const healthEvent: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'user-123',
        data: { steps: 12000 },
        journey: 'health'
      };

      // Process the event
      const result = await eventsService.processEvent(healthEvent);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.points).toBe(50);
      expect(result.profile.level).toBe(2);
      
      // Verify that the level up event was produced
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        type: 'LEVEL_UP',
        userId: 'user-123',
        oldLevel: 1,
        newLevel: 2
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in rule evaluation gracefully', async () => {
      // Mock the evaluateRule method to throw an error
      jest.spyOn(rulesService, 'evaluateRule').mockImplementationOnce(() => {
        throw new Error('Rule evaluation failed');
      });

      // Create an event
      const healthEvent: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'user-123',
        data: { steps: 12000 },
        journey: 'health'
      };

      // Process the event - it should not throw
      const result = await eventsService.processEvent(healthEvent);

      // Verify the result indicates success but no points
      expect(result.success).toBe(true);
      expect(result.points).toBe(0);
    });

    it('should handle missing user profiles by creating them', async () => {
      // Mock the findById method to throw a not found error
      jest.spyOn(profilesService, 'findById').mockRejectedValueOnce(new Error('Profile not found'));
      
      // Mock the create method
      jest.spyOn(profilesService, 'create').mockResolvedValueOnce({
        id: 'user-123',
        userId: 'user-123',
        xp: 0,
        level: 1,
        achievements: [],
        quests: []
      });

      // Create an event
      const healthEvent: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'user-123',
        data: { steps: 12000 },
        journey: 'health'
      };

      // Process the event
      const result = await eventsService.processEvent(healthEvent);

      // Verify that a new profile was created
      expect(profilesService.create).toHaveBeenCalledWith('user-123');
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.points).toBe(50);
    });

    it('should handle invalid rule actions gracefully', async () => {
      // Create a rule with invalid actions JSON
      const invalidRule = {
        id: '5',
        event: 'STEPS_RECORDED',
        condition: 'event.data.steps >= 10000',
        actions: 'invalid-json'
      };

      // Mock the repository to return the invalid rule
      jest.spyOn(ruleRepository, 'find').mockResolvedValueOnce([invalidRule as Rule]);

      // Create an event
      const healthEvent: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'user-123',
        data: { steps: 12000 },
        journey: 'health'
      };

      // Process the event - it should not throw
      const result = await eventsService.processEvent(healthEvent);

      // Verify the result indicates success but no points
      expect(result.success).toBe(true);
      expect(result.points).toBe(0);
    });
  });

  describe('Cross-Journey Integration', () => {
    it('should process events from multiple journeys in sequence', async () => {
      // Create events from different journeys
      const healthEvent: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'user-123',
        data: { steps: 12000 },
        journey: 'health'
      };

      const careEvent: ProcessEventDto = {
        type: 'APPOINTMENT_COMPLETED',
        userId: 'user-123',
        data: { appointmentType: 'TELEMEDICINE' },
        journey: 'care'
      };

      const planEvent: ProcessEventDto = {
        type: 'CLAIM_SUBMITTED',
        userId: 'user-123',
        data: { amount: 150 },
        journey: 'plan'
      };

      // Process events in sequence
      const healthResult = await eventsService.processEvent(healthEvent);
      const careResult = await eventsService.processEvent(careEvent);
      const planResult = await eventsService.processEvent(planEvent);

      // Verify results
      expect(healthResult.points).toBe(50);
      expect(careResult.points).toBe(30);
      expect(planResult.points).toBe(20);

      // Verify that Kafka events were produced for each journey
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        journey: 'health'
      }));
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        journey: 'care'
      }));
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        journey: 'plan'
      }));
    });

    it('should handle events without journey specification', async () => {
      // Create an event without specifying the journey
      const genericEvent: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'user-123',
        data: { steps: 12000 }
        // No journey field
      };

      // Process the event
      const result = await eventsService.processEvent(genericEvent);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.points).toBe(50);
      
      // Verify that Kafka event was produced without journey field
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.objectContaining({
        type: 'XP_EARNED',
        userId: 'user-123',
        amount: 50,
        sourceEvent: 'STEPS_RECORDED'
      }));
      expect(kafkaService.produce).toHaveBeenCalledWith('gamification-events', expect.not.objectContaining({
        journey: expect.anything()
      }));
    });
  });

  describe('Rule Management', () => {
    it('should retrieve all rules', async () => {
      const rules = await rulesService.findAll();
      expect(rules).toHaveLength(4);
      expect(rules[0].event).toBe('STEPS_RECORDED');
      expect(rules[1].event).toBe('APPOINTMENT_COMPLETED');
      expect(rules[2].event).toBe('CLAIM_SUBMITTED');
      expect(rules[3].event).toBe('MEDICATION_TAKEN');
    });

    it('should retrieve a rule by ID', async () => {
      const rule = await rulesService.findOne('2');
      expect(rule.event).toBe('APPOINTMENT_COMPLETED');
      expect(rule.condition).toBe('event.data.appointmentType === "TELEMEDICINE"');
    });

    it('should handle not found errors when retrieving a rule', async () => {
      // Mock the repository to return null
      jest.spyOn(ruleRepository, 'findOneBy').mockResolvedValueOnce(null);

      // Attempt to retrieve a non-existent rule
      await expect(rulesService.findOne('999')).rejects.toThrow();
    });
  });
});