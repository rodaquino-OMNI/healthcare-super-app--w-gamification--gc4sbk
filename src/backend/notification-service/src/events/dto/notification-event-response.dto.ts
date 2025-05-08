/**
 * @file notification-event-response.dto.ts
 * @description Provides a standardized response structure for notification event processing results.
 * This DTO ensures consistent error handling, status reporting, and metadata inclusion in responses
 * to notification events. It supports both synchronous API responses and asynchronous Kafka event
 * replies, making it a critical component for unified notification handling across the platform.
 */

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { NotificationChannel, NotificationType } from '@austa/interfaces/notification/types';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';
import {
  NotificationErrorCategory,
  NotificationErrorSeverity,
} from '../interfaces/notification-status.interface';
import {
  INotificationEventResponse,
  INotificationSuccess,
  INotificationError as INotificationErrorResponse,
  IChannelDeliveryDetails,
  IEmailDeliveryDetails,
  ISmsDeliveryDetails,
  IPushDeliveryDetails,
  IInAppDeliveryDetails,
  IAsyncNotificationResponse,
  IBatchNotificationResult,
} from '../interfaces/notification-event-response.interface';

/**
 * DTO for notification error details.
 * Provides structured information about errors encountered during notification processing.
 */
export class NotificationErrorDetailsDto {
  /**
   * Error code from the delivery provider or internal system
   */
  @IsString()
  @IsNotEmpty()
  code: string;

  /**
   * Human-readable error message
   */
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * Error category for classification and analytics
   */
  @IsEnum(NotificationErrorCategory)
  category: NotificationErrorCategory;

  /**
   * Error severity level for prioritization and alerting
   */
  @IsEnum(NotificationErrorSeverity)
  severity: NotificationErrorSeverity;

  /**
   * Whether this error is considered transient and eligible for retry
   */
  @IsBoolean()
  isTransient: boolean;

  /**
   * Raw error details from the provider for debugging (optional)
   */
  @IsObject()
  @IsOptional()
  rawError?: Record<string, any>;

  /**
   * Timestamp when the error occurred
   */
  @IsDate()
  timestamp: Date;

  /**
   * Stack trace for internal errors (optional)
   */
  @IsString()
  @IsOptional()
  stack?: string;
}

/**
 * Base DTO for notification event processing responses.
 * Provides a standardized structure for all notification event processing results.
 */
export class NotificationEventResponseDto implements INotificationEventResponse {
  /**
   * Unique identifier for the notification event response
   */
  @IsUUID(4)
  @IsNotEmpty()
  responseId: string;

  /**
   * ID of the notification being processed
   */
  @IsUUID(4)
  @IsNotEmpty()
  notificationId: string;

  /**
   * ID of the event that triggered this notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  eventId: string;

  /**
   * User ID of the recipient
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Type of notification
   */
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  /**
   * Channel used for delivery
   */
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  /**
   * Whether the notification processing was successful
   */
  @IsBoolean()
  success: boolean;

  /**
   * Timestamp when the response was generated
   */
  @IsDate()
  timestamp: Date;

  /**
   * Time taken to process the notification in milliseconds
   */
  @IsNumber()
  @IsPositive()
  processingTimeMs: number;

  /**
   * Current retry status if applicable
   */
  @IsEnum(RetryStatus)
  @IsOptional()
  retryStatus?: RetryStatus;

  /**
   * Number of delivery attempts made so far
   */
  @IsInt()
  @IsPositive()
  attemptCount: number;

  /**
   * Correlation ID for tracing and monitoring
   */
  @IsString()
  @IsNotEmpty()
  correlationId: string;

  /**
   * Journey context for the notification
   */
  @IsString()
  @IsOptional()
  journeyContext?: string;

  /**
   * Additional metadata for the response
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Base class for channel-specific delivery details.
 * Contains fields that vary based on the notification channel.
 */
export class ChannelDeliveryDetailsDto implements IChannelDeliveryDetails {
  /**
   * Channel used for delivery
   */
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  /**
   * Channel-specific metadata
   */
  @IsObject()
  metadata: Record<string, any>;
}

/**
 * DTO for email delivery details.
 * Contains email-specific delivery information.
 */
export class EmailDeliveryDetailsDto extends ChannelDeliveryDetailsDto implements IEmailDeliveryDetails {
  /**
   * Email channel
   */
  @IsEnum(NotificationChannel)
  channel: NotificationChannel.EMAIL;

  /**
   * Email address of the recipient
   */
  @IsString()
  @IsNotEmpty()
  recipientEmail: string;

  /**
   * Email delivery provider used
   */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /**
   * Message ID assigned by the email provider
   */
  @IsString()
  @IsOptional()
  messageId?: string;

  /**
   * Whether the email was delivered to the recipient's server
   */
  @IsBoolean()
  deliveredToServer: boolean;

  /**
   * Whether open tracking is enabled for this email
   */
  @IsBoolean()
  @IsOptional()
  openTrackingEnabled?: boolean;

  /**
   * Whether click tracking is enabled for this email
   */
  @IsBoolean()
  @IsOptional()
  clickTrackingEnabled?: boolean;
}

/**
 * DTO for SMS delivery details.
 * Contains SMS-specific delivery information.
 */
export class SmsDeliveryDetailsDto extends ChannelDeliveryDetailsDto implements ISmsDeliveryDetails {
  /**
   * SMS channel
   */
  @IsEnum(NotificationChannel)
  channel: NotificationChannel.SMS;

  /**
   * Phone number of the recipient
   */
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  /**
   * SMS delivery provider used
   */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /**
   * Message ID assigned by the SMS provider
   */
  @IsString()
  @IsOptional()
  messageId?: string;

  /**
   * Delivery status code from the provider
   */
  @IsString()
  @IsOptional()
  providerStatusCode?: string;

  /**
   * Cost of sending the SMS (for billing and quota tracking)
   */
  @IsNumber()
  @IsOptional()
  cost?: number;

  /**
   * Currency of the cost amount
   */
  @IsString()
  @IsOptional()
  costCurrency?: string;
}

/**
 * DTO for push notification delivery details.
 * Contains push-specific delivery information.
 */
export class PushDeliveryDetailsDto extends ChannelDeliveryDetailsDto implements IPushDeliveryDetails {
  /**
   * Push channel
   */
  @IsEnum(NotificationChannel)
  channel: NotificationChannel.PUSH;

  /**
   * Device token or registration ID
   */
  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  /**
   * Push notification provider used
   */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /**
   * Message ID assigned by the push provider
   */
  @IsString()
  @IsOptional()
  messageId?: string;

  /**
   * Platform of the recipient device
   */
  @IsString()
  @IsOptional()
  platform?: 'iOS' | 'Android' | 'Web';

  /**
   * Whether high priority delivery was used
   */
  @IsBoolean()
  @IsOptional()
  highPriority?: boolean;

  /**
   * Time-to-live in seconds for the push notification
   */
  @IsNumber()
  @IsOptional()
  ttlSeconds?: number;
}

/**
 * DTO for in-app notification delivery details.
 * Contains in-app specific delivery information.
 */
export class InAppDeliveryDetailsDto extends ChannelDeliveryDetailsDto implements IInAppDeliveryDetails {
  /**
   * In-app channel
   */
  @IsEnum(NotificationChannel)
  channel: NotificationChannel.IN_APP;

  /**
   * Whether the notification is marked as read
   */
  @IsBoolean()
  isRead: boolean;

  /**
   * Whether the notification requires user action
   */
  @IsBoolean()
  @IsOptional()
  requiresAction?: boolean;

  /**
   * Expiration time for the notification (if applicable)
   */
  @IsDate()
  @IsOptional()
  expiresAt?: Date;

  /**
   * UI location where the notification should be displayed
   */
  @IsString()
  @IsOptional()
  displayLocation?: 'feed' | 'toast' | 'banner' | 'modal';
}

/**
 * DTO for successful notification event processing responses.
 * Extends the base response with success-specific fields.
 */
export class NotificationSuccessDto extends NotificationEventResponseDto implements INotificationSuccess {
  /**
   * Notification processing was successful
   */
  @IsBoolean()
  success: true = true;

  /**
   * Timestamp when the notification was delivered
   */
  @IsDate()
  deliveredAt: Date;

  /**
   * Provider-specific message ID or reference
   */
  @IsString()
  @IsOptional()
  providerMessageId?: string;

  /**
   * Provider used for delivery (e.g., SendGrid, Twilio, FCM)
   */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /**
   * Channel-specific delivery details
   */
  @ValidateNested()
  @Type(() => ChannelDeliveryDetailsDto, {
    discriminator: {
      property: 'channel',
      subTypes: [
        { value: EmailDeliveryDetailsDto, name: NotificationChannel.EMAIL },
        { value: SmsDeliveryDetailsDto, name: NotificationChannel.SMS },
        { value: PushDeliveryDetailsDto, name: NotificationChannel.PUSH },
        { value: InAppDeliveryDetailsDto, name: NotificationChannel.IN_APP },
      ],
    },
  })
  deliveryDetails: ChannelDeliveryDetailsDto;

  /**
   * Whether delivery confirmation was received from the provider
   */
  @IsBoolean()
  deliveryConfirmed: boolean;

  /**
   * Timestamp when delivery was confirmed (if applicable)
   */
  @IsDate()
  @IsOptional()
  deliveryConfirmedAt?: Date;
}

/**
 * DTO for failed notification event processing responses.
 * Extends the base response with error-specific fields.
 */
export class NotificationErrorDto extends NotificationEventResponseDto implements INotificationErrorResponse {
  /**
   * Notification processing failed
   */
  @IsBoolean()
  success: false = false;

  /**
   * Detailed error information
   */
  @ValidateNested()
  @Type(() => NotificationErrorDetailsDto)
  error: NotificationErrorDetailsDto;

  /**
   * Whether this error is eligible for retry
   */
  @IsBoolean()
  isRetryable: boolean;

  /**
   * Recommended backoff time in milliseconds before retry
   */
  @IsNumber()
  @IsPositive()
  @IsOptional()
  recommendedBackoffMs?: number;

  /**
   * Whether the maximum retry attempts have been reached
   */
  @IsBoolean()
  isMaxAttemptsReached: boolean;

  /**
   * Whether this notification should be moved to the dead letter queue
   */
  @IsBoolean()
  shouldMoveToDeadLetterQueue: boolean;

  /**
   * Fallback channels that could be attempted (if applicable)
   */
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  fallbackChannels?: NotificationChannel[];

  /**
   * Provider that reported the error (if applicable)
   */
  @IsString()
  @IsOptional()
  provider?: string;

  /**
   * Raw error response from the provider (if available)
   */
  @IsObject()
  @IsOptional()
  rawProviderError?: Record<string, any>;
}

/**
 * DTO for asynchronous notification response tracking.
 * Used for notifications that have a delayed delivery confirmation.
 */
export class AsyncNotificationResponseDto extends NotificationEventResponseDto implements IAsyncNotificationResponse {
  /**
   * Indicates this is an asynchronous response
   */
  @IsBoolean()
  isAsync: true = true;

  /**
   * Estimated time when the final response will be available
   */
  @IsDate()
  @IsOptional()
  estimatedCompletionTime?: Date;

  /**
   * Callback URL for delivery status updates (if applicable)
   */
  @IsString()
  @IsOptional()
  statusCallbackUrl?: string;

  /**
   * Token for querying the status later
   */
  @IsString()
  @IsNotEmpty()
  statusQueryToken: string;

  /**
   * Current processing stage
   */
  @IsString()
  processingStage: 'queued' | 'processing' | 'delivering' | 'awaiting_confirmation';
}

/**
 * DTO for batch notification processing results.
 * Used when processing multiple notifications in a single operation.
 */
export class BatchNotificationResultDto implements IBatchNotificationResult {
  /**
   * Total number of notifications in the batch
   */
  @IsInt()
  @IsPositive()
  totalCount: number;

  /**
   * Number of successfully processed notifications
   */
  @IsInt()
  @IsPositive()
  successCount: number;

  /**
   * Number of failed notifications
   */
  @IsInt()
  @IsPositive()
  failureCount: number;

  /**
   * Individual results for each notification
   */
  @ValidateNested({ each: true })
  @Type(() => NotificationEventResponseDto, {
    discriminator: {
      property: 'success',
      subTypes: [
        { value: NotificationSuccessDto, name: true },
        { value: NotificationErrorDto, name: false },
      ],
    },
  })
  results: Array<NotificationSuccessDto | NotificationErrorDto>;

  /**
   * Batch processing start time
   */
  @IsDate()
  startTime: Date;

  /**
   * Batch processing end time
   */
  @IsDate()
  endTime: Date;

  /**
   * Total processing time in milliseconds
   */
  @IsNumber()
  @IsPositive()
  totalProcessingTimeMs: number;

  /**
   * Batch correlation ID for tracing and monitoring
   */
  @IsString()
  @IsNotEmpty()
  batchCorrelationId: string;
}

/**
 * Type guard to check if a response is a success response.
 * @param response The notification event response to check
 * @returns True if the response is a success response
 */
export function isNotificationSuccess(
  response: NotificationSuccessDto | NotificationErrorDto | AsyncNotificationResponseDto,
): response is NotificationSuccessDto {
  return response.success === true && !('isAsync' in response);
}

/**
 * Type guard to check if a response is an error response.
 * @param response The notification event response to check
 * @returns True if the response is an error response
 */
export function isNotificationError(
  response: NotificationSuccessDto | NotificationErrorDto | AsyncNotificationResponseDto,
): response is NotificationErrorDto {
  return response.success === false;
}

/**
 * Type guard to check if a response is an asynchronous response.
 * @param response The notification event response to check
 * @returns True if the response is an asynchronous response
 */
export function isAsyncNotificationResponse(
  response: NotificationSuccessDto | NotificationErrorDto | AsyncNotificationResponseDto,
): response is AsyncNotificationResponseDto {
  return 'isAsync' in response && response.isAsync === true;
}

/**
 * Type guard to check if delivery details are for email.
 * @param details The delivery details to check
 * @returns True if the details are for email delivery
 */
export function isEmailDeliveryDetails(
  details: ChannelDeliveryDetailsDto,
): details is EmailDeliveryDetailsDto {
  return details.channel === NotificationChannel.EMAIL;
}

/**
 * Type guard to check if delivery details are for SMS.
 * @param details The delivery details to check
 * @returns True if the details are for SMS delivery
 */
export function isSmsDeliveryDetails(
  details: ChannelDeliveryDetailsDto,
): details is SmsDeliveryDetailsDto {
  return details.channel === NotificationChannel.SMS;
}

/**
 * Type guard to check if delivery details are for push notifications.
 * @param details The delivery details to check
 * @returns True if the details are for push notification delivery
 */
export function isPushDeliveryDetails(
  details: ChannelDeliveryDetailsDto,
): details is PushDeliveryDetailsDto {
  return details.channel === NotificationChannel.PUSH;
}

/**
 * Type guard to check if delivery details are for in-app notifications.
 * @param details The delivery details to check
 * @returns True if the details are for in-app notification delivery
 */
export function isInAppDeliveryDetails(
  details: ChannelDeliveryDetailsDto,
): details is InAppDeliveryDetailsDto {
  return details.channel === NotificationChannel.IN_APP;
}