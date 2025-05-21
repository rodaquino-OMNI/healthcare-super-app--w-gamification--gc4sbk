import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { 
  IDeliveryDetails,
  INotificationDLQEntry,
  INotificationError, 
  INotificationErrorDetails, 
  INotificationEventResponse, 
  INotificationSuccess, 
  IRetryInfo, 
  NotificationDeliveryStatus 
} from '../interfaces/notification-event-response.interface';

/**
 * Data transfer object for notification error details
 */
export class NotificationErrorDetailsDto implements INotificationErrorDetails {
  @ApiProperty({ description: 'Error message describing what went wrong' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Error code for programmatic handling' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Type of error for categorization' })
  @IsString()
  @IsNotEmpty()
  type: string; // Using string instead of ErrorType enum for flexibility

  @ApiPropertyOptional({ description: 'Provider-specific error details' })
  @IsObject()
  @IsOptional()
  providerError?: {
    code?: string;
    message?: string;
    response?: any;
  };

  @ApiPropertyOptional({ description: 'Stack trace for debugging (only included in development)' })
  @IsString()
  @IsOptional()
  stack?: string;
}

/**
 * Data transfer object for retry information
 */
export class RetryInfoDto implements IRetryInfo {
  @ApiProperty({ description: 'Number of retry attempts made so far' })
  attemptsMade: number;

  @ApiProperty({ description: 'Maximum number of retry attempts allowed' })
  maxAttempts: number;

  @ApiProperty({ description: 'Whether the notification is eligible for retry' })
  @IsBoolean()
  isRetryable: boolean;

  @ApiPropertyOptional({ description: 'Timestamp when the next retry will be attempted' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  nextRetryAt?: Date;

  @ApiPropertyOptional({ description: 'Backoff strategy being used (e.g., \'exponential\', \'fixed\')' })
  @IsString()
  @IsOptional()
  backoffStrategy?: string;
}

/**
 * Base data transfer object for all notification event responses
 */
export class NotificationEventResponseDto implements INotificationEventResponse {
  @ApiProperty({ description: 'Unique identifier for the notification' })
  @IsUUID(4)
  @IsNotEmpty()
  notificationId: string;

  @ApiProperty({ description: 'Correlation ID for tracking the notification through the system' })
  @IsString()
  @IsNotEmpty()
  correlationId: string;

  @ApiProperty({ description: 'Timestamp when the response was generated' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ description: 'Indicates if the notification was successfully processed' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ 
    description: 'Current delivery status of the notification',
    enum: NotificationDeliveryStatus,
    enumName: 'NotificationDeliveryStatus'
  })
  @IsEnum(NotificationDeliveryStatus)
  status: NotificationDeliveryStatus;

  @ApiProperty({ description: 'Channel through which the notification was sent (email, sms, push, in-app)' })
  @IsString()
  @IsNotEmpty()
  channel: string;

  @ApiProperty({ description: 'Recipient identifier (email, phone number, device token, user ID)' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional({ description: 'Optional metadata specific to the notification channel' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  /**
   * Creates a new instance of NotificationEventResponseDto
   */
  constructor(partial?: Partial<NotificationEventResponseDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
    
    // Set default timestamp if not provided
    if (!this.timestamp) {
      this.timestamp = new Date();
    }
  }

  /**
   * Creates a success response
   * @param data Success response data
   * @returns NotificationSuccessDto instance
   */
  static success(data: Partial<NotificationSuccessDto>): NotificationSuccessDto {
    return new NotificationSuccessDto({
      ...data,
      success: true,
      status: NotificationDeliveryStatus.DELIVERED,
      deliveredAt: data.deliveredAt || new Date()
    });
  }

  /**
   * Creates an error response
   * @param data Error response data
   * @returns NotificationErrorDto instance
   */
  static error(data: Partial<NotificationErrorDto>): NotificationErrorDto {
    return new NotificationErrorDto({
      ...data,
      success: false,
      status: data.status || NotificationDeliveryStatus.FAILED
    });
  }

  /**
   * Creates a pending response
   * @param data Response data
   * @returns NotificationEventResponseDto instance
   */
  static pending(data: Partial<NotificationEventResponseDto>): NotificationEventResponseDto {
    return new NotificationEventResponseDto({
      ...data,
      success: false,
      status: NotificationDeliveryStatus.PENDING
    });
  }
}

/**
 * Data transfer object for successful notification delivery responses
 */
export class NotificationSuccessDto extends NotificationEventResponseDto implements INotificationSuccess {
  @ApiProperty({ description: 'Indicates successful notification delivery', default: true })
  @IsBoolean()
  success: true = true;

  @ApiProperty({ 
    description: 'Delivery status',
    enum: NotificationDeliveryStatus,
    default: NotificationDeliveryStatus.DELIVERED
  })
  @IsEnum(NotificationDeliveryStatus)
  status: NotificationDeliveryStatus.DELIVERED = NotificationDeliveryStatus.DELIVERED;

  @ApiPropertyOptional({ description: 'Provider-specific delivery reference (e.g., message ID from email provider)' })
  @IsString()
  @IsOptional()
  providerReference?: string;

  @ApiProperty({ description: 'Timestamp when the notification was delivered' })
  @IsDate()
  @Type(() => Date)
  deliveredAt: Date;

  @ApiPropertyOptional({ description: 'Channel-specific delivery details' })
  @IsObject()
  @IsOptional()
  deliveryDetails?: IDeliveryDetails;

  /**
   * Creates a new instance of NotificationSuccessDto
   */
  constructor(partial?: Partial<NotificationSuccessDto>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
    
    // Set default deliveredAt if not provided
    if (!this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }
}

/**
 * Data transfer object for failed notification delivery responses
 */
export class NotificationErrorDto extends NotificationEventResponseDto implements INotificationError {
  @ApiProperty({ description: 'Indicates failed notification delivery', default: false })
  @IsBoolean()
  success: false = false;

  @ApiProperty({ 
    description: 'Delivery status',
    enum: NotificationDeliveryStatus,
    enumName: 'NotificationDeliveryStatus'
  })
  @IsEnum(NotificationDeliveryStatus)
  status: NotificationDeliveryStatus.FAILED | NotificationDeliveryStatus.REJECTED | NotificationDeliveryStatus.EXPIRED;

  @ApiProperty({ description: 'Error information' })
  @ValidateNested()
  @Type(() => NotificationErrorDetailsDto)
  error: NotificationErrorDetailsDto;

  @ApiPropertyOptional({ description: 'Retry information if applicable' })
  @ValidateNested()
  @Type(() => RetryInfoDto)
  @IsOptional()
  retry?: RetryInfoDto;

  /**
   * Creates a new instance of NotificationErrorDto
   */
  constructor(partial?: Partial<NotificationErrorDto>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

/**
 * Data transfer object for dead letter queue entries
 */
export class NotificationDLQEntryDto implements INotificationDLQEntry {
  @ApiProperty({ description: 'Original notification event response' })
  @ValidateNested()
  @Type(() => NotificationErrorDto)
  response: NotificationErrorDto;

  @ApiProperty({ description: 'Original notification payload' })
  @IsObject()
  originalPayload: any;

  @ApiProperty({ description: 'Timestamp when the notification was moved to DLQ' })
  @IsDate()
  @Type(() => Date)
  enqueuedAt: Date;

  @ApiProperty({ description: 'Reason for moving to DLQ' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Complete retry history' })
  retryHistory: {
    attemptNumber: number;
    timestamp: Date;
    error: NotificationErrorDetailsDto;
  }[];

  /**
   * Creates a new instance of NotificationDLQEntryDto
   */
  constructor(partial?: Partial<NotificationDLQEntryDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
    
    // Set default enqueuedAt if not provided
    if (!this.enqueuedAt) {
      this.enqueuedAt = new Date();
    }
  }
}