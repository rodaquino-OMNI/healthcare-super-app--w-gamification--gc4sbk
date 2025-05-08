import { Service } from 'src/backend/shared/src/interfaces/service.interface';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { FilterDto } from 'src/backend/shared/src/dto/filter.dto';
import { PaginationDto, PaginatedResponse } from 'src/backend/shared/src/dto/pagination.dto';
import { BaseError } from '@austa/errors';

/**
 * Interface defining the contract for template service operations.
 * Extends the generic Service interface with template-specific functionality.
 * 
 * This interface ensures that implementations properly handle template CRUD operations,
 * template retrieval by various criteria, and template formatting.
 */
export interface ITemplatesService extends Service<NotificationTemplate> {
  /**
   * Finds a template by its ID.
   * 
   * @param id - The template ID to find
   * @returns Promise resolving to the found template or null if not found
   * @throws BaseError with code NOTIFICATION_TEMPLATE_NOT_FOUND if retrieval fails
   */
  findById(id: string): Promise<NotificationTemplate | null>;

  /**
   * Finds all templates matching the provided filter with pagination.
   * 
   * @param pagination - Pagination parameters
   * @param filter - Filter criteria
   * @returns Promise resolving to a paginated response containing the templates
   * @throws BaseError if retrieval fails
   */
  findAll(pagination?: PaginationDto, filter?: FilterDto): Promise<PaginatedResponse<NotificationTemplate>>;

  /**
   * Finds templates by their templateId, optionally filtered by language.
   * 
   * @param templateId - The template identifier to find
   * @param language - Optional language filter (e.g., 'pt-BR', 'en-US')
   * @returns Promise resolving to an array of matching templates
   * @throws BaseError if retrieval fails
   */
  findByTemplateId(templateId: string, language?: string): Promise<NotificationTemplate[]>;

  /**
   * Finds templates associated with a specific journey.
   * Assumes templates follow a naming convention that indicates journey association.
   * 
   * @param journey - The journey identifier (health, care, plan)
   * @param language - Optional language filter
   * @returns Promise resolving to an array of templates for the specified journey
   * @throws BaseError with invalid journey type information if journey is invalid
   */
  findByJourney(journey: string, language?: string): Promise<NotificationTemplate[]>;

  /**
   * Creates a new notification template.
   * 
   * @param template - The template data to create
   * @returns Promise resolving to the created template
   * @throws BaseError if creation fails
   */
  create(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate>;

  /**
   * Updates an existing notification template.
   * 
   * @param id - The ID of the template to update
   * @param template - The updated template data
   * @returns Promise resolving to the updated template
   * @throws BaseError with code NOTIFICATION_TEMPLATE_NOT_FOUND if template not found
   */
  update(id: string, template: Partial<NotificationTemplate>): Promise<NotificationTemplate>;

  /**
   * Deletes a notification template by ID.
   * 
   * @param id - The ID of the template to delete
   * @returns Promise resolving to true if the template was deleted, false otherwise
   * @throws BaseError if deletion fails
   */
  delete(id: string): Promise<boolean>;

  /**
   * Gets the appropriate template for a notification based on templateId, language, and journey.
   * Uses a fallback strategy to find the best matching template.
   * 
   * @param templateId - The template identifier
   * @param language - The preferred language
   * @param journey - The journey context (optional)
   * @returns Promise resolving to the best matching template for the notification
   * @throws BaseError with code NOTIFICATION_TEMPLATE_NOT_FOUND if no template found
   */
  getTemplateForNotification(templateId: string, language: string, journey?: string): Promise<NotificationTemplate>;

  /**
   * Formats a template by replacing placeholders with actual data.
   * Handles placeholders in the format {{variableName}} in both title and body.
   * 
   * @param template - The template to format
   * @param data - The data to use for placeholder replacement
   * @returns Formatted template with placeholders replaced by actual data
   */
  formatTemplateWithData(template: NotificationTemplate, data: Record<string, any>): object;

  /**
   * Count templates matching the provided filter
   * 
   * @param filter - Filter criteria
   * @returns Promise resolving to the count of matching templates
   * @throws BaseError if count operation fails
   */
  count(filter?: FilterDto): Promise<number>;
}