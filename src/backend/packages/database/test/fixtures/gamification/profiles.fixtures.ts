/**
 * Test fixtures for gamification profiles.
 * 
 * This file provides mock user profiles for testing the gamification profile system.
 * It contains sample profile data with achievements, points, levels, and journey-specific progress.
 * These fixtures are essential for testing profile updates, point calculations, and level progression
 * in the gamification engine.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Interface representing a user's journey-specific progress
 */
export interface JourneyProgress {
  journey: 'health' | 'care' | 'plan';
  completedActions: number;
  totalActions: number;
  achievements: number;
  totalAchievements: number;
}

/**
 * Interface representing a mock gamification profile for testing
 */
export interface MockGamificationProfile {
  id: string;
  userId: string;
  level: number;
  xp: number;
  totalXp: number;
  xpToNextLevel: number;
  achievements: {
    id: string;
    name: string;
    title: string;
    description: string;
    journey: 'health' | 'care' | 'plan' | 'cross-journey';
    icon: string;
    level: number;
    maxLevel: number;
    unlockedAt: Date | null;
    progress: number;
  }[];
  journeyProgress: JourneyProgress[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calculates XP required for the next level based on current level
 * Uses a progressive scaling formula: 100 * (level ^ 1.5)
 */
const calculateXpForNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

/**
 * Calculates total XP accumulated to reach a specific level
 */
const calculateTotalXpForLevel = (level: number): number => {
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += calculateXpForNextLevel(i);
  }
  return totalXp;
};

/**
 * Creates a new mock achievement
 */
const createMockAchievement = (
  name: string,
  title: string,
  description: string,
  journey: 'health' | 'care' | 'plan' | 'cross-journey',
  icon: string,
  level: number = 1,
  maxLevel: number = 3,
  progress: number = 0,
  unlocked: boolean = false
) => ({
  id: uuidv4(),
  name,
  title,
  description,
  journey,
  icon,
  level,
  maxLevel,
  unlockedAt: unlocked ? new Date() : null,
  progress,
});

/**
 * Creates journey progress data
 */
const createJourneyProgress = (
  journey: 'health' | 'care' | 'plan',
  completedActions: number,
  totalActions: number,
  achievements: number,
  totalAchievements: number
): JourneyProgress => ({
  journey,
  completedActions,
  totalActions,
  achievements,
  totalAchievements,
});

/**
 * New user profile with minimal progress
 * - Level 1 with minimal XP
 * - No unlocked achievements
 * - Minimal journey progress
 */
export const newUserProfile: MockGamificationProfile = {
  id: uuidv4(),
  userId: 'new-user-123',
  level: 1,
  xp: 25,
  totalXp: 25,
  xpToNextLevel: calculateXpForNextLevel(1),
  achievements: [
    createMockAchievement(
      'health-check-streak',
      'Monitor de Saúde',
      'Registre suas métricas de saúde por dias consecutivos',
      'health',
      'heart-pulse',
      1,
      3,
      10
    ),
    createMockAchievement(
      'steps-goal',
      'Caminhante Dedicado',
      'Atinja sua meta diária de passos',
      'health',
      'footprints',
      1,
      3,
      5
    ),
    createMockAchievement(
      'appointment-keeper',
      'Compromisso com a Saúde',
      'Compareça às consultas agendadas',
      'care',
      'calendar-check',
      1,
      3,
      0
    ),
  ],
  journeyProgress: [
    createJourneyProgress('health', 2, 10, 0, 5),
    createJourneyProgress('care', 0, 8, 0, 5),
    createJourneyProgress('plan', 0, 6, 0, 5),
  ],
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  updatedAt: new Date(),
};

/**
 * Mid-level user profile with moderate progress
 * - Level 3 with some XP towards level 4
 * - Several unlocked achievements
 * - Balanced progress across journeys
 */
export const midLevelUserProfile: MockGamificationProfile = {
  id: uuidv4(),
  userId: 'mid-level-user-456',
  level: 3,
  xp: 150,
  totalXp: calculateTotalXpForLevel(3) + 150,
  xpToNextLevel: calculateXpForNextLevel(3),
  achievements: [
    createMockAchievement(
      'health-check-streak',
      'Monitor de Saúde',
      'Registre suas métricas de saúde por dias consecutivos',
      'health',
      'heart-pulse',
      2,
      3,
      100,
      true
    ),
    createMockAchievement(
      'steps-goal',
      'Caminhante Dedicado',
      'Atinja sua meta diária de passos',
      'health',
      'footprints',
      1,
      3,
      100,
      true
    ),
    createMockAchievement(
      'appointment-keeper',
      'Compromisso com a Saúde',
      'Compareça às consultas agendadas',
      'care',
      'calendar-check',
      1,
      3,
      100,
      true
    ),
    createMockAchievement(
      'medication-adherence',
      'Aderência ao Tratamento',
      'Tome seus medicamentos conforme prescrito',
      'care',
      'pill',
      1,
      3,
      50
    ),
    createMockAchievement(
      'claim-master',
      'Mestre em Reembolsos',
      'Submeta solicitações de reembolso completas',
      'plan',
      'receipt',
      1,
      3,
      75
    ),
  ],
  journeyProgress: [
    createJourneyProgress('health', 6, 10, 2, 5),
    createJourneyProgress('care', 4, 8, 1, 5),
    createJourneyProgress('plan', 2, 6, 0, 5),
  ],
  createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
  updatedAt: new Date(),
};

/**
 * Advanced user profile with significant progress
 * - High level with substantial XP
 * - Many unlocked achievements across all journeys
 * - Significant progress in all areas
 */
export const advancedUserProfile: MockGamificationProfile = {
  id: uuidv4(),
  userId: 'advanced-user-789',
  level: 8,
  xp: 450,
  totalXp: calculateTotalXpForLevel(8) + 450,
  xpToNextLevel: calculateXpForNextLevel(8),
  achievements: [
    createMockAchievement(
      'health-check-streak',
      'Monitor de Saúde',
      'Registre suas métricas de saúde por dias consecutivos',
      'health',
      'heart-pulse',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'steps-goal',
      'Caminhante Dedicado',
      'Atinja sua meta diária de passos',
      'health',
      'footprints',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'appointment-keeper',
      'Compromisso com a Saúde',
      'Compareça às consultas agendadas',
      'care',
      'calendar-check',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'medication-adherence',
      'Aderência ao Tratamento',
      'Tome seus medicamentos conforme prescrito',
      'care',
      'pill',
      2,
      3,
      100,
      true
    ),
    createMockAchievement(
      'claim-master',
      'Mestre em Reembolsos',
      'Submeta solicitações de reembolso completas',
      'plan',
      'receipt',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'cross-journey-master',
      'Mestre das Jornadas',
      'Complete ações em todas as jornadas',
      'cross-journey',
      'star',
      2,
      3,
      75,
      true
    ),
  ],
  journeyProgress: [
    createJourneyProgress('health', 10, 10, 5, 5),
    createJourneyProgress('care', 7, 8, 4, 5),
    createJourneyProgress('plan', 6, 6, 5, 5),
  ],
  createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
  updatedAt: new Date(),
};

/**
 * Health-focused user profile
 * - Significant progress in health journey
 * - Limited progress in other journeys
 */
export const healthFocusedUserProfile: MockGamificationProfile = {
  id: uuidv4(),
  userId: 'health-focused-user-101',
  level: 5,
  xp: 200,
  totalXp: calculateTotalXpForLevel(5) + 200,
  xpToNextLevel: calculateXpForNextLevel(5),
  achievements: [
    createMockAchievement(
      'health-check-streak',
      'Monitor de Saúde',
      'Registre suas métricas de saúde por dias consecutivos',
      'health',
      'heart-pulse',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'steps-goal',
      'Caminhante Dedicado',
      'Atinja sua meta diária de passos',
      'health',
      'footprints',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'health-goals-achiever',
      'Conquistador de Metas',
      'Atinja suas metas de saúde',
      'health',
      'target',
      2,
      3,
      80,
      true
    ),
    createMockAchievement(
      'appointment-keeper',
      'Compromisso com a Saúde',
      'Compareça às consultas agendadas',
      'care',
      'calendar-check',
      1,
      3,
      50
    ),
    createMockAchievement(
      'claim-master',
      'Mestre em Reembolsos',
      'Submeta solicitações de reembolso completas',
      'plan',
      'receipt',
      1,
      3,
      25
    ),
  ],
  journeyProgress: [
    createJourneyProgress('health', 10, 10, 5, 5),
    createJourneyProgress('care', 2, 8, 0, 5),
    createJourneyProgress('plan', 1, 6, 0, 5),
  ],
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
  updatedAt: new Date(),
};

/**
 * Care-focused user profile
 * - Significant progress in care journey
 * - Limited progress in other journeys
 */
export const careFocusedUserProfile: MockGamificationProfile = {
  id: uuidv4(),
  userId: 'care-focused-user-102',
  level: 5,
  xp: 220,
  totalXp: calculateTotalXpForLevel(5) + 220,
  xpToNextLevel: calculateXpForNextLevel(5),
  achievements: [
    createMockAchievement(
      'health-check-streak',
      'Monitor de Saúde',
      'Registre suas métricas de saúde por dias consecutivos',
      'health',
      'heart-pulse',
      1,
      3,
      40
    ),
    createMockAchievement(
      'appointment-keeper',
      'Compromisso com a Saúde',
      'Compareça às consultas agendadas',
      'care',
      'calendar-check',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'medication-adherence',
      'Aderência ao Tratamento',
      'Tome seus medicamentos conforme prescrito',
      'care',
      'pill',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'telemedicine-user',
      'Usuário de Telemedicina',
      'Realize consultas por telemedicina',
      'care',
      'video',
      2,
      3,
      75,
      true
    ),
    createMockAchievement(
      'claim-master',
      'Mestre em Reembolsos',
      'Submeta solicitações de reembolso completas',
      'plan',
      'receipt',
      1,
      3,
      30
    ),
  ],
  journeyProgress: [
    createJourneyProgress('health', 3, 10, 0, 5),
    createJourneyProgress('care', 8, 8, 5, 5),
    createJourneyProgress('plan', 1, 6, 0, 5),
  ],
  createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000), // 85 days ago
  updatedAt: new Date(),
};

/**
 * Plan-focused user profile
 * - Significant progress in plan journey
 * - Limited progress in other journeys
 */
export const planFocusedUserProfile: MockGamificationProfile = {
  id: uuidv4(),
  userId: 'plan-focused-user-103',
  level: 5,
  xp: 180,
  totalXp: calculateTotalXpForLevel(5) + 180,
  xpToNextLevel: calculateXpForNextLevel(5),
  achievements: [
    createMockAchievement(
      'health-check-streak',
      'Monitor de Saúde',
      'Registre suas métricas de saúde por dias consecutivos',
      'health',
      'heart-pulse',
      1,
      3,
      30
    ),
    createMockAchievement(
      'appointment-keeper',
      'Compromisso com a Saúde',
      'Compareça às consultas agendadas',
      'care',
      'calendar-check',
      1,
      3,
      25
    ),
    createMockAchievement(
      'claim-master',
      'Mestre em Reembolsos',
      'Submeta solicitações de reembolso completas',
      'plan',
      'receipt',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'benefit-explorer',
      'Explorador de Benefícios',
      'Explore todos os benefícios do seu plano',
      'plan',
      'gift',
      3,
      3,
      100,
      true
    ),
    createMockAchievement(
      'document-organizer',
      'Organizador de Documentos',
      'Mantenha seus documentos organizados',
      'plan',
      'folder',
      2,
      3,
      80,
      true
    ),
  ],
  journeyProgress: [
    createJourneyProgress('health', 2, 10, 0, 5),
    createJourneyProgress('care', 1, 8, 0, 5),
    createJourneyProgress('plan', 6, 6, 5, 5),
  ],
  createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95 days ago
  updatedAt: new Date(),
};

/**
 * Level-up edge case profile
 * - User with XP exactly at the threshold for level-up
 * - Used for testing level progression logic
 */
export const levelUpEdgeCaseProfile: MockGamificationProfile = {
  id: uuidv4(),
  userId: 'level-up-edge-case-104',
  level: 2,
  xp: calculateXpForNextLevel(2), // Exactly at the threshold for level 3
  totalXp: calculateTotalXpForLevel(2) + calculateXpForNextLevel(2),
  xpToNextLevel: calculateXpForNextLevel(2),
  achievements: [
    createMockAchievement(
      'health-check-streak',
      'Monitor de Saúde',
      'Registre suas métricas de saúde por dias consecutivos',
      'health',
      'heart-pulse',
      1,
      3,
      100,
      true
    ),
    createMockAchievement(
      'steps-goal',
      'Caminhante Dedicado',
      'Atinja sua meta diária de passos',
      'health',
      'footprints',
      1,
      3,
      100,
      true
    ),
  ],
  journeyProgress: [
    createJourneyProgress('health', 5, 10, 2, 5),
    createJourneyProgress('care', 2, 8, 0, 5),
    createJourneyProgress('plan', 1, 6, 0, 5),
  ],
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  updatedAt: new Date(),
};

/**
 * Cross-journey achievement profile
 * - User with balanced progress across all journeys
 * - Has unlocked cross-journey achievements
 */
export const crossJourneyAchievementProfile: MockGamificationProfile = {
  id: uuidv4(),
  userId: 'cross-journey-user-105',
  level: 6,
  xp: 300,
  totalXp: calculateTotalXpForLevel(6) + 300,
  xpToNextLevel: calculateXpForNextLevel(6),
  achievements: [
    createMockAchievement(
      'health-check-streak',
      'Monitor de Saúde',
      'Registre suas métricas de saúde por dias consecutivos',
      'health',
      'heart-pulse',
      2,
      3,
      100,
      true
    ),
    createMockAchievement(
      'appointment-keeper',
      'Compromisso com a Saúde',
      'Compareça às consultas agendadas',
      'care',
      'calendar-check',
      2,
      3,
      100,
      true
    ),
    createMockAchievement(
      'claim-master',
      'Mestre em Reembolsos',
      'Submeta solicitações de reembolso completas',
      'plan',
      'receipt',
      2,
      3,
      100,
      true
    ),
    createMockAchievement(
      'cross-journey-master',
      'Mestre das Jornadas',
      'Complete ações em todas as jornadas',
      'cross-journey',
      'star',
      2,
      3,
      100,
      true
    ),
    createMockAchievement(
      'wellness-champion',
      'Campeão de Bem-estar',
      'Mantenha hábitos saudáveis em todas as jornadas',
      'cross-journey',
      'award',
      1,
      3,
      60,
      true
    ),
  ],
  journeyProgress: [
    createJourneyProgress('health', 7, 10, 3, 5),
    createJourneyProgress('care', 6, 8, 3, 5),
    createJourneyProgress('plan', 4, 6, 3, 5),
  ],
  createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
  updatedAt: new Date(),
};

/**
 * Leaderboard test profiles
 * - Collection of profiles with varying XP for leaderboard testing
 */
export const leaderboardTestProfiles: MockGamificationProfile[] = [
  {
    id: uuidv4(),
    userId: 'leaderboard-user-1',
    level: 10,
    xp: 500,
    totalXp: calculateTotalXpForLevel(10) + 500,
    xpToNextLevel: calculateXpForNextLevel(10),
    achievements: [
      createMockAchievement(
        'cross-journey-master',
        'Mestre das Jornadas',
        'Complete ações em todas as jornadas',
        'cross-journey',
        'star',
        3,
        3,
        100,
        true
      ),
    ],
    journeyProgress: [
      createJourneyProgress('health', 10, 10, 5, 5),
      createJourneyProgress('care', 8, 8, 5, 5),
      createJourneyProgress('plan', 6, 6, 5, 5),
    ],
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    userId: 'leaderboard-user-2',
    level: 9,
    xp: 800,
    totalXp: calculateTotalXpForLevel(9) + 800,
    xpToNextLevel: calculateXpForNextLevel(9),
    achievements: [
      createMockAchievement(
        'cross-journey-master',
        'Mestre das Jornadas',
        'Complete ações em todas as jornadas',
        'cross-journey',
        'star',
        3,
        3,
        100,
        true
      ),
    ],
    journeyProgress: [
      createJourneyProgress('health', 9, 10, 5, 5),
      createJourneyProgress('care', 7, 8, 4, 5),
      createJourneyProgress('plan', 5, 6, 4, 5),
    ],
    createdAt: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    userId: 'leaderboard-user-3',
    level: 8,
    xp: 900,
    totalXp: calculateTotalXpForLevel(8) + 900,
    xpToNextLevel: calculateXpForNextLevel(8),
    achievements: [
      createMockAchievement(
        'cross-journey-master',
        'Mestre das Jornadas',
        'Complete ações em todas as jornadas',
        'cross-journey',
        'star',
        2,
        3,
        100,
        true
      ),
    ],
    journeyProgress: [
      createJourneyProgress('health', 8, 10, 4, 5),
      createJourneyProgress('care', 6, 8, 3, 5),
      createJourneyProgress('plan', 4, 6, 3, 5),
    ],
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    userId: 'leaderboard-user-4',
    level: 7,
    xp: 700,
    totalXp: calculateTotalXpForLevel(7) + 700,
    xpToNextLevel: calculateXpForNextLevel(7),
    achievements: [
      createMockAchievement(
        'cross-journey-master',
        'Mestre das Jornadas',
        'Complete ações em todas as jornadas',
        'cross-journey',
        'star',
        2,
        3,
        80,
        true
      ),
    ],
    journeyProgress: [
      createJourneyProgress('health', 7, 10, 3, 5),
      createJourneyProgress('care', 5, 8, 3, 5),
      createJourneyProgress('plan', 3, 6, 2, 5),
    ],
    createdAt: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    userId: 'leaderboard-user-5',
    level: 6,
    xp: 600,
    totalXp: calculateTotalXpForLevel(6) + 600,
    xpToNextLevel: calculateXpForNextLevel(6),
    achievements: [
      createMockAchievement(
        'cross-journey-master',
        'Mestre das Jornadas',
        'Complete ações em todas as jornadas',
        'cross-journey',
        'star',
        1,
        3,
        100,
        true
      ),
    ],
    journeyProgress: [
      createJourneyProgress('health', 6, 10, 3, 5),
      createJourneyProgress('care', 4, 8, 2, 5),
      createJourneyProgress('plan', 3, 6, 2, 5),
    ],
    createdAt: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

/**
 * Collection of all mock profiles for easy export
 */
export const mockProfiles = {
  newUserProfile,
  midLevelUserProfile,
  advancedUserProfile,
  healthFocusedUserProfile,
  careFocusedUserProfile,
  planFocusedUserProfile,
  levelUpEdgeCaseProfile,
  crossJourneyAchievementProfile,
  leaderboardTestProfiles,
};

/**
 * Helper function to convert mock profiles to database entities
 * for use with Prisma or TypeORM
 */
export const convertToDbEntities = (profile: MockGamificationProfile) => {
  // This function would convert the mock profile to the format expected by the database
  // Implementation would depend on the specific database schema
  return {
    id: profile.id,
    userId: profile.userId,
    level: profile.level,
    xp: profile.xp,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    // Achievements would be handled separately in a real implementation
  };
};

/**
 * Helper function to convert mock profiles to Redis sorted set entries
 * for leaderboard functionality
 */
export const convertToLeaderboardEntries = (profiles: MockGamificationProfile[]) => {
  return profiles.map(profile => ({
    member: profile.userId,
    score: profile.totalXp,
  }));
};

export default mockProfiles;