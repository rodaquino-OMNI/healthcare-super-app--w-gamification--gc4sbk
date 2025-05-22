/**
 * @file Gamification Seed Functions
 * 
 * Contains seed functions for the Gamification test data, including achievements,
 * rewards, quests, and leaderboards that span across all journeys.
 */

import { PrismaClient } from '@prisma/client';
import { TestSeedOptions, prefixTestData, getCountByVolume, handleSeedError } from './types';

/**
 * Seeds Gamification test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedGamificationData(
  prisma: PrismaClient, 
  options: TestSeedOptions
): Promise<void> {
  try {
    // Sample achievement types
    const achievementTypes = [
      { 
        name: prefixTestData('health-check-streak', options), 
        title: 'Monitor de Sau00fade', 
        description: 'Registre suas mu00e9tricas de sau00fade por dias consecutivos',
        journey: 'health',
        icon: 'heart-pulse',
        levels: 3
      },
      { 
        name: prefixTestData('steps-goal', options), 
        title: 'Caminhante Dedicado', 
        description: 'Atinja sua meta diu00e1ria de passos',
        journey: 'health',
        icon: 'footprints',
        levels: 3
      },
      { 
        name: prefixTestData('appointment-keeper', options), 
        title: 'Compromisso com a Sau00fade', 
        description: 'Compareu00e7a u00e0s consultas agendadas',
        journey: 'care',
        icon: 'calendar-check',
        levels: 3
      },
      { 
        name: prefixTestData('medication-adherence', options), 
        title: 'Aderu00eancia ao Tratamento', 
        description: 'Tome seus medicamentos conforme prescrito',
        journey: 'care',
        icon: 'pill',
        levels: 3
      },
      { 
        name: prefixTestData('claim-master', options), 
        title: 'Mestre em Reembolsos', 
        description: 'Submeta solicitau00e7u00f5es de reembolso completas',
        journey: 'plan',
        icon: 'receipt',
        levels: 3
      },
    ];
    
    for (const achievement of achievementTypes) {
      await prisma.achievementType.upsert({
        where: { name: achievement.name },
        update: {},
        create: achievement,
      });
    }
    
    // Create achievements and rewards based on volume
    if (options.dataVolume !== 'small') {
      await seedAchievementsData(prisma, options);
    }
    
    // Create quests based on volume
    if (options.dataVolume !== 'small') {
      await seedQuestsData(prisma, options);
    }
    
    // Create leaderboards based on volume
    if (options.dataVolume !== 'small') {
      await seedLeaderboardsData(prisma, options);
    }
    
    if (options.logging) {
      console.log(`Created gamification test data: ${achievementTypes.length} achievement types`);
    }
  } catch (error) {
    if (options.errorHandling === 'throw') {
      throw error;
    } else if (options.errorHandling === 'log') {
      console.error(`Error seeding gamification test data:`, error);
    }
  }
}

/**
 * Seeds achievements data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedAchievementsData(
  prisma: PrismaClient, 
  options: TestSeedOptions
): Promise<void> {
  // Implementation depends on data volume
  const achievementCount = getAchievementCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${achievementCount} user achievements...`);
  }
  
  // Get users and achievement types
  const users = await prisma.user.findMany();
  const achievementTypes = await prisma.achievementType.findMany();
  
  if (users.length === 0 || achievementTypes.length === 0) {
    return;
  }
  
  // Create user achievements
  for (const user of users) {
    // Assign a subset of achievements to each user
    const userAchievementCount = Math.min(
      achievementCount, 
      achievementTypes.length
    );
    
    // Shuffle achievement types to randomize selection
    const shuffledAchievements = [...achievementTypes]
      .sort(() => Math.random() - 0.5)
      .slice(0, userAchievementCount);
    
    for (const achievement of shuffledAchievements) {
      // Randomly assign a level (1-3)
      const level = Math.floor(Math.random() * 3) + 1;
      
      // Create the user achievement
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementTypeId: achievement.id,
          level,
          progress: level * 100, // 100% for each level
          achievedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date in last 30 days
        },
      });
    }
  }
  
  // Create rewards
  await seedRewardsData(prisma, options);
}

/**
 * Seeds rewards data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedRewardsData(
  prisma: PrismaClient, 
  options: TestSeedOptions
): Promise<void> {
  // Implementation depends on data volume
  const rewardCount = getRewardCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${rewardCount} rewards...`);
  }
  
  // Create reward types
  const rewardTypes = [
    { name: prefixTestData('discount', options), description: 'Discount on services', pointCost: 100 },
    { name: prefixTestData('gift_card', options), description: 'Gift card for partner stores', pointCost: 200 },
    { name: prefixTestData('premium_access', options), description: 'Premium access to features', pointCost: 300 },
    { name: prefixTestData('consultation', options), description: 'Free consultation', pointCost: 500 },
    { name: prefixTestData('exam', options), description: 'Free medical exam', pointCost: 800 },
  ];
  
  for (const rewardType of rewardTypes) {
    await prisma.rewardType.upsert({
      where: { name: rewardType.name },
      update: {},
      create: rewardType,
    });
  }
  
  // Get users and reward types from database
  const users = await prisma.user.findMany();
  const dbRewardTypes = await prisma.rewardType.findMany();
  
  if (users.length === 0 || dbRewardTypes.length === 0) {
    return;
  }
  
  // Create user rewards
  for (let i = 0; i < rewardCount; i++) {
    // Select a random user and reward type
    const user = users[Math.floor(Math.random() * users.length)];
    const rewardType = dbRewardTypes[Math.floor(Math.random() * dbRewardTypes.length)];
    
    // Create the user reward
    await prisma.userReward.create({
      data: {
        userId: user.id,
        rewardTypeId: rewardType.id,
        status: i % 3 === 0 ? 'REDEEMED' : 'AVAILABLE',
        code: `REWARD-${100000 + i}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        redeemedAt: i % 3 === 0 ? new Date() : null,
      },
    });
  }
}

/**
 * Seeds quests data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedQuestsData(
  prisma: PrismaClient, 
  options: TestSeedOptions
): Promise<void> {
  // Implementation depends on data volume
  const questCount = getQuestCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${questCount} quests...`);
  }
  
  // Sample quest types
  const questTypes = [
    { 
      name: prefixTestData('health-week', options), 
      title: 'Semana da Sau00fade', 
      description: 'Complete tarefas de sau00fade durante uma semana',
      journey: 'health',
      pointReward: 500,
      duration: 7 // days
    },
    { 
      name: prefixTestData('care-routine', options), 
      title: 'Rotina de Cuidados', 
      description: 'Mantenha sua rotina de cuidados em dia',
      journey: 'care',
      pointReward: 300,
      duration: 14 // days
    },
    { 
      name: prefixTestData('plan-explorer', options), 
      title: 'Explorador de Benefu00edcios', 
      description: 'Explore todos os benefu00edcios do seu plano',
      journey: 'plan',
      pointReward: 200,
      duration: 30 // days
    },
    { 
      name: prefixTestData('cross-journey', options), 
      title: 'Jornada Completa', 
      description: 'Complete atividades em todas as jornadas',
      journey: null, // cross-journey
      pointReward: 1000,
      duration: 30 // days
    },
  ];
  
  // Create quest types
  for (const questType of questTypes) {
    await prisma.questType.upsert({
      where: { name: questType.name },
      update: {},
      create: questType,
    });
  }
  
  // Get users and quest types
  const users = await prisma.user.findMany();
  const dbQuestTypes = await prisma.questType.findMany();
  
  if (users.length === 0 || dbQuestTypes.length === 0) {
    return;
  }
  
  // Create user quests
  for (const user of users) {
    // Assign a subset of quests to each user
    const userQuestCount = Math.min(questCount, dbQuestTypes.length);
    
    // Shuffle quest types to randomize selection
    const shuffledQuestTypes = [...dbQuestTypes]
      .sort(() => Math.random() - 0.5)
      .slice(0, userQuestCount);
    
    for (const questType of shuffledQuestTypes) {
      // Determine quest status and progress
      const isCompleted = Math.random() > 0.7; // 30% completed
      const progress = isCompleted ? 100 : Math.floor(Math.random() * 100);
      
      // Calculate dates
      const startDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)); // Random date in last 30 days
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + questType.duration);
      
      // Create the user quest
      await prisma.userQuest.create({
        data: {
          userId: user.id,
          questTypeId: questType.id,
          startDate,
          endDate,
          status: isCompleted ? 'COMPLETED' : (new Date() > endDate ? 'EXPIRED' : 'ACTIVE'),
          progress,
          completedAt: isCompleted ? new Date() : null,
          pointsAwarded: isCompleted ? questType.pointReward : 0,
        },
      });
    }
  }
}

/**
 * Seeds leaderboards data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedLeaderboardsData(
  prisma: PrismaClient, 
  options: TestSeedOptions
): Promise<void> {
  // Implementation depends on data volume
  const leaderboardCount = getLeaderboardCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${leaderboardCount} leaderboards...`);
  }
  
  // Sample leaderboard types
  const leaderboardTypes = [
    { 
      name: prefixTestData('weekly-points', options), 
      title: 'Pontos Semanais', 
      description: 'Classificau00e7u00e3o por pontos acumulados na semana',
      period: 'WEEKLY',
      metric: 'POINTS',
      journey: null // all journeys
    },
    { 
      name: prefixTestData('monthly-achievements', options), 
      title: 'Conquistas Mensais', 
      description: 'Classificau00e7u00e3o por conquistas obtidas no mu00eas',
      period: 'MONTHLY',
      metric: 'ACHIEVEMENTS',
      journey: null // all journeys
    },
    { 
      name: prefixTestData('health-streak', options), 
      title: 'Sequu00eancia de Sau00fade', 
      description: 'Classificau00e7u00e3o por dias consecutivos de registro de sau00fade',
      period: 'MONTHLY',
      metric: 'STREAK',
      journey: 'health'
    },
    { 
      name: prefixTestData('care-appointments', options), 
      title: 'Consultas Realizadas', 
      description: 'Classificau00e7u00e3o por consultas realizadas',
      period: 'QUARTERLY',
      metric: 'APPOINTMENTS',
      journey: 'care'
    },
  ];
  
  // Create leaderboard types
  for (const leaderboardType of leaderboardTypes) {
    await prisma.leaderboardType.upsert({
      where: { name: leaderboardType.name },
      update: {},
      create: leaderboardType,
    });
  }
  
  // Get users and leaderboard types
  const users = await prisma.user.findMany();
  const dbLeaderboardTypes = await prisma.leaderboardType.findMany();
  
  if (users.length === 0 || dbLeaderboardTypes.length === 0) {
    return;
  }
  
  // Create leaderboards
  for (let i = 0; i < leaderboardCount; i++) {
    // Select a leaderboard type
    const leaderboardType = dbLeaderboardTypes[i % dbLeaderboardTypes.length];
    
    // Create the leaderboard
    const leaderboard = await prisma.leaderboard.create({
      data: {
        typeId: leaderboardType.id,
        startDate: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 days ago
        endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
        status: 'ACTIVE',
      },
    });
    
    // Create leaderboard entries for users
    for (const user of users) {
      // Generate random score based on metric
      let score: number;
      switch (leaderboardType.metric) {
        case 'POINTS':
          score = Math.floor(Math.random() * 1000);
          break;
        case 'ACHIEVEMENTS':
          score = Math.floor(Math.random() * 10);
          break;
        case 'STREAK':
          score = Math.floor(Math.random() * 30);
          break;
        case 'APPOINTMENTS':
          score = Math.floor(Math.random() * 5);
          break;
        default:
          score = Math.floor(Math.random() * 100);
      }
      
      // Create the leaderboard entry
      await prisma.leaderboardEntry.create({
        data: {
          leaderboardId: leaderboard.id,
          userId: user.id,
          score,
          rank: 0, // Will be calculated later
          lastUpdated: new Date(),
        },
      });
    }
    
    // Update ranks based on scores
    const entries = await prisma.leaderboardEntry.findMany({
      where: { leaderboardId: leaderboard.id },
      orderBy: { score: 'desc' },
    });
    
    // Update ranks
    for (let j = 0; j < entries.length; j++) {
      await prisma.leaderboardEntry.update({
        where: { id: entries[j].id },
        data: { rank: j + 1 },
      });
    }
  }
}

/**
 * Gets the number of achievements to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of achievements to create
 */
function getAchievementCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 3, 5);
}

/**
 * Gets the number of rewards to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of rewards to create
 */
function getRewardCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 5, 20);
}

/**
 * Gets the number of quests to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of quests to create
 */
function getQuestCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 2, 4);
}

/**
 * Gets the number of leaderboards to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of leaderboards to create
 */
function getLeaderboardCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 2, 4);
}