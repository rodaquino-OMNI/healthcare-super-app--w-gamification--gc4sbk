/**
 * Enum for notification event types
 * Categorizes notifications by purpose and source
 */
export enum NotificationEventType {
  // System notifications
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  
  // Health journey notifications
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  HEALTH_GOAL_PROGRESS = 'HEALTH_GOAL_PROGRESS',
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',
  HEALTH_DEVICE_CONNECTED = 'HEALTH_DEVICE_CONNECTED',
  HEALTH_DEVICE_SYNC = 'HEALTH_DEVICE_SYNC',
  
  // Care journey notifications
  CARE_APPOINTMENT_CREATED = 'CARE_APPOINTMENT_CREATED',
  CARE_APPOINTMENT_REMINDER = 'CARE_APPOINTMENT_REMINDER',
  CARE_APPOINTMENT_UPDATED = 'CARE_APPOINTMENT_UPDATED',
  CARE_APPOINTMENT_CANCELLED = 'CARE_APPOINTMENT_CANCELLED',
  CARE_MEDICATION_REMINDER = 'CARE_MEDICATION_REMINDER',
  CARE_MEDICATION_REFILL = 'CARE_MEDICATION_REFILL',
  CARE_TELEMEDICINE_READY = 'CARE_TELEMEDICINE_READY',
  CARE_PROVIDER_MESSAGE = 'CARE_PROVIDER_MESSAGE',
  
  // Plan journey notifications
  PLAN_CLAIM_SUBMITTED = 'PLAN_CLAIM_SUBMITTED',
  PLAN_CLAIM_UPDATED = 'PLAN_CLAIM_UPDATED',
  PLAN_CLAIM_APPROVED = 'PLAN_CLAIM_APPROVED',
  PLAN_CLAIM_REJECTED = 'PLAN_CLAIM_REJECTED',
  PLAN_BENEFIT_USED = 'PLAN_BENEFIT_USED',
  PLAN_COVERAGE_ALERT = 'PLAN_COVERAGE_ALERT',
  PLAN_DOCUMENT_REQUIRED = 'PLAN_DOCUMENT_REQUIRED',
  
  // Gamification notifications
  GAMIFICATION_ACHIEVEMENT_UNLOCKED = 'GAMIFICATION_ACHIEVEMENT_UNLOCKED',
  GAMIFICATION_LEVEL_UP = 'GAMIFICATION_LEVEL_UP',
  GAMIFICATION_QUEST_AVAILABLE = 'GAMIFICATION_QUEST_AVAILABLE',
  GAMIFICATION_QUEST_COMPLETED = 'GAMIFICATION_QUEST_COMPLETED',
  GAMIFICATION_REWARD_EARNED = 'GAMIFICATION_REWARD_EARNED',
  
  // Delivery status notifications
  DELIVERY_STATUS_SENT = 'DELIVERY_STATUS_SENT',
  DELIVERY_STATUS_DELIVERED = 'DELIVERY_STATUS_DELIVERED',
  DELIVERY_STATUS_READ = 'DELIVERY_STATUS_READ',
  DELIVERY_STATUS_FAILED = 'DELIVERY_STATUS_FAILED',
  
  // User preference notifications
  PREFERENCE_UPDATED = 'PREFERENCE_UPDATED',
}

/**
 * Maps notification event types to their respective journeys
 */
export const NOTIFICATION_EVENT_JOURNEY_MAP: Record<string, 'health' | 'care' | 'plan' | 'system' | 'gamification'> = {
  // System notifications
  [NotificationEventType.SYSTEM_ALERT]: 'system',
  [NotificationEventType.SYSTEM_MAINTENANCE]: 'system',
  [NotificationEventType.SYSTEM_UPDATE]: 'system',
  
  // Health journey notifications
  [NotificationEventType.HEALTH_METRIC_RECORDED]: 'health',
  [NotificationEventType.HEALTH_GOAL_CREATED]: 'health',
  [NotificationEventType.HEALTH_GOAL_PROGRESS]: 'health',
  [NotificationEventType.HEALTH_GOAL_ACHIEVED]: 'health',
  [NotificationEventType.HEALTH_INSIGHT_GENERATED]: 'health',
  [NotificationEventType.HEALTH_DEVICE_CONNECTED]: 'health',
  [NotificationEventType.HEALTH_DEVICE_SYNC]: 'health',
  
  // Care journey notifications
  [NotificationEventType.CARE_APPOINTMENT_CREATED]: 'care',
  [NotificationEventType.CARE_APPOINTMENT_REMINDER]: 'care',
  [NotificationEventType.CARE_APPOINTMENT_UPDATED]: 'care',
  [NotificationEventType.CARE_APPOINTMENT_CANCELLED]: 'care',
  [NotificationEventType.CARE_MEDICATION_REMINDER]: 'care',
  [NotificationEventType.CARE_MEDICATION_REFILL]: 'care',
  [NotificationEventType.CARE_TELEMEDICINE_READY]: 'care',
  [NotificationEventType.CARE_PROVIDER_MESSAGE]: 'care',
  
  // Plan journey notifications
  [NotificationEventType.PLAN_CLAIM_SUBMITTED]: 'plan',
  [NotificationEventType.PLAN_CLAIM_UPDATED]: 'plan',
  [NotificationEventType.PLAN_CLAIM_APPROVED]: 'plan',
  [NotificationEventType.PLAN_CLAIM_REJECTED]: 'plan',
  [NotificationEventType.PLAN_BENEFIT_USED]: 'plan',
  [NotificationEventType.PLAN_COVERAGE_ALERT]: 'plan',
  [NotificationEventType.PLAN_DOCUMENT_REQUIRED]: 'plan',
  
  // Gamification notifications
  [NotificationEventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED]: 'gamification',
  [NotificationEventType.GAMIFICATION_LEVEL_UP]: 'gamification',
  [NotificationEventType.GAMIFICATION_QUEST_AVAILABLE]: 'gamification',
  [NotificationEventType.GAMIFICATION_QUEST_COMPLETED]: 'gamification',
  [NotificationEventType.GAMIFICATION_REWARD_EARNED]: 'gamification',
};

/**
 * Helper function to get the journey ID for a notification event type
 * @param eventType The notification event type
 * @returns The journey ID or 'system' if not journey-specific
 */
export function getJourneyForNotificationEventType(
  eventType: NotificationEventType,
): 'health' | 'care' | 'plan' | 'system' | 'gamification' {
  return NOTIFICATION_EVENT_JOURNEY_MAP[eventType] || 'system';
}