/**
 * Interface for notification content payload
 * 
 * Represents the core content of a notification that will be sent to a user
 * through one or more delivery channels.
 */
export interface INotificationPayload {
  /**
   * Notification title/headline
   */
  title: string;
  
  /**
   * Notification body content
   */
  body: string;
  
  /**
   * Additional data to be included with the notification
   * This can include journey-specific data, deep links, etc.
   */
  data?: Record<string, any>;
  
  /**
   * Optional image URL to be displayed with the notification
   */
  imageUrl?: string;
  
  /**
   * Optional action buttons to be displayed with the notification
   */
  actions?: INotificationAction[];
}

/**
 * Interface for notification action buttons
 */
export interface INotificationAction {
  /**
   * Action identifier
   */
  id: string;
  
  /**
   * Display text for the action button
   */
  title: string;
  
  /**
   * Optional URL or deep link to navigate to when action is clicked
   */
  url?: string;
  
  /**
   * Optional icon to display with the action
   */
  icon?: string;
}