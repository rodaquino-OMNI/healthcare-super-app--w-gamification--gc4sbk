import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCategory, ErrorType } from '@austa/errors';

/**
 * Base class for all reward-related exceptions.
 */
export class BaseRewardException extends AppException {
  constructor(
    message: string,
    errorType: ErrorType,
    errorCode: string,
    metadata?: Record<string, any>,
    cause?: Error
  ) {
    super(message, errorType, errorCode, metadata, cause);
  }
}

/**
 * Exception thrown when a reward is not found.
 */
export class RewardNotFoundException extends BaseRewardException {
  constructor(rewardId: string) {
    super(
      `Reward with ID ${rewardId} not found`,
      ErrorType.CLIENT,
      'REWARD_NOT_FOUND',
      { rewardId },
      undefined
    );
    this.status = HttpStatus.NOT_FOUND;
    this.category = ErrorCategory.ENTITY_NOT_FOUND;
  }
}

/**
 * Exception thrown when a reward creation fails.
 */
export class RewardCreationException extends BaseRewardException {
  constructor(cause: Error, metadata?: Record<string, any>) {
    super(
      'Failed to create reward',
      ErrorType.SYSTEM,
      'REWARD_CREATION_FAILED',
      metadata,
      cause
    );
    this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.category = ErrorCategory.DATABASE_ERROR;
  }
}

/**
 * Exception thrown when granting a reward to a user fails.
 */
export class RewardGrantException extends BaseRewardException {
  constructor(cause: Error, metadata?: Record<string, any>) {
    super(
      'Failed to grant reward',
      ErrorType.SYSTEM,
      'REWARD_GRANT_FAILED',
      metadata,
      cause
    );
    this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.category = ErrorCategory.TRANSACTION_ERROR;
  }
}

/**
 * Exception thrown when a user already has a reward.
 */
export class DuplicateUserRewardException extends BaseRewardException {
  constructor(userId: string, rewardId: string) {
    super(
      `User ${userId} already has reward ${rewardId}`,
      ErrorType.CLIENT,
      'DUPLICATE_USER_REWARD',
      { userId, rewardId },
      undefined
    );
    this.status = HttpStatus.CONFLICT;
    this.category = ErrorCategory.DUPLICATE_ENTITY;
  }
}

/**
 * Exception thrown when a reward operation fails due to an external service error.
 */
export class RewardExternalServiceException extends BaseRewardException {
  constructor(serviceName: string, cause: Error, metadata?: Record<string, any>) {
    super(
      `External service ${serviceName} failed during reward operation`,
      ErrorType.EXTERNAL_DEPENDENCY,
      'REWARD_EXTERNAL_SERVICE_FAILED',
      { serviceName, ...metadata },
      cause
    );
    this.status = HttpStatus.SERVICE_UNAVAILABLE;
    this.category = ErrorCategory.EXTERNAL_SERVICE_ERROR;
  }
}

/**
 * Exception thrown when a reward operation fails due to invalid data.
 */
export class InvalidRewardDataException extends BaseRewardException {
  constructor(validationErrors: Record<string, any>, metadata?: Record<string, any>) {
    super(
      'Invalid reward data',
      ErrorType.CLIENT,
      'INVALID_REWARD_DATA',
      { validationErrors, ...metadata },
      undefined
    );
    this.status = HttpStatus.BAD_REQUEST;
    this.category = ErrorCategory.VALIDATION_ERROR;
  }
}