/**
 * Interface for notification templates
 * 
 * Represents a template for generating notification content with variable substitution.
 */
export interface INotificationTemplate {
  /**
   * Unique identifier for the template
   */
  id: number;
  
  /**
   * Template identifier used for lookups
   */
  templateId: string;
  
  /**
   * Language code for this template version
   */
  language: string;
  
  /**
   * Template title with variable placeholders
   * Example: "Your appointment with {{doctorName}} is confirmed"
   */
  title: string;
  
  /**
   * Template body with variable placeholders
   * Example: "Your appointment is scheduled for {{date}} at {{time}}."
   */
  body: string;
  
  /**
   * Optional image URL template with variable placeholders
   */
  imageUrl?: string;
  
  /**
   * Journey context this template belongs to (health, care, plan, game)
   */
  journeyContext?: string;
  
  /**
   * Notification type this template is used for
   */
  type: string;
  
  /**
   * Required variables that must be provided when using this template
   */
  requiredVariables?: string[];
  
  /**
   * Optional variables that can be provided when using this template
   */
  optionalVariables?: string[];
  
  /**
   * Whether this template is active
   */
  isActive: boolean;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
}