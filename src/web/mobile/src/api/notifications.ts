/**
 * @file notifications.ts
 * @description API client for notification operations with enhanced error handling,
 * retry mechanisms, and caching for improved performance.
 */

import { AxiosResponse } from 'axios';
import { restClient } from './client';

// Import standardized error handling utilities
import {
  withErrorHandling,
  withRetry,
  logError,
  TransientError,
  ErrorCategory
} from './errors';

// Import types from shared interfaces package
import { Notification, NotificationType } from '@austa/interfaces/notification/types';

// Import caching utilities
import { createCache } from './cache';

// Create a cache for notifications with a 5-minute TTL
const notificationsCache = createCache<string, Notification[]>({
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxSize: 10, // Cache for up to 10 different users
  name: 'notifications'
});

/**
 * Retry options specifically tuned for notification operations
 */
const notificationRetryOptions = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffFactor: 1.5,
  shouldRetry: (error: Error) => {
    // Only retry transient errors
    return error instanceof TransientError || 
           (error as any)?.category === ErrorCategory.TRANSIENT;
  }
};

/**
 * Fetches notifications for a given user ID with caching and retry support.
 * 
 * @param userId - The ID of the user whose notifications to fetch
 * @returns Promise that resolves to an array of Notification objects
 */
export const getNotifications = withErrorHandling(
  async (userId: string): Promise<Notification[]> => {
    try {
      // Check cache first
      const cachedNotifications = notificationsCache.get(userId);
      if (cachedNotifications) {
        return cachedNotifications;
      }

      // Using a path-based endpoint instead of constructing absolute URLs
      // This prevents SSRF vulnerabilities (CVE-2023-45857)
      const endpoint = `/notifications?userId=${userId}`;
      
      // Use withRetry for automatic retry with exponential backoff
      const response: AxiosResponse<Notification[]> = await withRetry(
        () => restClient.get(endpoint),
        notificationRetryOptions
      );
      
      // Cache the result
      notificationsCache.set(userId, response.data);
      
      return response.data;
    } catch (error) {
      // Log the error with context
      logError(error, { 
        operation: 'getNotifications', 
        userId 
      });
      throw error;
    }
  },
  undefined, // Use default circuit breaker
  notificationRetryOptions
);

/**
 * Marks a notification as read for a given notification ID with retry support.
 * Also updates the cache to reflect the change.
 * 
 * @param notificationId - The ID of the notification to mark as read
 * @param userId - The ID of the user who owns the notification (for cache updates)
 * @returns Promise that resolves when the notification is successfully marked as read
 */
export const markNotificationAsRead = withErrorHandling(
  async (notificationId: string, userId?: string): Promise<void> => {
    try {
      // Using a path-based endpoint instead of constructing absolute URLs
      // This prevents SSRF vulnerabilities (CVE-2023-45857)
      const endpoint = `/notifications/${notificationId}/read`;
      
      // Use withRetry for automatic retry with exponential backoff
      await withRetry(
        () => restClient.post(endpoint),
        notificationRetryOptions
      );
      
      // Update cache if userId is provided
      if (userId) {
        const cachedNotifications = notificationsCache.get(userId);
        if (cachedNotifications) {
          const updatedNotifications = cachedNotifications.map(notification => {
            if (notification.id === notificationId) {
              return { ...notification, read: true };
            }
            return notification;
          });
          notificationsCache.set(userId, updatedNotifications);
        }
      }
    } catch (error) {
      // Log the error with context
      logError(error, { 
        operation: 'markNotificationAsRead', 
        notificationId,
        userId 
      });
      throw error;
    }
  },
  undefined, // Use default circuit breaker
  notificationRetryOptions
);

/**
 * Invalidates the notifications cache for a specific user.
 * Call this when you know the cache needs to be refreshed.
 * 
 * @param userId - The ID of the user whose cache to invalidate
 */
export const invalidateNotificationsCache = (userId: string): void => {
  notificationsCache.delete(userId);
};

/**
 * Filters notifications by type.
 * 
 * @param notifications - Array of notifications to filter
 * @param type - The notification type to filter by
 * @returns Filtered array of notifications
 */
export const filterNotificationsByType = (
  notifications: Notification[],
  type: NotificationType
): Notification[] => {
  return notifications.filter(notification => notification.type === type);
};

/**
 * Gets the count of unread notifications.
 * 
 * @param notifications - Array of notifications to count
 * @returns Number of unread notifications
 */
export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(notification => !notification.read).length;
};