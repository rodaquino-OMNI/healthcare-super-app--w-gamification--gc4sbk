/**
 * Gamification API Interfaces
 * 
 * This file defines the API interfaces for the AUSTA SuperApp gamification system.
 * It includes request and response types for achievements, quests, rewards, game profiles,
 * leaderboards, and event tracking.
 * 
 * These interfaces ensure type safety for all gamification operations and enable
 * cross-journey achievement tracking and event-based gamification engine integration.
 */

import { Achievement, GameProfile, Quest, Reward } from '../../shared/types/gamification.types';

/**
 * Base pagination parameters for list requests
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
}

/**
 * Base pagination metadata for list responses
 */
export interface PaginationMeta {
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of items per page */
  itemsPerPage: number;
  /** Total number of items */
  totalItems: number;
}

/**
 * Base paginated response structure
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}

// ===== Achievement API Interfaces =====

/**
 * Request parameters for fetching achievements
 */
export interface GetAchievementsRequest extends PaginationParams {
  /** Filter by journey (optional) */
  journey?: string;
  /** Filter by unlocked status (optional) */
  unlocked?: boolean;
}

/**
 * Response for fetching achievements
 */
export interface GetAchievementsResponse extends PaginatedResponse<Achievement> {}

/**
 * Request parameters for fetching a single achievement
 */
export interface GetAchievementRequest {
  /** Achievement ID */
  id: string;
}

/**
 * Response for fetching a single achievement
 */
export interface GetAchievementResponse {
  /** Achievement data */
  achievement: Achievement;
}

/**
 * Request parameters for tracking achievement progress
 */
export interface TrackAchievementProgressRequest {
  /** Achievement ID */
  achievementId: string;
  /** Progress increment amount */
  progressIncrement: number;
}

/**
 * Response for tracking achievement progress
 */
export interface TrackAchievementProgressResponse {
  /** Updated achievement data */
  achievement: Achievement;
  /** Whether the achievement was newly unlocked */
  newlyUnlocked: boolean;
  /** Experience points earned (if any) */
  xpEarned: number;
}

// ===== Quest API Interfaces =====

/**
 * Request parameters for fetching quests
 */
export interface GetQuestsRequest extends PaginationParams {
  /** Filter by journey (optional) */
  journey?: string;
  /** Filter by completion status (optional) */
  completed?: boolean;
  /** Filter by active status (optional) */
  active?: boolean;
}

/**
 * Response for fetching quests
 */
export interface GetQuestsResponse extends PaginatedResponse<Quest> {}

/**
 * Request parameters for fetching a single quest
 */
export interface GetQuestRequest {
  /** Quest ID */
  id: string;
}

/**
 * Response for fetching a single quest
 */
export interface GetQuestResponse {
  /** Quest data */
  quest: Quest;
}

/**
 * Request parameters for tracking quest progress
 */
export interface TrackQuestProgressRequest {
  /** Quest ID */
  questId: string;
  /** Progress increment amount */
  progressIncrement: number;
}

/**
 * Response for tracking quest progress
 */
export interface TrackQuestProgressResponse {
  /** Updated quest data */
  quest: Quest;
  /** Whether the quest was newly completed */
  newlyCompleted: boolean;
  /** Experience points earned (if any) */
  xpEarned: number;
}

// ===== Reward API Interfaces =====

/**
 * Request parameters for fetching rewards
 */
export interface GetRewardsRequest extends PaginationParams {
  /** Filter by journey (optional) */
  journey?: string;
}

/**
 * Response for fetching rewards
 */
export interface GetRewardsResponse extends PaginatedResponse<Reward> {}

/**
 * Request parameters for fetching a single reward
 */
export interface GetRewardRequest {
  /** Reward ID */
  id: string;
}

/**
 * Response for fetching a single reward
 */
export interface GetRewardResponse {
  /** Reward data */
  reward: Reward;
}

/**
 * Request parameters for claiming a reward
 */
export interface ClaimRewardRequest {
  /** Reward ID */
  rewardId: string;
}

/**
 * Response for claiming a reward
 */
export interface ClaimRewardResponse {
  /** Claimed reward data */
  reward: Reward;
  /** Success status */
  success: boolean;
  /** Error message (if any) */
  error?: string;
}

// ===== Game Profile API Interfaces =====

/**
 * Request parameters for fetching the user's game profile
 */
export interface GetGameProfileRequest {
  /** Include achievements (optional) */
  includeAchievements?: boolean;
  /** Include quests (optional) */
  includeQuests?: boolean;
}

/**
 * Response for fetching the user's game profile
 */
export interface GetGameProfileResponse {
  /** Game profile data */
  profile: GameProfile;
}

/**
 * Request parameters for updating the user's game profile
 */
export interface UpdateGameProfileRequest {
  /** Display name (optional) */
  displayName?: string;
  /** Avatar URL (optional) */
  avatarUrl?: string;
}

/**
 * Response for updating the user's game profile
 */
export interface UpdateGameProfileResponse {
  /** Updated game profile data */
  profile: GameProfile;
}

// ===== Leaderboard API Interfaces =====

/**
 * Leaderboard entry structure
 */
export interface LeaderboardEntry {
  /** User ID */
  userId: string;
  /** User display name */
  displayName: string;
  /** User avatar URL */
  avatarUrl?: string;
  /** User's rank on the leaderboard */
  rank: number;
  /** User's score (XP, points, etc.) */
  score: number;
  /** User's level */
  level: number;
}

/**
 * Request parameters for fetching leaderboard data
 */
export interface GetLeaderboardRequest extends PaginationParams {
  /** Leaderboard type (global, journey-specific, etc.) */
  type: 'global' | 'health' | 'care' | 'plan';
  /** Time period for the leaderboard */
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
}

/**
 * Response for fetching leaderboard data
 */
export interface GetLeaderboardResponse extends PaginatedResponse<LeaderboardEntry> {
  /** Current user's rank (if on the leaderboard) */
  currentUserRank?: number;
}

/**
 * Request parameters for fetching the user's rank
 */
export interface GetUserRankRequest {
  /** Leaderboard type */
  type: 'global' | 'health' | 'care' | 'plan';
  /** Time period */
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
}

/**
 * Response for fetching the user's rank
 */
export interface GetUserRankResponse {
  /** User's rank */
  rank: number;
  /** User's score */
  score: number;
  /** Total number of users on the leaderboard */
  totalUsers: number;
}

// ===== Event Tracking Interfaces =====

/**
 * Base event structure for gamification events
 */
export interface GamificationEvent {
  /** Event type */
  eventType: string;
  /** User ID */
  userId: string;
  /** Timestamp of the event */
  timestamp: string;
  /** Journey associated with the event */
  journey: 'health' | 'care' | 'plan' | 'global';
  /** Additional event data */
  data: Record<string, any>;
}

/**
 * Health journey event types
 */
export enum HealthEventType {
  METRIC_RECORDED = 'health.metric.recorded',
  GOAL_CREATED = 'health.goal.created',
  GOAL_ACHIEVED = 'health.goal.achieved',
  DEVICE_CONNECTED = 'health.device.connected',
  HEALTH_CHECK_COMPLETED = 'health.check.completed',
}

/**
 * Care journey event types
 */
export enum CareEventType {
  APPOINTMENT_SCHEDULED = 'care.appointment.scheduled',
  APPOINTMENT_ATTENDED = 'care.appointment.attended',
  MEDICATION_TRACKED = 'care.medication.tracked',
  TELEMEDICINE_COMPLETED = 'care.telemedicine.completed',
  SYMPTOM_CHECKED = 'care.symptom.checked',
}

/**
 * Plan journey event types
 */
export enum PlanEventType {
  CLAIM_SUBMITTED = 'plan.claim.submitted',
  BENEFIT_USED = 'plan.benefit.used',
  PLAN_REVIEWED = 'plan.plan.reviewed',
  DOCUMENT_UPLOADED = 'plan.document.uploaded',
  COVERAGE_CHECKED = 'plan.coverage.checked',
}

/**
 * Request parameters for tracking a gamification event
 */
export interface TrackEventRequest {
  /** Event data */
  event: GamificationEvent;
}

/**
 * Response for tracking a gamification event
 */
export interface TrackEventResponse {
  /** Success status */
  success: boolean;
  /** Event ID (for reference) */
  eventId: string;
  /** Triggered achievements (if any) */
  triggeredAchievements?: Achievement[];
  /** Triggered quest progress (if any) */
  triggeredQuestProgress?: {
    questId: string;
    progressIncrement: number;
    newProgress: number;
    completed: boolean;
  }[];
  /** Experience points earned (if any) */
  xpEarned: number;
}

/**
 * Request parameters for tracking multiple gamification events in batch
 */
export interface TrackEventBatchRequest {
  /** Array of events */
  events: GamificationEvent[];
}

/**
 * Response for tracking multiple gamification events in batch
 */
export interface TrackEventBatchResponse {
  /** Success status */
  success: boolean;
  /** Number of events processed */
  processedCount: number;
  /** Number of events failed */
  failedCount: number;
  /** Array of event IDs */
  eventIds: string[];
  /** Experience points earned (if any) */
  xpEarned: number;
}