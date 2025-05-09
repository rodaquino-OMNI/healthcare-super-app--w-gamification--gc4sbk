/**
 * @file error-codes.ts
 * @description Defines all error codes used throughout the Plan journey.
 * These codes provide a consistent error identification system that enables
 * precise error tracking, documentation, and localization.
 * 
 * Error codes follow the pattern: PLAN_[DOMAIN]_[TYPE][NUMBER]
 * - DOMAIN: Specific domain within the Plan journey (PLAN, BENEF, CLAIM, COVER, DOC)
 * - TYPE: Error type (V=Validation, B=Business, T=Technical, E=External)
 * - NUMBER: Three-digit error number
 */

/**
 * ------------------------------------------------
 * PLAN DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to insurance plans management
 */

/**
 * Validation error codes for the Plans domain
 * Used when input data fails validation requirements
 */
export const PLAN_PLAN_VALIDATION_ERRORS = {
  /** Invalid plan ID format */
  INVALID_PLAN_ID: 'PLAN_PLAN_V001',
  
  /** Missing required plan information */
  MISSING_PLAN_INFO: 'PLAN_PLAN_V002',
  
  /** Invalid plan type */
  INVALID_PLAN_TYPE: 'PLAN_PLAN_V003',
  
  /** Invalid plan dates (start/end) */
  INVALID_PLAN_DATES: 'PLAN_PLAN_V004',
  
  /** Invalid premium amount */
  INVALID_PREMIUM: 'PLAN_PLAN_V005',
  
  /** Invalid deductible amount */
  INVALID_DEDUCTIBLE: 'PLAN_PLAN_V006',
  
  /** Invalid out-of-pocket maximum */
  INVALID_OUT_OF_POCKET: 'PLAN_PLAN_V007',
  
  /** Invalid copay structure */
  INVALID_COPAY: 'PLAN_PLAN_V008',
  
  /** Invalid coinsurance percentage */
  INVALID_COINSURANCE: 'PLAN_PLAN_V009',
  
  /** Invalid network information */
  INVALID_NETWORK: 'PLAN_PLAN_V010'
};

/**
 * Business logic error codes for the Plans domain
 * Used when an operation cannot be completed due to business rules
 */
export const PLAN_PLAN_BUSINESS_ERRORS = {
  /** Plan not found */
  PLAN_NOT_FOUND: 'PLAN_PLAN_B001',
  
  /** Plan not available in user's region */
  PLAN_NOT_AVAILABLE: 'PLAN_PLAN_B002',
  
  /** Plan enrollment failed */
  ENROLLMENT_FAILED: 'PLAN_PLAN_B003',
  
  /** Plan enrollment period closed */
  ENROLLMENT_PERIOD_CLOSED: 'PLAN_PLAN_B004',
  
  /** User not eligible for plan */
  USER_NOT_ELIGIBLE: 'PLAN_PLAN_B005',
  
  /** Plan already enrolled */
  ALREADY_ENROLLED: 'PLAN_PLAN_B006',
  
  /** Plan comparison failed */
  COMPARISON_FAILED: 'PLAN_PLAN_B007',
  
  /** Plan cancellation failed */
  CANCELLATION_FAILED: 'PLAN_PLAN_B008',
  
  /** Plan modification not allowed */
  MODIFICATION_NOT_ALLOWED: 'PLAN_PLAN_B009',
  
  /** Plan has active dependents */
  HAS_ACTIVE_DEPENDENTS: 'PLAN_PLAN_B010'
};

/**
 * Technical error codes for the Plans domain
 * Used for unexpected system errors and exceptions
 */
export const PLAN_PLAN_TECHNICAL_ERRORS = {
  /** Database error when retrieving plan */
  DATABASE_RETRIEVAL_ERROR: 'PLAN_PLAN_T001',
  
  /** Database error when saving plan */
  DATABASE_SAVE_ERROR: 'PLAN_PLAN_T002',
  
  /** Error in plan calculation logic */
  CALCULATION_ERROR: 'PLAN_PLAN_T003',
  
  /** Error in plan search indexing */
  SEARCH_INDEXING_ERROR: 'PLAN_PLAN_T004',
  
  /** Cache error for plan data */
  CACHE_ERROR: 'PLAN_PLAN_T005',
  
  /** Transaction error during plan operations */
  TRANSACTION_ERROR: 'PLAN_PLAN_T006',
  
  /** Error in plan data migration */
  MIGRATION_ERROR: 'PLAN_PLAN_T007',
  
  /** Serialization error for plan data */
  SERIALIZATION_ERROR: 'PLAN_PLAN_T008',
  
  /** Error in plan recommendation algorithm */
  RECOMMENDATION_ERROR: 'PLAN_PLAN_T009',
  
  /** Error in plan notification processing */
  NOTIFICATION_ERROR: 'PLAN_PLAN_T010'
};

/**
 * External system error codes for the Plans domain
 * Used for failures in external services or dependencies
 */
export const PLAN_PLAN_EXTERNAL_ERRORS = {
  /** Insurance provider API error */
  PROVIDER_API_ERROR: 'PLAN_PLAN_E001',
  
  /** Insurance provider API timeout */
  PROVIDER_API_TIMEOUT: 'PLAN_PLAN_E002',
  
  /** Error retrieving plan catalog from provider */
  CATALOG_RETRIEVAL_ERROR: 'PLAN_PLAN_E003',
  
  /** Error in eligibility verification service */
  ELIGIBILITY_SERVICE_ERROR: 'PLAN_PLAN_E004',
  
  /** Error in premium calculation service */
  PREMIUM_SERVICE_ERROR: 'PLAN_PLAN_E005',
  
  /** Error in enrollment service */
  ENROLLMENT_SERVICE_ERROR: 'PLAN_PLAN_E006',
  
  /** Error in plan comparison service */
  COMPARISON_SERVICE_ERROR: 'PLAN_PLAN_E007',
  
  /** Error in provider network service */
  NETWORK_SERVICE_ERROR: 'PLAN_PLAN_E008',
  
  /** Error in regulatory compliance service */
  COMPLIANCE_SERVICE_ERROR: 'PLAN_PLAN_E009',
  
  /** Error in plan rating service */
  RATING_SERVICE_ERROR: 'PLAN_PLAN_E010'
};

/**
 * ------------------------------------------------
 * BENEFITS DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to insurance benefits management
 */

/**
 * Validation error codes for the Benefits domain
 * Used when input data fails validation requirements
 */
export const PLAN_BENEF_VALIDATION_ERRORS = {
  /** Invalid benefit ID format */
  INVALID_BENEFIT_ID: 'PLAN_BENEF_V001',
  
  /** Missing required benefit information */
  MISSING_BENEFIT_INFO: 'PLAN_BENEF_V002',
  
  /** Invalid benefit type */
  INVALID_BENEFIT_TYPE: 'PLAN_BENEF_V003',
  
  /** Invalid benefit coverage percentage */
  INVALID_COVERAGE_PERCENTAGE: 'PLAN_BENEF_V004',
  
  /** Invalid benefit limit */
  INVALID_BENEFIT_LIMIT: 'PLAN_BENEF_V005',
  
  /** Invalid benefit period */
  INVALID_BENEFIT_PERIOD: 'PLAN_BENEF_V006',
  
  /** Invalid network tier for benefit */
  INVALID_NETWORK_TIER: 'PLAN_BENEF_V007',
  
  /** Invalid authorization requirement */
  INVALID_AUTHORIZATION_REQ: 'PLAN_BENEF_V008',
  
  /** Invalid benefit category */
  INVALID_BENEFIT_CATEGORY: 'PLAN_BENEF_V009',
  
  /** Invalid benefit subcategory */
  INVALID_BENEFIT_SUBCATEGORY: 'PLAN_BENEF_V010'
};

/**
 * Business logic error codes for the Benefits domain
 * Used when an operation cannot be completed due to business rules
 */
export const PLAN_BENEF_BUSINESS_ERRORS = {
  /** Benefit not found */
  BENEFIT_NOT_FOUND: 'PLAN_BENEF_B001',
  
  /** Benefit not covered by plan */
  BENEFIT_NOT_COVERED: 'PLAN_BENEF_B002',
  
  /** Benefit limit reached */
  BENEFIT_LIMIT_REACHED: 'PLAN_BENEF_B003',
  
  /** Benefit requires prior authorization */
  AUTHORIZATION_REQUIRED: 'PLAN_BENEF_B004',
  
  /** Benefit verification failed */
  VERIFICATION_FAILED: 'PLAN_BENEF_B005',
  
  /** Benefit period expired */
  BENEFIT_PERIOD_EXPIRED: 'PLAN_BENEF_B006',
  
  /** Benefit has waiting period */
  WAITING_PERIOD_ACTIVE: 'PLAN_BENEF_B007',
  
  /** Benefit excluded for pre-existing condition */
  PREEXISTING_CONDITION: 'PLAN_BENEF_B008',
  
  /** Benefit requires referral */
  REFERRAL_REQUIRED: 'PLAN_BENEF_B009',
  
  /** Benefit usage tracking failed */
  USAGE_TRACKING_FAILED: 'PLAN_BENEF_B010'
};

/**
 * Technical error codes for the Benefits domain
 * Used for unexpected system errors and exceptions
 */
export const PLAN_BENEF_TECHNICAL_ERRORS = {
  /** Database error when retrieving benefit */
  DATABASE_RETRIEVAL_ERROR: 'PLAN_BENEF_T001',
  
  /** Database error when saving benefit */
  DATABASE_SAVE_ERROR: 'PLAN_BENEF_T002',
  
  /** Error in benefit calculation logic */
  CALCULATION_ERROR: 'PLAN_BENEF_T003',
  
  /** Error in benefit search indexing */
  SEARCH_INDEXING_ERROR: 'PLAN_BENEF_T004',
  
  /** Cache error for benefit data */
  CACHE_ERROR: 'PLAN_BENEF_T005',
  
  /** Transaction error during benefit operations */
  TRANSACTION_ERROR: 'PLAN_BENEF_T006',
  
  /** Error in benefit data migration */
  MIGRATION_ERROR: 'PLAN_BENEF_T007',
  
  /** Serialization error for benefit data */
  SERIALIZATION_ERROR: 'PLAN_BENEF_T008',
  
  /** Error in benefit usage calculation */
  USAGE_CALCULATION_ERROR: 'PLAN_BENEF_T009',
  
  /** Error in benefit notification processing */
  NOTIFICATION_ERROR: 'PLAN_BENEF_T010'
};

/**
 * External system error codes for the Benefits domain
 * Used for failures in external services or dependencies
 */
export const PLAN_BENEF_EXTERNAL_ERRORS = {
  /** Insurance provider API error */
  PROVIDER_API_ERROR: 'PLAN_BENEF_E001',
  
  /** Insurance provider API timeout */
  PROVIDER_API_TIMEOUT: 'PLAN_BENEF_E002',
  
  /** Error retrieving benefit details from provider */
  DETAILS_RETRIEVAL_ERROR: 'PLAN_BENEF_E003',
  
  /** Error in benefit verification service */
  VERIFICATION_SERVICE_ERROR: 'PLAN_BENEF_E004',
  
  /** Error in authorization service */
  AUTHORIZATION_SERVICE_ERROR: 'PLAN_BENEF_E005',
  
  /** Error in benefit usage tracking service */
  USAGE_SERVICE_ERROR: 'PLAN_BENEF_E006',
  
  /** Error in medical necessity determination */
  MEDICAL_NECESSITY_ERROR: 'PLAN_BENEF_E007',
  
  /** Error in provider network validation */
  NETWORK_VALIDATION_ERROR: 'PLAN_BENEF_E008',
  
  /** Error in regulatory compliance service */
  COMPLIANCE_SERVICE_ERROR: 'PLAN_BENEF_E009',
  
  /** Error in benefit coordination service */
  COORDINATION_SERVICE_ERROR: 'PLAN_BENEF_E010'
};

/**
 * ------------------------------------------------
 * COVERAGE DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to insurance coverage management
 */

/**
 * Validation error codes for the Coverage domain
 * Used when input data fails validation requirements
 */
export const PLAN_COVER_VALIDATION_ERRORS = {
  /** Invalid coverage ID format */
  INVALID_COVERAGE_ID: 'PLAN_COVER_V001',
  
  /** Missing required coverage information */
  MISSING_COVERAGE_INFO: 'PLAN_COVER_V002',
  
  /** Invalid coverage type */
  INVALID_COVERAGE_TYPE: 'PLAN_COVER_V003',
  
  /** Invalid coverage dates (start/end) */
  INVALID_COVERAGE_DATES: 'PLAN_COVER_V004',
  
  /** Invalid service code */
  INVALID_SERVICE_CODE: 'PLAN_COVER_V005',
  
  /** Invalid diagnosis code */
  INVALID_DIAGNOSIS_CODE: 'PLAN_COVER_V006',
  
  /** Invalid provider information */
  INVALID_PROVIDER_INFO: 'PLAN_COVER_V007',
  
  /** Invalid facility information */
  INVALID_FACILITY_INFO: 'PLAN_COVER_V008',
  
  /** Invalid member information */
  INVALID_MEMBER_INFO: 'PLAN_COVER_V009',
  
  /** Invalid coverage amount */
  INVALID_COVERAGE_AMOUNT: 'PLAN_COVER_V010'
};

/**
 * Business logic error codes for the Coverage domain
 * Used when an operation cannot be completed due to business rules
 */
export const PLAN_COVER_BUSINESS_ERRORS = {
  /** Coverage not found */
  COVERAGE_NOT_FOUND: 'PLAN_COVER_B001',
  
  /** Service not covered */
  SERVICE_NOT_COVERED: 'PLAN_COVER_B002',
  
  /** Coverage verification failed */
  VERIFICATION_FAILED: 'PLAN_COVER_B003',
  
  /** Coverage expired */
  COVERAGE_EXPIRED: 'PLAN_COVER_B004',
  
  /** Coverage not active */
  COVERAGE_NOT_ACTIVE: 'PLAN_COVER_B005',
  
  /** Service is out of network */
  OUT_OF_NETWORK: 'PLAN_COVER_B006',
  
  /** Coverage requires prior authorization */
  AUTHORIZATION_REQUIRED: 'PLAN_COVER_B007',
  
  /** Coverage excluded for pre-existing condition */
  PREEXISTING_CONDITION: 'PLAN_COVER_B008',
  
  /** Coverage requires referral */
  REFERRAL_REQUIRED: 'PLAN_COVER_B009',
  
  /** Coverage limit reached */
  COVERAGE_LIMIT_REACHED: 'PLAN_COVER_B010'
};

/**
 * Technical error codes for the Coverage domain
 * Used for unexpected system errors and exceptions
 */
export const PLAN_COVER_TECHNICAL_ERRORS = {
  /** Database error when retrieving coverage */
  DATABASE_RETRIEVAL_ERROR: 'PLAN_COVER_T001',
  
  /** Database error when saving coverage */
  DATABASE_SAVE_ERROR: 'PLAN_COVER_T002',
  
  /** Error in coverage calculation logic */
  CALCULATION_ERROR: 'PLAN_COVER_T003',
  
  /** Error in coverage search indexing */
  SEARCH_INDEXING_ERROR: 'PLAN_COVER_T004',
  
  /** Cache error for coverage data */
  CACHE_ERROR: 'PLAN_COVER_T005',
  
  /** Transaction error during coverage operations */
  TRANSACTION_ERROR: 'PLAN_COVER_T006',
  
  /** Error in coverage data migration */
  MIGRATION_ERROR: 'PLAN_COVER_T007',
  
  /** Serialization error for coverage data */
  SERIALIZATION_ERROR: 'PLAN_COVER_T008',
  
  /** Error in coverage determination algorithm */
  DETERMINATION_ERROR: 'PLAN_COVER_T009',
  
  /** Error in coverage notification processing */
  NOTIFICATION_ERROR: 'PLAN_COVER_T010'
};

/**
 * External system error codes for the Coverage domain
 * Used for failures in external services or dependencies
 */
export const PLAN_COVER_EXTERNAL_ERRORS = {
  /** Insurance provider API error */
  PROVIDER_API_ERROR: 'PLAN_COVER_E001',
  
  /** Insurance provider API timeout */
  PROVIDER_API_TIMEOUT: 'PLAN_COVER_E002',
  
  /** Error retrieving coverage details from provider */
  DETAILS_RETRIEVAL_ERROR: 'PLAN_COVER_E003',
  
  /** Error in coverage verification service */
  VERIFICATION_SERVICE_ERROR: 'PLAN_COVER_E004',
  
  /** Error in eligibility service */
  ELIGIBILITY_SERVICE_ERROR: 'PLAN_COVER_E005',
  
  /** Error in authorization service */
  AUTHORIZATION_SERVICE_ERROR: 'PLAN_COVER_E006',
  
  /** Error in medical necessity determination */
  MEDICAL_NECESSITY_ERROR: 'PLAN_COVER_E007',
  
  /** Error in provider network validation */
  NETWORK_VALIDATION_ERROR: 'PLAN_COVER_E008',
  
  /** Error in regulatory compliance service */
  COMPLIANCE_SERVICE_ERROR: 'PLAN_COVER_E009',
  
  /** Error in coordination of benefits service */
  COORDINATION_SERVICE_ERROR: 'PLAN_COVER_E010'
};

/**
 * ------------------------------------------------
 * CLAIMS DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to insurance claims management
 */

/**
 * Validation error codes for the Claims domain
 * Used when input data fails validation requirements
 */
export const PLAN_CLAIM_VALIDATION_ERRORS = {
  /** Invalid claim ID format */
  INVALID_CLAIM_ID: 'PLAN_CLAIM_V001',
  
  /** Missing required claim information */
  MISSING_CLAIM_INFO: 'PLAN_CLAIM_V002',
  
  /** Invalid claim type */
  INVALID_CLAIM_TYPE: 'PLAN_CLAIM_V003',
  
  /** Invalid claim dates */
  INVALID_CLAIM_DATES: 'PLAN_CLAIM_V004',
  
  /** Invalid service codes */
  INVALID_SERVICE_CODES: 'PLAN_CLAIM_V005',
  
  /** Invalid diagnosis codes */
  INVALID_DIAGNOSIS_CODES: 'PLAN_CLAIM_V006',
  
  /** Invalid provider information */
  INVALID_PROVIDER_INFO: 'PLAN_CLAIM_V007',
  
  /** Invalid facility information */
  INVALID_FACILITY_INFO: 'PLAN_CLAIM_V008',
  
  /** Invalid claim amount */
  INVALID_CLAIM_AMOUNT: 'PLAN_CLAIM_V009',
  
  /** Invalid supporting documentation */
  INVALID_DOCUMENTATION: 'PLAN_CLAIM_V010'
};

/**
 * Business logic error codes for the Claims domain
 * Used when an operation cannot be completed due to business rules
 */
export const PLAN_CLAIM_BUSINESS_ERRORS = {
  /** Claim not found */
  CLAIM_NOT_FOUND: 'PLAN_CLAIM_B001',
  
  /** Claim submission failed */
  SUBMISSION_FAILED: 'PLAN_CLAIM_B002',
  
  /** Duplicate claim detected */
  DUPLICATE_CLAIM: 'PLAN_CLAIM_B003',
  
  /** Claim processing error */
  PROCESSING_ERROR: 'PLAN_CLAIM_B004',
  
  /** Missing required documentation */
  DOCUMENTATION_MISSING: 'PLAN_CLAIM_B005',
  
  /** Claim filed too late (timely filing) */
  TIMELY_FILING_EXPIRED: 'PLAN_CLAIM_B006',
  
  /** Service not covered by plan */
  SERVICE_NOT_COVERED: 'PLAN_CLAIM_B007',
  
  /** Provider not in network */
  PROVIDER_OUT_OF_NETWORK: 'PLAN_CLAIM_B008',
  
  /** Prior authorization required but not obtained */
  AUTHORIZATION_MISSING: 'PLAN_CLAIM_B009',
  
  /** Claim adjustment failed */
  ADJUSTMENT_FAILED: 'PLAN_CLAIM_B010'
};

/**
 * Technical error codes for the Claims domain
 * Used for unexpected system errors and exceptions
 */
export const PLAN_CLAIM_TECHNICAL_ERRORS = {
  /** Database error when retrieving claim */
  DATABASE_RETRIEVAL_ERROR: 'PLAN_CLAIM_T001',
  
  /** Database error when saving claim */
  DATABASE_SAVE_ERROR: 'PLAN_CLAIM_T002',
  
  /** Error in claim calculation logic */
  CALCULATION_ERROR: 'PLAN_CLAIM_T003',
  
  /** Error in claim search indexing */
  SEARCH_INDEXING_ERROR: 'PLAN_CLAIM_T004',
  
  /** Cache error for claim data */
  CACHE_ERROR: 'PLAN_CLAIM_T005',
  
  /** Transaction error during claim operations */
  TRANSACTION_ERROR: 'PLAN_CLAIM_T006',
  
  /** Error in claim data migration */
  MIGRATION_ERROR: 'PLAN_CLAIM_T007',
  
  /** Serialization error for claim data */
  SERIALIZATION_ERROR: 'PLAN_CLAIM_T008',
  
  /** Error in claim processing algorithm */
  PROCESSING_ALGORITHM_ERROR: 'PLAN_CLAIM_T009',
  
  /** Error in claim notification processing */
  NOTIFICATION_ERROR: 'PLAN_CLAIM_T010'
};

/**
 * External system error codes for the Claims domain
 * Used for failures in external services or dependencies
 */
export const PLAN_CLAIM_EXTERNAL_ERRORS = {
  /** Insurance provider API error */
  PROVIDER_API_ERROR: 'PLAN_CLAIM_E001',
  
  /** Insurance provider API timeout */
  PROVIDER_API_TIMEOUT: 'PLAN_CLAIM_E002',
  
  /** Error submitting claim to provider */
  SUBMISSION_SERVICE_ERROR: 'PLAN_CLAIM_E003',
  
  /** Error retrieving claim status from provider */
  STATUS_RETRIEVAL_ERROR: 'PLAN_CLAIM_E004',
  
  /** Error in claim adjudication service */
  ADJUDICATION_SERVICE_ERROR: 'PLAN_CLAIM_E005',
  
  /** Error in payment processing service */
  PAYMENT_SERVICE_ERROR: 'PLAN_CLAIM_E006',
  
  /** Error in electronic data interchange (EDI) */
  EDI_ERROR: 'PLAN_CLAIM_E007',
  
  /** Error in clearinghouse service */
  CLEARINGHOUSE_ERROR: 'PLAN_CLAIM_E008',
  
  /** Error in regulatory compliance service */
  COMPLIANCE_SERVICE_ERROR: 'PLAN_CLAIM_E009',
  
  /** Error in fraud detection service */
  FRAUD_DETECTION_ERROR: 'PLAN_CLAIM_E010'
};

/**
 * ------------------------------------------------
 * DOCUMENTS DOMAIN ERROR CODES
 * ------------------------------------------------
 * Error codes related to insurance documents management
 */

/**
 * Validation error codes for the Documents domain
 * Used when input data fails validation requirements
 */
export const PLAN_DOC_VALIDATION_ERRORS = {
  /** Invalid document ID format */
  INVALID_DOCUMENT_ID: 'PLAN_DOC_V001',
  
  /** Missing required document information */
  MISSING_DOCUMENT_INFO: 'PLAN_DOC_V002',
  
  /** Invalid document type */
  INVALID_DOCUMENT_TYPE: 'PLAN_DOC_V003',
  
  /** Invalid document format */
  INVALID_DOCUMENT_FORMAT: 'PLAN_DOC_V004',
  
  /** Document size exceeds limit */
  DOCUMENT_TOO_LARGE: 'PLAN_DOC_V005',
  
  /** Invalid document metadata */
  INVALID_METADATA: 'PLAN_DOC_V006',
  
  /** Invalid document category */
  INVALID_CATEGORY: 'PLAN_DOC_V007',
  
  /** Invalid document date */
  INVALID_DOCUMENT_DATE: 'PLAN_DOC_V008',
  
  /** Invalid document owner information */
  INVALID_OWNER_INFO: 'PLAN_DOC_V009',
  
  /** Invalid document security classification */
  INVALID_SECURITY_CLASS: 'PLAN_DOC_V010'
};

/**
 * Business logic error codes for the Documents domain
 * Used when an operation cannot be completed due to business rules
 */
export const PLAN_DOC_BUSINESS_ERRORS = {
  /** Document not found */
  DOCUMENT_NOT_FOUND: 'PLAN_DOC_B001',
  
  /** Document upload failed */
  UPLOAD_FAILED: 'PLAN_DOC_B002',
  
  /** Document download failed */
  DOWNLOAD_FAILED: 'PLAN_DOC_B003',
  
  /** Document processing error */
  PROCESSING_ERROR: 'PLAN_DOC_B004',
  
  /** Document access denied */
  ACCESS_DENIED: 'PLAN_DOC_B005',
  
  /** Document already exists */
  DOCUMENT_ALREADY_EXISTS: 'PLAN_DOC_B006',
  
  /** Document expired */
  DOCUMENT_EXPIRED: 'PLAN_DOC_B007',
  
  /** Document locked for editing */
  DOCUMENT_LOCKED: 'PLAN_DOC_B008',
  
  /** Document version conflict */
  VERSION_CONFLICT: 'PLAN_DOC_B009',
  
  /** Document deletion failed */
  DELETION_FAILED: 'PLAN_DOC_B010'
};

/**
 * Technical error codes for the Documents domain
 * Used for unexpected system errors and exceptions
 */
export const PLAN_DOC_TECHNICAL_ERRORS = {
  /** Database error when retrieving document */
  DATABASE_RETRIEVAL_ERROR: 'PLAN_DOC_T001',
  
  /** Database error when saving document */
  DATABASE_SAVE_ERROR: 'PLAN_DOC_T002',
  
  /** Error in document storage system */
  STORAGE_ERROR: 'PLAN_DOC_T003',
  
  /** Error in document search indexing */
  SEARCH_INDEXING_ERROR: 'PLAN_DOC_T004',
  
  /** Cache error for document data */
  CACHE_ERROR: 'PLAN_DOC_T005',
  
  /** Transaction error during document operations */
  TRANSACTION_ERROR: 'PLAN_DOC_T006',
  
  /** Error in document data migration */
  MIGRATION_ERROR: 'PLAN_DOC_T007',
  
  /** Serialization error for document data */
  SERIALIZATION_ERROR: 'PLAN_DOC_T008',
  
  /** Error in document processing pipeline */
  PROCESSING_PIPELINE_ERROR: 'PLAN_DOC_T009',
  
  /** Error in document notification processing */
  NOTIFICATION_ERROR: 'PLAN_DOC_T010'
};

/**
 * External system error codes for the Documents domain
 * Used for failures in external services or dependencies
 */
export const PLAN_DOC_EXTERNAL_ERRORS = {
  /** Document storage service API error */
  STORAGE_API_ERROR: 'PLAN_DOC_E001',
  
  /** Document storage service API timeout */
  STORAGE_API_TIMEOUT: 'PLAN_DOC_E002',
  
  /** Error in document OCR service */
  OCR_SERVICE_ERROR: 'PLAN_DOC_E003',
  
  /** Error in document classification service */
  CLASSIFICATION_SERVICE_ERROR: 'PLAN_DOC_E004',
  
  /** Error in document verification service */
  VERIFICATION_SERVICE_ERROR: 'PLAN_DOC_E005',
  
  /** Error in document conversion service */
  CONVERSION_SERVICE_ERROR: 'PLAN_DOC_E006',
  
  /** Error in document signing service */
  SIGNING_SERVICE_ERROR: 'PLAN_DOC_E007',
  
  /** Error in document archiving service */
  ARCHIVING_SERVICE_ERROR: 'PLAN_DOC_E008',
  
  /** Error in regulatory compliance service */
  COMPLIANCE_SERVICE_ERROR: 'PLAN_DOC_E009',
  
  /** Error in document security service */
  SECURITY_SERVICE_ERROR: 'PLAN_DOC_E010'
};

/**
 * ------------------------------------------------
 * COMBINED ERROR CODE EXPORTS
 * ------------------------------------------------
 */

/**
 * All Plan journey validation error codes combined
 */
export const PLAN_VALIDATION_ERRORS = {
  ...PLAN_PLAN_VALIDATION_ERRORS,
  ...PLAN_BENEF_VALIDATION_ERRORS,
  ...PLAN_COVER_VALIDATION_ERRORS,
  ...PLAN_CLAIM_VALIDATION_ERRORS,
  ...PLAN_DOC_VALIDATION_ERRORS
};

/**
 * All Plan journey business error codes combined
 */
export const PLAN_BUSINESS_ERRORS = {
  ...PLAN_PLAN_BUSINESS_ERRORS,
  ...PLAN_BENEF_BUSINESS_ERRORS,
  ...PLAN_COVER_BUSINESS_ERRORS,
  ...PLAN_CLAIM_BUSINESS_ERRORS,
  ...PLAN_DOC_BUSINESS_ERRORS
};

/**
 * All Plan journey technical error codes combined
 */
export const PLAN_TECHNICAL_ERRORS = {
  ...PLAN_PLAN_TECHNICAL_ERRORS,
  ...PLAN_BENEF_TECHNICAL_ERRORS,
  ...PLAN_COVER_TECHNICAL_ERRORS,
  ...PLAN_CLAIM_TECHNICAL_ERRORS,
  ...PLAN_DOC_TECHNICAL_ERRORS
};

/**
 * All Plan journey external error codes combined
 */
export const PLAN_EXTERNAL_ERRORS = {
  ...PLAN_PLAN_EXTERNAL_ERRORS,
  ...PLAN_BENEF_EXTERNAL_ERRORS,
  ...PLAN_COVER_EXTERNAL_ERRORS,
  ...PLAN_CLAIM_EXTERNAL_ERRORS,
  ...PLAN_DOC_EXTERNAL_ERRORS
};

/**
 * All Plan journey error codes combined
 */
export const PLAN_ERROR_CODES = {
  ...PLAN_VALIDATION_ERRORS,
  ...PLAN_BUSINESS_ERRORS,
  ...PLAN_TECHNICAL_ERRORS,
  ...PLAN_EXTERNAL_ERRORS
};