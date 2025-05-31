/**
 * Mobile-specific notification adapter for the AUSTA SuperApp
 * 
 * This adapter handles push notifications, local notifications, and notification persistence
 * in React Native. It provides methods for registering device tokens, handling notification
 * permissions, and processing both foreground and background notifications in the mobile environment.
 * 
 * @module @austa/journey-context/adapters/mobile/NotificationAdapter
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { 
  Notification, 
  NotificationChannel, 
  NotificationPriority, 
  NotificationStatus, 
  NotificationType,
  NotificationPreference,
  JourneyNotificationPreference,
  createNotification,
  shouldDeliverThroughChannel
} from '@austa/interfaces/notification';

// Storage keys for notifications and preferences
const STORAGE_KEYS = {
  NOTIFICATIONS: '@austa/notifications',
  DEVICE_TOKEN: '@austa/device_token',
  EXPO_TOKEN: '@austa/expo_token',
  NOTIFICATION_PREFERENCES: '@austa/notification_preferences',
  JOURNEY_PREFERENCES: '@austa/journey_notification_preferences',
};

// Default notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Determine how to handle notifications based on priority
    const priority = notification.request.content.data?.priority as NotificationPriority || NotificationPriority.MEDIUM;
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: priority === NotificationPriority.HIGH || priority === NotificationPriority.CRITICAL,
      shouldSetBadge: true,
      // Priority-based presentation options
      shouldShowBanner: priority !== NotificationPriority.LOW,
      shouldShowList: true,
    };
  },
});

/**
 * Interface for the notification adapter configuration
 */
export interface NotificationAdapterConfig {
  /** User ID for the current user */
  userId: string;
  /** Optional project ID for Expo notifications */
  projectId?: string;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Mobile-specific notification adapter for handling push notifications,
 * local notifications, and notification persistence in React Native.
 */
export class NotificationAdapter {
  private userId: string;
  private projectId?: string;
  private debug: boolean;
  private deviceToken: string | null = null;
  private expoPushToken: string | null = null;
  private notificationReceivedListener: any = null;
  private notificationResponseListener: any = null;
  private tokenRefreshListener: any = null;
  private notificationPermissionStatus: Notifications.PermissionStatus | null = null;
  
  /**
   * Creates a new instance of the NotificationAdapter
   * @param config Configuration options for the adapter
   */
  constructor(config: NotificationAdapterConfig) {
    this.userId = config.userId;
    this.projectId = config.projectId;
    this.debug = config.debug || false;
    
    // Initialize the adapter
    this.initialize();
  }
  
  /**
   * Initializes the notification adapter by loading stored tokens and setting up listeners
   */
  private async initialize(): Promise<void> {
    try {
      // Load stored tokens
      await this.loadStoredTokens();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Log initialization if debug is enabled
      if (this.debug) {
        console.log('[NotificationAdapter] Initialized with user ID:', this.userId);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Initialization error:', error);
    }
  }
  
  /**
   * Loads stored device and Expo tokens from AsyncStorage
   */
  private async loadStoredTokens(): Promise<void> {
    try {
      const deviceToken = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      const expoPushToken = await AsyncStorage.getItem(STORAGE_KEYS.EXPO_TOKEN);
      
      this.deviceToken = deviceToken;
      this.expoPushToken = expoPushToken;
      
      if (this.debug) {
        console.log('[NotificationAdapter] Loaded stored tokens:', { deviceToken, expoPushToken });
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error loading stored tokens:', error);
    }
  }
  
  /**
   * Sets up listeners for notification events
   */
  private setupNotificationListeners(): void {
    // Listen for incoming notifications
    this.notificationReceivedListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived.bind(this)
    );
    
    // Listen for user interaction with notifications
    this.notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    );
    
    // Listen for token refresh events
    this.tokenRefreshListener = Notifications.addPushTokenListener(
      this.handleTokenRefresh.bind(this)
    );
    
    if (this.debug) {
      console.log('[NotificationAdapter] Notification listeners set up');
    }
  }
  
  /**
   * Handles incoming notifications
   * @param notification The received notification
   */
  private async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    try {
      if (this.debug) {
        console.log('[NotificationAdapter] Notification received:', notification);
      }
      
      // Convert Expo notification to our app's notification format
      const appNotification = this.convertExpoNotification(notification);
      
      // Store the notification for offline access
      await this.storeNotification(appNotification);
      
      // Process any actions required by the notification
      await this.processNotificationActions(appNotification);
    } catch (error) {
      console.error('[NotificationAdapter] Error handling received notification:', error);
    }
  }
  
  /**
   * Handles user responses to notifications
   * @param response The notification response
   */
  private async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    try {
      if (this.debug) {
        console.log('[NotificationAdapter] Notification response:', response);
      }
      
      const notification = response.notification;
      const appNotification = this.convertExpoNotification(notification);
      
      // Mark the notification as read
      await this.markNotificationAsRead(appNotification.id);
      
      // Process any actions based on the user's response
      const actionId = response.actionIdentifier;
      if (actionId !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // Handle custom actions
        await this.processNotificationActionResponse(appNotification, actionId);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error handling notification response:', error);
    }
  }
  
  /**
   * Handles token refresh events
   * @param token The new token
   */
  private async handleTokenRefresh(token: Notifications.DevicePushToken | Notifications.ExpoPushToken): Promise<void> {
    try {
      if (this.debug) {
        console.log('[NotificationAdapter] Token refreshed:', token);
      }
      
      // Update the stored token
      if (token.type === 'ios' || token.type === 'android') {
        this.deviceToken = token.data;
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, token.data);
      } else if (token.type === 'expo') {
        this.expoPushToken = token.data;
        await AsyncStorage.setItem(STORAGE_KEYS.EXPO_TOKEN, token.data);
      }
      
      // Register the new token with the backend
      await this.registerTokenWithBackend();
    } catch (error) {
      console.error('[NotificationAdapter] Error handling token refresh:', error);
    }
  }
  
  /**
   * Converts an Expo notification to our app's notification format
   * @param expoNotification The Expo notification to convert
   * @returns The converted notification
   */
  private convertExpoNotification(expoNotification: Notifications.Notification): Notification {
    const { request, date } = expoNotification;
    const { content } = request;
    const { title, body, data } = content;
    
    // Extract notification data from the payload
    const notificationType = data?.type as NotificationType || NotificationType.SYSTEM;
    const notificationPriority = data?.priority as NotificationPriority || NotificationPriority.MEDIUM;
    const notificationId = data?.id as string || request.identifier;
    
    // Create a notification object using our app's format
    return createNotification({
      id: notificationId,
      userId: this.userId,
      type: notificationType,
      title: title || '',
      body: body || '',
      channel: NotificationChannel.PUSH,
      priority: notificationPriority,
      data: data as Record<string, unknown>,
      createdAt: new Date(date),
      updatedAt: new Date(date),
    });
  }
  
  /**
   * Processes any actions required by the notification
   * @param notification The notification to process
   */
  private async processNotificationActions(notification: Notification): Promise<void> {
    // Implementation depends on specific notification types and required actions
    // This is a placeholder for journey-specific notification processing
    switch (notification.type) {
      case NotificationType.ACHIEVEMENT:
        // Process achievement notifications
        break;
      case NotificationType.APPOINTMENT:
        // Process appointment notifications
        break;
      case NotificationType.HEALTH_METRIC:
        // Process health metric notifications
        break;
      case NotificationType.CLAIM_STATUS:
        // Process claim status notifications
        break;
      default:
        // Default processing for other notification types
        break;
    }
  }
  
  /**
   * Processes a user's response to a notification action
   * @param notification The notification that was acted upon
   * @param actionId The identifier of the action that was taken
   */
  private async processNotificationActionResponse(notification: Notification, actionId: string): Promise<void> {
    // Implementation depends on specific notification types and actions
    // This is a placeholder for journey-specific action handling
    if (this.debug) {
      console.log('[NotificationAdapter] Processing action response:', { notification, actionId });
    }
    
    // Handle different actions based on notification type
    switch (notification.type) {
      case NotificationType.APPOINTMENT:
        // Handle appointment actions (confirm, reschedule, cancel)
        break;
      case NotificationType.MEDICATION:
        // Handle medication actions (taken, snooze, skip)
        break;
      case NotificationType.CLAIM_STATUS:
        // Handle claim actions (view, upload, appeal)
        break;
      default:
        // Default handling for other notification types
        break;
    }
  }
  
  /**
   * Registers the device token with the backend
   */
  private async registerTokenWithBackend(): Promise<void> {
    try {
      if (!this.deviceToken && !this.expoPushToken) {
        if (this.debug) {
          console.log('[NotificationAdapter] No tokens available to register with backend');
        }
        return;
      }
      
      // TODO: Implement API call to register token with backend
      // This would typically involve a call to the notification service API
      if (this.debug) {
        console.log('[NotificationAdapter] Registering token with backend:', {
          deviceToken: this.deviceToken,
          expoPushToken: this.expoPushToken,
        });
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error registering token with backend:', error);
    }
  }
  
  /**
   * Requests permission to send notifications to the user
   * @returns The permission status
   */
  public async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        if (this.debug) {
          console.log('[NotificationAdapter] Running on simulator, skipping permission request');
        }
        return false;
      }
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // Only ask for permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      this.notificationPermissionStatus = finalStatus;
      
      if (this.debug) {
        console.log('[NotificationAdapter] Notification permission status:', finalStatus);
      }
      
      return finalStatus === 'granted';
    } catch (error) {
      console.error('[NotificationAdapter] Error requesting notification permission:', error);
      return false;
    }
  }
  
  /**
   * Registers for push notifications and obtains device tokens
   * @returns The Expo push token if successful, null otherwise
   */
  public async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if running on a physical device
      if (!Device.isDevice) {
        if (this.debug) {
          console.log('[NotificationAdapter] Push notifications not supported in simulator');
        }
        return null;
      }
      
      // Request permission if not already granted
      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) {
        if (this.debug) {
          console.log('[NotificationAdapter] Notification permission not granted');
        }
        return null;
      }
      
      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: this.projectId,
      });
      
      // Store the tokens
      this.expoPushToken = tokenData.data;
      await AsyncStorage.setItem(STORAGE_KEYS.EXPO_TOKEN, tokenData.data);
      
      // Get the device push token (iOS or Android)
      const devicePushToken = await Notifications.getDevicePushTokenAsync();
      if (devicePushToken.type === 'ios' || devicePushToken.type === 'android') {
        this.deviceToken = devicePushToken.data;
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, devicePushToken.data);
      }
      
      // Register the tokens with the backend
      await this.registerTokenWithBackend();
      
      if (this.debug) {
        console.log('[NotificationAdapter] Registered for push notifications:', {
          expoPushToken: tokenData.data,
          devicePushToken: devicePushToken.data,
        });
      }
      
      return tokenData.data;
    } catch (error) {
      console.error('[NotificationAdapter] Error registering for push notifications:', error);
      return null;
    }
  }
  
  /**
   * Schedules a local notification to be delivered at a specific time
   * @param notification The notification to schedule
   * @param trigger The trigger for when to show the notification
   * @returns The notification identifier if successful, null otherwise
   */
  public async scheduleLocalNotification(
    notification: Omit<Notification, 'id' | 'status' | 'channel' | 'createdAt' | 'updatedAt'>,
    trigger: Notifications.NotificationTriggerInput = null
  ): Promise<string | null> {
    try {
      // Create the notification content
      const notificationContent: Notifications.NotificationContentInput = {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          type: notification.type,
          priority: notification.priority,
          userId: notification.userId,
        },
      };
      
      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });
      
      if (this.debug) {
        console.log('[NotificationAdapter] Scheduled local notification:', {
          id: notificationId,
          notification,
          trigger,
        });
      }
      
      // Create and store the notification in our local storage
      const appNotification = createNotification({
        ...notification,
        id: notificationId,
        channel: NotificationChannel.IN_APP,
      });
      
      await this.storeNotification(appNotification);
      
      return notificationId;
    } catch (error) {
      console.error('[NotificationAdapter] Error scheduling local notification:', error);
      return null;
    }
  }
  
  /**
   * Cancels a scheduled local notification
   * @param notificationId The ID of the notification to cancel
   */
  public async cancelLocalNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      if (this.debug) {
        console.log('[NotificationAdapter] Cancelled local notification:', notificationId);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error cancelling local notification:', error);
    }
  }
  
  /**
   * Stores a notification in AsyncStorage for offline access
   * @param notification The notification to store
   */
  public async storeNotification(notification: Notification): Promise<void> {
    try {
      // Get existing notifications
      const storedNotifications = await this.getStoredNotifications();
      
      // Check if notification already exists
      const existingIndex = storedNotifications.findIndex(n => n.id === notification.id);
      
      if (existingIndex >= 0) {
        // Update existing notification
        storedNotifications[existingIndex] = {
          ...storedNotifications[existingIndex],
          ...notification,
          updatedAt: new Date(),
        };
      } else {
        // Add new notification
        storedNotifications.push(notification);
      }
      
      // Sort notifications by priority and date
      const sortedNotifications = this.sortNotificationsByPriorityAndDate(storedNotifications);
      
      // Store the updated notifications
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(sortedNotifications));
      
      if (this.debug) {
        console.log('[NotificationAdapter] Stored notification:', notification);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error storing notification:', error);
    }
  }
  
  /**
   * Retrieves all stored notifications from AsyncStorage
   * @returns An array of stored notifications
   */
  public async getStoredNotifications(): Promise<Notification[]> {
    try {
      const notificationsJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      
      if (!notificationsJson) {
        return [];
      }
      
      const notifications = JSON.parse(notificationsJson) as Notification[];
      
      // Convert date strings back to Date objects
      return notifications.map(notification => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
        updatedAt: new Date(notification.updatedAt),
      }));
    } catch (error) {
      console.error('[NotificationAdapter] Error getting stored notifications:', error);
      return [];
    }
  }
  
  /**
   * Sorts notifications by priority (high to low) and date (newest first)
   * @param notifications The notifications to sort
   * @returns The sorted notifications
   */
  private sortNotificationsByPriorityAndDate(notifications: Notification[]): Notification[] {
    return [...notifications].sort((a, b) => {
      // First sort by priority (critical > high > medium > low)
      const priorityOrder = {
        [NotificationPriority.CRITICAL]: 0,
        [NotificationPriority.HIGH]: 1,
        [NotificationPriority.MEDIUM]: 2,
        [NotificationPriority.LOW]: 3,
      };
      
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  /**
   * Marks a notification as read
   * @param notificationId The ID of the notification to mark as read
   */
  public async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // Get existing notifications
      const notifications = await this.getStoredNotifications();
      
      // Find the notification to update
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex >= 0) {
        // Update the notification status
        notifications[notificationIndex] = {
          ...notifications[notificationIndex],
          status: NotificationStatus.READ,
          updatedAt: new Date(),
        };
        
        // Store the updated notifications
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        
        if (this.debug) {
          console.log('[NotificationAdapter] Marked notification as read:', notificationId);
        }
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error marking notification as read:', error);
    }
  }
  
  /**
   * Deletes a notification from storage
   * @param notificationId The ID of the notification to delete
   */
  public async deleteNotification(notificationId: string): Promise<void> {
    try {
      // Get existing notifications
      const notifications = await this.getStoredNotifications();
      
      // Filter out the notification to delete
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      
      // Store the updated notifications
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      
      if (this.debug) {
        console.log('[NotificationAdapter] Deleted notification:', notificationId);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error deleting notification:', error);
    }
  }
  
  /**
   * Gets the notification preferences for the current user
   * @returns The user's notification preferences
   */
  public async getNotificationPreferences(): Promise<NotificationPreference | null> {
    try {
      const preferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
      
      if (!preferencesJson) {
        return null;
      }
      
      const preferences = JSON.parse(preferencesJson) as NotificationPreference;
      
      // Convert date strings back to Date objects
      return {
        ...preferences,
        updatedAt: new Date(preferences.updatedAt),
      };
    } catch (error) {
      console.error('[NotificationAdapter] Error getting notification preferences:', error);
      return null;
    }
  }
  
  /**
   * Saves notification preferences for the current user
   * @param preferences The notification preferences to save
   */
  public async saveNotificationPreferences(preferences: Omit<NotificationPreference, 'updatedAt'>): Promise<void> {
    try {
      const updatedPreferences: NotificationPreference = {
        ...preferences,
        updatedAt: new Date(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, JSON.stringify(updatedPreferences));
      
      if (this.debug) {
        console.log('[NotificationAdapter] Saved notification preferences:', updatedPreferences);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error saving notification preferences:', error);
    }
  }
  
  /**
   * Gets the journey-specific notification preferences for the current user
   * @param journeyId The journey ID
   * @returns The journey-specific notification preferences
   */
  public async getJourneyNotificationPreferences(journeyId: 'health' | 'care' | 'plan'): Promise<JourneyNotificationPreference | null> {
    try {
      const preferencesJson = await AsyncStorage.getItem(`${STORAGE_KEYS.JOURNEY_PREFERENCES}_${journeyId}`);
      
      if (!preferencesJson) {
        return null;
      }
      
      const preferences = JSON.parse(preferencesJson) as JourneyNotificationPreference;
      
      // Convert date strings back to Date objects
      return {
        ...preferences,
        updatedAt: new Date(preferences.updatedAt),
      };
    } catch (error) {
      console.error('[NotificationAdapter] Error getting journey notification preferences:', error);
      return null;
    }
  }
  
  /**
   * Saves journey-specific notification preferences for the current user
   * @param journeyId The journey ID
   * @param preferences The journey-specific notification preferences to save
   */
  public async saveJourneyNotificationPreferences(
    journeyId: 'health' | 'care' | 'plan',
    preferences: Omit<JourneyNotificationPreference, 'userId' | 'journeyId' | 'updatedAt'>
  ): Promise<void> {
    try {
      const updatedPreferences: JourneyNotificationPreference = {
        ...preferences,
        userId: this.userId,
        journeyId,
        updatedAt: new Date(),
      };
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.JOURNEY_PREFERENCES}_${journeyId}`,
        JSON.stringify(updatedPreferences)
      );
      
      if (this.debug) {
        console.log('[NotificationAdapter] Saved journey notification preferences:', {
          journeyId,
          preferences: updatedPreferences,
        });
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error saving journey notification preferences:', error);
    }
  }
  
  /**
   * Gets the badge count for the app icon
   * @returns The current badge count
   */
  public async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('[NotificationAdapter] Error getting badge count:', error);
      return 0;
    }
  }
  
  /**
   * Sets the badge count for the app icon
   * @param count The badge count to set
   */
  public async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      
      if (this.debug) {
        console.log('[NotificationAdapter] Set badge count:', count);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error setting badge count:', error);
    }
  }
  
  /**
   * Gets the last notification response that was received
   * @returns The last notification response
   */
  public async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      console.error('[NotificationAdapter] Error getting last notification response:', error);
      return null;
    }
  }
  
  /**
   * Cleans up the adapter by removing listeners
   */
  public cleanup(): void {
    try {
      // Remove notification listeners
      if (this.notificationReceivedListener) {
        this.notificationReceivedListener.remove();
      }
      
      if (this.notificationResponseListener) {
        this.notificationResponseListener.remove();
      }
      
      if (this.tokenRefreshListener) {
        this.tokenRefreshListener.remove();
      }
      
      if (this.debug) {
        console.log('[NotificationAdapter] Cleaned up notification listeners');
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error cleaning up:', error);
    }
  }
}

/**
 * Creates a notification adapter for the mobile platform
 * @param config Configuration options for the adapter
 * @returns A new NotificationAdapter instance
 */
export function createMobileNotificationAdapter(config: NotificationAdapterConfig): NotificationAdapter {
  return new NotificationAdapter(config);
}

export default NotificationAdapter;