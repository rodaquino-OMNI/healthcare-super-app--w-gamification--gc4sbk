import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsUUID,
  IsEnum,
  IsISO8601,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

// Import interfaces from the @austa/interfaces package
import { NotificationType, NotificationChannel } from '@austa/interfaces/notification/types';
import { JourneyType } from '@austa/interfaces/common/journey';
import { ErrorCode } from '@austa/interfaces/common/errors';

/**
 * Enum defining the types of notification events that can be processed
 * by the notification service.
 */
export enum NotificationEventType {
  SEND = 'send',
  DELIVERY_STATUS = 'delivery_status',
  PREFERENCE_UPDATE = 'preference_update',
  TEMPLATE_UPDATE = 'template_update',
}

/**
 * Enum defining the supported schema versions for notification events.
 * Used for backward compatibility and schema evolution.
 */
export enum NotificationEventVersion {
  V1 = '1.0',
  V1_1 = '1.1',
  V2 = '2.0',
}

/**
 * Base class for all notification events with common properties
 * that are required for any notification event processing.
 */
export class BaseNotificationEventDto {
  /**
   * Unique identifier for the event
   */
  @IsUUID(4)
  @IsNotEmpty()
  eventId: string;

  /**
   * Type of notification event
   */
  @IsEnum(NotificationEventType)
  @IsNotEmpty()
  eventType: NotificationEventType;

  /**
   * Schema version of the event
   */
  @IsEnum(NotificationEventVersion)
  @IsNotEmpty()
  version: NotificationEventVersion;

  /**
   * Timestamp when the event was created
   */
  @IsISO8601()
  @IsNotEmpty()
  timestamp: string;

  /**
   * Optional correlation ID for tracing requests across services
   */
  @IsString()
  @IsOptional()
  correlationId?: string;

  /**
   * Journey context information
   */
  @IsObject()
  @ValidateNested()
  @Type(() => JourneyContext)
  @IsOptional()
  journeyContext?: JourneyContext;
}

/**
 * Context information about which journey generated the notification
 */
export class JourneyContext {
  /**
   * Type of journey (health, care, plan)
   */
  @IsEnum(JourneyType)
  @IsNotEmpty()
  journeyType: JourneyType;

  /**
   * Optional journey-specific identifier
   */
  @IsString()
  @IsOptional()
  journeyId?: string;

  /**
   * Optional additional journey context data
   */
  @IsObject()
  @IsOptional()
  contextData?: Record<string, any>;
}

/**
 * DTO for sending a notification through Kafka events
 * This is the primary event type used to trigger notification delivery
 * across all channels (push, email, SMS, in-app).
 */
export class SendNotificationEventDto extends BaseNotificationEventDto {
  /**
   * The ID of the user to receive the notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment', 'reminder')
   * Used for categorizing and routing notifications
   */
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  /**
   * Title displayed in the notification
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Main content of the notification
   */
  @IsString()
  @IsNotEmpty()
  body: string;

  /**
   * Additional structured data for the notification
   * Can include journey-specific context, actions, or metadata
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  /**
   * ID of the notification template to use (if applicable)
   * References a pre-defined template in the notification service
   */
  @IsString()
  @IsOptional()
  templateId?: string;

  /**
   * Language code for the notification content
   * Defaults to user's preferred language if not specified
   */
  @IsString()
  @IsOptional()
  language?: string;

  /**
   * Priority level for the notification
   * Higher priority notifications may be delivered through more immediate channels
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  priority?: number;

  /**
   * Whether the notification should be persisted in the database
   */
  @IsBoolean()
  @IsOptional()
  persist?: boolean;

  constructor() {
    super();
    this.eventType = NotificationEventType.SEND;
  }
}

/**
 * DTO for notification delivery status updates
 */
export class DeliveryStatusEventDto extends BaseNotificationEventDto {
  /**
   * ID of the notification whose status is being updated
   */
  @IsUUID(4)
  @IsNotEmpty()
  notificationId: string;

  /**
   * Status of the notification delivery
   */
  @IsString()
  @IsNotEmpty()
  status: 'sent' | 'delivered' | 'failed' | 'read';

  /**
   * Timestamp when the status was updated
   */
  @IsISO8601()
  @IsNotEmpty()
  statusTimestamp: string;

  /**
   * Channel through which the notification was delivered
   */
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel: NotificationChannel;

  /**
   * Error information if delivery failed
   */
  @IsObject()
  @ValidateIf(o => o.status === 'failed')
  @ValidateNested()
  @Type(() => NotificationError)
  error?: NotificationError;
  
  /**
   * Number of retry attempts made
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  retryCount?: number;
  
  /**
   * Next retry timestamp if applicable
   */
  @IsISO8601()
  @IsOptional()
  @ValidateIf(o => o.status === 'failed' && o.error?.retriable === true)
  nextRetryAt?: string;

  constructor() {
    super();
    this.eventType = NotificationEventType.DELIVERY_STATUS;
  }
}

/**
 * Structured error information for failed notifications
 */
export class NotificationError {
  /**
   * Error code for categorizing the failure
   */
  @IsEnum(ErrorCode)
  @IsNotEmpty()
  code: ErrorCode;

  /**
   * Human-readable error message
   */
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * Additional error details for debugging
   */
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  /**
   * Whether this error is retriable
   */
  @IsBoolean()
  @IsOptional()
  retriable?: boolean;
}

/**
 * DTO for notification preference updates
 */
export class PreferenceUpdateEventDto extends BaseNotificationEventDto {
  /**
   * ID of the user whose preferences are being updated
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Updated preference settings
   */
  @IsObject()
  @IsNotEmpty()
  preferences: {
    channels?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
      inApp?: boolean;
    };
    types?: Record<string, {
      enabled: boolean;
      channels?: string[];
    }>;
    journeyPreferences?: Record<JourneyType, {
      enabled: boolean;
      types?: Record<string, {
        enabled: boolean;
        channels?: string[];
      }>;
    }>;
  };

  constructor() {
    super();
    this.eventType = NotificationEventType.PREFERENCE_UPDATE;
  }
}

/**
 * DTO for template updates
 */
export class TemplateUpdateEventDto extends BaseNotificationEventDto {
  /**
   * ID of the template being updated
   */
  @IsString()
  @IsNotEmpty()
  templateId: string;

  /**
   * Template content and metadata
   */
  @IsObject()
  @IsNotEmpty()
  template: {
    name: string;
    description?: string;
    content: Record<string, string>; // Keyed by language code
    variables: string[];
    journeyType?: JourneyType;
    version: string;
  };

  constructor() {
    super();
    this.eventType = NotificationEventType.TEMPLATE_UPDATE;
  }
}

/**
 * Main DTO for processing notification events from Kafka
 * This is the primary class used for validating and processing
 * incoming notification events from various services.
 */
export class ProcessNotificationEventDto {
  /**
   * The notification event payload
   */
  @ValidateNested()
  @Type(() => BaseNotificationEventDto, {
    discriminator: {
      property: 'eventType',
      subTypes: [
        { value: SendNotificationEventDto, name: NotificationEventType.SEND },
        { value: DeliveryStatusEventDto, name: NotificationEventType.DELIVERY_STATUS },
        { value: PreferenceUpdateEventDto, name: NotificationEventType.PREFERENCE_UPDATE },
        { value: TemplateUpdateEventDto, name: NotificationEventType.TEMPLATE_UPDATE },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  payload: NotificationEventDto;

  /**
   * Kafka message metadata
   */
  @IsObject()
  @IsOptional()
  metadata?: {
    topic: string;
    partition: number;
    offset: number;
    timestamp: string;
    headers?: Record<string, string>;
  };
}

/**
 * Union type of all notification event DTOs
 * Used for type discrimination in event handlers
 */
export type NotificationEventDto =
  | SendNotificationEventDto
  | DeliveryStatusEventDto
  | PreferenceUpdateEventDto
  | TemplateUpdateEventDto;

/**
 * Type guard to check if an event is a SendNotificationEventDto
 */
export function isSendNotificationEvent(
  event: NotificationEventDto
): event is SendNotificationEventDto {
  return event.eventType === NotificationEventType.SEND;
}

/**
 * Type guard to check if an event is a DeliveryStatusEventDto
 */
export function isDeliveryStatusEvent(
  event: NotificationEventDto
): event is DeliveryStatusEventDto {
  return event.eventType === NotificationEventType.DELIVERY_STATUS;
}

/**
 * Type guard to check if an event is a PreferenceUpdateEventDto
 */
export function isPreferenceUpdateEvent(
  event: NotificationEventDto
): event is PreferenceUpdateEventDto {
  return event.eventType === NotificationEventType.PREFERENCE_UPDATE;
}

/**
 * Type guard to check if an event is a TemplateUpdateEventDto
 */
export function isTemplateUpdateEvent(
  event: NotificationEventDto
): event is TemplateUpdateEventDto {
  return event.eventType === NotificationEventType.TEMPLATE_UPDATE;
}

/**
 * Factory function to create the appropriate DTO based on event type
 * Useful for transforming raw event data into properly typed DTOs
 */
export function createNotificationEventDto(
  eventType: NotificationEventType,
  data: Record<string, any>
): NotificationEventDto {
  switch (eventType) {
    case NotificationEventType.SEND:
      return Object.assign(new SendNotificationEventDto(), data);
    case NotificationEventType.DELIVERY_STATUS:
      return Object.assign(new DeliveryStatusEventDto(), data);
    case NotificationEventType.PREFERENCE_UPDATE:
      return Object.assign(new PreferenceUpdateEventDto(), data);
    case NotificationEventType.TEMPLATE_UPDATE:
      return Object.assign(new TemplateUpdateEventDto(), data);
    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }
}

/**
 * Transforms an event from one version to another
 * Used for backward compatibility when processing events
 * from older versions of the schema
 */
export function transformEventVersion(
  event: NotificationEventDto,
  targetVersion: NotificationEventVersion
): NotificationEventDto {
  // If already at target version, return as is
  if (event.version === targetVersion) {
    return event;
  }
  
  // Create a copy of the event to avoid modifying the original
  const transformedEvent = { ...event };
  
  // Handle version transformations
  if (event.version === NotificationEventVersion.V1 && 
      targetVersion === NotificationEventVersion.V2) {
    // Transform V1 to V2
    if (isSendNotificationEvent(event)) {
      // Add new V2 fields with defaults
      (transformedEvent as SendNotificationEventDto).priority = 
        (transformedEvent as SendNotificationEventDto).priority || 1;
      (transformedEvent as SendNotificationEventDto).persist = 
        (transformedEvent as SendNotificationEventDto).persist ?? true;
    }
    
    // Update version
    transformedEvent.version = targetVersion;
  }
  
  // Add more version transformation logic as needed
  
  return transformedEvent;
}