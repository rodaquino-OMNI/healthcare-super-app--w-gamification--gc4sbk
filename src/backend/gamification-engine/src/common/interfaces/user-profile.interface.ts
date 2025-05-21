import { IUser } from '@austa/interfaces/auth';
import { IGameProfile, IUserBadge } from '@austa/interfaces/gamification';
import { JourneyType } from './journey.interface';
import { IVersioned } from './versioning.interface';

/**
 * Interface representing journey-specific health metrics for a user profile
 */
export interface IHealthJourneyMetrics {
  /**
   * Number of health goals completed
   */
  goalsCompleted: number;

  /**
   * Number of health metrics recorded
   */
  metricsRecorded: number;

  /**
   * Number of connected health devices
   */
  connectedDevices: number;

  /**
   * Streak of consecutive days with health activity
   */
  activityStreak: number;

  /**
   * Custom properties specific to the health journey
   */
  [key: string]: any;
}

/**
 * Interface representing journey-specific care metrics for a user profile
 */
export interface ICareJourneyMetrics {
  /**
   * Number of appointments scheduled
   */
  appointmentsScheduled: number;

  /**
   * Number of telemedicine sessions completed
   */
  telemedicineSessionsCompleted: number;

  /**
   * Medication adherence percentage (0-100)
   */
  medicationAdherence: number;

  /**
   * Number of symptom checks performed
   */
  symptomChecksPerformed: number;

  /**
   * Custom properties specific to the care journey
   */
  [key: string]: any;
}

/**
 * Interface representing journey-specific plan metrics for a user profile
 */
export interface IPlanJourneyMetrics {
  /**
   * Number of claims submitted
   */
  claimsSubmitted: number;

  /**
   * Number of benefits utilized
   */
  benefitsUtilized: number;

  /**
   * Number of plan comparisons made
   */
  planComparisons: number;

  /**
   * Number of documents uploaded
   */
  documentsUploaded: number;

  /**
   * Custom properties specific to the plan journey
   */
  [key: string]: any;
}

/**
 * Interface representing all journey-specific metrics for a user profile
 */
export interface IJourneyMetrics {
  /**
   * Health journey metrics
   */
  health: IHealthJourneyMetrics;

  /**
   * Care journey metrics
   */
  care: ICareJourneyMetrics;

  /**
   * Plan journey metrics
   */
  plan: IPlanJourneyMetrics;

  /**
   * Get metrics for a specific journey type
   * @param journeyType The journey type to get metrics for
   * @returns The journey-specific metrics
   */
  getJourneyMetrics(journeyType: JourneyType): IHealthJourneyMetrics | ICareJourneyMetrics | IPlanJourneyMetrics;
}

/**
 * Interface representing achievement progress for a user profile
 */
export interface IAchievementProgress {
  /**
   * ID of the achievement
   */
  achievementId: string;

  /**
   * Current progress value (e.g., 3 of 5 steps completed)
   */
  currentValue: number;

  /**
   * Target value required to complete the achievement
   */
  targetValue: number;

  /**
   * Whether the achievement has been completed
   */
  completed: boolean;

  /**
   * Timestamp when the achievement was completed (if applicable)
   */
  completedAt?: Date;

  /**
   * Journey type associated with this achievement
   */
  journeyType: JourneyType;
}

/**
 * Interface representing a user's notification preferences for gamification events
 */
export interface IGamificationNotificationPreferences {
  /**
   * Whether to receive notifications for achievement unlocks
   */
  achievementUnlocks: boolean;

  /**
   * Whether to receive notifications for level ups
   */
  levelUps: boolean;

  /**
   * Whether to receive notifications for quest completions
   */
  questCompletions: boolean;

  /**
   * Whether to receive notifications for reward availability
   */
  rewardAvailability: boolean;

  /**
   * Whether to receive notifications for leaderboard position changes
   */
  leaderboardUpdates: boolean;
}

/**
 * Comprehensive user profile interface for the gamification engine
 * Extends the base IGameProfile with additional properties for the gamification engine
 * Implements IVersioned for backward compatibility support
 */
export interface IUserProfile extends IGameProfile, IVersioned {
  /**
   * User information from the auth service
   */
  user: IUser;

  /**
   * Journey-specific metrics for this user
   */
  journeyMetrics: IJourneyMetrics;

  /**
   * Badges earned by the user
   */
  badges: IUserBadge[];

  /**
   * Achievement progress for the user
   */
  achievementProgress: IAchievementProgress[];

  /**
   * Notification preferences for gamification events
   */
  notificationPreferences: IGamificationNotificationPreferences;

  /**
   * Last active timestamp for the user
   */
  lastActive: Date;

  /**
   * Whether the user has completed onboarding for the gamification system
   */
  onboardingCompleted: boolean;

  /**
   * Get achievement progress for a specific journey
   * @param journeyType The journey type to filter by
   * @returns Array of achievement progress for the specified journey
   */
  getJourneyAchievements(journeyType: JourneyType): IAchievementProgress[];

  /**
   * Calculate the percentage progress to the next level
   * @returns Number between 0 and 1 representing progress percentage
   */
  getLevelProgress(): number;

  /**
   * Get the total number of completed achievements across all journeys
   * @returns The count of completed achievements
   */
  getCompletedAchievementsCount(): number;

  /**
   * Get the total number of completed achievements for a specific journey
   * @param journeyType The journey type to count achievements for
   * @returns The count of completed achievements for the specified journey
   */
  getJourneyCompletedAchievementsCount(journeyType: JourneyType): number;
}

/**
 * Interface for user profile updates
 * Contains partial properties that can be updated
 */
export interface IUserProfileUpdate extends Partial<Omit<IUserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version'>> {
  /**
   * Optional journey metrics update
   */
  journeyMetrics?: Partial<IJourneyMetrics>;

  /**
   * Optional notification preferences update
   */
  notificationPreferences?: Partial<IGamificationNotificationPreferences>;
}

/**
 * Factory function to create a default user profile
 * @param userId The ID of the user to create a profile for
 * @param user Optional user information
 * @returns A new user profile with default values
 */
export function createDefaultUserProfile(userId: string, user?: IUser): IUserProfile {
  return {
    id: '', // Will be generated by the database
    userId,
    user: user || { id: userId },
    level: 1,
    xp: 0,
    version: '1.0',
    journeyMetrics: {
      health: {
        goalsCompleted: 0,
        metricsRecorded: 0,
        connectedDevices: 0,
        activityStreak: 0
      },
      care: {
        appointmentsScheduled: 0,
        telemedicineSessionsCompleted: 0,
        medicationAdherence: 0,
        symptomChecksPerformed: 0
      },
      plan: {
        claimsSubmitted: 0,
        benefitsUtilized: 0,
        planComparisons: 0,
        documentsUploaded: 0
      },
      getJourneyMetrics(journeyType: JourneyType) {
        switch (journeyType) {
          case JourneyType.HEALTH:
            return this.health;
          case JourneyType.CARE:
            return this.care;
          case JourneyType.PLAN:
            return this.plan;
          default:
            throw new Error(`Unknown journey type: ${journeyType}`);
        }
      }
    },
    badges: [],
    achievementProgress: [],
    notificationPreferences: {
      achievementUnlocks: true,
      levelUps: true,
      questCompletions: true,
      rewardAvailability: true,
      leaderboardUpdates: true
    },
    lastActive: new Date(),
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    getJourneyAchievements(journeyType: JourneyType) {
      return this.achievementProgress.filter(progress => progress.journeyType === journeyType);
    },
    getLevelProgress() {
      const nextLevelXp = Math.floor(100 * Math.pow(this.level, 1.5));
      const currentLevelXp = Math.floor(100 * Math.pow(this.level - 1, 1.5));
      const levelRange = nextLevelXp - currentLevelXp;
      const userProgress = this.xp - currentLevelXp;
      return Math.min(Math.max(userProgress / levelRange, 0), 1);
    },
    getCompletedAchievementsCount() {
      return this.achievementProgress.filter(progress => progress.completed).length;
    },
    getJourneyCompletedAchievementsCount(journeyType: JourneyType) {
      return this.achievementProgress.filter(
        progress => progress.journeyType === journeyType && progress.completed
      ).length;
    }
  };
}