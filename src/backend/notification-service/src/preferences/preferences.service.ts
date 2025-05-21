import { Injectable, Inject } from '@nestjs/common'; // @nestjs/common v10.3.0
import { Repository } from '@app/shared/interfaces/repository.interface';
import { FilterDto, PaginationDto } from '@austa/interfaces/common/dto';
import { LoggerService } from '@app/logging';
import { TracingService } from '@app/tracing';
import { RetryService } from '../retry/retry.service';
import { NotificationPreference } from './entities/notification-preference.entity';
import { JourneyError } from '@app/errors/journey';
import { ErrorType } from '@app/errors/types';
import { NOTIFICATION_ERROR_CODES } from '../constants/error-codes.constants';

/**
 * Service responsible for managing user notification preferences.
 * Provides methods to retrieve, create, and update NotificationPreference entities
 * with standardized error handling and retry mechanisms for repository operations.
 */
@Injectable()
export class PreferencesService {
  constructor(
    @Inject('NOTIFICATION_PREFERENCE_REPOSITORY')
    private readonly notificationPreferenceRepository: Repository<NotificationPreference>,
    private readonly retryService: RetryService,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService,
  ) {}

  /**
   * Retrieves all notification preferences based on the provided filter and pagination parameters.
   * Implements retry mechanisms for repository operations and structured logging.
   * 
   * @param filter - Optional filtering criteria
   * @param pagination - Optional pagination parameters
   * @returns A promise that resolves to an array of NotificationPreference entities
   */
  async findAll(
    filter?: FilterDto,
    pagination?: PaginationDto,
  ): Promise<NotificationPreference[]> {
    const span = this.tracing.startSpan('PreferencesService.findAll');
    
    try {
      span.setAttributes({
        'filter': JSON.stringify(filter || {}),
        'pagination': JSON.stringify(pagination || {}),
      });
      
      this.logger.log(
        'Retrieving notification preferences',
        { filter, pagination },
        'PreferencesService',
      );
      
      // Use retry service for repository operations with exponential backoff
      return await this.retryService.executeWithRetry(
        async () => this.notificationPreferenceRepository.findAll(filter),
        {
          operation: 'findAll',
          entityType: 'NotificationPreference',
          context: { filter, pagination },
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve notification preferences',
        error,
        'PreferencesService',
      );
      
      throw new JourneyError(
        'Failed to retrieve notification preferences',
        ErrorType.TECHNICAL,
        NOTIFICATION_ERROR_CODES.PREFERENCE_RETRIEVAL_FAILED,
        { filter, pagination },
        error,
      );
    } finally {
      span.end();
    }
  }

  /**
   * Creates a new notification preference record for a user with default settings.
   * Implements retry mechanisms for repository operations and structured logging.
   * 
   * @param userId - The ID of the user
   * @returns A promise that resolves to the newly created NotificationPreference entity
   */
  async create(userId: string): Promise<NotificationPreference> {
    const span = this.tracing.startSpan('PreferencesService.create');
    
    try {
      span.setAttributes({
        'user.id': userId,
      });
      
      this.logger.log(
        `Creating notification preferences for user ${userId}`,
        { userId },
        'PreferencesService',
      );
      
      // Only need to specify the userId. The rest will use default values from the entity definition
      const newPreference = {
        userId,
      };
      
      // Use retry service for repository operations with exponential backoff
      return await this.retryService.executeWithRetry(
        async () => this.notificationPreferenceRepository.create(newPreference),
        {
          operation: 'create',
          entityType: 'NotificationPreference',
          context: { userId },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to create notification preferences for user ${userId}`,
        error,
        'PreferencesService',
      );
      
      throw new JourneyError(
        'Failed to create notification preferences',
        ErrorType.TECHNICAL,
        NOTIFICATION_ERROR_CODES.PREFERENCE_CREATION_FAILED,
        { userId },
        error,
      );
    } finally {
      span.end();
    }
  }

  /**
   * Updates an existing notification preference record.
   * Implements retry mechanisms for repository operations and structured logging.
   * 
   * @param id - The ID of the notification preference record (as string)
   * @param data - Partial notification preference data to update
   * @returns A promise that resolves to the updated NotificationPreference entity
   */
  async update(
    id: string,
    data: Partial<NotificationPreference>,
  ): Promise<NotificationPreference> {
    const span = this.tracing.startSpan('PreferencesService.update');
    
    try {
      span.setAttributes({
        'preference.id': id,
        'update.data': JSON.stringify(data),
      });
      
      this.logger.log(
        `Updating notification preferences with ID ${id}`,
        { id, data },
        'PreferencesService',
      );
      
      // Validate update data
      this.validateUpdateData(data);
      
      // Use retry service for repository operations with exponential backoff
      return await this.retryService.executeWithRetry(
        async () => this.notificationPreferenceRepository.update(id, data),
        {
          operation: 'update',
          entityType: 'NotificationPreference',
          context: { id, data },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to update notification preferences with ID ${id}`,
        error,
        'PreferencesService',
      );
      
      throw new JourneyError(
        'Failed to update notification preferences',
        error.type || ErrorType.TECHNICAL,
        error.code || NOTIFICATION_ERROR_CODES.PREFERENCE_UPDATE_FAILED,
        { id, data },
        error,
      );
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves notification preferences for a specific user.
   * Implements retry mechanisms for repository operations and structured logging.
   * 
   * @param userId - The ID of the user
   * @returns A promise that resolves to the user's NotificationPreference entity or null if not found
   */
  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    const span = this.tracing.startSpan('PreferencesService.findByUserId');
    
    try {
      span.setAttributes({
        'user.id': userId,
      });
      
      this.logger.log(
        `Retrieving notification preferences for user ${userId}`,
        { userId },
        'PreferencesService',
      );
      
      // Use retry service for repository operations with exponential backoff
      const preferences = await this.retryService.executeWithRetry(
        async () => this.notificationPreferenceRepository.findAll({ where: { userId } }),
        {
          operation: 'findByUserId',
          entityType: 'NotificationPreference',
          context: { userId },
        },
      );
      
      return preferences.length > 0 ? preferences[0] : null;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve notification preferences for user ${userId}`,
        error,
        'PreferencesService',
      );
      
      throw new JourneyError(
        'Failed to retrieve notification preferences for user',
        ErrorType.TECHNICAL,
        NOTIFICATION_ERROR_CODES.PREFERENCE_RETRIEVAL_FAILED,
        { userId },
        error,
      );
    } finally {
      span.end();
    }
  }

  /**
   * Ensures a user has notification preferences, creating default ones if none exist.
   * Implements retry mechanisms for repository operations and structured logging.
   * 
   * @param userId - The ID of the user
   * @returns A promise that resolves to the user's NotificationPreference entity
   */
  async ensureUserPreferences(userId: string): Promise<NotificationPreference> {
    const span = this.tracing.startSpan('PreferencesService.ensureUserPreferences');
    
    try {
      span.setAttributes({
        'user.id': userId,
      });
      
      this.logger.log(
        `Ensuring notification preferences exist for user ${userId}`,
        { userId },
        'PreferencesService',
      );
      
      // Check if preferences already exist
      const existingPreferences = await this.findByUserId(userId);
      
      // If preferences exist, return them
      if (existingPreferences) {
        return existingPreferences;
      }
      
      // Otherwise, create new preferences
      this.logger.log(
        `No preferences found for user ${userId}, creating defaults`,
        { userId },
        'PreferencesService',
      );
      
      return await this.create(userId);
    } catch (error) {
      this.logger.error(
        `Failed to ensure notification preferences for user ${userId}`,
        error,
        'PreferencesService',
      );
      
      throw new JourneyError(
        'Failed to ensure notification preferences',
        ErrorType.TECHNICAL,
        NOTIFICATION_ERROR_CODES.PREFERENCE_ENSURE_FAILED,
        { userId },
        error,
      );
    } finally {
      span.end();
    }
  }

  /**
   * Validates update data for notification preferences.
   * Throws validation errors if data is invalid.
   * 
   * @param data - The data to validate
   * @private
   */
  private validateUpdateData(data: Partial<NotificationPreference>): void {
    // Ensure we're not trying to update userId
    if (data.userId !== undefined) {
      throw new JourneyError(
        'Cannot update userId for notification preferences',
        ErrorType.VALIDATION,
        NOTIFICATION_ERROR_CODES.PREFERENCE_VALIDATION_FAILED,
        { invalidField: 'userId' },
      );
    }
    
    // Ensure boolean fields are actually booleans
    const booleanFields = ['pushEnabled', 'emailEnabled', 'smsEnabled'];
    
    for (const field of booleanFields) {
      if (data[field] !== undefined && typeof data[field] !== 'boolean') {
        throw new JourneyError(
          `Field ${field} must be a boolean`,
          ErrorType.VALIDATION,
          NOTIFICATION_ERROR_CODES.PREFERENCE_VALIDATION_FAILED,
          { invalidField: field, value: data[field] },
        );
      }
    }
  }
}