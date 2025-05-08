/**
 * Push Notification DTOs
 * 
 * This file defines Data Transfer Objects (DTOs) for push notification validation and processing.
 * It includes DTOs for incoming notification requests, device token validation, and delivery tracking.
 * 
 * These DTOs use class-validator and class-transformer for robust input validation and ensure that
 * all incoming requests meet required schemas before processing.
 * 
 * The file integrates with @austa/interfaces for standardized notification payload schemas and
 * implements journey-specific variants for different notification types.
 */

import { Type, Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsUrl,
  MaxLength,
  MinLength,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { NotificationType, NotificationPriority } from '@austa/interfaces/notification/types';
import { NotificationChannel, NotificationStatus } from '@austa/interfaces/notification/types';
import { Notification } from '@austa/interfaces/notification/types';

// Import journey-specific notification data interfaces
import { 
  AchievementNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData,
} from '@austa/interfaces/notification/data';

/**
 * DTO for validating device token information
 * Used when registering or updating device tokens for push notifications
 */
export class DeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(4096)
  token: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  platform: 'ios' | 'android' | 'web';

  @IsString()
  @IsOptional()
  appVersion?: string;

  @IsString()
  @IsOptional()
  osVersion?: string;

  @IsBoolean()
  @IsOptional()
  isProduction?: boolean;
  
  @IsString()
  @IsOptional()
  userId?: string;
  
  @IsDateString()
  @IsOptional()
  lastRegisteredAt?: string;
  
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  
  @IsObject()
  @IsOptional()
  preferences?: {
    [key in NotificationType]?: boolean;
  };
}

/**
 * DTO for Android-specific notification configuration
 * Based on Firebase Cloud Messaging Android configuration options
 */
export class AndroidConfigDto {
  @IsString()
  @IsOptional()
  collapseKey?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['normal', 'high'])
  priority?: 'normal' | 'high';

  @IsString()
  @IsOptional()
  ttl?: string;

  @IsString()
  @IsOptional()
  restrictedPackageName?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, string>;

  @IsString()
  @IsOptional()
  channelId?: string;
  
  @IsObject()
  @IsOptional()
  notification?: {
    clickAction?: string;
    color?: string;
    icon?: string;
    tag?: string;
    sound?: string;
    titleLocKey?: string;
    titleLocArgs?: string[];
    bodyLocKey?: string;
    bodyLocArgs?: string[];
    imageUrl?: string;
  };
}

/**
 * DTO for Apple Push Notification Service specific configuration
 * Based on Firebase Cloud Messaging APNS configuration options
 */
export class ApnsConfigDto {
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  sound?: string;

  @IsBoolean()
  @IsOptional()
  contentAvailable?: boolean;

  @IsBoolean()
  @IsOptional()
  mutableContent?: boolean;
  
  @IsObject()
  @IsOptional()
  fcmOptions?: {
    imageUrl?: string;
    analyticsLabel?: string;
  };
  
  @IsString()
  @IsOptional()
  threadId?: string;
  
  @IsString()
  @IsOptional()
  badge?: string;
  
  @IsString()
  @IsOptional()
  subtitle?: string;
  
  @IsString()
  @IsOptional()
  targetContentId?: string;
  
  @IsString()
  @IsOptional()
  interruptionLevel?: 'passive' | 'active' | 'time-sensitive' | 'critical';
}

/**
 * DTO for Web Push specific configuration
 * Based on Firebase Cloud Messaging Webpush configuration options
 */
export class WebpushConfigDto {
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  @IsUrl()
  icon?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  image?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsBoolean()
  @IsOptional()
  requireInteraction?: boolean;

  @IsBoolean()
  @IsOptional()
  silent?: boolean;
  
  @IsObject()
  @IsOptional()
  fcmOptions?: {
    link?: string;
    analyticsLabel?: string;
  };
  
  @IsString()
  @IsOptional()
  @IsUrl()
  action?: string;
  
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(86400)
  timeToLive?: number;
  
  @IsString()
  @IsOptional()
  dir?: 'auto' | 'ltr' | 'rtl';
  
  @IsString()
  @IsOptional()
  lang?: string;
  
  @IsObject()
  @IsOptional()
  vibrate?: number[];
  
  @IsObject()
  @IsOptional()
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Base DTO for push notification requests
 * Contains common fields required for all push notifications
 * Implements the Notification interface from @austa/interfaces
 */
export class PushNotificationDto implements Partial<Notification> {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsString()
  @IsOptional()
  journey?: 'health' | 'care' | 'plan';

  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel: NotificationChannel = NotificationChannel.PUSH;

  @IsUUID(4)
  @IsOptional()
  id?: string;

  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AndroidConfigDto)
  android?: AndroidConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApnsConfigDto)
  apns?: ApnsConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebpushConfigDto)
  webpush?: WebpushConfigDto;
}

/**
 * DTO for health journey specific push notifications
 * Used for health metrics, goals, and device-related notifications
 */
export class HealthPushNotificationDto extends PushNotificationDto {
  @IsString()
  @IsNotEmpty()
  journey: 'health';

  @IsString()
  @IsOptional()
  metricId?: string;

  @IsString()
  @IsOptional()
  goalId?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
  
  @IsObject()
  @IsOptional()
  metricData?: {
    name: string;
    value: number;
    unit: string;
    timestamp: string;
    change?: number;
    status?: 'normal' | 'warning' | 'critical';
  };
  
  @IsObject()
  @IsOptional()
  goalData?: {
    name: string;
    target: number;
    current: number;
    unit: string;
    dueDate?: string;
    progress: number;
    completed: boolean;
  };
  
  @IsObject()
  @IsOptional()
  deviceData?: {
    name: string;
    type: string;
    lastSyncTime?: string;
    batteryLevel?: number;
    status: 'connected' | 'disconnected' | 'syncing' | 'error';
  };
  
  /**
   * Transform the notification data to ensure it meets the required format
   * This helps standardize the payload structure across different clients
   */
  @Transform(({ value, obj }) => {
    // Ensure data object exists
    if (!obj.data) {
      obj.data = {};
    }
    
    // Add journey-specific data to the data object
    if (obj.metricData) {
      obj.data.metric = obj.metricData;
    }
    
    if (obj.goalData) {
      obj.data.goal = obj.goalData;
    }
    
    if (obj.deviceData) {
      obj.data.device = obj.deviceData;
    }
    
    return obj.data;
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * DTO for care journey specific push notifications
 * Used for appointment reminders, medication alerts, and provider updates
 */
export class CarePushNotificationDto extends PushNotificationDto {
  @IsString()
  @IsNotEmpty()
  journey: 'care';

  @IsString()
  @IsOptional()
  appointmentId?: string;

  @IsString()
  @IsOptional()
  providerId?: string;

  @IsString()
  @IsOptional()
  medicationId?: string;
  
  @IsObject()
  @IsOptional()
  appointmentData?: AppointmentReminderData & {
    providerName?: string;
    location?: string;
    appointmentType?: string;
    notes?: string;
    joinUrl?: string;
  };
  
  @IsObject()
  @IsOptional()
  medicationData?: {
    name: string;
    dosage: string;
    instructions: string;
    time: string;
    refillReminder?: boolean;
    daysRemaining?: number;
  };
  
  @IsObject()
  @IsOptional()
  providerData?: {
    name: string;
    specialty: string;
    contactInfo?: string;
    imageUrl?: string;
  };
  
  /**
   * Transform the notification data to ensure it meets the required format
   * This helps standardize the payload structure across different clients
   */
  @Transform(({ value, obj }) => {
    // Ensure data object exists
    if (!obj.data) {
      obj.data = {};
    }
    
    // Add journey-specific data to the data object
    if (obj.appointmentData) {
      obj.data.appointment = obj.appointmentData;
    }
    
    if (obj.medicationData) {
      obj.data.medication = obj.medicationData;
    }
    
    if (obj.providerData) {
      obj.data.provider = obj.providerData;
    }
    
    return obj.data;
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * DTO for plan journey specific push notifications
 * Used for claim status updates, benefit information, and plan changes
 */
export class PlanPushNotificationDto extends PushNotificationDto {
  @IsString()
  @IsNotEmpty()
  journey: 'plan';

  @IsString()
  @IsOptional()
  claimId?: string;

  @IsString()
  @IsOptional()
  benefitId?: string;

  @IsString()
  @IsOptional()
  planId?: string;
  
  @IsObject()
  @IsOptional()
  claimData?: ClaimStatusUpdateData & {
    claimNumber?: string;
    amount?: number;
    serviceDate?: string;
    provider?: string;
    documents?: Array<{
      name: string;
      url: string;
      required: boolean;
    }>;
  };
  
  @IsObject()
  @IsOptional()
  benefitData?: {
    name: string;
    description: string;
    coverage: string;
    remainingAmount?: number;
    usedAmount?: number;
    totalAmount?: number;
    expiryDate?: string;
  };
  
  @IsObject()
  @IsOptional()
  planData?: {
    name: string;
    type: string;
    effectiveDate?: string;
    endDate?: string;
    status: string;
    premium?: number;
    changes?: Array<{
      field: string;
      oldValue: string;
      newValue: string;
    }>;
  };
  
  /**
   * Transform the notification data to ensure it meets the required format
   * This helps standardize the payload structure across different clients
   */
  @Transform(({ value, obj }) => {
    // Ensure data object exists
    if (!obj.data) {
      obj.data = {};
    }
    
    // Add journey-specific data to the data object
    if (obj.claimData) {
      obj.data.claim = obj.claimData;
    }
    
    if (obj.benefitData) {
      obj.data.benefit = obj.benefitData;
    }
    
    if (obj.planData) {
      obj.data.plan = obj.planData;
    }
    
    return obj.data;
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * DTO for gamification specific push notifications
 * Used for achievement, quest, reward, and level-up notifications
 */
export class GamificationPushNotificationDto extends PushNotificationDto {
  @IsString()
  @IsOptional()
  achievementId?: string;

  @IsString()
  @IsOptional()
  questId?: string;

  @IsString()
  @IsOptional()
  rewardId?: string;

  @IsString()
  @IsOptional()
  level?: string;
  
  @IsNumber()
  @IsOptional()
  @Min(0)
  xpEarned?: number;
  
  @IsString()
  @IsOptional()
  profileId?: string;
  
  @IsObject()
  @IsOptional()
  achievementData?: AchievementNotificationData & {
    imageUrl?: string;
    points: number;
    unlockDate?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };
  
  @IsObject()
  @IsOptional()
  questData?: {
    name: string;
    description: string;
    progress: number;
    total: number;
    completed: boolean;
    deadline?: string;
    reward?: {
      type: string;
      value: number;
      description: string;
    };
  };
  
  @IsObject()
  @IsOptional()
  rewardData?: {
    name: string;
    description: string;
    imageUrl?: string;
    value: number;
    expiryDate?: string;
    redeemUrl?: string;
    code?: string;
  };
  
  @IsObject()
  @IsOptional()
  levelData?: {
    oldLevel: number;
    newLevel: number;
    xpRequired: number;
    xpTotal: number;
    rewards?: Array<{
      type: string;
      name: string;
      description: string;
      value: number;
    }>;
  };
  
  /**
   * Transform the notification data to ensure it meets the required format
   * This helps standardize the payload structure across different clients
   */
  @Transform(({ value, obj }) => {
    // Ensure data object exists
    if (!obj.data) {
      obj.data = {};
    }
    
    // Add gamification-specific data to the data object
    if (obj.achievementData) {
      obj.data.achievement = obj.achievementData;
    }
    
    if (obj.questData) {
      obj.data.quest = obj.questData;
    }
    
    if (obj.rewardData) {
      obj.data.reward = obj.rewardData;
    }
    
    if (obj.levelData) {
      obj.data.level = obj.levelData;
    }
    
    // Add XP earned if available
    if (obj.xpEarned) {
      obj.data.xpEarned = obj.xpEarned;
    }
    
    return obj.data;
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * DTO for tracking push notification delivery status
 */
export class PushDeliveryStatusDto {
  @IsUUID(4)
  @IsNotEmpty()
  notificationId: string;

  @IsEnum(NotificationStatus)
  @IsNotEmpty()
  status: NotificationStatus;

  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsString()
  @IsOptional()
  messageId?: string;

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}

/**
 * DTO for push notification batch processing
 * Allows sending multiple notifications to multiple devices in a single request
 */
export class PushNotificationBatchDto {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PushNotificationDto)
  notifications: PushNotificationDto[];

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DeviceTokenDto)
  tokens: DeviceTokenDto[];

  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
  
  @IsString()
  @IsOptional()
  correlationId?: string;
  
  @IsBoolean()
  @IsOptional()
  validateOnly?: boolean;
  
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for push notification batch processing results
 * Contains the results of a batch push notification operation
 */
export class PushNotificationBatchResultDto {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PushDeliveryStatusDto)
  results: PushDeliveryStatusDto[];

  @IsUUID(4)
  @IsNotEmpty()
  batchId: string;

  @IsDateString()
  @IsNotEmpty()
  timestamp: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
  
  @IsNumber()
  @IsOptional()
  @Min(0)
  successCount?: number;
  
  @IsNumber()
  @IsOptional()
  @Min(0)
  failureCount?: number;
  
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  successRate?: number;
  
  @IsObject()
  @IsOptional()
  errors?: Record<string, string[]>;
}