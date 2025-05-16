/**
 * @file NotificationAdapter.ts
 * @description Mobile-specific notification adapter that handles push notifications,
 * local notifications, and notification persistence in React Native.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { PermissionsAndroid } from 'react-native';

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
const NOTIFICATION_STORAGE_KEY = '@austa/notifications';
const DEVICE_TOKEN_STORAGE_KEY = '@austa/device_token';
const NOTIFICATION_PERMISSION_KEY = '@austa/notification_permission';

// Channel IDs for Android
const CHANNEL_IDS = {
  DEFAULT: 'austa_default_channel',
  HEALTH: 'austa_health_channel',
  CARE: 'austa_care_channel',
  PLAN: 'austa_plan_channel',
  ACHIEVEMENT: 'austa_achievement_channel'
};

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
   * Registers the device for push notifications
   * @returns A promise that resolves with the device token
   */
  registerForPushNotifications: () => Promise<string | null>;

  /**
   * Requests permission for push notifications
   * @returns A promise that resolves with the permission status
   */
  requestNotificationPermission: () => Promise<boolean>;

  /**
   * Schedules a local notification
   * @param notification - The notification to schedule
   * @returns A promise that resolves when the operation is complete
   */
  scheduleLocalNotification: (notification: SendNotificationRequest) => Promise<void>;

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
   * Cleans up the notification adapter resources
   * @returns A promise that resolves when cleanup is complete
   */
  cleanup: () => Promise<void>;
}

/**
 * Mobile implementation of the notification adapter
 */
class MobileNotificationAdapter implements NotificationAdapter {
  private deviceToken: string | null = null;
  private onNotificationReceivedCallback: ((notification: Notification) => void) | null = null;
  private onNotificationOpenedCallback: ((notification: Notification) => void) | null = null;
  private isInitialized = false;

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

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      this.createNotificationChannels();
    }

    // Configure push notifications
    PushNotification.configure({
      // Called when a remote or local notification is opened or received
      onNotification: (notification) => {
        console.log('NOTIFICATION:', notification);

        // Convert to our notification format
        const austaNofication = this.convertToAustaNotification(notification);

        // Call the appropriate callback based on whether the notification was opened or received
        if (notification.userInteraction) {
          if (this.onNotificationOpenedCallback) {
            this.onNotificationOpenedCallback(austaNofication);
          }
        } else {
          if (this.onNotificationReceivedCallback) {
            this.onNotificationReceivedCallback(austaNofication);
          }
        }

        // Store the notification in AsyncStorage
        this.storeNotification(austaNofication);

        // Required on iOS only
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      // Called when the device token is generated or refreshed
      onRegister: async (token) => {
        console.log('DEVICE TOKEN:', token);
        this.deviceToken = token.token;

        // Store the token in AsyncStorage for later use
        try {
          await AsyncStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token.token);
        } catch (error) {
          console.error('Error storing device token:', error);
        }
      },

      // Called when registration fails
      onRegistrationError: (error) => {
        console.error('Registration error:', error.message, error);
      },

      // Android only: GCM or FCM Sender ID
      senderID: '256218572662',

      // iOS only: permission options
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      // Request permissions at initialization
      requestPermissions: false, // We'll handle this manually
    });

    // Try to load the device token from AsyncStorage
    try {
      const storedToken = await AsyncStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
      if (storedToken) {
        this.deviceToken = storedToken;
      }
    } catch (error) {
      console.error('Error loading device token:', error);
    }

    this.isInitialized = true;
  }

  /**
   * Creates notification channels for Android
   */
  private createNotificationChannels(): void {
    // Default channel
    PushNotification.createChannel(
      {
        channelId: CHANNEL_IDS.DEFAULT,
        channelName: 'Default Channel',
        channelDescription: 'Default notification channel',
        importance: Importance.DEFAULT,
        vibrate: true,
      },
      (created) => console.log(`Default channel created: ${created}`)
    );

    // Health journey channel
    PushNotification.createChannel(
      {
        channelId: CHANNEL_IDS.HEALTH,
        channelName: 'Health Notifications',
        channelDescription: 'Notifications for the Health journey',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Health channel created: ${created}`)
    );

    // Care journey channel
    PushNotification.createChannel(
      {
        channelId: CHANNEL_IDS.CARE,
        channelName: 'Care Notifications',
        channelDescription: 'Notifications for the Care journey',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Care channel created: ${created}`)
    );

    // Plan journey channel
    PushNotification.createChannel(
      {
        channelId: CHANNEL_IDS.PLAN,
        channelName: 'Plan Notifications',
        channelDescription: 'Notifications for the Plan journey',
        importance: Importance.DEFAULT,
        vibrate: true,
      },
      (created) => console.log(`Plan channel created: ${created}`)
    );

    // Achievement channel
    PushNotification.createChannel(
      {
        channelId: CHANNEL_IDS.ACHIEVEMENT,
        channelName: 'Achievement Notifications',
        channelDescription: 'Notifications for achievements and rewards',
        importance: Importance.DEFAULT,
        vibrate: true,
        playSound: true,
        soundName: 'achievement',
      },
      (created) => console.log(`Achievement channel created: ${created}`)
    );
  }

  /**
   * Cleans up the notification adapter resources
   * @returns A promise that resolves when cleanup is complete
   */
  public async cleanup(): Promise<void> {
    // Unregister event listeners
    PushNotification.unregister();
    this.onNotificationReceivedCallback = null;
    this.onNotificationOpenedCallback = null;
    this.isInitialized = false;
  }

  /**
   * Requests permission for push notifications
   * @returns A promise that resolves with the permission status
   */
  public async requestNotificationPermission(): Promise<boolean> {
    try {
      // Check if we already have permission
      const storedPermission = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
      if (storedPermission === 'granted') {
        return true;
      }

      // Request permission based on platform
      if (Platform.OS === 'ios') {
        const permission = await PushNotificationIOS.requestPermissions({
          alert: true,
          badge: true,
          sound: true,
        });

        const granted = permission.alert && permission.badge && permission.sound;
        if (granted) {
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
        }
        return granted;
      } else if (Platform.OS === 'android') {
        // For Android 13+ (API level 33+), we need to request the permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'AUSTA SuperApp needs permission to send you notifications',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          const permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          if (permissionGranted) {
            await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
          }
          return permissionGranted;
        }

        // For Android < 13, permissions are granted at install time
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Registers the device for push notifications
   * @returns A promise that resolves with the device token
   */
  public async registerForPushNotifications(): Promise<string | null> {
    try {
      // Request permission first
      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) {
        console.warn('Push notification permission not granted');
        return null;
      }

      // If we already have a token, return it
      if (this.deviceToken) {
        return this.deviceToken;
      }

      // Try to load from AsyncStorage
      const storedToken = await AsyncStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
      if (storedToken) {
        this.deviceToken = storedToken;
        return storedToken;
      }

      // If we don't have a token yet, wait for the onRegister callback
      // This is a bit of a hack, but it works
      return new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
          const token = await AsyncStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
          if (token) {
            clearInterval(checkInterval);
            this.deviceToken = token;
            resolve(token);
          }
        }, 1000);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 10000);
      });
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Schedules a local notification
   * @param notification - The notification to schedule
   * @returns A promise that resolves when the operation is complete
   */
  public async scheduleLocalNotification(notification: SendNotificationRequest): Promise<void> {
    try {
      // Determine the appropriate channel ID based on notification type
      let channelId = CHANNEL_IDS.DEFAULT;
      switch (notification.type) {
        case NotificationType.HEALTH_GOAL:
        case NotificationType.HEALTH_METRIC:
          channelId = CHANNEL_IDS.HEALTH;
          break;
        case NotificationType.APPOINTMENT:
        case NotificationType.MEDICATION:
          channelId = CHANNEL_IDS.CARE;
          break;
        case NotificationType.CLAIM_STATUS:
        case NotificationType.BENEFIT_REMINDER:
          channelId = CHANNEL_IDS.PLAN;
          break;
        case NotificationType.ACHIEVEMENT:
        case NotificationType.LEVEL_UP:
          channelId = CHANNEL_IDS.ACHIEVEMENT;
          break;
      }

      // Convert priority to Android/iOS compatible format
      let priority = 'default';
      switch (notification.priority) {
        case NotificationPriority.LOW:
          priority = 'low';
          break;
        case NotificationPriority.MEDIUM:
          priority = 'default';
          break;
        case NotificationPriority.HIGH:
          priority = 'high';
          break;
        case NotificationPriority.CRITICAL:
          priority = 'max';
          break;
      }

      // Schedule the notification
      PushNotification.localNotification({
        channelId,
        title: notification.title,
        message: notification.body,
        priority,
        userInfo: {
          id: Math.random().toString(36).substring(2, 15),
          userId: notification.userId,
          type: notification.type,
          data: notification.data,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Retrieves notifications for a user
   * @param userId - The ID of the user
   * @returns A promise that resolves to an array of notifications
   */
  public async getNotifications(userId: string): Promise<Notification[]> {
    try {
      // Try to get notifications from AsyncStorage
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
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updatedNotifications));
      
      // Update badge count on app icon
      this.updateBadgeCount();
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
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updatedNotifications));
      
      // Update badge count on app icon
      this.updateBadgeCount();
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
   * Updates the badge count on the app icon
   */
  private async updateBadgeCount(): Promise<void> {
    try {
      // Get all stored notifications
      const storedNotifications = await this.getStoredNotifications();
      
      // Count unread notifications
      const unreadCount = storedNotifications.filter(
        notification => notification.status === NotificationStatus.DELIVERED || 
                        notification.status === NotificationStatus.SENT
      ).length;
      
      // Update badge count
      PushNotification.setApplicationIconBadgeNumber(unreadCount);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }

  /**
   * Gets all stored notifications from AsyncStorage
   * @returns A promise that resolves to an array of notifications
   */
  private async getStoredNotifications(): Promise<Notification[]> {
    try {
      const storedData = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
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
   * Stores a notification in AsyncStorage
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
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(storedNotifications));
      
      // Update badge count
      this.updateBadgeCount();
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Converts a push notification to our Notification format
   * @param pushNotification - The push notification to convert
   * @returns The converted notification
   */
  private convertToAustaNotification(pushNotification: any): Notification {
    // Extract data from the notification
    const { id, userId, type, title, message, data } = pushNotification.data || pushNotification.userInfo || {};
    
    // Create a new notification object
    const notification: Notification = {
      id: id || Math.random().toString(36).substring(2, 15),
      userId: userId || '',
      type: type || NotificationType.SYSTEM,
      title: title || pushNotification.title || '',
      body: message || pushNotification.message || '',
      channel: NotificationChannel.PUSH,
      status: pushNotification.userInteraction ? NotificationStatus.READ : NotificationStatus.DELIVERED,
      priority: NotificationPriority.MEDIUM,
      data: data || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readAt: pushNotification.userInteraction ? new Date().toISOString() : undefined
    };
    
    return notification;
  }
}

// Create and export the singleton instance
const mobileNotificationAdapter = new MobileNotificationAdapter();
export default mobileNotificationAdapter;