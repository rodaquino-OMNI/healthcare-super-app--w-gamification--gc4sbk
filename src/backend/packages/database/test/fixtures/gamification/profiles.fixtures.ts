/**
 * @file Provides mock user profiles for testing the gamification profile system.
 * Contains sample profile data with achievements, points, levels, and journey-specific progress.
 * This file is essential for testing profile updates, point calculations, and level progression
 * in the gamification engine.
 */

import { v4 as uuidv4 } from 'uuid';
import { IGameProfile, IProfileStreak, IUserMetrics, IProfileSettings, IProfileBadge } from '@austa/interfaces/gamification';
import { JourneyType } from '@austa/interfaces';

/**
 * Generates a streak object with specified values
 * @param current Current streak count
 * @param highest Highest streak ever achieved
 * @param active Whether the streak is currently active
 * @returns A profile streak object
 */
export const createStreak = (
  current: number,
  highest: number,
  active: boolean = true
): IProfileStreak => {
  const lastActivityDate = active 
    ? new Date().toISOString() 
    : new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 2 days ago if inactive
  
  return {
    current,
    highest,
    lastActivityDate,
    active,
    metadata: {}
  };
};

/**
 * Generates journey-specific metrics for a user profile
 * @param health Health journey metrics
 * @param care Care journey metrics
 * @param plan Plan journey metrics
 * @returns User metrics object with journey-specific data
 */
export const createUserMetrics = (
  health?: { xpEarned: number; achievements: number; quests: number },
  care?: { xpEarned: number; achievements: number; quests: number },
  plan?: { xpEarned: number; achievements: number; quests: number }
): IUserMetrics => {
  // Calculate totals from journey-specific metrics
  const totalAchievements = (
    (health?.achievements || 0) +
    (care?.achievements || 0) +
    (plan?.achievements || 0)
  );
  
  const totalQuests = (
    (health?.quests || 0) +
    (care?.quests || 0) +
    (plan?.quests || 0)
  );
  
  const totalXpEarned = (
    (health?.xpEarned || 0) +
    (care?.xpEarned || 0) +
    (plan?.xpEarned || 0)
  );
  
  // Create a date 30 days ago for first activity
  const firstActivityDate = new Date();
  firstActivityDate.setDate(firstActivityDate.getDate() - 30);
  
  // Create a date for last activity (today or yesterday)
  const lastActivityDate = new Date();
  if (Math.random() > 0.7) {
    lastActivityDate.setDate(lastActivityDate.getDate() - 1);
  }
  
  return {
    totalAchievements,
    totalQuests,
    totalRewards: Math.floor(totalAchievements / 3), // Approximately 1 reward per 3 achievements
    totalXpEarned,
    currentStreak: 3,
    highestStreak: 10,
    firstActivityDate: firstActivityDate.toISOString(),
    lastActivityDate: lastActivityDate.toISOString(),
    journeyMetrics: {
      health,
      care,
      plan
    }
  };
};

/**
 * Generates profile settings with specified values or defaults
 * @param options Optional settings to override defaults
 * @returns Profile settings object
 */
export const createProfileSettings = (
  options?: Partial<IProfileSettings>
): IProfileSettings => {
  return {
    leaderboardVisible: true,
    achievementNotifications: true,
    levelUpNotifications: true,
    questNotifications: true,
    rewardNotifications: true,
    preferredTheme: undefined,
    preferences: {},
    ...options
  };
};

/**
 * Creates a badge for a user profile
 * @param name Badge name
 * @param description Badge description
 * @param journey Associated journey
 * @param featured Whether the badge is featured
 * @returns Profile badge object
 */
export const createBadge = (
  name: string,
  description: string,
  journey: string,
  featured: boolean = false
): IProfileBadge => {
  // Create a date between 1-30 days ago
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  const awardedAt = new Date();
  awardedAt.setDate(awardedAt.getDate() - daysAgo);
  
  return {
    id: uuidv4(),
    name,
    description,
    icon: `${journey.toLowerCase()}-badge`,
    awardedAt: awardedAt.toISOString(),
    featured,
    journey
  };
};

/**
 * Calculates the XP required to reach the next level
 * Uses the same formula as in the GameProfile entity
 * @param level Current level
 * @returns XP required for next level
 */
export const getNextLevelXp = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

/**
 * Creates a complete game profile with specified properties
 * @param userId User ID
 * @param level User level
 * @param xp Current XP
 * @param options Additional options to customize the profile
 * @returns A complete game profile object
 */
export const createGameProfile = (
  userId: string,
  level: number = 1,
  xp: number = 0,
  options?: {
    achievements?: any[];
    quests?: any[];
    rewards?: any[];
    streak?: IProfileStreak;
    badges?: IProfileBadge[];
    settings?: IProfileSettings;
    metrics?: IUserMetrics;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }
): IGameProfile => {
  const now = new Date();
  const createdAt = options?.createdAt || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago by default
  
  return {
    id: uuidv4(),
    userId,
    level,
    xp,
    achievements: options?.achievements || [],
    quests: options?.quests || [],
    rewards: options?.rewards || [],
    streak: options?.streak,
    badges: options?.badges,
    settings: options?.settings,
    metrics: options?.metrics,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
    updatedAt: options?.updatedAt instanceof Date 
      ? (options.updatedAt as Date).toISOString() 
      : (options?.updatedAt || now.toISOString())
  };
};

/**
 * A new user with no progress
 */
export const newUserProfile = createGameProfile(
  'new-user-id',
  1,
  0,
  {
    streak: createStreak(0, 0, false),
    settings: createProfileSettings(),
    metrics: createUserMetrics(
      { xpEarned: 0, achievements: 0, quests: 0 },
      { xpEarned: 0, achievements: 0, quests: 0 },
      { xpEarned: 0, achievements: 0, quests: 0 }
    )
  }
);

/**
 * A beginner user with some initial progress
 */
export const beginnerUserProfile = createGameProfile(
  'beginner-user-id',
  2,
  150,
  {
    streak: createStreak(3, 3, true),
    badges: [
      createBadge('Iniciante', 'Completou o tutorial', 'global', true)
    ],
    settings: createProfileSettings(),
    metrics: createUserMetrics(
      { xpEarned: 100, achievements: 1, quests: 0 },
      { xpEarned: 50, achievements: 0, quests: 0 },
      { xpEarned: 0, achievements: 0, quests: 0 }
    )
  }
);

/**
 * An intermediate user with balanced progress across journeys
 */
export const intermediateUserProfile = createGameProfile(
  'intermediate-user-id',
  5,
  1200,
  {
    streak: createStreak(7, 12, true),
    badges: [
      createBadge('Consistente', 'Manteve uma sequência de 7 dias', 'global', true),
      createBadge('Explorador de Saúde', 'Registrou 5 métricas diferentes', JourneyType.HEALTH, false),
      createBadge('Cuidador', 'Compareceu a 3 consultas', JourneyType.CARE, true)
    ],
    settings: createProfileSettings({
      preferredTheme: JourneyType.HEALTH
    }),
    metrics: createUserMetrics(
      { xpEarned: 500, achievements: 3, quests: 1 },
      { xpEarned: 400, achievements: 2, quests: 1 },
      { xpEarned: 300, achievements: 1, quests: 0 }
    )
  }
);

/**
 * An advanced user with high level and many achievements
 */
export const advancedUserProfile = createGameProfile(
  'advanced-user-id',
  10,
  5500,
  {
    streak: createStreak(15, 30, true),
    badges: [
      createBadge('Mestre da Saúde', 'Atingiu o nível 10', 'global', true),
      createBadge('Maratonista', 'Completou 100.000 passos em uma semana', JourneyType.HEALTH, true),
      createBadge('Especialista em Cuidados', 'Gerenciou medicamentos por 30 dias', JourneyType.CARE, true),
      createBadge('Planejador', 'Utilizou todos os benefícios do plano', JourneyType.PLAN, false)
    ],
    settings: createProfileSettings({
      preferredTheme: JourneyType.CARE
    }),
    metrics: createUserMetrics(
      { xpEarned: 2000, achievements: 8, quests: 3 },
      { xpEarned: 2000, achievements: 7, quests: 2 },
      { xpEarned: 1500, achievements: 5, quests: 2 }
    )
  }
);

/**
 * A user focused primarily on the health journey
 */
export const healthFocusedUserProfile = createGameProfile(
  'health-focused-user-id',
  7,
  2800,
  {
    streak: createStreak(20, 20, true),
    badges: [
      createBadge('Atleta', 'Atingiu todas as metas de passos por 20 dias', JourneyType.HEALTH, true),
      createBadge('Monitor de Saúde', 'Registrou métricas diariamente por 30 dias', JourneyType.HEALTH, true),
      createBadge('Conectado', 'Conectou 3 dispositivos de saúde', JourneyType.HEALTH, false)
    ],
    settings: createProfileSettings({
      preferredTheme: JourneyType.HEALTH
    }),
    metrics: createUserMetrics(
      { xpEarned: 2200, achievements: 10, quests: 4 },
      { xpEarned: 400, achievements: 1, quests: 0 },
      { xpEarned: 200, achievements: 1, quests: 0 }
    )
  }
);

/**
 * A user focused primarily on the care journey
 */
export const careFocusedUserProfile = createGameProfile(
  'care-focused-user-id',
  6,
  2500,
  {
    streak: createStreak(10, 15, true),
    badges: [
      createBadge('Paciente Exemplar', 'Compareceu a todas as consultas', JourneyType.CARE, true),
      createBadge('Aderente', 'Seguiu o tratamento corretamente por 30 dias', JourneyType.CARE, true),
      createBadge('Telemedicina', 'Realizou 5 consultas virtuais', JourneyType.CARE, false)
    ],
    settings: createProfileSettings({
      preferredTheme: JourneyType.CARE
    }),
    metrics: createUserMetrics(
      { xpEarned: 300, achievements: 1, quests: 0 },
      { xpEarned: 2000, achievements: 9, quests: 3 },
      { xpEarned: 200, achievements: 1, quests: 0 }
    )
  }
);

/**
 * A user focused primarily on the plan journey
 */
export const planFocusedUserProfile = createGameProfile(
  'plan-focused-user-id',
  6,
  2400,
  {
    streak: createStreak(5, 12, true),
    badges: [
      createBadge('Organizador', 'Digitalizou todos os documentos', JourneyType.PLAN, true),
      createBadge('Mestre em Reembolsos', 'Submeteu 10 solicitações completas', JourneyType.PLAN, true),
      createBadge('Conhecedor de Benefícios', 'Explorou todos os benefícios', JourneyType.PLAN, false)
    ],
    settings: createProfileSettings({
      preferredTheme: JourneyType.PLAN
    }),
    metrics: createUserMetrics(
      { xpEarned: 200, achievements: 1, quests: 0 },
      { xpEarned: 300, achievements: 1, quests: 0 },
      { xpEarned: 1900, achievements: 8, quests: 3 }
    )
  }
);

/**
 * A user with an inactive streak (for testing streak reset logic)
 */
export const inactiveStreakUserProfile = createGameProfile(
  'inactive-streak-user-id',
  4,
  900,
  {
    streak: createStreak(0, 8, false),
    settings: createProfileSettings(),
    metrics: createUserMetrics(
      { xpEarned: 400, achievements: 2, quests: 1 },
      { xpEarned: 300, achievements: 1, quests: 0 },
      { xpEarned: 200, achievements: 1, quests: 0 }
    )
  }
);

/**
 * A user about to level up (for testing level progression)
 */
export const aboutToLevelUpUserProfile = createGameProfile(
  'about-to-level-up-user-id',
  3,
  // Set XP to just below what's needed for level 4
  getNextLevelXp(3) - 10,
  {
    streak: createStreak(5, 5, true),
    settings: createProfileSettings(),
    metrics: createUserMetrics(
      { xpEarned: 300, achievements: 2, quests: 1 },
      { xpEarned: 200, achievements: 1, quests: 0 },
      { xpEarned: 100, achievements: 1, quests: 0 }
    )
  }
);

/**
 * A user who just leveled up (for testing post-level-up state)
 */
export const justLeveledUpUserProfile = createGameProfile(
  'just-leveled-up-user-id',
  4,
  // Set XP to just above what was needed for level 4
  getNextLevelXp(3) + 5,
  {
    streak: createStreak(6, 6, true),
    settings: createProfileSettings(),
    metrics: createUserMetrics(
      { xpEarned: 350, achievements: 2, quests: 1 },
      { xpEarned: 250, achievements: 1, quests: 0 },
      { xpEarned: 150, achievements: 1, quests: 0 }
    )
  }
);

/**
 * A collection of user profiles for leaderboard testing
 */
export const leaderboardUserProfiles = [
  createGameProfile('leaderboard-user-1', 12, 8000),
  createGameProfile('leaderboard-user-2', 10, 5500),
  createGameProfile('leaderboard-user-3', 8, 3800),
  createGameProfile('leaderboard-user-4', 7, 2900),
  createGameProfile('leaderboard-user-5', 6, 2200),
  createGameProfile('leaderboard-user-6', 5, 1500),
  createGameProfile('leaderboard-user-7', 4, 1000),
  createGameProfile('leaderboard-user-8', 3, 600),
  createGameProfile('leaderboard-user-9', 2, 300),
  createGameProfile('leaderboard-user-10', 1, 50),
];

/**
 * A collection of all profile fixtures for easy import
 */
export const profileFixtures = {
  newUserProfile,
  beginnerUserProfile,
  intermediateUserProfile,
  advancedUserProfile,
  healthFocusedUserProfile,
  careFocusedUserProfile,
  planFocusedUserProfile,
  inactiveStreakUserProfile,
  aboutToLevelUpUserProfile,
  justLeveledUpUserProfile,
  leaderboardUserProfiles
};

/**
 * Helper function to get a random profile from the fixtures
 * @returns A random game profile
 */
export const getRandomProfile = (): IGameProfile => {
  const profiles = [
    newUserProfile,
    beginnerUserProfile,
    intermediateUserProfile,
    advancedUserProfile,
    healthFocusedUserProfile,
    careFocusedUserProfile,
    planFocusedUserProfile,
    inactiveStreakUserProfile,
    aboutToLevelUpUserProfile,
    justLeveledUpUserProfile,
    ...leaderboardUserProfiles
  ];
  
  const randomIndex = Math.floor(Math.random() * profiles.length);
  return profiles[randomIndex];
};

export default profileFixtures;