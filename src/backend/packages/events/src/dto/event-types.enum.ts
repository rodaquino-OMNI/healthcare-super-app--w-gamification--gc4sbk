/**
 * Enum of all supported event types in the AUSTA SuperApp.
 * 
 * This enum provides type-safe references to event types across health, care, and plan journeys.
 * It ensures consistent naming, prevents typos, enables autocomplete, and facilitates static
 * analysis of event processing logic.
 * 
 * Events are categorized by journey and event category to make the codebase more maintainable
 * and reduce errors in event handling.
 */
export enum EventType {
  // ===== HEALTH JOURNEY EVENTS =====
  
  /**
   * Triggered when a user records a new health metric.
   * 
   * Payload structure:
   * - metricType: string (e.g., 'blood_pressure', 'weight', 'steps', 'heart_rate')
   * - value: number
   * - unit: string
   * - timestamp: ISO string
   * - source: string (e.g., 'manual', 'device', 'integration')
   */
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  
  /**
   * Triggered when a user achieves a health goal.
   * 
   * Payload structure:
   * - goalId: string
   * - goalType: string (e.g., 'steps', 'weight_loss', 'sleep')
   * - targetValue: number
   * - achievedValue: number
   * - completedAt: ISO string
   */
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  
  /**
   * Triggered when a user creates a new health goal.
   * 
   * Payload structure:
   * - goalId: string
   * - goalType: string
   * - targetValue: number
   * - startValue: number
   * - deadline: ISO string (optional)
   * - createdAt: ISO string
   */
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  
  /**
   * Triggered when a user connects a health device or wearable.
   * 
   * Payload structure:
   * - deviceId: string
   * - deviceType: string (e.g., 'fitbit', 'apple_watch', 'glucose_monitor')
   * - connectionMethod: string (e.g., 'oauth', 'bluetooth')
   * - connectedAt: ISO string
   */
  HEALTH_DEVICE_CONNECTED = 'HEALTH_DEVICE_CONNECTED',
  
  /**
   * Triggered when a health insight is generated for a user.
   * 
   * Payload structure:
   * - insightId: string
   * - insightType: string (e.g., 'trend', 'anomaly', 'recommendation')
   * - metricType: string
   * - description: string
   * - severity: string (e.g., 'info', 'warning', 'critical')
   * - generatedAt: ISO string
   */
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',
  
  /**
   * Triggered when a user completes a health assessment.
   * 
   * Payload structure:
   * - assessmentId: string
   * - assessmentType: string (e.g., 'general_health', 'mental_health', 'nutrition')
   * - score: number
   * - completedAt: ISO string
   * - duration: number (in seconds)
   */
  HEALTH_ASSESSMENT_COMPLETED = 'HEALTH_ASSESSMENT_COMPLETED',
  
  // ===== CARE JOURNEY EVENTS =====
  
  /**
   * Triggered when a user books a medical appointment.
   * 
   * Payload structure:
   * - appointmentId: string
   * - providerId: string
   * - specialtyType: string
   * - appointmentType: string (e.g., 'in_person', 'telemedicine')
   * - scheduledAt: ISO string
   * - bookedAt: ISO string
   */
  CARE_APPOINTMENT_BOOKED = 'CARE_APPOINTMENT_BOOKED',
  
  /**
   * Triggered when a user completes a medical appointment.
   * 
   * Payload structure:
   * - appointmentId: string
   * - providerId: string
   * - appointmentType: string
   * - scheduledAt: ISO string
   * - completedAt: ISO string
   * - duration: number (in minutes)
   */
  CARE_APPOINTMENT_COMPLETED = 'CARE_APPOINTMENT_COMPLETED',
  
  /**
   * Triggered when a user logs taking medication.
   * 
   * Payload structure:
   * - medicationId: string
   * - medicationName: string
   * - dosage: string
   * - takenAt: ISO string
   * - adherence: string (e.g., 'on_time', 'late', 'missed')
   */
  CARE_MEDICATION_TAKEN = 'CARE_MEDICATION_TAKEN',
  
  /**
   * Triggered when a user starts a telemedicine session.
   * 
   * Payload structure:
   * - sessionId: string
   * - appointmentId: string
   * - providerId: string
   * - startedAt: ISO string
   * - deviceType: string (e.g., 'mobile', 'web')
   */
  CARE_TELEMEDICINE_STARTED = 'CARE_TELEMEDICINE_STARTED',
  
  /**
   * Triggered when a user completes a telemedicine session.
   * 
   * Payload structure:
   * - sessionId: string
   * - appointmentId: string
   * - providerId: string
   * - startedAt: ISO string
   * - endedAt: ISO string
   * - duration: number (in minutes)
   * - quality: string (e.g., 'excellent', 'good', 'poor')
   */
  CARE_TELEMEDICINE_COMPLETED = 'CARE_TELEMEDICINE_COMPLETED',
  
  /**
   * Triggered when a care plan is created for a user.
   * 
   * Payload structure:
   * - planId: string
   * - providerId: string
   * - planType: string (e.g., 'chronic_condition', 'recovery', 'preventive')
   * - condition: string
   * - startDate: ISO string
   * - endDate: ISO string (optional)
   * - createdAt: ISO string
   */
  CARE_PLAN_CREATED = 'CARE_PLAN_CREATED',
  
  /**
   * Triggered when a user completes a care plan task.
   * 
   * Payload structure:
   * - taskId: string
   * - planId: string
   * - taskType: string (e.g., 'medication', 'exercise', 'appointment')
   * - completedAt: ISO string
   * - status: string (e.g., 'completed', 'partially_completed')
   */
  CARE_PLAN_TASK_COMPLETED = 'CARE_PLAN_TASK_COMPLETED',
  
  // ===== PLAN JOURNEY EVENTS =====
  
  /**
   * Triggered when a user submits an insurance claim.
   * 
   * Payload structure:
   * - claimId: string
   * - claimType: string (e.g., 'medical', 'dental', 'vision', 'pharmacy')
   * - providerId: string
   * - serviceDate: ISO string
   * - amount: number
   * - submittedAt: ISO string
   */
  PLAN_CLAIM_SUBMITTED = 'PLAN_CLAIM_SUBMITTED',
  
  /**
   * Triggered when an insurance claim is processed.
   * 
   * Payload structure:
   * - claimId: string
   * - status: string (e.g., 'approved', 'denied', 'partial')
   * - amount: number
   * - coveredAmount: number
   * - processedAt: ISO string
   */
  PLAN_CLAIM_PROCESSED = 'PLAN_CLAIM_PROCESSED',
  
  /**
   * Triggered when a user selects a new insurance plan.
   * 
   * Payload structure:
   * - planId: string
   * - planType: string (e.g., 'health', 'dental', 'vision')
   * - coverageLevel: string (e.g., 'individual', 'family')
   * - premium: number
   * - startDate: ISO string
   * - selectedAt: ISO string
   */
  PLAN_SELECTED = 'PLAN_SELECTED',
  
  /**
   * Triggered when a user utilizes an insurance benefit.
   * 
   * Payload structure:
   * - benefitId: string
   * - benefitType: string (e.g., 'wellness', 'preventive', 'specialist')
   * - providerId: string (optional)
   * - utilizationDate: ISO string
   * - savingsAmount: number (optional)
   */
  PLAN_BENEFIT_UTILIZED = 'PLAN_BENEFIT_UTILIZED',
  
  /**
   * Triggered when a user redeems reward points.
   * 
   * Payload structure:
   * - rewardId: string
   * - rewardType: string (e.g., 'gift_card', 'premium_discount', 'merchandise')
   * - pointsRedeemed: number
   * - value: number
   * - redeemedAt: ISO string
   */
  PLAN_REWARD_REDEEMED = 'PLAN_REWARD_REDEEMED',
  
  /**
   * Triggered when a user completes a plan-related document.
   * 
   * Payload structure:
   * - documentId: string
   * - documentType: string (e.g., 'enrollment', 'consent', 'authorization')
   * - completedAt: ISO string
   */
  PLAN_DOCUMENT_COMPLETED = 'PLAN_DOCUMENT_COMPLETED',
  
  // ===== CROSS-JOURNEY EVENTS =====
  
  /**
   * Triggered when a user earns achievement points.
   * 
   * Payload structure:
   * - achievementId: string (optional)
   * - sourceType: string (e.g., 'health', 'care', 'plan')
   * - sourceId: string
   * - points: number
   * - reason: string
   * - earnedAt: ISO string
   */
  GAMIFICATION_POINTS_EARNED = 'GAMIFICATION_POINTS_EARNED',
  
  /**
   * Triggered when a user unlocks an achievement.
   * 
   * Payload structure:
   * - achievementId: string
   * - achievementType: string
   * - tier: string (e.g., 'bronze', 'silver', 'gold')
   * - points: number
   * - unlockedAt: ISO string
   */
  GAMIFICATION_ACHIEVEMENT_UNLOCKED = 'GAMIFICATION_ACHIEVEMENT_UNLOCKED',
  
  /**
   * Triggered when a user levels up in the gamification system.
   * 
   * Payload structure:
   * - previousLevel: number
   * - newLevel: number
   * - totalPoints: number
   * - leveledUpAt: ISO string
   */
  GAMIFICATION_LEVEL_UP = 'GAMIFICATION_LEVEL_UP',
  
  /**
   * Triggered when a user completes a quest or challenge.
   * 
   * Payload structure:
   * - questId: string
   * - questType: string
   * - difficulty: string (e.g., 'easy', 'medium', 'hard')
   * - points: number
   * - completedAt: ISO string
   */
  GAMIFICATION_QUEST_COMPLETED = 'GAMIFICATION_QUEST_COMPLETED',
  
  // ===== USER EVENTS =====
  
  /**
   * Triggered when a user completes their profile.
   * 
   * Payload structure:
   * - completionPercentage: number
   * - completedSections: string[]
   * - completedAt: ISO string
   */
  USER_PROFILE_COMPLETED = 'USER_PROFILE_COMPLETED',
  
  /**
   * Triggered when a user logs in to the application.
   * 
   * Payload structure:
   * - loginMethod: string (e.g., 'password', 'sso', 'biometric')
   * - deviceType: string (e.g., 'mobile', 'web')
   * - loginAt: ISO string
   */
  USER_LOGIN = 'USER_LOGIN',
  
  /**
   * Triggered when a user completes the onboarding process.
   * 
   * Payload structure:
   * - completedSteps: string[]
   * - selectedJourneys: string[]
   * - duration: number (in seconds)
   * - completedAt: ISO string
   */
  USER_ONBOARDING_COMPLETED = 'USER_ONBOARDING_COMPLETED',
  
  /**
   * Triggered when a user provides feedback.
   * 
   * Payload structure:
   * - feedbackType: string (e.g., 'app', 'journey', 'feature')
   * - rating: number
   * - comments: string (optional)
   * - submittedAt: ISO string
   */
  USER_FEEDBACK_SUBMITTED = 'USER_FEEDBACK_SUBMITTED'
}

/**
 * Namespace containing event type groupings by journey.
 * This provides an alternative way to access event types organized by journey.
 */
export namespace JourneyEvents {
  /**
   * Health journey event types.
   */
  export enum Health {
    METRIC_RECORDED = EventType.HEALTH_METRIC_RECORDED,
    GOAL_ACHIEVED = EventType.HEALTH_GOAL_ACHIEVED,
    GOAL_CREATED = EventType.HEALTH_GOAL_CREATED,
    DEVICE_CONNECTED = EventType.HEALTH_DEVICE_CONNECTED,
    INSIGHT_GENERATED = EventType.HEALTH_INSIGHT_GENERATED,
    ASSESSMENT_COMPLETED = EventType.HEALTH_ASSESSMENT_COMPLETED
  }
  
  /**
   * Care journey event types.
   */
  export enum Care {
    APPOINTMENT_BOOKED = EventType.CARE_APPOINTMENT_BOOKED,
    APPOINTMENT_COMPLETED = EventType.CARE_APPOINTMENT_COMPLETED,
    MEDICATION_TAKEN = EventType.CARE_MEDICATION_TAKEN,
    TELEMEDICINE_STARTED = EventType.CARE_TELEMEDICINE_STARTED,
    TELEMEDICINE_COMPLETED = EventType.CARE_TELEMEDICINE_COMPLETED,
    PLAN_CREATED = EventType.CARE_PLAN_CREATED,
    PLAN_TASK_COMPLETED = EventType.CARE_PLAN_TASK_COMPLETED
  }
  
  /**
   * Plan journey event types.
   */
  export enum Plan {
    CLAIM_SUBMITTED = EventType.PLAN_CLAIM_SUBMITTED,
    CLAIM_PROCESSED = EventType.PLAN_CLAIM_PROCESSED,
    PLAN_SELECTED = EventType.PLAN_SELECTED,
    BENEFIT_UTILIZED = EventType.PLAN_BENEFIT_UTILIZED,
    REWARD_REDEEMED = EventType.PLAN_REWARD_REDEEMED,
    DOCUMENT_COMPLETED = EventType.PLAN_DOCUMENT_COMPLETED
  }
  
  /**
   * Gamification event types that span across journeys.
   */
  export enum Gamification {
    POINTS_EARNED = EventType.GAMIFICATION_POINTS_EARNED,
    ACHIEVEMENT_UNLOCKED = EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    LEVEL_UP = EventType.GAMIFICATION_LEVEL_UP,
    QUEST_COMPLETED = EventType.GAMIFICATION_QUEST_COMPLETED
  }
  
  /**
   * User-related event types.
   */
  export enum User {
    PROFILE_COMPLETED = EventType.USER_PROFILE_COMPLETED,
    LOGIN = EventType.USER_LOGIN,
    ONBOARDING_COMPLETED = EventType.USER_ONBOARDING_COMPLETED,
    FEEDBACK_SUBMITTED = EventType.USER_FEEDBACK_SUBMITTED
  }
}