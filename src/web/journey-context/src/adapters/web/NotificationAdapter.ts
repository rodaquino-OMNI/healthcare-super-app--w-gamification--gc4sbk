/**
 * Web-specific notification adapter that handles browser notifications,
 * WebSocket connections for real-time updates, and notification storage
 * in the browser environment.
 */

import {
  Notification,
  NotificationFilter,
  NotificationCount,
  NotificationStatus
} from '@austa/interfaces/notification/types';

/**
 * Interface for the notification adapter methods
 */
export interface NotificationAdapter {
  /**
   * Retrieves notifications for a user
   * @param userId - The ID of the user
   * @returns A promise that resolves to an array of notifications
   */
  getNotifications: (userId: string) => Promise<Notification[]>;
  
  /**
   * Marks a notification as read
   * @param notificationId - The ID of the notification to mark as read
   * @returns A promise that resolves when the operation is complete
   */
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  
  /**
   * Deletes a notification
   * @param notificationId - The ID of the notification to delete
   * @returns A promise that resolves when the operation is complete
   */
  deleteNotification: (notificationId: string) => Promise<void>;
  
  /**
   * Gets notification counts by status
   * @param userId - The ID of the user
   * @returns A promise that resolves to notification counts
   */
  getNotificationCounts: (userId: string) => Promise<NotificationCount>;
  
  /**
   * Filters notifications based on criteria
   * @param userId - The ID of the user
   * @param filter - The filter criteria
   * @returns A promise that resolves to filtered notifications
   */
  filterNotifications: (userId: string, filter: NotificationFilter) => Promise<Notification[]>;
}

/**
 * Web implementation of the notification adapter
 */
class WebNotificationAdapter implements NotificationAdapter {
  /**
   * WebSocket connection for real-time notifications
   */
  private webSocket: WebSocket | null = null;
  
  /**
   * Callback for handling new notifications
   */
  private onNewNotificationCallback: ((notification: Notification) => void) | null = null;
  
  /**
   * Initializes the WebSocket connection for real-time notifications
   * @param userId - The ID of the user
   * @param onNewNotification - Callback for handling new notifications
   */
  public initializeWebSocket(userId: string, onNewNotification: (notification: Notification) => void): void {
    // Store the callback
    this.onNewNotificationCallback = onNewNotification;
    
    // Close existing connection if any
    if (this.webSocket) {
      this.webSocket.close();
    }
    
    // Create new WebSocket connection
    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'wss://api.austa.app'}/notifications?userId=${userId}`;
      this.webSocket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.webSocket.onopen = () => {
        console.log('WebSocket connection established for notifications');
      };
      
      this.webSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification' && data.payload) {
            // Call the callback with the new notification
            if (this.onNewNotificationCallback) {
              this.onNewNotificationCallback(data.payload);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      this.webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.webSocket.onclose = () => {
        console.log('WebSocket connection closed');
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (this.onNewNotificationCallback) {
            this.initializeWebSocket(userId, this.onNewNotificationCallback);
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }
  
  /**
   * Closes the WebSocket connection
   */
  public closeWebSocket(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    this.onNewNotificationCallback = null;
  }
  
  /**
   * Retrieves notifications for a user
   * @param userId - The ID of the user
   * @returns A promise that resolves to an array of notifications
   */
  public async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/notifications?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }
  
  /**
   * Marks a notification as read
   * @param notificationId - The ID of the notification to mark as read
   * @returns A promise that resolves when the operation is complete
   */
  public async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  /**
   * Deletes a notification
   * @param notificationId - The ID of the notification to delete
   * @returns A promise that resolves when the operation is complete
   */
  public async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
  
  /**
   * Gets notification counts by status
   * @param userId - The ID of the user
   * @returns A promise that resolves to notification counts
   */
  public async getNotificationCounts(userId: string): Promise<NotificationCount> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/notifications/counts?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notification counts: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.counts || { total: 0, unread: 0, byType: {} };
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      throw error;
    }
  }
  
  /**
   * Filters notifications based on criteria
   * @param userId - The ID of the user
   * @param filter - The filter criteria
   * @returns A promise that resolves to filtered notifications
   */
  public async filterNotifications(userId: string, filter: NotificationFilter): Promise<Notification[]> {
    try {
      // Build query string from filter
      const queryParams = new URLSearchParams();
      queryParams.append('userId', userId);
      
      if (filter.types && filter.types.length > 0) {
        filter.types.forEach(type => queryParams.append('types', type));
      }
      
      if (filter.status) {
        queryParams.append('status', filter.status);
      }
      
      if (filter.channel) {
        queryParams.append('channel', filter.channel);
      }
      
      if (filter.read !== undefined) {
        queryParams.append('read', filter.read.toString());
      }
      
      if (filter.startDate) {
        queryParams.append('startDate', filter.startDate);
      }
      
      if (filter.endDate) {
        queryParams.append('endDate', filter.endDate);
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/notifications/filter?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to filter notifications: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Error filtering notifications:', error);
      throw error;
    }
  }
  
  /**
   * Requests permission for browser notifications
   * @returns A promise that resolves to the permission status
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }
    
    return Notification.permission;
  }
  
  /**
   * Shows a browser notification
   * @param title - The notification title
   * @param options - The notification options
   * @returns The browser notification object or null if not supported/permitted
   */
  public showBrowserNotification(title: string, options: NotificationOptions): Notification | null {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }
    
    try {
      return new Notification(title, options);
    } catch (error) {
      console.error('Error showing browser notification:', error);
      return null;
    }
  }
}

// Create and export the singleton instance
export const webNotificationAdapter = new WebNotificationAdapter();