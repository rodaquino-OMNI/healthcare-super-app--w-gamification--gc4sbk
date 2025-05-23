/**
 * Comprehensive enum of all event types supported by the AUSTA SuperApp.
 * 
 * This enum provides type-safe references to event types across all journeys
 * (Health, Care, and Plan) and ensures consistent naming throughout the application.
 * 
 * Events are organized by journey and category to improve code maintainability
 * and reduce errors in event handling logic.
 */
export enum EventType {
  // ===== HEALTH JOURNEY EVENTS =====
  
  /**
   * Triggered when a user records a new health metric (weight, blood pressure, etc.)
   * Payload includes: metricType, value, unit, timestamp, deviceId (optional)
   */
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  
  /**
   * Triggered when a user achieves a health goal they've set
   * Payload includes: goalId, goalType, targetValue, achievedValue, timestamp
   */
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  
  /**
   * Triggered when a user creates a new health goal
   * Payload includes: goalId, goalType, targetValue, startDate, endDate, userId
   */
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  
  /**
   * Triggered when a user updates progress on a health goal
   * Payload includes: goalId, currentValue, previousValue, percentComplete, timestamp
   */
  HEALTH_GOAL_PROGRESS_UPDATED = 'HEALTH_GOAL_PROGRESS_UPDATED',
  
  /**
   * Triggered when the system generates a health insight for a user
   * Payload includes: insightId, insightType, relatedMetrics, recommendation, severity
   */
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',
  
  /**
   * Triggered when a user connects a new health device
   * Payload includes: deviceId, deviceType, manufacturer, connectionDate, userId
   */
  HEALTH_DEVICE_CONNECTED = 'HEALTH_DEVICE_CONNECTED',
  
  /**
   * Triggered when a health device syncs data to the platform
   * Payload includes: deviceId, deviceType, syncDate, metricCount, userId
   */
  HEALTH_DEVICE_SYNCED = 'HEALTH_DEVICE_SYNCED',
  
  /**
   * Triggered when a user completes a health assessment
   * Payload includes: assessmentId, assessmentType, score, completionDate, userId
   */
  HEALTH_ASSESSMENT_COMPLETED = 'HEALTH_ASSESSMENT_COMPLETED',
  
  // ===== CARE JOURNEY EVENTS =====
  
  /**
   * Triggered when a user books a medical appointment
   * Payload includes: appointmentId, providerId, specialtyType, date, time, userId
   */
  CARE_APPOINTMENT_BOOKED = 'CARE_APPOINTMENT_BOOKED',
  
  /**
   * Triggered when a user attends a scheduled appointment
   * Payload includes: appointmentId, providerId, attendanceDate, duration, userId
   */
  CARE_APPOINTMENT_ATTENDED = 'CARE_APPOINTMENT_ATTENDED',
  
  /**
   * Triggered when a user cancels a scheduled appointment
   * Payload includes: appointmentId, providerId, cancellationReason, cancellationDate, userId
   */
  CARE_APPOINTMENT_CANCELLED = 'CARE_APPOINTMENT_CANCELLED',
  
  /**
   * Triggered when a user logs taking medication
   * Payload includes: medicationId, medicationName, dosage, timestamp, adherenceStreak, userId
   */
  CARE_MEDICATION_TAKEN = 'CARE_MEDICATION_TAKEN',
  
  /**
   * Triggered when a user adds a new medication to their regimen
   * Payload includes: medicationId, medicationName, dosage, frequency, startDate, endDate, userId
   */
  CARE_MEDICATION_ADDED = 'CARE_MEDICATION_ADDED',
  
  /**
   * Triggered when a user starts a telemedicine session
   * Payload includes: sessionId, providerId, specialtyType, startTime, userId
   */
  CARE_TELEMEDICINE_STARTED = 'CARE_TELEMEDICINE_STARTED',
  
  /**
   * Triggered when a user completes a telemedicine session
   * Payload includes: sessionId, providerId, duration, endTime, userId
   */
  CARE_TELEMEDICINE_COMPLETED = 'CARE_TELEMEDICINE_COMPLETED',
  
  /**
   * Triggered when a user receives a care plan from a provider
   * Payload includes: planId, providerId, planType, startDate, endDate, userId
   */
  CARE_PLAN_RECEIVED = 'CARE_PLAN_RECEIVED',
  
  /**
   * Triggered when a user completes an item in their care plan
   * Payload includes: planId, itemId, itemType, completionDate, userId
   */
  CARE_PLAN_ITEM_COMPLETED = 'CARE_PLAN_ITEM_COMPLETED',
  
  /**
   * Triggered when a user uses the symptom checker feature
   * Payload includes: checkerId, symptoms, recommendedAction, severity, timestamp, userId
   */
  CARE_SYMPTOM_CHECK_COMPLETED = 'CARE_SYMPTOM_CHECK_COMPLETED',
  
  // ===== PLAN JOURNEY EVENTS =====
  
  /**
   * Triggered when a user submits an insurance claim
   * Payload includes: claimId, claimType, amount, serviceDate, submissionDate, userId
   */
  PLAN_CLAIM_SUBMITTED = 'PLAN_CLAIM_SUBMITTED',
  
  /**
   * Triggered when an insurance claim is approved
   * Payload includes: claimId, approvalDate, approvedAmount, paymentDate, userId
   */
  PLAN_CLAIM_APPROVED = 'PLAN_CLAIM_APPROVED',
  
  /**
   * Triggered when a user views their benefit information
   * Payload includes: benefitId, benefitType, viewDate, userId
   */
  PLAN_BENEFIT_VIEWED = 'PLAN_BENEFIT_VIEWED',
  
  /**
   * Triggered when a user utilizes a benefit
   * Payload includes: benefitId, benefitType, utilizationDate, provider, userId
   */
  PLAN_BENEFIT_UTILIZED = 'PLAN_BENEFIT_UTILIZED',
  
  /**
   * Triggered when a user selects a new insurance plan
   * Payload includes: planId, planType, coverageLevel, startDate, selectionDate, userId
   */
  PLAN_SELECTED = 'PLAN_SELECTED',
  
  /**
   * Triggered when a user compares insurance plans
   * Payload includes: planIds, comparisonDate, selectedFilters, userId
   */
  PLAN_COMPARISON_PERFORMED = 'PLAN_COMPARISON_PERFORMED',
  
  /**
   * Triggered when a user uploads a document related to their plan
   * Payload includes: documentId, documentType, uploadDate, fileSize, userId
   */
  PLAN_DOCUMENT_UPLOADED = 'PLAN_DOCUMENT_UPLOADED',
  
  /**
   * Triggered when a user redeems a reward
   * Payload includes: rewardId, rewardType, pointsCost, redemptionDate, userId
   */
  PLAN_REWARD_REDEEMED = 'PLAN_REWARD_REDEEMED',
  
  // ===== CROSS-JOURNEY EVENTS =====
  
  /**
   * Triggered when a user completes their profile information
   * Payload includes: completionDate, fieldsCompleted, percentComplete, userId
   */
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  
  /**
   * Triggered when a user earns an achievement
   * Payload includes: achievementId, achievementType, earnedDate, xpAwarded, userId
   */
  ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',
  
  /**
   * Triggered when a user completes a quest/challenge
   * Payload includes: questId, questType, completionDate, rewardId, userId
   */
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  
  /**
   * Triggered when a user levels up in the gamification system
   * Payload includes: oldLevel, newLevel, xpTotal, levelUpDate, userId
   */
  LEVEL_UP = 'LEVEL_UP',
  
  /**
   * Triggered when a user completes their first action in a journey
   * Payload includes: journeyType, actionType, completionDate, userId
   */
  JOURNEY_STARTED = 'JOURNEY_STARTED',
  
  /**
   * Triggered when a user completes a significant milestone in a journey
   * Payload includes: journeyType, milestoneId, milestoneType, completionDate, userId
   */
  JOURNEY_MILESTONE_REACHED = 'JOURNEY_MILESTONE_REACHED'
}

/**
 * Namespace containing event categories by journey to facilitate filtering and processing
 */
export namespace EventCategories {
  /**
   * Health journey event types
   */
  export const HEALTH_EVENTS = [
    EventType.HEALTH_METRIC_RECORDED,
    EventType.HEALTH_GOAL_ACHIEVED,
    EventType.HEALTH_GOAL_CREATED,
    EventType.HEALTH_GOAL_PROGRESS_UPDATED,
    EventType.HEALTH_INSIGHT_GENERATED,
    EventType.HEALTH_DEVICE_CONNECTED,
    EventType.HEALTH_DEVICE_SYNCED,
    EventType.HEALTH_ASSESSMENT_COMPLETED
  ];

  /**
   * Care journey event types
   */
  export const CARE_EVENTS = [
    EventType.CARE_APPOINTMENT_BOOKED,
    EventType.CARE_APPOINTMENT_ATTENDED,
    EventType.CARE_APPOINTMENT_CANCELLED,
    EventType.CARE_MEDICATION_TAKEN,
    EventType.CARE_MEDICATION_ADDED,
    EventType.CARE_TELEMEDICINE_STARTED,
    EventType.CARE_TELEMEDICINE_COMPLETED,
    EventType.CARE_PLAN_RECEIVED,
    EventType.CARE_PLAN_ITEM_COMPLETED,
    EventType.CARE_SYMPTOM_CHECK_COMPLETED
  ];

  /**
   * Plan journey event types
   */
  export const PLAN_EVENTS = [
    EventType.PLAN_CLAIM_SUBMITTED,
    EventType.PLAN_CLAIM_APPROVED,
    EventType.PLAN_BENEFIT_VIEWED,
    EventType.PLAN_BENEFIT_UTILIZED,
    EventType.PLAN_SELECTED,
    EventType.PLAN_COMPARISON_PERFORMED,
    EventType.PLAN_DOCUMENT_UPLOADED,
    EventType.PLAN_REWARD_REDEEMED
  ];

  /**
   * Cross-journey event types that apply to multiple journeys
   */
  export const CROSS_JOURNEY_EVENTS = [
    EventType.PROFILE_COMPLETED,
    EventType.ACHIEVEMENT_EARNED,
    EventType.QUEST_COMPLETED,
    EventType.LEVEL_UP,
    EventType.JOURNEY_STARTED,
    EventType.JOURNEY_MILESTONE_REACHED
  ];

  /**
   * All gamification-related events that trigger points, achievements, or rewards
   */
  export const GAMIFICATION_EVENTS = [
    EventType.HEALTH_GOAL_ACHIEVED,
    EventType.HEALTH_DEVICE_CONNECTED,
    EventType.HEALTH_ASSESSMENT_COMPLETED,
    EventType.CARE_APPOINTMENT_ATTENDED,
    EventType.CARE_MEDICATION_TAKEN,
    EventType.CARE_TELEMEDICINE_COMPLETED,
    EventType.CARE_PLAN_ITEM_COMPLETED,
    EventType.PLAN_CLAIM_SUBMITTED,
    EventType.PLAN_BENEFIT_UTILIZED,
    EventType.PLAN_DOCUMENT_UPLOADED,
    EventType.ACHIEVEMENT_EARNED,
    EventType.QUEST_COMPLETED,
    EventType.LEVEL_UP,
    EventType.JOURNEY_MILESTONE_REACHED
  ];
}