/**
 * Web-specific notification adapter for the AUSTA SuperApp
 * 
 * This adapter handles browser notifications, WebSocket connections for real-time updates,
 * and notification storage in the browser environment. It enables real-time notification
 * delivery and persistence across web sessions.
 * 
 * @module @austa/journey-context/adapters/web/NotificationAdapter
 */

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
  NOTIFICATION_PREFERENCES: '@austa/notification_preferences',
  JOURNEY_PREFERENCES: '@austa/journey_notification_preferences',
  NOTIFICATION_PERMISSION: '@austa/notification_permission',
};

/**
 * Interface for the notification adapter configuration
 */
export interface NotificationAdapterConfig {
  /** User ID for the current user */
  userId: string;
  /** WebSocket endpoint for real-time notifications */
  websocketEndpoint: string;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Web-specific notification adapter for handling browser notifications,
 * WebSocket connections, and notification storage in the browser environment.
 */
export class NotificationAdapter {
  private userId: string;
  private websocketEndpoint: string;
  private debug: boolean;
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 2000; // Start with 2 seconds
  private reconnectTimer: number | null = null;
  private notificationPermission: NotificationPermission | null = null;
  
  /**
   * Creates a new instance of the NotificationAdapter
   * @param config Configuration options for the adapter
   */
  constructor(config: NotificationAdapterConfig) {
    this.userId = config.userId;
    this.websocketEndpoint = config.websocketEndpoint;
    this.debug = config.debug || false;
    
    // Initialize the adapter
    this.initialize();
  }
  
  /**
   * Initializes the notification adapter by checking permissions and setting up WebSocket
   */
  private async initialize(): Promise<void> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        if (this.debug) {
          console.log('[NotificationAdapter] Browser does not support notifications');
        }
        return;
      }
      
      // Load stored notification permission
      await this.loadStoredPermission();
      
      // Connect to WebSocket for real-time updates
      this.connectWebSocket();
      
      // Log initialization if debug is enabled
      if (this.debug) {
        console.log('[NotificationAdapter] Initialized with user ID:', this.userId);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Initialization error:', error);
    }
  }
  
  /**
   * Loads the stored notification permission from localStorage
   */
  private async loadStoredPermission(): Promise<void> {
    try {
      const storedPermission = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PERMISSION);
      
      if (storedPermission) {
        this.notificationPermission = storedPermission as NotificationPermission;
      } else {
        // Get the current permission state
        this.notificationPermission = Notification.permission;
        localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION, this.notificationPermission);
      }
      
      if (this.debug) {
        console.log('[NotificationAdapter] Loaded notification permission:', this.notificationPermission);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error loading stored permission:', error);
    }
  }
  
  /**
   * Connects to the WebSocket server for real-time notifications
   */
  private connectWebSocket(): void {
    try {
      // Close existing connection if any
      if (this.websocket) {
        this.websocket.close();
      }
      
      // Create a new WebSocket connection with the user ID
      const wsUrl = `${this.websocketEndpoint}?userId=${this.userId}`;
      this.websocket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.websocket.onopen = this.handleWebSocketOpen.bind(this);
      this.websocket.onmessage = this.handleWebSocketMessage.bind(this);
      this.websocket.onclose = this.handleWebSocketClose.bind(this);
      this.websocket.onerror = this.handleWebSocketError.bind(this);
      
      if (this.debug) {
        console.log('[NotificationAdapter] Connecting to WebSocket:', wsUrl);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error connecting to WebSocket:', error);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handles WebSocket open event
   */
  private handleWebSocketOpen(event: Event): void {
    // Reset reconnect attempts on successful connection
    this.reconnectAttempts = 0;
    
    if (this.debug) {
      console.log('[NotificationAdapter] WebSocket connection opened');
    }
  }
  
  /**
   * Handles WebSocket message event
   * @param event The message event
   */
  private async handleWebSocketMessage(event: MessageEvent): Promise<void> {
    try {
      if (this.debug) {
        console.log('[NotificationAdapter] WebSocket message received:', event.data);
      }
      
      // Parse the message data
      const data = JSON.parse(event.data);
      
      // Handle different message types
      switch (data.type) {
        case 'notification':
          // Process the notification
          await this.processNotification(data.notification);
          break;
        case 'read_status':
          // Update read status for a notification
          await this.updateNotificationReadStatus(data.notificationId, data.status);
          break;
        default:
          if (this.debug) {
            console.log('[NotificationAdapter] Unknown message type:', data.type);
          }
          break;
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error handling WebSocket message:', error);
    }
  }
  
  /**
   * Handles WebSocket close event
   * @param event The close event
   */
  private handleWebSocketClose(event: CloseEvent): void {
    if (this.debug) {
      console.log('[NotificationAdapter] WebSocket connection closed:', event.code, event.reason);
    }
    
    // Attempt to reconnect if the close was unexpected
    if (event.code !== 1000) { // 1000 is normal closure
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handles WebSocket error event
   * @param event The error event
   */
  private handleWebSocketError(event: Event): void {
    console.error('[NotificationAdapter] WebSocket error:', event);
    
    // The WebSocket will automatically close after an error
    // The close handler will schedule a reconnect
  }
  
  /**
   * Schedules a reconnect attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    // Clear any existing reconnect timer
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Check if we've exceeded the maximum number of attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.debug) {
        console.log('[NotificationAdapter] Maximum reconnect attempts reached');
      }
      return;
    }
    
    // Increment the reconnect attempts
    this.reconnectAttempts++;
    
    // Calculate the backoff time with exponential increase
    const backoff = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1);
    
    if (this.debug) {
      console.log(`[NotificationAdapter] Scheduling reconnect in ${backoff}ms (attempt ${this.reconnectAttempts})`);
    }
    
    // Schedule the reconnect
    this.reconnectTimer = window.setTimeout(() => {
      if (this.debug) {
        console.log('[NotificationAdapter] Attempting to reconnect...');
      }
      this.connectWebSocket();
    }, backoff);
  }
  
  /**
   * Processes a notification received from the WebSocket
   * @param notificationData The notification data
   */
  private async processNotification(notificationData: any): Promise<void> {
    try {
      // Create a notification object
      const notification = createNotification({
        id: notificationData.id,
        userId: this.userId,
        type: notificationData.type as NotificationType,
        title: notificationData.title,
        body: notificationData.body,
        channel: NotificationChannel.IN_APP,
        priority: notificationData.priority as NotificationPriority,
        data: notificationData.data,
      });
      
      // Store the notification
      await this.storeNotification(notification);
      
      // Show browser notification if appropriate
      if (shouldDeliverThroughChannel(notification, NotificationChannel.PUSH) && 
          this.notificationPermission === 'granted') {
        this.showBrowserNotification(notification);
      }
      
      // Process any actions required by the notification
      await this.processNotificationActions(notification);
    } catch (error) {
      console.error('[NotificationAdapter] Error processing notification:', error);
    }
  }
  
  /**
   * Updates the read status of a notification
   * @param notificationId The ID of the notification to update
   * @param status The new status
   */
  private async updateNotificationReadStatus(notificationId: string, status: NotificationStatus): Promise<void> {
    try {
      // Get existing notifications
      const notifications = await this.getStoredNotifications();
      
      // Find the notification to update
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex >= 0) {
        // Update the notification status
        notifications[notificationIndex] = {
          ...notifications[notificationIndex],
          status,
          updatedAt: new Date(),
        };
        
        // Store the updated notifications
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        
        if (this.debug) {
          console.log(`[NotificationAdapter] Updated notification ${notificationId} status to ${status}`);
        }
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error updating notification status:', error);
    }
  }
  
  /**
   * Shows a browser notification using the Notifications API
   * @param notification The notification to show
   */
  private showBrowserNotification(notification: Notification): void {
    try {
      // Check if browser notifications are supported and permission is granted
      if (!('Notification' in window) || this.notificationPermission !== 'granted') {
        return;
      }
      
      // Create options for the browser notification
      const options: NotificationOptions = {
        body: notification.body,
        icon: '/icons/notification-icon.png', // Default icon
        tag: notification.id, // Use the notification ID as the tag to prevent duplicates
        data: notification,
      };
      
      // Add journey-specific icon if available
      if (notification.data?.journeyContext) {
        const journey = notification.data.journeyContext as string;
        options.icon = `/icons/${journey}-notification-icon.png`;
      }
      
      // Add actions if available
      if (notification.data?.actions) {
        options.actions = (notification.data.actions as any[]).map(action => ({
          action: action.type,
          title: action.label,
        }));
      }
      
      // Create and show the browser notification
      const browserNotification = new window.Notification(notification.title, options);
      
      // Add event listeners
      browserNotification.onclick = (event) => this.handleBrowserNotificationClick(event, notification);
      browserNotification.onclose = () => {
        if (this.debug) {
          console.log('[NotificationAdapter] Browser notification closed:', notification.id);
        }
      };
      
      if (this.debug) {
        console.log('[NotificationAdapter] Showed browser notification:', notification.id);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error showing browser notification:', error);
    }
  }
  
  /**
   * Handles a click on a browser notification
   * @param event The click event
   * @param notification The notification that was clicked
   */
  private async handleBrowserNotificationClick(event: Event, notification: Notification): Promise<void> {
    try {
      // Mark the notification as read
      await this.markNotificationAsRead(notification.id);
      
      // Get the action that was clicked (if any)
      const action = (event as any).action;
      
      if (action) {
        // Handle specific actions
        await this.processNotificationAction(notification, action);
      } else {
        // Default action: navigate to the appropriate page
        this.navigateToNotificationDestination(notification);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error handling notification click:', error);
    }
  }
  
  /**
   * Processes a notification action
   * @param notification The notification
   * @param action The action to process
   */
  private async processNotificationAction(notification: Notification, action: string): Promise<void> {
    // Implementation depends on specific notification types and actions
    if (this.debug) {
      console.log('[NotificationAdapter] Processing action:', { notification, action });
    }
    
    // Handle different actions based on notification type
    switch (notification.type) {
      case NotificationType.APPOINTMENT:
        // Handle appointment actions (confirm, reschedule, cancel)
        this.handleAppointmentAction(notification, action);
        break;
      case NotificationType.MEDICATION:
        // Handle medication actions (taken, snooze, skip)
        this.handleMedicationAction(notification, action);
        break;
      case NotificationType.CLAIM_STATUS:
        // Handle claim actions (view, upload, appeal)
        this.handleClaimAction(notification, action);
        break;
      default:
        // Default handling for other notification types
        this.navigateToNotificationDestination(notification);
        break;
    }
  }
  
  /**
   * Handles appointment-specific actions
   * @param notification The appointment notification
   * @param action The action to handle
   */
  private handleAppointmentAction(notification: Notification, action: string): void {
    // Get the appointment data
    const appointmentData = notification.data;
    
    // Handle different appointment actions
    switch (action) {
      case 'confirm':
        // Navigate to appointment confirmation page
        window.location.href = `/care/appointments/${appointmentData?.appointmentId}/confirm`;
        break;
      case 'reschedule':
        // Navigate to appointment reschedule page
        window.location.href = `/care/appointments/${appointmentData?.appointmentId}/reschedule`;
        break;
      case 'cancel':
        // Navigate to appointment cancellation page
        window.location.href = `/care/appointments/${appointmentData?.appointmentId}/cancel`;
        break;
      case 'join':
        // Navigate to telemedicine session
        if (appointmentData?.connectionDetails?.url) {
          window.open(appointmentData.connectionDetails.url, '_blank');
        }
        break;
      default:
        // Default: navigate to appointment details
        window.location.href = `/care/appointments/${appointmentData?.appointmentId}`;
        break;
    }
  }
  
  /**
   * Handles medication-specific actions
   * @param notification The medication notification
   * @param action The action to handle
   */
  private handleMedicationAction(notification: Notification, action: string): void {
    // Get the medication data
    const medicationData = notification.data;
    
    // Handle different medication actions
    switch (action) {
      case 'taken':
        // Mark medication as taken
        window.location.href = `/care/medications/${medicationData?.medicationId}/taken`;
        break;
      case 'snooze':
        // Snooze the medication reminder
        window.location.href = `/care/medications/${medicationData?.medicationId}/snooze`;
        break;
      case 'skip':
        // Skip the medication dose
        window.location.href = `/care/medications/${medicationData?.medicationId}/skip`;
        break;
      default:
        // Default: navigate to medication details
        window.location.href = `/care/medications/${medicationData?.medicationId}`;
        break;
    }
  }
  
  /**
   * Handles claim-specific actions
   * @param notification The claim notification
   * @param action The action to handle
   */
  private handleClaimAction(notification: Notification, action: string): void {
    // Get the claim data
    const claimData = notification.data;
    
    // Handle different claim actions
    switch (action) {
      case 'view':
        // Navigate to claim details
        window.location.href = `/plan/claims/${claimData?.claimId}`;
        break;
      case 'upload':
        // Navigate to document upload page
        window.location.href = `/plan/claims/${claimData?.claimId}/upload`;
        break;
      case 'appeal':
        // Navigate to appeal form
        window.location.href = `/plan/claims/${claimData?.claimId}/appeal`;
        break;
      case 'contact':
        // Navigate to contact support page
        window.location.href = '/plan/support';
        break;
      default:
        // Default: navigate to claim details
        window.location.href = `/plan/claims/${claimData?.claimId}`;
        break;
    }
  }
  
  /**
   * Navigates to the appropriate destination for a notification
   * @param notification The notification to navigate to
   */
  private navigateToNotificationDestination(notification: Notification): void {
    // Determine the destination based on notification type
    switch (notification.type) {
      case NotificationType.ACHIEVEMENT:
        window.location.href = '/achievements';
        break;
      case NotificationType.LEVEL_UP:
        window.location.href = '/profile';
        break;
      case NotificationType.APPOINTMENT:
        window.location.href = `/care/appointments/${notification.data?.appointmentId}`;
        break;
      case NotificationType.MEDICATION:
        window.location.href = `/care/medications/${notification.data?.medicationId}`;
        break;
      case NotificationType.HEALTH_GOAL:
        window.location.href = `/health/goals/${notification.data?.goalId}`;
        break;
      case NotificationType.HEALTH_METRIC:
        window.location.href = `/health/metrics/${notification.data?.metricId}`;
        break;
      case NotificationType.CLAIM_STATUS:
        window.location.href = `/plan/claims/${notification.data?.claimId}`;
        break;
      case NotificationType.BENEFIT_UPDATE:
        window.location.href = `/plan/benefits/${notification.data?.benefitId}`;
        break;
      case NotificationType.FEATURE_UPDATE:
        window.location.href = '/whats-new';
        break;
      case NotificationType.SYSTEM:
      default:
        window.location.href = '/notifications';
        break;
    }
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
   * Requests permission to show browser notifications
   * @returns A promise that resolves to true if permission is granted, false otherwise
   */
  public async requestNotificationPermission(): Promise<boolean> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        if (this.debug) {
          console.log('[NotificationAdapter] Browser does not support notifications');
        }
        return false;
      }
      
      // Request permission
      const permission = await window.Notification.requestPermission();
      
      // Store the permission
      this.notificationPermission = permission;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION, permission);
      
      if (this.debug) {
        console.log('[NotificationAdapter] Notification permission:', permission);
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('[NotificationAdapter] Error requesting notification permission:', error);
      return false;
    }
  }
  
  /**
   * Checks if browser notifications are supported
   * @returns True if browser notifications are supported, false otherwise
   */
  public isNotificationSupported(): boolean {
    return 'Notification' in window;
  }
  
  /**
   * Gets the current notification permission status
   * @returns The current notification permission status
   */
  public getNotificationPermission(): NotificationPermission | null {
    return this.notificationPermission;
  }
  
  /**
   * Stores a notification in localStorage for offline access
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
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(sortedNotifications));
      
      if (this.debug) {
        console.log('[NotificationAdapter] Stored notification:', notification);
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error storing notification:', error);
    }
  }
  
  /**
   * Retrieves all stored notifications from localStorage
   * @returns An array of stored notifications
   */
  public async getStoredNotifications(): Promise<Notification[]> {
    try {
      const notificationsJson = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      
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
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        
        // Send read status to server via WebSocket if connected
        this.sendReadStatusToServer(notificationId);
        
        if (this.debug) {
          console.log('[NotificationAdapter] Marked notification as read:', notificationId);
        }
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error marking notification as read:', error);
    }
  }
  
  /**
   * Sends read status to the server via WebSocket
   * @param notificationId The ID of the notification that was read
   */
  private sendReadStatusToServer(notificationId: string): void {
    try {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
          type: 'read_status',
          notificationId,
          userId: this.userId,
        });
        
        this.websocket.send(message);
        
        if (this.debug) {
          console.log('[NotificationAdapter] Sent read status to server:', notificationId);
        }
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error sending read status to server:', error);
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
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      
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
      const preferencesJson = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
      
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
      
      localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, JSON.stringify(updatedPreferences));
      
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
      const preferencesJson = localStorage.getItem(`${STORAGE_KEYS.JOURNEY_PREFERENCES}_${journeyId}`);
      
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
      
      localStorage.setItem(
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
   * Gets the count of unread notifications
   * @returns The count of unread notifications
   */
  public async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getStoredNotifications();
      return notifications.filter(n => n.status !== NotificationStatus.READ).length;
    } catch (error) {
      console.error('[NotificationAdapter] Error getting unread count:', error);
      return 0;
    }
  }
  
  /**
   * Sends a ping message to the WebSocket server to keep the connection alive
   */
  public sendPing(): void {
    try {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({ type: 'ping' });
        this.websocket.send(message);
        
        if (this.debug) {
          console.log('[NotificationAdapter] Sent ping to server');
        }
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error sending ping:', error);
    }
  }
  
  /**
   * Cleans up the adapter by closing the WebSocket connection
   */
  public cleanup(): void {
    try {
      // Clear any reconnect timer
      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Close the WebSocket connection
      if (this.websocket) {
        this.websocket.close(1000, 'Cleanup');
        this.websocket = null;
      }
      
      if (this.debug) {
        console.log('[NotificationAdapter] Cleaned up resources');
      }
    } catch (error) {
      console.error('[NotificationAdapter] Error cleaning up:', error);
    }
  }
}

/**
 * Creates a notification adapter for the web platform
 * @param config Configuration options for the adapter
 * @returns A new NotificationAdapter instance
 */
export function createWebNotificationAdapter(config: NotificationAdapterConfig): NotificationAdapter {
  return new NotificationAdapter(config);
}

export default NotificationAdapter;