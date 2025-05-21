/**
 * Interface for notification delivery results
 * 
 * Represents the result of a notification delivery attempt through a specific channel.
 */
export interface INotificationResult {
  /**
   * Delivery channel used (push, email, sms, in-app)
   */
  channel?: string;
  
  /**
   * Notification ID in the database
   */
  notificationId: number;
  
  /**
   * Delivery status
   * Possible values:
   * - 'sent': Successfully sent to the delivery channel
   * - 'delivered': Confirmed delivery to the user
   * - 'failed': Failed to deliver
   * - 'retry-scheduled': Failed but scheduled for retry
   * - 'retry-in-progress': Currently being retried
   * - 'retry-failed': Failed to schedule retry
   */
  status: string;
  
  /**
   * Error message if delivery failed
   */
  error?: string;
  
  /**
   * ISO timestamp when the next retry is scheduled
   */
  nextRetryAt?: string;
  
  /**
   * Number of retry attempts made
   */
  retryCount?: number;
}