import { Injectable, Inject } from '@nestjs/common';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Repository } from '@app/shared/interfaces/repository.interface';
import { AppException, ErrorType, ErrorCategory } from '@app/errors/exceptions';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ERROR_CODES } from '@app/shared/constants/error-codes.constants';
import { LoggerService } from '@app/logging/logger.service';
import { RetryService } from '../retry/retry.service';
import { IRetryableOperation } from '../retry/interfaces/retryable-operation.interface';
import { INotificationPreference } from '@austa/interfaces/notification/preferences';
import { CreatePreferenceDto, UpdatePreferenceDto } from './dto/preference.dto';
import { TracingService } from '@app/tracing/tracing.service';

/**
 * Service responsible for managing user notification preferences.
 * Provides methods to retrieve, create, and update notification preferences
 * with standardized error handling and retry mechanisms.
 */
@Injectable()
export class PreferencesService {
  constructor(
    @Inject('NOTIFICATION_PREFERENCE_REPOSITORY')
    private readonly notificationPreferenceRepository: Repository<NotificationPreference>,
    private readonly retryService: RetryService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Retrieves all notification preferences based on the provided filter and pagination parameters.
   * Implements retry mechanism for repository operations and structured logging.
   * 
   * @param filter - Optional filtering criteria
   * @param pagination - Optional pagination parameters
   * @returns A promise that resolves to an array of NotificationPreference entities
   */
  async findAll(
    filter?: FilterDto,
    pagination?: PaginationDto,
  ): Promise<NotificationPreference[]> {
    const traceId = this.tracingService.getCurrentTraceId();
    const context = { filter, pagination, traceId };
    
    this.logger.debug('Retrieving notification preferences', 'PreferencesService.findAll', context);
    
    try {
      // Create a retryable operation for the repository call
      const operation: IRetryableOperation = {
        execute: async () => this.notificationPreferenceRepository.findAll(filter),
        getPayload: () => ({ filter, pagination }),
        getMetadata: () => ({ operation: 'findAll', traceId })
      };
      
      // Execute the operation with retry capability
      const result = await this.executeWithRetry(operation, 'findAll', context);
      
      this.logger.debug(
        `Retrieved ${result.length} notification preferences`, 
        'PreferencesService.findAll', 
        { ...context, count: result.length }
      );
      
      return result;
    } catch (error) {
      this.logger.error(
        'Failed to retrieve notification preferences', 
        error, 
        'PreferencesService.findAll', 
        context
      );
      
      throw new AppException({
        message: 'Failed to retrieve notification preferences',
        category: ErrorCategory.DATABASE,
        type: ErrorType.TECHNICAL,
        code: ERROR_CODES.NOTIFICATION_PREFERENCES_RETRIEVAL_FAILED,
        context,
        cause: error,
      });
    }
  }

  /**
   * Retrieves a notification preference by ID.
   * 
   * @param id - The ID of the notification preference to retrieve
   * @returns A promise that resolves to the NotificationPreference entity
   */
  async findById(id: string): Promise<NotificationPreference> {
    const traceId = this.tracingService.getCurrentTraceId();
    const context = { id, traceId };
    
    this.logger.debug('Retrieving notification preference by ID', 'PreferencesService.findById', context);
    
    try {
      // Create a retryable operation for the repository call
      const operation: IRetryableOperation = {
        execute: async () => {
          const result = await this.notificationPreferenceRepository.findOne(id);
          if (!result) {
            throw new AppException({
              message: 'Notification preference not found',
              category: ErrorCategory.ENTITY_NOT_FOUND,
              type: ErrorType.BUSINESS,
              code: ERROR_CODES.NOTIFICATION_PREFERENCE_NOT_FOUND,
              context,
            });
          }
          return result;
        },
        getPayload: () => ({ id }),
        getMetadata: () => ({ operation: 'findById', traceId })
      };
      
      // Execute the operation with retry capability
      const result = await this.executeWithRetry(operation, 'findById', context);
      
      this.logger.debug(
        'Retrieved notification preference by ID', 
        'PreferencesService.findById', 
        { ...context, found: !!result }
      );
      
      return result;
    } catch (error) {
      // Don't retry NOT_FOUND errors
      if (error instanceof AppException && 
          error.category === ErrorCategory.ENTITY_NOT_FOUND) {
        throw error;
      }
      
      this.logger.error(
        'Failed to retrieve notification preference by ID', 
        error, 
        'PreferencesService.findById', 
        context
      );
      
      throw new AppException({
        message: 'Failed to retrieve notification preference',
        category: ErrorCategory.DATABASE,
        type: ErrorType.TECHNICAL,
        code: ERROR_CODES.NOTIFICATION_PREFERENCE_RETRIEVAL_FAILED,
        context,
        cause: error,
      });
    }
  }

  /**
   * Finds a notification preference by user ID.
   * 
   * @param userId - The ID of the user
   * @returns A promise that resolves to the NotificationPreference entity or null if not found
   */
  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    const traceId = this.tracingService.getCurrentTraceId();
    const context = { userId, traceId };
    
    this.logger.debug('Retrieving notification preference by user ID', 'PreferencesService.findByUserId', context);
    
    try {
      // Create a retryable operation for the repository call
      const operation: IRetryableOperation = {
        execute: async () => {
          // Assuming the repository has a findByUserId method or we use findAll with a filter
          const filter = { userId } as FilterDto;
          const results = await this.notificationPreferenceRepository.findAll(filter);
          return results.length > 0 ? results[0] : null;
        },
        getPayload: () => ({ userId }),
        getMetadata: () => ({ operation: 'findByUserId', traceId })
      };
      
      // Execute the operation with retry capability
      const result = await this.executeWithRetry(operation, 'findByUserId', context);
      
      this.logger.debug(
        'Retrieved notification preference by user ID', 
        'PreferencesService.findByUserId', 
        { ...context, found: !!result }
      );
      
      return result;
    } catch (error) {
      this.logger.error(
        'Failed to retrieve notification preference by user ID', 
        error, 
        'PreferencesService.findByUserId', 
        context
      );
      
      throw new AppException({
        message: 'Failed to retrieve notification preference by user ID',
        category: ErrorCategory.DATABASE,
        type: ErrorType.TECHNICAL,
        code: ERROR_CODES.NOTIFICATION_PREFERENCE_RETRIEVAL_FAILED,
        context,
        cause: error,
      });
    }
  }

  /**
   * Creates a new notification preference record for a user with default settings.
   * 
   * @param createDto - The DTO containing user ID and optional preference settings
   * @returns A promise that resolves to the newly created NotificationPreference entity
   */
  async create(createDto: CreatePreferenceDto): Promise<NotificationPreference> {
    const traceId = this.tracingService.getCurrentTraceId();
    const context = { userId: createDto.userId, traceId };
    
    this.logger.debug('Creating notification preference', 'PreferencesService.create', context);
    
    try {
      // Create a retryable operation for the repository call
      const operation: IRetryableOperation = {
        execute: async () => {
          // Check if preference already exists for this user
          const existingPreference = await this.findByUserId(createDto.userId);
          if (existingPreference) {
            throw new AppException({
              message: 'Notification preference already exists for this user',
              category: ErrorCategory.DUPLICATE_ENTITY,
              type: ErrorType.BUSINESS,
              code: ERROR_CODES.NOTIFICATION_PREFERENCE_ALREADY_EXISTS,
              context,
            });
          }
          
          // Create new preference with provided or default values
          const newPreference = {
            userId: createDto.userId,
            pushEnabled: createDto.pushEnabled ?? true,
            emailEnabled: createDto.emailEnabled ?? true,
            smsEnabled: createDto.smsEnabled ?? false,
          };
          
          return this.notificationPreferenceRepository.create(newPreference);
        },
        getPayload: () => ({ createDto }),
        getMetadata: () => ({ operation: 'create', traceId })
      };
      
      // Execute the operation with retry capability
      const result = await this.executeWithRetry(operation, 'create', context);
      
      this.logger.info(
        'Created notification preference', 
        'PreferencesService.create', 
        { ...context, preferenceId: result.id }
      );
      
      return result;
    } catch (error) {
      // Don't retry DUPLICATE_ENTITY errors
      if (error instanceof AppException && 
          error.category === ErrorCategory.DUPLICATE_ENTITY) {
        throw error;
      }
      
      this.logger.error(
        'Failed to create notification preference', 
        error, 
        'PreferencesService.create', 
        context
      );
      
      throw new AppException({
        message: 'Failed to create notification preference',
        category: ErrorCategory.DATABASE,
        type: ErrorType.TECHNICAL,
        code: ERROR_CODES.NOTIFICATION_PREFERENCE_CREATION_FAILED,
        context,
        cause: error,
      });
    }
  }

  /**
   * Updates an existing notification preference record.
   * 
   * @param id - The ID of the notification preference record
   * @param updateDto - Partial notification preference data to update
   * @returns A promise that resolves to the updated NotificationPreference entity
   */
  async update(
    id: string,
    updateDto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    const traceId = this.tracingService.getCurrentTraceId();
    const context = { id, updateDto, traceId };
    
    this.logger.debug('Updating notification preference', 'PreferencesService.update', context);
    
    try {
      // Create a retryable operation for the repository call
      const operation: IRetryableOperation = {
        execute: async () => {
          // Verify the preference exists before updating
          await this.findById(id);
          
          // Update the preference
          return this.notificationPreferenceRepository.update(id, updateDto);
        },
        getPayload: () => ({ id, updateDto }),
        getMetadata: () => ({ operation: 'update', traceId })
      };
      
      // Execute the operation with retry capability
      const result = await this.executeWithRetry(operation, 'update', context);
      
      this.logger.info(
        'Updated notification preference', 
        'PreferencesService.update', 
        { ...context, preferenceId: result.id }
      );
      
      return result;
    } catch (error) {
      // Don't retry NOT_FOUND errors
      if (error instanceof AppException && 
          error.category === ErrorCategory.ENTITY_NOT_FOUND) {
        throw error;
      }
      
      this.logger.error(
        'Failed to update notification preference', 
        error, 
        'PreferencesService.update', 
        context
      );
      
      throw new AppException({
        message: 'Failed to update notification preference',
        category: ErrorCategory.DATABASE,
        type: ErrorType.TECHNICAL,
        code: ERROR_CODES.NOTIFICATION_PREFERENCE_UPDATE_FAILED,
        context,
        cause: error,
      });
    }
  }

  /**
   * Helper method to execute a repository operation with retry capability.
   * 
   * @param operation - The retryable operation to execute
   * @param operationName - Name of the operation for logging
   * @param context - Context information for logging and error handling
   * @returns A promise that resolves to the operation result
   * @private
   */
  private async executeWithRetry<T>(
    operation: IRetryableOperation,
    operationName: string,
    context: Record<string, any>
  ): Promise<T> {
    try {
      return await operation.execute() as T;
    } catch (error) {
      // If the error is already an AppException, just rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.warn(
        `Repository operation '${operationName}' failed, attempting retry`,
        'PreferencesService.executeWithRetry',
        { ...context, error: error.message }
      );
      
      // Schedule retry with appropriate metadata
      const retryStatus = await this.retryService.scheduleRetry(
        operation,
        error,
        {
          // Using -1 as a placeholder since this isn't a notification
          notificationId: -1,
          userId: context.userId || 'system',
          channel: 'system',
          attemptCount: 0,
        }
      );
      
      // If retry is pending, throw a specific error
      if (retryStatus === 'PENDING') {
        throw new AppException({
          message: `Operation '${operationName}' scheduled for retry`,
          category: ErrorCategory.RETRY_SCHEDULED,
          type: ErrorType.TECHNICAL,
          code: ERROR_CODES.OPERATION_RETRY_SCHEDULED,
          context,
          cause: error,
        });
      }
      
      // For other retry statuses, rethrow the original error
      throw error;
    }
  }
}