import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsISO8601, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested, IsInt, Min, Max } from 'class-validator';

// Import from @austa/interfaces for standardized schemas
import { NotificationChannel, NotificationPriority } from '@austa/interfaces/notification/types';

/**
 * Enum representing delivery failure handling strategies
 */
export enum FailureHandlingStrategy {
  SEQUENTIAL_FALLBACK = 'sequential-fallback', // Try fallback channels in sequence
  PARALLEL_RETRY = 'parallel-retry',         // Try same channel multiple times
  HYBRID = 'hybrid',                         // Combination of both strategies
  ABANDON = 'abandon'                        // Don't retry on failure
}

/**
 * DTO for channel-specific content formatting options
 */
export class ChannelContentDto {
  @ApiProperty({
    description: 'Custom title for this specific channel',
    example: 'Your appointment is tomorrow',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Custom body content for this specific channel',
    example: 'Your appointment with Dr. Smith is scheduled for tomorrow at 2:00 PM.',
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({
    description: 'Additional data specific to this channel',
    example: { deepLink: 'austa://care/appointments/123' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
  
  @ApiPropertyOptional({
    description: 'Content format for this channel (plain text, HTML, markdown)',
    example: 'html',
    enum: ['plain', 'html', 'markdown'],
  })
  @IsString()
  @IsOptional()
  format?: 'plain' | 'html' | 'markdown';
  
  @ApiPropertyOptional({
    description: 'Channel-specific template ID to use',
    example: 'appointment-reminder-email',
  })
  @IsString()
  @IsOptional()
  templateId?: string;
}

/**
 * DTO for time-sensitive delivery rules
 */
export class TimeDeliveryRuleDto {
  @ApiProperty({
    description: 'Start time for allowed delivery window (ISO 8601 format)',
    example: '08:00:00',
  })
  @IsISO8601()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time for allowed delivery window (ISO 8601 format)',
    example: '22:00:00',
  })
  @IsISO8601()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Whether to respect user timezone settings',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  respectUserTimezone?: boolean = true;

  @ApiPropertyOptional({
    description: 'Fallback channel to use if outside delivery window',
    enum: NotificationChannel,
    example: NotificationChannel.IN_APP,
  })
  @IsEnum(NotificationChannel)
  @IsOptional()
  fallbackChannel?: NotificationChannel;
  
  @ApiPropertyOptional({
    description: 'Whether to delay delivery until next valid window instead of using fallback',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  delayUntilValidWindow?: boolean = false;
  
  @ApiPropertyOptional({
    description: 'Maximum delay in hours before falling back to alternative channel',
    example: 12,
    default: 24,
  })
  @IsInt()
  @Min(1)
  @Max(72)
  @IsOptional()
  maxDelayHours?: number = 24;
}

/**
 * DTO for notification channel preference configuration
 */
export class NotificationChannelPreferenceDto {
  @ApiProperty({
    description: 'Primary channel to attempt delivery first',
    enum: NotificationChannel,
    example: NotificationChannel.PUSH,
  })
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  primaryChannel: NotificationChannel;

  @ApiPropertyOptional({
    description: 'Ordered list of fallback channels if primary channel fails',
    type: [String],
    enum: NotificationChannel,
    example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  fallbackChannels?: NotificationChannel[];
  
  @ApiPropertyOptional({
    description: 'Strategy to handle delivery failures',
    enum: FailureHandlingStrategy,
    default: FailureHandlingStrategy.SEQUENTIAL_FALLBACK,
    example: FailureHandlingStrategy.HYBRID,
  })
  @IsEnum(FailureHandlingStrategy)
  @IsOptional()
  failureStrategy?: FailureHandlingStrategy = FailureHandlingStrategy.SEQUENTIAL_FALLBACK;

  @ApiPropertyOptional({
    description: 'Minimum priority level to trigger fallback channels',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
    example: NotificationPriority.HIGH,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  fallbackMinPriority?: NotificationPriority = NotificationPriority.MEDIUM;

  @ApiPropertyOptional({
    description: 'Whether to override user channel preferences',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  overrideUserPreferences?: boolean = false;

  @ApiPropertyOptional({
    description: 'Priority level required to override user preferences',
    enum: NotificationPriority,
    default: NotificationPriority.CRITICAL,
    example: NotificationPriority.CRITICAL,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  overrideMinPriority?: NotificationPriority = NotificationPriority.CRITICAL;

  @ApiPropertyOptional({
    description: 'Channel-specific content formatting options',
    type: Object,
    example: {
      [NotificationChannel.PUSH]: { title: 'Short push title' },
      [NotificationChannel.EMAIL]: { title: 'Detailed email subject', body: 'Rich HTML content' },
    },
  })
  @IsObject()
  @IsOptional()
  channelContent?: Record<NotificationChannel, ChannelContentDto>;

  @ApiPropertyOptional({
    description: 'Time-sensitive delivery rules',
    type: TimeDeliveryRuleDto,
  })
  @ValidateNested()
  @Type(() => TimeDeliveryRuleDto)
  @IsOptional()
  timeDeliveryRule?: TimeDeliveryRuleDto;

  @ApiPropertyOptional({
    description: 'Maximum number of channels to attempt delivery on',
    default: 2,
    example: 3,
  })
  @IsOptional()
  maxChannelAttempts?: number = 2;

  @ApiPropertyOptional({
    description: 'Whether to attempt all channels simultaneously for critical notifications',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  parallelDeliveryForCritical?: boolean = false;

  @ApiPropertyOptional({
    description: 'Journey context for this notification',
    example: 'health',
    enum: ['health', 'care', 'plan'],
  })
  @IsString()
  @IsOptional()
  journeyContext?: string;
  
  @ApiPropertyOptional({
    description: 'Channel-specific retry limits',
    type: Object,
    example: {
      [NotificationChannel.PUSH]: 3,
      [NotificationChannel.EMAIL]: 2,
      [NotificationChannel.SMS]: 1,
    },
  })
  @IsObject()
  @IsOptional()
  channelRetryLimits?: Record<NotificationChannel, number>;
  
  @ApiPropertyOptional({
    description: 'Escalation timeout in seconds before trying fallback channels',
    example: 30,
    default: 60,
  })
  @IsInt()
  @Min(5)
  @Max(300)
  @IsOptional()
  escalationTimeoutSeconds?: number = 60;
  
  @ApiPropertyOptional({
    description: 'Whether to use dead-letter queue for persistently failed notifications',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  useDLQForFailures?: boolean = true;

  /**
   * Determines if a notification should override user preferences based on its priority
   * @param priority The priority of the notification
   * @returns boolean indicating whether to override user preferences
   */
  shouldOverridePreferences(priority: NotificationPriority): boolean {
    if (!this.overrideUserPreferences) {
      return false;
    }

    const priorityValues = {
      [NotificationPriority.LOW]: 0,
      [NotificationPriority.MEDIUM]: 1,
      [NotificationPriority.HIGH]: 2,
      [NotificationPriority.CRITICAL]: 3,
    };

    return priorityValues[priority] >= priorityValues[this.overrideMinPriority];
  }

  /**
   * Gets the appropriate channels to attempt delivery on, respecting time rules if applicable
   * @param currentTime Current time for time-based rules (optional)
   * @param userTimezone User's timezone for time-based rules (optional)
   * @param notificationPriority Priority of the notification (optional)
   * @returns Array of channels to attempt in order
   */
  getDeliveryChannels(currentTime?: Date, userTimezone?: string, notificationPriority?: NotificationPriority): NotificationChannel[] {
    // Start with primary channel
    const channels = [this.primaryChannel];
    
    // Add fallback channels if specified
    if (this.fallbackChannels && this.fallbackChannels.length > 0) {
      channels.push(...this.fallbackChannels);
    }
    
    // Apply time delivery rules if applicable
    if (this.timeDeliveryRule && currentTime) {
      const { startTime, endTime, fallbackChannel, respectUserTimezone } = this.timeDeliveryRule;
      
      // Convert times to comparable format
      const timeString = currentTime.toTimeString().split(' ')[0];
      
      // Check if current time is outside delivery window
      if (timeString < startTime || timeString > endTime) {
        // If fallback channel is specified, use only that channel
        if (fallbackChannel) {
          return [fallbackChannel];
        }
      }
    }
    
    // For critical notifications, consider parallel delivery
    if (notificationPriority === NotificationPriority.CRITICAL && this.parallelDeliveryForCritical) {
      // Return all channels for parallel delivery
      return channels;
    }
    
    // Limit to max channel attempts if specified
    if (this.maxChannelAttempts && channels.length > this.maxChannelAttempts) {
      return channels.slice(0, this.maxChannelAttempts);
    }
    
    return channels;
  }
  
  /**
   * Determines if a notification delivery should be retried on the same channel
   * @param channel The notification channel that failed
   * @param attemptsMade Number of attempts already made on this channel
   * @returns boolean indicating whether to retry on the same channel
   */
  shouldRetryChannel(channel: NotificationChannel, attemptsMade: number): boolean {
    // Check if we have a specific retry limit for this channel
    if (this.channelRetryLimits && this.channelRetryLimits[channel] !== undefined) {
      return attemptsMade < this.channelRetryLimits[channel];
    }
    
    // Default retry behavior based on failure strategy
    switch (this.failureStrategy) {
      case FailureHandlingStrategy.PARALLEL_RETRY:
        return attemptsMade < 3; // Default to 3 attempts
      case FailureHandlingStrategy.HYBRID:
        return attemptsMade < 2; // Default to 2 attempts before fallback
      case FailureHandlingStrategy.SEQUENTIAL_FALLBACK:
        return false; // Don't retry, use fallback
      case FailureHandlingStrategy.ABANDON:
        return false; // Don't retry at all
      default:
        return false;
    }
  }

  /**
   * Gets channel-specific content for a given channel
   * @param channel The notification channel
   * @param defaultContent Default content to use if no channel-specific content is defined
   * @returns Channel-specific content or default content
   */
  getChannelContent(channel: NotificationChannel, defaultContent: { title: string; body: string; data?: Record<string, any>; format?: string; templateId?: string }): { title: string; body: string; data?: Record<string, any>; format?: string; templateId?: string } {
    if (!this.channelContent || !this.channelContent[channel]) {
      return defaultContent;
    }

    const channelSpecific = this.channelContent[channel];
    return {
      title: channelSpecific.title || defaultContent.title,
      body: channelSpecific.body || defaultContent.body,
      data: { ...defaultContent.data, ...channelSpecific.data },
      format: channelSpecific.format || defaultContent.format,
      templateId: channelSpecific.templateId || defaultContent.templateId,
    };
  }
  
  /**
   * Determines if a notification should be sent to a specific channel based on time rules
   * @param channel The notification channel to check
   * @param currentTime Current time for time-based rules
   * @param userTimezone User's timezone for time-based rules (optional)
   * @returns Object with isAllowed flag and reason if not allowed
   */
  isChannelAllowedNow(channel: NotificationChannel, currentTime: Date, userTimezone?: string): { isAllowed: boolean; reason?: string; delayUntil?: Date } {
    // If no time delivery rule, all channels are allowed at all times
    if (!this.timeDeliveryRule) {
      return { isAllowed: true };
    }
    
    const { startTime, endTime, fallbackChannel, respectUserTimezone, delayUntilValidWindow, maxDelayHours } = this.timeDeliveryRule;
    
    // If this is the fallback channel for time rules, it's always allowed
    if (channel === fallbackChannel) {
      return { isAllowed: true };
    }
    
    // Convert times to comparable format
    const timeString = currentTime.toTimeString().split(' ')[0];
    
    // Check if current time is within delivery window
    const isWithinWindow = timeString >= startTime && timeString <= endTime;
    
    if (isWithinWindow) {
      return { isAllowed: true };
    }
    
    // If outside window and delay is enabled, calculate next valid window
    if (delayUntilValidWindow) {
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Set to start of next window
      const [hours, minutes, seconds] = startTime.split(':').map(Number);
      tomorrow.setHours(hours, minutes, seconds, 0);
      
      // Check if delay is within max delay hours
      const delayHours = (tomorrow.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      if (delayHours <= maxDelayHours) {
        return { 
          isAllowed: false, 
          reason: 'Outside delivery window, scheduled for next window', 
          delayUntil: tomorrow 
        };
      }
    }
    
    // Outside window and either delay not enabled or delay too long
    return { 
      isAllowed: false, 
      reason: 'Outside delivery window, use fallback channel' 
    };
  }
}