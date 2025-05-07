import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { JourneyType } from '../src/common/interfaces/journey.interface';

// Maximum number of retry attempts for database operations
const MAX_RETRY_ATTEMPTS = 3;
// Delay between retry attempts in milliseconds (exponential backoff)
const RETRY_DELAY_BASE = 500;

/**
 * Logger instance for seed operations
 */
const logger = new Logger('GamificationSeed');

/**
 * Seeds the gamification database with initial data.
 * 
 * @returns A promise that resolves when the database is seeded.
 */
async function seed(): Promise<void> {
  logger.log('Starting gamification database seeding...');
  
  // Create a standard PrismaClient for data operations
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    // Use a transaction for atomic seeding operations
    await prisma.$transaction(async (tx) => {
      // Create default game profiles
      logger.log('Creating default game profiles...');
      await seedGameProfiles(tx);
      
      // Create achievements
      logger.log('Creating achievements...');
      await seedAchievements(tx);
      
      // Create quests
      logger.log('Creating quests...');
      await seedQuests(tx);
      
      // Create rewards
      logger.log('Creating rewards...');
      await seedRewards(tx);
      
      // Create rules
      logger.log('Creating rules...');
      await seedRules(tx);
    }, {
      timeout: 30000, // 30 seconds timeout for the transaction
    });
    
    logger.log('Gamification database seeding completed successfully!');
  } catch (error) {
    logger.error(`Error seeding gamification database: ${error.message}`, error.stack);
    throw error;
  } finally {
    // Close the database connection
    await prisma.$disconnect();
  }
}

/**
 * Utility function to retry database operations with exponential backoff
 * 
 * @param operation - The database operation to retry
 * @param maxAttempts - Maximum number of retry attempts
 * @returns The result of the operation
 */
async function withRetry<T>(operation: () => Promise<T>, maxAttempts = MAX_RETRY_ATTEMPTS): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry on specific database errors that are transient
      if (!isRetryableError(error)) {
        logger.error(`Non-retryable error encountered: ${error.message}`);
        throw error;
      }
      
      if (attempt < maxAttempts) {
        // Calculate delay with exponential backoff
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
  throw lastError;
}

/**
 * Determines if an error is retryable
 * 
 * @param error - The error to check
 * @returns True if the error is retryable, false otherwise
 */
function isRetryableError(error: any): boolean {
  // Retry on connection errors, deadlocks, or serialization failures
  return (
    error.code === 'P1001' || // Authentication failed
    error.code === 'P1002' || // Connection timed out
    error.code === 'P1008' || // Operations timed out
    error.code === 'P1017' || // Server closed the connection
    error.code === 'P2034' || // Transaction failed due to a serialization error
    error.code === 'P2037'    // Too many database connections
  );
}

/**
 * Seeds default game profiles for test users.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedGameProfiles(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>): Promise<void> {
  try {
    // Get existing users from the auth service database
    // In a real implementation, this would use a service or API call
    // For this seed script, we'll use hardcoded user IDs
    const testUserIds = [
      '00000000-0000-0000-0000-000000000001', // Admin user
      '00000000-0000-0000-0000-000000000002', // Regular test user
    ];
    
    for (const userId of testUserIds) {
      await withRetry(async () => {
        await tx.gameProfile.upsert({
          where: { userId },
          update: {}, // No updates if it exists
          create: {
            userId,
            level: 1,
            xp: 0,
          },
        });
      });
    }
    
    logger.log(`Created ${testUserIds.length} game profiles`);
  } catch (error) {
    logger.error(`Error seeding game profiles: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds achievements for all journeys.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedAchievements(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>): Promise<void> {
  try {
    // Health journey achievements
    const healthAchievements = [
      {
        name: 'health-check-streak-1',
        title: 'Monitor de Saúde I',
        description: 'Registre suas métricas de saúde por 3 dias consecutivos',
        journey: JourneyType.HEALTH,
        icon: 'heart-pulse',
        xpReward: 50,
        criteria: JSON.stringify({
          eventType: 'health.metric.recorded',
          count: 3,
          period: 'day',
          consecutive: true,
        }),
      },
      {
        name: 'health-check-streak-2',
        title: 'Monitor de Saúde II',
        description: 'Registre suas métricas de saúde por 7 dias consecutivos',
        journey: JourneyType.HEALTH,
        icon: 'heart-pulse',
        xpReward: 100,
        criteria: JSON.stringify({
          eventType: 'health.metric.recorded',
          count: 7,
          period: 'day',
          consecutive: true,
        }),
      },
      {
        name: 'health-check-streak-3',
        title: 'Monitor de Saúde III',
        description: 'Registre suas métricas de saúde por 30 dias consecutivos',
        journey: JourneyType.HEALTH,
        icon: 'heart-pulse',
        xpReward: 300,
        criteria: JSON.stringify({
          eventType: 'health.metric.recorded',
          count: 30,
          period: 'day',
          consecutive: true,
        }),
      },
      {
        name: 'steps-goal-1',
        title: 'Caminhante Dedicado I',
        description: 'Atinja sua meta diária de passos 5 vezes',
        journey: JourneyType.HEALTH,
        icon: 'footprints',
        xpReward: 50,
        criteria: JSON.stringify({
          eventType: 'health.goal.achieved',
          goalType: 'steps',
          count: 5,
        }),
      },
      {
        name: 'steps-goal-2',
        title: 'Caminhante Dedicado II',
        description: 'Atinja sua meta diária de passos 15 vezes',
        journey: JourneyType.HEALTH,
        icon: 'footprints',
        xpReward: 100,
        criteria: JSON.stringify({
          eventType: 'health.goal.achieved',
          goalType: 'steps',
          count: 15,
        }),
      },
      {
        name: 'steps-goal-3',
        title: 'Caminhante Dedicado III',
        description: 'Atinja sua meta diária de passos 30 vezes',
        journey: JourneyType.HEALTH,
        icon: 'footprints',
        xpReward: 300,
        criteria: JSON.stringify({
          eventType: 'health.goal.achieved',
          goalType: 'steps',
          count: 30,
        }),
      },
      {
        name: 'device-connected',
        title: 'Conectado',
        description: 'Conecte um dispositivo de saúde à sua conta',
        journey: JourneyType.HEALTH,
        icon: 'device-watch',
        xpReward: 100,
        criteria: JSON.stringify({
          eventType: 'health.device.connected',
          count: 1,
        }),
      },
    ];
    
    // Care journey achievements
    const careAchievements = [
      {
        name: 'appointment-keeper-1',
        title: 'Compromisso com a Saúde I',
        description: 'Compareça a 1 consulta agendada',
        journey: JourneyType.CARE,
        icon: 'calendar-check',
        xpReward: 50,
        criteria: JSON.stringify({
          eventType: 'care.appointment.completed',
          count: 1,
        }),
      },
      {
        name: 'appointment-keeper-2',
        title: 'Compromisso com a Saúde II',
        description: 'Compareça a 5 consultas agendadas',
        journey: JourneyType.CARE,
        icon: 'calendar-check',
        xpReward: 150,
        criteria: JSON.stringify({
          eventType: 'care.appointment.completed',
          count: 5,
        }),
      },
      {
        name: 'appointment-keeper-3',
        title: 'Compromisso com a Saúde III',
        description: 'Compareça a 10 consultas agendadas',
        journey: JourneyType.CARE,
        icon: 'calendar-check',
        xpReward: 300,
        criteria: JSON.stringify({
          eventType: 'care.appointment.completed',
          count: 10,
        }),
      },
      {
        name: 'medication-adherence-1',
        title: 'Aderência ao Tratamento I',
        description: 'Tome seus medicamentos conforme prescrito por 7 dias',
        journey: JourneyType.CARE,
        icon: 'pill',
        xpReward: 100,
        criteria: JSON.stringify({
          eventType: 'care.medication.taken',
          count: 7,
          period: 'day',
          consecutive: true,
        }),
      },
      {
        name: 'medication-adherence-2',
        title: 'Aderência ao Tratamento II',
        description: 'Tome seus medicamentos conforme prescrito por 15 dias',
        journey: JourneyType.CARE,
        icon: 'pill',
        xpReward: 200,
        criteria: JSON.stringify({
          eventType: 'care.medication.taken',
          count: 15,
          period: 'day',
          consecutive: true,
        }),
      },
      {
        name: 'medication-adherence-3',
        title: 'Aderência ao Tratamento III',
        description: 'Tome seus medicamentos conforme prescrito por 30 dias',
        journey: JourneyType.CARE,
        icon: 'pill',
        xpReward: 400,
        criteria: JSON.stringify({
          eventType: 'care.medication.taken',
          count: 30,
          period: 'day',
          consecutive: true,
        }),
      },
      {
        name: 'telemedicine-pioneer',
        title: 'Pioneiro em Telemedicina',
        description: 'Realize sua primeira consulta por telemedicina',
        journey: JourneyType.CARE,
        icon: 'video',
        xpReward: 150,
        criteria: JSON.stringify({
          eventType: 'care.telemedicine.completed',
          count: 1,
        }),
      },
    ];
    
    // Plan journey achievements
    const planAchievements = [
      {
        name: 'claim-master-1',
        title: 'Mestre em Reembolsos I',
        description: 'Submeta 1 solicitação de reembolso completa',
        journey: JourneyType.PLAN,
        icon: 'receipt',
        xpReward: 50,
        criteria: JSON.stringify({
          eventType: 'plan.claim.submitted',
          count: 1,
        }),
      },
      {
        name: 'claim-master-2',
        title: 'Mestre em Reembolsos II',
        description: 'Submeta 5 solicitações de reembolso completas',
        journey: JourneyType.PLAN,
        icon: 'receipt',
        xpReward: 150,
        criteria: JSON.stringify({
          eventType: 'plan.claim.submitted',
          count: 5,
        }),
      },
      {
        name: 'claim-master-3',
        title: 'Mestre em Reembolsos III',
        description: 'Submeta 10 solicitações de reembolso completas',
        journey: JourneyType.PLAN,
        icon: 'receipt',
        xpReward: 300,
        criteria: JSON.stringify({
          eventType: 'plan.claim.submitted',
          count: 10,
        }),
      },
      {
        name: 'benefit-explorer-1',
        title: 'Explorador de Benefícios I',
        description: 'Utilize 1 benefício do seu plano',
        journey: JourneyType.PLAN,
        icon: 'gift',
        xpReward: 50,
        criteria: JSON.stringify({
          eventType: 'plan.benefit.used',
          count: 1,
        }),
      },
      {
        name: 'benefit-explorer-2',
        title: 'Explorador de Benefícios II',
        description: 'Utilize 3 benefícios diferentes do seu plano',
        journey: JourneyType.PLAN,
        icon: 'gift',
        xpReward: 150,
        criteria: JSON.stringify({
          eventType: 'plan.benefit.used',
          count: 3,
          unique: true,
        }),
      },
      {
        name: 'document-organizer',
        title: 'Organizador de Documentos',
        description: 'Faça upload de todos os seus documentos de seguro',
        journey: JourneyType.PLAN,
        icon: 'file-document',
        xpReward: 100,
        criteria: JSON.stringify({
          eventType: 'plan.document.uploaded',
          count: 5,
        }),
      },
    ];
    
    // Cross-journey achievements
    const crossJourneyAchievements = [
      {
        name: 'journey-explorer',
        title: 'Explorador de Jornadas',
        description: 'Utilize recursos de todas as jornadas (Saúde, Cuidado e Plano)',
        journey: 'cross-journey',
        icon: 'compass',
        xpReward: 200,
        criteria: JSON.stringify({
          journeys: ['health', 'care', 'plan'],
          allRequired: true,
        }),
      },
      {
        name: 'health-enthusiast',
        title: 'Entusiasta da Saúde',
        description: 'Desbloqueie 5 conquistas na jornada de Saúde',
        journey: 'cross-journey',
        icon: 'heart',
        xpReward: 250,
        criteria: JSON.stringify({
          achievementCount: 5,
          journey: 'health',
        }),
      },
      {
        name: 'care-advocate',
        title: 'Defensor do Cuidado',
        description: 'Desbloqueie 5 conquistas na jornada de Cuidado',
        journey: 'cross-journey',
        icon: 'medical-bag',
        xpReward: 250,
        criteria: JSON.stringify({
          achievementCount: 5,
          journey: 'care',
        }),
      },
      {
        name: 'plan-optimizer',
        title: 'Otimizador de Plano',
        description: 'Desbloqueie 5 conquistas na jornada de Plano',
        journey: 'cross-journey',
        icon: 'shield',
        xpReward: 250,
        criteria: JSON.stringify({
          achievementCount: 5,
          journey: 'plan',
        }),
      },
    ];
    
    // Combine all achievements
    const allAchievements = [
      ...healthAchievements,
      ...careAchievements,
      ...planAchievements,
      ...crossJourneyAchievements,
    ];
    
    // Create all achievements in the database
    for (const achievement of allAchievements) {
      await withRetry(async () => {
        await tx.achievement.upsert({
          where: { name: achievement.name },
          update: achievement,
          create: achievement,
        });
      });
    }
    
    logger.log(`Created ${allAchievements.length} achievements`);
  } catch (error) {
    logger.error(`Error seeding achievements: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds quests for all journeys.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedQuests(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>): Promise<void> {
  try {
    // Health journey quests
    const healthQuests = [
      {
        name: 'daily-steps-quest',
        title: 'Desafio de Passos Diários',
        description: 'Complete 10.000 passos por dia durante uma semana',
        journey: JourneyType.HEALTH,
        icon: 'walk',
        xpReward: 150,
        criteria: JSON.stringify({
          eventType: 'health.metric.recorded',
          metricType: 'STEPS',
          threshold: 10000,
          count: 7,
          period: 'day',
          consecutive: true,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
      {
        name: 'weight-tracking-quest',
        title: 'Desafio de Monitoramento de Peso',
        description: 'Registre seu peso 3 vezes por semana durante um mês',
        journey: JourneyType.HEALTH,
        icon: 'scale-bathroom',
        xpReward: 200,
        criteria: JSON.stringify({
          eventType: 'health.metric.recorded',
          metricType: 'WEIGHT',
          count: 12, // 3 times per week for 4 weeks
          period: 'month',
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
      {
        name: 'sleep-improvement-quest',
        title: 'Desafio de Melhoria do Sono',
        description: 'Durma pelo menos 7 horas por noite durante 5 dias consecutivos',
        journey: JourneyType.HEALTH,
        icon: 'sleep',
        xpReward: 100,
        criteria: JSON.stringify({
          eventType: 'health.metric.recorded',
          metricType: 'SLEEP',
          threshold: 7,
          count: 5,
          period: 'day',
          consecutive: true,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        isActive: true,
      },
    ];
    
    // Care journey quests
    const careQuests = [
      {
        name: 'preventive-checkup-quest',
        title: 'Desafio de Check-up Preventivo',
        description: 'Agende e compareça a uma consulta de check-up preventivo',
        journey: JourneyType.CARE,
        icon: 'stethoscope',
        xpReward: 200,
        criteria: JSON.stringify({
          eventType: 'care.appointment.completed',
          appointmentType: 'preventive',
          count: 1,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true,
      },
      {
        name: 'medication-adherence-quest',
        title: 'Desafio de Aderência à Medicação',
        description: 'Tome todos os seus medicamentos conforme prescrito por 2 semanas',
        journey: JourneyType.CARE,
        icon: 'pill',
        xpReward: 150,
        criteria: JSON.stringify({
          eventType: 'care.medication.taken',
          adherenceRate: 100,
          count: 14,
          period: 'day',
          consecutive: true,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
      {
        name: 'telemedicine-quest',
        title: 'Desafio de Telemedicina',
        description: 'Realize uma consulta por telemedicina',
        journey: JourneyType.CARE,
        icon: 'video',
        xpReward: 100,
        criteria: JSON.stringify({
          eventType: 'care.telemedicine.completed',
          count: 1,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        isActive: true,
      },
    ];
    
    // Plan journey quests
    const planQuests = [
      {
        name: 'digital-insurance-card-quest',
        title: 'Desafio do Cartão Digital',
        description: 'Ative seu cartão de seguro digital',
        journey: JourneyType.PLAN,
        icon: 'card-account-details',
        xpReward: 50,
        criteria: JSON.stringify({
          eventType: 'plan.card.activated',
          count: 1,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
      {
        name: 'claim-submission-quest',
        title: 'Desafio de Submissão de Reembolso',
        description: 'Submeta uma solicitação de reembolso com todos os documentos necessários',
        journey: JourneyType.PLAN,
        icon: 'receipt',
        xpReward: 100,
        criteria: JSON.stringify({
          eventType: 'plan.claim.submitted',
          withAllDocuments: true,
          count: 1,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        isActive: true,
      },
      {
        name: 'benefit-usage-quest',
        title: 'Desafio de Utilização de Benefícios',
        description: 'Utilize pelo menos 2 benefícios diferentes do seu plano',
        journey: JourneyType.PLAN,
        icon: 'gift',
        xpReward: 150,
        criteria: JSON.stringify({
          eventType: 'plan.benefit.used',
          count: 2,
          unique: true,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true,
      },
    ];
    
    // Cross-journey quests
    const crossJourneyQuests = [
      {
        name: 'complete-profile-quest',
        title: 'Desafio de Perfil Completo',
        description: 'Complete seu perfil em todas as jornadas',
        journey: 'cross-journey',
        icon: 'account-check',
        xpReward: 100,
        criteria: JSON.stringify({
          events: [
            { eventType: 'health.profile.completed', count: 1 },
            { eventType: 'care.profile.completed', count: 1 },
            { eventType: 'plan.profile.completed', count: 1 },
          ],
          allRequired: true,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
      {
        name: 'wellness-warrior-quest',
        title: 'Desafio Guerreiro do Bem-Estar',
        description: 'Complete uma atividade em cada jornada na mesma semana',
        journey: 'cross-journey',
        icon: 'shield-star',
        xpReward: 300,
        criteria: JSON.stringify({
          events: [
            { eventType: 'health.activity.completed', count: 1 },
            { eventType: 'care.appointment.completed', count: 1 },
            { eventType: 'plan.benefit.used', count: 1 },
          ],
          allRequired: true,
          withinDays: 7,
        }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true,
      },
    ];
    
    // Combine all quests
    const allQuests = [
      ...healthQuests,
      ...careQuests,
      ...planQuests,
      ...crossJourneyQuests,
    ];
    
    // Create all quests in the database
    for (const quest of allQuests) {
      await withRetry(async () => {
        await tx.quest.upsert({
          where: { name: quest.name },
          update: quest,
          create: quest,
        });
      });
    }
    
    logger.log(`Created ${allQuests.length} quests`);
  } catch (error) {
    logger.error(`Error seeding quests: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds rewards for all journeys.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedRewards(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>): Promise<void> {
  try {
    // Health journey rewards
    const healthRewards = [
      {
        name: 'health-premium-content',
        title: 'Conteúdo Premium de Saúde',
        description: 'Acesso a artigos e vídeos exclusivos sobre saúde e bem-estar',
        journey: JourneyType.HEALTH,
        icon: 'book-open-page-variant',
        xpCost: 200,
        isActive: true,
      },
      {
        name: 'fitness-class-discount',
        title: 'Desconto em Aulas de Fitness',
        description: 'Cupom de 20% de desconto em aulas de fitness parceiras',
        journey: JourneyType.HEALTH,
        icon: 'dumbbell',
        xpCost: 500,
        isActive: true,
      },
      {
        name: 'nutrition-consultation',
        title: 'Consulta de Nutrição',
        description: 'Uma consulta gratuita com nutricionista parceiro',
        journey: JourneyType.HEALTH,
        icon: 'food-apple',
        xpCost: 1000,
        isActive: true,
      },
    ];
    
    // Care journey rewards
    const careRewards = [
      {
        name: 'priority-scheduling',
        title: 'Agendamento Prioritário',
        description: 'Acesso prioritário para agendamento de consultas',
        journey: JourneyType.CARE,
        icon: 'calendar-clock',
        xpCost: 300,
        isActive: true,
      },
      {
        name: 'telemedicine-credit',
        title: 'Crédito para Telemedicina',
        description: 'Crédito para uma consulta de telemedicina gratuita',
        journey: JourneyType.CARE,
        icon: 'video',
        xpCost: 600,
        isActive: true,
      },
      {
        name: 'wellness-package',
        title: 'Pacote de Bem-Estar',
        description: 'Pacote com produtos de bem-estar e cuidados pessoais',
        journey: JourneyType.CARE,
        icon: 'package-variant-closed',
        xpCost: 800,
        isActive: true,
      },
    ];
    
    // Plan journey rewards
    const planRewards = [
      {
        name: 'expedited-claim',
        title: 'Reembolso Expresso',
        description: 'Processamento prioritário para sua próxima solicitação de reembolso',
        journey: JourneyType.PLAN,
        icon: 'fast-forward',
        xpCost: 250,
        isActive: true,
      },
      {
        name: 'insurance-discount',
        title: 'Desconto na Mensalidade',
        description: '5% de desconto em uma mensalidade do seu plano',
        journey: JourneyType.PLAN,
        icon: 'percent',
        xpCost: 1000,
        isActive: true,
      },
      {
        name: 'premium-upgrade',
        title: 'Upgrade Temporário',
        description: 'Acesso a benefícios do plano premium por 30 dias',
        journey: JourneyType.PLAN,
        icon: 'arrow-up-bold-circle',
        xpCost: 1500,
        isActive: true,
      },
    ];
    
    // Cross-journey rewards
    const crossJourneyRewards = [
      {
        name: 'exclusive-event',
        title: 'Evento Exclusivo',
        description: 'Convite para evento exclusivo de saúde e bem-estar',
        journey: 'cross-journey',
        icon: 'ticket',
        xpCost: 750,
        isActive: true,
      },
      {
        name: 'wellness-box',
        title: 'Caixa de Bem-Estar',
        description: 'Caixa surpresa com produtos de saúde e bem-estar',
        journey: 'cross-journey',
        icon: 'gift',
        xpCost: 1200,
        isActive: true,
      },
      {
        name: 'personal-coach',
        title: 'Coach Pessoal',
        description: 'Sessão com coach de saúde e bem-estar',
        journey: 'cross-journey',
        icon: 'account-tie',
        xpCost: 2000,
        isActive: true,
      },
    ];
    
    // Combine all rewards
    const allRewards = [
      ...healthRewards,
      ...careRewards,
      ...planRewards,
      ...crossJourneyRewards,
    ];
    
    // Create all rewards in the database
    for (const reward of allRewards) {
      await withRetry(async () => {
        await tx.reward.upsert({
          where: { name: reward.name },
          update: reward,
          create: reward,
        });
      });
    }
    
    logger.log(`Created ${allRewards.length} rewards`);
  } catch (error) {
    logger.error(`Error seeding rewards: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds rules for event processing.
 * 
 * @param tx - The Prisma transaction client
 */
async function seedRules(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>): Promise<void> {
  try {
    // Define rules for different event types
    const rules = [
      // Health journey rules
      {
        name: 'health-metric-recorded',
        eventType: 'health.metric.recorded',
        condition: 'true', // Always trigger for this event
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 5,
            description: 'Registrou uma métrica de saúde',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: [
              'health-check-streak-1',
              'health-check-streak-2',
              'health-check-streak-3',
            ],
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['daily-steps-quest', 'weight-tracking-quest', 'sleep-improvement-quest'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'health-goal-achieved',
        eventType: 'health.goal.achieved',
        condition: 'event.payload.goalType === "steps"',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 10,
            description: 'Atingiu meta de passos',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: ['steps-goal-1', 'steps-goal-2', 'steps-goal-3'],
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['daily-steps-quest'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'health-device-connected',
        eventType: 'health.device.connected',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 20,
            description: 'Conectou um dispositivo de saúde',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: ['device-connected'],
          },
        ]),
        isActive: true,
      },
      
      // Care journey rules
      {
        name: 'care-appointment-completed',
        eventType: 'care.appointment.completed',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 15,
            description: 'Compareceu a uma consulta',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: [
              'appointment-keeper-1',
              'appointment-keeper-2',
              'appointment-keeper-3',
            ],
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['preventive-checkup-quest', 'wellness-warrior-quest'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'care-medication-taken',
        eventType: 'care.medication.taken',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 5,
            description: 'Tomou medicação conforme prescrito',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: [
              'medication-adherence-1',
              'medication-adherence-2',
              'medication-adherence-3',
            ],
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['medication-adherence-quest'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'care-telemedicine-completed',
        eventType: 'care.telemedicine.completed',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 25,
            description: 'Realizou consulta por telemedicina',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: ['telemedicine-pioneer'],
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['telemedicine-quest'],
          },
        ]),
        isActive: true,
      },
      
      // Plan journey rules
      {
        name: 'plan-claim-submitted',
        eventType: 'plan.claim.submitted',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 15,
            description: 'Submeteu solicitação de reembolso',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: ['claim-master-1', 'claim-master-2', 'claim-master-3'],
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['claim-submission-quest'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'plan-benefit-used',
        eventType: 'plan.benefit.used',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 10,
            description: 'Utilizou um benefício do plano',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: ['benefit-explorer-1', 'benefit-explorer-2'],
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['benefit-usage-quest', 'wellness-warrior-quest'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'plan-document-uploaded',
        eventType: 'plan.document.uploaded',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 5,
            description: 'Fez upload de documento de seguro',
          },
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: ['document-organizer'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'plan-card-activated',
        eventType: 'plan.card.activated',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 20,
            description: 'Ativou cartão de seguro digital',
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['digital-insurance-card-quest'],
          },
        ]),
        isActive: true,
      },
      
      // Cross-journey rules
      {
        name: 'profile-completed',
        eventType: 'profile.completed',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 10,
            description: 'Completou perfil',
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['complete-profile-quest'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'achievement-unlocked',
        eventType: 'achievement.unlocked',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'CHECK_ACHIEVEMENTS',
            achievements: ['journey-explorer', 'health-enthusiast', 'care-advocate', 'plan-optimizer'],
          },
        ]),
        isActive: true,
      },
      {
        name: 'health-activity-completed',
        eventType: 'health.activity.completed',
        condition: 'true',
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 15,
            description: 'Completou atividade de saúde',
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            quests: ['wellness-warrior-quest'],
          },
        ]),
        isActive: true,
      },
    ];
    
    // Create all rules in the database
    for (const rule of rules) {
      await withRetry(async () => {
        await tx.rule.upsert({
          where: { name: rule.name },
          update: rule,
          create: rule,
        });
      });
    }
    
    logger.log(`Created ${rules.length} rules`);
  } catch (error) {
    logger.error(`Error seeding rules: ${error.message}`, error.stack);
    throw error;
  }
}

// Run the seed function
seed()
  .catch(e => {
    logger.error('Failed to seed database', e);
    process.exit(1);
  });