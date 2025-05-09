/**
 * @file error-codes.ts
 * @description Defines all error codes used throughout the Care journey.
 * These codes provide a consistent error identification system that enables
 * precise error tracking, documentation, and localization.
 * 
 * Error codes follow the pattern: CARE_[DOMAIN]_[TYPE][NUMBER]
 * - DOMAIN: Specific domain within the Care journey (APPT, PROV, TELE, MED, SYMP, TREAT)
 * - TYPE: Error type (V=Validation, B=Business, T=Technical, E=External)
 * - NUMBER: Three-digit error number
 */

/**
 * ------------------------------------------------
 * APPOINTMENTS DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to appointment scheduling and management
 */

/**
 * Validation error codes for the Appointments domain
 * Used when input data fails validation requirements
 */
export const CARE_APPT_VALIDATION_ERRORS = {
  /** Invalid appointment ID format */
  INVALID_APPOINTMENT_ID: 'CARE_APPT_V001',
  
  /** Missing required appointment information */
  MISSING_APPOINTMENT_INFO: 'CARE_APPT_V002',
  
  /** Invalid appointment type */
  INVALID_APPOINTMENT_TYPE: 'CARE_APPT_V003',
  
  /** Invalid appointment date/time */
  INVALID_APPOINTMENT_DATETIME: 'CARE_APPT_V004',
  
  /** Invalid appointment duration */
  INVALID_DURATION: 'CARE_APPT_V005',
  
  /** Invalid provider ID */
  INVALID_PROVIDER_ID: 'CARE_APPT_V006',
  
  /** Invalid appointment status */
  INVALID_STATUS: 'CARE_APPT_V007',
  
  /** Invalid reason for appointment */
  INVALID_REASON: 'CARE_APPT_V008',
  
  /** Invalid notes format */
  INVALID_NOTES: 'CARE_APPT_V009',
  
  /** Invalid cancellation reason */
  INVALID_CANCELLATION_REASON: 'CARE_APPT_V010'
};

/**
 * Business logic error codes for the Appointments domain
 * Used when an operation cannot be completed due to business rules
 */
export const CARE_APPT_BUSINESS_ERRORS = {
  /** Appointment not found */
  APPOINTMENT_NOT_FOUND: 'CARE_APPT_B001',
  
  /** Provider not available at requested time */
  PROVIDER_NOT_AVAILABLE: 'CARE_APPT_B002',
  
  /** Appointment scheduling failed */
  SCHEDULING_FAILED: 'CARE_APPT_B003',
  
  /** Appointment in the past */
  APPOINTMENT_IN_PAST: 'CARE_APPT_B004',
  
  /** User not eligible for appointment type */
  USER_NOT_ELIGIBLE: 'CARE_APPT_B005',
  
  /** Appointment already booked for this time slot */
  TIME_SLOT_UNAVAILABLE: 'CARE_APPT_B006',
  
  /** Appointment cancellation failed */
  CANCELLATION_FAILED: 'CARE_APPT_B007',
  
  /** Appointment rescheduling failed */
  RESCHEDULING_FAILED: 'CARE_APPT_B008',
  
  /** Appointment modification not allowed */
  MODIFICATION_NOT_ALLOWED: 'CARE_APPT_B009',
  
  /** Maximum advance booking window exceeded */
  MAX_ADVANCE_EXCEEDED: 'CARE_APPT_B010',
  
  /** Minimum notice period for cancellation not met */
  MIN_CANCELLATION_NOTICE: 'CARE_APPT_B011',
  
  /** User has conflicting appointment */
  USER_CONFLICT: 'CARE_APPT_B012'
};

/**
 * Technical error codes for the Appointments domain
 * Used for unexpected system errors and exceptions
 */
export const CARE_APPT_TECHNICAL_ERRORS = {
  /** Database error when retrieving appointment */
  DATABASE_RETRIEVAL_ERROR: 'CARE_APPT_T001',
  
  /** Database error when saving appointment */
  DATABASE_SAVE_ERROR: 'CARE_APPT_T002',
  
  /** Error in appointment scheduling logic */
  SCHEDULING_ERROR: 'CARE_APPT_T003',
  
  /** Error in appointment search indexing */
  SEARCH_INDEXING_ERROR: 'CARE_APPT_T004',
  
  /** Cache error for appointment data */
  CACHE_ERROR: 'CARE_APPT_T005',
  
  /** Transaction error during appointment operations */
  TRANSACTION_ERROR: 'CARE_APPT_T006',
  
  /** Error in appointment data migration */
  MIGRATION_ERROR: 'CARE_APPT_T007',
  
  /** Serialization error for appointment data */
  SERIALIZATION_ERROR: 'CARE_APPT_T008',
  
  /** Error in appointment notification processing */
  NOTIFICATION_ERROR: 'CARE_APPT_T009',
  
  /** Error in calendar integration */
  CALENDAR_INTEGRATION_ERROR: 'CARE_APPT_T010'
};

/**
 * External system error codes for the Appointments domain
 * Used for failures in external services or dependencies
 */
export const CARE_APPT_EXTERNAL_ERRORS = {
  /** Provider calendar API error */
  PROVIDER_CALENDAR_ERROR: 'CARE_APPT_E001',
  
  /** Provider calendar API timeout */
  PROVIDER_CALENDAR_TIMEOUT: 'CARE_APPT_E002',
  
  /** Error retrieving provider availability */
  AVAILABILITY_RETRIEVAL_ERROR: 'CARE_APPT_E003',
  
  /** Error in notification service */
  NOTIFICATION_SERVICE_ERROR: 'CARE_APPT_E004',
  
  /** Error in calendar synchronization service */
  CALENDAR_SYNC_ERROR: 'CARE_APPT_E005',
  
  /** Error in reminder service */
  REMINDER_SERVICE_ERROR: 'CARE_APPT_E006',
  
  /** Error in telemedicine integration */
  TELEMEDICINE_INTEGRATION_ERROR: 'CARE_APPT_E007',
  
  /** Error in facility booking service */
  FACILITY_BOOKING_ERROR: 'CARE_APPT_E008',
  
  /** Error in gamification service */
  GAMIFICATION_SERVICE_ERROR: 'CARE_APPT_E009',
  
  /** Error in electronic health record integration */
  EHR_INTEGRATION_ERROR: 'CARE_APPT_E010'
};

/**
 * ------------------------------------------------
 * PROVIDERS DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to healthcare providers management
 */

/**
 * Validation error codes for the Providers domain
 * Used when input data fails validation requirements
 */
export const CARE_PROV_VALIDATION_ERRORS = {
  /** Invalid provider ID format */
  INVALID_PROVIDER_ID: 'CARE_PROV_V001',
  
  /** Missing required provider information */
  MISSING_PROVIDER_INFO: 'CARE_PROV_V002',
  
  /** Invalid provider specialty */
  INVALID_SPECIALTY: 'CARE_PROV_V003',
  
  /** Invalid provider location */
  INVALID_LOCATION: 'CARE_PROV_V004',
  
  /** Invalid contact information */
  INVALID_CONTACT_INFO: 'CARE_PROV_V005',
  
  /** Invalid availability schedule */
  INVALID_AVAILABILITY: 'CARE_PROV_V006',
  
  /** Invalid telemedicine capability flag */
  INVALID_TELEMEDICINE_FLAG: 'CARE_PROV_V007',
  
  /** Invalid provider credentials */
  INVALID_CREDENTIALS: 'CARE_PROV_V008',
  
  /** Invalid provider rating */
  INVALID_RATING: 'CARE_PROV_V009',
  
  /** Invalid search parameters */
  INVALID_SEARCH_PARAMS: 'CARE_PROV_V010'
};

/**
 * Business logic error codes for the Providers domain
 * Used when an operation cannot be completed due to business rules
 */
export const CARE_PROV_BUSINESS_ERRORS = {
  /** Provider not found */
  PROVIDER_NOT_FOUND: 'CARE_PROV_B001',
  
  /** Provider not available */
  PROVIDER_NOT_AVAILABLE: 'CARE_PROV_B002',
  
  /** Provider not accepting new patients */
  NOT_ACCEPTING_PATIENTS: 'CARE_PROV_B003',
  
  /** Provider does not offer requested service */
  SERVICE_NOT_OFFERED: 'CARE_PROV_B004',
  
  /** Provider not available for telemedicine */
  TELEMEDICINE_NOT_AVAILABLE: 'CARE_PROV_B005',
  
  /** Provider has active appointments */
  HAS_ACTIVE_APPOINTMENTS: 'CARE_PROV_B006',
  
  /** Provider schedule conflict */
  SCHEDULE_CONFLICT: 'CARE_PROV_B007',
  
  /** Provider not in user's network */
  NOT_IN_NETWORK: 'CARE_PROV_B008',
  
  /** Provider verification failed */
  VERIFICATION_FAILED: 'CARE_PROV_B009',
  
  /** No providers match search criteria */
  NO_MATCHING_PROVIDERS: 'CARE_PROV_B010'
};

/**
 * Technical error codes for the Providers domain
 * Used for unexpected system errors and exceptions
 */
export const CARE_PROV_TECHNICAL_ERRORS = {
  /** Database error when retrieving provider */
  DATABASE_RETRIEVAL_ERROR: 'CARE_PROV_T001',
  
  /** Database error when saving provider */
  DATABASE_SAVE_ERROR: 'CARE_PROV_T002',
  
  /** Error in provider search indexing */
  SEARCH_INDEXING_ERROR: 'CARE_PROV_T003',
  
  /** Cache error for provider data */
  CACHE_ERROR: 'CARE_PROV_T004',
  
  /** Transaction error during provider operations */
  TRANSACTION_ERROR: 'CARE_PROV_T005',
  
  /** Error in provider data migration */
  MIGRATION_ERROR: 'CARE_PROV_T006',
  
  /** Serialization error for provider data */
  SERIALIZATION_ERROR: 'CARE_PROV_T007',
  
  /** Error in provider availability calculation */
  AVAILABILITY_CALCULATION_ERROR: 'CARE_PROV_T008',
  
  /** Error in provider notification processing */
  NOTIFICATION_ERROR: 'CARE_PROV_T009',
  
  /** Error in provider rating calculation */
  RATING_CALCULATION_ERROR: 'CARE_PROV_T010'
};

/**
 * External system error codes for the Providers domain
 * Used for failures in external services or dependencies
 */
export const CARE_PROV_EXTERNAL_ERRORS = {
  /** Provider directory API error */
  DIRECTORY_API_ERROR: 'CARE_PROV_E001',
  
  /** Provider directory API timeout */
  DIRECTORY_API_TIMEOUT: 'CARE_PROV_E002',
  
  /** Error retrieving provider credentials */
  CREDENTIALS_RETRIEVAL_ERROR: 'CARE_PROV_E003',
  
  /** Error in provider verification service */
  VERIFICATION_SERVICE_ERROR: 'CARE_PROV_E004',
  
  /** Error in provider network service */
  NETWORK_SERVICE_ERROR: 'CARE_PROV_E005',
  
  /** Error in provider scheduling service */
  SCHEDULING_SERVICE_ERROR: 'CARE_PROV_E006',
  
  /** Error in provider rating service */
  RATING_SERVICE_ERROR: 'CARE_PROV_E007',
  
  /** Error in provider location service */
  LOCATION_SERVICE_ERROR: 'CARE_PROV_E008',
  
  /** Error in regulatory compliance service */
  COMPLIANCE_SERVICE_ERROR: 'CARE_PROV_E009',
  
  /** Error in provider specialty validation */
  SPECIALTY_VALIDATION_ERROR: 'CARE_PROV_E010'
};

/**
 * ------------------------------------------------
 * TELEMEDICINE DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to telemedicine sessions
 */

/**
 * Validation error codes for the Telemedicine domain
 * Used when input data fails validation requirements
 */
export const CARE_TELE_VALIDATION_ERRORS = {
  /** Invalid session ID format */
  INVALID_SESSION_ID: 'CARE_TELE_V001',
  
  /** Missing required session information */
  MISSING_SESSION_INFO: 'CARE_TELE_V002',
  
  /** Invalid appointment ID for session */
  INVALID_APPOINTMENT_ID: 'CARE_TELE_V003',
  
  /** Invalid session type */
  INVALID_SESSION_TYPE: 'CARE_TELE_V004',
  
  /** Invalid session duration */
  INVALID_DURATION: 'CARE_TELE_V005',
  
  /** Invalid participant information */
  INVALID_PARTICIPANT_INFO: 'CARE_TELE_V006',
  
  /** Invalid session status */
  INVALID_STATUS: 'CARE_TELE_V007',
  
  /** Invalid recording settings */
  INVALID_RECORDING_SETTINGS: 'CARE_TELE_V008',
  
  /** Invalid session notes */
  INVALID_SESSION_NOTES: 'CARE_TELE_V009',
  
  /** Invalid technical requirements */
  INVALID_TECHNICAL_REQUIREMENTS: 'CARE_TELE_V010'
};

/**
 * Business logic error codes for the Telemedicine domain
 * Used when an operation cannot be completed due to business rules
 */
export const CARE_TELE_BUSINESS_ERRORS = {
  /** Session not found */
  SESSION_NOT_FOUND: 'CARE_TELE_B001',
  
  /** Provider not available for telemedicine */
  PROVIDER_NOT_AVAILABLE: 'CARE_TELE_B002',
  
  /** Session creation failed */
  SESSION_CREATION_FAILED: 'CARE_TELE_B003',
  
  /** Session already in progress */
  SESSION_IN_PROGRESS: 'CARE_TELE_B004',
  
  /** Session already completed */
  SESSION_COMPLETED: 'CARE_TELE_B005',
  
  /** Session not started yet */
  SESSION_NOT_STARTED: 'CARE_TELE_B006',
  
  /** Session cancellation failed */
  CANCELLATION_FAILED: 'CARE_TELE_B007',
  
  /** Session extension not allowed */
  EXTENSION_NOT_ALLOWED: 'CARE_TELE_B008',
  
  /** Maximum session duration exceeded */
  MAX_DURATION_EXCEEDED: 'CARE_TELE_B009',
  
  /** User not authorized for session */
  USER_NOT_AUTHORIZED: 'CARE_TELE_B010',
  
  /** Recording consent not provided */
  RECORDING_CONSENT_MISSING: 'CARE_TELE_B011',
  
  /** Technical requirements not met */
  TECHNICAL_REQUIREMENTS_NOT_MET: 'CARE_TELE_B012'
};

/**
 * Technical error codes for the Telemedicine domain
 * Used for unexpected system errors and exceptions
 */
export const CARE_TELE_TECHNICAL_ERRORS = {
  /** Database error when retrieving session */
  DATABASE_RETRIEVAL_ERROR: 'CARE_TELE_T001',
  
  /** Database error when saving session */
  DATABASE_SAVE_ERROR: 'CARE_TELE_T002',
  
  /** Error in session initialization */
  INITIALIZATION_ERROR: 'CARE_TELE_T003',
  
  /** Error in session token generation */
  TOKEN_GENERATION_ERROR: 'CARE_TELE_T004',
  
  /** Cache error for session data */
  CACHE_ERROR: 'CARE_TELE_T005',
  
  /** Transaction error during session operations */
  TRANSACTION_ERROR: 'CARE_TELE_T006',
  
  /** Error in session recording */
  RECORDING_ERROR: 'CARE_TELE_T007',
  
  /** Serialization error for session data */
  SERIALIZATION_ERROR: 'CARE_TELE_T008',
  
  /** Error in session notification processing */
  NOTIFICATION_ERROR: 'CARE_TELE_T009',
  
  /** Error in session metrics collection */
  METRICS_COLLECTION_ERROR: 'CARE_TELE_T010'
};

/**
 * External system error codes for the Telemedicine domain
 * Used for failures in external services or dependencies
 */
export const CARE_TELE_EXTERNAL_ERRORS = {
  /** Video platform API error */
  VIDEO_PLATFORM_ERROR: 'CARE_TELE_E001',
  
  /** Video platform API timeout */
  VIDEO_PLATFORM_TIMEOUT: 'CARE_TELE_E002',
  
  /** Error in video streaming service */
  STREAMING_SERVICE_ERROR: 'CARE_TELE_E003',
  
  /** Error in recording service */
  RECORDING_SERVICE_ERROR: 'CARE_TELE_E004',
  
  /** Error in audio service */
  AUDIO_SERVICE_ERROR: 'CARE_TELE_E005',
  
  /** Error in screen sharing service */
  SCREEN_SHARING_ERROR: 'CARE_TELE_E006',
  
  /** Error in chat service */
  CHAT_SERVICE_ERROR: 'CARE_TELE_E007',
  
  /** Error in network quality service */
  NETWORK_QUALITY_ERROR: 'CARE_TELE_E008',
  
  /** Error in session analytics service */
  ANALYTICS_SERVICE_ERROR: 'CARE_TELE_E009',
  
  /** Error in electronic health record integration */
  EHR_INTEGRATION_ERROR: 'CARE_TELE_E010'
};

/**
 * ------------------------------------------------
 * MEDICATIONS DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to medication management
 */

/**
 * Validation error codes for the Medications domain
 * Used when input data fails validation requirements
 */
export const CARE_MED_VALIDATION_ERRORS = {
  /** Invalid medication ID format */
  INVALID_MEDICATION_ID: 'CARE_MED_V001',
  
  /** Missing required medication information */
  MISSING_MEDICATION_INFO: 'CARE_MED_V002',
  
  /** Invalid medication name */
  INVALID_NAME: 'CARE_MED_V003',
  
  /** Invalid dosage information */
  INVALID_DOSAGE: 'CARE_MED_V004',
  
  /** Invalid frequency information */
  INVALID_FREQUENCY: 'CARE_MED_V005',
  
  /** Invalid start date */
  INVALID_START_DATE: 'CARE_MED_V006',
  
  /** Invalid end date */
  INVALID_END_DATE: 'CARE_MED_V007',
  
  /** Invalid reminder settings */
  INVALID_REMINDER_SETTINGS: 'CARE_MED_V008',
  
  /** Invalid medication notes */
  INVALID_NOTES: 'CARE_MED_V009',
  
  /** Invalid medication type */
  INVALID_MEDICATION_TYPE: 'CARE_MED_V010'
};

/**
 * Business logic error codes for the Medications domain
 * Used when an operation cannot be completed due to business rules
 */
export const CARE_MED_BUSINESS_ERRORS = {
  /** Medication not found */
  MEDICATION_NOT_FOUND: 'CARE_MED_B001',
  
  /** Medication already exists */
  MEDICATION_ALREADY_EXISTS: 'CARE_MED_B002',
  
  /** Medication creation failed */
  CREATION_FAILED: 'CARE_MED_B003',
  
  /** Medication update failed */
  UPDATE_FAILED: 'CARE_MED_B004',
  
  /** Medication deletion failed */
  DELETION_FAILED: 'CARE_MED_B005',
  
  /** Medication reminder creation failed */
  REMINDER_CREATION_FAILED: 'CARE_MED_B006',
  
  /** Medication adherence tracking failed */
  ADHERENCE_TRACKING_FAILED: 'CARE_MED_B007',
  
  /** Medication interaction detected */
  INTERACTION_DETECTED: 'CARE_MED_B008',
  
  /** Medication refill tracking failed */
  REFILL_TRACKING_FAILED: 'CARE_MED_B009',
  
  /** User not authorized for medication */
  USER_NOT_AUTHORIZED: 'CARE_MED_B010'
};

/**
 * Technical error codes for the Medications domain
 * Used for unexpected system errors and exceptions
 */
export const CARE_MED_TECHNICAL_ERRORS = {
  /** Database error when retrieving medication */
  DATABASE_RETRIEVAL_ERROR: 'CARE_MED_T001',
  
  /** Database error when saving medication */
  DATABASE_SAVE_ERROR: 'CARE_MED_T002',
  
  /** Error in medication search indexing */
  SEARCH_INDEXING_ERROR: 'CARE_MED_T003',
  
  /** Cache error for medication data */
  CACHE_ERROR: 'CARE_MED_T004',
  
  /** Transaction error during medication operations */
  TRANSACTION_ERROR: 'CARE_MED_T005',
  
  /** Error in medication data migration */
  MIGRATION_ERROR: 'CARE_MED_T006',
  
  /** Serialization error for medication data */
  SERIALIZATION_ERROR: 'CARE_MED_T007',
  
  /** Error in reminder scheduling */
  REMINDER_SCHEDULING_ERROR: 'CARE_MED_T008',
  
  /** Error in medication notification processing */
  NOTIFICATION_ERROR: 'CARE_MED_T009',
  
  /** Error in adherence calculation */
  ADHERENCE_CALCULATION_ERROR: 'CARE_MED_T010'
};

/**
 * External system error codes for the Medications domain
 * Used for failures in external services or dependencies
 */
export const CARE_MED_EXTERNAL_ERRORS = {
  /** Medication database API error */
  MEDICATION_DB_ERROR: 'CARE_MED_E001',
  
  /** Medication database API timeout */
  MEDICATION_DB_TIMEOUT: 'CARE_MED_E002',
  
  /** Error in drug interaction service */
  INTERACTION_SERVICE_ERROR: 'CARE_MED_E003',
  
  /** Error in pharmacy integration */
  PHARMACY_INTEGRATION_ERROR: 'CARE_MED_E004',
  
  /** Error in reminder service */
  REMINDER_SERVICE_ERROR: 'CARE_MED_E005',
  
  /** Error in prescription verification service */
  PRESCRIPTION_VERIFICATION_ERROR: 'CARE_MED_E006',
  
  /** Error in medication information service */
  INFORMATION_SERVICE_ERROR: 'CARE_MED_E007',
  
  /** Error in refill service */
  REFILL_SERVICE_ERROR: 'CARE_MED_E008',
  
  /** Error in electronic health record integration */
  EHR_INTEGRATION_ERROR: 'CARE_MED_E009',
  
  /** Error in insurance coverage verification */
  COVERAGE_VERIFICATION_ERROR: 'CARE_MED_E010'
};

/**
 * ------------------------------------------------
 * SYMPTOM CHECKER DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to symptom evaluation
 */

/**
 * Validation error codes for the Symptom Checker domain
 * Used when input data fails validation requirements
 */
export const CARE_SYMP_VALIDATION_ERRORS = {
  /** Invalid symptom format */
  INVALID_SYMPTOM_FORMAT: 'CARE_SYMP_V001',
  
  /** Missing required symptom information */
  MISSING_SYMPTOM_INFO: 'CARE_SYMP_V002',
  
  /** Invalid symptom severity */
  INVALID_SEVERITY: 'CARE_SYMP_V003',
  
  /** Invalid symptom duration */
  INVALID_DURATION: 'CARE_SYMP_V004',
  
  /** Invalid user demographic information */
  INVALID_DEMOGRAPHICS: 'CARE_SYMP_V005',
  
  /** Invalid medical history information */
  INVALID_MEDICAL_HISTORY: 'CARE_SYMP_V006',
  
  /** Invalid symptom location */
  INVALID_LOCATION: 'CARE_SYMP_V007',
  
  /** Invalid symptom characteristics */
  INVALID_CHARACTERISTICS: 'CARE_SYMP_V008',
  
  /** Invalid symptom triggers */
  INVALID_TRIGGERS: 'CARE_SYMP_V009',
  
  /** Invalid symptom alleviating factors */
  INVALID_ALLEVIATING_FACTORS: 'CARE_SYMP_V010'
};

/**
 * Business logic error codes for the Symptom Checker domain
 * Used when an operation cannot be completed due to business rules
 */
export const CARE_SYMP_BUSINESS_ERRORS = {
  /** Symptom check failed */
  SYMPTOM_CHECK_FAILED: 'CARE_SYMP_B001',
  
  /** Emergency symptoms detected */
  EMERGENCY_DETECTED: 'CARE_SYMP_B002',
  
  /** Insufficient symptom information */
  INSUFFICIENT_INFORMATION: 'CARE_SYMP_B003',
  
  /** Symptom not recognized */
  SYMPTOM_NOT_RECOGNIZED: 'CARE_SYMP_B004',
  
  /** Contradictory symptoms provided */
  CONTRADICTORY_SYMPTOMS: 'CARE_SYMP_B005',
  
  /** Too many symptoms provided */
  TOO_MANY_SYMPTOMS: 'CARE_SYMP_B006',
  
  /** Symptom analysis inconclusive */
  ANALYSIS_INCONCLUSIVE: 'CARE_SYMP_B007',
  
  /** User age outside supported range */
  AGE_OUT_OF_RANGE: 'CARE_SYMP_B008',
  
  /** Symptom requires immediate medical attention */
  REQUIRES_IMMEDIATE_ATTENTION: 'CARE_SYMP_B009',
  
  /** Symptom check rate limit exceeded */
  RATE_LIMIT_EXCEEDED: 'CARE_SYMP_B010'
};

/**
 * Technical error codes for the Symptom Checker domain
 * Used for unexpected system errors and exceptions
 */
export const CARE_SYMP_TECHNICAL_ERRORS = {
  /** Database error when retrieving symptom data */
  DATABASE_RETRIEVAL_ERROR: 'CARE_SYMP_T001',
  
  /** Database error when saving symptom check */
  DATABASE_SAVE_ERROR: 'CARE_SYMP_T002',
  
  /** Error in symptom analysis algorithm */
  ANALYSIS_ALGORITHM_ERROR: 'CARE_SYMP_T003',
  
  /** Cache error for symptom data */
  CACHE_ERROR: 'CARE_SYMP_T004',
  
  /** Transaction error during symptom check */
  TRANSACTION_ERROR: 'CARE_SYMP_T005',
  
  /** Error in symptom data migration */
  MIGRATION_ERROR: 'CARE_SYMP_T006',
  
  /** Serialization error for symptom data */
  SERIALIZATION_ERROR: 'CARE_SYMP_T007',
  
  /** Error in symptom pattern recognition */
  PATTERN_RECOGNITION_ERROR: 'CARE_SYMP_T008',
  
  /** Error in symptom notification processing */
  NOTIFICATION_ERROR: 'CARE_SYMP_T009',
  
  /** Error in symptom history tracking */
  HISTORY_TRACKING_ERROR: 'CARE_SYMP_T010'
};

/**
 * External system error codes for the Symptom Checker domain
 * Used for failures in external services or dependencies
 */
export const CARE_SYMP_EXTERNAL_ERRORS = {
  /** Symptom checker API error */
  SYMPTOM_CHECKER_API_ERROR: 'CARE_SYMP_E001',
  
  /** Symptom checker API timeout */
  SYMPTOM_CHECKER_API_TIMEOUT: 'CARE_SYMP_E002',
  
  /** Error in medical knowledge base */
  KNOWLEDGE_BASE_ERROR: 'CARE_SYMP_E003',
  
  /** Error in emergency service integration */
  EMERGENCY_SERVICE_ERROR: 'CARE_SYMP_E004',
  
  /** Error in medical terminology service */
  TERMINOLOGY_SERVICE_ERROR: 'CARE_SYMP_E005',
  
  /** Error in triage service */
  TRIAGE_SERVICE_ERROR: 'CARE_SYMP_E006',
  
  /** Error in recommendation engine */
  RECOMMENDATION_ENGINE_ERROR: 'CARE_SYMP_E007',
  
  /** Error in health condition database */
  CONDITION_DATABASE_ERROR: 'CARE_SYMP_E008',
  
  /** Error in electronic health record integration */
  EHR_INTEGRATION_ERROR: 'CARE_SYMP_E009',
  
  /** Error in machine learning model */
  ML_MODEL_ERROR: 'CARE_SYMP_E010'
};

/**
 * ------------------------------------------------
 * TREATMENTS DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to treatment plans
 */

/**
 * Validation error codes for the Treatments domain
 * Used when input data fails validation requirements
 */
export const CARE_TREAT_VALIDATION_ERRORS = {
  /** Invalid treatment plan ID format */
  INVALID_PLAN_ID: 'CARE_TREAT_V001',
  
  /** Missing required treatment plan information */
  MISSING_PLAN_INFO: 'CARE_TREAT_V002',
  
  /** Invalid treatment type */
  INVALID_TREATMENT_TYPE: 'CARE_TREAT_V003',
  
  /** Invalid treatment dates */
  INVALID_TREATMENT_DATES: 'CARE_TREAT_V004',
  
  /** Invalid treatment activity */
  INVALID_ACTIVITY: 'CARE_TREAT_V005',
  
  /** Invalid treatment frequency */
  INVALID_FREQUENCY: 'CARE_TREAT_V006',
  
  /** Invalid treatment progress value */
  INVALID_PROGRESS: 'CARE_TREAT_V007',
  
  /** Invalid treatment notes */
  INVALID_NOTES: 'CARE_TREAT_V008',
  
  /** Invalid treatment goal */
  INVALID_GOAL: 'CARE_TREAT_V009',
  
  /** Invalid treatment reminder settings */
  INVALID_REMINDER_SETTINGS: 'CARE_TREAT_V010'
};

/**
 * Business logic error codes for the Treatments domain
 * Used when an operation cannot be completed due to business rules
 */
export const CARE_TREAT_BUSINESS_ERRORS = {
  /** Treatment plan not found */
  PLAN_NOT_FOUND: 'CARE_TREAT_B001',
  
  /** Treatment plan creation failed */
  PLAN_CREATION_FAILED: 'CARE_TREAT_B002',
  
  /** Treatment plan update failed */
  PLAN_UPDATE_FAILED: 'CARE_TREAT_B003',
  
  /** Treatment plan already exists */
  PLAN_ALREADY_EXISTS: 'CARE_TREAT_B004',
  
  /** Treatment activity not found */
  ACTIVITY_NOT_FOUND: 'CARE_TREAT_B005',
  
  /** Treatment progress update failed */
  PROGRESS_UPDATE_FAILED: 'CARE_TREAT_B006',
  
  /** Treatment plan completion failed */
  COMPLETION_FAILED: 'CARE_TREAT_B007',
  
  /** Treatment plan cancellation failed */
  CANCELLATION_FAILED: 'CARE_TREAT_B008',
  
  /** User not authorized for treatment plan */
  USER_NOT_AUTHORIZED: 'CARE_TREAT_B009',
  
  /** Treatment plan expired */
  PLAN_EXPIRED: 'CARE_TREAT_B010'
};

/**
 * Technical error codes for the Treatments domain
 * Used for unexpected system errors and exceptions
 */
export const CARE_TREAT_TECHNICAL_ERRORS = {
  /** Database error when retrieving treatment plan */
  DATABASE_RETRIEVAL_ERROR: 'CARE_TREAT_T001',
  
  /** Database error when saving treatment plan */
  DATABASE_SAVE_ERROR: 'CARE_TREAT_T002',
  
  /** Error in treatment plan search indexing */
  SEARCH_INDEXING_ERROR: 'CARE_TREAT_T003',
  
  /** Cache error for treatment plan data */
  CACHE_ERROR: 'CARE_TREAT_T004',
  
  /** Transaction error during treatment plan operations */
  TRANSACTION_ERROR: 'CARE_TREAT_T005',
  
  /** Error in treatment plan data migration */
  MIGRATION_ERROR: 'CARE_TREAT_T006',
  
  /** Serialization error for treatment plan data */
  SERIALIZATION_ERROR: 'CARE_TREAT_T007',
  
  /** Error in treatment reminder scheduling */
  REMINDER_SCHEDULING_ERROR: 'CARE_TREAT_T008',
  
  /** Error in treatment notification processing */
  NOTIFICATION_ERROR: 'CARE_TREAT_T009',
  
  /** Error in treatment progress calculation */
  PROGRESS_CALCULATION_ERROR: 'CARE_TREAT_T010'
};

/**
 * External system error codes for the Treatments domain
 * Used for failures in external services or dependencies
 */
export const CARE_TREAT_EXTERNAL_ERRORS = {
  /** Treatment database API error */
  TREATMENT_DB_ERROR: 'CARE_TREAT_E001',
  
  /** Treatment database API timeout */
  TREATMENT_DB_TIMEOUT: 'CARE_TREAT_E002',
  
  /** Error in treatment recommendation service */
  RECOMMENDATION_SERVICE_ERROR: 'CARE_TREAT_E003',
  
  /** Error in reminder service */
  REMINDER_SERVICE_ERROR: 'CARE_TREAT_E004',
  
  /** Error in progress tracking service */
  PROGRESS_TRACKING_ERROR: 'CARE_TREAT_E005',
  
  /** Error in treatment verification service */
  VERIFICATION_SERVICE_ERROR: 'CARE_TREAT_E006',
  
  /** Error in treatment information service */
  INFORMATION_SERVICE_ERROR: 'CARE_TREAT_E007',
  
  /** Error in gamification service */
  GAMIFICATION_SERVICE_ERROR: 'CARE_TREAT_E008',
  
  /** Error in electronic health record integration */
  EHR_INTEGRATION_ERROR: 'CARE_TREAT_E009',
  
  /** Error in treatment outcome analysis */
  OUTCOME_ANALYSIS_ERROR: 'CARE_TREAT_E010'
};

/**
 * ------------------------------------------------
 * COMBINED ERROR CODE EXPORTS
 * ------------------------------------------------
 */

/**
 * All Care journey validation error codes combined
 */
export const CARE_VALIDATION_ERRORS = {
  ...CARE_APPT_VALIDATION_ERRORS,
  ...CARE_PROV_VALIDATION_ERRORS,
  ...CARE_TELE_VALIDATION_ERRORS,
  ...CARE_MED_VALIDATION_ERRORS,
  ...CARE_SYMP_VALIDATION_ERRORS,
  ...CARE_TREAT_VALIDATION_ERRORS
};

/**
 * All Care journey business error codes combined
 */
export const CARE_BUSINESS_ERRORS = {
  ...CARE_APPT_BUSINESS_ERRORS,
  ...CARE_PROV_BUSINESS_ERRORS,
  ...CARE_TELE_BUSINESS_ERRORS,
  ...CARE_MED_BUSINESS_ERRORS,
  ...CARE_SYMP_BUSINESS_ERRORS,
  ...CARE_TREAT_BUSINESS_ERRORS
};

/**
 * All Care journey technical error codes combined
 */
export const CARE_TECHNICAL_ERRORS = {
  ...CARE_APPT_TECHNICAL_ERRORS,
  ...CARE_PROV_TECHNICAL_ERRORS,
  ...CARE_TELE_TECHNICAL_ERRORS,
  ...CARE_MED_TECHNICAL_ERRORS,
  ...CARE_SYMP_TECHNICAL_ERRORS,
  ...CARE_TREAT_TECHNICAL_ERRORS
};

/**
 * All Care journey external error codes combined
 */
export const CARE_EXTERNAL_ERRORS = {
  ...CARE_APPT_EXTERNAL_ERRORS,
  ...CARE_PROV_EXTERNAL_ERRORS,
  ...CARE_TELE_EXTERNAL_ERRORS,
  ...CARE_MED_EXTERNAL_ERRORS,
  ...CARE_SYMP_EXTERNAL_ERRORS,
  ...CARE_TREAT_EXTERNAL_ERRORS
};

/**
 * All Care journey error codes combined
 */
export const CARE_ERROR_CODES = {
  ...CARE_VALIDATION_ERRORS,
  ...CARE_BUSINESS_ERRORS,
  ...CARE_TECHNICAL_ERRORS,
  ...CARE_EXTERNAL_ERRORS
};