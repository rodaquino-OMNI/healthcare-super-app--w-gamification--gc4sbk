/**
 * Error codes and messages for the Gamification Engine.
 * 
 * This file defines standardized error codes, messages, and metadata for all error scenarios
 * encountered within the gamification engine. These constants ensure consistent error handling,
 * logging, and client responses across all modules.
 * 
 * Error codes are organized by module (events, achievements, rewards, etc.) and include:
 * - HTTP status code mappings for API responses
 * - Error message templates with placeholder support
 * - Severity levels for monitoring and alerting
 * - Error classification for handling strategies
 */

/**
 * Error severity levels for monitoring and alerting.
 */
export enum ErrorSeverity {
  INFO = 'INFO',           // Informational, no action needed
  WARNING = 'WARNING',     // Potential issue, monitor but no immediate action
  ERROR = 'ERROR',         // Significant issue requiring attention
  CRITICAL = 'CRITICAL',   // Severe issue requiring immediate action
}

/**
 * Error classification types for determining handling strategies.
 */
export enum ErrorClassification {
  CLIENT_ERROR = 'CLIENT_ERROR',           // Invalid client input or request (4xx)
  SYSTEM_ERROR = 'SYSTEM_ERROR',           // Internal server or system failure (5xx)
  TRANSIENT_ERROR = 'TRANSIENT_ERROR',     // Temporary error that may resolve with retry
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',   // Error from external dependency or service
}

/**
 * Base interface for error code definitions.
 */
interface ErrorCodeDefinition {
  code: string;                           // Unique error code
  message: string;                        // Error message template with optional placeholders
  httpStatus: number;                     // HTTP status code for API responses
  severity: ErrorSeverity;                // Error severity for monitoring
  classification: ErrorClassification;    // Error classification for handling strategy
}

/**
 * Common error codes shared across all modules.
 */
export const CommonErrorCodes = {
  UNKNOWN_ERROR: {
    code: 'GAMIFICATION-COMMON-001',
    message: 'An unexpected error occurred.',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  VALIDATION_ERROR: {
    code: 'GAMIFICATION-COMMON-002',
    message: 'Validation error: {details}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  NOT_FOUND: {
    code: 'GAMIFICATION-COMMON-003',
    message: 'Resource not found: {resource}',
    httpStatus: 404,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  UNAUTHORIZED: {
    code: 'GAMIFICATION-COMMON-004',
    message: 'Unauthorized access.',
    httpStatus: 401,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  FORBIDDEN: {
    code: 'GAMIFICATION-COMMON-005',
    message: 'Forbidden: Insufficient permissions to access this resource.',
    httpStatus: 403,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  DATABASE_ERROR: {
    code: 'GAMIFICATION-COMMON-006',
    message: 'Database operation failed: {operation}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  TIMEOUT: {
    code: 'GAMIFICATION-COMMON-007',
    message: 'Operation timed out: {operation}',
    httpStatus: 504,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.TRANSIENT_ERROR,
  },
  RATE_LIMITED: {
    code: 'GAMIFICATION-COMMON-008',
    message: 'Rate limit exceeded. Try again in {retryAfter} seconds.',
    httpStatus: 429,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  INVALID_CONFIGURATION: {
    code: 'GAMIFICATION-COMMON-009',
    message: 'Invalid configuration: {details}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  CIRCUIT_BROKEN: {
    code: 'GAMIFICATION-COMMON-010',
    message: 'Circuit breaker open for operation: {operation}',
    httpStatus: 503,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.DEPENDENCY_ERROR,
  },
} as const;

/**
 * Event-related error codes.
 */
export const EventErrorCodes = {
  INVALID_EVENT_TYPE: {
    code: 'GAMIFICATION-EVENT-001',
    message: 'Invalid event type: {eventType}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  INVALID_EVENT_PAYLOAD: {
    code: 'GAMIFICATION-EVENT-002',
    message: 'Invalid event payload: {details}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  EVENT_PROCESSING_FAILED: {
    code: 'GAMIFICATION-EVENT-003',
    message: 'Failed to process event: {eventId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  DUPLICATE_EVENT: {
    code: 'GAMIFICATION-EVENT-004',
    message: 'Duplicate event detected: {eventId}',
    httpStatus: 409,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  EVENT_PUBLISHING_FAILED: {
    code: 'GAMIFICATION-EVENT-005',
    message: 'Failed to publish event to Kafka: {details}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.DEPENDENCY_ERROR,
  },
  EVENT_CONSUMPTION_FAILED: {
    code: 'GAMIFICATION-EVENT-006',
    message: 'Failed to consume event from Kafka: {details}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.DEPENDENCY_ERROR,
  },
  INVALID_EVENT_VERSION: {
    code: 'GAMIFICATION-EVENT-007',
    message: 'Invalid event schema version: {version}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  EVENT_TRANSFORMATION_FAILED: {
    code: 'GAMIFICATION-EVENT-008',
    message: 'Failed to transform event: {details}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  INVALID_JOURNEY_EVENT: {
    code: 'GAMIFICATION-EVENT-009',
    message: 'Invalid journey for event type: {eventType} in journey {journey}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  EVENT_RETRY_LIMIT_EXCEEDED: {
    code: 'GAMIFICATION-EVENT-010',
    message: 'Retry limit exceeded for event: {eventId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.TRANSIENT_ERROR,
  },
} as const;

/**
 * Achievement-related error codes.
 */
export const AchievementErrorCodes = {
  ACHIEVEMENT_NOT_FOUND: {
    code: 'GAMIFICATION-ACHIEVEMENT-001',
    message: 'Achievement not found: {achievementId}',
    httpStatus: 404,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  INVALID_ACHIEVEMENT_TYPE: {
    code: 'GAMIFICATION-ACHIEVEMENT-002',
    message: 'Invalid achievement type: {type}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  ACHIEVEMENT_ALREADY_UNLOCKED: {
    code: 'GAMIFICATION-ACHIEVEMENT-003',
    message: 'Achievement already unlocked for user: {userId}',
    httpStatus: 409,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  ACHIEVEMENT_RULE_EVALUATION_FAILED: {
    code: 'GAMIFICATION-ACHIEVEMENT-004',
    message: 'Failed to evaluate achievement rule: {ruleId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  ACHIEVEMENT_NOTIFICATION_FAILED: {
    code: 'GAMIFICATION-ACHIEVEMENT-005',
    message: 'Failed to send achievement notification: {achievementId}',
    httpStatus: 500,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.DEPENDENCY_ERROR,
  },
  ACHIEVEMENT_PROGRESS_UPDATE_FAILED: {
    code: 'GAMIFICATION-ACHIEVEMENT-006',
    message: 'Failed to update achievement progress: {achievementId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  INVALID_ACHIEVEMENT_CRITERIA: {
    code: 'GAMIFICATION-ACHIEVEMENT-007',
    message: 'Invalid achievement criteria: {details}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  ACHIEVEMENT_DEPENDENCY_NOT_MET: {
    code: 'GAMIFICATION-ACHIEVEMENT-008',
    message: 'Achievement dependency not met: {dependencyId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  ACHIEVEMENT_EXPIRED: {
    code: 'GAMIFICATION-ACHIEVEMENT-009',
    message: 'Achievement expired: {achievementId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  ACHIEVEMENT_JOURNEY_MISMATCH: {
    code: 'GAMIFICATION-ACHIEVEMENT-010',
    message: 'Achievement journey mismatch: {achievementId} for journey {journey}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
} as const;

/**
 * Reward-related error codes.
 */
export const RewardErrorCodes = {
  REWARD_NOT_FOUND: {
    code: 'GAMIFICATION-REWARD-001',
    message: 'Reward not found: {rewardId}',
    httpStatus: 404,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  INSUFFICIENT_POINTS: {
    code: 'GAMIFICATION-REWARD-002',
    message: 'Insufficient points to redeem reward: {rewardId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  REWARD_ALREADY_REDEEMED: {
    code: 'GAMIFICATION-REWARD-003',
    message: 'Reward already redeemed: {rewardId}',
    httpStatus: 409,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  REWARD_REDEMPTION_FAILED: {
    code: 'GAMIFICATION-REWARD-004',
    message: 'Failed to process reward redemption: {rewardId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  REWARD_DELIVERY_FAILED: {
    code: 'GAMIFICATION-REWARD-005',
    message: 'Failed to deliver reward: {rewardId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.DEPENDENCY_ERROR,
  },
  REWARD_EXPIRED: {
    code: 'GAMIFICATION-REWARD-006',
    message: 'Reward expired: {rewardId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  REWARD_UNAVAILABLE: {
    code: 'GAMIFICATION-REWARD-007',
    message: 'Reward unavailable: {rewardId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  REWARD_LIMIT_REACHED: {
    code: 'GAMIFICATION-REWARD-008',
    message: 'Reward redemption limit reached: {rewardId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  INVALID_REWARD_TYPE: {
    code: 'GAMIFICATION-REWARD-009',
    message: 'Invalid reward type: {type}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  REWARD_JOURNEY_MISMATCH: {
    code: 'GAMIFICATION-REWARD-010',
    message: 'Reward journey mismatch: {rewardId} for journey {journey}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
} as const;

/**
 * Quest-related error codes.
 */
export const QuestErrorCodes = {
  QUEST_NOT_FOUND: {
    code: 'GAMIFICATION-QUEST-001',
    message: 'Quest not found: {questId}',
    httpStatus: 404,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  QUEST_ALREADY_COMPLETED: {
    code: 'GAMIFICATION-QUEST-002',
    message: 'Quest already completed: {questId}',
    httpStatus: 409,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  QUEST_EXPIRED: {
    code: 'GAMIFICATION-QUEST-003',
    message: 'Quest expired: {questId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  QUEST_STEP_VALIDATION_FAILED: {
    code: 'GAMIFICATION-QUEST-004',
    message: 'Quest step validation failed: {stepId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  QUEST_PROGRESS_UPDATE_FAILED: {
    code: 'GAMIFICATION-QUEST-005',
    message: 'Failed to update quest progress: {questId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  QUEST_PREREQUISITE_NOT_MET: {
    code: 'GAMIFICATION-QUEST-006',
    message: 'Quest prerequisite not met: {prerequisiteId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  QUEST_NOT_AVAILABLE: {
    code: 'GAMIFICATION-QUEST-007',
    message: 'Quest not available: {questId}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  INVALID_QUEST_TYPE: {
    code: 'GAMIFICATION-QUEST-008',
    message: 'Invalid quest type: {type}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  QUEST_REWARD_PROCESSING_FAILED: {
    code: 'GAMIFICATION-QUEST-009',
    message: 'Failed to process quest reward: {questId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  QUEST_JOURNEY_MISMATCH: {
    code: 'GAMIFICATION-QUEST-010',
    message: 'Quest journey mismatch: {questId} for journey {journey}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
} as const;

/**
 * Profile-related error codes.
 */
export const ProfileErrorCodes = {
  PROFILE_NOT_FOUND: {
    code: 'GAMIFICATION-PROFILE-001',
    message: 'Profile not found: {userId}',
    httpStatus: 404,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  PROFILE_CREATION_FAILED: {
    code: 'GAMIFICATION-PROFILE-002',
    message: 'Failed to create profile: {userId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  PROFILE_UPDATE_FAILED: {
    code: 'GAMIFICATION-PROFILE-003',
    message: 'Failed to update profile: {userId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  INVALID_PROFILE_DATA: {
    code: 'GAMIFICATION-PROFILE-004',
    message: 'Invalid profile data: {details}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  PROFILE_ALREADY_EXISTS: {
    code: 'GAMIFICATION-PROFILE-005',
    message: 'Profile already exists: {userId}',
    httpStatus: 409,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  PROFILE_POINTS_UPDATE_FAILED: {
    code: 'GAMIFICATION-PROFILE-006',
    message: 'Failed to update profile points: {userId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  PROFILE_LEVEL_UPDATE_FAILED: {
    code: 'GAMIFICATION-PROFILE-007',
    message: 'Failed to update profile level: {userId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  PROFILE_BADGE_UPDATE_FAILED: {
    code: 'GAMIFICATION-PROFILE-008',
    message: 'Failed to update profile badges: {userId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  PROFILE_JOURNEY_DATA_INVALID: {
    code: 'GAMIFICATION-PROFILE-009',
    message: 'Invalid journey data for profile: {userId} in journey {journey}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  PROFILE_SYNC_FAILED: {
    code: 'GAMIFICATION-PROFILE-010',
    message: 'Failed to sync profile with auth service: {userId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.DEPENDENCY_ERROR,
  },
} as const;

/**
 * Leaderboard-related error codes.
 */
export const LeaderboardErrorCodes = {
  LEADERBOARD_NOT_FOUND: {
    code: 'GAMIFICATION-LEADERBOARD-001',
    message: 'Leaderboard not found: {leaderboardId}',
    httpStatus: 404,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  LEADERBOARD_UPDATE_FAILED: {
    code: 'GAMIFICATION-LEADERBOARD-002',
    message: 'Failed to update leaderboard: {leaderboardId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  LEADERBOARD_ENTRY_NOT_FOUND: {
    code: 'GAMIFICATION-LEADERBOARD-003',
    message: 'Leaderboard entry not found for user: {userId}',
    httpStatus: 404,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  LEADERBOARD_SCORE_UPDATE_FAILED: {
    code: 'GAMIFICATION-LEADERBOARD-004',
    message: 'Failed to update leaderboard score: {userId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  INVALID_LEADERBOARD_TYPE: {
    code: 'GAMIFICATION-LEADERBOARD-005',
    message: 'Invalid leaderboard type: {type}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  LEADERBOARD_PERIOD_INVALID: {
    code: 'GAMIFICATION-LEADERBOARD-006',
    message: 'Invalid leaderboard period: {period}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  LEADERBOARD_REDIS_ERROR: {
    code: 'GAMIFICATION-LEADERBOARD-007',
    message: 'Redis error for leaderboard operation: {operation}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.DEPENDENCY_ERROR,
  },
  LEADERBOARD_CALCULATION_FAILED: {
    code: 'GAMIFICATION-LEADERBOARD-008',
    message: 'Failed to calculate leaderboard rankings: {leaderboardId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  LEADERBOARD_JOURNEY_INVALID: {
    code: 'GAMIFICATION-LEADERBOARD-009',
    message: 'Invalid journey for leaderboard: {leaderboardId}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  LEADERBOARD_PAGINATION_INVALID: {
    code: 'GAMIFICATION-LEADERBOARD-010',
    message: 'Invalid pagination parameters for leaderboard: {details}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
} as const;

/**
 * Rule-related error codes.
 */
export const RuleErrorCodes = {
  RULE_NOT_FOUND: {
    code: 'GAMIFICATION-RULE-001',
    message: 'Rule not found: {ruleId}',
    httpStatus: 404,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  RULE_EVALUATION_FAILED: {
    code: 'GAMIFICATION-RULE-002',
    message: 'Failed to evaluate rule: {ruleId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  INVALID_RULE_CONDITION: {
    code: 'GAMIFICATION-RULE-003',
    message: 'Invalid rule condition: {condition}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  RULE_EXECUTION_TIMEOUT: {
    code: 'GAMIFICATION-RULE-004',
    message: 'Rule execution timed out: {ruleId}',
    httpStatus: 504,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  RULE_DEPENDENCY_FAILED: {
    code: 'GAMIFICATION-RULE-005',
    message: 'Rule dependency evaluation failed: {dependencyId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  CIRCULAR_RULE_DEPENDENCY: {
    code: 'GAMIFICATION-RULE-006',
    message: 'Circular dependency detected in rule: {ruleId}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  INVALID_RULE_ACTION: {
    code: 'GAMIFICATION-RULE-007',
    message: 'Invalid rule action: {action}',
    httpStatus: 400,
    severity: ErrorSeverity.INFO,
    classification: ErrorClassification.CLIENT_ERROR,
  },
  RULE_CREATION_FAILED: {
    code: 'GAMIFICATION-RULE-008',
    message: 'Failed to create rule: {details}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  RULE_UPDATE_FAILED: {
    code: 'GAMIFICATION-RULE-009',
    message: 'Failed to update rule: {ruleId}',
    httpStatus: 500,
    severity: ErrorSeverity.ERROR,
    classification: ErrorClassification.SYSTEM_ERROR,
  },
  RULE_JOURNEY_MISMATCH: {
    code: 'GAMIFICATION-RULE-010',
    message: 'Rule journey mismatch: {ruleId} for journey {journey}',
    httpStatus: 400,
    severity: ErrorSeverity.WARNING,
    classification: ErrorClassification.CLIENT_ERROR,
  },
} as const;

/**
 * Utility type to extract all error codes from the error code objects.
 */
export type ErrorCode =
  | keyof typeof CommonErrorCodes
  | keyof typeof EventErrorCodes
  | keyof typeof AchievementErrorCodes
  | keyof typeof RewardErrorCodes
  | keyof typeof QuestErrorCodes
  | keyof typeof ProfileErrorCodes
  | keyof typeof LeaderboardErrorCodes
  | keyof typeof RuleErrorCodes;

/**
 * Utility type to extract all error code definitions.
 */
export type ErrorCodeMap = {
  [K in ErrorCode]: ErrorCodeDefinition;
};

/**
 * Combined map of all error codes for lookup by code string.
 */
export const AllErrorCodes: Record<string, ErrorCodeDefinition> = {
  ...CommonErrorCodes,
  ...EventErrorCodes,
  ...AchievementErrorCodes,
  ...RewardErrorCodes,
  ...QuestErrorCodes,
  ...ProfileErrorCodes,
  ...LeaderboardErrorCodes,
  ...RuleErrorCodes,
};

/**
 * Utility function to get an error code definition by its code string.
 * @param code The error code string
 * @returns The error code definition or undefined if not found
 */
export function getErrorByCode(code: string): ErrorCodeDefinition | undefined {
  return Object.values(AllErrorCodes).find(error => error.code === code);
}

/**
 * Utility function to format an error message by replacing placeholders.
 * @param template The error message template with placeholders
 * @param params Object containing values for the placeholders
 * @returns Formatted error message with placeholders replaced
 */
export function formatErrorMessage(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/{([^}]+)}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}