/**
 * @file Common Status Types
 * @description Defines standardized status enums and types used across all domains in the AUSTA SuperApp.
 * These types ensure consistent terminology and state management throughout the application.
 */

/**
 * Represents the activation status of an entity.
 * Used for indicating whether an entity is active, inactive, or pending activation.
 */
export enum ActivationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

/**
 * String union type for activation status (lowercase version).
 * Provided for backward compatibility with existing code.
 */
export type ActivationStatusType = 'active' | 'inactive' | 'pending';

/**
 * Represents the progress status of a task or process.
 * Used for tracking the completion status of activities, goals, or workflows.
 */
export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

/**
 * String union type for progress status (lowercase version).
 * Provided for backward compatibility with existing code.
 */
export type ProgressStatusType = 'not_started' | 'in_progress' | 'completed';

/**
 * Represents the approval status in a workflow.
 * Used for processes that require review and approval.
 */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * String union type for approval status (lowercase version).
 * Provided for backward compatibility with existing code.
 */
export type ApprovalStatusType = 'pending' | 'approved' | 'rejected';

/**
 * Represents the status of an insurance claim.
 * Extends the basic approval workflow with additional states.
 */
export enum ClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
}

/**
 * String union type for claim status (lowercase version).
 * Matches the original ClaimStatus type from plan.types.ts.
 */
export type ClaimStatusType = 'pending' | 'approved' | 'denied' | 'additional_info_required';

/**
 * Represents the visibility status of an entity.
 * Used for controlling whether an item is visible, hidden, or archived.
 */
export enum VisibilityStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  ARCHIVED = 'ARCHIVED',
}

/**
 * String union type for visibility status (lowercase version).
 */
export type VisibilityStatusType = 'visible' | 'hidden' | 'archived';

/**
 * Represents the connection status of a device or external system.
 * Used for tracking the state of integrations with external devices or services.
 */
export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
}

/**
 * String union type for connection status (lowercase version).
 */
export type ConnectionStatusType = 'connected' | 'disconnected' | 'connecting' | 'error';

/**
 * Represents the verification status of an identity or document.
 * Used for processes that require verification of user-provided information.
 */
export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

/**
 * String union type for verification status (lowercase version).
 */
export type VerificationStatusType = 'unverified' | 'pending' | 'verified' | 'rejected';

/**
 * Represents the availability status of a resource.
 * Used for indicating whether a resource is available for use.
 */
export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  LIMITED = 'LIMITED',
}

/**
 * String union type for availability status (lowercase version).
 */
export type AvailabilityStatusType = 'available' | 'unavailable' | 'limited';

/**
 * Represents the processing status of an operation.
 * Used for tracking the state of background operations or tasks.
 */
export enum ProcessingStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

/**
 * String union type for processing status (lowercase version).
 */
export type ProcessingStatusType = 'queued' | 'processing' | 'processed' | 'failed';