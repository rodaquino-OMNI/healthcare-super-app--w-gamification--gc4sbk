import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';

// Import from @app/shared with path aliases instead of direct paths
import { LoggerService } from '@app/shared/logging/logger.service';
import { Repository } from '@app/shared/interfaces/repository.interface';
import { Service } from '@app/shared/interfaces/service.interface';
import { ErrorCodeDetails } from '@app/shared/constants/error-codes.constants';
import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';
import { TracingService } from '@app/shared/tracing/tracing.service';

// Import from @austa/interfaces for standardized types
import { 
  INotificationTemplate, 
  ITemplateData, 
  ITemplateFormatOptions 
} from '@austa/interfaces/common';

// Import from local entities
import { NotificationTemplate } from './entities/notification-template.entity';

// Import RetryService for resilient operations
import { RetryService } from '../retry/retry.service';

// Import error classes for standardized error handling
import { 
  NotificationError, 
  TemplateNotFoundError, 
  TemplateFormatError, 
  InvalidJourneyError 
} from '@app/shared/errors/notification.errors';

/**
 * Provides functionality for managing notification templates.
 * Handles CRUD operations, template versioning, and retrieval by various criteria
 * such as templateId, language, and journey context.
 * 
 * Enhanced with standardized error handling, retry policies, and integration with
 * @austa/interfaces for type safety.
 */
@Injectable()
export class TemplatesService implements Service {
  /**
   * Initializes the TemplatesService with required dependencies.
   * @param templateRepository Repository for NotificationTemplate entities
   * @param logger Logger service for logging operations
   * @param tracing Tracing service for distributed tracing
   * @param retryService Service for handling retry operations
   */
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: TypeOrmRepository<NotificationTemplate>,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService,
    private readonly retryService: RetryService,
  ) {}

  /**
   * Finds a template by its ID with retry capabilities for resilient operations.
   * @param id The template ID to find
   * @param correlationId Optional correlation ID for request tracing
   * @returns The found template or null if not found
   */
  async findById(id: string, correlationId?: string): Promise<NotificationTemplate | null> {
    const span = this.tracing.startSpan('TemplatesService.findById');
    
    try {
      span.setAttributes({
        'template.id': id,
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Finding template by ID: ${id}`,
        'TemplatesService',
        { correlationId, templateId: id }
      );
      
      // Use retry service for resilient database operations
      return await this.retryService.executeWithRetry(
        async () => this.templateRepository.findOne({ where: { id } }),
        {
          operation: 'findTemplateById',
          entityId: id,
          entityType: 'template',
          maxRetries: 3,
        }
      );
    } catch (error) {
      this.logger.error(
        `Error finding template by ID: ${id}`,
        error,
        'TemplatesService',
        { correlationId, templateId: id }
      );
      
      throw new NotificationError(
        `Failed to retrieve template with ID: ${id}`,
        'TEMPLATE_RETRIEVAL_ERROR',
        { cause: error, correlationId }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Finds templates by their templateId, optionally filtered by language.
   * @param templateId The template identifier to find
   * @param language Optional language filter (e.g., 'pt-BR', 'en-US')
   * @param correlationId Optional correlation ID for request tracing
   * @returns Array of matching templates
   */
  async findByTemplateId(
    templateId: string,
    language?: string,
    correlationId?: string,
  ): Promise<NotificationTemplate[]> {
    const span = this.tracing.startSpan('TemplatesService.findByTemplateId');
    
    try {
      span.setAttributes({
        'template.templateId': templateId,
        'template.language': language || 'any',
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Finding templates by templateId: ${templateId}, language: ${language || 'any'}`,
        'TemplatesService',
        { correlationId, templateId, language }
      );
      
      const filter: Record<string, any> = { templateId };
      
      if (language) {
        filter.language = language;
      }
      
      // Use retry service for resilient database operations
      return await this.retryService.executeWithRetry(
        async () => this.templateRepository.find({ where: filter }),
        {
          operation: 'findTemplatesByTemplateId',
          entityId: templateId,
          entityType: 'template',
          maxRetries: 3,
        }
      );
    } catch (error) {
      this.logger.error(
        `Error finding templates by templateId: ${templateId}`,
        error,
        'TemplatesService',
        { correlationId, templateId, language }
      );
      
      throw new NotificationError(
        `Failed to retrieve templates with templateId: ${templateId}`,
        'TEMPLATE_RETRIEVAL_ERROR',
        { cause: error, correlationId }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Finds templates associated with a specific journey.
   * Assumes templates follow a naming convention that indicates journey association.
   * 
   * @param journey The journey identifier (health, care, plan)
   * @param language Optional language filter
   * @param correlationId Optional correlation ID for request tracing
   * @returns Array of templates for the specified journey
   * @throws InvalidJourneyError if the journey type is invalid
   */
  async findByJourney(
    journey: string,
    language?: string,
    correlationId?: string,
  ): Promise<NotificationTemplate[]> {
    const span = this.tracing.startSpan('TemplatesService.findByJourney');
    
    try {
      span.setAttributes({
        'template.journey': journey,
        'template.language': language || 'any',
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Finding templates by journey: ${journey}, language: ${language || 'any'}`,
        'TemplatesService',
        { correlationId, journey, language }
      );
      
      // Validate that the journey is a valid journey type
      if (!Object.values(JOURNEY_IDS).includes(journey)) {
        const error = new InvalidJourneyError(
          `Invalid journey type: ${journey}`,
          'INVALID_JOURNEY_TYPE',
          { journey, correlationId }
        );
        
        this.logger.error(
          `Invalid journey type: ${journey}`,
          error,
          'TemplatesService',
          { correlationId, journey }
        );
        
        throw error;
      }
      
      // Get all templates with retry capability
      const allTemplates = await this.retryService.executeWithRetry(
        async () => this.findAll(undefined, correlationId),
        {
          operation: 'findAllTemplates',
          entityType: 'template',
          maxRetries: 3,
        }
      );
      
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
    } catch (error) {
      // Only log and rethrow if it's not already an InvalidJourneyError
      if (!(error instanceof InvalidJourneyError)) {
        this.logger.error(
          `Error finding templates by journey: ${journey}`,
          error,
          'TemplatesService',
          { correlationId, journey, language }
        );
        
        throw new NotificationError(
          `Failed to retrieve templates for journey: ${journey}`,
          'TEMPLATE_RETRIEVAL_ERROR',
          { cause: error, correlationId }
        );
      }
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Finds all templates, optionally filtered.
   * @param filter Optional filter criteria
   * @param correlationId Optional correlation ID for request tracing
   * @returns Array of templates matching the filter
   */
  async findAll(filter?: any, correlationId?: string): Promise<NotificationTemplate[]> {
    const span = this.tracing.startSpan('TemplatesService.findAll');
    
    try {
      span.setAttributes({
        'template.filter': filter ? JSON.stringify(filter) : 'none',
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Finding all templates with filter: ${filter ? JSON.stringify(filter) : 'none'}`,
        'TemplatesService',
        { correlationId, filter }
      );
      
      // Use retry service for resilient database operations
      return await this.retryService.executeWithRetry(
        async () => this.templateRepository.find({ where: filter }),
        {
          operation: 'findAllTemplates',
          entityType: 'template',
          maxRetries: 3,
        }
      );
    } catch (error) {
      this.logger.error(
        `Error finding all templates`,
        error,
        'TemplatesService',
        { correlationId, filter }
      );
      
      throw new NotificationError(
        'Failed to retrieve templates',
        'TEMPLATE_RETRIEVAL_ERROR',
        { cause: error, correlationId }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Creates a new notification template.
   * @param template The template data to create
   * @param correlationId Optional correlation ID for request tracing
   * @returns The created template
   */
  async create(
    template: Omit<NotificationTemplate, 'id'>,
    correlationId?: string,
  ): Promise<NotificationTemplate> {
    const span = this.tracing.startSpan('TemplatesService.create');
    
    try {
      span.setAttributes({
        'template.templateId': template.templateId,
        'template.language': template.language,
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Creating template with templateId: ${template.templateId}`,
        'TemplatesService',
        { correlationId, templateId: template.templateId, language: template.language }
      );
      
      // Use retry service for resilient database operations
      const newTemplate = this.templateRepository.create(template);
      
      return await this.retryService.executeWithRetry(
        async () => this.templateRepository.save(newTemplate),
        {
          operation: 'createTemplate',
          entityId: template.templateId,
          entityType: 'template',
          maxRetries: 3,
        }
      );
    } catch (error) {
      this.logger.error(
        `Error creating template with templateId: ${template.templateId}`,
        error,
        'TemplatesService',
        { correlationId, templateId: template.templateId }
      );
      
      throw new NotificationError(
        `Failed to create template with templateId: ${template.templateId}`,
        'TEMPLATE_CREATION_ERROR',
        { cause: error, correlationId }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Updates an existing notification template.
   * @param id The ID of the template to update
   * @param template The updated template data
   * @param correlationId Optional correlation ID for request tracing
   * @returns The updated template
   * @throws TemplateNotFoundError if the template is not found after update
   */
  async update(
    id: string,
    template: Partial<NotificationTemplate>,
    correlationId?: string,
  ): Promise<NotificationTemplate> {
    const span = this.tracing.startSpan('TemplatesService.update');
    
    try {
      span.setAttributes({
        'template.id': id,
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Updating template with ID: ${id}`,
        'TemplatesService',
        { correlationId, templateId: id }
      );
      
      // Use retry service for resilient database operations
      await this.retryService.executeWithRetry(
        async () => this.templateRepository.update(id, template),
        {
          operation: 'updateTemplate',
          entityId: id,
          entityType: 'template',
          maxRetries: 3,
        }
      );
      
      const updatedTemplate = await this.findById(id, correlationId);
      if (!updatedTemplate) {
        const error = new TemplateNotFoundError(
          `Template with ID ${id} not found after update`,
          'TEMPLATE_NOT_FOUND',
          { templateId: id, correlationId }
        );
        
        this.logger.error(
          `Template with ID ${id} not found after update`,
          error,
          'TemplatesService',
          { correlationId, templateId: id }
        );
        
        throw error;
      }
      
      return updatedTemplate;
    } catch (error) {
      // Only log and rethrow if it's not already a TemplateNotFoundError
      if (!(error instanceof TemplateNotFoundError)) {
        this.logger.error(
          `Error updating template with ID: ${id}`,
          error,
          'TemplatesService',
          { correlationId, templateId: id }
        );
        
        throw new NotificationError(
          `Failed to update template with ID: ${id}`,
          'TEMPLATE_UPDATE_ERROR',
          { cause: error, correlationId }
        );
      }
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Deletes a notification template by ID.
   * @param id The ID of the template to delete
   * @param correlationId Optional correlation ID for request tracing
   * @returns True if the template was deleted, false otherwise
   */
  async delete(id: string, correlationId?: string): Promise<boolean> {
    const span = this.tracing.startSpan('TemplatesService.delete');
    
    try {
      span.setAttributes({
        'template.id': id,
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Deleting template with ID: ${id}`,
        'TemplatesService',
        { correlationId, templateId: id }
      );
      
      // Use retry service for resilient database operations
      const result = await this.retryService.executeWithRetry(
        async () => this.templateRepository.delete(id),
        {
          operation: 'deleteTemplate',
          entityId: id,
          entityType: 'template',
          maxRetries: 3,
        }
      );
      
      return result.affected > 0;
    } catch (error) {
      this.logger.error(
        `Error deleting template with ID: ${id}`,
        error,
        'TemplatesService',
        { correlationId, templateId: id }
      );
      
      throw new NotificationError(
        `Failed to delete template with ID: ${id}`,
        'TEMPLATE_DELETION_ERROR',
        { cause: error, correlationId }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Gets the appropriate template for a notification based on templateId, language, and journey.
   * Uses a fallback strategy to find the best matching template.
   * 
   * @param templateId The template identifier
   * @param language The preferred language
   * @param journey The journey context (optional)
   * @param correlationId Optional correlation ID for request tracing
   * @returns The best matching template for the notification
   * @throws TemplateNotFoundError if no template is found
   */
  async getTemplateForNotification(
    templateId: string,
    language: string,
    journey?: string,
    correlationId?: string,
  ): Promise<NotificationTemplate> {
    const span = this.tracing.startSpan('TemplatesService.getTemplateForNotification');
    
    try {
      span.setAttributes({
        'template.templateId': templateId,
        'template.language': language,
        'template.journey': journey || 'any',
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Getting template for notification - templateId: ${templateId}, language: ${language}, journey: ${journey || 'any'}`,
        'TemplatesService',
        { correlationId, templateId, language, journey }
      );
      
      let template: NotificationTemplate = null;
      
      // Try to find a template matching all criteria
      if (journey) {
        try {
          const journeyTemplates = await this.findByJourney(journey, language, correlationId);
          const matchingTemplates = journeyTemplates.filter(
            t => t.templateId === templateId
          );
          
          if (matchingTemplates.length > 0) {
            template = matchingTemplates[0];
          }
        } catch (error) {
          // If journey is invalid, log and continue with fallback
          if (error instanceof InvalidJourneyError) {
            this.logger.warn(
              `Invalid journey ${journey}, falling back to language-based template search`,
              'TemplatesService',
              { correlationId, templateId, language, journey }
            );
          } else {
            throw error; // Rethrow other errors
          }
        }
      }
      
      // If no journey-specific template found, try to find one with language match
      if (!template) {
        const languageTemplates = await this.findByTemplateId(templateId, language, correlationId);
        
        if (languageTemplates.length > 0) {
          template = languageTemplates[0];
        }
      }
      
      // If still no template found, try to find any template with matching templateId
      if (!template) {
        const anyTemplates = await this.findByTemplateId(templateId, undefined, correlationId);
        
        if (anyTemplates.length > 0) {
          template = anyTemplates[0];
        }
      }
      
      // If no template found at all, throw an error
      if (!template) {
        const error = new TemplateNotFoundError(
          `No template found for templateId: ${templateId}`,
          'TEMPLATE_NOT_FOUND',
          { templateId, language, journey, correlationId }
        );
        
        this.logger.error(
          `No template found for templateId: ${templateId}`,
          error,
          'TemplatesService',
          { correlationId, templateId, language, journey }
        );
        
        throw error;
      }
      
      return template;
    } catch (error) {
      // Only log and rethrow if it's not already a TemplateNotFoundError or InvalidJourneyError
      if (!(error instanceof TemplateNotFoundError) && !(error instanceof InvalidJourneyError)) {
        this.logger.error(
          `Error getting template for notification - templateId: ${templateId}`,
          error,
          'TemplatesService',
          { correlationId, templateId, language, journey }
        );
        
        throw new NotificationError(
          `Failed to get template for notification with templateId: ${templateId}`,
          'TEMPLATE_RETRIEVAL_ERROR',
          { cause: error, correlationId }
        );
      }
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Formats a template by replacing placeholders with actual data.
   * Handles placeholders in the format {{variableName}} in both title and body.
   * 
   * @param template The template to format
   * @param data The data to use for placeholder replacement
   * @param options Optional formatting options
   * @returns Formatted template with placeholders replaced by actual data
   * @throws TemplateFormatError if formatting fails
   */
  formatTemplateWithData(
    template: NotificationTemplate,
    data: ITemplateData,
    options?: ITemplateFormatOptions,
  ): INotificationTemplate {
    const correlationId = options?.correlationId;
    const span = this.tracing.startSpan('TemplatesService.formatTemplateWithData');
    
    try {
      span.setAttributes({
        'template.id': template.id,
        'template.templateId': template.templateId,
        'correlation.id': correlationId || 'not-provided',
      });
      
      this.logger.log(
        `Formatting template ${template.templateId} with data`,
        'TemplatesService',
        { correlationId, templateId: template.templateId }
      );
      
      // Validate data against required placeholders
      this.validateTemplateData(template, data, correlationId);
      
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
      // Create a specific error for template formatting issues
      const formatError = new TemplateFormatError(
        `Failed to format template ${template.templateId}: ${error.message}`,
        'TEMPLATE_FORMAT_ERROR',
        { 
          templateId: template.templateId, 
          cause: error, 
          correlationId,
          missingData: error.missingData,
        }
      );
      
      this.logger.error(
        `Error formatting template ${template.templateId}`,
        formatError,
        'TemplatesService',
        { correlationId, templateId: template.templateId }
      );
      
      throw formatError;
    } finally {
      span.end();
    }
  }

  /**
   * Validates that all required placeholders in the template have corresponding data.
   * 
   * @param template The template to validate
   * @param data The data to validate against the template
   * @param correlationId Optional correlation ID for request tracing
   * @throws TemplateFormatError if required data is missing
   * @private
   */
  private validateTemplateData(
    template: NotificationTemplate,
    data: ITemplateData,
    correlationId?: string,
  ): void {
    // Extract all placeholders from the template
    const titlePlaceholders = this.extractPlaceholders(template.title);
    const bodyPlaceholders = this.extractPlaceholders(template.body);
    const allPlaceholders = [...new Set([...titlePlaceholders, ...bodyPlaceholders])];
    
    // Check if all placeholders have corresponding data
    const missingData = allPlaceholders.filter(key => data[key] === undefined);
    
    if (missingData.length > 0) {
      const error = new TemplateFormatError(
        `Missing data for template placeholders: ${missingData.join(', ')}`,
        'MISSING_TEMPLATE_DATA',
        { templateId: template.templateId, missingData, correlationId }
      );
      
      this.logger.warn(
        `Missing data for template ${template.templateId} placeholders: ${missingData.join(', ')}`,
        'TemplatesService',
        { correlationId, templateId: template.templateId, missingData }
      );
      
      throw error;
    }
  }

  /**
   * Extracts all placeholders from a template string.
   * 
   * @param text The template text to extract placeholders from
   * @returns Array of placeholder keys
   * @private
   */
  private extractPlaceholders(text: string): string[] {
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    
    while ((match = placeholderRegex.exec(text)) !== null) {
      placeholders.push(match[1]);
    }
    
    return placeholders;
  }

  /**
   * Helper method to replace placeholders in a string with actual data.
   * @param text Text containing placeholders like {{variable}}
   * @param data Object containing the replacement values
   * @returns Text with placeholders replaced
   * @private
   */
  private replacePlaceholders(
    text: string,
    data: ITemplateData,
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }
}