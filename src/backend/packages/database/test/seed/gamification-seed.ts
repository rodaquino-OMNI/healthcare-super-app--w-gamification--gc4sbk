/**
 * @file gamification-seed.ts
 * @description Provides comprehensive seeding functions for Gamification engine test data, including
 * achievements, rewards, rules, and game events. This file is crucial for testing the cross-journey
 * gamification features by establishing test profiles, progress tracking, and achievement triggers
 * that can be consistently reproduced in controlled test environments.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../src/prisma.service';
import { TransactionIsolationLevel } from '../../../src/transactions/transaction.interface';
import {
  SeedFunctionParams,
  SeedOptions,
  SeedResult,
  AchievementTypeSeedData,
  GamificationProfileSeedData,
  AchievementSeedData,
  RewardSeedData,
  GamificationJourneySeedData,
  JourneyType
} from './types';
import {
  seedLogger,
  withTransaction,
  withRetry,
  safeUpsert,
  safeCreate,
  safeConnect,
  deterministicUuid,
  seededRandom,
  seededDate,
  seededBoolean,
  seededArrayItem,
  seededArraySubset,
  executeSeedOperation,
  measureExecutionTime
} from './utils';
import { defaultConfig, getJourneyConfig } from './config';

/**
 * Event types for gamification events
 */
enum EventType {
  // Health journey events
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  HEALTH_GOAL_PROGRESS = 'HEALTH_GOAL_PROGRESS',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  
  // Care journey events
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_ADHERENCE = 'MEDICATION_ADHERENCE',
  TELEMEDICINE_COMPLETED = 'TELEMEDICINE_COMPLETED',
  
  // Plan journey events
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  BENEFIT_USED = 'BENEFIT_USED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  
  // System events
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  ACHIEVEMENT_PROGRESS = 'ACHIEVEMENT_PROGRESS',
  LEVEL_UP = 'LEVEL_UP',
  REWARD_EARNED = 'REWARD_EARNED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  QUEST_STARTED = 'QUEST_STARTED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  QUEST_PROGRESS = 'QUEST_PROGRESS'
}

/**
 * Rule types for gamification rules
 */
enum RuleType {
  SIMPLE_TRIGGER = 'SIMPLE_TRIGGER',
  COUNTER = 'COUNTER',
  STREAK = 'STREAK',
  THRESHOLD = 'THRESHOLD',
  COMPOUND = 'COMPOUND'
}

/**
 * Achievement rarity levels
 */
enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

/**
 * Reward types
 */
enum RewardType {
  DISCOUNT = 'discount',
  CASHBACK = 'cashback',
  GIFT = 'gift',
  SUBSCRIPTION = 'subscription',
  ACCESS = 'access',
  OTHER = 'other'
}

/**
 * Interface for event data used in test event generation
 */
interface EventData {
  type: EventType;
  journey: JourneyType;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Interface for rule data used in test rule generation
 */
interface RuleData {
  name: string;
  type: RuleType;
  eventType: EventType;
  conditions: Record<string, any>;
  pointsAwarded: number;
  cooldownMinutes?: number;
}

/**
 * Interface for achievement progress data used in test progress generation
 */
interface AchievementProgressData {
  achievementType: string;
  userId: string;
  level: number;
  progress: number;
  unlockedAt?: Date;
}

/**
 * Interface for quest data used in test quest generation
 */
interface QuestData {
  name: string;
  description: string;
  journey: JourneyType;
  requiredAchievements: string[];
  pointsAwarded: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

/**
 * Default achievement types for seeding
 */
const DEFAULT_ACHIEVEMENT_TYPES: AchievementTypeSeedData[] = [
  { 
    name: 'health-check-streak', 
    title: 'Monitor de Saúde', 
    description: 'Registre suas métricas de saúde por dias consecutivos',
    journey: 'health',
    icon: 'heart-pulse',
    levels: 3
  },
  { 
    name: 'steps-goal', 
    title: 'Caminhante Dedicado', 
    description: 'Atinja sua meta diária de passos',
    journey: 'health',
    icon: 'footprints',
    levels: 3
  },
  { 
    name: 'appointment-keeper', 
    title: 'Compromisso com a Saúde', 
    description: 'Compareça às consultas agendadas',
    journey: 'care',
    icon: 'calendar-check',
    levels: 3
  },
  { 
    name: 'medication-adherence', 
    title: 'Aderência ao Tratamento', 
    description: 'Tome seus medicamentos conforme prescrito',
    journey: 'care',
    icon: 'pill',
    levels: 3
  },
  { 
    name: 'claim-master', 
    title: 'Mestre em Reembolsos', 
    description: 'Submeta solicitações de reembolso completas',
    journey: 'plan',
    icon: 'receipt',
    levels: 3
  },
  { 
    name: 'cross-journey-explorer', 
    title: 'Explorador Completo', 
    description: 'Utilize recursos de todas as jornadas',
    journey: null,
    icon: 'compass',
    levels: 3
  },
  { 
    name: 'daily-login', 
    title: 'Usuário Fiel', 
    description: 'Acesse o aplicativo por dias consecutivos',
    journey: null,
    icon: 'calendar',
    levels: 5
  },
  { 
    name: 'profile-completer', 
    title: 'Perfil Completo', 
    description: 'Complete todas as informações do seu perfil',
    journey: null,
    icon: 'user-check',
    levels: 1
  },
  { 
    name: 'health-insights-viewer', 
    title: 'Analista de Saúde', 
    description: 'Visualize insights de saúde regularmente',
    journey: 'health',
    icon: 'chart-line',
    levels: 3
  },
  { 
    name: 'telemedicine-user', 
    title: 'Paciente Digital', 
    description: 'Participe de consultas de telemedicina',
    journey: 'care',
    icon: 'video',
    levels: 3
  },
  { 
    name: 'benefit-explorer', 
    title: 'Explorador de Benefícios', 
    description: 'Utilize diferentes benefícios do seu plano',
    journey: 'plan',
    icon: 'gift',
    levels: 3
  }
];

/**
 * Default rules for seeding
 */
const DEFAULT_RULES: RuleData[] = [
  {
    name: 'Health Metric Recording',
    type: RuleType.SIMPLE_TRIGGER,
    eventType: EventType.HEALTH_METRIC_RECORDED,
    conditions: {},
    pointsAwarded: 5
  },
  {
    name: 'Health Goal Achievement',
    type: RuleType.SIMPLE_TRIGGER,
    eventType: EventType.HEALTH_GOAL_ACHIEVED,
    conditions: {},
    pointsAwarded: 20
  },
  {
    name: 'Device Connection',
    type: RuleType.SIMPLE_TRIGGER,
    eventType: EventType.DEVICE_CONNECTED,
    conditions: {
      isFirstConnection: true
    },
    pointsAwarded: 15
  },
  {
    name: 'Appointment Completion',
    type: RuleType.SIMPLE_TRIGGER,
    eventType: EventType.APPOINTMENT_COMPLETED,
    conditions: {},
    pointsAwarded: 10
  },
  {
    name: 'Medication Adherence Streak',
    type: RuleType.STREAK,
    eventType: EventType.MEDICATION_TAKEN,
    conditions: {
      streakDays: 7
    },
    pointsAwarded: 25
  },
  {
    name: 'Claim Submission',
    type: RuleType.SIMPLE_TRIGGER,
    eventType: EventType.CLAIM_SUBMITTED,
    conditions: {
      hasDocuments: true
    },
    pointsAwarded: 10
  },
  {
    name: 'Steps Goal Achievement',
    type: RuleType.THRESHOLD,
    eventType: EventType.HEALTH_METRIC_RECORDED,
    conditions: {
      metricType: 'STEPS',
      threshold: 10000
    },
    pointsAwarded: 15,
    cooldownMinutes: 1440 // 24 hours
  },
  {
    name: 'Telemedicine Session',
    type: RuleType.SIMPLE_TRIGGER,
    eventType: EventType.TELEMEDICINE_COMPLETED,
    conditions: {},
    pointsAwarded: 15
  },
  {
    name: 'Benefit Usage',
    type: RuleType.SIMPLE_TRIGGER,
    eventType: EventType.BENEFIT_USED,
    conditions: {},
    pointsAwarded: 10
  },
  {
    name: 'Daily Login',
    type: RuleType.COUNTER,
    eventType: EventType.LEVEL_UP,
    conditions: {
      count: 1,
      period: 'day'
    },
    pointsAwarded: 5,
    cooldownMinutes: 1440 // 24 hours
  }
];

/**
 * Default rewards for seeding
 */
const DEFAULT_REWARDS: RewardSeedData[] = [
  {
    name: 'Desconto em Consulta',
    description: 'Desconto de 10% em consultas médicas',
    pointCost: 100,
    isAvailable: true
  },
  {
    name: 'Cashback em Medicamentos',
    description: 'Cashback de 5% em medicamentos',
    pointCost: 150,
    isAvailable: true
  },
  {
    name: 'Acesso Premium',
    description: 'Acesso a conteúdo exclusivo por 30 dias',
    pointCost: 200,
    isAvailable: true
  },
  {
    name: 'Consulta Gratuita',
    description: 'Uma consulta médica gratuita',
    pointCost: 500,
    isAvailable: true
  },
  {
    name: 'Kit Fitness',
    description: 'Kit com itens para atividade física',
    pointCost: 300,
    isAvailable: true
  },
  {
    name: 'Assinatura Mensal',
    description: 'Assinatura mensal de serviço de bem-estar',
    pointCost: 400,
    isAvailable: true
  },
  {
    name: 'Exame Gratuito',
    description: 'Um exame médico gratuito',
    pointCost: 350,
    isAvailable: true
  }
];

/**
 * Default quests for seeding
 */
const DEFAULT_QUESTS: QuestData[] = [
  {
    name: 'Iniciante em Saúde',
    description: 'Complete os primeiros passos na jornada de saúde',
    journey: 'health',
    requiredAchievements: ['health-check-streak', 'steps-goal'],
    pointsAwarded: 50,
    startDate: new Date(),
    isActive: true
  },
  {
    name: 'Cuidador Dedicado',
    description: 'Demonstre compromisso com seus cuidados médicos',
    journey: 'care',
    requiredAchievements: ['appointment-keeper', 'medication-adherence'],
    pointsAwarded: 50,
    startDate: new Date(),
    isActive: true
  },
  {
    name: 'Gestor de Benefícios',
    description: 'Aproveite ao máximo seu plano de saúde',
    journey: 'plan',
    requiredAchievements: ['claim-master', 'benefit-explorer'],
    pointsAwarded: 50,
    startDate: new Date(),
    isActive: true
  },
  {
    name: 'Usuário Completo',
    description: 'Explore todas as jornadas do aplicativo',
    journey: null,
    requiredAchievements: ['cross-journey-explorer', 'daily-login', 'profile-completer'],
    pointsAwarded: 100,
    startDate: new Date(),
    isActive: true
  }
];

/**
 * Seeds achievement types for the gamification engine
 * 
 * @param params Seed function parameters
 * @param achievementTypes Achievement types to seed
 * @returns Seed result
 */
export async function seedAchievementTypes(
  params: SeedFunctionParams,
  achievementTypes: AchievementTypeSeedData[] = DEFAULT_ACHIEVEMENT_TYPES
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  logger.info(`Seeding ${achievementTypes.length} achievement types`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      for (const achievementType of achievementTypes) {
        try {
          const existing = await tx.achievementType.findUnique({
            where: { name: achievementType.name }
          });
          
          if (existing) {
            await tx.achievementType.update({
              where: { name: achievementType.name },
              data: achievementType
            });
            stats.updated++;
          } else {
            await tx.achievementType.create({
              data: {
                ...achievementType,
                isTestData: true
              }
            });
            stats.created++;
          }
        } catch (error) {
          logger.error(`Failed to seed achievement type: ${achievementType.name}`, error);
          stats.skipped++;
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded achievement types: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { achievementTypes: stats.created },
      updated: { achievementTypes: stats.updated },
      skipped: { achievementTypes: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Seeds rules for the gamification engine
 * 
 * @param params Seed function parameters
 * @param rules Rules to seed
 * @returns Seed result
 */
export async function seedRules(
  params: SeedFunctionParams,
  rules: RuleData[] = DEFAULT_RULES
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  logger.info(`Seeding ${rules.length} rules`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      for (const rule of rules) {
        try {
          const existing = await tx.rule.findFirst({
            where: { name: rule.name }
          });
          
          if (existing) {
            await tx.rule.update({
              where: { id: existing.id },
              data: {
                type: rule.type,
                eventType: rule.eventType,
                conditions: rule.conditions,
                pointsAwarded: rule.pointsAwarded,
                cooldownMinutes: rule.cooldownMinutes
              }
            });
            stats.updated++;
          } else {
            await tx.rule.create({
              data: {
                name: rule.name,
                type: rule.type,
                eventType: rule.eventType,
                conditions: rule.conditions,
                pointsAwarded: rule.pointsAwarded,
                cooldownMinutes: rule.cooldownMinutes,
                isActive: true,
                isTestData: true
              }
            });
            stats.created++;
          }
        } catch (error) {
          logger.error(`Failed to seed rule: ${rule.name}`, error);
          stats.skipped++;
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded rules: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { rules: stats.created },
      updated: { rules: stats.updated },
      skipped: { rules: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Seeds rewards for the gamification engine
 * 
 * @param params Seed function parameters
 * @param rewards Rewards to seed
 * @returns Seed result
 */
export async function seedRewards(
  params: SeedFunctionParams,
  rewards: RewardSeedData[] = DEFAULT_REWARDS
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  logger.info(`Seeding ${rewards.length} rewards`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      for (const reward of rewards) {
        try {
          const existing = await tx.reward.findFirst({
            where: { name: reward.name }
          });
          
          if (existing) {
            await tx.reward.update({
              where: { id: existing.id },
              data: {
                description: reward.description,
                pointCost: reward.pointCost,
                isAvailable: reward.isAvailable,
                expiresAt: reward.expiresAt
              }
            });
            stats.updated++;
          } else {
            await tx.reward.create({
              data: {
                ...reward,
                type: seededArrayItem(`${reward.name}-type`, Object.values(RewardType)),
                isTestData: true
              }
            });
            stats.created++;
          }
        } catch (error) {
          logger.error(`Failed to seed reward: ${reward.name}`, error);
          stats.skipped++;
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded rewards: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { rewards: stats.created },
      updated: { rewards: stats.updated },
      skipped: { rewards: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Seeds quests for the gamification engine
 * 
 * @param params Seed function parameters
 * @param quests Quests to seed
 * @returns Seed result
 */
export async function seedQuests(
  params: SeedFunctionParams,
  quests: QuestData[] = DEFAULT_QUESTS
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  logger.info(`Seeding ${quests.length} quests`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      // First, get all achievement types to connect
      const achievementTypes = await tx.achievementType.findMany();
      const achievementTypeMap = new Map(achievementTypes.map(at => [at.name, at.id]));
      
      for (const quest of quests) {
        try {
          const existing = await tx.quest.findFirst({
            where: { name: quest.name }
          });
          
          // Get achievement type IDs to connect
          const achievementTypeIds = quest.requiredAchievements
            .map(name => achievementTypeMap.get(name))
            .filter(Boolean);
          
          if (existing) {
            await tx.quest.update({
              where: { id: existing.id },
              data: {
                description: quest.description,
                journey: quest.journey,
                pointsAwarded: quest.pointsAwarded,
                startDate: quest.startDate,
                endDate: quest.endDate,
                isActive: quest.isActive,
                requiredAchievements: {
                  set: achievementTypeIds.map(id => ({ id }))
                }
              }
            });
            stats.updated++;
          } else {
            await tx.quest.create({
              data: {
                name: quest.name,
                description: quest.description,
                journey: quest.journey,
                pointsAwarded: quest.pointsAwarded,
                startDate: quest.startDate,
                endDate: quest.endDate,
                isActive: quest.isActive,
                isTestData: true,
                requiredAchievements: {
                  connect: achievementTypeIds.map(id => ({ id }))
                }
              }
            });
            stats.created++;
          }
        } catch (error) {
          logger.error(`Failed to seed quest: ${quest.name}`, error);
          stats.skipped++;
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded quests: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { quests: stats.created },
      updated: { quests: stats.updated },
      skipped: { quests: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Seeds gamification profiles for testing
 * 
 * @param params Seed function parameters
 * @param userIds User IDs to create profiles for
 * @param count Number of profiles to create if userIds not provided
 * @returns Seed result
 */
export async function seedGamificationProfiles(
  params: SeedFunctionParams,
  userIds: string[] = [],
  count: number = 5
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  // If no userIds provided, get some from the database
  if (userIds.length === 0) {
    const users = await prisma.user.findMany({
      take: count,
      select: { id: true }
    });
    userIds = users.map(u => u.id);
  }
  
  logger.info(`Seeding ${userIds.length} gamification profiles`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      for (const userId of userIds) {
        try {
          const existing = await tx.gamificationProfile.findUnique({
            where: { userId }
          });
          
          if (existing) {
            // Update with random values
            const level = seededRandom(`${userId}-level`, 1, 10);
            const xp = seededRandom(`${userId}-xp`, 0, 100);
            const totalPoints = level * 100 + xp;
            
            await tx.gamificationProfile.update({
              where: { userId },
              data: {
                level,
                xp,
                totalPoints
              }
            });
            stats.updated++;
          } else {
            // Create with random values
            const level = seededRandom(`${userId}-level`, 1, 5);
            const xp = seededRandom(`${userId}-xp`, 0, 100);
            const totalPoints = level * 100 + xp;
            
            await tx.gamificationProfile.create({
              data: {
                userId,
                level,
                xp,
                totalPoints,
                isTestData: true
              }
            });
            stats.created++;
          }
        } catch (error) {
          logger.error(`Failed to seed gamification profile for user: ${userId}`, error);
          stats.skipped++;
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded gamification profiles: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { gamificationProfiles: stats.created },
      updated: { gamificationProfiles: stats.updated },
      skipped: { gamificationProfiles: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Seeds achievements for testing
 * 
 * @param params Seed function parameters
 * @param userIds User IDs to create achievements for
 * @param count Number of achievements per user
 * @returns Seed result
 */
export async function seedAchievements(
  params: SeedFunctionParams,
  userIds: string[] = [],
  count: number = 3
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  // If no userIds provided, get some from the database
  if (userIds.length === 0) {
    const profiles = await prisma.gamificationProfile.findMany({
      take: 5,
      select: { userId: true }
    });
    userIds = profiles.map(p => p.userId);
  }
  
  // Get achievement types
  const achievementTypes = await prisma.achievementType.findMany();
  if (achievementTypes.length === 0) {
    logger.error('No achievement types found, cannot seed achievements');
    return {
      success: false,
      error: 'No achievement types found',
      stats: {
        created: { achievements: 0 },
        updated: { achievements: 0 },
        skipped: { achievements: 0 },
        timeTakenMs: 0
      }
    };
  }
  
  logger.info(`Seeding achievements for ${userIds.length} users`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      for (const userId of userIds) {
        // Get random achievement types for this user
        const userAchievementTypes = seededArraySubset(
          `${userId}-achievements`,
          achievementTypes,
          Math.min(count, achievementTypes.length)
        );
        
        for (const achievementType of userAchievementTypes) {
          try {
            const existing = await tx.achievement.findFirst({
              where: {
                userId,
                achievementTypeId: achievementType.id
              }
            });
            
            // Generate random progress data
            const level = seededRandom(`${userId}-${achievementType.name}-level`, 1, achievementType.levels);
            const progress = seededRandom(`${userId}-${achievementType.name}-progress`, 0, 100);
            const isUnlocked = progress === 100 || seededBoolean(`${userId}-${achievementType.name}-unlocked`, 0.7);
            const unlockedAt = isUnlocked ? new Date() : null;
            
            if (existing) {
              await tx.achievement.update({
                where: { id: existing.id },
                data: {
                  level,
                  progress,
                  unlockedAt
                }
              });
              stats.updated++;
            } else {
              await tx.achievement.create({
                data: {
                  userId,
                  achievementTypeId: achievementType.id,
                  level,
                  progress,
                  unlockedAt,
                  isTestData: true
                }
              });
              stats.created++;
            }
          } catch (error) {
            logger.error(`Failed to seed achievement for user: ${userId}, type: ${achievementType.name}`, error);
            stats.skipped++;
          }
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded achievements: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { achievements: stats.created },
      updated: { achievements: stats.updated },
      skipped: { achievements: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Seeds game events for testing
 * 
 * @param params Seed function parameters
 * @param userIds User IDs to create events for
 * @param count Number of events per user
 * @returns Seed result
 */
export async function seedGameEvents(
  params: SeedFunctionParams,
  userIds: string[] = [],
  count: number = 10
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  // If no userIds provided, get some from the database
  if (userIds.length === 0) {
    const profiles = await prisma.gamificationProfile.findMany({
      take: 5,
      select: { userId: true }
    });
    userIds = profiles.map(p => p.userId);
  }
  
  logger.info(`Seeding ${count} game events for ${userIds.length} users`);
  
  const stats = {
    created: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      for (const userId of userIds) {
        // Create events for each user
        for (let i = 0; i < count; i++) {
          try {
            // Generate a random event
            const event = generateRandomEvent(userId, i);
            
            // Create the event
            await tx.gameEvent.create({
              data: {
                userId,
                type: event.type,
                journey: event.journey,
                data: event.data,
                metadata: event.metadata || {},
                processedAt: new Date(),
                isTestData: true
              }
            });
            
            stats.created++;
          } catch (error) {
            logger.error(`Failed to seed game event for user: ${userId}`, error);
            stats.skipped++;
          }
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded game events: ${stats.created} created, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { gameEvents: stats.created },
      updated: { gameEvents: 0 },
      skipped: { gameEvents: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Generates a random event for testing
 * 
 * @param userId User ID to create the event for
 * @param index Index for deterministic generation
 * @returns Random event data
 */
function generateRandomEvent(userId: string, index: number): EventData {
  // Define journey-specific events
  const healthEvents = [
    EventType.HEALTH_METRIC_RECORDED,
    EventType.HEALTH_GOAL_CREATED,
    EventType.HEALTH_GOAL_ACHIEVED,
    EventType.HEALTH_GOAL_PROGRESS,
    EventType.DEVICE_CONNECTED,
    EventType.DEVICE_SYNCED
  ];
  
  const careEvents = [
    EventType.APPOINTMENT_SCHEDULED,
    EventType.APPOINTMENT_COMPLETED,
    EventType.MEDICATION_TAKEN,
    EventType.MEDICATION_ADHERENCE,
    EventType.TELEMEDICINE_COMPLETED
  ];
  
  const planEvents = [
    EventType.CLAIM_SUBMITTED,
    EventType.CLAIM_APPROVED,
    EventType.BENEFIT_USED,
    EventType.PLAN_SELECTED
  ];
  
  const systemEvents = [
    EventType.ACHIEVEMENT_UNLOCKED,
    EventType.ACHIEVEMENT_PROGRESS,
    EventType.LEVEL_UP,
    EventType.REWARD_EARNED,
    EventType.REWARD_REDEEMED,
    EventType.QUEST_STARTED,
    EventType.QUEST_COMPLETED,
    EventType.QUEST_PROGRESS
  ];
  
  // Select a random journey
  const journeys: Array<JourneyType> = ['health', 'care', 'plan', null];
  const journey = seededArrayItem(`${userId}-event-${index}-journey`, journeys);
  
  // Select a random event type based on the journey
  let eventType: EventType;
  let eventData: Record<string, any> = {};
  
  switch (journey) {
    case 'health':
      eventType = seededArrayItem(`${userId}-event-${index}-type`, healthEvents);
      eventData = generateHealthEventData(eventType, userId, index);
      break;
    case 'care':
      eventType = seededArrayItem(`${userId}-event-${index}-type`, careEvents);
      eventData = generateCareEventData(eventType, userId, index);
      break;
    case 'plan':
      eventType = seededArrayItem(`${userId}-event-${index}-type`, planEvents);
      eventData = generatePlanEventData(eventType, userId, index);
      break;
    default:
      eventType = seededArrayItem(`${userId}-event-${index}-type`, systemEvents);
      eventData = generateSystemEventData(eventType, userId, index);
      break;
  }
  
  return {
    type: eventType,
    journey,
    data: eventData,
    metadata: {
      source: 'test-seed',
      timestamp: new Date().toISOString(),
      correlationId: deterministicUuid(`${userId}-event-${index}`)
    }
  };
}

/**
 * Generates health event data for testing
 * 
 * @param eventType Event type
 * @param userId User ID
 * @param index Index for deterministic generation
 * @returns Health event data
 */
function generateHealthEventData(eventType: EventType, userId: string, index: number): Record<string, any> {
  switch (eventType) {
    case EventType.HEALTH_METRIC_RECORDED:
      return {
        metricType: seededArrayItem(`${userId}-event-${index}-metric`, [
          'HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'STEPS', 'WEIGHT', 'SLEEP'
        ]),
        value: seededRandom(`${userId}-event-${index}-value`, 1, 200),
        unit: seededArrayItem(`${userId}-event-${index}-unit`, ['bpm', 'mmHg', 'mg/dL', 'steps', 'kg', 'hours']),
        recordedAt: new Date().toISOString()
      };
    case EventType.HEALTH_GOAL_CREATED:
    case EventType.HEALTH_GOAL_ACHIEVED:
    case EventType.HEALTH_GOAL_PROGRESS:
      return {
        goalId: deterministicUuid(`${userId}-goal-${index}`),
        type: seededArrayItem(`${userId}-event-${index}-goal-type`, [
          'STEPS', 'WEIGHT', 'SLEEP', 'HEART_RATE', 'EXERCISE'
        ]),
        targetValue: seededRandom(`${userId}-event-${index}-target`, 1, 10000),
        currentValue: seededRandom(`${userId}-event-${index}-current`, 1, 10000),
        progress: seededRandom(`${userId}-event-${index}-progress`, 0, 100),
        completed: eventType === EventType.HEALTH_GOAL_ACHIEVED
      };
    case EventType.DEVICE_CONNECTED:
    case EventType.DEVICE_SYNCED:
      return {
        deviceId: deterministicUuid(`${userId}-device-${index}`),
        deviceType: seededArrayItem(`${userId}-event-${index}-device-type`, [
          'Smartwatch', 'Blood Pressure Monitor', 'Glucose Monitor', 'Smart Scale'
        ]),
        action: eventType === EventType.DEVICE_CONNECTED ? 'connected' : 'synced',
        connectionTime: new Date().toISOString(),
        isFirstConnection: seededBoolean(`${userId}-event-${index}-first-connection`, 0.3)
      };
    default:
      return {};
  }
}

/**
 * Generates care event data for testing
 * 
 * @param eventType Event type
 * @param userId User ID
 * @param index Index for deterministic generation
 * @returns Care event data
 */
function generateCareEventData(eventType: EventType, userId: string, index: number): Record<string, any> {
  switch (eventType) {
    case EventType.APPOINTMENT_SCHEDULED:
    case EventType.APPOINTMENT_COMPLETED:
      return {
        appointmentId: deterministicUuid(`${userId}-appointment-${index}`),
        providerId: deterministicUuid(`${userId}-provider-${index}`),
        type: seededArrayItem(`${userId}-event-${index}-appointment-type`, [
          'CONSULTATION', 'FOLLOW_UP', 'EXAM', 'THERAPY', 'VACCINATION'
        ]),
        status: eventType === EventType.APPOINTMENT_COMPLETED ? 'completed' : 'scheduled',
        scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        completedAt: eventType === EventType.APPOINTMENT_COMPLETED ? new Date().toISOString() : null,
        specialtyArea: seededArrayItem(`${userId}-event-${index}-specialty`, [
          'Cardiologia', 'Dermatologia', 'Ortopedia', 'Pediatria', 'Psiquiatria'
        ])
      };
    case EventType.MEDICATION_TAKEN:
    case EventType.MEDICATION_ADHERENCE:
      return {
        medicationId: deterministicUuid(`${userId}-medication-${index}`),
        name: seededArrayItem(`${userId}-event-${index}-medication`, [
          'Paracetamol', 'Ibuprofeno', 'Amoxicilina', 'Losartana', 'Omeprazol'
        ]),
        action: 'taken',
        takenAt: new Date().toISOString(),
        adherencePercentage: seededRandom(`${userId}-event-${index}-adherence`, 0, 100),
        onSchedule: seededBoolean(`${userId}-event-${index}-on-schedule`, 0.8),
        streakDays: seededRandom(`${userId}-event-${index}-streak`, 1, 30)
      };
    case EventType.TELEMEDICINE_COMPLETED:
      return {
        sessionId: deterministicUuid(`${userId}-telemedicine-${index}`),
        providerId: deterministicUuid(`${userId}-provider-${index}`),
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date().toISOString(),
        duration: seededRandom(`${userId}-event-${index}-duration`, 10, 60),
        status: 'completed',
        specialtyArea: seededArrayItem(`${userId}-event-${index}-specialty`, [
          'Cardiologia', 'Dermatologia', 'Ortopedia', 'Pediatria', 'Psiquiatria'
        ])
      };
    default:
      return {};
  }
}

/**
 * Generates plan event data for testing
 * 
 * @param eventType Event type
 * @param userId User ID
 * @param index Index for deterministic generation
 * @returns Plan event data
 */
function generatePlanEventData(eventType: EventType, userId: string, index: number): Record<string, any> {
  switch (eventType) {
    case EventType.CLAIM_SUBMITTED:
    case EventType.CLAIM_APPROVED:
      return {
        claimId: deterministicUuid(`${userId}-claim-${index}`),
        status: eventType === EventType.CLAIM_APPROVED ? 'APPROVED' : 'SUBMITTED',
        submittedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        approvedAt: eventType === EventType.CLAIM_APPROVED ? new Date().toISOString() : null,
        amount: seededRandom(`${userId}-event-${index}-amount`, 100, 5000),
        approvedAmount: eventType === EventType.CLAIM_APPROVED ? 
          seededRandom(`${userId}-event-${index}-approved-amount`, 50, 5000) : null,
        claimType: seededArrayItem(`${userId}-event-${index}-claim-type`, [
          'Consulta Médica', 'Exame', 'Terapia', 'Internação', 'Medicamento'
        ]),
        hasDocuments: seededBoolean(`${userId}-event-${index}-has-documents`, 0.9),
        isFirstClaim: seededBoolean(`${userId}-event-${index}-first-claim`, 0.2)
      };
    case EventType.BENEFIT_USED:
      return {
        benefitId: deterministicUuid(`${userId}-benefit-${index}`),
        type: seededArrayItem(`${userId}-event-${index}-benefit-type`, [
          'Desconto', 'Cashback', 'Serviço Gratuito', 'Acesso Premium', 'Consulta Gratuita'
        ]),
        action: 'used',
        utilizedAt: new Date().toISOString(),
        savingsAmount: seededRandom(`${userId}-event-${index}-savings`, 10, 500),
        isFirstUtilization: seededBoolean(`${userId}-event-${index}-first-benefit`, 0.3)
      };
    case EventType.PLAN_SELECTED:
      return {
        planId: deterministicUuid(`${userId}-plan-${index}`),
        action: 'selected',
        selectedAt: new Date().toISOString(),
        planType: seededArrayItem(`${userId}-event-${index}-plan-type`, [
          'Básico', 'Standard', 'Premium'
        ]),
        coverageLevel: seededArrayItem(`${userId}-event-${index}-coverage`, [
          'Individual', 'Familiar', 'Empresarial'
        ]),
        annualCost: seededRandom(`${userId}-event-${index}-cost`, 1000, 10000),
        isNewEnrollment: seededBoolean(`${userId}-event-${index}-new-enrollment`, 0.4)
      };
    default:
      return {};
  }
}

/**
 * Generates system event data for testing
 * 
 * @param eventType Event type
 * @param userId User ID
 * @param index Index for deterministic generation
 * @returns System event data
 */
function generateSystemEventData(eventType: EventType, userId: string, index: number): Record<string, any> {
  switch (eventType) {
    case EventType.ACHIEVEMENT_UNLOCKED:
    case EventType.ACHIEVEMENT_PROGRESS:
      return {
        achievementId: deterministicUuid(`${userId}-achievement-${index}`),
        name: seededArrayItem(`${userId}-event-${index}-achievement-name`, [
          'health-check-streak', 'steps-goal', 'appointment-keeper', 'medication-adherence',
          'claim-master', 'cross-journey-explorer', 'daily-login', 'profile-completer'
        ]),
        action: eventType === EventType.ACHIEVEMENT_UNLOCKED ? 'unlocked' : 'progress',
        progress: eventType === EventType.ACHIEVEMENT_UNLOCKED ? 100 : seededRandom(`${userId}-event-${index}-achievement-progress`, 1, 99),
        unlockedAt: eventType === EventType.ACHIEVEMENT_UNLOCKED ? new Date().toISOString() : null,
        pointsAwarded: eventType === EventType.ACHIEVEMENT_UNLOCKED ? seededRandom(`${userId}-event-${index}-points`, 10, 100) : 0,
        journey: seededArrayItem(`${userId}-event-${index}-achievement-journey`, [
          'health', 'care', 'plan', 'cross-journey'
        ]),
        rarity: seededArrayItem(`${userId}-event-${index}-achievement-rarity`, Object.values(AchievementRarity))
      };
    case EventType.LEVEL_UP:
      return {
        old: seededRandom(`${userId}-event-${index}-old-level`, 1, 9),
        new: seededRandom(`${userId}-event-${index}-new-level`, 2, 10),
        pointsToNextLevel: seededRandom(`${userId}-event-${index}-points-next`, 0, 100),
        timestamp: new Date().toISOString()
      };
    case EventType.REWARD_EARNED:
    case EventType.REWARD_REDEEMED:
      return {
        rewardId: deterministicUuid(`${userId}-reward-${index}`),
        name: seededArrayItem(`${userId}-event-${index}-reward-name`, [
          'Desconto em Consulta', 'Cashback em Medicamentos', 'Acesso Premium',
          'Consulta Gratuita', 'Kit Fitness', 'Assinatura Mensal', 'Exame Gratuito'
        ]),
        action: eventType === EventType.REWARD_EARNED ? 'earned' : 'redeemed',
        earnedAt: eventType === EventType.REWARD_EARNED ? new Date().toISOString() : new Date(Date.now() - 86400000).toISOString(),
        redeemedAt: eventType === EventType.REWARD_REDEEMED ? new Date().toISOString() : null,
        value: seededRandom(`${userId}-event-${index}-reward-value`, 50, 500),
        type: seededArrayItem(`${userId}-event-${index}-reward-type`, Object.values(RewardType))
      };
    case EventType.QUEST_STARTED:
    case EventType.QUEST_COMPLETED:
    case EventType.QUEST_PROGRESS:
      return {
        questId: deterministicUuid(`${userId}-quest-${index}`),
        name: seededArrayItem(`${userId}-event-${index}-quest-name`, [
          'Iniciante em Saúde', 'Cuidador Dedicado', 'Gestor de Benefícios', 'Usuário Completo'
        ]),
        action: eventType === EventType.QUEST_STARTED ? 'started' : 
                eventType === EventType.QUEST_COMPLETED ? 'completed' : 'progressed',
        progress: eventType === EventType.QUEST_COMPLETED ? 100 : 
                  eventType === EventType.QUEST_STARTED ? 0 : 
                  seededRandom(`${userId}-event-${index}-quest-progress`, 1, 99),
        stepsCompleted: eventType === EventType.QUEST_COMPLETED ? 3 : 
                        eventType === EventType.QUEST_STARTED ? 0 : 
                        seededRandom(`${userId}-event-${index}-quest-steps`, 1, 2),
        totalSteps: 3,
        completedAt: eventType === EventType.QUEST_COMPLETED ? new Date().toISOString() : null,
        pointsAwarded: eventType === EventType.QUEST_COMPLETED ? 
          seededRandom(`${userId}-event-${index}-quest-points`, 50, 100) : 0,
        journey: seededArrayItem(`${userId}-event-${index}-quest-journey`, [
          'health', 'care', 'plan', 'cross-journey'
        ])
      };
    default:
      return {};
  }
}

/**
 * Seeds cross-journey achievement progress for testing
 * This creates a scenario where users have progress across multiple journeys
 * 
 * @param params Seed function parameters
 * @param userIds User IDs to create progress for
 * @returns Seed result
 */
export async function seedCrossJourneyProgress(
  params: SeedFunctionParams,
  userIds: string[] = []
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  // If no userIds provided, get some from the database
  if (userIds.length === 0) {
    const profiles = await prisma.gamificationProfile.findMany({
      take: 3,
      select: { userId: true }
    });
    userIds = profiles.map(p => p.userId);
  }
  
  logger.info(`Seeding cross-journey progress for ${userIds.length} users`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      // Get the cross-journey achievement type
      const crossJourneyAchievement = await tx.achievementType.findFirst({
        where: { name: 'cross-journey-explorer' }
      });
      
      if (!crossJourneyAchievement) {
        logger.error('Cross-journey achievement type not found');
        return stats;
      }
      
      // For each user, create progress in each journey
      for (const userId of userIds) {
        try {
          // Create or update the cross-journey achievement
          const existing = await tx.achievement.findFirst({
            where: {
              userId,
              achievementTypeId: crossJourneyAchievement.id
            }
          });
          
          // Create events for each journey
          const journeys: JourneyType[] = ['health', 'care', 'plan'];
          let journeyCount = 0;
          
          for (const journey of journeys) {
            // Randomly determine if this user has activity in this journey
            const hasActivity = seededBoolean(`${userId}-${journey}-activity`, 0.8);
            
            if (hasActivity) {
              journeyCount++;
              
              // Create a journey-specific event
              let eventType: EventType;
              let eventData: Record<string, any>;
              
              switch (journey) {
                case 'health':
                  eventType = EventType.HEALTH_METRIC_RECORDED;
                  eventData = generateHealthEventData(eventType, userId, journeyCount);
                  break;
                case 'care':
                  eventType = EventType.APPOINTMENT_COMPLETED;
                  eventData = generateCareEventData(eventType, userId, journeyCount);
                  break;
                case 'plan':
                  eventType = EventType.CLAIM_SUBMITTED;
                  eventData = generatePlanEventData(eventType, userId, journeyCount);
                  break;
              }
              
              // Create the event
              await tx.gameEvent.create({
                data: {
                  userId,
                  type: eventType,
                  journey,
                  data: eventData,
                  metadata: {
                    source: 'cross-journey-test',
                    timestamp: new Date().toISOString(),
                    correlationId: deterministicUuid(`${userId}-${journey}-event`)
                  },
                  processedAt: new Date(),
                  isTestData: true
                }
              });
              
              stats.created++;
            }
          }
          
          // Update the cross-journey achievement based on journey count
          const progress = Math.min(100, Math.round((journeyCount / 3) * 100));
          const isUnlocked = progress === 100;
          
          if (existing) {
            await tx.achievement.update({
              where: { id: existing.id },
              data: {
                progress,
                unlockedAt: isUnlocked ? new Date() : null
              }
            });
            stats.updated++;
          } else {
            await tx.achievement.create({
              data: {
                userId,
                achievementTypeId: crossJourneyAchievement.id,
                level: 1,
                progress,
                unlockedAt: isUnlocked ? new Date() : null,
                isTestData: true
              }
            });
            stats.created++;
          }
        } catch (error) {
          logger.error(`Failed to seed cross-journey progress for user: ${userId}`, error);
          stats.skipped++;
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded cross-journey progress: ${stats.created} events created, ${stats.updated} achievements updated, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { crossJourneyEvents: stats.created },
      updated: { crossJourneyAchievements: stats.updated },
      skipped: { crossJourneyProgress: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Seeds reward redemption scenarios for testing
 * 
 * @param params Seed function parameters
 * @param userIds User IDs to create redemptions for
 * @returns Seed result
 */
export async function seedRewardRedemptions(
  params: SeedFunctionParams,
  userIds: string[] = []
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  // If no userIds provided, get some from the database
  if (userIds.length === 0) {
    const profiles = await prisma.gamificationProfile.findMany({
      take: 3,
      select: { userId: true }
    });
    userIds = profiles.map(p => p.userId);
  }
  
  // Get available rewards
  const rewards = await prisma.reward.findMany({
    where: { isAvailable: true }
  });
  
  if (rewards.length === 0) {
    logger.error('No rewards found, cannot seed redemptions');
    return {
      success: false,
      error: 'No rewards found',
      stats: {
        created: { redemptions: 0 },
        updated: { redemptions: 0 },
        skipped: { redemptions: 0 },
        timeTakenMs: 0
      }
    };
  }
  
  logger.info(`Seeding reward redemptions for ${userIds.length} users`);
  
  const stats = {
    created: 0,
    skipped: 0,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    return withTransaction(prisma, async (tx) => {
      for (const userId of userIds) {
        try {
          // Get user's profile
          const profile = await tx.gamificationProfile.findUnique({
            where: { userId }
          });
          
          if (!profile) {
            logger.warn(`No profile found for user: ${userId}, skipping`);
            stats.skipped++;
            continue;
          }
          
          // Select a random reward for this user
          const reward = seededArrayItem(`${userId}-redemption-reward`, rewards);
          
          // Check if user has enough points
          const hasEnoughPoints = profile.totalPoints >= reward.pointCost;
          
          if (hasEnoughPoints) {
            // Create a redemption record
            await tx.rewardRedemption.create({
              data: {
                userId,
                rewardId: reward.id,
                pointCost: reward.pointCost,
                redeemedAt: new Date(),
                status: 'COMPLETED',
                isTestData: true
              }
            });
            
            // Update user's points
            await tx.gamificationProfile.update({
              where: { userId },
              data: {
                totalPoints: profile.totalPoints - reward.pointCost
              }
            });
            
            // Create a redemption event
            await tx.gameEvent.create({
              data: {
                userId,
                type: EventType.REWARD_REDEEMED,
                journey: null,
                data: {
                  rewardId: reward.id,
                  name: reward.name,
                  action: 'redeemed',
                  redeemedAt: new Date().toISOString(),
                  value: reward.pointCost,
                  type: reward.type || 'other'
                },
                metadata: {
                  source: 'reward-redemption-test',
                  timestamp: new Date().toISOString(),
                  correlationId: deterministicUuid(`${userId}-redemption-${reward.id}`)
                },
                processedAt: new Date(),
                isTestData: true
              }
            });
            
            stats.created++;
          } else {
            // Create a failed redemption attempt event
            await tx.gameEvent.create({
              data: {
                userId,
                type: 'REWARD_REDEMPTION_FAILED',
                journey: null,
                data: {
                  rewardId: reward.id,
                  name: reward.name,
                  reason: 'INSUFFICIENT_POINTS',
                  requiredPoints: reward.pointCost,
                  availablePoints: profile.totalPoints
                },
                metadata: {
                  source: 'reward-redemption-test',
                  timestamp: new Date().toISOString(),
                  correlationId: deterministicUuid(`${userId}-failed-redemption-${reward.id}`)
                },
                processedAt: new Date(),
                isTestData: true
              }
            });
            
            stats.created++;
          }
        } catch (error) {
          logger.error(`Failed to seed reward redemption for user: ${userId}`, error);
          stats.skipped++;
        }
      }
      
      return stats;
    });
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Seeded reward redemptions: ${stats.created} created, ${stats.skipped} skipped`);
  
  return {
    success: true,
    stats: {
      created: { redemptions: stats.created },
      updated: { redemptions: 0 },
      skipped: { redemptions: stats.skipped },
      timeTakenMs
    }
  };
}

/**
 * Main function to seed all gamification data
 * 
 * @param params Seed function parameters
 * @param data Gamification journey seed data
 * @returns Seed result
 */
export async function seedGamificationJourney(
  params: SeedFunctionParams,
  data?: GamificationJourneySeedData
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging !== false);
  
  // Get configuration for gamification journey
  const config = getJourneyConfig(defaultConfig, 'gamification');
  if (!config) {
    return {
      success: false,
      error: 'Gamification journey is disabled in configuration',
      stats: {
        created: {},
        updated: {},
        skipped: {},
        timeTakenMs: 0
      }
    };
  }
  
  logger.info('Starting gamification journey seed');
  
  const stats = {
    created: {} as Record<string, number>,
    updated: {} as Record<string, number>,
    skipped: {} as Record<string, number>,
    timeTakenMs: 0
  };
  
  const [result, timeTakenMs] = await measureExecutionTime(async () => {
    // Seed achievement types
    const achievementTypesResult = await seedAchievementTypes(params, data?.achievementTypes);
    mergeStats(stats, achievementTypesResult.stats);
    
    // Seed rules
    const rulesResult = await seedRules(params);
    mergeStats(stats, rulesResult.stats);
    
    // Seed rewards
    const rewardsResult = await seedRewards(params);
    mergeStats(stats, rewardsResult.stats);
    
    // Seed quests
    const questsResult = await seedQuests(params);
    mergeStats(stats, questsResult.stats);
    
    // If test data is enabled, seed profiles and achievements
    if (options.includeTestData) {
      // Seed gamification profiles
      const profilesResult = await seedGamificationProfiles(params, [], config.testDataCount);
      mergeStats(stats, profilesResult.stats);
      
      // Get user IDs from profiles
      const profiles = await prisma.gamificationProfile.findMany({
        take: config.testDataCount,
        select: { userId: true }
      });
      const userIds = profiles.map(p => p.userId);
      
      // Seed achievements
      const achievementsResult = await seedAchievements(params, userIds, config.achievementsCount);
      mergeStats(stats, achievementsResult.stats);
      
      // Seed game events
      const eventsResult = await seedGameEvents(params, userIds, 10);
      mergeStats(stats, eventsResult.stats);
      
      // Seed cross-journey progress
      const crossJourneyResult = await seedCrossJourneyProgress(params, userIds);
      mergeStats(stats, crossJourneyResult.stats);
      
      // Seed reward redemptions
      const redemptionsResult = await seedRewardRedemptions(params, userIds);
      mergeStats(stats, redemptionsResult.stats);
    }
    
    return stats;
  });
  
  stats.timeTakenMs = timeTakenMs;
  
  logger.info(`Completed gamification journey seed in ${timeTakenMs}ms`);
  
  return {
    success: true,
    stats
  };
}

/**
 * Merges stats from multiple seed results
 * 
 * @param target Target stats object
 * @param source Source stats object
 */
function mergeStats(target: SeedResult['stats'], source: SeedResult['stats']): void {
  // Merge created stats
  for (const [key, value] of Object.entries(source.created)) {
    target.created[key] = (target.created[key] || 0) + value;
  }
  
  // Merge updated stats
  for (const [key, value] of Object.entries(source.updated)) {
    target.updated[key] = (target.updated[key] || 0) + value;
  }
  
  // Merge skipped stats
  for (const [key, value] of Object.entries(source.skipped)) {
    target.skipped[key] = (target.skipped[key] || 0) + value;
  }
}

/**
 * Default export for the gamification seed module
 */
export default seedGamificationJourney;