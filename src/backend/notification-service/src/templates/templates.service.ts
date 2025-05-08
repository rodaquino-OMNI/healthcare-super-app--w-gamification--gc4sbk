import { Injectable } from '@nestjs/common'; // @nestjs/common@10.3.0
import { InjectRepository } from '@nestjs/typeorm'; // @nestjs/typeorm@10.0.0+
import { Repository as TypeOrmRepository } from 'typeorm'; // typeorm@0.3.17

// Use path aliases for consistent imports
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';

// Import from @austa packages for standardized interfaces
import { INotificationTemplate, ITemplateData } from '@austa/interfaces/notification/templates';
import { BaseError, ErrorType } from '@austa/errors/base';
import { TemplateError } from '@austa/errors/journey/template-error';

// Import retry-related interfaces and services
import { RetryService } from '../retry/retry.service';
import { IRetryableOperation } from '../retry/interfaces/retryable-operation.interface';
import { RetryStatus } from '../retry/interfaces/retry-status.enum';

// Import local entities
import { NotificationTemplate } from './entities/notification-template.entity';

/**
 * Error class for template-specific errors
 */
class TemplateNotFoundError extends TemplateError {
  constructor(templateId: string, language?: string, journey?: string) {
    super(
      `Template not found: ${templateId}${language ? `, language: ${language}` : ''}${journey ? `, journey: ${journey}` : ''}`,
      {
        templateId,
        language,
        journey,
        errorType: ErrorType.NOT_FOUND,
        errorCode: 'TEMPLATE_NOT_FOUND',
      }
    );
  }
}

/**
 * Provides functionality for managing notification templates.
 * Handles CRUD operations, template versioning, and retrieval by various criteria
 * such as templateId, language, and journey context.
 * 
 * Enhanced with standardized error handling, retry capabilities, and improved logging.
 */
@Injectable()
export class TemplatesService {
  /**
   * Initializes the TemplatesService with required dependencies.
   * @param templateRepository Repository for NotificationTemplate entities
   * @param logger Logger service for logging operations
   * @param tracingService Service for distributed tracing
   * @param retryService Service for handling retries of failed operations
   */
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: TypeOrmRepository<NotificationTemplate>,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly retryService: RetryService,
  ) {}

  /**
   * Finds a template by its ID.
   * @param id The template ID to find
   * @returns The found template or null if not found
   */
  async findById(id: string): Promise<NotificationTemplate | null> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Finding template by ID: ${id}`,
      'TemplatesService',
      { templateId: id, traceId }
    );
    
    return this.templateRepository.findOne({ where: { id } });
  }

  /**
   * Finds templates by their templateId, optionally filtered by language.
   * @param templateId The template identifier to find
   * @param language Optional language filter (e.g., 'pt-BR', 'en-US')
   * @returns Array of matching templates
   */
  async findByTemplateId(
    templateId: string,
    language?: string,
  ): Promise<NotificationTemplate[]> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Finding templates by templateId: ${templateId}, language: ${language || 'any'}`,
      'TemplatesService',
      { templateId, language, traceId }
    );
    
    const filter: Record<string, any> = { templateId };
    
    if (language) {
      filter.language = language;
    }
    
    return this.templateRepository.find({ where: filter });
  }

  /**
   * Finds templates associated with a specific journey.
   * Assumes templates follow a naming convention that indicates journey association.
   * 
   * @param journey The journey identifier (health, care, plan)
   * @param language Optional language filter
   * @returns Array of templates for the specified journey
   * @throws TemplateError if the journey type is invalid
   */
  async findByJourney(
    journey: string,
    language?: string,
  ): Promise<NotificationTemplate[]> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Finding templates by journey: ${journey}, language: ${language || 'any'}`,
      'TemplatesService',
      { journey, language, traceId }
    );
    
    // Validate that the journey is a valid journey type
    if (!Object.values(JOURNEY_IDS).includes(journey)) {
      const error = new TemplateError(
        `Invalid journey type: ${journey}`,
        {
          journey,
          errorType: ErrorType.VALIDATION,
          errorCode: 'INVALID_JOURNEY_TYPE',
          traceId,
        }
      );
      
      this.logger.error(
        `Invalid journey type: ${journey}`,
        error,
        'TemplatesService',
        { journey, language, traceId }
      );
      
      throw error;
    }
    
    // Get all templates
    const allTemplates = await this.findAll();
    
    // Filter templates by journey
    // Assumption: Templates follow a naming convention that includes the journey
    const journeyTemplates = allTemplates.filter(template => {
      return template.templateId.toLowerCase().includes(journey.toLowerCase());
    });
    
    // Apply language filter if specified
    if (language) {
      return journeyTemplates.filter(template => template.language === language);
    }
    
    return journeyTemplates;
  }

  /**
   * Finds all templates, optionally filtered.
   * @param filter Optional filter criteria
   * @returns Array of templates matching the filter
   */
  async findAll(filter?: any): Promise<NotificationTemplate[]> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Finding all templates with filter: ${filter ? JSON.stringify(filter) : 'none'}`,
      'TemplatesService',
      { filter, traceId }
    );
    
    return this.templateRepository.find({ where: filter });
  }

  /**
   * Creates a new notification template.
   * Implements retry capabilities for resilient template creation.
   * 
   * @param template The template data to create
   * @returns The created template
   */
  async create(
    template: Omit<NotificationTemplate, 'id'>,
  ): Promise<NotificationTemplate> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Creating template with templateId: ${template.templateId}`,
      'TemplatesService',
      { templateId: template.templateId, language: template.language, traceId }
    );
    
    try {
      const newTemplate = this.templateRepository.create(template);
      return await this.templateRepository.save(newTemplate);
    } catch (error) {
      this.logger.error(
        `Error creating template with templateId: ${template.templateId}`,
        error,
        'TemplatesService',
        { templateId: template.templateId, language: template.language, traceId }
      );
      
      // Create a retryable operation for template creation
      const operation: IRetryableOperation = {
        execute: async () => {
          const newTemplate = this.templateRepository.create(template);
          return this.templateRepository.save(newTemplate);
        },
        getPayload: () => template,
        getMetadata: () => ({
          templateId: template.templateId,
          language: template.language,
          operation: 'create',
        }),
      };
      
      // Schedule retry for the failed operation
      const retryStatus = await this.retryService.scheduleRetry(
        operation,
        error instanceof Error ? error : new Error(String(error)),
        {
          notificationId: 0, // No notification ID for template operations
          userId: 'system', // Template operations are typically system operations
          channel: 'system',
        }
      );
      
      if (retryStatus === RetryStatus.EXHAUSTED) {
        throw new TemplateError(
          `Failed to create template after multiple retry attempts: ${template.templateId}`,
          {
            templateId: template.templateId,
            language: template.language,
            errorType: ErrorType.SYSTEM,
            errorCode: 'TEMPLATE_CREATE_FAILED',
            traceId,
            originalError: error,
          }
        );
      }
      
      throw new TemplateError(
        `Error creating template: ${template.templateId}. Retry scheduled.`,
        {
          templateId: template.templateId,
          language: template.language,
          errorType: ErrorType.TRANSIENT,
          errorCode: 'TEMPLATE_CREATE_RETRY',
          traceId,
          originalError: error,
          retryStatus,
        }
      );
    }
  }

  /**
   * Updates an existing notification template.
   * Implements retry capabilities for resilient template updates.
   * 
   * @param id The ID of the template to update
   * @param template The updated template data
   * @returns The updated template
   * @throws TemplateNotFoundError if the template is not found after update
   */
  async update(
    id: string,
    template: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Updating template with ID: ${id}`,
      'TemplatesService',
      { templateId: id, traceId }
    );
    
    try {
      await this.templateRepository.update(id, template);
      
      const updatedTemplate = await this.findById(id);
      if (!updatedTemplate) {
        const error = new TemplateNotFoundError(id);
        
        this.logger.error(
          `Template with ID ${id} not found after update`,
          error,
          'TemplatesService',
          { templateId: id, traceId }
        );
        
        throw error;
      }
      
      return updatedTemplate;
    } catch (error) {
      // If it's already a TemplateNotFoundError, just rethrow it
      if (error instanceof TemplateNotFoundError) {
        throw error;
      }
      
      this.logger.error(
        `Error updating template with ID: ${id}`,
        error,
        'TemplatesService',
        { templateId: id, traceId }
      );
      
      // Create a retryable operation for template update
      const operation: IRetryableOperation = {
        execute: async () => {
          await this.templateRepository.update(id, template);
          const updatedTemplate = await this.findById(id);
          if (!updatedTemplate) {
            throw new TemplateNotFoundError(id);
          }
          return updatedTemplate;
        },
        getPayload: () => ({ id, ...template }),
        getMetadata: () => ({
          templateId: id,
          operation: 'update',
        }),
      };
      
      // Schedule retry for the failed operation
      const retryStatus = await this.retryService.scheduleRetry(
        operation,
        error instanceof Error ? error : new Error(String(error)),
        {
          notificationId: 0, // No notification ID for template operations
          userId: 'system', // Template operations are typically system operations
          channel: 'system',
        }
      );
      
      if (retryStatus === RetryStatus.EXHAUSTED) {
        throw new TemplateError(
          `Failed to update template after multiple retry attempts: ${id}`,
          {
            templateId: id,
            errorType: ErrorType.SYSTEM,
            errorCode: 'TEMPLATE_UPDATE_FAILED',
            traceId,
            originalError: error,
          }
        );
      }
      
      throw new TemplateError(
        `Error updating template: ${id}. Retry scheduled.`,
        {
          templateId: id,
          errorType: ErrorType.TRANSIENT,
          errorCode: 'TEMPLATE_UPDATE_RETRY',
          traceId,
          originalError: error,
          retryStatus,
        }
      );
    }
  }

  /**
   * Deletes a notification template by ID.
   * Implements retry capabilities for resilient template deletion.
   * 
   * @param id The ID of the template to delete
   * @returns True if the template was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Deleting template with ID: ${id}`,
      'TemplatesService',
      { templateId: id, traceId }
    );
    
    try {
      const result = await this.templateRepository.delete(id);
      return result.affected > 0;
    } catch (error) {
      this.logger.error(
        `Error deleting template with ID: ${id}`,
        error,
        'TemplatesService',
        { templateId: id, traceId }
      );
      
      // Create a retryable operation for template deletion
      const operation: IRetryableOperation = {
        execute: async () => {
          const result = await this.templateRepository.delete(id);
          return result.affected > 0;
        },
        getPayload: () => ({ id }),
        getMetadata: () => ({
          templateId: id,
          operation: 'delete',
        }),
      };
      
      // Schedule retry for the failed operation
      const retryStatus = await this.retryService.scheduleRetry(
        operation,
        error instanceof Error ? error : new Error(String(error)),
        {
          notificationId: 0, // No notification ID for template operations
          userId: 'system', // Template operations are typically system operations
          channel: 'system',
        }
      );
      
      if (retryStatus === RetryStatus.EXHAUSTED) {
        throw new TemplateError(
          `Failed to delete template after multiple retry attempts: ${id}`,
          {
            templateId: id,
            errorType: ErrorType.SYSTEM,
            errorCode: 'TEMPLATE_DELETE_FAILED',
            traceId,
            originalError: error,
          }
        );
      }
      
      throw new TemplateError(
        `Error deleting template: ${id}. Retry scheduled.`,
        {
          templateId: id,
          errorType: ErrorType.TRANSIENT,
          errorCode: 'TEMPLATE_DELETE_RETRY',
          traceId,
          originalError: error,
          retryStatus,
        }
      );
    }
  }

  /**
   * Gets the appropriate template for a notification based on templateId, language, and journey.
   * Uses a fallback strategy to find the best matching template.
   * 
   * @param templateId The template identifier
   * @param language The preferred language
   * @param journey The journey context (optional)
   * @returns The best matching template for the notification
   * @throws TemplateNotFoundError if no template is found
   */
  async getTemplateForNotification(
    templateId: string,
    language: string,
    journey?: string,
  ): Promise<NotificationTemplate> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Getting template for notification - templateId: ${templateId}, language: ${language}, journey: ${journey || 'any'}`,
      'TemplatesService',
      { templateId, language, journey, traceId }
    );
    
    let template: NotificationTemplate = null;
    
    // Try to find a template matching all criteria
    if (journey) {
      try {
        const journeyTemplates = await this.findByJourney(journey, language);
        const matchingTemplates = journeyTemplates.filter(
          t => t.templateId === templateId
        );
        
        if (matchingTemplates.length > 0) {
          template = matchingTemplates[0];
        }
      } catch (error) {
        // If journey is invalid, log the error but continue with fallback strategy
        this.logger.warn(
          `Error finding journey-specific template: ${error.message}. Falling back to language-specific template.`,
          'TemplatesService',
          { templateId, language, journey, traceId }
        );
      }
    }
    
    // If no journey-specific template found, try to find one with language match
    if (!template) {
      const languageTemplates = await this.findByTemplateId(templateId, language);
      
      if (languageTemplates.length > 0) {
        template = languageTemplates[0];
      }
    }
    
    // If still no template found, try to find any template with matching templateId
    if (!template) {
      const anyTemplates = await this.findByTemplateId(templateId);
      
      if (anyTemplates.length > 0) {
        template = anyTemplates[0];
      }
    }
    
    // If no template found at all, throw an error
    if (!template) {
      const error = new TemplateNotFoundError(templateId, language, journey);
      
      this.logger.error(
        `No template found for templateId: ${templateId}`,
        error,
        'TemplatesService',
        { templateId, language, journey, traceId }
      );
      
      throw error;
    }
    
    return template;
  }

  /**
   * Formats a template by replacing placeholders with actual data.
   * Handles placeholders in the format {{variableName}} in both title and body.
   * 
   * @param template The template to format
   * @param data The data to use for placeholder replacement
   * @returns Formatted template with placeholders replaced by actual data
   */
  formatTemplateWithData<T extends ITemplateData>(
    template: NotificationTemplate,
    data: T,
  ): INotificationTemplate {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Formatting template ${template.templateId} with data`,
      'TemplatesService',
      { templateId: template.templateId, traceId }
    );
    
    try {
      // Create a copy of the template to avoid modifying the original
      const formattedTemplate: INotificationTemplate = {
        id: template.id,
        templateId: template.templateId,
        language: template.language,
        title: this.replacePlaceholders(template.title, data),
        body: this.replacePlaceholders(template.body, data),
        channels: typeof template.channels === 'string' 
          ? JSON.parse(template.channels) 
          : template.channels,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };
      
      return formattedTemplate;
    } catch (error) {
      this.logger.error(
        `Error formatting template ${template.templateId} with data`,
        error,
        'TemplatesService',
        { templateId: template.templateId, traceId }
      );
      
      throw new TemplateError(
        `Error formatting template: ${template.templateId}`,
        {
          templateId: template.templateId,
          errorType: ErrorType.SYSTEM,
          errorCode: 'TEMPLATE_FORMAT_ERROR',
          traceId,
          originalError: error,
        }
      );
    }
  }

  /**
   * Helper method to replace placeholders in a string with actual data.
   * @param text Text containing placeholders like {{variable}}
   * @param data Object containing the replacement values
   * @returns Text with placeholders replaced
   * @private
   */
  private replacePlaceholders<T extends Record<string, any>>(
    text: string,
    data: T,
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      // Check if the key exists in the data object
      if (data[key] === undefined) {
        this.logger.warn(
          `Placeholder {{${key}}} not found in data`,
          'TemplatesService',
          { key, availableKeys: Object.keys(data) }
        );
        return match; // Keep the placeholder if the key is not found
      }
      
      // Convert the value to string
      return String(data[key]);
    });
  }
}