import { PrismaClient } from '@prisma/client';
import { JourneyType } from '@austa/interfaces';

/**
 * Configuration for retry mechanism
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
};

/**
 * Seeds the gamification engine database with initial data.
 * 
 * @returns A promise that resolves when the database is seeded.
 */
async function seed(): Promise<void> {
  console.log('Starting gamification engine database seeding...');
  
  // Create a standard PrismaClient for data operations
  const prisma = new PrismaClient();
  
  try {
    // Use a transaction for atomic operations
    await prisma.$transaction(async (tx) => {
      // Create achievements
      console.log('Creating achievements...');
      await seedAchievements(tx);
      
      // Create quests
      console.log('Creating quests...');
      await seedQuests(tx);
      
      // Create rewards
      console.log('Creating rewards...');
      await seedRewards(tx);
      
      // Create rules
      console.log('Creating rules...');
      await seedRules(tx);
      
      // Create game profiles
      console.log('Creating game profiles...');
      await seedGameProfiles(tx);
      
      // Create user achievements
      console.log('Creating user achievements...');
      await seedUserAchievements(tx);
      
      // Create user quests
      console.log('Creating user quests...');
      await seedUserQuests(tx);
      
      // Create user rewards
      console.log('Creating user rewards...');
      await seedUserRewards(tx);
    });
    
    console.log('Gamification engine database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding gamification engine database:', error);
    throw error;
  } finally {
    // Close the database connection
    await prisma.$disconnect();
  }
}

/**
 * Utility function to retry a database operation with exponential backoff
 * 
 * @param operation - The database operation to retry
 * @param retryConfig - Configuration for the retry mechanism
 * @returns The result of the operation
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retryConfig = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed (attempt ${attempt}/${retryConfig.maxRetries}):`, error.message);
      lastError = error;
      
      if (attempt < retryConfig.maxRetries) {
        // Calculate delay with exponential backoff
        const delay = retryConfig.baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

/**
 * Seeds achievements for all journeys.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedAchievements(tx: PrismaClient): Promise<void> {
  // Health journey achievements
  const healthAchievements = [
    {
      id: '1a2b3c4d-1111-1111-1111-111111111111',
      name: 'health-check-streak',
      title: 'Monitor de Saúde',
      description: 'Registre suas métricas de saúde por dias consecutivos',
      journey: JourneyType.HEALTH,
      icon: 'heart-pulse',
      level: 1,
      xpValue: 100,
      criteria: JSON.stringify({
        type: 'streak',
        metric: 'health_check',
        threshold: 3,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-1111-1111-1111-111111111112',
      name: 'health-check-streak',
      title: 'Monitor de Saúde Avançado',
      description: 'Registre suas métricas de saúde por 7 dias consecutivos',
      journey: JourneyType.HEALTH,
      icon: 'heart-pulse',
      level: 2,
      xpValue: 300,
      criteria: JSON.stringify({
        type: 'streak',
        metric: 'health_check',
        threshold: 7,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-1111-1111-1111-111111111113',
      name: 'health-check-streak',
      title: 'Monitor de Saúde Mestre',
      description: 'Registre suas métricas de saúde por 30 dias consecutivos',
      journey: JourneyType.HEALTH,
      icon: 'heart-pulse',
      level: 3,
      xpValue: 1000,
      criteria: JSON.stringify({
        type: 'streak',
        metric: 'health_check',
        threshold: 30,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-1111-1111-1111-111111111114',
      name: 'steps-goal',
      title: 'Caminhante Iniciante',
      description: 'Atinja sua meta diária de passos por 5 dias',
      journey: JourneyType.HEALTH,
      icon: 'footprints',
      level: 1,
      xpValue: 150,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'steps_goal_reached',
        threshold: 5,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-1111-1111-1111-111111111115',
      name: 'steps-goal',
      title: 'Caminhante Dedicado',
      description: 'Atinja sua meta diária de passos por 15 dias',
      journey: JourneyType.HEALTH,
      icon: 'footprints',
      level: 2,
      xpValue: 400,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'steps_goal_reached',
        threshold: 15,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-1111-1111-1111-111111111116',
      name: 'steps-goal',
      title: 'Caminhante Mestre',
      description: 'Atinja sua meta diária de passos por 30 dias',
      journey: JourneyType.HEALTH,
      icon: 'footprints',
      level: 3,
      xpValue: 1000,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'steps_goal_reached',
        threshold: 30,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-1111-1111-1111-111111111117',
      name: 'device-connected',
      title: 'Conectado',
      description: 'Conecte um dispositivo de saúde à sua conta',
      journey: JourneyType.HEALTH,
      icon: 'smartwatch',
      level: 1,
      xpValue: 200,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'device_connected',
        threshold: 1,
      }),
      isActive: true,
    },
  ];
  
  // Care journey achievements
  const careAchievements = [
    {
      id: '1a2b3c4d-2222-2222-2222-222222222221',
      name: 'appointment-keeper',
      title: 'Compromisso com a Saúde',
      description: 'Compareça a 1 consulta agendada',
      journey: JourneyType.CARE,
      icon: 'calendar-check',
      level: 1,
      xpValue: 150,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'appointment_attended',
        threshold: 1,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-2222-2222-2222-222222222222',
      name: 'appointment-keeper',
      title: 'Compromisso com a Saúde Avançado',
      description: 'Compareça a 5 consultas agendadas',
      journey: JourneyType.CARE,
      icon: 'calendar-check',
      level: 2,
      xpValue: 400,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'appointment_attended',
        threshold: 5,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-2222-2222-2222-222222222223',
      name: 'appointment-keeper',
      title: 'Compromisso com a Saúde Mestre',
      description: 'Compareça a 10 consultas agendadas',
      journey: JourneyType.CARE,
      icon: 'calendar-check',
      level: 3,
      xpValue: 1000,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'appointment_attended',
        threshold: 10,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-2222-2222-2222-222222222224',
      name: 'medication-adherence',
      title: 'Aderência ao Tratamento',
      description: 'Registre a tomada de medicamentos por 3 dias consecutivos',
      journey: JourneyType.CARE,
      icon: 'pill',
      level: 1,
      xpValue: 100,
      criteria: JSON.stringify({
        type: 'streak',
        metric: 'medication_taken',
        threshold: 3,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-2222-2222-2222-222222222225',
      name: 'medication-adherence',
      title: 'Aderência ao Tratamento Avançado',
      description: 'Registre a tomada de medicamentos por 7 dias consecutivos',
      journey: JourneyType.CARE,
      icon: 'pill',
      level: 2,
      xpValue: 300,
      criteria: JSON.stringify({
        type: 'streak',
        metric: 'medication_taken',
        threshold: 7,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-2222-2222-2222-222222222226',
      name: 'medication-adherence',
      title: 'Aderência ao Tratamento Mestre',
      description: 'Registre a tomada de medicamentos por 30 dias consecutivos',
      journey: JourneyType.CARE,
      icon: 'pill',
      level: 3,
      xpValue: 1000,
      criteria: JSON.stringify({
        type: 'streak',
        metric: 'medication_taken',
        threshold: 30,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-2222-2222-2222-222222222227',
      name: 'telemedicine-session',
      title: 'Consulta Virtual',
      description: 'Realize uma consulta por telemedicina',
      journey: JourneyType.CARE,
      icon: 'video',
      level: 1,
      xpValue: 200,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'telemedicine_session_completed',
        threshold: 1,
      }),
      isActive: true,
    },
  ];
  
  // Plan journey achievements
  const planAchievements = [
    {
      id: '1a2b3c4d-3333-3333-3333-333333333331',
      name: 'claim-master',
      title: 'Mestre em Reembolsos Iniciante',
      description: 'Submeta 1 solicitação de reembolso completa',
      journey: JourneyType.PLAN,
      icon: 'receipt',
      level: 1,
      xpValue: 150,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'claim_submitted',
        threshold: 1,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-3333-3333-3333-333333333332',
      name: 'claim-master',
      title: 'Mestre em Reembolsos Avançado',
      description: 'Submeta 5 solicitações de reembolso completas',
      journey: JourneyType.PLAN,
      icon: 'receipt',
      level: 2,
      xpValue: 400,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'claim_submitted',
        threshold: 5,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-3333-3333-3333-333333333333',
      name: 'claim-master',
      title: 'Mestre em Reembolsos Expert',
      description: 'Submeta 10 solicitações de reembolso completas',
      journey: JourneyType.PLAN,
      icon: 'receipt',
      level: 3,
      xpValue: 1000,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'claim_submitted',
        threshold: 10,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-3333-3333-3333-333333333334',
      name: 'benefit-explorer',
      title: 'Explorador de Benefícios',
      description: 'Explore 3 benefícios diferentes do seu plano',
      journey: JourneyType.PLAN,
      icon: 'gift',
      level: 1,
      xpValue: 200,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'benefit_viewed',
        threshold: 3,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-3333-3333-3333-333333333335',
      name: 'document-organizer',
      title: 'Organizador de Documentos',
      description: 'Faça upload de 3 documentos para seu plano',
      journey: JourneyType.PLAN,
      icon: 'file-document',
      level: 1,
      xpValue: 150,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'document_uploaded',
        threshold: 3,
      }),
      isActive: true,
    },
  ];
  
  // Cross-journey achievements
  const crossJourneyAchievements = [
    {
      id: '1a2b3c4d-4444-4444-4444-444444444441',
      name: 'journey-explorer',
      title: 'Explorador de Jornadas',
      description: 'Utilize recursos de todas as 3 jornadas',
      journey: null, // Cross-journey
      icon: 'compass',
      level: 1,
      xpValue: 300,
      criteria: JSON.stringify({
        type: 'cross_journey',
        journeys: ['health', 'care', 'plan'],
        threshold: 1, // At least one action in each journey
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-4444-4444-4444-444444444442',
      name: 'health-warrior',
      title: 'Guerreiro da Saúde',
      description: 'Complete 5 achievements em qualquer jornada',
      journey: null, // Cross-journey
      icon: 'trophy',
      level: 1,
      xpValue: 500,
      criteria: JSON.stringify({
        type: 'achievement_count',
        threshold: 5,
      }),
      isActive: true,
    },
    {
      id: '1a2b3c4d-4444-4444-4444-444444444443',
      name: 'health-warrior',
      title: 'Guerreiro da Saúde Avançado',
      description: 'Complete 15 achievements em qualquer jornada',
      journey: null, // Cross-journey
      icon: 'trophy',
      level: 2,
      xpValue: 1500,
      criteria: JSON.stringify({
        type: 'achievement_count',
        threshold: 15,
      }),
      isActive: true,
    },
  ];
  
  const allAchievements = [
    ...healthAchievements,
    ...careAchievements,
    ...planAchievements,
    ...crossJourneyAchievements,
  ];
  
  // Create all achievements in the database
  console.log(`Creating ${allAchievements.length} achievements...`);
  for (const achievement of allAchievements) {
    await withRetry(async () => {
      await tx.achievement.upsert({
        where: { id: achievement.id },
        update: achievement,
        create: achievement,
      });
    });
  }
}

/**
 * Seeds quests for all journeys.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedQuests(tx: PrismaClient): Promise<void> {
  // Health journey quests
  const healthQuests = [
    {
      id: '2a3b4c5d-1111-1111-1111-111111111111',
      name: 'weekly-steps-challenge',
      title: 'Desafio Semanal de Passos',
      description: 'Complete 50.000 passos em uma semana',
      journey: JourneyType.HEALTH,
      icon: 'run-fast',
      xpValue: 300,
      criteria: JSON.stringify({
        type: 'cumulative',
        metric: 'steps',
        threshold: 50000,
        timeframe: 'week',
      }),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      isActive: true,
    },
    {
      id: '2a3b4c5d-1111-1111-1111-111111111112',
      name: 'health-metrics-week',
      title: 'Semana de Métricas de Saúde',
      description: 'Registre 3 métricas de saúde diferentes em uma semana',
      journey: JourneyType.HEALTH,
      icon: 'chart-line',
      xpValue: 250,
      criteria: JSON.stringify({
        type: 'variety',
        metric: 'health_metric_type',
        threshold: 3,
        timeframe: 'week',
      }),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      isActive: true,
    },
  ];
  
  // Care journey quests
  const careQuests = [
    {
      id: '2a3b4c5d-2222-2222-2222-222222222221',
      name: 'preventive-checkup',
      title: 'Check-up Preventivo',
      description: 'Agende e compareça a uma consulta de check-up preventivo',
      journey: JourneyType.CARE,
      icon: 'stethoscope',
      xpValue: 350,
      criteria: JSON.stringify({
        type: 'sequence',
        steps: [
          { metric: 'preventive_appointment_scheduled', threshold: 1 },
          { metric: 'preventive_appointment_attended', threshold: 1 },
        ],
      }),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      isActive: true,
    },
    {
      id: '2a3b4c5d-2222-2222-2222-222222222222',
      name: 'medication-week',
      title: 'Semana de Medicação Perfeita',
      description: 'Registre todos os seus medicamentos por 7 dias consecutivos',
      journey: JourneyType.CARE,
      icon: 'pill',
      xpValue: 300,
      criteria: JSON.stringify({
        type: 'streak',
        metric: 'medication_adherence_day',
        threshold: 7,
      }),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      isActive: true,
    },
  ];
  
  // Plan journey quests
  const planQuests = [
    {
      id: '2a3b4c5d-3333-3333-3333-333333333331',
      name: 'digital-insurance',
      title: 'Seguro Digital',
      description: 'Digitalize e faça upload de todos os seus documentos de seguro',
      journey: JourneyType.PLAN,
      icon: 'cloud-upload',
      xpValue: 400,
      criteria: JSON.stringify({
        type: 'variety',
        metric: 'insurance_document_type',
        threshold: 5,
      }),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      isActive: true,
    },
    {
      id: '2a3b4c5d-3333-3333-3333-333333333332',
      name: 'benefit-explorer',
      title: 'Explorador de Benefícios',
      description: 'Explore todos os benefícios disponíveis no seu plano',
      journey: JourneyType.PLAN,
      icon: 'gift',
      xpValue: 250,
      criteria: JSON.stringify({
        type: 'count',
        metric: 'benefit_viewed',
        threshold: 10,
      }),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      isActive: true,
    },
  ];
  
  // Cross-journey quests
  const crossJourneyQuests = [
    {
      id: '2a3b4c5d-4444-4444-4444-444444444441',
      name: 'health-month',
      title: 'Mês da Saúde',
      description: 'Complete ações em todas as jornadas durante um mês',
      journey: null, // Cross-journey
      icon: 'calendar-month',
      xpValue: 1000,
      criteria: JSON.stringify({
        type: 'cross_journey',
        journeys: ['health', 'care', 'plan'],
        metrics: [
          { journey: 'health', metric: 'health_check', threshold: 10 },
          { journey: 'care', metric: 'appointment_attended', threshold: 1 },
          { journey: 'plan', metric: 'claim_submitted', threshold: 1 },
        ],
        timeframe: 'month',
      }),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      isActive: true,
    },
  ];
  
  const allQuests = [
    ...healthQuests,
    ...careQuests,
    ...planQuests,
    ...crossJourneyQuests,
  ];
  
  // Create all quests in the database
  console.log(`Creating ${allQuests.length} quests...`);
  for (const quest of allQuests) {
    await withRetry(async () => {
      await tx.quest.upsert({
        where: { id: quest.id },
        update: quest,
        create: quest,
      });
    });
  }
}

/**
 * Seeds rewards for all journeys.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedRewards(tx: PrismaClient): Promise<void> {
  // Health journey rewards
  const healthRewards = [
    {
      id: '3a4b5c6d-1111-1111-1111-111111111111',
      name: 'health-discount',
      title: 'Desconto em Produtos de Saúde',
      description: 'Ganhe 10% de desconto em produtos de saúde selecionados',
      journey: JourneyType.HEALTH,
      icon: 'tag',
      requiredXp: 1000,
      isActive: true,
    },
    {
      id: '3a4b5c6d-1111-1111-1111-111111111112',
      name: 'fitness-subscription',
      title: 'Assinatura de Academia',
      description: 'Ganhe 1 mês de assinatura em academias parceiras',
      journey: JourneyType.HEALTH,
      icon: 'dumbbell',
      requiredXp: 5000,
      isActive: true,
    },
  ];
  
  // Care journey rewards
  const careRewards = [
    {
      id: '3a4b5c6d-2222-2222-2222-222222222221',
      name: 'telemedicine-session',
      title: 'Sessão de Telemedicina Gratuita',
      description: 'Ganhe uma consulta de telemedicina gratuita',
      journey: JourneyType.CARE,
      icon: 'video',
      requiredXp: 2000,
      isActive: true,
    },
    {
      id: '3a4b5c6d-2222-2222-2222-222222222222',
      name: 'pharmacy-discount',
      title: 'Desconto em Farmácia',
      description: 'Ganhe 15% de desconto em medicamentos',
      journey: JourneyType.CARE,
      icon: 'pharmacy',
      requiredXp: 3000,
      isActive: true,
    },
  ];
  
  // Plan journey rewards
  const planRewards = [
    {
      id: '3a4b5c6d-3333-3333-3333-333333333331',
      name: 'premium-discount',
      title: 'Desconto na Mensalidade',
      description: 'Ganhe 5% de desconto na próxima mensalidade do seu plano',
      journey: JourneyType.PLAN,
      icon: 'percent',
      requiredXp: 4000,
      isActive: true,
    },
    {
      id: '3a4b5c6d-3333-3333-3333-333333333332',
      name: 'faster-reimbursement',
      title: 'Reembolso Prioritário',
      description: 'Seu próximo reembolso será processado com prioridade',
      journey: JourneyType.PLAN,
      icon: 'fast-forward',
      requiredXp: 2500,
      isActive: true,
    },
  ];
  
  // Cross-journey rewards
  const crossJourneyRewards = [
    {
      id: '3a4b5c6d-4444-4444-4444-444444444441',
      name: 'premium-status',
      title: 'Status Premium',
      description: 'Desbloqueie status premium com benefícios exclusivos',
      journey: null, // Cross-journey
      icon: 'crown',
      requiredXp: 10000,
      isActive: true,
    },
    {
      id: '3a4b5c6d-4444-4444-4444-444444444442',
      name: 'wellness-package',
      title: 'Pacote Wellness',
      description: 'Ganhe um pacote completo de bem-estar',
      journey: null, // Cross-journey
      icon: 'spa',
      requiredXp: 7500,
      isActive: true,
    },
  ];
  
  const allRewards = [
    ...healthRewards,
    ...careRewards,
    ...planRewards,
    ...crossJourneyRewards,
  ];
  
  // Create all rewards in the database
  console.log(`Creating ${allRewards.length} rewards...`);
  for (const reward of allRewards) {
    await withRetry(async () => {
      await tx.reward.upsert({
        where: { id: reward.id },
        update: reward,
        create: reward,
      });
    });
  }
}

/**
 * Seeds rules for event processing.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedRules(tx: PrismaClient): Promise<void> {
  // Health journey rules
  const healthRules = [
    {
      id: '4a5b6c7d-1111-1111-1111-111111111111',
      name: 'health-check-recorded',
      description: 'Regra para registrar métricas de saúde',
      eventType: 'health.metric.recorded',
      journey: JourneyType.HEALTH,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'metricType',
          operator: 'exists',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'health_check',
          value: 1,
        },
        {
          type: 'increment_streak',
          streak: 'health_check',
          resetAfterHours: 36, // Reset if more than 36 hours between checks
        },
        {
          type: 'award_xp',
          value: 10,
        },
      ]),
      priority: 1,
      isActive: true,
    },
    {
      id: '4a5b6c7d-1111-1111-1111-111111111112',
      name: 'steps-goal-reached',
      description: 'Regra para meta de passos atingida',
      eventType: 'health.steps.goal_reached',
      journey: JourneyType.HEALTH,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'goalReached',
          operator: 'equals',
          value: true,
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'steps_goal_reached',
          value: 1,
        },
        {
          type: 'award_xp',
          value: 20,
        },
      ]),
      priority: 1,
      isActive: true,
    },
    {
      id: '4a5b6c7d-1111-1111-1111-111111111113',
      name: 'device-connected',
      description: 'Regra para conexão de dispositivo',
      eventType: 'health.device.connected',
      journey: JourneyType.HEALTH,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'deviceId',
          operator: 'exists',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'device_connected',
          value: 1,
        },
        {
          type: 'award_xp',
          value: 50,
        },
      ]),
      priority: 1,
      isActive: true,
    },
  ];
  
  // Care journey rules
  const careRules = [
    {
      id: '4a5b6c7d-2222-2222-2222-222222222221',
      name: 'appointment-attended',
      description: 'Regra para consulta realizada',
      eventType: 'care.appointment.attended',
      journey: JourneyType.CARE,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'status',
          operator: 'equals',
          value: 'COMPLETED',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'appointment_attended',
          value: 1,
        },
        {
          type: 'award_xp',
          value: 30,
        },
      ]),
      priority: 1,
      isActive: true,
    },
    {
      id: '4a5b6c7d-2222-2222-2222-222222222222',
      name: 'medication-taken',
      description: 'Regra para medicação tomada',
      eventType: 'care.medication.taken',
      journey: JourneyType.CARE,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'taken',
          operator: 'equals',
          value: true,
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'medication_taken',
          value: 1,
        },
        {
          type: 'increment_streak',
          streak: 'medication_taken',
          resetAfterHours: 36,
        },
        {
          type: 'award_xp',
          value: 10,
        },
      ]),
      priority: 1,
      isActive: true,
    },
    {
      id: '4a5b6c7d-2222-2222-2222-222222222223',
      name: 'telemedicine-completed',
      description: 'Regra para consulta de telemedicina realizada',
      eventType: 'care.telemedicine.completed',
      journey: JourneyType.CARE,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'status',
          operator: 'equals',
          value: 'COMPLETED',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'telemedicine_session_completed',
          value: 1,
        },
        {
          type: 'award_xp',
          value: 40,
        },
      ]),
      priority: 1,
      isActive: true,
    },
  ];
  
  // Plan journey rules
  const planRules = [
    {
      id: '4a5b6c7d-3333-3333-3333-333333333331',
      name: 'claim-submitted',
      description: 'Regra para reembolso submetido',
      eventType: 'plan.claim.submitted',
      journey: JourneyType.PLAN,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'status',
          operator: 'equals',
          value: 'SUBMITTED',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'claim_submitted',
          value: 1,
        },
        {
          type: 'award_xp',
          value: 25,
        },
      ]),
      priority: 1,
      isActive: true,
    },
    {
      id: '4a5b6c7d-3333-3333-3333-333333333332',
      name: 'benefit-viewed',
      description: 'Regra para benefício visualizado',
      eventType: 'plan.benefit.viewed',
      journey: JourneyType.PLAN,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'benefitId',
          operator: 'exists',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'benefit_viewed',
          value: 1,
        },
        {
          type: 'award_xp',
          value: 5,
        },
      ]),
      priority: 1,
      isActive: true,
    },
    {
      id: '4a5b6c7d-3333-3333-3333-333333333333',
      name: 'document-uploaded',
      description: 'Regra para documento enviado',
      eventType: 'plan.document.uploaded',
      journey: JourneyType.PLAN,
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'documentId',
          operator: 'exists',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'document_uploaded',
          value: 1,
        },
        {
          type: 'award_xp',
          value: 15,
        },
      ]),
      priority: 1,
      isActive: true,
    },
  ];
  
  // Cross-journey rules
  const crossJourneyRules = [
    {
      id: '4a5b6c7d-4444-4444-4444-444444444441',
      name: 'achievement-unlocked',
      description: 'Regra para conquista desbloqueada',
      eventType: 'gamification.achievement.unlocked',
      journey: null, // Cross-journey
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'achievementId',
          operator: 'exists',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'achievements_unlocked',
          value: 1,
        },
        {
          type: 'check_achievement',
          achievementName: 'health-warrior',
        },
      ]),
      priority: 2, // Higher priority to run after journey-specific rules
      isActive: true,
    },
    {
      id: '4a5b6c7d-4444-4444-4444-444444444442',
      name: 'journey-activity',
      description: 'Regra para atividade em qualquer jornada',
      eventType: '*', // Wildcard to match any event
      journey: null, // Cross-journey
      conditions: JSON.stringify({
        type: 'simple',
        condition: {
          field: 'journey',
          operator: 'exists',
        },
      }),
      actions: JSON.stringify([
        {
          type: 'increment_counter',
          counter: 'journey_activity',
          value: 1,
        },
        {
          type: 'check_achievement',
          achievementName: 'journey-explorer',
        },
      ]),
      priority: 10, // Low priority to run after all other rules
      isActive: true,
    },
  ];
  
  const allRules = [
    ...healthRules,
    ...careRules,
    ...planRules,
    ...crossJourneyRules,
  ];
  
  // Create all rules in the database
  console.log(`Creating ${allRules.length} rules...`);
  for (const rule of allRules) {
    await withRetry(async () => {
      await tx.rule.upsert({
        where: { id: rule.id },
        update: rule,
        create: rule,
      });
    });
  }
}

/**
 * Seeds game profiles for testing.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedGameProfiles(tx: PrismaClient): Promise<void> {
  const profiles = [
    {
      id: '5a6b7c8d-1111-1111-1111-111111111111',
      userId: 'user1',
      level: 1,
      xp: 0,
      streaks: JSON.stringify({
        health_check: { current: 0, max: 0, lastUpdated: new Date().toISOString() },
        medication_taken: { current: 0, max: 0, lastUpdated: new Date().toISOString() },
      }),
      counters: JSON.stringify({
        health_check: 0,
        steps_goal_reached: 0,
        device_connected: 0,
        appointment_attended: 0,
        medication_taken: 0,
        telemedicine_session_completed: 0,
        claim_submitted: 0,
        benefit_viewed: 0,
        document_uploaded: 0,
        achievements_unlocked: 0,
        journey_activity: 0,
      }),
    },
    {
      id: '5a6b7c8d-2222-2222-2222-222222222222',
      userId: 'user2',
      level: 2,
      xp: 1200,
      streaks: JSON.stringify({
        health_check: { current: 3, max: 5, lastUpdated: new Date().toISOString() },
        medication_taken: { current: 2, max: 2, lastUpdated: new Date().toISOString() },
      }),
      counters: JSON.stringify({
        health_check: 15,
        steps_goal_reached: 8,
        device_connected: 1,
        appointment_attended: 2,
        medication_taken: 10,
        telemedicine_session_completed: 1,
        claim_submitted: 1,
        benefit_viewed: 5,
        document_uploaded: 2,
        achievements_unlocked: 3,
        journey_activity: 42,
      }),
    },
    {
      id: '5a6b7c8d-3333-3333-3333-333333333333',
      userId: 'user3',
      level: 5,
      xp: 5500,
      streaks: JSON.stringify({
        health_check: { current: 12, max: 15, lastUpdated: new Date().toISOString() },
        medication_taken: { current: 7, max: 7, lastUpdated: new Date().toISOString() },
      }),
      counters: JSON.stringify({
        health_check: 45,
        steps_goal_reached: 30,
        device_connected: 3,
        appointment_attended: 8,
        medication_taken: 60,
        telemedicine_session_completed: 4,
        claim_submitted: 6,
        benefit_viewed: 12,
        document_uploaded: 8,
        achievements_unlocked: 12,
        journey_activity: 150,
      }),
    },
    {
      id: '5a6b7c8d-4444-4444-4444-444444444444',
      userId: 'user4',
      level: 3,
      xp: 2800,
      streaks: JSON.stringify({
        health_check: { current: 0, max: 8, lastUpdated: new Date().toISOString() },
        medication_taken: { current: 4, max: 4, lastUpdated: new Date().toISOString() },
      }),
      counters: JSON.stringify({
        health_check: 25,
        steps_goal_reached: 15,
        device_connected: 2,
        appointment_attended: 4,
        medication_taken: 30,
        telemedicine_session_completed: 2,
        claim_submitted: 3,
        benefit_viewed: 8,
        document_uploaded: 5,
        achievements_unlocked: 7,
        journey_activity: 85,
      }),
    },
    {
      id: '5a6b7c8d-5555-5555-5555-555555555555',
      userId: 'user5',
      level: 8,
      xp: 12000,
      streaks: JSON.stringify({
        health_check: { current: 30, max: 30, lastUpdated: new Date().toISOString() },
        medication_taken: { current: 15, max: 15, lastUpdated: new Date().toISOString() },
      }),
      counters: JSON.stringify({
        health_check: 90,
        steps_goal_reached: 60,
        device_connected: 5,
        appointment_attended: 15,
        medication_taken: 120,
        telemedicine_session_completed: 8,
        claim_submitted: 12,
        benefit_viewed: 20,
        document_uploaded: 15,
        achievements_unlocked: 25,
        journey_activity: 300,
      }),
    },
  ];
  
  // Create all game profiles in the database
  console.log(`Creating ${profiles.length} game profiles...`);
  for (const profile of profiles) {
    await withRetry(async () => {
      await tx.gameProfile.upsert({
        where: { id: profile.id },
        update: profile,
        create: profile,
      });
    });
  }
}

/**
 * Seeds user achievements for testing.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedUserAchievements(tx: PrismaClient): Promise<void> {
  const userAchievements = [
    // User 2 achievements
    {
      id: '6a7b8c9d-2222-1111-1111-111111111111',
      userId: 'user2',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111111', // health-check-streak level 1
      unlockedAt: new Date('2023-01-15'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-2222-1111-1111-111111111112',
      userId: 'user2',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111114', // steps-goal level 1
      unlockedAt: new Date('2023-01-20'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-2222-2222-2222-222222222221',
      userId: 'user2',
      achievementId: '1a2b3c4d-2222-2222-2222-222222222221', // appointment-keeper level 1
      unlockedAt: new Date('2023-01-25'),
      progress: 100,
    },
    
    // User 3 achievements (more advanced user)
    {
      id: '6a7b8c9d-3333-1111-1111-111111111111',
      userId: 'user3',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111111', // health-check-streak level 1
      unlockedAt: new Date('2023-01-10'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-1111-1111-111111111112',
      userId: 'user3',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111112', // health-check-streak level 2
      unlockedAt: new Date('2023-01-20'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-1111-1111-111111111113',
      userId: 'user3',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111114', // steps-goal level 1
      unlockedAt: new Date('2023-01-15'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-1111-1111-111111111114',
      userId: 'user3',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111115', // steps-goal level 2
      unlockedAt: new Date('2023-02-01'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-1111-1111-111111111115',
      userId: 'user3',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111117', // device-connected
      unlockedAt: new Date('2023-01-05'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-2222-2222-222222222221',
      userId: 'user3',
      achievementId: '1a2b3c4d-2222-2222-2222-222222222221', // appointment-keeper level 1
      unlockedAt: new Date('2023-01-12'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-2222-2222-222222222222',
      userId: 'user3',
      achievementId: '1a2b3c4d-2222-2222-2222-222222222222', // appointment-keeper level 2
      unlockedAt: new Date('2023-02-15'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-2222-2222-222222222223',
      userId: 'user3',
      achievementId: '1a2b3c4d-2222-2222-2222-222222222224', // medication-adherence level 1
      unlockedAt: new Date('2023-01-18'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-2222-2222-222222222224',
      userId: 'user3',
      achievementId: '1a2b3c4d-2222-2222-2222-222222222225', // medication-adherence level 2
      unlockedAt: new Date('2023-01-28'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-2222-2222-222222222225',
      userId: 'user3',
      achievementId: '1a2b3c4d-2222-2222-2222-222222222227', // telemedicine-session
      unlockedAt: new Date('2023-02-05'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-3333-3333-333333333331',
      userId: 'user3',
      achievementId: '1a2b3c4d-3333-3333-3333-333333333331', // claim-master level 1
      unlockedAt: new Date('2023-01-22'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-3333-3333-333333333332',
      userId: 'user3',
      achievementId: '1a2b3c4d-3333-3333-3333-333333333334', // benefit-explorer
      unlockedAt: new Date('2023-02-10'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-3333-4444-4444-444444444441',
      userId: 'user3',
      achievementId: '1a2b3c4d-4444-4444-4444-444444444441', // journey-explorer
      unlockedAt: new Date('2023-02-20'),
      progress: 100,
    },
    
    // User 5 achievements (most advanced user)
    // Would include all achievements from user 3 plus more
    {
      id: '6a7b8c9d-5555-1111-1111-111111111111',
      userId: 'user5',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111111', // health-check-streak level 1
      unlockedAt: new Date('2023-01-05'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-5555-1111-1111-111111111112',
      userId: 'user5',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111112', // health-check-streak level 2
      unlockedAt: new Date('2023-01-15'),
      progress: 100,
    },
    {
      id: '6a7b8c9d-5555-1111-1111-111111111113',
      userId: 'user5',
      achievementId: '1a2b3c4d-1111-1111-1111-111111111113', // health-check-streak level 3
      unlockedAt: new Date('2023-02-15'),
      progress: 100,
    },
  ];
  
  // Create all user achievements in the database
  console.log(`Creating ${userAchievements.length} user achievements...`);
  for (const userAchievement of userAchievements) {
    await withRetry(async () => {
      await tx.userAchievement.upsert({
        where: { id: userAchievement.id },
        update: userAchievement,
        create: userAchievement,
      });
    });
  }
}

/**
 * Seeds user quests for testing.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedUserQuests(tx: PrismaClient): Promise<void> {
  const userQuests = [
    // User 2 quests
    {
      id: '7a8b9c0d-2222-1111-1111-111111111111',
      userId: 'user2',
      questId: '2a3b4c5d-1111-1111-1111-111111111111', // weekly-steps-challenge
      startedAt: new Date('2023-01-10'),
      progress: 30, // 30% complete
      currentValue: 15000, // 15,000 steps out of 50,000
      isCompleted: false,
    },
    
    // User 3 quests
    {
      id: '7a8b9c0d-3333-1111-1111-111111111111',
      userId: 'user3',
      questId: '2a3b4c5d-1111-1111-1111-111111111111', // weekly-steps-challenge
      startedAt: new Date('2023-01-05'),
      progress: 100, // 100% complete
      currentValue: 52000, // 52,000 steps out of 50,000
      isCompleted: true,
      completedAt: new Date('2023-01-12'),
    },
    {
      id: '7a8b9c0d-3333-2222-2222-222222222221',
      userId: 'user3',
      questId: '2a3b4c5d-2222-2222-2222-222222222221', // preventive-checkup
      startedAt: new Date('2023-01-20'),
      progress: 50, // 50% complete (scheduled but not attended)
      currentValue: 1, // Completed first step
      isCompleted: false,
    },
    
    // User 5 quests
    {
      id: '7a8b9c0d-5555-1111-1111-111111111111',
      userId: 'user5',
      questId: '2a3b4c5d-1111-1111-1111-111111111111', // weekly-steps-challenge
      startedAt: new Date('2023-01-02'),
      progress: 100, // 100% complete
      currentValue: 65000, // 65,000 steps out of 50,000
      isCompleted: true,
      completedAt: new Date('2023-01-08'),
    },
    {
      id: '7a8b9c0d-5555-2222-2222-222222222221',
      userId: 'user5',
      questId: '2a3b4c5d-2222-2222-2222-222222222221', // preventive-checkup
      startedAt: new Date('2023-01-15'),
      progress: 100, // 100% complete
      currentValue: 2, // Completed both steps
      isCompleted: true,
      completedAt: new Date('2023-01-25'),
    },
    {
      id: '7a8b9c0d-5555-3333-3333-333333333331',
      userId: 'user5',
      questId: '2a3b4c5d-3333-3333-3333-333333333331', // digital-insurance
      startedAt: new Date('2023-02-01'),
      progress: 80, // 80% complete
      currentValue: 4, // 4 out of 5 document types
      isCompleted: false,
    },
    {
      id: '7a8b9c0d-5555-4444-4444-444444444441',
      userId: 'user5',
      questId: '2a3b4c5d-4444-4444-4444-444444444441', // health-month
      startedAt: new Date('2023-02-01'),
      progress: 60, // 60% complete
      currentValue: JSON.stringify({
        health: 10, // Completed health requirement
        care: 1, // Completed care requirement
        plan: 0, // Not completed plan requirement
      }),
      isCompleted: false,
    },
  ];
  
  // Create all user quests in the database
  console.log(`Creating ${userQuests.length} user quests...`);
  for (const userQuest of userQuests) {
    await withRetry(async () => {
      await tx.userQuest.upsert({
        where: { id: userQuest.id },
        update: userQuest,
        create: userQuest,
      });
    });
  }
}

/**
 * Seeds user rewards for testing.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedUserRewards(tx: PrismaClient): Promise<void> {
  const userRewards = [
    // User 3 rewards
    {
      id: '8a9b0c1d-3333-1111-1111-111111111111',
      userId: 'user3',
      rewardId: '3a4b5c6d-1111-1111-1111-111111111111', // health-discount
      earnedAt: new Date('2023-02-01'),
      redeemedAt: null,
      expiresAt: new Date('2023-05-01'), // 3 months validity
      status: 'AVAILABLE',
    },
    
    // User 5 rewards
    {
      id: '8a9b0c1d-5555-1111-1111-111111111111',
      userId: 'user5',
      rewardId: '3a4b5c6d-1111-1111-1111-111111111111', // health-discount
      earnedAt: new Date('2023-01-15'),
      redeemedAt: new Date('2023-01-20'),
      expiresAt: new Date('2023-04-15'), // 3 months validity
      status: 'REDEEMED',
    },
    {
      id: '8a9b0c1d-5555-2222-2222-222222222221',
      userId: 'user5',
      rewardId: '3a4b5c6d-2222-2222-2222-222222222221', // telemedicine-session
      earnedAt: new Date('2023-02-05'),
      redeemedAt: null,
      expiresAt: new Date('2023-05-05'), // 3 months validity
      status: 'AVAILABLE',
    },
    {
      id: '8a9b0c1d-5555-3333-3333-333333333331',
      userId: 'user5',
      rewardId: '3a4b5c6d-3333-3333-3333-333333333331', // premium-discount
      earnedAt: new Date('2023-02-10'),
      redeemedAt: null,
      expiresAt: new Date('2023-05-10'), // 3 months validity
      status: 'AVAILABLE',
    },
  ];
  
  // Create all user rewards in the database
  console.log(`Creating ${userRewards.length} user rewards...`);
  for (const userReward of userRewards) {
    await withRetry(async () => {
      await tx.userReward.upsert({
        where: { id: userReward.id },
        update: userReward,
        create: userReward,
      });
    });
  }
}

// Run the seed function
seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });