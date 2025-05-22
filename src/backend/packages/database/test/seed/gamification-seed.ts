import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { SeedOptions } from './types';
import { generateRandomId, handleSeedError, withSeedTransaction } from './utils';
import {
  Achievement,
  AchievementLevel,
  EventType,
  GameProfile,
  GamificationEvent,
  Journey,
  Quest,
  Reward,
  Rule,
  RuleActionType,
  RuleConditionType
} from '@austa/interfaces/gamification';

/**
 * Configuration options specific to gamification seeding
 */
export interface GamificationSeedOptions extends SeedOptions {
  /** Number of achievements to generate per journey */
  achievementsPerJourney?: number;
  /** Number of rewards to generate */
  rewardsCount?: number;
  /** Number of rules to generate per journey */
  rulesPerJourney?: number;
  /** Number of quests to generate */
  questsCount?: number;
  /** Number of game profiles to generate */
  profilesCount?: number;
  /** Whether to generate sample events */
  generateEvents?: boolean;
  /** Number of events to generate per journey */
  eventsPerJourney?: number;
}

/**
 * Default options for gamification seeding
 */
const defaultGamificationSeedOptions: GamificationSeedOptions = {
  achievementsPerJourney: 3,
  rewardsCount: 10,
  rulesPerJourney: 5,
  questsCount: 5,
  profilesCount: 5,
  generateEvents: true,
  eventsPerJourney: 10,
  logEnabled: true
};

/**
 * Seeds gamification data for testing purposes
 * 
 * @param prismaService - The PrismaService instance
 * @param options - Configuration options for seeding
 * @returns A promise that resolves when seeding is complete
 */
export async function seedGamificationData(
  prismaService: PrismaService,
  options: GamificationSeedOptions = {}
): Promise<void> {
  const seedOptions = { ...defaultGamificationSeedOptions, ...options };
  const { logEnabled } = seedOptions;
  
  try {
    if (logEnabled) console.log('Starting gamification data seeding...');
    
    // Use the withSeedTransaction utility to ensure all operations are in a transaction
    await withSeedTransaction(prismaService, async (prisma) => {
      // Seed achievements
      await seedAchievements(prisma, seedOptions);
      
      // Seed rewards
      await seedRewards(prisma, seedOptions);
      
      // Seed rules
      await seedRules(prisma, seedOptions);
      
      // Seed quests
      await seedQuests(prisma, seedOptions);
      
      // Seed game profiles
      await seedGameProfiles(prisma, seedOptions);
      
      // Generate sample events if enabled
      if (seedOptions.generateEvents) {
        await generateSampleEvents(prisma, seedOptions);
      }
    });
    
    if (logEnabled) console.log('Gamification data seeding completed successfully!');
  } catch (error) {
    handleSeedError('Error seeding gamification data', error);
  }
}

/**
 * Seeds achievement types for all journeys
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for seeding
 */
async function seedAchievements(
  prisma: PrismaClient,
  options: GamificationSeedOptions
): Promise<void> {
  const { achievementsPerJourney, logEnabled } = options;
  
  // Define journeys
  const journeys: Journey[] = ['health', 'care', 'plan'];
  
  // Achievement templates by journey
  const achievementTemplates: Record<Journey, Array<Omit<Achievement, 'id'>>> = {
    health: [
      { 
        name: 'health-check-streak', 
        title: 'Monitor de Saúde', 
        description: 'Registre suas métricas de saúde por dias consecutivos',
        journey: 'health',
        icon: 'heart-pulse',
        levels: 3,
        pointsPerLevel: [100, 250, 500],
        thresholds: [5, 15, 30],
        isActive: true
      },
      { 
        name: 'steps-goal', 
        title: 'Caminhante Dedicado', 
        description: 'Atinja sua meta diária de passos',
        journey: 'health',
        icon: 'footprints',
        levels: 3,
        pointsPerLevel: [50, 150, 300],
        thresholds: [7, 15, 30],
        isActive: true
      },
      { 
        name: 'health-goals-created', 
        title: 'Planejador de Saúde', 
        description: 'Crie metas de saúde personalizadas',
        journey: 'health',
        icon: 'target',
        levels: 3,
        pointsPerLevel: [75, 200, 400],
        thresholds: [1, 3, 5],
        isActive: true
      },
      { 
        name: 'device-connected', 
        title: 'Conectado', 
        description: 'Conecte dispositivos de saúde ao seu perfil',
        journey: 'health',
        icon: 'smartwatch',
        levels: 3,
        pointsPerLevel: [100, 200, 300],
        thresholds: [1, 2, 3],
        isActive: true
      },
      { 
        name: 'health-insights-viewed', 
        title: 'Analista de Saúde', 
        description: 'Visualize insights sobre sua saúde',
        journey: 'health',
        icon: 'chart-line',
        levels: 3,
        pointsPerLevel: [50, 100, 200],
        thresholds: [5, 15, 30],
        isActive: true
      }
    ],
    care: [
      { 
        name: 'appointment-keeper', 
        title: 'Compromisso com a Saúde', 
        description: 'Compareça às consultas agendadas',
        journey: 'care',
        icon: 'calendar-check',
        levels: 3,
        pointsPerLevel: [100, 250, 500],
        thresholds: [1, 5, 10],
        isActive: true
      },
      { 
        name: 'medication-adherence', 
        title: 'Aderência ao Tratamento', 
        description: 'Tome seus medicamentos conforme prescrito',
        journey: 'care',
        icon: 'pill',
        levels: 3,
        pointsPerLevel: [75, 200, 400],
        thresholds: [7, 30, 90],
        isActive: true
      },
      { 
        name: 'telemedicine-sessions', 
        title: 'Consulta Virtual', 
        description: 'Participe de sessões de telemedicina',
        journey: 'care',
        icon: 'video',
        levels: 3,
        pointsPerLevel: [150, 300, 600],
        thresholds: [1, 3, 5],
        isActive: true
      },
      { 
        name: 'provider-ratings', 
        title: 'Avaliador', 
        description: 'Avalie seus prestadores de serviços de saúde',
        journey: 'care',
        icon: 'star',
        levels: 3,
        pointsPerLevel: [50, 150, 300],
        thresholds: [1, 5, 10],
        isActive: true
      },
      { 
        name: 'treatment-plan-progress', 
        title: 'Seguidor de Tratamento', 
        description: 'Progrida em seu plano de tratamento',
        journey: 'care',
        icon: 'clipboard-check',
        levels: 3,
        pointsPerLevel: [100, 300, 600],
        thresholds: [25, 50, 100],
        isActive: true
      }
    ],
    plan: [
      { 
        name: 'claim-master', 
        title: 'Mestre em Reembolsos', 
        description: 'Submeta solicitações de reembolso completas',
        journey: 'plan',
        icon: 'receipt',
        levels: 3,
        pointsPerLevel: [100, 250, 500],
        thresholds: [1, 5, 10],
        isActive: true
      },
      { 
        name: 'benefit-explorer', 
        title: 'Explorador de Benefícios', 
        description: 'Explore os benefícios disponíveis em seu plano',
        journey: 'plan',
        icon: 'gift',
        levels: 3,
        pointsPerLevel: [50, 150, 300],
        thresholds: [3, 10, 20],
        isActive: true
      },
      { 
        name: 'document-uploader', 
        title: 'Organizador Digital', 
        description: 'Faça upload de documentos importantes',
        journey: 'plan',
        icon: 'file-upload',
        levels: 3,
        pointsPerLevel: [75, 200, 400],
        thresholds: [1, 5, 10],
        isActive: true
      },
      { 
        name: 'coverage-checker', 
        title: 'Verificador de Cobertura', 
        description: 'Verifique a cobertura para procedimentos',
        journey: 'plan',
        icon: 'shield-check',
        levels: 3,
        pointsPerLevel: [50, 150, 300],
        thresholds: [3, 10, 20],
        isActive: true
      },
      { 
        name: 'plan-optimizer', 
        title: 'Otimizador de Plano', 
        description: 'Compare e otimize seu plano de saúde',
        journey: 'plan',
        icon: 'chart-pie',
        levels: 3,
        pointsPerLevel: [100, 300, 600],
        thresholds: [1, 3, 5],
        isActive: true
      }
    ]
  };
  
  let totalAchievements = 0;
  
  // Create achievements for each journey
  for (const journey of journeys) {
    const journeyAchievements = achievementTemplates[journey];
    const achievementsToCreate = journeyAchievements.slice(0, achievementsPerJourney);
    
    for (const achievement of achievementsToCreate) {
      try {
        await prisma.achievementType.upsert({
          where: { name: achievement.name },
          update: {},
          create: {
            name: achievement.name,
            title: achievement.title,
            description: achievement.description,
            journey: achievement.journey,
            icon: achievement.icon,
            levels: achievement.levels,
            isActive: achievement.isActive
          },
        });
        
        totalAchievements++;
      } catch (error) {
        handleSeedError(`Error creating achievement ${achievement.name}`, error);
      }
    }
  }
  
  if (logEnabled) console.log(`Created ${totalAchievements} achievement types`);
}

/**
 * Seeds rewards for the gamification system
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for seeding
 */
async function seedRewards(
  prisma: PrismaClient,
  options: GamificationSeedOptions
): Promise<void> {
  const { rewardsCount, logEnabled } = options;
  
  // Reward templates
  const rewardTemplates: Array<Omit<Reward, 'id'>> = [
    {
      name: 'discount-10',
      title: 'Desconto de 10%',
      description: 'Desconto de 10% em consultas médicas',
      pointsCost: 500,
      type: 'discount',
      imageUrl: 'rewards/discount-10.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      metadata: { discountPercentage: 10, applicableServices: ['medical-appointment'] }
    },
    {
      name: 'discount-15',
      title: 'Desconto de 15%',
      description: 'Desconto de 15% em exames laboratoriais',
      pointsCost: 750,
      type: 'discount',
      imageUrl: 'rewards/discount-15.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      metadata: { discountPercentage: 15, applicableServices: ['lab-tests'] }
    },
    {
      name: 'discount-20',
      title: 'Desconto de 20%',
      description: 'Desconto de 20% em medicamentos',
      pointsCost: 1000,
      type: 'discount',
      imageUrl: 'rewards/discount-20.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      metadata: { discountPercentage: 20, applicableServices: ['pharmacy'] }
    },
    {
      name: 'free-telemedicine',
      title: 'Consulta de Telemedicina Grátis',
      description: 'Uma consulta de telemedicina gratuita',
      pointsCost: 1500,
      type: 'service',
      imageUrl: 'rewards/telemedicine.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      metadata: { serviceType: 'telemedicine', quantity: 1 }
    },
    {
      name: 'priority-scheduling',
      title: 'Agendamento Prioritário',
      description: 'Agendamento prioritário para consultas médicas por 30 dias',
      pointsCost: 2000,
      type: 'feature',
      imageUrl: 'rewards/priority.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      metadata: { featureType: 'priority-scheduling', durationDays: 30 }
    },
    {
      name: 'health-coach',
      title: 'Sessão com Coach de Saúde',
      description: 'Uma sessão gratuita com um coach de saúde',
      pointsCost: 2500,
      type: 'service',
      imageUrl: 'rewards/coach.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      metadata: { serviceType: 'health-coach', quantity: 1 }
    },
    {
      name: 'premium-content',
      title: 'Conteúdo Premium',
      description: 'Acesso a conteúdo premium sobre saúde por 30 dias',
      pointsCost: 1000,
      type: 'feature',
      imageUrl: 'rewards/content.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      metadata: { featureType: 'premium-content', durationDays: 30 }
    },
    {
      name: 'fitness-class',
      title: 'Aula de Fitness',
      description: 'Uma aula gratuita em academias parceiras',
      pointsCost: 1200,
      type: 'service',
      imageUrl: 'rewards/fitness.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      metadata: { serviceType: 'fitness-class', quantity: 1 }
    },
    {
      name: 'nutrition-consultation',
      title: 'Consulta com Nutricionista',
      description: 'Uma consulta gratuita com nutricionista',
      pointsCost: 2000,
      type: 'service',
      imageUrl: 'rewards/nutrition.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      metadata: { serviceType: 'nutrition-consultation', quantity: 1 }
    },
    {
      name: 'mental-health-session',
      title: 'Sessão de Saúde Mental',
      description: 'Uma sessão gratuita com psicólogo',
      pointsCost: 2500,
      type: 'service',
      imageUrl: 'rewards/mental-health.png',
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      metadata: { serviceType: 'mental-health-session', quantity: 1 }
    }
  ];
  
  const rewardsToCreate = rewardTemplates.slice(0, rewardsCount);
  let createdRewards = 0;
  
  for (const reward of rewardsToCreate) {
    try {
      await prisma.reward.upsert({
        where: { name: reward.name },
        update: {},
        create: {
          name: reward.name,
          title: reward.title,
          description: reward.description,
          pointsCost: reward.pointsCost,
          type: reward.type,
          imageUrl: reward.imageUrl,
          isActive: reward.isActive,
          expiresAt: reward.expiresAt,
          metadata: reward.metadata as any
        },
      });
      
      createdRewards++;
    } catch (error) {
      handleSeedError(`Error creating reward ${reward.name}`, error);
    }
  }
  
  if (logEnabled) console.log(`Created ${createdRewards} rewards`);
}

/**
 * Seeds rules for the gamification system
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for seeding
 */
async function seedRules(
  prisma: PrismaClient,
  options: GamificationSeedOptions
): Promise<void> {
  const { rulesPerJourney, logEnabled } = options;
  
  // Define journeys
  const journeys: Journey[] = ['health', 'care', 'plan'];
  
  // Rule templates by journey
  const ruleTemplates: Record<Journey, Array<Omit<Rule, 'id'>>> = {
    health: [
      {
        name: 'record-health-metric',
        description: 'Award points when user records a health metric',
        journey: 'health',
        eventType: EventType.HEALTH_METRIC_RECORDED,
        isActive: true,
        conditions: [
          {
            type: RuleConditionType.EVENT_PROPERTY_EXISTS,
            property: 'metricType',
            value: null
          }
        ],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 10
          }
        ],
        cooldownMinutes: 60 // Once per hour
      },
      {
        name: 'complete-daily-steps',
        description: 'Award points when user completes daily step goal',
        journey: 'health',
        eventType: EventType.HEALTH_GOAL_ACHIEVED,
        isActive: true,
        conditions: [
          {
            type: RuleConditionType.EVENT_PROPERTY_EQUALS,
            property: 'goalType',
            value: 'STEPS'
          }
        ],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 50
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'steps-goal',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 1440 // Once per day
      },
      {
        name: 'connect-device',
        description: 'Award points when user connects a health device',
        journey: 'health',
        eventType: EventType.DEVICE_CONNECTED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 100
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'device-connected',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 0 // No cooldown
      },
      {
        name: 'create-health-goal',
        description: 'Award points when user creates a health goal',
        journey: 'health',
        eventType: EventType.HEALTH_GOAL_CREATED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 25
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'health-goals-created',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 0 // No cooldown
      },
      {
        name: 'view-health-insight',
        description: 'Award points when user views a health insight',
        journey: 'health',
        eventType: EventType.HEALTH_INSIGHT_VIEWED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 5
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'health-insights-viewed',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 60 // Once per hour
      }
    ],
    care: [
      {
        name: 'book-appointment',
        description: 'Award points when user books a medical appointment',
        journey: 'care',
        eventType: EventType.APPOINTMENT_BOOKED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 25
          }
        ],
        cooldownMinutes: 0 // No cooldown
      },
      {
        name: 'attend-appointment',
        description: 'Award points when user attends a medical appointment',
        journey: 'care',
        eventType: EventType.APPOINTMENT_ATTENDED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 50
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'appointment-keeper',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 0 // No cooldown
      },
      {
        name: 'medication-taken',
        description: 'Award points when user marks medication as taken',
        journey: 'care',
        eventType: EventType.MEDICATION_TAKEN,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 10
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'medication-adherence',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 360 // 6 hours cooldown
      },
      {
        name: 'telemedicine-session',
        description: 'Award points when user completes a telemedicine session',
        journey: 'care',
        eventType: EventType.TELEMEDICINE_SESSION_COMPLETED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 75
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'telemedicine-sessions',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 0 // No cooldown
      },
      {
        name: 'rate-provider',
        description: 'Award points when user rates a healthcare provider',
        journey: 'care',
        eventType: EventType.PROVIDER_RATED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 15
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'provider-ratings',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 0 // No cooldown
      }
    ],
    plan: [
      {
        name: 'submit-claim',
        description: 'Award points when user submits an insurance claim',
        journey: 'plan',
        eventType: EventType.CLAIM_SUBMITTED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 50
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'claim-master',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 0 // No cooldown
      },
      {
        name: 'view-benefit',
        description: 'Award points when user views a benefit',
        journey: 'plan',
        eventType: EventType.BENEFIT_VIEWED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 5
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'benefit-explorer',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 60 // Once per hour
      },
      {
        name: 'upload-document',
        description: 'Award points when user uploads an insurance document',
        journey: 'plan',
        eventType: EventType.DOCUMENT_UPLOADED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 25
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'document-uploader',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 0 // No cooldown
      },
      {
        name: 'check-coverage',
        description: 'Award points when user checks coverage for a procedure',
        journey: 'plan',
        eventType: EventType.COVERAGE_CHECKED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 10
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'coverage-checker',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 60 // Once per hour
      },
      {
        name: 'compare-plans',
        description: 'Award points when user compares insurance plans',
        journey: 'plan',
        eventType: EventType.PLANS_COMPARED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: RuleActionType.AWARD_POINTS,
            points: 20
          },
          {
            type: RuleActionType.PROGRESS_ACHIEVEMENT,
            achievementName: 'plan-optimizer',
            progressAmount: 1
          }
        ],
        cooldownMinutes: 1440 // Once per day
      }
    ]
  };
  
  let totalRules = 0;
  
  // Create rules for each journey
  for (const journey of journeys) {
    const journeyRules = ruleTemplates[journey];
    const rulesToCreate = journeyRules.slice(0, rulesPerJourney);
    
    for (const rule of rulesToCreate) {
      try {
        await prisma.rule.upsert({
          where: { name: rule.name },
          update: {},
          create: {
            name: rule.name,
            description: rule.description,
            journey: rule.journey,
            eventType: rule.eventType,
            isActive: rule.isActive,
            conditions: rule.conditions as any,
            actions: rule.actions as any,
            cooldownMinutes: rule.cooldownMinutes
          },
        });
        
        totalRules++;
      } catch (error) {
        handleSeedError(`Error creating rule ${rule.name}`, error);
      }
    }
  }
  
  if (logEnabled) console.log(`Created ${totalRules} rules`);
}

/**
 * Seeds quests for the gamification system
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for seeding
 */
async function seedQuests(
  prisma: PrismaClient,
  options: GamificationSeedOptions
): Promise<void> {
  const { questsCount, logEnabled } = options;
  
  // Quest templates
  const questTemplates: Array<Omit<Quest, 'id'>> = [
    {
      name: 'health-week-challenge',
      title: 'Desafio da Semana Saudável',
      description: 'Complete tarefas diárias de saúde por uma semana',
      journey: 'health',
      requiredSteps: [
        { description: 'Registre seus passos diários', count: 7, eventType: EventType.HEALTH_METRIC_RECORDED },
        { description: 'Atinja sua meta de passos', count: 5, eventType: EventType.HEALTH_GOAL_ACHIEVED },
        { description: 'Visualize seus insights de saúde', count: 3, eventType: EventType.HEALTH_INSIGHT_VIEWED }
      ],
      pointsReward: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true
    },
    {
      name: 'care-checkup-quest',
      title: 'Missão Check-up Completo',
      description: 'Complete um check-up médico completo',
      journey: 'care',
      requiredSteps: [
        { description: 'Agende uma consulta médica', count: 1, eventType: EventType.APPOINTMENT_BOOKED },
        { description: 'Compareça à consulta', count: 1, eventType: EventType.APPOINTMENT_ATTENDED },
        { description: 'Avalie seu médico', count: 1, eventType: EventType.PROVIDER_RATED }
      ],
      pointsReward: 300,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true
    },
    {
      name: 'medication-master',
      title: 'Mestre da Medicação',
      description: 'Mantenha-se em dia com seus medicamentos',
      journey: 'care',
      requiredSteps: [
        { description: 'Registre medicamentos tomados', count: 14, eventType: EventType.MEDICATION_TAKEN }
      ],
      pointsReward: 250,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      isActive: true
    },
    {
      name: 'plan-optimizer-quest',
      title: 'Otimizador de Plano',
      description: 'Otimize seu plano de saúde',
      journey: 'plan',
      requiredSteps: [
        { description: 'Compare planos de saúde', count: 1, eventType: EventType.PLANS_COMPARED },
        { description: 'Verifique cobertura de procedimentos', count: 3, eventType: EventType.COVERAGE_CHECKED },
        { description: 'Explore benefícios disponíveis', count: 5, eventType: EventType.BENEFIT_VIEWED }
      ],
      pointsReward: 400,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true
    },
    {
      name: 'digital-organizer',
      title: 'Organizador Digital',
      description: 'Organize seus documentos de saúde',
      journey: 'plan',
      requiredSteps: [
        { description: 'Faça upload de documentos', count: 3, eventType: EventType.DOCUMENT_UPLOADED }
      ],
      pointsReward: 200,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true
    },
    {
      name: 'telemedicine-explorer',
      title: 'Explorador de Telemedicina',
      description: 'Experimente os serviços de telemedicina',
      journey: 'care',
      requiredSteps: [
        { description: 'Complete uma sessão de telemedicina', count: 1, eventType: EventType.TELEMEDICINE_SESSION_COMPLETED }
      ],
      pointsReward: 150,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      isActive: true
    },
    {
      name: 'device-connector',
      title: 'Conectador de Dispositivos',
      description: 'Conecte dispositivos de saúde ao seu perfil',
      journey: 'health',
      requiredSteps: [
        { description: 'Conecte um dispositivo de saúde', count: 1, eventType: EventType.DEVICE_CONNECTED }
      ],
      pointsReward: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      isActive: true
    }
  ];
  
  const questsToCreate = questTemplates.slice(0, questsCount);
  let createdQuests = 0;
  
  for (const quest of questsToCreate) {
    try {
      await prisma.quest.upsert({
        where: { name: quest.name },
        update: {},
        create: {
          name: quest.name,
          title: quest.title,
          description: quest.description,
          journey: quest.journey,
          requiredSteps: quest.requiredSteps as any,
          pointsReward: quest.pointsReward,
          startDate: quest.startDate,
          endDate: quest.endDate,
          isActive: quest.isActive
        },
      });
      
      createdQuests++;
    } catch (error) {
      handleSeedError(`Error creating quest ${quest.name}`, error);
    }
  }
  
  if (logEnabled) console.log(`Created ${createdQuests} quests`);
}

/**
 * Seeds game profiles for testing
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for seeding
 */
async function seedGameProfiles(
  prisma: PrismaClient,
  options: GamificationSeedOptions
): Promise<void> {
  const { profilesCount, logEnabled } = options;
  
  // Get users to associate with game profiles
  const users = await prisma.user.findMany({
    take: profilesCount
  });
  
  if (users.length === 0) {
    if (logEnabled) console.log('No users found to create game profiles. Skipping profile creation.');
    return;
  }
  
  let createdProfiles = 0;
  
  for (const user of users) {
    try {
      // Check if profile already exists
      const existingProfile = await prisma.gameProfile.findUnique({
        where: { userId: user.id }
      });
      
      if (!existingProfile) {
        await prisma.gameProfile.create({
          data: {
            userId: user.id,
            level: 1,
            xp: 0,
            totalXp: 0,
            streak: 0,
            lastActivityAt: new Date()
          }
        });
        
        createdProfiles++;
      }
    } catch (error) {
      handleSeedError(`Error creating game profile for user ${user.id}`, error);
    }
  }
  
  if (logEnabled) console.log(`Created ${createdProfiles} game profiles`);
}

/**
 * Generates sample events for testing the gamification engine
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for seeding
 */
async function generateSampleEvents(
  prisma: PrismaClient,
  options: GamificationSeedOptions
): Promise<void> {
  const { eventsPerJourney, logEnabled } = options;
  
  // Get users to associate with events
  const users = await prisma.user.findMany({
    take: 5
  });
  
  if (users.length === 0) {
    if (logEnabled) console.log('No users found to generate events. Skipping event generation.');
    return;
  }
  
  // Define journeys
  const journeys: Journey[] = ['health', 'care', 'plan'];
  
  // Event templates by journey
  const eventTemplates: Record<Journey, GamificationEvent[]> = {
    health: [
      {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '',
        journey: 'health',
        timestamp: new Date(),
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm'
        }
      },
      {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '',
        journey: 'health',
        timestamp: new Date(),
        payload: {
          metricType: 'STEPS',
          value: 8500,
          unit: 'steps'
        }
      },
      {
        type: EventType.HEALTH_GOAL_ACHIEVED,
        userId: '',
        journey: 'health',
        timestamp: new Date(),
        payload: {
          goalType: 'STEPS',
          targetValue: 8000,
          achievedValue: 8500
        }
      },
      {
        type: EventType.DEVICE_CONNECTED,
        userId: '',
        journey: 'health',
        timestamp: new Date(),
        payload: {
          deviceType: 'Smartwatch',
          deviceName: 'Apple Watch',
          connectionMethod: 'bluetooth'
        }
      },
      {
        type: EventType.HEALTH_GOAL_CREATED,
        userId: '',
        journey: 'health',
        timestamp: new Date(),
        payload: {
          goalType: 'WEIGHT',
          targetValue: 70,
          unit: 'kg',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    ],
    care: [
      {
        type: EventType.APPOINTMENT_BOOKED,
        userId: '',
        journey: 'care',
        timestamp: new Date(),
        payload: {
          providerId: generateRandomId(),
          specialtyName: 'Cardiologia',
          appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      {
        type: EventType.APPOINTMENT_ATTENDED,
        userId: '',
        journey: 'care',
        timestamp: new Date(),
        payload: {
          appointmentId: generateRandomId(),
          providerId: generateRandomId(),
          specialtyName: 'Dermatologia',
          duration: 30
        }
      },
      {
        type: EventType.MEDICATION_TAKEN,
        userId: '',
        journey: 'care',
        timestamp: new Date(),
        payload: {
          medicationId: generateRandomId(),
          medicationName: 'Losartana',
          dosage: '50mg'
        }
      },
      {
        type: EventType.TELEMEDICINE_SESSION_COMPLETED,
        userId: '',
        journey: 'care',
        timestamp: new Date(),
        payload: {
          sessionId: generateRandomId(),
          providerId: generateRandomId(),
          specialtyName: 'Psiquiatria',
          duration: 45
        }
      },
      {
        type: EventType.PROVIDER_RATED,
        userId: '',
        journey: 'care',
        timestamp: new Date(),
        payload: {
          providerId: generateRandomId(),
          rating: 5,
          comment: 'Excelente atendimento!'
        }
      }
    ],
    plan: [
      {
        type: EventType.CLAIM_SUBMITTED,
        userId: '',
        journey: 'plan',
        timestamp: new Date(),
        payload: {
          claimId: generateRandomId(),
          claimType: 'Consulta Médica',
          amount: 150.0,
          receiptUploaded: true
        }
      },
      {
        type: EventType.BENEFIT_VIEWED,
        userId: '',
        journey: 'plan',
        timestamp: new Date(),
        payload: {
          benefitId: generateRandomId(),
          benefitName: 'Desconto em Farmácias',
          viewDuration: 45
        }
      },
      {
        type: EventType.DOCUMENT_UPLOADED,
        userId: '',
        journey: 'plan',
        timestamp: new Date(),
        payload: {
          documentId: generateRandomId(),
          documentType: 'Receita Médica',
          fileSize: 1024 * 1024 * 2 // 2MB
        }
      },
      {
        type: EventType.COVERAGE_CHECKED,
        userId: '',
        journey: 'plan',
        timestamp: new Date(),
        payload: {
          procedureCode: 'ABC123',
          procedureName: 'Ressonância Magnética',
          isCovered: true,
          coveragePercentage: 80
        }
      },
      {
        type: EventType.PLANS_COMPARED,
        userId: '',
        journey: 'plan',
        timestamp: new Date(),
        payload: {
          planIds: [generateRandomId(), generateRandomId()],
          comparisonDuration: 300 // 5 minutes
        }
      }
    ]
  };
  
  let totalEvents = 0;
  
  // Create events for each journey and user
  for (const journey of journeys) {
    const journeyEvents = eventTemplates[journey];
    
    for (const user of users) {
      // Generate a random number of events for this user and journey, up to eventsPerJourney
      const numEvents = Math.floor(Math.random() * eventsPerJourney) + 1;
      
      for (let i = 0; i < numEvents; i++) {
        // Select a random event template
        const eventTemplate = journeyEvents[Math.floor(Math.random() * journeyEvents.length)];
        
        // Create a copy of the event with the user ID and a slightly different timestamp
        const event: GamificationEvent = {
          ...eventTemplate,
          userId: user.id,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random time in the last week
        };
        
        try {
          // Store the event in the database
          await prisma.gamificationEvent.create({
            data: {
              type: event.type,
              userId: event.userId,
              journey: event.journey,
              timestamp: event.timestamp,
              payload: event.payload as any,
              processed: false
            }
          });
          
          totalEvents++;
        } catch (error) {
          handleSeedError(`Error creating event for user ${user.id}`, error);
        }
      }
    }
  }
  
  if (logEnabled) console.log(`Generated ${totalEvents} sample events`);
}

/**
 * Seeds user achievements for testing
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for seeding
 */
export async function seedUserAchievements(
  prismaService: PrismaService,
  options: GamificationSeedOptions = {}
): Promise<void> {
  const seedOptions = { ...defaultGamificationSeedOptions, ...options };
  const { logEnabled } = seedOptions;
  
  try {
    if (logEnabled) console.log('Starting user achievements seeding...');
    
    await withSeedTransaction(prismaService, async (prisma) => {
      // Get users
      const users = await prisma.user.findMany({
        take: 5
      });
      
      if (users.length === 0) {
        if (logEnabled) console.log('No users found to create user achievements. Skipping.');
        return;
      }
      
      // Get achievement types
      const achievementTypes = await prisma.achievementType.findMany();
      
      if (achievementTypes.length === 0) {
        if (logEnabled) console.log('No achievement types found. Skipping user achievements creation.');
        return;
      }
      
      let createdUserAchievements = 0;
      
      for (const user of users) {
        // Assign a random subset of achievements to each user
        const numAchievements = Math.floor(Math.random() * achievementTypes.length) + 1;
        const selectedAchievements = achievementTypes
          .sort(() => 0.5 - Math.random()) // Shuffle
          .slice(0, numAchievements);
        
        for (const achievement of selectedAchievements) {
          // Randomly determine the level (1 to achievement.levels)
          const level = Math.floor(Math.random() * achievement.levels) + 1;
          
          // Calculate progress based on level
          const progress = level < achievement.levels 
            ? Math.floor(Math.random() * 100) // Random progress for incomplete levels
            : 100; // 100% for completed levels
          
          try {
            // Check if user achievement already exists
            const existingUserAchievement = await prisma.userAchievement.findFirst({
              where: {
                userId: user.id,
                achievementTypeId: achievement.id
              }
            });
            
            if (!existingUserAchievement) {
              await prisma.userAchievement.create({
                data: {
                  userId: user.id,
                  achievementTypeId: achievement.id,
                  currentLevel: level,
                  progress: progress,
                  unlockedAt: level === achievement.levels ? new Date() : null
                }
              });
              
              createdUserAchievements++;
            }
          } catch (error) {
            handleSeedError(`Error creating user achievement for user ${user.id}`, error);
          }
        }
      }
      
      if (logEnabled) console.log(`Created ${createdUserAchievements} user achievements`);
    });
    
    if (logEnabled) console.log('User achievements seeding completed successfully!');
  } catch (error) {
    handleSeedError('Error seeding user achievements', error);
  }
}

/**
 * Seeds user rewards for testing
 * 
 * @param prismaService - The PrismaService instance
 * @param options - Configuration options for seeding
 */
export async function seedUserRewards(
  prismaService: PrismaService,
  options: GamificationSeedOptions = {}
): Promise<void> {
  const seedOptions = { ...defaultGamificationSeedOptions, ...options };
  const { logEnabled } = seedOptions;
  
  try {
    if (logEnabled) console.log('Starting user rewards seeding...');
    
    await withSeedTransaction(prismaService, async (prisma) => {
      // Get users
      const users = await prisma.user.findMany({
        take: 5
      });
      
      if (users.length === 0) {
        if (logEnabled) console.log('No users found to create user rewards. Skipping.');
        return;
      }
      
      // Get rewards
      const rewards = await prisma.reward.findMany();
      
      if (rewards.length === 0) {
        if (logEnabled) console.log('No rewards found. Skipping user rewards creation.');
        return;
      }
      
      let createdUserRewards = 0;
      
      for (const user of users) {
        // Assign a random subset of rewards to each user
        const numRewards = Math.floor(Math.random() * Math.min(3, rewards.length)) + 1;
        const selectedRewards = rewards
          .sort(() => 0.5 - Math.random()) // Shuffle
          .slice(0, numRewards);
        
        for (const reward of selectedRewards) {
          // Randomly determine if the reward has been redeemed
          const isRedeemed = Math.random() > 0.5;
          
          try {
            // Check if user reward already exists
            const existingUserReward = await prisma.userReward.findFirst({
              where: {
                userId: user.id,
                rewardId: reward.id
              }
            });
            
            if (!existingUserReward) {
              await prisma.userReward.create({
                data: {
                  userId: user.id,
                  rewardId: reward.id,
                  acquiredAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random time in the last month
                  redeemedAt: isRedeemed ? new Date() : null,
                  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
                }
              });
              
              createdUserRewards++;
            }
          } catch (error) {
            handleSeedError(`Error creating user reward for user ${user.id}`, error);
          }
        }
      }
      
      if (logEnabled) console.log(`Created ${createdUserRewards} user rewards`);
    });
    
    if (logEnabled) console.log('User rewards seeding completed successfully!');
  } catch (error) {
    handleSeedError('Error seeding user rewards', error);
  }
}

/**
 * Seeds user quests for testing
 * 
 * @param prismaService - The PrismaService instance
 * @param options - Configuration options for seeding
 */
export async function seedUserQuests(
  prismaService: PrismaService,
  options: GamificationSeedOptions = {}
): Promise<void> {
  const seedOptions = { ...defaultGamificationSeedOptions, ...options };
  const { logEnabled } = seedOptions;
  
  try {
    if (logEnabled) console.log('Starting user quests seeding...');
    
    await withSeedTransaction(prismaService, async (prisma) => {
      // Get users
      const users = await prisma.user.findMany({
        take: 5
      });
      
      if (users.length === 0) {
        if (logEnabled) console.log('No users found to create user quests. Skipping.');
        return;
      }
      
      // Get quests
      const quests = await prisma.quest.findMany();
      
      if (quests.length === 0) {
        if (logEnabled) console.log('No quests found. Skipping user quests creation.');
        return;
      }
      
      let createdUserQuests = 0;
      
      for (const user of users) {
        // Assign a random subset of quests to each user
        const numQuests = Math.floor(Math.random() * Math.min(3, quests.length)) + 1;
        const selectedQuests = quests
          .sort(() => 0.5 - Math.random()) // Shuffle
          .slice(0, numQuests);
        
        for (const quest of selectedQuests) {
          // Randomly determine if the quest is completed
          const isCompleted = Math.random() > 0.7;
          
          // Calculate progress for each step
          const progress = quest.requiredSteps.map((step: any) => ({
            stepIndex: step.description,
            currentCount: isCompleted ? step.count : Math.floor(Math.random() * step.count)
          }));
          
          try {
            // Check if user quest already exists
            const existingUserQuest = await prisma.userQuest.findFirst({
              where: {
                userId: user.id,
                questId: quest.id
              }
            });
            
            if (!existingUserQuest) {
              await prisma.userQuest.create({
                data: {
                  userId: user.id,
                  questId: quest.id,
                  startedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Random time in the last week
                  completedAt: isCompleted ? new Date() : null,
                  progress: progress as any
                }
              });
              
              createdUserQuests++;
            }
          } catch (error) {
            handleSeedError(`Error creating user quest for user ${user.id}`, error);
          }
        }
      }
      
      if (logEnabled) console.log(`Created ${createdUserQuests} user quests`);
    });
    
    if (logEnabled) console.log('User quests seeding completed successfully!');
  } catch (error) {
    handleSeedError('Error seeding user quests', error);
  }
}

/**
 * Seeds all gamification user data (achievements, rewards, quests)
 * 
 * @param prismaService - The PrismaService instance
 * @param options - Configuration options for seeding
 */
export async function seedAllGamificationUserData(
  prismaService: PrismaService,
  options: GamificationSeedOptions = {}
): Promise<void> {
  const seedOptions = { ...defaultGamificationSeedOptions, ...options };
  const { logEnabled } = seedOptions;
  
  try {
    if (logEnabled) console.log('Starting all gamification user data seeding...');
    
    // Seed user achievements
    await seedUserAchievements(prismaService, seedOptions);
    
    // Seed user rewards
    await seedUserRewards(prismaService, seedOptions);
    
    // Seed user quests
    await seedUserQuests(prismaService, seedOptions);
    
    if (logEnabled) console.log('All gamification user data seeding completed successfully!');
  } catch (error) {
    handleSeedError('Error seeding all gamification user data', error);
  }
}