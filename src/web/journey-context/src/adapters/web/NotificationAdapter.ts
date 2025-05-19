/**
 * @file NotificationAdapter.ts
 * @description Web-specific notification adapter that handles browser notifications,
 * WebSocket connections for real-time updates, and notification storage in the browser environment.
 */

import {
  Notification,
  NotificationFilter,
  NotificationCount,
  NotificationStatus,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  SendNotificationRequest
} from '@austa/interfaces/notification/types';

// Storage keys
const NOTIFICATION_STORAGE_KEY = 'austa_notifications';
const NOTIFICATION_PERMISSION_KEY = 'austa_notification_permission';

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

  /**
   * Requests permission for browser notifications
   * @returns A promise that resolves with the permission status
   */
  requestNotificationPermission: () => Promise<boolean>;

  /**
   * Shows a browser notification
   * @param notification - The notification to show
   * @returns A promise that resolves when the operation is complete
   */
  showBrowserNotification: (notification: SendNotificationRequest) => Promise<void>;

  /**
   * Initializes the notification adapter
   * @param onNotificationReceived - Callback for when a notification is received
   * @param onNotificationOpened - Callback for when a notification is opened
   * @returns A promise that resolves when initialization is complete
   */
  initialize: (
    onNotificationReceived: (notification: Notification) => void,
    onNotificationOpened: (notification: Notification) => void
  ) => Promise<void>;

  /**
   * Connects to the WebSocket server for real-time notifications
   * @param userId - The ID of the user to subscribe to notifications for
   * @returns A promise that resolves when the connection is established
   */
  connectWebSocket: (userId: string) => Promise<void>;

  /**
   * Disconnects from the WebSocket server
   * @returns A promise that resolves when the connection is closed
   */
  disconnectWebSocket: () => Promise<void>;

  /**
   * Cleans up the notification adapter resources
   * @returns A promise that resolves when cleanup is complete
   */
  cleanup: () => Promise<void>;
}

/**
 * Web implementation of the notification adapter
 */
class WebNotificationAdapter implements NotificationAdapter {
  private socket: WebSocket | null = null;
  private onNotificationReceivedCallback: ((notification: Notification) => void) | null = null;
  private onNotificationOpenedCallback: ((notification: Notification) => void) | null = null;
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  /**
   * Initializes the notification adapter
   * @param onNotificationReceived - Callback for when a notification is received
   * @param onNotificationOpened - Callback for when a notification is opened
   * @returns A promise that resolves when initialization is complete
   */
  public async initialize(
    onNotificationReceived: (notification: Notification) => void,
    onNotificationOpened: (notification: Notification) => void
  ): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.onNotificationReceivedCallback = onNotificationReceived;
    this.onNotificationOpenedCallback = onNotificationOpened;

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
    }

    this.isInitialized = true;
  }

  /**
   * Cleans up the notification adapter resources
   * @returns A promise that resolves when cleanup is complete
   */
  public async cleanup(): Promise<void> {
    // Disconnect WebSocket
    await this.disconnectWebSocket();

    // Clear callbacks
    this.onNotificationReceivedCallback = null;
    this.onNotificationOpenedCallback = null;
    this.isInitialized = false;

    // Clear reconnect timeout if any
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Requests permission for browser notifications
   * @returns A promise that resolves with the permission status
   */
  public async requestNotificationPermission(): Promise<boolean> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notifications');
        return false;
      }

      // Check if we already have permission
      if (Notification.permission === 'granted') {
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
        return true;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';

      if (granted) {
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Shows a browser notification
   * @param notification - The notification to show
   * @returns A promise that resolves when the operation is complete
   */
  public async showBrowserNotification(notification: SendNotificationRequest): Promise<void> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notifications');
        return;
      }

      // Check if we have permission
      if (Notification.permission !== 'granted') {
        const granted = await this.requestNotificationPermission();
        if (!granted) {
          console.warn('Notification permission not granted');
          return;
        }
      }

      // Create notification options
      const options: NotificationOptions = {
        body: notification.body,
        icon: this.getIconForNotificationType(notification.type),
        tag: notification.userId, // Use userId as tag to group notifications
        data: {
          id: Math.random().toString(36).substring(2, 15),
          userId: notification.userId,
          type: notification.type,
          data: notification.data,
          createdAt: new Date().toISOString(),
        },
      };

      // Create and show the notification
      const browserNotification = new Notification(notification.title, options);

      // Handle notification click
      browserNotification.onclick = () => {
        // Focus on the window
        window.focus();

        // Convert to our notification format
        const austaNotification = this.createNotificationFromBrowserNotification(
          browserNotification,
          notification
        );

        // Call the callback
        if (this.onNotificationOpenedCallback) {
          this.onNotificationOpenedCallback(austaNotification);
        }

        // Store the notification
        this.storeNotification(austaNotification);

        // Close the notification
        browserNotification.close();
      };

      // Handle notification show
      browserNotification.onshow = () => {
        // Convert to our notification format
        const austaNotification = this.createNotificationFromBrowserNotification(
          browserNotification,
          notification
        );

        // Call the callback
        if (this.onNotificationReceivedCallback) {
          this.onNotificationReceivedCallback(austaNotification);
        }

        // Store the notification
        this.storeNotification(austaNotification);
      };
    } catch (error) {
      console.error('Error showing browser notification:', error);
      throw error;
    }
  }

  /**
   * Connects to the WebSocket server for real-time notifications
   * @param userId - The ID of the user to subscribe to notifications for
   * @returns A promise that resolves when the connection is established
   */
  public async connectWebSocket(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.socket) {
          this.socket.close();
        }

        // Reset reconnect attempts
        this.reconnectAttempts = 0;

        // Create WebSocket connection
        // Use secure WebSocket if the page is served over HTTPS
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/notifications/ws?userId=${userId}`;

        this.socket = new WebSocket(wsUrl);

        // Handle connection open
        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          resolve();
        };

        // Handle connection error
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.attemptReconnect(userId);
          reject(error);
        };

        // Handle connection close
        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
          this.attemptReconnect(userId);
        };

        // Handle incoming messages
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Check if it's a notification
            if (data.type && data.userId) {
              const notification: Notification = {
                id: data.id || Math.random().toString(36).substring(2, 15),
                userId: data.userId,
                type: data.type,
                title: data.title || '',
                body: data.body || '',
                channel: NotificationChannel.IN_APP,
                status: NotificationStatus.DELIVERED,
                priority: data.priority || NotificationPriority.MEDIUM,
                data: data.data,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              };

              // Call the callback
              if (this.onNotificationReceivedCallback) {
                this.onNotificationReceivedCallback(notification);
              }

              // Store the notification
              this.storeNotification(notification);

              // Show browser notification if applicable
              if (data.showBrowserNotification) {
                this.showBrowserNotification({
                  userId: notification.userId,
                  type: notification.type,
                  title: notification.title,
                  body: notification.body,
                  priority: notification.priority,
                  data: notification.data,
                });
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server
   * @returns A promise that resolves when the connection is closed
   */
  public async disconnectWebSocket(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        // Clear reconnect timeout if any
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        // Close the connection
        this.socket.close();
        this.socket = null;
      }
      resolve();
    });
  }

  /**
   * Attempts to reconnect to the WebSocket server
   * @param userId - The ID of the user to subscribe to notifications for
   */
  private attemptReconnect(userId: string): void {
    // Clear existing timeout if any
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Check if we've reached the maximum number of attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Maximum reconnect attempts reached');
      return;
    }

    // Increment reconnect attempts
    this.reconnectAttempts++;

    // Calculate backoff time (exponential backoff)
    const backoffTime = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect in ${backoffTime}ms (attempt ${this.reconnectAttempts})`);

    // Set timeout for reconnection
    this.reconnectTimeout = setTimeout(() => {
      this.connectWebSocket(userId).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, backoffTime);
  }

  /**
   * Retrieves notifications for a user
   * @param userId - The ID of the user
   * @returns A promise that resolves to an array of notifications
   */
  public async getNotifications(userId: string): Promise<Notification[]> {
    try {
      // Try to get notifications from localStorage
      const storedNotifications = await this.getStoredNotifications();
      
      // Filter notifications for the specified user
      return storedNotifications.filter(notification => notification.userId === userId);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Marks a notification as read
   * @param notificationId - The ID of the notification to mark as read
   * @returns A promise that resolves when the operation is complete
   */
  public async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // Get stored notifications
      const storedNotifications = await this.getStoredNotifications();
      
      // Find and update the notification
      const updatedNotifications = storedNotifications.map(notification => {
        if (notification.id === notificationId) {
          return {
            ...notification,
            status: NotificationStatus.READ,
            readAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return notification;
      });
      
      // Save the updated notifications
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updatedNotifications));
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
      // Get stored notifications
      const storedNotifications = await this.getStoredNotifications();
      
      // Filter out the notification to delete
      const updatedNotifications = storedNotifications.filter(
        notification => notification.id !== notificationId
      );
      
      // Save the updated notifications
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updatedNotifications));
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
      // Get notifications for the user
      const notifications = await this.getNotifications(userId);
      
      // Count total and unread notifications
      const total = notifications.length;
      const unread = notifications.filter(
        notification => notification.status === NotificationStatus.DELIVERED || 
                        notification.status === NotificationStatus.SENT
      ).length;
      
      // Count by type
      const byType: Record<NotificationType, number> = {} as Record<NotificationType, number>;
      
      notifications.forEach(notification => {
        const type = notification.type;
        byType[type] = (byType[type] || 0) + 1;
      });
      
      return { total, unread, byType };
    } catch (error) {
      console.error('Error getting notification counts:', error);
      return { total: 0, unread: 0, byType: {} };
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
      // Get all notifications for the user
      const notifications = await this.getNotifications(userId);
      
      // Apply filters
      return notifications.filter(notification => {
        // Filter by types
        if (filter.types && filter.types.length > 0 && !filter.types.includes(notification.type)) {
          return false;
        }
        
        // Filter by status
        if (filter.status && notification.status !== filter.status) {
          return false;
        }
        
        // Filter by channel
        if (filter.channel && notification.channel !== filter.channel) {
          return false;
        }
        
        // Filter by read status
        if (filter.read !== undefined) {
          const isRead = notification.status === NotificationStatus.READ;
          if (filter.read !== isRead) {
            return false;
          }
        }
        
        // Filter by date range
        if (filter.startDate) {
          const startDate = new Date(filter.startDate).getTime();
          const notificationDate = new Date(notification.createdAt).getTime();
          if (notificationDate < startDate) {
            return false;
          }
        }
        
        if (filter.endDate) {
          const endDate = new Date(filter.endDate).getTime();
          const notificationDate = new Date(notification.createdAt).getTime();
          if (notificationDate > endDate) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error filtering notifications:', error);
      return [];
    }
  }

  /**
   * Gets all stored notifications from localStorage
   * @returns A promise that resolves to an array of notifications
   */
  private async getStoredNotifications(): Promise<Notification[]> {
    try {
      const storedData = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (!storedData) {
        return [];
      }
      
      return JSON.parse(storedData) as Notification[];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  /**
   * Stores a notification in localStorage
   * @param notification - The notification to store
   */
  private async storeNotification(notification: Notification): Promise<void> {
    try {
      // Get existing notifications
      const storedNotifications = await this.getStoredNotifications();
      
      // Check if notification already exists
      const existingIndex = storedNotifications.findIndex(n => n.id === notification.id);
      
      if (existingIndex >= 0) {
        // Update existing notification
        storedNotifications[existingIndex] = {
          ...notification,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new notification
        storedNotifications.push(notification);
      }
      
      // Store updated notifications
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(storedNotifications));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Creates a notification from a browser notification
   * @param browserNotification - The browser notification
   * @param requestData - The original notification request data
   * @returns The created notification
   */
  private createNotificationFromBrowserNotification(
    browserNotification: Notification,
    requestData: SendNotificationRequest
  ): Notification {
    // Extract data from the notification
    const { id, userId, type, data } = browserNotification.data || {};
    
    // Create a new notification object
    const notification: Notification = {
      id: id || Math.random().toString(36).substring(2, 15),
      userId: userId || requestData.userId,
      type: type || requestData.type,
      title: browserNotification.title || requestData.title,
      body: browserNotification.body || requestData.body,
      channel: NotificationChannel.PUSH,
      status: NotificationStatus.DELIVERED,
      priority: requestData.priority || NotificationPriority.MEDIUM,
      data: data || requestData.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return notification;
  }

  /**
   * Gets the appropriate icon for a notification type
   * @param type - The notification type
   * @returns The URL of the icon
   */
  private getIconForNotificationType(type: NotificationType): string {
    // Default icon path
    const defaultIcon = '/icons/notification-default.png';
    
    // Map notification types to icons
    const iconMap: Record<NotificationType, string> = {
      [NotificationType.SYSTEM]: '/icons/notification-system.png',
      [NotificationType.ACHIEVEMENT]: '/icons/notification-achievement.png',
      [NotificationType.LEVEL_UP]: '/icons/notification-level-up.png',
      [NotificationType.APPOINTMENT]: '/icons/notification-appointment.png',
      [NotificationType.MEDICATION]: '/icons/notification-medication.png',
      [NotificationType.HEALTH_GOAL]: '/icons/notification-health-goal.png',
      [NotificationType.HEALTH_METRIC]: '/icons/notification-health-metric.png',
      [NotificationType.CLAIM_STATUS]: '/icons/notification-claim.png',
      [NotificationType.BENEFIT_REMINDER]: '/icons/notification-benefit.png',
    };
    
    return iconMap[type] || defaultIcon;
  }
}

// Create and export the singleton instance
const webNotificationAdapter = new WebNotificationAdapter();
export default webNotificationAdapter;