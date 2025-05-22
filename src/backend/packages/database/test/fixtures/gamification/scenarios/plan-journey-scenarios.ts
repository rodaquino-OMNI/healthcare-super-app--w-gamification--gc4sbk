/**
 * @file Plan Journey Scenarios for Gamification Testing
 * 
 * This file contains complex end-to-end test scenarios for the Plan journey in the gamification system.
 * It provides fixtures that simulate users managing insurance claims, exploring benefits, and comparing plans,
 * triggering gamification events, and earning achievements.
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';
import { 
  EventType, 
  EventJourney, 
  GamificationEvent,
  ClaimEventPayload,
  BenefitUtilizedPayload,
  PlanEventPayload
} from '@austa/interfaces/gamification/events';
import { 
  Achievement, 
  UserAchievement 
} from '@austa/interfaces/gamification/achievements';
import { 
  Rule 
} from '@austa/interfaces/gamification/rules';
import { 
  GameProfile 
} from '@austa/interfaces/gamification/profiles';
import { 
  Reward, 
  UserReward 
} from '@austa/interfaces/gamification/rewards';

// Helper function to create timestamps
const createTimestamp = (daysFromNow: number = 0): string => {
  const date = daysFromNow >= 0 ? addDays(new Date(), daysFromNow) : subDays(new Date(), Math.abs(daysFromNow));
  return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
};

/**
 * Scenario: User submits multiple complete claims with all required documentation
 * 
 * This scenario tests the "Claim Master" achievement path where a user submits
 * multiple complete claims with all required documentation, triggering the
 * achievement at different levels.
 */
export const claimMasterScenario = {
  name: 'Claim Master Achievement Path',
  description: 'User submits multiple complete claims with all required documentation',
  
  // Test user profile
  profile: {
    id: uuidv4(),
    userId: uuidv4(),
    level: 2,
    totalXp: 350,
    currentLevelXp: 150,
    nextLevelXp: 500,
    createdAt: createTimestamp(-30),
    updatedAt: createTimestamp(-1),
  } as GameProfile,
  
  // Achievement definition
  achievements: [
    {
      id: uuidv4(),
      name: 'claim-master',
      title: 'Mestre em Reembolsos',
      description: 'Submeta solicitações de reembolso completas',
      journey: 'plan',
      icon: 'receipt',
      levels: 3,
      xpPerLevel: [50, 100, 200],
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Achievement
  ],
  
  // User achievement progress
  userAchievements: [
    {
      id: uuidv4(),
      userId: '', // Will be populated from profile.userId
      achievementId: '', // Will be populated from achievements[0].id
      currentLevel: 1,
      progress: 2, // Already submitted 2 complete claims
      maxLevel: 3,
      completedAt: null,
      createdAt: createTimestamp(-15),
      updatedAt: createTimestamp(-5),
    } as UserAchievement
  ],
  
  // Rules that trigger on claim events
  rules: [
    {
      id: uuidv4(),
      name: 'claim-submission-complete',
      description: 'Award XP and progress achievement when user submits a complete claim',
      eventType: EventType.CLAIM_SUBMITTED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'AND',
        conditions: [
          {
            type: 'PROPERTY_EQUALS',
            property: 'data.documentCount',
            value: 3,
            valueType: 'number'
          },
          {
            type: 'PROPERTY_EXISTS',
            property: 'data.amount'
          }
        ]
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 25,
          reason: 'Submitting a complete claim with all documentation'
        },
        {
          type: 'PROGRESS_ACHIEVEMENT',
          achievementName: 'claim-master',
          incrementBy: 1
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Rule,
    {
      id: uuidv4(),
      name: 'claim-approved',
      description: 'Award XP when a claim is approved',
      eventType: EventType.CLAIM_APPROVED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'PROPERTY_EXISTS',
        property: 'data.amount'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 50,
          reason: 'Claim approved'
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Rule
  ],
  
  // Events that will be processed in sequence
  events: [
    {
      eventId: uuidv4(),
      type: EventType.CLAIM_SUBMITTED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(0),
        claimId: uuidv4(),
        claimType: 'Consulta Médica',
        amount: 250.00,
        documentCount: 3
      } as ClaimEventPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(0),
      source: 'plan-service'
    } as GamificationEvent,
    {
      eventId: uuidv4(),
      type: EventType.CLAIM_DOCUMENT_UPLOADED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(0),
        claimId: uuidv4(),
        claimType: 'Consulta Médica',
        documentCount: 1
      } as ClaimEventPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(0),
      source: 'plan-service'
    } as GamificationEvent,
    {
      eventId: uuidv4(),
      type: EventType.CLAIM_APPROVED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(1),
        claimId: uuidv4(),
        claimType: 'Consulta Médica',
        amount: 250.00
      } as ClaimEventPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(1),
      source: 'plan-service'
    } as GamificationEvent
  ],
  
  // Expected outcomes after processing all events
  expectedOutcomes: {
    profile: {
      level: 2,
      totalXp: 425, // 350 + 25 (complete claim) + 50 (approved claim)
      currentLevelXp: 225, // 150 + 25 + 50
    },
    userAchievements: [
      {
        achievementName: 'claim-master',
        currentLevel: 2, // Leveled up from 1 to 2
        progress: 3, // Increased from 2 to 3
      }
    ],
    events: [
      {
        type: EventType.XP_EARNED,
        amount: 25,
        source: 'claim-submission-complete'
      },
      {
        type: EventType.XP_EARNED,
        amount: 50,
        source: 'claim-approved'
      },
      {
        type: EventType.ACHIEVEMENT_UNLOCKED,
        achievementTitle: 'Mestre em Reembolsos',
        achievementLevel: 2
      }
    ]
  }
};

/**
 * Scenario: User explores and utilizes multiple benefits
 * 
 * This scenario tests the gamification flow when a user explores and utilizes
 * various benefits in their insurance plan, earning XP and progressing towards
 * achievements.
 */
export const benefitUtilizationScenario = {
  name: 'Benefit Utilization Path',
  description: 'User explores and utilizes multiple benefits in their insurance plan',
  
  // Test user profile
  profile: {
    id: uuidv4(),
    userId: uuidv4(),
    level: 3,
    totalXp: 750,
    currentLevelXp: 250,
    nextLevelXp: 1000,
    createdAt: createTimestamp(-45),
    updatedAt: createTimestamp(-2),
  } as GameProfile,
  
  // Rules that trigger on benefit events
  rules: [
    {
      id: uuidv4(),
      name: 'benefit-utilized',
      description: 'Award XP when user utilizes a benefit',
      eventType: EventType.BENEFIT_UTILIZED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'PROPERTY_EXISTS',
        property: 'data.benefitId'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 30,
          reason: 'Utilizing a plan benefit'
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Rule,
    {
      id: uuidv4(),
      name: 'coverage-reviewed',
      description: 'Award XP when user reviews their coverage details',
      eventType: EventType.COVERAGE_REVIEWED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'ALWAYS_TRUE'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 15,
          reason: 'Reviewing coverage details'
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Rule
  ],
  
  // Events that will be processed in sequence
  events: [
    {
      eventId: uuidv4(),
      type: EventType.COVERAGE_REVIEWED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(0),
        metadata: {
          section: 'coverage-details',
          timeSpent: 120 // seconds
        }
      },
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(0),
      source: 'plan-service'
    } as GamificationEvent,
    {
      eventId: uuidv4(),
      type: EventType.BENEFIT_UTILIZED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(0),
        benefitId: uuidv4(),
        benefitType: 'Telemedicina',
        value: 1
      } as BenefitUtilizedPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(0),
      source: 'plan-service'
    } as GamificationEvent,
    {
      eventId: uuidv4(),
      type: EventType.BENEFIT_UTILIZED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(1),
        benefitId: uuidv4(),
        benefitType: 'Desconto em Medicamentos',
        value: 25.50
      } as BenefitUtilizedPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(1),
      source: 'plan-service'
    } as GamificationEvent
  ],
  
  // Expected outcomes after processing all events
  expectedOutcomes: {
    profile: {
      level: 3,
      totalXp: 825, // 750 + 15 (coverage review) + 30 (first benefit) + 30 (second benefit)
      currentLevelXp: 325, // 250 + 15 + 30 + 30
    },
    events: [
      {
        type: EventType.XP_EARNED,
        amount: 15,
        source: 'coverage-reviewed'
      },
      {
        type: EventType.XP_EARNED,
        amount: 30,
        source: 'benefit-utilized'
      },
      {
        type: EventType.XP_EARNED,
        amount: 30,
        source: 'benefit-utilized'
      }
    ]
  }
};

/**
 * Scenario: User compares and selects a new insurance plan
 * 
 * This scenario tests the gamification flow when a user compares multiple
 * insurance plans and selects a new one, earning XP and potentially unlocking
 * achievements.
 */
export const planSelectionScenario = {
  name: 'Plan Selection Path',
  description: 'User compares and selects a new insurance plan',
  
  // Test user profile
  profile: {
    id: uuidv4(),
    userId: uuidv4(),
    level: 4,
    totalXp: 1200,
    currentLevelXp: 200,
    nextLevelXp: 1500,
    createdAt: createTimestamp(-60),
    updatedAt: createTimestamp(-3),
  } as GameProfile,
  
  // Achievement definition
  achievements: [
    {
      id: uuidv4(),
      name: 'plan-optimizer',
      title: 'Otimizador de Plano',
      description: 'Compare e selecione planos para encontrar a melhor opção',
      journey: 'plan',
      icon: 'chart-line',
      levels: 2,
      xpPerLevel: [75, 150],
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Achievement
  ],
  
  // User achievement progress
  userAchievements: [
    {
      id: uuidv4(),
      userId: '', // Will be populated from profile.userId
      achievementId: '', // Will be populated from achievements[0].id
      currentLevel: 0,
      progress: 0,
      maxLevel: 2,
      completedAt: null,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as UserAchievement
  ],
  
  // Rules that trigger on plan events
  rules: [
    {
      id: uuidv4(),
      name: 'plan-compared',
      description: 'Award XP when user compares insurance plans',
      eventType: EventType.PLAN_COMPARED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'PROPERTY_ARRAY_LENGTH_GTE',
        property: 'data.comparedPlanIds',
        value: 2,
        valueType: 'number'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 40,
          reason: 'Comparing insurance plans'
        },
        {
          type: 'PROGRESS_ACHIEVEMENT',
          achievementName: 'plan-optimizer',
          incrementBy: 1
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Rule,
    {
      id: uuidv4(),
      name: 'plan-selected',
      description: 'Award XP when user selects a new insurance plan',
      eventType: EventType.PLAN_SELECTED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'PROPERTY_EXISTS',
        property: 'data.planId'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 100,
          reason: 'Selecting a new insurance plan'
        },
        {
          type: 'PROGRESS_ACHIEVEMENT',
          achievementName: 'plan-optimizer',
          incrementBy: 1
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Rule,
    {
      id: uuidv4(),
      name: 'plan-upgraded',
      description: 'Award bonus XP when user upgrades to a better plan',
      eventType: EventType.PLAN_SELECTED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'AND',
        conditions: [
          {
            type: 'PROPERTY_EXISTS',
            property: 'data.planId'
          },
          {
            type: 'PROPERTY_EQUALS',
            property: 'data.isUpgrade',
            value: true,
            valueType: 'boolean'
          }
        ]
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 50,
          reason: 'Upgrading to a better insurance plan'
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as Rule
  ],
  
  // Events that will be processed in sequence
  events: [
    {
      eventId: uuidv4(),
      type: EventType.PLAN_COMPARED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(0),
        planId: uuidv4(),
        planType: 'Standard',
        comparedPlanIds: [uuidv4(), uuidv4(), uuidv4()]
      } as PlanEventPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(0),
      source: 'plan-service'
    } as GamificationEvent,
    {
      eventId: uuidv4(),
      type: EventType.PLAN_SELECTED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(1),
        planId: uuidv4(),
        planType: 'Premium',
        isUpgrade: true
      } as PlanEventPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(1),
      source: 'plan-service'
    } as GamificationEvent
  ],
  
  // Expected outcomes after processing all events
  expectedOutcomes: {
    profile: {
      level: 4,
      totalXp: 1390, // 1200 + 40 (plan compared) + 100 (plan selected) + 50 (plan upgraded)
      currentLevelXp: 390, // 200 + 40 + 100 + 50
    },
    userAchievements: [
      {
        achievementName: 'plan-optimizer',
        currentLevel: 2, // Leveled up from 0 to 2
        progress: 2, // Increased from 0 to 2
        completedAt: expect.any(String) // Should be completed
      }
    ],
    events: [
      {
        type: EventType.XP_EARNED,
        amount: 40,
        source: 'plan-compared'
      },
      {
        type: EventType.XP_EARNED,
        amount: 100,
        source: 'plan-selected'
      },
      {
        type: EventType.XP_EARNED,
        amount: 50,
        source: 'plan-upgraded'
      },
      {
        type: EventType.ACHIEVEMENT_UNLOCKED,
        achievementTitle: 'Otimizador de Plano',
        achievementLevel: 1
      },
      {
        type: EventType.ACHIEVEMENT_UNLOCKED,
        achievementTitle: 'Otimizador de Plano',
        achievementLevel: 2
      }
    ]
  }
};

/**
 * Scenario: User redeems rewards earned through the gamification system
 * 
 * This scenario tests the reward redemption flow where a user redeems rewards
 * they've earned through the gamification system, such as discounts on their
 * insurance plan or other benefits.
 */
export const rewardRedemptionScenario = {
  name: 'Reward Redemption Path',
  description: 'User redeems rewards earned through the gamification system',
  
  // Test user profile
  profile: {
    id: uuidv4(),
    userId: uuidv4(),
    level: 5,
    totalXp: 2500,
    currentLevelXp: 500,
    nextLevelXp: 3000,
    createdAt: createTimestamp(-90),
    updatedAt: createTimestamp(-5),
  } as GameProfile,
  
  // Rewards available to the user
  rewards: [
    {
      id: uuidv4(),
      name: 'insurance-discount',
      title: 'Desconto na Mensalidade',
      description: 'Desconto de 5% na próxima mensalidade do seu plano',
      type: 'discount',
      value: 5,
      requiredLevel: 5,
      requiredXp: 2000,
      journey: 'plan',
      isActive: true,
      createdAt: createTimestamp(-90),
      updatedAt: createTimestamp(-90),
    } as Reward,
    {
      id: uuidv4(),
      name: 'premium-telemedicine',
      title: 'Consulta Premium de Telemedicina',
      description: 'Uma consulta de telemedicina com especialista premium sem coparticipação',
      type: 'service',
      value: 1,
      requiredLevel: 4,
      requiredXp: 1500,
      journey: 'care',
      isActive: true,
      createdAt: createTimestamp(-90),
      updatedAt: createTimestamp(-90),
    } as Reward
  ],
  
  // User rewards
  userRewards: [
    {
      id: uuidv4(),
      userId: '', // Will be populated from profile.userId
      rewardId: '', // Will be populated from rewards[0].id
      isRedeemed: false,
      redeemedAt: null,
      expiresAt: createTimestamp(30), // Expires in 30 days
      createdAt: createTimestamp(-10),
      updatedAt: createTimestamp(-10),
    } as UserReward,
    {
      id: uuidv4(),
      userId: '', // Will be populated from profile.userId
      rewardId: '', // Will be populated from rewards[1].id
      isRedeemed: false,
      redeemedAt: null,
      expiresAt: createTimestamp(30), // Expires in 30 days
      createdAt: createTimestamp(-15),
      updatedAt: createTimestamp(-15),
    } as UserReward
  ],
  
  // Rules that trigger on reward events
  rules: [
    {
      id: uuidv4(),
      name: 'reward-redeemed',
      description: 'Award XP when user redeems a reward',
      eventType: EventType.REWARD_REDEEMED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'PROPERTY_EXISTS',
        property: 'data.rewardId'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 20,
          reason: 'Redeeming a reward'
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-90),
      updatedAt: createTimestamp(-90),
    } as Rule
  ],
  
  // Events that will be processed in sequence
  events: [
    {
      eventId: uuidv4(),
      type: EventType.REWARD_REDEEMED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(0),
        rewardId: '', // Will be populated from rewards[0].id
        rewardType: 'discount',
        rewardValue: 5
      },
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(0),
      source: 'plan-service'
    } as GamificationEvent,
    {
      eventId: uuidv4(),
      type: EventType.REWARD_REDEEMED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(1),
        rewardId: '', // Will be populated from rewards[1].id
        rewardType: 'service',
        rewardValue: 1
      },
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(1),
      source: 'plan-service'
    } as GamificationEvent
  ],
  
  // Expected outcomes after processing all events
  expectedOutcomes: {
    profile: {
      level: 5,
      totalXp: 2540, // 2500 + 20 (first reward) + 20 (second reward)
      currentLevelXp: 540, // 500 + 20 + 20
    },
    userRewards: [
      {
        rewardName: 'insurance-discount',
        isRedeemed: true,
        redeemedAt: expect.any(String)
      },
      {
        rewardName: 'premium-telemedicine',
        isRedeemed: true,
        redeemedAt: expect.any(String)
      }
    ],
    events: [
      {
        type: EventType.XP_EARNED,
        amount: 20,
        source: 'reward-redeemed'
      },
      {
        type: EventType.XP_EARNED,
        amount: 20,
        source: 'reward-redeemed'
      }
    ]
  }
};

/**
 * Comprehensive Plan journey scenario that combines multiple aspects
 * 
 * This scenario tests a complete user journey through the Plan section of the app,
 * including claim submission, benefit utilization, plan comparison, and reward redemption.
 */
export const comprehensivePlanJourneyScenario = {
  name: 'Comprehensive Plan Journey',
  description: 'Complete user journey through the Plan section, including claims, benefits, plan selection, and rewards',
  
  // Test user profile
  profile: {
    id: uuidv4(),
    userId: uuidv4(),
    level: 3,
    totalXp: 800,
    currentLevelXp: 300,
    nextLevelXp: 1000,
    createdAt: createTimestamp(-120),
    updatedAt: createTimestamp(-7),
  } as GameProfile,
  
  // Achievement definitions
  achievements: [
    {
      id: uuidv4(),
      name: 'claim-master',
      title: 'Mestre em Reembolsos',
      description: 'Submeta solicitações de reembolso completas',
      journey: 'plan',
      icon: 'receipt',
      levels: 3,
      xpPerLevel: [50, 100, 200],
      createdAt: createTimestamp(-120),
      updatedAt: createTimestamp(-120),
    } as Achievement,
    {
      id: uuidv4(),
      name: 'plan-optimizer',
      title: 'Otimizador de Plano',
      description: 'Compare e selecione planos para encontrar a melhor opção',
      journey: 'plan',
      icon: 'chart-line',
      levels: 2,
      xpPerLevel: [75, 150],
      createdAt: createTimestamp(-120),
      updatedAt: createTimestamp(-120),
    } as Achievement,
    {
      id: uuidv4(),
      name: 'benefit-explorer',
      title: 'Explorador de Benefícios',
      description: 'Explore e utilize os benefícios do seu plano',
      journey: 'plan',
      icon: 'gift',
      levels: 3,
      xpPerLevel: [40, 80, 160],
      createdAt: createTimestamp(-120),
      updatedAt: createTimestamp(-120),
    } as Achievement
  ],
  
  // User achievement progress
  userAchievements: [
    {
      id: uuidv4(),
      userId: '', // Will be populated from profile.userId
      achievementId: '', // Will be populated from achievements[0].id (claim-master)
      currentLevel: 1,
      progress: 2,
      maxLevel: 3,
      completedAt: null,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-30),
    } as UserAchievement,
    {
      id: uuidv4(),
      userId: '', // Will be populated from profile.userId
      achievementId: '', // Will be populated from achievements[1].id (plan-optimizer)
      currentLevel: 0,
      progress: 0,
      maxLevel: 2,
      completedAt: null,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-60),
    } as UserAchievement,
    {
      id: uuidv4(),
      userId: '', // Will be populated from profile.userId
      achievementId: '', // Will be populated from achievements[2].id (benefit-explorer)
      currentLevel: 1,
      progress: 2,
      maxLevel: 3,
      completedAt: null,
      createdAt: createTimestamp(-60),
      updatedAt: createTimestamp(-20),
    } as UserAchievement
  ],
  
  // Rewards available to the user
  rewards: [
    {
      id: uuidv4(),
      name: 'insurance-discount',
      title: 'Desconto na Mensalidade',
      description: 'Desconto de 5% na próxima mensalidade do seu plano',
      type: 'discount',
      value: 5,
      requiredLevel: 4,
      requiredXp: 1200,
      journey: 'plan',
      isActive: true,
      createdAt: createTimestamp(-120),
      updatedAt: createTimestamp(-120),
    } as Reward
  ],
  
  // Rules that trigger on plan journey events
  rules: [
    {
      id: uuidv4(),
      name: 'claim-submission-complete',
      description: 'Award XP and progress achievement when user submits a complete claim',
      eventType: EventType.CLAIM_SUBMITTED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'AND',
        conditions: [
          {
            type: 'PROPERTY_EQUALS',
            property: 'data.documentCount',
            value: 3,
            valueType: 'number'
          },
          {
            type: 'PROPERTY_EXISTS',
            property: 'data.amount'
          }
        ]
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 25,
          reason: 'Submitting a complete claim with all documentation'
        },
        {
          type: 'PROGRESS_ACHIEVEMENT',
          achievementName: 'claim-master',
          incrementBy: 1
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-120),
      updatedAt: createTimestamp(-120),
    } as Rule,
    {
      id: uuidv4(),
      name: 'benefit-utilized',
      description: 'Award XP and progress achievement when user utilizes a benefit',
      eventType: EventType.BENEFIT_UTILIZED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'PROPERTY_EXISTS',
        property: 'data.benefitId'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 30,
          reason: 'Utilizing a plan benefit'
        },
        {
          type: 'PROGRESS_ACHIEVEMENT',
          achievementName: 'benefit-explorer',
          incrementBy: 1
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-120),
      updatedAt: createTimestamp(-120),
    } as Rule,
    {
      id: uuidv4(),
      name: 'plan-compared',
      description: 'Award XP and progress achievement when user compares insurance plans',
      eventType: EventType.PLAN_COMPARED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'PROPERTY_ARRAY_LENGTH_GTE',
        property: 'data.comparedPlanIds',
        value: 2,
        valueType: 'number'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 40,
          reason: 'Comparing insurance plans'
        },
        {
          type: 'PROGRESS_ACHIEVEMENT',
          achievementName: 'plan-optimizer',
          incrementBy: 1
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-120),
      updatedAt: createTimestamp(-120),
    } as Rule,
    {
      id: uuidv4(),
      name: 'plan-selected',
      description: 'Award XP and progress achievement when user selects a new insurance plan',
      eventType: EventType.PLAN_SELECTED,
      journey: EventJourney.PLAN,
      condition: {
        type: 'PROPERTY_EXISTS',
        property: 'data.planId'
      },
      actions: [
        {
          type: 'AWARD_XP',
          amount: 100,
          reason: 'Selecting a new insurance plan'
        },
        {
          type: 'PROGRESS_ACHIEVEMENT',
          achievementName: 'plan-optimizer',
          incrementBy: 1
        }
      ],
      isActive: true,
      createdAt: createTimestamp(-120),
      updatedAt: createTimestamp(-120),
    } as Rule
  ],
  
  // Events that will be processed in sequence
  events: [
    // Day 1: User submits a claim
    {
      eventId: uuidv4(),
      type: EventType.CLAIM_SUBMITTED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(0),
        claimId: uuidv4(),
        claimType: 'Consulta Médica',
        amount: 250.00,
        documentCount: 3
      } as ClaimEventPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(0),
      source: 'plan-service'
    } as GamificationEvent,
    
    // Day 2: User utilizes a benefit
    {
      eventId: uuidv4(),
      type: EventType.BENEFIT_UTILIZED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(1),
        benefitId: uuidv4(),
        benefitType: 'Telemedicina',
        value: 1
      } as BenefitUtilizedPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(1),
      source: 'plan-service'
    } as GamificationEvent,
    
    // Day 3: User compares plans
    {
      eventId: uuidv4(),
      type: EventType.PLAN_COMPARED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(2),
        planId: uuidv4(),
        planType: 'Standard',
        comparedPlanIds: [uuidv4(), uuidv4(), uuidv4()]
      } as PlanEventPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(2),
      source: 'plan-service'
    } as GamificationEvent,
    
    // Day 4: User selects a new plan
    {
      eventId: uuidv4(),
      type: EventType.PLAN_SELECTED,
      userId: '', // Will be populated from profile.userId
      journey: EventJourney.PLAN,
      payload: {
        timestamp: createTimestamp(3),
        planId: uuidv4(),
        planType: 'Premium',
        isUpgrade: true
      } as PlanEventPayload,
      version: { major: 1, minor: 0, patch: 0 },
      createdAt: createTimestamp(3),
      source: 'plan-service'
    } as GamificationEvent
  ],
  
  // Expected outcomes after processing all events
  expectedOutcomes: {
    profile: {
      level: 4, // Leveled up from 3 to 4
      totalXp: 995, // 800 + 25 (claim) + 30 (benefit) + 40 (plan compared) + 100 (plan selected)
      currentLevelXp: 195, // Reset after level up, then 25 + 30 + 40 + 100
    },
    userAchievements: [
      {
        achievementName: 'claim-master',
        currentLevel: 2, // Leveled up from 1 to 2
        progress: 3, // Increased from 2 to 3
      },
      {
        achievementName: 'plan-optimizer',
        currentLevel: 2, // Leveled up from 0 to 2
        progress: 2, // Increased from 0 to 2
        completedAt: expect.any(String) // Should be completed
      },
      {
        achievementName: 'benefit-explorer',
        currentLevel: 2, // Leveled up from 1 to 2
        progress: 3, // Increased from 2 to 3
      }
    ],
    userRewards: [
      {
        rewardName: 'insurance-discount',
        isRedeemed: false,
        redeemedAt: null
      }
    ],
    events: [
      {
        type: EventType.XP_EARNED,
        amount: 25,
        source: 'claim-submission-complete'
      },
      {
        type: EventType.XP_EARNED,
        amount: 30,
        source: 'benefit-utilized'
      },
      {
        type: EventType.XP_EARNED,
        amount: 40,
        source: 'plan-compared'
      },
      {
        type: EventType.XP_EARNED,
        amount: 100,
        source: 'plan-selected'
      },
      {
        type: EventType.ACHIEVEMENT_UNLOCKED,
        achievementTitle: 'Mestre em Reembolsos',
        achievementLevel: 2
      },
      {
        type: EventType.ACHIEVEMENT_UNLOCKED,
        achievementTitle: 'Otimizador de Plano',
        achievementLevel: 1
      },
      {
        type: EventType.ACHIEVEMENT_UNLOCKED,
        achievementTitle: 'Otimizador de Plano',
        achievementLevel: 2
      },
      {
        type: EventType.ACHIEVEMENT_UNLOCKED,
        achievementTitle: 'Explorador de Benefícios',
        achievementLevel: 2
      },
      {
        type: EventType.LEVEL_UP,
        previousLevel: 3,
        newLevel: 4
      },
      {
        type: EventType.REWARD_UNLOCKED,
        rewardTitle: 'Desconto na Mensalidade'
      }
    ]
  }
};

// Export all scenarios
export const planJourneyScenarios = {
  claimMasterScenario,
  benefitUtilizationScenario,
  planSelectionScenario,
  rewardRedemptionScenario,
  comprehensivePlanJourneyScenario
};

export default planJourneyScenarios;