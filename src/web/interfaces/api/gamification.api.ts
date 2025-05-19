/**
 * Gamification API Interfaces
 * 
 * This file defines the API interfaces for the gamification system in the AUSTA SuperApp.
 * It includes request/response types for achievements, quests, rewards, and game profiles,
 * enabling type-safe interaction with the gamification engine across all journeys.
 */

import { Achievement, GameProfile, Quest, Reward } from '../../../web/shared/types/gamification.types';
import { PaginationParams, SortParams, FilterParams } from './request.types';
import { PaginatedResponse, ApiResponse } from './response.types';

// Re-export base types for convenience
export { Achievement, GameProfile, Quest, Reward };

/**
 * Supported journey types for gamification events
 */
export enum GamificationJourney {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global'
}

/**
 * Supported event types for gamification tracking
 */
export enum GamificationEventType {
  // Health journey events
  HEALTH_METRIC_RECORDED = 'health_metric_recorded',
  HEALTH_GOAL_CREATED = 'health_goal_created',
  HEALTH_GOAL_ACHIEVED = 'health_goal_achieved',
  DEVICE_CONNECTED = 'device_connected',
  DAILY_STEPS_GOAL_MET = 'daily_steps_goal_met',
  HEALTH_INSIGHT_VIEWED = 'health_insight_viewed',
  
  // Care journey events
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_ATTENDED = 'appointment_attended',
  MEDICATION_TRACKED = 'medication_tracked',
  TELEMEDICINE_SESSION_COMPLETED = 'telemedicine_session_completed',
  CARE_PLAN_CREATED = 'care_plan_created',
  CARE_PLAN_STEP_COMPLETED = 'care_plan_step_completed',
  
  // Plan journey events
  CLAIM_SUBMITTED = 'claim_submitted',
  BENEFIT_USED = 'benefit_used',
  PLAN_SELECTED = 'plan_selected',
  DOCUMENT_UPLOADED = 'document_uploaded',
  
  // Global events
  PROFILE_COMPLETED = 'profile_completed',
  DAILY_LOGIN = 'daily_login',
  FEATURE_USED = 'feature_used',
  FEEDBACK_PROVIDED = 'feedback_provided'
}

/**
 * Base interface for all gamification event payloads
 */
export interface GamificationEventPayload {
  userId: string;
  timestamp: string;
  journey: GamificationJourney;
  metadata?: Record<string, any>;
}

/**
 * Health journey event payloads
 */
export interface HealthMetricRecordedPayload extends GamificationEventPayload {
  metricType: string;
  value: number;
  unit: string;
}

export interface HealthGoalCreatedPayload extends GamificationEventPayload {
  goalId: string;
  metricType: string;
  targetValue: number;
}

export interface HealthGoalAchievedPayload extends GamificationEventPayload {
  goalId: string;
  metricType: string;
  achievedValue: number;
}

export interface DeviceConnectedPayload extends GamificationEventPayload {
  deviceType: string;
  deviceId: string;
}

/**
 * Care journey event payloads
 */
export interface AppointmentBookedPayload extends GamificationEventPayload {
  appointmentId: string;
  providerId: string;
  specialtyType: string;
}

export interface MedicationTrackedPayload extends GamificationEventPayload {
  medicationId: string;
  adherenceStreak: number;
}

export interface TelemedicineSessionCompletedPayload extends GamificationEventPayload {
  sessionId: string;
  providerId: string;
  durationMinutes: number;
}

/**
 * Plan journey event payloads
 */
export interface ClaimSubmittedPayload extends GamificationEventPayload {
  claimId: string;
  claimType: string;
  claimAmount: number;
}

export interface BenefitUsedPayload extends GamificationEventPayload {
  benefitId: string;
  benefitType: string;
}

/**
 * Request to track a gamification event
 */
export interface TrackGamificationEventRequest {
  eventType: GamificationEventType;
  payload: GamificationEventPayload;
}

/**
 * Response from tracking a gamification event
 */
export interface TrackGamificationEventResponse {
  eventId: string;
  processed: boolean;
  unlockedAchievements?: Achievement[];
  completedQuests?: Quest[];
  earnedRewards?: Reward[];
  xpEarned?: number;
  levelUp?: boolean;
  newLevel?: number;
}

/**
 * Request to get user achievements
 */
export interface GetUserAchievementsRequest extends PaginationParams, SortParams, FilterParams {
  userId: string;
  journey?: GamificationJourney;
  unlocked?: boolean;
  inProgress?: boolean;
}

/**
 * Response containing user achievements
 */
export type GetUserAchievementsResponse = PaginatedResponse<Achievement>;

/**
 * Request to get user quests
 */
export interface GetUserQuestsRequest extends PaginationParams, SortParams, FilterParams {
  userId: string;
  journey?: GamificationJourney;
  completed?: boolean;
  active?: boolean;
  expiringSoon?: boolean;
}

/**
 * Response containing user quests
 */
export type GetUserQuestsResponse = PaginatedResponse<Quest>;

/**
 * Request to get user rewards
 */
export interface GetUserRewardsRequest extends PaginationParams, SortParams, FilterParams {
  userId: string;
  journey?: GamificationJourney;
  claimed?: boolean;
  available?: boolean;
  expiresAfter?: string;
  expiresBefore?: string;
}

/**
 * Response containing user rewards
 */
export type GetUserRewardsResponse = PaginatedResponse<Reward>;

/**
 * Request to claim a reward
 */
export interface ClaimRewardRequest {
  userId: string;
  rewardId: string;
}

/**
 * Response from claiming a reward
 */
export interface ClaimRewardResponse {
  success: boolean;
  reward: Reward;
  claimedAt: string;
  expiresAt?: string;
}

/**
 * Request to get a user's game profile
 */
export interface GetGameProfileRequest {
  userId: string;
  includeAchievements?: boolean;
  includeQuests?: boolean;
  includeRewards?: boolean;
}

/**
 * Response containing a user's game profile
 */
export interface GetGameProfileResponse extends ApiResponse {
  profile: GameProfile;
}

/**
 * Request to get leaderboard data
 */
export interface GetLeaderboardRequest extends PaginationParams {
  journey?: GamificationJourney;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'allTime';
  userId?: string; // To get the user's position in the leaderboard
  radius?: number; // Number of users to include above and below the specified user
}

/**
 * Leaderboard entry representing a user's position
 */
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  rank: number;
  score: number;
  level: number;
  isCurrentUser: boolean;
}

/**
 * Response containing leaderboard data
 */
export interface GetLeaderboardResponse extends ApiResponse {
  entries: LeaderboardEntry[];
  userRank?: number; // The rank of the requested user (if userId was provided)
  totalParticipants: number;
}

/**
 * Request to update a user's game profile
 */
export interface UpdateGameProfileRequest {
  userId: string;
  displayName?: string;
  avatarId?: string;
  preferences?: {
    notifyOnAchievements?: boolean;
    notifyOnLevelUp?: boolean;
    notifyOnQuestCompletion?: boolean;
    showOnLeaderboard?: boolean;
  };
}

/**
 * Response from updating a user's game profile
 */
export interface UpdateGameProfileResponse extends ApiResponse {
  profile: GameProfile;
}

/**
 * Request to get achievement details
 */
export interface GetAchievementDetailsRequest {
  achievementId: string;
  userId?: string; // Optional: to include user-specific progress
}

/**
 * Response containing achievement details
 */
export interface GetAchievementDetailsResponse extends ApiResponse {
  achievement: Achievement;
  userProgress?: {
    progress: number;
    total: number;
    unlocked: boolean;
    unlockedAt?: string;
  };
  globalStats?: {
    unlockPercentage: number; // Percentage of users who have unlocked this achievement
    averageTimeToUnlock: number; // Average time (in days) to unlock this achievement
  };
}

/**
 * Request to get quest details
 */
export interface GetQuestDetailsRequest {
  questId: string;
  userId?: string; // Optional: to include user-specific progress
}

/**
 * Response containing quest details
 */
export interface GetQuestDetailsResponse extends ApiResponse {
  quest: Quest;
  userProgress?: {
    progress: number;
    total: number;
    completed: boolean;
    completedAt?: string;
    expiresAt?: string;
  };
  globalStats?: {
    completionPercentage: number; // Percentage of users who have completed this quest
    averageTimeToComplete: number; // Average time (in days) to complete this quest
  };
}

/**
 * Request to get a user's XP history
 */
export interface GetXpHistoryRequest extends PaginationParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  journey?: GamificationJourney;
}

/**
 * XP history entry
 */
export interface XpHistoryEntry {
  timestamp: string;
  amount: number;
  source: string;
  eventType: GamificationEventType;
  journey: GamificationJourney;
  description: string;
}

/**
 * Response containing a user's XP history
 */
export interface GetXpHistoryResponse extends PaginatedResponse<XpHistoryEntry> {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
}