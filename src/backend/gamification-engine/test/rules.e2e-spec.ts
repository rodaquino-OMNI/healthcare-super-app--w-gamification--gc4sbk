import { HttpStatus, INestApplication } from '@nestjs/common'; // v10.0.0+
import { Test } from '@nestjs/testing'; // v10.0.0+
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals'; // v29.0.0+
import * as request from 'supertest'; // 6.3.3
import { RulesService } from '../src/rules/rules.service';
import { Rule } from '../src/rules/entities/rule.entity';
import { ProfilesService } from '../src/profiles/profiles.service';
import { AchievementsService } from '../src/achievements/achievements.service';
import { QuestsService } from '../src/quests/quests.service';
import { RewardsService } from '../src/rewards/rewards.service';
import { LoggerService } from 'src/backend/shared/src/logging/logger.service';
import { KafkaService } from 'src/backend/shared/src/kafka/kafka.service';
import { PrismaService } from 'src/backend/shared/src/database/prisma.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProcessEventDto } from '../src/events/dto/process-event.dto';

/**
 * End-to-end tests for the RulesService.
 * These tests verify that rules are correctly evaluated and actions are executed
 * based on events from different journeys.
 */
describe('RulesService (e2e)', () => {
  let app: INestApplication;
  let rulesService: RulesService;
  let profilesService: ProfilesService;
  let achievementsService: AchievementsService;
  let questsService: QuestsService;
  let rewardsService: RewardsService;
  let loggerService: LoggerService;
  let kafkaService: KafkaService;
  let prismaService: PrismaService;
  let ruleRepository: Repository<Rule>;

  // Mock rules for testing
  const mockRules: Rule[] = [
    {
      id: 'rule-1',
      event: 'STEPS_RECORDED',
      condition: 'event.data.steps >= 10000',
      actions: JSON.stringify([
        { type: 'AWARD_XP', value: 100 },
        { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'daily-steps' }
      ]),
    },
    {
      id: 'rule-2',
      event: 'APPOINTMENT_BOOKED',
      condition: 'event.data.appointmentType === "TELEMEDICINE"',
      actions: JSON.stringify([
        { type: 'AWARD_XP', value: 50 },
        { type: 'PROGRESS_QUEST', questId: 'telemedicine-master', progress: 1 }
      ]),
    },
    {
      id: 'rule-3',
      event: 'CLAIM_SUBMITTED',
      condition: 'event.data.amount > 100',
      actions: JSON.stringify([
        { type: 'AWARD_XP', value: 75 }
      ]),
    },
    {
      id: 'rule-4',
      event: 'MEDICATION_TAKEN',
      condition: 'event.data.consecutive >= 7',
      actions: JSON.stringify([
        { type: 'AWARD_XP', value: 150 },
        { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'medication-adherence' }
      ]),
    }
  ];

  // Mock user profile
  const mockUserProfile = {
    id: 'profile-1',
    userId: 'test-user-123',
    level: 1,
    xp: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    achievements: [],
    quests: []
  };

  // Mock updated profile with XP
  const mockUpdatedProfile = {
    ...mockUserProfile,
    xp: 100
  };

  // Mock achievement
  const mockAchievement = {
    id: 'daily-steps',
    title: 'Step Master',
    description: 'Record 10,000 steps in a day',
    xpReward: 100,
    journey: 'health',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    // Create a testing module with all necessary dependencies
    const moduleFixture = await Test.createTestingModule({
      providers: [
        RulesService,
        {
          provide: getRepositoryToken(Rule),
          useClass: Repository,
        },
        {
          provide: ProfilesService,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
          }
        },
        {
          provide: AchievementsService,
          useValue: {
            findById: jest.fn(),
            create: jest.fn()
          }
        },
        {
          provide: QuestsService,
          useValue: {
            findById: jest.fn(),
            updateProgress: jest.fn()
          }
        },
        {
          provide: RewardsService,
          useValue: {
            findById: jest.fn(),
            create: jest.fn()
          }
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
          }
        },
        {
          provide: KafkaService,
          useValue: {
            produce: jest.fn()
          }
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get instances of the services for testing
    rulesService = moduleFixture.get<RulesService>(RulesService);
    profilesService = moduleFixture.get<ProfilesService>(ProfilesService);
    achievementsService = moduleFixture.get<AchievementsService>(AchievementsService);
    questsService = moduleFixture.get<QuestsService>(QuestsService);
    rewardsService = moduleFixture.get<RewardsService>(RewardsService);
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    ruleRepository = moduleFixture.get<Repository<Rule>>(getRepositoryToken(Rule));

    // Mock the rule repository
    jest.spyOn(ruleRepository, 'find').mockResolvedValue(mockRules);
    jest.spyOn(ruleRepository, 'findOneBy').mockImplementation(async (options) => {
      const rule = mockRules.find(r => r.id === options.id);
      return rule || null;
    });
  });

  afterEach(async () => {
    // Clean up resources after each test
    if (app) {
      await app.close();
    }
    jest.clearAllMocks();
  });

  describe('Rule Evaluation', () => {
    it('should evaluate a rule with a numeric condition correctly', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to update the profile with XP
      jest.spyOn(profilesService, 'update').mockResolvedValue(mockUpdatedProfile);
      
      // Create a steps recorded event that meets the condition
      const event: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'test-user-123',
        data: { steps: 12000 },
        journey: 'health'
      };
      
      // Spy on the evaluateRule method
      const evaluateSpy = jest.spyOn(rulesService, 'evaluateRule');
      
      // Call the method directly
      const result = rulesService.evaluateRule(event, mockUserProfile);
      
      // Verify the rule was evaluated correctly
      expect(evaluateSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should evaluate a rule with a string comparison condition correctly', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Create an appointment booked event that meets the condition
      const event: ProcessEventDto = {
        type: 'APPOINTMENT_BOOKED',
        userId: 'test-user-123',
        data: { appointmentType: 'TELEMEDICINE', doctorId: 'doctor-123' },
        journey: 'care'
      };
      
      // Spy on the evaluateRule method
      const evaluateSpy = jest.spyOn(rulesService, 'evaluateRule');
      
      // Call the method directly
      const result = rulesService.evaluateRule(event, mockUserProfile);
      
      // Verify the rule was evaluated correctly
      expect(evaluateSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should return false when a rule condition is not met', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Create a steps recorded event that does NOT meet the condition
      const event: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'test-user-123',
        data: { steps: 5000 }, // Less than the required 10000
        journey: 'health'
      };
      
      // Spy on the evaluateRule method
      const evaluateSpy = jest.spyOn(rulesService, 'evaluateRule');
      
      // Call the method directly
      const result = rulesService.evaluateRule(event, mockUserProfile);
      
      // Verify the rule was evaluated correctly
      expect(evaluateSpy).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('Action Execution', () => {
    it('should award XP when a rule condition is met', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to update the profile with XP
      jest.spyOn(profilesService, 'update').mockResolvedValue(mockUpdatedProfile);
      
      // Create a steps recorded event that meets the condition
      const event: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'test-user-123',
        data: { steps: 12000 },
        journey: 'health'
      };
      
      // Mock the findAll method to return only the steps rule
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([mockRules[0]]);
      
      // Mock the evaluateRule method to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the profile was updated with XP
      expect(profilesService.update).toHaveBeenCalledWith('test-user-123', { xp: 100 });
    });
    
    it('should unlock an achievement when a rule condition is met', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the achievementsService to return an achievement
      jest.spyOn(achievementsService, 'findById').mockResolvedValue(mockAchievement);
      
      // Create a steps recorded event that meets the condition
      const event: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'test-user-123',
        data: { steps: 12000 },
        journey: 'health'
      };
      
      // Mock the findAll method to return only the steps rule
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([mockRules[0]]);
      
      // Mock the evaluateRule method to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the achievement was unlocked
      expect(achievementsService.findById).toHaveBeenCalledWith('daily-steps');
    });
    
    it('should progress a quest when a rule condition is met', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Create an appointment booked event that meets the condition
      const event: ProcessEventDto = {
        type: 'APPOINTMENT_BOOKED',
        userId: 'test-user-123',
        data: { appointmentType: 'TELEMEDICINE', doctorId: 'doctor-123' },
        journey: 'care'
      };
      
      // Mock the findAll method to return only the appointment rule
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([mockRules[1]]);
      
      // Mock the evaluateRule method to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the quest was progressed
      expect(questsService.updateProgress).toHaveBeenCalledWith('test-user-123', 'telemedicine-master', 1);
    });
  });

  describe('Journey-Specific Processing', () => {
    it('should process health journey events correctly', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to update the profile with XP
      jest.spyOn(profilesService, 'update').mockResolvedValue(mockUpdatedProfile);
      
      // Create a steps recorded event from the health journey
      const event: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'test-user-123',
        data: { steps: 12000 },
        journey: 'health'
      };
      
      // Mock the findAll method to return only the steps rule
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([mockRules[0]]);
      
      // Mock the evaluateRule method to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the profile was updated with XP
      expect(profilesService.update).toHaveBeenCalledWith('test-user-123', { xp: 100 });
      
      // Verify that the achievement was unlocked
      expect(achievementsService.findById).toHaveBeenCalledWith('daily-steps');
    });
    
    it('should process care journey events correctly', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to update the profile with XP
      jest.spyOn(profilesService, 'update').mockResolvedValue({
        ...mockUserProfile,
        xp: 50
      });
      
      // Create an appointment booked event from the care journey
      const event: ProcessEventDto = {
        type: 'APPOINTMENT_BOOKED',
        userId: 'test-user-123',
        data: { appointmentType: 'TELEMEDICINE', doctorId: 'doctor-123' },
        journey: 'care'
      };
      
      // Mock the findAll method to return only the appointment rule
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([mockRules[1]]);
      
      // Mock the evaluateRule method to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the profile was updated with XP
      expect(profilesService.update).toHaveBeenCalledWith('test-user-123', { xp: 50 });
      
      // Verify that the quest was progressed
      expect(questsService.updateProgress).toHaveBeenCalledWith('test-user-123', 'telemedicine-master', 1);
    });
    
    it('should process plan journey events correctly', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to update the profile with XP
      jest.spyOn(profilesService, 'update').mockResolvedValue({
        ...mockUserProfile,
        xp: 75
      });
      
      // Create a claim submitted event from the plan journey
      const event: ProcessEventDto = {
        type: 'CLAIM_SUBMITTED',
        userId: 'test-user-123',
        data: { amount: 150, claimType: 'MEDICAL' },
        journey: 'plan'
      };
      
      // Mock the findAll method to return only the claim rule
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([mockRules[2]]);
      
      // Mock the evaluateRule method to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the profile was updated with XP
      expect(profilesService.update).toHaveBeenCalledWith('test-user-123', { xp: 75 });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during rule evaluation gracefully', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Create an event with invalid data that would cause an evaluation error
      const event: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'test-user-123',
        data: null, // This will cause an error when trying to access event.data.steps
        journey: 'health'
      };
      
      // Mock the findAll method to return the steps rule
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([mockRules[0]]);
      
      // Mock the evaluateRule method to throw an error
      jest.spyOn(rulesService, 'evaluateRule').mockImplementation(() => {
        throw new Error('Error evaluating rule');
      });
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the error was logged
      expect(loggerService.error).toHaveBeenCalled();
      
      // Verify that the profile was not updated
      expect(profilesService.update).not.toHaveBeenCalled();
    });
    
    it('should handle errors during action execution gracefully', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to throw an error when updating
      jest.spyOn(profilesService, 'update').mockImplementation(() => {
        throw new Error('Error updating profile');
      });
      
      // Create a steps recorded event that meets the condition
      const event: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'test-user-123',
        data: { steps: 12000 },
        journey: 'health'
      };
      
      // Mock the findAll method to return only the steps rule
      jest.spyOn(rulesService, 'findAll').mockResolvedValue([mockRules[0]]);
      
      // Mock the evaluateRule method to return true
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the error was logged
      expect(loggerService.error).toHaveBeenCalled();
    });
    
    it('should handle missing user profiles by creating them', async () => {
      // Mock the profilesService to throw a not found error
      jest.spyOn(profilesService, 'findById').mockImplementation(() => {
        throw new Error('Profile not found');
      });
      
      // Mock the profilesService to create a new profile
      jest.spyOn(profilesService, 'create').mockResolvedValue(mockUserProfile);
      
      // Create a steps recorded event
      const event: ProcessEventDto = {
        type: 'STEPS_RECORDED',
        userId: 'test-user-123',
        data: { steps: 12000 },
        journey: 'health'
      };
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that a new profile was created
      expect(profilesService.create).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('Complex Rule Scenarios', () => {
    it('should handle multiple matching rules for a single event', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to update the profile with XP
      jest.spyOn(profilesService, 'update').mockResolvedValue(mockUpdatedProfile);
      
      // Create a medication taken event
      const event: ProcessEventDto = {
        type: 'MEDICATION_TAKEN',
        userId: 'test-user-123',
        data: { consecutive: 7, medicationId: 'med-123' },
        journey: 'care'
      };
      
      // Create two rules that match the same event
      const multipleRules: Rule[] = [
        {
          id: 'rule-4',
          event: 'MEDICATION_TAKEN',
          condition: 'event.data.consecutive >= 7',
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 150 },
            { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'medication-adherence' }
          ]),
        },
        {
          id: 'rule-5',
          event: 'MEDICATION_TAKEN',
          condition: 'event.data.consecutive >= 5',
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 50 }
          ]),
        }
      ];
      
      // Mock the findAll method to return both rules
      jest.spyOn(rulesService, 'findAll').mockResolvedValue(multipleRules);
      
      // Mock the evaluateRule method to return true for both rules
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the profile was updated with XP from both rules (150 + 50 = 200)
      expect(profilesService.update).toHaveBeenCalledWith('test-user-123', { xp: 200 });
      
      // Verify that the achievement was unlocked
      expect(achievementsService.findById).toHaveBeenCalledWith('medication-adherence');
    });
    
    it('should handle events that match rules from multiple journeys', async () => {
      // Mock the profilesService to return a user profile
      jest.spyOn(profilesService, 'findById').mockResolvedValue(mockUserProfile);
      
      // Mock the profilesService to update the profile with XP
      jest.spyOn(profilesService, 'update').mockResolvedValue(mockUpdatedProfile);
      
      // Create a cross-journey event
      const event: ProcessEventDto = {
        type: 'GOAL_ACHIEVED',
        userId: 'test-user-123',
        data: { goalId: 'goal-123', journeys: ['health', 'care'] },
        journey: 'health' // Primary journey
      };
      
      // Create rules from different journeys that match the same event
      const crossJourneyRules: Rule[] = [
        {
          id: 'rule-6',
          event: 'GOAL_ACHIEVED',
          condition: 'event.data.journeys.includes("health")',
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 100 }
          ]),
        },
        {
          id: 'rule-7',
          event: 'GOAL_ACHIEVED',
          condition: 'event.data.journeys.includes("care")',
          actions: JSON.stringify([
            { type: 'AWARD_XP', value: 75 }
          ]),
        }
      ];
      
      // Mock the findAll method to return both rules
      jest.spyOn(rulesService, 'findAll').mockResolvedValue(crossJourneyRules);
      
      // Mock the evaluateRule method to return true for both rules
      jest.spyOn(rulesService, 'evaluateRule').mockReturnValue(true);
      
      // Process the event
      await rulesService['processEvent'](event);
      
      // Verify that the profile was updated with XP from both rules (100 + 75 = 175)
      expect(profilesService.update).toHaveBeenCalledWith('test-user-123', { xp: 175 });
    });
  });
});