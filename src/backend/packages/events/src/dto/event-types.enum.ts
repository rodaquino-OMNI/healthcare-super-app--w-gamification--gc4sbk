/**
 * Comprehensive enum of all event types supported by the AUSTA SuperApp.
 * 
 * This enum centralizes all event type constants, providing type-safe references
 * to event types across health, care, and plan journeys. Events are organized by
 * journey and category to improve code organization and maintainability.
 * 
 * Using this enum instead of string literals ensures consistent naming,
 * prevents typos, enables autocomplete, and facilitates static analysis
 * of event processing logic.
 */
export enum EventTypes {
  // =========================================================================
  // HEALTH JOURNEY EVENTS
  // =========================================================================
  
  /**
   * Triggered when a user records a new health metric (weight, blood pressure, etc.)
   * 
   * Payload includes:
   * - metricType: string (e.g., 'weight', 'blood_pressure', 'heart_rate')
   * - value: number
   * - unit: string
   * - timestamp: ISO date string
   * - deviceId?: string (optional source device identifier)
   */
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  
  /**
   * Triggered when a user connects a new health tracking device
   * 
   * Payload includes:
   * - deviceId: string
   * - deviceType: string
   * - manufacturer: string
   * - model: string
   * - connectionTimestamp: ISO date string
   */
  HEALTH_DEVICE_CONNECTED = 'HEALTH_DEVICE_CONNECTED',
  
  /**
   * Triggered when a user disconnects a health tracking device
   * 
   * Payload includes:
   * - deviceId: string
   * - disconnectionTimestamp: ISO date string
   * - reason?: string (optional reason for disconnection)
   */
  HEALTH_DEVICE_DISCONNECTED = 'HEALTH_DEVICE_DISCONNECTED',
  
  /**
   * Triggered when a user creates a new health goal
   * 
   * Payload includes:
   * - goalId: string
   * - goalType: string (e.g., 'weight_loss', 'steps', 'exercise_minutes')
   * - targetValue: number
   * - unit: string
   * - startDate: ISO date string
   * - endDate: ISO date string
   * - currentValue?: number (optional starting value)
   */
  HEALTH_GOAL_CREATED = 'HEALTH_GOAL_CREATED',
  
  /**
   * Triggered when a user updates progress toward a health goal
   * 
   * Payload includes:
   * - goalId: string
   * - previousValue: number
   * - newValue: number
   * - percentComplete: number
   * - updateTimestamp: ISO date string
   */
  HEALTH_GOAL_UPDATED = 'HEALTH_GOAL_UPDATED',
  
  /**
   * Triggered when a user achieves a health goal
   * 
   * Payload includes:
   * - goalId: string
   * - goalType: string
   * - achievedValue: number
   * - targetValue: number
   * - achievementTimestamp: ISO date string
   * - daysToAchieve: number
   */
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  
  /**
   * Triggered when a user syncs health data from an external source
   * 
   * Payload includes:
   * - sourceType: string (e.g., 'apple_health', 'google_fit', 'fitbit')
   * - dataTypes: string[] (types of data synced)
   * - recordCount: number (number of records synced)
   * - syncTimestamp: ISO date string
   */
  HEALTH_DATA_SYNCED = 'HEALTH_DATA_SYNCED',
  
  /**
   * Triggered when a user views their health insights dashboard
   * 
   * Payload includes:
   * - viewTimestamp: ISO date string
   * - insightTypes: string[] (types of insights viewed)
   * - deviceType: string (device used to view insights)
   */
  HEALTH_INSIGHTS_VIEWED = 'HEALTH_INSIGHTS_VIEWED',
  
  /**
   * Triggered when a new health insight is generated for a user
   * 
   * Payload includes:
   * - insightId: string
   * - insightType: string
   * - severity: string (e.g., 'info', 'warning', 'critical')
   * - relatedMetrics: string[]
   * - generationTimestamp: ISO date string
   */
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',
  
  // =========================================================================
  // CARE JOURNEY EVENTS
  // =========================================================================
  
  /**
   * Triggered when a user books a medical appointment
   * 
   * Payload includes:
   * - appointmentId: string
   * - providerId: string
   * - specialtyType: string
   * - appointmentType: string (e.g., 'in_person', 'telemedicine')
   * - scheduledTime: ISO date string
   * - bookingTimestamp: ISO date string
   */
  CARE_APPOINTMENT_BOOKED = 'CARE_APPOINTMENT_BOOKED',
  
  /**
   * Triggered when a user cancels a medical appointment
   * 
   * Payload includes:
   * - appointmentId: string
   * - cancellationTimestamp: ISO date string
   * - reason?: string (optional reason for cancellation)
   * - rescheduled: boolean (whether appointment was rescheduled)
   */
  CARE_APPOINTMENT_CANCELLED = 'CARE_APPOINTMENT_CANCELLED',
  
  /**
   * Triggered when a user completes a medical appointment
   * 
   * Payload includes:
   * - appointmentId: string
   * - providerId: string
   * - completionTimestamp: ISO date string
   * - duration: number (in minutes)
   * - followUpRequired: boolean
   */
  CARE_APPOINTMENT_COMPLETED = 'CARE_APPOINTMENT_COMPLETED',
  
  /**
   * Triggered when a user adds a medication to their profile
   * 
   * Payload includes:
   * - medicationId: string
   * - medicationName: string
   * - dosage: string
   * - frequency: string
   * - startDate: ISO date string
   * - endDate?: ISO date string (optional end date)
   * - prescribedBy?: string (optional provider ID)
   */
  CARE_MEDICATION_ADDED = 'CARE_MEDICATION_ADDED',
  
  /**
   * Triggered when a user logs taking a medication
   * 
   * Payload includes:
   * - medicationId: string
   * - timestamp: ISO date string
   * - takenOnSchedule: boolean
   * - dosageTaken: string
   */
  CARE_MEDICATION_TAKEN = 'CARE_MEDICATION_TAKEN',
  
  /**
   * Triggered when a user misses a scheduled medication
   * 
   * Payload includes:
   * - medicationId: string
   * - scheduledTime: ISO date string
   * - reportedTimestamp: ISO date string
   * - reason?: string (optional reason for missing)
   */
  CARE_MEDICATION_MISSED = 'CARE_MEDICATION_MISSED',
  
  /**
   * Triggered when a user starts a telemedicine session
   * 
   * Payload includes:
   * - sessionId: string
   * - appointmentId: string
   * - providerId: string
   * - startTimestamp: ISO date string
   * - deviceType: string
   * - connectionType: string (e.g., 'wifi', 'cellular')
   */
  CARE_TELEMEDICINE_STARTED = 'CARE_TELEMEDICINE_STARTED',
  
  /**
   * Triggered when a user completes a telemedicine session
   * 
   * Payload includes:
   * - sessionId: string
   * - appointmentId: string
   * - endTimestamp: ISO date string
   * - duration: number (in minutes)
   * - connectionQuality: string (e.g., 'excellent', 'good', 'poor')
   */
  CARE_TELEMEDICINE_COMPLETED = 'CARE_TELEMEDICINE_COMPLETED',
  
  /**
   * Triggered when a user searches for a healthcare provider
   * 
   * Payload includes:
   * - searchTimestamp: ISO date string
   * - specialtyType?: string (optional specialty filter)
   * - locationData?: object (optional location filter)
   * - insuranceFilter?: string (optional insurance filter)
   * - resultCount: number
   */
  CARE_PROVIDER_SEARCHED = 'CARE_PROVIDER_SEARCHED',
  
  /**
   * Triggered when a user views a provider's profile
   * 
   * Payload includes:
   * - providerId: string
   * - specialtyType: string
   * - viewTimestamp: ISO date string
   * - viewDuration?: number (optional time spent viewing profile in seconds)
   */
  CARE_PROVIDER_VIEWED = 'CARE_PROVIDER_VIEWED',
  
  // =========================================================================
  // PLAN JOURNEY EVENTS
  // =========================================================================
  
  /**
   * Triggered when a user submits an insurance claim
   * 
   * Payload includes:
   * - claimId: string
   * - claimType: string (e.g., 'medical', 'dental', 'vision')
   * - serviceDate: ISO date string
   * - providerId: string
   * - amount: number
   * - submissionTimestamp: ISO date string
   */
  PLAN_CLAIM_SUBMITTED = 'PLAN_CLAIM_SUBMITTED',
  
  /**
   * Triggered when an insurance claim status changes
   * 
   * Payload includes:
   * - claimId: string
   * - previousStatus: string
   * - newStatus: string (e.g., 'submitted', 'under_review', 'approved', 'denied')
   * - updateTimestamp: ISO date string
   * - reason?: string (optional reason for status change)
   */
  PLAN_CLAIM_STATUS_UPDATED = 'PLAN_CLAIM_STATUS_UPDATED',
  
  /**
   * Triggered when a user views their insurance coverage details
   * 
   * Payload includes:
   * - coverageType: string (e.g., 'medical', 'dental', 'vision')
   * - planId: string
   * - viewTimestamp: ISO date string
   * - viewDuration?: number (optional time spent viewing in seconds)
   */
  PLAN_COVERAGE_VIEWED = 'PLAN_COVERAGE_VIEWED',
  
  /**
   * Triggered when a user views their insurance benefits
   * 
   * Payload includes:
   * - benefitCategories: string[] (categories of benefits viewed)
   * - planId: string
   * - viewTimestamp: ISO date string
   * - viewDuration?: number (optional time spent viewing in seconds)
   */
  PLAN_BENEFITS_VIEWED = 'PLAN_BENEFITS_VIEWED',
  
  /**
   * Triggered when a user utilizes an insurance benefit
   * 
   * Payload includes:
   * - benefitId: string
   * - benefitType: string
   * - utilizationTimestamp: ISO date string
   * - providerId?: string (optional provider associated with benefit)
   * - savingsAmount?: number (optional amount saved by using benefit)
   */
  PLAN_BENEFIT_UTILIZED = 'PLAN_BENEFIT_UTILIZED',
  
  /**
   * Triggered when a user compares insurance plans
   * 
   * Payload includes:
   * - planIds: string[] (IDs of plans being compared)
   * - comparisonTimestamp: ISO date string
   * - comparisonDuration?: number (optional time spent comparing in seconds)
   * - selectedPlanId?: string (optional ID of plan selected after comparison)
   */
  PLAN_COMPARISON_PERFORMED = 'PLAN_COMPARISON_PERFORMED',
  
  /**
   * Triggered when a user uploads a document related to their insurance
   * 
   * Payload includes:
   * - documentId: string
   * - documentType: string (e.g., 'receipt', 'medical_record', 'prescription')
   * - relatedEntityId?: string (optional ID of related entity like a claim)
   * - uploadTimestamp: ISO date string
   * - fileSize: number (in bytes)
   */
  PLAN_DOCUMENT_UPLOADED = 'PLAN_DOCUMENT_UPLOADED',
  
  /**
   * Triggered when a user downloads a document related to their insurance
   * 
   * Payload includes:
   * - documentId: string
   * - documentType: string
   * - downloadTimestamp: ISO date string
   */
  PLAN_DOCUMENT_DOWNLOADED = 'PLAN_DOCUMENT_DOWNLOADED',
  
  // =========================================================================
  // CROSS-JOURNEY EVENTS
  // =========================================================================
  
  /**
   * Triggered when a user completes their profile setup
   * 
   * Payload includes:
   * - completionTimestamp: ISO date string
   * - completedSections: string[] (sections of profile completed)
   * - profileCompleteness: number (percentage of profile completed)
   */
  USER_PROFILE_COMPLETED = 'USER_PROFILE_COMPLETED',
  
  /**
   * Triggered when a user updates their profile information
   * 
   * Payload includes:
   * - updateTimestamp: ISO date string
   * - updatedFields: string[] (fields that were updated)
   */
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  
  /**
   * Triggered when a user completes a journey-specific onboarding flow
   * 
   * Payload includes:
   * - journeyType: string (e.g., 'health', 'care', 'plan')
   * - completionTimestamp: ISO date string
   * - completedSteps: string[] (steps completed in onboarding)
   */
  JOURNEY_ONBOARDING_COMPLETED = 'JOURNEY_ONBOARDING_COMPLETED',
  
  /**
   * Triggered when a user provides feedback on any feature
   * 
   * Payload includes:
   * - feedbackId: string
   * - featureType: string
   * - journeyType: string (e.g., 'health', 'care', 'plan')
   * - rating: number
   * - comments?: string (optional text feedback)
   * - submissionTimestamp: ISO date string
   */
  USER_FEEDBACK_SUBMITTED = 'USER_FEEDBACK_SUBMITTED',
  
  /**
   * Triggered when a user shares content from the app
   * 
   * Payload includes:
   * - contentType: string (type of content shared)
   * - contentId: string
   * - shareMethod: string (e.g., 'email', 'sms', 'social')
   * - shareTimestamp: ISO date string
   */
  CONTENT_SHARED = 'CONTENT_SHARED',
  
  /**
   * Triggered when a user completes a survey
   * 
   * Payload includes:
   * - surveyId: string
   * - surveyType: string
   * - completionTimestamp: ISO date string
   * - questionCount: number
   * - timeToComplete: number (in seconds)
   */
  SURVEY_COMPLETED = 'SURVEY_COMPLETED'
}